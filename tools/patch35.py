import re
p='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(p,encoding='utf-8').read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)==cnt,('NOT FOUND' if not s.count(a) else 'COUNT %d'%s.count(a),a[:120])
    s=s.replace(a,b)

# ---------- 1) shared collection for Blueprint access requests ----------
rep("'checkins','learn'],SYB={learn:4,","'checkins','learn','lnreq'],SYB={lnreq:2,learn:4,")

# ---------- 2) Blueprint checkpoints ----------
rep("{n:'The Payout',s:'Know how you get paid'}];",
    "{n:'The Payout',s:'Know how you get paid'},{n:'New Agent Info',s:'Start here'},{n:'Scripts',s:'Word tracks for every call'},{n:'General Help',s:'Product guides and how-tos'}];")

# ---------- 3) Blueprint sections (mirrors the Discord category; content is added one section at a time) ----------
BP=[('code-of-conduct',4,'&#128721;','Code of Conduct','How we carry ourselves and the agency'),
 ('leadership-guide',4,'&#129416;','Leadership Guide','How leadership works here'),
 ('insurance-product-guide',4,'&#128202;','Insurance Product Guide','The products we offer'),
 ('state-license-price-grid',4,'&#9878;&#65039;','State License Price Grid','What licensing costs by state'),
 ('classic-script',5,'&#128196;','Classic Script','The core sales script'),
 ('americo-workflow',5,'&#129413;','Americo Workflow','The Americo application, step by step'),
 ('veterans-sales-script',5,'&#128372;&#65039;','Veterans Sales Script','The script for veteran leads'),
 ('final-expense-script',5,'&#128128;','Final Expense Script','The script for final expense calls'),
 ('beneficiary-and-referral-script',5,'&#128106;','Beneficiary & Referral Script','The script for beneficiary and referral calls'),
 ('text-and-voicemail-script',5,'&#9742;&#65039;','Text & Voicemail Script','What to text and what to leave'),
 ('beneficiary-script',5,'&#128101;','Beneficiary Script','The script for beneficiary calls'),
 ('recruiting-call-script',5,'&#128373;&#65039;','Recruiting Call Script','The script for recruiting calls'),
 ('rebuttals',5,'&#128548;','Rebuttals','Answers to common objections'),
 ('fex-product-guide',6,'&#10145;&#65039;','FEX Product Guide','Final expense products explained'),
 ('8-steps-of-a-sale',6,'8&#65039;&#8419;','8 Steps of a Sale','The full sale, start to finish'),
 ('iuls-explained',6,'&#129297;','IULs Explained','Indexed universal life, explained'),
 ('annuity-breakdown',6,'&#128176;','Annuity Breakdown','How annuities work'),
 ('1035-exchanges',6,'&#8596;&#65039;','1035 Exchanges','Exchanging an existing policy or annuity'),
 ('carrier-compatibility',6,'&#9992;&#65039;','Carrier Compatibility','Which carriers fit which clients')]
mods=',\n'.join("{id:'bp-%s',tr:1,ph:%d,ic:'%s',t:'%s',sub:'%s',min:0,soon:1}"%(i,ph,ic,t.replace("'","\\'"),sb.replace("'","\\'")) for i,ph,ic,t,sb in BP)
rep("e:'$100,000 in monthly life volume earns an $8,000 bonus.'}]}\n];",
    "e:'$100,000 in monthly life volume earns an $8,000 bonus.'}]},\n/* ===== SECTION 02 · NEW BROKER BLUEPRINT: opens after Section 01 is cleared AND the Agency Owner approves the access request. soon:1 = shell waiting for content. ===== */\n"+mods+"\n];\nLNM.forEach(m=>{if(!m.slides)m.slides=[{t:m.t,h:()=>lnBpSoon(m.id)}]});")

# ---------- 4) progress engine: section gate + "coming soon" shells never block the road ----------
rep("function lnStates(u){let prev=true;return LNM.map((m,i)=>{const r=lnRec(u,m.id),done=m.auto?prev:!!r,unlocked=prev||!!r;prev=done;return{m,i,r,done,unlocked,auto:!!m.auto}})}",
    "function lnStates(u){let prev=true,s1=true,g=null;return LNM.map((m,i)=>{const tr=m.tr||0;if(tr===1&&g===null){g=lnAccess(u)&&(s1||lnOwnerU(u));prev=g}\n const r=lnRec(u,m.id),soon=!!m.soon,done=soon?false:m.auto?prev:!!r,unlocked=prev||!!r;if(!soon)prev=done;if(!tr)s1=s1&&done;return{m,i,r,done,unlocked,auto:!!m.auto,soon,tr}})}")

