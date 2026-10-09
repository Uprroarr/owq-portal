// Graphics engine for the world outside the Sales Floor: GPU-baked PBR surface textures (albedo, normal, AO/roughness/
// metalness), a material library, a night-city reflection map, soft particles (smoke, sparks, flames), light pools, a
// stadium crowd, geometry sweeps along a path, and the graphics quality setting (Auto / High / Medium / Low).
import * as THREE from 'three';
import {mergeGeometries} from '../three/examples/jsm/utils/BufferGeometryUtils.js';
import {cv} from './tex.js';

// ---------------------------------------------------------------- quality
const QK = 'owq_gfx';
export const GFX = {r: null, aniso: 8, level: 'high', pref: 'auto', baker: null, mats: {}, env: null, t: 0, onLevel: []};
export function gfxPref() { try { const v = localStorage.getItem(QK); return v === 'high' || v === 'medium' || v === 'low' ? v : 'auto'; } catch (e) { return 'auto'; } }
function autoLevel() {
  const ua = (globalThis.navigator && navigator.userAgent) || '', mob = /Mobi|Android|iPhone|iPad/i.test(ua);
  const cores = (globalThis.navigator && navigator.hardwareConcurrency) || 4;
  if (mob) return cores >= 8 ? 'medium' : 'low';
  return cores >= 4 ? 'high' : 'medium';
}
export function gfxLevel() { return GFX.pref === 'auto' ? GFX.auto || (GFX.auto = autoLevel()) : GFX.pref; }
export function setGfxPref(v) {
  GFX.pref = v === 'high' || v === 'medium' || v === 'low' ? v : 'auto';
  try { localStorage.setItem(QK, GFX.pref); } catch (e) {}
  GFX.level = gfxLevel(); GFX.onLevel.forEach(f => { try { f(GFX.level); } catch (e) {} });
}
// the automatic setting steps down when frames run long (called by the frame governor)
export function gfxStepDown() { if (GFX.pref !== 'auto') return false; const L = GFX.auto || 'high'; const n = L === 'high' ? 'medium' : L === 'medium' ? 'low' : null; if (!n) return false; GFX.auto = n; GFX.level = n; GFX.onLevel.forEach(f => { try { f(n); } catch (e) {} }); return true; }
export const TEXSIZE = () => ({high: 1024, medium: 512, low: 256})[GFX.level] || 512;

export function initGfx(renderer) {
  if (GFX.r === renderer) return GFX;
  GFX.r = renderer; GFX.pref = gfxPref(); GFX.level = gfxLevel();
  try { GFX.aniso = Math.min(16, renderer.capabilities.getMaxAnisotropy() || 4); } catch (e) { GFX.aniso = 4; }
  GFX.baker = new Baker(renderer); GFX.mats = {};
  return GFX;
}

// ---------------------------------------------------------------- tileable noise (GLSL)
export const NOISE = `
float h12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
vec2 h22(vec2 p){vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));p3+=dot(p3,p3.yzx+33.33);return fract((p3.xx+p3.yz)*p3.zy);}
float vn(vec2 p,vec2 P){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  float a=h12(mod(i,P)),b=h12(mod(i+vec2(1.,0.),P)),c=h12(mod(i+vec2(0.,1.),P)),d=h12(mod(i+vec2(1.,1.),P));
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}
float fbm(vec2 p,vec2 P,int o){float s=0.,a=.5,n=0.;for(int i=0;i<7;i++){if(i>=o)break;s+=a*vn(p,P);n+=a;p*=2.;P*=2.;a*=.5;}return s/n;}
vec3 wor(vec2 p,vec2 P){vec2 i=floor(p),f=fract(p);float d1=9.,d2=9.,id=0.;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y));vec2 c=mod(i+g,P);vec2 o=h22(c);vec2 r=g+o-f;float d=dot(r,r);
    if(d<d1){d2=d1;d1=d;id=h12(c+17.31);}else if(d<d2)d2=d;}
  return vec3(sqrt(d1),sqrt(d2),id);}
`;

