import * as THREE from 'three';
import {box, cyl, lathe, limb, rbox, sph, tube} from './geo.js';
import {cv, tex} from './tex.js';
import {ELEV} from './layout.js';
import {BLK, CHROME, DIA, EXT, GOLD, M, SM, glowTex, hdr, mesh, mk, patTex, std, textTex} from './cosm.js';

var TAU = Math.PI * 2;
function glow($, J, Q = 0.6) {
    let Z = new THREE.SpriteMaterial({ map: glowTex(), color: new THREE.Color($[0], $[1], $[2]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: Q }), U = new THREE.Sprite(Z);
    return U.scale.setScalar(J), U;
  }
var FLT = null;
function flameTex() {
    if (FLT)
      return FLT;
    let $ = cv(64, 128), J = $.getContext("2d"), Q = J.createRadialGradient(32, 96, 2, 32, 84, 62);
    return Q.addColorStop(0, "rgba(255,255,225,1)"), Q.addColorStop(0.22, "rgba(255,205,70,.95)"), Q.addColorStop(0.55, "rgba(255,95,15,.65)"), Q.addColorStop(1, "rgba(255,40,0,0)"), J.fillStyle = Q, J.beginPath(), J.moveTo(32, 4), J.bezierCurveTo(54, 40, 63, 72, 58, 98), J.bezierCurveTo(53, 124, 11, 124, 6, 98), J.bezierCurveTo(1, 72, 10, 40, 32, 4), J.fill(), FLT = tex($, { mips: false }), FLT;
  }
function flame($, J = 0.9) {
    let Q = new THREE.SpriteMaterial({ map: flameTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: J }), Z = new THREE.Sprite(Q);
    return Z.scale.set($ * 0.5, $, 1), Z;
  }
var coneG = ($, J, Q = 24, Z = 1, U = false) => new THREE.CylinderGeometry(Math.max(0.0004, $ * 0.004), $, J, Q, Z, U);
var bend = ($, J) => {
    let Q = $.attributes.position;
    for (let Z = 0;Z < Q.count; Z++) {
      let U = J(Q.getX(Z), Q.getY(Z), Q.getZ(Z));
      Q.setXYZ(Z, U[0], U[1], U[2]);
    }
    return $.computeVertexNormals(), $;
  };
function normUV($) {
    $.computeBoundingBox();
    let J = $.boundingBox, Q = $.attributes.position, Z = $.attributes.uv, U = J.max.x - J.min.x || 1, q = J.max.y - J.min.y || 1;
    for (let E = 0;E < Q.count; E++)
      Z.setXY(E, (Q.getX(E) - J.min.x) / U, (Q.getY(E) - J.min.y) / q);
    return Z.needsUpdate = true, $;
  }
var lerp = ($, J, Q) => $ + (J - $) * Q;
var sstep = ($, J, Q) => {
    let Z = Math.max(0, Math.min(1, (Q - $) / (J - $)));
    return Z * Z * (3 - 2 * Z);
  };
EXT.hat = function($, J) {
    let Z = new THREE.Group;
    Z.name = "bphat";
    let U = null, q = (E, Y, K, V, X, W, H) => {
      return M(E, Y, K, V, X, W, H), Z.add(E), E;
    };
    if ($ === 14) {
      let E = new THREE.Group;
      q(E, 0, 0.236, -0.03, -0.14);
      let Y = std("#ff6a10", 0.55), K = std("#f2f2f2", 0.3, 0, { emissive: "#777777", emissiveIntensity: 0.5 }), V = (X) => 0.15 - 0.125 * (X / 0.44);
      E.add(M(mesh(rbox(0.34, 0.03, 0.34, 0.008), std("#18181a", 0.8)), 0, 0.015, 0)), E.add(M(mesh(cyl(V(0.44), V(0), 0.44, 28), Y), 0, 0.25, 0)), [0.12, 0.26].forEach((X) => E.add(M(mesh(cyl(V(X + 0.03) + 0.004, V(X - 0.03) + 0.004, 0.06, 28, true), K), 0, 0.03 + X, 0)));
    } else if ($ === 15) {
      let E = std("#8a0f24", 0.92), Y = mesh(sph(1, 32, 16), E);
      Y.scale.set(0.29, 0.07, 0.3), q(Y, 0.03, 0.2, -0.03, -0.22, 0, 0.2), q(mesh(cyl(0.007, 0.011, 0.03, 8), E), 0.055, 0.272, -0.055, -0.2, 0, 0.2);
    } else if ($ === 16) {
      let E = std("#f7f7f5", 0.85);
      q(mesh(cyl(0.232, 0.236, 0.1, 32, true), E), 0, 0.18, -0.02, -0.12), q(mesh(lathe([[0, 0], [0.23, 0], [0.29, 0.05], [0.315, 0.13], [0.29, 0.2], [0.18, 0.255], [0, 0.265]], 32), E), 0, 0.225, -0.035, -0.12);
    } else if ($ === 17) {
      q(mesh(new THREE.TorusGeometry(0.2691, 0.03, 10, 44), std("#141416", 0.8)), 0, 0.09, -0.01, Math.PI / 2 - 0.42), q(mesh(rbox(0.075, 0.035, 0.012, 0.004), std("#c9cdd4", 0.3, 0.9)), 0, 0.2, 0.25, -0.62);
      let E = std("#c4141d", 0.7, 0, { side: THREE.DoubleSide }), Y = [];
      [-1, 1].forEach((K) => {
        let V = new THREE.Group;
        q(V, K * 0.03, 0, -0.262);
        let X = new THREE.PlaneGeometry(0.045, 0.24, 1, 6);
        X.translate(0, -0.12, 0);
        let W = new THREE.Mesh(X, E);
        W.rotation.set(0.35, K * 0.4, K * 0.25), V.add(W), Y.push([V, K]);
      }), U = (K) => Y.forEach(([V, X]) => {
        V.rotation.x = 0.25 + Math.sin(K * 3 + X) * 0.12, V.rotation.z = X * 0.15 + Math.sin(K * 2.3 + X * 2) * 0.08;
      });
    } else if ($ === 18) {
      let E = mk("h18", () => {
        let V = cv(256, 64), X = V.getContext("2d");
        return ["#ff1f4f", "#ffcf40", "#2a64ff", "#3ddc97"].forEach((W, H) => {
          X.fillStyle = W, X.fillRect(H * 64, 0, 64, 64);
        }), SM({ map: tex(V), roughness: 0.6 });
      });
      q(mesh(new THREE.SphereGeometry(0.28600000000000003, 40, 18, 0, TAU, 0, 1.38), E), 0, 0, 0, -0.32), q(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.014, 32, 1, false, -1.15, 2.3), std("#ff1f4f", 0.6)), 0, 0.135, 0.13, 0.12);
      let Y = new THREE.Group;
      q(Y, 0, 0.262, -0.088, -0.32), Y.add(M(mesh(cyl(0.008, 0.008, 0.06, 8), CHROME()), 0, 0.03, 0));
      let K = new THREE.Group;
      K.position.y = 0.065, Y.add(K), [0, 1].forEach((V) => {
        let X = mesh(rbox(0.2, 0.006, 0.04, 0.003), std(V ? "#ffcf40" : "#2a64ff", 0.4));
        X.position.x = V ? 0.1 : -0.1, X.rotation.x = V ? 0.25 : -0.25, K.add(X);
      }), K.add(mesh(sph(0.014, 10, 8), std("#ff1f4f", 0.4))), U = (V) => {
        K.rotation.y = V * 16;
      };
    } else if ($ === 19) {
      let E = std("#f6f2f4", 0.85), Y = std("#ff9cc2", 0.7);
      q(mesh(new THREE.TorusGeometry(0.27040000000000003, 0.012, 8, 40, Math.PI), std("#ff7ab6", 0.5)), 0, 0.03, -0.02, -0.1);
      let K = [];
      [-1, 1].forEach((V) => {
        let X = new THREE.Group;
        q(X, V * 0.1, 0.26, -0.045, -0.1, 0, V * -0.2);
        let W = mesh(sph(1, 18, 14), E);
        W.scale.set(0.05, 0.17, 0.026), W.position.y = 0.15, X.add(W);
        let H = mesh(sph(1, 16, 12), Y);
        H.scale.set(0.03, 0.13, 0.012), H.position.set(0, 0.15, 0.016), X.add(H), K.push([X, V]);
      }), U = (V) => K.forEach(([X, W], H) => {
        let N = Math.max(0, Math.sin(V * 0.8 + H * 2.1) - 0.85) * 6;
        X.rotation.x = -0.1 - N * 0.5, X.rotation.z = W * -0.2 + Math.sin(V * 2.2 + H) * 0.04;
      });
    } else if ($ === 20) {
      let E = std("#34343a", 0.85), Y = new THREE.Group;
      q(Y, 0, 0.165, -0.02, -0.14, 0, 0.06), Y.add(mesh(lathe([[0.2, 0], [0.196, 0.09], [0.18, 0.15], [0.1, 0.17], [0.03, 0.15], [0, 0.148]], 36), E)), Y.add(mesh(lathe([[0.19, 0], [0.33, 0], [0.39, 0.022], [0.41, 0.04]], 40), std("#34343a", 0.85, 0, { side: THREE.DoubleSide }))), Y.add(M(mesh(cyl(0.201, 0.203, 0.04, 32, true), std("#111114", 0.6)), 0, 0.022, 0));
    } else if ($ === 21) {
      let E = std("#c4141d", 0.85), Y = std("#f7f7f7", 1), K = new THREE.Group;
      q(K, 0, 0.14, -0.03, -0.16), K.add(M(mesh(new THREE.TorusGeometry(0.236, 0.042, 12, 40), Y), 0, 0, 0, Math.PI / 2)), K.add(mesh(bend(coneG(0.225, 0.44, 28, 12, true), (V, X, W) => {
        let H = (X + 0.22) / 0.44;
        return [V + H * H * 0.2, (X + 0.22) * (1 - H * H * 0.12), W - H * H * 0.05];
      }), E)), K.add(M(mesh(sph(0.05, 14, 10), Y), 0.2, 0.39, -0.05));
    } else if ($ === 22) {
      let E = std("#d0102a", 0.25, 0.15, { emissive: "#3a0006" });
      [-1, 1].forEach((K) => q(mesh(bend(coneG(0.04, 0.15, 14, 8), (V, X, W) => {
        let H = (X + 0.075) / 0.15;
        return [V + K * H * H * 0.035, X + 0.075, W - H * H * 0.02];
      }), E), K * 0.12, 0.2, 0.07, -0.25, 0, K * -0.35));
      let Y = glow([2.2, 0.1, 0.2], 0.5, 0.25);
      q(Y, 0, 0.32, 0.02), U = (K) => {
        Y.material.opacity = 0.15 + 0.12 * Math.sin(K * 3);
      };
    } else if ($ === 23) {
      let E = GOLD();
      q(mesh(new THREE.SphereGeometry(0.28600000000000003, 40, 18, 0, TAU, 0, 1.38), E), 0, 0, 0, -0.32), q(mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.016, 32, 1, false, -1.2, 2.4), std("#0c0c0f", 0.5)), 0, 0.13, 0.12, 0.1), q(new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.07), new THREE.MeshBasicMaterial({ map: textTex("OWQ", { w: 256, h: 110, font: "900 80px Verdana", col: "#111" }), transparent: true })), 0, 0.2, 0.212, -0.75), q(mesh(sph(0.018, 10, 8), E), 0, 0.271, -0.09);
    } else if ($ === 24) {
      let E = new THREE.Group;
      q(E, 0, 0.12, -0.02, -0.3);
      let Y = std("#3f8a3a", 0.8), K = ["#ff7ab6", "#ffffff", "#ffd34a", "#c58cff", "#ff9a5a"];
      for (let V = 0;V < 11; V++) {
        let X = V / 11 * TAU, H = new THREE.Group;
        H.position.set(Math.sin(X) * 0.245, 0, Math.cos(X) * 0.245), H.rotation.y = X;
        let N = std(K[V % 5], 0.6);
        for (let G = 0;G < 5; G++) {
          let _ = G / 5 * TAU, D = mesh(sph(1, 10, 8), N);
          D.scale.set(0.022, 0.014, 0.008), D.position.set(Math.cos(_) * 0.02, Math.sin(_) * 0.02, 0.004), D.rotation.z = _, H.add(D);
        }
        H.add(M(mesh(sph(0.011, 8, 6), std("#ffcf40", 0.5)), 0, 0, 0.01));
        let F = mesh(sph(1, 8, 6), Y);
        F.scale.set(0.03, 0.008, 0.012), F.position.set(0.035, -0.01, 0), F.rotation.z = -0.4, H.add(F), E.add(H);
      }
      E.add(M(mesh(new THREE.TorusGeometry(0.245, 0.008, 6, 40), Y), 0, 0, 0, Math.PI / 2));
    } else if ($ === 25) {
      let E = mk("h25", () => {
        let V = cv(256, 64), X = V.getContext("2d");
        X.fillStyle = "#d9b45a", X.fillRect(0, 0, 256, 64), X.strokeStyle = "rgba(120,80,20,.4)";
        for (let H = 0;H < 44; H++)
          X.beginPath(), X.moveTo(H * 7, 0), X.lineTo(H * 7 - 20, 64), X.stroke();
        let W = tex(V);
        return W.wrapS = W.wrapT = THREE.RepeatWrapping, W.repeat.set(6, 1), SM({ map: W, roughness: 0.9, side: THREE.DoubleSide });
      }), Y = mk("h25b", () => {
        let V = cv(256, 32), X = V.getContext("2d");
        return ["#c4141d", "#2a8a3a", "#ffcf40", "#2a64ff"].forEach((W, H) => {
          X.fillStyle = W, X.fillRect(0, H * 8, 256, 8);
        }), SM({ map: tex(V), roughness: 0.7 });
      }), K = new THREE.Group;
      q(K, 0, 0.16, -0.02, -0.1), K.add(mesh(lathe([[0.19, 0], [0.42, -0.01], [0.58, 0.02], [0.66, 0.08], [0.68, 0.12]], 48), E)), K.add(mesh(lathe([[0.2, 0], [0.19, 0.12], [0.15, 0.22], [0.08, 0.28], [0, 0.29]], 36), E)), K.add(M(mesh(cyl(0.197, 0.2, 0.06, 36, true), Y), 0, 0.035, 0)), K.add(M(mesh(new THREE.TorusGeometry(0.675, 0.016, 8, 60), std("#c4141d", 0.7)), 0, 0.11, 0, Math.PI / 2));
    } else if ($ === 26) {
      let E = mk("h26", () => SM({ map: patTex("stars"), roughness: 0.8, side: THREE.DoubleSide })), Y = new THREE.Group;
      q(Y, 0, 0.16, -0.03, -0.15), Y.add(mesh(lathe([[0.19, 0], [0.36, -0.005], [0.4, 0.012]], 40), E)), Y.add(mesh(bend(coneG(0.22, 0.62, 32, 14, true), (X, W, H) => {
        let N = (W + 0.31) / 0.62, F = Math.max(0, N - 0.55);
        return [X - F * F * 0.9, W + 0.31 - F * F * 0.2, H - F * F * 0.3];
      }), E));
      let K = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), hdr(2.8, 2.2, 0.6));
      K.position.set(-0.18, 0.58, -0.06), Y.add(K);
      let V = glow([2.4, 1.9, 0.6], 0.25, 0.6);
      V.position.copy(K.position), Y.add(V), U = (X) => {
        K.rotation.y = X * 2, V.material.opacity = 0.35 + 0.25 * Math.sin(X * 4);
      };
    } else if ($ === 27) {
      let E = GOLD(), Y = new THREE.Group;
      q(Y, 0, 0.11, -0.01, -0.32), [-1, 1].forEach((V) => {
        for (let X = 0;X < 9; X++) {
          let W = 0.34 + X * 0.3, N = V * Math.sin(W) * 0.25, F = Math.cos(W) * 0.25, G = V > 0 ? W : Math.PI - W;
          [1, -1].forEach((_) => {
            let D = mesh(sph(1, 10, 6), E);
            D.scale.set(0.034, 0.012, 0.016), D.position.set(N, _ * 0.017, F), D.rotation.set(0, G, _ * 0.38 * V, "YZX"), Y.add(D);
          });
        }
      });
      let K = new THREE.TorusGeometry(0.25, 0.006, 6, 40, TAU - 0.7);
      K.rotateZ(Math.PI / 2 + 0.35), K.rotateX(Math.PI / 2), Y.add(mesh(K, E));
    } else if ($ === 28) {
      let E = new THREE.Mesh(sph(0.37, 40, 28), new THREE.MeshStandardMaterial({ color: "#dff3ff", roughness: 0.03, metalness: 0.2, transparent: true, opacity: 0.2, depthWrite: false, envMapIntensity: 2.5 }));
      E.renderOrder = 3, q(E, 0, -0.01, 0.01);
      let Y = new THREE.Mesh(new THREE.SphereGeometry(0.372, 40, 20, Math.PI * 0.15, Math.PI * 0.7, 0.25, 1.15), new THREE.MeshStandardMaterial({ color: "#ffcf6a", roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.3, depthWrite: false }));
      Y.renderOrder = 4, q(Y, 0, -0.01, 0.01), q(mesh(new THREE.TorusGeometry(0.25, 0.055, 14, 40), std("#f0f0f2", 0.6)), 0, -0.3, 0, Math.PI / 2), q(mesh(cyl(0.006, 0.006, 0.12, 6), CHROME()), 0.2, 0.3, -0.12, 0, 0, -0.3);
      let K = new THREE.Mesh(sph(0.016, 8, 6), hdr(3, 0.3, 0.3));
      q(K, 0.236, 0.36, -0.12), U = (V) => {
        K.visible = V % 1.4 < 0.7;
      };
    } else if ($ === 29) {
      let E = [];
      [[0.2, hdr(0.3, 2.4, 3)], [0.15, hdr(2.6, 0.4, 2.4)], [0.1, hdr(0.6, 2.8, 1.4)]].forEach(([K, V], X) => {
        let W = new THREE.Mesh(new THREE.TorusGeometry(K, 0.007, 6, 48), V);
        q(W, 0, 0.48 + X * 0.03, -0.04, Math.PI / 2), E.push(W);
      });
      let Y = glow([0.6, 2, 2.6], 0.55, 0.35);
      q(Y, 0, 0.5, -0.04), U = (K) => {
        E.forEach((V, X) => {
          V.rotation.x = Math.PI / 2 + Math.sin(K * (1.1 + X * 0.4) + X) * 0.35, V.rotation.y = K * (0.8 + X * 0.5) * (X % 2 ? -1 : 1), V.visible = Math.random() > 0.02;
        }), Y.material.opacity = 0.25 + 0.1 * Math.sin(K * 5);
      };
    } else if ($ === 30) {
      let E = GOLD();
      q(mesh(cyl(0.17, 0.19, 0.1, 28, true), E), 0, 0.23, -0.03, -0.12);
      let Y = [];
      for (let V = 0;V < 7; V++) {
        let X = V / 7 * TAU, W = Math.sin(X) * 0.18, H = -0.03 + Math.cos(X) * 0.18;
        q(mesh(new THREE.ConeGeometry(0.03, 0.09, 8), E), W, 0.31, H, -0.12), q(new THREE.Mesh(sph(0.017, 10, 8), hdr(3, 0.6, 0.1)), Math.sin(X) * 0.188, 0.24, -0.03 + Math.cos(X) * 0.188);
        let N = flame(0.2);
        q(N, W, 0.42, H), Y.push([N, V]);
      }
      let K = glow([3, 1.2, 0.2], 0.7, 0.5);
      q(K, 0, 0.42, -0.03), U = (V) => {
        Y.forEach(([X, W]) => {
          let H = 0.75 + 0.3 * Math.sin(V * 13 + W * 1.7) * Math.sin(V * 7.3 + W);
          X.scale.set(0.1 * H, 0.2 * H, 1), X.position.y = 0.4 + 0.02 * H, X.material.opacity = 0.7 + 0.3 * Math.sin(V * 17 + W);
        }), K.material.opacity = 0.35 + 0.2 * Math.sin(V * 9);
      };
    }
    if (Z.children.length)
      J.add(Z);
    return { g: Z, up: U };
  };
