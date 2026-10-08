"""Business Performance > Expenses shows every expense type."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8828;SITE=os.environ.get('SITE',SP+'/web/test/site_ln');URL='http://127.0.0.1:%d/index.html'%PORT
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
  lgx.login(A,2);A.wait_for_timeout(1200)
  A.evaluate("""(()=>{const t=new Date().toISOString().slice(0,10);D.expenses=D.expenses.filter(x=>0);
    [['Leads',300,20],['Training',150],['Marketing',90],['Software',49],['Licensing and E&O',220],['Office',35],['Other',12],['Marketing',60]].forEach(([c,a,l],i)=>D.expenses.push({d:t,cat:c,amt:a,leads:l||0,src:c==='Leads'?'Vendor X':'',n:'test '+i}));
    for(let i=0;i<30;i++)D.expenses.push({d:'2026-0'+(1+i%8)+'-1'+(i%9),cat:'Software',amt:10,leads:0,src:'',n:'old '+i});save();openTab('Business Performance','Expenses')})()""")
  A.wait_for_timeout(1200)
  cats=A.evaluate("[...document.querySelectorAll('.ext tr td:first-child')].map(t=>t.textContent.trim())")
  ok(cats[:7]==['Leads','Training','Marketing','Software','Licensing and E&O','Office','Other'],'By Category lists all 7 expense types',cats)
  t=A.inner_text('#main')
  ok('TOTAL EXPENSES' in t.upper() and 'THIS MONTH' in t.upper(),'Total Expenses and This Month cards')
  n=A.evaluate("document.querySelectorAll('.exf ~ .c tr').length-1");ok(n==25,'all types listed in the entries (first 25, newest first)',n)
  A.click(".exmore");A.wait_for_timeout(600);n=A.evaluate("document.querySelectorAll('.exf ~ .c tr').length-1");ok(n==38,'Show all lists every entry',n)
  A.click(".exf button:has-text('Marketing')");A.wait_for_timeout(600)
  rows=A.evaluate("[...document.querySelectorAll('.exf ~ .c tr')].slice(1).map(r=>r.children[1].textContent)")
  ok(rows==['Marketing','Marketing'],'the Marketing filter shows only Marketing',rows)
  A.click(".exf button:has-text('All')");A.wait_for_timeout(400)
  A.screenshot(path=SP+'/web/test/shots/exptab.png',full_page=True)
  ok(not errs,'no page errors',errs)
  b.close()
finally:srv.terminate()
print('%d/%d'%(sum(res),len(res)))
