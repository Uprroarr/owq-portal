// Driving your loot-crate car: around the Sales Floor and straight out the west door onto the Sky Deck, a long
// hanging track with hills, banked turns, boost pads and two jumps over open air. No loading screens: the deck is
// part of the same world. Cars knock walkers over and bump each other.
import {buildCar} from './cosm.js';
import {SEATS} from './layout.js';
import {clamp, damp} from './util.js';
import {DOOR, SKY, skyAt, skyRail, skyPose} from './sky.js';
import {TOWER} from './world.js';

const S = .7;
const VMAX = 7.5;      // on the Sales Floor
const VMAXT = 21;      // on the Sky Deck
const VREV = 3;
const R = .45;
const GRAV = 18;
const BOX = [];
SEATS.forEach(s => { BOX.push([s.x - .97, s.z - .43, s.x + .97, s.z + .43], [s.x - .34, s.cz - .32, s.x + .34, s.cz + .32]); });
BOX.push([-4.3, -7, 2.4, -6.4], [-10, -7, -5.3, -6.45], [3.6, -7, 6.4, -6.45], [6, -6.6, 6.8, -5.8], [7, -7, 10, -6.7], [-9.75, 1.5, -8.95, 2.3], [-9.75, -2.7, -8.95, -1.9], [-9.75, -6.7, -8.8, -5.8], [-9.7, 10.2, -8.8, 11], [8.7, 10.3, 9.5, 11.1], [8.8, 5.7, 9.6, 6.5], [-9.7, 6.4, -8.9, 7.2], [-8.2, 9.1, -5, 10.1], [-9.05, 7.55, -8.05, 9.55], [-7.3, 7.7, -5.7, 8.6], [-5.2, 6.8, -4.2, 7.8], [5.5, 7.1, 7.9, 9.5]);
const XB = [-9.75, 9.75];
const ZB = [-6.35, 11.3];
const CSS = `.vo3drv{position:absolute;inset:0;pointer-events:none;z-index:5;display:none}.vo3drv.on{display:block}
.vo3drh{position:absolute;top:62px;left:50%;transform:translateX(-50%);padding:7px 14px;border-radius:14px;background:rgba(12,6,12,.72);border:1px solid rgba(255,255,255,.14);font:700 10px Verdana,sans-serif;letter-spacing:.1em;color:#ffd0da;width:max-content;max-width:calc(100% - 340px);white-space:normal;text-align:center;line-height:1.55;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.vo3drh b{color:#fff}.vo3drs{position:absolute;top:96px;left:50%;transform:translateX(-50%);font:900 22px Verdana,sans-serif;color:#fff;text-shadow:0 2px 12px rgba(255,31,79,.8)}.vo3drs small{font-size:10px;letter-spacing:.14em;color:#ffb3c2;margin-left:4px}
.vo3drp{position:absolute;bottom:92px;display:flex;gap:10px;pointer-events:auto}.vo3drp.l{left:16px}.vo3drp.r{right:16px;flex-direction:column}
.vo3drp button{width:62px;height:62px;border-radius:18px;border:1px solid rgba(255,255,255,.18);background:rgba(12,6,12,.7);color:#fff;font:800 18px Verdana,sans-serif;touch-action:none;-webkit-user-select:none;user-select:none;cursor:pointer;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.vo3drp button.on{background:#ff1f4f;border-color:#ff1f4f}.vo3drp .r button,.vo3drp.r button{font-size:11px;letter-spacing:.06em}.vo3drp .g{color:#eafff4;font-weight:900;height:78px;background:rgba(61,220,151,.22)}.vo3drp .g.on{background:#3ddc97}
.vo3drx{position:absolute;top:58px;right:14px;pointer-events:auto;padding:9px 14px;border-radius:12px;border:0;background:#ff1f4f;color:#fff;font:800 11px Verdana,sans-serif;letter-spacing:.1em;cursor:pointer}
.vo3drl{position:absolute;top:142px;left:50%;transform:translateX(-50%);font:800 12px Verdana,sans-serif;letter-spacing:.1em;color:#ffd166;text-shadow:0 2px 10px #000;white-space:nowrap}
.vo3drf{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .35s;pointer-events:none}.vo3drf.on{opacity:1}
.vo3drt{position:absolute;top:104px;right:14px;pointer-events:auto;display:flex;align-items:center;gap:8px;padding:7px 12px;border-radius:12px;background:rgba(12,6,12,.72);border:1px solid rgba(255,255,255,.14);font:800 10px Verdana,sans-serif;letter-spacing:.1em;color:#ffd0da;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.vo3drt input{width:110px;accent-color:#ff1f4f;cursor:pointer}.vo3drt b{min-width:16px;text-align:right;color:#fff}
.vo3drk{position:absolute;bottom:92px;left:50%;transform:translateX(-50%);pointer-events:auto;padding:9px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(12,6,12,.7);color:#ffd166;font:800 12px Verdana,sans-serif;letter-spacing:.08em;cursor:pointer}
.vo3drb{position:absolute;top:170px;left:50%;transform:translateX(-50%);font:900 30px Verdana,sans-serif;letter-spacing:.12em;color:#fff;text-shadow:0 0 18px #ff1f4f,0 2px 10px #000;opacity:0;transition:opacity .2s;white-space:nowrap}.vo3drb.on{opacity:1}`;
// Sales Floor walls, desks and the door gap
function hitsFloor(x, z) {
  const inDoor = z > DOOR.z0 + R * .6 && z < DOOR.z1 - R * .6;
  if ((x < XB[0] + R && !inDoor) || x > XB[1] - R || z < ZB[0] + R || z > ZB[1] - R) return true;
  for (const b of BOX) { const qx = clamp(x, b[0], b[2]), qz = clamp(z, b[1], b[3]); if ((x - qx) * (x - qx) + (z - qz) * (z - qz) < R * R) return true; }
  return false;
}
// the car is two circles along its length
function carHits(d, x, z, h) {
  const c = Math.cos(h), s = -Math.sin(h), o = Math.max(.2, d.L * S * .32);
  const at = (px, pz) => {
    if (px < TOWER.x0) return skyRail(px, pz, R, d.hint);                          // outside: the deck's rails
    if (px < XB[0] + R) return !(pz > DOOR.z0 + R * .6 && pz < DOOR.z1 - R * .6);  // in the doorway
    return hitsFloor(px, pz);                                                       // the Sales Floor
  };
  return at(x + c * o, z + s * o) || at(x - c * o, z - s * o);
}
const LAPK = 'owq_skylap';
function best0() { try { return +localStorage.getItem(LAPK) || 0; } catch (e) { return 0; } }
const STEERK = 'owq_steer';
function steer0() { try { const v = +localStorage.getItem(STEERK); return v >= 1 && v <= 10 ? Math.round(v) : 5; } catch (e) { return 5; } }
const carH = h => ({x: Math.cos(h), z: -Math.sin(h)});

