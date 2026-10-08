"""Drive your car around the floor and out to the OWQ Speedway."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8857;SITE=os.environ.get('SITE',SP+'/web/test/site_drv');OUT=SP+'/web/test/shots'
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
  ok=lambda c,m,i='':print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(i)[:300]),flush=True)
  A.evaluate("(()=>{const O=VO3.dbg();O.opts.auto=false;O.dir.focus=null})()")
  ok(not A.evaluate("VO3.canDrive()"),'no car yet -> no Drive button')
  A.evaluate("voApi.setLook('W8')");A.wait_for_timeout(2500)
  ok(A.evaluate("VO3.canDrive()"),'with a crate car, Drive my car is offered',A.evaluate("VO3.dbg().meAv.look.W"))
  A.evaluate("vcPaint()");A.wait_for_timeout(400);ok(A.evaluate("[...document.querySelectorAll('.vob')].some(b=>/Drive my car/.test(b.title))"),'the dock has a Drive my car button')
  A.evaluate("voDrive()");A.wait_for_timeout(600)
  ok(A.evaluate("VO3.driving()") and A.evaluate("VO3.dbg().meAv.mode==='drive'"),'you hop in your car')
  A.evaluate("(()=>{window.__vt=performance.now();performance.now=()=>window.__vt;VO3.dbg().fast=true})()")
  step="n=>new Promise(r=>{let k=0;const f=()=>{if(k++>=n)return r();window.__vt+=50;requestAnimationFrame(()=>requestAnimationFrame(f))};f()})"
  pos="(()=>{const d=VO3.dbg().drive.me.drv;return {x:+d.x.toFixed(2),z:+d.z.toFixed(2),h:+d.h.toFixed(2),v:+d.v.toFixed(2),k:d.k}})()"
  p0=A.evaluate(pos);A.keyboard.down('w');A.evaluate(step,30);p1=A.evaluate(pos)
  ok(abs(p1['x']-p0['x'])+abs(p1['z']-p0['z'])>1,'W drives forward',[p0,p1])
  A.keyboard.down('a');A.evaluate(step,14);A.keyboard.up('a');p2=A.evaluate(pos);ok(abs(p2['h']-p1['h'])>.3,'A steers',[p1,p2])
  A.evaluate(step,40);p3=A.evaluate(pos);A.keyboard.up('w')
  inside=A.evaluate("(([x,z])=>SEATS_CHECK=null)([0,0])") if False else None
  A.screenshot(path=OUT+'/drive_floor.png',timeout=180000)
  pr=A.evaluate("(()=>{const x=VC.room.peers().find(p=>p.peer===vcMe());return x&&x.presence.dv})()");ok(pr and 'x' in pr and pr.get('c')==8,'your position goes out to the floor (presence)',pr)
  # to the garage door
  A.evaluate("(()=>{const d=VO3.dbg().drive.me.drv;d.x=-7.6;d.z=3.6;d.h=Math.PI;d.v=3})()");A.keyboard.down('w');A.evaluate(step,40);A.keyboard.up('w');A.evaluate(step,20)
  p4=A.evaluate(pos);ok(p4['k']==1,'driving into the RACE TRACK door takes you to the OWQ Speedway',p4)
  A.screenshot(path=OUT+'/drive_track.png',timeout=180000)
  A.keyboard.down('w');A.evaluate(step,50);A.keyboard.up('w');A.screenshot(path=OUT+'/drive_track2.png',timeout=180000);p5=A.evaluate(pos);print('p5',p5)
  # a lap: put the car before the line, mark both ends visited, cross
  A.evaluate("(()=>{const D=VO3.dbg().drive,d=D.me.drv;d.x=3;d.z=-14;d.h=Math.PI;d.v=10;d.lap={px:3,t0:performance.now()/1000-21.5,a:1,b:1}})()");A.keyboard.down('w');A.evaluate(step,12);A.keyboard.up('w')
  bl=A.evaluate("VO3.dbg().drive.best");ok(bl and bl>20,'crossing the line after a full lap records the lap time',bl)
  ok(A.evaluate("VO3.dbg().drive.boardRows().length")>=1,'the lap board lists it')
  A.evaluate("(()=>{const d=VO3.dbg().drive.me.drv;d.x=0;d.z=24;d.h=-Math.PI/2;d.v=4})()");A.keyboard.down('w');A.evaluate(step,40);A.keyboard.up('w');A.evaluate(step,20)
  p6=A.evaluate(pos);ok(p6['k']==0,'the pit tunnel brings you back to the office',p6)
  A.keyboard.press('e');A.evaluate(step,60)
  ok(not A.evaluate("VO3.driving()"),'E gets you out')
  A.evaluate(step,120);ok(A.evaluate("['seated','sitting','walk'].includes(VO3.dbg().meAv.mode)"),'and you walk back to your desk',A.evaluate("VO3.dbg().meAv.mode"))
  pr=A.evaluate("(()=>{const x=VC.room.peers().find(p=>p.peer===vcMe());return x&&x.presence.dv})()");ok(not pr,'your car leaves everyone else\'s floor',pr)
  ok(not errs and not A.evaluate("VO3.dbg().errs||0"),'no errors',errs)
  print('errs',errs);b.close()
finally:
  srv.terminate()
