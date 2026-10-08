/*DKstart*/
/* ===== COMMAND DECK restyle (deck builder). ov() delegates here; any error falls back to the classic deck.
   Same data as the classic ov(), new markup. Entrance + count-ups play once per page load and when a number really changes.
   Live re-renders keep animation phase (--dkp) and never replay the entrance. ===== */
const DKL=__DKLOOKS__;
const dkS={first:1,t0:0,prev:{},tw:{},lastRender:0,bursts:0,ptr:0,tier:'full',renders:0};
function dkLook(){let l='';try{const u=new URLSearchParams(location.search).get('dk');if(u&&DKL.indexOf(u)>=0){l=u;try{localStorage.setItem('owq_dk',u)}catch(e){}}}catch(e){}
  if(!l){try{l=localStorage.getItem('owq_dk')||''}catch(e){l=''}}return DKL.indexOf(l)>=0?l:DKL[0]}
/* graphics tier: full | low | still.  reduced motion -> still; owq_gq low/still -> low/still */
function dkTier(){if(typeof RM!=='undefined'&&RM)return'still';let q='';try{q=localStorage.getItem('owq_gq')||''}catch(e){}return q==='still'?'still':q==='low'?'low':'full'}
const dkFmt=(v,f)=>f==='$'?$(v):f==='K'?K(v):f==='%'?Math.round(v)+'%':f==='p'?P(v):f==='d1'?(Math.round(v*10)/10).toLocaleString():Math.round(v).toLocaleString();
/* count-up number: the final value is in the markup (no flash, works without JS); dkAfter tweens it from the last shown value */
const dkN=(k,v,f,cls)=>isFinite(v)?`<span class="dk-n${cls?' '+cls:''}" data-dkn="${k}" data-v="${v}" data-f="${f}">${dkFmt(v,f)}</span>`:'-';
function dkData(){const s=S(),m=sum(s.iss.filter(x=>mon(x.d)===cmk),x=>x.ap),pa=PA(),ms=months(),h=HS(),f=FC(),R=agentRows(),hr=now.getHours(),gr=hr<12?'Good morning':hr<18?'Good afternoon':'Good evening',
  inc=k=>sum(s.iss.filter(x=>mon(x.d)===k),com)+sum(D.income.filter(x=>mon(x.d)===k),x=>x.amt),cl=MYCL(),
  q=cl.filter(c=>c.fu).sort((a,b)=>a.fu.localeCompare(b.fu)).slice(0,5),due=cl.filter(c=>c.fu&&c.fu<=today).sort((a,b)=>a.fu.localeCompare(b.fu));
  let P0=null;try{P0=pulseData()}catch(e){P0=null}
  const owner=WHO==='Agency Owner',salesSp=ms.map(k=>sum(s.iss.filter(x=>mon(x.d)===k),x=>x.ap)),finSp=ms.map(inc);
  const al=AL(),crit=al.filter(a=>!a.rd&&a.sev==='crit'),unread=al.filter(a=>!a.rd).length;
  let ck=[];try{const me=acWho(),done=n=>(D.checkins||[]).some(c=>c.ag===n&&c.d===today);ck=owner?D.agents.map(a=>a.name).filter(n=>!done(n)):(D.agents.some(a=>a.name===WHO)&&!done(WHO)?[WHO]:[])}catch(e){ck=[]}
  const days=[...Array(14)].map((_,i)=>{const d=new Date(now);d.setDate(d.getDate()-(13-i));return dkey(d)});
  const heat=R.filter(r=>r.g).map(r=>({nm:r.nm,v:days.map(k=>sum(D.activity.filter(a=>(a.ag||'Unassigned')===r.nm&&a.d===k),a=>(a.con||0)+(a.app||0)*5))}));
  const wd=(now.getDay()+6)%7,wk=[...Array(7)].map((_,i)=>{const d=new Date(now);d.setDate(d.getDate()-wd+i);const k=dkey(d);return{k,l:'MTWTFSS'[i],v:sum(s.iss.filter(x=>x.d===k),x=>x.ap),t:k===today,fut:k>today}});
  return{s,m,pa,ms,h,f,R,gr,inc,cl,q,due,P:P0,owner,salesSp,finSp,al,crit,unread,ck,days,heat,wk,gp:D.goal?m/D.goal:0}}