helpers=r'''
/* ===== NEW BROKER BLUEPRINT: sections + owner-approved access ===== */
const lnOwnerU=u=>roleOf(u)==='Owner/Agent';
const lnReq=u=>(D.lnreq||[]).filter(r=>r&&r.u===u).sort((a,b)=>(b.at||0)-(a.at||0))[0]||null;
const lnAccess=u=>lnOwnerU(u)||(lnReq(u)||{}).st==='approved';
const lnSecDone=(S,T)=>{const L=S.filter(x=>x.tr===T&&!x.soon);return L.length>0&&L.every(x=>x.done)};
const lnBpOpen=(u,S)=>lnAccess(u)&&(lnSecDone(S,0)||lnOwnerU(u));
const lnQ=u=>esc(u).replace(/'/g,"\\'");
const lnWhen=t=>{try{return new Date(t).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}catch(e){return''}};
function lnTrkCur(S){if(LN.trkU!==WHO||LN.trk==null){LN.trkU=WHO;S=S||lnStates(WHO);LN.trk=lnBpOpen(WHO,S)&&lnSecDone(S,0)?1:0}return LN.trk}
function lnTrk(t){LN.trk=t?1:0;LN.trkU=WHO;LN.id=null;LN.mode='lesson';LN.anim=1;if(document.getElementById('lnb'))lnR(1);else try{openTab('Learning Network')}catch(e){}}
function lnBpSoon(id){const m=LNM.find(x=>x.id===id),L=LNM.filter(x=>x.tr===1);return`<div class="lnsoon lnbps"><div class=lnsi>${m.ic}</div><small class=lnkick>NEW BROKER BLUEPRINT &middot; ${LNP[m.ph].n.toUpperCase()} &middot; ${L.indexOf(m)+1} OF ${L.length}</small><h4>${m.t}</h4><p>${m.sub}.</p><p>Leadership is loading the official material for this section. Once it is published it becomes a full lesson with a knowledge check, right here.</p><p class=lnok>Nothing to complete yet. You are clear to keep moving.</p></div>`}
function lnReqSend(){const S=lnStates(WHO);if(lnAccess(WHO)&&lnBpOpen(WHO,S))return lnTrk(1);if(!lnSecDone(S,0))return toast('Clear every module in Agency Essentials first.');
 const r=lnReq(WHO),now=Date.now();if(r&&r.st==='pending')return toast('Your request is already with the Agency Owner.');
 D.lnreq=D.lnreq||[];if(r){r.st='pending';r.at=now;r.by='';r.dt=0}else D.lnreq.push({_i:'bp_'+String(WHO).replace(/\W+/g,'_'),_t:now*1000,u:WHO,st:'pending',at:now});
 save();try{beep('info')}catch(e){}toast('Access request sent to the Agency Owner',1);const n=document.getElementById('lnn');if(n)n.remove();LN.anim=1;if(document.getElementById('lnb'))lnR();else try{openTab('Learning Network')}catch(e){}}
function lnReqCancel(){const r=lnReq(WHO);if(!r||r.st!=='pending')return;r.st='cancelled';r.dt=Date.now();save();LN.anim=0;lnR()}
function lnReqSet(u,st){if(!lnOwner())return;const r=lnReq(u);if(!r)return;r.st=st;r.by=WHO;r.dt=Date.now();save();toast(st==='approved'?'Blueprint access granted to '+u:'Request from '+u+' declined',1);LN.anim=0;lnR()}
function lnRevoke(u){if(!lnOwner())return;ask('Remove '+esc(u)+'\u2019s access to the New Broker Blueprint? They will have to request it again.',()=>{const r=lnReq(u);if(r){r.st='revoked';r.by=WHO;r.dt=Date.now();save();LN.anim=0;lnR();toast('Blueprint access removed',1)}})}
function lnSecTabs(S,T){const s1=S.filter(x=>x.tr===0),d1=s1.filter(x=>x.done).length,ok1=d1===s1.length,b=S.filter(x=>x.tr===1),br=b.filter(x=>!x.soon),db=br.filter(x=>x.done).length,open=lnBpOpen(WHO,S),r=lnReq(WHO),st=r?r.st:'';
 const s2=open?(br.length?`${db}/${br.length} cleared`:`${b.length} sections &middot; content coming soon`):!ok1?'&#128274; Clear Section 01 to unlock':st==='pending'?'&#9203; Waiting on the Agency Owner':st==='denied'?'&#9940; Declined: request again':'&#9993; Ready: request access';
 return`<div class=lnsec><button class="lnsc ${T===0?'on':''} ${ok1?'done':''}" onclick="lnTrk(0)"><small>SECTION 01</small><b>Agency Essentials</b><span>${ok1?'&#10003; ':''}${d1}/${s1.length} cleared</span><i><s style="width:${Math.round(d1/s1.length*100)}%"></s></i></button><button class="lnsc ${T===1?'on':''} ${open?'':'lock'}" onclick="lnTrk(1)"><small>SECTION 02</small><b>New Broker Blueprint</b><span>${s2}</span><i><s style="width:${br.length?Math.round(db/br.length*100):0}%"></s></i></button></div>`}
function lnGateHtml(S){const s1=S.filter(x=>x.tr===0),d1=s1.filter(x=>x.done).length,ok1=d1===s1.length,r=lnReq(WHO),st=r?r.st:'';let k,txt,btn='';
 if(!ok1){k='s1';txt=`Clear every module in Section 01 to unlock your access request. <b>${s1.length-d1}</b> to go.`;const c=s1.find(x=>!x.done&&x.unlocked);if(c)btn=`<button class=btn onclick="lnOpen('${c.m.id}')">Continue Agency Essentials &rarr;</button>`}
 else if(st==='pending'){k='wait';txt=`Request sent ${lnWhen(r.at)}. The Agency Owner reviews it, and you get an alert the moment it is approved.`;btn=`<button class="btn o" onclick="lnReqCancel()">Cancel request</button>`}
 else if(st==='denied'){k='no';txt=`The Agency Owner declined your last request (${lnWhen(r.dt)}). Talk with them, then send a new request.`;btn=`<button class=btn onclick="lnReqSend()">Request again &rarr;</button>`}
 else if(st==='revoked'){k='no';txt='Your Blueprint access was removed by the Agency Owner. Send a new request when you are ready.';btn=`<button class=btn onclick="lnReqSend()">Request access &rarr;</button>`}
 else{k='ask';txt='You cleared Agency Essentials. Send your access request to the Agency Owner to open the New Broker Blueprint.';btn=`<button class="btn lngo" onclick="lnReqSend()">&#9993; Send access request &rarr;</button>`}
 const step=(n,l,ok,cur)=>`<div class="lngs ${ok?'ok':''} ${cur?'cur':''}"><b>${ok?'&#10003;':n}</b><span>${l}</span></div>`,sent=st==='pending';
 return`<div class="lngt ${k}"><div class=lngti>${k==='wait'?'&#9203;':k==='no'?'&#9940;':'&#128272;'}</div><div class=lngtb><small>SECTION 02 &middot; OPENS BY APPROVAL</small><b>New Broker Blueprint</b><p>${txt}</p><div class=lngst>${step(1,'Clear Agency Essentials ('+d1+'/'+s1.length+')',ok1,!ok1)}${step(2,'Send your access request',sent,ok1&&!sent)}${step(3,'Agency Owner approves',false,sent)}</div>${btn}</div></div>`}
function lnReqPanel(){if(!lnOwner())return'';const P=(D.lnreq||[]).filter(r=>r&&r.st==='pending').sort((a,b)=>(a.at||0)-(b.at||0));if(!P.length)return'';
 return`<div class="c lnrq"><h4>Blueprint access requests <em>${P.length} waiting</em></h4>${P.map(r=>{const ss=lnStates(r.u),s1=ss.filter(x=>x.tr===0),d=s1.filter(x=>x.done).length;return`<div class=lnrqr>${av(r.u,36)}<div class=lnrqn><b>${esc(r.u)}</b><small>${d===s1.length?'&#10003; Cleared Agency Essentials':'<span class=neg>Section 01: '+d+'/'+s1.length+' cleared</span>'} &middot; requested ${lnWhen(r.at)}</small></div><button class=btn onclick="lnReqSet('${lnQ(r.u)}','approved')">Approve</button><button class="btn o" onclick="lnReqSet('${lnQ(r.u)}','denied')">Decline</button></div>`}).join('')}</div>`}
function lnS1Next(){return lnAccess(WHO)?'<p class=lnp style="text-align:center">You cleared Agency Essentials. <b>Section 02 &middot; New Broker Blueprint</b> is open for you.</p>':'<p class=lnp style="text-align:center">You cleared Agency Essentials. That is the standard. Next step: send your access request to the Agency Owner to unlock <b>Section 02 &middot; New Broker Blueprint</b>.</p>'}
function lnS1Btn(){if(lnAccess(WHO))return`<button class=btn onclick="lnTrk(1)">Open the Blueprint &rarr;</button>`;const r=lnReq(WHO);return r&&r.st==='pending'?'<button class="btn o" disabled>Request pending</button>':`<button class="btn lngo" onclick="lnReqSend()">&#9993; Request Blueprint access</button>`}
function lnNagReq(){lnNagShow(1,1);const d=document.getElementById('lnn');if(!d)return;const h=d.querySelector('h1'),pp=d.querySelector('p'),lc=d.querySelector('.lc'),g=document.getElementById('lnnGo'),ci=d.querySelector('.ci');
 if(ci)ci.innerHTML='&#128272;';if(h)h.textContent='UNLOCK THE NEW BROKER BLUEPRINT';if(pp)pp.innerHTML='You cleared every module in Agency Essentials.<br>Send your access request to the Agency Owner to open Section 02.';if(lc)lc.textContent='SECTION 01 COMPLETE';
 if(g){g.textContent='SEND ACCESS REQUEST';g.onclick=()=>{d.remove();LNAG.snz=Date.now()+900000;lnReqSend()}}}
function lnBpScan(){try{if(!ONLINE||!WHO)return;const R=D.lnreq||[];
 if(lnOwner())R.filter(r=>r&&r.st==='pending').forEach(r=>pushAlert({sev:'warn',t:'Blueprint access request',m:r.u+' cleared Agency Essentials and is asking for access to the New Broker Blueprint.',go:['Learning Network'],k:'bpq-'+r._i+'-'+r.at}));
 const me=lnReq(WHO);if(me&&me.dt&&Date.now()-me.dt<6*3600e3&&me.by!==WHO){if(me.st==='approved')pushAlert({sev:'ok',t:'New Broker Blueprint unlocked',m:'The Agency Owner approved your access. Section 02 is open in the Learning Network.',go:['Learning Network'],k:'bpa-'+me._i+'-'+me.dt});else if(me.st==='denied')pushAlert({sev:'warn',t:'Blueprint request declined',m:'Talk with the Agency Owner, then send a new request from the Learning Network.',go:['Learning Network'],k:'bpd-'+me._i+'-'+me.dt})}}catch(e){}}
setInterval(lnBpScan,6000);
'''
rep("const lnXP=u=>(D.learn||[]).filter(r=>r.u===u).reduce((s,r)=>s+(r.xp||0),0);",
    "const lnXP=u=>(D.learn||[]).filter(r=>r.u===u).reduce((s,r)=>s+(r.xp||0),0);"+helpers)

