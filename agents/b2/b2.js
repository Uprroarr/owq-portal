/*B2start*/
/* v118 Agency Performance in two halves.
   SALES PERFORMANCE (everyone): Overview (sales only), Policies, Agents, Lead ROI, Time Report, Business Analytics (the old
   Production Equation). BUSINESS PERFORMANCE (LLC) (Agency Owner and Cole Leckey only): LLC Overview, Income, Expenses,
   Statement, Portfolio, Capital (private equity, notes, loans, owner money in and out, each allocated to business or
   personal cash flow; kept in the owner's private document). The portfolio is owner-only again (PF_TEAM). Ask Claude (Team):
   quick answers, web search, drafts and a personal task list, through the agency's Claude connection. */
function bizOwner(){try{return!window.OWQ_GUEST&&typeof WHO!=='undefined'&&(WHO==='Agency Owner'||WHO==='Cole Leckey')}catch(e){return false}}
APX_SALES.splice(0,APX_SALES.length,'Policies','Agents','Lead ROI','Time Report','Business Analytics');
APX_MONEY.splice(0,APX_MONEY.length,'LLC Overview','Income','Expenses','Statement','Portfolio','Capital');
apxTabs=function(){return['Overview'].concat(APX_SALES,bizOwner()?APX_MONEY.filter(x=>x!=='Portfolio'||apxOwner()):[])};
try{Object.defineProperty(NSUB,'Agency Performance',{get:()=>apxTabs(),enumerable:true,configurable:true})}catch(e){}
apxSeg=function(){const cur=SUB['Agency Performance'],b=x=>`<button class="${cur===x?'on':''}" onclick="${apxGo(x)}">${x}</button>`;
 return`<div class=b2tabs role=tablist aria-label="Agency Performance"><div class="b2row s"><b>Sales Performance</b><div class="seg apx-seg">${['Overview'].concat(APX_SALES).map(b).join('')}</div></div>`+
 (bizOwner()?`<div class="b2row l"><b>&#128274; Business Performance &middot; LLC</b><div class="seg apx-seg">${APX_MONEY.filter(x=>x!=='Portfolio'||apxOwner()).map(b).join('')}</div></div>`:'')+`</div>`};
{const _n=apxNorm;apxNorm=function(){try{if(tab==='Production Equation'){tab='Agency Performance';SUB['Agency Performance']='Business Analytics'}}catch(e){}return _n.apply(this,arguments)}}
try{delete views['Production Equation']}catch(e){}
try{APX_FROM_BP.Summary='LLC Overview'}catch(e){}
function b2Strip(h){const i=h.indexOf('</div></div>');return h.indexOf('<div class=hd>')===0&&i>0?h.slice(i+12):h}
{const _ag=ag;ag=function(){apxNorm();const T=SUB['Agency Performance'],biz=bizOwner();
 if(APX_MONEY.includes(T)&&!biz){SUB['Agency Performance']='Overview';return ag()}
 if(T==='Overview')return hd('Agency Performance','Sales performance at a glance: production, pipeline, leads and the team.',[['+ Policy',"openM('P')"],['+ Activity',"openM('A')"],['+ Lead buy',"lrAdd()"]])+apxSeg()+b2Sales();
 if(T==='Lead ROI')return hd('Agency Performance','Lead ROI: what each lead buy cost and what it brought back.',[['+ Add leads purchased',"lrAdd()"]])+apxSeg()+lrPage();
 if(T==='Business Analytics')return hd('Agency Performance','Business Analytics: where your hours and lead spend put you on the growth path.',[['+ Activity',"openM('A')"],['+ Lead buy',"lrAdd()"]])+apxSeg()+b2Strip(eqn());
 if(T==='LLC Overview')return hd('Agency Performance','The LLC: income, expenses, profit, investments and capital. Agency Owner only.',[['+ Income',"openM('I')"],['+ Expense',"openM('E')"]])+apxSeg()+'<div class=b2llcw>'+b2Llc()+'</div>';
 if(T==='Capital')return hd('Agency Performance','Capital: private equity, notes, loans and owner money, allocated to business or personal cash flow. Private to you.',[['+ Capital entry',"capAdd()"]])+apxSeg()+'<div class=b2llcw>'+capPage()+'</div>';
 let h=_ag();if(APX_MONEY.includes(T)){const sg=apxSeg(),i=h.indexOf(sg);if(i>=0)h=h.slice(0,i+sg.length)+'<div class=b2llcw>'+h.slice(i+sg.length)+'</div>'}return h}}
/* ---------- sales overview: production, pipeline, leads, hours, the team (no LLC money) ---------- */
function b2LeadM(k){return sum(D.expenses.filter(x=>isLeadEx(x)&&mon(x.d)===k),x=>+x.amt||0)}
function b2Bars(R){const W=720,H=220,L=46,B=24,T=12,iw=W-L-10,ih=H-B-T,mx=Math.max(1,...R.map(r=>Math.max(r.sub,r.iss))),gw=iw/R.length,bw=Math.max(4,Math.min(16,gw*.3)),y=v=>T+ih-v/mx*ih;
 let g='';for(let i=0;i<=4;i++){const v=mx*i/4;g+=`<line x1=${L} x2=${W-10} y1=${y(v).toFixed(1)} y2=${y(v).toFixed(1)} class=apx-gl /><text x=${L-6} y=${(y(v)+3).toFixed(1)} text-anchor=end class=apx-ax>${apxK(v)}</text>`}
 R.forEach((r,i)=>{const x=L+gw*i+gw/2;g+=`<rect x=${(x-bw-1).toFixed(1)} y=${y(r.sub).toFixed(1)} width=${bw} height=${(T+ih-y(r.sub)).toFixed(1)} fill="#6d6d7a" rx=1><title>${apxML(r.k)}: ${$(r.sub)} submitted AP</title></rect><rect x=${(x+1).toFixed(1)} y=${y(r.iss).toFixed(1)} width=${bw} height=${(T+ih-y(r.iss)).toFixed(1)} fill="#ff1f4f" rx=1><title>${apxML(r.k)}: ${$(r.iss)} issued</title></rect><text x=${x.toFixed(1)} y=${H-6} text-anchor=middle class=apx-ax>${apxML(r.k)}</text>`});
 return`<svg viewBox="0 0 ${W} ${H}" width=100% class=apx-tr role=img aria-label="Submitted AP and issued premium by month">${g}</svg><div class=apx-lg><span><i style="background:#6d6d7a"></i>Submitted AP</span><span><i style="background:#ff1f4f"></i>Issued premium</span></div>`}