class Drive {
  constructor(O) {
    this.O = O; this.keys = {}; this.me = null; this.sendT = 0; this.last = ''; this.hn = 0; this.kn = 0; this.knk = null;
    if (!document.getElementById('vo3drcss')) { const s = document.createElement('style'); s.id = 'vo3drcss'; s.textContent = CSS; document.head.appendChild(s); }
    const u = this.ui = document.createElement('div'); u.className = 'vo3drv';
    u.innerHTML = `<div class=vo3drh><b>DRIVING</b> &nbsp;W A S D / arrows &middot; SPACE brake &middot; H horn &middot; E get out &middot; west door = SKY DECK</div><label class=vo3drt title="How fast you turn with the arrow keys or WASD (also used for planes)">STEERING<input type=range min=1 max=10 step=1 aria-label="Steering sensitivity"><b>5</b></label><div class=vo3drs><span>0</span><small>MPH</small></div><div class=vo3drl></div><div class=vo3drb></div><div class=vo3drf></div>
      <div class="vo3drp l"><button data-k=left aria-label="Steer left">&#9664;</button><button data-k=right aria-label="Steer right">&#9654;</button></div>
      <div class="vo3drp r"><button class=g data-k=up aria-label="Gas">GAS</button><button data-k=down aria-label="Brake / reverse">BRAKE</button></div>
      <button class=vo3drk data-k=horn>&#128227; HORN</button><button class=vo3drx>GET OUT</button>`;
    O.el.appendChild(u);
    this.sens = steer0(); this.sl = u.querySelector('.vo3drt input'); this.slv = u.querySelector('.vo3drt b'); this.sl.value = this.sens; this.slv.textContent = this.sens;
    this.sl.addEventListener('input', () => this.setSens(+this.sl.value)); ['pointerdown', 'keydown'].forEach(ev => this.sl.addEventListener(ev, e => e.stopPropagation()));
    this.spd = u.querySelector('.vo3drs span'); this.lapE = u.querySelector('.vo3drl'); this.fade = u.querySelector('.vo3drf'); this.bigE = u.querySelector('.vo3drb'); this.best = best0(); this.board = {};
    u.querySelectorAll('.vo3drp button').forEach(b => {
      const k = b.dataset.k, dn = e => { e.preventDefault(); this.keys[k] = 1; b.classList.add('on'); }, up = () => { this.keys[k] = 0; b.classList.remove('on'); };
      b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
    });
    u.querySelector('[data-k=horn]').onclick = e => { e.stopPropagation(); this.horn(); };
    u.querySelector('.vo3drx').onclick = e => { e.stopPropagation(); this.stop(); };
    const KM = {ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ' ': 'brake'};
    const typing = e => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); };
    addEventListener('keydown', e => {
      if (e.__vo3 || !this.me || typing(e)) return;
      if (/^(e|E|Escape|h|H|\[|\])$/.test(e.key) || KM[e.key]) e.__vo3 = 1;
      const k = KM[e.key]; if (k) { this.keys[k] = 1; e.preventDefault(); e.stopPropagation(); return; }
      if (e.key === '[' || e.key === ']') { this.setSens(this.sens + (e.key === ']' ? 1 : -1)); e.preventDefault(); return; }
      if (e.key === 'h' || e.key === 'H') { this.horn(); e.preventDefault(); }
      else if (e.key === 'e' || e.key === 'E' || e.key === 'Escape') { this.stop(); e.preventDefault(); e.stopPropagation(); }
    }, true);
    addEventListener('keyup', e => { const k = KM[e.key]; if (k) this.keys[k] = 0; }, true);
    addEventListener('blur', () => { this.keys = {}; });
  }
  setSens(v) { v = Math.max(1, Math.min(10, Math.round(v) || 5)); this.sens = v; try { localStorage.setItem(STEERK, String(v)); } catch (e) {} if (this.sl) { this.sl.value = v; this.slv.textContent = v; } }
  can(a) { return !!(a && a.me && a.look && a.look.W > 0 && (a.mode === 'seated' || a.mode === 'free') && !this.O.busy(a, 'drive') && !a.leaving && a.root.visible && !a.drv); }
  // put someone in their car
  mount(a, c, x, z, h, k, y) {
    const car = buildCar(c); if (!car) return null;
    car.scale.setScalar(S); car.position.set(x, y || 0, z); car.rotation.y = h; this.O.room.group.add(car); this.O.warm(car);
    const L = car.userData.len || 3.4;
    const d = {car, c, x, z, h, v: 0, st: 0, L, tx: x, tz: z, th: h, tv: 0, rt: performance.now(), hn: 0, k: k ? 1 : 0, lap: null, y: y || 0, vy: 0, air: 0, hint: -1, ty: y || 0, pitch: 0, roll: 0, s: 0};
    a.drv = d; a.mode = 'drive'; a.emo = null; a.idleK = null; a.typing = false; a.sitK = 1; a.standK = 0; a.path = null; a.mv = 0; a.root.scale.setScalar(.55);
    this.place(a); this.O.fx.sparkle(x, (y || 0) + .6, z, 30, [1, .85, .4]); this.O.sfx('vroom'); return d;
  }
  place(a) {
    const d = a.drv, c = Math.cos(d.h), s = -Math.sin(d.h), off = -.08 * d.L * S;
    d.car.position.set(d.x, d.y, d.z); d.car.rotation.set(d.roll, d.h, d.pitch, 'YXZ');
    a.root.position.set(d.x + c * off, d.y + .06, d.z + s * off); a.root.rotation.set(0, d.h + Math.PI / 2, 0);
  }
  // from my desk
  start() {
    const O = this.O, a = O.meAv;
    if (a && a.wk && O.walk) return this.startHere(a);
    if (!this.can(a)) { if (a && a.me && !(a.look && a.look.W > 0)) O.ui.toast('Open a loot crate in the Battle Pass to get a car first.'); return false; }
    const s = a.seat; let x = s.x, z = s.aisle; const h = s.x <= 0 ? 0 : Math.PI;
    const d0 = {L: 3.4, k: 0, hint: -1}; if (carHits(d0, x, z, h)) z = s.aisle + .25;
    const d = this.mount(a, a.look.W, x, z, h, 0); if (!d) return false;
    const desk = O.room.desks[s.i]; if (desk && desk.av === a) desk.occ = 0;
    this.me = a; this.keys = {}; this.ui.classList.add('on'); this.send(1); O.ui.hideCard(); return true;
  }
  // from where I'm walking (Sales Floor or Sky Deck)
  startHere(a) {
    const O = this.O, w = a.wk; if (!w || !(a.look && a.look.W > 0) || a.drv) return false;
    if (w.f !== 'o' && w.f !== 'd') { O.ui.toast('Cars only go on the Sales Floor and the Sky Deck.'); return false; }
    const h = Math.PI / 2 - w.h;   // walker heading -> car heading
    const k = w.f === 'd' ? 1 : 0, d0 = {L: 3.4, k, hint: w.hint == null ? -1 : w.hint};
    if (carHits(d0, w.x, w.z, h)) { O.ui.toast('Not enough room for your car here.'); return false; }
    O.walk.me = null; O.walk.ui.classList.remove('on'); O.walk.prE.classList.remove('on'); try { O.api.walk && O.api.walk(null); } catch (e) {}
    const x = w.x, z = w.z, y = w.y; a.wk = null; a.mv = 0;
    const d = this.mount(a, a.look.W, x, z, h, k, y); if (!d) return false;
    d.hint = w.hint == null ? -1 : w.hint;
    this.me = a; this.keys = {}; this.ui.classList.add('on'); this.send(1); O.ui.hideCard(); return true;
  }
  stop() {
    const a = this.me; if (!a) return; this.me = null; this.keys = {}; this.ui.classList.remove('on');
    const d = a.drv; this.end(a, 1);
    try { this.O.api.drive && this.O.api.drive(null); } catch (e) {} this.last = '';
    // get out and keep walking from here
    if (d && this.O.walk && !a.leaving) {
      a.mode = 'seated';
      const c = carH(d.h); let x = d.x + c.z * 1.1, z = d.z - c.x * 1.1;
      if (d.k ? skyRail(x, z, .3, d.hint) : hitsFloor(x, z)) { x = d.x; z = d.z; }
      const ok = this.O.walk.start({at: {x, z, y: d.y, h: Math.PI / 2 - d.h, f: d.k ? 'd' : 'o', hint: d.hint}});
      if (ok) return;
      a.sitNow();
    }
  }
  // the car goes away in a puff
  end(a, mine) {
    const d = a.drv; if (!d) return; a.drv = null; const O = this.O;
    O.fx.sparkle(d.x, d.y + .6, d.z, 40, [1, .85, .4]); O.sfx('pop'); O.room.group.remove(d.car);
    a.root.scale.setScalar(1); a.root.rotation.set(0, a.root.rotation.y, 0);
    if (a.leaving || mine) return;
    // someone else got out: they either walk on (their presence says so) or go back to their desk
    if (a.p && a.p.wk) return;
    const s = a.seat; if (!s) return;
    if (d.k) { a.sitNow(); return; }
    a.root.position.set(d.x, 0, d.z); a.sitK = 0; a.standK = 0;
    a.walk([[s.x, s.aisle], [s.x, s.sz]], () => { a.mode = 'sitting'; a.turnTo = 0; });
  }
  horn() { const d = this.me && this.me.drv; if (!d) return; this.hn++; d.hn = this.hn; this.O.sfx('horn'); this.send(1); }
  send(force) {
    const d = this.me && this.me.drv; if (!d) return;
    const st = {x: +d.x.toFixed(2), z: +d.z.toFixed(2), y: +d.y.toFixed(2), h: +d.h.toFixed(3), v: +d.v.toFixed(2), c: d.c, hn: this.hn, k: d.k, b: this.best ? +this.best.toFixed(2) : 0};
    if (this.knk) st.kn = this.knk;
    const k = JSON.stringify(st); if (!force && k === this.last) return; this.last = k;
    try { this.O.api.drive && this.O.api.drive(st); } catch (e) {}
  }
  // remote: follow what their presence says
  remote(a, dv) {
    if (!dv || typeof dv !== 'object') { if (a.drv) this.end(a); return; }
    const c = +dv.c | 0, x = +dv.x || 0, z = +dv.z || 0, h = +dv.h || 0, y = +dv.y || 0, k = dv.k ? 1 : 0;
    if (!a.drv || a.drv.c !== c) {
      if (a.drv) this.end(a);
      if (a.wk) { a.wk = null; a.mv = 0; }
      if (a.mode !== 'seated' && a.mode !== 'sitting' && a.mode !== 'walk' && a.mode !== 'free') return;
      if (!this.mount(a, c, x, z, h, k, y)) return; a.drv.hn = +dv.hn || 0; a.drv.knN = dv.kn && typeof dv.kn === 'object' ? +dv.kn.n || 0 : 0;
    }
    const d = a.drv; if (k !== d.k) { d.k = k; d.x = x; d.z = z; d.h = h; d.y = y; }
    d.tx = x; d.tz = z; d.th = h; d.ty = y; d.tv = +dv.v || 0; d.rt = performance.now();
    if (+dv.b > 0) this.board[a.nm] = +dv.b;
    if ((+dv.hn || 0) !== d.hn) { d.hn = +dv.hn || 0; this.O.sfx('horn', .7); }
    // they hit someone: everyone plays the knockdown
    const kn = dv.kn; if (kn && typeof kn === 'object' && (+kn.n || 0) !== (d.knN || 0)) {
      d.knN = +kn.n || 0;
      let v = null; this.O.av.forEach(b => { if (b.id === kn.id) v = b; }); if (v && this.O.walk) this.O.walk.knock(v, +kn.dx || 0, +kn.dz || 0, +kn.v || 4);
    }
  }
  tick(dt, t) {
    const O = this.O;
    O.av.forEach(a => {
      const d = a.drv; if (!d) return;
      if (a.leaving) { O.room.group.remove(d.car); a.drv = null; return; }
      if (a === this.me) this.mine(a, d, dt, t);
      else {
        const age = Math.min(.4, (performance.now() - d.rt) / 1000), ex = d.tx + Math.cos(d.th) * d.tv * age, ez = d.tz - Math.sin(d.th) * d.tv * age, ox = d.x, oz = d.z;
        d.x = damp(d.x, ex, 10, dt); d.z = damp(d.z, ez, 10, dt); d.y = damp(d.y, d.ty, 10, dt);
        let dh = d.th - d.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); d.h += dh * Math.min(1, dt * 10);
        d.v = Math.hypot(d.x - ox, d.z - oz) / Math.max(dt, .001) * Math.sign(d.tv || 1);
        if (d.k) { const q = skyAt(d.x, d.z, d.hint); d.hint = q.i; d.air = q.gap || d.y > q.y + .3 ? 1 : 0; d.vy = (d.ty - d.y) * 4; this.lean(d, q, dt); }
        else { d.pitch = damp(d.pitch, 0, 8, dt); d.roll = damp(d.roll, 0, 8, dt); }
      }
      if (d.car.userData.spin) d.car.userData.spin(d.v * dt / S);
      this.place(a);
    });
  }
  lean(d, q, dt) {
    // pitch from the slope, roll from the banking (smoothed); in the air the nose follows the fall
    const S0 = SKY.S, n = SKY.n; if (!S0.length) return;
    const a = S0[q.i], b = S0[(q.i + 3) % n], fwd = carH(d.h), dir = fwd.x * a.t.x + fwd.z * a.t.z >= 0 ? 1 : -1;
    const slope = Math.atan2((b.p.y - a.p.y) * dir, 3);
    const tp = d.air ? clamp(Math.atan2(d.vy, Math.max(4, Math.abs(d.v))), -.6, .5) : slope;
    d.pitch = damp(d.pitch, tp, 8, dt); d.roll = damp(d.roll, d.air ? 0 : -a.bank * dir, 6, dt);
  }
  mine(a, d, dt, t) {
    const O = this.O, K = this.keys, thr = (K.up ? 1 : 0) - (K.down ? 1 : 0);
    if (!d.air) {
      if (thr > 0) d.v += (d.v < 0 ? 14 : d.k ? 9 : 5.5) * dt; else if (thr < 0) d.v -= (d.v > 0 ? 14 : 5) * dt; else d.v *= Math.exp(-1.2 * dt);
      if (K.brake) d.v *= Math.exp(-6 * dt);
    }
    const vmax = d.k ? VMAXT * (d.boost > 0 ? 1.35 : 1) : VMAX;
    if (d.v > vmax) d.v = d.air ? d.v : damp(d.v, vmax, 2.5, dt); d.v = Math.max(d.v, -VREV);
    if (Math.abs(d.v) < .02 && !thr) d.v = 0;
    if (d.boost > 0) d.boost -= dt;
    const sv = this.sens / 5; d.st = damp(d.st, (K.left ? 1 : 0) - (K.right ? 1 : 0), 3 + 4 * sv, dt);
    const wb = Math.max(.9, d.L * S * .62), yaw = d.v * Math.tan(Math.min(1.1, .6 * sv) * d.st) / wb * (d.air ? .25 : 1);
    const nh = d.h + yaw * dt, nx = d.x + Math.cos(nh) * d.v * dt, nz = d.z - Math.sin(nh) * d.v * dt;
    if (d.air) {   // nothing to hit in mid air
      d.x = nx; d.z = nz; d.h = nh;
      // jump assist: in the air the car lines up with the road and drifts back toward the middle, so a jump in a
      // gentle curve still lands on the far side
      if (d.k && SKY.n && d.hint >= 0) {
        const s0 = SKY.S[d.hint], fw = carH(d.h), dir = fw.x * s0.t.x + fw.z * s0.t.z >= 0 ? 1 : -1;
        let dh = Math.atan2(-s0.t.z * dir, s0.t.x * dir) - d.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
        if (Math.abs(dh) < 1) d.h += dh * Math.min(1, dt * 2.6);
        const lat = (d.x - s0.p.x) * s0.nx + (d.z - s0.p.z) * s0.nz, over = Math.abs(lat) - 1.2;
        if (over > 0) { const k = Math.min(over, 4 * dt) * Math.sign(lat); d.x -= s0.nx * k; d.z -= s0.nz * k; }
      }
    }
    else if (!carHits(d, nx, nz, nh)) { d.x = nx; d.z = nz; d.h = nh; }
    else if (!carHits(d, nx, d.z, nh)) { d.x = nx; d.h = nh; d.v *= .8; }
    else if (!carHits(d, d.x, nz, nh)) { d.z = nz; d.h = nh; d.v *= .8; }
    else { if (Math.abs(d.v) > 2.4) { O.sfx('thud'); O.shk = Math.max(O.shk || 0, .25); } d.v = -d.v * .3; }
    // out the door and onto the deck (and back in)
    if (!d.k && d.x < TOWER.x0 + .3) { d.k = 1; d.hint = -1; d.lap = null; if (!this.deckSeen) { this.deckSeen = 1; O.ui.toast('OWQ SKY DECK: hit the boost pads, clear both jumps, beat your best lap.'); } this.send(1); }
    else if (d.k && d.x > TOWER.x0 + .5 && d.z > DOOR.z0 - .2 && d.z < DOOR.z1 + .2) { d.k = 0; d.y = 0; d.air = 0; d.vy = 0; this.lapE.textContent = ''; this.send(1); }
    if (d.k) this.deck(a, d, dt, t); else { d.y = 0; d.pitch = damp(d.pitch, 0, 8, dt); d.roll = damp(d.roll, 0, 8, dt); }
    this.hitPeople(a, d, t);
    if ((this.sendT -= dt) <= 0) { this.sendT = .1; this.send(); }
    if (this.spd) this.spd.textContent = String(Math.round(Math.abs(d.v) * 2.237 * 4));
  }
  // Sky Deck: follow the road height, fly off the jumps, fall through gaps
  deck(a, d, dt, t) {
    const O = this.O, q = skyAt(d.x, d.z, d.hint), ps = d.s; d.hint = q.i; d.s = q.s;
    const ground = d.x > TOWER.x0 - .05 ? 0 : q.on && !q.gap ? q.y : null;
    if (!d.air) {
      if (ground === null || ground < d.y - .35) { d.air = 1; d.vy = Math.max(0, d.lastSlope || 0) * Math.abs(d.v); d.jumpT = t; }
      else {
        // remember the slope we're driving up so a ramp lip launches us
        const S0 = SKY.S, nx = S0[(q.i + 1) % SKY.n], pv = S0[q.i], dir = Math.cos(d.h) * q.t.x - Math.sin(d.h) * q.t.z >= 0 ? 1 : -1;
        d.lastSlope = (nx.p.y - pv.p.y) * dir; d.y = ground;
      }
    }
    if (d.air) {
      d.vy -= GRAV * dt; d.y += d.vy * dt;
      if (ground !== null && d.y <= ground && d.vy <= 0) {
        if (d.vy < -7) { O.sfx('thud'); O.shk = Math.max(O.shk || 0, Math.min(.6, -d.vy * .04)); }
        if (d.vy < -3) O.fx.sparkle(d.x, ground + .2, d.z, 24, [1, .7, .3]);
        d.y = ground; d.air = 0; d.vy = 0;
        const air = d.jumpT ? t - d.jumpT : 0; d.jumpT = 0; if (air > .55) this.big((air > 1.1 ? 'BIG AIR  ' : 'AIR  ') + air.toFixed(1) + 's');
      }
      if (d.y < q.y - 12 || d.y < -60) this.fall(a, d);
    }
    this.lean(d, q, dt);
    // boost pads
    for (const s of SKY.boosts) { const ds = ((d.s - s) % SKY.len + SKY.len) % SKY.len; if (ds < 3 && Math.abs(q.lat) < 2.6 && !d.air && (d.bT || 0) < t - 1) { d.bT = t; d.boost = 1.6; d.v = Math.max(d.v, VMAXT * 1.2); O.sfx('whee'); this.big('BOOST'); } }
    this.lapTick(d, ps, t);
  }
  fall(a, d) {
    if (this.tp) return; this.tp = 1; const O = this.O; this.fade.classList.add('on'); O.sfx('whoosh');
    const back = d.cpS != null ? d.cpS : SKY.start;
    setTimeout(() => { const p = skyPose(back + 4); d.x = p.x; d.z = p.z; d.y = p.y; d.h = Math.PI / 2 - p.h; d.v = 6; d.vy = 0; d.air = 0; d.hint = p.i; d.jumpT = 0; this.snap = 1; this.send(1); O.ui.toast('Missed the landing! Back at the last checkpoint.'); setTimeout(() => { this.fade.classList.remove('on'); this.tp = 0; }, 140); }, 380);
  }
  big(txt) { const e = this.bigE; if (!e) return; e.textContent = txt; e.classList.add('on'); clearTimeout(this._bt); this._bt = setTimeout(() => e.classList.remove('on'), 1100); }
  lapTick(d, ps, t) {
    const L = d.lap || (d.lap = {t0: 0, cp: 0}), len = SKY.len, step = ((d.s - ps) % len + len) % len;
    if (step > len / 2 || step > 40) return;     // going backwards, or just respawned
    const crossed = s => { const a = ((s - ps) % len + len) % len; return a > 0 && a <= step; };
    SKY.cps.forEach((s, i) => { if (crossed(s) && L.cp === i) { L.cp = i + 1; d.cpS = s; } });
    if (crossed(SKY.start)) {
      if (L.t0 && L.cp >= SKY.cps.length) {
        const lt = t - L.t0, nb = !this.best || lt < this.best;
        if (nb) { this.best = lt; try { localStorage.setItem(LAPK, lt.toFixed(3)); } catch (e) {} this.board[this.me.nm] = lt; this.send(1); }
        this.O.ui.toast((nb ? 'NEW BEST LAP ' : 'LAP ') + lt.toFixed(2) + 's'); this.O.sfx(nb ? 'chaching' : 'ding'); if (nb) this.big('NEW BEST LAP');
      } else if (!L.t0) this.O.sfx('ding');
      L.t0 = t; L.cp = 0; d.cpS = SKY.start;
    }
    this.lapE.textContent = (L.t0 ? 'LAP ' + (t - L.t0).toFixed(1) + 's' : 'CROSS THE START LINE') + (this.best ? '  ·  BEST ' + this.best.toFixed(2) + 's' : '');
  }
  // my car against walkers (knockdowns) and other cars (bumps)
  hitPeople(a, d, t) {
    const O = this.O, f = d.k ? 'd' : 'o', rr = d.L * S * .38 + .3;
    O.av.forEach(b => {
      if (b === a || b.leaving) return;
      if (b.wk && b.wk.f === f && !b.knd) {
        const p = b.root.position, dx = p.x - d.x, dz = p.z - d.z, dy = Math.abs(p.y - d.y);
        if (dy < 1.6 && dx * dx + dz * dz < rr * rr && Math.abs(d.v) > 1.6) {
          if ((b._knT || 0) > t - 1.5) return; b._knT = t;
          const c = carH(d.h), s = Math.sign(d.v) || 1, ex = c.x * s * .8 + dx * .6, ez = c.z * s * .8 + dz * .6;
          O.walk && O.walk.knock(b, ex, ez, Math.abs(d.v));
          this.kn++; this.knk = {id: b.id, n: this.kn, dx: +ex.toFixed(2), dz: +ez.toFixed(2), v: +Math.abs(d.v).toFixed(1)}; this.send(1);
          d.v *= .7; O.ui.toast('Watch it! You knocked ' + String(b.nm).split(' ')[0] + ' over.');
        }
      }
      const e = b.drv; if (e && e.k === d.k) {
        const dx = d.x - e.x, dz = d.z - e.z, dd = Math.hypot(dx, dz), lim = (d.L + e.L) * S * .3;
        if (dd < lim && dd > 1e-3 && Math.abs(d.y - e.y) < 1.4) {
          const k = (lim - dd) / dd; d.x += dx * k; d.z += dz * k;
          if ((d._bump || 0) < t - .6 && Math.abs(d.v) > 1) { d._bump = t; O.sfx('thud'); O.shk = Math.max(O.shk || 0, .3); O.fx.sparkle((d.x + e.x) / 2, d.y + .6, (d.z + e.z) / 2, 18, [1, .8, .4]); }
          d.v *= .6;
        }
      }
    });
  }
  boardRows() { const m = Object.assign({}, this.board); if (this.best && this.O.meAv) m[this.O.meAv.nm] = this.best; return Object.entries(m).filter(r => r[1] > 0).sort((a, b) => a[1] - b[1]).map(([n, v]) => [n, '', v]); }
  // chase camera behind my car
  cam(P, T) {
    const d = this.me && this.me.drv; if (!d) return false;
    const c = carH(d.h), back = (d.k ? 6.2 : 4.6) + Math.abs(d.v) * (d.k ? .16 : .18);
    P.set(d.x - c.x * back, d.y + (d.k ? 3.2 : 2.7), d.z - c.z * back); T.set(d.x + c.x * 2.6, d.y + .8, d.z + c.z * 2.6);
    if (!d.k) { P.x = clamp(P.x, -9.7, 9.7); P.z = clamp(P.z, -6.7, 11.4); P.y = Math.min(P.y, 4.9); }
    return true;
  }
}

export {Drive, BOX as DRIVEBOX, steer0};
