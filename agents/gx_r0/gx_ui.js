/* ===== GX UI: operator menu, live feed, alert pings, dive sequence, access panel, graphics panel ===== */
const GXC=[
['Tokyo','Japan',35.68,139.69,'Asia/Tokyo'],['Shanghai','China',31.23,121.47,'Asia/Shanghai'],['Singapore','Singapore',1.35,103.82,'Asia/Singapore'],
['Mumbai','India',19.08,72.88,'Asia/Kolkata'],['Delhi','India',28.61,77.21,'Asia/Kolkata'],['Dubai','United Arab Emirates',25.2,55.27,'Asia/Dubai'],
['Istanbul','Türkiye',41.01,28.98,'Europe/Istanbul'],['Cairo','Egypt',30.04,31.24,'Africa/Cairo'],['Lagos','Nigeria',6.52,3.38,'Africa/Lagos'],
['Nairobi','Kenya',-1.29,36.82,'Africa/Nairobi'],['Johannesburg','South Africa',-26.2,28.05,'Africa/Johannesburg'],['Moscow','Russia',55.76,37.62,'Europe/Moscow'],
['London','United Kingdom',51.51,-0.13,'Europe/London'],['Paris','France',48.86,2.35,'Europe/Paris'],['Berlin','Germany',52.52,13.4,'Europe/Berlin'],
['Madrid','Spain',40.42,-3.7,'Europe/Madrid'],['Rome','Italy',41.9,12.5,'Europe/Rome'],['Stockholm','Sweden',59.33,18.07,'Europe/Stockholm'],
['New York','United States',40.71,-74.01,'America/New_York'],['Chicago','United States',41.88,-87.63,'America/Chicago'],['Houston','United States',29.76,-95.37,'America/Chicago'],
['Denver','United States',39.74,-104.99,'America/Denver'],['Los Angeles','United States',34.05,-118.24,'America/Los_Angeles'],['Miami','United States',25.76,-80.19,'America/New_York'],
['Atlanta','United States',33.75,-84.39,'America/New_York'],['Toronto','Canada',43.65,-79.38,'America/Toronto'],['Mexico City','Mexico',19.43,-99.13,'America/Mexico_City'],
['Bogotá','Colombia',4.71,-74.07,'America/Bogota'],['Lima','Peru',-12.05,-77.04,'America/Lima'],['São Paulo','Brazil',-23.55,-46.63,'America/Sao_Paulo'],
['Buenos Aires','Argentina',-34.6,-58.38,'America/Argentina/Buenos_Aires'],['Santiago','Chile',-33.45,-70.67,'America/Santiago'],['Sydney','Australia',-33.87,151.21,'Australia/Sydney'],
['Melbourne','Australia',-37.81,144.96,'Australia/Melbourne'],['Auckland','New Zealand',-36.85,174.76,'Pacific/Auckland'],['Seoul','South Korea',37.57,126.98,'Asia/Seoul'],
['Hong Kong','China',22.32,114.17,'Asia/Hong_Kong'],['Bangkok','Thailand',13.76,100.5,'Asia/Bangkok'],['Jakarta','Indonesia',-6.21,106.85,'Asia/Jakarta'],
['Manila','Philippines',14.6,120.98,'Asia/Manila'],['Karachi','Pakistan',24.86,67.0,'Asia/Karachi'],['Riyadh','Saudi Arabia',24.71,46.68,'Asia/Riyadh'],
['Vancouver','Canada',49.28,-123.12,'America/Vancouver'],['Anchorage','United States',61.22,-149.9,'America/Anchorage'],['Honolulu','United States',21.31,-157.86,'Pacific/Honolulu'],
['Casablanca','Morocco',33.57,-7.59,'Africa/Casablanca'],['Accra','Ghana',5.6,-0.19,'Africa/Accra'],['Addis Ababa','Ethiopia',9.03,38.74,'Africa/Addis_Ababa'],
['Warsaw','Poland',52.23,21.01,'Europe/Warsaw'],['Athens','Greece',37.98,23.73,'Europe/Athens'],['Lisbon','Portugal',38.72,-9.14,'Europe/Lisbon'],
['Taipei','Taiwan',25.03,121.57,'Asia/Taipei'],['Kuala Lumpur','Malaysia',3.14,101.69,'Asia/Kuala_Lumpur'],['Dhaka','Bangladesh',23.81,90.41,'Asia/Dhaka']
];
const GXU=(function(){
'use strict';
const U={altOn:0,altT:0,on:0,st:'off',sel:0,names:[],city:null,recent:[],q:'auto',busy:0,fps:30,labels:[],ambI:0,ambT:0,fail:0,gl:0,leaving:0,pinOn:0,still:0,keys:0,clkT:0,t0:0,hint:0,tm:[]};
const $g=id=>document.getElementById(id);
const lget=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}};
const lset=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const SEVC={crit:[1,.12,.24],warn:[1,.66,.12],info:[.36,.82,1],ok:[.26,.95,.62]};
const pad2=n=>n<10?'0'+n:''+n;
const coord=(la,lo)=>Math.abs(la).toFixed(2)+'° '+(la<0?'S':'N')+' · '+Math.abs(lo).toFixed(2)+'° '+(lo<0?'W':'E');
const ltime=tz=>{try{return new Date().toLocaleTimeString('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit'})}catch(e){return new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}};
const hstr=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const later=(fn,ms)=>{const id=setTimeout(()=>{U.tm=U.tm.filter(x=>x!==id);fn()},ms);U.tm.push(id);return id};
const clearLater=()=>{U.tm.forEach(clearTimeout);U.tm=[]};
const isStill=()=>!!(RM||U.q==='still');

