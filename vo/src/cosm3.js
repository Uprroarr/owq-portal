import * as THREE from 'three';
import {box, cyl, lathe, rbox, sph} from './geo.js';
import {cv, tex} from './tex.js';
import {BLK, CHROME, DIA, EXT, GOLD, M, SM, glowTex, hdr, mesh, mk, monitor, patTex, rgbMat, screenTex, std, textTex} from './cosm.js';
import {flame, glow} from './cosm2.js';

var TAU = Math.PI * 2;
var put = ($, J, Q, Z, U, q, E, Y) => {
    return M(J, Q, Z, U, q, E, Y), $.add(J), J;
  };
function panel($, J, Q, Z) {
    let U = new THREE.Group;
    U.add(mesh(rbox($ + 0.03, J + 0.03, 0.025, 0.008), BLK()));
    let q = new THREE.Mesh(new THREE.PlaneGeometry($, J), new THREE.MeshBasicMaterial({ map: Q || screenTex(), color: Z || new THREE.Color(1.25, 1.25, 1.25) }));
    return q.position.z = -0.014, q.rotation.y = Math.PI, U.add(q), U;
  }
var T1 = null;
function tex1() {
    if (T1)
      return T1;
    let $ = cv(256, 192), J = $.getContext("2d");
    return J.fillStyle = "#031a08", J.fillRect(0, 0, 256, 192), J.font = "bold 15px monospace", J.fillStyle = "#3dff7a", J.shadowColor = "#3dff7a", J.shadowBlur = 6, ["OWQ DIALER v1.0", "> LOAD LEADS... OK", "> CALL #1042", "  STATUS: SOLD", "> NEXT LEAD", "  ONLY WINNERS_"].forEach((Q, Z) => J.fillText(Q, 12, 26 + Z * 27)), T1 = tex($, { mips: false }), T1;
  }
var T2 = null;
function tex2() {
    if (T2)
      return T2;
    let $ = cv(512, 288), J = $.getContext("2d");
    J.fillStyle = "rgba(0,40,60,.35)", J.fillRect(0, 0, 512, 288), J.strokeStyle = "#7ef9ff", J.lineWidth = 3, J.strokeRect(6, 6, 500, 276), J.beginPath();
    for (let Q = 0;Q <= 20; Q++) {
      let Z = 24 + Q * 23, U = 220 - Q * 7 - Math.sin(Q * 1.1) * 18;
      Q ? J.lineTo(Z, U) : J.moveTo(Z, U);
    }
    J.stroke(), J.fillStyle = "rgba(126,249,255,.6)";
    for (let Q = 0;Q < 7; Q++)
      J.fillRect(30 + Q * 64, 250 - (20 + Q * 15), 36, 20 + Q * 15);
    return J.font = "bold 22px Verdana", J.fillStyle = "#e8feff", J.fillText("LIVE PIPELINE", 20, 36), T2 = tex($, { mips: false }), T2;
  }
EXT.setup = function($, { put: J, g: Q, x: Z, z: U, Y: q, Z: E, ups: Y }) {
    if ($ === 7 || $ === 9) {
      let K = $ === 7 ? std("#c9cdd4", 0.3, 0.85) : std("#e8a598", 0.24, 1), V = mesh(rbox(0.38, 0.018, 0.26, 0.006), K);
      V.position.set(Z, 0.775, U - 0.18), Q.add(V);
      let X = new THREE.Group;
      X.position.set(Z, 0.784, U - 0.05), X.rotation.x = -0.25, Q.add(X);
      let W = mesh(rbox(0.38, 0.25, 0.012, 0.006), K);
      W.position.y = 0.125, X.add(W);
      let H = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.22), new THREE.MeshBasicMaterial({ map: screenTex(), color: new THREE.Color(1.3, 1.3, 1.3) }));
      H.position.set(0, 0.125, -0.008), H.rotation.y = Math.PI, X.add(H);
    } else if ($ === 8) {
      let K = std("#d9cfb4", 0.7), V = new THREE.Group;
      V.position.set(Z, 0.766, U + 0.02), Q.add(V), V.add(M(mesh(rbox(0.44, 0.36, 0.4, 0.05), K), 0, 0.2, 0.02)), V.add(M(mesh(rbox(0.3, 0.2, 0.2, 0.04), K), 0, 0.2, 0.25));
      let X = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.25), new THREE.MeshBasicMaterial({ map: tex1(), color: new THREE.Color(1.4, 1.4, 1.4) }));
      X.position.set(0, 0.21, -0.181), X.rotation.y = Math.PI, V.add(X), V.add(M(mesh(rbox(0.42, 0.025, 0.15, 0.008), K), 0, 0.013, -0.33));
      let W = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.25), new THREE.MeshBasicMaterial({ color: "#3dff7a", transparent: true, opacity: 0.08, depthWrite: false }));
      W.position.set(0, 0.21, -0.183), W.rotation.y = Math.PI, V.add(W), Y.push((H) => {
        W.material.opacity = 0.05 + 0.05 * Math.random();
      });
    } else if ($ === 10)
      [[-0.235, 0, 0.16], [0.235, 0, -0.16], [-0.235, 0.29, 0.16], [0.235, 0.29, -0.16]].forEach(([K, V, X]) => {
        let W = panel(0.44, 0.26);
        W.position.set(Z + K, q + 0.02 + V, E), W.rotation.y = X, Q.add(W);
      }), Q.add(M(mesh(cyl(0.016, 0.016, 0.62, 10), BLK()), Z, 1.07, E + 0.05)), Q.add(M(mesh(rbox(0.24, 0.014, 0.16, 0.004), BLK()), Z, 0.773, E + 0.05));
    else if ($ === 11) {
      for (let K = 0;K < 3; K++)
        for (let V = 0;V < 3; V++) {
          let X = panel(0.36, 0.21);
          X.position.set(Z + (V - 1) * 0.385, q - 0.02 + K * 0.235, E + 0.04), X.rotation.y = (1 - V) * 0.12, Q.add(X);
        }
      Q.add(M(mesh(box(1.2, 0.02, 0.03), BLK()), Z, q + 0.6, E + 0.06)), [-1, 1].forEach((K) => Q.add(M(mesh(box(0.03, 0.8, 0.03), BLK()), Z + K * 0.6, 1.12, E + 0.06)));
    } else if ($ === 12) {
      let K = new THREE.Group;
      K.position.set(Z, 0.766, U + 0.02), Q.add(K), K.add(M(mesh(cyl(0.1, 0.11, 0.03, 24), std("#141418", 0.35, 0.5)), 0, 0.015, 0)), K.add(M(new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.006, 6, 32), hdr(0.4, 2.4, 3)), 0, 0.032, 0, Math.PI / 2));
      let V = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.08, 0.36, 24, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 1.6, 2.2), transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      V.position.y = 0.22, K.add(V);
      let X = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.46), new THREE.MeshBasicMaterial({ map: tex2(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1.4, 1.6, 1.8), side: THREE.DoubleSide }));
      X.position.set(0, 0.6, 0), K.add(X);
      let W = [];
      [0, 1, 2].forEach((H) => {
        let N = new THREE.Mesh(new THREE.TorusGeometry(0.05 + H * 0.02, 0.004, 6, 24), hdr(0.4, 2.2, 3));
        N.position.set(0.5, 0.35 + H * 0.12, 0), K.add(N), W.push(N);
      }), Y.push((H) => {
        X.material.opacity = 0.85 + 0.15 * Math.sin(H * 20) * Math.sin(H * 3), W.forEach((N, F) => {
          N.rotation.x = H * (1 + F * 0.4), N.rotation.y = H * 0.7;
        });
      });
    } else if ($ === 13) {
      let K = monitor(1.05, 0.32, 1);
      K.position.set(Z, q, E), Q.add(K), [-1, 1].forEach((H) => {
        let N = panel(0.26, 0.44);
        N.position.set(Z + H * 0.72, q + 0.1, E + 0.12), N.rotation.y = -H * 0.55, Q.add(N);
      }), [-1, 1].forEach((H) => {
        let N = panel(0.34, 0.2);
        N.position.set(Z + H * 0.2, q + 0.33, E + 0.03), N.rotation.set(0.12, -H * 0.08, 0), Q.add(N);
      });
      let V = rgbMat();
      V._rgb = 1;
      let X = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.05), V);
      X.position.set(Z, 0.79, E + 0.03), Q.add(X);
      let W = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.006, 6, 40), hdr(3, 0.3, 0.6));
      W.position.set(Z, q + 0.62, E), Q.add(W), Y.push((H) => {
        W.rotation.x = Math.PI / 2 + Math.sin(H) * 0.3, W.rotation.z = H;
      });
    }
  };
