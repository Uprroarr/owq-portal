"""debug: ring run detection"""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8891;SITE=SP+'/web/test/site_w';URL='http://127.0.0.1:%d/index.html'%PORT;OUT=SP+'/web/test/shots'
FLAGS=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1280,'height':760},permissions=['microphone','camera'])
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still');localStorage.setItem('owq_vo',JSON.stringify({list:0,demo:0,ava:'',auto:1,sfx:0}))}catch(e){}")
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:print('PAGEERR',str(e)[:500]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(800)
  A.evaluate("openTab('Team Chat');CH.ch='__voice';go()");A.wait_for_timeout(3000)
  A.evaluate("vcJoin()");A.wait_for_timeout(2000);A.evaluate("VO3.dbg().fast=true")
  A.wait_for_function("(()=>{const m=VO3.dbg().meAv;return m&&m.mode==='seated'})()",timeout=180000)
  A.evaluate("voApi.setLook('W8F6J7')");A.wait_for_timeout(2500)
  A.evaluate("(()=>{const O=VO3.dbg();O.opts.auto=false;O.dir.focus=null})()")
  A.evaluate("(()=>{window.__vt=performance.now();performance.now=()=>window.__vt;VO3.dbg().fast=true})()")
  step="n=>new Promise(r=>{let k=0;const f=()=>{if(k++>=n)return r();window.__vt+=50;requestAnimationFrame(()=>requestAnimationFrame(f))};f()})"
  A.evaluate("(()=>{const O=VO3.dbg();O.cardA=O.meAv;O.cardAct('walk')})()");A.evaluate(step,3)
  A.evaluate("(()=>{const W=VO3.dbg().walk;W.me.wk.x=8;W.me.wk.z=-6.4;W.ride('r')})()");A.evaluate(step,16)
  A.evaluate("(()=>{const W=VO3.dbg().walk,w=W.me.wk;w.x=26;w.z=-14;w.h=Math.PI/2;W.yaw=Math.PI/2;W.snap=1})()");A.evaluate(step,3)
  A.keyboard.press('e');A.evaluate(step,4);print('flying',A.evaluate("!!VO3.dbg().fly.me"))
  A.evaluate(step,40)
  print(A.evaluate("(()=>{const F=VO3.dbg().fly,f=VO3.dbg().meAv.fly;return {x:f.x,y:f.y,z:f.z,yaw:f.yaw,roll:f.roll,v:f.v,run:f.run,ri:F.ri,n:F.rings.length,r0:F.rings[0].p.toArray(),tp:F.tp}})()"))
  A.evaluate("(()=>{const F=VO3.dbg().fly,f=VO3.dbg().meAv.fly,r=F.rings[0].p,n=F.rings[1].p;const dx=n.x-r.x,dz=n.z-r.z;f.yaw=Math.atan2(dx,dz);f.pitch=0;f.roll=0;f.x=r.x-Math.sin(f.yaw)*20;f.z=r.z-Math.cos(f.yaw)*20;f.y=r.y})()")
  for k in range(16):
    A.evaluate(step,1)
    print(k,A.evaluate("(()=>{const F=VO3.dbg().fly,f=VO3.dbg().meAv.fly;if(!f)return 'no plane';const r=F.rings[0].p;return {d:+Math.hypot(f.x-r.x,f.y-r.y,f.z-r.z).toFixed(2),x:+f.x.toFixed(1),y:+f.y.toFixed(1),z:+f.z.toFixed(1),ri:F.ri,v:+f.v.toFixed(1),me:!!F.me}})()"))
  b.close()
finally:srv.terminate()
