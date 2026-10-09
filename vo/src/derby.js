// Sky Park: the OWQ ballpark on the roof of the tower, out over the city to the north. A real park: mowed grass with
// an infield diamond, chalk lines and a warning track, a padded outfield wall with the team's words on it, foul poles,
// stands down both lines full of fans (they jump up on a home run), dugouts, a batter's eye, a jumbotron, bleachers
// and six light towers. Home Run Derby: press START by the backstop, take ten pitches from the machine, click / SPACE
// to swing. One batter at a time; everyone else lines up in the queue and watches the ball fly out over the city.
// Shared through presence 'hr' ({st:'q'|'b'|'d', t, p, n, l, e}).
import * as THREE from 'three';
import {cv, tex} from './tex.js';
import {clamp, damp, lerp} from './util.js';
import {ROOFY, ELEVP, GROUNDY} from './world.js';
import {FLOORBOX, FLOORRECT, inAreas} from './walk.js';
import {GFX, mat, patch, sweep, mbox, scatter, plain, glowPoints, lightPools, crowd, textCanvas, canvasTex, NEON, mergeGeometries} from './gfx.js';
import {RD} from './ragdoll.js';

export const PLATE = {x: 2, z: -24};
const MOUND = {x: 2, z: -38.6};
const FOUL = Math.PI / 4, FENCEH = 2.8, BASE = 18;
export const fenceR = a => 41 + 5 * Math.cos(clamp(a / FOUL, -1, 1) * Math.PI / 2);   // 46 m to centre, 41 m down the lines
const FENCE = 46;
const BTN = {x: -3, z: -15};
const PITCHES = 10, FT = 7.2, TURNMAX = 150;
// the deck (world x,z): over the tower roof to the south, out over the city to the north, clear of the Sky Deck plaza
export const DECK = [[-10.4, 10], [16, 10], [16, -12], [46, -42], [46, -90], [-40, -90], [-40, -42], [-10.4, -14]];
export const PARK = {x0: -40, x1: 46, z0: -90, z1: 10};
const S2 = Math.SQRT1_2;
const LINE = (s, a, o = 0) => [PLATE.x + s * S2 * a + s * S2 * o, PLATE.z - S2 * a + S2 * o];   // along the 1st (s=1) / 3rd (s=-1) base line, o metres outward
const ARC = (a, r) => [PLATE.x + r * Math.sin(a), PLATE.z - r * Math.cos(a)];
function inPoly(P, x, z) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
export const onDeck = (x, z) => inPoly(DECK, x, z);
// where people can walk on the roof: the plaza behind the backstop, the field and foul ground up to the stands
const WALK = (() => { const P = [[-10.2, 9.8], [15.8, 9.8], [15.8, -12.3], LINE(1, 10, 4.6), LINE(1, 41, 4.6)]; for (let d = 45; d >= -45; d -= 5) P.push(ARC(d * Math.PI / 180, fenceR(d * Math.PI / 180) - .45)); P.push(LINE(-1, 41, 4.6), LINE(-1, 10, 4.6), [-10.2, -14.2]); return P; })();
const CSS = `.vo3hr{position:absolute;inset:0;pointer-events:none;z-index:5;display:none}.vo3hr.on{display:block}
.vo3hrt{position:absolute;top:62px;left:50%;transform:translateX(-50%);padding:8px 16px;border-radius:999px;background:rgba(12,6,12,.78);border:1px solid rgba(255,209,102,.4);font:800 11px Verdana,sans-serif;letter-spacing:.12em;color:#ffd166;white-space:nowrap}
.vo3hrb{position:absolute;top:150px;left:50%;transform:translateX(-50%);font:900 46px Verdana,sans-serif;letter-spacing:.08em;color:#fff;text-shadow:0 0 26px #ff1f4f,0 3px 12px #000;opacity:0;transition:opacity .25s,transform .25s;white-space:nowrap}.vo3hrb.on{opacity:1;transform:translateX(-50%) scale(1.06)}
.vo3hrb small{display:block;text-align:center;font-size:16px;letter-spacing:.2em;color:#ffd166}
.vo3hrs{position:absolute;bottom:92px;right:22px;pointer-events:auto;width:124px;height:124px;border-radius:50%;border:3px solid #ffd166;background:radial-gradient(circle at 40% 35%,rgba(255,209,102,.35),rgba(12,6,12,.85));color:#fff;font:900 18px Verdana,sans-serif;letter-spacing:.12em;cursor:pointer;touch-action:none;box-shadow:0 0 30px rgba(255,209,102,.35)}
.vo3hrs.on{background:#ffd166;color:#120a10}
.vo3hrx{position:absolute;top:58px;right:14px;pointer-events:auto;padding:9px 14px;border-radius:12px;border:0;background:#ff1f4f;color:#fff;font:800 11px Verdana,sans-serif;letter-spacing:.1em;cursor:pointer}`;

const BM = o => new THREE.MeshBasicMaterial(o);
const at = (o, p, r) => { if (p) o.position.copy(p); if (r) o.rotation.copy(r); return o; };
// samples along a straight line from a to b (world x,z) for gfx.sweep; the profile's +lat side is to the left of a->b
function lineS(a, b, step = 1) { const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), n = Math.max(2, Math.round(L / step) + 1), t = {x: dx / L, z: dz / L}, out = []; for (let i = 0; i < n; i++) { const f = i / (n - 1); out.push({p: new THREE.Vector3(a[0] + dx * f, ROOFY, a[1] + dz * f), t, nx: -t.z, nz: t.x, s: f * L, bank: 0}); } return out; }
function arcS(a0, a1, r0, step = 1) { const out = []; const n = Math.max(3, Math.round(Math.abs(a1 - a0) * 50 / step)); let s = 0, prev = null; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, r = r0 === 'fence' ? fenceR(a) : r0, P = ARC(a, r), p = new THREE.Vector3(P[0], ROOFY, P[1]); if (prev) s += p.distanceTo(prev); prev = p; const sg = Math.sign(a1 - a0), tx = -Math.cos(a) * -sg, tz = -Math.sin(a) * -sg; out.push({p, t: {x: tx, z: tz}, nx: -tz, nz: tx, s, bank: 0}); } return out; }