// surface recipes: H = height (for the normal map), A = albedo (linear), R = (ao, roughness, metalness)
const RECIPES = {
  asphalt: {ns: .0055, glsl: `
float H(vec2 uv){vec3 w=wor(uv*56.,vec2(56.));float st=smoothstep(.62,.16,w.x)*(.55+.45*w.z);return st*.75+fbm(uv*24.,vec2(24.),3)*.25;}
vec3 A(vec2 uv){vec3 w=wor(uv*56.,vec2(56.));float st=smoothstep(.55,.14,w.x);vec3 base=vec3(.03,.031,.035);
  vec3 stone=mix(vec3(.05,.05,.054),vec3(.14,.135,.13),w.z);vec3 c=mix(base,stone,st*.85);
  c*=.74+.52*fbm(uv*4.,vec2(4.),5);c*=.9+.2*vn(uv*512.,vec2(512.));return c;}
vec3 R(vec2 uv){float wet=smoothstep(.55,.74,fbm(uv*3.+.37,vec2(3.),4));float st=smoothstep(.55,.14,wor(uv*56.,vec2(56.)).x);
  float r=mix(.88,.64,st);r=mix(r,.3,wet*.7);return vec3(1.-.25*(1.-st),r,0.);}`},
  concrete: {ns: .003, glsl: `
float H(vec2 uv){float p=smoothstep(.08,.0,wor(uv*96.,vec2(96.)).x);return fbm(uv*8.,vec2(8.),5)*.6-p*.4;}
vec3 A(vec2 uv){float f=fbm(uv*4.,vec2(4.),5);float st=smoothstep(.45,.8,fbm(uv*2.+.5,vec2(2.),4));vec3 c=mix(vec3(.30,.30,.31),vec3(.41,.40,.39),f);
  c*=1.-.28*st;c*=1.-.4*smoothstep(.07,.0,wor(uv*96.,vec2(96.)).x);c*=.92+.16*vn(uv*400.,vec2(400.));return c;}
vec3 R(vec2 uv){return vec3(1.-.3*smoothstep(.07,.0,wor(uv*96.,vec2(96.)).x),.8+.14*fbm(uv*6.,vec2(6.),4),0.);}`},
  polished: {ns: .0012, glsl: `
float H(vec2 uv){return fbm(uv*6.,vec2(6.),4)*.5+vn(uv*300.,vec2(300.))*.5;}
vec3 A(vec2 uv){float f=fbm(uv*3.,vec2(3.),5),s=fbm(uv*vec2(1.,8.)+.3,vec2(1.,8.),4);vec3 c=mix(vec3(.16,.16,.17),vec3(.25,.245,.24),f);c*=.9+.2*s;
  vec2 g=fract(uv*2.);float j=step(min(min(g.x,1.-g.x),min(g.y,1.-g.y)),.003);return c*(1.-.5*j);}
vec3 R(vec2 uv){return vec3(1.,.22+.22*fbm(uv*5.,vec2(5.),4),0.);}`},
  metal: {ns: .004, glsl: `
float seam(vec2 uv){vec2 g=fract(uv*vec2(2.,4.));return min(min(g.x,1.-g.x)/2.,min(g.y,1.-g.y)/4.);}
float H(vec2 uv){float s=smoothstep(0.,.012,seam(uv));vec2 rv=fract(uv*16.);float riv=smoothstep(.13,.07,length(rv-.5))*step(seam(uv),.02);
  return s*.8+riv*.35+vn(vec2(uv.x*512.,uv.y*8.),vec2(512.,8.))*.05;}
vec3 A(vec2 uv){float b=vn(vec2(uv.x*600.,uv.y*6.),vec2(600.,6.));vec3 c=vec3(.52)*(.86+.2*b);c*=.82+.3*fbm(uv*3.,vec2(3.),4);return c;}
vec3 R(vec2 uv){float b=vn(vec2(uv.x*600.,uv.y*6.),vec2(600.,6.));return vec3(1.-.3*(1.-smoothstep(0.,.012,seam(uv))),.3+.18*b+.15*fbm(uv*2.,vec2(2.),4),1.);}`},
  corrugated: {ns: .006, glsl: `
float H(vec2 uv){return (.5+.5*sin(uv.x*6.2831853*20.))*.85+fbm(uv*6.,vec2(6.),4)*.15;}
vec3 A(vec2 uv){vec3 c=vec3(.55)*(.8+.3*fbm(uv*vec2(4.,8.),vec2(4.,8.),5));c*=.9+.15*vn(vec2(uv.x*20.,uv.y*220.),vec2(20.,220.));return c;}
vec3 R(vec2 uv){return vec3(.85+.15*sin(uv.x*6.2831853*20.),.38+.2*fbm(uv*vec2(8.,4.),vec2(8.,4.),4),.85);}`},
  grass: {ns: .0035, glsl: `
float H(vec2 uv){return vn(uv*256.,vec2(256.))*.5+vn(uv*vec2(512.,170.),vec2(512.,170.))*.5;}
vec3 A(vec2 uv){float b=vn(uv*256.,vec2(256.)),f=fbm(uv*8.,vec2(8.),4);vec3 g=mix(vec3(.03,.085,.022),vec3(.075,.17,.04),b);g*=.8+.4*f;
  float dead=smoothstep(.66,.86,fbm(uv*3.+.2,vec2(3.),4));return mix(g,vec3(.12,.12,.05),dead*.28);}
vec3 R(vec2 uv){return vec3(.85+.15*vn(uv*256.,vec2(256.)),.93,0.);}`},
  clay: {ns: .004, glsl: `
float H(vec2 uv){return fbm(uv*48.,vec2(48.),4)*.5+smoothstep(.15,.0,wor(uv*120.,vec2(120.)).x)*.5;}
vec3 A(vec2 uv){vec3 c=mix(vec3(.30,.13,.06),vec3(.43,.20,.10),fbm(uv*12.,vec2(12.),5));c*=.85+.3*vn(uv*700.,vec2(700.));
  return mix(c,vec3(.5,.42,.36),smoothstep(.14,.0,wor(uv*120.,vec2(120.)).x)*.5);}
vec3 R(vec2 uv){return vec3(1.,.96,0.);}`},
  wood: {ns: .004, glsl: `
float H(vec2 uv){float pl=fract(uv.y*6.);return smoothstep(0.,.03,pl)*smoothstep(1.,.97,pl)*.8+vn(vec2(uv.x*6.,uv.y*240.),vec2(6.,240.))*.2;}
vec3 A(vec2 uv){float row=floor(uv.y*6.),tone=h12(vec2(row,3.));float gr=fbm(vec2(uv.x*3.,uv.y*120.+row*13.),vec2(3.,120.),4);
  vec3 c=mix(vec3(.26,.15,.065),vec3(.44,.27,.12),tone);c*=.72+.5*gr;float pl=fract(uv.y*6.);return c*mix(.35,1.,smoothstep(0.,.03,pl)*smoothstep(1.,.97,pl));}
vec3 R(vec2 uv){return vec3(1.,.74,0.);}`},
  carpet: {ns: .002, glsl: `
float H(vec2 uv){return vn(uv*600.,vec2(600.))*.6+vn(uv*150.,vec2(150.))*.4;}
vec3 A(vec2 uv){float tile=h12(floor(uv*4.));vec3 c=mix(vec3(.045,.05,.065),vec3(.075,.08,.095),tile);c*=.8+.4*vn(uv*600.,vec2(600.));
  vec2 g=fract(uv*4.);return c*(1.-.4*step(min(min(g.x,1.-g.x),min(g.y,1.-g.y)),.006));}
vec3 R(vec2 uv){return vec3(1.,.97,0.);}`},
  container: {ns: .007, glsl: `
float H(vec2 uv){float k=fract(uv.x*10.);return smoothstep(.0,.14,k)*smoothstep(.52,.36,k)*.82+fbm(uv*vec2(5.,3.),vec2(5.,3.),4)*.12;}
vec3 A(vec2 uv){float rust=smoothstep(.62,.84,fbm(uv*vec2(6.,4.),vec2(6.,4.),5));vec3 c=vec3(.62)*(.85+.25*fbm(uv*2.,vec2(2.),4));return mix(c,vec3(.3,.13,.05),rust*.6);}
vec3 R(vec2 uv){float rust=smoothstep(.62,.84,fbm(uv*vec2(6.,4.),vec2(6.,4.),5));return vec3(1.,mix(.42,.88,rust),mix(.55,.1,rust));}`},
  rubber: {ns: .003, glsl: `
float H(vec2 uv){return vn(uv*300.,vec2(300.))*.6+fbm(uv*20.,vec2(20.),3)*.4;}
vec3 A(vec2 uv){return vec3(.035)*(.8+.4*vn(uv*300.,vec2(300.)));}
vec3 R(vec2 uv){return vec3(1.,.9,0.);}`},
};

