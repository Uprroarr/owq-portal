/*TRKstart*/
/* ===== LIVE TRACKING and the TIME REPORT (Agency Performance > Time Report) =====
   Every minute on the clock (the time clock's own heartbeat, acBeat), this device adds what that minute was to the open
   shift, so it syncs with the rest of the time clock:
     w  working: a click, a key, a scroll, a touch or the mouse moving in the portal
     l  Sales Floor only: no input, but in the voice lobby (the lobby keeps the clock running)
     p  on screen: no input, not in the lobby, the portal showing
     h  away: no input, not in the lobby, the portal hidden (another window or tab, or the screen off)
   and, counted alongside: s speaking in the lobby, m mic on in the lobby, g playing in the 3D world (Sky Deck, ballpark,
   Skyport, range, 1v1), i interactions (clicks, keys, scrolls, touches), t minutes per section.
   The report shows any agent's week (owner) or your own (everyone else): sessions per day, hours counted once even when
   two devices overlap, and what the hours were made of from the day tracking started. */
var TRK={w:0,i:0,s:0,wl:0,ms:0},TRKV={ag:'',wk:0};
(function(){const act=e=>{TRK.w=1;if(e.type!=='mousemove'){if(e.type==='wheel'){const n=Date.now();if(n-TRK.wl<800)return;TRK.wl=n}TRK.i++}};
 ['mousedown','keydown','touchstart','wheel'].forEach(t=>addEventListener(t,act,{passive:true,capture:true}));
 addEventListener('mousemove',e=>{const n=Date.now();if(n-TRK.ms<2000)return;TRK.ms=n;act(e)},{passive:true,capture:true});
 setInterval(()=>{try{if(typeof VC!=='undefined'&&VC.on&&VC.sp)TRK.s=1}catch(e){}},1000)})();
function trkSection(){try{if(typeof tab==='undefined')return'';if(tab==='Team Chat'&&typeof CH!=='undefined'&&CH.ch==='__voice')return'Sales Floor';return String(tab||'')}catch(e){return''}}
function trkGame(){try{const f=document.getElementById('vofm');if(!f||!f.offsetParent||typeof VO3==='undefined'||!VO3.dbg)return 0;const O=VO3.dbg();return O&&((O.wld&&O.wld.zone&&O.wld.zone!=='o')||(O.drive&&O.drive.me)||(O.fly&&O.fly.me))?1:0}catch(e){return 0}}
/* called by the time clock's heartbeat, once a minute, with my open automatic shift */
function trkBeat(s){try{const T=s.tk||(s.tk={n:0,w:0,l:0,p:0,h:0,s:0,m:0,g:0,i:0,t:{}}),lobby=typeof VC!=='undefined'&&!!VC.on,vis=document.visibilityState==='visible';
  T.n++;const k=TRK.w?'w':lobby?'l':vis?'p':'h';T[k]=(T[k]||0)+1;
  if(lobby&&TRK.s)T.s=(T.s||0)+1;if(lobby&&VC.mic&&!VC.muted)T.m=(T.m||0)+1;if(trkGame())T.g=(T.g||0)+1;T.i=(T.i||0)+Math.min(600,TRK.i);
  if(vis){const sec=trkSection();if(sec){T.t=T.t||{};T.t[sec]=(T.t[sec]||0)+1}}
 }catch(e){}TRK.w=0;TRK.i=0;TRK.s=0}
