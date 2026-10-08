import * as THREE from 'three';
import {BOARD} from './layout.js';

function titleCv($) {
    let J = document.createElement("canvas");
    J.width = 1024, J.height = 128;
    let Q = J.getContext("2d");
    Q.font = "900 76px Verdana,sans-serif", Q.textAlign = "center", Q.textBaseline = "middle", Q.shadowColor = "#ff2d78", Q.shadowBlur = 28, Q.fillStyle = "#fff0f6", Q.fillText($, 512, 66), Q.shadowBlur = 0, Q.fillText($, 512, 66);
    let Z = new THREE.CanvasTexture(J);
    return Z.colorSpace = THREE.SRGBColorSpace, Z;
  }
function hintCv() {
    let $ = document.createElement("canvas");
    $.width = 1024, $.height = 372;
    let J = $.getContext("2d");
    J.fillStyle = "#0a060d", J.fillRect(0, 0, 1024, 372), J.fillStyle = "rgba(255,255,255,.07)";
    for (let Q = 16;Q < 1024; Q += 16)
      for (let Z = 16;Z < 372; Z += 16)
        J.fillRect(Q - 1, Z - 1, 2, 2);
    return J.font = "800 34px Verdana,sans-serif", J.textAlign = "center", J.fillStyle = "#fff", J.fillText("BRAINSTORM BOARD", 512, 170), J.font = "600 20px Verdana,sans-serif", J.fillStyle = "#ffb3c2", J.fillText("Click to open it: draw, type, pin photos and charts", 512, 214), $;
  }
function buildBoard($) {
    let J = new THREE.Group;
    J.name = "board", $.add(J);
    let { x: Q, y: Z, z: U, w: q, h: E } = BOARD, Y = new THREE.MeshStandardMaterial({ color: 592140, roughness: 0.28, metalness: 0.65 }), K = new THREE.Mesh(new THREE.BoxGeometry(0.07, E + 0.2, q + 0.2), Y);
    K.position.set(Q + 0.045, Z, U), K.receiveShadow = true, J.add(K);
    let V = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 0.25, 0.6), toneMapped: false });
    [[Z + E / 2 + 0.095, q + 0.2], [Z - E / 2 - 0.095, q + 0.2]].forEach(([g, R]) => {
      let C = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.022, R), V);
      C.position.set(Q - 0.005, g, U), J.add(C);
    }), [[U - q / 2 - 0.095], [U + q / 2 + 0.095]].forEach(([g]) => {
      let R = new THREE.Mesh(new THREE.BoxGeometry(0.02, E + 0.21, 0.022), V);
      R.position.set(Q - 0.005, Z, g), J.add(R);
    });
    let X = document.createElement("canvas");
    X.width = X.height = 128;
    let W = X.getContext("2d"), H = W.createRadialGradient(64, 64, 8, 64, 64, 64);
    H.addColorStop(0, "rgba(255,31,79,.55)"), H.addColorStop(1, "rgba(255,31,79,0)"), W.fillStyle = H, W.fillRect(0, 0, 128, 128);
    let N = new THREE.Mesh(new THREE.PlaneGeometry(q * 1.25, E * 1.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(X), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5, toneMapped: false }));
    N.position.set(Q + 0.056, Z, U), N.rotation.y = -Math.PI / 2, J.add(N);
    let F = new THREE.CanvasTexture(hintCv());
    F.colorSpace = THREE.SRGBColorSpace, F.anisotropy = 8, F.minFilter = THREE.LinearMipmapLinearFilter;
    let G = new THREE.MeshBasicMaterial({ map: F, color: new THREE.Color(0.94, 0.94, 0.94), toneMapped: false }), _ = new THREE.Mesh(new THREE.PlaneGeometry(q, E), G);
    _.position.set(Q, Z, U), _.rotation.y = -Math.PI / 2, J.add(_);
    let D = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.42), new THREE.MeshBasicMaterial({ map: titleCv("BRAINSTORM BOARD"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(2, 2, 2), toneMapped: false }));
    D.position.set(Q - 0.01, Z + E / 2 + 0.36, U), D.rotation.y = -Math.PI / 2, J.add(D);
    let O = document.createElement("canvas");
    O.width = O.height = 64;
    let I = O.getContext("2d"), B = I.createRadialGradient(32, 32, 2, 32, 32, 32);
    B.addColorStop(0, "rgba(255,255,255,1)"), B.addColorStop(0.3, "rgba(255,255,255,.8)"), B.addColorStop(1, "rgba(255,255,255,0)"), I.fillStyle = B, I.fillRect(0, 0, 64, 64);
    let k = new THREE.CanvasTexture(O), z = [];
    for (let g = 0;g < 8; g++) {
      let R = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshBasicMaterial({ map: k, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      R.rotation.y = -Math.PI / 2, R.visible = false, J.add(R), z.push(R);
    }
    let M = null, v = -1;
    return { group: J, screen: _, at(g, R, C, p, i) {
      return i.set(Q - 0.012, Z + E / 2 - R / p * E, U - q / 2 + g / C * q), i;
    }, corners() {
      return [[U - q / 2, Z + E / 2], [U + q / 2, Z + E / 2], [U + q / 2, Z - E / 2], [U - q / 2, Z - E / 2]].map(([g, R]) => new THREE.Vector3(Q, R, g));
    }, set(g, R) {
      if (!g || R === v && g === M)
        return;
      if (g !== M) {
        M = g;
        let C = new THREE.CanvasTexture(g);
        C.colorSpace = THREE.SRGBColorSpace, C.anisotropy = 8, C.minFilter = THREE.LinearMipmapLinearFilter;
        let p = G.map;
        if (G.map = C, G.needsUpdate = true, p && p !== C)
          p.dispose();
      } else
        G.map.needsUpdate = true;
      v = R;
    }, cursors(g, R, C, p) {
      let i = new THREE.Vector3;
      for (let e = 0;e < z.length; e++) {
        let V0 = g && g[e], l = z[e];
        if (!V0) {
          l.visible = false;
          continue;
        }
        this.at(V0.x, V0.y, R, C, i), l.position.copy(i), l.material.color.set(V0.c || "#ff1f4f").multiplyScalar(2.2), l.scale.setScalar(1 + 0.18 * Math.sin(p * 6 + e)), l.visible = true;
      }
    } };
  }

export {buildBoard};
