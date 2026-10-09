// OWQ Sky Deck circuit: a 2.5 km elevated race track that leaves the Sales Floor's west door, runs past the deck
// plaza and its grandstand, and weaves out between the skyscrapers: long straights, a hairpin, esses, a lit tunnel,
// two jumps over open air, boost pads, banked corners with kerbs, concrete barriers with a crimson LED line, street
// lamps, gantries and cable-stayed towers. Everything here is in Sales Floor coordinates (office floor y = 0).
import * as THREE from 'three';
import {GFX, mat, patch, sweep, mbox, scatter, glowPoints, lightPools, crowd, textCanvas, canvasTex, NEON, mergeGeometries, plain} from './gfx.js';
import {cv, tex} from './tex.js';

// opening in the west wall of the Sales Floor
export const DOOR = {x: -10.3, z0: 2.5, z1: 4.7, h: 2.6};
const TX0 = -10.45;                 // the tower's west face (TOWER.x0 in world.js; not imported to keep modules acyclic)
const GY = -120;                    // street level
export const HW = 6.5;              // road half width (13 m of asphalt)
export const WALL = 6.95;           // inner face of the barriers
// the deck plaza outside the door: cars and walkers come out here and join the start/finish straight through a gap
export const PLAZA = {x0: -41.5, x1: TX0, z0: -8, z1: 16, o0: -6.5, o1: 14.5};
const STEP = 1;
// control points [x, y, z]: start/finish straight north past the plaza, back straight west, chicane between the towers,
// hairpin, the long west run with the tunnel, esses, the big jump, the fast south sweep and the final corner
const CP = [
  [-48, 0, 60], [-48, 0, -60], [-52, 1, -130], [-82, 3, -186], [-150, 6, -214], [-300, 9, -226], [-410, 12, -250],
  [-468, 14, -310], [-500, 16, -390], [-570, 18, -442], [-650, 18, -432], [-692, 16, -362], [-702, 13, -250],
  [-706, 9, -120], [-696, 6, 10], [-662, 4, 118], [-602, 2, 162], [-560, 0, 240], [-520, -2, 300], [-440, -5, 352],
  [-330, -7, 382], [-220, -5, 388], [-140, -2, 352], [-95, 0, 282], [-62, 0, 202], [-50, 0, 138],
];
export const SKY = {len: 0, n: 0, S: [], gaps: [], boosts: [], start: 0, cps: [], cpS: [], tunnel: [0, 0], pylons: [], piers: [], side: 1};

function smooth01(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
const wrapS = (s, L) => ((s % L) + L) % L;

function layout() {
  if (SKY.n) return SKY;
  const curve = new THREE.CatmullRomCurve3(CP.map(p => new THREE.Vector3(p[0], p[1], p[2])), true, 'centripetal');
  const L = curve.getLength(), n = Math.round(L / STEP);
  SKY.len = L; SKY.n = n;
  const pts = curve.getSpacedPoints(n);
  // where each control point sits along the loop
  SKY.cpS = CP.map(c => { let b = 0, bd = 1e18; for (let i = 0; i < n; i++) { const p = pts[i], d = (p.x - c[0]) ** 2 + (p.z - c[2]) ** 2; if (d < bd) { bd = d; b = i; } } return b * L / n; });
  const C = SKY.cpS;
  SKY.start = wrapS(C[0] + 105, L);                       // start / finish line, past the plaza gap
  SKY.gaps = [{s0: C[18] - 6, s1: C[18] + 12, kick: 1.7, drop: 2.6}, {s0: C[4] + 70, s1: C[4] + 80, kick: 1.1, drop: .6}];
  SKY.boosts = [SKY.gaps[0].s0 - 24, SKY.gaps[1].s0 - 20, C[12] + 6, C[20] - 30, C[1] + 20].map(s => wrapS(s, L));
  SKY.tunnel = [C[13] - 8, C[14] + 8];
  // checkpoints spread over the lap, kept well away from both jumps (a restart point is never on a ramp)
  SKY.cps = [C[6], C[11], C[16], C[21]].map(s => wrapS(s, L));
  const S = SKY.S = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i].clone(), q = pts[(i + 1) % n], t = new THREE.Vector3(q.x - p.x, 0, q.z - p.z).normalize(), s = i * L / n;
    let y = p.y, gap = 0, lip = 0, ramp = 0;
    for (const g of SKY.gaps) {
      const before = g.s0 - s, after = s - g.s1;
      if (before >= 0 && before < 12) { y += g.kick * smooth01(1 - before / 12); ramp = 1; }
      if (s >= g.s0 && s < g.s1) gap = 1;
      if (Math.abs(before) < STEP * .6) lip = 1;
      if (after >= 0 && after < 20) y -= g.drop * (1 - smooth01(after / 20));
    }
    S.push({p: new THREE.Vector3(p.x, y, p.z), t, nx: -t.z, nz: t.x, s, gap, lip, ramp, bank: 0, k: 0, tun: s >= SKY.tunnel[0] && s <= SKY.tunnel[1] ? 1 : 0});
  }
  // curvature (rad per metre) and banking into the corners
  for (let i = 0; i < n; i++) {
    const a = S[(i - 5 + n) % n].t, b = S[(i + 5) % n].t;
    S[i].k = Math.atan2(a.x * b.z - a.z * b.x, a.x * b.x + a.z * b.z) / 10;
    S[i].bank = Math.max(-.15, Math.min(.15, -S[i].k * 9));
  }
  for (let r = 0; r < 4; r++) { const B = S.map(x => x.bank), K = S.map(x => x.k); for (let i = 0; i < n; i++) { S[i].bank = (B[(i - 1 + n) % n] + B[i] * 2 + B[(i + 1) % n]) / 4; S[i].k = (K[(i - 1 + n) % n] + K[i] * 2 + K[(i + 1) % n]) / 4; } }
  // which side of the road faces the plaza (lat sign)
  { const q = nearest(PLAZA.x0 + 2, (PLAZA.o0 + PLAZA.o1) / 2); SKY.side = Math.sign(q.lat) || 1; }
  // concrete piers down to the street every 48 m; cable-stayed towers on three long straights
  const piers = []; for (let s = 6; s < L; s += 48) { const i = Math.round(s / L * n) % n, a = S[i]; if (a.gap || nearGap(s, 10) || inPlaza(a.p.x, a.p.z, 8)) continue; piers.push(i); }
  SKY.piers = piers;
  SKY.pylons = [C[4] + 120, C[12] + 70, C[20] + 20].map(s => { const i = Math.round(wrapS(s, L) / L * n) % n, a = S[i]; return {i, x: a.p.x, z: a.p.z, y0: GY, y1: a.p.y + 64}; });
  return SKY;
}
function nearGap(s, m) { for (const g of SKY.gaps) if (s > g.s0 - m && s < g.s1 + m) return true; return false; }
function inPlaza(x, z, m = 0) { return x >= PLAZA.x0 - m && x <= PLAZA.x1 + m && z >= PLAZA.z0 - m && z <= PLAZA.z1 + m; }
export function skyLayout() { return layout(); }

