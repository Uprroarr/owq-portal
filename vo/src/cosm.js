// Battle Pass cosmetics for the Sales Floor: names (shared with the portal), hats, extras, headsets, auras,
// desk styles, computer setups, desk items and chairs. Each builder returns meshes plus an optional per-frame update.
import * as THREE from 'three';
import {box,rbox,cyl,sph,lathe,tube,limb} from './geo.js';
import {cv,tex,marbleCanvas,glowCanvas} from './tex.js';

/* names, index = the value stored in the look code (0 = default / none) */
export const COS={
  o:['Tee','Polo','Blazer','Hoodie','Shirt + tie','Varsity Jacket','Tracksuit','Tuxedo','Leather Jacket','Jersey','Hawaiian Shirt','Puffer Vest','Gold Suit'],
  k:['Crimson','Black','White','Royal','Emerald','Gold','Violet','Orange','Teal','Tan','Metallic Gold','Chrome','Gloss Black','Neon Pink','Neon Cyan','Crimson Velvet'],
  s:['Skin 1','Skin 2','Skin 3','Skin 4','Skin 5','Skin 6','Solid Gold','Diamond'],
  H:['None','Beanie','Backwards Cap','Bucket Hat','Cowboy Hat','Top Hat','Headband','Party Hat','Grad Cap','Viking Helmet','Pirate Hat','Halo','Crown','Diamond Crown'],
  B:['None','Bowtie','Gold Watch','Diamond Chain','Mustache','Aviators','Angel Wings','Hero Cape'],
  G:['Standard','Gold Headset','Chrome Headset','RGB Headset','Cat-Ear Headset'],
  D:['Walnut','Black Marble','Carbon Fiber','Gold Trim','RGB Neon','Glass','Diamond'],
  C:['Holo Panel','Dual Monitors','Triple Monitors','Curved Ultrawide','Gaming Rig','Trading Desk','Gold Laptop'],
  I:['None','Trophy','Money Stack','Lava Lamp','Bobblehead','Mini Bell','Bonsai','Champagne','OWQ Neon Sign'],
  R:['Office Chair','Gaming Chair','Executive Chair','Throne'],
  T:['None','Dialer','Closer','Shark','Hustler','Top Gun','Money Maker','Legend','The GOAT'],
  N:['Standard','Gold Tag','Neon Tag','Flame Tag','Diamond Tag'],
  E:['Elevator','Confetti Drop','Fire Walk','Spotlight','Money Rain','Lightning Strike'],
  V:['None','Crimson Aura','Gold Aura','Fire Aura','Lightning Aura','Rainbow Aura']};
/* Battle Pass emotes (in the order they unlock) and the signature emote parts */
export const BPEM=[['dab','\u{1F60E}','Dab'],['salute','\u{1FAE1}','Salute'],['chestpound','\u{1F4AA}','Chest Pound'],['bow','\u{1F647}','Take a Bow'],['floss','\u{1F57A}','Floss'],
  ['robot','\u{1F916}','Robot'],['sprinkler','\u{1F4A6}','Sprinkler'],['griddy','\u{1F525}','Griddy'],['airguitar','\u{1F3B8}','Air Guitar'],['disco','\u{1FAA9}','Disco'],
  ['hypejump','\u{1F680}','Hype Jump'],['moneygun','\u{1F4B5}','Money Gun'],['micdrop','\u{1F3A4}','Mic Drop'],['belt','\u{1F3C6}','Champion Belt']];
export const SIGM=['wave','clap','cheer','dance','fire','money','laugh','nod','dab','salute','chestpound','bow','floss','robot','sprinkler','griddy','airguitar','disco','hypejump','moneygun'];
export const SIGE=['\u{1F525}','\u{1F4B0}','\u{1F3C6}','\u{1F680}','\u{1F451}','\u{1F48E}','\u{26A1}','\u{1F389}','\u{1F4AF}','\u{1F988}','\u{1F410}','\u{1F3AF}'];
export const SIGP=['LET\'S GOOO','CLOSED IT','ONLY WINNERS','MONEY MOVES','NEXT!','EASY WORK','SIGNED & SEALED','CALL ME THE CLOSER','BUILT DIFFERENT','WE EAT','ANOTHER ONE','NO DAYS OFF'];
export const SIGS=['Air horn','Cha-ching','Bell','Crowd cheer','Boom','Ding'];
export const SIGSK=['airhorn','chaching','bell','crowd','boom','ding'];

