// unit checks for the laser tag maps, lasers, hit zones and movement (bun vo/test/arena_test.mjs)
globalThis.document = {createElement: () => ({getContext: () => null, width: 0, height: 0, style: {}}), getElementById: () => null, head: {appendChild() {}}};
globalThis.localStorage = {getItem: () => null, setItem() {}};
const THREE = await import('/home/claude/owq-src/vo/three/build/three.module.js');
const {ARTEST: T} = await import('/home/claude/owq-src/vo/src/arena.js');
let pass = 0, fail = 0; const ok = (c, m, i = '') => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c ? '' : '  ' + JSON.stringify(i))); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
for (const [name, make] of [['warehouse', T.warehouse], ['rooftop', T.rooftop], ['office', T.office]]) {
  const M = make(); M.C = M.boxes.filter(b => !b.nc && b.k !== 'ceil' && b.k !== 'oceil'); M.R = M.boxes.filter(b => !b.nb && !b.inv);
  // spawns are free and on the floor
  ['A', 'B'].forEach(t => M.spawns[t].forEach((s, i) => ok(T.freeAt(M, s[0], 0.001, s[1], 1.8), `${name}: spawn ${t}${i} is clear`, s)));
  // point symmetry (fair maps)
  ok(M.spawns.A.length === M.spawns.B.length, `${name}: both teams get the same spawns`);
  // a shot along the floor from spawn A toward the middle hits the opponent standing 9 m away
  const a = M.spawns.A[2], me = V(a[0] + 4, 1.62, a[1]), op = {x: a[0] + 13, y: 0, z: a[1]};
  const d = V(op.x - me.x, op.y + 1.5 - me.y, op.z - me.z).normalize();
  const w = T.rayMap(M, me, d, 160), z = T.rayZones(me, d, T.zones(op.x, op.y, op.z, 0));
  ok(z && z.k === 'head', `${name}: a head-height laser hits the head`, {z, w: w.t});
  ok(z && w.t > z.t, `${name}: no wall in the way at 9 m`, {wall: w.t, zone: z && z.t, n: w.n});
  const d2 = V(op.x - me.x, op.y + 1.0 - me.y, op.z - me.z).normalize(), z2 = T.rayZones(me, d2, T.zones(op.x, op.y, op.z, 0));
  ok(z2 && z2.k === 'body', `${name}: a chest-height laser hits the body`, z2);
  const d3 = V(op.x - me.x, op.y + .3 - me.y, op.z - me.z).normalize(), z3 = T.rayZones(me, d3, T.zones(op.x, op.y, op.z, 0));
  ok(z3 && z3.k === 'legs', `${name}: a knee-height laser hits the legs`, z3);
  // walls stop lasers: shoot at the outer wall
  const ww = T.rayMap(M, V(0, .6, 0), V(1, 0, 0), 500); ok(ww.hit && ww.t < M.bounds[2] + 1, `${name}: the outer wall (or the roof's parapet) stops a low laser`, ww.t);
  // standing still on the floor counts as standing, even with no time passing
  const S0 = {p: V(M.spawns.A[0][0], 0, M.spawns.A[0][1]), v: V(0, 0, 0), g: 0, hh: 1.8}; T.slide(M, S0, 0); ok(S0.g === 1, `${name}: standing still on the floor is standing`, S0);
  // movement: run into the outer wall and stop at it
  const B = {p: V(M.bounds[2] - 3, 0, 0), v: V(8, 0, 0), g: 1, hh: 1.8}; for (let i = 0; i < 120; i++) { B.v.y -= 20.3 / 120; T.slide(M, B, 1 / 120); }
  ok(B.p.x < M.bounds[2] - .29 && B.p.x > M.bounds[2] - .4 && B.g, `${name}: you stop at the wall and stay on the floor`, {x: B.p.x, y: B.p.y, g: B.g});
  // nav grid has a path across the map
  const N = T.navGrid(M), path = T.navPath(N, {x: M.spawns.A[0][0], z: M.spawns.A[0][1]}, {x: M.spawns.B[0][0], z: M.spawns.B[0][1]});
  ok(path && path.length >= 2, `${name}: the bot can find a way across`, path && path.length);
}
// stairs: walk up the warehouse stairs onto the catwalk
{ const M = T.warehouse(); M.C = M.boxes.filter(b => !b.nc && b.k !== 'ceil'); const B = {p: V(-20, 0, -14.3), v: V(0, 0, 0), g: 1, hh: 1.8};
  for (let i = 0; i < 480; i++) { B.v.x = 5; B.v.z = 0; B.v.y -= 20.3 / 120; T.slide(M, B, 1 / 120); }
  ok(B.p.y > 2.9 && B.p.x > -13, 'warehouse: the stairs take you up onto the catwalk', {x: B.p.x, y: B.p.y}); }
