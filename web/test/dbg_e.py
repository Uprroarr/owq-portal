"""debug: E to get out of the car (floor and deck)"""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8889;SITE=SP+'/web/test/site_w';URL='http://127.0.0.1:%d/index.html'%PORT;OUT=SP+'/web/test/shots'
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
  st="(()=>{const O=VO3.dbg(),a=O.meAv;return {drv:VO3.driving(),mode:a.mode,wk:!!a.wk,walkMe:!!O.walk.me,busy:O.busy(a),drvObj:!!a.drv}})()"
  A.evaluate("voDrive()");A.evaluate(step,4);print('1 driving',A.evaluate(st))
  A.keyboard.press('e');A.evaluate(step,4);print('2 after E on the floor',A.evaluate(st))
  A.keyboard.press('q');A.evaluate(step,60);print('3 after Q',A.evaluate(st))
  A.evaluate("voDrive()");A.evaluate(step,4);print('4 driving again',A.evaluate(st))
  A.evaluate("window.__kd=[];addEventListener('keydown',e=>window.__kd.push(e.key),true)")
  A.evaluate("window.dispatchEvent(new KeyboardEvent('keydown',{key:'e',bubbles:true}))");A.evaluate(step,4);print('5 after synthetic E',A.evaluate(st),A.evaluate("window.__kd"))
  A.evaluate("voDrive()");A.evaluate(step,4);print('6 driving again',A.evaluate(st))
  A.evaluate("try{VO3.dbg().drive.stop()}catch(e){window.__se=String(e)}");A.evaluate(step,4);print('7 after stop()',A.evaluate(st),A.evaluate("window.__se||''"))
  b.close()
finally:srv.terminate()
