/*PFstart*/
/* Business Portfolio (Business Performance > Portfolio, owner only): stocks and crypto with live prices every minute,
   average-cost P&L (unrealized, realized, today), allocation, value over time. Private: one document under the owner's own
   path data/users/<uid>/portfolio (nobody else can read it). Prices: CoinGecko for crypto (no key), Finnhub for stocks (a free
   key the owner pastes in Settings, stored in that same private document). Without a live price a holding can be priced by hand. */
var PF={owner:false,uid:'',db:null,ref:null,unsub:null,ready:false,data:{v:1,tx:[],fk:'',tk:'',hist:[],mp:{},ph:{}},px:{},sp:{},s7:{},st:{cg:'',fh:'',cb:''},last:0,busy:0,
 sort:'val',dir:-1,rng:'1D',txOpen:0,flash:{},seq:0,svT:0,next:0,errN:0};
var PFC=['#ff1f4f','#ffcf40','#3ddc97','#5ac8ff','#b98cff','#ff9f6b','#ff7ab6','#7cf0e0','#6d6d7a'];
/* common coins (symbol -> CoinGecko id); anything else is looked up once with CoinGecko search */
var PFCG={BTC:'bitcoin',ETH:'ethereum',SOL:'solana',XRP:'ripple',DOGE:'dogecoin',ADA:'cardano',AVAX:'avalanche-2',DOT:'polkadot',LINK:'chainlink',LTC:'litecoin',
 BNB:'binancecoin',SHIB:'shiba-inu',TRX:'tron',TON:'the-open-network',XLM:'stellar',BCH:'bitcoin-cash',UNI:'uniswap',ATOM:'cosmos',NEAR:'near',APT:'aptos',
 ARB:'arbitrum',OP:'optimism',SUI:'sui',PEPE:'pepe',USDT:'tether',USDC:'usd-coin',HBAR:'hedera-hashgraph',ICP:'internet-computer',FIL:'filecoin',AAVE:'aave',
 ETC:'ethereum-classic',XMR:'monero',KAS:'kaspa',RENDER:'render-token',INJ:'injective-protocol',SEI:'sei-network',TIA:'celestia',WIF:'dogwifcoin',BONK:'bonk',
 FET:'fetch-ai',ALGO:'algorand',VET:'vechain',MKR:'maker',CRO:'crypto-com-chain',HYPE:'hyperliquid',ENA:'ethena',ONDO:'ondo-finance',TAO:'bittensor',
 POL:'polygon-ecosystem-token',MATIC:'matic-network',TRUMP:'official-trump',XAUT:'tether-gold',PAXG:'pax-gold'};
