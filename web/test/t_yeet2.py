"""Two people on the floor: Cole throws John across the room; John's screen shows him going out the window (and tells him who did it),
Cole's screen shows the throw. Software WebGL, small windows."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8801;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots'
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required','--disable-features=WebRtcHideLocalIpsWithMdns']
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:400]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':900,'height':560},permissions=['microphone','camera'])
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still');localStorage.setItem('owq_vo',JSON.stringify({list:0,demo:0,ava:'',auto:1,sfx:1}))}catch(e){}")
  errs={}
  def page(tag,user):
      pg=ctx.new_page();errs[tag]=[];pg.on('pageerror',lambda e:errs[tag].append(str(e)[:200]));pg.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps(user));return pg
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=page('A',{'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'})
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(800)
  B=page('B',{'uid':'uJohn','email':'john@example.com','displayName':'John Montini'})
  B.goto(URL);B.wait_for_function("OWQC.phase==='out'",timeout=30000);B.click('#owqgi');B.wait_for_function("OWQC.phase==='pending'",timeout=30000)
  B.click('#owqgr');B.wait_for_function("OWQC.reqd===true",timeout=10000)
  A.evaluate("OWQC.team()");A.wait_for_timeout(1200);A.select_option('#owqrn0','John Montini');A.click("#md button:has-text('Approve')");A.wait_for_timeout(1200);A.evaluate("OWQC.teamClose()")
  B.reload();B.wait_for_function("OWQC.phase==='in'",timeout=30000);lgx.login(B,3);B.wait_for_timeout(1000)
  for X in (A,B):X.evaluate("openTab('Team Chat');CH.ch='__voice';go()")
  A.wait_for_timeout(2500)
  for X in (A,B):X.evaluate("VO3.dbg()&&(VO3.dbg().fast=true)")
  B.evaluate("vcJoin()");A.evaluate("vcJoin()")
  bid=B.evaluate("vcMe()")
  ok(A.wait_for_function("id=>VO3.targets().some(x=>x.id===id&&x.ok)",arg=bid,timeout=120000) is not None,'John is at his desk on Cole\'s screen')
  ok(B.wait_for_function("VO3.dbg()&&VO3.dbg().meAv&&VO3.dbg().meAv.mode==='seated'",timeout=120000) is not None,'John is seated on his own screen')
  ok(A.evaluate("id=>VO3.yeet(id)",bid),'Cole goes to throw John')
  ok(A.wait_for_function("(()=>{const m=VO3.dbg().meAv;return m&&m.yeetA&&m.mode!=='seated'})()",timeout=5000) is not None,'Cole gets up and walks over')
  ok(B.wait_for_function("document.body.innerText.indexOf('is coming for you')>=0",timeout=15000) is not None,'John is warned that Cole is coming for him')
  ok(B.wait_for_function("(()=>{const m=VO3.dbg().meAv;return m&&m.yeet&&['lift','hold','fly','land','lie','up'].indexOf(m.yeet.ph)>=0})()",timeout=60000) is not None,'on John\'s screen, Cole picks him up and throws him')
  B.wait_for_timeout(1500);B.screenshot(path=OUT+'/yeet2_john.png');A.screenshot(path=OUT+'/yeet2_cole.png')
  ok(B.wait_for_function("(()=>{const m=VO3.dbg().meAv;return m&&m.mode==='seated'&&!m.yeet})()",timeout=150000) is not None,'John ends up back at his desk')
  ok(A.wait_for_function("(()=>{const m=VO3.dbg().meAv;return m&&m.mode==='seated'&&!m.yeetA})()",timeout=60000) is not None,'Cole ends up back at his desk')
  ok(all(not v for v in errs.values()),'no page errors',errs)
  b.close()
finally:
  srv.terminate()
print('RESULT',sum(res),'/',len(res))
