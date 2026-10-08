"""Sky Park (Home Run Derby), the Firing Range and flying, single player, with screenshots."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8883;SITE=os.environ.get('SITE',SP+'/web/test/site_w');OUT=SP+'/web/test/shots'
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']
SHOTS=os.environ.get('SHOTS','1')=='1'
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
res=[]
def ok(c,m,i=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(i)[:400]),flush=True)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1280,'height':760},permissions=['microphone','camera'])
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still');localStorage.setItem('owq_vo',JSON.stringify({list:0,demo:0,ava:'',auto:1,sfx:1}))}catch(e){}")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:300]));A.on('console',lambda m:errs.append('console:'+m.text[:300]) if (m.type=='error' or 'VO3' in m.text) else None)
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
  wk="(()=>{const a=VO3.dbg().meAv,w=a.wk;return w?{x:+w.x.toFixed(2),y:+w.y.toFixed(2),z:+w.z.toFixed(2),f:w.f,mode:a.mode}:{mode:a.mode}})()"
  look=A.evaluate("(()=>{const l=VO3.dbg().meAv.look;return {W:l.W,F:l.F,J:l.J}})()");ok(look['F']>0 and look['J']>0,'test look has a plane and a blaster',look)
  A.evaluate("(()=>{const O=VO3.dbg();O.cardA=O.meAv;O.cardAct('walk')})()");A.evaluate(step,3)
  # up to the Sky Park
  A.evaluate("(()=>{const W=VO3.dbg().walk;W.me.wk.x=8;W.me.wk.z=-6.4;W.ride('r')})()");A.evaluate(step,16);ok(A.evaluate(wk).get('f')=='r','elevator to the Sky Park')
  # the START button
  A.evaluate("(()=>{const W=VO3.dbg().walk,w=W.me.wk;w.x=-15.6;w.z=18.6;w.h=Math.PI;W.yaw=Math.PI})()");A.evaluate(step,3)
  pp=A.evaluate("(()=>{const p=VO3.dbg().walk.prompt();return p&&p.t})()");ok(pp and 'DERBY' in pp,'by home plate the prompt offers the Home Run Derby',pp)
  if SHOTS:A.screenshot(path=OUT+'/park_button.png',timeout=180000)
  A.keyboard.press('e');A.evaluate(step,40)
  ok(A.evaluate("!!VO3.dbg().derby.turn"),'pressing START begins my turn at the plate',A.evaluate("VO3.dbg().derby.my"))
  hr=A.evaluate("(()=>{const x=VC.room.peers().find(p=>p.peer===vcMe());return x&&x.presence.hr})()");ok(hr and hr.get('st')=='b','everyone sees I am batting (presence hr)',hr)
  # wait for the first pitch and hit it on time
  hit=None
  for k in range(60):
    A.evaluate(step,1)
    st=A.evaluate("(()=>{const D=VO3.dbg().derby,T=D.turn;return T&&T.ball&&!T.ball.hit?{t0:T.ball.t0,tt:T.ball.tt,now:VO3.dbg().t}:null})()")
    if st:
      A.evaluate("(()=>{const D=VO3.dbg().derby,T=D.turn,b=T.ball;T.sw=b.t0+b.tt-.14;VO3.dbg().meAv._sw=T.sw;D.contact(T,b)})()");hit=True;break
  ok(hit,'a pitch comes in')
  A.evaluate(step,6)
  if SHOTS:A.screenshot(path=OUT+'/park_swing.png',timeout=180000)
  call=None
  for k in range(80):
    A.evaluate(step,1);c=A.evaluate("(()=>{const T=VO3.dbg().derby.turn;return T&&T.ball&&T.ball.call||null})()")
    if c:call=c;break
  ok(call=='HR','a perfectly timed swing is a HOME RUN',call)
  if SHOTS:A.evaluate(step,8);A.screenshot(path=OUT+'/park_hr.png',timeout=180000)
  n=A.evaluate("VO3.dbg().derby.turn&&VO3.dbg().derby.turn.n");ok(n==1,'the home run counts',n)
  A.evaluate("VO3.dbg().derby.finish()");A.evaluate(step,4)
  ok(not A.evaluate("VO3.dbg().derby.turn") and A.evaluate("VO3.dbg().meAv.mode")=='free','finishing gives you back control',A.evaluate(wk))
  top=A.evaluate("(()=>{try{return voApi.tops().derby||[]}catch(e){return 'x'}})()");ok(top and top[0][1]>=1,'team best saved for the derby',top)
  # flying from the hangar pad
  A.evaluate("(()=>{const W=VO3.dbg().walk,w=W.me.wk;w.x=26;w.z=-14;w.h=Math.PI/2;W.yaw=Math.PI/2})()");A.evaluate(step,3)
  pp=A.evaluate("(()=>{const p=VO3.dbg().walk.prompt();return p&&p.k})()");ok(pp=='fly','on the hangar pad the prompt says FLY MY PLANE',pp)
  if SHOTS:A.screenshot(path=OUT+'/park_pad.png',timeout=180000)
  A.keyboard.press('e');A.evaluate(step,4);ok(A.evaluate("!!VO3.dbg().fly.me"),'E takes off')
  A.evaluate(step,40);fp=A.evaluate("(()=>{const f=VO3.dbg().meAv.fly;return f&&{x:+f.x.toFixed(1),y:+f.y.toFixed(1),z:+f.z.toFixed(1),v:+f.v.toFixed(1),run:f.run}})()")
  ok(fp and fp['x']>33 and fp['run']==0,'the plane leaves the roof and flies',fp)
  A.keyboard.down('w');A.evaluate(step,20);A.keyboard.up('w');fp2=A.evaluate("(()=>{const f=VO3.dbg().meAv.fly;return f&&{y:+f.y.toFixed(1)}})()")
  ok(fp2 and fp2['y']>fp['y']+2,'W pulls the nose up and climbs',[fp,fp2])
  A.keyboard.down('a');A.evaluate(step,20);A.keyboard.up('a');A.evaluate(step,4)
  if SHOTS:A.screenshot(path=OUT+'/fly_city.png',timeout=180000)
  fl=A.evaluate("(()=>{const x=VC.room.peers().find(p=>p.peer===vcMe());return x&&x.presence.fl})()");ok(fl and 'x' in fl,'your plane goes out to everyone (presence fl)',fl)
  # through the first ring
  A.evaluate("(()=>{const F=VO3.dbg().fly,f=VO3.dbg().meAv.fly,r=F.rings[0].p,n=F.rings[1].p;const dx=n.x-r.x,dz=n.z-r.z;f.yaw=Math.atan2(dx,dz);f.pitch=0;f.x=r.x-Math.sin(f.yaw)*20;f.z=r.z-Math.cos(f.yaw)*20;f.y=r.y})()");A.evaluate(step,16)
  ok(A.evaluate("VO3.dbg().fly.ri")>=1,'flying through the blue ring starts the Ring Run',A.evaluate("VO3.dbg().fly.ri"))
  if SHOTS:A.screenshot(path=OUT+'/fly_ring.png',timeout=180000)
  A.keyboard.press('e');A.evaluate(step,16);ok(A.evaluate(wk).get('f')=='r' and not A.evaluate("!!VO3.dbg().fly.me"),'E lands you back on the Sky Park',A.evaluate(wk))
  # the Firing Range
  A.evaluate("(()=>{const W=VO3.dbg().walk;W.me.wk.x=8;W.me.wk.z=-6.4;W.ride('g')})()");A.evaluate(step,16);ok(A.evaluate(wk).get('f')=='g','elevator down to the Firing Range')
  A.evaluate("(()=>{const W=VO3.dbg().walk,w=W.me.wk;w.x=-7.4;w.z=-3.7;w.h=0;W.yaw=0})()");A.evaluate(step,3)
  pp=A.evaluate("(()=>{const p=VO3.dbg().walk.prompt();return p&&p.t})()");ok(pp and 'LANE 1' in pp,'at a lane the prompt says START SHOOTING',pp)
  A.keyboard.press('e');A.evaluate(step,70)
  ok(A.evaluate("!!VO3.dbg().range.lane"),'E starts a round in the lane')
  nt=A.evaluate("VO3.dbg().range.targets.length");ok(nt>=1,'targets pop up downrange',nt)
  # aim at a target and fire
  sc0=A.evaluate("VO3.dbg().range.lane.score")
  for k in range(6):
    A.evaluate("(()=>{const R=VO3.dbg().range,O=VO3.dbg(),t=R.targets.find(x=>!x.dead);if(!t)return;const v=t.m.position.clone().project(O.cam);R.mx=v.x*.5+.5;R.my=-v.y*.5+.5;R.lane.next=0;R.fire()})()");A.evaluate(step,8)
  sc1=A.evaluate("VO3.dbg().range.lane.score");ok(sc1>sc0,'hitting targets scores points',[sc0,sc1])
  if SHOTS:A.screenshot(path=OUT+'/range_lane.png',timeout=180000)
  rg=A.evaluate("(()=>{const x=VC.room.peers().find(p=>p.peer===vcMe());return x&&x.presence.rg})()");ok(rg and rg.get('on')==1,'your lane and score go out to everyone (presence rg)',rg)
  A.keyboard.press('Escape');A.evaluate(step,4);ok(not A.evaluate("!!VO3.dbg().range.lane"),'Esc leaves the lane')
  if SHOTS:A.evaluate(step,4);A.screenshot(path=OUT+'/range_room.png',timeout=180000)
  ok(not [e for e in errs if 'VO3' in e or 'Error' in e],'no page errors',errs[:6])
  print('%d/%d'%(sum(res),len(res)))
  b.close()
finally:
  srv.terminate()