# ---------- 5) opening a module: section-aware lock messages ----------
rep("const p=S[s.i-1];toast('Locked. Clear '+(p?p.m.t:'the previous module')+' first.');return}",
    "const p=S[s.i-1];toast(s.tr===1&&!lnBpOpen(WHO,S)?(lnSecDone(S,0)?'The New Broker Blueprint opens once the Agency Owner approves your access request.':'Clear every module in Agency Essentials, then request access to the New Broker Blueprint.'):'Locked. Clear '+(p?p.m.t:'the previous module')+' first.');return}")
rep("LN.id=id;LN.step=0;LN.mode='lesson';","LN.id=id;LN.trk=s.tr;LN.trkU=WHO;LN.step=0;LN.mode='lesson';")

# ---------- 6) completion alert per section ----------
rep("const S=lnStates(WHO);if(first&&S.every(x=>x.done))try{pushAlert({sev:'info',t:'Training complete',m:WHO+' cleared every module in the Learning Network.'},true)}catch(e){}",
    "const S=lnStates(WHO),T=m.tr||0;if(first&&lnSecDone(S,T))try{pushAlert(T?{sev:'ok',t:'New Broker Blueprint complete',m:WHO+' cleared the New Broker Blueprint.'}:{sev:'info',t:'Agency Essentials complete',m:'Section 01 cleared. Next step: request access to the New Broker Blueprint from the Agency Owner.',go:['Learning Network']},true)}catch(e){}")