EXT.extra = function($, J) {
    let Q = [], Z = null, U = J.torso, q = (E, Y, K, V, X, W, H, N) => {
      return M(Y, K, V, X, W, H, N), E.add(Y), Q.push(Y), Y;
    };
    if ($ === 8) {
      let E = std("#c4141d", 0.8), Y = std("#18181c", 0.7);
      q(U, mesh(rbox(0.29, 0.33, 0.13, 0.04), E), 0, 0.24, -0.205), q(U, mesh(rbox(0.22, 0.13, 0.05, 0.02), std("#8a0f24", 0.8)), 0, 0.14, -0.275), q(U, mesh(rbox(0.2, 0.02, 0.02, 0.008), Y), 0, 0.215, -0.302), [-1, 1].forEach((K) => q(U, mesh(tube([[K * 0.09, 0.38, -0.15], [K * 0.1, 0.455, -0.04], [K * 0.1, 0.44, 0.08], [K * 0.095, 0.3, 0.155], [K * 0.09, 0.16, 0.152]], 0.012, 20, 6), Y)));
    } else if ($ === 9) {
      let E = std("#c4141d", 0.6), Y = std("#f4f4f4", 0.6);
      [-1, 1].forEach((V) => q(U, mesh(tube([[V * 0.075, 0.44, 0.06], [V * 0.05, 0.37, 0.135], [V * 0.012, 0.29, 0.158]], 0.011, 14, 6), V < 0 ? E : Y))), q(U, mesh(cyl(0.045, 0.045, 0.012, 24), GOLD()), 0, 0.255, 0.162, Math.PI / 2 - 0.1), q(U, new THREE.Mesh(new THREE.CircleGeometry(0.03, 5), std("#fff2c0", 0.2, 1, { emissive: "#6a4a00" })), 0, 0.256, 0.17, -0.1);
      let K = glow([2.4, 1.8, 0.6], 0.18, 0.45);
      q(U, K, 0, 0.26, 0.18), Z = (V) => {
        K.material.opacity = 0.3 + 0.2 * Math.sin(V * 3);
      };
    } else if ($ === 10) {
      let E = new THREE.Group;
      q(U, E, -0.19, 0.4, -0.06), E.add(mesh(tube([[0, 0, 0], [-0.03, 0.4, -0.02], [-0.02, 0.8, -0.03], [0, 1.15, -0.02]], 0.003, 24, 4), std("#f4f4f4", 0.6)));
      let Y = std("#ff1f4f", 0.15, 0.1, { emissive: "#300008" }), K = mesh(sph(0.15, 24, 18), Y);
      K.scale.set(1, 1.18, 1), K.position.set(0, 1.32, -0.02), E.add(K), E.add(M(mesh(new THREE.ConeGeometry(0.02, 0.03, 8), Y), 0, 1.15, -0.02)), E.add(M(new THREE.Mesh(sph(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.5 })), 0.06, 1.4, 0.08)), Z = (V) => {
        E.rotation.z = Math.sin(V * 1.1) * 0.08, E.rotation.x = Math.sin(V * 0.8 + 1) * 0.06;
      };
    } else if ($ === 11) {
      let E = mk("b11", () => {
        let K = cv(128, 32), V = K.getContext("2d");
        for (let W = 0;W < 8; W++)
          V.fillStyle = W % 2 ? "#14e6ff" : "#ff2bd6", V.fillRect(W * 16, 0, 16, 32);
        let X = tex(K);
        return X.wrapS = THREE.RepeatWrapping, X.repeat.set(3, 1), SM({ map: X, emissive: "#ffffff", emissiveMap: X, emissiveIntensity: 0.9, roughness: 0.7 });
      });
      q(U, mesh(new THREE.TorusGeometry(0.112, 0.038, 12, 36), E), 0, 0.43, 0, Math.PI / 2 - 0.2).scale.set(1, 0.86, 1), q(U, mesh(rbox(0.07, 0.22, 0.026, 0.01), E), 0.055, 0.31, 0.155, -0.1, 0, 0.12);
    } else if ($ === 12) {
      let E = new THREE.Group;
      q(J.hip, E, 0.235, -0.12, 0.04, 0, 0, 0.08);
      let Y = std("#b58a52", 0.95);
      E.add(mesh(lathe([[0, 0], [0.08, 0.004], [0.12, 0.05], [0.13, 0.11], [0.1, 0.17], [0.04, 0.2], [0.03, 0.215], [0.055, 0.245], [0.04, 0.26], [0, 0.26]], 28), Y)), E.add(M(mesh(new THREE.TorusGeometry(0.032, 0.008, 6, 18), std("#6b4a2a", 0.8)), 0, 0.21, 0, Math.PI / 2)), E.add(M(new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), new THREE.MeshBasicMaterial({ map: textTex("$", { w: 128, h: 128, font: "900 110px Georgia", col: "#1f5a2a" }), transparent: true })), 0, 0.1, 0.131)), E.add(M(mesh(tube([[0, 0.25, 0], [-0.05, 0.32, 0], [-0.07, 0.4, -0.02]], 0.006, 10, 4), std("#6b4a2a", 0.8)), 0, 0, 0));
    } else if ($ === 13) {
      let E = new THREE.Group;
      q(U, E, 0.2, 0.43, -0.01), E.scale.setScalar(1.35);
      let Y = std("#e3262c", 0.55), K = std("#1f5fd6", 0.55), V = std("#ffcf40", 0.5), X = mesh(sph(1, 16, 12), Y);
      X.scale.set(0.042, 0.065, 0.045), X.position.y = 0.06, E.add(X);
      let W = new THREE.Group;
      W.position.set(0, 0.135, 0.01), E.add(W), W.add(mesh(sph(0.035, 14, 10), Y));
      let H = mesh(new THREE.ConeGeometry(0.014, 0.035, 8), V);
      H.position.set(0, -0.005, 0.038), H.rotation.x = Math.PI / 2 + 0.5, W.add(H), [-1, 1].forEach((F) => {
        let G = new THREE.Mesh(sph(0.007, 6, 5), std("#0a0a0a", 0.2));
        G.position.set(F * 0.022, 0.01, 0.025), W.add(G);
        let _ = mesh(sph(1, 12, 8), F > 0 ? K : V);
        _.scale.set(0.012, 0.05, 0.035), _.position.set(F * 0.04, 0.055, -0.005), _.rotation.z = F * 0.15, E.add(_);
      });
      let N = mesh(rbox(0.03, 0.13, 0.012, 0.005), K);
      N.position.set(0, -0.01, -0.05), N.rotation.x = 0.6, E.add(N), E.add(M(mesh(cyl(0.006, 0.006, 0.03, 6), std("#5a5a5a", 0.6)), 0, -0.005, 0)), Z = (F) => {
        W.rotation.y = Math.sin(F * 0.9) * 0.7, W.rotation.x = Math.max(0, Math.sin(F * 3.1)) * 0.25, E.rotation.z = Math.sin(F * 1.7) * 0.05;
      };
    } else if ($ === 14) {
      let E = new THREE.Group;
      q(U, E, 0, 0.2, -0.2, 0, 0, 0.55);
      let Y = new THREE.Shape;
      Y.moveTo(0, -0.16), Y.bezierCurveTo(0.13, -0.17, 0.14, -0.05, 0.08, 0), Y.bezierCurveTo(0.12, 0.04, 0.12, 0.13, 0.05, 0.13), Y.bezierCurveTo(0.02, 0.13, 0, 0.1, 0, 0.1), Y.bezierCurveTo(0, 0.1, -0.02, 0.13, -0.05, 0.13), Y.bezierCurveTo(-0.12, 0.13, -0.12, 0.04, -0.08, 0), Y.bezierCurveTo(-0.14, -0.05, -0.13, -0.17, 0, -0.16);
      let K = new THREE.ExtrudeGeometry(Y, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 16 });
      K.translate(0, 0, -0.02), E.add(mesh(K, std("#c4141d", 0.25, 0.2))), E.add(M(mesh(box(0.045, 0.42, 0.02), std("#5a3a22", 0.6)), 0, 0.33, 0)), E.add(M(mesh(rbox(0.06, 0.09, 0.022, 0.008), std("#1a1a1c", 0.5)), 0, 0.58, 0)), E.add(M(mesh(box(0.07, 0.03, 0.046), std("#f4f4f4", 0.4)), 0, -0.04, 0)), q(U, mesh(tube([[0.16, 0.04, 0.13], [0.05, 0.22, 0.16], [-0.08, 0.38, 0.11], [-0.13, 0.44, 0], [-0.1, 0.4, -0.14]], 0.012, 24, 6), std("#18181c", 0.7)));
    } else if ($ === 15) {
      let E = mk("b15", () => {
        let X = cv(256, 256), W = X.getContext("2d"), H = W.createRadialGradient(30, 128, 8, 60, 128, 240);
        H.addColorStop(0, "#1a0a30"), H.addColorStop(0.25, "#7a3cff"), H.addColorStop(0.6, "#14e6ff"), H.addColorStop(0.85, "#ff2bd6"), H.addColorStop(1, "#120818"), W.fillStyle = H, W.fillRect(0, 0, 256, 256), W.fillStyle = "rgba(255,255,255,.85)";
        for (let F = 0;F < 14; F++)
          W.beginPath(), W.arc(200 + Math.random() * 40, 30 + F * 15, 3 + Math.random() * 3, 0, 6.283), W.fill();
        let N = tex(X);
        return SM({ map: N, emissive: "#ffffff", emissiveMap: N, emissiveIntensity: 0.35, side: THREE.DoubleSide, transparent: true, opacity: 0.92, roughness: 0.5 });
      }), Y = new THREE.Shape;
      Y.moveTo(0, 0), Y.bezierCurveTo(0.1, 0.25, 0.42, 0.36, 0.5, 0.22), Y.bezierCurveTo(0.54, 0.1, 0.36, 0.02, 0, 0);
      let K = new THREE.Shape;
      K.moveTo(0, 0), K.bezierCurveTo(0.3, -0.02, 0.4, -0.12, 0.32, -0.24), K.bezierCurveTo(0.24, -0.32, 0.08, -0.2, 0, 0);
      let V = [];
      [-1, 1].forEach((X) => {
        let W = new THREE.Group;
        W.position.set(X * 0.04, 0.3, -0.16), U.add(W), Q.push(W), [Y, K].forEach((H) => {
          let N = new THREE.Mesh(normUV(new THREE.ShapeGeometry(H, 18)), E);
          N.scale.set(X, 1, 1), W.add(N);
        }), V.push([W, X]);
      }), Z = (X) => {
        let W = Math.sin(X * 5.5) * 0.35;
        V.forEach(([H, N]) => {
          H.rotation.y = N * (-0.45 + W), H.rotation.z = N * 0.05;
        });
      };
    } else if ($ === 16) {
      let E = new THREE.Group;
      q(U, E, 0, 0.2, -0.2);
      let Y = std("#d8dbe2", 0.25, 0.9), K = std("#c4141d", 0.45, 0.25);
      E.add(mesh(rbox(0.2, 0.26, 0.08, 0.02), std("#2a2a30", 0.5, 0.4)));
      let V = [];
      [-1, 1].forEach((X) => {
        let W = X * 0.15;
        E.add(M(mesh(cyl(0.06, 0.06, 0.3, 20), K), W, 0, -0.02)), E.add(M(mesh(sph(0.06, 16, 10), Y), W, 0.15, -0.02)), E.add(M(mesh(cyl(0.038, 0.055, 0.07, 16, true), std("#3a3a40", 0.4, 0.7)), W, -0.185, -0.02));
        let H = flame(0.3);
        H.position.set(W, -0.32, -0.02), E.add(H), V.push(H);
      }), Z = (X, W) => {
        V.forEach((H, N) => {
          let F = (0.5 + (W || 0) * 0.9) * (0.85 + 0.25 * Math.sin(X * 31 + N * 2));
          H.scale.set(0.14 * F, 0.32 * F, 1), H.position.y = -0.2 - 0.15 * F, H.material.opacity = 0.55 + 0.4 * (W || 0);
        });
      };
    } else if ($ === 17) {
      let E = new THREE.Group;
      q(U, E, 0.42, 0.78, 0.12), E.scale.setScalar(1.6);
      let Y = std("#141418", 0.4, 0.5);
      E.add(mesh(rbox(0.1, 0.03, 0.1, 0.01), Y)), E.add(M(mesh(rbox(0.06, 0.012, 0.11, 0.004), std("#ff1f4f", 0.5)), 0, 0.018, 0));
      let K = new THREE.MeshBasicMaterial({ color: "#cfd6e0", transparent: true, opacity: 0.35, depthWrite: false });
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([X, W]) => {
        let H = mesh(box(0.1, 0.01, 0.012), Y);
        H.position.set(X * 0.045, 0, W * 0.045), H.rotation.y = X * W > 0 ? -Math.PI / 4 : Math.PI / 4, E.add(H);
        let N = new THREE.Mesh(cyl(0.035, 0.035, 0.003, 16), K);
        N.position.set(X * 0.075, 0.012, W * 0.075), E.add(N);
      }), E.add(M(mesh(sph(0.018, 10, 8), std("#0a0a0d", 0.1, 0.6)), 0, -0.02, 0.03));
      let V = new THREE.Mesh(sph(0.008, 6, 5), hdr(0.3, 3, 0.6));
      V.position.set(0, 0.01, 0.052), E.add(V), Z = (X) => {
        E.position.set(0.42 + Math.sin(X * 0.7) * 0.05, 0.78 + Math.sin(X * 2.1) * 0.035, 0.12 + Math.cos(X * 0.7) * 0.06), E.rotation.set(0.35 + Math.sin(X * 1.3) * 0.08, Math.sin(X * 0.5) * 0.4, Math.sin(X * 1.7) * 0.08), V.visible = X % 1 < 0.5;
      };
    } else if ($ === 18) {
      let E = mk("b18", () => {
        let X = cv(256, 256), W = X.getContext("2d"), H = W.createLinearGradient(0, 0, 256, 256);
        H.addColorStop(0, "#4a0812"), H.addColorStop(1, "#140206"), W.fillStyle = H, W.fillRect(0, 0, 256, 256), W.strokeStyle = "#ff3a1a", W.shadowColor = "#ff3a00", W.shadowBlur = 8, W.lineWidth = 3;
        for (let F = 0;F < 5; F++)
          W.beginPath(), W.moveTo(0, 70), W.quadraticCurveTo(80 + F * 20, 90 + F * 20, 256, 40 + F * 50), W.stroke();
        let N = tex(X);
        return SM({ map: N, emissive: "#ffffff", emissiveMap: N, emissiveIntensity: 0.8, side: THREE.DoubleSide, roughness: 0.6, transparent: true, opacity: 0.96 });
      }), Y = new THREE.Shape;
      Y.moveTo(0, 0), Y.lineTo(0.25, 0.32), Y.lineTo(0.62, 0.42), Y.lineTo(0.92, 0.3), Y.quadraticCurveTo(0.78, 0.18, 0.8, 0.02), Y.quadraticCurveTo(0.66, 0.1, 0.58, -0.08), Y.quadraticCurveTo(0.46, 0.02, 0.36, -0.14), Y.quadraticCurveTo(0.24, -0.02, 0.14, -0.16), Y.quadraticCurveTo(0.08, -0.06, 0, 0);
      let K = std("#1a0a0c", 0.5, 0.2), V = [];
      [-1, 1].forEach((X) => {
        let W = new THREE.Group;
        W.position.set(X * 0.06, 0.32, -0.16), U.add(W), Q.push(W);
        let H = new THREE.Mesh(normUV(new THREE.ShapeGeometry(Y, 20)), E);
        H.scale.set(X, 1, 1), W.add(H), [[0.25, 0.32], [0.62, 0.42], [0.92, 0.3]].forEach(([N, F]) => W.add(mesh(tube([[0, 0, 0], [X * N * 0.5, F * 0.62, 0], [X * N, F, 0]], 0.012, 10, 5), K))), V.push([W, X]);
      }), Z = (X) => {
        let W = Math.sin(X * 1.6) * 0.3;
        V.forEach(([H, N]) => {
          H.rotation.y = N * (-0.5 + W), H.rotation.z = N * (0.12 + W * 0.15);
        });
      };
    }
    return { out: Q, up: Z };
  };
