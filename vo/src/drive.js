// Drive your loot-crate car around the Sales Floor. You steer your own car (keys or the on-screen pad, chase camera);
// everyone else sees it move through presence (dv: x, z, heading, speed, car, horn count), smoothed on their side.
import * as THREE from 'three';
import {buildCar} from './cosm.js';
import {SEATS} from './layout.js';
import {damp,clamp} from './util.js';
import {TY,TRK,DOOR,trackHit} from './track.js';

const S=.7;                       // cars are scaled down to fit between the desks
const VMAX=7.5,VMAXT=19,VREV=3,R=.45;
const BOX=[];                     // obstacles: [x0,z0,x1,z1]
SEATS.forEach(s=>{BOX.push([s.x-.97,s.z-.43,s.x+.97,s.z+.43]);BOX.push([s.x-.34,s.cz-.32,s.x+.34,s.cz+.32])});
BOX.push([-4.3,-7,2.4,-6.4],[-9,-7,-5.3,-6.45],[3.6,-7,6.4,-6.45],[6.0,-6.6,6.8,-5.8],[7.0,-7,9,-6.7],[-8.75,1.5,-7.95,2.3],[-5.4,4.3,-4.6,5.1],[4.6,4.35,5.5,5.25],[-8.75,-2.7,-7.95,-1.9],[-8.75,-6.7,-7.8,-5.8]);
const XB=[-8.75,8.75],ZB=[-6.35,5.3];
const CSS=`.vo3drv{position:absolute;inset:0;pointer-events:none;z-index:5;display:none}.vo3drv.on{display:block}
.vo3drh{position:absolute;top:62px;left:50%;transform:translateX(-50%);padding:7px 14px;border-radius:999px;background:rgba(12,6,12,.72);border:1px solid rgba(255,255,255,.14);font:700 10px Verdana,sans-serif;letter-spacing:.1em;color:#ffd0da;white-space:nowrap;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.vo3drh b{color:#fff}.vo3drs{position:absolute;top:96px;left:50%;transform:translateX(-50%);font:900 22px Verdana,sans-serif;color:#fff;text-shadow:0 2px 12px rgba(255,31,79,.8)}.vo3drs small{font-size:10px;letter-spacing:.14em;color:#ffb3c2;margin-left:4px}
.vo3drp{position:absolute;bottom:92px;display:flex;gap:10px;pointer-events:auto}.vo3drp.l{left:16px}.vo3drp.r{right:16px;flex-direction:column}
.vo3drp button{width:62px;height:62px;border-radius:18px;border:1px solid rgba(255,255,255,.18);background:rgba(12,6,12,.7);color:#fff;font:800 18px Verdana,sans-serif;touch-action:none;-webkit-user-select:none;user-select:none;cursor:pointer;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.vo3drp button.on{background:#ff1f4f;border-color:#ff1f4f}.vo3drp .r button,.vo3drp.r button{font-size:11px;letter-spacing:.06em}.vo3drp .g{color:#eafff4;font-weight:900;height:78px;background:rgba(61,220,151,.22)}.vo3drp .g.on{background:#3ddc97}
.vo3drx{position:absolute;top:58px;right:14px;pointer-events:auto;padding:9px 14px;border-radius:12px;border:0;background:#ff1f4f;color:#fff;font:800 11px Verdana,sans-serif;letter-spacing:.1em;cursor:pointer}
.vo3drl{position:absolute;top:142px;left:50%;transform:translateX(-50%);font:800 12px Verdana,sans-serif;letter-spacing:.1em;color:#ffd166;text-shadow:0 2px 10px #000;white-space:nowrap}
.vo3drf{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .35s;pointer-events:none}.vo3drf.on{opacity:1}
.vo3drk{position:absolute;bottom:92px;left:50%;transform:translateX(-50%);pointer-events:auto;padding:9px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(12,6,12,.7);color:#ffd166;font:800 12px Verdana,sans-serif;letter-spacing:.08em;cursor:pointer}`;
function hits(x,z,k){if(k)return trackHit(x,z,R);const door=z>DOOR.z0+R*.6&&z<DOOR.z1-R*.6;if((x<XB[0]+R&&!(door&&x>-11))||x>XB[1]-R||z<ZB[0]+R||z>ZB[1]-R)return true;
  for(const b of BOX){const cx=clamp(x,b[0],b[2]),cz=clamp(z,b[1],b[3]);if((x-cx)*(x-cx)+(z-cz)*(z-cz)<R*R)return true}return false}
