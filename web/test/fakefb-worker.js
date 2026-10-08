/* Test stand-in for Firebase (Firestore + Realtime Database + rules), shared by every page of one origin through a SharedWorker.
   Mirrors the security rules in web/rules: members/<email> admits a Google account; the owner email bootstraps itself. */
var DOCS=new Map();          /* path -> {data, v} */
var RT={};                   /* realtime tree */
var L=new Map();             /* listener id -> {port, kind, ...} */
var OWNER='owner@example.com';
var seq=0;
function now(){return Date.now()}
function parentOf(p){var s=p.split('/');s.pop();return s.join('/')}
function isMember(a){if(!a||!a.email)return false;var e=a.email.toLowerCase();return e===OWNER||DOCS.has('members/'+e)}
function role(a){if(!a||!a.email)return'';var e=a.email.toLowerCase();if(e===OWNER)return'owner';var d=DOCS.get('members/'+e);return d?(d.data.role||'member'):''}
function fsAllow(op,path,a){var s=path.split('/'),top=s[0];if(!a||!a.uid)return false;
 if(top==='requests'){var adm=role(a)==='owner'||role(a)==='admin';if(op==='read')return adm||s[1]===String(a.email||'').toLowerCase();return s[1]===String(a.email||'').toLowerCase()||adm}
 if(!isMember(a))return false;
 if(top==='members'||top==='cfg'){if(op==='read')return true;return role(a)==='owner'||(top==='members'&&role(a)==='admin')}
 if(top==='data'&&s[1]==='users')return s[2]===a.uid;
 return true}
function rtAllow(op,path,a){if(!a||!a.uid)return false;var s=path.split('/').filter(Boolean);var mk=String(a.email||'').toLowerCase().replace(/\./g,',');
 if(s[0]==='members'){if(op==='read')return true;return a.email&&a.email.toLowerCase()===OWNER||RT.members&&(RT.members[mk]==='owner'||RT.members[mk]==='admin')}
 if(s[0]==='rooms')return !!(RT.members&&RT.members[mk])||a.email.toLowerCase()===OWNER;
 return false}
function snapOf(path){var d=DOCS.get(path);return{path:path,id:path.split('/').pop(),exists:!!d,data:d?JSON.parse(JSON.stringify(d.data)):null}}
function cmp(a,b){if(a===b)return 0;if(a===undefined)return 1;if(b===undefined)return -1;return a<b?-1:1}
function evalQ(q){var out=[];DOCS.forEach(function(v,k){if(parentOf(k)===q.col)out.push({path:k,id:k.split('/').pop(),data:v.data})});
 (q.cons||[]).forEach(function(c){if(c.t!=='w')return;out=out.filter(function(d){var x=d.data[c.f],v=c.v;switch(c.op){case'==':return x===v;case'!=':return x!==v;case'<':return x<v;case'<=':return x<=v;case'>':return x>v;case'>=':return x>=v;case'in':return v.indexOf(x)>=0;case'not-in':return v.indexOf(x)<0;case'array-contains':return Array.isArray(x)&&x.indexOf(v)>=0}return false})});
 var o=(q.cons||[]).filter(function(c){return c.t==='o'})[0];
 if(o){out=out.filter(function(d){return d.data[o.f]!==undefined});out.sort(function(a,b){var r=cmp(a.data[o.f],b.data[o.f]);return o.d==='desc'?-r:r})}else out.sort(function(a,b){return a.id<b.id?-1:1});
 var l=(q.cons||[]).filter(function(c){return c.t==='l'})[0];if(l)out=out.slice(0,l.n);
 return out.map(function(d){return{path:d.path,id:d.id,exists:true,data:JSON.parse(JSON.stringify(d.data))}})}
function fsNotify(){L.forEach(function(x,id){if(x.kind==='doc'){var s=snapOf(x.path);var sig=JSON.stringify(s);if(sig===x.last)return;x.last=sig;x.port.postMessage({ev:'snap',id:id,snap:s})}
 else if(x.kind==='q'){var r=evalQ(x.q),sig=JSON.stringify(r);if(sig===x.last)return;var prev=x.prev||[],ch=[];
  var pm={};prev.forEach(function(d,i){pm[d.id]={d:d,i:i}});var nm={};r.forEach(function(d,i){nm[d.id]=i});
  r.forEach(function(d,i){var p=pm[d.id];if(!p)ch.push({type:'added',doc:d,oldIndex:-1,newIndex:i});else if(JSON.stringify(p.d.data)!==JSON.stringify(d.data)||p.i!==i)ch.push({type:'modified',doc:d,oldIndex:p.i,newIndex:i})});
  prev.forEach(function(d,i){if(nm[d.id]===undefined)ch.push({type:'removed',doc:d,oldIndex:i,newIndex:-1})});
  x.last=sig;x.prev=r;x.port.postMessage({ev:'qsnap',id:id,docs:r,changes:ch})}})}
function rtGet(path){var s=path.split('/').filter(Boolean),o=RT;for(var i=0;i<s.length;i++){if(o==null||typeof o!=='object')return null;o=o[s[i]]}return o===undefined?null:JSON.parse(JSON.stringify(o))}
function resolveSV(v){if(v&&typeof v==='object'){if(v['.sv']==='timestamp')return now();var o=Array.isArray(v)?[]:{};Object.keys(v).forEach(function(k){o[k]=resolveSV(v[k])});return o}return v}
function rtSet(path,val){var s=path.split('/').filter(Boolean);if(!s.length){RT=val||{};return}var o=RT;for(var i=0;i<s.length-1;i++){if(o[s[i]]==null||typeof o[s[i]]!=='object')o[s[i]]={};o=o[s[i]]}
 if(val===null||val===undefined)delete o[s[s.length-1]];else o[s[s.length-1]]=resolveSV(val);prune(RT)}