EXT.outfit = function($, J) {
    let { outC: Q, frontStrip: Z, tr: U, TZ: q, G: E, mWhite: Y } = J, K = J.std, V = null, X = true, W = null, H = [], N = (z, M__L, v) => mk("o" + $ + "|" + z + "|" + M__L, () => SM(Object.assign({ map: patTex(z), color: M__L || "#ffffff", roughness: 0.8 }, v || {}))), F = (z) => H.push((M__L) => [-1, 1].forEach((v) => {
      let g = new THREE.Mesh(E("col", () => rbox(0.1, 0.016, 0.06, 0.006)), z);
      g.position.set(v * 0.05, 0.43, 0.075), g.rotation.set(-0.5, v * 0.5, v * 0.25), M__L.add(g);
    })), G = (z) => H.push((M__L) => M__L.add(new THREE.Mesh(E("zip", () => Z(0.06, 0.44, (v) => 0.005, 0, 6, 0.006)), z))), _ = (z, M__L, v = 0) => H.push((g) => M__L.forEach((R) => {
      let C = new THREE.Mesh(E("btn", () => sph(0.009, 8, 6)), z);
      C.position.set(v, R, Math.sqrt(Math.max(0, U(R) * U(R) - v * v)) * q + 0.004), g.add(C);
    })), D = (z) => H.push((M__L) => M__L.add(new THREE.Mesh(E("vee", () => Z(0.2, 0.445, (v) => 0.008 + v * 0.072, 0, 8, 0.003)), z))), O = (z) => H.push((M__L) => M__L.add(new THREE.Mesh(E("tie", () => Z(0.17, 0.43, (v) => v > 0.88 ? 0.02 : 0.028 - v * 0.018, 0, 8, 0.007)), z))), I = (z) => H.push((M__L) => [-1, 1].forEach((v) => M__L.add(new THREE.Mesh(E("lapel" + v, () => {
      let g = Z(0.21, 0.445, (C) => 0.014, 0, 8, 0.006), R = g.attributes.position;
      for (let C = 0;C < R.count; C++) {
        let p = R.getY(C), i = (p - 0.21) / 0.235;
        R.setX(C, R.getX(C) + v * (0.012 + i * 0.072));
        let e = U(p), V0 = R.getX(C);
        R.setZ(C, Math.sqrt(Math.max(0, e * e - V0 * V0)) * q + 0.006);
      }
      return g.computeVertexNormals(), g;
    }), z)))), B = (z) => H.push((M__L) => {
      let v = new THREE.Mesh(E("hood", () => new THREE.TorusGeometry(0.12, 0.05, 10, 24, Math.PI)), z);
      v.position.set(0, 0.42, -0.09), v.rotation.set(0.35, 0, Math.PI), M__L.add(v);
    }), k = (z, M__L, v, g, R, C = 1) => H.push((p) => {
      let i = new THREE.Mesh(E(z, () => new THREE.TorusGeometry(M__L, v, 10, 32)), R);
      i.position.set(0, g, 0), i.rotation.x = Math.PI / 2, i.scale.set(1, C, 1), p.add(i);
    });
    if ($ === 13)
      V = N("plaid", Q), F(V), _(K("#1a1a1e", 0.4), [0.38, 0.32, 0.26, 0.2, 0.14]);
    else if ($ === 14) {
      let z = J.k === 0 || J.k === 2 ? "#3f62a0" : Q;
      V = N("denim", z, { roughness: 0.9 }), F(V), _(K("#c9a35c", 0.3, 1), [0.37, 0.3, 0.23, 0.16, 0.09]);
      let M__L = N("denim", new THREE.Color(z).multiplyScalar(0.8).getStyle(), { roughness: 0.9 });
      H.push((v) => [-1, 1].forEach((g) => v.add(new THREE.Mesh(E("dpk" + g, () => Z(0.29, 0.36, (R) => 0.034, g * 0.075, 2, 0.007)), M__L))));
    } else if ($ === 15) {
      V = K("#f6f6f4", 0.85);
      let z = K("#2a2a2e", 0.4);
      H.push((M__L) => {
        for (let v of [-1, 1])
          for (let g of [0.36, 0.29, 0.22, 0.15]) {
            let R = new THREE.Mesh(E("btn", () => sph(0.009, 8, 6)), z);
            R.position.set(v * 0.045, g, Math.sqrt(Math.max(0, U(g) * U(g) - 0.002025)) * q + 0.004), M__L.add(R);
          }
      }), k("chefc", 0.085, 0.014, 0.445, V, 0.9), H.push((M__L) => M__L.add(new THREE.Mesh(E("chefp", () => Z(0.41, 0.445, (v) => 0.07, 0, 2, 0.004)), K("#c4141d", 0.6))));
    } else if ($ === 16)
      V = N("camo", "#ffffff"), F(V), G(K("#3a3a2a", 0.5, 0.4));
    else if ($ === 17) {
      V = K("#f7f7f7", 0.75), D(K("#9fc5e8", 0.7)), I(K("#e6e6e6", 0.7));
      let z = K("#ececec", 0.75);
      H.push((M__L) => {
        M__L.add(new THREE.Mesh(E("lpk", () => Z(0.29, 0.35, (g) => 0.035, -0.085, 2, 0.007)), z)), [[-0.1, "#1f5fd6"], [-0.072, "#c4141d"]].forEach(([g, R]) => {
          let C = new THREE.Mesh(E("pen", () => cyl(0.005, 0.005, 0.07, 6)), K(R, 0.4));
          C.position.set(g, 0.37, Math.sqrt(Math.max(0, U(0.37) * U(0.37) - g * g)) * q + 0.012), M__L.add(C);
        });
        let v = new THREE.Mesh(E("badge", () => rbox(0.06, 0.035, 0.006, 0.003)), K("#ff1f4f", 0.5));
        v.position.set(0.09, 0.33, Math.sqrt(Math.max(0, U(0.33) * U(0.33) - 0.0081)) * q + 0.01), v.rotation.y = 0.4, M__L.add(v);
      });
    } else if ($ === 18)
      V = N("zebra", "#ffffff", { roughness: 0.7 }), D(Y), O(K("#111114", 0.5)), I(K("#111114", 0.5));
    else if ($ === 19)
      V = mk("o19", () => SM({ color: "#0a0a12", roughness: 0.6, emissive: "#ffffff", emissiveMap: patTex("grid"), emissiveIntensity: 1.3 })), X = false;
    else if ($ === 20)
      V = mk("o20", () => SM({ map: patTex("flame"), roughness: 0.75, emissive: "#ffffff", emissiveMap: patTex("flame"), emissiveIntensity: 0.45 })), B(V), H.push((z) => [-1, 1].forEach((M__L) => {
        let v = new THREE.Mesh(E("str", () => limb(0.006, 0.1, 2, 6)), Y);
        v.position.set(M__L * 0.035, 0.42, 0.13), v.rotation.x = -0.25, z.add(v);
      }));
    else if ($ === 21) {
      V = K(Q, 0.45, 0.1), F(V), G(K("#d8d8de", 0.3, 0.8));
      let z = mk("o21c", () => SM({ map: patTex("check"), roughness: 0.5 }));
      H.push((M__L) => {
        M__L.add(new THREE.Mesh(E("rck", () => Z(0.24, 0.31, (v) => 0.19, 0, 3, 0.005)), z)), M__L.add(new THREE.Mesh(E("rst", () => Z(0.06, 0.44, (v) => 0.016, 0.07, 8, 0.006)), Y)), M__L.add(new THREE.Mesh(E("rst2", () => Z(0.06, 0.44, (v) => 0.016, -0.07, 8, 0.006)), Y));
      });
    } else if ($ === 22)
      V = N("wave", J.k === 0 ? "#8a0f24" : Q, { roughness: 0.8 }), H.push((z) => {
        z.add(new THREE.Mesh(E("kv", () => Z(0.12, 0.445, (M__L) => 0.012 + M__L * 0.085, 0, 8, 0.004)), K("#f4ead2", 0.7))), z.add(new THREE.Mesh(E("obi", () => Z(0.03, 0.12, (M__L) => 0.2, 0, 3, 0.008)), K("#1a1a1e", 0.6))), z.add(new THREE.Mesh(E("obk", () => Z(0.05, 0.1, (M__L) => 0.035, 0.07, 2, 0.012)), K("#e3b04f", 0.3, 1)));
      });
    else if ($ === 23)
      V = mk("o23", () => SM({ map: patTex("money"), roughness: 0.8 })), X = false, F(V), _(K("#f4f4f4", 0.4), [0.37, 0.31, 0.25]);
    else if ($ === 24)
      V = mk("o24", () => SM({ map: patTex("galaxy"), roughness: 0.45, emissive: "#ffffff", emissiveMap: patTex("galaxy"), emissiveIntensity: 0.35 })), D(K("#0d0d10", 0.6)), I(K("#050507", 0.2, 0.3));
    else if ($ === 25) {
      V = mk("o25", () => SM({ map: patTex("royal"), roughness: 0.95 }));
      let z = K("#e3b04f", 0.25, 1);
      H.push((M__L) => [-1, 1].forEach((v) => M__L.add(new THREE.Mesh(E("rtr" + v, () => Z(-0.03, 0.43, (g) => 0.016, v * 0.05, 8, 0.006)), z)))), k("fur", 0.15, 0.05, 0.43, K("#f6f4ee", 1), 1), H.push((M__L) => {
        for (let v = 0;v < 9; v++) {
          let g = v / 9 * TAU, R = new THREE.Mesh(E("furs", () => sph(0.012, 6, 5)), K("#111111", 0.8));
          R.position.set(Math.sin(g) * 0.15, 0.47, Math.cos(g) * 0.15), M__L.add(R);
        }
      });
    } else if ($ === 26)
      V = K("#f2f2f0", 0.7), W = K("#c9cdd4", 0.4, 0.6), k("acol", 0.1, 0.03, 0.45, K("#b8bec8", 0.35, 0.7)), H.push((z) => {
        z.add(new THREE.Mesh(E("apn", () => Z(0.2, 0.3, (v) => 0.06, 0, 3, 0.012)), K("#3a3f48", 0.4, 0.5))), [[-0.03, hdr(3, 0.3, 0.3)], [0, hdr(0.3, 3, 0.8)], [0.03, hdr(3, 2.4, 0.3)]].forEach(([v, g]) => {
          let R = new THREE.Mesh(E("abt", () => sph(0.009, 8, 6)), g);
          R.position.set(v, 0.25, Math.sqrt(Math.max(0, U(0.25) * U(0.25) - v * v)) * q + 0.022), z.add(R);
        });
        let M__L = new THREE.Mesh(new THREE.CircleGeometry(0.04, 24), new THREE.MeshBasicMaterial({ map: textTex("OWQ", { w: 128, h: 128, font: "900 44px Verdana", col: "#ffffff", bg: "#1f3a8a" }) }));
        M__L.position.set(0.105, 0.36, Math.sqrt(Math.max(0, U(0.36) * U(0.36) - 0.011)) * q + 0.012), M__L.rotation.y = 0.55, z.add(M__L);
      });
    else if ($ === 27)
      V = mk("o27", () => SM({ map: patTex("holo"), roughness: 0.18, metalness: 0.85, emissive: "#3a2a5a", emissiveIntensity: 0.4 })), F(V), G(K("#e6e8ee", 0.1, 1)), J.cup.push((z) => {
        let M__L = patTex("holo");
        M__L.offset.x = z * 0.05 % 1, M__L.offset.y = z * 0.03 % 1;
      });
    else if ($ === 28)
      V = K("#dff3ff", 0.05, 0.25, { emissive: "#2a5470", emissiveIntensity: 0.6 }), D(K("#0d0d10", 0.4, 0.3)), I(K("#bfe9ff", 0.03, 0.4, { emissive: "#4a90c0", emissiveIntensity: 0.5 })), O(K("#ffffff", 0.1, 0.2, { emissive: "#88ccff", emissiveIntensity: 0.6 })), H.push((z) => {
        let M__L = [];
        for (let v = 0;v < 6; v++) {
          let g = glow([1.6, 2.4, 3], 0.06, 0);
          g.position.set((Math.random() - 0.5) * 0.28, Math.random() * 0.38, 0.17), z.add(g), M__L.push(g);
        }
        J.cup.push((v) => M__L.forEach((g, R) => {
          let C = Math.max(0, Math.sin(v * 2.3 + R * 1.9));
          g.material.opacity = C * C * 0.9, g.scale.setScalar(0.03 + 0.06 * C);
        }));
      });
    else if ($ === 29)
      V = N("knit", Q, { roughness: 0.95 }), k("kcol", 0.075, 0.02, 0.45, V), H.push((z) => z.add(new THREE.Mesh(E("khem", () => Z(-0.02, 0.03, (M__L) => 0.2, 0, 2, 0.006)), V)));
    if (!V)
      return null;
    return { mat: V, long: X, cuff: W, det: (z) => H.forEach((M__L) => M__L(z)) };
  };