const MC=new Map();
function std(col,r=.6,mt=0,ex){const k='c'+col+'|'+r+'|'+mt+'|'+(ex?JSON.stringify(ex):'');let m=MC.get(k);if(!m){m=new THREE.MeshStandardMaterial(Object.assign({color:col,roughness:r,metalness:mt},ex||{}));MC.set(k,m)}return m}
function hdr(r,g,b){const k='h'+r+','+g+','+b;let m=MC.get(k);if(!m){m=new THREE.MeshBasicMaterial({color:new THREE.Color(r,g,b)});MC.set(k,m)}return m}
const GOLD=()=>std('#e3b04f',.22,1),CHROME=()=>std('#e6e8ee',.1,1),DIA=()=>std('#dff3ff',.05,.25,{emissive:'#2a5470',emissiveIntensity:.6}),BLK=()=>std('#0c0c0f',.35,.4);
/* materials whose color cycles through the rainbow (RGB gear) */
export const RGB=[];export function rgbMat(){const m=new THREE.MeshBasicMaterial({color:new THREE.Color(2,0,.4)});RGB.push(m);return m}
export function rgbTick(t){for(let i=RGB.length-1;i>=0;i--){const m=RGB[i];if(m._dead){RGB.splice(i,1);continue}m.color.setHSL((t*.12+i*.07)%1,1,.5).multiplyScalar(2.2)}}
let GLOWT=null;const glowTex=()=>GLOWT||(GLOWT=tex(glowCanvas(),{mips:false}));
function M(o,x,y,z,rx,ry,rz){o.position.set(x||0,y||0,z||0);o.rotation.set(rx||0,ry||0,rz||0);return o}
const mesh=(g,m)=>{const e=new THREE.Mesh(g,m);e.castShadow=true;return e};
function textTex(txt,{w=256,h=128,font='900 92px Verdana',col='#fff',bg=null,glow=null}={}){const c=cv(w,h),x=c.getContext('2d');if(bg){x.fillStyle=bg;x.fillRect(0,0,w,h)}x.font=font;x.textAlign='center';x.textBaseline='middle';
  if(glow){x.shadowColor=glow;x.shadowBlur=18}x.fillStyle=col;x.fillText(txt,w/2,h/2+4);return tex(c,{mips:false})}

/* ---------------- hats (children of the head, head radius .26) ---------------- */
export function hat(H,head,hairC){const R=.26,g=new THREE.Group();g.name='bphat';let up=null;
  if(H===1){const m=std('#ff1f4f',.95);const c=mesh(new THREE.SphereGeometry(R*1.1,32,16,0,Math.PI*2,0,1.42),m);c.rotation.x=-.32;g.add(c);
    const f=mesh(new THREE.TorusGeometry(R*1.04,.036,10,40),std('#c9123a',.95));M(f,0,.04,-.012,Math.PI/2-.32);g.add(f);const p=mesh(sph(.06,14,10),std('#f4f4f4',1));M(p,0,R*1.08,-.08);g.add(p)}
  else if(H===2){const m=std('#17171d',.7);const cr=mesh(new THREE.SphereGeometry(R*1.1,40,18,0,Math.PI*2,0,1.38),m);cr.rotation.x=-.32;g.add(cr);
    const bm=mesh(new THREE.CylinderGeometry(.2,.2,.014,32,1,false,-1.15,2.3),std('#ff1f4f',.6));M(bm,0,.135,-.13,-.12,Math.PI);g.add(bm);const l=mesh(box(.06,.03,.01),std('#ff1f4f',.5));M(l,0,.13,.2,-.35);g.add(l)}
  else if(H===3){const m=std('#c9b48f',.9);const t=mesh(cyl(.18,.25,.15,28),m);M(t,0,.2,-.02,-.18);g.add(t);const b=mesh(cyl(.37,.37,.014,36),m);M(b,0,.13,0,-.15);g.add(b);const bd=mesh(cyl(.252,.252,.03,28,true),std('#5b4a32',.8));M(bd,0,.15,-.01,-.18);g.add(bd)}
  else if(H===4){const m=std('#7a4a26',.75);const cr=mesh(cyl(.17,.21,.21,28),m);M(cr,0,.27,-.02,-.12);g.add(cr);const dent=mesh(new THREE.SphereGeometry(.17,20,10,0,Math.PI*2,0,.6),m);M(dent,0,.34,-.03,-.12);dent.scale.set(1,.35,1);g.add(dent);
    const br=mesh(lathe([[0,0],[.22,0],[.36,.02],[.43,.075],[.44,.085]],40),m);M(br,0,.165,-.01,-.12);br.scale.set(1,1,.82);g.add(br);const bd=mesh(cyl(.212,.212,.04,28,true),std('#2a1a10',.6));M(bd,0,.19,-.015,-.12);g.add(bd)}
  else if(H===5){const m=std('#0d0d10',.4,.1);const t=mesh(cyl(.17,.17,.38,28),m);M(t,0,.37,-.03,-.1);g.add(t);const b=mesh(cyl(.3,.3,.016,32),m);M(b,0,.19,-.015,-.1);g.add(b);const bd=mesh(cyl(.173,.173,.06,28,true),std('#ff1f4f',.5));M(bd,0,.22,-.017,-.1);g.add(bd)}
  else if(H===6){const t=mesh(new THREE.TorusGeometry(R*1.03,.032,10,44),std('#f4f4f4',1));M(t,0,.09,-.01,Math.PI/2-.42);g.add(t);const s=mesh(new THREE.TorusGeometry(R*1.035,.012,8,44),std('#ff1f4f',.8));M(s,0,.09,-.01,Math.PI/2-.42);g.add(s)}
  else if(H===7){const c=cv(128,256),x=c.getContext('2d');for(let i=0;i<8;i++){x.fillStyle=['#ff1f4f','#ffcf40','#5ac8ff','#3ddc97'][i%4];x.fillRect(0,i*32,128,32)}
    const k=mesh(new THREE.ConeGeometry(.13,.36,24,1,true),std('#fff',.7,0,{map:tex(c),side:THREE.DoubleSide}));M(k,.04,.4,-.02,-.12,0,-.16);g.add(k);const p=mesh(sph(.04,12,8),std('#ffcf40',.6));M(p,.07,.58,-.05);g.add(p)}
  else if(H===8){const m=std('#121216',.6);const b=mesh(cyl(.2,.2,.1,28),m);M(b,0,.2,-.02,-.12);g.add(b);const t=mesh(box(.52,.02,.52),m);M(t,0,.26,-.03,-.12,Math.PI/4);g.add(t);
    const tq=mesh(tube([[0,.272,-.03],[.15,.275,.0],[.24,.22,.08],[.25,.12,.1]],.008,14,6),GOLD());g.add(tq);const tb=mesh(cyl(.02,.03,.07,10),GOLD());M(tb,.25,.08,.1);g.add(tb)}
  else if(H===9){const m=std('#9aa0a8',.35,.85);const c=mesh(new THREE.SphereGeometry(R*1.1,36,16,0,Math.PI*2,0,1.5),m);c.rotation.x=-.3;g.add(c);const rim=mesh(new THREE.TorusGeometry(R*1.08,.025,8,40),std('#6e5a3a',.6,.6));M(rim,0,.03,-.01,Math.PI/2-.3);g.add(rim);
    [-1,1].forEach(s=>{const hn=mesh(tube([[s*.24,.12,0],[s*.36,.2,0],[s*.42,.34,-.02],[s*.4,.46,-.04]],.03,16,8),std('#efe6d2',.6));g.add(hn);const tp=mesh(new THREE.ConeGeometry(.03,.08,10),std('#efe6d2',.6));M(tp,s*.4,.5,-.04,0,0,s*.25);g.add(tp)})}
  else if(H===10){const m=std('#121214',.7);const c=mesh(sph(1,28,14),m);c.scale.set(.42,.13,.22);M(c,0,.25,-.03);g.add(c);const tr=mesh(new THREE.TorusGeometry(.4,.012,6,40,Math.PI),GOLD());tr.scale.set(1,.45,.5);M(tr,0,.24,.0,0,0,0);g.add(tr);
    const sk=new THREE.Mesh(new THREE.PlaneGeometry(.1,.1),new THREE.MeshBasicMaterial({map:textTex('☠',{w:128,h:128,font:'100px Verdana'}),transparent:true}));M(sk,0,.28,.2);g.add(sk)}
  else if(H===11){const h=new THREE.Mesh(new THREE.TorusGeometry(.17,.016,10,48),hdr(3.2,2.6,1.2));M(h,0,.46,-.04,Math.PI/2-.15);g.add(h);up=t=>{h.position.y=.46+Math.sin(t*2.2)*.02;h.rotation.z=t*.4}}
  else if(H===12||H===13){const dia=H===13,m=dia?DIA():GOLD();const b=mesh(cyl(.17,.19,.11,28,true),m);b.material=m;M(b,0,.23,-.03,-.12);g.add(b);
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const sp=mesh(new THREE.ConeGeometry(.035,.11,8),m);M(sp,Math.sin(a)*.175,.32,-.03+Math.cos(a)*.175,-.12);g.add(sp);
      const gm=mesh(sph(.018,10,8),dia?hdr(.6,2.4,3.2):std(['#ff1f4f','#2a64ff','#12b58a'][i%3],.15,.3,{emissive:['#600','#012','#021'][i%3]}));M(gm,Math.sin(a)*.188,.24,-.03+Math.cos(a)*.188);g.add(gm)}
    if(dia){const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:new THREE.Color(.7,1.6,2.4),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.6}));gl.scale.setScalar(.55);M(gl,0,.3,-.03);g.add(gl);up=t=>{gl.material.opacity=.35+.25*Math.sin(t*3)}}}
  if(g.children.length)head.add(g);return{g,up}}

