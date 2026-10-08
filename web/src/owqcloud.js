/*OWQCLOUDstart*/
/* OWQ Cloud: runs the portal as its own website. It provides the same `claude.use()` surface the portal was written for
   (db, room, user, downloads), backed by Firebase: Firestore = shared documents, Realtime Database = live room (presence,
   voice signalling), Firebase Auth (Google) = who you are. A sign-in gate admits only people the owner approved
   (Firestore `members/<email>`; security rules enforce it server-side). AI (`sample`) and connectors (`mcp`) are not
   available here (the portal hides those features). Config: window.OWQ_FIREBASE (public web config). */
(function(){
'use strict';
var W=window,CFG=W.OWQ_FIREBASE||null,VER='10.12.2',CDN='https://www.gstatic.com/firebasejs/'+VER+'/';
var ST={phase:'boot',user:null,uid:null,email:'',member:null,role:'',err:'',F:null,app:null,auth:null,fs:null,rdb:null,ready:false,waiters:[],peer:'',codes:null};
W.OWQC=ST;
function rid(n){var a='abcdefghijklmnopqrstuvwxyz0123456789',s='';var c=W.crypto&&W.crypto.getRandomValues?W.crypto.getRandomValues(new Uint8Array(n)):null;for(var i=0;i<n;i++)s+=a[(c?c[i]:Math.floor(Math.random()*256))%36];return s}
ST.peer=rid(16);
function ekey(e){return String(e||'').toLowerCase().replace(/\./g,',')}
function lc(e){return String(e||'').trim().toLowerCase()}
function esc(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

/* ---------------- loading Firebase ---------------- */
function loadSDK(){
 if(W.__OWQ_FB)return Promise.resolve(W.__OWQ_FB);   /* tests inject a stand-in with the same functions */
 return Promise.all([import(CDN+'firebase-app.js'),import(CDN+'firebase-auth.js'),import(CDN+'firebase-firestore.js'),import(CDN+'firebase-database.js')])
  .then(function(m){return{app:m[0],auth:m[1],fs:m[2],db:m[3]}})}

/* ---------------- db: Firestore with the portal's document semantics ---------------- */
var SEG=/^(?!\.\.?$)[A-Za-z0-9_\-.~:@+]{1,200}$/;
function segs(p){if(typeof p!=='string')throw new TypeError('db path must be a string');var s=p.split('/');if(!s.length||s.length>16||!s.every(function(x){return SEG.test(x)}))throw new TypeError('db path breaks the grammar: '+p);return s}
function isObj(v){return v!==null&&typeof v==='object'&&!Array.isArray(v)}
function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v))}
function deepMerge(a,b){var o=isObj(a)?clone(a):{};Object.keys(b).forEach(function(k){var v=b[k];if(v===undefined)return;if(isObj(v)&&isObj(o[k]))o[k]=deepMerge(o[k],v);else o[k]=clone(v)});return o}
var FNAME=/^[A-Za-z_$][A-Za-z0-9_$-]{0,120}$/;
function enc(body,prev){var o={__j:JSON.stringify(body)};Object.keys(body).forEach(function(k){if(k.slice(0,2)==='__'||!FNAME.test(k))return;var v=body[k],t=typeof v;
  if(v===null||t==='string'||t==='number'||t==='boolean'){if(t!=='number'||isFinite(v))o[k]=v}
  else if(Array.isArray(v)&&v.length<=100&&v.every(function(x){var u=typeof x;return x===null||u==='string'||u==='boolean'||(u==='number'&&isFinite(x))}))o[k]=v});
 if(prev&&prev.__lh!==undefined){o.__lh=prev.__lh;o.__le=prev.__le}return o}
