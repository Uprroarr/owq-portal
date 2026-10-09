// flight model checks: takeoff, an assisted landing on runway 27, the crash rules, stopping on the runway (bun vo/test/fly_test.mjs)
globalThis.document = {createElement: () => ({getContext: () => null, width: 0, height: 0, style: {}}), getElementById: () => null, head: {appendChild() {}}};
globalThis.localStorage = {getItem: () => null, setItem() {}}; globalThis.addEventListener = () => {};
const {Fly, RWY, LIMITS} = await import('/home/claude/owq-src/vo/src/fly.js');
const {ROOFY} = await import('/home/claude/owq-src/vo/src/world.js');
let pass = 0, fail = 0; const ok = (c, m, i = '') => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c ? '' : '  ' + JSON.stringify(i))); };
function rig() {
  const F = Object.create(Fly.prototype), scores = [], said = [];
  F.O = {t: 0, sfx() {}, fx: {sparkle() {}}, api: {score: (g, s) => scores.push([g, s])}, wld: {blds: []}, pfx: null, shk: 0};
  Object.assign(F, {keys: {}, sens: 5, assist: true, rings: [], ri: 0, rt0: 0, big: (t, s) => said.push(t + ' | ' + (s || '')), ringUI() {}, land(c) { F.landed = c ? 'crash' : 'ok'; }, crashWhy: null});
  const crash = F.crash.bind(F); F.crash = why => { F.crashWhy = why; F.me.fly.crashed = 1; };
  const f = {m: {userData: {gear: []}, visible: true}, x: 74, y: ROOFY, z: RWY.z, yaw: Math.PI / 2, pitch: 0, roll: 0, v: 0, vy: 0, thr: .9, gear: 1, gearAuto: true, gr: 1, c: 1};
  F.me = {fly: f}; return {F, f, scores, said};
}
const run = (F, f, sec, keys = {}) => { F.keys = keys; const dt = 1 / 90; for (let i = 0; i < sec * 90 && !f.crashed; i++) { F.O.t += dt; F.step(F.me, f, dt, F.O.t); } };
// 1. takeoff with no input: the assist rotates at speed, gear comes up
{ const {F, f} = rig(); run(F, f, 12);
  ok(!f.gr && f.y > ROOFY + 25 && !f.crashed, 'takeoff: full throttle and the assist lift you off and climb', {y: f.y - ROOFY, v: f.v, gr: f.gr, why: F.crashWhy});
  ok(f.gear === 0, 'takeoff: the gear comes up after liftoff', f.gear); }
// 2. practice landing, hands off: the assist flies the approach and flares
{ const {F, f, scores, said} = rig(); const d = 1800; Object.assign(f, {x: 628 + d, z: RWY.z + 12, y: ROOFY + d * Math.tan(3.5 * Math.PI / 180) + 20, yaw: -Math.PI / 2, pitch: -.06, v: 34, thr: .2, gr: 0, gear: 1});
  let td = null; const dt = 1 / 90; for (let i = 0; i < 90 * 120 && !f.crashed; i++) { F.O.t += dt; const was = f.gr; F.step(F.me, f, dt, F.O.t); if (!was && f.gr && !td) td = {x: f.x, z: f.z, said: said[said.length - 1]}; if (f.gr && f.v < .3) break; }
  ok(td && !f.crashed, 'practice landing: hands off, the assist puts you down on the runway', {td, why: F.crashWhy, y: f.y, x: f.x});
  const sc = scores.find(s => s[0] === 'landing'); ok(sc && sc[1] >= 70, 'practice landing: the touchdown is graded (70+ hands off)', {sc, said: said.slice(-2)});
  ok(td && /BUTTER|SMOOTH/.test(td.said), 'practice landing: the flare makes it smooth', td && td.said);
  ok(f.gr && f.x > RWY.x0, 'practice landing: the plane stops on the runway (rolling out with no brakes)', {x: f.x, v: f.v}); }
// 3. the crash rules at touchdown
const drop = (o, keys) => { const {F, f} = rig(); Object.assign(f, {x: 600, z: RWY.z, y: ROOFY + 1, yaw: -Math.PI / 2, pitch: -.03, roll: 0, v: 34, thr: .2, gr: 0, gear: 1, gearAuto: false}, o); F.assist = false; run(F, f, 3, keys); return F.crashWhy; };
ok(/TOO HARD/.test(drop({y: ROOFY + 4, pitch: -.3}) || ''), 'crash rule: diving into the runway (sink over ' + LIMITS.sink + ' m/s) is a crash', drop({y: ROOFY + 4, pitch: -.3}));
ok(/GEAR UP/.test(drop({gear: 0}) || ''), 'crash rule: landing with the gear up is a crash');
ok(/WING STRIKE/.test(drop({roll: .6}, {left: 1}) || ''), 'crash rule: touching down banked over ' + LIMITS.bank + ' degrees is a crash', drop({roll: .6}, {left: 1}));
ok(/MISSED THE RUNWAY/.test(drop({z: RWY.z + 26}) || ''), 'crash rule: touching down beside the runway is a crash', drop({z: RWY.z + 26}));
ok(drop({pitch: -.025}) === null, 'a gentle touchdown is not a crash', drop({pitch: -.03}));
// 4. brakes: land at the markers and stop well before the end
{ const {F, f} = rig(); Object.assign(f, {x: 640, z: RWY.z, y: ROOFY, yaw: -Math.PI / 2, v: 32, thr: 0, gr: 1, done: 1, gear: 1}); run(F, f, 20, {slow: 1});
  ok(f.v === 0 && f.x > RWY.x0 + 300 && !f.crashed, 'braking (SPACE) stops the plane well before the end of the runway', {x: f.x, v: f.v}); }
// 5. overrun: no brakes, fast, short of the end -> crash
{ const {F, f} = rig(); Object.assign(f, {x: 120, z: RWY.z, y: ROOFY, yaw: -Math.PI / 2, v: 40, thr: 0, gr: 1, done: 1}); run(F, f, 8);
  ok(/OVERRAN/.test(F.crashWhy || ''), 'running off the end of the runway is a crash', F.crashWhy); }
console.log(`RESULT pass ${pass} fail ${fail}`);
