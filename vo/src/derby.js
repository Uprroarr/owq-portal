// Sky Park: a floating ballpark on the roof of the OWQ tower. Home Run Derby: press START by home plate, take ten
// pitches from the machine, click / SPACE to swing. One batter at a time; everyone else lines up in the queue and
// watches the ball fly out over the city. Shared through presence 'hr' ({st:'q'|'b'|'d', t, p, n, l, e}).
import * as THREE from 'three';
import {cv, tex} from './tex.js';
import {clamp, damp, lerp} from './util.js';
import {ROOFY, ELEVP} from './world.js';
import {FLOORBOX, FLOORRECT} from './walk.js';

export const PARK = {x0: -42, x1: 32, z0: -34, z1: 21};
const PLATE = {x: -12, z: 15.2};
const MOUND = {x: -12, z: 0.6};
const FENCE = 44, FOUL = 38 * Math.PI / 180, FENCEH = 2.6;
const BTN = {x: -15.6, z: 17.4};
const PITCHES = 10, FT = 7.2;
const CSS = `.vo3hr{position:absolute;inset:0;pointer-events:none;z-index:5;display:none}.vo3hr.on{display:block}
.vo3hrt{position:absolute;top:62px;left:50%;transform:translateX(-50%);padding:8px 16px;border-radius:999px;background:rgba(12,6,12,.78);border:1px solid rgba(255,209,102,.4);font:800 11px Verdana,sans-serif;letter-spacing:.12em;color:#ffd166;white-space:nowrap}
.vo3hrb{position:absolute;top:150px;left:50%;transform:translateX(-50%);font:900 46px Verdana,sans-serif;letter-spacing:.08em;color:#fff;text-shadow:0 0 26px #ff1f4f,0 3px 12px #000;opacity:0;transition:opacity .25s,transform .25s;white-space:nowrap}.vo3hrb.on{opacity:1;transform:translateX(-50%) scale(1.06)}
.vo3hrb small{display:block;text-align:center;font-size:16px;letter-spacing:.2em;color:#ffd166}
.vo3hrs{position:absolute;bottom:92px;right:22px;pointer-events:auto;width:124px;height:124px;border-radius:50%;border:3px solid #ffd166;background:radial-gradient(circle at 40% 35%,rgba(255,209,102,.35),rgba(12,6,12,.85));color:#fff;font:900 18px Verdana,sans-serif;letter-spacing:.12em;cursor:pointer;touch-action:none;box-shadow:0 0 30px rgba(255,209,102,.35)}
.vo3hrs.on{background:#ffd166;color:#120a10}
.vo3hrx{position:absolute;top:58px;right:14px;pointer-events:auto;padding:9px 14px;border-radius:12px;border:0;background:#ff1f4f;color:#fff;font:800 11px Verdana,sans-serif;letter-spacing:.1em;cursor:pointer}`;