EXT.skin = ($) => $ === 8 ? { hex: "#a8703f", mat: std("#a8703f", 0.32, 1) } : $ === 9 ? { hex: "#d8dbe2", mat: std("#e6e8ee", 0.06, 1) } : $ === 10 ? { hex: "#7ef9ff", mat: mk("s10", () => SM({ color: "#7ef9ff", roughness: 0.3, transparent: true, opacity: 0.8, emissive: "#1aa8c0", emissiveIntensity: 0.9 })) } : $ === 11 ? { hex: "#3a2a8a", mat: mk("s11", () => SM({ map: patTex("galaxy"), roughness: 0.4, emissive: "#ffffff", emissiveMap: patTex("galaxy"), emissiveIntensity: 0.5 })) } : null;
function trig($, J, Q = -0.05, Z = 0.11) {
    $.add(M(mesh(rbox(0.04, Z, 0.055, 0.015), J), 0, -0.07, Q, 0.25));
  }
function guard($, J, Q = -0.01) {
    $.add(M(mesh(new THREE.TorusGeometry(0.025, 0.005, 6, 16, Math.PI), J), 0, -0.035, Q, 0, Math.PI / 2, Math.PI));
  }
function tubeX($, J, Q, Z) {
    let U = cyl($, Z || $, J, 16);
    return U.rotateX(Math.PI / 2), mesh(U, Q);
  }
