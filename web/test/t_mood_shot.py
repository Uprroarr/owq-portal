"""Voice tone moods: close-up of one teammate in each mood, mouth closed and talking."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8812;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots'
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
  A.evaluate("(()=>{const S=VO3.dbg().dm;S.talker=null;S.until=1e9;S.next=1e9;S.share=1e9})()");A.wait_for_timeout(1500)
  bid=A.evaluate("(()=>{const O=VO3.dbg();let id=null;O.av.forEach(a=>{if(a.bot&&a.mode==='seated'&&!id&&a.seat.row!=='f')id=a.id});if(!id)O.av.forEach(a=>{if(a.bot&&a.mode==='seated'&&!id)id=a.id});return id})()")
  print("bot",bid,A.evaluate("(()=>{const r=[];VO3.dbg().av.forEach(a=>r.push([a.id,a.nm,a.bot,a.mode,a.seat&&a.seat.row]));return r})()"))
  A.evaluate("id=>{const O=VO3.dbg(),a=O.av.get(id);O.av.forEach(b=>{if(b.bot)b.botL=0});O.dir.focus=a;O.dir.focusT=O.t+9999;O.dir.zoom=.62;a.typing=false;a.typeT=999;a.nextIdle=999;a.idleK=null}",bid)
  A.wait_for_timeout(4000)
  for mood in ['none','hype','laugh','focus','fire','calm']:
      for talk in (0,1):
          A.evaluate("([id,m,tk])=>{const O=VO3.dbg(),a=O.av.get(id);a.mdOv=m==='none'?{}:{[m]:1};O.dm.talker=tk?a:null;a.blinkT=99;a.typing=false;a.typeT=999;a.idleK=null;a.nextIdle=999}",[bid,mood,talk])
          A.wait_for_timeout(3500)
          A.screenshot(path=OUT+'/mood_%s_%d.png'%(mood,talk))
          print(mood,talk,A.evaluate("id=>{const a=VO3.dbg().av.get(id);return {md:a.md,by:+(a._by||0).toFixed(3),br:+(a._br||0).toFixed(3),m:[a.mouth.w,a.mouth.h,a.mouth.c].map(v=>+v.toFixed(3)),L:+a.L.toFixed(2)}}",bid),flush=True)
  print('errs',errs);b.close()
finally:
  srv.terminate()
