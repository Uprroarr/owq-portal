"""Sidebar sections fold/unfold, collapse all / expand all, remembered."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8832;SITE=os.environ.get('SITE',SP+'/web/test/site_ln');URL='http://127.0.0.1:%d/index.html'%PORT
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:400]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
VIS="g=>{const w=[...document.querySelectorAll('#nav .ngw')].find(x=>x.querySelector('.ngb span').textContent===g);return w?[...w.querySelectorAll('.ngi > .nv')].filter(b=>b.offsetParent!==null).length:-1}"
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  ctx=b.new_context(viewport={'width':1280,'height':900});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear();localStorage.removeItem('owq_navc')");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(1200);A.evaluate("openTab('Command Deck')");A.wait_for_timeout(500)
  gs=A.evaluate("[...document.querySelectorAll('#nav .ngb span')].map(s=>s.textContent)");ok(gs==['COMMAND','SALES','TEAM','BUSINESS','LEARN','SYSTEM'],'all six section headers are toggles',gs)
  ok(A.evaluate(VIS,'TEAM')==5,'TEAM starts open (5 pages)',A.evaluate(VIS,'TEAM'))
  A.click("#nav .ngb:has-text('TEAM')");A.wait_for_timeout(300)
  ok(A.evaluate(VIS,'TEAM')==0,'clicking TEAM folds it up')
  A.click("#nav .ngb:has-text('TEAM')");A.wait_for_timeout(300)
  ok(A.evaluate(VIS,'TEAM')==5,'clicking again brings the pages back')
  A.click("#nav .nga");A.wait_for_timeout(300)
  ok(all(A.evaluate(VIS,g)==0 for g in gs),'collapse all folds every section')
  A.screenshot(path=SP+'/web/test/shots/navc_all.png')
  ok(A.evaluate("!!document.querySelector('#nav .ngw.col .ngd')"),'the folded section with the current page shows a red dot')
  A.reload();A.wait_for_function("OWQC.phase==='in'",timeout=30000);lgx.login(A,2);A.wait_for_timeout(1500)
  ok(all(A.evaluate(VIS,g)==0 for g in gs),'remembered after a reload')
  A.click("#nav .nga");A.wait_for_timeout(300)
  ok(all(A.evaluate(VIS,g)>0 for g in gs),'expand all opens everything again')
  A.click("#nav .ngb:has-text('SALES')");A.wait_for_timeout(200);A.evaluate("openTab('Business Performance','Expenses')");A.wait_for_timeout(600)
  ok(A.evaluate(VIS,'SALES')==0 and A.locator('#nav .nsubs .nsb').count()>=5,'navigating keeps folded sections folded; sub-pages still work',A.locator('#nav .nsubs .nsb').count())
  A.screenshot(path=SP+'/web/test/shots/navc_mix.png')
  ok(not errs,'no page errors',errs)
  b.close()
finally:srv.terminate()
print('%d/%d'%(sum(res),len(res)))
