/*CRMstart*/
/* ===== CRM data layer (crm builder). See agents/crm/ARCH.md. ASCII only. ===== */
var CRM={on:0,boot:0,live:0,ro:0,why:'',db:null,ready:0,first:{crmc:0,crmt:0,crme:0},
 c:new Map(),t:new Map(),e:new Map(),cfg:{},sv:{},docs:{},dk:{},q:[],fl:{},rc:[],pump:0,err:'',vc:0,vt:0,ve:0,ver:0,
 subs:[],em:'',ue:null,cache:{},hist:{},mig:0,ui:{sub:'',lastCid:null,tsel:null,q:'',view:'all',sort:'next',ag:'',sel:{},more:{},col:{},pf:{},tf:'all',scroll:0},nid:0};
const CRM_NB=64,CRM_EB=16,CRM_OWN=['Agency Owner','Cole Leckey'];
const CRM_ST=['new','contacted','appt','quoted','applied','issued','client','dead'];
const CRM_SN={new:'New',contacted:'Contacted',appt:'Appointment',quoted:'Presented / Quoted',applied:'Applied (UW)',issued:'Issued / Delivery',client:'Client (in force)',dead:'Dead'};
const CRM_SP={new:.05,contacted:.1,appt:.25,quoted:.4,applied:.7,issued:.9,client:1,dead:0};
const CRM_STUCK={new:1,contacted:7,appt:3,quoted:10,applied:30,issued:14};
const CRM_L2N={Lead:'new',Quoted:'quoted',Applied:'applied',Client:'client',Lost:'dead'};
const CRM_N2L={new:'Lead',contacted:'Lead',appt:'Lead',quoted:'Quoted',applied:'Applied',issued:'Client',client:'Client',dead:'Lost'};
const CRM_PROD=['Final Expense','Mortgage Protection','Term','Whole Life','IUL','Annuity'];
const CRM_PAP={'Final Expense':900,'Mortgage Protection':1200,'Term':650,'Whole Life':1500,'IUL':3000,'Annuity':0};
const CRM_SRC=['Facebook Leads','Live Transfers','Direct Mail','Aged Leads','Referral'];
const CRM_SQ={'Live Transfers':10,'Referral':8,'Direct Mail':5,'Facebook Leads':4,'Aged Leads':0};
const CRM_OUT={na:'No answer',vm:'Left voicemail',int:'Spoke - interested',appt:'Appointment set',ni:'Not interested',bad:'Wrong / bad number',cb:'Call back later',dnc:'Do not contact'};
const CRM_TY={call:'Call',text:'Text',email:'Email',appt:'Appointment',fu:'Follow-up',deliv:'Policy delivery',review:'Review',other:'Task'};
const CRM_EVL={call:'Call',text:'Text',email:'Email',meet:'Meeting',note:'Note'};
function crmOffFlag(){try{return localStorage.getItem('owq_crm_off')==='1'}catch(e){return false}}
function crmOn(){return !!(CRM&&CRM.on)}
function crmOwnerView(w){w=w===undefined?(typeof WHO!=='undefined'?WHO:''):w;return CRM_OWN.indexOf(w)>=0}
function crmHash(s){s=String(s);let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h>>>0}
const crmP2=n=>(n<10?'0':'')+n;
function crmCB(id){return 'b'+crmP2(crmHash(String(id))%CRM_NB)}
function crmEBk(id){return crmHash(String(id))%CRM_EB}
function crmMon(ts){return new Date(ts).toISOString().slice(0,7)}
function crmEB(id,ts){return crmMon(ts).replace('-','')+'_'+crmP2(crmEBk(id))}
function crmDay(ts){const d=new Date(ts);return d.getFullYear()+'-'+crmP2(d.getMonth()+1)+'-'+crmP2(d.getDate())}
function crmToday(){return crmDay(Date.now())}
function crmSOD(ts){const d=new Date(ts===undefined?Date.now():ts);d.setHours(0,0,0,0);return d.getTime()}
function crmAt(dayKey,h,m){const p=String(dayKey).split('-');return new Date(+p[0],+p[1]-1,+p[2],h||0,m||0,0,0).getTime()}
function crmClone(o){return o==null?o:JSON.parse(JSON.stringify(o))}
function crmIsObj(v){return v!==null&&typeof v==='object'&&!Array.isArray(v)}
/* server semantics: nested objects merge recursively, everything else (arrays, null) replaces */
function crmMerge(dst,src){if(!crmIsObj(dst))dst={};for(const k in src){const v=src[k];if(crmIsObj(v)&&crmIsObj(dst[k]))crmMerge(dst[k],v);else dst[k]=crmIsObj(v)?crmMerge({},v):(Array.isArray(v)?crmClone(v):v)}return dst}
function crmNewId(){let id=Date.now()*1000+Math.floor(Math.random()*1000);while(CRM.c.has(id)||id<=CRM.nid)id++;CRM.nid=id;return id}
function crmEid(at){return (at||Date.now()).toString(36)+Math.random().toString(36).slice(2,7)}
function crmMeta(p){const m=/^crme\/(\d{4})(\d{2})_(\d+)$/.exec(p);if(m)return{m:m[1]+'-'+m[2],b:+m[3]};const k=p.split('/')[1];return{_k:k}}
/* ---------- local adapter: the same surface as the db capability, persisted per document ---------- */
function crmLocalDb(store){
 const S={docs:{},ver:{},n:0,subs:new Set(),st:store===undefined?(()=>{try{return localStorage}catch(e){return null}})():store,pt:{},warned:0};
 let IX=[];try{if(S.st){IX=JSON.parse(S.st.getItem('owq_crm_ix')||'[]');if(!Array.isArray(IX))IX=[];IX.forEach(p=>{try{const v=S.st.getItem('owq_crm:'+p);if(v!=null){S.docs[p]=JSON.parse(v);S.ver[p]=++S.n}}catch(e){}})}}catch(e){IX=[]}
 const ixSave=()=>{try{const L=Object.keys(S.docs).sort();if(L.join('|')!==IX.join('|')){IX=L;S.st.setItem('owq_crm_ix',JSON.stringify(L))}}catch(e){}};
 const persist=p=>{if(!S.st)return;clearTimeout(S.pt[p]);S.pt[p]=setTimeout(()=>{try{ixSave();if(S.docs[p]===undefined)S.st.removeItem('owq_crm:'+p);else S.st.setItem('owq_crm:'+p,JSON.stringify(S.docs[p]))}catch(e){if(!S.warned){S.warned=1;try{toast('This device is out of local storage. Connect the shared database or export a backup.')}catch(x){}}}},250)};
 const fire=()=>{S.subs.forEach(f=>{try{f()}catch(e){}})};
 const mkDoc=(id,d)=>({id,exists:d!==undefined,data:()=>d,metadata:{fromCache:false,hasPendingWrites:false}});
 const touch=p=>{S.ver[p]=++S.n;persist(p);setTimeout(fire,0)};
 const err=m=>{const e=new Error(m);e.code='invalid_argument';return e};
 const doc=p=>({id:p.split('/').pop(),path:p,
  get:async()=>mkDoc(p.split('/').pop(),S.docs[p]===undefined?undefined:crmClone(S.docs[p])),
  set:async d=>{if(!crmIsObj(d))throw err('bad body');S.docs[p]=crmClone(d);touch(p)},
  update:async d=>{if(S.docs[p]===undefined)throw err('missing doc');crmMerge(S.docs[p],crmClone(d));touch(p)},
  delete:async()=>{delete S.docs[p];touch(p)},
  acquire:async()=>({acquired:true})});
 const coll=(c,w)=>{w=w||[];const match=(p,d)=>{if(p.indexOf(c+'/')!==0||p.slice(c.length+1).indexOf('/')>=0)return false;return w.every(([f,op,v])=>{const x=d[f];return op==='=='?x===v:op==='>='?x>=v:op==='<='?x<=v:op==='>'?x>v:op==='<'?x<v:op==='!='?x!==v:false})};
  const list=()=>Object.keys(S.docs).filter(p=>match(p,S.docs[p])).sort();
  return{path:c,where:(f,op,v)=>coll(c,w.concat([[f,op,v]])),orderBy:()=>coll(c,w),limit:()=>coll(c,w),doc:id=>doc(c+'/'+id),
   get:async()=>{const ds=list().map(p=>mkDoc(p.split('/').pop(),crmClone(S.docs[p])));return{docs:ds,size:ds.length,empty:!ds.length,docChanges:()=>[],metadata:{fromCache:false}}},
   onSnapshot(next){let seen={},first=true;const run=()=>{const ps=list(),ch=[],now={};ps.forEach(p=>{now[p]=S.ver[p];if(seen[p]!==S.ver[p])ch.push({type:seen[p]?'modified':'added',doc:mkDoc(p.split('/').pop(),S.docs[p])})});Object.keys(seen).forEach(p=>{if(!(p in now))ch.push({type:'removed',doc:mkDoc(p.split('/').pop(),undefined)})});
     const f0=first;first=false;seen=now;if(!ch.length&&!f0)return;const ds=ps.map(p=>mkDoc(p.split('/').pop(),S.docs[p]));next({docs:ds,size:ds.length,empty:!ds.length,docChanges:()=>ch,metadata:{fromCache:false,hasPendingWrites:false}})};
    S.subs.add(run);setTimeout(run,0);return()=>S.subs.delete(run)}}};
 return{doc,collection:c=>coll(c),_S:S,local:1}}