# ---------- 7) road map: section switcher, gate, owner requests, per-section road + standings ----------
a=s.index('function lnMap(){');b=s.index('function lnTop(m,st){')
newmap=r'''function lnMap(){const S=lnStates(WHO),T=lnTrkCur(S),ST=S.filter(x=>x.tr===T),RL=ST.filter(x=>!x.soon),cl=S.filter(x=>x.done).length,N=RL.length,tc=RL.filter(x=>x.done).length,xp=lnXP(WHO),rk=lnRank(cl),nr=lnNextRank(cl),open=T===0||lnBpOpen(WHO,S),pvon=!!(LN.pv&&lnOwner()),cur=open||pvon?ST.find(x=>!x.done&&x.unlocked&&!x.soon)||null:null,started=ST.some(x=>x.r),rq=lnReq(WHO);
const prog=N?`${tc} of ${N} modules cleared`:`${ST.length} sections mapped &middot; content coming soon`;
const right=!open&&!pvon?(!lnSecDone(S,0)?`<button class=btn style="margin:0" onclick="lnTrk(0)">Finish Section 01 &rarr;</button>`:rq&&rq.st==='pending'?'<div class="lnwin wait">&#9203; AWAITING APPROVAL</div>':`<button class="btn lngo" style="margin:0" onclick="lnReqSend()">Request access &rarr;</button>`):cur?`<button class=btn style="margin:0" onclick="lnOpen('${cur.m.id}')">${started?'Continue':'Start'} ${T?'the Blueprint':'training'} &rarr;</button>`:N&&tc===N?(T?'<div class=lnwin>&#127942; BLUEPRINT CLEARED</div>':'<div class=lnwin>&#127942; SECTION CLEARED</div>'):'<div class="lnwin soon">&#128208; CONTENT COMING SOON</div>';
const hero=`<div class=lnh><div class=lnhl>${av(WHO,64)}<div><small>YOUR RANK</small><div class=lnrk>${rk[1]}</div><div class=lnxp>${xp} XP</div></div></div><div class=lnhm><small class=lnhs>${T?'SECTION 02 &middot; NEW BROKER BLUEPRINT':'SECTION 01 &middot; AGENCY ESSENTIALS'}</small><div class=lnbar2><i><b style="width:${N?Math.round(tc/N*100):0}%"></b></i></div><small>${prog}${nr?` &middot; <b>${nr[0]-cl}</b> more to reach <b class=neg>${nr[1]}</b>`:' &middot; <b class=pos>Top rank reached</b>'}</small></div><div class=lnhr>${right}</div></div>`;
let lastPh=-1,pn=0;const road=ST.map((s,k)=>{const m=s.m,st=s.soon?(s.unlocked||pvon?'soon':'lock'):s.done?'done':(s.unlocked||pvon)?(cur&&cur.i===s.i?'cur':'open'):'lock';let hd='';
if(m.ph!==lastPh){lastPh=m.ph;pn++;const pd=ST.filter(x=>x.m.ph===m.ph),pr=pd.filter(x=>!x.soon);hd=`<div class=lnph><span>CHECKPOINT 0${pn}</span><b>${LNP[m.ph].n}</b><small>${LNP[m.ph].s} &middot; ${pr.length?pr.filter(x=>x.done).length+'/'+pr.length:pd.length+' sections &middot; coming soon'}</small></div>`}
const best=s.r?` &middot; Best ${s.r.sc}/${s.r.n}`:'';
const act=s.soon?(st==='lock'?'<em class="lnbd dim">LOCKED</em>':'<em class="lnbd soon">COMING SOON</em>'):s.auto?(s.done?'<em class=lnbd>AUTO-CLEARED</em>':'<em class="lnbd dim">LOCKED</em>'):s.done?`<em class="lnbd ok">CLEARED${best}</em>`:st==='lock'?'<em class="lnbd dim">LOCKED</em>':'<em class="lnbd go">START &rarr;</em>';
return hd+`<div class="lnn ${st} ${s.auto?'auto':''}" id=lnn_${m.id}><div class=lnnd>${st==='cur'?'<span class=lncar>&#127950;</span>':''}<b>${s.done?'&#10003;':st==='lock'?'&#128274;':m.ic}</b></div><button class=lnnc onclick="lnOpen('${m.id}')" aria-label="${esc(m.t)}${st==='lock'?' (locked)':''}"><span class=lnni>${m.ic}</span><span class=lnnt><small>STEP ${k+1}${s.soon?' &middot; CONTENT COMING SOON':m.min?` &middot; ~${m.min} MIN &middot; +${100}&ndash;${150} XP`:' &middot; NO TASKS'}</small><b>${m.t}</b><small>${m.sub}</small></span>${act}</button></div>`}).join('');
const names=D.agents.map(a=>a.name).concat(['Agency Owner']),rows=names.map(n=>{const ss=lnStates(n),s1=ss.filter(x=>x.tr===0),c=ss.filter(x=>x.done).length,c1=s1.filter(x=>x.done).length;return{n,c,c1,n1:s1.length,xp:lnXP(n),rk:lnRank(c)[1],own:lnOwnerU(n),rq:lnReq(n),acc:lnAccess(n)}}).sort((a,b)=>b.c-a.c||b.xp-a.xp);
const chip=r=>r.own?'<em class="lnbpc own" title="Owners always have Blueprint access">OWNER</em>':r.acc?`<em class="lnbpc ok" title="Approved by ${esc((r.rq&&r.rq.by)||'the owner')}${r.rq&&r.rq.dt?' on '+lnWhen(r.rq.dt):''}">BLUEPRINT &#10003;</em>`:r.rq&&r.rq.st==='pending'?'<em class="lnbpc wait">REQUESTED</em>':r.c1===r.n1?'<em class="lnbpc rdy">CAN REQUEST</em>':'<em class=lnbpc>BLUEPRINT &#128274;</em>';
const oact=r=>lnOwner()&&!r.own?(r.rq&&r.rq.st==='pending'?`<button class="lnmini ok" onclick="lnReqSet('${lnQ(r.n)}','approved')" title="Approve Blueprint access" aria-label="Approve Blueprint access for ${esc(r.n)}">&#10003;</button><button class=lnmini onclick="lnReqSet('${lnQ(r.n)}','denied')" title="Decline" aria-label="Decline Blueprint request from ${esc(r.n)}">&times;</button>`:r.acc?`<button class=lnmini onclick="lnRevoke('${lnQ(r.n)}')" title="Remove Blueprint access" aria-label="Remove Blueprint access for ${esc(r.n)}">&#8856;</button>`:''):'';
const team=`<h3>Team Standings</h3><div class="c lnteam">${rows.map((r,i)=>`<div class="lnt ${r.n===WHO?'me':''}"><span class=lnti>${i+1}</span>${av(r.n,30)}<div class=lntn><b>${esc(r.n)}</b><small>${r.rk} &middot; ${r.xp} XP</small></div>${chip(r)}${oact(r)}<div class=lntb><i><b style="width:${Math.round(r.c1/r.n1*100)}%"></b></i><small>${r.c1}/${r.n1} Section 01</small></div>${lnOwner()&&r.c?`<button class=x title="Reset progress" aria-label="Reset progress for ${esc(r.n)}" onclick="lnReset('${esc(r.n).replace(/'/g,"\\'")}')">&#8635;</button>`:'<span style="width:20px"></span>'}</div>`).join('')}</div>`;
const pv=lnOwner()?`<label class=lnpv><input type=checkbox ${LN.pv?'checked':''} onchange="LN.pv=this.checked;lnR()"> Owner preview: open every module without clearing the ones before it</label>`:'';
return lnSecTabs(S,T)+lnReqPanel()+hero+(T===1&&!open?lnGateHtml(S):'')+`<div class="lnroad ${LN.anim?'an':''} ${T===1&&!open&&!pvon?'gated':''}">${road}</div>`+pv+team}
'''
s=s[:a]+newmap+s[b:]