EXT.item = function($, J, Q) {
    if ($ === 9) {
      let Z = std("#c4141d", 0.4);
      put(J, mesh(cyl(0.035, 0.032, 0.08, 20), Z), 0, 0.04, 0), put(J, mesh(new THREE.TorusGeometry(0.022, 0.006, 8, 16), Z), 0.037, 0.045, 0, 0, 0, 0), put(J, new THREE.Mesh(cyl(0.03, 0.03, 0.002, 16), std("#2a160a", 0.3)), 0, 0.077, 0);
      let U = [0, 1].map((q) => {
        let E = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: "#ffffff", transparent: true, depthWrite: false, opacity: 0.2 }));
        return E.scale.setScalar(0.05), J.add(E), E;
      });
      Q.push((q) => U.forEach((E, Y) => {
        let K = (q * 0.4 + Y * 0.5) % 1;
        E.position.set(Math.sin(q + Y * 3) * 0.01, 0.09 + K * 0.12, 0), E.material.opacity = 0.22 * (1 - K), E.scale.setScalar(0.04 + K * 0.05);
      }));
    } else if ($ === 10) {
      let Z = std("#ffd21a", 0.35), U = std("#ff8a1a", 0.4), q = mesh(sph(0.045, 18, 12), Z);
      q.scale.set(1.2, 0.85, 1), q.position.y = 0.038, J.add(q), put(J, mesh(sph(0.03, 16, 12), Z), 0, 0.09, 0.02);
      let E = mesh(sph(1, 12, 8), U);
      E.scale.set(0.018, 0.007, 0.02), E.position.set(0, 0.085, 0.05), J.add(E), [-1, 1].forEach((Y) => put(J, new THREE.Mesh(sph(0.005, 6, 5), std("#0a0a0a", 0.2)), Y * 0.013, 0.1, 0.044)), put(J, mesh(new THREE.ConeGeometry(0.015, 0.03, 8), Z), 0, 0.06, -0.055, -1.2), Q.push((Y) => {
        J.rotation.z = Math.sin(Y * 1.7) * 0.05;
      });
    } else if ($ === 11) {
      put(J, mesh(cyl(0.042, 0.032, 0.06, 16), std("#c0643a", 0.85)), 0, 0.03, 0), put(J, new THREE.Mesh(cyl(0.038, 0.038, 0.004, 16), std("#3a2614", 0.9)), 0, 0.058, 0);
      let Z = std("#3f9a4a", 0.7);
      put(J, mesh(new THREE.CapsuleGeometry(0.022, 0.08, 6, 12), Z), 0, 0.11, 0), put(J, mesh(new THREE.CapsuleGeometry(0.012, 0.03, 4, 8), Z), 0.03, 0.11, 0, 0, 0, -0.9), put(J, mesh(new THREE.CapsuleGeometry(0.012, 0.026, 4, 8), Z), -0.028, 0.13, 0, 0, 0, 0.9), put(J, mesh(sph(0.012, 8, 6), std("#ff7ab6", 0.5)), 0, 0.17, 0);
    } else if ($ === 12) {
      let Z = GOLD();
      put(J, mesh(cyl(0.035, 0.045, 0.015, 20), Z), 0, 0.008, 0), put(J, mesh(new THREE.TorusGeometry(0.065, 0.004, 6, 24, Math.PI), Z), 0, 0.08, 0, 0, Math.PI / 2, -0.4);
      let U = mk("globe", () => {
        let E = cv(256, 128), Y = E.getContext("2d");
        return Y.fillStyle = "#1f5fd6", Y.fillRect(0, 0, 256, 128), Y.fillStyle = "#3dbb5a", [[40, 40, 26, 18], [70, 80, 18, 26], [130, 46, 34, 20], [150, 82, 16, 22], [205, 50, 30, 18], [220, 96, 14, 10]].forEach(([K, V, X, W]) => {
          Y.beginPath(), Y.ellipse(K, V, X, W, 0.3, 0, 6.283), Y.fill();
        }), SM({ map: tex(E), roughness: 0.5 });
      }), q = mesh(sph(0.06, 24, 16), U);
      q.position.y = 0.08, q.rotation.z = 0.4, J.add(q), Q.push((E) => {
        q.rotation.y = E * 0.8;
      });
    } else if ($ === 13) {
      let Z = new THREE.Group;
      Z.position.y = 0.075, J.add(Z);
      let U = std("#6b4425", 0.6), q = std("#dff3ff", 0.05, 0, { transparent: true, opacity: 0.3, depthWrite: false });
      [-1, 1].forEach((V) => {
        Z.add(M(mesh(cyl(0.045, 0.045, 0.012, 16), U), 0, V * 0.07, 0)), Z.add(M(new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.06, 16, 1, true), q), 0, V * 0.033, 0, V > 0 ? Math.PI : 0));
      });
      for (let V = 0;V < 3; V++) {
        let X = V / 3 * TAU;
        Z.add(M(mesh(cyl(0.004, 0.004, 0.14, 6), U), Math.sin(X) * 0.04, 0, Math.cos(X) * 0.04));
      }
      let E = std("#f2c35a", 0.8), Y = mesh(new THREE.ConeGeometry(0.03, 0.05, 14), E), K = mesh(new THREE.ConeGeometry(0.03, 0.05, 14), E);
      Y.rotation.x = Math.PI, Z.add(Y), Z.add(K), Q.push((V) => {
        let X = V % 8, W = Math.min(1, X / 6.5);
        Y.scale.set(1 - W * 0.9, 1 - W * 0.9, 1 - W * 0.9), Y.position.y = 0.035 - (1 - (1 - W * 0.9)) * 0, K.scale.set(0.1 + W * 0.9, 0.1 + W * 0.9, 0.1 + W * 0.9), K.position.y = -0.06 + 0.025 * (0.1 + W * 0.9), Z.rotation.z = X > 7 ? (X - 7) * Math.PI : 0;
      });
    } else if ($ === 14) {
      let Z = EXT.car(19);
      if (Z)
        Z.scale.setScalar(0.045), Z.rotation.y = -0.6, J.add(Z);
    } else if ($ === 15) {
      let Z = GOLD();
      put(J, mesh(rbox(0.11, 0.035, 0.08, 0.012), Z), 0, 0.018, 0), put(J, mesh(new THREE.CapsuleGeometry(0.012, 0.08, 4, 10), Z), 0, 0.05, -0.005, 0, 0, Math.PI / 2), [-1, 1].forEach((U) => put(J, mesh(sph(0.016, 10, 8), Z), U * 0.05, 0.05, -0.005)), put(J, mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 18), std("#111114", 0.4)), 0, 0.022, 0.041), put(J, new THREE.Mesh(new THREE.CircleGeometry(0.01, 14), std("#fff6dc", 0.4)), 0, 0.022, 0.0415);
    } else if ($ === 16) {
      let Z = CHROME();
      [-1, 1].forEach((q) => {
        put(J, mesh(cyl(0.003, 0.003, 0.11, 6), Z), q * 0.055, 0.055, 0.03), put(J, mesh(cyl(0.003, 0.003, 0.11, 6), Z), q * 0.055, 0.055, -0.03);
      }), [-0.03, 0.03].forEach((q) => put(J, mesh(cyl(0.003, 0.003, 0.11, 6), Z), 0, 0.11, q, 0, 0, Math.PI / 2)), put(J, mesh(rbox(0.13, 0.008, 0.08, 0.003), BLK()), 0, 0.004, 0);
      let U = [];
      for (let q = 0;q < 5; q++) {
        let E = new THREE.Group;
        E.position.set(-0.024 + q * 0.012, 0.11, 0), J.add(E);
        let Y = std("#9aa3ad", 0.4, 0.6);
        [-0.03, 0.03].forEach((K) => {
          let V = new THREE.Mesh(cyl(0.0008, 0.0008, 0.075, 4), Y);
          V.position.set(0, -0.035, K * 0.6), V.rotation.x = K > 0 ? 0.38 : -0.38, E.add(V);
        }), E.add(M(mesh(sph(0.006, 12, 8), Z), 0, -0.07, 0)), U.push(E);
      }
      Q.push((q) => {
        let E = Math.sin(q * 4.2);
        U[0].rotation.z = E < 0 ? E * 0.6 : 0, U[4].rotation.z = E > 0 ? E * 0.6 : 0;
      });
    } else if ($ === 17) {
      put(J, mesh(cyl(0.03, 0.035, 0.01, 14), std("#4a4d55", 0.5, 0.4)), 0, 0.005, 0);
      let Z = new THREE.Group;
      Z.position.y = 0.012, J.add(Z), Z.add(mesh(lathe([[0, 0], [0.016, 0], [0.018, 0.03], [0.018, 0.09], [0.014, 0.11], [0, 0.14]], 18), std("#f4f5f7", 0.35))), Z.add(M(mesh(new THREE.ConeGeometry(0.0185, 0.04, 18), std("#c4141d", 0.4)), 0, 0.13, 0));
      for (let q = 0;q < 3; q++) {
        let E = q / 3 * TAU, Y = mesh(box(0.003, 0.03, 0.022), std("#c4141d", 0.4));
        Y.position.set(Math.sin(E) * 0.02, 0.018, Math.cos(E) * 0.02), Y.rotation.y = E, Z.add(Y);
      }
      let U = flame(0.06);
      U.position.y = -0.005, Z.add(U), Q.push((q) => {
        let E = 0.7 + 0.3 * Math.sin(q * 23);
        U.scale.set(0.025 * E, 0.05 * E, 1);
      });
    } else if ($ === 18) {
      put(J, mesh(lathe([[0, 0], [0.04, 0], [0.04, 0.01], [0.025, 0.03], [0.03, 0.045], [0, 0.045]], 20), GOLD()), 0, 0, 0);
      let Z = new THREE.Mesh(sph(0.045, 24, 16), std("#b98cff", 0.05, 0, { transparent: true, opacity: 0.55, emissive: "#4a1a8a", emissiveIntensity: 0.6 }));
      Z.position.y = 0.09, J.add(Z);
      let U = glow([2, 0.8, 3], 0.12, 0.6);
      U.position.y = 0.09, J.add(U), Q.push((q) => {
        U.material.opacity = 0.4 + 0.3 * Math.sin(q * 2.2), U.scale.setScalar(0.09 + 0.04 * Math.sin(q * 1.7)), U.position.x = Math.sin(q * 1.3) * 0.008;
      });
    } else if ($ === 19) {
      put(J, new THREE.Mesh(box(0.15, 0.11, 0.085), std("#dff3ff", 0.03, 0, { transparent: true, opacity: 0.22, depthWrite: false })), 0, 0.055, 0), put(J, new THREE.Mesh(box(0.142, 0.085, 0.078), std("#3aa8ff", 0.1, 0, { transparent: true, opacity: 0.28, depthWrite: false })), 0, 0.047, 0), put(J, mesh(box(0.144, 0.012, 0.08), std("#c9b48f", 0.9)), 0, 0.006, 0);
      let Z = [];
      ["#ff7a1a", "#ffd21a", "#ff3a6a"].forEach((U, q) => {
        let E = new THREE.Group, Y = std(U, 0.4), K = mesh(sph(1, 10, 8), Y);
        K.scale.set(0.012, 0.008, 0.005), E.add(K);
        let V = mesh(new THREE.ConeGeometry(0.006, 0.01, 6), Y);
        V.position.x = -0.014, V.rotation.z = Math.PI / 2, E.add(V), J.add(E), Z.push(E);
      }), Q.push((U) => Z.forEach((q, E) => {
        let Y = U * (0.6 + E * 0.15) + E * 2;
        q.position.set(Math.cos(Y) * 0.05, 0.035 + E * 0.017 + Math.sin(U * 1.3 + E) * 0.006, Math.sin(Y) * 0.025), q.rotation.y = -Y - Math.PI / 2;
      }));
    } else if ($ === 20) {
      put(J, mesh(cyl(0.025, 0.03, 0.01, 14), BLK()), 0, 0.005, 0), put(J, mesh(cyl(0.003, 0.003, 0.16, 6), CHROME()), 0, 0.085, 0);
      let Z = new THREE.Mesh(new THREE.IcosahedronGeometry(0.045, 2), new THREE.MeshStandardMaterial({ color: "#e6e8ee", roughness: 0.08, metalness: 1, flatShading: true }));
      Z.position.y = 0.21, J.add(Z);
      let U = [];
      for (let q = 0;q < 6; q++) {
        let E = new THREE.Mesh(sph(0.004, 6, 4), hdr(3, 3, 3));
        J.add(E), U.push(E);
      }
      Q.push((q) => {
        Z.rotation.y = q * 1.2, U.forEach((E, Y) => {
          let K = q * 1.2 + Y * 1.05, V = 0.09 + 0.03 * Math.sin(Y);
          E.position.set(Math.cos(K) * V, 0.21 + Math.sin(Y * 2.1) * 0.06, Math.sin(K) * V), E.visible = Math.sin(q * 6 + Y) > -0.2;
        });
      });
    } else if ($ === 21) {
      let Z = DIA();
      put(J, mesh(rbox(0.14, 0.02, 0.07, 0.006), GOLD()), 0, 0.01, 0);
      let U = new THREE.Group;
      U.position.y = 0.02, J.add(U);
      let q = mesh(new THREE.CapsuleGeometry(0.025, 0.06, 6, 12), Z);
      q.rotation.z = Math.PI / 2, q.position.y = 0.045, q.scale.set(1, 1, 0.85), U.add(q);
      let E = mesh(sph(0.022, 14, 10), Z);
      E.position.set(0.052, 0.04, 0), E.scale.set(1.2, 0.9, 0.9), U.add(E), [-1, 1].forEach((K) => {
        U.add(M(mesh(new THREE.ConeGeometry(0.006, 0.03, 8), Z), 0.058, 0.06, K * 0.018, K * 0.6, 0, -0.6)), [-1, 1].forEach((V) => U.add(M(mesh(cyl(0.006, 0.005, 0.03, 8), Z), V * 0.03, 0.015, K * 0.014)));
      });
      let Y = glow([1.6, 2.4, 3], 0.2, 0.4);
      Y.position.y = 0.06, J.add(Y), Q.push((K) => {
        Y.material.opacity = 0.25 + 0.2 * Math.sin(K * 2.5);
      });
    }
  };