/* ---------- applying documents (server body + every unconfirmed local patch on top) ---------- */
function crmPend(p){const out=[];CRM.rc.forEach(x=>{if(x.p===p)out.push(x.d)});if(CRM.fl[p])out.push(CRM.fl[p]);CRM.q.forEach(x=>{if(x.p===p)out.push(x.d)});return out}
function crmVis(p){let b=crmClone(CRM.sv[p]||null)||{};crmPend(p).forEach(d=>crmMerge(b,crmClone(d)));return b}
function crmExtract(p,b,keys){const coll=p.split('/')[0],old=CRM.dk[p]||{},nk={};let ch=0;
 if(p==='crmc/cfg'){CRM.cfg=b||{};CRM.vc++;return 1}
 const pre=coll==='crmc'?'c':coll==='crmt'?'t':'e',M=coll==='crmc'?CRM.c:coll==='crmt'?CRM.t:CRM.e;
 const ks=keys||Object.keys(b);
 ks.forEach(k=>{if(k[0]!==pre)return;const v=b[k];if(!crmIsObj(v))return;if(coll==='crmc'){if(v.id==null)v.id=+k.slice(1)}else if(v.id==null)v.id=k.slice(1);const id=coll==='crmc'?+k.slice(1):k.slice(1);M.set(id,v);nk[k]=1;ch=1});
 if(!keys){if(coll!=='crme')Object.keys(old).forEach(k=>{if(!nk[k]){M.delete(coll==='crmc'?+k.slice(1):k.slice(1));ch=1}});CRM.dk[p]=nk}else Object.assign(old,nk),CRM.dk[p]=old;
 if(ch){if(coll==='crmc')CRM.vc++;else if(coll==='crmt')CRM.vt++;else CRM.ve++}return ch}
function crmCovers(d,b){if(!crmIsObj(b))return false;for(const k in d){if(k==='_u')continue;const v=d[k];if(crmIsObj(v)){if(!crmCovers(v,b[k]))return false}else if(JSON.stringify(b[k]===undefined?null:b[k])!==JSON.stringify(v===undefined?null:v))return false}return true}
function crmRcPrune(){const cut=Date.now()-6000,ps={};CRM.rc=CRM.rc.filter(x=>{if(x.t<cut){ps[x.p]=1;return false}return true});let ch=0;Object.keys(ps).forEach(p=>{if(CRM.sv[p])ch|=crmApply(p)});if(ch)crmChanged(1)}
function crmApply(p){const b=crmVis(p),o=CRM.docs[p];if(o){const x=JSON.stringify(Object.assign({},o,{_u:0})),y=JSON.stringify(Object.assign({},b,{_u:0}));if(x===y)return 0}CRM.docs[p]=b;return crmExtract(p,b)}
function crmSnap(coll,snap){let ch=0;const md=snap.metadata||{};
 if(!CRM.first[coll]&&snap.empty&&md.fromCache){clearTimeout(CRM['ft'+coll]);CRM['ft'+coll]=setTimeout(()=>{if(!CRM.first[coll])crmSnap(coll,{docs:[],empty:true,metadata:{fromCache:false},docChanges:()=>[]})},4000);return}
 const chs=snap.docChanges?snap.docChanges():[];
 const docs=(CRM.first[coll]&&chs.length)?chs.map(c=>[c.type,c.doc]):snap.docs.map(d=>['added',d]);
 docs.forEach(([ty,d])=>{const p=coll+'/'+d.id;if(ty==='removed'){if(coll==='crme')return;delete CRM.sv[p];ch|=crmApply(p);return}const x=d.data?d.data():null;if(!x)return;CRM.sv[p]=x;if(CRM.rc.length)CRM.rc=CRM.rc.filter(r=>!(r.p===p&&crmCovers(r.d,x)));ch|=crmApply(p)});
 if(!CRM.first[coll]){CRM.first[coll]=1;ch=1}
 if(!CRM.ready&&CRM.first.crmc&&CRM.first.crmt){CRM.ready=1;setTimeout(crmAfterReady,0)}
 if(ch)crmChanged(1)}
function crmSubErr(coll,e){CRM.err=(e&&e.message)||'Live updates stopped';if(e&&e.code==='revoked'){CRM.ro=1;CRM.why='Access to shared data was withdrawn.'}crmChanged(1)}
function crmSubscribe(){const db=CRM.db;if(!db)return;
 try{CRM.subs.push(db.collection('crmc').onSnapshot(s=>crmSnap('crmc',s),e=>crmSubErr('crmc',e)))}catch(e){}
 try{CRM.subs.push(db.collection('crmt').onSnapshot(s=>crmSnap('crmt',s),e=>crmSubErr('crmt',e)))}catch(e){}
 crmSubE()}
function crmSubE(){const d=new Date();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()-1);const m=d.toISOString().slice(0,7);if(CRM.em===m||!CRM.db)return;CRM.em=m;if(CRM.ue){try{CRM.ue()}catch(e){}}
 try{CRM.ue=CRM.db.collection('crme').where('m','>=',m).onSnapshot(s=>crmSnap('crme',s),e=>crmSubErr('crme',e))}catch(e){CRM.first.crme=1}}
/* ---------- writes: optimistic local apply + outbox pump (one write per document at a time) ---------- */
function crmW(p,patch){if(CRM.rec){Object.keys(patch).forEach(k=>{if(k.length<2||'cte'.indexOf(k[0])<0||CRM.rec.some(r=>r.p===p&&r.k===k))return;const cur=(CRM.docs[p]||{})[k];CRM.rec.push({p,k,old:cur===undefined?undefined:crmClone(cur)})})}CRM.q.push({p,d:patch});const b=CRM.docs[p]||(CRM.docs[p]=crmMeta(p));crmMerge(b,crmClone(patch));crmExtract(p,b,Object.keys(patch));CRM.ver++;CRM.cache={};crmQSave();clearTimeout(CRM.pt);if(CRM.db)CRM.pt=setTimeout(crmPump,CRM.db.local?0:120);clearTimeout(CRM.rt);CRM.rt=setTimeout(()=>{try{crmRefresh(0)}catch(e){}},40)}
function crmQSave(){if(!CRM.live)return;clearTimeout(CRM.qt);CRM.qt=setTimeout(()=>{try{localStorage.setItem('owq_crm_q',JSON.stringify(Object.keys(CRM.fl).map(p=>({p,d:CRM.fl[p]})).concat(CRM.q).slice(0,400)))}catch(e){}},600)}
function crmHasAll(d,patch){return Object.keys(patch).every(k=>k[0]==='_'||k==='m'||k==='b'||(d&&d[k]!==undefined))}
async function crmSend(p,patch){const ref=CRM.db.doc(p),body=Object.assign(crmMeta(p),patch,{_u:Date.now()});
 try{await ref.update(body);return}catch(e){if(!e||e.code!=='invalid_argument')throw e;if(CRM.sv[p])throw e}
 let ex=false;try{const g=await ref.get();ex=!!g.exists}catch(e){}
 if(ex){await ref.update(body);return}
 await ref.set(body);
 try{const g=await ref.get(),d=g.exists?g.data():null;if(!crmHasAll(d,patch))await ref.update(body)}catch(e){}}
