/*APXstart*/
/* v114 Agency Performance holds Business Performance: one section with a visual Overview, Sales tabs (Policies, Agents,
   Time Report) and Money tabs (Income, Expenses, Statement, the owner's Portfolio). Old Business Performance links land on the
   matching tab. Policies, expenses, income and activity can be edited (the same form, filled in). The Command Deck is simpler:
   the hero, the Live Pulse, sneak peeks of Agency Performance, Money, Production Equation and Clients, then briefing and alerts. */
const APX_SALES=['Policies','Agents','Time Report'],APX_MONEY=['Income','Expenses','Statement','Portfolio'];
const APX_FROM_BP={Summary:'Overview',Income:'Income',Expenses:'Expenses',Statement:'Statement',Portfolio:'Portfolio'};
const APX_MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const APX_STC={Submitted:'#ffb020',Issued:'#3ddc97',Paid:'#1fae6d',Declined:'#6d6d7a',Chargeback:'#ff1f4f'};
var APXA=0,APXI=0,APXE=null,APXL;
function apxOwner(){try{return typeof pfOwnerNow==='function'&&!!pfOwnerNow()}catch(e){return false}}
function apxTabs(){return['Overview'].concat(APX_SALES,APX_MONEY.filter(x=>x!=='Portfolio'||apxOwner()))}
/* the old Business Performance address (links, alerts, palette, tests) opens the matching Agency Performance tab */
function apxNorm(){try{if(tab==='Business Performance'){tab='Agency Performance';SUB['Agency Performance']=APX_FROM_BP[SUB['Business Performance']]||'Overview'}
 const bp=SUB['Business Performance'];if(tab==='Agency Performance'&&APXL!==undefined&&bp!==APXL&&APX_FROM_BP[bp])SUB['Agency Performance']=APX_FROM_BP[bp];APXL=bp;
 if(SUB['Agency Performance']==='Summary')SUB['Agency Performance']='Overview';
 if(tab==='Agency Performance'&&apxTabs().indexOf(SUB['Agency Performance'])<0)SUB['Agency Performance']='Overview'}catch(e){}}
function apxK(n){n=+n||0;const a=Math.abs(n),s=n<0?'-':'';return s+'$'+(a>=1e6?(a/1e6).toFixed(a>=1e7?0:1)+'M':a>=1e3?(a/1e3).toFixed(a>=1e5?0:1).replace(/\.0$/,'')+'K':Math.round(a))}
function apxMk(o){const d=new Date(now.getFullYear(),now.getMonth()+o,1);return d.getFullYear()+'-'+pad(d.getMonth()+1)}
function apxML(k){return APX_MN[+k.slice(5,7)-1]||k}
/* month rows for the last n calendar months (zeros where nothing happened): premium, policies, money in and out */
function apxRows(n){n=n||12;let pim={};try{pim=pfInvMonths()}catch(e){}const P=D.policies,out=[];
 for(let o=-(n-1);o<=0;o++){const k=apxMk(o),ps=P.filter(x=>mon(x.d)===k),is=ps.filter(live),ex=D.expenses.filter(x=>mon(x.d)===k),c=sum(is,com),oi=sum(D.income.filter(x=>mon(x.d)===k),x=>x.amt),iv=pim[k]||0,e=sum(ex,x=>x.amt);
  out.push({k,sub:sum(ps,x=>x.ap),iss:sum(is,x=>x.ap),n:ps.length,ni:is.length,com:c,oi,iv,inc:c+oi+iv,exp:e,lead:sum(ex.filter(x=>x.cat==='Leads'),x=>x.amt),net:c+oi+iv-e,
   con:sum(D.activity.filter(x=>mon(x.d)===k),x=>+x.con||0),app:sum(D.activity.filter(x=>mon(x.d)===k),x=>+x.app||0)})}
 return out}
/* last month up to the same day of the month, so a month in progress is compared fairly */
function apxPrev(){const k=apxMk(-1),dd=k+'-'+pad(Math.min(DOM,31)),f=x=>mon(x.d)===k&&String(x.d)<=dd;let pim=0;
 const ps=D.policies.filter(f),is=ps.filter(live),c=sum(is,com),oi=sum(D.income.filter(f),x=>x.amt),e=sum(D.expenses.filter(f),x=>x.amt);return{k,sub:sum(ps,x=>x.ap),iss:sum(is,x=>x.ap),n:ps.length,com:c,oi,inc:c+oi,exp:e,net:c+oi-e}}
function apxDelta(cur,prev,inv){if(!isFinite(cur)||!isFinite(prev)||(!prev&&!cur))return'<em class="apx-d fl">&mdash; vs last month</em>';if(!prev)return'<em class="apx-d up">NEW this month</em>';
 const r=(cur-prev)/Math.abs(prev),up=r>=0,good=inv?!up:up;return`<em class="apx-d ${good?'up':'dn'}">${up?'&#9650;':'&#9660;'} ${Math.min(999,Math.abs(Math.round(r*100)))}% <i>vs same days last month</i></em>`}
let APXN=0;
function apxSpark(v,col){col=col||'#ff1f4f';if(!v||v.length<2||!v.some(x=>x))return'<div class=apx-sp0></div>';const mx=Math.max(...v,0),mn=Math.min(...v,0),W=160,H=36,r=(mx-mn)||1,X=i=>i*W/(v.length-1),Y=x=>H-3-(x-mn)/r*(H-8),pts=v.map((x,i)=>X(i).toFixed(1)+','+Y(x).toFixed(1)),id='apxg'+(++APXN);
 return`<svg class=apx-sp viewBox="0 0 ${W} ${H}" preserveAspectRatio=none aria-hidden=true><defs><linearGradient id=${id} x1=0 y1=0 x2=0 y2=1><stop offset=0 stop-color="${col}" stop-opacity=.38 /><stop offset=1 stop-color="${col}" stop-opacity=0 /></linearGradient></defs><path d="M0,${H} L${pts.join(' L')} L${W},${H} Z" fill="url(#${id})" /><polyline points="${pts.join(' ')}" fill=none stroke="${col}" stroke-width=1.8 vector-effect=non-scaling-stroke stroke-linejoin=round /></svg>`}