/* ---------------- extras ---------------- */
export function extra(B,av,hairC){const out=[];let up=null;const add=(parent,o)=>{parent.add(o);out.push(o);return o};
  if(B===1){const m=std('#ff1f4f',.55);[-1,1].forEach(s=>{const w=add(av.torso,mesh(sph(1,14,10),m));w.scale.set(.045,.03,.018);M(w,s*.04,.43,.115,0,0,s*.25)});const k=add(av.torso,mesh(sph(.016,10,8),m));M(k,0,.43,.125)}
  else if(B===2){const w=add(av.el[0],mesh(cyl(.052,.052,.032,20,true),GOLD()));M(w,0,-.13,0);const f=add(av.el[0],mesh(cyl(.03,.03,.012,20),std('#0b2a4a',.1,.6,{emissive:'#0a2a4a'})));M(f,0,-.13,.052,Math.PI/2)}
  else if(B===3){const c=add(av.torso,mesh(new THREE.TorusGeometry(.13,.012,8,40),DIA()));M(c,0,.41,.035,Math.PI/2-.55);const p=add(av.torso,mesh(new THREE.OctahedronGeometry(.04),std('#e8fbff',.02,.2,{emissive:'#6fd8ff',emissiveIntensity:.9})));M(p,0,.32,.165);up=t=>{p.rotation.y=t*1.5}}
  else if(B===4){const m=std(new THREE.Color(hairC||'#2b1a10').multiplyScalar(.85).getStyle(),.8);[-1,1].forEach(s=>{const h=add(av.head,mesh(sph(1,14,10),m));h.scale.set(.05,.016,.02);h.position.set(s*.042,-.072,.245);h.rotation.z=s*-.25;h.layers.set(1)})}
  else if(B===5){const fr=GOLD(),ln=std('#2a1a05',.05,.6,{envMapIntensity:2.2});[-1,1].forEach(s=>{const l=add(av.head,mesh(sph(1,20,12),ln));l.scale.set(.068,.056,.016);l.position.set(s*.09,.025,.258);
      const r=add(av.head,mesh(new THREE.TorusGeometry(.06,.006,6,24),fr));r.scale.set(1.12,.92,1);r.position.set(s*.09,.025,.262)});const br=add(av.head,mesh(box(.06,.008,.008),fr));br.position.set(0,.06,.262)}
  else if(B===6){const sh=new THREE.Shape();sh.moveTo(0,0);sh.bezierCurveTo(.12,.18,.42,.34,.62,.3);sh.bezierCurveTo(.5,.2,.52,.1,.44,.04);sh.bezierCurveTo(.4,-.06,.3,-.12,.2,-.12);sh.bezierCurveTo(.1,-.12,.04,-.08,0,0);
    const gm=new THREE.ShapeGeometry(sh,16),m=std('#ffffff',.85,0,{side:THREE.DoubleSide,emissive:'#3a3a48',emissiveIntensity:.4});const W=[];
    [-1,1].forEach(s=>{const p=new THREE.Group();p.position.set(s*.06,.3,-.16);av.torso.add(p);out.push(p);const w=mesh(gm,m);w.scale.set(s,1,1);p.add(w);W.push([p,s])});
    up=t=>{const f=Math.sin(t*2.4)*.18;W.forEach(([p,s])=>{p.rotation.y=s*(-.55+f);p.rotation.z=s*.1})}}
  else if(B===7){const g=new THREE.PlaneGeometry(.44,.78,1,8);g.translate(0,-.39,0);const m=std('#b8102f',.75,0,{side:THREE.DoubleSide});const c=mesh(g,m);const p=new THREE.Group();p.position.set(0,.43,-.14);av.torso.add(p);out.push(p);p.add(c);
    const base=g.attributes.position.array.slice();up=(t,sp)=>{const a=g.attributes.position;for(let i=0;i<a.count;i++){const y=base[i*3+1],k=-y/.78;a.setZ(i,base[i*3+2]-k*k*(.12+.18*(sp||0))-Math.sin(t*3+y*6)*.02*k)}a.needsUpdate=true;p.rotation.x=.12+.25*(sp||0)}}
  return{out,up}}

