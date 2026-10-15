/*GSstart*/
/* v111 Call Script: John Montini's veteran final expense guide inside the Clients CRM (Clients > Call Script, plus a Call script
   button on every client record and in Today's detail pane). Same 37 steps, branches (what you have on the lead, the client's
   response) and objection answers as his guide (agents/gs/gs_data.json). The client's name, DOB, email, city and state come from
   the record and the caller's own name is used. What the client says can be noted step by step and saved to the record; outcomes
   log through the CRM (call event, next task, stage, Log policy, Schedule). A Social Security number, bank details and income are
   never typed into the portal. Progress stays in this browser tab (sessionStorage), like the original. */
const GS_D=__GS_DATA__;
const GS_N=GS_D.items.length,GS_SRC=GS_D.src;
const GS_BR=['Army','Navy','Air Force','Marine Corps','Coast Guard','Space Force','Guard / Reserve'];
const GS_OPT=['Maxout','Full Coverage','Partial Coverage'];
const GS_CAP={
 'Ask about military service':[['branch','chips','Branch',GS_BR]],
 'Confirm city and state':[['city','text','City (if different)'],['state','text','State (if different)']],
 'Build rapport':[['hob','text','What they enjoy']],
 'Confirm who needs coverage':[['who','chips','Coverage for',['Just them','Them and spouse']]],
 'Find the reason for the inquiry':[['goal','chips','Goal',['Final expenses','Money for family','Both']]],
 'Discuss final expenses':[['fx','chips','Plans',['Burial','Cremation','Not sure']],['arr','chips','Arrangements',['Made','None yet']],['set','chips','Money set aside',['Yes','No']]],
 'Review existing coverage':[['cov','multi','Current coverage',['None','Private','Employer','VA']]],
 'Follow up on health answers':[['hn','area','When diagnosed, treatment, current medications']],
 'Discuss needs and budget':[['house','chips','Home',['Own','Rent','Other']],['bud','num','Comfortable monthly payment ($)']],
 'Present the Maxout option':[['mx_b','num','Benefit ($)'],['mx_m','num','Monthly ($)']],
 'Present the Full Coverage option':[['fu_b','num','Benefit ($)'],['fu_m','num','Monthly ($)']],
 'Present the Partial Coverage option':[['pa_b','num','Benefit ($)'],['pa_m','num','Monthly ($)']],
 'Give your recommendation':[['rec','chips','Recommending',GS_OPT]],
 'Ask for their decision':[['pick','chips','Their choice',GS_OPT.concat(['Adjust amount','Not yet'])]],
 'Confirm beneficiaries':[['bn','text','Primary beneficiary'],['brl','text','Relationship'],['bc','text','Contingent beneficiary']],
 'Review coverage and payment':[['draft','text','Draft date']],
 'Confirm authorization and submit':[['app','act','Log the application']],
 'Arrange follow-up':[['sch','act','Schedule the check-in']]
};
const GS_LOCK={'Social Security verification and objections':'ssn','Banking and payment authorization':'bank'};
var GS={cid:null,dob:false,email:false,resp:'accept',done:[],cur:0,obj:{},cap:{},sv:'',wrap:0,lo:null,q:'',meOpen:0,boot:0};
const GS_KEEP=['cid','dob','email','resp','done','cur','obj','cap','sv','wrap','lo'];
function gsBoot(){if(GS.boot)return;GS.boot=1;try{const j=JSON.parse(sessionStorage.getItem('owq_gs')||'null');if(j&&typeof j==='object')GS_KEEP.forEach(k=>{if(j[k]!==undefined)GS[k]=j[k]})}catch(e){}
 if(!Array.isArray(GS.done))GS.done=[];GS.done=GS.done.filter(i=>Number.isInteger(i)&&i>=0&&i<GS_N);if(!(GS.cur>=0&&GS.cur<=GS_N))GS.cur=0;
 if(['accept','question','decline'].indexOf(GS.resp)<0)GS.resp='accept';if(!GS.obj||typeof GS.obj!=='object')GS.obj={};if(!GS.cap||typeof GS.cap!=='object')GS.cap={};if(GS.cid!=null)GS.cid=+GS.cid}
function gsPersist(){try{const o={};GS_KEEP.forEach(k=>o[k]=GS[k]);sessionStorage.setItem('owq_gs',JSON.stringify(o))}catch(e){}}
function gsC(){try{return GS.cid!=null&&typeof crmGet==='function'?crmGet(GS.cid)||null:null}catch(e){return null}}
function gsAg(){return typeof WHO==='undefined'||!WHO?'':WHO==='Agency Owner'?'Cole Leckey':WHO}
/* the caller's phone and NPN for "Provide your contact information", kept on this device per person */
function gsMeAll(){try{const j=JSON.parse(localStorage.getItem('owq_gs_me')||'{}');return j&&typeof j==='object'?j:{}}catch(e){return{}}}
function gsMe(){const a=gsMeAll()[gsAg()||'-'];return a&&typeof a==='object'?a:{}}
function gsMeSet(k,v){const A=gsMeAll(),n=gsAg()||'-',m=A[n]&&typeof A[n]==='object'?A[n]:{};m[k]=String(v||'').trim().slice(0,40);A[n]=m;try{localStorage.setItem('owq_gs_me',JSON.stringify(A))}catch(e){}}
function gsDob(v){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v||'');if(!m)return v||'';return['January','February','March','April','May','June','July','August','September','October','November','December'][+m[2]-1]+' '+(+m[3])+', '+m[1]}
function gsMoney(n){return'$'+Math.round(+n||0).toLocaleString('en-US')}
function gsVals(){const c=gsC(),me=gsMe(),st=c&&c.state||'';
 return{'CLIENT NAME':c?crmFirst(c.name):'',DOB:c&&c.dob?gsDob(c.dob):'',EMAIL:c&&c.email||'',CITY:c&&c.city||'',STATE:st?(CRM_STN[st]||st):'',PHONE:me.ph||'','VERIFIED NPN':me.npn||'',OPTION:GS.cap.rec||''}}
