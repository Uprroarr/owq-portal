// Pure-logic unit tests for the CRM (node vm). Run: node tests/unit.js
const fs=require('fs'),vm=require('vm'),path=require('path');
const SRC=path.join(__dirname,'..','src');
function sandbox(opts){opts=opts||{};const store={};const ls={get length(){return Object.keys(store).length},key:i=>Object.keys(store)[i],getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
 const ctx={console,setTimeout:(f,ms)=>setTimeout(f,0),clearTimeout,setInterval:()=>0,localStorage:ls,toast:()=>{},WHO:opts.who||'Agency Owner',D:{clients:opts.clients||[],policies:opts.policies||[],agents:[{name:'Austin Vardzel'},{name:'Nate Johnson'},{name:'Cole Leckey'}]},SYK:['policies','clients','agents'],SYB:{clients:6},
  synRec:j=>{try{const o=JSON.parse(j);return o&&!o._x?o:null}catch(e){return null}},esc:s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),save:()=>{},go:()=>{},Intl,Date:opts.Date||Date,Math,JSON,Map,Set,Object,Array,String,Number,RegExp,Promise,Error,isFinite,parseInt,parseFloat,encodeURIComponent,decodeURIComponent};
 ctx.globalThis=ctx;vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(path.join(SRC,'crm_data.js'),'utf8')+'\n;this.CRM=CRM;',ctx);
 vm.runInContext('var CRM_CSS="";var cid=null,tab="Clients",ONLINE=0;'+fs.readFileSync(path.join(SRC,'crm_ui.js'),'utf8'),ctx);
 ctx.$=n=>vm.runInContext(n,ctx);return ctx}