/* ---------- sound effects (web audio, no files) ---------- */
let NZ=null;
function sxc(){if(lget('owq_gxs','1')==='0'||document.hidden)return null;const c=fxCtx();if(!c)return null;if(!NZ){const n=c.sampleRate*2,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;NZ=b}return c}
function tone(c,t,f0,f1,dur,vol,type){const o=c.createOscillator(),g=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+Math.min(.02,dur/3));g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+.03)}
function nz(c,t,dur,f0,f1,q,vol,type){const s=c.createBufferSource();s.buffer=NZ;s.loop=true;const f=c.createBiquadFilter();f.type=type||'bandpass';f.Q.value=q||1;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+dur*.45);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(c.destination);s.start(t);s.stop(t+dur+.05)}
function sfx(k){try{const c=sxc();if(!c)return;const t=c.currentTime+.01;
 if(k==='tick')tone(c,t,1900,1500,.035,.016);
 else if(k==='sel'){tone(c,t,420,840,.14,.05,'triangle');tone(c,t+.07,840,1260,.16,.035);nz(c,t,.12,3000,900,.8,.02)}
 else if(k==='lock'){tone(c,t,1320,1320,.09,.04);tone(c,t+.11,1980,1980,.2,.035);tone(c,t,110,55,.4,.06)}
 else if(k==='charge'){tone(c,t,70,520,.6,.05,'sawtooth');nz(c,t,.6,300,5200,2,.03)}
 else if(k==='jump'){nz(c,t,.85,500,9000,.9,.07);tone(c,t,90,40,.9,.08)}
 else if(k==='boom'){tone(c,t,64,30,.9,.12);nz(c,t,.7,3000,200,.6,.05,'lowpass')}
 else if(k==='air')nz(c,t,1.7,1400,260,.7,.035,'lowpass');
 else if(k==='dive'){nz(c,t,2.8,5200,320,.8,.05);tone(c,t,150,46,2.8,.05);tone(c,t+.05,880,660,.5,.015,'triangle')}
 else if(k==='land'){tone(c,t,660,660,.12,.025,'triangle');tone(c,t+.1,990,990,.28,.02)}
 else if(k==='deny'){tone(c,t,150,140,.14,.05,'square');tone(c,t+.18,130,120,.2,.05,'square')}
 else if(k==='grant'){tone(c,t,520,1040,.2,.05,'triangle');tone(c,t+.1,780,1560,.3,.04)}
 else if(k==='launch'){nz(c,t,1.1,400,9500,.9,.08);tone(c,t,60,300,1,.07,'sawtooth')}
 else if(k==='ping'){tone(c,t,1175,1175,.09,.03);tone(c,t+.08,1760,1760,.16,.026)}
}catch(e){}}

