import * as THREE from 'three';
import {clamp, lerp, sstep} from './util.js';

const GZ=new THREE.Vector3(-24,-8.5,-44);
const WIN=new THREE.Vector3(-7.165,2.6,-7);
const HITR=GZ.distanceTo(WIN);
const K=.8;
const NT={press:1.3,cut:1.7,drop:1.8,impact:3.8,wave:4.7,hit:6.7,dark:8.3,black:9.0,rebuild:10.7,end:11.9};
const PUFF_VS='attribute float aH;attribute float aS;varying float vH;varying vec3 vN;varying vec3 vW;'+
 'void main(){vec3 p=position;float n=sin(p.x*5.+aS*13.)*sin(p.y*4.+aS*7.)*sin(p.z*6.+aS*5.);p*=1.+.17*n;'+
 'mat4 m=modelMatrix*instanceMatrix;vec4 w=m*vec4(p,1.);vW=w.xyz;vN=normalize(mat3(m)*normal);vH=aH;gl_Position=projectionMatrix*viewMatrix*w;}';
const PUFF_FS='uniform float uDim;varying float vH;varying vec3 vN;varying vec3 vW;'+
 'void main(){vec3 N=normalize(vN);vec3 V=normalize(cameraPosition-vW);float d=max(dot(N,normalize(vec3(.35,.85,.4))),0.);float un=max(-N.y,0.);'+
 'vec3 sm=mix(vec3(.06,.045,.04),vec3(.36,.28,.23),d)+vec3(.95,.38,.09)*un*.5;float h=clamp(vH,0.,1.);'+
 'vec3 hot=mix(vec3(1.5,.42,.06),vec3(3.4,2.3,1.05),h*h)*(.5+.55*d+.35*un);vec3 c=mix(sm*uDim,hot,smoothstep(.05,.6,h));'+
 'float rim=pow(1.-max(dot(N,V),0.),2.5);c+=vec3(.95,.38,.09)*rim*h*1.1;gl_FragColor=vec4(c,1.);}';