/* text: blank line = paragraph, ">> " = branch block, **x** = bold, [KEY] = filled from the record or shown as a fill-in chip */
function gsTx(s){const V=gsVals(),ag=gsAg();
 return String(s||'').split(/\n\n/).map(p=>{const br=p.indexOf('>> ')===0;if(br)p=p.slice(3);
  let h=esc(p).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');if(ag&&ag!=='John Montini')h=h.split('John Montini').join(esc(ag));
  h=h.replace(/\[([A-Z][A-Z ]*[A-Z])\]/g,(m,k)=>V[k]?`<b class=gs-v>${esc(V[k])}</b>`:`<span class=gs-ph>${m}</span>`);
  return br?`<div class=gs-br>${h}</div>`:`<p>${h}</p>`}).join('')}
/* the guide's own branching: what to confirm or ask depends on what you have and how the client took the reason for the call */
function gsInit(){const p=GS.resp==='question'?'I hear you, [CLIENT NAME]. I do have':'Awesome, I have';if(GS.dob)return p+' your date of birth as [DOB]. Is that correct?';if(GS.email)return p+' your email as [EMAIL]. Is that correct?';return'Before we get started, what\u2019s your date of birth?'}
function gsRem(){if(GS.dob&&GS.email)return'And I have your email as [EMAIL]. Is that still correct?';if(GS.dob)return'What\u2019s the best email address for you?';if(GS.email)return'What\u2019s your date of birth?';return'And what\u2019s the best email address for you?'}
function gsBody(it){return it[4]==='initial'?gsInit():it[4]==='remaining'?gsRem():it[2]}
function gsObjGroup(it){if(it[4]==='ssn')return'ssn';const t=it[1];
 if(t==='Review existing coverage')return'coverage';if(t==='Introduce the health review'||t==='Complete carrier health questions')return'health';
 if(t==='Discuss needs and budget'||t.indexOf('Present the')===0)return'budget';if(t==='Give your recommendation'||t==='Ask for their decision')return'decision';
 if(t==='Banking and payment authorization')return'banking';if(['Introduce yourself','Confirm the information on your lead','Explain your role'].indexOf(t)>=0)return'opening';return null}
function gsObjs(it){const g=gsObjGroup(it),I=GS_D.items,TE=GS_D.thinkEarly,TL=GS_D.thinkLate;let L=g?GS_D.objections[g].filter(e=>e[0]!=='think'):[];
 const i=I.indexOf(it),q=I.findIndex(x=>x[1]==='Present the Maxout option'),ap=I.findIndex(x=>x[1]==='Complete the application');
 if(g!=='ssn'&&g!=='banking'){if(i<q)L=L.concat([TE]);else if(i<ap)L=L.concat([[TE[0],TE[1]+' \u2014 before application',TE[2],TE[3]],[TL[0],TL[1]+' \u2014 after quotes / application',TL[2],TL[3]]]);else L=L.concat([TL])}
 return L}
function gsHk(q){return'h_'+String(q).toLowerCase().replace(/[^a-z]+/g,'')}
function gsCapsFor(it){const c=gsC(),f=(k,n,m)=>[k,k==='dob'?'date':'text',c&&c[k]?'Correct '+m+' (only if different)':n];
 if(it[4]==='initial')return[GS.dob?f('dob','Date of birth','DOB'):GS.email?f('email','Email','email'):f('dob','Date of birth','DOB')];
 if(it[4]==='remaining')return[GS.dob&&GS.email?f('email','Email','email'):GS.dob?f('email','Email','email'):GS.email?f('dob','Date of birth','DOB'):f('email','Email','email')];
 if(it[0]==='health'&&it[1].indexOf('Ask about ')===0)return[[gsHk(it[2]),'chips',it[2].replace(/\?$/,''),['No','Yes']]];
 return GS_CAP[it[1]]||[]}
/* ---------- state changes ---------- */
function gsAuto(){const c=gsC();GS.dob=!!(c&&c.dob);GS.email=!!(c&&c.email)}
function gsReset(){Object.assign(GS,{cid:null,dob:false,email:false,resp:'accept',done:[],cur:0,obj:{},cap:{},sv:'',wrap:0,lo:null,q:''});gsPersist()}
function gsResetAsk(){ask('Reset progress and lead selections for a new client?',()=>{gsReset();gsPaint();gsTop()})}
function gsDirty(){return GS.done.length>0||Object.keys(GS.cap).some(k=>{const v=GS.cap[k];return Array.isArray(v)?v.length:v!=null&&v!==''})||Object.keys(GS.obj).some(k=>GS.obj[k])}
function gsSig(){return JSON.stringify(GS.cap)+'|'+JSON.stringify(GS.obj)}
function gsSaved(){return!!GS.sv&&GS.sv===gsSig()}
function gsOpen(id){id=+id;gsBoot();const nx=crmGet(id);if(!nx)return;
 const run=()=>{if(GS.cid!==id){if(GS.cid==null&&gsDirty()){GS.cid=id;gsAuto()}else{gsReset();GS.cid=id;gsAuto()}gsPersist()}GS.wrap=0;SUB['Clients']='Call Script';try{CRM.ui.lastCid=typeof cid==='undefined'?null:cid}catch(e){}
  if(typeof tab!=='undefined'&&tab!=='Clients'){openTab('Clients','Call Script');return}go();const m=document.getElementById('main');if(m)m.scrollTop=0};
 const o=gsC();if(o&&GS.cid!==id&&gsDirty()&&!gsSaved())return ask('Start a new call with '+esc(nx.name)+'? What you noted on the call with '+esc(o.name)+' has not been saved.',run);run()}
