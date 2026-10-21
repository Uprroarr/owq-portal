/*B1start*/
/* ---- v117 alerts: quiet start, no repeats, voice only for what matters ----
   Login: everything the scan finds goes to the bell quietly; one summary popup if there is anything that needs you.
   After that: at most one popup every 8 s, the same alert title pops once per 30 min (later ones go to the bell),
   and the voice reads only important alerts (critical, mentions, issued policies, chargebacks) at most every 5 min,
   never in the first minute. Settings > Alerts: voice Important / All / Off. */
var ALP={t0:0,last:{},popT:0,sayT:0,nv:0};
function alVoice(){try{return localStorage.getItem('owq_alv')||'imp'}catch(e){return'imp'}}
function alVoiceSet(v){try{localStorage.setItem('owq_alv',v)}catch(e){}try{toast(v==='off'?'Alert voice off':v==='all'?'Alert voice: all alerts':'Alert voice: important alerts only',1)}catch(e){}}
function alSpeakOk(al){const m=alVoice(),now=Date.now();if(m==='off'||!al||al.nv||ALP.nv)return false;if(ALP.t0&&now-ALP.t0<60000)return false;
 const imp=al.sev==='crit'||/mentioned you|Policy issued|Chargeback/i.test(String(al.t||''));if(m==='imp'&&!imp)return false;if(now-ALP.sayT<(m==='all'?60000:300000))return false;ALP.sayT=now;return true}
{const _pa4=pushAlert;pushAlert=function(a,quiet){if(!quiet&&a){const now=Date.now(),key=String(a.t||'')+'|'+String(a.sev||'');
  if(ALP.t0&&now-ALP.t0<20000&&!a.sum)quiet=true;else if(ALP.last[key]&&now-ALP.last[key]<18e5)quiet=true;else if(now-ALP.popT<8000&&a.sev!=='crit')quiet=true;
  if(!quiet){ALP.last[key]=now;ALP.popT=now}}
 if(a&&a.nv){ALP.nv=1;try{return _pa4.call(this,a,quiet)}finally{ALP.nv=0}}return _pa4.call(this,a,quiet)}}
scanStream=function(){if(!ONLINE)return;ALP.t0=Date.now();const out=scan().filter(a=>!AL().some(x=>x.k===a.k));out.forEach(a=>{try{_paQ(a)}catch(e){}});
 const need=out.filter(a=>a.sev==='crit'||a.sev==='warn');if(!need.length)return;const top=need.find(a=>a.sev==='crit')||need[0];
 setTimeout(()=>{if(ONLINE)pushAlert({sev:top.sev,sum:1,nv:1,t:need.length===1?top.t:need.length+' things need you',m:need.length===1?top.m:need.slice(0,3).map(a=>a.t).join(' \u00b7 ')+(need.length>3?' \u00b7 +'+(need.length-3)+' more':''),go:top.go})},1200)};
function _paQ(a){pushAlert(a,true)}
{const _ri=railInit;railInit=function(){ALP.t0=Date.now();return _ri.apply(this,arguments)}}
/* ---- v117 smoother live updates: a sync re-render patches the page in place (no flash, no restarted animations) ---- */
function owqMorph(a,b){const an=Array.from(a.childNodes),bn=Array.from(b.childNodes);
 for(let i=0;i<bn.length;i++){const x=an[i],y=bn[i];if(!x){a.appendChild(y);continue}
  if(x.nodeType!==y.nodeType||x.nodeName!==y.nodeName||(x.nodeType===1&&(x.id||'')!==(y.id||''))){a.replaceChild(y,x);continue}
  if(x.nodeType!==1){if(x.nodeValue!==y.nodeValue)x.nodeValue=y.nodeValue;continue}
  if(x.isEqualNode(y))continue;
  const xa=x.attributes,ya=y.attributes;for(let j=xa.length-1;j>=0;j--){const n=xa[j].name;if(!y.hasAttribute(n))x.removeAttribute(n)}
  for(let j=0;j<ya.length;j++){const n=ya[j].name,v=ya[j].value;if(x.getAttribute(n)!==v)x.setAttribute(n,v)}
  if(/^(CANVAS|VIDEO|IFRAME|AUDIO)$/.test(x.nodeName))continue;
  if(x.nodeName==='TEXTAREA'||x.nodeName==='INPUT'||x.nodeName==='SELECT'){if(document.activeElement!==x)a.replaceChild(y,x);continue}
  owqMorph(x,y)}
 for(let j=an.length-1;j>=bn.length;j--)if(an[j].parentNode===a)a.removeChild(an[j])}
function owqSetMain(h){const m=document.getElementById('main');if(!m)return;if(!QUIET||!m.firstChild){m.innerHTML=h;return}
 try{const t=document.createElement('div');t.innerHTML=h;owqMorph(m,t)}catch(e){m.innerHTML=h}}
/* ---- v117 late to the Sales Floor: once a day, first join after the call session starts (11:05 AM ET Mon-Sat) ---- */
function lateEt(){try{const f=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour12:false,weekday:'short',hour:'2-digit',minute:'2-digit',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),g=k=>(f.find(p=>p.type===k)||{}).value||'';
 return{wd:g('weekday'),min:(+g('hour')%24)*60+(+g('minute')),day:g('year')+'-'+g('month')+'-'+g('day')}}catch(e){return null}}
function lateCheck(){try{if(!ONLINE||!WHO||WHO==='Agency Owner')return;const t=lateEt();if(!t||t.wd==='Sun')return;const st=(+(D.flStart||'11:00').split(':')[0])*60+(+(D.flStart||'11:00').split(':')[1]||0)+5;
 if(t.min<st)return;const k='owq_late_'+String(WHO).replace(/\W/g,'');let seen='';try{seen=localStorage.getItem(k)||''}catch(e){}if(seen===t.day)return;try{localStorage.setItem(k,t.day)}catch(e){}
 const d=document.createElement('div');d.id='latepop';d.setAttribute('role','alertdialog');d.innerHTML='<div class=lp-c><small>LATE TO THE SALES FLOOR</small><b>I am a lazy pussy and don\u2019t want to show up on-time</b><button class=btn onclick="document.getElementById(\'latepop\').remove()">I\u2019ll be on time</button></div>';
 d.onclick=e=>{if(e.target===d)d.remove()};document.body.appendChild(d)}catch(e){}}
{const _vj=vcJoin;vcJoin=async function(){const was=VC.on;const r=await _vj.apply(this,arguments);try{if(!was&&VC.on)lateCheck()}catch(e){}return r}}
/*B1end*/
