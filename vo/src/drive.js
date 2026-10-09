// Driving your loot-crate car: around the Sales Floor and straight out the west door onto the Sky Deck, a 2.5 km
// elevated circuit through the skyscrapers. Real-feeling handling: grip that lets go into a drift (SPACE handbrake),
// weight on the brakes, a gearbox you can hear, and proper collisions: cars glance off barriers and spin, bump each
// other with the right push, and send anyone they hit flying (ragdoll) on every screen.
import * as THREE from 'three';
import {buildCar} from './cosm.js';
import {SEATS} from './layout.js';
import {clamp, damp} from './util.js';
import {DOOR, SKY, PLAZA, skyAt, skyWall, skyPose, fmtLap} from './sky.js';
import {TOWER} from './world.js';
import {ragdoll} from './ragdoll.js';

const S = .7;
const VMAX = 8;        // on the Sales Floor (m/s)
const VMAXT = 44;      // on the Sky Deck
const VREV = 4.5;
const GRAV = 18;
const MPH = 2.237 * 2; // speedo reads in "toy mph" (the cars are small)
const BOX = [];
SEATS.forEach(s => { BOX.push([s.x - .97, s.z - .43, s.x + .97, s.z + .43], [s.x - .34, s.cz - .32, s.x + .34, s.cz + .32]); });
BOX.push([-4.3, -7, 2.4, -6.4], [-10, -7, -5.3, -6.45], [3.6, -7, 6.4, -6.45], [6, -6.6, 6.8, -5.8], [7, -7, 10, -6.7], [-9.75, 1.5, -8.95, 2.3], [-9.75, -2.7, -8.95, -1.9], [-9.75, -6.7, -8.8, -5.8], [-9.7, 10.2, -8.8, 11], [8.7, 10.3, 9.5, 11.1], [8.8, 5.7, 9.6, 6.5], [-9.7, 6.4, -8.9, 7.2], [-8.2, 9.1, -5, 10.1], [-9.05, 7.55, -8.05, 9.55], [-7.3, 7.7, -5.7, 8.6], [-5.2, 6.8, -4.2, 7.8], [5.5, 7.1, 7.9, 9.5]);
const XB = [-9.75, 9.75];
const ZB = [-6.35, 11.3];
const CSS = `.vo3drv{position:absolute;inset:0;pointer-events:none;z-index:5;display:none}.vo3drv.on{display:block}
.vo3drh{position:absolute;top:62px;left:50%;transform:translateX(-50%);padding:7px 14px;border-radius:14px;background:rgba(12,6,12,.72);border:1px solid rgba(255,255,255,.14);font:700 10px Verdana,sans-serif;letter-spacing:.1em;color:#ffd0da;width:max-content;max-width:calc(100% - 340px);white-space:normal;text-align:center;line-height:1.55;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.vo3drh b{color:#fff}
.vo3drg{position:absolute;right:22px;bottom:150px;width:150px;height:150px;pointer-events:none}
.vo3drg svg{width:100%;height:100%;overflow:visible}.vo3drg .n{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font:900 34px Verdana,sans-serif;color:#fff;text-shadow:0 2px 14px rgba(255,31,79,.7)}
.vo3drg .n small{font:800 9px Verdana,sans-serif;letter-spacing:.2em;color:#ffb3c2}.vo3drg .n i{font:900 13px Verdana,sans-serif;font-style:normal;color:#ffd166;margin-top:2px}
.vo3drp{position:absolute;bottom:92px;display:flex;gap:10px;pointer-events:auto}.vo3drp.l{left:16px}.vo3drp.r{right:16px;flex-direction:column}
.vo3drp button{width:62px;height:62px;border-radius:18px;border:1px solid rgba(255,255,255,.18);background:rgba(12,6,12,.7);color:#fff;font:800 18px Verdana,sans-serif;touch-action:none;-webkit-user-select:none;user-select:none;cursor:pointer;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.vo3drp button.on{background:#ff1f4f;border-color:#ff1f4f}.vo3drp .r button,.vo3drp.r button{font-size:11px;letter-spacing:.06em}.vo3drp .g{color:#eafff4;font-weight:900;height:78px;background:rgba(61,220,151,.22)}.vo3drp .g.on{background:#3ddc97}
.vo3drx{position:absolute;top:58px;right:14px;pointer-events:auto;padding:9px 14px;border-radius:12px;border:0;background:#ff1f4f;color:#fff;font:800 11px Verdana,sans-serif;letter-spacing:.1em;cursor:pointer}
.vo3drl{position:absolute;top:22px;left:50%;transform:translateX(-50%);display:flex;gap:18px;align-items:baseline;padding:8px 18px;border-radius:14px;background:rgba(8,5,10,.62);border:1px solid rgba(255,255,255,.1);font:800 12px Verdana,sans-serif;letter-spacing:.12em;color:#ffd166;white-space:nowrap;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.vo3drl:empty{display:none}.vo3drl b{font:900 20px Verdana,sans-serif;color:#fff;letter-spacing:.04em}.vo3drl em{font-style:normal;color:#8ef0c2}.vo3drl s{text-decoration:none;color:#ff7a90}
.vo3drf{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .35s;pointer-events:none}.vo3drf.on{opacity:1}
.vo3drt{position:absolute;top:104px;right:14px;pointer-events:auto;display:flex;align-items:center;gap:8px;padding:7px 12px;border-radius:12px;background:rgba(12,6,12,.72);border:1px solid rgba(255,255,255,.14);font:800 10px Verdana,sans-serif;letter-spacing:.1em;color:#ffd0da;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.vo3drt input{width:110px;accent-color:#ff1f4f;cursor:pointer}.vo3drt b{min-width:16px;text-align:right;color:#fff}
.vo3drk{position:absolute;bottom:92px;left:50%;transform:translateX(-50%);pointer-events:auto;padding:9px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(12,6,12,.7);color:#ffd166;font:800 12px Verdana,sans-serif;letter-spacing:.08em;cursor:pointer}
.vo3drb{position:absolute;top:150px;left:50%;transform:translateX(-50%);font:900 34px Verdana,sans-serif;letter-spacing:.12em;color:#fff;text-shadow:0 0 18px #ff1f4f,0 2px 10px #000;opacity:0;transition:opacity .2s,transform .2s;white-space:nowrap}.vo3drb.on{opacity:1;transform:translateX(-50%) scale(1.05)}
.vo3drm{position:absolute;left:18px;top:96px;width:150px;height:150px;border-radius:50%;background:rgba(8,5,10,.55);border:1px solid rgba(255,255,255,.12);pointer-events:none;overflow:hidden;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.vo3drm canvas{width:100%;height:100%}
.vo3nar .vo3drm,.vo3nar .vo3drg{transform:scale(.72);transform-origin:top left}.vo3nar .vo3drg{transform-origin:bottom right}`;

