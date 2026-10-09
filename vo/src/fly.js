// OWQ Skyport and flying. Walk over the skybridge from the Sky Park to the Skyport: a 900 m elevated runway with real
// markings and lights (edge, centreline, threshold, approach strobes and a PAPI), an apron, the OWQ AIR hangar and a
// control tower. Take off from the west end, fly the city (Ring Run), and land back on runway 27 from the east.
// Flying feels like a plane now: throttle (SHIFT / SPACE), gear (G), stalls when too slow, speed you gain diving and
// lose climbing. Landing is made easy: a LANDING GUIDE shows how far, how high and how well lined up you are, the
// landing assist (T) lines you up, holds the glide path and flares for you, and the touchdown is graded against clear
// limits (sink rate, bank, nose attitude, gear, staying on the runway). R puts you on a practice final approach.
// Shared through presence 'fl' ({x,y,z,yaw,p,r,v,c,g,gr}).
import * as THREE from 'three';
import {cv, tex} from './tex.js';
import {clamp, damp, lerp} from './util.js';
import {EXT} from './cosm.js';
import {ROOFY, GROUNDY, TOWER, RINGS} from './world.js';
import {onDeck} from './derby.js';
import {steer0} from './drive.js';
import {FLOORBOX, FLOORRECT} from './walk.js';
import {GFX, mat, patch, mbox, plain, glowPoints, lightPools, textCanvas, canvasTex, NEON, mergeGeometries} from './gfx.js';

const D2R = Math.PI / 180;
// the Skyport, in world metres (deck top at ROOFY)
export const RWY = {x0: 52, x1: 952, z: -14, hw: 22.5, dw: 30};   // paved half width 22.5 m, deck half width 30 m
const THRE = 928, AIMX = THRE - 300, THRW = 66, GS = 3.5 * D2R;    // landing threshold (runway 27), aiming point, west threshold, glide slope
const APRON = [30, 16, 172, 80], BRIDGE = [15.6, 6, 34, 20];
const HANGAR = {x0: 70, x1: 134, z0: 44, z1: 78, h: 18};
const STAND = {x: 102, z: 31};                                    // where my plane waits, nose to the runway
const CTWR = {x: 158, z: 28};
const SPAN = 9, VSTALL = 21, VR = 30, VAPP = 34, TMAX = 13, CD = .0024;
// what counts as a crash at touchdown (also printed on the landing guide)
export const LIMITS = {sink: 7, bank: 20, pitch: -7, speed: 75};
const onRect = (r, x, z, m = 0) => x >= r[0] - m && x <= r[2] + m && z >= r[1] - m && z <= r[3] + m;
const onRunway = (x, z) => x >= RWY.x0 && x <= RWY.x1 && Math.abs(z - RWY.z) <= RWY.hw;
const onRwyDeck = (x, z) => x >= RWY.x0 && x <= RWY.x1 && Math.abs(z - RWY.z) <= RWY.dw;
const CSS = `.vo3fl{position:absolute;inset:0;pointer-events:none;z-index:5;display:none;font-family:Verdana,sans-serif}.vo3fl.on{display:block}
.vo3flh{position:absolute;top:62px;left:50%;transform:translateX(-50%);padding:7px 14px;border-radius:14px;background:rgba(12,6,12,.72);border:1px solid rgba(255,255,255,.14);font:700 10px Verdana,sans-serif;letter-spacing:.1em;color:#ffd0da;width:max-content;max-width:calc(100% - 340px);white-space:normal;text-align:center;line-height:1.55;}
.vo3flh b{color:#fff}
.vo3fli{position:absolute;top:100px;left:50%;transform:translateX(-50%);display:flex;gap:4px;padding:6px;border-radius:14px;background:rgba(8,5,10,.62);border:1px solid rgba(255,255,255,.1)}
.vo3fli div{min-width:64px;padding:4px 8px;text-align:center;font:900 19px Verdana,sans-serif;color:#fff}.vo3fli small{display:block;font:800 8px Verdana,sans-serif;letter-spacing:.16em;color:#ffb3c2}
.vo3fli .gd{color:#3ddc97}.vo3fli .gu{color:#ffd166}.vo3fli .st{color:#ff3b5c}
.vo3flr{position:absolute;top:164px;left:50%;transform:translateX(-50%);font:800 11px Verdana,sans-serif;letter-spacing:.1em;color:#ffd166;text-shadow:0 2px 10px #000;white-space:nowrap}
.vo3flb{position:absolute;top:30%;left:50%;transform:translate(-50%,-50%);text-align:center;font:900 38px Verdana,sans-serif;letter-spacing:.1em;color:#fff;text-shadow:0 0 22px #ff1f4f,0 2px 10px #000;opacity:0;transition:opacity .2s;white-space:nowrap}.vo3flb.on{opacity:1}
.vo3flb small{display:block;margin-top:6px;font:800 14px Verdana,sans-serif;letter-spacing:.16em;color:#ffd166}
.vo3flx{position:absolute;top:58px;right:14px;pointer-events:auto;padding:9px 14px;border-radius:12px;border:0;background:#ff1f4f;color:#fff;font:800 11px Verdana,sans-serif;letter-spacing:.1em;cursor:pointer}
.vo3flt{position:absolute;top:104px;right:14px;pointer-events:auto;display:flex;align-items:center;gap:8px;padding:7px 12px;border-radius:12px;background:rgba(12,6,12,.72);border:1px solid rgba(255,255,255,.14);font:800 10px Verdana,sans-serif;letter-spacing:.1em;color:#ffd0da}
.vo3flt input{width:110px;accent-color:#ff1f4f}.vo3flt b{min-width:16px;text-align:right;color:#fff}
.vo3flk{position:absolute;top:148px;right:14px;display:flex;flex-direction:column;gap:6px;pointer-events:auto}.vo3flk button{padding:8px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(12,6,12,.72);color:#fff;font:800 10px Verdana,sans-serif;letter-spacing:.1em;cursor:pointer;text-align:left}
.vo3flk button.on{border-color:#3ddc97;color:#bff7de}
.vo3flg{position:absolute;left:16px;top:96px;width:236px;padding:12px 14px;border-radius:16px;background:rgba(8,5,10,.78);border:1px solid rgba(76,201,240,.4);color:#fff;font:800 10px Verdana,sans-serif;letter-spacing:.08em;display:none}.vo3flg.on{display:block}
.vo3flg h4{margin:0 0 8px;font:900 11px Verdana,sans-serif;letter-spacing:.18em;color:#8fdcff}.vo3flg .row{display:flex;justify-content:space-between;margin:3px 0}.vo3flg .row b{color:#fff}
.vo3flg .bar{position:relative;height:10px;margin:6px 0 2px;border-radius:5px;background:rgba(255,255,255,.08)}.vo3flg .bar i{position:absolute;top:-3px;width:10px;height:16px;margin-left:-5px;border-radius:3px;background:#ff3bd4}.vo3flg .bar:after{content:'';position:absolute;left:50%;top:-4px;width:2px;height:18px;background:rgba(255,255,255,.5)}
.vo3flg .ok{color:#3ddc97}.vo3flg .warn{color:#ffd166}.vo3flg .bad{color:#ff3b5c}.vo3flg .lim{margin-top:8px;padding-top:7px;border-top:1px solid rgba(255,255,255,.1);font:700 8.5px Verdana,sans-serif;letter-spacing:.06em;color:#b9a3ad;line-height:1.6}
.vo3flp{position:absolute;bottom:92px;display:grid;grid-template-columns:56px 56px 56px;gap:6px;pointer-events:auto;left:16px}
.vo3flp button,.vo3flq button{height:56px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(12,6,12,.7);color:#fff;font:800 16px Verdana,sans-serif;touch-action:none;cursor:pointer}
.vo3flp button.on,.vo3flq button.on{background:#ff1f4f;border-color:#ff1f4f}.vo3flq{position:absolute;bottom:92px;right:16px;display:flex;flex-direction:column;gap:8px;pointer-events:auto}.vo3flq button{width:86px;font-size:11px;letter-spacing:.08em}
.vo3flf{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .35s;pointer-events:none}.vo3flf.on{opacity:1}
.vo3nar .vo3flg{transform:scale(.8);transform-origin:top left}`;

