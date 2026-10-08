"""Screen share and camera on the Sales Floor (the build that is live): the owner shares the screen, John sees it on the stage;
John turns on the camera, the owner sees it; then the share stops and the stage clears."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8796;SITE=os.environ.get('SITE',SP+'/web/test/site_prod');OUT=SP+'/web/test/shots'
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--disable-webgl','--no-proxy-server','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--auto-select-desktop-capture-source=Entire screen','--autoplay-policy=no-user-gesture-required','--disable-features=WebRtcHideLocalIpsWithMdns']
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:500]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
def until(X,js,secs,arg=None):
    t=time.time()
    while time.time()-t<secs:
        try:
            if (X.evaluate(js,arg) if arg is not None else X.evaluate(js)):return True
        except Exception:pass
        X.wait_for_timeout(400)
    return False
CALL="(id)=>!!(VC.pcs[id]&&VC.pcs[id].connectionState==='connected'&&VC.rs[id]&&Object.keys(VC.rs[id]).length)"
VID="(id)=>{const m=VC.rs[id]||{};return Object.keys(m).filter(k=>m[k].getVideoTracks().some(t=>t.readyState==='live')).length}"
def floor(X):X.evaluate("openTab('Team Chat');CH.ch='__voice';go()");X.wait_for_timeout(500)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1366,'height':860},permissions=['microphone','camera'])
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  errs={}
  def page(tag,user):
      pg=ctx.new_page();errs[tag]=[];pg.on('pageerror',lambda e:errs[tag].append(str(e)[:200]));pg.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps(user));return pg
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=page('A',{'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'})
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  ok(A.evaluate("window.OWQ_BUILD")=='2026-10-05 21:15 UTC','testing the build that is live ('+str(A.evaluate("window.OWQ_BUILD"))+')')
  lgx.login(A,2);A.wait_for_timeout(800)
  B=page('B',{'uid':'uJohn','email':'john@example.com','displayName':'John Montini'})
  B.goto(URL);B.wait_for_function("OWQC.phase==='out'",timeout=30000);B.click('#owqgi');B.wait_for_function("OWQC.phase==='pending'",timeout=30000)
  B.click('#owqgr');B.wait_for_function("OWQC.reqd===true",timeout=10000)
  A.evaluate("OWQC.team()");A.wait_for_timeout(1200);A.select_option('#owqrn0','John Montini');A.click("#md button:has-text('Approve')");A.wait_for_timeout(1200);A.evaluate("OWQC.teamClose()")
  B.reload();B.wait_for_function("OWQC.phase==='in'",timeout=30000);lgx.login(B,3);B.wait_for_timeout(1200)
  floor(A);floor(B)
  B.evaluate("vcJoin()");B.wait_for_timeout(1500);A.evaluate("vcJoin()")
  bid=B.evaluate("vcMe()");aid=A.evaluate("vcMe()")
  ok(until(A,CALL,25,bid) and until(B,CALL,25,aid),'Cole and John are connected on the floor')
  # screen share from Cole (a real click: browsers only allow screen share from a click)
  floor(A);A.click("button:has-text('Share Screen')")
  ok(until(A,"!!VC.scr",10),'Cole is sharing the screen',A.evaluate("VC.err||''"))
  ok(until(B,VID,25,aid),'John receives the shared screen',B.evaluate("JSON.stringify({rs:Object.keys(VC.rs).map(k=>[k,Object.keys(VC.rs[k]).length]),pcs:Object.values(VC.pcs).map(p=>p.connectionState+'/'+p.signalingState)})"))
  ok(until(B,"(()=>{const v=document.querySelector('.vcst video');return !!(v&&v.videoWidth>0&&!v.paused)})()",20),'John sees it playing on the stage')
  B.screenshot(path=OUT+'/screen_john.png')
  # camera from John
  B.click("button:has-text('Camera On')")
  ok(until(B,"!!VC.cam",10),'John turned his camera on',B.evaluate("VC.err||''"))
  ok(until(A,VID,25,bid),'Cole receives John\'s camera')
  ok(until(A,CALL,5,bid) and until(B,CALL,5,aid),'the call stays connected after both changes')
  A.screenshot(path=OUT+'/screen_cole.png')
  # stop the share
  A.click("button:has-text('Stop Sharing')")
  ok(until(B,"!document.querySelector('.vcst')",20),'when Cole stops sharing, the stage clears for John')
  d=[x for x in A.evaluate("__FAKE.call('dump')")['docs'] if x.startswith('diag/')]
  print('diag docs',len(d))
  ok(all(not v for v in errs.values()),'no page errors',errs)
  b.close()
finally:
  srv.terminate()
print('RESULT',sum(res),'/',len(res))