function b2Sales(){const s=S(),R=apxRows(12),c=R[R.length-1],p=apxPrev(),v=k=>R.map(r=>r[k]),f=FC(),gl=+D.goal||0,mIss=c.iss,ck=cmk;
 const lm=b2LeadM(ck),lmp=b2LeadM(apxMk(-1)),lN=sum(D.expenses.filter(x=>isLeadEx(x)&&mon(x.d)===ck),x=>+x.leads||0),cm=sum(D.policies.filter(x=>live(x)&&mon(x.d)===ck),com);
 let EH={h:0,goalH:0,paceH:0};try{EH=eqPer('mo')}catch(e){}
 const tiles=`<div class=apx-kp>
 ${apxTile('Issued Premium',cu(c.iss,'$'),'This month &middot; '+$(s.issAP)+' all time',apxDelta(c.iss,p.iss),apxSpark(v('iss')),apxGo('Policies'))}
 ${apxTile('Annualized Premium (Submitted)',cu(c.sub,'$'),c.n+' application'+(c.n===1?'':'s')+' this month',apxDelta(c.sub,p.sub),apxSpark(v('sub'),'#c9c9d3'),apxGo('Policies'))}
 ${apxTile('Placement Rate',cu(s.p.length?s.iss.length/s.p.length*100:0,'%'),s.iss.length+' of '+s.p.length+' placed &middot; '+$(s.cb)+' in chargebacks','',apxSpark(R.map(r=>r.n?r.ni/r.n:0),'#ffcf40'),apxGo('Policies'))}
 ${apxTile('Lead Spend',cu(lm,'$'),'This month &middot; '+lN.toLocaleString()+' leads'+(lN?' &middot; '+$(lm/lN)+' each':''),apxDelta(lm,lmp,1),apxSpark(R.map(r=>b2LeadM(r.k)),'#8a8a9a'),apxGo('Lead ROI'))}
 ${apxTile('Lead ROI',lm?`<span class="${cm>=lm?'pos':'neg'}">${(cm/lm).toFixed(1)}x</span>`:'-','Commission issued this month per $1 of leads','','',apxGo('Lead ROI'))}
 ${apxTile('Hours This Month',cu(EH.h,'n'),'Goal '+(EH.goalH||0).toLocaleString()+' &middot; pace '+(EH.paceH||0).toLocaleString()+' by today','','',apxGo('Business Analytics'),EH.h>=EH.paceH?'apx-np':'')}
 </div>`;
 const trend=`<div class="c apx-wide"><div class=apx-ch><h4>Production &middot; Last 12 Months</h4><small>${$(sum(R,r=>r.sub))} submitted AP &middot; ${$(sum(R,r=>r.iss))} issued</small></div>${b2Bars(R)}</div>`;
 const goal=`<div class="c apx-goal"><h4>This Month's Goal</h4>${apxRing(gl?mIss/gl:0,gl?P(mIss/gl):'-','of goal',`${$(mIss)} of ${$(gl)} issued`)}<div class=apx-gs><div><small>On pace for</small><b>${apxK(f.proj)}</b></div><div><small>Pipeline</small><b>${apxK(f.pend)}</b></div><div><small>Day</small><b>${DOM}/${DIM}</b></div></div></div>`;
 const fn=`<div class=c><h4>Sales Funnel &middot; All Time</h4>${apxFunnel([['Contacts',s.con],['Appointments',s.app],['Submitted',s.p.length],['Issued / Paid',s.iss.length]])}</div>`;
 const pd=grp(D.policies.filter(x=>x.st==='Submitted'),x=>x.ag||'Unassigned',x=>x.ap),top=grp(D.policies.filter(x=>live(x)&&mon(x.d)===ck),x=>x.ag||'Unassigned',x=>x.ap).slice(0,5).map(r=>r.concat([(pd.find(q=>q[0]===r[0])||[0,0])[1]]));
 const tp=`<div class="c mod" tabindex=0 role=button onclick="${apxGo('Agents')}" onkeydown="if(event.key=='Enter')this.click()"><h4>Top Producers &middot; ${APX_MN[now.getMonth()]}</h4>${apxRank(top)}<em class=open>AGENTS &#9656;</em></div>`;
 const vs=lrVendors(D.expenses.filter(isLeadEx)).slice(0,5);
 const lv=`<div class="c mod" tabindex=0 role=button onclick="${apxGo('Lead ROI')}" onkeydown="if(event.key=='Enter')this.click()"><h4>Lead Vendors &middot; ROI</h4>${vs.length?vs.map(r=>`<div class=b2lv><span><b>${esc(r.v)}</b><small>${$(r.sp)} &middot; ${r.n.toLocaleString()} leads &middot; ${r.iss} issued</small></span><em class="${r.roi>=1?'pos':'neg'}">${r.sp?r.roi.toFixed(1)+'x':'-'}</em></div>`).join(''):'<p class=mut>No lead buys yet. Use + Lead buy.</p>'}<em class=open>LEAD ROI &#9656;</em></div>`;
 const pm=`<div class=c><h4>Issued Premium by Product</h4>${dn(grp(s.iss,x=>x.prod||'Other',x=>x.ap))}</div>`;
 const lt=D.policies.map((x,i)=>[x,i]).sort((a,b)=>String(b[0].d).localeCompare(String(a[0].d))).slice(0,6);
 const lp=`<div class=c><div class=apx-ch><h4>Latest Policies</h4><button class="btn o sm" onclick="${apxGo('Policies')}">All policies</button></div>${lt.length?lt.map(([x,i])=>`<div class=apx-lp><span class=apx-st style="--c:${APX_STC[x.st]||'#8a8a9a'}">${esc(x.st)}</span><span class=apx-lpn><b>${esc(x.cl)}</b><small>${esc(x.d)} &middot; ${esc(x.ag||'Unassigned')} &middot; ${esc(x.prod||'')}</small></span><em>${$(x.ap)}</em>${apxEB('policies',i)}</div>`).join(''):'<p class=mut>No policies yet. Use + Policy to log one.</p>'}</div>`;
 return tiles+`<div class=apx-r21>${trend}${goal}</div><div class=apx-r3>${fn}${tp}${lv}</div><div class=apx-r3>${pm}${lp}</div>`}