EXT.chairHide = ($) => $ === 6 ? [0] : [0, 1];
EXT.chair = function($, J, Q) {
    if ($ === 4) {
      let Z = std("#8a5a32", 0.55);
      J.add(M(mesh(cyl(0.21, 0.2, 0.05, 28), Z), 0, 0.47, 0));
      for (let U = 0;U < 3; U++) {
        let q = U / 3 * TAU, E = mesh(cyl(0.018, 0.022, 0.47, 10), Z);
        E.position.set(Math.sin(q) * 0.13, 0.23, Math.cos(q) * 0.13), E.rotation.set(Math.cos(q) * 0.18, 0, -Math.sin(q) * 0.18), J.add(E);
      }
      J.add(M(mesh(new THREE.TorusGeometry(0.14, 0.01, 6, 24), Z), 0, 0.18, 0, Math.PI / 2));
    } else if ($ === 5) {
      let Z = std("#c4141d", 0.95), U = mesh(sph(0.42, 32, 20), Z);
      U.scale.set(1.15, 0.62, 1.1), U.position.y = 0.27, J.add(U);
      let q = mesh(sph(0.34, 28, 18), Z);
      q.scale.set(1.05, 0.95, 0.55), q.position.set(0, 0.62, -0.3), J.add(q);
    } else if ($ === 6) {
      let Z = std("#141416", 0.45), U = std("#ffcf40", 0.5), q = mk("rc", () => SM({ map: (() => {
        return patTex("check");
      })(), roughness: 0.5 }));
      J.add(M(mesh(rbox(0.56, 0.12, 0.54, 0.04), Z), 0, 0.47));
      let E = mesh(rbox(0.54, 1, 0.12, 0.05), Z);
      M(E, 0, 1.02, -0.28, -0.14), J.add(E), [-1, 1].forEach((Y) => {
        J.add(M(mesh(rbox(0.1, 0.9, 0.16, 0.04), U), Y * 0.25, 1, -0.24, -0.14, 0, Y * 0.06)), J.add(M(mesh(rbox(0.1, 0.14, 0.5, 0.04), U), Y * 0.25, 0.56, 0)), J.add(M(new THREE.Mesh(box(0.06, 0.16, 0.01), BLK()), Y * 0.1, 1.32, -0.21, -0.14));
      }), J.add(M(mesh(rbox(0.3, 0.12, 0.06, 0.02), q), 0, 1.15, -0.215, -0.14));
    } else if ($ === 7) {
      let Z = new THREE.Mesh(new THREE.SphereGeometry(0.56, 36, 24, Math.PI / 2 + 0.95, TAU - 1.9, 0.15, 2.25), std("#f6f6f8", 0.15, 0.1, { side: THREE.DoubleSide }));
      Z.position.set(0, 0.82, -0.05), Z.castShadow = true, J.add(Z);
      let U = std("#c4141d", 0.9);
      J.add(M(mesh(rbox(0.56, 0.1, 0.5, 0.04), U), 0, 0.47, 0)), J.add(M(mesh(rbox(0.5, 0.62, 0.1, 0.04), U), 0, 0.88, -0.36, -0.1)), J.add(M(mesh(cyl(0.05, 0.05, 0.3, 12), CHROME()), 0, 0.2, 0)), J.add(M(mesh(cyl(0.3, 0.32, 0.03, 28), CHROME()), 0, 0.03, 0));
    } else if ($ === 8) {
      let Z = std("#16161a", 0.4, 0.15), U = hdr(0.3, 1.4, 3);
      J.add(M(mesh(rbox(0.66, 0.38, 0.62, 0.08), Z), 0, 0.29)), J.add(M(mesh(rbox(0.62, 0.18, 0.58, 0.07), Z), 0, 0.53));
      let q = mesh(rbox(0.64, 1.05, 0.22, 0.09), Z);
      M(q, 0, 1.02, -0.3, -0.18), J.add(q), J.add(M(mesh(rbox(0.36, 0.18, 0.14, 0.06), Z), 0, 1.55, -0.39, -0.18)), [-1, 1].forEach((E) => {
        J.add(M(mesh(rbox(0.14, 0.24, 0.6, 0.05), Z), E * 0.38, 0.66, -0.02)), J.add(M(new THREE.Mesh(box(0.012, 0.012, 0.5), U), E * 0.452, 0.7, -0.02));
      }), J.add(M(mesh(rbox(0.5, 0.1, 0.36, 0.04), Z), 0, 0.18, 0.42, 0.5)), Q.push((E) => {
        J.position.y = Math.sin(E * 90) * 0.0015;
      });
    } else if ($ === 9) {
      let Z = std("#ffffff", 0.95, 0, { emissive: "#8aa0c0", emissiveIntensity: 0.25 });
      [[0, 0.42, 0, 0.3], [0.22, 0.44, 0.08, 0.2], [-0.22, 0.44, 0.08, 0.2], [0.18, 0.4, -0.18, 0.22], [-0.18, 0.4, -0.18, 0.22], [0, 0.4, 0.22, 0.2], [0, 0.85, -0.3, 0.26], [0.2, 0.75, -0.28, 0.2], [-0.2, 0.75, -0.28, 0.2], [0, 1.08, -0.32, 0.18], [0.28, 0.56, -0.05, 0.14], [-0.28, 0.56, -0.05, 0.14]].forEach(([q, E, Y, K]) => {
        let V = mesh(sph(K, 18, 12), Z);
        V.position.set(q, E, Y), V.scale.y = 0.8, J.add(V);
      });
      let U = glow([1.6, 1.8, 2.4], 1.4, 0.25);
      U.position.y = 0.6, J.add(U), Q.push((q) => {
        J.position.y = 0.05 + Math.sin(q * 1.4) * 0.025;
      });
    } else if ($ === 10) {
      let Z = std("#bfe9ff", 0.05, 0.1, { transparent: true, opacity: 0.78, emissive: "#3a8ab0", emissiveIntensity: 0.45 }), U = hdr(0.5, 2.4, 3.2);
      J.add(M(mesh(rbox(0.66, 0.16, 0.6, 0.04), Z), 0, 0.42)), J.add(M(mesh(rbox(0.58, 0.08, 0.52, 0.04), std("#e8f6ff", 0.6)), 0, 0.52));
      let q = mesh(rbox(0.66, 1.45, 0.12, 0.04), Z);
      M(q, 0, 1.2, -0.31), J.add(q);
      for (let Y = 0;Y < 7; Y++) {
        let K = mesh(new THREE.ConeGeometry(0.04, 0.22 + Y * 37 % 5 * 0.04, 6), Z);
        M(K, -0.27 + Y * 0.09, 2.02, -0.31), J.add(K);
      }
      for (let Y = 0;Y < 3; Y++)
        J.add(M(new THREE.Mesh(new THREE.OctahedronGeometry(0.03), U), -0.15 + Y * 0.15, 1.85, -0.24));
      [-1, 1].forEach((Y) => {
        J.add(M(mesh(rbox(0.1, 0.3, 0.56, 0.03), Z), Y * 0.36, 0.62, -0.02)), [-1, 1].forEach((K) => J.add(M(mesh(cyl(0.035, 0.045, 0.36, 8), Z), Y * 0.28, 0.18, K * 0.24)));
      });
      let E = glow([0.8, 1.8, 2.6], 1.6, 0.3);
      E.position.y = 1.1, J.add(E), Q.push((Y) => {
        E.material.opacity = 0.22 + 0.1 * Math.sin(Y * 2);
      });
    }
  };
