import * as THREE from 'three';
import {limb,sph,cyl,rbox,lathe,tube} from './geo.js';
import {clamp,lerp,damp,sstep,hash,rng} from './util.js';
import {COS,hat as bpHat,extra as bpExtra,headset as bpHeadset,aura as bpAura} from './cosm.js';

export const SKIN=['#f7d8c6','#efc1a0','#d9a175','#b97c50','#8e5a38','#5e3a25'];
export const HAIRC=['#15100e','#3b2517','#6c4424','#a8703f','#e2be7b','#d2d2d8','#b8382d','#283050'];
export const HAIRS=['Short','Fade','Long','Bun','Curly','Ponytail','Buzz','Bald','Slick','Afro'];
export const OUTS=['Tee','Polo','Blazer','Hoodie','Shirt + tie'];
export const OUTS_ALL=COS.o;
export const OUTC=['#ff1f4f','#17171d','#f2f2f2','#2a64ff','#12b58a','#f2b33d','#7c3cff','#ff7a1a','#0d5068','#c9a35c'];
/* Battle Pass colors 10-15: [hex, roughness, metalness, emissive] */
export const OUTC_BP=[['#e3b04f',.24,1,0],['#e6e8ee',.12,1,0],['#09090b',.16,.35,0],['#ff2bd6',.5,0,'#5a0a4c'],['#14e6ff',.5,0,'#06485a'],['#7a0019',.96,0,0]];
export const OUTC_ALL=OUTC.concat(OUTC_BP.map(x=>x[0]));
export const ACC=['None','Shades','Gold chain','Cap','Glasses','Miami mode'];
export const PANTS=['#1d2130','#26262e','#c9b48f','#ececec'];
const LIM={s:8,h:10,c:8,o:13,k:16,a:6,p:4,m:2,H:14,B:8,G:5,D:7,C:7,I:9,R:4,T:9,N:5,E:6,V:6,W:11,X:20,Y:12,Z:12,Q:6};
export const BPKEYS='HBGDCIRTNEVWXYZQ';
export function parseLook(code,name){const h=hash(name||'x');const d={s:h%6,h:(h>>>3)%10,c:(h>>>7)%8,o:(h>>>11)%5,k:(h>>>14)%10,a:[0,0,0,1,2,0,4,0,5,0][(h>>>18)%10],p:(h>>>22)%4,m:0};for(const k of 'HBGDCIRTNEVWXYZQ')d[k]=0;
  if(d.h===7&&(h>>>25)%3)d.h=1;
  if(typeof code==='string'){const re=/([shcokapmHBGDCIRTNEVWXYZQ])(\d{1,2})/g;let m;while((m=re.exec(code))){const v=+m[2];if(v<LIM[m[1]])d[m[1]]=v}}return d}
export const lookCode=d=>`s${d.s}h${d.h}c${d.c}o${d.o}k${d.k}a${d.a}p${d.p}`+(d.m?'m1':'')+[...'HBGDCIRTNEVWXYZQ'].map(k=>d[k]?k+d[k]:'').join('');

const MC=new Map();
function std(col,r=.6,mt=0,ex){const k=col+'|'+r+'|'+mt+'|'+(ex?JSON.stringify(ex):'');let m=MC.get(k);if(!m){m=new THREE.MeshStandardMaterial(Object.assign({color:col,roughness:r,metalness:mt},ex||{}));MC.set(k,m)}return m}
function basic(col,o){const k='b'+col+(o?JSON.stringify(o):'');let m=MC.get(k);if(!m){m=new THREE.MeshBasicMaterial(Object.assign({color:col},o||{}));MC.set(k,m)}return m}
const GC=new Map();
function G(k,mk){let g=GC.get(k);if(!g){g=mk();GC.set(k,g)}return g}

const HAPPYE=new Set(['floss','griddy','disco','hypejump','belt','airguitar','dab','chestpound','moneygun','sprinkler']);
const STANDE=new Set(['bow','floss','robot','sprinkler','griddy','airguitar','disco','hypejump','micdrop','belt']);
const R=.26;               // head radius
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

