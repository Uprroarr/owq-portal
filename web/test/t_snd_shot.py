import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8803;SITE=SP+'/web/test/site';OUT=SP+'/web/test/shots'
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'])
  ctx=b.new_context(viewport={'width':1280,'height':800},permissions=['microphone'])
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto('http://127.0.0.1:%d/index.html'%PORT);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(800);A.evaluate("try{RAIL=false;railApply()}catch(e){}");A.wait_for_timeout(400)
  A.click('#sndb');A.wait_for_timeout(500);A.screenshot(path=OUT+'/snd_desk.png',clip={'x':780,'y':0,'width':500,'height':640})
  b.close()
finally:srv.terminate()
