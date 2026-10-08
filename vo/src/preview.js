import * as THREE from 'three';
import {RoomEnvironment} from '../three/examples/jsm/environments/RoomEnvironment.js';
import {box, cyl, rbox} from './geo.js';
import {EXT, buildCar, rgbTick, styleDesk} from './cosm.js';
import {Avatar, lookCode, parseLook} from './avatar.js';

var GLOK = null;
function glOK() {
    if (GLOK !== null)
      return GLOK;
    try {
      let J = document.createElement("canvas").getContext("webgl2");
      if (GLOK = !!J, J) {
        let Q = J.getExtension("WEBGL_lose_context");
        Q && Q.loseContext();
      }
    } catch ($) {
      GLOK = false;
    }
    return GLOK;
  }
function mkRenderer($, J, Q) {
    let Z = new THREE.WebGLRenderer({ canvas: $, antialias: true, alpha: true, powerPreference: "low-power" });
    return Z.setPixelRatio(1), Z.setSize(J, Q, false), Z.outputColorSpace = THREE.SRGBColorSpace, Z.toneMapping = THREE.NeutralToneMapping, Z.toneMappingExposure = 1.05, Z.setClearColor(0, 0), Z;
  }
function mkScene($) {
    let J = new THREE.Scene, Q = new THREE.PMREMGenerator($);
    J.environment = Q.fromScene(new RoomEnvironment, 0.04).texture, J.environmentIntensity = 0.6, Q.dispose(), J.add(new THREE.HemisphereLight(16777215, 3809328, 1));
    let Z = new THREE.DirectionalLight(16773862, 2.6);
    Z.position.set(2.5, 4, 3.5), J.add(Z);
    let U = new THREE.DirectionalLight(16726634, 1.8);
    U.position.set(-3, 2.5, -2.5), J.add(U);
    let q = new THREE.DirectionalLight(9091327, 0.7);
    return q.position.set(-3, 1, 3), J.add(q), J;
  }
var MATS = {};
var mat = ($, J) => MATS[$] || (MATS[$] = new THREE.MeshStandardMaterial(J));
function deskStage($, J) {
    let Q = new THREE.Group, Z = mat("lt", { color: "#1b1b20", roughness: 0.45 }), U = mat("ch", { color: "#d8dbe2", roughness: 0.15, metalness: 1 }), q = new THREE.Group;
    [[rbox(0.54, 0.1, 0.52, 0.04), 0, 0.47, 0, 0], [rbox(0.52, 0.66, 0.09, 0.04), 0, 0.92, -0.27, -0.1], [rbox(0.34, 0.14, 0.08, 0.03), 0, 1.33, -0.32, -0.1]].forEach(([K, V, X, W, H]) => {
      let N = new THREE.Mesh(K, Z);
      N.position.set(V, X, W), N.rotation.x = H, q.add(N);
    });
    let E = new THREE.Group, Y = new THREE.Mesh(cyl(0.026, 0.026, 0.3, 12), U);
    Y.position.y = 0.27, E.add(Y);
    for (let K = 0;K < 5; K++) {
      let V = K / 5 * 6.283, X = new THREE.Mesh(box(0.04, 0.03, 0.32), U);
      X.position.set(Math.sin(V) * 0.16, 0.07, Math.cos(V) * 0.16), X.rotation.y = V, E.add(X);
    }
    if (Q.add(q, E), $.add(Q), !J) {
      Q.position.set(0, 0, -0.42);
      let K = mat("wd", { color: "#6b4425", roughness: 0.55 }), V = mat("fr", { color: "#2a2a30", roughness: 0.5, metalness: 0.4 }), X = new THREE.Mesh(rbox(1.9, 0.05, 0.82, 0.015), K);
      X.position.y = 0.735, $.add(X), [-1, 1].forEach((N) => {
        let F = new THREE.Mesh(box(0.045, 0.71, 0.74), V);
        F.position.set(N * 0.9, 0.355, 0), $.add(F);
      });
      let W = new THREE.Mesh(box(1.76, 0.42, 0.02), V);
      W.position.set(0, 0.47, 0.36), $.add(W);
      let H = new THREE.Mesh(rbox(0.44, 0.022, 0.14, 0.008), mat("kb", { color: "#101014", roughness: 0.4 }));
      H.position.set(0, 0.771, -0.3), $.add(H);
    }
    return { seat: { x: 0, z: 0 }, chair: Q };
  }
