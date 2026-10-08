import * as THREE from 'three';
import {rng} from './util.js';

const cv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
let ANISO=8;
function tex(c,o={}){const t=new THREE.CanvasTexture(c);if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;
  if(o.rep){t.wrapS=t.wrapT=o.mirror?THREE.MirroredRepeatWrapping:THREE.RepeatWrapping;t.repeat.set(o.rep[0],o.rep[1])}
  t.anisotropy=o.aniso||ANISO;if(o.mips===false){t.generateMipmaps=false;t.minFilter=THREE.LinearFilter}t.needsUpdate=true;return t}
function path(x,p){x.beginPath();x.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)x.lineTo(p[i][0],p[i][1])}
function wrap9(x,S,fn,px,py,r){for(const dx of[-S,0,S])for(const dy of[-S,0,S]){if(px!==undefined&&(px+dx+r<0||px+dx-r>S||py+dy+r<0||py+dy-r>S))continue;x.save();x.translate(dx,dy);fn();x.restore()}}
/* polished dark marble, seamless, 2x2 tiles with seams */
function marbleCanvas(seed=7){
  const R=rng(seed),S=1024,c=cv(S,S),x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,S,S);g.addColorStop(0,'#1a161d');g.addColorStop(.5,'#110f14');g.addColorStop(1,'#18141c');x.fillStyle=g;x.fillRect(0,0,S,S);
  for(let i=0;i<190;i++){const px=R()*S,py=R()*S,r=30+R()*170,l=R(),a=.035+R()*.06,col=l<.45?'58,48,62':l<.8?'6,5,8':'66,52,42';
    wrap9(x,S,()=>{const gr=x.createRadialGradient(px,py,0,px,py,r);gr.addColorStop(0,`rgba(${col},${a})`);gr.addColorStop(1,`rgba(${col},0)`);x.fillStyle=gr;x.fillRect(px-r,py-r,2*r,2*r)},px,py,r)}
  const V=[];for(let v=0;v<13;v++){let px=R()*S,py=R()*S,a=R()*6.283;const p=[[px,py]],n=40+R()*55|0;for(let k=0;k<n;k++){a+=(R()-.5)*.55;const st=8+R()*10;px+=Math.cos(a)*st;py+=Math.sin(a)*st;p.push([px,py])}V.push({p,w:.5+R()*1.7,gold:R()<.42})}
  x.lineCap=x.lineJoin='round';
  x.filter='blur(3px)';V.forEach(v=>wrap9(x,S,()=>{x.strokeStyle=v.gold?'rgba(196,150,82,.16)':'rgba(214,206,224,.10)';x.lineWidth=v.w*7;path(x,v.p);x.stroke()}));
  x.filter='blur(.7px)';V.forEach(v=>wrap9(x,S,()=>{x.strokeStyle=v.gold?'rgba(240,196,116,.55)':'rgba(234,230,242,.32)';x.lineWidth=v.w;path(x,v.p);x.stroke()}));
  x.filter='none';
  const id=x.getImageData(0,0,S,S),d=id.data;for(let i=0;i<d.length;i+=4){const n=(R()-.5)*7;d[i]+=n;d[i+1]+=n;d[i+2]+=n}x.putImageData(id,0,0);
  x.fillStyle='rgba(0,0,0,.65)';for(const q of[0,S/2]){x.fillRect(q,0,2,S);x.fillRect(0,q,S,2)}
  x.fillStyle='rgba(255,236,214,.05)';for(const q of[0,S/2]){x.fillRect(q+2,0,1,S);x.fillRect(0,q+2,S,1)}
  return c}
function roughCanvas(seed=9){const R=rng(seed),S=512,c=cv(S,S),x=c.getContext('2d');x.fillStyle='rgb(62,62,62)';x.fillRect(0,0,S,S);
  for(let i=0;i<110;i++){const px=R()*S,py=R()*S,r=10+R()*80,v=R()<.55?118:34;wrap9(x,S,()=>{const g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,`rgba(${v},${v},${v},.38)`);g.addColorStop(1,`rgba(${v},${v},${v},0)`);x.fillStyle=g;x.fillRect(px-r,py-r,2*r,2*r)},px,py,r)}
  x.fillStyle='rgb(210,210,210)';for(const q of[0,S/2]){x.fillRect(q,0,2,S);x.fillRect(0,q,S,2)}return c}