function apxTile(l,v,sub,dl,sp,to,cls){return`<div class="c apx-t ${cls||''}"${to?` tabindex=0 role=button onclick="${to}" onkeydown="if(event.key=='Enter')this.click()"`:''}><h4>${l}</h4><div class=apx-tv>${v}</div>${dl||''}<small>${sub||''}</small>${sp||''}</div>`}
const apxGo=(t)=>`SUB['Agency Performance']='${t}';AGD=null;go()`;
/* the 12-month chart: submitted and issued premium as bars, net profit as a line */
function apxTrend(R){const W=720,H=250,L=46,B=26,T=14,iw=W-L-10,ih=H-B-T,mx=Math.max(1,...R.map(r=>Math.max(r.sub,r.iss,r.net))),mn=Math.min(0,...R.map(r=>r.net)),sp=mx-mn||1,y=v=>T+ih-(v-mn)/sp*ih,gw=iw/R.length,bw=Math.max(4,Math.min(16,gw*.3));
 const ticks=[0,.25,.5,.75,1].map(f=>mn+sp*f);let g='';
 ticks.forEach(v=>{g+=`<line x1=${L} x2=${W-10} y1=${y(v).toFixed(1)} y2=${y(v).toFixed(1)} class=apx-gl /><text x=${L-6} y=${(y(v)+3).toFixed(1)} class=apx-ax text-anchor=end>${apxK(v)}</text>`});
 if(mn<0)g+=`<line x1=${L} x2=${W-10} y1=${y(0).toFixed(1)} y2=${y(0).toFixed(1)} class=apx-zl />`;
 R.forEach((r,i)=>{const cx=L+gw*i+gw/2,ys=y(r.sub),yi=y(r.iss),y0=y(0);
  g+=`<g class=apx-bg style="animation-delay:${(i*.04).toFixed(2)}s"><title>${apxML(r.k)} ${r.k.slice(0,4)}: submitted ${$(r.sub)}, issued ${$(r.iss)}, net profit ${$(r.net)}</title><rect x=${(cx-bw-1).toFixed(1)} y=${Math.min(ys,y0).toFixed(1)} width=${bw} height=${Math.max(1,Math.abs(y0-ys)).toFixed(1)} class=apx-bs /><rect x=${(cx+1).toFixed(1)} y=${Math.min(yi,y0).toFixed(1)} width=${bw} height=${Math.max(1,Math.abs(y0-yi)).toFixed(1)} class=apx-bi /><rect x=${(cx-gw/2).toFixed(1)} y=${T} width=${gw.toFixed(1)} height=${ih} fill=transparent /></g><text x=${cx.toFixed(1)} y=${H-8} class=apx-ax text-anchor=middle>${apxML(r.k)}</text>`});
 const pts=R.map((r,i)=>[(L+gw*i+gw/2).toFixed(1),y(r.net).toFixed(1)]);
 g+=`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" class=apx-nl pathLength=1 />`+pts.map((p,i)=>`<circle cx=${p[0]} cy=${p[1]} r=3.2 class=apx-nd><title>${apxML(R[i].k)}: net profit ${$(R[i].net)}</title></circle>`).join('');
 return`<svg class=apx-tr viewBox="0 0 ${W} ${H}" role=img aria-label="Submitted and issued premium and net profit by month">${g}</svg><div class=apx-lg><span><i class=s></i>Submitted</span><span><i class=i></i>Issued</span><span><i class=n></i>Net profit</span></div>`}
/* the funnel: each stage's width is its share of the first, with the step-to-step conversion between */
function apxFunnel(S0){const mx=Math.max(1,S0[0][1]);return`<div class=apx-fn>${S0.map((s,i)=>{const w=42+58*Math.sqrt(Math.max(0,s[1])/mx),cv=i?(S0[i-1][1]?s[1]/S0[i-1][1]:0):null;
 return`${i?`<div class=apx-fc>&#9660; ${P(cv)} <i>convert</i></div>`:''}<div class=apx-fs style="--w:${w.toFixed(1)}%;--d:${i*.12}s"><b>${esc(s[0])}</b><em>${Math.round(s[1]).toLocaleString()}</em></div>`}).join('')}</div>`}
function apxRing(p,big,lab,sub){const v=Math.max(0,Math.min(1,isFinite(p)?p:0)),R=52,C=2*Math.PI*R;
 return`<div class=apx-rg><svg viewBox="0 0 140 140" aria-hidden=true><circle cx=70 cy=70 r=${R} class=apx-rb /><circle cx=70 cy=70 r=${R} class="apx-rf ${p>=1?'ok':''}" stroke-dasharray="${(v*C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 70 70)" /><circle cx=70 cy=70 r=62 class=apx-rt /></svg><div class=apx-rc><b>${big}</b><small>${lab}</small></div></div>${sub?`<small class=apx-rs>${sub}</small>`:''}`}
function apxRank(L,f){if(!L.length)return'<p class=mut>Nothing issued yet this month.</p>';const mx=Math.max(1,...L.map(r=>r[1]));
 return L.map((r,i)=>`<div class="apx-rk ck" onclick="${typeof agA==='function'?agA(r[0]):''}"><i class=apx-rn>${i+1}</i>${av(r[0],26)}<span><b>${esc(r[0])}</b><i class=apx-rb2><b style="width:${(r[1]/mx*100).toFixed(1)}%"></b></i></span><em>${(f||$)(r[1])}</em></div>`).join('')}
function apxMini(R,keys,cols){const W=220,H=60,mx=Math.max(1,...R.flatMap(r=>keys.map(k=>Math.max(0,r[k])))),gw=W/R.length,bw=Math.max(3,Math.min(12,gw/(keys.length+1)));
 return`<svg class=apx-mi viewBox="0 0 ${W} ${H+12}" aria-hidden=true>${R.map((r,i)=>keys.map((k,j)=>{const h=Math.max(1.5,Math.max(0,r[k])/mx*H),x=gw*i+gw/2-bw*keys.length/2+j*bw;return`<rect x=${x.toFixed(1)} y=${(H-h).toFixed(1)} width=${(bw-1).toFixed(1)} height=${h.toFixed(1)} fill="${cols[j]}" rx=1 />`}).join('')+`<text x=${(gw*i+gw/2).toFixed(1)} y=${H+10} text-anchor=middle class=apx-ax>${apxML(r.k).slice(0,1)}</text>`).join('')}</svg>`}