var mTire = () => std("#141416", 0.85);
var mGlass = () => std("#141c26", 0.05, 0.4, { envMapIntensity: 2 });
var mLite = () => hdr(3.2, 3, 2.6);
var mTail = () => hdr(3, 0.15, 0.2);
function wheels($, J, Q, Z, U = {}) {
    let q = [], E = U.xs || [J * 0.32, -J * 0.32], Y = U.ww || 0.24, K = U.zw || Q / 2 - 0.06;
    return E.forEach((V) => [1, -1].forEach((X) => {
      let W = new THREE.Group;
      W.position.set(V, Z, X * K);
      let H = mesh(cyl(Z, Z, Y, 22), mTire());
      H.rotation.x = Math.PI / 2, W.add(H);
      let N = mesh(cyl(Z * 0.62, Z * 0.62, Y + 0.01, 14), U.rim || CHROME());
      N.rotation.x = Math.PI / 2, W.add(N), $.add(W), q.push(W);
    })), $.userData.spin = (V) => q.forEach((X) => {
      X.rotation.z -= V / Z;
    }), q;
  }
function lights($, J, Q, Z, U = {}) {
    [-1, 1].forEach((q) => {
      let E = new THREE.Mesh(box(0.04, 0.08, 0.28), mLite());
      E.position.set(J / 2 + 0.005, Z, q * Q * 0.33), $.add(E);
      let Y = new THREE.Mesh(box(0.04, 0.08, 0.3), mTail());
      Y.position.set(-J / 2 - 0.005, Z, q * Q * 0.33), $.add(Y);
    });
  }
function sideText($, J, Q, Z, U, q, E, Y = 0) {
    [-1, 1].forEach((K) => {
      let V = new THREE.Mesh(new THREE.PlaneGeometry(Q, Q * 0.2), new THREE.MeshBasicMaterial({ map: textTex(J, { w: 512, h: 102, font: "900 64px Verdana", col: q, bg: E }), transparent: !E }));
      V.position.set(Y, U, K * (Z / 2 + 0.006)), V.rotation.y = K > 0 ? 0 : Math.PI, $.add(V);
    });
  }