function gsPick(id){GS.cid=+id;gsAuto();GS.q='';gsPaint()}
function gsTick(i,on){if(on){if(GS.done.indexOf(i)<0)GS.done.push(i);GS.cur=i+1}else GS.done=GS.done.filter(x=>x!==i);gsPaint();if(on)gsTop()}
function gsNext(i){if(GS.done.indexOf(i)<0)GS.done.push(i);GS.cur=i+1;gsPaint();gsTop()}
function gsBack(){GS.cur=Math.max(0,GS.cur-1);GS.wrap=0;gsPaint();gsTop()}
function gsGo(g){GS.cur=GS_D.items.findIndex(it=>it[0]===g);GS.wrap=0;gsPaint();gsTop()}
function gsWrap(on){GS.wrap=on?1:0;gsPaint();gsTop()}
function gsObj(k,on){GS.obj[k]=!!on;gsPaint()}
function gsStop(){GS.resp='decline';gsPaint();gsTop()}
function gsSet(k,x,ty){const p=GS.cap;if(ty==='multi'){let a=Array.isArray(p[k])?p[k].slice():[];if(x==='None')a=a.indexOf('None')>=0?[]:['None'];else{a=a.filter(y=>y!=='None');a=a.indexOf(x)>=0?a.filter(y=>y!==x):a.concat([x])}p[k]=a}else p[k]=p[k]===x?'':x;gsPaint()}
function gsIn(k,v){GS.cap[k]=v;gsPersist()}
/* ---------- view ---------- */
function gsView(){gsBoot();return`<div id=gsv class=gs>${gsInner()}</div>`}
function gsInner(){return gsHero()+`<div class=gs-top>${gsClient()}${gsLead()}</div>`+gsProg()+`<div id=gsw>${gsMain()}</div>`}
function gsPaint(){gsPersist();const v=document.getElementById('gsv');if(v)v.innerHTML=gsInner();else if(typeof go==='function')go()}
function gsTop(){setTimeout(()=>{const w=document.getElementById('gsw');if(!w||!w.getBoundingClientRect)return;const r=w.getBoundingClientRect();if(r.top<60||r.top>innerHeight*.7)w.scrollIntoView({block:'start',behavior:'smooth'})},30)}
function gsHero(){const me=gsMe();
 return`<div class="c gs-hero"><small class=gs-k>John Montini\u2019s script &middot; call workspace</small><h3>Your conversation, one step at a time.</h3><p class=mut>Veteran final expense script guide</p>
<div class=gs-tb><button class="btn o sm" onclick="gsResetAsk()">New client / Reset</button><button class="btn o sm" onclick="gsPrint()">Print / Save as PDF</button><button class="btn o sm" aria-expanded="${GS.meOpen?'true':'false'}" onclick="GS.meOpen=!GS.meOpen;gsPaint()">Your phone &amp; NPN</button><a class="btn o sm" href="${esc(GS_SRC)}" target=_blank rel=noopener>John\u2019s original &#8599;</a></div>
${GS.meOpen?`<div class=gs-me><label>Your phone<input value="${esc(me.ph||'')}" inputmode=tel autocomplete=off placeholder="Read out when you give your contact info" oninput="gsMeSet('ph',this.value)"></label><label>Your NPN<input value="${esc(me.npn||'')}" inputmode=numeric autocomplete=off placeholder="National Producer Number" oninput="gsMeSet('npn',this.value)"></label><small class=mut>Saved on this device only.</small></div>`:''}</div>`}
function gsClient(){const c=gsC();
 if(!c)return`<div class="c gs-cl"><h4>Who are you calling?</h4><input id=gsq class=gs-q autocomplete=off placeholder="Find a client: name, phone or email" value="${esc(GS.q||'')}" oninput="GS.q=this.value;gsPickPaint()" aria-label="Find a client"><div id=gspr>${gsPickList()}</div><small class=mut>Or practice without one. Pick a client any time to save the call to their record.</small></div>`;
 const win=crmWindow(c),age=crmAgeOf(c);
 return`<div class="c gs-cl gs-on">${c.dnc?'<div class=gs-dnc>Do not contact &middot; don\u2019t call this person</div>':''}<div class=gs-ch>${crmAv(c,46)}<div class=gs-cw><b class=gs-cn>${esc(c.name)}</b><small>${[age?age+' years':'',c.city||'',c.state?(CRM_STN[c.state]||c.state):'',c.phone||''].filter(Boolean).map(esc).join(' &middot; ')}</small>
<div class=crm-chips>${crmStPill(c.stage)}${win.known?`<span class="crm-why ${win.ok?'crm-ok':'crm-bad'}">${win.ok?'OK to call':'Outside calling hours'} &middot; ${win.label}</span>`:''}${(c.tags||[]).indexOf('Veteran')>=0?'<span class=crm-why>Veteran</span>':''}</div></div></div>
<div class=gs-ca>${crmLink(crmTel(c),'Call','crm-ib call','',`Call ${c.name}`)}<button class=crm-ib onclick="crmOpen(${c.id})">Record</button><button class=crm-ib onclick="GS.cid=null;GS.q='';gsPaint()">Change</button><button class="crm-ib gs-endb" onclick="gsWrap(1)">Log call</button></div></div>`}
function gsPickList(){const q=String(GS.q||'').trim().toLowerCase();let L=[];
 try{if(q){const d=q.replace(/\D/g,'');L=crmVisible().filter(c=>String(c.name||'').toLowerCase().indexOf(q)>=0||String(c.email||'').toLowerCase().indexOf(q)>=0||(d.length>=3&&crmDigits(c.phone).indexOf(d)>=0)).slice(0,6)}else L=crmQueue(crmScope()).map(x=>x.c).slice(0,5)}catch(e){L=[]}
 if(!L.length)return`<p class=mut>${q?'No client matches that.':'Nobody is waiting in Today right now. Search above.'}</p>`;
 return`${q?'':'<small class=gs-k>Up next in Today</small>'}<div class=gs-pl>${L.map(c=>`<button class=gs-pi onclick="gsPick(${c.id})">${crmAv(c,30)}<span><b>${esc(c.name)}</b><small>${esc([crmAgeOf(c)?crmAgeOf(c)+'y':'',c.state||'',c.phone||''].filter(Boolean).join(' \u00b7 '))}</small></span></button>`).join('')}</div>`}
