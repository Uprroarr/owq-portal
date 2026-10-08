"""Toss-out-the-window emote in the 3D office (software WebGL): the picker lists the demo crowd, a toss runs end to end
(lift, flight, glass, parachute, walk back in) without errors; screenshots along the way."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8799;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots';os.makedirs(OUT,exist_ok=True)
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:400]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1280,'height':760},permissions=['microphone','camera'])
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still');localStorage.setItem('owq_vo',JSON.stringify({list:0,demo:0,ava:'',auto:1,sfx:1}))}catch(e){}")
  errs=[];warn=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]));A.on('console',lambda m:warn.append(m.text[:200]) if 'VO3' in m.text else None)
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(800)
  A.evaluate("openTab('Team Chat');CH.ch='__voice';go()");A.wait_for_timeout(3000)
  ok(A.evaluate("voOffice()"),'3D office is on')
  A.evaluate("vcJoin()");A.wait_for_timeout(2000);A.evaluate("voDemo(1)");A.wait_for_timeout(500);A.evaluate("VO3.dbg().fast=true")
  ok(A.wait_for_function("VO3.targets().filter(x=>x.ok).length>=3",timeout=90000) is not None,'demo crowd is seated')
  A.click(".vob[aria-label='Emotes']");A.wait_for_timeout(700)
  ok(A.locator('.voem-t').count()==1,'Emotes panel has the toss button')
  A.click('.voem-t');A.wait_for_timeout(900)
  n=A.locator('.votg button:not([disabled])').count();ok(n>=3,'the picker lists teammates who are at their desks (%d)'%n)
  A.screenshot(path=OUT+'/toss_picker.png')
  who=A.evaluate("VOX.tl[0].nm");A.click('.votg button:not([disabled]) >> nth=0')
  t0=time.time();shots=[(0.35,'lift'),(1.0,'flight'),(1.55,'smash'),(2.3,'chute'),(4.2,'drift')]
  for at,tag in shots:
      while time.time()-t0<at:A.wait_for_timeout(50)
      A.screenshot(path=OUT+'/toss_%s.png'%tag)
  st=A.evaluate("(()=>{const O=VO3.dbg();let x=null;O.av.forEach(a=>{if(a.toss)x={mode:a.mode,chute:!!a.toss.chute,hit:!!a.toss.hit}});return{x,cracks:(O.cracks||[]).length}})()")
  ok(st['x'] and st['x']['hit'] and st['x']['chute'],'the toss went through the glass and the parachute opened',st)
  ok(st['cracks']>=1,'cracked glass shows in the window',st)
  ok(A.wait_for_function("(()=>{const O=VO3.dbg();let busy=0;O.av.forEach(a=>{if(a.toss)busy=1});return !busy})()",timeout=20000) is not None,'the flight ends')
  ok(A.wait_for_function("(n=>{const O=VO3.dbg();let back=0;O.av.forEach(a=>{if(a.nm===n&&a.root.visible&&(a.mode==='walk'||a.mode==='sitting'||a.mode==='seated'))back=1});return back})(%s)"%json.dumps(who),timeout=20000) is not None,'they walk back in from the elevator')
  A.wait_for_timeout(1500);A.screenshot(path=OUT+'/toss_back.png')
  ok(A.wait_for_function("(n=>{const O=VO3.dbg();let s=0;O.av.forEach(a=>{if(a.nm===n&&a.mode==='seated')s=1});return s})(%s)"%json.dumps(who),timeout=40000) is not None,'and sit back down at their desk')
  ok(not errs,'no page errors',errs)
  ok(not [w for w in warn if 'frame' in w],'no 3D frame errors',warn)
  b.close()
finally:
  srv.terminate()
print('RESULT',sum(res),'/',len(res))
