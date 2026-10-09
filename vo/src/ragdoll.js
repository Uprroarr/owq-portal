// Ragdolls: when a car hits someone they fly off, tumble with loose arms and legs, bounce off the floor and the
// barriers, slide to a stop, lie there a moment and get back up. Every screen runs the same physics from the same
// hit (the driver sends the hit, everyone plays it), so the victim lands in about the same place everywhere; the
// victim's own screen decides where they finally stand up.
import * as THREE from 'three';
import {clamp, damp, lerp} from './util.js';
import {skyAt, skyWall} from './sky.js';
import {ROOFY, RANGEY} from './world.js';

const GRAV = 15.5;
const COM = .55;                         // centre of mass above the feet (big heads)
// the body as three spheres in body space (relative to the centre of mass): head, chest, feet
const BODY = [[0, .42, 0, .3], [0, 0, 0, .24], [0, -.44, 0, .13]];
const _v = new THREE.Vector3(), _c = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _e = new THREE.Euler();

// area tests registered by other floors (Sky Park, Skyport...) so a body can fly off the edge of the roof
export const RD = {roof: null};

function floorOf(a) { return a.wk ? a.wk.f : a.drv ? (a.drv.k ? 'd' : 'o') : 'o'; }

// where is the ground under x,z on this floor (null: open air)
function ground(rd, x, z) {
  const f = rd.f;
  if (f === 'd') { const q = skyAt(x, z, rd.hint); rd.hint = q.i; return q.on && !q.gap ? q.y : null; }
  if (f === 'r') return !RD.roof || RD.roof(x, z) ? ROOFY : null;
  if (f === 'g') return RANGEY;
  return 0;
}
// walls (only while the body is low enough to hit them): returns {nx, nz, d} or null
function wall(rd, x, z, r, low) {
  const f = rd.f;
  if (f === 'd') return low ? skyWall(x, z, r, rd.hint) : null;
  if (f === 'o' || f === 'g') {
    let b = null; const t = (nx, nz, d) => { if (d > 0 && (!b || d > b.d)) b = {nx, nz, d}; };
    t(1, 0, -9.95 - (x - r)); t(-1, 0, x + r - 9.95); t(0, 1, -6.95 - (z - r)); t(0, -1, z + r - 11.45); return b;
  }
  return null;
}

// start a ragdoll on avatar a with launch velocity v (m/s, world) and an optional spin
export function ragdoll(O, a, vx, vy, vz, o = {}) {
  if (!a || !a.root) return null;
  if (a.rd && a.rd.t < .25) return a.rd;      // already flying from this hit
  const r = a.root, yaw = a.wk ? a.wk.h : r.rotation.y, f = floorOf(a);
  const sp = Math.hypot(vx, vz) || 1, ax = -vz / sp, az = vx / sp;   // tumble forward over the hit direction
  const rd = {f, t: 0, ph: 'fly', yaw, hint: a.wk && a.wk.hint != null ? a.wk.hint : -1, rest: 0, lie: 0, up: 0, fall: 0, n: o.n || 0,
    p: new THREE.Vector3(r.position.x, r.position.y + COM, r.position.z), v: new THREE.Vector3(vx, vy, vz),
    q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)),
    w: new THREE.Vector3(ax * sp * 1.25 + (o.wx || 0), (Math.random() - .5) * 7 + (o.wy || 0), az * sp * 1.25 + (o.wz || 0)),
    fl: 1, seed: Math.random() * 10, hits: 0};
  a.rd = rd; a.knd = rd; a.mv = 0;
  a.poseFx = rd.pf = (Z, dt, t) => limp(a, Z, dt, t);
  if (O.sfx) { O.sfx('thud'); O.sfx('pop', .7); }
  if (O.pfx) for (let k = 0; k < 14; k++) O.pfx.emit('dust', rd.p.x, rd.p.y - .3, rd.p.z, (Math.random() - .5) * 3, Math.random() * 1.5, (Math.random() - .5) * 3, {life: .8, s0: .25, s1: 1.1, a: .35});
  return rd;
}

