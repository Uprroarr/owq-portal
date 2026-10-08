"""Walk the Sales Floor, ride the elevator, walk out onto the Sky Deck; drive out the door onto the deck and over a jump."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8881;SITE=os.environ.get('SITE',SP+'/web/test/site_w');OUT=SP+'/web/test/shots'
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
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:300]));A.on('console',lambda m:errs.append('console:'+m.text[:300]) if m.type=='error' else None)
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(800)
  A.evaluate("openTab('Team Chat');CH.ch='__voice';go()");A.wait_for_timeout(3000)
  A.evaluate("vcJoin()");A.wait_for_timeout(2000);A.evaluate("VO3.dbg().fast=true")
  A.wait_for_function("(()=>{const m=VO3.dbg().meAv;return m&&m.mode==='seated'})()",timeout=150000)
  A.evaluate("(()=>{const O=VO3.dbg();O.opts.auto=false;O.dir.focus=null})()")
  A.evaluate("(()=>{window.__vt=performance.now();performance.now=()=>window.__vt;VO3.dbg().fast=true})()")
  step="n=>new Promise(r=>{let k=0;const f=()=>{if(k++>=n)return r();window.__vt+=50;requestAnimationFrame(()=>requestAnimationFrame(f))};f()})"
  wk="(()=>{const a=VO3.dbg().meAv,w=a.wk;return w?{x:+w.x.toFixed(2),y:+w.y.toFixed(2),z:+w.z.toFixed(2),h:+w.h.toFixed(2),f:w.f,mode:a.mode}:{mode:a.mode}})()"
  # walk around
  A.evaluate("(()=>{const O=VO3.dbg();O.cardA=O.meAv;O.cardAct('walk')})()");A.evaluate(step,4)
  w0=A.evaluate(wk);ok(w0.get('f')=='o' and w0.get('mode')=='free','Walk around: you stand up in the aisle',w0)
  A.keyboard.down('w');A.evaluate(step,20);A.keyboard.up('w');w1=A.evaluate(wk)
  ok(abs(w1['x']-w0['x'])+abs(w1['z']-w0['z'])>1.5,'W walks forward',[w0,w1])
  pr=A.evaluate("(()=>{const x=VC.room.peers().find(p=>p.peer===vcMe());return x&&x.presence.wk})()");ok(pr and pr.get('f')=='o','your walking position goes out to the floor (presence wk)',pr)
  # desks block you
  A.evaluate("(()=>{const w=VO3.dbg().meAv.wk;w.x=-1.6;w.z=-1.3;w.h=Math.PI;VO3.dbg().walk.yaw=Math.PI})()");A.keyboard.down('w');A.evaluate(step,30);A.keyboard.up('w');w2=A.evaluate(wk)
  ok(w2['z']<-.68-.2,'you cannot walk through a desk',w2)
  if SHOTS:A.evaluate(step,6);A.screenshot(path=OUT+'/walk_floor.png',timeout=180000)
  # elevator
  A.evaluate("(()=>{const w=VO3.dbg().meAv.wk;w.x=8;w.z=-6.4;w.h=Math.PI;VO3.dbg().walk.yaw=Math.PI})()");A.evaluate(step,4)
  pp=A.evaluate("(()=>{const p=VO3.dbg().walk.prompt();return p&&p.k})()");ok(pp=='elev','next to the elevator the E prompt says ELEVATOR',pp)
  A.keyboard.press('e');A.evaluate(step,2);ok(A.evaluate("document.querySelector('.vo3el').classList.contains('on')"),'E opens the floor picker')
  if SHOTS:A.screenshot(path=OUT+'/walk_elev.png',timeout=180000)
  A.evaluate("document.querySelector('.vo3el button[data-f=r]').click()");A.evaluate(step,20);w3=A.evaluate(wk)
  ok(w3.get('f')=='r' and abs(w3['y']-6)<.2,'picking SKY PARK takes you to the roof',w3)
  A.keyboard.down('w');A.evaluate(step,30);A.keyboard.up('w');A.evaluate(step,4)
  ok(A.evaluate("VO3.dbg().wld.zone")=='r','the camera is on the roof (zone r)',A.evaluate("VO3.dbg().wld.zone"))
  if SHOTS:A.screenshot(path=OUT+'/walk_roof.png',timeout=180000)
  A.evaluate("(()=>{const W=VO3.dbg().walk;W.me.wk.x=8;W.me.wk.z=-6.3;W.ride('o')})()");A.evaluate(step,20);w4=A.evaluate(wk);ok(w4.get('f')=='o' and abs(w4['y'])<.2,'and back down to the Sales Floor',w4)
  # out the west door onto the Sky Deck
  A.evaluate("(()=>{const W=VO3.dbg().walk,w=W.me.wk;w.x=-8.6;w.z=3.6;w.h=-Math.PI/2;W.yaw=-Math.PI/2})()");A.keyboard.down('w');A.evaluate(step,40);A.keyboard.up('w');w5=A.evaluate(wk)
  ok(w5.get('f')=='d' and w5['x']<-10.6,'walking through the west door puts you out on the Sky Deck',w5)
  ok(abs(w5['y'])<.4,'standing on the deck (not falling)',w5)
  A.evaluate("(()=>{const W=VO3.dbg().walk,w=W.me.wk;w.x=-17.4;w.z=12;w.h=Math.PI*.85;W.yaw=Math.PI*.85;w.hint=-1})()");A.keyboard.down('w');A.evaluate(step,20);A.keyboard.up('w');A.evaluate(step,8)
  w6=A.evaluate(wk);ok(w6.get('f')=='d' and abs(w6['y'])<2,'you can walk along the Sky Deck',w6)
  ok(A.evaluate("VO3.dbg().wld.zone")=='d','camera outside: the city and tower show',A.evaluate("VO3.dbg().wld.zone"))
  if SHOTS:A.screenshot(path=OUT+'/walk_deck.png',timeout=180000)
  A.keyboard.press('q');A.evaluate(step,30);ok(A.evaluate("VO3.dbg().meAv.mode") in ('seated','sitting','walk'),'Q takes you back to your desk',A.evaluate(wk))
  # drive out the door
  A.evaluate("voApi.setLook('W8')");A.wait_for_timeout(2500);A.evaluate(step,4)
  A.evaluate("voDrive()");A.evaluate(step,4);ok(A.evaluate("VO3.driving()"),'you hop in your car')
  pos="(()=>{const d=VO3.dbg().drive.me.drv;return {x:+d.x.toFixed(2),y:+d.y.toFixed(2),z:+d.z.toFixed(2),h:+d.h.toFixed(2),v:+d.v.toFixed(2),k:d.k,air:d.air,s:+(d.s||0).toFixed(1)}})()"
  A.evaluate("(()=>{const d=VO3.dbg().drive.me.drv;d.x=-7.6;d.z=3.6;d.h=Math.PI;d.v=3})()");A.keyboard.down('w');A.evaluate(step,40);A.keyboard.up('w')
  p1=A.evaluate(pos);ok(p1['k']==1 and p1['x']<-10.5,'driving through the west door goes straight onto the Sky Deck (no fade)',p1)
  ok(not A.evaluate("document.querySelector('.vo3drf').classList.contains('on')"),'no black screen on the way out')
  if SHOTS:A.evaluate(step,4);A.screenshot(path=OUT+'/drive_deck0.png',timeout=180000)
  # turn left onto the loop and drive
  put="s=>{const D=VO3.dbg().drive,d=D.me.drv,S=VO3.dbg().track.sky,i=Math.round(s/S.len*S.n)%S.n,a=S.S[i];d.x=a.p.x;d.z=a.p.z;d.y=a.p.y;d.h=Math.atan2(-a.t.z,a.t.x);d.v=12;d.hint=i;d.air=0;d.vy=0;return S.len}"
  L=A.evaluate(put,60);A.keyboard.down('w');A.evaluate(step,16);A.keyboard.up('w');p2=A.evaluate(pos)
  ry=A.evaluate("(()=>{const d=VO3.dbg().drive.me.drv;return VO3.dbg().track.sky.S[d.hint].p.y})()")
  ok(p2['k']==1 and p2['v']>8 and p2['s']>66,'the car runs along the deck',[p2,L])
  ok(abs(p2['y']-ry)<.5,'and follows the road up and down',[p2['y'],ry])
  if SHOTS:A.screenshot(path=OUT+'/drive_deck1.png',timeout=180000)
  if SHOTS:
    A.evaluate("(()=>{const O=VO3.dbg();O.dbgCam={P:new O.cam.position.constructor(-60,40,110),T:new O.cam.position.constructor(-55,0,0),F:55}})()");A.evaluate(step,3);A.screenshot(path=OUT+'/world_wide.png',timeout=180000)
    A.evaluate("(()=>{const O=VO3.dbg();O.dbgCam={P:new O.cam.position.constructor(40,30,60),T:new O.cam.position.constructor(-5,5,-5),F:50}})()");A.evaluate(step,3);A.screenshot(path=OUT+'/world_tower.png',timeout=180000)
    A.evaluate("(()=>{VO3.dbg().dbgCam=null})()")
  # put the car before the first jump at speed
  jp=A.evaluate("(()=>{const D=VO3.dbg().drive,d=D.me.drv;const S=VO3.dbg().track.sky,g=S.gaps[0];const i=Math.round((g.s0-30)/S.len*S.n)%S.n,a=S.S[i];d.x=a.p.x;d.z=a.p.z;d.y=a.p.y;d.h=Math.atan2(-a.t.z,a.t.x);d.v=21;d.hint=i;d.air=0;return {s0:g.s0,s1:g.s1}})()")
  A.keyboard.down('w');air=False;landed=None
  for k in range(40):
    A.evaluate(step,1);q=A.evaluate(pos)
    if q['air']:air=True
    if air and not q['air']:landed=q;break
  A.keyboard.up('w')
  ok(air,'the ramp launches the car into the air',jp)
  ok(landed and landed['s']>jp['s1'],'and it lands on the far side of the gap',[landed,jp])
  if SHOTS:A.evaluate(step,3);A.screenshot(path=OUT+'/drive_jump.png',timeout=180000)
  A.keyboard.press('e');A.evaluate(step,6);ok(not A.evaluate("VO3.driving()") and A.evaluate("VO3.dbg().meAv.mode")=='free','E gets you out and you keep walking on the deck',A.evaluate(wk))
  ok(not errs,'no page errors',errs[:5])
  print('%d/%d'%(sum(res),len(res)))
  b.close()
finally:
  srv.terminate()
