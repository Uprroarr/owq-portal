import * as THREE from 'three';
import {rbox} from './geo.js';
import {clamp} from './util.js';
import {holoCv} from './arcade.js';

class Crates {
    constructor($) {
      this.O = $, this.L = [], this.mBody = new THREE.MeshStandardMaterial({ color: 1512218, roughness: 0.32, metalness: 0.75 }), this.mTrim = new THREE.MeshStandardMaterial({ color: 14921807, roughness: 0.25, metalness: 1 });
      let J = document.createElement("canvas");
      J.width = J.height = 64;
      let Q = J.getContext("2d"), Z = Q.createRadialGradient(32, 32, 2, 32, 32, 32);
      Z.addColorStop(0, "rgba(255,255,255,1)"), Z.addColorStop(0.35, "rgba(255,255,255,.55)"), Z.addColorStop(1, "rgba(255,255,255,0)"), Q.fillStyle = Z, Q.fillRect(0, 0, 64, 64), this.glowT = new THREE.CanvasTexture(J);
    }
    show($, J) {
      if (!$ || !J)
        return;
      let Q = this.O, Z = new THREE.Color(/^#[0-9a-f]{6}$/i.test(J.c || "") ? J.c : "#ff1f4f"), U = "#" + Z.getHexString();
      this.L = this.L.filter((_) => {
        if (_.a === $)
          return Q.room.group.remove(_.g), false;
        return true;
      });
      let q = new THREE.Group;
      q.name = "crate";
      let E = 0.46, Y = new THREE.Mesh(rbox(E, E * 0.72, E, 0.03), this.mBody);
      Y.position.y = -E * 0.14, q.add(Y);
      let K = new THREE.Group, V = new THREE.Mesh(rbox(E * 1.06, E * 0.16, E * 1.06, 0.03), this.mBody);
      K.add(V), K.position.y = E * 0.3, q.add(K);
      let X = new THREE.MeshBasicMaterial({ color: Z.clone().multiplyScalar(2.4), toneMapped: false });
      [[0, E * 0.08, E * 0.505, E * 0.98, E * 0.05, 0.01], [0, E * 0.08, -E * 0.505, E * 0.98, E * 0.05, 0.01], [E * 0.505, E * 0.08, 0, 0.01, E * 0.05, E * 0.98], [-E * 0.505, E * 0.08, 0, 0.01, E * 0.05, E * 0.98]].forEach((_) => {
        let D = new THREE.Mesh(new THREE.BoxGeometry(_[3], _[4], _[5]), X);
        D.position.set(_[0], _[1], _[2]), q.add(D);
      }), [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([_, D]) => {
        let O = new THREE.Mesh(new THREE.BoxGeometry(0.035, E * 0.74, 0.035), this.mTrim);
        O.position.set(_ * E * 0.5, -E * 0.14, D * E * 0.5), q.add(O);
      });
      let W = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.03), this.mTrim);
      W.position.set(0, E * 0.1, E * 0.52), q.add(W);
      let H = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowT, color: Z.clone().multiplyScalar(1.6), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      H.scale.set(1.6, 1.6, 1), q.add(H);
      let N = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 3.2, 20, 1, true), new THREE.MeshBasicMaterial({ color: Z.clone().multiplyScalar(2), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }));
      N.position.y = 1.6, N.visible = false, q.add(N);
      let F = new THREE.Sprite(new THREE.SpriteMaterial({ map: holoCv(J.r || "Mystery prize", J.lb || "Loot crate", U), transparent: true, depthWrite: false, toneMapped: false }));
      F.scale.set(2.2, 0.55, 1), F.position.y = 0.95, F.visible = false, q.add(F), Q.room.group.add(q), Q.warm && Q.warm(q);
      let G = { a: $, g: q, lid: K, halo: H, beam: N, sp: F, t: 0, d: clamp(+J.d || 3, 1, 12), col: Z, big: !!J.big };
      return this.L.push(G), Q.sfx("whoosh"), G;
    }
    tick($, J) {
      let Q = this.O, Z = this._h || (this._h = new THREE.Vector3);
      for (let U = this.L.length - 1;U >= 0; U--) {
        let q = this.L[U];
        q.t += $;
        let E = q.a;
        if (!E || E.leaving || !Q.av.has(E.id)) {
          Q.room.group.remove(q.g), this.L.splice(U, 1);
          continue;
        }
        E.headPos(Z);
        let Y = clamp(q.t / q.d, 0, 1), K = q.t < q.d, V = K ? Math.pow(Y, 2.2) * 0.07 : 0;
        q.g.position.set(Z.x + (Math.random() - 0.5) * V, Z.y + 0.78 + Math.sin(q.t * 3) * 0.04 + Math.min(1, q.t * 3) * 0.05, Z.z + (Math.random() - 0.5) * V), q.g.rotation.y += $ * (1.2 + Y * 7);
        let X = 1.6 * (0.6 + Y * 0.9) * (1 + 0.12 * Math.sin(J * 12));
        if (q.halo.scale.set(X, X, 1), q.halo.material.opacity = K ? 0.35 + 0.55 * Y : Math.max(0, 1 - (q.t - q.d) / 3), K) {
          if ((q.t * 8 | 0) !== q.n) {
            if (q.n = q.t * 8 | 0, Y > 0.5)
              Q.fx.sparkle(Z.x, Z.y + 0.8, Z.z, 2 + (Y * 6 | 0), [q.col.r, q.col.g, q.col.b]);
          }
          continue;
        }
        if (!q.open)
          q.open = 1, q.beam.visible = true, q.sp.visible = true, Q.fx.confetti(Z.x, Z.y + 1.1, Z.z, q.big ? 260 : 140, 1.4), Q.fx.sparkle(Z.x, Z.y + 0.9, Z.z, 60, [q.col.r, q.col.g, q.col.b]), Q.sfx("pop"), Q.sfx(q.big ? "crowd" : "chaching"), Q.shk = Math.max(Q.shk || 0, q.big ? 0.35 : 0.15);
        let W = q.t - q.d;
        q.lid.position.y = 0.138 + W * 2.2, q.lid.rotation.x = -W * 5, q.lid.rotation.z = W * 2, q.lid.scale.setScalar(Math.max(0.01, 1 - W * 0.6)), q.beam.material.opacity = Math.max(0, 0.75 - W * 0.17), q.beam.scale.set(1 + W * 0.3, 1, 1 + W * 0.3), q.sp.position.y = 0.95 + Math.min(0.5, W * 0.6);
        let H = Math.min(1, W * 4);
        if (q.sp.scale.set(2.2 * H, 0.55 * H, 1), q.sp.material.opacity = Math.min(1, Math.max(0, (5.4 - W) / 1)), q.g.rotation.y -= $ * 8.2 * 0.8, W > 5.4)
          Q.room.group.remove(q.g), this.L.splice(U, 1);
      }
    }
  }

export {Crates};
