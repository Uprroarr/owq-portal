// OWQ Sky Deck: a long hanging race track outside the office tower, reached by driving (or walking) through the
// west door of the Sales Floor. One closed loop with hills, banked turns, boost pads and two jumps over open air,
// hung from cables between tall pylons. Everything here is in Sales Floor coordinates (office floor y = 0).
import * as THREE from 'three';
import {cv, tex} from './tex.js';

// opening in the west wall of the Sales Floor
export const DOOR = {x: -10.3, z0: 2.5, z1: 4.7, h: 2.6};
const HW = 4.6;            // road half width
const STEP = 1;            // sample spacing (m)
// loop control points [x, y, z]: leaves the door heading south, swings west, climbs, comes back over two jumps
const CP = [
  [-17.4, 0, -6], [-17.4, 0, 10], [-19.5, -.8, 27], [-31, -2.6, 46], [-58, -4, 58.5], [-90, -.5, 58], [-119, 4.5, 43],
  [-134, 7, 13], [-131, 6, -19], [-114, 3.4, -43], [-86, .2, -60], [-57, -2.6, -64], [-35, -1.6, -50], [-22.5, 0, -27],
];
// features by distance along the loop (filled in once the length is known): jumps, boosts, start line, checkpoints
export const SKY = {len: 0, n: 0, S: [], gaps: [], boosts: [], start: 0, cps: [], pylons: []};

function smooth01(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

// build the samples once
function layout() {
  if (SKY.n) return SKY;
  const curve = new THREE.CatmullRomCurve3(CP.map(p => new THREE.Vector3(p[0], p[1], p[2])), true, 'centripetal');
  const L = curve.getLength(), n = Math.round(L / STEP);
  SKY.len = L; SKY.n = n;
  const pts = curve.getSpacedPoints(n);
  // jumps: kicker ramp up to the lip, an empty gap, a lower landing (positions as fractions of the loop)
  const J = [{at: .655, gap: 11, kick: 1.5, drop: 2.6}, {at: .85, gap: 7, kick: 1.1, drop: .6}];
  SKY.gaps = J.map(j => ({s0: j.at * L, s1: j.at * L + j.gap, kick: j.kick, drop: j.drop}));
  SKY.boosts = [.1, .62, .815].map(f => f * L);
  SKY.start = 14;   // start / finish line, just after the door
  SKY.cps = [.25, .5, .75].map(f => f * L);
  const S = SKY.S = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i].clone(), q = pts[(i + 1) % n], t = new THREE.Vector3(q.x - p.x, 0, q.z - p.z).normalize();
    const s = i * L / n;
    let y = p.y, gap = 0, lip = 0;
    for (const g of SKY.gaps) {
      // ramp: the last 9 m before the lip rise by `kick`; the landing side sits `drop` lower and eases back
      const before = g.s0 - s, after = s - g.s1;
      if (before >= 0 && before < 9) y += g.kick * smooth01(1 - before / 9);
      if (s >= g.s0 && s < g.s1) gap = 1;
      if (Math.abs(before) < STEP * .6) lip = 1;
      if (after >= 0 && after < 16) y -= g.drop * (1 - smooth01(after / 16));
    }
    S.push({p: new THREE.Vector3(p.x, y, p.z), t, nx: -t.z, nz: t.x, s, gap, lip, bank: 0});
  }
  // banking from the turn rate (visual only), smoothed
  for (let i = 0; i < n; i++) {
    const a = S[(i - 4 + n) % n].t, b = S[(i + 4) % n].t;
    const turn = Math.atan2(a.x * b.z - a.z * b.x, a.x * b.x + a.z * b.z);
    S[i].bank = Math.max(-.32, Math.min(.32, -turn * 1.6));
  }
  for (let k = 0; k < 3; k++) { const B = S.map(x => x.bank); for (let i = 0; i < n; i++) S[i].bank = (B[(i - 1 + n) % n] + B[i] * 2 + B[(i + 1) % n]) / 4; }
  return SKY;
}

// the short bridge from the door out to the loop's inside lane
export const BRIDGE = {x0: DOOR.x, x1: -13.2, z0: DOOR.z0 - .1, z1: DOOR.z1 + .1};

/* where am I on the deck? x,z world; hint = last sample index (or -1).
   returns {i, s, lat, y, gap, on} : on = 1 inside the road edges (or on the bridge), y = road height there */
