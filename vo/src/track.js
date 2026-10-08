import * as THREE from 'three';
import {cv, tex} from './tex.js';

const TY=-40;
const TRK={SL:20,RAD:14,HW:4.5,BAR:5.6,TUN:{x:3,z0:14,z1:27}};
var DOOR = { x: -10, z0: 2.5, z1: 4.7 };
function tdist($, J) {
    let { SL: Q, RAD: Z } = TRK;
    if (Math.abs($) <= Q)
      return Math.abs(Math.abs(J) - Z);
    let U = Math.sign($) * Q;
    return Math.abs(Math.hypot($ - U, J) - Z);
  }
function trackHit($, J, Q) {
    let { BAR: Z, TUN: U } = TRK;
    if (Math.abs($) < U.x - Q && J > U.z0 && J < U.z1 + 1)
      return false;
    return tdist($, J) > Z - Q - 0.15;
  }
function loop($ = 0.5) {
    let { SL: J, RAD: Q } = TRK, Z = [];
    for (let U = -J;U < J; U += $)
      Z.push([U, -Q, 0, -1]);
    for (let U = -Math.PI / 2;U < Math.PI / 2; U += $ / Q)
      Z.push([J + Q * Math.cos(U), Q * Math.sin(U), Math.cos(U), Math.sin(U)]);
    for (let U = J;U > -J; U -= $)
      Z.push([U, Q, 0, 1]);
    for (let U = Math.PI / 2;U < Math.PI * 1.5; U += $ / Q)
      Z.push([-J + Q * Math.cos(U), Q * Math.sin(U), Math.cos(U), Math.sin(U)]);
    return Z.push(Z[0]), Z;
  }
// a flat ribbon between two offsets from the centre line (u runs along the length)
function ribbon(P,o0,o1,y,us){const pos=[],uv=[],idx=[];let L=0;
  P.forEach((p,i)=>{if(i)L+=Math.hypot(p[0]-P[i-1][0],p[1]-P[i-1][1]);
    pos.push(p[0]+p[2]*o0,y,p[1]+p[3]*o0,p[0]+p[2]*o1,y,p[1]+p[3]*o1);uv.push(L/us,0,L/us,1);
    if(i){const k=i*2;idx.push(k-2,k,k-1,k-1,k,k+1)}});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);return g}
// an upright wall following the centre line at one offset, skipping where cut() says so
function wall(P,o,y0,h,us,cut){const pos=[],uv=[],idx=[];let L=0,n=0,prev=null;
  P.forEach((p,i)=>{const x=p[0]+p[2]*o,z=p[1]+p[3]*o;if(prev)L+=Math.hypot(x-prev[0],z-prev[1]);prev=[x,z];const c=cut&&cut(x,z);
    pos.push(x,y0,z,x,y0+h,z);uv.push(L/us,0,L/us,1);if(i&&!c&&!P[i-1].c){const k=n*2;idx.push(k-2,k,k-1,k-1,k,k+1)}p.c=c;n++});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);return g}
const B=(o)=>new THREE.MeshBasicMaterial(Object.assign({side:THREE.DoubleSide},o));
function noiseCv(w,h,base,amp,f){const c=cv(w,h),x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,w,h);const d=x.getImageData(0,0,w,h),a=d.data;
  for(let i=0;i<a.length;i+=4){const n=(Math.random()-.5)*amp;a[i]+=n;a[i+1]+=n;a[i+2]+=n}x.putImageData(d,0,0);f&&f(x,w,h);return c}
function rep(c,u,v){const t=tex(c,{mips:true});t.wrapS=t.wrapT=THREE.RepeatWrapping;if(u)t.repeat.set(u,v||u);return t}
function sign(txt,w,h,col,glow,font){const c=cv(1024,Math.round(1024*h/w)),x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.font=font||`900 ${Math.round(c.height*.62)}px Verdana,sans-serif`;
  x.textAlign='center';x.textBaseline='middle';x.shadowColor=glow;x.shadowBlur=c.height*.18;x.fillStyle=col;x.fillText(txt,c.width/2,c.height/2);x.shadowBlur=0;x.fillText(txt,c.width/2,c.height/2);return c}
