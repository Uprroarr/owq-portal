"""Production Equation lead spend equals logged Leads expenses."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8847;SITE=os.environ.get('SITE',SP+'/web/test/site_lsp');URL='http://127.0.0.1:%d/index.html'%PORT
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:400]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  for vw in (1280,):
   ctx=b.new_context(viewport={'width':vw,'height':900});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
   errs=[]
   K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
   A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
   A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
   A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
   A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
   lgx.login(A,2);A.wait_for_timeout(1500)
   r=A.evaluate("""(()=>{D.activity.push({d:'2026-10-01',h:10,con:5,app:1,ag:'Cole Leckey'});D.expenses.push({d:'2026-10-03',cat:'Leads',amt:700,leads:20,src:'Test'},{d:'2026-10-15',cat:'Leads',amt:300,src:'Test'},{d:'2026-10-10',cat:'Training',amt:50});
const want=D.expenses.filter(x=>x.cat==='Leads').reduce((a,x)=>a+(+x.amt||0),0);openTab('Production Equation');

return {want,lead:S().lead,wk:eqWk()}})()""");A.wait_for_timeout(2500);r['k']=A.evaluate("(document.querySelector('#main')||document.body).innerText.split('LEAD SPEND\\n')[1]||''")
   import re
   ok(abs(r['lead']-r['want'])<0.01,'S().lead equals the sum of Leads expenses',r)
   num=re.sub(r'[^0-9.]','',(r['k'].split('\n')+['',''])[1])
   ok(r['k'].startswith('$1,000'),'Production Equation Lead Spend card shows the logged lead total',r)
   ok(r['wk']>2 and r['wk']<3,'weeks span activity and lead-expense dates',r['wk'])
   A.wait_for_timeout(1200);A.screenshot(path=SP+'/web/test/shots/lsp_%d.png'%vw)
   A.evaluate("openTab('Command Deck')");A.wait_for_timeout(1500)
   t=A.evaluate("[...document.querySelectorAll('.apx-pkf')].map(e=>e.innerText).join('|')")
   ok('LEAD SPEND' in t.upper() and '$1K' in t,'Command Deck peek shows total lead spend',t)
   ok(not errs,'no page errors',errs)
   ctx.close()
  b.close()
finally:srv.terminate()
print('%d/%d'%(sum(res),len(res)))
