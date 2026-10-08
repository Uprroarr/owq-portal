/*NFstart*/
/* nf: launch effects for pop-up notifications (firework / missile / rocket). Prefix nf. Kill switch: localStorage.owq_nf_off='1' */
/*NFPcore*/
var NFP=(function(){
 var CAP=250,P=[],R=[],alive=0,rng=Math.random,i;
 for(i=0;i<CAP;i++)P.push({a:0,x:0,y:0,px:0,py:0,vx:0,vy:0,g:0,d:0,l:0,m:1,r:1,s:0,c:[255,255,255],k:0});
 function add(o){for(var j=0;j<CAP;j++){var p=P[j];if(!p.a){p.a=1;p.x=p.px=o.x;p.y=p.py=o.y;p.vx=o.vx||0;p.vy=o.vy||0;p.g=o.g||0;p.d=o.d||0;p.l=0;p.m=o.m||.6;p.r=o.r||1.5;p.s=o.s||0;p.c=o.c||[255,255,255];p.k=o.k||0;alive++;return true}}return false}
 function ring(o){if(R.length>=8)R.shift();R.push({x:o.x,y:o.y,r0:o.r0||4,r1:o.r1||60,l:0,m:o.m||.4,c:o.c||[255,255,255],w:o.w||2})}
 function step(dt){var n=0,j,p,k;if(!(dt>0))dt=0;if(dt>.1)dt=.1;
  for(j=0;j<CAP;j++){p=P[j];if(!p.a)continue;p.l+=dt;if(p.l>=p.m||!(p.x===p.x)||!(p.y===p.y)){p.a=0;alive--;continue}
   p.px=p.x;p.py=p.y;k=1-p.d*dt;if(k<0)k=0;p.vx*=k;p.vy*=k;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;n++}
  for(j=R.length-1;j>=0;j--){R[j].l+=dt;if(R[j].l>=R[j].m)R.splice(j,1)}
  return n+R.length}
 function rgba(c,a){return 'rgba('+c[0]+','+c[1]+','+c[2]+','+(a<0?0:a>1?1:a).toFixed(3)+')'}
 function draw(ctx){var j,p,t,a,rr;
  ctx.globalCompositeOperation='source-over';
  for(j=0;j<CAP;j++){p=P[j];if(!p.a||p.k!==1)continue;t=p.l/p.m;ctx.fillStyle=rgba(p.c,.22*(1-t)*(1-t));ctx.beginPath();ctx.arc(p.x,p.y,p.r+p.s*t,0,6.2832);ctx.fill()}
  ctx.globalCompositeOperation='lighter';
  for(j=0;j<CAP;j++){p=P[j];if(!p.a||p.k===1)continue;t=p.l/p.m;
   if(p.k===0){a=1-t*t;ctx.strokeStyle=rgba(p.c,a);ctx.lineWidth=p.r*(1-t*.5);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.px,p.py);ctx.lineTo(p.x,p.y);ctx.stroke()}
   else if(p.k===2){ctx.fillStyle=rgba(p.c,.9*(1-t));ctx.beginPath();ctx.arc(p.x,p.y,p.r*(1-t*.4),0,6.2832);ctx.fill()}
   else if(p.k===4){a=(1-t)*(.35+.65*Math.abs(Math.sin(p.l*40+p.x)));ctx.fillStyle=rgba(p.c,a);ctx.fillRect(p.x-p.r/2,p.y-p.r/2,p.r,p.r)}
   else if(p.k===3){a=Math.sin(Math.PI*t);rr=p.r*(.4+.6*a);ctx.fillStyle=rgba(p.c,a);ctx.beginPath();ctx.moveTo(p.x,p.y-rr);ctx.quadraticCurveTo(p.x,p.y,p.x+rr,p.y);ctx.quadraticCurveTo(p.x,p.y,p.x,p.y+rr);ctx.quadraticCurveTo(p.x,p.y,p.x-rr,p.y);ctx.quadraticCurveTo(p.x,p.y,p.x,p.y-rr);ctx.fill()}}
  for(j=0;j<R.length;j++){p=R[j];t=p.l/p.m;a=1-t;ctx.strokeStyle=rgba(p.c,a*.9);ctx.lineWidth=p.w*(1-t*.6);ctx.beginPath();ctx.arc(p.x,p.y,p.r0+(p.r1-p.r0)*(1-(1-t)*(1-t)),0,6.2832);ctx.stroke()}
  ctx.globalCompositeOperation='source-over'}
 function clear(){for(var j=0;j<CAP;j++)P[j].a=0;alive=0;R.length=0}
 function burst(x,y,S,rn){var n=Math.round(46*(S<1?.7:1)),j,sp,an,col=[[255,207,64],[255,31,79],[255,240,210],[255,150,60]];
  for(j=0;j<n;j++){an=j/n*6.2832+(rng()-.5)*.08;sp=(j%2?190:120)*S*(.9+.25*rng());
   add({x:x,y:y,vx:Math.cos(an)*sp*1.5,vy:Math.sin(an)*sp*1.5,g:170*S,d:1.7,m:.75+.35*rng(),r:2.2,c:col[j%3===2?(rng()<.5?2:3):j%3===1?1:0],k:0})}
  for(j=0;j<(S<1?6:12);j++){an=rng()*6.2832;sp=(30+90*rng())*S;add({x:x,y:y,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-20,g:60,d:1,m:1.1+.5*rng(),r:2.4,c:rng()<.6?col[0]:col[2],k:4})}
  ring({x:x,y:y,r0:6,r1:70*S,m:.32,c:[255,207,64],w:2.5})}
 function impact(x,y,S){var j,an,sp,n=S<1?10:16;
  for(j=0;j<n;j++){an=rng()*6.2832;sp=(140+240*rng())*S;add({x:x,y:y,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,g:240,d:2.2,m:.35+.3*rng(),r:2,c:rng()<.5?[255,31,79]:[255,190,90],k:0})}
  ring({x:x,y:y,r0:4,r1:78*S,m:.36,c:[255,31,79],w:3});ring({x:x,y:y,r0:2,r1:44*S,m:.26,c:[255,220,200],w:1.5})}
 return {CAP:CAP,add:add,ring:ring,step:step,draw:draw,clear:clear,burst:burst,impact:impact,pool:P,rings:R,count:function(){return alive},setRng:function(f){rng=f}}
})();
/*NFPend*/
var NF={on:0,cv:null,cx:null,g:null,raf:0,last:0,fl:[],lv:[],act:0,q:[],dpr:1,W:0,H:0,mode:{},lastKind:'info',inited:0,tm:[]};
function nfOff(){try{return localStorage.getItem('owq_nf_off')==='1'}catch(e){return false}}
function nfRM(){try{return !!((typeof RM!=='undefined'&&RM)||document.documentElement.classList.contains('redmo'))}catch(e){return false}}
function nfScale(){return (globalThis.innerWidth||1400)<=560?.72:1}
function nfKind(a){var s=a&&a.sev,t=String((a&&a.t)||'')+' '+String((a&&a.m)||'');
 if(/mentioned you/i.test(t)&&s!=='crit')return 'info';
 if(s==='crit'||s==='warn')return 'warn';
 if(s==='ok')return 'ok';
 if(/\b(win|won|sale|sold|issued|milestone|rank|quota|goal hit|unlocked|record|promoted|level)\b/i.test(t))return 'ok';
 return 'info'}