/* ---------- state + dom ---------- */
function setSt(s){U.st=s;const l=$g('login');if(l)l.className='on gxl st-'+s+(U.fail?' nogl':'');const g=$g('gx');if(g)g.classList.toggle('lnd',s==='land'||s==='launch')}
function hud(a,b){const h=$g('gxhud');if(!h)return;h.innerHTML=a?'<div class=gxhb><i></i><i></i><i></i></div><b>'+a+'</b><small id=gxhs>'+(b||'')+'</small>':'';h.classList.toggle('on',!!a)}
const kmFmt=v=>(v>=100?Math.round(v/10)*10:Math.round(v)).toLocaleString('en-US')+' KM';
function altTick(){if(!U.altOn||U.st!=='pick')return;const now=performance.now();if(now-U.altT<90)return;U.altT=now;const e=$g('gxhs');if(e)try{e.textContent='ALT '+kmFmt(GX.alt())}catch(_){}}
function build(){const l=$g('login');if(!l)return;
 setSt('boot');
 l.innerHTML='<div class=gxv></div>'+
 '<header class=gxbrand><svg viewBox="0 0 40 40" aria-hidden=true><circle cx=20 cy=20 r=17 fill=none stroke="#ff1f4f" stroke-width=2 stroke-dasharray="3 5"/><circle cx=20 cy=20 r=8 fill="#ff1f4f"/></svg><div><b>ONLY WINNERS <i>&amp;</i> QUITTERS</b><small>AGENCY PORTAL</small></div></header>'+
 '<aside class=gxfeed id=gxfeed aria-label="Live feed"></aside>'+
 '<nav class=gxmenu aria-label="Select operator"><h2><i></i>SELECT OPERATOR</h2><div class=gxlist id=gxlist role=listbox></div><div class=gxdesc id=gxdesc></div></nav>'+
 '<div class=gxhud id=gxhud role=status aria-live=polite></div>'+
 '<div class=gxpin id=gxpin><i></i><i></i><u></u><div><b id=gxpn></b><small id=gxpc></small></div></div>'+
 '<div class=gxloc id=gxloc></div><div class=gxa id=gxa></div><div class=gxlbls id=gxlbls aria-hidden=true></div>'+
 '<div class=gxkeys><kbd>↑</kbd><kbd>↓</kbd> NAVIGATE<kbd>ENTER</kbd> SELECT<kbd>ESC</kbd> BACK</div>'+
 '<div class=gxstat id=gxstat></div>'+
 (LGMSG?'<p class=gxmsg role=alert>'+esc(LGMSG)+'</p>':'');
 LGMSG='';
 const list=$g('gxlist');
 list.addEventListener('mouseover',e=>{const b=e.target.closest&&e.target.closest('.gxo');if(!b)return;const i=+b.dataset.i;if(i!==U.sel&&U.st==='menu'){U.sel=i;sync();sfx('tick')}});
 list.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.gxo');if(!b)return;U.sel=+b.dataset.i;sync();pick(U.names[U.sel])});
 renderStat()}
const clk=n=>openShift(n==='Agency Owner'&&D.agents.some(a=>a.name==='Cole Leckey')?'Cole Leckey':n);
function roster(){U.names=D.agents.map(a=>a.name).concat(['Agency Owner']);if(U.sel>=U.names.length)U.sel=0;const m=$g('gxlist');if(!m)return;
 m.innerHTML=U.names.map((n,i)=>'<button class=gxo type=button role=option data-i='+i+' style="--i:'+i+'" aria-selected='+(i===U.sel)+'><i class=gxi>'+pad2(i+1)+'</i>'+av(n,34)+'<span class=gxn><b>'+esc(n)+'</b><small>'+esc(roleOf(n))+'</small></span>'+(clk(n)?'<em class=gxon title="On the clock"></em>':'')+'</button>').join('');
 fitNames();desc()}
function fitNames(){const m=$g('gxlist');if(!m)return;[].forEach.call(m.querySelectorAll('.gxn b'),b=>{b.style.fontSize='';const w=b.clientWidth,sw=b.scrollWidth;if(w>0&&sw>w+1){const fs=parseFloat(getComputedStyle(b).fontSize)||24;b.style.fontSize=Math.max(12,Math.floor(fs*w/sw*10)/10-.4)+'px'}})}
function sync(){const m=$g('gxlist');if(!m)return;[].forEach.call(m.children,(b,i)=>b.setAttribute('aria-selected',i===U.sel));const b=m.children[U.sel];if(b&&b.scrollIntoView)try{b.scrollIntoView({block:'nearest'})}catch(e){}desc()}
function desc(){const n=U.names[U.sel],d=$g('gxdesc');if(!d||!n)return;const sh=clk(n);
 const line=sh?'<em class=on></em>On the clock since '+esc(new Date(sh.start).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})):'<em></em>Off the clock';
 d.innerHTML='<small>OPERATOR FILE '+pad2(U.sel+1)+'</small><b>'+esc(n)+'</b><span>'+esc(roleOf(n))+'</span><p>'+line+'</p>'}
