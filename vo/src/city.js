// OWQ login city: a dense, hazy neon megacity at street level, rendered with three.js.
// Physically based sky with a low sun, aerial perspective (height + distance haze that glows toward the sun),
// instanced towers with procedural facades (floors, lit windows, glass that reflects the sky, LED strips),
// neon billboards, a wet boulevard with lane markings and reflections, palms, street lights, distant traffic and
// air traffic, a parked sports coupe in the foreground, then bloom, sun shafts, color grade, grain and vignette.
// Every login picks a random city look. Quality tiers and dynamic resolution keep it smooth on phones.
import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';

const CITIES=[
 {n:'Neo Tokyo',c:'Japan',ll:'35.68N 139.69E',look:'sunset'},{n:'Los Angeles',c:'California',ll:'34.05N 118.24W',look:'sunset'},
 {n:'Hong Kong',c:'China',ll:'22.32N 114.17E',look:'night'},{n:'Dubai',c:'UAE',ll:'25.20N 55.27E',look:'dawn'},
 {n:'Miami',c:'Florida',ll:'25.76N 80.19W',look:'sunset'},{n:'Seoul',c:'South Korea',ll:'37.57N 126.98E',look:'night'},
 {n:'Singapore',c:'Singapore',ll:'1.35N 103.82E',look:'dusk'},{n:'New York',c:'New York',ll:'40.71N 74.01W',look:'dusk'},
 {n:'Shanghai',c:'China',ll:'31.23N 121.47E',look:'night'},{n:'Chicago',c:'Illinois',ll:'41.88N 87.63W',look:'rain'},
 {n:'Las Vegas',c:'Nevada',ll:'36.17N 115.14W',look:'night'},{n:'Night City',c:'Free State',ll:'37.80N 122.27W',look:'sunset'}];
const LOOKS={
 sunset:{exp:.62,sunEl:4,sunAz:3,sun:[1.0,.58,.30],sunI:3.4,zen:[.14,.22,.48],hor:[1.0,.56,.30],haze:[.86,.50,.34],fogD:.0012,lit:.34,neon:1.2,amb:.45,wet:.35,stars:0},
 dusk:{exp:.8,sunEl:-2,sunAz:10,sun:[1.0,.5,.32],sunI:1.6,zen:[.07,.10,.26],hor:[.92,.46,.36],haze:[.42,.34,.42],fogD:.0019,lit:.42,neon:1.3,amb:.32,wet:.5,stars:.2},
 night:{exp:1.05,sunEl:-14,sunAz:0,sun:[.5,.6,1.0],sunI:.35,zen:[.01,.015,.05],hor:[.10,.06,.16],haze:[.13,.09,.18],fogD:.0024,lit:.5,neon:1.8,amb:.12,wet:.85,stars:.8},
 dawn:{exp:.62,sunEl:5,sunAz:-4,sun:[1.0,.70,.58],sunI:2.6,zen:[.26,.36,.62],hor:[.98,.66,.62],haze:[.80,.62,.66],fogD:.0015,lit:.18,neon:.8,amb:.6,wet:.25,stars:0},
 rain:{exp:1.0,sunEl:-9,sunAz:0,sun:[.6,.6,.8],sunI:.3,zen:[.03,.04,.07],hor:[.16,.16,.22],haze:[.18,.18,.24],fogD:.0036,lit:.5,neon:1.6,amb:.18,wet:1.0,stars:0,rain:1}};
const TIERS={high:{inst:2600,near:46,bb:18,shadow:1,shafts:1,bloom:1,dpr:2,palms:22,lights:28,traffic:90},
 medium:{inst:1500,near:34,bb:12,shadow:0,shafts:1,bloom:.6,dpr:1.25,palms:14,lights:18,traffic:50},
 low:{inst:700,near:20,bb:7,shadow:0,shafts:0,bloom:.5,dpr:.85,palms:8,lights:10,traffic:24}};

function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}}
const v3=(a)=>new THREE.Vector3(a[0],a[1],a[2]);
const GLSL_COMMON=`
float h11(float p){p=fract(p*.1031);p*=p+33.33;p*=p+p;return fract(p);}
float h21(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vn(p);p*=2.03;a*=.5;}return s;}
uniform vec3 uSunDir,uSunCol,uZen,uHor,uHaze;uniform float uFogD,uSunI,uTime;
vec3 skyCol(vec3 d){float y=max(d.y,0.);vec3 c=mix(uHor,uZen,pow(y,.42));float sd=max(dot(d,uSunDir),0.);
 c+=uSunCol*(pow(sd,9.)*.55+pow(sd,90.)*1.2)*clamp(uSunI*.4,0.,1.6);c=mix(c,uHaze*1.08,exp(-y*7.)*.55);return c;}
vec3 aerial(vec3 col,vec3 wp,vec3 cam){vec3 d=wp-cam;float dist=length(d);d/=dist;
 float hf=exp(-max(wp.y,0.)*.0085);float f=1.-exp(-max(dist-30.,0.)*uFogD*(.32+.9*hf));float sd=pow(max(dot(d,uSunDir),0.),6.);
 vec3 fc=uHaze*.72*(1.+sd*1.3*clamp(uSunI*.35,0.,1.));return mix(col,fc,clamp(f,0.,.97));}
`;