# ---------- 8) lesson header + coming-soon handling ----------
rep("function lnTop(m,st){const n=m.slides.length;return`<div class=lntop><button class=\"btn o\" style=\"margin:0\" onclick=\"lnBack()\">&larr; Road map</button><div class=lntt><small>STEP ${LNM.indexOf(m)+1} OF ${LNM.length} &middot; ${LNP[m.ph].n.toUpperCase()}</small>",
    "function lnTop(m,st){const L=LNM.filter(x=>(x.tr||0)===(m.tr||0));return`<div class=lntop><button class=\"btn o\" style=\"margin:0\" onclick=\"lnBack()\">&larr; Road map</button><div class=lntt><small>${m.tr?'NEW BROKER BLUEPRINT':'AGENCY ESSENTIALS'} &middot; STEP ${L.indexOf(m)+1} OF ${L.length} &middot; ${LNP[m.ph].n.toUpperCase()}</small>")
rep("const nxt=last?(m.auto?","const nxt=last?((m.auto||m.soon)?")
rep("<small class=lnkick>${m.auto?'COMING SOON':","<small class=lnkick>${(m.auto||m.soon)?'COMING SOON':")

# ---------- 9) results: per-section next step + Blueprint request at the end of Section 01 ----------
rep("function lnResult(m){const r=LN.res,S=lnStates(WHO),i=LNM.indexOf(m),nx=LNM[i+1],cl=S.filter(x=>x.done).length,rk=lnRank(cl),all=S.every(x=>x.done),pct=r.sc/r.n*100;",
    "function lnResult(m){const r=LN.res,S=lnStates(WHO),T=m.tr||0,TL=LNM.filter(x=>(x.tr||0)===T),gi=LNM.indexOf(m),i=TL.indexOf(m),nx=TL.slice(i+1).find(x=>!x.soon)||null,cl=S.filter(x=>x.done).length,rk=lnRank(cl),all=lnSecDone(S,T),pct=r.sc/r.n*100;")
