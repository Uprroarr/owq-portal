/* ---------------- install as an app (website only) ----------------
   The portal installs like software on Windows, Mac, Chromebook, Android and iPhone: its own window, desktop / Start menu /
   Dock icon, opens straight to the station. Chrome and Edge give a one-click install (beforeinstallprompt); Safari and
   others get the two-step instructions. A small offline-capable service worker (sw.js) keeps the last version on hand. */
(function(){var W=window,D=document;
 function standalone(){try{return W.matchMedia('(display-mode: standalone)').matches||W.matchMedia('(display-mode: window-controls-overlay)').matches||W.navigator.standalone===true}catch(e){return false}}
 if('serviceWorker' in navigator&&location.protocol==='https:'){W.addEventListener('load',function(){try{navigator.serviceWorker.register('sw.js').catch(function(){})}catch(e){}})}
 if(standalone()){D.documentElement.classList.add('owqapp');return}
 if(W.OWQ_GUEST||/[?&]guest=/.test(location.search)||W.OWQ_FLOOR)return;
 W.addEventListener('beforeinstallprompt',function(e){e.preventDefault();W.OWQ_BIP=e;show()});
 W.addEventListener('appinstalled',function(){W.OWQ_BIP=null;hide();try{if(typeof toast==='function')toast('OWQ Station installed. Open it from your desktop, Start menu or Dock.',1)}catch(e){}});
 function os(){var u=navigator.userAgent||'',p=(navigator.userAgentData&&navigator.userAgentData.platform)||navigator.platform||'';
  var ios=/iPhone|iPad|iPod/.test(u)||(p==='MacIntel'&&navigator.maxTouchPoints>1),mac=!ios&&/Mac/.test(p+u),win=/Win/.test(p+u),and=/Android/.test(u),cros=/CrOS/.test(u);
  var edge=/Edg\//.test(u),chrome=!edge&&/Chrome\//.test(u)&&!/OPR\//.test(u),safari=/Safari\//.test(u)&&!/Chrome\/|CriOS|Edg|FxiOS|Firefox/.test(u),ff=/Firefox|FxiOS/.test(u);
  return{ios:ios,mac:mac,win:win,and:and,cros:cros,edge:edge,chrome:chrome,safari:safari,ff:ff}}
 function steps(){var o=os();
  if(o.ios)return o.safari?['Tap the <b>Share</b> button (the square with the arrow) at the bottom of Safari.','Scroll down and tap <b>Add to Home Screen</b>, then <b>Add</b>.','Open <b>OWQ Station</b> from your home screen.']:['Open this page in <b>Safari</b> (iPhone apps can only be installed from Safari).','Tap <b>Share</b>, then <b>Add to Home Screen</b>.'];
  if(o.safari&&o.mac)return['In the Safari menu bar choose <b>File</b> then <b>Add to Dock</b>.','Click <b>Add</b>. OWQ Station opens from the Dock and Launchpad like any Mac app.'];
  if(o.edge)return['Click the <b>...</b> menu at the top right of Edge.','Choose <b>Apps</b> then <b>Install this site as an app</b>, then <b>Install</b>.','It gets its own window and a Start menu / desktop icon.'];
  if(o.chrome||o.cros||o.and)return o.and?['Tap the <b>&#8942;</b> menu at the top right of Chrome.','Tap <b>Install app</b> (or <b>Add to Home screen</b>), then <b>Install</b>.']:['Click the <b>install icon</b> at the right end of the address bar (a small screen with a down arrow),','or open the <b>&#8942;</b> menu, choose <b>Cast, save, and share</b> then <b>Install page as app</b>.','Click <b>Install</b>. It gets its own window and a desktop / Start menu / Dock icon.'];
  if(o.ff)return['Firefox cannot install web apps. Open this link in <b>Chrome</b> or <b>Edge</b> (Windows / Mac) or <b>Safari</b> (Mac / iPhone) and install from there.'];
  return['Open this link in <b>Chrome</b> or <b>Edge</b> and choose <b>Install</b> from the browser menu.']}
 W.OWQ_INSTALL=function(){if(W.OWQ_BIP){var e=W.OWQ_BIP;e.prompt();(e.userChoice||Promise.resolve({})).then(function(r){if(r&&r.outcome==='accepted')hide();W.OWQ_BIP=null})['catch'](function(){});return}
  css1();var o=D.getElementById('owqinm');if(o)o.remove();o=D.createElement('div');o.id='owqinm';o.onclick=function(e){if(e.target===o)o.remove()};
  o.innerHTML='<div class=owqin-m role=dialog aria-modal=true aria-label="Install the app"><h4>Install OWQ Station</h4><p>Put the portal on this computer like normal software: its own window and an icon on your desktop, Start menu or Dock.</p><ol>'+steps().map(function(x){return'<li>'+x+'</li>'}).join('')+'</ol><button class=ok onclick="document.getElementById(\'owqinm\').remove()">Got it</button></div>';D.body.appendChild(o)};
 var css='.owqin{position:fixed;right:18px;bottom:18px;z-index:2147483001;display:flex;align-items:center;gap:0;border:1.5px solid #ff1f4f;background:#0d0d14ee;box-shadow:0 0 18px #ff1f4f55;font:700 12px Verdana,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#fff}'+
  '.owqin button{background:transparent;border:0;color:inherit;font:inherit;letter-spacing:inherit;text-transform:inherit;cursor:pointer;padding:11px 14px}.owqin .go{display:flex;gap:9px;align-items:center}.owqin .go i{font-style:normal;color:#ff1f4f;font-size:16px}.owqin .x{border-left:1px solid #ff1f4f55;color:#9a9aa8;padding:11px 12px}'+
  '#owqinm{position:fixed;inset:0;z-index:2147483002;background:#05050aCC;display:flex;align-items:center;justify-content:center;padding:16px}.owqin-m{max-width:520px;width:100%;border:1.5px solid #ff1f4f;background:#12121a;box-shadow:0 0 30px #ff1f4f55;padding:22px;font-family:Verdana,sans-serif;color:#f4f4f6}.owqin-m h4{margin:0 0 6px;color:#ff1f4f;letter-spacing:2px;text-transform:uppercase;font-size:16px}.owqin-m p{margin:0;color:#bdbdc8;font-size:14px;line-height:1.5}.owqin-m .ok{margin-top:16px;background:#ff1f4f;color:#fff;border:0;padding:11px 20px;font:700 12px Verdana,sans-serif;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer}'+
  '.owqin-m ol{margin:12px 0 0;padding-left:20px;line-height:1.6;color:#d8d8e0;font-size:14px}.owqin-m li{margin:6px 0}.owqin-m b{color:#fff}@media(max-width:640px){.owqin{right:10px;bottom:76px}}';
 var el=null;function hidden(){try{return +localStorage.getItem('owq_inst_x')>Date.now()}catch(e){return false}}
 var cssOn=0;function css1(){if(cssOn)return;cssOn=1;var st=D.createElement('style');st.textContent=css;D.head.appendChild(st)}
 function show(){if(el||hidden()||standalone())return;if(!D.body){D.addEventListener('DOMContentLoaded',show);return}css1();
  el=D.createElement('div');el.className='owqin';el.innerHTML='<button class=go onclick="OWQ_INSTALL()" title="Install the portal on this computer"><i>&#8681;</i>Install the app</button><button class=x onclick="OWQ_INSTALL_X()" aria-label="Hide for a week">&times;</button>';D.body.appendChild(el)}
 function hide(){if(el){el.remove();el=null}}
 W.OWQ_INSTALL_X=function(){try{localStorage.setItem('owq_inst_x',String(Date.now()+6048e5))}catch(e){}hide()};
 /* browsers without the one-click prompt (Safari, Firefox) still get the button after a moment */
 if(W.OWQ_BIP)setTimeout(show,0);
 setTimeout(function(){if(!W.OWQ_BIP){var o=os();if(o.safari||o.ios||o.ff)show()}},4000);
})();