/* ---------------- headsets: restyle the existing band / cups / ring ---------------- */
export function headset(G,parts){if(!G)return null;const {band,cups,rings,head}=parts;let m=null;
  if(G===1)m=GOLD();else if(G===2)m=CHROME();else if(G===3)m=BLK();else if(G===4)m=std('#f2f2f6',.4);
  [band,...cups].forEach(o=>o.material=m);
  if(G===3){const r=rgbMat();rings.forEach(o=>o.material=r)}
  if(G===4){const pink=std('#ff7ab6',.6),glow=hdr(2.6,.6,1.4);rings.forEach(o=>o.material=glow);
    [-1,1].forEach(s=>{const e=mesh(new THREE.ConeGeometry(.075,.13,4),m);e.position.set(s*.15,.27,-.02);e.rotation.set(-.1,Math.PI/4,s*-.35);head.add(e);const i=mesh(new THREE.ConeGeometry(.045,.08,4),pink);i.position.set(s*.148,.262,.008);i.rotation.set(-.1,Math.PI/4,s*-.35);head.add(i)})}
  return true}

/* ---------------- talking auras (a soft glow behind the body) ---------------- */
export function aura(V,parent){if(!V)return null;const col=[null,[2.2,.18,.4],[2.4,1.7,.45],[2.6,.9,.15],[.6,1.6,2.8],[2,1,2]][V];
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:new THREE.Color(...col),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));sp.scale.set(1.6,1.9,1);sp.position.set(0,1.0,-.12);sp.renderOrder=-1;parent.add(sp);
  let k=0;return{sp,up:(t,dt,L)=>{k+=((L>.1?1:0)-k)*Math.min(1,dt*5);let o=.08+.62*k,s=1;
    if(V===3){o*=.75+.35*Math.sin(t*23)*Math.sin(t*7.1);s=1+.08*Math.sin(t*17)}else if(V===4){if(Math.random()<.06*k)o=1.6;}else if(V===5){sp.material.color.setHSL((t*.25)%1,1,.55).multiplyScalar(2.2)}
    sp.material.opacity=Math.max(0,o);sp.scale.set(1.6*s,1.9*s,1)}}}

/* ---------------- desks: style, computer setup, desk item and chair for whoever sits there ---------------- */
let SCR=null;function screenTex(){if(SCR)return SCR;const c=cv(512,288),x=c.getContext('2d');x.fillStyle='#06070c';x.fillRect(0,0,512,288);x.fillStyle='#0f1422';x.fillRect(0,0,512,34);
  x.fillStyle='#ff1f4f';x.font='bold 18px Verdana';x.fillText('OWQ  PIPELINE',14,23);x.strokeStyle='#3ddc97';x.lineWidth=4;x.beginPath();for(let i=0;i<=24;i++){const X=20+i*19,Y=230-i*5-Math.sin(i*1.3)*22;i?x.lineTo(X,Y):x.moveTo(X,Y)}x.stroke();
  for(let i=0;i<6;i++){x.fillStyle=i%2?'#5ac8ff':'#ffcf40';x.fillRect(30+i*75,250-(30+i*14),40,30+i*14)}SCR=tex(c,{mips:false});return SCR}