function dec(raw){if(!raw)return undefined;if(typeof raw.__j==='string'){try{return JSON.parse(raw.__j)}catch(e){}}var o={};Object.keys(raw).forEach(function(k){if(k.slice(0,2)!=='__')o[k]=raw[k]});return o}
function chk(d){if(!isObj(d))throw{code:'invalid_argument',message:'a document body must be a plain object'};var n=JSON.stringify(d).length;if(n>262144)throw{code:'invalid_argument',message:'document over 256 KiB ('+n+' bytes)'}}
var EMAP={'permission-denied':'invalid_argument','invalid-argument':'invalid_argument','not-found':'invalid_argument','failed-precondition':'invalid_argument','out-of-range':'invalid_argument','already-exists':'invalid_argument','resource-exhausted':'resource_exhausted','unavailable':'unavailable','deadline-exceeded':'unavailable','aborted':'unavailable','cancelled':'unavailable','internal':'unavailable','unknown':'unavailable','data-loss':'unavailable','unauthenticated':'revoked'};
function derr(e){if(e&&typeof e.code==='string'&&e.code.indexOf('-')<0&&e.code.indexOf('/')<0&&EMAP[e.code]===undefined&&/^[a-z_]+$/.test(e.code))return{code:e.code,message:String(e.message||'')};
 var c=e&&e.code?String(e.code).replace(/^firestore\//,''):'';return{code:EMAP[c]||'unavailable',message:String(e&&e.message||e||'')}}
function meta(s){var m=s&&s.metadata||{};return{fromCache:!!m.fromCache,hasPendingWrites:!!m.hasPendingWrites}}
function missing(id){return{id:id,exists:false,data:function(){return undefined},metadata:{fromCache:false,hasPendingWrites:false}}}
function wrapDoc(s){var ex=typeof s.exists==='function'?s.exists():!!s.exists,body=ex?dec(s.data()):undefined;return{id:s.id,exists:ex,data:function(){return body},metadata:meta(s)}}
function mkDb(){
 var F=ST.F.fs,fs=ST.fs;
 function makeDocRef(r,path,id){return{id:id,path:path,
  get:function(){return F.getDoc(r).then(wrapDoc,function(e){if(e&&/permission-denied/.test(e.code||''))return missing(id);throw derr(e)})},
  set:function(d){try{chk(d)}catch(e){return Promise.reject(e)}return F.setDoc(r,enc(d)).then(function(){},function(e){throw derr(e)})},
  update:function(d){try{chk(d)}catch(e){return Promise.reject(e)}
   return F.runTransaction(fs,function(tx){return tx.get(r).then(function(s){var ex=typeof s.exists==='function'?s.exists():!!s.exists;if(!ex)throw{code:'invalid_argument',message:'update() needs an existing document: '+path};var raw=s.data(),nb=deepMerge(dec(raw),d);chk(nb);tx.set(r,enc(nb,raw))})}).then(function(){},function(e){throw derr(e)})},
  delete:function(){return F.deleteDoc(r).then(function(){},function(e){throw derr(e)})},
  acquire:function(o){o=o||{};var h=String(o.holder||''),ttl=Math.max(1000,Math.min(600000,+o.ttlMs||30000));
   return F.runTransaction(fs,function(tx){return tx.get(r).then(function(s){var ex=typeof s.exists==='function'?s.exists():!!s.exists,raw=ex?s.data():null,now=Date.now();
     if(raw&&raw.__lh&&raw.__lh!==h&&(+raw.__le||0)>now)return{acquired:false,expiresAt:new Date(+raw.__le).toISOString()};
     var body=ex?dec(raw):{};if(isObj(o.data))body=deepMerge(body,o.data);var e2=enc(body);e2.__lh=h;e2.__le=now+ttl;tx.set(r,e2);return{acquired:true,version:now,expiresAt:new Date(now+ttl).toISOString(),holder:h}})})
    .catch(function(e){throw derr(e)})},
  onSnapshot:function(next,error){var dead=false,u=null;try{u=F.onSnapshot(r,function(s){if(!dead)try{next(wrapDoc(s))}catch(x){setTimeout(function(){throw x})}},function(e){if(dead)return;dead=true;if(e&&/permission-denied/.test(e.code||'')){try{next(missing(id))}catch(x){}return}var ee=derr(e);if(error)try{error(ee)}catch(x){}else console.error('db listener',ee)})}catch(e){var ee=derr(e);setTimeout(function(){if(error)error(ee)})}
   return function(){dead=true;try{u&&u()}catch(e){}}},
  collection:function(sub){return cref(path+'/'+sub)}}}
 function dref(path){var s=segs(path);if(s.length%2)throw new TypeError('a document path needs an even number of segments ('+s.length+'): '+path);return makeDocRef(F.doc(fs,path),path,s[s.length-1])}
 function wrapQ(s,prevMap){var docs=s.docs.map(wrapDoc),ch=null;return{docs:docs,size:docs.length,empty:!docs.length,metadata:meta(s),
   docChanges:function(){if(ch)return ch;ch=(s.docChanges?s.docChanges():[]).map(function(c){return{type:c.type,doc:wrapDoc(c.doc),oldIndex:c.oldIndex,newIndex:c.newIndex}});return ch}}}
 function makeQuery(cpath,cons){
  function q(){var base=F.collection(fs,cpath);if(!cons.length)return base;return F.query.apply(null,[base].concat(cons.map(function(c){return c[0]==='w'?F.where(c[1],c[2],c[3]):c[0]==='o'?F.orderBy(c[1],c[2]==='desc'?'desc':'asc'):F.limit(c[1])})))}
  return{where:function(f,op,v){if(cons.filter(function(c){return c[0]==='w'}).length>=10)throw{code:'invalid_argument',message:'too many filters'};return makeQuery(cpath,cons.concat([['w',f,op,v]]))},
   orderBy:function(f,d){return makeQuery(cpath,cons.concat([['o',f,d]]))},
   limit:function(n){return makeQuery(cpath,cons.concat([['l',Math.max(1,Math.min(1000,n|0))]]))},
   get:function(){var qq;try{qq=q()}catch(e){return Promise.reject(derr(e))}return F.getDocs(qq).then(function(s){return wrapQ(s)},function(e){if(e&&/permission-denied/.test(e.code||''))return{docs:[],size:0,empty:true,metadata:{fromCache:false,hasPendingWrites:false},docChanges:function(){return[]}};throw derr(e)})},
   onSnapshot:function(next,error){var dead=false,u=null;try{u=F.onSnapshot(q(),function(s){if(!dead)try{next(wrapQ(s))}catch(x){setTimeout(function(){throw x})}},function(e){if(dead)return;dead=true;var ee=derr(e);if(error)try{error(ee)}catch(x){}else console.error('db listener',ee)})}catch(e){var ee=derr(e);setTimeout(function(){if(error)error(ee)})}
    return function(){dead=true;try{u&&u()}catch(e){}}}}}
 function cref(path){var s=segs(path);if(s.length%2===0)throw new TypeError('a collection path needs an odd number of segments ('+s.length+'): '+path);var q=makeQuery(path,[]);q.path=path;
  q.doc=function(id){if(id===undefined||id===null){var r=F.doc(F.collection(fs,path));return makeDocRef(r,path+'/'+r.id,r.id)}return dref(path+'/'+id)};
  q.add=function(d){var x=q.doc();return x.set(d).then(function(){return x})};return q}
 return Object.freeze({doc:dref,collection:cref})}

/* ---------------- room: Realtime Database presence + moments ---------------- */
var TOPIC=/^[a-z][a-z0-9_.-]{0,47}$/,RNAME=/^[a-z0-9][a-z0-9_.-]{0,47}$/;
function rtBlocked(e){if(ST.rtWarned)return;var c=String(e&&(e.code||e.message)||'');if(!/PERMISSION|permission/i.test(c))return;ST.rtWarned=1;ST.rtErr=c;
 var own=ST.role==='owner'||ST.role==='admin';
 var msg=own?'Live room is blocked: publish the Realtime Database rules in Firebase (Build > Realtime Database > Rules), then reload.':'You are not connected to the live room yet. Ask the owner to open Team Access once (it refreshes access), then reload.';
 try{toast(msg)}catch(x){}try{console.warn('OWQ live room:',c)}catch(x){}}
function mkRoomFactory(){
 var D=ST.F.db,rdb=ST.rdb,off=0,conn=false,connL=[],rooms={},offOk,offP=new Promise(function(ok){offOk=ok;setTimeout(ok,2500)});
 try{D.onValue(D.ref(rdb,'.info/serverTimeOffset'),function(s){off=+s.val()||0;ST.off=off;offOk()})}catch(e){offOk()}
 try{D.onValue(D.ref(rdb,'.info/connected'),function(s){var c=!!s.val();if(c===conn)return;conn=c;Object.keys(rooms).forEach(function(k){try{rooms[k]._conn(c)}catch(e){}});connL.slice().forEach(function(f){try{f(c)}catch(e){}})})}catch(e){}
 function now(){return Date.now()+off}
 function make(name){
  var base='rooms/'+(name||'_lobby'),me=ST.peer,uid=ST.uid,my={},pend=null,pt=0,alive=true;
  var peersArr=Object.freeze([]),map={},plist=[],tl={},cache={},changed={joined:[],left:[],updated:[]},raf=0,firstDone=false,unsubs=[];
  var pref=D.ref(rdb,base+'/p/'+me);
  function mkPeer(k,by,pr,o){var p={peer:k,by:by||null,isMe:!!uid&&by===uid,sameTab:k===me,kind:'viewer',guest:false,presence:Object.freeze(o&&typeof o==='object'&&!Array.isArray(o)?o:{}),updatedAt:Date.now()};Object.defineProperty(p,'__pr',{value:pr});return Object.freeze(p)}
  function selfPeer(){var pr=JSON.stringify(my);return mkPeer(me,uid,pr,clone(my)||{})}
  function writeP(){pend=null;pt=Date.now();if(!alive)return Promise.resolve();return D.set(pref,{by:uid,g:0,pr:JSON.stringify(my),at:D.serverTimestamp()}).then(function(){ST.rtOk=true},function(e){rtBlocked(e)})}
  function schedule(){if(!pend)pend=setTimeout(writeP,Math.max(0,90-(Date.now()-pt)))}
  function rebuild(val){var nm={},list=[],j=[],l=[],u=[];val=val||{};
   Object.keys(val).forEach(function(k){var v=val[k]||{},pr=typeof v.pr==='string'?v.pr:'{}',old=cache[k];
     if(old&&old.__pr===pr&&old.by===(v.by||null)){nm[k]=old}else{var o;try{o=JSON.parse(pr)}catch(e){o={}}var p=mkPeer(k,v.by,pr,o);nm[k]=p;if(old)u.push(p);else j.push(p)}
     list.push(nm[k])});
   if(!nm[me]){var sp=(cache[me]&&cache[me].__pr===JSON.stringify(my))?cache[me]:selfPeer();nm[me]=sp;list.push(sp);if(!cache[me])j.push(sp);else if(sp!==cache[me])u.push(sp)}
   Object.keys(cache).forEach(function(k){if(!nm[k])l.push(cache[k])});
   cache=nm;list.sort(function(a,b){return a.peer<b.peer?-1:1});peersArr=Object.freeze(list);
   changed.joined=changed.joined.concat(j);changed.left=changed.left.concat(l);changed.updated=changed.updated.concat(u);flush()}
  function flush(){if(raf)return;var f=(document.hidden||!W.requestAnimationFrame)?function(cb){return setTimeout(cb,40)}:W.requestAnimationFrame.bind(W);raf=f(function(){raf=0;if(!plist.length){changed={joined:[],left:[],updated:[]};return}
    var c={peers:peersArr,joined:Object.freeze(changed.joined.slice()),left:Object.freeze(changed.left.slice()),updated:Object.freeze(changed.updated.filter(function(p){return changed.joined.indexOf(p)<0}))};changed={joined:[],left:[],updated:[]};
    plist.slice().forEach(function(h){try{h(c)}catch(e){setTimeout(function(){throw e})}})})}
  var t0=now();
  var pu=D.onValue(D.ref(rdb,base+'/p'),function(s){rebuild(s.val())},function(){});unsubs.push(pu);
  offP.then(function(){if(!alive)return;t0=now();var eq=D.query(D.ref(rdb,base+'/e'),D.orderByChild('at'),D.startAt(t0-1500));
  var eu=D.onChildAdded(eq,function(s){var v=s.val()||{};if(!v.t||!tl[v.t])return;if((+v.at||0)<t0-1500)return;var data;try{data=v.d===undefined||v.d===''?undefined:JSON.parse(v.d)}catch(e){data=undefined}
    var m=Object.freeze({topic:v.t,data:data,peer:v.f||'',by:v.by||null,isMe:!!uid&&v.by===uid,sameTab:v.f===me,kind:'viewer',guest:false});
    tl[v.t].slice().forEach(function(h){try{h(m)}catch(e){setTimeout(function(){throw e})}})},function(){});unsubs.push(eu)});
  function attach(){try{D.onDisconnect(pref).remove()}catch(e){}return writeP()}
  attach();
  /* tidy: drop moments older than two minutes (everyone helps; cheap) */
  setTimeout(function(){try{var oq=D.query(D.ref(rdb,base+'/e'),D.orderByChild('at'),D.endAt(now()-120000));(D.get?D.get(oq):Promise.resolve(null)).then(function(s){if(!s||!s.forEach)return;s.forEach(function(c){try{D.remove(c.ref)}catch(e){}})}).catch(function(){})}catch(e){}},4000);
  var R={name:name||undefined,
   _conn:function(c){if(c&&alive)attach()},
   emit:function(topic,data){if(!alive)return Promise.reject({code:'invalid_argument',message:'room left'});if(!TOPIC.test(String(topic)))return Promise.reject({code:'invalid_argument',message:'bad topic'});
    var txt;try{txt=data===undefined?'':JSON.stringify(data)}catch(e){return Promise.reject({code:'invalid_argument',message:'data is not JSON'})}if(txt.length>60000){ST.bigEmit=(ST.bigEmit||0)+1;return Promise.reject({code:'invalid_argument',message:'data over 60 KB'})}ST.emitN=(ST.emitN||0)+1;
    var r=D.push(D.ref(rdb,base+'/e'));D.set(r,{t:topic,d:txt,f:me,by:uid,at:D.serverTimestamp()}).catch(function(){});setTimeout(function(){try{D.remove(r)}catch(e){}},30000);return Promise.resolve()},
   on:function(topic,h,onErr){if(typeof h!=='function')throw new TypeError('handler must be a function');if(!TOPIC.test(String(topic))){if(onErr)Promise.resolve().then(function(){onErr({code:'invalid_argument',message:'bad topic'})});return function(){}}
    (tl[topic]=tl[topic]||[]).push(h);return function(){var a=tl[topic]||[],i=a.indexOf(h);if(i>=0)a.splice(i,1)}},
   presence:function(patch){if(!isObj(patch))return Promise.reject({code:'invalid_argument',message:'presence patch must be an object'});var nx=clone(my)||{};Object.keys(patch).forEach(function(k){if(patch[k]===null)delete nx[k];else nx[k]=clone(patch[k])});
    if(JSON.stringify(nx).length>4096)return Promise.reject({code:'invalid_argument',message:'presence over 4 KiB'});my=nx;
    var v={};Object.keys(cache).forEach(function(k){if(k!==me){var p=cache[k];v[k]={by:p.by,pr:p.__pr}}});v[me]={by:uid,pr:JSON.stringify(my)};rebuild(v);schedule();return Promise.resolve()},
   peers:function(){return peersArr},
   onPeers:function(h,onErr){plist.push(h);Promise.resolve().then(function(){if(!firstDone){firstDone=true}var c={peers:peersArr,joined:peersArr,left:Object.freeze([]),updated:Object.freeze([])};try{h(c)}catch(e){setTimeout(function(){throw e})}});return function(){var i=plist.indexOf(h);if(i>=0)plist.splice(i,1)}},
   connected:function(){return conn},
   onConnection:function(h){connL.push(h);Promise.resolve().then(function(){try{h(conn)}catch(e){}});return function(){var i=connL.indexOf(h);if(i>=0)connL.splice(i,1)}},
   leave:function(){if(!alive)return Promise.resolve();alive=false;unsubs.forEach(function(u){try{u()}catch(e){}});tl={};plist=[];delete rooms[name];try{D.onDisconnect(pref).cancel()}catch(e){}return D.remove(pref).catch(function(){})},
   join:function(n){if(!RNAME.test(String(n)))return Promise.reject({code:'invalid_argument',message:'bad room name'});if(rooms[n])return Promise.resolve(rooms[n]);if(Object.keys(rooms).length>16)return Promise.reject({code:'limit_reached',message:'too many rooms'});rooms[n]=make(n);return Promise.resolve(rooms[n])},
   canSendToClaudeSession:function(){return Promise.resolve('off')},
   sendToClaudeSession:function(){return Promise.reject({code:'claude_unavailable',message:'not available on the website version'})}};
  rebuild({});rooms[name||'']=R;return R}
 return function(){return rooms['']||make('')}}

/* ---------------- call diagnostics (website version) ---------------- */
(function(){var N=W.RTCPeerConnection;if(!N||N.__owq)return;var sent=0;
 function diag(o){if(sent>=8||!ST.ready||!ST.F)return;sent++;try{var F=ST.F.fs;o.k='rtc';o.at=new Date().toISOString();o.who=String((typeof WHO!=='undefined'&&WHO)||'').slice(0,40);o.ua=String(navigator.userAgent||'').slice(0,120);o.emits=ST.emitN||0;o.big=ST.bigEmit||0;o.off=ST.off||0;
  F.setDoc(F.doc(F.collection(ST.fs,'diag')),enc(o)).catch(function(){})}catch(e){}}
 function P(cfg,more){var pc=more===undefined?new N(cfg):new N(cfg,more),info={t0:Date.now(),lc:{},rc:{},st:[]},done=0;
  pc.addEventListener('icecandidate',function(e){if(e.candidate){var ty=(/ typ (\w+)/.exec(e.candidate.candidate||'')||[])[1]||'?';info.lc[ty]=(info.lc[ty]||0)+1}});
  var oadd=pc.addIceCandidate;pc.addIceCandidate=function(c){try{var ty=(/ typ (\w+)/.exec(c&&c.candidate||'')||[])[1];if(ty)info.rc[ty]=(info.rc[ty]||0)+1}catch(e){}return oadd.apply(pc,arguments)};
  pc.addEventListener('connectionstatechange',function(){var st=pc.connectionState;info.st.push(st);if(!done&&(st==='connected'||st==='failed')){done=1;
    var sel=null;pc.getStats().then(function(r){r.forEach(function(x){if(x.type==='candidate-pair'&&(x.nominated||x.selected)&&x.state==='succeeded'){var l=r.get(x.localCandidateId),m=r.get(x.remoteCandidateId);sel=[l&&l.candidateType,m&&m.candidateType]}})}).catch(function(){}).then(function(){diag({state:st,ms:Date.now()-info.t0,lc:info.lc,rc:info.rc,steps:info.st.slice(0,12),pair:sel,ice:(cfg&&cfg.iceServers||[]).length})})}});
  return pc}
 P.prototype=N.prototype;P.__owq=1;try{P.generateCertificate=N.generateCertificate}catch(e){}W.RTCPeerConnection=P})();

/* ---------------- user, downloads ---------------- */
function mkUser(){var m=ST.member||{};return Object.freeze({
 id:function(){return Promise.resolve(ST.uid)},
 me:function(){return Promise.resolve({id:ST.uid,name:m.name||((ST.user&&ST.user.displayName)||''),guest:false})},
 profiles:function(ids){var o={};(ids||[]).forEach(function(i){o[i]={id:i,name:i===ST.uid?(m.name||''):'',guest:false}});return Promise.resolve(o)},
 isOwner:function(){return ST.role==='owner'},canEdit:function(){return ST.role==='owner'||ST.role==='admin'},
 can:function(n){return Promise.resolve(n==='data.write'?true:null)},search:function(){return Promise.resolve([])}})}
var DL=Object.freeze({save:function(o){o=o||{};var d=o.data,b=d instanceof Blob?d:new Blob([d==null?'':d],{type:o.type||'application/octet-stream'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=String(o.filename||'download');document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(u);a.remove()},4000);return Promise.resolve({saved:true})}});

/* ---------------- the claude.use() surface ---------------- */
var NS={};
function whenReady(){return ST.ready?Promise.resolve(true):new Promise(function(ok){ST.waiters.push(ok)})}
W.claude={use:function(name){name=String(name||'');return whenReady().then(function(ok){if(!ok)return null;
 if(name==='db')return NS.db||(NS.db=mkDb());
 if(name==='room')return NS.room||(NS.room=(NS.rf||(NS.rf=mkRoomFactory()))());
 if(name==='user')return NS.user||(NS.user=mkUser());
 if(name==='downloads')return DL;
 return null})}};

/* ---------------- sign-in gate ---------------- */
var CSS='#owqg{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 30%,#2a0a14ee,#07070bf2 60%);font-family:Verdana,"DejaVu Sans",sans-serif;color:#f4f4f6;transition:opacity .6s ease}'+
 '#owqg.out{opacity:0;pointer-events:none}#owqg .owqgc{width:min(420px,calc(100vw - 32px));padding:28px 26px 22px;border:1px solid #ff1f4f66;background:linear-gradient(160deg,#16161ff2,#0b0b10f7);box-shadow:0 0 60px #ff1f4f33,inset 0 0 40px #ff1f4f0d;clip-path:polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,18px 100%,0 calc(100% - 18px));text-align:center}'+
 '#owqg .owqgb{display:flex;align-items:center;justify-content:center;gap:10px;letter-spacing:3px;font-size:12px;font-weight:700}#owqg .owqgb i{width:14px;height:14px;border-radius:50%;background:#ff1f4f;box-shadow:0 0 14px #ff1f4f}#owqg .owqgb em{color:#ff1f4f;font-style:normal}'+
 '#owqg h1{margin:18px 0 6px;font-size:20px;letter-spacing:4px;font-weight:700}#owqg p{margin:8px 0;color:#9a9aa8;font-size:12.5px;line-height:1.55}#owqg p b{color:#f4f4f6}'+
 '#owqg .owqgbtn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;margin-top:16px;padding:13px 14px;border:0;background:#ff1f4f;color:#fff;font:700 12px Verdana,sans-serif;letter-spacing:2px;cursor:pointer;clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));min-height:44px}'+
 '#owqg .owqgbtn.o{background:transparent;border:1px solid #3a3a48;color:#c9c9d3;clip-path:none}#owqg .owqgbtn.o:hover{border-color:#ffcf40;color:#ffcf40}#owqg .owqgbtn:focus-visible{outline:2px solid #ffcf40;outline-offset:2px}#owqg .owqgbtn svg{width:18px;height:18px;background:#fff;border-radius:2px;padding:2px}'+
 '#owqg .owqgs{margin-top:14px;font-size:10px;letter-spacing:2px;color:#ffcf40}#owqg .owqge{color:#ff8fa8}#owqg .owqgl{display:inline-block;width:46px;height:46px;border:2px solid #ff1f4f33;border-top-color:#ff1f4f;border-radius:50%;animation:owqsp 1s linear infinite;margin:14px auto 4px}'+
 '#owqg .owqgor{display:flex;align-items:center;gap:10px;margin:16px 0 4px;color:#9a9aa8;font-size:9.5px;letter-spacing:2px}#owqg .owqgor::before,#owqg .owqgor::after{content:"";flex:1;height:1px;background:#2b2b36}'+
 '#owqg .owqgm{margin:6px 0 0}#owqg .owqgm input{width:100%;box-sizing:border-box;margin-top:8px;padding:12px;background:#0b0b10;border:1px solid #2b2b36;color:#f4f4f6;font:13px Verdana,sans-serif;min-height:44px}#owqg .owqgm input:focus{outline:2px solid #ffcf40;outline-offset:1px}#owqg .owqgm .owqgbtn{margin-top:8px}'+
 '@keyframes owqsp{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){#owqg .owqgl{animation:none}}'+
 '.owqta{position:fixed;left:12px;bottom:12px;z-index:2147482000;padding:7px 11px;border:1px solid #ffcf4066;background:#0b0b10e6;color:#ffcf40;font:700 9.5px Verdana,sans-serif;letter-spacing:2px;cursor:pointer;min-height:32px}.owqta:hover{background:#ffcf4014}'+
 '.owqtm .c{width:min(700px,calc(100vw - 32px))!important;max-width:none!important;max-height:86vh;overflow:auto}.owqtm table{width:100%;border-collapse:collapse;font-size:12px;margin:8px 0}.owqtm td,.owqtm th{padding:6px 6px;border-bottom:1px solid #2b2b36;text-align:left;vertical-align:middle}.owqtm th{font-size:9.5px;letter-spacing:1.5px;color:#9a9aa8;font-weight:600}'+
 '.owqtm .owqrow{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}.owqtm input,.owqtm select{background:#0b0b10;border:1px solid #2b2b36;color:#f4f4f6;padding:8px;font:12px Verdana,sans-serif;min-height:36px}.owqtm input{flex:1;min-width:160px}.owqtm h5{margin:18px 0 4px;font-size:10px;letter-spacing:2px;color:#ffcf40}.owqtm .mut{color:#9a9aa8;font-size:11.5px}';
var G=null;
function gate(){if(G)return G;var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);G=document.createElement('div');G.id='owqg';G.setAttribute('role','dialog');G.setAttribute('aria-modal','true');G.setAttribute('aria-label','Sign in');document.body.appendChild(G);
 /* nothing behind the gate reacts to keys until you are admitted */
 W.addEventListener('keydown',function(e){if(G&&!G.classList.contains('out')&&!(e.target&&e.target.closest&&e.target.closest('#owqg'))){e.stopImmediatePropagation()}},true);return G}
var GSVG='<svg viewBox="0 0 48 48" aria-hidden=true><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.8 6.1C6.6 42.6 14.6 48 24 48z"/></svg>';
function paint(){var g=gate(),h='<div class=owqgc><div class=owqgb><i></i>ONLY WINNERS <em>&amp;</em> QUITTERS</div>';
 if(ST.phase==='boot'||ST.phase==='checking')h+='<h1>SECURE LINK</h1><div class=owqgl aria-hidden=true></div><p>'+(ST.phase==='checking'?'Checking your access&hellip;':'Connecting to headquarters&hellip;')+'</p>';
 else if(ST.phase==='nocfg')h+='<h1>SETUP PENDING</h1><p>This website is not connected to its database yet. The owner adds the Firebase settings, then this page works.</p>';
 else if(ST.phase==='out')h+='<h1>SECURE SIGN-IN</h1><p>Sign in with the account your agency owner approved.</p><button class=owqgbtn id=owqgi onclick="OWQC.signIn()">'+GSVG+'SIGN IN WITH GOOGLE</button>'+'<div class=owqgor><span>OR</span></div>'+(ST.mailSent?'<p>Check <b>'+esc(ST.mailSent)+'</b> for a sign-in link (it can take a minute; look in Junk too). Open it on this device.</p><button class="owqgbtn o" onclick="OWQC.mailReset()">USE A DIFFERENT EMAIL</button>':'<form class=owqgm onsubmit="event.preventDefault();OWQC.mailLink()"><input id=owqgme type=email required autocomplete=email placeholder="your email (iCloud, Outlook, any)" aria-label="Email for a sign-in link"><button class="owqgbtn o" type=submit>EMAIL ME A SIGN-IN LINK</button></form>')+(ST.err?'<p class=owqge role=alert>'+esc(ST.err)+'</p>':'');
 else if(ST.phase==='mailask')h+='<h1>CONFIRM YOUR EMAIL</h1><p>Type the email address the sign-in link was sent to.</p><form class=owqgm onsubmit="event.preventDefault();OWQC.mailFinish(document.getElementById(\'owqgme\').value)"><input id=owqgme type=email required autocomplete=email aria-label=Email><button class=owqgbtn type=submit>SIGN IN</button></form>'+(ST.err?'<p class=owqge role=alert>'+esc(ST.err)+'</p>':'');
 else if(ST.phase==='pending')h+='<h1>ACCESS PENDING</h1><p>You are signed in as <b>'+esc(ST.email)+'</b>, but this account has not been approved yet.</p><p>'+(ST.reqd?'Request sent. The owner will see it in Team Access.':'Ask the agency owner to add you, or send a request:')+'</p>'+(ST.reqd?'':'<button class=owqgbtn id=owqgr onclick="OWQC.request()">REQUEST ACCESS</button>')+'<button class="owqgbtn o" onclick="OWQC.signOut()">USE ANOTHER ACCOUNT</button>'+(ST.err?'<p class=owqge role=alert>'+esc(ST.err)+'</p>':'');
 else if(ST.phase==='error')h+='<h1>CONNECTION PROBLEM</h1><p class=owqge role=alert>'+esc(ST.err||'Something went wrong.')+'</p><button class=owqgbtn onclick="location.reload()">TRY AGAIN</button>';
 h+='<div class=owqgs>'+(ST.phase==='out'?'ENCRYPTED &middot; APPROVED MEMBERS ONLY':'')+'</div></div>';g.innerHTML=h;
 var b=g.querySelector('.owqgbtn');if(b&&b.focus)try{b.focus({preventScroll:true})}catch(e){}}
function syncMembers(){if(!(ST.role==='owner'||ST.role==='admin'))return Promise.resolve();var F=ST.F.fs,D=ST.F.db;
 return F.getDocs(F.collection(ST.fs,'members')).then(function(s){return Promise.all(s.docs.map(function(d){var x=d.data()||{},r=x.role==='owner'?'owner':x.role==='admin'?'admin':'member';return D.set(D.ref(ST.rdb,'members/'+ekey(d.id)),r).catch(function(e){rtBlocked(e)})}))}).catch(function(){})}
ST.syncMembers=syncMembers;
function admit(){ST.ready=true;ST.phase='in';setTimeout(syncMembers,1200);var w=ST.waiters;ST.waiters=[];w.forEach(function(f){f(true)});if(G){G.classList.add('out');setTimeout(function(){if(G&&ST.phase==='in')G.style.display='none'},700)}teamBtn()}
function deny(){var w=ST.waiters;ST.waiters=[];w.forEach(function(f){f(false)})}

ST.signIn=function(){var A=ST.F.auth,p=new A.GoogleAuthProvider();try{p.setCustomParameters({prompt:'select_account'})}catch(e){}ST.err='';
 A.signInWithPopup(ST.auth,p).catch(function(e){var c=String(e&&e.code||'');if(/popup-blocked|operation-not-supported/.test(c)){return A.signInWithRedirect(ST.auth,p)}if(/popup-closed|cancelled-popup/.test(c))return;ST.err=c.indexOf('unauthorized-domain')>=0?'This web address is not authorized yet: add it in Firebase > Authentication > Settings > Authorized domains.':'Sign-in failed ('+c.replace('auth/','')+').';paint()})};
var MK='owq_mail_for_link';
ST.mailLink=function(){var A=ST.F.auth,i=document.getElementById('owqgme'),e=lc(i&&i.value);ST.err='';if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)){ST.err='Type a full email address.';paint();return}
 var url=location.href.split('#')[0].split('?')[0];
 A.sendSignInLinkToEmail(ST.auth,e,{url:url,handleCodeInApp:true}).then(function(){try{localStorage.setItem(MK,e)}catch(x){}ST.mailSent=e;paint()},function(x){var c=String(x&&x.code||'');ST.err=c.indexOf('operation-not-allowed')>=0?'Email sign-in links are not switched on yet: the owner enables them in Firebase > Authentication > Sign-in method > Email/Password > Email link.':'Could not send the link ('+c.replace('auth/','')+').';paint()})};