function renderFeed(){const f=$g('gxfeed');if(!f)return;const a=AL().slice(0,5),un=AL().filter(x=>!x.rd).length;
 f.innerHTML='<div class=gxfh><i></i>LIVE FEED<small>'+un+' UNREAD</small></div>'+(a.length?'<ul>'+a.map(x=>{const s=SEV[x.sev]||SEV.info;return '<li style="--c:'+s[1]+'"><i></i><span><b>'+esc(x.t||'')+'</b><small>'+esc(String(x.m||'').slice(0,64))+'</small></span><time>'+esc(ago2(x.ts))+'</time></li>'}).join('')+'</ul>':'<p>No recent alerts. All systems nominal.</p>')}
function gfxLabel(){return isStill()?'STILL':U.q==='low'?'LOW':'AUTO'}
function renderStat(){const s=$g('gxstat');if(!s)return;const n=(D.shifts||[]).filter(shiftLive).length;
 s.innerHTML='<span class=ok><i></i>SECURE LINK</span><span>'+n+' ON THE CLOCK</span><span id=gxclk>'+new Date().toLocaleTimeString('en-GB')+'</span><button type=button class=gxg onclick="GXU.gfx()" aria-label="Graphics settings">GFX · '+gfxLabel()+'</button>'}
function fontsRefit(){try{if(!document.fonts)return;const f=()=>{if(U.on){fitNames();fitLoc()}};if(document.fonts.load)document.fonts.load('500 24px Oswald').then(f,f);if(document.fonts.ready)document.fonts.ready.then(f)}catch(e){}}
function clock(){clearInterval(U.clkT);U.clkT=setInterval(()=>{const c=$g('gxclk');if(c)c.textContent=new Date().toLocaleTimeString('en-GB');const lt=$g('gxlt');if(lt&&U.city)lt.textContent=ltime(U.city[4]);if(!(++U.hint%15)){renderStat();renderFeed()}ambient()},1000)}

/* ---------- webgl ---------- */
function initGL(){if(U.fail)return false;if(U.gl&&GX.S.ok)return true;const host=$g('gx');if(!host)return false;
 const old=$g('gxc');if(old)old.remove();const cv=document.createElement('canvas');cv.id='gxc';cv.setAttribute('aria-hidden','true');host.insertBefore(cv,host.firstChild);
 const low=U.q==='low';GX.setQuality(low?'low':'full');
 let ok=false;try{ok=GX.init(cv,{lights:GXTX.lights,pack:GXTX.pack},{aa:false,rocks:low?240:420,streaks:low?600:1100,seg:low?96:128})}catch(e){ok=false}
 if(!ok){cv.remove();U.fail=1;U.gl=0;return false}
 U.gl=1;GX.on('lost',()=>{if(U.leaving)return;U.fail=2;U.gl=0;const h=$g('gx');if(h)h.classList.add('fb');const l=$g('login');if(l)l.classList.add('nogl')});
 GX.on('frame',onFrame);GX.dir.stage(onStage);return true}
function onFrame(dt){U.fps=U.fps*.94+(1/Math.max(dt,.001))*.06;if(U.labels.length||U.pinOn)place();if(U.altOn)altTick()}
function place(){const now=performance.now();
 for(let i=U.labels.length-1;i>=0;i--){const L=U.labels[i],age=now-L.t;if(age>L.life){L.el.remove();U.labels.splice(i,1);continue}
  const p=GX.project(L.lat,L.lon),vis=p.vis&&p.facing>.1;L.el.style.opacity=vis?String(Math.min(1,age/240)*Math.min(1,(L.life-age)/500)):'0';L.el.style.transform='translate('+p.x.toFixed(1)+'px,'+p.y.toFixed(1)+'px)'}
 if(U.pinOn&&U.city){const e=$g('gxpin');if(e){const p=GX.project(U.city[2],U.city[3]);e.style.transform='translate('+p.x.toFixed(1)+'px,'+p.y.toFixed(1)+'px)';e.classList.toggle('flip',innerWidth>820&&p.x>innerWidth-300)}}}
function draw(){if(U.gl&&GX.S.ok){try{GX.resize();GX.draw()}catch(e){}}}
/* landing framing: put the city in the gap between the LOCATION block (left) and the access card (right) */
function landSX(){const W=innerWidth;if(W<=820)return 0;const cardL=W-Math.min(110,Math.max(18,W*.06))-Math.min(392,W-36),textR=W*.42;return Math.max(-.3,Math.min(.3,(textR+cardL)/W-1))}
function frameLand(){if(U.gl)try{GX.S.landSX=landSX()}catch(e){}}

