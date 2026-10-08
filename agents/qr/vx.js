/*VXstart*/
/* Sales Floor mic + speaker fixes (prefix vx): clear reason when the microphone is refused (browser block vs. embedding
   policy vs. no device), a "Turn on mic" retry while joined listen-only (adds the track to every live call), remote voice that
   was blocked by the browser's autoplay rule starts on the next click/tap/key, a speaker choice the browser refuses falls back
   to the default output, and a small diagnostics record (db collection diag, max 6 per device) so we can see what blocks it. */
(function(){
 if(typeof VC==='undefined'||typeof vcJoin!=='function')return;
 const fp=f=>{try{const p=document.permissionsPolicy||document.featurePolicy;return p&&p.allowsFeature?(p.allowsFeature(f)?1:0):-1}catch(e){return -1}};
 async function perm(n){try{if(!navigator.permissions||!navigator.permissions.query)return'na';const r=await navigator.permissions.query({name:n});return r.state}catch(e){return'na'}}
 function vxWhy(e,st){const n=(e&&e.name)||'error';
  if(n==='NotAllowedError'||n==='SecurityError'){
   if(fp('microphone')===0)return'The microphone is switched off for this embedded view of the portal (the Claude page around it does not pass microphone access through). You can still listen. Try the portal in the Claude desktop app or a normal Chrome window, and tell Cole if it keeps happening.';
   if(st==='denied')return'Your browser is blocking the microphone for this site. Click the camera/microphone icon (or the lock) at the right of the address bar, choose Allow for the microphone, then press Turn on mic.';
   return'The microphone was not allowed. When the browser asks, choose Allow, then press Turn on mic. If no question appears, click the lock icon in the address bar and allow the microphone.'}
  if(n==='NotFoundError'||n==='OverconstrainedError')return'No microphone was found. Plug one in (or pick another in Devices), then press Turn on mic.';
  if(n==='NotReadableError'||n==='AbortError')return'Another app (Zoom, Teams, Discord...) is using the microphone. Close it, then press Turn on mic.';
  return'The microphone is unavailable ('+n+'). Press Turn on mic to try again.'}
 let dn=0;try{dn=+localStorage.getItem('owq_vxd')||0}catch(e){}
 async function diag(ev,e){if(dn>=6)return;dn++;try{localStorage.setItem('owq_vxd',String(dn))}catch(x){}
  try{const c=globalThis.claude;if(!c||!c.use)return;const db=await c.use('db');if(!db)return;
   const o={k:'vc',ev,at:new Date().toISOString(),who:String(WHO||'').slice(0,40),ua:String(navigator.userAgent||'').slice(0,150),top:window.top===window?1:0,
    fp:{mic:fp('microphone'),cam:fp('camera'),scr:fp('display-capture'),spk:fp('speaker-selection'),ap:fp('autoplay')},
    perm:{mic:await perm('microphone'),cam:await perm('camera')},err:e?[String(e.name||''),String(e.message||'').slice(0,160)]:null,
    mic:VC.mic?1:0,md:navigator.mediaDevices?1:0,gum:!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia),sink:!!(window.HTMLMediaElement&&'setSinkId' in HTMLMediaElement.prototype),
    ndev:VC.dev?[VC.dev.mic.length,VC.dev.spk.length,VC.dev.cam.length]:null};
   db.collection('diag').add(o).catch(()=>{})}catch(x){}}
 /* join: keep the original flow, then explain a refusal precisely */
 const _join=vcJoin;
 vcJoin=async function(){let gerr=null;const md=navigator.mediaDevices,own=!!md&&Object.prototype.hasOwnProperty.call(md,'getUserMedia'),prev=md?md.getUserMedia:null,_g=md&&md.getUserMedia?md.getUserMedia.bind(md):null;
  if(_g)try{md.getUserMedia=function(c){return _g(c).catch(e=>{if(c&&c.audio)gerr=e;throw e})}}catch(x){}
  try{await _join.apply(this,arguments)}finally{if(_g)try{if(own)md.getUserMedia=prev;else delete md.getUserMedia}catch(x){}}
  if(VC.on&&!VC.mic){const st=await perm('microphone');VC.err=vxWhy(gerr,st);vcPaint();diag('join-listen-only',gerr)}else if(VC.on)diag('join-ok',null)};
 /* retry the microphone while in the lobby */
 window.vxMic=async function(){if(!VC.on||VC.mic)return;VC.err='';vcPaint();
  try{VC.mic=await vcGum({audio:vcAud()})}catch(e){if(VC.pref.mic){VC.pref.mic='';try{vcPrefSave()}catch(x){}try{VC.mic=await vcGum({audio:vcAud()})}catch(e2){e=e2}}if(!VC.mic){VC.err=vxWhy(e,await perm('microphone'));vcPaint();diag('retry-failed',e);return}}
  VC.muted=0;Object.keys(VC.pcs).forEach(p=>{try{vcAddLocal(VC.pcs[p])}catch(x){}});
  try{await VC.room.presence({mu:0,lo:0})}catch(x){}try{vcMeter()}catch(x){}try{vcDevs(0)}catch(x){}vcPaint();diag('retry-ok',null);toast('Microphone on',1)};
 const _mute=vcMute;
 vcMute=function(){if(VC.on&&!VC.mic)return vxMic();return _mute.apply(this,arguments)};
 const _inner=vcInner;
 vcInner=function(){let h=_inner.apply(this,arguments);if(VC.on&&!VC.mic)h=h.replace(/<button class="btn( o)?" onclick="vcMute\(\)" disabled>[^<]*<\/button>/,'<button class="btn vx-mic" onclick="vxMic()" title="Ask the browser for the microphone again">&#127908; Turn on mic</button>');
  if(VX.pend.size)h='<div class=vx-snd role=status><button class=btn onclick="vxPlay()">&#128264; Click to hear the floor</button><small>Your browser paused the voices until you click once.</small></div>'+h;return h};
 /* remote voices: start after the first gesture if the browser blocked autoplay */
 const VX=window.VX={pend:new Set()};
 window.vxPlay=function(){const L=Array.from(VX.pend);VX.pend.clear();L.forEach(v=>{try{const p=v.play();if(p&&p.catch)p.catch(()=>{VX.pend.add(v)})}catch(e){}});try{if(VC.ctx&&VC.ctx.state==='suspended')VC.ctx.resume()}catch(e){}setTimeout(()=>{try{vcPaint()}catch(e){}},120)};
 ['pointerdown','keydown','touchend'].forEach(t=>addEventListener(t,()=>{if(VX.pend.size)vxPlay()},{capture:true,passive:true}));
 const _att=vcAttach;
 vcAttach=function(peer,st){const r=_att.apply(this,arguments);try{const v=VC.vid[st.id];if(v){
   if(VC.pref.spk&&v.setSinkId)v.setSinkId(VC.pref.spk).catch(()=>{try{v.setSinkId('').catch(()=>{})}catch(e){};if(!VX.sw){VX.sw=1;toast('Your browser would not switch speakers here, so voices play on the default output.')}});
   setTimeout(()=>{try{if(v.paused&&v.srcObject){const p=v.play();if(p&&p.catch)p.catch(()=>{VX.pend.add(v);vcPaint()})}}catch(e){}},400)}}catch(e){}return r};
})();
/*VXend*/
