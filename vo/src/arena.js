// OWQ 1V1 SHOWDOWN: a 1v1 shooter on three small maps (Warehouse, Rooftop, Office Blitz), started from the terminal on
// the Firing Range floor, or practice against a bot. It plays like a modern shooter: first person with raw mouse aim
// (pointer lock), sensitivity on the CS:GO scale (0.022 degrees per mouse count times your sensitivity, so your CS:GO
// number feels the same here), Source-style movement (acceleration, friction, air strafing, crouch, walk,
// crouch-jump), a realistic rifle held in gloved hands (30-round magazine, 90 in reserve, a spray pattern you pull down
// against, first-shot accuracy, running and jumping throw shots off, right mouse aims down the red dot), muzzle flash,
// tracers, brass, bullet holes, and head / body / leg zones (a headshot kills). First to five kills. Matchmaking rides
// on the arcade queue (presence 'aq', games 'tagwarehouse' / 'tagrooftop' / 'tagoffice'), the match itself on a private
// arcade room (arcNet): each player sends their own state about eleven times a second and decides their own hits; the
// player who is hit applies the damage.
import * as THREE from 'three';
import {GFX, mat, patch, mbox, NEON, lightPools, glowPoints, textCanvas, canvasTex, mergeGeometries, plain} from './gfx.js';
import {clamp, damp, lerp} from './util.js';
import {ARENAY, RANGEY} from './world.js';
import {FLOORBOX} from './walk.js';
import {Avatar} from './avatar.js';
import {EXT} from './cosm.js';

const TERM = {x: -9.0, z: -6.15};          // the terminal in the Firing Range's back corner (left of lane 1)
const WIN = 5;
const K = {sens: 'owq_tagsens', fov: 'owq_tagfov', inv: 'owq_taginv', rec: 'owq_tagrec', map: 'owq_tagmap', diff: 'owq_tagdiff'};
// player: eye heights, hull half width and heights (metres); movement in Source units converted (1 unit = 2.54 cm)
const EYE = 1.62, EYEC = 1.16, HW = .3, HH = 1.8, HHC = 1.3;
const RUN = 6.35, WALKF = .52, DUCKF = .34, ACC = 5.5, AIRACC = 12, AIRCAP = .76, FRIC = 5.2, STOP = 2.03, JUMP = 7.4, GRAV = 20.3, STEPH = .46;
const GUN = {rate: .1, mag: 30, res: 90, reload: 2.4, head: 100, body: 34, legs: 26, range: 160, name: 'VX-30 RIFLE'};
// the spray pattern: where the n-th shot of a spray goes, in degrees [right, up] from where you aim. It climbs for ten
// shots, swings left, then right, then left again. The view kicks half as far (VIEWK), so the shots land above the
// crosshair the way they do in CS:GO and you pull the mouse down against it. After you let go it settles back (RECOV).
const PAT = [[0, 0], [0, .55], [.05, 1.25], [-.05, 2.05], [.1, 2.9], [.05, 3.7], [-.15, 4.4], [-.45, 5], [-.85, 5.45], [-1.3, 5.75], [-1.7, 5.95], [-1.95, 6.05], [-1.85, 6.15], [-1.4, 6.2], [-.8, 6.25],
  [-.15, 6.3], [.5, 6.3], [1.1, 6.35], [1.6, 6.4], [1.95, 6.45], [2.1, 6.5], [1.9, 6.55], [1.45, 6.6], [.9, 6.6], [.35, 6.65], [-.2, 6.7], [-.7, 6.7], [-1.1, 6.75], [-1.35, 6.75], [-1.45, 6.8]];
const VIEWK = .5, RECOV = 16, TRC = [3.6, 2.7, 1.5];   // tracer colour (warm white)
function patAt(k) { k = clamp(k, 0, PAT.length - 1); const i = Math.floor(k), f = k - i, a = PAT[i], b = PAT[Math.min(PAT.length - 1, i + 1)]; return [lerp(a[0], b[0], f), lerp(a[1], b[1], f)]; }
const AS = 1.3;                             // avatars are drawn 1.3x in the arena (eye height of a grown-up)
const D2R = Math.PI / 180;
const BOTS = {easy: {react: .62, turn: 3.2, err: .07, fire: .045, burst: 3, head: .05, strafe: .6}, normal: {react: .4, turn: 6, err: .04, fire: .026, burst: 5, head: .15, strafe: .8}, hard: {react: .24, turn: 10, err: .02, fire: .014, burst: 8, head: .3, strafe: 1}};

function ls(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
const first = n => String(n || '').split(' ')[0];

// ---------------------------------------------------------------- maps
// A map is a list of boxes [x0,y0,z0]..[x1,y1,z1] in local metres (floor at y 0), each with a surface kind. Flags:
// nb = lasers pass (glass, railings), nc = no collision (decoration), inv = invisible wall. sym() adds a box and its
// mirror through the centre (x,z -> -x,-z), so both sides of every map are the same.
function newMap() {
  const boxes = [], deco = [];
  const box = (x0, y0, z0, x1, y1, z1, k, o = {}) => { const b = Object.assign({a: [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)], b: [Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)], k}, o); boxes.push(b); return b; };
  const sym = (x0, y0, z0, x1, y1, z1, k, o = {}) => { box(x0, y0, z0, x1, y1, z1, k, o); box(-x1, y0, -z1, -x0, y1, -z0, k, o.c2 ? Object.assign({}, o, {c: o.c2}) : o); };
  return {boxes, deco, box, sym};
}

function warehouse() {
  const M = newMap(), {box, sym} = M, X = 22, Z = 15, H = 9;
  box(-X - .4, -.4, -Z - .4, X + .4, 0, Z + .4, 'wfloor');
  box(-X, H, -Z, X, H + .3, Z, 'ceil', {nc: 1, ns: 1});
  box(-X - .4, 0, -Z - .4, X + .4, H, -Z, 'wall', {ns: 1}); box(-X - .4, 0, Z, X + .4, H, Z + .4, 'wall', {ns: 1});
  box(-X - .4, 0, -Z, -X, H, Z, 'wall', {ns: 1}); box(X, 0, -Z, X + .4, H, Z, 'wall', {ns: 1});
  // the centre: two containers with a crate between them, a second container stacked on each, offset
  sym(-3.03, 0, -5.2, 3.03, 2.6, -2.76, 'cont', {c: '#8c1c24'});
  sym(-.1, 2.6, -5.2, 5.96, 5.2, -2.76, 'cont', {c: '#1d4f8a'});
  box(-.6, 0, -.6, .6, 1.2, .6, 'crate');
  // containers near each spawn
  sym(-14, 0, -9, -11.56, 2.6, -2.94, 'cont', {c: '#2e5a3a'});
  sym(-9.5, 0, 8, -3.44, 2.6, 10.44, 'cont', {c: '#b8561c'});
  // crates: a stack of two by each spawn, singles in the lanes
  sym(-17.1, 0, .9, -15.9, 1.2, 2.1, 'crate'); sym(-17.1, 1.2, .9, -15.9, 2.4, 2.1, 'crate'); sym(-15.7, 0, .9, -14.5, 1.2, 2.1, 'crate');
  sym(-8.6, 0, -1.8, -7.4, 1.2, -.6, 'crate'); sym(-6.8, 0, 11.4, -5.6, 1.2, 12.3, 'crate');
  sym(-19.4, 0, -11.4, -18.2, 1.2, -10.2, 'crate');
  // steel columns
  sym(-8.3, 0, -6.8, -7.7, H, -6.2, 'metal'); sym(-8.3, 0, 6.2, -7.7, H, 6.8, 'metal');
  // catwalks along the north and south walls (stairs at the west end of the north one, the east end of the south one)
  sym(-13, 2.8, -Z, 13, 3.0, -12.4, 'grate');
  sym(-13, 3.0, -12.46, -1.4, 4.05, -12.4, 'rail', {nb: 1}); sym(1.4, 3.0, -12.46, 13, 4.05, -12.4, 'rail', {nb: 1});
  sym(12.94, 3.0, -Z, 13, 4.05, -12.4, 'rail', {nb: 1});
  for (const x of [-12.4, -6.2, 0, 6.2, 12.4]) sym(x - .15, 0, -12.7, x + .15, 2.8, -12.4, 'metal');
  for (let i = 0; i < 11; i++) sym(-13 - (i + 1) * .5, 0, -Z, -13 - i * .5, 3.0 - (i + 1) * .25, -13.6, 'grate');
  sym(-18.5, 0, -13.66, -13, 1.1, -13.6, 'rail', {nb: 1, nc: 1});
  // lights and paint
  M.lights = []; [-8, 0, 8].forEach(z => { for (let x = -16; x <= 16; x += 8) M.lights.push([x, H - .25, z]); });
  // amber safety lights along the walls and white LED strips under the catwalks
  M.neon = [[-X + .05, .3, -Z + .05, X - .05, .34, -Z + .09, [1.5, .7, .12]], [-X + .05, .3, Z - .09, X - .05, .34, Z - .05, [1.5, .7, .12]], [-X + .05, .3, -Z, -X + .09, .34, Z, [1.5, .7, .12]], [X - .09, .3, -Z, X - .05, .34, Z, [1.5, .7, .12]],
    [-13, 2.76, -12.42, 13, 2.8, -12.38, [1.7, 1.7, 1.6]], [-13, 2.76, 12.38, 13, 2.8, 12.42, [1.7, 1.7, 1.6]]];
  M.signs = [['DOCK 04', 0, 5.6, -Z + .06, 0, 12, 2.6], ['OWQ', -X + .06, 5.2, 0, Math.PI / 2, 9, 3], ['OWQ', X - .06, 5.2, 0, -Math.PI / 2, 9, 3], ['ONLY WINNERS', 0, 5.6, Z - .06, Math.PI, 16, 2.2]];
  M.spawns = {A: [[-19.6, -5, Math.PI / 2], [-19.6, 5, Math.PI / 2], [-19.6, 0, Math.PI / 2]], B: [[19.6, 5, -Math.PI / 2], [19.6, -5, -Math.PI / 2], [19.6, 0, -Math.PI / 2]]};
  M.bounds = [-X, -Z, X, Z]; M.H = H;
  M.key = {d: [.32, 1, .22], R: 27, i: 2.3, c: '#fff1df', env: 'room', ei: .55, hemi: .55, hc: '#d6dcff', hg: '#2a2228'};
  M.floor = 'warehouse';
  return M;
}

function rooftop() {
  const M = newMap(), {box, sym} = M, X = 21, Z = 17;
  box(-X - .5, -.5, -Z - .5, X + .5, 0, Z + .5, 'roof');
  // parapet with an invisible safety wall above it (nobody falls off)
  box(-X - .5, 0, -Z - .5, X + .5, 1.1, -Z, 'parapet'); box(-X - .5, 0, Z, X + .5, 1.1, Z + .5, 'parapet');
  box(-X - .5, 0, -Z, -X, 1.1, Z, 'parapet'); box(X, 0, -Z, X + .5, 1.1, Z, 'parapet');
  box(-X - .5, 1.1, -Z - .5, X + .5, 8, -Z, 'inv', {inv: 1, nb: 1}); box(-X - .5, 1.1, Z, X + .5, 8, Z + .5, 'inv', {inv: 1, nb: 1});
  box(-X - .5, 1.1, -Z, -X, 8, Z, 'inv', {inv: 1, nb: 1}); box(X, 1.1, -Z, X + .5, 8, Z, 'inv', {inv: 1, nb: 1});
  // stair huts, AC units, solar rows, skylights, barriers, the water tower legs
  sym(-10, 0, 3, -5, 3.2, 7.5, 'hut'); sym(-10.05, 2.3, 7.5, -8.6, 2.4, 7.8, 'metal', {nc: 1});
  sym(-14.5, 0, -10, -11.5, 2.1, -7.8, 'hvac'); sym(-3, 0, -14.2, .2, 1.8, -12.2, 'hvac');
  sym(-9, 0, 11.8, -1, .95, 13.2, 'solar'); sym(-17, 0, -3.5, -15.6, .95, 3.5, 'solar');
  sym(1.5, 0, 4, 4.5, .75, 6.2, 'skyl', {nb: 1});
  sym(-1.6, 0, -1.25, 1.6, 1.05, -.6, 'jersey');
  for (const [lx, lz] of [[13.4, 9.6], [16.4, 9.6], [13.4, 12.6], [16.4, 12.6]]) sym(lx, 0, lz, lx + .3, 6.2, lz + .3, 'metal');
  M.tanks = [[15.05, 6.2, 11.25], [-15.05, 6.2, -11.25]];
  M.lights = [[-12, 4.5, 0], [12, 4.5, 0], [0, 4.5, -10], [0, 4.5, 10], [-8, 4.5, -12], [8, 4.5, 12]];
  M.neon = [[-X - .45, 1.08, -Z - .45, X + .45, 1.12, -Z - .4, [3, .25, .7]], [-X - .45, 1.08, Z + .4, X + .45, 1.12, Z + .45, [3, .25, .7]], [-X - .45, 1.08, -Z, -X - .4, 1.12, Z, [3, .25, .7]], [X + .4, 1.08, -Z, X + .45, 1.12, Z, [3, .25, .7]]];
  M.signs = [['OWQ', -7.5, 2.4, 7.56, 0, 3.6, 1.3], ['OWQ', 7.5, 2.4, -7.56, Math.PI, 3.6, 1.3]];
  M.spawns = {A: [[-18.6, -5, Math.PI / 2], [-18.6, 5, Math.PI / 2], [-18.6, 0, Math.PI / 2]], B: [[18.6, 5, -Math.PI / 2], [18.6, -5, -Math.PI / 2], [18.6, 0, -Math.PI / 2]]};
  M.bounds = [-X, -Z, X, Z]; M.H = 8; M.sky = 1;
  M.key = {d: [-.5, .62, -.6], R: 30, i: 1.6, c: '#cdd6ff', env: 'night', ei: .9, hemi: .5, hc: '#8a7cff', hg: '#2a0f1c'};
  M.floor = 'rooftop';
  return M;
}

function office() {
  const M = newMap(), {box, sym} = M, X = 20, Z = 14, H = 3.4;
  box(-X - .3, -.3, -Z - .3, X + .3, 0, Z + .3, 'ofloor');
  box(-X, H, -Z, X, H + .25, Z, 'oceil', {nc: 1, ns: 1});
  box(-X - .3, 0, -Z - .3, X + .3, H, -Z, 'window', {ns: 1}); box(-X - .3, 0, Z, X + .3, H, Z + .3, 'window', {ns: 1});
  box(-X - .3, 0, -Z, -X, H, Z, 'owall', {ns: 1}); box(X, 0, -Z, X + .3, H, Z, 'owall', {ns: 1});
  // the elevator core in the middle
  box(-3, 0, -2.4, 3, H, 2.4, 'owall');
  // glass meeting rooms in two corners (door on the inside wall), a table in each
  sym(-15, 0, -8.6, -12, H, -8.5, 'glass', {nb: 1}); sym(-10.8, 0, -8.6, -9, H, -8.5, 'glass', {nb: 1}); sym(-9.1, 0, -Z, -9, H, -8.5, 'glass', {nb: 1});
  sym(-13.8, 0, -12.6, -10.4, .76, -10.4, 'desk');
  sym(-15, 0, -8.6, -14.9, H, -8.5, 'metal', {nc: 1});
  // cubicles: two rows of three desks with partitions
  for (const r of [0, 1]) for (const c of [0, 1, 2]) { const x0 = -13 + c * 1.9, z0 = 2.4 + r * 2.6; sym(x0, 0, z0, x0 + 1.6, .76, z0 + .8, 'desk'); }
  sym(-13.1, 0, 3.92, -7.3, 1.25, 4.08, 'part'); sym(-13.1, 0, 2.3, -13, 1.25, 7.9, 'part'); sym(-7.4, 0, 2.3, -7.3, 1.25, 4.0, 'part');
  // server racks and a counter
  for (let i = 0; i < 4; i++) sym(12 + i * 1.1, 0, 9.4, 12.8 + i * 1.1, 2.1, 10.4, 'rack');
  sym(11, 0, 12.6, 17.5, 1.05, 13.4, 'desk');
  // columns, planters, a low wall in the open floor
  sym(-6.3, 0, -8.3, -5.7, H, -7.7, 'col'); sym(5.7, 0, -8.3, 6.3, H, -7.7, 'col');
  sym(-17.6, 0, -1, -16.6, .8, 1, 'planter'); sym(-6.5, 0, -3.6, -4.5, 1.1, -3.3, 'part');
  M.lights = []; for (let x = -16; x <= 16; x += 4) for (let z = -11; z <= 11; z += 5.5) M.lights.push([x, H - .02, z]);
  M.neon = [[-X + .05, .06, -Z + .05, X - .05, .1, -Z + .09, [3, .25, .7]], [-X + .05, .06, Z - .09, X - .05, .1, Z - .05, [3, .25, .7]]];
  M.signs = [['OWQ', 0, 1.9, -2.42, Math.PI, 3.2, 1.1], ['OWQ', 0, 1.9, 2.42, 0, 3.2, 1.1], ['MEASURE WHAT MATTERS', -X + .04, 2.4, 0, Math.PI / 2, 9, .8], ['LEADERS BUILD LEADERS', X - .04, 2.4, 0, -Math.PI / 2, 9, .8]];
  M.spawns = {A: [[-18.4, -5, Math.PI / 2], [-18.4, 5, Math.PI / 2], [-18.4, 0, Math.PI / 2]], B: [[18.4, 5, -Math.PI / 2], [18.4, -5, -Math.PI / 2], [18.4, 0, -Math.PI / 2]]};
  M.bounds = [-X, -Z, X, Z]; M.H = H;
  M.key = {d: [.18, 1, .12], R: 25, i: 1.5, c: '#fff6ea', env: 'room', ei: .7, hemi: .65, hc: '#e6ecff', hg: '#2c2a30'};
  M.floor = 'office';
  return M;
}

export const MAPS = [
  {id: 'warehouse', g: 'tagwarehouse', name: 'WAREHOUSE', sub: 'Containers, crates and two catwalks', o: [0, ARENAY, 0], make: warehouse},
  {id: 'rooftop', g: 'tagrooftop', name: 'ROOFTOP', sub: 'Open air above the city, long sight lines', o: [420, ARENAY, 0], make: rooftop},
  {id: 'office', g: 'tagoffice', name: 'OFFICE BLITZ', sub: 'Cubicles, glass rooms, close quarters', o: [840, ARENAY, 0], make: office},
];
const mapOf = g => MAPS.findIndex(m => m.g === g);

