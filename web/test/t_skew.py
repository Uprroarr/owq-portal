"""Sales Floor calls must not depend on computer clocks: one person's clock is 10 minutes behind (then ahead), they join in
the order that broke it, and the call still connects both ways. Also: a call whose connection dies is re-dialled by itself."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8791;SITE=os.environ.get('SITE',SP+'/web/test/site')
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--disable-webgl','--no-proxy-server','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required','--disable-features=WebRtcHideLocalIpsWithMdns']
SKEW="(function(){var sk=0;try{sk=+sessionStorage.getItem('skew')||0}catch(e){}if(!sk)return;window.__SKEW=sk;var dn=Date.now;Date.now=function(){return dn.call(Date)+sk}})();"
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:400]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
ST="Object.values(VC.pcs).map(p=>p.connectionState)"
def both(A,B,secs):
    a=bb=None
    for i in range(int(secs*2)):
        a=A.evaluate(ST);bb=B.evaluate(ST)
        if 'connected' in a and 'connected' in bb and A.evaluate("Object.keys(VC.rs).length>=1") and B.evaluate("Object.keys(VC.rs).length>=1"):return True,[a,bb]
        time.sleep(0.5)
    return False,[a,bb]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1366,'height':860},permissions=['microphone','camera'])
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  ctx.add_init_script(SKEW)
  errs={'A':[],'B':[]}
  def page(tag,user):
      pg=ctx.new_page();pg.on('pageerror',lambda e:errs[tag].append(str(e)[:200]))
      pg.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps(user));return pg
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=page('A',{'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'})
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,6);A.wait_for_timeout(800)
  B=page('B',{'uid':'uJohn','email':'john@example.com','displayName':'John Montini'})
  B.goto(URL);B.wait_for_function("OWQC.phase==='out'",timeout=30000);B.click('#owqgi');B.wait_for_function("OWQC.phase==='pending'",timeout=30000)
  B.click('#owqgr');B.wait_for_function("OWQC.reqd===true",timeout=10000)
  A.evaluate("OWQC.team()");A.wait_for_timeout(1200);A.select_option('#owqrn0','John Montini');A.click("#md button:has-text('Approve')");A.wait_for_timeout(1200);A.evaluate("OWQC.teamClose()")
  def relog(skew):
      B.evaluate("s=>sessionStorage.setItem('skew',String(s))",skew);B.reload();B.wait_for_function("OWQC.phase==='in'",timeout=30000);lgx.login(B,3);B.wait_for_timeout(1500)
  # 1. B's clock 10 minutes behind; A is on the floor first, B walks on after (the order that failed for Cole's desktop)
  relog(-600000)
  ok(abs(B.evaluate("Date.now()")-A.evaluate("Date.now()")+600000)<5000,'test setup: the second computer\'s clock is 10 minutes behind')
  A.evaluate("vcJoin()");A.wait_for_timeout(2500);B.evaluate("vcJoin()")
  c,info=both(A,B,25);ok(c,'clock behind + joined last: the call connects and both hear each other',info)
  off=B.evaluate("typeof OWQC.off==='number'?OWQC.off:null");ok(off is not None and abs(off-600000)<5000,'the portal knows how far off that clock is',off)
  ok(B.evaluate("VC.__skewTold===1"),'that person gets a heads-up about the clock')
  B.evaluate("vcLeave()");A.evaluate("vcLeave()");A.wait_for_timeout(1500)
  # 2. B's clock 10 minutes ahead; B is on the floor first, A walks on after
  relog(600000)
  B.evaluate("vcJoin()");B.wait_for_timeout(2500);A.evaluate("vcJoin()")
  c,info=both(A,B,25);ok(c,'clock ahead + joined first: the call connects and both hear each other',info)
  # 3. the connection dies on one side: it is re-dialled by itself
  A.evaluate("Object.values(VC.pcs).forEach(p=>p.close());0");t0=time.time()
  c,info=both(A,B,70);ok(c,'a call whose connection dies is re-dialled automatically (%.0fs)'%(time.time()-t0),info)
  d=[x for x in A.evaluate("__FAKE.call('dump')")['docs'] if x.startswith('diag/')]
  ok(len(d)>=1,'join/redial diagnostics recorded',d)
  ok(not errs['A'] and not errs['B'],'no page errors',errs)
  b.close()
finally:
  srv.terminate()
print('RESULT',sum(res),'/',len(res))
