/*WRLDstart: walking, the Sky Deck circuit, the Sky Park ballpark (Home Run Derby), the Skyport (runway, hangar, landings),
  the Firing Range and its Laser Tag 1v1 arena.
  Everything rides on Sales Floor presence: wk = walking, fl = flying, hr = derby turn / queue, rg = range lane; laser tag
  matchmaking uses the arcade queue (aq) and each match runs in its own small room (arcNet).
  Team bests live in the shared 'arc' collection next to the desk arcade scores (games 'derby', 'longball', 'range', 'rings',
  'landing', 'lasertag'). */
(function(){const w=setInterval(()=>{if(typeof voApi==='undefined'||!voApi.people||typeof vcList!=='function')return;clearInterval(w);
  const num=(v,a,b)=>{v=+v;return isFinite(v)?Math.max(a,Math.min(b,v)):0};
  const small=o=>{if(!o||typeof o!=='object')return null;let j='';try{j=JSON.stringify(o)}catch(e){return null}return j.length<900?o:null};
  const clean={
    wk:o=>o&&typeof o==='object'&&/^[ogrd]$/.test(String(o.f))?{x:num(o.x,-4000,4000),y:num(o.y,-300,600),z:num(o.z,-4000,4000),h:num(o.h,-50,50),f:String(o.f),s:num(o.s,0,30),n:Math.round(num(o.n,0,1e6))}:null,
    fl:small,hr:small,rg:small};
  const put=(k,st)=>{try{if(VC.on&&VC.room)VC.room.presence({[k]:clean[k](st)}).catch(()=>{})}catch(e){}};
  voApi.walk=st=>put('wk',st);
  voApi.state=(k,st)=>{if(clean[k])put(k,st)};
  voApi.score=(g,s)=>{try{if(typeof arcScore==='function')arcScore(g,s)}catch(e){}};
  voApi.tops=()=>{try{return voApi.arcTop?voApi.arcTop():{}}catch(e){return{}}};
  const _pp=voApi.people;voApi.people=function(){const L=_pp.apply(this,arguments)||[];try{const m={};vcList().forEach(p=>{m[p.peer]=p.presence||{}});L.forEach(o=>{const x=m[o.id];if(!x)return;for(const k in clean){const v=clean[k](x[k]);if(v)o[k]=v}})}catch(e){}return L};
  const _lv=vcLeave;vcLeave=async function(){try{const O=typeof VO3!=='undefined'&&VO3.dbg&&VO3.dbg();if(O&&O.walk&&O.walk.me)O.walk.stop(1);if(O&&O.sys)O.sys.forEach(s=>{try{s.leave&&s.leave()}catch(e){}})}catch(e){}try{if(VC.room)await VC.room.presence({wk:null,fl:null,hr:null,rg:null})}catch(e){}return _lv.apply(this,arguments)};
},300)})();
/*WRLDend*/
