/*B3start*/
/* v119 batch 3: portal themes as Shop / Battle Pass items (kind U) with a Custom Designer, a Settings page (appearance,
   performance, alerts and sound, intro song upload, display, goals and tracking, data, account, shortcuts, about),
   a simpler Leaderboard (one table with every number and the milestone tiers), and a one-screen Command Deck. */
/* ---------- themes ---------- */
const TH=[{n:'Crimson Ops',a:'#ff1f4f',a2:'#ffcf40',bg:'#0b0b10',card:'#1a1a22'},{n:'Midnight Blue',a:'#3d7bff',a2:'#7fd1ff',bg:'#070a14',card:'#141a2a'},
 {n:'Emerald Ops',a:'#19d48a',a2:'#c6ff6a',bg:'#050f0b',card:'#122019'},{n:'Ultraviolet',a:'#a45cff',a2:'#ff6bd6',bg:'#0b0714',card:'#1b1428'},
 {n:'Gold Rush',a:'#ffb020',a2:'#fff1a8',bg:'#0e0b05',card:'#211a0e'},{n:'Arctic',a:'#4fc8ff',a2:'#e8f7ff',bg:'#061016',card:'#122029'},
 {n:'Sunset Blaze',a:'#ff6a2b',a2:'#ffcf40',bg:'#120806',card:'#24140f'},{n:'Stealth Mono',a:'#e6e6ea',a2:'#9a9aa8',bg:'#09090b',card:'#18181c'},
 {n:'Custom Designer',a:'#ff1f4f',a2:'#ffcf40',bg:'#0b0b10',card:'#1a1a22',custom:1},{n:'Holo Prism',a:'#ff3fd0',a2:'#3fffe0',bg:'#08070f',card:'#171427'}];