/* ---------- the section ---------- */
function apxSeg(){const cur=SUB['Agency Performance'],b=x=>`<button class="${cur===x?'on':''}" onclick="${apxGo(x)}">${x}</button>`;
 return`<div class="seg apx-seg" role=tablist aria-label="Agency Performance">${b('Overview')}<span class=apx-sl>Sales</span>${APX_SALES.map(b).join('')}<span class=apx-sl>Money</span>${APX_MONEY.filter(x=>x!=='Portfolio'||apxOwner()).map(b).join('')}</div>`}
function ag(){apxNorm();const t=SUB['Agency Performance'];
 const H={Overview:'Production and profit in one place. Tap any card for the detail.',Policies:'Every policy, any status. Edit one with the pencil.',Agents:'Who is producing, who is on pace, and the activity behind it.','Time Report':'Hours on the clock, week by week.',
  Income:'Commission, overrides, renewals and everything else that comes in.',Expenses:'Leads, training and every other cost, by category.',Statement:'Profit and loss, month by month.',Portfolio:'Your personal portfolio: live prices, profit and loss. Only you can see this.'}[t]||'';
 const BT={Overview:[['+ Policy',"openM('P')"],['+ Activity',"openM('A')"],['+ Income',"openM('I')"],['+ Expense',"openM('E')"]],Policies:[['+ Policy',"openM('P')"]],Agents:[['+ Agent',"openM('G')"],['+ Activity',"openM('A')"]],'Time Report':[['+ Activity',"openM('A')"]],
  Income:[['+ Income',"openM('I')"]],Expenses:[['+ Expense',"openM('E')"]],Statement:[['+ Income',"openM('I')"],['+ Expense',"openM('E')"]],Portfolio:[['+ Buy',"pfAdd('buy')"],['Sell',"pfAdd('sell')"]]}[t]||[];
 let b='';
 if(t==='Policies'){let pl=plist();if(D.policies.length){const i=pl.indexOf('<div class=seg>');if(i===0)pl=pl.slice(pl.indexOf('</div>')+6)}b=apxPolHead()+pl}else if(t==='Agents')b=agents()+(AGD?'':apxActLog());else if(t==='Time Report')b=trkPage();
 else if(t==='Income')b=apxIncome();else if(t==='Expenses'||t==='Statement'||t==='Portfolio')b=(t==='Statement'?apxPnl():'')+apxBz(t);else b=apxOverview();
 return hd('Agency Performance',H,BT)+apxSeg()+b}
/* the money tabs keep their own pages (Expenses breakdown, Statement table, Portfolio) without their old header and tabs */
function apxBz(t){SUB['Business Performance']=t;APXL=t;let h='';try{h=bz()}catch(e){return'<div class=c><p class=mut>This page could not load.</p></div>'}const i=h.indexOf('<div class=seg>');if(i<0)return h;const j=h.indexOf('</div>',i);return h.slice(j+6)}
function apxOverview(){const s=S(),R=apxRows(12),c=R[R.length-1],p=apxPrev(),v=k=>R.map(r=>r[k]),f=FC(),gl=+D.goal||0,mIss=c.iss;
 const tiles=`<div class=apx-kp>
 ${apxTile('Issued Premium',cu(c.iss,'$'),'This month &middot; '+$(s.issAP)+' all time',apxDelta(c.iss,p.iss),apxSpark(v('iss')),apxGo('Policies'))}
 ${apxTile('Submitted',cu(c.sub,'$'),c.n+' application'+(c.n===1?'':'s')+' this month &middot; '+s.p.length+' all time',apxDelta(c.sub,p.sub),apxSpark(v('sub'),'#c9c9d3'),apxGo('Policies'))}
 ${apxTile('Placement Rate',cu(s.iss.length/s.p.length*100,'%'),s.iss.length+' of '+s.p.length+' placed &middot; '+$(s.cb)+' in chargebacks','',apxSpark(R.map(r=>r.n?r.ni/r.n:0),'#ffcf40'),apxGo('Policies'))}
 ${apxTile('Total Income',cu(c.inc,'$'),'This month &middot; '+$(s.rev)+' all time'+(s.pv?' (incl. '+$(s.pv)+' invested)':''),apxDelta(c.inc,p.inc),apxSpark(v('inc'),'#5ac8ff'),apxGo('Income'))}
 ${apxTile('Expenses',cu(c.exp,'$'),'This month &middot; '+$(s.exT)+' all time',apxDelta(c.exp,p.exp,1),apxSpark(v('exp'),'#8a8a9a'),apxGo('Expenses'))}
 ${apxTile('Net Profit',`<span class="${c.net<0?'neg':'pos'}">${cu(c.net,'$')}</span>`,'This month &middot; '+$(s.net)+' all time, '+P(s.net/s.rev)+' margin',apxDelta(c.net,p.net),apxSpark(v('net'),'#3ddc97'),apxGo('Statement'),'apx-np')}
 </div>`;
 const trend=`<div class="c apx-wide"><div class=apx-ch><h4>Production &amp; Profit &middot; Last 12 Months</h4><small>${$(sum(R,r=>r.iss))} issued &middot; ${$(sum(R,r=>r.net))} net profit</small></div>${apxTrend(R)}</div>`;
 const goal=`<div class="c apx-goal"><h4>This Month's Goal</h4>${apxRing(gl?mIss/gl:0,gl?P(mIss/gl):'-','of goal',`${$(mIss)} of ${$(gl)} issued`)}<div class=apx-gs><div><small>On pace for</small><b>${apxK(f.proj)}</b></div><div><small>Pipeline</small><b>${apxK(f.pend)}</b></div><div><small>Day</small><b>${DOM}/${DIM}</b></div></div></div>`;
 const fn=`<div class=c><h4>Sales Funnel &middot; All Time</h4>${apxFunnel([['Contacts',s.con],['Appointments',s.app],['Submitted',s.p.length],['Issued / Paid',s.iss.length]])}</div>`;
 const ck=cmk,top=grp(D.policies.filter(x=>live(x)&&mon(x.d)===ck),x=>x.ag||'Unassigned',x=>x.ap).slice(0,5);
 const tp=`<div class="c mod" tabindex=0 role=button onclick="${apxGo('Agents')}" onkeydown="if(event.key=='Enter')this.click()"><h4>Top Producers &middot; ${APX_MN[now.getMonth()]}</h4>${apxRank(top)}<em class=open>AGENTS &#9656;</em></div>`;
 const im=`<div class="c mod" tabindex=0 role=button onclick="${apxGo('Income')}" onkeydown="if(event.key=='Enter')this.click()"><h4>Where the Money Comes From</h4>${dn([['Policy Commission',s.pr],...grp(D.income,x=>x.src,x=>x.amt),['Portfolio Invested',s.pv]].filter(r=>r[1]>0))}<em class=open>INCOME &#9656;</em></div>`;
 const ex=grp(D.expenses,x=>x.cat||'Other',x=>x.amt).slice(0,6);
 const em=`<div class="c mod" tabindex=0 role=button onclick="${apxGo('Expenses')}" onkeydown="if(event.key=='Enter')this.click()"><h4>Where the Money Goes</h4>${hb(ex)}<div class=apx-gs style="margin-top:12px"><div><small>Lead spend</small><b>${apxK(s.lead)}</b></div><div><small>Cost per lead</small><b>${s.leadsN?$(s.lead/s.leadsN):'-'}</b></div><div><small>Lead ROI</small><b>${s.lead?((s.rev-(s.pv||0))/s.lead).toFixed(1)+'x':'-'}</b></div></div><em class=open>EXPENSES &#9656;</em></div>`;
 const pm=`<div class=c><h4>Issued Premium by Product</h4>${dn(grp(s.iss,x=>x.prod||'Other',x=>x.ap))}</div>`;
 const lt=D.policies.map((x,i)=>[x,i]).sort((a,b)=>String(b[0].d).localeCompare(String(a[0].d))).slice(0,6);
 const lp=`<div class=c><div class=apx-ch><h4>Latest Policies</h4><button class="btn o sm" onclick="${apxGo('Policies')}">All policies</button></div>${lt.length?lt.map(([x,i])=>`<div class=apx-lp><span class=apx-st style="--c:${APX_STC[x.st]||'#8a8a9a'}">${esc(x.st)}</span><span class=apx-lpn><b>${esc(x.cl)}</b><small>${esc(x.d)} &middot; ${esc(x.ag||'Unassigned')} &middot; ${esc(x.prod||'')}</small></span><em>${$(x.ap)}</em>${apxEB('policies',i)}</div>`).join(''):'<p class=mut>No policies yet. Use + Policy to log one.</p>'}</div>`;
 return tiles+`<div class=apx-r21>${trend}${goal}</div><div class=apx-r3>${fn}${tp}${im}</div><div class=apx-r3>${em}${pm}${lp}</div>`}
