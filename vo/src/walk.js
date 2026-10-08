// Walking: get up from your desk and walk the Sales Floor, out the west door onto the Sky Deck, and up and down in
// the elevator (Sky Park on the roof, Firing Range one floor down). Everyone sees everyone walk (presence 'wk').
// Cars knock walkers over (presence 'dv.kn' from the driver), walkers bump each other softly.
import * as THREE from 'three';
import {clamp, damp, lerp} from './util.js';
import {SEATS} from './layout.js';
import {FLOORS, ELEVP, TOWER, ROOFY, RANGEY} from './world.js';
import {DOOR, skyAt, skyRail, skyPose} from './sky.js';

const WR = .27;            // walker radius
const SPD = 2.3, RUN = 5.2, G = 15;
const CSS = `.vo3wk{position:absolute;inset:0;pointer-events:none;z-index:5;display:none}.vo3wk.on{display:block}
.vo3wkh{position:absolute;top:62px;left:50%;transform:translateX(-50%);width:max-content;max-width:calc(100% - 340px);white-space:normal;text-align:center;line-height:1.55;padding:7px 14px;border-radius:14px;background:rgba(12,6,12,.72);border:1px solid rgba(255,255,255,.14);font:700 10px Verdana,sans-serif;letter-spacing:.1em;color:#ffd0da;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.vo3wkh b{color:#fff}.vo3wkf{position:absolute;top:96px;left:50%;transform:translateX(-50%);font:900 12px Verdana,sans-serif;letter-spacing:.18em;color:#fff;text-shadow:0 2px 12px rgba(255,31,79,.8)}
.vo3wkp{position:absolute;bottom:150px;left:50%;transform:translateX(-50%);pointer-events:auto;padding:11px 18px;border-radius:14px;border:1px solid rgba(255,209,102,.55);background:rgba(12,6,12,.82);color:#ffd166;font:800 12px Verdana,sans-serif;letter-spacing:.1em;cursor:pointer;display:none;box-shadow:0 0 24px rgba(255,209,102,.25)}
.vo3wkp.on{display:block}.vo3wkp kbd{display:inline-block;min-width:18px;padding:2px 6px;margin-right:8px;border-radius:6px;background:#ffd166;color:#120a10;font:900 11px Verdana,sans-serif;text-align:center}
.vo3wkx{position:absolute;top:58px;right:14px;pointer-events:auto;padding:9px 14px;border-radius:12px;border:0;background:#ff1f4f;color:#fff;font:800 11px Verdana,sans-serif;letter-spacing:.1em;cursor:pointer}
.vo3wkd{position:absolute;bottom:92px;left:16px;display:grid;grid-template-columns:52px 52px 52px;gap:6px;pointer-events:auto}
.vo3wkd button{height:52px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(12,6,12,.7);color:#fff;font:800 16px Verdana,sans-serif;touch-action:none;-webkit-user-select:none;user-select:none;cursor:pointer}
.vo3wkd button.on{background:#ff1f4f;border-color:#ff1f4f}.vo3wkd .e{grid-column:1}
.vo3wkr{position:absolute;bottom:92px;right:16px;display:flex;flex-direction:column;gap:8px;pointer-events:auto}
.vo3wkr button{width:78px;height:52px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(12,6,12,.7);color:#fff;font:800 11px Verdana,sans-serif;letter-spacing:.08em;cursor:pointer}
.vo3wkr button.on{background:#ff1f4f;border-color:#ff1f4f}
.vo3el{position:absolute;inset:0;display:none;align-items:center;justify-content:center;pointer-events:auto;background:rgba(5,2,8,.55);z-index:7}.vo3el.on{display:flex}
.vo3elp{width:min(360px,86vw);padding:20px;border-radius:20px;background:linear-gradient(160deg,#18121a,#0b080d);border:1px solid rgba(255,31,79,.45);box-shadow:0 0 40px rgba(255,31,79,.25)}
.vo3elp h3{margin:0 0 4px;font:900 14px Verdana,sans-serif;letter-spacing:.2em;color:#fff}.vo3elp p{margin:0 0 14px;font:700 10px Verdana,sans-serif;letter-spacing:.08em;color:#b9a3ad}
.vo3elp button{display:block;width:100%;margin:8px 0 0;padding:12px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#fff;text-align:left;cursor:pointer;font:900 13px Verdana,sans-serif;letter-spacing:.12em}
.vo3elp button small{display:block;margin-top:4px;font:700 10px Verdana,sans-serif;letter-spacing:.04em;color:#b9a3ad}.vo3elp button.here{border-color:#3ddc97;color:#8ef0c2}
.vo3elp button:hover{border-color:#ff1f4f}.vo3elp .x{text-align:center;color:#b9a3ad;font-size:11px}
.vo3fd{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .35s;pointer-events:none;z-index:6}.vo3fd.on{opacity:1}`;