/* ---------- LLC overview: the money side ---------- */
function b2Llc(){const s=S(),R=apxRows(12),c=R[R.length-1],p=apxPrev(),v=k=>R.map(r=>r[k]);let pb=null;try{if(apxOwner()&&typeof pfBook==='function'&&PF.ready)pb=pfBook()}catch(e){}
 const cap=capTot();
 const tiles=`<div class=apx-kp>
 ${apxTile('Total Income',cu(c.inc,'$'),'This month &middot; '+$(s.rev)+' all time'+(s.pv?' (incl. '+$(s.pv)+' invested)':''),apxDelta(c.inc,p.inc),apxSpark(v('inc'),'#5ac8ff'),apxGo('Income'))}
 ${apxTile('Expenses',cu(c.exp,'$'),'This month &middot; '+$(s.exT)+' all time',apxDelta(c.exp,p.exp,1),apxSpark(v('exp'),'#8a8a9a'),apxGo('Expenses'))}
 ${apxTile('Net Profit',`<span class="${c.net<0?'neg':'pos'}">${cu(c.net,'$')}</span>`,'This month &middot; '+$(s.net)+' all time, '+P(s.net/s.rev)+' margin',apxDelta(c.net,p.net),apxSpark(v('net'),'#3ddc97'),apxGo('Statement'),'apx-np')}
 ${apxTile('Portfolio',pb?cu(pb.val,'$'):'-',pb?'Market value &middot; '+(pb.unr+pb.real>=0?'+':'')+$(pb.unr+pb.real)+' P&amp;L':'Open the Portfolio tab to load it','','',apxGo('Portfolio'))}
 ${apxTile('Capital (Business)',cu(cap.biz,'$'),'Net in &middot; '+cap.n+' entr'+(cap.n===1?'y':'ies'),'','',apxGo('Capital'))}
 ${apxTile('Capital (Personal)',cu(cap.per,'$'),'Allocated to personal cash flow','','',apxGo('Capital'))}
 </div>`;
 const trend=`<div class="c apx-wide"><div class=apx-ch><h4>Income, Expenses &amp; Profit &middot; Last 12 Months</h4><small>${$(sum(R,r=>r.inc))} income &middot; ${$(sum(R,r=>r.net))} net</small></div>${apxTrend(R)}</div>`;
 const im=`<div class="c mod" tabindex=0 role=button onclick="${apxGo('Income')}" onkeydown="if(event.key=='Enter')this.click()"><h4>Where the Money Comes From</h4>${dn([['Policy Commission',s.pr],...grp(D.income,x=>x.src,x=>x.amt),['Portfolio Invested',s.pv]].filter(r=>r[1]>0))}<em class=open>INCOME &#9656;</em></div>`;
 const em=`<div class="c mod" tabindex=0 role=button onclick="${apxGo('Expenses')}" onkeydown="if(event.key=='Enter')this.click()"><h4>Where the Money Goes</h4>${hb(grp(D.expenses,x=>x.cat||'Other',x=>x.amt).slice(0,6))}<em class=open>EXPENSES &#9656;</em></div>`;
 return tiles+`<div class=apx-r21>${trend}<div class=c><h4>Cash Flow Split</h4>${dn([['Business capital',Math.max(0,cap.biz)],['Personal capital',Math.max(0,cap.per)],['Net profit',Math.max(0,s.net)]].filter(r=>r[1]>0))}</div></div><div class=apx-r3>${im}${em}<div class=c><h4>Statements</h4><p class=mut>Profit and loss by month is on the Statement tab.</p><button class="btn o sm" onclick="${apxGo('Statement')}">Open Statement</button></div></div>`}
/* ---------- Lead ROI ---------- */
const LR_T=['Final Expense','Mortgage Protection','IUL','Term Life','Whole Life','Annuity','Medicare Supplement','Veteran','Other'];
const LR_A=['Real-time','Aged 1-2 weeks','Aged 3-4 weeks','Aged 5-8 weeks','Aged 9+ weeks','Aged 6+ months'];
var LR={per:'mo',ag:'All'};
function lrIn(x){if(!isLeadEx(x))return false;if(LR.ag!=='All'&&(x.ag||'')!==LR.ag)return false;const d=String(x.d||'');if(LR.per==='mo')return mon(d)===cmk;if(LR.per==='30'){const t=Date.parse(d);return isFinite(t)&&Date.now()-t<=30*864e5}return true}
function lrPol(v){v=String(v||'').toLowerCase().trim();return v?D.policies.filter(p=>String(p.src||'').toLowerCase().trim()===v&&(LR.ag==='All'||p.ag===LR.ag)):[]}
function lrVendors(E){const by={};E.forEach(x=>{const v=String(x.src||'').trim()||'Unnamed vendor',o=by[v]||(by[v]={v,sp:0,n:0,buys:0});o.sp+=+x.amt||0;o.n+=+x.leads||0;o.buys++});
 return Object.values(by).map(o=>{const P=lrPol(o.v),is=P.filter(live);o.apps=P.length;o.iss=is.length;o.iap=sum(is,x=>x.ap);o.cm=sum(is,com);o.roi=o.sp?o.cm/o.sp:0;o.cpl=o.n?o.sp/o.n:0;o.cpa=o.iss?o.sp/o.iss:0;o.close=o.n?o.iss/o.n:0;return o}).sort((a,b)=>b.sp-a.sp)}