function nfSetup(){if(NF.inited)return;NF.inited=1;
 var b=document.body,g=document.createElement('div'),c=document.createElement('canvas');
 g.id='nfg';g.setAttribute('aria-hidden','true');c.id='nfc';c.setAttribute('aria-hidden','true');b.appendChild(g);b.appendChild(c);
 NF.g=g;NF.cv=c;NF.cx=c.getContext('2d');
 var p=document.getElementById('pop');
 if(p)p.addEventListener('click',function(e){try{var el=e.target.closest&&e.target.closest('.pp'),m=el&&String(el.getAttribute('onclick')||'').match(/alGo\((\d+)\)/);if(m)NF.mode[m[1]]='click'}catch(x){}},true);
 document.addEventListener('visibilitychange',function(){if(document.hidden)nfFlush()})}
function nfSize(){var W=globalThis.innerWidth||1400,H=globalThis.innerHeight||900,d=Math.min(W<=560?1.5:2,globalThis.devicePixelRatio||1);
 if(W!==NF.W||H!==NF.H||d!==NF.dpr){NF.W=W;NF.H=H;NF.dpr=d;NF.cv.width=Math.round(W*d);NF.cv.height=Math.round(H*d);NF.cx.setTransform(d,0,0,d,0,0)}}
function nfLoop(){if(NF.raf||document.hidden)return;NF.last=performance.now();NF.raf=requestAnimationFrame(nfTick)}
function nfTick(ts){NF.raf=0;var now=performance.now(),dt=(now-NF.last)/1000;NF.last=now;
 try{nfSize();var i,f,p,o;
  for(i=NF.fl.length-1;i>=0;i--){f=NF.fl[i];p=(now-f.t0)/f.dur;if(p>=1){p=1}
   if(f.upd)f.upd();o=f.fn(p);if(f.el)f.el.style.transform='translate3d('+(o.x-f.w/2).toFixed(1)+'px,'+(o.y-f.h/2).toFixed(1)+'px,0) rotate('+o.a.toFixed(1)+'deg)';
   f.tr(o,dt,p);if(p>=1){if(f.el)f.el.remove();NF.fl.splice(i,1)}}
  for(i=NF.lv.length-1;i>=0;i--){if(nfLeaveTick(NF.lv[i],now))NF.lv.splice(i,1)}
  var n=NFP.step(dt);NF.cx.clearRect(0,0,NF.W,NF.H);NFP.draw(NF.cx);
  if(NF.fl.length||NF.lv.length||n>0)NF.raf=requestAnimationFrame(nfTick);else NF.cx.clearRect(0,0,NF.W,NF.H)
 }catch(e){NF.fl.length=0;NF.lv.length=0;NFP.clear();try{NF.cx.clearRect(0,0,NF.W,NF.H)}catch(x){}}}