async function crmPump(){if(CRM.pump||!CRM.db||CRM.ro)return;CRM.pump=1;
 try{while(CRM.q.length&&!CRM.ro){const paths=[];for(const x of CRM.q){if(paths.indexOf(x.p)<0)paths.push(x.p);if(paths.length>=3)break}
   const jobs=paths.map(p=>{const patch={};CRM.q.forEach(x=>{if(x.p===p)crmMerge(patch,x.d)});return{p,patch}});CRM.q=CRM.q.filter(x=>paths.indexOf(x.p)<0);jobs.forEach(j=>CRM.fl[j.p]=j.patch);
   const res=await Promise.all(jobs.map(j=>crmSend(j.p,j.patch).then(()=>null,e=>e||{code:'unavailable'})));let retry=0;
   jobs.forEach((j,k)=>{const e=res[k],p=j.p;delete CRM.fl[p];if(!e){CRM.err='';CRM.rc.push({p,d:j.patch,t:Date.now()});clearTimeout(CRM.rpt);CRM.rpt=setTimeout(crmRcPrune,6500);return}const code=e.code;
    if((code==='invalid_argument'&&CRM.canW===true)||code==='quota_exceeded'){CRM.err=code==='quota_exceeded'?'The shared database is full. Export a backup and ask the owner to clean up.':'A save was refused (the shared record may be too large).';try{toast(CRM.err)}catch(x){}crmApply(p)}
    else if(code==='invalid_argument'||code==='not_granted'||code==='revoked'||code==='capability_disabled'||code==='capability_removed'){if(!CRM.ro){CRM.ro=1;CRM.why='A save was refused (code: '+code+'). Changes stay on this screen only.';try{toast('View only: your CRM changes are not saved for the team.')}catch(x){}}CRM.q.unshift({p,d:j.patch})}
    else{CRM.q.unshift({p,d:j.patch});CRM.err=(e&&e.message)||'Could not save';retry=1}});
   if(retry){setTimeout(crmPump,4000+Math.random()*2000);break}}}
 finally{CRM.pump=0;crmQSave();try{crmSyncUI()}catch(e){}const cut=Date.now()-6000;if(CRM.rc.some(x=>x.t<cut)){const ps={};CRM.rc=CRM.rc.filter(x=>{if(x.t<cut){ps[x.p]=1;return false}return true});Object.keys(ps).forEach(p=>{if(CRM.sv[p])crmApply(p)})}}}
function crmFlush(){return new Promise(r=>{const t0=Date.now(),f=()=>{if((!CRM.q.length&&!CRM.pump)||Date.now()-t0>15000)r(CRM.q.length);else setTimeout(f,60)};f()})}
/* ---------- change propagation ---------- */
function crmChanged(remote){CRM.ver++;CRM.cache={};clearTimeout(CRM.rt);CRM.rt=setTimeout(()=>{try{if(typeof crmRefresh==='function')crmRefresh(remote)}catch(e){}},remote?250:30)}
function crmMemo(k,f){const v=CRM.ver;const c=CRM.cache[k];if(c&&c.v===v)return c.x;const x=f();CRM.cache[k]={v,x};return x}
/* ---------- reads ---------- */
function crmAll(){return crmMemo('all',()=>{const a=[];CRM.c.forEach(c=>{if(!c.del)a.push(c)});a.sort((x,y)=>(x.at||0)-(y.at||0)||x.id-y.id);return a})}
function crmVisible(w){w=w===undefined?WHO:w;const own=crmOwnerView(w);return crmMemo('vis:'+w,()=>crmAll().filter(c=>own||c.owner===w||!c.owner||c.owner==='Unassigned'))}
function crmGet(id){const c=CRM.c.get(+id);return c&&!c.del?c:null}
function crmTasksBy(){return crmMemo('tby',()=>{const m=new Map();CRM.t.forEach(t=>{if(t.s!=='o')return;const c=+t.c;let a=m.get(c);if(!a)m.set(c,a=[]);a.push(t)});m.forEach(a=>a.sort((x,y)=>x.due-y.due));return m})}
function crmOpenTasks(id){return crmTasksBy().get(+id)||[]}
function crmNext(id){return crmOpenTasks(id)[0]||null}
function crmEvBy(){return crmMemo('eby',()=>{const m=new Map();CRM.e.forEach(e=>{if(e.del)return;const c=+e.c;let a=m.get(c);if(!a)m.set(c,a=[]);a.push(e)});m.forEach(a=>a.sort((x,y)=>x.at-y.at||(x.id<y.id?-1:1)));return m})}
function crmEvents(id){return crmEvBy().get(+id)||[]}
function crmPolicies(c){if(!c||typeof D==='undefined')return[];const n=String(c.name||'').toLowerCase().trim();return(D.policies||[]).filter(p=>p.crmId!=null?String(p.crmId)===String(c.id):(n&&String(p.cl||'').toLowerCase().trim()===n))}
/* ---------- legacy shim (MYCL consumers) ---------- */
function crmToLegacy(c){const nx=crmNext(c.id),ev=crmEvents(c.id).filter(e=>CRM_EVL[e.ty]).slice(-30);
 const info=Object.assign({},c.info||{});['dob','street','city','state','zip','phone2'].forEach(k=>{if(c[k])info[k]=c[k]});
 return{id:c.id,ag:c.owner||'',name:c.name||'',phone:c.phone||'',email:c.email||'',age:String(crmAgeOf(c)||''),src:c.src||'',st:CRM_N2L[c.stage]||'Lead',fu:nx?crmDay(nx.due):'',
  notes:ev.map(e=>({at:new Date(e.at).toISOString(),ty:CRM_EVL[e.ty],t:(e.o&&CRM_OUT[e.o]?CRM_OUT[e.o]+(e.t?': ':''):'')+(e.t||''),_e:e.id})),info,mb:(()=>{const m={};Object.keys(c.mb||{}).forEach(k=>{if(c.mb[k]!=null)m[k]=c.mb[k]});return m})(),crm:1,_at:c.at||0}}
function crmLegacy(){return crmMemo('leg',()=>crmAll().map(crmToLegacy))}
function crmMy(){const w=typeof WHO!=='undefined'?WHO:'';if(crmOwnerView(w))return crmLegacy();return crmMemo('my:'+w,()=>crmLegacy().filter(c=>c.ag===w))}
function crmAgeOf(c){if(c.dob&&/^\d{4}-\d{2}-\d{2}$/.test(c.dob)){const b=new Date(c.dob+'T12:00:00'),n=new Date();let a=n.getFullYear()-b.getFullYear();if(n.getMonth()<b.getMonth()||(n.getMonth()===b.getMonth()&&n.getDate()<b.getDate()))a--;if(a>=0&&a<125)return a}return c.age?+c.age||'':''}
/* ---------- contact / task / event API ---------- */
function crmPut(id,patch){patch.up=Date.now();patch.ub=typeof WHO!=='undefined'?WHO:'';crmW('crmc/'+crmCB(id),{['c'+id]:patch})}
function crmEv(cid,ty,f){f=f||{};const at=f.at||Date.now(),id=f.id||crmEid(at),ev=Object.assign({id,c:+cid,ty,at,by:typeof WHO!=='undefined'?WHO:''},f);ev.id=id;ev.at=at;
 const p='crme/'+crmEB(cid,at),mt=crmMeta(p);crmW(p,{m:mt.m,b:mt.b,['e'+id]:ev});
 if(CRM_EVL[ty]&&ty!=='note'&&!f.noTouch){const c=crmGet(cid);if(c){const pt={lt:Math.max(c.lt||0,at)};if(!c.ft&&ty!=='meet')pt.ft=at;const conn=f.o==='int'||f.o==='appt'||f.o==='ni'||ty==='meet';pt.la=conn?0:(c.la||0)+((ty==='call'&&(f.o==='na'||f.o==='vm'||f.o==='cb'||!f.o))||ty==='text'||ty==='email'?1:0);if(f.o)pt.lo=f.o;if(conn)pt.conn=at;crmPut(cid,pt)}}
 return ev}
