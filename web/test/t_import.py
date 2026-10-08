"""Owner imports the claude.ai data export on the website version; the portal then shows the team's real data."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8791;SITE=SP+'/web/test/site';URL='http://127.0.0.1:%d/index.html'%PORT
J=json.load(open(SP+'/web/private/owq-migration.json'))
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:300]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  ctx=b.new_context(viewport={'width':1366,'height':860});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  errs=[];A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
  A.add_init_script("window.__FAKE_SIGNIN={uid:'uOwner',email:'owner@example.com',displayName:'Cole Leckey'};")
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  ok(A.evaluate("Object.keys(PWD).length")==0,'no access codes in the page before import')
  A.evaluate("j=>OWQC.importDocs(j)",J)
  A.wait_for_timeout(4500);A.wait_for_function("window.OWQC&&OWQC.phase==='in'",timeout=40000)
  d=A.evaluate("__FAKE.call('dump')")['docs']
  ok(sum(1 for x in d if x.startswith('chat/'))==190 and sum(1 for x in d if x.startswith('rec/'))>=43,'all records imported',len(d))
  ok('cfg/codes' in d,'access codes stored in the protected config')
  ok(A.evaluate("Object.keys(PWD).length")==5,'codes loaded after sign-in (page holds none until then)')
  lgx.login(A,6);A.wait_for_timeout(2500)
  ok(A.evaluate("CH.live&&CH.msgs.length>=150"),'Team Chat shows the imported history',A.evaluate("[CH.live,CH.msgs.length]"))
  ok(A.evaluate("SYN.on===1||SYN.on===true"),'shared data layer on')
  A.screenshot(path=SP+'/web/test/shots/after_import.png')
  ok(not errs,'no page errors',errs)
  b.close()
finally:srv.terminate()
print('RESULT',sum(res),'/',len(res))