var PFAPI={cg:'https://api.coingecko.com/api/v3',fh:'https://finnhub.io/api/v1',cb:'https://api.coinbase.com/v2'};
function pfE(s){return esc(String(s==null?'':s))}
function pfM(n,d){if(!isFinite(n))return'-';const a=Math.abs(n),dd=d!==undefined?d:2;return(n<0?'-':'')+'$'+a.toLocaleString(undefined,{minimumFractionDigits:dd,maximumFractionDigits:dd})}
function pfP(n){if(!isFinite(n))return'-';const a=Math.abs(n);if(a>=1)return pfM(n,2);if(a===0)return'$0.00';const d=Math.min(10,Math.max(4,2-Math.floor(Math.log10(a))+2));return(n<0?'-':'')+'$'+a.toFixed(d).replace(/0+$/,'').replace(/\.$/,'.00')}
function pfQ(n){if(!isFinite(n))return'-';return(+n.toFixed(8)).toLocaleString(undefined,{maximumFractionDigits:8})}
function pfPct(n){if(!isFinite(n))return'-';return(n>0?'+':'')+n.toFixed(2)+'%'}
function pfCls(n){return n>0?'pos':n<0?'neg':''}
function pfSym(s){return String(s||'').trim().toUpperCase().replace(/[^A-Z0-9.\-]/g,'').slice(0,15)}
function pfIsCrypto(s){return !!PFCG[pfSym(s)]}
function pfToday(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function pfOwnerNow(){return !!PF.owner&&(typeof WHO!=='undefined')&&(WHO==='Cole Leckey'||WHO==='Agency Owner')}
function pfShown(){return typeof tab!=='undefined'&&tab==='Business Performance'&&SUB['Business Performance']==='Portfolio'}

/* ---------- book keeping (average cost) ---------- */
function pfBook(){const H={};let real=0;
 const tx=PF.data.tx.slice().sort((a,b)=>String(a.d||'').localeCompare(String(b.d||''))||(a.ts||0)-(b.ts||0));
 tx.forEach(x=>{const key=x.k+':'+x.sym;let h=H[key];if(!h)h=H[key]={sym:x.sym,k:x.k,cg:'',q:0,cost:0,real:0,n:0,buys:0};
  const q=+x.q||0,p=+x.px||0,f=+x.fee||0;if(x.cg)h.cg=x.cg;h.n++;
  if(x.t==='sell'){const avg=h.q>0?h.cost/h.q:0,qq=Math.min(q,h.q),r=qq*p-f-avg*qq;h.real+=r;real+=r;h.cost-=avg*qq;h.q-=qq;if(h.q<1e-12){h.q=0;h.cost=0}}
  else{h.q+=q;h.cost+=q*p+f;h.buys+=q*p+f}});
 const rows=Object.values(H),open=rows.filter(h=>h.q>0);let val=0,cost=0,day=0,priced=0,dayn=0;
 open.forEach(h=>{const P=PF.px[h.k+':'+h.sym]||null,man=PF.data.mp[h.k+':'+h.sym];h.P=P;h.man=!P&&man?man:null;
  h.price=P?P.p:man?man.p:NaN;h.val=isFinite(h.price)?h.q*h.price:h.cost;h.unr=isFinite(h.price)?h.val-h.cost:0;h.unrp=h.cost>0&&isFinite(h.price)?h.unr/h.cost*100:NaN;
  h.dayv=P&&isFinite(P.dp)?h.val-h.val/(1+P.dp/100):0;h.dp=P?P.dp:NaN;h.avg=h.q>0?h.cost/h.q:0;val+=h.val;cost+=h.cost;day+=h.dayv;if(isFinite(h.price))priced++;if(P&&isFinite(P.dp))dayn++});
 open.forEach(h=>{h.alloc=val>0?h.val/val*100:0});
 return{rows,open,closed:rows.filter(h=>h.q<=0&&h.n),real,val,cost,unr:val-cost,day,dayn,priced}}
function pfHeld(k,sym){const b=pfBook(),h=b.open.find(x=>x.k===k&&x.sym===sym);return h?h.q:0}

/* ---------- storage: the owner's private document ---------- */
function pfInit(){if(PF.boot)return;PF.boot=1;const c=globalThis.claude;if(!c||!c.use){pfLocal();return}
 Promise.all([c.use('user'),c.use('db')]).then(async([u,db])=>{let own=false;try{own=!!(u&&u.isOwner&&u.isOwner())}catch(e){}PF.owner=own;
  if(!own){PF.ready=true;return}try{if(typeof tab!=='undefined'&&tab==='Business Performance')go()}catch(e){}
  let id='';try{id=u&&u.id?await u.id():''}catch(e){}PF.uid=id;
  if(!db||!id){pfLocal();pfStart();return}
  PF.db=db;PF.ref=db.doc('data/users/'+id+'/portfolio');
  PF.unsub=PF.ref.onSnapshot(s=>{const d=s&&s.exists?s.data():null;if(d&&typeof d==='object'){if((d.seq||0)<PF.seq)return;PF.data=pfClean(d)}const first=!PF.ready;PF.ready=true;if(first)pfPaint();else pfSoon()},()=>{pfLocal()});
  pfStart()}).catch(()=>{pfLocal()})}
function pfClean(d){const o={v:1,tx:Array.isArray(d.tx)?d.tx.filter(x=>x&&x.sym&&(x.t==='buy'||x.t==='sell')).slice(0,1500):[],fk:typeof d.fk==='string'?d.fk.slice(0,80):'',
 hist:Array.isArray(d.hist)?d.hist.filter(p=>Array.isArray(p)&&isFinite(p[0])&&isFinite(p[1])).slice(-2600):[],mp:d.mp&&typeof d.mp==='object'?d.mp:{},seq:d.seq||0,
 tk:typeof d.tk==='string'?d.tk.slice(0,80):'',ph:{}};if(d.ph&&typeof d.ph==='object')Object.keys(d.ph).slice(0,60).forEach(k=>{const a=d.ph[k];if(Array.isArray(a))o.ph[k]=a.filter(p=>Array.isArray(p)&&isFinite(p[0])&&isFinite(p[1])&&p[1]>0).slice(-1600)});return o}
function pfLocal(){try{const j=JSON.parse(localStorage.getItem('owq_pf')||'null');if(j)PF.data=pfClean(j)}catch(e){}PF.ready=true;pfPaint()}
function pfSave(){PF.seq=(PF.data.seq||0)+1;PF.data.seq=PF.seq;clearTimeout(PF.svT);PF.svT=setTimeout(()=>{const d=JSON.parse(JSON.stringify(PF.data));
  if(PF.ref)PF.ref.set(d).catch(e=>{toast('Could not save your portfolio: '+((e&&e.code)||'error'))});else try{localStorage.setItem('owq_pf',JSON.stringify(d))}catch(e){}},400)}

/* ---------- live prices ---------- */
async function pfGet(url,ms){const ac=typeof AbortController!=='undefined'?new AbortController():null,t=setTimeout(()=>{try{ac&&ac.abort()}catch(e){}},ms||10000);
 try{const r=await fetch(url,ac?{signal:ac.signal,cache:'no-store'}:{cache:'no-store'});if(r.status===429)throw{code:'rate'};if(r.status===401||r.status===403)throw{code:'key'};if(!r.ok)throw{code:'http'+r.status};return await r.json()}
 catch(e){if(e&&e.code)throw e;throw{code:e&&e.name==='AbortError'?'timeout':'net'}}finally{clearTimeout(t)}}
async function pfCoinId(sym){const s=pfSym(sym);if(PFCG[s])return PFCG[s];try{const j=await pfGet(PFAPI.cg+'/search?query='+encodeURIComponent(s),8000);
  const c=(j.coins||[]).filter(x=>String(x.symbol||'').toUpperCase()===s).sort((a,b)=>(a.market_cap_rank||1e9)-(b.market_cap_rank||1e9))[0];return c?c.id:''}catch(e){return''}}
function pfTrack(key,p){const a=PF.sp[key]||(PF.sp[key]=[]);const now=Date.now();if(!a.length||now-a[a.length-1][0]>45000)a.push([now,p]);else a[a.length-1]=[now,p];if(a.length>240)a.shift()}
function pfSetPx(key,p,dp,src){if(!isFinite(p)||p<=0)return;const old=PF.px[key];if(old&&old.p!==p)PF.flash[key]=p>old.p?'up':'dn';PF.px[key]={p:+p,dp:isFinite(dp)?+dp:NaN,at:Date.now(),src};pfTrack(key,+p)}
async function pfTick(force){if(!pfOwnerNow()||!PF.ready)return;if(PF.busy)return;if(!force&&typeof document!=='undefined'&&document.hidden)return;
 const b=pfBook(),cr=b.open.filter(h=>h.k==='crypto'),stk=b.open.filter(h=>h.k==='stock');if(!cr.length&&!stk.length){PF.last=Date.now();pfPaint();return}
 PF.busy=1;PF.flash={};
 try{
  if(cr.length){const need=cr.filter(h=>!h.cg&&!PFCG[h.sym]);for(const h of need){const id=await pfCoinId(h.sym);if(id){PF.data.tx.forEach(x=>{if(x.k==='crypto'&&x.sym===h.sym&&!x.cg)x.cg=id});h.cg=id;pfSave()}}
   const ids=[...new Set(cr.map(h=>h.cg||PFCG[h.sym]).filter(Boolean))];let ok=false;
   if(ids.length)try{const j=await pfGet(PFAPI.cg+'/coins/markets?vs_currency=usd&ids='+ids.join(',')+'&sparkline=true&price_change_percentage=24h&per_page=250');
     const by={};(Array.isArray(j)?j:[]).forEach(r=>{if(r&&r.id)by[r.id]=r});
     cr.forEach(h=>{const r=by[h.cg||PFCG[h.sym]];if(r&&isFinite(r.current_price)&&r.current_price>0){pfSetPx('crypto:'+h.sym,r.current_price,r.price_change_percentage_24h,'CoinGecko');ok=true;
       const sp=r.sparkline_in_7d&&r.sparkline_in_7d.price;if(Array.isArray(sp)){const v=sp.filter(x=>isFinite(x)&&x>0);if(v.length>4)PF.s7['crypto:'+h.sym]=v.slice(-168)}}});if(ok)PF.st.cg=''}catch(e){PF.st.cg=e.code||'net'}
   if(!ok&&ids.length)try{const j=await pfGet(PFAPI.cg+'/simple/price?ids='+ids.join(',')+'&vs_currencies=usd&include_24hr_change=true');
     cr.forEach(h=>{const r=j[h.cg||PFCG[h.sym]];if(r&&isFinite(r.usd)){pfSetPx('crypto:'+h.sym,r.usd,r.usd_24h_change,'CoinGecko');ok=true}});if(ok)PF.st.cg=''}catch(e){PF.st.cg=e.code||'net'}
   if(!ok){for(const h of cr){try{const j=await pfGet(PFAPI.cb+'/prices/'+encodeURIComponent(h.sym)+'-USD/spot',8000);const p=+((j.data||{}).amount);const o=PF.px['crypto:'+h.sym];pfSetPx('crypto:'+h.sym,p,o?o.dp:NaN,'Coinbase');PF.st.cb=''}catch(e){PF.st.cb=e.code||'net'}}}}
  if(stk.length){const k=PF.data.fk;if(!k)PF.st.fh='nokey';else{let bad=0;PF.st.fh='';
    for(const h of stk){try{const j=await pfGet(PFAPI.fh+'/quote?symbol='+encodeURIComponent(h.sym)+'&token='+encodeURIComponent(k),9000);
      if(j&&isFinite(j.c)&&j.c>0)pfSetPx('stock:'+h.sym,j.c,j.dp,'Finnhub');else bad++}catch(e){PF.st.fh=e.code||'net';if(e.code==='key'||e.code==='rate')break}}
    if(!PF.st.fh)PF.st.fh=bad&&bad===stk.length?'nosym':''}}
  PF.last=Date.now();pfSnap();if(pfRec())pfSave();if(pfShown())pfHNeed(PFR[PF.rng]?PF.rng:'1D')}
 finally{PF.busy=0;pfPaint()}}
/* one point on the value line every 5 minutes while every open holding has a fresh price */
function pfSnap(){const b=pfBook();if(!b.open.length)return;const now=Date.now(),fresh=b.open.every(h=>(h.P&&now-h.P.at<180000)||h.man);if(!fresh)return;
 const H=PF.data.hist,lt=H.length?H[H.length-1][0]:0;if(now-lt<300000)return;H.push([now,Math.round(b.val*100)/100]);
 if(H.length>2600){const keep=H.slice(-900),old=H.slice(0,-900).filter((p,i)=>i%2===0);PF.data.hist=old.concat(keep)}pfSave()}
function pfMaybe(){if(!pfOwnerNow()||!PF.ready||PF.busy)return;if(typeof document!=='undefined'&&document.hidden)return;const due=pfShown()?30000:300000;if(Date.now()-PF.last>=due-1500)pfTick()}
function pfStart(){if(PF.started)return;PF.started=1;setInterval(pfMaybe,5000);setTimeout(()=>pfTick(),1500);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-PF.last>28000)pfTick()})}