let pass=0,fail=0;const out=[];
function eq(name,got,exp){const g=JSON.stringify(got),e=JSON.stringify(exp);if(g===e){pass++}else{fail++;out.push('FAIL '+name+'\n   got '+g+'\n   exp '+e)}}
function ok(name,v){if(v){pass++}else{fail++;out.push('FAIL '+name)}}
(async()=>{
const X=sandbox();await new Promise(r=>setTimeout(r,20));
const NOW=new Date(2026,9,5,10,0,0).getTime();
// ---------- 1. quick-capture parser (24 messy inputs) ----------
const P=t=>{const o=X.crmParse(t,NOW);return o};
const pick=(o,ks)=>{const r={};ks.slice().sort().forEach(k=>{if(o[k]!==undefined)r[k]=o[k]});return r};
const srt=o=>{const r={};Object.keys(o).sort().forEach(k=>r[k]=o[k]);return r};
const K=['name','phone','phone2','email','age','dob','state','zip','prod','src','tobacco'];
const cases=[
 ['Mary Jones 412-555-0102 62 PA final expense facebook',{name:'Mary Jones',phone:'412-555-0102',age:'62',state:'PA',prod:'Final Expense',src:'Facebook Leads'}],
 ['robert miller (412) 555 0177 58yo ohio mortgage protection live transfer',{name:'Robert Miller',phone:'412-555-0177',age:'58',state:'OH',prod:'Mortgage Protection',src:'Live Transfers'}],
 ['Linda Brown, linda.brown@example.com, 71, FL, burial',{name:'Linda Brown',email:'linda.brown@example.com',age:'71',state:'FL',prod:'Final Expense'}],
 ['James Wilson dob 03/14/1961 4125550142 west virginia term',{name:'James Wilson',phone:'412-555-0142',dob:'1961-03-14',age:'65',state:'WV',prod:'Term'}],
 ['Patricia Davis 412.555.0199 / 412-555-0123 New York IUL referral',{name:'Patricia Davis',phone:'412-555-0199',phone2:'412-555-0123',state:'NY',prod:'IUL',src:'Referral'}],
 ['+1 412 555 0111 Karen White 66 tx annuity',{name:'Karen White',phone:'412-555-0111',age:'66',state:'TX',prod:'Annuity'}],
 ['Thomas Moore age: 49 North Carolina whole life direct mail',{name:'Thomas Moore',age:'49',state:'NC',prod:'Whole Life',src:'Direct Mail'}],
 ['Susan Clark 54 years old 15212 PA FE fb',{name:'Susan Clark',age:'54',zip:'15212',state:'PA',prod:'Final Expense',src:'Facebook Leads'}],
 ['Nancy Hall born 1958',{name:'Nancy Hall',age:'68'}],
 ['Charles King 1955-07-02 smoker aged lead',{name:'Charles King',dob:'1955-07-02',age:'71',src:'Aged Leads',tobacco:'Yes'}],
 ['412-555-0188',{phone:'412-555-0188'}],
 ['Betty Young',{name:'Betty Young'}],
 ['DANIEL SCOTT 412 555 0190 IN mp',{name:'Daniel Scott',phone:'412-555-0190',state:'IN',prod:'Mortgage Protection'}],
 ['mary-ann o\'brien 70 pa fe non-smoker',{name:"Mary-Ann O'Brien",age:'70',state:'PA',prod:'Final Expense',tobacco:'No'}],
 ['Lead: Joseph Adams, phone 412-555-0155, 61 y/o, Georgia, final expense',{name:'Joseph Adams',phone:'412-555-0155',age:'61',state:'GA',prod:'Final Expense'}],
 ['Anthony Green 2/9/64 Mich. term 412-555-0166',{name:'Anthony Green',phone:'412-555-0166',dob:'1964-02-09',age:'62',state:'MI',prod:'Term'}],
 ['Donna Baker 412-555-0170 in Ohio wants coverage for her husband',{name:'Donna Baker',phone:'412-555-0170',state:'OH'}],
 ['Mark Allen 52 OR term',{name:'Mark Allen',age:'52',state:'OR',prod:'Term'}],
 ['Carol Wright 412-555-0133 me',{name:'Carol Wright',phone:'412-555-0133'}],
 ['Steven Lewis 75 Pennsylvania FB lead 412-555-0101',{name:'Steven Lewis',age:'75',state:'PA',src:'Facebook Leads',phone:'412-555-0101'}],
 ['   ',{}],
 ['Ruth Walker 412-555-0122 412-555-0122 Florida',{name:'Ruth Walker',phone:'412-555-0122',state:'FL'}],
 ['Paul Hughes Jr 412-555-0144 68 SC',{name:'Paul Hughes Jr',phone:'412-555-0144',age:'68',state:'SC'}],
 ['sharon ross sharon.ross@example.com 4125550109',{name:'Sharon Ross',email:'sharon.ross@example.com',phone:'412-555-0109'}]];
cases.forEach(([t,exp],i)=>eq('parse#'+i+' '+t.slice(0,30),pick(P(t),K),srt(exp)));
ok('parse keeps leftover words as notes',/husband/.test(P('Donna Baker 412-555-0170 in Ohio wants coverage for her husband').notes||''));
// ---------- 2. CSV + mapping + dedupe ----------
const csv='Full Name,Phone,Age,State,Product,Lead Source,Notes\n"Jones, Mary",412-555-0102,62,PA,Final Expense,Facebook,"said ""call after 5"""\nRobert Miller,(412) 555-0177,58,Ohio,mortgage protection,live transfer,\n';
const rows=X.crmCsv(csv);eq('csv rows',rows.length,3);eq('csv quoted comma',rows[1][0],'Jones, Mary');eq('csv escaped quote',rows[1][6],'said "call after 5"');
const mp=X.crmMapCols(rows);eq('csv header map',[mp.head,mp.map.name,mp.map.phone,mp.map.age,mp.map.state,mp.map.prod,mp.map.src,mp.map.notes],[1,0,1,2,3,4,5,6]);
const leads=X.crmRowsToLeads(rows,mp);eq('csv leads',leads.map(l=>[l.name,l.phone,l.state,l.prod,l.src]),[['Jones, Mary','412-555-0102','PA','Final Expense','Facebook Leads'],['Robert Miller','412-555-0177','OH','Mortgage Protection','Live Transfers']]);
const tsv='First\tLast\tCell\tDOB\tST\nLinda\tBrown\t4125550150\t7/4/1955\tFL\n';const tr=X.crmCsv(tsv),tm=X.crmMapCols(tr),tl=X.crmRowsToLeads(tr,tm);eq('tsv first+last+dob',[tl[0].name,tl[0].phone,tl[0].dob,tl[0].state,tl[0].age],['Linda Brown','412-555-0150','1955-07-04','FL',String(X.crmAgeOf({dob:'1955-07-04'}))]);
const semi='Name;Email;Zip\nKaren White;karen.white@example.com;15212\n';const sr=X.crmCsv(semi);eq('semicolon csv',sr[1],['Karen White','karen.white@example.com','15212']);
const nh='Mary Jones,412-555-0102,62,PA\nRobert Miller,412-555-0177,58,OH\nLinda Brown,412-555-0150,71,FL\n';const nr=X.crmCsv(nh),nm=X.crmMapCols(nr);eq('headerless detection',[nm.head,nm.map.name,nm.map.phone,nm.map.age,nm.map.state],[0,0,1,2,3]);
const existing=[{id:1,name:'Mary Jones',phone:'412-555-0102',email:'',age:'62'},{id:2,name:'Tom Ford',phone:'',email:'tom.ford@example.com',age:'50'},{id:3,name:'Ann Lee',phone:'',email:'',age:'70'}];
const dd=X.crmDedupe([{name:'M. Jones',phone:'(412) 555-0102'},{name:'Thomas Ford',email:'TOM.FORD@example.com'},{name:'ann lee',age:'70'},{name:'New Person',phone:'412-555-0199'},{name:'New Person',phone:'412-555-0199'},{name:'Other',phone:'412-555-0100'}],existing);
eq('dedupe reasons',dd.map(r=>r.dup?r.dup.id+':'+r.why:r.why||'new'),['1:same phone','2:same email','3:same name and age','new','same phone (repeated in this list)','new']);
// ---------- 3. stage mapping legacy <-> new ----------
const ST=['Lead','Quoted','Applied','Client','Lost'],N2L=X.$('CRM_N2L'),L2N=X.$('CRM_L2N');X.$('CRM_ST').forEach(s=>ok('n2l '+s,ST.indexOf(N2L[s])>=0));ST.forEach(s=>eq('roundtrip '+s,N2L[L2N[s]],s));
// ---------- 4. migration: deterministic, idempotent, concurrent ----------
const legacy=[{id:7,ag:'Nate Johnson',name:'Grace Parker',phone:'412-555-0107',email:'grace.parker@example.com',age:'66',src:'Referral',st:'Quoted',fu:'2026-10-06',notes:[{at:'2026-09-20T15:00:00.000Z',ty:'Call',t:'Wants a quote for her and her husband.'},{at:'2026-09-22T15:00:00.000Z',ty:'Email',t:'Sent two quotes.'}],info:{dob:'1960-02-11',state:'PA',city:'Pittsburgh',bname:'Henry Parker'},mb:{pin:'4321'}},
 {id:8,ag:'Austin Vardzel',name:'Walter Ross',phone:'412-555-0108',st:'Lead',fu:'',notes:[]},{id:9,ag:'Austin Vardzel',name:'Doris Hayes',st:'Lost',fu:'2026-10-01',notes:[{at:'2026-09-01T12:00:00.000Z',ty:'Note',t:'Not interested.'}]}];
const p1=X.crmMigPlan(legacy,()=>false),p2=X.crmMigPlan(JSON.parse(JSON.stringify(legacy)),()=>false);
eq('migration deterministic (two browsers)',JSON.stringify(p1),JSON.stringify(p2));
eq('migration counts',[p1.contacts.length,p1.events.length,p1.tasks.length],[3,3,1]);
eq('migration stages',p1.contacts.map(c=>c.stage),['quoted','new','dead']);
eq('migration fields',[p1.contacts[0].dob,p1.contacts[0].state,p1.contacts[0].info.bname,p1.contacts[0].mb.pin,p1.contacts[0].owner],['1960-02-11','PA','Henry Parker','4321','Nate Johnson']);
eq('migration ids',[p1.events.map(e=>e.id),p1.tasks.map(t=>t.id)],[['l7_0','l7_1','l9_0'],['fu_7_20261006']]);
const have=new Set(p1.contacts.map(c=>c.id));eq('migration idempotent',X.crmMigPlan(legacy,id=>have.has(id)).contacts.length,0);
eq('migration skips deleted (tombstoned ids count as present)',X.crmMigPlan(legacy,id=>id===7).contacts.map(c=>c.id),[8,9]);
// executor: two concurrent runs against one local store -> identical docs
const Y=sandbox({clients:legacy});await new Promise(r=>setTimeout(r,30));await Y.crmFlush();
const S1=JSON.stringify(Object.keys(Y.CRM.db._S.docs).sort().map(k=>[k,Object.keys(Y.CRM.db._S.docs[k]).filter(x=>x[0]!=='_').sort()]));
Y.crmMigWrite(Y.crmMigPlan(legacy,()=>false));await Y.crmFlush();
const S2=JSON.stringify(Object.keys(Y.CRM.db._S.docs).sort().map(k=>[k,Object.keys(Y.CRM.db._S.docs[k]).filter(x=>x[0]!=='_').sort()]));
eq('migration concurrent re-run writes the same keys',S2,S1);eq('migration loaded contacts',Y.crmAll().length,3);
// ---------- 5. legacy shim shape ----------
const L=Y.crmLegacy();const g=L.find(c=>c.id===7);
eq('shim keys',Object.keys(g).filter(k=>k[0]!=='_').sort(),['ag','age','crm','email','fu','id','info','mb','name','notes','phone','src','st'].sort());
eq('shim values',[g.st,g.fu,g.ag,g.notes.length,g.notes[0].ty,g.info.state,g.mb.pin],['Quoted','2026-10-06','Nate Johnson',2,'Call','PA','4321']);
ok('shim st always legacy',L.every(c=>ST.indexOf(c.st)>=0));
Y.WHO='Austin Vardzel';Y.CRM.cache={};eq('shim agent sees own',Y.crmMy().map(c=>c.id).sort(),[8,9]);Y.WHO='Agency Owner';Y.CRM.cache={};eq('shim owner sees all',Y.crmMy().length,3);
Y.crmTask({c:7,ty:'call',t:'Earlier call',due:new Date(2026,9,5,9,0).getTime()});eq('shim fu = earliest open task',Y.crmLegacy().find(c=>c.id===7).fu,'2026-10-05');
// ---------- 6. merge semantics ----------
eq('merge nested',X.crmMerge({a:{x:1,y:2},b:[1,2],c:1},{a:{y:3,z:4},b:[9],c:null}),{a:{x:1,y:3,z:4},b:[9],c:null});
// ---------- 7. scoring / queue order ----------
const sod=X.crmSOD(NOW),mk=(o)=>Object.assign({id:Math.random(),name:'X',stage:'contacted',la:0,src:'',info:{}},o);
const sOver=X.crmScore(mk({}),{ty:'call',due:sod-2*864e5},NOW).s,sToday=X.crmScore(mk({}),{ty:'call',due:sod+15*36e5},NOW).s,sAppt=X.crmScore(mk({stage:'appt'}),{ty:'appt',due:NOW+36e5},NOW),sNew=X.crmScore(mk({stage:'new',ft:0,rcv:NOW-3*6e4,src:'Live Transfers'}),{ty:'call',due:NOW-3*6e4},NOW),sOld=X.crmScore(mk({stage:'new',ft:0,rcv:NOW-20*36e5}),null,NOW);
ok('overdue beats due later today',sOver>sToday);ok('appointment today outranks overdue',sAppt.s>sOver);eq('appointment why',sAppt.why,'Appointment today');ok('fresh live transfer is top',sNew.s>sAppt.s);ok('speed to lead decays',sNew.s>sOld.s);eq('fresh why',sNew.why,'New lead 3m');
const late=X.crmScore(mk({state:'CA'}),{ty:'call',due:sod-864e5},new Date(2026,9,5,6,30).getTime());const lateNY=X.crmScore(mk({state:'NY'}),{ty:'call',due:sod-864e5},new Date(2026,9,5,10,30).getTime());
const caHour=X.crmLocalHour('CA',new Date(2026,9,5,6,30).getTime());if(caHour&&(caHour.h<8||caHour.h>=21)){eq('outside calling hours why',late.why,'Outside calling hours')}else ok('calling window computed',!!caHour);
ok('dnc sinks',X.crmScore(mk({dnc:1}),{ty:'call',due:sod-864e5},NOW).s<0);
eq('due state',[X.crmDueState({due:sod-1},NOW),X.crmDueState({due:sod+11*36e5},NOW),X.crmDueState({due:sod+2*864e5},NOW)],['over','today','soon']);
eq('state codes',[X.crmStateCode('pennsylvania'),X.crmStateCode('pa'),X.crmStateCode('West Virginia'),X.crmStateCode('zz')],['PA','PA','WV','']);
// queue: dnc excluded, one row per contact, order by score
const Z=sandbox();await new Promise(r=>setTimeout(r,20));
const a=Z.crmCreate({name:'Fresh Lead',phone:'412-555-0101',src:'Live Transfers'}),b=Z.crmCreate({name:'Old Follow',phone:'412-555-0102'},{noTask:1}),c=Z.crmCreate({name:'Blocked',phone:'412-555-0103'});
Z.crmPut(b.id,{stage:'contacted',ft:Date.now()-5*864e5});Z.crmTask({c:b.id,ty:'call',due:Date.now()-3*864e5});Z.crmPut(c.id,{dnc:1});
const q=Z.crmQueue('Agency Owner');eq('queue rows',q.map(x=>x.c.name),['Fresh Lead','Old Follow']);
const k=Z.crmCounts('Agency Owner');eq('counts',[k.over,k.today,k.fresh],[1,0,1]);
// outcomes + done + undo
Z.crmOutcome(a.id,'na');let n=Z.crmNext(a.id);ok('no answer schedules the next attempt',n&&n.r==='next'&&n.due>Date.now());eq('attempt counted',Z.crmGet(a.id).la,1);
const tx=Z.crmTx(()=>Z.crmOutcome(a.id,'appt',{when:Date.now()+864e5}));eq('appointment moves stage',Z.crmGet(a.id).stage,'appt');ok('appointment task',Z.crmOpenTasks(a.id).some(t=>t.ty==='appt'));
tx.undo();Z.CRM.cache={};eq('undo restores stage',Z.crmGet(a.id).stage,'new');ok('undo cancels the appointment task',!Z.crmOpenTasks(a.id).some(t=>t.ty==='appt'));
const t0=Z.crmNext(b.id);const nt=Z.crmDone(t0.id);ok('done on an active lead schedules a sensible next touch',nt&&nt.c===b.id&&nt.s==='o');
// policy link + stage moves
Z.D.policies.push({d:'2026-10-05',cl:'old follow',car:'Americo',prod:'Final Expense',ap:1200,st:'Submitted'});Z.crmOnPolicy(Z.D.policies[0]);eq('policy linked by name',Z.D.policies[0].crmId,b.id);eq('submitted -> applied',Z.crmGet(b.id).stage,'applied');
Z.CRM.ready=1;Z.crmPolicySweep();Z.D.policies[0].st='Issued';Z.crmPolicySweep();eq('issued -> issued stage',Z.crmGet(b.id).stage,'issued');ok('delivery task created',Z.crmOpenTasks(b.id).some(t=>t.ty==='deliv'));
const evs1=Z.crmEvents(b.id).filter(e=>e.ty==='policy').length;Z.CRM.psig='';Z.crmPolicySweep();Z.crmOnPolicy(Z.D.policies[0]);await Z.crmFlush();Z.CRM.cache={};eq('policy events deterministic (no duplicates on re-run)',Z.crmEvents(b.id).filter(e=>e.ty==='policy').length,evs1);
// local adapter persistence: a fresh sandbox sharing nothing sees nothing; same store reload sees data
await Z.crmFlush();const keys=Object.keys(Z.CRM.db._S.docs);ok('local docs bucketed',keys.every(k=>/^crm(c\/(b\d\d|cfg)|t\/b\d\d|e\/\d{6}_\d\d)$/.test(k)));
ok('doc sizes under 256 KiB',keys.every(k=>JSON.stringify(Z.CRM.db._S.docs[k]).length<262144));
console.log(out.join('\n'));console.log(`unit: ${pass} passed, ${fail} failed`);process.exit(fail?1:0)})().catch(e=>{console.log('CRASH',e&&e.stack);process.exit(2)});
