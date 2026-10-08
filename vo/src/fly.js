// Flying: own a plane (Battle Pass or a loot crate), walk to the hangar pad on the Sky Park and take off over the
// city. W/S or up/down pitch, A/D or left/right bank and turn, SHIFT boost, SPACE slow down, E land back on the roof.
// Turn speed follows the same steering sensitivity as the cars. Ring Run: fly through the rings in order.
// Shared through presence 'fl' ({x,y,z,q:[x,y,z,w],c,v}).
import * as THREE from 'three';
import {cv, tex} from './tex.js';
import {clamp, damp, lerp} from './util.js';
import {EXT} from './cosm.js';
import {ROOFY, GROUNDY, TOWER, RINGS} from './world.js';
import {PARK} from './derby.js';
import {steer0} from './drive.js';

const PAD = {x: 24, z: -14, h: Math.PI / 2};      // launch pad on the Sky Park, facing east (+x)
const SPAN = 9;                                      // flying wingspan in metres
const VMIN = 18, VCRU = 34, VBOOST = 66;
const CSS = `.vo3fl{position:absolute;inset:0;pointer-events:none;z-index:5;display:none}.vo3fl.on{display:block}
.vo3flh{position:absolute;top:62px;left:50%;transform:translateX(-50%);padding:7px 14px;border-radius:14px;background:rgba(12,6,12,.72);border:1px solid rgba(255,255,255,.14);font:700 10px Verdana,sans-serif;letter-spacing:.1em;color:#ffd0da;width:max-content;max-width:calc(100% - 340px);white-space:normal;text-align:center;line-height:1.55;}
.vo3flh b{color:#fff}.vo3fli{position:absolute;top:96px;left:50%;transform:translateX(-50%);display:flex;gap:22px;font:900 20px Verdana,sans-serif;color:#fff;text-shadow:0 2px 12px rgba(255,31,79,.8)}
.vo3fli small{display:block;font-size:9px;letter-spacing:.16em;color:#ffb3c2;text-align:center}
.vo3flr{position:absolute;top:150px;left:50%;transform:translateX(-50%);font:800 12px Verdana,sans-serif;letter-spacing:.1em;color:#ffd166;text-shadow:0 2px 10px #000;white-space:nowrap}
.vo3flb{position:absolute;top:190px;left:50%;transform:translateX(-50%);font:900 34px Verdana,sans-serif;letter-spacing:.1em;color:#fff;text-shadow:0 0 22px #ff1f4f,0 2px 10px #000;opacity:0;transition:opacity .2s;white-space:nowrap}.vo3flb.on{opacity:1}
.vo3flx{position:absolute;top:58px;right:14px;pointer-events:auto;padding:9px 14px;border-radius:12px;border:0;background:#ff1f4f;color:#fff;font:800 11px Verdana,sans-serif;letter-spacing:.1em;cursor:pointer}
.vo3flt{position:absolute;top:104px;right:14px;pointer-events:auto;display:flex;align-items:center;gap:8px;padding:7px 12px;border-radius:12px;background:rgba(12,6,12,.72);border:1px solid rgba(255,255,255,.14);font:800 10px Verdana,sans-serif;letter-spacing:.1em;color:#ffd0da}
.vo3flt input{width:110px;accent-color:#ff1f4f}.vo3flt b{min-width:16px;text-align:right;color:#fff}
.vo3flp{position:absolute;bottom:92px;display:grid;grid-template-columns:56px 56px 56px;gap:6px;pointer-events:auto;left:16px}
.vo3flp button,.vo3flq button{height:56px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(12,6,12,.7);color:#fff;font:800 16px Verdana,sans-serif;touch-action:none;cursor:pointer}
.vo3flp button.on,.vo3flq button.on{background:#ff1f4f;border-color:#ff1f4f}.vo3flq{position:absolute;bottom:92px;right:16px;display:flex;flex-direction:column;gap:8px;pointer-events:auto}.vo3flq button{width:86px;font-size:11px;letter-spacing:.08em}
.vo3flf{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .35s;pointer-events:none}.vo3flf.on{opacity:1}`;

