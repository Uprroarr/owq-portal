/*B4start*/
/* v120 batch 4: Team Chat (General only, more attachment types up to 5 MB, audio / video preview, Copy and Paste buttons,
   drag and drop), private 1-on-1 channels with the Agency Owner with an Ideas box, a month-to-date Hype Board that lists
   everyone, Sales Floor only time (clock in when you join, out when you leave), a 10 minute inactivity sign-out that docks
   the idle 10 minutes, portal use tracking (views, clicks, route, mouse), exploit fixes for points and credits, and a weekly
   time-tracking integrity report for the owner. */
const FL_CUT=Date.parse('2026-10-21T19:30:00Z'),FL_CUTD='2026-10-21',FL_IDLE=6e5,FL_WARN=54e4;
/* ---------- chat channels ---------- */
try{CHN.splice(0,CHN.length,['General','Everything team'])}catch(e){}
function dmKey(n){return'dm:'+fileKey(n==='Agency Owner'?'Cole Leckey':n)}
function dmOwnerName(){return'Cole Leckey'}
function dmMine(){return dmKey(acWho())}
function dmCan(ch){if(!/^dm:/.test(String(ch||'')))return true;return bizOwner()||ch===dmMine()}
function dmWho(ch){const k=String(ch).slice(3);const a=D.agents.find(x=>fileKey(x.name)===k);return a?a.name:k}
function dmList(){if(bizOwner())return D.agents.map(a=>a.name).filter(n=>n!=='Cole Leckey'&&n!=='Agency Owner').map(n=>dmKey(n));return[dmMine()]}
{const _cc=chChans;chChans=function(){const own=bizOwner(),L=dmList();return _cc()+`<div class=dmh>${own?'Private 1-on-1s':'Private with the owner'}</div>`+L.map(c=>{const u=chUn(c),nm=own?dmWho(c):'Cole (Agency Owner)';return`<button class="tcc dmc${c===CH.ch?' on':''}" onclick="chGo('${c}')">&#128274; ${esc(nm)}${u?`<em class=nb>${u}</em>`:''}<small>${own?'Private &middot; ideas inbox':'Only you and the owner &middot; send ideas'}</small></button>`}).join('')+(own?`<button class="tcc${CH.ch==='__ideas'?' on':''}" onclick="chGo('__ideas')">&#128161; Ideas Inbox${(chAll().filter(m=>m.idea&&(m.idea.st||'new')==='new').length)?`<em class=nb>${chAll().filter(m=>m.idea&&(m.idea.st||'new')==='new').length}</em>`:''}<small>Every idea from every private channel</small></button>`:'')}}
{const _cb=chBadge;chBadge=function(){const n=CHN.reduce((s,c)=>s+chUn(c[0]),0)+dmList().reduce((s,c)=>s+chUn(c),0);return n?`<em class=nb>${Math.min(99,n)}</em>`:''}}
{const _go=chGo;chGo=function(c){if(c!=='__voice'&&c!=='__ideas'&&!dmCan(c))c='General';return _go.call(this,c)}}
{const _ci=chIncoming;chIncoming=function(m){if(m&&/^dm:/.test(String(m.ch||''))&&!dmCan(m.ch))return;
 if(m&&m.idea&&m.who!==WHO&&m.at>=CH.t0){if(bizOwner())pushAlert({sev:'ok',t:'New portal idea from '+m.who,m:String(m.idea.t||''),go:['Team Chat']});return}return _ci.apply(this,arguments)}}
{const _pa7=pushAlert;pushAlert=function(a,q){if(a&&typeof a.m==='string'&&a.m.indexOf('#dm:')>=0)a=Object.assign({},a,{m:a.m.replace(/#dm:[A-Za-z0-9_-]+:\s*/,'(private) ')});return _pa7.call(this,a,q)}}
/* the chat page: private channel header, ideas and the inbox */
{const _chat=chat;chat=function(){if(CH.ch!=='__voice'&&CH.ch!=='__ideas'&&!dmCan(CH.ch))CH.ch='General';if(CH.ch==='__ideas'){if(!bizOwner())CH.ch='General';else{const h=_chat.call(this);const i=h.indexOf('<div class="c chm">');if(i<0)return h;const j=h.lastIndexOf('</div></div>');return h.slice(0,i)+ideasInbox()+h.slice(j)}}
 let h=_chat.apply(this,arguments);if(/^dm:/.test(CH.ch)){const nm=bizOwner()?dmWho(CH.ch):'Cole (Agency Owner)';h=h.replace(/<span class=chtn># [^<]*<\/span>/,`<span class=chtn>&#128274; ${esc(nm)}</span><button class="btn sm dmib" onclick="ideaNew()">&#128161; Submit an idea</button>`).replace("Message #"+esc(CH.ch),'Message '+esc(nm)+' privately')}return h}}
try{views['Team Chat'][0]=chat}catch(e){}
{const _cm=chMsgs;chMsgs=function(){let h=_cm.apply(this,arguments);if(/^dm:/.test(CH.ch)&&!chIn(CH.ch).length)h=`<div class=che><div class=chei>&#128274;</div><b>Your private channel with ${bizOwner()?esc(dmWho(CH.ch)):'the owner'}</b><small>Only the two of you see this. Use <b>Submit an idea</b> to send ideas for the portal.</small></div>`;return h}}
const IDST=[['new','New'],['review','Reviewing'],['plan','Planned'],['build','Building'],['done','Shipped'],['no','Not now']];
function ideaHtml(m){const i=m.idea||{},st=IDST.find(x=>x[0]===(i.st||'new'))||IDST[0];return`<div class="idc st-${st[0]}"><div class=idh><b>&#128161; ${esc(i.t||'Idea')}</b><span class=idst>${st[1]}</span></div>${i.d?`<p>${chTxt(i.d)}</p>`:''}${i.area?`<small>Area: ${esc(i.area)}</small>`:''}${bizOwner()?`<div class=idbs>${IDST.map(([k,l])=>`<button class="${k===st[0]?'on':''}" onclick="ideaSt('${m.id}','${k}')">${l}</button>`).join('')}</div>`:''}</div>`}
{const _mh=chMsgs;chMsgs=function(){let h=_mh.apply(this,arguments);return h}}
{const _att=attHtml;attHtml=function(m){return(m&&m.idea?ideaHtml(m):'')+_att.apply(this,arguments)}}
const IDAR=['Command Deck','Agency Performance','Clients / CRM','Team Chat','Sales Floor (3D)','Leaderboard','Battle Pass / Shop','Learning Network','Login / intro','Other'];
function ideaNew(){if(!/^dm:/.test(CH.ch))return;document.getElementById('md').innerHTML=`<div class=mb onclick="if(event.target===this)closeM()"><div class="c lrm" role=dialog aria-modal=true aria-label="Submit an idea"><h4>&#128161; Submit an idea for the portal</h4><p class=mut>Goes straight to the owner. Describe what you want and why it helps.</p><div class=lrg><label class=lrw>Idea<input id=id_t maxlength=90 placeholder="Short title"></label><label>Area<select id=id_a>${IDAR.map(a=>`<option>${a}</option>`).join('')}</select></label><label class=lrw>Details<textarea id=id_d rows=4 maxlength=800 placeholder="What should it do? Who uses it?"></textarea></label></div><p class=cherr id=id_e></p><button class=btn onclick="ideaSend()">Send idea</button> <button class="btn o" onclick="closeM()">Cancel</button></div></div>`;setTimeout(()=>{const e=document.getElementById('id_t');if(e)e.focus()},30)}
function ideaSend(){const t=String((document.getElementById('id_t')||{}).value||'').trim(),d=String((document.getElementById('id_d')||{}).value||'').trim(),a=(document.getElementById('id_a')||{}).value||'';if(!t){document.getElementById('id_e').textContent='Give your idea a short title.';return}
 chPost({ch:CH.ch,who:WHO,text:'',at:Date.now(),idea:{t:t.slice(0,90),d:d.slice(0,800),area:a,st:'new'}});closeM();toast('Idea sent to the owner',1);setTimeout(chScroll,60)}
function ideaSt(id,st){const m=chAll().find(x=>String(x.id)===String(id));if(!m||!bizOwner())return;const idea=Object.assign({},m.idea||{},{st});if(CH.live&&CH.db)CH.db.doc('chat/'+id).update({idea}).catch(()=>toast('Could not update'));else{m.idea=idea;save()}if(typeof chRefresh==='function')chRefresh();if(CH.ch==='__ideas')go()}
function ideasInbox(){const L=chAll().filter(m=>m.idea&&/^dm:/.test(String(m.ch||''))).sort((a,b)=>b.at-a.at),f=CH.idf||'all',V=f==='all'?L:L.filter(m=>(m.idea.st||'new')===f);
 return`<div class="c chm idin"><div class=chth><span class=chtn>&#128161; Ideas Inbox</span><small>${L.length} idea${L.length===1?'':'s'}</small></div><div class=seg style="margin:8px 0">${[['all','All']].concat(IDST).map(([k,l])=>`<button class="${f===k?'on':''}" onclick="CH.idf='${k}';go()">${l}${k!=='all'?' '+L.filter(m=>(m.idea.st||'new')===k).length:''}</button>`).join('')}</div>
 <div class=idl>${V.length?V.map(m=>`<div class=idrow>${av(m.who,30)}<div><div class=idmeta><b>${esc(m.who)}</b><time>${fmtM(m.at)}</time><button class="btn o sm" onclick="chGo('${m.ch}')">Open chat</button><button class="btn o sm" onclick="ideaCopy('${m.id}')">Copy for Claude</button></div>${ideaHtml(m)}</div></div>`).join(''):'<p class=mut>No ideas here yet. Agents send them from their private channel with you.</p>'}</div></div>`}
function ideaCopy(id){const m=chAll().find(x=>String(x.id)===String(id));if(!m)return;const i=m.idea||{};cpText('Portal idea from '+m.who+' ('+(i.area||'Other')+'): '+(i.t||'')+(i.d?'\n'+i.d:''))}
/* ---------- attachments: copy, paste, drag and drop ---------- */
async function chPasteBtn(){try{if(navigator.clipboard&&navigator.clipboard.read){const items=await navigator.clipboard.read();for(const it of items){const ty=it.types.find(t=>/^image\//.test(t));if(ty){const b=await it.getType(ty);const f=new File([b],'pasted-'+Date.now()+'.'+(ty.split('/')[1]||'png').replace('jpeg','jpg'),{type:ty});chPick([f]);return}}}
 const t=navigator.clipboard&&navigator.clipboard.readText?await navigator.clipboard.readText():'';const i=document.getElementById('chi');if(t&&i){const st=i.selectionStart||i.value.length;i.value=(i.value.slice(0,st)+t+i.value.slice(i.selectionEnd||st)).slice(0,500);CH.draft=i.value;i.focus()}else toast('Nothing to paste. Copy text or a picture first.')}catch(e){toast('The browser blocked pasting. Press Ctrl+V (Cmd+V on Mac) in the message box.')}}
(function(){let dz=0;addEventListener('dragover',e=>{if(typeof tab==='undefined'||tab!=='Team Chat'||!e.dataTransfer||![...(e.dataTransfer.types||[])].includes('Files'))return;e.preventDefault();if(!dz){dz=1;document.body.classList.add('chdz')}});
 addEventListener('dragleave',e=>{if(e.relatedTarget===null){dz=0;document.body.classList.remove('chdz')}});addEventListener('drop',e=>{dz=0;document.body.classList.remove('chdz');if(typeof tab==='undefined'||tab!=='Team Chat'||!e.dataTransfer||!e.dataTransfer.files||!e.dataTransfer.files.length)return;e.preventDefault();chPick(e.dataTransfer.files)})})();
/* ---------- Hype Board: everyone, month to date, steady ---------- */
chHype=function(){try{const mk=cmk,T={};D.agents.forEach(a=>{T[a.name]=0});(D.policies||[]).forEach(q=>{if((q.st==='Issued'||q.st==='Paid')&&q.ag&&mon(q.d)===mk)T[q.ag]=(T[q.ag]||0)+(+q.ap||0)});
 const L=Object.entries(T).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])),mx=Math.max(1,...L.map(r=>r[1]));
 return`<div class="hyb hyb2"><small class=hym>Issued premium &middot; ${APX_MN[now.getMonth()]} to date</small>${L.map(([n,v],i)=>`<div class="hyr2${i<3&&v>0?' t'+i:''}"><span class=hyn>${i<3&&v>0?['&#129351;','&#129352;','&#129353;'][i]:i+1}</span>${av(n,22)}<b>${esc(n.split(' ')[0])}</b><i><u style="width:${v/mx*100}%"></u></i><em>${apxK(v)}</em></div>`).join('')}</div>`}catch(e){return''}};
/* ---------- Sales Floor only time ---------- */
function flOn(){try{return typeof VC!=='undefined'&&!!VC.on}catch(e){return false}}
{const _ai=acIn;acIn=function(){if(!flOn()){try{const o=openShift(acWho());if(o&&o.auto&&!o.fl){finishShift(o,acWho(),Math.max(o.start,o.hb||o.start));save()}}catch(e){}return}
 const n=acWho();if(!D.agents.some(a=>a.name===n))return;acSweep();const o=openShift(n);if(o){o.auto=1;o.fl=1;o.hb=Date.now();save();return}
 D.shifts.push({id:nid(),ag:n,start:Date.now(),end:null,auto:1,fl:1,hb:Date.now()});save();toast('On the clock: you joined the Sales Floor.',1)}}
{const _vj4=vcJoin;vcJoin=async function(){const was=VC.on;const r=await _vj4.apply(this,arguments);try{if(!was&&VC.on){FL.last=Date.now();acIn()}}catch(e){}return r}}
{const _vl4=vcLeave;vcLeave=async function(){const was=VC.on;const r=await _vl4.apply(this,arguments);try{if(was&&!VC.on&&!FL.leaving){acOut();toast('Off the clock: you left the Sales Floor.',1)}}catch(e){}return r}}
/* ---------- 10 minute inactivity: sign out, the idle 10 minutes are not counted ---------- */
var FL={last:Date.now(),leaving:0,log:[]};
['mousedown','keydown','touchstart','wheel','scroll'].forEach(t=>addEventListener(t,()=>{FL.last=Date.now()},{passive:true,capture:true}));
setInterval(()=>{try{if(typeof VC!=='undefined'&&VC.on&&VC.sp)FL.last=Date.now()}catch(e){}},1000);
function flTick(){if(!ONLINE||window.OWQ_GUEST)return;const n=Date.now(),idle=n-FL.last;if(idle>=FL_IDLE)flLogout();else if(idle>=FL_WARN){const e=document.getElementById('idlew');if(e){const s=Math.max(0,Math.ceil((FL_IDLE-idle)/1000));e.innerHTML='<b>Still there?</b> No activity for 9 minutes. You will be signed out in '+s+' s and the idle time will not count. Click, type or talk to stay.';e.className='idlew on'}}
 else{const e=document.getElementById('idlew');if(e&&e.className.indexOf(' on')>=0&&!(typeof LASTACT!=='undefined'&&Date.now()-LASTACT>=IDLEW)){e.className='idlew';e.innerHTML=''}}}
setInterval(flTick,5000);
async function flLogout(){if(!ONLINE||FL.leaving)return;FL.leaving=1;const at=FL.last,who=acWho(),s=openShift(who),dock=s?Math.round(Math.max(0,Date.now()-Math.max(at,s.start))/6e4):0;
 try{if(s){s.dock=(s.dock||0)+dock;s.idleOut=1}}catch(e){}try{if(VC.on)await vcLeave()}catch(e){}try{acOut(at)}catch(e){}
 try{flLog({k:'idle',ag:who,at:Date.now(),dock})}catch(e){}LGMSG='Signed out after 10 minutes of inactivity.'+(s?' The idle '+dock+' minutes were not counted.':'')+' Log back in to continue.';
 try{save();if(typeof SYN!=='undefined'&&SYN.on&&SYN.first&&!SYN.ro)synPush()}catch(e){}FL.leaving=0;try{const e=document.getElementById('idlew');if(e){e.className='idlew';e.innerHTML=''}}catch(e){}lockView()}
{const _lg=doLogin;doLogin=function(){FL.last=Date.now();return _lg.apply(this,arguments)}}
/* ---------- what counts: Sales Floor hours only; manual hours stay in the log but earn nothing ---------- */
function flH(a){if(!a)return 0;const h=+a.h||0;if(!h)return 0;if(a.clock){const s=(D.shifts||[]).find(x=>x.id===a.clock);if(!s)return h;return(s.fl||s.start<FL_CUT)?h:0}return String(a.d||'')<FL_CUTD?h:0}
function flCap(arr,f,cap){const by={};arr.forEach(a=>{const k=a.d||'';by[k]=(by[k]||0)+(+f(a)||0)});return Object.values(by).reduce((s,v)=>s+Math.min(cap,v),0)}
{const _ls=lbStats;lbStats=function(from,to){const r=_ls.apply(this,arguments);r.forEach(x=>{const ac=D.activity.filter(a=>(a.ag||'Unassigned')===x.nm&&a.d>=from&&a.d<=to);
  x.hrs=sum(ac,flH)+sum((D.shifts||[]).filter(s=>s.ag===x.nm&&s.fl&&shiftLive(s)&&dkey(new Date(s.start))>=from&&dkey(new Date(s.start))<=to),s=>(Date.now()-s.start)/36e5);
  const app=flCap(ac,a=>a.app,30);if(app!==x.app){x.app=app;const base=Math.round(x.iap/100+20*x.pol+2*app);if(from==='0000-00-00'){x.base=base;x.bonus=msBonus(x,x.base);x.pts=x.base+x.bonus}else x.pts=base}
  else if(from==='0000-00-00'){x.bonus=msBonus(x,x.base);x.pts=x.base+x.bonus}});return r}}
/* ---------- portal use tracking: views, clicks, route, mouse (per person per day) ---------- */
var UT={v:{},c:0,ct:{},r:[],mm:0,lx:-1,ly:-1,act:0,dirty:0,day:'',t0:Date.now(),last:''};
function utReset(){const d=dkey(new Date());if(UT.day!==d){UT.day=d;UT.v={};UT.c=0;UT.ct={};UT.r=[];UT.mm=0;UT.act=0;UT.dirty=0}}
{const _g=go;go=function(){const r=_g.apply(this,arguments);try{if(ONLINE){utReset();const k=tab+(SUB&&SUB[tab]?' > '+SUB[tab]:'');if(k!==UT.last){UT.last=k;UT.v[k]=(UT.v[k]||0)+1;UT.r.push([Math.round((Date.now()-new Date(UT.day+'T00:00:00').getTime())/6e4),k]);if(UT.r.length>120)UT.r=UT.r.slice(-120);UT.dirty=1}}}catch(e){}return r}}
addEventListener('click',e=>{try{if(!ONLINE)return;utReset();UT.c++;UT.dirty=1;const b=e.target&&e.target.closest&&e.target.closest('button,a,[role=button]');if(b){const t=String(b.getAttribute('aria-label')||b.textContent||'').replace(/\s+/g,' ').trim().slice(0,28);if(t){UT.ct[t]=(UT.ct[t]||0)+1;const ks=Object.keys(UT.ct);if(ks.length>40){ks.sort((a,b)=>UT.ct[a]-UT.ct[b]).slice(0,ks.length-40).forEach(k=>delete UT.ct[k])}}}}catch(x){}},{capture:true,passive:true});
addEventListener('mousemove',e=>{if(!ONLINE)return;if(UT.lx>=0){const d=Math.hypot(e.clientX-UT.lx,e.clientY-UT.ly);if(d<400)UT.mm+=d}UT.lx=e.clientX;UT.ly=e.clientY},{passive:true});
setInterval(()=>{try{if(!ONLINE)return;utReset();if(Date.now()-FL.last<6e4){UT.act++;UT.dirty=1}if(UT.dirty)utSave()}catch(e){}},60000);
async function utSave(){try{const db=await globalThis.claude.use('db');if(!db)return;UT.dirty=0;const k=fileKey(acWho())+'_'+UT.day;await db.doc('usage/'+k).set({ag:acWho(),day:UT.day,v:UT.v,c:UT.c,ct:UT.ct,r:UT.r,mm:Math.round(UT.mm),act:UT.act,at:Date.now()})}catch(e){}}
async function flLog(o){try{const db=await globalThis.claude.use('db');if(!db)return;await db.collection('tlog').add(o)}catch(e){}}
/* ---------- owner: portal activity and the weekly integrity report (in the Time Report) ---------- */
var UTV={rows:null,at:0,busy:0,rep:null};
async function utLoad(){if(UTV.busy||Date.now()-UTV.at<6e4&&UTV.rows)return;UTV.busy=1;try{const db=await globalThis.claude.use('db');const r=await db.collection('usage').get(),L=[];(r.docs||[]).forEach(d=>{const x=d.data&&d.data();if(x&&x.ag)L.push(x)});UTV.rows=L;
 const t=await db.collection('tlog').get();UTV.tl=(t.docs||[]).map(d=>d.data()).filter(Boolean);UTV.at=Date.now()}catch(e){UTV.rows=UTV.rows||[]}UTV.busy=0;if(tab==='Agency Performance'&&SUB['Agency Performance']==='Time Report')refreshQuiet()}
function utWeek(){const o=new Date();o.setHours(0,0,0,0);const st=new Date(o);st.setDate(o.getDate()-6);return[dkey(st),dkey(o)]}
function utCard(){if(!trkOwn())return'';if(!UTV.rows){utLoad();return'<div class=c><h4>Portal Activity</h4><p class=mut>Loading...</p></div>'}const [a,b]=utWeek(),R=UTV.rows.filter(x=>x.day>=a&&x.day<=b),by={};
 R.forEach(x=>{const o=by[x.ag]||(by[x.ag]={ag:x.ag,days:0,views:0,c:0,mm:0,act:0,top:{},route:[]});o.days++;o.c+=x.c||0;o.mm+=x.mm||0;o.act+=x.act||0;Object.entries(x.v||{}).forEach(([k,n])=>{o.views+=n;o.top[k]=(o.top[k]||0)+n});if(x.day===dkey(new Date()))o.route=x.r||[]});
 const L=Object.values(by).sort((p,q)=>q.act-p.act);
 return`<div class="c sc"><h4>Portal Activity &middot; Last 7 Days</h4><p class=mut style="margin-top:-4px">Page views, clicks, active minutes and mouse travel per person. Click a row to see today's route through the portal.</p>${L.length?`<table><tr><th>Agent<th class=n>Days<th class=n>Active min<th class=n>Page views<th class=n>Clicks<th class=n>Mouse travel<th>Most viewed</tr>${L.map(o=>{const tp=Object.entries(o.top).sort((p,q)=>q[1]-p[1]).slice(0,3).map(r=>esc(r[0])+' ('+r[1]+')').join(', ');return`<tr class=ck onclick="UTV.open=UTV.open==='${esc(o.ag)}'?'':'${esc(o.ag)}';go()"><td><b>${esc(o.ag)}</b><td class=n>${o.days}<td class=n>${o.act}<td class=n>${o.views}<td class=n>${o.c}<td class=n>${(o.mm/3780).toFixed(1)} m<td class=mut>${tp||'-'}</tr>${UTV.open===o.ag?`<tr><td colspan=7><div class=utr>${o.route.length?o.route.map(r=>`<span><time>${pad(Math.floor(r[0]/60))}:${pad(r[0]%60)}</time>${esc(r[1])}</span>`).join('<i>&#8594;</i>'):'<span class=mut>No route recorded today.</span>'}</div></td></tr>`:''}`}).join('')}</table>`:'<p class=mut>No portal activity recorded yet.</p>'}</div>`+flReport()}
function flReport(){const [a,b]=utWeek(),SH=(D.shifts||[]).filter(s=>{const d=dkey(new Date(s.start));return d>=a&&d<=b}),AC=(D.activity||[]).filter(x=>x.d>=a&&x.d<=b),ags=D.agents.map(x=>x.name);
 const rows=ags.map(n=>{const sh=SH.filter(s=>s.ag===n),fl=sh.filter(s=>s.fl),fh=sum(fl,s=>(shEnd(s)-s.start)/36e5),idle=sh.filter(s=>s.idleOut).length,dock=sum(sh,s=>+s.dock||0),man=AC.filter(x=>x.ag===n&&!x.clock&&(+x.h||0)>0&&x.d>=FL_CUTD),mh=sum(man,x=>+x.h||0),
  capd=Object.entries(AC.filter(x=>x.ag===n).reduce((o,x)=>{o[x.d]=(o[x.d]||0)+(+x.app||0);return o},{})).filter(r=>r[1]>30).length;return{n,fh,sess:fl.length,idle,dock,mh,capd}});
 const checks=flSelfTest();
 return`<div class="c sc flr"><div class=apx-ch><h4>Weekly Time-Tracking Report &middot; ${esc(a)} to ${esc(b)}</h4><small>${checks.filter(c=>c[1]).length} of ${checks.length} integrity checks passed</small></div>
 <table><tr><th>Agent<th class=n>Sales Floor hours<th class=n>Sessions<th class=n>Idle sign-outs<th class=n>Docked min<th class=n>Manual hours (not counted)<th class=n>Days over caps</tr>${rows.map(r=>`<tr><td><b>${esc(r.n)}</b><td class=n>${r.fh.toFixed(1)}<td class=n>${r.sess}<td class="n ${r.idle?'neg':''}">${r.idle}<td class=n>${r.dock}<td class="n ${r.mh?'neg':''}">${r.mh?r.mh.toFixed(1)+' h':'-'}<td class="n ${r.capd?'neg':''}">${r.capd||'-'}</tr>`).join('')}</table>
 <div class=flck>${checks.map(c=>`<span class="${c[1]?'ok':'bad'}">${c[1]?'&#10003;':'&#10007;'} ${esc(c[0])}</span>`).join('')}</div><small class=mut>Rules: hours count only on the Sales Floor; 10 minutes without a click, key, scroll or talking signs you out and those 10 minutes are not counted; mouse movement alone does not count as activity; hand-logged hours stay in the log but earn no points, credits or XP; appointments count up to 30 a day.</small></div>`}
function flSelfTest(){const T=[];const fake={d:dkey(new Date()),h:5,ag:'x'},sh={id:-1,fl:0,start:Math.max(Date.now(),FL_CUT+1)};
 T.push(['Hand-logged hours earn nothing',flH(fake)===0]);
 T.push(['Off-floor clock time earns nothing',(()=>{D.shifts.push(sh);const v=flH({clock:-1,h:3,d:fake.d});D.shifts.pop();return v===0})()]);
 T.push(['Floor time counts',(()=>{sh.fl=1;D.shifts.push(sh);const v=flH({clock:-1,h:3,d:fake.d});D.shifts.pop();return v===3})()]);
 T.push(['Appointments capped at 30 a day',flCap([{d:'a',app:500},{d:'b',app:4}],x=>x.app,30)===34]);
 T.push(['Mouse movement alone is not activity',(()=>{const l=FL.last;try{document.dispatchEvent(new MouseEvent('mousemove',{clientX:5,clientY:5}));return FL.last===l}catch(e){return true}})()]);
 T.push(['10 minute sign-out is armed',FL_IDLE===6e5&&typeof flLogout==='function']);
 T.push(['Clock-in needs the Sales Floor',(()=>{if(flOn())return true;const n=(D.shifts||[]).filter(s=>!s.end&&s.ag===acWho()&&!s.fl&&shiftLive(s)).length;return n===0})()]);
 return T}
{const _tp=trkPage;trkPage=function(){return _tp.apply(this,arguments)+utCard()}}
/* the weekly report pops for the owner once a week (Monday or the first login after) */
setTimeout(function wk(){try{if(!ONLINE||!bizOwner())return setTimeout(wk,60000);const k='owq_flrep_'+utWeek()[0].slice(0,7)+'_'+Math.floor(new Date().getDate()/7);let s='';try{s=localStorage.getItem('owq_flrep')||''}catch(e){}
 const wkid=(()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return dkey(d)})();if(s===wkid)return;try{localStorage.setItem('owq_flrep',wkid)}catch(e){}
 const c=flSelfTest(),bad=c.filter(x=>!x[1]).length;pushAlert({sev:bad?'warn':'ok',t:'Weekly time-tracking report',m:(c.length-bad)+' of '+c.length+' integrity checks passed. Open the Time Report for hours, idle sign-outs and docked minutes.',go:['Agency Performance','Time Report'],nv:1})}catch(e){}},20000);
/*B4end*/
