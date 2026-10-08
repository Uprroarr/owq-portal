import re
p='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(p,encoding='utf-8').read()
# remove a previous install
s=re.sub(r'/\*CXcss\*/.*?/\*CXcssend\*/','',s,flags=re.S)
s=s.replace('<canvas id=cx aria-hidden="true"></canvas>','')
s=re.sub(r'/\*CXstart\*/.*?/\*CXend\*/\n?','',s,flags=re.S)
css='''/*CXcss*/#cx{position:fixed;inset:0;width:100%;height:100%;z-index:299;display:none;background:#05020a;transition:opacity .7s ease}#cx.on{display:block}#cx.fx{z-index:505}
#fwo{position:fixed;inset:0;width:100%;height:100%;z-index:420;pointer-events:none}/*CXcssend*/
'''
s=s.replace('#lgmap{position:fixed;',css+'#lgmap{position:fixed;',1)
s=s.replace('<canvas id=l3 aria-hidden="true"></canvas>','<canvas id=l3 aria-hidden="true"></canvas><canvas id=cx aria-hidden="true"></canvas>',1)
cx=open('cx/cx.js',encoding='utf-8').read()
glue=r'''
// ---- page integration: CX is the primary login renderer, L3 / 2D map stay as fallbacks ----
const _ms3=mapStart,_fx3=fxFly;
CX._fb=function(){try{_ms3()}catch(e){}};
mapStart=function(){try{if(CX.start())return}catch(e){}return _ms3.apply(this,arguments)};
fxFly=function(kind){try{if(CX.on&&!CX.dead&&CX.fly(kind))return}catch(e){}return _fx3.apply(this,arguments)};
(function(){const go=()=>setTimeout(()=>{try{CX.prep()}catch(e){}},250);if(document.readyState==='complete')go();else addEventListener('load',go,{once:true})})();
// ---- alerts -> fireworks + J.A.R.V.I.S. read-out ----
const FWA={last:'',lt:0,q:[]};
function alertSay(txt){try{if(typeof CQP!=='undefined'&&!CQP.vo)return;const s=globalThis.speechSynthesis;if(!s||typeof SpeechSynthesisUtterance==='undefined')return;
 txt=String(txt).replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim().slice(0,220);if(!txt)return;const now=Date.now();if(txt===FWA.last&&now-FWA.lt<6000)return;FWA.last=txt;FWA.lt=now;
 const u=new SpeechSynthesisUtterance(txt),vs=s.getVoices?s.getVoices():[];const pref=typeof CQP!=='undefined'&&CQP.vn?vs.find(x=>x.name===CQP.vn):null;
 const v=pref||vs.find(x=>/en-GB/i.test(x.lang)&&/male|daniel|arthur|oliver|george|uk english male/i.test(x.name))||vs.find(x=>/en-GB/i.test(x.lang))||vs.find(x=>/^en/i.test(x.lang));if(v)u.voice=v;u.rate=1;u.pitch=.82;u.volume=1;s.speak(u)}catch(e){}}
function fwOverlay(col,typ){try{if(typeof RM!=='undefined'&&RM)return;let c=document.getElementById('fwo');if(!c){c=document.createElement('canvas');c.id='fwo';c.setAttribute('aria-hidden','true');document.body.appendChild(c)}
 const x=c.getContext('2d');if(!x)return;const dpr=Math.min(2,devicePixelRatio||1);if(c.width!==Math.round(innerWidth*dpr)){c.width=Math.round(innerWidth*dpr);c.height=Math.round(innerHeight*dpr)}
 const W=c.width,H=c.height,cx0=W*(.2+.6*Math.random()),cy=H*(.18+.22*Math.random()),rgb=col.map(v=>Math.round(Math.min(1,v)*255));
 const P=[];let shell={x:cx0+(Math.random()-.5)*W*.05,y:H*1.02,vy:-(H*1.02-cy)/38,t:0};
 const burst=()=>{const n=typ===3?110:170;for(let i=0;i<n;i++){const a=Math.random()*6.283,u=typ===3?1:Math.cbrt(Math.random()),sp=(typ===1?3.1:4.2)*dpr*u*(.85+.3*Math.random());P.push({x:shell.x,y:shell.y,vx:Math.cos(a)*sp*(typ===3?1:Math.sqrt(1-Math.random()*.0)),vy:Math.sin(a)*sp*(typ===3?.35:1),l:1,d:typ===1?.0055:.0095+Math.random()*.004,g:typ===1?.07:.045,tw:typ===2})}shell=null;flash=1};
 let flash=0;const step=()=>{x.globalCompositeOperation='destination-out';x.fillStyle='rgba(0,0,0,.18)';x.fillRect(0,0,W,H);x.globalCompositeOperation='lighter';
  if(shell){shell.y+=shell.vy;shell.t++;shell.vy*=.985;x.fillStyle='rgba(255,210,150,.9)';x.beginPath();x.arc(shell.x+Math.sin(shell.t*.7)*dpr,shell.y,2*dpr,0,6.283);x.fill();if(shell.vy>-2.2*dpr||shell.y<=cy)burst()}
  if(flash>0){const g=x.createRadialGradient(cx0,cy,0,cx0,cy,160*dpr);g.addColorStop(0,'rgba(255,240,220,'+(.35*flash)+')');g.addColorStop(1,'rgba(255,240,220,0)');x.fillStyle=g;x.fillRect(cx0-160*dpr,cy-160*dpr,320*dpr,320*dpr);flash*=.8}
  for(const q of P){q.vx*=.972;q.vy=q.vy*.972+q.g*dpr;q.x+=q.vx;q.y+=q.vy;q.l-=q.d;if(q.l<=0)continue;let a=Math.min(1,q.l*1.4);if(q.tw&&q.l<.55)a*=Math.random()<.5?1:.1;
   const r=typ===1?mixc(rgb,[255,170,60],1-q.l):rgb;x.fillStyle='rgba('+r[0]+','+r[1]+','+r[2]+','+a+')';x.fillRect(q.x-1.3*dpr,q.y-1.3*dpr,2.6*dpr,2.6*dpr);
   if(q.l>.6){x.fillStyle='rgba(255,250,240,'+(a*.8)+')';x.fillRect(q.x-.7*dpr,q.y-.7*dpr,1.4*dpr,1.4*dpr)}}
  for(let i=P.length-1;i>=0;i--)if(P[i].l<=0)P.splice(i,1);
  if(shell||P.length)requestAnimationFrame(step);else{x.clearRect(0,0,W,H)}};
 const mixc=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k));requestAnimationFrame(step)}catch(e){}}
function fwAlert(al){try{const sev=al.sev;const col=sev==='ok'?[1,.72,.25]:sev==='crit'?[1,.16,.1]:sev==='warn'?[1,.3,.75]:[.3,.85,1];const typ=sev==='ok'?1:sev==='crit'?2:sev==='warn'?3:0;
 if(CX.on&&CX.ready)CX.firework({col,typ});else fwOverlay(col,typ);
 if(typeof ONLINE!=='undefined'&&ONLINE)setTimeout(()=>alertSay(String(al.t||'')+(al.m?'. '+String(al.m):'')),CX.on?1500:700)}catch(e){}}
const _pa3=pushAlert;
pushAlert=function(a,quiet){const r=_pa3.apply(this,arguments);try{if(r&&!quiet)fwAlert(r)}catch(e){}return r};
'''
s=s.replace('const views={','/*CXstart*/\n'+cx+glue+'/*CXend*/\nconst views={',1)
open(p,'w',encoding='utf-8').write(s)
print(len(s),s.count('<canvas id=cx'),s.count('/*CXstart*/'))