/* Policies: the status mix as one bar above the list */
function apxPolHead(){const L=D.policies,n=L.length;if(!n)return'';const by=PS.map(st=>[st,L.filter(x=>x.st===st)]).filter(r=>r[1].length);
 return`<div class="c apx-ph"><div class=apx-ch><h4>${n} Policies &middot; ${$(sum(L,x=>x.ap))} Submitted Premium</h4><small>${P(L.filter(live).length/n)} placed</small></div><div class=apx-sb>${by.map(r=>`<i style="--c:${APX_STC[r[0]]||'#8a8a9a'};flex:${r[1].length}" title="${r[0]}: ${r[1].length}"></i>`).join('')}</div>
 <div class=apx-sl2><button class="apx-stk ${pf==='All'?'on':''}" style="--c:#c9c9d3" onclick="pf='All';go()"><i></i>All <b>${n}</b></button>${by.map(r=>`<button class="apx-stk ${pf===r[0]?'on':''}" style="--c:${APX_STC[r[0]]||'#8a8a9a'}" onclick="pf=pf==='${r[0]}'?'All':'${r[0]}';go()"><i></i>${r[0]} <b>${r[1].length}</b><small>${$(sum(r[1],x=>x.ap))}</small></button>`).join('')}</div></div>`}
/* Income: totals, the mix, month by month, and every entry (editable) */
function apxIncome(){const s=S(),R=apxRows(12),L=D.income.map((x,i)=>[x,i]).sort((a,b)=>String(b[0].d).localeCompare(String(a[0].d))),show=APXI?L:L.slice(0,25);
 return`<div class=g>${kpi('Policy Commission',cu(s.pr,'$'),'Issued and paid policies')}${kpi('Other Income',cu(s.oi,'$'),D.income.length+' entries')}${s.pv?kpi('Portfolio Invested',cu(s.pv,'$'),'Cost basis of your holdings (Portfolio)'):''}${kpi('Total Income',cu(s.rev,'$'))}</div>
<div class=apx-r2><div class=c><h4>Income by Source</h4>${dn([['Policy Commission',s.pr],...grp(D.income,x=>x.src,x=>x.amt),['Portfolio Invested',s.pv]].filter(r=>r[1]>0))}</div><div class=c><h4>Income by Month</h4>${gb(R.map(r=>[apxML(r.k),r.com,r.oi+r.iv]),['Commission','Other'],['#ff1f4f','#5ac8ff'])}</div></div>
<h3>Income entries</h3>${L.length?`<div class="c sc"><table><tr><th>Date<th>Source<th class=n>Amount<th>Note<th></tr>${show.map(([x,i])=>`<tr><td>${esc(x.d)}<td>${esc(x.src)}<td class=n>${$(x.amt)}<td class=mut>${esc(x.n||'')}<td class=apx-ra>${apxEB('income',i)}<button class=x title="Delete entry" onclick="ask('Delete this income entry?',()=>del('income',${i}))">&times;</button></tr>`).join('')}</table>${L.length>show.length?`<button class="btn o" style="margin-top:10px" onclick="APXI=1;go()">Show all ${L.length}</button>`:''}</div>`:'<div class=c><p class=mut>No other income logged yet. Policy commission counts on its own; use + Income for overrides, renewals and the rest.</p></div>'}`}
/* Statement: the charts above the monthly table */
function apxPnl(){const R=apxRows(12),T=sum(R,r=>r.net);
 return`<div class=apx-r2><div class=c><h4>Income vs. Expenses &middot; 12 Months</h4>${gb(R.map(r=>[apxML(r.k),r.inc,r.exp]),['Income','Expenses'])}</div><div class=c><div class=apx-ch><h4>Net Profit by Month</h4><small class="${T<0?'neg':'pos'}">${$(T)} in 12 months</small></div>${nb(R.map(r=>[apxML(r.k),r.net]))}</div></div><h3>Monthly statement</h3>`}
