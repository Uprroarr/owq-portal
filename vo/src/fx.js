import * as THREE from 'three';
import {billCanvas, glowCanvas, tex} from './tex.js';

const COLS=['#ff1f4f','#ffd166','#ffffff','#3ddc97','#7cc7ff','#ff7ab6','#b98cff'].map(c=>new THREE.Color(c));
const _m=new THREE.Matrix4();
const _q=new THREE.Quaternion();
const _e=new THREE.Euler();
const _s=new THREE.Vector3(1,1,1);
const _p=new THREE.Vector3();
class Pool{constructor(G,geo,mat,N){this.N=N;this.fz=-1e9;this.mesh=new THREE.InstancedMesh(geo,mat,N);this.mesh.count=0;this.mesh.frustumCulled=false;this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.mesh.castShadow=false;G.add(this.mesh);this.P=[];
    for(let i=0;i<N;i++)this.mesh.setColorAt(i,COLS[0]);}
  add(p){if(this.P.length>=this.N)this.P.shift();this.P.push(p)}
  update(dt,drag,grav){const P=this.P;let w=0;for(let i=0;i<P.length;i++){const p=P[i];p.life-=dt;if(p.life<=0)continue;
      if(!p.rest){p.vy-=grav*dt;const k=Math.exp(-drag*dt);p.vx*=k;p.vy*=k;p.vz*=k;p.x+=(p.vx+Math.sin(p.ph+p.life*6)*p.fl)*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.ax+=p.wx*dt;p.ay+=p.wy*dt;p.az+=p.wz*dt;if(p.y<=.004&&p.z>this.fz){p.y=.004;p.rest=1;p.ax=-Math.PI/2;p.ay=0;p.life=Math.min(p.life,2.2)}else if(p.y<-40)p.life=0}
      _e.set(p.ax,p.ay,p.az);_q.setFromEuler(_e);const sc=Math.min(1,p.life*2);_s.set(sc,sc,sc);_p.set(p.x,p.y,p.z);_m.compose(_p,_q,_s);this.mesh.setMatrixAt(w,_m);this.mesh.setColorAt(w,p.col);P[w++]=p}
    P.length=w;this.mesh.count=w;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true}}
