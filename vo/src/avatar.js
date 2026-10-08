import * as THREE from 'three';
import {cyl, lathe, limb, rbox, sph, tube} from './geo.js';
import {clamp, damp, hash, lerp, rng, sstep} from './util.js';
import {COS, EXT, aura as bpAura, extra as bpExtra, hat as bpHat, headset as bpHeadset} from './cosm.js';

const SKIN=['#f7d8c6','#efc1a0','#d9a175','#b97c50','#8e5a38','#5e3a25'];
const HAIRC=['#15100e','#3b2517','#6c4424','#a8703f','#e2be7b','#d2d2d8','#b8382d','#283050'];
const HAIRS=['Short','Fade','Long','Bun','Curly','Ponytail','Buzz','Bald','Slick','Afro'];
const OUTS_ALL=COS.o;
const OUTC=['#ff1f4f','#17171d','#f2f2f2','#2a64ff','#12b58a','#f2b33d','#7c3cff','#ff7a1a','#0d5068','#c9a35c'];
var OUTC_BP = [["#e3b04f", 0.24, 1, 0], ["#e6e8ee", 0.12, 1, 0], ["#09090b", 0.16, 0.35, 0], ["#ff2bd6", 0.5, 0, "#5a0a4c"], ["#14e6ff", 0.5, 0, "#06485a"], ["#7a0019", 0.96, 0, 0], ["#1a2a6c", 0.7, 0, 0], ["#8fd629", 0.7, 0, 0], ["#ff3d9a", 0.65, 0, 0], ["#9fd8ff", 0.5, 0, 0], ["#b0723a", 0.3, 1, 0], ["#e8a598", 0.24, 1, 0], ["#f3efe6", 0.18, 0.35, 0], ["#7dff3a", 0.45, 0, "#2a8a00"], ["#0d0a14", 0.06, 0.6, "#1a0630"], ["#ff5a1a", 0.5, 0, "#a02000"], ["#ff6ad5", 0.3, 0.4, "#331133"]];
const OUTC_ALL=OUTC.concat(OUTC_BP.map(x=>x[0]));
const ACC=['None','Shades','Gold chain','Cap','Glasses','Miami mode'];
const PANTS=['#1d2130','#26262e','#c9b48f','#ececec'];
var LIM = { s: 12, h: 10, c: 8, o: 30, k: 27, a: 6, p: 4, m: 2, H: 31, B: 19, G: 10, D: 15, C: 14, I: 22, R: 11, T: 26, N: 11, E: 12, V: 14, W: 21, X: 36, Y: 12, Z: 12, Q: 6, F: 13, J: 13 };
var BPKEYS = "HBGDCIRTNEVWXYZQFJ";
function parseLook($, J) {
    let Q = hash(J || "x"), Z = { s: Q % 6, h: (Q >>> 3) % 10, c: (Q >>> 7) % 8, o: (Q >>> 11) % 5, k: (Q >>> 14) % 10, a: [0, 0, 0, 1, 2, 0, 4, 0, 5, 0][(Q >>> 18) % 10], p: (Q >>> 22) % 4, m: 0 };
    for (let U of BPKEYS)
      Z[U] = 0;
    if (Z.h === 7 && (Q >>> 25) % 3)
      Z.h = 1;
    if (typeof $ === "string") {
      let U = /([shcokapmHBGDCIRTNEVWXYZQFJ])(\d{1,2})/g, q;
      while (q = U.exec($)) {
        let E = +q[2];
        if (E < LIM[q[1]])
          Z[q[1]] = E;
      }
    }
    return Z;
  }
var lookCode = ($) => `s${$.s}h${$.h}c${$.c}o${$.o}k${$.k}a${$.a}p${$.p}` + ($.m ? "m1" : "") + [...BPKEYS].map((J) => $[J] ? J + $[J] : "").join("");
const MC=new Map();
function std(col,r=.6,mt=0,ex){const k=col+'|'+r+'|'+mt+'|'+(ex?JSON.stringify(ex):'');let m=MC.get(k);if(!m){m=new THREE.MeshStandardMaterial(Object.assign({color:col,roughness:r,metalness:mt},ex||{}));MC.set(k,m)}return m}
function basic(col,o){const k='b'+col+(o?JSON.stringify(o):'');let m=MC.get(k);if(!m){m=new THREE.MeshBasicMaterial(Object.assign({color:col},o||{}));MC.set(k,m)}return m}
const GC=new Map();
function G(k,mk){let g=GC.get(k);if(!g){g=mk();GC.set(k,g)}return g}
var HAPPYE = new Set(["floss", "griddy", "disco", "hypejump", "belt", "airguitar", "dab", "chestpound", "moneygun", "sprinkler", "spin", "victory", "heart", "flex", "sway", "moonwalk", "rain", "crown", "fireworks", "lightning", "chefkiss", "point"]);
const STANDE=new Set(['bow','floss','robot','sprinkler','griddy','airguitar','disco','hypejump','micdrop','belt']);
const R=.26;
const onHead=(x,y,r=R)=>new THREE.Vector3(x,y,Math.sqrt(Math.max(0,r*r-x*x-y*y)));
function orient(o,p){const n=p.clone().normalize();o.rotation.set(-Math.asin(n.y),Math.atan2(n.x,n.z),0,'YXZ')}
// torso lathe profile (radius,y)
const TP=[[0,-.05],[.15,-.05],[.19,-.02],[.2,.06],[.186,.18],[.196,.28],[.19,.35],[.15,.41],[.09,.445],[0,.457]];
function tr(y){for(let i=1;i<TP.length;i++){if(y<=TP[i][1]){const a=TP[i-1],b=TP[i],t=(y-a[1])/(b[1]-a[1]||1);return a[0]+(b[0]-a[0])*t}}return 0}
const TZ=.78;
// strip on the torso front: y from y0 to y1, half width fn(t), x offset
function frontStrip(y0,y1,wf,xo=0,rows=8,lift=.004){const pos=[],idx=[];for(let i=0;i<=rows;i++){const t=i/rows,y=y0+(y1-y0)*t,w=wf(t);for(const s of[-1,1]){const x=xo+s*w,rr=tr(y),zz=Math.sqrt(Math.max(0,rr*rr-x*x))*TZ+lift;pos.push(x,y,zz)}}
  for(let i=0;i<rows;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g}
class Mouth{constructor(parent,mats){this.N=14;const n=(this.N+1)*2;this.yc=-.105;
    this.parts=[mats.in,mats.teeth,mats.tongue].map((m,i)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(n*3),3));const id=[];for(let j=0;j<this.N;j++){const a=j*2;id.push(a,a+1,a+2,a+1,a+3,a+2)}g.setIndex(id);
      const me=new THREE.Mesh(g,m);me.layers.set(1);me.renderOrder=2+i;me.frustumCulled=false;parent.add(me);return me});
    this.w=this.h=this.c=-1;this.set(.048,0,.8)}
  set(w,h,c){if(Math.abs(w-this.w)<4e-4&&Math.abs(h-this.h)<4e-4&&Math.abs(c-this.c)<.01)return;this.w=w;this.h=h;this.c=c;const N=this.N,yc=this.yc;
    const top=[],bot=[];for(let j=0;j<=N;j++){const u=-1+2*j/N,x=u*w,yt=c*u*u*.014-.002,e=Math.sqrt(Math.max(0,1-u*u));top.push([x,yt]);bot.push([x,yt-h*e-.0055*e])}
    const fill=(k,f0,f1,rr)=>{const g=this.parts[k].geometry,P=g.attributes.position.array,Nn=g.attributes.normal.array;let o=0;for(let j=0;j<=N;j++){for(const f of[f0,f1]){const yy=f(j),x=top[j][0],y=yc+yy,z=Math.sqrt(Math.max(0,rr*rr-x*x-y*y));P[o]=x;P[o+1]=y;P[o+2]=z;const l=Math.hypot(x,y,z)||1;Nn[o]=x/l;Nn[o+1]=y/l;Nn[o+2]=z/l;o+=3}}g.attributes.position.needsUpdate=true;g.attributes.normal.needsUpdate=true;g.computeBoundingSphere()};
    fill(0,j=>top[j][1],j=>bot[j][1],R+.0016);
    const th=j=>{const d=top[j][1]-bot[j][1];return top[j][1]-Math.min(.013,d*.3)};
    const vis=h>.018;this.parts[1].visible=this.parts[2].visible=vis;
    if(vis){fill(1,j=>top[j][1]-.0005,th,R+.0024);fill(2,j=>{const d=top[j][1]-bot[j][1],u=-1+2*j/N;return bot[j][1]+d*.42*(1-u*u*.55)},j=>bot[j][1]+.0008,R+.0022)}}}
/* "thank you" plank: hands and toes planted, arms straight, legs wide; the hips sink by d (0..1) and the chest comes up.
   Side view (z toward the camera, y up), avatar root on the floor: the hip moves on a circle around the toes, the shoulder is where
   the torso and the planted arm meet (two-circle intersection), so nothing slides */
const PLK={hip:.3,hpz:0,tx:0,ty:0,tz:0,hx:0,hy:0,hz:0,lsx:0,lsz:.3,lex:0,lez:0,rsx:0,rsz:-.3,rex:0,rez:0,ltx:0,lkx:0,rtx:0,rkx:0,ltz:.42,rtz:-.42,lift:0,sway:0};
function plankPose(d){const LA=.338*Math.cos(.3),LL=.538*Math.cos(.42),LT=.36,HZ=.3,HY=.056,TY=.1,S0=HY+LA,dz0=Math.sqrt(Math.max(.01,(LL+LT)*(LL+LT)-(S0-TY)*(S0-TY))),TZ=HZ-dz0;
  const f0=Math.atan2(S0-TY,dz0),f=f0-(f0-.07)*clamp(d,0,1),Hz=TZ+LL*Math.cos(f),Hy=TY+LL*Math.sin(f);
  const dx=HZ-Hz,dy=HY-Hy,D=Math.hypot(dx,dy)||1,a=(LT*LT-LA*LA+D*D)/(2*D),h=Math.sqrt(Math.max(0,LT*LT-a*a)),mz=Hz+a*dx/D,my=Hy+a*dy/D;
  let Sz=mz-h*dy/D,Sy=my+h*dx/D;const z2=mz+h*dy/D,y2=my-h*dx/D;if(y2>Sy){Sz=z2;Sy=y2}
  const at=Math.atan2(Sz-Hz,Sy-Hy),b=Math.atan2(Hz-TZ,Hy-TY),c=Math.atan2(Sz-HZ,Sy-HY);
  PLK.hip=Hy;PLK.hpz=Hz;PLK.tx=at;PLK.ltx=PLK.rtx=b;PLK.lsx=PLK.rsx=c-at;PLK.hx=-at-.15;return PLK}