function nfFlush(){NF.fl.forEach(function(f){try{f.el&&f.el.remove()}catch(e){}});NF.fl.length=0;NF.lv.forEach(function(l){try{l.el.remove()}catch(e){}});NF.lv.length=0;NF.q.forEach(function(q){nfReveal(q.el,'plain')});NF.q.length=0;NF.act=0;NFP.clear();
 try{NF.cx&&NF.cx.clearRect(0,0,NF.W,NF.H)}catch(e){}
 document.querySelectorAll('#pop .nf-wait').forEach(function(e){nfReveal(e,'plain')})}
function nfT(fn,ms){var h=setTimeout(function(){NF.tm=NF.tm.filter(function(x){return x!==h});fn()},ms);NF.tm.push(h);return h}
function nfReveal(el,kind){if(!el||!el.classList.contains('nf-wait'))return;el.classList.remove('nf-wait');el.classList.add('nf-ig','nf-k-'+kind)}
/* --- bodies --- */
var NFSVG={
 warn:'<svg viewBox="0 0 64 20" width="96" height="30" aria-hidden="true"><defs><linearGradient id="nfmg" x1="0" x2="1"><stop offset="0" stop-color="#2a2a36"/><stop offset="1" stop-color="#0d0d14"/></linearGradient><linearGradient id="nff1" x1="1" x2="0"><stop offset="0" stop-color="#fff2c0"/><stop offset=".5" stop-color="#ffb020"/><stop offset="1" stop-color="#ff1f4f" stop-opacity="0"/></linearGradient></defs><g class="nf-flk"><path d="M14 10 L-14 5 Q-4 10 -14 15Z" fill="url(#nff1)"/></g><path d="M12 3 L22 6 L22 14 L12 17 L16 10Z" fill="#8a1230"/><path d="M14 10 Q14 4 22 4 L46 5 Q56 7 62 10 Q56 13 46 15 L22 16 Q14 16 14 10Z" fill="url(#nfmg)" stroke="#4a4a5c" stroke-width=".8"/><rect x="26" y="4.6" width="7" height="10.8" fill="#ff1f4f"/><path d="M50 5.6 Q58 7.2 62 10 Q58 12.8 50 14.4Z" fill="#f4f4f6"/></svg>',
 info:'<svg viewBox="0 0 24 60" width="30" height="75" aria-hidden="true"><defs><linearGradient id="nff2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2c0"/><stop offset=".5" stop-color="#ffcf40"/><stop offset="1" stop-color="#ff1f4f" stop-opacity="0"/></linearGradient><linearGradient id="nfrb" x1="0" x2="1"><stop offset="0" stop-color="#c9c9d6"/><stop offset=".5" stop-color="#f4f4f6"/><stop offset="1" stop-color="#9a9aa8"/></linearGradient></defs><g class="nf-flk2"><path d="M8 44 L12 66 L16 44Z" fill="url(#nff2)"/></g><path d="M3 38 L8 28 L8 44 L3 48Z M21 38 L16 28 L16 44 L21 48Z" fill="#ff1f4f"/><path d="M12 2 Q20 14 17 44 L7 44 Q4 14 12 2Z" fill="url(#nfrb)" stroke="#6a6a7a" stroke-width=".6"/><path d="M12 2 Q15.4 7 16.4 14 L7.6 14 Q8.6 7 12 2Z" fill="#ff1f4f"/><rect x="7" y="34" width="10" height="4" fill="#ff1f4f"/><circle cx="12" cy="24" r="3.2" fill="#0d0d14" stroke="#ffcf40" stroke-width="1"/></svg>'};