let CARB=null;function carbonTex(){if(CARB)return CARB;const c=cv(128,128),x=c.getContext('2d');for(let i=0;i<8;i++)for(let j=0;j<8;j++){const g=x.createLinearGradient(i*16,j*16,i*16+16,j*16+16);const a=(i+j)%2;g.addColorStop(0,a?'#1c1c22':'#0a0a0d');g.addColorStop(1,a?'#08080a':'#202028');x.fillStyle=g;x.fillRect(i*16,j*16,16,16)}
  CARB=tex(c);CARB.wrapS=CARB.wrapT=THREE.RepeatWrapping;CARB.repeat.set(10,4);return CARB}
let MARB={};function marbleTex(dark){if(MARB[dark])return MARB[dark];const t=tex(marbleCanvas(dark?21:4));t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.4,.6);MARB[dark]=t;return t}
function monitor(w,h,curve){const g=new THREE.Group(),sm=new THREE.MeshBasicMaterial({map:screenTex(),color:new THREE.Color(1.25,1.25,1.25)});
  if(curve){const r=1.1,th=w/r;const s=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32,1,true,Math.PI-th/2,th),sm);s.material.side=THREE.BackSide;s.position.z=r-.02;g.add(s);
    const bk=mesh(new THREE.CylinderGeometry(r+.02,r+.02,h+.03,32,1,true,Math.PI-th/2,th),BLK());bk.position.z=r-.02;g.add(bk)}
  else{const bz=mesh(rbox(w+.03,h+.03,.025,.008),BLK());g.add(bz);const s=new THREE.Mesh(new THREE.PlaneGeometry(w,h),sm);s.position.z=-.014;s.rotation.y=Math.PI;g.add(s)}
  const st=mesh(cyl(.012,.012,.12,8),BLK());st.position.set(0,-h/2-.05,.02);g.add(st);const ft=mesh(rbox(.16,.012,.1,.004),BLK());ft.position.set(0,-h/2-.11,.02);g.add(ft);return g}