// nearest sample (hint = last sample index or -1)
function nearest(x, z, hint = -1) {
  const S = SKY.S, n = SKY.n; let best = 0, bd = 1e18;
  const look = i => { const p = S[i].p, d = (x - p.x) * (x - p.x) + (z - p.z) * (z - p.z); if (d < bd) { bd = d; best = i; } };
  if (hint >= 0 && hint < n) { for (let k = -40; k <= 40; k++) look((hint + k + n) % n); if (bd > 900) hint = -1; }
  if (!(hint >= 0 && hint < n)) { bd = 1e18; for (let i = 0; i < n; i += 3) look(i); const b0 = best; for (let k = -3; k <= 3; k++) look((b0 + k + n) % n); }
  const c = S[best], dx = x - c.p.x, dz = z - c.p.z;
  return {i: best, c, along: dx * c.t.x + dz * c.t.z, lat: dx * c.nx + dz * c.nz};
}

/* where am I on the deck? returns {i, s, lat, y, gap, on, plaza, t, nx, nz}: on = on the road or the plaza (else you
   fall); y = surface height there (follows the banking). */
export function skyAt(x, z, hint) {
  const D = layout(), S = D.S, n = D.n, q = nearest(x, z, hint), c = q.c;
  const j = q.along >= 0 ? (q.i + 1) % n : (q.i - 1 + n) % n, f = Math.min(1, Math.abs(q.along) / STEP);
  const y0 = c.p.y + (S[j].p.y - c.p.y) * f, y = y0 + q.lat * Math.sin(c.bank);
  const gap = c.gap && S[j].gap ? 1 : c.gap && f < .5 ? 1 : S[j].gap && f >= .5 ? 1 : 0;
  const onRoad = Math.abs(q.lat) < WALL + .76 ? 1 : 0, pl = inPlaza(x, z) && !onRoad ? 1 : 0;
  return {i: q.i, s: wrapS(c.s + q.along, D.len), lat: q.lat, y: pl ? 0 : y, gap: pl ? 0 : gap, on: onRoad || pl ? 1 : 0, plaza: pl, t: c.t, nx: c.nx, nz: c.nz, bank: c.bank, tun: c.tun};
}

/* walls near a circle of radius r at x,z: returns the deepest {nx, nz, d} (normal pushes back onto the deck) or null.
   Barriers line both road edges except the plaza gap and over the jumps; the plaza has railings and the tower face.
   Next to the plaza a barrier has two sides: plazaSide says which one the body is on (cars pass it from their centre,
   so a fast car can never tunnel through); left out, the circle's own position decides. */
export function skyWall(x, z, r, hint, plazaSide) {
  const D = layout(), q = nearest(x, z, hint), c = q.c; let best = null;
  const take = (nx, nz, d) => { if (d > 0 && (!best || d > best.d)) best = {nx, nz, d}; };
  const pl = inPlaza(x, z, r);
  if (pl && x > PLAZA.x0 + .2) {
    // plaza railings (north and south) and the tower face (except the door)
    if (z - r < PLAZA.z0) take(0, 1, PLAZA.z0 - (z - r));
    if (z + r > PLAZA.z1) take(0, -1, z + r - PLAZA.z1);
    if (x + r > TX0 && !(z > DOOR.z0 + r * .5 && z < DOOR.z1 - r * .5)) take(-1, 0, x + r - TX0);
    if (Math.abs(q.lat) > WALL + 2) return best;
  }
  if (c.gap) return best;
  const al = Math.abs(q.lat), sg = Math.sign(q.lat) || 1;
  if (al + r > WALL && al < WALL + 1.6) {
    const gapHere = sg === D.side && z > PLAZA.o0 && z < PLAZA.o1 && x > PLAZA.x0 - 10;   // the way onto the plaza
    const back = plazaSide === undefined ? pl && al > WALL + .37 : plazaSide && pl;
    if (!gapHere) { if (back) take(c.nx * sg, c.nz * sg, WALL + .74 + r - al); else take(-c.nx * sg, -c.nz * sg, al + r - WALL); }
  }
  return best;
}
// legacy: does a circle hit a wall?
export function skyRail(x, z, r, hint) { return !!skyWall(x, z, r, hint); }

// a point and heading on the loop (respawns, starting grid); h is the walker heading (forward = sin h, cos h)
export function skyPose(s, lat = 0) {
  const D = layout(), i = Math.round(wrapS(s, D.len) / D.len * D.n) % D.n, a = D.S[i];
  return {x: a.p.x + a.nx * lat, y: a.p.y + lat * Math.sin(a.bank), z: a.p.z + a.nz * lat, h: Math.atan2(a.t.x, a.t.z), i};
}

