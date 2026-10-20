"""Install as an app: manifest passes Chrome's installability check, the portal shows an Install button that triggers the
browser's install prompt, falls back to steps, can be hidden for a week, never shows on guest links; install.html; the
service worker serves the last copy offline."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
from playwright.sync_api import sync_playwright
PORT=8853;SITE=os.environ.get('SITE',SP+'/web/test/site_inst');BASE='http://127.0.0.1:%d/'%PORT
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:500]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
FAKE_BIP="""(()=>{const e=new Event('beforeinstallprompt');window.__P=0;e.prompt=()=>{window.__P++};e.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(e)})()"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  ctx=b.new_context(viewport={'width':1280,'height':900});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}");errs=[]
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
  A.goto(BASE+'index.html');A.wait_for_timeout(3000)
  cdp=ctx.new_cdp_session(A)
  m=cdp.send('Page.getAppManifest');ok(not m.get('errors') and 'OWQ Station' in (m.get('data') or ''),'manifest loads without errors',m.get('errors'))
  ie=cdp.send('Page.getInstallabilityErrors');ok(all(x.get('errorId')=='in-incognito' for x in ie.get('installabilityErrors',[])),'Chrome says the portal is installable (only the test window being private is flagged)',ie)
  ok(A.locator('.owqin').count()==0,'no install button before the browser offers it (Chrome)')
  A.evaluate(FAKE_BIP);A.wait_for_timeout(300)
  ok(A.locator('.owqin').count()==1 and 'INSTALL THE APP' in A.inner_text('.owqin').upper(),'Install the app button appears')
  A.screenshot(path=SP+'/web/test/shots/inst_chip.png')
  A.click('.owqin .go');A.wait_for_timeout(400)
  ok(A.evaluate("window.__P")==1,'clicking it opens the browser install prompt')
  ok(A.locator('.owqin').count()==0,'button goes away once installed')
  A.evaluate("OWQ_INSTALL()");A.wait_for_timeout(300)
  t=A.inner_text('#owqinm') if A.locator('#owqinm .owqin-m').count() else ''
  ok('INSTALL OWQ STATION' in t.upper() and A.is_visible('#owqinm li'),'without the prompt it shows install steps, above the sign-in screen',t[:300])
  A.screenshot(path=SP+'/web/test/shots/inst_steps.png');A.click('#owqinm .ok')
  A.evaluate(FAKE_BIP);A.wait_for_timeout(200);A.click('.owqin .x');A.reload();A.wait_for_timeout(2500);A.evaluate(FAKE_BIP);A.wait_for_timeout(300)
  ok(A.locator('.owqin').count()==0,'hidden for a week after closing it')
  A.evaluate("localStorage.removeItem('owq_inst_x')")
  gid=list(json.load(open('/home/claude/owq-src/web/src/guests.json')).keys())[0]
  G=ctx.new_page();G.on('pageerror',lambda e:errs.append('guest '+str(e)[:200]));G.goto(BASE+'index.html?guest='+gid);G.wait_for_timeout(3000);G.evaluate(FAKE_BIP);G.wait_for_timeout(300)
  ok(G.locator('.owqin').count()==0,'never on a guest link')
  # install page
  I=ctx.new_page();I.on('pageerror',lambda e:errs.append('install '+str(e)[:200]));I.goto(BASE+'install.html');I.wait_for_timeout(500)
  ok('INSTALL' in I.inner_text('h1').upper(),'install page renders')
  I.evaluate(FAKE_BIP);I.wait_for_timeout(200)
  ok(I.evaluate("!document.getElementById('go').disabled"),'install page button turns on when the browser allows it')
  I.click('#go');I.wait_for_timeout(300);ok(I.evaluate("window.__P")==1 and I.is_visible('#done'),'install page button installs')
  I.screenshot(path=SP+'/web/test/shots/inst_page.png',full_page=True)
  M=b.new_context(viewport={'width':390,'height':844},user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1').new_page()
  M.goto(BASE+'install.html');M.wait_for_timeout(3000)
  ok(M.evaluate("document.documentElement.scrollWidth<=innerWidth+1"),'install page fits a phone')
  ok('ADD TO HOME SCREEN' in M.inner_text('#go').upper() and M.evaluate("document.querySelector('.c.on').dataset.k")=='ios','iPhone gets the Safari steps first')
  M.screenshot(path=SP+'/web/test/shots/inst_phone.png',full_page=True)
  # service worker offline copy (localhost counts as secure)
  S=ctx.new_page();S.goto(BASE+'install.html');S.evaluate("navigator.serviceWorker.register('sw.js').then(()=>navigator.serviceWorker.ready)");S.wait_for_timeout(6000)
  ctx.set_offline(True);S2=ctx.new_page()
  try:S2.goto(BASE+'index.html',timeout=15000);off=S2.evaluate("document.title")
  except Exception as e:off='ERR '+str(e)[:100]
  ok('Only Winners' in off,'opens offline from the last saved copy',off)
  ctx.set_offline(False)
  ok(not [e for e in errs if 'guest' not in e or 'pfCanSee' in e],'no page errors',errs)
  b.close()
finally:srv.terminate()
print('%d/%d'%(sum(res),len(res)))