function buildTrack($) {
    let J = new THREE.Group;
    J.name = "speedway", J.position.y = TY, $.add(J);
    let { SL: Q, RAD: Z, HW: U, BAR: q, TUN: E } = TRK, Y = loop(), K = (G0, $0, j = 0, u = 0, Q0 = 0, K0 = 0, N0 = 0) => {
      let x = new THREE.Mesh(G0, $0);
      return x.position.set(j, u, Q0), x.rotation.set(K0, N0, 0), x.matrixAutoUpdate = false, x.updateMatrix(), J.add(x), x;
    };
    K(new THREE.PlaneGeometry(100, 72), B({ map: rep(noiseCv(256, 256, "#26262c", 22), 12, 9), color: new THREE.Color(0.9, 0.9, 0.95) }), 0, 0, 4, -Math.PI / 2);
    let V = noiseCv(512, 128, "#120a10", 10, (G0, $0, j) => {
      let u = G0.createLinearGradient(0, 0, 0, j);
      u.addColorStop(0, "rgba(255,31,79,.0)"), u.addColorStop(1, "rgba(255,31,79,.16)"), G0.fillStyle = u, G0.fillRect(0, 0, $0, j), G0.fillStyle = "#ff1f4f", G0.fillRect(0, j * 0.8, $0, 3);
    }), X = B({ map: rep(V, 6, 1) });
    [[0, 5, -32, 0, 100], [0, 5, 40, Math.PI, 100], [-50, 5, 4, Math.PI / 2, 72], [50, 5, 4, -Math.PI / 2, 72]].forEach(([G0, $0, j, u, Q0]) => K(new THREE.PlaneGeometry(Q0, 10), X, G0, $0, j, 0, u)), K(new THREE.PlaneGeometry(100, 72), B({ color: 460298 }), 0, 10, 4, Math.PI / 2);
    let W = B({ color: new THREE.Color(3.2, 3.1, 3) });
    for (let G0 = -40;G0 <= 40; G0 += 10)
      K(new THREE.BoxGeometry(0.25, 0.08, 60), W, G0, 9.9, 4);
    let H = noiseCv(256, 256, "#1d1e23", 26, (G0, $0, j) => {
      G0.fillStyle = "rgba(255,255,255,.55)", G0.fillRect(0, 0, 6, j), G0.fillRect($0 - 6, 0, 6, j), G0.fillStyle = "rgba(255,255,255,.35)", G0.fillRect($0 * 0.3, j / 2 - 3, $0 * 0.4, 6);
    });
    K(ribbon(Y, -U, U, 0.01, 9), B({ map: rep(noiseCv(256, 64, "#1d1e23", 26, (G0, $0, j) => {
      G0.fillStyle = "rgba(255,255,255,.5)", G0.fillRect(0, 0, $0, 3), G0.fillRect(0, j - 3, $0, 3), G0.fillStyle = "rgba(255,210,90,.55)";
      for (let u = 0;u < 2; u++)
        G0.fillRect(u * $0 / 2, j / 2 - 2, $0 * 0.28, 4);
    })) }));
    let N = cv(64, 8), F = N.getContext("2d");
    F.fillStyle = "#e8e8ec", F.fillRect(0, 0, 64, 8), F.fillStyle = "#ff1f4f", F.fillRect(0, 0, 32, 8);
    let G = B({ map: rep(N), color: new THREE.Color(1.15, 1.15, 1.15) });
    K(ribbon(Y, U, U + 0.8, 0.02, 1.6), G), K(ribbon(Y, -U - 0.8, -U, 0.02, 1.6), G);
    let _ = cv(512, 64), D = _.getContext("2d");
    D.fillStyle = "#0c0b0f", D.fillRect(0, 0, 512, 64), D.fillStyle = "#ff1f4f", D.fillRect(0, 0, 512, 5), D.fillRect(0, 59, 512, 5), D.font = "900 34px Verdana,sans-serif", D.textBaseline = "middle", D.fillStyle = "#fff", D.fillText("ONLY WINNERS", 20, 33), D.fillStyle = "#ff6f8d", D.fillText("OWQ SPEEDWAY", 282, 33);
    let O = B({ map: rep(_), color: new THREE.Color(1.3, 1.3, 1.3) }), I = (G0, $0) => $0 > 0 && Math.abs(G0) < E.x && Math.abs($0 - Z) < U + 2;
    K(wall(loop(), q, 0, 1.1, 7, I), O), K(wall(loop(), -q, 0, 1.1, -7), O);
    let B__L = cv(1024, 512), k = B__L.getContext("2d");
    k.fillStyle = "#101014", k.fillRect(0, 0, 1024, 512), k.strokeStyle = "rgba(255,31,79,.35)", k.lineWidth = 3;
    for (let G0 = 0;G0 < 1024; G0 += 32)
      k.beginPath(), k.moveTo(G0, 0), k.lineTo(G0 - 256, 512), k.stroke();
    k.font = "italic 900 120px Verdana,sans-serif", k.textAlign = "center", k.textBaseline = "middle", k.shadowColor = "#ff1f4f", k.shadowBlur = 40, k.fillStyle = "#fff", k.fillText("ONLY WINNERS", 512, 256), K(new THREE.PlaneGeometry(2 * Q + 2 * (Z - q) - 1, 2 * (Z - q) - 1), B({ map: tex(B__L, { mips: true }), color: new THREE.Color(1.1, 1.1, 1.1) }), 0, 0.005, 0, -Math.PI / 2);
    let z = cv(64, 256), M = z.getContext("2d");
    for (let G0 = 0;G0 < 4; G0++)
      for (let $0 = 0;$0 < 16; $0++)
        M.fillStyle = (G0 + $0) % 2 ? "#111" : "#f2f2f2", M.fillRect(G0 * 16, $0 * 16, 16, 16);
    K(new THREE.PlaneGeometry(1.2, 2 * U), B({ map: tex(z, { mips: true }) }), 0, 0.03, -Z, -Math.PI / 2);
    let v = B({ color: 1578524 });
    K(new THREE.BoxGeometry(0.4, 6, 0.4), v, 0, 3, -Z - q - 0.6), K(new THREE.BoxGeometry(0.4, 6, 0.4), v, 0, 3, -Z + q + 0.6), K(new THREE.BoxGeometry(0.6, 0.9, 2 * q + 1.6), v, 0, 6.2, -Z);
    let g = sign("START  ·  FINISH", 8, 1, "#ffffff", "#ff1f4f"), R = B({ map: tex(g, { mips: true }), transparent: true, depthWrite: false, color: new THREE.Color(2, 2, 2) });
    K(new THREE.PlaneGeometry(9, 1.1), R, 0.31, 6.2, -Z, 0, Math.PI / 2), K(new THREE.PlaneGeometry(9, 1.1), R, -0.31, 6.2, -Z, 0, -Math.PI / 2), K(new THREE.PlaneGeometry(26, 4.2), B({ map: tex(sign("OWQ SPEEDWAY", 26, 4.2, "#fff0f6", "#ff2d78"), { mips: true }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(2.4, 2.4, 2.4) }), 0, 6.6, -31.8);
    let C = B({ map: rep(noiseCv(256, 64, "#0d0c10", 12, (G0, $0, j) => {
      G0.fillStyle = "#ff1f4f";
      for (let u = 0;u < $0; u += 64)
        G0.fillRect(u, j * 0.45, 30, 6);
    }), 3, 1) }), p = E.z1 - (Z + q) + 1.5, i = (E.z1 + Z + q) / 2 + 0.6;
    K(new THREE.PlaneGeometry(2 * E.x, p), B({ map: rep(H, 1, 3) }), 0, 0.012, i, -Math.PI / 2), K(new THREE.PlaneGeometry(p, 3.2), C, -E.x, 1.6, i, 0, Math.PI / 2), K(new THREE.PlaneGeometry(p, 3.2), C, E.x, 1.6, i, 0, -Math.PI / 2), K(new THREE.BoxGeometry(2 * E.x + 0.4, 0.3, p), B({ color: 657676 }), 0, 3.3, i);
    let e = cv(256, 256), V0 = e.getContext("2d"), l = V0.createRadialGradient(128, 128, 10, 128, 128, 128);
    l.addColorStop(0, "rgba(255,240,246,1)"), l.addColorStop(0.5, "rgba(255,31,79,.8)"), l.addColorStop(1, "rgba(255,31,79,0)"), V0.fillStyle = l, V0.fillRect(0, 0, 256, 256), K(new THREE.PlaneGeometry(2 * E.x, 3.2), B({ map: tex(e, { mips: false }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(2, 2, 2) }), 0, 1.6, E.z1 + 0.9), K(new THREE.PlaneGeometry(5.6, 0.9), B({ map: tex(sign("▲ BACK TO THE OFFICE", 5.6, 0.9, "#ffffff", "#ff1f4f"), { mips: true }), transparent: true, depthWrite: false, color: new THREE.Color(2, 2, 2) }), 0, 2.75, E.z1 + 0.7, 0, Math.PI), K(new THREE.PlaneGeometry(5.6, 0.9), B({ map: tex(sign("PIT  ·  OWQ SPEEDWAY", 5.6, 0.9, "#ffffff", "#ff1f4f"), { mips: true }), transparent: true, depthWrite: false, color: new THREE.Color(2, 2, 2) }), 0, 3.9, Z + q + 0.2, 0, Math.PI);
    let A0 = cv(1024, 640), J0 = tex(A0, { mips: false });
    K(new THREE.PlaneGeometry(12, 7.5), B({ map: J0 }), -30, 5.2, -31.7);
    let T0 = A0.getContext("2d"), L0 = (G0, $0) => {
      let j = T0;
      j.fillStyle = "#08060a", j.fillRect(0, 0, 1024, 640), j.fillStyle = "#ff1f4f", j.fillRect(0, 0, 1024, 10), j.font = "900 54px Verdana,sans-serif", j.textAlign = "left", j.textBaseline = "alphabetic", j.fillStyle = "#fff", j.fillText("FASTEST LAPS", 44, 90), j.font = "700 26px Verdana,sans-serif", j.fillStyle = "#ffb3c2", j.fillText($0 || "Cross the line twice to set a time", 46, 132), (G0.length ? G0 : [["No laps yet", "", 0]]).slice(0, 7).forEach((u, Q0) => {
        let K0 = 200 + Q0 * 62;
        j.fillStyle = Q0 === 0 && u[2] ? "rgba(255,209,102,.16)" : "rgba(255,255,255,.05)", j.fillRect(40, K0 - 44, 944, 54), j.font = "800 34px Verdana,sans-serif", j.fillStyle = Q0 === 0 && u[2] ? "#ffd166" : "#fff", j.fillText((u[2] ? Q0 + 1 + "  " : "") + String(u[0]).toUpperCase().slice(0, 22), 60, K0 - 6), j.textAlign = "right", j.fillText(u[2] ? u[2].toFixed(2) + "s" : "", 964, K0 - 6), j.textAlign = "left";
      }), J0.needsUpdate = true;
    };
    return L0([]), { group: J, board: L0 };
  }
function buildDoor($) {
    let J = new THREE.Group;
    J.name = "trackdoor", $.add(J);
    let { x: Q, z0: Z, z1: U } = DOOR, q = U - Z, E = (Z + U) / 2, Y = (D, O, I, B__L, k, z = 0) => {
      let M = new THREE.Mesh(D, O);
      return M.position.set(I, B__L, k), M.rotation.y = z, J.add(M), M;
    }, K = cv(256, 256), V = K.getContext("2d"), X = V.createLinearGradient(0, 0, 0, 256);
    X.addColorStop(0, "#050306"), X.addColorStop(1, "#1a0710"), V.fillStyle = X, V.fillRect(0, 0, 256, 256), V.strokeStyle = "rgba(255,31,79,.55)", V.lineWidth = 4;
    for (let D = 1;D < 6; D++)
      V.beginPath(), V.moveTo(128 - D * 12, 256), V.lineTo(128 - D * 4, 60), V.stroke(), V.beginPath(), V.moveTo(128 + D * 12, 256), V.lineTo(128 + D * 4, 60), V.stroke();
    V.fillStyle = "rgba(255,31,79,.9)", V.beginPath(), V.moveTo(128, 120), V.lineTo(98, 160), V.lineTo(158, 160), V.closePath(), V.fill(), Y(new THREE.PlaneGeometry(q, 2.5), new THREE.MeshBasicMaterial({ map: tex(K, { mips: false }) }), Q + 0.015, 1.25, E, Math.PI / 2);
    let W = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 0.35, 0.8), toneMapped: false });
    Y(new THREE.BoxGeometry(0.06, 2.6, 0.07), W, Q + 0.03, 1.3, Z), Y(new THREE.BoxGeometry(0.06, 2.6, 0.07), W, Q + 0.03, 1.3, U), Y(new THREE.BoxGeometry(0.06, 0.07, q + 0.07), W, Q + 0.03, 2.6, E);
    let H = cv(1024, 256), N = H.getContext("2d");
    N.font = "900 120px Verdana,sans-serif", N.textAlign = "center", N.textBaseline = "middle", N.shadowColor = "#ff2d78", N.shadowBlur = 40, N.fillStyle = "#fff0f6", N.fillText("RACE TRACK", 512, 128), Y(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: tex(H, { mips: true }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(2.2, 2.2, 2.2), toneMapped: false }), Q + 0.03, 3.1, E, Math.PI / 2);
    let F = cv(128, 128), G = F.getContext("2d");
    G.strokeStyle = "#ff1f4f", G.lineWidth = 14, G.lineCap = "round", [20, 60].forEach((D) => {
      G.beginPath(), G.moveTo(30 + D * 0.3, 100 - D * 0), G.lineTo(64, 40 + D * 0.4), G.lineTo(98 - D * 0.3, 100), G.stroke();
    });
    let _ = new THREE.MeshBasicMaterial({ map: tex(F, { mips: true }), transparent: true, depthWrite: false, opacity: 0.55 });
    return [1, 2.1].forEach((D) => {
      Y(new THREE.PlaneGeometry(0.8, 0.8), _, Q + D, 0.006, E).rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    }), J;
  }

export {DOOR, TRK, TY, buildDoor, buildTrack, trackHit};
