/*QVstart*/
/* bell Quick View (prefix qv): the right rail gets tabs ALERTS | CHAT | FLOOR, a quick view of Team Chat and of the
   Sales Floor (cameras, shared screens, mic/cam/share), a pop-out window (phone: bottom mini-player).
   Thin layer: posting/reading/reacting use Team Chat's own chPost/chSeen/chReact/chVote and the same data (CH, D.chat);
   the floor uses the voice lobby's own vcJoin/vcMute/vcCam/vcScr/vcLeave and streams (VC). No new db/room subscriptions:
   updates arrive through the existing paths (chRefresh, vcPaint, the room onPeers callback via qvPeers()). */
const QV={tab:'alerts',ch:'General',drafts:{},fl:{on:0,v:'floor',x:-1,y:-1,w:380,h:420,pin:0},mounted:'',vs:new Set(),lastAt:0,ct:0,ft:0,rt:0,mn:{open:0,i:0,list:[]},emo:0,stick:1,newN:0,stage:'',booted:0,keys:{}};
try{const o=JSON.parse(localStorage.getItem('owq_qv')||'{}');if(['alerts','chat','floor'].indexOf(o.tab)>=0)QV.tab=o.tab;if(typeof o.ch==='string')QV.ch=o.ch;
 if(o.fl&&typeof o.fl==='object')Object.keys(QV.fl).forEach(k=>{if(typeof o.fl[k]===typeof QV.fl[k])QV.fl[k]=o.fl[k]});if(['chat','floor'].indexOf(QV.fl.v)<0)QV.fl.v='floor'}catch(e){}
function qvSave(){try{localStorage.setItem('owq_qv',JSON.stringify({tab:QV.tab,ch:QV.ch,fl:QV.fl}))}catch(e){}}
const qv$=id=>document.getElementById(id);
const qvPhone=()=>IW()<=560,qvOverlay=()=>IW()<=1100;
const qvI=k=>(typeof VOI!=='undefined'&&VOI[k])||'';
const QVI={pop:'<svg viewBox="0 0 24 24" width=15 height=15 fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round aria-hidden=true><path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
 dock:'<svg viewBox="0 0 24 24" width=15 height=15 fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round aria-hidden=true><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M15 4v16M7 12h5M10 9l3 3-3 3"/></svg>',
 pin:'<svg viewBox="0 0 24 24" width=15 height=15 fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round aria-hidden=true><path d="M9 3h6l-1 7 4 4H6l4-4-1-7zM12 14v7"/></svg>',
 max:'<svg viewBox="0 0 24 24" width=15 height=15 fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round aria-hidden=true><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
 up:'<svg viewBox="0 0 24 24" width=16 height=16 fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round aria-hidden=true><path d="M6 15l6-6 6 6"/></svg>',
 send:'<svg viewBox="0 0 24 24" width=16 height=16 fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round aria-hidden=true><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>'};

/* ---------- counts (shared with Team Chat: D.chatSeen is the read state) ---------- */
function qvMe(){return String(WHO||'').split(/\s+/)[0].toLowerCase()}
function qvMent(m){const me=qvMe();return !!me&&new RegExp('@'+me.replace(/[^a-z0-9]/g,'')+'\\b','i').test(String(m&&m.text||''))}
function qvCounts(){const ua=AL().filter(a=>!a.rd),ks=new Set();ua.forEach(a=>{if(a.k)ks.add(a.k)});let ch=0,men=0,extra=0;const per={};
 CHN.forEach(([c])=>{const seen=(D.chatSeen||{})[c]||0;let u=0,mu=0;chIn(c).forEach(m=>{if(m.who!==WHO&&m.at>seen){u++;if(qvMent(m))mu++;if(!ks.has('cm-'+m.id))extra++}});per[c]=[u,mu];ch+=u;men+=mu});
 return{al:ua.length,ch,men,per,bell:ua.length+extra}}
function qvFloorInfo(){const L=vcList();let scr=!!VC.scr;L.forEach(p=>{if(p.presence&&p.presence.scr)scr=true});return{n:L.length,scr,hud:L.length>=2}}

/* ---------- tabs ---------- */
function qvTabInner(k,c,f){if(k==='alerts')return'Alerts'+(c.al?`<em class=qv-n aria-label="${c.al} unread">${Math.min(99,c.al)}</em>`:'');
 if(k==='chat')return'Chat'+(c.ch?`<em class="qv-n${c.men?' men':''}" aria-label="${c.ch} unread${c.men?', '+c.men+' mentioning you':''}">${c.men?'@':''}${Math.min(99,c.ch)}</em>`:'');
 return'Floor'+(f.n?`<em class="qv-n ok" aria-label="${f.n} on the floor">${f.n}</em>`:'')+(f.scr||f.hud?`<i class="qv-dot${f.scr?' scr':''}" title="${f.scr?'Someone is sharing a screen':'A huddle is live'}" aria-label="${f.scr?'Someone is sharing a screen':'A huddle is live'}"></i>`:'')}
function qvTabsHtml(){const c=qvCounts(),f=qvFloorInfo();return`<div class=qv-tabs role=tablist aria-label="Rail view">${['alerts','chat','floor'].map(k=>`<button role=tab id=qvT_${k} class="qv-tb${QV.tab===k?' on':''}" aria-selected=${QV.tab===k} aria-controls=qvRP tabindex=${QV.tab===k?0:-1} onclick="qvTab('${k}')" onkeydown="qvTabKey(event)">${qvTabInner(k,c,f)}</button>`).join('')}</div>`}
function qvTabsUpdate(c,f){const r=qv$('rail');if(!r)return;const t=r.querySelector('.qv-tabs');if(!t)return;c=c||qvCounts();f=f||qvFloorInfo();
 ['alerts','chat','floor'].forEach(k=>{const b=qv$('qvT_'+k);if(!b)return;const h=qvTabInner(k,c,f);if(b._h!==h){b._h=h;b.innerHTML=h}})}
function qvTab(k){if(['alerts','chat','floor'].indexOf(k)<0)return;if(QV.tab===k&&RAIL){const b=qv$('qvT_'+k);if(b)b.focus();return}QV.tab=k;qvSave();if(!RAIL){toggleRail(true)}else railRender();const b=qv$('qvT_'+k);if(b&&b.focus)b.focus()}
function qvTabKey(e){const L=['alerts','chat','floor'],i=L.indexOf(QV.tab);if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();qvTab(L[(i+(e.key==='ArrowRight'?1:2))%3])}else if(e.key==='Home'){e.preventDefault();qvTab('alerts')}else if(e.key==='End'){e.preventDefault();qvTab('floor')}}
function qvPulseChat(){const b=qv$('qvT_chat');if(!b||RM)return;b.classList.remove('qv-pulse');void b.offsetWidth;b.classList.add('qv-pulse');setTimeout(()=>b.classList.remove('qv-pulse'),1300)}