// office walls (inside faces) and openings
const ROOM = {x0: -9.98, x1: 9.98, z0: -6.98, z1: 11.5};
const ELEV = {x0: 7.36, x1: 8.64, z0: -8.85, z1: -7.0};   // the cab behind the doors
export const ELEVCAB = ELEV;
// solid boxes on the Sales Floor (desks, chairs, plants, lounge), shared with the cars
export const WALKBOX = [];
SEATS.forEach(s => { WALKBOX.push([s.x - .97, s.z - .43, s.x + .97, s.z + .43]); });
WALKBOX.push([-4.3, -7, 2.4, -6.4], [-10, -7, -5.3, -6.45], [3.6, -7, 6.4, -6.45], [6, -6.6, 6.8, -5.8], [-9.75, 1.5, -8.95, 2.3], [-9.75, -2.7, -8.95, -1.9], [-9.75, -6.7, -8.8, -5.8], [-9.7, 10.2, -8.8, 11], [8.7, 10.3, 9.5, 11.1], [8.8, 5.7, 9.6, 6.5], [-9.7, 6.4, -8.9, 7.2], [-8.2, 9.1, -5, 10.1], [-9.05, 7.55, -8.05, 9.55], [-7.3, 7.7, -5.7, 8.6], [-5.2, 6.8, -4.2, 7.8], [5.5, 7.1, 7.9, 9.5]);
// other floors register their own boxes here: FLOORBOX.r / FLOORBOX.g = [[x0,z0,x1,z1], ...] and a bounds rect
export const FLOORBOX = {o: WALKBOX, r: [], g: []};
export const FLOORRECT = {r: {x0: -27.5, x1: 27.5, z0: -39.5, z1: 15.5}, g: {x0: -9.9, x1: 9.9, z0: -6.95, z1: 11.4}};

function pushOut(p, boxes, r) {
  for (const b of boxes) {
    const cx = clamp(p.x, b[0], b[2]), cz = clamp(p.z, b[1], b[3]), dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (r - d) / d; p.x += dx * k; p.z += dz * k; }
    else { // centre inside the box: leave by the nearest side
      const l = p.x - b[0], rr = b[2] - p.x, t = p.z - b[1], bt = b[3] - p.z, m = Math.min(l, rr, t, bt);
      if (m === l) p.x = b[0] - r; else if (m === rr) p.x = b[2] + r; else if (m === t) p.z = b[1] - r; else p.z = b[3] + r;
    }
  }
}