function tank($, J, Q, Z) {
    let U = lathe([[0, -0.17], [0.03, -0.16], [0.05, -0.11], [0.058, -0.05], [0.045, 0.01], [0.022, 0.05], [0.018, 0.14], [0.03, 0.16], [0, 0.17]], 24);
    U.rotateX(Math.PI / 2), $.add(mesh(U, J)), [-0.02, 0.08, 0.12].forEach((E) => $.add(M(mesh(new THREE.TorusGeometry(E < 0 ? 0.06 : 0.026, 0.006, 8, 24), Q), 0, 0, E)));
    for (let E = 0;E < 4; E++) {
      let Y = mesh(rbox(0.008, 0.05, 0.08, 0.003), Q), K = E / 4 * TAU + Math.PI / 4;
      Y.position.set(Math.sin(K) * 0.055, Math.cos(K) * 0.055, -0.12), Y.rotation.z = -K, $.add(Y);
    }
    let q = new THREE.Mesh(sph(0.022, 12, 10), Z);
    q.position.z = 0.175, $.add(q), trig($, J, -0.08, 0.12);
  }
EXT.blaster = function($) {
    let J = new THREE.Group;
    J.name = "blaster" + $;
    let Q = null, Z = (q, E, Y, K, V, X, W) => {
      return M(q, E, Y, K, V, X, W), J.add(q), q;
    }, U = std("#ff7a1a", 0.45);
    if ($ === 1) {
      let q = std("#2fbf5a", 0.4);
      Z(mesh(rbox(0.06, 0.07, 0.32, 0.02), q)), Z(new THREE.Mesh(cyl(0.045, 0.045, 0.18, 16), std("#7fd4ff", 0.05, 0, { transparent: true, opacity: 0.45 })), 0, 0.075, -0.03, Math.PI / 2), Z(mesh(cyl(0.035, 0.035, 0.1, 14), std("#2a8fff", 0.2, 0, { emissive: "#0a3a80" })), 0, 0.07, -0.03, Math.PI / 2), Z(tubeX(0.012, 0.07, U, 0.016), 0, 0, 0.19), Z(mesh(rbox(0.05, 0.04, 0.12, 0.012), U), 0, -0.045, 0.1), trig(J, std("#1f8a42", 0.5), -0.1), guard(J, std("#1f8a42", 0.5));
    } else if ($ === 2) {
      let q = std("#1f5fd6", 0.4);
      Z(mesh(rbox(0.05, 0.075, 0.2, 0.016), q)), Z(mesh(rbox(0.035, 0.016, 0.16, 0.006), U), 0, 0.045, 0), Z(tubeX(0.017, 0.03, U), 0, 0.005, 0.11), trig(J, U, -0.05), guard(J, q), Z(tubeX(0.008, 0.06, std("#2a64ff", 0.6)), 0, 0.005, 0.14), Z(mesh(sph(0.009, 8, 6), U), 0, 0.005, 0.172);
    } else if ($ === 3) {
      let q = std("#8a5a32", 0.6), E = std("#4a2c18", 0.5);
      Z(mesh(rbox(0.04, 0.07, 0.2, 0.015), q), 0, -0.01, -0.15), Z(mesh(rbox(0.045, 0.05, 0.15, 0.012), q), 0, 0, 0), Z(tubeX(0.014, 0.32, E, 0.016), 0, 0.01, 0.2), Z(tubeX(0.016, 0.03, std("#d8b07a", 0.9), 0.012), 0, 0.01, 0.375), Z(mesh(tube([[0, 0, 0.37], [0, -0.05, 0.33], [0, -0.04, 0.26], [0, -0.005, 0.22]], 0.002, 12, 4), std("#f4f4f4", 0.7))), trig(J, q, -0.06, 0.08);
    } else if ($ === 4) {
      let q = std("#ff7a1a", 0.4), E = std("#ffcf40", 0.45), Y = std("#1f5fd6", 0.45);
      Z(mesh(rbox(0.07, 0.1, 0.36, 0.025), q)), Z(tubeX(0.022, 0.2, E), 0, 0.01, 0.27), Z(tubeX(0.026, 0.03, U), 0, 0.01, 0.38), Z(mesh(rbox(0.05, 0.09, 0.16, 0.02), Y), 0, -0.005, -0.25), Z(mesh(cyl(0.05, 0.05, 0.07, 16), Y), 0, -0.025, 0.04, 0, 0, Math.PI / 2), Z(tubeX(0.018, 0.12, BLK()), 0, 0.075, 0), Z(new THREE.Mesh(sph(0.014, 10, 8), hdr(0.3, 1.4, 3)), 0, 0.075, 0.062), trig(J, Y, -0.08), guard(J, Y, -0.04);
    } else if ($ === 5) {
      let q = std("#141418", 0.45, 0.3);
      Z(mesh(rbox(0.045, 0.06, 0.24, 0.015), q)), Z(tubeX(0.014, 0.3, q), 0, 0.01, 0.27), Z(mesh(rbox(0.08, 0.1, 0.12, 0.04), new THREE.MeshStandardMaterial({ color: "#ffd34a", roughness: 0.1, transparent: true, opacity: 0.55 })), 0, 0.1, 0), ["#ff3a8a", "#2a64ff", "#3ddc97", "#ffcf40"].forEach((E, Y) => Z(mesh(sph(0.017, 10, 8), std(E, 0.3)), (Y % 2 - 0.5) * 0.03, 0.085 + (Y >> 1) * 0.03, (Y % 3 - 1) * 0.025)), Z(tubeX(0.03, 0.16, std("#c9cdd4", 0.2, 0.9)), 0, -0.06, -0.16), trig(J, q, -0.03), guard(J, q);
    } else if ($ === 6) {
      let q = std("#b98cff", 0.4), E = std("#2ad6c0", 0.35);
      Z(mesh(rbox(0.07, 0.09, 0.22, 0.035), q)), Z(mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 24), E), 0, 0.01, 0.14), Z(tubeX(0.02, 0.05, E), 0, 0.01, 0.1), Z(mesh(cyl(0.03, 0.03, 0.08, 14), new THREE.MeshStandardMaterial({ color: "#ff9cc2", roughness: 0.1, transparent: true, opacity: 0.6 })), 0, -0.08, 0.04), trig(J, E, -0.06);
      let Y = mk("bub", () => {
        let V = cv(64, 64), X = V.getContext("2d");
        return X.strokeStyle = "rgba(200,240,255,.9)", X.lineWidth = 3, X.beginPath(), X.arc(32, 32, 26, 0, 6.283), X.stroke(), X.fillStyle = "rgba(255,255,255,.9)", X.beginPath(), X.arc(22, 22, 6, 0, 6.283), X.fill(), tex(V, { mips: false });
      }), K = [];
      for (let V = 0;V < 4; V++) {
        let X = new THREE.Sprite(new THREE.SpriteMaterial({ map: Y, transparent: true, depthWrite: false }));
        J.add(X), K.push(X);
      }
      Q = (V) => K.forEach((X, W) => {
        let H = (V * 0.5 + W / 4) % 1;
        X.position.set(Math.sin(W * 2.3 + V) * 0.04 * H, 0.01 + H * 0.25, 0.15 + H * 0.35), X.scale.setScalar(0.03 + H * 0.05), X.material.opacity = 1 - H;
      });
    } else if ($ === 7 || $ === 8) {
      let q = std("#f2f4f7", 0.35), E = $ === 7 ? hdr(0.3, 2.6, 3) : hdr(3, 0.4, 2.4), Y = std("#3a3d44", 0.5, 0.3), K = $ === 7 ? 0.2 : 0.38;
      if (Z(mesh(rbox(0.05, 0.07, K, 0.02), q)), [-1, 1].forEach((V) => Z(new THREE.Mesh(box(0.004, 0.012, K * 0.8), E), V * 0.026, 0.01, 0)), Z(new THREE.Mesh(new THREE.SphereGeometry(0.025, 16, 8, 0, TAU, 0, Math.PI / 2), E), 0, 0.035, -K * 0.15), Z(tubeX(0.016, 0.04, Y), 0, 0.005, K / 2 + 0.02), Z(new THREE.Mesh(new THREE.CircleGeometry(0.012, 16), E), 0, 0.005, K / 2 + 0.041), trig(J, Y, -K * 0.25), guard(J, Y, -K * 0.15), $ === 8)
        Z(mesh(rbox(0.04, 0.07, 0.14, 0.02), Y), 0, -0.01, -0.25), Z(tubeX(0.014, 0.1, Y), 0, 0.06, 0.04), Z(new THREE.Mesh(new THREE.CircleGeometry(0.012, 16), E), 0, 0.06, 0.091);
    } else if ($ === 9) {
      let q = mk("conf", () => {
        let E = cv(64, 256), Y = E.getContext("2d");
        return ["#ff1f4f", "#ffcf40", "#3ddc97", "#2a64ff", "#b55cff"].forEach((K, V) => {
          Y.fillStyle = K, Y.fillRect(0, V * 52, 64, 52);
        }), SM({ map: tex(E), roughness: 0.5 });
      });
      Z(tubeX(0.05, 0.32, q, 0.06), 0, 0.02, 0.04), Z(mesh(new THREE.TorusGeometry(0.052, 0.008, 8, 24), GOLD()), 0, 0.02, 0.2), trig(J, std("#1a1a1e", 0.5), -0.06), guard(J, std("#1a1a1e", 0.5), -0.02), ["#ff1f4f", "#ffcf40", "#3ddc97", "#2a64ff", "#b55cff", "#ff7ab6"].forEach((E, Y) => Z(mesh(box(0.018, 0.003, 0.012), std(E, 0.4)), Math.cos(Y) * 0.03, 0.02 + Math.sin(Y * 1.7) * 0.03, 0.205 + Y * 0.004, Y, Y * 2, 0));
    } else if ($ === 10) {
      let q = std("#2a2d34", 0.35, 0.7), E = hdr(0.4, 2.4, 3);
      Z(mesh(rbox(0.05, 0.07, 0.22, 0.02), q)), Z(tubeX(0.012, 0.2, CHROME()), 0, 0.005, 0.2);
      let Y = [];
      [0.12, 0.17, 0.22].forEach((V) => {
        let X = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 24), E.clone());
        X.position.set(0, 0.005, V), J.add(X), Y.push(X);
      });
      let K = glow([0.6, 2.2, 3], 0.12, 0.7);
      K.position.set(0, 0.02, -0.06), J.add(K), trig(J, q, -0.05), guard(J, q), Q = (V) => {
        Y.forEach((X, W) => {
          let H = 0.5 + 0.5 * Math.sin(V * 9 - W * 1.4);
          X.material.color.setRGB(0.4 + H * 0.6, 1.4 + H * 1.6, 2 + H * 1.6);
        }), K.material.opacity = 0.45 + 0.3 * Math.sin(V * 7);
      };
    } else if ($ === 11)
      tank(J, GOLD(), CHROME(), hdr(3, 0.25, 0.3));
    else if ($ === 12) {
      tank(J, DIA(), std("#ffffff", 0.05, 1), hdr(0.6, 2.4, 3.2));
      let q = glow([0.8, 2, 3], 0.18, 0.7);
      q.position.z = 0.17, J.add(q);
      let E = [];
      for (let Y = 0;Y < 4; Y++) {
        let K = glow([2.4, 2.6, 3], 0.04, 0);
        K.position.set((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.3), J.add(K), E.push(K);
      }
      Q = (Y) => {
        q.material.opacity = 0.4 + 0.3 * Math.sin(Y * 5), E.forEach((K, V) => {
          let X = Math.max(0, Math.sin(Y * 3 + V * 1.7));
          K.material.opacity = X * X, K.scale.setScalar(0.02 + 0.05 * X);
        });
      };
    }
    return J.traverse((q) => {
      if (q.isMesh)
        q.castShadow = true;
    }), J.userData.up = Q, J.userData.len = 0.4, J;
  };