// surfaces (shared across maps)
function kindMat(k) {
  switch (k) {
    case 'wfloor': return patch(mat('polished', {key: 'ar_wf', color: '#45484f', bump: .7, env: .7}), {key: 'ar_wfp', frag: '{float n=vn(vWP.xz*.09,vec2(1e4))*.6+vn(vWP.xz*.37,vec2(1e4))*.4;diffuseColor.rgb*=.78+.4*n;float st=smoothstep(.66,.8,vn(vWP.xz*.21+5.,vec2(1e4)));diffuseColor.rgb*=1.-.3*st;rk=.75+.5*n-.3*st;vec2 j=abs(fract(vWP.xz/6.)-.5);float jt=step(.497,max(j.x,j.y));diffuseColor.rgb*=1.-.35*jt;}'});
    case 'ceil': case 'oceil': return new THREE.MeshStandardMaterial({color: k === 'ceil' ? '#14151a' : '#d8d9de', roughness: .9});
    case 'wall': return mat('corrugated', {key: 'ar_wall', color: '#545a68'});
    case 'cont': return mat('container', {key: 'ar_cont', extra: {vertexColors: true}});
    case 'crate': return mat('wood', {key: 'ar_crate', color: '#c49462', bump: 1.2});
    case 'metal': return mat('metal', {key: 'ar_metal', color: '#3c4049'});
    case 'grate': return mat('metal', {key: 'ar_grate', color: '#2a2d34', bump: 1.4});
    case 'rail': return new THREE.MeshStandardMaterial({color: '#e0b432', roughness: .4, metalness: .6});
    case 'roof': return mat('concrete', {key: 'ar_roof', color: '#7d7f87', bump: 1.2});
    case 'parapet': case 'jersey': return mat('concrete', {key: 'ar_par', color: '#a3a5ad'});
    case 'hut': return mat('concrete', {key: 'ar_hut', color: '#8f929b'});
    case 'hvac': return mat('metal', {key: 'ar_hvac', color: '#a7acb5'});
    case 'solar': return patch(new THREE.MeshStandardMaterial({color: '#0e1a33', roughness: .25, metalness: .4, envMapIntensity: 1.4}), {key: 'ar_solar', frag: '{vec2 g=fract(vWP.xz*1.6);float l=step(.93,max(g.x,g.y));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.55,.58,.65),l);}'});
    case 'skyl': case 'glass': return new THREE.MeshPhysicalMaterial({color: k === 'skyl' ? '#9fc9ff' : '#bcd8ff', roughness: .05, metalness: 0, transparent: true, opacity: k === 'skyl' ? .35 : .16, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide});
    case 'ofloor': return mat('carpet', {key: 'ar_carpet', color: '#9aa2b8'});
    case 'owall': case 'col': return mat('concrete', {key: 'ar_owall', color: '#dcd9d4', bump: .18, noMap: true, rough: .9});
    case 'window': return null;
    case 'desk': return mat('wood', {key: 'ar_desk', color: '#e2c39d'});
    case 'part': return mat('carpet', {key: 'ar_part', color: '#6b7488'});
    case 'rack': return patch(new THREE.MeshStandardMaterial({color: '#15171c', roughness: .4, metalness: .7}), {key: 'ar_rack', uniforms: {uT: {value: 0}}, fragHead: 'uniform float uT;',
      frag: '{vec2 c=floor(vWP.xy*vec2(9.,14.));float b=step(.8,fract(sin(dot(c,vec2(12.9,78.2)))*437.5+uT*.4*fract(c.x*.37)));ek=1.;eC=vec3(.3,2.6,1.4)*b*step(.5,fract(vWP.y*14.))*.8;}'});
    case 'planter': return mat('concrete', {key: 'ar_plant', color: '#3b3d44'});
    default: return new THREE.MeshStandardMaterial({color: '#777'});
  }
}

// ---------------------------------------------------------------- the rifle
// A generic modern rifle (no real make): black receiver, tan handguard and stock, curved polymer magazine, red dot
// sight, muzzle brake. Built from side profiles extruded across the gun with soft bevels. Units are metres, forward is
// -z, the origin is at the trigger. With hands = true it is the first-person model: gloved hands on the grip and the
// handguard, sleeves going out of the picture, the magazine and the left arm as their own parts (they move when you
// reload). Without hands it is the model other people hold (merged by material, one draw call each).
// Returns {g, tip (muzzle), eject (ejection port), dot (the red dot, for aiming down the sight), mag, larm, bolt}.
const RM = {};
function rifleMats() {
  if (RM.black) return RM;
  RM.black = new THREE.MeshStandardMaterial({color: '#1d1e22', roughness: .42, metalness: .55});
  RM.poly = new THREE.MeshStandardMaterial({color: '#25262a', roughness: .74, metalness: 0});
  RM.tan = new THREE.MeshStandardMaterial({color: '#8a7a5c', roughness: .64, metalness: .08});
  RM.steel = new THREE.MeshStandardMaterial({color: '#303236', roughness: .3, metalness: .92});
  RM.dark = new THREE.MeshStandardMaterial({color: '#0b0c0e', roughness: .9, metalness: .2});
  RM.tubeIn = new THREE.MeshStandardMaterial({color: '#1a1b1f', roughness: .5, metalness: .5, side: THREE.DoubleSide});
  RM.glass = new THREE.MeshPhysicalMaterial({color: '#9fb8ff', roughness: .04, metalness: .1, transparent: true, opacity: .22, depthWrite: false});
  RM.dot = NEON(5, .25, .3);
  RM.glove = new THREE.MeshStandardMaterial({color: '#1f2023', roughness: .86, metalness: 0});
  RM.pad = new THREE.MeshStandardMaterial({color: '#34363b', roughness: .66, metalness: .05});
  RM.sleeve = new THREE.MeshStandardMaterial({color: '#3a4134', roughness: .95, metalness: 0});
  RM.brass = new THREE.MeshStandardMaterial({color: '#b88d3e', roughness: .26, metalness: 1});
  return RM;
}
function rifle(hands) {
  // every part is collected per (group, material) and merged at the end (non-indexed so boxes, tubes and profiles mix)
  const R = rifleMats(), g = new THREE.Group(), parts = new Map(), add = (geo, m, into) => { const k = into || g; if (!parts.has(k)) parts.set(k, new Map()); const pm = parts.get(k); if (!pm.has(m)) pm.set(m, []); pm.get(m).push(geo.index ? geo.toNonIndexed() : geo); };
  // a side profile in (forward, up) metres -> a solid of width w centred on x
  const prof = (pts, w, m, bev = .003, x = 0, into) => { const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, {depth: Math.max(.001, w - bev * 2), bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev * .8, bevelSegments: 2, curveSegments: 4});
    geo.translate(0, 0, -(w - bev * 2) / 2); geo.rotateY(Math.PI / 2); geo.translate(x, 0, 0); geo.computeVertexNormals(); add(plain(geo), m, into); };
  const box = (w, h, d, x, y, z, m, into, rx = 0) => { const geo = new THREE.BoxGeometry(w, h, d); if (rx) geo.rotateX(rx); geo.translate(x, y, z); add(plain(geo), m, into); };
  // a cylinder along z from z0 to z1 at height y (open: a sight tube you can look through)
  const tube = (r, z0, z1, y, m, seg = 16, x = 0, into, open) => { const geo = new THREE.CylinderGeometry(r, r, Math.abs(z1 - z0), seg, 1, !!open).rotateX(Math.PI / 2); geo.translate(x, y, (z0 + z1) / 2); add(plain(geo), m, into); };
  const AX = .022;                                        // barrel axis height
  // upper receiver with its flat-top rail, lower receiver and magazine well
  prof([[-.1, -.004], [.19, -.004], [.19, .046], [.182, .052], [-.092, .052], [-.1, .044]], .052, R.black);
  box(.022, .009, .29, 0, .0565, -.045, R.black); for (let k = 0; k < 24; k++) box(.024, .003, .004, 0, .0615, .095 - k * .0122, R.dark);
  prof([[-.085, -.004], [.13, -.004], [.13, -.03], [.105, -.043], [-.02, -.043], [-.05, -.03], [-.085, -.02]], .048, R.black);
  prof([[.05, -.04], [.13, -.04], [.128, -.075], [.052, -.075]], .044, R.black, .003);
  // ejection port and dust cover, forward assist, mag release, bolt catch
  box(.003, .022, .056, .0262, .024, -.048, R.dark); box(.002, .026, .062, .0275, .024, -.048, R.black);
  tube(.0065, 0, .04, .03, R.black, 10, .029); box(.006, .008, .01, .0255, -.018, -.045, R.steel); box(.004, .012, .018, -.0255, -.012, -.02, R.steel);
  // trigger guard and trigger
  box(.012, .004, .052, 0, -.052, -.02, R.black); box(.012, .014, .004, 0, -.047, -.045, R.black);
  { const geo = new THREE.BoxGeometry(.006, .02, .006); geo.rotateX(.35); geo.translate(0, -.04, -.008); add(plain(geo), R.steel); }
  // pistol grip, angled back
  prof([[-.012, -.032], [.034, -.032], [.012, -.132], [-.04, -.14], [-.034, -.06]], .036, R.poly, .006);
  for (let k = 0; k < 5; k++) box(.0372, .0025, .02, 0, -.06 - k * .016, .015 + k * .0045 - .012, R.dark);
  // the curved magazine (its own part: it drops out when you reload)
  const mag = new THREE.Group(); mag.name = 'mag';
  prof([[.125, -.068], [.132, -.11], [.142, -.15], [.154, -.19], [.168, -.214], [.098, -.224], [.085, -.19], [.072, -.15], [.062, -.11], [.055, -.068]], .028, R.poly, .003, 0, mag);
  prof([[.164, -.214], [.172, -.22], [.17, -.232], [.094, -.24], [.092, -.226]], .034, R.poly, .003, 0, mag);
  for (let k = 0; k < 3; k++) prof([[.068 + k * .005, -.12 - k * .03], [.14 + k * .006, -.12 - k * .03], [.141 + k * .006, -.125 - k * .03], [.069 + k * .005, -.125 - k * .03]], .0305, R.dark, 0, 0, mag);
  g.add(mag);
  // handguard: a long octagonal tube with slots, its top rail, a folded front sight
  { const geo = new THREE.CylinderGeometry(.031, .031, .33, 8).rotateZ(Math.PI / 8).rotateX(Math.PI / 2); geo.translate(0, AX, -.355); add(plain(geo), R.tan); }
  box(.02, .008, .31, 0, .057, -.355, R.tan); for (let k = 0; k < 24; k++) box(.022, .003, .004, 0, .0615, -.205 - k * .0125, R.dark);
  for (const sx of [-1, 1]) for (let k = 0; k < 6; k++) { box(.003, .011, .03, sx * .0288, AX, -.23 - k * .05, R.dark); box(.003, .011, .03, sx * .0205, AX - .0205, -.23 - k * .05, R.dark); }
  box(.014, .013, .02, 0, .068, -.49, R.black);
  // barrel, gas block, muzzle brake with ports
  tube(.0085, -.52, -.67, AX, R.steel, 14); box(.022, .02, .022, 0, AX - .004, -.55, R.black);
  tube(.0128, -.66, -.718, AX, R.steel, 16); for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) box(.004, .012, .009, sx * .0115, AX + .002, -.672 - k * .016, R.dark);
  tube(.0075, -.716, -.719, AX, R.dark, 12);
  // buffer tube, stock and butt pad, charging handle (moves when you reload)
  tube(.0145, .1, .3, AX, R.black, 14);
  prof([[-.235, .05], [-.355, .052], [-.37, .04], [-.37, -.05], [-.33, -.056], [-.3, -.006], [-.235, .002]], .04, R.tan, .005);
  prof([[-.37, .045], [-.385, .045], [-.385, -.055], [-.37, -.052]], .044, R.poly, .004);
  const bolt = new THREE.Group(); bolt.name = 'bolt'; box(.062, .008, .012, 0, .051, .096, R.black, bolt); box(.012, .007, .03, 0, .051, .08, R.black, bolt); g.add(bolt);
  box(.012, .012, .016, 0, .066, .08, R.black);      // folded rear sight
  // red dot sight on a mount: tube, lens rings, tinted glass, the dot
  box(.028, .012, .055, 0, .068, -.045, R.black); box(.012, .01, .03, .016, .07, -.045, R.black);
  tube(.0195, -.01, -.085, .094, R.tubeIn, 20, 0, null, 1); tube(.021, -.008, -.016, .094, R.steel, 20, 0, null, 1); tube(.021, -.08, -.088, .094, R.steel, 20, 0, null, 1);
  box(.012, .014, .02, .022, .094, -.048, R.black); box(.014, .012, .018, 0, .115, -.05, R.black);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(.0175, 20), R.glass); lens.position.set(0, .094, -.02); g.add(lens);
  const lens2 = lens.clone(); lens2.position.z = -.08; g.add(lens2);
  const dot = new THREE.Mesh(new THREE.CircleGeometry(.0016, 10), R.dot); dot.position.set(0, .094, -.075); g.add(dot);
  // gloved hands and sleeves (first person only)
  let larm = null;
  if (hands) {
    const cap = (r, a, b, m, into) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B), geo = new THREE.CapsuleGeometry(r, Math.max(.001, L), 4, 10);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); geo.applyQuaternion(q); geo.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2); add(plain(geo), m, into); };
    const rbox = (w, h, d, x, y, z, rx, m, into) => { const geo = new THREE.BoxGeometry(w, h, d, 2, 2, 2), P = geo.getAttribute('position'), v = new THREE.Vector3();
      for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const n = v.clone().divide(new THREE.Vector3(w / 2, h / 2, d / 2)); v.multiplyScalar(1 - .12 * (Math.abs(n.x) * Math.abs(n.y) + Math.abs(n.y) * Math.abs(n.z) + Math.abs(n.x) * Math.abs(n.z)) / 3); P.setXYZ(i, v.x, v.y, v.z); }
      geo.computeVertexNormals(); if (rx) geo.rotateX(rx); geo.translate(x, y, z); add(plain(geo), m, into); };
    // right hand around the grip: back of the hand, three fingers round the front, the index finger on the trigger, the thumb over the top
    rbox(.058, .08, .034, .002, -.082, .046, -.3, R.glove); rbox(.05, .03, .02, .002, -.06, .066, -.3, R.pad);
    for (let k = 0; k < 3; k++) { const y = -.072 - k * .021, z = -.036 - (y + .072) * .45; cap(.0108, [-.021, y, z + .006], [.024, y, z - .004], R.glove); }
    cap(.0092, [.02, -.046, .006], [.006, -.05, -.026], R.glove); cap(.0098, [-.026, -.03, .03], [-.027, -.022, -.008], R.glove);
    cap(.031, [.004, -.11, .07], [.07, -.2, .25], R.glove); cap(.045, [.05, -.17, .2], [.15, -.33, .5], R.sleeve);
    // left arm (its own part): palm under the handguard, fingers up the left side, thumb on the right
    larm = new THREE.Group(); larm.name = 'larm';
    rbox(.054, .03, .08, -.004, -.024, -.36, 0, R.glove, larm); rbox(.04, .012, .05, -.004, -.04, -.36, 0, R.pad, larm);
    for (let k = 0; k < 4; k++) cap(.0098, [-.03, -.026, -.326 - k * .022], [-.034, .016, -.33 - k * .022], R.glove, larm);
    cap(.0102, [.026, -.02, -.33], [.032, .004, -.388], R.glove, larm);
    cap(.031, [-.012, -.04, -.33], [-.12, -.18, -.12], R.glove, larm); cap(.045, [-.08, -.12, -.2], [-.24, -.36, .05], R.sleeve, larm);
    g.add(larm);
  }
  parts.forEach((pm, into) => pm.forEach((geos, m) => { const geo = mergeGeometries(geos); if (geo) into.add(new THREE.Mesh(geo, m)); }));
  return {g, tip: new THREE.Vector3(0, AX, -.722), eject: new THREE.Vector3(.03, .026, -.05), dot: new THREE.Vector3(0, .094, -.075), mag, larm, bolt};
}
// muzzle flash (a star burst), bullet hole and brass: shared textures and geometry
const FX = {};
function flashTex() {
  if (FX.flash) return FX.flash;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext && c.getContext('2d'); if (!x) return null;
  x.translate(64, 64); const g = x.createRadialGradient(0, 0, 0, 0, 0, 40); g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(.25, 'rgba(255,226,150,.95)'); g.addColorStop(.6, 'rgba(255,150,50,.5)'); g.addColorStop(1, 'rgba(255,90,20,0)');
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, 40, 0, 6.283); x.fill();
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + (i % 2) * .2, L = i % 2 ? 46 : 62; x.save(); x.rotate(a); const gg = x.createLinearGradient(0, 0, L, 0); gg.addColorStop(0, 'rgba(255,240,200,.95)'); gg.addColorStop(1, 'rgba(255,130,40,0)'); x.fillStyle = gg; x.beginPath(); x.moveTo(0, -7); x.lineTo(L, 0); x.lineTo(0, 7); x.closePath(); x.fill(); x.restore(); }
  return (FX.flash = canvasTex(c));
}
function holeTex() {
  if (FX.hole) return FX.hole;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext && c.getContext('2d'); if (!x) return null;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(8,8,9,1)'); g.addColorStop(.2, 'rgba(14,13,13,1)'); g.addColorStop(.32, 'rgba(40,38,36,.85)'); g.addColorStop(.62, 'rgba(70,66,60,.35)'); g.addColorStop(1, 'rgba(70,66,60,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); x.strokeStyle = 'rgba(20,19,18,.7)'; x.lineWidth = 1.4;
  for (let i = 0; i < 6; i++) { const a = Math.random() * 6.283, r0 = 7, r1 = 13 + Math.random() * 12; x.beginPath(); x.moveTo(32 + Math.cos(a) * r0, 32 + Math.sin(a) * r0); x.lineTo(32 + Math.cos(a + .2) * r1 * .6, 32 + Math.sin(a + .2) * r1 * .6); x.lineTo(32 + Math.cos(a) * r1, 32 + Math.sin(a) * r1); x.stroke(); }
  return (FX.hole = canvasTex(c));
}
// what a bullet does to each kind of surface: sparks, dust colour, splinters
const SURF = {metal: 'm', grate: 'm', rail: 'm', hvac: 'm', cont: 'm', rack: 'm', wall: 'm', solar: 'm', crate: 'w', desk: 'w', ofloor: 'f', part: 'f', planter: 'c'};

// city at night seen through the office windows (a canvas)
function windowTex() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#0a0718'); g.addColorStop(.7, '#2a0c22'); g.addColorStop(1, '#3a1220'); x.fillStyle = g; x.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 70; i++) { const w = 18 + Math.random() * 46, h = 40 + Math.random() * 190, bx = Math.random() * 1024; x.fillStyle = '#07060c'; x.fillRect(bx, 256 - h, w, h);
    for (let yy = 256 - h + 6; yy < 250; yy += 9) for (let xx = bx + 3; xx < bx + w - 4; xx += 7) if (Math.random() < .45) { x.fillStyle = Math.random() < .8 ? 'rgba(255,200,130,.85)' : 'rgba(150,200,255,.85)'; x.fillRect(xx, yy, 3, 4); } }
  return canvasTex(c);
}