function nfBody(k){var d=document.createElement('div');d.className='nf-fly nf-fly-'+k;d.innerHTML=NFSVG[k]||'';NF.g.appendChild(d);return d}
var CG=[255,207,64],CR=[255,31,79],CW=[255,240,220],CS=[150,150,165];
/* --- launch one flyer toward card el --- */
function nfLaunch(el,kind){var S=nfScale(),W=NF.W||globalThis.innerWidth,H=NF.H||globalThis.innerHeight,r=el.getBoundingClientRect(),tx=r.left+r.width/2,ty=r.top+r.height/2,t0=performance.now(),f,dur,imp;
 NF.act++;NFP.setRng(Math.random);
 var done=function(){if(done.d)return;done.d=1;NF.act=Math.max(0,NF.act-1);nfDrain()};
 if(kind==='ok'){dur=380;var sx=tx+(Math.random()-.5)*60*S,sy=H+10;
  f={el:null,w:0,h:0,t0:t0,dur:dur,fn:function(p){var e=1-(1-p)*(1-p);return {x:sx+(tx-sx)*e,y:sy+(ty-sy)*e,a:0}},tr:function(o,dt,p){if(p>=1)return;NFP.add({x:o.x,y:o.y,vx:(Math.random()-.5)*30,vy:40+Math.random()*50,g:160,d:1,m:.45,r:2,c:CG,k:0});NFP.add({x:o.x,y:o.y,vx:0,vy:0,m:.1,r:3.4,c:CW,k:2})}};
  imp=function(){NFP.burst(tx,ty,S)}}
 else if(kind==='warn'){dur=420;var fromLeft=tx>(W*.45),x0=fromLeft?-70:W+70,y0=Math.min(H-30,ty+(W<=560?150:230)),cxp=(x0+tx)/2,cyp=Math.max(50,Math.min(y0,ty)-(W<=560?90:150));
  var el2=nfBody('warn');el2.style.transform='translate3d(-999px,-999px,0)';
  f={el:el2,w:96,h:30,t0:t0,dur:dur,fn:function(p){var e=p*p*(1.6-.6*p),u=1-e,x=u*u*x0+2*u*e*cxp+e*e*tx,y=u*u*y0+2*u*e*cyp+e*e*ty,dx=2*u*(cxp-x0)+2*e*(tx-cxp),dy=2*u*(cyp-y0)+2*e*(ty-cyp);return {x:x,y:y,a:Math.atan2(dy,dx)*57.2958+(fromLeft?0:0)}},
   tr:function(o,dt,p){if(p>=1)return;var an=o.a/57.2958,bx=o.x-Math.cos(an)*44*S,by=o.y-Math.sin(an)*44*S;
    NFP.add({x:bx,y:by,vx:-Math.cos(an)*20+(Math.random()-.5)*24,vy:-Math.sin(an)*20+(Math.random()-.5)*24,d:1,m:.55,r:4,s:16,c:CS,k:1});
    NFP.add({x:bx,y:by,vx:-Math.cos(an)*120+(Math.random()-.5)*50,vy:-Math.sin(an)*120+(Math.random()-.5)*50,g:60,d:2,m:.3,r:2,c:Math.random()<.5?CR:CG,k:0})}};
  imp=function(){NFP.impact(tx,ty,S)}}
 else{dur=460;var x1=tx+(Math.random()<.5?-1:1)*18*S,y1=H+50,ty2=ty+r.height*.1;
  var el3=nfBody('info');el3.style.transform='translate3d(-999px,-999px,0)';
  f={el:el3,w:30,h:75,t0:t0,dur:dur,fn:function(p){var e=1-Math.pow(1-p,2.2),sw=Math.sin(p*7)*(1-p)*10*S;return {x:x1+(tx-x1)*e+sw,y:y1+(ty2-y1)*e,a:sw*.9}},
   tr:function(o,dt,p){if(p>=1)return;var by=o.y+38*S;
    NFP.add({x:o.x,y:by,vx:(Math.random()-.5)*30,vy:60+Math.random()*60,g:-10,d:1.2,m:.6,r:4,s:15,c:CS,k:1});
    NFP.add({x:o.x,y:by,vx:(Math.random()-.5)*50,vy:160+Math.random()*80,g:0,d:2,m:.3,r:2,c:Math.random()<.6?CG:CR,k:0})}};
  imp=function(){NFP.ring({x:tx,y:r.bottom,r0:4,r1:46*S,m:.35,c:CG,w:1.6});for(var j=0;j<8;j++)NFP.add({x:tx+(Math.random()-.5)*60,y:r.bottom,vx:(Math.random()-.5)*160,vy:30+Math.random()*40,g:0,d:2,m:.4,r:5,s:14,c:CS,k:1})}}
 f.upd=function(){var q=el.getBoundingClientRect();tx=q.left+q.width/2;ty=q.top+q.height/2;r=q};
 NF.fl.push(f);nfLoop();
 nfT(function(){try{f.upd();nfReveal(el,kind);imp()}catch(e){nfReveal(el,kind)}nfLoop();done()},dur-(kind==='ok'?0:30));
}
function nfDrain(){if(!NF.q.length||NF.act>=3||NF.drn)return;NF.drn=1;nfT(function(){NF.drn=0;var q=NF.q.shift();while(q&&!q.el.isConnected)q=NF.q.shift();if(q&&NF.act<3){try{nfLaunch(q.el,q.kind)}catch(e){nfReveal(q.el,'plain')}}else if(q)NF.q.unshift(q);nfDrain()},250)}
function nfArrive(el,kind){
 if(document.hidden||nfRM()){nfReveal(el,nfRM()?'rm':'plain');return}
 if(NF.q.length>=6){nfReveal(el,'plain');return}
 if(NF.act>=3||NF.q.length){NF.q.push({el:el,kind:kind});nfT(function(){if(el.classList.contains('nf-wait')){NF.q=NF.q.filter(function(x){return x.el!==el});nfReveal(el,'plain')}},2600);nfDrain();return}
 try{nfLaunch(el,kind)}catch(e){nfReveal(el,'plain')}
 nfT(function(){nfReveal(el,'plain')},1200)}