function lrPage(){const E=D.expenses.map((x,i)=>[x,i]).filter(([x])=>lrIn(x)),X=E.map(r=>r[0]),V=lrVendors(X),sp=sum(X,x=>+x.amt||0),n=sum(X,x=>+x.leads||0),apps=sum(V,r=>r.apps),iss=sum(V,r=>r.iss),cm=sum(V,r=>r.cm),iap=sum(V,r=>r.iap);
 const ags=[...new Set(D.agents.map(a=>a.name))];
 const ctl=`<div class=lrctl><div class=seg>${[['mo','This month'],['30','Last 30 days'],['all','All time']].map(([k,l])=>`<button class="${LR.per===k?'on':''}" onclick="LR.per='${k}';go()">${l}</button>`).join('')}</div><select onchange="LR.ag=this.value;go()" aria-label="Agent"><option${LR.ag==='All'?' selected':''}>All</option>${ags.map(a=>`<option${LR.ag===a?' selected':''}>${esc(a)}</option>`).join('')}</select></div>`;
 const k=`<div class=g>${kpi('Lead Spend',cu(sp,'$'),X.length+' purchase'+(X.length===1?'':'s'))}${kpi('Leads Bought',cu(n,'n'),n?$(sp/n)+' per lead':'Add how many leads with each buy')}${kpi('Applications',cu(apps,'n'),apps?$(sp/apps)+' per application':'Policies whose lead source matches a vendor')}${kpi('Issued',cu(iss,'n'),$(iap)+' issued premium'+(iss?' &middot; '+$(sp/iss)+' per issued':''))}${kpi('Commission',cu(cm,'$'),'From issued lead policies')}${kpi('Lead ROI',sp?`<span class="${cm>=sp?'pos':'neg'}">${(cm/sp).toFixed(2)}x</span>`:'-',sp?(cm-sp>=0?'+':'')+$(cm-sp)+' after lead cost':'Commission per $1 of leads')}</div>`;
 const vt=V.length?`<div class="c sc"><h4>By Vendor</h4><table><tr><th>Vendor<th class=n>Spend<th class=n>Leads<th class=n>Cost / lead<th class=n>Apps<th class=n>Issued<th class=n>Close rate<th class=n>Issued premium<th class=n>Commission<th class=n>ROI</tr>${V.map(r=>`<tr><td><b>${esc(r.v)}</b><small class=mut> &middot; ${r.buys} buy${r.buys===1?'':'s'}</small><td class=n>${$(r.sp)}<td class=n>${r.n.toLocaleString()}<td class=n>${r.n?$(r.cpl):'-'}<td class=n>${r.apps}<td class=n>${r.iss}<td class=n>${r.n?(r.close*100).toFixed(1)+'%':'-'}<td class=n>${$(r.iap)}<td class=n>${$(r.cm)}<td class="n ${r.roi>=1?'pos':'neg'}">${r.sp?r.roi.toFixed(2)+'x':'-'}</tr>`).join('')}</table><small class=mut>Applications and issued policies count when the policy's lead source matches the vendor name.</small></div>`:'';
 const byT=grp(X,x=>x.ltype||'Not set',x=>+x.amt||0),byA=grp(X,x=>x.lage||'Not set',x=>+x.amt||0);
 const mix=X.length?`<div class=apx-r3><div class=c><h4>Spend by Lead Type</h4>${hb(byT)}</div><div class=c><h4>Spend by Lead Age</h4>${hb(byA)}</div><div class=c><h4>Exclusive vs Shared</h4>${dn(grp(X,x=>x.lex==='Shared'?'Shared':x.lex==='Exclusive'?'Exclusive':'Not set',x=>+x.amt||0))}</div></div>`:'';
 const L=E.slice().sort((a,b)=>String(b[0].d).localeCompare(String(a[0].d)));
 const lt=`<div class="c sc"><h4>Lead Purchases</h4>${L.length?`<table><tr><th>Date<th>Agent<th>Vendor<th>Type<th>Age<th class=n>Leads<th class=n>Cost / lead<th class=n>Total<th>States<th></th></tr>${L.map(([x,i])=>`<tr><td>${esc(x.d)}<td>${esc(x.ag||'-')}<td>${esc(x.src||'-')}${x.cat!=='Leads'?' <small class=mut>(logged as '+esc(x.cat||'Other')+')</small>':''}<td>${esc(x.ltype||'-')}<td>${esc(x.lage||'-')}${x.lex?' <small class=mut>'+esc(x.lex)+'</small>':''}<td class=n>${x.leads?(+x.leads).toLocaleString():'-'}<td class=n>${x.leads?$((+x.amt||0)/x.leads):'-'}<td class=n>${$(+x.amt||0)}<td>${esc(x.lst||'')}<td class=apx-ra><button class="x apx-eb" title="Edit" aria-label="Edit" onclick="lrAdd(${i})">&#9998;</button><button class=x title="Delete" onclick="ask('Delete this lead purchase?',()=>del('expenses',${i}))">&times;</button></tr>`).join('')}</table>`:`<p class=mut>No lead purchases ${LR.per==='mo'?'this month':LR.per==='30'?'in the last 30 days':'yet'}. Use <b>+ Add leads purchased</b> to log one: vendor, how many, price, type and age.</p>`}</div>`;
 return ctl+k+vt+mix+lt}
