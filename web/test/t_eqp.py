"""Production Equation: lead buys in any category count as lead spend; Weekly / Monthly tracking with a
50 hour per workday goal across 4 licensed agents."""
import sys,os,time,json,subprocess,datetime,re
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8849;SITE=os.environ.get('SITE',SP+'/web/test/site_lcat');URL='http://127.0.0.1:%d/index.html'%PORT
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:500]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
T=datetime.date.today();MON=T-datetime.timedelta(days=T.weekday());k=lambda d:d.isoformat()
def wd(a,b):
  n=0;d=a
  while d<=b:
    n+=d.weekday()<5;d+=datetime.timedelta(days=1)
  return n
m0=T.replace(day=1);m1=(m0.replace(month=m0.month%12+1,year=m0.year+(m0.month==12))-datetime.timedelta(days=1))
WDM=wd(m0,m1);ELM=max(1,wd(m0,T));ELW=max(1,wd(MON,T))
other_in_month=[d for d in [m0,m0+datetime.timedelta(days=1)] if d<MON]
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
  early=k(other_in_month[0]) if other_in_month else None
  data={'act':[{'d':k(T),'h':12,'con':5,'app':1,'ag':'Cole Leckey'},{'d':k(MON),'h':8,'con':2,'app':0,'ag':'Nate Johnson'},{'d':'2025-01-06','h':99,'con':0,'app':0}]+([{'d':early,'h':30,'con':0,'app':0}] if early else []),
        'ex':[{'d':k(T),'cat':'Leads','amt':700,'leads':20,'src':'Test'},{'d':k(MON),'cat':'Marketing','amt':200,'src':'Aged leads vendor'},{'d':k(T),'cat':'Other','amt':150,'leads':10},{'d':k(T),'cat':'Office','amt':80,'n':'Lead Vault subscription'},
              {'d':k(T),'cat':'Marketing','amt':90,'n':'Ads and content'},{'d':k(T),'cat':'Training','amt':60,'n':'Leadership coaching on real-time leads'},{'d':'2025-01-07','cat':'Leads','amt':500}]+([{'d':early,'cat':'Leads','amt':300}] if early else [])}
  A.evaluate("d=>{D.activity.push(...d.act);D.expenses.push(...d.ex)}",data)
  s=A.evaluate("(()=>{const s=S();return {lead:s.lead,self:s.self}})()")
  ok(s['lead']==1630+(300 if early else 0),'all-time lead spend counts Leads + miscategorized lead buys only',s)
  ok(s['self']==60,'training stays self-investment',s)
  A.evaluate("eqSetP('wk');openTab('Production Equation')");A.wait_for_timeout(2600)
  w=A.evaluate("eqPer('wk')");tx=A.evaluate("document.body.innerText")
  ok(w['h']==20 and w['goalH']==250 and w['paceH']==50*ELW and w['lead']==1130,'weekly: this week only, goal 250 hrs (50/day x 5)',w)
  ok('HOURS THIS WEEK' in tx and 'Goal 250 hrs' in tx and 'across 4 licensed agents' in tx and 'LEAD SPEND THIS WEEK' in tx,'weekly cards',tx[tx.find('HOURS'):tx.find('HOURS')+400])
  ok('$1,130' in tx and '4 lead expenses' in tx,'weekly lead card matches the week\'s lead expenses',tx[tx.find('LEAD SPEND'):tx.find('LEAD SPEND')+200])
  A.screenshot(path=SP+'/web/test/shots/eqp_wk.png')
  A.click(".eqtg button:has-text('Monthly')");A.wait_for_timeout(2600)
  m=A.evaluate("eqPer('mo')");tx=A.evaluate("document.body.innerText")
  ok(A.evaluate("EQP")=='mo' and A.evaluate("localStorage.getItem('owq_eqp')")=='mo','toggle switches to Monthly and remembers it')
  ok(m['goalH']==50*WDM and m['paceH']==50*ELM and m['h']==20+(30 if early else 0) and m['lead']==1130+(300 if early else 0),'monthly: whole month, 50/day x workdays',m)
  ok('HOURS THIS MONTH' in tx and ('Goal %s hrs'%format(50*WDM,',')) in tx and 'LEAD SPEND THIS MONTH' in tx,'monthly cards',tx[tx.find('HOURS'):tx.find('HOURS')+300])
  ok('Hours vs pace' in A.inner_html('body'),'path chart axes compare with pace')
  A.screenshot(path=SP+'/web/test/shots/eqp_mo.png')
  A.evaluate("openTab('Command Deck')");A.wait_for_timeout(1500)
  t=A.evaluate("[...document.querySelectorAll('.apx-pkf')].map(e=>e.innerText).join('|')").upper()
  ok('HOURS/MO' in t and 'LEADS/MO' in t,'Command Deck peek follows the period',t)
  A.evaluate("openTab('Agency Performance','Expenses')");A.wait_for_timeout(1500)
  n=A.evaluate("document.body.innerText.split('counts as leads').length-1")
  ok(n>=3,'expense table marks miscategorized lead buys',n)
  ok(not errs,'no page errors',errs)
  b.close()
finally:srv.terminate()
print('%d/%d'%(sum(res),len(res)))