function gsPickPaint(){const e=document.getElementById('gspr');if(e)e.innerHTML=gsPickList()}
function gsLead(){const c=gsC(),ck=(k,lab,v)=>`<label class="gs-ck ${GS[k]?'on':''}"><input type=checkbox ${GS[k]?'checked':''} onchange="GS.${k}=this.checked;gsPaint()">${lab}${v?`<small>${esc(v)}</small>`:''}</label>`;
 const R=[['accept','Accepts the reason'],['question','Doesn\u2019t remember / questions it'],['decline','Declines / asks to stop']];
 return`<div class="c gs-ld"><div><h4>Information on your lead</h4><div class=gs-cks>${ck('dob','I have DOB',c&&c.dob?gsDob(c.dob):'')}${ck('email','I have email',c&&c.email||'')}</div><p class=gs-hint>Choose what you already have. The script adjusts what to confirm and what to ask for.${c?' Checked from the record.':''}</p></div>
<div><h4>Client\u2019s response</h4><div class=gs-cks role=radiogroup aria-label="Client's response">${R.map(r=>`<label class="gs-ck ${GS.resp===r[0]?'on':''} ${r[0]==='decline'?'gs-neg':''}"><input type=radio name=gsresp value=${r[0]} ${GS.resp===r[0]?'checked':''} onchange="GS.resp='${r[0]}';gsPaint()">${r[1]}</label>`).join('')}</div></div></div>`}
function gsProg(){const n=GS.done.length,I=GS_D.items,cg=GS.cur<GS_N&&!GS.wrap&&GS.resp!=='decline'?I[GS.cur][0]:'';
 return`<div class="c gs-pg"><div class=gs-pgh><h4>Call progress</h4><span aria-live=polite>${GS.resp==='decline'?'Call ended':`${n} of ${GS_N} steps completed`}</span></div><div class=gs-bar><i style="width:${Math.round(n/GS_N*100)}%"></i></div>
<div class=gs-gps>${GS_D.groups.map(([id,t],k)=>{const ix=I.map((x,i)=>x[0]===id?i:-1).filter(i=>i>=0),d=ix.filter(i=>GS.done.indexOf(i)>=0).length;return`<button class="gs-gp ${cg===id?'on':''} ${d===ix.length?'done':''}" onclick="gsGo('${id}')"><b>${String(k+1).padStart(2,'0')}</b><span>${esc(t)}</span><em>${d}/${ix.length}</em></button>`}).join('')}</div>
<p class=gs-hint>Progress stays in this tab until you reset. A Social Security number, bank details and income are never typed into the portal.</p></div>`}
function gsMain(){if(GS.resp==='decline')return gsEnd();if(GS.wrap||GS.cur>=GS_N)return gsWrapCard();
 const i=GS.cur,it=GS_D.items[i],g=(GS_D.groups.find(x=>x[0]===it[0])||['',''])[1],last=i===GS_N-1,b=gsBody(it),lk=GS_LOCK[it[1]];
 return`<h4 class=gs-sec>${esc(g)} &middot; Step ${i+1} of ${GS_N}</h4><article class="c gs-card" id=gscard data-step=${i}>
<label class=gs-tt><input type=checkbox ${GS.done.indexOf(i)>=0?'checked':''} onchange="gsTick(${i},this.checked)">${esc(it[1])}</label>
${b?`<div class=gs-say>${gsTx(b)}</div>`:''}${it[3]?`<p class=gs-hint>${esc(it[3])}</p>`:''}
${lk?`<div class=gs-lock><b>Secure step</b>${lk==='ssn'?'Never type a Social Security number into the portal or send it by text or email. It goes only into the carrier\u2019s secure application.':'Never type bank or card details into the portal. Payment goes only through the carrier\u2019s approved process.'}</div>`:''}
${gsCapHtml(it)}${gsObjHtml(it)}
<div class=gs-acts><button class="btn o" onclick="gsBack()" ${i===0?'disabled':''}>Back</button><button class=btn onclick="gsNext(${i})">${last?'Complete call':'Complete &amp; next'}</button></div></article>`}
function gsCapHtml(it){const F=gsCapsFor(it);if(!F.length)return'';const p=GS.cap,c=gsC();
 return`<div class=gs-cap><span class=gs-capl>Note it</span>${F.map(([k,ty,lab,op])=>{const v=p[k];
  if(ty==='chips'||ty==='multi'){const on=x=>ty==='multi'?Array.isArray(v)&&v.indexOf(x)>=0:v===x;return`<div class="gs-f gs-wide"><span>${esc(lab)}</span><div class=gs-chips>${op.map(x=>`<button class="gs-chip ${on(x)?'on':''}" aria-pressed="${on(x)?'true':'false'}" onclick="gsSet('${k}','${esc(x)}','${ty}')">${esc(x)}</button>`).join('')}</div></div>`}
  if(ty==='act')return`<div class="gs-f gs-wide"><button class="btn sm" onclick="gsDo('${k}')" ${c?'':'disabled'}>${esc(lab)}</button>${c?'':'<small class=mut>Pick the client above first.</small>'}</div>`;
  const val=v==null?'':String(v);
  if(ty==='area')return`<label class="gs-f gs-wide"><span>${esc(lab)}</span><textarea rows=2 oninput="gsIn('${k}',this.value)">${esc(val)}</textarea></label>`;
  return`<label class=gs-f><span>${esc(lab)}</span><input ${ty==='num'?'type=number min=0 step=any inputmode=decimal':ty==='date'?'type=date':'type=text autocomplete=off'} value="${esc(val)}" oninput="gsIn('${k}',this.value)"></label>`}).join('')}</div>`}