// Sales Floor walls, desks and the door gap
function hitsFloor(x, z, r) {
  const inDoor = z > DOOR.z0 + r * .6 && z < DOOR.z1 - r * .6;
  if ((x < XB[0] + r && !inDoor) || x > XB[1] - r || z < ZB[0] + r || z > ZB[1] - r) return true;
  for (const b of BOX) { const qx = clamp(x, b[0], b[2]), qz = clamp(z, b[1], b[3]); if ((x - qx) * (x - qx) + (z - qz) * (z - qz) < r * r) return true; }
  return false;
}
// the deepest wall contact for a probe circle on the Sales Floor: {nx, nz, d}
function floorWall(x, z, r) {
  let best = null; const take = (nx, nz, d) => { if (d > 0 && (!best || d > best.d)) best = {nx, nz, d}; };
  const inDoor = z > DOOR.z0 + r * .6 && z < DOOR.z1 - r * .6;
  if (!inDoor) take(1, 0, XB[0] + r - x); take(-1, 0, x - (XB[1] - r)); take(0, 1, ZB[0] + r - z); take(0, -1, z - (ZB[1] - r));
  for (const b of BOX) { const qx = clamp(x, b[0], b[2]), qz = clamp(z, b[1], b[3]), dx = x - qx, dz = z - qz, d2 = dx * dx + dz * dz;
    if (d2 < r * r) { if (d2 > 1e-8) { const d = Math.sqrt(d2); take(dx / d, dz / d, r - d); } else { const l = x - b[0], rr = b[2] - x, t = z - b[1], bt = b[3] - z, m = Math.min(l, rr, t, bt); if (m === l) take(-1, 0, l + r); else if (m === rr) take(1, 0, rr + r); else if (m === t) take(0, -1, t + r); else take(0, 1, bt + r); } } }
  return best;
}
// legacy check used when getting out of the car
function carHits(d, x, z, h) {
  const c = Math.cos(h), s = -Math.sin(h), o = Math.max(.2, d.hl * .7);
  const at = (px, pz) => px < TOWER.x0 ? !!skyWall(px, pz, d.hw, d.hint) : px < XB[0] + d.hw ? !(pz > DOOR.z0 + .3 && pz < DOOR.z1 - .3) : hitsFloor(px, pz, d.hw);
  return at(x + c * o, z + s * o) || at(x - c * o, z - s * o);
}
const LAPK = 'owq_skylap2';
function best0() { try { return +localStorage.getItem(LAPK) || 0; } catch (e) { return 0; } }
const STEERK = 'owq_steer';
function steer0() { try { const v = +localStorage.getItem(STEERK); return v >= 1 && v <= 10 ? Math.round(v) : 5; } catch (e) { return 5; } }
const carH = h => ({x: Math.cos(h), z: -Math.sin(h)});

// ---------------------------------------------------------------- engine sound: two oscillators through a filter, revving through the gears
const GEARS = [0, 7, 14, 21, 29, 37, 60];
class Engine {
  constructor(O) { this.O = O; this.n = null; }
  on() {
    if (this.n) return; const O = this.O, ac = O.lv && O.lv.ac; if (!ac || ac.state !== 'running' || !O.opts.sfx) return;
    try {
      const g = ac.createGain(); g.gain.value = 0; g.connect(ac.destination);
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700; f.Q.value = 2.5; f.connect(g);
      const o1 = ac.createOscillator(); o1.type = 'sawtooth'; const o2 = ac.createOscillator(); o2.type = 'square'; const g2 = ac.createGain(); g2.gain.value = .45;
      o1.connect(f); o2.connect(g2); g2.connect(f);
      // tyre noise for slides
      const nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const ns = ac.createBufferSource(); ns.buffer = nb; ns.loop = true; const nf = ac.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 1900; nf.Q.value = 1.4; const ng = ac.createGain(); ng.gain.value = 0;
      ns.connect(nf); nf.connect(ng); ng.connect(ac.destination);
      o1.start(); o2.start(); ns.start();
      this.n = {ac, g, f, o1, o2, ns, ng};
    } catch (e) { this.n = null; }
  }
  set(v, thr, slip, air) {
    const n = this.n; if (!n) return; const t = n.ac.currentTime, sp = Math.abs(v);
    let gi = 0; while (gi < GEARS.length - 2 && sp > GEARS[gi + 1]) gi++;
    const rpm = clamp((sp - GEARS[gi]) / (GEARS[gi + 1] - GEARS[gi]), 0, 1), fr = 38 + gi * 6 + rpm * 120 + (air ? 30 : 0) + thr * 8;
    n.o1.frequency.setTargetAtTime(fr, t, .05); n.o2.frequency.setTargetAtTime(fr * .5, t, .05);
    n.f.frequency.setTargetAtTime(380 + thr * 1500 + rpm * 600, t, .08);
    n.g.gain.setTargetAtTime(.022 + thr * .035 + sp * .0006, t, .08);
    n.ng.gain.setTargetAtTime(clamp(slip, 0, 1) * .05, t, .05);
  }
  off() { const n = this.n; if (!n) return; this.n = null; try { const t = n.ac.currentTime; n.g.gain.setTargetAtTime(0, t, .05); n.ng.gain.setTargetAtTime(0, t, .05); setTimeout(() => { try { n.o1.stop(); n.o2.stop(); n.ns.stop(); n.g.disconnect(); n.ng.disconnect(); } catch (e) {} }, 300); } catch (e) {} }
}