export function cityMount(host,opt){opt=opt||{};
 const tierName=opt.tier||'high',T=TIERS[tierName]||TIERS.high,seed=(opt.seed||Date.now())>>>0,R=rng(seed);
 const city=opt.city||CITIES[Math.floor(R()*CITIES.length)],L=Object.assign({},LOOKS[city.look]||LOOKS.sunset);
 const canvas=document.createElement('canvas');canvas.className='owqcity';canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block';host.appendChild(canvas);
 let renderer;try{renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance',stencil:false})}catch(e){canvas.remove();return null}
 const dprMax=Math.min(window.devicePixelRatio||1,T.dpr);let scale=1;
 renderer.setPixelRatio(dprMax);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=L.exp||(L.sunEl>0?.62:1.0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 if(T.shadow){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap}
 const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(46,1,.1,6000);
 const el=THREE.MathUtils.degToRad(L.sunEl),az=THREE.MathUtils.degToRad(L.sunAz),sunDir=new THREE.Vector3(Math.sin(az)*Math.cos(el),Math.sin(el),-Math.cos(az)*Math.cos(el)).normalize();
 const moonDir=new THREE.Vector3(-.4,.35,-1).normalize(),lightDir=L.sunEl>-4?sunDir:moonDir;
 const U={uSunDir:{value:sunDir},uSunCol:{value:v3(L.sun)},uZen:{value:v3(L.zen)},uHor:{value:v3(L.hor)},uHaze:{value:v3(L.haze)},uFogD:{value:L.fogD},uSunI:{value:L.sunI},uTime:{value:0},uCam:{value:cam.position}};
 /* ---- sky dome with stars and a soft cloud band ---- */
 const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:Object.assign({uStars:{value:L.stars}},U),
  vertexShader:`varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}`,
  fragmentShader:GLSL_COMMON+`uniform float uStars;varying vec3 vD;void main(){vec3 d=normalize(vD);vec3 c=skyCol(d);
   float cl=fbm(d.xz/(d.y+.12)*1.6+vec2(uTime*.004,0.));float band=smoothstep(.02,.22,d.y)*smoothstep(.55,.18,d.y);c=mix(c,mix(uHaze,uHor,.5)*1.05,smoothstep(.55,.85,cl)*band*.55);
   if(uStars>0.){vec2 g=floor(d.xz/(d.y+.3)*260.);float st=step(.9975,h21(g))*smoothstep(.1,.5,d.y);c+=vec3(st)*uStars*(.6+.4*sin(uTime*3.+g.x));}
   gl_FragColor=vec4(c,1.);}`});
 const sky=new THREE.Mesh(new THREE.SphereGeometry(5000,48,24),skyMat);scene.add(sky);
 /* environment for reflections (car paint, glass) from the same sky */
 let envTex=null;try{const pm=new THREE.PMREMGenerator(renderer),es=new THREE.Scene();const sm=skyMat.clone();sm.uniforms=Object.assign({},skyMat.uniforms);es.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),sm));
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshBasicMaterial({color:new THREE.Color(L.haze[0]*.25,L.haze[1]*.25,L.haze[2]*.3)}));gl.rotation.x=-Math.PI/2;gl.position.y=-2;es.add(gl);
  envTex=pm.fromScene(es,.02).texture;pm.dispose()}catch(e){}
 scene.environment=envTex;
 /* ---- lights ---- */
 const sun=new THREE.DirectionalLight(new THREE.Color(...L.sun),L.sunEl>-4?L.sunI*.9:.25);sun.position.copy(lightDir).multiplyScalar(300);scene.add(sun);
 if(T.shadow){sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);const sc=sun.shadow.camera;sc.left=-40;sc.right=40;sc.top=40;sc.bottom=-40;sc.near=10;sc.far=700;sun.shadow.bias=-.0004;sun.target.position.set(0,0,-20);scene.add(sun.target)}
 scene.add(new THREE.HemisphereLight(new THREE.Color(...L.zen).multiplyScalar(2.2),new THREE.Color(.18,.14,.12),L.amb*1.4));
 /* ---- towers: instanced boxes with a procedural facade ---- */
 const bGeo=new THREE.BoxGeometry(1,1,1);bGeo.translate(0,.5,0);
 const bMat=new THREE.ShaderMaterial({uniforms:Object.assign({uLit:{value:L.lit},uNeon:{value:L.neon},uAmb:{value:L.amb},uLightDir:{value:lightDir}},U),
  vertexShader:`attribute vec4 aB;varying vec3 vWP,vN,vL;varying vec4 vB;void main(){vB=aB;vec4 w=modelMatrix*instanceMatrix*vec4(position,1.);vWP=w.xyz;
   vN=normalize(mat3(modelMatrix*instanceMatrix)*normal);vec3 sc=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));vL=(position+vec3(.5,0.,.5))*sc;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:GLSL_COMMON+`uniform float uLit,uNeon,uAmb;uniform vec3 uLightDir;uniform vec3 uCam;varying vec3 vWP,vN,vL;varying vec4 vB;
   void main(){vec3 n=normalize(vN);float sd=vB.x;vec3 V=normalize(uCam-vWP);
    vec3 base=mix(vec3(.16,.17,.19),vec3(.30,.29,.27),h11(sd*7.1));base=mix(base,vec3(.07,.10,.14),step(.55,h11(sd*3.3)));
    float top=step(.6,n.y);float u=abs(n.x)>.5?vL.z:vL.x;float fh=mix(3.4,4.2,h11(sd*5.7)),fw=mix(1.6,2.6,h11(sd*9.1));
    vec2 cell=vec2(floor(u/fw),floor(vL.y/fh)),fr=vec2(fract(u/fw),fract(vL.y/fh));
    float win=step(.1,fr.x)*step(fr.x,.9)*step(.22,fr.y)*step(fr.y,.86)*(1.-top);float band=step(.8,h11(sd*2.9));win=mix(win,step(.18,fr.y)*step(fr.y,.9)*step(.05,fr.x)*step(fr.x,.95)*(1.-top),band);
    float lit=step(1.-uLit*mix(.6,1.4,h11(sd*4.4)),h21(cell+sd*17.));
    float aa=clamp(max(fwidth(u/fw),fwidth(vL.y/fh))*2.2-.2,0.,1.);win=mix(win,.48*(1.-top),aa);lit=mix(lit,uLit*.8,aa);vec3 lc=mix(vec3(1.,.78,.48),vec3(.62,.86,1.),step(.7,h21(cell*1.7+sd)));
    vec3 R=reflect(-V,n);vec3 refl=skyCol(normalize(vec3(R.x,abs(R.y)+.02,R.z)));float fres=.06+.94*pow(1.-max(dot(n,V),0.),5.);
    float ndl=max(dot(n,uLightDir),0.);vec3 diff=base*(uSunCol*ndl*uSunI*.55+mix(uHor,uZen,.5)*uAmb*1.2);
    vec3 glass=mix(vec3(.015,.02,.03),refl*.5,fres*.85)+uSunCol*pow(max(dot(R,uSunDir),0.),220.)*uSunI*2.;
    vec3 col=mix(diff,glass,win*.92);col+=win*lit*lc*mix(.6+.6*h21(cell+3.),.7,aa)*(.18+uLit*.75);
    float strip=step(.93,h11(sd*13.))*(1.-top)*smoothstep(.06,.0,abs(fr.x-.5)-.42+0.*fr.y);vec3 nc=mix(vec3(0.,.9,1.),vec3(1.,.15,.6),step(.5,h11(sd*21.)));col+=strip*nc*1.5*uNeon*step(.6,h11(sd*31.));
    float edge=(1.-smoothstep(.0,.35,min(vL.y,1.e3)))*.25;col*=1.-edge;col*=mix(.55,1.,smoothstep(0.,60.,vL.y));
    col=mix(col,col*.7+vec3(.02),top);gl_FragColor=vec4(aerial(col,vWP,uCam),1.);}`});
 const N=T.inst,inst=new THREE.InstancedMesh(bGeo,bMat,N),aB=new Float32Array(N*4),m=new THREE.Matrix4(),q=new THREE.Quaternion(),p=new THREE.Vector3(),s=new THREE.Vector3();
 let k=0;const place=(x,z,w,d,h)=>{if(k>=N)return;p.set(x,0,z);s.set(w,h,d);m.compose(p,q,s);inst.setMatrixAt(k,m);aB[k*4]=R()*100;aB[k*4+1]=h;k++};
 /* near rows that line the boulevard, then dense blocks, then the far skyline */
 const NEAR=[];for(let side=-1;side<=1;side+=2)for(let z=10;z>-700;){const near=z>-260,w=12+R()*22,d=12+R()*20,h=near?(7+R()*24)*(R()<.18?1.9:1):(60+R()*200)*(R()<.14?1.7:1),x=side*((near?34:66+(-z)*.05)+w/2+R()*(near?12:20));place(x,z-d/2,w,d,h);if(near)NEAR.push({x,z:z-d/2,w,d,h,side});z-=d+(near?8:6)+R()*10}
 for(let i=0;k<N*.7&&i<N*4;i++){const z=-80-R()*1500,x=(R()*2-1)*(240+(-z)*.6);if(Math.abs(x)<(z>-260?50:90)+(-z)*.06)continue;const nz=z>-260,big=R()<.1,w=14+R()*30,d=14+R()*30,h=nz?(8+R()*30):(big?180+R()*360:40+R()*170)*(1+(-z)/1500);place(x,z,w,d,h)}
 for(;k<N;){const z=-1300-R()*2200,x=(R()*2-1)*(900+(-z)*.4),w=30+R()*70,d=30+R()*70,h=60+R()*420;place(x,z,w,d,h)}
 inst.count=k;inst.geometry.setAttribute('aB',new THREE.InstancedBufferAttribute(aB,4));inst.frustumCulled=false;scene.add(inst);
 /* ---- hero towers with crowns and spires near the vanishing point ---- */
 const heroMat=new THREE.MeshStandardMaterial({color:0x1b1f27,metalness:.85,roughness:.22,envMapIntensity:1.1});
 for(let i=0;i<7;i++){const x=(i%2?1:-1)*(40+R()*200),z=-520-R()*520,h=380+R()*420,w=36+R()*30,g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),bMat);body.position.y=h/2;g.add(body);
  const crown=new THREE.Mesh(new THREE.CylinderGeometry(w*.18,w*.45,h*.12,8),heroMat);crown.position.y=h+h*.06;g.add(crown);
  const spire=new THREE.Mesh(new THREE.CylinderGeometry(.6,1.4,h*.22,6),new THREE.MeshBasicMaterial({color:new THREE.Color(1.6,.3,.5)}));spire.position.y=h*1.23;g.add(spire);
  g.position.set(x,0,z);scene.add(g);body.onBeforeRender=()=>{};
  /* the facade shader needs instance data: give the hero a single-instance mesh instead */
  g.remove(body);const hi=new THREE.InstancedMesh(bGeo,bMat,1);m.compose(new THREE.Vector3(0,0,0),q,new THREE.Vector3(w,h,w));hi.setMatrixAt(0,m);hi.geometry=bGeo.clone();hi.geometry.setAttribute('aB',new THREE.InstancedBufferAttribute(new Float32Array([R()*100,h,0,0]),4));g.add(hi)}
 /* ---- neon billboards ---- */
 const words=['ONLY WINNERS','OWQ','QUITTERS NEVER','24 / 7','LIVE','CLOSE IT','NEO','PROTECT FAMILIES','FINANCIAL FREEDOM',city.n.toUpperCase(),'LEARN BEFORE YOU EARN','WIN'];
 const pal=[['#ff1f4f','#ffcf40'],['#00e5ff','#ff3fd0'],['#ffb020','#ff1f4f'],['#7cff6b','#00e5ff'],['#b55cff','#ff6bd6'],['#ffffff','#00e5ff']];
 const bbTex=(i)=>{const c=document.createElement('canvas'),W=512,H=i%3===0?1024:384;c.width=W;c.height=H;const x=c.getContext('2d'),pc=pal[i%pal.length];
  const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#05040a');g.addColorStop(1,'#120615');x.fillStyle=g;x.fillRect(0,0,W,H);
  x.globalCompositeOperation='lighter';for(let j=0;j<6;j++){x.fillStyle=pc[j%2]+'33';x.beginPath();x.arc(R()*W,R()*H,40+R()*160,0,7);x.fill()}
  x.strokeStyle=pc[0];x.lineWidth=10;x.shadowColor=pc[0];x.shadowBlur=30;x.strokeRect(16,16,W-32,H-32);
  const w=words[i%words.length];x.fillStyle=pc[1];x.shadowColor=pc[1];x.shadowBlur=40;x.textAlign='center';x.textBaseline='middle';
  if(H>W){x.font='900 120px Impact, Arial Black, sans-serif';const L2=w.replace(/ /g,'').slice(0,7).split('');L2.forEach((ch,j)=>x.fillText(ch,W/2,110+j*(H-160)/Math.max(1,L2.length)))}
  else{let fs=150;x.font='900 '+fs+'px Impact, Arial Black, sans-serif';while(x.measureText(w).width>W-60&&fs>40){fs-=8;x.font='900 '+fs+'px Impact, Arial Black, sans-serif'}x.fillText(w,W/2,H/2)}
  for(let y=0;y<H;y+=4){x.fillStyle='rgba(0,0,0,.18)';x.fillRect(0,y,W,1)}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t};
 const bbs=[],poleM=new THREE.MeshStandardMaterial({color:0x22232a,metalness:.6,roughness:.5});const hosts=NEAR.filter(b=>b.z>-240).sort((a,b)=>b.z-a.z);
 for(let i=0;i<T.bb&&i<hosts.length;i++){const H=hosts[Math.floor(i*hosts.length/T.bb)],tall=H.h>24&&i%3===0,w=tall?Math.min(9,H.d*.7):Math.min(16,H.d*.9),h=tall?Math.min(18,H.h*.7):6.5,mat=new THREE.MeshBasicMaterial({map:bbTex(i),color:new THREE.Color(1.5*L.neon,1.5*L.neon,1.5*L.neon),side:THREE.DoubleSide});
  const b=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat),face=H.x-H.side*H.w/2;let y;
  if(tall){y=Math.max(h/2+4,H.h*.55);b.position.set(face-H.side*.25,y,H.z);b.rotation.y=H.side>0?-Math.PI/2:Math.PI/2}
  else{y=H.h+h/2+1.2;b.position.set(face-H.side*1.5,y,H.z);b.rotation.y=(H.side>0?-Math.PI/2:Math.PI/2)+(H.side>0?.5:-.5);for(const o of[-w*.35,w*.35]){const pl=new THREE.Mesh(new THREE.BoxGeometry(.25,1.4,.25),poleM);pl.position.set(b.position.x,H.h+.6,H.z+o);scene.add(pl)}}
  scene.add(b);bbs.push(b)}
 /* ---- ground: wet boulevard, sidewalks, markings ---- */
 const gMat=new THREE.ShaderMaterial({uniforms:Object.assign({uWet:{value:L.wet},uNeon:{value:L.neon}},U),
  vertexShader:`varying vec3 vWP;void main(){vec4 w=modelMatrix*vec4(position,1.);vWP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:GLSL_COMMON+`uniform float uWet,uNeon;uniform vec3 uCam;varying vec3 vWP;void main(){vec2 p=vWP.xz;float ax=abs(p.x);
   float n=fbm(p*.35),n2=fbm(p*3.1);vec3 asp=vec3(.055,.056,.06)*(.75+.5*n)+vec3(.02)*n2;
   float side=step(18.,ax);vec3 walk=vec3(.18,.17,.16)*(.8+.3*fbm(p*.8))*(1.-.25*step(.95,fract(p.y*.5))*side);vec3 col=mix(asp,walk,side);
   float lane=step(ax,.18)*step(.5,fract(p.y/9.));float edge=step(abs(ax-16.6),.14);float lane2=step(abs(ax-8.2),.1)*step(.55,fract(p.y/6.));
   col=mix(col,vec3(.85,.66,.25),lane*(1.-side));col=mix(col,vec3(.82),max(edge,lane2)*(1.-side));
   float cw=step(abs(p.y+70.),3.2)*step(.5,fract(p.x/1.4))*(1.-side);col=mix(col,vec3(.8),cw);
   vec3 V=normalize(uCam-vWP);float puddle=smoothstep(.45,.75,fbm(p*.12+7.))*uWet*(1.-side*.7);float fres=.04+.96*pow(1.-max(V.y,0.),5.);
   vec3 R=reflect(-V,vec3(0.,1.,0.));vec3 rf=skyCol(normalize(vec3(R.x,max(R.y,.03),R.z)));
   float stripe=pow(max(0.,1.-abs(fract(p.y*.02+.5)-.5)*6.),3.)*step(ax,24.);vec3 neonR=mix(vec3(1.,.1,.4),vec3(0.,.8,1.),step(.5,fract(p.y*.013)))*stripe*.35*uNeon;
   col=mix(col,rf*.6+neonR,clamp(fres*(.06+puddle*.55),0.,.8));col+=uSunCol*pow(max(dot(R,uSunDir),0.),60.)*uSunI*puddle*1.4;
   gl_FragColor=vec4(aerial(col,vWP,uCam),1.);}`});
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(8000,8000,1,1),gMat);ground.rotation.x=-Math.PI/2;scene.add(ground);
 const curbMat=new THREE.MeshStandardMaterial({color:0x3a3836,roughness:.9});for(const sx of[-1,1]){const c=new THREE.Mesh(new THREE.BoxGeometry(.3,.18,900),curbMat);c.position.set(sx*17.9,.09,-420);scene.add(c)}
 /* ---- street lights ---- */
 const poleMat=new THREE.MeshStandardMaterial({color:0x2a2b30,metalness:.7,roughness:.4}),headMat=new THREE.MeshBasicMaterial({color:new THREE.Color(5,3.6,2.2)});
 for(let i=0;i<T.lights;i++){const side=i%2?1:-1,z=6-Math.floor(i/2)*34;const g=new THREE.Group();
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.18,9,8),poleMat);pole.position.y=4.5;g.add(pole);const arm=new THREE.Mesh(new THREE.BoxGeometry(2.6,.14,.14),poleMat);arm.position.set(-side*1.2,8.9,0);g.add(arm);
  const head=new THREE.Mesh(new THREE.BoxGeometry(.9,.18,.36),headMat);head.position.set(-side*2.4,8.8,0);g.add(head);g.position.set(side*19,0,z);if(T.shadow)pole.castShadow=true;scene.add(g)}
 /* ---- palms ---- */
 const frondTex=(()=>{const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.strokeStyle='#1d2a17';x.lineWidth=3;x.beginPath();x.moveTo(0,32);x.quadraticCurveTo(128,18,256,34);x.stroke();
  for(let i=8;i<250;i+=5){const y=32-Math.sin(i/256*Math.PI)*12,l=22*(1-i/300);x.strokeStyle=i%10?'#22331a':'#2c4020';x.lineWidth=2.2;x.beginPath();x.moveTo(i,y);x.lineTo(i+6,y-l);x.moveTo(i,y);x.lineTo(i+6,y+l*.9);x.stroke()}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t})();
 const frondMat=new THREE.MeshStandardMaterial({map:frondTex,transparent:true,alphaTest:.3,side:THREE.DoubleSide,roughness:.8,color:0x8a9a78}),trunkMat=new THREE.MeshStandardMaterial({color:0x4a3b2e,roughness:.95});
 for(let i=0;i<T.palms;i++){const side=i%2?1:-1,z=-6-i*18-R()*8,h=9+R()*7,g=new THREE.Group();const tr=new THREE.Mesh(new THREE.CylinderGeometry(.22,.38,h,7,6),trunkMat);tr.position.y=h/2;
  const pa=tr.geometry.attributes.position;for(let j=0;j<pa.count;j++){const y=pa.getY(j)/h+.5;pa.setX(j,pa.getX(j)+Math.pow(y,2)*1.4*side)}tr.geometry.computeVertexNormals();g.add(tr);
  for(let f=0;f<9;f++){const fr=new THREE.Mesh(new THREE.PlaneGeometry(5.5,1.4),frondMat);fr.geometry.translate(2.75,0,0);fr.position.set(1.4*side,h,0);fr.rotation.set(R()*.6-.3,f/9*Math.PI*2,-.5-R()*.4);g.add(fr)}
  g.position.set(side*(21+R()*2),0,z);if(T.shadow)g.traverse(o=>{o.castShadow=true});scene.add(g)}
 /* ---- distant traffic (head / tail lights) and air traffic ---- */
 const tGeo=new THREE.PlaneGeometry(.5,.18),tCnt=T.traffic,tW=new THREE.InstancedMesh(tGeo,new THREE.MeshBasicMaterial({color:new THREE.Color(6,5.6,5),side:THREE.DoubleSide}),tCnt),tR=new THREE.InstancedMesh(tGeo,new THREE.MeshBasicMaterial({color:new THREE.Color(6,.4,.3),side:THREE.DoubleSide}),tCnt);
 const tr=[];for(let i=0;i<tCnt;i++)tr.push({x:(R()<.5?-1:1)*(2+R()*12),z:-40-R()*900,v:(8+R()*10)});scene.add(tW,tR);
 const air=[],airMat=new THREE.MeshBasicMaterial({color:new THREE.Color(4,1.2,1.6)}),airMat2=new THREE.MeshBasicMaterial({color:new THREE.Color(1.2,3,4)});
 for(let i=0;i<(tierName==='low'?6:14);i++){const a=new THREE.Mesh(new THREE.SphereGeometry(.9,6,4),i%2?airMat:airMat2);a.userData={y:120+R()*260,z:-200-R()*900,x:(R()*2-1)*700,v:(R()<.5?-1:1)*(20+R()*30)};scene.add(a);air.push(a)}
 /* ---- foreground coupe (generic wedge sports car) ---- */
 const car=new THREE.Group(),paint=new THREE.MeshPhysicalMaterial({color:0x0d0f14,metalness:.75,roughness:.32,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.4});
 const prof=new THREE.Shape();prof.moveTo(-2.3,.32);prof.lineTo(2.25,.32);prof.quadraticCurveTo(2.42,.36,2.4,.62);prof.lineTo(2.2,.78);prof.lineTo(.95,.98);prof.quadraticCurveTo(.2,1.24,-.85,1.16);prof.lineTo(-2.05,.92);prof.quadraticCurveTo(-2.36,.84,-2.34,.6);prof.lineTo(-2.3,.32);
 const body=new THREE.Mesh(new THREE.ExtrudeGeometry(prof,{depth:1.9,bevelEnabled:true,bevelThickness:.12,bevelSize:.08,bevelSegments:4,curveSegments:16}),paint);body.geometry.translate(0,0,-.95);car.add(body);
 const glassM=new THREE.MeshPhysicalMaterial({color:0x05070a,metalness:.2,roughness:.05,envMapIntensity:1.6,transparent:true,opacity:.92});
 const wsh=new THREE.Shape();wsh.moveTo(.9,1.0);wsh.quadraticCurveTo(.2,1.22,-.8,1.15);wsh.lineTo(-1.45,1.0);wsh.lineTo(.9,1.0);const cab=new THREE.Mesh(new THREE.ExtrudeGeometry(wsh,{depth:1.5,bevelEnabled:false}),glassM);cab.geometry.translate(0,0,-.75);cab.position.y=.02;car.add(cab);
 const wheelM=new THREE.MeshStandardMaterial({color:0x0a0a0b,roughness:.8}),rimM=new THREE.MeshStandardMaterial({color:0x8c8f96,metalness:1,roughness:.25});
 for(const [wx,wz] of [[1.45,1],[-1.5,1],[1.45,-1],[-1.5,-1]]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.3,28),wheelM);w.rotation.x=Math.PI/2;w.position.set(wx,.36,wz*1.02);car.add(w);
  const r=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.31,10),rimM);r.rotation.x=Math.PI/2;r.position.copy(w.position);car.add(r)}
 const tail=new THREE.Mesh(new THREE.BoxGeometry(.05,.07,1.7),new THREE.MeshBasicMaterial({color:new THREE.Color(8,.5,.4)}));tail.position.set(-2.38,.74,0);car.add(tail);
 const spoiler=new THREE.Mesh(new THREE.BoxGeometry(.5,.05,2.0),paint);spoiler.position.set(-2.0,1.08,0);car.add(spoiler);for(const z of[-.8,.8]){const st=new THREE.Mesh(new THREE.BoxGeometry(.06,.18,.06),paint);st.position.set(-2.0,.98,z);car.add(st)}
 const head=new THREE.Mesh(new THREE.BoxGeometry(.04,.05,.5),new THREE.MeshBasicMaterial({color:new THREE.Color(5,5,5.5)}));for(const z of[-.6,.6]){const h=head.clone();h.position.set(2.38,.62,z);car.add(h)}
 car.position.set(3.4,0,-12);car.rotation.y=Math.PI*.6;if(T.shadow){car.traverse(o=>{o.castShadow=true});ground.receiveShadow=true}scene.add(car);
 const carShadow=new THREE.Mesh(new THREE.PlaneGeometry(5.8,2.8),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.55,depthWrite:false}));carShadow.rotation.x=-Math.PI/2;carShadow.position.set(3.4,.02,-12);carShadow.rotation.z=Math.PI*.6;scene.add(carShadow);
 /* ---- rain ---- */
 let rain=null;if(L.rain){const n=tierName==='low'?1200:4000,g=new THREE.BufferGeometry(),pos=new Float32Array(n*6);for(let i=0;i<n;i++){const x=(R()*2-1)*40,y=R()*40,z=-R()*80+10;pos.set([x,y,z,x+.05,y-.9,z],i*6)}g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  rain=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x8899aa,transparent:true,opacity:.35}));scene.add(rain)}
 /* ---- post: bloom, sun shafts, grade ---- */
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,cam));
 const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.32*T.bloom+.12*L.neon,.55,1.15);composer.addPass(bloom);
 const grade=new ShaderPass({uniforms:{tDiffuse:{value:null},uSun:{value:new THREE.Vector2(.5,.5)},uShaft:{value:T.shafts&&L.sunEl>-3?.2:0},uTime:{value:0},uRes:{value:new THREE.Vector2(1,1)},uFade:{value:0}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 uSun,uRes;uniform float uShaft,uTime,uFade;varying vec2 vUv;
   float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
   void main(){vec2 uv=vUv;vec2 d=uv-.5;float r=dot(d,d);vec2 ca=d*.0035*r*4.;vec3 c;c.r=texture2D(tDiffuse,uv+ca).r;c.g=texture2D(tDiffuse,uv).g;c.b=texture2D(tDiffuse,uv-ca).b;
    if(uShaft>0.){vec2 st=(uv-uSun)/18.;vec2 q=uv;float il=1.;vec3 acc=vec3(0.);for(int i=0;i<18;i++){q-=st;vec3 s=texture2D(tDiffuse,q).rgb;acc+=max(s-vec3(1.),0.)*il;il*=.92;}c+=acc*uShaft*.07;}
    float l=dot(c,vec3(.299,.587,.114));c=mix(c,c*vec3(.92,1.0,1.06),smoothstep(.4,0.,l)*.35);c=mix(c,c*vec3(1.06,1.0,.92),smoothstep(.5,1.,l)*.3);
    c*=1.-r*.9;c+=(h(uv*uRes+uTime)-.5)*.035;c*=1.-uFade;gl_FragColor=vec4(c,1.);}`});
 composer.addPass(grade);composer.addPass(new OutputPass());
 /* ---- camera path: slow street-level dolly past the car toward the skyline ---- */
 const look=new THREE.Vector3();let t0=performance.now(),last=t0,raf=0,dead=false,fpsT=0,fpsN=0,still=!!opt.still,leaving=0,leaveT=0;
 function size(){const w=host.clientWidth||innerWidth,h=host.clientHeight||innerHeight;cam.aspect=w/h;cam.fov=w/h<1?62:46;cam.updateProjectionMatrix();renderer.setPixelRatio(dprMax*scale);renderer.setSize(w,h,false);composer.setPixelRatio(dprMax*scale);composer.setSize(w,h);
  bloom.resolution.set(Math.max(128,w*T.bloom*.5),Math.max(128,h*T.bloom*.5));grade.uniforms.uRes.value.set(w,h)}
 size();const onR=()=>size();addEventListener('resize',onR,{passive:true});
 const sunScr=new THREE.Vector3();
 function frame(now){if(dead)return;raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;const t=(now-t0)/1000;U.uTime.value=t;grade.uniforms.uTime.value=t%100;
  const a=Math.sin(t*.045),b=Math.sin(t*.031+1.3);let z=1.5+Math.sin(t*.05)*3.5;if(still)z=2;
  cam.position.set(-2.6+a*1.6,2.1+Math.sin(t*.7)*.025+(leaving?leaveT*leaveT*18:0),z+(leaving?-leaveT*leaveT*70:0));look.set(10+b*8,46+a*4,-520);cam.lookAt(look);U.uCam.value=cam.position;
  for(let i=0;i<tr.length;i++){const o=tr[i];o.z+=(o.x>0?1:-1)*o.v*dt;if(o.z>20)o.z=-900;if(o.z<-940)o.z=10;m.makeRotationY(0);m.setPosition(o.x,.7,o.z);(o.x>0?tR:tW).setMatrixAt(i,m);m.setPosition(-9999,0,0);(o.x>0?tW:tR).setMatrixAt(i,m)}tW.instanceMatrix.needsUpdate=true;tR.instanceMatrix.needsUpdate=true;
  air.forEach(o=>{const u=o.userData;u.x+=u.v*dt;if(u.x>800)u.x=-800;if(u.x<-800)u.x=800;o.position.set(u.x,u.y+Math.sin(t+u.z)*2,u.z)});
  if(rain){rain.position.y=-((t*28)%40);rain.position.z=cam.position.z}
  bbs.forEach((b,i)=>{b.material.color.setScalar(1.6*L.neon*(i%5===0?(.82+.18*Math.sin(t*6+i)):1))});
  sunScr.copy(sunDir).multiplyScalar(4000).add(cam.position).project(cam);grade.uniforms.uSun.value.set(sunScr.x*.5+.5,sunScr.y*.5+.5);
  if(leaving){leaveT=Math.min(1,leaveT+dt/0.9);grade.uniforms.uFade.value=leaveT}
  composer.render();
  /* dynamic resolution: keep it smooth, sharpen back up when there is headroom */
  fpsT+=dt;fpsN++;if(fpsT>1.2){const fps=fpsN/fpsT;fpsT=0;fpsN=0;const ns=fps<40?Math.max(.55,scale-.12):fps>57?Math.min(1,scale+.06):scale;if(Math.abs(ns-scale)>.01){scale=ns;size()}}
  if(still){cancelAnimationFrame(raf);raf=0}}
 raf=requestAnimationFrame(frame);
 const api={city:Object.assign({},city),look:city.look,tier:tierName,
  leave(){leaving=1},
  stop(){if(dead)return;dead=true;cancelAnimationFrame(raf);removeEventListener('resize',onR);try{scene.traverse(o=>{if(o.geometry)o.geometry.dispose();const mm=o.material;if(mm){(Array.isArray(mm)?mm:[mm]).forEach(x=>{if(x.map)x.map.dispose();x.dispose()})}});if(envTex)envTex.dispose();composer.dispose&&composer.dispose();renderer.dispose();renderer.forceContextLoss()}catch(e){}canvas.remove()},
  info(){return{scale,dpr:dprMax,buildings:k,city:city.n,look:city.look,tier:tierName}}};
 return api}
export const CITY_LIST=CITIES;
