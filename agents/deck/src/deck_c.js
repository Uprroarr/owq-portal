/* ---- LOOK C: CINEMATIC HERO. A tall hero band with drifting embers, a giant count-up and the goal ring;
   the leaderboard as a podium; generous glass cards with a pointer spotlight below ---- */
/* drifting embers: a few tiny compositor-only layers (transform/opacity keyframes), no per-frame script, no canvas */
const dkEmbers=()=>{let h='';for(let i=0;i<18;i++){const r=k=>{const x=Math.sin((i+1)*12.9898*k)*43758.5453;return x-Math.floor(x)};
  h+=`<i class="dk-em${i%5===0?' dk-eg':i%3===0?' dk-eo':''}" style="--x:${(4+r(1)*92).toFixed(1)}%;--s:${(3+r(2)*5).toFixed(1)}px;--du:${(8+r(3)*9).toFixed(1)}s;--ph:${(r(4)*17).toFixed(1)}s;--dx:${((r(5)-.5)*90).toFixed(0)}px;--o:${(.45+r(6)*.5).toFixed(2)}"></i>`}return h};
setInterval(()=>{try{const e=document.querySelector('#dkr .dk-clock');if(e){const t=new Date(),s=t.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});if(e.textContent!==s)e.textContent=s}}catch(e){}},1000);
function dkRingC(d){const p=Math.max(0,Math.min(1,d.gp||0)),C=130,r=112,c=2*Math.PI*r,a=(-90+p*360)*Math.PI/180,hx=C+r*Math.cos(a),hy=C+r*Math.sin(a);
  return`<div class=dk-gr data-dkburst><svg viewBox="0 0 260 260" aria-hidden=true><defs><filter id=gl x=-30% y=-30% width=160% height=160%><feGaussianBlur stdDeviation=5 result=b /><feMerge><feMergeNode in=b /><feMergeNode in=SourceGraphic /></feMerge></filter>
<linearGradient id=rg x1=0 y1=0 x2=1 y2=1><stop offset=0 stop-color="#ffcf40" /><stop offset=.5 stop-color="#ff1f4f" /><stop offset=1 stop-color="#7d0b27" /></linearGradient></defs>
<circle cx=${C} cy=${C} r=${r} class=dk-gtr /><circle cx=${C} cy=${C} r=${r-18} class=dk-gin />${[.25,.5,.75].map(v=>{const t=(-90+v*360)*Math.PI/180;return`<line class="dk-gm${p>=v?' hit':''}" x1=${(C+(r-9)*Math.cos(t)).toFixed(1)} y1=${(C+(r-9)*Math.sin(t)).toFixed(1)} x2=${(C+(r+9)*Math.cos(t)).toFixed(1)} y2=${(C+(r+9)*Math.sin(t)).toFixed(1)} />`}).join('')}
<circle cx=${C} cy=${C} r=${r} class=dk-gv stroke-dasharray="${(c*p).toFixed(1)} ${c.toFixed(1)}" style="--c:${c.toFixed(1)}" transform="rotate(-90 ${C} ${C})" filter="url(#gl)" />${p>0?`<circle class=dk-gh cx=${hx.toFixed(1)} cy=${hy.toFixed(1)} r=7 />`:''}</svg>
<div class=dk-grt><b>${dkN('gpct',Math.round(p*100),'%')}</b><small>of the monthly goal</small><em>${$(d.m)} / ${$(D.goal)}</em></div></div>`}
function dkPodC(d){const R=d.R.filter(r=>r.goal).slice().sort((a,b)=>b.w-a.w||b.iap-a.iap),T=R.slice(0,3);if(!T.length)return'';
  const col=(r,k)=>r?`<div class="dk-pc p${k}" style="--i:${k}"><button class=dk-pav onclick="event.stopPropagation();${agA(r.nm)}" aria-label="Open ${esc(r.nm)}">${k===1?'<i class=dk-crown aria-hidden=true>&#9813;</i>':''}${av(r.nm,k===1?78:60)}</button><b>${esc(String(r.nm).split(' ')[0])}</b><span class=dk-pv>${$(r.w)}</span><em class="${r.w>=r.goal?'ok':''}">${Math.round(r.goal?r.w/r.goal*100:0)}% of weekly goal</em><div class=dk-ped aria-hidden=true><i>${k}</i></div></div>`:'';
  return`<div class=dk-pod>${col(T[1],2)}${col(T[0],1)}${col(T[2],3)}</div>`}
