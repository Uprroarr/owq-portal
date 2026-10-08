"""Sales Floor pop-out: the floor moves into its own window (no intro, same operator), the portal window steps off and says
the floor is in its own window, the teammate keeps hearing us, Bring it back returns the floor (and the call) to the portal,
closing the floor window or locking the portal ends it, the floor window keeps the portal from signing out for inactivity,
other pages open in the portal window, and phones get no pop-out button."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8794;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots';os.makedirs(OUT,exist_ok=True)
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--disable-webgl','--no-proxy-server','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required','--disable-features=WebRtcHideLocalIpsWithMdns']
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:400]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
def until(X,js,secs,arg=None):
    t=time.time()
    while time.time()-t<secs:
        try:
            if (X.evaluate(js,arg) if arg is not None else X.evaluate(js)):return True
        except Exception:pass
        time.sleep(0.4)
    return False
CALL="(id)=>!!(VC.pcs[id]&&VC.pcs[id].connectionState==='connected'&&VC.rs[id]&&Object.keys(VC.rs[id]).length)"
def floor(X):X.evaluate("openTab('Team Chat');CH.ch='__voice';go()");X.wait_for_timeout(500)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1366,'height':860},permissions=['microphone','camera'])
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  ctx.add_init_script("(function(){try{if(window.name==='owqfloor'&&localStorage.getItem('denyMic')==='1'&&navigator.mediaDevices){navigator.mediaDevices.getUserMedia=function(){return Promise.reject(Object.assign(new Error('denied'),{name:'NotAllowedError'}))}}}catch(e){}})();")
  errs={}
  def watch(tag,pg):errs[tag]=[];pg.on('pageerror',lambda e:errs[tag].append(str(e)[:200]));return pg
  def page(tag,user):
      pg=watch(tag,ctx.new_page());pg.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps(user));return pg
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=page('A',{'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'})
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,6);A.wait_for_timeout(800)
  B=page('B',{'uid':'uJohn','email':'john@example.com','displayName':'John Montini'})
  B.goto(URL);B.wait_for_function("OWQC.phase==='out'",timeout=30000);B.click('#owqgi');B.wait_for_function("OWQC.phase==='pending'",timeout=30000)
  B.click('#owqgr');B.wait_for_function("OWQC.reqd===true",timeout=10000)
  A.evaluate("OWQC.team()");A.wait_for_timeout(1200);A.select_option('#owqrn0','John Montini');A.click("#md button:has-text('Approve')");A.wait_for_timeout(1200);A.evaluate("OWQC.teamClose()")
  B.reload();B.wait_for_function("OWQC.phase==='in'",timeout=30000);lgx.login(B,3);B.wait_for_timeout(1200)
  B.evaluate("vcJoin()");B.wait_for_timeout(1500);A.evaluate("vcJoin()")
  bid=B.evaluate("vcMe()");aid=A.evaluate("vcMe()")
  ok(until(A,CALL,25,bid) and until(B,CALL,25,aid),'setup: owner and John are on the floor and connected')
  floor(A)
  ok(A.locator('button.sfw-b').count()==1,'the Sales Floor has a Pop out button')
  # 1. pop out while on the floor
  with A.expect_popup() as pi:A.click('button.sfw-b')
  P=watch('P',pi.value)
  ok(until(P,"window.SFW&&SFW.entered&&ONLINE===1",30),'the floor window opens signed in, without the login screen')
  ok(P.evaluate("WHO")=='Agency Owner','the floor window is the same operator',P.evaluate("WHO"))
  ok(P.evaluate("!(GXU.U&&GXU.U.on)&&!LB.st&&(!LB.au||LB.au.paused)"),'no intro and no lobby music in the floor window')
  ok(P.evaluate("getComputedStyle(document.querySelector('aside')).display==='none'&&!!document.getElementById('sfwbar')&&!!document.getElementById('vcp')"),'the floor window shows only the floor (with its own top bar)')
  ok(until(P,"VC.on===1||VC.on===true",20),'the floor window walks onto the floor by itself')
  ok(until(A,"!VC.on&&!!document.querySelector('.sfw-ph')",10),'the portal window steps off and shows that the floor is in its own window')
  pid=P.evaluate("vcMe()")
  ok(until(B,CALL,30,pid) and until(P,CALL,30,bid),'John and the floor window are connected both ways')
  ok(not B.evaluate("(id)=>!!(VC.pcs[id]&&VC.pcs[id].connectionState==='connected')",aid),'John is no longer connected to the old portal window')
  ok(until(A,"document.querySelector('.sfw-ph')&&document.querySelector('.sfw-ph').textContent.indexOf('LIVE IN THE FLOOR WINDOW')>=0",10),'the portal window shows the floor window is live')
  A.wait_for_timeout(600);A.screenshot(path=OUT+'/popout_portal.png');P.screenshot(path=OUT+'/popout_window.png')
  # 2. joining in the portal window is blocked while the floor window is open
  A.evaluate("vcJoin()");A.wait_for_timeout(800);ok(not A.evaluate("VC.on"),'the portal window does not join a second time while the floor window is open')
  # 3. activity: being on the floor in the floor window keeps the portal window signed in
  A.evaluate("LASTACT=Date.now()-50*60000");ok(until(A,"Date.now()-LASTACT<15000",9),'the floor window keeps the portal window from signing out for inactivity')
  # 4. other pages open in the portal window
  P.evaluate("openTab('Leaderboard')");P.wait_for_timeout(600)
  ok(P.evaluate("tab==='Team Chat'&&CH.ch==='__voice'"),'the floor window stays on the floor when a page link is used')
  ok(until(A,"tab==='Leaderboard'",5),'that page opens in the portal window instead')
  floor(A)
  # 5. bring it back
  A.click("button:has-text('Bring it back here')")
  t0=time.time();closed=False
  while time.time()-t0<8:
      if P.is_closed():closed=True;break
      A.wait_for_timeout(300)
  ok(closed,'Bring it back here closes the floor window')
  ok(until(A,"VC.on&&!document.querySelector('.sfw-ph')&&!SFW.out",15),'the floor is back in the portal window and it is on the floor again')
  ok(until(A,CALL,30,bid),'the portal window is connected to John again')
  # 5b. the floor window cannot use the microphone (blocked there): you stay on the floor in the portal window
  A.evaluate("localStorage.setItem('denyMic','1')")
  with A.expect_popup() as pi:A.click('button.sfw-b')
  P4=watch('P4',pi.value);ok(until(P4,"window.SFW&&SFW.entered",30),'pop-out with the microphone blocked in the new window opens it')
  P4.wait_for_timeout(5000)
  ok(not P4.evaluate("VC.on") and A.evaluate("!!VC.on"),'blocked microphone there: the floor window does not take over and you stay on the floor in the portal window')
  ok(until(A,CALL,10,bid),'the portal window is still connected to John')
  ok('still on the floor in this window' in A.inner_text('.sfw-ph'),'the portal window says you are still on the floor there')
  P4.click("#sfwbar button")
  t0=time.time();closed=False
  while time.time()-t0<8:
      if P4.is_closed():closed=True;break
      A.wait_for_timeout(300)
  ok(closed and until(A,"VC.on&&!SFW.out&&!document.querySelector('.sfw-ph')",8),'Back to the portal closes it and the floor is back in the portal window, still on the floor')
  A.evaluate("localStorage.removeItem('denyMic')")
  # 6. closing the floor window by hand
  with A.expect_popup() as pi:A.click('button.sfw-b')
  P2=watch('P2',pi.value);ok(until(P2,"VC.on===1||VC.on===true",30),'second pop-out walks on')
  ok(until(A,"!VC.on",10),'portal window stepped off again')
  p2id=P2.evaluate("vcMe()");P2.close();ok(until(A,"!SFW.out&&!document.querySelector('.sfw-ph')",6),'closing the floor window puts the floor back in the portal window')
  ok(until(B,"(id)=>!VC.pcs[id]||VC.pcs[id].connectionState!=='connected'",20,p2id),'John sees the closed floor window leave')
  # 7. pop out while off the floor, walk on there, then lock the portal
  with A.expect_popup() as pi:A.click('button.sfw-b')
  P3=watch('P3',pi.value);ok(until(P3,"window.SFW&&SFW.entered",30),'pop-out while off the floor opens the floor window')
  P3.wait_for_timeout(2500);ok(not P3.evaluate("VC.on"),'it does not walk on by itself when you were not on the floor')
  ok('Walk onto the floor from that window' in A.inner_text('.sfw-ph'),'the portal window says to walk on from the floor window')
  P3.evaluate("vcJoin()");ok(until(A,"SFW.on===1",12),'the portal window sees the floor window walk on')
  A.evaluate("lockView()")
  t0=time.time();closed=False
  while time.time()-t0<8:
      if P3.is_closed():closed=True;break
      A.wait_for_timeout(300)
  ok(closed,'locking the portal closes the floor window (no open mic left behind)')
  # 8. phones: no pop-out button
  B.set_viewport_size({'width':390,'height':800});floor(B)
  ok(B.locator('button.sfw-b').count()==0,'phones do not get a Pop out button')
  ok(all(not v for v in errs.values()),'no page errors',errs)
  b.close()
finally:
  srv.terminate()
print('RESULT',sum(res),'/',len(res))
