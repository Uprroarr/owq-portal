"""Portfolio shared with the team, view only: owner's holdings and prices reach a member; keys never leave the owner's
private doc; members cannot change it; guests do not get it; revenue counts it for everyone."""
import sys,os,time,json,subprocess,re
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8851;SITE=os.environ.get('SITE',SP+'/web/test/site_pfsh');URL='http://127.0.0.1:%d/index.html'%PORT
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:500]),flush=True)
H={'access-control-allow-origin':'*'}
def route_cg(r):
  u=r.request.url
  if '/market_chart' in u or '/search' in u:return r.fulfill(status=200,content_type='application/json',headers=H,body='{"prices":[],"coins":[]}')
  if '/coins/markets' in u:return r.fulfill(status=200,content_type='application/json',headers=H,body=json.dumps([{'id':'bitcoin','symbol':'btc','current_price':64000,'price_change_percentage_24h':2.5}]))
  r.fulfill(status=200,content_type='application/json',headers=H,body=json.dumps({'bitcoin':{'usd':64000,'usd_24h_change':2.5}}))
def route_fh(r):r.fulfill(status=200,content_type='application/json',headers=H,body=json.dumps({'c':170,'d':2,'dp':1.2,'pc':168,'t':1}))
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
def page(ctx,who,errs):
  X=ctx.new_page();X.on('pageerror',lambda e:errs.append(who['email']+': '+str(e)[:200]))
  X.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps(who));X.goto(URL);X.wait_for_function("window.__FAKE",timeout=20000);return X
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  ctx=b.new_context(viewport={'width':1280,'height':900});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  ctx.route('**/api.coingecko.com/**',route_cg);ctx.route('**/finnhub.io/**',route_fh);ctx.route('**/api.coinbase.com/**',lambda r:r.fulfill(status=503,body='no'));ctx.route('**/api.twelvedata.com/**',lambda r:r.fulfill(status=503,body='no'))
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  K.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})")
  K.evaluate("__FAKE.call('seed',{docs:[{path:'members/john@example.com',data:{name:'John Montini',role:'member',at:1}}]})")
  O=page(ctx,{'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'},errs)
  O.evaluate("sessionStorage.clear()");O.reload();O.wait_for_function("OWQC.phase==='out'",timeout=30000);O.click('#owqgi');O.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(O,2);O.wait_for_function("PF.owner===true&&PF.ready",timeout=15000)
  O.evaluate("""(()=>{PF.data.tx.push({id:'t1',t:'buy',k:'crypto',sym:'BTC',q:0.5,px:60000,d:'2026-10-01',ts:1},{id:'t2',t:'buy',k:'stock',sym:'AAPL',q:10,px:150,d:'2026-10-02',ts:2});PF.data.fk='TESTKEY1234567890';PF.data.tk='TDKEY0000';pfSave()})()""")
  O.wait_for_timeout(800);O.evaluate("pfTick(1)");O.wait_for_function("!PF.busy",timeout=8000);O.wait_for_timeout(800)
  sh=O.evaluate("PF.db.doc('pfshare/main').get().then(s=>s.exists?s.data():null)")
  ok(sh and len(sh.get('tx',[]))==2,'owner\'s portfolio is mirrored to the shared doc',sh)
  ok(sh and 'fk' not in sh and 'tk' not in sh and 'TESTKEY' not in json.dumps(sh) and 'TDKEY' not in json.dumps(sh),'API keys are never shared',sh and list(sh.keys()))
  ok(sh and sh.get('lp',{}).get('stock:AAPL',{}).get('p')==170 and sh['lp'].get('crypto:BTC',{}).get('p')==64000,'the owner\'s live prices are shared',sh and sh.get('lp'))
  J=page(ctx,{'uid':'uJohn','email':'john@example.com','displayName':'John'},errs)
  J.wait_for_function("OWQC.phase==='out'||OWQC.phase==='in'",timeout=30000)
  if J.evaluate("OWQC.phase")=='out':J.click('#owqgi');J.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(J,0);J.wait_for_function("PF.view===1&&PF.ready",timeout=15000)
  ok(J.evaluate("PF.owner")==False and J.evaluate("pfCanSee()")==True,'a member who is not the owner can see the portfolio')
  ok('Portfolio' in J.evaluate("apxTabs().join(',')"),'Portfolio tab is listed for the member')
  J.evaluate("openTab('Agency Performance','Portfolio')");J.wait_for_timeout(1500)
  t=J.inner_text('#pfw')
  ok('VIEW ONLY' in t and 'BTC' in t and 'AAPL' in t,'member sees the holdings with a view-only banner',t[:400])
  ok('$170.00' in t,'member sees the stock price from the owner\'s update',t[:600])
  vis=J.evaluate("""[...document.querySelectorAll('#pfw [onclick^="pfAdd"],#pfw [onclick^="pfDel"],#pfw [onclick^="pfSettings"],#pfw [onclick^="pfSetPrice"]')].filter(e=>e.offsetParent).length""")
  ok(vis==0,'no add / sell / delete / settings controls for the member',vis)
  hv=J.evaluate("""[...document.querySelectorAll('[onclick^="pfAdd"]')].filter(e=>e.offsetParent).length""")
  ok(hv==0 and 'Only you can see this' not in J.inner_text('body') and 'view only' in J.inner_text('body').lower(),'page header has no Buy / Sell for the member',hv)
  J.evaluate("pfAdd('buy');pfDel('t1');pfSettings()");J.wait_for_timeout(300)
  ok(J.evaluate("!document.querySelector('#md .pf-m')") and J.evaluate("PF.data.tx.length")==2,'edit functions do nothing for the member')
  ok(J.evaluate("PF.data.fk")=='' and J.evaluate("PF.data.tk")=='','member has no keys')
  w=J.evaluate("PF.db.doc('pfshare/main').set({tx:[]}).then(()=>'ok',e=>'denied')")
  ok(w=='denied','the database refuses a member writing the shared portfolio',w)
  ok(J.evaluate("S().pv")==O.evaluate("S().pv") and J.evaluate("S().pv")>0,'revenue counts the portfolio for the member too',[J.evaluate("S().pv"),O.evaluate("S().pv")])
  J.screenshot(path=SP+'/web/test/shots/pfsh_member.png')
  O.evaluate("PF.data.tx.push({id:'t3',t:'sell',k:'crypto',sym:'BTC',q:0.25,px:64000,d:'2026-10-18',ts:3});pfSave()");O.wait_for_timeout(1500)
  ok(J.evaluate("PF.data.tx.length")==3,'owner\'s new sale reaches the member live',J.evaluate("PF.data.tx.length"))
  ok(J.evaluate("S().pv")==O.evaluate("S().pv"),'revenue stays in step',[J.evaluate("S().pv"),O.evaluate("S().pv")])
  ctx.close()
  # guest pass: no portfolio
  ctx2=b.new_context(viewport={'width':1280,'height':900});G=ctx2.new_page();G.on('pageerror',lambda e:errs.append('guest: '+str(e)[:200]))
  gid=json.load(open('/home/claude/owq-src/web/src/guests.json'));gid=list(gid.keys())[0]
  G.goto(URL+'?guest='+gid);G.wait_for_timeout(6000)
  ok(G.evaluate("typeof pfCanSee==='function'&&!pfCanSee()"),'guests do not get the portfolio')
  ok(not errs,'no page errors',errs)
  b.close()
finally:srv.terminate()
print('%d/%d'%(sum(res),len(res)))