function gsObjHtml(it){const L=gsObjs(it);if(!L.length)return'';
 return`<section class=gs-obj aria-label="Client objections"><h4>If an objection comes up</h4><p class=gs-hint>Check what the client says to reveal a response. Continue when you\u2019re ready.</p>${L.map(([k,t,r,n])=>{const on=!!GS.obj[k];
  return`<div class="gs-ob ${on?'on':''}"><label><input type=checkbox ${on?'checked':''} onchange="gsObj('${k}',this.checked)">${esc(t)}</label>${on?`<div class=gs-obr><span class=gs-tag>Suggested response</span><div class=gs-say>${gsTx(r)}</div>${n?`<p class=gs-hint>${esc(n)}</p>`:''}${k==='stop'?'<button class="btn sm" onclick="gsStop()">End call / honor request</button>':''}</div>`:''}</div>`}).join('')}</section>`}
function gsEnd(){const c=gsC();
 return`<h4 class=gs-sec>Call ended</h4><article class="c gs-card gs-endc"><span class=gs-tag>End the call respectfully</span><h3>Client declined</h3><div class=gs-say>${gsTx('I understand, [CLIENT NAME]. Thank you for your time.')}</div><p class=gs-hint>Honor any request not to be contacted through your normal do-not-call process: Do not contact on their record.</p>
${c?`<div class=gs-outs>${gsOB('dnc','Do not contact','crm-bad')}${gsOB('ni','Not interested','')}${gsOB('cb','Call back later','')}</div>${gsLast()}`:'<p class=mut>Pick the client above to record this on their record.</p>'}
<div class=gs-acts><button class="btn o" onclick="GS.resp='accept';gsPaint()">Back to the script</button><button class="btn o" onclick="gsResetAsk()">New client / Reset</button></div></article>`}
function gsWrapCard(){const c=gsC(),S=gsSum(),all=GS.cur>=GS_N&&!GS.wrap;
 return`<h4 class=gs-sec>${all?'All steps complete':'Wrap up the call'}</h4><article class="c gs-card gs-wrap"><span class=gs-tag>${all?'Call script complete':GS.done.length+' of '+GS_N+' steps completed'}</span><h3>${all?'You\u2019ve worked through the conversation.':'Log this call'}</h3>
<div class=gs-sum>${S.length?`<dl>${S.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`:'<p class=mut>Nothing noted yet. Use Note it on the steps to keep what the client tells you.</p>'}</div>
${c?`${gsSaved()?`<p class=gs-ok>Saved to ${esc(crmFirst(c.name))}\u2019s record.</p>`:''}${gsLast()}<div class=gs-outs>${gsOB('app','Application submitted','crm-hi')}${gsOB('appt','Appointment set','crm-ok')}${gsOB('int','Interested, follow up','')}${gsOB('cb','Call back','')}${gsOB('ni','Not interested','')}${gsOB('dnc','Do not contact','crm-bad')}</div>
<div class=gs-acts><button class="btn o" onclick="gsDo('save')">Save notes only</button>`:'<p class=mut>Pick the client above to save this call to their record.</p><div class=gs-acts>'}
<button class="btn o" onclick="${all?'GS.cur=GS_N-1;GS.wrap=0;gsPaint();gsTop()':'gsWrap(0)'}">${all?'Back to last step':'Back to the script'}</button><button class="btn o" onclick="gsResetAsk()">New client / Reset</button></div></article>`}
function gsOB(o,l,cls){return`<button class="crm-ob-b ${cls}" onclick="gsDo('${o}')">${l}</button>`}
function gsLast(){const L=GS.lo;if(!L||!L.o)return'';const nm={app:'Application submitted',appt:'Appointment set',int:'Interested',cb:'Call back',ni:'Not interested',dnc:'Do not contact',save:'Notes saved'}[L.o]||L.o;
 return`<p class=gs-ok>Logged: ${esc(nm)} at ${esc(new Date(L.at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}))}.</p>`}
/* ---------- what the client said ---------- */
function gsHealth(){const p=GS.cap,yes=[],no=[];GS_D.items.forEach(it=>{if(it[0]!=='health'||it[1].indexOf('Ask about ')!==0)return;const v=p[gsHk(it[2])],n=it[2].replace(/\?$/,'');if(v==='Yes')yes.push(n);else if(v==='No')no.push(n.toLowerCase())});
 const a=[];if(yes.length)a.push('Yes: '+yes.join(', '));if(no.length)a.push('no '+no.join(', '));if(p.hn&&String(p.hn).trim())a.push(String(p.hn).trim());return a.join('; ')}
function gsObjRaised(){const all={};Object.keys(GS_D.objections).forEach(g=>GS_D.objections[g].forEach(e=>{all[e[0]]=e[1]}));all.thinkEarly=all.thinkLate='Needs to think about it';const seen={};
 return Object.keys(GS.obj).filter(k=>GS.obj[k]&&all[k]).map(k=>all[k]).filter(t=>seen[t]?0:(seen[t]=1))}
function gsPickOpt(){const p=GS.cap,k={'Maxout':'mx','Full Coverage':'fu','Partial Coverage':'pa'}[p.pick];return k?{b:+p[k+'_b']||0,m:+p[k+'_m']||0}:null}
function gsSum(){const p=GS.cap,L=[],add=(k,v)=>{if(v!=null&&String(v).trim())L.push([k,String(v).trim()])},opt=(n,b,m)=>{const B=+p[b]||0,M=+p[m]||0;if(B||M)L.push([n,(B?gsMoney(B)+' benefit':'')+(B&&M?' at ':'')+(M?gsMoney(M)+'/mo':'')])};
 if(p.dob)add('Date of birth',gsDob(p.dob));add('Email',p.email);if(p.city||p.state)add('Lives in',[p.city,p.state].filter(x=>x&&String(x).trim()).join(', '));
 add('Served in',p.branch);add('Enjoys',p.hob);add('Coverage for',p.who);add('Goal',p.goal);
 const fx=[p.fx,p.arr?'arrangements '+String(p.arr).toLowerCase():'',p.set?(p.set==='Yes'?'money set aside':'nothing set aside'):''].filter(Boolean);if(fx.length)add('Final expenses',fx.join(', '));
 if(Array.isArray(p.cov)&&p.cov.length)add('Current coverage',p.cov.join(', '));add('Health',gsHealth());add('Home',p.house);if(+p.bud)add('Comfortable payment',gsMoney(p.bud)+'/mo');
 opt('Maxout','mx_b','mx_m');opt('Full Coverage','fu_b','fu_m');opt('Partial Coverage','pa_b','pa_m');add('Recommended',p.rec);add('Their choice',p.pick);
 if(p.bn&&String(p.bn).trim())add('Beneficiary',String(p.bn).trim()+(p.brl&&String(p.brl).trim()?' ('+String(p.brl).trim()+')':''));add('Contingent',p.bc);add('Draft date',p.draft);
 const ob=gsObjRaised();if(ob.length)add('Objections',ob.join(', '));return L}
function gsSumText(){const S=gsSum();return'Call script ('+GS.done.length+'/'+GS_N+' steps)'+(S.length?': '+S.map(([k,v])=>k+': '+v).join('; '):'')}
function gsDay(){return new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})}
/* the record gets what was noted: corrected DOB, email, city and state, goal, home, budget, health, beneficiary, the chosen premium
   (expected annual premium), Final Expense as the product when none is set, and the Veteran / Spouse tags */