function lrAdd(i){const x=i!==undefined?D.expenses[i]:null,ags=[...new Set(D.agents.map(a=>a.name))],vend=[...new Set(D.expenses.filter(isLeadEx).map(e=>e.src).concat(D.policies.map(p=>p.src)).filter(Boolean))].sort(),me=(typeof WHO!=='undefined'&&WHO!=='Agency Owner')?WHO:'Cole Leckey',o=(k,v)=>`<option${v===k?' selected':''}>${esc(k)}</option>`;
 document.getElementById('md').innerHTML=`<div class=mb onclick="if(event.target===this)closeM()"><div class="c lrm" role=dialog aria-modal=true aria-label="Lead purchase"><h4>${x?'Edit lead purchase':'Add leads purchased'}</h4>
 <div class=lrg><label>Date<input id=lr_d type=date value="${esc(x?x.d:dkey(new Date()))}"></label><label>Agent<select id=lr_ag>${ags.map(a=>o(a,x?x.ag:me)).join('')}</select></label>
 <label>Vendor<input id=lr_v list=lr_vl value="${esc(x?x.src||'':'')}" placeholder="e.g. Lead Vault, EverQuote"><datalist id=lr_vl>${vend.map(v=>`<option value="${esc(v)}">`).join('')}</datalist></label>
 <label>Lead type<select id=lr_t>${LR_T.map(t=>o(t,x?x.ltype:'Final Expense')).join('')}</select></label>
 <label>Lead age<select id=lr_a>${LR_A.map(t=>o(t,x?x.lage:'Real-time')).join('')}</select></label>
 <label>Exclusive or shared<select id=lr_x>${['Exclusive','Shared'].map(t=>o(t,x?x.lex:'Exclusive')).join('')}</select></label>
 <label>Number of leads<input id=lr_n type=number min=1 step=1 value="${x&&x.leads?x.leads:''}" oninput="lrCalc('n')"></label>
 <label>Price per lead ($)<input id=lr_c type=number min=0 step=0.01 value="${x&&x.leads?((+x.amt||0)/x.leads).toFixed(2):''}" oninput="lrCalc('c')"></label>
 <label>Total cost ($)<input id=lr_s type=number min=0 step=0.01 value="${x?(+x.amt||0):''}" oninput="lrCalc('s')"></label>
 <label>State(s)<input id=lr_st value="${esc(x&&x.lst||'')}" placeholder="e.g. OH, PA"></label>
 <label class=lrw>Notes<input id=lr_no value="${esc(x&&x.n||'')}" placeholder="Filters, campaign, order number"></label></div>
 <p class=cherr id=lr_e></p><div><button class=btn onclick="lrSave(${i===undefined?'':i})">${x?'Save':'Add purchase'}</button> <button class="btn o" onclick="closeM()">Cancel</button></div></div></div>`;
 setTimeout(()=>{const e=document.getElementById('lr_v');if(e&&!x)e.focus()},30)}
function lrCalc(w){const g=id=>parseFloat((document.getElementById(id)||{}).value),n=g('lr_n'),c=g('lr_c'),s=g('lr_s'),set=(id,v)=>{const e=document.getElementById(id);if(e&&isFinite(v))e.value=(+v).toFixed(2)};
 if(w==='n'||w==='c'){if(n>0&&c>=0)set('lr_s',n*c)}else if(w==='s'){if(n>0&&s>=0)set('lr_c',s/n)}}
function lrSave(i){const v=id=>String((document.getElementById(id)||{}).value||'').trim(),n=Math.round(+v('lr_n')||0),s=+v('lr_s')||(n*(+v('lr_c')||0)),er=document.getElementById('lr_e');
 if(!v('lr_v')){er.textContent='Enter the vendor.';return}if(!(n>0)){er.textContent='Enter how many leads.';return}if(!(s>0)){er.textContent='Enter the price per lead or the total cost.';return}
 const o={d:v('lr_d')||dkey(new Date()),cat:'Leads',amt:Math.round(s*100)/100,leads:n,src:v('lr_v'),n:v('lr_no').slice(0,120),ag:v('lr_ag'),ltype:v('lr_t'),lage:v('lr_a'),lex:v('lr_x'),lst:v('lr_st').slice(0,60),lr:1};
 if(i!==undefined&&i!==''&&D.expenses[i])Object.assign(D.expenses[i],o);else D.expenses.push(o);save();closeM();go();toast(n.toLocaleString()+' leads from '+o.src+' saved',1)}
/* ---------- Capital (owner's private document) ---------- */
const CAP_T=['Private equity','Convertible note','SAFE','Loan','Line of credit','Owner contribution','Owner distribution','Grant','Other security'];
var CAP={rows:[],ready:false,ref:null,boot:0};
function capLocal(){try{CAP.rows=JSON.parse(localStorage.getItem('owq_cap')||'[]')||[]}catch(e){CAP.rows=[]}CAP.ready=true}
async function capInit(){if(CAP.boot)return;CAP.boot=1;try{const c=globalThis.claude;if(!c||!c.use){capLocal();return}const[u,db]=await Promise.all([c.use('user'),c.use('db')]);
 if(!u||!db||!(u.isOwner&&u.isOwner())){capLocal();return}const id=await u.id();if(!id){capLocal();return}CAP.ref=db.doc('data/users/'+id+'/capital');
 CAP.ref.onSnapshot(sn=>{const d=sn&&sn.exists?sn.data():null;CAP.rows=d&&Array.isArray(d.rows)?d.rows:[];CAP.ready=true;try{if(tab==='Agency Performance'&&/Capital|LLC Overview/.test(SUB['Agency Performance']))refreshQuiet()}catch(e){}},()=>capLocal())}catch(e){capLocal()}}