/* shared building blocks: every one keeps the classic text, classes, ids and click targets */
const dkHead=(d,extra)=>`<div class="hd dk-hd"><div class=dk-hdt><h2>Command Deck</h2><p class=mut>${d.gr}, ${esc(WHO)}. All systems nominal.</p>${extra||''}</div><div class=dk-act>${[['+ Policy',"openM('P')"],['+ Income',"openM('I')"],['+ Expense',"openM('E')"],['+ Activity',"openM('A')"]].map(x=>`<button class=btn onclick="${x[1]}">${x[0]}</button>`).join(' ')}${dkSwitch()}</div></div>`;
/*DKSW*/const dkSwitch=()=>DKL.length<2?'':`<div class=dk-sw role=group aria-label="Command Deck look">${DKL.map(l=>`<button class="${dkLook()===l?'on':''}" onclick="dkSet('${l}')" aria-pressed="${dkLook()===l}" title="Look ${l.toUpperCase()}">${l.toUpperCase()}</button>`).join('')}</div>`;
function dkSet(l){if(DKL.indexOf(l)<0)return;try{localStorage.setItem('owq_dk',l)}catch(e){}dkReplay()}
/*DKSWend*/function dkReplay(){dkS.first=1;dkS.prev={};dkS.tw={};if(tab==='Command Deck')go()}
const dkMod=(k,t,ic,big,sub,sp,to,s2,cls,inner)=>`<div class="c mod dk-mod${cls?' '+cls:''}" data-dkm="${k}" tabindex=0 role=button onclick="openTab('${to}'${s2?",'"+s2+"'":''})" onkeydown="if(event.key=='Enter')this.click()"><h4>${ic} ${t}</h4><div class=v>${big}</div><small>${sub}</small>${sp||''}${inner||''}<em class=open>OPEN &#9656;</em></div>`;
const dkMods=d=>{const s=d.s,cl=d.cl,pa=d.pa;return{
  sales:(c,inner)=>dkMod('sales','Sales','&#9650;',dkN('sales',s.issAP,'$'),s.p.length+' policies logged, '+P(s.iss.length/s.p.length)+' placed',dkSpk(d.salesSp,'sales'),'Agency Performance','',c,inner),
  clients:(c,inner)=>dkMod('clients','Clients','&#9776;',dkN('clients',cl.length,'n'),cl.filter(x=>x.st=='Lead'||x.st=='Quoted').length+' open leads, '+cl.filter(x=>x.st=='Client').length+' clients','','Clients','',c,inner),
  fin:(c,inner)=>dkMod('fin','Finance','&#9670;',dkN('fin',s.rev,'$'),'Income. '+$(s.exT)+' spent, '+P(s.net/s.rev)+' margin',dkSpk(d.finSp,'fin'),'Business Performance','',c,inner),
  path:(c,inner)=>dkMod('path','Growth Path','&#8721;',pa.has?'Path '+pa.n:'-',pa.has?NM[pa.n-1]:'Log activity to place yourself','','Production Equation','',c,inner)}};