const DOME_VS='varying vec3 vN;varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}';
const DOME_FS='uniform float uA;varying vec3 vN;varying vec3 vW;void main(){vec3 V=normalize(cameraPosition-vW);float f=pow(1.-abs(dot(normalize(vN),V)),2.2);gl_FragColor=vec4(vec3(1.7,1.4,1.1)*f*uA,1.);}';
const WALL_VS='varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const WALL_FS='uniform float uA;varying vec2 vU;void main(){float a=pow(1.-vU.y,1.6)*uA*(.75+.25*sin(vU.x*90.));gl_FragColor=vec4(vec3(.42,.33,.26),a);}';
class Nuke {
    constructor(O,a){this.O=O;this.a=a;this.t=0;this.G=new THREE.Group();this.G.name='nuke';O.room.group.add(this.G);this.done=false;this.fired={};this.own=[];
    const R=O.room,L=R.lights;this.save={key:L.key.intensity,sl:L.sl.intensity,sr:L.sr.intensity,rim:L.rim.intensity,rimC:L.rim.color.clone(),hemi:L.hemi.intensity,uK:R.backdrop.material.uniforms.uK.value};
    this.build()}
  mk(geo,mat){this.own.push(geo,mat);return new THREE.Mesh(geo,mat)}
  build(){const G=this.G;
    // bomb, nose down, with a smoke trail above it
    const bomb=this.bomb=new THREE.Group();const bm=new THREE.MeshStandardMaterial({color:0x3d4232,roughness:.45,metalness:.55}),ym=new THREE.MeshStandardMaterial({color:0xf2b33d,roughness:.5,emissive:0x3a2600});this.own.push(bm,ym);
    const body=this.mk(new THREE.CylinderGeometry(.55,.55,2.6,20),bm);bomb.add(body);const nose=this.mk(new THREE.SphereGeometry(.55,20,12,0,Math.PI*2,Math.PI/2,Math.PI/2),bm);nose.position.y=-1.3;bomb.add(nose);
    const tail=this.mk(new THREE.CylinderGeometry(.2,.55,.9,16),bm);tail.position.y=1.75;bomb.add(tail);const band=this.mk(new THREE.CylinderGeometry(.57,.57,.22,20),ym);band.position.y=-.55;bomb.add(band);
    for(let i=0;i<4;i++){const f=this.mk(new THREE.BoxGeometry(.06,.95,.75),bm);const g=new THREE.Group();g.rotation.y=i*Math.PI/2;f.position.set(0,1.85,.55);g.add(f);bomb.add(g)}
    bomb.scale.setScalar(1.7);bomb.visible=false;G.add(bomb);
    this.trail=this.mk(new THREE.CylinderGeometry(.5,.12,1,12,1,true),new THREE.MeshBasicMaterial({color:0xd8d4d0,transparent:true,opacity:.32,depthWrite:false}));this.trail.visible=false;G.add(this.trail);
    // flash core
    this.core=this.mk(new THREE.SphereGeometry(1,28,18),new THREE.MeshBasicMaterial({color:new THREE.Color(42,34,22),transparent:true,depthWrite:false}));this.core.position.copy(GZ);this.core.visible=false;G.add(this.core);
    // mushroom cloud: instanced puffs that start as one fireball and settle into skirt, stem and a rolling cap
    const P=this.P=[];const add=(k,n,f)=>{for(let i=0;i<n;i++)P.push(Object.assign({k,i,n,r:Math.random(),r2:Math.random(),th:Math.random()*Math.PI*2,d:new THREE.Vector3().randomDirection()},f?f(i,n):{}))};
    add('cap',74,(i,n)=>({th:i/n*Math.PI*2+Math.random()*.2,ph:Math.random()*Math.PI*2}));add('top',26);add('stem',34);add('skirt',36,(i,n)=>({th:i/n*Math.PI*2+Math.random()*.3}));
    const N=P.length,pg=new THREE.IcosahedronGeometry(1,2);this.aH=new THREE.InstancedBufferAttribute(new Float32Array(N),1);const s=new Float32Array(N);for(let i=0;i<N;i++)s[i]=Math.random();
    pg.setAttribute('aH',this.aH);pg.setAttribute('aS',new THREE.InstancedBufferAttribute(s,1));
    this.pu={uDim:{value:1}};const pm=new THREE.ShaderMaterial({uniforms:this.pu,vertexShader:PUFF_VS,fragmentShader:PUFF_FS});this.own.push(pg,pm);
    this.puffs=new THREE.InstancedMesh(pg,pm,N);this.puffs.frustumCulled=false;this.puffs.visible=false;this.puffs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);G.add(this.puffs);
    // condensation ring
    this.ring=this.mk(new THREE.TorusGeometry(1,.05,8,72),new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,2.1,2),transparent:true,opacity:0,depthWrite:false}));this.ring.rotation.x=Math.PI/2;this.ring.visible=false;G.add(this.ring);
    // shockwave: a bright shell plus a wall of dust along the ground
    this.du={uA:{value:0}};this.dome=this.mk(new THREE.SphereGeometry(1,56,24,0,Math.PI*2,0,Math.PI/2),new THREE.ShaderMaterial({uniforms:this.du,vertexShader:DOME_VS,fragmentShader:DOME_FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
    this.dome.position.copy(GZ);this.dome.visible=false;G.add(this.dome);
    this.wu={uA:{value:0}};const wg=new THREE.CylinderGeometry(1,1,1,72,1,true);wg.translate(0,.5,0);this.wall=this.mk(wg,new THREE.ShaderMaterial({uniforms:this.wu,vertexShader:WALL_VS,fragmentShader:WALL_FS,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
    this.wall.position.copy(GZ);this.wall.visible=false;G.add(this.wall);
    // lights: red alarm inside, the fire glow coming through the windows
    this.alarm=new THREE.PointLight(0xff1838,0,20,1.6);this.alarm.position.set(0,4.6,-1);G.add(this.alarm);
    this.glow=new THREE.PointLight(0xff8a3a,0,30,1.4);this.glow.position.set(-7.2,3.2,-6.2);G.add(this.glow);
    // detonator in the owner's right hand
    const a=this.a;if(a&&a.el&&a.el[1]){const dm=new THREE.MeshStandardMaterial({color:0x111114,roughness:.4,metalness:.4}),rm=new THREE.MeshBasicMaterial({color:new THREE.Color(3,.15,.2)});this.own.push(dm,rm);
      const d=this.det=new THREE.Group();const b=this.mk(new THREE.BoxGeometry(.09,.14,.06),dm);d.add(b);const k=this.mk(new THREE.CylinderGeometry(.024,.024,.02,16),rm);k.rotation.x=Math.PI/2;k.position.set(0,.03,.035);d.add(k);
      const an=this.mk(new THREE.CylinderGeometry(.005,.005,.12,6),dm);an.position.set(.03,.12,0);d.add(an);d.position.set(0,-.21,.05);d.rotation.x=-.3;a.el[1].add(d)}
    // full-screen overlay for the flashes and the blackout
    const ov=this.ov=document.createElement('div');ov.className='vo3nk';ov.innerHTML='<b></b>';this.ovT=ov.firstChild;this.O.el.appendChild(ov)}
  // ---------- per frame ----------
  update(dt){const O=this.O,T=this.t+=dt,R=O.room,L=R.lights,once=k=>this.fired[k]?false:(this.fired[k]=1,true);
    // alarm before the drop
    this.alarm.intensity=T<NT.impact?(.5+.5*Math.sin(T*9))*36*sstep(0,.3,T):0;
    if(once('siren'))O.sfx('siren');
    if(T>=NT.press&&once('press')){O.sfx('click');if(this.a)O.popAt(this.a,'☢️')}
    // the bomb falls
    if(T>=NT.drop&&T<NT.impact){if(once('drop'))O.sfx('whistle');const u=(T-NT.drop)/(NT.impact-NT.drop),y=lerp(13.5,GZ.y+1.5,Math.pow(u,1.35));
      this.bomb.visible=true;this.bomb.position.set(GZ.x+Math.sin(u*3)*.4,y,GZ.z);this.bomb.rotation.set(Math.sin(T*7)*.04,T*1.4,Math.sin(T*5)*.05);
      const top=17,len=Math.max(.1,top-y-3);this.trail.visible=true;this.trail.scale.set(1,len,1);this.trail.position.set(GZ.x,y+3+len/2,GZ.z);this.trail.material.opacity=.32*(1-u*.4)}
    else{this.bomb.visible=false;if(T>=NT.impact)this.trail.material.opacity=Math.max(0,this.trail.material.opacity-dt*.25);this.trail.visible=T<NT.impact+1.5&&T>=NT.drop}
    // impact
    const u=T-NT.impact;
    if(u>=0){if(once('impact')){O.sfx('boom');O.shk=Math.max(O.shk||0,.7);this.core.visible=true;this.puffs.visible=true;this.ring.visible=true;L.rim.color.set(0xff8040)}
      this.core.scale.setScalar(Math.max(.01,8*K*sstep(0,.25,u)*(1+.2*u)));this.core.material.opacity=1-sstep(.08,.9,u);if(u>1)this.core.visible=false;
      this.mush(u);
      const rk=sstep(.6,2.6,u);this.ring.scale.setScalar((3+19*rk)*K);this.ring.position.set(GZ.x,GZ.y+this.capH(u)*.82,GZ.z);this.ring.material.opacity=.75*sstep(.6,.9,u)*(1-sstep(1.9,2.8,u));
      const fl=Math.exp(-u*1.6);this.glow.intensity=T<NT.hit?30+170*fl:0;L.rim.intensity=this.save.rim+9*fl+2;
      R.backdrop.material.uniforms.uK.value=T<NT.hit?lerp(.4,1.7,fl):.2}
    // shockwave
    if(T>=NT.wave&&T<NT.hit+.2){const w=clamp((T-NT.wave)/(NT.hit-NT.wave),0,1),r=Math.max(.5,HITR*Math.pow(w,1.12));this.dome.visible=this.wall.visible=true;
      this.dome.scale.setScalar(r);this.du.uA.value=.85*sstep(0,.12,w);this.wall.scale.set(r,5+15*w,r);this.wu.uA.value=.8*sstep(0,.1,w);
      if(once('rumble'))O.sfx('rumble')}
    else if(T>=NT.hit+.2){this.dome.visible=this.wall.visible=false}
    // it hits the building
    if(T>=NT.hit){if(once('hit'))this.hit();const h=T-NT.hit;
      const fk=h<1.4?(Math.random()<.5?.15:1):Math.max(.12,.5-h*.1);L.key.intensity=this.save.key*fk*.6;L.sl.intensity=this.save.sl*fk*.5;L.sr.intensity=this.save.sr*fk*.5;
      this.glow.intensity=(70+50*Math.sin(h*23)*Math.random())*Math.exp(-h*.4);R.group.position.x=Math.sin(h*41)*.12*Math.exp(-h*2.2);R.group.position.y=Math.sin(h*37+1)*.06*Math.exp(-h*2.2);
      this.blown(dt)}
    // overlay: impact flash, blast whiteout, dust, blackout, text, fade back in
    let op=0,bg='#ffffff',txt='',to=0;
    if(u>=0&&T<NT.hit)op=.6*(1-sstep(0,.45,u));
    if(T>=NT.hit){const h=T-NT.hit;op=h<.12?1:lerp(1,.62,sstep(.12,1.3,h));bg=h<.5?'#fff6e8':'#3b2b20';
      if(T>=NT.dark){op=lerp(.62,1,sstep(NT.dark,NT.black,T));bg='#0a0506'}}
    if(T>=NT.black){op=1;bg='#050304';txt=T<NT.rebuild-.5?'THE SALES FLOOR HAS BEEN NUKED':'REBUILDING THE FLOOR';to=sstep(NT.black,NT.black+.4,T)*(1-sstep(NT.rebuild-.7,NT.rebuild-.5,T))+sstep(NT.rebuild-.5,NT.rebuild-.3,T)*(1-sstep(NT.rebuild,NT.rebuild+.2,T))}
    if(T>=NT.rebuild){if(once('rebuild'))this.rebuild();op=1-sstep(NT.rebuild,NT.end,T)}
    this.ov.style.opacity=op.toFixed(3);this.ov.style.background=bg;this.ovT.textContent=txt;this.ovT.style.opacity=to.toFixed(3);
    if(T>=NT.end+.1)this.finish()}
  capH(u){return (2+17*(1-Math.exp(-u/2.4)))*K}
  mush(u){const P=this.P,M=this.puffs,m=this._m||(this._m=new THREE.Matrix4()),q=this._q||(this._q=new THREE.Quaternion()),v=this._v||(this._v=new THREE.Vector3()),f=this._f||(this._f=new THREE.Vector3()),sc=this._s||(this._s=new THREE.Vector3());
    const H=this.capH(u),Rc=(2.4+5*(1-Math.exp(-u/2)))*K,rt=(1.8+1.5*(1-Math.exp(-u/2.5)))*K,form=sstep(.1,1.8,u),Rf=7*K*sstep(0,.45,u),fc=GZ.y+(2.5+4*sstep(0,1.2,u))*K,A=this.aH.array;
    for(let i=0;i<P.length;i++){const p=P[i];let x=0,y=0,z=0,s=1,h=0;
      if(p.k==='cap'){const ph=p.ph+u*1.15,r=Rc+rt*Math.cos(ph);x=Math.cos(p.th)*r;z=Math.sin(p.th)*r;y=H+rt*.78*Math.sin(ph);s=(2.1+1*p.r)*K*(.75+.25*sstep(0,4,u));h=clamp(1.15-u*.36-.3*Math.sin(ph),0,1)}
      else if(p.k==='top'){const rr=Math.sqrt(p.r)*Rc*.85;x=Math.cos(p.th)*rr;z=Math.sin(p.th)*rr;y=H+rt*.95+(1-p.r)*1.4*K;s=(2.1+.9*p.r2)*K;h=clamp(.95-u*.38,0,1)}
      else if(p.k==='stem'){const k=p.i/p.n,top=Math.max(1,H-rt*.7);y=k*top;const jw=(.25+k*.55)*K;x=Math.sin(p.i*1.7+u*.8)*jw;z=Math.cos(p.i*2.3+u*.6)*jw;s=(.85+.75*k)*K*(.8+.4*p.r)*sstep(.2,1.4,u);h=clamp(1.1-u*.36-.4*k,0,1)}
      else{const rr=(2+12*(1-Math.exp(-u/1.6)))*K*(.8+.4*p.r);x=Math.cos(p.th)*rr;z=Math.sin(p.th)*rr;y=(.3+p.r2*.9)*K;s=(.9+.8*p.r)*K*sstep(.2,1,u);h=clamp(.5-u*.4,0,1)*.6}
      v.set(GZ.x+x,GZ.y+y,GZ.z+z);
      if(p.k!=='skirt'){f.copy(p.d).multiplyScalar(Rf*Math.cbrt(p.r));f.x+=GZ.x;f.y+=fc;f.z+=GZ.z;v.lerpVectors(f,v,form);s=lerp(2.6*K,s,form);h=Math.max(h,1-form)}
      q.setFromAxisAngle(p.d,u*.3+p.r*6);sc.setScalar(Math.max(.01,s));m.compose(v,q,sc);M.setMatrixAt(i,m);A[i]=h}
    M.instanceMatrix.needsUpdate=true;this.aH.needsUpdate=true}
  hit() {
      let $ = this.O, J = $.room;
      if ($.sfx("blast"), $.sfx("smash"), $.shk = 3, (J.glass || []).forEach((Q) => Q.visible = false), $.fx.blastIn)
        $.fx.blastIn(-10, -5.33, 170), $.fx.blastIn(3.45, 7, 90);
      if ($.fx.sparkle(-7.165, 2.4, -6.6, 60, [1, 0.6, 0.25]), $.fx.sparkle(5.2, 2.4, -6.6, 30, [1, 0.6, 0.25]), this.blownL = [], $.av.forEach((Q) => {
        if (!Q.root.visible || Q.mode !== "seated" || $.busy(Q))
          return;
        let Z = Q.root.position, U = Z.x - WIN.x;
        Q.mode = "tossed", Q.tossF = 1, Q.chuteK = 0, Q.emo = null, Q.idleK = null, Q.nuked = 1, this.blownL.push({ a: Q, v: new THREE.Vector3(clamp(U * 0.22, -2, 3.5) + (Math.random() - 0.5) * 1.5, 3.2 + Math.random() * 2.2, 6 + Math.random() * 3.5), w: 5 + Math.random() * 4, rx: 0, land: 0 });
      }), this.det)
        this.det.parent && this.det.parent.remove(this.det), this.det = null;
    }
  blown(dt){for(const B of this.blownL||[]){const a=B.a,r=a.root,p=r.position;if(a.leaving||!a.nuked)continue;
      if(!B.land){B.v.y-=12*dt;p.addScaledVector(B.v,dt);B.rx+=B.w*dt;r.rotation.x=B.rx;
        if(p.z>5.1){p.z=5.1;B.v.z*=-.25}if(Math.abs(p.x)>8.5){p.x=Math.sign(p.x)*8.5;B.v.x*=-.3}
        if(p.y<=.16&&B.v.y<0){p.y=.16;B.land=1;B.v.y=0;B.v.x*=.35;B.v.z*=.35;this.O.sfx('thud');B.rx=1.5+Math.round((B.rx-1.5)/(Math.PI*2))*Math.PI*2}}
      else{const k=Math.exp(-4*dt);B.v.x*=k;B.v.z*=k;p.x+=B.v.x*dt;p.z=Math.min(5.1,p.z+B.v.z*dt);r.rotation.x+=(B.rx-r.rotation.x)*Math.min(1,dt*8);a.tossF=Math.max(.25,a.tossF-dt*.9)}}}
  rebuild(){const O=this.O,R=O.room,L=R.lights,S=this.save;(R.glass||[]).forEach(g=>g.visible=true);
    L.key.intensity=S.key;L.sl.intensity=S.sl;L.sr.intensity=S.sr;L.rim.intensity=S.rim;L.rim.color.copy(S.rimC);L.hemi.intensity=S.hemi;R.backdrop.material.uniforms.uK.value=S.uK;R.group.position.set(0,0,0);
    for(const B of this.blownL||[]){const a=B.a;if(!a.nuked)continue;a.nuked=0;if(a.leaving||!a.seat)continue;a.root.rotation.set(0,0,0);a.tossF=0;a.sitNow();a.emote('dizzy')}this.blownL=[];
    this.G.visible=false;this.alarm.intensity=this.glow.intensity=0;O.sfx('ding');O.ui.toast('The floor has been rebuilt.')}
  finish(){if(this.done)return;this.done=true;const O=this.O;if(!this.fired.rebuild)this.rebuild();if(this.det&&this.det.parent)this.det.parent.remove(this.det);
    O.room.group.remove(this.G);this.own.forEach(x=>x.dispose&&x.dispose());this.ov.remove()}
  // camera: the owner with the detonator, then the left windows
  shot(P,T,vf){const t=this.t;if(t<NT.cut&&this.a&&this.a.root.visible){const h=this.a.headPos(this._h||(this._h=new THREE.Vector3()));P.set(h.x+1.05,h.y+.1,h.z+2.9);T.set(h.x+.12,h.y-.48,h.z);return 32}
    P.set(-3.6,2.6,.6);T.set(-7.2,3.6,-7);return clamp(vf*1.28,40,58)}
}

export {NT, Nuke};
