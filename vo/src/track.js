// OWQ Speedway: an indoor race track one level below the Sales Floor. You drive out through the garage door in the
// front-left corner of the office and come out in the track's pit tunnel; the tunnel's far end takes you back.
// Everything here is unlit (baked look + glow) so it adds no lights to the office.
import * as THREE from 'three';
import {cv,tex} from './tex.js';

export const TY=-40;                         // track floor height (below the office, never seen from it)
export const TRK={SL:20,RAD:14,HW:4.5,BAR:5.6,TUN:{x:3,z0:14,z1:27}};
export const DOOR={x:-9,z0:2.5,z1:4.7};    // garage door in the office's left wall
// distance from the track's centre line (0 on the racing line, TRK.HW at the track edge)
export function tdist(x,z){const{SL,RAD}=TRK;if(Math.abs(x)<=SL)return Math.abs(Math.abs(z)-RAD);const cx=Math.sign(x)*SL;return Math.abs(Math.hypot(x-cx,z)-RAD)}
export function trackHit(x,z,r){const{BAR,TUN}=TRK;if(Math.abs(x)<TUN.x-r&&z>TUN.z0&&z<TUN.z1+1)return false;return tdist(x,z)>BAR-r-.15}
// centre line, counter-clockwise seen from above; n = outward normal
function loop(step=.5){const{SL,RAD}=TRK,P=[];
  for(let x=-SL;x<SL;x+=step)P.push([x,-RAD,0,-1]);
  for(let a=-Math.PI/2;a<Math.PI/2;a+=step/RAD)P.push([SL+RAD*Math.cos(a),RAD*Math.sin(a),Math.cos(a),Math.sin(a)]);
  for(let x=SL;x>-SL;x-=step)P.push([x,RAD,0,1]);
  for(let a=Math.PI/2;a<Math.PI*1.5;a+=step/RAD)P.push([-SL+RAD*Math.cos(a),RAD*Math.sin(a),Math.cos(a),Math.sin(a)]);
  P.push(P[0]);return P}
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
export function buildTrack(root){const G=new THREE.Group();G.name='speedway';G.position.y=TY;root.add(G);const{SL,RAD,HW,BAR,TUN}=TRK,P=loop();
  const add=(geo,mat,x=0,y=0,z=0,rx=0,ry=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,0);m.matrixAutoUpdate=false;m.updateMatrix();G.add(m);return m};
  // hall
  add(new THREE.PlaneGeometry(100,72),B({map:rep(noiseCv(256,256,'#26262c',22),12,9),color:new THREE.Color(.9,.9,.95)}),0,0,4,-Math.PI/2);
  const wallC=noiseCv(512,128,'#120a10',10,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,31,79,.0)');g.addColorStop(1,'rgba(255,31,79,.16)');x.fillStyle=g;x.fillRect(0,0,w,h);x.fillStyle='#ff1f4f';x.fillRect(0,h*.8,w,3)});
  const wm=B({map:rep(wallC,6,1)});[[0,5,-32,0,100],[0,5,40,Math.PI,100],[-50,5,4,Math.PI/2,72],[50,5,4,-Math.PI/2,72]].forEach(([x,y,z,r,w])=>add(new THREE.PlaneGeometry(w,10),wm,x,y,z,0,r));
  add(new THREE.PlaneGeometry(100,72),B({color:0x07060a}),0,10,4,Math.PI/2);
  const led=B({color:new THREE.Color(3.2,3.1,3)});for(let x=-40;x<=40;x+=10)add(new THREE.BoxGeometry(.25,.08,60),led,x,9.9,4);
  // track: asphalt, centre dashes, curbs, barriers
  const asp=noiseCv(256,256,'#1d1e23',26,(x,w,h)=>{x.fillStyle='rgba(255,255,255,.55)';x.fillRect(0,0,6,h);x.fillRect(w-6,0,6,h);x.fillStyle='rgba(255,255,255,.35)';x.fillRect(w*.3,h/2-3,w*.4,6)});
  add(ribbon(P,-HW,HW,.01,9),B({map:rep(noiseCv(256,64,'#1d1e23',26,(x,w,h)=>{x.fillStyle='rgba(255,255,255,.5)';x.fillRect(0,0,w,3);x.fillRect(0,h-3,w,3);x.fillStyle='rgba(255,210,90,.55)';for(let i=0;i<2;i++)x.fillRect(i*w/2,h/2-2,w*.28,4)}))}));
  const curb=cv(64,8),cx=curb.getContext('2d');cx.fillStyle='#e8e8ec';cx.fillRect(0,0,64,8);cx.fillStyle='#ff1f4f';cx.fillRect(0,0,32,8);
  const cm=B({map:rep(curb),color:new THREE.Color(1.15,1.15,1.15)});add(ribbon(P,HW,HW+.8,.02,1.6),cm);add(ribbon(P,-HW-.8,-HW,.02,1.6),cm);
  const bar=cv(512,64),bx=bar.getContext('2d');bx.fillStyle='#0c0b0f';bx.fillRect(0,0,512,64);bx.fillStyle='#ff1f4f';bx.fillRect(0,0,512,5);bx.fillRect(0,59,512,5);
  bx.font='900 34px Verdana,sans-serif';bx.textBaseline='middle';bx.fillStyle='#fff';bx.fillText('ONLY WINNERS',20,33);bx.fillStyle='#ff6f8d';bx.fillText('OWQ SPEEDWAY',282,33);
  const bm=B({map:rep(bar),color:new THREE.Color(1.3,1.3,1.3)});
  const gap=(x,z)=>z>0&&Math.abs(x)<TUN.x&&Math.abs(z-RAD)<HW+2;
  add(wall(loop(),BAR,0,1.1,7,gap),bm);add(wall(loop(),-BAR,0,1.1,-7),bm);
  // inner field: grass-dark with the logo
  const inf=cv(1024,512),ix=inf.getContext('2d');ix.fillStyle='#101014';ix.fillRect(0,0,1024,512);ix.strokeStyle='rgba(255,31,79,.35)';ix.lineWidth=3;for(let i=0;i<1024;i+=32){ix.beginPath();ix.moveTo(i,0);ix.lineTo(i-256,512);ix.stroke()}
  ix.font='italic 900 120px Verdana,sans-serif';ix.textAlign='center';ix.textBaseline='middle';ix.shadowColor='#ff1f4f';ix.shadowBlur=40;ix.fillStyle='#fff';ix.fillText('ONLY WINNERS',512,256);
  add(new THREE.PlaneGeometry(2*SL+2*(RAD-BAR)-1,2*(RAD-BAR)-1),B({map:tex(inf,{mips:true}),color:new THREE.Color(1.1,1.1,1.1)}),0,.005,0,-Math.PI/2);
  // start / finish line on the bottom straight (x = 0)
  const ch=cv(64,256),chx=ch.getContext('2d');for(let i=0;i<4;i++)for(let j=0;j<16;j++){chx.fillStyle=(i+j)%2?'#111':'#f2f2f2';chx.fillRect(i*16,j*16,16,16)}
  add(new THREE.PlaneGeometry(1.2,2*HW),B({map:tex(ch,{mips:true})}),0,.03,-RAD,-Math.PI/2);
  // gantry over the start line
  const gm=B({color:0x18161c});add(new THREE.BoxGeometry(.4,6,.4),gm,0,3,-RAD-BAR-.6);add(new THREE.BoxGeometry(.4,6,.4),gm,0,3,-RAD+BAR+.6);add(new THREE.BoxGeometry(.6,.9,2*BAR+1.6),gm,0,6.2,-RAD);
  const gs=sign('START  ·  FINISH',8,1,'#ffffff','#ff1f4f');const gsm=B({map:tex(gs,{mips:true}),transparent:true,depthWrite:false,color:new THREE.Color(2,2,2)});
  add(new THREE.PlaneGeometry(9,1.1),gsm,.31,6.2,-RAD,0,Math.PI/2);add(new THREE.PlaneGeometry(9,1.1),gsm,-.31,6.2,-RAD,0,-Math.PI/2);
  // big neon over the far wall
  add(new THREE.PlaneGeometry(26,4.2),B({map:tex(sign('OWQ SPEEDWAY',26,4.2,'#fff0f6','#ff2d78'),{mips:true}),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:new THREE.Color(2.4,2.4,2.4)}),0,6.6,-31.8);
  // pit tunnel back up to the office
  const tm=B({map:rep(noiseCv(256,64,'#0d0c10',12,(x,w,h)=>{x.fillStyle='#ff1f4f';for(let i=0;i<w;i+=64)x.fillRect(i,h*.45,30,6)}),3,1)});
  const tl=TUN.z1-(RAD+BAR)+1.5,tz=(TUN.z1+RAD+BAR)/2+.6;
  add(new THREE.PlaneGeometry(2*TUN.x,tl),B({map:rep(asp,1,3)}),0,.012,tz,-Math.PI/2);
  add(new THREE.PlaneGeometry(tl,3.2),tm,-TUN.x,1.6,tz,0,Math.PI/2);add(new THREE.PlaneGeometry(tl,3.2),tm,TUN.x,1.6,tz,0,-Math.PI/2);add(new THREE.BoxGeometry(2*TUN.x+.4,.3,tl),B({color:0x0a090c}),0,3.3,tz);
  const pg=cv(256,256),px=pg.getContext('2d'),gr=px.createRadialGradient(128,128,10,128,128,128);gr.addColorStop(0,'rgba(255,240,246,1)');gr.addColorStop(.5,'rgba(255,31,79,.8)');gr.addColorStop(1,'rgba(255,31,79,0)');px.fillStyle=gr;px.fillRect(0,0,256,256);
  add(new THREE.PlaneGeometry(2*TUN.x,3.2),B({map:tex(pg,{mips:false}),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:new THREE.Color(2,2,2)}),0,1.6,TUN.z1+.9);
  add(new THREE.PlaneGeometry(5.6,.9),B({map:tex(sign('▲ BACK TO THE OFFICE',5.6,.9,'#ffffff','#ff1f4f'),{mips:true}),transparent:true,depthWrite:false,color:new THREE.Color(2,2,2)}),0,2.75,TUN.z1+.7,0,Math.PI);
  add(new THREE.PlaneGeometry(5.6,.9),B({map:tex(sign('PIT  ·  OWQ SPEEDWAY',5.6,.9,'#ffffff','#ff1f4f'),{mips:true}),transparent:true,depthWrite:false,color:new THREE.Color(2,2,2)}),0,3.9,RAD+BAR+.2,0,Math.PI);
  // lap board
  const lb=cv(1024,640),lbt=tex(lb,{mips:false});add(new THREE.PlaneGeometry(12,7.5),B({map:lbt}),-30,5.2,-31.7);
  const lbx=lb.getContext('2d');const draw=(rows,live)=>{const x=lbx;x.fillStyle='#08060a';x.fillRect(0,0,1024,640);x.fillStyle='#ff1f4f';x.fillRect(0,0,1024,10);
    x.font='900 54px Verdana,sans-serif';x.textAlign='left';x.textBaseline='alphabetic';x.fillStyle='#fff';x.fillText('FASTEST LAPS',44,90);x.font='700 26px Verdana,sans-serif';x.fillStyle='#ffb3c2';x.fillText(live||'Cross the line twice to set a time',46,132);
    (rows.length?rows:[['No laps yet','',0]]).slice(0,7).forEach((r,i)=>{const y=200+i*62;x.fillStyle=i===0&&r[2]?'rgba(255,209,102,.16)':'rgba(255,255,255,.05)';x.fillRect(40,y-44,944,54);x.font='800 34px Verdana,sans-serif';
      x.fillStyle=i===0&&r[2]?'#ffd166':'#fff';x.fillText((r[2]?(i+1)+'  ':'')+String(r[0]).toUpperCase().slice(0,22),60,y-6);x.textAlign='right';x.fillText(r[2]?r[2].toFixed(2)+'s':'',964,y-6);x.textAlign='left'});lbt.needsUpdate=true};
  draw([]);
  return{group:G,board:draw}}