const BAKE_VS = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
export class Baker {
  constructor(r) { this.r = r; this.scene = new THREE.Scene(); this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); this.quad.frustumCulled = false; this.scene.add(this.quad); this.cache = {}; }
  // render a fragment shader (outputs linear colour) into a texture
  run(size, frag, uniforms, srgb, mips = true) {
    const rt = new THREE.WebGLRenderTarget(size, size, {generateMipmaps: mips, minFilter: mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter, magFilter: THREE.LinearFilter,
      wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, depthBuffer: false, colorSpace: srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace, anisotropy: GFX.aniso});
    const m = new THREE.ShaderMaterial({vertexShader: BAKE_VS, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false});
    this.quad.material = m;
    const r = this.r, prev = r.getRenderTarget(), ac = r.autoClear, tm = r.toneMapping; r.toneMapping = THREE.NoToneMapping; r.autoClear = true;
    r.setRenderTarget(rt); r.render(this.scene, this.cam); r.setRenderTarget(prev); r.autoClear = ac; r.toneMapping = tm;
    m.dispose(); return rt.texture;
  }
  // albedo, normal and AO/roughness/metal maps for one recipe
  set(name, size) {
    const k = name + size; if (this.cache[k]) return this.cache[k];
    const R = RECIPES[name]; if (!R) return null;
    const frag = mode => `precision highp float;varying vec2 vUv;uniform float uSize,uNS;${NOISE}${R.glsl}
void main(){vec2 uv=vUv;
${mode === 0 ? 'gl_FragColor=vec4(A(uv),1.);' : mode === 1 ? 'float e=1./uSize;float h0=H(uv),hx=H(fract(uv+vec2(e,0.))),hy=H(fract(uv+vec2(0.,e)));vec3 n=normalize(vec3((h0-hx)*uSize*uNS,(h0-hy)*uSize*uNS,1.));gl_FragColor=vec4(n*.5+.5,1.);' : 'gl_FragColor=vec4(R(uv),1.);'}}`;
    const U = () => ({uSize: {value: size}, uNS: {value: R.ns}});
    const out = {map: this.run(size, frag(0), U(), true), normalMap: this.run(size, frag(1), U(), false), orm: this.run(size, frag(2), U(), false)};
    this.cache[k] = out; return out;
  }
}