EXT.dur = { spin: 2.4, shrug: 2, point: 2.2, victory: 2.2, facepalm: 2.4, heart: 2.6, flex: 2.6, phone: 3.2, chefkiss: 2.2, sway: 3.6, thinker: 3, moonwalk: 3.6, rain: 3.4, crown: 3.4, fireworks: 3.6, lightning: 3 };
EXT.stand = new Set(["spin", "victory", "flex", "sway", "moonwalk", "rain", "crown", "fireworks", "lightning"]);
EXT.happy = new Set(["spin", "victory", "heart", "flex", "sway", "moonwalk", "rain", "crown", "fireworks", "lightning", "chefkiss", "point"]);
EXT.pose = function($, J, Q, Z, U) {
    let q = U.standK || 0;
    if ($ === "spin")
      Z.lsz = lerp(Z.lsz, 1.25, Q), Z.rsz = lerp(Z.rsz, -1.25, Q), Z.lsx = lerp(Z.lsx, -0.15, Q), Z.rsx = lerp(Z.rsx, -0.15, Q), Z.lex = lerp(Z.lex, -0.2, Q), Z.rex = lerp(Z.rex, -0.2, Q), Z.hx = lerp(Z.hx, -0.1, Q), U._spin = sstep(0.25, 2.05, J) * Math.PI * 4;
    else if ($ === "shrug")
      Z.lsx = lerp(Z.lsx, -0.35, Q), Z.rsx = lerp(Z.rsx, -0.35, Q), Z.lsz = lerp(Z.lsz, 0.55, Q), Z.rsz = lerp(Z.rsz, -0.55, Q), Z.lex = lerp(Z.lex, -1.5, Q), Z.rex = lerp(Z.rex, -1.5, Q), Z.lez = lerp(Z.lez, 0.6, Q), Z.rez = lerp(Z.rez, -0.6, Q), Z.hz = lerp(Z.hz, 0.18 * Math.sin(J * 2), Q), Z.hx = lerp(Z.hx, -0.05, Q);
    else if ($ === "point")
      Z.rsz = lerp(Z.rsz, -2.85, Q), Z.rsx = lerp(Z.rsx, -0.2, Q), Z.rex = lerp(Z.rex, 0, Q), Z.lsx = lerp(Z.lsx, -0.4, Q), Z.lsz = lerp(Z.lsz, 0.45, Q), Z.lex = lerp(Z.lex, -1.6, Q), Z.hx = lerp(Z.hx, -0.32, Q);
    else if ($ === "victory")
      Z.lsz = lerp(Z.lsz, 2.3, Q), Z.rsz = lerp(Z.rsz, -2.3, Q), Z.lsx = lerp(Z.lsx, -0.3, Q), Z.rsx = lerp(Z.rsx, -0.3, Q), Z.lex = lerp(Z.lex, -0.25, Q), Z.rex = lerp(Z.rex, -0.25, Q), Z.hx = lerp(Z.hx, -0.15, Q), Z.lift += 0.04 * Math.abs(Math.sin(J * 6)) * Q * q;
    else if ($ === "facepalm")
      Z.rsx = lerp(Z.rsx, -1.45, Q), Z.rsz = lerp(Z.rsz, 0.35, Q), Z.rex = lerp(Z.rex, -2.35, Q), Z.hx = lerp(Z.hx, 0.35, Q), Z.tx = lerp(Z.tx, 0.12, Q), Z.lsx = lerp(Z.lsx, -0.2, Q), Z.hy = lerp(Z.hy, Math.sin(J * 5) * 0.16, Q);
    else if ($ === "heart")
      Z.lsx = lerp(Z.lsx, -1.3, Q), Z.rsx = lerp(Z.rsx, -1.3, Q), Z.lsz = lerp(Z.lsz, -0.25, Q), Z.rsz = lerp(Z.rsz, 0.25, Q), Z.lex = lerp(Z.lex, -1.15, Q), Z.rex = lerp(Z.rex, -1.15, Q), Z.hz = lerp(Z.hz, 0.15 * Math.sin(J * 2.5), Q), Z.hx = lerp(Z.hx, -0.08, Q);
    else if ($ === "flex") {
      let E = Math.sin(J * 6) * 0.12;
      Z.lsz = lerp(Z.lsz, 1.45, Q), Z.rsz = lerp(Z.rsz, -1.45, Q), Z.lsx = lerp(Z.lsx, -0.15, Q), Z.rsx = lerp(Z.rsx, -0.15, Q), Z.lex = lerp(Z.lex, 0, Q), Z.rex = lerp(Z.rex, 0, Q), Z.lez = lerp(Z.lez, 1.7 + E, Q), Z.rez = lerp(Z.rez, -1.7 - E, Q), Z.tx = lerp(Z.tx, -0.05, Q), Z.hx = lerp(Z.hx, -0.12, Q);
    } else if ($ === "phone")
      Z.rsx = lerp(Z.rsx, -0.55, Q), Z.rsz = lerp(Z.rsz, -0.5, Q), Z.rex = lerp(Z.rex, -2.4, Q), Z.rez = lerp(Z.rez, 0.3, Q), Z.hz = lerp(Z.hz, -0.18, Q), Z.hx = lerp(Z.hx, Math.sin(J * 4) * 0.08, Q), Z.lsx = lerp(Z.lsx, -0.9 + Math.sin(J * 3) * 0.2, Q), Z.lex = lerp(Z.lex, -1.3, Q);
    else if ($ === "chefkiss") {
      let E = sstep(0.9, 1.25, J);
      Z.rsx = lerp(Z.rsx, lerp(-1.5, -1.2, E), Q), Z.rsz = lerp(Z.rsz, lerp(0.25, -0.5, E), Q), Z.rex = lerp(Z.rex, lerp(-2.3, -0.9, E), Q), Z.hx = lerp(Z.hx, -0.2, Q), Z.lsx = lerp(Z.lsx, -0.3, Q);
    } else if ($ === "sway") {
      let E = J * 3.2;
      Z.sway = lerp(Z.sway, Math.sin(E) * 0.05, Q), Z.tz = lerp(Z.tz, Math.sin(E) * 0.12, Q), Z.hz = lerp(Z.hz, -Math.sin(E) * 0.12, Q), Z.lsx = lerp(Z.lsx, -0.6, Q), Z.lex = lerp(Z.lex, -1.2 + Math.sin(E * 2) * 0.2, Q), Z.rsx = lerp(Z.rsx, -0.6, Q), Z.rex = lerp(Z.rex, -1.2 - Math.sin(E * 2) * 0.2, Q), Z.lift += Math.abs(Math.sin(E)) * 0.02 * Q * q;
    } else if ($ === "thinker")
      Z.rsx = lerp(Z.rsx, -1.2, Q), Z.rsz = lerp(Z.rsz, 0.3, Q), Z.rex = lerp(Z.rex, -2.5, Q), Z.lsx = lerp(Z.lsx, -0.9, Q), Z.lsz = lerp(Z.lsz, -0.35, Q), Z.lex = lerp(Z.lex, -1.7, Q), Z.hx = lerp(Z.hx, 0.12, Q), Z.hz = lerp(Z.hz, 0.15, Q);
    else if ($ === "moonwalk") {
      let E = J * 4, Y = Math.sin(E);
      Z.ltx = lerp(Z.ltx, 0.25 * Y, Q), Z.rtx = lerp(Z.rtx, -0.25 * Y, Q), Z.lkx = lerp(Z.lkx, 0.5 * Math.max(0, -Y), Q), Z.rkx = lerp(Z.rkx, 0.5 * Math.max(0, Y), Q), Z.lift += 0.015 * Q * q, Z.tx = lerp(Z.tx, -0.06, Q), Z.lsx = lerp(Z.lsx, 0.3 * Y, Q), Z.rsx = lerp(Z.rsx, -0.3 * Y, Q), Z.hx = lerp(Z.hx, -0.05, Q), Z.hy = lerp(Z.hy, 0.25 * Math.sin(E * 0.5), Q);
    } else if ($ === "rain") {
      let E = J * 3 % 1;
      Z.rsx = lerp(Z.rsx, -1.9 + E * 1.2, Q), Z.lsx = lerp(Z.lsx, -1.9 + (E + 0.5) % 1 * 1.2, Q), Z.rsz = lerp(Z.rsz, -0.6, Q), Z.lsz = lerp(Z.lsz, 0.6, Q), Z.rex = lerp(Z.rex, -0.5, Q), Z.lex = lerp(Z.lex, -0.5, Q), Z.hx = lerp(Z.hx, -0.15, Q);
    } else if ($ === "crown") {
      let E = sstep(0.2, 1.1, J), Y = sstep(1.4, 2.2, J);
      Z.lsz = lerp(Z.lsz, lerp(2.6, 2.3, Y), Q * E), Z.rsz = lerp(Z.rsz, lerp(-2.6, -2.3, Y), Q * E), Z.lsx = lerp(Z.lsx, -0.25, Q), Z.rsx = lerp(Z.rsx, -0.25, Q), Z.lex = lerp(Z.lex, lerp(-0.6, -1.9, Y), Q), Z.rex = lerp(Z.rex, lerp(-0.6, -1.9, Y), Q), Z.lez = lerp(Z.lez, -0.4, Q), Z.rez = lerp(Z.rez, 0.4, Q), Z.hx = lerp(Z.hx, -0.15, Q);
    } else if ($ === "fireworks") {
      let E = Math.abs(Math.sin(J * 7));
      Z.lsz = lerp(Z.lsz, 2.6 + 0.2 * E, Q), Z.rsz = lerp(Z.rsz, -2.6 - 0.2 * E, Q), Z.lsx = lerp(Z.lsx, -0.2, Q), Z.rsx = lerp(Z.rsx, -0.2, Q), Z.lex = lerp(Z.lex, -0.3, Q), Z.rex = lerp(Z.rex, -0.3, Q), Z.hx = lerp(Z.hx, -0.3, Q), Z.lift += 0.08 * E * Q * q;
    } else if ($ === "lightning") {
      let E = 1 - sstep(0.85, 1.05, J), Y = sstep(0.9, 1.15, J);
      Z.tx = lerp(Z.tx, 0.3 * E, Q), Z.hx = lerp(Z.hx, lerp(0.2, -0.35, Y), Q), Z.lkx = lerp(Z.lkx, 0.7 * E, Q), Z.rkx = lerp(Z.rkx, 0.7 * E, Q), Z.ltx = lerp(Z.ltx, -0.45 * E, Q), Z.rtx = lerp(Z.rtx, -0.45 * E, Q), Z.lsz = lerp(Z.lsz, lerp(0.35, 2.7, Y), Q), Z.rsz = lerp(Z.rsz, lerp(-0.35, -2.7, Y), Q), Z.lsx = lerp(Z.lsx, lerp(0.25, -0.2, Y), Q), Z.rsx = lerp(Z.rsx, lerp(0.25, -0.2, Y), Q), Z.lex = lerp(Z.lex, lerp(-0.4, -0.15, Y), Q), Z.rex = lerp(Z.rex, lerp(-0.4, -0.15, Y), Q), Z.lift += 0.1 * Y * Q * q * Math.abs(Math.sin(J * 5));
    } else
      return false;
    return true;
  };
