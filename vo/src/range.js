// OWQ Firing Range: one floor below the Sales Floor. Walk up to a lane, press E, and shoot targets with your own
// blaster (water, foam darts, corks, paint, bubbles, laser tag, confetti...). Nothing here is aimed at people:
// bullseyes, balloons, spinning plates and a gold star. 30 second rounds, team best on the wall.
// Shared through presence 'rg' ({l: lane, s: score, n: shot count, d: [dx,dy,dz] of the last shot, on}).
import * as THREE from 'three';
import {cv, tex} from './tex.js';
import {clamp, damp} from './util.js';
import {RANGEY, ELEVP} from './world.js';
import {FLOORBOX, FLOORRECT} from './walk.js';
import {EXT} from './cosm.js';

const Y = RANGEY;
const LANES = [-7.4, -2.6, 2.2, 6.8].map((x, i) => ({i, x, z: -3.6}));
const LINE = -2.85;          // the counter
const ROUND = 30;
// what each blaster fires: colour, speed (m/s, 0 = beam), spread, count, size
const SHOT = {
  0: {n: 'Range Loaner', c: '#ff8a3d', v: 38, k: 'dart'}, 1: {n: 'Water Blaster', c: '#6ad1ff', v: 26, k: 'drop', cnt: 3}, 2: {n: 'Foam Dart Pistol', c: '#ff7a1a', v: 40, k: 'dart'},
  3: {n: 'Cork Popper', c: '#c79a5a', v: 30, k: 'cork'}, 4: {n: 'Foam Blaster Rifle', c: '#ffb01a', v: 52, k: 'dart'}, 5: {n: 'Paintball Marker', c: '#3ddc97', v: 46, k: 'paint'},
  6: {n: 'Bubble Blaster', c: '#c9f0ff', v: 9, k: 'bubble', r: .28}, 7: {n: 'Laser Tag Pistol', c: '#ff2d55', v: 0, k: 'beam'}, 8: {n: 'Laser Tag Rifle', c: '#3dff9a', v: 0, k: 'beam'},
  9: {n: 'Confetti Cannon', c: '#ffd166', v: 30, k: 'confetti', cnt: 6, spr: .05}, 10: {n: 'Neon Arc Blaster', c: '#b388ff', v: 0, k: 'arc'}, 11: {n: 'Gold Blaster', c: '#ffcf4a', v: 0, k: 'beam'},
  12: {n: 'Diamond Blaster', c: '#9ff6ff', v: 60, k: 'shard'},
};
const CSS = `.vo3rg{position:absolute;inset:0;pointer-events:none;z-index:5;display:none}.vo3rg.on{display:block}
.vo3rgt{position:absolute;top:62px;left:50%;transform:translateX(-50%);padding:8px 16px;border-radius:999px;background:rgba(12,6,12,.78);border:1px solid rgba(76,201,240,.45);font:800 11px Verdana,sans-serif;letter-spacing:.12em;color:#8fdcff;white-space:nowrap}
.vo3rgx{position:absolute;top:58px;right:14px;pointer-events:auto;padding:9px 14px;border-radius:12px;border:0;background:#ff1f4f;color:#fff;font:800 11px Verdana,sans-serif;letter-spacing:.1em;cursor:pointer}
.vo3rgc{position:absolute;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:2px solid rgba(255,255,255,.9);box-shadow:0 0 12px rgba(255,31,79,.8);pointer-events:none}
.vo3rgc:before,.vo3rgc:after{content:'';position:absolute;background:#fff;left:50%;top:50%}.vo3rgc:before{width:2px;height:12px;margin:-6px 0 0 -1px}.vo3rgc:after{width:12px;height:2px;margin:-1px 0 0 -6px}
.vo3rgb{position:absolute;top:150px;left:50%;transform:translateX(-50%);font:900 44px Verdana,sans-serif;letter-spacing:.08em;color:#fff;text-shadow:0 0 24px #4cc9f0,0 3px 12px #000;opacity:0;transition:opacity .25s;white-space:nowrap}.vo3rgb.on{opacity:1}
.vo3rgb small{display:block;text-align:center;font-size:15px;letter-spacing:.2em;color:#ffd166}
.vo3rgp{position:absolute;font:900 18px Verdana,sans-serif;color:#ffd166;text-shadow:0 2px 8px #000;pointer-events:none;transition:transform .7s,opacity .7s}`;