class FX{constructor(G){this.G=G;
    this.cf=new Pool(G,new THREE.PlaneGeometry(.06,.034),new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:.4,metalness:.35,emissive:0x222222}),900);
    const bt=tex(billCanvas());this.bl=new Pool(G,new THREE.PlaneGeometry(.17,.074),new THREE.MeshStandardMaterial({map:bt,side:THREE.DoubleSide,roughness:.75}),220);
    this.NS=600;const g=new THREE.BufferGeometry();this.sp=new Float32Array(this.NS*3);this.sc=new Float32Array(this.NS*3);g.setAttribute('position',new THREE.BufferAttribute(this.sp,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('color',new THREE.BufferAttribute(this.sc,3).setUsage(THREE.DynamicDrawUsage));
    this.pts=new THREE.Points(g,new THREE.PointsMaterial({size:.09,map:tex(glowCanvas(),{mips:false}),vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true,toneMapped:false}));this.pts.frustumCulled=false;G.add(this.pts);
    // glass shards (the back window): they settle on the floor inside, and fall away outside the building
    const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute([-.1,-.07,0,.11,-.04,0,-.015,.13,0],3));sg.setAttribute('normal',new THREE.Float32BufferAttribute([0,0,1,0,0,1,0,0,1],3));
    this.gl=new Pool(G,sg,new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:.05,metalness:.9,transparent:true,opacity:.85,emissive:0x5a7d96,envMapIntensity:1.8}),360);this.gl.fz=-7.02;
    this.GC=['#e8f4ff','#cfe6ff','#ffffff','#bcd9f2'].map(c=>new THREE.Color(c));
    this.S=[];this.em=[]}
  shatter(x,y,z,n=150){for(let i=0;i<n;i++){const a=Math.random()*6.283,r=Math.sqrt(Math.random())*.75,out=Math.random()<.78;
      this.gl.add({x:x+Math.cos(a)*r,y:y+Math.sin(a)*r,z,vx:Math.cos(a)*(.6+Math.random()*1.8),vy:Math.sin(a)*(.6+Math.random()*1.6)+.8,vz:out?-(1.6+Math.random()*4.6):(.6+Math.random()*2.2),
        ax:Math.random()*6,ay:Math.random()*6,az:Math.random()*6,wx:(Math.random()-.5)*22,wy:(Math.random()-.5)*22,wz:(Math.random()-.5)*22,life:3.2+Math.random()*2.2,col:this.GC[i%this.GC.length],ph:Math.random()*6,fl:0,sc:.6+Math.random()*1.1})}}
  // a blast from outside: the whole window wall comes in
  blastIn(x0,x1,n){for(let i=0;i<n;i++){const x=x0+Math.random()*(x1-x0);this.gl.add({x,y:.25+Math.random()*4.7,z:-6.96,vx:(Math.random()-.5)*3.5,vy:Math.random()*2.6-.4,vz:4.5+Math.random()*9,
      ax:Math.random()*6,ay:Math.random()*6,az:Math.random()*6,wx:(Math.random()-.5)*30,wy:(Math.random()-.5)*30,wz:(Math.random()-.5)*30,life:3+Math.random()*2.5,col:this.GC[i%this.GC.length],ph:0,fl:0})}}
  confetti(x,y,z,n=160,sp=1.6){for(let i=0;i<n;i++){const a=Math.random()*6.283,u=Math.random();this.cf.add({x,y,z,vx:Math.cos(a)*sp*u,vy:2.6+Math.random()*3.2,vz:Math.sin(a)*sp*u,ax:Math.random()*6,ay:Math.random()*6,az:Math.random()*6,wx:(Math.random()-.5)*14,wy:(Math.random()-.5)*14,wz:(Math.random()-.5)*14,life:4+Math.random()*2.5,col:COLS[i%COLS.length],ph:Math.random()*6,fl:.5})}}
  rain(x,y,z,n=60,r=.9){for(let i=0;i<n;i++){const a=Math.random()*6.283,d=Math.random()*r;this.bl.add({x:x+Math.cos(a)*d,y:y+Math.random()*1.4,z:z+Math.sin(a)*d,vx:(Math.random()-.5)*.6,vy:-.2-Math.random()*.5,vz:(Math.random()-.5)*.6,ax:Math.random()*6,ay:Math.random()*6,az:Math.random()*6,wx:(Math.random()-.5)*6,wy:(Math.random()-.5)*8,wz:(Math.random()-.5)*6,life:4+Math.random()*2,col:COLS[2],ph:Math.random()*6,fl:.6})}}
  fire(x,y,z,dur=2.6){this.em.push({x,y,z,t:dur})}
  sparkle(x,y,z,n=40,c=[1,.8,.3]){for(let i=0;i<n;i++){const a=Math.random()*6.283,b=Math.random()*3.14;this.S.push({x,y,z,vx:Math.cos(a)*Math.sin(b)*1.6,vy:Math.cos(b)*1.6+.6,vz:Math.sin(a)*Math.sin(b)*1.6,l:.8+Math.random()*.6,L:1.4,c})}}
  update(dt){this.cf.update(dt,1.9,4.2);this.bl.update(dt,3.2,1.2);this.gl.update(dt,.35,9.8);
    for(const e of this.em){e.t-=dt;const n=Math.min(12,Math.ceil(dt*140));for(let i=0;i<n;i++){const a=Math.random()*6.283,r=.18+Math.random()*.22;this.S.push({x:e.x+Math.cos(a)*r,y:e.y+Math.random()*.9,z:e.z+Math.sin(a)*r,vx:(Math.random()-.5)*.3,vy:.8+Math.random()*1.4,vz:(Math.random()-.5)*.3,l:.5+Math.random()*.5,L:1,c:null})}}
    this.em=this.em.filter(e=>e.t>0);
    const S=this.S;let w=0;for(let i=0;i<S.length&&w<this.NS;i++){const s=S[i];s.l-=dt;if(s.l<=0)continue;s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;if(s.c)s.vy-=1.4*dt;
      const k=Math.max(0,s.l/s.L);this.sp[w*3]=s.x;this.sp[w*3+1]=s.y;this.sp[w*3+2]=s.z;
      if(s.c){this.sc[w*3]=s.c[0]*3*k;this.sc[w*3+1]=s.c[1]*3*k;this.sc[w*3+2]=s.c[2]*3*k}else{this.sc[w*3]=3.4*k;this.sc[w*3+1]=(.6+1.6*k)*k;this.sc[w*3+2]=.25*k*k}S[w++]=s}
    S.length=w;const g=this.pts.geometry;g.setDrawRange(0,w);g.attributes.position.needsUpdate=true;g.attributes.color.needsUpdate=true}}

export {FX};