rep("${all?'YOU ARE A WINNER':'MODULE CLEARED'}","${all?(T?'BLUEPRINT COMPLETE':'YOU ARE A WINNER'):'MODULE CLEARED'}")
rep("Rank: <b class=neg>${rk[1]}</b> &middot; ${cl} of ${S.length} cleared</p>","Rank: <b class=neg>${rk[1]}</b> &middot; ${S.filter(x=>x.tr===T&&x.done).length} of ${S.filter(x=>x.tr===T&&!x.soon).length} cleared in ${T?'the Blueprint':'Agency Essentials'}</p>")
rep("${all?'<p class=lnp style=\"text-align:center\">You cleared the entire Learning Network. That is the standard.</p>':nx?",
    "${all?(T?'<p class=lnp style=\"text-align:center\">You cleared the New Broker Blueprint. That is the standard.</p>':lnS1Next()):nx?")
rep("LN.step=LNM[${i}].slides.length-1;","LN.step=LNM[${gi}].slides.length-1;")
rep("${nx&&!all?`<button class=btn onclick=\"lnOpen('${(()=>{const t=S.find(x=>!x.done&&x.unlocked);return t?t.m.id:nx.id})()}')\">Continue &rarr;</button>`:''}</div></div>`}",
    "${nx&&!all?`<button class=btn onclick=\"lnOpen('${(()=>{const t=S.find(x=>x.tr===T&&!x.done&&x.unlocked&&!x.soon);return t?t.m.id:nx.id})()}')\">Continue &rarr;</button>`:''}${all&&!T?lnS1Btn():''}</div></div>`}")