// ---------------------------------------------------------------- skid marks: a ring of dark quads on the road
class Skids {
  constructor(parent, N = 900) {
    this.N = N; this.i = 0; const g = new THREE.BufferGeometry(); this.pos = new Float32Array(N * 4 * 3); this.al = new Float32Array(N * 4);
    const idx = []; for (let k = 0; k < N; k++) { const b = k * 4; idx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3); }
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('al', new THREE.BufferAttribute(this.al, 1).setUsage(THREE.DynamicDrawUsage)); g.setIndex(idx);
    const m = new THREE.ShaderMaterial({transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
      vertexShader: 'attribute float al;varying float vA;void main(){vA=al;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'varying float vA;void main(){gl_FragColor=vec4(.008,.008,.01,vA*.62);}'});
    this.mesh = new THREE.Mesh(g, m); this.mesh.frustumCulled = false; this.mesh.renderOrder = 1; parent.add(this.mesh); this.last = {};
  }
  // a mark from the last point of this wheel to (x,y,z) across direction (nx,nz)
  add(key, x, y, z, nx, nz, a) {
    const L = this.last[key]; this.last[key] = {x, y, z, nx, nz, a};
    if (!L || Math.hypot(x - L.x, z - L.z) > 3) return;
    const k = this.i++ % this.N, b = k * 12, w = .14, P = this.pos;
    P[b] = L.x - L.nx * w; P[b + 1] = L.y; P[b + 2] = L.z - L.nz * w; P[b + 3] = L.x + L.nx * w; P[b + 4] = L.y; P[b + 5] = L.z + L.nz * w;
    P[b + 6] = x - nx * w; P[b + 7] = y; P[b + 8] = z - nz * w; P[b + 9] = x + nx * w; P[b + 10] = y; P[b + 11] = z + nz * w;
    this.al.set([L.a, L.a, a, a], k * 4);
    const g = this.mesh.geometry; g.attributes.position.needsUpdate = true; g.attributes.al.needsUpdate = true;
  }
  lift(key) { this.last[key] = null; }
}

// make the paint shine: clearcoat on the body, glass that reflects the city (per model, never touching shared materials)
const PAINT = new Map();
function finish(car) {
  let body = null, big = 0; const box = new THREE.Box3(), sz = new THREE.Vector3();
  car.traverse(o => { if (!o.isMesh || !o.material || !o.material.isMeshStandardMaterial) return; box.setFromObject(o); box.getSize(sz); const v = sz.x * sz.y * sz.z; if (v > big) { big = v; body = o.material; } });
  if (!body) return;
  const key = body.uuid; let pm = PAINT.get(key);
  if (!pm) { pm = new THREE.MeshPhysicalMaterial({color: body.color, roughness: Math.min(.42, body.roughness), metalness: Math.max(.35, body.metalness * .8), clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.5, map: body.map || null}); PAINT.set(key, pm); }
  car.traverse(o => { if (o.isMesh && o.material === body) { o.material = pm; } if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
}

class Drive {
  constructor(O) {
    this.O = O; this.me = null; this.keys = {}; this.sendT = 0; this.last = ''; this.hn = 0; this.kn = 0; this.knk = null; this.eng = new Engine(O); this.skid = null;
    if (!document.getElementById('vo3drcss')) { const s = document.createElement('style'); s.id = 'vo3drcss'; s.textContent = CSS; document.head.appendChild(s); }
    const u = this.ui = document.createElement('div'); u.className = 'vo3drv';
    u.innerHTML = `<div class=vo3drh><b>DRIVING</b> &nbsp;W A S D / arrows &middot; SPACE handbrake (drift) &middot; H horn &middot; E get out &middot; west door = SKY DECK</div><label class=vo3drt title="How fast you turn with the arrow keys or WASD (also used for planes)">STEERING<input type=range min=1 max=10 step=1 aria-label="Steering sensitivity"><b>5</b></label>
      <div class=vo3drg><svg viewBox="0 0 100 100"><circle cx=50 cy=50 r=44 fill="rgba(8,5,10,.6)" stroke="rgba(255,255,255,.12)" stroke-width="2"/><path class=arc d="" stroke="#ff1f4f" stroke-width="6" fill="none" stroke-linecap="round"/><path class=rv d="" stroke="#ffd166" stroke-width="3" fill="none"/></svg><div class=n><span>0</span><small>MPH</small><i>N</i></div></div>
      <div class=vo3drm><canvas width=300 height=300></canvas></div><div class=vo3drl></div><div class=vo3drb></div><div class=vo3drf></div>
      <div class="vo3drp l"><button data-k=left aria-label="Steer left">&#9664;</button><button data-k=right aria-label="Steer right">&#9654;</button></div>
      <div class="vo3drp r"><button class=g data-k=up aria-label="Gas">GAS</button><button data-k=down aria-label="Brake / reverse">BRAKE</button><button data-k=brake aria-label="Handbrake">DRIFT</button></div>
      <button class=vo3drk data-k=horn>&#128227; HORN</button><button class=vo3drx>GET OUT</button>`;
    O.el.appendChild(u);
    this.sens = steer0(); this.sl = u.querySelector('.vo3drt input'); this.slv = u.querySelector('.vo3drt b'); this.sl.value = this.sens; this.slv.textContent = this.sens;
    this.sl.addEventListener('input', () => this.setSens(+this.sl.value)); ['pointerdown', 'keydown'].forEach(ev => this.sl.addEventListener(ev, e => e.stopPropagation()));
    this.spd = u.querySelector('.vo3drg .n span'); this.gearE = u.querySelector('.vo3drg .n i'); this.arc = u.querySelector('.vo3drg .arc'); this.rvE = u.querySelector('.vo3drg .rv');
    this.lapE = u.querySelector('.vo3drl'); this.fade = u.querySelector('.vo3drf'); this.bigE = u.querySelector('.vo3drb'); this.best = best0(); this.board = {};
    this.mapC = u.querySelector('.vo3drm canvas'); this.mapE = u.querySelector('.vo3drm');
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
    car.scale.setScalar(S); car.position.set(x, y || 0, z); car.rotation.y = h; finish(car); this.O.room.group.add(car); this.O.warm(car);
    const L = car.userData.len || 3.4, bb = new THREE.Box3().setFromObject(car), sz = new THREE.Vector3(); car.rotation.y = 0; car.updateMatrixWorld(true); bb.setFromObject(car); bb.getSize(sz); car.rotation.y = h;
    const hl = Math.max(.8, sz.x / 2), hw = Math.max(.42, sz.z / 2);
    const d = {car, c, x, z, h, vx: 0, vz: 0, v: 0, w: 0, st: 0, L, hl, hw, tx: x, tz: z, th: h, tv: 0, rt: performance.now(), hn: 0, k: k ? 1 : 0, lap: null, y: y || 0, vy: 0, air: 0, hint: -1, ty: y || 0, pitch: 0, roll: 0, s: 0, slip: 0, susp: 0, sv: 0};
    a.drv = d; a.mode = 'drive'; a.emo = null; a.idleK = null; a.typing = false; a.sitK = 1; a.standK = 0; a.path = null; a.mv = 0; a.root.scale.setScalar(.55);
    this.place(a); this.O.fx.sparkle(x, (y || 0) + .6, z, 30, [1, .85, .4]); this.O.sfx('vroom'); return d;
  }
  place(a) {
    const d = a.drv, c = Math.cos(d.h), s = -Math.sin(d.h), off = -.08 * d.L * S;
    d.car.position.set(d.x, d.y + d.susp, d.z); d.car.rotation.set(d.roll, d.h, d.pitch, 'YXZ');
    a.root.position.set(d.x + c * off, d.y + d.susp + .06, d.z + s * off); a.root.rotation.set(0, d.h + Math.PI / 2, 0);
  }
  // from my desk
  start() {
    const O = this.O, a = O.meAv;
    if (a && a.wk && O.walk) return this.startHere(a);
    if (!this.can(a)) { if (a && a.me && !(a.look && a.look.W > 0)) O.ui.toast('Open a loot crate in the Battle Pass to get a car first.'); return false; }
    const s = a.seat; let x = s.x, z = s.aisle; const h = s.x <= 0 ? 0 : Math.PI;
    const d0 = {hl: 1.2, hw: .55, k: 0, hint: -1}; if (carHits(d0, x, z, h)) z = s.aisle + .25;
    const d = this.mount(a, a.look.W, x, z, h, 0); if (!d) return false;
    const desk = O.room.desks[s.i]; if (desk && desk.av === a) desk.occ = 0;
    this.go(a); return true;
  }
  // from where I'm walking (Sales Floor or Sky Deck)
  startHere(a) {
    const O = this.O, w = a.wk; if (!w || !(a.look && a.look.W > 0) || a.drv) return false;
    if (w.f !== 'o' && w.f !== 'd') { O.ui.toast('Cars only go on the Sales Floor and the Sky Deck.'); return false; }
    const h = Math.PI / 2 - w.h, k = w.f === 'd' ? 1 : 0, d0 = {hl: 1.2, hw: .55, k, hint: w.hint == null ? -1 : w.hint};
    if (carHits(d0, w.x, w.z, h)) { O.ui.toast('Not enough room for your car here.'); return false; }
    O.walk.me = null; O.walk.ui.classList.remove('on'); O.walk.prE.classList.remove('on'); try { O.api.walk && O.api.walk(null); } catch (e) {}
    const x = w.x, z = w.z, y = w.y; a.wk = null; a.mv = 0;
    const d = this.mount(a, a.look.W, x, z, h, k, y); if (!d) return false;
    d.hint = w.hint == null ? -1 : w.hint; this.go(a); return true;
  }
  go(a) {
    const O = this.O; this.me = a; this.keys = {}; this.ui.classList.add('on'); this.send(1); O.ui.hideCard(); this.eng.on();
    if (!this.skid) this.skid = new Skids(O.scene);
    if (!this.trk) this.drawTrack();
  }
  stop() {
    const a = this.me; if (!a) return; this.me = null; this.keys = {}; this.ui.classList.remove('on'); this.eng.off();
    const d = a.drv; this.end(a, 1);
    try { this.O.api.drive && this.O.api.drive(null); } catch (e) {} this.last = '';
    if (d && this.O.walk && !a.leaving) {
      a.mode = 'seated';
      const c = carH(d.h); let x = d.x + c.z * (d.hw + .55), z = d.z - c.x * (d.hw + .55);
      if (d.k ? skyWall(x, z, .3, d.hint) : hitsFloor(x, z, .3)) { x = d.x - c.z * (d.hw + .55); z = d.z + c.x * (d.hw + .55); if (d.k ? skyWall(x, z, .3, d.hint) : hitsFloor(x, z, .3)) { x = d.x; z = d.z; } }
      const ok = this.O.walk.start({at: {x, z, y: d.y, h: Math.PI / 2 - d.h, f: d.k ? 'd' : 'o', hint: d.hint}});
      if (ok) return;
      a.sitNow();
    }
  }
  // the car goes away in a puff
  end(a, mine) {
    const d = a.drv; if (!d) return; a.drv = null; const O = this.O;
    O.fx.sparkle(d.x, d.y + .6, d.z, 40, [1, .85, .4]); O.sfx('pop'); O.room.group.remove(d.car);
    if (this.skid) { ['fl' + a.id, 'fr' + a.id, 'rl' + a.id, 'rr' + a.id].forEach(k => this.skid.lift(k)); }
    a.root.scale.setScalar(1); a.root.rotation.set(0, a.root.rotation.y, 0);
    if (a.leaving || mine) return;
    if (a.p && a.p.wk) return;
    const s = a.seat; if (!s) return;
    if (d.k) { a.sitNow(); return; }
    a.root.position.set(d.x, 0, d.z); a.sitK = 0; a.standK = 0;
    a.walk([[s.x, s.aisle], [s.x, s.sz]], () => { a.mode = 'sitting'; a.turnTo = 0; });
  }
  horn() { const d = this.me && this.me.drv; if (!d) return; this.hn++; d.hn = this.hn; this.O.sfx('horn'); this.send(1); }
  send(force) {
    const d = this.me && this.me.drv; if (!d) return;
    const st = {x: +d.x.toFixed(2), z: +d.z.toFixed(2), y: +d.y.toFixed(2), h: +d.h.toFixed(3), v: +d.v.toFixed(2), vx: +d.vx.toFixed(2), vz: +d.vz.toFixed(2), w: +d.w.toFixed(2), c: d.c, hn: this.hn, k: d.k, b: this.best ? +this.best.toFixed(2) : 0, sl: d.slip > .4 ? 1 : 0};
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
    d.tx = x; d.tz = z; d.th = h; d.ty = y; d.tv = +dv.v || 0; d.tvx = +dv.vx || 0; d.tvz = +dv.vz || 0; d.tw = +dv.w || 0; d.rsl = dv.sl ? 1 : 0; d.rt = performance.now();
    if (+dv.b > 0) this.board[a.nm] = +dv.b;
    if ((+dv.hn || 0) !== d.hn) { d.hn = +dv.hn || 0; this.O.sfx('horn', .7); }
    // they hit someone: everyone plays the same ragdoll
    const kn = dv.kn; if (kn && typeof kn === 'object' && (+kn.n || 0) !== (d.knN || 0)) {
      d.knN = +kn.n || 0;
      let v = null; this.O.av.forEach(b => { if (b.id === kn.id) v = b; });
      if (v && v.wk) ragdoll(this.O, v, +kn.vx || 0, +kn.vy || 4, +kn.vz || 0, {wy: +kn.wy || 0, n: d.knN});
    }
  }
  tick(dt, t) {
    const O = this.O;
    O.av.forEach(a => {
      const d = a.drv; if (!d) return;
      if (a.leaving) { O.room.group.remove(d.car); a.drv = null; return; }
      if (a === this.me) this.mine(a, d, dt, t);
      else {
        // dead reckoning from their last state, then ease toward it
        const age = Math.min(.4, (performance.now() - d.rt) / 1000), ex = d.tx + (d.tvx || 0) * age, ez = d.tz + (d.tvz || 0) * age, ox = d.x, oz = d.z;
        d.x = damp(d.x, ex, 10, dt); d.z = damp(d.z, ez, 10, dt); d.y = damp(d.y, d.ty, 10, dt);
        let dh = d.th + (d.tw || 0) * age - d.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); d.h += dh * Math.min(1, dt * 10);
        d.vx = (d.x - ox) / Math.max(dt, .001); d.vz = (d.z - oz) / Math.max(dt, .001); d.v = Math.hypot(d.vx, d.vz) * Math.sign(d.tv || 1);
        if (d.k) { const q = skyAt(d.x, d.z, d.hint); d.hint = q.i; d.air = q.gap || d.y > q.y + .3 ? 1 : 0; d.vy = (d.ty - d.y) * 4; this.lean(d, q, dt); }
        else { d.pitch = damp(d.pitch, 0, 8, dt); d.roll = damp(d.roll, 0, 8, dt); }
        if (d.rsl && !d.air) this.fxSlide(a, d, 1);
      }
      if (d.car.userData.spin) d.car.userData.spin(d.v * dt / S);
      this.place(a);
    });
  }
  lean(d, q, dt) {
    // pitch from the slope, roll from the banking plus body roll in the turn; in the air the nose follows the fall
    const S0 = SKY.S, n = SKY.n; if (!S0.length) return;
    const a = S0[q.i], b = S0[(q.i + 3) % n], fwd = carH(d.h), dir = fwd.x * a.t.x + fwd.z * a.t.z >= 0 ? 1 : -1;
    const slope = Math.atan2((b.p.y - a.p.y) * dir, 3);
    const tp = d.air ? clamp(Math.atan2(d.vy, Math.max(4, Math.abs(d.v))), -.6, .5) : slope - clamp(d.acc || 0, -12, 12) * .004;
    d.pitch = damp(d.pitch, tp, 8, dt); d.roll = damp(d.roll, d.air ? 0 : -a.bank * dir - clamp(d.w * d.v, -40, 40) * .0022, 6, dt);
  }
  // ---------------------------------------------------------------- my car
  mine(a, d, dt, t) {
    const n = Math.min(4, Math.ceil(dt / (1 / 90)));
    for (let i = 0; i < n; i++) this.step(a, d, dt / n, t);
    // out the door and onto the deck (and back in)
    if (!d.k && d.x < TOWER.x0 + .3) { d.k = 1; d.hint = -1; d.lap = null; if (!this.deckSeen) { this.deckSeen = 1; this.O.ui.toast('OWQ SKY DECK: 2.5 km. Boost pads, two jumps, the tunnel. SPACE to drift.'); } this.send(1); }
    else if (d.k && d.x > TOWER.x0 + .5 && d.z > DOOR.z0 - .2 && d.z < DOOR.z1 + .2) { d.k = 0; d.y = 0; d.air = 0; d.vy = 0; this.lapE.textContent = ''; this.send(1); }
    if (d.k) this.deck(a, d, dt, t); else { d.y = 0; d.pitch = damp(d.pitch, -clamp(d.acc || 0, -12, 12) * .004, 8, dt); d.roll = damp(d.roll, -clamp(d.w * d.v, -40, 40) * .002, 8, dt); }
    this.hitPeople(a, d, t); this.hitCars(a, d, t);
    this.fxSlide(a, d, 0);
    if ((this.sendT -= dt) <= 0) { this.sendT = .08; this.send(); }
    this.hud(d, t);
    this.eng.set(d.v, (this.keys.up ? 1 : 0), d.slip, d.air);
  }
  step(a, d, dt, t) {
    const O = this.O, K = this.keys, thr = (K.up ? 1 : 0) - (K.down ? 1 : 0), hb = !!K.brake;
    const fx = Math.cos(d.h), fz = -Math.sin(d.h), rx = -fz, rz = fx;         // forward and right on the ground
    let vF = d.vx * fx + d.vz * fz, vR = d.vx * rx + d.vz * rz; const v0 = vF;
    const vmax = d.k ? VMAXT * (d.boost > 0 ? 1.3 : 1) : VMAX;
    if (!d.air) {
      // engine, brakes, reverse
      if (thr > 0) { const a0 = d.k ? 15 : 7; vF += (vF < -.3 ? 22 : a0 * clamp(1.1 - vF / vmax, .12, 1)) * dt; }
      else if (thr < 0) { if (vF > .4) vF -= 26 * dt; else vF = Math.max(-VREV, vF - 7 * dt); }
      else vF *= Math.exp(-.35 * dt);
      if (hb) vF *= Math.exp(-.9 * dt);
      vF -= vF * Math.abs(vF) * (d.k ? .0011 : .02) * dt;             // air drag
      if (vF > vmax) vF = damp(vF, vmax, 2.5, dt);
      // steering: less lock at speed, follows the sensitivity setting
      const sv = this.sens / 5, steerIn = (K.left ? 1 : 0) - (K.right ? 1 : 0);
      d.st = damp(d.st, steerIn, 3.5 + 4 * sv, dt);
      const lock = (.62 + .1 * (sv - 1)) / (1 + Math.abs(vF) / 15), wb = Math.max(.9, d.hl * 1.25);
      let wT = vF * Math.tan(d.st * lock) / wb;
      // tyres: how much sideways force they have (less with the handbrake, more on the deck's grippy asphalt)
      const grip = hb ? 7.5 : d.k ? 26 : 19, gl = grip / Math.max(2, Math.abs(vF));
      if (!hb) wT = clamp(wT, -gl * 1.15, gl * 1.15); else wT *= 1.35;
      d.w += (wT - d.w) * Math.min(1, dt * (hb ? 2.6 : 9));
      const kill = Math.min(Math.abs(vR), grip * dt); vR -= Math.sign(vR) * kill;
      d.slip = clamp((Math.abs(vR) - .8) / 4, 0, 1) + (thr < 0 && vF > 8 ? .5 : 0) + (thr > 0 && Math.abs(vF) < 4 && d.k ? .25 : 0);
      d.acc = (vF - v0) / Math.max(dt, 1e-3);
    } else { d.w *= Math.exp(-1.5 * dt); d.slip = 0; d.acc = 0; }
    d.vx = fx * vF + rx * vR; d.vz = fz * vF + rz * vR; d.v = vF;
    d.h += d.w * dt; d.x += d.vx * dt; d.z += d.vz * dt;
    if (d.air && d.k) this.assist(d, dt);
    this.walls(a, d, dt, t);
    if (d.boost > 0) d.boost -= dt;
  }
  // in the air the car lines up with the road and drifts back toward the middle, so a jump in a gentle curve lands
  assist(d, dt) {
    if (!SKY.n || d.hint < 0) return;
    const s0 = SKY.S[d.hint], fw = carH(d.h), dir = fw.x * s0.t.x + fw.z * s0.t.z >= 0 ? 1 : -1;
    let dh = Math.atan2(-s0.t.z * dir, s0.t.x * dir) - d.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    if (Math.abs(dh) < 1) { d.h += dh * Math.min(1, dt * 2.6); const sp = Math.hypot(d.vx, d.vz), c = Math.cos(d.h), s = -Math.sin(d.h); d.vx = damp(d.vx, c * sp, 2.4, dt); d.vz = damp(d.vz, s * sp, 2.4, dt); }
    const lat = (d.x - s0.p.x) * s0.nx + (d.z - s0.p.z) * s0.nz, over = Math.abs(lat) - 2;
    if (over > 0) { const k = Math.min(over, 4 * dt) * Math.sign(lat); d.x -= s0.nx * k; d.z -= s0.nz * k; }
  }
  // collisions with the barriers / walls: probes at the corners and along the sides, rigid-body impulse at the contact
  walls(a, d, dt, t) {
    if (d.air && d.k) return;
    const fx = Math.cos(d.h), fz = -Math.sin(d.h), rx = -fz, rz = fx, hl = d.hl, hw = d.hw;
    const probes = [[hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw], [0, hw], [0, -hw], [hl, 0], [-hl, 0]];
    let best = null;
    for (const [pa, pb] of probes) {
      const px = d.x + fx * pa + rx * pb, pz = d.z + fz * pa + rz * pb;
      const c = d.k ? (px < TOWER.x0 ? skyWall(px, pz, .08, d.hint) : (px < XB[0] + .1 && !(pz > DOOR.z0 + .25 && pz < DOOR.z1 - .25)) ? {nx: 1, nz: 0, d: XB[0] + .1 - px} : null) : floorWall(px, pz, .08);
      if (c && (!best || c.d > best.d)) best = {c, pa, pb, px, pz};
    }
    if (!best) { d.wallT = 0; return; }
    const {c, pa, pb} = best, nx = c.nx, nz = c.nz;
    d.x += nx * c.d; d.z += nz * c.d;
    // contact point offset from the centre, its velocity (with the spin), and the impulse
    const ox = fx * pa + rx * pb, oz = fz * pa + rz * pb;
    const px_ = pb * fx - pa * rx, pz_ = pb * fz - pa * rz;          // velocity of the point per unit yaw rate
    const vcx = d.vx + d.w * px_, vcz = d.vz + d.w * pz_, vn = vcx * nx + vcz * nz;
    if (vn < 0) {
      const I = (hl * hl + hw * hw) / 3, rn = px_ * nx + pz_ * nz, e = .22, j = -(1 + e) * vn / (1 + rn * rn / I);
      d.vx += j * nx; d.vz += j * nz; d.w += j * rn / I;
      // scrape: friction along the wall
      const tx = -nz, tz = nx, vt = vcx * tx + vcz * tz, jt = clamp(-vt, -.35 * j, .35 * j); d.vx += jt * tx; d.vz += jt * tz; d.w += jt * (px_ * tx + pz_ * tz) / I;
      const hit = -vn, O = this.O;
      if (hit > 2.5) {
        if ((d.wallT || 0) < t - .25) { O.sfx('thud', Math.min(1, hit / 14)); O.shk = Math.max(O.shk || 0, Math.min(.7, hit * .045)); }
        if (O.pfx) for (let k = 0; k < Math.min(26, 4 + hit * 1.4); k++) O.pfx.emit('spark', best.px, d.y + .3, best.pz, tx * vt * .6 + nx * 3 + (Math.random() - .5) * 4, 1 + Math.random() * 3, tz * vt * .6 + nz * 3 + (Math.random() - .5) * 4);
        if (hit > 14) this.big('CRASH!');
      } else if (Math.abs(vt) > 4 && O.pfx && Math.random() < .6) O.pfx.emit('spark', best.px, d.y + .25, best.pz, tx * vt * .5 + (Math.random() - .5) * 2, Math.random() * 2, tz * vt * .5 + (Math.random() - .5) * 2);
      d.wallT = t;
    }
  }
  // Sky Deck: follow the road height, fly off the jumps, fall through gaps
  deck(a, d, dt, t) {
    const O = this.O, q = skyAt(d.x, d.z, d.hint), ps = d.s; d.hint = q.i; d.s = q.s;
    const ground = d.x > TOWER.x0 - .05 ? 0 : q.on && !q.gap ? q.y : null;
    if (!d.air) {
      if (ground === null || ground < d.y - .35) { d.air = 1; d.vy = Math.max(0, d.lastSlope || 0) * Math.abs(d.v); d.jumpT = t; }
      else {
        const S0 = SKY.S, nx = S0[(q.i + 1) % SKY.n], pv = S0[q.i], dir = Math.cos(d.h) * q.t.x - Math.sin(d.h) * q.t.z >= 0 ? 1 : -1;
        d.lastSlope = (nx.p.y - pv.p.y) * dir; d.sv = damp(d.sv, (ground - d.y) / Math.max(dt, 1e-3), 10, dt); d.y = ground;
      }
    }
    if (d.air) {
      d.vy -= GRAV * dt; d.y += d.vy * dt;
      if (ground !== null && d.y <= ground && d.vy <= 0) {
        const imp = -d.vy;
        if (imp > 7) { O.sfx('thud'); O.shk = Math.max(O.shk || 0, Math.min(.6, imp * .04)); }
        if (imp > 3 && O.pfx) for (let k = 0; k < 16; k++) O.pfx.emit('spark', d.x + (Math.random() - .5) * 2, ground + .1, d.z + (Math.random() - .5) * 2, (Math.random() - .5) * 6, Math.random() * 3, (Math.random() - .5) * 6);
        d.susp = -Math.min(.25, imp * .02); d.y = ground; d.air = 0; d.vy = 0;
        const air = d.jumpT ? t - d.jumpT : 0; d.jumpT = 0; if (air > .55) this.big((air > 1.1 ? 'BIG AIR  ' : 'AIR  ') + air.toFixed(1) + 's');
      }
      if (d.y < (ground === null ? q.y : ground) - 14 || d.y < -60) this.fall(a, d);
    }
    d.susp = damp(d.susp, 0, 9, dt);
    this.lean(d, q, dt);
    // boost pads
    for (const s of SKY.boosts) { const ds = ((d.s - s) % SKY.len + SKY.len) % SKY.len; if (ds < 6 && Math.abs(q.lat) < 2.8 && !d.air && (d.bT || 0) < t - 1) { d.bT = t; d.boost = 1.8; const sp = Math.max(Math.hypot(d.vx, d.vz), VMAXT * 1.15), c = Math.cos(d.h), s2 = -Math.sin(d.h); d.vx = c * sp; d.vz = s2 * sp; O.sfx('whee'); this.big('BOOST'); } }
    if (d.boost > 0 && O.pfx) { const c = carH(d.h); for (let k = 0; k < 2; k++) O.pfx.emit('flame', d.x - c.x * d.hl, d.y + .35, d.z - c.z * d.hl, -c.x * 6 + (Math.random() - .5), (Math.random() - .5), -c.z * 6 + (Math.random() - .5), {s0: .45, s1: .1}); }
    this.lapTick(d, ps, t);
  }
  fall(a, d) {
    if (this.tp) return; this.tp = 1; const O = this.O; this.fade.classList.add('on'); O.sfx('whoosh');
    const back = d.cpS != null ? d.cpS : SKY.start;
    setTimeout(() => { const p = skyPose(back + 6); d.x = p.x; d.z = p.z; d.y = p.y; d.h = Math.PI / 2 - p.h; d.vx = Math.cos(d.h) * 8; d.vz = -Math.sin(d.h) * 8; d.v = 8; d.w = 0; d.vy = 0; d.air = 0; d.hint = p.i; d.jumpT = 0; this.snap = 1; this.send(1); O.ui.toast('Off the deck! Back at the last checkpoint.'); setTimeout(() => { this.fade.classList.remove('on'); this.tp = 0; }, 140); }, 380);
  }
  big(txt) { const e = this.bigE; if (!e) return; e.textContent = txt; e.classList.add('on'); clearTimeout(this._bt); this._bt = setTimeout(() => e.classList.remove('on'), 1100); }
  lapTick(d, ps, t) {
    const L = d.lap || (d.lap = {t0: 0, cp: 0, sp: []}), len = SKY.len, step = ((d.s - ps) % len + len) % len;
    if (step > len / 2 || step > 60) return;     // going backwards, or just respawned
    const crossed = s => { const a = ((s - ps) % len + len) % len; return a > 0 && a <= step; };
    SKY.cps.forEach((s, i) => { if (crossed(s) && L.cp === i) { L.cp = i + 1; d.cpS = s; if (L.t0) { L.sp[i] = t - L.t0; this.split = {i, t: L.sp[i], at: t}; } } });
    if (crossed(SKY.start)) {
      if (L.t0 && L.cp >= SKY.cps.length) {
        const lt = t - L.t0, nb = !this.best || lt < this.best;
        if (nb) { this.best = lt; this.bestSp = L.sp.slice(); try { localStorage.setItem(LAPK, lt.toFixed(3)); } catch (e) {} this.board[this.me.nm] = lt; this.send(1); try { this.O.api.score && this.O.api.score('lap', Math.round(lt * 100)); } catch (e) {} }
        this.O.ui.toast((nb ? 'NEW BEST LAP ' : 'LAP ') + fmtLap(lt)); this.O.sfx(nb ? 'chaching' : 'ding'); if (nb) this.big('NEW BEST LAP');
      } else if (!L.t0) this.O.sfx('ding');
      L.t0 = t; L.cp = 0; L.sp = []; d.cpS = SKY.start;
      const sl = this.O.track && this.O.track.group.userData.startLights; if (sl) this.lights = t;
    }
  }
  // speedo, gear, lap timer with sector splits, minimap
  hud(d, t) {
    const sp = Math.abs(d.v), mph = Math.round(sp * MPH);
    if (this.spd) this.spd.textContent = String(mph);
    let gi = 0; while (gi < GEARS.length - 2 && sp > GEARS[gi + 1]) gi++; if (this.gearE) this.gearE.textContent = d.v < -.3 ? 'R' : sp < .3 ? 'N' : String(gi + 1);
    const f = clamp(sp / (VMAXT * 1.3), 0, 1), arc = (fr, r) => { const a0 = Math.PI * .75, a1 = a0 + Math.PI * 1.5 * fr, x0 = 50 + Math.cos(a0) * r, y0 = 50 + Math.sin(a0) * r, x1 = 50 + Math.cos(a1) * r, y1 = 50 + Math.sin(a1) * r; return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${fr > 2 / 3 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
    if (this.arc && (this._af === undefined || Math.abs(this._af - f) > .005)) { this._af = f; this.arc.setAttribute('d', f > .002 ? arc(f, 40) : ''); }
    const rpm = clamp((sp - GEARS[gi]) / (GEARS[gi + 1] - GEARS[gi]), 0, 1); if (this.rvE) this.rvE.setAttribute('d', rpm > .01 ? arc(rpm, 33) : '');
    const L = d.lap;
    if (d.k && L) {
      const cur = L.t0 ? fmtLap(t - L.t0) : 'CROSS THE LINE', sp0 = this.split && t - this.split.at < 3 ? this.split : null;
      let delta = ''; if (sp0 && this.bestSp && this.bestSp[sp0.i]) { const dd = sp0.t - this.bestSp[sp0.i]; delta = dd <= 0 ? `<em>${dd.toFixed(2)}</em>` : `<s>+${dd.toFixed(2)}</s>`; }
      const html = `LAP <b>${cur}</b>${delta ? ' ' + delta : ''}${this.best ? ' &nbsp;BEST <b>' + fmtLap(this.best) + '</b>' : ''}`;
      if (html !== this._lh) { this._lh = html; this.lapE.innerHTML = html; }
      this.mapE.style.display = ''; this.minimap(d);
    } else { if (this._lh) { this._lh = ''; this.lapE.textContent = ''; } this.mapE.style.display = 'none'; }
  }
  // the whole circuit, drawn once; my car and everyone else's as dots
  drawTrack() {
    if (!SKY.n) return; const S0 = SKY.S; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; S0.forEach(a => { x0 = Math.min(x0, a.p.x); x1 = Math.max(x1, a.p.x); z0 = Math.min(z0, a.p.z); z1 = Math.max(z1, a.p.z); });
    const c = document.createElement('canvas'); c.width = c.height = 300; const x = c.getContext('2d'), sc = 250 / Math.max(x1 - x0, z1 - z0), ox = 150 - (x0 + x1) / 2 * sc, oz = 150 - (z0 + z1) / 2 * sc;
    x.lineCap = x.lineJoin = 'round'; x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 9; x.beginPath(); S0.forEach((a, i) => { const px = ox + a.p.x * sc, pz = oz + a.p.z * sc; i ? x.lineTo(px, pz) : x.moveTo(px, pz); }); x.closePath(); x.stroke();
    x.strokeStyle = '#ff1f4f'; x.lineWidth = 3; x.stroke();
    const sl = S0[Math.round(SKY.start / SKY.len * SKY.n) % SKY.n]; x.fillStyle = '#fff'; x.fillRect(ox + sl.p.x * sc - 4, oz + sl.p.z * sc - 4, 8, 8);
    this.trk = {c, sc, ox, oz};
  }
  minimap(d) {
    if (!this.trk) this.drawTrack(); const T = this.trk; if (!T) return; const x = this.mapC.getContext('2d');
    // rotate so my heading points up
    x.clearRect(0, 0, 300, 300); x.save(); x.translate(150, 150); const h = Math.atan2(-Math.sin(d.h), Math.cos(d.h)); x.rotate(-h - Math.PI / 2); x.scale(1.6, 1.6); x.translate(-(T.ox + d.x * T.sc), -(T.oz + d.z * T.sc));
    x.drawImage(T.c, 0, 0);
    this.O.av.forEach(b => { if (b === this.me || !b.drv || !b.drv.k) return; x.fillStyle = '#ffd166'; x.beginPath(); x.arc(T.ox + b.drv.x * T.sc, T.oz + b.drv.z * T.sc, 5, 0, 6.283); x.fill(); });
    x.restore(); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(150, 138); x.lineTo(158, 160); x.lineTo(150, 155); x.lineTo(142, 160); x.closePath(); x.fill();
  }
  // tyre smoke and skid marks while sliding, braking hard or spinning the wheels
  fxSlide(a, d, remote) {
    const O = this.O, sl = remote ? .8 : d.slip; if (!this.skid || d.air) { if (this.skid) ['rl', 'rr'].forEach(w => this.skid.lift(w + a.id)); return; }
    const c = carH(d.h), rx = -c.z, rz = c.x, y = d.y + .03;
    [['rl', -1], ['rr', 1]].forEach(([w, sd]) => {
      const px = d.x - c.x * d.hl * .7 + rx * sd * d.hw * .8, pz = d.z - c.z * d.hl * .7 + rz * sd * d.hw * .8;
      if (sl > .25) { this.skid.add(w + a.id, px, y, pz, rx, rz, Math.min(1, sl)); if (O.pfx && Math.random() < sl * .8) O.pfx.emit('smoke', px, y + .15, pz, (Math.random() - .5) * 1.2 - d.vx * .05, .6 + Math.random() * .6, (Math.random() - .5) * 1.2 - d.vz * .05, {s0: .5, s1: 2.6, a: .32 * sl, life: 1.4}); }
      else this.skid.lift(w + a.id);
    });
  }
  // my car against walkers (ragdolls) and other cars (bumps)
  hitPeople(a, d, t) {
    const O = this.O, f = d.k ? 'd' : 'o', c = carH(d.h), rx = -c.z, rz = c.x;
    O.av.forEach(b => {
      if (b === a || b.leaving || !b.wk || b.wk.f !== f || b.rd) return;
      const p = b.root.position, dx = p.x - d.x, dz = p.z - d.z; if (Math.abs(p.y - d.y) > 1.6) return;
      const la = dx * c.x + dz * c.z, lb = dx * rx + dz * rz, ra = d.hl + .3, rb = d.hw + .3;
      if (Math.abs(la) > ra || Math.abs(lb) > rb) return;
      const sp = Math.hypot(d.vx, d.vz);
      if (sp > 3.2) {
        if ((b._knT || 0) > t - 1.2) return; b._knT = t;
        // launch: the car's velocity plus a push out to the side they were on, and up
        const side = Math.abs(lb) / rb, sx = rx * Math.sign(lb), sz = rz * Math.sign(lb);
        const vx = d.vx * .95 + sx * sp * .25 * side, vz = d.vz * .95 + sz * sp * .25 * side, vy = 2.2 + sp * .2;
        ragdoll(O, b, vx, vy, vz, {wy: (Math.random() - .5) * 4});
        this.kn++; this.knk = {id: b.id, n: this.kn, vx: +vx.toFixed(2), vy: +vy.toFixed(2), vz: +vz.toFixed(2)}; this.send(1);
        d.vx *= .86; d.vz *= .86; O.shk = Math.max(O.shk || 0, .35);
        O.ui.toast('Watch it! You sent ' + String(b.nm).split(' ')[0] + ' flying.');
      } else {
        // slow: they block the car (their own screen moves them out of the way)
        const k = (ra - Math.abs(la)) < (rb - Math.abs(lb)) ? 'a' : 'b';
        if (k === 'a') { const pen = ra - Math.abs(la), sg = Math.sign(la); d.x -= c.x * sg * pen; d.z -= c.z * sg * pen; }
        else { const pen = rb - Math.abs(lb), sg = Math.sign(lb); d.x -= rx * sg * pen; d.z -= rz * sg * pen; }
        const vn = d.vx * Math.sign(la) * c.x + d.vz * Math.sign(la) * c.z; if (vn > 0 && k === 'a') { d.vx -= c.x * Math.sign(la) * vn * 1.1; d.vz -= c.z * Math.sign(la) * vn * 1.1; }
      }
    });
  }
  // cars as three circles each: separate, then trade momentum (each car applies its own half, so both screens agree)
  hitCars(a, d, t) {
    const O = this.O, c = carH(d.h), r = d.hw * 1.02;
    O.av.forEach(b => {
      const e = b.drv; if (b === a || !e || e.k !== d.k || Math.abs(d.y - e.y) > 1.4) return;
      if (Math.hypot(d.x - e.x, d.z - e.z) > d.hl + e.hl + 1) return;
      const ce = carH(e.h); let bestD = 0, N = null, P = null;
      for (const ka of [-.6, 0, .6]) for (const kb of [-.6, 0, .6]) {
        const ax = d.x + c.x * d.hl * ka * 1.2, az = d.z + c.z * d.hl * ka * 1.2, bx = e.x + ce.x * e.hl * kb * 1.2, bz = e.z + ce.z * e.hl * kb * 1.2;
        const dx = ax - bx, dz = az - bz, dd = Math.hypot(dx, dz), lim = r + e.hw * 1.02;
        if (dd < lim && dd > 1e-4 && lim - dd > bestD) { bestD = lim - dd; N = [dx / dd, dz / dd]; P = [ka * d.hl * 1.2, (ax + bx) / 2, (az + bz) / 2]; }
      }
      if (!N) return;
      d.x += N[0] * bestD; d.z += N[1] * bestD;
      const rvx = d.vx - (e.vx || 0), rvz = d.vz - (e.vz || 0), vn = rvx * N[0] + rvz * N[1];
      if (vn < 0) {
        const j = -(1.3) * vn / 2; d.vx += j * N[0]; d.vz += j * N[1];
        const rx = -c.z, rz = c.x, lever = P[0]; d.w += (j * (N[0] * rx + N[1] * rz)) * lever * .25;
        if (-vn > 2 && (d._bump || 0) < t - .3) { d._bump = t; O.sfx('thud', Math.min(1, -vn / 10)); O.shk = Math.max(O.shk || 0, Math.min(.5, -vn * .05)); if (O.pfx) for (let k = 0; k < 14; k++) O.pfx.emit('spark', P[1], d.y + .4, P[2], (Math.random() - .5) * 5, 1 + Math.random() * 2, (Math.random() - .5) * 5); }
      }
    });
  }
  boardRows() { const m = Object.assign({}, this.board); if (this.best && this.O.meAv) m[this.O.meAv.nm] = this.best; return Object.entries(m).filter(r => r[1] > 0).sort((a, b) => a[1] - b[1]).map(([n, v]) => [n, '', v]); }
  // chase camera: swings out wide in slides, pulls back and widens with speed
  cam(P, T) {
    const d = this.me && this.me.drv; if (!d) return false;
    const sp = Math.hypot(d.vx, d.vz), c = carH(d.h), mv = sp > 2 ? {x: d.vx / sp, z: d.vz / sp} : c, k = d.k ? .35 : 0;
    const dirx = c.x * (1 - k) + mv.x * k, dirz = c.z * (1 - k) + mv.z * k, dl = Math.hypot(dirx, dirz) || 1;
    const back = (d.k ? 6.4 : 4.6) + sp * (d.k ? .085 : .16);
    P.set(d.x - dirx / dl * back, d.y + (d.k ? 2.6 + sp * .015 : 2.6), d.z - dirz / dl * back); T.set(d.x + c.x * 3, d.y + .9, d.z + c.z * 3);
    if (!d.k) { P.x = clamp(P.x, -9.7, 9.7); P.z = clamp(P.z, -6.7, 11.4); P.y = Math.min(P.y, 4.9); }
    return d.k ? 56 + Math.min(22, sp * .45) + (d.boost > 0 ? 6 : 0) : true;
  }
}

export {Drive, BOX as DRIVEBOX, steer0};