function dkLook_c(d,tier){const M=dkMods(d),s=d.s,pa=d.pa,cl=d.cl,ld=cl.filter(x=>x.st=='Lead'||x.st=='Quoted').length,cn=cl.filter(x=>x.st=='Client').length,tot=Math.max(1,cl.length);
  const split=`<div class=dk-csp aria-hidden=true><div><i style="width:${(ld/tot*100).toFixed(1)}%"></i><b style="width:${(cn/tot*100).toFixed(1)}%"></b></div><span><em class=dk-l1></em>Open leads ${ld}</span><span><em class=dk-l2></em>Clients ${cn}</span></div>`;
  const quad=pa.has?`<div class=dk-cq aria-hidden=true>${[1,3,4,2].map(n=>`<i class="${pa.n===n?'on':''}">${n}</i>`).join('')}</div>`:'';
  const dt=now.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'}),onc=d.P?d.P.ag.filter(x=>x.on).length:0;
  const hero=`<section class="dk-hero dk-glow dk-par" aria-label="Command Deck overview"><div class=dk-hfx aria-hidden=true>${dkEmbers()}</div><div class=dk-hbg aria-hidden=true><i class=dk-hs1></i><i class=dk-hs2></i><i class=dk-hz></i></div>
<div class="hd dk-hhd"><div><h2>Command Deck</h2><span class=dk-hdate>${esc(dt)} &middot; <span class=dk-clock>${new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</span></span></div><div class=dk-act>${[['+ Policy',"openM('P')"],['+ Income',"openM('I')"],['+ Expense',"openM('E')"],['+ Activity',"openM('A')"]].map(x=>`<button class=btn onclick="${x[1]}">${x[0]}</button>`).join(' ')}${dkSwitch()}</div></div>
<div class=dk-hgrid><div class=dk-hl><p class="mut dk-greet"><span class=dk-g1>${d.gr}, ${esc(WHO)}.</span> <span class=dk-g2><i aria-hidden=true></i>All systems nominal.</span></p>
<div class=dk-hn><small>NET PROFIT</small><span class=dk-huge>${dkN('net',s.net,'$')}</span></div><small class=dk-goal>${dkGoalTxt(d)}</small>
<div class="chips dk-chips"><div><small>HEALTH</small><b>${dkN('health',d.h.score,'n')}</b></div><div><small>FORECAST</small><b>${dkN('fc',d.f.proj,'K')}</b></div><div><small>PIPELINE</small><b>${dkN('pipe',d.f.pend,'K')}</b></div><div class=dk-onc><small>ON THE CLOCK</small><b>${onc}</b></div></div></div>
<div class="dk-hr2 dc">${dkRingC(d)}</div></div></section>`;
  const pod=dkAgents(d,'dk-lead dk-glow',`<div class=dk-lgrid>${dkPodC(d)}<div class=dk-lanes>`,'</div></div>');
  return`${hero}${d.owner?cqHtml():''}${mrBanner()}${pod}
<div class="deck dk-cards"><div class=dl>${M.sales('dk-gc dk-glow')}${M.clients('dk-gc dk-glow',split)}</div><div class=dr>${M.fin('dk-gc dk-glow')}${M.path('dk-gc dk-glow',quad)}</div></div>
${pulseHtml()}<div class=dk-two><div class=dk-col>${dkBriefCard('dk-glass')}</div><div class=dk-col>${dkQueue(d,'dk-glass')}${dkAlerts('dk-glass')}</div></div>
<div class=dk-three>${dkDiag(d,'dk-glass')}${mrDeck()}<div class=dk-chw>${chDeck()}</div></div>`}