/* Agents: the activity log under the scorecard (every entry editable) */
function apxActLog(){const L=(D.activity||[]).map((x,i)=>[x,i]).sort((a,b)=>String(b[0].d).localeCompare(String(a[0].d))),show=APXA?L:L.slice(0,15);
 return`<h3>Activity log</h3><small style="margin:-4px 0 8px;display:block">Hours, contacts and appointments logged. Edit or remove any entry.</small>`+(L.length?`<div class="c sc"><table><tr><th>Date<th>Agent<th class=n>Hours<th class=n>Contacts<th class=n>Appointments<th></tr>${show.map(([x,i])=>`<tr><td>${esc(x.d)}<td>${esc(x.ag||'Unassigned')}<td class=n>${+x.h||0}<td class=n>${+x.con||0}<td class=n>${+x.app||0}<td class=apx-ra>${apxEB('activity',i)}<button class=x title="Delete entry" onclick="ask('Delete this activity entry?',()=>del('activity',${i}))">&times;</button></tr>`).join('')}</table>${L.length>show.length?`<button class="btn o" style="margin-top:10px" onclick="APXA=1;go()">Show all ${L.length}</button>`:''}</div>`:'<div class=c><p class=mut>No activity logged yet. Use + Activity.</p></div>')}
/* ---------- editing: the same form as adding, filled in ---------- */
const APX_EF={policies:['P','Policy',[['pd','d'],['pc','cl'],['pg','ag'],['pk','car'],['pp','prod'],['psr','src'],['pa','ap'],['pt','pct'],['ps','st']]],
 expenses:['E','Expense',[['ed','d'],['ec','cat'],['ea','amt'],['el','leads'],['es','src'],['en','n']]],
 income:['I','Income',[['ii','d'],['is','src'],['ia','amt'],['inn','n']]],
 activity:['A','Activity',[['ad','d'],['ab','ag'],['ah','h'],['ac','con'],['aa','app']]]};
function apxEB(k,i){return`<button class="x apx-eb" title="Edit" aria-label="Edit" onclick="event.stopPropagation();apxEdit('${k}',${i})">&#9998;</button>`}
function apxEdit(k,i){const F=APX_EF[k],r=D[k]&&D[k][i];if(!F||!r)return;openM(F[0]);APXE={k,i,id:r._i||null,ref:r,sig:apxSig(k,r)};
 F[2].forEach(([id,f])=>{const e=document.getElementById(id);if(!e)return;let v=r[f];if(v==null)v='';if(f==='ag'&&!v)v='Unassigned';v=String(v);
  if(e.tagName==='SELECT'){if(![...e.options].some(o=>o.value===v||o.text===v)){const o=document.createElement('option');o.text=v;e.add(o)}e.value=v}else e.value=v});
 const md=document.getElementById('md'),h=md.querySelector('.c h4');if(h)h.textContent='Edit '+F[1];
 const sv=[...md.querySelectorAll('.c > button.btn')].find(b=>!b.classList.contains('o'));if(sv){sv.setAttribute('onclick','apxSave()');sv.textContent='Save changes';sv.insertAdjacentHTML('afterend',' <button class="btn o apx-del" onclick="apxDelAsk()">Delete</button>')}}
function apxSig(k,r){return JSON.stringify(APX_EF[k][2].map(f=>r[f[1]]==null?'':String(r[f[1]])))}
/* the record being edited: by its sync id, the same object, or (after a sync replaced the objects) the one with the same fields */
function apxFind(){const E=APXE;if(!E)return null;const a=D[E.k]||[];let r=E.id?a.find(x=>x._i===E.id):null;if(!r&&a.indexOf(E.ref)>=0)r=E.ref;if(!r&&a[E.i]&&apxSig(E.k,a[E.i])===E.sig)r=a[E.i];if(!r)r=a.find(x=>apxSig(E.k,x)===E.sig)||null;return r}
function apxSave(){const E=APXE,r=apxFind();if(!E)return;if(!r){closeM();APXE=null;return toast('That entry was changed or removed somewhere else. Open it again.')}
 const t=id=>{const e=document.getElementById(id);return e?String(e.value).trim():''},n=id=>+t(id)||0,k=E.k;
 if(k==='policies'){if(!n('pa')||!t('pd'))return toast('Enter a date and premium.');Object.assign(r,{d:t('pd'),cl:t('pc')||'Client',ag:t('pg'),car:t('pk')||'Unknown',prod:t('pp'),src:t('psr'),ap:n('pa'),pct:n('pt'),st:t('ps')})}
 else if(k==='expenses'){if(!n('ea')||!t('ed'))return toast('Enter a date and amount.');Object.assign(r,{d:t('ed'),cat:t('ec'),amt:n('ea'),leads:n('el'),src:t('es'),n:t('en')})}
 else if(k==='income'){if(!n('ia')||!t('ii'))return toast('Enter a date and an amount.');Object.assign(r,{d:t('ii'),src:t('is'),amt:n('ia'),n:t('inn')})}
 else if(k==='activity'){if(!t('ad'))return toast('Enter a date.');Object.assign(r,{d:t('ad'),ag:t('ab'),h:n('ah'),con:n('ac'),app:n('aa')})}
 save();closeM();APXE=null;go();toast(APX_EF[k][1]+' updated',1)}