/* ---------- alert pings ---------- */
function safeBox(){const W=innerWidth,H=innerHeight,m=document.querySelector('#login .gxmenu'),r=m?m.getBoundingClientRect():null,mob=W<=820;
 return mob?{x0:30,x1:W-30,y0:80,y1:r?Math.max(120,r.top-24):H*.5}:{x0:r?r.right+24:380,x1:W-350,y0:96,y1:H-80}}
function visCity(seed){const b=safeBox(),a=[],v=[],used=U.labels.map(l=>l.c);
 for(let k=0;k<GXC.length;k++){const c=GXC[k],p=GX.project(c[2],c[3]);if(!p.vis||p.facing<.22)continue;v.push(c);if(p.x>b.x0&&p.x<b.x1&&p.y>b.y0&&p.y<b.y1&&used.indexOf(c)<0)a.push(c)}
 const pool=a.length?a:v;return pool.length?pool[seed%pool.length]:GXC[seed%GXC.length]}
function ping(al,live){if(!U.on||U.leaving)return;
 if(live){renderFeed();const f=$g('gxfeed');if(f){f.classList.remove('flash');void f.offsetWidth;f.classList.add('flash')}}
 if(!U.gl||isStill()||(U.st!=='menu'&&U.st!=='back'))return;
 const sev=al.sev||'info',c=visCity(hstr(String(al.id||al.k||al.t||Math.random())));
 try{GX.ping(c[2],c[3],{col:SEVC[sev]||SEVC.info,life:5.6,k:1.1})}catch(e){}
 const box=$g('gxlbls');if(box&&!document.hidden){const s=SEV[sev]||SEV.info,el=document.createElement('div');el.className='gxp';el.style.setProperty('--c',s[1]);
  el.innerHTML='<i></i><div><b>'+esc(String(al.t||'ALERT').slice(0,40))+'</b><small>'+esc(c[0].toUpperCase())+' · '+esc((s[0]||'').toUpperCase())+'</small></div>';box.appendChild(el);
  U.labels.push({el,lat:c[2],lon:c[3],t:performance.now(),life:5200,c});while(U.labels.length>3){const o=U.labels.shift();o.el.remove()}}
 if(live)sfx('ping')}
function ambient(){if(!U.on||U.st!=='menu'||!U.gl||isStill()||document.hidden)return;const now=Date.now();if(now<U.ambT)return;
 U.ambT=now+(U.ambT?7000+Math.random()*6000:2600);const a=AL();if(!a.length){const c=visCity((Math.random()*997)|0);try{GX.ping(c[2],c[3],{col:SEVC.info,life:4.2,k:.6})}catch(e){}return}
 const al=a[U.ambI++%Math.min(a.length,8)];ping(al,false)}

/* ---------- sequence handlers ---------- */
function nextCity(){let c,g=0;do{c=GXC[(Math.random()*GXC.length)|0];g++}while(U.recent.indexOf(c)>=0&&g<40);U.recent.push(c);if(U.recent.length>10)U.recent.shift();return c}
function showMenu(){clearLater();U.pinOn=0;U.busy=0;setSt('menu');hud('');U.ambT=Date.now()+2200;roster();renderFeed();renderStat();if(U.gl)later(()=>{try{GX.warm()}catch(e){}},900);
 const b=$g('gxlist')&&$g('gxlist').children[U.sel];if(b&&document.activeElement===document.body){try{b.focus({preventScroll:true})}catch(e){}}}
function pick(name){if(U.st!=='menu'||U.busy||!name)return;U.busy=1;U.altOn=0;LG=name;const c=U.city=nextCity();sfx('sel');
 setSt('pick');U.skipOk=0;const nm=esc(name.toUpperCase());
 const pn=$g('gxpn'),pc=$g('gxpc'),pe=$g('gxpin');if(pn)pn.textContent=c[0].toUpperCase()+', '+c[1].toUpperCase();if(pc)pc.textContent=coord(c[2],c[3]);if(pe)pe.className='gxpin';
 frameLand();if(U.gl&&!isStill()){hud('ESTABLISHING SECURE LINK',nm);later(()=>{U.skipOk=1},500);GX.dir.pick(c[2],c[3])}
 else{hud('ESTABLISHING SECURE LINK',nm);later(()=>{if(U.gl){GX.dir.snap('land',[c[2],c[3]]);draw()}showLand()},U.gl?420:700)}}