// ---------------------------------------------------------------- materials
// mat('asphalt', {color, rough, metal, bump, ...}) -> MeshStandardMaterial (cached by name + key). The baked textures
// are render targets shared by every material of that kind, so tiling comes from the geometry's uvs (in tiles).
export function mat(name, o = {}) {
  const key = name + '|' + (o.key || '') + '|' + GFX.level;
  if (GFX.mats[key]) return GFX.mats[key];
  const set = GFX.baker ? GFX.baker.set(name, TEXSIZE()) : null;
  const P = Object.assign({color: o.color || '#ffffff', roughness: o.rough ?? 1, metalness: o.metal ?? (name === 'metal' || name === 'corrugated' || name === 'container' ? 1 : 0), envMapIntensity: o.env ?? 1}, o.extra || {});
  const M = o.physical ? new THREE.MeshPhysicalMaterial(P) : new THREE.MeshStandardMaterial(P);
  if (set) {
    M.map = o.noMap ? null : set.map; M.normalMap = set.normalMap; M.normalScale = new THREE.Vector2(o.bump ?? 1, o.bump ?? 1);
    M.roughnessMap = set.orm; M.metalnessMap = o.metalMap === false ? null : set.orm; M.aoMap = o.ao === false ? null : set.orm; M.aoMapIntensity = o.aoK ?? .8;
  }
  if (o.emissive) { M.emissive = new THREE.Color(o.emissive); M.emissiveIntensity = o.ei ?? 1; }
  M.name = 'gfx:' + name;
  GFX.mats[key] = M; return M;
}

// a material whose shader computes markings / patterns from a custom attribute (aTrk = metres along, across)
// hooks: {uniforms, vert (vertex body, after begin_vertex), fragHead, frag (after map_fragment: may change diffuseColor,
// and set the float rk to scale roughness), key}
export function patch(M, h) {
  const U = h.uniforms || {};
  M.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aTrk;varying vec2 vTrk;varying vec3 vWP;' + (h.vertHead || ''))
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTrk=aTrk;vWP=(modelMatrix*vec4(transformed,1.)).xyz;' + (h.vert || ''));
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vTrk;varying vec3 vWP;float rk=1.;float ek=0.;vec3 eC=vec3(0.);' + NOISE + (h.fragHead || ''))
      .replace('#include <map_fragment>', '#include <map_fragment>\n' + (h.frag || ''))
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor*=rk;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=eC*ek;');
  };
  M.customProgramCacheKey = () => 'owqp:' + (h.key || 'x');
  M.userData.U = U;
  return M;
}