ST.mailReset=function(){ST.mailSent='';ST.err='';paint()};
ST.mailFinish=function(e){var A=ST.F.auth;e=lc(e);ST.err='';A.signInWithEmailLink(ST.auth,e,location.href).then(function(){try{localStorage.removeItem(MK)}catch(x){}try{history.replaceState(null,'',location.href.split('?')[0].split('#')[0])}catch(x){}},function(x){var c=String(x&&x.code||'');ST.err=c.indexOf('invalid-email')>=0?'That is not the email the link was sent to.':c.indexOf('expired')>=0||c.indexOf('invalid-action')>=0?'This sign-in link has expired or was already used. Ask for a new one.':'Sign-in failed ('+c.replace('auth/','')+').';ST.phase=c.indexOf('invalid-email')>=0?'mailask':'out';try{if(ST.phase==='out')history.replaceState(null,'',location.href.split('?')[0].split('#')[0])}catch(y){}paint()})};
ST.signOut=function(){ST.reqd=false;ST.err='';try{ST.F.auth.signOut(ST.auth)}catch(e){}};
ST.request=function(){var F=ST.F.fs;F.setDoc(F.doc(ST.fs,'requests/'+lc(ST.email)),{email:lc(ST.email),name:String(ST.user&&ST.user.displayName||'').slice(0,80),at:Date.now()}).then(function(){ST.reqd=true;paint()},function(e){ST.err='Could not send the request ('+String(e&&e.code||'error').replace('firestore/','')+').';paint()})};

