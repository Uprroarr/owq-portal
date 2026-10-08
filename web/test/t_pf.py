"""Business Portfolio: owner-only tab under Business Performance; buy stock + crypto, live prices (CoinGecko / Finnhub, faked
here) every refresh, average-cost P&L, partial sell with realized P&L, key handling, manual price fallback, value line point,
private storage (only the owner's own path), persistence, phone layout, no page errors."""
import sys,os,time,json,subprocess,re
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8806;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots'
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--disable-webgl','--no-proxy-server']
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:500]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
PX={'bitcoin':[64000,2.5],'ethereum':[3200,-1.2],'dogwifcoin':[2.0,5.0]}
STK={'AAPL':[170.0,1.2,0.71],'TSLA':[250.0,-5.0,-1.96]}
KEY='TESTKEY1234567890'
calls={'cg':0,'fh':0,'bad':0,'mk':0,'sp':0};MK={'fail':False}
def route_cg(r):
    u=r.request.url
    if '/search' in u:
        q=re.search(r'query=([A-Za-z0-9]+)',u).group(1).upper()
        coins=[{'id':'dogwifcoin','symbol':'WIF','name':'dogwifhat','market_cap_rank':60}] if q=='WIF' else []
        return r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps({'coins':coins}))
    if '/market_chart' in u:return r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps({'prices':[]}))
    calls['cg']+=1
    ids=re.search(r'ids=([^&]+)',u).group(1).split(',')
    if '/coins/markets' in u:
        calls['mk']+=1
        if MK['fail']:return r.fulfill(status=500,content_type='application/json',headers={'access-control-allow-origin':'*'},body='{}')
        body=[{'id':i,'symbol':i[:4],'current_price':PX[i][0],'price_change_percentage_24h':PX[i][1],'sparkline_in_7d':{'price':[PX[i][0]*(0.9+0.0012*k) for k in range(168)]}} for i in ids if i in PX]
        return r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps(body))
    calls['sp']+=1
    body={i:{'usd':PX[i][0],'usd_24h_change':PX[i][1]} for i in ids if i in PX}
    r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps(body))
def route_fh(r):
    u=r.request.url;calls['fh']+=1
    tok=re.search(r'token=([^&]+)',u).group(1);sym=re.search(r'symbol=([^&]+)',u).group(1)
    if tok!=KEY:calls['bad']+=1;return r.fulfill(status=401,content_type='application/json',headers={'access-control-allow-origin':'*'},body='{"error":"Invalid API key"}')
    q=STK.get(sym)
    body={'c':q[0],'d':q[1],'dp':q[2],'pc':q[0]-q[1],'t':1} if q else {'c':0,'d':None,'dp':None,'pc':0,'t':0}
    r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps(body))