/* ---------- performance chart (under Holdings): real price history x what you held at each moment, live end point ---------- */
var PFR={'1D':{ms:864e5,cg:1,step:3e5,ttl:3e5,td:['5min',320],lab:'today'},'1W':{ms:6048e5,cg:7,step:18e5,ttl:18e5,td:['30min',360],lab:'this week'},
 '1M':{ms:2592e6,cg:30,step:72e5,ttl:36e5,td:['2h',380],lab:'this month'},'3M':{ms:7776e6,cg:90,step:216e5,ttl:216e5,td:['1day',100],lab:'the last 3 months'},
 '6M':{ms:15552e6,cg:180,step:432e5,ttl:432e5,td:['1day',190],lab:'the last 6 months'},'1Y':{ms:31536e6,cg:365,step:864e5,ttl:432e5,td:['1day',375],lab:'the last year'}};
var PFH={c:null,q:[],run:0,cgWait:0,tdWait:0,err:{}};
var PFAPI2={td:'https://api.twelvedata.com'};
function pfHC(){if(PFH.c)return PFH.c;PFH.c={};try{const j=JSON.parse(localStorage.getItem('owq_pfh')||'{}');if(j&&typeof j==='object')PFH.c=j}catch(e){}return PFH.c}
function pfHSave(){try{const c=pfHC(),ks=Object.keys(c);if(ks.length>80)ks.sort((a,b)=>(c[a].at||0)-(c[b].at||0)).slice(0,ks.length-80).forEach(k=>delete c[k]);localStorage.setItem('owq_pfh',JSON.stringify(c))}catch(e){}}
function pfTxT(x){const t=Date.parse(String(x.d||'')+'T00:00:00');return isFinite(t)?t:(x.ts||0)}
/* holdings that were held at some point inside [t0, now] */
function pfKeysIn(t0){const by={};PF.data.tx.forEach(x=>{const k=x.k+':'+x.sym;(by[k]||(by[k]={k:x.k,sym:x.sym,cg:'',tx:[]})).tx.push(x);if(x.cg)by[k].cg=x.cg});
 return Object.values(by).filter(o=>{o.tx.sort((a,b)=>pfTxT(a)-pfTxT(b)||(a.ts||0)-(b.ts||0));let q=0;for(const x of o.tx){const t=pfTxT(x);if(t>t0)return true;q+=x.t==='sell'?-(+x.q||0):(+x.q||0)}return q>1e-12})}
function pfHNeed(R){const r=PFR[R],now=Date.now(),c=pfHC();
 pfKeysIn(now-r.ms).forEach(o=>{const id=o.k+':'+o.sym+'|'+R,e=c[id];if(e&&now-e.at<r.ttl)return;if(PFH.q.some(j=>j.id===id))return;
  if(o.k==='crypto'){const cg=o.cg||PFCG[o.sym];if(cg)PFH.q.push({id,k:'crypto',cg,R})}else if(PF.data.tk)PFH.q.push({id,k:'stock',sym:o.sym,R})});
 if(PFH.q.length&&!PFH.run)pfHRun()}
async function pfHRun(){if(PFH.run)return;PFH.run=1;let got=0;
 try{while(PFH.q.length){const j=PFH.q[0],now=Date.now(),wait=j.k==='crypto'?PFH.cgWait:PFH.tdWait;if(now<wait){await new Promise(r=>setTimeout(r,Math.min(wait-now,15000)));continue}
   PFH.q.shift();const r=PFR[j.R];let pts=null;
   try{if(j.k==='crypto'){const d=await pfGet(PFAPI.cg+'/coins/'+encodeURIComponent(j.cg)+'/market_chart?vs_currency=usd&days='+r.cg,12000);pts=(d.prices||[]).filter(p=>p&&isFinite(p[0])&&isFinite(p[1])&&p[1]>0);PFH.cgWait=Date.now()+2500}
     else{const d=await pfGet(PFAPI2.td+'/time_series?symbol='+encodeURIComponent(j.sym)+'&interval='+r.td[0]+'&outputsize='+r.td[1]+'&timezone=UTC&apikey='+encodeURIComponent(PF.data.tk),12000);
      if(d&&d.status==='error'){const cd=+d.code;throw{code:cd===429?'rate':cd===401||cd===403?'key':'nosym'}}
      pts=(d.values||[]).map(v=>[Date.parse(String(v.datetime).replace(' ','T')+(String(v.datetime).length>10?'Z':'T21:00:00Z')),+v.close]).filter(p=>isFinite(p[0])&&p[1]>0).sort((a,b)=>a[0]-b[0]);PFH.tdWait=Date.now()+8000}
     if(pts&&pts.length){pfHC()[j.id]={at:Date.now(),pts:pts.map(p=>[Math.round(p[0]),+(+p[1]).toPrecision(8)])};got++;delete PFH.err[j.k]}}
   catch(e){const c=e&&e.code;PFH.err[j.k]=c||'net';if(c==='rate'){if(j.k==='crypto')PFH.cgWait=Date.now()+60000;else PFH.tdWait=Date.now()+61000;PFH.q.unshift(j)}else if(c==='key'){PFH.q=PFH.q.filter(x=>x.k!=='stock')}}
   if(got&&(got%3===0||!PFH.q.length)){pfHSave();pfSoon()}}}
 finally{PFH.run=0;if(got){pfHSave();pfSoon()}}}
/* price of one holding at time t: market history, then the prices this portal recorded, then the buy prices, then the live price */
function pfSer(o,R){const key=o.k+':'+o.sym,c=pfHC(),e=c[key+'|'+R],a=[];if(e&&e.pts)a.push(...e.pts);
 if(!a.length||o.k==='stock'){const rec=(PF.data.ph||{})[key];if(rec)a.push(...rec);if(!a.length||!(e&&e.pts))o.tx.forEach(x=>{if(+x.px>0)a.push([pfTxT(x)+432e5,+x.px])})}
 const P=PF.px[key];if(P)a.push([P.at,P.p]);a.sort((x,y)=>x[0]-y[0]);return a}
function pfAt(a,t){if(!a.length)return NaN;if(t<=a[0][0])return a[0][1];let lo=0,hi=a.length-1;if(t>=a[hi][0])return a[hi][1];while(hi-lo>1){const m=(lo+hi)>>1;if(a[m][0]<=t)lo=m;else hi=m}
 const p=a[lo],q=a[hi],f=(t-p[0])/((q[0]-p[0])||1);return p[1]+(q[1]-p[1])*f}
function pfPerf(R){const r=PFR[R],now=Date.now(),os=pfKeysIn(now-r.ms);if(!os.length)return null;
 let first=Infinity;os.forEach(o=>o.tx.forEach(x=>{first=Math.min(first,pfTxT(x))}));const t0=Math.max(now-r.ms,Math.min(first,now-r.step*2));
 const S=os.map(o=>({o,a:pfSer(o,R),man:PF.data.mp[o.k+':'+o.sym]}));
 const qAt=(o,t)=>{let q=0;for(const x of o.tx){if(pfTxT(x)>t)break;q+=x.t==='sell'?-(+x.q||0):(+x.q||0)}return Math.max(0,q)};
 const T=[];for(let t=t0;t<now;t+=r.step)T.push(t);T.push(now);
 const V=T.map(t=>{let v=0;S.forEach(s=>{const q=qAt(s.o,t);if(q<=0)return;let p=pfAt(s.a,t);if(!isFinite(p))p=s.man?s.man.p:NaN;if(!isFinite(p)){const b=pfBook().open.find(h=>h.k===s.o.k&&h.sym===s.o.sym);p=b?b.avg:0}v+=q*p});return v});
 let flow=0,buys=0;PF.data.tx.forEach(x=>{const t=pfTxT(x);if(t>t0&&t<=now){const amt=(+x.q||0)*(+x.px||0);if(x.t==='sell')flow-=amt-(+x.fee||0);else{flow+=amt+(+x.fee||0);buys+=amt+(+x.fee||0)}}});
 const gain=V[V.length-1]-V[0]-flow,base=V[0]+buys,pct=base>0?gain/base*100:NaN;
 const need=os.filter(o=>o.k==='crypto'?!pfHC()[o.k+':'+o.sym+'|'+R]&&(o.cg||PFCG[o.sym]):PF.data.tk&&!pfHC()[o.k+':'+o.sym+'|'+R]).length;
 const stkNo=!PF.data.tk&&os.some(o=>o.k==='stock');
 return{T,V,gain,pct,t0,now,need,stkNo,flow}}