export class Derby {
  constructor(O, parent) {
    this.O = O; this.on = false; this.me = null; this.turn = null; this.balls = []; this.seen = {}; this.queueT = 0; this.cheer = 0; this.fw = [];
    const G = this.group = new THREE.Group(); G.name = 'skypark'; parent.add(G);
    this.build(G);
    FLOORRECT.r = {areas: [{poly: WALK}, {r: [7.3, -8.9, 8.7, -6.9]}]};
    RD.roof = (x, z) => inAreas(FLOORRECT.r.areas, x, z) || onDeck(x, z);
    if (!document.getElementById('vo3hrcss')) { const s = document.createElement('style'); s.id = 'vo3hrcss'; s.textContent = CSS; document.head.appendChild(s); }
    const u = this.ui = document.createElement('div'); u.className = 'vo3hr';
    u.innerHTML = `<div class=vo3hrt></div><div class=vo3hrb></div><button class=vo3hrs>SWING</button><button class=vo3hrx>QUIT TURN</button>`;
    O.el.appendChild(u);
    this.tE = u.querySelector('.vo3hrt'); this.bE = u.querySelector('.vo3hrb');
    const sw = u.querySelector('.vo3hrs'); sw.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); sw.classList.add('on'); this.swing(); }); sw.addEventListener('pointerup', () => sw.classList.remove('on'));
    u.querySelector('.vo3hrx').onclick = e => { e.stopPropagation(); this.finish(true); };
    addEventListener('keydown', e => {
      if (e.__vo3 || !this.turn) return; const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.__vo3 = 1;
      if (e.key === ' ' || e.key === 'Enter') { this.swing(); e.preventDefault(); e.stopPropagation(); }
      else if (e.key === 'Escape' || e.key === 'q' || e.key === 'Q') { this.finish(true); e.preventDefault(); e.stopPropagation(); }
      else if (/^(w|a|s|d|W|A|S|D|Arrow\w+|e|E)$/.test(e.key)) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    O.cv.addEventListener('pointerdown', e => { if (this.turn && this.turn.ph !== 'end') { this.swing(); } });
  }
  // ---------- the ballpark
  build(G) {
    const Y = ROOFY, add = (geo, m, o = {}) => { const me = new THREE.Mesh(geo, m); me.castShadow = !!o.cast; me.receiveShadow = o.recv !== false; G.add(me); return me; };
    const put = (g, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); G.add(o); return o; };
    // ---- deck slab, with a crimson light line around the edge and the columns that hold it over the city
    const sh = new THREE.Shape(DECK.map(([x, z]) => new THREE.Vector2(x, z)));
    const slab = new THREE.ExtrudeGeometry(sh, {depth: 1.4, bevelEnabled: false}); slab.rotateX(Math.PI / 2); slab.translate(0, Y - .03, 0);
    add(slab, mat('concrete', {key: 'parkslab', color: '#6f737d'}), {cast: true});
    const edge = []; DECK.forEach((p, i) => { const q = DECK[(i + 1) % DECK.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]), b = plain(new THREE.BoxGeometry(L, .12, .12)); b.rotateY(-Math.atan2(q[1] - p[1], q[0] - p[0])); b.translate((p[0] + q[0]) / 2, Y - .5, (p[1] + q[1]) / 2); edge.push(b); });
    add(mergeGeometries(edge), NEON(3.2, .3, .8), {recv: false});
    const cols = [[-34, -84], [40, -84], [-34, -48], [40, -48], [3, -86]].map(([x, z]) => plain(new THREE.CylinderGeometry(2.2, 2.8, Y - 1.4 - GROUNDY, 18).translate(x, (Y - 1.4 + GROUNDY) / 2, z)));
    add(mergeGeometries(cols), mat('concrete', {key: 'parkcol', color: '#7c818c'}), {cast: false});
    // ---- the field: one big surface whose shader paints the grass stripes, infield dirt, base paths, mound, warning track and chalk
    const clayM = mat('clay', {key: 'parkclay'}), U = {uClay: {value: clayM.map}};
    GFX.ticks.push(() => { U.uClay.value = clayM.map; });
    const fieldM = patch(mat('grass', {key: 'parkgrass', bump: .8}), {key: 'parkfield', uniforms: U, fragHead: 'uniform sampler2D uClay;', frag: `{
      vec2 q=vWP.xz-vec2(${PLATE.x.toFixed(1)},${PLATE.z.toFixed(1)});float u=-q.y,v=q.x,r=length(q),an=atan(v,max(u,1e-4));
      float fair=step(abs(an),.7854)*step(0.,u);float fr=41.+5.*cos(clamp(an/.7854,-1.,1.)*1.5708);float inF=fair*step(r,fr);
      float st=mod(floor((u+v)/5.)+floor((u-v)/5.),2.);vec3 g=diffuseColor.rgb*mix(.78,(st>.5?1.18:.9),inF);
      float dia=abs(v)+abs(u-12.73),mr=length(vec2(v,u-14.6));
      float dirt=step(mr,17.5)*step(-.6,u)*(1.-step(dia,10.3));dirt=max(dirt,step(r,4.4));dirt=max(dirt,step(abs(dia-12.73),.9)*step(u,26.)*step(-.5,u));
      dirt=max(dirt,step(mr,2.9));dirt=max(dirt,step(fr-3.2,r)*step(r,fr+.2)*fair);
      vec3 cl=texture2D(uClay,vWP.xz*.3).rgb*1.2;vec3 col=mix(g,cl,dirt);
      float fl=step(abs(abs(v)-u),.11)*step(0.,u)*step(r,fr);vec2 e=abs(vec2(abs(v)-1.05,u))-vec2(.6,.9);float bx=step(abs(max(e.x,e.y)),.04);
      vec2 e2=abs(vec2(v,u+1.9))-vec2(.55,.95);float cb=step(abs(max(e2.x,e2.y)),.04)*step(u,-.95);
      col=mix(col,vec3(.92,.92,.9),clamp(fl+bx+cb,0.,1.));
      float od=min(length(vec2(v-10.,u+3.)),length(vec2(v+10.,u+3.)));col=mix(col,cl*.75,step(od,1.)*(1.-step(od,.85))*.9+step(od,.85)*.4);
      diffuseColor.rgb=col;rk=mix(1.,1.06,dirt);}`});
    const fg = new THREE.PlaneGeometry(88, 72, 1, 1).rotateX(-Math.PI / 2); fg.translate(3, Y + .005, -55.5); const fuv = fg.getAttribute('uv'); for (let i = 0; i < fuv.count; i++) fuv.setXY(i, fuv.getX(i) * 88 / 2.5, fuv.getY(i) * 72 / 2.5);
    add(fg, fieldM);
    // OWQ mowed into centre field
    const logo = put(new THREE.PlaneGeometry(12, 4.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({map: canvasTex(textCanvas('OWQ', 1024, 392, {col: '#ffffff', size: 300})), transparent: true, opacity: .14, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2}), PLATE.x, Y + .02, PLATE.z - 33);
    logo.renderOrder = 1;
    // bases and home plate
    const white = new THREE.MeshStandardMaterial({color: '#f2f1ec', roughness: .55});
    [[1, 12.73, 12.73], [0, 25.46, 0], [-1, 12.73, -12.73]].forEach(([s, u, v]) => put(new THREE.BoxGeometry(.42, .09, .42), white, PLATE.x + v, Y + .045, PLATE.z - u, 0, Math.PI / 4, 0).castShadow = true);
    const pl = new THREE.Shape(); pl.moveTo(-.22, 0); pl.lineTo(.22, 0); pl.lineTo(.22, .22); pl.lineTo(0, .44); pl.lineTo(-.22, .22); pl.closePath();
    put(new THREE.ShapeGeometry(pl).rotateX(-Math.PI / 2), white, PLATE.x, Y + .03, PLATE.z + .22);
    // ---- outfield wall: padded, ad panels with the team's words and the distances, a yellow line on top
    const wallS = arcS(FOUL, -FOUL, 'fence', 1), wlen = wallS[wallS.length - 1].s;
    const wc = cv(4096, 256), wx = wc.getContext('2d'); wx.fillStyle = '#0d1426'; wx.fillRect(0, 0, 4096, 256);
    const words = ['OWQ', 'ONLY WINNERS', '330', 'DISCIPLINE', 'OWNERSHIP', 'OWQ', '346', 'LEADERS BUILD LEADERS', '331', 'MEASURE WHAT MATTERS', 'OWQ', 'PROTECT FAMILIES', '330'];
    words.forEach((w, i) => { const x0 = i * 4096 / words.length, w0 = 4096 / words.length; const num = /^\d+$/.test(w); wx.fillStyle = num ? '#0d1426' : i % 2 ? '#7a0f26' : '#121c34'; wx.fillRect(x0 + 6, 18, w0 - 12, 210); wx.fillStyle = num ? '#ffd166' : '#ffffff'; wx.font = `900 ${num ? 120 : w.length > 12 ? 40 : 64}px Verdana,sans-serif`; wx.textAlign = 'center'; wx.textBaseline = 'middle'; wx.fillText(w, x0 + w0 / 2, 124); });
    const wallT = canvasTex(wc);
    add(sweep(wallS, [[0, 0], [0, 2.55], [.12, 2.76], [.42, 2.8], [.62, 2.6], [.62, 0]], {closed: false, us: wlen, vs: 2.8}), new THREE.MeshStandardMaterial({map: wallT, roughness: .7}), {cast: true});
    add(sweep(wallS, [[.05, 2.81], [.45, 2.825]], {closed: false}), NEON(3.4, 2.4, .4), {recv: false});
    // foul poles with screens
    const yel = NEON(3.6, 2.7, .5);
    [FOUL, -FOUL].forEach(a => { const [x, z] = ARC(a, fenceR(a) + .3); put(new THREE.CylinderGeometry(.14, .16, 18, 10), yel, x, Y + 9, z); const sc = put(new THREE.BoxGeometry(.04, 9, 1.2), yel, x, Y + 11, z); sc.rotation.y = a; });
    // batter's eye and the jumbotron
    const [bex, bez] = ARC(0, 48.5); put(new THREE.BoxGeometry(16, 8, 1.2), new THREE.MeshStandardMaterial({color: '#0b1210', roughness: 1}), bex, Y + 4, bez).castShadow = true;
    this.sbC = cv(1024, 576); this.sbT = tex(this.sbC, {mips: false});
    const jz = PLATE.z - 56;
    put(new THREE.BoxGeometry(22, 13, 1.2), mat('metal', {key: 'parkjumbo', color: '#16181e'}), PLATE.x, Y + 16, jz - .7).castShadow = true;
    put(new THREE.PlaneGeometry(20.6, 11.6), BM({map: this.sbT, toneMapped: false, color: new THREE.Color(1.35, 1.35, 1.35)}), PLATE.x, Y + 16, jz - .08);
    [-8, 8].forEach(o => put(new THREE.BoxGeometry(1, 10, 1), mat('metal', {key: 'parkjumbo', color: '#16181e'}), PLATE.x + o, Y + 5, jz - .7));
    put(new THREE.PlaneGeometry(9, 2.6), BM({map: canvasTex(textCanvas('OWQ SKY PARK', 1024, 300, {col: '#fff0f6', glow: '#ff2d78'})), transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(2.4, 2.4, 2.4)}), PLATE.x, Y + 24.2, jz - .05);
    FLOORBOX.r.push([PLATE.x - 9, jz - 1.4, PLATE.x + 9, jz]);
    // ---- stands down both lines: rows of seats rising away from the field, a crimson fascia, crowd, aisles
    const standM = mat('concrete', {key: 'parkstand', color: '#9a9ea8'}), seats = [], fans = [], fascia = [];
    const rows = 12, prof = [[4.6, 0], [4.6, 1.15]]; for (let r = 0; r < rows; r++) { const l = 4.9 + r * .85, y = 1.15 + r * .45; prof.push([l, y], [l + .85, y]); if (r < rows - 1) prof.push([l + .85, y + .45]); }
    const back = 4.9 + rows * .85; prof.push([back, 1.15 + (rows - 1) * .45 + 1.2], [back + .3, 1.15 + (rows - 1) * .45 + 1.2], [back + .3, 0]);
    [1, -1].forEach(s => {
      const a = s > 0 ? LINE(1, 10) : LINE(-1, 41), b = s > 0 ? LINE(1, 41) : LINE(-1, 10), S = lineS(a, b, .6);
      add(sweep(S, prof, {closed: false, us: 3, vs: 3}), standM, {cast: true});
      fascia.push(sweep(S, [[4.58, .95], [4.58, 1.05]], {closed: false}));
      S.forEach((c, k) => { if (k % 1) return; for (let r = 0; r < rows; r++) { if ((k % 14) === 7) continue; const l = 5.25 + r * .85, y = c.p.y + 1.15 + r * .45; const x = c.p.x + c.nx * l, z = c.p.z + c.nz * l, yaw = Math.atan2(-c.nx, -c.nz); seats.push([x, y, z, yaw]); if (Math.random() < .62) fans.push([x, y + .05, z, yaw]); } });
      FLOORBOX.r.length;  // (stands are outside the walkable area)
    });
    add(mergeGeometries(fascia), NEON(3.2, .3, .8), {recv: false});
    const seatG = mergeGeometries([plain(new THREE.BoxGeometry(.46, .07, .42).translate(0, .32, 0)), plain(new THREE.BoxGeometry(.46, .48, .06).rotateX(-.12).translate(0, .58, -.2)), plain(new THREE.BoxGeometry(.06, .3, .4).translate(-.24, .18, 0))]);
    add(scatter(seatG, seats.map(q => [q[0], q[1], q[2], q[3]])), new THREE.MeshStandardMaterial({color: '#a3122e', roughness: .5, metalness: .1}));
    if (GFX.level !== 'low') { this.crowd = crowd(G, GFX.level === 'high' ? fans : fans.filter((f, i) => i % 2 === 0), {colors: ['#ff1f4f', '#ffffff', '#1b1b22', '#ff1f4f', '#ffd166', '#4cc9f0', '#ff1f4f', '#2a2a33', '#3ddc97']}); }
    // bleachers in left- and right-centre behind the wall
    [[-.72, -.24], [.24, .72]].forEach(([a0, a1]) => {
      const S = arcS(a1, a0, 50, .8), bp = [[0, 0], [0, 1.6]]; for (let r = 0; r < 9; r++) { const l = .3 + r * .9, y = 1.6 + r * .5; bp.push([l, y], [l + .9, y], [l + .9, y + .5]); } bp.push([8.4, 6.1], [8.4, 0]);
      add(sweep(S, bp, {closed: false, us: 3, vs: 3}), standM, {cast: true});
      const bf = []; S.forEach((c, k) => { for (let r = 0; r < 9; r++) if (Math.random() < .5 && k % 2 === 0) bf.push([c.p.x + c.nx * (.75 + r * .9), c.p.y + 1.62 + r * .5, c.p.z + c.nz * (.75 + r * .9), Math.atan2(-c.nx, -c.nz)]); });
      if (GFX.level === 'high') crowd(G, bf);
    });
    // dugouts along each line (open front, roof, bench, rail)
    const dg = [], dark = mat('metal', {key: 'parkdug', color: '#22252d'});
    [1, -1].forEach(s => { const c = LINE(s, 16, 2.6);
      const g = new THREE.Group(); g.position.set(c[0], Y, c[1]); g.rotation.y = s > 0 ? Math.PI / 4 : -Math.PI / 4; G.add(g);
      const box = (w, h, d, x, y, z, m) => { const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); q.position.set(x, y, z); q.castShadow = true; q.receiveShadow = true; g.add(q); };
      box(8, 2.4, .2, 0, 1.2, s > 0 ? 1.3 : 1.3, dark); box(8.4, .18, 2.9, 0, 2.5, 0, dark); box(.2, 2.4, 2.8, -4, 1.2, 0, dark); box(.2, 2.4, 2.8, 4, 1.2, 0, dark); box(7.4, .45, .5, 0, .23, .9, mat('wood', {key: 'parkbench', color: '#b07a4a'}));
      box(8, .06, .06, 0, 1.05, -1.35, NEON(3.2, .3, .8));
      FLOORBOX.r.push([c[0] - 2.2, c[1] - 2.2, c[0] + 2.2, c[1] + 2.2]);
    });
    // ---- light towers (LED banks aimed at the field) and the light they throw
    const ledC = cv(256, 160), lx = ledC.getContext('2d'); lx.fillStyle = '#15161b'; lx.fillRect(0, 0, 256, 160); for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const g = lx.createRadialGradient(22 + i * 42, 20 + j * 40, 0, 22 + i * 42, 20 + j * 40, 17); g.addColorStop(0, '#ffffff'); g.addColorStop(.6, '#fff4dc'); g.addColorStop(1, '#15161b'); lx.fillStyle = g; lx.fillRect(i * 42 + 2, j * 40, 40, 40); }
    const ledM = BM({map: canvasTex(ledC), toneMapped: false, color: new THREE.Color(2.6, 2.5, 2.3)}), towM = mat('metal', {key: 'parktower', color: '#2a2d35'}), heads = [];
    [[-36, -86, 34], [42, -86, 34], [-37, -46, 30], [43, -46, 30], [-9, 8, 22], [15, 8, 22]].forEach(([x, z, h]) => {
      put(new THREE.CylinderGeometry(.45, .9, h, 10), towM, x, Y + h / 2, z).castShadow = true;
      const hd = new THREE.Group(); hd.position.set(x, Y + h + 1.6, z); G.add(hd); hd.lookAt(PLATE.x, Y, PLATE.z - 30);
      const fr = new THREE.Mesh(new THREE.BoxGeometry(7, 4.4, .5), towM); hd.add(fr); const pn = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 4), ledM); pn.position.z = .26; hd.add(pn);
      heads.push([x, Y + h + 1.6, z, 3.2, 2.6, 2.5, 2.3]);
      FLOORBOX.r.push([x - 1, z - 1, x + 1, z + 1]);
    });
    glowPoints(G, heads);
    const pools = []; for (let u = 6; u < 46; u += 12) for (let v = -24; v <= 24; v += 12) { const x = PLATE.x + v, z = PLATE.z - u; if (Math.hypot(v, u) < 44) pools.push([x, Y + .02, z, 11, .07, .07, .06]); } lightPools(G, pools);
    // ---- the plaza behind home plate: polished floor, the backstop, the elevator, the START kiosk, the suite
    const plaza = mbox(26.4, .2, 29.5, 4); plaza.translate(2.8, Y - .09, -4.75); add(plaza, mat('polished', {key: 'parkplaza', color: '#b9b6bf', bump: .5, env: 1.1}));
    const netC = cv(256, 256), nx = netC.getContext('2d'); nx.strokeStyle = 'rgba(230,235,245,.9)'; nx.lineWidth = 3; for (let i = 0; i <= 256; i += 32) { nx.beginPath(); nx.moveTo(i, 0); nx.lineTo(i, 256); nx.stroke(); nx.beginPath(); nx.moveTo(0, i); nx.lineTo(256, i); nx.stroke(); }
    const netT = canvasTex(netC, {rep: [24, 6]}), net = new THREE.MeshBasicMaterial({map: netT, transparent: true, opacity: .45, side: THREE.DoubleSide, depthWrite: false, color: '#c9d0dc'});
    put(new THREE.CylinderGeometry(7.5, 7.5, 8, 40, 1, true, -1.15, 2.3), net, PLATE.x, Y + 4, PLATE.z + 1.6);
    put(new THREE.CylinderGeometry(7.55, 7.55, 1.2, 40, 1, true, -1.15, 2.3), new THREE.MeshStandardMaterial({color: '#141a2c', roughness: .7, side: THREE.DoubleSide}), PLATE.x, Y + .6, PLATE.z + 1.6);
    put(new THREE.TorusGeometry(7.5, .06, 6, 40, 2.3), NEON(3.2, .3, .8), PLATE.x, Y + 8, PLATE.z + 1.6, Math.PI / 2, 0, Math.PI / 2 - 1.15 - 2.3 + Math.PI);
    // suite on columns over the plaza, lit windows
    const suite = new THREE.Group(); suite.position.set(2, Y + 5.2, -1); G.add(suite);
    const glassS = new THREE.MeshPhysicalMaterial({color: '#ffd9a8', emissive: new THREE.Color('#ffb36b'), emissiveIntensity: .9, roughness: .1, metalness: .2, transparent: true, opacity: .85});
    const sbox = (w, h, d, x, y, z, m) => { const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); q.position.set(x, y, z); q.castShadow = true; suite.add(q); };
    sbox(20, .5, 7, 0, 0, 0, towM); sbox(20, .5, 7, 0, 3.4, 0, towM); sbox(20, 2.9, .1, 0, 1.7, -3.45, glassS); sbox(.2, 2.9, 7, -10, 1.7, 0, towM); sbox(.2, 2.9, 7, 10, 1.7, 0, towM); sbox(20, 2.9, .2, 0, 1.7, 3.4, towM);
    put(new THREE.PlaneGeometry(8, 1.2), BM({map: canvasTex(textCanvas('OWQ SUITE', 1024, 160, {col: '#fff0f6', glow: '#ff2d78'})), transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(2, 2, 2)}), 2, Y + 9.4, -4.46, 0, Math.PI, 0);
    [[-7.5, -4], [11.5, -4], [-7.5, 2], [11.5, 2]].forEach(([x, z]) => { put(new THREE.BoxGeometry(.6, 5.2, .6), towM, x, Y + 2.6, z).castShadow = true; FLOORBOX.r.push([x - .4, z - .4, x + .4, z + .4]); });
    // planters and benches on the plaza
    const plg = [], bng = []; [[-8, 6], [14, 6], [-8, -10], [14, -10]].forEach(([x, z]) => { plg.push(plain(mbox(2.2, .7, 1.4, 1.2)).translate(x, Y + .35, z)); FLOORBOX.r.push([x - 1.2, z - .8, x + 1.2, z + .8]); });
    add(mergeGeometries(plg), mat('concrete', {key: 'parkplanter', color: '#45474f'}), {cast: true});
    [[-8, 6], [14, 6], [-8, -10], [14, -10]].forEach(([x, z]) => { const t = put(new THREE.IcosahedronGeometry(.85, 1), new THREE.MeshStandardMaterial({color: '#1f4d28', roughness: .85}), x, Y + 1.7, z); t.castShadow = true; });
    // elevator hut (same shaft as every floor), doors face the plaza
    const hut = new THREE.MeshPhysicalMaterial({color: '#1a1920', metalness: .6, roughness: .3, clearcoat: .5});
    put(new THREE.BoxGeometry(3.2, 3.4, 2.6), hut, ELEVP.x, Y + 1.7, ELEVP.z - 1.32).castShadow = true;
    const brass = new THREE.MeshStandardMaterial({color: '#a88a3e', metalness: 1, roughness: .3});
    this.dL = put(new THREE.BoxGeometry(.66, 2.5, .04), brass, ELEVP.x - .33, Y + 1.25, ELEVP.z + .01); this.dR = put(new THREE.BoxGeometry(.66, 2.5, .04), brass, ELEVP.x + .33, Y + 1.25, ELEVP.z + .01);
    put(new THREE.PlaneGeometry(2.4, .5), BM({map: canvasTex(textCanvas('SKY PARK', 768, 160, {col: '#fff0f6', glow: '#ff2d78'})), transparent: true, depthWrite: false, color: new THREE.Color(2, 2, 2), toneMapped: false}), ELEVP.x, Y + 3.0, ELEVP.z + .02);
    FLOORBOX.r.push([ELEVP.x - 1.6, ELEVP.z - 2.62, ELEVP.x + 1.6, ELEVP.z - .02]);
    this.door = {o: 0, hold: 0};
    // the pitching machine on the mound
    const pm = this.machine = new THREE.Group(); pm.position.set(MOUND.x, Y, MOUND.z); G.add(pm);
    const mm = new THREE.MeshStandardMaterial({color: '#202027', metalness: .7, roughness: .35}), mr = new THREE.MeshStandardMaterial({color: '#ff1f4f', metalness: .3, roughness: .4});
    pm.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.08, .5, 1.1, 10), mm), new THREE.Vector3(0, .55, 0), null));
    const head = new THREE.Group(); head.position.set(0, 1.25, 0); pm.add(head);
    [-.32, .32].forEach(x => head.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .14, 20), mr), new THREE.Vector3(x, 0, 0), new THREE.Euler(0, 0, Math.PI / 2))));
    head.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .7, 10), mm), new THREE.Vector3(0, .05, .2), new THREE.Euler(Math.PI / 2, 0, 0)));
    this.mLight = at(new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), BM({color: new THREE.Color(.4, 3, .9), toneMapped: false})), new THREE.Vector3(0, .42, -.1), null); head.add(this.mLight);
    pm.traverse(o => { if (o.isMesh) o.castShadow = true; });
    FLOORBOX.r.push([MOUND.x - .6, MOUND.z - .6, MOUND.x + .6, MOUND.z + .6]);
    // the START button on a pedestal by the backstop
    const bp = this.btn = new THREE.Group(); bp.position.set(BTN.x, Y, BTN.z); G.add(bp);
    bp.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.32, .42, 1.05, 18), mm), new THREE.Vector3(0, .52, 0), null));
    this.btnTop = at(new THREE.Mesh(new THREE.CylinderGeometry(.24, .26, .16, 22), BM({color: new THREE.Color(3.6, .3, .5), toneMapped: false})), new THREE.Vector3(0, 1.12, 0), null); bp.add(this.btnTop);
    put(new THREE.PlaneGeometry(2.6, .7), BM({map: canvasTex(textCanvas('HOME RUN DERBY', 1024, 276, {col: '#fff', glow: '#ff1f4f'})), transparent: true, depthWrite: false, color: new THREE.Color(2, 2, 2), toneMapped: false, side: THREE.DoubleSide}), BTN.x, Y + 2.05, BTN.z);
    FLOORBOX.r.push([BTN.x - .45, BTN.z - .45, BTN.x + .45, BTN.z + .45]);
    // balls
    this.balls = [];
    this.ballGeo = new THREE.SphereGeometry(.12, 12, 10); this.ballM = new THREE.MeshStandardMaterial({color: '#f4f2ea', roughness: .5});
    this.trailM = BM({color: new THREE.Color(3, 2.4, 1), transparent: true, opacity: .6, depthWrite: false, toneMapped: false});
    this.board();
  }
  // ---------- jumbotron
  board(st, flash) {
    const x = this.sbC.getContext('2d'), W = 1024, H = 576;
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b0710'); g.addColorStop(1, '#040306'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = '#ff1f4f'; x.fillRect(0, 0, W, 10); x.fillRect(0, H - 10, W, 10);
    if (flash) { x.fillStyle = '#ff1f4f'; x.globalAlpha = .25; x.fillRect(0, 0, W, H); x.globalAlpha = 1; x.font = '900 150px Verdana,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.shadowColor = '#ff1f4f'; x.shadowBlur = 40; x.fillText('HOME RUN!', W / 2, H / 2 - 30); x.shadowBlur = 0; x.font = '800 54px Verdana,sans-serif'; x.fillStyle = '#ffd166'; x.fillText(flash, W / 2, H / 2 + 90); this.sbT.needsUpdate = true; return; }
    x.font = '900 56px Verdana,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.fillText('HOME RUN DERBY', W / 2, 62);
    const b = st && st.batter;
    if (b) {
      x.font = '800 30px Verdana,sans-serif'; x.fillStyle = '#ffd166'; x.fillText('AT BAT: ' + String(b.nm).toUpperCase().slice(0, 22), W / 2, 122);
      x.font = '900 120px Verdana,sans-serif'; x.fillStyle = '#fff'; x.fillText(String(b.n || 0), W * .3, 238); x.fillText(String(Math.max(0, PITCHES - (b.p || 0))), W * .7, 238);
      x.font = '800 24px Verdana,sans-serif'; x.fillStyle = '#ffb3c2'; x.fillText('HOME RUNS', W * .3, 318); x.fillText('PITCHES LEFT', W * .7, 318);
      x.fillStyle = '#8ef0c2'; x.fillText(b.l ? 'LONGEST ' + b.l + ' FT' : '', W / 2, 366);
    } else { x.font = '800 30px Verdana,sans-serif'; x.fillStyle = '#ffd166'; x.fillText('PRESS START BY THE BACKSTOP', W / 2, 150); }
    const q = (st && st.queue) || [];
    x.textAlign = 'left'; x.font = '800 24px Verdana,sans-serif'; x.fillStyle = '#b9a3ad'; x.fillText('ON DECK', 60, 420);
    x.fillStyle = '#fff'; x.fillText(q.length ? q.slice(0, 3).map((p, i) => (i + 1) + '. ' + String(p.nm).split(' ')[0].toUpperCase()).join('    ') : 'Nobody waiting', 60, 460);
    const top = (st && st.top) || [];
    x.fillStyle = '#b9a3ad'; x.fillText('TEAM BEST', 60, 512); x.fillStyle = '#ffd166';
    x.fillText(top.length ? top.slice(0, 3).map(r => String(r[0]).split(' ')[0].toUpperCase() + ' ' + r[1]).join('    ') : 'No home runs yet', 60, 548);
    this.sbT.needsUpdate = true;
  }
  // fireworks over centre field and the crowd on its feet
  celebrate(ft) {
    const O = this.O; this.cheer = 4; this.flashT = 3; this.board(null, ft + ' FT'); O.sfx('crowd');
    if (!O.pfx) return;
    for (let k = 0; k < 5; k++) setTimeout(() => {
      const [x, z] = ARC((Math.random() - .5) * 1.2, 40 + Math.random() * 20), y = ROOFY + 34 + Math.random() * 20, col = [[3.4, .4, .9], [3.4, 2.6, .7], [3, 3, 3], [.5, 2.4, 3.2]][k % 4];
      for (let i = 0; i < 70; i++) { const a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1), sp = 9 + Math.random() * 5; O.pfx.emit('spark', x, y, z, Math.sin(b) * Math.cos(a) * sp, Math.cos(b) * sp, Math.sin(b) * Math.sin(a) * sp, {col, life: 1.2 + Math.random() * .6, g: 4, drag: 1.2, s0: .12, s1: .05}); }
      O.pfx.emit('glow', x, y, z, 0, 0, 0, {col, life: .35, s0: 9, s1: 3}); O.sfx('boom', .4);
    }, k * 380);
  }
  // ---------- who's batting, who's waiting (from everyone's presence)
  state() {
    const O = this.O, L = [];
    const now = this.now();
    O.av.forEach(a => { const h = a.me ? this.mine() : a.p && a.p.hr; if (h && typeof h === 'object' && h.st === 'b' && !a.me && +h.bt > 0 && now - h.bt > TURNMAX * 1000) return;
      if (h && typeof h === 'object' && (h.st === 'q' || h.st === 'b')) L.push({a, nm: a.nm, id: a.id, me: !!a.me, st: h.st, t: +h.t || 0, n: +h.n || 0, p: +h.p || 0, l: +h.l || 0, e: h.e}); });
    const bat = L.filter(x => x.st === 'b').sort((x, y) => x.t - y.t)[0] || null;
    const queue = L.filter(x => x.st === 'q').sort((x, y) => x.t - y.t || (x.id < y.id ? -1 : 1));
    let top = []; try { const T = O.api.tops ? O.api.tops() : {}; top = (T && T.derby) || []; } catch (e) {}
    return {batter: bat, queue, top};
  }
  mine() { return this.my || null; }
  setMine(h) { this.my = h; try { this.O.api.state && this.O.api.state('hr', h); } catch (e) {} }
  // ---------- walking hooks
  walkPrompt(a) {
    const w = a.wk; if (!w || w.f !== 'r') return null;
    if (Math.hypot(w.x - BTN.x, w.z - BTN.z) < 1.5) {
      const m = this.my; if (this.turn) return null;
      if (m && m.st === 'q') return {k: 'derbyq', t: 'LEAVE THE DERBY QUEUE'};
      const st = this.state(); return {k: 'derby', t: st.batter || st.queue.length ? 'JOIN THE DERBY QUEUE (' + (st.queue.length + 1) + ')' : 'START THE HOME RUN DERBY'};
    }
    return null;
  }
  walkUse(p, a) {
    if (p.k === 'derby') { const st = this.state(); this.setMine({st: 'q', t: this.now()}); this.O.sfx('click'); if (!st.batter && !st.queue.length) this.O.ui.toast('Step up to the plate!'); else this.O.ui.toast("You're in the queue. You'll bat when it's your turn."); this.btnT = this.O.t; return true; }
    if (p.k === 'derbyq') { this.setMine(null); this.O.ui.toast('You left the derby queue.'); return true; }
    return null;
  }
  now() { try { return this.O.api.now ? this.O.api.now() : Date.now(); } catch (e) { return Date.now(); } }
  elevOpen(f) { if (f === 'r') this.door.hold = 2; }
  // ---------- my turn
  begin() {
    const O = this.O, a = O.meAv; if (!a || !a.wk || a.wk.f !== 'r') { this.setMine(null); return; }
    const w = a.wk; w.x = PLATE.x + .85; w.z = PLATE.z + .1; w.h = Math.PI; w.vx = w.vz = 0;
    O.walk.lock = 1; a.bat = 1;
    this.turn = {p: 0, n: 0, l: 0, ph: 'wait', t: 0, next: 2.2, ball: null, sw: -1, ev: 0};
    this.setMine({st: 'b', t: this.my ? this.my.t : this.now(), p: 0, n: 0, l: 0, bt: this.now()});
    this.ui.classList.add('on'); this.big("YOU'RE UP!", 'CLICK OR SPACE TO SWING'); O.sfx('airhorn'); this.snap = 1;
    this.bat(a, true);
  }
  finish(quit) {
    const O = this.O, T = this.turn; if (!T) return; this.turn = null;
    const a = O.meAv; if (a) { a.bat = 0; this.bat(a, false); }
    O.walk.lock = 0; this.ui.classList.remove('on');
    if (!quit || T.p > 0) { try { O.api.score && O.api.score('derby', T.n); if (T.l) O.api.score('longball', T.l); } catch (e) {} }
    this.setMine({st: 'd', t: this.now(), p: T.p, n: T.n, l: T.l});
    setTimeout(() => { if (this.my && this.my.st === 'd') this.setMine(null); }, 6000);
    O.ui.toast(T.n ? 'Derby over: ' + T.n + ' home run' + (T.n > 1 ? 's' : '') + (T.l ? ', longest ' + T.l + ' ft' : '') + '!' : 'Derby over. Next time!');
    if (a && a.wk) { a.wk.x = PLATE.x + 2.5; a.wk.z = PLATE.z + 1.5; }
  }
  // give the batter a bat (local visual for anyone at the plate)
  bat(a, on) {
    if (on) {
      if (a._bat) return; const g = new THREE.Group();
      const m = new THREE.Mesh(new THREE.CylinderGeometry(.035, .018, .86, 10), new THREE.MeshStandardMaterial({color: '#c08a4a', roughness: .5}));
      m.position.y = .43; g.add(m); g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.024, .024, .12, 8), new THREE.MeshStandardMaterial({color: '#141418'})), new THREE.Vector3(0, .03, 0), null));
      a._bat = g; a.rig.add(g);
      a.poseFx = (Z, dt, t) => this.pose(a, Z, dt, t);
    } else if (a._bat) { a.rig.remove(a._bat); a._bat = null; if (a.poseFx) a.poseFx = null; }
  }
  pose(a, Z, dt, t) {
    // stance with the bat up, or the swing (s goes 0..1)
    const sw = a._sw, s = sw != null ? clamp((t - sw) / .32, 0, 1) : 0, k = s > 0 && s < 1 ? s : 0, fol = s >= 1 && sw != null && t - sw < 1.1 ? 1 : 0;
    const tw = k ? lerp(.7, -1.1, Math.pow(k, .8)) : fol ? -1.15 : .7;
    Z.ty = tw * .55; Z.hy = -tw * .35; Z.lsx = -1.25 + (k ? .3 * Math.sin(k * Math.PI) : 0); Z.rsx = -1.35; Z.lsz = .55; Z.rsz = -.25; Z.lex = -1.2; Z.rex = -1.5; Z.ltx = -.2; Z.rtx = .15; Z.lkx = .35; Z.rkx = .3; Z.hip = .52;
    const g = a._bat; if (g) {
      // the bat sits on the right shoulder and sweeps through the zone
      const ang = k ? lerp(.9, -2.6, Math.pow(k, .8)) : fol ? -2.7 : .9;
      g.position.set(.18 * Math.cos(ang), 1.32 - (k ? .25 * Math.sin(k * Math.PI) : 0), .1 + .25 * Math.sin(ang));
      g.rotation.set(-1.1 + (k ? 1.1 * Math.sin(k * Math.PI) : 0), ang, .6);
    }
    if (sw != null && t - sw > 1.4) a._sw = null;
  }
  swing() {
    const T = this.turn, O = this.O; if (!T || T.sw >= 0 && O.t - T.sw < .45) return;
    T.sw = O.t; O.meAv._sw = O.t; O.sfx('whoosh', .6);
    if (T.ball && !T.ball.hit && !T.ball.done) this.contact(T, T.ball);
  }
  // timing decides it: ideal contact is when the ball reaches the plate, 0.14 s into the swing
  contact(T, b) {
    const O = this.O, arrive = b.t0 + b.tt, sweet = T.sw + .14, err = sweet - arrive;
    b.err = err; b.swung = 1;
    const ae = Math.abs(err);
    if (ae > .12) { b.miss = 1; return; }
    const q = ae < .028 ? 1 : ae < .06 ? .82 : ae < .09 ? .62 : .45;
    const r = Math.random;
    const ev = (36 + 22 * q) * (.94 + r() * .1);
    const la = (q > .95 ? 24 + r() * 10 : q > .8 ? 14 + r() * 26 : 4 + r() * 50) * Math.PI / 180;
    const spray = clamp(err * 6.5 + (r() - .5) * .14, -.95, .95);   // early = pull (left), late = the other way
    const vh = ev * Math.cos(la), vx = -Math.sin(spray) * vh, vz = -Math.cos(spray) * vh, vy = ev * Math.sin(la);
    b.hit = {t: O.t, v: [vx, vy, vz], q};
    b.p.set(PLATE.x, ROOFY + 1, PLATE.z - .3); b.vel.set(vx, vy, vz);
    O.sfx(q > .95 ? 'smash' : 'clink'); O.shk = Math.max(O.shk || 0, q * .3);
    T.ev++; this.my = Object.assign({}, this.my, {e: {i: T.p, v: [+vx.toFixed(2), +vy.toFixed(2), +vz.toFixed(2)], n: T.ev}}); try { O.api.state && O.api.state('hr', this.my); } catch (e) {}
  }
  pitch(T) {
    const O = this.O, sp = 23 + Math.random() * 6, b = this.ball(PLATE.x * 0 + MOUND.x, ROOFY + 1.35, MOUND.z + .3);
    const tz = PLATE.z - .1, dist = tz - b.p.z; b.tt = dist / sp; b.t0 = O.t; b.vel.set((Math.random() - .5) * .3, (ROOFY + .85 - b.p.y) / b.tt + 4.9 * b.tt, sp);
    T.ball = b; O.sfx('pop'); this.mLight.material.color.setRGB(3.5, .5, .5); setTimeout(() => this.mLight.material.color.setRGB(.4, 3, .9), 300);
  }
  ball(x, y, z) {
    const m = new THREE.Mesh(this.ballGeo, this.ballM); m.position.set(x, y, z); this.group.add(m); m.castShadow = true;
    const b = {m, p: m.position, vel: new THREE.Vector3(), t0: this.O.t, tt: .6, hit: null, done: 0, trail: []}; this.balls.push(b); return b;
  }
  // flight with drag; returns the call when the ball comes down or leaves the park
  fly(b, dt) {
    const v = b.vel, sp = v.length(), k = .0042;
    v.x -= v.x * sp * k * dt; v.z -= v.z * sp * k * dt; v.y -= (9.8 + v.y * sp * k) * dt;
    b.p.addScaledVector(v, dt);
    const dx = b.p.x - PLATE.x, dz = b.p.z - PLATE.z, r = Math.hypot(dx, dz), ang = Math.atan2(-dx, -dz);
    if (!b.call) {
      const fr = fenceR(ang);
      if (Math.abs(ang) > FOUL + .02 && r > 4) b.call = 'FOUL';
      else if (r >= fr && b.p.y > ROOFY + FENCEH) b.call = 'HR';
      else if (r >= fr - .3 && b.p.y <= ROOFY + FENCEH) { b.call = 'WALL'; v.x *= -.35; v.z *= -.35; }
      else if (b.p.y <= ROOFY + .12 && r < fr) b.call = 'INPLAY';
    }
    if (b.p.y <= ROOFY + .12 && onDeck(b.p.x, b.p.z)) { b.p.y = ROOFY + .12; v.y = Math.abs(v.y) * .35; v.x *= .6; v.z *= .6; if (Math.abs(v.y) < .5) b.rest = (b.rest || 0) + dt; }
    return Math.hypot(dx, dz);
  }
  // ---------- per frame
  tick(dt, t) {
    const O = this.O, st = this.state();
    // my queue spot turns into my turn when nobody is batting and I'm first
    const m = this.my;
    if (m && m.st === 'q' && !this.turn && !st.batter && st.queue[0] && st.queue[0].me) {
      if (!this.upT) { this.upT = t; this.big("YOU'RE UP NEXT", 'WALK TO THE PLATE'); O.sfx('ding'); }
      if (t - this.upT > 1.2) { this.upT = 0; this.begin(); }
    }
    // leaving the roof drops my spot
    if (m && (m.st === 'q' || m.st === 'b') && !(O.meAv && O.meAv.wk && O.meAv.wk.f === 'r')) { if (this.turn) this.finish(true); else this.setMine(null); }
    const T = this.turn;
    if (T && this.my && +this.my.bt > 0 && this.now() - this.my.bt > TURNMAX * 1000) { this.finish(); return; }
    if (T) {
      T.t += dt;
      if (T.ph === 'wait' && T.t > T.next) { if (T.p >= PITCHES) { this.finish(); } else { T.ph = 'pitch'; this.pitch(T); T.p++; this.syncMine(T); } }
      if (T.ph === 'pitch' && T.ball) {
        const b = T.ball;
        if (!b.hit) {
          if (b.swung && b.miss && !b.called) { b.called = 1; this.big('SWING AND A MISS', ''); }
          if (O.t - b.t0 > b.tt + .5) { if (!b.swung) this.big('TAKE', 'CLICK OR SPACE TO SWING'); b.done = 1; T.ph = 'wait'; T.t = 0; T.next = 1.6; T.ball = null; }
        } else if (b.call && !b.called) {
          b.called = 1;
          const ft = Math.round(Math.hypot(b.p.x - PLATE.x, b.p.z - PLATE.z) * FT);
          if (b.call === 'HR') { const proj = Math.round(this.carry(b) * FT); T.n++; T.l = Math.max(T.l, proj); this.big('HOME RUN!', proj + ' FT'); O.sfx('chaching'); O.fx.sparkle(b.p.x, b.p.y, b.p.z, 40, [1, .85, .3]); }
          else if (b.call === 'FOUL') this.big('FOUL BALL', '');
          else if (b.call === 'WALL') this.big('OFF THE WALL!', ft + ' FT');
          else this.big('IN PLAY', ft + ' FT');
          this.syncMine(T); T.t = 0; T.next = b.call === 'HR' ? 3 : 2.2;
        }
        if (b.hit && T.t > T.next && b.called) { T.ph = 'wait'; T.t = 0; T.next = 1.2; T.ball = null; }
      }
      this.tE.textContent = 'PITCH ' + Math.min(T.p, PITCHES) + ' / ' + PITCHES + '  ·  HOME RUNS ' + T.n + (T.l ? '  ·  LONGEST ' + T.l + ' FT' : '');
    }
    // other batters' hits: replay them from their presence
    if (st.batter && !st.batter.me) {
      const B = st.batter, e = B.e; this.watch(B.a, true);
      if (e && typeof e === 'object' && e.n && this.seen[B.id] !== e.n) { const first = this.seen[B.id] === undefined; this.seen[B.id] = e.n; if (!first && Array.isArray(e.v)) { const b = this.ball(PLATE.x, ROOFY + 1, PLATE.z - .3); b.vel.set(+e.v[0] || 0, +e.v[1] || 0, +e.v[2] || 0); b.hit = {t: O.t}; b.remote = 1; B.a._sw = O.t - .14; O.sfx('clink', .7); } }
    }
    O.av.forEach(a => { if (!a.me && a._bat && !(st.batter && st.batter.a === a)) this.watch(a, false); });
    // balls in flight
    this.balls = this.balls.filter(b => {
      if (b.hit) { this.fly(b, dt); if (b.call === 'HR' && !b.cel) { b.cel = 1; this.celebrate(Math.round(this.carry(b) * FT)); } if (O.t - b.hit.t > 7 || b.p.y < ROOFY - 120 || b.rest > 1.5) { this.group.remove(b.m); return false; } return true; }
      if (b.done) { this.group.remove(b.m); return false; }
      // pitched ball: straight flight with gravity, then past the plate into the net
      b.vel.y -= 9.8 * dt; b.p.addScaledVector(b.vel, dt); if (b.p.z > PLATE.z + 4) { b.done = 1; }
      return true;
    });
    // elevator hut doors
    const d = this.door; d.hold = Math.max(0, d.hold - dt); d.o = damp(d.o, d.hold > 0 ? 1 : 0, d.hold > 0 ? 4 : 3, dt);
    this.dL.position.x = ELEVP.x - .33 - .62 * d.o; this.dR.position.x = ELEVP.x + .33 + .62 * d.o;
    if (O.meAv && O.meAv.wk && O.meAv.wk.f === 'r' && Math.abs(O.meAv.wk.x - ELEVP.x) < 1.3 && O.meAv.wk.z < ELEVP.z + 1.4) d.hold = Math.max(d.hold, .6);
    this.btnTop.position.y = 1.12 - (this.btnT && O.t - this.btnT < .25 ? .06 : 0);
    if (this.flashT > 0) this.flashT -= dt; else if ((this._sbT = (this._sbT || 0) - dt) <= 0) { this._sbT = .5; this.board(st); }
    this.cheer = Math.max(0, this.cheer - dt); if (this.crowd) this.crowd.userData.U.uCheer.value = damp(this.crowd.userData.U.uCheer.value, this.cheer > 0 ? 1 : .08, 3, dt);
  }
  // how far a home run would have carried (to deck height)
  carry(b) { const p = b.p.clone(), v = b.vel.clone(); for (let i = 0; i < 600 && p.y > ROOFY; i++) { const sp = v.length(), k = .0042, dt = 1 / 60; v.x -= v.x * sp * k * dt; v.z -= v.z * sp * k * dt; v.y -= (9.8 + v.y * sp * k) * dt; p.addScaledVector(v, dt); } return Math.hypot(p.x - PLATE.x, p.z - PLATE.z); }
  syncMine(T) { this.setMine(Object.assign({}, this.my, {st: 'b', p: T.p, n: T.n, l: T.l})); }
  watch(a, on) { this.bat(a, on); }
  big(t, s) { const e = this.bE; e.innerHTML = t + (s ? '<small>' + s + '</small>' : ''); e.classList.add('on'); clearTimeout(this._bt); this._bt = setTimeout(() => e.classList.remove('on'), 1500); }
  // ---------- camera while batting: behind the plate, then chase the ball
  cam(P, T, F0) {
    const Tn = this.turn; if (!Tn) return 0;
    const b = Tn.ball && Tn.ball.hit ? Tn.ball : null;
    if (b) { T.copy(b.p); T.y = Math.max(T.y, ROOFY + 1); P.set(PLATE.x + 2.5, ROOFY + 3 + Math.min(10, (b.p.y - ROOFY) * .35), PLATE.z + 6); return clamp(F0 * .9, 34, 60); }
    P.set(PLATE.x + 1.6, ROOFY + 2.25, PLATE.z + 4.4); T.set(MOUND.x + .3, ROOFY + 1.2, MOUND.z + 2); return clamp(F0 * .85, 32, 52);
  }
  remote(a, q) { }
  grab() { return !!this.turn; }
  zone(z) { if (z === this._z) return; this._z = z; this.group.visible = z === 'r' || z === 'd'; }
  leave() { if (this.turn) this.finish(true); this.setMine(null); }
}