function crmTask(t){const id=t.id||('m_'+t.c+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,4));const w=typeof WHO!=='undefined'?WHO:'';
 const rec=Object.assign({id,c:+t.c,ty:'fu',t:'',due:Date.now(),ow:w,s:'o',at:Date.now(),by:w,r:'man'},t);rec.id=id;crmW('crmt/'+crmCB(rec.c),{['t'+id]:rec});crmNx(rec.c);return rec}
function crmTaskPatch(id,patch){const t=CRM.t.get(id);if(!t)return null;crmW('crmt/'+crmCB(t.c),{['t'+id]:patch});crmNx(t.c);return t}
function crmNx(cid){const c=crmGet(cid);if(!c)return;CRM.cache={};const n=crmNext(cid),nx=n?{due:n.due,ty:n.ty,t:n.t||''}:null,o=c.nx||null;if(JSON.stringify(nx)!==JSON.stringify(o))crmPut(cid,{nx})}
function crmCreate(o,opt){opt=opt||{};const now=Date.now(),w=typeof WHO!=='undefined'?WHO:'',id=o.id||crmNewId();
 const rec={id,name:o.name||'New lead',phone:o.phone||'',email:o.email||'',age:o.age||'',dob:o.dob||'',state:o.state||'',city:o.city||'',street:o.street||'',zip:o.zip||'',phone2:o.phone2||'',
  src:o.src||'',ven:o.ven||'',cost:o.cost||0,rcv:o.rcv||now,prod:o.prod||'',ap:o.ap||0,stage:o.stage||'new',sAt:now,owner:o.owner===undefined?w:o.owner,tags:o.tags||[],at:now,by:w,up:now,ub:w,
  dnc:0,sms:o.sms||0,info:o.info||{},mb:{},lt:0,ft:0,la:0,lo:'',cad:{k:o.src||'manual',s:now,n:0,stop:0}};
 crmW('crmc/'+crmCB(id),{['c'+id]:rec});
 crmEv(id,opt.ev||'sys',{t:opt.note||('Lead created'+(rec.src?' from '+rec.src:'')),noTouch:1});
 if(o.notes)crmEv(id,'note',{t:String(o.notes)});
 if(!opt.noTask&&rec.stage==='new')crmTask({id:'a_'+id+'_new_0',c:id,ty:'call',t:'First call (speed to lead)',due:now,ow:rec.owner,r:'new',step:0});
 return rec}
function crmStage(id,st,why,eid){const c=crmGet(id);if(!c||c.stage===st||!CRM_SN[st])return;const from=c.stage;crmPut(id,{stage:st,sAt:Date.now()});const f={t:'Stage: '+CRM_SN[from]+' \u2192 '+CRM_SN[st]+(why?' ('+why+')':''),x:{from,to:st},noTouch:1};if(eid)f.id=eid;crmEv(id,'stage',f)}
function crmRank(st){return CRM_ST.indexOf(st)}
function crmDel(id,undo){const c=crmGet(id);if(!c&&!undo)return;crmPut(id,undo?{del:0,dAt:0}:{del:1,dAt:Date.now()});if(!undo)crmOpenTasks(id).forEach(t=>crmTaskPatch(t.id,{s:'x',dn:Date.now()}))}
/* outcomes shared by the 360 quick log (Phase A) and the Power Dial (Phase B) */
function crmOutcome(id,o,ex){ex=ex||{};const c=crmGet(id);if(!c)return null;const ev=crmEv(id,ex.ty||'call',{o,t:ex.t||''});
 const nt=crmNext(id);if(nt&&(nt.ty==='call'||nt.ty==='fu'||nt.ty==='text')&&!ex.keepTask)crmTaskPatch(nt.id,{s:'d',dn:Date.now(),dby:WHO,o});
 if(o==='int'||o==='appt'){if(crmRank(c.stage)<crmRank('contacted'))crmStage(id,'contacted','first connect')}
 if(o==='appt'){crmStage(id,'appt','appointment set');if(ex.when)crmTask({c:id,ty:'appt',t:'Appointment',due:ex.when,ow:c.owner})}
 if(o==='ni')crmStage(id,'dead','not interested');
 if(o==='dnc'){crmPut(id,{dnc:1});crmOpenTasks(id).forEach(t=>crmTaskPatch(t.id,{s:'x',dn:Date.now()}));crmStage(id,'dead','do not contact')}
 if(o==='bad'){crmPut(id,{bad:1})}
 if(o==='cb'&&ex.when)crmTask({c:id,ty:'call',t:'Call back',due:ex.when,ow:c.owner});
 if((o==='na'||o==='vm'||o==='int')&&!ex.noNext&&!crmNext(id)){const d=new Date();d.setDate(d.getDate()+(o==='int'?2:1));d.setHours(10,0,0,0);crmTask({c:id,ty:'call',t:o==='int'?'Follow up on interest':'Call attempt '+((c.la||0)+2),due:d.getTime(),ow:c.owner,r:'next'})}
 return ev}
/* Done = complete the task; when nothing else is scheduled for an active lead, schedule a sensible next touch (Phase B: crmPlan decides) */
function crmDone(tid,o){const t=CRM.t.get(tid);if(!t||t.s!=='o')return null;crmTaskPatch(tid,{s:'d',dn:Date.now(),dby:WHO,o:o||''});
 if(t.ty==='call'||t.ty==='text'||t.ty==='email')crmEv(t.c,t.ty,{t:'Done: '+(t.t||CRM_TY[t.ty]),o:o||''});else crmEv(t.c,'task',{t:'Done: '+(t.t||CRM_TY[t.ty]),noTouch:1});
 const c=crmGet(t.c);let nt=null;if(c&&!crmNext(t.c)&&['new','contacted','appt','quoted','applied'].indexOf(c.stage)>=0&&!c.dnc){const days={new:1,contacted:2,appt:1,quoted:3,applied:7}[c.stage];const d=new Date();d.setDate(d.getDate()+days);d.setHours(10,0,0,0);nt=crmTask({c:t.c,ty:c.stage==='applied'?'fu':'call',t:c.stage==='applied'?'Underwriting check-in':'Follow-up call',due:d.getTime(),ow:c.owner,r:'next'})}
 return nt}