// ---------------------------------------------------------------- night-city reflections
export function nightEnv(r) {
  if (GFX.env) return GFX.env;
  const sc = new THREE.Scene();
  const m = new THREE.ShaderMaterial({side: THREE.BackSide, depthWrite: false, vertexShader: 'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 vD;float h(float x){return fract(sin(x*127.1)*43758.5453);}
void main(){float y=vD.y;vec3 zen=vec3(.008,.01,.035),hor=vec3(.30,.07,.14),gnd=vec3(.025,.018,.03);
  vec3 c=mix(hor,zen,smoothstep(0.,.55,y));c=mix(gnd,c,smoothstep(-.14,0.,y));
  float a=atan(vD.z,vD.x)*40.;float band=exp(-abs(y+.015)*26.);float s1=pow(h(floor(a)),6.),s2=pow(h(floor(a*3.1)+7.),10.);
  c+=band*(vec3(1.,.55,.28)*1.1+vec3(1.,.75,.45)*s1*4.+vec3(.45,.65,1.)*s2*6.);
  c+=exp(-abs(y-.06)*8.)*vec3(.5,.08,.2)*.35;
  vec3 md=normalize(vec3(-.42,.52,-.74));float mo=max(0.,dot(vD,md));c+=vec3(1.,.95,.9)*(pow(mo,1200.)*60.+pow(mo,40.)*.25);
  gl_FragColor=vec4(c,1.);}`});
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(100, 64, 32), m));
  // a few big soft panels for crisp highlights (billboards, floodlights)
  const pm = new THREE.MeshBasicMaterial({color: new THREE.Color(6, 5.4, 4.6), side: THREE.DoubleSide});
  [[60, 30, 40], [-70, 26, 20], [10, 40, -80], [-30, 55, 60]].forEach(([x, y, z]) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), pm); q.position.set(x, y, z); q.lookAt(0, 0, 0); sc.add(q); });
  const g = new THREE.PMREMGenerator(r); const rt = g.fromScene(sc, .025, .1, 1000); g.dispose(); sc.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  GFX.env = rt.texture; return GFX.env;
}

// ---------------------------------------------------------------- canvas sprites
function radial(stops, S = 128) { const c = cv(S, S), x = c.getContext('2d'), g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); stops.forEach(([o, col]) => g.addColorStop(o, col)); x.fillStyle = g; x.fillRect(0, 0, S, S); return c; }
let _poolT = null, _glowT = null, _smokeT = null;
export function poolTex() { if (!_poolT) { _poolT = new THREE.CanvasTexture(radial([[0, 'rgba(255,255,255,1)'], [.25, 'rgba(255,255,255,.55)'], [.6, 'rgba(255,255,255,.14)'], [1, 'rgba(255,255,255,0)']], 256)); _poolT.colorSpace = THREE.SRGBColorSpace; } return _poolT; }
export function glowTex() { if (!_glowT) { _glowT = new THREE.CanvasTexture(radial([[0, 'rgba(255,255,255,1)'], [.12, 'rgba(255,255,255,.85)'], [.35, 'rgba(255,255,255,.25)'], [1, 'rgba(255,255,255,0)']])); _glowT.colorSpace = THREE.SRGBColorSpace; } return _glowT; }
export function smokeTex() {
  if (_smokeT) return _smokeT;
  const S = 128, c = cv(S, S), x = c.getContext('2d');
  for (let i = 0; i < 26; i++) { const a = Math.random() * 6.283, d = Math.random() * S * .22, r = S * (.14 + Math.random() * .2), px = S / 2 + Math.cos(a) * d, py = S / 2 + Math.sin(a) * d;
    const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(255,255,255,.16)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S); }
  _smokeT = new THREE.CanvasTexture(c); _smokeT.colorSpace = THREE.SRGBColorSpace; return _smokeT;
}

// glowing lamp heads / runway lights as camera-facing sprites (one draw call): pts = [[x,y,z,size,r,g,b], ...]
export function glowPoints(parent, pts, o = {}) {
  const g = new THREE.BufferGeometry(), P = [], C = [], S = [];
  pts.forEach(p => { P.push(p[0], p[1], p[2]); S.push(p[3]); C.push(p[4], p[5], p[6]); });
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('sz', new THREE.Float32BufferAttribute(S, 1));
  const m = new THREE.ShaderMaterial({transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: {uMap: {value: glowTex()}, uPx: {value: 600}, uT: {value: 0}, uBl: {value: o.blink || 0}},
    vertexShader: `attribute float sz;varying vec3 vC;uniform float uPx,uT,uBl;void main(){vC=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
      float bl=uBl>0.?step(.5,fract(uT*uBl+position.x*.013+position.z*.007)):1.;gl_PointSize=clamp(sz*uPx/-mv.z,1.5,180.)*bl;}`,
    fragmentShader: 'uniform sampler2D uMap;varying vec3 vC;void main(){vec4 t=texture2D(uMap,gl_PointCoord);gl_FragColor=vec4(vC*t.a,t.a);}', vertexColors: true});
  const pm = new THREE.Points(g, m); pm.frustumCulled = false; pm.renderOrder = 2; parent.add(pm); pm.userData.mat = m; return pm;
}

// pools of light on the ground under lamps (additive decals, one draw call): list = [[x,y,z,radius,r,g,b], ...]
export function lightPools(parent, list) {
  const n = list.length; if (!n) return null;
  const m = new THREE.MeshBasicMaterial({map: poolTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, toneMapped: true});
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), m, n), M4 = new THREE.Matrix4(), c = new THREE.Color();
  list.forEach((p, i) => { M4.makeScale(p[3] * 2, 1, p[3] * 2); M4.setPosition(p[0], p[1] + .02, p[2]); im.setMatrixAt(i, M4); c.setRGB(p[4], p[5], p[6]); im.setColorAt(i, c); });
  im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.renderOrder = 1; parent.add(im); return im;
}

// ---------------------------------------------------------------- particles: smoke, dust (alpha) and sparks, flames (additive)
export class Particles {
  constructor(parent, N = 700) { this.N = N; this.A = this.pool(parent, N, false); this.B = this.pool(parent, N, true); }
  pool(parent, N, add) {
    const g = new THREE.InstancedBufferGeometry(); const base = new THREE.PlaneGeometry(1, 1);
    g.setIndex(base.index); g.setAttribute('position', base.getAttribute('position')); g.setAttribute('uv', base.getAttribute('uv'));
    const iP = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3), iC = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4), iS = new THREE.InstancedBufferAttribute(new Float32Array(N * 2), 2), iV = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    [iP, iC, iS, iV].forEach(a => a.setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('iP', iP); g.setAttribute('iC', iC); g.setAttribute('iS', iS); g.setAttribute('iV', iV); g.instanceCount = 0;
    const m = new THREE.ShaderMaterial({transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: {uMap: {value: add ? glowTex() : smokeTex()}},
      vertexShader: `attribute vec3 iP;attribute vec4 iC;attribute vec2 iS;attribute vec3 iV;varying vec4 vC;varying vec2 vUv;
void main(){vUv=uv;vC=iC;vec4 mv=modelViewMatrix*vec4(iP,1.);vec2 q=position.xy*iS.x;float c=cos(iS.y),s=sin(iS.y);q=vec2(c*q.x-s*q.y,s*q.x+c*q.y);
  vec3 vv=(modelViewMatrix*vec4(iV,0.)).xyz;float L=length(vv.xy);if(L>.5){vec2 d=vv.xy/L,n=vec2(-d.y,d.x);q=d*position.y*(iS.x+L*.035)+n*position.x*iS.x*.4;}
  mv.xy+=q;gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform sampler2D uMap;varying vec4 vC;varying vec2 vUv;void main(){vec4 t=texture2D(uMap,vUv);float a=t.a*vC.a;gl_FragColor=vec4(vC.rgb*${add ? 'a' : '1.'},a);}`});
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = add ? 6 : 5; parent.add(mesh);
    return {mesh, g, iP, iC, iS, iV, P: [], N};
  }
  // kind: 'smoke' | 'dust' | 'spark' | 'flame' | 'glow'
  emit(kind, x, y, z, vx = 0, vy = 0, vz = 0, o = {}) {
    const add = kind === 'spark' || kind === 'flame' || kind === 'glow', pool = add ? this.B : this.A; if (pool.P.length >= pool.N) pool.P.shift();
    const life = o.life ?? (kind === 'spark' ? .35 + Math.random() * .4 : kind === 'flame' ? .25 + Math.random() * .2 : kind === 'glow' ? .5 : 1.2 + Math.random() * 1.2);
    const col = o.col || (kind === 'spark' ? [3.2, 1.8, .6] : kind === 'flame' ? [3, 1.2, .35] : kind === 'glow' ? [1, 1, 1] : kind === 'dust' ? [.42, .36, .3] : [.55, .55, .58]);
    pool.P.push({x, y, z, vx, vy, vz, t: 0, life, s0: o.s0 ?? (kind === 'spark' ? .05 : kind === 'flame' ? .5 : kind === 'smoke' ? .6 : .4), s1: o.s1 ?? (kind === 'spark' ? .03 : kind === 'flame' ? .15 : kind === 'smoke' ? 3.2 : 1.6),
      a0: o.a ?? (kind === 'smoke' ? .5 : kind === 'dust' ? .45 : 1), g: o.g ?? (kind === 'spark' ? 9.8 : kind === 'smoke' ? -.6 : kind === 'flame' ? -1 : 0), drag: o.drag ?? (kind === 'spark' ? .4 : 1.6), col, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 1.5, st: kind === 'spark'});
  }
  update(dt) { this.step(this.A, dt); this.step(this.B, dt); }
  step(pl, dt) {
    const P = pl.P; let w = 0;
    for (let i = 0; i < P.length; i++) {
      const p = P[i]; p.t += dt; if (p.t >= p.life) continue;
      const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; p.vz *= k; p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.vr * dt;
      const f = p.t / p.life, sz = p.s0 + (p.s1 - p.s0) * f, a = p.a0 * (f < .15 ? f / .15 : 1 - (f - .15) / .85);
      pl.iP.array[w * 3] = p.x; pl.iP.array[w * 3 + 1] = p.y; pl.iP.array[w * 3 + 2] = p.z;
      pl.iC.array[w * 4] = p.col[0]; pl.iC.array[w * 4 + 1] = p.col[1]; pl.iC.array[w * 4 + 2] = p.col[2]; pl.iC.array[w * 4 + 3] = Math.max(0, a);
      pl.iS.array[w * 2] = sz; pl.iS.array[w * 2 + 1] = p.rot;
      pl.iV.array[w * 3] = p.st ? p.vx : 0; pl.iV.array[w * 3 + 1] = p.st ? p.vy : 0; pl.iV.array[w * 3 + 2] = p.st ? p.vz : 0;
      P[w++] = p;
    }
    P.length = w; pl.g.instanceCount = w;
    if (w) { pl.iP.needsUpdate = pl.iC.needsUpdate = pl.iS.needsUpdate = pl.iV.needsUpdate = true; pl.iP.clearUpdateRanges(); pl.iC.clearUpdateRanges(); pl.iS.clearUpdateRanges(); pl.iV.clearUpdateRanges(); pl.iP.addUpdateRange(0, w * 3); pl.iC.addUpdateRange(0, w * 4); pl.iS.addUpdateRange(0, w * 2); pl.iV.addUpdateRange(0, w * 3); }
  }
}

// ---------------------------------------------------------------- crowd (instanced fans that bounce and cheer)
export function crowd(parent, seats, o = {}) {
  // seats = [[x,y,z,facingYaw], ...]; one low-poly fan per seat (body, head, arms)
  const n = seats.length; if (!n) return null;
  const body = new THREE.CylinderGeometry(.17, .2, .55, 7).translate(0, .3, 0), head = new THREE.SphereGeometry(.13, 8, 6).translate(0, .72, 0);
  const armL = new THREE.BoxGeometry(.07, .4, .07).translate(-.22, .62, 0), armR = new THREE.BoxGeometry(.07, .4, .07).translate(.22, .62, 0);
  const mark = (g, v) => { const a = new Float32Array(g.getAttribute('position').count).fill(v); g.setAttribute('arm', new THREE.BufferAttribute(a, 1)); return g; };
  const geo = mergeGeometries([mark(body, 0), mark(head, 0), mark(armL, 1), mark(armR, 1)]);
  const ph = new Float32Array(n), sk = new Float32Array(n * 3), M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), cl = new THREE.Color();
  const shirts = o.colors || ['#ff1f4f', '#ffffff', '#1b1b22', '#ff1f4f', '#ffd166', '#4cc9f0', '#ff1f4f', '#2a2a33'], skins = ['#f1c6a5', '#d9a07a', '#a8714c', '#6e4a33', '#f5d3b8'];
  const m = new THREE.MeshStandardMaterial({roughness: .8, metalness: 0});
  const U = {uT: {value: 0}, uCheer: {value: 0}};
  m.onBeforeCompile = s => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute float arm;attribute float iPh;attribute vec3 iSkin;uniform float uT,uCheer;varying vec3 vSkin;varying float vHead;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float ch=clamp(uCheer,0.,1.);float b=sin(uT*(3.+ch*7.)+iPh*6.2831)*(.025+.09*ch);transformed.y+=max(0.,b);
        if(arm>.5){float up=ch*(.7+.3*sin(uT*9.+iPh*5.));transformed.y+=up*.32;transformed.x*=1.-up*.35;}
        vSkin=iSkin;vHead=step(.6,position.y)*(1.-arm);`);
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vSkin;varying float vHead;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vSkin,vHead);');
  };
  m.customProgramCacheKey = () => 'owqcrowd';
  const im = new THREE.InstancedMesh(geo, m, n);
  seats.forEach((s, i) => {
    e.set(0, s[3], 0); q.setFromEuler(e); const sc = .9 + Math.random() * .22; M4.compose(new THREE.Vector3(s[0], s[1], s[2]), q, new THREE.Vector3(sc, sc, sc)); im.setMatrixAt(i, M4);
    cl.set(shirts[(Math.random() * shirts.length) | 0]); im.setColorAt(i, cl); ph[i] = Math.random();
    cl.set(skins[(Math.random() * skins.length) | 0]); cl.toArray(sk, i * 3);
  });
  geo.setAttribute('iPh', new THREE.InstancedBufferAttribute(ph, 1)); geo.setAttribute('iSkin', new THREE.InstancedBufferAttribute(sk, 3));
  im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.castShadow = false; im.receiveShadow = true; parent.add(im); im.userData.U = U; return im;
}