/* wood slats (vertical) with grain */
function slatsCanvas(seed=1,base=[64,40,24],n=12,gap=6,S=1024){
  const R=rng(seed),c=cv(S,S),x=c.getContext('2d');x.fillStyle='#070504';x.fillRect(0,0,S,S);const w=S/n;
  for(let i=0;i<n;i++){const j=.8+R()*.32,col=base.map(v=>Math.min(255,v*j|0)),x0=i*w+gap/2,ww=w-gap;
    const g=x.createLinearGradient(x0,0,x0+ww,0);g.addColorStop(0,`rgb(${col.map(v=>v*.78|0)})`);g.addColorStop(.45,`rgb(${col})`);g.addColorStop(1,`rgb(${col.map(v=>v*.7|0)})`);x.fillStyle=g;x.fillRect(x0,0,ww,S);
    x.save();x.beginPath();x.rect(x0,0,ww,S);x.clip();
    for(let k=0;k<30;k++){const gx=x0+R()*ww,amp=1.5+R()*6,fr=.004+R()*.012,ph=R()*6;x.strokeStyle=R()<.55?`rgba(0,0,0,${.07+R()*.13})`:`rgba(255,222,186,${.03+R()*.06})`;x.lineWidth=.6+R()*1.7;x.beginPath();for(let y=0;y<=S;y+=16){const xx=gx+Math.sin(y*fr+ph)*amp;y?x.lineTo(xx,y):x.moveTo(xx,y)}x.stroke()}
    x.restore()}
  return c}
/* living green wall */
function foliageCanvas(seed=3,S=1024){const R=rng(seed),c=cv(S,S),x=c.getContext('2d');x.fillStyle='#061008';x.fillRect(0,0,S,S);
  for(let i=0;i<2800;i++){const px=R()*S,py=R()*S,rx=7+R()*17,ry=3+R()*7,a=R()*6.283,h=86+R()*58,s=34+R()*36,l=9+R()*24+(i/2800)*10;
    wrap9(x,S,()=>{x.save();x.translate(px,py);x.rotate(a);const g=x.createLinearGradient(-rx,0,rx,0);g.addColorStop(0,`hsl(${h},${s}%,${l*.65}%)`);g.addColorStop(1,`hsl(${h},${s}%,${l*1.3}%)`);x.fillStyle=g;x.beginPath();x.ellipse(0,0,rx,ry,0,0,6.283);x.fill();x.strokeStyle=`hsla(${h},${s}%,${l*1.7}%,.32)`;x.lineWidth=.8;x.beginPath();x.moveTo(-rx*.9,0);x.lineTo(rx*.9,0);x.stroke();x.restore()},px,py,24)}
  for(let i=0;i<70;i++){const px=R()*S,py=R()*S,hue=R()<.6?320+R()*18:R()<.5?38+R()*10:0;for(let k=0;k<8;k++){x.fillStyle=`hsl(${hue},${72+R()*20}%,${48+R()*14}%)`;x.beginPath();x.arc(px+(R()-.5)*20,py+(R()-.5)*20,2.4+R()*3.2,0,6.283);x.fill()}}
  return c}