export function styleDesk(d,S,G){if(d.sty){G.remove(d.sty);d.sty.traverse(o=>{if(o.material&&o.material._rgb)o.material._dead=1});d.sty=null}if(d.chairSty){d.chair.remove(d.chairSty);d.chairSty=null}
  d.chair.children.forEach((c,i)=>{if(i<2)c.visible=true});d.up=null;
  if(!S)return;const x=d.seat.x,z=d.seat.z,g=new THREE.Group();g.name='desksty';const ups=[];
  // desk style
  if(S.D){const D=S.D;let top,leg=CHROME(),panel=null,edge=null;
    if(D===1){top=std('#3a3a40',.25,.1,{map:marbleTex(1)});edge=GOLD();leg=GOLD();panel=std('#16161a',.3,.2)}
    else if(D===2){top=std('#ffffff',.3,.45,{map:carbonTex()});edge=std('#ff1f4f',.4);leg=BLK();panel=std('#ffffff',.35,.4,{map:carbonTex()})}
    else if(D===3){top=std('#0b0b0e',.12,.3);edge=GOLD();leg=GOLD();panel=std('#0b0b0e',.15,.3)}
    else if(D===4){top=std('#060608',.18,.4);const r=rgbMat();r._rgb=1;edge=r;leg=BLK();panel=std('#060608',.2,.4)}
    else if(D===5){top=std('#bfe3ff',.03,.1,{transparent:true,opacity:.38});leg=CHROME();panel=std('#bfe3ff',.04,.1,{transparent:true,opacity:.3})}
    else if(D===6){top=std('#f6f8fb',.12,.05,{map:marbleTex(0)});const e=hdr(.7,2.2,3);edge=e;leg=CHROME();panel=std('#eef3f8',.15,.1,{map:marbleTex(0)})}
    const t=mesh(rbox(1.93,.058,.85,.016),top);t.position.set(x,.737,z);t.receiveShadow=true;g.add(t);
    [-1,1].forEach(s=>{const l=mesh(box(.052,.712,.752),leg);l.position.set(x+s*.9,.356,z);g.add(l)});
    if(panel){const p=mesh(box(1.78,.43,.014),panel);p.position.set(x,.47,z+.364);g.add(p)}
    if(edge){[[1.94,.012,.014,0,.762,.425],[1.94,.012,.014,0,.762,-.425],[.014,.012,.86,.965,.762,0],[.014,.012,.86,-.965,.762,0]].forEach(([w,h,dd,dx,y,dz])=>{const e=new THREE.Mesh(box(w,h,dd),edge);e.position.set(x+dx,y,z+dz);g.add(e)})}}
  // computer setup (screens face the person sitting at the desk)
  if(S.C){const C=S.C,Y=.94,Z=z+.06;
    const put=(o,dx,dy,ry)=>{o.position.set(x+dx,Y+(dy||0),Z);o.rotation.y=ry||0;g.add(o);return o};
    if(C===1){put(monitor(.5,.29),-.27,0,.2);put(monitor(.5,.29),.27,0,-.2)}
    else if(C===2){put(monitor(.44,.26),0,0,0);put(monitor(.44,.26),-.46,0,.38);put(monitor(.44,.26),.46,0,-.38)}
    else if(C===3){put(monitor(1.05,.3,1),0,0,0)}
    else if(C===4){put(monitor(.62,.34),0,.02,0);const tw=mesh(rbox(.2,.44,.42,.02),BLK());tw.position.set(x+.72,.99,z-.02);g.add(tw);const r=rgbMat();r._rgb=1;
      const gp=new THREE.Mesh(new THREE.PlaneGeometry(.36,.38),r);gp.position.set(x+.619,.99,z-.02);gp.rotation.y=-Math.PI/2;g.add(gp);const kb=new THREE.Mesh(new THREE.PlaneGeometry(.48,.17),r);kb.rotation.x=-Math.PI/2;kb.position.set(x,.762,z-.3);g.add(kb)}
    else if(C===5){[-.66,-.22,.22,.66].forEach((dx,i)=>put(monitor(.4,.23),dx,-.02,[.45,.15,-.15,-.45][i]));[-.44,.44].forEach(dx=>put(monitor(.4,.23),dx,.24,dx<0?.3:-.3));
      const r=rgbMat();r._rgb=1;const bl=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.05),r);bl.position.set(x,.79,Z+.03);g.add(bl)}
    else if(C===6){const gm=GOLD();const b=mesh(rbox(.38,.018,.26,.006),gm);b.position.set(x,.775,z-.18);g.add(b);const lid=new THREE.Group();lid.position.set(x,.784,z-.05);lid.rotation.x=-.25;g.add(lid);
      const l=mesh(rbox(.38,.25,.012,.006),gm);l.position.y=.125;lid.add(l);const s=new THREE.Mesh(new THREE.PlaneGeometry(.35,.22),new THREE.MeshBasicMaterial({map:screenTex(),color:new THREE.Color(1.3,1.3,1.3)}));s.position.set(0,.125,-.008);s.rotation.y=Math.PI;lid.add(s)}}
  // desk item (front right corner, facing the room)
  if(S.I){const I=S.I,ix=x+.42,iz=z+.24,iy=.766;let it=new THREE.Group();it.position.set(ix,iy,iz);g.add(it);
    if(I===1){it.add(M(mesh(rbox(.1,.05,.1,.01),BLK()),0,.025));it.add(M(mesh(lathe([[0,0],[.025,0],[.025,.02],[.012,.035],[.012,.07],[.06,.1],[.07,.17],[0,.17]],24),GOLD()),0,.05));[-1,1].forEach(s=>it.add(M(mesh(new THREE.TorusGeometry(.03,.007,6,14),GOLD()),s*.075,.18,0,0,Math.PI/2)))}
    else if(I===2){const gm=std('#5f9a52',.8),bd=std('#e8dcae',.7);for(let i=0;i<4;i++){const b=mesh(box(.17,.022,.08),gm);b.position.set((i%2)*.01,.011+i*.023,(i%3)*.005);b.rotation.y=i*.06;it.add(b);const s=mesh(box(.035,.024,.082),bd);s.position.copy(b.position);s.rotation.copy(b.rotation);it.add(s)}}
    else if(I===3){it.add(M(mesh(cyl(.04,.055,.05,16),GOLD()),0,.025));const gl=new THREE.Mesh(cyl(.026,.042,.18,16),std('#ff5aa0',.1,0,{transparent:true,opacity:.55,emissive:'#7a1840',emissiveIntensity:.8}));gl.position.y=.14;it.add(gl);
      const bl=[];for(let i=0;i<3;i++){const b=new THREE.Mesh(sph(.016,10,8),hdr(2.6,.7,.2));it.add(b);bl.push(b)}it.add(M(mesh(cyl(.022,.026,.03,16),GOLD()),0,.245));ups.push(t=>bl.forEach((b,i)=>{b.position.set(Math.sin(t*.7+i)*.008,.07+((t*.12+i*.33)%1)*.13,0)}))}
    else if(I===4){it.add(M(mesh(cyl(.04,.05,.03,16),BLK()),0,.015));const sp=mesh(cyl(.006,.006,.06,8),CHROME());sp.position.y=.06;it.add(sp);const hd=new THREE.Group();hd.position.y=.1;it.add(hd);
      hd.add(M(mesh(sph(.05,18,12),std('#efc1a0',.6)),0,.03));hd.add(M(mesh(sph(.052,18,10),std('#15100e',.5)),0,.05,-.008));[-1,1].forEach(s=>hd.add(M(new THREE.Mesh(sph(.008,8,6),std('#07070a',.1)),s*.018,.035,.046)));ups.push(t=>{hd.rotation.z=Math.sin(t*5.2)*.18;hd.rotation.x=Math.sin(t*3.7)*.1})}
    else if(I===5){it.add(M(mesh(cyl(.06,.065,.02,20),std('#5a3a22',.6)),0,.01));it.add(M(mesh(lathe([[0,.0],[.05,.0],[.045,.02],[.035,.06],[.02,.08],[0,.085]],22),GOLD()),0,.02));it.add(M(mesh(sph(.012,8,6),GOLD()),0,.11))}
    else if(I===6){it.add(M(mesh(rbox(.14,.04,.09,.01),std('#3a2a20',.7)),0,.02));const tr=mesh(tube([[0,.04,0],[.01,.08,0],[-.015,.12,.005],[.0,.15,0]],.008,10,6),std('#6b4a2a',.9));it.add(tr);
      [[0,.17,0,.05],[.045,.15,.01,.035],[-.045,.14,-.01,.035]].forEach(([a,b,c,r])=>{const l=mesh(sph(r,12,8),std('#3f7a3a',.85));l.scale.y=.6;l.position.set(a,b,c);it.add(l)})}
    else if(I===7){it.add(M(mesh(cyl(.055,.045,.11,18,true),CHROME()),0,.055));const bt=mesh(cyl(.022,.024,.16,14),std('#0e3a1e',.2,.3));bt.position.set(0,.12,0);bt.rotation.z=.18;it.add(bt);const nk=mesh(cyl(.009,.012,.05,10),GOLD());nk.position.set(-.017,.215,0);nk.rotation.z=.18;it.add(nk);
      for(let i=0;i<5;i++){const ic=mesh(box(.02,.02,.02),std('#dff3ff',.05,0,{transparent:true,opacity:.8}));ic.position.set(Math.cos(i*1.3)*.035,.1,Math.sin(i*1.3)*.035);it.add(ic)}}
    else if(I===8){const s=new THREE.Mesh(new THREE.PlaneGeometry(.34,.14),new THREE.MeshBasicMaterial({map:textTex('OWQ',{w:256,h:110,font:'italic 900 84px Verdana',col:'#ffd6df',glow:'#ff1f4f'}),transparent:true,color:new THREE.Color(2.2,2.2,2.2),depthWrite:false}));
      s.position.set(-.12,.11,.0);it.add(s);it.add(M(mesh(box(.3,.012,.04),BLK()),-.12,.006))}}
  // your loot crate car, as a die-cast model on the desk
  if(S.W){const cm=buildCar(S.W);if(cm){cm.scale.setScalar(.11);cm.position.set(x-.52,.768,z+.2);cm.rotation.y=-.5;g.add(cm)}}
  // chair
  if(S.R){const R=S.R,c=new THREE.Group();d.chair.children.forEach((o,i)=>{if(i===0||(R===3&&i===1))o.visible=false});
    if(R===1){const bl=std('#111116',.45),rd=std('#ff1f4f',.5);c.add(M(mesh(rbox(.56,.12,.54,.04),bl),0,.47));const bk=mesh(rbox(.54,.92,.12,.05),bl);M(bk,0,1.0,-.28,-.12);c.add(bk);
      [-1,1].forEach(s=>{const w=mesh(rbox(.08,.78,.14,.03),rd);M(w,s*.25,1.0,-.25,-.12,0,s*.05);c.add(w);const a=mesh(rbox(.06,.04,.32,.015),bl);M(a,s*.3,.68,-.02);c.add(a)});
      const hr=mesh(rbox(.3,.12,.08,.03),rd);M(hr,0,1.38,-.3,-.12);c.add(hr);const st=mesh(rbox(.06,.7,.125,.02),rd);M(st,0,.98,-.282,-.12);c.add(st)}
    else if(R===2){const lt=std('#4a2c1a',.4,.1),br=GOLD();c.add(M(mesh(rbox(.6,.13,.56,.05),lt),0,.48));const bk=mesh(rbox(.6,1.0,.14,.07),lt);M(bk,0,1.05,-.29,-.1);c.add(bk);
      for(let i=0;i<3;i++)for(let j=0;j<4;j++){const b=mesh(sph(.012,8,6),br);M(b,-.16+i*.16,.7+j*.2,-.215+j*.02*.1);c.add(b)}[-1,1].forEach(s=>{const a=mesh(rbox(.08,.1,.42,.03),lt);M(a,s*.32,.68,-.03);c.add(a)})}
    else if(R===3){const gm=GOLD(),vel=std('#8a0a24',.95);c.add(M(mesh(rbox(.66,.16,.6,.04),gm),0,.42));c.add(M(mesh(rbox(.58,.08,.52,.04),vel),0,.52));
      const bk=mesh(rbox(.66,1.45,.12,.04),gm);M(bk,0,1.2,-.31);c.add(bk);const cu=mesh(rbox(.5,1.1,.04,.03),vel);M(cu,0,1.12,-.245);c.add(cu);
      for(let i=0;i<5;i++){const sp=mesh(new THREE.ConeGeometry(.045,.16,8),gm);M(sp,-.24+i*.12,2.0,-.31);c.add(sp);const gmn=new THREE.Mesh(sph(.022,10,8),hdr(2.6,.15,.3));M(gmn,-.24+i*.12,1.9,-.24);c.add(gmn)}
      [-1,1].forEach(s=>{c.add(M(mesh(rbox(.1,.3,.56,.03),gm),s*.36,.62,-.02));[-1,1].forEach(f=>c.add(M(mesh(cyl(.035,.045,.36,10),gm),s*.28,.18,f*.24)))})}
    d.chair.add(c);d.chairSty=c}
  G.add(g);d.sty=g;d.up=ups.length?t=>ups.forEach(f=>f(t)):null}

