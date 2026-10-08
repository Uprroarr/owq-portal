"""Learning Network reminder pop-up: only Ayman gets it; everyone else (Cole, John...) never does."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8816;SITE=os.environ.get('SITE',SP+'/web/test/site_ln');URL='http://127.0.0.1:%d/index.html'%PORT
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:300]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  ctx=b.new_context(viewport={'width':1280,'height':800});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(1000)
  # pretend whoever is signed in has been on the clock for 45 minutes with training unfinished
  A.evaluate("(()=>{const now=Date.now();['Cole Leckey','Austin Vardzel','Nate Johnson','John Montini','RJ Noullet','Ayman'].forEach((w,i)=>{D.shifts=(D.shifts||[]).filter(s=>s.ag!==w);D.shifts.push({id:'tln'+i,ag:w,start:now-2700000,end:null,last:now})});openTab('Command Deck')})()")
  print('live',A.evaluate("['Cole Leckey','Ayman'].map(w=>!!openShift(w))"))
  def check(who):
      A.evaluate("w=>{WHO=w;LNAG.snz=0;document.querySelectorAll('#lnn,#ckn').forEach(e=>e.remove());lnNagCheck()}",who);A.wait_for_timeout(300)
      return A.evaluate("!!document.getElementById('lnn')")
  for w in ['Cole Leckey','Austin Vardzel','Nate Johnson','John Montini','RJ Noullet']:
      ok(not check(w),'no training reminder for '+w)
  ok(check('Ayman'),'Ayman still gets the training reminder')
  A.screenshot(path=SP+'/web/test/shots/lnag_ayman.png')
  A.evaluate("WHO='Cole Leckey';lnNagCheck()");A.wait_for_timeout(300)
  ok(not A.evaluate("!!document.getElementById('lnn')"),'a reminder already on screen closes for anyone else')
  ok(not errs,'no page errors',errs)
  b.close()
finally:srv.terminate()
print('%d/%d'%(sum(res),len(res)))