function pfPerfCard(){const R=PFR[PF.rng]?PF.rng:'1D';const d=pfPerf(R);
 const tabs=`<div class=pf-rg role=tablist aria-label="Chart range">${Object.keys(PFR).map(k=>`<button role=tab aria-selected=${R===k} class="${R===k?'on':''}" onclick="pfRange('${k}')">${k}</button>`).join('')}</div>`;
 if(!d)return`<div class="c pf-pc"><div class=pf-ph><h4>Performance</h4>${tabs}</div><p class=pf-empty>Nothing was held during this range.</p></div>`;
 const W=900,H=250,pl=58,pr=14,pt=16,pb=26,T=d.T,V=d.V;let lo=Infinity,hi=-Infinity;V.forEach(v=>{lo=Math.min(lo,v);hi=Math.max(hi,v)});
 const pad=(hi-lo)*.14||Math.max(1,hi*.01);lo=Math.max(0,lo-pad);hi+=pad;const X=t=>pl+(t-d.t0)/((d.now-d.t0)||1)*(W-pl-pr),Y=v=>pt+(1-(v-lo)/((hi-lo)||1))*(H-pt-pb);
 const up=d.gain>=0,col=up?'#3ddc97':'#ff1f4f',pts=T.map((t,i)=>X(t).toFixed(1)+','+Y(V[i]).toFixed(1)).join(' ');
 const area='M'+X(T[0]).toFixed(1)+','+(H-pb)+' L'+pts.split(' ').join(' L')+' L'+X(T[T.length-1]).toFixed(1)+','+(H-pb)+' Z';
 const day=PFR[R].ms<=864e5,fmt=t=>{const x=new Date(t);return day?x.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):PFR[R].ms<=2592e6?x.toLocaleDateString([],{month:'short',day:'numeric'}):x.toLocaleDateString([],{month:'short',day:'numeric',year:'2-digit'})};
 let grid='';for(let i=0;i<=3;i++){const v=lo+(hi-lo)*i/3,y=Y(v).toFixed(1);grid+=`<line x1=${pl} x2=${W-pr} y1=${y} y2=${y} class=pf-gl /><text x=${pl-8} y=${(+y+3.5).toFixed(1)} text-anchor=end class=pf-tx>${pfM(v,v>=1000?0:2)}</text>`}
 let xl='';[0,.5,1].forEach(f=>{const t=d.t0+(d.now-d.t0)*f;xl+=`<text x=${X(t).toFixed(1)} y=${H-7} text-anchor=${f===0?'start':f===1?'end':'middle'} class=pf-tx>${f===1?'Now':fmt(t)}</text>`});
 const ex=X(T[T.length-1]).toFixed(1),ey=Y(V[V.length-1]).toFixed(1),by=Y(V[0]).toFixed(1);
 PF.pv={T,V,X0:pl,X1:W-pr,W,t0:d.t0,now:d.now,day,lo,hi,pt,pb,H};
 const note=d.need?'<span class=pf-ld>Loading price history&hellip;</span>':d.stkNo?`<button class=pf-tg2 onclick="pfSettings()">Add a free Twelve Data key for full stock history</button>`:(PFH.err.crypto==='rate'?'<span class=pf-ld>CoinGecko is busy, retrying&hellip;</span>':'');
 return`<div class="c pf-pc"><div class=pf-ph><h4>Performance</h4>${tabs}</div>
  <div class=pf-chg><b class="${pfCls(d.gain)}">${(d.gain>=0?'+':'')+pfM(d.gain)} (${pfPct(d.pct)})</b><small>market gain ${PFR[R].lab}${Math.abs(d.flow)>.005?' &middot; buys and sells left out':''}</small>${note}</div>
  <div class=pf-cw onmousemove="pfHover(event)" onmouseleave="pfHover(null)" ontouchmove="pfHover(event)" ontouchend="pfHover(null)">
  <svg class=pf-pl viewBox="0 0 ${W} ${H}" preserveAspectRatio=none role=img aria-label="Portfolio value ${PFR[R].lab}: ${pfM(V[0])} to ${pfM(V[V.length-1])}">
  <defs><linearGradient id=pfg2 x1=0 y1=0 x2=0 y2=1><stop offset=0 stop-color="${col}" stop-opacity=.3 /><stop offset=1 stop-color="${col}" stop-opacity=0 /></linearGradient></defs>
  ${grid}<line x1=${pl} x2=${W-pr} y1=${by} y2=${by} class=pf-bl /><path d="${area}" fill="url(#pfg2)" />
  <polyline points="${pts}" fill=none stroke="${col}" stroke-width=2.2 stroke-linejoin=round stroke-linecap=round vector-effect=non-scaling-stroke />${xl}
  <line id=pfhx x1=0 x2=0 y1=${pt} y2=${H-pb} class=pf-hx style="display:none" /></svg>
  <i class=pf-dot style="left:${(ex/W*100).toFixed(2)}%;top:${(ey/H*100).toFixed(2)}%;background:${col};box-shadow:0 0 0 4px ${col}33,0 0 14px ${col}"></i><div id=pfht class=pf-ht hidden></div></div></div>`}
function pfHover(ev){const v=PF.pv,b=document.getElementById('pfht'),l=document.getElementById('pfhx');if(!v||!b||!l)return;if(!ev){b.hidden=true;l.style.display='none';return}
 const box=ev.currentTarget.getBoundingClientRect(),cx=(ev.touches&&ev.touches[0]?ev.touches[0].clientX:ev.clientX)-box.left,x=cx/box.width*v.W;
 const f=Math.max(0,Math.min(1,(x-v.X0)/(v.X1-v.X0))),t=v.t0+(v.now-v.t0)*f;let i=0,bd=Infinity;v.T.forEach((tt,k)=>{const dd=Math.abs(tt-t);if(dd<bd){bd=dd;i=k}});
 const px=v.X0+(v.T[i]-v.t0)/((v.now-v.t0)||1)*(v.X1-v.X0);l.setAttribute('x1',px.toFixed(1));l.setAttribute('x2',px.toFixed(1));l.style.display='';
 const d=new Date(v.T[i]),ch=v.V[i]-v.V[0];b.innerHTML=`<b>${pfM(v.V[i])}</b><span class=${pfCls(ch)}>${(ch>=0?'+':'')+pfM(ch)}</span><small>${i===v.T.length-1?'Now':v.day?d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):d.toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'})+(PFR[PF.rng]&&PFR[PF.rng].ms<=2592e6?' '+d.toLocaleTimeString([],{hour:'numeric'}):'')}</small>`;
 b.hidden=false;const bw=b.offsetWidth||120;b.style.left=Math.max(0,Math.min(box.width-bw,px/v.W*box.width-bw/2))+'px'}
/* every stock price the portal sees is kept (thinned) so stocks have a history even without a Twelve Data key */
function pfRec(){const b=pfBook(),now=Date.now(),ph=PF.data.ph||(PF.data.ph={});let ch=0;
 b.open.forEach(h=>{if(h.k!=='stock'||!h.P||now-h.P.at>180000)return;const k='stock:'+h.sym,a=ph[k]||(ph[k]=[]);if(a.length&&now-a[a.length-1][0]<285000)return;a.push([now,+h.P.p.toPrecision(8)]);ch=1;
  if(a.length>1600){const out=[];let last=0;a.forEach(p=>{const age=now-p[0],gap=age<2*864e5?0:age<60*864e5?36e5:864e5;if(p[0]-last>=gap){out.push(p);last=p[0]}});ph[k]=out.slice(-1600)}});return ch}