export class Fly {
  constructor(O, parent) {
    this.O = O; this.me = null; this.keys = {}; this.sendT = 0; this.last = ''; this.rings = []; this.ri = 0; this.rt0 = 0; this.assist = true;
    const G = this.group = new THREE.Group(); G.name = 'skyport'; parent.add(G);
    this.build(G);
    // the skybridge, the apron and the runway are part of the roof floor (walk there, ragdolls land there)
    if (FLOORRECT.r && FLOORRECT.r.areas) FLOORRECT.r.areas.push({r: BRIDGE}, {r: APRON}, {r: [RWY.x0, RWY.z - RWY.dw, RWY.x1, RWY.z + RWY.dw]});
    if (!document.getElementById('vo3flcss')) { const s = document.createElement('style'); s.id = 'vo3flcss'; s.textContent = CSS; document.head.appendChild(s); }
    const u = this.ui = document.createElement('div'); u.className = 'vo3fl';
    u.innerHTML = `<div class=vo3flh><b>FLYING</b> &nbsp;W S nose &middot; A D bank &middot; SHIFT / SPACE throttle (SPACE brakes on the ground) &middot; G gear &middot; T landing assist &middot; R practice landing &middot; E back to the hangar</div>
      <div class=vo3fli><div><span class=spd>0</span><small>KNOTS</small></div><div><span class=alt>0</span><small>FEET</small></div><div><span class=vs>0</span><small>FT / MIN</small></div><div><span class=thr>0</span><small>THROTTLE</small></div><div><span class=gear>DOWN</span><small>GEAR</small></div></div>
      <div class=vo3flr></div><div class=vo3flb></div><div class=vo3flf></div>
      <div class=vo3flg><h4>LANDING GUIDE &middot; RUNWAY 27</h4><div class=row><span>DISTANCE</span><b class=gdist>-</b></div><div class=row><span>LINE UP</span><b class=gloc>-</b></div><div class=bar><i class=gl style="left:50%"></i></div>
        <div class=row><span>GLIDE PATH</span><b class=ggs>-</b></div><div class=bar><i class=gg style="left:50%"></i></div><div class=row><span>SINK RATE</span><b class=gsink>-</b></div><div class=row><span>BANK</span><b class=gbank>-</b></div><div class=row><span>SPEED</span><b class=gspd>-</b></div><div class=row><span>GEAR</span><b class=ggear>-</b></div>
        <div class=lim>TOUCHDOWN LIMITS: SINK UNDER ${LIMITS.sink} M/S (UNDER 3 IS SMOOTH) &middot; BANK UNDER ${LIMITS.bank}&deg; &middot; NOSE NOT DOWN MORE THAN ${-LIMITS.pitch}&deg; &middot; GEAR DOWN &middot; ON THE RUNWAY &middot; STOP BEFORE THE END</div></div>
      <label class=vo3flt title="How fast you turn with the arrow keys or WASD (same as driving)">TURNING<input type=range min=1 max=10 step=1 aria-label="Turn sensitivity"><b>5</b></label>
      <div class=vo3flk><button data-a=assist class=on>ASSIST ON (T)</button><button data-a=gear>GEAR (G)</button><button data-a=practice>PRACTICE LANDING (R)</button></div>
      <div class=vo3flp><span></span><button data-k=up>&#9650;</button><span></span><button data-k=left>&#9664;</button><button data-k=down>&#9660;</button><button data-k=right>&#9654;</button></div>
      <div class=vo3flq><button data-k=boost>THROTTLE +</button><button data-k=slow>THROTTLE -</button></div><button class=vo3flx>BACK TO THE HANGAR</button>`;
    O.el.appendChild(u);
    const q = s => u.querySelector(s);
    this.E = {spd: q('.spd'), alt: q('.alt'), vs: q('.vs'), thr: q('.thr'), gear: q('.gear'), r: q('.vo3flr'), b: q('.vo3flb'), fade: q('.vo3flf'), g: q('.vo3flg'), gdist: q('.gdist'), gloc: q('.gloc'), gl: q('.gl'), ggs: q('.ggs'), gg: q('.gg'), gsink: q('.gsink'), gbank: q('.gbank'), gspd: q('.gspd'), ggear: q('.ggear'), as: q('[data-a=assist]')};
    this.bE = this.E.b; this.fade = this.E.fade; this.rE = this.E.r;
    this.sl = q('.vo3flt input'); this.slv = q('.vo3flt b');
    this.sl.addEventListener('input', () => this.setSens(+this.sl.value)); ['pointerdown', 'keydown'].forEach(ev => this.sl.addEventListener(ev, e => e.stopPropagation()));
    u.querySelectorAll('.vo3flp button,.vo3flq button').forEach(b => { const k = b.dataset.k, dn = e => { e.preventDefault(); this.keys[k] = 1; b.classList.add('on'); }, up = () => { this.keys[k] = 0; b.classList.remove('on'); }; b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up); });
    u.querySelectorAll('.vo3flk button').forEach(b => b.onclick = e => { e.stopPropagation(); const a = b.dataset.a; if (a === 'assist') this.toggleAssist(); else if (a === 'gear') this.toggleGear(); else this.practice(); });
    q('.vo3flx').onclick = e => { e.stopPropagation(); this.land(); };
    const KM = {ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', Shift: 'boost', ' ': 'slow'};
    addEventListener('keydown', e => {
      if (e.__vo3 || !this.me) return; const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (/^(e|E|Escape|g|G|t|T|r|R|\[|\])$/.test(e.key) || KM[e.key]) e.__vo3 = 1;
      const k = KM[e.key]; if (k) { this.keys[k] = 1; e.preventDefault(); e.stopPropagation(); return; }
      if (e.key === '[' || e.key === ']') { this.setSens(this.sens + (e.key === ']' ? 1 : -1)); e.preventDefault(); return; }
      if (e.key === 'g' || e.key === 'G') { this.toggleGear(); e.preventDefault(); }
      else if (e.key === 't' || e.key === 'T') { this.toggleAssist(); e.preventDefault(); }
      else if (e.key === 'r' || e.key === 'R') { this.practice(); e.preventDefault(); }
      else if (e.key === 'e' || e.key === 'E' || e.key === 'Escape') { this.land(); e.preventDefault(); e.stopPropagation(); }
    }, true);
    addEventListener('keyup', e => { const k = KM[e.key]; if (k) this.keys[k] = 0; }, true);
    addEventListener('blur', () => { this.keys = {}; });
  }
  setSens(v) { v = Math.max(1, Math.min(10, Math.round(v) || 5)); this.sens = v; try { localStorage.setItem('owq_steer', String(v)); } catch (e) {} if (this.sl) { this.sl.value = v; this.slv.textContent = v; } if (this.O.drive) { this.O.drive.sens = v; if (this.O.drive.sl) { this.O.drive.sl.value = v; this.O.drive.slv.textContent = v; } } }
  toggleAssist() { this.assist = !this.assist; this.E.as.classList.toggle('on', this.assist); this.E.as.textContent = this.assist ? 'ASSIST ON (T)' : 'ASSIST OFF (T)'; this.big(this.assist ? 'LANDING ASSIST ON' : 'LANDING ASSIST OFF', this.assist ? 'IT LINES YOU UP, HOLDS THE GLIDE PATH AND FLARES' : 'YOU FLY IT ALL THE WAY DOWN'); }
  toggleGear() { const f = this.me && this.me.fly; if (!f || f.gr) return; f.gear = f.gear ? 0 : 1; f.gearAuto = false; this.gearVis(f); this.O.sfx('click'); }
  // ---------- the Skyport
  build(G) {
    const Y = ROOFY, add = (geo, m, o = {}) => { const me = new THREE.Mesh(geo, m); me.castShadow = !!o.cast; me.receiveShadow = o.recv !== false; G.add(me); return me; };
    const put = (g, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.receiveShadow = true; G.add(o); return o; };
    const L = RWY.x1 - RWY.x0, cx = (RWY.x0 + RWY.x1) / 2, deckM = mat('concrete', {key: 'rwydeck', color: '#7a7e88'});
    // ---- the runway deck and the piers that hold it over the boulevard
    const dk = mbox(L, 1.6, RWY.dw * 2, 4); dk.translate(cx, Y - .81, RWY.z); add(dk, deckM, {cast: true});
    const piers = []; for (let x = RWY.x0 + 14; x < RWY.x1; x += 75) [-18, 6].forEach(dz => piers.push(plain(new THREE.CylinderGeometry(2.2, 2.7, Y - 1.6 - GROUNDY, 16).translate(x, (Y - 1.6 + GROUNDY) / 2, RWY.z + dz))));
    add(mergeGeometries(piers), mat('concrete', {key: 'rwypier', color: '#6c707a'}));
    // ---- runway surface: asphalt with every marking painted by the shader (edges, centreline, threshold keys, aiming point, touchdown zone)
    const rw = new THREE.PlaneGeometry(L, RWY.hw * 2).rotateX(-Math.PI / 2); rw.translate(cx, Y + .01, RWY.z); const ruv = rw.getAttribute('uv'); for (let i = 0; i < ruv.count; i++) ruv.setXY(i, ruv.getX(i) * L / 4, ruv.getY(i) * RWY.hw * 2 / 4);
    const rwM = patch(mat('asphalt', {key: 'runway', bump: .9, env: .9}), {key: 'runway', frag: `{float x=vWP.x,l=vWP.z-(${RWY.z.toFixed(1)}),al=abs(l);float m=0.;
      m+=step(21.6,al)*step(al,22.4);
      float cl=step(al,.45)*step(fract((x-${RWY.x0}.)/60.),.6)*step(${THRW + 70}.,x)*step(x,${THRE - 70}.);m+=cl;
      float keysE=step(${THRE - 36}.,x)*step(x,${THRE - 6}.)*step(al,19.5)*step(.5,fract(al/3.6+.25));float keysW=step(${THRW + 6}.,x)*step(x,${THRW + 36}.)*step(al,19.5)*step(.5,fract(al/3.6+.25));m+=keysE+keysW;
      m+=step(abs(x-${THRE}.),.9)*step(al,22.)+step(abs(x-${THRW}.),.9)*step(al,22.);
      float aim=(step(abs(x-${AIMX}.),22.)+step(abs(x-${THRW + 300}.),22.))*step(6.,al)*step(al,15.);m+=aim;
      float tz=0.;for(int k=0;k<4;k++){float xs=${THRE}.-150.*float(k+1);if(k==1)continue;tz+=step(abs(x-xs),11.)*step(6.,al)*step(al,13.)*step(.5,fract(al/2.4));}
      for(int k=0;k<4;k++){float xs=${THRW}.+150.*float(k+1);if(k==1)continue;tz+=step(abs(x-xs),11.)*step(6.,al)*step(al,13.)*step(.5,fract(al/2.4));}m+=tz;
      float rub=(1.-smoothstep(0.,240.,abs(x-${AIMX}.)))*(1.-smoothstep(4.,11.,al));diffuseColor.rgb*=1.-.35*rub;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.86,.86,.84),clamp(m,0.,1.));rk=mix(rk,.7,clamp(m,0.,1.));}`});
    add(rw, rwM);
    // runway numbers, read from the approach end
    [['27', THRE - 62, Math.PI / 2], ['09', THRW + 62, -Math.PI / 2]].forEach(([t, x, r]) => { const c = textCanvas(t, 512, 512, {col: '#ffffff', size: 420, weight: 700}); const m = put(new THREE.PlaneGeometry(14, 14).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({map: canvasTex(c), transparent: true, depthWrite: false, roughness: .7, polygonOffset: true, polygonOffsetFactor: -2}), x, Y + .02, RWY.z, 0, r, 0); m.renderOrder = 1; });
    // ---- lights: edge (white), centreline (white, red near the end), threshold (green), end (red), approach strobes, PAPI
    const edge = [], cen = [], thr = [], end = [];
    for (let x = RWY.x0 + 3; x <= RWY.x1 - 3; x += 30) [-1, 1].forEach(s => edge.push([x, Y + .35, RWY.z + s * (RWY.hw + .7), .9, 2.4, 2.3, 2]));
    for (let x = RWY.x0 + 8; x <= RWY.x1 - 8; x += 15) { const fromW = x - RWY.x0; cen.push([x, Y + .06, RWY.z, .55, fromW < 150 ? 3 : fromW < 300 && (x / 15 | 0) % 2 ? 3 : 2.2, fromW < 150 ? .25 : fromW < 300 && (x / 15 | 0) % 2 ? .25 : 2.1, fromW < 150 ? .3 : fromW < 300 && (x / 15 | 0) % 2 ? .3 : 1.9]); }
    for (let k = -20; k <= 20; k += 2.5) { thr.push([THRE + 1.5, Y + .3, RWY.z + k, 1, .3, 3, .9]); end.push([RWY.x0 + 1, Y + .3, RWY.z + k, 1, 3, .25, .3]); }
    glowPoints(G, edge); glowPoints(G, cen); glowPoints(G, thr); glowPoints(G, end);
    // approach lights out over the city: a bar every 30 m on a slim mast, and a strobe that runs toward the runway
    const bars = [], masts = [], strobes = [];
    for (let i = 0; i < 11; i++) { const x = RWY.x1 + 12 + i * 30; for (let k = -7; k <= 7; k += 2.33) bars.push([x, Y + .2, RWY.z + k, .8, 2.6, 2.4, 2]); strobes.push([x, Y + .6, RWY.z, 2.2, 0, 0, 0]); masts.push(plain(new THREE.BoxGeometry(.5, Y - GROUNDY, .5).translate(x, (Y + GROUNDY) / 2, RWY.z)), plain(new THREE.BoxGeometry(.3, .3, 15).translate(x, Y, RWY.z))); }
    glowPoints(G, bars); add(mergeGeometries(masts), mat('metal', {key: 'appmast', color: '#2a2d35'}));
    const st = glowPoints(G, strobes), sc = st.geometry.getAttribute('color');
    GFX.ticks.push(t => { const ph = (t * 2) % 1, k = Math.floor(ph * 14); for (let i = 0; i < 11; i++) { const on = 10 - i === k ? 4 : 0; sc.setXYZ(i, on, on, on); } sc.needsUpdate = true; });
    // PAPI: four lights left of the aiming point; white above your angle, red below (two of each = on the glide path)
    const papi = []; for (let i = 0; i < 4; i++) papi.push([AIMX + 12, Y + .5, RWY.z + RWY.hw + 2.2 + i * 1.6, 1.3, 3, 3, 3]);
    const pp = glowPoints(G, papi), pc = pp.geometry.getAttribute('color'), PA = [3.0, 3.33, 3.67, 4.0];
    papi.forEach(p => put(new THREE.BoxGeometry(.8, .5, .8), mat('metal', {key: 'papibox', color: '#e8e2d0'}), p[0], Y + .25, p[2]));
    this.papi = () => { const v = this.me && this.me.fly ? this.me.fly : this.O.cam.position, h = (v.y - Y), d = Math.max(1, v.x - (AIMX + 12)), e = Math.atan2(h, d) / D2R; for (let i = 0; i < 4; i++) { const w = e > PA[3 - i]; pc.setXYZ(i, w ? 3 : 3.2, w ? 3 : .25, w ? 3 : .3); } pc.needsUpdate = true; };
    GFX.ticks.push(() => this.papi());
    // ---- skybridge from the Sky Park plaza, and the apron with its taxi lines and the parking box
    const bz = (BRIDGE[1] + BRIDGE[3]) / 2, bw = BRIDGE[3] - BRIDGE[1], bl = BRIDGE[2] - BRIDGE[0];
    const bridge = mbox(bl, 1, bw, 3); bridge.translate(BRIDGE[0] + bl / 2, Y - .5, bz); add(bridge, mat('polished', {key: 'bridge', color: '#b3b0b9', bump: .5}), {cast: true});
    const glass = new THREE.MeshPhysicalMaterial({color: '#9fc6ff', roughness: .05, transparent: true, opacity: .18, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false});
    [BRIDGE[1], BRIDGE[3]].forEach(z => { put(new THREE.PlaneGeometry(bl, 1.1), glass, BRIDGE[0] + bl / 2, Y + .55, z); put(new THREE.BoxGeometry(bl, .04, .06), NEON(3.2, .3, .8), BRIDGE[0] + bl / 2, Y + .03, z); });
    const ap = mbox(APRON[2] - APRON[0], 1.2, APRON[3] - APRON[1], 4); ap.translate((APRON[0] + APRON[2]) / 2, Y - .6, (APRON[1] + APRON[3]) / 2); add(ap, deckM, {cast: true});
    const apM = patch(mat('concrete', {key: 'apron', color: '#8d9099', bump: .6}), {key: 'apron', frag: `{vec2 p=vWP.xz;float m=0.;
      vec2 g=fract(p/7.5);m-=.3*step(min(g.x,g.y),.012);float sl=h12(floor(p/7.5)+3.);float nz=vn(p*.03,vec2(1e4))*.6+vn(p*.11,vec2(1e4))*.4;diffuseColor.rgb*=(.86+.2*sl)*(.88+.24*nz);
      float oil=smoothstep(.62,.8,vn(p*.07+7.,vec2(1e4)));diffuseColor.rgb*=1.-.22*oil;rk=1.-.25*oil;
      float tx=step(abs(p.x-${STAND.x}.),.18)*step(${RWY.z + RWY.dw}.,p.y)*step(p.y,${STAND.z - 4}.);
      float tl=step(abs(p.y-21.),.18)*step(55.,p.x)*step(p.x,${STAND.x}.);
      vec2 b=abs(p-vec2(${STAND.x}.,${STAND.z + 2}.))-vec2(7.,8.);float bx=step(abs(max(b.x,b.y)),.15);
      float hs=step(abs(p.y-${(RWY.z + RWY.dw + 1.2).toFixed(2)}),.15)+step(abs(p.y-${(RWY.z + RWY.dw + 1.8).toFixed(2)}),.15)*step(.5,fract(p.x/2.));
      float y=clamp(tx+tl+bx+hs*step(70.,p.x)*step(p.x,135.),0.,1.);diffuseColor.rgb=mix(diffuseColor.rgb*(1.+m),vec3(.95,.72,.08),y);ek=y;eC=vec3(.25,.18,.02)*y;}`});
    const apTop = new THREE.PlaneGeometry(APRON[2] - APRON[0], APRON[3] - APRON[1]).rotateX(-Math.PI / 2); apTop.translate((APRON[0] + APRON[2]) / 2, Y + .008, (APRON[1] + APRON[3]) / 2);
    { const P = apTop.getAttribute('position'), UV = apTop.getAttribute('uv'); for (let i = 0; i < P.count; i++) UV.setXY(i, P.getX(i) / 7.5, P.getZ(i) / 7.5); } add(apTop, apM);
    // taxi edge lights (blue) from the stand to the runway
    const tlts = []; for (let z = RWY.z + RWY.dw + 1; z < STAND.z - 3; z += 6) [-1, 1].forEach(s => tlts.push([STAND.x + s * 5, Y + .25, z, .55, .3, .6, 3.2]));
    for (let x = 58; x < STAND.x - 5; x += 8) [-1, 1].forEach(s => tlts.push([x, Y + .25, 21 + s * 5, .55, .3, .6, 3.2])); glowPoints(G, tlts);
    // ---- the OWQ AIR hangar: an arched steel shed with its doors open, lit inside
    const H = HANGAR, hw = (H.x1 - H.x0) / 2, hd = H.z1 - H.z0, hx = (H.x0 + H.x1) / 2, sy = H.h / hw;
    const arch = new THREE.CylinderGeometry(hw, hw, hd, 48, 1, true, Math.PI / 2, Math.PI); arch.rotateX(Math.PI / 2); arch.scale(1, sy, 1); arch.translate(hx, Y, (H.z0 + H.z1) / 2);
    const auv = arch.getAttribute('uv'); for (let i = 0; i < auv.count; i++) auv.setXY(i, auv.getX(i) * 60 / 4, auv.getY(i) * hd / 4);
    const lit = (m, key, k) => patch(m, {key, frag: `{float h=vWP.y-${Y.toFixed(1)};ek=(1.-smoothstep(0.,16.,h))*${k}+.06;eC=vec3(.62,.58,.52);}`});
    add(arch, lit(mat('corrugated', {key: 'hangar', color: '#9097a6', extra: {side: THREE.DoubleSide}}), 'hangarlit', '.42'), {cast: true});
    const half = (hole) => { const s = new THREE.Shape(); s.moveTo(-hw, 0); for (let k = 0; k <= 32; k++) { const a = Math.PI - k / 32 * Math.PI; s.lineTo(Math.cos(a) * hw, Math.sin(a) * H.h); } s.lineTo(-hw, 0); if (hole) { const h = new THREE.Path(); h.moveTo(-hw + 3, 0); h.lineTo(hw - 3, 0); h.lineTo(hw - 3, H.h - 5); h.lineTo(-hw + 3, H.h - 5); h.lineTo(-hw + 3, 0); s.holes.push(h); } return new THREE.ShapeGeometry(s, 12); };
    const wallM = lit(mat('metal', {key: 'hangarwall', color: '#6a707d', extra: {side: THREE.DoubleSide}}), 'hangarwlit', '.5');
    const back = half(false); back.translate(hx, Y, H.z1); add(back, wallM);
    const front = half(true); front.translate(hx, Y, H.z0); add(front, wallM, {cast: true});
    put(new THREE.BoxGeometry(hw * 2 - 6, .5, .5), NEON(3.2, .3, .8), hx, Y + H.h - 5.25, H.z0 - .1);
    // door frame posts and the header, and inside: a bright end wall, an epoxy floor, work lights
    [hx - hw + 3, hx + hw - 3].forEach(x => put(new THREE.BoxGeometry(.6, H.h - 5, .8), mat('metal', {key: 'hangarpost', color: '#2b2f38'}), x, Y + (H.h - 5) / 2, H.z0 - .2).castShadow = true);
    put(mbox(34, 11, .3, 2.5), lit(mat('metal', {key: 'hangarend', color: '#c9cdd5', bump: .5}), 'hangarendlit', '.25'), hx, Y + 6.2, H.z1 - .75);
    put(new THREE.PlaneGeometry(hw * 2 - 2.6, hd - 1.2).rotateX(-Math.PI / 2), mat('polished', {key: 'hangarfloor', color: '#d9dce2', bump: .25, env: .35, emissive: '#3a3c42', ei: .55}), hx, Y + .012, (H.z0 + H.z1) / 2);
    put(new THREE.PlaneGeometry(26, 6.5), new THREE.MeshBasicMaterial({map: canvasTex(textCanvas('OWQ AIR', 1024, 256, {bg: '#b3122f', col: '#ffffff', size: 170})), toneMapped: false, color: new THREE.Color(1.15, 1.15, 1.15)}), hx, Y + 8.2, H.z1 - .55, 0, Math.PI, 0);
    { const wl = []; for (let x = hx - 20; x <= hx + 20.1; x += 10) for (let z = H.z0 + 6; z < H.z1 - 4; z += 9) wl.push([x, Y + H.h * Math.sqrt(Math.max(0, 1 - ((x - hx) / hw) ** 2)) - 1.6, z, 1.6, 3.2, 3.1, 2.9]); glowPoints(G, wl); }
    put(new THREE.PlaneGeometry(16, 3.4), new THREE.MeshBasicMaterial({map: canvasTex(textCanvas('OWQ AIR', 1024, 220, {col: '#fff0f6', glow: '#ff2d78'})), transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(2.4, 2.4, 2.4)}), hx, Y + H.h - 2.6, H.z0 - .2, 0, Math.PI, 0);
    const strips = []; for (let x = H.x0 + 8; x < H.x1 - 6; x += 8) strips.push(plain(new THREE.BoxGeometry(.4, .12, hd - 4).translate(x, Y + H.h * Math.sqrt(Math.max(0, 1 - ((x - hx) / hw) ** 2)) - .8, (H.z0 + H.z1) / 2)));
    add(mergeGeometries(strips), NEON(4, 3.9, 3.6), {recv: false});
    lightPools(G, [[hx - 14, Y + .02, H.z0 + 12, 12, .42, .4, .36], [hx + 14, Y + .02, H.z0 + 12, 12, .42, .4, .36], [hx, Y + .02, H.z0 + 24, 15, .45, .43, .39], [hx - 14, Y + .02, H.z1 - 8, 10, .3, .29, .26], [hx + 14, Y + .02, H.z1 - 8, 10, .3, .29, .26], [hx, Y + .02, H.z0 - 6, 16, .16, .15, .13]]);
    const logo = put(new THREE.PlaneGeometry(22, 8).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({map: canvasTex(textCanvas('OWQ AIR', 1024, 372, {col: '#ff1f4f', size: 230})), transparent: true, opacity: .5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2}), hx, Y + .02, H.z0 + 20, 0, Math.PI, 0); logo.renderOrder = 1;
    // a jet on display inside
    try { const jet = EXT.plane ? EXT.plane(9) : null; if (jet) { const sp = jet.userData.span || 10; jet.scale.setScalar(16 / sp); const bb = new THREE.Box3().setFromObject(jet); jet.position.set(hx, Y - bb.min.y, H.z0 + 22); jet.rotation.y = Math.PI / 2;
      jet.traverse(o => { if (o.isMesh && o.material && o.material.color) { o.material = o.material.clone(); o.material.emissive = o.material.color.clone().multiplyScalar(.32); o.material.emissiveIntensity = 1; o.castShadow = true; } }); G.add(jet); } } catch (e) {}
    // tool chests and a fuel truck
    const red = new THREE.MeshPhysicalMaterial({color: '#b3122f', roughness: .35, metalness: .3, clearcoat: .7});
    [[H.x0 + 4, H.z1 - 3], [H.x0 + 7, H.z1 - 3], [H.x1 - 4, H.z1 - 3]].forEach(([x, z]) => put(new THREE.BoxGeometry(2.4, 1.6, 1).translate(0, .8, 0), red, x, Y, z).castShadow = true);
    const truck = new THREE.Group(); truck.position.set(STAND.x + 16, Y, STAND.z - 2); truck.rotation.y = .4; G.add(truck);
    [[new THREE.BoxGeometry(2.6, 2.2, 2.4), '#e9e6de', [3.2, 1.5, 0]], [new THREE.CylinderGeometry(1.15, 1.15, 5.6, 20).rotateZ(Math.PI / 2), '#d8d4ca', [-.6, 1.75, 0]], [new THREE.BoxGeometry(8.2, .4, 2.3), '#2a2d35', [.3, .75, 0]]].forEach(([g, c, p]) => { const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({color: c, roughness: .45, metalness: .3})); m.position.set(...p); m.castShadow = true; truck.add(m); });
    { const tyre = new THREE.MeshStandardMaterial({color: '#141416', roughness: .9}), hub = new THREE.MeshStandardMaterial({color: '#b9bcc4', metalness: 1, roughness: .3}), wg = new THREE.CylinderGeometry(.52, .52, .42, 18).rotateX(Math.PI / 2), hg = new THREE.CylinderGeometry(.24, .24, .44, 12).rotateX(Math.PI / 2);
      [3.3, -1.2, -2.6].forEach(x => [-1.08, 1.08].forEach(z => { const w = new THREE.Mesh(wg, tyre); w.position.set(x, .52, z); truck.add(w); const h = new THREE.Mesh(hg, hub); h.position.set(x, .52, z); truck.add(h); }));
      const ws = new THREE.Mesh(new THREE.BoxGeometry(.06, .85, 2.1), new THREE.MeshPhysicalMaterial({color: '#1d2a3c', roughness: .05, metalness: .2, envMapIntensity: 1.6})); ws.position.set(4.52, 1.95, 0); truck.add(ws);
      [-1.21, 1.21].forEach(z => { const sw = new THREE.Mesh(new THREE.BoxGeometry(1.2, .7, .04), ws.material); sw.position.set(3.4, 2, z); truck.add(sw); });
      const reel = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .5, 16).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({color: '#c4122f', roughness: .5})); reel.position.set(-3.7, 1.4, 0); truck.add(reel);
      const bcn = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .16, 10), NEON(3.6, 1.8, .2)); bcn.position.set(3.2, 2.7, 0); truck.add(bcn); }
    FLOORBOX.r.push([STAND.x + 11.5, STAND.z - 6, STAND.x + 20.5, STAND.z + 2]);
    // hangar walls block walkers (the front is open)
    FLOORBOX.r.push([H.x0, H.z0, H.x0 + 1.2, H.z1], [H.x1 - 1.2, H.z0, H.x1, H.z1], [H.x0, H.z1 - .6, H.x1, H.z1 + .3], [H.x0, H.z0 - .3, H.x0 + 3, H.z0 + .3], [H.x1 - 3, H.z0 - .3, H.x1, H.z0 + .3]);
    // ---- control tower with a glass cab and a beacon
    const T = CTWR; put(new THREE.CylinderGeometry(2.4, 3.2, 26, 16), mat('concrete', {key: 'ctwr', color: '#cfd1d8'}), T.x, Y + 13, T.z).castShadow = true;
    const cab = put(new THREE.CylinderGeometry(5.4, 4.4, 4.6, 8), new THREE.MeshPhysicalMaterial({color: '#4d6b8a', emissive: new THREE.Color('#2a3b52'), emissiveIntensity: .8, roughness: .05, metalness: .3, transparent: true, opacity: .8}), T.x, Y + 28.3, T.z); cab.castShadow = true;
    put(new THREE.CylinderGeometry(5.8, 5.8, .6, 8), mat('metal', {key: 'ctwrroof', color: '#2a2d35'}), T.x, Y + 30.9, T.z); put(new THREE.CylinderGeometry(4.6, 4.6, .6, 8), mat('metal', {key: 'ctwrroof', color: '#2a2d35'}), T.x, Y + 25.8, T.z);
    put(new THREE.CylinderGeometry(.08, .08, 6, 6), mat('metal', {key: 'ctwrroof', color: '#2a2d35'}), T.x, Y + 34, T.z);
    put(new THREE.TorusGeometry(5.6, .05, 6, 8), mat('metal', {key: 'ctwrrail', color: '#c9ccd4'}), T.x, Y + 31.8, T.z, Math.PI / 2, 0, Math.PI / 8);
    put(mbox(12, 5, 9, 3), mat('concrete', {key: 'ctwrbase', color: '#b8bbc4'}), T.x + 2, Y + 2.5, T.z + 1).castShadow = true;
    put(new THREE.PlaneGeometry(10, 1.3), new THREE.MeshStandardMaterial({color: '#ffd6a0', emissive: new THREE.Color('#ffb870'), emissiveIntensity: 1.2, roughness: .2}), T.x + 2, Y + 3.2, T.z - 3.52, 0, Math.PI, 0);
    glowPoints(G, [[hx, Y + H.h + .35, H.z0 + 1.5, 1.4, 3.4, .25, .3], [hx, Y + H.h + .35, H.z1 - 1.5, 1.4, 3.4, .25, .3]], {blink: .5});
    put(new THREE.PlaneGeometry(10, 1.6), new THREE.MeshBasicMaterial({map: canvasTex(textCanvas('OWQ SKYPORT', 1024, 160, {col: '#fff0f6', glow: '#ff2d78'})), transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(2.2, 2.2, 2.2)}), T.x, Y + 23.5, T.z - 3.3, 0, Math.PI, 0);
    const bc = glowPoints(G, [[T.x, Y + 37.2, T.z, 2.4, 0, 0, 0]]), bcc = bc.geometry.getAttribute('color');
    GFX.ticks.push(t => { const ph = (t * .75) % 1, on = ph < .12 ? 1 : ph > .5 && ph < .62 ? 2 : 0; bcc.setXYZ(0, on === 1 ? .3 : on === 2 ? 3.4 : 0, on ? 3.2 : 0, on === 1 ? 1 : on === 2 ? 3.2 : 0); bcc.needsUpdate = true; });
    FLOORBOX.r.push([T.x - 3.4, T.z - 3.4, T.x + 3.4, T.z + 3.4], [T.x - 4, T.z - 3.5, T.x + 8, T.z + 5.5]);
    // windsock on the apron corner
    const ws = this.sock = new THREE.Group(); ws.position.set(44, Y, 24); G.add(ws);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 6.5, 8), mat('metal', {key: 'sockpole', color: '#c9ccd4'})); pole.position.y = 3.25; ws.add(pole);
    const sockC = cv(256, 64), sx = sockC.getContext('2d'); for (let i = 0; i < 5; i++) { sx.fillStyle = i % 2 ? '#f4f2ee' : '#ff6a10'; sx.fillRect(i * 51.2, 0, 52, 64); }
    const sock = new THREE.Mesh(new THREE.CylinderGeometry(.18, .5, 3.4, 16, 1, true).rotateZ(Math.PI / 2).translate(1.7, 0, 0), new THREE.MeshStandardMaterial({map: canvasTex(sockC), side: THREE.DoubleSide, roughness: .8})); sock.position.y = 6.3; ws.add(sock); this.sockM = sock;
    FLOORBOX.r.push([43.6, 23.6, 44.4, 24.4]);
    // floodlights over the apron
    const fl = []; [[40, 74], [168, 74], [168, 20], [64, 52]].forEach(([x, z]) => { put(new THREE.CylinderGeometry(.25, .4, 20, 8), mat('metal', {key: 'flood', color: '#2a2d35'}), x, Y + 10, z); fl.push([x, Y + 20.4, z, 2.4, 3, 2.9, 2.6]); FLOORBOX.r.push([x - .6, z - .6, x + .6, z + .6]); });
    glowPoints(G, fl); lightPools(G, [[60, Y + .02, 40, 18, .12, .12, .1], [120, Y + .02, 30, 22, .12, .12, .1], [150, Y + .02, 60, 16, .1, .1, .09]]);
    // a sign on the Sky Park plaza pointing over the bridge
    put(new THREE.PlaneGeometry(4.6, 1), new THREE.MeshBasicMaterial({map: canvasTex(textCanvas('SKYPORT  ▶', 1024, 220, {col: '#fff0f6', glow: '#ff2d78'})), transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(2.2, 2.2, 2.2), side: THREE.DoubleSide}), 17, Y + 3.4, bz, 0, -Math.PI / 2, 0);
    // ---- Ring Run: a loop of rings around the city and the tower
    const rm = new THREE.MeshBasicMaterial({color: new THREE.Color(3.6, 2.6, .6), toneMapped: false}), rn = new THREE.MeshBasicMaterial({color: new THREE.Color(.4, 2.3, 2.7), toneMapped: false});
    this.rings = RINGS.map((p, i) => { const n = RINGS[(i + 1) % RINGS.length], m = new THREE.Mesh(new THREE.TorusGeometry(9, .55, 8, 40), i ? rm : rn); m.position.set(p[0], p[1], p[2]); m.lookAt(n[0], n[1], n[2]); G.add(m); return {m, p: m.position, i}; });
    this.parked = null;
  }
  // ---------- walking hooks: the plane waits in front of the hangar
  walkPrompt(a) {
    const w = a.wk; if (!w || w.f !== 'r' || this.me) return null;
    if (Math.hypot(w.x - STAND.x, w.z - STAND.z) < 8) {
      if (!(a.look && a.look.F > 0)) return {k: 'noplane', t: 'NO PLANE YET: GET ONE IN THE BATTLE PASS OR A CRATE'};
      return {k: 'fly', t: 'FLY MY PLANE'};
    }
    return null;
  }
  walkUse(p, a) { if (p.k === 'fly') { this.start(a); return true; } if (p.k === 'noplane') { this.O.ui.toast('Planes unlock in the Battle Pass and come out of the Ride loot crates.'); return true; } return null; }
  // the plane model with its wheels on the ground at the group origin
  model(id) {
    let m = null; try { if (EXT.plane) m = EXT.plane(id); } catch (e) { m = null; }
    if (!m) { m = new THREE.Group(); const b = new THREE.MeshStandardMaterial({color: '#ff1f4f', roughness: .4, metalness: .3}); m.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, .25, .25), b)); m.add(new THREE.Mesh(new THREE.BoxGeometry(.4, .05, 2), b)); m.userData.span = 2; }
    const sp = m.userData.span || 1; m.scale.setScalar(SPAN / sp);
    let gear = []; m.traverse(o => { if (o.userData && o.userData.gear) gear.push(o); });
    const bb = new THREE.Box3().setFromObject(m);
    if (!gear.length) {   // models without gear get simple struts and wheels
      const blk = new THREE.MeshStandardMaterial({color: '#141416', roughness: .8}), k = 1 / m.scale.x, ln = bb.max.x - bb.min.x, low = bb.min.y;
      [[bb.min.x + ln * .72, 0], [bb.min.x + ln * .38, .9], [bb.min.x + ln * .38, -.9]].forEach(([x, z]) => { const st = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .9, 6), blk); st.position.set(x * k, (low - .45) * k, z * k * (SPAN / 4)); st.scale.setScalar(k); const wh = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .16, 14).rotateX(Math.PI / 2), blk); wh.position.set(x * k, (low - .9) * k, z * k * (SPAN / 4)); wh.scale.setScalar(k); st.userData.gear = wh.userData.gear = 1; m.add(st, wh); gear.push(st, wh); });
      bb.setFromObject(m);
    }
    const g = new THREE.Group(); m.position.y = -bb.min.y; g.add(m); g.userData.gear = gear; g.userData.seatY = m.position.y + 1.05; g.userData.spin = m.userData.spin; g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return g;
  }
  gearVis(f) { const L = f.m.userData.gear || []; L.forEach(o => { o.visible = !!f.gear; }); }
  // ---------- my flight: from the stand, lined up on the west end of runway 09
  start(a) {
    const O = this.O; if (!a || !a.wk || this.me || !(a.look && a.look.F > 0)) return false;
    const m = this.model(a.look.F); this.group.add(m); O.warm && O.warm(m);
    const f = {m, x: THRW + 8, y: ROOFY, z: RWY.z, yaw: Math.PI / 2, pitch: 0, roll: 0, v: 0, vy: 0, thr: .9, gear: 1, gearAuto: true, gr: 1, c: a.look.F, q: new THREE.Quaternion(), t0: O.t, rot: 0};
    O.walk.me = null; O.walk.ui.classList.remove('on'); O.walk.prE.classList.remove('on'); try { O.api.walk && O.api.walk(null); } catch (e) {}
    a.wk = null; a.mv = 0; a.fly = f; a.mode = 'fly'; a.sitK = 1; a.root.scale.setScalar(.6);
    this.me = a; this.keys = {}; this.sens = steer0(); this.sl.value = this.sens; this.slv.textContent = this.sens;
    this.ui.classList.add('on'); this.ri = 0; this.rt0 = 0; this.ringUI(); O.sfx('vroom'); this.big('RUNWAY 09 · CLEARED FOR TAKEOFF', 'FULL THROTTLE IS ON · W TO LIFT OFF AT 58 KNOTS'); this.snap = 1; this.send(1); this.gearVis(f);
    this.fade.classList.add('on'); setTimeout(() => this.fade.classList.remove('on'), 250);
    return true;
  }
  // back to the hangar (from anywhere, crashed or not)
  land(crash) {
    const a = this.me, O = this.O; if (!a || this.tp) return; this.tp = 1; this.fade.classList.add('on'); O.sfx('whoosh');
    setTimeout(() => {
      const f = a.fly; if (f) this.group.remove(f.m); a.fly = null; this.me = null; this.keys = {}; this.ui.classList.remove('on'); this.tp = 0;
      a.root.scale.setScalar(1); a.root.rotation.set(0, 0, 0); a.mode = 'seated';
      try { O.api.state && O.api.state('fl', null); } catch (e) {} this.last = '';
      O.walk.start({at: {x: STAND.x - 6, z: STAND.z + 3, y: ROOFY, h: Math.PI, f: 'r'}}); O.walk.snap = 1;
      setTimeout(() => this.fade.classList.remove('on'), 150);
      if (crash) O.ui.toast('Your plane is back at the hangar. Press R in the air for a practice landing.');
    }, crash ? 2200 : 400);
  }
  // a stable final approach 1.3 km out, lined up, gear down: the quickest way to practise landing
  practice() {
    const a = this.me, f = a && a.fly; if (!f || this.tp) return;
    this.tp = 1; this.fade.classList.add('on');
    setTimeout(() => { const d = 1300; f.x = AIMX + d; f.z = RWY.z; f.y = ROOFY + d * Math.tan(GS); f.yaw = -Math.PI / 2; f.pitch = -GS; f.roll = 0; f.v = VAPP; f.vy = -VAPP * Math.sin(GS); f.thr = .2; f.gear = 1; f.gearAuto = true; f.gr = 0; f.done = 0; f.crashed = 0; this.gearVis(f); this.snap = 1; this.send(1); this.tp = 0; setTimeout(() => this.fade.classList.remove('on'), 140); this.big('FINAL APPROACH · RUNWAY 27', 'FOLLOW THE GUIDE · TWO WHITE, TWO RED LIGHTS = ON THE GLIDE PATH'); }, 360);
  }
  fwd(f, v) { const cp = Math.cos(f.pitch); return v.set(Math.sin(f.yaw) * cp, Math.sin(f.pitch), Math.cos(f.yaw) * cp); }
  tick(dt, t) {
    const O = this.O;
    O.av.forEach(a => { if (a === this.me) this.mine(a, dt, t); else if (a.fly && a.fly.rt) this.follow(a, dt); });
    // my own plane waits at the stand while I'm on the roof
    const me = O.meAv, want = me && !this.me && me.wk && me.wk.f === 'r' && me.look && me.look.F > 0 ? me.look.F : 0;
    if (want !== (this.parkedId || 0)) { if (this.parked) this.group.remove(this.parked); this.parked = null; this.parkedId = want; if (want) { this.parked = this.model(want); this.parked.position.set(STAND.x, ROOFY, STAND.z); this.parked.rotation.y = Math.PI / 2; this.group.add(this.parked); } }
    this.rings.forEach((r, i) => { r.m.visible = !!this.me || O.wld.zone !== 'o'; r.m.rotation.z += dt * .4 * (i % 2 ? 1 : -1); });
    if (this.sockM) this.sockM.rotation.set(Math.sin(t * .8) * .06, .5 + Math.sin(t * .37) * .25, -.15 + Math.sin(t * 1.7) * .05);
  }
  // ---------- the flight model
  mine(a, dt, t) {
    const f = a.fly; if (!f) return;
    const n = Math.min(6, Math.ceil(dt / (1 / 90))); for (let i = 0; i < n && a.fly && !f.crashed; i++) this.step(a, f, dt / n, t);
    if (!a.fly) return;
    this.place(a, f); this.hud(f, t);
    if ((this.sendT -= dt) <= 0) { this.sendT = .1; this.send(); }
  }
  step(a, f, dt, t) {
    const K = this.keys, O = this.O, sv = this.sens / 5;
    const pin = (K.up ? 1 : 0) - (K.down ? 1 : 0), rin = (K.left ? 1 : 0) - (K.right ? 1 : 0), tin = (K.boost ? 1 : 0) - (K.slow ? 1 : 0);
    if (f.crashed) return;
    const h = f.y - ROOFY;
    // throttle
    if (tin) f.thr = clamp(f.thr + tin * .7 * dt, 0, 1);
    if (f.gr) {
      // rolling on the wheels: nosewheel steering, brakes, rotate at VR
      const auto = this.assist && f.done && !tin && f.thr <= .01, brake = K.slow && f.thr <= .01 ? 6 : auto ? 2.6 : 0;   // SPACE brakes; after a landing the assist brakes gently on its own
      f.v = Math.max(0, f.v + (f.thr * TMAX - CD * f.v * f.v - .35 - brake) * dt);
      if (f.v < .05 && f.thr <= .01) f.v = 0;
      const steer = (.6 / (1 + f.v / 8)) * (1 + .3 * (sv - 1));
      f.yaw += rin * steer * dt;
      f.roll = damp(f.roll, 0, 6, dt);
      const rotate = (pin > 0 && f.v > VR - 2) || (this.assist && f.v > VR + 5 && !f.done && f.x < THRE - 200 && Math.cos(f.yaw - Math.PI / 2) > .9);
      f.pitch = damp(f.pitch, rotate ? 9 * D2R : 0, rotate ? 1.6 : 4, dt);
      f.x += Math.sin(f.yaw) * f.v * dt; f.z += Math.cos(f.yaw) * f.v * dt; f.y = ROOFY; f.vy = 0;
      if (f.pitch > 4 * D2R && f.v > VR) { f.gr = 0; f.done = 0; f.stopT = 0; f.liftT = t; f.vy = Math.sin(f.pitch) * f.v; this.big('AIRBORNE', 'GEAR COMES UP ON ITS OWN · RING RUN: FLY THROUGH THE BLUE RING'); O.sfx('whee', .6); }
      // off the end or over the side: it's a long way down
      if (!onRwyDeck(f.x, f.z) && !onRect(APRON, f.x, f.z)) { this.crash(f.x < RWY.x0 ? 'OVERRAN THE RUNWAY' : 'ROLLED OFF THE DECK'); return; }
      if (f.done && f.v < .3) { if (!f.stopT) { f.stopT = t; this.big('STOPPED', 'PRESS E TO PARK AT THE HANGAR · R TO GO AROUND AGAIN'); } }
      return;
    }
    // in the air: bank to turn, nose up / down, energy follows the climb and dive
    f.roll = damp(f.roll, rin * .95, 2.2 + 1.6 * sv, dt);
    f.yaw += Math.tan(f.roll) * 9.8 / Math.max(14, f.v) * dt * (1.3 + .5 * sv);
    if (pin) f.pitch = clamp(f.pitch + pin * (.55 + .45 * sv) * dt, -1.05, 1.05); else f.pitch = damp(f.pitch, 0, .3, dt);
    const vst = f.gear ? VSTALL - 2 : VSTALL;
    f.v = clamp(f.v + (f.thr * TMAX - CD * f.v * f.v - 9.8 * Math.sin(f.pitch)) * dt, 0, 90);
    if (f.v < vst) { f.pitch -= (vst - f.v) * .08 * dt; f.stall = 1; } else f.stall = 0;
    // landing assist on the approach to runway 27
    const ap = this.approach(f);
    if (this.assist && ap.on) {
      if (!rin) { const w = clamp(-ap.lat * .035, -.35, .35), yt = Math.atan2(-1, w); let dy = yt - f.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); f.yaw += clamp(dy, -.35 * dt, .35 * dt); f.roll = damp(f.roll, clamp(dy * 2.2, -.4, .4), 3, dt); }
      if (!pin) { const pt = -GS + clamp(-ap.dev * .012, -.08, .08); f.pitch = damp(f.pitch, pt, 1.8, dt); }
      if (!tin) f.thr = damp(f.thr, clamp(.2 + (VAPP - f.v) * .09, 0, 1), 2.5, dt);
      // flare: over the runway in the last few metres the nose comes up and the sink rate melts away (to about 1 m/s)
      if (h < 6 && onRunway(f.x, f.z) && pin >= 0) { const vsT = -(.7 + h * .35); f.pitch = Math.max(f.pitch, Math.asin(clamp(vsT / Math.max(15, f.v), -.5, .5))); }
    }
    // after takeoff the assist holds a steady climb until you're clear of the city's roofs
    if (this.assist && !pin && !ap.on && f.liftT && t - f.liftT < 14 && h < 110) f.pitch = damp(f.pitch, 9 * D2R, 1.2, dt);
    // gear: up after takeoff, down for the approach (unless you took over with G)
    if (f.gearAuto) { const want = ap.on && h < 160 ? 1 : h > 30 && f.v > VR && !ap.on ? 0 : f.gear; if (want !== f.gear) { f.gear = want; this.gearVis(f); this.O.sfx('click', .5); } }
    const cp = Math.cos(f.pitch); f.x += Math.sin(f.yaw) * cp * f.v * dt; f.z += Math.cos(f.yaw) * cp * f.v * dt; f.vy = Math.sin(f.pitch) * f.v - (f.stall ? (vst - f.v) * .4 : 0); f.y += f.vy * dt;
    // the city edge and the ceiling
    // the edge of the map: past 2.6 km from the tower, heading away, the plane turns back toward the city
    const r = Math.hypot(f.x, f.z); if (r > 2600) { const back = Math.atan2(-f.x, -f.z); let dy = back - f.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); if (Math.abs(dy) > .7) { f.yaw += Math.sign(dy) * dt * .5; if (!this._edge || t - this._edge > 4) { this._edge = t; this.big('TURN BACK', 'THE CITY AND THE SKYPORT ARE BEHIND YOU'); } } }
    if (f.y > 650) { f.y = 650; f.pitch = Math.min(f.pitch, 0); }
    // touching down, or hitting something
    const hit = this.hit(f); if (hit) { this.crash(hit); return; }
    if (f.y <= ROOFY && onRwyDeck(f.x, f.z)) { this.touchdown(f, t); return; }
    // rings
    const R = this.rings[this.ri], P = this._p || (this._p = new THREE.Vector3()); P.set(f.x, f.y, f.z); if (R && R.p.distanceTo(P) < 9) {
      if (this.ri === 0) this.rt0 = t; this.ri++; O.sfx('ding');
      if (this.ri >= this.rings.length) { const tm = t - this.rt0; this.big('RING RUN ' + tm.toFixed(1) + 's'); O.sfx('chaching'); try { O.api.score && O.api.score('rings', Math.max(1, 1000 - Math.round(tm))); } catch (e) {} try { const b = +localStorage.getItem('owq_ringbest') || 0; if (!b || tm < b) localStorage.setItem('owq_ringbest', tm.toFixed(2)); } catch (e) {} this.ri = 0; }
      else this.big('RING ' + this.ri + ' / ' + this.rings.length);
      this.ringUI();
    }
  }
  // where am I relative to runway 27? lat = metres off the centreline, dev = metres above (+) / below the glide path
  approach(f) {
    const dist = f.x - AIMX, lat = f.z - RWY.z, h = f.y - ROOFY, west = Math.sin(f.yaw) < -.82;
    const on = west && dist > -200 && dist < 5200 && Math.abs(lat) < 45 + Math.max(0, dist) * .18 && h < 520 && h > -2;
    return {on, dist, lat, h, dev: h - Math.max(0, dist) * Math.tan(GS)};
  }
  // the moment the wheels meet the runway: graded, or a crash with the reason
  touchdown(f, t) {
    const O = this.O, sink = Math.max(0, -f.vy), bank = Math.abs(f.roll) / D2R, pitch = f.pitch / D2R, lat = Math.abs(f.z - RWY.z), spd = f.v;
    let why = null;
    if (!f.gear) why = 'GEAR UP: BELLY LANDING';
    else if (sink > LIMITS.sink) why = 'TOO HARD: ' + sink.toFixed(1) + ' M/S DOWN (LIMIT ' + LIMITS.sink + ')';
    else if (bank > LIMITS.bank) why = 'WING STRIKE: ' + bank.toFixed(0) + '° BANK (LIMIT ' + LIMITS.bank + '°)';
    else if (pitch < LIMITS.pitch) why = 'NOSE FIRST: ' + (-pitch).toFixed(0) + '° DOWN (LIMIT ' + (-LIMITS.pitch) + '°)';
    else if (spd > LIMITS.speed) why = 'TOO FAST: ' + Math.round(spd * 1.94) + ' KNOTS';
    else if (lat > RWY.hw) why = 'MISSED THE RUNWAY: ' + lat.toFixed(0) + ' M OFF THE CENTRE';
    if (why) { this.crash(why); return; }
    f.y = ROOFY; f.gr = 1; f.vy = 0; f.roll = 0; f.pitch = Math.max(0, f.pitch);
    if (f.done) return;      // a bounce
    f.done = 1; f.stopT = 0; f.thr = 0;
    const along = f.x - AIMX, westbound = Math.sin(f.yaw) < -.5;
    let sc = 100 - sink * 8 - lat * 1.3 - Math.max(0, Math.abs(along) - 60) / 6 - bank * 1.2 - Math.max(0, spd - 42) * 1.5 - (westbound ? 0 : 25);
    sc = Math.round(clamp(sc, 1, 100));
    const word = sink <= 1.2 ? 'BUTTER LANDING' : sink <= 2.5 ? 'SMOOTH LANDING' : sink <= 4.5 ? 'FIRM LANDING' : 'HARD LANDING';
    O.shk = Math.max(O.shk || 0, Math.min(.5, sink * .07)); O.sfx(sink > 4.5 ? 'thud' : 'clink', .7);
    if (O.pfx) for (let k = 0; k < 14; k++) O.pfx.emit('smoke', f.x + (Math.random() - .5) * 2, ROOFY + .2, f.z + (Math.random() - .5) * 3, (Math.random() - .5), .5, (Math.random() - .5), {a: .25, life: 1.2, s0: .6, s1: 2.6});
    let best = 0; try { best = +localStorage.getItem('owq_landbest') || 0; if (sc > best) localStorage.setItem('owq_landbest', String(sc)); } catch (e) {}
    try { O.api.score && O.api.score('landing', sc); } catch (e) {}
    this.big(word + ' · ' + sc + ' / 100', 'SINK ' + sink.toFixed(1) + ' M/S · ' + lat.toFixed(1) + ' M OFF CENTRE · ' + (along >= 0 ? Math.round(along) + ' M BEFORE' : Math.round(-along) + ' M PAST') + ' THE MARKERS' + (sc > best ? ' · NEW BEST' : '') + ' · SPACE TO BRAKE', 4200);
    if (sc >= 90) O.sfx('chaching');
  }
  crash(why) {
    const a = this.me, f = a && a.fly, O = this.O; if (!f || f.crashed) return; f.crashed = 1;
    O.sfx('boom'); O.shk = 1;
    if (O.pfx) { for (let k = 0; k < 60; k++) O.pfx.emit('spark', f.x, f.y + 1, f.z, (Math.random() - .5) * 14, Math.random() * 9, (Math.random() - .5) * 14, {life: .9}); for (let k = 0; k < 24; k++) O.pfx.emit('flame', f.x + (Math.random() - .5) * 3, f.y + 1, f.z + (Math.random() - .5) * 3, (Math.random() - .5) * 2, 2 + Math.random() * 2, (Math.random() - .5) * 2, {life: .8, s0: 1.6, s1: .4}); for (let k = 0; k < 30; k++) O.pfx.emit('smoke', f.x, f.y + 1, f.z, (Math.random() - .5) * 3, 1.5 + Math.random() * 2, (Math.random() - .5) * 3, {life: 3, s0: 1.5, s1: 7, a: .5}); }
    O.fx.sparkle(f.x, f.y, f.z, 60, [1, .6, .3]);
    f.m.visible = false;
    this.big('CRASH', why, 2400);
    this.land(1);
  }
  // what's in the way (null = clear sky)
  hit(f) {
    if (f.y < GROUNDY + 1.5) return 'HIT THE STREET';
    if (f.x > TOWER.x0 - 1 && f.x < TOWER.x1 + 1 && f.z > TOWER.z0 - 1 && f.z < TOWER.z1 + 1 && f.y < ROOFY + 3) return 'HIT THE OWQ TOWER';
    if (f.y < ROOFY + 16 && f.y > ROOFY - 2 && onDeck(f.x, f.z)) return 'HIT THE SKY PARK';
    if (f.y < ROOFY + 1 && f.y > ROOFY - 2 && (onRect(APRON, f.x, f.z) || onRect(BRIDGE, f.x, f.z))) return 'TOUCHED DOWN ON THE APRON, NOT THE RUNWAY';
    if (f.y < ROOFY + 1 && f.y > ROOFY - 2.2 && onRwyDeck(f.x, f.z) && Math.abs(f.z - RWY.z) > RWY.hw) return 'MISSED THE RUNWAY';
    if (f.y < ROOFY - 2 && f.y > ROOFY - 3.5 && (onRwyDeck(f.x, f.z) || onRect(APRON, f.x, f.z))) return 'HIT THE DECK FROM BELOW';
    const H = HANGAR; if (f.x > H.x0 - 1 && f.x < H.x1 + 1 && f.z > H.z0 - 1 && f.z < H.z1 + 1 && f.y < ROOFY + H.h + 1) return 'HIT THE HANGAR';
    if ((Math.hypot(f.x - CTWR.x, f.z - CTWR.z) < 6.5 && f.y < ROOFY + 37) || (f.x > CTWR.x - 5 && f.x < CTWR.x + 9 && f.z > CTWR.z - 4.5 && f.z < CTWR.z + 6.5 && f.y < ROOFY + 6)) return 'HIT THE CONTROL TOWER';
    const W = this.O.wld, B = W && (W.bldNear ? W.bldNear(f.x, f.z) : W.blds); if (B) for (const b of B) { if (Math.abs(f.x - b[0]) < b[2] / 2 + 1.5 && Math.abs(f.z - b[1]) < b[3] / 2 + 1.5 && f.y < GROUNDY + b[4] + 1) return 'HIT A BUILDING'; }
    return null;
  }
  place(a, f) {
    const g = f.m; g.position.set(f.x, f.y, f.z);
    // the model is built nose toward +x; turn it to face where we fly
    g.rotation.set(0, 0, 0); g.rotateY(f.yaw - Math.PI / 2); g.rotateZ(f.pitch); g.rotateX(-f.roll);
    if (g.userData.spin) g.userData.spin((f.v * .05 + f.thr * .4) * (this.O.t % 1000));
    const up = this._u || (this._u = new THREE.Vector3()); up.set(0, g.userData.seatY || 1.9, -.3).applyQuaternion(g.quaternion);
    a.root.position.set(f.x + up.x, f.y + up.y - .4, f.z + up.z); a.root.rotation.set(0, f.yaw, 0);
    f.q.copy(g.quaternion);
  }
  hud(f, t) {
    const E = this.E, h = f.y - ROOFY, spd = Math.round(f.v * 1.94), alt = Math.max(0, Math.round(h * 3.28)), vs = Math.round(f.vy * 196.85 / 10) * 10, thr = Math.round(f.thr * 100);
    if (spd !== this._spd) { this._spd = spd; E.spd.textContent = spd; } if (alt !== this._alt) { this._alt = alt; E.alt.textContent = alt; } if (vs !== this._vs) { this._vs = vs; E.vs.textContent = (vs > 0 ? '+' : '') + vs; } if (thr !== this._thr) { this._thr = thr; E.thr.textContent = thr + '%'; }
    const gs = f.stall ? 'STALL' : f.gear ? 'DOWN' : 'UP'; if (gs !== this._gs) { this._gs = gs; E.gear.textContent = gs; E.gear.className = f.stall ? 'st' : f.gear ? 'gd' : 'gu'; }
    const ap = this.approach(f), show = ap.on || (f.done && f.gr) || (Math.sin(f.yaw) < 0 && ap.dist > 0 && ap.dist < 6000 && Math.abs(ap.lat) < 600 && !f.gr);
    E.g.classList.toggle('on', show);
    if (show) {
      const km = Math.max(0, ap.dist) / 1000, sink = Math.max(0, -f.vy), bank = Math.abs(f.roll) / D2R, cls = (v, a, b) => v < a ? 'ok' : v < b ? 'warn' : 'bad';
      E.gdist.textContent = ap.dist > 0 ? km.toFixed(2) + ' KM TO THE MARKERS' : 'OVER THE RUNWAY';
      E.gloc.textContent = Math.abs(ap.lat) < 4 ? 'LINED UP' : ap.lat > 0 ? 'STEER RIGHT ' + Math.round(ap.lat) + ' M' : 'STEER LEFT ' + Math.round(-ap.lat) + ' M'; E.gloc.className = Math.abs(ap.lat) < 4 ? 'ok' : Math.abs(ap.lat) < 15 ? 'warn' : 'bad';
      E.gl.style.left = clamp(50 - ap.lat * 1.2, 4, 96) + '%';
      E.ggs.textContent = Math.abs(ap.dev) < 6 ? 'ON THE GLIDE PATH' : ap.dev > 0 ? 'HIGH ' + Math.round(ap.dev) + ' M' : 'LOW ' + Math.round(-ap.dev) + ' M'; E.ggs.className = Math.abs(ap.dev) < 6 ? 'ok' : Math.abs(ap.dev) < 20 ? 'warn' : 'bad';
      E.gg.style.left = clamp(50 + ap.dev * .9, 4, 96) + '%';
      E.gsink.textContent = sink.toFixed(1) + ' M/S'; E.gsink.className = cls(sink, 3, LIMITS.sink);
      E.gbank.textContent = bank.toFixed(0) + '°'; E.gbank.className = cls(bank, 10, LIMITS.bank);
      E.gspd.textContent = spd + ' KT'; E.gspd.className = Math.abs(f.v - VAPP) < 6 ? 'ok' : Math.abs(f.v - VAPP) < 12 ? 'warn' : 'bad';
      E.ggear.textContent = f.gear ? 'DOWN' : 'UP'; E.ggear.className = f.gear ? 'ok' : 'bad';
    }
  }
  send(force) {
    const a = this.me, f = a && a.fly; if (!f) return;
    const st = {x: +f.x.toFixed(1), y: +f.y.toFixed(2), z: +f.z.toFixed(1), yaw: +f.yaw.toFixed(3), p: +f.pitch.toFixed(3), r: +f.roll.toFixed(3), v: +f.v.toFixed(1), c: f.c, g: f.gear ? 1 : 0, gr: f.gr ? 1 : 0};
    const k = JSON.stringify(st); if (!force && k === this.last) return; this.last = k;
    try { this.O.api.state && this.O.api.state('fl', st); } catch (e) {}
  }
  remote(a, q) {
    const fl = q && q.fl;
    if (!fl || typeof fl !== 'object') { if (a.fly) { this.group.remove(a.fly.m); a.fly = null; a.root.scale.setScalar(1); a.root.rotation.set(0, a.root.rotation.y, 0); if (!a.wk && a.seat) a.sitNow(); } return; }
    const c = +fl.c | 0;
    if (!a.fly || a.fly.c !== c) {
      if (a.fly) this.group.remove(a.fly.m);
      const m = this.model(c); this.group.add(m);
      a.fly = {m, c, x: +fl.x || 0, y: +fl.y || 0, z: +fl.z || 0, yaw: +fl.yaw || 0, pitch: 0, roll: 0, v: 0, gear: 1, q: new THREE.Quaternion()}; a.wk = null; a.mode = 'fly'; a.sitK = 1; a.root.scale.setScalar(.6);
    }
    const f = a.fly; f.tx = +fl.x || 0; f.ty = +fl.y || 0; f.tz = +fl.z || 0; f.tyaw = +fl.yaw || 0; f.tp = +fl.p || 0; f.tr = +fl.r || 0; f.tv = +fl.v || 0; f.rt = performance.now();
    const g = fl.g === undefined ? 1 : fl.g ? 1 : 0; if (g !== f.gear) { f.gear = g; this.gearVis(f); } f.tgr = fl.gr ? 1 : 0;
  }
  follow(a, dt) {
    const f = a.fly, age = Math.min(.4, (performance.now() - f.rt) / 1000), cp = Math.cos(f.tp);
    const ex = f.tx + Math.sin(f.tyaw) * cp * f.tv * age, ey = f.tgr ? f.ty : f.ty + Math.sin(f.tp) * f.tv * age, ez = f.tz + Math.cos(f.tyaw) * cp * f.tv * age;
    f.x = damp(f.x, ex, 6, dt); f.y = damp(f.y, ey, 6, dt); f.z = damp(f.z, ez, 6, dt);
    let dy = f.tyaw - f.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); f.yaw += dy * Math.min(1, dt * 6); f.pitch = damp(f.pitch, f.tp, 6, dt); f.roll = damp(f.roll, f.tr, 6, dt); f.v = f.tv; f.thr = .5;
    this.place(a, f);
  }
  ringUI() {
    const b = (() => { try { return +localStorage.getItem('owq_ringbest') || 0; } catch (e) { return 0; } })(), lb = (() => { try { return +localStorage.getItem('owq_landbest') || 0; } catch (e) { return 0; } })();
    this.rE.textContent = (this.ri ? 'RING RUN: ' + this.ri + ' / ' + this.rings.length : 'RING RUN: FLY THROUGH THE BLUE RING TO START') + (b ? '  ·  BEST ' + b.toFixed(1) + 's' : '') + (lb ? '  ·  BEST LANDING ' + lb + '/100' : '');
    this.rings.forEach((r, i) => { r.m.material = i === this.ri ? this.nextM() : this.goldM(); });
  }
  nextM() { return this._nm || (this._nm = new THREE.MeshBasicMaterial({color: new THREE.Color(.4, 2.3, 2.7), toneMapped: false})); }
  goldM() { return this._gm || (this._gm = new THREE.MeshBasicMaterial({color: new THREE.Color(3.6, 2.6, .6), toneMapped: false, transparent: true, opacity: .7})); }
  big(t, s, ms) { const e = this.bE; e.innerHTML = t + (s ? '<small>' + s + '</small>' : ''); e.classList.add('on'); clearTimeout(this._bt); this._bt = setTimeout(() => e.classList.remove('on'), ms || 1600); }
  cam(P, T, F0) {
    const a = this.me, f = a && a.fly; if (!f) return 0;
    const d = this.fwd(f, this._c || (this._c = new THREE.Vector3())), back = (f.gr ? 13 : 15) + f.v * .12, up = f.gr ? 3.2 : 4.2;
    P.set(f.x - d.x * back, f.y - d.y * back + up, f.z - d.z * back); T.set(f.x + d.x * 12, f.y + d.y * 12 + 1.2, f.z + d.z * 12);
    return clamp(F0 * 1.2 + (f.v - VAPP) * .2, 48, 80);
  }
  grab() { return !!this.me; }
  leave() { if (this.me) { const a = this.me; if (a.fly) this.group.remove(a.fly.m); a.fly = null; this.me = null; this.ui.classList.remove('on'); try { this.O.api.state && this.O.api.state('fl', null); } catch (e) {} } }
}
