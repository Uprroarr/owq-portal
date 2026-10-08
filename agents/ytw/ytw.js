/*YTWstart: watch a YouTube link together on the Sales Floor TV.
  The person who pastes the link controls it (play, pause, skip, stop). Everyone's own browser plays the video from YouTube,
  kept in sync with the controller's clock, so nobody hears it twice: each person sets their own volume (Screen share audio,
  plus a slider per person in the volume mixer) and muting it never mutes anyone else. */
const YTW={api:0,apiP:null,P:{},draft:'',raf:0,tick:0,err:''};
const ytNow=()=>Date.now()+((typeof OWQC==='object'&&OWQC&&+OWQC.off)||0);
function ytParse(u){u=String(u||'').trim();if(!u)return null;let id='',t=0;
 if(/^[A-Za-z0-9_-]{11}$/.test(u))return{v:u,t:0};
 try{const x=new URL(/^https?:\/\//i.test(u)?u:'https://'+u);const h=x.hostname.replace(/^(www\.|m\.|music\.)/,'');
  if(h==='youtu.be')id=x.pathname.slice(1,12);
  else if(/(^|\.)youtube(-nocookie)?\.com$/.test(h)){id=x.searchParams.get('v')||'';const m=x.pathname.match(/^\/(shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/);if(m)id=m[2]}
  const ts=x.searchParams.get('t')||x.searchParams.get('start')||'';if(ts){const m=String(ts).match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);if(m)t=(+m[1]||0)*3600+(+m[2]||0)*60+(+m[3]||0)}}catch(e){return null}
 return /^[A-Za-z0-9_-]{11}$/.test(id)?{v:id,t}:null}
function ytLoad(){if(window.YT&&window.YT.Player){YTW.api=1;return Promise.resolve(1)}if(YTW.apiP)return YTW.apiP;
 YTW.apiP=new Promise(ok=>{const prev=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=function(){YTW.api=1;try{prev&&prev()}catch(e){}ok(1)};
  const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';s.async=true;s.onerror=()=>{YTW.apiP=null;ok(0)};document.head.appendChild(s);setTimeout(()=>ok(YTW.api?1:0),12000)});return YTW.apiP}
function ytOf(x){const y=x&&x.yt;if(!y||typeof y!=='object'||!/^[A-Za-z0-9_-]{11}$/.test(String(y.v||'')))return null;return{v:String(y.v),t0:+y.t0||0,at:Math.max(0,+y.at||0),pl:!!y.pl,nm:String(y.nm||'').slice(0,80)}}
function ytMine(){try{if(!VC.on||!VC.room)return null;const me=vcMe(),p=vcList().find(q=>q.peer===me);return p?ytOf(p.presence):null}catch(e){return null}}
function ytLive(){const out=[];try{if(!VC.on)return out;const me=vcMe();vcList().forEach(p=>{const y=ytOf(p.presence||{});if(y)out.push({peer:p.peer,me:p.peer===me,nm:String((p.presence||{}).nm||'Teammate').slice(0,40),y})})}catch(e){}return out}
function ytPos(y){return y.pl?Math.max(0,(ytNow()-y.t0)/1000):y.at}
function ytSet(y){if(!VC.on||!VC.room)return;VC.room.presence({yt:y}).catch(()=>{});setTimeout(ytSync,30)}
async function ytStart(u){const p=ytParse(u!==undefined?u:(document.getElementById('ytwu')||{}).value);
 if(!p){YTW.err='That does not look like a YouTube link. Paste the address of a YouTube video.';vcPaint();return}
 if(!VC.on){YTW.err='Walk onto the floor first.';vcPaint();return}
 YTW.err='';YTW.draft='';const ok=await ytLoad();if(!ok){YTW.err='YouTube could not load on this network.';vcPaint();return}
 ytSet({v:p.v,t0:ytNow()-p.t*1000,at:p.t,pl:1,nm:''});VOX.pop='';vcPaint();toast('Playing on the TV for everyone. Your volume only changes what you hear.',1)}
function ytCtl(k,d){const y=ytMine();if(!y)return;const pos=ytPos(y);
 if(k==='play'){if(y.pl)ytSet(Object.assign(y,{pl:0,at:pos}));else ytSet(Object.assign(y,{pl:1,t0:ytNow()-pos*1000}))}
 else if(k==='seek'){const P=YTW.P['yt:'+vcMe()],dur=P&&P.pl&&P.pl.getDuration?P.pl.getDuration()||0:0;let n=Math.max(0,pos+d);if(dur)n=Math.min(n,Math.max(0,dur-1));ytSet(y.pl?Object.assign(y,{t0:ytNow()-n*1000}):Object.assign(y,{at:n}))}
 else if(k==='restart')ytSet(Object.assign(y,{pl:1,t0:ytNow(),at:0}));
 else if(k==='stop'){if(VC.room)VC.room.presence({yt:null}).catch(()=>{});setTimeout(ytSync,30)}vcPaint()}
function ytFmt(s){s=Math.max(0,Math.floor(s||0));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return(h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0')}
// one hidden-until-needed player per person playing a video, laid over the TV (or the big theater view)
function ytMake(sid,o){const w=document.createElement('div');w.className='ytw';w.dataset.sid=sid;w.innerHTML='<div class=ytwv><div></div></div><span class=ytwgo>&#9654; Click the video to start it</span>';document.body.appendChild(w);
 const P={sid,peer:o.peer,v:o.y.v,w,pl:null,ready:0,bad:0,ask:0,since:Date.now()};YTW.P[sid]=P;
 
 try{P.pl=new YT.Player(w.firstChild.firstChild,{width:'100%',height:'100%',videoId:o.y.v,host:'https://www.youtube.com',
  playerVars:{autoplay:1,controls:0,disablekb:1,fs:0,iv_load_policy:3,modestbranding:1,rel:0,playsinline:1,start:Math.floor(ytPos(o.y)),origin:location.origin},
  events:{onReady:()=>{P.ready=1;try{P.pl.getIframe().tabIndex=-1}catch(e){}ytSync()},
   onStateChange:e=>{if(e.data===1){P.ask=0;P.ok=1;w.classList.remove('ask')}
    if(o.me){try{const t=(P.pl.getVideoData()||{}).title||'',y=ytMine();if(y&&t&&t!==y.nm)ytSet(Object.assign(y,{nm:t.slice(0,80)}))}catch(x){}
     if(e.data===0){const y=ytMine();if(y&&y.pl)ytSet(Object.assign(y,{pl:0,at:ytPos(y)}))}}},
   onError:e=>{P.bad=1;if(o.me){const c=+e.data;YTW.err=c===101||c===150?'That video does not allow playing outside YouTube. Try another one.':'YouTube could not play that video.';toast(YTW.err);ytCtl('stop')}}}})}catch(e){P.bad=1}
 return P}
function ytDrop(sid){const P=YTW.P[sid];if(!P)return;try{P.pl&&P.pl.destroy&&P.pl.destroy()}catch(e){}try{P.w.remove()}catch(e){}delete YTW.P[sid]}
function ytSync(){const L=ytLive(),want={};
 if(L.length&&!YTW.api){ytLoad().then(ok=>{if(ok)ytSync()});return}
 L.forEach(o=>{const sid='yt:'+o.peer;want[sid]=o;let P=YTW.P[sid];if(P&&P.v!==o.y.v){ytDrop(sid);P=null}if(!P)P=ytMake(sid,o);
  if(!P.ready||P.bad||!P.pl.getPlayerState)return;const st=P.pl.getPlayerState(),cur=P.pl.getCurrentTime()||0,dur=P.pl.getDuration()||0,mov=P.lc!==undefined&&cur-P.lc>.2;P.lc=cur;if(st===1||mov)P.ok=1;let pos=ytPos(o.y);if(dur&&pos>dur)pos=dur;
  if(o.y.pl&&!(dur&&pos>=dur-.5)){if(st!==1&&st!==3&&!mov){P.pl.playVideo();if(!P.ask&&!P.ok&&Date.now()-P.since>4000)P.ask=Date.now()}else P.ask=0;if(Math.abs(cur-pos)>2.2)P.pl.seekTo(pos,true)}
  else{if(st===1||st===3)P.pl.pauseVideo();if(Math.abs(cur-pos)>1.2)P.pl.seekTo(pos,true)}
  if(P.ok)P.ask=0;P.w.classList.toggle('ask',!!(P.ask&&o.y.pl));
  let vol=1;try{vol=SNDX&&SNDX.ssVol?SNDX.ssVol(o.me?'':o.nm):1}catch(e){}const v=Math.round(Math.max(0,Math.min(1,vol))*100);if(P.vol!==v){P.vol=v;try{if(v===0)P.pl.mute();else{P.pl.unMute();P.pl.setVolume(v)}}catch(e){}}});
 Object.keys(YTW.P).forEach(sid=>{if(!want[sid])ytDrop(sid)});
 const el=document.getElementById('ytwt'),y=ytMine();if(el&&y){const P=YTW.P['yt:'+vcMe()],d=P&&P.pl&&P.pl.getDuration?P.pl.getDuration()||0:0;el.textContent=(y.pl?'PLAYING':'PAUSED')+'  '+ytFmt(Math.min(ytPos(y),d||1e9))+(d?' / '+ytFmt(d):'')}
 const pb=document.getElementById('ytwpp');if(pb&&y)pb.textContent=y.pl?'Pause':'Play'}
function ytClip(){let e=document.getElementById('vofm');while(e&&e!==document.body){const cs=getComputedStyle(e);if(/(auto|scroll)/.test(cs.overflowY))return e.getBoundingClientRect();e=e.parentElement}return{left:0,top:0,right:innerWidth,bottom:innerHeight}}
// perspective map from the player's own box onto the four TV corners, so the video lies flat on the wall from any camera angle
const YTB=[960,540];
function ytHomo(q,ox,oy){const[W,H]=YTB,[x0,y0]=[q[0][0]-ox,q[0][1]-oy],[x1,y1]=[q[1][0]-ox,q[1][1]-oy],[x2,y2]=[q[2][0]-ox,q[2][1]-oy],[x3,y3]=[q[3][0]-ox,q[3][1]-oy];
 const dx1=x1-x2,dx2=x3-x2,dy1=y1-y2,dy2=y3-y2,sx=x0-x1+x2-x3,sy=y0-y1+y2-y3,den=dx1*dy2-dx2*dy1;let g=0,h=0;if(Math.abs(den)>1e-9){g=(sx*dy2-dx2*sy)/den;h=(dx1*sy-sx*dy1)/den}
 const a=x1-x0+g*x1,b=x3-x0+h*x3,d=y1-y0+g*y1,e=y3-y0+h*y3,n=v=>+v.toFixed(8);
 return`matrix3d(${n(a/W)},${n(d/W)},0,${n(g/W)},${n(b/H)},${n(e/H)},0,${n(h/H)},0,0,1,0,${n(x0)},${n(y0)},0,1)`}
// placed right after the floor renders each frame (no lag while the camera moves); a slow fallback hides it when the floor is not drawing
function ytFrame(){YTW.raf=requestAnimationFrame(ytFrame);if(!YTW.hook&&typeof VO3!=='undefined'&&VO3.onFrame){YTW.hook=1;VO3.onFrame(()=>{YTW.lastF=performance.now();ytPlace()})}if(YTW.lastF&&performance.now()-YTW.lastF<120)return;ytPlace()}
function ytPlace(){const ks=Object.keys(YTW.P);if(!ks.length)return;const C=ytClip();
 ks.forEach(sid=>{const P=YTW.P[sid];let r=null;try{r=typeof VO3!=='undefined'&&VO3.tvRect?VO3.tvRect(sid):null}catch(e){}const w=P.w,v=w.firstChild;
  if(!r||r.cover||r.w<8||r.h<8||document.hidden){if(!w.classList.contains('off')){w.classList.add('off')}return}
  const q=r.q||[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]];
  const c=r.clip||{x:r.x,y:r.y,w:r.w,h:r.h},L=Math.floor(Math.max(c.x,C.left,r.x)),T=Math.floor(Math.max(c.y,C.top,r.y)),R=Math.ceil(Math.min(c.x+c.w,C.right,r.x+r.w)),B=Math.ceil(Math.min(c.y+c.h,C.bottom,r.y+r.h));
  if(R-L<4||B-T<4){w.classList.add('off');return}
  w.classList.remove('off');w.classList.toggle('th',!!r.th);w.style.left=L+'px';w.style.top=T+'px';w.style.width=(R-L)+'px';w.style.height=(B-T)+'px';v.style.transform=ytHomo(q,L,T);
  // cut holes where the floor's own panels sit on top of the TV (dock, pop-ups, cards), so the video never covers them
  const H=[];if(!r.th)document.querySelectorAll('#vcp .vopn,#vcp .vod,.vo3card.on,.vo3look.on').forEach(e=>{const k=e.getBoundingClientRect();const a=Math.max(L,k.left),b=Math.max(T,k.top),c2=Math.min(R,k.right),d=Math.min(B,k.bottom);if(c2-a>1&&d-b>1)H.push([a,b,c2,d])});
  if(!H.length){w.style.clipPath='';return}
  const X=x=>(x-L).toFixed(1)+'px',Y=y=>(y-T).toFixed(1)+'px';
  let p=[`0px 0px`,`${X(R)} 0px`,`${X(R)} ${Y(B)}`,`0px ${Y(B)}`,`0px 0px`];
  H.forEach(([a,b,c2,d])=>{p.push(`${X(a)} ${Y(b)}`,`${X(a)} ${Y(d)}`,`${X(c2)} ${Y(d)}`,`${X(c2)} ${Y(b)}`,`${X(a)} ${Y(b)}`,`0px 0px`)});
  w.style.clipPath='polygon(evenodd,'+p.join(',')+')'})}
function voSharePanel(){const y=ytMine(),can=!!(vcMD()&&vcMD().getDisplayMedia);
 return`<div class="vopn ytwp"><h5>PUT SOMETHING ON THE TV</h5>
 ${y?`<div class=ytwnow><b>${esc(y.nm||'Your video')}</b><small id=ytwt>${y.pl?'PLAYING':'PAUSED'}</small></div>
  <div class=ytwc><button class=btn id=ytwpp onclick="ytCtl('play')">${y.pl?'Pause':'Play'}</button><button class="btn o" onclick="ytCtl('seek',-10)">&laquo; 10s</button><button class="btn o" onclick="ytCtl('seek',10)">10s &raquo;</button><button class="btn o" onclick="ytCtl('restart')">Restart</button><button class="btn o" onclick="ytCtl('stop')">Stop video</button></div>
  <p class=ytwh>Everyone's browser plays it from YouTube, in sync with you. Turn it down or mute it with <b>Screen share audio</b> in the volume mixer: that only changes what you hear.</p>`
 :`<label class=ytwl for=ytwu>YouTube link</label><div class=ytwi><input id=ytwu type=url inputmode=url autocomplete=off placeholder="https://www.youtube.com/watch?v=..." onkeydown="if(event.key==='Enter'){event.preventDefault();ytStart()}"><button class=btn onclick="ytStart()">&#9654; Play on TV</button></div>
  <p class=ytwh>Plays for everyone on the floor, synced. Each person hears their own copy, so you can mute it on your end without muting the floor.</p>`}
 ${YTW.err?`<p class=cherr>${esc(YTW.err)}</p>`:''}
 ${can?`<div class=ytwor><span>or</span></div><button class="btn${VC.scr?'':' o'} ytwsc" onclick="VOX.pop='';vcScr()">${VC.scr?'Stop sharing my screen':'Share my screen or a tab'}</button>`:''}</div>`}
// dock wiring
(function(){const w=setInterval(()=>{if(typeof voApi==='undefined'||typeof voDock!=='function')return;clearInterval(w);
 const _sc=voApi.screens,_vd=voApi.video;
 voApi.screens=function(){let a=[];try{a=_sc.apply(this,arguments)||[]}catch(e){}const L=ytLive().map(o=>({sid:'yt:'+o.peer,nm:o.me?'You':o.nm,me:o.me?1:0,yt:1,title:o.y.nm}));return L.concat(a)};
 voApi.video=function(sid){if(String(sid||'').indexOf('yt:')===0)return null;return _vd.apply(this,arguments)};
 const _pt=vcPaint;vcPaint=function(){const i=document.getElementById('ytwu'),v=i?i.value:'',f=i&&document.activeElement===i,ss=i?i.selectionStart:0;const r=_pt.apply(this,arguments);
  const j=document.getElementById('ytwu');if(j&&v&&j!==i){j.value=v;if(f){j.focus();try{j.setSelectionRange(ss,ss)}catch(e){}}}return r};
 const _lv=vcLeave;vcLeave=async function(){try{if(VC.room)await VC.room.presence({yt:null})}catch(e){}return _lv.apply(this,arguments)};
 setInterval(ytSync,700);ytFrame()},300)})();
addEventListener('blur',()=>setTimeout(()=>{const f=document.activeElement;if(!f||f.tagName!=='IFRAME')return;Object.values(YTW.P).forEach(P=>{if(P.w.contains(f)){P.ask=0;P.ok=1;P.w.classList.remove('ask');setTimeout(()=>{try{P.pl.playVideo()}catch(e){}},150)}})},0));
/*YTWend*/