function apxDelAsk(){const E=APXE;if(!E)return;const nm=APX_EF[E.k][1];ask('Delete this '+nm.toLowerCase()+'?',()=>{const r=apxFind(),a=D[E.k]||[],i=a.indexOf(r);if(i>=0){a.splice(i,1);save()}APXE=null;go();toast(nm+' deleted',1)})}
/* ---------- the Command Deck ---------- */
/* the next follow-ups (each opens that client) */
function apxFu(){let q=[];try{q=MYCL().filter(c=>c.fu).sort((a,b)=>a.fu.localeCompare(b.fu)).slice(0,3)}catch(e){}
 return`<div class=apx-nx><h4>Follow-Up Queue</h4>${q.length?q.map(c=>`<div class=qr onclick="event.stopPropagation();cid=${c.id};openTab('Clients')"><span>${esc(c.name)}</span><small class="${c.fu<=today?'neg':''}">${c.fu<today?'OVERDUE ':''}${esc(c.fu)}</small></div>`).join(''):'<p class=mut>No follow-ups scheduled.</p>'}</div>`}
function apxPeeks(){const s=S(),R=apxRows(6),c=R[R.length-1],p=apxPrev(),pa=PA(),top=grp(D.policies.filter(x=>live(x)&&mon(x.d)===cmk),x=>x.ag||'Unassigned',x=>x.ap)[0];
 const card=(to,ic,t,body,cls)=>`<div class="c mod apx-pk ${cls||''}" tabindex=0 role=button onclick="${to}" onkeydown="if(event.key=='Enter')this.click()"><div class=apx-pkh><h4>${ic} ${t}</h4><em class=open>OPEN &#9656;</em></div>${body}</div>`;
 const a=card(`openTab('Agency Performance','Overview')`,'&#9650;','Agency Performance',`<div class=apx-pkm><b>${apxK(c.iss)}</b><small>issued this month</small></div>${apxDelta(c.iss,p.iss)}${apxMini(R,['sub','iss'],['#4a4a58','#ff1f4f'])}<div class=apx-pkf><span>Placement <b>${P(s.iss.length/s.p.length)}</b></span><span>Top <b>${top?esc(String(top[0]).split(' ')[0]):'-'}</b></span><span>Apps <b>${c.n}</b></span></div>`);
 const m=card(`openTab('Agency Performance','Statement')`,'&#9670;','Money',`<div class=apx-pkm><b class="${c.net<0?'neg':'pos'}">${apxK(c.net)}</b><small>net profit this month</small></div>${apxDelta(c.net,p.net)}${apxMini(R,['inc','exp'],['#5ac8ff','#8a8a9a'])}<div class=apx-pkf><span>In <b>${apxK(c.inc)}</b></span><span>Out <b>${apxK(c.exp)}</b></span><span>Margin <b>${P(s.net/s.rev)}</b></span></div>`);
 const e=card(`openTab('Production Equation')`,'&#8721;','Production Equation',`<div class=apx-pkm><b>${pa.has?'Path '+pa.n:'-'}</b><small>${pa.has?esc(NM[pa.n-1]):'Log activity to place yourself'}</small></div><div class=apx-pq>${quad(pa.hw,pa.lw,pa.hT,pa.lT,pa.n,pa.has)}</div><div class=apx-pkf><span>Hours/wk <b>${(pa.hw||0).toFixed(1)}</b></span><span>Leads/wk <b>${apxK(pa.lw)}</b></span><span>Training <b>${apxK(s.self)}</b></span></div>`);
 let cl='';try{if(typeof crmOn==='function'&&crmOn()&&CRM.ready){const w=crmScope(),k=crmDeckStats(w);
  cl=card(`openTab('Clients','Today')`,'&#9776;','Clients',`<div class=apx-cs><div class="${k.overdue?'neg':''}"><b>${k.overdue}</b><small>Overdue</small></div><div><b>${k.dueToday}</b><small>Due today</small></div><div><b>${k.newLeads}</b><small>New leads</small></div><div><b>${k.apptsToday}</b><small>Appts today</small></div></div>
   ${apxFu()}`)}}catch(x){}
 if(!cl){const L=MYCL();cl=card(`openTab('Clients')`,'&#9776;','Clients',`<div class=apx-pkm><b>${L.length}</b><small>clients in your book</small></div>${apxFu()}`)}
 return`<div class=apx-hh><h3>Sneak Peeks</h3><small>Tap a card to open it</small></div><div class=apx-peeks>${a}${m}${e}${cl}</div>`}