export class Avatar{
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
  build(){const L=this.look,skin=SKIN[L.s]||(L.s===6?'#e3b04f':'#dff3ff'),hairC=HAIRC[L.c],out=L.o,outC=OUTC_ALL[L.k]||OUTC[0],pantsC=PANTS[L.p],own=this.own=[];this.cup=[];
    const sk=new THREE.Color(skin);const mSkin=L.s===6?std('#e3b04f',.22,1):L.s===7?std('#dff3ff',.05,.25,{emissive:'#2a5470',emissiveIntensity:.55}):std(skin,.58,0,{emissive:'#'+sk.clone().multiplyScalar(.07).getHexString()});
    const KP=L.k>=10?OUTC_BP[L.k-10]:null;
    const mShirt=out===7?std('#0d0d10',.4,.1):out===8?std('#141416',.3,.18):out===12?std('#e3b04f',.26,1):KP?std(KP[0],KP[1],KP[2],KP[3]?{emissive:KP[3]}:undefined):std(outC,out===2?.55:.78,0),mPants=std(pantsC,.82),mShoe=std('#101014',.35,.1),mHair=std(hairC,.46,0),mEye=std('#07070a',.1,0,{envMapIntensity:2.2});
    const mDark=std('#202024',.4,.3),mAcc=std('#ff1f4f',.35,.2),mGold=std('#e8bd62',.22,1),mWhite=std('#f4f4f4',.6);
    const mic=this.micMat=new THREE.MeshBasicMaterial({color:new THREE.Color(.2,1,.5)});own.push(mic);
    const rig=this.rig=new THREE.Group();this.root.add(rig);
    const hip=this.hip=new THREE.Group();hip.position.y=.6;rig.add(hip);
    const torso=this.torso=new THREE.Group();hip.add(torso);
    const tm=new THREE.Mesh(G('torso',()=>lathe(TP,32)),mShirt);tm.scale.z=TZ;tm.castShadow=true;torso.add(tm);
    // outfit details
    if(out===1){[-1,1].forEach(s=>{const c=new THREE.Mesh(G('col',()=>rbox(.1,.016,.06,.006)),mShirt);c.position.set(s*.05,.43,.075);c.rotation.set(-.5,s*.5,s*.25);torso.add(c)});
      [.37,.32].forEach(y=>{const b=new THREE.Mesh(G('btn',()=>sph(.009,8,6)),mWhite);b.position.set(0,y,tr(y)*TZ+.004);torso.add(b)})}
    if(out===2||out===4){const v=new THREE.Mesh(G('vee',()=>frontStrip(.2,.445,t=>.008+t*.072,0,8,.003)),out===2?mWhite:std(outC,.7));torso.add(v);
      const tie=new THREE.Mesh(G('tie',()=>frontStrip(.17,.43,t=>t>.88?.02:.028-t*.018,0,8,.007)),out===2?mAcc:std(L.k===0?'#17171d':'#ff1f4f',.5));torso.add(tie);
      if(out===2){[-1,1].forEach(s=>{const lp=new THREE.Mesh(G('lapel'+s,()=>{const g=frontStrip(.21,.445,t=>.014,0,8,.006);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),t=(y-.21)/.235;p.setX(i,p.getX(i)+s*(.012+t*.072));const rr=tr(y),x=p.getX(i);p.setZ(i,Math.sqrt(Math.max(0,rr*rr-x*x))*TZ+.006)}g.computeVertexNormals();return g}),std('#0d0d10',.5));torso.add(lp)})}}
    if(out===5||out===6||out===9){const wm=std('#f4f4f4',.85);[.02,.05].forEach(y=>{const b=new THREE.Mesh(G('band'+y,()=>frontStrip(y,y+.022,t=>.19,0,2,.004)),wm);torso.add(b)});
      if(out===9){const num=(hash(this.nm)%98)+1;const c=document.createElement('canvas');c.width=128;c.height=128;const x=c.getContext('2d');x.font='900 92px Verdana';x.textAlign='center';x.textBaseline='middle';x.lineWidth=8;x.strokeStyle='#fff';x.strokeText(num,64,70);x.fillStyle=L.k===2?'#17171d':'#ffffff';x.fillText(num,64,70);
        const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const nm=new THREE.MeshStandardMaterial({map:t,transparent:true,roughness:.8,depthWrite:false});own.push(nm,t);const pl=new THREE.Mesh(frontStrip(.12,.36,u=>.11,0,8,.006),nm);
        const P=pl.geometry.attributes.position;if(!pl.geometry.attributes.uv)pl.geometry.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(P.count*2),2));const uv=pl.geometry.attributes.uv;for(let i=0;i<P.count;i++)uv.setXY(i,(P.getX(i)+.11)/.22,(P.getY(i)-.12)/.24);uv.needsUpdate=true;torso.add(pl)}
      if(out===5){const c=document.createElement('canvas');c.width=96;c.height=96;const x=c.getContext('2d');x.font='900 76px Georgia';x.textAlign='center';x.textBaseline='middle';x.lineWidth=10;x.strokeStyle='#f4f4f4';x.strokeText('W',48,52);x.fillStyle='#ff1f4f';x.fillText('W',48,52);
        const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const pm=new THREE.MeshStandardMaterial({map:t,transparent:true,roughness:.9,depthWrite:false});own.push(pm,t);const pl=new THREE.Mesh(new THREE.PlaneGeometry(.09,.09),pm);pl.position.set(-.085,.33,tr(.33)*TZ+.012);pl.rotation.y=-.4;torso.add(pl)}
      if(out===6){const z=new THREE.Mesh(G('zip',()=>frontStrip(.06,.44,t=>.005,0,6,.006)),std('#d8d8de',.3,.8));torso.add(z)}}
    if(out===7||out===12){const v=new THREE.Mesh(G('vee',()=>frontStrip(.2,.445,t=>.008+t*.072,0,8,.003)),out===7?mWhite:std('#0d0d10',.6));torso.add(v);
      [-1,1].forEach(s=>{const lp=new THREE.Mesh(G('lapel'+s,()=>{const g=frontStrip(.21,.445,t=>.014,0,8,.006);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),t=(y-.21)/.235;p.setX(i,p.getX(i)+s*(.012+t*.072));const rr=tr(y),x=p.getX(i);p.setZ(i,Math.sqrt(Math.max(0,rr*rr-x*x))*TZ+.006)}g.computeVertexNormals();return g}),out===7?std('#050507',.15,.2):std('#0d0d10',.5));torso.add(lp)});
      if(out===7&&!L.B){[-1,1].forEach(s=>{const w=new THREE.Mesh(G('bt',()=>sph(1,12,8)),std('#050507',.3));w.scale.set(.04,.026,.016);w.position.set(s*.036,.43,.114);w.rotation.z=s*.25;torso.add(w)})}
      if(out===12){const tie=new THREE.Mesh(G('tie',()=>frontStrip(.17,.43,t=>t>.88?.02:.028-t*.018,0,8,.007)),std('#e3b04f',.24,1));torso.add(tie)}}
    if(out===8){[-1,1].forEach(s=>{const c=new THREE.Mesh(G('lcol'+s,()=>rbox(.13,.02,.07,.008)),mShirt);c.position.set(s*.07,.42,.07);c.rotation.set(-.6,s*.55,s*.3);torso.add(c)});const z=new THREE.Mesh(G('lzip',()=>frontStrip(.05,.4,t=>.004,.045,6,.006)),std('#c8c8cc',.25,1));torso.add(z)}
    if(out===10){const c=document.createElement('canvas');c.width=256;c.height=256;const x=c.getContext('2d');x.fillStyle=outC;x.fillRect(0,0,256,256);const R2=rng(this.seed);
      for(let i=0;i<26;i++){const cx=R2()*256,cy=R2()*256,r=10+R2()*14,col=['#fff6dc','#ffcf40','#ff7ab6','#3ddc97'][i%4];x.fillStyle=col;for(let k=0;k<5;k++){const a=k/5*6.283;x.beginPath();x.ellipse(cx+Math.cos(a)*r*.6,cy+Math.sin(a)*r*.6,r*.5,r*.28,a,0,6.283);x.fill()}x.fillStyle='#7a2a10';x.beginPath();x.arc(cx,cy,r*.18,0,6.283);x.fill()}
      const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,1.6);const hm=new THREE.MeshStandardMaterial({map:t,roughness:.75});own.push(hm,t);tm.material=hm;this._hw=hm}
    if(out===11){const pm=std(outC,.55,.05);[.07,.15,.23,.31].forEach(y=>{const r=new THREE.Mesh(G('puf'+y,()=>new THREE.TorusGeometry(tr(y)+.006,.024,8,36)),pm);r.rotation.x=Math.PI/2;r.position.y=y;r.scale.set(1,TZ,1);torso.add(r)})}
    if(out===3){const hood=new THREE.Mesh(G('hood',()=>new THREE.TorusGeometry(.12,.05,10,24,Math.PI)),mShirt);hood.position.set(0,.42,-.09);hood.rotation.set(.35,0,Math.PI);torso.add(hood);
      const pk=new THREE.Mesh(G('pocket',()=>frontStrip(.05,.17,t=>.11-t*.02,0,6,.006)),std(new THREE.Color(outC).multiplyScalar(.75).getStyle(),.85));torso.add(pk);
      [-1,1].forEach(s=>{const st=new THREE.Mesh(G('str',()=>limb(.006,.1,2,6)),mWhite);st.position.set(s*.035,.42,.13);st.rotation.x=-.25;torso.add(st)})}
    const neck=new THREE.Mesh(G('neck',()=>cyl(.055,.06,.08,16)),mSkin);neck.position.y=.47;torso.add(neck);
    if(L.a===2||L.a===5){const ch=new THREE.Mesh(G('chain',()=>new THREE.TorusGeometry(.13,.011,8,40)),mGold);ch.position.set(0,.41,.035);ch.rotation.x=Math.PI/2-.55;torso.add(ch);
      const md=new THREE.Mesh(G('medal',()=>cyl(.032,.032,.01,20)),mGold);md.position.set(0,.33,tr(.33)*TZ+.012);md.rotation.x=Math.PI/2-.12;torso.add(md)}
    // head
    const hp=this.headP=new THREE.Group();hp.position.y=.5;torso.add(hp);
    const head=this.head=new THREE.Mesh(G('head',()=>sph(R,44,30)),mSkin);head.position.y=.2;head.scale.set(1,.95,.96);head.castShadow=true;hp.add(head);
    [-1,1].forEach(s=>{const e=new THREE.Mesh(G('ear',()=>sph(.055,14,10)),mSkin);e.position.set(s*.255,-.01,-.005);e.scale.set(.45,1,.75);head.add(e)});
    const nose=new THREE.Mesh(G('nose',()=>sph(.023,14,10)),std(sk.clone().multiplyScalar(.93).getStyle(),.55));nose.position.copy(onHead(0,-.03)).multiplyScalar(.985);nose.scale.set(1,.85,.8);nose.layers.set(1);head.add(nose);
    this.eyes=[];this.hl=[];[-1,1].forEach(s=>{const e=new THREE.Mesh(G('eye',()=>sph(1,18,12)),mEye);e.scale.set(.036,.048,.022);e.layers.set(1);head.add(e);this.eyes.push(e);
      const h=new THREE.Mesh(G('hl',()=>sph(.0095,8,6)),basic('#ffffff'));h.layers.set(1);head.add(h);this.hl.push(h)});
    this.brows=[-1,1].map(s=>{const b=new THREE.Mesh(G('brow',()=>{const g=new THREE.CapsuleGeometry(.0085,.05,3,8);g.rotateZ(Math.PI/2);return g}),std(new THREE.Color(hairC).multiplyScalar(.8).getStyle(),.6));b.layers.set(1);head.add(b);return b});
    [-1,1].forEach(s=>{const c=new THREE.Mesh(G('cheek',()=>new THREE.CircleGeometry(.042,20)),basic('#ff6f86',{transparent:true,opacity:.26,depthWrite:false}));const p=onHead(s*.15,-.06,R+.002);c.position.copy(p);orient(c,p);c.layers.set(1);head.add(c)});
    this.mouth=new Mouth(head,{in:basic('#2b070d'),teeth:std('#f3efe8',.45),tongue:std('#d9606d',.55)});
    this.hair(L,mHair,head);
    // headset
    const band=new THREE.Mesh(G('band',()=>new THREE.TorusGeometry(R*1.1,.016,8,48,Math.PI)),mDark);band.rotation.x=-.12;head.add(band);const hsC=[],hsR=[];
    [-1,1].forEach(s=>{const c=new THREE.Mesh(G('cup',()=>{const g=cyl(.075,.075,.055,28);g.rotateZ(Math.PI/2);return g}),mDark);c.position.set(s*R*1.07,-.01,0);head.add(c);hsC.push(c);
      const r=new THREE.Mesh(G('cupr',()=>{const g=new THREE.TorusGeometry(.06,.009,8,28);g.rotateY(Math.PI/2);return g}),mAcc);r.position.set(s*(R*1.07+.03),-.01,0);head.add(r);hsR.push(r)});
    try{bpHeadset(L.G,{band,cups:hsC,rings:hsR,head})}catch(e){}
    const tip=[-.078,-.118,R*.94];const boom=new THREE.Mesh(G('boom',()=>tube([[-R*1.08,-.05,.05],[-R*.98,-.11,.15],[-.17,-.135,.215],tip],.0075,20,6)),mDark);head.add(boom);
    const mk=new THREE.Mesh(G('mic',()=>sph(.021,12,10)),std('#0a0a0c',.9));mk.position.set(tip[0],tip[1],tip[2]);head.add(mk);
    const led=new THREE.Mesh(G('led',()=>sph(.0085,8,6)),mic);led.position.set(tip[0]-.026,tip[1]+.004,tip[2]-.012);head.add(led);
    // accessories
    if(L.a===1||L.a===5){const mS=std('#050507',.06,.4,{envMapIntensity:2.4});[-1,1].forEach(s=>{const p=onHead(s*.09,.035,R+.016);const l=new THREE.Mesh(G('lens',()=>sph(1,20,12)),mS);l.scale.set(.066,.048,.016);l.position.copy(p);orient(l,p);head.add(l)});
      const br=new THREE.Mesh(G('bridge',()=>rbox(.06,.012,.012,.005)),mS);br.position.copy(onHead(0,.05,R+.012));head.add(br);
      [-1,1].forEach(s=>{const t=new THREE.Mesh(G('temple',()=>rbox(.012,.012,.2,.005)),mS);t.position.set(s*.2,.045,.1);t.rotation.y=s*.2;head.add(t)})}
    if(L.a===4){const mF=std('#1a1a1e',.3,.6);[-1,1].forEach(s=>{const p=onHead(s*.088,.03,R+.014);const rim=new THREE.Mesh(G('rim',()=>new THREE.TorusGeometry(.05,.0055,8,28)),mF);rim.position.copy(p);orient(rim,p);rim.scale.set(1,.85,1);rim.layers.set(1);head.add(rim)});
      const br=new THREE.Mesh(G('bridge2',()=>rbox(.05,.008,.008,.003)),mF);br.position.copy(onHead(0,.045,R+.013));br.layers.set(1);head.add(br)}
    if(L.a===3&&!L.H){const cm=std(L.k===2?'#17171d':outC,.7);const cr=new THREE.Mesh(G('capc',()=>new THREE.SphereGeometry(R*1.1,40,18,0,Math.PI*2,0,1.38)),cm);cr.rotation.x=-.32;head.add(cr);
      const bm=new THREE.Mesh(G('brim',()=>new THREE.CylinderGeometry(.2,.2,.014,32,1,false,-1.15,2.3)),cm);bm.position.set(0,.135,.13);bm.rotation.x=.12;head.add(bm);
      const bt=new THREE.Mesh(G('capb',()=>sph(.018,10,8)),cm);bt.position.set(0,R*1.08,-.08);head.add(bt)}
    // arms
    const sleeveLong=out===2||out===3||out===4||out===5||out===6||out===7||out===8||out===11||out===12;
    this.sh=[];this.el=[];[1,-1].forEach(s=>{const sh=new THREE.Group();sh.position.set(s*.2,.36,0);torso.add(sh);
      const ball=new THREE.Mesh(G('shb',()=>sph(.064,16,12)),mShirt);sh.add(ball);
      const sleeveM=out===5?mWhite:out===11?std('#2a2a33',.8):out===10&&this._hw?this._hw:mShirt;const up=new THREE.Mesh(G('upper',()=>limb(.053,.12)),sleeveM);up.castShadow=true;sh.add(up);
      const el=new THREE.Group();el.position.y=-.17;sh.add(el);
      const fo=new THREE.Mesh(G('fore',()=>limb(.047,.105)),sleeveLong?sleeveM:mSkin);
      if(out===6){[up,fo].forEach((o,j)=>{const st=new THREE.Mesh(G('ts'+j,()=>box(.012,j?.14:.15,.012)),mWhite);st.position.set(s*(j?.046:.052),j?-.07:-.075,0);(j?el:sh).add(st)})}fo.castShadow=true;el.add(fo);
      if(sleeveLong){const cf=new THREE.Mesh(G('cuff',()=>cyl(.05,.05,.025,14)),out===2||out===7?mWhite:out===5?std('#ff1f4f',.8):sleeveM);cf.position.y=-.14;el.add(cf)}
      const hand=new THREE.Mesh(G('hand',()=>sph(.056,16,12)),mSkin);hand.position.y=-.168;hand.scale.set(.95,1.05,.85);el.add(hand);
      this.sh.push(sh);this.el.push(el)});
    // legs
    this.th=[];this.kn=[];[1,-1].forEach(s=>{const th=new THREE.Group();th.position.set(s*.095,0,0);hip.add(th);
      const tg=new THREE.Mesh(G('thigh',()=>limb(.072,.2)),mPants);tg.castShadow=true;th.add(tg);
      const kn=new THREE.Group();kn.position.y=-.27;th.add(kn);
      const sh2=new THREE.Mesh(G('shin',()=>limb(.062,.19)),mPants);sh2.castShadow=true;kn.add(sh2);
      const shoe=new THREE.Mesh(G('shoe',()=>rbox(.115,.075,.2,.035)),mShoe);shoe.position.set(0,-.268,.045);shoe.castShadow=true;kn.add(shoe);
      this.th.push(th);this.kn.push(kn)});
    // Battle Pass hat, extra and aura
    try{if(L.H){const h=bpHat(L.H,head,hairC);if(h.up)this.cup.push(h.up)}}catch(e){}
    try{if(L.B){const x=bpExtra(L.B,this,hairC);if(x.up)this.cup.push(x.up)}}catch(e){}
    try{if(L.V){const a=bpAura(L.V,rig);if(a){this.auraUp=a.up}}else this.auraUp=null}catch(e){}
    rig.traverse(o=>{if(o.isMesh){o.userData.av=this}});
    this.placeFace(0,0);}
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
  emote(k){const D={wave:2.4,clap:2.2,cheer:3.2,dance:4.6,fire:3,money:3.2,laugh:2.2,bell:2.6,nod:1.4,throw:2.0,dizzy:3.6,lift:2.2,shake:1.9,detonate:2.4,dab:1.9,salute:2,chestpound:2.2,bow:2.4,floss:3.4,robot:3.4,sprinkler:3.2,griddy:3.4,airguitar:3.2,disco:3.6,hypejump:2.6,moneygun:3,micdrop:2.8,belt:3.2};this.emo={k,t:0,d:D[k]||2.4}}
  mood(w){const m=this.md;if(this.mdOv)w=this.mdOv;for(const k in m)m[k]=w&&w[k]?w[k]:0}
  moodOn(){return !this.look||this.look.m!==1}
  level(L,hf){this.Lraw=L;if(hf!==undefined)this.hf=hf}
  headPos(out){this.head.getWorldPosition(out);return out}
  update(dt,t,W){const P=this.T;const rnd=this.rand;
    // audio level smoothing
    const Lr=this.muted?0:(this.Lraw||0);this.L=Lr>this.L?damp(this.L,Lr,38,dt):damp(this.L,Lr,11,dt);
    const talking=this.L>.1;if(talking){this.talkT+=dt;this.quietT=0}else{this.quietT+=dt;if(this.quietT>.35)this.talkT=Math.max(0,this.talkT-dt*2)}
    // --- locomotion / mode
    let moving=false;
    if(this.mode==='walk'&&this.path){const tg=this.path[this.pi];const p=this.root.position;const dx=tg[0]-p.x,dz=tg[1]-p.z,d=Math.hypot(dx,dz);
      if(d<.04){this.pi++;if(this.pi>=this.path.length){this.path=null;const f=this.onArrive;this.onArrive=null;f&&f()}}
      else{const st=Math.min(d,this.speed*dt);p.x+=dx/d*st;p.z+=dz/d*st;this.walkPh+=st*5.4;moving=true;const ty=Math.atan2(dx,dz);let dy=ty-this.root.rotation.y;dy=Math.atan2(Math.sin(dy),Math.cos(dy));this.root.rotation.y+=dy*Math.min(1,dt*10)}}
    if(this.mode==='sitting'){let dy=-this.root.rotation.y;dy=Math.atan2(Math.sin(dy),Math.cos(dy));this.root.rotation.y+=dy*Math.min(1,dt*9);const s=this.seat;this.root.position.x=damp(this.root.position.x,s.x,8,dt);this.root.position.z=damp(this.root.position.z,s.sz,8,dt);
      this.sitK=Math.min(1,this.sitK+dt/.6);if(this.sitK>=1&&Math.abs(dy)<.05){this.mode='seated'}}
    if(this.mode==='rising'){this.sitK=Math.max(0,this.sitK-dt/.5);if(this.sitK<=0){this.mode='walk';this.walk(this._leavePath,()=>{this.mode='gone';this._done&&this._done()})}}
    // tossed out the window: the office moves the root, the body flails (then hangs from the parachute)
    const tossed=this.mode==='tossed';if(tossed){this.sitK=Math.max(0,this.sitK-dt/.22);this.typing=false;this.idleK=null}
    // --- emote clock
    const E=this.emo;let ew=0,ek='';if(E){E.t+=dt;ew=sstep(0,.25,E.t)*(1-sstep(E.d-.35,E.d,E.t));ek=E.k;if(E.t>=E.d)this.emo=null}
    const standE=(ek==='cheer'||ek==='dance'||ek==='throw'||STANDE.has(ek))&&this.mode==='seated';this.standK=damp(this.standK,standE&&E.t<E.d-.4?1:0,9,dt);
    const stand=Math.max(1-this.sitK,this.standK);
    // --- idle behaviour scheduling
    this.nextIdle-=dt;if(this.nextIdle<=0&&!this.idleK&&this.mode==='seated'){const r=rnd();this.idleK=r<.28?'stretch':r<.55?'lookcam':r<.75?'lean':'sip';this.idleT=0;this.nextIdle=7+rnd()*14}
    if(this.idleK){this.idleT+=dt;if(this.idleT>3.2)this.idleK=null}
    this.typeT-=dt;if(this.typeT<=0){this.typing=!this.typing;this.typeT=this.typing?1.5+rnd()*4:1+rnd()*3}
    // --- seated base
    const typ=this.typing&&!talking&&W.focusSpeaker!==this?1:0;
    const s={hip:.53,tx:.05,ty:0,tz:0,hx:.16*typ,hy:0,hz:0,lsx:-.56,lsz:.17,lex:-1.12,lez:0,rsx:-.56,rsz:-.17,rex:-1.12,rez:0,ltx:-1.52,lkx:1.46,rtx:-1.52,rkx:1.46,lift:0,sway:0,hpz:0,ltz:0,rtz:0};
    if(typ){s.lex+=Math.sin(t*15.5+this.seed)*.07;s.rex+=Math.sin(t*14.2+this.seed*.7+1.6)*.07;s.tx=.1}
    else{s.lsx=-.5;s.rsx=-.5;s.lex=-1.0;s.rex=-1.0}
    const br=Math.sin(t*1.6+this.seed)*.012;s.tx+=br;
    if(this.idleK){const k=sstep(0,.4,this.idleT)*(1-sstep(2.7,3.2,this.idleT));
      if(this.idleK==='stretch'){s.lsz=lerp(s.lsz,2.75,k);s.rsz=lerp(s.rsz,-2.75,k);s.lsx=lerp(s.lsx,-.15,k);s.rsx=lerp(s.rsx,-.15,k);s.lex=lerp(s.lex,-.35,k);s.rex=lerp(s.rex,-.35,k);s.tx-=.14*k;s.hx-=.25*k}
      else if(this.idleK==='lean'){s.tx-=.18*k;s.lsx=lerp(s.lsx,.25,k);s.rsx=lerp(s.rsx,.25,k);s.lex=lerp(s.lex,-.5,k);s.rex=lerp(s.rex,-.5,k)}
      else if(this.idleK==='sip'){s.rsx=lerp(s.rsx,-1.15,k);s.rex=lerp(s.rex,-1.7,k);s.rsz=lerp(s.rsz,.35,k);s.hx-=.08*k}}
    // talking gestures
    const g=this.gest=damp(this.gest,this.L>.22&&this.talkT>.6?1:0,4,dt);
    if(g>.01){const w=Math.sin(t*5.2+this.seed)*.25*this.L;s.rsx=lerp(s.rsx,-1.05+w,g);s.rex=lerp(s.rex,-1.55-w*.8,g);s.rsz=lerp(s.rsz,-.32,g);s.tx=lerp(s.tx,0,g);
      const g2=sstep(.4,1,Math.sin(t*.9+this.seed*3)*.5+.5)*g;s.lsx=lerp(s.lsx,-.95,g2);s.lex=lerp(s.lex,-1.45,g2)}
    // --- standing base
    const w={hip:.58,tx:.02,ty:0,tz:0,hx:0,hy:0,hz:0,lsx:0,lsz:.13,lex:-.12,lez:0,rsx:0,rsz:-.13,rex:-.12,rez:0,ltx:0,lkx:0,rtx:0,rkx:0,lift:0,sway:0,hpz:0,ltz:0,rtz:0};
    if(moving||(this.mode==='walk')){const ph=this.walkPh,sn=Math.sin(ph);w.ltx=-.55*sn;w.rtx=.55*sn;w.lkx=.65*Math.max(0,Math.sin(ph+1.2));w.rkx=.65*Math.max(0,Math.sin(ph+1.2+Math.PI));w.lsx=.48*sn;w.rsx=-.48*sn;w.lex=-.35;w.rex=-.35;w.lift=.028*Math.abs(Math.cos(ph));w.tx=.07}
    for(const k in s)P[k]=lerp(s[k],w[k],stand);
    // --- emotes
    if(ew>0){const et=E.t;
      if(ek==='wave'){P.rsz=lerp(P.rsz,-2.45,ew);P.rsx=lerp(P.rsx,-.25,ew);P.rex=lerp(P.rex,-.25,ew);P.rez=lerp(P.rez,Math.sin(et*11)*.55,ew);P.hz=lerp(P.hz,.12,ew)}
      else if(ek==='clap'){const c=Math.abs(Math.sin(et*11));P.lsx=lerp(P.lsx,-1.15,ew);P.rsx=lerp(P.rsx,-1.15,ew);P.lsz=lerp(P.lsz,.1+.4*c,ew);P.rsz=lerp(P.rsz,-.1-.4*c,ew);P.lex=lerp(P.lex,-.7,ew);P.rex=lerp(P.rex,-.7,ew);P.lez=lerp(P.lez,-.5,ew);P.rez=lerp(P.rez,.5,ew)}
      else if(ek==='cheer'||ek==='bell'){const j=Math.abs(Math.sin(et*7.5));P.lsz=lerp(P.lsz,2.6+.2*j,ew);P.rsz=lerp(P.rsz,-2.6-.2*j,ew);P.lsx=lerp(P.lsx,-.2,ew);P.rsx=lerp(P.rsx,-.2,ew);P.lex=lerp(P.lex,-.3,ew);P.rex=lerp(P.rex,-.3,ew);P.hx=lerp(P.hx,-.2,ew);if(ek==='cheer'&&this.standK>.5)P.lift+=.14*j*ew*this.standK}
      else if(ek==='dance'){const b=et*7.2;P.sway=lerp(P.sway,Math.sin(b*.5)*.06,ew);P.tz=lerp(P.tz,Math.sin(b*.5)*.16,ew);P.lsx=lerp(P.lsx,Math.sin(b)>0?-2.4:-.4,ew);P.rsx=lerp(P.rsx,Math.sin(b)>0?-.4:-2.4,ew);P.lex=lerp(P.lex,-.9,ew);P.rex=lerp(P.rex,-.9,ew);P.hz=lerp(P.hz,Math.sin(b*.5)*.2,ew);P.hx=lerp(P.hx,Math.sin(b)*.08,ew);P.lift+=Math.abs(Math.sin(b))*.04*ew*this.standK}
      else if(ek==='fire'){const p=Math.abs(Math.sin(et*8));P.rsz=lerp(P.rsz,-2.4-.5*p,ew);P.rex=lerp(P.rex,-1.2*p-.2,ew);P.rsx=lerp(P.rsx,-.3,ew);P.lsx=lerp(P.lsx,-.9,ew);P.lex=lerp(P.lex,-1.6,ew);P.hx=lerp(P.hx,-.12,ew)}
      else if(ek==='money'){const p=(et*2.4)%1;P.rsx=lerp(P.rsx,-2.3+p*1.6,ew);P.rsz=lerp(P.rsz,-.45,ew);P.rex=lerp(P.rex,-.6,ew);P.hx=lerp(P.hx,-.1,ew)}
      else if(ek==='laugh'){P.tx=lerp(P.tx,-.12+Math.sin(et*20)*.03,ew);P.hx=lerp(P.hx,-.24,ew);P.lsx=lerp(P.lsx,-.9,ew);P.lex=lerp(P.lex,-1.7,ew);P.rsx=lerp(P.rsx,-.4,ew)}
      else if(ek==='nod'){P.hx=lerp(P.hx,Math.sin(et*9)*.18,ew)}
      else if(ek==='throw'){const u=sstep(0,.45,et),v=sstep(.45,.75,et);
        const rsx=lerp(lerp(P.rsx,1.0,u),-2.6,v),rsz=lerp(lerp(P.rsz,-.9,u),-.25,v),rex=lerp(lerp(P.rex,-1.6,u),-.15,v),ty=lerp(lerp(P.ty,.45,u),-.35,v),tx=lerp(lerp(P.tx,-.1,u),.22,v),lsx=lerp(lerp(P.lsx,-.9,u),.35,v);
        P.rsx=lerp(P.rsx,rsx,ew);P.rsz=lerp(P.rsz,rsz,ew);P.rex=lerp(P.rex,rex,ew);P.ty=lerp(P.ty,ty,ew);P.tx=lerp(P.tx,tx,ew);P.lsx=lerp(P.lsx,lsx,ew);P.hx=lerp(P.hx,-.08,ew)}
      else if(ek==='lift'){P.lsz=lerp(P.lsz,2.82,ew);P.rsz=lerp(P.rsz,-2.82,ew);P.lsx=lerp(P.lsx,-.28,ew);P.rsx=lerp(P.rsx,-.28,ew);P.lex=lerp(P.lex,-.6,ew);P.rex=lerp(P.rex,-.6,ew);P.hx=lerp(P.hx,-.3,ew);P.tx=lerp(P.tx,-.06,ew)}
      else if(ek==='shake'){const w1=Math.sin(et*30),w2=Math.sin(et*30+1.3);P.lsz=lerp(P.lsz,2.75+.16*w1,ew);P.rsz=lerp(P.rsz,-2.75+.16*w1,ew);P.lsx=lerp(P.lsx,-.28+.12*w2,ew);P.rsx=lerp(P.rsx,-.28+.12*w2,ew);P.lex=lerp(P.lex,-.6,ew);P.rex=lerp(P.rex,-.6,ew);P.hx=lerp(P.hx,-.32,ew);P.tz=lerp(P.tz,.06*w1,ew);P.sway=lerp(P.sway,.03*w1,ew)}
      else if(ek==='dab'){const k=sstep(.1,.35,et);P.rsz=lerp(P.rsz,-2.2,ew*k);P.rsx=lerp(P.rsx,-.7,ew*k);P.rex=lerp(P.rex,0,ew*k);P.lsx=lerp(P.lsx,-1.55,ew*k);P.lsz=lerp(P.lsz,.25,ew*k);P.lex=lerp(P.lex,-2.1,ew*k);P.hx=lerp(P.hx,.38,ew*k);P.hy=lerp(P.hy,.35,ew*k);P.tz=lerp(P.tz,.1,ew*k)}
      else if(ek==='salute'){P.rsx=lerp(P.rsx,-1.45,ew);P.rsz=lerp(P.rsz,-.95,ew);P.rex=lerp(P.rex,-2.25,ew);P.hx=lerp(P.hx,-.1,ew);P.tx=lerp(P.tx,-.06,ew)}
      else if(ek==='chestpound'){const a=Math.max(0,Math.sin(et*8)),b=Math.max(0,Math.sin(et*8+Math.PI));P.rsx=lerp(P.rsx,-1.0-.3*a,ew);P.rex=lerp(P.rex,-2.1+.3*a,ew);P.rsz=lerp(P.rsz,.25,ew);P.lsx=lerp(P.lsx,-1.0-.3*b,ew);P.lex=lerp(P.lex,-2.1+.3*b,ew);P.lsz=lerp(P.lsz,-.25,ew);P.tx=lerp(P.tx,-.1,ew);P.hx=lerp(P.hx,-.15,ew)}
      else if(ek==='bow'){const k=sstep(.25,.75,et)*(1-sstep(1.6,2.1,et));P.tx=lerp(P.tx,.85*k,ew);P.rsx=lerp(P.rsx,-.7,ew);P.rex=lerp(P.rex,-1.7,ew);P.rsz=lerp(P.rsz,.2,ew);P.lsx=lerp(P.lsx,.55,ew);P.lex=lerp(P.lex,-.6,ew);P.hx=lerp(P.hx,.25*k,ew)}
      else if(ek==='floss'){const b=et*9,f=Math.sin(b),g=Math.sin(b/2)>0?1:-1;P.lsz=lerp(P.lsz,.22+.42*f,ew);P.rsz=lerp(P.rsz,-.22+.42*f,ew);P.lsx=lerp(P.lsx,.5*g,ew);P.rsx=lerp(P.rsx,-.5*g,ew);P.lex=lerp(P.lex,0,ew);P.rex=lerp(P.rex,0,ew);P.sway=lerp(P.sway,-.06*f,ew);P.tz=lerp(P.tz,-.1*f,ew);P.hz=lerp(P.hz,.08*f,ew)}
      else if(ek==='robot'){const q=Math.floor(et*3.2)%4,F=[[-1.3,-1.57,-.2,-1.57,.6,0],[-.2,-1.57,-1.3,-1.57,-.6,.1],[-1.57,0,-1.57,0,0,-.1],[-1.3,-1.57,-1.3,-1.57,.4,0]][q];
        P.rsx=lerp(P.rsx,F[0],ew);P.rex=lerp(P.rex,F[1],ew);P.lsx=lerp(P.lsx,F[2],ew);P.lex=lerp(P.lex,F[3],ew);P.hy=lerp(P.hy,F[4],ew);P.tz=lerp(P.tz,F[5],ew);P.rsz=lerp(P.rsz,-.1,ew);P.lsz=lerp(P.lsz,.1,ew)}
      else if(ek==='sprinkler'){const st=(Math.floor(et*6)%8)/7;P.lsz=lerp(P.lsz,2.5,ew);P.lsx=lerp(P.lsx,-.2,ew);P.lex=lerp(P.lex,-2.3,ew);P.rsx=lerp(P.rsx,-1.5,ew);P.rex=lerp(P.rex,-.1,ew);P.ty=lerp(P.ty,-.7+1.4*(et%2.6<1.3?st:1-st),ew);P.hx=lerp(P.hx,.1,ew)}
      else if(ek==='griddy'){const b=et*10,a=Math.sin(b);P.rsx=lerp(P.rsx,-1.15*Math.max(0,a)+.3,ew);P.lsx=lerp(P.lsx,-1.15*Math.max(0,-a)+.3,ew);P.rex=lerp(P.rex,-1.3,ew);P.lex=lerp(P.lex,-1.3,ew);P.tx=lerp(P.tx,.28,ew);
        P.ltx=lerp(P.ltx,-.55*Math.max(0,a),ew);P.lkx=lerp(P.lkx,.9*Math.max(0,a),ew);P.rtx=lerp(P.rtx,-.55*Math.max(0,-a),ew);P.rkx=lerp(P.rkx,.9*Math.max(0,-a),ew);P.lift+=.03*Math.abs(a)*ew*this.standK;P.hx=lerp(P.hx,-.1,ew)}
      else if(ek==='airguitar'){P.lsz=lerp(P.lsz,1.15,ew);P.lsx=lerp(P.lsx,-.95,ew);P.lex=lerp(P.lex,-.35,ew);P.rsx=lerp(P.rsx,-.55,ew);P.rsz=lerp(P.rsz,.35,ew);P.rex=lerp(P.rex,-1.55+.4*Math.sin(et*24),ew);P.hx=lerp(P.hx,.22*Math.sin(et*9),ew);P.tz=lerp(P.tz,.08,ew);P.tx=lerp(P.tx,.12,ew)}
      else if(ek==='disco'){const b=et*4.2,u=(Math.sin(b)+1)/2;P.rsz=lerp(P.rsz,lerp(-.25,-2.55,u),ew);P.rsx=lerp(P.rsx,lerp(-.6,-.25,u),ew);P.rex=lerp(P.rex,0,ew);P.lsz=lerp(P.lsz,.55,ew);P.lsx=lerp(P.lsx,.25,ew);P.lex=lerp(P.lex,-1.5,ew);P.sway=lerp(P.sway,.05*Math.sin(b),ew);P.tz=lerp(P.tz,-.12*(u-.5),ew);P.hz=lerp(P.hz,.1*(u-.5),ew)}
      else if(ek==='hypejump'){const j=Math.max(0,Math.sin(et*6.5));P.lsz=lerp(P.lsz,2.5+.3*j,ew);P.rsz=lerp(P.rsz,-2.5-.3*j,ew);P.lsx=lerp(P.lsx,-.2,ew);P.rsx=lerp(P.rsx,-.2,ew);P.hx=lerp(P.hx,-.25,ew);P.lift+=.3*j*ew*this.standK;P.lkx=lerp(P.lkx,.6*j,ew);P.rkx=lerp(P.rkx,.6*j,ew);P.ltx=lerp(P.ltx,-.4*j,ew);P.rtx=lerp(P.rtx,-.4*j,ew)}
      else if(ek==='moneygun'){const r=Math.max(0,Math.sin(et*14))*.12;P.rsx=lerp(P.rsx,-1.5+r,ew);P.rsz=lerp(P.rsz,-.25,ew);P.rex=lerp(P.rex,-.1,ew);P.lsx=lerp(P.lsx,-1.45-r,ew);P.lsz=lerp(P.lsz,.25,ew);P.lex=lerp(P.lex,-.1,ew);P.hx=lerp(P.hx,-.05,ew);P.tx=lerp(P.tx,-.05,ew)}
      else if(ek==='micdrop'){const d=sstep(1.1,1.3,et);P.rsx=lerp(P.rsx,lerp(-1.45,-.85,d),ew);P.rsz=lerp(P.rsz,-.35,ew);P.rex=lerp(P.rex,lerp(-.45,-.1,d),ew);P.hx=lerp(P.hx,lerp(-.1,.22,d),ew);P.lsz=lerp(P.lsz,.4,ew);P.lex=lerp(P.lex,-1.4,ew);P.lsx=lerp(P.lsx,.2,ew)}
      else if(ek==='belt'){const b=Math.sin(et*5)*.08;P.lsz=lerp(P.lsz,2.55+b,ew);P.rsz=lerp(P.rsz,-2.55-b,ew);P.lsx=lerp(P.lsx,-.35,ew);P.rsx=lerp(P.rsx,-.35,ew);P.lex=lerp(P.lex,-.95,ew);P.rex=lerp(P.rex,-.95,ew);P.lez=lerp(P.lez,-.4,ew);P.rez=lerp(P.rez,.4,ew);P.hx=lerp(P.hx,-.28,ew)}
      else if(ek==='detonate'){const pr=Math.exp(-Math.pow((et-1.3)/.08,2));P.rsx=lerp(P.rsx,-.55,ew);P.rsz=lerp(P.rsz,-2.3+.06*pr,ew);P.rex=lerp(P.rex,-1.3-.12*pr,ew);P.rez=lerp(P.rez,0,ew);P.hx=lerp(P.hx,-.06,ew);P.tx=lerp(P.tx,-.04,ew)}
      else if(ek==='dizzy'){P.hx=lerp(P.hx,Math.sin(et*5.5)*.22,ew);P.hz=lerp(P.hz,Math.cos(et*5.5)*.22,ew);P.tz=lerp(P.tz,Math.sin(et*5.5)*.08,ew);P.sway=lerp(P.sway,Math.cos(et*5.5)*.04,ew)}}
    // --- voice tone moods (face + small gestures); emotes, planks and tosses win
    const M=this.md,gm=(1-ew)*(1-clamp(this.pk||0,0,1))*(tossed?0:1),gb=gm*(moving||this.mode==='walk'||this.hand?0:1);
    const mH=M.hype*gm,mL=M.laugh*gm,mF=M.focus*gm,mX=M.fire*gm,mC=M.calm*gm;
    if(gb>0){const bH=M.hype*gb,bL=M.laugh*gb,bF=M.focus*gb,bX=M.fire*gb,bC=M.calm*gb;
      if(bH>0){P.tx-=.04*bH;P.hx-=.05*bH;P.hx+=Math.sin(t*6.2+this.seed)*.035*bH*this.L}
      if(bL>0){P.tx=lerp(P.tx,-.1+Math.sin(t*19)*.035,bL);P.hx=lerp(P.hx,-.24,bL);P.lsx=lerp(P.lsx,-.9,bL);P.lex=lerp(P.lex,-1.7,bL);P.lsz=lerp(P.lsz,.1,bL);P.rsx=lerp(P.rsx,-.42,bL)}
      if(bF>0){P.tx+=.07*bF;P.hx+=.05*bF+Math.sin(t*3.2+this.seed)*.03*bF*this.L}
      if(bX>0){P.tx+=.05*bX;P.hx+=.07*bX;const ch=Math.pow(Math.abs(Math.sin(t*4.6+this.seed)),3),k=bX*Math.max(this.gest,.45);P.rsx=lerp(P.rsx,-1.12+.4*ch,k);P.rsz=lerp(P.rsz,-.3,k);P.rex=lerp(P.rex,-1.15-.5*ch,k)}
      if(bC>0){P.tx-=.04*bC;P.hx+=Math.sin(t*1.8+this.seed)*.035*bC}
      // hyped: a quick fist pump now and then
      if(bH>.5&&!this.pmp&&t>this.pmpN)this.pmp=1e-3}
    if(this.pmp){this.pmp+=dt;const u=this.pmp;if(u>1.15||gb<=0){this.pmp=0;this.pmpN=t+4+rnd()*5}
      else{const k=sstep(0,.2,u)*(1-sstep(.9,1.15,u))*gb,pp=Math.abs(Math.sin(u*Math.PI*2.6));P.rsx=lerp(P.rsx,-1.3-.25*pp,k);P.rsz=lerp(P.rsz,-.5,k);P.rex=lerp(P.rex,-1.95+.6*pp,k);P.hx=lerp(P.hx,P.hx-.08,k)}}
    if(tossed){const f=clamp(this.tossF||0,0,1),hg=clamp(this.chuteK||0,0,1),sd=this.seed%97;
      const a1=Math.sin(t*17+sd),a2=Math.sin(t*14.3+sd*.7+1.3),l1=Math.sin(t*15.7+sd*.3),l2=Math.sin(t*15.7+sd*.3+3.1);
      const F={lsx:-.4+a1*.9,lsz:1.9+a2*.7,lex:-.5+a2*.4,rsx:-.4+a2*.9,rsz:-1.9-a1*.7,rex:-.5+a1*.4,ltx:-.7+l1*.8,rtx:-.7+l2*.8,lkx:.9+l2*.6,rkx:.9+l1*.6,hx:-.25+a1*.1,tx:-.15,lift:0,sway:0},
        H={lsx:-.12,lsz:2.8,lex:-.25,rsx:-.12,rsz:-2.8,rex:-.25,ltx:-.25+l1*.12,rtx:-.25+l2*.12,lkx:.35+l2*.15,rkx:.35+l1*.15,hx:-.32,tx:0,lift:0,sway:0},w2=Math.max(f,hg);
      for(const k in F)P[k]=lerp(P[k],lerp(F[k],H[k],hg),w2)}
    const pk=clamp(this.pk||0,0,1);if(pk>0){const Q=plankPose(this.dip||0);for(const k in Q)P[k]=lerp(P[k],Q[k],pk)}
    if(this.hand&&this.mode==='seated'){P.lsz=2.95;P.lsx=-.15;P.lex=-.15;P.lez=0}
    // --- gaze target
    let gt=W.cam;let wantTurn=.25;
    if(W.focusSpeaker&&W.focusSpeaker!==this){W.focusSpeaker.headPos(this._w);gt=this._w;wantTurn=1}
    else if(talking){gt=W.cam;wantTurn=.6}
    else if(this.idleK==='lookcam'){gt=W.cam;wantTurn=1}
    else if(typ){gt=null}
    if(tossed||pk>.05)gt=null;
    if(W.shareStart&&t-W.shareStart<2.4&&this.mode==='seated'){this.lookBack=damp(this.lookBack,1,6,dt)}else this.lookBack=damp(this.lookBack,0,4,dt);
    let gy=0,gp=0;if(gt){this.head.getWorldPosition(this._v);const dx=gt.x-this._v.x,dy=gt.y-this._v.y,dz=gt.z-this._v.z;const yaw=Math.atan2(dx,dz)-this.root.rotation.y,hz=Math.hypot(dx,dz);gy=clamp(Math.atan2(Math.sin(yaw),Math.cos(yaw)),-.75,.75)*wantTurn;gp=clamp(-Math.atan2(dy,hz),-.3,.35)*wantTurn}
    if(this.lookBack>.01){gy=lerp(gy,(this.seat&&this.seat.x>0?-1:1)*1.35,this.lookBack);P.ty+=(this.seat&&this.seat.x>0?-1:1)*.45*this.lookBack;gp=lerp(gp,-.2,this.lookBack)}
    P.hy+=gy;P.hx+=gp*.85;
    // nodding while others speak
    if(W.focusSpeaker&&W.focusSpeaker!==this&&W.focusSpeaker.talkT>1.6){this.nod+=dt;P.hx+=Math.sin(this.nod*6.5)*.045*sstep(0,1,Math.sin(this.nod*.7+this.seed)*.5+.5)*(1-pk)}
    // talking head bob
    P.hx+=Math.sin(t*7.3)*.035*this.L;P.hz+=Math.sin(t*3.1+this.seed)*.04*this.L;
    // --- integrate pose (damped)
    const A=this.P,kk=moving?40:(pk>0?26:13);for(const k in P){const v=P[k];A[k]=A[k]===undefined?v:damp(A[k],v,(k[1]==='t'||k[1]==='k')&&moving?40:kk,dt)}
    this.hip.position.y=A.hip+A.lift;this.hip.position.x=A.sway;this.hip.position.z=A.hpz;this.torso.rotation.set(A.tx,A.ty,A.tz);this.headP.rotation.set(A.hx,A.hy,A.hz,'YXZ');
    this.sh[0].rotation.set(A.lsx,0,A.lsz);this.el[0].rotation.set(A.lex,0,A.lez);this.sh[1].rotation.set(A.rsx,0,A.rsz);this.el[1].rotation.set(A.rex,0,A.rez);
    this.th[0].rotation.x=A.ltx;this.kn[0].rotation.x=A.lkx;this.th[1].rotation.x=A.rtx;this.kn[1].rotation.x=A.rkx;this.th[0].rotation.z=A.ltz;this.th[1].rotation.z=A.rtz;
    // --- face
    this.blinkT-=dt;if(this.blinkT<=0){this.blink=.14;this.blinkT=1.8+rnd()*4.2;if(rnd()<.18)this.blinkT=.25}
    let bk=0;if(this.blink>0){this.blink-=dt;bk=Math.sin(Math.max(0,this.blink)/.14*Math.PI)}
    const happy=(ek==='cheer'||ek==='laugh'||ek==='bell'||ek==='dance'||HAPPYE.has(ek))?ew:0;
    const ey=tossed?1.18:Math.max(.12,1-.9*bk-.55*happy-.38*mH-.55*mL-.24*mF-.34*mX-.2*mC);this.eyes.forEach(e=>{e.scale.y=.048*Math.max(.08,ey)});this.hl.forEach(h=>h.visible=ey>.4);
    const gzx=clamp(gy*.02,-.014,.014),gzy=clamp(-gp*.02,-.01,.01);this._by=.012*this.L+.012*happy-(this.L<.05&&typ?.004:0);this._br=-.12*this.L*Math.sin(t*2.3);
    if(pk>0){this._by-=.012*pk;this._br+=.2*pk}if(ek==='detonate'){this._by-=.012*ew;this._br-=.3*ew}this._by+=.02*mH+.01*mL-.009*mF-.02*mX+.002*mC;this._br+=-.13*mF-.34*mX+.06*mH;this.gz.x=damp(this.gz.x,gzx,10,dt);this.gz.y=damp(this.gz.y,gzy,10,dt);this.placeFace(this.gz.x,this.gz.y);
    // mouth
    let o=clamp((this.L-.05)/.55,0,1);o=Math.pow(o,.8);let mw=.05*(.86+.3*this.hf-.12*o),mh=.006+.075*o,mc=.55-.2*o;
    if(ek==='laugh'){const k=ew;mh=lerp(mh,.07+.015*Math.sin(E.t*22),k);mw=lerp(mw,.058,k);mc=lerp(mc,1,k)}
    else if(happy>0){mh=lerp(mh,.055,happy);mw=lerp(mw,.06,happy);mc=lerp(mc,1.1,happy)}
    else if(ek==='detonate'){mc=lerp(mc,1.3,ew);mw=lerp(mw,.064,ew);mh=Math.max(mh,.028*ew)}
    else if(ek==='wave'||ek==='clap'||ek==='fire'||ek==='money'){mc=lerp(mc,1.05,ew);mh=Math.max(mh,.02*ew)}
    if(o<.02&&!happy)mc=.85;
    if(gm>0){mc=lerp(mc,1.2,mH);mw+=.009*mH;mh=Math.max(mh,.026*mH);mc=lerp(mc,.45,mF*(1-o));mw*=1-.06*mF;mc=lerp(mc,-.45,mX);mw=lerp(mw,.053,mX*.6);mc=lerp(mc,1,mC);
      if(mL>0){mh=lerp(mh,.058+.016*Math.sin(t*21),mL);mw=lerp(mw,.058,mL);mc=lerp(mc,1.05,mL)}}
    if(tossed){const hg=clamp(this.chuteK||0,0,1);mh=lerp(.078,.02,hg);mw=lerp(.046,.056,hg);mc=lerp(.5,1.05,hg)}
    if(pk>0){const th=clamp(this.thx||0,0,1);mw=lerp(mw,.044+.012*th,pk);mh=lerp(mh,.008+.05*th,pk);mc=lerp(mc,.35-.25*th,pk)}
    this.mouth.set(mw,mh,mc);
    // Battle Pass cosmetics
    if(this.cup&&this.cup.length){const sp=moving?1:0;for(const f of this.cup)f(t,sp)}if(this.auraUp)this.auraUp(t,dt,this.muted?0:this.L);
    // mic led
    const c=this.micMat.color;if(this.muted)c.setRGB(1.6,.12,.15);else if(this.L>.12)c.setRGB(.25,2.2,.7);else c.setRGB(.15,.4,.25);
  }
  dispose(){this.disposeRig()}
}
function mergeAll(gs){const pos=[],nor=[],uv=[],idx=[];let o=0;gs.forEach(g=>{const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;for(let i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));nor.push(n.getX(i),n.getY(i),n.getZ(i));uv.push(u.getX(i),u.getY(i))}const ix=g.index.array;for(let i=0;i<ix.length;i++)idx.push(ix[i]+o);o+=p.count});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);return g}