export function skyAt(x, z, hint) {
  const D = layout(), S = D.S, n = D.n;
  let best = -1, bd = 1e9;
  const look = (i) => { const p = S[i].p, d = (x - p.x) * (x - p.x) + (z - p.z) * (z - p.z); if (d < bd) { bd = d; best = i; } };
  if (hint >= 0) { for (let k = -40; k <= 40; k++) look((hint + k + n) % n); if (bd > 400) hint = -1; }
  if (hint < 0) { bd = 1e9; for (let i = 0; i < n; i += 2) look(i); const b0 = best; for (let k = -3; k <= 3; k++) look((b0 + k + n) % n); }
  const c = S[best], dx = x - c.p.x, dz = z - c.p.z;
  const along = dx * c.t.x + dz * c.t.z, lat = dx * c.nx + dz * c.nz;
  const j = along >= 0 ? (best + 1) % n : (best - 1 + n) % n, f = Math.min(1, Math.abs(along) / STEP);
  const y = c.p.y + (S[j].p.y - c.p.y) * f;
  const gap = c.gap && S[j].gap ? 1 : c.gap && f < .5 ? 1 : S[j].gap && f >= .5 ? 1 : 0;
  let on = Math.abs(lat) < HW ? 1 : 0;
  // the bridge to the door
  const onBr = x <= BRIDGE.x0 + .05 && x >= BRIDGE.x1 - .6 && z > BRIDGE.z0 && z < BRIDGE.z1;
  if (onBr) on = 1;
  return {i: best, s: (c.s + along + D.len) % D.len, lat, y: onBr && !(Math.abs(lat) < HW) ? 0 : y, gap: onBr ? 0 : gap, on, bridge: onBr ? 1 : 0, t: c.t};
}
// does a circle of radius r at x,z hit a rail? (rails run along both edges except at the bridge opening and over gaps)
export function skyRail(x, z, r, hint) {
  const q = skyAt(x, z, hint);
  if (q.bridge) {
    // bridge side rails (the door opening and the loop end are open)
    return z - r < BRIDGE.z0 || z + r > BRIDGE.z1 ? (Math.abs(q.lat) >= HW - r ? true : false) : false;
  }
  if (q.gap) return false;
  if (Math.abs(q.lat) <= HW - r) return false;
  // inside-lane opening where the bridge joins (east edge of the loop next to the door)
  if (x > -14 && z > BRIDGE.z0 + r * .4 && z < BRIDGE.z1 - r * .4 && q.lat < 0 === (S0side() < 0)) return false;
  return true;
}
// which side of the loop (sign of lat) faces the door
let _side = null;
function S0side() { if (_side !== null) return _side; const q = skyAt(-12.6, (DOOR.z0 + DOOR.z1) / 2, -1); _side = Math.sign(q.lat) || 1; return _side; }

