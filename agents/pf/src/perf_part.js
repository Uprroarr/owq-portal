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