// loose arms and legs: they swing with the tumble, splay out when lying, tuck when getting up
function limp(a, Z, dt, t) {
  const rd = a.rd; if (!rd) return;
  const k = rd.ph === 'fly' ? 1 : rd.ph === 'lie' ? 0 : 0, sw = Math.min(1, rd.w.length() / 8) * rd.fl, s = rd.seed;
  if (rd.ph === 'up') {
    const u = clamp(rd.up / .9, 0, 1), e = 1 - u;
    Z.lsx = -.9 * e; Z.rsx = -.9 * e; Z.lsz = .4 * e; Z.rsz = -.4 * e; Z.lex = -1.2 * e; Z.rex = -1.2 * e; Z.ltx = -.9 * e; Z.rtx = -.9 * e; Z.lkx = 1.4 * e; Z.rkx = 1.4 * e; Z.tx = .35 * e; Z.hx = .2 * e;
    return;
  }
  if (rd.ph === 'lie') {
    Z.lsx = -.35; Z.rsx = -.25; Z.lsz = 1.15; Z.rsz = -1.05; Z.lex = -.25; Z.rex = -.4; Z.ltx = .1; Z.rtx = -.15; Z.ltz = .28; Z.rtz = -.3; Z.lkx = .25; Z.rkx = .4; Z.hx = -.15; Z.hy = .35 * Math.sin(s);
    return;
  }
  // flying / tumbling: flail
  const f = 7 + 5 * sw;
  Z.lsx = -1.6 + Math.sin(t * f + s) * 1.3 * (.4 + sw); Z.rsx = -1.6 + Math.sin(t * f * 1.13 + s + 2) * 1.3 * (.4 + sw);
  Z.lsz = .8 + Math.sin(t * f * .7 + s) * .6; Z.rsz = -.8 - Math.sin(t * f * .8 + s + 1) * .6; Z.lex = -.9 + Math.sin(t * 11 + s) * .7; Z.rex = -.9 + Math.cos(t * 12 + s) * .7;
  Z.ltx = -.6 + Math.sin(t * f * .9 + s + 3) * .9 * (.4 + sw); Z.rtx = -.6 + Math.sin(t * f * .95 + s + 4.4) * .9 * (.4 + sw); Z.ltz = .25; Z.rtz = -.25;
  Z.lkx = .8 + Math.sin(t * 9 + s) * .6; Z.rkx = .8 + Math.cos(t * 9.5 + s) * .6; Z.hx = Math.sin(t * 8 + s) * .4; Z.hy = Math.cos(t * 6 + s) * .5; Z.tx = Math.sin(t * 5 + s) * .3;
}