function crmSnooze(tid,until){const t=CRM.t.get(tid);if(!t)return;crmTaskPatch(tid,{due:until,ad:0,sn:(t.sn||0)+1})}
function crmDueState(t,now){now=now||Date.now();const s=crmSOD(now);if(t.due<s)return'over';if(t.due<s+864e5)return t.due<now-36e5&&t.ty!=='appt'?'late':'today';return'soon'}
/* ---------- US state -> time zone (calling window) ---------- */
const CRM_STN={AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'};
const CRM_TZ=(()=>{const z={},E='America/New_York',C='America/Chicago',M='America/Denver',P='America/Los_Angeles';
 'CT DE DC FL GA IN KY ME MD MA MI NH NJ NY NC OH PA RI SC VT VA WV'.split(' ').forEach(s=>z[s]=E);'AL AR IL IA KS LA MN MS MO NE ND OK SD TN TX WI'.split(' ').forEach(s=>z[s]=C);'CO MT NM UT WY ID'.split(' ').forEach(s=>z[s]=M);'CA NV OR WA'.split(' ').forEach(s=>z[s]=P);z.AZ='America/Phoenix';z.AK='America/Anchorage';z.HI='Pacific/Honolulu';return z})();
function crmStateCode(s){s=String(s||'').trim();if(!s)return'';const u=s.toUpperCase();if(CRM_STN[u])return u;const l=s.toLowerCase();for(const k in CRM_STN)if(CRM_STN[k].toLowerCase()===l)return k;return''}
function crmLocalHour(state,ts){const z=CRM_TZ[crmStateCode(state)];if(!z)return null;try{const f=new Intl.DateTimeFormat('en-US',{timeZone:z,hour:'numeric',minute:'2-digit',hour12:false}).formatToParts(new Date(ts||Date.now()));const h=+f.find(x=>x.type==='hour').value%24,m=+f.find(x=>x.type==='minute').value;return{h,m,z}}catch(e){return null}}
function crmWindow(c,ts){const lh=crmLocalHour(c&&c.state,ts);if(!lh)return{known:0,ok:1};const w=(CRM.cfg&&CRM.cfg.win)||{s:8,e:21},v=lh.h+lh.m/60;const hh=lh.h%12||12;return{known:1,ok:v>=w.s&&v<w.e,label:hh+':'+crmP2(lh.m)+(lh.h<12?' AM':' PM'),h:lh.h}}
/* ---------- Today queue scoring (pure) ---------- */
function crmScore(c,t,now,o){o=o||{};now=now||Date.now();let s=0,why='',w=0;const sod=crmSOD(now),add=(n,label)=>{s+=n;if(n>w&&label){w=n;why=label}};
 if(t){const st=crmDueState(t,now);if(t.ty==='appt'&&st!=='over'&&t.due<sod+864e5)add(60+Math.max(0,30-Math.abs(t.due-now)/12e4),'Appointment '+(t.due>=now?'today':'now'));
  else if(st==='over')add(40+Math.min(30,Math.floor((sod-t.due)/864e5+1)*5),'Overdue '+Math.max(1,Math.ceil((sod-t.due)/864e5))+'d');
  else if(st==='late'||st==='today')add(30+(t.due<=now?8:0),t.due<=now?'Due now':'Due today')}
 if(c.stage==='new'&&!c.ft){const age=(now-(c.rcv||c.at||now))/6e4;add(70+Math.max(0,40-age/6),age<60?'New lead '+Math.max(0,Math.round(age))+'m':'Untouched lead')}
 s+={new:8,contacted:6,appt:15,quoted:12,applied:10,issued:9,client:2,dead:-20}[c.stage]||0;
 if((c.la||0)>3)s-=3*((c.la||0)-3);
 s+=CRM_SQ[c.src]||0;
 const b=String((c.info||{}).best||'').toLowerCase(),h=new Date(now).getHours();if((b.indexOf('morn')>=0&&h<12)||(b.indexOf('after')>=0&&h>=12&&h<17)||(b.indexOf('even')>=0&&h>=17))add(5,'Best time now');
 if(c.dnc)s-=100;
 const win=crmWindow(c,now);if(win.known&&!win.ok){s-=25;if(!o.keepWhy)why='Outside calling hours'}
 return{s:Math.round(s),why:why||(c.stage==='new'?'New lead':'Follow-up')}}
function crmQueue(w,now){now=now||Date.now();const eod=crmSOD(now)+864e5,vis=crmVisible(w),tby=crmTasksBy(),out=[];
 vis.forEach(c=>{if(c.dnc)return;const ts=tby.get(c.id)||[],t=ts.find(x=>x.due<eod)||null;if(!t&&!(c.stage==='new'&&!c.ft))return;const sc=crmScore(c,t,now);out.push({c,t,s:sc.s,why:sc.why})});
 out.sort((a,b)=>b.s-a.s||((a.t?a.t.due:0)-(b.t?b.t.due:0))||a.c.id-b.c.id);return out}
function crmCounts(w,now){now=now||Date.now();const sod=crmSOD(now),eod=sod+864e5,vis=crmVisible(w),tby=crmTasksBy();let over=0,today=0,appt=0,fresh=0,deliv=0,bday=0;
 const md=ts=>{const d=new Date(ts);return(d.getMonth()+1)*100+d.getDate()},wk=[];for(let i=0;i<7;i++)wk.push(md(now+i*864e5));
 vis.forEach(c=>{const nw=c.stage==='new'&&!c.ft;(tby.get(c.id)||[]).forEach(t=>{if(nw&&t.ty!=='appt')return;if(t.due<sod)over++;else if(t.due<eod){if(t.ty==='appt')appt++;else today++}});if(nw&&!c.dnc)fresh++;if(c.stage==='issued')deliv++;
  if(c.dob&&/^\d{4}-\d{2}-\d{2}$/.test(c.dob)&&wk.indexOf(+c.dob.slice(5,7)*100+ +c.dob.slice(8,10))>=0)bday++});
 return{over,today,appt,fresh,deliv,bday}}
function crmDeckStats(w){const k=crmCounts(w);return{overdue:k.over,dueToday:k.today,newLeads:k.fresh,apptsToday:k.appt}}
/* ---------- quick-capture parser (pure, offline) ---------- */
const CRM_PRODK=[[/\b(final\s*expense|burial|funeral|f\.?e\.?)\b/i,'Final Expense'],[/\b(mortgage\s*protection|mortgage|m\.?p\.?)\b/i,'Mortgage Protection'],[/\b(whole\s*life|w\.?l\.?)\b/i,'Whole Life'],[/\b(iul|indexed\s*universal(\s*life)?)\b/i,'IUL'],[/\b(annuit(y|ies))\b/i,'Annuity'],[/\b(term(\s*life)?)\b/i,'Term']];
const CRM_SRCK=[[/\b(live\s*transfers?|transfer|lt)\b/i,'Live Transfers'],[/\b(facebook|fb|meta)(\s*leads?)?\b/i,'Facebook Leads'],[/\b(direct\s*mail|mailers?|dm)(\s*leads?)?\b/i,'Direct Mail'],[/\baged(\s*leads?)?\b/i,'Aged Leads'],[/\b(referral|referred(\s*by)?|ref)\b/i,'Referral']];
const CRM_STOP=new Set('name lead leads new age aged yo y/o yrs years year old dob born phone cell mobile tel email e-mail state from lives living in call text product source interested wants needs quote for and the a an of at is smoker nonsmoker non-smoker tobacco zip'.split(' '));
const CRM_LOWOK=new Set('pa fl tx ny nj nc sc az nv ut nm mt wy wv vt nh ri md mi mn wi il ks ms ar ak ca ky tn ga va wa ia nd sd ct dc'.split(' '));
function crmFmtPhone(d){d=String(d||'').replace(/\D/g,'');if(d.length===11&&d[0]==='1')d=d.slice(1);return d.length===10?d.slice(0,3)+'-'+d.slice(3,6)+'-'+d.slice(6):''}
function crmParse(text,now){now=now||Date.now();const out={};let s=' '+String(text||'').replace(/[\t\r\n]+/g,' ').replace(/\s+/g,' ')+' ';const cy=new Date(now).getFullYear();
 s=s.replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g,m=>{if(!out.email)out.email=m.toLowerCase();return' '});
 const dob=(y,mo,d)=>{y=+y;mo=+mo;d=+d;if(y<100)y=y>(cy-2000)-18?1900+y:2000+y;if(mo<1||mo>12||d<1||d>31||y<1900||y>cy)return'';return y+'-'+crmP2(mo)+'-'+crmP2(d)};
 s=s.replace(/\b(?:dob|born|birthday|d\.o\.b\.?)?\s*:?\s*\b((?:19|20)\d{2})-(\d{1,2})-(\d{1,2})\b/gi,(m,y,mo,d)=>{const v=dob(y,mo,d);if(v&&!out.dob){out.dob=v;return' '}return m});
 s=s.replace(/\b(?:dob|born|birthday|d\.o\.b\.?)?\s*:?\s*\b(\d{1,2})[\/.](\d{1,2})[\/.](\d{2}|\d{4})\b/gi,(m,mo,d,y)=>{const v=dob(y,mo,d);if(v&&!out.dob){out.dob=v;return' '}return m});
 s=s.replace(/(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,m=>{const f=crmFmtPhone(m);if(!f)return m;if(!out.phone)out.phone=f;else if(!out.phone2&&f!==out.phone)out.phone2=f;return' '});
 s=s.replace(/\b(?:zip\s*:?\s*)?(\d{5})(?:-\d{4})?\b/gi,(m,z)=>{if(!out.zip){out.zip=z;return' '}return m});
 s=s.replace(/\b(?:age\s*:?\s*)?(\d{2,3})\s*(?:yo|y\/o|yrs?(?:\s*old)?|years?(?:\s*old)?)\b/gi,(m,a)=>{a=+a;if(a>=18&&a<=110&&!out.age){out.age=String(a);return' '}return m});
 s=s.replace(/\bage\s*:?\s*(\d{2,3})\b/gi,(m,a)=>{a=+a;if(a>=18&&a<=110&&!out.age){out.age=String(a);return' '}return m});
 s=s.replace(/\b(?:born\s*(?:in)?\s*)((?:19|20)\d{2})\b/gi,(m,y)=>{if(!out.age&&!out.dob){out.age=String(cy-(+y));return' '}return m});
 CRM_PRODK.forEach(([re,v])=>{if(out.prod)return;s=s.replace(re,m=>{if(!out.prod){out.prod=v;return' '}return m})});
 CRM_SRCK.forEach(([re,v])=>{if(out.src)return;s=s.replace(re,m=>{if(!out.src){out.src=v;return' '}return m})});
 s=s.replace(/\b(non[\s-]?smoker|no tobacco|non[\s-]?tobacco)\b/gi,()=>{out.tobacco='No';return' '}).replace(/\b(smoker|smokes|tobacco user|uses tobacco)\b/gi,()=>{if(!out.tobacco)out.tobacco='Yes';return' '});
 const names=Object.keys(CRM_STN).map(k=>[k,CRM_STN[k]]).sort((a,b)=>b[1].length-a[1].length);
 for(const [k,n] of names){const re=new RegExp('\\b'+n.replace(/ /g,'\\s+')+'\\b','i');if(re.test(s)){out.state=k;s=s.replace(re,' ');break}}
 if(!out.state){const AB={mich:'MI',penn:'PA',calif:'CA',fla:'FL',mass:'MA',minn:'MN',wisc:'WI',tenn:'TN',ariz:'AZ',colo:'CO',conn:'CT',okla:'OK',wash:'WA',ala:'AL',ark:'AR',miss:'MS',nebr:'NE',nev:'NV',wyo:'WY',penna:'PA'};s=s.replace(/(^|[\s,;(])([A-Za-z]{3,5})\.(?=[\s,;)]|$)/g,(m,pre,t)=>{const v=AB[t.toLowerCase()];if(v&&!out.state){out.state=v;return pre+' '}return m})}
 if(!out.state){s=s.replace(/(^|[\s,;(])([A-Za-z]{2})(?=[\s,;.)]|$)/g,(m,pre,t)=>{if(out.state)return m;const u=t.toUpperCase();if(CRM_STN[u]&&(t===u||CRM_LOWOK.has(t.toLowerCase()))){out.state=u;return pre+' '}return m})}
 s=s.replace(/\b(\d{2,3})\b/g,(m,a)=>{a=+a;if(!out.age&&a>=18&&a<=110){out.age=String(a);return' '}return m});
 const toks=s.replace(/[,;|]+/g,' , ').split(/\s+/).filter(Boolean),nm=[],rest=[];let inName=true;
 toks.forEach(t=>{const w=t.replace(/[:.]+$/,'');if(t===','){if(nm.length)inName=false;return}const isW=/^[A-Za-z][A-Za-z'\-]*\.?$/.test(w);
  const capOk=!nm.length||!/^[A-Z]/.test(nm[0])||/^[A-Z]/.test(w);if(inName&&isW&&!CRM_STOP.has(w.toLowerCase())&&nm.length<4&&capOk)nm.push(w);else{if(nm.length)inName=false;if(!CRM_STOP.has(w.toLowerCase())||!isW)rest.push(t)}});
 if(nm.length)out.name=nm.map(w=>/^(ii|iii|iv|jr|sr)\.?$/i.test(w)?w.toUpperCase().replace('JR','Jr').replace('SR','Sr'):w.split('-').map(x=>x.split("'").map(y=>y?y[0].toUpperCase()+y.slice(1).toLowerCase():y).join("'")).join('-')).join(' ');
 const note=rest.join(' ').replace(/\s+([,.])/g,'$1').replace(/^[,.\s]+|[,.\s]+$/g,'').trim();if(note&&/[A-Za-z]{3}/.test(note))out.notes=note;
 if(out.dob&&!out.age){const a=crmAgeOf({dob:out.dob});if(a)out.age=String(a)}
 return out}
/* ---------- CSV / pasted table import (pure) ---------- */
function crmCsv(text){text=String(text||'').replace(/^\uFEFF/,'');const first=text.split(/\r?\n/)[0]||'';const dl=first.indexOf('\t')>=0?'\t':(first.split(';').length>first.split(',').length?';':',');
 const rows=[];let row=[],cur='',q=false;for(let i=0;i<text.length;i++){const ch=text[i];if(q){if(ch==='"'){if(text[i+1]==='"'){cur+='"';i++}else q=false}else cur+=ch;continue}
  if(ch==='"'&&cur===''){q=true;continue}if(ch===dl){row.push(cur);cur='';continue}if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cur);cur='';if(row.some(x=>x.trim()))rows.push(row.map(x=>x.trim()));row=[];continue}cur+=ch}
 row.push(cur);if(row.some(x=>x.trim()))rows.push(row.map(x=>x.trim()));return rows}
