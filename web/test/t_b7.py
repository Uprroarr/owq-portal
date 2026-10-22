"""v123: no inactivity sign-out while on the Sales Floor."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8871;SITE=os.environ.get('SITE',SP+'/web/test/site_b7');URL='http://127.0.0.1:%d/index.html'%PORT
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:500]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  ctx=b.new_context(viewport={'width':1280,'height':900});ctx.add_init_script("try{localStorage.setItem('owq_gq','auto')}catch(e){};window.__SAY=0;try{const s=window.speechSynthesis;if(s){s.speak=function(){window.__SAY++}}}catch(e){}")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2,60000);A.wait_for_timeout(1000)
  A.evaluate("VC.on=1;acIn();FL.last=Date.now()-11*60000;LASTACT=Date.now()-2*3600000")
  A.wait_for_timeout(7000)
  ok(A.evaluate("ONLINE")==1,'on the Sales Floor: 11 idle minutes do not sign you out')
  ok(A.evaluate("!!openShift(acWho())"),'and the floor shift keeps running')
  ok(A.evaluate("!document.getElementById('idlew').classList.contains('on')"),'no idle warning on the floor')
  A.evaluate("VC.on=0");A.wait_for_timeout(1500);A.evaluate("FL.last=Date.now()-11*60000");A.wait_for_timeout(7000)
  ok(A.evaluate("ONLINE")==0,'off the floor the 10 minute sign-out still works')
  ok(not errs,'no page errors',errs)
  b.close()
finally:
 srv.kill()
print('%d/%d'%(sum(res),len(res)))
