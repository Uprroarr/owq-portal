/*GXSstart lobby*/
const LB={au:null,st:0,muted:0,off:0,ft:0};
try{LB.off=localStorage.getItem('owq_gxsmus')==='0'?1:0}catch(e){}
function gxsHint(){try{let h=document.getElementById('gxshint');
 const want=!ONLINE&&!LB.off&&LB.st&&LB.muted&&LB.au&&!LB.au.paused;
 const lg=document.getElementById('login'),vis=lg&&lg.style.display!=='none'&&getComputedStyle(lg).display!=='none';
 if(!h){if(!want)return;h=document.createElement('div');h.id='gxshint';h.setAttribute('aria-hidden','true');
  const touch=matchMedia&&matchMedia('(pointer:coarse)').matches;
  h.innerHTML='<span class=gxsEq><i></i><i></i><i></i><i></i></span><b>'+(touch?'TAP FOR SOUND':'CLICK OR PRESS ANY KEY FOR SOUND')+'</b>';document.body.appendChild(h)}
 h.classList.toggle('on',!!(want&&vis))}catch(e){}}
function gxsFade(a){try{clearInterval(LB.ft);const t0=performance.now();a.volume=0;LB.ft=setInterval(()=>{const k=Math.min(1,(performance.now()-t0)/600);a.volume=.7*k;if(k>=1)clearInterval(LB.ft)},40)}catch(e){a.volume=.7}}
function lobbyUnmute(){const a=LB.au;if(!a||!LB.muted)return;LB.muted=0;a.muted=false;gxsFade(a);if(a.paused)try{a.play()}catch(e){}gxsHint();try{GXU.stat&&GXU.stat()}catch(e){}}
function lobbyStart(){if(ONLINE||LB.off)return;try{if(!LB.au){LB.au=new Audio(LOBBYSRC);LB.au.loop=true;LB.au.volume=.7}const a=LB.au;
 if(LB.st){if(LB.muted&&navigator.userActivation&&navigator.userActivation.hasBeenActive)lobbyUnmute();else if(a.paused&&!document.hidden)try{a.play()}catch(e){}gxsHint();return}
 LB.st=1;a.muted=false;LB.muted=0;const pr=a.play();
 const fb=()=>{a.muted=true;LB.muted=1;const p2=a.play();if(p2&&p2.catch)p2.catch(()=>{LB.st=0;LB.muted=0;a.muted=false});gxsHint()};
 if(pr&&pr.catch)pr.catch(fb);setTimeout(gxsHint,900)}catch(e){LB.st=0}}
function lobbyGesture(){if(ONLINE||LB.off)return;if(LB.au&&LB.muted)lobbyUnmute();else lobbyStart()}
function lobbyStop(){try{const a=LB.au;LB.st=0;LB.muted=0;clearInterval(LB.ft);gxsHint();if(!a)return;const f=setInterval(()=>{a.volume=Math.max(0,a.volume-.12);if(a.volume<=.01){clearInterval(f);a.pause();a.currentTime=0;a.volume=.7}},60)}catch(e){}}
function lobbyToggle(){LB.off=LB.off?0:1;try{localStorage.setItem('owq_gxsmus',LB.off?'0':'1')}catch(e){}
 if(LB.off){try{clearInterval(LB.ft);if(LB.au){LB.au.pause();LB.au.volume=.7;LB.st=0;LB.muted=0}}catch(e){}gxsHint()}
 else{LB.st=0;lobbyStart()}
 try{GXU.stat&&GXU.stat()}catch(e){}return LB.off?0:1}
['pointerdown','click','keydown','touchstart','touchend','mouseup','wheel'].forEach(e=>addEventListener(e,()=>{if(!ONLINE)lobbyGesture()},{passive:true,capture:true}));
setTimeout(()=>{if(typeof ONLINE!=='undefined'&&!ONLINE)lobbyStart()},250);
addEventListener('load',()=>{if(!ONLINE)lobbyStart()});
document.addEventListener('visibilitychange',()=>{try{const a=LB.au;if(!a||ONLINE||!LB.st)return;if(document.hidden)a.pause();else if(!LB.off)a.play().catch(()=>{})}catch(e){}});
setInterval(gxsHint,1000);
/*GXSend lobby*/