// ---------------------------------------------------------------- visuals
const BM = o => new THREE.MeshBasicMaterial(o);
function noiseCv(w, h, base, amp, f) {
  const c = cv(w, h), x = c.getContext('2d'); x.fillStyle = base; x.fillRect(0, 0, w, h);
  const d = x.getImageData(0, 0, w, h), a = d.data;
  for (let i = 0; i < a.length; i += 4) { const k = (Math.random() - .5) * amp; a[i] += k; a[i + 1] += k; a[i + 2] += k; }
  x.putImageData(d, 0, 0); f && f(x, w, h); return c;
}
function rep(c, u, v) { const t = tex(c, {mips: true}); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (u) t.repeat.set(u, v || u); return t; }
function sign(txt, w, h, col, glow) {
  const c = cv(1024, Math.round(1024 * h / w)), x = c.getContext('2d'); x.font = `900 ${Math.round(c.height * .62)}px Verdana,sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = glow; x.shadowBlur = c.height * .2; x.fillStyle = col; x.fillText(txt, c.width / 2, c.height / 2); x.shadowBlur = 0; x.fillText(txt, c.width / 2, c.height / 2); return c;
}
// strip along the loop between lateral offsets o0..o1, at height dy above the road (follows banking); skip gaps
function strip(S, o0, o1, dy, us, keep) {
  const pos = [], uv = [], idx = [], n = S.length; let k = 0;
  for (let i = 0; i <= n; i++) {
    const a = S[i % n], cb = Math.cos(a.bank), sb = Math.sin(a.bank);
    const P = (o) => [a.p.x + a.nx * o * cb, a.p.y + dy + o * sb, a.p.z + a.nz * o * cb];
    const A = P(o0), B = P(o1); pos.push(...A, ...B); uv.push(a.s / us, 0, a.s / us, 1);
    const prev = S[(i - 1 + n) % n];
    if (i && (!keep || keep(a, prev)) && !a.gap && !prev.gap) idx.push(k - 2, k, k - 1, k - 1, k, k + 1);
    k += 2;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// vertical band hanging from the road edge at offset o (rail / fascia)
function band(S, o, y0, y1, us, keep) {
  const pos = [], uv = [], idx = [], n = S.length; let k = 0;
  for (let i = 0; i <= n; i++) {
    const a = S[i % n], cb = Math.cos(a.bank), sb = Math.sin(a.bank);
    const x = a.p.x + a.nx * o * cb, z = a.p.z + a.nz * o * cb, y = a.p.y + o * sb;
    pos.push(x, y + y0, z, x, y + y1, z); uv.push(a.s / us, 0, a.s / us, 1);
    const prev = S[(i - 1 + n) % n];
    if (i && !a.gap && !prev.gap && (!keep || keep(a, prev, o))) idx.push(k - 2, k, k - 1, k - 1, k, k + 1);
    k += 2;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}

export function buildSky(parent) {
  const D = layout(), S = D.S, n = D.n;
  const G = new THREE.Group(); G.name = 'skydeck'; parent.add(G);
  const add = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.matrixAutoUpdate = false; m.updateMatrix(); G.add(m); return m; };
  // road: dark asphalt, crimson edge lines, white dashes
  const road = noiseCv(256, 128, '#1b1b21', 20, (x, w, h) => {
    x.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 40; i++) x.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    x.fillStyle = '#ff1f4f'; x.fillRect(0, 4, w, 5); x.fillRect(0, h - 9, w, 5);
    x.fillStyle = 'rgba(255,255,255,.75)'; x.fillRect(0, h / 2 - 2, w * .45, 4);
  });
  const roadT = rep(road); roadT.repeat.set(1, 1);
  const roadM = new THREE.MeshStandardMaterial({map: roadT, roughness: .62, metalness: .15, emissive: new THREE.Color('#ff1f4f'), emissiveIntensity: .0});
  // the top surface (uv u along the track, v across): repeat every 12 m
  const top = strip(S, -HW, HW, 0, 12);
  // swap uv so the texture runs along the road
  const tuv = top.attributes.uv; for (let i = 0; i < tuv.count; i++) { const u = tuv.getX(i), v = tuv.getY(i); tuv.setXY(i, v, u); }
  roadT.repeat.set(1, 1); roadT.rotation = 0;
  const topMesh = add(top, roadM); topMesh.receiveShadow = true;
  // neon edge lines just above the road and glowing curbs
  const glow = BM({color: new THREE.Color(3.2, .35, .8), toneMapped: false});
  add(strip(S, HW - .12, HW, .02, 4), glow); add(strip(S, -HW, -HW + .12, .02, 4), glow);
  // underside slab + fascia bands
  const under = BM({color: '#0b0a0f'});
  add(strip(S, -HW - .3, HW + .3, -.55, 12), new THREE.MeshBasicMaterial({color: '#08070b', side: THREE.DoubleSide}));
  const fasT = rep(noiseCv(256, 32, '#121118', 10, (x, w, h) => { x.fillStyle = '#ff1f4f'; for (let i = 0; i < w; i += 64) x.fillRect(i, h * .4, 34, 5); }), 1, 1);
  const fas = new THREE.MeshBasicMaterial({map: fasT, side: THREE.DoubleSide, color: new THREE.Color(1.3, 1.3, 1.3)});
  add(band(S, HW + .3, -.55, .02, 6), fas); add(band(S, -HW - .3, -.55, .02, 6), fas);
  // rails: posts + two glowing tubes (open where the bridge joins and over the jump gaps)
  const side = S0side();
  const openAt = (a, prev, o) => !(Math.sign(o) === side && a.p.x > -15 && a.p.z > BRIDGE.z0 - .2 && a.p.z < BRIDGE.z1 + .2);
  const railT = rep(noiseCv(128, 32, '#0f0e13', 6, (x, w, h) => { x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(0, 2, w, 2); x.fillStyle = 'rgba(255,31,79,.9)'; x.fillRect(0, h - 8, w, 4); }), 1, 1);
  const railM = new THREE.MeshBasicMaterial({map: railT, side: THREE.DoubleSide, transparent: true, opacity: .92});
  [HW + .15, -HW - .15].forEach(o => add(band(S, o, 0, 1.05, 3, openAt), railM));
  const railGlow = BM({color: new THREE.Color(2.6, .3, .7), toneMapped: false});
  [HW + .15, -HW - .15].forEach(o => add(band(S, o, 1.02, 1.1, 3, openAt), railGlow));
  // girders under the deck every 6 m and cross beams
  const beamG = new THREE.BoxGeometry(1, 1, 1), beamM = new THREE.MeshStandardMaterial({color: '#18171d', roughness: .5, metalness: .7});
  const beams = [];
  for (let i = 0; i < n; i += 6) { const a = S[i]; if (a.gap) continue; beams.push(a); }
  const inst = new THREE.InstancedMesh(beamG, beamM, beams.length * 2); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  beams.forEach((a, k) => {
    const yaw = Math.atan2(a.t.x, a.t.z);
    e.set(0, yaw, a.bank, 'YXZ'); q.setFromEuler(e);
    sc.set(2 * HW + .9, .32, .5); ps.set(a.p.x, a.p.y - .8, a.p.z); m4.compose(ps, q, sc); inst.setMatrixAt(k * 2, m4);
    sc.set(.6, .7, 6.2); ps.set(a.p.x, a.p.y - 1.2, a.p.z); m4.compose(ps, q, sc); inst.setMatrixAt(k * 2 + 1, m4);
  });
  inst.instanceMatrix.needsUpdate = true; G.add(inst);
  // pylons with red aviation lights, main cables and hangers: the deck hangs from them
  const pyl = [], cableY = [];
  for (let i = 0; i < n; i += 60) {
    const a = S[i], out = (a.bank >= 0 ? -1 : 1);
    const off = (HW + 9) * (i % 120 ? 1 : -1);
    pyl.push({x: a.p.x + a.nx * off, z: a.p.z + a.nz * off, y0: -120, y1: a.p.y + 38 + (i % 180) / 6, i});
  }
  D.pylons = pyl;
  const pylM = new THREE.MeshStandardMaterial({color: '#1d1c22', roughness: .4, metalness: .8});
  const red = BM({color: new THREE.Color(4, .3, .4), toneMapped: false});
  pyl.forEach(p => {
    const h = p.y1 - p.y0; add(new THREE.CylinderGeometry(.55, 1.4, h, 8), pylM, p.x, (p.y0 + p.y1) / 2, p.z);
    add(new THREE.SphereGeometry(.45, 10, 8), red, p.x, p.y1 + .4, p.z);
    add(new THREE.BoxGeometry(.2, 6, .2), BM({color: new THREE.Color(2.8, .35, .75), toneMapped: false}), p.x, p.y1 - 4, p.z);
  });
  // main cable: sags between pylon tops, passes above the road centre
  const capY = i => { // cable height over sample i
    const k = Math.floor(i / 60), a = pyl[k % pyl.length], b = pyl[(k + 1) % pyl.length], f = (i % 60) / 60;
    const top = a.y1 + (b.y1 - a.y1) * f; return top - 4 * 16 * f * (1 - f) - 2;
  };
  const cab = [], hang = [];
  for (let i = 0; i <= n; i += 2) { const a = S[i % n]; cab.push(new THREE.Vector3(a.p.x, capY(i % n), a.p.z)); }
  const cabG = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cab, true), n, .12, 5, true);
  add(cabG, new THREE.MeshBasicMaterial({color: '#2a2930'}));
  for (let i = 0; i < n; i += 5) {
    const a = S[i]; if (a.gap) continue; const cy = capY(i), cb = Math.cos(a.bank), sb = Math.sin(a.bank);
    [-HW - .25, HW + .25].forEach(o => { hang.push(a.p.x, cy, a.p.z, a.p.x + a.nx * o * cb, a.p.y + o * sb + 1.05, a.p.z + a.nz * o * cb); });
  }
  const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(hang, 3));
  G.add(new THREE.LineSegments(hg, new THREE.LineBasicMaterial({color: '#6b6a78', transparent: true, opacity: .55})));
  // jumps: glowing lips, chevrons on the ramp, warning signs
  const chev = cv(256, 256), cx = chev.getContext('2d'); cx.clearRect(0, 0, 256, 256); cx.strokeStyle = '#ffd166'; cx.lineWidth = 26; cx.lineCap = 'round';
  [70, 150].forEach(y => { cx.beginPath(); cx.moveTo(40, y + 50); cx.lineTo(128, y - 30); cx.lineTo(216, y + 50); cx.stroke(); });
  const chevM = BM({map: tex(chev, {mips: true}), transparent: true, depthWrite: false, color: new THREE.Color(2, 2, 2), toneMapped: false});
  const jumpSign = BM({map: tex(sign('JUMP', 6, 1.4, '#fff7d6', '#ffb100'), {mips: true}), transparent: true, depthWrite: false, color: new THREE.Color(2.2, 2.2, 2.2), toneMapped: false, side: THREE.DoubleSide});
  D.gaps.forEach(g => {
    const i0 = Math.round(g.s0 / D.len * n) % n, a = S[i0 % n], yaw = Math.atan2(a.t.x, a.t.z);
    for (let k = 3; k <= 9; k += 3) { const b = S[(i0 - k + n) % n]; const m = add(new THREE.PlaneGeometry(3.4, 3.4), chevM, b.p.x, b.p.y + .03, b.p.z, -Math.PI / 2, 0, 0); m.rotation.set(-Math.PI / 2, 0, -yaw + Math.PI); m.updateMatrix(); }
    add(new THREE.BoxGeometry(2 * HW, .12, .25), BM({color: new THREE.Color(4, 3.2, .8), toneMapped: false}), a.p.x, a.p.y + .02, a.p.z, 0, yaw, 0);
    const b = S[(i0 - 16 + n) % n], gy = Math.atan2(b.t.x, b.t.z);
    const m = add(new THREE.PlaneGeometry(6, 1.4), jumpSign, b.p.x, b.p.y + 6.2, b.p.z, 0, gy + Math.PI, 0);
    add(new THREE.BoxGeometry(.25, 6.2, .25), pylM, b.p.x + b.nx * (HW + .5), b.p.y + 3.1, b.p.z + b.nz * (HW + .5));
    add(new THREE.BoxGeometry(.25, 6.2, .25), pylM, b.p.x - b.nx * (HW + .5), b.p.y + 3.1, b.p.z - b.nz * (HW + .5));
    add(new THREE.BoxGeometry(.3, .3, 2 * HW + 1.2), pylM, b.p.x, b.p.y + 6.9, b.p.z, 0, gy + Math.PI / 2, 0);
  });
  // boost pads
  const bp = cv(256, 256), bx = bp.getContext('2d'); bx.fillStyle = 'rgba(0,0,0,0)'; bx.clearRect(0, 0, 256, 256); bx.fillStyle = '#4cc9f0'; bx.shadowColor = '#4cc9f0'; bx.shadowBlur = 30;
  [40, 120].forEach(y => { bx.beginPath(); bx.moveTo(30, y + 70); bx.lineTo(128, y); bx.lineTo(226, y + 70); bx.lineTo(196, y + 70); bx.lineTo(128, y + 26); bx.lineTo(60, y + 70); bx.closePath(); bx.fill(); });
  const bpM = BM({map: tex(bp, {mips: true}), transparent: true, depthWrite: false, color: new THREE.Color(2.4, 2.4, 2.4), toneMapped: false});
  D.boosts.forEach(s => { const i = Math.round(s / D.len * n) % n, a = S[i], yaw = Math.atan2(a.t.x, a.t.z); const m = add(new THREE.PlaneGeometry(4.2, 4.2), bpM, a.p.x, a.p.y + .04, a.p.z); m.rotation.set(-Math.PI / 2, 0, -yaw + Math.PI); m.updateMatrix(); });
  // start / finish gantry with a checkered line
  {
    const i = Math.round(D.start / D.len * n) % n, a = S[i], yaw = Math.atan2(a.t.x, a.t.z);
    const ch = cv(64, 256), c2 = ch.getContext('2d'); for (let r = 0; r < 4; r++) for (let k = 0; k < 16; k++) { c2.fillStyle = (r + k) % 2 ? '#111' : '#f2f2f2'; c2.fillRect(r * 16, k * 16, 16, 16); }
    const m = add(new THREE.PlaneGeometry(1.4, 2 * HW), BM({map: tex(ch, {mips: true})}), a.p.x, a.p.y + .03, a.p.z); m.rotation.set(-Math.PI / 2, 0, -yaw + Math.PI / 2); m.updateMatrix();
    [1, -1].forEach(sd => add(new THREE.BoxGeometry(.5, 7, .5), pylM, a.p.x + a.nx * sd * (HW + .7), a.p.y + 3.5, a.p.z + a.nz * sd * (HW + .7)));
    add(new THREE.BoxGeometry(2 * HW + 2, 1.3, .6), pylM, a.p.x, a.p.y + 7.2, a.p.z, 0, yaw + Math.PI / 2, 0);
    const sm = BM({map: tex(sign('START  ·  FINISH', 10, 1.2, '#ffffff', '#ff1f4f'), {mips: true}), transparent: true, depthWrite: false, color: new THREE.Color(2, 2, 2), toneMapped: false, side: THREE.DoubleSide});
    add(new THREE.PlaneGeometry(10, 1.2), sm, a.p.x + a.t.x * .32, a.p.y + 7.2, a.p.z + a.t.z * .32, 0, yaw, 0);
    add(new THREE.PlaneGeometry(10, 1.2), sm, a.p.x - a.t.x * .32, a.p.y + 7.2, a.p.z - a.t.z * .32, 0, yaw + Math.PI, 0);
  }
  // big neon sign on the first pylon
  {
    const p = pyl[1] || pyl[0];
    const m = BM({map: tex(sign('OWQ SKY DECK', 26, 4.2, '#fff0f6', '#ff2d78'), {mips: true}), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(2.4, 2.4, 2.4), toneMapped: false, side: THREE.DoubleSide});
    add(new THREE.PlaneGeometry(26, 4.2), m, p.x, p.y1 - 12, p.z, 0, Math.atan2(-p.x, -p.z), 0);
  }
  // the bridge from the door: deck, side rails, glow
  {
    const len = BRIDGE.x0 - BRIDGE.x1 + 1.2, w = BRIDGE.z1 - BRIDGE.z0, cx0 = (BRIDGE.x0 + BRIDGE.x1 - 1.2) / 2, cz = (BRIDGE.z0 + BRIDGE.z1) / 2;
    const br = add(new THREE.BoxGeometry(len, .5, w), roadM, cx0, -.25, cz);
    add(new THREE.BoxGeometry(len, .05, .1), glow, cx0, .03, BRIDGE.z0 + .05); add(new THREE.BoxGeometry(len, .05, .1), glow, cx0, .03, BRIDGE.z1 - .05);
    [BRIDGE.z0, BRIDGE.z1].forEach(z => add(new THREE.BoxGeometry(len, 1.05, .08), railM, cx0, .52, z));
  }
  // lap board on a screen by the start line
  const A0 = cv(1024, 640), J0 = tex(A0, {mips: false});
  {
    const i = Math.round((D.start + 22) / D.len * n) % n, a = S[i], yaw = Math.atan2(a.t.x, a.t.z), o = -(HW + 4) * side;
    const x = a.p.x + a.nx * o, z = a.p.z + a.nz * o;
    add(new THREE.BoxGeometry(.5, 9, .5), pylM, x, a.p.y + 2, z);
    add(new THREE.PlaneGeometry(9.6, 6), BM({map: J0, side: THREE.DoubleSide}), x, a.p.y + 7.2, z, 0, yaw + Math.PI / 2 * (side > 0 ? -1 : 1), 0);
  }
  const T0 = A0.getContext('2d');
  const board = (rows, sub) => {
    const j = T0; j.fillStyle = '#08060a'; j.fillRect(0, 0, 1024, 640); j.fillStyle = '#ff1f4f'; j.fillRect(0, 0, 1024, 10);
    j.font = '900 54px Verdana,sans-serif'; j.textAlign = 'left'; j.textBaseline = 'alphabetic'; j.fillStyle = '#fff'; j.fillText('SKY DECK  ·  FASTEST LAPS', 44, 90);
    j.font = '700 26px Verdana,sans-serif'; j.fillStyle = '#ffb3c2'; j.fillText(sub || 'Cross the line twice to set a time', 46, 132);
    (rows.length ? rows : [['No laps yet', '', 0]]).slice(0, 7).forEach((u, k) => {
      const yy = 200 + k * 62; j.fillStyle = k === 0 && u[2] ? 'rgba(255,209,102,.16)' : 'rgba(255,255,255,.05)'; j.fillRect(40, yy - 44, 944, 54);
      j.font = '800 34px Verdana,sans-serif'; j.fillStyle = k === 0 && u[2] ? '#ffd166' : '#fff'; j.fillText((u[2] ? k + 1 + '  ' : '') + String(u[0]).toUpperCase().slice(0, 22), 60, yy - 6);
      j.textAlign = 'right'; j.fillText(u[2] ? u[2].toFixed(2) + 's' : '', 964, yy - 6); j.textAlign = 'left';
    });
    J0.needsUpdate = true;
  };
  board([]);
  return {group: G, board, sky: D};
}

// a point and heading on the loop (used to respawn after a fall and to place the start)
export function skyPose(s) {
  const D = layout(), i = Math.round(((s % D.len) + D.len) % D.len / D.len * D.n) % D.n, a = D.S[i];
  return {x: a.p.x, y: a.p.y, z: a.p.z, h: Math.atan2(a.t.x, a.t.z), i};
}
export {HW as SKYHW};

// inside the Sales Floor: a lit archway in the west wall with a sign, so everyone can find the way out
export function buildDoorway(parent) {
  const G = new THREE.Group(); G.name = 'skydoor'; parent.add(G);
  const {x, z0, z1, h} = DOOR, zc = (z0 + z1) / 2, w = z1 - z0;
  const neon = new THREE.MeshBasicMaterial({color: new THREE.Color(3.2, .35, .85), toneMapped: false});
  const put = (g, m, px, py, pz, ry = 0) => { const o = new THREE.Mesh(g, m); o.position.set(px, py, pz); o.rotation.y = ry; G.add(o); return o; };
  const xi = -9.99;
  put(new THREE.BoxGeometry(.06, h, .07), neon, xi, h / 2, z0); put(new THREE.BoxGeometry(.06, h, .07), neon, xi, h / 2, z1); put(new THREE.BoxGeometry(.06, .07, w + .07), neon, xi, h, zc);
  // door jambs (the wall is thick)
  const jamb = new THREE.MeshStandardMaterial({color: '#141218', roughness: .4, metalness: .6});
  put(new THREE.BoxGeometry(.32, h, .04), jamb, -10.15, h / 2, z0 + .02); put(new THREE.BoxGeometry(.32, h, .04), jamb, -10.15, h / 2, z1 - .02); put(new THREE.BoxGeometry(.32, .04, w), jamb, -10.15, h - .02, zc);
  const c = cv(1024, 256), g = c.getContext('2d'); g.font = '900 118px Verdana,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#ff2d78'; g.shadowBlur = 40; g.fillStyle = '#fff0f6'; g.fillText('SKY DECK  ▶', 512, 128);
  put(new THREE.PlaneGeometry(2.6, .65), new THREE.MeshBasicMaterial({map: tex(c, {mips: true}), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(2.2, 2.2, 2.2), toneMapped: false}), xi + .02, h + .45, zc, Math.PI / 2);
  const a = cv(128, 128), ax = a.getContext('2d'); ax.strokeStyle = '#ff1f4f'; ax.lineWidth = 14; ax.lineCap = 'round';
  [20, 60].forEach(d => { ax.beginPath(); ax.moveTo(30 + d * .3, 100); ax.lineTo(64, 40 + d * .4); ax.lineTo(98 - d * .3, 100); ax.stroke(); });
  const am = new THREE.MeshBasicMaterial({map: tex(a, {mips: true}), transparent: true, depthWrite: false, opacity: .6});
  [1, 2.1].forEach(d => { const m = put(new THREE.PlaneGeometry(.8, .8), am, x + .3 + d, .006, zc); m.rotation.set(-Math.PI / 2, 0, Math.PI / 2); });
  return G;
}
