"""Battle Pass 3D rewards on demo teammates."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8840;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots'
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
  LOOKS={'Austin Vardzel':'o5k0H4B6G1D1C1I1R1T2N1V1','Nate Johnson':'o7k1H5B1G2D3C2I3R2T5N2','John Montini':'o9k3H2B5G3D4C4I4R1T3N3V3','RJ Noullet':'o10k4H7B4G4D5C3I6R2T4','Ayman':'s6o12k10H12B7G1D6C5I8R3T8N4V5'}
  A.evaluate("L=>{const O=VO3.dbg();O.av.forEach(a=>{if(L[a.nm])a.setLook(L[a.nm])});const m=O.meAv;if(m)m.setLook('s1h1c1o11k14p0H11B3G1D2C6I2R3T7N2V2')}",LOOKS)
  for k in range(8):
      t0=time.time();A.evaluate("new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))");print('frame pair',round(time.time()-t0,2),'s','errs',A.evaluate("VO3.dbg().errs||0"),'running',A.evaluate("VO3.dbg().running"),flush=True)
  A.screenshot(path=OUT+'/bp3d_wide.png',timeout=180000)
  print('styled desks',A.evaluate("VO3.dbg().room.desks.filter(d=>d.sty).length"),'chairs',A.evaluate("VO3.dbg().room.desks.filter(d=>d.chairSty).length"))
  for nm in ['Ayman','John Montini','Austin Vardzel','Nate Johnson','RJ Noullet','me']:
      A.evaluate("nm=>{const O=VO3.dbg();let a=null;O.av.forEach(x=>{if((nm==='me'&&x.me)||x.nm===nm)a=x});if(!a)return;O.dir.focus=a;O.dir.focusT=O.t+9999;O.dir.zoom=.85;O.dm.talker=a.bot?a:null;a.blinkT=99}",nm)
      A.wait_for_timeout(5000)
      A.screenshot(path=OUT+'/bp3d_%s.png'%nm.split(' ')[0].lower(),timeout=180000)
  print('errs',errs)
  print('errs',errs);b.close()
finally:
  srv.terminate()