EXT.car = function($) {
    let J = new THREE.Group;
    J.name = "car" + $;
    let Q = 3.4;
    if ($ === 11) {
      Q = 2.4;
      let Z = 1.25, U = std("#f4f5f7", 0.35), q = std("#c4141d", 0.6);
      J.add(M(mesh(rbox(Q * 0.92, 0.3, Z, 0.08), U), 0, 0.36)), J.add(M(mesh(rbox(0.5, 0.36, Z * 0.92, 0.08), U), 0.88, 0.6)), J.add(M(mesh(rbox(0.7, 0.12, Z * 0.86, 0.04), q), -0.2, 0.62)), J.add(M(mesh(rbox(0.12, 0.46, Z * 0.86, 0.04), q), -0.55, 0.88)), J.add(M(mesh(rbox(1.85, 0.05, Z * 1.06, 0.02), U), -0.12, 1.76)), [[0.62, 1], [0.62, -1], [-0.88, 1], [-0.88, -1]].forEach(([E, Y]) => J.add(M(mesh(cyl(0.025, 0.025, 1.16, 8), BLK()), E, 1.18, Y * 0.56))), J.add(M(new THREE.Mesh(new THREE.PlaneGeometry(Z * 0.92, 0.6), std("#dff3ff", 0.03, 0, { transparent: true, opacity: 0.25, side: THREE.DoubleSide })), 0.64, 1.3, 0, 0, Math.PI / 2, 0.12)), J.add(M(mesh(new THREE.TorusGeometry(0.14, 0.018, 6, 20), BLK()), 0.42, 0.98, 0.25, 0, Math.PI / 2, 0.5)), wheels(J, Q, Z, 0.2, { xs: [0.75, -0.75] }), lights(J, Q, Z, 0.45);
    } else if ($ === 12) {
      Q = 3.8;
      let Z = 1.75, U = std("#f2f2f0", 0.4), q = std("#c4141d", 0.5);
      J.add(M(mesh(rbox(Q, 0.5, Z, 0.08), U), 0, 0.6)), J.add(M(mesh(rbox(Q * 0.7, 1.35, Z, 0.08), U), -0.55, 1.5)), J.add(M(mesh(rbox(Q * 0.3, 0.85, Z * 0.98, 0.12), U), 1.25, 1.1)), J.add(M(mesh(box(0.04, 0.5, Z * 0.86), mGlass()), 1.82, 1.2, 0, 0, 0, -0.35)), [-1, 1].forEach((E) => J.add(M(mesh(box(0.5, 0.36, 0.02), mGlass()), 1.3, 1.28, E * (Z / 2 + 0.004)))), [-1, 1].forEach((E) => J.add(M(new THREE.Mesh(box(Q * 0.68, 0.12, 0.012), q), -0.55, 1, E * (Z / 2 + 0.005)))), sideText(J, "OWQ DELIVERY", 2.3, Z, 1.65, "#c4141d", null, -0.55), wheels(J, Q, Z, 0.36), lights(J, Q, Z, 0.7);
    } else if ($ === 13) {
      Q = 3.45;
      let Z = 1.55, U = std("#f2c21b", 0.3, 0.15);
      J.add(M(mesh(rbox(Q, 0.6, Z, 0.1), U), 0, 0.6)), J.add(M(mesh(rbox(1.65, 0.52, Z * 0.88, 0.12), mGlass()), -0.05, 1.13)), J.add(M(mesh(rbox(1.2, 0.04, Z * 0.84, 0.02), U), -0.08, 1.39));
      let q = mk("taxick", () => SM({ map: patTex("check"), roughness: 0.4 }));
      [-1, 1].forEach((Y) => J.add(M(new THREE.Mesh(box(1.9, 0.1, 0.012), q), 0, 0.74, Y * (Z / 2 + 0.004))));
      let E = new THREE.Group;
      E.position.set(-0.1, 1.5, 0), J.add(E), E.add(mesh(rbox(0.55, 0.17, 0.25, 0.03), std("#ffffff", 0.3, 0, { emissive: "#fff2c0", emissiveIntensity: 0.6 }))), [-1, 1].forEach((Y) => {
        let K = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.14), new THREE.MeshBasicMaterial({ map: textTex("TAXI", { w: 256, h: 72, font: "900 56px Verdana", col: "#111" }), transparent: true }));
        K.position.z = Y * 0.127, K.rotation.y = Y > 0 ? 0 : Math.PI, E.add(K);
      }), wheels(J, Q, Z, 0.32), lights(J, Q, Z, 0.72);
    } else if ($ === 14) {
      Q = 4;
      let Z = 1.8, U = std("#fbfbfa", 0.35);
      J.add(M(mesh(rbox(Q, 0.55, Z, 0.08), U), 0, 0.6)), J.add(M(mesh(rbox(Q * 0.62, 1.3, Z, 0.1), U), -0.6, 1.5)), J.add(M(mesh(rbox(Q * 0.34, 0.85, Z * 0.98, 0.12), U), 1.25, 1.1)), J.add(M(mesh(box(0.04, 0.48, Z * 0.86), mGlass()), 1.92, 1.2, 0, 0, 0, -0.35)), [["#ff9cc2", 1.1], ["#9ff2d8", 1.3]].forEach(([E, Y]) => [-1, 1].forEach((K) => J.add(M(new THREE.Mesh(box(Q * 0.6, 0.1, 0.012), std(E, 0.5)), -0.6, Y, K * (Z / 2 + 0.005))))), [-1, 1].forEach((E) => {
        J.add(M(new THREE.Mesh(box(0.9, 0.45, 0.012), std("#1a1a1e", 0.3)), -0.7, 1.7, E * (Z / 2 + 0.006))), J.add(M(mesh(box(1, 0.03, 0.25), std("#ff7ab6", 0.5)), -0.7, 1.97, E * (Z / 2 + 0.1), E * 0.35));
      });
      let q = new THREE.Group;
      q.position.set(-0.6, 2.15, 0), J.add(q), q.add(M(mesh(new THREE.ConeGeometry(0.26, 0.62, 24), std("#d9a35a", 0.85)), 0, 0.31, 0, Math.PI)), q.add(M(mesh(sph(0.28, 20, 14), std("#ff9cc2", 0.6)), 0, 0.72)), q.add(M(mesh(sph(0.24, 20, 14), std("#9ff2d8", 0.6)), 0, 1)), q.add(M(mesh(sph(0.06, 12, 8), std("#d0102a", 0.3)), 0, 1.25)), wheels(J, Q, Z, 0.36), lights(J, Q, Z, 0.7);
    } else if ($ === 15) {
      Q = 3.9;
      let Z = 1.7, U = 0.58, q = std("#ff6a10", 0.22, 0.25), E = 0.3;
      J.add(M(mesh(rbox(Q, U, Z, 0.08), q), 0, E + U / 2)), [-0.18, 0.18].forEach((Y) => J.add(M(new THREE.Mesh(box(Q * 1.002, 0.02, 0.14), std("#0b0b0d", 0.3)), 0, E + U + 0.006, Y))), J.add(M(mesh(rbox(1.35, 0.44, Z * 0.84, 0.12), mGlass()), -0.4, E + U + 0.2)), J.add(M(mesh(rbox(0.5, 0.1, 0.34, 0.03), BLK()), 0.95, E + U + 0.05)), J.add(M(mesh(box(0.15, 0.06, Z * 0.9), BLK()), -Q / 2 + 0.12, E + U + 0.1)), wheels(J, Q, Z, 0.36), lights(J, Q, Z, E + U * 0.7);
    } else if ($ === 16) {
      Q = 3;
      let Z = 1.55, U = 0.6, q = std("#1f5fd6", 0.3, 0.2), E = 0.27;
      J.add(M(mesh(rbox(Q, U, Z, 0.1), q), 0, E + U / 2)), J.add(M(mesh(rbox(1.6, 0.56, Z * 0.9, 0.1), mGlass()), -0.25, E + U + 0.25)), J.add(M(mesh(rbox(1.5, 0.04, Z * 0.86, 0.02), q), -0.27, E + U + 0.53)), [-1, 1].forEach((Y) => J.add(M(new THREE.Mesh(box(Q * 0.8, 0.08, 0.012), std("#f4f4f4", 0.4)), 0, E + U * 0.6, Y * (Z / 2 + 0.004)))), J.add(M(mesh(rbox(0.14, 0.06, 1, 0.02), BLK()), 0.38, E + U + 0.6));
      for (let Y = 0;Y < 4; Y++)
        J.add(M(new THREE.Mesh(box(0.02, 0.05, 0.16), mLite()), 0.46, E + U + 0.6, -0.36 + Y * 0.24));
      J.add(M(mesh(box(0.3, 0.03, Z * 0.86), q), -1.05, E + U + 0.55)), [-1, 1].forEach((Y) => J.add(M(mesh(box(0.02, 0.22, 0.3), BLK()), -Q * 0.32 - 0.4, 0.2, Y * (Z / 2 - 0.1)))), wheels(J, Q, Z, 0.32), lights(J, Q, Z, E + U * 0.7);
    } else if ($ === 17) {
      Q = 5.8;
      let Z = 1.7, U = 0.55, q = std("#0b0b0d", 0.12, 0.6), E = 0.28;
      J.add(M(mesh(rbox(Q, U, Z, 0.08), q), 0, E + U / 2)), J.add(M(mesh(rbox(Q * 0.62, 0.45, Z * 0.84, 0.12), std("#0a0c10", 0.04, 0.5, { envMapIntensity: 2 })), -0.2, E + U + 0.2)), [-1, 1].forEach((Y) => J.add(M(new THREE.Mesh(box(Q * 0.96, 0.03, 0.012), CHROME()), 0, E + U * 0.55, Y * (Z / 2 + 0.004)))), wheels(J, Q, Z, 0.34, { xs: [Q * 0.37, -Q * 0.37] }), lights(J, Q, Z, E + U * 0.7);
    } else if ($ === 18) {
      Q = 3.5;
      let Z = 1.9, U = 1.05, q = mk("mtb", () => SM({ map: patTex("flame"), roughness: 0.35, metalness: 0.2 }));
      J.add(M(mesh(rbox(Q, 0.6, Z, 0.1), q), 0, U + 0.3)), J.add(M(mesh(rbox(1.25, 0.6, Z * 0.88, 0.12), mGlass()), 0.3, U + 0.85)), J.add(M(mesh(rbox(1.1, 0.05, Z * 0.82, 0.02), std("#c4141d", 0.4)), 0.3, U + 1.15)), J.add(M(mesh(box(1.1, 0.3, Z * 0.94), std("#141416", 0.6)), -1.05, U + 0.68)), [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([E, Y]) => J.add(M(mesh(cyl(0.07, 0.07, 0.8, 10), std("#ffcf40", 0.4, 0.6)), E * Q * 0.34, 0.75, Y * 0.6, Y * 0.3))), wheels(J, Q, Z, 0.78, { ww: 0.55, zw: Z / 2 + 0.2, rim: std("#c4141d", 0.4, 0.4) }), lights(J, Q, Z, U + 0.42);
    } else if ($ === 19) {
      Q = 4.2;
      let Z = std("#d0102a", 0.25, 0.2), U = std("#f4f4f4", 0.35);
      J.add(M(mesh(rbox(2, 0.4, 0.75, 0.1), Z), -0.3, 0.36));
      let q = mesh(rbox(1.4, 0.24, 0.36, 0.08), Z);
      q.position.set(1.3, 0.3, 0), J.add(q), [-1, 1].forEach((E) => J.add(M(mesh(rbox(1.2, 0.32, 0.34, 0.08), U), -0.4, 0.3, E * 0.5))), J.add(M(mesh(cyl(0.26, 0.26, 0.12, 16, true), BLK()), -0.15, 0.6, 0)), J.add(M(mesh(sph(0.17, 16, 12), std("#ffcf40", 0.3)), -0.15, 0.72)), J.add(M(mesh(rbox(0.16, 0.06, 0.22, 0.02), std("#141c26", 0.05, 0.4)), -0.04, 0.73, 0, 0, 0, -0.2)), J.add(M(mesh(rbox(0.5, 0.05, 1.45, 0.02), Z), -1.85, 1)), [-1, 1].forEach((E) => J.add(M(mesh(box(0.55, 0.36, 0.03), Z), -1.85, 0.84, E * 0.73))), J.add(M(mesh(box(0.08, 0.42, 0.06), BLK()), -1.75, 0.66, 0)), J.add(M(mesh(rbox(0.45, 0.04, 1.6, 0.02), U), 2, 0.12)), wheels(J, Q, 1.64, 0.33, { xs: [1.25, -1.35], ww: 0.32, zw: 0.82 });
    } else if ($ === 20) {
      Q = 3.4;
      let Z = 1.6, U = std("#eef3f8", 0.15, 0.35), q = new THREE.Group;
      J.add(q), q.add(M(mesh(rbox(Q, 0.5, Z, 0.24), U), 0, 0.55));
      let E = mesh(sph(1, 28, 18), std("#0a1420", 0.04, 0.5, { envMapIntensity: 2.2 }));
      E.scale.set(0.9, 0.32, 0.62), E.position.set(-0.1, 0.82, 0), q.add(E), [-1, 1].forEach((K) => q.add(M(new THREE.Mesh(box(Q * 0.9, 0.04, 0.012), hdr(0.4, 2.4, 3)), 0, 0.55, K * (Z / 2 + 0.004))));
      let Y = new THREE.Mesh(box(Q * 0.86, 0.02, Z * 0.86), hdr(0.3, 1.6, 3));
      Y.position.y = 0.28, q.add(Y), [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([K, V]) => {
        let X = glow([0.5, 1.8, 3], 0.7, 0.6);
        X.position.set(K * Q * 0.32, 0.22, V * Z * 0.3), q.add(X);
      }), lights(q, Q, Z, 0.6), J.userData.spin = () => {}, Y.onBeforeRender = () => {
        q.position.y = 0.12 + Math.sin(performance.now() * 0.003) * 0.05;
      };
    } else
      return null;
    return J.traverse((Z) => {
      if (Z.isMesh)
        Z.castShadow = true;
    }), J.userData.len = Q, J;
  };