def kpis(X):return X.evaluate("[...document.querySelectorAll('#pfw .pf-k .c')].map(c=>[c.querySelector('h4').textContent,c.querySelector('.v').textContent.trim()])")
def num(s):return float(re.sub(r'[^0-9.\-]','',s.replace('+','')) or 'nan')
def add(X,t,sym,q,p,kind=None,fee=None):
    X.evaluate("t=>pfAdd(t)",t);X.wait_for_timeout(250)
    if t=='buy':
        X.fill('#pf-s',sym);X.dispatch_event('#pf-s','input')
        if kind:X.select_option('#pf-k',kind)
    else:
        X.select_option('#pf-s',sym);X.evaluate("pfSellPick()")
    X.fill('#pf-q',str(q));X.fill('#pf-p',str(p))
    if fee is not None:X.fill('#pf-f',str(fee))
    X.click("#md .pf-mb .btn:not(.o)");X.wait_for_timeout(500)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1440,'height':900})
  ctx.route('**/api.coingecko.com/**',route_cg);ctx.route('**/finnhub.io/**',route_fh)
  ctx.route('**/api.coinbase.com/**',lambda r:r.fulfill(status=503,body='no'))
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  errs={}
  def page(tag,user):
      pg=ctx.new_page();errs[tag]=[];pg.on('pageerror',lambda e:errs[tag].append(str(e)[:200]));pg.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps(user));return pg
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=page('A',{'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'})
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(800)
  A.evaluate("openTab('Business Performance')");A.wait_for_function("PF.owner===true",timeout=10000);A.wait_for_timeout(400)
  ok(A.locator(".seg button:has-text('Portfolio')").count()==1,'the owner sees a Portfolio tab under Business Performance')
  A.click(".seg button:has-text('Portfolio')");A.wait_for_function("!!document.getElementById('pfw')&&PF.ready&&document.getElementById('pfw').textContent.indexOf('Loading your portfolio')<0",timeout=10000)
  A.screenshot(path=OUT+'/pf_empty.png')
  ok('start your portfolio' in A.inner_text('#pfw').lower() and 'finnhub' in A.inner_text('#pfw').lower(),'an empty portfolio explains how to start (and how stocks get live prices)',A.inner_text('#pfw')[:300])
  ok(A.evaluate("getComputedStyle(document.querySelector('#main .note')).display")=='none','the note about browser-only data is hidden on the portfolio page')
  # 1. buy crypto (auto-guessed type) and a stock
  add(A,'buy','BTC',0.5,60000)
  add(A,'buy','AAPL',10,150,fee=5)
  ok(A.evaluate("PF.data.tx.length")==2 and A.evaluate("PF.data.tx.find(x=>x.sym==='BTC').k")=='crypto','two buys saved, BTC recognized as crypto',A.evaluate("JSON.stringify(PF.data.tx)"))
  A.evaluate("pfTick(1)");A.wait_for_function("!PF.busy",timeout=8000);A.wait_for_timeout(300)
  ok(A.evaluate("PF.px['crypto:BTC']&&PF.px['crypto:BTC'].p")==64000,'BTC gets its live price')
  ok(A.evaluate("(PF.s7['crypto:BTC']||[]).length")==168 and A.locator('#pfw .pf-tb td.pf-trc svg').count()>=1,'BTC shows its 7 day trend line')
  MK['fail']=True;PX['bitcoin']=[64100,2.6];A.evaluate("pfTick(1)");A.wait_for_function("!PF.busy",timeout=8000)
  ok(A.evaluate("PF.px['crypto:BTC'].p")==64100,'if the markets feed fails, the simple price feed still prices BTC')
  MK['fail']=False;PX['bitcoin']=[64000,2.5];A.evaluate("pfTick(1)");A.wait_for_function("!PF.busy",timeout=8000);A.wait_for_timeout(200)
  t=A.inner_text('#pfw');ok('add your free Finnhub key' in t,'without a key the stock asks for one')
  # 2. Finnhub key: a wrong one is refused, the right one works
  A.evaluate("pfSettings()");A.fill('#pf-fk','WRONGKEY0000000');A.click("#md .pf-mb .btn:not(.o)");A.wait_for_timeout(300);A.wait_for_function("!PF.busy",timeout=8000);A.wait_for_timeout(300)
  ok('refused the key' in A.inner_text('#pfw'),'a wrong key is reported')
  A.evaluate("pfSettings()");ok(A.evaluate("document.getElementById('pf-fk').type")=='password' and 'ends in 0000' in A.evaluate("document.getElementById('pf-fk').placeholder"),'the key field is hidden and only shows the last 4 characters')
  A.fill('#pf-fk',KEY);A.click("#md .pf-mb .btn:not(.o)");A.wait_for_timeout(300);A.wait_for_function("!PF.busy",timeout=8000);A.wait_for_timeout(400)
  ok(A.evaluate("PF.px['stock:AAPL']&&PF.px['stock:AAPL'].p")==170,'with the right key AAPL gets its live price')
  K1=dict(kpis(A));print('KPIS',K1)
  ok(abs(num(K1['Portfolio Value'])-(0.5*64000+10*170))<0.01,'value = 0.5 x 64,000 + 10 x 170 = 33,700',K1)
  ok(abs(num(K1['Cost Basis'])-(30000+1505))<0.01,'cost basis includes the fee: 31,505',K1)
  ok(abs(num(K1['Total P&L'])-(33700-31505))<0.01,'total P&L = +2,195',K1)
  exp_day=32000-32000/1.025+1700-1700/1.0071
  ok(abs(num(K1['Today'])-exp_day)<0.05,'today = BTC +2.5%% and AAPL +0.71%% of their values (%.2f)'%exp_day,K1)
  # 3. a partial sale: average-cost realized P&L
  add(A,'sell','BTC',0.2,65000)
  K2=dict(kpis(A));print('KPIS2',K2)
  ok(abs(num(K2['Portfolio Value'])-(0.3*64000+1700))<0.01,'after selling 0.2 BTC the value is 0.3 x 64,000 + 1,700',K2)
  ok('closed +$1,000.00' in K2['Total P&L'] or 'closed +$1,000.00' in A.inner_text('#pfw .pf-k'),'realized P&L of the sale is +1,000 (0.2 x (65,000 - 60,000))',A.inner_text('#pfw .pf-k'))
  A.evaluate("pfAdd('sell')");A.wait_for_timeout(200);A.select_option('#pf-s','BTC');A.evaluate("pfSellPick()");A.fill('#pf-q','5');A.fill('#pf-p','1');A.click("#md .pf-mb .btn:not(.o)");A.wait_for_timeout(200)
  ok('You only hold' in A.inner_text('#pf-e'),'selling more than you hold is refused');A.evaluate("closeM()")
  # 4. an unknown coin is looked up; a stock without a price can be set by hand
  add(A,'buy','WIF',100,1.5,kind='crypto');add(A,'buy','ZZZZ',3,10,kind='stock')
  A.evaluate("pfTick(1)");A.wait_for_function("!PF.busy",timeout=8000);A.wait_for_timeout(300)
  ok(A.evaluate("PF.px['crypto:WIF']&&PF.px['crypto:WIF'].p")==2.0,'an unknown coin (WIF) is found and priced')
  ok(A.locator("#pfw .pf-tb button.pf-set").count()>=1,'a symbol with no live price offers Set price')
  A.evaluate("pfSetPrice('stock','ZZZZ')");A.fill('#pf-mp','12');A.click("#md .pf-mb .btn:not(.o)");A.wait_for_timeout(300)
  ok(A.evaluate("PF.data.mp['stock:ZZZZ'].p")==12 and 'by hand' in A.inner_text('#pfw .pf-tb'),'a price set by hand is used and marked')
  # 5. prices move: the next refresh updates values and flashes
  PX['bitcoin']=[66000,3.0];STK['AAPL']=[172.0,3.2,1.9]
  A.evaluate("pfTick(1)");A.wait_for_function("!PF.busy",timeout=8000);A.wait_for_timeout(200)
  ok(A.evaluate("PF.px['crypto:BTC'].p")==66000 and A.evaluate("PF.flash['crypto:BTC']")=='up','the next refresh picks up the new prices (BTC flashes up)')
  ok(A.locator('#pfw .pf-px.up').count()>=1,'the price cell flashes green')
  # 6. value line: a point every 5 minutes while prices are fresh
  ok(A.evaluate("PF.data.hist.length")>=1,'a value point is recorded')
  A.screenshot(path=OUT+'/pf_desk.png',full_page=False)
  A.evaluate("RAIL=false;railApply()");A.wait_for_timeout(700);A.evaluate("document.querySelector('#pfw .pf-g2').scrollIntoView()");A.wait_for_timeout(200)
  ok(A.evaluate("getComputedStyle(document.querySelector('#pfw th.pf-trc')).display")!='none','with room to spare the table shows the trend column')
  A.screenshot(path=OUT+'/pf_desk_wide.png');A.evaluate("RAIL=true;railApply()");A.wait_for_timeout(400)
  # 7. private storage
  docs=A.evaluate("__FAKE.call('dump')")['docs']
  pk=[d for d in docs if d.startswith('data/users/uOwner/portfolio')]
  ok(len(pk)==1,"the portfolio is stored only under the owner's private path",[d for d in docs if 'portfolio' in d])
  # 8. persistence
  A.wait_for_timeout(800);A.reload();A.wait_for_function("OWQC.phase==='in'",timeout=30000);lgx.login(A,2);A.wait_for_timeout(600)
  A.evaluate("openTab('Business Performance');SUB['Business Performance']='Portfolio';go()");A.wait_for_function("PF.ready&&PF.data.tx.length>=5",timeout=15000)
  ok(A.evaluate("PF.data.tx.length")==5 and A.evaluate("PF.data.fk")==KEY,'transactions and the key are still there after a reload')
  # 9. other people never see it
  B=page('B',{'uid':'uJohn','email':'john@example.com','displayName':'John Montini'})
  B.goto(URL);B.wait_for_function("OWQC.phase==='out'",timeout=30000);B.click('#owqgi');B.wait_for_function("OWQC.phase==='pending'",timeout=30000)
  B.click('#owqgr');B.wait_for_function("OWQC.reqd===true",timeout=10000)
  A.evaluate("OWQC.team()");A.wait_for_timeout(1200);A.select_option('#owqrn0','John Montini');A.click("#md button:has-text('Approve')");A.wait_for_timeout(1200);A.evaluate("OWQC.teamClose()")
  B.reload();B.wait_for_function("OWQC.phase==='in'",timeout=30000);lgx.login(B,3);B.wait_for_timeout(800)
  B.evaluate("openTab('Business Performance')");B.wait_for_timeout(1500)
  ok(B.locator(".seg button:has-text('Portfolio')").count()==0,'a teammate does not get a Portfolio tab')
  B.evaluate("SUB['Business Performance']='Portfolio';go()");B.wait_for_timeout(500)
  ok(B.evaluate("!document.getElementById('pfw')"),'even forcing it, a teammate gets the normal Business Performance page')
  got=B.evaluate("(async()=>{try{const db=await claude.use('db');const s=await db.doc('data/users/uOwner/portfolio').get();return s.exists?'READ':'none'}catch(e){return 'denied'}})()")
  ok(got!='READ',"a teammate cannot read the owner's portfolio",got)
  # 10. phone layout
  A.bring_to_front();A.set_viewport_size({'width':390,'height':844});A.evaluate("try{RAIL=false;railApply()}catch(e){};go()");A.wait_for_timeout(600)
  r=A.evaluate("({cards:document.querySelectorAll('#pfw .pf-cd').length,table:getComputedStyle(document.querySelector('#pfw .pf-tb .sc')).display,sw:document.documentElement.scrollWidth,w:innerWidth})")
  ok(r['cards']>=3 and r['table']=='none' and r['sw']<=r['w']+1,'on a phone the holdings show as cards with no sideways scrolling',r)
  A.screenshot(path=OUT+'/pf_phone.png',full_page=False)
  A.evaluate("document.querySelector('#pfw .pf-g2').scrollIntoView()");A.wait_for_timeout(200);A.screenshot(path=OUT+'/pf_phone_2.png')
  A.evaluate("document.querySelector('#pfw .pf-cds').scrollIntoView()");A.wait_for_timeout(200);A.screenshot(path=OUT+'/pf_phone_cards.png')
  A.evaluate("pfAdd('buy')");A.wait_for_timeout(300);A.screenshot(path=OUT+'/pf_phone_add.png');A.evaluate("closeM()")
  print('calls',calls)
  ok(all(not v for v in errs.values()),'no page errors',errs)
  b.close()
finally:
  srv.terminate()
print('RESULT',sum(res),'/',len(res))