function skip(){if(U.st!=='pick')return;if(U.gl&&!isStill()){U.skipOk=0;GX.dir.skip()}else showLand()}
function onStage(n){if(!U.on||U.leaving)return;const c=U.city;
 if(n==='idle'){if(U.st==='back'||U.st==='boot')showMenu();return}
 if(U.st==='back'){if(n==='map')showMenu();return}
 if(U.st==='pick'){
  if(n==='map')hud('ACQUIRING TARGET',esc(String(LG||'').toUpperCase()));
  else if(n==='pin'){const e=$g('gxpin');if(e){U.pinOn=1;place();e.className='gxpin on drop'}sfx('lock');hud('TARGET LOCKED',c?esc(c[0].toUpperCase()+', '+c[1].toUpperCase()):'')}
  else if(n==='dive'){hud('DESCENDING','ALT '+kmFmt(GX.alt()));U.altOn=1;U.altT=0;sfx('dive')}
  else if(n==='entry'){hud('ENTERING ATMOSPHERE','ALT '+kmFmt(GX.alt()));U.altOn=1;sfx('air');const e=$g('gxpin');if(e)e.classList.add('out');later(()=>{if(U.st==='pick')U.pinOn=0},500)}
  else if(n==='land'){showLand();sfx('land')}}}
function showLand(){if(U.st==='land'||!LG)return;U.pinOn=0;U.busy=0;U.altOn=0;setSt('land');hud('');renderLoc();renderAuth();
 const pe=$g('gxpin');if(pe)pe.className='gxpin';later(()=>{const i=$g('lgi');if(i&&U.st==='land'){try{i.focus({preventScroll:true})}catch(e){}}},isStill()?80:700)}
function renderLoc(){const c=U.city,e=$g('gxloc');if(!c||!e)return;e.innerHTML='<small>LOCATION ACQUIRED</small><h2>'+esc(c[0].toUpperCase())+'</h2><p>'+esc(c[1].toUpperCase())+'</p><div class=gxlm><span>'+coord(c[2],c[3])+'</span><span>LOCAL <b id=gxlt>'+ltime(c[4])+'</b></span><span>ALT <b>'+landAlt(c)+' KM</b></span></div>';fitLoc()}
function landAlt(c){try{return Math.round(GX.landAltFor(c[2],c[3]))}catch(e){return 60}}
function fitLoc(){const e=$g('gxloc'),h=e&&e.querySelector('h2');if(!h)return;h.style.fontSize='';let g=0;while(g++<8&&h.scrollWidth>h.clientWidth+1){const fs=parseFloat(getComputedStyle(h).fontSize)||48;if(fs<=26)break;h.style.fontSize=(fs*.9).toFixed(1)+'px'}}
function renderAuth(){const n=LG,e=$g('gxa');if(!e||!n)return;
 e.innerHTML='<div class=gxav>'+av(n,92)+'<i></i><i></i></div><small class=gxak>SECURE ACCESS</small><h3>'+esc(n)+'<small>'+esc(roleOf(n).toUpperCase())+'</small></h3>'+
 '<input id=lgi type=password placeholder="ENTER ACCESS CODE" autocomplete=off aria-label="Access code"><button type=button class=btn onclick="doLogin()">Authenticate</button><button type=button class="btn o" onclick="GXU.back()">Switch operator</button>'+
 '<p>'+(PWD[n]?'Enter your access code. Not case sensitive.':'No code set for this profile yet: any word or letter works for now.')+'</p>';
 const i=$g('lgi');i.onkeydown=ev=>{if(ev.key==='Enter')doLogin()}}
function back(){if(U.st!=='land')return;LG=null;U.busy=1;U.altOn=0;clearLater();setSt('back');
 if(U.gl&&!isStill()){GX.dir.back();later(()=>{if(U.st==='back')showMenu()},3000)}
 else{if(U.gl){GX.dir.snap('idle');draw()}later(showMenu,300)}}
function deny(){sfx('deny');const l=$g('login');if(l){l.classList.add('deny');setTimeout(()=>l.classList.remove('deny'),520)}
 if(U.gl&&!isStill()){GX.set({shake:1});GX.tween({shake:0},650,GX.EASE.o3)}}