# ---------- 10) sidebar: section switch + modules of the open section ----------
rep("if(k==='Learning Network'){it=lnStates(WHO).map(s=>({l:s.m.ic+' '+s.m.t,on:LN.id===s.m.id,st:s.done?'ok':(s.unlocked?'':'lock'),f:\"lnSub('\"+s.m.id+\"')\"}))}",
    "if(k==='Learning Network'){const S=lnStates(WHO),T=lnTrkCur(S);it=[{l:'01 &middot; Agency Essentials',on:!LN.id&&T===0,st:lnSecDone(S,0)?'ok':'',c:'sec',f:'lnTrk(0)'},{l:'02 &middot; New Broker Blueprint',on:!LN.id&&T===1,st:lnBpOpen(WHO,S)?'':'lock',c:'sec',f:'lnTrk(1)'}].concat(S.filter(s=>s.tr===T).map(s=>({l:s.m.ic+' '+s.m.t,on:LN.id===s.m.id,st:s.done?'ok':(s.unlocked?'':'lock'),f:\"lnSub('\"+s.m.id+\"')\"})))}")
rep("'<div class=nsubs>'+it.map(x=>`<button class=\"nsb ${x.on?'on':''} ${x.st}\"","'<div class=nsubs>'+it.map(x=>`<button class=\"nsb ${x.on?'on':''} ${x.st} ${x.c||''}\"")

# ---------- 11) 30-minute training nudge: only for work the agent can actually do ----------
rep(" const S=lnStates(WHO);if(!S.length||S.every(x=>x.done)){const e=document.getElementById('lnn');if(e)e.remove();return}\n if(tab==='Learning Network'||Date.now()<LNAG.snz)return;\n lnNagShow(S.filter(x=>x.done).length,S.length)}catch(e){}}",
    " const S=lnStates(WHO),s1=S.filter(x=>x.tr===0),d1=s1.every(x=>x.done),rq=lnReq(WHO),bp=S.filter(x=>x.tr===1&&!x.soon),bt=lnBpOpen(WHO,S)&&bp.some(x=>!x.done&&x.unlocked);\n const kind=!d1?'s1':(!lnAccess(WHO)&&!rq)?'req':bt?'bp':'';\n if(!kind){const e=document.getElementById('lnn');if(e)e.remove();return}\n if(tab==='Learning Network'||Date.now()<LNAG.snz)return;\n if(kind==='s1')lnNagShow(s1.filter(x=>x.done).length,s1.length);else if(kind==='bp')lnNagShow(bp.filter(x=>x.done).length,bp.length);else lnNagReq()}catch(e){}}")

