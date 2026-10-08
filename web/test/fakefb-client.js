/* Page side of the Firebase stand-in: the same function names the real modular SDK exports, talking to fakefb-worker.js. */
(function(){
var W=window,sw=new SharedWorker('fakefb-worker.js'),port=sw.port,rq={},n=0,lis={},CLIENT='c'+Math.random().toString(36).slice(2,10);
port.onmessage=function(e){var m=e.data;if(m.rid!==undefined){var p=rq[m.rid];delete rq[m.rid];if(p)(m.err?p[1](m.err):p[0](m))}else if(m.ev){var l=lis[m.id];if(l)l(m)}};port.start();
function U(){var u=W.__FAKE_USER;if(u===undefined){try{u=JSON.parse(sessionStorage.getItem('fake_user')||'null')}catch(e){u=null}}return u||null}
function call(op,o){o=o||{};o.op=op;o.rid=++n;o.auth=U();o.client=CLIENT;return new Promise(function(ok,no){rq[o.rid]=[ok,no];port.postMessage(JSON.parse(JSON.stringify(o)))})}
function E(c){return Object.assign(new Error(c),{code:c})}
/* ---- app + auth ---- */
var app={initializeApp:function(cfg){return{cfg:cfg}}};
var authL=[],AUTH={currentUser:null};
function fire(){AUTH.currentUser=U();authL.slice().forEach(function(f){try{f(AUTH.currentUser)}catch(e){console.error(e)}})}
function GoogleAuthProvider(){}GoogleAuthProvider.prototype.setCustomParameters=function(){};
var auth={getAuth:function(){return AUTH},GoogleAuthProvider:GoogleAuthProvider,
 onAuthStateChanged:function(a,cb){authL.push(cb);setTimeout(function(){cb(U())},30);return function(){var i=authL.indexOf(cb);if(i>=0)authL.splice(i,1)}},
 signInWithPopup:function(){var u=W.__FAKE_SIGNIN||null;if(!u)return Promise.reject(E('auth/popup-closed-by-user'));try{sessionStorage.setItem('fake_user',JSON.stringify(u))}catch(e){}W.__FAKE_USER=u;setTimeout(fire,20);return Promise.resolve({user:u})},
 signInWithRedirect:function(){return Promise.reject(E('auth/operation-not-supported-in-this-environment'))},getRedirectResult:function(){return Promise.resolve(null)},
 sendSignInLinkToEmail:function(a,e,o){try{sessionStorage.setItem('fake_link_email',e);sessionStorage.setItem('fake_link_url',o&&o.url||'')}catch(x){}W.__FAKE_MAILED=e;return Promise.resolve()},
 isSignInWithEmailLink:function(a,href){return /[?&]oobCode=/.test(href)&&/[?&]mode=signIn/.test(href)},
 signInWithEmailLink:function(a,e,href){var want='';try{want=sessionStorage.getItem('fake_link_email')||''}catch(x){}if(!/[?&]oobCode=/.test(href))return Promise.reject(E('auth/invalid-action-code'));if(want&&want!==e)return Promise.reject(E('auth/invalid-email'));
  var u={uid:'u_'+e.replace(/[^a-z0-9]/g,''),email:e,displayName:''};try{sessionStorage.setItem('fake_user',JSON.stringify(u))}catch(x){}W.__FAKE_USER=u;setTimeout(fire,20);return Promise.resolve({user:u})},
 signOut:function(){try{sessionStorage.removeItem('fake_user')}catch(e){}W.__FAKE_USER=null;setTimeout(fire,10);return Promise.resolve()}};
/* ---- firestore ---- */
var FS={t:'fs'};
function last(p){var s=p.split('/');return s[s.length-1]}
function autoId(){var a='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',s='';for(var i=0;i<20;i++)s+=a[Math.floor(Math.random()*a.length)];return s}
function mkSnap(s){return{id:s.id,exists:function(){return!!s.exists},data:function(){return s.exists?s.data:undefined},metadata:{fromCache:false,hasPendingWrites:false}}}
function qOf(t){return t.t==='q'?{col:t.col,cons:t.cons}:{col:t.path,cons:[]}}
var fs={getFirestore:function(){return FS},
 doc:function(a,p){if(a.t==='fs'){var s=p.split('/');if(s.length%2)throw new Error('Invalid document reference '+p);return{t:'doc',path:p,id:last(p)}}var id=p===undefined?autoId():p;return{t:'doc',path:a.path+'/'+id,id:id}},
 collection:function(a,p){var path=a.t==='fs'?p:a.path+'/'+p;if(path.split('/').length%2===0)throw new Error('Invalid collection reference '+path);return{t:'col',path:path,id:last(path)}},
 getDoc:function(r){return call('getDoc',{path:r.path}).then(function(m){return mkSnap(m.snap)},function(e){throw E(e.code)})},
 setDoc:function(r,d){return call('setDoc',{path:r.path,data:d}).then(function(){},function(e){throw E(e.code)})},
 deleteDoc:function(r){return call('deleteDoc',{path:r.path}).then(function(){},function(e){throw E(e.code)})},
 query:function(c){var cons=Array.prototype.slice.call(arguments,1);return{t:'q',col:c.path,cons:cons}},
 where:function(f,op,v){return{t:'w',f:f,op:op,v:v}},orderBy:function(f,d){return{t:'o',f:f,d:d||'asc'}},limit:function(k){return{t:'l',n:k}},
 getDocs:function(q){return call('getDocs',{q:qOf(q)}).then(function(m){var d=m.docs.map(mkSnap);return{docs:d,size:d.length,empty:!d.length,metadata:{fromCache:false,hasPendingWrites:false},docChanges:function(){return[]}}},function(e){throw E(e.code)})},
 onSnapshot:function(t,next,error){var id='l'+(++n)+CLIENT;if(typeof next==='object'&&next&&!next.call){var o=next;next=o.next;error=o.error}
  lis[id]=function(m){if(m.ev==='snap')next(mkSnap(m.snap));else if(m.ev==='qsnap'){var d=m.docs.map(mkSnap),ch=m.changes.map(function(c){return{type:c.type,doc:mkSnap(c.doc),oldIndex:c.oldIndex,newIndex:c.newIndex}});next({docs:d,size:d.length,empty:!d.length,metadata:{fromCache:false,hasPendingWrites:false},docChanges:function(){return ch}})}};
  var p=t.t==='doc'?call('listenDoc',{id:id,path:t.path}):call('listenQ',{id:id,q:qOf(t)});
  p.then(function(m){if(m.err){delete lis[id];if(error)error(E(m.err.code))}},function(e){delete lis[id];if(error)error(E(e.code))});
  return function(){delete lis[id];call('unlisten',{id:id}).catch(function(){})}},
 runTransaction:function(f,fn){var w=[];var tx={get:function(r){return fs.getDoc(r)},set:function(r,d){w.push({path:r.path,data:d});return tx}};
  return Promise.resolve(fn(tx)).then(function(res){return(w.length?call('batch',{writes:w}):Promise.resolve()).then(function(){return res},function(e){throw E(e.code)})})},
 writeBatch:function(){var w=[];return{set:function(r,d){w.push({path:r.path,data:d})},delete:function(r){w.push({path:r.path,del:1})},commit:function(){return call('batch',{writes:w}).then(function(){},function(e){throw E(e.code)})}}}};
/* ---- realtime database ---- */
var RDB={t:'rdb'},pc=0;
function pushKey(){pc++;return Date.now().toString(36)+('000'+pc.toString(36)).slice(-4)+Math.random().toString(36).slice(2,6)}
function rref(path){path=String(path).replace(/^\/+|\/+$/g,'');return{t:'ref',path:path,key:last(path)}}
function rsnap(path,val,children){return{key:last(path),ref:rref(path),val:function(){return val===undefined?null:val},exists:function(){return val!=null},
 forEach:function(cb){var c=children||(val&&typeof val==='object'?Object.keys(val).sort().map(function(k){return{key:k,val:val[k]}}):[]);for(var i=0;i<c.length;i++){if(cb(rsnap(path+'/'+c[i].key,c[i].val))===true)return true}return false}}}
var db={getDatabase:function(){return RDB},ref:function(d,p){return rref(p||'')},
 set:function(r,v){return call('rtSet',{path:r.path,val:v===undefined?null:v}).then(function(){},function(e){throw E(e.code)})},
 update:function(r,v){return call('rtUpdate',{path:r.path,val:v}).then(function(){},function(e){throw E(e.code)})},
 remove:function(r){return call('rtSet',{path:r.path,val:null}).then(function(){},function(e){throw E(e.code)})},
 push:function(r){var k=pushKey();return rref(r.path+'/'+k)},
 query:function(r){var q={};Array.prototype.slice.call(arguments,1).forEach(function(c){Object.assign(q,c)});return{t:'rq',path:r.path,q:q}},
 orderByChild:function(f){return{oc:f}},startAt:function(v){return{sa:v}},endAt:function(v){return{ea:v}},
 serverTimestamp:function(){return{'.sv':'timestamp'}},
 onValue:function(t,cb,cancel){var path=t.path;if(path==='.info/connected'){setTimeout(function(){cb(rsnap(path,true))},10);return function(){}}if(path==='.info/serverTimeOffset'){setTimeout(function(){cb(rsnap(path,-(+W.__SKEW||0)))},10);return function(){}}
  var id='v'+(++n)+CLIENT;lis[id]=function(m){cb(rsnap(m.path,m.val))};call('rtListen',{id:id,kind:'val',path:path}).then(function(m){if(m.err&&cancel)cancel(E(m.err.code))});return function(){delete lis[id];call('unlisten',{id:id}).catch(function(){})}},
 onChildAdded:function(t,cb,cancel){var id='a'+(++n)+CLIENT;lis[id]=function(m){cb(rsnap(m.path,m.val))};call('rtListen',{id:id,kind:'cadd',path:t.path,q:t.q||null}).then(function(m){if(m.err&&cancel)cancel(E(m.err.code))});return function(){delete lis[id];call('unlisten',{id:id}).catch(function(){})}},
 get:function(t){return call('rtGet',{path:t.path,q:t.q||null}).then(function(m){return rsnap(t.path,m.val,m.children)},function(e){throw E(e.code)})},
 onDisconnect:function(r){return{remove:function(){return call('onDisc',{path:r.path,val:null})},set:function(v){return call('onDisc',{path:r.path,val:v})},cancel:function(){return call('onDisc',{path:r.path,cancel:1})}}}};
W.__OWQ_FB={app:app,auth:auth,fs:fs,db:db};
W.__FAKE={call:call,client:CLIENT,disconnect:function(){return call('disconnect',{})}};
W.addEventListener('pagehide',function(){try{port.postMessage({op:'disconnect',rid:-1,client:CLIENT,auth:U()})}catch(e){}});
})();