/* monstera leaf with splits + holes, stem at bottom center */
function monsteraCanvas(seed=5){const R=rng(seed),S=512,c=cv(S,S),x=c.getContext('2d');x.translate(S/2,S*.97);
  x.beginPath();x.moveTo(0,0);x.bezierCurveTo(-S*.52,-S*.06,-S*.52,-S*.8,0,-S*.92);x.bezierCurveTo(S*.52,-S*.8,S*.52,-S*.06,0,0);x.closePath();
  const g=x.createLinearGradient(-S*.45,0,S*.45,-S*.85);g.addColorStop(0,'#0c3518');g.addColorStop(.5,'#1a6a2e');g.addColorStop(1,'#33913f');x.fillStyle=g;x.fill();
  x.strokeStyle='rgba(176,226,146,.5)';x.lineWidth=6;x.beginPath();x.moveTo(0,0);x.quadraticCurveTo(S*.02,-S*.46,0,-S*.9);x.stroke();
  x.lineWidth=2.2;x.strokeStyle='rgba(150,210,130,.32)';for(let i=0;i<7;i++){const t=.12+i*.11;for(const s of[-1,1]){x.beginPath();x.moveTo(0,-S*t*.95);x.quadraticCurveTo(s*S*.2,-S*(t+.04),s*S*.43*(1-Math.abs(t-.45)*.6),-S*(t+.1));x.stroke()}}
  x.globalCompositeOperation='destination-out';
  for(let i=0;i<6;i++){const t=.17+i*.12;for(const s of[-1,1]){const y0=-S*(t+.07),xe=s*S*.5;x.beginPath();x.moveTo(xe,y0-S*.014);x.quadraticCurveTo(s*S*.25,y0+S*.008,s*S*.075,-S*(t+.035));x.quadraticCurveTo(s*S*.25,y0+S*.032,xe,y0+S*.034);x.closePath();x.fill()}}
  for(let i=0;i<5;i++){const t=.22+i*.13;for(const s of[-1,1]){x.beginPath();x.ellipse(s*S*.13,-S*(t+.02),S*.026,S*.012,s*.5,0,6.283);x.fill()}}
  x.globalCompositeOperation='source-over';return c}
/* palm frond: rib along x (base->tip), leaflets toward +-y */
function frondCanvas(seed=11){const R=rng(seed),W=1024,H=256,c=cv(W,H),x=c.getContext('2d'),cy=H/2;
  for(let i=0;i<74;i++){const t=i/74,px=30+t*975,len=(H*.48)*(1-Math.pow(t,1.7)*.78)*(.85+R()*.25),ang=.92+R()*.16;
    for(const s of[-1,1]){const ex=px+Math.cos(ang)*len*.6,ey=cy+s*Math.sin(ang)*len;x.beginPath();x.moveTo(px,cy);x.quadraticCurveTo(px+len*.44,cy+s*len*.46,ex,ey);x.quadraticCurveTo(px+len*.22,cy+s*len*.36,px+7,cy);x.closePath();
      const l=20+R()*15;x.fillStyle=`hsl(${98+R()*24},${44+R()*22}%,${l}%)`;x.fill();x.strokeStyle=`hsla(88,50%,${l+22}%,.38)`;x.lineWidth=1;x.stroke()}}
  x.strokeStyle='#56632e';x.lineWidth=7;x.beginPath();x.moveTo(0,cy);x.lineTo(W,cy);x.stroke();return c}
/* fern card */
function fernCanvas(seed=13){const R=rng(seed),S=256,c=cv(S,S),x=c.getContext('2d');
  for(let f=0;f<5;f++){const a=-1.25+f*.62+(R()-.5)*.2;x.save();x.translate(S/2,S);x.rotate(a);const L=S*(.62+R()*.32);
    x.strokeStyle='#2c5a22';x.lineWidth=3;x.beginPath();x.moveTo(0,0);x.quadraticCurveTo(L*.1,-L*.5,0,-L);x.stroke();
    for(let i=0;i<22;i++){const t=i/22,y=-L*(.08+t*.9),w=(1-t)*L*.24+4;for(const s of[-1,1]){x.fillStyle=`hsl(${100+R()*25},${45+R()*20}%,${18+R()*18}%)`;x.beginPath();x.ellipse(s*w*.5,y,w*.5,3.5+(1-t)*2,s*.35,0,6.283);x.fill()}}
    x.restore()}return c}
function neonCanvas($, { w: J = 2048, h: Q = 512, font: Z = 'italic 700 250px "Brush Script MT","Segoe Script","Lucida Handwriting","Apple Chancery","URW Chancery L",cursive', col: U = "#ff2d78", core: q = "#fff0f6" } = {}) {
    let E = cv(J, Q), Y = E.getContext("2d");
    Y.textAlign = "center", Y.textBaseline = "middle", Y.font = Z, Y.lineJoin = "round", Y.lineCap = "round";
    let K = 250;
    while (K > 60 && Y.measureText($).width > J * 0.92)
      K -= 10, Y.font = Z.replace(/\d+px/, K + "px");
    return Y.shadowColor = U, Y.globalAlpha = 0.5, Y.shadowBlur = 46, Y.strokeStyle = U, Y.lineWidth = 20, Y.strokeText($, J / 2, Q / 2), Y.globalAlpha = 1, Y.shadowBlur = 20, Y.lineWidth = 11, Y.strokeText($, J / 2, Q / 2), Y.shadowBlur = 6, Y.strokeStyle = q, Y.lineWidth = 4.5, Y.strokeText($, J / 2, Q / 2), Y.shadowBlur = 0, E;
  }