function fuselage($, J, Q, Z = {}) {
    let U = Z.pts || [[0, 0], [J * 0.3, $ * 0.03], [J * 0.75, $ * 0.14], [J, $ * 0.32], [J, $ * 0.64], [J * 0.85, $ * 0.8], [J * 0.45, $ * 0.95], [0, $]], q = lathe(U.map(([E, Y]) => [E, Y]), 24);
    if (q.rotateZ(-Math.PI / 2), q.translate(-$ / 2, 0, 0), Z.sz)
      q.scale(1, Z.sy || 1, Z.sz);
    return mesh(q, Q);
  }
function wing($, J, Q, Z, U = {}) {
    let q = U.taper || 0.6, E = U.sweep || 0, Y = new THREE.Shape;
    Y.moveTo(J / 2, 0), Y.lineTo(J / 2 * q - E, $ / 2), Y.lineTo(-J / 2 * q - E, $ / 2), Y.lineTo(-J / 2, 0), Y.lineTo(-J / 2 * q - E, -$ / 2), Y.lineTo(J / 2 * q - E, -$ / 2), Y.closePath();
    let K = new THREE.ExtrudeGeometry(Y, { depth: Q, bevelEnabled: true, bevelThickness: Q * 0.3, bevelSize: Q * 0.4, bevelSegments: 1 });
    return K.rotateX(Math.PI / 2), K.translate(0, Q / 2, 0), mesh(K, Z);
  }
function fin($, J, Q, Z, U = {}) {
    let q = new THREE.Shape, E = U.sweep == null ? J * 0.4 : U.sweep;
    q.moveTo(0, 0), q.lineTo(-J, 0), q.lineTo(-J - E * 0.2, $), q.lineTo(-J * 0.45 - E * 0.2, $), q.closePath();
    let Y = new THREE.ExtrudeGeometry(q, { depth: Q, bevelEnabled: false });
    return Y.translate(0, 0, -Q / 2), mesh(Y, Z);
  }
function prop($, J, Q, Z, U = 2, q = 0, E = 0) {
    let Y = new THREE.Group;
    Y.position.set(J, q, E), $.add(Y), Y.add(M(mesh(new THREE.ConeGeometry(Q * 0.14, Q * 0.3, 16), Z.sp || std("#ff1f4f", 0.4)), Q * 0.12, 0, 0, 0, 0, -Math.PI / 2));
    for (let K = 0;K < U; K++) {
      let V = mesh(rbox(0.04, Q, 0.16, 0.02), Z.bl || BLK());
      V.position.y = Q / 2;
      let X = new THREE.Group;
      X.rotation.x = K / U * TAU, X.add(V), Y.add(X);
    }
    return Y;
  }
