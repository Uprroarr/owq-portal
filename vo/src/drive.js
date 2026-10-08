import {buildCar} from './cosm.js';
import {SEATS} from './layout.js';
import {clamp, damp} from './util.js';
import {DOOR, TRK, TY, trackHit} from './track.js';

const S=.7;
const VMAX=7.5;
const VMAXT=19;
const VREV=3;
const R=.45;
const BOX=[];
SEATS.forEach(($) => {
    BOX.push([$.x - 0.97, $.z - 0.43, $.x + 0.97, $.z + 0.43]), BOX.push([$.x - 0.34, $.cz - 0.32, $.x + 0.34, $.cz + 0.32]);
  });
BOX.push([-4.3, -7, 2.4, -6.4], [-10, -7, -5.3, -6.45], [3.6, -7, 6.4, -6.45], [6, -6.6, 6.8, -5.8], [7, -7, 10, -6.7], [-9.75, 1.5, -8.95, 2.3], [-9.75, -2.7, -8.95, -1.9], [-9.75, -6.7, -8.8, -5.8], [-9.7, 10.2, -8.8, 11], [8.7, 10.3, 9.5, 11.1], [8.8, 5.7, 9.6, 6.5], [-9.7, 6.4, -8.9, 7.2], [-8.2, 9.1, -5, 10.1], [-9.05, 7.55, -8.05, 9.55], [-7.3, 7.7, -5.7, 8.6], [-5.2, 6.8, -4.2, 7.8], [5.5, 7.1, 7.9, 9.5]);
var XB = [-9.75, 9.75];
var ZB = [-6.35, 11.3];
var CSS = `.vo3drv{position:absolute;inset:0;pointer-events:none;z-index:5;display:none}.vo3drv.on{display:block}
.vo3drh{position:absolute;top:62px;left:50%;transform:translateX(-50%);padding:7px 14px;border-radius:999px;background:rgba(12,6,12,.72);border:1px solid rgba(255,255,255,.14);font:700 10px Verdana,sans-serif;letter-spacing:.1em;color:#ffd0da;white-space:nowrap;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.vo3drh b{color:#fff}.vo3drs{position:absolute;top:96px;left:50%;transform:translateX(-50%);font:900 22px Verdana,sans-serif;color:#fff;text-shadow:0 2px 12px rgba(255,31,79,.8)}.vo3drs small{font-size:10px;letter-spacing:.14em;color:#ffb3c2;margin-left:4px}
.vo3drp{position:absolute;bottom:92px;display:flex;gap:10px;pointer-events:auto}.vo3drp.l{left:16px}.vo3drp.r{right:16px;flex-direction:column}
.vo3drp button{width:62px;height:62px;border-radius:18px;border:1px solid rgba(255,255,255,.18);background:rgba(12,6,12,.7);color:#fff;font:800 18px Verdana,sans-serif;touch-action:none;-webkit-user-select:none;user-select:none;cursor:pointer;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.vo3drp button.on{background:#ff1f4f;border-color:#ff1f4f}.vo3drp .r button,.vo3drp.r button{font-size:11px;letter-spacing:.06em}.vo3drp .g{color:#eafff4;font-weight:900;height:78px;background:rgba(61,220,151,.22)}.vo3drp .g.on{background:#3ddc97}
.vo3drx{position:absolute;top:58px;right:14px;pointer-events:auto;padding:9px 14px;border-radius:12px;border:0;background:#ff1f4f;color:#fff;font:800 11px Verdana,sans-serif;letter-spacing:.1em;cursor:pointer}
.vo3drl{position:absolute;top:142px;left:50%;transform:translateX(-50%);font:800 12px Verdana,sans-serif;letter-spacing:.1em;color:#ffd166;text-shadow:0 2px 10px #000;white-space:nowrap}
.vo3drf{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .35s;pointer-events:none}.vo3drf.on{opacity:1}
.vo3drt{position:absolute;top:104px;right:14px;pointer-events:auto;display:flex;align-items:center;gap:8px;padding:7px 12px;border-radius:12px;background:rgba(12,6,12,.72);border:1px solid rgba(255,255,255,.14);font:800 10px Verdana,sans-serif;letter-spacing:.1em;color:#ffd0da;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.vo3drt input{width:110px;accent-color:#ff1f4f;cursor:pointer}.vo3drt b{min-width:16px;text-align:right;color:#fff}
.vo3drk{position:absolute;bottom:92px;left:50%;transform:translateX(-50%);pointer-events:auto;padding:9px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(12,6,12,.7);color:#ffd166;font:800 12px Verdana,sans-serif;letter-spacing:.08em;cursor:pointer}`;
function hits($, J, Q) {
    if (Q)
      return trackHit($, J, R);
    let Z = J > DOOR.z0 + R * 0.6 && J < DOOR.z1 - R * 0.6;
    if ($ < XB[0] + R && !(Z && $ > -12) || $ > XB[1] - R || J < ZB[0] + R || J > ZB[1] - R)
      return true;
    for (let U of BOX) {
      let q = clamp($, U[0], U[2]), E = clamp(J, U[1], U[3]);
      if (($ - q) * ($ - q) + (J - E) * (J - E) < R * R)
        return true;
    }
    return false;
  }
