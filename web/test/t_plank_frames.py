"""Walk the plank, frame by frame (virtual clock): the owner walks to the window, the plank goes out through the glass, the walk,
the bounce, the jump, the parachute, the walk back in. Checks the state machine, saves frames."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8804;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots'
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']
IDX=int(os.environ.get('IDX','2'))
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:300]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1280,'height':760},permissions=['microphone','camera'])
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still');localStorage.setItem('owq_vo',JSON.stringify({list:0,demo:0,ava:'',auto:1,sfx:1}))}catch(e){}")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,IDX);A.wait_for_timeout(800)
  A.evaluate("openTab('Team Chat');CH.ch='__voice';go()");A.wait_for_timeout(3000)
  A.evaluate("vcJoin()");A.wait_for_timeout(2000);A.evaluate("voDemo(1)");A.wait_for_timeout(500);A.evaluate("VO3.dbg().fast=true")
  A.wait_for_function("(()=>{const m=VO3.dbg().meAv;return m&&m.mode==='seated'&&VO3.targets().filter(x=>x.ok).length>=4})()",timeout=150000)
  A.click(".vob[aria-label='Emotes']");A.wait_for_timeout(600)
  ok(A.locator(".voem-t:has-text('WALK THE PLANK')").count()==1,'the Emotes panel has Walk the plank')
  A.screenshot(path=OUT+'/plank_panel.png')
  A.evaluate("(()=>{window.__vt=performance.now();performance.now=()=>window.__vt})()")
  step="n=>new Promise(r=>{let k=0;const f=()=>{if(k++>=n)return r();window.__vt+=200;requestAnimationFrame(()=>requestAnimationFrame(f))};f()})"
  A.click(".voem-t:has-text('WALK THE PLANK')")
  st="(()=>{const m=VO3.dbg().meAv;const K=m.plank;return{mode:m.mode,ph:K?K.ph:null,y:+m.root.position.y.toFixed(2),z:+m.root.position.z.toFixed(2),hat:!!m._hat,toss:!!m.toss,chute:!!(m.toss&&m.toss.chute),plank:!!(K&&K.m)}})()"
  seen=set();shots=0;t=0.0
  for i in range(260):
      A.evaluate(step,1);t+=0.2
      s=A.evaluate(st)
      key=s['ph'] if s['ph'] else ('toss' if s['toss'] else s['mode'])
      if key not in seen or (key in ('walk','bounce','jump','toss') and shots<22 and i%2==0):
          seen.add(key);shots+=1;A.screenshot(path=OUT+'/pk_%02d_%s.png'%(shots,key));print(round(t,1),s)
      if s['ph'] is None and not s['toss'] and s['mode']=='seated' and 'jump' in seen:break
  ok({'board','climb','walk','bounce','jump'}<=seen,'all the steps play: board, climb, walk, bounce, jump',seen)
  ok(A.evaluate("VO3.dbg().meAv.mode")=='seated','back at the desk afterwards')
  ok(not A.evaluate("!!VO3.dbg().meAv._hat"),'the pirate hat comes off afterwards')
  ok(not errs,'no page errors',errs)
  b.close()
finally:
  srv.terminate()
print('RESULT',sum(res),'/',len(res))