function job($, J, Q, Z) {
    ($.bpE || ($.bpE = [])).push({ k: "x", a: J, t: 0, f: Q, end: Z });
  }
EXT.emoFx = function($, J, Q) {
    let Z = J.root.position, U = $.room.group;
    if (Q === "heart")
      $.fx.sparkle(Z.x, 1.5, Z.z + 0.2, 30, [1, 0.35, 0.6]);
    else if (Q === "rain")
      $.sfx("chaching"), job($, J, (q) => {
        if ((q.t * 6 | 0) !== q.n)
          q.n = q.t * 6 | 0, $.fx.rain(Z.x, 2.5, Z.z, 18, 0.9);
        return q.t > 3;
      });
    else if (Q === "fireworks")
      job($, J, (q) => {
        let E = q.t / 0.55 | 0;
        if (E !== q.n && E < 6) {
          q.n = E;
          let Y = [[1, 0.3, 0.4], [1, 0.85, 0.3], [0.3, 0.8, 1], [0.5, 1, 0.5], [0.9, 0.4, 1], [1, 0.6, 0.2]][E];
          $.fx.sparkle(Z.x + (Math.random() - 0.5) * 2.2, 3 + Math.random() * 1.2, Z.z - 0.6 + (Math.random() - 0.5), 70, Y), $.sfx("boom", 0.35);
        }
        return q.t > 3.4;
      });
    else if (Q === "lightning")
      job($, J, (q) => {
        if (q.t > 1 && !q.hit) {
          q.hit = 1, $.sfx("boom"), $.shk = Math.max($.shk || 0, 0.5);
          for (let E = 0;E < 5; E++)
            $.fx.sparkle(Z.x, 0.4 + E * 0.7, Z.z, 18, [0.6, 0.85, 1]);
          q.kI = $.room.lights.key.intensity;
        }
        if (q.hit && q.t < 1.45)
          $.room.lights.key.intensity = q.kI * (Math.random() < 0.5 ? 2.4 : 0.35);
        else if (q.kI !== undefined && q.t >= 1.45 && !q.rs)
          q.rs = 1, $.room.lights.key.intensity = q.kI;
        return q.t > 3;
      }, (q) => {
        if (q.kI !== undefined)
          $.room.lights.key.intensity = q.kI;
      });
    else if (Q === "crown") {
      let q = new THREE.Group, E = GOLD();
      q.add(mesh(cyl(0.17, 0.19, 0.1, 24, true), E));
      for (let K = 0;K < 6; K++) {
        let V = K / 6 * TAU, X = mesh(new THREE.ConeGeometry(0.032, 0.1, 8), E);
        X.position.set(Math.sin(V) * 0.18, 0.09, Math.cos(V) * 0.18), q.add(X);
      }
      q.add(glow([3, 2.2, 0.6], 0.6, 0.5)), U.add(q);
      let Y = new THREE.Vector3;
      job($, J, (K) => {
        J.headPos(Y);
        let V = sstep(1.2, 2.2, K.t);
        if (q.position.set(Y.x, Y.y + lerp(0.75, 0.28, V), Y.z), q.rotation.y = K.t * 1.5, q.scale.setScalar(K.t > 3.1 ? Math.max(0.01, 1 - (K.t - 3.1) * 4) : 1), K.t > 2.2 && !K.s)
          K.s = 1, $.sfx("chaching"), $.fx.sparkle(Y.x, Y.y + 0.4, Y.z, 60, [1, 0.85, 0.3]);
        return K.t > 3.35;
      }, () => U.remove(q));
    } else if (Q === "phone") {
      let q = mesh(rbox(0.045, 0.09, 0.012, 0.006), std("#141418", 0.3, 0.4));
      q.position.set(0, -0.2, 0.03), q.rotation.x = -0.2, J.el[1].add(q), job($, J, (E) => E.t > 3.1, () => {
        J.el[1].remove(q);
      });
    } else if (Q === "thinker")
      setTimeout(() => {
        try {
          $.popAt(J, "\uD83D\uDCA1");
        } catch (q) {}
      }, 1800);
    else if (Q === "chefkiss")
      setTimeout(() => {
        try {
          $.fx.sparkle(Z.x, 1.55, Z.z + 0.3, 24, [1, 0.8, 0.4]);
        } catch (q) {}
      }, 1000);
    else if (Q === "victory" || Q === "flex")
      $.fx.sparkle(Z.x, 1.8, Z.z, 24, [1, 0.85, 0.35]);
  };