function ov(){const s=S(),m=sum(s.iss.filter(x=>mon(x.d)===cmk),x=>x.ap),h=HS(),f=FC(),R=agentRows(),hr=now.getHours(),gr=hr<12?'Good morning':hr<18?'Good afternoon':'Good evening',R6=apxRows(6),c=R6[R6.length-1];
 const opt=fn=>{try{return typeof fn==='function'?fn():''}catch(e){return''}};
 return hd('Command Deck',`${gr}, ${esc(WHO)}. All systems nominal.`,[['+ Policy',"openM('P')"],['+ Income',"openM('I')"],['+ Expense',"openM('E')"],['+ Activity',"openM('A')"]])+
 `${WHO==='Agency Owner'?opt(typeof cqHtml==='function'?cqHtml:null):''}${opt(typeof mrBanner==='function'?mrBanner:null)}<div class="deck apx-deck"><div class=dl>${mod('Issued Premium','&#9650;',cu(c.iss,'$'),'This month &middot; '+P(s.iss.length/s.p.length)+' placed',apxSpark(R6.map(r=>r.iss)),'Agency Performance','Overview')}${mod('Total Income','&#9670;',cu(c.inc,'$'),'This month &middot; '+$(c.exp)+' spent',apxSpark(R6.map(r=>r.inc),'#5ac8ff'),'Agency Performance','Income')}</div>
<div class=dc>${reactor(cu(s.net,'$'),m/D.goal,'NET PROFIT')}<small style="margin-top:8px">Monthly goal: ${P(m/D.goal)} (${$(m)} of ${$(D.goal)} issued)</small><div class=chips><div><small>HEALTH</small><b>${h.score}</b></div><div><small>FORECAST</small><b>${apxK(f.proj)}</b></div><div><small>PIPELINE</small><b>${apxK(f.pend)}</b></div></div></div>
<div class=dr>${mod('Net Profit','&#9672;',`<span class="${c.net<0?'neg':'pos'}">${cu(c.net,'$')}</span>`,'This month &middot; '+P(s.net/s.rev)+' margin all time',apxSpark(R6.map(r=>r.net),'#3ddc97'),'Agency Performance','Statement')}${mod('Team Pace','&#9733;',R.filter(r=>r.goal&&r.w>=r.goal).length+' / '+R.filter(r=>r.goal).length,'Agents at their weekly goal',apxSpark(R6.map(r=>r.app),'#ffcf40'),'Agency Performance','Agents')}</div></div>
${pulseHtml()}${apxPeeks()}
<div class="g2 apx-low"><div class=c><h4>Command Briefing</h4>${brief().map((b,i)=>`<div class="bl ${b[0]}" style="animation-delay:${i*.4}s"><i></i><span>${b[1]}</span></div>`).join('')}<h4 style="margin-top:14px">Team Chat</h4><div id=chbf>${opt(typeof chBrief==='function'?chBrief:null)}</div><button class="btn o" onclick="speak()">Speak briefing</button></div>
<div class=c><h4>Latest Alerts</h4><div id=dal>${opt(typeof latestAl==='function'?latestAl:null)}</div><button class="btn o" onclick="toggleRail(true)">Open alert center</button><h4 style="margin-top:16px">Agent Progress &middot; Last 7 Days</h4>${gpBars(R)}</div>
${opt(typeof mrDeck==='function'?mrDeck:null)}${opt(typeof chDeck==='function'?chDeck:null)}</div>`}
const APX_CSS=`
.apx-seg{align-items:center}.apx-sl{font:700 9px Verdana,"DejaVu Sans",sans-serif;letter-spacing:2px;text-transform:uppercase;color:var(--mut);padding:0 2px 0 10px;border-left:1px solid var(--ln);margin-left:4px}
.apx-kp{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.apx-t{position:relative;overflow:hidden;cursor:pointer;transition:transform .2s,box-shadow .2s;min-height:128px;display:flex;flex-direction:column}
.apx-t:hover,.apx-t:focus-visible,.apx-pk:hover{transform:translateY(-2px);box-shadow:0 10px 26px #ff1f4f1f,inset 0 0 0 1px #ff1f4f40}
.apx-t h4{margin:0 0 6px}.apx-tv{font-size:27px;font-weight:700;letter-spacing:.5px;line-height:1.15}.apx-t small{color:var(--mut);font-size:11px;line-height:1.45;margin-top:4px;display:block}
.apx-sp{width:100%;height:36px;margin-top:auto;display:block;padding-top:8px}.apx-sp0{height:36px;margin-top:auto}
.apx-d{display:inline-block;font:700 10px Verdana,"DejaVu Sans",sans-serif;letter-spacing:.6px;font-style:normal;margin-top:6px}.apx-d i{font-style:normal;color:var(--mut);font-weight:400}.apx-d.up{color:var(--ok)}.apx-d.dn{color:#ff6b8a}.apx-d.fl{color:var(--mut);font-weight:400}
.apx-np{background:linear-gradient(160deg,#3ddc9714,transparent 60%),var(--card)}
.apx-r21{display:grid;grid-template-columns:minmax(0,2.1fr) minmax(250px,1fr);gap:12px;margin-top:12px}
.apx-r3{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-top:12px}
.apx-r2{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:12px;margin:14px 0 4px}
.apx-ch{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}.apx-ch h4{margin:0 0 8px}.apx-ch small{color:var(--mut);font-size:11px}
.apx-tr{width:100%;height:auto;display:block}.apx-gl{stroke:#2b2b36;stroke-width:1;stroke-dasharray:2 4}.apx-zl{stroke:#6d6d7a;stroke-width:1}.apx-ax{fill:#9a9aa8;font:10px Verdana,"DejaVu Sans",sans-serif}
.apx-bs{fill:#4a4a58}.apx-bi{fill:#ff1f4f}.apx-bg{animation:apxrise .7s both;transform-origin:center bottom}.apx-bg:hover rect{opacity:.85}
.apx-nl{fill:none;stroke:#3ddc97;stroke-width:2.2;stroke-linejoin:round;filter:drop-shadow(0 0 4px #3ddc9780);stroke-dasharray:1;stroke-dashoffset:1;animation:apxdraw 1.4s .3s forwards}.apx-nd{fill:#0b0b10;stroke:#3ddc97;stroke-width:2}
@keyframes apxdraw{to{stroke-dashoffset:0}}@keyframes apxrise{from{opacity:0;transform:scaleY(.2)}to{opacity:1;transform:none}}
.apx-lg{display:flex;gap:16px;flex-wrap:wrap;margin-top:6px;font-size:11px;color:var(--mut)}.apx-lg i{display:inline-block;width:10px;height:10px;margin-right:6px;vertical-align:-1px}.apx-lg i.s{background:#4a4a58}.apx-lg i.i{background:#ff1f4f}.apx-lg i.n{background:#3ddc97;height:3px;vertical-align:3px}
.apx-goal{display:flex;flex-direction:column;align-items:center;text-align:center}.apx-goal h4{align-self:flex-start}
.apx-rg{position:relative;width:170px;height:170px;margin:4px auto 0}.apx-rg svg{width:100%;height:100%}.apx-rb{fill:none;stroke:#1f1f29;stroke-width:12}.apx-rf{fill:none;stroke:#ff1f4f;stroke-width:12;stroke-linecap:round;filter:drop-shadow(0 0 6px #ff1f4f90);transition:stroke-dasharray 1s}.apx-rf.ok{stroke:#3ddc97;filter:drop-shadow(0 0 6px #3ddc9790)}.apx-rt{fill:none;stroke:#2b2b36;stroke-width:1;stroke-dasharray:2 5}
.apx-rc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}.apx-rc b{font-size:30px}.apx-rc small{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--mut)}.apx-rs{color:var(--mut);font-size:11px;margin-top:6px;display:block}
.apx-gs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;width:100%;margin-top:14px}.apx-gs>div{background:#0f0f15;border:1px solid var(--ln);padding:8px 6px;text-align:center}.apx-gs small{display:block;font-size:9px;letter-spacing:1.4px;text-transform:uppercase;color:var(--mut)}.apx-gs b{font-size:15px}
.apx-fn{display:flex;flex-direction:column;align-items:center;gap:2px;margin-top:6px}
.apx-fs{width:var(--w);min-width:210px;max-width:100%;box-sizing:border-box;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 12px;background:linear-gradient(90deg,#ff1f4f38,#ff1f4f14);border:1px solid #ff1f4f55;clip-path:polygon(0 0,100% 0,calc(100% - 8px) 100%,8px 100%);animation:apxin .5s var(--d) both}
.apx-fs b{font-size:11px;letter-spacing:1px;text-transform:uppercase}.apx-fs em{font-style:normal;font-weight:700;font-size:15px}.apx-fc{font:700 10px Verdana,"DejaVu Sans",sans-serif;color:#ffcf40;letter-spacing:.6px;padding:2px 0}.apx-fc i{font-style:normal;color:var(--mut);font-weight:400}
@keyframes apxin{from{opacity:0;transform:scaleX(.6)}to{opacity:1;transform:none}}
.apx-rk{display:grid;grid-template-columns:18px 26px minmax(0,1fr) auto;align-items:center;gap:8px;padding:6px 0;border-bottom:1px dashed var(--ln)}.apx-rk:last-of-type{border-bottom:0}
.apx-rn{font:700 11px Verdana,"DejaVu Sans",sans-serif;font-style:normal;color:var(--red)}.apx-rk span b{display:block;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.apx-rk em{font-style:normal;font-weight:700;font-size:13px}
.apx-rb2{display:block;height:5px;background:#0f0f15;margin-top:4px}.apx-rb2 b{display:block;height:100%;background:linear-gradient(90deg,#b0102f,#ff1f4f)}
.apx-lp{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:10px;padding:7px 0;border-bottom:1px dashed var(--ln)}.apx-lp:last-child{border-bottom:0}
.apx-st{font:700 9px Verdana,"DejaVu Sans",sans-serif;letter-spacing:1px;text-transform:uppercase;color:var(--c);border:1px solid var(--c);padding:3px 6px;min-width:74px;text-align:center}
.apx-lpn b{display:block;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.apx-lpn small{color:var(--mut);font-size:10.5px}.apx-lp em{font-style:normal;font-weight:700}
.apx-eb{font-size:14px!important;color:#c9c9d3!important;padding:2px 6px}.apx-eb:hover{color:#ffcf40!important}.apx-ra{white-space:nowrap;text-align:right}
.apx-ph{margin-bottom:12px}.apx-sb{display:flex;height:12px;gap:2px;margin:4px 0 12px}.apx-sb i{background:var(--c);box-shadow:0 0 8px color-mix(in srgb,var(--c) 50%,transparent);animation:apxin .6s both}
.apx-sl2{display:flex;flex-wrap:wrap;gap:8px}.apx-stk{display:flex;align-items:center;gap:6px;background:#0f0f15;border:1px solid var(--ln);color:var(--tx);padding:7px 10px;cursor:pointer;font:12px Verdana,"DejaVu Sans",sans-serif}
.apx-stk i{width:9px;height:9px;background:var(--c)}.apx-stk small{color:var(--mut);font-size:10.5px}.apx-stk.on{border-color:var(--c);background:color-mix(in srgb,var(--c) 14%,#0f0f15)}
.apx-hh{display:flex;align-items:baseline;gap:12px;margin:22px 0 8px}.apx-hh h3{margin:0}.apx-hh small{color:var(--mut);font-size:11px}
.apx-peeks{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}
.apx-pk{display:flex;flex-direction:column;min-height:230px}.apx-pkh{display:flex;justify-content:space-between;align-items:center}.apx-pkh h4{margin:0}.apx-pk .open{position:static}
.apx-pkm{margin-top:10px}.apx-pkm b{font-size:26px;display:block;line-height:1.15}.apx-pkm small{color:var(--mut);font-size:11px}
.apx-mi{width:100%;height:auto;margin-top:8px;display:block}
.apx-pkf{display:flex;justify-content:space-between;gap:6px;margin-top:auto;padding-top:10px;border-top:1px solid var(--ln);font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:var(--mut)}.apx-pkf b{display:block;color:var(--tx);font-size:13px;letter-spacing:0;text-transform:none;margin-top:2px}
.apx-pq{margin-top:6px;opacity:.95}.apx-pq svg{max-height:120px}
.apx-cs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:10px}.apx-cs>div{background:#0f0f15;border:1px solid var(--ln);padding:8px}.apx-cs b{font-size:20px;display:block}.apx-cs small{font-size:9px;letter-spacing:1.3px;text-transform:uppercase;color:var(--mut)}.apx-cs .neg b{color:#ff6b8a}
.apx-nx{margin-top:10px}.apx-nx h4{font-size:9.5px!important;margin:0 0 4px!important;color:var(--mut)!important}.apx-nx .qr{cursor:pointer;margin:0;padding:6px 0!important;border-left:0!important;background:none!important}.apx-nx>div{display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px dashed var(--ln);font-size:12px}.apx-nx>div:last-child{border-bottom:0}.apx-nx span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.apx-nx small{color:#ffcf40;font-size:10px;white-space:nowrap}
.apx-low{margin-top:14px}
@media(max-width:1100px){.apx-r21{grid-template-columns:minmax(0,1fr)}}
@media(max-width:640px){.apx-tv{font-size:23px}.apx-sl{display:none}.apx-kp{grid-template-columns:repeat(2,minmax(0,1fr))}.apx-t{min-height:118px;padding:12px}.apx-lp{grid-template-columns:auto minmax(0,1fr) auto}.apx-lp .apx-eb{display:none}}
@media(prefers-reduced-motion:reduce){.apx-bg,.apx-fs,.apx-sb i{animation:none}.apx-nl{animation:none;stroke-dashoffset:0}}
`;
(function(){try{const s=document.createElement('style');s.id='apxcss';s.textContent=APX_CSS;(document.body||document.head).appendChild(s)}catch(e){}})();
/*APXend*/