function stageFor($, J, Q, Z) {
    let U = new THREE.Group, q = null, E = null, Y = null, K = null;
    if ("skoHBGV".indexOf($) >= 0 || $ === "em") {
      let V = parseLook(Q || "", Z || "You");
      if ($ !== "em")
        V[$] = J;
      if ($ === "V")
        V.m = 0;
      let X = new Avatar({ id: "pv" + Math.random(), nm: Z || "You", look: lookCode(V) });
      if (X.mode = "stand", X.sitK = 0, X.standK = 0, U.add(X.root), K = X, E = { t: [0, 0.82, 0], d: 3.3, el: 0.08 }, $ === "H" || $ === "G" || $ === "B") {
        X.root.updateMatrixWorld(true);
        let H = new THREE.Box3().setFromObject($ === "B" ? X.root : X.head), N = H.getBoundingSphere(new THREE.Sphere);
        if (E = { t: [0, N.center.y, 0], d: Math.max($ === "B" ? 2.6 : 1.15, N.radius / Math.sin(15 * Math.PI / 180) * 1.06), el: 0.1 }, $ === "B" && [7, 8, 14, 16].indexOf(J) >= 0)
          E.az = Math.PI * 0.78;
        if ($ === "G")
          E.az = 0.95;
      }
      let W = 0;
      Y = (H, N, F) => {
        if ($ === "V")
          X.level(0.35 + 0.3 * Math.abs(Math.sin(N * 7)), 0.5);
        if ($ === "em") {
          if (W -= H, W <= 0)
            X.emote(J), W = (X.emo ? X.emo.d : 2.4) + 0.9;
        }
        X.update(H, N, F);
      };
    } else if ($ === "J") {
      let V = EXT.blaster(J);
      if (!V)
        return null;
      U.add(V), q = V, Y = (X, W) => {
        if (V.userData.up)
          V.userData.up(W);
      };
    } else if ($ === "W") {
      let V = buildCar(J);
      if (!V)
        return null;
      U.add(V), q = V;
    } else if ($ === "F") {
      let V = EXT.plane(J);
      if (!V)
        return null;
      U.add(V), q = V, Y = (X, W) => {
        if (V.userData.spin)
          V.userData.spin(W);
      };
    } else if ("DCIR".indexOf($) >= 0) {
      let V = deskStage(U, $ === "R");
      if (styleDesk(V, { [$]: J }, U), $ === "C")
        V.chair.visible = false;
      Y = (X, W) => {
        if (V.up)
          V.up(W);
        rgbTick(W);
      }, E = $ === "C" ? { t: [0, 1, 0], d: 2.7, el: 0.25, az: Math.PI + 0.35 } : $ === "I" ? { t: [0.42, 0.86, 0.24], d: 0.8, el: 0.35, az: 0.5 } : $ === "R" ? { t: [0, 0.78, 0], d: 3.1, el: 0.16, az: 0.6 } : { t: [0, 0.7, 0], d: 3.4, el: 0.42, az: 0.5 };
    } else
      return null;
    if (E && (E.t[0] || E.t[2])) {
      let V = new THREE.Group;
      return U.position.set(-E.t[0], 0, -E.t[2]), V.add(U), E.t = [0, E.t[1], 0], { g: V, fit: q, cam: E, up: Y, av: K, k: $ };
    }
    return { g: U, fit: q, cam: E, up: Y, av: K, k: $ };
  }
function frame($, J, Q, Z = 1) {
    let U, q, E = 0.2, Y = 30;
    if ($.cam) {
      if (U = new THREE.Vector3(...$.cam.t), q = $.cam.d, E = $.cam.el, $.cam.az != null)
        Q = $.cam.az;
    } else {
      let K = meshBox($.fit || $.g), V = K.getBoundingSphere(new THREE.Sphere);
      U = V.center, q = V.radius / Math.sin(Y * Math.PI / 360) * ($.k === "F" ? 0.8 : 1.02), E = 0.22;
    }
    if (Z < 1)
      q /= Math.max(0.45, Z);
    return J.fov = Y, J.aspect = Z, J.position.set(U.x + Math.sin(Q) * Math.cos(E) * q, U.y + Math.sin(E) * q, U.z + Math.cos(Q) * Math.cos(E) * q), J.near = q / 60, J.far = q * 20, J.lookAt(U), J.updateProjectionMatrix(), { t: U, d: q };
  }
function meshBox($) {
    $.updateMatrixWorld(true);
    let J = new THREE.Box3, Q = new THREE.Box3;
    if ($.traverse((Z) => {
      if (Z.isMesh && Z.geometry && Z.visible) {
        if (!Z.geometry.boundingBox)
          Z.geometry.computeBoundingBox();
        Q.copy(Z.geometry.boundingBox).applyMatrix4(Z.matrixWorld), J.union(Q);
      }
    }), J.isEmpty())
      J.setFromObject($);
    return J;
  }
function disposeAll($) {
    $.traverse((J) => {
      if (J.geometry && !J.isSprite && J.geometry.dispose)
        J.geometry.dispose();
    });
  }