/* ---------- drawing ---------- */
function pfHasTrend(key){return !!((PF.s7[key]&&PF.s7[key].length>4)||(PF.sp[key]&&PF.sp[key].length>1))}
function pfSpark(key,w,h){const s7=PF.s7[key],a=s7&&s7.length>4?s7.map((p,i)=>[i,p]):(PF.sp[key]||[]);if(a.length<2)return'<span class=pf-nos>&ndash;</span>';let lo=Infinity,hi=-Infinity;a.forEach(p=>{lo=Math.min(lo,p[1]);hi=Math.max(hi,p[1])});
 const r=hi-lo||hi*.001||1,pts=a.map((p,i)=>(i/(a.length-1)*w).toFixed(1)+','+(h-2-(p[1]-lo)/r*(h-4)).toFixed(1)).join(' '),up=a[a.length-1][1]>=a[0][1];
 return`<svg class=pf-sk viewBox="0 0 ${w} ${h}" width=${w} height=${h} role=img aria-label="${s7&&s7.length>4?'Last 7 days':'Since you opened the portal'}"><title>${s7&&s7.length>4?'Last 7 days':'Since you opened the portal'}</title><polyline points="${pts}" fill=none stroke="${up?'#3ddc97':'#ff6f8e'}" stroke-width=1.6 stroke-linejoin=round /></svg>`}
function pfLine(){const R={'1D':864e5,'1W':6048e5,'1M':2592e6,'ALL':Infinity}[PF.rng]||6048e5,now=Date.now(),H=PF.data.hist.filter(p=>now-p[0]<=R);
 const tabs=`<div class=pf-rg>${['1D','1W','1M','ALL'].map(k=>`<button class="${PF.rng===k?'on':''}" onclick="pfRange('${k}')">${k}</button>`).join('')}</div>`;
 if(H.length<2)return tabs+`<p class=pf-empty>Your value line fills in as prices update: one point every 5 minutes while the portal is open.</p>`;
 const W=600,Hh=190,pl=8,pr=8,pt=12,pb=22;let lo=Infinity,hi=-Infinity;H.forEach(p=>{lo=Math.min(lo,p[1]);hi=Math.max(hi,p[1])});const pad=(hi-lo)*.12||hi*.01||1;lo-=pad;hi+=pad;
 const t0=H[0][0],t1=H[H.length-1][0],X=t=>pl+(t-t0)/((t1-t0)||1)*(W-pl-pr),Y=v=>pt+(1-(v-lo)/(hi-lo))*(Hh-pt-pb);
 const pts=H.map(p=>X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1)).join(' '),area='M'+X(t0).toFixed(1)+','+(Hh-pb)+' L'+pts.split(' ').join(' L')+' L'+X(t1).toFixed(1)+','+(Hh-pb)+' Z';
 const up=H[H.length-1][1]>=H[0][1],ch=H[H.length-1][1]-H[0][1],chp=H[0][1]?ch/H[0][1]*100:0;
 const f=t=>{const d=new Date(t);return R<=864e5?d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):d.toLocaleDateString([],{month:'short',day:'numeric'})};
 return tabs+`<div class=pf-chg><b class="${pfCls(ch)}">${(ch>=0?'+':'')+pfM(ch)} (${pfPct(chp)})</b><small>over this range</small></div><svg class=pf-ln viewBox="0 0 ${W} ${Hh}" preserveAspectRatio=none role=img aria-label="Portfolio value over time">
  <defs><linearGradient id=pfg x1=0 y1=0 x2=0 y2=1><stop offset=0 stop-color="${up?'#3ddc97':'#ff1f4f'}" stop-opacity=.32 /><stop offset=1 stop-color="${up?'#3ddc97':'#ff1f4f'}" stop-opacity=0 /></linearGradient></defs>
  <line x1=${pl} x2=${W-pr} y1=${Y(hi-pad).toFixed(1)} y2=${Y(hi-pad).toFixed(1)} class=pf-gl /><line x1=${pl} x2=${W-pr} y1=${Y(lo+pad).toFixed(1)} y2=${Y(lo+pad).toFixed(1)} class=pf-gl />
  <path d="${area}" fill="url(#pfg)" /><polyline points="${pts}" fill=none stroke="${up?'#3ddc97':'#ff1f4f'}" stroke-width=2 stroke-linejoin=round vector-effect=non-scaling-stroke />
  <text x=${W-pr} y=${(Y(hi-pad)-3).toFixed(1)} text-anchor=end class=pf-tx>${pfM(hi-pad,0)}</text><text x=${W-pr} y=${(Y(lo+pad)+11).toFixed(1)} text-anchor=end class=pf-tx>${pfM(lo+pad,0)}</text>
  <text x=${pl} y=${Hh-6} class=pf-tx>${f(t0)}</text><text x=${W-pr} y=${Hh-6} text-anchor=end class=pf-tx>${f(t1)}</text></svg>`}
function pfDonut(b){const L=b.open.filter(h=>h.val>0).sort((a,c)=>c.val-a.val);if(!L.length)return`<p class=pf-empty>Add a holding to see your allocation.</p>`;
 const top=L.slice(0,7),rest=L.slice(7),seg=top.map((h,i)=>({n:h.sym,v:h.val,c:PFC[i],k:h.k}));if(rest.length)seg.push({n:'Other',v:rest.reduce((s,h)=>s+h.val,0),c:PFC[8]});
 const T=seg.reduce((s,x)=>s+x.v,0),R=54,C=2*Math.PI*R;let off=0;
 const arcs=seg.map(x=>{const l=x.v/T*C,a=`<circle r=${R} cx=70 cy=70 fill=none stroke="${x.c}" stroke-width=18 stroke-dasharray="${Math.max(0,l-1.5).toFixed(2)} ${(C-Math.max(0,l-1.5)).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 70 70)" />`;off+=l;return a}).join('');
 const st=b.open.filter(h=>h.k==='stock').reduce((s,h)=>s+h.val,0),cr=b.val-st;
 return`<div class=pf-dn><svg viewBox="0 0 140 140" width=140 height=140 role=img aria-label="Allocation">${arcs}<text x=70 y=66 text-anchor=middle class=pf-dt>${L.length}</text><text x=70 y=84 text-anchor=middle class=pf-ds>HOLDING${L.length===1?'':'S'}</text></svg>
  <div class=pf-lg>${seg.map(x=>`<div><i style="background:${x.c}"></i><b>${pfE(x.n)}</b><span>${(x.v/T*100).toFixed(1)}%</span></div>`).join('')}
  <div class=pf-mix><span>STOCKS ${b.val?(st/b.val*100).toFixed(0):0}%</span><span>CRYPTO ${b.val?(cr/b.val*100).toFixed(0):0}%</span></div></div></div>`}
function pfStatus(b){const ago=PF.last?Math.round((Date.now()-PF.last)/1000):-1,hasS=b.open.some(h=>h.k==='stock'),hasC=b.open.some(h=>h.k==='crypto'),now=Date.now();
 const chip=(ok,txt)=>`<span class="pf-chip${ok?' ok':' warn'}">${txt}</span>`,fr=k=>b.open.find(h=>h.k===k&&h.P&&now-h.P.at<300000);let cs='';
 if(hasC){const f=fr('crypto');cs+=f?chip(1,'Crypto: live ('+f.P.src+')'):chip(0,PF.last?'Crypto prices unavailable right now':'Crypto: waiting for prices')}
 if(hasS){const f=fr('stock');cs+=!PF.data.fk?`<button class="pf-chip warn" onclick="pfSettings()">Stocks: add your free Finnhub key for live prices</button>`:PF.st.fh==='key'?`<button class="pf-chip warn" onclick="pfSettings()">Stocks: Finnhub refused the key, check it</button>`:
   f?chip(1,'Stocks: live (Finnhub)'):PF.st.fh==='rate'?chip(0,'Stocks: rate limited, retrying'):PF.st.fh==='nosym'?chip(0,'Finnhub has no price for these symbols'):chip(0,PF.last?'Stock prices unavailable right now':'Stocks: waiting for prices')}
 return`<div class=pf-bar><span class="pf-live${PF.busy?' busy':''}"><i></i>${PF.busy?'UPDATING PRICES':ago<0?'WAITING FOR PRICES':'UPDATED '+new Date(PF.last).toLocaleTimeString([],{hour:'numeric',minute:'2-digit',second:'2-digit'})}</span><span class=pf-every>Prices refresh every 30 seconds</span>${cs}
  <span class=pf-bts><button class="btn o" onclick="pfTick(1)">Refresh</button><button class="btn o" onclick="pfSettings()">Settings</button></span></div>`}
