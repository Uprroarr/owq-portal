// The world outside the Sales Floor: the OWQ tower, a night city far below, the sky, and which part of the
// world is drawn ("zones"). Sales Floor coordinates: office floor y = 0, street level y = GROUNDY.
import * as THREE from 'three';
import {cv, tex} from './tex.js';
import {SKY, skyAt, skyLayout} from './sky.js';

export const GROUNDY = -120;
export const ROOFY = 6;        // top of the Sky Park deck on the roof
export const RANGEY = -6;      // the Firing Range floor, one floor down
export const TOWER = {x0: -10.45, x1: 10.45, z0: -7.45, z1: 12.05, top: 5.6};
export const ELEVP = {x: 8, z: -7.05};   // elevator doors (same shaft on every floor)
export const FLOORS = {
  o: {y: 0, name: 'SALES FLOOR', sub: 'Desks, TV, arcade, Sky Deck door'},
  r: {y: ROOFY, name: 'SKY PARK', sub: 'Home Run Derby and the hangar'},
  g: {y: RANGEY, name: 'FIRING RANGE', sub: 'Target practice with your blaster'},
};
export const LAYER_OUT = 2;   // outdoor things: not drawn in the floor reflection

// a cheap hash used by the shaders and the city layout
function rnd(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }

const FOG = {color: new THREE.Color('#0b0816'), near: 260, far: 2600};