function checkMember(u){var F=ST.F.fs,e=lc(u.email);ST.phase='checking';paint();
 return F.getDoc(F.doc(ST.fs,'members/'+e)).then(function(s){var ex=typeof s.exists==='function'?s.exists():!!s.exists;
   if(ex){var d=s.data()||{};return{name:String(d.name||''),role:String(d.role||'member')}}
   /* first sign-in of the owner: the security rules let only the owner create this record */
   return F.setDoc(F.doc(ST.fs,'members/'+e),{name:'Agency Owner',role:'owner',at:Date.now()}).then(function(){return{name:'Agency Owner',role:'owner'}},function(){return null})},
  function(err){if(/permission-denied/.test(String(err&&err.code||'')))return null;throw err})
 .then(function(m){if(!m)return null;var D=ST.F.db;
   /* the live room checks membership in the Realtime Database too; the owner keeps that list in step */
   if(m.role==='owner')return D.set(D.ref(ST.rdb,'members/'+ekey(e)),'owner').catch(function(){}).then(function(){return m});return m})}
function loadCodes(){var F=ST.F.fs;return F.getDoc(F.doc(ST.fs,'cfg/codes')).then(function(s){var ex=typeof s.exists==='function'?s.exists():!!s.exists;var b=ex?dec(s.data())||{}:{};var c=b.codes||{};ST.codes=c;
  try{if(typeof PWD==='object'&&PWD){Object.keys(PWD).forEach(function(k){delete PWD[k]});Object.keys(c).forEach(function(k){PWD[k]=String(c[k]).toLowerCase()})}}catch(e){}},function(){})}
