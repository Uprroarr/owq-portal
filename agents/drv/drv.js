/*DRVstart: drive your loot-crate car around the Sales Floor and out to the OWQ Speedway. Position rides on presence (dv). */
function voDrive(){VOX.pop='';try{if(typeof VO3!=='undefined'&&VO3.drive)VO3.drive()}catch(e){}setTimeout(vcPaint,60)}
(function(){const w=setInterval(()=>{if(typeof voApi==='undefined'||!voApi.people)return;clearInterval(w);
 const _pp=voApi.people;voApi.people=function(){const L=_pp.apply(this,arguments)||[];try{const m={};vcList().forEach(p=>{m[p.peer]=p.presence||{}});L.forEach(o=>{const x=m[o.id];if(x&&x.dv&&typeof x.dv==='object')o.dv=x.dv})}catch(e){}return L};
 voApi.drive=function(st){try{if(VC.on&&VC.room)VC.room.presence({dv:st&&typeof st==='object'?st:null}).catch(()=>{})}catch(e){}};
 const _lv=vcLeave;vcLeave=async function(){try{if(typeof VO3!=='undefined'&&VO3.driving&&VO3.driving())VO3.drive()}catch(e){}try{if(VC.room)await VC.room.presence({dv:null})}catch(e){}return _lv.apply(this,arguments)};
 setInterval(()=>{try{const c=typeof VO3!=='undefined'&&VO3.canDrive?(VO3.canDrive()?1:0)+(VO3.driving()?2:0):0;if(c!==window.__drvS){window.__drvS=c;vcPaint()}}catch(e){}},1000)},300)})();
/*DRVend*/
