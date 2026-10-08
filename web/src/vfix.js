/*VFIXstart*/
/* Sales Floor call setup that does not depend on computer clocks (website version).
   The original only lets the person who walks on last dial the others, and "last" was judged by each computer's own clock,
   so one computer with a wrong clock got no calls at all. Now: for anyone on the floor we are not connected to, the side
   with the lower peer id dials after 1.2 s and the other side after 5 s (covers people still on an older version); a call
   that fails or stalls is replaced and dialled again with back-off; an offer that arrives for a dead connection gets a
   fresh one; a few diagnostics (clock offset, redials) go to the diag collection; a clock that is far off gets a heads-up. */
(function(){
 if(typeof VC!=='object'||!VC||typeof vcCall!=='function'||typeof vcPc!=='function'||typeof vcSig!=='function'||typeof vcDrop!=='function'||typeof vcJoin!=='function')return;
 var T={},N={},STALL=15000,DISC=8000,MAXN=8,dn=0,late=VC.room?1:0;
 function now(){return Date.now()}
 function mine(){try{return vcMe()||''}catch(e){return''}}
 function list(){try{return VC.room?VC.room.peers():[]}catch(e){return[]}}
 function onFloor(id){var a=list();for(var i=0;i<a.length;i++){var p=a[i];if(p.peer===id)return !p.sameTab&&!!(p.presence&&p.presence.vc)}return false}
 function healthy(pc){var s=pc.connectionState;if(s==='connected')return true;if(s==='failed'||s==='closed')return false;
  return now()-(pc.__vs||pc.__v0||now())<(s==='disconnected'?DISC:STALL)}
 function clockOff(){try{return typeof OWQC==='object'&&OWQC&&typeof OWQC.off==='number'?OWQC.off:0}catch(e){return 0}}
 function diag(o){if(dn>=6)return;dn++;try{var c=globalThis.claude;if(!c||!c.use)return;
  c.use('db').then(function(db){if(!db)return;o.k='vcx';o.at=new Date().toISOString();o.who=String((typeof WHO!=='undefined'&&WHO)||'').slice(0,40);
   o.off=clockOff();o.ua=String(navigator.userAgent||'').slice(0,120);return db.collection('diag').add(o)}).catch(function(){})}catch(e){}}
 function plan(id,ms){if(T[id])return;T[id]=setTimeout(function(){delete T[id];tick(id)},ms)}
 function tick(id){if(!VC.on||!VC.room||!onFloor(id))return;var pc=VC.pcs[id];
  if(pc&&healthy(pc)){if(pc.connectionState!=='connected')plan(id,3000);return}
  var n=N[id]=(N[id]||0)+1;if(n>MAXN)return;
  if(pc){diag({ev:'redial',n:n,cs:pc.connectionState,ss:pc.signalingState,is:pc.iceConnectionState,age:now()-(pc.__v0||now())});try{vcDrop(id)}catch(e){}}
  try{vcCall(id)}catch(e){}
  plan(id,STALL+1000+Math.min(n,6)*4000)}
 function consider(id){if(T[id]||!VC.on||!onFloor(id))return;var pc=VC.pcs[id];if(pc&&healthy(pc))return;plan(id,mine()<id?1200:5000)}
 function sweep(){if(!VC.on||!VC.room)return;list().forEach(function(p){if(!p.sameTab&&p.presence&&p.presence.vc)consider(p.peer)})}
 /* stamp every connection with its start time and the time of its last state change */
 var _pc=vcPc;vcPc=function(peer){var had=VC.pcs[peer],pc=_pc.apply(this,arguments);
  if(pc&&!had&&!pc.__v0){pc.__v0=now();try{pc.addEventListener('connectionstatechange',function(){pc.__vs=now();var s=pc.connectionState;
   if(s==='connected')N[peer]=0;else if(s==='failed'||s==='disconnected')setTimeout(function(){consider(peer)},s==='failed'?300:DISC+500)})}catch(e){}}
  return pc};
 /* an offer for a dead or stalled connection starts a fresh one instead of renegotiating the dead one */
 var _sig=vcSig;vcSig=function(m){try{var d=m&&m.data;if(VC.on&&d&&d.k==='d'&&d.t==='offer'&&d.to===mine()&&!m.isMe){var pc=VC.pcs[m.peer];if(pc&&!healthy(pc))vcDrop(m.peer)}}catch(e){}
  return _sig.apply(this,arguments)};
 /* a browser that hands out no network routes at all (a VPN or privacy extension's "WebRTC leak protection", or a policy that
    disables non-proxied UDP) can never connect a call: probe once per join and say so plainly instead of failing silently */
 function iceProbe(){return new Promise(function(res){var pc=null,n=0,done=0,t=0;function fin(){if(done)return;done=1;clearTimeout(t);try{if(pc)pc.close()}catch(e){}res(n)}
  try{var cf=(typeof VCFG==='object'&&VCFG&&VCFG.iceServers&&VCFG.iceServers.length)?{iceServers:VCFG.iceServers}:{iceServers:[{urls:'stun:stun.l.google.com:19302'}]};pc=new RTCPeerConnection(cf);pc.createDataChannel('probe');
   pc.onicecandidate=function(e){if(e.candidate&&e.candidate.candidate){n++;fin()}};
   pc.createOffer().then(function(o){return pc.setLocalDescription(o)}).catch(function(){n=-1;fin()});t=setTimeout(fin,6000)}catch(e){n=-1;fin()}})}
 var ICEMSG='Voice cannot connect from this browser: it is blocking call connections (WebRTC). This is usually a VPN or privacy extension with "WebRTC leak protection" turned on. Turn that setting off or pause the extension, then reload and rejoin, or use another browser.';
 function probeJoin(){iceProbe().then(function(n){VC.iceN=n;if(n!==0||!VC.on)return;VC.err=ICEMSG;try{vcPaint()}catch(e){}try{toast('Voice is blocked in this browser (WebRTC). Open the Sales Floor for the fix.')}catch(e){}diag({ev:'noice'})})}
 /* joining: the original dials the people it thinks came earlier; the sweep covers everyone else */
 var _join=vcJoin;vcJoin=function(){var r=_join.apply(this,arguments);
  Promise.resolve(r).then(function(){if(!VC.on)return;N={};setTimeout(sweep,300);probeJoin();var off=clockOff();
   diag({ev:'join',n:list().filter(function(p){return !p.sameTab&&p.presence&&p.presence.vc}).length,pre:Object.keys(VC.pcs).length,late:late});
   if(Math.abs(off)>90000&&!VC.__skewTold){VC.__skewTold=1;var mn=Math.max(1,Math.round(Math.abs(off)/60000));
    try{toast('Heads up: this computer\'s clock is about '+mn+' minute'+(mn===1?'':'s')+' '+(off>0?'behind':'ahead')+'. Turn on automatic date and time in your computer settings so chat and check-in times are right.')}catch(e){}}}).catch(function(){});
  return r};
 var hooked=0;function hook(){if(hooked||!VC.room)return;hooked=1;try{VC.room.onPeers(function(){sweep()})}catch(e){}}
 setInterval(function(){hook();sweep()},4000);
 var w=setInterval(function(){if(VC.room){hook();clearInterval(w)}},500);
})();
/*VFIXend*/