/* ---------- bell: alerts + unread chat (each item counted once) ---------- */
function qvBell(c){const b=qv$('bell');if(!b)return;c=c||qvCounts();const n=c.bell;let e=b.querySelector('b');
 if(n){if(!e){e=document.createElement('b');b.appendChild(e)}const t=String(Math.min(99,n));if(e.textContent!==t)e.textContent=t;e.classList.toggle('qv-men',!!c.men)}else if(e)e.remove();
 const lab='Alerts and chat: '+c.al+' unread alert'+(c.al===1?'':'s')+', '+c.ch+' unread chat message'+(c.ch===1?'':'s')+(c.men?' ('+c.men+' mentioning you)':'')+(n!==c.al+c.ch?'. '+n+' in total, a chat alert and its message count once':'');
 if(b.getAttribute('aria-label')!==lab){b.setAttribute('aria-label',lab);b.title=lab}}
function qvBadges(){if(!ONLINE)return;const c=qvCounts(),f=qvFloorInfo();qvBell(c);qvTabsUpdate(c,f);qvFloatTabs(c,f);const cb=qv$('qvChs');if(cb){const h=qvChsHtml(c);if(cb._h!==h){cb._h=h;cb.innerHTML=h}}}

/* ---------- rail ---------- */
const QVW=400;
function qvRailW(){const r=qv$('rail');return r&&r.classList.contains('qv-wide')?Math.round(r.querySelector('.ri')?r.querySelector('.ri').getBoundingClientRect().width||QVW:QVW):340}
function qvPopped(k){return !!(QV.fl.on&&QV.fl.v===k)}
function qvRailPane(){const r=qv$('rail');if(!r)return;let host=qv$('qvRP');
 if(!host||QV.mounted!==QV.tab||host._pop!==qvPopped(QV.tab)){if(!RAIL&&!host){r.innerHTML='';QV.mounted='';return}
  r.innerHTML=`<div class="ri qv-ri">${qvTabsHtml()}<div id=qvRP class="qv-pane qv-host qv-${QV.tab}" role=tabpanel aria-labelledby=qvT_${QV.tab}></div></div>`;QV.mounted=QV.tab;host=qv$('qvRP');host._pop=qvPopped(QV.tab);qvBuild(host,QV.tab,'rail')}
 else{qvTabsUpdate();qvUpdate(host,QV.tab)}}
function qvRailCls(){const r=qv$('rail');if(!r)return;const wide=!!(ONLINE&&RAIL&&QV.tab==='floor'&&QV.mounted==='floor'&&!qvPopped('floor')&&qvHasTiles());
 if(r.classList.contains('qv-wide')!==wide){r.classList.toggle('qv-wide',wide);try{popRender()}catch(e){}}r.classList.toggle('qv-tabbed',!!ONLINE)}
function qvHasTiles(){if(!VC.room)return false;if(vcScreens().length)return true;const me=vcMe();return vcList().some(p=>{const x=p.presence||{};return x.cam&&(p.peer===me?!!VC.cam:!!vcStreamOf(p.peer,x).cam)})}
function qvPoppedHtml(k){return`<div class="rh qv-h"><div><h4>${k==='chat'?'Team Chat':'Sales Floor'}</h4><small>In the pop-out window</small></div><button class=x onclick="toggleRail(false)" title="Close" aria-label="Close the rail">&times;</button></div>
<div class="che qv-popd"><div class=chei>${QVI.pop}</div><b>${k==='chat'?'Team Chat':'The Sales Floor'} is in the pop-out window</b><small>It stays on screen on every page. Bring it back here any time.</small><button class="btn o" onclick="qvDock()">Bring it back to the rail</button></div>`}
function qvBuild(host,k,where){host.classList.toggle('qv-float',where==='float');
 if(k==='chat'){const pl=where==='rail'&&qvPopped('chat');host.innerHTML=pl?qvPoppedHtml('chat'):qvChatHtml(where);if(!pl)qvChatAfter(true)}
 else if(k==='floor'){host.innerHTML=where==='rail'&&qvPopped('floor')?qvPoppedHtml('floor'):qvFloorHtml(where);qvFloorPaint(host)}
 qvVids()}
function qvUpdate(host,k){if(k==='chat'){if(!qvPopped('chat')||host.id!=='qvRP')qvList()}else if(k==='floor'){if(!qvPopped('floor')||host.id!=='qvRP')qvFloorPaint(host)}qvVids()}

