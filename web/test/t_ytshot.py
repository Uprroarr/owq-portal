"""Owner-only nuke emote: frames from detonator to rebuild."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8853;SITE=os.environ.get('SITE',SP+'/web/test/site_yt');OUT=SP+'/web/test/shots'
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1280,'height':760},permissions=['microphone','camera'])
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still');window.__YT_NOAUTO=1;localStorage.setItem('owq_vo',JSON.stringify({list:0,demo:0,ava:'',auto:1,sfx:1}))}catch(e){}")
  FY=open(SP+'/web/test/fakeyt.js').read().replace("f.src='about:blank';","f.srcdoc='<body style=\"margin:0;background:linear-gradient(135deg,#1e6bff,#22d3a6);display:grid;place-items:center;height:100vh;font:900 9vw Verdana;color:#fff\">YOUTUBE VIDEO</body>';")
  ctx.route('https://www.youtube.com/iframe_api',lambda r:r.fulfill(status=200,content_type='text/javascript',body=FY))
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
  A.evaluate("(()=>{const S=VO3.dbg().dm;S.until=1e9;S.next=1e9;S.share=1e9})()")
  ok=lambda c,m,i='':print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(i)),flush=True)
  A.wait_for_timeout(1500)
  A.evaluate("voPop('share')");A.wait_for_timeout(5600)
  A.evaluate("ytStart('https://www.youtube.com/watch?v=dQw4w9WgXcQ')")
  A.wait_for_function("document.querySelector('.ytw:not(.off)')",timeout=60000);A.wait_for_timeout(6000)
  pr=A.evaluate("!!document.querySelector('.ytw.ask')");A.screenshot(path=OUT+'/yt_ask.png');print('prompt shown',pr)
  r=A.evaluate("(()=>{const w=document.querySelector('.ytw').getBoundingClientRect();return [w.x+w.width/2,w.y+w.height/2]})()");A.mouse.click(r[0],r[1]);A.wait_for_timeout(2500)
  ok(pr and not A.evaluate("!!document.querySelector('.ytw.ask')") and A.evaluate("window.__YTL.some(p=>!p.dead&&p.st===1)"),'blocked autoplay: clicking the video starts it and the prompt goes away',A.evaluate("window.__YTL.map(p=>p.st)"))
  A.evaluate("VO3.dbg().closeTheater()");A.wait_for_timeout(1500)
  A.screenshot(path=OUT+'/yt_tv.png')
  cv=A.evaluate("(()=>{const r=document.querySelector('.vo3c').getBoundingClientRect();return [r.x+r.width*.3,r.y+r.height*.8]})()")
  A.mouse.move(cv[0],cv[1]);A.mouse.down()
  for k in range(10):A.mouse.move(cv[0]+22*k,cv[1]);A.wait_for_timeout(60)
  A.mouse.up();A.wait_for_timeout(2500);A.screenshot(path=OUT+'/yt_angle.png')
  d=A.evaluate("new Promise(ok=>requestAnimationFrame(()=>{const r=VO3.tvRect('yt:'+vcMe());const b=document.querySelector('.ytwv').getBoundingClientRect();ok({q:r&&r.q,b:[b.left,b.top,b.right,b.bottom]})}))")
  print('angle',d)
  if d['q']:
    xs=[p[0] for p in d['q']];ys=[p[1] for p in d['q']]
    ok(abs(min(xs)-d['b'][0])<3 and abs(max(xs)-d['b'][2])<3 and abs(min(ys)-d['b'][1])<3 and abs(max(ys)-d['b'][3])<3,'the video follows the TV corners in perspective',d)
  A.evaluate("VO3.dbg().openTheater('yt:'+vcMe())");A.wait_for_timeout(1500);A.screenshot(path=OUT+'/yt_theater.png')
  ok(A.evaluate("document.querySelector('.ytw').classList.contains('th')"),'the big view shows the video full size')
  A.evaluate("VO3.dbg().closeTheater()");A.evaluate("voPop('share')");A.wait_for_timeout(1200);A.screenshot(path=OUT+'/yt_ctl.png')
  print('errs',errs);b.close()
finally:
  srv.terminate()
