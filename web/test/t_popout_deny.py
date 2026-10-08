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
  # 5b. the floor window cannot use the microphone (blocked there): you stay on the floor in the portal window
  A.evaluate("localStorage.setItem('denyMic','1')")
  with A.expect_popup() as pi:A.click('button.sfw-b')
  P4=watch('P4',pi.value);ok(until(P4,"window.SFW&&SFW.entered",30),'pop-out with the microphone blocked in the new window opens it')
  P4.wait_for_timeout(5000)
  print('DBG P4',P4.evaluate("JSON.stringify({on:VC.on,err:VC.err||'',mainOn:SFW.mainOn,gum:String(navigator.mediaDevices.getUserMedia).slice(0,60),ss:localStorage.getItem('denyMic')})"),'A',A.evaluate("JSON.stringify({on:VC.on,out:SFW.out,moving:SFW.moving})"))
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
  ok(all(not v for v in errs.values()),'no page errors',errs)
  b.close()
finally:
  srv.terminate()
print('RESULT',sum(res),'/',len(res))
