/*SNDstart*/
/* Volume mixer. A speaker button in the header (and a Volume button on the Sales Floor) opens one panel: Master, Music,
   Effects & alerts, All voices, and a slider for each teammate on the floor. Levels are kept on this device (owq_snd).
   How it works: media elements keep the volume the portal asks for and play it scaled by the mixer (reading .volume still
   returns what the portal set, so fades keep working); Web Audio sounds go through one gain per audio context; spoken
   alerts get a scaled volume. The slider curve is squared, so 50% sounds about half as loud. */
(function(){
 if(window.SNDX)return;
 var K='owq_snd',CATS={m:1,mu:1,fx:1,vo:1},X=window.SNDX={};
 var S={v:{m:100,mu:100,fx:100,vo:100},x:{},p:{},px:{}};
 function cp(n){n=Math.round(+n);return isFinite(n)?Math.max(0,Math.min(100,n)):100}
 try{var j=JSON.parse(localStorage.getItem(K)||'null');if(j&&typeof j==='object'){
  if(j.v)for(var k in CATS)if(j.v[k]!==undefined)S.v[k]=cp(j.v[k]);
  if(j.x)for(var k2 in CATS)if(j.x[k2])S.x[k2]=1;
  if(j.p&&typeof j.p==='object')Object.keys(j.p).slice(0,80).forEach(function(n){S.p[String(n).slice(0,40)]=cp(j.p[n])});
  if(j.px&&typeof j.px==='object')Object.keys(j.px).slice(0,80).forEach(function(n){if(j.px[n])S.px[String(n).slice(0,40)]=1})}}catch(e){}
 var svT=0;function save(){clearTimeout(svT);svT=setTimeout(function(){try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}},250)}
 function lvl(k){return S.x[k]?0:S.v[k]/100}
 function pp(n){if(!n)return 1;if(S.px[n])return 0;var v=S.p[n];return v===undefined?1:v/100}
 function sq(f){return f*f}
 function cat(el){if(el.__snd)return el.__snd;try{if(typeof LB!=='undefined'&&LB&&LB.au===el)return el.__snd='mu'}catch(e){}return'fx'}
 function mult(el){var k=cat(el),f=lvl('m');if(k==='mu')f*=lvl('mu');else if(k==='vo')f*=lvl('vo')*pp(el.__who||'');else f*=lvl('fx');return sq(f)}
 function fxGain(){return sq(lvl('m')*lvl('fx'))}

 /* ---- media elements (music, voices, test tone) ---- */
 var MP=window.HTMLMediaElement&&HTMLMediaElement.prototype,D0=MP&&Object.getOwnPropertyDescriptor(MP,'volume'),OK=!!(D0&&D0.get&&D0.set);
 function rv(el){return D0.get.call(el)}
 function apply(el){if(!OK||!el)return;try{if(el.__lv===undefined)el.__lv=rv(el);var r=Math.max(0,Math.min(1,el.__lv*mult(el)));if(Math.abs(rv(el)-r)>.0005)D0.set.call(el,r)}catch(e){}}
 if(OK&&D0.configurable)try{Object.defineProperty(MP,'volume',{configurable:true,enumerable:D0.enumerable,
  get:function(){return this.__lv!==undefined?this.__lv:rv(this)},
  set:function(x){var n=+x;if(!(n>=0&&n<=1)){D0.set.call(this,x);return}this.__lv=n;apply(this)}})}catch(e){}
 var EL=[];function track(a){EL.push(a);if(EL.length>12)EL.shift()}
 function kind(src){try{if(typeof src!=='string')return'fx';if(typeof LOBBYSRC!=='undefined'&&src===LOBBYSRC)return'mu';
  if(typeof SONGS!=='undefined'&&SONGS)for(var n in SONGS)if(SONGS[n]===src)return'mu';if(src.indexOf('data:audio/wav')===0)return'vo'}catch(e){}return'fx'}
 var A0=window.Audio;
 if(typeof A0==='function'){var AW=function Audio(src){var a=arguments.length?new A0(src):new A0();try{a.__snd=kind(src);track(a);apply(a)}catch(e){}return a};AW.prototype=A0.prototype;try{window.Audio=AW}catch(e){}}

 /* ---- Web Audio (chimes, the bell, rockets, office sounds): one gain per audio context ---- */
 var GS=[],AN=window.AudioNode,ADN=window.AudioDestinationNode,C0=AN&&AN.prototype&&AN.prototype.connect,X0=AN&&AN.prototype&&AN.prototype.disconnect;
 function gainFor(ctx){try{if(ctx.__sndG)return ctx.__sndG;var g=ctx.createGain();g.gain.value=fxGain();C0.call(g,ctx.destination);ctx.__sndG=g;GS.push(g);return g}catch(e){return null}}
 if(C0&&ADN){AN.prototype.connect=function(d){if(d instanceof ADN&&d.context){var g=gainFor(d.context);if(g&&g!==this){var a=Array.prototype.slice.call(arguments);a[0]=g;C0.apply(this,a);return d}}return C0.apply(this,arguments)};
  if(X0)AN.prototype.disconnect=function(d){if(d instanceof ADN&&d.context&&d.context.__sndG){var a=Array.prototype.slice.call(arguments);a[0]=d.context.__sndG;return X0.apply(this,a)}return X0.apply(this,arguments)}}
 function gains(){var v=fxGain();GS=GS.filter(function(g){try{if(g.context.state==='closed')return false;g.gain.value=v;return true}catch(e){return false}})}

 /* ---- spoken alerts ---- */
 var SSP=window.SpeechSynthesis&&SpeechSynthesis.prototype;
 if(SSP&&SSP.speak){var SP0=SSP.speak;SSP.speak=function(u){try{if(u&&typeof u.volume==='number'){if(u.__v0===undefined)u.__v0=u.volume;u.volume=Math.max(0,Math.min(1,u.__v0*fxGain()))}}catch(e){}return SP0.apply(this,arguments)}}

 /* ---- voices on the floor: each remote stream belongs to a peer, each peer has a name ---- */
 function peerOf(sid){try{var rs=VC.rs||{};for(var p in rs)if(rs[p]&&rs[p][sid])return p}catch(e){}return''}
 function nameOf(peer){try{var a=VC.room?VC.room.peers():[];for(var i=0;i<a.length;i++)if(a[i].peer===peer)return String((a[i].presence&&a[i].presence.nm)||'').slice(0,40)}catch(e){}return''}
 function voices(){try{if(typeof VC!=='object'||!VC||!VC.vid)return;Object.keys(VC.vid).forEach(function(k){if(k.indexOf('local-')===0)return;var v=VC.vid[k];if(!v)return;v.__snd='vo';var p=peerOf(k),n=p?nameOf(p):'';if(n)v.__who=n;apply(v)})}catch(e){}}
 function applyAll(){try{if(typeof LB!=='undefined'&&LB&&LB.au){if(!LB.au.__snd)LB.au.__snd='mu';apply(LB.au)}}catch(e){}EL.forEach(apply);voices();gains()}

 /* ---- the panel ---- */
 var SV='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4V5z"/>';
 var IC={on:SV+'<path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',lo:SV+'<path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>',off:SV+'<path d="M23 9l-6 6M17 9l6 6"/></svg>'};
 function ico(f){return f<=0?IC.off:f<.5?IC.lo:IC.on}
 function E(s){try{return esc(s)}catch(e){return String(s).replace(/[&<>"']/g,function(c){return'&#'+c.charCodeAt(0)+';'})}}
 function avh(n){try{return av(n,22)}catch(e){return''}}
 var P={open:0,from:'',btn:null,drag:0,sig:'',names:[]};
 function row(k,lab,sub){var v=S.v[k],mu=!!S.x[k];return'<div class="sndr'+(mu?' mu':'')+'" data-k="'+k+'"><button type=button class=sndm onclick="SNDX.mute(\''+k+'\')" aria-pressed="'+mu+'" aria-label="'+(mu?'Unmute ':'Mute ')+lab+'" title="'+(mu?'Unmute':'Mute')+'">'+ico(mu?0:v/100)+
  '</button><label class=sndl for="sndi_'+k+'"><b>'+lab+'</b><small>'+sub+'</small></label><output id="sndo_'+k+'">'+(mu?'MUTED':v+'%')+'</output><input type=range id="sndi_'+k+'" min=0 max=100 step=1 value="'+v+'" style="--v:'+v+'%" aria-label="'+lab+' volume" oninput="SNDX.set(\''+k+'\',this.value)"></div>'}
 function prow(n,i,sp){var v=S.p[n]===undefined?100:S.p[n],mu=!!S.px[n],e=E(n);return'<div class="sndr sndpr'+(mu?' mu':'')+(sp?' sp':'')+'" data-i="'+i+'"><button type=button class=sndm onclick="SNDX.pmute('+i+')" aria-pressed="'+mu+'" aria-label="'+(mu?'Unmute ':'Mute ')+e+'" title="'+(mu?'Unmute':'Mute')+'">'+ico(mu?0:v/100)+
  '</button><label class=sndl for="sndq_'+i+'">'+avh(n)+'<b>'+e+'</b><i class=snddot title="Talking"></i></label><output id="sndr_'+i+'">'+(mu?'MUTED':v+'%')+'</output><input type=range id="sndq_'+i+'" min=0 max=100 step=1 value="'+v+'" style="--v:'+v+'%" aria-label="'+e+' volume" oninput="SNDX.pset('+i+',this.value)"></div>'}
 function people(){var out=[],seen={};try{var me=vcMe();vcList().forEach(function(p){if(p.sameTab||p.peer===me)return;var x=p.presence||{},n=String(x.nm||'').slice(0,40);if(!n||seen[n])return;seen[n]=1;out.push({n:n,sp:!!(x.sp&&!x.mu)})})}catch(e){}return out}
 function floorHtml(){var L=people();P.names=L.map(function(x){return x.n});P.sig=P.names.join('|');
  if(!L.length)return'<p class=snde>Nobody else is on the floor right now. When teammates walk on, each one gets a slider here, remembered by name.</p>';
  return L.map(function(x,i){return prow(x.n,i,x.sp)}).join('')}
 function html(){var al=false;try{al=!!D.snd}catch(e){}
  return'<div class=sndh><b>VOLUME</b><button type=button class=sndx onclick="SNDX.close()" aria-label="Close">&times;</button></div>'+
   '<div class=snds><h5>PORTAL</h5>'+row('m','Master','Everything in the portal')+row('mu','Music','Lobby and login songs')+row('fx','Effects &amp; alerts','Chimes, the bell, rockets, spoken alerts')+
   '<label class=sndt><input type=checkbox id=sndal'+(al?' checked':'')+' onchange="SNDX.alerts(this.checked)"> Play a sound for new alerts</label></div>'+
   '<div class=snds><h5>SALES FLOOR</h5>'+row('vo','All voices','Everyone you hear on the floor')+'<div id=sndfl>'+floorHtml()+'</div></div>'+
   '<div class=sndf><small>Saved on this device</small><button type=button class="btn o" onclick="SNDX.reset()">Reset</button></div>'}
 function box(){var e=document.getElementById('sndp');if(!e){e=document.createElement('div');e.id='sndp';e.className='sndp';e.setAttribute('role','dialog');e.setAttribute('aria-label','Volume');e.tabIndex=-1;e.hidden=true;document.body.appendChild(e);
  e.addEventListener('pointerdown',function(ev){if(ev.target&&ev.target.type==='range')P.drag=1})}return e}
 function place(e,b){e.style.left=e.style.top=e.style.bottom=e.style.right=e.style.maxHeight='';var W=innerWidth,H=innerHeight;
  if(W<=560){e.classList.add('sheet');return}e.classList.remove('sheet');
  var r=b&&b.getBoundingClientRect?b.getBoundingClientRect():null,w=e.offsetWidth||340;
  if(!r||(!r.width&&!r.height)){e.style.right='16px';e.style.top='64px';return}
  if(r.top+r.height/2<H/2){e.style.left=Math.round(Math.min(W-w-8,Math.max(8,r.right-w)))+'px';e.style.top=Math.round(r.bottom+8)+'px';e.style.maxHeight=Math.max(240,H-r.bottom-20)+'px'}
  else{e.style.left=Math.round(Math.min(W-w-8,Math.max(8,r.left+r.width/2-w/2)))+'px';e.style.bottom=Math.round(H-r.top+10)+'px';e.style.maxHeight=Math.max(240,r.top-20)+'px'}}
 function open(b,from){from=from||'hdr';if(P.open&&P.from===from){close();return}var e=box();P.open=1;P.from=from;P.btn=b||null;e.innerHTML=html();e.hidden=false;place(e,b);btns();try{e.focus({preventScroll:true})}catch(x){}}
 function close(){var e=document.getElementById('sndp');if(e){e.hidden=true;e.innerHTML=''}var was=P.from;P.open=0;P.from='';P.btn=null;P.drag=0;btns();
  try{var f=document.getElementById(was==='hdr'?'sndb':'');if(f)f.focus()}catch(x){}}
 function upRow(r,v,mu){if(!r)return;var o=r.querySelector('output'),i=r.querySelector('input[type=range]'),m=r.querySelector('.sndm');
  if(o)o.textContent=mu?'MUTED':v+'%';if(i){i.style.setProperty('--v',v+'%');if(+i.value!==v&&document.activeElement!==i)i.value=v}
  if(m){m.innerHTML=ico(mu?0:v/100);m.setAttribute('aria-pressed',String(!!mu))}r.classList.toggle('mu',!!mu)}
 function q(sel){var e=document.getElementById('sndp');return e?e.querySelector(sel):null}
 X.open=open;X.close=close;
 X.set=function(k,val){if(!CATS[k])return;var v=cp(val);S.v[k]=v;if(v>0)S.x[k]=0;upRow(q('.sndr[data-k="'+k+'"]'),v,S.x[k]);applyAll();save();btnsSoon()};
 X.mute=function(k){if(!CATS[k])return;S.x[k]=S.x[k]?0:1;if(!S.x[k]&&S.v[k]===0)S.v[k]=50;var r=q('.sndr[data-k="'+k+'"]'),i=r&&r.querySelector('input');if(i)i.value=S.v[k];upRow(r,S.v[k],S.x[k]);applyAll();save();btns()};
 X.pset=function(i,val){var n=P.names[i];if(!n)return;var v=cp(val);S.p[n]=v;if(v>0)delete S.px[n];upRow(q('.sndpr[data-i="'+i+'"]'),v,!!S.px[n]);voices();save()};
 X.pmute=function(i){var n=P.names[i];if(!n)return;if(S.px[n])delete S.px[n];else S.px[n]=1;var v=S.p[n]===undefined?100:S.p[n];if(!S.px[n]&&v===0)v=S.p[n]=50;
  var r=q('.sndpr[data-i="'+i+'"]'),inp=r&&r.querySelector('input');if(inp)inp.value=v;upRow(r,v,!!S.px[n]);voices();save()};
 X.alerts=function(on){try{if(!!D.snd!==!!on)toggleSnd()}catch(e){}};
 X.reset=function(){S={v:{m:100,mu:100,fx:100,vo:100},x:{},p:{},px:{}};applyAll();save();var e=document.getElementById('sndp');if(e&&P.open)e.innerHTML=html();btns()};
 X.real=function(el){return OK?rv(el):el.volume};X.state=function(){return JSON.parse(JSON.stringify(S))};X.gain=fxGain;X.apply=applyAll;

 /* ---- buttons: header (before the bell) and the Sales Floor (before Devices) ---- */
 function hdrHtml(){var f=lvl('m'),on=P.open&&P.from==='hdr';return'<button type=button class="sndb'+(f<=0?' mu':'')+(on?' on':'')+'" id=sndb onclick="SNDX.open(this,\'hdr\')" aria-label="Volume'+(f<=0?' (muted)':'')+'" aria-haspopup=dialog aria-expanded="'+on+'" title="Volume">'+ico(f)+'</button>'}
 function hdr(){var b=document.getElementById('bell');if(!b)return;var o=document.getElementById('sndb'),h=hdrHtml();if(o){if(o._h!==h){o.outerHTML=h;var n=document.getElementById('sndb');if(n)n._h=h}return}
  b.insertAdjacentHTML('beforebegin',h);var n2=document.getElementById('sndb');if(n2)n2._h=h}
 function floorBtn(kind){var f=lvl('m')*lvl('vo'),on=P.open&&P.from==='floor';
  if(kind==='vob')return'<button class="vob'+(on?' on':'')+'" onclick="SNDX.open(this,\'floor\')" title="Volume" aria-label="Volume">'+ico(f)+'<span>Volume</span></button>';
  return'<button class="btn o" onclick="SNDX.open(this,\'floor\')">Volume</button>'}
 var bT=0;function btnsSoon(){if(bT)return;bT=setTimeout(function(){bT=0;btns()},180)}
 function btns(){try{hdr()}catch(e){}try{if(typeof tab!=='undefined'&&tab==='Team Chat'&&CH.ch==='__voice')vcPaint()}catch(e){}}
 var fT=0;function floorSoon(){if(fT||!P.open)return;fT=setTimeout(function(){fT=0;floorUp()},200)}
 function floorUp(){if(!P.open)return;var b=document.getElementById('sndfl');if(!b)return;var L=people(),sig=L.map(function(x){return x.n}).join('|');
  if(sig!==P.sig){if(P.drag){floorSoon();return}b.innerHTML=floorHtml();return}
  L.forEach(function(x,i){var r=q('.sndpr[data-i="'+i+'"]');if(r)r.classList.toggle('sp',x.sp)})}
 if(typeof hudRender==='function'){var _hr=hudRender;hudRender=function(){var r=_hr.apply(this,arguments);try{hdr();watchHud()}catch(e){}return r}}
 var hudEl=null,mo=null;function watchHud(){var h=document.getElementById('hud');if(!h||h===hudEl||typeof MutationObserver!=='function')return;hudEl=h;
  try{if(mo)mo.disconnect();mo=new MutationObserver(function(){if(!document.getElementById('sndb'))hdr()});mo.observe(h,{childList:true,subtree:true})}catch(e){}}
 if(typeof vcInner==='function'){var _vi=vcInner;vcInner=function(){var h=_vi.apply(this,arguments);if(typeof h!=='string')return h;
  try{h=h.replace(/<button class="(vob(?: on)?|btn o)" onclick="vcToggleDev\(\)"/,function(m,c){return floorBtn(c.indexOf('vob')===0?'vob':'btn')+m})}catch(e){}return h}}
 if(typeof vcPaint==='function'){var _vp=vcPaint;vcPaint=function(){var r=_vp.apply(this,arguments);try{voices();floorSoon()}catch(e){}return r}}
 if(typeof vcAttach==='function'){var _va=vcAttach;vcAttach=function(){var r=_va.apply(this,arguments);try{voices()}catch(e){}return r}}
 document.addEventListener('pointerup',function(){P.drag=0},true);document.addEventListener('pointercancel',function(){P.drag=0},true);
 document.addEventListener('pointerdown',function(ev){if(!P.open)return;var e=document.getElementById('sndp'),t=ev.target;if(e&&e.contains(t))return;if(t&&t.closest&&t.closest('[onclick^="SNDX.open"]'))return;close()},true);
 document.addEventListener('keydown',function(ev){if(P.open&&ev.key==='Escape'){close();try{ev.stopPropagation()}catch(x){}}},true);
 addEventListener('resize',function(){if(!P.open)return;var e=document.getElementById('sndp'),b=P.btn&&P.btn.isConnected?P.btn:(P.from==='hdr'?document.getElementById('sndb'):null);if(e)place(e,b)});
 applyAll();try{hdr();watchHud()}catch(e){}
})();
/*SNDend*/