function gsWrite(c){const id=c.id,p=GS.cap,info=c.info||{},f=(k,v)=>{if(v==null||v==='')return;const cur=k.indexOf('.')>0?info[k.split('.')[1]]:c[k];if(String(cur==null?'':cur)!==String(v))crmField(id,k,v)};
 if(/^\d{4}-\d{2}-\d{2}$/.test(p.dob||''))f('dob',p.dob);if(p.email&&/@/.test(p.email))f('email',String(p.email).trim());
 if(p.city&&String(p.city).trim())f('city',String(p.city).trim());if(p.state&&String(p.state).trim())f('state',String(p.state).trim());
 if(p.goal)f('info.goal',{'Final expenses':'Final expenses','Money for family':'Leave money for family','Both':'Final expenses and money for family'}[p.goal]||p.goal);
 if(p.house)f('info.house',p.house);if(+p.bud)f('info.budget',gsMoney(p.bud)+'/mo');
 const hs=gsHealth();if(hs){const old=String(info.health||'');if(old.indexOf(hs)<0)f('info.health',((old?old+' | ':'')+gsDay()+': '+hs).slice(-900))}
 if(p.bn&&String(p.bn).trim())f('info.bname',String(p.bn).trim());if(p.brl&&String(p.brl).trim())f('info.brel',String(p.brl).trim());
 const pk=gsPickOpt();if(pk&&pk.m)f('ap',Math.round(pk.m*12));if(!c.prod)f('prod','Final Expense');
 const tg=(c.tags||[]).slice();if(p.branch&&tg.indexOf('Veteran')<0)tg.push('Veteran');if(p.who==='Them and spouse'&&tg.indexOf('Spouse')<0)tg.push('Spouse');if(tg.length!==(c.tags||[]).length)crmPut(id,{tags:tg})}
function gsDo(o){const c=gsC();if(!c)return toast('Pick the client first.');const id=c.id;
 if(o==='sch')return crmSchedule(id);
 if(o==='dnc')return ask('Mark '+esc(c.name)+' as Do Not Contact? Every open follow-up is cancelled.',()=>gsLog('dnc'));
 gsLog(o)}
function gsLog(o){const c=gsC();if(!c)return;const id=c.id,txt=gsSumText(),undo=t=>()=>{t.undo();GS.sv='';GS.lo=null;gsPersist();if(document.getElementById('gsv'))gsPaint()};
 const mark=()=>{GS.sv=gsSig();GS.lo={o,at:Date.now()};gsPersist()};
 if(o==='appt'||o==='cb'){crmTx(()=>{gsWrite(c);crmEv(id,'note',{t:txt})});mark();gsPaint();return crmSchedule(id,o)}
 const tx=crmTx(()=>{gsWrite(c);if(o==='save')crmEv(id,'note',{t:txt});else if(o==='app')crmOutcome(id,'int',{t:'Application started. '+txt,noNext:1});else if(o==='dnc')crmOutcome(id,'dnc',{t:'Asked not to be contacted. '+txt});else crmOutcome(id,o,{t:txt})});
 mark();gsPaint();
 if(o==='app'){crmToast('Call logged. Finish the policy to move '+crmFirst(c.name)+' to Applied.',undo(tx));return crmLogPolicy(id)}
 const n=o==='save'?null:crmNext(id);crmToast(o==='save'?'Notes saved to '+crmFirst(c.name)+'\u2019s record.':'Logged: '+(CRM_OUT[o]||o)+(n?'. Next: '+(CRM_TY[n.ty]||'Task')+' '+crmWhen(n.due,n.ad):'')+'.',undo(tx))}