function pfStartCard(first){return`<div class="c pf-start"><h4>${first?'Start your portfolio':'No open holdings'}</h4>`+
 (first?`<p>Add a stock or a coin you own: the symbol, how many, and what you paid. Prices update every minute and your profit and loss follows.</p>
  <ol class=pf-steps><li><b>Add a holding.</b> Enter a symbol like AAPL or BTC, how many you own and the price you paid.</li><li><b>Crypto prices are live right away.</b> Nothing to set up.</li><li><b>Stocks need a free Finnhub key.</b> Paste it once in Settings.</li></ol>`
  :`<p>Everything you held has been sold. Your closed profit and loss stays in the totals above.</p>`)+
 `<div class=pf-sb><button class=btn onclick="pfAdd('buy')">+ Add a holding</button>${first?'<button class="btn o" onclick="pfSettings()">Settings</button>':''}</div></div>`}
function pfRows(b){if(!b.open.length)return pfStartCard(!PF.data.tx.length);
 const K=PF.sort,dir=PF.dir,val=h=>K==='sym'?h.sym:K==='q'?h.q:K==='price'?(h.price||0):K==='dp'?(isFinite(h.dp)?h.dp:-1e9):K==='unr'?h.unr:K==='alloc'?h.alloc:h.val;
 const L=b.open.slice().sort((a,c)=>{const x=val(a),y=val(c);return(typeof x==='string'?x.localeCompare(y):x-y)*dir});
 const th=(k,l,n)=>`<th class="${n?'n':''}${K===k?' on':''}" onclick="pfSortBy('${k}')">${l}${K===k?(dir<0?' &#9660;':' &#9650;'):''}</th>`,TR=L.some(h=>pfHasTrend(h.k+':'+h.sym));
 const price=h=>isFinite(h.price)?pfP(h.price):`<button class=pf-set onclick="pfSetPrice('${h.k}','${pfE(h.sym)}')">Set price</button>`;
 const row=h=>{const key=h.k+':'+h.sym,fl=PF.flash[key]||'',src=h.P?'Live from '+h.P.src:h.man?'Set by hand':'No price yet',hp=isFinite(h.price);
  return`<tr><td><div class=pf-sy><b>${pfE(h.sym)}</b><em class="pf-bd ${h.k}">${h.k==='crypto'?'CRYPTO':'STOCK'}</em></div></td>
   <td class="n pf-px ${fl}" title="${pfE(src)}">${price(h)}${h.man?'<small class=pf-man>by hand</small>':''}</td>
   <td class="n ${pfCls(h.dp)}">${isFinite(h.dp)?pfPct(h.dp):'-'}</td>
   <td class=n>${pfQ(h.q)}<small class=pf-sub>avg ${pfP(h.avg)}</small></td>
   <td class=n><b>${pfM(h.val)}</b></td>
   <td class="n ${pfCls(h.unr)}">${hp?(h.unr>=0?'+':'')+pfM(h.unr):'-'}<small class=pf-sub>${hp?pfPct(h.unrp):''}</small></td>
   <td class=n>${h.alloc.toFixed(1)}%<i class=pf-ab><b style="width:${Math.min(100,h.alloc).toFixed(1)}%"></b></i></td>
   ${TR?`<td class=pf-trc>${pfSpark(key,74,22)}</td>`:''}
   <td class=pf-act><button onclick="pfAdd('buy','${h.k}','${pfE(h.sym)}')" title="Buy more ${pfE(h.sym)}">Buy</button><button onclick="pfAdd('sell','${h.k}','${pfE(h.sym)}')" title="Sell ${pfE(h.sym)}">Sell</button></td></tr>`};
 const cards=L.map(h=>{const key=h.k+':'+h.sym,fl=PF.flash[key]||'';return`<div class=pf-cd><div class=pf-ch><div class=pf-sy><b>${pfE(h.sym)}</b><em class="pf-bd ${h.k}">${h.k==='crypto'?'CRYPTO':'STOCK'}</em></div><b>${pfM(h.val)}</b></div>
  <div class=pf-cg><span>Price</span><b class="pf-px ${fl}">${isFinite(h.price)?pfP(h.price):`<button class=pf-set onclick="pfSetPrice('${h.k}','${pfE(h.sym)}')">Set price</button>`}</b><span>Today</span><b class="${pfCls(h.dp)}">${pfPct(h.dp)}</b>
  <span>Holding</span><b>${pfQ(h.q)} @ ${pfP(h.avg)}</b><span>P&amp;L</span><b class="${pfCls(h.unr)}">${isFinite(h.price)?(h.unr>=0?'+':'')+pfM(h.unr)+' ('+pfPct(h.unrp)+')':'-'}</b>${pfHasTrend(key)?`<span>${PF.s7[key]?'7 days':'Trend'}</span><b>${pfSpark(key,96,22)}</b>`:''}</div>
  <div class=pf-act><button onclick="pfAdd('buy','${h.k}','${pfE(h.sym)}')">Buy</button><button onclick="pfAdd('sell','${h.k}','${pfE(h.sym)}')">Sell</button></div></div>`}).join('');
 return`<div class="c pf-tb"><h4>Holdings</h4><div class=sc><table><tr>${th('sym','Asset')}${th('price','Price',1)}${th('dp','Today',1)}${th('q','Holding',1)}${th('val','Value',1)}${th('unr','P&amp;L',1)}${th('alloc','Alloc',1)}${TR?'<th class=pf-trc title="Crypto: the last 7 days. Stocks: since you opened the portal.">Trend</th>':''}<th></th></tr>
  ${L.map(row).join('')}<tr class=pf-tot><td><b>TOTAL</b></td><td></td><td class="n ${pfCls(b.day)}">${b.dayn?(b.day>=0?'+':'')+pfM(b.day):'-'}</td><td></td><td class=n><b>${pfM(b.val)}</b></td><td class="n ${pfCls(b.unr)}">${(b.unr>=0?'+':'')+pfM(b.unr)}<small class=pf-sub>${pfPct(b.cost?b.unr/b.cost*100:NaN)}</small></td><td class=n>100%</td>${TR?'<td class=pf-trc></td>':''}<td></td></tr></table></div>
  <div class=pf-cds>${cards}</div></div>`}
function pfTx(){const T=PF.data.tx.slice().sort((a,b)=>String(b.d||'').localeCompare(String(a.d||''))||(b.ts||0)-(a.ts||0));if(!T.length)return'';
 return`<div class="c pf-txc"><h4><button class=pf-tg onclick="pfToggleTx()">${PF.txOpen?'&#9660;':'&#9654;'} Transactions (${T.length})</button></h4>${PF.txOpen?`<div class=sc><table><tr><th>Date</th><th>Type</th><th>Asset</th><th class=n>Qty</th><th class=n>Price</th><th class=n>Fee</th><th class=n>Total</th><th>Note</th><th></th></tr>
  ${T.map(x=>`<tr><td>${pfE(x.d)}</td><td><em class="pf-bd ${x.t==='sell'?'sell':'buy'}">${x.t==='sell'?'SELL':'BUY'}</em></td><td><b>${pfE(x.sym)}</b> <small class=mut>${x.k}</small></td><td class=n>${pfQ(+x.q)}</td><td class=n>${pfP(+x.px)}</td><td class=n>${x.fee?pfM(+x.fee):'-'}</td><td class=n>${pfM((+x.q)*(+x.px)+(x.t==='sell'?-1:1)*(+x.fee||0))}</td><td class=mut>${pfE(x.n||'')}</td>
   <td><button class=pf-x onclick="pfDel('${pfE(x.id)}')" title="Delete" aria-label="Delete this transaction">&times;</button></td></tr>`).join('')}</table></div>`:''}</div>`}