export class Walk {
  constructor(O) {
    this.O = O; this.keys = {}; this.me = null; this.sendT = 0; this.last = ''; this.yaw = Math.PI; this.pitch = .38; this.dist = 4.4; this.manualT = 0; this.kn = 0;
    if (!document.getElementById('vo3wkcss')) { const s = document.createElement('style'); s.id = 'vo3wkcss'; s.textContent = CSS; document.head.appendChild(s); }
    const u = this.ui = document.createElement('div'); u.className = 'vo3wk';
    u.innerHTML = `<div class=vo3wkh><b>WALKING</b> &nbsp;WASD / arrows &middot; SHIFT run &middot; SPACE jump &middot; E use &middot; Q back to desk</div><div class=vo3wkf></div>
      <button class=vo3wkp><kbd>E</kbd><span></span></button><button class=vo3wkx>BACK TO MY DESK</button>
      <div class=vo3wkd><span></span><button data-k=up aria-label="Walk forward">&#9650;</button><span></span><button data-k=left aria-label="Walk left">&#9664;</button><button data-k=down aria-label="Walk back">&#9660;</button><button data-k=right aria-label="Walk right">&#9654;</button></div>
      <div class=vo3wkr><button data-k=run>RUN</button><button data-k=jump>JUMP</button></div>`;
    O.el.appendChild(u);
    this.floorE = u.querySelector('.vo3wkf'); this.prE = u.querySelector('.vo3wkp'); this.prT = u.querySelector('.vo3wkp span');
    this.prE.onclick = e => { e.stopPropagation(); this.use(); };
    u.querySelector('.vo3wkx').onclick = e => { e.stopPropagation(); this.stop(); };
    u.querySelectorAll('.vo3wkd button,.vo3wkr button').forEach(b => {
      const k = b.dataset.k, dn = e => { e.preventDefault(); if (k === 'jump') this.jump(); else this.keys[k] = 1; b.classList.add('on'); }, up = () => { if (k !== 'jump') this.keys[k] = 0; b.classList.remove('on'); };
      b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
    });
    // elevator panel
    const el = this.elE = document.createElement('div'); el.className = 'vo3el'; O.el.appendChild(el);
    el.addEventListener('pointerdown', e => { if (e.target === el) this.closeElev(); });
    this.fade = document.createElement('div'); this.fade.className = 'vo3fd'; O.el.appendChild(this.fade);
    const KM = {ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', Shift: 'run'};
    const typing = e => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); };
    addEventListener('keydown', e => {
      if (!this.me || typing(e) || this.O.modal || this.lock) return;
      if (this.elOpen) { if (e.key === 'Escape') { this.closeElev(); e.preventDefault(); } else if (/^[1-3]$/.test(e.key)) { const k = ['g', 'o', 'r'][+e.key - 1]; this.ride(k); e.preventDefault(); } return; }
      const k = KM[e.key]; if (k) { this.keys[k] = 1; e.preventDefault(); e.stopPropagation(); return; }
      if (e.key === ' ') { this.jump(); e.preventDefault(); e.stopPropagation(); }
      else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') { this.use(); e.preventDefault(); e.stopPropagation(); }
      else if (e.key === 'q' || e.key === 'Q' || e.key === 'Escape') { this.stop(); e.preventDefault(); }
    }, true);
    addEventListener('keyup', e => { const k = KM[e.key]; if (k) this.keys[k] = 0; }, true);
    addEventListener('blur', () => { this.keys = {}; });
  }
  // ---------- my walker
  can(a) { return !!(a && a.me && (a.mode === 'seated' || a.mode === 'sitting') && !this.O.busy(a) && !a.leaving && a.root.visible); }
  start(opt) {
    const O = this.O, a = O.meAv; if (!this.can(a)) return false;
    const s = a.seat, x = s.x + (s.x > 0 ? -.75 : .75) * 0, z = s.aisle;
    const w = a.wk = {x: s.x, y: 0, z, h: s.x <= 0 ? Math.PI / 2 : -Math.PI / 2, f: 'o', vx: 0, vz: 0, vy: 0, air: 0, sp: 0, hint: -1};
    if (opt && opt.at) Object.assign(w, opt.at);
    a.mode = 'free'; a.sitK = 0; a.standK = 0; a.path = null; a.emo = null; a.idleK = null; a.typing = false; a.mv = 0;
    a.root.position.set(w.x, w.y, w.z); a.root.rotation.y = w.h;
    const d = O.room.desks[s.i]; if (d) d.occ = 0;
    this.me = a; this.keys = {}; this.yaw = w.h; this.ui.classList.add('on'); O.ui.hideCard(); this.send(1);
    O.fx.sparkle(w.x, .4, w.z, 16, [1, .85, .5]); O.sfx('whoosh');
    return true;
  }
  stop(teleport) {
    const a = this.me; if (!a) return; this.me = null; this.keys = {}; this.ui.classList.remove('on'); this.prE.classList.remove('on'); this.closeElev();
    try { this.O.api.walk && this.O.api.walk(null); } catch (e) {} this.last = '';
    this.home(a, teleport);
  }
  // back to the chair: walk if close on the Sales Floor, otherwise a quick sparkle
  home(a, teleport) {
    const O = this.O, w = a.wk, s = a.seat; a.wk = null; a.mv = 0; a.runK = 0; a.poseFx = null; a.root.rotation.set(0, a.root.rotation.y, 0);
    if (!s) return;
    const d = O.room.desks[s.i];
    const near = w && w.f === 'o' && Math.hypot(w.x - s.x, w.z - s.aisle) < 3.2 && !teleport;
    if (near) {
      a.root.position.set(w.x, 0, w.z); a.walk([[s.x, s.aisle], [s.x, s.sz]], () => { a.mode = 'sitting'; a.turnTo = 0; if (d && d.av === a) d.occ = 1; });
    } else {
      O.fx.sparkle(a.root.position.x, a.root.position.y + .8, a.root.position.z, 24, [1, .85, .5]);
      a.sitNow(); if (d && d.av === a) d.occ = 1; O.fx.sparkle(s.x, .8, s.sz, 24, [1, .85, .5]); O.sfx('pop');
    }
  }
  jump() { const a = this.me; if (!a || !a.wk || a.wk.air || a.knd) return; a.wk.vy = 5.2; a.wk.air = 1; this.O.sfx('whoosh', .5); }
  // what can I do right here?
  prompt() {
    const a = this.me, w = a && a.wk; if (!w || a.knd || this.lock) return null;
    const O = this.O;
    if (w.f === 'o' && a.seat && Math.hypot(w.x - a.seat.x, w.z - a.seat.sz) < 1.25) return {k: 'sit', t: 'SIT AT MY DESK'};
    if (w.x > ELEV.x0 - .2 && w.x < ELEV.x1 + .2 && w.z < -6.35 && w.z > ELEV.z0 - .3 && w.f !== 'd') return {k: 'elev', t: 'ELEVATOR'};
    if (a.look && a.look.W > 0 && O.drive && !a.drv && (w.f === 'o' || w.f === 'd')) { const p = O.hook && O.hook('carPrompt', a); if (p) return p; }
    const ext = O.hook && O.hook('walkPrompt', a); if (ext) return ext;
    if (a.look && a.look.W > 0 && (w.f === 'd')) return {k: 'drive', t: 'DRIVE MY CAR HERE'};
    return null;
  }
  use() {
    const a = this.me; if (!a) return; const p = this.prompt(); if (!p) return;
    const O = this.O;
    if (p.k === 'sit') { this.stop(); return; }
    if (p.k === 'elev') { this.openElev(); return; }
    if (p.k === 'drive') { if (O.drive) O.drive.startHere(a); return; }
    if (O.hook) O.hook('walkUse', p, a);
  }
  // ---------- elevator
  openElev() {
    const a = this.me; if (!a) return; this.elOpen = 1; this.keys = {};
    const here = a.wk.f;
    this.elE.innerHTML = `<div class=vo3elp><h3>OWQ TOWER</h3><p>Pick a floor. Teammates on that floor see you step out.</p>${['r', 'o', 'g'].map((k, i) => `<button data-f=${k} class="${k === here ? 'here' : ''}">${['3', '2', '1'][i]}&nbsp;&nbsp;${FLOORS[k].name}${k === here ? ' &middot; YOU ARE HERE' : ''}<small>${FLOORS[k].sub}</small></button>`).join('')}<button class=x>CLOSE (ESC)</button></div>`;
    this.elE.querySelectorAll('button[data-f]').forEach(b => b.onclick = e => { e.stopPropagation(); this.ride(b.dataset.f); });
    this.elE.querySelector('.x').onclick = e => { e.stopPropagation(); this.closeElev(); };
    this.elE.classList.add('on'); this.O.sfx('click');
  }
  closeElev() { this.elOpen = 0; this.elE.classList.remove('on'); }
  ride(f) {
    const a = this.me; if (!a || !a.wk || !FLOORS[f]) return; this.closeElev();
    const O = this.O, w = a.wk;
    if (f === w.f) { this.exitElev(a, f); return; }
    this.fade.classList.add('on'); O.sfx('ding');
    setTimeout(() => {
      if (this.me !== a || !a.wk) { this.fade.classList.remove('on'); return; }
      a.wk.f = f; this.exitElev(a, f); this.snap = 1; this.send(1);
      setTimeout(() => this.fade.classList.remove('on'), 160);
      O.ui.toast(FLOORS[f].name + ': ' + FLOORS[f].sub);
    }, 520);
  }
  exitElev(a, f) {
    const w = a.wk, O = this.O; w.x = ELEVP.x; w.z = ELEVP.z + .9; w.y = FLOORS[f].y; w.h = f === 'r' ? -1.05 : 0; w.vy = 0; w.air = 0; this.yaw = w.h;
    if (O.hook) O.hook('elevOpen', f);
    if (f === 'o') O.room.elevOpen(2);
  }
  // ---------- each frame
  tick(dt, t) {
    const O = this.O;
    O.av.forEach(a => {
      if (a === this.me) { this.mine(a, dt, t); return; }
      if (a.wk && a.wk.rt) this.follow(a, dt);
    });
    if (this.me) {
      const p = this.prompt(); const k = p ? p.k + p.t : '';
      if (k !== this._pk) { this._pk = k; this.prE.classList.toggle('on', !!p); if (p) this.prT.textContent = p.t; }
      const f = this.me.wk && this.me.wk.f; if (f !== this._fl) { this._fl = f; this.floorE.textContent = f === 'd' ? 'SKY DECK' : (FLOORS[f] || {}).name || ''; }
    }
  }
  mine(a, dt, t) {
    const w = a.wk; if (!w) return;
    const K = this.lock ? {} : this.keys, f = (K.up ? 1 : 0) - (K.down ? 1 : 0), s = (K.right ? 1 : 0) - (K.left ? 1 : 0);
    // camera-relative: forward is where the camera looks
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), rx = -fz, rz = fx;
    let mx = fx * f + rx * s, mz = fz * f + rz * s; const ml = Math.hypot(mx, mz);
    const run = K.run ? 1 : 0, spd = run ? RUN : SPD;
    if (a.knd) { mx = mz = 0; }
    const tvx = ml ? mx / ml * spd : 0, tvz = ml ? mz / ml * spd : 0;
    const acc = w.air ? 3 : 12;
    w.vx = damp(w.vx, tvx, acc, dt); w.vz = damp(w.vz, tvz, acc, dt);
    if (ml && !a.knd) { let dh = Math.atan2(mx, mz) - w.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); w.h += dh * Math.min(1, dt * 12); }
    const ox = w.x, oz = w.z;
    const p = {x: w.x + w.vx * dt, z: w.z + w.vz * dt};
    if (a.knd) { const k = a.knd; p.x += k.dx * k.v * dt; p.z += k.dz * k.v * dt; k.v = Math.max(0, k.v - 9 * dt); }
    this.collide(a, w, p, ox, oz, dt);
    // vertical: jumping and falling
    const gy = this.groundY(w);
    if (w.air) { w.vy -= G * dt; w.y += w.vy * dt; if (gy !== null && w.y <= gy && w.vy <= 0) { w.y = gy; w.air = 0; w.vy = 0; } }
    else if (gy === null) { w.air = 1; w.vy = 0; }
    else w.y = damp(w.y, gy, 30, dt);
    if (w.y < -40 && w.f === 'd') this.respawn(a);
    // walking animation
    const moved = Math.hypot(w.x - ox, w.z - oz); w.sp = moved / Math.max(dt, 1e-3);
    a.mv = w.sp > .15 && !w.air ? 1 : 0; a.runK = damp(a.runK || 0, w.sp > 3.4 ? 1 : 0, 6, dt); a.walkPh += moved * 5.4;
    a.root.position.set(w.x, w.y, w.z); a.root.rotation.y = w.h;
    // the camera trails behind while walking forward
    if (ml && f > 0 && t > this.manualT) { let dy = w.h - this.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); this.yaw += dy * Math.min(1, dt * 1.6); }
    if ((this.sendT -= dt) <= 0) { this.sendT = .1; this.send(); }
  }
  // ground height for a walker (null = nothing underfoot)
  groundY(w) {
    if (w.f === 'd') { const q = skyAt(w.x, w.z, w.hint); w.hint = q.i; if (q.gap || !q.on) return null; return q.y; }
    return FLOORS[w.f] ? FLOORS[w.f].y : 0;
  }
  collide(a, w, p, ox, oz, dt) {
    const O = this.O;
    if (w.f === 'o') {
      // out through the Sky Deck door?
      const inDoor = p.z > DOOR.z0 + WR * .6 && p.z < DOOR.z1 - WR * .6;
      if (p.x < ROOM.x0 + WR && inDoor) { if (p.x < TOWER.x0) { w.f = 'd'; w.hint = -1; } }
      else p.x = Math.max(p.x, ROOM.x0 + WR);
      p.x = Math.min(p.x, ROOM.x1 - WR); p.z = Math.min(p.z, ROOM.z1 - WR);
      const inElev = p.x > ELEV.x0 + WR && p.x < ELEV.x1 - WR;
      if (p.z < ROOM.z0 + WR && !(inElev && O.room.elev.o > .55)) p.z = Math.max(p.z, ROOM.z0 + WR);
      if (p.z < ROOM.z0) { p.x = clamp(p.x, ELEV.x0 + WR, ELEV.x1 - WR); p.z = Math.max(p.z, ELEV.z0 + WR); }
      if (p.z > -6.6) pushOut(p, WALKBOX, WR);
      // ask the elevator to open when someone walks up
      if (Math.abs(p.x - ELEVP.x) < 1.2 && p.z < -5.6) O.room.elevOpen(1.2);
    } else if (w.f === 'd') {
      if (p.x > TOWER.x0 - .05 && p.z > DOOR.z0 && p.z < DOOR.z1) { if (p.x > TOWER.x0 + .1) w.f = 'o'; }
      else if (skyRail(p.x, p.z, WR, w.hint)) { p.x = ox; p.z = oz; w.vx *= -.2; w.vz *= -.2; }
    } else {
      const R = FLOORRECT[w.f];
      const inElev = p.x > ELEV.x0 + WR && p.x < ELEV.x1 - WR;
      if (R) { p.x = clamp(p.x, R.x0 + WR, R.x1 - WR); p.z = Math.min(p.z, R.z1 - WR); if (!(inElev && p.z < ELEVP.z + .4)) p.z = Math.max(p.z, R.z0 + WR); }
      if (p.z < ELEVP.z) { p.x = clamp(p.x, ELEV.x0 + WR, ELEV.x1 - WR); p.z = Math.max(p.z, ELEV.z0 + WR); }
      pushOut(p, FLOORBOX[w.f] || [], WR);
      if (O.hook) O.hook('walkCollide', w, p, WR);
    }
    // soft bumps with other walkers on my floor
    O.av.forEach(b => {
      if (b === a || !b.wk || b.wk.f !== w.f || b.leaving) return; const bx = b.root.position.x, bz = b.root.position.z, dx = p.x - bx, dz = p.z - bz, d = Math.hypot(dx, dz);
      if (d < WR * 2 && d > 1e-4) { const k = (WR * 2 - d) / d * .6; p.x += dx * k; p.z += dz * k; }
    });
    // parked or moving cars block walkers
    O.av.forEach(b => { const d0 = b.drv; if (!d0 || (d0.k ? 'd' : 'o') !== w.f) return; const dx = p.x - d0.x, dz = p.z - d0.z, d = Math.hypot(dx, dz), rr = .95 + WR; if (d < rr && d > 1e-4) { const k = (rr - d) / d; p.x += dx * k; p.z += dz * k; } });
    w.x = p.x; w.z = p.z;
  }
  respawn(a) {
    const w = a.wk, O = this.O; this.fade.classList.add('on'); O.sfx('whoosh');
    setTimeout(() => { if (a.wk !== w) return; w.f = 'd'; w.x = DOOR.x - 1.3; w.z = (DOOR.z0 + DOOR.z1) / 2; w.y = 0; w.vy = 0; w.air = 0; w.hint = -1; w.h = -Math.PI / 2; this.yaw = w.h; this.snap = 1; this.send(1); setTimeout(() => this.fade.classList.remove('on'), 140); O.ui.toast('You fell off the Sky Deck. Back at the door!'); }, 380);
  }
  send(force) {
    const a = this.me, w = a && a.wk; if (!w) return;
    const st = {x: +w.x.toFixed(2), y: +w.y.toFixed(2), z: +w.z.toFixed(2), h: +w.h.toFixed(2), f: w.f, s: +Math.min(9, w.sp || 0).toFixed(1), n: this.kn};
    const k = JSON.stringify(st); if (!force && k === this.last) return; this.last = k;
    try { this.O.api.walk && this.O.api.walk(st); } catch (e) {}
  }
  // ---------- other people walking
  remote(a, wk) {
    const O = this.O;
    if (!wk || typeof wk !== 'object' || !FLOORS[wk.f] && wk.f !== 'd') { if (a.wk) this.home(a, !(a.wk && a.wk.f === 'o')); return; }
    if (a.drv) return;
    const x = +wk.x || 0, y = +wk.y || 0, z = +wk.z || 0, h = +wk.h || 0;
    if (!a.wk) {
      if (a.mode !== 'seated' && a.mode !== 'sitting' && a.mode !== 'walk' && a.mode !== 'free') return;
      a.wk = {x, y, z, h, f: wk.f, tx: x, ty: y, tz: z, th: h, s: 0, rt: performance.now()}; a.mode = 'free'; a.path = null; a.sitK = 0; a.standK = 0;
      const d = O.room.desks[a.seat && a.seat.i]; if (d && d.av === a) d.occ = 0;
      a.root.position.set(x, y, z); a.root.rotation.y = h; O.fx.sparkle(x, y + .4, z, 12, [1, .85, .5]);
    }
    const w = a.wk; if (wk.f !== w.f) { w.f = wk.f; w.x = x; w.y = y; w.z = z; }
    w.tx = x; w.ty = y; w.tz = z; w.th = h; w.ts = +wk.s || 0; w.rt = performance.now();
    if ((+wk.n || 0) !== (w.n || 0)) { w.n = +wk.n || 0; }
  }
  follow(a, dt) {
    const w = a.wk, ox = w.x, oz = w.z;
    w.x = damp(w.x, w.tx, 9, dt); w.z = damp(w.z, w.tz, 9, dt); w.y = damp(w.y, w.ty, 12, dt);
    let dh = w.th - w.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); w.h += dh * Math.min(1, dt * 10);
    const moved = Math.hypot(w.x - ox, w.z - oz); a.mv = moved / Math.max(dt, 1e-3) > .2 || w.ts > .3 ? 1 : 0; a.runK = damp(a.runK || 0, w.ts > 3.4 ? 1 : 0, 6, dt); a.walkPh += Math.max(moved, a.mv ? w.ts * dt * .7 : 0) * 5.4;
    a.root.position.set(w.x, w.y, w.z); a.root.rotation.y = w.h;
  }
  // ---------- knockdowns (a car hit someone)
  knock(a, dx, dz, v) {
    if (!a || a.knd) return;
    const l = Math.hypot(dx, dz) || 1; a.knd = {t: 0, dx: dx / l, dz: dz / l, v: Math.min(9, 3 + v * .55), spin: (Math.random() < .5 ? -1 : 1)};
    const O = this.O, p = a.root.position; O.sfx('thud'); O.sfx('pop'); O.shk = Math.max(O.shk || 0, .35); O.fx.sparkle(p.x, p.y + 1, p.z, 30, [1, .9, .4]);
    if (a === this.me) { this.kn++; this.send(1); }
    a.poseFx = (Z, dt, t) => this.knockPose(a, Z, dt, t);
  }
  knockPose(a, Z, dt, t) {
    const k = a.knd; if (!k) { a.poseFx = null; return; }
    k.t += dt;
    const T1 = .8, T2 = 1.9, T3 = 2.5, ph = k.t;
    // flail while flying, flat on the back, then get up
    let fl = ph < T1 ? 1 : 0, down = ph < T1 ? 0 : ph < T2 ? 1 : 1 - (ph - T2) / (T3 - T2);
    if (fl) { const s = Math.sin(ph * 26); Z.lsz = 2.2 + s * .5; Z.rsz = -2.2 - s * .5; Z.lsx = -.6 + s * .4; Z.rsx = -.6 - s * .4; Z.ltx = -.8 + s * .5; Z.rtx = -.8 - s * .5; Z.lkx = 1; Z.rkx = 1; Z.hx = -.3; }
    else if (down > 0) { Z.lsz = 1.4; Z.rsz = -1.4; Z.lsx = -.2; Z.rsx = -.2; Z.lex = -.2; Z.rex = -.2; Z.ltx = -.15; Z.rtx = -.25; Z.lkx = .3; Z.rkx = .2; Z.hx = .25 * Math.sin(ph * 5); Z.hz = .25 * Math.cos(ph * 5); }
    // body: arc up and tumble, then lie flat
    const arc = ph < T1 ? Math.sin(ph / T1 * Math.PI) * 1.3 : 0;
    a.rig.position.y = arc;
    const tilt = ph < T1 ? ph / T1 * Math.PI * 1.5 * k.spin : down * -Math.PI / 2 * .96;
    a.rig.rotation.x = ph < T1 ? tilt : tilt; a.rig.rotation.z = ph < T1 ? Math.sin(ph * 8) * .4 : 0;
    if (down > 0 && ph < T2) { a.rig.position.y = .16; }
    if (ph >= T3) { a.knd = null; a.poseFx = null; a.rig.position.y = 0; a.rig.rotation.x = 0; a.rig.rotation.z = 0; }
    // dizzy stars over the head while down
    if (ph > T1 && ph < T2 && Math.random() < dt * 8) { const p = a.root.position; this.O.fx.sparkle(p.x + (Math.random() - .5) * .4, p.y + .5, p.z + (Math.random() - .5) * .4, 2, [1, .9, .3]); }
  }
  // ---------- third-person camera behind me
  cam(P, T) {
    const a = this.me, w = a && a.wk; if (!w || this.lock) return false;
    const y0 = w.y + (a.knd ? .5 : 1.25);
    T.set(w.x, y0, w.z);
    const d = this.dist, cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    P.set(w.x - Math.sin(this.yaw) * d * cp, y0 + d * sp + .2, w.z - Math.cos(this.yaw) * d * cp);
    if (w.f === 'o' && P.y < 5.3) { // keep the camera inside the room
      const inside = w.x > -10 && w.z < 11.5;
      if (inside) { P.x = clamp(P.x, -9.75, 9.75); P.z = clamp(P.z, -6.75, 11.4); P.y = Math.min(P.y, 4.9); }
    } else if ((w.f === 'r' || w.f === 'g') && P.y < w.y + .4) P.y = w.y + .4;
    if (w.f === 'g') { P.y = Math.min(P.y, RANGEY + 4.8); P.x = clamp(P.x, -9.7, 9.7); P.z = clamp(P.z, -6.7, 11.3); }
    return true;
  }
  drag(dx, dy) { this.yaw -= dx * .006; this.pitch = clamp(this.pitch + dy * .004, .05, 1.2); this.manualT = this.O.t + 3; }
  zoom(k) { this.dist = clamp(this.dist * k, 2.2, 9); }
}