function ring(c) {
  const k = cv(256, 256), x = k.getContext('2d');
  [[128, '#f4f1ea'], [104, '#ff1f4f'], [80, '#f4f1ea'], [56, '#ff1f4f'], [32, '#ffd166']].forEach(([r, col]) => { x.fillStyle = col; x.beginPath(); x.arc(128, 128, r, 0, Math.PI * 2); x.fill(); });
  x.fillStyle = '#120a10'; x.font = '900 26px Verdana,sans-serif'; x.textAlign = 'center'; x.fillText('OWQ', 128, 214); return k;
}
function sign(txt, col, glow) { const c = cv(1024, 256), x = c.getContext('2d'); x.font = '900 150px Verdana,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = glow; x.shadowBlur = 40; x.fillStyle = col; x.fillText(txt, 512, 130); return c; }
const BM = o => new THREE.MeshBasicMaterial(o);
const at = (o, p, r) => { if (p) o.position.copy(p); if (r) o.rotation.copy(r); return o; };

export class Range {
  constructor(O, parent) {
    this.O = O; this.me = null; this.lane = null; this.targets = []; this.shots = []; this.fx = []; this.n = 0; this.seen = {};
    const G = this.group = new THREE.Group(); G.name = 'range'; parent.add(G);
    this.build(G);
    FLOORRECT.g = {x0: -9.9, x1: 9.9, z0: -6.95, z1: LINE - .35};    // the counter stops you walking downrange
    if (!document.getElementById('vo3rgcss')) { const s = document.createElement('style'); s.id = 'vo3rgcss'; s.textContent = CSS; document.head.appendChild(s); }
    const u = this.ui = document.createElement('div'); u.className = 'vo3rg';
    u.innerHTML = '<div class=vo3rgt></div><div class=vo3rgc></div><div class=vo3rgb></div><button class=vo3rgx>LEAVE LANE</button>';
    O.el.appendChild(u); this.tE = u.querySelector('.vo3rgt'); this.cE = u.querySelector('.vo3rgc'); this.bE = u.querySelector('.vo3rgb');
    u.querySelector('.vo3rgx').onclick = e => { e.stopPropagation(); this.exit(); };
    this.mx = .5; this.my = .45;
    O.cv.addEventListener('pointermove', e => { if (!this.lane) return; const r = O.cv.getBoundingClientRect(); this.mx = (e.clientX - r.left) / r.width; this.my = (e.clientY - r.top) / r.height; });
    O.cv.addEventListener('pointerdown', e => { if (!this.lane) return; const r = O.cv.getBoundingClientRect(); this.mx = (e.clientX - r.left) / r.width; this.my = (e.clientY - r.top) / r.height; this.fire(); });
    addEventListener('keydown', e => {
      if (!this.lane) return; const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === ' ' || e.key === 'Enter') { this.fire(); e.preventDefault(); e.stopPropagation(); }
      else if (e.key === 'Escape' || e.key === 'q' || e.key === 'Q' || e.key === 'e' || e.key === 'E') { this.exit(); e.preventDefault(); e.stopPropagation(); }
      else if (/^(Arrow\w+|w|a|s|d|W|A|S|D)$/.test(e.key)) { const s = .03; if (/Left|a|A/.test(e.key)) this.mx -= s; if (/Right|d|D/.test(e.key)) this.mx += s; if (/Up|w|W/.test(e.key)) this.my -= s; if (/Down|s|S/.test(e.key)) this.my += s; this.mx = clamp(this.mx, .05, .95); this.my = clamp(this.my, .08, .92); e.preventDefault(); e.stopPropagation(); }
    }, true);
    this.ray = new THREE.Raycaster(); this.v2 = new THREE.Vector2();
  }
  build(G) {
    const add = (g, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); G.add(o); return o; };
    const H = 5.2, conc = cv(512, 512), cx = conc.getContext('2d'); cx.fillStyle = '#1b1a1f'; cx.fillRect(0, 0, 512, 512);
    const id = cx.getImageData(0, 0, 512, 512); for (let i = 0; i < id.data.length; i += 4) { const k = (Math.random() - .5) * 18; id.data[i] += k; id.data[i + 1] += k; id.data[i + 2] += k; } cx.putImageData(id, 0, 0);
    const cT = tex(conc, {mips: true}); cT.wrapS = cT.wrapT = THREE.RepeatWrapping; cT.repeat.set(4, 4);
    const wall = new THREE.MeshStandardMaterial({map: cT, roughness: .9, color: '#8c8794'}), floor = new THREE.MeshStandardMaterial({map: cT, roughness: .7, color: '#5e5a66'});
    add(new THREE.PlaneGeometry(20.2, 18.6).rotateX(-Math.PI / 2), floor, 0, Y, 2.3);
    add(new THREE.PlaneGeometry(20.2, 18.6).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({color: '#141317', roughness: 1}), 0, Y + H, 2.3);
    add(new THREE.PlaneGeometry(20.2, H), wall, 0, Y + H / 2, -7.0); add(new THREE.PlaneGeometry(20.2, H), wall, 0, Y + H / 2, 11.6, 0, Math.PI, 0);
    add(new THREE.PlaneGeometry(18.6, H), wall, -10.05, Y + H / 2, 2.3, 0, Math.PI / 2, 0); add(new THREE.PlaneGeometry(18.6, H), wall, 10.05, Y + H / 2, 2.3, 0, -Math.PI / 2, 0);
    // lights: crimson strips, white down lights over each lane
    const neon = BM({color: new THREE.Color(3.2, .35, .85), toneMapped: false}), cool = BM({color: new THREE.Color(3, 3.1, 3.4), toneMapped: false});
    add(new THREE.BoxGeometry(20, .06, .06), neon, 0, Y + H - .2, -6.9); add(new THREE.BoxGeometry(20, .06, .06), neon, 0, Y + .25, 11.5);
    [-10, 10].forEach(x => add(new THREE.BoxGeometry(.06, .06, 18.4), neon, x * .995, Y + 3.2, 2.3));
    // the counter and lane dividers
    const top = new THREE.MeshStandardMaterial({color: '#25232b', roughness: .35, metalness: .6});
    add(new THREE.BoxGeometry(19.8, 1.0, .55), top, 0, Y + .5, LINE); add(new THREE.BoxGeometry(19.8, .05, .62), neon, 0, Y + 1.02, LINE);
    const glass = new THREE.MeshBasicMaterial({color: '#9fd8ff', transparent: true, opacity: .1, side: THREE.DoubleSide, depthWrite: false});
    LANES.forEach((l, i) => { if (i) { const x = (LANES[i - 1].x + l.x) / 2; add(new THREE.PlaneGeometry(2.6, 2.4), glass, x, Y + 1.2, LINE - 1.1, 0, Math.PI / 2, 0); add(new THREE.BoxGeometry(.06, 2.4, .06), top, x, Y + 1.2, LINE - 2.4); FLOORBOX.g.push([x - .08, LINE - 2.4, x + .08, LINE]); } });
    // lane numbers
    LANES.forEach(l => { const c = sign(String(l.i + 1), '#fff', '#4cc9f0'); add(new THREE.PlaneGeometry(.9, .22), BM({map: tex(c, {mips: true}), transparent: true, depthWrite: false, color: new THREE.Color(2, 2, 2), toneMapped: false}), l.x, Y + 2.6, LINE - .3); add(new THREE.BoxGeometry(.5, .03, 1.4), cool, l.x, Y + H - .05, LINE - 1); });
    // backstop with rubber blocks and a big sign
    const bs = cv(512, 256), bx = bs.getContext('2d'); bx.fillStyle = '#0d0c10'; bx.fillRect(0, 0, 512, 256); for (let r = 0; r < 8; r++) for (let k = 0; k < 16; k++) { bx.fillStyle = (r + k) % 2 ? '#15141a' : '#111015'; bx.fillRect(k * 32 + (r % 2) * 16, r * 32, 30, 30); }
    const bT = tex(bs, {mips: true}); bT.wrapS = bT.wrapT = THREE.RepeatWrapping; bT.repeat.set(3, 1.5);
    add(new THREE.PlaneGeometry(20, H), new THREE.MeshStandardMaterial({map: bT, roughness: 1}), 0, Y + H / 2, 11.55, 0, Math.PI, 0);
    add(new THREE.PlaneGeometry(9, 2.2), BM({map: tex(sign('OWQ RANGE', '#fff0f6', '#ff2d78'), {mips: true}), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(2.2, 2.2, 2.2), toneMapped: false}), 0, Y + 3.9, 11.5, 0, Math.PI, 0);
    // target rails on the ceiling
    LANES.forEach(l => add(new THREE.BoxGeometry(.08, .08, 13), top, l.x, Y + H - .3, 4.6));
    // scoreboard on the left wall
    this.sbC = cv(1024, 512); this.sbT = tex(this.sbC, {mips: false});
    add(new THREE.PlaneGeometry(6, 3), BM({map: this.sbT}), -9.98, Y + 3.1, -4.4, 0, Math.PI / 2, 0);
    // elevator doors and frame on the back wall
    const brass = new THREE.MeshStandardMaterial({color: '#a88a3e', metalness: 1, roughness: .3});
    this.dL = add(new THREE.BoxGeometry(.66, 2.5, .04), brass, ELEVP.x - .33, Y + 1.25, -6.98); this.dR = add(new THREE.BoxGeometry(.66, 2.5, .04), brass, ELEVP.x + .33, Y + 1.25, -6.98);
    add(new THREE.BoxGeometry(1.5, .1, .1), neon, ELEVP.x, Y + 2.6, -6.96);
    add(new THREE.PlaneGeometry(2.2, .5), BM({map: tex(sign('FIRING RANGE', '#fff', '#4cc9f0'), {mips: true}), transparent: true, depthWrite: false, color: new THREE.Color(2, 2, 2), toneMapped: false}), ELEVP.x, Y + 3.1, -6.95);
    this.door = {o: 0, hold: 0};
    // target art
    this.ringT = tex(ring(), {mips: true}); this.ringM = new THREE.MeshStandardMaterial({map: this.ringT, roughness: .7, side: THREE.DoubleSide});
    this.board();
  }
  board(rows) {
    const x = this.sbC.getContext('2d'); x.fillStyle = '#07050a'; x.fillRect(0, 0, 1024, 512); x.fillStyle = '#4cc9f0'; x.fillRect(0, 0, 1024, 8);
    x.font = '900 52px Verdana,sans-serif'; x.fillStyle = '#fff'; x.textAlign = 'left'; x.fillText('OWQ RANGE', 40, 74);
    x.font = '800 24px Verdana,sans-serif'; x.fillStyle = '#ffb3c2'; x.fillText('30 SECONDS · BULLSEYE 50 · GOLD STAR 100', 40, 116);
    const L = rows || [];
    x.font = '800 30px Verdana,sans-serif';
    (L.length ? L : [['Step up to a lane', '']]).slice(0, 6).forEach((r, i) => { x.fillStyle = i ? '#fff' : '#ffd166'; x.fillText(String(r[0]).toUpperCase().slice(0, 24), 40, 176 + i * 54); x.textAlign = 'right'; x.fillText(String(r[1]), 984, 176 + i * 54); x.textAlign = 'left'; });
    this.sbT.needsUpdate = true;
  }
  // ---------- walking hooks
  walkPrompt(a) {
    const w = a.wk; if (!w || w.f !== 'g' || this.lane) return null;
    for (const l of LANES) if (Math.abs(w.x - l.x) < 1.1 && w.z > LINE - 1.6) { const used = this.usedBy(l.i); return used ? {k: 'lanebusy', t: 'LANE ' + (l.i + 1) + ': ' + String(used.nm).split(' ')[0].toUpperCase() + ' IS SHOOTING'} : {k: 'lane', t: 'START SHOOTING (LANE ' + (l.i + 1) + ')', l: l.i}; }
    return null;
  }
  walkUse(p) { if (p.k === 'lane') { this.enter(p.l); return true; } if (p.k === 'lanebusy') return true; return null; }
  usedBy(i) { let r = null; this.O.av.forEach(a => { if (!a.me && a.p && a.p.rg && a.p.rg.on && +a.p.rg.l === i) r = a; }); return r; }
  elevOpen(f) { if (f === 'g') this.door.hold = 2; }
  // ---------- my lane
  enter(i) {
    const O = this.O, a = O.meAv, l = LANES[i]; if (!a || !a.wk) return;
    const w = a.wk; w.x = l.x; w.z = l.z; w.h = 0; O.walk.lock = 1; a.lane = 1;
    const J = a.look && a.look.J || 0, kind = SHOT[J] || SHOT[0];
    this.lane = {i, l, t: -3, score: 0, hits: 0, shots: 0, J, kind, next: 0, over: 0};
    this.ui.classList.add('on'); this.big('GET READY', kind.n.toUpperCase()); O.sfx('click');
    this.gun(a, true); this.mx = .5; this.my = .42; this.snap = 1; this.send();
    this.clearTargets();
  }
  exit() {
    const O = this.O, L = this.lane; if (!L) return; this.lane = null; this.ui.classList.remove('on'); O.walk.lock = 0;
    const a = O.meAv; if (a) { a.lane = 0; this.gun(a, false); if (a.wk) a.wk.z = l0(a.wk.z); }
    this.clearTargets(); this.send(); function l0(z) { return Math.min(z, LINE - 1.2); }
  }
  gun(a, on) {
    if (on) {
      if (a._gun) return; let g = null; const J = a.look && a.look.J || 0;
      try { if (J && EXT.blaster) g = EXT.blaster(J); } catch (e) { g = null; }
      if (!g) { g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({color: '#ff7a1a', roughness: .45}); g.add(new THREE.Mesh(new THREE.BoxGeometry(.06, .08, .26), m)); g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .18, 10), new THREE.MeshStandardMaterial({color: '#2a64ff'})), new THREE.Vector3(0, .02, .18), new THREE.Euler(Math.PI / 2, 0, 0))); }
      g.scale.setScalar(1.25); g.position.set(-.12, 1.28, .36); a.rig.add(g); a._gun = g; if (a.blaster) a.blaster.visible = false;
      a.poseFx = (Z) => { Z.rsx = -1.45; Z.rsz = -.05; Z.rex = -.15; Z.lsx = -1.3; Z.lsz = .35; Z.lex = -.6; Z.hx = .06; Z.ty = .08; };
    } else if (a._gun) { a.rig.remove(a._gun); a._gun = null; if (a.blaster) a.blaster.visible = true; a.poseFx = null; }
  }
  clearTargets() { this.targets.forEach(t => this.group.remove(t.m)); this.targets = []; }
  spawn(L) {
    const r = Math.random, k = r(), l = L.l, z = 2.4 + r() * 8, y = Y + .9 + r() * 2.3, x = l.x + (r() - .5) * 2.4;
    let t;
    if (k < .5) { const m = new THREE.Mesh(new THREE.CircleGeometry(.36, 32), this.ringM); m.position.set(x, y, z); m.rotation.y = Math.PI; t = {k: 'ring', m, r: .36, life: 3.2 + r() * 1.5}; }
    else if (k < .75) { const col = ['#ff1f4f', '#4cc9f0', '#ffd166', '#3ddc97', '#b388ff'][(r() * 5) | 0]; const m = new THREE.Mesh(new THREE.SphereGeometry(.24, 16, 12), new THREE.MeshStandardMaterial({color: col, roughness: .25, emissive: col, emissiveIntensity: .25})); m.scale.y = 1.15; m.position.set(x, y, z); t = {k: 'balloon', m, r: .26, life: 4 + r() * 2, bob: r() * 6}; }
    else if (k < .95) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .03, 24), new THREE.MeshStandardMaterial({color: '#e8e4dc', roughness: .5})); m.rotation.x = Math.PI / 2; m.position.set(l.x - 1.6, y, z); t = {k: 'plate', m, r: .23, life: 3.4, vx: 1.1 + r() * .8}; }
    else { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? .14 : .32; i ? s.lineTo(Math.cos(a) * rr, -Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, -Math.sin(a) * rr); } s.closePath(); const m = new THREE.Mesh(new THREE.ShapeGeometry(s), BM({color: new THREE.Color(4, 3, .8), toneMapped: false, side: THREE.DoubleSide})); m.position.set(x, y, z); m.rotation.y = Math.PI; t = {k: 'star', m, r: .3, life: 2.2}; }
    t.t = 0; t.sc = 0; this.group.add(t.m); this.targets.push(t);
  }
  points(t, d) { if (t.k === 'ring') return d < .07 ? 50 : d < .16 ? 25 : 10; if (t.k === 'balloon') return 15; if (t.k === 'plate') return 30; return 100; }
  // aim ray from the camera through the crosshair
  aim() { const O = this.O; this.v2.set(this.mx * 2 - 1, -(this.my * 2 - 1)); this.ray.setFromCamera(this.v2, O.cam); return this.ray.ray; }
  fire() {
    const L = this.lane, O = this.O; if (!L || L.t < 0 || L.over) return;
    if (O.t < L.next) return; L.next = O.t + (L.J === 4 || L.J === 8 ? .14 : .26);
    const ray = this.aim(), K = L.kind, a = O.meAv;
    L.shots++; this.n++;
    const from = new THREE.Vector3(); if (a && a._gun) { a._gun.getWorldPosition(from); } else from.copy(ray.origin);
    const cnt = K.cnt || 1;
    for (let k = 0; k < cnt; k++) {
      const d = ray.direction.clone(); if (K.spr || cnt > 1) { d.x += (Math.random() - .5) * (K.spr || .02); d.y += (Math.random() - .5) * (K.spr || .02); d.normalize(); }
      this.shot(from, ray.origin, d, K, true);
    }
    O.sfx(K.k === 'beam' || K.k === 'arc' ? 'click' : K.k === 'cork' ? 'pop' : 'whoosh', .5);
    this.send(ray.direction);
  }
  // a projectile (or beam): hits are resolved along the camera ray when it arrives
  shot(from, origin, dir, K, mine) {
    const O = this.O, col = new THREE.Color(K.c);
    let hit = null, best = 1e9;
    if (mine) this.targets.forEach(t => {
      if (t.dead) return; const p = t.m.position, toT = p.clone().sub(origin), along = toT.dot(dir); if (along < 0) return;
      const off = toT.clone().addScaledVector(dir, -along).length(); const rr = t.r + (K.r || 0);
      if (off < rr && along < best) { best = along; hit = {t, d: off, at: along}; }
    });
    const end = origin.clone().addScaledVector(dir, hit ? hit.at : 16);
    if (K.v === 0) {
      // beam: instant
      const g = new THREE.BufferGeometry().setFromPoints([from, end]);
      const ln = new THREE.Line(g, new THREE.LineBasicMaterial({color: col.clone().multiplyScalar(3), toneMapped: false, transparent: true, linewidth: 2}));
      this.group.add(ln); this.fx.push({m: ln, life: K.k === 'arc' ? .22 : .12, t: 0});
      if (K.k === 'arc') { const pts = []; for (let i = 0; i <= 8; i++) { const p = from.clone().lerp(end, i / 8); if (i && i < 8) { p.x += (Math.random() - .5) * .25; p.y += (Math.random() - .5) * .25; } pts.push(p); } ln.geometry.setFromPoints(pts); }
      if (hit) this.score(hit, end, K);
    } else {
      const size = K.k === 'bubble' ? .14 : K.k === 'drop' ? .05 : K.k === 'shard' ? .05 : .045;
      const geo = K.k === 'dart' ? new THREE.CylinderGeometry(.02, .02, .13, 8).rotateX(Math.PI / 2) : K.k === 'shard' ? new THREE.OctahedronGeometry(size) : new THREE.SphereGeometry(size, 10, 8);
      const m = new THREE.Mesh(geo, K.k === 'bubble' ? new THREE.MeshStandardMaterial({color: col, transparent: true, opacity: .45, roughness: .05, metalness: .2}) : BM({color: col.clone().multiplyScalar(K.k === 'shard' || K.k === 'drop' ? 2 : 1.3), toneMapped: false}));
      m.position.copy(from); m.lookAt(end); this.group.add(m);
      const dist = from.distanceTo(end);
      this.shots.push({m, from: from.clone(), end, t: 0, T: dist / K.v, hit, K});
    }
  }
  score(hit, at, K) {
    const L = this.lane, O = this.O, t = hit.t; if (t.dead) return; t.dead = 1;
    const pts = this.points(t, hit.d); if (L) { L.score += pts; L.hits++; }
    O.fx.sparkle(at.x, at.y, at.z, t.k === 'star' ? 40 : 18, new THREE.Color(K.c).toArray());
    O.sfx(t.k === 'balloon' ? 'pop' : t.k === 'star' ? 'chaching' : 'clink', .7);
    this.popText('+' + pts + (t.k === 'ring' && pts === 50 ? ' BULLSEYE' : ''), at);
    if (t.k === 'ring') { t.vy = 0; t.fall = 1; } else t.gone = 1;
  }
  popText(txt, at) {
    const O = this.O, v = at.clone().project(O.cam); if (v.z > 1) return;
    const e = document.createElement('div'); e.className = 'vo3rgp'; e.textContent = txt; e.style.left = ((v.x * .5 + .5) * O.W) + 'px'; e.style.top = ((-v.y * .5 + .5) * O.H) + 'px'; this.ui.appendChild(e);
    requestAnimationFrame(() => { e.style.transform = 'translateY(-46px)'; e.style.opacity = '0'; }); setTimeout(() => e.remove(), 800);
  }
  send(dir) {
    const L = this.lane; try { this.O.api.state && this.O.api.state('rg', L ? {on: 1, l: L.i, s: L.score, n: this.n, d: dir ? [+dir.x.toFixed(3), +dir.y.toFixed(3), +dir.z.toFixed(3)] : null, J: L.J} : null); } catch (e) {}
  }
  big(t, s) { const e = this.bE; e.innerHTML = t + (s ? '<small>' + s + '</small>' : ''); e.classList.add('on'); clearTimeout(this._bt); this._bt = setTimeout(() => e.classList.remove('on'), 1400); }
  // ---------- per frame
  tick(dt, t) {
    const O = this.O, L = this.lane;
    if (L) {
      const pre = L.t < 0; L.t += dt;
      if (pre && L.t >= 0) { this.big('GO!', '30 SECONDS'); O.sfx('airhorn'); }
      if (L.t >= 0 && !L.over) {
        if ((L.sp = (L.sp || 0) - dt) <= 0 && this.targets.filter(x => !x.dead).length < 4) { L.sp = .45 + Math.random() * .5; this.spawn(L); }
        if (L.t >= ROUND) {
          L.over = 1; const best = this.best(), nb = L.score > best;
          if (nb) { try { localStorage.setItem('owq_rangebest', String(L.score)); } catch (e) {} }
          try { O.api.score && O.api.score('range', L.score); } catch (e) {}
          this.big(nb ? 'NEW BEST: ' + L.score : 'SCORE: ' + L.score, L.hits + ' HITS FROM ' + L.shots + ' SHOTS'); O.sfx(nb ? 'chaching' : 'ding'); this.send(); this.clearTargets();
          setTimeout(() => { if (this.lane === L) { L.t = -3; L.over = 0; L.score = 0; L.hits = 0; L.shots = 0; this.big('AGAIN?', 'E OR ESC TO LEAVE THE LANE'); } }, 3200);
        }
      }
      const left = L.t < 0 ? 'STARTS IN ' + Math.ceil(-L.t) : L.over ? 'ROUND OVER' : Math.max(0, ROUND - L.t).toFixed(1) + 's';
      this.tE.textContent = 'LANE ' + (L.i + 1) + '  ·  ' + L.kind.n.toUpperCase() + '  ·  ' + left + '  ·  SCORE ' + L.score + '  ·  BEST ' + this.best();
      this.cE.style.left = (this.mx * 100) + '%'; this.cE.style.top = (this.my * 100) + '%';
    }
    // targets
    this.targets = this.targets.filter(x => {
      x.t += dt; x.sc = damp(x.sc, x.dead && !x.fall ? 0 : 1, 12, dt); x.m.scale.setScalar(Math.max(.001, x.sc)); if (x.k === 'balloon') x.m.scale.y *= 1.15;
      if (x.k === 'balloon' && !x.dead) x.m.position.y += Math.sin((x.t + x.bob) * 2.2) * .003;
      if (x.k === 'plate' && !x.dead) { x.m.position.x += x.vx * dt; x.m.rotation.z += dt * 6; }
      if (x.k === 'star') x.m.rotation.z += dt * 2;
      if (x.fall) { x.m.rotation.x = damp(x.m.rotation.x, -Math.PI / 2, 8, dt); }
      if ((x.t > x.life && !x.dead) || (x.dead && (x.t > x.life + .6 || x.sc < .02))) { this.group.remove(x.m); return false; }
      if (x.t > x.life) x.dead = 1;
      return true;
    });
    // projectiles in flight
    this.shots = this.shots.filter(s => {
      s.t += dt; const f = Math.min(1, s.t / Math.max(.01, s.T)); s.m.position.lerpVectors(s.from, s.end, f); if (s.K.k === 'drop' || s.K.k === 'cork') s.m.position.y -= .25 * f * f;
      if (f >= 1) { if (s.hit) this.score(s.hit, s.end, s.K); else this.O.fx.sparkle(s.end.x, s.end.y, s.end.z, 6, new THREE.Color(s.K.c).toArray()); this.group.remove(s.m); return false; }
      return true;
    });
    this.fx = this.fx.filter(f => { f.t += dt; f.m.material.opacity = 1 - f.t / f.life; if (f.t >= f.life) { this.group.remove(f.m); return false; } return true; });
    // other shooters: show their shots coming out of their lane
    O.av.forEach(a => {
      if (a.me) return; const r = a.p && a.p.rg;
      if (r && r.on && a.wk && a.wk.f === 'g') {
        this.gun(a, true);
        if (+r.n !== (this.seen[a.id] || 0)) { const first = this.seen[a.id] === undefined; this.seen[a.id] = +r.n || 0; if (!first && Array.isArray(r.d)) { const from = new THREE.Vector3(); if (a._gun) a._gun.getWorldPosition(from); const d = new THREE.Vector3(+r.d[0] || 0, +r.d[1] || 0, +r.d[2] || 1).normalize(); this.shot(from, from, d, SHOT[+r.J || 0] || SHOT[0], false); } }
      } else if (a._gun) this.gun(a, false);
    });
    // elevator doors
    const d = this.door; d.hold = Math.max(0, d.hold - dt); d.o = damp(d.o, d.hold > 0 ? 1 : 0, d.hold > 0 ? 4 : 3, dt);
    this.dL.position.x = ELEVP.x - .33 - .62 * d.o; this.dR.position.x = ELEVP.x + .33 + .62 * d.o;
    const me = O.meAv; if (me && me.wk && me.wk.f === 'g' && Math.abs(me.wk.x - ELEVP.x) < 1.3 && me.wk.z < -5.6) d.hold = Math.max(d.hold, .6);
    if ((this._sbT = (this._sbT || 0) - dt) <= 0) { this._sbT = .6; this.board(this.rows()); }
  }
  rows() {
    const R = [], O = this.O;
    O.av.forEach(a => { const r = a.me ? (this.lane ? {on: 1, s: this.lane.score} : null) : a.p && a.p.rg; if (r && r.on) R.push([a.nm + ' (lane ' + ((a.me ? this.lane.i : +r.l) + 1) + ')', r.s || 0]); });
    let top = []; try { const T = O.api.tops ? O.api.tops() : {}; top = (T && T.range) || []; } catch (e) {}
    if (top.length) R.push(['TEAM BEST: ' + top[0][0], top[0][1]]);
    return R;
  }
  best() { try { return +localStorage.getItem('owq_rangebest') || 0; } catch (e) { return 0; } }
  cam(P, T, F0) {
    const L = this.lane; if (!L) return 0; const l = L.l;
    P.set(l.x + .42, Y + 1.72, l.z - .95); T.set(l.x + .1, Y + 1.45, 8); return clamp(F0 * .95, 40, 62);
  }
  grab() { return !!this.lane; }
  zone(z) { if (z === this._z) return; this._z = z; this.group.visible = z === 'g'; }
  leave() { if (this.lane) this.exit(); }
}
