/*CRFXstart: crate openings show above your head on the Sales Floor for everyone (presence lc). */
function voCrate(info){try{if(typeof VC==='undefined'||!VC.on||!VC.room||!info)return;const at=typeof ytNow==='function'?ytNow():Date.now();
  VC.room.presence({lc:{n:at,r:String(info.r||'').slice(0,40),lb:String(info.lb||'').slice(0,40),c:/^#[0-9a-f]{6}$/i.test(String(info.c||''))?info.c:'#ff1f4f',d:Math.max(1,Math.min(12,+info.d||3)),big:info.big?1:0,at}}).catch(()=>{})}catch(e){}}
(function(){const w=setInterval(()=>{if(typeof voApi==='undefined'||!voApi.people)return;clearInterval(w);
  voApi.now=()=>typeof ytNow==='function'?ytNow():Date.now();
  const _pp=voApi.people;voApi.people=function(){const L=_pp.apply(this,arguments)||[];try{const m={};vcList().forEach(p=>{m[p.peer]=p.presence||{}});L.forEach(o=>{const x=m[o.id];if(x&&x.lc&&typeof x.lc==='object')o.lc=x.lc})}catch(e){}return L};
  if(typeof bxOpen==='function'){const _bo=bxOpen;bxOpen=function(i){try{const car=bxCar(WHO,i),r=BXCRR[car-1];voCrate({r:bxCarN(car),lb:String(r||'')+' car crate',c:BXRC[r],d:5.6,big:car>=7})}catch(e){}return _bo.apply(this,arguments)}}},300)})();
/*CRFXend*/