/* ---------- print: the whole script for this client, with the objection answers used and the call notes ---------- */
function gsPrint(){let el=document.getElementById('gsprint');if(!el){el=document.createElement('div');el.id='gsprint';document.body.appendChild(el)}
 const c=gsC(),S=gsSum(),ag=gsAg();
 el.innerHTML=`<h1>${c?esc(c.name)+' &middot; ':''}Veteran final expense call script</h1><p class=gs-pm>John Montini\u2019s script${ag?' &middot; '+esc(ag):''} &middot; ${esc(new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}))}</p>`+
  (GS.resp==='decline'?`<article><h2>Client declined</h2>${gsTx('I understand, [CLIENT NAME]. Thank you for your time.')}</article>`:GS_D.items.map((it,i)=>{const b=gsBody(it),O=gsObjs(it).filter(e=>GS.obj[e[0]]);
   return`<article><h2>${String(i+1).padStart(2,'0')}. ${esc(it[1])}</h2>${b?gsTx(b):''}${it[3]?`<p class=gs-ph2>${esc(it[3])}</p>`:''}${O.map(e=>`<div class=gs-pob><b>${esc(e[1])}</b>${gsTx(e[2])}</div>`).join('')}</article>`}).join(''))+
  (S.length?`<article><h2>Call notes</h2><dl>${S.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></article>`:'');
 document.body.classList.add('gs-print');const done=()=>{document.body.classList.remove('gs-print');removeEventListener('afterprint',done)};addEventListener('afterprint',done);
 setTimeout(()=>{try{print()}catch(e){done()}},60)}
