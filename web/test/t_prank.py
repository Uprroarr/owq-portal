"""Prank: Austin sees the uncloseable Sales Floor Premium pop-up; Cole does not."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8834;SITE=os.environ.get('SITE',SP+'/web/test/site_ln');URL='http://127.0.0.1:%d/index.html'%PORT
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:300]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  ctx=b.new_context(viewport={'width':1280,'height':860});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(1200)
  A.evaluate("openTab('Team Chat');CH.ch='__voice';go()");A.wait_for_timeout(1500)
  ok(not A.evaluate("!!document.getElementById('prk')"),'Cole does not get the pop-up')
  # pretend to be Austin on this device
  A.evaluate("WHO='Austin Vardzel';openTab('Command Deck')");A.wait_for_timeout(1200)
  ok(not A.evaluate("!!document.getElementById('prk')"),'Austin is fine on other pages')
  A.evaluate("openTab('Team Chat');CH.ch='__voice';go()");A.wait_for_timeout(1500)
  ok(A.evaluate("!!document.getElementById('prk')"),'Austin opening the Sales Floor gets the Premium pop-up')
  ok(A.evaluate("document.querySelectorAll('#prk input,#prk form').length")==0,'no payment fields at all')
  A.screenshot(path=SP+'/web/test/shots/prank1.png')
  A.keyboard.press('Escape');A.wait_for_timeout(400);ok(A.evaluate("!!document.getElementById('prk')"),'Escape does not close it')
  A.mouse.click(30,30);A.wait_for_timeout(400);ok(A.evaluate("!!document.getElementById('prk')") and A.evaluate("tab")=='Team Chat','clicking outside does nothing (sidebar is covered)')
  A.click('#prk .prkn');A.wait_for_timeout(500);ok('required to continue' in A.inner_text('#prk'),'No thanks just says Premium is required')
  A.click('#prk .prky');A.wait_for_timeout(3200);t=A.inner_text('#prk');ok('PENDING APPROVAL' in t.upper(),'Subscribe ends on a never-ending "pending approval"',t[:200])
  A.screenshot(path=SP+'/web/test/shots/prank2.png')
  A.evaluate("vcJoin()");A.wait_for_timeout(800);ok(not A.evaluate("VC.on"),'he cannot join the floor behind it')
  A.evaluate("PRK.on=false");A.wait_for_timeout(1000);ok(not A.evaluate("!!document.getElementById('prk')"),'switching it off removes it')
  ok(not errs,'no page errors',errs)
  b.close()
finally:srv.terminate()
print('%d/%d'%(sum(res),len(res)))
