/*SFWstart*/
/* Sales Floor pop-out (website version). "Pop out" opens the floor in its own browser window (a second monitor, or beside
   other work). That window is the portal in floor mode (?floor=1&fid=<id>): no intro, signed in as the same operator (handed
   over by the window that opened it), showing only the floor. Only one window is on the floor at a time: the portal window
   steps off the moment the floor window steps on, and shows "The Sales Floor is in its own window" with Show / Bring it back.
   The windows talk over a BroadcastChannel ('owq_floor'): hand-over, heartbeats (so neither window signs out for inactivity
   while the other one is in use), bring back, lock. Messages: from 'main' or 'pop', k = who/hand/hello/beat/mbeat/take/free/
   bye/back/lock/focus/nav/gone, id = the floor window's id. */
(function(){
 if(typeof VC!=='object'||!VC||typeof vcJoin!=='function'||typeof voicePanel!=='function'||typeof vcInner!=='function')return;
 var FL=!!window.OWQ_FLOOR,BC=null,GEO='owq_flgeo';
 try{BC=new BroadcastChannel('owq_floor')}catch(e){BC=null}
 var S=window.SFW={fl:FL,out:0,id:'',w:null,on:0,n:0,seen:0,hand:null,moving:0};
 function post(o){try{if(BC)BC.postMessage(o)}catch(e){}}
 S.tr=[];function tr(x){try{S.tr.push((Date.now()%1e6)+' '+x);if(S.tr.length>40)S.tr.shift()}catch(e){}}
 function rid(){return Math.random().toString(36).slice(2,10)}
 function me(){try{return String(WHO||'')}catch(e){return''}}
 function online(){try{return !!ONLINE}catch(e){return false}}
 function say(t,ok){try{toast(t,ok)}catch(e){}}
 function floorShown(){try{return tab==='Team Chat'&&CH.ch==='__voice'}catch(e){return false}}
 function count(){try{return vcList().length}catch(e){return 0}}
 function lastAct(){try{return LASTACT}catch(e){return 0}}
 function act(t){try{if(typeof t==='number'&&t>LASTACT)LASTACT=Math.min(Date.now(),t)}catch(e){}}
 function leave(){return Promise.resolve().then(function(){return VC.on?vcLeave():0}).catch(function(){})}
 var ICO={pop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M15 4v16M7 12h5M10 9l3 3-3 3"/></svg>'};
 /* after walking on in a new window: put mute and camera back the way they were */
 function restore(o){if(!o)return;var t0=Date.now();(function w(){if(!VC.on){if(Date.now()-t0<20000)setTimeout(w,400);return}
  try{if(o.mu&&VC.mic&&!VC.muted)vcMute()}catch(e){}try{if(o.cam&&!VC.cam)vcCam()}catch(e){}})()}
 function joinNow(o){return Promise.resolve().then(function(){return vcJoin()}).then(function(){restore(o)}).catch(function(){})}

 /* ======================= the portal window ======================= */
 function phone(){try{var w=typeof IW==='function'?IW():innerWidth;if(w<=760)return true;
  return !!(window.matchMedia&&matchMedia('(pointer:coarse)').matches&&!matchMedia('(any-pointer:fine)').matches)}catch(e){return false}}
 function canPop(){return !FL&&!!BC&&!phone()}
 function feats(){var w=1180,h=760,x=null,y=null;
  try{var g=JSON.parse(localStorage.getItem(GEO)||'null');if(g&&g.w>=420&&g.h>=320){w=g.w;h=g.h;if(typeof g.x==='number'&&typeof g.y==='number'){x=g.x;y=g.y}}}catch(e){}
  var aw=(window.screen&&screen.availWidth)||1280,ah=(window.screen&&screen.availHeight)||800;w=Math.max(420,Math.min(w,aw-20));h=Math.max(320,Math.min(h,ah-60));
  if(x===null){x=Math.max(0,Math.round((window.screenX||0)+((window.outerWidth||aw)-w)/2));y=Math.max(0,Math.round((window.screenY||0)+((window.outerHeight||ah)-h)/2))}
  return'popup=yes,width='+w+',height='+h+',left='+x+',top='+y}
 function repaint(){try{if(online()&&floorShown()){try{if(S.out&&typeof VO3!=='undefined'&&VO3.unmount)VO3.unmount()}catch(e){}go()}}catch(e){}
  try{if(typeof qvPeers==='function')qvPeers()}catch(e){}}
 S.pop=function(){if(FL)return;if(!canPop()){say('Pop-out works in a computer browser.');return}
  if(S.out){S.show();return}
  var id=rid(),w=null;try{w=window.open(location.pathname+'?floor=1&fid='+id,'owqfloor',feats())}catch(e){w=null}
  if(!w){say('Your browser blocked the pop-out window. Allow pop-ups for this site, then press Pop out again.');return}
  S.w=w;S.id=id;S.out=1;S.on=0;S.n=0;S.seen=Date.now();S.moving=VC.on?1:0;
  S.hand={who:me(),join:VC.on?1:0,cam:VC.on&&VC.cam?1:0,mu:VC.on&&VC.muted?1:0,scr:VC.on&&VC.scr?1:0};
  repaint();watch()};
 S.show=function(){var ok=false;try{if(S.w&&!S.w.closed){S.w.focus();ok=true}}catch(e){}post({from:'main',k:'focus',id:S.id});
  if(!ok)say('The floor window is open on its own. Look for it on your taskbar.',1)};
 S.back=function(){if(!S.out)return;var id=S.id;post({from:'main',k:'back',id:id});
  setTimeout(function(){if(S.out&&S.id===id){var on=S.on;try{if(S.w)S.w.close()}catch(e){}gone('back',{join:on?1:0})}},3000)};
 function gone(why,m){var was=S.on;S.out=0;S.w=null;S.on=0;S.n=0;S.moving=0;S.id='';S.hand=null;repaint();
  if(why==='back'){if(m&&m.join&&!VC.on)joinNow(m);return}
  if(why==='lock')return;
  say(was?'The Sales Floor window was closed, so you are off the floor.':'The Sales Floor window was closed.',!was)}
 var wT=0;function watch(){if(wT)return;wT=setInterval(function(){
  if(!S.out){clearInterval(wT);wT=0;return}
  var closed=false;try{closed=!!(S.w&&S.w.closed)}catch(e){}
  if(closed){gone('closed');return}
  if(!S.w&&Date.now()-S.seen>15000){gone('lost');return}
  if(Date.now()-(S.mb||0)>8000){S.mb=Date.now();post({from:'main',k:'mbeat',id:S.id,who:me(),act:lastAct(),on:VC.on?1:0})}},1000)}
 function mainMsg(m){if(m.from!=='pop')return;
  if(m.k==='who'){if(m.id&&m.id===S.id&&S.out&&online())post({from:'main',k:'hand',id:m.id,who:(S.hand&&S.hand.who)||me(),join:S.hand?S.hand.join:0,cam:S.hand?S.hand.cam:0,mu:S.hand?S.hand.mu:0,scr:S.hand?S.hand.scr:0});return}
  if(!online()||!m.who||m.who!==me())return;
  if(m.k==='hello'||m.k==='beat'){
   if(!S.out){S.out=1;S.id=m.id;S.w=null;S.hand=null;S.moving=0;S.seen=Date.now();watch();repaint()}
   if(m.id!==S.id)return;
   S.seen=Date.now();var on=m.on?1:0,n=m.n|0,ch=S.on!==on||S.n!==n;S.on=on;S.n=n;if(on&&S.moving){S.moving=0;ch=true}
   act(on?Date.now():m.act);if(ch)repaint();return}
  if(m.id!==S.id)return;
  if(m.k==='take'){leave().then(function(){S.moving=0;post({from:'main',k:'free',id:S.id});repaint()});return}
  if(m.k==='bye'){if(m.back){gone('back',m);return}var id=S.id;
   setTimeout(function(){if(!S.out||S.id!==id)return;var open=false;try{open=!!(S.w&&!S.w.closed)}catch(e){}if(open){S.on=0;repaint();return}gone('closed')},700);return}
  if(m.k==='stay'){S.moving=0;repaint();return}
  if(m.k==='nav'){try{openTab(String(m.tab||''),m.sub||undefined)}catch(e){}try{window.focus()}catch(e){}return}}
 function phHtml(){var on=S.on,n=S.n,here=!!VC.on&&!on,mv=S.moving&&here;
  var sub=on?'You are on the floor in that window'+(n>1?' with '+(n-1)+' teammate'+(n===2?'':'s'):'')+'. Voice keeps going while you work here.':
   mv?'Opening the floor window. You stay on the floor here until it is ready.':
   here?'You are still on the floor in this window. Walk on in the floor window to move there, or bring the floor back here.':'Walk onto the floor from that window. Keep working here as usual.';
  return'<div class="c chm sfw-ph" role=region aria-label="Sales Floor"><div class=sfw-pi>'+ICO.pop+'</div>'+(on?'<span class=sfw-live><i></i>LIVE IN THE FLOOR WINDOW</span>':'')+
   '<b>'+(mv?'MOVING THE FLOOR TO ITS OWN WINDOW':'THE SALES FLOOR IS IN ITS OWN WINDOW')+'</b><small>'+sub+'</small><div class=sfw-pa>'+
   (S.w?'<button class=btn onclick="SFW.show()">Show the floor window</button>':'')+'<button class="btn o" onclick="SFW.back()">Bring it back here</button></div></div>'}
 function popBtn(kind){var lb='Pop out to its own window';
  if(kind==='vob')return'<button class="vob sfw-b" onclick="SFW.pop()" title="'+lb+'" aria-label="'+lb+'">'+ICO.pop+'<span>Pop out</span></button>';
  return'<button class="btn o sfw-b" onclick="SFW.pop()" title="'+lb+'">Pop out</button>'}

 if(!FL){
  var _vp=voicePanel;voicePanel=function(){if(S.out)return phHtml();return _vp.apply(this,arguments)};
  var _vi=vcInner;vcInner=function(){var h=_vi.apply(this,arguments);if(!canPop()||typeof h!=='string')return h;
   try{h=h.replace(/(<button class="(vob(?: on)?|btn o)" onclick="vcToggleDev\(\)"[^>]*>[\s\S]*?<\/button>)/,function(m0,b,c){return b+popBtn(c.indexOf('vob')===0?'vob':'btn')})}catch(e){}return h};
  var _jn=vcJoin;vcJoin=function(){if(S.out){S.show();say('The Sales Floor is open in its own window. Use that window, or bring it back here.');return Promise.resolve()}return _jn.apply(this,arguments)};
  var _lk=lockView;lockView=function(){if(S.out){post({from:'main',k:'lock',id:S.id});try{if(S.w)S.w.close()}catch(e){}gone('lock')}return _lk.apply(this,arguments)};
  if(typeof pushAlert==='function'){var _pa=pushAlert;pushAlert=function(a){try{if(a&&typeof a.k==='string'&&a.k.indexOf('vj-')===0&&me()&&typeof a.t==='string'&&a.t.indexOf(me()+' walked')===0)return null}catch(e){}return _pa.apply(this,arguments)}}
  addEventListener('pagehide',function(){if(S.out)post({from:'main',k:'gone',id:S.id})});
 }

 /* ======================= the floor window ======================= */
 if(FL){
  var FID=((location.search.match(/[?&]fid=([a-z0-9]{4,20})/)||[])[1])||'';S.id=FID;S.mseen=0;
  try{document.title='Sales Floor | Only Winners & Quitters'}catch(e){}
  try{LB.off=1;if(LB.au)LB.au.pause()}catch(e){}
  var ov=document.createElement('div');ov.id='sfwov';ov.setAttribute('role','status');document.body.appendChild(ov);
  var ovShow=function(t,s,btns,spin){ov.innerHTML=(spin?'<div class=sfwsp aria-hidden=true></div>':'')+'<b>'+t+'</b>'+(s?'<small>'+s+'</small>':'')+(btns?'<div class=sfwob>'+btns+'</div>':'');ov.hidden=false};
  ovShow('OPENING THE SALES FLOOR','Connecting this window to your portal...','',1);
  var H=null,tries=0,lastOn=-1;
  var fromOpener=function(){try{var o=window.opener;if(o&&o.SFW&&o.SFW.id===FID&&o.SFW.out){var h=o.SFW.hand||{};var who=String(h.who||'');if(!who&&o.SFW.me)who=o.SFW.me();if(who)return{who:who,join:h.join?1:0,cam:h.cam?1:0,mu:h.mu?1:0,scr:h.scr?1:0}}}catch(e){}return null};
  var noHand=function(){ovShow('OPEN THE FLOOR FROM THE PORTAL','This window could not find the portal window that opened it. Close it, then press Pop out on the Sales Floor again.',
   '<button class=btn onclick="location.href=location.pathname">Open the full portal here</button><button class="btn o" onclick="window.close()">Close</button>')};
  var bar=function(){if(document.getElementById('sfwbar'))return;var b=document.createElement('div');b.id='sfwbar';b.className='sfwbar';
   b.innerHTML='<div class=sfwt><i class=sfwd id=sfwd></i><b>SALES FLOOR</b><small id=sfwn></small></div><div class=sfwa><button type=button class="btn o" onclick="SFW.home()" title="Close this window and bring the floor back into the portal">'+ICO.back+'<span>Back to the portal</span></button></div>';
   document.body.appendChild(b);barUp()};
  var barUp=function(){var n=document.getElementById('sfwn'),d=document.getElementById('sfwd');if(!n)return;var c=count(),t=(VC.on?'ON THE FLOOR':'NOT ON THE FLOOR')+' \u00b7 '+c+' HERE';
   if(n.textContent!==t)n.textContent=t;if(d)d.className='sfwd'+(VC.on?' on':'')};
  var beat=function(){if(!online()||S.leaving)return;var on=VC.on?1:0;S.n=count();
   post({from:'pop',k:lastOn<0?'hello':'beat',id:FID,who:me(),on:on,n:S.n,act:lastAct()});lastOn=on;
   try{if(on)sessionStorage.setItem('owq_flon','1');else sessionStorage.removeItem('owq_flon')}catch(e){}barUp()};
  var waitRoom=function(){var t0=Date.now();return new Promise(function(res){(function w(){if(VC.room)return res(true);
   if(Date.now()-t0>20000){say('Voice is not connected yet. Try again in a moment.');return res(false)}setTimeout(w,300)})()})};
  /* the microphone first: the portal window only steps off once this window can really talk (a permission prompt that
     nobody answers, or a blocked microphone, must not leave you off the floor in both windows) */
  var PRE=null,live=function(st){try{return !!st&&st.getAudioTracks().some(function(t){return t.readyState==='live'})}catch(e){return false}},
   drop=function(){if(PRE){try{PRE.getTracks().forEach(function(t){t.stop()})}catch(e){}}PRE=null};
  var micFirst=function(){if(live(PRE))return Promise.resolve(true);drop();
   return new Promise(function(res){var done=0,t1=0,t2=0,fin=function(v){if(done)return;done=1;clearTimeout(t1);clearTimeout(t2);res(v)};
   var stay=function(t){if(S.mainOn){say(t);post({from:'pop',k:'stay',id:FID,who:me()});fin(false)}else fin(true)};
   t1=setTimeout(function(){if(!done)say('Allow the microphone in this window to walk on here.',1)},2500);
   t2=setTimeout(function(){if(!done)stay('The microphone did not answer in this window, so you stay on the floor in the portal window. Press Walk onto the floor here to try again.')},45000);
   try{navigator.mediaDevices.getUserMedia({audio:vcAud()}).then(function(st){if(done||S.leaving){try{st.getTracks().forEach(function(t){t.stop()})}catch(e){}return}PRE=st;fin(true)},function(e){var n=(e&&e.name)||'';
    stay(n==='NotAllowedError'||n==='SecurityError'?'The microphone is blocked in this window, so you stay on the floor in the portal window. Allow it for this site, then press Walk onto the floor here.':
     'This window could not open the microphone, so you stay on the floor in the portal window. Press Walk onto the floor here to try again.')})}catch(e){fin(true)}})};
  /* the microphone opened above is handed to the walk-on (one request, no second prompt) */
  var handPre=function(){var md=navigator.mediaDevices;if(!live(PRE)||!md)return function(){};var own=Object.prototype.hasOwnProperty.call(md,'getUserMedia'),prev=md.getUserMedia,used=0;
   md.getUserMedia=function(c){if(!used&&live(PRE)&&c&&c.audio&&!c.video){used=1;var st=PRE;PRE=null;tr('pre used');return Promise.resolve(st)}tr('gum pass');return prev.apply(md,arguments)};
   return function(){try{if(own)md.getUserMedia=prev;else delete md.getUserMedia}catch(e){}if(!used)drop()}};
  var askFree=function(){return new Promise(function(res){var done=0,fin=function(){if(done)return;done=1;S.free=null;res(true)};S.free=fin;
   post({from:'pop',k:'take',id:FID,who:me()});setTimeout(fin,2500)})};
  var _vjf=vcJoin,joining=null;
  vcJoin=function(){if(VC.on)return Promise.resolve();if(joining)return joining;var self=this,args=arguments;
   tr('join');joining=waitRoom().then(function(ok){tr('room '+ok);return ok&&micFirst()}).then(function(ok){tr('mic '+ok);return ok&&askFree()}).then(function(ok){tr('free '+ok);if(!ok||VC.on||S.leaving){drop();return}
    var undo=handPre();tr('walk');return Promise.resolve().then(function(){return _vjf.apply(self,args)}).then(function(r){undo();tr('walked '+(VC.on?1:0));return r},function(e){undo();tr('walk err '+(e&&e.name||e));throw e})})
    .then(function(){joining=null},function(e){tr('join err '+(e&&e.message||e));joining=null});return joining};
  var take=function(h){joinNow(h)};
  var enter=function(h){if(S.entered)return;var who=String(h&&h.who||'').slice(0,60);if(!who){noHand();return}S.entered=1;S.mseen=Date.now();S.mainOn=h.join?1:0;
   try{WHO=who;LG=who}catch(e){}
   try{var l=document.getElementById('login');if(l){l.className='';l.innerHTML=''}}catch(e){}
   try{var we=document.getElementById('who');if(we)we.innerHTML='<span class=whr>'+av(who,30)+'<span>OPERATOR<br>'+esc(who.toUpperCase())+'</span></span>'}catch(e){}
   try{if(typeof GXU!=='undefined'&&GXU.U)GXU.U.st='off'}catch(e){}
   try{RAIL=false}catch(e){}
   try{tab='Team Chat';CH.ch='__voice'}catch(e){}
   try{ONLINE=1;LASTACT=Date.now()}catch(e){}
   try{chInit()}catch(e){}
   var again=false;try{again=sessionStorage.getItem('owq_flon')==='1'}catch(e){}
   var show=function(){try{go()}catch(e){}bar();ov.hidden=true;ov.innerHTML='';beat();setInterval(beat,5000);
    if(h.scr)setTimeout(function(){say('Screen sharing stops when the floor moves to a new window. Share again from here.')},2500)};
   if(!(h.join||again)){show();return}
   /* walking on: open the microphone before the floor (and its 3D office) loads, so any browser prompt comes first */
   ovShow('GETTING YOUR MICROPHONE READY','If your browser asks, allow the microphone for this window.','',1);
   waitRoom().then(function(ok){return ok&&micFirst()}).then(function(ok){show();if(ok)take(h)})};
  var boot=function(){if(!(typeof OWQC==='object'&&OWQC&&OWQC.phase==='in')){setTimeout(boot,300);return}
   var h=fromOpener();if(h){enter(h);return}
   if(!BC){noHand();return}
   S.handWait=function(m){if(H)return;H=m;enter(m)};
   (function ask(){if(H||S.entered)return;tries++;post({from:'pop',k:'who',id:FID});if(tries<30)setTimeout(ask,700);else noHand()})()};
  S.home=function(fromMain){if(S.leaving)return;var alive=fromMain||Date.now()-(S.mseen||0)<20000;S.leaving=1;
   try{sessionStorage.removeItem('owq_flon')}catch(e){}
   if(!alive){leave().then(function(){location.href=location.pathname});return}
   var o={from:'pop',k:'bye',id:FID,who:me(),back:1,join:VC.on?1:0,cam:VC.on&&VC.cam?1:0,mu:VC.on&&VC.muted?1:0};
   leave().then(function(){post(o);try{if(!fromMain&&window.opener)window.opener.focus()}catch(e){}setTimeout(function(){try{window.close()}catch(e){}},200)})};
  var shut=function(){S.leaving=1;try{sessionStorage.removeItem('owq_flon')}catch(e){}
   leave().then(function(){post({from:'pop',k:'bye',id:FID,who:me(),join:0,locked:1});try{window.close()}catch(e){}
    ovShow('FLOOR WINDOW CLOSED','The portal was locked, so this window stepped off the floor. You can close it.','<button class="btn o" onclick="window.close()">Close</button>')})};
  S.flMsg=function(m){if(m.from!=='main'||!FID||m.id!==FID)return;
   if(m.k==='hand'){if(S.handWait)S.handWait(m);return}
   if(m.k==='free'){S.mainOn=0;if(S.free)S.free();return}
   if(m.k==='mbeat'){S.mseen=Date.now();S.mainOn=m.on?1:0;act(m.act);return}
   if(m.k==='back'){S.home(1);return}
   if(m.k==='lock'){shut();return}
   if(m.k==='focus'){try{window.focus()}catch(e){}return}
   if(m.k==='gone'){S.mseen=0;return}};
  /* the floor window never shows the intro: an inactivity sign-out ends it instead */
  lockView=function(){var was=VC.on;S.leaving=1;try{sessionStorage.removeItem('owq_flon')}catch(e){}leave();try{ONLINE=0}catch(e){}
   post({from:'pop',k:'bye',id:FID,who:me(),join:0});
   ovShow('SIGNED OUT','This floor window was signed out after an hour without activity'+(was?' and left the floor':'')+'. Close it, then pop the floor out again from the portal.','<button class="btn o" onclick="window.close()">Close</button>')};
  /* everything stays on the floor here; any other page opens in the portal window */
  var _go=go;go=function(){try{if(online()&&!(tab==='Team Chat'&&CH.ch==='__voice')){var t=tab,s=(typeof SUB!=='undefined'&&SUB[t])||'';tab='Team Chat';CH.ch='__voice';
   if(t&&t!=='Team Chat')post({from:'pop',k:'nav',id:FID,who:me(),tab:t,sub:s})}}catch(e){}return _go.apply(this,arguments)};
  if(typeof pushAlert==='function'){var _pa2=pushAlert;pushAlert=function(a){return _pa2.call(this,a,true)}};
  if(typeof voFit==='function'){var _vf=voFit;voFit=function(){var r=_vf.apply(this,arguments);try{var e=document.getElementById('vofm');if(e&&!VOX.exp){var t=e.getBoundingClientRect().top;e.style.height=Math.max(280,Math.round(innerHeight-Math.max(0,t)-8))+'px'}}catch(x){}return r}}
  var _vpt=vcPaint;vcPaint=function(){var r=_vpt.apply(this,arguments);try{if((VC.on?1:0)!==lastOn||count()!==S.n)beat();else barUp()}catch(e){}return r};
  addEventListener('pagehide',function(){try{localStorage.setItem(GEO,JSON.stringify({w:innerWidth,h:innerHeight,x:window.screenX,y:window.screenY}))}catch(e){}
   if(!S.leaving&&S.entered)post({from:'pop',k:'bye',id:FID,who:me(),join:0})});
  if(!FID)noHand();else boot();
 }
 S.me=me;
 if(BC)BC.onmessage=function(e){var m=e&&e.data;if(!m||typeof m!=='object')return;if(FL){if(S.flMsg)S.flMsg(m)}else mainMsg(m)};
})();
/*SFWend*/