var SHARED = null;
var QUEUE = Promise.resolve();
var CACHE = new Map;
function render1($, J, Q) {
    if (!glOK())
      return null;
    let Z = Q.size || 192;
    if (!SHARED) {
      let X = document.createElement("canvas"), W = mkRenderer(X, Z, Z);
      SHARED = { r: W, sc: mkScene(W), cam: new THREE.PerspectiveCamera(30, 1, 0.05, 200) };
    }
    let { r: U, sc: q, cam: E } = SHARED;
    if (U.domElement.width !== Z)
      U.setSize(Z, Z, false);
    let Y = stageFor($, J, Q.base, Q.nm);
    if (!Y)
      return null;
    q.add(Y.g);
    let K = { cam: new THREE.Vector3, focusSpeaker: null, shareStart: 0 };
    if (frame(Y, E, Y.av ? 0.35 : 0.62), K.cam.copy(E.position), Y.up) {
      let X = $ === "em" ? 34 : 8, W = 0;
      for (let H = 0;H < X; H++)
        W += 0.03333333333333333, Y.up(0.03333333333333333, W, K);
    }
    U.render(q, E);
    let V = U.domElement.toDataURL("image/png");
    q.remove(Y.g);
    try {
      if (Y.av)
        Y.av.dispose();
    } catch (X) {}
    return disposeAll(Y.g), V;
  }
function thumb($, J, Q = {}) {
    if (!glOK())
      return Promise.resolve(null);
    let Z = $ + ":" + J + "|" + (Q.base || "") + "|" + (Q.size || 192);
    if (CACHE.has(Z))
      return CACHE.get(Z);
    let U = QUEUE = QUEUE.then(() => new Promise((q) => requestAnimationFrame(() => {
      try {
        q(render1($, J, Q));
      } catch (E) {
        console.warn("VO3 thumb", E), q(null);
      }
    })));
    return CACHE.set(Z, U), U;
  }
function preview($, J = {}) {
    if (!glOK() || !$)
      return null;
    let Q = document.createElement("canvas");
    Q.style.cssText = "width:100%;height:100%;display:block;touch-action:none;cursor:grab", $.appendChild(Q);
    let Z = Math.max(80, $.clientWidth || 320), U = Math.max(80, $.clientHeight || 320), q = mkRenderer(Q, Z, U);
    q.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)), q.setSize(Z, U, false);
    let E = mkScene(q), Y = new THREE.PerspectiveCamera(30, Z / U, 0.05, 200), K = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshStandardMaterial({ color: "#140a12", roughness: 0.3, metalness: 0.6 }));
    K.rotation.x = -Math.PI / 2, E.add(K);
    let V = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.008, 8, 120), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.2, 0.5) }));
    V.rotation.x = Math.PI / 2, E.add(V);
    let X = null, W = 0, H = 0.45, N = null, F = 0, G = performance.now(), _ = false, D = 0, O = { cam: Y.position, focusSpeaker: null, shareStart: 0 }, I = (v, g) => {
      if (X) {
        E.remove(X.g);
        try {
          if (X.av)
            X.av.dispose();
        } catch (p) {}
        disposeAll(X.g);
      }
      if (X = stageFor(v, g, J.base, J.nm), !X)
        return false;
      E.add(X.g), X.g.updateMatrixWorld(true);
      let R = meshBox(X.fit || X.g), C = X.av ? 0.9 : Math.max(0.3, Math.hypot(R.max.x - R.min.x, R.max.z - R.min.z) * 0.62);
      return K.position.y = X.av || !X.fit ? 0 : R.min.y - 0.002, V.position.y = K.position.y + 0.004, K.scale.setScalar(C * 1.08), V.scale.setScalar(C * 1.08), frame(X, Y, 0, Z / U), true;
    }, B = null, k = () => {
      if (_)
        return;
      if (!Q.isConnected) {
        if (B)
          B.close();
        return;
      }
      F = requestAnimationFrame(k);
      let v = performance.now(), g = Math.min(0.05, (v - G) / 1000);
      if (G = v, D += g, !N)
        W += H * g;
      if (X) {
        if (X.g.rotation.y = W, X.up)
          X.up(g, D, O);
      }
      q.render(E, Y);
    };
    Q.addEventListener("pointerdown", (v) => {
      N = { x: v.clientX, r: W }, Q.setPointerCapture(v.pointerId), Q.style.cursor = "grabbing";
    }), Q.addEventListener("pointermove", (v) => {
      if (N)
        W = N.r + (v.clientX - N.x) * 0.012;
    });
    let z = () => {
      N = null, Q.style.cursor = "grab";
    };
    Q.addEventListener("pointerup", z), Q.addEventListener("pointercancel", z);
    let M = typeof ResizeObserver < "u" ? new ResizeObserver(() => {
      let v = Math.max(80, $.clientWidth), g = Math.max(80, $.clientHeight);
      if (v === Z && g === U)
        return;
      if (Z = v, U = g, q.setSize(Z, U, false), X)
        frame(X, Y, 0, Z / U);
    }) : null;
    if (M)
      M.observe($);
    if (J.k)
      I(J.k, J.v);
    return B = { set: I, close() {
      if (_)
        return;
      if (_ = true, cancelAnimationFrame(F), M)
        M.disconnect();
      if (X) {
        try {
          if (X.av)
            X.av.dispose();
        } catch (v) {}
        disposeAll(X.g);
      }
      q.dispose();
      try {
        q.forceContextLoss();
      } catch (v) {}
      Q.remove();
    } }, k(), B;
  }

export {preview, thumb};
