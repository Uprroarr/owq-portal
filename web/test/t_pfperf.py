"""Portfolio performance chart (1D-1Y, real history, live end point, 30 s refresh). Based on the Business Portfolio test: owner-only tab under Business Performance; buy stock + crypto, live prices (CoinGecko / Finnhub, faked
here) every refresh, average-cost P&L, partial sell with realized P&L, key handling, manual price fallback, value line point,
private storage (only the owner's own path), persistence, phone layout, no page errors."""
import sys,os,time,json,subprocess,re
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8824;SITE=os.environ.get('SITE',SP+'/web/test/site_ln');OUT=SP+'/web/test/shots'
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
import datetime as DT
calls['mc']=[];calls['td']=[]
def route_cg2(r):
    u=r.request.url
    if '/market_chart' in u:
        days=int(re.search(r'days=(\d+)',u).group(1));calls['mc'].append(days);now=time.time()*1000
        step=3e5 if days==1 else 36e5 if days<=90 else 864e5;n=int(days*864e5/step)
        pr=[[now-days*864e5+i*step,60000+4000*i/n] for i in range(n+1)]
        return r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps({'prices':pr}))
    return route_cg(r)
def route_td(r):
    u=r.request.url;calls['td'].append(u)
    iv=re.search(r'interval=([^&]+)',u).group(1);n=int(re.search(r'outputsize=(\d+)',u).group(1))
    step={'5min':300,'30min':1800,'2h':7200,'1day':86400}[iv];now=time.time();vals=[]
    for i in range(n):
        t=DT.datetime.utcfromtimestamp(now-i*step);vals.append({'datetime':t.strftime('%Y-%m-%d') if iv=='1day' else t.strftime('%Y-%m-%d %H:%M:%S'),'close':str(170-20*i/n)})
    r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps({'status':'ok','values':vals}))
def d_ago(n):return (DT.date.today()-DT.timedelta(days=n)).isoformat()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1440,'height':900})
  ctx.route('**/api.coingecko.com/**',route_cg2);ctx.route('**/finnhub.io/**',route_fh);ctx.route('**/api.twelvedata.com/**',route_td)
  ctx.route('**/api.coinbase.com/**',lambda r:r.fulfill(status=503,body='no'))
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  errs={}
  def page(tag,user):
      pg=ctx.new_page();errs[tag]=[];pg.on('pageerror',lambda e:errs[tag].append(str(e)[:200]));pg.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps(user));return pg
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=page('A',{'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'})
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear();localStorage.removeItem('owq_pfh')");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(800)
  A.evaluate("openTab('Business Performance','Portfolio')");A.wait_for_function("PF.owner===true&&PF.ready",timeout=10000);A.wait_for_timeout(500)
  # holdings: BTC bought 20 days ago, AAPL 5 days ago
  A.evaluate("([a,b])=>{PF.data.tx.push({id:'t1',t:'buy',k:'crypto',sym:'BTC',q:0.5,px:50000,fee:0,d:a,ts:Date.now()-20*864e5},{id:'t2',t:'buy',k:'stock',sym:'AAPL',q:10,px:150,fee:0,d:b,ts:Date.now()-5*864e5});PF.data.fk='%s';pfSave();pfPaint()}"%KEY,[d_ago(20),d_ago(5)])
  A.evaluate("pfTick(1)");A.wait_for_function("!PF.busy",timeout=8000);A.wait_for_timeout(4000)
  order=A.evaluate("[...document.querySelectorAll('#pfw > .c, #pfw > div')].map(e=>e.className)")
  ok(A.evaluate("(()=>{const t=document.querySelector('#pfw .pf-tb'),c=document.querySelector('#pfw .pf-pc');return !!t&&!!c&&!!(t.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_FOLLOWING)})()"),'the Performance chart sits under Holdings',order)
  rg=A.evaluate("[...document.querySelectorAll('.pf-pc .pf-rg button')].map(b=>b.textContent)")
  ok(rg==['1D','1W','1M','3M','6M','1Y'],'ranges 1D, 1W, 1M, 3M, 6M, 1Y',rg)
  ok(1 in calls['mc'],'1D loads real BTC history (5 minute points)',calls['mc'])
  n=A.evaluate("PF.pv&&PF.pv.T.length");ok(n and n>200,'the 1D line has a point every 5 minutes',n)
  lastv=A.evaluate("PF.pv.V[PF.pv.V.length-1]");bk=A.evaluate("pfBook().val")
  ok(abs(lastv-bk)<0.01,'the line ends at the live portfolio value',(lastv,bk))
  A.screenshot(path=OUT+'/pfperf_1d.png',full_page=True)
  for R,dd in [('1W',7),('1M',30),('3M',90),('6M',180),('1Y',365)]:
      A.click(".pf-pc .pf-rg button:has-text('%s')"%R);A.wait_for_timeout(3500)
      ok(dd in calls['mc'] and A.evaluate("document.querySelector('.pf-pc .pf-rg .on').textContent")==R,R+' loads its own BTC history',calls['mc'])
  # 1Y: BTC bought 20 days ago -> line starts flat at 0 value? it starts at the first buy
  t0=A.evaluate("PF.pv.t0");ok(abs(t0/1000-(time.time()-20*86400))<2*86400,'1Y starts at the first buy, not a year of zeros',t0)
  g=A.evaluate("document.querySelector('.pf-pc .pf-chg').innerText");ok('market gain' in g.lower(),'headline shows market gain for the range',g)
  ok('twelve data' in A.inner_text('.pf-pc').lower(),'without a Twelve Data key it offers one for stock history')
  # add a Twelve Data key
  A.evaluate("pfSettings()");A.wait_for_timeout(300);A.fill('#pf-tk','TDKEY1234567890abcd');A.click("#md .pf-mb .btn:not(.o)");A.wait_for_timeout(9000)
  ok(A.evaluate("PF.data.tk")=='TDKEY1234567890abcd','the Twelve Data key is saved')
  ok(any('symbol=AAPL' in u and 'interval=1day' in u for u in calls['td']),'stock history comes from Twelve Data',calls['td'][:2])
  ok('twelve data key' not in A.inner_text('.pf-pc').lower(),'the key prompt goes away')
  # hover
  box=A.locator('.pf-cw').bounding_box();A.mouse.move(box['x']+box['width']*.5,box['y']+box['height']*.5);A.wait_for_timeout(300)
  ok(A.evaluate("!document.getElementById('pfht').hidden&&/\\$/.test(document.getElementById('pfht').textContent)"),'hovering shows the value at that moment',A.evaluate("document.getElementById('pfht').textContent"))
  A.screenshot(path=OUT+'/pfperf_1y.png',full_page=True)
  # 30 second refresh
  A.click(".pf-pc .pf-rg button:has-text('1D')");A.wait_for_timeout(500)
  m0=calls['mk'];A.wait_for_timeout(36000)
  ok(calls['mk']-m0>=1 and A.evaluate("Date.now()-PF.last")<31000,'prices refresh every 30 seconds while the page is open',(calls['mk']-m0))
  ok('every 30 seconds' in A.inner_text('#pfw').lower(),'the page says prices refresh every 30 seconds')
  A.set_viewport_size({'width':390,'height':844});A.wait_for_timeout(800)
  ok(A.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"),'phone: no sideways scrolling')
  A.screenshot(path=OUT+'/pfperf_phone.png',full_page=True)
  ok(not errs['A'],'no page errors',errs)
  b.close()
finally:srv.terminate()
print('%d/%d'%(sum(res),len(res)))