// ---------------------------------------------------------------- geometry helpers
export {mergeGeometries};
// sweep a cross-section along a path. S: samples [{p:Vector3, nx, nz, bank, s}], prof: [[lat, dy], ...] (a polyline
// across the path; each segment gets its own vertices so edges stay sharp). keep(i) skips quads (gaps). uvs: u along
// (metres / us), v across (metres / vs). aTrk = (metres along, lateral offset).
export function sweep(S, prof, o = {}) {
  const n = S.length, closed = o.closed !== false, us = o.us || 4, vs = o.vs || 4, pos = [], uv = [], trk = [], idx = [];
  const segs = []; for (let k = 0; k < prof.length - 1; k++) segs.push([prof[k], prof[k + 1]]);
  let vbase = 0; const cnt = closed ? n + 1 : n, sEnd = o.len ?? (n > 1 ? S[n - 1].s + (S[n - 1].s - S[n - 2].s) : 1);
  segs.forEach(([a, b], si) => {
    let v0 = 0; for (let k = 0; k < si; k++) v0 += Math.hypot(segs[k][1][0] - segs[k][0][0], segs[k][1][1] - segs[k][0][1]);
    const v1 = v0 + Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let i = 0; i < cnt; i++) {
      const c = S[i % n], cb = Math.cos(c.bank || 0), sb = Math.sin(c.bank || 0), s = i === n ? sEnd : c.s;
      [a, b].forEach((q, j) => { const lat = q[0]; pos.push(c.p.x + c.nx * lat * cb, c.p.y + q[1] + lat * sb, c.p.z + c.nz * lat * cb); uv.push(s / us, (j ? v1 : v0) / vs); trk.push(s, lat); });
      if (i) { const k0 = vbase + (i - 1) * 2, k1 = vbase + i * 2; if (!o.keep || o.keep(i % n, (i - 1 + n) % n)) { if (o.flip) idx.push(k0, k0 + 1, k1, k1, k0 + 1, k1 + 1); else idx.push(k0, k1, k0 + 1, k0 + 1, k1, k1 + 1); } }
    }
    vbase += cnt * 2;
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aTrk', new THREE.Float32BufferAttribute(trk, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
// box with uvs in metres (so tiled materials keep their scale)
export function mbox(w, h, d, us = 2) {
  const g = new THREE.BoxGeometry(w, h, d), p = g.getAttribute('position'), n = g.getAttribute('normal'), uv = g.getAttribute('uv');
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)); const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (ax > .5) uv.setXY(i, z / us, y / us); else if (ay > .5) uv.setXY(i, x / us, z / us); else uv.setXY(i, x / us, y / us); }
  return g;
}
// place copies of a geometry (merged) at transforms [[x,y,z,ry,sx,sy,sz], ...]
export function scatter(geo, list) {
  const out = [], M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  list.forEach(t => { const g = geo.clone(); e.set(t[7] || 0, t[3] || 0, t[8] || 0); q.setFromEuler(e); M4.compose(new THREE.Vector3(t[0], t[1], t[2]), q, new THREE.Vector3(t[4] ?? 1, t[5] ?? 1, t[6] ?? 1)); g.applyMatrix4(M4); out.push(g); });
  return out.length ? mergeGeometries(out) : null;
}
// strip extra attributes so geometries from different sources merge
export function plain(g) { const o = g.index ? g : g; ['color', 'aTrk', 'uv1', 'tangent'].forEach(k => { if (o.getAttribute(k)) o.deleteAttribute(k); }); if (!o.getAttribute('uv')) o.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(o.getAttribute('position').count * 2), 2)); return o; }

// text on a canvas (signs, numbers, ad boards)
export function textCanvas(txt, w, h, o = {}) {
  const c = cv(w, h), x = c.getContext('2d'); if (o.bg) { x.fillStyle = o.bg; x.fillRect(0, 0, w, h); }
  x.font = `${o.weight || 900} ${o.size || Math.round(h * .62)}px ${o.font || 'Verdana,sans-serif'}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  if (o.glow) { x.shadowColor = o.glow; x.shadowBlur = o.blur ?? h * .18; } x.fillStyle = o.col || '#fff'; if (o.ls) x.letterSpacing = o.ls + 'px';
  x.fillText(txt, w / 2, h / 2 + (o.dy || 0)); if (o.glow) { x.shadowBlur = 0; x.fillText(txt, w / 2, h / 2 + (o.dy || 0)); }
  return c;
}
export function canvasTex(c, o = {}) { const t = new THREE.CanvasTexture(c); t.colorSpace = o.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.anisotropy = GFX.aniso; if (o.rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.rep[0], o.rep[1]); } if (o.mips === false) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; } return t; }
export const NEON = (r, g, b) => new THREE.MeshBasicMaterial({color: new THREE.Color(r, g, b), toneMapped: false});
