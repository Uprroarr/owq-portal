"""Smoke test for the v102-v105 features on the v106 build: Shop, Loot Crates, Brainstorm Board page, desk arcade."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8888;SITE=os.environ.get('SITE',SP+'/web/test/site_w');OUT=SP+'/web/test/shots'
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
res=[]
def ok(c,m,i=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(i)[:300]),flush=True)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1280,'height':760},permissions=['microphone','camera'])
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still');localStorage.setItem('owq_vo',JSON.stringify({list:0,demo:0,ava:'',auto:1,sfx:0}))}catch(e){}")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:300]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(800)
  txt="(()=>{const m=document.querySelector('main')||document.body;return m.innerText.slice(0,4000)})()"
  A.evaluate("openTab('Shop')");A.wait_for_timeout(6000);t=A.evaluate(txt)
  ok('SHOP' in t.upper() and ('CREDIT' in t.upper() or 'BUY' in t.upper()),'the Shop page renders',t[:200])
  n=A.evaluate("document.querySelectorAll('.eci').length");ok(n>=3,'the Shop lists items with prices (%d cards)'%n,n)
  A.screenshot(path=OUT+'/v105_shop.png',timeout=180000)
  A.evaluate("openTab('Loot Crates')");A.wait_for_timeout(2500);t=A.evaluate(txt)
  ok('CRATE' in t.upper(),'the Loot Crates page renders',t[:200])
  A.evaluate("openTab('Team Chat');CH.ch='__voice';go()");A.wait_for_timeout(3000)
  A.evaluate("vcJoin()");A.wait_for_timeout(2000);A.evaluate("VO3.dbg().fast=true")
  A.wait_for_function("(()=>{const m=VO3.dbg().meAv;return m&&m.mode==='seated'})()",timeout=240000)
  A.evaluate("brdOpen()");A.wait_for_timeout(3000)
  ok(A.evaluate("!!(typeof BRD!=='undefined'&&BRD.open)"),'the Brainstorm Board opens on the Sales Floor')
  A.screenshot(path=OUT+'/v105_board.png',timeout=180000)
  A.evaluate("brdClose()");A.wait_for_timeout(2000)
  ok(A.evaluate("!(typeof BRD!=='undefined'&&BRD.open)"),'and closes')
  ok(A.evaluate("(()=>{const O=VO3.dbg();return !!(O.arc&&O.arc.can(O.meAv))})()"),'at my desk the arcade is available')
  A.evaluate("VO3.dbg().arc.enter()");A.wait_for_timeout(2500)
  ok(A.evaluate("!!VO3.dbg().arc.on"),'the desk arcade opens')
  A.screenshot(path=OUT+'/v105_arcade.png',timeout=180000)
  A.evaluate("VO3.dbg().arc.exit()");A.wait_for_timeout(1500)
  ok(not A.evaluate("!!VO3.dbg().arc.on"),'and closes again')
  ok(A.evaluate("VO3.dbg().meAv.mode")in('seated','sitting'),'still seated at the desk',A.evaluate("VO3.dbg().meAv.mode"))
  ok(not errs and not A.evaluate("VO3.dbg().errs||0"),'no page errors',errs[:4])
  print('%d/%d'%(sum(res),len(res)))
  b.close()
finally:
  srv.terminate()