function sign(txt, w, h, col, glow, bg) {
  const c = cv(1024, Math.round(1024 * h / w)), x = c.getContext('2d'); if (bg) { x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); }
  x.font = `900 ${Math.round(c.height * .6)}px Verdana,sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = glow; x.shadowBlur = c.height * .2; x.fillStyle = col; x.fillText(txt, c.width / 2, c.height / 2); x.shadowBlur = 0; x.fillText(txt, c.width / 2, c.height / 2); return c;
}
const BM = o => new THREE.MeshBasicMaterial(o);
const at = (o, p, r) => { if (p) o.position.copy(p); if (r) o.rotation.copy(r); return o; };

export class Derby {
  constructor(O, parent) {
    this.O = O; this.on = false; this.me = null; this.turn = null; this.balls = []; this.seen = {}; this.queueT = 0;
    const G = this.group = new THREE.Group(); G.name = 'skypark'; parent.add(G);
    this.build(G);
    FLOORRECT.r = {x0: PARK.x0 + .5, x1: PARK.x1 - .5, z0: PARK.z0 + .5, z1: PARK.z1 - .5};
    if (!document.getElementById('vo3hrcss')) { const s = document.createElement('style'); s.id = 'vo3hrcss'; s.textContent = CSS; document.head.appendChild(s); }
    const u = this.ui = document.createElement('div'); u.className = 'vo3hr';
    u.innerHTML = `<div class=vo3hrt></div><div class=vo3hrb></div><button class=vo3hrs>SWING</button><button class=vo3hrx>QUIT TURN</button>`;
    O.el.appendChild(u);
    this.tE = u.querySelector('.vo3hrt'); this.bE = u.querySelector('.vo3hrb');
    const sw = u.querySelector('.vo3hrs'); sw.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); sw.classList.add('on'); this.swing(); }); sw.addEventListener('pointerup', () => sw.classList.remove('on'));
    u.querySelector('.vo3hrx').onclick = e => { e.stopPropagation(); this.finish(true); };
    addEventListener('keydown', e => {
      if (!this.turn) return; const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === ' ' || e.key === 'Enter') { this.swing(); e.preventDefault(); e.stopPropagation(); }
      else if (e.key === 'Escape' || e.key === 'q' || e.key === 'Q') { this.finish(true); e.preventDefault(); e.stopPropagation(); }
      else if (/^(w|a|s|d|W|A|S|D|Arrow\w+|e|E)$/.test(e.key)) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    O.cv.addEventListener('pointerdown', e => { if (this.turn && this.turn.ph !== 'end') { this.swing(); } });
  }
  // ---------- the park
  build(G) {
    const Y = ROOFY, add = (g, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); G.add(o); return o; };
    const W = PARK.x1 - PARK.x0, D = PARK.z1 - PARK.z0, cx = (PARK.x0 + PARK.x1) / 2, cz = (PARK.z0 + PARK.z1) / 2;
    // deck slab with lit edges and underside light strips
    const deckC = cv(512, 512), dx = deckC.getContext('2d'); dx.fillStyle = '#16151b'; dx.fillRect(0, 0, 512, 512); dx.strokeStyle = 'rgba(255,255,255,.05)'; dx.lineWidth = 2;
    for (let i = 0; i < 512; i += 64) { dx.beginPath(); dx.moveTo(i, 0); dx.lineTo(i, 512); dx.stroke(); dx.beginPath(); dx.moveTo(0, i); dx.lineTo(512, i); dx.stroke(); }
    const dT = tex(deckC, {mips: true}); dT.wrapS = dT.wrapT = THREE.RepeatWrapping; dT.repeat.set(W / 8, D / 8);
    const slab = add(new THREE.BoxGeometry(W, .6, D), [new THREE.MeshStandardMaterial({color: '#121116', roughness: .6, metalness: .5}), new THREE.MeshStandardMaterial({color: '#121116', roughness: .6, metalness: .5}), new THREE.MeshStandardMaterial({map: dT, roughness: .75, metalness: .1}), new THREE.MeshBasicMaterial({color: '#0a090d'}), new THREE.MeshStandardMaterial({color: '#121116'}), new THREE.MeshStandardMaterial({color: '#121116'})], cx, Y - .3, cz);
    slab.receiveShadow = true;
    const neon = BM({color: new THREE.Color(3.2, .35, .85), toneMapped: false}), gold = BM({color: new THREE.Color(3.5, 2.6, .7), toneMapped: false});
    [[cx, PARK.z0, W, 0], [cx, PARK.z1, W, 0], [PARK.x0, cz, D, 1], [PARK.x1, cz, D, 1]].forEach(([x, z, l, r]) => add(new THREE.BoxGeometry(r ? .14 : l, .1, r ? l : .14), neon, x, Y + .02, z));
    for (let x = PARK.x0 + 4; x < PARK.x1; x += 8) add(new THREE.BoxGeometry(.5, .05, D - 2), BM({color: new THREE.Color(1.4, .25, .5), toneMapped: false}), x, Y - .62, cz);
    // railing around the edge (glass with a glowing top)
    const glass = new THREE.MeshBasicMaterial({color: '#7fb6ff', transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide});
    [[cx, PARK.z1, W, 0], [PARK.x0, cz, D, Math.PI / 2], [PARK.x1, cz, D, Math.PI / 2]].forEach(([x, z, l, ry]) => { add(new THREE.PlaneGeometry(l, 1.1), glass, x, Y + .55, z, 0, ry, 0); add(new THREE.BoxGeometry(ry ? .08 : l, .06, ry ? l : .08), neon, x, Y + 1.1, z); });
    // turf: dark grass with mowing stripes inside the fence, clay infield, white lines
    const tc = cv(1024, 1024), tx = tc.getContext('2d');
    tx.fillStyle = '#123a1f'; tx.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 16; i++) { tx.fillStyle = i % 2 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.08)'; tx.fillRect(i * 64, 0, 64, 1024); }
    const turfT = tex(tc, {mips: true});
    const fan = new THREE.CircleGeometry(FENCE, 48, Math.PI / 2 - FOUL, FOUL * 2); fan.rotateX(-Math.PI / 2);
    add(fan, new THREE.MeshStandardMaterial({map: turfT, roughness: .95}), PLATE.x, Y + .01, PLATE.z).rotation.set(0, 0, 0);
    const clay = new THREE.MeshStandardMaterial({color: '#5a3324', roughness: 1});
    const inf = new THREE.CircleGeometry(15, 36, Math.PI / 2 - FOUL, FOUL * 2); inf.rotateX(-Math.PI / 2); add(inf, clay, PLATE.x, Y + .015, PLATE.z);
    add(new THREE.CircleGeometry(2.4, 24).rotateX(-Math.PI / 2), clay, MOUND.x, Y + .02, MOUND.z);
    add(new THREE.CircleGeometry(3, 24).rotateX(-Math.PI / 2), clay, PLATE.x, Y + .02, PLATE.z);
    const white = BM({color: new THREE.Color(1.6, 1.6, 1.6)});
    [-FOUL, FOUL].forEach(a => { const L = FENCE; const g = new THREE.BoxGeometry(.12, .02, L); const m = add(g, white, PLATE.x - Math.sin(a) * L / 2, Y + .03, PLATE.z - Math.cos(a) * L / 2, 0, a, 0); });
    const plate = new THREE.Shape(); plate.moveTo(-.22, 0); plate.lineTo(.22, 0); plate.lineTo(.22, .22); plate.lineTo(0, .44); plate.lineTo(-.22, .22); plate.closePath();
    add(new THREE.ShapeGeometry(plate).rotateX(-Math.PI / 2), white, PLATE.x, Y + .035, PLATE.z + .22);
    // batter's boxes
    [-1, 1].forEach(sd => { const m = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.2, 1.8).rotateX(-Math.PI / 2)), new THREE.LineBasicMaterial({color: '#e8e8ea'})); m.position.set(PLATE.x + sd * .9, Y + .04, PLATE.z); G.add(m); });
    // the outfield wall: padded crimson with distance markers, a lit top rail
    const wallC = cv(2048, 128), wx = wallC.getContext('2d'); wx.fillStyle = '#5a0b1f'; wx.fillRect(0, 0, 2048, 128); wx.fillStyle = '#ff1f4f'; wx.fillRect(0, 0, 2048, 8);
    wx.font = '900 64px Verdana,sans-serif'; wx.textAlign = 'center'; wx.textBaseline = 'middle'; wx.fillStyle = '#fff';
    [[.08, Math.round(FENCE * FT) + "'"], [.3, 'OWQ'], [.5, Math.round(FENCE * 1.04 * FT) + "'"], [.7, 'OWQ'], [.92, Math.round(FENCE * FT) + "'"]].forEach(([f, t]) => wx.fillText(t, 2048 * f, 70));
    const wallG = new THREE.CylinderGeometry(FENCE, FENCE, FENCEH, 64, 1, true, Math.PI - FOUL, FOUL * 2);
    const wallT = tex(wallC, {mips: true}); wallT.wrapS = THREE.RepeatWrapping; wallT.repeat.x = -1; wallT.offset.x = 1;   // read from inside the park
    const wall = add(wallG, new THREE.MeshStandardMaterial({map: wallT, side: THREE.DoubleSide, roughness: .8}), PLATE.x, Y + FENCEH / 2, PLATE.z);
    add(new THREE.TorusGeometry(FENCE, .06, 6, 80, FOUL * 2), gold, PLATE.x, Y + FENCEH, PLATE.z, -Math.PI / 2, 0, Math.PI / 2 - FOUL);
    // foul poles
    [-FOUL, FOUL].forEach(a => add(new THREE.CylinderGeometry(.12, .12, 14, 8), gold, PLATE.x - Math.sin(a) * FENCE, Y + 7, PLATE.z - Math.cos(a) * FENCE));
    // light towers
    [[-38, -24], [26, -24], [-38, 14], [26, 14]].forEach(([x, z]) => {
      add(new THREE.CylinderGeometry(.35, .6, 22, 8), new THREE.MeshStandardMaterial({color: '#1d1c22', metalness: .8, roughness: .4}), x, Y + 11, z);
      const panel = add(new THREE.BoxGeometry(4.5, 2.6, .4), BM({color: new THREE.Color(4.5, 4.3, 3.8), toneMapped: false}), x, Y + 22, z); panel.lookAt(PLATE.x, Y + 2, PLATE.z);
      FLOORBOX.r.push([x - .7, z - .7, x + .7, z + .7]);
    });
    // backstop net behind the plate
    const net = new THREE.MeshBasicMaterial({color: '#cfd6e2', transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false});
    add(new THREE.CylinderGeometry(5.5, 5.5, 5, 24, 1, true, -Math.PI / 2.6, Math.PI / 1.3), net, PLATE.x, Y + 2.5, PLATE.z + .4);
    add(new THREE.TorusGeometry(5.5, .05, 5, 30, Math.PI / 1.3), neon, PLATE.x, Y + 5, PLATE.z + .4, Math.PI / 2, 0, -Math.PI / 2.6 + Math.PI);
    // pitching machine on the mound
    const pm = this.machine = new THREE.Group(); pm.position.set(MOUND.x, Y, MOUND.z); G.add(pm);
    const mm = new THREE.MeshStandardMaterial({color: '#202027', metalness: .7, roughness: .35}), mr = new THREE.MeshStandardMaterial({color: '#ff1f4f', metalness: .3, roughness: .4});
    pm.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.08, .5, 1.1, 10), mm), new THREE.Vector3(0, .55, 0), null));
    const head = new THREE.Group(); head.position.set(0, 1.25, 0); pm.add(head);
    [-.32, .32].forEach(x => head.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .14, 20), mr), new THREE.Vector3(x, 0, 0), new THREE.Euler(0, 0, Math.PI / 2))));
    head.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .7, 10), mm), new THREE.Vector3(0, .05, .2), new THREE.Euler(Math.PI / 2, 0, 0)));
    this.mLight = at(new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), BM({color: new THREE.Color(.4, 3, .9), toneMapped: false})), new THREE.Vector3(0, .42, -.1), null); head.add(this.mLight);
    FLOORBOX.r.push([MOUND.x - .6, MOUND.z - .6, MOUND.x + .6, MOUND.z + .6]);
    // the START button on a pedestal
    const bp = this.btn = new THREE.Group(); bp.position.set(BTN.x, Y, BTN.z); G.add(bp);
    bp.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.32, .42, 1.05, 18), mm), new THREE.Vector3(0, .52, 0), null));
    this.btnTop = at(new THREE.Mesh(new THREE.CylinderGeometry(.24, .26, .16, 22), BM({color: new THREE.Color(3.6, .3, .5), toneMapped: false})), new THREE.Vector3(0, 1.12, 0), null); bp.add(this.btnTop);
    const bs = add(new THREE.PlaneGeometry(2.6, .7), BM({map: tex(sign('HOME RUN DERBY', 8, 2, '#fff', '#ff1f4f'), {mips: true}), transparent: true, depthWrite: false, color: new THREE.Color(2, 2, 2), toneMapped: false, side: THREE.DoubleSide}), BTN.x, Y + 2.05, BTN.z, 0, 0, 0);
    FLOORBOX.r.push([BTN.x - .45, BTN.z - .45, BTN.x + .45, BTN.z + .45]);
    // scoreboard in centre field
    this.sbC = cv(1024, 576); this.sbT = tex(this.sbC, {mips: false});
    const sbz = PLATE.z - FENCE - 4;
    add(new THREE.BoxGeometry(17, 10, .6), mm, PLATE.x, Y + 7.5, sbz - .35);
    add(new THREE.PlaneGeometry(16, 9), BM({map: this.sbT}), PLATE.x, Y + 7.5, sbz);
    [-6, 6].forEach(o => add(new THREE.BoxGeometry(.5, 3, .5), mm, PLATE.x + o, Y + 1.5, sbz - .35));
    FLOORBOX.r.push([PLATE.x - 8.6, sbz - .8, PLATE.x + 8.6, sbz + .2]);
    // elevator hut (same shaft as every floor), doors face the park
    const hut = new THREE.MeshStandardMaterial({color: '#1a1920', metalness: .6, roughness: .35});
    add(new THREE.BoxGeometry(3.2, 3.4, 2.6), hut, ELEVP.x, Y + 1.7, ELEVP.z - 1.32);
    const brass = new THREE.MeshStandardMaterial({color: '#a88a3e', metalness: 1, roughness: .3});
    this.dL = add(new THREE.BoxGeometry(.66, 2.5, .04), brass, ELEVP.x - .33, Y + 1.25, ELEVP.z + .01); this.dR = add(new THREE.BoxGeometry(.66, 2.5, .04), brass, ELEVP.x + .33, Y + 1.25, ELEVP.z + .01);
    add(new THREE.PlaneGeometry(2.4, .5), BM({map: tex(sign('SKY PARK', 6, 1.25, '#fff0f6', '#ff2d78'), {mips: true}), transparent: true, depthWrite: false, color: new THREE.Color(2, 2, 2), toneMapped: false}), ELEVP.x, Y + 3.0, ELEVP.z + .02);
    FLOORBOX.r.push([ELEVP.x - 1.6, ELEVP.z - 2.62, ELEVP.x + 1.6, ELEVP.z - .02]);
    this.door = {o: 0, hold: 0};
    // the tower's own roof under the park (so the gap between deck and office ceiling is closed)
    this.balls = [];
    const ballM = new THREE.MeshStandardMaterial({color: '#f4f2ea', roughness: .5});
    this.ballGeo = new THREE.SphereGeometry(.12, 12, 10); this.ballM = ballM;
    this.trailM = BM({color: new THREE.Color(3, 2.4, 1), transparent: true, opacity: .6, depthWrite: false, toneMapped: false});
    this.board();
  }
  // ---------- scoreboard
  board(st) {
    const x = this.sbC.getContext('2d'), W = 1024, H = 576;
    x.fillStyle = '#07050a'; x.fillRect(0, 0, W, H); x.fillStyle = '#ff1f4f'; x.fillRect(0, 0, W, 10);
    x.font = '900 56px Verdana,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.fillText('HOME RUN DERBY', W / 2, 62);
    const b = st && st.batter;
    if (b) {
      x.font = '800 30px Verdana,sans-serif'; x.fillStyle = '#ffd166'; x.fillText('AT BAT: ' + String(b.nm).toUpperCase().slice(0, 22), W / 2, 122);
      x.font = '900 120px Verdana,sans-serif'; x.fillStyle = '#fff'; x.fillText(String(b.n || 0), W * .3, 238); x.fillText(String(Math.max(0, PITCHES - (b.p || 0))), W * .7, 238);
      x.font = '800 24px Verdana,sans-serif'; x.fillStyle = '#ffb3c2'; x.fillText('HOME RUNS', W * .3, 318); x.fillText('PITCHES LEFT', W * .7, 318);
      x.fillStyle = '#8ef0c2'; x.fillText(b.l ? 'LONGEST ' + b.l + ' FT' : '', W / 2, 366);
    } else { x.font = '800 30px Verdana,sans-serif'; x.fillStyle = '#ffd166'; x.fillText('PRESS START BY HOME PLATE', W / 2, 150); }
    const q = (st && st.queue) || [];
    x.textAlign = 'left'; x.font = '800 24px Verdana,sans-serif'; x.fillStyle = '#b9a3ad'; x.fillText('ON DECK', 60, 420);
    x.fillStyle = '#fff'; x.fillText(q.length ? q.slice(0, 3).map((p, i) => (i + 1) + '. ' + String(p.nm).split(' ')[0].toUpperCase()).join('    ') : 'Nobody waiting', 60, 460);
    const top = (st && st.top) || [];
    x.fillStyle = '#b9a3ad'; x.fillText('TEAM BEST', 60, 512); x.fillStyle = '#ffd166';
    x.fillText(top.length ? top.slice(0, 3).map(r => String(r[0]).split(' ')[0].toUpperCase() + ' ' + r[1]).join('    ') : 'No home runs yet', 60, 548);
    this.sbT.needsUpdate = true;
  }
  // ---------- who's batting, who's waiting (from everyone's presence)
  state() {
    const O = this.O, L = [];
    O.av.forEach(a => { const h = a.me ? this.mine() : a.p && a.p.hr; if (h && typeof h === 'object' && (h.st === 'q' || h.st === 'b')) L.push({a, nm: a.nm, id: a.id, me: !!a.me, st: h.st, t: +h.t || 0, n: +h.n || 0, p: +h.p || 0, l: +h.l || 0, e: h.e}); });
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
    this.setMine({st: 'b', t: this.my ? this.my.t : this.now(), p: 0, n: 0, l: 0});
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
      if (Math.abs(ang) > FOUL + .02 && r > 4) b.call = 'FOUL';
      else if (r >= FENCE && b.p.y > ROOFY + FENCEH) b.call = 'HR';
      else if (r >= FENCE - .3 && b.p.y <= ROOFY + FENCEH) { b.call = 'WALL'; v.x *= -.35; v.z *= -.35; }
      else if (b.p.y <= ROOFY + .12 && r < FENCE) b.call = 'INPLAY';
    }
    if (b.p.y <= ROOFY + .12 && b.p.x > PARK.x0 && b.p.x < PARK.x1 && b.p.z > PARK.z0 && b.p.z < PARK.z1) { b.p.y = ROOFY + .12; v.y = Math.abs(v.y) * .35; v.x *= .6; v.z *= .6; if (Math.abs(v.y) < .5) b.rest = (b.rest || 0) + dt; }
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
          if (b.call === 'HR') { const proj = Math.round(this.carry(b) * FT); T.n++; T.l = Math.max(T.l, proj); this.big('HOME RUN!', proj + ' FT'); O.sfx('crowd'); O.sfx('chaching'); O.fx.sparkle(b.p.x, b.p.y, b.p.z, 40, [1, .85, .3]); }
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
      if (b.hit) { this.fly(b, dt); if (O.t - b.hit.t > 7 || b.p.y < ROOFY - 120 || b.rest > 1.5) { this.group.remove(b.m); return false; } return true; }
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
    if ((this._sbT = (this._sbT || 0) - dt) <= 0) { this._sbT = .5; this.board(st); }
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