/* ---------- the way in from a client: the record and Today's detail pane ---------- */
function gsStrip(c){return`<div class=gs-strip><div><b>Call script</b><small>John Montini\u2019s veteran final expense script, filled in for ${esc(crmFirst(c.name)||'this client')}.</small></div><button class="btn sm" onclick="gsOpen(${c.id})">Open call script</button></div>`}
const GS_CSS=`
.gs{display:flex;flex-direction:column;gap:14px;min-width:0}.gs .c{margin:0}.gs h4{margin:0 0 10px;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:var(--red)}
.gs-hero{padding:18px 20px;background:linear-gradient(135deg,#ff1f4f22,transparent 55%),var(--card)}
.gs-k{display:block;font:700 10px Verdana,"DejaVu Sans",sans-serif;letter-spacing:2px;text-transform:uppercase;color:var(--red)}
.gs-hero h3{margin:6px 0 4px;font-size:21px;letter-spacing:.4px}.gs-hero p{margin:0}
.gs-tb{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.gs-tb a.btn{text-decoration:none;display:inline-flex;align-items:center}
.gs-me{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-top:12px}.gs-me label{margin:0;display:flex;flex-direction:column;gap:4px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mut);flex:1;min-width:180px}.gs-me input{width:100%}
.gs-top{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:14px}
.gs-q{width:100%;box-sizing:border-box}.gs-pl{display:flex;flex-direction:column;gap:6px;margin:8px 0}
#gspr>.gs-k{margin:12px 0 2px}
.gs-pi{display:flex;align-items:center;gap:10px;background:#0f0f15;border:1px solid var(--ln);color:var(--tx);padding:8px 10px;cursor:pointer;text-align:left;font:inherit;min-width:0}
.gs-pi:hover{border-color:var(--red)}.gs-pi span{display:flex;flex-direction:column;min-width:0}.gs-pi b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gs-pi small{color:var(--mut);font-size:11px}
.gs-ch{display:flex;gap:12px;align-items:flex-start}.gs-cw{min-width:0}.gs-cn{font-size:17px;overflow-wrap:anywhere}.gs-ch small{display:block;color:var(--mut);font-size:12px;margin-top:2px}
.gs-ca{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:12px}.gs-ca .crm-ib{min-width:0;padding:0 6px}
.gs-endb{border-color:#ffcf4070!important;color:#ffcf40!important}
.gs-dnc{background:#ff1f4f22;border:1px solid var(--red);color:#ff6b8a;font:700 10px Verdana,"DejaVu Sans",sans-serif;letter-spacing:1.2px;padding:8px 10px;margin-bottom:10px;text-transform:uppercase}
.gs-ld{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px}
.gs-cks{display:flex;flex-direction:column;gap:6px}
.gs-ck{display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#0f0f15;border:1px solid var(--ln);padding:9px 11px;cursor:pointer;font-size:13px;line-height:1.3;transition:.15s;color:var(--tx);margin:0}
.gs-ck input{accent-color:var(--red);width:16px;height:16px;margin:0;flex:none}.gs-ck small{flex-basis:100%;padding-left:24px;color:var(--mut);font-size:11px;overflow-wrap:anywhere}
.gs-ck:hover{border-color:#ff1f4f80}.gs-ck.on{border-color:var(--red);background:#ff1f4f14}.gs-ck.gs-neg.on{border-color:#ff6b8a;color:#ff6b8a}
.gs-hint{font-size:12px;color:var(--mut);line-height:1.5;margin:10px 0 0}
.gs-pgh{display:flex;justify-content:space-between;align-items:baseline;gap:10px}.gs-pgh span{font-size:12px;color:var(--mut)}
.gs-bar{height:6px;background:#0f0f15;border:1px solid var(--ln);margin:0 0 12px}.gs-bar i{display:block;height:100%;background:linear-gradient(90deg,#b0102f,var(--red));box-shadow:0 0 10px #ff1f4f80;transition:width .3s}
.gs-gps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.gs-gp{display:flex;flex-direction:column;align-items:flex-start;gap:3px;background:#0f0f15;border:1px solid var(--ln);color:var(--tx);padding:8px 9px;cursor:pointer;text-align:left;font:inherit;min-width:0}
.gs-gp b{font:700 10px Verdana,"DejaVu Sans",sans-serif;letter-spacing:1px;color:var(--red)}.gs-gp span{font-size:11.5px;line-height:1.25}.gs-gp em{font-style:normal;font-size:10px;color:var(--mut)}
.gs-gp:hover{border-color:#ff1f4f80}.gs-gp.on{border-color:var(--red);background:#ff1f4f1a;box-shadow:inset 0 -2px 0 var(--red)}.gs-gp.done b,.gs-gp.done em{color:var(--ok)}
.gs-sec{margin:2px 0 -4px!important;color:var(--mut)!important}
#gsw{scroll-margin-top:80px;display:flex;flex-direction:column;gap:12px}
.gs-card{padding:20px 22px;border-left:3px solid var(--red)}
.gs-tt{display:flex;align-items:center;gap:10px;font-size:18px;font-weight:700;cursor:pointer;color:var(--tx);margin:0}.gs-tt input{accent-color:var(--red);width:20px;height:20px;margin:0;flex:none}
.gs-say{font-size:18px;line-height:1.65;margin:12px 0 0;overflow-wrap:anywhere}.gs-say p{margin:0 0 12px}.gs-say p:last-child{margin-bottom:0}
.gs-br{border-left:3px solid var(--red);padding:2px 0 2px 14px;margin:12px 0;font-size:16px}
.gs-v{color:#fff;background:#ff1f4f24;padding:0 4px}
.gs-ph{display:inline-block;border:1px dashed #ffcf4090;color:#ffcf40;padding:0 5px;font-size:.8em;letter-spacing:.5px;line-height:1.55}
.gs-lock{margin-top:14px;border:1px solid #5ac8ff60;background:#5ac8ff10;padding:10px 12px;font-size:13px;line-height:1.5}.gs-lock b{display:block;font:700 10px Verdana,"DejaVu Sans",sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#5ac8ff;margin-bottom:3px}
.gs-cap{margin-top:16px;border:1px dashed var(--ln);padding:12px;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:flex-start}
.gs-capl{flex-basis:100%;font:700 10px Verdana,"DejaVu Sans",sans-serif;letter-spacing:1.6px;text-transform:uppercase;color:#ffcf40}
.gs-f{display:flex;flex-direction:column;gap:5px;min-width:150px;flex:1;margin:0}.gs-f>span{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mut)}.gs-f input,.gs-f textarea{width:100%;box-sizing:border-box}.gs-wide{flex-basis:100%}
.gs-chips{display:flex;flex-wrap:wrap;gap:6px}
.gs-chip{background:#0f0f15;border:1px solid var(--ln);color:var(--tx);font:700 10px Verdana,"DejaVu Sans",sans-serif;letter-spacing:.8px;text-transform:uppercase;padding:8px 11px;min-height:38px;cursor:pointer;transition:.15s}
.gs-chip:hover{border-color:var(--red)}.gs-chip.on{background:var(--red);border-color:var(--red);color:#fff}
.gs-obj{margin-top:18px;border-top:1px solid var(--ln);padding-top:14px}.gs-obj h4{margin:0}
.gs-ob{border:1px solid var(--ln);margin-top:8px;background:#0f0f15}.gs-ob.on{border-color:#ff1f4f80}
.gs-ob>label{display:flex;align-items:center;gap:10px;padding:11px 12px;cursor:pointer;font-size:14px;color:var(--tx);margin:0}.gs-ob input{accent-color:var(--red);width:17px;height:17px;margin:0;flex:none}
.gs-obr{margin:0 12px 12px;border-left:3px solid var(--red);padding:2px 0 2px 14px}.gs-obr .gs-say{font-size:16px;margin-top:6px}.gs-obr .btn{margin-top:10px}
.gs-tag{font:700 9.5px Verdana,"DejaVu Sans",sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#ffcf40}
.gs-acts{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:20px}.gs-acts .btn[disabled],.gs-cap .btn[disabled]{opacity:.35;pointer-events:none}
.gs-outs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:14px}
.gs-sum dl{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:6px 14px;margin:12px 0 0;font-size:13px}.gs-sum dt{color:var(--mut);text-transform:uppercase;font-size:10px;letter-spacing:1px;padding-top:2px}.gs-sum dd{margin:0;overflow-wrap:anywhere}
.gs-ok{color:var(--ok);font-size:12px;margin:12px 0 0}.gs-wrap h3,.gs-endc h3{margin:6px 0 0}
.crm-pa .gs-pb{grid-column:1/-1;border-color:#ff1f4f80}
.gs-strip{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:-4px 0 14px;padding:10px 12px;border:1px solid #ff1f4f60;background:linear-gradient(90deg,#ff1f4f1a,transparent)}
.gs-strip b{font:700 11px Verdana,"DejaVu Sans",sans-serif;letter-spacing:1.4px;text-transform:uppercase}.gs-strip small{display:block;color:var(--mut);font-size:11px;margin-top:2px}
@container crm (max-width:720px){.gs-top,.gs-ld{grid-template-columns:minmax(0,1fr)}.gs-gps{grid-template-columns:repeat(auto-fit,minmax(118px,1fr))}.gs-say{font-size:17px}.gs-outs{grid-template-columns:repeat(2,minmax(0,1fr))}.gs-card{padding:16px}}
@container crm (max-width:420px){.gs-ca{grid-template-columns:repeat(2,minmax(0,1fr))}}
#gsprint{display:none}
@media print{body.gs-print{background:#fff!important}body.gs-print>*:not(#gsprint){display:none!important}
 body.gs-print #gsprint{display:block!important;color:#000;background:#fff;font:12px/1.5 Verdana,"DejaVu Sans",sans-serif}
 #gsprint h1{font-size:18px;margin:0 0 4px}#gsprint .gs-pm{color:#444;margin:0 0 12px}#gsprint article{break-inside:avoid;border-bottom:1px solid #ccc;padding:8px 0}#gsprint h2{font-size:13px;margin:0 0 4px}#gsprint p{margin:0 0 6px}
 #gsprint .gs-br{border-left:2px solid #999;padding-left:8px}#gsprint .gs-v{color:#000;background:none;font-weight:700;padding:0}#gsprint .gs-ph{border:0;color:#000;padding:0;font-size:1em}
 #gsprint .gs-ph2{color:#555;font-size:10px}#gsprint .gs-pob{margin:6px 0 0 10px;border-left:2px solid #999;padding-left:8px}#gsprint dl{display:grid;grid-template-columns:max-content 1fr;gap:3px 12px}#gsprint dd{margin:0}}
`;
(function(){try{const s=document.createElement('style');s.id='gscss';s.textContent=GS_CSS;(document.body||document.head).appendChild(s)}catch(e){}})();
/*GSend*/
