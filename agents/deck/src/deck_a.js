/* ring gauge */
function dkRing(p,r,sw,cls,extra){const c=2*Math.PI*r,q=Math.max(0,Math.min(1,isFinite(p)?p:0)),S=r*2+sw*2+4;
  return`<svg class="dk-ring${cls?' '+cls:''}" viewBox="0 0 ${S} ${S}" aria-hidden=true><circle class=dk-rgt cx=${S/2} cy=${S/2} r=${r} stroke-width=${sw} /><circle class=dk-rv cx=${S/2} cy=${S/2} r=${r} stroke-width=${sw} stroke-dasharray="${(c*q).toFixed(1)} ${c.toFixed(1)}" style="--c:${c.toFixed(1)}" transform="rotate(-90 ${S/2} ${S/2})" />${extra||''}</svg>`}
/* ---- LOOK A: REACTOR HUD. Symmetric cockpit: the arc reactor is the hero, holographic panels orbit it.
   The reactor is a stack of SVG layers; each rotating ring is its own composited layer (transform only, no repaint). ---- */
function dkReactorA(d){const C=220,p=Math.max(0,Math.min(1,d.gp||0)),a=(-90+p*360)*Math.PI/180,R=184,hx=C+R*Math.cos(a),hy=C+R*Math.sin(a);
  const on=d.P?d.P.ag.filter(x=>x.on):[],V='viewBox="0 0 440 440" aria-hidden=true';
  const ms=[.25,.5,.75,1].map(v=>{const t=(-90+v*360)*Math.PI/180,x=C+207*Math.cos(t),y=C+207*Math.sin(t);const lx=C+226*Math.cos(t),ly=C+226*Math.sin(t)+3;return`<rect class="dk-ms${p>=v?' hit':''}" x=${(x-5).toFixed(1)} y=${(y-5).toFixed(1)} width=10 height=10 transform="rotate(45 ${x.toFixed(1)} ${y.toFixed(1)})" /><text class="dk-msl${p>=v?' hit':''}" x=${lx.toFixed(1)} y=${ly.toFixed(1)} text-anchor="${v===.25?'start':v===.75?'end':'middle'}">${v===1?'GOAL':v*100+'%'}</text>`}).join('');
  const orb=on.map((x,i)=>{const t=-Math.PI/2+i*2*Math.PI/Math.max(1,on.length);return`<circle class=dk-ob cx=${(C+148*Math.cos(t)).toFixed(1)} cy=${(C+148*Math.sin(t)).toFixed(1)} r=5 />`}).join('');
  const sx=(C+170*Math.sin(Math.PI/3)).toFixed(1),sy=(C-170*Math.cos(Math.PI/3)).toFixed(1);
  return`<div class=dk-rx data-dkburst>
<svg class="dk-ly dk-l0" ${V}><defs><filter id=gl x=-30% y=-30% width=160% height=160%><feGaussianBlur stdDeviation=4 result=b /><feMerge><feMergeNode in=b /><feMergeNode in=SourceGraphic /></feMerge></filter>
<linearGradient id=rg x1=0 y1=0 x2=1 y2=1><stop offset=0 stop-color="#ff1f4f" stop-opacity=0 /><stop offset=1 stop-color="#ff1f4f" stop-opacity=.4 /></linearGradient>
<linearGradient id=dkag x1=0 y1=1 x2=1 y2=0><stop offset=0 stop-color="#b3123a" /><stop offset=.6 stop-color="#ff1f4f" /><stop offset=1 stop-color="#ffd6df" /></linearGradient>
<radialGradient id=dkcore cx=50% cy=50% r=50%><stop offset=0 stop-color="#230a12" /><stop offset=.7 stop-color="#10070b" /><stop offset=.93 stop-color="#2d0914" /><stop offset=1 stop-color="#ff1f4f" stop-opacity=.5 /></radialGradient></defs>
<circle class=dk-halo cx=${C} cy=${C} r=214 /><circle class=dk-tk cx=${C} cy=${C} r=203 pathLength=360 /><circle class=dk-tkm cx=${C} cy=${C} r=203 pathLength=360 />${ms}
<circle class=dk-gt cx=${C} cy=${C} r=${R} /><circle class=dk-ga cx=${C} cy=${C} r=${R} pathLength=100 stroke-dasharray="${(p*100).toFixed(2)} 100" transform="rotate(-90 ${C} ${C})" filter="url(#gl)" />
<circle class=dk-core cx=${C} cy=${C} r=134 fill="url(#dkcore)" /><circle class=dk-hot cx=${C} cy=${C} r=124 />${p>0?`<circle class=dk-head cx=${hx.toFixed(1)} cy=${hy.toFixed(1)} r=6.5 filter="url(#gl)" />`:''}</svg>
<svg class="dk-ly dk-l1" ${V}><circle class=dk-seg cx=${C} cy=${C} r=164 /></svg>
<svg class="dk-ly dk-l2" ${V}><circle class=dk-dash cx=${C} cy=${C} r=154 /></svg>
<svg class="dk-ly dk-l3" ${V}><path class=dk-swp d="M${C} ${C} L${C} ${C-170} A170 170 0 0 1 ${sx} ${sy} Z" fill="url(#rg)" /></svg>
<svg class="dk-ly dk-l4" ${V}><circle class=dk-orr cx=${C} cy=${C} r=148 />${orb}</svg>
<i class=dk-wave aria-hidden=true></i>${p>0?`<i class=dk-ping aria-hidden=true style="left:${(hx/4.4).toFixed(2)}%;top:${(hy/4.4).toFixed(2)}%"></i>`:''}
<div class="rt dk-rt"><small class=dk-rl>NET PROFIT</small><span class=dk-big>${dkN('net',d.s.net,'$')}</span><em class=dk-rg2>${dkN('gpct',Math.round((d.gp||0)*100),'%')} <i>of monthly goal</i></em></div></div>`}
function dkLook_a(d,tier){const M=dkMods(d),pa=d.pa,cl=d.cl,ld=cl.filter(x=>x.st=='Lead'||x.st=='Quoted').length,cn=cl.filter(x=>x.st=='Client').length,tot=Math.max(1,cl.length);
  const on=d.P?d.P.ag.filter(x=>x.on).length:0;
  const quad=pa.has?`<div class=dk-quad aria-hidden=true>${[1,3,4,2].map(n=>`<i class="${pa.n===n?'on':''}">${n}</i>`).join('')}</div>`:'';
  const split=`<div class=dk-split aria-hidden=true><i style="width:${(ld/tot*100).toFixed(1)}%"></i><b style="width:${(cn/tot*100).toFixed(1)}%"></b></div>`;
  const code=c=>`<span class=dk-code aria-hidden=true>${c}</span><i class=dk-scan aria-hidden=true></i>`;
  const ring=(p,c)=>dkRing(p,19,4,'dk-cr'+(c?' '+c:''));
  const chips=`<div class="chips dk-chips"><div>${ring(d.h.score/100)}<span><small>HEALTH</small><b>${dkN('health',d.h.score,'n')}</b></span></div><div>${ring(D.goal?d.f.proj/D.goal:0,'dk-cw')}<span><small>FORECAST</small><b>${dkN('fc',d.f.proj,'K')}</b></span></div><div>${ring(d.f.pend&&d.m?Math.min(1,d.f.pend/(d.f.pend+d.m)):0,'dk-cg')}<span><small>PIPELINE</small><b>${dkN('pipe',d.f.pend,'K')}</b></span></div></div>`;
  const status=`<span class=dk-sys><i></i>SYSTEMS NOMINAL &middot; ${on} ON THE CLOCK</span>`;
  return dkHead(d,status)+(d.owner?cqHtml():'')+mrBanner()+
  `<div class="deck dk-cock"><div class=dk-grid aria-hidden=true></div><div class="dl dk-side">${M.sales('dk-pan dk-l',code('SYS-01'))}${M.clients('dk-pan dk-l',split+code('SYS-02'))}</div>
<div class="dc dk-ctr">${dkReactorA(d)}<small class=dk-goal>${dkGoalTxt(d)}</small>${chips}</div>
<div class="dr dk-side">${M.fin('dk-pan dk-r',code('SYS-03'))}${M.path('dk-pan dk-r',quad+code('SYS-04'))}</div></div>`+
  pulseHtml()+
  `<div class=dk-chs>${chDeck()}</div>`+
  `<div class="g2 dk-g3"><div class=dk-col3>${dkBriefCard('dk-hp',1)}</div>
<div class=dk-col3>${dkAgents(d,'dk-hp')}${dkDiag(d,'dk-hp')}</div><div class=dk-col3>${dkQueue(d,'dk-hp')}${dkAlerts('dk-hp')}${mrDeck()}</div></div>`}