/* access granted: jump out of the atmosphere, flash, and hand over to the portal */
function granted(cb){if(U.leaving)return;U.leaving=1;U.busy=1;clearLater();setSt('launch');document.body.classList.add('hush');
 const fl=$g('gxfl');let fin=0;const done=()=>{if(fin)return;fin=1;try{cb()}catch(e){console.error(e)}
  U.on=0;clearInterval(U.clkT);try{GX.release()}catch(e){}const c=$g('gxc');if(c)c.remove();U.gl=0;const h=$g('gx');if(h)h.className='';
  if(fl){fl.style.transition='opacity .85s ease-out';fl.style.opacity='0'}
  setTimeout(()=>{document.body.classList.remove('hush');if(fl)fl.style.transition='none';U.leaving=0},1300)};
 if(U.gl&&!isStill()){sfx('grant');later(()=>sfx('launch'),150);
  GX.dir.stage(n=>{if(n==='flash'){GX.dir.stage(onStage);if(fl){fl.style.transition='none';fl.style.opacity='1'}sfx('boom');later(done,40)}else onStage(n)});GX.dir.launch();setTimeout(()=>{if(!fin){if(fl){fl.style.transition='none';fl.style.opacity='1'}done()}},3200)}
 else{sfx('grant');if(fl){fl.style.transition='opacity .35s ease-in';fl.style.opacity='1'}setTimeout(done,380)}}

/* ---------- graphics / motion panel ---------- */
function gfxPanel(refresh){let d=$g('gfxd');if(d&&!refresh){d.remove();return}if(!d){d=document.createElement('div');d.id='gfxd';d.setAttribute('role','dialog');document.body.appendChild(d)}
 const S=GX.S,gp=(S.gpu||'').replace(/ANGLE \((.*)\)/,'$1').replace(/\s*\(0x[0-9A-Fa-f]+\)/g,'').replace(/Direct3D\d+ vs_\d_\d ps_\d_\d,?\s*/,'').slice(0,60);
 const b=(m,l,cur,fn)=>'<button class="'+(cur===m?'on':'')+'" onclick="'+fn+'(\''+m+'\')">'+l+'</button>';
 d.innerHTML='<button class=gxx onclick="this.parentNode.remove()" aria-label="Close">&times;</button><h4>GRAPHICS</h4><dl><dt>Engine</dt><dd>'+(U.gl?'Globe ('+esc(S.api||'WebGL')+')':'Standard (no WebGL)')+'</dd><dt>GPU</dt><dd>'+esc(gp||'Unknown')+'</dd><dt>Frame rate</dt><dd>'+(U.gl&&!isStill()?Math.round(U.fps)+' fps':'paused')+'</dd><dt>Resolution</dt><dd>'+(U.gl?Math.round(S.scale*100)+'%'+(S.scale<1?' (auto-reduced)':''):'-')+'</dd><dt>System motion</dt><dd>'+(RM0?'Reduce motion is ON':'Normal')+'</dd></dl>'+
 '<div class=gml>Quality</div><div class=gm>'+b('auto','Auto',U.q,'GXU.quality')+b('low','Low',U.q,'GXU.quality')+b('still','Still image',U.q,'GXU.quality')+'</div>'+
 '<div class=gml>Motion</div><div class=gm>'+b('full','Full motion',MOTION,'setMotion')+b('','Follow system',MOTION,'setMotion')+b('reduce','Reduced',MOTION,'setMotion')+'</div>'+
 '<div class=gml>Sound effects</div><div class=gm>'+b('1','On',lget('owq_gxs','1'),'GXU.sfxPref')+b('0','Off',lget('owq_gxs','1'),'GXU.sfxPref')+'</div>'}
function quality(q){U.q=q==='low'||q==='still'?q:'auto';lset('owq_gq',U.q);
 if(U.gl){GX.setQuality(U.q==='low'?'low':'full')}
 motion();renderStat();gfxPanel(true)}
function motion(){if(!U.on)return;const s=isStill();
 if(!U.gl)return;
 if(s){GX.stop();GX.cancel();GX.S.pings.length=0;GX.set({spin:0,fade:1,flash:0,warp:0,shake:0});GX.S.noSpin=1;
  const k=U.st==='land'||U.st==='pick'?'land':'idle';frameLand();GX.dir.snap(k,U.city&&k==='land'?[U.city[2],U.city[3]]:null);GX.set({fade:1});draw();if(U.st==='pick')showLand()}
 else{GX.S.noSpin=0;if(U.st==='menu'||U.st==='boot'){GX.dir.snap('idle');GX.set({fade:1,spin:.03});GX.S.noSpin=0}GX.start()}}
