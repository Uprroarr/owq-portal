"""A teammate approved while the live-room rules were missing gets live access once the owner signs in (member list sync)."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8794;SITE=SP+'/web/test/site';URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--disable-webgl','--no-proxy-server','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required','--disable-features=WebRtcHideLocalIpsWithMdns']
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:300]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1366,'height':860},permissions=['microphone','camera']);ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  K.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})")
  # approved in Firestore only (as happened before the Realtime Database rules were published)
  K.evaluate("__FAKE.call('seed',{docs:[{path:'members/john@example.com',data:{name:'John Montini',role:'member',at:1}}]})")
  J=ctx.new_page();J.add_init_script("window.__FAKE_SIGNIN={uid:'uJohn',email:'john@example.com',displayName:'John'};");J.goto(URL)
  J.wait_for_function("OWQC.phase==='out'",timeout=30000);J.click('#owqgi');J.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(J,3);J.evaluate("vcJoin()");J.wait_for_timeout(1500)
  ok(J.evaluate("!!OWQC.rtWarned"),'teammate gets a clear warning while the live room is blocked')
  O=ctx.new_page();O.add_init_script("window.__FAKE_SIGNIN={uid:'uOwner',email:'owner@example.com',displayName:'Cole'};");O.goto(URL)
  O.wait_for_function("OWQC.phase==='out'",timeout=30000);O.click('#owqgi');O.wait_for_function("OWQC.phase==='in'",timeout=30000);O.wait_for_timeout(2500)
  rt=K.evaluate("__FAKE.call('dump')")['rt']
  ok((rt.get('members') or {}).get('john@example,com')=='member','owner sign-in repairs the live-room member list',rt.get('members'))
  J.reload();J.wait_for_function("OWQC.phase==='in'",timeout=30000);lgx.login(J,3);J.evaluate("vcJoin()")
  lgx.login(O,6);O.evaluate("vcJoin()");O.wait_for_timeout(2500)
  ok(O.evaluate("VC.room.peers().filter(p=>p.presence&&p.presence.vc).length")==2 and J.evaluate("VC.room.peers().filter(p=>p.presence&&p.presence.vc).length")==2,'after a reload both see each other on the floor',[O.evaluate("VC.room.peers().length"),J.evaluate("VC.room.peers().length")])
  b.close()
finally:srv.terminate()
print('RESULT',sum(res),'/',len(res))
