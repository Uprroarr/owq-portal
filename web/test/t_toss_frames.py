"""Frame-by-frame look at the toss (virtual clock, so slow software rendering does not skip moments)."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8800;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots'
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']
SIDE=os.environ.get('SIDE','left')
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
  lgx.login(A,2);A.wait_for_timeout(800)
  A.evaluate("openTab('Team Chat');CH.ch='__voice';go()");A.wait_for_timeout(3000)
  A.evaluate("vcJoin()");A.wait_for_timeout(2000);A.evaluate("voDemo(1)");A.wait_for_timeout(500);A.evaluate("VO3.dbg().fast=true")
  A.wait_for_function("VO3.targets().filter(x=>x.ok).length>=4",timeout=120000)
  A.evaluate("VO3.dbg().opts.auto=false")
  A.wait_for_timeout(1500)
  # virtual clock: every step renders one frame and moves time by 1/15 s
  A.evaluate("(()=>{window.__vt=performance.now();performance.now=()=>window.__vt})()")
  step="n=>new Promise(r=>{let k=0;const f=()=>{if(k++>=n)return r();window.__vt+=1000/15;requestAnimationFrame(()=>requestAnimationFrame(f))};f()})"
  pick="side=>{const O=VO3.dbg();let best=null;O.av.forEach(a=>{if(a.me||a.mode!=='seated'||a.toss)return;const x=a.seat.x;if((side==='left'?x<=.5:x>.5)&&(!best||Math.abs(x)>Math.abs(best.seat.x)))best=a});return best?best.id:null}"
  tid=A.evaluate(pick,SIDE);print('target',tid)
  A.evaluate("id=>VO3.toss(id)",tid)
  marks=[(0.33,'a_lift'),(0.8,'b_flight'),(1.27,'c_flight2'),(1.47,'d_smash'),(1.8,'e_out'),(2.4,'f_chute'),(3.6,'g_drift'),(5.4,'h_far')]
  done=0.0
  for at,tag in marks:
      n=int(round((at-done)*15));A.evaluate(step,n);done+=n/15
      A.screenshot(path=OUT+'/tf_%s_%s.png'%(SIDE,tag))
      st=A.evaluate("id=>{const a=VO3.dbg().av.get(id);const T=a&&a.toss;return a?{mode:a.mode,y:+a.root.position.y.toFixed(2),z:+a.root.position.z.toFixed(2),chute:!!(T&&T.chute),hit:!!(T&&T.hit)}:null}",tid)
      print(tag,round(done,2),st)
  # walk back in
  A.evaluate(step,60);A.screenshot(path=OUT+'/tf_%s_i_back.png'%SIDE)
  print('back',A.evaluate("id=>{const a=VO3.dbg().av.get(id);return a?{mode:a.mode,vis:a.root.visible}:null}",tid))
  print('errors',errs)
  b.close()
finally:
  srv.terminate()