/* ---------------- loot crate cars (generic toy-style bodies, no logos) ---------------- */
COS.W=['None','Old Honda Civic','Toyota Corolla','Ford F-150','Jeep Wrangler','Tesla Model 3','BMW M4','Dodge Challenger Hellcat','Porsche 911','Lamborghini Aventador','Bugatti Chiron'];
/* drop chance in percent, same order as COS.W (1-10) */
export const CARP=[30,20,14,11,9,6,4,3,2,1];
export const CARR=['common','common','uncommon','uncommon','rare','rare','epic','epic','legendary','mythic'];
const CARS=[null,
 {L:3.0,W:1.45,H:.62,cab:[1.55,.55,-.05],cabT:.85,col:'#8ea3b4',rough:.55,wr:.3,hatch:1,rust:1},
 {L:3.3,W:1.5,H:.6,cab:[1.6,.52,0],cabT:.8,col:'#eceef1',rough:.35,wr:.31},
 {L:3.9,W:1.7,H:.85,cab:[1.25,.62,.55],cabT:.9,col:'#1b2f52',rough:.4,wr:.42,bed:1},
 {L:3.0,W:1.6,H:.85,cab:[1.7,.75,-.1],cabT:.98,col:'#4a5a33',rough:.7,wr:.44,box:1,spare:1},
 {L:3.35,W:1.55,H:.55,cab:[1.75,.5,-.05],cabT:.7,col:'#f4f5f7',rough:.15,wr:.32,glassRoof:1},
 {L:3.35,W:1.6,H:.55,cab:[1.4,.46,-.15],cabT:.72,col:'#1f5fd6',rough:.2,mt:.4,wr:.33},
 {L:3.6,W:1.65,H:.6,cab:[1.35,.45,-.2],cabT:.75,col:'#c4141d',rough:.25,mt:.2,wr:.35,stripe:'#0b0b0d'},
 {L:3.15,W:1.55,H:.52,cab:[1.5,.47,-.25],cabT:.65,col:'#f2c21b',rough:.18,mt:.3,wr:.33,round:1},
 {L:3.5,W:1.75,H:.42,cab:[1.4,.36,-.1],cabT:.55,col:'#7ad321',rough:.15,mt:.3,wr:.34,wedge:1},
 {L:3.6,W:1.8,H:.48,cab:[1.3,.38,-.05],cabT:.55,col:'#123a8a',col2:'#0b0b10',rough:.12,mt:.55,wr:.36,glow:1}];