# ---------- 12) styles ----------
css='''/*LNBPcss*/
.lnsec{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:12px}
.lnsc{position:relative;text-align:left;background:var(--card);border:1px solid var(--ln);border-left:4px solid var(--ln);color:var(--tx);font:inherit;padding:12px 44px 14px 16px;cursor:pointer;transition:.2s;overflow:hidden;animation:fade .45s both}
.lnsc+.lnsc{animation-delay:.06s}.lnsc small{display:block;font-size:10px;letter-spacing:3px;color:var(--red)}
.lnsc b{display:block;font-size:16px;text-transform:uppercase;letter-spacing:1px;margin:2px 0}.lnsc span{display:block;font-size:11px;color:var(--mut)}
.lnsc i{display:block;height:4px;background:#0f0f15;margin-top:10px}.lnsc i s{display:block;height:100%;text-decoration:none;background:linear-gradient(90deg,#8d1030,var(--red));box-shadow:0 0 10px #ff1f4f80;transition:width .6s}
.lnsc:hover{transform:translateY(-2px);border-color:#ff1f4f66}.lnsc.on{border-color:var(--red);background:linear-gradient(110deg,#2a0a14,var(--card) 60%);box-shadow:0 0 30px #ff1f4f22}
.lnsc.done span{color:var(--ok)}.lnsc.lock::after{content:'\\1F512';position:absolute;right:14px;top:14px;font-size:18px;opacity:.75}
.lnhs{display:block;font-size:10px;letter-spacing:3px;color:var(--red);margin-bottom:6px}
.lngt{display:flex;gap:18px;align-items:flex-start;margin:12px 0 6px;padding:18px 20px;background:linear-gradient(120deg,#1d0a12,#121218 60%);border:1px solid #ff1f4f55;border-left:4px solid var(--red);box-shadow:0 0 40px #ff1f4f1a;animation:fade .5s both}
.lngti{flex:none;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;font-size:26px;border:2px solid var(--red);box-shadow:0 0 22px #ff1f4f66;background:#0f0f15}
.lngt.wait .lngti{border-color:#ffb020;box-shadow:0 0 22px #ffb02066;animation:lnpl 1.6s infinite}.lngt.no .lngti{border-color:#7a7a88;box-shadow:none}
.lngtb{flex:1;min-width:0}.lngtb small{font-size:10px;letter-spacing:3px;color:var(--red)}.lngtb>b{display:block;font-size:20px;text-transform:uppercase;margin:2px 0 6px}.lngtb p{color:#d6d6de;margin:0 0 12px}
.lngst{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}.lngs{display:flex;align-items:center;gap:8px;padding:6px 12px 6px 6px;border:1px solid var(--ln);background:#0f0f15;font-size:11px;color:var(--mut)}
.lngs b{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;border:1px solid var(--ln);font-size:11px;color:var(--tx)}
.lngs.ok{border-color:#3ddc9766;color:var(--tx)}.lngs.ok b{background:var(--ok);border-color:var(--ok);color:#06110c}.lngs.cur{border-color:var(--red);color:var(--tx);box-shadow:0 0 14px #ff1f4f33}.lngs.cur b{border-color:var(--red);color:var(--red)}
.btn.lngo{animation:lnglow 2s ease-in-out infinite}@keyframes lnglow{50%{box-shadow:0 0 26px #ff1f4fcc}}
.lnroad.gated{opacity:.55;filter:saturate(.6)}
.lnn.soon .lnnd{border-style:dashed;border-color:#ff1f4f88}.lnn.soon .lnnc{border-left-style:dashed;border-left-color:#ff1f4f88}
.lnbd.soon{border-color:#ff1f4f88;color:#ff8da3;border-style:dashed}.lnwin.wait{color:#ffb020}.lnwin.soon{color:#ff8da3;font-size:12px}
.lnrq{margin-bottom:12px;border-color:#ffb02066}.lnrq h4 em{font-style:normal;margin-left:8px;color:#ffb020;letter-spacing:1px}
.lnrqr{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--ln)}.lnrq h4+.lnrqr{border-top:0}.lnrqn{flex:1;min-width:0}.lnrqn b{display:block}.lnrqr .btn{margin:0}
.lnbpc{font-style:normal;font-size:9px;font-weight:700;letter-spacing:1px;padding:3px 7px;border:1px solid var(--ln);color:var(--mut);white-space:nowrap}
.lnbpc.ok{border-color:#3ddc9780;color:var(--ok)}.lnbpc.wait{border-color:#ffb02080;color:#ffb020}.lnbpc.rdy{border-color:#ff1f4f80;color:#ff8da3}.lnbpc.own{border-color:#ff1f4f;color:#fff;background:#ff1f4f33}
.lnmini{width:26px;height:26px;flex:none;border:1px solid var(--ln);background:#0f0f15;color:var(--tx);cursor:pointer;font-size:13px;padding:0}.lnmini.ok{border-color:var(--ok);color:var(--ok)}.lnmini:hover{border-color:var(--red)}
.lnbps .lnkick{display:block;margin:6px 0 2px}.nsb.sec{font-weight:700;letter-spacing:.04em;color:var(--tx)}
@media(max-width:760px){.lnsec{grid-template-columns:1fr}.lngt{flex-direction:column}.lnt .lnbpc{display:none}}
/*LNBPcssend*/
'''
s=re.sub(r'/\*LNBPcss\*/.*?/\*LNBPcssend\*/\n?','',s,flags=re.S)
rep('/*TC2end*/','/*TC2end*/\n'+css)
open(p,'w',encoding='utf-8').write(s)
print('ok',len(s))