EXT.entrance = function($, J, Q) {
    let Z = $.room.group, U = ELEV.out.x, q = ELEV.out.z;
    if (Q === 6)
      $.sfx("whoosh"), job($, J, (E) => {
        if ((E.t * 8 | 0) !== E.n) {
          E.n = E.t * 8 | 0;
          let Y = J.root.position;
          $.fx.sparkle(Y.x + (Math.random() - 0.5) * 1.4, 2.6, Y.z + (Math.random() - 0.5) * 1.2, 10, [1, 0.35, 0.55]);
        }
        return E.t > 3;
      });
    else if (Q === 7) {
      $.sfx("boom", 0.6);
      let E = [];
      for (let Y = 0;Y < 14; Y++) {
        let K = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: new THREE.Color(0.55, 0.55, 0.6), transparent: true, depthWrite: false, opacity: 0.9 }));
        K.position.set(U + (Math.random() - 0.5) * 0.8, 0.3 + Math.random() * 1.4, q + (Math.random() - 0.5) * 0.8), K.userData.v = [(Math.random() - 0.5) * 1.2, 0.3 + Math.random() * 0.6, (Math.random() - 0.5) * 1.2], Z.add(K), E.push(K);
      }
      job($, J, (Y, K) => {
        return E.forEach((V) => {
          let X = V.userData.v;
          V.position.x += X[0] * K, V.position.y += X[1] * K, V.position.z += X[2] * K, V.scale.setScalar(0.9 + Y.t * 1.6), V.material.opacity = Math.max(0, 0.9 - Y.t * 0.32);
        }), Y.t > 2.9;
      }, () => E.forEach((Y) => Z.remove(Y)));
    } else if (Q === 8) {
      $.sfx("crowd");
      let E = new THREE.Group, Y = mesh(box(1.1, 0.012, 1), std("#a00a24", 0.9));
      Y.position.set(0, 0, 0.5), E.add(Y), [-1, 1].forEach((K) => {
        let V = new THREE.Mesh(box(0.04, 0.014, 1), GOLD());
        V.position.set(K * 0.55, 0, 0.5), E.add(V);
      }), E.position.set(U, 0.008, q), Z.add(E), job($, J, (K) => {
        if (E.scale.set(1, 1, Math.min(1, K.t * 1.4) * 3.2), (K.t * 7 | 0) !== K.n) {
          K.n = K.t * 7 | 0;
          let V = Math.random() < 0.5 ? -1 : 1;
          $.fx.sparkle(U + V * 1.3, 1.4 + Math.random() * 0.6, q + Math.random() * 2.5, 6, [1, 1, 1]);
        }
        return K.t > 4.6;
      }, () => Z.remove(E));
    } else if (Q === 9)
      job($, J, (E) => {
        let Y = E.t / 0.5 | 0;
        if (Y !== E.n && Y < 6)
          E.n = Y, $.fx.sparkle(U + (Math.random() - 0.5) * 3, 3.4 + Math.random(), q + (Math.random() - 0.5), 80, [[1, 0.3, 0.4], [1, 0.85, 0.3], [0.3, 0.8, 1], [0.5, 1, 0.5], [0.9, 0.4, 1], [1, 0.6, 0.2]][Y]), $.sfx("boom", 0.35);
        return E.t > 3.2;
      });
    else if (Q === 10) {
      $.sfx("whoosh"), $.sfx("ding");
      let E = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 5, 24, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 1.8, 2.6), transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      E.position.set(U, 2.5, q), Z.add(E), job($, J, (Y) => {
        let K = J.root.position;
        if (E.position.x = K.x, E.position.z = K.z, E.material.opacity = Math.max(0, 0.7 - Y.t * 0.3), E.scale.set(1 - Y.t * 0.18, 1, 1 - Y.t * 0.18), (Y.t * 10 | 0) !== Y.n)
          Y.n = Y.t * 10 | 0, $.fx.sparkle(K.x, 0.2 + Math.random() * 2, K.z, 6, [0.5, 0.9, 1]);
        return Y.t > 2.4;
      }, () => Z.remove(E));
    } else if (Q === 11) {
      let E = new THREE.Group;
      E.add(mesh(new THREE.IcosahedronGeometry(0.28, 1), std("#3a2a22", 0.9, 0, { emissive: "#ff4a00", emissiveIntensity: 0.8 })));
      let Y = flame(1.6);
      Y.position.y = 0.6, E.add(Y), E.add(glow([3, 1, 0.2], 1.6, 0.7)), Z.add(E), $.sfx("whee"), job($, J, (K) => {
        if (K.t < 0.8) {
          let V = K.t / 0.8;
          E.position.set(U + 2.5 * (1 - V), 9 * (1 - V) + 0.3, q - 1.5 * (1 - V)), Y.material.opacity = 0.9;
        } else if (!K.hit)
          K.hit = 1, E.visible = false, $.sfx("boom"), $.shk = Math.max($.shk || 0, 0.6), $.fx.fire(U, 0.1, q, 1.6), $.fx.sparkle(U, 0.5, q, 90, [1, 0.6, 0.2]);
        return K.t > 2.2;
      }, () => Z.remove(E));
    } else
      $.sfx("whoosh");
  };

export {flame, glow};