/* when a shift really ended: its clock-out, or (no clock-out yet) now while it is live, else its last heartbeat */
function shEnd(s){return s.end||(shiftLive(s)?Date.now():(s.hb||s.start))}
function trkOwn(){try{return WHO==='Agency Owner'||WHO==='Cole Leckey'||roleOf(WHO)==='Owner/Agent'}catch(e){return false}}
function trkMon(off){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7)+7*(off||0));return d}
const trkF=m=>{m=Math.round(m||0);const h=Math.floor(m/60),r=m%60;return h?h+'h '+(r<10?'0':'')+r+'m':r+'m'};
/* one agent's week: sessions cut at midnight, hours as the union of the sessions (an overlap from two devices counts once) */
function trkReport(ag,from,to){
  const days=[];for(let i=0;i<7;i++){const a=new Date(from);a.setDate(a.getDate()+i);const b=new Date(a);b.setDate(b.getDate()+1);days.push({a:a.getTime(),b:b.getTime(),key:dkey(a),label:a.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'}),ses:[],iv:[],tk:null,hand:0,sum:0})}
  const sh=(D.shifts||[]).filter(s=>s.ag===ag&&s.start<to&&shEnd(s)>from).sort((x,y)=>x.start-y.start),out={days,ses:0,long:0,stale:0,own:0,overlap:0,tracked:0};
  sh.forEach(s=>{const e=shEnd(s),L=Math.max(1,e-s.start),fl=[];out.ses++;
    if(s.note)fl.push(String(s.note));if(!s.end&&shiftLive(s))fl.push('on the clock now');if(!s.end&&!shiftLive(s)){fl.push('no heartbeat after '+tmS(s.hb||s.start)+', counted to then');out.stale++}
    if(e-s.start>10*36e5){fl.push('long session');out.long++}if(!s.auto&&!s.note)fl.push('clocked in by hand');
    days.forEach(d=>{const a=Math.max(s.start,d.a,from),b=Math.min(e,d.b,to);if(b<=a)return;d.ses.push({a,b,s0:s.start,e,fl});d.iv.push([a,b]);d.sum+=b-a;
      if(s.tk&&s.tk.n){const f=(b-a)/L,T=d.tk||(d.tk={n:0,w:0,l:0,p:0,h:0,s:0,m:0,g:0,i:0,t:{}});['n','w','l','p','h','s','m','g','i'].forEach(k=>T[k]+=(+s.tk[k]||0)*f);Object.keys(s.tk.t||{}).forEach(k=>T.t[k]=(T.t[k]||0)+(+s.tk.t[k]||0)*f)}})});
  days.forEach(d=>{d.iv.sort((x,y)=>x[0]-y[0]);let u=0,cs=-1,ce=-1;d.iv.forEach(([a,b])=>{if(a>ce){if(ce>cs)u+=ce-cs;cs=a;ce=b}else ce=Math.max(ce,b)});if(ce>cs)u+=ce-cs;d.hrs=u/36e5;d.ov=Math.max(0,d.sum-u)/36e5;out.overlap+=d.ov;
    d.hand=sum((D.activity||[]).filter(x=>x.ag===ag&&x.d===d.key&&!x.clock),x=>+x.h||0);if(d.tk)out.tracked++});
  const fk=dkey(new Date(from)),tk2=dkey(new Date(to-1));
  out.portal=sum((D.activity||[]).filter(x=>(x.ag||'Unassigned')===ag&&x.d>=fk&&x.d<=tk2),x=>+x.h||0)+sum((D.shifts||[]).filter(s=>s.ag===ag&&shiftLive(s)&&dkey(new Date(s.start))>=fk&&dkey(new Date(s.start))<=tk2),s=>(Date.now()-s.start)/36e5);
  out.hrs=sum(days,d=>d.hrs);out.hand=sum(days,d=>d.hand);out.worked=days.filter(d=>d.hrs>.02||d.hand>0).length;
  const T={n:0,w:0,l:0,p:0,h:0,s:0,m:0,g:0,i:0,t:{}};days.forEach(d=>{if(!d.tk)return;['n','w','l','p','h','s','m','g','i'].forEach(k=>T[k]+=d.tk[k]);Object.keys(d.tk.t).forEach(k=>T.t[k]=(T.t[k]||0)+d.tk.t[k])});out.tk=T;
  out.longest=Math.max(0,...sh.map(s=>shEnd(s)-s.start))/36e5;
  return out}
function trkGo(k,v){if(k==='ag')TRKV.ag=v;if(k==='wk')TRKV.wk=Math.min(0,v);go()}
function trkBar(T){if(!T||!T.n)return'<span class=trknt>not tracked</span>';const n=T.n,seg=(k,c,l)=>T[k]>0?`<i class=${c} style="width:${(T[k]/n*100).toFixed(1)}%" title="${l}: ${trkF(T[k])}"></i>`:'';
  return`<span class=trkbar>${seg('w','tw','Working')}${seg('l','tl','Sales Floor only')}${seg('p','tp','On screen, no input')}${seg('h','th','Away')}</span>`}
function trkTop(T){if(!T||!T.t)return'';return Object.entries(T.t).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>esc(k)+' '+trkF(v)).join(' &middot; ')}
function trkPage(){
  const own=trkOwn(),me=acWho(),ags=own?(D.agents||[]).map(a=>a.name):[me];
  if(!TRKV.ag||ags.indexOf(TRKV.ag)<0)TRKV.ag=own?(ags.find(n=>n!==me)||ags[0]||me):me;
  const ag=TRKV.ag,m0=trkMon(TRKV.wk),m1=trkMon(TRKV.wk+1),R=trkReport(ag,m0.getTime(),m1.getTime()),T=R.tk,last=new Date(m1.getTime()-864e5);
  const span=m0.toLocaleDateString([],{month:'short',day:'numeric'})+' &ndash; '+last.toLocaleDateString([],{month:'short',day:'numeric'});
  const wkl=TRKV.wk===0?'This week':TRKV.wk===-1?'Last week':Math.abs(TRKV.wk)+' weeks ago';
  const pick=own?`<select onchange="trkGo('ag',this.value)" aria-label="Agent">${ags.map(n=>`<option ${n===ag?'selected':''}>${esc(n)}</option>`).join('')}</select>`:`<b>${esc(ag)}</b>`;
  const pct=k=>T.n?Math.round(T[k]/T.n*100)+'%':'-';
  let h=`<div class="c trkh"><div class=trkhd>${av(ag,40)}<div class=trkn>${pick}<small>${wkl} &middot; ${span}</small></div><div class=trknav><button class="btn o sm" onclick="trkGo('wk',${TRKV.wk-1})">&#9664; Previous week</button><button class="btn o sm" onclick="trkGo('wk',${TRKV.wk+1})" ${TRKV.wk>=0?'disabled':''}>Next week &#9654;</button>${TRKV.wk?`<button class="btn sm" onclick="trkGo('wk',0)">This week</button>`:''}</div></div>
  <div class=g>${kpi('Hours on the clock',fmtHrs(R.hrs),R.worked+' day'+(R.worked===1?'':'s')+' &middot; '+R.ses+' session'+(R.ses===1?'':'s'))}${kpi('Longest session',fmtHrs(R.longest),R.long?R.long+' over 10 h':'none over 10 h')}${kpi('Working',T.n?trkF(T.w):'-',T.n?pct('w')+' of tracked time':'tracking starts with the next session')}${kpi('Sales Floor only',T.n?trkF(T.l):'-',T.n?pct('l')+' &middot; spoke '+trkF(T.s):'in the lobby without touching anything')}${kpi('Away / idle',T.n?trkF(T.h+T.p):'-',T.n?pct('h')+' away, '+pct('p')+' on screen':'portal open, no input')}${kpi('Interactions',T.n?Math.round(T.i).toLocaleString():'-',T.n&&T.n>30?Math.round(T.i/(T.n/60))+' an hour':'clicks, keys, scrolls')}</div>`;
  const notes=[];
  if(Math.abs(R.portal-(R.hrs+R.hand))>.15)notes.push(`The Leaderboard counts <b>${fmtHrs(R.portal)}</b> for this week (finished shifts plus anything logged by hand in Activity); the clock sessions below add up to ${fmtHrs(R.hrs)}${R.hand?' plus '+fmtHrs(R.hand)+' logged by hand':''}.`);
  if(R.overlap>.05)notes.push(`${fmtHrs(R.overlap)} of sessions overlapped (two devices on the clock at once); they are counted once here.`);
  if(R.stale)notes.push(`${R.stale} session${R.stale>1?'s':''} stopped without a clock-out (a closed laptop or a lost connection); counted up to the last heartbeat.`);
  if(!R.tracked)notes.push('The breakdown (working, Sales Floor, away, sections) is recorded from Oct 11 on. Earlier days show the clock sessions only.');
  h+=notes.length?`<div class=trkno>${notes.map(n=>`<p>${n}</p>`).join('')}</div>`:'';
  h+=`<div class=trklg><span><i class=tw></i>Working</span><span><i class=tl></i>Sales Floor only</span><span><i class=tp></i>On screen, no input</span><span><i class=th></i>Away</span></div></div>`;
  h+=`<div class="c sc"><table class=trkt><tr><th>Day<th>Sessions<th class=n>Hours<th>What the time was<th class=n>Spoke<th>Most time in</tr>${R.days.map(d=>{const has=d.ses.length||d.hand;
    const ss=d.ses.map(x=>`<span class=trks>${tmS(x.a)} &ndash; ${x.b>=Date.now()-6e4?'now':tmS(x.b)}${x.fl.length?` <em class=${x.fl.some(f=>/long|no heartbeat/.test(f))?'neg':'mut'}>${esc(x.fl.join(', '))}</em>`:''}</span>`).join('')+(d.hand?`<span class=trks>${fmtHrs(d.hand)} logged by hand</span>`:'');
    return`<tr class="${has?'':'trk0'}"><td><b>${esc(d.label)}</b><td>${ss||'<span class=mut>-</span>'}<td class=n>${has?fmtHrs(d.hrs+d.hand):'-'}${d.ov>.05?`<br><small class=neg>${fmtHrs(d.ov)} overlap</small>`:''}<td>${d.ses.length?trkBar(d.tk):''}<td class=n>${d.tk?trkF(d.tk.s):''}<td><small>${trkTop(d.tk)}</small></tr>`}).join('')}</table></div>`;
  if(T.n){const sec=Object.entries(T.t).sort((a,b)=>b[1]-a[1]);
    h+=`<div class=g2 style="margin-top:14px"><div class=c><h4>Where the time went</h4>${sec.length?hb(sec.slice(0,8).map(([k,v])=>[k,Math.round(v)]),v=>trkF(v)):'<p class=mut>Nothing yet.</p>'}</div><div class=c><h4>On the Sales Floor</h4><div class=trkf><div><b>${trkF(T.l+0)}</b><small>in the lobby without input</small></div><div><b>${trkF(T.m)}</b><small>with the mic on</small></div><div><b>${trkF(T.s)}</b><small>speaking</small></div><div><b>${trkF(T.g)}</b><small>in the 3D games</small></div></div></div></div>`}
  return h}
(function(){if(document.getElementById('trkcss'))return;const st=document.createElement('style');st.id='trkcss';st.textContent='.trkh .trkhd{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}.trkh .trkn{display:flex;flex-direction:column;gap:3px;min-width:180px}.trkh .trkn select{padding:8px 10px;border-radius:10px;border:1px solid var(--ln,rgba(255,255,255,.14));background:#0f0f15;color:var(--tx);font:800 13px Verdana,sans-serif;letter-spacing:.04em}.trkh .trkn small{color:var(--mut);font:700 10px Verdana,sans-serif;letter-spacing:.12em;text-transform:uppercase}.trkh .trknav{margin-left:auto;display:flex;gap:6px;flex-wrap:wrap}.trkno{margin-top:12px;padding:10px 12px;border-radius:12px;background:rgba(255,176,32,.07);border:1px solid rgba(255,176,32,.28)}.trkno p{margin:3px 0;font:700 11px Verdana,sans-serif;line-height:1.55;color:#f2dcae}.trklg{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font:700 10px Verdana,sans-serif;color:var(--mut);letter-spacing:.06em}.trklg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}.trkbar{display:flex;width:100%;min-width:140px;height:12px;border-radius:6px;overflow:hidden;background:rgba(255,255,255,.06)}.trkbar i{display:block;height:100%}.tw{background:#3ddc97}.tl{background:#5ac8ff}.tp{background:#ffb020}.th{background:#5b5560}.trknt{font:700 10px Verdana,sans-serif;color:var(--mut);letter-spacing:.06em}.trkt td{vertical-align:top}.trkt .trks{display:block;font:700 11px Verdana,sans-serif;white-space:nowrap;margin:1px 0}.trkt .trks em{font-style:normal;font-size:10px;white-space:normal}.trkt tr.trk0 td{opacity:.45}.trkf{display:grid;grid-template-columns:1fr 1fr;gap:10px}.trkf div{padding:10px;border-radius:12px;background:rgba(255,255,255,.04)}.trkf b{display:block;font:900 20px Verdana,sans-serif;color:#fff}.trkf small{color:var(--mut);font:700 10px Verdana,sans-serif}@media(max-width:700px){.trkh .trknav{margin-left:0}.trkt .trks{white-space:normal}}';document.head.appendChild(st)})();
/*TRKend*/