var STUNS=[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302']},{urls:'stun:stun.cloudflare.com:3478'}];
function loadRtc(){try{if(typeof VCFG==='object'&&VCFG&&Array.isArray(VCFG.iceServers)){VCFG.iceServers.length=0;STUNS.forEach(function(x){VCFG.iceServers.push(x)})}}catch(e){}
 var F=ST.F.fs;return F.getDoc(F.doc(ST.fs,'cfg/rtc')).then(function(s){var ex=typeof s.exists==='function'?s.exists():!!s.exists;if(!ex)return;var b=dec(s.data())||{};
  ST.rtc=b;try{if(Array.isArray(b.iceServers)&&b.iceServers.length&&typeof VCFG==='object'){VCFG.iceServers.length=0;b.iceServers.forEach(function(x){VCFG.iceServers.push(x)})}}catch(e){}},function(){})}

function start(){
 if(!CFG||!CFG.apiKey||!CFG.projectId){ST.phase='nocfg';paint();deny();return}
 paint();
 loadSDK().then(function(F){ST.F=F;ST.app=F.app.initializeApp(CFG);ST.auth=F.auth.getAuth(ST.app);ST.fs=F.fs.getFirestore(ST.app);ST.rdb=CFG.databaseURL?F.db.getDatabase(ST.app,CFG.databaseURL):F.db.getDatabase(ST.app);
   try{if(F.auth.getRedirectResult)F.auth.getRedirectResult(ST.auth).catch(function(){})}catch(e){}
   try{if(F.auth.isSignInWithEmailLink&&F.auth.isSignInWithEmailLink(ST.auth,location.href)){ST.linkPending=true;var me='';try{me=localStorage.getItem(MK)||''}catch(e){}if(me)ST.mailFinish(me);else{ST.phase='mailask';paint()}}}catch(e){}
   F.auth.onAuthStateChanged(ST.auth,function(u){
    if(!u){if(ST.ready){location.reload();return}ST.user=null;ST.uid=null;if(ST.phase!=='mailask'&&!(ST.linkPending&&ST.phase==='checking'))ST.phase='out';if(ST.linkPending&&ST.phase!=='mailask')return;paint();return}
    ST.linkPending=false;
    if(ST.ready&&u.uid===ST.uid)return;
    ST.user=u;ST.uid=u.uid;ST.email=u.email||'';
    checkMember(u).then(function(m){if(!m){ST.phase='pending';paint();return}
      ST.member=m;ST.role=m.role;return Promise.all([loadCodes(),loadRtc()]).then(admit)})
    .catch(function(e){ST.phase='error';ST.err='Could not reach the database ('+String(e&&e.code||e&&e.message||'error').replace('firestore/','')+'). Check your connection and try again.';paint()})})})
 .catch(function(e){ST.phase='error';ST.err='Could not load the secure connection. Check your internet connection (and any blocker for gstatic.com), then try again.';paint()})}

/* ---------------- Team Access (owner / admin) ---------------- */
function teamBtn(){if(!(ST.role==='owner'||ST.role==='admin'))return;var b=document.getElementById('owqtab');if(b)b.hidden=false}
var TM={u1:null,u2:null,m:[],r:[]};
function roster(){var n=[];try{n=(D.agents||[]).map(function(a){return a.name})}catch(e){}if(n.indexOf('Agency Owner')<0)n.push('Agency Owner');return n}
function tmPaint(){var md=document.getElementById('md');if(!md||!md.querySelector('.owqtm'))return;var box=md.querySelector('#owqtmb');if(!box)return;var R=roster();
 var opts=function(sel){return R.map(function(n){return'<option'+(n===sel?' selected':'')+'>'+esc(n)+'</option>'}).join('')};
 var h='<h5>PEOPLE WITH ACCESS</h5><table><tr><th>GOOGLE ACCOUNT</th><th>PORTAL NAME</th><th>ROLE</th><th></th></tr>'+TM.m.map(function(m){return'<tr><td>'+esc(m.id)+'</td><td>'+esc(m.name||'')+'</td><td>'+esc(m.role||'member')+'</td><td>'+(m.role==='owner'?'':'<button class="btn o sm" onclick="OWQC.tmDel(\''+esc(m.id)+'\')">Remove</button>')+'</td></tr>'}).join('')+'</table>';
 if(TM.r.length)h+='<h5>WAITING FOR APPROVAL</h5><table>'+TM.r.map(function(r,i){return'<tr><td>'+esc(r.email)+'<br><small class=mut>'+esc(r.name||'')+'</small></td><td><select id=owqrn'+i+'>'+opts('')+'</select></td><td><button class="btn sm" onclick="OWQC.tmOk('+i+')">Approve</button> <button class="btn o sm" onclick="OWQC.tmNo('+i+')">Dismiss</button></td></tr>'}).join('')+'</table>';
 h+='<h5>ADD SOMEONE</h5><div class=owqrow><input id=owqae type=email placeholder="their email (Google, iCloud, any)" autocomplete=off><select id=owqan>'+opts('')+'</select><select id=owqar><option value=member>member</option><option value=admin>admin</option></select><button class="btn sm" onclick="OWQC.tmAdd()">Add</button></div><p class=mut id=owqtmmsg role=status></p>';
 h+='<h5>ACCESS CODES</h5><p class=mut>The code each person types after picking their name. Leave empty for no code.</p><div class=owqrow><select id=owqcn>'+opts('')+'</select><input id=owqcv type=text placeholder="new code" autocomplete=off><button class="btn o sm" onclick="OWQC.tmCode()">Save code</button></div>';
 var rl=ST.rtc&&ST.rtc.relayHost?ST.rtc.relayHost:'';
 h+='<h5>VOICE RELAY (TURN)</h5><p class=mut>For computers whose security software or network blocks direct calls. Paste the server and login from your relay provider (for example ExpressTURN, free plan).'+(rl?' <b>Active: '+esc(rl)+'</b>':' Not set up.')+'</p><div class=owqrow><input id=owqrh placeholder="server, e.g. relay1.expressturn.com:3478" autocomplete=off value="'+esc(rl)+'"><input id=owqru placeholder="username" autocomplete=off><input id=owqrp type=password placeholder="password" autocomplete=new-password><button class="btn sm" id=owqrs onclick="OWQC.tmRelay()">Save relay</button>'+(rl?'<button class="btn o sm" id=owqrx onclick="OWQC.tmRelay(1)">Remove relay</button>':'')+'</div><p class=mut id=owqrmsg role=status></p>';
 h+='<h5>DATA</h5><div class=owqrow><button class="btn o sm" onclick="OWQC.exportAll()">Export backup</button><label class="btn o sm" style="cursor:pointer">Import data<input type=file accept=".json,application/json" style="display:none" onchange="OWQC.importFile(this)"></label></div><p class=mut id=owqdmsg role=status></p>';
 box.innerHTML=h}
function tmMsg(t,id){var e=document.getElementById(id||'owqtmmsg');if(e)e.textContent=t}
ST.team=function(){if(!(ST.role==='owner'||ST.role==='admin')){try{toast('Team Access is for the agency owner.')}catch(e){}return}syncMembers();var md=document.getElementById('md');if(!md)return;md.innerHTML='<div class="mb owqtm" role=dialog aria-label="Team access"><div class=c><h4>Team Access</h4><p class=mut>Only people listed here can open the portal. They sign in with Google, or with a sign-in link sent to their email.</p><p class=mut style="font-size:11px;opacity:.75;margin-top:-4px">Site version '+esc(String(W.OWQ_BUILD||'dev'))+'</p><div id=owqtmb></div><div style="margin-top:14px"><button class="btn o" onclick="OWQC.teamClose()">Close</button></div></div></div>';
 var F=ST.F.fs;if(!TM.u1)TM.u1=F.onSnapshot(F.collection(ST.fs,'members'),function(s){TM.m=s.docs.map(function(d){var x=d.data()||{};return{id:d.id,name:x.name,role:x.role}}).sort(function(a,b){return(a.role==='owner'?-1:0)-(b.role==='owner'?-1:0)||a.id.localeCompare(b.id)});tmPaint()},function(){});
 if(!TM.u2)TM.u2=F.onSnapshot(F.collection(ST.fs,'requests'),function(s){TM.r=s.docs.map(function(d){var x=d.data()||{};return{email:d.id,name:x.name}});tmPaint()},function(){});tmPaint()};
ST.teamClose=function(){try{TM.u1&&TM.u1();TM.u2&&TM.u2()}catch(e){}TM.u1=TM.u2=null;try{closeM()}catch(e){var md=document.getElementById('md');if(md)md.innerHTML=''}};
function putMember(email,name,role){var F=ST.F.fs,D=ST.F.db;email=lc(email);if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return Promise.reject({message:'That does not look like an email address.'});
 return F.setDoc(F.doc(ST.fs,'members/'+email),{name:name,role:role==='admin'?'admin':'member',at:Date.now()}).then(function(){return D.set(D.ref(ST.rdb,'members/'+ekey(email)),role==='admin'?'admin':'member')}).then(function(){return F.deleteDoc(F.doc(ST.fs,'requests/'+email)).catch(function(){})})}
ST.tmAdd=function(){var e=document.getElementById('owqae'),n=document.getElementById('owqan'),r=document.getElementById('owqar');putMember(e.value,n.value,r.value).then(function(){tmMsg('Added. They can sign in now.');e.value=''},function(x){tmMsg('Could not add: '+(x&&x.message||x&&x.code||'error'))})};
ST.tmOk=function(i){var r=TM.r[i],s=document.getElementById('owqrn'+i);if(!r)return;putMember(r.email,s?s.value:'',"member").then(function(){tmMsg('Approved '+r.email+'.')},function(x){tmMsg('Could not approve: '+(x&&x.message||'error'))})};
ST.tmNo=function(i){var r=TM.r[i];if(!r)return;var F=ST.F.fs;F.deleteDoc(F.doc(ST.fs,'requests/'+r.email)).catch(function(){})};
ST.tmDel=function(email){if(!confirm('Remove '+email+'? They will be signed out of the portal.'))return;var F=ST.F.fs,D=ST.F.db;F.deleteDoc(F.doc(ST.fs,'members/'+email)).then(function(){return D.remove(D.ref(ST.rdb,'members/'+ekey(email)))}).then(function(){tmMsg('Removed '+email+'.')},function(x){tmMsg('Could not remove: '+(x&&x.code||'error'))})};
ST.tmCode=function(){var n=document.getElementById('owqcn').value,v=String(document.getElementById('owqcv').value||'').trim().toLowerCase(),c=Object.assign({},ST.codes||{});if(v)c[n]=v;else delete c[n];
 var F=ST.F.fs;F.setDoc(F.doc(ST.fs,'cfg/codes'),enc({codes:c})).then(function(){ST.codes=c;try{Object.keys(PWD).forEach(function(k){delete PWD[k]});Object.keys(c).forEach(function(k){PWD[k]=c[k]})}catch(e){}document.getElementById('owqcv').value='';tmMsg(v?'Code saved for '+n+'.':'Code removed for '+n+'.')},function(x){tmMsg('Could not save the code ('+(x&&x.code||'error')+').')})};
/* data: one JSON file {owq:1, docs:[{path, body}]}; paths use the portal's own document paths */
var COLS=['rec','chat','files','mr','mrm','mrcfg','crmc','crme','crmt'];
ST.tmRelay=function(del){if(!(ST.role==='owner'||ST.role==='admin'))return;var F=ST.F.fs;
 if(del){F.deleteDoc(F.doc(ST.fs,'cfg/rtc')).then(function(){ST.rtc=null;loadRtc();tmPaint();tmMsg('Relay removed. Everyone uses direct calls again after a reload.','owqrmsg')},function(e){tmMsg('Could not remove it: '+(e&&e.code||e),'owqrmsg')});return}
 var raw=String((document.getElementById('owqrh')||{}).value||'').trim(),u=String((document.getElementById('owqru')||{}).value||'').trim(),pw=String((document.getElementById('owqrp')||{}).value||'');
 var m=/^(?:turns?:)?([A-Za-z0-9.-]+)(?::(\d{2,5}))?/.exec(raw.replace(/\?.*$/,''));if(!m){tmMsg('Enter the relay server name, for example relay1.expressturn.com:3478.','owqrmsg');return}if(!u||!pw){tmMsg('Enter the relay username and password.','owqrmsg');return}
 var host=m[1],port=m[2]||'3478',urls=['turn:'+host+':'+port+'?transport=udp','turn:'+host+':'+port+'?transport=tcp','turn:'+host+':443?transport=tcp','turns:'+host+':443?transport=tcp'];
 var body={iceServers:STUNS.concat([{urls:urls,username:u,credential:pw}]),relayHost:host+':'+port,at:Date.now()};
 F.setDoc(F.doc(ST.fs,'cfg/rtc'),enc(body)).then(function(){ST.rtc=body;loadRtc();tmPaint();tmMsg('Relay saved. People who reload the portal now use it when a direct call is blocked.','owqrmsg')},function(e){tmMsg('Could not save it: '+(e&&e.code||e),'owqrmsg')})};
ST.exportAll=function(){var F=ST.F.fs,out=[];tmMsg('Exporting...','owqdmsg');
 Promise.all(COLS.map(function(c){return F.getDocs(F.collection(ST.fs,c)).then(function(s){s.docs.forEach(function(d){out.push({path:c+'/'+d.id,body:dec(d.data())})})},function(){})})).then(function(){
  var b=new Blob([JSON.stringify({owq:1,at:new Date().toISOString(),docs:out})],{type:'application/json'});DL.save({filename:'owq-backup-'+new Date().toISOString().slice(0,10)+'.json',data:b});tmMsg('Backup downloaded ('+out.length+' records).','owqdmsg')})};
ST.importFile=function(inp){var f=inp.files&&inp.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(){var j;try{j=JSON.parse(rd.result)}catch(e){tmMsg('That file is not a portal backup.','owqdmsg');return}
  if(!j||j.owq!==1||!Array.isArray(j.docs)){tmMsg('That file is not a portal backup.','owqdmsg');return}
  if(!confirm('Import '+j.docs.length+' records into the shared database? Existing records with the same id are replaced.'))return;ST.importDocs(j)};rd.readAsText(f);inp.value=''};
ST.importDocs=function(j){var F=ST.F.fs,docs=j.docs.filter(function(d){try{var s=segs(d.path);return s.length%2===0&&isObj(d.body)}catch(e){return false}}),i=0,ok=0,bad=0;
 function step(){if(i>=docs.length){var tail=Promise.resolve();if(j.codes&&isObj(j.codes))tail=F.setDoc(F.doc(ST.fs,'cfg/codes'),enc({codes:j.codes})).then(function(){ST.codes=j.codes;try{Object.keys(PWD).forEach(function(k){delete PWD[k]});Object.keys(j.codes).forEach(function(k){PWD[k]=String(j.codes[k]).toLowerCase()})}catch(e){}},function(){bad++});
   return tail.then(function(){tmMsg('Imported '+ok+' records'+(bad?', '+bad+' failed':'')+'. Reloading...','owqdmsg');setTimeout(function(){location.reload()},1500)})}
  var b=F.writeBatch(ST.fs),n=0;while(i<docs.length&&n<300){var d=docs[i++];try{chk(d.body);b.set(F.doc(ST.fs,d.path),enc(d.body));n++}catch(e){bad++}}
  return b.commit().then(function(){ok+=n;tmMsg('Importing... '+ok+' of '+docs.length,'owqdmsg')},function(){bad+=n}).then(step)}
 return step()};

/* ---------------- go ---------------- */
function boot(){try{start()}catch(e){ST.phase='error';ST.err=String(e&&e.message||e);paint();deny()}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
W.OWQC.__t={enc:enc,dec:dec,deepMerge:deepMerge,segs:segs,derr:derr};
})();
/*OWQCLOUDend*/
