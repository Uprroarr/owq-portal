"""Quick look at the thank-you emote camera: face-on shot (reps 1-3), three-quarter shot (reps 4-8)."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8810;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots'
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
  A.evaluate("(()=>{window.__vt=performance.now();performance.now=()=>window.__vt})()")
  step="n=>new Promise(r=>{let k=0;const f=()=>{if(k++>=n)return r();window.__vt+=STEP;requestAnimationFrame(()=>requestAnimationFrame(f))};f()})"
  A.evaluate("(()=>{const O=VO3.dbg();O.emote('thanks')})()")
  st="(()=>{const a=VO3.dbg().meAv,H=a.thanks;return H?{ph:H.ph,n:H.n,dip:+(a.dip||0).toFixed(2),t:+H.t.toFixed(2)}:{ph:null}})()"
  got=set()
  for i in range(200):
      s=A.evaluate(st);fine=s['ph'] in('down','reps','up')
      A.evaluate(step.replace('STEP','70' if fine else '300'),1);s=A.evaluate(st)
      if s['ph']=='reps':
          if s['n']==3 and s['dip']>.9 and 'f' not in got:got.add('f');A.wait_for_timeout(50);A.screenshot(path=OUT+'/thanks_front.png');print('front',s)
          if s['n']==7 and s['dip']>.9 and 's' not in got:got.add('s');A.screenshot(path=OUT+'/thanks_side.png');print('side',s)
          if s['n']==7 and s['dip']<.05 and 's2' not in got and 's' in got:got.add('s2');A.screenshot(path=OUT+'/thanks_side_top.png');print('side top',s)
      if s['ph'] in('up','back') or len(got)>=3:break
  print('errs',errs);b.close()
finally:
  srv.terminate()
