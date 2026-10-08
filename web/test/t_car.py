"""Loot crate car pulls up out front."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8846;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots'
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']
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
  A.wait_for_function("(()=>{const m=VO3.dbg().meAv;return m&&m.mode==='seated'})()",timeout=150000)
  A.wait_for_function("VO3.targets().filter(x=>x.ok).length>=4",timeout=150000)
  A.evaluate("(()=>{const S=VO3.dbg().dm;S.talker=null;S.until=1e9;S.next=1e9;S.share=1e9})()")
  A.evaluate("(()=>{const O=VO3.dbg();let b=null;O.av.forEach(a=>{if(a.nm==='Ayman')b=a});b.setLook('o12k10W10');b.root.visible=false;b.mode='wait';window.__b=b;O.dir.focus=null;O.opts.auto=false;O.carArrive(b,b.seat)})()")
  A.evaluate("(()=>{window.__vt=performance.now();performance.now=()=>window.__vt;VO3.dbg().fast=true})()")
  step="n=>new Promise(r=>{let k=0;const f=()=>{if(k++>=n)return r();window.__vt+=200;requestAnimationFrame(()=>requestAnimationFrame(f))};f()})"
  st="(()=>{const O=VO3.dbg(),e=(O.bpE||[]).find(x=>x.k==='car');return {ph:e?e.ph:null,x:e?+e.car.position.x.toFixed(2):null,mode:__b.mode,vis:__b.root.visible,errs:O.errs||0}})()"
  shots=0
  for k in range(70):
      A.evaluate(step,1);s=A.evaluate(st)
      if s['ph']=='in' and s['x'] is not None and s['x']<9 and shots==0:A.screenshot(path=OUT+'/car_in.png',timeout=180000);shots=1;print('in',s,flush=True)
      if s['ph']=='out' and shots==1:A.evaluate(step,2);A.screenshot(path=OUT+'/car_out.png',timeout=180000);shots=2;print('out',s,flush=True)
      if s['ph'] is None and k>5:print('done',s,flush=True);break
  print('final',A.evaluate(st),'desk car',A.evaluate("!!(__b.seat&&VO3.dbg().room.desks[__b.seat.i].sty)"))
  print('errs',errs);b.close()
finally:
  srv.terminate()