// the garage door in the office (front-left corner): a lit opening with a neon sign above it
export function buildDoor(root){const G=new THREE.Group();G.name='trackdoor';root.add(G);const{x,z0,z1}=DOOR,w=z1-z0,zc=(z0+z1)/2;
  const add=(geo,mat,px,py,pz,ry=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(px,py,pz);m.rotation.y=ry;G.add(m);return m};
  const c=cv(256,256),g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#050306');gr.addColorStop(1,'#1a0710');g.fillStyle=gr;g.fillRect(0,0,256,256);
  g.strokeStyle='rgba(255,31,79,.55)';g.lineWidth=4;for(let i=1;i<6;i++){g.beginPath();g.moveTo(128-i*12,256);g.lineTo(128-i*4,60);g.stroke();g.beginPath();g.moveTo(128+i*12,256);g.lineTo(128+i*4,60);g.stroke()}
  g.fillStyle='rgba(255,31,79,.9)';g.beginPath();g.moveTo(128,120);g.lineTo(98,160);g.lineTo(158,160);g.closePath();g.fill();
  add(new THREE.PlaneGeometry(w,2.5),new THREE.MeshBasicMaterial({map:tex(c,{mips:false})}),x+.015,1.25,zc,Math.PI/2);
  const fm=new THREE.MeshBasicMaterial({color:new THREE.Color(3,.35,.8),toneMapped:false});
  add(new THREE.BoxGeometry(.06,2.6,.07),fm,x+.03,1.3,z0);add(new THREE.BoxGeometry(.06,2.6,.07),fm,x+.03,1.3,z1);add(new THREE.BoxGeometry(.06,.07,w+.07),fm,x+.03,2.6,zc);
  const sc=cv(1024,256),s=sc.getContext('2d');s.font='900 120px Verdana,sans-serif';s.textAlign='center';s.textBaseline='middle';s.shadowColor='#ff2d78';s.shadowBlur=40;s.fillStyle='#fff0f6';s.fillText('RACE TRACK',512,128);
  add(new THREE.PlaneGeometry(2.4,.6),new THREE.MeshBasicMaterial({map:tex(sc,{mips:true}),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:new THREE.Color(2.2,2.2,2.2),toneMapped:false}),x+.03,3.1,zc,Math.PI/2);
  // chevrons on the floor leading to it
  const ar=cv(128,128),a=ar.getContext('2d');a.strokeStyle='#ff1f4f';a.lineWidth=14;a.lineCap='round';[20,60].forEach(o=>{a.beginPath();a.moveTo(30+o*.3,100-o*.0);a.lineTo(64,40+o*.4);a.lineTo(98-o*.3,100);a.stroke()});
  const am=new THREE.MeshBasicMaterial({map:tex(ar,{mips:true}),transparent:true,depthWrite:false,opacity:.55});
  [1.0,2.1].forEach(d=>{const m=add(new THREE.PlaneGeometry(.8,.8),am,x+d,.006,zc);m.rotation.set(-Math.PI/2,0,Math.PI/2)});return G}