const dkGoalTxt=d=>`Monthly goal: ${P(d.m/D.goal)} (${$(d.m)} of ${$(D.goal)} issued)`;
const dkBrief=()=>brief().map((b,i)=>`<div class="bl ${b[0]} dk-bl" style="--i:${i}"><i></i><span>${b[1]}</span></div>`).join('');
const dkBriefCard=(cls,split)=>split?`<div class="c dk-brief${cls?' '+cls:''}"><h4>Command Briefing</h4>${dkBrief()}<button class="btn o" onclick="speak()">Speak briefing</button></div><div class="c dk-chat${cls?' '+cls:''}"><h4>Team Chat</h4><div id=chbf>${chBrief()}</div></div>`:`<div class="c dk-brief${cls?' '+cls:''}"><h4>Command Briefing</h4>${dkBrief()}<h4 style="margin-top:14px">Team Chat</h4><div id=chbf>${chBrief()}</div><button class="btn o" onclick="speak()">Speak briefing</button></div>`;
const dkQueue=(d,cls)=>`<div class="c dk-queue${cls?' '+cls:''}"><h4>Follow-Up Queue</h4>${d.q.map(c=>`<div class="qr${c.fu<today?' dk-od':c.fu===today?' dk-today':''}" onclick="cid=${c.id};openTab('Clients')" tabindex=0 role=button onkeydown="if(event.key=='Enter')this.click()"><span>${esc(c.name)}</span><span class="${c.fu<=today?'neg':'mut'}">${c.fu<today?'OVERDUE ':''}${c.fu}</span></div>`).join('')||'<p class=mut>No follow-ups scheduled. Set a next follow-up on a client.</p>'}</div>`;
const dkAgents=(d,cls,pre,post)=>`<div class="c mod dk-agents${cls?' '+cls:''}" tabindex=0 role=button onclick="openTab('Agency Performance','Agents')" onkeydown="if(event.key=='Enter')this.click()"><h4>Agent Progress: Last 7 Days</h4>${pre||''}${gpBars(d.R)}${post||''}<em class=open>OPEN &#9656;</em></div>`;
const dkDiag=(d,cls)=>`<div class="c dk-diag${cls?' '+cls:''}"><h4>System Diagnostics</h4>${radar(d.h.parts)}<small style="text-align:center">Health score ${d.h.score} out of 100</small></div>`;
const dkAlerts=(cls)=>`<div class="c dk-alerts${cls?' '+cls:''}"><h4>Latest Alerts</h4><div id=dal>${latestAl()}</div><button class="btn o" onclick="toggleRail(true)">Open alert center</button></div>`;
/* sparkline: gradient area, self-drawing line, glowing head dot */
function dkSpk(v,k,w,h){if(v.length<2||!Math.max(...v))return'';w=w||300;h=h||32;const m=Math.max(...v),pts=v.map((x,i)=>[i*w/(v.length-1),h-3-x/m*(h-8)]),l=pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' '),e=pts[pts.length-1];
  return`<div class=dk-spw aria-hidden=true><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio=none><defs><linearGradient id=dksg_${k} x1=0 y1=0 x2=0 y2=1><stop offset=0 stop-color="#ff1f4f" stop-opacity=.4 /><stop offset=1 stop-color="#ff1f4f" stop-opacity=0 /></linearGradient></defs><polygon class=dk-spa points="0,${h} ${l} ${w},${h}" fill="url(#dksg_${k})" /><polyline class=dk-spl points="${l}" pathLength=1 /></svg><i class=dk-sph style="top:${(e[1]/h*100).toFixed(1)}%"></i></div>`}
/* entrance window: a re-render inside it keeps the entrance running from where it is (negative delays), after it nothing replays */
const DKIN=2600;
function dkOv(){const look=dkLook(),fn=globalThis['dkLook_'+look];if(typeof fn!=='function')return'';const d=dkData(),t=performance.now();
  const first=!!dkS.first;if(first){dkS.first=0;dkS.t0=t}const el=t-dkS.t0,tier=dkTier();
  const inE=el<DKIN&&tier!=='still';dkS.lastRender=t;dkS.tier=tier;dkS.renders++;
  const body=fn(d,tier);
  const cls='dk-root dk-'+look+' dk-t-'+tier+(inE?' dk-in':'')+(d.owner?' dk-own':'');
  Promise.resolve().then(()=>dkAfter(look,tier,first));
  /* idle loops are phase-locked to the animation timeline (not performance.now, which keeps running during a long render task) */
  let tl=t;try{if(document.timeline&&document.timeline.currentTime!=null)tl=+document.timeline.currentTime}catch(e){}
  return`<div class="${cls}" id=dkr data-look="${look}" style="--dkp:${(-tl/1000).toFixed(3)}s;--dke:${(-el/1000).toFixed(3)}s">${body}</div>`}
