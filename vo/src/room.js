import * as THREE from 'three';
import {mergeGeometries} from '../three/examples/jsm/utils/BufferGeometryUtils.js';
import {Batch, M, box, cyl, frondGeo, lathe, leafGeo, rbox, sph, tube} from './geo.js';
import {blobCanvas, cv, fernCanvas, foliageCanvas, frondCanvas, inlayCanvas, marbleCanvas, monsteraCanvas, neonCanvas, plateCanvas, roughCanvas, slatsCanvas, tex} from './tex.js';
import {BELLP, SEATS} from './layout.js';
import {damp, rng} from './util.js';

const std=o=>new THREE.MeshStandardMaterial(o);
const hdr=(r,g,b)=>new THREE.MeshBasicMaterial({color:new THREE.Color(r,g,b)});
function mergeLocal(list){return mergeGeometries(list.map(([g,m])=>{let n=g.index?g.toNonIndexed():g.clone();if(m)n.applyMatrix4(m);Object.keys(n.attributes).forEach(k=>{if(k!=='position'&&k!=='normal'&&k!=='uv')n.deleteAttribute(k)});return n}),false)}
function buildLounge($, J, Q) {
    let Z = std({ color: 5900828, roughness: 0.92 }), U = std({ color: 1708566, roughness: 1 }), q = std({ color: 9049648, roughness: 0.95 });
    J.add(U, box(4.2, 0.012, 3), M(-6.6, 0.006, 8.3)), J.add(q, box(4, 0.014, 2.8), M(-6.6, 0.007, 8.3)), $.add(Z, rbox(3, 0.42, 0.9, 0.1), M(-6.6, 0.21, 9.55)), $.add(Z, rbox(3, 0.62, 0.24, 0.08), M(-6.6, 0.52, 9.92)), $.add(Z, rbox(0.9, 0.42, 1.9, 0.1), M(-8.55, 0.21, 8.55)), $.add(Z, rbox(0.24, 0.62, 1.9, 0.08), M(-8.92, 0.52, 8.55)), [-8.05, -5.15].forEach((E) => $.add(Z, rbox(0.26, 0.55, 0.9, 0.08), M(E, 0.42, 9.55))), $.add(Q.walnut2, rbox(1.5, 0.08, 0.8, 0.03), M(-6.5, 0.44, 8.15)), [-7.1, -5.9].forEach((E) => [7.85, 8.45].forEach((Y) => $.add(Q.black, cyl(0.025, 0.025, 0.4, 8), M(E, 0.2, Y)))), $.add(Q.gold, cyl(0.12, 0.14, 0.04, 20), M(-6.2, 0.5, 8.15)), $.add(Q.cream, lathe([[0, 0], [0.05, 0], [0.07, 0.06], [0.06, 0.16], [0.035, 0.2], [0, 0.2]], 20), M(-6.85, 0.48, 8.15)), $.add(Z, rbox(0.85, 0.42, 0.85, 0.1), M(-4.7, 0.21, 7.3, 0, -0.6, 0)), $.add(Z, rbox(0.85, 0.55, 0.22, 0.08), M(-4.95, 0.5, 7.62, 0, -0.6, 0)), J.add(U, box(3.4, 0.012, 2.8), M(6.7, 0.006, 8.3)), J.add(q, box(3.2, 0.014, 2.6), M(6.7, 0.007, 8.3)), $.add(Q.walnut2, cyl(0.62, 0.62, 0.06, 32), M(6.7, 1.05, 8.3)), $.add(Q.black, cyl(0.05, 0.05, 1.02, 12), M(6.7, 0.52, 8.3)), $.add(Q.black, cyl(0.34, 0.38, 0.04, 24), M(6.7, 0.02, 8.3));
    for (let E = 0;E < 4; E++) {
      let Y = E / 4 * 6.283 + 0.4, K = 6.7 + Math.sin(Y) * 1, V = 8.3 + Math.cos(Y) * 1;
      $.add(Z, cyl(0.2, 0.2, 0.08, 20), M(K, 0.78, V)), $.add(Q.chrome, cyl(0.025, 0.025, 0.74, 8), M(K, 0.39, V)), $.add(Q.chrome, new THREE.TorusGeometry(0.16, 0.012, 6, 20), M(K, 0.3, V, Math.PI / 2, 0, 0));
    }
  }
