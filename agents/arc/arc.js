/*ARCstart: desk arcade (first-person at your desk). Team high scores live in the shared 'arc' collection, one document per person per game.
  Two-player games: floor presence 'aq' holds each player's queue / match state; every match gets its own small room (arc-<match id>). */
const ARC={top:{},mine:{},boot:0,db:null};
async function arcBoot(){if(ARC.boot)return;ARC.boot=1;try{const c=globalThis.claude;if(!c||!c.use)return;const db=await c.use('db');if(!db)return;ARC.db=db;
  db.collection('arc').onSnapshot(s=>{const T={},M={};s.docs.forEach(d=>{const v=d.data()||{},g=String(v.g||''),nm=String(v.nm||'').slice(0,40),sc=Math.max(0,Math.round(+v.s||0));if(!/^[a-z]{2,12}$/.test(g)||!nm)return;(T[g]=T[g]||[]).push([nm,sc]);if(typeof WHO!=='undefined'&&nm===WHO)M[g]=Math.max(M[g]||0,sc)});
    Object.keys(T).forEach(g=>T[g].sort((a,b)=>b[1]-a[1]).splice(10));ARC.top=T;Object.keys(M).forEach(g=>{ARC.mine[g]=Math.max(ARC.mine[g]||0,M[g])})},()=>{})}catch(e){}}
function arcScore(g,s){g=String(g||'');s=Math.max(0,Math.round(+s||0));if(!/^[a-z]{2,12}$/.test(g)||!s||typeof WHO==='undefined')return;if(s<=(ARC.mine[g]||0))return;ARC.mine[g]=s;
  const T=ARC.top[g]=(ARC.top[g]||[]).filter(r=>r[0]!==WHO);T.push([WHO,s]);T.sort((a,b)=>b[1]-a[1]).splice(10);
  try{if(ARC.db)ARC.db.doc('arc/'+g+'_'+fileKey(WHO)).set({g,nm:WHO,s,at:Date.now()}).catch(()=>{})}catch(e){}}
function arcQClean(q){if(!q||typeof q!=='object'||!/^[a-z]{2,12}$/.test(String(q.g||''))||!/^(w|j|p)$/.test(String(q.st||'')))return null;const o={g:String(q.g),st:String(q.st),t:+q.t||0};if(q.to)o.to=String(q.to).slice(0,80);if(q.mid)o.mid=String(q.mid).replace(/[^a-z0-9]/g,'').slice(0,40);return o}
/* a small private room for one match: send() is throttled to about 11 updates a second, peer() returns the other player's latest state */
async function arcNet(mid){mid=String(mid||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,40);if(!mid||!VC.room||!VC.room.join)return null;let R=null;try{R=await VC.room.join('arc-'+mid)}catch(e){R=null}if(!R)return null;
  let last='',lastS=null,rt=0,seen=0,goneT=0,pend=null,pt=0,tm=0,alive=true;const other=()=>{try{return(R.peers()||[]).find(x=>!x.sameTab)||null}catch(e){return null}};
  const flush=()=>{tm=0;if(!alive||pend===null)return;const v=pend;pend=null;pt=performance.now();try{R.presence({s:v}).catch(()=>{})}catch(e){}};
  return{send(o){pend=o;const w=90-(performance.now()-pt);if(w<=0)flush();else if(!tm)tm=setTimeout(flush,w)},
    peer(){const p=other();if(!p)return null;seen=performance.now();const s=p.presence&&p.presence.s;let j='';try{j=s?JSON.stringify(s):''}catch(e){}if(j!==last){last=j;lastS=s||null;rt=performance.now()/1000}return{s:lastS,rt}},
    gone(){const p=other();if(p){goneT=0;const s=p.presence&&p.presence.s;return !!(s&&s.bye)}if(!seen)return false;if(!goneT)goneT=performance.now();return performance.now()-goneT>4000},
    now(){return performance.now()/1000},sync(){return(typeof ytNow==='function'?ytNow():Date.now())/1000},leave(){if(!alive)return;alive=false;clearTimeout(tm);try{R.leave()}catch(e){}}}}
(function(){const w=setInterval(()=>{if(typeof voApi==='undefined'||!voApi.people)return;clearInterval(w);arcBoot();
  voApi.arcTop=()=>ARC.top;voApi.arcMine=()=>ARC.mine;voApi.arcScore=(g,s)=>arcScore(g,s);
  voApi.arcade=function(st){try{if(VC.on&&VC.room)VC.room.presence({ar:st&&typeof st==='object'?Object.assign({g:String(st.g||'').slice(0,12),s:Math.max(0,Math.round(+st.s||0))},st.vs?{vs:String(st.vs).slice(0,40)}:{},st.q?{q:1}:{}):null}).catch(()=>{})}catch(e){}};
  voApi.arcQ=function(st){try{if(VC.on&&VC.room)VC.room.presence({aq:arcQClean(st)}).catch(()=>{})}catch(e){}};
  voApi.arcPeers=function(){const me=vcMe();return vcList().map(p=>{const x=p.presence||{};return{id:p.peer,nm:String(x.nm||'Guest').slice(0,40),me:p.peer===me,aq:arcQClean(x.aq)}})};
  voApi.arcNet=mid=>arcNet(mid);if(!voApi.now)voApi.now=()=>typeof ytNow==='function'?ytNow():Date.now();
  const _pp=voApi.people;voApi.people=function(){const L=_pp.apply(this,arguments)||[];try{const m={};vcList().forEach(p=>{m[p.peer]=p.presence||{}});L.forEach(o=>{const x=m[o.id];if(x&&x.ar&&typeof x.ar==='object')o.ar=x.ar;const q=x?arcQClean(x.aq):null;if(q)o.aq=q})}catch(e){}return L};
  const _lv=vcLeave;vcLeave=async function(){try{if(typeof VO3!=='undefined'&&VO3.arcadeOn&&VO3.arcadeOn())VO3.arcade()}catch(e){}try{if(VC.room)await VC.room.presence({ar:null,aq:null})}catch(e){}return _lv.apply(this,arguments)}},300)})();
/*ARCend*/