// ---------------------------------------------------------------- geometry of a map
function buildMap(def, scene) {
  const M = def.make(), G = new THREE.Group(); G.name = 'arena:' + def.id; G.position.set(def.o[0], def.o[1], def.o[2]); G.visible = false; scene.add(G);
  const byKind = {};
  M.boxes.forEach(b => { if (b.inv) return; (byKind[b.k] = byKind[b.k] || []).push(b); });
  const col = new THREE.Color();
  Object.entries(byKind).forEach(([k, list]) => {
    const geos = list.map(b => {
      const w = b.b[0] - b.a[0], h = b.b[1] - b.a[1], d = b.b[2] - b.a[2], us = k === 'crate' ? 1.2 : k === 'cont' ? 2.5 : k === 'wall' ? 4 : k === 'desk' ? 1.6 : 2;
      const g = mbox(w, h, d, us); g.translate((b.a[0] + b.b[0]) / 2, (b.a[1] + b.b[1]) / 2, (b.a[2] + b.b[2]) / 2);
      if (k === 'cont') { col.set(b.c || '#8c1c24'); const n = g.getAttribute('position').count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) col.toArray(a, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
      return g;
    });
    const geo = mergeGeometries(geos);
    let m = kindMat(k);
    if (k === 'window') { m = new THREE.MeshBasicMaterial({map: windowTex(), toneMapped: false, color: new THREE.Color(1.3, 1.3, 1.3)}); }
    const mesh = new THREE.Mesh(geo, m); mesh.receiveShadow = true; mesh.castShadow = !list[0].ns && k !== 'glass' && k !== 'skyl' && k !== 'rail'; G.add(mesh);
  });
  // container frames (corner posts, top and bottom rails, the locking bars on the doors) and crate edges
  { const fr = [], ce = [];
    (byKind.cont || []).forEach(b => { const w = b.b[0] - b.a[0], h = b.b[1] - b.a[1], d = b.b[2] - b.a[2], cx = (b.a[0] + b.b[0]) / 2, cy = (b.a[1] + b.b[1]) / 2, cz = (b.a[2] + b.b[2]) / 2, lx = w >= d;
      const B = (sx, sy, sz, x, y, z) => fr.push(plain(new THREE.BoxGeometry(sx, sy, sz)).translate(x, y, z));
      for (const ix of [-1, 1]) for (const iz of [-1, 1]) B(.16, h, .16, cx + ix * (w / 2 - .06), cy, cz + iz * (d / 2 - .06));
      for (const iy of [-1, 1]) for (const s2 of [-1, 1]) { if (lx) B(w - .2, .13, .1, cx, cy + iy * (h / 2 - .065), cz + s2 * (d / 2 - .03)); else B(.1, .13, d - .2, cx + s2 * (w / 2 - .03), cy + iy * (h / 2 - .065), cz); }
      for (const e of [-1, 1]) for (let k = 0; k < 4; k++) { const f = -.33 + k * .22; if (lx) fr.push(plain(new THREE.CylinderGeometry(.028, .028, h * .86, 8)).translate(cx + e * (w / 2 + .015), cy, cz + f * d)); else fr.push(plain(new THREE.CylinderGeometry(.028, .028, h * .86, 8)).translate(cx + f * w, cy, cz + e * (d / 2 + .015))); }
      for (let k = 1; k < 10; k++) { const t = -.5 + k / 10; if (lx) { B(.05, h - .3, .03, cx + t * w, cy, cz - d / 2 - .012); B(.05, h - .3, .03, cx + t * w, cy, cz + d / 2 + .012); } else { B(.03, h - .3, .05, cx - w / 2 - .012, cy, cz + t * d); B(.03, h - .3, .05, cx + w / 2 + .012, cy, cz + t * d); } }
    });
    (byKind.crate || []).forEach(b => { const w = b.b[0] - b.a[0], h = b.b[1] - b.a[1], d = b.b[2] - b.a[2], cx = (b.a[0] + b.b[0]) / 2, cy = (b.a[1] + b.b[1]) / 2, cz = (b.a[2] + b.b[2]) / 2, t = .075;
      for (const iy of [-1, 1]) for (const s2 of [-1, 1]) { ce.push(plain(new THREE.BoxGeometry(w + .02, t, t)).translate(cx, cy + iy * (h / 2 - t / 2), cz + s2 * (d / 2 - t / 2 + .012))); ce.push(plain(new THREE.BoxGeometry(t, t, d + .02)).translate(cx + s2 * (w / 2 - t / 2 + .012), cy + iy * (h / 2 - t / 2), cz)); }
      for (const ix of [-1, 1]) for (const iz of [-1, 1]) ce.push(plain(new THREE.BoxGeometry(t, h, t)).translate(cx + ix * (w / 2 - t / 2 + .012), cy, cz + iz * (d / 2 - t / 2 + .012)));
      for (const s2 of [-1, 1]) { const dg = plain(new THREE.BoxGeometry(t * .9, Math.hypot(w, h) - .1, .05)); dg.rotateZ(Math.atan2(w, h) * s2); dg.translate(cx, cy, cz + s2 * (d / 2 + .02)); ce.push(dg); } });
    if (fr.length) { const m = new THREE.Mesh(mergeGeometries(fr), mat('metal', {key: 'ar_cframe', color: '#2b2d33', bump: .8})); m.castShadow = true; m.receiveShadow = true; G.add(m); }
    if (ce.length) { const m = new THREE.Mesh(mergeGeometries(ce), mat('wood', {key: 'ar_cratetrim', color: '#8f6238', bump: 1.1})); m.castShadow = true; m.receiveShadow = true; G.add(m); } }
  // ceiling lights (glowing panels + pools of light on the floor)
  if (M.lights && M.lights.length) {
    const indoor = !M.sky, pg = [];
    M.lights.forEach(([x, y, z]) => { pg.push(indoor ? plain(new THREE.BoxGeometry(def.id === 'office' ? 1.2 : 5.2, .06, def.id === 'office' ? .6 : .5)).translate(x, y - .03, z) : plain(new THREE.BoxGeometry(.5, .3, .5)).translate(x, y, z)); });
    G.add(new THREE.Mesh(mergeGeometries(pg), def.id === 'office' ? NEON(2.3, 2.25, 2.1) : NEON(3.2, 3.05, 2.8)));
    if (!indoor) { const posts = M.lights.map(([x, y, z]) => plain(new THREE.CylinderGeometry(.08, .1, y, 8)).translate(x, y / 2, z)); const pm = new THREE.Mesh(mergeGeometries(posts), kindMat('metal')); pm.castShadow = true; G.add(pm); }
    lightPools(G, M.lights.map(([x, y, z]) => [x, .02, z, indoor ? (def.id === 'office' ? 3.2 : 7.5) : 9, ...(def.id === 'warehouse' ? [.14, .13, .11] : [.22, .2, .17])]));
    glowPoints(G, M.lights.map(([x, y, z]) => [x, y - .1, z, indoor ? (def.id === 'office' ? .7 : 1.2) : 1.6, 1.4, 1.3, 1.15]));
  }
  (M.neon || []).forEach(([x0, y0, z0, x1, y1, z1, c]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), NEON(c[0], c[1], c[2])); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); G.add(m); });
  (M.signs || []).forEach(([txt, x, y, z, ry, w, h]) => {
    const sm = new THREE.MeshBasicMaterial({map: canvasTex(textCanvas(txt, 1024, Math.round(1024 * h / w), {col: '#fff0f6', glow: '#ff2d78'})), transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(2.2, 2.2, 2.2)});
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), sm); m.position.set(x, y, z); m.rotation.y = ry; G.add(m);
  });
  // floor paint: team spawn zones (crimson west, cyan east), lane lines, the agency mark in the middle
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(M.bounds[2] - M.bounds[0], M.bounds[3] - M.bounds[1]).rotateX(-Math.PI / 2), paintMat(M));
  fl.position.y = .006; fl.renderOrder = 1; G.add(fl);
  if (M.tanks) M.tanks.forEach(([x, y, z]) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 3.4, 20), kindMat('hvac')); t.position.set(x, y + 1.7, z); t.castShadow = true; G.add(t); const r = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1, 20), kindMat('metal')); r.position.set(x, y + 3.9, z); G.add(r); });
  if (M.sky) skyline(G, def);
  // collision lists
  M.C = M.boxes.filter(b => !b.nc && b.k !== 'ceil' && b.k !== 'oceil');
  M.R = M.boxes.filter(b => !b.nb && !b.inv);
  M.def = def; M.G = G; M.nav = navGrid(M);
  return M;
}