const CRM_HDR={name:/^(full\s*name|name|client(\s*name)?|contact(\s*name)?|lead(\s*name)?|customer)$/i,first:/^(first(\s*name)?|fname|given(\s*name)?)$/i,last:/^(last(\s*name)?|lname|surname|family\s*name)$/i,
 phone:/^(phone(\s*(number|#))?|cell(\s*phone)?|mobile|telephone|tel|primary\s*phone|home\s*phone|phone\s*1)$/i,phone2:/^(alt(ernate)?\s*phone|phone\s*2|secondary\s*phone|work\s*phone)$/i,email:/^(e-?mail(\s*address)?)$/i,age:/^age$/i,
 dob:/^(dob|d\.o\.b\.?|date\s*of\s*birth|birth\s*date|birthday)$/i,state:/^(state|st|province)$/i,city:/^city$/i,zip:/^(zip(\s*code)?|postal(\s*code)?)$/i,street:/^(address(\s*1)?|street(\s*address)?)$/i,
 prod:/^(product|interest|coverage(\s*type)?|lead\s*type|type)$/i,src:/^(source|lead\s*source|campaign)$/i,ven:/^(vendor|lead\s*vendor)$/i,cost:/^(cost|lead\s*cost|price)$/i,notes:/^(notes?|comments?|message)$/i,owner:/^(agent|owner|assigned(\s*to)?)$/i,rcv:/^(date|received|created|lead\s*date|date\s*received)$/i,
 budget:/^(budget|monthly\s*budget)$/i,tobacco:/^(tobacco|smoker)$/i};
function crmMapCols(rows){const h=rows[0]||[],map={},hit=h.filter(x=>Object.values(CRM_HDR).some(re=>re.test(x))).length;
 if(hit>=2||(h.length===1&&hit===1)){h.forEach((x,i)=>{for(const k in CRM_HDR)if(CRM_HDR[k].test(x)&&map[k]===undefined){map[k]=i;break}});return{map,head:1}}
 const n=h.length,col=i=>rows.slice(0,25).map(r=>r[i]||''),frac=(i,re)=>{const v=col(i).filter(Boolean);return v.length?v.filter(x=>re.test(x)).length/v.length:0};
 for(let i=0;i<n;i++){if(map.phone===undefined&&frac(i,/^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$|^\+?1?\d{10}$/)>.6)map.phone=i;else if(map.email===undefined&&frac(i,/@/)>.6)map.email=i;else if(map.state===undefined&&frac(i,/^[A-Za-z]{2}$|^[A-Za-z ]{4,20}$/)>.6&&col(i).filter(Boolean).every(x=>crmStateCode(x)))map.state=i;
  else if(map.age===undefined&&frac(i,/^\d{2,3}$/)>.6&&col(i).filter(Boolean).every(x=>+x>=18&&+x<=110))map.age=i;else if(map.dob===undefined&&frac(i,/^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}$|^\d{4}-\d{2}-\d{2}$/)>.6)map.dob=i;
  else if(map.zip===undefined&&frac(i,/^\d{5}(-\d{4})?$/)>.6)map.zip=i;else if(map.name===undefined&&frac(i,/^[A-Za-z][A-Za-z'.\- ]+$/)>.6)map.name=i;else if(map.prod===undefined&&col(i).some(x=>CRM_PRODK.some(p=>p[0].test(x))))map.prod=i;else if(map.src===undefined&&col(i).some(x=>CRM_SRCK.some(p=>p[0].test(x))))map.src=i}
 return{map,head:0}}
function crmNormDate(v){v=String(v||'').trim();let m=/^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(v);if(m)return m[1]+'-'+crmP2(+m[2])+'-'+crmP2(+m[3]);m=/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2}|\d{4})$/.exec(v);if(m){let y=+m[3];const cy=new Date().getFullYear();if(y<100)y=y>(cy-2000)-18?1900+y:2000+y;return y+'-'+crmP2(+m[1])+'-'+crmP2(+m[2])}return''}
function crmRowsToLeads(rows,mp){const m=mp.map,g=(r,k)=>m[k]===undefined?'':String(r[m[k]]||'').trim();return rows.slice(mp.head?1:0).map(r=>{
 let name=g(r,'name');if(!name)name=[g(r,'first'),g(r,'last')].filter(Boolean).join(' ');const prodRaw=g(r,'prod'),srcRaw=g(r,'src');
 const o={name:name.replace(/\s+/g,' '),phone:crmFmtPhone(g(r,'phone'))||g(r,'phone'),phone2:crmFmtPhone(g(r,'phone2')),email:g(r,'email').toLowerCase(),age:(g(r,'age').match(/\d+/)||[''])[0],dob:crmNormDate(g(r,'dob')),state:crmStateCode(g(r,'state'))||g(r,'state'),city:g(r,'city'),zip:g(r,'zip'),street:g(r,'street'),
  prod:(CRM_PRODK.find(p=>p[0].test(prodRaw))||[0,prodRaw])[1],src:(CRM_SRCK.find(p=>p[0].test(srcRaw))||[0,srcRaw])[1],ven:g(r,'ven'),cost:+String(g(r,'cost')).replace(/[^0-9.]/g,'')||0,notes:g(r,'notes'),owner:g(r,'owner'),info:{}};
 if(g(r,'budget'))o.info.budget=g(r,'budget');if(g(r,'tobacco'))o.info.tobacco=/^(y|yes|true|1|smoker)$/i.test(g(r,'tobacco'))?'Yes':'No';if(o.dob&&!o.age)o.age=String(crmAgeOf({dob:o.dob})||'');return o}).filter(o=>o.name||o.phone||o.email)}
function crmKeyN(n){return String(n||'').toLowerCase().replace(/[^a-z]/g,'')}
function crmDupIndex(list){const ph=new Map(),em=new Map(),na=new Map();list.forEach(c=>{const p=String(c.phone||'').replace(/\D/g,'').slice(-10),e=String(c.email||'').toLowerCase().trim(),n=crmKeyN(c.name);if(p.length===10&&!ph.has(p))ph.set(p,c);if(e&&!em.has(e))em.set(e,c);const a=String(c.age||crmAgeOf(c)||'');if(n&&a&&!na.has(n+'|'+a))na.set(n+'|'+a,c)});return{ph,em,na}}
function crmFindDup(o,ix){const p=String(o.phone||'').replace(/\D/g,'').slice(-10),e=String(o.email||'').toLowerCase().trim(),n=crmKeyN(o.name),a=String(o.age||crmAgeOf(o)||'');
 if(p.length===10&&ix.ph.has(p))return{c:ix.ph.get(p),why:'same phone'};if(e&&ix.em.has(e))return{c:ix.em.get(e),why:'same email'};if(n&&a&&ix.na.has(n+'|'+a))return{c:ix.na.get(n+'|'+a),why:'same name and age'};return null}
function crmDedupe(leads,existing){const ix=crmDupIndex(existing),seen=crmDupIndex([]);return leads.map((o,i)=>{let d=crmFindDup(o,ix);let inb=null;if(!d){inb=crmFindDup(o,seen)}const r={o,i,dup:d?d.c:null,why:d?d.why:inb?inb.why+' (repeated in this list)':'',inBatch:!!inb};
 if(!d&&!inb){const p=String(o.phone||'').replace(/\D/g,'').slice(-10),e=String(o.email||'').toLowerCase(),n=crmKeyN(o.name),a=String(o.age||'');if(p.length===10)seen.ph.set(p,o);if(e)seen.em.set(e,o);if(n&&a)seen.na.set(n+'|'+a,o)}return r})}
/* ---------- migration (pure plan + executor) ---------- */
function crmMigPlan(legacy,have){const out={contacts:[],events:[],tasks:[]};(legacy||[]).forEach(o=>{if(!o||o.id==null)return;const id=+o.id;if(!isFinite(id)||have(id))return;
 const info=Object.assign({},o.info||{}),notes=Array.isArray(o.notes)?o.notes:[],ats=notes.map(n=>Date.parse(n.at)||0).filter(Boolean),t0=ats.length?Math.min(...ats):(id>1e12&&id<4e12?id:Date.parse('2026-01-01T12:00:00Z'));
 const pick=k=>{const v=info[k];delete info[k];return v||''};const stage=o.st==='Lead'?(notes.length?'contacted':'new'):(CRM_L2N[o.st]||'new');
 const c={id,name:String(o.name||'Client'),phone:o.phone||'',email:o.email||'',age:o.age||'',dob:pick('dob'),state:crmStateCode(pick('state'))||'',city:pick('city'),street:pick('street'),zip:pick('zip'),phone2:pick('phone2'),
  src:o.src||'',ven:'',cost:0,rcv:t0,prod:'',ap:0,stage,sAt:t0,owner:o.ag||'',tags:[],at:t0,by:o.ag||'',up:t0,ub:'migration',dnc:0,sms:0,info,mb:o.mb||{},lt:ats.length?Math.max(...ats):0,ft:ats.length?t0:0,la:0,lo:'',cad:{k:'legacy',s:t0,n:0,stop:0},lg:id};
 out.contacts.push(c);
 notes.forEach((n,i)=>{const at=Date.parse(n.at)||t0,ty={Call:'call',Text:'text',Email:'email',Meeting:'meet',Note:'note'}[n.ty]||'note';out.events.push({id:'l'+id+'_'+i,c:id,ty,at,by:o.ag||'',t:String(n.t||''),mig:1})});
 if(o.fu&&/^\d{4}-\d{2}-\d{2}$/.test(o.fu)&&stage!=='dead')out.tasks.push({id:'fu_'+id+'_'+o.fu.replace(/-/g,''),c:id,ty:'fu',t:'Follow-up',due:crmAt(o.fu,9,0),ad:1,ow:o.ag||'',s:'o',at:t0,by:o.ag||'',r:'legacy'})});return out}
function crmMigWrite(plan){plan.contacts.forEach(c=>crmW('crmc/'+crmCB(c.id),{['c'+c.id]:c}));plan.events.forEach(e=>{const p='crme/'+crmEB(e.c,e.at),mt=crmMeta(p);crmW(p,{m:mt.m,b:mt.b,['e'+e.id]:e})});plan.tasks.forEach(t=>crmW('crmt/'+crmCB(t.c),{['t'+t.id]:t}))}
async function crmLegacySource(){if(CRM.live&&CRM.db&&!CRM.db.local){const out=[];for(let i=0;i<((typeof SYB!=='undefined'&&SYB.clients)||6);i++){try{const g=await CRM.db.doc('rec/clients_'+i).get();if(g.exists){const d=g.data()||{};Object.keys(d).forEach(k=>{const o=synRec(d[k]);if(o)out.push(o)})}}catch(e){}}return out}
 return(typeof D!=='undefined'&&D.clients)||[]}
async function crmMigrate(){if(CRM.ro||CRM.migRun)return 0;CRM.migRun=1;try{const legacy=await crmLegacySource();const plan=crmMigPlan(legacy,id=>CRM.c.has(id));const n=plan.contacts.length;
 if(n){crmMigWrite(plan);crmW('crmc/cfg',{mig:{v:1,at:Date.now(),by:typeof WHO!=='undefined'?WHO:'',n:((CRM.cfg.mig||{}).n||0)+n}});crmChanged(0)}CRM.mig=n;return n}finally{CRM.migRun=0}}
/* demo seeders (mock/demo) in local mode: replace the local CRM with the seeded legacy list */
function crmSeedLegacy(list,reset){if(!crmOn())return;if(CRM.live&&!(CRM.db&&CRM.db.local)){try{toast('Demo data stays out of the shared CRM.')}catch(e){}return}
 if(reset&&CRM.db&&CRM.db._S){const S=CRM.db._S;Object.keys(S.docs).forEach(p=>{if(/^crm[cte]\//.test(p)){delete S.docs[p];try{localStorage.removeItem('owq_crm:'+p)}catch(e){}}});try{localStorage.setItem('owq_crm_ix','[]')}catch(e){}CRM.c.clear();CRM.t.clear();CRM.e.clear();CRM.sv={};CRM.docs={};CRM.dk={};CRM.cfg={}}
 crmMigWrite(crmMigPlan(list,id=>CRM.c.has(id)));crmChanged(0)}
/* ---------- policies: link + stage moves (a policy logged for a known contact) ---------- */
function crmFindByName(n){n=String(n||'').toLowerCase().trim();if(!n)return null;const m=crmAll().filter(c=>String(c.name).toLowerCase().trim()===n);return m.length===1?m[0]:(m.find(c=>crmOwnerView()||c.owner===WHO)||m[0]||null)}
function crmPKey(p){return[p.d,String(p.cl||'').toLowerCase().trim(),p.car,p.prod,p.ap,p.ag||''].join('|')}
function crmOnPolicy(p){if(!crmOn()||!p)return;const pf=CRM.ui.polFor?crmGet(CRM.ui.polFor):null;CRM.ui.polFor=null;const c=p.crmId!=null?crmGet(p.crmId):(pf&&String(pf.name).toLowerCase().trim()===String(p.cl||'').toLowerCase().trim()?pf:crmFindByName(p.cl));if(!c)return;if(p.crmId==null){p.crmId=c.id;try{save()}catch(e){}}
 crmEv(c.id,'policy',{id:'p'+crmHash(crmPKey(p)+'|'+p.st).toString(36),t:(p.car||'')+' '+(p.prod||'')+' - $'+Math.round(+p.ap||0).toLocaleString()+' AP - '+p.st,x:{st:p.st,ap:+p.ap||0},noTouch:1});crmPolicyStage(c,p);if(+p.ap&&!c.ap)crmPut(c.id,{ap:+p.ap});if(CRM.pst)CRM.pst[crmPKey(p)]=p.st;if((p.st==='Issued'||p.st==='Paid')&&typeof document!=='undefined'&&typeof crmConfetti==='function')crmConfetti()}
function crmPolicyStage(c,p){const st=p.st,k=crmHash(crmPKey(p)+'|'+st).toString(36);if((st==='Submitted'||st==='Pending')&&crmRank(c.stage)<crmRank('applied'))crmStage(c.id,'applied','policy submitted','s'+k);
 else if((st==='Issued'||st==='Paid')&&crmRank(c.stage)<crmRank('issued')||(st==='Issued'||st==='Paid')&&c.stage==='dead'){crmStage(c.id,st==='Paid'?'client':'issued','policy '+st.toLowerCase(),'s'+k);if(st==='Issued'){const d=new Date();d.setDate(d.getDate()+3);d.setHours(10,0,0,0);crmTask({id:'a_'+c.id+'_deliv_'+String(p.d||'').replace(/-/g,''),c:c.id,ty:'deliv',t:'Deliver the policy + referral ask',due:d.getTime(),ow:c.owner,r:'issued'})}}
 else if((st==='Declined'||st==='Postponed')&&c.stage==='applied'){crmStage(c.id,'quoted','policy '+st.toLowerCase(),'s'+k);const d=new Date();d.setDate(d.getDate()+1);d.setHours(10,0,0,0);crmTask({id:'a_'+c.id+'_recover_'+String(p.d||'').replace(/-/g,''),c:c.id,ty:'call',t:'Recover: other carrier options',due:d.getTime(),ow:c.owner,r:'recover'})}}
function crmPolicySweep(){if(!crmOn()||!CRM.ready||CRM.ro||typeof D==='undefined')return;const P=D.policies||[],sig=P.length+':'+P.map(p=>p.st[0]).join('');if(sig===CRM.psig)return;CRM.psig=sig;const now={};P.forEach(p=>now[crmPKey(p)]=p);
 if(!CRM.pst){CRM.pst={};Object.keys(now).forEach(k=>CRM.pst[k]=now[k].st);return}
 Object.keys(now).forEach(k=>{const p=now[k],was=CRM.pst[k];if(was!==undefined&&was!==p.st){const c=p.crmId!=null?crmGet(p.crmId):crmFindByName(p.cl);if(c){crmEv(c.id,'policy',{id:'p'+crmHash(k+'|'+p.st).toString(36),t:'Policy status: '+was+' \u2192 '+p.st,x:{st:p.st},noTouch:1});crmPolicyStage(c,p)}}CRM.pst[k]=p.st})}
/* ---------- boot ---------- */
async function crmBoot(){if(CRM.boot)return;CRM.boot=1;if(crmOffFlag()){CRM.on=0;return}CRM.on=1;
 try{if(typeof SUB!=='undefined'&&(!SUB['Clients']||SUB['Clients']==='Client Book'))SUB['Clients']='Today'}catch(e){}
 try{if(typeof NSUB!=='undefined')NSUB['Clients']=['Today','Pipeline','Client Book','Message Builder']}catch(e){}
 try{const _ap=globalThis.addP;if(typeof _ap==='function'&&!_ap.crm){const w=function(){const n=D.policies.length;const r=_ap.apply(this,arguments);try{if(D.policies.length>n)crmOnPolicy(D.policies[D.policies.length-1])}catch(e){}return r};w.crm=1;globalThis.addP=w}}catch(e){}
 let db=null;try{const c=globalThis.claude;if(c&&c.use)db=await c.use('db')}catch(e){db=null}
 if(db){CRM.live=1;CRM.db=db;try{const u=await globalThis.claude.use('user');if(u&&u.can){const w=await u.can('data.write');CRM.canW=w;if(w===false){CRM.ro=1;CRM.why='This account cannot save shared data.'}}}catch(e){}
  try{const q=JSON.parse(localStorage.getItem('owq_crm_q')||'[]');if(Array.isArray(q)&&q.length&&!CRM.ro)CRM.q=q.filter(x=>x&&x.p&&x.d)}catch(e){}}
 else{CRM.live=0;CRM.db=crmLocalDb()}
 crmSubscribe();setInterval(crmHourly,36e5)}
function crmAfterReady(){crmMigrate().then(n=>{if(n){try{if(typeof ONLINE!=='undefined'&&ONLINE)scanNow()}catch(e){}}});crmPolicySweep();if(CRM.q.length)crmPump();try{if(typeof ONLINE!=='undefined'&&ONLINE)scanNow()}catch(e){}}
function crmHourly(){crmSubE();crmPolicySweep()}
/* alerts hook (scan): deterministic keys so they never repeat */
function crmScan(){if(!crmOn()||!CRM.ready)return[];const out=[],now=Date.now(),wait=((CRM.cfg&&CRM.cfg.wait)||5)*6e4;
 crmVisible().forEach(c=>{if(c.stage==='new'&&!c.ft&&!c.dnc&&now-(c.rcv||c.at||now)>wait&&now-(c.rcv||c.at||now)<864e5&&(crmOwnerView()||c.owner===WHO))out.push({k:'crmw-'+c.id,sev:'warn',t:'New lead waiting',m:c.name+' has not been called yet ('+Math.round((now-(c.rcv||c.at))/6e4)+' min)',go:['Clients','',c.id]})});
 CRM.t.forEach(t=>{if(t.s==='o'&&t.ty==='appt'&&t.due>now&&t.due-now<=30*6e4){const c=crmGet(t.c);if(c&&(crmOwnerView()||c.owner===WHO))out.push({k:'crma-'+t.id,sev:'info',t:'Appointment in '+Math.max(1,Math.round((t.due-now)/6e4))+' min',m:c.name+(c.phone?' - '+c.phone:''),go:['Clients','',c.id]})}});
 return out.slice(0,6)}
if(!crmOffFlag()){try{const i=SYK.indexOf('clients');if(i>=0)SYK.splice(i,1)}catch(e){}}
setTimeout(crmBoot,0);
