// car physics checks on the Sky Deck: barrier glance and head-on bounce, car-to-car boxes, people knocked flying or
// blocking a slow car, and a full ragdoll (fly, lie, get up) on the deck (bun vo/test/drive_test.mjs)
globalThis.document = {createElement: () => ({getContext: () => null, width: 0, height: 0, style: {}, classList: {add() {}, remove() {}, contains: () => false}}), getElementById: () => null, head: {appendChild() {}}};
globalThis.localStorage = {getItem: () => null, setItem() {}}; globalThis.addEventListener = () => {};
const THREE = await import('three');
const {Drive} = await import('/home/claude/owq-src/vo/src/drive.js');
const {skyLayout, skyAt, WALL} = await import('/home/claude/owq-src/vo/src/sky.js');
const {tickRagdolls} = await import('/home/claude/owq-src/vo/src/ragdoll.js');
let pass = 0, fail = 0; const ok = (c, m, i = '') => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c ? '' : '  ' + JSON.stringify(i))); };
const SKY = skyLayout(), S = SKY.S, n = SKY.n;
// a straight, flat stretch away from the plaza, the jumps, the tunnel and the boost pads
const straight = (() => { const good = i => { const c = S[i]; for (let k = -10; k <= 40; k++) { const e = S[(i + k + n) % n]; if (e.gap || e.ramp || e.tun || Math.abs(e.bank) > .035 || c.t.x * e.t.x + c.t.z * e.t.z < .997 || Math.abs(e.p.y - c.p.y) > .6) return false; if (e.p.x > -60 && e.p.x < -5 && e.p.z > -25 && e.p.z < 35) return false; for (const b of SKY.boosts) { const ds = Math.abs(e.s - b); if (ds < 12 || ds > SKY.len - 12) return false; } } return true; }; for (let i = 0; i < n; i += 5) if (good(i)) return i; return -1; })();
ok(straight >= 0, 'there is a straight to test on', straight);
const I = straight, C = S[I];
function rig() {
  const D = Object.create(Drive.prototype), said = [];
  const O = {t: 0, av: new Map(), sfx() {}, fx: {sparkle() {}}, ui: {toast() {}}, api: {}, pfx: null, shk: 0, room: {group: {add() {}, remove() {}}}, walk: null};
  Object.assign(D, {O, keys: {}, sens: 5, kn: 0, knk: null, sendT: 0, last: '', board: {}, best: 0, bigE: null, lapE: {textContent: ''}, send() {}, hud() {}, fxSlide() {}, eng: {set() {}}, big: t => said.push(t)});
  const mk = (id, x, z, h, v, me) => { const root = new THREE.Object3D(); const a = {id, nm: id, root, me: !!me}; const d = {c: 8, x, z, y: C.p.y, h, vx: Math.cos(h) * v, vz: -Math.sin(h) * v, v, w: 0, st: 0, L: 3.4, hl: 1.3, hw: .62, k: 1, hint: I, air: 0, vy: 0, pitch: 0, roll: 0, s: 0, slip: 0, susp: 0, sv: 0, lap: null}; a.drv = d; O.av.set(id, a); return a; };
  return {D, O, said, mk};
}
const along = (h) => Math.atan2(-C.t.z, C.t.x) + h;           // heading that points along the road, turned h toward +lat
const lat = (x, z) => (x - C.p.x) * C.nx + (z - C.p.z) * C.nz, alg = (x, z) => (x - C.p.x) * C.t.x + (z - C.p.z) * C.t.z;
const drive = (D, a, sec, keys = {}, each) => { D.keys = keys; const dt = 1 / 60; for (let i = 0; i < sec * 60; i++) { D.O.t += dt; D.mine(a, a.drv, dt, D.O.t); if (each) each(a.drv); } };
// put a car on the centreline at metres m along the straight
const at = (m, l = 0) => ({x: C.p.x + C.t.x * m + C.nx * l, z: C.p.z + C.t.z * m + C.nz * l});
// 1. a glancing hit: 12 degrees into the barrier at 28 m/s
{ const {D, mk} = rig(); const p = at(0); const a = mk('me', p.x, p.z, along(-.21), 28, 1); D.me = a; let mx = 0;
  drive(D, a, 1.8, {}, d => { mx = Math.max(mx, Math.abs(skyAt(d.x, d.z, d.hint).lat)); }); const d = a.drv, q = skyAt(d.x, d.z, d.hint), cc = S[q.i], sp = Math.hypot(d.vx, d.vz), vt = d.vx * cc.t.x + d.vz * cc.t.z, vn = d.vx * cc.nx + d.vz * cc.nz;
  ok(mx < WALL - d.hw * .5, 'glance: the car never goes through the barrier', {mx, hw: d.hw});
  ok(sp > 18 && vt > 18, 'glance: it scrapes along and keeps most of its speed', {sp, vt});
  ok(vn < .5 && vn > -2.5, 'glance: the barrier turns it back along the road', {vn, lat: q.lat}); }