function blobCanvas(){const S=128,c=cv(S,S),x=c.getContext('2d');const g=x.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);g.addColorStop(0,'rgba(0,0,0,.9)');g.addColorStop(.4,'rgba(0,0,0,.5)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,S,S);return c}
function glowCanvas(){const S=128,c=cv(S,S),x=c.getContext('2d');const g=x.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,S,S);return c}
function billCanvas(){const W=256,H=112,c=cv(W,H),x=c.getContext('2d');const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#d6ead0');g.addColorStop(1,'#a9cfa0');x.fillStyle=g;x.fillRect(0,0,W,H);x.strokeStyle='#2f6b3a';x.lineWidth=6;x.strokeRect(6,6,W-12,H-12);x.lineWidth=2;x.strokeRect(14,14,W-28,H-28);x.fillStyle='#235a2f';x.font='bold 50px Georgia,serif';x.textAlign='center';x.textBaseline='middle';x.fillText('$100',W/2,H/2+2);x.lineWidth=3;for(const cx of[42,W-42]){x.beginPath();x.arc(cx,H/2,22,0,6.28);x.stroke()}return c}
/* gold floor inlay */
function inlayCanvas(){const S=1024,c=cv(S,S),x=c.getContext('2d'),r=S/2;x.translate(r,r);x.strokeStyle='#fff';x.fillStyle='#fff';
  x.lineWidth=12;x.beginPath();x.arc(0,0,r*.95,0,6.283);x.stroke();x.lineWidth=5;x.beginPath();x.arc(0,0,r*.76,0,6.283);x.stroke();
  const T='ONLY WINNERS • & QUITTERS • MIAMI • ';x.font='700 70px Georgia,serif';x.textAlign='center';x.textBaseline='middle';const n=T.length;
  for(let i=0;i<n;i++){x.save();x.rotate(i/n*6.283);x.translate(0,-r*.855);x.fillText(T[i],0,0);x.restore()}
  x.beginPath();for(let i=0;i<16;i++){const a=i/16*6.283,rr=i%2?r*.2:r*.66;x.lineTo(Math.sin(a)*rr,-Math.cos(a)*rr)}x.closePath();x.lineWidth=7;x.stroke();
  x.beginPath();x.arc(0,0,r*.36,0,6.283);x.fillStyle='#000';x.fill();x.lineWidth=6;x.strokeStyle='#fff';x.stroke();x.fillStyle='#fff';
  x.font='bold 150px Georgia,serif';x.fillText('OWQ',0,10);return c}
/* desk nameplate (gold on black) */
function plateCanvas(name){const W=512,H=96,c=cv(W,H),x=c.getContext('2d');x.fillStyle='#0b0a0d';x.fillRect(0,0,W,H);
  const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#fff1c4');g.addColorStop(.5,'#e2b25a');g.addColorStop(1,'#9c6d24');
  x.strokeStyle=g;x.lineWidth=3;x.strokeRect(5,5,W-10,H-10);x.fillStyle=g;x.textAlign='center';x.textBaseline='middle';
  let fs=46;x.font=`700 ${fs}px Georgia,serif`;const t=String(name||'').toUpperCase();while(fs>18&&x.measureText(t).width>W-40){fs-=2;x.font=`700 ${fs}px Georgia,serif`}
  x.fillText(t,W/2,H/2+2);return c}

export {billCanvas, blobCanvas, cv, fernCanvas, foliageCanvas, frondCanvas, glowCanvas, inlayCanvas, marbleCanvas, monsteraCanvas, neonCanvas, plateCanvas, roughCanvas, slatsCanvas, tex};
