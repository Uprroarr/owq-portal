"""Sidebar dropdown: Business Performance > Portfolio for the owner only."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8822;SITE=os.environ.get('SITE',SP+'/web/test/site_ln');URL='http://127.0.0.1:%d/index.html'%PORT
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:300]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
SUBS="[...document.querySelectorAll('.nsubs .nsb')].map(b=>b.textContent.replace(/^\\W+/,'').trim())"
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  ctx=b.new_context(viewport={'width':1280,'height':860});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(1500)
  A.evaluate("openTab('Business Performance')");A.wait_for_timeout(1500)
  s=A.evaluate(SUBS);ok(s==['Summary','Income','Expenses','Statement','Portfolio'],'Cole sees Summary, Income, Expenses, Statement, Portfolio in the dropdown',s)
  A.click(".nsubs .nsb:has-text('Portfolio')");A.wait_for_timeout(1500)
  ok(A.evaluate("SUB['Business Performance']")=='Portfolio' and A.evaluate("!!document.getElementById('pfw')||/portfolio/i.test(document.querySelector('main,#main,body').innerText.slice(0,3000))"),'clicking it opens the Portfolio page')
  ok(A.evaluate("[...document.querySelectorAll('.nsubs .nsb.on')].map(b=>b.textContent.trim()).join()").endswith('Portfolio'),'and Portfolio is highlighted in the dropdown')
  A.screenshot(path=SP+'/web/test/shots/pfnav.png')
  # someone else: no Portfolio
  A.evaluate("WHO='Austin Vardzel';openTab('Business Performance','Summary')");A.wait_for_timeout(1200)
  s2=A.evaluate(SUBS);ok('Portfolio' not in s2,'a teammate does not see Portfolio',s2)
  ok(not errs,'no page errors',errs)
  b.close()
finally:srv.terminate()
print('%d/%d'%(sum(res),len(res)))