// 2. head-on into the barrier at 15 m/s
{ const {D, mk, said} = rig(); const p = at(0); const a = mk('me', p.x, p.z, along(-Math.PI / 2), 15, 1); D.me = a; let mx = 0;
  drive(D, a, .6, {}, d => { mx = Math.max(mx, Math.abs(skyAt(d.x, d.z, d.hint).lat)); }); const d = a.drv, vn = d.vx * C.nx + d.vz * C.nz;
  ok(mx < WALL, 'head-on: the car stays on the road side of the barrier', mx);
  ok(vn < 0 && Math.hypot(d.vx, d.vz) < 6, 'head-on: it bounces back off the wall', {vn, sp: Math.hypot(d.vx, d.vz)});
  ok(said.some(s => /CRASH/.test(s)), 'head-on: a hard hit says CRASH!', said); }
// 3. rear-ending a parked car at 12 m/s with the gas held: boxes, not circles (no gap, no driving through)
{ const {D, mk} = rig(); const p = at(0), q = at(20); const a = mk('me', p.x, p.z, along(0), 12, 1), b = mk('bot', q.x, q.z, along(0), 0); D.me = a; let minGap = 1e9;
  drive(D, a, 2.5, {up: 1}, d => { minGap = Math.min(minGap, alg(b.drv.x, b.drv.z) - alg(d.x, d.z)); }); const d = a.drv;
  ok(minGap > d.hl + b.drv.hl - .12, 'rear-end: the cars never overlap', {minGap, need: d.hl + b.drv.hl});
  ok(minGap < d.hl + b.drv.hl + .25, 'rear-end: the bumpers really touch (no invisible gap)', {minGap, need: d.hl + b.drv.hl});
  ok(Math.abs(lat(d.x, d.z)) < 1.5, 'rear-end: a square hit does not spin you off the road', lat(d.x, d.z)); }
// 4. T-bone at an angle: an off-centre hit spins my car
{ const {D, mk} = rig(); const p = at(0, -4), q = at(8, 1.2); const a = mk('me', p.x, p.z, along(.5), 14, 1), b = mk('bot', q.x, q.z, along(Math.PI / 2), 0); D.me = a; let w = 0, minD = 1e9;
  drive(D, a, 1.5, {}, d => { w = Math.max(w, Math.abs(d.w)); });
  ok(w > .4, 'off-centre hit: the impact spins the car', w); }
// 5. people: slow car is blocked, fast car sends them flying, then they lie down and get back up on the deck
{ const {D, O, mk} = rig(); const p = at(0), v = at(8); const a = mk('me', p.x, p.z, along(0), 2.2, 1); D.me = a;
  const root = new THREE.Object3D(); root.position.set(v.x, C.p.y, v.z); const w = {id: 'w', nm: 'Walker', root, wk: {x: v.x, y: C.p.y, z: v.z, h: 0, f: 'd', hint: I}}; O.av.set('w', w);
  // creeping at walking pace (2.2 m/s held) right into them
  let minGap = 1e9; drive(D, a, 4, {}, d => { d.vx = C.t.x * 2.2; d.vz = C.t.z * 2.2; minGap = Math.min(minGap, 8 - alg(d.x, d.z)); }); const d = a.drv;
  ok(!w.rd && minGap >= d.hl + .25 && minGap < d.hl + .6, 'slow car: someone standing in the road stops it (no knock-down, no driving through)', {minGap, need: d.hl + .3, rd: !!w.rd});
  const p2 = at(-6); Object.assign(d, {x: p2.x, z: p2.z, vx: C.t.x * 15, vz: C.t.z * 15, v: 15, w: 0, h: along(0)});
  let hit = -1, top = 0, lie = -1, up = -1; const dt = 1 / 60;
  for (let i = 0; i < 60 * 9; i++) { O.t += dt; if (D.me) D.mine(a, d, dt, O.t); tickRagdolls(O, dt); if (w.rd && hit < 0) hit = i; if (w.rd && w.rd.ph === 'fly') top = Math.max(top, w.root.position.y - C.p.y); if (w.rd && w.rd.ph === 'lie' && lie < 0) lie = i; if (hit >= 0 && !w.rd) { up = i; break; } }
  ok(hit >= 0, 'fast car: hitting someone knocks them flying', hit);
  ok(top > .6, 'fast car: they fly up off the road', top);
  ok(lie > hit, 'they land and lie there a moment', {hit, lie});
  ok(up > lie, 'then they get back up', {lie, up});
  const q = skyAt(w.root.position.x, w.root.position.z, I);
  ok(q.on && !q.gap && Math.abs(w.root.position.y - q.y) < .3 && Math.abs(q.lat) < WALL + .8, 'and stand on the deck where they landed', {y: w.root.position.y, q});
  ok(D.knk && D.knk.id === 'w', 'the hit is sent out so everyone plays the same ragdoll', D.knk); }
console.log(`RESULT pass ${pass} fail ${fail}`);