function pfInner(){if(!PF.ready)return`<div class=c><p class=mut>Loading your portfolio...</p></div>`;const b=pfBook(),tot=b.unr+b.real;
 const dis=`<p class=pf-dis>Prices from CoinGecko (crypto) and Finnhub (stocks), history from CoinGecko and Twelve Data; they can be delayed a few minutes. Profit and loss uses the average cost of your buys. This is a tracker, not financial advice.</p>`;
 if(!PF.data.tx.length)return pfStartCard(1)+dis;
 const k=(l,v,s,c)=>`<div class=c><h4>${l}</h4><div class="v ${c||''}">${v}</div><small>${s}</small></div>`;
 return pfStatus(b)+`<div class="g pf-k">${k('Portfolio Value',pfM(b.val),b.open.length+' holding'+(b.open.length===1?'':'s')+(b.priced<b.open.length?' &middot; '+(b.open.length-b.priced)+' without a price':''))}
  ${k('Total P&amp;L',(tot>=0?'+':'')+pfM(tot),'Open '+(b.unr>=0?'+':'')+pfM(b.unr)+' &middot; closed '+(b.real>=0?'+':'')+pfM(b.real),pfCls(tot))}
  ${b.dayn?k('Today',(b.day>=0?'+':'')+pfM(b.day),pfPct(b.val-b.day?b.day/(b.val-b.day)*100:NaN)+' since yesterday',pfCls(b.day)):k('Today','-',b.open.length?'Waiting for live prices':'Nothing open right now')}
  ${k('Cost Basis',pfM(b.cost),'What you paid for what you hold, fees included')}</div>
  <div class="pf-g2"><div class=c><h4>Allocation</h4>${pfDonut(b)}</div></div>`+pfRows(b)+pfPerfCard()+pfTx()+dis}
function pfPage(){return`<div id=pfw>${pfInner()}</div>`}
var pfPT=0;function pfSoon(){clearTimeout(pfPT);pfPT=setTimeout(pfPaint,60)}
function pfPaint(){if(!pfShown())return;const e=document.getElementById('pfw');if(!e)return;const sx=window.scrollX,m=document.getElementById('main'),st=m?m.scrollTop:0;e.classList.add('pf-np');e.innerHTML=pfInner();if(m)m.scrollTop=st}

/* ---------- actions ---------- */
function pfSortBy(k){if(PF.sort===k)PF.dir=-PF.dir;else{PF.sort=k;PF.dir=k==='sym'?1:-1}pfPaint()}
function pfRange(r){PF.rng=r;pfPaint();pfHNeed(r)}
function pfToggleTx(){PF.txOpen=PF.txOpen?0:1;pfPaint()}
function pfModal(h){document.getElementById('md').innerHTML=`<div class=mb onclick="if(event.target===this)closeM()"><div class="c pf-m" role=dialog aria-modal=true onkeydown="pfKey(event,this)">${h}</div></div>`}
function pfKey(ev,el){if(ev.key==='Enter'&&ev.target&&ev.target.tagName==='INPUT'){ev.preventDefault();const b=el.querySelector('.pf-mb .btn:not(.o)');if(b)b.click()}}
function pfAdd(t,k,sym){t=t==='sell'?'sell':'buy';k=k||'';sym=sym||'';const b=pfBook(),held=b.open.filter(h=>h.q>0);
 if(t==='sell'&&!held.length){toast('Nothing to sell yet. Add a holding first.');return}
 const cur=sym?(PF.px[(k||'stock')+':'+sym]||PF.px['crypto:'+sym]||null):null;
 pfModal(`<h4>${t==='sell'?'Sell':'Buy / add a holding'}</h4>
  <div class=pf-tt><button id=pf-tb class="${t==='buy'?'on':''}" onclick="pfAdd('buy',pfV('pf-k'),pfSym(pfV('pf-s')))">Buy</button><button id=pf-ts class="${t==='sell'?'on':''}" onclick="pfAdd('sell',pfV('pf-k'),pfSym(pfV('pf-s')))">Sell</button></div>
  <input type=hidden id=pf-t value="${t}">
  ${t==='sell'?`<label for=pf-s>Holding</label><select id=pf-s onchange="pfSellPick()">${held.map(h=>`<option value="${pfE(h.sym)}" data-k="${h.k}" ${h.sym===sym?'selected':''}>${pfE(h.sym)} (${h.k}) &middot; ${pfQ(h.q)} held</option>`).join('')}</select><input type=hidden id=pf-k value="${pfE(k||(held.find(h=>h.sym===sym)||held[0]).k)}">`:
   `<div class=pf-r2><div><label for=pf-s>Symbol</label><input id=pf-s value="${pfE(sym)}" placeholder="AAPL or BTC" autocomplete=off oninput="pfGuess()" onblur="pfPeek()" maxlength=15></div>
    <div><label for=pf-k>Type</label><select id=pf-k onchange="pfPeek()"><option value=stock ${k!=='crypto'?'selected':''}>Stock / ETF</option><option value=crypto ${k==='crypto'?'selected':''}>Crypto</option></select></div></div>`}
  <div class=pf-r2><div><label for=pf-q>Quantity</label><input id=pf-q inputmode=decimal placeholder="${t==='sell'?'How many to sell':'e.g. 10 or 0.25'}" autocomplete=off></div>
   <div><label for=pf-p>Price per ${t==='sell'?'unit sold':'unit'} ($)</label><input id=pf-p inputmode=decimal value="${cur?+cur.p:''}" placeholder="0.00" autocomplete=off></div></div>
  <div class=pf-hint id=pf-h>${cur?'Live price filled in. Change it to what you actually '+(t==='sell'?'got':'paid')+'.':''}</div>
  <div class=pf-r2><div><label for=pf-d>Date</label><input id=pf-d type=date value="${pfToday()}"></div><div><label for=pf-f>Fees ($, optional)</label><input id=pf-f inputmode=decimal placeholder="0" autocomplete=off></div></div>
  <label for=pf-n>Note (optional)</label><input id=pf-n maxlength=80 autocomplete=off>
  <p class=cherr id=pf-e></p><div class=pf-mb><button class=btn onclick="pfSaveTx()">${t==='sell'?'Record sale':'Save'}</button> <button class="btn o" onclick="closeM()">Cancel</button></div>`);
 setTimeout(()=>{const e=document.getElementById(t==='sell'?'pf-q':(sym?'pf-q':'pf-s'));if(e)e.focus()},30)}
function pfV(id){const e=document.getElementById(id);return e?String(e.value||'').trim():''}
function pfN(s){s=String(s||'').replace(/[$,\s]/g,'');if(!s)return NaN;return +s}
function pfGuess(){const s=pfSym(pfV('pf-s')),k=document.getElementById('pf-k');if(k&&s&&PFCG[s])k.value='crypto'}
function pfSellPick(){const s=document.getElementById('pf-s'),o=s&&s.selectedOptions&&s.selectedOptions[0],k=document.getElementById('pf-k');if(o&&k)k.value=o.dataset.k||'stock';
 const P=PF.px[(k?k.value:'stock')+':'+(s?s.value:'')],p=document.getElementById('pf-p');if(P&&p&&!p.value)p.value=+P.p}
async function pfPeek(){const s=pfSym(pfV('pf-s')),k=pfV('pf-k')||'stock',p=document.getElementById('pf-p'),h=document.getElementById('pf-h');if(!s||!p||!h)return;
 const key=k+':'+s;if(PF.px[key]){if(!p.value)p.value=+PF.px[key].p;h.textContent='Live price: '+pfP(PF.px[key].p)+'.';return}
 h.textContent='Looking up '+s+'...';try{let pr=NaN;
  if(k==='crypto'){const id=await pfCoinId(s);if(id){const j=await pfGet(PFAPI.cg+'/simple/price?ids='+id+'&vs_currencies=usd&include_24hr_change=true',8000);if(j[id])pr=j[id].usd}}
  else if(PF.data.fk){const j=await pfGet(PFAPI.fh+'/quote?symbol='+encodeURIComponent(s)+'&token='+encodeURIComponent(PF.data.fk),8000);if(j&&j.c>0)pr=j.c}
  if(pfSym(pfV('pf-s'))!==s)return;
  if(isFinite(pr)&&pr>0){if(!p.value)p.value=pr;h.textContent='Live price: '+pfP(pr)+'. Change it to what you actually paid.'}
  else h.textContent=k==='stock'&&!PF.data.fk?'Add your Finnhub key in Settings to look up stock prices.':'Could not find a live price for '+s+'. You can still save it and set the price by hand.'}
 catch(e){if(pfSym(pfV('pf-s'))===s)h.textContent='Could not reach the price service. You can still save it.'}}
