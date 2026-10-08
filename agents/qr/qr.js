/*QRstart*/
/* Recognition in the bell Quick View (prefix qr): a "Recognition" chip in the CHAT tab's channel bar shows the latest
   Morning Recognition (goals, quote, who set it) with its discussion thread and a reply box. Thin runtime wrappers over the
   Quick View (qv*) and the Morning Recognition module (mr*): replies use mrPostMsg, read state uses mrSeen, live updates
   arrive through mrRefresh. No new subscriptions. */
(function(){
 if(typeof QV==='undefined'||typeof qvChatHtml!=='function'||typeof mrThread!=='function')return;
 const QR='__mr';
 const on=()=>QV.ch===QR;
 const rec=()=>{try{return mrLatest()}catch(e){return null}};
 const canW=()=>!!(MR&&MR.canW&&ONLINE);
 const unread=()=>{try{return mrUnreadAll()}catch(e){return 0}};
 function chip(){const n=unread();return`<button role=tab aria-selected=${on()} class="qv-chb qr-chb${on()?' on':''}" onclick="qvCh('${QR}')" title="Morning Recognition and its discussion">&#9728; Recognition${n?`<em class=qv-n aria-label="${n} unread">${Math.min(99,n)}</em>`:''}</button>`}
 const _chs=qvChsHtml;
 qvChsHtml=function(c){const h=_chs.apply(this,arguments);if(!on())return chip()+h;return chip()+h.replace(/ aria-selected=true class="qv-chb on"/g,' aria-selected=false class="qv-chb"')};
 const _sub=qvChatSub;
 qvChatSub=function(){if(!on())return _sub.apply(this,arguments);const r=rec(),n=r?mrThread(r.id).length:0;return`&#9728; Morning Recognition &middot; ${n} repl${n===1?'y':'ies'} &middot; ${MR.live?'<span class=qv-live2>LIVE</span>':'LOCAL DEMO'}`};
 const _html=qvChatHtml;
 qvChatHtml=function(where){if(!on())return _html.apply(this,arguments);
  QV.ch=CHN[0][0];let h;try{h=_html.apply(this,arguments)}finally{QV.ch=QR}
  const r=rec(),ro=!canW()||!r,ph=!r?'Nothing posted yet: replies open once the Morning Recognition is up':!canW()?'View only':'Reply to '+esc(String(r.by||'').split(' ')[0]||'the')+'&rsquo;s Morning Recognition (type @ to mention)';
  h=h.replace(/(<div class=qv-chs id=qvChs role=tablist aria-label="Channels">)[\s\S]*?(<\/div>\s*<div class=qv-cw>)/,(m,a,b)=>a+qvChsHtml()+b);
  h=h.replace(/aria-label="Messages in #[^"]*"/,'aria-label="Morning Recognition discussion"');
  h=h.replace(/<textarea id=qvCI([^>]*?)placeholder="[^"]*"([^>]*?)aria-label="[^"]*"/,(m,a,b)=>'<textarea id=qvCI'+a.replace(/ disabled/g,'')+'placeholder="'+ph+'"'+b.replace(/ disabled/g,'')+(ro?' disabled':'')+' aria-label="Reply to the Morning Recognition"');
  if(ro)h=h.replace(/(<button class=qv-ib onclick="qvEmo\(\)"[^>]*?)( disabled)?>/,'$1 disabled>').replace(/(<button class="btn qv-send"[^>]*?)( disabled)?(\s*title=)/,'$1 disabled$3');
  else h=h.replace(/(<button class=qv-ib onclick="qvEmo\(\)"[^>]*?) disabled>/,'$1>').replace(/(<button class="btn qv-send" onclick="qvSend\(\)") disabled/,'$1');
  h=h.replace(/<button class=qv-lk onclick="qvOpenChat\(\)">[^<]*<\/button>/,'<button class=qv-lk onclick="qvOpenChat()">Open Morning Recognition &#8599;</button>');
  return h};
 function card(r){
  if(!r)return`<div class="che qv-empty qr-empty"><div class=chei>&#9728;</div><b>No Morning Recognition yet</b><small>When today&rsquo;s recognition is posted it shows up here with the whole team&rsquo;s replies.</small></div>`;
  let P=[];try{P=mrProg(r,1)}catch(e){}const hit=P.filter(p=>p.hit).length,td=r.day===mrToday();
  const goals=P.length?`<div class=qr-g><div class=qr-gh><b>${td?'TODAY&rsquo;S GOALS':'GOALS'}</b><em class="${hit===P.length?'all':''}">${hit}/${P.length} hit</em></div>${P.slice(0,5).map(p=>{const pc=Math.max(0,Math.min(1,p.pct||0));let lb='';try{lb=mrGoalTxt({m:p.m,t:p.t})}catch(e){lb=String(p.m)}return`<div class="qr-gr${p.hit?' hit':''}"><span>${esc(lb)}</span><i><u style="width:${Math.round(pc*100)}%"></u></i><small>${esc(String(Math.round(p.v*10)/10))}/${esc(String(p.t))}</small></div>`}).join('')}</div>`:'';
  return`<article class=qr-card aria-label="Morning Recognition from ${esc(r.by)}"><div class=qr-top><span aria-hidden=true>&#9728;</span><b>MORNING RECOGNITION</b><time>${esc(td?'TODAY':mrShort(r.day).toUpperCase())}</time></div>
${r.quote?`<blockquote class=qr-q>&ldquo;${esc(r.quote)}&rdquo;</blockquote>`:''}${goals}${r.note?`<p class=qr-n><b>FOCUS</b> ${esc(r.note)}</p>`:''}
<div class=qr-by>${av(r.by,22)}<span>Set by <b>${esc(r.by)}</b> &middot; ${fmtM(r.at)}</span></div></article><div class=qr-div><span>DISCUSSION</span></div>`}
 const _list=qvList;
 qvList=function(force){if(!on())return _list.apply(this,arguments);const l=qv$('qvCL');if(!l)return;
  const r=rec(),L=r?mrThread(r.id):[];let html;
  try{html=card(r)+(r?`<div class=qr-th>${mrMsgsHtml(r.id)}</div>`:'')}catch(e){html=card(null)}
  const sig=(r?r.id+'|'+(r.ed||0)+'|'+JSON.stringify(r.rx||{}):'none')+'|'+L.length+'|'+L.map(m=>m.id+':'+JSON.stringify(m.rx||{})).join(',')+'|'+(canW()?1:0)+'|'+(r?JSON.stringify(mrProg(r,1).map(p=>p.v)):'');
  const near=l.scrollHeight-l.scrollTop-l.clientHeight<70,prev=l._qrn||0;
  if(l._qrs!==sig){const top=l.scrollTop;l._qrs=sig;l.innerHTML=html;l._ids=null;Array.from(l.children).forEach(e=>{delete e._qk});if(near||force||QV.stick){l.scrollTop=l.scrollHeight;QV.newN=0}else{l.scrollTop=top;QV.newN+=Math.max(0,L.filter(m=>!mrMine(m.who)).length-prev)}}
  l._qrn=L.filter(m=>!mrMine(m.who)).length;
  qvJumpUi();const sub=qv$('qvCsub');if(sub){const h=qvChatSub();if(sub._h!==h){sub._h=h;sub.innerHTML=h}}
  const ce=qv$('qvCE');if(ce){const er=MR.err||'';ce.hidden=!er;if(ce.textContent!==er)ce.textContent=er}
  qvSeenMaybe()};
 const _seen=qvSeenMaybe;
 qvSeenMaybe=function(){if(!on())return _seen.apply(this,arguments);if(!qvChatVisible()||!QV.stick)return;const r=rec();if(!r)return;const b=unread();try{mrSeen(r.id)}catch(e){}if(unread()!==b){qvBadges();try{navRender()}catch(e){}}};
 const _ch=qvCh;
 qvCh=function(c){if(c!==QR){if(on()){const l=qv$('qvCL');if(l){l._qrs=null;l.innerHTML=''}}return _ch.apply(this,arguments)}
  const i=qv$('qvCI');if(i)QV.drafts[QV.ch]=i.value;QV.ch=QR;qvSave();qvMentClose();
  const host=qv$('qvCL')?qv$('qvCL').closest('.qv-host'):null;if(host){const l=qv$('qvCL');if(l)l._qrs=null;qvBuild(host,'chat',host.id==='qvRP'?'rail':'float')}
  const b=document.querySelector('.qr-chb');if(b&&b.focus)b.focus()};
 const _send=qvSend;
 qvSend=function(){if(!on())return _send.apply(this,arguments);if(!canW())return;const r=rec();const i=qv$('qvCI');if(!i||!r)return;const t=String(i.value||'').trim();if(!t)return;
  i.value='';QV.drafts[QR]='';qvGrow(i);qvMentClose();qvEmo(0);MR.err='';QV.stick=1;
  const p=mrPostMsg({rid:r.id,who:mrMe(),text:t.slice(0,500),at:Date.now(),att:null});
  Promise.resolve(p).then(ok=>{if(ok===false){QV.drafts[QR]=t;const j=qv$('qvCI');if(j&&!j.value){j.value=t;qvGrow(j)}}MR.draft='';qvList(true)});if(i.focus)i.focus()};
 const _open=qvOpenChat;
 qvOpenChat=function(){if(!on())return _open.apply(this,arguments);try{const r=rec();if(r)MR.sel=r.id}catch(e){}openTab('Morning Recognition');if(qvOverlay())toggleRail(false)};
 const _mrr=mrRefresh;
 mrRefresh=function(){const v=_mrr.apply(this,arguments);try{if(on()&&qv$('qvCL'))qvList()}catch(e){}try{const b=qv$('qvChs');if(b&&ONLINE){const h=qvChsHtml();if(b._qrh!==h){b._qrh=h;b.innerHTML=h}}}catch(e){}return v};
})();
/*QRend*/