/* ---------- CHAT quick view ---------- */
function qvChsHtml(c){c=c||qvCounts();return CHN.map(([n,d])=>{const u=(c.per[n]||[0,0]);return`<button role=tab aria-selected=${n===QV.ch} class="qv-chb${n===QV.ch?' on':''}" onclick="qvCh('${n}')" title="${esc(d)}"># ${esc(n)}${u[0]?`<em class="qv-n${u[1]?' men':''}" aria-label="${u[0]} unread">${u[1]?'@':''}${Math.min(99,u[0])}</em>`:''}</button>`}).join('')}
function qvChatSub(){const n=chIn(QV.ch).length;return`#${esc(QV.ch)} &middot; ${n} message${n===1?'':'s'} &middot; ${CH.live?'<span class=qv-live2>LIVE</span>':'LOCAL DEMO'}`}
function qvChatHtml(where){if(!CHN.some(c=>c[0]===QV.ch))QV.ch=CHN[0][0];const ro=!CH.canW,ch=QV.ch;
 const head=where==='rail'?`<div class="rh qv-h"><div><h4>Team Chat</h4><small id=qvCsub>${qvChatSub()}</small></div><div class=qv-ha><button class=qv-ib onclick="qvPop('chat')" title="Pop out: keep the chat on screen on every page" aria-label="Pop out the chat into a floating window">${QVI.pop}</button><button class=x onclick="toggleRail(false)" title="Close" aria-label="Close the rail">&times;</button></div></div>`:'';
 return`${head}<div class=qv-chs id=qvChs role=tablist aria-label="Channels">${qvChsHtml()}</div>
<div class=qv-cw><div class=qv-cl id=qvCL role=log aria-live=polite aria-label="Messages in #${esc(ch)}" tabindex=0 onscroll="qvCScroll()"></div><button class=qv-jump id=qvJump hidden onclick="qvJumpLatest()">Jump to latest <b id=qvJn></b></button></div>
<div class=qv-mn id=qvMN role=listbox aria-label="Mention someone"></div><div class=qv-cx id=qvCX></div><p class="cherr qv-err" id=qvCE ${CH.err?'':'hidden'}>${esc(CH.err||'')}</p>
<div class=qv-cf><button class=qv-ib onclick="qvEmo()" title="Emoji" aria-label="Emoji" aria-expanded=false id=qvEB ${ro?'disabled':''}>&#128512;</button><textarea id=qvCI rows=1 maxlength=500 placeholder="${ro?'View only: ask the owner for Contributor access':'Message #'+esc(ch)}" ${ro?'disabled':''} aria-label="Message #${esc(ch)}" oninput="qvCInput(this)" onkeydown="qvCKey(event)" onfocus="qvKb()" onblur="setTimeout(qvKb,250)"></textarea><button class="btn qv-send" onclick="qvSend()" ${ro?'disabled':''} title="Send (Enter)" aria-label="Send message">${QVI.send}</button></div>
<div class=qv-cfo><small id=qvCnt>Shift+Enter for a new line</small><button class=qv-lk onclick="qvOpenChat()">Open full chat &#8599;</button></div>`}
function qvChatAfter(first){const i=qv$('qvCI');if(i){i.value=QV.drafts[QV.ch]||'';qvGrow(i)}QV.stick=1;QV.newN=0;qvList(true);const l=qv$('qvCL');if(l)l.scrollTop=l.scrollHeight;qvSeenMaybe()}
function qvDay(ms){const d=new Date(ms),n=new Date(),y=new Date(n.getTime()-864e5);return d.toDateString()===n.toDateString()?'Today':d.toDateString()===y.toDateString()?'Yesterday':d.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'})}
function qvLink(h){return h.replace(/https?:\/\/(?:(?!&quot;|&lt;|&gt;|&#)[^\s<])+/g,u=>{let t='';while(/[.,;:!?)\]']$/.test(u)){t=u.slice(-1)+t;u=u.slice(0,-1)}return`<a href="${u}" target=_blank rel="noopener noreferrer">${u}</a>${t}`})}
const qvId=id=>String(id==null?'':id).replace(/[^A-Za-z0-9_-]/g,'');
function qvMsgHtml(w){const m=w.m,mine=m.who===WHO,men=!mine&&qvMent(m),rx=m.rx||{},id=qvId(m.id);
 const rxs=RX.map(([k,e])=>{const a=rx[k]||[];return a.length?`<button class="qv-rx${a.indexOf(WHO)>=0?' on':''}" onclick="chReact('${id}','${k}')" title="${esc(a.join(', '))}" aria-label="${k} reaction, ${a.length}">${e}<i>${a.length}</i></button>`:''}).join('');
 let body='';if(m.text&&!m.win)body+=`<p>${qvLink(chTxt(m.text))}</p>`;if(m.stk)body+=chStkHtml(m.stk);if(m.win)body+=chWinHtml(m);if(m.poll)body+=chPollHtml(m);try{body+=attHtml(m)}catch(e){}
 const quick=CH.canW?`<span class=qv-rq>${RX.slice(0,5).map(([k,e])=>`<button onclick="chReact('${id}','${k}')" aria-label="React ${k}">${e}</button>`).join('')}</span>`:'';
 return`<div class="qv-m${mine?' mine':''}${w.cont?' cont':''}${men?' men':''}">${w.sep?`<div class=qv-sep><span>${qvDay(m.at)}</span></div>`:''}<div class=qv-mr>${w.cont?'<span class=qv-avs></span>':av(m.who,28)}<div class=qv-mb>${w.cont?'':`<div class=qv-mh><b>${esc(m.who)}</b><time>${fmtM(m.at)}</time></div>`}${body}${rxs?`<div class=qv-rxs>${rxs}</div>`:''}${quick}</div></div></div>`}
function qvKeyed(box,items){const old=new Map();Array.from(box.children).forEach(e=>{if(e._qk!==undefined)old.set(e._qk,e);else e.remove()});
 const els=items.map(it=>{let e=old.get(it.k);if(!e||e._qs!==it.s){const t=document.createElement('div');t.innerHTML=it.h;const n=t.firstElementChild||document.createElement('div');n._qk=it.k;n._qs=it.s;if(e)e.replaceWith(n);e=n}old.delete(it.k);return e});
 old.forEach(e=>e.remove());els.forEach((e,i)=>{if(box.children[i]!==e)box.insertBefore(e,box.children[i]||null)})}
function qvList(force){const l=qv$('qvCL');if(!l)return;const L=chIn(QV.ch).slice(-80);
 const near=l.scrollHeight-l.scrollTop-l.clientHeight<70;let anc=null,off=0;
 if(!near&&!force){const top=l.scrollTop;for(const e of l.children){if(e.offsetTop+e.offsetHeight>top){anc=e._qk;off=e.offsetTop-top;break}}}
 const prevIds=l._ids||[];const items=L.length?L.map((m,i)=>{const p=L[i-1],sep=!p||new Date(p.at).toDateString()!==new Date(m.at).toDateString(),cont=!sep&&!!p&&p.who===m.who&&m.at-p.at<3e5&&!m.win&&!m.poll&&!p.win&&!p.poll;
  const s=[sep?1:0,cont?1:0,m.who,m.at,m.text||'',m.stk||'',JSON.stringify(m.rx||{}),JSON.stringify(m.pv||{}),m.att?JSON.stringify(m.att).length:0,CH.canW?1:0].join('|');return{k:String(m.id),s,h:qvMsgHtml({m,sep,cont})}})
  :[{k:'__empty',s:QV.ch,h:`<div class="che qv-empty"><div class=chei>&#128172;</div><b>No messages yet in #${esc(QV.ch)}</b><small>Say hi, drop a win or ask a question.</small></div>`}];
 qvKeyed(l,items);const ids=L.map(m=>String(m.id));l._ids=ids;
 const fresh=ids.filter(x=>prevIds.indexOf(x)<0).length&&prevIds.length?L.filter(m=>prevIds.indexOf(String(m.id))<0&&m.who!==WHO).length:0;
 if(near||force||QV.stick){l.scrollTop=l.scrollHeight;QV.newN=0}else{if(anc!==null){const e=Array.from(l.children).find(x=>x._qk===anc);if(e)l.scrollTop=e.offsetTop-off}QV.newN+=fresh}
 qvJumpUi();const sub=qv$('qvCsub');if(sub){const h=qvChatSub();if(sub._h!==h){sub._h=h;sub.innerHTML=h}}const ce=qv$('qvCE');if(ce){ce.hidden=!CH.err;if(ce.textContent!==(CH.err||''))ce.textContent=CH.err||''}qvSeenMaybe()}
function qvJumpUi(){const j=qv$('qvJump'),l=qv$('qvCL');if(!j||!l)return;const far=l.scrollHeight-l.scrollTop-l.clientHeight>=70;j.hidden=!far;const n=qv$('qvJn');if(n)n.textContent=QV.newN?QV.newN+' new':''}
function qvCScroll(){const l=qv$('qvCL');if(!l)return;QV.stick=l.scrollHeight-l.scrollTop-l.clientHeight<70;if(QV.stick)QV.newN=0;qvJumpUi();if(QV.stick)qvSeenMaybe()}
function qvJumpLatest(){const l=qv$('qvCL');if(!l)return;QV.stick=1;QV.newN=0;l.scrollTop=l.scrollHeight;qvJumpUi();qvSeenMaybe()}
function qvChatVisible(){if(!ONLINE||document.hidden||!qv$('qvCL'))return false;if(qvPopped('chat'))return qvFloatShown()&&!qvPhone();return !!(RAIL&&QV.mounted==='chat')}
function qvSeenMaybe(){if(!qvChatVisible()||!QV.stick)return;const s=(D.chatSeen||{})[QV.ch]||0,l=chIn(QV.ch).slice(-1)[0];if(l&&l.at>s){chSeen(QV.ch);qvBadges();try{navRender()}catch(e){}}}
function qvCh(c){if(!CHN.some(x=>x[0]===c))return;const i=qv$('qvCI');if(i)QV.drafts[QV.ch]=i.value;QV.ch=c;qvSave();qvMentClose();
 const host=qv$('qvCL')?qv$('qvCL').closest('.qv-host'):null;if(host){const k=host.id==='qvRP'?'rail':'float';qvBuild(host,'chat',k)}const b=Array.from(document.querySelectorAll('.qv-chb')).find(x=>x.classList.contains('on'));if(b&&b.focus)b.focus()}
function qvGrow(t){t.style.height='auto';t.style.height=Math.min(120,Math.max(38,t.scrollHeight))+'px'}
function qvCInput(t){if(t.value.length>500)t.value=t.value.slice(0,500);QV.drafts[QV.ch]=t.value;qvGrow(t);qvMentScan(t);const n=qv$('qvCnt');if(n)n.innerHTML=t.value.length>400?(500-t.value.length)+' characters left':'Shift+Enter for a new line'}
function qvCKey(e){if(QV.mn.open){if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();QV.mn.i=(QV.mn.i+(e.key==='ArrowDown'?1:QV.mn.list.length-1))%QV.mn.list.length;qvMentPaint();return}
  if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();qvMentPick(QV.mn.i);return}if(e.key==='Escape'){e.preventDefault();qvMentClose();return}}
 if(e.key==='Escape'&&QV.emo){e.preventDefault();qvEmo(0);return}
 if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&e.keyCode!==229){e.preventDefault();qvSend()}}
function qvSend(){if(!CH.canW||!ONLINE)return;const i=qv$('qvCI');if(!i)return;const t=String(i.value||'').trim();if(!t)return;const ch=QV.ch;i.value='';QV.drafts[ch]='';qvGrow(i);qvMentClose();qvEmo(0);CH.err='';QV.stick=1;
 const p=chPost({ch,who:WHO,text:t.slice(0,500),at:Date.now()});if(p&&p.then)p.then(()=>{if(CH.err){QV.drafts[ch]=t;const j=qv$('qvCI');if(j&&!j.value){j.value=t;qvGrow(j)}const ce=qv$('qvCE');if(ce){ce.hidden=false;ce.textContent=CH.err}if(!CH.canW)qvRebuildChat()}});if(i.focus)i.focus()}
function qvRebuildChat(){const l=qv$('qvCL'),h=l&&l.closest('.qv-host');if(h)qvBuild(h,'chat',h.id==='qvRP'?'rail':'float')}
function qvMentScan(inp){const m=/@([A-Za-z]*)$/.exec(inp.value.slice(0,inp.selectionStart||inp.value.length));if(!m){qvMentClose();return}const q=m[1].toLowerCase(),L=D.agents.map(a=>a.name).filter(n=>n!==WHO&&n.toLowerCase().split(' ')[0].indexOf(q)===0).slice(0,5);QV.mn={open:L.length?1:0,i:0,list:L};qvMentPaint()}
function qvMentPaint(){const b=qv$('qvMN');if(!b)return;b.innerHTML=QV.mn.open?QV.mn.list.map((n,i)=>`<button role=option aria-selected=${i===QV.mn.i} class="${i===QV.mn.i?'on':''}" onmousedown="event.preventDefault();qvMentPick(${i})">${av(n,22)}<b>${esc(n)}</b></button>`).join(''):''}
function qvMentPick(i){const inp=qv$('qvCI'),n=QV.mn.list[i];if(!inp||!n)return;const pos=inp.selectionStart||inp.value.length,pre=inp.value.slice(0,pos).replace(/@([A-Za-z]*)$/,'@'+n.split(' ')[0]+' ');inp.value=(pre+inp.value.slice(pos)).slice(0,500);QV.drafts[QV.ch]=inp.value;qvMentClose();inp.focus();try{inp.setSelectionRange(pre.length,pre.length)}catch(e){}}
function qvMentClose(){QV.mn={open:0,i:0,list:[]};const b=qv$('qvMN');if(b)b.innerHTML=''}
const QVE=['&#128512;','&#128514;','&#128293;','&#128176;','&#127942;','&#128079;','&#128640;','&#128175;','&#128591;','&#128170;','&#127881;','&#128526;','&#129297;','&#10024;','&#128077;','&#9989;'];
function qvEmo(v){QV.emo=v===undefined?(QV.emo?0:1):(v?1:0);const x=qv$('qvCX'),b=qv$('qvEB');if(b)b.setAttribute('aria-expanded',QV.emo?'true':'false');if(x)x.innerHTML=QV.emo?`<div class=qv-emo>${QVE.map(e=>`<button onclick="qvEmoPick('${e}')">${e}</button>`).join('')}</div>`:''}
function qvEmoPick(e){const i=qv$('qvCI');if(!i)return;const t=document.createElement('textarea');t.innerHTML=e;const p=i.selectionStart==null?i.value.length:i.selectionStart;i.value=(i.value.slice(0,p)+t.value+i.value.slice(i.selectionEnd==null?p:i.selectionEnd)).slice(0,500);QV.drafts[QV.ch]=i.value;i.focus();try{i.setSelectionRange(p+t.value.length,p+t.value.length)}catch(x){}}
function qvOpenChat(){CH.ch=QV.ch;openTab('Team Chat');try{chScroll()}catch(e){}if(qvOverlay())toggleRail(false)}

/* ---------- FLOOR quick view ---------- */
function qvStream(sid){if(sid==='local-cam')return VC.cam||null;if(sid==='local-scr')return VC.scr||null;for(const p in VC.rs){const m=VC.rs[p];if(m&&m[sid])return m[sid]}const v=VC.vid[sid];return(v&&v.srcObject)||null}
function qvFloorModel(){const L=vcList(),me=vcMe(),scs=VC.room?vcScreens():[],cur=scs.find(s=>s.sid===QV.stage)||scs.find(s=>s.sid===VC.stage)||scs[0]||null;
 const ppl=L.map(p=>{const x=p.presence||{},mine=p.peer===me,nm=String(x.nm||'Guest').slice(0,40),cs=mine?(VC.cam?'local-cam':''):vcStreamOf(p.peer,x).cam;return{id:String(p.peer),nm,mine,mu:!!x.mu,lo:!!x.lo,sp:!!x.sp&&!x.mu,cam:!!x.cam,scr:!!x.scr,hd:!!x.hd,cs:x.cam&&cs?cs:''}});
 return{room:!!VC.room,on:!!VC.on,ppl,scs,cur,tiles:ppl.filter(p=>p.cs).slice(0,6)}}
function qvFloorHtml(where){const head=where==='rail'?`<div class="rh qv-h"><div><h4>Sales Floor</h4><small class=qv-fsub></small></div><div class=qv-ha><button class=qv-ib onclick="qvPop('floor')" title="Pop out: watch the floor on every page" aria-label="Pop out the sales floor into a floating window">${QVI.pop}</button><button class=x onclick="toggleRail(false)" title="Close" aria-label="Close the rail">&times;</button></div></div>`:'';
 return`${head}<div class=qv-fb><div class=qv-fs></div><div class=qv-fg></div><div class=qv-frh></div><div class=qv-fr role=list aria-label="On the floor"></div><p class="cherr qv-fe" hidden></p></div><div class=qv-fc></div>`}
const qvFirst=n=>String(n||'').split(' ')[0];
function qvTileHtml(p){return`<div class="qv-t" data-p="${esc(p.id)}"><div class=qv-vs data-qvs="${esc(p.cs)}"></div><span class=qv-tn>${p.mu?`<i class=qv-mi title="Muted">${qvI('micoff')}</i>`:''}${esc(p.mine?'You':qvFirst(p.nm))}</span></div>`}
function qvRowHtml(p){const ic=(k,t,c)=>`<i class="qv-pi ${c||''}" title="${t}" aria-label="${t}">${qvI(k)}</i>`;
 return`<div class="qv-p" role=listitem data-p="${esc(p.id)}"><span class=qv-pav>${av(p.nm,30)}</span><span class=qv-pn><b>${esc(p.nm)}${p.mine?' (you)':''}</b><small>${p.lo?'Listening only':p.mu?'Muted':'Connected'}${p.hd?' &middot; hand raised':''}</small></span><span class=qv-pis>${p.mu||p.lo?ic('micoff','Microphone off','red'):ic('mic','Microphone on')}${p.cam?ic('cam','Camera on','on'):''}${p.scr?ic('screen','Sharing a screen','on'):''}${p.hd?ic('hand','Hand raised','gold'):''}</span></div>`}
function qvSet(el,h){if(el&&el._h!==h){el._h=h;el.innerHTML=h;return true}return false}
function qvFloorPaint(host){const b=host.querySelector('.qv-fb');if(!b)return;const M=qvFloorModel(),fs=b.querySelector('.qv-fs'),fg=b.querySelector('.qv-fg'),fr=b.querySelector('.qv-fr'),frh=b.querySelector('.qv-frh'),fe=b.querySelector('.qv-fe'),fc=host.querySelector('.qv-fc'),sub=host.querySelector('.qv-fsub');
 const sharing=M.scs.length,cams=M.ppl.filter(p=>p.cam).length;
 if(sub){const t=M.room?(M.ppl.length?M.ppl.length+' on the floor'+(sharing?' &middot; '+sharing+' sharing':'')+(cams?' &middot; '+cams+' camera'+(cams===1?'':'s'):''):'Nobody on the floor yet'):'Not connected in this view';qvSet(sub,t)}
 if(!M.room){qvSet(fs,'');fs._k='';qvKeyed(fg,[]);fg.className='qv-fg n0';qvKeyed(fr,[]);if(fe)fe.hidden=true;
  qvSet(frh,`<div class="che qv-nr"><b>Voice needs the live connection</b><small>Open the published link while signed in to Claude, with Contributor access, and the sales floor turns on.</small></div>`);qvSet(fc,`<div class=qv-cr><button class="btn o" onclick="qvOpenFloor()">Open Sales Floor &#8599;</button></div>`);return}
 const cur=M.cur,sk=cur?cur.sid+'|'+cur.nm+'|'+M.scs.map(s=>s.sid+':'+s.nm).join(','):'';
 if(fs._k!==sk){fs._k=sk;fs.innerHTML=cur?`<div class=qv-st role=button tabindex=0 aria-label="${esc(cur.me?'Your shared screen':cur.nm+'\u2019s shared screen')}. Enlarge" onclick="qvLightbox(this.dataset.s)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}" data-s="${esc(cur.sid)}"><div class="qv-vs qv-scr" data-qvs="${esc(cur.sid)}"></div><span class=qv-stl><i class=qv-live>LIVE</i>${cur.me?'You are sharing your screen':esc(cur.nm)+' is sharing'}</span><span class=qv-ex aria-hidden=true>${QVI.max}</span></div>${M.scs.length>1?`<div class=qv-ssw>${M.scs.map(s=>`<button class="chip${s.sid===cur.sid?' on':''}" data-s="${esc(s.sid)}" onclick="QV.stage=this.dataset.s;qvFloorSoon()">${s.me?'Your screen':esc(qvFirst(s.nm))+'\u2019s screen'}</button>`).join('')}</div>`:''}`:''}
 fg.className='qv-fg n'+M.tiles.length+(cur?' strip':'');qvKeyed(fg,M.tiles.map(p=>({k:p.id+'|'+p.cs,s:p.nm+'|'+p.mu+'|'+p.mine,h:qvTileHtml(p)})));
 Array.from(fg.children).forEach(e=>{const p=M.tiles.find(x=>x.id===e.dataset.p);if(p)e.classList.toggle('sp',p.sp)});
 qvSet(frh,M.ppl.length?`<h5 class=qv-sh>On the floor <b>${M.ppl.length}</b></h5>`:`<div class="che qv-none"><b>Nobody is on the floor</b><small>Join to start a huddle. Teammates get an alert when you walk in.</small></div>`);
 qvKeyed(fr,M.ppl.map(p=>({k:p.id,s:[p.nm,p.mine,p.mu,p.lo,p.cam,p.scr,p.hd].join('|'),h:qvRowHtml(p)})));Array.from(fr.children).forEach(e=>{const p=M.ppl.find(x=>x.id===e.dataset.p);if(p)e.classList.toggle('sp',p.sp)});
 if(fe){const t=VC.err||'';fe.hidden=!t;if(fe.textContent!==t)fe.textContent=t}
 const can=!!(vcMD()&&vcMD().getDisplayMedia),bt=(on,ic,vis,lb,fn,cls,dis)=>`<button class="qv-ctl${on?' on':''}${cls?' '+cls:''}" onclick="${fn}" title="${lb}" aria-label="${lb}" aria-pressed=${!!on} ${dis?'disabled':''}>${ic}<span>${vis}</span></button>`;
 qvSet(fc,M.on?`<div class=qv-cr>${bt(VC.muted||!VC.mic,VC.muted||!VC.mic?qvI('micoff'):qvI('mic'),VC.mic?(VC.muted?'Unmute':'Mute'):'No mic',VC.mic?(VC.muted?'Unmute your microphone':'Mute your microphone'):'No microphone: listening only','vcMute()',VC.muted||!VC.mic?'red':'',!VC.mic)}${bt(!!VC.cam,qvI('cam'),'Camera',VC.cam?'Turn camera off':'Turn camera on','vcCam()')}${can?bt(!!VC.scr,qvI('screen'),VC.scr?'Stop':'Share',VC.scr?'Stop sharing your screen':'Share your screen','vcScr()'):''}${bt(0,qvI('door'),'Leave','Leave the floor','vcLeave()','red')}</div><div class=qv-cr2><button class=qv-lk onclick="qvOpenFloor()">Open Sales Floor &#8599;</button></div>`
  :`<div class=qv-cr><button class="btn qv-join" onclick="qvJoin()">${qvI('enter')}<span>Join the floor</span></button><button class="btn o" onclick="qvOpenFloor()">Open Sales Floor &#8599;</button></div><small class=qv-hint>Mic on, camera optional. Leave any time.</small>`)}
function qvJoin(){if(!VC.room||VC.on)return;const r=vcJoin();if(r&&r.then)r.then(()=>qvFloorSoon(),()=>qvFloorSoon());qvFloorSoon()}
function qvOpenFloor(){CH.ch='__voice';openTab('Team Chat');if(qvOverlay())toggleRail(false)}
function qvLightbox(sid){const md=qv$('md');if(!md||!sid)return;const s=vcScreens().find(x=>x.sid===sid),lb=s?(s.me?'Your shared screen':s.nm+'\u2019s shared screen'):'Shared screen';
 md.innerHTML=`<div class=mb onclick="if(event.target==this)qvLbClose()"><div class="c qv-lbc qv-host qv-lb" role=dialog aria-label="${esc(lb)}, enlarged"><div class=qv-lbh><h4>${esc(lb)}</h4><button class=x onclick="qvLbClose()" aria-label="Close the enlarged view">&times;</button></div><div class="qv-vs qv-lbv" data-qvs="${esc(sid)}"></div></div></div>`;qvVids();const x=md.querySelector('.qv-lbh .x');if(x&&x.focus)x.focus()}
function qvLbClose(){const md=qv$('md');if(!md)return;md.querySelectorAll('.qv-lb video').forEach(v=>{try{v.srcObject=null}catch(e){}});if(md.querySelector('.qv-lb'))md.innerHTML=''}

/* ---------- display copies of the streams: muted, attached only while visible, never stop the real tracks ---------- */
function qvVis(h){if(!ONLINE||!h||!h.isConnected)return false;if(h.classList.contains('qv-lb'))return true;if(h.id==='qvRP')return !!RAIL;if(h.closest('#qvF'))return qvFloatShown();return false}
function qvVids(){const live=new Set();document.querySelectorAll('[data-qvs]').forEach(s=>{const h=s.closest('.qv-host');let v=s.querySelector('video');
 if(!qvVis(h)){if(v&&v.srcObject)v.srcObject=null;return}const st=qvStream(s.dataset.qvs);
 if(!v){v=document.createElement('video');v.muted=true;v.defaultMuted=true;v.autoplay=true;v.playsInline=true;v.setAttribute('muted','');v.setAttribute('playsinline','');s.appendChild(v)}
 v.muted=true;if(v.srcObject!==st)v.srcObject=st||null;if(st&&v.paused){const p=v.play&&v.play();if(p&&p.catch)p.catch(()=>{})}live.add(v)});
 QV.vs.forEach(v=>{if(!live.has(v)){if(v.srcObject&&!v.isConnected)v.srcObject=null;if(!v.isConnected)QV.vs.delete(v)}});live.forEach(v=>QV.vs.add(v))}
function qvPeers(){qvFloorSoon()}
function qvFloorSoon(){if(QV.ft)return;QV.ft=setTimeout(()=>{QV.ft=0;qvFloorTick()},40)}
function qvFloorTick(){if(!ONLINE)return;try{qvBadges();document.querySelectorAll('.qv-host').forEach(h=>{if(h.querySelector('.qv-fb'))qvFloorPaint(h)});qvMini();qvRailCls();qvVids()}catch(e){}}
function qvChatSoon(){if(QV.ct)return;QV.ct=setTimeout(()=>{QV.ct=0;qvChatTick()},30)}
function qvChatTick(){if(!ONLINE)return;try{let mx=0;chAll().forEach(m=>{if(m.who!==WHO&&m.at>mx)mx=m.at});if(mx>QV.lastAt){const was=QV.lastAt;QV.lastAt=mx;if(was&&!(qvChatVisible()))qvPulseChat()}
 if(qv$('qvCL'))qvList();qvBadges();qvMini()}catch(e){}}

/* ---------- pop-out window (desktop) / mini-player (phone) ---------- */
function qvFloatShown(){const f=qv$('qvF');return !!(ONLINE&&QV.fl.on&&f&&!f.hidden)}
function qvFloatHide(){return !!(tab==='Team Chat'&&CH.ch==='__voice'&&QV.fl.v==='floor'&&!QV.fl.pin)}
function qvPop(v){if(!ONLINE)return;const i=qv$('qvCI');if(i)QV.drafts[QV.ch]=i.value;QV.fl.on=1;QV.fl.v=v==='chat'?'chat':'floor';if(QV.tab===QV.fl.v)QV.tab='alerts';qvSave();if(qvOverlay())toggleRail(false);else railRender();qvFloat(true)}
function qvDock(){const v=QV.fl.v;QV.fl.on=0;qvSave();qvFloatRemove();QV.tab=v;qvSave();if(!RAIL)toggleRail(true);else railRender();qvVids()}
function qvFloatClose(){QV.fl.on=0;qvSave();qvFloatRemove();railRender();qvVids();const b=qv$('bell');if(b&&b.focus)b.focus()}
function qvFloatRemove(){const f=qv$('qvF');if(f){f.querySelectorAll('video').forEach(v=>{try{v.srcObject=null}catch(e){}});f.remove()}}
function qvGeo(){const W=innerWidth,H=innerHeight,g=QV.fl,rw=RAIL&&!qvOverlay()?qvRailW():0;g.w=Math.max(300,Math.min(g.w||380,W-16));g.h=Math.max(220,Math.min(g.h||420,H-16));
 if(g.x<0||g.y<0){g.x=W-g.w-24-rw;g.y=H-g.h-24}g.x=Math.max(8,Math.min(g.x,W-g.w-8));g.y=Math.max(8,Math.min(g.y,H-g.h-8));return g}
function qvFloatTabs(c,f){const t=qv$('qvFT');if(!t)return;c=c||qvCounts();f=f||qvFloorInfo();const h=['chat','floor'].map(k=>`<button role=tab aria-selected=${QV.fl.v===k} class="qv-tb${QV.fl.v===k?' on':''}" onclick="qvFloatView('${k}')">${qvTabInner(k,c,f)}</button>`).join('');if(t._h!==h){t._h=h;t.innerHTML=h}}
function qvFloatView(k){if(QV.fl.v===k)return;const i=qv$('qvCI');if(i)QV.drafts[QV.ch]=i.value;QV.fl.v=k;if(QV.tab===k)QV.tab='alerts';qvSave();railRender();qvFloat(true)}
function qvFloat(rebuild){let f=qv$('qvF');if(!ONLINE||!QV.fl.on){qvFloatRemove();return}const mini=qvPhone();
 if(f&&(rebuild||f._mini!==mini)){qvFloatRemove();f=null}
 if(!f){f=document.createElement('div');f.id='qvF';f._mini=mini;f.className='qv-f'+(mini?' qv-mini':'');f.setAttribute('role','dialog');f.setAttribute('aria-label',QV.fl.v==='chat'?'Team Chat window':'Sales Floor window');document.body.appendChild(f);
  if(mini){f.innerHTML=`<div class="qv-mt qv-host"></div><div class=qv-mx></div><div class=qv-mb2></div>`}
  else{f.innerHTML=`<div class=qv-fh id=qvFH tabindex=0 title="Drag to move. Arrow keys move, Shift and arrows resize." aria-label="Window title bar: arrow keys move, Shift and arrow keys resize"><span class=qv-grip aria-hidden=true></span><div class=qv-ftb id=qvFT role=tablist aria-label="Window view"></div><span class=qv-sp></span><button class="qv-ib${QV.fl.pin?' on':''}" id=qvFPin onclick="qvPin()" aria-pressed=${!!QV.fl.pin} title="Pin: keep it visible on the Sales Floor page too" aria-label="Pin the window">${QVI.pin}</button><button class=qv-ib onclick="qvDock()" title="Back to the rail" aria-label="Move back into the rail">${QVI.dock}</button><button class=x onclick="qvFloatClose()" title="Close the window (Esc). The call keeps going." aria-label="Close the window">&times;</button></div><div id=qvFP class="qv-pane qv-host qv-fpane"></div><i class=qv-rz aria-hidden=true></i>`;
   qvDragInit(f);qvFloatTabs();qvBuild(qv$('qvFP'),QV.fl.v,'float')}}
 if(!mini){const g=qvGeo();f.style.left=g.x+'px';f.style.top=g.y+'px';f.style.width=g.w+'px';f.style.height=g.h+'px'}
 const hide=qvFloatHide();if(f.hidden!==hide)f.hidden=hide;if(mini)qvMini();qvVids()}
function qvPin(){QV.fl.pin=QV.fl.pin?0:1;qvSave();const b=qv$('qvFPin');if(b){b.classList.toggle('on',!!QV.fl.pin);b.setAttribute('aria-pressed',QV.fl.pin?'true':'false')}toast(QV.fl.pin?'Pinned: the window stays on the Sales Floor page too':'Unpinned: the window hides on the Sales Floor page',1)}
function qvMini(){const f=qv$('qvF');if(!f||!f._mini)return;const t=f.querySelector('.qv-mt'),x=f.querySelector('.qv-mx'),b=f.querySelector('.qv-mb2');if(!t||!x||!b)return;
 if(QV.fl.v==='floor'){const M=qvFloorModel(),sid=M.cur?M.cur.sid:M.tiles[0]?M.tiles[0].cs:'',nm=M.cur?(M.cur.me?'You are sharing':qvFirst(M.cur.nm)+' is sharing'):M.ppl.length?M.ppl.slice(0,3).map(p=>p.mine?'You':qvFirst(p.nm)).join(', ')+(M.ppl.length>3?' +'+(M.ppl.length-3):''):'Nobody on the floor yet';
  if(t._k!==sid){t._k=sid;t.innerHTML=sid?`<div class=qv-vs data-qvs="${esc(sid)}"></div>`:`<span class=qv-mi2>${qvI('mic')}</span>`}
  qvSet(x,`<b>Sales Floor${M.ppl.length?` <em class="qv-n ok">${M.ppl.length}</em>`:''}</b><small>${esc(nm)}</small>`);
  qvSet(b,`${M.on?`<button class="qv-ib${VC.muted||!VC.mic?' red':''}" onclick="vcMute()" aria-label="${VC.muted?'Unmute':'Mute'}" ${VC.mic?'':'disabled'}>${VC.muted||!VC.mic?qvI('micoff'):qvI('mic')}</button>`:M.room?`<button class="qv-ib" onclick="qvJoin()" aria-label="Join the floor">${qvI('enter')}</button>`:''}<button class=qv-ib onclick="qvDock()" aria-label="Expand">${QVI.up}</button><button class=x onclick="qvFloatClose()" aria-label="Close the mini player">&times;</button>`)}
 else{const L=chIn(QV.ch),m=L[L.length-1],u=chUn(QV.ch);if(t._k!=='chat'){t._k='chat';t.innerHTML='<span class=qv-mi2>&#128172;</span>'}
  qvSet(x,`<b>#${esc(QV.ch)}${u?` <em class=qv-n>${u}</em>`:''}</b><small>${m?esc(qvFirst(m.who))+': '+esc(String(m.text||(m.stk?'sticker':m.win?'posted a win':m.poll?'started a poll':'sent a file')).replace(/\s+/g,' ').slice(0,70)):'No messages yet'}</small>`);
  qvSet(b,`<button class=qv-ib onclick="qvDock()" aria-label="Expand the chat">${QVI.up}</button><button class=x onclick="qvFloatClose()" aria-label="Close the mini player">&times;</button>`)}
 qvVids()}
function qvDragInit(f){const hd=f.querySelector('.qv-fh'),rz=f.querySelector('.qv-rz');let st=null;
 const down=(e,mode)=>{if(e.button!==undefined&&e.button!==0)return;if(mode==='m'&&e.target.closest('button'))return;e.preventDefault();const g=qvGeo();st={mode,x:e.clientX,y:e.clientY,g:{x:g.x,y:g.y,w:g.w,h:g.h},id:e.pointerId};try{(mode==='m'?hd:rz).setPointerCapture(e.pointerId)}catch(x){}f.classList.add('qv-drag')};
 const move=e=>{if(!st)return;const dx=e.clientX-st.x,dy=e.clientY-st.y,g=QV.fl;if(st.mode==='m'){g.x=st.g.x+dx;g.y=st.g.y+dy}else{g.w=st.g.w+dx;g.h=st.g.h+dy}const q=qvGeo();f.style.left=q.x+'px';f.style.top=q.y+'px';f.style.width=q.w+'px';f.style.height=q.h+'px'};
 const up=()=>{if(!st)return;const m=st.mode;st=null;f.classList.remove('qv-drag');if(m==='m')qvSnap();qvSave();qvFloat()};
 hd.addEventListener('pointerdown',e=>down(e,'m'));rz.addEventListener('pointerdown',e=>down(e,'r'));[hd,rz].forEach(el=>{el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up)});
 hd.addEventListener('keydown',e=>{const k=e.key,d=e.altKey?4:24;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(k)<0||e.target!==hd)return;e.preventDefault();const g=QV.fl;if(e.shiftKey){if(k==='ArrowLeft')g.w-=d;if(k==='ArrowRight')g.w+=d;if(k==='ArrowUp')g.h-=d;if(k==='ArrowDown')g.h+=d}else{if(k==='ArrowLeft')g.x-=d;if(k==='ArrowRight')g.x+=d;if(k==='ArrowUp')g.y-=d;if(k==='ArrowDown')g.y+=d}qvGeo();qvSave();qvFloat()})}
