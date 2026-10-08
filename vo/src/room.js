import * as THREE from 'three';
import {mergeGeometries} from '../three/examples/jsm/utils/BufferGeometryUtils.js';
import {Batch,M,box,rbox,cyl,sph,lathe,tube,frondGeo,leafGeo} from './geo.js';
import {tex,cv,marbleCanvas,roughCanvas,slatsCanvas,foliageCanvas,monsteraCanvas,frondCanvas,fernCanvas,neonCanvas,blobCanvas,inlayCanvas,plateCanvas} from './tex.js';
import {SEATS,TVP,ELEV,BELLP} from './layout.js';
import {rng,damp,clamp} from './util.js';

const std=o=>new THREE.MeshStandardMaterial(o);
const hdr=(r,g,b)=>new THREE.MeshBasicMaterial({color:new THREE.Color(r,g,b)});

function mergeLocal(list){return mergeGeometries(list.map(([g,m])=>{let n=g.index?g.toNonIndexed():g.clone();if(m)n.applyMatrix4(m);Object.keys(n.attributes).forEach(k=>{if(k!=='position'&&k!=='normal'&&k!=='uv')n.deleteAttribute(k)});return n}),false)}

export function buildRoom(scene,o={}){
  const R={group:new THREE.Group(),upd:[],desks:[]};scene.add(R.group);const G=R.group;
  const T=R.T={};
  T.marble=tex(marbleCanvas(),{rep:[4.5,3.2]});T.rough=tex(roughCanvas(),{srgb:false,rep:[4.5,3.2]});
  T.walnut=tex(slatsCanvas(2,[80,50,30],14,7),{rep:[2.4,1]});T.walnut2=tex(slatsCanvas(8,[62,40,26],10,5),{rep:[6,1]});
  T.ceil=tex(slatsCanvas(4,[44,31,22],10,12),{rep:[1,7]});T.green=tex(foliageCanvas(),{rep:[5.5,2.3]});
  T.monst=tex(monsteraCanvas());T.frond=tex(frondCanvas());T.fern=tex(fernCanvas());T.blob=tex(blobCanvas());T.inlay=tex(inlayCanvas(),{srgb:false});
  T.desk=tex(slatsCanvas(6,[118,80,50],5,1),{rep:[1,1]});
  const m=R.mats={
    floor:std({map:T.marble,roughnessMap:T.rough,roughness:1,metalness:0,envMapIntensity:.55}),
    walnut:std({map:T.walnut,roughness:.6}),walnut2:std({map:T.walnut2,roughness:.55}),ceil:std({map:T.ceil,roughness:.88,color:0x9a9a9a}),green:std({map:T.green,roughness:.95}),
    stone:std({color:0x1d1a20,roughness:.32,metalness:.05}),black:std({color:0x0c0c0f,roughness:.3,metalness:.65}),brass:std({color:0xa8823e,roughness:.3,metalness:1}),gold:std({color:0xe6b65b,roughness:.18,metalness:1}),
    desk:std({map:T.desk,roughness:.4}),frame:std({color:0x0f0f13,roughness:.32,metalness:.7}),panel:std({color:0x0b0b0f,roughness:.2,metalness:.3}),
    leather:std({color:0x15151a,roughness:.46}),chrome:std({color:0xe0e0e0,roughness:.12,metalness:1}),white:std({color:0xf2f0ec,roughness:.32}),key:std({color:0x1b1b21,roughness:.5}),
    pot:std({color:0x1a191d,roughness:.5}),cream:std({color:0xd9d1c5,roughness:.55}),soil:std({color:0x24190f,roughness:1}),trunk:std({color:0x75613f,roughness:.9}),stem:std({color:0x2f5d25,roughness:.7}),
    frond:std({map:T.frond,alphaTest:.5,side:THREE.DoubleSide,roughness:.7}),monst:std({map:T.monst,alphaTest:.5,side:THREE.DoubleSide,roughness:.55}),fern:std({map:T.fern,alphaTest:.45,side:THREE.DoubleSide,roughness:.75}),
    paper:std({color:0xf4f2ee,roughness:.8}),succ:std({color:0x5f9a62,roughness:.6}),
    ledW:hdr(3.0,2.3,1.6),ledT:hdr(.3,2.4,2.1),down:hdr(3.2,2.6,2.0),cabL:hdr(3.8,3.2,2.5),
    cab:std({color:0x7a5636,roughness:.4,metalness:.35,side:THREE.BackSide}),
    blob:new THREE.MeshBasicMaterial({color:0,map:T.blob,transparent:true,depthWrite:false,opacity:.85}),
  };
  const B=new Batch(),BN=new Batch(),BE=new Batch();
  // ---------- floor ----------
  const fg=new THREE.PlaneGeometry(18,12.6);fg.rotateX(-Math.PI/2);fg.translate(0,0,-.7);
  R.floor=new THREE.Mesh(fg,m.floor);R.floor.receiveShadow=true;G.add(R.floor);
  const ig=new THREE.PlaneGeometry(2.6,2.6);ig.rotateX(-Math.PI/2);
  R.inlay=new THREE.Mesh(ig,std({color:0xe3b45c,metalness:1,roughness:.26,alphaMap:T.inlay,alphaTest:.5}));R.inlay.position.set(0,.003,3.55);R.inlay.receiveShadow=true;G.add(R.inlay);
  // ---------- shell ----------
  BN.add(m.walnut,box(8.78,5.2,.3),M(-.94,2.6,-7.15));
  BN.add(m.green,box(.3,5.2,12.6),M(-9.15,2.6,-.7));BN.add(m.walnut2,box(.3,5.2,12.6),M(9.15,2.6,-.7));
  BN.add(m.ceil,box(18.6,.2,12.8),M(0,5.3,-.7));
  // glass curtain wall frames
  [-9,-7.165,-5.33,3.45,5.22,7.0].forEach(x=>B.add(m.black,box(.07,5.2,.14),M(x,2.6,-7.0)));
  [[-7.165,3.74],[5.225,3.55]].forEach(([cx,w])=>{B.add(m.black,box(w,.12,.16),M(cx,5.14,-7.0));B.add(m.black,box(w,.08,.18),M(cx,.04,-7.0));B.add(m.black,box(w,.045,.1),M(cx,4.25,-7.0))});
  // elevator wall + brass frame + cab
  BN.add(m.stone,box(.35,5.2,.3),M(7.175,2.6,-7.15));BN.add(m.stone,box(.35,5.2,.3),M(8.825,2.6,-7.15));BN.add(m.stone,box(1.3,2.7,.3),M(8,3.85,-7.15));
  B.add(m.brass,box(.06,2.56,.07),M(7.33,1.28,-6.98));B.add(m.brass,box(.06,2.56,.07),M(8.67,1.28,-6.98));B.add(m.brass,box(1.4,.06,.07),M(8,2.53,-6.98));
  const cab=new THREE.Mesh(box(1.3,2.5,1.6),m.cab);cab.position.set(8,1.25,-8.1);cab.receiveShadow=true;G.add(cab);
  const cl=new THREE.Mesh(new THREE.PlaneGeometry(1.0,1.2),m.cabL);cl.rotation.x=Math.PI/2;cl.position.set(8,2.48,-8.1);G.add(cl);
  const dg=box(.66,2.5,.04),dL=new THREE.Mesh(dg,m.brass),dR=new THREE.Mesh(dg,m.brass);dL.position.set(7.67,1.25,-7.06);dR.position.set(8.33,1.25,-7.06);dL.castShadow=dR.castShadow=true;G.add(dL,dR);
  const el=new THREE.PointLight(0xffd59a,0,7,2);el.position.set(8,2.1,-7.5);G.add(el);
  const ind=cv(256,96),ix=ind.getContext('2d');ix.fillStyle='#050505';ix.fillRect(0,0,256,96);ix.fillStyle='#ffb347';ix.font='bold 54px Verdana';ix.textAlign='center';ix.textBaseline='middle';ix.fillText('▲ PH',128,50);
  const indM=new THREE.Mesh(new THREE.PlaneGeometry(.5,.19),new THREE.MeshBasicMaterial({map:tex(ind,{mips:false}),color:new THREE.Color(1.6,1.6,1.6)}));indM.position.set(8,2.78,-6.99);G.add(indM);
  R.elev={dL,dR,light:el,o:0,hold:0};
  R.elevOpen=(sec)=>{R.elev.hold=Math.max(R.elev.hold,sec)};
  // ---------- credenza under TV ----------
  B.add(m.walnut2,rbox(6.6,.42,.5,.03),M(-.94,.52,-6.72));BE.add(m.ledW,box(6.4,.012,.02),M(-.94,.3,-6.55));
  B.add(m.gold,lathe([[0,0],[.08,0],[.08,.02],[.03,.04],[.025,.12],[.06,.16],[.085,.24],[.07,.3],[0,.3]],28),M(-3.3,.73,-6.72));
  B.add(m.gold,cyl(.03,.03,.05,16),M(-3.3,1.05,-6.72));
  [[.36,.06,.26,'#7a1020'],[.33,.05,.24,'#e9e3d6'],[.35,.07,.25,'#1d1d24']].forEach((b,i)=>B.add(std({color:b[3],roughness:.6}),box(b[0],b[1],b[2]),M(.75,.76+i*.065,-6.72,0,.08*i,0)));
  B.add(m.cream,lathe([[0,0],[.07,0],[.1,.08],[.09,.22],[.05,.3],[.055,.34],[0,.34]],28),M(1.85,.73,-6.72));
  const rr=rng(77);for(let i=0;i<6;i++){const a=i/6*6.28+rr(),h=.5+rr()*.35;B.add(m.stem,tube([[1.85,1.02,-6.72],[1.85+Math.sin(a)*.08,1.02+h*.6,-6.72+Math.cos(a)*.06],[1.85+Math.sin(a)*.16,1.02+h,-6.72+Math.cos(a)*.12]],.006,8,4));
    B.add(m.monst,leafGeo(.2,.26,.15,.2),M(1.85+Math.sin(a)*.16,1.02+h,-6.72+Math.cos(a)*.12,.6,a,0))}
  // ---------- planters + ferns under the windows ----------
  const R2=rng(31);
  const planter=(cx,w)=>{B.add(m.pot,rbox(w,.46,.44,.02),M(cx,.23,-6.72));BN.add(m.soil,box(w-.06,.02,.38),M(cx,.45,-6.72));
    const n=Math.round(w*3.2);for(let i=0;i<n;i++){const x=cx-w/2+.15+(i+R2()*.6)/n*(w-.3),s=.55+R2()*.4;for(let k=0;k<2;k++)B.add(m.fern,new THREE.PlaneGeometry(.55*s,.5*s).translate(0,.25*s,0),M(x,.44,-6.72+(R2()-.5)*.16,0,k*1.57+R2()*.6,0))}};
  planter(-7.165,3.5);planter(5.0,2.7);
  // ---------- bell ----------
  B.add(m.gold,cyl(.24,.3,.06,32),M(BELLP.x,.03,BELLP.z));B.add(m.walnut2,cyl(.045,.055,1.78,16),M(BELLP.x,.92,BELLP.z));B.add(m.gold,box(.5,.05,.06),M(BELLP.x+.2,1.79,BELLP.z));
  const bp=new THREE.Group();bp.position.set(BELLP.hx,BELLP.hy,BELLP.z);bp.scale.setScalar(1.55);G.add(bp);const bsp=new THREE.SpotLight(0xffd59a,22,0,.45,.6,2);bsp.position.set(BELLP.hx-.4,4.6,BELLP.z+1.2);bsp.target.position.set(BELLP.hx,BELLP.hy-.3,BELLP.z);G.add(bsp,bsp.target);
  const bm=new THREE.Mesh(lathe([[0,0],[.03,0],[.05,-.02],[.058,-.06],[.066,-.12],[.08,-.19],[.1,-.245],[.125,-.285],[.136,-.3],[.12,-.306],[.1,-.29],[.08,-.25],[.062,-.16],[.05,-.08],[.035,-.03],[0,-.02]],48),m.gold);bm.material=m.gold.clone();bm.material.side=THREE.DoubleSide;bm.castShadow=true;bp.add(bm);
  const lp=new THREE.Mesh(new THREE.TorusGeometry(.025,.008,8,16),m.gold);lp.position.y=.02;bp.add(lp);
  const cp=new THREE.Mesh(sph(.024,12,8),m.brass);cp.position.y=-.28;bp.add(cp);const rp=new THREE.Mesh(cyl(.006,.006,.34,6),std({color:0xd8c69e,roughness:.9}));rp.position.y=-.45;bp.add(rp);
  R.bell={g:bp,t:-99,amp:0};R.ring=(a=1)=>{R.bell.t=0;R.bell.amp=Math.min(1.4,R.bell.amp+a)};
  // ---------- neon signs ----------
  const neon=(txt,w,h,x,y,z,col,core,k)=>{const c=neonCanvas(txt,{col,core});const me=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex(c,{mips:true}),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:new THREE.Color(k,k,k),toneMapped:false}));me.position.set(x,y,z);G.add(me);return me};
  R.neon=neon('Only Winners',3.3,.83,-7.165,3.3,-6.8,'#ff2d78','#fff0f6',2.6);
  B.add(m.black,cyl(.004,.004,1.45,4),M(-8.5,4.4,-6.8));B.add(m.black,cyl(.004,.004,1.6,4),M(-5.83,4.4,-6.8));
  R.neon2=neon('Ring the bell',1.8,.45,8.0,3.55,-6.985,'#ffb43a','#fff6dd',3.6);
  const nl=new THREE.PointLight(0xff2f72,7,10,2);nl.position.set(-7.165,3.2,-6.2);G.add(nl);R.neonLight=nl;
  // ---------- ceiling fixtures ----------
  [-3.3,3.3].forEach(x=>{B.add(m.black,box(.1,.07,10.2),M(x,4.76,-1.2));BE.add(m.ledW,box(.06,.012,10.1),M(x,4.722,-1.2));[-5.6,3.2].forEach(z=>B.add(m.black,cyl(.004,.004,.42,4),M(x,5.0,z)))});
  for(const x of[-7.5,-4.5,-1.5,1.5,4.5,7.5])for(const z of[-5.6,-2.4,.6,3.8]){const g=new THREE.CircleGeometry(.07,16);g.rotateX(Math.PI/2);BE.add(m.down,g,M(x,5.198,z))}
  // ---------- desks ----------
  const chairGeo=mergeLocal([[rbox(.54,.1,.52,.04),M(0,.47,0)],[rbox(.52,.66,.09,.04),M(0,.92,-.27,-.1,0,0)],[rbox(.34,.14,.08,.03),M(0,1.33,-.32,-.1,0,0)],
    [rbox(.05,.03,.3,.012),M(.29,.67,-.02)],[rbox(.05,.03,.3,.012),M(-.29,.67,-.02)],[box(.03,.17,.03),M(.29,.58,-.05)],[box(.03,.17,.03),M(-.29,.58,-.05)]]);
  const cbase=[[cyl(.026,.026,.3,12),M(0,.27,0)]];for(let i=0;i<5;i++){const a=i/5*6.283;cbase.push([box(.04,.03,.32),M(Math.sin(a)*.16,.07,Math.cos(a)*.16,0,a,0)]);cbase.push([sph(.026,8,6),M(Math.sin(a)*.31,.03,Math.cos(a)*.31)])}
  const chromeGeo=mergeLocal(cbase);
  const blobG=new THREE.PlaneGeometry(1,1);blobG.rotateX(-Math.PI/2);
  SEATS.forEach(s=>{const x=s.x,z=s.z;
    B.add(m.desk,rbox(1.9,.05,.82,.015),M(x,.735,z));B.add(m.frame,box(.045,.71,.74),M(x-.9,.355,z));B.add(m.frame,box(.045,.71,.74),M(x+.9,.355,z));
    B.add(m.panel,box(1.76,.42,.02),M(x,.47,z+.36));B.add(m.key,rbox(.44,.022,.14,.008),M(x,.771,z-.3));B.add(m.key,rbox(.06,.025,.1,.012),M(x+.34,.772,z-.28));
    B.add(m.white,cyl(.04,.036,.1,16),M(x-.68,.81,z-.06));B.add(m.white,new THREE.TorusGeometry(.025,.007,6,12),M(x-.722,.815,z-.06,0,Math.PI/2,0));
    B.add(m.black,box(1.02,.02,.05),M(x,.77,z+.22));BE.add(m.ledT,box(.98,.006,.012),M(x,.782,z+.245));
    B.add(m.cream,cyl(.05,.04,.08,16),M(x+.72,.8,z+.15));for(let k=0;k<5;k++)B.add(m.succ,sph(.026,8,6),M(x+.72+Math.sin(k*1.3)*.024,.85+(k%2)*.012,z+.15+Math.cos(k*1.3)*.024,0,0,0,1,1.3,1));
    B.add(m.paper,box(.21,.006,.29),M(x-.38,.763,z+.02,0,.25,0));
    const blob=new THREE.Mesh(blobG,m.blob);blob.scale.set(2.3,1,1.25);blob.position.set(x,.004,z-.05);blob.layers.set(1);blob.renderOrder=1;G.add(blob);
    const led=new THREE.Mesh(box(1.7,.014,.014),new THREE.MeshBasicMaterial({color:new THREE.Color(1.6,.12,.3)}));led.position.set(x,.27,z+.375);G.add(led);
    const pc=plateCanvas(''),pt=tex(pc,{mips:true});const plate=new THREE.Mesh(new THREE.PlaneGeometry(.56,.105),std({map:pt,emissiveMap:pt,emissive:0xffffff,emissiveIntensity:.55,roughness:.35,metalness:.2}));plate.position.set(x,.56,z+.372);G.add(plate);
    const hc=cv(512,154),ht=tex(hc,{mips:false});const holo=new THREE.Mesh(new THREE.PlaneGeometry(1.0,.3),new THREE.MeshBasicMaterial({map:ht,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,color:new THREE.Color(1.5,1.5,1.5),toneMapped:false}));holo.position.set(x,.925,z+.235);holo.visible=false;G.add(holo);
    const chair=new THREE.Group();const c1=new THREE.Mesh(chairGeo,m.leather),c2=new THREE.Mesh(chromeGeo,m.chrome);c1.castShadow=c2.castShadow=true;c1.receiveShadow=true;chair.add(c1,c2);
    const cb=new THREE.Mesh(blobG,m.blob);cb.scale.set(.85,1,.85);cb.position.y=.005;cb.layers.set(1);cb.renderOrder=1;chair.add(cb);
    chair.position.set(x,0,z-.42);chair.rotation.y=(rng(s.i*7+3)()-.5)*.5;G.add(chair);
    R.desks.push({seat:s,led,plate,pc,pt,holo,hc,ht,chair,name:'',occ:0,ct:z-.42,cy:chair.rotation.y,hT:0})});
  // ---------- plants ----------
  const palm=(x,z,sc,seed,dk)=>{const r=rng(seed);B.add(dk?m.pot:m.cream,lathe([[0,0],[.3,0],[.34,.05],[.38,.6],[.35,.63],[.32,.59],[0,.59]],32),M(x,0,z,0,0,0,sc));BN.add(m.soil,cyl(.33,.33,.02,24),M(x,.59*sc,z,0,0,0,sc));
    for(let k=0;k<4;k++){const a=r()*6.283,lean=.1+r()*.18,h=(1.5+r()*1.1)*sc,top=[x+Math.sin(a)*lean*h,.6*sc+h,z+Math.cos(a)*lean*h];
      B.add(m.trunk,tube([[x+(r()-.5)*.1*sc,.6*sc,z+(r()-.5)*.1*sc],[(x+top[0])/2,.6*sc+h*.55,(z+top[2])/2],top],.024*sc,12,6));
      const nf=5+(r()*3|0);for(let f=0;f<nf;f++){const az=f/nf*6.283+r()*.5,len=(.85+r()*.5)*sc,pitch=.3+r()*.55;B.add(m.frond,frondGeo(len,.44*sc,.5+r()*.35,12,.3),M(top[0],top[1],top[2],0,az,pitch))}}};
  const monstera=(x,z,sc,seed)=>{const r=rng(seed);B.add(m.pot,lathe([[0,0],[.22,0],[.27,.42],[.25,.44],[0,.44]],28),M(x,0,z,0,0,0,sc));BN.add(m.soil,cyl(.25,.25,.02,20),M(x,.43*sc,z,0,0,0,sc));
    for(let k=0;k<9;k++){const a=k/9*6.283+r()*.5,tilt=.75+r()*.55,h=(.35+r()*.5)*sc,bx=x+Math.sin(a)*.25*sc,bz=z+Math.cos(a)*.25*sc,by=.44*sc+h;
      B.add(m.stem,tube([[x,.44*sc,z],[(x+bx)/2,.44*sc+h*.7,(z+bz)/2],[bx,by,bz]],.009*sc,10,5));B.add(m.monst,leafGeo(.55*sc,.6*sc,.16,.22),M(bx,by,bz,tilt,a,0))}};
  palm(-8.3,-6.25,1.1,5);palm(5.05,4.8,1.25,9,1);monstera(-5.0,4.7,1.25,4);monstera(-8.35,-2.3,1.0,12);monstera(-8.35,1.9,.9,21);
  // ---------- build batches ----------
  R.static=[...B.build(G,{cast:true,receive:true}),...BN.build(G,{cast:false,receive:true}),...BE.build(G,{cast:false,receive:false})];
  // ---------- glass panes ----------
  const gm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{},
    vertexShader:'varying vec3 vW;varying vec2 vU;void main(){vU=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:'varying vec3 vW;varying vec2 vU;void main(){vec3 V=normalize(cameraPosition-vW);float f=pow(1.-abs(V.z),3.);float s=smoothstep(.0,.5,vU.y)*(.6+.4*sin(vU.x*9.+vU.y*3.));vec3 c=vec3(.5,.58,.78)*(.012+.05*f)+vec3(.9,.7,.6)*.01*s;gl_FragColor=vec4(c,.05+.22*f);}'});
  R.glass=[];[[-7.165,3.67],[5.225,3.5]].forEach(([cx,w])=>{const g=new THREE.Mesh(new THREE.PlaneGeometry(w,5.1),gm);g.position.set(cx,2.6,-7.03);g.renderOrder=5;G.add(g);R.glass.push(g)});
  // ---------- skyline backdrop ----------
  const bdW=96,bdH=bdW/3.448;const bgG=new THREE.PlaneGeometry(bdW*1.44,bdH,1,1);const uv=bgG.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,-.22+uv.getX(i)*1.44);
  const ph0=cv(4,4),p0=ph0.getContext('2d'),gr=p0.createLinearGradient(0,0,0,4);gr.addColorStop(0,'#2b2a6a');gr.addColorStop(1,'#f08a5a');p0.fillStyle=gr;p0.fillRect(0,0,4,4);
  const bdU={map:{value:tex(ph0,{mips:false})},uK:{value:.62}};
  const bdM=new THREE.ShaderMaterial({uniforms:bdU,depthWrite:true,
    vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform sampler2D map;uniform float uK;varying vec2 vU;void main(){vec3 c=texture2D(map,vU).rgb;float m=max(c.r,max(c.g,c.b));vec3 h=c*(1.+5.*smoothstep(.42,.95,m)*smoothstep(.3,1.,m));gl_FragColor=vec4(h*uK,1.);}'});
  const bd=new THREE.Mesh(bgG,bdM);bd.position.set(0,-8.95+bdH/2,-48);G.add(bd);R.backdrop=bd;
  R.setPhoto=url=>{if(!url)return;const im=new Image();im.onload=()=>{const t=new THREE.Texture(im);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=THREE.MirroredRepeatWrapping;t.wrapT=THREE.ClampToEdgeWrapping;t.anisotropy=8;t.needsUpdate=true;bdU.map.value=t};im.src=url};
  // ---------- lights ----------
  const L=R.lights={};
  L.hemi=new THREE.HemisphereLight(0x9fb3ff,0x2c1b12,.5);G.add(L.hemi);
  L.key=new THREE.SpotLight(0xffd5aa,80,0,.98,.85,2);L.key.position.set(.4,5.05,1.4);L.key.target.position.set(0,0,-1.7);L.key.castShadow=true;L.key.shadow.mapSize.set(2048,2048);L.key.shadow.bias=-.00035;L.key.shadow.normalBias=.035;L.key.shadow.camera.near=1.5;L.key.shadow.camera.far=14;G.add(L.key,L.key.target);
  L.sl=new THREE.SpotLight(0xffd0a0,42,0,.85,.9,2);L.sl.position.set(-5.7,5.05,-1.2);L.sl.target.position.set(-5.7,0,-1.7);G.add(L.sl,L.sl.target);
  L.sr=new THREE.SpotLight(0xffd0a0,42,0,.85,.9,2);L.sr.position.set(5.7,5.05,-1.2);L.sr.target.position.set(5.7,0,-1.7);G.add(L.sr,L.sr.target);
  L.rim=new THREE.DirectionalLight(0xff9c76,1.25);L.rim.position.set(-4,7,-22);L.rim.target.position.set(0,1,0);G.add(L.rim,L.rim.target);
  L.front=new THREE.PointLight(0xffe2c4,5,0,2);L.front.position.set(0,3.6,6.5);G.add(L.front);
  // ---------- update ----------
  R.update=(dt,t)=>{const E=R.elev;E.hold=Math.max(0,E.hold-dt);const tgt=E.hold>0?1:0;E.o=damp(E.o,tgt,tgt?4:3,dt);const o=E.o;E.dL.position.x=7.67-.62*o;E.dR.position.x=8.33+.62*o;E.light.intensity=o*9;
    const b=R.bell;b.t+=dt;b.amp=Math.max(0,b.amp-dt*.35);b.g.rotation.z=Math.sin(b.t*9)*.38*b.amp*Math.exp(-b.t*.35);
    R.neonLight.intensity=6.5+Math.sin(t*1.7)*.4+(Math.random()<.004?-4:0);
    R.desks.forEach(d=>{const tz=d.occ?d.seat.cz:d.seat.z-.42;d.chair.position.z=damp(d.chair.position.z,tz,5,dt);d.chair.rotation.y=damp(d.chair.rotation.y,d.occ?d.sway||0:d.cy,4,dt)})};
  R.setPlate=(d,name)=>{if(d.name===name)return;d.name=name;const c=plateCanvas(name?name:'');d.pc.getContext('2d').drawImage(c,0,0);d.pt.needsUpdate=true};
  return R}
