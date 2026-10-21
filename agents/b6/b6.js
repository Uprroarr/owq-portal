/*B6start*/
/* v122: photoreal neon city on the login screen (replaces the globe), picked at random each login */
let CITYV=null,CITYT=0,CITYL=0;
function cityTier(){let g='auto',q='auto';try{g=localStorage.getItem('owq_gfx')||'auto';q=localStorage.getItem('owq_gq')||'auto'}catch(e){}
 if(q==='low'&&g==='auto')g='low';if(g==='low'||g==='medium'||g==='high')return g;
 const mob=(window.matchMedia&&matchMedia('(pointer:coarse)').matches)||Math.min(innerWidth,innerHeight)<700;
 const mem=navigator.deviceMemory||8,cpu=navigator.hardwareConcurrency||8;
 if(mob)return 'low';if(mem<=4||cpu<=4)return 'medium';return 'high'}
function cityStill(){let q='auto';try{q=localStorage.getItem('owq_gq')||'auto'}catch(e){}return !!((typeof RM!=='undefined'&&RM)||q==='still')}
function cityStop(){clearTimeout(CITYT);CITYL=0;if(CITYV){try{CITYV.stop()}catch(e){}CITYV=null}const t=document.getElementById('gxcity');if(t)t.remove();const h=document.getElementById('gx');if(h)h.classList.remove('cityon')}
function cityLeave(){if(!CITYV)return;CITYL=1;try{CITYV.leave()}catch(e){}clearTimeout(CITYT);CITYT=setTimeout(cityStop,1100)}
function cityGo(host){try{if(!host||typeof VO3==='undefined'||!VO3.cityMount)return false;
 if(CITYV&&!CITYL){clearTimeout(CITYT);return true}if(CITYV)cityStop();CITYL=0;
 const v=VO3.cityMount(host,{tier:cityTier(),still:cityStill()});if(!v)return false;CITYV=v;host.classList.add('cityon');
 const c=v.city,tg=document.createElement('div');tg.id='gxcity';tg.className='gxcity';tg.innerHTML='<b>'+esc(String(c.n).toUpperCase())+'</b><span>'+esc(String(c.c||'').toUpperCase())+' &middot; '+esc(c.ll||'')+'</span>';host.appendChild(tg);
 const cv=host.querySelector('canvas.owqcity');if(cv)cv.addEventListener('webglcontextlost',e=>{e.preventDefault();cityStop();host.classList.add('fb')},{once:true});
 return true}catch(e){console.error(e);cityStop();return false}}
(function(){const og=GXU.granted;GXU.granted=function(cb){cityLeave();return og.apply(this,arguments)}})();
/*B6end*/