function qvSnap(){const g=qvGeo(),W=innerWidth,H=innerHeight,m=16,s=48;if(g.x<s)g.x=m;if(W-g.x-g.w<s)g.x=W-g.w-m;if(g.y<s)g.y=m;if(H-g.y-g.h<s)g.y=H-g.h-m;qvGeo()}

/* ---------- phone: keep the composer above the on-screen keyboard ---------- */
function qvKb(){try{const vv=globalThis.visualViewport,r=qv$('rail');if(!vv||!r)return;const kb=Math.max(0,Math.round(innerHeight-vv.height-vv.offsetTop));const on=qvOverlay()&&kb>60&&document.activeElement&&document.activeElement.id==='qvCI';r.style.bottom=on?kb+'px':'';if(on){const l=qv$('qvCL');if(l&&QV.stick)l.scrollTop=l.scrollHeight}}catch(e){}}

/* ---------- hooks into the existing update paths (wrappers keep the original behaviour) ---------- */
const _qvRR=railRender;
railRender=function(nid){const r=qv$('rail');if(!r)return;if(!ONLINE||QV.tab==='alerts'){const ae=document.activeElement,fid=ae&&r.contains(ae)&&/^qvT_/.test(ae.id||'')?ae.id:'';QV.mounted='alerts';_qvRR.apply(this,arguments);const ri=r.querySelector('.ri');if(ri&&ONLINE&&!ri.querySelector('.qv-tabs'))ri.insertAdjacentHTML('afterbegin',qvTabsHtml());if(fid){const e=qv$(fid);if(e&&e.focus)e.focus()}}else qvRailPane();qvRailCls();qvVids()};
const _qvHud=hudRender;
hudRender=function(){const r=_qvHud.apply(this,arguments);try{qvBadges()}catch(e){}return r};
const _qvPR=popRender;
popRender=function(){const r=_qvPR.apply(this,arguments);try{const p=qv$('pop'),rl=qv$('rail');if(p&&RAIL&&IW()>1100&&rl&&rl.classList.contains('qv-wide'))p.style.right=(qvRailW()+16)+'px'}catch(e){}return r};
const _qvCR=chRefresh;
chRefresh=function(){const r=_qvCR.apply(this,arguments);qvChatSoon();return r};
const _qvCI=chIncoming;
chIncoming=function(m){if(m&&m.who!==WHO&&QV.ch===m.ch&&qvChatVisible()){const pa=pushAlert;pushAlert=function(){return null};try{return _qvCI.apply(this,arguments)}finally{pushAlert=pa}}return _qvCI.apply(this,arguments)};
const _qvVP=vcPaint;
vcPaint=function(){const r=_qvVP.apply(this,arguments);qvFloorSoon();return r};
const _qvGo=go;
go=function(){const r=_qvGo.apply(this,arguments);try{if(QV.fl.on&&ONLINE)qvFloat()}catch(e){}return r};
const _qvRI=railInit;
railInit=function(){const r=_qvRI.apply(this,arguments);try{qvLogin()}catch(e){}return r};
const _qvLV=lockView;
lockView=function(){try{qvLbClose();qvFloatRemove();QV.mounted='';const r=qv$('rail');if(r){r.style.bottom='';r.classList.remove('qv-wide','qv-tabbed')}QV.vs.forEach(v=>{try{v.srcObject=null}catch(e){}});QV.vs.clear()}catch(e){}return _qvLV.apply(this,arguments)};
function qvLogin(){let mx=0;chAll().forEach(m=>{if(m.who!==WHO&&m.at>mx)mx=m.at});QV.lastAt=mx;QV.mounted='';if(QV.fl.on)qvFloat(true);qvBoot();railRender();qvBadges()}
function qvBoot(){if(QV.booted)return;QV.booted=1;
 addEventListener('keydown',e=>{if(e.key!=='Escape'||!ONLINE)return;const md=qv$('md');if(md&&md.innerHTML)return;if(QV.mn.open||QV.emo)return;const t=e.target,f=qv$('qvF'),r=qv$('rail');
  if(f&&t&&f.contains(t)){e.preventDefault();qvFloatClose();return}
  if(RAIL&&r&&((t&&r.contains(t))||qvOverlay())){e.preventDefault();toggleRail(false);const b=qv$('bell');if(b&&b.focus)b.focus()}},true);
 addEventListener('resize',()=>{clearTimeout(QV.rt);QV.rt=setTimeout(()=>{if(!ONLINE)return;if(QV.fl.on)qvFloat();qvKb()},120)});
 try{const vv=globalThis.visualViewport;if(vv&&vv.addEventListener){vv.addEventListener('resize',qvKb);vv.addEventListener('scroll',qvKb)}}catch(e){}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ONLINE){qvChatSoon();qvFloorSoon()}});
 document.addEventListener('load',e=>{try{const l=qv$('qvCL');if(l&&QV.stick&&e.target&&l.contains(e.target))l.scrollTop=l.scrollHeight}catch(x){}},true)}
/*QVend*/