export function buildCar(i){const P=CARS[i];if(!P)return null;const g=new THREE.Group();g.name='car'+i;const ups=[];
 const body=std(P.col,P.rough,P.mt||0),dark=std('#0a0a0d',.35,.3),glass=std('#141c26',.05,.4,{envMapIntensity:2}),tyre=std('#141416',.85),rim=CHROME(),
  hl=hdr(3.2,3,2.6),tl=hdr(3,.15,.2);const L=P.L,W=P.W,H=P.H,y0=P.wr*.85;
 // lower body
 const lb=mesh(rbox(L,H,W,P.round?.2:.08),body);lb.position.y=y0+H/2;g.add(lb);
 if(P.wedge){const n=mesh(rbox(L*.36,H*.55,W*.96,.06),body);n.position.set(L*.33,y0+H*.95,0);n.rotation.z=-.18;g.add(n)}
 if(P.col2){const s=mesh(rbox(L*.5,H*1.02,W*1.01,.07),std(P.col2,.2,.5));s.position.set(-L*.05,y0+H/2,0);g.add(s)}
 if(P.stripe){[-.18,.18].forEach(z=>{const s=mesh(box(L*1.002,.02,.14),std(P.stripe,.3));s.position.set(0,y0+H+.005,z);g.add(s)})}
 // cabin
 const [cl,ch,co]=P.cab;const cab=mesh(rbox(cl,ch,W*P.cabT,P.box?.04:.12),P.box?body:glass);cab.position.set(co,y0+H+ch/2-.02,0);g.add(cab);
 if(P.box){const gw=mesh(box(cl*.98,ch*.6,W*P.cabT*1.01),glass);gw.position.set(co,y0+H+ch*.55,0);g.add(gw)}
 else{const rf=mesh(rbox(cl*.72,.04,W*P.cabT*.92,.02),P.glassRoof?glass:body);rf.position.set(co-.04,y0+H+ch-.01,0);g.add(rf)}
 if(P.bed){const bd=mesh(box(L*.38,.3,W*.96),dark);bd.position.set(-L*.3,y0+H+.08,0);g.add(bd)}
 if(P.spare){const sp=mesh(cyl(.32,.32,.2,18),tyre);sp.rotation.z=Math.PI/2;sp.position.set(-L/2-.08,y0+H*.7,0);g.add(sp)}
 if(P.rust){[[.6,.2],[-.9,-.1]].forEach(([x,z])=>{const r=mesh(sph(.09,8,6),std('#7a4a22',.95));r.scale.set(1.4,.6,.15);r.position.set(x,y0+H*.4,W/2+.005);r.position.z*=z<0?-1:1;g.add(r)})}
 // lights
 [-1,1].forEach(s=>{const h=new THREE.Mesh(P.round?sph(.1,12,8):box(.04,.08,.28),hl);h.position.set(L/2+.005,y0+H*.72,s*W*.33);g.add(h);
  const t=new THREE.Mesh(box(.04,.08,.3),tl);t.position.set(-L/2-.005,y0+H*.72,s*W*.33);g.add(t)});
 if(P.glow){const u=new THREE.Mesh(box(L*.9,.02,W*.9),hdr(.3,1.2,3));u.position.y=.04;g.add(u)}
 // wheels
 const wheels=[];[[L*.32,1],[L*.32,-1],[-L*.32,1],[-L*.32,-1]].forEach(([x,s])=>{const w=new THREE.Group();w.position.set(x,P.wr,s*(W/2-.06));
  const t=mesh(cyl(P.wr,P.wr,.24,22),tyre);t.rotation.x=Math.PI/2;w.add(t);const r=mesh(cyl(P.wr*.62,P.wr*.62,.25,14),rim);r.rotation.x=Math.PI/2;w.add(r);g.add(w);wheels.push(w)});
 g.userData.spin=d=>wheels.forEach(w=>{w.rotation.z-=d/P.wr});g.userData.len=L;return g}