try{ECR.U={1:'c',2:'u',3:'u',4:'r',5:'r',6:'e',7:'e',8:'l',9:'m'};EKL.U='Portal theme';EKI.U='&#127912;';
 ECATS.splice(ECATS.length-1,0,{id:'ui',n:'Themes',d:'Portal color themes and the Custom Designer',keys:'U',ic:'&#127912;'});
 BPX.push([12,'U',2],[25,'U',5],[40,'U',7],[60,'U',9]);ECAT=null}catch(e){}
{const _cos=ecoCos;ecoCos=function(){const c=Object.assign({},_cos());c.U={};TH.forEach((t,i)=>{if(i)c.U[i]=t.n});return c}}
{const _tile=ecoTile;ecoTile=function(it,cls){if(it&&it.k==='U'){const t=TH[it.v]||TH[0];return`<span class="ecit thsw${cls?' '+cls:''}" style="${thVars(t)}"><i></i><i></i><i></i></span>`}return _tile.apply(this,arguments)}}
function thHexRgb(h){h=String(h||'').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h.slice(0,6),16);return isFinite(n)?[(n>>16)&255,(n>>8)&255,n&255]:[255,31,79]}
function thMix(a,b,k){const A=thHexRgb(a),B=thHexRgb(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*k).toString(16).padStart(2,'0')).join('')}
function thKey(){return'owq_theme_'+String(typeof WHO!=='undefined'&&WHO?WHO:'x').replace(/\W/g,'')}
function thGet(){try{const o=JSON.parse(localStorage.getItem(thKey())||'null');if(o&&typeof o==='object')return o}catch(e){}return{v:0}}
function thOwned(v){if(!v)return true;try{return ecoOwned('U',v)}catch(e){return false}}
function thColors(o){o=o||thGet();let t=TH[o.v]||TH[0];if(o.v&&!thOwned(o.v))t=TH[0];if(t.custom&&o.c)t=Object.assign({},t,o.c);return t}
var THS={orig:null,cur:null};
function thMap(txt,t){if(!t||t===TH[0])return txt;const A=thHexRgb(t.a).join(','),A2=thHexRgb(t.a2).join(','),dk=thMix(t.a,'#000000',.62),lt=thMix(t.a,'#ffffff',.35);
 return txt.replace(/#ff1f4f/gi,t.a).replace(/rgba\(\s*255\s*,\s*31\s*,\s*79\s*,/g,'rgba('+A+',').replace(/255,31,79/g,A).replace(/#ffcf40/gi,t.a2).replace(/rgba\(\s*255\s*,\s*207\s*,\s*64\s*,/g,'rgba('+A2+',')
  .replace(/#b0102f|#b3123a|#c8102e|#7a0d29/gi,dk).replace(/#ff6b8a|#ff8da3|#ffa3b8/gi,lt).replace(/#5c0c20|#3a0614|#2a0510/gi,thMix(t.a,t.bg,.78))
  .replace(/--bg:#0b0b10/g,'--bg:'+t.bg).replace(/--card:#1a1a22/g,'--card:'+t.card).replace(/#0f0f15/gi,thMix(t.bg,t.card,.45)).replace(/#0d0d14/gi,thMix(t.bg,t.card,.3)).replace(/#12121a|#121219|#16161f/gi,thMix(t.bg,t.card,.6))}
function thApply(o){try{const t=o===0?TH[0]:thColors(o);THS.cur=t===TH[0]?null:t;
 if(!THS.orig)THS.orig=[...document.querySelectorAll('style')].filter(s=>!s.dataset.owqth&&s.textContent.length>2000);
 let st=document.getElementById('owqth');if(!THS.cur){if(st)st.remove();THS.orig.forEach(s=>{s.media=''});document.documentElement.removeAttribute('data-theme-n');return}
 const css=THS.orig.map(s=>s.textContent).join('\n');if(!st){st=document.createElement('style');st.id='owqth';st.dataset.owqth='1';document.head.appendChild(st)}st.textContent=thMap(css,THS.cur);THS.orig.forEach(s=>{s.media='not all'});
 document.documentElement.setAttribute('data-theme-n',THS.cur.n);try{document.querySelector('meta[name=theme-color]').setAttribute('content',THS.cur.bg)}catch(e){}}catch(e){}}
function thSet(v,c){const o={v:+v||0};if(c)o.c=c;else{const p=thGet();if(p.c)o.c=p.c}try{localStorage.setItem(thKey(),JSON.stringify(o))}catch(e){}thApply(o);go()}
{const _sm=owqSetMain;owqSetMain=function(h){return _sm.call(this,THS.cur?thMap(h,THS.cur):h)}}
{const _nr=navRender;navRender=function(){const r=_nr.apply(this,arguments);if(THS.cur){const n=document.getElementById('nav');if(n)n.innerHTML=thMap(n.innerHTML,THS.cur)}return r}}
/* the Shop item card: themes open their own preview with Apply */
{const _it=ecoItem;ecoItem=function(id){const it=ecoIt(id);if(!it||it.k!=='U')return _it.apply(this,arguments);const t=TH[it.v]||TH[0],own=thOwned(it.v),pr=ecoPrice(it),bx=BPX.find(r=>r[1]==='U'&&r[2]===it.v);
 document.getElementById('md').innerHTML=`<div class=mb onclick="if(event.target===this)closeM()"><div class="c bxm thm" style="--rc:${ERC[it.rar]}"><div class=bxmr>${it.rar.toUpperCase()} &middot; PORTAL THEME</div><h4>${esc(t.n)}</h4>${thPreview(t)}
 <p class=mut>${t.custom?'Pick your own accent, highlight and background colors in Settings &gt; Appearance.':'Recolors your whole portal: menus, cards, charts and buttons. Only you see your theme.'}${bx?' Unlocks free at Battle Pass level '+bx[0]+'.':''}</p>
 <div class=pf-mb>${own?`<button class=btn onclick="closeM();${t.custom?"openTab('Settings')":`thSet(${it.v})`}">${t.custom?'Open the designer':'Apply theme'}</button>`:it.rar==='mythic'?'<span class=mut>Crates or the Battle Pass only.</span>':`<button class=btn onclick="ecoBuyAsk('${esc(id)}')">Buy for ${ecoFmt(pr.p)} credits</button>`} <button class="btn o" onclick="closeM()">Close</button></div></div></div>`}}
function thNo(c){c=String(c||'').toLowerCase();return c==='#ff1f4f'?'#ff1f4e':c==='#ffcf40'?'#ffcf41':c==='#0b0b10'?'#0b0b11':c==='#0f0f15'?'#0f0f16':c}
function thVars(t){return`--a:${thNo(t.a)};--a2:${thNo(t.a2)};--bg:${thNo(t.bg)};--cd:${thNo(t.card)}`}
function thPreview(t){return`<div class=thpv style="${thVars(t)}"><div class=thps></div><div class=thpm><b></b><div class=thpk><i></i><i></i><i></i></div><div class=thpc><span></span><span></span><span></span><span></span></div></div></div>`}
/* ---------- performance ---------- */
function pfmGet(){try{return localStorage.getItem('owq_perf')||'auto'}catch(e){return'auto'}}
function pfmApply(m){const H=document.documentElement;H.classList.toggle('perf-saver',m==='saver');H.classList.toggle('perf-bal',m==='balanced');
 try{const gq=m==='saver'?'still':m==='balanced'?'low':'auto';localStorage.setItem('owq_gq',gq);localStorage.setItem('owq_gfx',m==='saver'?'low':m==='balanced'?'medium':m==='high'?'high':'auto')}catch(e){}
 try{if(m==='saver')setMotion('reduce');else if(typeof MOTION!=='undefined'&&MOTION==='reduce'&&localStorage.getItem('owq_perf_rm')!=='1')setMotion('')}catch(e){}}
function pfmSet(m){try{localStorage.setItem('owq_perf',m)}catch(e){}pfmApply(m);toast(m==='saver'?'Battery saver: animations and 3D effects are dialed down':m==='balanced'?'Balanced performance':m==='high'?'High quality':'Automatic performance',1);go()}
try{pfmApply(pfmGet())}catch(e){}
{const _sr=synRefresh;synRefresh=function(hard){if(!hard&&pfmGet()==='saver'){clearTimeout(THS.srt);THS.srt=setTimeout(()=>_sr(0),2500);return}return _sr.apply(this,arguments)}}
/* ---------- alerts: popups on / off ---------- */
function alPopOn(){try{return localStorage.getItem('owq_alpop')!=='0'}catch(e){return true}}
{const _pa6=pushAlert;pushAlert=function(a,quiet){if(!quiet&&!alPopOn()&&!(a&&a.sev==='crit'))quiet=true;return _pa6.call(this,a,quiet)}}
/* ---------- display ---------- */
function dspApply(){let o={};try{o=JSON.parse(localStorage.getItem('owq_disp')||'{}')||{}}catch(e){}const H=document.documentElement;H.classList.toggle('dense',o.dense===1);H.style.fontSize='';try{document.body.style.fontSize=o.fs&&o.fs!==14?o.fs+'px':''}catch(e){}}
function dspSet(k,v){let o={};try{o=JSON.parse(localStorage.getItem('owq_disp')||'{}')||{}}catch(e){}o[k]=v;try{localStorage.setItem('owq_disp',JSON.stringify(o))}catch(e){}dspApply();go()}
try{dspApply()}catch(e){}
/* ---------- intro songs: anyone can upload an mp3 / mp4 / audio file; a 12 second clip plays at their login ---------- */
var SNG={loaded:0,mine:null,busy:0,file:null,buf:null,st:0,err:''};
/* a clip is split over several song documents (each document holds at most 256 KB) */
async function sngLoad(){if(SNG.loaded)return;SNG.loaded=1;try{const db=await globalThis.claude.use('db');if(!db)return;const r=await db.collection('songs').get(),M={},P={};
 (r.docs||[]).forEach(d=>{const x=d.data&&d.data();if(!x)return;if(x.parts&&x.n)M[x.k||d.id]=x;else if(x.k&&typeof x.d==='string')(P[x.k]||(P[x.k]=[]))[+x.i||0]=x.d});
 Object.keys(M).forEach(k=>{const m=M[k],L=P[k]||[];if(L.length<m.parts)return;const src=L.slice(0,m.parts).join('');if(/^data:audio\//.test(src)){SONGS[m.n]=src;if(m.n==='Cole Leckey')SONGS['Agency Owner']=src}})}catch(e){}}
setTimeout(()=>{try{sngLoad()}catch(e){}},2500);
function sngWav(buf,start,len){const sr=22050,ch=buf.numberOfChannels,s0=Math.floor(start*buf.sampleRate),n0=Math.min(buf.length-s0,Math.floor(len*buf.sampleRate)),n=Math.max(1,Math.floor(n0*sr/buf.sampleRate)),o=new DataView(new ArrayBuffer(44+n*2));
 const W=(p,s)=>{for(let i=0;i<s.length;i++)o.setUint8(p+i,s.charCodeAt(i))};W(0,'RIFF');o.setUint32(4,36+n*2,true);W(8,'WAVE');W(12,'fmt ');o.setUint32(16,16,true);o.setUint16(20,1,true);o.setUint16(22,1,true);o.setUint32(24,sr,true);o.setUint32(28,sr*2,true);o.setUint16(32,2,true);o.setUint16(34,16,true);W(36,'data');o.setUint32(40,n*2,true);
 const C=[];for(let c=0;c<ch;c++)C.push(buf.getChannelData(c));let pk=0;const tmp=new Float32Array(n);for(let i=0;i<n;i++){const j=s0+Math.floor(i*buf.sampleRate/sr);let v=0;for(let c=0;c<ch;c++)v+=C[c][j]||0;v/=ch;const f=Math.min(1,i/(sr*.4),(n-i)/(sr*1.2));v*=f;tmp[i]=v;pk=Math.max(pk,Math.abs(v))}
 const g=pk>0?Math.min(1.6,.92/pk):1;for(let i=0;i<n;i++)o.setInt16(44+i*2,Math.max(-1,Math.min(1,tmp[i]*g))*32767,true);
 let b='';const u=new Uint8Array(o.buffer);for(let i=0;i<u.length;i+=32768)b+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return'data:audio/wav;base64,'+btoa(b)}
async function sngPick(inp){const f=inp&&inp.files&&inp.files[0];SNG.err='';if(!f)return;if(f.size>60e6){SNG.err='That file is too big (60 MB max).';stPaint();return}SNG.busy=1;stPaint();
 try{const ab=await f.arrayBuffer(),ac=new(window.AudioContext||window.webkitAudioContext)();SNG.buf=await new Promise((ok,no)=>{const p=ac.decodeAudioData(ab,ok,no);if(p&&p.then)p.then(ok,no)});try{ac.close()}catch(e){}SNG.file=f.name;SNG.st=0}
 catch(e){SNG.buf=null;SNG.err='Could not read that file. Use an mp3, m4a, wav or mp4 with sound.'}SNG.busy=0;stPaint()}
var SNGA=null;function sngPlay(src){try{if(SNGA){SNGA.pause();SNGA=null}SNGA=new Audio(src);SNGA.volume=.9;SNGA.play().catch(()=>{})}catch(e){}}
function sngPreview(){if(!SNG.buf)return;const st=+((document.getElementById('sg_st')||{}).value||0);SNG.st=Math.max(0,Math.min(st,Math.max(0,SNG.buf.duration-1)));sngPlay(sngWav(SNG.buf,SNG.st,12))}
async function sngSave(){if(!SNG.buf||SNG.busy)return;SNG.busy=1;stPaint();const src=sngWav(SNG.buf,SNG.st||+((document.getElementById('sg_st')||{}).value||0),12),n=WHO;
 try{const db=await globalThis.claude.use('db');if(!db)throw 0;const k=fileKey(n),C=[];for(let i=0;i<src.length;i+=200000)C.push(src.slice(i,i+200000));
 for(let i=0;i<C.length;i++)await db.doc('songs/'+k+'_p'+i).set({k,i,d:C[i]});await db.doc('songs/'+k).set({n,k,parts:C.length,file:String(SNG.file||'').slice(0,80),at:Date.now()});SONGS[n]=src;if(n==='Cole Leckey')SONGS['Agency Owner']=src;SNG.buf=null;toast('Intro song saved. It plays next time you sign in.',1)}
 catch(e){SNG.err='Could not save the song. Try a shorter clip.'}SNG.busy=0;stPaint()}
async function sngRemove(){try{const db=await globalThis.claude.use('db');await db.doc('songs/'+fileKey(WHO)).delete();for(let i=0;i<8;i++){try{await db.doc('songs/'+fileKey(WHO)+'_p'+i).delete()}catch(e){}}delete SONGS[WHO];toast('Intro song removed. The default plays again after a reload.',1)}catch(e){toast('Could not remove it')}stPaint()}
/* ---------- the Settings page ---------- */
var STG={sec:'Appearance'};
const STS=['Appearance','Performance','Alerts & Sound','Intro Song','Display','Goals & Tracking','Data','Account','Shortcuts','About'];
function stPaint(){if(tab==='Settings'){const e=document.getElementById('stb');if(e)e.innerHTML=stBody();else go()}}
function stRow(l,d,c){return`<div class=str><div><b>${l}</b>${d?`<small>${d}</small>`:''}</div><div class=stc>${c}</div></div>`}
function stSeg(cur,arr,fn){return`<div class=seg>${arr.map(([k,l])=>`<button class="${cur===k?'on':''}" onclick="${fn}('${k}')">${l}</button>`).join('')}</div>`}
function stBody(){const s=STG.sec;let h='';
 if(s==='Appearance'){const o=thGet(),cur=thOwned(o.v)?o.v:0;h=`<h4>Theme</h4><p class=mut>Themes recolor your portal. Get more in the Shop (Themes) or unlock them in the Battle Pass. Only you see your theme.</p><div class=thg>${TH.map((t,i)=>{const own=thOwned(i);return`<button class="thc ${cur===i?'on':''} ${own?'':'lk'}" onclick="${own?(t.custom?`STG.cd=1;stPaint()`:`thSet(${i})`):`openTab('Shop');ECO.tab='all'`}" style="${thVars(t)}">${thPreview(t)}<b>${esc(t.n)}</b><small>${cur===i?'IN USE':own?(t.custom?'DESIGN':'APPLY'):(i===9?'CRATES / BATTLE PASS':'GET IN SHOP')}</small></button>`}).join('')}</div>`;
  if(thOwned(8)){const c=o.c||{a:'#ff1f4f',a2:'#ffcf40',bg:'#0b0b10',card:'#1a1a22'};h+=`<h4 style="margin-top:18px">Custom Designer</h4><div class=thcd>${[['a','Accent'],['a2','Highlight'],['bg','Background'],['card','Cards']].map(([k,l])=>`<label>${l}<input type=color id=thc_${k} value="${esc(thNo(c[k]||TH[0][k]))}"></label>`).join('')}<button class=btn onclick="thSet(8,{a:thc_a.value,a2:thc_a2.value,bg:thc_bg.value,card:thc_card.value})">Apply my design</button></div>`}
  else h+=`<p class=mut style="margin-top:14px">&#128274; The <b>Custom Designer</b> (legendary, in the Shop) lets you pick every color yourself.</p>`}
 else if(s==='Performance'){const m=pfmGet();h=stRow('Performance mode','Slow the portal down on a weaker computer or phone so it never bottlenecks. Saved on this device.',stSeg(m,[['auto','Automatic'],['high','High quality'],['balanced','Balanced'],['saver','Battery saver']],'pfmSet'))+
  `<div class=stn><b>Battery saver</b> turns off animations, blur and glow effects, renders the login and the 3D Sales Floor at low quality and refreshes live data less often. <b>Balanced</b> keeps animations with lighter 3D. <b>High quality</b> renders everything at full detail.</div>`+
  stRow('Reduce motion','Fewer moving parts on every page.',stSeg(typeof MOTION!=='undefined'&&MOTION==='reduce'?'on':'off',[['off','Off'],['on','On']],'stMotion'))}
 else if(s==='Alerts & Sound'){h=stRow('Alert voice','The voice that reads alerts out loud.',stSeg(alVoice(),[['imp','Important only'],['all','All alerts'],['off','Off']],'stVoice'))+stRow('Popups','Popups in the corner. Off still keeps every alert in the bell (critical ones still pop).',stSeg(alPopOn()?'on':'off',[['on','On'],['off','Off']],'stPop'))+
  stRow('Sound effects','Beeps and chimes for alerts.',stSeg(D.snd?'off':'on',[['on','On'],['off','Off']],'stSnd'))}
 else if(s==='Intro Song'){const has=!!SONGS[WHO];h=`<p class=mut>Upload an mp3, m4a, wav or an mp4 video with sound. Pick where the best part starts: a 12 second clip plays when you sign in, on every device.</p>`+
  stRow('Current song',has?'You have an intro song.':'Using the default.',has?`<button class="btn o sm" onclick="sngPlay(SONGS[WHO])">Play</button> <button class="btn o sm" onclick="sngRemove()">Remove</button>`:'')+
  stRow('Upload','',`<input type=file id=sg_f accept="audio/*,video/mp4,.mp3,.m4a,.mp4,.wav" onchange="sngPick(this)">`)+
  (SNG.busy?'<p class=mut>Working on it...</p>':'')+(SNG.buf?stRow(esc(SNG.file||'Your file'),Math.round(SNG.buf.duration)+' seconds long. Start the clip at:',`<input id=sg_st type=number min=0 max=${Math.max(0,Math.floor(SNG.buf.duration-1))} value=${SNG.st||0} style="width:90px"> s <button class="btn o sm" onclick="sngPreview()">Preview</button> <button class="btn sm" onclick="sngSave()">Save as my intro</button>`):'')+(SNG.err?`<p class=cherr>${esc(SNG.err)}</p>`:'')}
 else if(s==='Display'){let o={};try{o=JSON.parse(localStorage.getItem('owq_disp')||'{}')||{}}catch(e){}h=stRow('Density','Compact fits more on the screen.',stSeg(o.dense===1?'c':'n',[['n','Comfortable'],['c','Compact']],'stDense'))+stRow('Text size','',stSeg(String(o.fs||14),[['13','Small'],['14','Normal'],['15','Large'],['16','Extra large']],'stFs'))}
 else if(s==='Goals & Tracking'){const own=bizOwner();h=own?`<div class=stf>${[['st_gl','Monthly issued premium goal ($)',D.goal||60000],['st_hd','Hours goal per workday (whole team)',D.hDay||50],['st_hp','Licensed agents sharing that goal',D.hPpl||4],['st_lt','Weekly lead spend target ($)',D.lT||250],['st_fs','Sales Floor start time (late after 5 min)',D.flStart||'11:00','time']].map(([id,l,v,t])=>`<label>${l}<input id=${id} type=${t||'number'} value="${esc(v)}"></label>`).join('')}</div><button class=btn onclick="stGoals()">Save for the team</button><p class=mut style="margin-top:8px">These drive Business Analytics (the growth path), the Command Deck goal ring and the late popup for everyone.</p>`:'<p class=mut>Goals are set by the Agency Owner.</p>'}
 else if(s==='Data'){h=stRow('Export','Download your data as spreadsheets (CSV opens in Google Sheets or Excel).',['policies','expenses','activity','income'].map(k=>`<button class="btn o sm" onclick="stCsv('${k}')">${k[0].toUpperCase()+k.slice(1)}</button>`).join(' '))+(bizOwner()?stRow('Backup and restore','Copy all data as text, or restore from a backup.','<button class="btn o sm" onclick="openM(\'S\')">Open backup</button>'):'')+stRow('Privacy','Hours, activity and portal use are tracked to run the leaderboard and time reports.','')}
 else if(s==='Account'){h=stRow('Signed in as',esc(WHO),'<button class="btn o sm" onclick="lockView()">Lock station</button>')+(bizOwner()&&window.OWQC&&OWQC.team?stRow('Team access','Who can open the portal.','<button class="btn o sm" onclick="OWQC.team()">Open Team Access</button>'):'')+(window.OWQC&&OWQC.signOut?stRow('Google account','Sign this device out of the portal.','<button class="btn o sm" onclick="OWQC.signOut()">Sign out</button>'):'')}
 else if(s==='Shortcuts'){h=[['Ctrl / Cmd + K','Search or jump to anything'],['Esc','Close a window'],['Enter','Send a chat message or ask Claude'],['Shift + Enter','New line'],['Arrow keys','Pick an operator on the login screen']].map(r=>stRow(`<kbd>${r[0]}</kbd>`,'',esc(r[1]))).join('')}
 else if(s==='About'){h=stRow('Version',esc(String(window.OWQ_BUILD||'dev')),'')+stRow('Install the app','Put OWQ Station on your desktop or phone.',window.OWQ_INSTALL?'<button class="btn o sm" onclick="OWQ_INSTALL()">Install</button>':'')}
 return h}
function stMotion(v){try{localStorage.setItem('owq_perf_rm',v==='on'?'1':'0')}catch(e){}setMotion(v==='on'?'reduce':'');go()}
function stVoice(v){alVoiceSet(v);stPaint()}
function stPop(v){try{localStorage.setItem('owq_alpop',v==='off'?'0':'1')}catch(e){}stPaint()}
function stSnd(v){D.snd=v==='off'?1:0;save();stPaint()}
function stDense(v){dspSet('dense',v==='c'?1:0)}function stFs(v){dspSet('fs',+v)}
function stGoals(){const g=id=>document.getElementById(id);D.goal=+g('st_gl').value||D.goal;D.hDay=Math.max(1,+g('st_hd').value||50);D.hPpl=Math.max(1,Math.round(+g('st_hp').value||4));D.lT=Math.max(1,+g('st_lt').value||250);D.flStart=/^\d{2}:\d{2}$/.test(g('st_fs').value)?g('st_fs').value:'11:00';save();toast('Saved for the team',1);go()}
function stCsv(k){const L=(D[k]||[]).map(x=>{const o={};Object.keys(x).forEach(f=>{if(f[0]!=='_'&&typeof x[f]!=='object')o[f]=x[f]});return o}),cols=[...new Set(L.flatMap(Object.keys))],q=v=>{v=v==null?'':String(v);return/[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
 const csv=[cols.join(',')].concat(L.map(r=>cols.map(c=>q(r[c])).join(','))).join('\n');try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='owq-'+k+'-'+dkey(new Date())+'.csv';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}catch(e){toast('Could not export')}}
function stPage(){return hd('Settings','Make the portal yours: theme, performance, alerts, your intro song and more.',[])+`<div class=stw><nav class=stn2>${STS.map(x=>`<button class="${STG.sec===x?'on':''}" onclick="STG.sec='${x}';go()">${x}</button>`).join('')}</nav><div class="c stbx"><h4>${STG.sec}</h4><div id=stb>${stBody()}</div></div></div>`}
views['Settings']=[stPage,'&#9881;','SYSTEM','Theme, performance, alerts, goals'];
try{SYC.push('hDay','hPpl','flStart')}catch(e){}
/* theme follows the person: their saved theme after sign-in, the default on the login screen */
{const _ri3=railInit;railInit=function(){const r=_ri3.apply(this,arguments);try{thApply(thGet());dspApply()}catch(e){}return r}}
{const _lv3=lockView;lockView=function(){try{thApply(0)}catch(e){}return _lv3.apply(this,arguments)}}
/* ---------- Leaderboard: one table with every number ---------- */
const LBC=[['pts','Points'],['iap','Issued Premium'],['pol','Policies'],['hrs','Hours'],['app','Appointments']];
lbRankings=function(){const R=lbRank(LBT,LBM),all=lbStats('0000-00-00',today),life=nm=>all.find(x=>x.nm===nm)||{},rows=agentRows(),wk=nm=>rows.find(r=>r.nm===nm)||{},top={},col=['#ffc83d','#c0c6d4','#c97b4a'];
 LBC.forEach(([m])=>{top[m]=Math.max(0,...R.map(x=>+x[m]||0))});
 const head=hd('Leaderboard','Friendly competition. Every number comes from the policies and activity your agents log.',[['View agents',"openTab('Agency Performance','Agents')"]])+lbView()+`<div class=lbh><div class=lbg><label>Time period</label>${lbSeg(LBT,['This Week','This Month'].map(x=>[x,x]),'lbT')}</div><div class=lbg><label>Rank by</label>${lbSeg(LBM,LBC,'lbMet')}</div></div>`;
 if(!R.length)return head+'<div class=c><p class=mut>Add agents in Agency Performance, then Agents.</p></div>';
 const ms=(m,nm)=>{if(!MST[m])return'';const L=life(nm),v=m==='pts'?(L.base||0):(+L[m]||0),tiers=MST[m][2],t=msTier(m,v),nx=tiers[t],pv=t?tiers[t-1]:0,pc=nx?Math.round((v-pv)/(nx-pv)*100):100,f=MST[m][3];
  return`<span class=lbms title="Lifetime ${f(v)} &middot; milestone ${t} of ${tiers.length}${nx?' &middot; next '+f(nx)+' pays +'+msRew(m,t)+' pts':' &middot; maxed'}"><u><i style="width:${pc}%"></i></u><em>${t>=tiers.length?'MAX':'M'+t}</em></span>`};
 const mv=x=>x.mv==null?'<span class=mut>-</span>':x.mv>0?`<span class=mvu>&#9650;${x.mv}</span>`:x.mv<0?`<span class=mvd>&#9660;${-x.mv}</span>`:'<span class=mut>=</span>';
 const body=R.map(x=>{const t=tierOf((life(x.nm).pts)||0),w=wk(x.nm),g=w.goal?w.w/w.goal:null;return`<tr class="lbrow${x.rank<=3?' lbtop':''}${x.nm===WHO?' lbme':''}" style="--rc:${x.rank<=3?col[x.rank-1]:'#6d6d7a'}"><td class=lbrk><span class=lbrn>${x.rank}</span>${mv(x)}</td>
  <td class=lbag onclick="${agA(x.nm)}">${av(x.nm,34)}<span><b>${esc(x.nm)}${openShift(x.nm)?'<i class=ondot title="On the clock"></i>':''}</b><small style="color:${t.c}">${t.n}${t.next?' &middot; '+t.to.toLocaleString()+' to '+t.next:''}</small></span></td>
  ${LBC.map(([m])=>`<td class="n lbx${LBM===m?' on':''}${top[m]>0&&x[m]===top[m]?' lead':''}"><b>${LBM_D[m][1](x[m]||0)}</b>${ms(m,x.nm)}</td>`).join('')}<td class=n>${g===null?'<span class=mut>-</span>':`<b class="${g>=1?'pos':''}">${Math.round(g*100)}%</b>`}</td></tr>`}).join('');
 const table=`<div class="c sc lbt"><table><tr><th>Rank</th><th>Agent</th>${LBC.map(([m,l])=>`<th class="n${LBM===m?' on':''}" onclick="lbMet('${m}')" title="Rank by ${l}">${l}${LBM===m?' &#9660;':''}</th>`).join('')}<th class=n>Week goal</th></tr>${body}</table><small class=mut>Bars under each number are lifetime milestones (M = milestone reached). Hover for the next target and bonus.</small></div>`;
 const pairs=[];for(let i=1;i<R.length;i++){const a=R[i-1],b=R[i],g=a[LBM]-b[LBM];pairs.push({a,b,g,rel:a[LBM]>0?g/a[LBM]:1})}pairs.sort((x,y)=>x.rel-y.rel);const q=pairs[0],md=LBM_D[LBM];
 const chase=q?`<div class=c><h4>The Chase</h4><p>${q.g===0?`<b>${esc(q.b.nm)}</b> and <b>${esc(q.a.nm)}</b> are tied for #${q.a.rank}.`:`<b>${esc(q.b.nm)}</b> is ${md[1](q.g)} behind <b>${esc(q.a.nm)}</b> for #${q.a.rank}.`}</p></div>`:'';
 const gr=rows.filter(r=>r.goal),tg=sum(gr,r=>r.goal),tw=sum(gr,r=>r.w);
 const team=`<div class=c><h4>Team Weekly Goal</h4>${tg?`<div class=gp><div class=gh><b>Whole team</b><span>${$(tw)} of ${$(tg)}<em>${Math.round(tw/tg*100)}%</em></span></div><i><b style="width:${Math.min(100,tw/tg*100)}%;background:${tw>=tg?'#3ddc97':'#ff1f4f'}"></b></i></div>`:'<p class=mut>Set weekly goals on your agents.</p>'}</div>`;
 const best=f=>R.slice().sort((a,b)=>f(b)-f(a))[0],aw=[['&#9733;','Top Closer',best(x=>x.pol),x=>x.pol,x=>x.pol+' policies'],['&#9719;','Iron Hours',best(x=>x.hrs),x=>x.hrs,x=>fmtHrs(x.hrs)],['&#9650;','Premium King',best(x=>x.iap),x=>x.iap,x=>$(x.iap)],['&#9742;','Most Appointments',best(x=>x.app),x=>x.app,x=>x.app+' held']];
 const awards=`<div class="c lbaw"><h4>Awards</h4>${aw.map(a=>{const w=a[2]&&a[3](a[2])>0?a[2]:null;return`<div class=lbawr><i>${a[0]}</i><span><small>${a[1]}</small><b>${w?esc(w.nm):'Unclaimed'}</b></span><em>${w?a[4](w):''}</em></div>`}).join('')}</div>`;
 return head+table+`<div class=apx-r3>${chase}${team}${awards}</div><small style="margin-top:8px;display:block">Points: 1 per $100 of issued premium, 20 per policy placed, 2 per appointment held, plus milestone bonuses. Tiers use all-time points. Move compares with the last period.</small>`};
/* ---------- Command Deck: everything on one screen ---------- */
var DKT='Briefing';
function dkPulse(){const P=pulseData(),w=k=>PVW[k]==null?0:PVW[k],met=(k,lab,tgt)=>`<div class=mtr data-m=${k}><small>${lab}</small><b data-c=${k}>0<em>/ ${tgt}</em></b><div class=bar><i data-k=${k} style="width:${w(k)}%"></i></div></div>`;
 return`<div class="c pls dkpl" id=pls><div class=ph><h4>Live Pulse &middot; Today</h4><span class=live>LIVE</span></div><div class=dayb><i data-k=day style="width:${w('day')}%"></i></div><div class=dayl><span>8 AM</span><b data-t=day>-</b><span>8 PM</span></div>
 <div class=mt>${met('ap','Premium issued','$'+P.dAP.toLocaleString())}${met('pol','Policies','3')}${met('con','Contacts','40')}${met('app','Appointments','5')}</div>
 <div class=dkag>${P.ag.slice(0,6).map((a,i)=>`<div class="par ${a.on?'on':'off'}" data-a=${i}><b>${esc(a.nm.split(' ')[0])}</b><div class=bar><i data-k=ag${i} style="width:${w('ag'+i)}%"></i></div><span data-t=ag${i}>-</span></div>`).join('')}</div>
 <div class=pace><div class=bar><i data-k=month style="width:${w('month')}%"></i></div><span class=mk data-k=pace style="left:${w('pace')}%"></span><p><span data-t=mo>-</span><b data-t=pc>-</b></p></div></div>`}
function dkTabs(){const opt=fn=>{try{return typeof fn==='function'?fn():''}catch(e){return''}},R=agentRows(),T=['Briefing','Alerts','Agent Progress','Morning Recognition','Challenge'];
 const b=DKT==='Alerts'?`<div id=dal>${opt(latestAl)}</div><button class="btn o sm" onclick="toggleRail(true)">Open alert center</button>`:DKT==='Agent Progress'?gpBars(R):DKT==='Morning Recognition'?opt(typeof mrDeck==='function'?mrDeck:null):DKT==='Challenge'?opt(typeof chDeck==='function'?chDeck:null):
  brief().map(x=>`<div class="bl ${x[0]}"><i></i><span>${x[1]}</span></div>`).join('')+`<div id=chbf>${opt(typeof chBrief==='function'?chBrief:null)}</div><button class="btn o sm" onclick="speak()">Speak briefing</button>`;
 return`<div class="c dktb"><div class="seg dkts">${T.map(x=>`<button class="${DKT===x?'on':''}" onclick="DKT='${x}';go()">${x}</button>`).join('')}</div><div class=dktbb>${b}</div></div>`}
ov=function(){const s=S(),R6=apxRows(6),c=R6[R6.length-1],m=c.iss,h=HS(),f=FC(),R=agentRows(),hr=now.getHours(),gr=hr<12?'Good morning':hr<18?'Good afternoon':'Good evening',biz=bizOwner(),gl=+D.goal||0,opt=fn=>{try{return typeof fn==='function'?fn():''}catch(e){return''}};
 let lm=0;try{lm=b2LeadM(cmk)}catch(e){}
 const tiles=`<div class=dkk>${mod('Issued Premium','&#9650;',cu(c.iss,'$'),'This month &middot; '+P(s.p.length?s.iss.length/s.p.length:0)+' placed',apxSpark(R6.map(r=>r.iss)),'Agency Performance','Overview')}${mod('Submitted AP','&#9711;',cu(c.sub,'$'),c.n+' applications this month',apxSpark(R6.map(r=>r.sub),'#c9c9d3'),'Agency Performance','Policies')}
 ${biz?mod('Net Profit','&#9672;',`<span class="${c.net<0?'neg':'pos'}">${cu(c.net,'$')}</span>`,'This month &middot; '+$(c.inc)+' in',apxSpark(R6.map(r=>r.net),'#3ddc97'),'Agency Performance','LLC Overview'):mod('Lead Spend','&#9670;',cu(lm,'$'),'This month',apxSpark(R6.map(r=>{try{return b2LeadM(r.k)}catch(e){return 0}}),'#8a8a9a'),'Agency Performance','Lead ROI')}
 ${mod('Team Pace','&#9733;',R.filter(r=>r.goal&&r.w>=r.goal).length+' / '+R.filter(r=>r.goal).length,'Agents at their weekly goal',apxSpark(R6.map(r=>r.app),'#ffcf40'),'Agency Performance','Agents')}</div>`;
 const core=`<div class="c dkcore">${reactor(cu(m,'$'),gl?m/gl:0,'ISSUED THIS MONTH')}<small>Goal ${gl?P(m/gl):'-'} &middot; ${$(m)} of ${$(gl)}</small><div class=chips><div><small>HEALTH</small><b>${h.score}</b></div><div><small>FORECAST</small><b>${apxK(f.proj)}</b></div><div><small>PIPELINE</small><b>${apxK(f.pend)}</b></div></div></div>`;
 return hd('Command Deck',`${gr}, ${esc(WHO)}. Everything on one screen.`,[['+ Policy',"openM('P')"],['+ Activity',"openM('A')"],['+ Lead buy',"lrAdd()"]].concat(biz?[['+ Income',"openM('I')"],['+ Expense',"openM('E')"]]:[]))+
 `${WHO==='Agency Owner'?opt(typeof cqHtml==='function'?cqHtml:null):''}<div class=dkmr>${opt(typeof mrBanner==='function'?mrBanner:null)}</div>
 <div class=dkg><div class=dka>${core}</div><div class=dkb>${tiles}${dkPulse()}</div></div>${apxPeeks()}${dkTabs()}`};
function b3LeadPeek(card,R){const ck=cmk,X=D.expenses.filter(x=>isLeadEx(x)&&mon(x.d)===ck),sp=sum(X,x=>+x.amt||0),n=sum(X,x=>+x.leads||0),cm=sum(D.policies.filter(x=>live(x)&&mon(x.d)===ck),com);
 return card(`openTab('Agency Performance','Lead ROI')`,'&#9670;','Lead ROI',`<div class=apx-pkm><b class="${cm>=sp?'pos':'neg'}">${sp?(cm/sp).toFixed(1)+'x':'-'}</b><small>commission per $1 of leads this month</small></div>${apxMini(R,['iss','sub'],['#ff1f4f','#4a4a58'])}<div class=apx-pkf><span>Spend <b>${apxK(sp)}</b></span><span>Leads <b>${n.toLocaleString()}</b></span><span>Per lead <b>${n?$(sp/n):'-'}</b></span></div>`)}
try{views['Command Deck'][0]=ov}catch(e){}
/*B3end*/