// the car is two circles along its length
function carHits(x,z,h,L,k){const c=Math.cos(h),s=-Math.sin(h),o=Math.max(.2,L*S*.32);return hits(x+c*o,z+s*o,k)||hits(x-c*o,z-s*o,k)}
const LAPK='owq_bestlap';function best0(){try{return +localStorage.getItem(LAPK)||0}catch(e){return 0}}
export class Drive{
  constructor(O){this.O=O;this.keys={};this.me=null;this.sendT=0;this.last='';this.hn=0;
    if(!document.getElementById('vo3drcss')){const st=document.createElement('style');st.id='vo3drcss';st.textContent=CSS;document.head.appendChild(st)}
    const u=this.ui=document.createElement('div');u.className='vo3drv';
    u.innerHTML=`<div class=vo3drh><b>DRIVING</b> &nbsp;W A S D / arrows &middot; SPACE brake &middot; H horn &middot; E get out</div><div class=vo3drs><span>0</span><small>MPH</small></div><div class=vo3drl></div><div class=vo3drf></div>
      <div class="vo3drp l"><button data-k=left aria-label="Steer left">&#9664;</button><button data-k=right aria-label="Steer right">&#9654;</button></div>
      <div class="vo3drp r"><button class=g data-k=up aria-label="Gas">GAS</button><button data-k=down aria-label="Brake / reverse">BRAKE</button></div>
      <button class=vo3drk data-k=horn>&#128227; HORN</button><button class=vo3drx>GET OUT</button>`;
    O.el.appendChild(u);this.spd=u.querySelector('.vo3drs span');this.lapE=u.querySelector('.vo3drl');this.fade=u.querySelector('.vo3drf');this.best=best0();this.board={};
    u.querySelectorAll('.vo3drp button').forEach(b=>{const k=b.dataset.k,on=e=>{e.preventDefault();this.keys[k]=1;b.classList.add('on')},off=e=>{this.keys[k]=0;b.classList.remove('on')};
      b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off)});
    u.querySelector('[data-k=horn]').onclick=e=>{e.stopPropagation();this.horn()};u.querySelector('.vo3drx').onclick=e=>{e.stopPropagation();this.stop()};
    const map={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',' ':'brake'};
    const typing=e=>{const t=e.target;return t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable)};
    addEventListener('keydown',e=>{if(!this.me||typing(e))return;const k=map[e.key];if(k){this.keys[k]=1;e.preventDefault();e.stopPropagation();return}
      if(e.key==='h'||e.key==='H'){this.horn();e.preventDefault()}else if(e.key==='e'||e.key==='E'||e.key==='Escape'){this.stop();e.preventDefault()}},true);
    addEventListener('keyup',e=>{const k=map[e.key];if(k)this.keys[k]=0},true);
    addEventListener('blur',()=>{this.keys={}})}
  can(a){return !!(a&&a.me&&a.look&&a.look.W>0&&a.mode==='seated'&&!this.O.busy(a)&&!a.leaving&&a.root.visible&&!a.drv)}
  // put someone in their car (me: start driving from the aisle by my desk)
  mount(a,c,x,z,h){const car=buildCar(c);if(!car)return null;car.scale.setScalar(S);car.position.set(x,0,z);car.rotation.y=h;this.O.room.group.add(car);this.O.warm(car);
    const L=(car.userData.len||3.4);const d={car,c,x,z,h,v:0,st:0,L,tx:x,tz:z,th:h,tv:0,rt:performance.now(),hn:0,k:0,lap:null};a.drv=d;
    a.mode='drive';a.emo=null;a.idleK=null;a.typing=false;a.sitK=1;a.standK=0;a.path=null;a.root.scale.setScalar(.55);this.place(a);this.O.fx.sparkle(x,.6,z,30,[1,.85,.4]);this.O.sfx('vroom');return d}
  place(a){const d=a.drv,c=Math.cos(d.h),s=-Math.sin(d.h),off=-.08*d.L*S;const y=d.k?TY:0;a.root.position.set(d.x+c*off,y+.06,d.z+s*off);a.root.rotation.y=d.h+Math.PI/2;
    d.car.position.set(d.x,y,d.z);d.car.rotation.y=d.h}
  start(){const O=this.O,a=O.meAv;if(!this.can(a)){if(a&&a.me&&!(a.look&&a.look.W>0))O.ui.toast('Open a loot crate in the Battle Pass to get a car first.');return false}
    const s=a.seat;let x=s.x,z=s.aisle,h=s.x<=0?0:Math.PI;if(carHits(x,z,h,3.4)){z=s.aisle+.25}
    const d=this.mount(a,a.look.W,x,z,h);if(!d)return false;this.me=a;this.keys={};this.ui.classList.add('on');this.send(1);O.ui.hideCard();return true}
  stop(){const a=this.me;if(!a)return;this.me=null;this.keys={};this.ui.classList.remove('on');this.end(a,1);try{this.O.api.drive&&this.O.api.drive(null)}catch(e){}this.last=''}
  // get out: the car rolls away in a puff, the driver walks back to their desk
  end(a,mine){const d=a.drv;if(!d)return;a.drv=null;const O=this.O;O.fx.sparkle(d.x,.6,d.z,40,[1,.85,.4]);O.sfx('pop');O.room.group.remove(d.car);
    a.root.scale.setScalar(1);if(a.leaving)return;const s=a.seat;if(d.k){if(s)a.sitNow();if(mine)this.snap=1;return}a.root.position.set(d.x,0,d.z);a.sitK=0;a.standK=0;
    if(s)a.walk([[s.x,s.aisle],[s.x,s.sz]],()=>{a.mode='sitting';a.turnTo=0});else a.mode='walk'}
  horn(){const d=this.me&&this.me.drv;if(!d)return;this.hn++;d.hn=this.hn;this.O.sfx('horn');this.send(1)}
  send(force){const d=this.me&&this.me.drv;if(!d)return;const st={x:+d.x.toFixed(2),z:+d.z.toFixed(2),h:+d.h.toFixed(3),v:+d.v.toFixed(2),c:d.c,hn:this.hn,k:d.k,b:this.best?+this.best.toFixed(2):0};const k=JSON.stringify(st);
    if(!force&&k===this.last)return;this.last=k;try{this.O.api.drive&&this.O.api.drive(st)}catch(e){}}
  // remote: follow what their presence says
  remote(a,dv){if(!dv||typeof dv!=='object'){if(a.drv)this.end(a);return}
    const c=+dv.c|0,x=+dv.x||0,z=+dv.z||0,h=+dv.h||0;if(!a.drv||a.drv.c!==c){if(a.drv)this.end(a);if(a.mode!=='seated'&&a.mode!=='sitting'&&a.mode!=='walk')return;if(!this.mount(a,c,x,z,h))return;a.drv.hn=+dv.hn||0}
    const d=a.drv;const k=dv.k?1:0;if(k!==d.k){d.k=k;d.x=x;d.z=z;d.h=h}d.tx=x;d.tz=z;d.th=h;d.tv=+dv.v||0;d.rt=performance.now();if(+dv.b>0)this.board[a.nm]=+dv.b;if((+dv.hn||0)!==d.hn){d.hn=+dv.hn||0;this.O.sfx('horn',.7)}}
  tick(dt,t){const O=this.O;O.av.forEach(a=>{const d=a.drv;if(!d)return;if(a.leaving){O.room.group.remove(d.car);a.drv=null;return}
      if(a===this.me){const K=this.keys,f=(K.up?1:0)-(K.down?1:0);
        if(f>0)d.v+=(d.v<0?14:d.k?8:5.5)*dt;else if(f<0)d.v-=(d.v>0?14:5)*dt;else d.v*=Math.exp(-1.4*dt);if(K.brake)d.v*=Math.exp(-6*dt);d.v=clamp(d.v,-VREV,d.k?VMAXT:VMAX);if(Math.abs(d.v)<.02&&!f)d.v=0;
        d.st=damp(d.st,(K.left?1:0)-(K.right?1:0),7,dt);const wb=Math.max(.9,d.L*S*.62),yaw=d.v*Math.tan(.6*d.st)/wb;
        const nh=d.h+yaw*dt,nx=d.x+Math.cos(nh)*d.v*dt,nz=d.z-Math.sin(nh)*d.v*dt;
        if(!carHits(nx,nz,nh,d.L,d.k)){d.x=nx;d.z=nz;d.h=nh}
        else if(!carHits(nx,d.z,nh,d.L,d.k)){d.x=nx;d.h=nh;d.v*=.8}else if(!carHits(d.x,nz,nh,d.L,d.k)){d.z=nz;d.h=nh;d.v*=.8}
        else{if(Math.abs(d.v)>2.4){O.sfx('thud');O.shk=Math.max(O.shk||0,.25)}d.v=-d.v*.3}
        this.portal(d);if(d.k)this.lapTick(d);
        this.sendT-=dt;if(this.sendT<=0){this.sendT=.1;this.send()}
        if(this.spd)this.spd.textContent=String(Math.round(Math.abs(d.v)*2.237*4))}
      else{const ag=(performance.now()-d.rt)/1000,lead=Math.min(.4,ag),px=d.tx+Math.cos(d.th)*d.tv*lead,pz=d.tz-Math.sin(d.th)*d.tv*lead;
        const ox=d.x,oz=d.z;d.x=damp(d.x,px,10,dt);d.z=damp(d.z,pz,10,dt);let dh=d.th-d.h;dh=Math.atan2(Math.sin(dh),Math.cos(dh));d.h+=dh*Math.min(1,dt*10);d.v=Math.hypot(d.x-ox,d.z-oz)/Math.max(dt,1e-3)*Math.sign(d.tv||1)}
      if(d.car.userData.spin)d.car.userData.spin(d.v*dt/S);this.place(a)})}
  // through the garage door -> the speedway pit tunnel, and back
  portal(d){if(this.tp)return;let to=null;
    if(!d.k&&d.x<-8.95)to={k:1,x:0,z:TRK.TUN.z1-2.5,h:Math.PI/2};
    else if(d.k&&d.z>TRK.TUN.z1)to={k:0,x:-7.9,z:(DOOR.z0+DOOR.z1)/2,h:0};
    if(!to)return;this.tp=1;this.fade.classList.add('on');this.O.sfx('whoosh');const v=Math.max(2,Math.abs(d.v));
    setTimeout(()=>{d.k=to.k;d.x=to.x;d.z=to.z;d.h=to.h;d.v=to.k?v:2;d.lap=null;this.snap=1;this.send(1);if(to.k)this.O.ui.toast('OWQ SPEEDWAY: cross the start line, then beat your best lap.');this.lapE.textContent=to.k?(this.best?'BEST '+this.best.toFixed(2)+'s':'GO FOR A LAP'):'';
      setTimeout(()=>{this.fade.classList.remove('on');this.tp=0},120)},360)}
  lapTick(d){const now=performance.now()/1000,L=d.lap||(d.lap={px:d.x,t0:0,a:0,b:0});if(d.x>TRK.SL+4)L.a=1;if(d.x<-TRK.SL-4)L.b=1;
    const cross=d.z<0&&Math.abs(d.z+TRK.RAD)<TRK.BAR&&((L.px>0&&d.x<=0)||(L.px<0&&d.x>=0));L.px=d.x;
    if(cross){if(L.t0&&L.a&&L.b){const lt=now-L.t0;const nb=!this.best||lt<this.best;if(nb){this.best=lt;try{localStorage.setItem(LAPK,lt.toFixed(3))}catch(e){}this.board[this.me.nm]=lt;this.send(1)}
        this.O.ui.toast((nb?'NEW BEST LAP ':'LAP ')+lt.toFixed(2)+'s');this.O.sfx(nb?'chaching':'ding')}else if(!L.t0)this.O.sfx('ding');L.t0=now;L.a=L.b=0}
    this.lapE.textContent=(L.t0?'LAP '+(now-L.t0).toFixed(1)+'s':'CROSS THE START LINE')+(this.best?'  ·  BEST '+this.best.toFixed(2)+'s':'')}
  boardRows(){const m=Object.assign({},this.board);if(this.best&&this.O.meAv)m[this.O.meAv.nm]=this.best;return Object.entries(m).filter(r=>r[1]>0).sort((a,b)=>a[1]-b[1]).map(([n,v])=>[n,'',v])}
  // chase camera behind my car
  cam(P,T){const d=this.me&&this.me.drv;if(!d)return false;const c=Math.cos(d.h),s=-Math.sin(d.h),back=4.6+Math.abs(d.v)*.18;
    const y=d.k?TY:0;P.set(d.x-c*back,y+2.7,d.z-s*back);T.set(d.x+c*2.2,y+.7,d.z+s*2.2);return true}
}