function sfxPref(v){lset('owq_gxs',v==='0'?'0':'1');gfxPanel(true);if(v!=='0')sfx('lock')}

/* ---------- keyboard / pointer ---------- */
function attach(){if(U.keys)return;U.keys=1;
 addEventListener('keydown',e=>{if(!U.on||ONLINE||U.leaving)return;const k=e.key;
  if(U.st==='menu'){const n=U.names.length;
   if(k==='ArrowDown'||k==='s'||k==='S'){U.sel=(U.sel+1)%n;sync();sfx('tick');e.preventDefault()}
   else if(k==='ArrowUp'||k==='w'||k==='W'){U.sel=(U.sel-1+n)%n;sync();sfx('tick');e.preventDefault()}
   else if(k==='Enter'||k===' '){const ae=document.activeElement;if(ae&&ae.tagName==='BUTTON'&&!ae.classList.contains('gxo'))return;pick(U.names[U.sel]);e.preventDefault()}
   else if(/^[1-9]$/.test(k)&&U.names[+k-1]){U.sel=+k-1;sync();pick(U.names[U.sel])}}
  else if(U.st==='pick'){if(k==='Enter'||k===' '||k==='Escape'){skip();e.preventDefault()}}
  else if(U.st==='land'){if(k==='Escape'){back();e.preventDefault()}}});
 const lg=$g('login');if(lg)lg.addEventListener('click',()=>{if(U.on&&U.st==='pick'&&U.skipOk)skip()});
 addEventListener('resize',()=>{if(!U.on)return;if(U.gl){frameLand();GX.resize();if(isStill()){GX.dir.relayout();draw()}else GX.dir.relayout()}},{passive:true});
 let mt=0;addEventListener('mousemove',e=>{if(!U.on||!U.gl||isStill()||mt)return;mt=1;requestAnimationFrame(()=>{mt=0;GX.mouse(e.clientX/innerWidth*2-1,e.clientY/innerHeight*2-1)})},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(U.on&&!document.hidden){U.ambT=Date.now()+3000}})}

/* ---------- entry ---------- */
function enter(){
 if(U.on&&!U.leaving){if(U.st==='menu'){roster();renderFeed();renderStat();return}forceMenu();return}
 if(U.fail===2)U.fail=0;U.q=lget('owq_gq','auto');if(U.q!=='low'&&U.q!=='still')U.q='auto';U.leaving=0;U.busy=0;U.sel=0;U.city=null;U.labels=[];U.pinOn=0;clearLater();
 const host=$g('gx');if(host){host.className='on'}
 U.on=1;attach();build();roster();renderFeed();clock();fontsRefit();hud('ESTABLISHING LINK','');
 const fl=$g('gxfl');if(fl){fl.style.transition='none';fl.style.opacity='0'}
 const gl=initGL();
 if(!gl){if(host)host.classList.add('fb');const l=$g('login');if(l)l.classList.add('nogl');later(showMenu,350);return}
 if(host)host.classList.remove('fb');
 if(isStill()){GX.dir.snap('idle');GX.set({fade:1,spin:0});GX.S.noSpin=1;GX.stop();const go=()=>{draw();showMenu()};if(GX.S.ready)go();else{GX.on('tex',go);later(go,3000)}return}
 GX.dir.snap('idle');GX.set({fade:0});GX.start();
 let started=0;const go=()=>{if(started||!U.on)return;started=1;GX.dir.intro();later(()=>{if(U.st==='boot')showMenu()},1250)};
 if(GX.S.ready)go();else{GX.on('tex',go);later(go,3500)}}
function forceMenu(){clearLater();LG=null;U.busy=0;U.pinOn=0;const pe=$g('gxpin');if(pe)pe.className='gxpin';
 if(U.gl&&GX.S.ok){GX.cancel();GX.dir.snap('idle');GX.set({fade:1,flash:0,warp:0,spin:isStill()?0:.03});GX.S.noSpin=isStill()?1:0;if(isStill()){draw()}else GX.start()}
 showMenu()}

return {enter,pick,back,skip,granted,deny,ping,gfx:()=>gfxPanel(),gfxR:()=>{if($g('gfxd'))gfxPanel(true)},quality,motion,sfxPref,sfx,state:()=>U.st,on:()=>U.on,U,refresh:()=>{if(U.on&&U.st==='menu'){roster();renderFeed();renderStat()}}};
})();