/* --- leaving --- */
function nfLeave(el,r,mode){
 var cl=mode==='click';
 if(document.hidden){return}
 nfSetup();
 if(nfRM()){var g0=el;g0.className=g0.className.replace(/\bnf-(wait|ig|k-\w+)\b/g,'').trim()+' pp nf-gone nf-gone-rm';nfPlace(g0,r);g0.setAttribute('aria-hidden','true');g0.removeAttribute('onclick');NF.g.appendChild(g0);requestAnimationFrame(function(){g0.classList.add('go')});nfT(function(){g0.remove()},260);return}
 if(el.classList.contains('nf-wait')){el.remove();return}
 el.classList.remove('nf-ig','nf-k-ok','nf-k-warn','nf-k-info','nf-k-plain','nf-k-rm');el.classList.add('nf-gone');el.style.animation='none';
 nfPlace(el,r);el.setAttribute('aria-hidden','true');el.removeAttribute('onclick');NF.g.appendChild(el);
 var fl=document.createElement('span');fl.className='nf-fl';el.appendChild(fl);
 NF.lv.push({el:el,fl:fl,r:r,t0:performance.now(),th:cl?170:70,dur:cl?560:340,cl:cl,S:nfScale(),star:0});nfLoop()}
function nfPlace(el,r){var s=el.style;s.position='absolute';s.left=r.left+'px';s.top=r.top+'px';s.width=r.width+'px';s.margin='0';s.right='auto';s.transform='none'}
function nfLeaveTick(l,now){var t=now-l.t0,r=l.r,S=l.S,cx=r.left+r.width/2,bot,x=0,y=0,p=0,sc='';
 if(t<l.th){var q=t/l.th;if(l.cl)x=Math.sin(t*.12)*2.6;l.fl.style.opacity=String(Math.min(1,q*1.4));l.fl.style.transform='translateX(-50%) scaleY('+(.5+q*.6)+')';y=0;
  bot=r.top+r.height;NFP.add({x:cx+(Math.random()-.5)*26,y:bot,vx:(Math.random()-.5)*40,vy:120+Math.random()*80,d:2,m:.25,r:2.2,c:Math.random()<.5?CG:CR,k:0})}
 else{p=Math.min(1,(t-l.th)/l.dur);var e=Math.pow(p,2.1),D=r.top+r.height+60;y=-D*e;bot=r.top+r.height+y;
  l.fl.style.opacity='1';l.fl.style.transform='translateX(-50%) scaleY('+(1.1+p*.7)+')';sc=' scale('+(1-.06*p)+','+(1+.1*p)+')';
  NFP.add({x:cx+(Math.random()-.5)*14,y:bot+8,vx:(Math.random()-.5)*20,vy:20+Math.random()*30,d:.8,m:.7,r:5*S,s:18*S,c:CS,k:1});
  NFP.add({x:cx+(Math.random()-.5)*18,y:bot+4,vx:(Math.random()-.5)*50,vy:180+Math.random()*120,d:2,m:.28,r:2,c:Math.random()<.5?CG:CR,k:0});
  if(p>.62)l.el.style.opacity=String(Math.max(0,1-(p-.62)/.38))}
 l.el.style.transform='translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0)'+sc;
 if(t>=l.th+l.dur||(t>=l.th&&r.top+r.height+y<-20)){if(!l.star){l.star=1;NFP.add({x:cx,y:Math.max(16,r.top*.2+14),m:.7,r:(l.cl?11:7)*S,c:[255,240,200],k:3})}
  l.el.remove();return true}
 return false}
