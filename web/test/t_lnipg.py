"""Insurance Product Guide: study the PDF, opening it completes the section, next section is offered."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8844;SITE=os.environ.get('SITE',SP+'/web/test/site_ln');URL='http://127.0.0.1:%d/index.html'%PORT
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:400]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  ctx=b.new_context(viewport={'width':1280,'height':900});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(1500)
  m=A.evaluate("(()=>{const m=LNM.find(x=>x.id==='bp-insurance-product-guide');return {doc:m.doc,slides:m.slides.length,quiz:!!m.quiz}})()")
  ok(m['doc']==1 and m['slides']==1 and not m['quiz'],'the module is just the document (no walkthrough, no quiz)',m)
  A.evaluate("openTab('Learning Network')");A.wait_for_timeout(600);A.evaluate("lnOpen('bp-insurance-product-guide')");A.wait_for_timeout(1000)
  t=A.inner_text('#lnb') if A.locator('#lnb').count() else ''
  ok('Opening it completes this section' in t,'it tells agents to open the document to finish',t[:300])
  ok('Complete' in t and 'Guided walkthrough' not in t,'the steps show Study the document then Complete',t[:200])
  A.screenshot(path=SP+'/web/test/shots/lnipg_1.png')
  A.click('.lndpi');A.wait_for_timeout(1200)
  ok(A.evaluate("LN.mode")=='result' and A.evaluate("!!lnRec(WHO,'bp-insurance-product-guide')"),'clicking the PDF completes the section',A.evaluate("LN.mode"))
  A.evaluate("closeM()");A.wait_for_timeout(600)
  t=A.inner_text('#lnb');A.screenshot(path=SP+'/web/test/shots/lnipg_2.png')
  nx=A.evaluate("(()=>{const T=LNM.filter(x=>x.tr===1),i=T.findIndex(x=>x.id==='bp-insurance-product-guide');const n=T.slice(i+1).find(x=>!x.soon);return n?n.t:''})()")
  ok(nx and nx in t,'the result screen offers the next section ('+str(nx)+')',t[:400])
  ok(not errs,'no page errors',errs)
  b.close()
finally:srv.terminate()
print('%d/%d'%(sum(res),len(res)))
