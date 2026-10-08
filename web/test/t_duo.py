"""Two people: walking shows up on each other's floor, a car knocks a walker over (both screens), and the Home Run
Derby queue hands the plate to the next person."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8884;SITE=os.environ.get('SITE',SP+'/web/test/site_w');OUT=SP+'/web/test/shots'
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--disable-background-timer-throttling','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding','--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
res=[]
def ok(c,m,i=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(i)[:400]),flush=True)
def until(pg,js,sec=10):
    t=time.time()
    while time.time()-t<sec:
        try:
            if pg.evaluate(js):return True
        except Exception:pass
        pg.wait_for_timeout(300)
    return False
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1000,'height':640},permissions=['microphone','camera'])
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still');localStorage.setItem('owq_vo',JSON.stringify({list:0,demo:0,ava:'',auto:1,sfx:0}))}catch(e){}")
  errs={}
  def page(tag,user):
      pg=ctx.new_page();errs[tag]=[];pg.on('pageerror',lambda e:errs[tag].append(str(e)[:200]));pg.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps(user));return pg
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=page('A',{'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'})
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000);lgx.login(A,2);A.wait_for_timeout(800)
  B=page('B',{'uid':'uJohn','email':'john@example.com','displayName':'John Montini'})
  B.goto(URL);B.wait_for_function("OWQC.phase==='out'",timeout=30000);B.click('#owqgi');B.wait_for_function("OWQC.phase==='pending'",timeout=30000)
  B.click('#owqgr');B.wait_for_function("OWQC.reqd===true",timeout=10000)
  A.evaluate("OWQC.team()");A.wait_for_timeout(1200);A.select_option('#owqrn0','John Montini');A.click("#md button:has-text('Approve')");A.wait_for_timeout(1200);A.evaluate("OWQC.teamClose()")
  B.reload();B.wait_for_function("OWQC.phase==='in'",timeout=30000);lgx.login(B,3);B.wait_for_timeout(1000)
  for P in (A,B):P.evaluate("openTab('Team Chat');CH.ch='__voice';go()")
  A.wait_for_timeout(2500)
  for P in (A,B):P.evaluate("vcJoin()")
  A.wait_for_timeout(2000)
  for P in (A,B):P.evaluate("try{VO3.dbg().fast=true}catch(e){}")
  ok(until(A,"(()=>{const m=VO3.dbg().meAv;return m&&m.mode==='seated'})()",300) and until(B,"(()=>{const m=VO3.dbg().meAv;return m&&m.mode==='seated'})()",300),'setup: Cole and John are seated')
  A.evaluate("voApi.setLook('W8')");A.wait_for_timeout(1500)
  # John walks; Cole sees him
  B.bring_to_front();B.evaluate("(()=>{const O=VO3.dbg();O.cardA=O.meAv;O.cardAct('walk')})()");B.wait_for_timeout(800)
  B.evaluate("(()=>{const w=VO3.dbg().meAv.wk;w.x=-4;w.z=1.5})()");B.wait_for_timeout(2500)
  print('John on his own screen',B.evaluate("(()=>{const w=VO3.dbg().meAv.wk;return w&&{x:w.x,z:w.z,f:w.f}})()"),flush=True)
  A.bring_to_front()
  seen=until(A,"(()=>{const a=[...VO3.dbg().av.values()].find(x=>x.nm==='John Montini');return a&&a.wk&&a.mode==='free'&&Math.abs(a.root.position.x+4)<.6})()",15)
  ok(seen,'Cole sees John get up and walk to where he is',A.evaluate("(()=>{const a=[...VO3.dbg().av.values()].find(x=>x.nm==='John Montini');return a&&{m:a.mode,x:a.root.position.x,z:a.root.position.z,wk:a.p&&a.p.wk}})()"))
  # Cole drives into John
  A.evaluate("voDrive()");A.wait_for_timeout(1500)
  B.bring_to_front();ok(until(B,"(()=>{const a=[...VO3.dbg().av.values()].find(x=>x.nm==='Cole Leckey');return a&&a.drv})()",15),'John sees Cole\'s car');A.bring_to_front()
  A.evaluate("(()=>{const d=VO3.dbg().drive.me.drv;d.x=-7.2;d.z=1.5;d.h=0;d.v=6})()")
  A.keyboard.down('w');hitA=until(A,"(()=>{const a=[...VO3.dbg().av.values()].find(x=>x.nm==='John Montini');return a&&a.knd})()",12);A.keyboard.up('w')
  ok(hitA,'driving into John knocks him over on Cole\'s screen')
  B.bring_to_front();hitB=until(B,"(()=>{const a=VO3.dbg().meAv;return a&&(a.knd||VO3.dbg().walk.kn>0)})()",15)
  ok(hitB,'and John sees himself get knocked over too')
  B.wait_for_timeout(800);B.screenshot(path=OUT+'/duo_knock_john.png',timeout=180000)
  A.bring_to_front();A.keyboard.press('e');A.wait_for_timeout(1200)
  # Home Run Derby queue
  for P in (A,B):
    P.bring_to_front();P.evaluate("(()=>{const W=VO3.dbg().walk;if(!W.me){const O=VO3.dbg();O.cardA=O.meAv;O.cardAct('walk')}})()");P.wait_for_timeout(800)
    P.evaluate("(()=>{const W=VO3.dbg().walk;W.me.wk.x=8;W.me.wk.z=-6.4;W.ride('r')})()");P.wait_for_timeout(2500)
  A.bring_to_front();A.evaluate("(()=>{const W=VO3.dbg().walk,w=W.me.wk;w.x=-15.6;w.z=18.6})()");A.wait_for_timeout(800);A.evaluate("VO3.dbg().walk.use()")
  ok(until(A,"!!VO3.dbg().derby.turn",15),'Cole presses START and bats')
  A.wait_for_timeout(1500)
  B.bring_to_front();B.evaluate("(()=>{const W=VO3.dbg().walk,w=W.me.wk;w.x=-15.6;w.z=18.8})()");B.wait_for_timeout(1500)
  pt=None
  for k in range(20):
    pt=B.evaluate("(()=>{const p=VO3.dbg().walk.prompt();return p&&p.t})()")
    if pt and 'QUEUE' in pt:break
    B.wait_for_timeout(500)
  ok(pt and 'QUEUE' in pt,'John sees JOIN THE DERBY QUEUE while Cole bats',pt)
  B.evaluate("VO3.dbg().walk.use()");B.wait_for_timeout(1500)
  B.screenshot(path=OUT+'/duo_park_john.png',timeout=180000)
  A.bring_to_front()
  ok(until(A,"(()=>{const s=VO3.dbg().derby.state();return s.queue.some(x=>x.nm==='John Montini')})()",15),'Cole\'s scoreboard shows John on deck',A.evaluate("(()=>{const s=VO3.dbg().derby.state();return s.queue.map(x=>x.nm)})()"))
  A.screenshot(path=OUT+'/duo_park_cole.png',timeout=180000)
  A.evaluate("VO3.dbg().derby.finish()");A.wait_for_timeout(1500)
  B.bring_to_front();ok(until(B,"!!VO3.dbg().derby.turn",20),'when Cole is done, John is up')
  B.wait_for_timeout(1000)
  A.bring_to_front();ok(until(A,"(()=>{const s=VO3.dbg().derby.state();return s.batter&&s.batter.nm==='John Montini'})()",15),'and Cole sees John at bat')
  B.bring_to_front();B.evaluate("VO3.dbg().derby.finish()")
  for t,e in errs.items():ok(not e,'no page errors on '+t,e[:3])
  print('%d/%d'%(sum(res),len(res)))
  b.close()
finally:
  srv.terminate()
