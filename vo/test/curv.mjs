const {skyLayout, SKY} = await import('/home/claude/owq-src/vo/src/sky.js');
const D = skyLayout(), S = D.S, n = D.n;
console.log('len', D.len.toFixed(1), 'n', n);
const turnAt = i => { const a = S[(i - 3 + n) % n].t, b = S[(i + 3) % n].t; return Math.atan2(a.x * b.z - a.z * b.x, a.x * b.x + a.z * b.z) / 6; }; // rad per m
for (const g of D.gaps) {
  const i0 = Math.round(g.s0 / D.len * n);
  let line = [];
  for (let k = -40; k <= 30; k += 5) { const i = (i0 + k + n) % n; line.push(k + ':' + (turnAt(i) * 57.3).toFixed(2)); }
  console.log('gap at', g.s0.toFixed(1), 'pos', S[i0].p.x.toFixed(1), S[i0].p.z.toFixed(1), 'deg/m', line.join(' '));
}
// max curvature overall
let mx = 0, mi = 0; for (let i = 0; i < n; i++) { const c = Math.abs(turnAt(i)); if (c > mx) { mx = c; mi = i; } }
console.log('tightest', (mx * 57.3).toFixed(2), 'deg/m at s', S[mi].s.toFixed(0), 'radius', (1 / mx).toFixed(1));
console.log('start', SKY.start, 'boosts', SKY.boosts.map(x => x.toFixed(0)).join(','), 'cps', SKY.cps.map(x => x.toFixed(0)).join(','));
// curvature profile every 10 m, and the straightest 45 m windows
let prof = []; for (let s = 0; s < n; s += 10) prof.push(s + ':' + (turnAt(s) * 57.3).toFixed(1)); console.log(prof.join(' '));
const win = 45, res = [];
for (let i = 0; i < n; i++) { let m = 0; for (let k = 0; k < win; k++) m = Math.max(m, Math.abs(turnAt((i + k) % n))); res.push([i, m]); }
res.sort((a, b) => a[1] - b[1]); const pick = []; for (const r of res) { if (pick.every(p => Math.min(Math.abs(p[0] - r[0]), n - Math.abs(p[0] - r[0])) > 50)) pick.push(r); if (pick.length > 5) break; }
console.log('straightest 45 m windows (start s, max deg/m):', pick.map(p => p[0] + ':' + (p[1] * 57.3).toFixed(2)).join('  '));