function prune(o){if(!o||typeof o!=='object')return;Object.keys(o).forEach(function(k){if(o[k]&&typeof o[k]==='object'){prune(o[k]);if(!Object.keys(o[k]).length)delete o[k]}})}
function qChildren(path,q){var v=rtGet(path)||{},a=[];Object.keys(v).forEach(function(k){var c=v[k];var key=q&&q.oc?(c&&typeof c==='object'?c[q.oc]:undefined):k;if(q&&q.sa!==undefined&&!(key>=q.sa))return;if(q&&q.ea!==undefined&&!(key<=q.ea))return;a.push({key:k,val:c,sk:key})});a.sort(function(x,y){return cmp(x.sk,y.sk)||cmp(x.key,y.key)});return a}
function rtNotify(){L.forEach(function(x,id){if(x.kind==='val'){var v=rtGet(x.path),sig=JSON.stringify(v);if(sig===x.last)return;x.last=sig;x.port.postMessage({ev:'val',id:id,path:x.path,val:v})}
 else if(x.kind==='cadd'){var ch=qChildren(x.path,x.q);ch.forEach(function(c){if(x.seen[c.key])return;x.seen[c.key]=1;x.port.postMessage({ev:'cadd',id:id,path:x.path+'/'+c.key,key:c.key,val:c.val})})}})}
var DISC=new Map();          /* client id -> [{path, op, val}] */
function handle(port,m){var a=m.auth,r={rid:m.rid};
 try{switch(m.op){
 case'getDoc':if(!fsAllow('read',m.path,a))throw{code:'permission-denied'};r.snap=snapOf(m.path);break;
 case'setDoc':if(!fsAllow('write',m.path,a))throw{code:'permission-denied'};DOCS.set(m.path,{data:m.data,v:++seq});fsNotify();break;
 case'deleteDoc':if(!fsAllow('write',m.path,a))throw{code:'permission-denied'};DOCS.delete(m.path);fsNotify();break;
 case'getDocs':if(!fsAllow('read',m.q.col+'/x',a))throw{code:'permission-denied'};r.docs=evalQ(m.q);break;
 case'batch':m.writes.forEach(function(w){if(!fsAllow('write',w.path,a))throw{code:'permission-denied'}});m.writes.forEach(function(w){if(w.del)DOCS.delete(w.path);else DOCS.set(w.path,{data:w.data,v:++seq})});fsNotify();break;
 case'listenDoc':if(!fsAllow('read',m.path,a)){r.err={code:'permission-denied'};break}L.set(m.id,{port:port,kind:'doc',path:m.path});setTimeout(fsNotify);break;
 case'listenQ':if(!fsAllow('read',m.q.col+'/x',a)){r.err={code:'permission-denied'};break}L.set(m.id,{port:port,kind:'q',q:m.q});setTimeout(fsNotify);break;
 case'unlisten':L.delete(m.id);break;
 case'rtSet':if(!rtAllow('write',m.path,a))throw{code:'PERMISSION_DENIED'};rtSet(m.path,m.val);rtNotify();break;
 case'rtUpdate':if(!rtAllow('write',m.path,a))throw{code:'PERMISSION_DENIED'};Object.keys(m.val).forEach(function(k){rtSet(m.path+'/'+k,m.val[k])});rtNotify();break;
 case'rtGet':if(!rtAllow('read',m.path,a))throw{code:'PERMISSION_DENIED'};r.children=m.q?qChildren(m.path,m.q):null;r.val=rtGet(m.path);break;
 case'rtListen':if(!rtAllow('read',m.path,a)){r.err={code:'PERMISSION_DENIED'};break}L.set(m.id,{port:port,kind:m.kind,path:m.path,q:m.q,seen:{}});if(m.kind==='cadd'){/* existing children matching the query are delivered too (Firebase does) */}setTimeout(rtNotify);break;
 case'onDisc':var arr=DISC.get(m.client)||[];arr=arr.filter(function(x){return x.path!==m.path});if(!m.cancel)arr.push({path:m.path,val:m.val===undefined?null:m.val});DISC.set(m.client,arr);break;
 case'disconnect':(DISC.get(m.client)||[]).forEach(function(x){rtSet(x.path,x.val)});DISC.delete(m.client);rtNotify();L.forEach(function(x,id){if(x.port===port)L.delete(id)});break;
 case'dump':r.docs=Array.from(DOCS.keys());r.rt=RT;r.lis=[];L.forEach(function(x,id){if(x.kind==='cadd')r.lis.push([id,x.path,Object.keys(x.seen).length,x.q])});break;
 case'reset':DOCS.clear();RT={};L.clear();DISC.clear();if(m.owner)OWNER=m.owner;break;
 case'seed':(m.docs||[]).forEach(function(d){DOCS.set(d.path,{data:d.data,v:++seq})});if(m.rt)RT=m.rt;fsNotify();rtNotify();break;
 }}catch(e){r.err={code:e&&e.code||'internal',message:String(e&&e.message||'')}}
 port.postMessage(r)}
onconnect=function(e){var port=e.ports[0];port.onmessage=function(ev){handle(port,ev.data)};port.start()};