// the practice bot: it sees you, reacts, turns to aim and fires bursts (each tag hit comes through hurt())
{ const AR = await import('/home/claude/owq-src/vo/src/arena.js'); globalThis.addEventListener = globalThis.addEventListener || (() => {});
  const M = T.warehouse(); M.C = M.boxes.filter(b => !b.nc && b.k !== 'ceil' && b.k !== 'oceil'); M.R = M.boxes.filter(b => !b.nb && !b.inv); M.nav = T.navGrid(M); M.def = {o: [0, -420, 0], id: 'warehouse'}; M.G = new THREE.Group();
  const R = Object.create(AR.Arena.prototype), hits = []; R.O = {t: 0, sfx() {}}; R.v = V(0, 0, 0); R.v2 = V(0, 0, 0); R.v3 = V(0, 0, 0);
  R.tracer = () => {}; R.zap = () => {}; R.impact = () => {}; R.place = () => {}; R.muzzleOf = () => V(0, 0, 0); R.hurt = (d, hd) => hits.push([d, hd]);
  const me = {p: V(-15.6, 0, 0), v: V(0, 0, 0), c: 0, al: 1, hp: 100};
  const mk = cfg => ({av: {root: new THREE.Object3D()}, nm: 'bot', P: {p: V(-7.6, 0, 0), v: V(0, 0, 0), g: 1, hh: 1.8}, yaw: -Math.PI / 2 + .6, pitch: 0, c: 0, hp: 100, al: 1, d: 0, deadT: 0, prot: 0, path: null, pi: 0, see: 0, seenT: -9, last: null, react: 0, aimE: 0, burst: 0, next: 0, strafe: 1, strafeT: 0, roamT: 0, cfg});
  const run = (b, sec) => { R.match = {M, me, ph: 'play', bot: b}; let t = 10; hits.length = 0; let first = -1; for (let i = 0; i < sec * 60; i++) { t += 1 / 60; R.botTick(b, 1 / 60, t); if (first < 0 && hits.length) first = t - 10; } return {n: hits.length, first}; };
  const n = run(mk({react: .4, turn: 6, err: .04, fire: .026, burst: 5, head: .15, strafe: .8}), 3);
  ok(n.n >= 3 && n.first > .35, 'the normal bot spots you, reacts after its reaction time, turns to aim and tags you with a burst', n);
  const e = run(mk({react: .62, turn: 3.2, err: .07, fire: .045, burst: 3, head: .05, strafe: .6}), 3), h = run(mk({react: .24, turn: 10, err: .02, fire: .014, burst: 8, head: .3, strafe: 1}), 3);
  ok(e.first > h.first && h.n >= e.n, 'the hard bot reacts faster and lands more than the easy one', {easy: e, hard: h});
  const behind = () => Object.assign(mk({react: .3, turn: 6, err: 0, fire: .02, burst: 5, head: .1, strafe: .8}), {yaw: Math.PI / 2});
  me.p.set(-11, 0, 0); me.g = 1; me.v.set(0, 0, 0); const q = run(behind(), 2); me.v.set(6, 0, 0); const r = run(behind(), 2); me.v.set(0, 0, 0); me.p.set(-15.6, 0, 0);
  ok(q.n === 0 && r.n > 0, 'sneaking up behind the bot it stays unaware; running footsteps give you away', {quiet: q, running: r});
  me.al = 0; const z = run(mk({react: .05, turn: 9, err: 0, fire: 0, burst: 5, head: .1, strafe: 1}), 2); me.al = 1;
  ok(z.n === 0, 'the bot holds fire while you are down', z); }
console.log(`RESULT pass ${pass} fail ${fail}`);