function buildRoom($, J = {}) {
    let Q = { group: new THREE.Group, upd: [], desks: [] };
    $.add(Q.group);
    let Z = Q.group, U = Q.T = {};
    U.marble = tex(marbleCanvas(), { rep: [4.5, 3.2] }), U.rough = tex(roughCanvas(), { srgb: false, rep: [4.5, 3.2] }), U.walnut = tex(slatsCanvas(2, [80, 50, 30], 14, 7), { rep: [2.4, 1] }), U.walnut2 = tex(slatsCanvas(8, [62, 40, 26], 10, 5), { rep: [6, 1] }), U.ceil = tex(slatsCanvas(4, [44, 31, 22], 10, 12), { rep: [1.1, 10.3] }), U.green = tex(foliageCanvas(), { rep: [8.1, 2.3] }), U.monst = tex(monsteraCanvas()), U.frond = tex(frondCanvas()), U.fern = tex(fernCanvas()), U.blob = tex(blobCanvas()), U.inlay = tex(inlayCanvas(), { srgb: false }), U.desk = tex(slatsCanvas(6, [118, 80, 50], 5, 1), { rep: [1, 1] });
    let q = Q.mats = { floor: std({ map: U.marble, roughnessMap: U.rough, roughness: 1, metalness: 0, envMapIntensity: 0.55 }), walnut: std({ map: U.walnut, roughness: 0.6 }), walnut2: std({ map: U.walnut2, roughness: 0.55 }), ceil: std({ map: U.ceil, roughness: 0.88, color: 10132122 }), green: std({ map: U.green, roughness: 0.95 }), stone: std({ color: 1907232, roughness: 0.32, metalness: 0.05 }), black: std({ color: 789519, roughness: 0.3, metalness: 0.65 }), brass: std({ color: 11043390, roughness: 0.3, metalness: 1 }), gold: std({ color: 15119963, roughness: 0.18, metalness: 1 }), desk: std({ map: U.desk, roughness: 0.4 }), frame: std({ color: 986899, roughness: 0.32, metalness: 0.7 }), panel: std({ color: 723727, roughness: 0.2, metalness: 0.3 }), leather: std({ color: 1381658, roughness: 0.46 }), chrome: std({ color: 14737632, roughness: 0.12, metalness: 1 }), white: std({ color: 15921388, roughness: 0.32 }), key: std({ color: 1776417, roughness: 0.5 }), pot: std({ color: 1710365, roughness: 0.5 }), cream: std({ color: 14275013, roughness: 0.55 }), soil: std({ color: 2365711, roughness: 1 }), trunk: std({ color: 7692607, roughness: 0.9 }), stem: std({ color: 3104037, roughness: 0.7 }), frond: std({ map: U.frond, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 }), monst: std({ map: U.monst, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55 }), fern: std({ map: U.fern, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.75 }), paper: std({ color: 16052974, roughness: 0.8 }), succ: std({ color: 6265442, roughness: 0.6 }), ledW: hdr(3, 2.3, 1.6), ledT: hdr(0.3, 2.4, 2.1), down: hdr(3.2, 2.6, 2), cabL: hdr(3.8, 3.2, 2.5), cab: std({ color: 8017462, roughness: 0.4, metalness: 0.35, side: THREE.BackSide }), blob: new THREE.MeshBasicMaterial({ color: 0, map: U.blob, transparent: true, depthWrite: false, opacity: 0.85 }) }, E = new Batch, Y = new Batch, K = new Batch, V = new THREE.PlaneGeometry(20.2, 18.6);
    V.rotateX(-Math.PI / 2), V.translate(0, 0, 2.3), Q.floor = new THREE.Mesh(V, q.floor), Q.floor.receiveShadow = true, Z.add(Q.floor);
    let X = new THREE.PlaneGeometry(2.6, 2.6);
    X.rotateX(-Math.PI / 2), Q.inlay = new THREE.Mesh(X, std({ color: 14922844, metalness: 1, roughness: 0.26, alphaMap: U.inlay, alphaTest: 0.5 })), Q.inlay.position.set(0, 0.003, 7.6), Q.inlay.scale.setScalar(1.25), Q.inlay.receiveShadow = true, Z.add(Q.inlay), Y.add(q.walnut, box(8.78, 5.2, 0.3), M(-0.94, 2.6, -7.15)), Y.add(q.green, box(0.3, 5.2, 9.5), M(-10.15, 2.6, -2.25)), Y.add(q.green, box(0.3, 5.2, 6.9), M(-10.15, 2.6, 8.15)), Y.add(q.green, box(0.3, 2.6, 2.2), M(-10.15, 3.9, 3.6)), Y.add(q.walnut2, box(0.3, 5.2, 18.6), M(10.15, 2.6, 2.3)), Y.add(q.ceil, box(20.6, 0.2, 18.8), M(0, 5.3, 2.3));
    {
      let m = new THREE.Mesh(new THREE.PlaneGeometry(20.6, 5.2), std({ map: U.walnut2, roughness: 0.55, color: 9079434 }));
      m.rotation.y = Math.PI, m.position.set(0, 2.6, 11.75), m.receiveShadow = true, Z.add(m);
      let t = new THREE.Mesh(new THREE.PlaneGeometry(20.6, 0.12), std({ color: 789519, roughness: 0.3, metalness: 0.65 }));
      t.rotation.y = Math.PI, t.position.set(0, 0.06, 11.74), Z.add(t);
    }
    Y.add(q.stone, box(1.18, 5.2, 0.3), M(9.41, 2.6, -7.15)), [-10, -9, -7.165, -5.33, 3.45, 5.22, 7].forEach((m) => E.add(q.black, box(0.07, 5.2, 0.14), M(m, 2.6, -7))), [[-7.165, 3.74], [5.225, 3.55], [-9.5, 1]].forEach(([m, t]) => {
      E.add(q.black, box(t, 0.12, 0.16), M(m, 5.14, -7)), E.add(q.black, box(t, 0.08, 0.18), M(m, 0.04, -7)), E.add(q.black, box(t, 0.045, 0.1), M(m, 4.25, -7));
    }), Y.add(q.stone, box(0.35, 5.2, 0.3), M(7.175, 2.6, -7.15)), Y.add(q.stone, box(0.35, 5.2, 0.3), M(8.825, 2.6, -7.15)), Y.add(q.stone, box(1.3, 2.7, 0.3), M(8, 3.85, -7.15)), E.add(q.brass, box(0.06, 2.56, 0.07), M(7.33, 1.28, -6.98)), E.add(q.brass, box(0.06, 2.56, 0.07), M(8.67, 1.28, -6.98)), E.add(q.brass, box(1.4, 0.06, 0.07), M(8, 2.53, -6.98));
    let W = new THREE.Mesh(box(1.3, 2.5, 1.6), q.cab);
    W.position.set(8, 1.25, -8.1), W.receiveShadow = true, Z.add(W);
    let H = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.2), q.cabL);
    H.rotation.x = Math.PI / 2, H.position.set(8, 2.48, -8.1), Z.add(H);
    let N = box(0.66, 2.5, 0.04), F = new THREE.Mesh(N, q.brass), G = new THREE.Mesh(N, q.brass);
    F.position.set(7.67, 1.25, -7.06), G.position.set(8.33, 1.25, -7.06), F.castShadow = G.castShadow = true, Z.add(F, G);
    let _ = new THREE.PointLight(16766362, 0, 7, 2);
    _.position.set(8, 2.1, -7.5), Z.add(_);
    let D = cv(256, 96), O = D.getContext("2d");
    O.fillStyle = "#050505", O.fillRect(0, 0, 256, 96), O.fillStyle = "#ffb347", O.font = "bold 54px Verdana", O.textAlign = "center", O.textBaseline = "middle", O.fillText("▲ PH", 128, 50);
    let I = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.19), new THREE.MeshBasicMaterial({ map: tex(D, { mips: false }), color: new THREE.Color(1.6, 1.6, 1.6) }));
    I.position.set(8, 2.78, -6.99), Z.add(I), Q.elev = { dL: F, dR: G, light: _, o: 0, hold: 0 }, Q.elevOpen = (m) => {
      Q.elev.hold = Math.max(Q.elev.hold, m);
    }, E.add(q.walnut2, rbox(6.6, 0.42, 0.5, 0.03), M(-0.94, 0.52, -6.72)), K.add(q.ledW, box(6.4, 0.012, 0.02), M(-0.94, 0.3, -6.55)), E.add(q.gold, lathe([[0, 0], [0.08, 0], [0.08, 0.02], [0.03, 0.04], [0.025, 0.12], [0.06, 0.16], [0.085, 0.24], [0.07, 0.3], [0, 0.3]], 28), M(-3.3, 0.73, -6.72)), E.add(q.gold, cyl(0.03, 0.03, 0.05, 16), M(-3.3, 1.05, -6.72)), [[0.36, 0.06, 0.26, "#7a1020"], [0.33, 0.05, 0.24, "#e9e3d6"], [0.35, 0.07, 0.25, "#1d1d24"]].forEach((m, t) => E.add(std({ color: m[3], roughness: 0.6 }), box(m[0], m[1], m[2]), M(0.75, 0.76 + t * 0.065, -6.72, 0, 0.08 * t, 0))), E.add(q.cream, lathe([[0, 0], [0.07, 0], [0.1, 0.08], [0.09, 0.22], [0.05, 0.3], [0.055, 0.34], [0, 0.34]], 28), M(1.85, 0.73, -6.72));
    let B = rng(77);
    for (let m = 0;m < 6; m++) {
      let t = m / 6 * 6.28 + B(), d = 0.5 + B() * 0.35;
      E.add(q.stem, tube([[1.85, 1.02, -6.72], [1.85 + Math.sin(t) * 0.08, 1.02 + d * 0.6, -6.72 + Math.cos(t) * 0.06], [1.85 + Math.sin(t) * 0.16, 1.02 + d, -6.72 + Math.cos(t) * 0.12]], 0.006, 8, 4)), E.add(q.monst, leafGeo(0.2, 0.26, 0.15, 0.2), M(1.85 + Math.sin(t) * 0.16, 1.02 + d, -6.72 + Math.cos(t) * 0.12, 0.6, t, 0));
    }
    let k = rng(31), z = (m, t) => {
      E.add(q.pot, rbox(t, 0.46, 0.44, 0.02), M(m, 0.23, -6.72)), Y.add(q.soil, box(t - 0.06, 0.02, 0.38), M(m, 0.45, -6.72));
      let d = Math.round(t * 3.2);
      for (let R0 = 0;R0 < d; R0++) {
        let y0 = m - t / 2 + 0.15 + (R0 + k() * 0.6) / d * (t - 0.3), M0 = 0.55 + k() * 0.4;
        for (let w0 = 0;w0 < 2; w0++)
          E.add(q.fern, new THREE.PlaneGeometry(0.55 * M0, 0.5 * M0).translate(0, 0.25 * M0, 0), M(y0, 0.44, -6.72 + (k() - 0.5) * 0.16, 0, w0 * 1.57 + k() * 0.6, 0));
      }
    };
    z(-7.165, 3.5), z(5, 2.7), E.add(q.gold, cyl(0.24, 0.3, 0.06, 32), M(BELLP.x, 0.03, BELLP.z)), E.add(q.walnut2, cyl(0.045, 0.055, 1.78, 16), M(BELLP.x, 0.92, BELLP.z)), E.add(q.gold, box(0.5, 0.05, 0.06), M(BELLP.x + 0.2, 1.79, BELLP.z));
    let M__L = new THREE.Group;
    M__L.position.set(BELLP.hx, BELLP.hy, BELLP.z), M__L.scale.setScalar(1.55), Z.add(M__L);
    let v = new THREE.SpotLight(16766362, 22, 0, 0.45, 0.6, 2);
    v.position.set(BELLP.hx - 0.4, 4.6, BELLP.z + 1.2), v.target.position.set(BELLP.hx, BELLP.hy - 0.3, BELLP.z), Z.add(v, v.target);
    let g = new THREE.Mesh(lathe([[0, 0], [0.03, 0], [0.05, -0.02], [0.058, -0.06], [0.066, -0.12], [0.08, -0.19], [0.1, -0.245], [0.125, -0.285], [0.136, -0.3], [0.12, -0.306], [0.1, -0.29], [0.08, -0.25], [0.062, -0.16], [0.05, -0.08], [0.035, -0.03], [0, -0.02]], 48), q.gold);
    g.material = q.gold.clone(), g.material.side = THREE.DoubleSide, g.castShadow = true, M__L.add(g);
    let R = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.008, 8, 16), q.gold);
    R.position.y = 0.02, M__L.add(R);
    let C = new THREE.Mesh(sph(0.024, 12, 8), q.brass);
    C.position.y = -0.28, M__L.add(C);
    let p = new THREE.Mesh(cyl(0.006, 0.006, 0.34, 6), std({ color: 14206622, roughness: 0.9 }));
    p.position.y = -0.45, M__L.add(p), Q.bell = { g: M__L, t: -99, amp: 0 }, Q.ring = (m = 1) => {
      Q.bell.t = 0, Q.bell.amp = Math.min(1.4, Q.bell.amp + m);
    };
    let i = (m, t, d, R0, y0, M0, w0, b, L) => {
      let r = neonCanvas(m, { col: w0, core: b }), Y0 = new THREE.Mesh(new THREE.PlaneGeometry(t, d), new THREE.MeshBasicMaterial({ map: tex(r, { mips: true }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(L, L, L), toneMapped: false }));
      return Y0.position.set(R0, y0, M0), Z.add(Y0), Y0;
    };
    Q.neon = i("Only Winners", 3.3, 0.83, -7.165, 3.3, -6.8, "#ff2d78", "#fff0f6", 2.6), E.add(q.black, cyl(0.004, 0.004, 1.45, 4), M(-8.5, 4.4, -6.8)), E.add(q.black, cyl(0.004, 0.004, 1.6, 4), M(-5.83, 4.4, -6.8)), Q.neon2 = i("Ring the bell", 1.8, 0.45, 8, 3.55, -6.985, "#ffb43a", "#fff6dd", 3.6);
    {
      let m = i("Only Winners & Quitters", 7.2, 1.5, 0, 3.3, 11.7, "#ff2d78", "#fff0f6", 2.2);
      m.rotation.y = Math.PI;
    }
    let e = new THREE.PointLight(16723826, 7, 10, 2);
    e.position.set(-7.165, 3.2, -6.2), Z.add(e), Q.neonLight = e, [-3.3, 3.3].forEach((m) => {
      E.add(q.black, box(0.1, 0.07, 16.4), M(m, 4.76, 2)), K.add(q.ledW, box(0.06, 0.012, 16.3), M(m, 4.722, 2)), [-5.6, 2, 9.6].forEach((t) => E.add(q.black, cyl(0.004, 0.004, 0.42, 4), M(m, 5, t)));
    });
    for (let m of [-8.5, -5.5, -2.5, 0, 2.5, 5.5, 8.5])
      for (let t of [-5.6, -2.4, 0.8, 4, 7.2, 10.4]) {
        let d = new THREE.CircleGeometry(0.07, 16);
        d.rotateX(Math.PI / 2), K.add(q.down, d, M(m, 5.198, t));
      }
    let V0 = mergeLocal([[rbox(0.54, 0.1, 0.52, 0.04), M(0, 0.47, 0)], [rbox(0.52, 0.66, 0.09, 0.04), M(0, 0.92, -0.27, -0.1, 0, 0)], [rbox(0.34, 0.14, 0.08, 0.03), M(0, 1.33, -0.32, -0.1, 0, 0)], [rbox(0.05, 0.03, 0.3, 0.012), M(0.29, 0.67, -0.02)], [rbox(0.05, 0.03, 0.3, 0.012), M(-0.29, 0.67, -0.02)], [box(0.03, 0.17, 0.03), M(0.29, 0.58, -0.05)], [box(0.03, 0.17, 0.03), M(-0.29, 0.58, -0.05)]]), l = [[cyl(0.026, 0.026, 0.3, 12), M(0, 0.27, 0)]];
    for (let m = 0;m < 5; m++) {
      let t = m / 5 * 6.283;
      l.push([box(0.04, 0.03, 0.32), M(Math.sin(t) * 0.16, 0.07, Math.cos(t) * 0.16, 0, t, 0)]), l.push([sph(0.026, 8, 6), M(Math.sin(t) * 0.31, 0.03, Math.cos(t) * 0.31)]);
    }
    let A0 = mergeLocal(l), J0 = new THREE.PlaneGeometry(1, 1);
    J0.rotateX(-Math.PI / 2), SEATS.forEach((m) => {
      let { x: t, z: d } = m;
      E.add(q.desk, rbox(1.9, 0.05, 0.82, 0.015), M(t, 0.735, d)), E.add(q.frame, box(0.045, 0.71, 0.74), M(t - 0.9, 0.355, d)), E.add(q.frame, box(0.045, 0.71, 0.74), M(t + 0.9, 0.355, d)), E.add(q.panel, box(1.76, 0.42, 0.02), M(t, 0.47, d + 0.36)), E.add(q.key, rbox(0.44, 0.022, 0.14, 0.008), M(t, 0.771, d - 0.3)), E.add(q.key, rbox(0.06, 0.025, 0.1, 0.012), M(t + 0.34, 0.772, d - 0.28)), E.add(q.white, cyl(0.04, 0.036, 0.1, 16), M(t - 0.68, 0.81, d - 0.06)), E.add(q.white, new THREE.TorusGeometry(0.025, 0.007, 6, 12), M(t - 0.722, 0.815, d - 0.06, 0, Math.PI / 2, 0)), E.add(q.black, box(1.02, 0.02, 0.05), M(t, 0.77, d + 0.22)), K.add(q.ledT, box(0.98, 0.006, 0.012), M(t, 0.782, d + 0.245)), E.add(q.cream, cyl(0.05, 0.04, 0.08, 16), M(t + 0.72, 0.8, d + 0.15));
      for (let b0 = 0;b0 < 5; b0++)
        E.add(q.succ, sph(0.026, 8, 6), M(t + 0.72 + Math.sin(b0 * 1.3) * 0.024, 0.85 + b0 % 2 * 0.012, d + 0.15 + Math.cos(b0 * 1.3) * 0.024, 0, 0, 0, 1, 1.3, 1));
      E.add(q.paper, box(0.21, 0.006, 0.29), M(t - 0.38, 0.763, d + 0.02, 0, 0.25, 0));
      let R0 = new THREE.Mesh(J0, q.blob);
      R0.scale.set(2.3, 1, 1.25), R0.position.set(t, 0.004, d - 0.05), R0.layers.set(1), R0.renderOrder = 1, Z.add(R0);
      let y0 = new THREE.Mesh(box(1.7, 0.014, 0.014), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.12, 0.3) }));
      y0.position.set(t, 0.27, d + 0.375), Z.add(y0);
      let M0 = plateCanvas(""), w0 = tex(M0, { mips: true }), b = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.105), std({ map: w0, emissiveMap: w0, emissive: 16777215, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.2 }));
      b.position.set(t, 0.56, d + 0.372), Z.add(b);
      let L = cv(512, 154), r = tex(L, { mips: false }), Y0 = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.3), new THREE.MeshBasicMaterial({ map: r, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, color: new THREE.Color(1.5, 1.5, 1.5), toneMapped: false }));
      Y0.position.set(t, 0.925, d + 0.235), Y0.visible = false, Z.add(Y0);
      let F0 = new THREE.Group, W0 = new THREE.Mesh(V0, q.leather), a0 = new THREE.Mesh(A0, q.chrome);
      W0.castShadow = a0.castShadow = true, W0.receiveShadow = true, F0.add(W0, a0);
      let v0 = new THREE.Mesh(J0, q.blob);
      v0.scale.set(0.85, 1, 0.85), v0.position.y = 0.005, v0.layers.set(1), v0.renderOrder = 1, F0.add(v0), F0.position.set(t, 0, d - 0.42), F0.rotation.y = (rng(m.i * 7 + 3)() - 0.5) * 0.5, Z.add(F0), Q.desks.push({ seat: m, led: y0, plate: b, pc: M0, pt: w0, holo: Y0, hc: L, ht: r, chair: F0, name: "", occ: 0, ct: d - 0.42, cy: F0.rotation.y, hT: 0 });
    });
    let T0 = (m, t, d, R0, y0) => {
      let M0 = rng(R0);
      E.add(y0 ? q.pot : q.cream, lathe([[0, 0], [0.3, 0], [0.34, 0.05], [0.38, 0.6], [0.35, 0.63], [0.32, 0.59], [0, 0.59]], 32), M(m, 0, t, 0, 0, 0, d)), Y.add(q.soil, cyl(0.33, 0.33, 0.02, 24), M(m, 0.59 * d, t, 0, 0, 0, d));
      for (let w0 = 0;w0 < 4; w0++) {
        let b = M0() * 6.283, L = 0.1 + M0() * 0.18, r = (1.5 + M0() * 1.1) * d, Y0 = [m + Math.sin(b) * L * r, 0.6 * d + r, t + Math.cos(b) * L * r];
        E.add(q.trunk, tube([[m + (M0() - 0.5) * 0.1 * d, 0.6 * d, t + (M0() - 0.5) * 0.1 * d], [(m + Y0[0]) / 2, 0.6 * d + r * 0.55, (t + Y0[2]) / 2], Y0], 0.024 * d, 12, 6));
        let F0 = 5 + (M0() * 3 | 0);
        for (let W0 = 0;W0 < F0; W0++) {
          let a0 = W0 / F0 * 6.283 + M0() * 0.5, v0 = (0.85 + M0() * 0.5) * d, b0 = 0.3 + M0() * 0.55;
          E.add(q.frond, frondGeo(v0, 0.44 * d, 0.5 + M0() * 0.35, 12, 0.3), M(Y0[0], Y0[1], Y0[2], 0, a0, b0));
        }
      }
    }, L0 = (m, t, d, R0) => {
      let y0 = rng(R0);
      E.add(q.pot, lathe([[0, 0], [0.22, 0], [0.27, 0.42], [0.25, 0.44], [0, 0.44]], 28), M(m, 0, t, 0, 0, 0, d)), Y.add(q.soil, cyl(0.25, 0.25, 0.02, 20), M(m, 0.43 * d, t, 0, 0, 0, d));
      for (let M0 = 0;M0 < 9; M0++) {
        let w0 = M0 / 9 * 6.283 + y0() * 0.5, b = 0.75 + y0() * 0.55, L = (0.35 + y0() * 0.5) * d, r = m + Math.sin(w0) * 0.25 * d, Y0 = t + Math.cos(w0) * 0.25 * d, F0 = 0.44 * d + L;
        E.add(q.stem, tube([[m, 0.44 * d, t], [(m + r) / 2, 0.44 * d + L * 0.7, (t + Y0) / 2], [r, F0, Y0]], 0.009 * d, 10, 5)), E.add(q.monst, leafGeo(0.55 * d, 0.6 * d, 0.16, 0.22), M(r, F0, Y0, b, w0, 0));
      }
    };
    T0(-9.3, -6.25, 1.1, 5), T0(9.1, 10.7, 1.25, 9, 1), L0(-9.25, 10.6, 1.25, 4), L0(-9.35, -2.3, 1, 12), L0(-9.35, 1.9, 0.9, 21), T0(9.2, 6.1, 1, 17, 1), L0(-9.3, 6.8, 1.1, 23), buildLounge(E, Y, q), Q.static = [...E.build(Z, { cast: true, receive: true }), ...Y.build(Z, { cast: false, receive: true }), ...K.build(Z, { cast: false, receive: false })];
    let G0 = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: {}, vertexShader: "varying vec3 vW;varying vec2 vU;void main(){vU=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}", fragmentShader: "varying vec3 vW;varying vec2 vU;void main(){vec3 V=normalize(cameraPosition-vW);float f=pow(1.-abs(V.z),3.);float s=smoothstep(.0,.5,vU.y)*(.6+.4*sin(vU.x*9.+vU.y*3.));vec3 c=vec3(.5,.58,.78)*(.012+.05*f)+vec3(.9,.7,.6)*.01*s;gl_FragColor=vec4(c,.05+.22*f);}" });
    Q.glass = [], [[-7.165, 3.67], [5.225, 3.5], [-9.5, 0.93]].forEach(([m, t]) => {
      let d = new THREE.Mesh(new THREE.PlaneGeometry(t, 5.1), G0);
      d.position.set(m, 2.6, -7.03), d.renderOrder = 5, Z.add(d), Q.glass.push(d);
    });
    let $0 = 96, j = $0 / 3.448, u = new THREE.PlaneGeometry($0 * 1.44, j, 1, 1), Q0 = u.attributes.uv;
    for (let m = 0;m < Q0.count; m++)
      Q0.setX(m, -0.22 + Q0.getX(m) * 1.44);
    let K0 = cv(4, 4), N0 = K0.getContext("2d"), x = N0.createLinearGradient(0, 0, 0, 4);
    x.addColorStop(0, "#2b2a6a"), x.addColorStop(1, "#f08a5a"), N0.fillStyle = x, N0.fillRect(0, 0, 4, 4);
    let n = { map: { value: tex(K0, { mips: false }) }, uK: { value: 0.62 } }, X0 = new THREE.ShaderMaterial({ uniforms: n, depthWrite: true, vertexShader: "varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}", fragmentShader: "uniform sampler2D map;uniform float uK;varying vec2 vU;void main(){vec3 c=texture2D(map,vU).rgb;float m=max(c.r,max(c.g,c.b));vec3 h=c*(1.+5.*smoothstep(.42,.95,m)*smoothstep(.3,1.,m));gl_FragColor=vec4(h*uK,1.);}" }), Z0 = new THREE.Mesh(u, X0);
    Z0.position.set(0, -8.95 + j / 2, -48), Z.add(Z0), Q.backdrop = Z0, Q.setPhoto = (m) => {
      if (!m)
        return;
      let t = new Image;
      t.onload = () => {
        let d = new THREE.Texture(t);
        d.colorSpace = THREE.SRGBColorSpace, d.wrapS = THREE.MirroredRepeatWrapping, d.wrapT = THREE.ClampToEdgeWrapping, d.anisotropy = 8, d.needsUpdate = true, n.map.value = d;
      }, t.src = m;
    };
    let S = Q.lights = {};
    return S.hemi = new THREE.HemisphereLight(10466303, 2890514, 0.5), Z.add(S.hemi), S.key = new THREE.SpotLight(16766378, 80, 0, 0.98, 0.85, 2), S.key.position.set(0.4, 5.05, 1.4), S.key.target.position.set(0, 0, -1.7), S.key.castShadow = true, S.key.shadow.mapSize.set(2048, 2048), S.key.shadow.bias = -0.00035, S.key.shadow.normalBias = 0.035, S.key.shadow.camera.near = 1.5, S.key.shadow.camera.far = 14, Z.add(S.key, S.key.target), S.sl = new THREE.SpotLight(16765088, 42, 0, 0.85, 0.9, 2), S.sl.position.set(-5.7, 5.05, -1.2), S.sl.target.position.set(-5.7, 0, -1.7), Z.add(S.sl, S.sl.target), S.sr = new THREE.SpotLight(16765088, 42, 0, 0.85, 0.9, 2), S.sr.position.set(5.7, 5.05, -1.2), S.sr.target.position.set(5.7, 0, -1.7), Z.add(S.sr, S.sr.target), S.rim = new THREE.DirectionalLight(16751734, 1.25), S.rim.position.set(-4, 7, -22), S.rim.target.position.set(0, 1, 0), Z.add(S.rim, S.rim.target), S.front = new THREE.PointLight(16769732, 5, 0, 2), S.front.position.set(0, 3.7, 9.2), Z.add(S.front), S.lounge = new THREE.SpotLight(16765088, 46, 0, 1, 0.9, 2), S.lounge.position.set(0, 5.05, 7.6), S.lounge.target.position.set(0, 0, 8.2), Z.add(S.lounge, S.lounge.target), Q.update = (m, t) => {
      let d = Q.elev;
      d.hold = Math.max(0, d.hold - m);
      let R0 = d.hold > 0 ? 1 : 0;
      d.o = damp(d.o, R0, R0 ? 4 : 3, m);
      let y0 = d.o;
      d.dL.position.x = 7.67 - 0.62 * y0, d.dR.position.x = 8.33 + 0.62 * y0, d.light.intensity = y0 * 9;
      let M0 = Q.bell;
      M0.t += m, M0.amp = Math.max(0, M0.amp - m * 0.35), M0.g.rotation.z = Math.sin(M0.t * 9) * 0.38 * M0.amp * Math.exp(-M0.t * 0.35), Q.neonLight.intensity = 6.5 + Math.sin(t * 1.7) * 0.4 + (Math.random() < 0.004 ? -4 : 0), Q.desks.forEach((w0) => {
        let b = w0.occ ? w0.seat.cz : w0.seat.z - 0.42;
        w0.chair.position.z = damp(w0.chair.position.z, b, 5, m), w0.chair.rotation.y = damp(w0.chair.rotation.y, w0.occ ? w0.sway || 0 : w0.cy, 4, m);
      });
    }, Q.setPlate = (m, t) => {
      if (m.name === t)
        return;
      m.name = t;
      let d = plateCanvas(t ? t : "");
      m.pc.getContext("2d").drawImage(d, 0, 0), m.pt.needsUpdate = true;
    }, Q;
  }

export {buildRoom};