function pfSaveTx(){const t=pfV('pf-t')==='sell'?'sell':'buy',sym=pfSym(pfV('pf-s')),k=pfV('pf-k')==='crypto'?'crypto':'stock',q=pfN(pfV('pf-q')),px=pfN(pfV('pf-p')),fee=pfN(pfV('pf-f'))||0,d=pfV('pf-d')||pfToday(),n=pfV('pf-n').slice(0,80);
 const err=m=>{const e=document.getElementById('pf-e');if(e)e.textContent=m};
 if(!sym)return err('Enter a symbol, for example AAPL or BTC.');if(!(q>0))return err('Enter how many, more than 0.');if(!(px>=0)||!isFinite(px))return err('Enter the price per unit.');if(fee<0)return err('Fees cannot be negative.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return err('Pick a date.');
 if(t==='sell'){const h=pfHeld(k,sym);if(q>h+1e-9)return err('You only hold '+pfQ(h)+' '+sym+'.')}
 const x={id:'t'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),t,sym,k,q:+q,px:+px,fee:+fee,d,n,ts:Date.now()};if(k==='crypto'&&PFCG[sym])x.cg=PFCG[sym];
 PF.data.tx.push(x);pfSave();closeM();toast(t==='sell'?'Sale recorded':'Saved to your portfolio',1);pfPaint();setTimeout(()=>pfTick(1),200)}
function pfDel(id){const x=PF.data.tx.find(y=>y.id===id);if(!x)return;ask('Delete this '+(x.t==='sell'?'sale':'buy')+' of '+pfQ(+x.q)+' '+pfE(x.sym)+'?',()=>{PF.data.tx=PF.data.tx.filter(y=>y.id!==id);pfSave();closeM();pfPaint()})}
function pfSetPrice(k,sym){const m=PF.data.mp[k+':'+sym];pfModal(`<h4>Set the price of ${pfE(sym)}</h4><p class=mut>There is no live price for this ${k==='crypto'?'coin':'stock'} right now. Enter the current price and the portfolio uses it until a live price comes in.</p>
  <label for=pf-mp>Price per unit ($)</label><input id=pf-mp inputmode=decimal value="${m?m.p:''}" autocomplete=off><p class=cherr id=pf-e></p>
  <div class=pf-mb><button class=btn onclick="pfSaveMp('${k}','${pfE(sym)}')">Save price</button> <button class="btn o" onclick="closeM()">Cancel</button></div>`);setTimeout(()=>{const e=document.getElementById('pf-mp');if(e)e.focus()},30)}
function pfSaveMp(k,sym){const p=pfN(pfV('pf-mp'));if(!(p>0)){const e=document.getElementById('pf-e');if(e)e.textContent='Enter a price above 0.';return}PF.data.mp[k+':'+sym]={p:+p,at:Date.now()};pfSave();closeM();pfPaint()}
function pfSettings(){const k=PF.data.fk;pfModal(`<h4>Portfolio settings</h4>
  <label for=pf-fk>Finnhub key for live stock prices</label><input id=pf-fk type=password autocomplete=off spellcheck=false placeholder="${k?'Saved (ends in '+pfE(k.slice(-4))+'). Paste a new one to replace it':'Paste your free key here'}">
  <p class=mut style="font-size:11px;line-height:1.6;margin:6px 0 0">Get one free at finnhub.io: sign up, then copy the API key from your dashboard. It is saved in your private portfolio, which only your account can read. Crypto prices need no key.</p>
  <label for=pf-tk style="margin-top:14px">Twelve Data key for stock history <small class=mut>(optional)</small></label><input id=pf-tk type=password autocomplete=off spellcheck=false placeholder="${PF.data.tk?'Saved (ends in '+pfE(PF.data.tk.slice(-4))+'). Paste a new one to replace it':'Paste your free key here'}">
  <p class=mut style="font-size:11px;line-height:1.6;margin:6px 0 0">Fills in the performance chart for stocks (Finnhub's free plan has no price history). Free at twelvedata.com: sign up, then copy the API key from your dashboard. Saved in the same private portfolio.</p>
  <p class=cherr id=pf-e></p><div class=pf-mb><button class=btn onclick="pfSaveKey()">Save</button> ${k?'<button class="btn o" onclick="pfSaveKey(1)">Remove Finnhub key</button> ':''}${PF.data.tk?'<button class="btn o" onclick="pfSaveKey(2)">Remove Twelve Data key</button> ':''}<button class="btn o" onclick="closeM()">Close</button></div>`)}
function pfSaveKey(del){if(del===2){PF.data.tk='';pfSave();closeM();pfPaint();toast('Twelve Data key removed',1);return}if(del){PF.data.fk='';PF.st.fh='nokey';pfSave();closeM();pfPaint();toast('Key removed',1);return}const v=pfV('pf-fk').replace(/\s/g,''),tv=pfV('pf-tk').replace(/\s/g,'');
 if(tv){if(!/^[A-Za-z0-9]{16,64}$/.test(tv)){const e=document.getElementById('pf-e');if(e)e.textContent='That does not look like a Twelve Data key.';return}PF.data.tk=tv;const c=pfHC();Object.keys(c).forEach(k=>{if(k.indexOf('stock:')===0)delete c[k]});delete PFH.err.stock;if(!v){pfSave();closeM();toast('Twelve Data key saved. Loading stock history...',1);pfPaint();pfHNeed(PFR[PF.rng]?PF.rng:'1D');return}}
 if(!v){const e=document.getElementById('pf-e');if(e)e.textContent='Paste a key first.';return}if(!/^[A-Za-z0-9_\-]{10,80}$/.test(v)){const e=document.getElementById('pf-e');if(e)e.textContent='That does not look like a Finnhub key.';return}
 PF.data.fk=v;PF.st.fh='';pfSave();closeM();toast('Key saved. Fetching stock prices...',1);setTimeout(()=>pfTick(1),150)}

/* ---------- the page: Business Performance > Portfolio (owner only) ---------- */
(function(){if(typeof bz!=='function')return;const _bz=bz;
 bz=function(){const own=pfOwnerNow();if(!own&&SUB['Business Performance']==='Portfolio')SUB['Business Performance']='Summary';
  if(own&&SUB['Business Performance']==='Portfolio'){pfInit();setTimeout(pfMaybe,300);
   return hd('Business Performance','Your personal portfolio: live prices, profit and loss. Only you can see this.',[['+ Buy',"pfAdd('buy')"],['Sell',"pfAdd('sell')"]])+seg('Business Performance',['Summary','Income','Expenses','Statement','Portfolio'])+pfPage()}
  let h=_bz.apply(this,arguments);if(own)h=h.replace(/(onclick="SUB\['Business Performance'\]='Statement';AGD=null;go\(\)">Statement<\/button>)/,'$1<button class="" onclick="SUB[\'Business Performance\']=\'Portfolio\';AGD=null;go()">Portfolio</button>');return h};
 /* the page map holds the original function: point it at this one */
 try{if(typeof views==='object'&&views['Business Performance'])views['Business Performance'][0]=bz}catch(e){}
 /* warm up after sign-in so prices and the value line are ready when the page opens */
 const w=setInterval(()=>{try{if(typeof ONLINE!=='undefined'&&ONLINE){clearInterval(w);pfInit()}}catch(e){}},2000)})();
/*PFend*/