const BLD_VS = `
uniform vec3 uTint;
varying vec3 vW;varying vec3 vN;varying vec3 vC;varying vec3 vO;
void main(){
#ifdef USE_INSTANCING
mat4 m=modelMatrix*instanceMatrix;
#else
mat4 m=modelMatrix;
#endif
#ifdef USE_INSTANCING_COLOR
vC=instanceColor;
#else
vC=uTint;
#endif
vec4 w=m*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(m)*normal);vO=(m*vec4(0.,0.,0.,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
const BLD_FS = `
uniform vec3 uFog;uniform float uFogN,uFogF,uT,uGlow;
varying vec3 vW;varying vec3 vN;varying vec3 vC;varying vec3 vO;
float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec3 N=normalize(vN);vec3 col;
  float idk=h1(vO.xz*.013+3.1);
  if(N.y>.5){ // roof
    col=vec3(.035,.032,.045)+vC*.02;
    float rim=step(.92,fract((vW.x+vW.z)*.05));col+=vec3(.05,.01,.03)*rim;
  }else{
    vec2 f=abs(N.x)>.5?vec2(vW.z,vW.y):vec2(vW.x,vW.y);
    vec2 cell=vec2(3.1,3.6);vec2 g=f/cell;vec2 id=floor(g);vec2 fr=fract(g);
    float win=step(.16,fr.x)*step(fr.x,.84)*step(.22,fr.y)*step(fr.y,.8);
    float lit=step(.58-.22*idk,h1(id+vO.xz*.071));
    float warm=h1(id*1.7+5.);
    vec3 wc=mix(vec3(1.,.72,.42),vec3(.62,.8,1.),step(.72,warm));
    wc=mix(wc,vec3(1.,.25,.45),step(.965,warm));
    float floorBand=step(.97,fract(vW.y/(cell.y*6.)));
    vec3 base=vec3(.025,.024,.035)+vC*.035;
    col=base+win*(lit*wc*(.85+.6*h1(id+9.))*uGlow+(1.-lit)*vec3(.03,.035,.06));
    // far away a window is smaller than a pixel: fade to the average glow instead of sparkling noise
    vec2 fw=fwidth(g);float lp=.42+.22*idk;
    vec3 avg=base+.394*(lp*vec3(1.,.83,.64)*uGlow+(1.-lp)*vec3(.03,.035,.06));
    col=mix(col,avg,smoothstep(.3,.85,max(fw.x,fw.y)));
    col+=floorBand*vC*.25*(1.-smoothstep(.05,.2,fwidth(vW.y/(cell.y*6.))));
    // a soft crimson bounce from the street on the lower floors
    col+=vec3(.12,.02,.05)*exp(-(vW.y+120.)*.03);
  }
  float d=length(cameraPosition-vW);float fg=smoothstep(uFogN,uFogF,d);
  gl_FragColor=vec4(mix(col,uFog,fg),1.);
}`;
const GND_FS = `
uniform vec3 uFog;uniform float uFogN,uFogF,uT;varying vec3 vW;
float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  float B=74.;vec2 p=vW.xz+vec2(37.,37.);vec2 c=mod(p,B);vec2 id=floor(p/B);
  float road=step(c.x,14.)+step(c.y,14.);road=min(road,1.);
  vec3 col=mix(vec3(.02,.02,.026),vec3(.045,.043,.05),road);
  // lane lines, sidewalks and street lights
  float lx=step(c.x,14.)*step(abs(c.x-7.),.12),lz=step(c.y,14.)*step(abs(c.y-7.),.12);
  col+=vec3(.5,.42,.25)*max(lx*step(.5,fract(c.y*.08)),lz*step(.5,fract(c.x*.08)))*.6;
  float sl=step(c.x,14.)*(step(abs(c.x-.6),.25)+step(abs(c.x-13.4),.25))*step(fract(c.y/18.),.04);
  sl+=step(c.y,14.)*(step(abs(c.y-.6),.25)+step(abs(c.y-13.4),.25))*step(fract(c.x/18.),.04);
  col+=vec3(1.,.62,.3)*sl*2.2;
  // traffic: head and tail lights sliding along the lanes
  float tA=fract(c.y/B*3.+uT*.07*(.6+h1(id))+h1(id*3.));float tB=fract(c.x/B*3.-uT*.06*(.6+h1(id+2.))+h1(id*5.));
  float carA=step(c.x,14.)*step(abs(c.x-4.),.6)*step(.985,fract(tA*7.));
  float carB=step(c.x,14.)*step(abs(c.x-10.),.6)*step(.985,fract(tA*5.+.3));
  float carC=step(c.y,14.)*step(abs(c.y-4.),.6)*step(.985,fract(tB*7.));
  float carD=step(c.y,14.)*step(abs(c.y-10.),.6)*step(.985,fract(tB*5.+.5));
  col+=vec3(1.,.95,.85)*(carA+carC)*2.5+vec3(1.,.08,.12)*(carB+carD)*2.2;
  float d=length(cameraPosition-vW);col=mix(col,uFog,smoothstep(uFogN,uFogF,d));
  gl_FragColor=vec4(col,1.);
}`;

export class World {
  constructor(O) {
    this.O = O; this.zone = 'o'; this.built = false;
    this.group = new THREE.Group(); this.group.name = 'world'; O.scene.add(this.group);
    this.uni = {uFog: {value: FOG.color}, uFogN: {value: FOG.near}, uFogF: {value: FOG.far}, uT: {value: 0}, uGlow: {value: 1}, uTint: {value: new THREE.Color(.3, .3, .4)}};
    // outdoor lights stay in the scene (so shaders never recompile) and fade with the zone
    this.moon = new THREE.DirectionalLight('#b8c4ff', 0); this.moon.position.set(-300, 400, 200); O.scene.add(this.moon);
    this.hemi = new THREE.HemisphereLight('#6a5cff', '#2a0912', 0); O.scene.add(this.hemi);
    O.scene.fog = new THREE.Fog(FOG.color, 1e5, 2e5);
    this.build();
  }
  out(o) { o.traverse(c => c.layers.set(LAYER_OUT)); return o; }
  build() {
    if (this.built) return; this.built = true;
    const G = this.group; skyLayout();   // the city keeps clear of the Sky Deck, so lay the track out first
    // sky dome with a crimson horizon glow, stars and a moon
    const skyM = new THREE.ShaderMaterial({side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec3 vD;void main(){float y=vD.y;vec3 z=vec3(.012,.01,.035),h=vec3(.20,.035,.11),b=vec3(.04,.02,.06);vec3 c=mix(h,z,smoothstep(-.02,.42,y));c=mix(b,c,smoothstep(-.25,0.,y));c+=vec3(.25,.06,.12)*exp(-abs(y)*9.)*.6;gl_FragColor=vec4(c,1.);}'});
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3400, 32, 16), skyM); dome.renderOrder = -10; dome.frustumCulled = false; G.add(dome); this.dome = dome;
    const sp = [], r = rnd(7);
    for (let i = 0; i < 1800; i++) { const u = r() * 2 - 1, a = r() * Math.PI * 2, y = Math.abs(u) * .95 + .05, k = Math.sqrt(1 - y * y); sp.push(Math.cos(a) * k * 3200, y * 3200, Math.sin(a) * k * 3200); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({color: '#dfe6ff', size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: .85}));
    stars.frustumCulled = false; G.add(stars);
    const mc = cv(256, 256), mx = mc.getContext('2d'), mg = mx.createRadialGradient(128, 128, 20, 128, 128, 128);
    mg.addColorStop(0, 'rgba(255,248,236,1)'); mg.addColorStop(.38, 'rgba(255,240,220,.95)'); mg.addColorStop(.42, 'rgba(255,120,170,.25)'); mg.addColorStop(1, 'rgba(255,40,100,0)');
    mx.fillStyle = mg; mx.fillRect(0, 0, 256, 256);
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({map: tex(mc, {mips: true}), color: new THREE.Color(2.2, 2.1, 2), fog: false, depthWrite: false, transparent: true}));
    moon.position.set(-900, 1150, -1900); moon.scale.setScalar(420); G.add(moon);
    // street level
    const gm = new THREE.ShaderMaterial({uniforms: this.uni, fog: false, vertexShader: 'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}', fragmentShader: GND_FS});
    const gnd = new THREE.Mesh(new THREE.PlaneGeometry(7000, 7000), gm); gnd.rotation.x = -Math.PI / 2; gnd.position.y = GROUNDY; G.add(gnd);
    // the city: instanced boxes with procedural lit windows; nothing too close to the tower or the Sky Deck
    const bm = new THREE.ShaderMaterial({uniforms: this.uni, vertexShader: BLD_VS, fragmentShader: BLD_FS, fog: false});
    const boxes = [];
    const R = rnd(2026), B = 74, half = 13;
    const clearOf = (x, z, rad) => {
      if (x > -70 && x < 55 && z > -85 && z < 45) return false;          // the tower, the Sky Park and its home-run field
      for (let i = 0; i < SKY.n; i += 3) { const p = SKY.S[i].p; if ((p.x - x) * (p.x - x) + (p.z - z) * (p.z - z) < rad * rad) return false; }
      for (const p of SKY.pylons) if ((p.x - x) * (p.x - x) + (p.z - z) * (p.z - z) < (rad * .7) * (rad * .7)) return false;
      return true;
    };
    for (let gx = -half; gx <= half; gx++) for (let gz = -half; gz <= half; gz++) {
      const cx = gx * B, cz = gz * B, dist = Math.hypot(cx, cz);
      if (dist > 1000) continue;
      const lots = R() < .45 ? 1 : R() < .7 ? 2 : 4;
      for (let k = 0; k < lots; k++) {
        const w = lots === 1 ? 34 + R() * 20 : lots === 2 ? 22 + R() * 8 : 18 + R() * 6, d = lots === 1 ? 34 + R() * 20 : 22 + R() * 10;
        const ox = lots === 1 ? 0 : (k % 2 ? 1 : -1) * 15, oz = lots === 4 ? (k < 2 ? -1 : 1) * 15 : 0;
        const x = cx + 7 + 30 + ox * .8, z = cz + 7 + 30 + oz * .8;
        const near = Math.max(0, 1 - dist / 900);
        let h = 30 + Math.pow(R(), 1.6) * 120 + near * near * 140;
        if (R() < .06) h += 90;
        const rad = Math.max(w, d) * .72 + 14;   // corners included: at least ~9 m of air between any building and the road
        if (!clearOf(x, z, rad)) continue;
        boxes.push([x, z, w, d, h]);
      }
    }
    // hero towers near the Sky Deck, standing just outside its corridor
    [[-75, 20, 26, 26, 210], [-150, -60, 30, 30, 240], [-40, 95, 32, 28, 190], [-175, 55, 28, 34, 170], [-95, -110, 34, 30, 260], [20, 110, 30, 30, 160], [70, -40, 30, 30, 200]].forEach(b => { if (clearOf(b[0], b[1], Math.max(b[2], b[3]) * .72 + 12)) boxes.push(b); });
    this.blds = boxes;
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, .5, 0), bm, boxes.length);
    const m4 = new THREE.Matrix4(), col = new THREE.Color(), pal = ['#2a3a6a', '#3a2550', '#1f3f4a', '#4a2030', '#2b2b3b', '#5a1a32'];
    boxes.forEach((b, i) => { m4.makeScale(b[2], b[4], b[3]); m4.setPosition(b[0], GROUNDY, b[1]); im.setMatrixAt(i, m4); col.set(pal[i % pal.length]); im.setColorAt(i, col); });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    G.add(im); this.city = im;
    // red beacons on the tallest roofs
    const tall = boxes.filter(b => b[4] > 170);
    const bc = new THREE.InstancedMesh(new THREE.SphereGeometry(1.1, 8, 6), new THREE.MeshBasicMaterial({color: new THREE.Color(4, .25, .3), toneMapped: false}), tall.length);
    tall.forEach((b, i) => { m4.makeTranslation(b[0], GROUNDY + b[4] + 1.5, b[1]); bc.setMatrixAt(i, m4); });
    bc.instanceMatrix.needsUpdate = true; G.add(bc); this.beacons = bc;
    // the OWQ tower itself (seen from outside): glass facade with crimson fins and a big sign, door opening on the west side
    this.shell = this.buildShell(); G.add(this.shell);
    this.out(G);
  }
  buildShell() {
    const S = new THREE.Group(); S.name = 'owqtower';
    const T = TOWER, H = T.top - GROUNDY;
    const m = new THREE.ShaderMaterial({uniforms: Object.assign({}, this.uni, {uGlow: {value: 1.25}, uTint: {value: new THREE.Color(.55, .08, .2)}}), vertexShader: BLD_VS, fragmentShader: BLD_FS, fog: false});
    const face = (w, h, x, y, z, ry) => { const g = new THREE.PlaneGeometry(w, h); g.computeVertexNormals(); const mm = new THREE.Mesh(g, m); mm.position.set(x, y, z); mm.rotation.y = ry; S.add(mm); return mm; };
    const cx = (T.x0 + T.x1) / 2, cz = (T.z0 + T.z1) / 2, W = T.x1 - T.x0, Dp = T.z1 - T.z0, yc = (T.top + GROUNDY) / 2;
    face(W, H, cx, yc, T.z1, 0); face(W, H, cx, yc, T.z0, Math.PI); face(Dp, H, T.x1, yc, cz, Math.PI / 2);
    // west face with the Sky Deck door cut out: below, above, and either side of the door
    const dz0 = 2.5, dz1 = 4.7, dh = 2.6;
    const wy0 = GROUNDY, west = (z0, z1, y0, y1) => face(z1 - z0, y1 - y0, T.x0, (y0 + y1) / 2, (z0 + z1) / 2, -Math.PI / 2);
    west(T.z0, T.z1, wy0, 0); west(T.z0, T.z1, dh, T.top); west(T.z0, dz0, 0, dh); west(dz1, T.z1, 0, dh);
    // crimson fins on the corners and a lit crown
    const fin = new THREE.MeshBasicMaterial({color: new THREE.Color(3, .3, .75), toneMapped: false});
    [[T.x0, T.z0], [T.x1, T.z0], [T.x0, T.z1], [T.x1, T.z1]].forEach(([x, z]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(.5, H, .5), fin); b.position.set(x, yc, z); S.add(b); });
    const c = cv(1024, 256), x = c.getContext('2d'); x.font = '900 190px Verdana,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#ff1f4f'; x.shadowBlur = 50; x.fillStyle = '#fff'; x.fillText('OWQ', 512, 132);
    const sm = new THREE.MeshBasicMaterial({map: tex(c, {mips: true}), transparent: true, depthWrite: false, color: new THREE.Color(2.4, 2.4, 2.4), toneMapped: false, side: THREE.DoubleSide});
    [[cx, T.z1 + .2, 0], [cx, T.z0 - .2, Math.PI], [T.x1 + .2, cz, Math.PI / 2], [T.x0 - .2, cz, -Math.PI / 2]].forEach(([px, pz, ry]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(16, 4), sm); p.position.set(px, -10, pz); p.rotation.y = ry; S.add(p); });
    // door frame glow
    const df = new THREE.MeshBasicMaterial({color: new THREE.Color(3.2, .35, .85), toneMapped: false});
    [[dz0, 0], [dz1, 0]].forEach(([z]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(.12, dh, .12), df); b.position.set(T.x0 - .02, dh / 2, z); S.add(b); });
    const top = new THREE.Mesh(new THREE.BoxGeometry(.12, .12, dz1 - dz0 + .12), df); top.position.set(T.x0 - .02, dh, (dz0 + dz1) / 2); S.add(top);
    return S;
  }
  // which zone is the camera in? o = Sales Floor, g = range floor, r = roof, d = outside (deck / sky)
  zoneAt(p) {
    const T = TOWER;
    const inside = p.x > T.x0 + .05 && p.x < T.x1 - .05 && p.z > T.z0 + .05 && p.z < T.z1 - .2;
    if (inside && p.y > -.3 && p.y < 5.35) return 'o';
    if (inside && p.y > RANGEY - .3 && p.y < -.6) return 'g';
    // the default Sales Floor camera sits just outside the open front wall: still the Sales Floor
    if (p.y > -.3 && p.y < 7 && p.x > T.x0 - .2 && p.x < T.x1 + .2 && p.z > T.z0 && p.z < T.z1 + 9) return 'o';
    if (p.y > ROOFY - .5 && p.y < ROOFY + 40 && Math.abs(p.x) < 60 && p.z > -70 && p.z < 40) return 'r';
    return 'd';
  }
  setZone(z) {
    if (z === this.zone) return; this.zone = z;
    const O = this.O, outside = z === 'd' || z === 'r';
    if (this.shell) this.shell.visible = outside;
    O.room.backdrop && (O.room.backdrop.visible = !outside && z !== 'g');
    // outdoors: moonlight and a violet sky light; the range downstairs gets an even work light
    this.moon.intensity = z === 'r' ? 1.5 : outside ? 1.1 : z === 'g' ? .7 : 0; this.hemi.intensity = z === 'r' ? 1.05 : outside ? .55 : z === 'g' ? 1.15 : 0;
    this.hemi.color.set(z === 'g' ? '#fff1e2' : z === 'r' ? '#d9ddff' : '#6a5cff'); this.hemi.groundColor.set(z === 'g' ? '#3a2a30' : z === 'r' ? '#2a1a22' : '#2a0912');
    O.scene.fog.near = outside ? FOG.near : 1e5; O.scene.fog.far = outside ? FOG.far : 2e5;
    if (O.onZone) O.onZone(z);
  }
  update(dt, t) {
    this.uni.uT.value = t % 1000;
    const cam = this.O.cam, z = this.zoneAt(cam.position);
    this.setZone(z);
    // from inside the tower the outside only shows through the west door: skip drawing it unless the camera looks that way
    let show = true;
    if (z === 'o' || z === 'g') { const d = this._d || (this._d = new THREE.Vector3()); cam.getWorldDirection(d); show = z === 'o' && d.x < -.2 && cam.position.x < 7; }
    if (this.group.visible !== show) this.group.visible = show;
  }
}