export class Fly {
  constructor(O, parent) {
    this.O = O; this.me = null; this.keys = {}; this.sendT = 0; this.last = ''; this.rings = []; this.ri = 0; this.rt0 = 0;
    const G = this.group = new THREE.Group(); G.name = 'flight'; parent.add(G);
    this.build(G);
    if (!document.getElementById('vo3flcss')) { const s = document.createElement('style'); s.id = 'vo3flcss'; s.textContent = CSS; document.head.appendChild(s); }
    const u = this.ui = document.createElement('div'); u.className = 'vo3fl';
    u.innerHTML = `<div class=vo3flh><b>FLYING</b> &nbsp;W S pitch &middot; A D turn &middot; SHIFT boost &middot; SPACE slow &middot; E land</div>
      <div class=vo3fli><div><span class=spd>0</span><small>KNOTS</small></div><div><span class=alt>0</span><small>FEET</small></div></div><div class=vo3flr></div><div class=vo3flb></div><div class=vo3flf></div>
      <label class=vo3flt title="How fast you turn with the arrow keys or WASD (same as driving)">TURNING<input type=range min=1 max=10 step=1 aria-label="Turn sensitivity"><b>5</b></label>
      <div class=vo3flp><span></span><button data-k=up>&#9650;</button><span></span><button data-k=left>&#9664;</button><button data-k=down>&#9660;</button><button data-k=right>&#9654;</button></div>
      <div class=vo3flq><button data-k=boost>BOOST</button><button data-k=slow>SLOW</button></div><button class=vo3flx>LAND ON THE ROOF</button>`;
    O.el.appendChild(u);
    this.spdE = u.querySelector('.spd'); this.altE = u.querySelector('.alt'); this.rE = u.querySelector('.vo3flr'); this.bE = u.querySelector('.vo3flb'); this.fade = u.querySelector('.vo3flf');
    this.sl = u.querySelector('.vo3flt input'); this.slv = u.querySelector('.vo3flt b');
    this.sl.addEventListener('input', () => this.setSens(+this.sl.value)); ['pointerdown', 'keydown'].forEach(ev => this.sl.addEventListener(ev, e => e.stopPropagation()));
    u.querySelectorAll('.vo3flp button,.vo3flq button').forEach(b => { const k = b.dataset.k, dn = e => { e.preventDefault(); this.keys[k] = 1; b.classList.add('on'); }, up = () => { this.keys[k] = 0; b.classList.remove('on'); }; b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up); });
    u.querySelector('.vo3flx').onclick = e => { e.stopPropagation(); this.land(); };
    const KM = {ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', Shift: 'boost', ' ': 'slow'};
    addEventListener('keydown', e => {
      if (e.__vo3 || !this.me) return; const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (/^(e|E|Escape|\[|\])$/.test(e.key) || KM[e.key]) e.__vo3 = 1;
      const k = KM[e.key]; if (k) { this.keys[k] = 1; e.preventDefault(); e.stopPropagation(); return; }
      if (e.key === '[' || e.key === ']') { this.setSens(this.sens + (e.key === ']' ? 1 : -1)); e.preventDefault(); return; }
      if (e.key === 'e' || e.key === 'E' || e.key === 'Escape') { this.land(); e.preventDefault(); e.stopPropagation(); }
    }, true);
    addEventListener('keyup', e => { const k = KM[e.key]; if (k) this.keys[k] = 0; }, true);
    addEventListener('blur', () => { this.keys = {}; });
  }
  setSens(v) { v = Math.max(1, Math.min(10, Math.round(v) || 5)); this.sens = v; try { localStorage.setItem('owq_steer', String(v)); } catch (e) {} if (this.sl) { this.sl.value = v; this.slv.textContent = v; } if (this.O.drive) { this.O.drive.sens = v; if (this.O.drive.sl) { this.O.drive.sl.value = v; this.O.drive.slv.textContent = v; } } }
  build(G) {
    const Y = ROOFY, add = (g, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); G.add(o); return o; };
    // hangar pad: a runway strip to the east edge of the Sky Park with lights and a sign
    const pc = cv(256, 1024), px = pc.getContext('2d'); px.fillStyle = '#121116'; px.fillRect(0, 0, 256, 1024); px.fillStyle = '#ffd166';
    for (let i = 0; i < 1024; i += 96) px.fillRect(118, i, 20, 52); px.fillStyle = '#ff1f4f'; px.fillRect(0, 0, 12, 1024); px.fillRect(244, 0, 12, 1024);
    px.font = '900 70px Verdana,sans-serif'; px.fillStyle = '#fff'; px.textAlign = 'center'; px.save(); px.translate(128, 900); px.rotate(-Math.PI / 2); px.fillText('HANGAR', 0, 24); px.restore();
    const L = PARK.x1 - PAD.x + 4;
    add(new THREE.PlaneGeometry(6, L).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({map: tex(pc, {mips: true}), roughness: .6}), PAD.x + L / 2 - 4, Y + .025, PAD.z, 0, Math.PI / 2, 0);
    const lamp = new THREE.MeshBasicMaterial({color: new THREE.Color(.4, 3.4, 1.2), toneMapped: false});
    for (let x = PAD.x - 3; x < PARK.x1; x += 2) { [-3.2, 3.2].forEach(dz => add(new THREE.SphereGeometry(.09, 8, 6), lamp, x, Y + .08, PAD.z + dz)); }
    // a hangar shell behind the pad
    const hm = new THREE.MeshStandardMaterial({color: '#1c1b22', metalness: .7, roughness: .4, side: THREE.DoubleSide});
    const sh = add(new THREE.CylinderGeometry(5.2, 5.2, 9, 24, 1, true, 0, Math.PI), hm, PAD.x - 6.5, Y, PAD.z, 0, 0, Math.PI / 2); sh.rotation.set(0, Math.PI / 2, Math.PI / 2);
    const c = cv(1024, 256), g = c.getContext('2d'); g.font = '900 120px Verdana,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#ff2d78'; g.shadowBlur = 40; g.fillStyle = '#fff0f6'; g.fillText('OWQ AIR', 512, 128);
    add(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({map: tex(c, {mips: true}), transparent: true, depthWrite: false, color: new THREE.Color(2.2, 2.2, 2.2), toneMapped: false, side: THREE.DoubleSide}), PAD.x - 6.2, Y + 5.6, PAD.z, 0, Math.PI / 2, 0);
    // Ring Run: a loop of rings around the city and the tower
    const RP = RINGS;
    const rm = new THREE.MeshBasicMaterial({color: new THREE.Color(3.6, 2.6, .6), toneMapped: false}), rn = new THREE.MeshBasicMaterial({color: new THREE.Color(.4, 2.3, 2.7), toneMapped: false});
    this.rings = RP.map((p, i) => {
      const n = RP[(i + 1) % RP.length], m = new THREE.Mesh(new THREE.TorusGeometry(9, .55, 8, 40), i ? rm : rn);
      m.position.set(p[0], p[1], p[2]); m.lookAt(n[0], n[1], n[2]); G.add(m); return {m, p: m.position, i};
    });
    this.parked = null;
  }
  // ---------- walking hooks: the pad on the roof
  walkPrompt(a) {
    const w = a.wk; if (!w || w.f !== 'r' || this.me) return null;
    if (Math.abs(w.x - PAD.x - 2) < 6 && Math.abs(w.z - PAD.z) < 3.6) {
      if (!(a.look && a.look.F > 0)) return {k: 'noplane', t: 'NO PLANE YET: GET ONE IN THE BATTLE PASS OR A CRATE'};
      return {k: 'fly', t: 'FLY MY PLANE'};
    }
    return null;
  }
  walkUse(p, a) { if (p.k === 'fly') { this.start(a); return true; } if (p.k === 'noplane') { this.O.ui.toast('Planes unlock in the Battle Pass and come out of the Ride loot crates.'); return true; } return null; }
  model(id) {
    let m = null; try { if (EXT.plane) m = EXT.plane(id); } catch (e) { m = null; }
    if (!m) { m = new THREE.Group(); const b = new THREE.MeshStandardMaterial({color: '#ff1f4f', roughness: .4, metalness: .3}); m.add(new THREE.Mesh(new THREE.BoxGeometry(.25, .25, 1.6), b)); m.add(new THREE.Mesh(new THREE.BoxGeometry(2, .05, .4), b)); m.userData.span = 2; }
    const sp = m.userData.span || 1; m.scale.setScalar(SPAN / sp); return m;
  }
  // ---------- my flight
  start(a) {
    const O = this.O; if (!a || !a.wk || this.me || !(a.look && a.look.F > 0)) return false;
    const m = this.model(a.look.F); this.group.add(m); O.warm && O.warm(m);
    const f = {m, x: PAD.x - 2, y: ROOFY + 1.2, z: PAD.z, yaw: PAD.h, pitch: 0, roll: 0, v: 12, run: 1, c: a.look.F, q: new THREE.Quaternion()};
    O.walk.me = null; O.walk.ui.classList.remove('on'); O.walk.prE.classList.remove('on'); try { O.api.walk && O.api.walk(null); } catch (e) {}
    a.wk = null; a.mv = 0; a.fly = f; a.mode = 'fly'; a.sitK = 1; a.root.scale.setScalar(.6);
    this.me = a; this.keys = {}; this.sens = steer0(); this.sl.value = this.sens; this.slv.textContent = this.sens;
    this.ui.classList.add('on'); this.ri = 0; this.rt0 = 0; this.ringUI(); O.sfx('vroom'); this.big('TAKE OFF!'); this.snap = 1; this.send(1);
    return true;
  }
  land(crash) {
    const a = this.me, O = this.O; if (!a || this.tp) return; this.tp = 1; this.fade.classList.add('on'); O.sfx('whoosh');
    setTimeout(() => {
      const f = a.fly; if (f) this.group.remove(f.m); a.fly = null; this.me = null; this.keys = {}; this.ui.classList.remove('on'); this.tp = 0;
      a.root.scale.setScalar(1); a.root.rotation.set(0, 0, 0); a.mode = 'seated';
      try { O.api.state && O.api.state('fl', null); } catch (e) {} this.last = '';
      O.walk.start({at: {x: PAD.x - 4, z: PAD.z + 2.2, y: ROOFY, h: -Math.PI / 2, f: 'r'}}); O.walk.snap = 1;
      setTimeout(() => this.fade.classList.remove('on'), 150);
      if (crash) O.ui.toast('Crashed! Your plane is back in the hangar.');
    }, 400);
  }
  fwd(f, v) { const cp = Math.cos(f.pitch); return v.set(Math.sin(f.yaw) * cp, Math.sin(f.pitch), Math.cos(f.yaw) * cp); }
  tick(dt, t) {
    const O = this.O;
    O.av.forEach(a => { if (a === this.me) this.mine(a, dt, t); else if (a.fly && a.fly.rt) this.follow(a, dt); });
    // my own plane waits on the pad while I'm on the roof
    const me = O.meAv, want = me && !this.me && me.wk && me.wk.f === 'r' && me.look && me.look.F > 0 ? me.look.F : 0;
    if (want !== (this.parkedId || 0)) { if (this.parked) this.group.remove(this.parked); this.parked = null; this.parkedId = want; if (want) { this.parked = this.model(want); this.parked.position.set(PAD.x - 2, ROOFY + 1.1, PAD.z); this.parked.rotation.y = PAD.h - Math.PI / 2; /* nose down the runway (models face +x) */ this.group.add(this.parked); } }
    this.rings.forEach((r, i) => { r.m.visible = !!this.me || O.wld.zone !== 'o'; r.m.rotation.z += dt * .4 * (i % 2 ? 1 : -1); });
  }
  mine(a, dt, t) {
    const f = a.fly, K = this.keys, O = this.O, sv = this.sens / 5;
    const pin = (K.up ? 1 : 0) - (K.down ? 1 : 0), rin = (K.left ? 1 : 0) - (K.right ? 1 : 0);
    // speed: cruise, boost, slow; the runway gets you up to speed first
    const tv = f.run ? VCRU : K.boost ? VBOOST : K.slow ? VMIN : VCRU;
    f.v = damp(f.v, tv, f.run ? .9 : K.boost ? 1.4 : .8, dt);
    if (f.run) { f.y = ROOFY + 1.2; if (f.x > PARK.x1 + 1) { f.run = 0; f.pitch = .12; } }
    else {
      f.roll = damp(f.roll, rin * .95, 2.2 + 1.6 * sv, dt);
      f.yaw += Math.tan(f.roll) * 9.8 / Math.max(14, f.v) * dt * (1.3 + .5 * sv);
      if (pin) f.pitch = clamp(f.pitch + pin * (.55 + .45 * sv) * dt, -1.05, 1.05); else f.pitch = damp(f.pitch, 0, .35, dt);
    }
    const d = this.fwd(f, this._v || (this._v = new THREE.Vector3()));
    f.x += d.x * f.v * dt; f.y += d.y * f.v * dt; f.z += d.z * f.v * dt;
    // stay inside the city, turn back at the edge
    const r = Math.hypot(f.x, f.z); if (r > 1100) { const back = Math.atan2(-f.x, -f.z); let dy = back - f.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); f.yaw += dy * dt * .8; if (!this._edge || t - this._edge > 4) { this._edge = t; this.big('TURN BACK'); } }
    if (f.y > 650) { f.y = 650; f.pitch = Math.min(f.pitch, 0); }
    if (this.hit(f)) { O.fx.sparkle(f.x, f.y, f.z, 60, [1, .6, .3]); O.sfx('boom'); this.big('CRASH!'); this.land(1); return; }
    // rings
    const R = this.rings[this.ri], P = this._p || (this._p = new THREE.Vector3()); P.set(f.x, f.y, f.z); if (R && R.p.distanceTo(P) < 9) {
      if (this.ri === 0) this.rt0 = t; this.ri++; O.sfx('ding');
      if (this.ri >= this.rings.length) { const tm = t - this.rt0; this.big('RING RUN ' + tm.toFixed(1) + 's'); O.sfx('chaching'); try { O.api.score && O.api.score('rings', Math.max(1, 1000 - Math.round(tm))); } catch (e) {} try { const b = +localStorage.getItem('owq_ringbest') || 0; if (!b || tm < b) localStorage.setItem('owq_ringbest', tm.toFixed(2)); } catch (e) {} this.ri = 0; }
      else this.big('RING ' + this.ri + ' / ' + this.rings.length);
      this.ringUI();
    }
    this.place(a, f);
    this.spdE.textContent = String(Math.round(f.v * 1.94)); this.altE.textContent = String(Math.max(0, Math.round((f.y - GROUNDY) * 3.28)));
    if ((this.sendT -= dt) <= 0) { this.sendT = .1; this.send(); }
  }
  hit(f) {
    if (f.y < GROUNDY + 1.5) return true;
    // the OWQ tower and the Sky Park
    if (f.x > TOWER.x0 - 1 && f.x < TOWER.x1 + 1 && f.z > TOWER.z0 - 1 && f.z < TOWER.z1 + 1 && f.y < ROOFY) return true;
    if (!f.run && f.x > PARK.x0 && f.x < PARK.x1 && f.z > PARK.z0 && f.z < PARK.z1 && f.y < ROOFY + .8 && f.y > ROOFY - 1.4) return true;
    const B = this.O.wld && this.O.wld.blds; if (!B) return false;
    for (const b of B) { if (Math.abs(f.x - b[0]) < b[2] / 2 + 1.5 && Math.abs(f.z - b[1]) < b[3] / 2 + 1.5 && f.y < GROUNDY + b[4] + 1) return true; }
    return false;
  }
  place(a, f) {
    const m = f.m; m.position.set(f.x, f.y, f.z);
    // planes are modelled nose toward +x; turn them to face where we fly
    m.rotation.set(0, 0, 0); m.rotateY(f.yaw - Math.PI / 2); m.rotateZ(f.pitch); m.rotateX(-f.roll);
    if (m.userData.spin) m.userData.spin(f.v * .05);
    const up = this._u || (this._u = new THREE.Vector3()); up.set(0, 1.05, -.3).applyQuaternion(m.quaternion);
    a.root.position.set(f.x + up.x, f.y + up.y - .4, f.z + up.z); a.root.rotation.set(0, f.yaw, 0);
    f.q.copy(m.quaternion);
  }
  send(force) {
    const a = this.me, f = a && a.fly; if (!f) return;
    const q = f.q, st = {x: +f.x.toFixed(1), y: +f.y.toFixed(1), z: +f.z.toFixed(1), yaw: +f.yaw.toFixed(3), p: +f.pitch.toFixed(3), r: +f.roll.toFixed(3), v: +f.v.toFixed(1), c: f.c};
    const k = JSON.stringify(st); if (!force && k === this.last) return; this.last = k;
    try { this.O.api.state && this.O.api.state('fl', st); } catch (e) {}
  }
  remote(a, q) {
    const fl = q && q.fl;
    if (!fl || typeof fl !== 'object') { if (a.fly) { this.group.remove(a.fly.m); a.fly = null; a.root.scale.setScalar(1); a.root.rotation.set(0, a.root.rotation.y, 0); if (!a.wk && a.seat) a.sitNow(); } return; }
    const c = +fl.c | 0;
    if (!a.fly || a.fly.c !== c) {
      if (a.fly) this.group.remove(a.fly.m);
      const m = this.model(c); this.group.add(m);
      a.fly = {m, c, x: +fl.x || 0, y: +fl.y || 0, z: +fl.z || 0, yaw: +fl.yaw || 0, pitch: 0, roll: 0, v: 0, q: new THREE.Quaternion()}; a.wk = null; a.mode = 'fly'; a.sitK = 1; a.root.scale.setScalar(.6);
    }
    const f = a.fly; f.tx = +fl.x || 0; f.ty = +fl.y || 0; f.tz = +fl.z || 0; f.tyaw = +fl.yaw || 0; f.tp = +fl.p || 0; f.tr = +fl.r || 0; f.tv = +fl.v || 0; f.rt = performance.now();
  }
  follow(a, dt) {
    const f = a.fly, age = Math.min(.4, (performance.now() - f.rt) / 1000), cp = Math.cos(f.tp);
    const ex = f.tx + Math.sin(f.tyaw) * cp * f.tv * age, ey = f.ty + Math.sin(f.tp) * f.tv * age, ez = f.tz + Math.cos(f.tyaw) * cp * f.tv * age;
    f.x = damp(f.x, ex, 6, dt); f.y = damp(f.y, ey, 6, dt); f.z = damp(f.z, ez, 6, dt);
    let dy = f.tyaw - f.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); f.yaw += dy * Math.min(1, dt * 6); f.pitch = damp(f.pitch, f.tp, 6, dt); f.roll = damp(f.roll, f.tr, 6, dt); f.v = f.tv;
    this.place(a, f);
  }
  ringUI() {
    const b = (() => { try { return +localStorage.getItem('owq_ringbest') || 0; } catch (e) { return 0; } })();
    this.rE.textContent = (this.ri ? 'RING RUN: ' + this.ri + ' / ' + this.rings.length : 'RING RUN: FLY THROUGH THE BLUE RING TO START') + (b ? '  ·  BEST ' + b.toFixed(1) + 's' : '');
    this.rings.forEach((r, i) => { r.m.material = i === this.ri ? this.nextM() : this.goldM(); });
  }
  nextM() { return this._nm || (this._nm = new THREE.MeshBasicMaterial({color: new THREE.Color(.4, 2.3, 2.7), toneMapped: false})); }
  goldM() { return this._gm || (this._gm = new THREE.MeshBasicMaterial({color: new THREE.Color(3.6, 2.6, .6), toneMapped: false, transparent: true, opacity: .7})); }
  big(t) { const e = this.bE; e.textContent = t; e.classList.add('on'); clearTimeout(this._bt); this._bt = setTimeout(() => e.classList.remove('on'), 1200); }
  cam(P, T, F0) {
    const a = this.me, f = a && a.fly; if (!f) return 0;
    const d = this.fwd(f, this._c || (this._c = new THREE.Vector3())), back = 15 + f.v * .12;
    P.set(f.x - d.x * back, f.y - d.y * back + 4.2, f.z - d.z * back); T.set(f.x + d.x * 12, f.y + d.y * 12 + 1.2, f.z + d.z * 12);
    return clamp(F0 * 1.2 + (f.v - VCRU) * .2, 48, 80);
  }
  grab() { return !!this.me; }
  leave() { if (this.me) { const a = this.me; this.group.remove(a.fly.m); a.fly = null; this.me = null; this.ui.classList.remove('on'); } }
}