// ---------------------------------------------------------------- visuals
const range = (S, test) => { const out = []; let a = -1; for (let i = 0; i <= S.length; i++) { const ok = i < S.length && test(S[i], i); if (ok && a < 0) a = i; if (!ok && a >= 0) { out.push([a, i]); a = -1; } } return out; };
const sub = (S, a, b) => S.slice(Math.max(0, a - 1), Math.min(S.length, b + 1));

export function buildSky(parent) {
  const D = layout(), S = D.S, n = D.n, L = D.len;
  const G = new THREE.Group(); G.name = 'skydeck'; parent.add(G);
  const add = (geo, m, o = {}) => { const me = new THREE.Mesh(geo, m); me.castShadow = !!o.cast; me.receiveShadow = o.recv !== false; me.matrixAutoUpdate = false; me.updateMatrix(); G.add(me); return me; };
  const notGap = (i, j) => !S[i].gap && !S[j].gap;

  // ---- road: asphalt with painted edge lines, shoulders, rubbered racing line, checkered start, grid boxes, boost chevrons
  const roadM = patch(mat('asphalt', {key: 'track', bump: 1.1, env: .9}), {key: 'trackroad', uniforms: {uHW: {value: HW}, uStart: {value: D.start}, uLen: {value: L}, uT: {value: 0}, uB: {value: D.boosts.concat([-999, -999, -999]).slice(0, 8)}, uG: {value: D.gaps.flatMap(g => [g.s0, g.s1])}},
    fragHead: 'uniform float uHW,uStart,uLen,uT;uniform float uB[8];uniform float uG[4];',
    frag: `{float s=vTrk.x,lat=vTrk.y,al=abs(lat),fw=fwidth(lat)*1.3+.004;
      float sh=smoothstep(uHW-.03,uHW+.03,al);diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.45+vec3(.012),sh*.7);rk=mix(rk,1.12,sh);
      float e1=smoothstep(uHW-.5-fw,uHW-.5+fw,al)*(1.-smoothstep(uHW-.24-fw,uHW-.24+fw,al));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.78,.78,.76),e1*.95);rk=mix(rk,.62,e1);
      float rl=exp(-pow((lat-1.6*sin(s*.011))/2.4,2.));diffuseColor.rgb*=1.-.22*rl;rk=mix(rk,.78,rl*.5);
      float ds=s-uStart;ds=ds-uLen*floor(ds/uLen+.5);
      if(abs(ds)<1.){float ck=mod(floor(ds/.5)+floor((lat+20.)/.5),2.);diffuseColor.rgb=mix(vec3(.025),vec3(.82),ck);rk=.6;}
      if(ds<-3.&&ds>-48.&&al<uHW-.6){float slot=floor((-ds-3.)/9.),inS=mod(-ds-3.,9.);float side=mod(slot,2.)*2.-1.;float bx=abs(lat-side*2.8);
        float box=step(inS,.18)*step(bx,1.6)+step(abs(bx-1.6),.09)*step(inS,2.2);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.8),clamp(box,0.,1.)*.9);}
      for(int k=0;k<8;k++){float db=s-uB[k];db=db-uLen*floor(db/uLen+.5);if(db>0.&&db<6.&&al<2.6){float ch=fract((db*.7+al*.45)-uT*1.8);float m=smoothstep(.45,.55,ch)*(1.-smoothstep(.85,.95,ch));
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.05,.3,.4),.6);ek=1.;eC+=vec3(.25,1.8,2.4)*m*(1.-db/7.);rk=.35;}}
      for(int k=0;k<2;k++){float dj=uG[k*2]-s;dj=dj-uLen*floor(dj/uLen+.5);if(dj>0.&&dj<12.&&al<uHW-.5){float ch=fract(dj*.42+al*.32);float m=step(.55,ch);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.9,.62,.05),m*.85);ek=1.;eC+=vec3(.9,.55,.04)*m*.35;}
        if(abs(dj)<.35)eC+=vec3(3.,2.1,.4),ek=1.;}
    }`});
  const road = add(sweep(S, [[-WALL - .76, 0], [WALL + .76, 0]], {us: 4, vs: 4, keep: notGap}), roadM);
  GFX.trackRoad = roadM;

  // ---- kerbs: red and white, inside of the corners (and outside of the tight ones)
  const kerbM = patch(new THREE.MeshStandardMaterial({roughness: .5, metalness: 0}), {key: 'kerb', frag: `{float st=mod(floor(vTrk.x/1.2),2.);diffuseColor.rgb=mix(vec3(.78,.03,.06),vec3(.86),st);}`});
  const kerbs = [];
  [1, -1].forEach(sd => {
    range(S, (a) => !a.gap && !a.tun && -Math.sign(a.k) * sd > 0 && Math.abs(a.k) > 1 / 120).forEach(([a, b]) => {
      if (b - a < 8) return; const p = sd > 0 ? [[HW - 1.05, 0], [HW - .95, .05], [HW - .12, .075], [HW + .05, 0]] : [[-HW - .05, 0], [-HW + .12, .075], [-HW + .95, .05], [-HW + 1.05, 0]];
      kerbs.push(sweep(sub(S, a, b), p, {closed: false, us: 2, vs: 2}));
    });
    range(S, (a) => !a.gap && !a.tun && Math.sign(a.k) * sd > 0 && Math.abs(a.k) > 1 / 60).forEach(([a, b]) => {
      if (b - a < 8) return; const p = sd > 0 ? [[HW - 1.05, 0], [HW - .95, .05], [HW - .12, .075], [HW + .05, 0]] : [[-HW - .05, 0], [-HW + .12, .075], [-HW + .95, .05], [-HW + 1.05, 0]];
      kerbs.push(sweep(sub(S, a, b), p, {closed: false, us: 2, vs: 2}));
    });
  });
  if (kerbs.length) add(mergeGeometries(kerbs), kerbM);

  // ---- barriers: concrete jersey profile both sides, a crimson LED line along the top, sponsor boards on the corners
  const W = WALL, jersey = [[W, 0], [W + .06, .1], [W + .2, .32], [W + .26, .95], [W + .48, .95], [W + .54, .32], [W + .68, .1], [W + .74, 0]];
  const mirror = (pr) => pr.map(([l, y]) => [-l, y]).reverse();
  const plazaGap = (sd) => (i) => { const a = S[i]; return sd === D.side && a.p.z > PLAZA.o0 && a.p.z < PLAZA.o1 && a.p.x > PLAZA.x0 - 10; };
  const barM = mat('concrete', {key: 'barrier', color: '#d6d4da', bump: 1});
  const barG = [];
  [1, -1].forEach(sd => { const gp = plazaGap(sd); barG.push(sweep(S, sd > 0 ? jersey : mirror(jersey), {us: 3, vs: 3, keep: (i, j) => notGap(i, j) && !gp(i) && !gp(j)})); });
  add(mergeGeometries(barG), barM, {cast: true});
  const led = NEON(3.4, .32, .7);
  const ledG = [];
  [1, -1].forEach(sd => { const gp = plazaGap(sd); ledG.push(sweep(S, sd > 0 ? [[W + .24, .955], [W + .3, .955]] : [[-W - .3, .955], [-W - .24, .955]], {keep: (i, j) => notGap(i, j) && !gp(i) && !gp(j)})); });
  add(mergeGeometries(ledG), led, {recv: false});
  // sponsor boards (team words) on the outside of corners
  {
    const words = ['OWQ', 'ONLY WINNERS & QUITTERS', 'LEADERS BUILD LEADERS', 'DISCIPLINE', 'OWNERSHIP', 'MEASURE WHAT MATTERS', 'DUPLICATION', 'PROTECT FAMILIES'];
    const c = cv(2048, 128), x = c.getContext('2d');
    for (let k = 0; k < 8; k++) { x.fillStyle = k % 2 ? '#0d0b10' : '#ff1f4f'; x.fillRect(k * 256, 0, 256, 128); x.fillStyle = k % 2 ? '#ff4f75' : '#ffffff'; x.font = `900 ${words[k].length > 12 ? 26 : 44}px Verdana,sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(words[k], k * 256 + 128, 66); }
    const t = canvasTex(c, {rep: [1, 1]}); t.wrapS = THREE.RepeatWrapping;
    const boardM = new THREE.MeshStandardMaterial({map: t, roughness: .45, emissiveMap: t, emissive: new THREE.Color(.55, .55, .55)});
    const bg = [];
    [1, -1].forEach(sd => range(S, (a) => !a.gap && Math.sign(a.k) * sd > 0 && Math.abs(a.k) > 1 / 90).forEach(([a, b]) => {
      if (b - a < 12) return;
      bg.push(sweep(sub(S, a, b), sd > 0 ? [[W + .215, .34], [W + .255, .9]] : [[-W - .255, .9], [-W - .215, .34]], {closed: false, us: 64, vs: .56}));
    }));
    if (bg.length) add(mergeGeometries(bg), boardM);
  }

  // ---- the deck structure: box girder with a lit underside, piers down to the street
  const girM = mat('concrete', {key: 'girder', color: '#8d93a3', bump: .8});
  add(sweep(S, [[-W - .76, 0], [-W - .76, -.8], [-HW + .6, -2.5], [HW - .6, -2.5], [W + .76, -.8], [W + .76, 0]], {us: 4, vs: 4, keep: notGap, flip: true}), girM, {cast: true});
  add(sweep(S, [[-.35, -2.52], [.35, -2.52]], {keep: notGap, flip: true}), NEON(1.6, .14, .34), {recv: false});
  {
    const P = [], CAP = [];
    D.piers.forEach(i => { const a = S[i], top = a.p.y - 2.5, h = top - GY; P.push([a.p.x, GY, a.p.z, 0, 1, h, 1]); CAP.push([a.p.x, top - .45, a.p.z, Math.atan2(a.t.x, a.t.z), 1, 1, 1]); });
    const pg = new THREE.CylinderGeometry(1.15, 1.45, 1, 14, 1).translate(0, .5, 0); const pierUV = pg.getAttribute('uv'); for (let k = 0; k < pierUV.count; k++) pierUV.setXY(k, pierUV.getX(k) * 4, pierUV.getY(k) * 30);
    add(scatter(pg, P), mat('concrete', {key: 'pier', color: '#7c8291'}), {cast: false});
    add(scatter(mbox(9.5, .9, 3.2, 3), CAP), girM);
  }

  // ---- street lamps every 40 m (alternating sides), with pools of light on the road
  {
    const posts = [], heads = [], pools = [];
    let sd = 1;
    for (let s = 10; s < L; s += 40) {
      const i = Math.round(s / L * n) % n, a = S[i]; if (a.gap || nearGap(s, 6) || a.tun) continue; sd = -sd;
      if (sd === D.side && a.p.z > PLAZA.z0 - 4 && a.p.z < PLAZA.z1 + 4 && a.p.x > PLAZA.x0 - 12) continue;
      const lp = sd * (W + .62), hx = a.p.x + a.nx * lp, hz = a.p.z + a.nz * lp, yaw = Math.atan2(a.nx * -sd, a.nz * -sd);
      posts.push([hx, a.p.y + lp * Math.sin(a.bank) * 0, hz, yaw]);
      const ll = sd * (W + .62 - 3.75), lx = a.p.x + a.nx * ll, lz = a.p.z + a.nz * ll, ly = a.p.y + 9.3;
      heads.push([lx, ly, lz, 1.1, 2.8, 2.5, 2.1]);
      pools.push([a.p.x + a.nx * sd * (HW - 3.2), a.p.y + .05 + sd * (HW - 3.2) * Math.sin(a.bank), a.p.z + a.nz * sd * (HW - 3.2), 8.5, .2, .18, .15]);
    }
    const post = mergeGeometries([plain(new THREE.CylinderGeometry(.1, .16, 9.6, 8).translate(0, 4.8, 0)), plain(new THREE.BoxGeometry(.12, .12, 3.9).translate(0, 9.45, 1.95)), plain(new THREE.BoxGeometry(.5, .14, 1.1).translate(0, 9.36, 3.75))]);
    add(scatter(post, posts.map(p => [p[0], p[1], p[2], p[3]])), new THREE.MeshStandardMaterial({color: '#2a2b33', roughness: .38, metalness: .85}), {cast: true});
    add(scatter(new THREE.BoxGeometry(.38, .03, .9).translate(0, 9.28, 3.75), posts.map(p => [p[0], p[1], p[2], p[3]])), NEON(3.2, 2.9, 2.5), {recv: false});
    glowPoints(G, heads);
    lightPools(G, pools);
  }

  // ---- gantries: start / finish with the start lights, and banners with the team's words
  const gantM = new THREE.MeshStandardMaterial({color: '#202128', roughness: .35, metalness: .9});
  const banner = (txt, sub) => { const c = cv(1024, 160), x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 1024, 0); g.addColorStop(0, '#12070c'); g.addColorStop(.5, '#2a0812'); g.addColorStop(1, '#12070c'); x.fillStyle = g; x.fillRect(0, 0, 1024, 160);
    x.fillStyle = '#ff1f4f'; x.fillRect(0, 0, 1024, 8); x.fillRect(0, 152, 1024, 8); x.font = '900 70px Verdana,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#ff1f4f'; x.shadowBlur = 24; x.fillStyle = '#fff'; x.fillText(txt, 512, sub ? 66 : 82); x.shadowBlur = 0;
    if (sub) { x.font = '700 26px Verdana,sans-serif'; x.fillStyle = '#ffb3c2'; x.fillText(sub, 512, 126); } return canvasTex(c); };
  const gantry = (s, txt, subT, start) => {
    const i = Math.round(wrapS(s, L) / L * n) % n, a = S[i], yaw = Math.atan2(a.t.x, a.t.z), g = [];
    [1, -1].forEach(sd => g.push(plain(new THREE.BoxGeometry(.55, 9.4, .55).translate(a.p.x + a.nx * sd * (W + 1), a.p.y + 4.7, a.p.z + a.nz * sd * (W + 1)))));
    const beam = plain(new THREE.BoxGeometry(2 * W + 2.6, 1.8, .9)); beam.rotateY(yaw); beam.translate(a.p.x, a.p.y + 9.2, a.p.z); g.push(beam);
    add(mergeGeometries(g), gantM, {cast: true});
    const t = banner(txt, subT), bm = new THREE.MeshBasicMaterial({map: t, toneMapped: false, color: new THREE.Color(1.6, 1.6, 1.6)});
    [1, -1].forEach(f => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * W - 1, 1.5), bm); m.position.set(a.p.x - a.t.x * .47 * f, a.p.y + 9.2, a.p.z - a.t.z * .47 * f); m.rotation.y = yaw + (f > 0 ? Math.PI : 0); G.add(m); });
    if (start) {
      const L5 = []; for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.2; L5.push([a.p.x + a.nx * o - a.t.x * .5, a.p.y + 10.6, a.p.z + a.nz * o - a.t.z * .5, .9, 0, 0, 0]); }
      const lights = glowPoints(G, L5); G.userData.startLights = lights;
      // the start lights run the race sequence on a loop: five reds one by one, lights out with a green flash
      const col = lights.geometry.getAttribute('color');
      GFX.ticks.push(t => { const c = t % 8; for (let k = 0; k < 5; k++) { const red = c < 3.6 && c > k * .7 ? 1 : 0, grn = c >= 3.6 && c < 4.3 ? 1 : 0; col.setXYZ(k, red * 4 + grn * .2, red * .12 + grn * 3.2, red * .15 + grn * 1.1); } col.needsUpdate = true; });
      add(plain(new THREE.BoxGeometry(6.6, .9, .4)).rotateY(yaw).translate(a.p.x - a.t.x * .5, a.p.y + 10.6, a.p.z - a.t.z * .5), gantM);
    }
  };
  gantry(D.start, 'START  ·  FINISH', 'OWQ SKY DECK  ·  2.5 KM', true);
  gantry(D.cpS[5] + 30, 'ONLY WINNERS', 'THERE ARE ONLY TWO TYPES OF PEOPLE');
  gantry(D.cpS[12] - 40, 'LEADERS BUILD LEADERS', 'DUPLICATION, NOT JUST PRODUCTION');
  gantry(D.cpS[19] + 10, 'MEASURE WHAT MATTERS', 'DISCIPLINE  ·  OWNERSHIP');

  // ---- the tunnel on the west run: arched shell with light bands, light pools on the road, portals
  {
    const R0 = W + .9, H0 = 7.4, arc = []; for (let k = 0; k <= 18; k++) { const th = Math.PI - k / 18 * Math.PI; arc.push([Math.cos(th) * R0, Math.sin(th) * H0]); }
    const tr = range(S, a => a.tun);
    const tunM = patch(mat('metal', {key: 'tunnel', color: '#3a3c46', bump: .7, extra: {side: THREE.DoubleSide}}), {key: 'tunnel', frag: `{float s=vTrk.x,l=vTrk.y;float band=step(fract(s/9.),.14)*step(abs(l),3.2);ek=1.;eC=vec3(3.,2.7,2.3)*band;
        float stripe=step(abs(abs(l)-5.2),.06);eC+=vec3(2.6,.2,.5)*stripe;diffuseColor.rgb*=.75;}`});
    tr.forEach(([a, b]) => { add(sweep(sub(S, a, b), arc, {closed: false, us: 2, vs: 2}), tunM, {cast: true}); });
    const pools = []; tr.forEach(([a, b]) => { for (let i = a; i < b; i += 9) { const c = S[i]; pools.push([c.p.x, c.p.y + .05, c.p.z, 7, .28, .25, .21]); } });
    lightPools(G, pools);
    // portals
    tr.forEach(([a, b]) => [a, b - 1].forEach((i, k) => {
      const c = S[i], yaw = Math.atan2(c.t.x, c.t.z), fr = [];
      for (let q = 0; q < 18; q++) { const t0 = Math.PI - q / 18 * Math.PI, t1 = Math.PI - (q + 1) / 18 * Math.PI, m0 = [Math.cos(t0) * (R0 + .5), Math.sin(t0) * (H0 + .5)], m1 = [Math.cos(t1) * (R0 + .5), Math.sin(t1) * (H0 + .5)];
        const len = Math.hypot(m1[0] - m0[0], m1[1] - m0[1]), bx = plain(new THREE.BoxGeometry(len + .1, 1.1, 1.6)); bx.rotateZ(Math.atan2(m1[1] - m0[1], m1[0] - m0[0])); bx.translate((m0[0] + m1[0]) / 2, (m0[1] + m1[1]) / 2, 0); fr.push(bx); }
      const fg = mergeGeometries(fr); fg.rotateY(yaw); fg.translate(c.p.x, c.p.y, c.p.z); add(fg, gantM, {cast: true});
      if (k === 0) { const sm = new THREE.MeshBasicMaterial({map: canvasTex(textCanvas('OWQ TUNNEL', 1024, 160, {col: '#fff0f6', glow: '#ff2d78'})), transparent: true, toneMapped: false, color: new THREE.Color(2, 2, 2), depthWrite: false});
        const m = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.6), sm); m.position.set(c.p.x - c.t.x * .9, c.p.y + H0 + 1.6, c.p.z - c.t.z * .9); m.rotation.y = yaw + Math.PI; G.add(m); }
    }));
  }

  // ---- jumps: glowing lips, JUMP signs on a small gantry before the ramp
  D.gaps.forEach(g => {
    const i0 = Math.round(wrapS(g.s0, L) / L * n) % n, a = S[i0], yaw = Math.atan2(a.t.x, a.t.z);
    add(plain(new THREE.BoxGeometry(2 * HW, .14, .3)).rotateY(yaw).translate(a.p.x, a.p.y + .05, a.p.z), NEON(4, 3, .7), {recv: false});
    const b = S[(i0 - 30 + n) % n], gy = Math.atan2(b.t.x, b.t.z);
    const sm = new THREE.MeshBasicMaterial({map: canvasTex(textCanvas('▲ JUMP ▲', 1024, 200, {col: '#fff7d6', glow: '#ffb100'})), transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(2.2, 2.2, 2.2), side: THREE.DoubleSide});
    const m = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.6), sm); m.position.set(b.p.x, b.p.y + 7.4, b.p.z); m.rotation.y = gy + Math.PI; G.add(m);
    const gg = []; [1, -1].forEach(sd => gg.push(plain(new THREE.BoxGeometry(.3, 8.2, .3).translate(b.p.x + b.nx * sd * (W + .9), b.p.y + 4.1, b.p.z + b.nz * sd * (W + .9)))));
    gg.push(plain(new THREE.BoxGeometry(2 * W + 2.2, .3, .3)).rotateY(gy).translate(b.p.x, b.p.y + 8.3, b.p.z)); add(mergeGeometries(gg), gantM, {cast: true});
  });

  // ---- cable-stayed towers on the long straights, with red aviation lights
  {
    const pg = [], cab = [], red = [];
    D.pylons.forEach(P => {
      const a = S[P.i], yaw = Math.atan2(a.t.x, a.t.z), top = P.y1;
      [1, -1].forEach(sd => { const lx = a.p.x + a.nx * sd * (W + 2.6), lz = a.p.z + a.nz * sd * (W + 2.6), h = top - GY; const leg = plain(new THREE.BoxGeometry(2.2, h, 3)); leg.rotateY(yaw); leg.translate(lx, GY + h / 2, lz); pg.push(leg); red.push([lx, top + 1.2, lz, 2.4, 4, .25, .3]); });
      [a.p.y - 3.5, top - 6, top - 22].forEach(y => { const cb = plain(new THREE.BoxGeometry(2 * W + 7.4, 1.6, 2.2)); cb.rotateY(yaw); cb.translate(a.p.x, y, a.p.z); pg.push(cb); });
      for (let k = 1; k <= 7; k++) [1, -1].forEach(dir => [1, -1].forEach(sd => {
        const j = (P.i + dir * k * 9 + n) % n, b = S[j]; if (b.gap) return;
        const from = new THREE.Vector3(a.p.x + a.nx * sd * (W + 2.6), top - 4 - k * 2.2, a.p.z + a.nz * sd * (W + 2.6)), to = new THREE.Vector3(b.p.x + b.nx * sd * (W + .9), b.p.y + .9, b.p.z + b.nz * sd * (W + .9));
        const d = to.clone().sub(from), len = d.length(), cy = plain(new THREE.CylinderGeometry(.07, .07, len, 5)); cy.translate(0, len / 2, 0);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); cy.applyQuaternion(q); cy.translate(from.x, from.y, from.z); cab.push(cy);
      }));
    });
    if (pg.length) add(mergeGeometries(pg), mat('concrete', {key: 'pylon', color: '#c9ccd6'}), {cast: true});
    if (cab.length) add(mergeGeometries(cab), new THREE.MeshStandardMaterial({color: '#cfd3dc', roughness: .3, metalness: .9}), {recv: false});
    glowPoints(G, red, {blink: .7});
  }

  // ---- grandstand along the start / finish straight (across the road from the plaza), with a crowd and a canopy
  {
    const sd = -D.side, rows = 11, a0 = Math.round(wrapS(D.start - 95, L) / L * n), a1 = Math.round(wrapS(D.start + 10, L) / L * n), seg = S.slice(Math.min(a0, a1), Math.max(a0, a1));
    const prof = [[W + .9, 0]]; for (let r = 0; r < rows; r++) { const l = W + 1.6 + r * .95, y = .5 + r * .5; prof.push([l, y], [l + .95, y]); } prof.push([W + 1.6 + rows * .95 + .2, .5 + (rows - 1) * .5], [W + 1.6 + rows * .95 + .2, -2]);
    const pr = sd > 0 ? prof : prof.map(([l, y]) => [-l, y]).reverse();
    add(sweep(seg, pr, {closed: false, us: 3, vs: 3}), mat('concrete', {key: 'stand', color: '#9da1ab'}), {cast: true});
    const seats = [], fans = [];
    seg.forEach((c, k) => { if (k % 1) return; for (let r = 0; r < rows; r++) { const l = sd * (W + 2.05 + r * .95), y = c.p.y + .5 + r * .5; const x = c.p.x + c.nx * l, z = c.p.z + c.nz * l, yaw = Math.atan2(-c.nx * sd, -c.nz * sd);
      seats.push([x, y, z, yaw]); if (Math.random() < .55) fans.push([x, y + .02, z, yaw]); } });
    const seatG = mergeGeometries([plain(new THREE.BoxGeometry(.48, .08, .44).translate(0, .3, 0)), plain(new THREE.BoxGeometry(.48, .46, .07).translate(0, .52, -.2))]);
    add(scatter(seatG, seats.map(s => [s[0], s[1], s[2], s[3]])), new THREE.MeshStandardMaterial({color: '#b3122f', roughness: .55}), {cast: false});
    if (GFX.level !== 'low') G.userData.crowd = crowd(G, GFX.level === 'high' ? fans : fans.filter((f, i) => i % 2 === 0));
    const can = sweep(seg, sd > 0 ? [[W + 1.2, 9.2], [W + 13.5, 10.6]] : [[-W - 13.5, 10.6], [-W - 1.2, 9.2]], {closed: false, us: 3, vs: 3});
    add(can, mat('metal', {key: 'canopy', color: '#30323c', extra: {side: THREE.DoubleSide}}), {cast: true});
    const cols = []; for (let k = 0; k < seg.length; k += 12) { const c = seg[k], l = sd * (W + 13), x = c.p.x + c.nx * l, z = c.p.z + c.nz * l; cols.push(plain(new THREE.CylinderGeometry(.22, .22, 12.6, 8).translate(x, c.p.y + 4.3, z))); }
    if (cols.length) add(mergeGeometries(cols), gantM, {cast: true});
    const lamps = []; for (let k = 0; k < seg.length; k += 6) { const c = seg[k], l = sd * (W + 3), x = c.p.x + c.nx * l, z = c.p.z + c.nz * l; lamps.push([x, c.p.y + 9.4, z, .6, 2.6, 2.4, 2.2]); }
    glowPoints(G, lamps);
  }

  // ---- the plaza outside the door: polished deck, glass railings, planters, benches, signs and the lap board
  const P0 = PLAZA, pw = P0.x1 - P0.x0, pd = P0.z1 - P0.z0, pcx = (P0.x0 + P0.x1) / 2, pcz = (P0.z0 + P0.z1) / 2;
  {
    const slab = mbox(pw, .5, pd, 6); slab.translate(pcx, -.25, pcz);
    const deckM = patch(mat('polished', {key: 'plaza', color: '#c3c0c8', bump: .6, env: 1.2}), {key: 'plaza', frag: `{vec2 p=vWP.xz;float g=step(fract(p.x/3.),.012)+step(fract(p.y/3.),.012);diffuseColor.rgb*=1.-.35*clamp(g,0.,1.);
        float d=length(p-vec2(${(pcx).toFixed(2)},${(pcz).toFixed(2)}));float ring=step(abs(d-6.),.07)+step(abs(d-6.4),.03);ek=1.;eC=vec3(2.6,.25,.6)*clamp(ring,0.,1.)*.6;}`});
    add(slab, deckM);
    add(plain(new THREE.BoxGeometry(pw, 2.6, pd + .6)).translate(pcx, -1.8, pcz), girM);
    // glass railings north and south
    const glass = new THREE.MeshPhysicalMaterial({color: '#9fc6ff', roughness: .05, metalness: 0, transmission: 0, transparent: true, opacity: .18, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false});
    const rail = new THREE.MeshStandardMaterial({color: '#d8dae0', roughness: .25, metalness: 1});
    const rg = [], posts = [];
    [P0.z0 + .05, P0.z1 - .05].forEach(z => { rg.push(plain(new THREE.CylinderGeometry(.04, .04, pw, 8)).rotateZ(Math.PI / 2).translate(pcx, 1.1, z)); for (let x = P0.x0 + 1; x < P0.x1; x += 2.2) posts.push(plain(new THREE.BoxGeometry(.06, 1.1, .06).translate(x, .55, z))); });
    add(mergeGeometries(rg.concat(posts)), rail, {cast: true});
    [P0.z0 + .05, P0.z1 - .05].forEach(z => { const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, 1), glass); m.position.set(pcx, .55, z); G.add(m); });
    const strip = []; [P0.z0 + .05, P0.z1 - .05].forEach(z => strip.push(plain(new THREE.BoxGeometry(pw, .03, .05).translate(pcx, .04, z))));
    add(mergeGeometries(strip), NEON(3, .3, .7), {recv: false});
    // planters with small trees, benches
    const pl = [], tr = [], be = [];
    [[-16, -5.5], [-24, -5.5], [-32, -5.5], [-16, 13.5], [-24, 13.5], [-32, 13.5]].forEach(([x, z]) => { pl.push(plain(mbox(2.4, .7, 1.4, 1.2)).translate(x, .35, z)); tr.push([x, .7, z]); });
    [[-20, -5.6], [-28, -5.6], [-20, 13.6], [-28, 13.6]].forEach(([x, z]) => be.push(plain(mbox(2.2, .12, .6, 1)).translate(x, .48, z), plain(mbox(.1, .45, .5, 1)).translate(x - .9, .23, z), plain(mbox(.1, .45, .5, 1)).translate(x + .9, .23, z)));
    add(mergeGeometries(pl), mat('concrete', {key: 'planter', color: '#55575f'}), {cast: true});
    add(mergeGeometries(be), mat('wood', {key: 'bench', color: '#c08a5a'}), {cast: true});
    const leaf = new THREE.MeshStandardMaterial({color: '#1d4a26', roughness: .85});
    tr.forEach(([x, y, z]) => { const t = new THREE.Mesh(new THREE.IcosahedronGeometry(.9, 1), leaf); t.position.set(x, y + 1.15, z); t.scale.set(1.2, 1, .9); t.castShadow = true; G.add(t);
      const k = new THREE.Mesh(new THREE.CylinderGeometry(.06, .09, 1, 6), rail); k.position.set(x, y + .4, z); G.add(k); });
    lightPools(G, [[pcx, .02, pcz, 13, .14, .07, .1], [-16, .02, 4, 6, .22, .2, .18], [-30, .02, 4, 6, .22, .2, .18]]);
    // "SKY DECK" over the door on the tower face
    const sm = new THREE.MeshBasicMaterial({map: canvasTex(textCanvas('OWQ SKY DECK', 1024, 180, {col: '#fff0f6', glow: '#ff2d78'})), transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(2.4, 2.4, 2.4)});
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.6), sm); sg.position.set(TX0 - .05, 4.1, (DOOR.z0 + DOOR.z1) / 2); sg.rotation.y = -Math.PI / 2; G.add(sg);
  }
  // lap board: a big LED screen at the plaza's track edge
  const A0 = cv(1024, 640), J0 = tex(A0, {mips: false});
  {
    const x = P0.x0 + 2.2, z = P0.z0 + 1.2;
    add(plain(new THREE.BoxGeometry(.5, 10, .5)).translate(x, 4.5, z), gantM, {cast: true});
    add(plain(new THREE.BoxGeometry(10.4, 6.6, .4)).translate(x, 8.6, z - .3), gantM, {cast: true});
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(9.8, 6.1), new THREE.MeshBasicMaterial({map: J0, toneMapped: false, color: new THREE.Color(1.25, 1.25, 1.25)})); sc.position.set(x, 8.6, z - .08); sc.rotation.y = 0; G.add(sc);
    const sc2 = sc.clone(); sc2.position.z = z - .52; sc2.rotation.y = Math.PI; G.add(sc2);
  }
  const T0 = A0.getContext('2d');
  const board = (rows, subT) => {
    const j = T0; const g = j.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, '#0c0610'); g.addColorStop(1, '#050307'); j.fillStyle = g; j.fillRect(0, 0, 1024, 640);
    j.fillStyle = '#ff1f4f'; j.fillRect(0, 0, 1024, 10); j.fillRect(0, 630, 1024, 10);
    j.font = '900 52px Verdana,sans-serif'; j.textAlign = 'left'; j.textBaseline = 'alphabetic'; j.fillStyle = '#fff'; j.fillText('SKY DECK  ·  FASTEST LAPS', 44, 86);
    j.font = '700 24px Verdana,sans-serif'; j.fillStyle = '#ffb3c2'; j.fillText(subT || '2.5 KM  ·  CROSS THE LINE TO START THE CLOCK', 46, 126);
    (rows.length ? rows : [['No laps yet', '', 0]]).slice(0, 7).forEach((u, k) => {
      const yy = 196 + k * 62; j.fillStyle = k === 0 && u[2] ? 'rgba(255,209,102,.16)' : 'rgba(255,255,255,.05)'; j.fillRect(40, yy - 44, 944, 54);
      j.font = '800 32px Verdana,sans-serif'; j.fillStyle = k === 0 && u[2] ? '#ffd166' : '#fff'; j.fillText((u[2] ? k + 1 + '  ' : '') + String(u[0]).toUpperCase().slice(0, 22), 60, yy - 6);
      j.textAlign = 'right'; j.fillText(u[2] ? fmtLap(u[2]) : '', 964, yy - 6); j.textAlign = 'left';
    });
    J0.needsUpdate = true;
  };
  board([]);
  return {group: G, board, sky: D, road: roadM};
}
export function fmtLap(t) { const m = Math.floor(t / 60), s = t - m * 60; return m ? m + ':' + (s < 10 ? '0' : '') + s.toFixed(2) : s.toFixed(2) + 's'; }
export {HW as SKYHW};

// inside the Sales Floor: a lit archway in the west wall with a sign, so everyone can find the way out
export function buildDoorway(parent) {
  const G = new THREE.Group(); G.name = 'skydoor'; parent.add(G);
  const {x, z0, z1, h} = DOOR, zc = (z0 + z1) / 2, w = z1 - z0;
  const neon = new THREE.MeshBasicMaterial({color: new THREE.Color(3.2, .35, .85), toneMapped: false});
  const put = (g, m, px, py, pz, ry = 0) => { const o = new THREE.Mesh(g, m); o.position.set(px, py, pz); o.rotation.y = ry; G.add(o); return o; };
  const xi = -9.99;
  put(new THREE.BoxGeometry(.06, h, .07), neon, xi, h / 2, z0); put(new THREE.BoxGeometry(.06, h, .07), neon, xi, h / 2, z1); put(new THREE.BoxGeometry(.06, .07, w + .07), neon, xi, h, zc);
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