function gear($, J, Q, Z) {
    J.forEach(([U, q, E]) => {
      $.add(M(mesh(cyl(0.035, 0.035, Math.abs(q) - Q * 0.5, 6), Z || BLK()), U, q / 2, E)), $.add(M(mesh(cyl(Q, Q, Q * 0.6, 14), std("#141416", 0.8)), U, q - Q * 0.1, E, Math.PI / 2));
    });
  }
function canopy($, J, Q, Z, U, q, E) {
    let Y = mesh(sph(1, 20, 14), E || std("#0e1a28", 0.04, 0.5, { envMapIntensity: 2.4, transparent: true, opacity: 0.85 }));
    return Y.scale.set(Z / 2, q, U / 2), Y.position.set(J, Q, 0), $.add(Y), Y;
  }
function jet($, J, Q, Z, U, q) {
    $.add(M(mesh(cyl(U, U * 1.1, U * 1.2, 16, true), std("#2a2d34", 0.4, 0.8)), J, Q, Z, 0, 0, Math.PI / 2));
    let E = glow(q || [3, 1.2, 0.3], U * 3.2, 0.85);
    return E.position.set(J - U * 0.6, Q, Z), $.add(E), E;
  }
EXT.plane = function($) {
    let J = new THREE.Group;
    J.name = "plane" + $;
    let Q = 10, Z = [], U = () => {
      J.userData.spin = (Y) => Z.forEach((K) => {
        K.rotation.x = Y * 28;
      });
    }, q = std("#f4f5f7", 0.35), E = std("#c4141d", 0.4, 0.15);
    if ($ === 1)
      Q = 10, J.add(fuselage(7.5, 0.55, q)), J.add(M(mesh(rbox(1.7, 0.5, 0.95, 0.15), std("#0e1a28", 0.04, 0.5)), 1, 0.45)), J.add(M(wing(Q, 1.5, 0.12, q), 0.4, 0.75)), [-1, 1].forEach((Y) => J.add(M(mesh(cyl(0.035, 0.035, 1.9, 6), BLK()), 0.6, 0.15, Y * 1.2, Y * 1, 0, 0))), J.add(M(fin(1.2, 1.2, 0.08, E), -2.9, 0.2)), J.add(M(wing(3.2, 0.9, 0.06, q, { taper: 0.7 }), -3.1, 0.15)), Z.push(prop(J, 3.85, 1, {})), gear(J, [[1.8, -0.6, 0], [0.2, -0.65, 0.8], [0.2, -0.65, -0.8]], 0.18), J.add(M(new THREE.Mesh(box(2.5, 0.08, 0.012), E), 0, -0.05, 0.552)), J.add(M(new THREE.Mesh(box(2.5, 0.08, 0.012), E), 0, -0.05, -0.552));
    else if ($ === 2) {
      Q = 12;
      let Y = std("#f2c21b", 0.35);
      J.add(fuselage(8, 0.6, Y)), J.add(M(wing(Q, 1.8, 0.14, Y), 0.5, -0.35)), J.add(M(mesh(cyl(0.72, 0.72, 0.6, 18), std("#3a3a40", 0.5, 0.6)), 3.5, 0, 0, 0, 0, Math.PI / 2));
      for (let K = 0;K < 7; K++) {
        let V = K / 7 * TAU;
        J.add(M(mesh(cyl(0.12, 0.12, 0.4, 8), std("#6b6e76", 0.4, 0.7)), 3.6, Math.sin(V) * 0.62, Math.cos(V) * 0.62, Math.PI / 2 + V, 0, 0));
      }
      canopy(J, 0.2, 0.55, 1.4, 0.7, 0.35), J.add(M(fin(1.3, 1.3, 0.08, Y), -3.1, 0.2)), J.add(M(wing(3.6, 1, 0.06, Y, { taper: 0.7 }), -3.3, 0.15)), Z.push(prop(J, 4, 1.2, {})), gear(J, [[1.2, -0.85, 0.9], [1.2, -0.85, -0.9], [-3.4, -0.35, 0]], 0.24), J.add(M(mesh(cyl(0.03, 0.03, Q * 0.8, 6), CHROME()), 0.2, -0.55, 0, Math.PI / 2));
    } else if ($ === 3) {
      Q = 9;
      let Y = std("#c4141d", 0.45);
      J.add(fuselage(7, 0.5, Y)), J.add(M(wing(Q, 1.4, 0.1, Y, { taper: 0.95 }), 0.6, -0.35)), J.add(M(wing(Q * 1.04, 1.4, 0.1, Y, { taper: 0.95 }), 0.9, 1.15)), [-1, 1].forEach((K) => [0.2, 1.3].forEach((V) => J.add(M(mesh(cyl(0.03, 0.03, 1.5, 6), std("#d9b45a", 0.6)), V, 0.4, K * 3.4)))), [-1, 1].forEach((K) => J.add(M(mesh(cyl(0.03, 0.03, 1.1, 6), BLK()), 1.1, 0.65, K * 0.35))), J.add(M(mesh(cyl(0.55, 0.55, 0.5, 18), std("#c9cdd4", 0.3, 0.8)), 3.15, 0, 0, 0, 0, Math.PI / 2)), J.add(M(mesh(cyl(0.28, 0.28, 0.12, 14, true), BLK()), -0.2, 0.5, 0)), J.add(M(fin(1.1, 1, 0.08, Y), -2.7, 0.2)), J.add(M(wing(3, 0.8, 0.06, Y, { taper: 0.8 }), -2.9, 0.15)), Z.push(prop(J, 3.45, 1.05, { bl: std("#6b4425", 0.6) })), gear(J, [[1.2, -0.85, 0.7], [1.2, -0.85, -0.7]], 0.25);
    } else if ($ === 4) {
      Q = 11;
      let Y = std("#1f5fd6", 0.4);
      J.add(fuselage(8, 0.55, q)), J.add(M(wing(Q, 1.6, 0.12, q), 0.4, 0.75)), J.add(M(fin(1.3, 1.3, 0.08, Y), -3.1, 0.2)), J.add(M(wing(3.4, 0.9, 0.06, q, { taper: 0.7 }), -3.3, 0.15)), Z.push(prop(J, 4.1, 1.05, {})), [-1, 1].forEach((K) => {
        let V = fuselage(6.4, 0.35, Y);
        V.position.set(0.2, -1.45, K * 1.25), J.add(V), [1.2, -0.8].forEach((X) => J.add(M(mesh(cyl(0.035, 0.035, 1.2, 6), BLK()), X, -0.85, K * 1.05, K * 0.3, 0, 0)));
      }), J.add(M(mesh(rbox(1.6, 0.5, 0.95, 0.15), std("#0e1a28", 0.04, 0.5)), 1.1, 0.45));
    } else if ($ === 5) {
      Q = 11;
      let Y = std("#ff7a1a", 0.4);
      J.add(fuselage(7.5, 0.6, Y)), J.add(M(wing(Q, 1.7, 0.12, q), 0.4, 0.8)), [-1, 1].forEach((K) => J.add(M(mesh(cyl(0.04, 0.04, 2.1, 6), BLK()), 0.5, 0.12, K * 1.3, K * 1.05, 0, 0))), J.add(M(mesh(rbox(1.8, 0.55, 1, 0.15), std("#0e1a28", 0.04, 0.5)), 1, 0.48)), J.add(M(fin(1.4, 1.3, 0.08, Y), -2.9, 0.2)), J.add(M(wing(3.6, 1, 0.06, Y, { taper: 0.7 }), -3.1, 0.15)), Z.push(prop(J, 3.85, 1.1, {})), gear(J, [[1.4, -1, 0.95], [1.4, -1, -0.95], [-3.1, -0.4, 0]], 0.45);
    } else if ($ === 6) {
      Q = 14;
      let Y = std("#9aa3ad", 0.35, 0.4), K = std("#1f5fd6", 0.4);
      J.add(fuselage(11, 0.7, Y)), J.add(M(wing(Q, 2, 0.15, Y), 0.6, -0.3)), [-1, 1].forEach((V) => {
        let X = fuselage(3, 0.42, Y);
        X.position.set(1.4, -0.15, V * 2.6), J.add(X), Z.push(prop(J, 3, 1.25, {}, 3, -0.15, V * 2.6));
      }), J.add(M(fin(2, 1.6, 0.1, K), -4.4, 0.4)), J.add(M(wing(4.6, 1, 0.07, Y, { taper: 0.7 }), -5.3, 2.35));
      for (let V = 0;V < 6; V++)
        [-1, 1].forEach((X) => J.add(M(new THREE.Mesh(rbox(0.3, 0.22, 0.02, 0.05), std("#0e1a28", 0.05, 0.5)), 2.2 - V * 0.65, 0.2, X * 0.69)));
      J.add(M(new THREE.Mesh(box(9, 0.1, 0.012), K), 0, -0.1, 0.7)), J.add(M(new THREE.Mesh(box(9, 0.1, 0.012), K), 0, -0.1, -0.7));
    } else if ($ === 7) {
      Q = 7.5;
      let Y = mk("plck", () => {
        let K = patTex("check");
        return SM({ map: K, roughness: 0.35 });
      });
      J.add(fuselage(6.5, 0.5, Y)), J.add(M(wing(Q, 1.4, 0.1, Y, { taper: 0.7 }), 0.5, -0.25)), canopy(J, 0.4, 0.5, 1.5, 0.75, 0.42), J.add(M(fin(1.1, 1, 0.07, E), -2.5, 0.2)), J.add(M(wing(2.8, 0.8, 0.05, E, { taper: 0.7 }), -2.6, 0.12)), Z.push(prop(J, 3.35, 0.95, { sp: E })), gear(J, [[1.2, -0.75, 0.7], [1.2, -0.75, -0.7], [-2.6, -0.3, 0]], 0.18);
    } else if ($ === 8 || $ === 12) {
      Q = 14;
      let Y = $ === 12 ? GOLD() : std("#f7f8fa", 0.2, 0.1), K = $ === 12 ? DIA() : GOLD();
      J.add(fuselage(15, 0.85, Y, { pts: [[0, 0], [0.3, 0.4], [0.7, 1.8], [0.85, 4], [0.85, 10], [0.8, 12.5], [0.55, 14.2], [0, 15]] })), J.add(M(wing(Q, 2.6, 0.16, Y, { sweep: 1.6, taper: 0.45 }), 0, -0.35)), [-1, 1].forEach((V) => {
        J.add(M(fin(0.9, 0.6, 0.06, Y, { sweep: 0.3 }), -1.4, -0.2, V * Q / 2, 0, 0, 0));
        let X = fuselage(2.4, 0.45, Y);
        X.position.set(-4.4, 0.55, V * 1.2), J.add(X), Z.push(jet(J, -5.65, 0.55, V * 1.2, 0.3, $ === 12 ? [3, 2, 0.6] : [2, 1.2, 0.6]));
      }), J.add(M(fin(2.4, 2.2, 0.12, Y, { sweep: 1.4 }), -5.3, 0.5)), J.add(M(wing(4.4, 1.1, 0.08, Y, { sweep: 0.8, taper: 0.6 }), -7.4, 2.85));
      for (let V = 0;V < 8; V++)
        [-1, 1].forEach((X) => J.add(M(new THREE.Mesh(rbox(0.24, 0.24, 0.02, 0.08), $ === 12 ? std("#bfe9ff", 0.03, 0.2, { emissive: "#6fd8ff", emissiveIntensity: 0.8 }) : std("#0e1a28", 0.05, 0.5)), 3.5 - V * 0.75, 0.25, X * 0.83)));
      if ([-1, 1].forEach((V) => J.add(M(new THREE.Mesh(box(11, 0.08, 0.012), K), 0, -0.05, V * 0.855))), canopy(J, 6.3, 0.25, 1.4, 1.3, 0.35), $ === 12)
        [-1, 1].forEach((V) => {
          let X = glow([3, 2.2, 0.6], 1.2, 0.7);
          X.position.set(-1.6, -0.2, V * Q / 2), J.add(X);
        });
    } else if ($ === 9) {
      Q = 9;
      let Y = std("#6b7280", 0.3, 0.5);
      J.add(fuselage(14, 0.75, Y, { pts: [[0, 0], [0.55, 0.3], [0.75, 2], [0.75, 8], [0.6, 11], [0.3, 13.2], [0, 14]] }));
      let K = new THREE.Shape;
      K.moveTo(2.2, 0), K.lineTo(-4.6, Q / 2), K.lineTo(-5.6, Q / 2), K.lineTo(-5.4, 0), K.lineTo(-5.6, -Q / 2), K.lineTo(-4.6, -Q / 2), K.closePath();
      let V = new THREE.ExtrudeGeometry(K, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.06, bevelSegments: 1 });
      V.rotateX(Math.PI / 2), V.translate(0, 0.07, 0), J.add(M(mesh(V, Y), 0, -0.1)), J.add(M(fin(2.6, 2.6, 0.12, E, { sweep: 2 }), -4.4, 0.4)), canopy(J, 3.4, 0.6, 2.6, 0.95, 0.45), [-1, 1].forEach((X) => J.add(M(new THREE.Mesh(box(6, 0.1, 0.012), E), 0, 0, X * 0.755))), Z.push(jet(J, -7.1, 0, 0, 0.55, [3, 1, 0.25]));
    } else if ($ === 10) {
      Q = 8;
      let Y = std("#d0102a", 0.25, 0.25);
      J.add(fuselage(11, 0.6, Y, { pts: [[0, 0], [0.45, 0.3], [0.6, 1.8], [0.6, 7.5], [0.5, 9.4], [0.25, 10.6], [0, 11]] })), J.add(M(wing(Q, 2, 0.12, Y, { sweep: 1.3, taper: 0.45 }), -0.5, -0.15)), [-1, 1].forEach((K) => J.add(M(fin(1.8, 1.6, 0.08, q, { sweep: 1.2 }), -3.6, 0.3, K * 0.6, K * 0.35, 0, 0))), J.add(M(wing(3.6, 1, 0.06, Y, { sweep: 0.6, taper: 0.6 }), -4.2, 0.05)), canopy(J, 2.2, 0.45, 2, 0.8, 0.38), [-1, 1].forEach((K) => J.add(M(new THREE.Mesh(box(8, 0.14, 0.012), q), 0, 0, K * 0.605))), Z.push(jet(J, -5.6, 0, 0, 0.42, [0.5, 1.6, 3]));
    } else if ($ === 11) {
      Q = 12;
      let Y = std("#f4f5f7", 0.4), K = std("#141418", 0.6);
      J.add(fuselage(16, 1.1, Y, { pts: [[0, 0], [1, 0.3], [1.1, 2], [1.1, 12], [0.95, 14], [0.5, 15.5], [0, 16]] }));
      let V = new THREE.Shape;
      V.moveTo(2, 0), V.lineTo(-3.8, Q / 2), V.lineTo(-6.2, Q / 2), V.lineTo(-6.6, 0), V.lineTo(-6.2, -Q / 2), V.lineTo(-3.8, -Q / 2), V.closePath();
      let X = new THREE.ExtrudeGeometry(V, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.08, bevelSegments: 1 });
      X.rotateX(Math.PI / 2), X.translate(0, 0.11, 0), J.add(M(mesh(X, K), 0, -0.55)), J.add(M(fin(3.2, 3.2, 0.16, Y, { sweep: 2.4 }), -5, 0.8)), J.add(M(mesh(rbox(10, 0.3, 1.9, 0.12), K), -1, -0.85));
      for (let W = 0;W < 4; W++)
        J.add(M(new THREE.Mesh(rbox(0.3, 0.2, 0.02, 0.06), K), 6.2 - W * 0.4, 0.55, 0.9, 0, 0.25, 0));
      [[0, 0.35], [0.6, -0.35], [-0.6, -0.35]].forEach(([W, H]) => Z.push(jet(J, -8.2, H, W, 0.42, [0.5, 1.4, 3])));
    } else
      return null;
    if (!J.userData.spin)
      if (Z.length && Z[0].isSprite)
        J.userData.spin = (Y) => Z.forEach((K, V) => {
          K.material.opacity = 0.7 + 0.25 * Math.sin(Y * 20 + V);
        });
      else
        U();
    return J.traverse((Y) => {
      if (Y.isMesh)
        Y.castShadow = true;
    }), J.userData.span = Q, J;
  };