function capSave(){const d={v:1,rows:CAP.rows};if(CAP.ref)CAP.ref.set(d).catch(()=>toast('Could not save capital entries'));else try{localStorage.setItem('owq_cap',JSON.stringify(CAP.rows))}catch(e){}}
function capSign(r){return /distribution/i.test(r.t||'')||r.dir==='out'?-1:1}
function capTot(){let biz=0,per=0;(CAP.rows||[]).forEach(r=>{const v=(+r.amt||0)*capSign(r);if(r.al==='Personal')per+=v;else biz+=v});return{biz,per,n:(CAP.rows||[]).length}}
function capPage(){if(!CAP.ready){capInit();return'<div class=c><p class=mut>Loading capital entries...</p></div>'}const t=capTot(),R=CAP.rows.map((r,i)=>[r,i]).sort((a,b)=>String(b[0].d).localeCompare(String(a[0].d)));
 const k=`<div class=g>${kpi('Business Cash Flow',cu(t.biz,'$'),'Capital allocated to the LLC')}${kpi('Personal Cash Flow',cu(t.per,'$'),'Capital allocated to you personally')}${kpi('Total Capital',cu(t.biz+t.per,'$'),t.n+' entr'+(t.n===1?'y':'ies'))}${kpi('By Type',String(new Set(CAP.rows.map(r=>r.t)).size),'Kinds of vehicles used')}</div>`;
 const tb=`<div class="c sc"><h4>Capital Ledger</h4>${R.length?`<table><tr><th>Date<th>Type<th>Counterparty<th>Allocation<th class=n>Amount<th>Notes<th></th></tr>${R.map(([r,i])=>`<tr><td>${esc(r.d)}<td>${esc(r.t)}<td>${esc(r.who||'-')}<td><span class="b2al ${r.al==='Personal'?'p':'b'}">${esc(r.al||'Business')}</span><td class="n ${capSign(r)<0?'neg':'pos'}">${capSign(r)<0?'-':''}${$(+r.amt||0)}<td class=mut>${esc(r.n||'')}<td class=apx-ra><button class="x apx-eb" title="Edit" onclick="capAdd(${i})">&#9998;</button><button class=x title="Delete" onclick="ask('Delete this capital entry?',()=>{CAP.rows.splice(${i},1);capSave();go()})">&times;</button></tr>`).join('')}</table>`:'<p class=mut>No capital entries yet. Use <b>+ Capital entry</b> to record private equity funding, notes, loans or owner money in and out, and allocate each to business or personal cash flow.</p>'}</div>`;
 return k+`<div class=apx-r21><div class=c><h4>By Vehicle</h4>${hb(grp(CAP.rows,r=>r.t,r=>(+r.amt||0)*capSign(r)))}</div><div class=c><h4>Business vs Personal</h4>${dn([['Business',Math.max(0,t.biz)],['Personal',Math.max(0,t.per)]].filter(r=>r[1]>0))}</div></div>`+tb+'<p class=mut style="font-size:11px">Private to the Agency Owner: stored in your own account, never in the shared team data.</p>'}
function capAdd(i){const r=i!==undefined?CAP.rows[i]:null,o=(k,v)=>`<option${v===k?' selected':''}>${esc(k)}</option>`;
 document.getElementById('md').innerHTML=`<div class=mb onclick="if(event.target===this)closeM()"><div class="c lrm" role=dialog aria-modal=true aria-label="Capital entry"><h4>${r?'Edit capital entry':'Capital entry'}</h4><div class=lrg>
 <label>Date<input id=cp_d type=date value="${esc(r?r.d:dkey(new Date()))}"></label><label>Type<select id=cp_t>${CAP_T.map(t=>o(t,r?r.t:'Private equity')).join('')}</select></label>
 <label>Counterparty<input id=cp_w value="${esc(r&&r.who||'')}" placeholder="Investor, lender, fund"></label><label>Amount ($)<input id=cp_a type=number min=0 step=0.01 value="${r?r.amt:''}"></label>
 <label>Allocation<select id=cp_al>${['Business','Personal'].map(t=>o(t,r?r.al:'Business')).join('')}</select></label><label>Direction<select id=cp_dir>${[['in','Money in'],['out','Money out']].map(([k,l])=>`<option value=${k}${(r?r.dir:'in')===k?' selected':''}>${l}</option>`).join('')}</select></label>
 <label class=lrw>Notes<input id=cp_n value="${esc(r&&r.n||'')}" placeholder="Terms, valuation, maturity"></label></div><p class=cherr id=cp_e></p>
 <div><button class=btn onclick="capSaveRow(${i===undefined?'':i})">Save</button> <button class="btn o" onclick="closeM()">Cancel</button></div></div></div>`}
function capSaveRow(i){const v=id=>String((document.getElementById(id)||{}).value||'').trim(),a=+v('cp_a');if(!(a>0)){document.getElementById('cp_e').textContent='Enter an amount above 0.';return}
 const o={d:v('cp_d')||dkey(new Date()),t:v('cp_t'),who:v('cp_w').slice(0,80),amt:Math.round(a*100)/100,al:v('cp_al')==='Personal'?'Personal':'Business',dir:v('cp_dir')==='out'?'out':'in',n:v('cp_n').slice(0,160)};
 if(i!==undefined&&i!==''&&CAP.rows[i])CAP.rows[i]=o;else CAP.rows.push(o);capSave();closeM();go()}