function paintMat(M) {
  const m = new THREE.MeshBasicMaterial({color: '#ffffff', transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2});
  const X = M.bounds[2], Z = M.bounds[3], wh = M.floor === 'warehouse';
  m.onBeforeCompile = s => {
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvP=position.xz;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vP;').replace('vec4 diffuseColor = vec4( diffuse, opacity );', `vec4 diffuseColor=vec4(0.);
      {vec2 p=vP;float X=${X.toFixed(2)},Z=${Z.toFixed(2)};
       float spA=step(p.x,-X+5.)*step(-X+4.85,p.x)+step(p.x,-X+5.)*(1.-step(-X+4.85,p.x))*step(.5,fract((p.x+p.y)*1.2))*.18;
       float spB=step(X-5.,p.x)*step(p.x,X-4.85)+step(X-5.,p.x)*(1.-step(p.x,X-4.85))*step(.5,fract((p.x-p.y)*1.2))*.18;
       diffuseColor+=vec4(2.6,.25,.6,1.)*spA*.9+vec4(.3,2.,2.6,1.)*spB*.9;
       ${wh ? 'float ln=step(abs(abs(p.y)-8.6),.06)*step(abs(p.x),16.);diffuseColor+=vec4(1.6,1.2,.15,1.)*ln*.7;float c=length(p);float rg=step(abs(c-3.2),.08)+step(abs(c-3.6),.03);diffuseColor+=vec4(2.6,.25,.6,1.)*rg*.7;' : ''}
       ${M.floor === 'rooftop' ? 'float c=length(p);float rg=step(abs(c-6.),.12);float H=step(abs(p.x),1.6)*step(abs(p.y),2.4)*(step(1.,abs(p.x))+step(abs(p.y),.3));diffuseColor+=vec4(1.6,1.5,1.3,1.)*clamp(rg+H,0.,1.)*.6;' : ''}
      }`);
  };
  m.customProgramCacheKey = () => 'arpaint:' + M.floor;
  return m;
}

// the rooftop's city: a dome with stars and the moon, and towers all around at every height, windows lit
function skyline(G, def) {
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), new THREE.ShaderMaterial({side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 vD;float h(vec3 p){return fract(sin(dot(p,vec3(12.9,78.2,37.7)))*43758.5);}void main(){float y=vD.y;vec3 c=mix(vec3(.24,.05,.13),vec3(.012,.01,.035),smoothstep(-.05,.5,y));c+=vec3(.3,.07,.14)*exp(-abs(y+.02)*10.);vec3 q=floor(vD*420.);float s=step(.9965,h(q))*smoothstep(.05,.3,y);c+=vec3(.9,.92,1.)*s;vec3 md=normalize(vec3(-.42,.5,-.75));float mo=max(0.,dot(vD,md));c+=vec3(1.,.95,.88)*(smoothstep(.9993,.9996,mo)*2.5+pow(mo,60.)*.25);gl_FragColor=vec4(c,1.);}'}));
  dome.renderOrder = -10; dome.frustumCulled = false; G.add(dome);
  const N = 240, geo = new THREE.BoxGeometry(1, 1, 1).translate(0, .5, 0), m = new THREE.ShaderMaterial({uniforms: {uFog: {value: new THREE.Color('#1a0a18')}},
    vertexShader: 'varying vec3 vW;varying vec3 vN;varying vec3 vO;varying vec3 vC;void main(){\n#ifdef USE_INSTANCING\nmat4 m=modelMatrix*instanceMatrix;\n#else\nmat4 m=modelMatrix;\n#endif\n#ifdef USE_INSTANCING_COLOR\nvC=instanceColor;\n#else\nvC=vec3(.2,.12,.22);\n#endif\nvec4 w=m*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(m)*normal);vO=(m*vec4(0.,0.,0.,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader: 'uniform vec3 uFog;varying vec3 vW;varying vec3 vN;varying vec3 vO;varying vec3 vC;float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}void main(){vec3 N=normalize(vN);vec3 col=vec3(.02,.02,.03)+vC*.03;if(N.y<.5){vec2 f=abs(N.x)>.5?vec2(vW.z,vW.y):vec2(vW.x,vW.y);vec2 g=f/vec2(3.2,3.7);vec2 id=floor(g);vec2 fr=fract(g);float win=step(.18,fr.x)*step(fr.x,.82)*step(.22,fr.y)*step(fr.y,.8);float lit=step(.55,h1(id+vO.xz*.07));float wm=h1(id*1.7+5.);vec3 wc=mix(vec3(1.,.72,.42),vec3(.62,.8,1.),step(.72,wm));vec2 fw=fwidth(g);float far=smoothstep(.3,.85,max(fw.x,fw.y));col+=mix(win*lit*wc*(.8+.6*h1(id+9.)),vec3(.36,.28,.2),far);}float d=length(cameraPosition-vW);col=mix(col,uFog,smoothstep(150.,1300.,d)*.85);gl_FragColor=vec4(col,1.);}'});
  const im = new THREE.InstancedMesh(geo, m, N), M4 = new THREE.Matrix4(), C = new THREE.Color(), pal = ['#2a3a6a', '#3a2550', '#1f3f4a', '#4a2030', '#2b2b3b', '#5a1a32'];
  let r = 7; const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
  for (let i = 0; i < N; i++) { const a = rnd() * Math.PI * 2, d = 70 + Math.pow(rnd(), .7) * 650, w = 18 + rnd() * 30, dd = 18 + rnd() * 30, top = -60 + Math.pow(rnd(), 1.4) * 200 * (d < 160 ? .5 : 1);
    M4.makeScale(w, top + 320, dd); M4.setPosition(Math.cos(a) * d, -320, Math.sin(a) * d); im.setMatrixAt(i, M4); C.set(pal[i % pal.length]); im.setColorAt(i, C); }
  im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.frustumCulled = false; G.add(im);
  // the building under the roof, and red beacons on the tall ones
  const under = new THREE.Mesh(new THREE.BoxGeometry(43, 320, 35).translate(0, -160.5, 0), m.clone()); G.add(under);
  glowPoints(G, [[0, 0, 0, 0, 0, 0, 0]].slice(0, 0).concat(Array.from({length: 24}, (_, i) => { const a = i / 24 * 6.283 + .3, d = 160 + (i % 5) * 90; return [Math.cos(a) * d, 60 + (i % 4) * 30, Math.sin(a) * d, 4, 4, .25, .3]; })), {blink: .6});
}

// walkable cells (1 m) on the ground floor for the bot's paths
function navGrid(M) {
  const [x0, z0, x1, z1] = M.bounds, S = 1, nx = Math.floor((x1 - x0) / S), nz = Math.floor((z1 - z0) / S), ok = new Uint8Array(nx * nz);
  const block = M.C.filter(b => b.b[1] > STEPH + .02 && b.a[1] < HH);
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const cx = x0 + (i + .5) * S, cz = z0 + (j + .5) * S; let free = true;
    for (const b of block) if (cx + HW + .25 > b.a[0] && cx - HW - .25 < b.b[0] && cz + HW + .25 > b.a[2] && cz - HW - .25 < b.b[2]) { free = false; break; } ok[i * nz + j] = free ? 1 : 0; }
  return {x0, z0, S, nx, nz, ok};
}
function navCell(N, x, z) { return [clamp(Math.floor((x - N.x0) / N.S), 0, N.nx - 1), clamp(Math.floor((z - N.z0) / N.S), 0, N.nz - 1)]; }
function navPath(N, from, to) {
  const [si, sj] = navCell(N, from.x, from.z), [ti, tj] = navCell(N, to.x, to.z), nz = N.nz, key = (i, j) => i * nz + j;
  if (!N.ok[key(ti, tj)]) return null;
  const g = new Float32Array(N.nx * nz).fill(1e9), came = new Int32Array(N.nx * nz).fill(-1), open = [[0, si, sj]], done = new Uint8Array(N.nx * nz);
  g[key(si, sj)] = 0; let it = 0;
  while (open.length && it++ < 4000) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k; const [, i, j] = open.splice(bi, 1)[0], kk = key(i, j); if (done[kk]) continue; done[kk] = 1;
    if (i === ti && j === tj) break;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { if (!di && !dj) continue; const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= N.nx || b >= nz) continue; const k2 = key(a, b); if (!N.ok[k2] || done[k2]) continue;
      if (di && dj && (!N.ok[key(i + di, j)] || !N.ok[key(i, j + dj)])) continue; const c = g[kk] + (di && dj ? 1.414 : 1); if (c < g[k2]) { g[k2] = c; came[k2] = kk; open.push([c + Math.hypot(ti - a, tj - b), a, b]); } }
  }
  if (came[key(ti, tj)] < 0 && !(si === ti && sj === tj)) return null;
  const pts = []; let k = key(ti, tj); while (k >= 0) { const i = Math.floor(k / nz), j = k % nz; pts.push({x: N.x0 + (i + .5) * N.S, z: N.z0 + (j + .5) * N.S}); k = came[k]; }
  pts.reverse();
  // straighten: skip points while the straight line stays on walkable cells
  const line = (a, b) => { const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / (N.S * .5)); for (let q = 1; q < n; q++) { const [ci, cj] = navCell(N, lerp(a.x, b.x, q / n), lerp(a.z, b.z, q / n)); if (!N.ok[key(ci, cj)]) return false; } return true; };
  const out = [pts[0]]; let a = 0; for (let b = 2; b < pts.length; b++) if (!line(pts[a], pts[b])) { out.push(pts[b - 1]); a = b - 1; } out.push(pts[pts.length - 1]);
  return out;
}

// ---------------------------------------------------------------- physics
function overlaps(b, x, y, z, hh) { return x + HW > b.a[0] && x - HW < b.b[0] && z + HW > b.a[2] && z - HW < b.b[2] && y + hh > b.a[1] && y < b.b[1]; }
function freeAt(M, x, y, z, hh) { for (const b of M.C) if (overlaps(b, x, y, z, hh)) return false; return true; }
// move a body (feet position P, velocity V) through the map's boxes one axis at a time, stepping up small ledges
function slide(M, B, dt) {
  const P = B.p, V = B.v, hh = B.hh, wasG = B.g;
  const y0 = P.y; P.y += V.y * dt; B.g = 0;
  for (const b of M.C) if (overlaps(b, P.x, P.y, P.z, hh)) {
    if (y0 >= b.b[1] - .03) { P.y = b.b[1]; if (V.y < 0) V.y = 0; B.g = 1; }
    else if (y0 + hh <= b.a[1] + .03) { P.y = b.a[1] - hh; if (V.y > 0) V.y = 0; }
  }
  // standing still exactly on a surface still counts as standing (a probe just under the feet)
  if (!B.g && V.y <= 0) for (const b of M.C) if (b.b[1] <= P.y + .002 && b.b[1] >= P.y - .03 && overlaps(b, P.x, P.y - .03, P.z, hh)) { P.y = b.b[1]; V.y = 0; B.g = 1; break; }
  for (const ax of [0, 2]) {
    const k = ax === 0 ? 'x' : 'z', v0 = P[k]; P[k] += V[k] * dt;
    for (const b of M.C) if (overlaps(b, P.x, P.y, P.z, hh)) {
      const rise = b.b[1] - P.y;
      if ((wasG || B.g) && rise > 0 && rise <= STEPH && freeAt(M, P.x, b.b[1] + .001, P.z, hh)) { P.y = b.b[1]; B.g = 1; B.stepT = .1; continue; }
      if (V[k] > 0 && v0 + HW <= b.a[ax] + .03) P[k] = b.a[ax] - HW - 1e-4;
      else if (V[k] < 0 && v0 - HW >= b.b[ax] - .03) P[k] = b.b[ax] + HW + 1e-4;
      else continue;
      V[k] = 0;
    }
  }
}
// laser vs the map's boxes: distance and face normal of the nearest hit
function rayMap(M, o, d, tmax) {
  let best = tmax, nb = null, bk = '';
  for (const b of M.R) {
    let t0 = 0, t1 = best, na = -1;
    for (let a = 0; a < 3; a++) {
      const k = a === 0 ? 'x' : a === 1 ? 'y' : 'z', inv = 1 / (d[k] || 1e-9); let tn = (b.a[a] - o[k]) * inv, tf = (b.b[a] - o[k]) * inv; if (tn > tf) { const q = tn; tn = tf; tf = q; }
      if (tn > t0) { t0 = tn; na = a; } if (tf < t1) t1 = tf; if (t0 > t1) { t0 = -1; break; }
    }
    if (t0 > 0 && t0 < best) { best = t0; nb = na; bk = b.k; }
  }
  const n = new THREE.Vector3(); if (nb >= 0 && nb !== null) { const k = nb === 0 ? 'x' : nb === 1 ? 'y' : 'z'; n[k] = d[k] > 0 ? -1 : 1; }
  return {t: best, n, hit: nb !== null, k: bk};
}
// hit zones of a player standing at feet (x,y,z) with crouch c (0..1): head sphere, body and legs as vertical cylinders
function zones(x, y, z, c) {
  const hy = lerp(1.5, 1.04, c), bt = lerp(1.24, .86, c), lt = lerp(.62, .44, c);
  return [{k: 'head', s: [x, y + hy, z, .31]}, {k: 'body', c: [x, z, .34, y + lt, y + bt]}, {k: 'legs', c: [x, z, .28, y, y + lt]}];
}
function rayZones(o, d, Z) {
  let best = null;
  for (const q of Z) {
    let t = null;
    if (q.s) { const [cx, cy, cz, r] = q.s, ox = o.x - cx, oy = o.y - cy, oz = o.z - cz, b = ox * d.x + oy * d.y + oz * d.z, c = ox * ox + oy * oy + oz * oz - r * r, h = b * b - c; if (h >= 0) { const tt = -b - Math.sqrt(h); if (tt > 0) t = tt; } }
    else { const [cx, cz, r, y0, y1] = q.c, ox = o.x - cx, oz = o.z - cz, A = d.x * d.x + d.z * d.z, B = ox * d.x + oz * d.z, C = ox * ox + oz * oz - r * r, h = B * B - A * C;
      if (A > 1e-8 && h >= 0) { const tt = (-B - Math.sqrt(h)) / A; if (tt > 0) { const yy = o.y + d.y * tt; if (yy >= y0 && yy <= y1) t = tt; } } }
    if (t !== null && (!best || t < best.t)) best = {t, k: q.k};
  }
  return best;
}
const dirOf = (yaw, pitch, v) => v.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
// for the unit tests (vo/test/arena_test.mjs)
export const ARTEST = {warehouse, rooftop, office, rayMap, rayZones, zones, slide, freeAt, navGrid, navPath, dirOf, patAt, GUN, PAT, SURF};

// ---------------------------------------------------------------- styling
const CSS = `.vo3ar{position:absolute;inset:0;pointer-events:none;z-index:6;display:none;font-family:Verdana,sans-serif}.vo3ar.on{display:block}
.vo3arx{position:absolute;left:50%;top:50%;width:0;height:0}.vo3arx i{position:absolute;background:#3dff9a;box-shadow:0 0 0 1px rgba(0,0,0,.75)}
.vo3arx .t,.vo3arx .b{width:2px;height:7px;left:-1px}.vo3arx .l,.vo3arx .r{height:2px;width:7px;top:-1px}.vo3arx .d{width:2px;height:2px;left:-1px;top:-1px}
.vo3arhm{position:absolute;left:50%;top:50%;width:26px;height:26px;margin:-13px 0 0 -13px;opacity:0;transition:opacity .12s}.vo3arhm.on{opacity:1;transition:none}
.vo3arhm:before,.vo3arhm:after{content:'';position:absolute;left:50%;top:-3px;width:2px;height:32px;margin-left:-1px;background:linear-gradient(#fff 0 9px,transparent 9px 23px,#fff 23px)}.vo3arhm:before{transform:rotate(45deg)}.vo3arhm:after{transform:rotate(-45deg)}
.vo3arhm.k:before,.vo3arhm.k:after{background:linear-gradient(#ff1f4f 0 10px,transparent 10px 22px,#ff1f4f 22px)}
.vo3artop{position:absolute;top:14px;left:50%;transform:translateX(-50%);display:flex;align-items:stretch;gap:0;border-radius:12px;overflow:hidden;background:rgba(8,5,10,.78);border:1px solid rgba(255,255,255,.12);box-shadow:0 6px 26px rgba(0,0,0,.45)}
.vo3artop div{padding:6px 16px;text-align:center}.vo3artop b{display:block;font:900 24px Verdana,sans-serif;color:#fff}.vo3artop small{display:block;font:800 9px Verdana,sans-serif;letter-spacing:.16em;color:#b9a3ad;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vo3artop .a{border-bottom:3px solid #ff1f4f}.vo3artop .b{border-bottom:3px solid #4cc9f0}.vo3artop .m{padding:6px 12px;font:800 9px Verdana,sans-serif;letter-spacing:.14em;color:#ffd166;display:flex;flex-direction:column;justify-content:center;border-left:1px solid rgba(255,255,255,.08);border-right:1px solid rgba(255,255,255,.08)}
.vo3arhp{position:absolute;left:22px;bottom:96px;min-width:190px;padding:10px 14px;border-radius:12px;background:rgba(8,5,10,.72);border:1px solid rgba(255,255,255,.1)}
.vo3arhp b{font:900 30px Verdana,sans-serif;color:#fff}.vo3arhp small{font:800 9px Verdana,sans-serif;letter-spacing:.18em;color:#d8e9d0;margin-left:8px}.vo3arhp .ic{display:inline-block;width:22px;font:900 22px Verdana,sans-serif;color:#e8f3e1;margin-right:6px;vertical-align:4px}
.vo3arhp .bar{height:6px;border-radius:3px;background:rgba(255,255,255,.1);margin-top:6px;overflow:hidden}.vo3arhp .bar i{display:block;height:100%;background:linear-gradient(90deg,#9ccf7e,#e6f5d8);transition:width .15s}
.vo3arhp.low .bar i{background:linear-gradient(90deg,#ff1f4f,#ff7a90)}.vo3arhp.low b,.vo3arhp.low .ic{color:#ff5470}
.vo3aram{position:absolute;right:22px;bottom:96px;padding:10px 16px;border-radius:12px;background:rgba(8,5,10,.72);border:1px solid rgba(255,255,255,.1);text-align:right}
.vo3aram b{font:900 30px Verdana,sans-serif;color:#fff}.vo3aram span{font:800 14px Verdana,sans-serif;color:#b9a3ad}.vo3aram small{display:flex;align-items:center;justify-content:flex-end;gap:8px;font:800 9px Verdana,sans-serif;letter-spacing:.18em;color:#ffd166;margin-top:2px}.vo3aram small svg{width:46px;height:13px;color:#e9e3d8}.vo3aram em{font-style:normal}.vo3aram.low b{color:#ff5470}
.vo3arkf{position:absolute;top:70px;right:16px;display:flex;flex-direction:column;gap:5px;align-items:flex-end}
.vo3arkf div{padding:5px 10px;border-radius:8px;background:rgba(8,5,10,.72);border:1px solid rgba(255,255,255,.1);font:800 11px Verdana,sans-serif;letter-spacing:.06em;color:#fff;animation:vo3arin .2s}
.vo3arkf div{display:flex;align-items:center;gap:6px}.vo3arkf div.me{border-color:#ff1f4f}.vo3arkf em{display:inline-flex;align-items:center;gap:4px;font-style:normal;color:#ffd166;margin:0 4px}.vo3arkf svg{height:12px;color:#fff}.vo3arkf svg.hs{height:13px;color:#ff5470}
@keyframes vo3arin{from{transform:translateX(30px);opacity:0}}
.vo3arbig{position:absolute;top:30%;left:50%;transform:translate(-50%,-50%);text-align:center;font:900 44px Verdana,sans-serif;letter-spacing:.08em;color:#fff;text-shadow:0 0 26px #ff1f4f,0 3px 14px #000;white-space:nowrap;opacity:0;transition:opacity .2s}.vo3arbig.on{opacity:1}
.vo3arbig small{display:block;font:800 15px Verdana,sans-serif;letter-spacing:.2em;color:#ffd166;margin-top:6px;text-shadow:0 2px 8px #000}
.vo3ardmg{position:absolute;left:50%;top:50%;width:180px;height:180px;margin:-90px 0 0 -90px;border-radius:50%;opacity:0;transition:opacity .5s;background:conic-gradient(from -18deg,rgba(255,31,79,.85) 0 36deg,transparent 36deg);-webkit-mask:radial-gradient(circle,transparent 72px,#000 74px,#000 82px,transparent 84px);mask:radial-gradient(circle,transparent 72px,#000 74px,#000 82px,transparent 84px)}.vo3ardmg.on{opacity:1;transition:none}
.vo3arred{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 45%,rgba(190,10,30,.48));opacity:0;transition:opacity .4s}.vo3arred.on{opacity:1;transition:none}
.vo3arlow{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 55%,rgba(150,0,20,.38));opacity:0;transition:opacity .6s}.vo3arlow.on{opacity:1;animation:vo3arpulse 1.1s infinite}@keyframes vo3arpulse{50%{opacity:.55}}
.vo3ardead{position:absolute;inset:0;opacity:0;transition:opacity .5s;-webkit-backdrop-filter:grayscale(.85) brightness(.8);backdrop-filter:grayscale(.85) brightness(.8);background:rgba(40,0,6,.18)}.vo3ardead.on{opacity:1}
.vo3arsb{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);min-width:360px;padding:18px 22px;border-radius:16px;background:rgba(8,5,10,.9);border:1px solid rgba(255,31,79,.45);display:none}.vo3arsb.on{display:block}
.vo3arsb h3{margin:0 0 12px;font:900 13px Verdana,sans-serif;letter-spacing:.2em;color:#fff}.vo3arsb table{width:100%;border-collapse:collapse;font:800 12px Verdana,sans-serif;color:#fff}.vo3arsb td,.vo3arsb th{padding:7px 6px;text-align:right}.vo3arsb th{font-size:9px;letter-spacing:.16em;color:#b9a3ad}.vo3arsb td:first-child,.vo3arsb th:first-child{text-align:left}
.vo3arov{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(5,2,8,.6);pointer-events:auto;z-index:8}.vo3arov.on{display:flex}
.vo3arp{width:min(560px,92%);max-height:88%;overflow:auto;padding:22px;border-radius:20px;background:linear-gradient(160deg,#1a1018,#0a070c);border:1px solid rgba(255,31,79,.5);box-shadow:0 0 50px rgba(255,31,79,.25);color:#fff}
.vo3arp h2{margin:0;font:900 18px Verdana,sans-serif;letter-spacing:.22em}.vo3arp h2 span{color:#ff1f4f}.vo3arp>p{margin:6px 0 14px;font:700 10px Verdana,sans-serif;letter-spacing:.06em;color:#b9a3ad;line-height:1.6}
.vo3arp h4{margin:16px 0 8px;font:900 10px Verdana,sans-serif;letter-spacing:.2em;color:#ffb3c2}
.vo3armaps{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.vo3armaps button{padding:12px 10px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#fff;text-align:left;cursor:pointer;font:900 11px Verdana,sans-serif;letter-spacing:.1em;min-height:70px}
.vo3armaps button small{display:block;margin-top:6px;font:700 9px Verdana,sans-serif;letter-spacing:.02em;color:#b9a3ad;line-height:1.4}.vo3armaps button.on{border-color:#ff1f4f;background:rgba(255,31,79,.16);box-shadow:0 0 18px rgba(255,31,79,.25)}
.vo3arrow{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.vo3arb{padding:11px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#fff;font:900 11px Verdana,sans-serif;letter-spacing:.12em;cursor:pointer}
.vo3arb.p{background:#ff1f4f;border-color:#ff1f4f}.vo3arb.g{background:rgba(61,220,151,.18);border-color:#3ddc97;color:#bff7de}.vo3arb.on{border-color:#ffd166;color:#ffd166}.vo3arb:disabled{opacity:.45;cursor:default}
.vo3arppl{display:flex;flex-direction:column;gap:6px}.vo3arppl div{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.04);font:800 11px Verdana,sans-serif;letter-spacing:.06em}
.vo3arppl em{font-style:normal;color:#8ef0c2;font-size:9px;letter-spacing:.12em;margin-left:8px}.vo3armut{font:700 10px Verdana,sans-serif;color:#8d7f88}
.vo3arset{display:grid;grid-template-columns:120px 1fr 64px;gap:10px;align-items:center;font:800 10px Verdana,sans-serif;letter-spacing:.12em;color:#ffd0da}
.vo3archk{grid-column:span 2;display:flex;align-items:center;gap:10px;cursor:pointer}.vo3archk input{width:16px;height:16px;margin:0;accent-color:#ff1f4f}
.vo3arseg{display:inline-flex;border:1px solid rgba(255,255,255,.16);border-radius:12px;overflow:hidden}.vo3arseg button{padding:11px 12px;border:0;border-left:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#cdb9c2;font:900 10px Verdana,sans-serif;letter-spacing:.12em;cursor:pointer}.vo3arseg button:first-child{border-left:0}.vo3arseg button.on{background:rgba(255,209,102,.16);color:#ffd166}
.vo3arset input[type=range]{width:100%;accent-color:#ff1f4f}.vo3arset input[type=number]{width:60px;padding:5px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:#0b080d;color:#fff;font:800 12px Verdana,sans-serif}
.vo3arstat{margin-top:12px;padding:10px 12px;border-radius:12px;background:rgba(255,209,102,.08);border:1px solid rgba(255,209,102,.3);font:800 11px Verdana,sans-serif;letter-spacing:.08em;color:#ffd166;display:none}.vo3arstat.on{display:block}
.vo3arinv{position:absolute;top:70px;left:50%;transform:translateX(-50%);z-index:9;pointer-events:auto;display:none;padding:14px 18px;border-radius:16px;background:rgba(12,6,12,.94);border:1px solid #ff1f4f;box-shadow:0 0 36px rgba(255,31,79,.35);color:#fff;text-align:center;font:800 11px Verdana,sans-serif;letter-spacing:.1em}.vo3arinv.on{display:block}
.vo3arinv b{display:block;font:900 15px Verdana,sans-serif;letter-spacing:.14em;margin-bottom:4px}.vo3arinv .vo3arrow{justify-content:center;margin-top:10px}
.vo3arclick{position:absolute;left:50%;top:58%;transform:translateX(-50%);padding:12px 20px;border-radius:999px;background:rgba(8,5,10,.85);border:1px solid #ff1f4f;font:900 12px Verdana,sans-serif;letter-spacing:.16em;color:#fff;display:none}.vo3arclick.on{display:block}
.vo3artch{position:absolute;inset:0;display:none;pointer-events:none}.vo3artch.on{display:block}.vo3artch button{position:absolute;pointer-events:auto;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(12,6,12,.55);color:#fff;font:900 11px Verdana,sans-serif;letter-spacing:.08em;touch-action:none}
.vo3artch .f{right:26px;bottom:150px;width:86px;height:86px;background:rgba(255,31,79,.55)}.vo3artch .j{right:124px;bottom:120px;width:58px;height:58px}.vo3artch .c{right:26px;bottom:250px;width:58px;height:58px}.vo3artch .r{right:104px;bottom:210px;width:52px;height:52px}
.vo3artch .stick{position:absolute;left:30px;bottom:110px;width:120px;height:120px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(12,6,12,.35)}.vo3artch .stick i{position:absolute;left:40px;top:40px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.35)}
.vo3arkey{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);font:700 9px Verdana,sans-serif;letter-spacing:.12em;color:rgba(255,255,255,.55);white-space:nowrap}
.vo3nar .vo3arkey{display:none}`;

// ---------------------------------------------------------------- the arena
const ICON = {rifle: '<svg viewBox="0 0 64 18" aria-hidden=true><path fill="currentColor" d="M1 6h3l1-2h26l2-2h9v2h4l1 2h16v3H50l-1 2h-4l-1 2h-5l1 4h-5l-2-4h-4l-3 3h-6l2-4H9l-1 2H1z"/></svg>',
  hs: '<svg class=hs viewBox="0 0 16 16" aria-hidden=true><circle cx="8" cy="8" r="4.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 0v4.5M8 11.5V16M0 8h4.5M11.5 8H16" stroke="currentColor" stroke-width="2"/></svg>'};
export class Arena {
  constructor(O) {
    this.O = O; this.maps = []; this.match = null; this.mp = null; this.keys = {}; this.locked = false; this.firing = false; this.inv = null; this.dis = {}; this.pollT = 0;
    this.sens = clamp(+ls(K.sens, 2) || 2, .05, 20); this.fov = clamp(+ls(K.fov, 74) || 74, 55, 100); this.invY = ls(K.inv, '0') === '1';
    this.mapI = clamp(+ls(K.map, 0) | 0, 0, MAPS.length - 1); this.diff = ls(K.diff, 'normal'); if (!BOTS[this.diff]) this.diff = 'normal';
    this.v = new THREE.Vector3(); this.v2 = new THREE.Vector3(); this.v3 = new THREE.Vector3();
    if (!document.getElementById('vo3arcss')) { const s = document.createElement('style'); s.id = 'vo3arcss'; s.textContent = CSS; document.head.appendChild(s); }
    this.buildTerminal();
    this.buildUI();
    this.bindInput();
  }
  // ---------- the terminal on the range floor
  buildTerminal() {
    const O = this.O, G = this.term = new THREE.Group(); G.position.set(TERM.x, RANGEY, TERM.z); O.room.group.add(G);
    const body = new THREE.MeshPhysicalMaterial({color: '#16141b', roughness: .3, metalness: .7, clearcoat: .6});
    const base = new THREE.Mesh(new THREE.BoxGeometry(.7, 1.1, .5), body); base.position.y = .55; G.add(base);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.9, .62, .12), body); head.position.set(0, 1.45, .05); head.rotation.x = -.25; G.add(head);
    const c = textCanvas('1V1 SHOWDOWN', 512, 300, {bg: '#0b0610', col: '#ffffff', glow: '#ff1f4f', size: 64});
    const x = c.getContext('2d'); x.font = '800 26px Verdana,sans-serif'; x.fillStyle = '#ffd166'; x.textAlign = 'center'; x.fillText('PRESS E TO PLAY', 256, 236); x.fillStyle = '#ff1f4f'; x.fillRect(0, 0, 512, 8); x.fillRect(0, 292, 512, 8);
    this.termScr = new THREE.Mesh(new THREE.PlaneGeometry(.8, .5), new THREE.MeshBasicMaterial({map: canvasTex(c), toneMapped: false, color: new THREE.Color(1.6, 1.6, 1.6)}));
    this.termScr.position.set(0, 1.45, .115); this.termScr.rotation.x = -.25; G.add(this.termScr);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(.72, .04, .52), NEON(3.2, .3, .8)); strip.position.y = 1.08; G.add(strip);
    G.rotation.y = Math.PI / 2;                // faces into the room (+x)
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(4.2, .9), new THREE.MeshBasicMaterial({map: canvasTex(textCanvas('1V1 SHOWDOWN', 1024, 220, {col: '#fff0f6', glow: '#ff2d78'})), transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(2.2, 2.2, 2.2)}));
    sg.position.set(-9.98, RANGEY + 3.5, -5.1); sg.rotation.y = Math.PI / 2; O.room.group.add(sg);
    FLOORBOX.g.push([TERM.x - .3, TERM.z - .4, TERM.x + .3, TERM.z + .4]);
  }
  walkPrompt(a) {
    const w = a.wk; if (!w || w.f !== 'g' || this.match) return null;
    if (Math.hypot(w.x - TERM.x, w.z - TERM.z) < 1.5) return {k: 'lasertag', t: '1V1 SHOWDOWN'};
    return null;
  }
  walkUse(p) { if (p.k === 'lasertag') { this.menu(true); return true; } return null; }
  // ---------- the lobby menu, the invite popup and the in-game HUD
  buildUI() {
    const O = this.O, u = this.ui = document.createElement('div'); u.className = 'vo3ar';
    u.innerHTML = `<div class=vo3ardead></div><div class=vo3arlow></div><div class=vo3arred></div><div class=vo3ardmg></div><div class=vo3arx><i class=t></i><i class=b></i><i class=l></i><i class=r></i><i class=d></i></div><div class=vo3arhm></div>
      <div class=vo3artop><div class=a><b>0</b><small>YOU</small></div><div class=m><span class=mn>NEON WAREHOUSE</span><span>FIRST TO ${WIN}</span></div><div class=b><b>0</b><small>THEM</small></div></div>
      <div class=vo3arhp><span class=ic>&#10010;</span><b>100</b><small>HEALTH</small><div class=bar><i style="width:100%"></i></div></div><div class=vo3aram><b>${GUN.mag}</b><span> / ${GUN.res}</span><small><em class=wn>${GUN.name}</em>${ICON.rifle}</small></div>
      <div class=vo3arkf></div><div class=vo3arbig></div><div class=vo3arsb></div><div class=vo3arclick>CLICK TO PLAY</div>
      <div class=vo3artch><div class=stick><i></i></div><button class=f>FIRE</button><button class=j>JUMP</button><button class=c>DUCK</button><button class=r>R</button></div>
      <div class=vo3arkey>MOUSE aim &middot; LEFT fire &middot; RIGHT aim down the sight &middot; WASD move &middot; SPACE jump &middot; C crouch &middot; SHIFT walk &middot; R reload &middot; TAB score &middot; ESC menu</div>`;
    O.el.appendChild(u);
    const q = s => u.querySelector(s);
    this.E = {red: q('.vo3arred'), dmg: q('.vo3ardmg'), x: q('.vo3arx'), xt: q('.vo3arx .t'), xb: q('.vo3arx .b'), xl: q('.vo3arx .l'), xr: q('.vo3arx .r'), hm: q('.vo3arhm'), sa: q('.vo3artop .a b'), sb: q('.vo3artop .b b'), na: q('.vo3artop .a small'), nb: q('.vo3artop .b small'), mn: q('.vo3artop .mn'),
      hp: q('.vo3arhp'), hpb: q('.vo3arhp b'), hpi: q('.vo3arhp .bar i'), am: q('.vo3aram b'), amk: q('.vo3aram .wn'), amr: q('.vo3aram span'), amb: q('.vo3aram'), dead: q('.vo3ardead'), low: q('.vo3arlow'), kf: q('.vo3arkf'), big: q('.vo3arbig'), sb2: q('.vo3arsb'), click: q('.vo3arclick'), tch: q('.vo3artch')};
    // menu overlay
    const ov = this.ov = document.createElement('div'); ov.className = 'vo3arov'; O.el.appendChild(ov);
    ov.addEventListener('pointerdown', e => { e.stopPropagation(); if (e.target === ov && !this.match) this.menu(false); });
    ['keydown', 'wheel'].forEach(ev => ov.addEventListener(ev, e => e.stopPropagation()));
    // invite popup
    const iv = this.ivE = document.createElement('div'); iv.className = 'vo3arinv'; O.el.appendChild(iv);
    iv.addEventListener('pointerdown', e => e.stopPropagation());
    this.touch = (globalThis.matchMedia && matchMedia('(pointer: coarse)').matches) || false;
  }
  menu(on, page) {
    if (!on) { this.ov.classList.remove('on'); this.menuOn = 0; return; }
    this.menuOn = 1; this.page = page || (this.match ? 'pause' : 'lobby'); this.renderMenu(); this.ov.classList.add('on'); this.O.sfx('click');
    if (this.locked) try { document.exitPointerLock(); } catch (e) {}
  }
  renderMenu() {
    const O = this.O, me = this.myId(), M = this.match, rec = this.record();
    const set = `<h4>AIM SETTINGS</h4><div class=vo3arset><span>SENSITIVITY</span><input type=range min=.1 max=8 step=.05 value="${this.sens}" data-s=sens><input type=number min=.05 max=20 step=.05 value="${this.sens}" data-n=sens>
      <span>FIELD OF VIEW</span><input type=range min=60 max=100 step=1 value="${this.fov}" data-s=fov><input type=number min=55 max=100 step=1 value="${this.fov}" data-n=fov>
      <span>INVERT MOUSE</span><label class=vo3archk><input type=checkbox ${this.invY ? 'checked' : ''} data-v=inv><span class=vo3armut>pull back to look up</span></label></div>
      <p class=vo3armut style="margin:8px 0 0">Sensitivity uses the CS:GO scale: type the same number you use in CS:GO and it turns the same distance per inch of mouse. 1.5 to 3 suits most players.</p>`;
    let h = '';
    if (this.page === 'pause' && M) {
      h = `<h2>1V1 <span>SHOWDOWN</span></h2><p>${MAPS[M.mi].name} &middot; ${first(this.myName())} ${M.score[0]} : ${M.score[1]} ${first(M.oppName)}</p>
        <div class=vo3arrow><button class="vo3arb p" data-a=resume>RESUME</button><button class=vo3arb data-a=quit>LEAVE MATCH</button></div>${set}`;
    } else {
      const ppl = []; O.av.forEach(a => { if (!a.me && !a.bot && !a.leaving) ppl.push(a); });
      const qd = this.mp && this.mp.st !== 'game' ? this.mp : null;
      const waiting = this.peers().filter(p => !p.me && p.aq && /^tag/.test(p.aq.g) && p.aq.st === 'w' && !p.aq.to);
      h = `<h2>1V1 <span>SHOWDOWN</span></h2><p>First to ${WIN} kills wins. A ${GUN.mag}-round rifle with real recoil: the first shot goes where you aim, a spray climbs, so tap or pull down. Headshots kill in one. Raw mouse aim like CS:GO: click the floor to lock the mouse, ESC to let go, right mouse to aim down the sight.</p>
        <h4>MAP</h4><div class=vo3armaps>${MAPS.map((m, i) => `<button data-m=${i} class="${i === this.mapI ? 'on' : ''}">${m.name}<small>${m.sub}</small></button>`).join('')}</div>
        <h4>PLAY</h4><div class=vo3arrow><button class="vo3arb p" data-a=find ${qd ? 'disabled' : ''}>FIND A MATCH</button><button class="vo3arb g" data-a=bot ${qd ? 'disabled' : ''}>PRACTICE VS BOT</button><div class=vo3arseg title="How good the bot is">${['easy', 'normal', 'hard'].map(d => `<button class="${d === this.diff ? 'on' : ''}" data-d=${d}>${d.toUpperCase()}</button>`).join('')}</div></div>
        <div class="vo3arstat ${qd ? 'on' : ''}">${qd ? (qd.st === 'w' ? (qd.to ? 'CHALLENGE SENT TO ' + first(qd.them).toUpperCase() + ' &middot; ' + MAPS[Math.max(0, mapOf(qd.g))].name : 'LOOKING FOR AN OPPONENT ON ' + MAPS[Math.max(0, mapOf(qd.g))].name + '...') : qd.st === 'j' ? 'JOINING ' + first(qd.them).toUpperCase() + '...' : 'CONNECTING...') + ' &nbsp;<button class=vo3arb data-a=cancel>CANCEL</button>' : ''}</div>
        ${waiting.length ? `<h4>WAITING FOR A MATCH</h4><div class=vo3arppl>${waiting.map(p => `<div>${String(p.nm).toUpperCase()}<em>${MAPS[Math.max(0, mapOf(p.aq.g))].name}</em><button class=vo3arb data-j="${p.id}" ${qd ? 'disabled' : ''}>PLAY</button></div>`).join('')}</div>` : ''}
        <h4>CHALLENGE A TEAMMATE</h4><div class=vo3arppl>${ppl.length ? ppl.map(a => `<div>${String(a.nm).toUpperCase()}<button class=vo3arb data-c="${a.id}" ${qd ? 'disabled' : ''}>CHALLENGE</button></div>`).join('') : '<span class=vo3armut>Nobody else is on the floor right now. Practice against the bot, or queue and wait for a teammate.</span>'}</div>
        ${set}<p class=vo3armut style="margin-top:14px">RECORD ${rec.w} W &middot; ${rec.l} L &nbsp;&middot;&nbsp; BEST STREAK ${rec.s}</p>
        <div class=vo3arrow style="margin-top:12px"><button class=vo3arb data-a=close>CLOSE</button></div>`;
    }
    this.ov.innerHTML = `<div class=vo3arp>${h}</div>`;
    const P = this.ov.firstChild;
    P.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { this.mapI = +b.dataset.m; lsSet(K.map, this.mapI); this.renderMenu(); });
    P.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { this.diff = b.dataset.d; lsSet(K.diff, this.diff); this.renderMenu(); });
    P.querySelectorAll('[data-c]').forEach(b => b.onclick = () => this.challenge(b.dataset.c));
    P.querySelectorAll('[data-j]').forEach(b => b.onclick = () => { const p = this.peers().find(x => x.id === b.dataset.j); if (p) this.joinQ(p); });
    P.querySelectorAll('[data-s]').forEach(r => r.oninput = () => this.setOpt(r.dataset.s, +r.value));
    P.querySelectorAll('[data-n]').forEach(r => r.onchange = () => this.setOpt(r.dataset.n, +r.value));
    P.querySelectorAll('[data-v=inv]').forEach(c => c.onchange = () => { this.invY = c.checked; lsSet(K.inv, this.invY ? 1 : 0); });
    P.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
      const k = b.dataset.a;
      if (k === 'close') this.menu(false); else if (k === 'find') this.find(); else if (k === 'bot') this.startBot(); else if (k === 'cancel') { this.cancelQ(); this.renderMenu(); }
      else if (k === 'resume') { this.menu(false); this.lock(); } else if (k === 'quit') { this.leave(true); }
    });
  }
  setOpt(k, v) {
    if (k === 'sens') { this.sens = clamp(v || 2, .05, 20); lsSet(K.sens, this.sens); }
    if (k === 'fov') { this.fov = clamp(Math.round(v) || 74, 55, 100); lsSet(K.fov, this.fov); }
    this.ov.querySelectorAll(`[data-s=${k}],[data-n=${k}]`).forEach(e => { if (document.activeElement !== e) e.value = k === 'sens' ? this.sens : this.fov; });
  }
  record() { try { const r = JSON.parse(ls(K.rec, '{}')) || {}; return {w: r.w | 0, l: r.l | 0, s: r.s | 0, c: r.c | 0}; } catch (e) { return {w: 0, l: 0, s: 0, c: 0}; } }
  // ---------- matchmaking (the arcade queue)
  api(n, ...a) { try { const f = this.O.api && this.O.api[n]; return f ? f.apply(this.O.api, a) : undefined; } catch (e) { return undefined; } }
  now() { const v = this.api('now'); return typeof v === 'number' && isFinite(v) ? v : Date.now(); }
  peers() { const v = this.api('arcPeers'); return Array.isArray(v) ? v : []; }
  myId() { const p = this.peers().find(x => x.me); return p ? p.id : (this.O.meAv && this.O.meAv.id) || ''; }
  myName() { return (this.O.meAv && this.O.meAv.nm) || 'You'; }
  setQ(q) { this.api('arcQ', q); }
  find() { const g = MAPS[this.mapI].g, t = this.now(); this.mp = {g, st: 'w', t, since: this.O.t}; this.setQ({g, st: 'w', t}); this.O.sfx('click'); this.renderMenu(); }
  challenge(id) {
    const a = this.O.av.get(id), g = MAPS[this.mapI].g, t = this.now(); if (!a) return;
    this.mp = {g, st: 'w', t, to: id, them: a.nm, since: this.O.t}; this.setQ({g, st: 'w', t, to: id}); this.O.sfx('click');
    this.O.ui.toast('Challenge sent to ' + first(a.nm) + '. Waiting for them to accept.'); this.renderMenu();
  }
  joinQ(p) { const t = this.now(); this.mp = {g: p.aq.g, st: 'j', t, to: p.id, them: p.nm, jT: this.O.t, since: this.O.t}; this.setQ({g: p.aq.g, st: 'j', t, to: p.id}); this.inv = null; this.ivE.classList.remove('on'); if (this.menuOn) this.renderMenu(); }
  cancelQ() {
    const m = this.mp; this.mp = null;
    if (m && m.N) { try { m.N.send({bye: 1}); } catch (e) {} setTimeout(() => { try { m.N.leave(); } catch (e) {} }, 300); }
    this.setQ(null);
  }
  mmTick() {
    const m = this.mp, O = this.O; if (!m || m.st === 'game') return;
    if (m.st === 'conn') {
      if (m.N && m.N.peer()) { m.st = 'game'; this.setQ(null); this.begin({mi: mapOf(m.g), host: m.role === 'h', N: m.N, oppId: m.to, oppName: m.them}); return; }
      if (O.t - m.cT > 14) { O.ui.toast((m.them ? first(m.them) : 'Your opponent') + ' did not connect.'); this.cancelQ(); if (this.menuOn) this.renderMenu(); }
      return;
    }
    const P = this.peers(), me = this.myId(); if (!me) return;
    const same = P.filter(p => !p.me && p.aq && p.aq.g === m.g);
    if (m.st === 'w') {
      if (m.to && this.now() - m.t > 60000) { O.ui.toast('No answer from ' + first(m.them) + '.'); this.cancelQ(); if (this.menuOn) this.renderMenu(); return; }
      const j = same.filter(p => p.aq.st === 'j' && p.aq.to === me && (!m.to || p.id === m.to)).sort((x, y) => x.aq.t - y.aq.t)[0];
      if (j) { const mid = ('t' + me + 'x' + Math.round(m.t)).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40); Object.assign(m, {st: 'p', to: j.id, mid, role: 'h', them: j.nm}); this.setQ({g: m.g, st: 'p', t: m.t, to: j.id, mid}); this.connect(); return; }
      if (!m.to) { const w = same.filter(p => p.aq.st === 'w' && !p.aq.to && (p.aq.t < m.t || (p.aq.t === m.t && p.id < me))).sort((x, y) => x.aq.t - y.aq.t)[0]; if (w) { this.joinQ(w); return; } }
    } else if (m.st === 'j') {
      const h = P.find(p => p.id === m.to);
      if (h && h.aq && h.aq.st === 'p' && h.aq.to === me && h.aq.mid) { Object.assign(m, {st: 'p', mid: String(h.aq.mid), role: 'g', them: h.nm}); this.connect(); return; }
      if (!h || !h.aq || h.aq.g !== m.g || (h.aq.st === 'p' && h.aq.to !== me) || O.t - m.jT > 10) { O.ui.toast((h ? first(h.nm) : 'They') + ' is playing someone else.'); this.cancelQ(); if (this.menuOn) this.renderMenu(); }
    }
  }
  async connect() {
    const m = this.mp; if (!m) return; m.st = 'conn'; m.cT = this.O.t; if (this.menuOn) this.renderMenu();
    let N = null; try { N = await this.api('arcNet', m.mid); } catch (e) { N = null; }
    if (this.mp !== m) { try { N && N.leave(); } catch (e) {} return; }
    if (!N) { this.O.ui.toast('Could not open the match. Try again.'); this.cancelQ(); return; }
    m.N = N;
  }
  // challenges for me (shown anywhere on the floor)
  invTick() {
    const ot = this.O.t || 0; if (ot - (this.pollT || -9) < .35 && ot >= (this.pollT || -9)) return; this.pollT = ot;   // about three times a second, however fast the frames come
    const me = this.myId(), now = this.now();
    const inv = this.match || (this.mp && this.mp.st !== 'w') ? null : this.peers().filter(p => !p.me && p.aq && /^tag/.test(p.aq.g) && p.aq.st === 'w' && p.aq.to === me && now - (+p.aq.t || 0) < 60000 && !this.dis[p.id + ':' + p.aq.t]).sort((a, b) => b.aq.t - a.aq.t)[0] || null;
    const k = inv ? inv.id + ':' + inv.aq.t : '';
    if (k !== this._ik) {
      this._ik = k; this.inv = inv;
      if (!inv) { this.ivE.classList.remove('on'); return; }
      const mi = Math.max(0, mapOf(inv.aq.g));
      this.ivE.innerHTML = `<b>${String(inv.nm).toUpperCase()} CHALLENGES YOU</b>1V1 SHOWDOWN &middot; ${MAPS[mi].name} &middot; FIRST TO ${WIN}<div class=vo3arrow><button class="vo3arb p" data-a=y>ACCEPT</button><button class=vo3arb data-a=n>NOT NOW</button></div>`;
      this.ivE.querySelector('[data-a=y]').onclick = () => { const p = this.inv; if (!p) return; if (this.mp) this.cancelQ(); this.joinQ(p); this.O.ui.toast('Joining ' + first(p.nm) + '...'); };
      this.ivE.querySelector('[data-a=n]').onclick = () => { this.dis[k] = 1; this.inv = null; this._ik = ''; this.ivE.classList.remove('on'); };
      this.ivE.classList.add('on'); this.O.sfx('ding');
    }
  }
  // ---------- a match
  ensureMap(mi) { if (!this.maps[mi]) { const M = this.maps[mi] = buildMap(MAPS[mi], this.O.scene); try { M.G.visible = true; this.O.r.compileAsync(M.G, this.O.cam, this.O.scene).catch(() => {}); } catch (e) {} M.G.visible = false; } return this.maps[mi]; }
  startBot() {
    this.cancelQ(); const bot = this.mkBot();
    this.begin({mi: this.mapI, host: true, bot, oppName: bot.nm, oppId: 'bot'});
  }
  begin(o) {
    const O = this.O, a = O.meAv; if (!a) return;
    this.menu(false); this.ivE.classList.remove('on');
    // stop whatever else I was doing
    try { if (O.drive && O.drive.me) O.drive.stop(); } catch (e) {}
    try { O.sys.forEach(s => { if (s !== this && s.leave) s.leave(); }); } catch (e) {}
    const w = a.wk; this.back = w ? {x: w.x, z: w.z, y: w.y, f: w.f} : null;
    if (O.walk.me === a) { O.walk.me = null; O.walk.ui.classList.remove('on'); O.walk.prE.classList.remove('on'); O.walk.closeElev && O.walk.closeElev(); try { O.api.walk && O.api.walk(null); } catch (e) {} }
    a.wk = null; a.mv = 0; a.ar = 1; a.mode = 'free'; a.sitK = 0; a.standK = 0; a.path = null; a.root.visible = false; a.noTag = 1;
    const desk = a.seat && O.room.desks[a.seat.i]; if (desk && desk.av === a) desk.occ = 0;
    const M = this.ensureMap(o.mi); this.maps.forEach(m => { if (m) m.G.visible = m === M; });
    O.wld && O.wld.arena && O.wld.arena(Object.assign({f: [M.def.o[0], M.def.o[1] + 2, M.def.o[2]]}, M.key));
    const me = {p: new THREE.Vector3(), v: new THREE.Vector3(), g: 1, hh: HH, c: 0, duck: 0, yaw: 0, pitch: 0, hp: 100, al: 1, d: 0, ammo: GUN.mag, res: GUN.res, rl: 0, next: 0, burst: 0, prot: 0, sh: 0, se: null, hits: [], hn: 0, kb: null, deadT: 0, bob: 0, kick: 0, step: 0, adsK: 0, lastShot: -9, draw: 0, dryT: 0};
    const opp = {p: new THREE.Vector3(0, 0, 0), tp: new THREE.Vector3(), v: new THREE.Vector3(), yaw: 0, pitch: 0, c: 0, al: 1, hp: 100, d: 0, sh: 0, seen: -1, rt: 0, hseen: 0, nm: o.oppName || 'Opponent', av: null, J: 0};
    this.match = Object.assign({mi: o.mi, M, host: o.host, team: o.host ? 'A' : 'B', me, opp, score: [0, 0], ph: 'warm', warm: 3.2, t: 0, sent: 0, stats: {shots: 0, hits: 0, heads: 0}, kf: [], oppName: o.oppName || 'Opponent'}, o);
    this.spawn(true);
    if (o.bot) { o.bot.m = this.match; this.botSpawn(o.bot, true); opp.av = o.bot.av; M.G.add(o.bot.av.root); o.bot.av.root.visible = true; }
    this.E.na.textContent = first(this.myName()).toUpperCase(); this.E.nb.textContent = first(this.match.oppName).toUpperCase(); this.E.mn.textContent = MAPS[o.mi].name;
    this.ui.classList.add('on'); this.E.tch.classList.toggle('on', !!this.touch); this.E.kf.innerHTML = ''; this.hud(true);
    this.viewmodel(true); this.snap = 1;
    this.big('GET READY', MAPS[o.mi].name + ' · FIRST TO ' + WIN);
    O.sfx('airhorn');
    if (!this.touch) this.E.click.classList.add('on');
  }
  // back to the Firing Range (or wherever I was)
  leave(quit) {
    const M = this.match, O = this.O; if (!M) { this.cancelQ(); return; }
    if (quit && M.N && M.ph !== 'end') { try { M.N.send(Object.assign(this.state(), {bye: 1})); } catch (e) {} }
    if (M.N) { const N = M.N; setTimeout(() => { try { N.leave(); } catch (e) {} }, 400); }
    this.mp = null; this.setQ(null);
    if (quit && M.ph !== 'end' && !M.bot) this.rec(false);
    const a = O.meAv; this.match = null; this.ui.classList.remove('on'); this.viewmodel(false); this.firing = false; this.keys = {};
    if (this.locked) try { document.exitPointerLock(); } catch (e) {}
    const op = M.opp && M.opp.av;
    if (op && !M.bot) this.release(op);
    if (M.bot) { this.gun(M.bot.av, false); M.M.G.remove(M.bot.av.root); try { M.bot.av.dispose(); } catch (e) {} }
    this.ads = 0; if (this.E.dead) { this.E.dead.classList.remove('on'); this.E.low.classList.remove('on'); }
    M.M.G.visible = false; O.wld && O.wld.arena && O.wld.arena(null);
    this.menu(false);
    if (a) {
      a.ar = 0; a.noTag = 0; a.root.visible = true; a.root.scale.setScalar(1); a.root.rotation.set(0, 0, 0); a.poseFx = null; a.mode = 'seated';
      const ok = O.walk.start({at: {x: TERM.x + 1.3, z: TERM.z + .5, y: RANGEY, h: Math.PI / 2, f: 'g'}});
      if (!ok) a.sitNow(); else O.walk.snap = 1;
    }
  }
  release(op) { op.ar = 0; op.noTag = 0; op._fall = 0; op.root.scale.setScalar(1); op.root.rotation.order = 'XYZ'; op.root.rotation.set(0, op.root.rotation.y, 0); op.poseFx = null; this.gun(op, false); if (op.root.parent !== this.O.room.group) this.O.room.group.add(op.root); }
  rec(win) { const r = this.record(); if (win) { r.w++; r.c++; r.s = Math.max(r.s, r.c); } else { r.l++; r.c = 0; } lsSet(K.rec, JSON.stringify(r)); if (win) this.api('score', 'lasertag', r.w); }
  spawn(first) {
    const M = this.match, me = M.me, S = M.M.spawns[M.team], o = M.opp;
    let best = S[0], bd = -1; S.forEach(s => { const d = Math.hypot(s[0] - o.p.x, s[1] - o.p.z) + (first ? 0 : Math.random() * 6); if (d > bd) { bd = d; best = s; } });
    me.p.set(best[0], 0, best[1]); me.v.set(0, 0, 0); me.yaw = best[2]; me.pitch = 0; me.hp = 100; me.al = 1; me.ammo = GUN.mag; me.res = GUN.res; me.rl = 0; me.prot = first ? 0 : 1.6; me.c = 0; me.duck = 0; me.hh = HH; me.burst = 0; me.kick = 0; me.draw = 0; me.lastShot = -9; me.adsK = 0;
    this.snap = 1;
  }
  // ---------- the practice bot
  mkBot() {
    const av = new Avatar({id: 'bot:arena', nm: 'TRAINING BOT', bot: true, look: ''});
    av.mode = 'free'; av.sitK = 0; av.standK = 0; av.root.scale.setScalar(AS); av.ar = 1;
    const b = {av, nm: 'Training Bot', P: {p: new THREE.Vector3(), v: new THREE.Vector3(), g: 1, hh: HH}, yaw: 0, pitch: 0, c: 0, hp: 100, al: 1, d: 0, deadT: 0, prot: 0, path: null, pi: 0, goal: null, see: 0, seenT: -9, last: null, react: 0,
      aimE: 0, burst: 0, next: 0, strafe: 1, strafeT: 0, roamT: 0, sh: 0, hn: 0, cfg: BOTS[this.diff] || BOTS.normal};
    this.gun(av, true);
    return b;
  }
  botSpawn(b, first) {
    const M = this.match, S = M.M.spawns.B; let best = S[0], bd = -1; S.forEach(s => { const d = Math.hypot(s[0] - M.me.p.x, s[1] - M.me.p.z) + (first ? 0 : Math.random() * 6); if (d > bd) { bd = d; best = s; } });
    b.P.p.set(best[0], 0, best[1]); b.P.v.set(0, 0, 0); b.yaw = best[2]; b.pitch = 0; b.hp = 100; b.al = 1; b.prot = first ? 0 : 1.6; b.path = null; b.see = 0; b.react = 0; b.c = 0;
  }
  botTick(b, dt, t) {
    const M = this.match, map = M.M, me = M.me, cfg = b.cfg, P = b.P;
    if (!b.al) { b.deadT -= dt; if (b.deadT <= 0 && M.ph === 'play') this.botSpawn(b, false); else { b.P.v.set(0, 0, 0); this.place(b.av, P.p, b.yaw, b.pitch, 0, 0, dt, M.M, true); return; } }
    if (b.prot > 0) b.prot -= dt;
    // can I see the player?
    const eye = this.v.set(P.p.x, P.p.y + EYE, P.p.z), tgt = this.v2.set(me.p.x, me.p.y + lerp(1.3, .9, me.c), me.p.z), dx = tgt.x - eye.x, dy = tgt.y - eye.y, dz = tgt.z - eye.z, dist = Math.hypot(dx, dy, dz);
    let see = 0;
    if (me.al && dist < 70 && M.ph === 'play') { const d = this.v3.set(dx / dist, dy / dist, dz / dist), h = rayMap(map, eye, d, dist); if (!h.hit || h.t >= dist - .2) { const yawTo = Math.atan2(dx, dz); let off = yawTo - b.yaw; off = Math.atan2(Math.sin(off), Math.cos(off)); const heard = dist < 9 && me.g && Math.hypot(me.v.x, me.v.z) > RUN * .6;   // running footsteps give you away (walk with SHIFT to sneak)
        see = Math.abs(off) < 1.1 || heard || t - b.seenT < 1.5 || t - (M.lastShotT || -9) < 1.2 ? 1 : 0; } }
    if (see) { if (!b.see) b.react = t + cfg.react * (.8 + Math.random() * .5); b.seenT = t; b.last = {x: me.p.x, z: me.p.z}; }
    b.see = see;
    // where to go
    let wx = 0, wz = 0, walk = false;
    if (see) {
      // fight: strafe left and right, stop to shoot (counter-strafe) on the harder settings
      if ((b.strafeT -= dt) <= 0) { b.strafeT = .35 + Math.random() * .6; b.strafe = Math.random() < .5 ? -1 : 1; if (Math.random() < .15) b.strafe = 0; }
      const yaw = Math.atan2(dx, dz), rx = -Math.cos(yaw), rz = Math.sin(yaw); wx = rx * b.strafe * cfg.strafe; wz = rz * b.strafe * cfg.strafe;
      if (dist > 24) { wx += Math.sin(yaw) * .6; wz += Math.cos(yaw) * .6; }
      b.path = null;
    } else {
      if (!b.path || b.pi >= b.path.length || (b.roamT -= dt) <= 0) {
        b.roamT = 6 + Math.random() * 5;
        let goal = b.last && t - b.seenT < 6 ? b.last : null;
        if (!goal) { const N = map.nav; for (let k = 0; k < 30; k++) { const i = (Math.random() * N.nx) | 0, j = (Math.random() * N.nz) | 0; if (N.ok[i * N.nz + j]) { goal = {x: N.x0 + (i + .5) * N.S, z: N.z0 + (j + .5) * N.S}; if (Math.abs(goal.x) < 14) break; } } }
        if (goal) { b.path = navPath(map.nav, P.p, goal); b.pi = 1; } if (b.last && goal === b.last) b.last = null;
      }
      if (b.path && b.pi < b.path.length) { const q = b.path[b.pi], ddx = q.x - P.p.x, ddz = q.z - P.p.z, dd = Math.hypot(ddx, ddz); if (dd < .45) b.pi++; else { wx = ddx / dd; wz = ddz / dd; } }
    }
    // aim: turn toward the target with a speed limit and a shrinking error, then fire in bursts
    let tyaw = b.yaw, tpitch = 0;
    if (see && t > b.react) {
      const head = Math.random() < cfg.head ? 1 : 0, ty = me.p.y + (head ? lerp(1.5, 1.04, me.c) : lerp(1.0, .7, me.c));
      tyaw = Math.atan2(me.p.x - P.p.x, me.p.z - P.p.z) + Math.sin(t * 3.1 + b.aimE) * cfg.err; tpitch = Math.atan2(ty - (P.p.y + EYE), Math.hypot(me.p.x - P.p.x, me.p.z - P.p.z));
    } else if (wx || wz) tyaw = Math.atan2(wx, wz);
    let dyaw = tyaw - b.yaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw)); const mt = cfg.turn * dt * (see ? 1 : .6);
    b.yaw += clamp(dyaw, -mt, mt); b.pitch += clamp(tpitch - b.pitch, -mt, mt);
    if (see && t > b.react && Math.abs(dyaw) < .06 && me.al && b.al && M.ph === 'play' && t > b.next) {
      if (b.burst < cfg.burst) { b.next = t + GUN.rate * (1 + Math.random() * .4); b.burst++; this.botFire(b, t); if (cfg.strafe >= 1) { wx *= .1; wz *= .1; } }
      else { b.burst = 0; b.next = t + .25 + Math.random() * .4; }
    }
    // move like a player
    const wl = Math.hypot(wx, wz), ws = wl > .01 ? RUN * (walk ? WALKF : 1) * Math.min(1, wl) : 0; if (wl > .01) { wx /= wl; wz /= wl; }
    this.moveBody(P, wx, wz, ws, false, dt, map);
    this.place(b.av, P.p, b.yaw, b.pitch, b.c, Math.hypot(P.v.x, P.v.z), dt, map);
  }
  botFire(b, t) {
    const M = this.match, me = M.me, P = b.P, cfg = b.cfg, eye = new THREE.Vector3(P.p.x, P.p.y + EYE, P.p.z), d = dirOf(b.yaw, b.pitch, new THREE.Vector3());
    const s = cfg.fire * (.5 + Math.random()); d.x += (Math.random() - .5) * s * 2; d.y += (Math.random() - .5) * s * 2; d.z += (Math.random() - .5) * s * 2; d.normalize();
    const wall = rayMap(M.M, eye, d, GUN.range), z = me.al ? rayZones(eye, d, zones(me.p.x, me.p.y, me.p.z, me.c)) : null;
    const end = z && z.t < wall.t ? eye.clone().addScaledVector(d, z.t) : eye.clone().addScaledVector(d, wall.t);
    const mz = this.muzzleOf(b.av, eye, d); this.tracer(mz, end, TRC); this.wflash(mz); this.gunshot(.6, b.av.root.getWorldPosition(this.v3));
    if (z && z.t < wall.t) this.hurt(GUN[z.k], z.k === 'head', {x: P.p.x, z: P.p.z}, b.nm);
    else this.impact(end, wall.n, wall.k);
  }
  // ---------- my player
  moveBody(B, wx, wz, ws, duck, dt, map) {
    const V = B.v, n = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / n;
    for (let i = 0; i < n; i++) {
      if (B.g) {
        if (B.jump) { V.y = JUMP; B.g = 0; B.jump = 0; }
        else { const sp = Math.hypot(V.x, V.z); if (sp < .05) { V.x = V.z = 0; } else { const drop = Math.max(sp, STOP) * FRIC * h, k = Math.max(0, sp - drop) / sp; V.x *= k; V.z *= k; } }
        this.accel(V, wx, wz, ws, ACC, h, null);
      } else this.accel(V, wx, wz, ws, AIRACC, h, AIRCAP);
      V.y -= GRAV * h;
      slide(map, B, h);
    }
    if (B.p.y < -30) { B.p.set(map.spawns.A[0][0], 0, map.spawns.A[0][1]); V.set(0, 0, 0); }
  }
  accel(V, wx, wz, ws, a, dt, cap) { if (ws <= 0) return; const cur = V.x * wx + V.z * wz, add = (cap != null ? Math.min(ws, cap) : ws) - cur; if (add <= 0) return; const acc = Math.min(add, a * ws * dt); V.x += acc * wx; V.z += acc * wz; }
  mine(dt, t) {
    const M = this.match, me = M.me, map = M.M, Kk = this.keys;
    if (!me.al) {
      me.deadT -= dt; me.v.x *= .9; me.v.z *= .9;
      if (me.deadT <= 0 && M.ph === 'play') { this.spawn(false); this.big('', ''); this.send(1); }
      return;
    }
    if (me.prot > 0) me.prot -= dt;
    const play = M.ph === 'play' || M.ph === 'warm', fm = play ? (Kk.w ? 1 : 0) - (Kk.s ? 1 : 0) + (this.stick ? this.stick.y : 0) : 0, sm = play ? (Kk.d ? 1 : 0) - (Kk.a ? 1 : 0) + (this.stick ? this.stick.x : 0) : 0;
    const fx = Math.sin(me.yaw), fz = Math.cos(me.yaw), rx = -fz, rz = fx;
    let wx = fx * fm + rx * sm, wz = fz * fm + rz * sm; const wl = Math.hypot(wx, wz); if (wl > 1) { wx /= wl; wz /= wl; } else if (wl > 0) { wx /= wl; wz /= wl; }
    // crouch: in the air it pulls the feet up (crouch-jump); standing up needs head room
    const want = !!Kk.c;
    if (want && !me.duck) { me.duck = 1; if (!me.g && freeAt(map, me.p.x, me.p.y + (HH - HHC), me.p.z, HHC)) me.p.y += HH - HHC; me.hh = HHC; }
    else if (!want && me.duck) { if (me.g ? freeAt(map, me.p.x, me.p.y, me.p.z, HH) : freeAt(map, me.p.x, me.p.y - (HH - HHC), me.p.z, HH)) { if (!me.g) me.p.y -= HH - HHC; me.duck = 0; me.hh = HH; } }
    me.c = damp(me.c, me.duck ? 1 : 0, 14, dt);
    me.adsK = damp(me.adsK || 0, this.ads && me.rl <= 0 && play ? 1 : 0, 13, dt);
    const ws = wl > 0 ? RUN * (me.duck ? DUCKF : Kk.walk ? WALKF : 1) * Math.min(1, wl) * (1 - .25 * me.adsK) : 0;
    if (this.jumpQ > 0) { this.jumpQ -= dt; if (me.g && play) { me.jump = 1; this.jumpQ = 0; } }
    this.moveBody(me, wx, wz, ws, me.duck, dt, map);
    // footsteps
    const sp = Math.hypot(me.v.x, me.v.z); me.bob += sp * dt;
    if (me.g && sp > 3.2 && !Kk.walk && !me.duck) { me.step += sp * dt; if (me.step > 2.3) { me.step = 0; this.foot(.18); } }
    // the blaster
    if (me.rl > 0) { const r0 = me.rl; me.rl -= dt; this.reloadSfx(GUN.reload - r0, GUN.reload - me.rl); if (me.rl <= 0) { const got = Math.min(GUN.mag - me.ammo, me.res); me.ammo += got; me.res -= got; } }
    if ((this.firing || Kk.fire) && play && M.ph === 'play') this.fire(t);
    if (t - (me.lastShot || -9) > GUN.rate * 1.2) me.burst = Math.max(0, me.burst - dt * RECOV);
    me.kick = damp(me.kick, 0, 10, dt);
  }
  spread() {
    const me = this.match.me, sp = Math.hypot(me.v.x, me.v.z); if (this.noSpread) return 0;
    let s = .0009 + clamp((sp - 1.6) / 4.8, 0, 1) * .03 + (me.g ? 0 : .055) + Math.min(me.burst, 10) * .0011;
    if (me.duck) s *= .7; return s * (1 - .45 * (me.adsK || 0));
  }
  fire(t) {
    const M = this.match, me = M.me, O = this.O; if (!me.al || me.rl > 0 || t < me.next) return;
    if (me.ammo <= 0) { if (me.res > 0) this.reload(); else if (t > (me.dryT || 0)) { me.dryT = t + .3; this.dry(); } return; }
    const pk = patAt(me.burst);
    me.next = t + GUN.rate; me.ammo--; me.burst++; me.lastShot = t; me.kick = Math.min(1.4, me.kick + .6); me.prot = 0; M.stats.shots++;
    const eye = this.eye(new THREE.Vector3()), d = dirOf(me.yaw - pk[0] * D2R, me.pitch + pk[1] * D2R, new THREE.Vector3()), s = this.spread();
    if (s > 0) { const a = Math.random() * 6.283, r = s * Math.sqrt(Math.random()), up = Math.abs(d.y) < .99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0), u = new THREE.Vector3().crossVectors(d, up).normalize(), v = new THREE.Vector3().crossVectors(u, d); d.addScaledVector(u, Math.cos(a) * r).addScaledVector(v, Math.sin(a) * r).normalize(); }
    const wall = rayMap(M.M, eye, d, GUN.range), o = M.opp, z = o.al && !(o.prot > 0) ? rayZones(eye, d, zones(o.p.x, o.p.y, o.p.z, o.c)) : null;
    const hit = z && z.t < wall.t, end = eye.clone().addScaledVector(d, hit ? z.t : wall.t);
    me.sh++; me.se = [+end.x.toFixed(2), +end.y.toFixed(2), +end.z.toFixed(2)];
    this.tracer(this.vmMuzzle(), end, TRC); this.gunshot(1); this.flash(); this.shell();
    if (hit) {
      const dmg = GUN[z.k], hd = z.k === 'head'; M.stats.hits++; if (hd) M.stats.heads++;
      this.hitmark(hd || dmg >= o.hp); this.hitSnd(hd); this.blood(end, d);
      if (M.bot) this.botHurt(M.bot, dmg, hd); else { me.hn++; me.hits.push([me.hn, dmg, hd ? 1 : 0]); if (me.hits.length > 6) me.hits.shift(); }
    } else this.impact(end, wall.n, wall.k);
    M.lastShotT = t;
    this.send(1);
  }
  reload() { const me = this.match.me; if (me.rl > 0 || me.ammo >= GUN.mag || !me.al || me.res <= 0) return; me.rl = GUN.reload; me.burst = 0; }
  // damage on me (from the bot, or from the other player's hit list)
  hurt(dmg, hd, from, by) {
    const M = this.match, me = M.me; if (!me.al || me.prot > 0 || M.ph !== 'play') return;
    me.hp -= dmg; this.E.red.classList.add('on'); setTimeout(() => this.E.red.classList.remove('on'), 90);
    if (from) { const a = Math.atan2(from.x - me.p.x, from.z - me.p.z) - me.yaw, deg = -a * 180 / Math.PI; this.E.dmg.style.transform = 'rotate(' + deg.toFixed(0) + 'deg)'; this.E.dmg.classList.add('on'); clearTimeout(this._dt); this._dt = setTimeout(() => this.E.dmg.classList.remove('on'), 120); }
    this.O.shk = Math.max(this.O.shk || 0, .12);
    if (me.hp <= 0) {
      me.hp = 0; me.al = 0; me.d++; me.deadT = 3; me.kb = {n: me.d, hd: hd ? 1 : 0}; M.score[1] = M.bot ? me.d : M.score[1];
      this.feed(by || M.oppName, this.myName(), hd, false); this.buzz();
      this.big('ELIMINATED', (hd ? 'HEADSHOT · ' : '') + 'KILLED BY ' + String(by || M.oppName).toUpperCase() + ' · RESPAWN IN 3');
      this.send(1);
    } else this.thud(dmg);
  }
  botHurt(b, dmg, hd) {
    const M = this.match; if (!b.al || b.prot > 0) return; b.hp -= dmg; b.seenT = this.O.t; b.last = {x: M.me.p.x, z: M.me.p.z}; if (!b.see) b.react = this.O.t + b.cfg.react;
    if (b.hp <= 0) { b.hp = 0; b.al = 0; b.d++; b.deadT = 3; M.score[0] = b.d; this.feed(this.myName(), b.nm, hd, true); this.kill(hd); this.ragdollOf(b.av, M.me.p, b.yaw, b.P.p); }
  }
  // a body that is shot down falls away from the shooter: backward when it was facing them, forward when it was not
  ragdollOf(av, from, yaw, at) {
    if (!av) return; let dir = 1, kx = 0, kz = 0;
    if (from && at) { const dx = at.x - from.x, dz = at.z - from.z, L = Math.hypot(dx, dz) || 1; kx = dx / L * .45; kz = dz / L * .45; dir = Math.sin(yaw || 0) * -dx / L + Math.cos(yaw || 0) * -dz / L > 0 ? 1 : -1; }
    av._fallDir = dir; av._fallKx = kx; av._fallKz = kz;
  }
  // ---------- network state (11 a second through the match room)
  state() {
    const M = this.match, me = M.me;
    return {v: 1, m: M.mi, nm: first(this.myName()), J: (this.O.meAv && this.O.meAv.look && this.O.meAv.look.J) || 0, x: +me.p.x.toFixed(2), y: +me.p.y.toFixed(2), z: +me.p.z.toFixed(2), h: +me.yaw.toFixed(3), p: +me.pitch.toFixed(3), c: me.duck ? 1 : 0,
      vx: +me.v.x.toFixed(2), vy: +me.v.y.toFixed(2), vz: +me.v.z.toFixed(2), al: me.al, hp: Math.max(0, Math.round(me.hp)), d: me.d, sh: me.sh, se: me.se, hits: me.hits.slice(), kb: me.kb, pr: me.prot > 0 ? 1 : 0, ph: M.ph};
  }
  send(force) { const M = this.match; if (!M || !M.N) return; if (!force && this.O.t - M.sent < .085) return; M.sent = this.O.t; try { M.N.send(this.state()); } catch (e) {} }
  net(dt, t) {
    const M = this.match, o = M.opp, N = M.N; if (!N) return;
    let pk = null; try { pk = N.peer(); } catch (e) { pk = null; }
    const s = pk && pk.s;
    if (s && typeof s === 'object') {
      if (s.bye && M.ph !== 'end') { this.finish(true, first(M.oppName) + ' left the match'); return; }
      if (s.rt !== o.rt) {
        o.rt = pk.rt; o.tp.set(+s.x || 0, +s.y || 0, +s.z || 0); o.v.set(+s.vx || 0, +s.vy || 0, +s.vz || 0); o.tyaw = +s.h || 0; o.tpitch = +s.p || 0; o.c = s.c ? 1 : 0; o.prot = s.pr ? 1 : 0; o.J = +s.J || 0;
        if (o.seen < 0) { o.p.copy(o.tp); o.yaw = o.tyaw; o.hseen = Array.isArray(s.hits) && s.hits.length ? Math.max(...s.hits.map(h => +h[0] || 0)) : 0; o.sh = +s.sh || 0; o.d = +s.d || 0; }
        o.seen = 1; o.at = t;
        // their shots: tracer and sound; their hits on me: I take the damage
        if ((+s.sh || 0) !== o.sh) { o.sh = +s.sh || 0; if (Array.isArray(s.se) && o.av) { const e = new THREE.Vector3(+s.se[0] || 0, +s.se[1] || 0, +s.se[2] || 0), mz = this.muzzleOf(o.av, null, null); this.tracer(mz, e, TRC); this.wflash(mz); this.puff(e); this.gunshot(.65, o.av.root.getWorldPosition(this.v3)); } }
        if (Array.isArray(s.hits)) s.hits.forEach(h => { const n = +h[0] || 0; if (n > o.hseen) { o.hseen = n; this.hurt(clamp(+h[1] || 0, 0, 100), !!h[2], {x: o.p.x, z: o.p.z}, M.oppName); } });
        // they were tagged: my point
        const d = clamp(+s.d || 0, 0, 99); if (d > o.d) { o.d = d; M.score[0] = d; this.feed(this.myName(), M.oppName, !!(s.kb && s.kb.hd), true); this.kill(!!(s.kb && s.kb.hd)); this.ragdollOf(o.av, M.me.p, o.yaw, o.p); }
        o.al = s.al ? 1 : 0; o.hp = +s.hp || 0;
        M.score[1] = M.me.d;
      }
    }
    try { if (N.gone && N.gone() && M.ph !== 'end') this.finish(true, first(M.oppName) + ' left the match'); } catch (e) {}
    // smooth their body: dead reckoning from the last state, then ease toward it
    const age = Math.min(.25, t - (o.at || t));
    const ex = o.tp.x + o.v.x * age, ey = o.tp.y + Math.max(-2, o.v.y) * age * .5, ez = o.tp.z + o.v.z * age;
    const jump = Math.hypot(ex - o.p.x, ez - o.p.z) > 4; if (jump) o.p.set(ex, ey, ez);
    o.p.x = damp(o.p.x, ex, 16, dt); o.p.y = damp(o.p.y, Math.max(0, ey), 16, dt); o.p.z = damp(o.p.z, ez, 16, dt);
    let dy = (o.tyaw || 0) - o.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); o.yaw += dy * Math.min(1, dt * 16); o.pitch = damp(o.pitch, o.tpitch || 0, 16, dt);
    this.send();
  }
  // ---------- per frame
  tick(dt, t) {
    this.mmTick(); this.invTick();
    const M = this.match; if (!M) return;
    const O = this.O, a = O.meAv;
    if (!a || a.leaving) { this.leave(); return; }
    M.t += dt;
    if (M.ph === 'warm') { M.warm -= dt; if (M.warm <= 0) { M.ph = 'play'; this.big('GO!', 'FIRST TO ' + WIN); this.beep(990, .18); } else if (Math.ceil(M.warm) !== M.wc) { M.wc = Math.ceil(M.warm); if (M.wc <= 3) { this.big(String(M.wc), MAPS[M.mi].name); this.beep(660, .1); } } }
    this.mine(dt, t);
    if (M.bot) { this.botTick(M.bot, dt, t); const b = M.bot, o = M.opp; o.p.copy(b.P.p); o.yaw = b.yaw; o.pitch = b.pitch; o.c = b.c; o.al = b.al; o.prot = b.prot; o.hp = b.hp; M.score = [b.d, M.me.d]; }
    else {
      // the opponent's avatar (they might be anywhere in O.av; their look comes with them)
      const op = M.opp.av || (M.opp.av = O.av.get(M.oppId) || null);
      if (op) { if (op.root.parent !== M.M.G) M.M.G.add(op.root); op.ar = 1; op.mode = 'free'; op.sitK = 0; op.standK = 0; op.root.visible = true; this.gun(op, true); if (op.leaving) { this.finish(true, first(M.oppName) + ' left the floor'); return; } }
      this.net(dt, t);
      if (op) this.place(op, M.opp.p, M.opp.yaw, M.opp.pitch, M.opp.c, Math.hypot(M.opp.v.x, M.opp.v.z), dt, M.M, !M.opp.al);
    }
    // tag over the opponent's head only when they're in plain sight
    const op = M.opp.av; if (op) { const vis = M.opp.al && this.los(M.opp.p, M.opp.c); op.noTag = vis ? 0 : 1; }
    if (M.ph === 'play') { if (M.score[0] >= WIN || M.score[1] >= WIN) this.finish(false); }
    if (M.ph === 'end') { M.endT -= dt; if (M.endT <= 0) { this.leave(); return; } }
    this.vmTick(dt, t); this.fxTick(dt); this.hud();
  }
  los(p, c) { const M = this.match, eye = this.eye(new THREE.Vector3()), tg = new THREE.Vector3(p.x, p.y + lerp(1.5, 1.04, c), p.z), d = tg.clone().sub(eye), L = d.length(); d.divideScalar(L || 1); const h = rayMap(M.M, eye, d, L); return !h.hit || h.t >= L - .3; }
  finish(left, why) {
    const M = this.match; if (!M || M.ph === 'end') return; M.ph = 'end'; M.endT = 6.5; this.firing = false;
    const win = left ? true : M.score[0] > M.score[1];
    if (!M.bot) this.rec(win);
    const acc = M.stats.shots ? Math.round(M.stats.hits / M.stats.shots * 100) : 0;
    this.big(left ? 'YOU WIN' : win ? 'VICTORY' : 'DEFEAT', (why ? why.toUpperCase() + ' · ' : '') + M.score[0] + ' : ' + M.score[1] + ' · ACCURACY ' + acc + '% · HEADSHOTS ' + M.stats.heads, 6000);
    this.O.sfx(win ? 'chaching' : 'ding'); if (win) this.O.sfx('crowd');
    this.send(1);
  }
  // ---------- the camera: first person from the eye, instantly
  eye(v) { const me = this.match.me, o = this.match.M.def.o; return v.set(me.p.x, me.p.y + lerp(EYE, EYEC, me.c), me.p.z); }
  cam(P, T) {
    const M = this.match; if (!M) return 0;
    const o = M.M.def.o, me = M.me, e = this.eye(this.v);
    const pk = patAt(me.burst);
    let yaw = me.yaw - pk[0] * D2R * VIEWK, pitch = me.pitch + pk[1] * D2R * VIEWK + me.kick * .004;
    if (!me.al) { const op = M.opp, dk = clamp((3 - me.deadT) / .55, 0, 1), fall = 1 - Math.pow(1 - dk, 3); e.y = me.p.y + lerp(EYE, .34, fall); const dx = op.p.x - me.p.x, dz = op.p.z - me.p.z; yaw = Math.atan2(dx, dz); pitch = Math.atan2(op.p.y + 1 - e.y, Math.hypot(dx, dz)) * .8; }
    const bob = me.g && me.al ? Math.sin(me.bob * 1.9) * .025 * clamp(Math.hypot(me.v.x, me.v.z) / RUN, 0, 1) : 0;
    P.set(o[0] + e.x, o[1] + e.y + bob, o[2] + e.z); const d = dirOf(yaw, clamp(pitch, -1.54, 1.54), this.v3); T.set(P.x + d.x * 10, P.y + d.y * 10, P.z + d.z * 10);
    this.snap = 1; return this.fov * (1 - .18 * (me.adsK || 0));
  }
  grab() { return !!this.match; }
  drag(dx, dy) {
    if (!this.match) return false;
    if (!this.locked) this.look(dx * (this.touch ? 6 : 1), dy * (this.touch ? 6 : 1));
    return true;
  }
  look(dx, dy) {
    const me = this.match && this.match.me; if (!me || this.match.ph === 'end') return;
    const z = me.adsK || 0, kz = z > .001 ? Math.tan(this.fov * (1 - .18 * z) * D2R / 2) / Math.tan(this.fov * D2R / 2) : 1, k = .022 * this.sens * D2R * kz;
    me.yaw -= dx * k; me.pitch = clamp(me.pitch - dy * k * (this.invY ? -1 : 1), -1.54, 1.54);
    this.swX = clamp((this.swX || 0) - dx * k * .35, -.07, .07); this.swY = clamp((this.swY || 0) - dy * k * .35 * (this.invY ? -1 : 1), -.05, .05);
  }
  zone(z) {}
  remote(a, q) {}
  leaveAll() { if (this.match) this.leave(true); else this.cancelQ(); }
  // ---------- input
  bindInput() {
    const O = this.O, cv = O.cv;
    const typing = e => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); };
    cv.addEventListener('pointerdown', e => {
      if (!this.match || this.menuOn) return;
      if (this.touch || e.pointerType === 'touch') return this.touchDown(e);
      if (!this.locked) { this.lock(); return; }
      if (e.button === 0) { this.firing = true; this.fire(O.t); } else if (e.button === 2) this.ads = 1;
    });
    cv.addEventListener('contextmenu', e => { if (this.match) e.preventDefault(); });
    addEventListener('pointerup', e => { if (e.button === 0) this.firing = false; if (e.button === 2) this.ads = 0; this.touchUp(e); });
    addEventListener('pointermove', e => this.touchMove(e));
    document.addEventListener('mousemove', e => { if (this.match && this.locked) this.look(e.movementX || 0, e.movementY || 0); });
    document.addEventListener('pointerlockchange', () => {
      const was = this.locked; this.locked = document.pointerLockElement === cv;
      this.E.click.classList.toggle('on', !!this.match && !this.locked && !this.touch && this.match.ph !== 'end');
      if (was && !this.locked && this.match && this.match.ph !== 'end') { this.firing = false; this.ads = 0; this.keys = {}; this.menu(true, 'pause'); }
    });
    const KM = {w: 'w', W: 'w', ArrowUp: 'w', s: 's', S: 's', ArrowDown: 's', a: 'a', A: 'a', ArrowLeft: 'a', d: 'd', D: 'd', ArrowRight: 'd', c: 'c', C: 'c', Control: 'c', Shift: 'walk'};
    addEventListener('keydown', e => {
      if (!this.match || typing(e) || this.menuOn) return;
      e.__vo3 = 1; const k = KM[e.key];
      if (k) { this.keys[k] = 1; e.preventDefault(); e.stopPropagation(); return; }
      if (e.key === ' ') { this.jumpQ = .15; e.preventDefault(); e.stopPropagation(); }
      else if (e.key === 'r' || e.key === 'R') { this.reload(); e.preventDefault(); }
      else if (e.key === 'Tab') { this.board(true); e.preventDefault(); e.stopPropagation(); }
      else if (e.key === 'Escape') { if (!this.locked) this.menu(true, 'pause'); e.preventDefault(); }
      else if (/^(e|E|q|Q|h|H|Enter)$/.test(e.key)) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    addEventListener('keyup', e => { const k = KM[e.key]; if (k) this.keys[k] = 0; if (e.key === 'Tab') this.board(false); }, true);
    addEventListener('blur', () => { this.keys = {}; this.firing = false; this.ads = 0; });
    // touch buttons
    const t = this.E.tch, hold = (sel, dn, up) => { const b = t.querySelector(sel); b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); dn(); }); b.addEventListener('pointerup', e => { e.stopPropagation(); up && up(); }); b.addEventListener('pointerleave', () => up && up()); };
    hold('.f', () => { this.firing = true; this.fire(this.O.t); }, () => { this.firing = false; });
    hold('.j', () => { this.jumpQ = .15; }); hold('.c', () => { this.keys.c = this.keys.c ? 0 : 1; }); hold('.r', () => this.reload());
  }
  lock() {
    const cv = this.O.cv; if (!cv.requestPointerLock || this.touch) return;
    try { const p = cv.requestPointerLock({unadjustedMovement: true}); if (p && p.catch) p.catch(() => { try { cv.requestPointerLock(); } catch (e) {} }); } catch (e) { try { cv.requestPointerLock(); } catch (x) {} }
  }
  touchDown(e) {
    const r = this.O.cv.getBoundingClientRect(), x = e.clientX - r.left;
    if (x < r.width * .42) this.stickP = {id: e.pointerId, x: e.clientX, y: e.clientY}; else this.lookP = {id: e.pointerId, x: e.clientX, y: e.clientY};
  }
  touchMove(e) {
    if (this.stickP && e.pointerId === this.stickP.id) { const dx = clamp((e.clientX - this.stickP.x) / 50, -1, 1), dy = clamp((e.clientY - this.stickP.y) / 50, -1, 1); this.stick = {x: dx, y: -dy}; const k = this.E.tch.querySelector('.stick i'); if (k) k.style.transform = `translate(${dx * 34}px,${dy * 34}px)`; }
    else if (this.lookP && e.pointerId === this.lookP.id) { this.look((e.clientX - this.lookP.x) * 5, (e.clientY - this.lookP.y) * 5); this.lookP.x = e.clientX; this.lookP.y = e.clientY; }
  }
  touchUp(e) { if (this.stickP && e.pointerId === this.stickP.id) { this.stickP = null; this.stick = null; const k = this.E.tch.querySelector('.stick i'); if (k) k.style.transform = ''; } if (this.lookP && e.pointerId === this.lookP.id) this.lookP = null; }
  // ---------- avatars in the arena (the opponent, the bot): they hold the same rifle
  gun(a, on) {
    if (on) {
      if (a._agun) return;
      if (!FX.world) FX.world = rifle(false);
      const g = FX.world.g.clone(), tip = new THREE.Object3D(); tip.position.copy(FX.world.tip); g.add(tip); g.userData.tip = tip;
      g.rotation.y = Math.PI; g.scale.setScalar(.8); g.position.set(-.1, 1.24, .3); g.traverse(m => { if (m.isMesh) m.castShadow = true; });
      a.rig.add(g); a._agun = g; if (a.blaster) a.blaster.visible = false;
      a.poseFx = (Z) => { const p = a._apitch || 0; Z.rsx = -1.45 - p; Z.rsz = -.05; Z.rex = -.15; Z.lsx = -1.3 - p; Z.lsz = .35; Z.lex = -.6; Z.hx = .06 - p * .5; Z.ty = .08;
        const c = a._acr || 0; if (c > .02) { Z.hip = lerp(Z.hip ?? .58, .34, c); Z.ltx = lerp(Z.ltx || 0, -1.25, c); Z.rtx = lerp(Z.rtx || 0, -1.1, c); Z.lkx = lerp(Z.lkx || 0, 2.0, c); Z.rkx = lerp(Z.rkx || 0, 1.9, c); Z.tx = lerp(Z.tx || 0, .25, c); }
        const f = a._fall || 0; if (f > .02) { Z.rsx = lerp(Z.rsx, -2.7, f); Z.lsx = lerp(Z.lsx, -2.5, f); Z.rsz = lerp(Z.rsz, -.6, f); Z.lsz = lerp(Z.lsz, .7, f); Z.rex = lerp(Z.rex, -.3, f); Z.lex = lerp(Z.lex, -.2, f); Z.hx = lerp(Z.hx, -.45, f); Z.ltx = lerp(Z.ltx || 0, .35, f); Z.rtx = lerp(Z.rtx || 0, -.25, f); } };
    } else if (a._agun) { a.rig.remove(a._agun); a._agun = null; if (a.blaster) a.blaster.visible = true; a.poseFx = null; }
  }
  place(av, p, yaw, pitch, c, sp, dt, map, down) {
    // avatars in a match live inside the map's group (which sits at the map's origin): their position is map-local.
    // A body that is down falls over around its feet (away from the shooter, see ragdollOf) and gets back up at once on respawn
    const o = map.def.o, r = av.root, k = r.parent === map.G ? 0 : 1, f = av._fall = damp(av._fall || 0, down ? 1 : 0, down ? 6.5 : 30, dt);
    r.rotation.order = 'YXZ';
    r.position.set(o[0] * k + p.x + (av._fallKx || 0) * f, o[1] * k + p.y, o[2] * k + p.z + (av._fallKz || 0) * f); r.rotation.set(-1.42 * f * (av._fallDir || 1), yaw, 0); r.scale.setScalar(AS);
    av._apitch = down ? 0 : pitch; av._acr = c; const moved = sp * dt; av.mv = sp > .6 && !down ? 1 : 0; av.runK = damp(av.runK || 0, sp > 4 && !down ? 1 : 0, 6, dt); av.walkPh += moved * 5.4 / AS;
    if (!av.me && av.bot) av.update(dt, this.O.t, {cam: this.O.cam.position, focusSpeaker: null, shareStart: 0});
  }
  muzzleOf(av, eye, d) {
    const v = new THREE.Vector3(), tip = av && av._agun && av._agun.userData.tip;
    if (tip) tip.getWorldPosition(v);
    else if (av && av._agun) { av._agun.getWorldPosition(v); const f = dirOf(av.root.rotation.y, av._apitch || 0, new THREE.Vector3()); v.addScaledVector(f, .35); }
    else if (eye) v.copy(eye);
    const o = this.match.M.def.o; v.x -= o[0]; v.y -= o[1]; v.z -= o[2]; return v;
  }
  // ---------- my rifle in first person
  viewmodel(on) {
    const O = this.O;
    if (!this.vm) {
      const G = this.vm = new THREE.Group(), R = this.vmR = rifle(true); G.add(R.g); this.vmTip = R.tip;
      const fl = this.vmFlash = new THREE.Sprite(new THREE.SpriteMaterial({map: flashTex(), color: new THREE.Color(3, 2.4, 1.7), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
      fl.position.copy(R.tip).add(new THREE.Vector3(0, 0, -.07)); fl.scale.setScalar(.2); fl.visible = false; R.g.add(fl);
      let first = true; const cl = new Map(); G.traverse(m => { if (m.isMesh || m.isSprite) { const glass = m.material === RM.glass; if (!m.isSprite) { if (!cl.has(m.material)) cl.set(m.material, m.material.clone()); m.material = cl.get(m.material); } m.renderOrder = first ? 1000 : 1001; m.material.transparent = true; m.material.depthWrite = !m.isSprite && !glass; m.frustumCulled = false; m.castShadow = false; if (first) { m.onBeforeRender = r => r.clearDepth(); first = false; } } });
      G.position.set(.19, -.2, -.38); G.visible = false; O.cam.add(G); if (!O.cam.parent) O.scene.add(O.cam);
    }
    this.vm.visible = !!on;
  }
  vmTick(dt, t) {
    const M = this.match, me = M.me, G = this.vm, R = this.vmR; if (!G) return;
    G.visible = me.al && M.ph !== 'end';
    me.draw = Math.min(1, (me.draw || 0) + dt * 3.4);
    const sm = x => x * x * (3 - 2 * x), sp = clamp(Math.hypot(me.v.x, me.v.z) / RUN, 0, 1), b = me.g ? sp : .3, z = sm(clamp(me.adsK || 0, 0, 1)), hip = 1 - z;
    // reloading: tilt the rifle, the magazine drops out, the left hand brings a new one up and seats it, then the bolt goes home
    const e = me.rl > 0 ? clamp(1 - me.rl / GUN.reload, 0, 1) : 0, tilt = me.rl > 0 ? Math.sin(Math.min(1, e / .9) * Math.PI) : 0;
    const out = e > .08 && e < .66 ? (e < .26 ? sm((e - .08) / .18) : e < .44 ? 1 : 1 - sm((e - .44) / .22)) : 0;
    R.mag.position.set(0, -.32 * out, .03 * out); R.mag.visible = !(e > .24 && e < .42);
    if (R.larm) { R.larm.position.set(-.01 * tilt, -.17 * out - .02 * tilt, .11 * out); R.larm.rotation.x = .25 * out; }
    const bolt = e > .78 && e < .9 ? Math.sin((e - .78) / .12 * Math.PI) : 0; R.bolt.position.z = .04 * bolt;
    // sway behind mouse turns, walking bob, the kick of each shot, the rifle coming up after a spawn
    this.swX = damp(this.swX || 0, 0, 8, dt); this.swY = damp(this.swY || 0, 0, 8, dt);
    const dr = 1 - sm(me.draw), bx = Math.sin(me.bob * .95) * .012 * b * hip, by = Math.abs(Math.cos(me.bob * .95)) * .01 * b * hip, kk = me.kick * (1 - .55 * z);
    G.position.set(lerp(.19, -R.dot.x, z) + bx + this.swX * .4 * hip, lerp(-.2, -R.dot.y, z) + by - tilt * .05 - me.c * .01 * hip - dr * .28, lerp(-.38, -.1, z) + kk * .03);
    G.rotation.set(kk * .05 + tilt * .32 + this.swY * hip - dr * .5, tilt * .22 + this.swX * hip, tilt * -.48 - dr * .3);
    if (this.flashT > 0) { this.flashT -= dt; this.vmFlash.visible = this.flashT > 0; }
  }
  vmMuzzle() { const v = this.vmTip ? this.vmTip.clone() : new THREE.Vector3(0, .012, -.56); if (this.vm) { this.vm.updateMatrixWorld(true); (this.vmR ? this.vmR.g : this.vm).localToWorld(v); } const o = this.match.M.def.o; v.x -= o[0]; v.y -= o[1]; v.z -= o[2]; return v; }
  flash() { this.flashT = .05; if (this.vmFlash) { this.vmFlash.visible = true; this.vmFlash.material.rotation = Math.random() * 6.283; this.vmFlash.scale.setScalar(.16 + Math.random() * .1); } }
  // the other shooter's muzzle flash (map-local position)
  wflash(p) {
    const M = this.match; if (!M || !p) return; const G = M.M.G;
    if (!this.wfl) { this.wfl = new THREE.Sprite(new THREE.SpriteMaterial({map: flashTex(), color: new THREE.Color(3, 2.3, 1.5), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending})); this.wfl.renderOrder = 8; }
    if (this.wfl.parent !== G) G.add(this.wfl);
    this.wfl.position.copy(p); this.wfl.scale.setScalar(.36 + Math.random() * .16); this.wfl.material.rotation = Math.random() * 6.283; this.wfl.visible = true; this.wflT = .05;
  }
  // ---------- effects: tracers, impacts, bullet holes, blood, brass
  tracer(from, to, col) {
    const M = this.match; if (!M) return; const G = M.M.G;
    if (!this.trPool) { this.trPool = []; this.trGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true).translate(0, .5, 0).rotateX(Math.PI / 2); }
    let tr = this.trPool.find(q => q.life <= 0 && q.m.parent === G);
    if (!tr) { const m = new THREE.Mesh(this.trGeo, new THREE.MeshBasicMaterial({color: new THREE.Color(3, 2.6, 1.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false})); m.frustumCulled = false; m.renderOrder = 7; tr = {m, life: 0}; this.trPool.push(tr); G.add(m); }
    const L = from.distanceTo(to); if (L < .6) return;
    tr.a = from.clone(); tr.d = to.clone().sub(from).divideScalar(L); tr.L = L; tr.t = 0; tr.seg = Math.min(3.2, L * .45); tr.life = 1;
    tr.m.position.copy(from); tr.m.lookAt(G.localToWorld(to.clone())); tr.m.scale.set(.0055, .0055, .001); tr.m.material.color.setRGB(col[0], col[1], col[2]); tr.m.material.opacity = .9; tr.m.visible = true;
  }
  impact(p, n, k) {
    const M = this.match, G = M.M.G, O = this.O, o = M.M.def.o, sk = SURF[k] || 'c';
    const X = p.x + o[0] + n.x * .02, Y = p.y + o[1] + n.y * .02, Z = p.z + o[2] + n.z * .02, r = Math.random;
    if (O.pfx) {
      const dust = sk === 'w' ? [.36, .25, .14] : sk === 'f' ? [.38, .38, .42] : sk === 'm' ? [.3, .29, .28] : [.5, .48, .44];
      for (let i = 0; i < 4; i++) O.pfx.emit('dust', X, Y, Z, n.x * (.6 + r()) + (r() - .5) * .6, n.y * (.6 + r()) + r() * .5, n.z * (.6 + r()) + (r() - .5) * .6, {col: dust, s0: .05, s1: .4, life: .7 + r() * .5, a: .55, g: -.15});
      if (sk === 'm' || sk === 'c') for (let i = 0; i < (sk === 'm' ? 7 : 3); i++) O.pfx.emit('spark', X, Y, Z, n.x * 3 + (r() - .5) * 4, n.y * 3 + r() * 2.5, n.z * 3 + (r() - .5) * 4, {col: sk === 'm' ? [3.4, 2.2, .8] : [2.2, 1.9, 1.5], life: .16 + r() * .14, s0: .022, s1: .01});
      if (sk === 'w') for (let i = 0; i < 4; i++) O.pfx.emit('dust', X, Y, Z, n.x * 2.4 + (r() - .5) * 2, n.y * 2 + r() * 2, n.z * 2.4 + (r() - .5) * 2, {col: [.5, .34, .18], s0: .028, s1: .02, life: .55, a: 1, g: 9.8, drag: .3});
    }
    // a bullet hole that stays a while
    if (!this.holes) this.holes = [];
    let d = this.holes.find(q => q.life <= 0 && q.m.parent === G);
    if (!d) { if (this.holes.length >= 48) d = this.holes.reduce((x, y) => x.life < y.life ? x : y); else { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({map: holeTex(), color: '#ffffff', transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4})); m.renderOrder = 3; d = {m, life: 0}; this.holes.push(d); G.add(m); } }
    if (d.m.parent !== G) G.add(d.m);
    d.m.position.set(p.x + n.x * .004, p.y + n.y * .004, p.z + n.z * .004); d.m.lookAt(G.localToWorld(new THREE.Vector3(p.x + n.x, p.y + n.y, p.z + n.z))); d.m.rotateZ(r() * 6.283);
    d.m.scale.setScalar((sk === 'w' ? .07 : .055) * (.85 + r() * .3)); d.m.material.opacity = 1; d.m.visible = true; d.life = 14;
  }
  // a small dust puff where the other player's shot ended (their screen decides what it hit)
  puff(p) { const O = this.O, o = this.match.M.def.o; if (!O.pfx) return; for (let i = 0; i < 3; i++) O.pfx.emit('dust', p.x + o[0], p.y + o[1], p.z + o[2], (Math.random() - .5) * .8, Math.random() * .6, (Math.random() - .5) * .8, {col: [.48, .46, .42], s0: .05, s1: .35, life: .7, a: .45, g: -.15}); }
  blood(p, d) {
    const O = this.O, o = this.match.M.def.o; if (!O.pfx) return; const X = p.x + o[0], Y = p.y + o[1], Z = p.z + o[2], r = Math.random;
    for (let i = 0; i < 7; i++) O.pfx.emit('dust', X, Y, Z, d.x * (.6 + r() * 1.2) + (r() - .5) * .9, d.y * .8 + (r() - .2) * .9, d.z * (.6 + r() * 1.2) + (r() - .5) * .9, {col: [.3, .015, .025], s0: .05 + r() * .04, s1: .3, life: .35 + r() * .25, a: .85, g: 3});
  }
  // a spent case out of the ejection port, to the right; it bounces and rolls where I stand
  shell() {
    const M = this.match, me = M.me, G = M.M.G, o = M.M.def.o; if (!this.vmR || !this.vm) return;
    if (!FX.shellGeo) FX.shellGeo = new THREE.CylinderGeometry(.0046, .0046, .044, 8).rotateZ(Math.PI / 2);
    if (!this.shells) this.shells = [];
    let sh = this.shells.find(q => q.life <= 0 && q.m.parent === G);
    if (!sh) { if (this.shells.length >= 28) sh = this.shells.reduce((x, y) => x.life < y.life ? x : y); else { const m = new THREE.Mesh(FX.shellGeo, rifleMats().brass); m.castShadow = false; sh = {m, life: 0, v: new THREE.Vector3(), w: new THREE.Vector3()}; this.shells.push(sh); G.add(m); } }
    if (sh.m.parent !== G) G.add(sh.m);
    const w = this.vmR.eject.clone(); this.vm.updateMatrixWorld(true); this.vmR.g.localToWorld(w); w.x -= o[0]; w.y -= o[1]; w.z -= o[2];
    const fx = Math.sin(me.yaw), fz = Math.cos(me.yaw), rx = -fz, rz = fx, r = Math.random, k = 1.5 + r() * .7;
    sh.m.position.copy(w); sh.v.set(rx * k - fx * .35 + me.v.x, 1.3 + r() * .8, rz * k - fz * .35 + me.v.z); sh.w.set(r() * 24 - 12, r() * 30 - 15, r() * 24 - 12);
    sh.life = 1.8; sh.fy = me.p.y + .005; sh.b = 0; sh.m.visible = true;
  }
  fxTick(dt) {
    (this.trPool || []).forEach(q => { if (q.life <= 0) return; q.t += dt; const head = Math.min(q.L, .5 + q.t * 520), tail = Math.max(0, head - q.seg);
      if (tail >= q.L - .01) { q.life = 0; q.m.visible = false; return; } q.m.position.copy(q.a).addScaledVector(q.d, tail); q.m.scale.z = Math.max(.001, head - tail); });
    (this.holes || []).forEach(q => { if (q.life > 0) { q.life -= dt; q.m.material.opacity = clamp(q.life / 2, 0, 1); if (q.life <= 0) q.m.visible = false; } });
    (this.shells || []).forEach(q => { if (q.life <= 0) return; q.life -= dt; const P = q.m.position; q.v.y -= 9.8 * dt; P.addScaledVector(q.v, dt); q.m.rotation.x += q.w.x * dt; q.m.rotation.y += q.w.y * dt; q.m.rotation.z += q.w.z * dt;
      if (P.y < q.fy) { P.y = q.fy; if (q.v.y < -.6) { q.v.y *= -.32; q.v.x *= .55; q.v.z *= .55; q.w.multiplyScalar(.5); if (!q.b) { q.b = 1; this.tink(); } } else { q.v.y = 0; q.v.x *= .9; q.v.z *= .9; q.w.multiplyScalar(.9); q.m.rotation.z = Math.PI / 2 * Math.round(q.m.rotation.z / (Math.PI / 2)); } }
      if (q.life <= 0) q.m.visible = false; });
    if (this.wflT > 0) { this.wflT -= dt; if (this.wflT <= 0 && this.wfl) this.wfl.visible = false; }
  }
  // ---------- HUD
  hud(force) {
    const M = this.match, E = this.E; if (!M) return; const me = M.me;
    const s = M.score.join(':'), hp = Math.max(0, Math.round(me.hp)), am = me.rl > 0 ? 'RELOADING' : me.ammo <= 0 && me.res <= 0 ? 'NO AMMO' : GUN.name;
    if (force || s !== this._s) { this._s = s; E.sa.textContent = M.score[0]; E.sb.textContent = M.score[1]; }
    if (force || hp !== this._hp) { this._hp = hp; E.hpb.textContent = hp; E.hpi.style.width = hp + '%'; E.hp.classList.toggle('low', hp <= 34); }
    const ak = me.ammo + '/' + me.res + am + (me.prot > 0 ? 1 : 0); if (force || ak !== this._ak) { this._ak = ak; E.am.textContent = me.ammo; E.amr.textContent = ' / ' + me.res; E.amk.textContent = am + (me.prot > 0 ? ' · SPAWN PROTECTION' : ''); E.amb.classList.toggle('low', me.ammo <= 6); }
    // crosshair gap follows the spread (in pixels at this field of view); the red dot takes over when aiming down the sight
    const px = this.O.H ? this.spread() / Math.tan(this.fov * D2R / 2) * this.O.H / 2 : 0, g = Math.round(3 + px);
    if (g !== this._g) { this._g = g; E.xt.style.top = (-g - 7) + 'px'; E.xb.style.top = g + 'px'; E.xl.style.left = (-g - 7) + 'px'; E.xr.style.left = g + 'px'; }
    E.x.style.display = me.al && M.ph !== 'end' && (me.adsK || 0) < .5 ? '' : 'none';
    E.dead.classList.toggle('on', !me.al && M.ph !== 'end'); E.low.classList.toggle('on', !!me.al && hp > 0 && hp <= 30);
    if (this.sbOn) this.board(true);
  }
  board(on) {
    this.sbOn = on; const M = this.match, e = this.E.sb2; if (!M || !on) { e.classList.remove('on'); return; }
    const acc = M.stats.shots ? Math.round(M.stats.hits / M.stats.shots * 100) + '%' : '-';
    const h = `<h3>${MAPS[M.mi].name} &middot; FIRST TO ${WIN}</h3><table><tr><th>PLAYER</th><th>KILLS</th><th>DEATHS</th><th>HEADSHOTS</th><th>ACCURACY</th></tr><tr><td>${first(this.myName()).toUpperCase()}</td><td>${M.score[0]}</td><td>${M.score[1]}</td><td>${M.stats.heads}</td><td>${acc}</td></tr><tr><td>${first(M.oppName).toUpperCase()}</td><td>${M.score[1]}</td><td>${M.score[0]}</td><td>-</td><td>-</td></tr></table>`;
    if (h !== this._sbh) { this._sbh = h; e.innerHTML = h; } e.classList.add('on');
  }
  big(t, s, ms) { const e = this.E.big; if (!t) { e.classList.remove('on'); return; } e.innerHTML = t + (s ? '<small>' + s + '</small>' : ''); e.classList.add('on'); clearTimeout(this._bt); this._bt = setTimeout(() => e.classList.remove('on'), ms || 1500); }
  hitmark(k) { const e = this.E.hm; e.classList.toggle('k', !!k); e.classList.add('on'); clearTimeout(this._ht); this._ht = setTimeout(() => e.classList.remove('on'), 90); }
  feed(a, b, hd, mine) {
    const d = document.createElement('div'); if (mine) d.className = 'me'; d.innerHTML = `${first(a).toUpperCase()}<em>${ICON.rifle}${hd ? ICON.hs : ''}</em>${first(b).toUpperCase()}`;
    this.E.kf.appendChild(d); while (this.E.kf.children.length > 4) this.E.kf.firstChild.remove(); setTimeout(() => d.remove(), 5000);
  }
  kill(hd) { this.hitmark(true); this.ding(hd ? 1.35 : 1); this.big(hd ? 'HEADSHOT' : 'ELIMINATED', ''); }
  // ---------- sounds (synthesised, follow the floor's sound setting)
  ac() { const O = this.O; if (!O || !O.opts || !O.opts.sfx) return null; const ac = O.lv && O.lv.ac; return ac && ac.state === 'running' ? ac : null; }
  vol(at) { if (!at) return 1; const c = this.O.cam.position, d = Math.hypot(at.x - c.x, at.y - c.y, at.z - c.z); return clamp(1.4 / (1 + d * .12), .08, 1); }
  noise(ac) { if (this._nz && this._nz.sampleRate === ac.sampleRate) return this._nz; const n = (ac.sampleRate * 1.5) | 0, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return (this._nz = b); }
  // a burst of filtered noise: type, frequency, peak, attack, decay, start delay
  nb(ac, out, type, f, peak, at, dec, delay = 0, q = .8) {
    const t = ac.currentTime + delay, s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = this.noise(ac); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + at); g.gain.exponentialRampToValueAtTime(.0001, t + at + dec); s.connect(fl); fl.connect(g); g.connect(out); s.start(t, Math.random(), at + dec + .05);
  }
  // a rifle shot: the crack, the body, a low thump and the room; quieter and duller when it is far away
  gunshot(v, at) {
    const ac = this.ac(); if (!ac) return; const t = ac.currentTime, k = v * this.vol(at), far = at ? 1 - this.vol(at) : 0, out = ac.createGain(); out.gain.value = .3 * k; out.connect(ac.destination);
    this.nb(ac, out, 'highpass', 1800 - far * 900, .55, .002, .045);
    this.nb(ac, out, 'lowpass', 3400 - far * 2200, .8, .003, .2);
    const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .1); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.7, t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + .14); o.connect(g); g.connect(out); o.start(t); o.stop(t + .16);
    this.nb(ac, out, 'lowpass', 900, .14, .02, .55, .01);
  }
  // reloading: the magazine comes out, the new one goes in, the bolt goes home (times in seconds into the reload)
  reloadSfx(t0, t1) {
    const at = x => t0 < x && t1 >= x, ac = (at(.25) || at(1.15) || at(1.95)) ? this.ac() : null; if (!ac) return; const out = ac.createGain(); out.gain.value = .5; out.connect(ac.destination);
    if (at(.25)) { this.nb(ac, out, 'bandpass', 2400, .25, .002, .03, 0, 2); this.nb(ac, out, 'lowpass', 1400, .2, .01, .12, .03); }
    if (at(1.15)) { this.nb(ac, out, 'bandpass', 1500, .35, .002, .05, 0, 1.4); this.tone(230, .08, .05, 'triangle', 120); }
    if (at(1.95)) { this.nb(ac, out, 'bandpass', 3000, .4, .002, .05, 0, 2.5); this.nb(ac, out, 'bandpass', 1100, .3, .002, .09, .02, 1.2); }
  }
  dry() { const ac = this.ac(); if (!ac) return; const out = ac.createGain(); out.gain.value = .4; out.connect(ac.destination); this.nb(ac, out, 'bandpass', 3200, .3, .001, .025, 0, 3); }
  // my hit on them: a dull thwack, with the metallic ding of a headshot
  hitSnd(hd) { const ac = this.ac(); if (!ac) return; const out = ac.createGain(); out.gain.value = .5; out.connect(ac.destination); this.nb(ac, out, 'lowpass', 900, .3, .002, .07, .01);
    if (hd) { this.tone(2650, .22, .06, 'triangle'); this.tone(3970, .16, .035, 'sine'); } }
  tink() { this.tone(5200 + Math.random() * 900, .05, .01, 'triangle'); }
  tone(f, d, v, type = 'sine', f2) { const ac = this.ac(); if (!ac) return; const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + .02); }
  ding(k) { this.tone(1320 * k, .35, .06, 'triangle'); setTimeout(() => this.tone(1980 * k, .3, .045, 'triangle'), 70); }
  buzz() { this.tone(160, .5, .09, 'sawtooth', 60); }
  thud(d) { this.tone(110, .12, .05 + d * .0008, 'triangle', 70); }
  beep(f, d) { this.tone(f, d, .06, 'square'); }
  click(n) { for (let i = 0; i < n; i++) setTimeout(() => this.tone(2600, .02, .05, 'square'), i * 120); }
  foot(v) { const ac = this.ac(); if (!ac) return; const t = ac.currentTime, n = (ac.sampleRate * .05) | 0, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; f.type = 'lowpass'; f.frequency.value = 700; g.gain.value = v * .4; s.connect(f); f.connect(g); g.connect(ac.destination); s.start(t); }
  leave2() {}
}