class Avatar {
    constructor(o){this.id=o.id;this.nm=o.nm||'Guest';this.me=!!o.me;this.bot=!!o.bot;this.seed=hash(this.id+'|'+this.nm);this.rand=rng(this.seed);
    this.root=new THREE.Group();this.root.name='avatar';this.lookStr='';this.L=0;this.Ls=0;this.hf=.5;this.talkT=0;this.quietT=9;this.muted=false;this.hand=false;this.emo=null;
    this.mode='seated';this.sitK=1;this.standK=0;this.path=null;this.pi=0;this.walkPh=0;this.speed=2.1;this.onArrive=null;this.alpha=1;this.gone=false;
    this.blinkT=1+this.rand()*3;this.blink=0;this.typeT=this.rand()*4;this.typing=this.rand()<.6;this.nextIdle=4+this.rand()*8;this.idleK=null;this.idleT=0;
    this.pk=0;this.dip=0;this.thx=0;this.md={hype:0,laugh:0,focus:0,fire:0,calm:0};this.mdOv=null;this.pmp=0;this.pmpN=0;this.gaze=new THREE.Vector3(0,1.5,12);this.gz={x:0,y:0};this.lookBack=0;this.nod=0;this.gest=0;
    this.P={};this.T={};this._v=new THREE.Vector3();this._w=new THREE.Vector3();
    this.setLook(o.look||'');}
  setLook(code){if(code===this.lookStr&&this.rig)return;this.lookStr=code;const keep=this.rig?{p:this.root.position.clone(),r:this.root.rotation.y}:null;
    if(this.rig){this.root.remove(this.rig);this.disposeRig()}this.look=parseLook(code,this.nm);this.build();if(keep){this.root.position.copy(keep.p);this.root.rotation.y=keep.r}}
  disposeRig(){if(this.mouth)this.mouth.parts.forEach(p=>p.geometry.dispose());(this.own||[]).forEach(x=>x.dispose&&x.dispose())}
  build() {
      let $ = this.look, J = $.s >= 8 && EXT.skin ? EXT.skin($.s) : null, Q = J ? J.hex : SKIN[$.s] || ($.s === 6 ? "#e3b04f" : "#dff3ff"), Z = HAIRC[$.c], U = $.o, q = OUTC_ALL[$.k] || OUTC[0], E = PANTS[$.p], Y = this.own = [];
      this.cup = [];
      let K = new THREE.Color(Q), V = J ? J.mat : $.s === 6 ? std("#e3b04f", 0.22, 1) : $.s === 7 ? std("#dff3ff", 0.05, 0.25, { emissive: "#2a5470", emissiveIntensity: 0.55 }) : std(Q, 0.58, 0, { emissive: "#" + K.clone().multiplyScalar(0.07).getHexString() }), X = $.k >= 10 ? OUTC_BP[$.k - 10] : null, W = U === 7 ? std("#0d0d10", 0.4, 0.1) : U === 8 ? std("#141416", 0.3, 0.18) : U === 12 ? std("#e3b04f", 0.26, 1) : $.k === 26 ? (() => {
        let $0 = new THREE.MeshStandardMaterial({ color: "#ff6ad5", roughness: 0.3, metalness: 0.4, emissive: "#331133" });
        return Y.push($0), this.cup.push((j) => {
          $0.color.setHSL(j * 0.12 % 1, 0.85, 0.6), $0.emissive.setHSL(j * 0.12 % 1, 0.9, 0.12);
        }), $0;
      })() : X ? std(X[0], X[1], X[2], X[3] ? { emissive: X[3] } : undefined) : std(q, U === 2 ? 0.55 : 0.78, 0), H = std(E, 0.82), N = std("#101014", 0.35, 0.1), F = std(Z, 0.46, 0), G__L = std("#07070a", 0.1, 0, { envMapIntensity: 2.2 }), _ = std("#202024", 0.4, 0.3), D = std("#ff1f4f", 0.35, 0.2), O = std("#e8bd62", 0.22, 1), I = std("#f4f4f4", 0.6), B = this.micMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 1, 0.5) });
      Y.push(B);
      let k = this.rig = new THREE.Group;
      this.root.add(k);
      let z = this.hip = new THREE.Group;
      z.position.y = 0.6, k.add(z);
      let M = this.torso = new THREE.Group;
      z.add(M);
      let v = U >= 13 && EXT.outfit ? EXT.outfit(U, { outC: q, k: $.k, frontStrip: frontStrip, tr: tr, TZ: TZ, G: G, mWhite: I, std: std, cup: this.cup }) : null;
      if (v)
        W = v.mat;
      let g = new THREE.Mesh(G("torso", () => lathe(TP, 32)), W);
      if (g.scale.z = TZ, g.castShadow = true, M.add(g), U === 1)
        [-1, 1].forEach(($0) => {
          let j = new THREE.Mesh(G("col", () => rbox(0.1, 0.016, 0.06, 0.006)), W);
          j.position.set($0 * 0.05, 0.43, 0.075), j.rotation.set(-0.5, $0 * 0.5, $0 * 0.25), M.add(j);
        }), [0.37, 0.32].forEach(($0) => {
          let j = new THREE.Mesh(G("btn", () => sph(0.009, 8, 6)), I);
          j.position.set(0, $0, tr($0) * TZ + 0.004), M.add(j);
        });
      if (U === 2 || U === 4) {
        let $0 = new THREE.Mesh(G("vee", () => frontStrip(0.2, 0.445, (u) => 0.008 + u * 0.072, 0, 8, 0.003)), U === 2 ? I : std(q, 0.7));
        M.add($0);
        let j = new THREE.Mesh(G("tie", () => frontStrip(0.17, 0.43, (u) => u > 0.88 ? 0.02 : 0.028 - u * 0.018, 0, 8, 0.007)), U === 2 ? D : std($.k === 0 ? "#17171d" : "#ff1f4f", 0.5));
        if (M.add(j), U === 2)
          [-1, 1].forEach((u) => {
            let Q0 = new THREE.Mesh(G("lapel" + u, () => {
              let K0 = frontStrip(0.21, 0.445, (x) => 0.014, 0, 8, 0.006), N0 = K0.attributes.position;
              for (let x = 0;x < N0.count; x++) {
                let n = N0.getY(x), X0 = (n - 0.21) / 0.235;
                N0.setX(x, N0.getX(x) + u * (0.012 + X0 * 0.072));
                let Z0 = tr(n), S = N0.getX(x);
                N0.setZ(x, Math.sqrt(Math.max(0, Z0 * Z0 - S * S)) * TZ + 0.006);
              }
              return K0.computeVertexNormals(), K0;
            }), std("#0d0d10", 0.5));
            M.add(Q0);
          });
      }
      if (U === 5 || U === 6 || U === 9) {
        let $0 = std("#f4f4f4", 0.85);
        if ([0.02, 0.05].forEach((j) => {
          let u = new THREE.Mesh(G("band" + j, () => frontStrip(j, j + 0.022, (Q0) => 0.19, 0, 2, 0.004)), $0);
          M.add(u);
        }), U === 9) {
          let j = hash(this.nm) % 98 + 1, u = document.createElement("canvas");
          u.width = 128, u.height = 128;
          let Q0 = u.getContext("2d");
          Q0.font = "900 92px Verdana", Q0.textAlign = "center", Q0.textBaseline = "middle", Q0.lineWidth = 8, Q0.strokeStyle = "#fff", Q0.strokeText(j, 64, 70), Q0.fillStyle = $.k === 2 ? "#17171d" : "#ffffff", Q0.fillText(j, 64, 70);
          let K0 = new THREE.CanvasTexture(u);
          K0.colorSpace = THREE.SRGBColorSpace;
          let N0 = new THREE.MeshStandardMaterial({ map: K0, transparent: true, roughness: 0.8, depthWrite: false });
          Y.push(N0, K0);
          let x = new THREE.Mesh(frontStrip(0.12, 0.36, (Z0) => 0.11, 0, 8, 0.006), N0), n = x.geometry.attributes.position;
          if (!x.geometry.attributes.uv)
            x.geometry.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(n.count * 2), 2));
          let X0 = x.geometry.attributes.uv;
          for (let Z0 = 0;Z0 < n.count; Z0++)
            X0.setXY(Z0, (n.getX(Z0) + 0.11) / 0.22, (n.getY(Z0) - 0.12) / 0.24);
          X0.needsUpdate = true, M.add(x);
        }
        if (U === 5) {
          let j = document.createElement("canvas");
          j.width = 96, j.height = 96;
          let u = j.getContext("2d");
          u.font = "900 76px Georgia", u.textAlign = "center", u.textBaseline = "middle", u.lineWidth = 10, u.strokeStyle = "#f4f4f4", u.strokeText("W", 48, 52), u.fillStyle = "#ff1f4f", u.fillText("W", 48, 52);
          let Q0 = new THREE.CanvasTexture(j);
          Q0.colorSpace = THREE.SRGBColorSpace;
          let K0 = new THREE.MeshStandardMaterial({ map: Q0, transparent: true, roughness: 0.9, depthWrite: false });
          Y.push(K0, Q0);
          let N0 = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.09), K0);
          N0.position.set(-0.085, 0.33, tr(0.33) * TZ + 0.012), N0.rotation.y = -0.4, M.add(N0);
        }
        if (U === 6) {
          let j = new THREE.Mesh(G("zip", () => frontStrip(0.06, 0.44, (u) => 0.005, 0, 6, 0.006)), std("#d8d8de", 0.3, 0.8));
          M.add(j);
        }
      }
      if (U === 7 || U === 12) {
        let $0 = new THREE.Mesh(G("vee", () => frontStrip(0.2, 0.445, (j) => 0.008 + j * 0.072, 0, 8, 0.003)), U === 7 ? I : std("#0d0d10", 0.6));
        if (M.add($0), [-1, 1].forEach((j) => {
          let u = new THREE.Mesh(G("lapel" + j, () => {
            let Q0 = frontStrip(0.21, 0.445, (N0) => 0.014, 0, 8, 0.006), K0 = Q0.attributes.position;
            for (let N0 = 0;N0 < K0.count; N0++) {
              let x = K0.getY(N0), n = (x - 0.21) / 0.235;
              K0.setX(N0, K0.getX(N0) + j * (0.012 + n * 0.072));
              let X0 = tr(x), Z0 = K0.getX(N0);
              K0.setZ(N0, Math.sqrt(Math.max(0, X0 * X0 - Z0 * Z0)) * TZ + 0.006);
            }
            return Q0.computeVertexNormals(), Q0;
          }), U === 7 ? std("#050507", 0.15, 0.2) : std("#0d0d10", 0.5));
          M.add(u);
        }), U === 7 && !$.B)
          [-1, 1].forEach((j) => {
            let u = new THREE.Mesh(G("bt", () => sph(1, 12, 8)), std("#050507", 0.3));
            u.scale.set(0.04, 0.026, 0.016), u.position.set(j * 0.036, 0.43, 0.114), u.rotation.z = j * 0.25, M.add(u);
          });
        if (U === 12) {
          let j = new THREE.Mesh(G("tie", () => frontStrip(0.17, 0.43, (u) => u > 0.88 ? 0.02 : 0.028 - u * 0.018, 0, 8, 0.007)), std("#e3b04f", 0.24, 1));
          M.add(j);
        }
      }
      if (U === 8) {
        [-1, 1].forEach((j) => {
          let u = new THREE.Mesh(G("lcol" + j, () => rbox(0.13, 0.02, 0.07, 0.008)), W);
          u.position.set(j * 0.07, 0.42, 0.07), u.rotation.set(-0.6, j * 0.55, j * 0.3), M.add(u);
        });
        let $0 = new THREE.Mesh(G("lzip", () => frontStrip(0.05, 0.4, (j) => 0.004, 0.045, 6, 0.006)), std("#c8c8cc", 0.25, 1));
        M.add($0);
      }
      if (U === 10) {
        let $0 = document.createElement("canvas");
        $0.width = 256, $0.height = 256;
        let j = $0.getContext("2d");
        j.fillStyle = q, j.fillRect(0, 0, 256, 256);
        let u = rng(this.seed);
        for (let N0 = 0;N0 < 26; N0++) {
          let x = u() * 256, n = u() * 256, X0 = 10 + u() * 14, Z0 = ["#fff6dc", "#ffcf40", "#ff7ab6", "#3ddc97"][N0 % 4];
          j.fillStyle = Z0;
          for (let S = 0;S < 5; S++) {
            let m = S / 5 * 6.283;
            j.beginPath(), j.ellipse(x + Math.cos(m) * X0 * 0.6, n + Math.sin(m) * X0 * 0.6, X0 * 0.5, X0 * 0.28, m, 0, 6.283), j.fill();
          }
          j.fillStyle = "#7a2a10", j.beginPath(), j.arc(x, n, X0 * 0.18, 0, 6.283), j.fill();
        }
        let Q0 = new THREE.CanvasTexture($0);
        Q0.colorSpace = THREE.SRGBColorSpace, Q0.wrapS = Q0.wrapT = THREE.RepeatWrapping, Q0.repeat.set(3, 1.6);
        let K0 = new THREE.MeshStandardMaterial({ map: Q0, roughness: 0.75 });
        Y.push(K0, Q0), g.material = K0, this._hw = K0;
      }
      if (U === 11) {
        let $0 = std(q, 0.55, 0.05);
        [0.07, 0.15, 0.23, 0.31].forEach((j) => {
          let u = new THREE.Mesh(G("puf" + j, () => new THREE.TorusGeometry(tr(j) + 0.006, 0.024, 8, 36)), $0);
          u.rotation.x = Math.PI / 2, u.position.y = j, u.scale.set(1, TZ, 1), M.add(u);
        });
      }
      if (U === 3) {
        let $0 = new THREE.Mesh(G("hood", () => new THREE.TorusGeometry(0.12, 0.05, 10, 24, Math.PI)), W);
        $0.position.set(0, 0.42, -0.09), $0.rotation.set(0.35, 0, Math.PI), M.add($0);
        let j = new THREE.Mesh(G("pocket", () => frontStrip(0.05, 0.17, (u) => 0.11 - u * 0.02, 0, 6, 0.006)), std(new THREE.Color(q).multiplyScalar(0.75).getStyle(), 0.85));
        M.add(j), [-1, 1].forEach((u) => {
          let Q0 = new THREE.Mesh(G("str", () => limb(0.006, 0.1, 2, 6)), I);
          Q0.position.set(u * 0.035, 0.42, 0.13), Q0.rotation.x = -0.25, M.add(Q0);
        });
      }
      if (v)
        try {
          v.det(M);
        } catch ($0) {
          console.warn("VO3 outfit", $0);
        }
      let R__L = new THREE.Mesh(G("neck", () => cyl(0.055, 0.06, 0.08, 16)), V);
      if (R__L.position.y = 0.47, M.add(R__L), $.a === 2 || $.a === 5) {
        let $0 = new THREE.Mesh(G("chain", () => new THREE.TorusGeometry(0.13, 0.011, 8, 40)), O);
        $0.position.set(0, 0.41, 0.035), $0.rotation.x = Math.PI / 2 - 0.55, M.add($0);
        let j = new THREE.Mesh(G("medal", () => cyl(0.032, 0.032, 0.01, 20)), O);
        j.position.set(0, 0.33, tr(0.33) * TZ + 0.012), j.rotation.x = Math.PI / 2 - 0.12, M.add(j);
      }
      let C = this.headP = new THREE.Group;
      C.position.y = 0.5, M.add(C);
      let p = this.head = new THREE.Mesh(G("head", () => sph(R, 44, 30)), V);
      p.position.y = 0.2, p.scale.set(1, 0.95, 0.96), p.castShadow = true, C.add(p), [-1, 1].forEach(($0) => {
        let j = new THREE.Mesh(G("ear", () => sph(0.055, 14, 10)), V);
        j.position.set($0 * 0.255, -0.01, -0.005), j.scale.set(0.45, 1, 0.75), p.add(j);
      });
      let i = new THREE.Mesh(G("nose", () => sph(0.023, 14, 10)), std(K.clone().multiplyScalar(0.93).getStyle(), 0.55));
      i.position.copy(onHead(0, -0.03)).multiplyScalar(0.985), i.scale.set(1, 0.85, 0.8), i.layers.set(1), p.add(i), this.eyes = [], this.hl = [], [-1, 1].forEach(($0) => {
        let j = new THREE.Mesh(G("eye", () => sph(1, 18, 12)), G__L);
        j.scale.set(0.036, 0.048, 0.022), j.layers.set(1), p.add(j), this.eyes.push(j);
        let u = new THREE.Mesh(G("hl", () => sph(0.0095, 8, 6)), basic("#ffffff"));
        u.layers.set(1), p.add(u), this.hl.push(u);
      }), this.brows = [-1, 1].map(($0) => {
        let j = new THREE.Mesh(G("brow", () => {
          let u = new THREE.CapsuleGeometry(0.0085, 0.05, 3, 8);
          return u.rotateZ(Math.PI / 2), u;
        }), std(new THREE.Color(Z).multiplyScalar(0.8).getStyle(), 0.6));
        return j.layers.set(1), p.add(j), j;
      }), [-1, 1].forEach(($0) => {
        let j = new THREE.Mesh(G("cheek", () => new THREE.CircleGeometry(0.042, 20)), basic("#ff6f86", { transparent: true, opacity: 0.26, depthWrite: false })), u = onHead($0 * 0.15, -0.06, R + 0.002);
        j.position.copy(u), orient(j, u), j.layers.set(1), p.add(j);
      }), this.mouth = new Mouth(p, { in: basic("#2b070d"), teeth: std("#f3efe8", 0.45), tongue: std("#d9606d", 0.55) }), this.hair($, F, p);
      let e = new THREE.Mesh(G("band", () => new THREE.TorusGeometry(R * 1.1, 0.016, 8, 48, Math.PI)), _);
      e.rotation.x = -0.12, p.add(e);
      let V0 = [], l = [];
      [-1, 1].forEach(($0) => {
        let j = new THREE.Mesh(G("cup", () => {
          let Q0 = cyl(0.075, 0.075, 0.055, 28);
          return Q0.rotateZ(Math.PI / 2), Q0;
        }), _);
        j.position.set($0 * R * 1.07, -0.01, 0), p.add(j), V0.push(j);
        let u = new THREE.Mesh(G("cupr", () => {
          let Q0 = new THREE.TorusGeometry(0.06, 0.009, 8, 28);
          return Q0.rotateY(Math.PI / 2), Q0;
        }), D);
        u.position.set($0 * (R * 1.07 + 0.03), -0.01, 0), p.add(u), l.push(u);
      });
      try {
        bpHeadset($.G, { band: e, cups: V0, rings: l, head: p });
      } catch ($0) {}
      let A0 = [-0.078, -0.118, R * 0.94], J0 = new THREE.Mesh(G("boom", () => tube([[-R * 1.08, -0.05, 0.05], [-R * 0.98, -0.11, 0.15], [-0.17, -0.135, 0.215], A0], 0.0075, 20, 6)), _);
      p.add(J0);
      let T0 = new THREE.Mesh(G("mic", () => sph(0.021, 12, 10)), std("#0a0a0c", 0.9));
      T0.position.set(A0[0], A0[1], A0[2]), p.add(T0);
      let L0 = new THREE.Mesh(G("led", () => sph(0.0085, 8, 6)), B);
      if (L0.position.set(A0[0] - 0.026, A0[1] + 0.004, A0[2] - 0.012), p.add(L0), $.a === 1 || $.a === 5) {
        let $0 = std("#050507", 0.06, 0.4, { envMapIntensity: 2.4 });
        [-1, 1].forEach((u) => {
          let Q0 = onHead(u * 0.09, 0.035, R + 0.016), K0 = new THREE.Mesh(G("lens", () => sph(1, 20, 12)), $0);
          K0.scale.set(0.066, 0.048, 0.016), K0.position.copy(Q0), orient(K0, Q0), p.add(K0);
        });
        let j = new THREE.Mesh(G("bridge", () => rbox(0.06, 0.012, 0.012, 0.005)), $0);
        j.position.copy(onHead(0, 0.05, R + 0.012)), p.add(j), [-1, 1].forEach((u) => {
          let Q0 = new THREE.Mesh(G("temple", () => rbox(0.012, 0.012, 0.2, 0.005)), $0);
          Q0.position.set(u * 0.2, 0.045, 0.1), Q0.rotation.y = u * 0.2, p.add(Q0);
        });
      }
      if ($.a === 4) {
        let $0 = std("#1a1a1e", 0.3, 0.6);
        [-1, 1].forEach((u) => {
          let Q0 = onHead(u * 0.088, 0.03, R + 0.014), K0 = new THREE.Mesh(G("rim", () => new THREE.TorusGeometry(0.05, 0.0055, 8, 28)), $0);
          K0.position.copy(Q0), orient(K0, Q0), K0.scale.set(1, 0.85, 1), K0.layers.set(1), p.add(K0);
        });
        let j = new THREE.Mesh(G("bridge2", () => rbox(0.05, 0.008, 0.008, 0.003)), $0);
        j.position.copy(onHead(0, 0.045, R + 0.013)), j.layers.set(1), p.add(j);
      }
      if ($.a === 3 && !$.H) {
        let $0 = std($.k === 2 ? "#17171d" : q, 0.7), j = new THREE.Mesh(G("capc", () => new THREE.SphereGeometry(R * 1.1, 40, 18, 0, Math.PI * 2, 0, 1.38)), $0);
        j.rotation.x = -0.32, p.add(j);
        let u = new THREE.Mesh(G("brim", () => new THREE.CylinderGeometry(0.2, 0.2, 0.014, 32, 1, false, -1.15, 2.3)), $0);
        u.position.set(0, 0.135, 0.13), u.rotation.x = 0.12, p.add(u);
        let Q0 = new THREE.Mesh(G("capb", () => sph(0.018, 10, 8)), $0);
        Q0.position.set(0, R * 1.08, -0.08), p.add(Q0);
      }
      let G0 = U === 2 || U === 3 || U === 4 || U === 5 || U === 6 || U === 7 || U === 8 || U === 11 || U === 12 || !!(v && v.long);
      this.sh = [], this.el = [], [1, -1].forEach(($0) => {
        let j = new THREE.Group;
        j.position.set($0 * 0.2, 0.36, 0), M.add(j);
        let u = new THREE.Mesh(G("shb", () => sph(0.064, 16, 12)), W);
        j.add(u);
        let Q0 = U === 5 ? I : U === 11 ? std("#2a2a33", 0.8) : U === 10 && this._hw ? this._hw : W, K0 = new THREE.Mesh(G("upper", () => limb(0.053, 0.12)), Q0);
        K0.castShadow = true, j.add(K0);
        let N0 = new THREE.Group;
        N0.position.y = -0.17, j.add(N0);
        let x = new THREE.Mesh(G("fore", () => limb(0.047, 0.105)), G0 ? Q0 : V);
        if (U === 6)
          [K0, x].forEach((X0, Z0) => {
            let S = new THREE.Mesh(G("ts" + Z0, () => box(0.012, Z0 ? 0.14 : 0.15, 0.012)), I);
            S.position.set($0 * (Z0 ? 0.046 : 0.052), Z0 ? -0.07 : -0.075, 0), (Z0 ? N0 : j).add(S);
          });
        if (x.castShadow = true, N0.add(x), G0) {
          let X0 = new THREE.Mesh(G("cuff", () => cyl(0.05, 0.05, 0.025, 14)), U === 2 || U === 7 ? I : U === 5 ? std("#ff1f4f", 0.8) : v && v.cuff ? v.cuff : Q0);
          X0.position.y = -0.14, N0.add(X0);
        }
        let n = new THREE.Mesh(G("hand", () => sph(0.056, 16, 12)), V);
        n.position.y = -0.168, n.scale.set(0.95, 1.05, 0.85), N0.add(n), this.sh.push(j), this.el.push(N0);
      }), this.th = [], this.kn = [], [1, -1].forEach(($0) => {
        let j = new THREE.Group;
        j.position.set($0 * 0.095, 0, 0), z.add(j);
        let u = new THREE.Mesh(G("thigh", () => limb(0.072, 0.2)), H);
        u.castShadow = true, j.add(u);
        let Q0 = new THREE.Group;
        Q0.position.y = -0.27, j.add(Q0);
        let K0 = new THREE.Mesh(G("shin", () => limb(0.062, 0.19)), H);
        K0.castShadow = true, Q0.add(K0);
        let N0 = new THREE.Mesh(G("shoe", () => rbox(0.115, 0.075, 0.2, 0.035)), N);
        N0.position.set(0, -0.268, 0.045), N0.castShadow = true, Q0.add(N0), this.th.push(j), this.kn.push(Q0);
      });
      try {
        if ($.H) {
          let $0 = bpHat($.H, p, Z);
          if ($0.up)
            this.cup.push($0.up);
        }
      } catch ($0) {}
      try {
        if ($.B) {
          let $0 = bpExtra($.B, this, Z);
          if ($0.up)
            this.cup.push($0.up);
        }
      } catch ($0) {}
      try {
        if ($.V) {
          let $0 = bpAura($.V, k);
          if ($0)
            this.auraUp = $0.up;
        } else
          this.auraUp = null;
      } catch ($0) {}
      try {
        if ($.J && EXT.blaster) {
          let $0 = EXT.blaster($.J);
          if ($0) {
            if ($0.scale.setScalar(0.62), $0.position.set(-0.085, -0.1, 0), $0.rotation.set(Math.PI / 2, 0, 0), this.th[1].add($0), this.blaster = $0, $0.userData.up)
              this.cup.push($0.userData.up);
          }
        } else
          this.blaster = null;
      } catch ($0) {}
      k.traverse(($0) => {
        if ($0.isMesh)
          $0.userData.av = this;
      }), this.placeFace(0, 0);
    }
  hair(L,m,head){const st=L.h;const cap=(rr,th,tilt,sy=1)=>{const g=G('cap'+rr+th,()=>new THREE.SphereGeometry(rr,44,22,0,Math.PI*2,0,th));const me=new THREE.Mesh(g,m);me.rotation.x=tilt;me.scale.y=sy;me.castShadow=true;head.add(me);return me};
    const blob=(r,x,y,z,sx,sy,sz,rx=0)=>{const b=new THREE.Mesh(G('hb',()=>sph(1,28,18)),m);b.position.set(x,y,z);b.scale.set(r*sx,r*sy,r*sz);b.rotation.x=rx;b.castShadow=true;head.add(b);return b};
    if(st===0){cap(R*1.055,1.5,-.5,1.04);blob(.12,.035,.205,.135,1.35,.42,.75,-.5)}
    else if(st===1){cap(R*1.03,1.42,-.46);blob(.2,0,.165,-.005,1.02,.52,1.12)}
    else if(st===2){cap(R*1.06,1.56,-.38,1.02);const c=new THREE.Mesh(G('curtain',()=>new THREE.CylinderGeometry(R*1.05,R*1.18,.44,36,1,true,.95,Math.PI*2-1.9)),m);c.material=m;c.position.y=-.13;c.castShadow=true;head.add(c);
      const cm=m.clone();cm.side=THREE.DoubleSide;this.own.push(cm);c.material=cm}
    else if(st===3){cap(R*1.05,1.48,-.46);blob(.105,0,.255,-.13,1,1,1)}
    else if(st===4){const g=G('curls',()=>{const r=rng(91),gs=[];for(let i=0;i<46;i++){const th=r()*1.5,ph=r()*6.283;const d=new THREE.Vector3(Math.sin(th)*Math.sin(ph),Math.cos(th),Math.sin(th)*Math.cos(ph));d.applyAxisAngle(new THREE.Vector3(1,0,0),-.48);const s=new THREE.SphereGeometry(.068+r()*.022,12,9);s.translate(d.x*R*1.0,d.y*R*1.0,d.z*R*1.0);gs.push(s)}return mergeAll(gs)});const me=new THREE.Mesh(g,m);me.castShadow=true;head.add(me)}
    else if(st===5){cap(R*1.05,1.5,-.42);const pt=new THREE.Mesh(G('pony',()=>limb(.058,.2)),m);pt.position.set(0,.14,-.25);pt.rotation.x=.55;head.add(pt);const bd=new THREE.Mesh(G('band2',()=>new THREE.TorusGeometry(.05,.014,8,16)),std('#ff1f4f',.5));bd.position.set(0,.15,-.255);bd.rotation.x=Math.PI/2+.55;head.add(bd)}
    else if(st===6){cap(R*1.018,1.44,-.5)}
    else if(st===8){cap(R*1.055,1.42,-.62);blob(.2,0,.19,.0,.92,.44,1.22,-.15)}
    else if(st===9){const af=new THREE.Mesh(G('afro',()=>{const g=new THREE.SphereGeometry(.34,40,28);const p=g.attributes.position,r=rng(5);for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);const n=1+.05*Math.sin(v.x*60)*Math.sin(v.y*55)*Math.sin(v.z*58);v.multiplyScalar(n);p.setXYZ(i,v.x,v.y,v.z)}g.computeVertexNormals();return g}),m);af.position.set(0,.16,-.14);af.castShadow=true;head.add(af)}
  }
  placeFace(gx,gy){const e=this.eyes,h=this.hl;for(let i=0;i<2;i++){const s=i?1:-1,x=s*.088+gx,y=.03+gy;const p=onHead(x,y,R-.004);e[i].position.copy(p);orient(e[i],p);
      const q=onHead(x+.012,y+.018,R+.012);h[i].position.copy(q)}
    for(let i=0;i<2;i++){const s=i?1:-1;const p=onHead(s*.09,.115+this.browY,R+.004);this.brows[i].position.copy(p);orient(this.brows[i],p);this.brows[i].rotation.z=-s*(.08+this.browR)}}
  get browY(){return this._by||0}
  get browR(){return this._br||0}
  setSeat(seat){this.seat=seat}
  // place seated immediately
  sitNow(){const s=this.seat;this.root.position.set(s.x,0,s.sz);this.root.rotation.y=0;this.mode='seated';this.sitK=1;this.standK=0;this.alpha=1;this.root.visible=true}
  walk(path,onArrive){this.path=path;this.pi=0;this.onArrive=onArrive;this.mode='walk';this.root.visible=true}
  enter(spawn,path){this.root.position.set(spawn.x,0,spawn.z);this.root.rotation.y=0;this.sitK=0;this.standK=0;this.walk(path,()=>{this.mode='sitting';this.turnTo=0})}
  leave(path,done){if(this._lv)return;this._lv=1;this.leaving=true;this.mode='rising';this._leavePath=path;this._done=done}
  emote($) {
      let J = { wave: 2.4, clap: 2.2, cheer: 3.2, dance: 4.6, fire: 3, money: 3.2, laugh: 2.2, bell: 2.6, nod: 1.4, throw: 2, dizzy: 3.6, lift: 2.2, shake: 1.9, detonate: 2.4, dab: 1.9, salute: 2, chestpound: 2.2, bow: 2.4, floss: 3.4, robot: 3.4, sprinkler: 3.2, griddy: 3.4, airguitar: 3.2, disco: 3.6, hypejump: 2.6, moneygun: 3, micdrop: 2.8, belt: 3.2 };
      this.emo = { k: $, t: 0, d: J[$] || EXT.dur && EXT.dur[$] || 2.4 };
    }
  mood(w){const m=this.md;if(this.mdOv)w=this.mdOv;for(const k in m)m[k]=w&&w[k]?w[k]:0}
  moodOn(){return !this.look||this.look.m!==1}
  level(L,hf){this.Lraw=L;if(hf!==undefined)this.hf=hf}
  headPos(out){this.head.getWorldPosition(out);return out}
  update($, J, Q) {
      let Z = this.T, U = this.rand, q = this.muted ? 0 : this.Lraw || 0;
      this.L = q > this.L ? damp(this.L, q, 38, $) : damp(this.L, q, 11, $);
      let E = this.L > 0.1;
      if (E)
        this.talkT += $, this.quietT = 0;
      else if (this.quietT += $, this.quietT > 0.35)
        this.talkT = Math.max(0, this.talkT - $ * 2);
      let Y = false;
      if (this.mode === "walk" && this.path) {
        let x = this.path[this.pi], n = this.root.position, X0 = x[0] - n.x, Z0 = x[1] - n.z, S = Math.hypot(X0, Z0);
        if (S < 0.04) {
          if (this.pi++, this.pi >= this.path.length) {
            this.path = null;
            let m = this.onArrive;
            this.onArrive = null, m && m();
          }
        } else {
          let m = Math.min(S, this.speed * $);
          n.x += X0 / S * m, n.z += Z0 / S * m, this.walkPh += m * 5.4, Y = true;
          let d = Math.atan2(X0, Z0) - this.root.rotation.y;
          d = Math.atan2(Math.sin(d), Math.cos(d)), this.root.rotation.y += d * Math.min(1, $ * 10);
        }
      }
      if (this.mode === "sitting") {
        let x = -this.root.rotation.y;
        x = Math.atan2(Math.sin(x), Math.cos(x)), this.root.rotation.y += x * Math.min(1, $ * 9);
        let n = this.seat;
        if (this.root.position.x = damp(this.root.position.x, n.x, 8, $), this.root.position.z = damp(this.root.position.z, n.sz, 8, $), this.sitK = Math.min(1, this.sitK + $ / 0.6), this.sitK >= 1 && Math.abs(x) < 0.05)
          this.mode = "seated";
      }
      if (this.mode === "rising") {
        if (this.sitK = Math.max(0, this.sitK - $ / 0.5), this.sitK <= 0)
          this.mode = "walk", this.walk(this._leavePath, () => {
            this.mode = "gone", this._done && this._done();
          });
      }
      let K = this.mode === "tossed";
      if (K)
        this.sitK = Math.max(0, this.sitK - $ / 0.22), this.typing = false, this.idleK = null;
      let V = this.emo, X = 0, W = "";
      if (V) {
        if (V.t += $, X = sstep(0, 0.25, V.t) * (1 - sstep(V.d - 0.35, V.d, V.t)), W = V.k, V.t >= V.d)
          this.emo = null;
      }
      let H = (W === "cheer" || W === "dance" || W === "throw" || STANDE.has(W) || !!(EXT.stand && EXT.stand.has(W))) && this.mode === "seated";
      this.standK = damp(this.standK, H && V.t < V.d - 0.4 ? 1 : 0, 9, $);
      let N = Math.max(1 - this.sitK, this.standK);
      if (this.nextIdle -= $, this.nextIdle <= 0 && !this.idleK && this.mode === "seated") {
        let x = U();
        this.idleK = x < 0.28 ? "stretch" : x < 0.55 ? "lookcam" : x < 0.75 ? "lean" : "sip", this.idleT = 0, this.nextIdle = 7 + U() * 14;
      }
      if (this.idleK) {
        if (this.idleT += $, this.idleT > 3.2)
          this.idleK = null;
      }
      if (this.typeT -= $, this.typeT <= 0)
        this.typing = !this.typing, this.typeT = this.typing ? 1.5 + U() * 4 : 1 + U() * 3;
      let F = this.typing && !E && Q.focusSpeaker !== this ? 1 : 0, G__L = { hip: 0.53, tx: 0.05, ty: 0, tz: 0, hx: 0.16 * F, hy: 0, hz: 0, lsx: -0.56, lsz: 0.17, lex: -1.12, lez: 0, rsx: -0.56, rsz: -0.17, rex: -1.12, rez: 0, ltx: -1.52, lkx: 1.46, rtx: -1.52, rkx: 1.46, lift: 0, sway: 0, hpz: 0, ltz: 0, rtz: 0 };
      if (F)
        G__L.lex += Math.sin(J * 15.5 + this.seed) * 0.07, G__L.rex += Math.sin(J * 14.2 + this.seed * 0.7 + 1.6) * 0.07, G__L.tx = 0.1;
      else
        G__L.lsx = -0.5, G__L.rsx = -0.5, G__L.lex = -1, G__L.rex = -1;
      let _ = Math.sin(J * 1.6 + this.seed) * 0.012;
      if (G__L.tx += _, this.idleK) {
        let x = sstep(0, 0.4, this.idleT) * (1 - sstep(2.7, 3.2, this.idleT));
        if (this.idleK === "stretch")
          G__L.lsz = lerp(G__L.lsz, 2.75, x), G__L.rsz = lerp(G__L.rsz, -2.75, x), G__L.lsx = lerp(G__L.lsx, -0.15, x), G__L.rsx = lerp(G__L.rsx, -0.15, x), G__L.lex = lerp(G__L.lex, -0.35, x), G__L.rex = lerp(G__L.rex, -0.35, x), G__L.tx -= 0.14 * x, G__L.hx -= 0.25 * x;
        else if (this.idleK === "lean")
          G__L.tx -= 0.18 * x, G__L.lsx = lerp(G__L.lsx, 0.25, x), G__L.rsx = lerp(G__L.rsx, 0.25, x), G__L.lex = lerp(G__L.lex, -0.5, x), G__L.rex = lerp(G__L.rex, -0.5, x);
        else if (this.idleK === "sip")
          G__L.rsx = lerp(G__L.rsx, -1.15, x), G__L.rex = lerp(G__L.rex, -1.7, x), G__L.rsz = lerp(G__L.rsz, 0.35, x), G__L.hx -= 0.08 * x;
      }
      let D = this.gest = damp(this.gest, this.L > 0.22 && this.talkT > 0.6 ? 1 : 0, 4, $);
      if (D > 0.01) {
        let x = Math.sin(J * 5.2 + this.seed) * 0.25 * this.L;
        G__L.rsx = lerp(G__L.rsx, -1.05 + x, D), G__L.rex = lerp(G__L.rex, -1.55 - x * 0.8, D), G__L.rsz = lerp(G__L.rsz, -0.32, D), G__L.tx = lerp(G__L.tx, 0, D);
        let n = sstep(0.4, 1, Math.sin(J * 0.9 + this.seed * 3) * 0.5 + 0.5) * D;
        G__L.lsx = lerp(G__L.lsx, -0.95, n), G__L.lex = lerp(G__L.lex, -1.45, n);
      }
      let O = { hip: 0.58, tx: 0.02, ty: 0, tz: 0, hx: 0, hy: 0, hz: 0, lsx: 0, lsz: 0.13, lex: -0.12, lez: 0, rsx: 0, rsz: -0.13, rex: -0.12, rez: 0, ltx: 0, lkx: 0, rtx: 0, rkx: 0, lift: 0, sway: 0, hpz: 0, ltz: 0, rtz: 0 };
      if (Y || this.mode === "walk") {
        let x = this.walkPh, n = Math.sin(x);
        O.ltx = -0.55 * n, O.rtx = 0.55 * n, O.lkx = 0.65 * Math.max(0, Math.sin(x + 1.2)), O.rkx = 0.65 * Math.max(0, Math.sin(x + 1.2 + Math.PI)), O.lsx = 0.48 * n, O.rsx = -0.48 * n, O.lex = -0.35, O.rex = -0.35, O.lift = 0.028 * Math.abs(Math.cos(x)), O.tx = 0.07;
      }
      for (let x in G__L)
        Z[x] = lerp(G__L[x], O[x], N);
      if (X > 0) {
        let x = V.t;
        if (W === "wave")
          Z.rsz = lerp(Z.rsz, -2.45, X), Z.rsx = lerp(Z.rsx, -0.25, X), Z.rex = lerp(Z.rex, -0.25, X), Z.rez = lerp(Z.rez, Math.sin(x * 11) * 0.55, X), Z.hz = lerp(Z.hz, 0.12, X);
        else if (W === "clap") {
          let n = Math.abs(Math.sin(x * 11));
          Z.lsx = lerp(Z.lsx, -1.15, X), Z.rsx = lerp(Z.rsx, -1.15, X), Z.lsz = lerp(Z.lsz, 0.1 + 0.4 * n, X), Z.rsz = lerp(Z.rsz, -0.1 - 0.4 * n, X), Z.lex = lerp(Z.lex, -0.7, X), Z.rex = lerp(Z.rex, -0.7, X), Z.lez = lerp(Z.lez, -0.5, X), Z.rez = lerp(Z.rez, 0.5, X);
        } else if (W === "cheer" || W === "bell") {
          let n = Math.abs(Math.sin(x * 7.5));
          if (Z.lsz = lerp(Z.lsz, 2.6 + 0.2 * n, X), Z.rsz = lerp(Z.rsz, -2.6 - 0.2 * n, X), Z.lsx = lerp(Z.lsx, -0.2, X), Z.rsx = lerp(Z.rsx, -0.2, X), Z.lex = lerp(Z.lex, -0.3, X), Z.rex = lerp(Z.rex, -0.3, X), Z.hx = lerp(Z.hx, -0.2, X), W === "cheer" && this.standK > 0.5)
            Z.lift += 0.14 * n * X * this.standK;
        } else if (W === "dance") {
          let n = x * 7.2;
          Z.sway = lerp(Z.sway, Math.sin(n * 0.5) * 0.06, X), Z.tz = lerp(Z.tz, Math.sin(n * 0.5) * 0.16, X), Z.lsx = lerp(Z.lsx, Math.sin(n) > 0 ? -2.4 : -0.4, X), Z.rsx = lerp(Z.rsx, Math.sin(n) > 0 ? -0.4 : -2.4, X), Z.lex = lerp(Z.lex, -0.9, X), Z.rex = lerp(Z.rex, -0.9, X), Z.hz = lerp(Z.hz, Math.sin(n * 0.5) * 0.2, X), Z.hx = lerp(Z.hx, Math.sin(n) * 0.08, X), Z.lift += Math.abs(Math.sin(n)) * 0.04 * X * this.standK;
        } else if (W === "fire") {
          let n = Math.abs(Math.sin(x * 8));
          Z.rsz = lerp(Z.rsz, -2.4 - 0.5 * n, X), Z.rex = lerp(Z.rex, -1.2 * n - 0.2, X), Z.rsx = lerp(Z.rsx, -0.3, X), Z.lsx = lerp(Z.lsx, -0.9, X), Z.lex = lerp(Z.lex, -1.6, X), Z.hx = lerp(Z.hx, -0.12, X);
        } else if (W === "money") {
          let n = x * 2.4 % 1;
          Z.rsx = lerp(Z.rsx, -2.3 + n * 1.6, X), Z.rsz = lerp(Z.rsz, -0.45, X), Z.rex = lerp(Z.rex, -0.6, X), Z.hx = lerp(Z.hx, -0.1, X);
        } else if (W === "laugh")
          Z.tx = lerp(Z.tx, -0.12 + Math.sin(x * 20) * 0.03, X), Z.hx = lerp(Z.hx, -0.24, X), Z.lsx = lerp(Z.lsx, -0.9, X), Z.lex = lerp(Z.lex, -1.7, X), Z.rsx = lerp(Z.rsx, -0.4, X);
        else if (W === "nod")
          Z.hx = lerp(Z.hx, Math.sin(x * 9) * 0.18, X);
        else if (W === "throw") {
          let n = sstep(0, 0.45, x), X0 = sstep(0.45, 0.75, x), Z0 = lerp(lerp(Z.rsx, 1, n), -2.6, X0), S = lerp(lerp(Z.rsz, -0.9, n), -0.25, X0), m = lerp(lerp(Z.rex, -1.6, n), -0.15, X0), t = lerp(lerp(Z.ty, 0.45, n), -0.35, X0), d = lerp(lerp(Z.tx, -0.1, n), 0.22, X0), R0 = lerp(lerp(Z.lsx, -0.9, n), 0.35, X0);
          Z.rsx = lerp(Z.rsx, Z0, X), Z.rsz = lerp(Z.rsz, S, X), Z.rex = lerp(Z.rex, m, X), Z.ty = lerp(Z.ty, t, X), Z.tx = lerp(Z.tx, d, X), Z.lsx = lerp(Z.lsx, R0, X), Z.hx = lerp(Z.hx, -0.08, X);
        } else if (W === "lift")
          Z.lsz = lerp(Z.lsz, 2.82, X), Z.rsz = lerp(Z.rsz, -2.82, X), Z.lsx = lerp(Z.lsx, -0.28, X), Z.rsx = lerp(Z.rsx, -0.28, X), Z.lex = lerp(Z.lex, -0.6, X), Z.rex = lerp(Z.rex, -0.6, X), Z.hx = lerp(Z.hx, -0.3, X), Z.tx = lerp(Z.tx, -0.06, X);
        else if (W === "shake") {
          let n = Math.sin(x * 30), X0 = Math.sin(x * 30 + 1.3);
          Z.lsz = lerp(Z.lsz, 2.75 + 0.16 * n, X), Z.rsz = lerp(Z.rsz, -2.75 + 0.16 * n, X), Z.lsx = lerp(Z.lsx, -0.28 + 0.12 * X0, X), Z.rsx = lerp(Z.rsx, -0.28 + 0.12 * X0, X), Z.lex = lerp(Z.lex, -0.6, X), Z.rex = lerp(Z.rex, -0.6, X), Z.hx = lerp(Z.hx, -0.32, X), Z.tz = lerp(Z.tz, 0.06 * n, X), Z.sway = lerp(Z.sway, 0.03 * n, X);
        } else if (W === "dab") {
          let n = sstep(0.1, 0.35, x);
          Z.rsz = lerp(Z.rsz, -2.2, X * n), Z.rsx = lerp(Z.rsx, -0.7, X * n), Z.rex = lerp(Z.rex, 0, X * n), Z.lsx = lerp(Z.lsx, -1.55, X * n), Z.lsz = lerp(Z.lsz, 0.25, X * n), Z.lex = lerp(Z.lex, -2.1, X * n), Z.hx = lerp(Z.hx, 0.38, X * n), Z.hy = lerp(Z.hy, 0.35, X * n), Z.tz = lerp(Z.tz, 0.1, X * n);
        } else if (W === "salute")
          Z.rsx = lerp(Z.rsx, -1.45, X), Z.rsz = lerp(Z.rsz, -0.95, X), Z.rex = lerp(Z.rex, -2.25, X), Z.hx = lerp(Z.hx, -0.1, X), Z.tx = lerp(Z.tx, -0.06, X);
        else if (W === "chestpound") {
          let n = Math.max(0, Math.sin(x * 8)), X0 = Math.max(0, Math.sin(x * 8 + Math.PI));
          Z.rsx = lerp(Z.rsx, -1 - 0.3 * n, X), Z.rex = lerp(Z.rex, -2.1 + 0.3 * n, X), Z.rsz = lerp(Z.rsz, 0.25, X), Z.lsx = lerp(Z.lsx, -1 - 0.3 * X0, X), Z.lex = lerp(Z.lex, -2.1 + 0.3 * X0, X), Z.lsz = lerp(Z.lsz, -0.25, X), Z.tx = lerp(Z.tx, -0.1, X), Z.hx = lerp(Z.hx, -0.15, X);
        } else if (W === "bow") {
          let n = sstep(0.25, 0.75, x) * (1 - sstep(1.6, 2.1, x));
          Z.tx = lerp(Z.tx, 0.85 * n, X), Z.rsx = lerp(Z.rsx, -0.7, X), Z.rex = lerp(Z.rex, -1.7, X), Z.rsz = lerp(Z.rsz, 0.2, X), Z.lsx = lerp(Z.lsx, 0.55, X), Z.lex = lerp(Z.lex, -0.6, X), Z.hx = lerp(Z.hx, 0.25 * n, X);
        } else if (W === "floss") {
          let n = x * 9, X0 = Math.sin(n), Z0 = Math.sin(n / 2) > 0 ? 1 : -1;
          Z.lsz = lerp(Z.lsz, 0.22 + 0.42 * X0, X), Z.rsz = lerp(Z.rsz, -0.22 + 0.42 * X0, X), Z.lsx = lerp(Z.lsx, 0.5 * Z0, X), Z.rsx = lerp(Z.rsx, -0.5 * Z0, X), Z.lex = lerp(Z.lex, 0, X), Z.rex = lerp(Z.rex, 0, X), Z.sway = lerp(Z.sway, -0.06 * X0, X), Z.tz = lerp(Z.tz, -0.1 * X0, X), Z.hz = lerp(Z.hz, 0.08 * X0, X);
        } else if (W === "robot") {
          let n = Math.floor(x * 3.2) % 4, X0 = [[-1.3, -1.57, -0.2, -1.57, 0.6, 0], [-0.2, -1.57, -1.3, -1.57, -0.6, 0.1], [-1.57, 0, -1.57, 0, 0, -0.1], [-1.3, -1.57, -1.3, -1.57, 0.4, 0]][n];
          Z.rsx = lerp(Z.rsx, X0[0], X), Z.rex = lerp(Z.rex, X0[1], X), Z.lsx = lerp(Z.lsx, X0[2], X), Z.lex = lerp(Z.lex, X0[3], X), Z.hy = lerp(Z.hy, X0[4], X), Z.tz = lerp(Z.tz, X0[5], X), Z.rsz = lerp(Z.rsz, -0.1, X), Z.lsz = lerp(Z.lsz, 0.1, X);
        } else if (W === "sprinkler") {
          let n = Math.floor(x * 6) % 8 / 7;
          Z.lsz = lerp(Z.lsz, 2.5, X), Z.lsx = lerp(Z.lsx, -0.2, X), Z.lex = lerp(Z.lex, -2.3, X), Z.rsx = lerp(Z.rsx, -1.5, X), Z.rex = lerp(Z.rex, -0.1, X), Z.ty = lerp(Z.ty, -0.7 + 1.4 * (x % 2.6 < 1.3 ? n : 1 - n), X), Z.hx = lerp(Z.hx, 0.1, X);
        } else if (W === "griddy") {
          let n = x * 10, X0 = Math.sin(n);
          Z.rsx = lerp(Z.rsx, -1.15 * Math.max(0, X0) + 0.3, X), Z.lsx = lerp(Z.lsx, -1.15 * Math.max(0, -X0) + 0.3, X), Z.rex = lerp(Z.rex, -1.3, X), Z.lex = lerp(Z.lex, -1.3, X), Z.tx = lerp(Z.tx, 0.28, X), Z.ltx = lerp(Z.ltx, -0.55 * Math.max(0, X0), X), Z.lkx = lerp(Z.lkx, 0.9 * Math.max(0, X0), X), Z.rtx = lerp(Z.rtx, -0.55 * Math.max(0, -X0), X), Z.rkx = lerp(Z.rkx, 0.9 * Math.max(0, -X0), X), Z.lift += 0.03 * Math.abs(X0) * X * this.standK, Z.hx = lerp(Z.hx, -0.1, X);
        } else if (W === "airguitar")
          Z.lsz = lerp(Z.lsz, 1.15, X), Z.lsx = lerp(Z.lsx, -0.95, X), Z.lex = lerp(Z.lex, -0.35, X), Z.rsx = lerp(Z.rsx, -0.55, X), Z.rsz = lerp(Z.rsz, 0.35, X), Z.rex = lerp(Z.rex, -1.55 + 0.4 * Math.sin(x * 24), X), Z.hx = lerp(Z.hx, 0.22 * Math.sin(x * 9), X), Z.tz = lerp(Z.tz, 0.08, X), Z.tx = lerp(Z.tx, 0.12, X);
        else if (W === "disco") {
          let n = x * 4.2, X0 = (Math.sin(n) + 1) / 2;
          Z.rsz = lerp(Z.rsz, lerp(-0.25, -2.55, X0), X), Z.rsx = lerp(Z.rsx, lerp(-0.6, -0.25, X0), X), Z.rex = lerp(Z.rex, 0, X), Z.lsz = lerp(Z.lsz, 0.55, X), Z.lsx = lerp(Z.lsx, 0.25, X), Z.lex = lerp(Z.lex, -1.5, X), Z.sway = lerp(Z.sway, 0.05 * Math.sin(n), X), Z.tz = lerp(Z.tz, -0.12 * (X0 - 0.5), X), Z.hz = lerp(Z.hz, 0.1 * (X0 - 0.5), X);
        } else if (W === "hypejump") {
          let n = Math.max(0, Math.sin(x * 6.5));
          Z.lsz = lerp(Z.lsz, 2.5 + 0.3 * n, X), Z.rsz = lerp(Z.rsz, -2.5 - 0.3 * n, X), Z.lsx = lerp(Z.lsx, -0.2, X), Z.rsx = lerp(Z.rsx, -0.2, X), Z.hx = lerp(Z.hx, -0.25, X), Z.lift += 0.3 * n * X * this.standK, Z.lkx = lerp(Z.lkx, 0.6 * n, X), Z.rkx = lerp(Z.rkx, 0.6 * n, X), Z.ltx = lerp(Z.ltx, -0.4 * n, X), Z.rtx = lerp(Z.rtx, -0.4 * n, X);
        } else if (W === "moneygun") {
          let n = Math.max(0, Math.sin(x * 14)) * 0.12;
          Z.rsx = lerp(Z.rsx, -1.5 + n, X), Z.rsz = lerp(Z.rsz, -0.25, X), Z.rex = lerp(Z.rex, -0.1, X), Z.lsx = lerp(Z.lsx, -1.45 - n, X), Z.lsz = lerp(Z.lsz, 0.25, X), Z.lex = lerp(Z.lex, -0.1, X), Z.hx = lerp(Z.hx, -0.05, X), Z.tx = lerp(Z.tx, -0.05, X);
        } else if (W === "micdrop") {
          let n = sstep(1.1, 1.3, x);
          Z.rsx = lerp(Z.rsx, lerp(-1.45, -0.85, n), X), Z.rsz = lerp(Z.rsz, -0.35, X), Z.rex = lerp(Z.rex, lerp(-0.45, -0.1, n), X), Z.hx = lerp(Z.hx, lerp(-0.1, 0.22, n), X), Z.lsz = lerp(Z.lsz, 0.4, X), Z.lex = lerp(Z.lex, -1.4, X), Z.lsx = lerp(Z.lsx, 0.2, X);
        } else if (W === "belt") {
          let n = Math.sin(x * 5) * 0.08;
          Z.lsz = lerp(Z.lsz, 2.55 + n, X), Z.rsz = lerp(Z.rsz, -2.55 - n, X), Z.lsx = lerp(Z.lsx, -0.35, X), Z.rsx = lerp(Z.rsx, -0.35, X), Z.lex = lerp(Z.lex, -0.95, X), Z.rex = lerp(Z.rex, -0.95, X), Z.lez = lerp(Z.lez, -0.4, X), Z.rez = lerp(Z.rez, 0.4, X), Z.hx = lerp(Z.hx, -0.28, X);
        } else if (W === "detonate") {
          let n = Math.exp(-Math.pow((x - 1.3) / 0.08, 2));
          Z.rsx = lerp(Z.rsx, -0.55, X), Z.rsz = lerp(Z.rsz, -2.3 + 0.06 * n, X), Z.rex = lerp(Z.rex, -1.3 - 0.12 * n, X), Z.rez = lerp(Z.rez, 0, X), Z.hx = lerp(Z.hx, -0.06, X), Z.tx = lerp(Z.tx, -0.04, X);
        } else if (W === "dizzy")
          Z.hx = lerp(Z.hx, Math.sin(x * 5.5) * 0.22, X), Z.hz = lerp(Z.hz, Math.cos(x * 5.5) * 0.22, X), Z.tz = lerp(Z.tz, Math.sin(x * 5.5) * 0.08, X), Z.sway = lerp(Z.sway, Math.cos(x * 5.5) * 0.04, X);
        else if (EXT.pose)
          EXT.pose(W, x, X, Z, this);
      }
      if (W === "spin" && X > 0)
        this.rig.rotation.y = this._spin || 0;
      else if (this.rig.rotation.y)
        this.rig.rotation.y = 0, this._spin = 0;
      let I = this.md, B = (1 - X) * (1 - clamp(this.pk || 0, 0, 1)) * (K ? 0 : 1), k = B * (Y || this.mode === "walk" || this.hand ? 0 : 1), z = I.hype * B, M = I.laugh * B, v = I.focus * B, g = I.fire * B, R__L = I.calm * B;
      if (k > 0) {
        let x = I.hype * k, n = I.laugh * k, X0 = I.focus * k, Z0 = I.fire * k, S = I.calm * k;
        if (x > 0)
          Z.tx -= 0.04 * x, Z.hx -= 0.05 * x, Z.hx += Math.sin(J * 6.2 + this.seed) * 0.035 * x * this.L;
        if (n > 0)
          Z.tx = lerp(Z.tx, -0.1 + Math.sin(J * 19) * 0.035, n), Z.hx = lerp(Z.hx, -0.24, n), Z.lsx = lerp(Z.lsx, -0.9, n), Z.lex = lerp(Z.lex, -1.7, n), Z.lsz = lerp(Z.lsz, 0.1, n), Z.rsx = lerp(Z.rsx, -0.42, n);
        if (X0 > 0)
          Z.tx += 0.07 * X0, Z.hx += 0.05 * X0 + Math.sin(J * 3.2 + this.seed) * 0.03 * X0 * this.L;
        if (Z0 > 0) {
          Z.tx += 0.05 * Z0, Z.hx += 0.07 * Z0;
          let m = Math.pow(Math.abs(Math.sin(J * 4.6 + this.seed)), 3), t = Z0 * Math.max(this.gest, 0.45);
          Z.rsx = lerp(Z.rsx, -1.12 + 0.4 * m, t), Z.rsz = lerp(Z.rsz, -0.3, t), Z.rex = lerp(Z.rex, -1.15 - 0.5 * m, t);
        }
        if (S > 0)
          Z.tx -= 0.04 * S, Z.hx += Math.sin(J * 1.8 + this.seed) * 0.035 * S;
        if (x > 0.5 && !this.pmp && J > this.pmpN)
          this.pmp = 0.001;
      }
      if (this.pmp) {
        this.pmp += $;
        let x = this.pmp;
        if (x > 1.15 || k <= 0)
          this.pmp = 0, this.pmpN = J + 4 + U() * 5;
        else {
          let n = sstep(0, 0.2, x) * (1 - sstep(0.9, 1.15, x)) * k, X0 = Math.abs(Math.sin(x * Math.PI * 2.6));
          Z.rsx = lerp(Z.rsx, -1.3 - 0.25 * X0, n), Z.rsz = lerp(Z.rsz, -0.5, n), Z.rex = lerp(Z.rex, -1.95 + 0.6 * X0, n), Z.hx = lerp(Z.hx, Z.hx - 0.08, n);
        }
      }
      if (K) {
        let x = clamp(this.tossF || 0, 0, 1), n = clamp(this.chuteK || 0, 0, 1), X0 = this.seed % 97, Z0 = Math.sin(J * 17 + X0), S = Math.sin(J * 14.3 + X0 * 0.7 + 1.3), m = Math.sin(J * 15.7 + X0 * 0.3), t = Math.sin(J * 15.7 + X0 * 0.3 + 3.1), d = { lsx: -0.4 + Z0 * 0.9, lsz: 1.9 + S * 0.7, lex: -0.5 + S * 0.4, rsx: -0.4 + S * 0.9, rsz: -1.9 - Z0 * 0.7, rex: -0.5 + Z0 * 0.4, ltx: -0.7 + m * 0.8, rtx: -0.7 + t * 0.8, lkx: 0.9 + t * 0.6, rkx: 0.9 + m * 0.6, hx: -0.25 + Z0 * 0.1, tx: -0.15, lift: 0, sway: 0 }, R0 = { lsx: -0.12, lsz: 2.8, lex: -0.25, rsx: -0.12, rsz: -2.8, rex: -0.25, ltx: -0.25 + m * 0.12, rtx: -0.25 + t * 0.12, lkx: 0.35 + t * 0.15, rkx: 0.35 + m * 0.15, hx: -0.32, tx: 0, lift: 0, sway: 0 }, y0 = Math.max(x, n);
        for (let M0 in d)
          Z[M0] = lerp(Z[M0], lerp(d[M0], R0[M0], n), y0);
      }
      let C = clamp(this.pk || 0, 0, 1);
      if (C > 0) {
        let x = plankPose(this.dip || 0);
        for (let n in x)
          Z[n] = lerp(Z[n], x[n], C);
      }
      if (this.hand && this.mode === "seated")
        Z.lsz = 2.95, Z.lsx = -0.15, Z.lex = -0.15, Z.lez = 0;
      let p = Q.cam, i = 0.25;
      if (Q.focusSpeaker && Q.focusSpeaker !== this)
        Q.focusSpeaker.headPos(this._w), p = this._w, i = 1;
      else if (E)
        p = Q.cam, i = 0.6;
      else if (this.idleK === "lookcam")
        p = Q.cam, i = 1;
      else if (F)
        p = null;
      if (K || C > 0.05)
        p = null;
      if (Q.shareStart && J - Q.shareStart < 2.4 && this.mode === "seated")
        this.lookBack = damp(this.lookBack, 1, 6, $);
      else
        this.lookBack = damp(this.lookBack, 0, 4, $);
      let e = 0, V0 = 0;
      if (p) {
        this.head.getWorldPosition(this._v);
        let x = p.x - this._v.x, n = p.y - this._v.y, X0 = p.z - this._v.z, Z0 = Math.atan2(x, X0) - this.root.rotation.y, S = Math.hypot(x, X0);
        e = clamp(Math.atan2(Math.sin(Z0), Math.cos(Z0)), -0.75, 0.75) * i, V0 = clamp(-Math.atan2(n, S), -0.3, 0.35) * i;
      }
      if (this.lookBack > 0.01)
        e = lerp(e, (this.seat && this.seat.x > 0 ? -1 : 1) * 1.35, this.lookBack), Z.ty += (this.seat && this.seat.x > 0 ? -1 : 1) * 0.45 * this.lookBack, V0 = lerp(V0, -0.2, this.lookBack);
      if (Z.hy += e, Z.hx += V0 * 0.85, Q.focusSpeaker && Q.focusSpeaker !== this && Q.focusSpeaker.talkT > 1.6)
        this.nod += $, Z.hx += Math.sin(this.nod * 6.5) * 0.045 * sstep(0, 1, Math.sin(this.nod * 0.7 + this.seed) * 0.5 + 0.5) * (1 - C);
      Z.hx += Math.sin(J * 7.3) * 0.035 * this.L, Z.hz += Math.sin(J * 3.1 + this.seed) * 0.04 * this.L;
      let l = this.P, A0 = Y ? 40 : C > 0 ? 26 : 13;
      for (let x in Z) {
        let n = Z[x];
        l[x] = l[x] === undefined ? n : damp(l[x], n, (x[1] === "t" || x[1] === "k") && Y ? 40 : A0, $);
      }
      if (this.hip.position.y = l.hip + l.lift, this.hip.position.x = l.sway, this.hip.position.z = l.hpz, this.torso.rotation.set(l.tx, l.ty, l.tz), this.headP.rotation.set(l.hx, l.hy, l.hz, "YXZ"), this.sh[0].rotation.set(l.lsx, 0, l.lsz), this.el[0].rotation.set(l.lex, 0, l.lez), this.sh[1].rotation.set(l.rsx, 0, l.rsz), this.el[1].rotation.set(l.rex, 0, l.rez), this.th[0].rotation.x = l.ltx, this.kn[0].rotation.x = l.lkx, this.th[1].rotation.x = l.rtx, this.kn[1].rotation.x = l.rkx, this.th[0].rotation.z = l.ltz, this.th[1].rotation.z = l.rtz, this.blinkT -= $, this.blinkT <= 0) {
        if (this.blink = 0.14, this.blinkT = 1.8 + U() * 4.2, U() < 0.18)
          this.blinkT = 0.25;
      }
      let J0 = 0;
      if (this.blink > 0)
        this.blink -= $, J0 = Math.sin(Math.max(0, this.blink) / 0.14 * Math.PI);
      let T0 = W === "cheer" || W === "laugh" || W === "bell" || W === "dance" || HAPPYE.has(W) ? X : 0, L0 = K ? 1.18 : Math.max(0.12, 1 - 0.9 * J0 - 0.55 * T0 - 0.38 * z - 0.55 * M - 0.24 * v - 0.34 * g - 0.2 * R__L);
      this.eyes.forEach((x) => {
        x.scale.y = 0.048 * Math.max(0.08, L0);
      }), this.hl.forEach((x) => x.visible = L0 > 0.4);
      let G0 = clamp(e * 0.02, -0.014, 0.014), $0 = clamp(-V0 * 0.02, -0.01, 0.01);
      if (this._by = 0.012 * this.L + 0.012 * T0 - (this.L < 0.05 && F ? 0.004 : 0), this._br = -0.12 * this.L * Math.sin(J * 2.3), C > 0)
        this._by -= 0.012 * C, this._br += 0.2 * C;
      if (W === "detonate")
        this._by -= 0.012 * X, this._br -= 0.3 * X;
      this._by += 0.02 * z + 0.01 * M - 0.009 * v - 0.02 * g + 0.002 * R__L, this._br += -0.13 * v - 0.34 * g + 0.06 * z, this.gz.x = damp(this.gz.x, G0, 10, $), this.gz.y = damp(this.gz.y, $0, 10, $), this.placeFace(this.gz.x, this.gz.y);
      let j = clamp((this.L - 0.05) / 0.55, 0, 1);
      j = Math.pow(j, 0.8);
      let u = 0.05 * (0.86 + 0.3 * this.hf - 0.12 * j), Q0 = 0.006 + 0.075 * j, K0 = 0.55 - 0.2 * j;
      if (W === "laugh") {
        let x = X;
        Q0 = lerp(Q0, 0.07 + 0.015 * Math.sin(V.t * 22), x), u = lerp(u, 0.058, x), K0 = lerp(K0, 1, x);
      } else if (T0 > 0)
        Q0 = lerp(Q0, 0.055, T0), u = lerp(u, 0.06, T0), K0 = lerp(K0, 1.1, T0);
      else if (W === "detonate")
        K0 = lerp(K0, 1.3, X), u = lerp(u, 0.064, X), Q0 = Math.max(Q0, 0.028 * X);
      else if (W === "wave" || W === "clap" || W === "fire" || W === "money")
        K0 = lerp(K0, 1.05, X), Q0 = Math.max(Q0, 0.02 * X);
      if (j < 0.02 && !T0)
        K0 = 0.85;
      if (B > 0) {
        if (K0 = lerp(K0, 1.2, z), u += 0.009 * z, Q0 = Math.max(Q0, 0.026 * z), K0 = lerp(K0, 0.45, v * (1 - j)), u *= 1 - 0.06 * v, K0 = lerp(K0, -0.45, g), u = lerp(u, 0.053, g * 0.6), K0 = lerp(K0, 1, R__L), M > 0)
          Q0 = lerp(Q0, 0.058 + 0.016 * Math.sin(J * 21), M), u = lerp(u, 0.058, M), K0 = lerp(K0, 1.05, M);
      }
      if (K) {
        let x = clamp(this.chuteK || 0, 0, 1);
        Q0 = lerp(0.078, 0.02, x), u = lerp(0.046, 0.056, x), K0 = lerp(0.5, 1.05, x);
      }
      if (C > 0) {
        let x = clamp(this.thx || 0, 0, 1);
        u = lerp(u, 0.044 + 0.012 * x, C), Q0 = lerp(Q0, 0.008 + 0.05 * x, C), K0 = lerp(K0, 0.35 - 0.25 * x, C);
      }
      if (this.mouth.set(u, Q0, K0), this.cup && this.cup.length) {
        let x = Y ? 1 : 0;
        for (let n of this.cup)
          n(J, x);
      }
      if (this.auraUp)
        this.auraUp(J, $, this.muted ? 0 : this.L);
      let N0 = this.micMat.color;
      if (this.muted)
        N0.setRGB(1.6, 0.12, 0.15);
      else if (this.L > 0.12)
        N0.setRGB(0.25, 2.2, 0.7);
      else
        N0.setRGB(0.15, 0.4, 0.25);
    }
  dispose(){this.disposeRig()}
}
function mergeAll(gs){const pos=[],nor=[],uv=[],idx=[];let o=0;gs.forEach(g=>{const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;for(let i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));nor.push(n.getX(i),n.getY(i),n.getZ(i));uv.push(u.getX(i),u.getY(i))}const ix=g.index.array;for(let i=0;i<ix.length;i++)idx.push(ix[i]+o);o+=p.count});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);return g}

export {ACC, Avatar, HAIRC, HAIRS, OUTC_ALL, PANTS, SKIN, lookCode, parseLook};