/* after go() put the markup in: count-ups, re-attach live canvas, celebrations */
function dkAfter(look,tier,anim){const r=document.getElementById('dkr');if(!r)return;const now2=performance.now();
  r.querySelectorAll('[data-dkn]').forEach(e=>{const k=e.dataset.dkn,v=+e.dataset.v,f=e.dataset.f,pv=dkS.prev[k],tw=dkS.tw[k];dkS.prev[k]=v;
    if(tier==='still'){delete dkS.tw[k];return}
    if(tw&&tw.to===v&&now2<tw.t0+tw.dur){tw.el=e;e.textContent=dkFmt(tw.cur,f);dkTick(k);return}
    if(pv==null&&!anim)return;
    const from=tw&&now2<tw.t0+tw.dur?tw.cur:(pv==null?0:pv);if(from===v)return;
    dkS.tw[k]={from,to:v,t0:now2,dur:pv==null?1500:900,el:e,f,cur:from};e.textContent=dkFmt(from,f);dkTick(k)});
  try{const g=dkS.prev.__goal,iss=dkS.prev.__iss,ng=Math.floor(Math.max(0,(D.goal?(sum(S().iss.filter(x=>mon(x.d)===cmk),x=>x.ap)/D.goal):0))*4),ni=S().iss.length;
    if(g!=null&&tier!=='still'&&(ng>g||ni>iss))dkBurst(ng>g?'goal':'pol');dkS.prev.__goal=ng;dkS.prev.__iss=ni}catch(e){}
  const hook=globalThis['dkAfter_'+look];if(typeof hook==='function')try{hook(r,tier,anim)}catch(e){}
}
function dkTick(k){const tw=dkS.tw[k];if(!tw||tw.run)return;tw.run=1;const step=()=>{const T=dkS.tw[k];if(!T){return}const q=Math.min(1,(performance.now()-T.t0)/T.dur),ee=1-Math.pow(1-q,3);T.cur=T.from+(T.to-T.from)*ee;
  if(T.el&&T.el.isConnected)T.el.textContent=dkFmt(q<1?T.cur:T.to,T.f);if(q<1)requestAnimationFrame(step);else delete dkS.tw[k]};requestAnimationFrame(step)}
/* restrained celebration: a ring flash on the hero number (no replay on plain re-renders) */
function dkBurst(kind){const r=document.getElementById('dkr');if(!r)return;const t=r.querySelector('[data-dkburst]');if(!t)return;dkS.bursts++;
  const b=document.createElement('div');b.className='dk-burst dk-burst-'+kind;b.setAttribute('aria-hidden','true');b.innerHTML='<i></i><i></i><i></i>'+[...Array(14)].map((_,i)=>`<b style="--a:${i*360/14}deg"></b>`).join('');t.appendChild(b);const t0=performance.now(),chk=()=>{if(!b.isConnected)return;if(performance.now()-t0>1700){b.remove();return}requestAnimationFrame(chk)};requestAnimationFrame(chk)}
/* pointer glow / parallax: one delegated listener, rAF-throttled, only CSS variables change */
document.addEventListener('pointermove',e=>{if(dkS.ptr)return;const t=e.target&&e.target.closest?e.target.closest('.dk-glow'):null;if(!t||dkS.tier!=='full')return;dkS.ptr=requestAnimationFrame(()=>{dkS.ptr=0;const b=t.getBoundingClientRect();t.style.setProperty('--mx',((e.clientX-b.left)/b.width*100).toFixed(1)+'%');t.style.setProperty('--my',((e.clientY-b.top)/b.height*100).toFixed(1)+'%');if(t.classList.contains('dk-par')){t.style.setProperty('--px',((e.clientX-b.left)/b.width-.5).toFixed(3));t.style.setProperty('--py',((e.clientY-b.top)/b.height-.5).toFixed(3))}})},{passive:true});