// the car is two circles along its length
function carHits(x,z,h,L,k){const c=Math.cos(h),s=-Math.sin(h),o=Math.max(.2,L*S*.32);return hits(x+c*o,z+s*o,k)||hits(x-c*o,z-s*o,k)}
const LAPK='owq_bestlap';
function best0(){try{return +localStorage.getItem(LAPK)||0}catch(e){return 0}}
var STEERK = "owq_steer";
function steer0() {
    try {
      let $ = +localStorage.getItem(STEERK);
      return $ >= 1 && $ <= 10 ? Math.round($) : 5;
    } catch ($) {
      return 5;
    }
  }
class Drive {
    constructor($) {
      if (this.O = $, this.keys = {}, this.me = null, this.sendT = 0, this.last = "", this.hn = 0, !document.getElementById("vo3drcss")) {
        let U = document.createElement("style");
        U.id = "vo3drcss", U.textContent = CSS, document.head.appendChild(U);
      }
      let J = this.ui = document.createElement("div");
      J.className = "vo3drv", J.innerHTML = `<div class=vo3drh><b>DRIVING</b> &nbsp;W A S D / arrows &middot; SPACE brake &middot; H horn &middot; [ ] steering &middot; E get out</div><label class=vo3drt title="How fast you turn with the arrow keys or WASD (also used for planes)">STEERING<input type=range min=1 max=10 step=1 aria-label="Steering sensitivity"><b>5</b></label><div class=vo3drs><span>0</span><small>MPH</small></div><div class=vo3drl></div><div class=vo3drf></div>
      <div class="vo3drp l"><button data-k=left aria-label="Steer left">&#9664;</button><button data-k=right aria-label="Steer right">&#9654;</button></div>
      <div class="vo3drp r"><button class=g data-k=up aria-label="Gas">GAS</button><button data-k=down aria-label="Brake / reverse">BRAKE</button></div>
      <button class=vo3drk data-k=horn>&#128227; HORN</button><button class=vo3drx>GET OUT</button>`, $.el.appendChild(J), this.sens = steer0(), this.sl = J.querySelector(".vo3drt input"), this.slv = J.querySelector(".vo3drt b"), this.sl.value = this.sens, this.slv.textContent = this.sens, this.sl.addEventListener("input", () => this.setSens(+this.sl.value)), ["pointerdown", "keydown"].forEach((U) => this.sl.addEventListener(U, (q) => q.stopPropagation())), this.spd = J.querySelector(".vo3drs span"), this.lapE = J.querySelector(".vo3drl"), this.fade = J.querySelector(".vo3drf"), this.best = best0(), this.board = {}, J.querySelectorAll(".vo3drp button").forEach((U) => {
        let q = U.dataset.k, E = (K) => {
          K.preventDefault(), this.keys[q] = 1, U.classList.add("on");
        }, Y = (K) => {
          this.keys[q] = 0, U.classList.remove("on");
        };
        U.addEventListener("pointerdown", E), U.addEventListener("pointerup", Y), U.addEventListener("pointerleave", Y), U.addEventListener("pointercancel", Y);
      }), J.querySelector("[data-k=horn]").onclick = (U) => {
        U.stopPropagation(), this.horn();
      }, J.querySelector(".vo3drx").onclick = (U) => {
        U.stopPropagation(), this.stop();
      };
      let Q = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", " ": "brake" }, Z = (U) => {
        let q = U.target;
        return q && (q.tagName === "INPUT" || q.tagName === "TEXTAREA" || q.isContentEditable);
      };
      addEventListener("keydown", (U) => {
        if (!this.me || Z(U))
          return;
        let q = Q[U.key];
        if (q) {
          this.keys[q] = 1, U.preventDefault(), U.stopPropagation();
          return;
        }
        if (U.key === "[" || U.key === "]") {
          this.setSens(this.sens + (U.key === "]" ? 1 : -1)), U.preventDefault();
          return;
        }
        if (U.key === "h" || U.key === "H")
          this.horn(), U.preventDefault();
        else if (U.key === "e" || U.key === "E" || U.key === "Escape")
          this.stop(), U.preventDefault();
      }, true), addEventListener("keyup", (U) => {
        let q = Q[U.key];
        if (q)
          this.keys[q] = 0;
      }, true), addEventListener("blur", () => {
        this.keys = {};
      });
    }
  setSens($) {
      $ = Math.max(1, Math.min(10, Math.round($) || 5)), this.sens = $;
      try {
        localStorage.setItem(STEERK, String($));
      } catch (J) {}
      if (this.sl)
        this.sl.value = $, this.slv.textContent = $;
    }
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
  tick($, J) {
      let Q = this.O;
      Q.av.forEach((Z) => {
        let U = Z.drv;
        if (!U)
          return;
        if (Z.leaving) {
          Q.room.group.remove(U.car), Z.drv = null;
          return;
        }
        if (Z === this.me) {
          let q = this.keys, E = (q.up ? 1 : 0) - (q.down ? 1 : 0);
          if (E > 0)
            U.v += (U.v < 0 ? 14 : U.k ? 8 : 5.5) * $;
          else if (E < 0)
            U.v -= (U.v > 0 ? 14 : 5) * $;
          else
            U.v *= Math.exp(-1.4 * $);
          if (q.brake)
            U.v *= Math.exp(-6 * $);
          if (U.v = clamp(U.v, -VREV, U.k ? VMAXT : VMAX), Math.abs(U.v) < 0.02 && !E)
            U.v = 0;
          let Y = this.sens / 5;
          U.st = damp(U.st, (q.left ? 1 : 0) - (q.right ? 1 : 0), 3 + 4 * Y, $);
          let K = Math.max(0.9, U.L * S * 0.62), V = U.v * Math.tan(Math.min(1.1, 0.6 * Y) * U.st) / K, X = U.h + V * $, W = U.x + Math.cos(X) * U.v * $, H = U.z - Math.sin(X) * U.v * $;
          if (!carHits(W, H, X, U.L, U.k))
            U.x = W, U.z = H, U.h = X;
          else if (!carHits(W, U.z, X, U.L, U.k))
            U.x = W, U.h = X, U.v *= 0.8;
          else if (!carHits(U.x, H, X, U.L, U.k))
            U.z = H, U.h = X, U.v *= 0.8;
          else {
            if (Math.abs(U.v) > 2.4)
              Q.sfx("thud"), Q.shk = Math.max(Q.shk || 0, 0.25);
            U.v = -U.v * 0.3;
          }
          if (this.portal(U), U.k)
            this.lapTick(U);
          if (this.sendT -= $, this.sendT <= 0)
            this.sendT = 0.1, this.send();
          if (this.spd)
            this.spd.textContent = String(Math.round(Math.abs(U.v) * 2.237 * 4));
        } else {
          let q = (performance.now() - U.rt) / 1000, E = Math.min(0.4, q), Y = U.tx + Math.cos(U.th) * U.tv * E, K = U.tz - Math.sin(U.th) * U.tv * E, V = U.x, X = U.z;
          U.x = damp(U.x, Y, 10, $), U.z = damp(U.z, K, 10, $);
          let W = U.th - U.h;
          W = Math.atan2(Math.sin(W), Math.cos(W)), U.h += W * Math.min(1, $ * 10), U.v = Math.hypot(U.x - V, U.z - X) / Math.max($, 0.001) * Math.sign(U.tv || 1);
        }
        if (U.car.userData.spin)
          U.car.userData.spin(U.v * $ / S);
        this.place(Z);
      });
    }
  portal($) {
      if (this.tp)
        return;
      let J = null;
      if (!$.k && $.x < DOOR.x + 0.05)
        J = { k: 1, x: 0, z: TRK.TUN.z1 - 2.5, h: Math.PI / 2 };
      else if ($.k && $.z > TRK.TUN.z1)
        J = { k: 0, x: DOOR.x + 1.1, z: (DOOR.z0 + DOOR.z1) / 2, h: 0 };
      if (!J)
        return;
      this.tp = 1, this.fade.classList.add("on"), this.O.sfx("whoosh");
      let Q = Math.max(2, Math.abs($.v));
      setTimeout(() => {
        if ($.k = J.k, $.x = J.x, $.z = J.z, $.h = J.h, $.v = J.k ? Q : 2, $.lap = null, this.snap = 1, this.send(1), J.k)
          this.O.ui.toast("OWQ SPEEDWAY: cross the start line, then beat your best lap.");
        this.lapE.textContent = J.k ? this.best ? "BEST " + this.best.toFixed(2) + "s" : "GO FOR A LAP" : "", setTimeout(() => {
          this.fade.classList.remove("on"), this.tp = 0;
        }, 120);
      }, 360);
    }
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

export {Drive};