/* ---------- Ask Claude (Team) ---------- */
var AQ={turns:[],busy:0,fn:undefined,err:'',web:1,cur:'',ctl:null};
try{const t=JSON.parse(sessionStorage.getItem('owq_aq')||'[]');if(Array.isArray(t))AQ.turns=t.slice(-20)}catch(e){}
const AQS=[['Quick answer','What is the difference between term and whole life insurance, in two sentences?'],['Web search','Search the web: what are the current final expense underwriting trends this year?'],['Task list','Make me a task list for today: 60 dials, 3 appointments, follow up with yesterday’s leads, log my activity.'],['Draft a text','Draft a short, friendly text to a client who missed our call today, asking for a good time to reconnect.'],['Objection','A client says "I need to think about it." Give me three short ways to respond.']];
const AQR=`You are Claude, helping a life insurance agent at Only Winners & Quitters (a fully remote agency). Be quick and practical: short answers first, then detail only if asked. For task lists, answer with one task per line starting with "- ". Never ask for or repeat Social Security numbers, bank details or passwords. You are not a lawyer or financial advisor: for compliance, legal or tax questions say so and suggest checking with the carrier or a professional.`;
function aqInit(){if(AQ.fn!==undefined)return;AQ.fn=undefined;AQ.probe=1;try{const c=globalThis.claude;if(!c||!c.use){AQ.fn=null;return}c.use('sample').then(f=>{AQ.fn=f||null;aqPaint()}).catch(()=>{AQ.fn=null;aqPaint()})}catch(e){AQ.fn=null}}
function aqTasksKey(){return'owq_tasks_'+String(typeof WHO!=='undefined'?WHO:'me').replace(/\W/g,'')}
function aqTasks(){try{const a=JSON.parse(localStorage.getItem(aqTasksKey())||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function aqTasksSet(a){try{localStorage.setItem(aqTasksKey(),JSON.stringify(a.slice(0,200)))}catch(e){}aqPaintTasks()}
function aqFmt(t){return esc(t).replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target=_blank rel=noopener>$1</a>').replace(/(^|\s)(https?:\/\/[^\s<]+)/g,'$1<a href="$2" target=_blank rel=noopener>$2</a>').replace(/\n/g,'<br>')}
function aqList(t){return String(t||'').split(/\n/).map(l=>l.match(/^\s*(?:[-*•]|\d+[.)]|\[ \])\s+(.+)$/)).filter(Boolean).map(m=>m[1].replace(/\*\*/g,'').trim()).filter(Boolean)}
function aqMsgs(){let h=AQ.turns.map((m,i)=>`<div class="aqb ${m.role==='user'?'u':'a'}">${aqFmt(m.content)}${m.role==='assistant'?`<div class=aqba><button onclick="aqCopy(${i})">Copy</button>${aqList(m.content).length>1?`<button onclick="aqToTasks(${i})">Add ${aqList(m.content).length} to my tasks</button>`:''}</div>`:''}</div>`).join('');
 if(AQ.busy)h+=`<div class="aqb a">${AQ.cur?aqFmt(AQ.cur):'<span class=cqd><i></i><i></i><i></i></span> '+(AQ.web?'Searching and thinking...':'Thinking...')}</div>`;if(AQ.err)h+=`<div class="aqb err">${esc(AQ.err)}</div>`;
 return h||`<div class=aqe><b>Ask anything.</b><span>Quick answers, web searches, drafts, objection handling and task lists.</span></div>`}
function aqSetup(){const own=bizOwner();return`<div class="c aqns"><h4>Ask Claude is not connected yet</h4><p class=mut>The portal needs the agency's Claude connection to answer. ${own?'You set it up once and the whole team can use it.':'The Agency Owner sets it up once for the whole team.'}</p>${own?`<ol class=aqol><li>Deploy the small Claude function (instructions in the portal source: <b>web/functions/README.md</b>) with your Anthropic API key.</li><li>Paste its web address here and save. Everyone gets Ask Claude after a reload.</li></ol><div class=aqcf><input id=aq_url placeholder="https://...cloudfunctions.net/askClaude"><button class=btn onclick="aqSaveUrl()">Save</button></div><p class=cherr id=aq_ue></p>`:''}</div>`}
async function aqSaveUrl(){const u=String((document.getElementById('aq_url')||{}).value||'').trim(),e=document.getElementById('aq_ue');if(!/^https:\/\/[^\s]+$/.test(u)){if(e)e.textContent='Enter the https address of the function.';return}
 try{const db=await globalThis.claude.use('db');await db.doc('cfg/ai').set({url:u,at:Date.now()});toast('Saved. Reload the portal to connect Ask Claude.',1);if(e)e.textContent=''}catch(x){if(e)e.textContent='Could not save it: '+((x&&x.code)||'error')}}
function aqPage(){aqInit();const ready=AQ.fn!==null;
 return hd('Ask Claude','Quick answers, web searches, drafts and task lists for your day.',[])+`<div class=aqg>${ready?'':aqSetup()}<div class="c aqc"><div class=aqh><h4>&#10022; Ask Claude</h4><label class=aqw><input type=checkbox ${AQ.web?'checked':''} onchange="AQ.web=this.checked?1:0"> Search the web</label>${AQ.turns.length?'<button class="btn o sm" onclick="aqClear()">New chat</button>':''}</div>
 <div class=aqs>${AQS.map(([l,q])=>`<button onclick="aqAsk(${esc(JSON.stringify(q))})"${ready?'':' disabled'}>${l}</button>`).join('')}</div>
 <div class=aqm id=aqm aria-live=polite>${aqMsgs()}</div>
 <div class=aqf><textarea id=aqi rows=2 placeholder="${ready?'Ask a question, paste something to rewrite, or ask for a task list...':'Not connected yet'}" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();aqAsk()}"${ready?'':' disabled'}></textarea><button class=btn id=aqgo onclick="${AQ.busy?'aqStop()':'aqAsk()'}"${ready?'':' disabled'}>${AQ.busy?'Stop':'Ask'}</button></div>
 <small class=mut>Answers can be wrong: double-check anything that matters before you act on it. No SSNs, bank details or passwords.</small></div>
 <div class="c aqt"><div class=aqh><h4>My Tasks</h4><small class=mut id=aqtc></small></div><div class=aqta><input id=aqtn placeholder="Add a task" onkeydown="if(event.key==='Enter')aqTaskAdd()"><button class="btn o sm" onclick="aqTaskAdd()">Add</button></div><div id=aqtl></div></div></div>`}
function aqPaint(){if(tab!=='Ask Claude')return;const m=document.getElementById('aqm');if(!m||AQ.fn===null&&!document.querySelector('.aqns')){go();return}m.innerHTML=aqMsgs();m.scrollTop=m.scrollHeight;const b=document.getElementById('aqgo');if(b){b.textContent=AQ.busy?'Stop':'Ask';b.setAttribute('onclick',AQ.busy?'aqStop()':'aqAsk()')}aqPaintTasks()}
function aqPaintTasks(){const l=document.getElementById('aqtl');if(!l)return;const T=aqTasks(),c=document.getElementById('aqtc');if(c)c.textContent=T.filter(t=>!t.done).length+' open';
 l.innerHTML=T.length?T.map((t,i)=>`<div class="aqti ${t.done?'d':''}"><label><input type=checkbox ${t.done?'checked':''} onchange="aqTaskTog(${i})"><span>${esc(t.t)}</span></label><button class=x aria-label="Delete task" onclick="aqTaskDel(${i})">&times;</button></div>`).join('')+(T.some(t=>t.done)?'<button class="btn o sm" onclick="aqTaskClean()">Clear done</button>':''):'<p class=mut>No tasks yet. Add one, or ask Claude for a task list and tap "Add to my tasks".</p>'}
function aqTaskAdd(){const e=document.getElementById('aqtn'),t=String(e&&e.value||'').trim();if(!t)return;const T=aqTasks();T.push({t:t.slice(0,200),done:0,at:Date.now()});aqTasksSet(T);e.value='';e.focus()}
function aqTaskTog(i){const T=aqTasks();if(T[i])T[i].done=T[i].done?0:1;aqTasksSet(T)}
function aqTaskDel(i){const T=aqTasks();T.splice(i,1);aqTasksSet(T)}
function aqTaskClean(){aqTasksSet(aqTasks().filter(t=>!t.done))}
function aqToTasks(i){const m=AQ.turns[i];if(!m)return;const L=aqList(m.content),T=aqTasks();L.forEach(t=>T.push({t:t.slice(0,200),done:0,at:Date.now()}));aqTasksSet(T);toast(L.length+' tasks added',1)}
function aqCopy(i){const m=AQ.turns[i];if(!m)return;try{navigator.clipboard.writeText(m.content).then(()=>toast('Copied',1),()=>toast('Could not copy'))}catch(e){toast('Could not copy')}}
function aqClear(){AQ.turns=[];AQ.err='';try{sessionStorage.removeItem('owq_aq')}catch(e){}go()}
function aqStop(){try{AQ.ctl&&AQ.ctl.abort()}catch(e){}}
async function aqAsk(q){if(AQ.busy||!AQ.fn)return;const i=document.getElementById('aqi');q=String(q||(i?i.value:'')).trim();if(!q)return;if(i)i.value='';
 AQ.turns.push({role:'user',content:q.slice(0,4000)});AQ.busy=1;AQ.cur='';AQ.err='';AQ.ctl=typeof AbortController!=='undefined'?new AbortController():null;aqPaint();
 const hist=AQ.turns.slice(-10),input=hist.map((m,k)=>k===0&&m.role==='user'?{role:'user',content:AQR+'\nToday is '+new Date().toDateString()+'. The agent asking is '+(typeof WHO!=='undefined'?WHO:'an agent')+'.\n\n'+m.content}:m);
 if(input[0].role!=='user')input.shift();
 try{const r=await AQ.fn(input,{cache:false,web:!!AQ.web,signal:AQ.ctl&&AQ.ctl.signal,modelTier:'default',onText:({text})=>{AQ.cur=text;const m=document.getElementById('aqm');if(m){m.innerHTML=aqMsgs();m.scrollTop=m.scrollHeight}}});
  AQ.turns.push({role:'assistant',content:String(r.text||'')+(r.truncated?'\n(Answer was cut short. Ask for less at a time.)':'')})}
 catch(e){const c=e&&e.code;if(e&&e.text){AQ.turns.push({role:'assistant',content:e.text+'\n(interrupted)'})}else if(c!=='cancelled'){AQ.err=c==='rate_limited'?'Too many questions right now. Try again in a minute.':c==='not_granted'?'Claude access was declined for this portal.':c==='session_expired'?'Sign in again, then retry.':c==='not_member'?'Your account is not on the team list.':'Could not get an answer. Try again.'}}
 AQ.busy=0;AQ.cur='';AQ.ctl=null;try{sessionStorage.setItem('owq_aq',JSON.stringify(AQ.turns.slice(-20)))}catch(e){}aqPaint()}
try{views['Agency Performance'][0]=ag}catch(e){}
views['Ask Claude']=[aqPage,'&#10022;','TEAM','Quick answers, web search, tasks'];
{const _rq=refreshQuiet;refreshQuiet=function(){if(typeof tab!=='undefined'&&tab==='Ask Claude')return;return _rq.apply(this,arguments)}}
/* alerts: an unread alert with the same title and text is not added again within 30 minutes (no repeats in the bell) */
{const _pa5=pushAlert;pushAlert=function(a,quiet){try{if(a&&!a.k&&AL().some(x=>x.t===a.t&&x.m===a.m&&!x.rd&&Date.now()-(x.ts||0)<18e5))return null}catch(e){}return _pa5.apply(this,arguments)}}
/*B2end*/