/* --- hooks: wrap popRender (keyed reconcile, original markup is reused) and beep --- */
(function(){
 if(typeof popRender!=='function')return;
 var _pr=popRender,_bp=(typeof beep==='function')?beep:null;
 popRender=function(nid){
  var p=document.getElementById('pop');
  if(!p||nfOff())return _pr(nid);
  var olds={},orect={},ids=[];
  try{Array.prototype.forEach.call(p.querySelectorAll('.pp'),function(e){var m=String(e.getAttribute('onclick')||'').match(/alGo\((\d+)\)/);if(m){olds[m[1]]=e;orect[m[1]]=e.getBoundingClientRect()}})}catch(e){}
  _pr(nid);
  try{
   nfSetup();
   var kept={},fresh=[];
   Array.prototype.forEach.call(p.querySelectorAll('.pp'),function(e){var m=String(e.getAttribute('onclick')||'').match(/alGo\((\d+)\)/);if(!m)return;var id=m[1];ids.push(id);
    if(olds[id]){e.replaceWith(olds[id]);kept[id]=1}else{e.classList.remove('new');e.classList.add('nf-wait');fresh.push([e,id])}});
   var after={};Array.prototype.forEach.call(p.querySelectorAll('.pp'),function(e){var m=String(e.getAttribute('onclick')||'').match(/alGo\((\d+)\)/);if(m)after[m[1]]=e.getBoundingClientRect()});
   Object.keys(olds).forEach(function(id){
    if(kept[id])return;
    var mode=NF.mode[id]||'timeout';delete NF.mode[id];
    try{nfLeave(olds[id],orect[id],mode)}catch(e){try{olds[id].remove()}catch(x){}}});
   if(!document.hidden&&!nfRM())Object.keys(kept).forEach(function(id){var dy=orect[id].top-after[id].top;if(Math.abs(dy)>1&&olds[id].animate){try{olds[id].animate([{transform:'translateY('+dy+'px)'},{transform:'none'}],{duration:300,easing:'cubic-bezier(.2,.8,.2,1)'})}catch(e){}}});
   fresh.forEach(function(x){var k=nfKind(((typeof AL==='function'?AL():[]).find(function(a){return String(a.id)===x[1]}))||{});NF.lastKind=k;x[0].classList.add('nf-c-'+k);nfArrive(x[0],k)});
  }catch(e){try{document.querySelectorAll('#pop .nf-wait').forEach(function(x){nfReveal(x,'plain')})}catch(x){}}
 };
 if(_bp)beep=function(sev){_bp(sev);try{if(!nfOff())nfSnd(NF.lastKind)}catch(e){}};
})();
/* the older generic full-screen firework (fwOverlay, random spot) is replaced by the launch effects; kill switch restores it */
(function(){if(typeof fwOverlay!=='function')return;var _fo=fwOverlay;fwOverlay=function(c,t){if(nfOff())return _fo(c,t)}})();
/* --- sound: tiny synthesized whoosh, only when sound is on and the audio context is already running --- */
function nfSnd(kind){if(!(typeof D!=='undefined'&&D.snd)||nfRM())return;var C=(typeof AC!=='undefined')&&AC;if(!C||C.state!=='running')return;
 var n=C.currentTime,len=Math.floor(C.sampleRate*.3),buf=C.createBuffer(1,len,C.sampleRate),d=buf.getChannelData(0),i,s=C.createBufferSource(),f=C.createBiquadFilter(),g=C.createGain();
 for(i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
 s.buffer=buf;f.type='bandpass';f.Q.value=1.2;
 if(kind==='ok'){f.frequency.setValueAtTime(400,n);f.frequency.exponentialRampToValueAtTime(2600,n+.3)}else if(kind==='warn'){f.frequency.setValueAtTime(2400,n);f.frequency.exponentialRampToValueAtTime(300,n+.28)}else{f.frequency.setValueAtTime(300,n);f.frequency.exponentialRampToValueAtTime(1500,n+.3)}
 g.gain.setValueAtTime(.0001,n);g.gain.exponentialRampToValueAtTime(.05,n+.06);g.gain.exponentialRampToValueAtTime(.0001,n+.3);
 s.connect(f);f.connect(g);g.connect(C.destination);s.start(n);s.stop(n+.31)}
/* --- demo hook (real pushAlert, so counts / rail / bell behave exactly like live alerts) --- */
function nfDemo(kind){var T={ok:{sev:'ok',t:'Policy issued',m:'Jordan Reyes - $1,240 AP with Americo (Austin Vardzel)',go:['Agency Performance','Policies']},crit:{sev:'crit',t:'Chargeback received',m:'Maria Delgado - $980 AP with Americo',go:['Agency Performance','Policies']},warn:{sev:'warn',t:'Quota at risk',m:'Nate Johnson is 3 submits behind this week.',go:['Leaderboard']},info:{sev:'info',t:'New lead',m:'Dana Whitfield from Facebook needs a first call',go:['Clients']}};
 if(kind==='burst'){['ok','warn','info','crit','ok'].forEach(function(k,i){setTimeout(function(){nfDemo(k)},i*120)});return}
 var o=T[kind]||T.info;return pushAlert(Object.assign({},o))}
/*NFend*/