// step every ragdoll; called each frame after the avatars and walkers have moved
export function tickRagdolls(O, dt) {
  O.av.forEach(a => { if (a.rd) step(O, a, dt); });
}
function step(O, a, dt) {
  const rd = a.rd; rd.t += dt;
  const n = Math.min(6, Math.ceil(dt / (1 / 120)));
  for (let k = 0; k < n; k++) phys(O, a, rd, dt / n);
  // pose the avatar: root at the feet below the centre of mass, full tumble rotation
  const r = a.root; _v.set(0, -COM, 0).applyQuaternion(rd.q); r.position.copy(rd.p).add(_v); r.quaternion.copy(rd.q);
  if (a.wk && a.me) { a.wk.x = r.position.x; a.wk.z = r.position.z; a.wk.y = Math.max(r.position.y, rd.gy ?? r.position.y); a.wk.hint = rd.hint; }
  // done: stand back up exactly where the body ended
  if (rd.ph === 'up' && rd.up >= .9) finish(O, a);
  // fell off the deck or the roof: the walker's own screen respawns them; everyone else lets them go
  if (rd.p.y < (rd.f === 'd' ? -45 : rd.f === 'r' ? ROOFY - 50 : -60)) {
    if (a.me && O.walk && a.wk) { finish(O, a); O.walk.respawn(a); }
    else { finish(O, a); r.visible = false; a._zh = 1; }
  }
}
function phys(O, a, rd, dt) {
  const v = rd.v, p = rd.p, w = rd.w;
  if (rd.ph === 'fly') {
    v.y -= GRAV * dt; const drag = Math.exp(-.12 * dt); v.multiplyScalar(drag);
    p.addScaledVector(v, dt);
    // integrate the rotation
    const wl = w.length(); if (wl > 1e-4) { _q.setFromAxisAngle(_w.copy(w).divideScalar(wl), wl * dt); rd.q.premultiply(_q).normalize(); }
    // contacts with the ground: the three body spheres
    let touch = 0;
    for (const b of BODY) {
      _c.set(b[0], b[1], b[2]).applyQuaternion(rd.q).add(p);
      const gy = ground(rd, _c.x, _c.z); if (gy === null) continue; rd.gy = gy;
      const pen = gy - (_c.y - b[3]); if (pen <= 0) continue;
      touch = 1; p.y += pen;
      // velocity of the contact point
      const rx = _c.x - p.x, ry = _c.y - p.y, rz = _c.z - p.z;
      const cvx = v.x + (w.y * rz - w.z * ry), cvy = v.y + (w.z * rx - w.x * rz), cvz = v.z + (w.x * ry - w.y * rx);
      if (cvy < 0) {
        const e = rd.hits < 2 ? .32 : .12; v.y += -(1 + e) * cvy * .85; rd.hits++;
        if (-cvy > 3.5) { if (O.sfx) O.sfx('thud', Math.min(1, -cvy / 10)); if (O.pfx) for (let q = 0; q < 6; q++) O.pfx.emit('dust', _c.x, gy + .05, _c.z, (Math.random() - .5) * 2, Math.random(), (Math.random() - .5) * 2, {life: .7, s0: .2, s1: .9, a: .3}); }
      }
      // friction at the contact: slows the slide and turns it into a roll
      const fk = Math.min(1, 7 * dt); v.x -= cvx * fk * .55; v.z -= cvz * fk * .55;
      w.x += cvz * fk * .9; w.z += -cvx * fk * .9; w.multiplyScalar(1 - fk * .35);
    }
    // barriers and walls (only while low enough to hit them)
    const gy = rd.gy ?? 0, wl2 = wall(rd, p.x, p.z, .3, p.y - gy < 1.1);
    if (wl2) { p.x += wl2.nx * wl2.d; p.z += wl2.nz * wl2.d; const vn = v.x * wl2.nx + v.z * wl2.nz; if (vn < 0) { v.x -= 1.4 * vn * wl2.nx; v.z -= 1.4 * vn * wl2.nz; w.y += (Math.random() - .5) * 6; if (O.sfx && -vn > 3) O.sfx('thud', .6); } }
    // slow and on the ground: lie down
    if (touch && v.length() < .7 && w.length() < 2.2) { rd.rest += dt; if (rd.rest > .35) { rd.ph = 'lie'; rd.lie = 0; settle(rd); } } else rd.rest = 0;
    if (!touch && rd.gy === undefined && p.y < -300) rd.ph = 'gone';
  } else if (rd.ph === 'lie') {
    rd.lie += dt; v.set(0, 0, 0); w.set(0, 0, 0);
    rd.q.slerp(rd.qLie, Math.min(1, dt * 6));
    const gy = ground(rd, p.x, p.z); if (gy !== null) p.y = damp(p.y, gy + .24, 8, dt);
    if (rd.lie > 1.35) { rd.ph = 'up'; rd.up = 0; rd.q0 = rd.q.clone(); rd.qUp = new THREE.Quaternion().setFromEuler(_e.set(0, rd.yawUp, 0)); rd.y0 = p.y; }
  } else if (rd.ph === 'up') {
    rd.up += dt; const u = sm(clamp(rd.up / .9, 0, 1));
    rd.q.slerpQuaternions(rd.q0, rd.qUp, u);
    const gy = ground(rd, p.x, p.z) ?? 0; p.y = lerp(rd.y0, gy + COM, u);
  }
}
const sm = t => t * t * (3 - 2 * t);
// pick the lying orientation closest to how the body landed (face up or face down), keep its heading
function settle(rd) {
  _v.set(0, 1, 0).applyQuaternion(rd.q);            // body up axis
  const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(rd.q); fwd.y = 0; if (fwd.lengthSq() < 1e-4) fwd.set(Math.sin(rd.yaw), 0, Math.cos(rd.yaw)); fwd.normalize();
  const up = new THREE.Vector3(_v.x, 0, _v.z); if (up.lengthSq() < 1e-4) up.copy(fwd); up.normalize();
  // lying: the body's up axis points along the ground (head this way), its front faces the sky or the floor
  const faceUp = new THREE.Vector3(0, 0, 1).applyQuaternion(rd.q).y > -.2;
  const zA = faceUp ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, -1, 0), x = new THREE.Vector3().crossVectors(up, zA).normalize();
  const m = new THREE.Matrix4().makeBasis(x, up, zA);   // right-handed: x = y cross z
  rd.qLie = new THREE.Quaternion().setFromRotationMatrix(m);
  rd.yawUp = Math.atan2(up.x, up.z);                // stand up facing the way the head was pointing
}
function finish(O, a) {
  const rd = a.rd; if (!rd) return;
  a.rd = null; a.knd = null; if (a.poseFx === rd.pf) a.poseFx = null;
  const yaw = rd.yawUp ?? rd.yaw; a.root.quaternion.identity(); a.root.rotation.set(0, yaw, 0);
  if (a.wk) { a.wk.h = yaw; if (a.me) { a.wk.vx = 0; a.wk.vz = 0; a.wk.vy = 0; a.wk.air = 0; if (O.walk) { O.walk.yaw = yaw; O.walk.send && O.walk.send(1); } } }
}
export function endRagdoll(O, a) { finish(O, a); }
