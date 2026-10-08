import * as THREE from 'three';
import {EffectComposer} from '../three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '../three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '../three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from '../three/examples/jsm/postprocessing/OutputPass.js';
import {ShaderPass} from '../three/examples/jsm/postprocessing/ShaderPass.js';
import {RoomEnvironment} from '../three/examples/jsm/environments/RoomEnvironment.js';
import {buildRoom} from './room.js';
import {Avatar,parseLook,lookCode} from './avatar.js';
import {TV} from './tv.js';
import {FX} from './fx.js';
import {Levels} from './audio.js';
import {Tone,MOODS} from './tone.js';
import {Nuke,NT} from './nuke.js';
import {styleDesk,rgbTick,BPEM,SIGM,SIGE,SIGP,SIGSK,buildCar} from './cosm.js';
import {Overlay,injectCSS,IC} from './ui.js';
import {SEATS,TVP,ELEV,BELLP,COLX,pathIn,pathOut} from './layout.js';
import {clamp,damp,hash,rng,now,sstep,lerp} from './util.js';
import {cv,tex} from './tex.js';
import {Drive} from './drive.js';
import {buildTrack,buildDoor,TY} from './track.js';

const GRADE={uniforms:{tDiffuse:{value:null},uT:{value:0},uV:{value:.3}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform sampler2D tDiffuse;uniform float uT,uV;varying vec2 vUv;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float l=dot(c,vec3(.2126,.7152,.0722));c=mix(c,c*vec3(1.05,1.,.95),smoothstep(.15,1.,l));c=mix(c,c*vec3(.93,.98,1.07),1.-smoothstep(0.,.22,l));vec2 d=vUv-.5;c*=1.-uV*dot(d,d)*1.7;c+=(h(vUv*1000.+uT)-.5)*.01;gl_FragColor=vec4(max(c,0.),1.);}'};
const EMO={dab:'\u{1F60E}',salute:'\u{1FAE1}',chestpound:'\u{1F4AA}',bow:'\u{1F647}',floss:'\u{1F57A}',robot:'\u{1F916}',sprinkler:'\u{1F4A6}',griddy:'\u{1F525}',airguitar:'\u{1F3B8}',disco:'\u{1FAA9}',hypejump:'\u{1F680}',moneygun:'\u{1F4B5}',micdrop:'\u{1F3A4}',belt:'\u{1F3C6}',sig:'\u{2728}',wave:'\u{1F44B}',clap:'\u{1F44F}',cheer:'\u{1F389}',dance:'\u{1F483}',fire:'\u{1F525}',money:'\u{1F4B8}',laugh:'\u{1F602}',bell:'\u{1F514}'};
const fakeTalk=(t,s)=>{const a=Math.max(0,Math.sin(t*27.0+s%7)),b=Math.max(0,Math.sin(t*18.2+s%5));return clamp((a*.7+b*.5)*.8*(.62+.38*Math.sin(t*1.1+s)),0,1)};
let SUP=null,OF=null;
/* cracked glass ring left in the window after someone goes through it */
function crackCanvas(){const c=cv(512,512),x=c.getContext('2d'),C=256,r=rng(4242);x.lineCap='round';x.lineJoin='round';
  const rim=[];for(let i=0;i<16;i++){const a=i/16*6.283+r()*.25,d=70+r()*55;rim.push([C+Math.cos(a)*d,C+Math.sin(a)*d,a,d])}
  x.strokeStyle='rgba(235,245,255,.95)';x.lineWidth=4;x.beginPath();rim.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.stroke();
  rim.forEach(p=>{let px=p[0],py=p[1],a=p[2],d=p[3];x.lineWidth=3;x.strokeStyle='rgba(220,236,255,.85)';x.beginPath();x.moveTo(px,py);
    while(d<235){d+=18+r()*26;a+=(r()-.5)*.35;px=C+Math.cos(a)*d;py=C+Math.sin(a)*d;x.lineTo(px,py)}x.stroke()});
  [150,205].forEach((R0,j)=>{for(let i=0;i<16;i++){if(r()<.35)continue;const a0=rim[i][2],a1=rim[(i+1)%16][2]+(i===15?6.283:0);x.strokeStyle='rgba(220,236,255,'+(j?.35:.55)+')';x.lineWidth=2;x.beginPath();
    for(let k=0;k<=6;k++){const a=a0+(a1-a0)*k/6,d=R0+(r()-.5)*14;k?x.lineTo(C+Math.cos(a)*d,C+Math.sin(a)*d):x.moveTo(C+Math.cos(a)*d,C+Math.sin(a)*d)}x.stroke()}});
  const g=x.createRadialGradient(C,C,60,C,C,250);g.addColorStop(0,'rgba(190,220,255,.14)');g.addColorStop(1,'rgba(190,220,255,0)');x.fillStyle=g;x.fillRect(0,0,512,512);return c}
/* crimson and white parachute gores with the agency mark */
function chuteCanvas(){const c=cv(1024,256),x=c.getContext('2d');for(let i=0;i<12;i++){x.fillStyle=i%2?'#f4f2ee':'#ff1f4f';x.fillRect(i*1024/12,0,1024/12+1,256)}
  x.fillStyle='#0f0f15';x.fillRect(0,170,1024,56);x.font='900 38px Verdana,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#ffffff';
  for(let i=0;i<4;i++)x.fillText('OWQ',(i+.5)*256,199);return c}
const RM=()=>{try{return !!(OF&&OF.api&&OF.api.reduced&&OF.api.reduced())}catch(e){return false}};
export function supported(){if(SUP!==null)return SUP;try{const c=document.createElement('canvas');const g=c.getContext('webgl2');SUP=!!g;if(g){const l=g.getExtension('WEBGL_lose_context');l&&l.loseContext()}}catch(e){SUP=false}return SUP}

class Office{
  constructor(){injectCSS();this.el=document.createElement('div');this.el.className='vo3';this.cv=document.createElement('canvas');this.cv.className='vo3c';this.cv.tabIndex=0;this.cv.setAttribute('aria-label','3D sales floor. Drag to look around, scroll to zoom, click a teammate or the TV.');this.el.appendChild(this.cv);
    this.ui=new Overlay(this.el,this);this.av=new Map();this.lv=new Levels();this.mountT=0;this.running=false;this.t=now();this.opts={auto:true,sfx:true};this.demo=false;this.tvOn=false;this.screens=[];
    this.dir={P:new THREE.Vector3(0,4.05,12.6),T:new THREE.Vector3(0,1.75,-2.4),F:34,yaw:0,pitch:0,zoom:1,manualT:0,focus:null,focusT:0,spk:null,spkT:0};
    this.init3d();this.bindInput()}
  init3d(){const r=this.r=new THREE.WebGLRenderer({canvas:this.cv,antialias:false,alpha:false,powerPreference:'high-performance',stencil:false});
    r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.NeutralToneMapping;r.toneMappingExposure=1.0;r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;
    this.prMax=Math.min(2,globalThis.devicePixelRatio||1);this.pr=Math.min(this.prMax,1.25);r.setPixelRatio(this.pr);
    const sc=this.scene=new THREE.Scene();sc.background=new THREE.Color(0x05030a);
    const pm=new THREE.PMREMGenerator(r);sc.environment=pm.fromScene(new RoomEnvironment(),.04).texture;sc.environmentIntensity=.3;pm.dispose();
    this.cam=new THREE.PerspectiveCamera(34,16/9,.1,260);this.cam.layers.enable(1);this.cam.position.copy(this.dir.P);this.cam.lookAt(this.dir.T);
    this.room=buildRoom(sc);this.tv=new TV(this.room.group);this.fx=new FX(this.room.group);try{this.track=buildTrack(this.room.group);buildDoor(this.room.group)}catch(e){this.track=null}this.drive=new Drive(this);
    this.rRT=new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType});this.rRT.texture.generateMipmaps=true;this.rRT.texture.minFilter=THREE.LinearMipmapLinearFilter;
    this.vcam=new THREE.PerspectiveCamera();this.vcam.layers.set(0);this.texMat=new THREE.Matrix4();this.reflOn=true;
    const fm=this.room.floor.material,self=this;
    fm.onBeforeCompile=sh=>{sh.uniforms.tRefl={value:self.rRT.texture};sh.uniforms.uRM={value:self.texMat};sh.uniforms.uRK={value:.5};self.reflU=sh.uniforms;
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform mat4 uRM;varying vec4 vRU;varying vec3 vRW;').replace('#include <project_vertex>','#include <project_vertex>\nvec4 rw4=modelMatrix*vec4(transformed,1.);vRU=uRM*rw4;vRW=rw4.xyz;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D tRefl;uniform float uRK;varying vec4 vRU;varying vec3 vRW;').replace('#include <opaque_fragment>',
        '{vec2 ruv=vRU.xy/vRU.w;float rg=clamp(roughnessFactor,0.,1.);float lod=1.6+rg*5.;vec3 rf=textureLod(tRefl,ruv,lod).rgb*.6+textureLod(tRefl,ruv,lod+1.7).rgb*.4;vec3 V=normalize(cameraPosition-vRW);float fr=.06+.94*pow(1.-clamp(V.y,0.,1.),5.);outgoingLight+=rf*uRK*mix(.42,1.,fr)*(1.-rg*.55);}\n#include <opaque_fragment>')};
    fm.needsUpdate=true;
    const rt=new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType,samples:4});
    this.comp=new EffectComposer(r,rt);this.comp.addPass(new RenderPass(sc,this.cam));this.bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.36,.5,1.05);this.comp.addPass(this.bloom);
    this.grade=new ShaderPass(GRADE);this.comp.addPass(this.grade);this.comp.addPass(new OutputPass());
    this.cv.addEventListener('webglcontextlost',e=>{e.preventDefault();this.stop();this.dead=1;try{this.api&&this.api.onFail&&this.api.onFail()}catch(x){}});
    const ph=this.api&&this.api.photo;if(ph)this.room.setPhoto(ph());
    this.ready=false;const go=()=>{this.ready=true};try{r.compileAsync(sc,this.cam).then(go,go)}catch(e){go()}}
  resize(){const w=this.el.clientWidth|0,h=this.el.clientHeight|0;if(w<2||h<2)return false;if(w===this.W&&h===this.H&&this._pr===this.pr)return true;
    this.W=w;this.H=h;this._pr=this.pr;this.r.setPixelRatio(this.pr);this.r.setSize(w,h,false);this.comp.setPixelRatio(this.pr);this.comp.setSize(w,h);
    this.rRT.setSize(Math.max(2,(w*this.pr*.5)|0),Math.max(2,(h*this.pr*.5)|0));this.cam.aspect=w/h;this.cam.updateProjectionMatrix();return true}
  start(){if(this.running)return;this.running=true;this.mountT=now();this.last=now();const loop=()=>{if(!this.running)return;this.raf=requestAnimationFrame(loop);try{this.frame()}catch(e){this.errs=(this.errs||0)+1;if(this.errs<4)console.warn('VO3 frame',e);if(this.errs>30){this.stop();try{this.api.onFail&&this.api.onFail()}catch(x){}}}};this.raf=requestAnimationFrame(loop)}
  stop(){this.running=false;cancelAnimationFrame(this.raf)}
  frame(){if(!this.el.isConnected){this.stop();return}const t=now(),dt=Math.min(this.fast?.5:.05,t-this.last);this.last=t;this.t=t;
    if(!this.resize())return;if(!this._ph&&this.api&&this.api.photo){this._ph=1;this.room.setPhoto(this.api.photo())}
    this.sync(t);this.levels(dt,t);this.demoTick(dt,t);this.updScreens(t);
    const W=this.world();this.av.forEach(a=>a.update(dt,t,W));if(this.drive)this.drive.tick(dt,t);if(this.track&&((this._bT=(this._bT||0)-dt)<=0)){this._bT=2;this.track.board(this.drive.boardRows())}this.plankTick(dt,t);this.yeetTick(dt,t);this.thanksTick(dt,t);this.shakeTick(dt,t);this.screwTick(dt);this.nukeTick(dt);rgbTick(t);this.bpTick(dt,t);this.tossTick(dt,t);this.desks(dt,t);this.room.update(dt,t);this.tv.update(dt,t,this.tvData());this.fx.update(dt);this.direct(dt,t);
    if(!this.ready)return;
    this.refl();this.grade.uniforms.uT.value=t%97;this.comp.render(dt);if(FCB)try{FCB()}catch(e){}this.tags();this.hud();this.gov(dt);
    if(!this.shown){this.shown=1;this.ui.loaded()}}
  // ---------- people ----------
  sync(t){let list=[];try{list=(this.api.people()||[]).slice()}catch(e){}
    if(this.demo){if(!this.bots){const rs=(this.api.roster?this.api.roster():[]).filter(Boolean);this.bots=rs.slice(0,8).map((n,i)=>({id:'bot:'+n,nm:n,bot:1,vt:9e15+i}))}
      const nm=new Set(list.map(p=>p.nm));this.bots.forEach(b=>{if(!nm.has(b.nm))list.push(b)})}else this.bots=null;
    list.sort((a,b)=>(a.vt||0)-(b.vt||0));const ids=new Set(list.map(p=>p.id));
    this.av.forEach((a,id)=>{if(!ids.has(id)&&!a.leaving)this.depart(a)});
    this.meAv=null;
    for(const p of list){let a=this.av.get(p.id);if(!a)a=this.arrive(p,t);if(!a)continue;
      a.p=p;a.muted=!!p.mu;a.hand=!!p.hd;a.camOn=!!p.cam;a.me=!!p.me;a.bot=!!p.bot;a.nm=p.nm;if(a.me)this.meAv=a;
      if(!a.bot&&!a.leaving&&(p.ava||'')!==a.lookStr&&!(a.me&&this.ui.lookOpen)){a.setLook(p.ava||'');this.warm(a.rig)}
      /* emotes: the first time someone is seen, whatever emote they already did is old news; every change after that plays
         (someone seen with no emote yet starts at 0, so their very first emote plays too) */
      if(this.drive&&!a.me&&!a.bot)this.drive.remote(a,p.dv);else if(a.me&&p.dv&&!this.drive.me){try{this.api.drive&&this.api.drive(null)}catch(e){}}
      const em=p.em&&typeof p.em==='object'?p.em:null;if(a.emN===undefined)a.emN=em?em.n:0;else if(em&&em.n!==a.emN){a.emN=em.n;if(!(a.me&&a.localEm===em.n))this.playEmote(a,String(em.k||''),em)}}
    const n=[...this.av.values()].filter(a=>!a.leaving&&!a.bot).length,b=[...this.av.values()].filter(a=>a.bot&&!a.leaving).length;
    this.ui.count(n?`${n} ON THE FLOOR`+(b?` &middot; ${b} DEMO`:''):(b?`DEMO CROWD &middot; ${b}`:'WAITING FOR THE TEAM'))}
  arrive(p,t){const used=new Set();this.av.forEach(a=>{if(!a.leaving&&a.seat)used.add(a.seat.i)});const seat=SEATS.find(s=>!used.has(s.i));if(!seat)return null;
    const a=new Avatar({id:p.id,nm:p.nm,me:p.me,bot:p.bot,look:p.ava||''});a.setSeat(seat);a.p=p;this.room.group.add(a.root);this.av.set(p.id,a);
    const d=this.room.desks[seat.i];d.occ=1;d.av=a;this.room.setPlate(d,p.nm);
    if(t-this.mountT>1.5&&!RM()){a.root.visible=false;a.mode='wait';const q=this.arrQ=Math.max(t,this.arrQ||0)+1.1,dl=(q-t-1.1)*1000;setTimeout(()=>{if(this.av.get(p.id)!==a||a.leaving)return;this.room.elevOpen(3.2);this.sfx('ding');setTimeout(()=>{if(this.av.get(p.id)===a&&!a.leaving){if(a.look&&a.look.W&&!RM()&&this.carArrive(a,seat))return;a.enter(ELEV.spawn,pathIn(seat));this.entrance(a)}},650)},dl)}else a.sitNow();
    return a}
  depart(a){a.leaving=true;const d=this.room.desks[a.seat.i],wasT=!!a.thanks||a.mode==='thanks';if(a.thanks){a.thanks=null;a.pk=0;a.dip=0}if(a.shakeA)this.shakeHome(a,1);if(a.shakeB){a.shakeB=null}if(a.plank)this.plankEnd(a);if(a.yeet)a.yeet=null;if(a.yeetA){const Y=a.yeetA;a.yeetA=null;if(Y.b&&Y.b.yeet&&(Y.b.yeet.ph==='wait')){Y.b.yeet=null}}if(a.toss)this.tossEnd(a,true);if(RM()||wasT||!a.root.visible||a.mode==='wait'||a.mode==='tossed'){this.remove(a);return}
    setTimeout(()=>{if(d.av===a){d.occ=0;d.av=null;this.room.setPlate(d,'')}},500);
    a.leave(pathOut(a.seat),()=>{this.room.elevOpen(1.6);a.root.visible=false;setTimeout(()=>this.remove(a),300)})}
  remove(a){this.room.group.remove(a.root);a.dispose();if(this.av.get(a.id)===a)this.av.delete(a.id);this.ui.dropTag(a.id);const d=this.room.desks[a.seat.i];if(d.av===a){d.occ=0;d.av=null;this.room.setPlate(d,'')}this.lv.drop(a.id);if(this.dir.spk===a)this.dir.spk=null;if(this.dir.focus===a)this.dir.focus=null}
  levels(dt,t){const api=this.api,keep=new Set(),TN=this.tones||(this.tones=new Map());
    this.av.forEach(a=>{let L=0,hf=.5,f0=0,real=false;
      if(a.bot)L=a.botL||0;
      else if(a.me){const s=api.mic&&api.mic();if(s){const n=this.lv.get('me',s,false);keep.add('me');if(n){L=n.lv;hf=n.hf;f0=n.f0;real=true}
          if(a.muted){const c=this.lv.get('mec',s,true);keep.add('mec');if(c&&c.lv>.3){this.mt=(this.mt||0)+dt;if(this.mt>.7&&t-(this.mtT||-99)>9){this.mtT=t;this.ui.toast('You are muted. Press M or tap the mic to talk.')}}else this.mt=0}}}
      else{const s=api.audio&&api.audio(a.id);if(s){const n=this.lv.get(a.id,s,false);keep.add(a.id);if(n){L=n.lv;hf=n.hf;f0=n.f0;real=true}}else if(a.p&&a.p.sp)L=fakeTalk(t,a.seed)}
      a.level(L,hf);
      // voice tone -> mood (each viewer works it out from the audio it already plays; nothing is sent or kept)
      const tk=a.me?'me':a.nm||a.id;let tn=TN.get(a.id);if(!tn||tn.k!==tk){tn=new Tone(tk);tn.k=tk;TN.set(a.id,tn)}
      if(!a.moodOn())a.mood(null);
      else if(a.bot){const on=(a.botL||0)>.02;if(on&&!a.bm){a.bm=MOODS[(a.seed+(this.bmN=(this.bmN||0)+1))%MOODS.length]}if(!on&&(a.quietT||0)>1.5)a.bm=null;a.mood(tn.drive(dt,on,a.bm))}
      else a.mood(tn.step(dt,real&&!a.muted?L:0,hf,real&&!a.muted?f0:0))});
    for(const k of [...TN.keys()])if(!this.av.has(k))TN.delete(k);this.lv.prune(keep)}
  world(){const W=this._W||(this._W={cam:new THREE.Vector3(),focusSpeaker:null,shareStart:0});W.cam.copy(this.cam.position);W.focusSpeaker=this.dir.spk;W.shareStart=this.shareStart||0;return W}
  desks(dt,t){this.room.desks.forEach(d=>{const a=d.av,L=a&&!a.leaving&&a.look?a.look:null,sk=L?[L.D,L.C,L.I,L.R,L.W].join(','):'';if(sk!==(d.styK||'')&&!(this.nk&&!this.nk.done)){d.styK=sk;try{styleDesk(d,L&&(L.D||L.C||L.I||L.R||L.W)?{D:L.D,C:L.C,I:L.I,R:L.R,W:L.W}:null,this.room.group);if(d.sty)this.warm(d.sty);if(d.chairSty)this.warm(d.chairSty)}catch(e){console.warn('VO3 desk',e)}}if(d.up)d.up(t);const c=d.led.material.color;if(!a||a.leaving){c.setRGB(.45,.04,.09);d.holo.visible=false;return}
      if(a.muted)c.setRGB(1.7,.1,.16);else if(a.L>.12)c.setRGB(.25,2.5,.85);else c.setRGB(1.5,.12,.3);
      d.holo.visible=a.mode==='seated'||a.mode==='sitting';d.sway=Math.sin(t*.6+a.seed%9)*.07;d.hT-=dt;if(d.hT<=0&&d.holo.visible){d.hT=1.5+Math.random();this.holo(d,a,t)}})}
  holo(d,a,t){const x=d.hc.getContext('2d'),W=512,H=154;x.clearRect(0,0,W,H);let st=null;try{st=this.api.agentStats?this.api.agentStats(a.nm):null}catch(e){}
    x.fillStyle='rgba(30,150,190,.13)';x.fillRect(4,4,W-8,H-8);x.strokeStyle='rgba(90,232,255,.8)';x.lineWidth=2;x.strokeRect(4,4,W-8,H-8);x.fillStyle='rgba(90,232,255,.8)';x.fillRect(4,4,60,3);x.fillRect(W-64,H-7,60,3);
    x.font='700 21px Verdana,sans-serif';x.fillStyle='#d4fbff';x.fillText(String(a.nm).toUpperCase().slice(0,19),18,34);
    x.textAlign='right';x.font='700 14px Verdana,sans-serif';x.fillStyle=a.muted?'#ff7a90':a.L>.12?'#5dffb0':'#8eeaff';x.fillText(a.muted?'● MUTED':a.L>.12?'● ON THE MIC':a.bot?'DEMO':'● ON THE FLOOR',W-18,34);x.textAlign='left';
    x.font='600 13px Verdana,sans-serif';x.fillStyle='#8eeaff';x.fillText('AP · 7 DAYS',18,64);x.fillText('APPS',214,64);x.fillText('RANK',340,64);
    x.font='800 30px Verdana,sans-serif';x.fillStyle='#ffffff';x.fillText(st?String(st.ap):'$0',18,98);x.fillText(String(st?st.apps:0),214,98);x.fillText(st&&st.rank?'#'+st.rank:'–',340,98);
    const r=rng(hash(a.nm)+((t/9)|0));for(let i=0;i<24;i++){const h=5+r()*26;x.fillStyle=`rgba(90,232,255,${.22+.55*i/24})`;x.fillRect(18+i*19.5,H-12-h,12,h)}d.ht.needsUpdate=true}
  // ---------- screens / TV ----------
  updScreens(t){let scs=[];try{scs=(this.api.screens?this.api.screens():[])||[]}catch(e){}
    if(this.demoShare)scs=scs.concat([this.demoShare]);this.screens=scs;
    // the newest share takes the TV
    {const prev=this._sids||new Set(),nw=scs.find(x=>!prev.has(x.sid));if(nw&&prev.size)this.tvSid=nw.sid;this._sids=new Set(scs.map(x=>x.sid))}
    const cur=scs.find(s=>s.sid===this.tvSid)||scs[0];
    if(cur){const el=this.srcEl(cur);if(el){this.play(el);this.tv.setSource(el,cur.sid,cur.yt?(cur.me?'You are playing a video':String(cur.nm)+' is playing a video'):cur.me?'You are sharing':String(cur.nm)+' is sharing');if(!this.tvOn){this.tvOn=true;this.shareStart=t;this.sfx('whoosh')}this.tvSid=cur.sid}}
    else{if(this.tvOn){this.tvOn=false;this.tv.setSource(null,'');if(this.thSid)this.closeTheater()}this.tvSid=null}
    if(this.thSid&&!scs.some(s=>s.sid===this.thSid))this.closeTheater()}
  // a YouTube link played on the TV: the video itself is a page-level player laid over the TV (tvRect), the TV texture is a title card under it
  ytCard(s){const c=this._ytc||(this._ytc=Object.assign(document.createElement('canvas'),{width:1280,height:720,__static:1})),k=s.sid+'|'+(s.title||'');if(c.__k===k)return c;c.__k=k;
    const x=c.getContext('2d');x.fillStyle='#050305';x.fillRect(0,0,1280,720);x.fillStyle='#ff1f4f';x.beginPath();x.roundRect?x.roundRect(560,250,160,112,28):x.rect(560,250,160,112);x.fill();
    x.fillStyle='#fff';x.beginPath();x.moveTo(622,278);x.lineTo(622,334);x.lineTo(670,306);x.closePath();x.fill();x.textAlign='center';x.font='800 34px Verdana,sans-serif';x.fillText(String(s.title||'Loading video').slice(0,46),640,430);
    x.font='700 24px Verdana,sans-serif';x.fillStyle='#ffb3c2';x.fillText((s.me?'YOU ARE PLAYING':String(s.nm||'').toUpperCase()+' IS PLAYING')+' A VIDEO',640,476);
    if(this.tv&&this.tv.src===c&&this.tv.vt)this.tv.vt.needsUpdate=true;return c}
  tvRect(sid){if(!this.running||!this.el.isConnected)return null;const cr=this.cv.getBoundingClientRect();if(cr.width<2||cr.height<2)return null;
    if(this.thSid===sid){const r=this.ui.thv.getBoundingClientRect(),pw=r.width-32,ph=r.height-16;if(pw<20||ph<20)return null;let w=pw,h=w*9/16;if(h>ph){h=ph;w=h*16/9}
      return{x:r.left+16+(pw-w)/2,y:r.top+(ph-h)/2,w,h,th:1,clip:null}}
    if(!this.tvOn||this.tvSid!==sid||!this.cam)return null;
    // the four screen corners on the wall (top-left, top-right, bottom-right, bottom-left), so the video can be drawn in perspective, flat on the wall
    const V=THREE.Vector3,x0=TVP.x-TVP.w/2,x1=TVP.x+TVP.w/2,y0=TVP.y+TVP.h/2,y1=TVP.y-TVP.h/2,sx=cr.width/(this.W||cr.width),sy=cr.height/(this.H||cr.height);
    const q=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]].map(([x,y])=>{const p=this.scr(new V(x,y,TVP.z));return[cr.left+p.x*sx,cr.top+p.y*sy,p.z]});if(q.some(p=>p[2]>1||p[2]<-1))return null;
    const xs=q.map(p=>p[0]),ys=q.map(p=>p[1]),mx=Math.min(...xs),my=Math.min(...ys);
    return{x:mx,y:my,w:Math.max(...xs)-mx,h:Math.max(...ys)-my,q:q.map(p=>[p[0],p[1]]),th:0,clip:{x:cr.left,y:cr.top,w:cr.width,h:cr.height},cover:!!(this.ui.lookOpen)}}
  srcEl(s){if(s.yt)return this.ytCard(s);if(s.demo)return this.demoCv;try{return this.api.video?this.api.video(s.sid):null}catch(e){return null}}
  play(el){if(!el||el.tagName!=='VIDEO')return;if(!el.isConnected)this.ui.hold.appendChild(el);if(el.paused&&el.play){const p=el.play();if(p&&p.catch)p.catch(()=>{})}}
  tvData(){if(this._td&&this.t-this._tdT<2)return this._td;this._tdT=this.t;let d={};try{d=this.api.tvData?this.api.tvData():{}}catch(e){}
    d.floor=[...this.av.values()].filter(a=>!a.leaving).length;this._td=d;return d}
  openTheater(sid){const scs=this.screens||[];const s=scs.find(x=>x.sid===sid)||scs[0];if(!s)return;const el=this.srcEl(s);if(!el)return;
    const prev=this.ui.thv.firstChild;if(prev&&prev!==el)this.ui.hold.appendChild(prev);this.thSid=s.sid;this.ui.thv.appendChild(el);this.play(el);
    this.ui.theater(true,s.yt?(s.me?'YOUR VIDEO':String(s.nm).toUpperCase()+'’S VIDEO'):s.me?'YOUR SCREEN':String(s.nm).toUpperCase()+'’S SCREEN',scs,s.sid);this.tvSid=s.sid}
  closeTheater(){const el=this.ui.thv.firstChild;if(el){this.ui.hold.appendChild(el);this.play(el)}this.thSid=null;this.ui.theater(false)}
  watch(sid){this.openTheater(sid)}
  // ---------- demo crowd ----------
  setDemo(on){this.demo=!!on;if(!on){this.demoShare=null;this.dm=null}}
  demoTick(dt,t){if(!this.demo){this.demoShare=null;return}const bots=[...this.av.values()].filter(a=>a.bot&&!a.leaving&&(a.mode==='seated'));
    const S=this.dm||(this.dm={talker:null,until:t+2,next:t+7,share:t+12,last:null});
    if(t>S.until){if(S.talker){S.talker=null;S.until=t+.6+Math.random()*1.6}else if(bots.length){let b=bots[Math.random()*bots.length|0];if(b===S.last&&bots.length>1)b=bots[(bots.indexOf(b)+1)%bots.length];S.talker=b;S.last=b;S.until=t+1.8+Math.random()*4.4}}
    this.av.forEach(a=>{if(a.bot)a.botL=a===S.talker?fakeTalk(t,a.seed):0});
    if(t>S.next&&bots.length){S.next=t+5+Math.random()*8;const b=bots[Math.random()*bots.length|0];const ks=['wave','laugh','clap','fire','cheer','money','dance','wave','laugh'];this.playEmote(b,ks[Math.random()*ks.length|0])}
    if(t>S.share){if(this.demoShare){this.demoShare=null;S.share=t+24}else if(bots.length){const b=bots[Math.random()*bots.length|0];this.demoShare={sid:'demo-scr',nm:b.nm,demo:1};S.share=t+22}}
    if(this.demoShare&&t-(this._dsT||0)>1/15){this._dsT=t;this.demoScreen(t)}}
  demoScreen(t){if(!this.demoCv)this.demoCv=cv(1280,720);const x=this.demoCv.getContext('2d'),W=1280,H=720;x.fillStyle='#0d0f14';x.fillRect(0,0,W,H);x.fillStyle='#151923';x.fillRect(0,0,W,64);
    x.fillStyle='#ff1f4f';x.fillRect(24,20,24,24);x.font='700 22px Verdana,sans-serif';x.fillStyle='#fff';x.fillText('OWQ CRM  ·  Pipeline review',64,41);x.textAlign='right';x.fillStyle='#8a93a6';x.font='600 16px Verdana,sans-serif';x.fillText('DEMO SCREEN',W-24,40);x.textAlign='left';
    const cols=[['LEAD','#7cc7ff',7],['QUOTED','#ffd166',5],['APPLIED','#ff9f6b',4],['CLIENT','#3ddc97',6]];
    cols.forEach((c,i)=>{const cx=24+i*262;x.fillStyle='#141822';x.fillRect(cx,88,246,420);x.fillStyle=c[1];x.fillRect(cx,88,246,4);x.font='700 15px Verdana,sans-serif';x.fillStyle='#cfd6e4';x.fillText(c[0]+'  '+c[2],cx+14,118);
      for(let k=0;k<c[2];k++){const y=134+k*52+Math.sin(t*1.5+k+i)*1.5;x.fillStyle='#1d2230';x.fillRect(cx+12,y,222,44);x.fillStyle='#fff';x.font='600 13px Verdana,sans-serif';x.fillText(['Martinez','Johnson','Lee','Patel','Garcia','Nguyen','Brown','Davis'][(k+i*3)%8]+' family',cx+24,y+19);x.fillStyle='#8a93a6';x.font='12px Verdana,sans-serif';x.fillText('$'+(900+((k*373+i*911)%3100))+' AP · IUL',cx+24,y+35)}});
    x.fillStyle='#141822';x.fillRect(1072,88,184,420);x.font='700 15px Verdana,sans-serif';x.fillStyle='#cfd6e4';x.fillText('THIS MONTH',1088,118);x.font='800 34px Verdana,sans-serif';x.fillStyle='#3ddc97';x.fillText('$48.2K',1088,166);x.font='12px Verdana,sans-serif';x.fillStyle='#8a93a6';x.fillText('issued AP',1088,186);
    for(let i=0;i<12;i++){const h=40+((i*53)%120)+Math.sin(t*2+i)*8;x.fillStyle=i===11?'#ff1f4f':'#2c3445';x.fillRect(1088+i*13,490-h,9,h)}
    x.strokeStyle='#ff1f4f';x.lineWidth=3;x.beginPath();for(let i=0;i<=60;i++){const px=24+i*20.6,py=640-Math.sin(i*.25+t*.6)*28-i*1.2;i?x.lineTo(px,py):x.moveTo(px,py)}x.stroke();x.fillStyle='#8a93a6';x.font='600 14px Verdana,sans-serif';x.fillText('Close rate trend',24,548);
    const cx2=(t*140)%W,cy2=300+Math.sin(t*1.3)*120;x.fillStyle='#fff';x.beginPath();x.moveTo(cx2,cy2);x.lineTo(cx2+14,cy2+34);x.lineTo(cx2+20,cy2+20);x.lineTo(cx2+34,cy2+16);x.closePath();x.fill()}
  // ---------- emotes ----------
  busy(a){return !!(a&&(a.drv||a.toss||a.plank||a.yeet||a.yeetA||a.thanks||a.shakeA||a.shakeB))}
  emote(k){const me=this.meAv;if((k==='plank'||k==='thanks')&&!this.plankOk(me)){this.ui.toast(me?'Sit back down at your desk first.':'Walk onto the floor first.');return}try{const n=this.api.emote?this.api.emote(k):null;if(me&&n!=null)me.localEm=n}catch(e){}if(me)this.playEmote(me,k);else if(k==='bell')this.ringBell('','')}
  playEmote(a,k,em){if(k==='nuke'){this.playNuke(a);return}if(k==='sig'){this.playSig(a);return}if(k==='thanks'){this.playThanks(a);return}if(k==='shake'){const b=em&&em.to?this.av.get(String(em.to)):null;if(b)this.playShake(a,b);return}if(k==='plank'){this.playPlank(a);return}if(k==='yeet'){const b=em&&em.to?this.av.get(String(em.to)):null;if(b)this.playYeet(a,b);return}if(k==='toss'){const b=em&&em.to?this.av.get(String(em.to)):null;if(b)this.playToss(a,b);return}if(!EMO[k])return;if(k==='bell'){this.ringBell(a?a.nm:'','');if(a)this.popAt(a,EMO.bell);return}
    a.emote(k);this.popAt(a,EMO[k]);const p=a.root.position;
    if(k==='cheer'){a.headPos(this._e||(this._e=new THREE.Vector3()));this.fx.confetti(this._e.x,this._e.y+.5,this._e.z,150,1.4)}
    if(k==='fire')this.fx.fire(p.x,.85,p.z,2.8);if(k==='money')this.fx.rain(p.x,2.3,p.z,80,.8);if(k==='dance')this.fx.sparkle(p.x,1.6,p.z,30,[.9,.5,1]);
    if(k==='moneygun'){const B=this.bpE||(this.bpE=[]);B.push({k,a,t:0,n:0})}if(k==='disco'){const B=this.bpE||(this.bpE=[]);B.push({k,a,t:0,n:0})}if(k==='micdrop')this.micDrop(a);if(k==='belt')this.beltUp(a);if(k==='hypejump')this.fx.sparkle(p.x,.2,p.z+.2,40,[1,.8,.3])}
  /* new looks / desk props stay hidden until their shaders are built in the background, so nobody sees the floor freeze */
  warm(o){if(!o||!this.r||!this.r.compileAsync)return;o.visible=false;let done=false;const show=()=>{if(done)return;done=true;o.visible=true};try{this.r.compileAsync(o,this.cam,this.scene).then(show,show)}catch(e){show()}setTimeout(show,6000)}
  /* Battle Pass: signature emote (move + emoji burst + catchphrase + sound, chosen in My look) */
  playSig(a){if(!a||!a.look)return;const L=a.look,mv=SIGM[L.X||0]||'wave',e=SIGE[L.Y||0],ph=SIGP[L.Z||0],snd=SIGSK[L.Q||0];
    if(EMO[mv])this.playEmote(a,mv);this.sfx(snd);setTimeout(()=>{this.popAt(a,e);setTimeout(()=>this.popAt(a,e),180);setTimeout(()=>this.popAt(a,ph,'t'),420)},120);
    const p=a.root.position;this.fx.sparkle(p.x,1.5,p.z,26,[1,.85,.4])}
  micDrop(a){const B=this.bpE||(this.bpE=[]);B.push({k:'mic',a,t:0})}
  beltUp(a){if(a._belt)return;const g=new THREE.Group(),gm=new THREE.MeshStandardMaterial({color:0xe3b04f,roughness:.22,metalness:1}),lm=new THREE.MeshStandardMaterial({color:0x111114,roughness:.5});
    const strap=new THREE.Mesh(new THREE.BoxGeometry(.9,.1,.02),lm);g.add(strap);const pl=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.03,24),gm);pl.rotation.x=Math.PI/2;pl.position.z=.012;g.add(pl);
    [-1,1].forEach(s=>{const sp=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.025,18),gm);sp.rotation.x=Math.PI/2;sp.position.set(s*.27,0,.012);g.add(sp)});
    const gem=new THREE.Mesh(new THREE.SphereGeometry(.035,12,8),new THREE.MeshBasicMaterial({color:new THREE.Color(2.6,.15,.3)}));gem.position.z=.03;g.add(gem);
    this.room.group.add(g);a._belt={g,t:0}}
  /* loot crate car: drives in along the front of the floor, you hop out, it drives off */
  carArrive(a,seat){const car=buildCar(a.look.W);if(!car)return false;car.position.set(13,0,4.55);car.rotation.y=Math.PI;this.room.group.add(car);this.warm(car);
    const B=this.bpE||(this.bpE=[]);B.push({k:'car',a,car,seat,t:0,ph:'in',x:13});this.sfx('vroom');
    setTimeout(()=>{if(this.av.get(a.id)===a&&!a.leaving&&a.mode==='wait'){a.enter(ELEV.spawn,pathIn(seat))}},9000);return true}
  /* elevator entrances */
  entrance(a){const E=a.look&&a.look.E;if(!E||RM())return;const B=this.bpE||(this.bpE=[]);B.push({k:'ent',E,a,t:0,n:0});
    if(E===1){this.fx.confetti(ELEV.out.x,2.9,ELEV.out.z,220,1.8);this.sfx('crowd')}else if(E===4){this.fx.rain(ELEV.out.x,2.6,ELEV.out.z+.3,120,1.1);this.sfx('chaching')}else if(E===5){this.sfx('boom');this.shk=Math.max(this.shk||0,.5);this.fx.sparkle(ELEV.out.x,1.6,ELEV.out.z,70,[.6,.85,1])}else this.sfx('whoosh')}
  bpTick(dt,t){const B=this.bpE;if(B&&B.length){for(let i=B.length-1;i>=0;i--){const e=B[i],a=e.a;e.t+=dt;if(!a||a.leaving||!a.root.visible&&e.k!=='ent'&&e.k!=='car'){if(e.car)this.room.group.remove(e.car);B.splice(i,1);continue}const p=a.root.position;
      if(e.k==='moneygun'){if(e.t>2.7){B.splice(i,1);continue}if(((e.t*7)|0)!==e.n){e.n=(e.t*7)|0;const v=this._mg||(this._mg=new THREE.Vector3());a.el[1].updateWorldMatrix(true,false);v.set(0,-.2,0).applyMatrix4(a.el[1].matrixWorld);this.fx.rain(v.x,v.y+.4,v.z+.3,6,.25)}}
      else if(e.k==='disco'){if(e.t>3.4){B.splice(i,1);continue}if(((e.t*5)|0)!==e.n){e.n=(e.t*5)|0;const c=[[1,.3,.8],[.3,.8,1],[1,.85,.3],[.4,1,.5]][e.n%4];this.fx.sparkle(p.x+(Math.random()-.5)*1.2,2.2,p.z+(Math.random()-.5)*.8,14,c)}}
      else if(e.k==='mic'){if(!e.m){const g=new THREE.Group(),bm=new THREE.MeshStandardMaterial({color:0x1a1a1e,roughness:.4,metalness:.6});g.add(new THREE.Mesh(new THREE.CylinderGeometry(.018,.012,.16,10),bm));const h=new THREE.Mesh(new THREE.SphereGeometry(.035,12,8),new THREE.MeshStandardMaterial({color:0x9a9aa0,roughness:.35,metalness:.8}));h.position.y=.1;g.add(h);this.room.group.add(g);e.m=g;e.v=null}
        const g=e.m;if(e.t<1.15){a.el[1].updateWorldMatrix(true,false);const v=this._mc||(this._mc=new THREE.Vector3());v.set(0,-.2,.04).applyMatrix4(a.el[1].matrixWorld);g.position.copy(v);g.rotation.set(.3,0,0)}
        else{if(!e.v){e.v=new THREE.Vector3((Math.random()-.5)*.4,.4,.35);this.sfx('whoosh')}e.v.y-=9.8*dt;g.position.addScaledVector(e.v,dt);g.rotation.x+=dt*7;if(g.position.y<.04){g.position.y=.04;if(!e.hit){e.hit=1;this.sfx('thud');this.sfx('boom');this.shk=Math.max(this.shk||0,.35);this.popAt(a,'\u{1F3A4}')}e.v.set(0,0,0)}
          if(e.t>4.5){this.room.group.remove(g);B.splice(i,1)}}}
      else if(e.k==='car'){const c=e.car,X0=13,X1=6.6;
        if(e.ph==='in'){const u=Math.min(1,e.t/1.9),k=1-Math.pow(1-u,3),nx=X0+(X1-X0)*k;c.userData.spin(e.x-nx);e.x=nx;c.position.x=nx;
          if(u>=1){e.ph='out';e.t=0;if(!a.leaving&&a.seat){a.root.position.set(X1-.2,0,3.75);a.root.rotation.y=Math.PI;a.sitK=0;a.standK=0;a.root.visible=true;const s=e.seat;a.walk([[COLX,3.75],[COLX,s.aisle],[s.x,s.aisle],[s.x,s.sz]],()=>{a.mode='sitting';a.turnTo=0});this.entrance(a);this.sfx('pop')}}}
        else if(e.ph==='out'){if(e.t<1.1)continue;if(!e.go){e.go=1;this.sfx('vroom')}const v=Math.min(9,(e.t-1.1)*7);const d=v*dt;c.position.x-=d;c.userData.spin(d);if(c.position.x<-14){this.room.group.remove(c);B.splice(i,1)}}}
      else if(e.k==='ent'){if(e.t>4.2||a.mode!=='walk'&&e.t>1.2){if(e.sp){this.room.group.remove(e.sp);this.room.group.remove(e.sp.target)}B.splice(i,1);continue}
        if(e.E===2){if(((e.t*14)|0)!==e.n){e.n=(e.t*14)|0;this.fx.fire(p.x,.05,p.z,.12)}}
        else if(e.E===3){if(!e.sp){e.sp=new THREE.SpotLight(0xfff2d6,90,14,.32,.4,1.2);e.sp.position.set(p.x,5.1,p.z);this.room.group.add(e.sp,e.sp.target)}e.sp.position.set(p.x,5.1,p.z+.4);e.sp.target.position.set(p.x,0,p.z);e.sp.intensity=90*Math.min(1,e.t*3)}
        else if(e.E===5&&e.t<.5){this.room.lights.key.intensity=(this._kI||(this._kI=this.room.lights.key.intensity))*(Math.random()<.5?2.2:.4)}else if(e.E===5&&e.t>=.5&&this._kI){this.room.lights.key.intensity=this._kI}}}}
    this.av.forEach(a=>{const Bt=a._belt;if(!Bt)return;Bt.t+=dt;if(Bt.t>3.1||a.leaving||!a.emo||a.emo.k!=='belt'){this.room.group.remove(Bt.g);a._belt=null;return}
      a.el[0].updateWorldMatrix(true,false);a.el[1].updateWorldMatrix(true,false);const l=this._bl||(this._bl=new THREE.Vector3()),r=this._br||(this._br=new THREE.Vector3());l.set(0,-.17,0).applyMatrix4(a.el[0].matrixWorld);r.set(0,-.17,0).applyMatrix4(a.el[1].matrixWorld);
      Bt.g.position.lerpVectors(l,r,.5);Bt.g.position.y+=.02;Bt.g.rotation.set(0,a.root.rotation.y,0)})}
  // ---------- grab a teammate and throw them across the room ----------
  yeet(id){const me=this.meAv,b=this.av.get(id),f=n=>String(n||'').split(' ')[0];
    if(!this.plankOk(me)){this.ui.toast(me?'Sit back down at your desk first.':'Walk onto the floor first.');return false}
    if(!b||b===me||b.leaving){this.ui.toast('They are not on the floor any more.');return false}
    if(!this.plankOk(b)){this.ui.toast(f(b.nm)+' is not at their desk right now.');return false}
    let n=null;try{n=this.api.emote?this.api.emote('yeet',{to:id}):null}catch(e){}if(n!=null)me.localEm=n;this.playYeet(me,b);return true}
  playYeet(a,b){if(!a||!b||a===b||a.leaving||b.leaving||!a.seat||!b.seat||this.busy(a)||this.busy(b)||a.mode==='wait'||b.mode==='wait')return;const f=n=>String(n||'').split(' ')[0];
    if(b.me)this.ui.toast(f(a.nm)+' is coming for you...');else if(a.me)this.ui.toast('Go get '+f(b.nm)+'!');
    if(RM()){this.popAt(b,'\u{1F4A5}');return}
    const sa=a.seat,sb=b.seat,path=this.route(sa,sb,[sa.x,sa.aisle]);path.push([sb.x,sb.z-.95]);
    const left=sb.x<.5;
    a.yeetA={ph:'go',b,sb,t:0};b.yeet={ph:'wait',a,t:0,L:new THREE.Vector3(left?1.6:-1.6,.32,3.55),side:left?1:-1,C:new THREE.Vector3()};
    a.speed=3.2;a.emo=null;a.idleK=null;a.mode='rising';a._leavePath=path;a._done=()=>{if(a.yeetA&&a.yeetA.ph==='go'){a.yeetA.ph='grab';a.yeetA.t=0}}}
  /* walking routes on the floor: along a row's aisle, between rows through the side corridors */
  route(from,to,start){const p=[start];if(from.row===to.row)p.push([to.x,from.aisle]);else{const cx=(from.x+to.x)/2<0?-7.6:7.6;p.push([cx,from.aisle],[cx,to.aisle],[to.x,to.aisle])}return p}
  yeetTick(dt,t){const off=this._yoff||(this._yoff=new THREE.Vector3()),H=this._yh||(this._yh=new THREE.Vector3());
    this.av.forEach(a=>{const Y=a.yeetA;if(!Y)return;Y.t+=dt;const b=Y.b,B=b&&b.yeet;
      if(Y.ph==='go'){if(!B||b.leaving)this.yeetHome(a);return}
      if(Y.ph==='grab'){a.root.rotation.y=0;if(!B||b.leaving||B.a!==a){this.yeetHome(a);return}
        if(!Y.g){Y.g=1;a.emote('lift');B.ph='lift';B.t=0;b.mode='tossed';b.emo=null;b.tossF=0;b.chuteK=0;B.C0=new THREE.Vector3(b.root.position.x,b.root.position.y+.75,b.root.position.z);this.popAt(b,'\u{1F631}')}
        if(B.ph==='hold'&&!Y.yell){Y.yell=1;this.say('Yeet!')}
        if(B.ph==='fly'){Y.ph='cheer';Y.t=0;a.emote('throw')}return}
      if(Y.ph==='cheer'){if(Y.t>1.0&&!Y.c){Y.c=1;a.emote('cheer');this.popAt(a,'\u{1F4AA}')}if(Y.t>2.6)this.yeetHome(a);return}});
    this.av.forEach(b=>{const B=b.yeet;if(!B)return;B.t+=dt;const r=b.root,C=B.C,a=B.a;
      const place=()=>{off.set(0,.9,0).applyEuler(r.rotation);r.position.copy(C).sub(off)};
      const held=a&&!a.leaving&&a.yeetA&&a.yeetA.b===b;if(held)H.set(a.root.position.x,2.6,a.root.position.z+.05);
      if(B.ph==='wait'){if(!held)b.yeet=null;return}
      if((B.ph==='lift'||B.ph==='hold')&&!held){B.ph='fly';B.t=0;B.F0=C.clone()}
      if(B.ph==='lift'){const k=sstep(0,.5,B.t);C.lerpVectors(B.C0,H,k);r.rotation.set(0,0,k*Math.PI/2*B.side);b.tossF=k;place();if(B.t>=.5){B.ph='hold';B.t=0}return}
      if(B.ph==='hold'){C.copy(H);C.y+=Math.abs(Math.sin(B.t*9))*.06;r.rotation.set(0,0,Math.PI/2*B.side+Math.sin(B.t*13)*.07);b.tossF=1;place();if(B.t>=.9){B.ph='fly';B.t=0;B.F0=C.clone();this.sfx('whee');this.shk=.25}return}
      if(B.ph==='fly'){const D=1.2,u=Math.min(1,B.t/D);C.x=lerp(B.F0.x,B.L.x,u);C.z=lerp(B.F0.z,B.L.z,u);C.y=lerp(B.F0.y,B.L.y,u)+4*1.55*u*(1-u);
        r.rotation.set(-2.5*Math.PI*u,0,B.side*Math.PI/2*(1-u));b.tossF=1;place();
        if(u>=1){B.ph='land';B.t=0;this.sfx('thud');this.shk=.9;this.fx.sparkle(B.L.x,.25,B.L.z,40,[.85,.78,.7]);this.popAt(b,'\u{1F4A5}');const dx=B.L.x-B.F0.x,dz=B.L.z-B.F0.z,dd=Math.hypot(dx,dz)||1;B.dx=dx/dd;B.dz=dz/dd}return}
      if(B.ph==='land'){const k=Math.exp(-3.2*B.t),bo=Math.abs(Math.sin(B.t*Math.PI*3.2))*.42*k,sl=.45*(1-Math.exp(-4*B.t));C.x=B.L.x+B.dx*sl;C.z=Math.min(3.85,B.L.z+B.dz*sl);C.y=B.L.y+bo;r.rotation.set(-Math.PI/2,0,Math.sin(B.t*14)*.12*k);b.tossF=.35*k;place();
        if(B.t>=.8){B.ph='lie';B.t=0;this.popAt(b,'\u{1F635}')}return}
      if(B.ph==='lie'){C.y=B.L.y;r.rotation.set(-Math.PI/2,0,0);b.tossF=.12;place();if(((B.t*4)|0)!==B.st){B.st=(B.t*4)|0;const h=b.headPos(this._yd||(this._yd=new THREE.Vector3()));this.fx.sparkle(h.x,h.y+.25,h.z,5,[1,.9,.35])}
        if(B.t>=1.3){B.ph='up';B.t=0}return}
      if(B.ph==='up'){const k=sstep(0,.6,B.t);r.rotation.set(-Math.PI/2*(1-k),0,0);C.y=lerp(B.L.y,.9,k);b.tossF=.12*(1-k);place();
        if(B.t>=.6){r.rotation.set(0,0,0);r.position.y=0;b.yeet=null;b.tossF=0;b.sitK=0;b.dizzy=10;b.emote('dizzy');const sb=b.seat,cx=sb.x<0?-7.6:7.6;
          b.speed=2.3;b.walk([[cx,r.position.z],[cx,sb.aisle],[sb.x,sb.aisle],[sb.x,sb.sz]],()=>{b.mode='sitting';b.turnTo=0;b.speed=2.1})}return}})}
  yeetHome(a){const Y=a.yeetA;if(!Y||Y.ph==='back')return;Y.ph='back';const sa=a.seat,sb=Y.sb||sa;a.speed=2.6;
    const p=[[sb.x,sb.aisle]];if(sb.row===sa.row)p.push([sa.x,sa.aisle]);else{const cx=(sa.x+sb.x)/2<0?-7.6:7.6;p.push([cx,sb.aisle],[cx,sa.aisle],[sa.x,sa.aisle])}p.push([sa.x,sa.sz]);
    a.walk(p,()=>{a.mode='sitting';a.turnTo=0;a.speed=2.1;a.yeetA=null})}
  // ---------- the "thank you" trend: walk out to the gold inlay, drop into a wide plank, hip dips with a THANK YOU on every rep ----------
  /* from a seat to the stage in front of the desks: back along the row's aisle, then forward through the gaps between desks */
  stagePath(s,X,Z){const G={b:[-4.725,-1.575,1.575,4.725],m:[-3.15,0,3.15],f:[-1.575,1.575]},A={b:-5.6,m:-2.65,f:.25},N={b:-2.65,m:.25,f:Z},R=['b','m','f'];
    const p=[[s.x,s.aisle]];let x=s.x;for(let i=Math.max(0,R.indexOf(s.row));i<3;i++){const r=R[i];let g=G[r][0],bd=1e9;G[r].forEach(v=>{const c=Math.abs(v-x)+.6*Math.abs(v-X);if(c<bd){bd=c;g=v}});p.push([g,A[r]],[g,N[r]]);x=g}
    p.push([X,Z]);return p}
  playThanks(a){if(!a||this.busy(a)||a.leaving||a.mode==='wait'||!a.seat)return;this.popAt(a,'\u{1F64F}');if(RM())return;
    const s=a.seat,X=clamp(s.x*.3,-1.4,1.4),Z=3.35,path=this.stagePath(s,X,Z);
    a.thanks={ph:'go',t:0,X,Z,n:0,N:8,k:-1,path};a.speed=3.4;a.emo=null;a.idleK=null;a.mode='rising';a._leavePath=path;
    a._done=()=>{const H=a.thanks;if(H&&H.ph==='go'){H.ph='down';H.t=0;a.mode='thanks';a.root.position.set(H.X,0,H.Z)}}}
  thanksTick(dt,t){this.av.forEach(a=>{const H=a.thanks;if(!H)return;H.t+=dt;const r=a.root;if(H.ph==='go'||H.ph==='back')return;
    let dy=-r.rotation.y;dy=Math.atan2(Math.sin(dy),Math.cos(dy));r.rotation.y+=dy*Math.min(1,dt*10);
    if(H.ph==='down'){a.pk=sstep(0,.75,H.t);a.dip=0;a.thx=0;if(H.t>=.8){H.ph='reps';H.t=0}return}
    if(H.ph==='reps'){const T=.66,i=Math.floor(H.t/T),u=(H.t-i*T)/T;
      if(i>=H.N){a.dip=0;a.thx=0;H.ph='up';H.t=0;this.popAt(a,H.N+' THANK YOUS \u{1F64F}','t');return}
      a.pk=1;a.dip=u<.42?sstep(0,.42,u):1-sstep(.48,1,u);a.thx=Math.exp(-Math.pow((u-.46)/.13,2));
      if(i!==H.k&&u>=.4){H.k=i;H.n=i+1;this.popAt(a,'THANK YOU','t');this.thanksSay()}return}
    if(H.ph==='up'){a.pk=1-sstep(0,.6,H.t);a.dip=0;a.thx=0;if(H.t>=.65){a.pk=0;H.ph='back';const s=a.seat,p=H.path.slice().reverse();p.push([s.x,s.sz]);a.speed=3.0;
        a.walk(p,()=>{a.mode='sitting';a.turnTo=0;a.speed=2.1;a.thanks=null})}return}})}
  thanksSay(){if(!this.opts.sfx||RM())return;try{const S=globalThis.speechSynthesis;if(!S||typeof SpeechSynthesisUtterance==='undefined'||S.speaking||S.pending)return;const u=new SpeechSynthesisUtterance('thank you');u.rate=1.25;u.pitch=.5;u.volume=.9;S.speak(u)}catch(e){}}
  // ---------- owner only: nuke the floor (see nuke.js) ----------
  playNuke(a){if(this.nk&&!this.nk.done)return;const f=n=>String(n||'').split(' ')[0];
    if(RM()){if(a)this.popAt(a,'\u2622\uFE0F');this.ui.toast(a&&a.me?'Nuke launched.':(f(a&&a.nm)||'Someone')+' nuked the floor.');return}
    this.nk=new Nuke(this,a);if(a&&a.mode==='seated'&&!this.busy(a))a.emote('detonate');
    this.ui.toast(a&&a.me?'Launch codes accepted.':(f(a&&a.nm)||'Someone')+' has the launch codes...')}
  nukeTick(dt){const N=this.nk;if(!N)return;try{N.update(dt)}catch(e){console.warn('VO3 nuke',e);try{N.finish()}catch(x){}}if(N.done)this.nk=null}
  // ---------- owner only: walk over, pick a teammate up and shake them until a screw falls out (clink, clink, clink) ----------
  shake(id){const me=this.meAv,b=this.av.get(id),f=n=>String(n||'').split(' ')[0];
    if(!this.plankOk(me)){this.ui.toast(me?'Sit back down at your desk first.':'Walk onto the floor first.');return false}
    if(!b||b===me||b.leaving){this.ui.toast('They are not on the floor any more.');return false}
    if(!this.plankOk(b)){this.ui.toast(f(b.nm)+' is not at their desk right now.');return false}
    let n=null;try{n=this.api.emote?this.api.emote('shake',{to:id}):null}catch(e){}if(n!=null)me.localEm=n;this.playShake(me,b);return true}
  playShake(a,b){if(!a||!b||a===b||a.leaving||b.leaving||!a.seat||!b.seat||this.busy(a)||this.busy(b)||a.mode==='wait'||b.mode==='wait')return;const f=n=>String(n||'').split(' ')[0];
    if(b.me)this.ui.toast(f(a.nm)+' is checking you for loose screws...');else if(a.me)this.ui.toast('Go shake '+f(b.nm)+'!');
    if(RM()){this.popAt(b,'\u{1F529}');return}
    const sa=a.seat,sb=b.seat,path=this.route(sa,sb,[sa.x,sa.aisle]);path.push([sb.x,sb.z-.95]);
    a.shakeA={ph:'go',b,sb,t:0};b.shakeB={a,C:new THREE.Vector3()};
    a.speed=3.2;a.emo=null;a.idleK=null;a.mode='rising';a._leavePath=path;a._done=()=>{if(a.shakeA&&a.shakeA.ph==='go'){a.shakeA.ph='grab';a.shakeA.t=0}}}
  shakeTick(dt,t){const off=this._skO||(this._skO=new THREE.Vector3()),H=this._skH||(this._skH=new THREE.Vector3()),S=this._skS||(this._skS=new THREE.Vector3());
    this.av.forEach(a=>{const Y=a.shakeA;if(!Y)return;Y.t+=dt;const b=Y.b,B=b&&b.shakeB;
      if(Y.ph==='go'){if(!B||b.leaving)this.shakeHome(a);return}
      if(Y.ph==='back')return;
      if(!B||b.leaving||B.a!==a){this.shakeHome(a);return}
      a.root.rotation.y=0;const r=b.root,C=B.C;H.set(a.root.position.x,2.55,a.root.position.z+.05);
      const place=()=>{off.set(0,.9,0).applyEuler(r.rotation);r.position.copy(C).sub(off)};
      if(Y.ph==='grab'){if(!Y.g){Y.g=1;a.emote('lift');b.mode='tossed';b.emo=null;b.tossF=0;b.chuteK=0;B.C0=new THREE.Vector3(r.position.x,r.position.y+.9,r.position.z);B.side=b.seat.x<.5?1:-1;this.popAt(b,'\u{1F633}')}
        const k=sstep(0,.5,Y.t);C.lerpVectors(B.C0,H,k);r.rotation.set(0,0,k*Math.PI/2*B.side);b.tossF=k;place();if(Y.t>=.5){Y.ph='shake';Y.t=0;a.emote('shake');this.say('Hold still!')}return}
      if(Y.ph==='shake'){C.copy(H);C.x+=Math.sin(Y.t*31)*.14;C.y+=Math.abs(Math.sin(Y.t*24))*.1;r.rotation.set(Math.sin(Y.t*17)*.18,0,Math.PI/2*B.side+Math.sin(Y.t*29)*.32);b.tossF=1;place();
        if(((Y.t*9)|0)!==Y.rt){Y.rt=(Y.t*9)|0;this.sfx('rattle')}
        if(Y.t>=1.25&&!Y.out){Y.out=1;const q=this._skP||(this._skP=new THREE.Vector3()),th=b.th[0];th.updateWorldMatrix(true,false);q.set(.07,-.1,.07).applyMatrix4(th.matrixWorld);this.screw(q);this.sfx('pop');this.popAt(b,'\u{1F529}')}
        if(Y.t>=1.75){Y.ph='hold';Y.t=0;a.emo=null}return}
      if(Y.ph==='hold'){C.copy(H);r.rotation.set(0,0,Math.PI/2*B.side);b.tossF=.4;place();if(Y.t>=1.1){Y.ph='put';Y.t=0;B.C1=C.clone()}return}
      if(Y.ph==='put'){const k=sstep(0,.6,Y.t);S.set(b.seat.x,.75,b.seat.sz);C.lerpVectors(B.C1,S,k);r.rotation.set(0,0,Math.PI/2*B.side*(1-k));b.tossF=.4*(1-k);place();
        if(Y.t>=.62){this.shakeHome(a)}return}})}
  /* back to the desk; whoever was being shaken is put back in their chair first (never left floating) */
  shakeHome(a,gone){const Y=a.shakeA;if(!Y||Y.ph==='back')return;const b=Y.b;
    if(b&&b.shakeB&&b.shakeB.a===a){b.shakeB=null;if(Y.g&&!b.leaving&&b.seat){const r=b.root;r.rotation.set(0,0,0);r.position.set(b.seat.x,0,b.seat.sz);b.mode='seated';b.sitK=1;b.tossF=0;if(!gone){b.emote('dizzy');this.popAt(b,'\u{1F635}\u200D\u{1F4AB}')}}}
    if(gone){a.shakeA=null;return}
    Y.ph='back';const sa=a.seat,sb=Y.sb||sa;a.speed=2.6;
    const p=[[sb.x,sb.aisle]];if(sb.row===sa.row)p.push([sa.x,sa.aisle]);else{const cx=(sa.x+sb.x)/2<0?-7.6:7.6;p.push([cx,sb.aisle],[cx,sa.aisle],[sa.x,sa.aisle])}p.push([sa.x,sa.sz]);
    a.walk(p,()=>{a.mode='sitting';a.turnTo=0;a.speed=2.1;a.shakeA=null})}
  /* the screw: shaken out of the shorts pocket, it flies over the desk, bounces on the floor with a metal clink, lies there, then fades */
  screw(h){const M=this._scM||(this._scM={m:new THREE.MeshStandardMaterial({color:0xe6eaf2,metalness:.9,roughness:.24,emissive:0x2a2e38}),d:new THREE.MeshStandardMaterial({color:0x2a2d34,metalness:.6,roughness:.5})});
    const G=this._scG||(this._scG={shaft:new THREE.CylinderGeometry(.024,.024,.18,14),tip:new THREE.ConeGeometry(.024,.06,14),head:new THREE.CylinderGeometry(.066,.058,.032,24),slot:new THREE.BoxGeometry(.094,.012,.018),ring:new THREE.TorusGeometry(.026,.007,6,16)});
    const g=new THREE.Group(),add=(geo,m,y,rx)=>{const o=new THREE.Mesh(geo,m);o.position.y=y;if(rx)o.rotation.x=rx;o.castShadow=true;g.add(o);return o};
    add(G.shaft,M.m,0);add(G.tip,M.m,-.12,Math.PI);add(G.head,M.m,.106);add(G.slot,M.d,.123);for(let i=0;i<6;i++)add(G.ring,M.m,-.075+i*.028,Math.PI/2+.25);
    g.scale.setScalar(1.5);g.position.copy(h);this.room.group.add(g);
    (this.screws||(this.screws=[])).push({g,v:new THREE.Vector3((Math.random()-.5)*.4,.75,1.95),w:new THREE.Vector3(9,4,13),t:0,nb:0,rest:0})}
  screwTick(dt){const L=this.screws;if(!L||!L.length)return;for(let i=L.length-1;i>=0;i--){const s=L[i],g=s.g;s.t+=dt;
      if(!s.rest){s.v.y-=9.8*dt;g.position.addScaledVector(s.v,dt);g.rotation.x+=s.w.x*dt;g.rotation.y+=s.w.y*dt;g.rotation.z+=s.w.z*dt;
        if(g.position.y<.08&&s.v.y<0){g.position.y=.08;s.nb++;const sp=-s.v.y;this.sfx('clink',Math.min(1,sp/4.5));if(s.nb===1){this.shk=Math.max(this.shk||0,.2);this.fx.sparkle(g.position.x,.12,g.position.z,14,[.9,.92,1])}
          if(sp<1||s.nb>=4){s.rest=1;g.rotation.set(Math.PI/2,g.rotation.y,0);g.position.y=.08}else{s.v.y=sp*.45;s.v.x*=.6;s.v.z*=.35;s.w.multiplyScalar(.6)}}}
      else if(s.t>8){const k=Math.max(0,1-(s.t-8)/.6);g.scale.setScalar(1.5*k);if(k<=0){this.room.group.remove(g);L.splice(i,1)}}}}
  // ---------- walk the plank: a pirate exit through the back window (parachute included, back in through the elevator) ----------
  plankOk(a){return !!a&&a.mode==='seated'&&!this.busy(a)&&!a.leaving&&a.root.visible}
  playPlank(a){if(!a||this.busy(a)||a.leaving||a.mode==='wait'||!a.seat)return;this.popAt(a,'\u{1F3F4}\u200D\u2620\uFE0F');if(RM())return;
    const s=a.seat,side=s.x<=.5?-1:1,ix=side<0?clamp(-7.165+(s.x+7.165)*.3,-8.55,-5.75):clamp(5.2+(s.x-5.2)*.3,4.1,5.6);
    const path=[[s.x,s.aisle]];if(s.row!=='b')path.push([side*7.6,s.aisle],[side*7.6,-5.6]);path.push([ix,-5.6],[ix,-6.1]);
    a.plank={ph:'go',ix,side,t:0};a.speed=3.0;a.emo=null;a.idleK=null;this.hat(a,true);
    a.mode='rising';a._leavePath=path;a._done=()=>{if(a.plank&&a.plank.ph==='go'){a.plank.ph='board';a.plank.t=0}}}
  plankMesh(ix){const g=new THREE.Group(),L=3.2,m=new THREE.Mesh(new THREE.BoxGeometry(.38,.05,L),this.room.mats.walnut2);m.position.set(0,-.025,-L/2);m.castShadow=true;m.receiveShadow=true;g.add(m);
    const cl=new THREE.Mesh(new THREE.BoxGeometry(.42,.03,.06),this.room.mats.black);cl.position.set(0,-.055,-.25);g.add(cl);g.position.set(ix,.55,-5.95);g.scale.z=.05;this.room.group.add(g);return g}
  plankSag(K,z){const d=Math.max(0,-5.95-z),k=K.flex||0;if(K.m)K.m.rotation.x=-k;return -Math.sin(k)*d}
  plankTick(dt,t){this.av.forEach(a=>{const K=a.plank;if(!K)return;K.t+=dt;const r=a.root;
    if(K.ph==='go')return;
    if(K.ph==='board'){if(!K.m){K.m=this.plankMesh(K.ix);this.sfx('whoosh')}const u=Math.min(1,K.t/.55),e=1-Math.pow(1-u,3);K.m.scale.z=Math.max(.05,e);r.rotation.y=Math.PI;
      if(!K.hit&&e>.36){K.hit=1;this.smash(new THREE.Vector3(K.ix,.75,-7.0),.5)}if(u>=1){K.ph='climb';K.t=0;K.z0=r.position.z}return}
    if(K.ph==='climb'){const u=Math.min(1,K.t/.45);r.position.y=Math.sin(u*Math.PI/2)*.55+Math.sin(u*Math.PI)*.14;r.position.z=K.z0-.35*u;r.rotation.y=Math.PI;
      if(u>=1){K.ph='walk';K.t=0;r.position.y=.55;a.speed=.85;a.walk([[K.ix,-8.7]],()=>{if(a.plank===K){K.ph='bounce';K.t=0;a.mode='gone'}});this.popAt(a,'\u{1F99C}');this.say('Arrr!')}return}
    if(K.ph==='walk'){K.flex=.07*clamp((-6.45-r.position.z)/2.25,0,1);r.position.y=.55+this.plankSag(K,r.position.z);return}
    if(K.ph==='bounce'){const b=Math.abs(Math.sin(K.t*Math.PI*2.2));K.flex=.07+.06*b;r.position.y=.55+(K.t<1?b*.24:0)+this.plankSag(K,r.position.z);r.rotation.y=Math.PI;
      if(K.t>1.05){K.ph='jump';K.drop=t;K.flex=.03;a.speed=2.1;const c=r.position.clone();c.y+=.9;
        a.toss={t0:now()-9,C0:c.clone(),CL:c.clone(),CI:c.clone(),C:new THREE.Vector3(),spin:K.side,side:K.side,hit:1,go:1,t1:t,v:new THREE.Vector3(K.side*.35,2.7,-2.5)};
        a.mode='tossed';a.emo=null;a.tossF=1;a.chuteK=0;this.sfx('whee')}return}
    if(K.ph==='jump'&&K.m){this.plankSag(K,-5.95);const f=clamp((t-K.drop-1.2)/1.4,0,1);if(f>0){K.m.scale.z=Math.max(.02,1-f);if(f>=1){this.plankEnd(a,true)}}}})}
  plankEnd(a,keep){const K=a.plank;if(!K)return;if(K.m){this.room.group.remove(K.m);K.m=null}if(keep&&a.toss)return;a.plank=null;if(a._hat&&!a.toss)this.hat(a,false)}
  hat(a,on){if(!on){if(a._hat){try{a._hat.parent&&a._hat.parent.remove(a._hat)}catch(e){}a._hat=null}return}if(a._hat||!a.head)return;
    const M=this._hatM||(this._hatM={blk:new THREE.MeshStandardMaterial({color:0x121216,roughness:.62}),gold:new THREE.MeshStandardMaterial({color:0xe6b65b,roughness:.3,metalness:1}),wht:new THREE.MeshBasicMaterial({color:0xf2f2f2})});
    const G=this._hatG||(this._hatG={brim:new THREE.CylinderGeometry(.37,.37,.03,30),crown:new THREE.CylinderGeometry(.18,.245,.2,26),band:new THREE.TorusGeometry(.238,.014,6,26),sk:new THREE.CircleGeometry(.055,18),bone:new THREE.BoxGeometry(.13,.018,.005)});
    const g=new THREE.Group(),brim=new THREE.Mesh(G.brim,M.blk);brim.scale.set(1,1,.82);g.add(brim);const cr=new THREE.Mesh(G.crown,M.blk);cr.position.y=.11;g.add(cr);
    const bd=new THREE.Mesh(G.band,M.gold);bd.rotation.x=Math.PI/2;bd.position.y=.03;g.add(bd);
    const sk=new THREE.Mesh(G.sk,M.wht);sk.position.set(0,.13,.205);sk.rotation.x=-.17;g.add(sk);[.6,-.6].forEach(z=>{const b=new THREE.Mesh(G.bone,M.wht);b.position.set(0,.065,.214);b.rotation.set(-.17,0,z);g.add(b)});
    g.position.set(0,.215,-.01);g.rotation.x=-.12;a.head.add(g);a._hat=g}
  say(txt){if(!this.opts.sfx||RM())return;try{const S=globalThis.speechSynthesis;if(!S||typeof SpeechSynthesisUtterance==='undefined')return;const u=new SpeechSynthesisUtterance(txt);u.rate=.82;u.pitch=.45;u.volume=.9;S.speak(u)}catch(e){}}
  // ---------- toss someone out the window ----------
  targets(){const out=[];this.av.forEach(a=>{if(a.me||a.leaving||a.mode==='wait')return;out.push({id:a.id,nm:a.nm,bot:!!a.bot,ok:a.mode==='seated'&&!this.busy(a)&&a.root.visible})});return out}
  toss(id){const me=this.meAv,b=this.av.get(id),f=n=>String(n||'').split(' ')[0];
    if(!me){this.ui.toast('Walk onto the floor first.');return false}
    if(!b||b===me||b.leaving){this.ui.toast('They are not on the floor any more.');return false}
    if(this.busy(b)||b.mode!=='seated'||!b.root.visible){this.ui.toast(f(b.nm)+' is not at their desk right now.');return false}
    let n=null;try{n=this.api.emote?this.api.emote('toss',{to:id}):null}catch(e){}if(n!=null)me.localEm=n;
    this.playToss(me,b);return true}
  playToss(a,b){if(!b||this.busy(b)||b.leaving||b===a||b.mode==='wait')return;const f=n=>String(n||'').split(' ')[0];
    if(b.me)this.ui.toast((a?f(a.nm):'Someone')+' tossed you out the window!');else if(a&&a.me)this.ui.toast('You tossed '+f(b.nm)+' out the window!');
    if(a&&!a.toss)a.emote('throw');
    if(RM()){this.popAt(b,'\u{1FA82}');return}
    const p=b.root.position,left=b.seat?b.seat.x<=.5:p.x<=0;
    const ix=left?clamp(-7.165+(p.x+7.165)*.3,-8.55,-5.75):clamp(5.2+(p.x-5.2)*.3,4.1,5.6);
    b.toss={t0:now(),C0:new THREE.Vector3(p.x,p.y+.75,p.z),CL:new THREE.Vector3(p.x,2.2,p.z+.15),CI:new THREE.Vector3(ix,1.95,-7.0),C:new THREE.Vector3(),spin:Math.random()<.5?-1:1,side:left?-1:1};
    b.mode='tossed';b.emo=null;b.tossF=0;b.chuteK=0;this.popAt(b,'\u{1F631}')}
  tossTick(dt,t){const off=this._toff||(this._toff=new THREE.Vector3());
    this.av.forEach(b=>{const T=b.toss;if(!T)return;const r=b.root,C=T.C,tau=t-T.t0,LIFT=.5,FLY=.85,FALL=.4;
      const place=()=>{off.set(0,.9,0).applyEuler(r.rotation);r.position.copy(C).sub(off)};
      if(tau<LIFT){const k=sstep(0,LIFT,tau);C.lerpVectors(T.C0,T.CL,k);C.y+=Math.sin(tau*34)*.025*k;r.rotation.y+=dt*2.4*T.spin;b.tossF=k;place();return}
      if(tau<LIFT+FLY){if(!T.go){T.go=1;this.sfx('whee')}const u=(tau-LIFT)/FLY;C.lerpVectors(T.CL,T.CI,u);C.y+=Math.sin(u*Math.PI)*1.0;r.rotation.x+=dt*7.5*T.spin;r.rotation.z+=dt*2.2;b.tossF=1;place();return}
      if(!T.hit){T.hit=1;this.smash(T.CI);T.v=new THREE.Vector3(T.side*1.2,1.0,-5.4);T.t1=t}
      const s=t-T.t1;
      if(s<FALL){C.set(T.CI.x+T.v.x*s,T.CI.y+T.v.y*s-4.9*s*s,T.CI.z+T.v.z*s);r.rotation.x+=dt*6*T.spin;r.rotation.z+=dt*1.8;place();return}
      if(!T.chute){T.chute=this.chute();this.sfx('pop');T.cp=C.clone();T.t2=t;T.rx=Math.atan2(Math.sin(r.rotation.x),Math.cos(r.rotation.x));T.rz=Math.atan2(Math.sin(r.rotation.z),Math.cos(r.rotation.z))}
      const q=t-T.t2,k=sstep(0,.55,q);b.chuteK=k;
      r.rotation.x=T.rx*(1-k)+Math.sin(q*1.9)*.06*k;r.rotation.z=T.rz*(1-k)+Math.sin(q*1.4+1)*.1*k;r.rotation.y+=dt*.25*T.spin;
      C.set(T.cp.x+T.side*q*.45+Math.sin(q*.9)*.35,T.cp.y-q*.5-sstep(0,.5,q)*.25,T.cp.z-q*2.3);place();
      const c=T.chute,pop=Math.min(1,q/.32),el=pop<1?1-Math.pow(1-pop,3)*Math.cos(pop*7.5):1;c.scale.setScalar(Math.max(.05,el));c.position.set(C.x,C.y+.55,C.z);c.rotation.set(Math.sin(q*1.9)*.06,r.rotation.y,Math.sin(q*1.4+1)*.1);
      if(q>5.4)this.tossEnd(b)});
    if(this.cracks)this.cracks=this.cracks.filter(c=>{c.t+=dt;c.m.material.opacity=1-sstep(c.life-1.6,c.life,c.t);if(c.t<c.life)return true;this.room.group.remove(c.m);c.m.geometry.dispose();c.m.material.dispose();return false});
    this.av.forEach(b=>{if(!b.dizzy)return;b.dizzy-=dt;if(b.mode==='seated'||b.dizzy<=0){b.dizzy=0;b.emote('dizzy');this.popAt(b,'\u{1F635}');const h=b.headPos(this._dz||(this._dz=new THREE.Vector3()));this.fx.sparkle(h.x,h.y+.35,h.z,26,[1,.9,.35]);return}
      if(((t*4)|0)!==b._dzT){b._dzT=(t*4)|0;const h=b.headPos(this._dz||(this._dz=new THREE.Vector3()));this.fx.sparkle(h.x,h.y+.4,h.z,4,[1,.9,.35])}})}
  tossEnd(b,gone){const T=b.toss;if(!T)return;if(b._hat)this.hat(b,false);if(b.plank&&!b.plank.m)b.plank=null;if(T.chute){this.room.group.remove(T.chute);T.chute.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
    b.toss=null;b.tossF=0;b.chuteK=0;b.root.rotation.set(0,0,0);b.root.visible=false;if(gone)return;
    b.mode='wait';const s=b.seat;
    setTimeout(()=>{if(this.av.get(b.id)!==b||b.leaving)return;this.room.elevOpen(3.2);this.sfx('ding');
      setTimeout(()=>{if(this.av.get(b.id)!==b||b.leaving)return;b.enter(ELEV.spawn,pathIn(s));b.dizzy=14;b.emote('dizzy');this.popAt(b,'\u{1F635}\u200D\u{1F4AB}')},650)},500)}
  smash(I,sz){this.fx.shatter(I.x,I.y,I.z+.03,sz?Math.round(150*sz):150);this.fx.sparkle(I.x,I.y,I.z+.12,46,[.75,.9,1]);this.sfx('smash');this.shk=1;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(2.2*(sz||1),2.2*(sz||1)),new THREE.MeshBasicMaterial({map:this.crackT||(this.crackT=tex(crackCanvas(),{mips:true})),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:new THREE.Color(1.5,1.6,1.8),toneMapped:false}));
    m.position.set(I.x,I.y,-6.985);m.renderOrder=6;this.room.group.add(m);(this.cracks||(this.cracks=[])).push({m,t:0,life:10})}
  chute(){const g=new THREE.Group(),th=Math.PI*.4,R=1.2,sy=.6;
    const can=new THREE.Mesh(new THREE.SphereGeometry(1,28,10,0,Math.PI*2,0,th),new THREE.MeshStandardMaterial({map:this.chuteT||(this.chuteT=tex(chuteCanvas(),{mips:true})),side:THREE.DoubleSide,roughness:.6,emissive:0x220008}));
    can.scale.set(R,sy,R);can.position.y=1.0;can.castShadow=false;g.add(can);
    const rim=Math.sin(th)*R,ry=1.0+Math.cos(th)*sy,pts=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*rim,ry,Math.sin(a)*rim),new THREE.Vector3(Math.cos(a)*.16,0,Math.sin(a)*.1))}
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xe8e8e8,transparent:true,opacity:.75})));
    g.scale.setScalar(.05);this.room.group.add(g);return g}
  ringBell(name,amt){if(this.t-(this._bellT||-99)<1.2)return;this._bellT=this.t;this.room.ring(1);this.sfx('bell');this.tv.bell(name,amt);
    if(!RM()){this.fx.confetti(0,3.6,-2.2,260,3.2);this.fx.confetti(-4.5,3.4,-1,130,2.4);this.fx.confetti(4.5,3.4,-1,130,2.4);this.fx.sparkle(BELLP.hx,BELLP.hy-.15,BELLP.z,70)}
    let i=0;this.av.forEach(x=>{const j=i++;setTimeout(()=>{if(this.av.get(x.id)===x&&!x.leaving)x.emote('bell')},120+j*80)})}
  popAt(a,e,c){if(a._vis)this.ui.pop(a._sx,a._sy-34,e,c)}
  bell(name,amt){this.ringBell(name,amt)}
  // ---------- camera director ----------
  direct(dt,t){const D=this.dir,asp=this.W/this.H;let best=null,bs=0,sec=0;
    this.av.forEach(a=>{a.score=clamp((a.score||0)+(a.L>.1?dt:-dt*1.6),0,6);if(a.score>bs){sec=bs;bs=a.score;best=a}else if(a.score>sec)sec=a.score});
    if(best&&bs>1&&bs>sec*1.6+.2){if(D.spk!==best&&(!D.spk||t-D.spkT>2.5||bs>(D.spk.score||0)+1)){D.spk=best;D.spkT=t}}else if(D.spk&&(D.spk.score||0)<.12)D.spk=null;
    if(D.spk&&(D.spk.leaving||!this.av.has(D.spk.id)))D.spk=null;
    const vf=clamp(2*Math.atan(Math.tan(17*Math.PI/180)*1.78/asp)*180/Math.PI,30,62);const P=this._P||(this._P=new THREE.Vector3()),T=this._T||(this._T=new THREE.Vector3());let F=vf;
    let occ=0,front=0;this.av.forEach(a=>{if(!a.leaving){occ++;if(a.seat&&a.seat.row==='f')front=1}});const kw=front?1:clamp((occ-4)/5,0,1);
    P.set(0,3.55+.5*kw,9.4+3.2*kw);T.set(0,1.6+.15*kw,-2.9+.5*kw);const manual=t<D.manualT;
    let foc=null;if(this.ui.lookOpen&&this.meAv)foc=this.meAv;else if(D.focus&&t<D.focusT)foc=D.focus;else if(this.opts.auto&&!this.tvOn&&!RM())foc=D.spk;
    if(foc&&(foc.leaving||!foc.root.visible||foc.mode!=='seated'))foc=foc.mode==='sitting'?foc:null;
    if(foc){const h=foc.headPos(this._h||(this._h=new THREE.Vector3()));const d=this._d||(this._d=new THREE.Vector3());d.set(0,4.05,12.6).sub(h).normalize();P.copy(h).addScaledVector(d,this.ui.lookOpen?2.7:3.7);P.y+=.12;T.copy(h);T.y-=.04;if(this.ui.lookOpen)T.y-=.2;F=Math.max(22,vf*.74)}
    else if(this.tvOn&&this.opts.auto){P.set(TVP.x,3.3,4.9);T.set(TVP.x,2.4,-6.9);F=clamp(vf*1.1,34,66)}
    // someone is going out the window: a wide shot of that side of the room so everyone sees it
    let ts=null;this.av.forEach(a=>{const Q=a.toss;if(Q&&(!Q.t2||t-Q.t2<3.4))ts=Q;const K=a.plank;if(K&&K.ph!=='go'&&K.ph!=='jump')ts={side:K.side}});
    if(ts&&!this.thSid){P.set(ts.side*1.3,3.75,7.9);T.set(ts.side<0?-6.6:4.4,2.55,-6.2);F=clamp(vf,34,60)}
    let yw=0;this.av.forEach(a=>{const Y=a.yeet;if(Y&&Y.ph!=='wait'&&Y.ph!=='up')yw=1});
    if(yw&&!ts&&!this.thSid){P.set(0,5.6,11.6);T.set(0,.9,.6);F=clamp(vf*1.1,36,66)}
    let sk=null;this.av.forEach(a=>{const Y=a.shakeA;if(Y&&Y.ph!=='go'&&Y.ph!=='back')sk=Y});
    if(sk&&!ts&&!yw&&!this.thSid){const s=sk.sb;P.set(s.x*.7+1.2,2.5,s.z+5.9);T.set(s.x,1.0,s.z+.2);F=clamp(vf,34,58)}
    let th=null;this.av.forEach(a=>{const H=a.thanks;if(H&&(H.ph==='down'||H.ph==='reps'||H.ph==='up'))th=H});
    if(th&&!ts&&!yw&&!sk&&!this.thSid){if(th.ph==='reps'&&th.n>=4){P.set(th.X+2.1,.95,th.Z+2.2);T.set(th.X,.28,th.Z-.1)}else{P.set(th.X+.15,1.0,th.Z+2.9);T.set(th.X,.35,th.Z+.2)}F=clamp(vf*.85,30,50)}
    const nk=this.nk&&!this.nk.done?this.nk:null;if(nk)F=nk.shot(P,T,vf);
    const drv=this.drive&&this.drive.cam(P,T);if(drv)F=clamp(vf*1.25,44,72);if(this.drive&&this.drive.snap){this.drive.snap=0;D.P.copy(P);D.T.copy(T);D.F=F}
    if(!RM()&&!drv){P.x+=Math.sin(t*.11)*.32;P.y+=Math.sin(t*.07)*.1}
    const k=manual?6:nk?5:drv?7:1.7;if(nk&&nk.t>=NT.cut&&!nk.snap){nk.snap=1;D.P.copy(P);D.T.copy(T);D.F=F}['x','y','z'].forEach(c=>{D.P[c]=damp(D.P[c],P[c],k,dt);D.T[c]=damp(D.T[c],T[c],k,dt)});D.F=damp(D.F,F,k,dt);
    const off=this._o||(this._o=new THREE.Vector3());off.copy(D.P).sub(D.T);const sp=this._sp||(this._sp=new THREE.Spherical());sp.setFromVector3(off);sp.theta+=D.yaw;sp.phi=clamp(sp.phi+D.pitch,.62,1.55);sp.radius*=D.zoom;off.setFromSpherical(sp);
    this.cam.position.copy(D.T).add(off);this.cam.lookAt(D.T);this.cam.fov=D.F;this.cam.updateProjectionMatrix();
    if(this.shk>0){this.shk=Math.max(0,this.shk-dt*1.7);if(!RM()){const s=this.shk*this.shk*.09;this.cam.position.x+=(Math.random()-.5)*s;this.cam.position.y+=(Math.random()-.5)*s}}
    if(!manual){D.yaw=damp(D.yaw,0,.8,dt);D.pitch=damp(D.pitch,0,.8,dt);D.zoom=damp(D.zoom,1,.8,dt)}}
  // ---------- planar floor reflection ----------
  refl(){if(this.reflU)this.reflU.uRK.value=this.reflOn?.34:0;if(!this.reflOn)return;const c=this.cam,v=this.vcam;
    v.position.set(c.position.x,-c.position.y,c.position.z);const tg=this._rt||(this._rt=new THREE.Vector3());tg.set(0,0,-1).applyQuaternion(c.quaternion).add(c.position);tg.y=-tg.y;
    v.up.set(0,1,0).applyQuaternion(c.quaternion);v.up.y=-v.up.y;v.lookAt(tg);v.fov=c.fov;v.aspect=c.aspect;v.near=c.near;v.far=c.far;v.updateProjectionMatrix();v.updateMatrixWorld();
    this.texMat.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(v.projectionMatrix).multiply(v.matrixWorldInverse);
    const pl=this._pl||(this._pl=new THREE.Plane());pl.set(new THREE.Vector3(0,1,0),-.002);pl.applyMatrix4(v.matrixWorldInverse);const cp=this._cp||(this._cp=new THREE.Vector4());cp.set(pl.normal.x,pl.normal.y,pl.normal.z,pl.constant);
    const pm=v.projectionMatrix,q=this._q4||(this._q4=new THREE.Vector4());q.set((Math.sign(cp.x)+pm.elements[8])/pm.elements[0],(Math.sign(cp.y)+pm.elements[9])/pm.elements[5],-1,(1+pm.elements[10])/pm.elements[14]);
    cp.multiplyScalar(2/cp.dot(q));pm.elements[2]=cp.x;pm.elements[6]=cp.y;pm.elements[10]=cp.z+1;pm.elements[14]=cp.w;
    const f=this.room.floor,il=this.room.inlay;f.visible=il.visible=false;const sa=this.r.shadowMap.autoUpdate;this.r.shadowMap.autoUpdate=false;
    this.r.setRenderTarget(this.rRT);this.r.render(this.scene,v);this.r.setRenderTarget(null);this.r.shadowMap.autoUpdate=sa;f.visible=il.visible=true}
  // ---------- overlay ----------
  tags(){const v=this._tv||(this._tv=new THREE.Vector3()),w=this.W,h=this.H;
    this.av.forEach(a=>{const e=this.ui.tag(a);a.headPos(v);v.y+=.4;const dist=v.distanceTo(this.cam.position);v.project(this.cam);
      const vis=a.root.visible&&!a.leaving&&((a.drv&&a.drv.k?1:0)===(this.cam.position.y<TY/2?1:0))&&v.z<1&&Math.abs(v.x)<1.08&&v.y<1.1&&v.y>-1.1;const x=(v.x*.5+.5)*w,y=(-v.y*.5+.5)*h;a._sx=x;a._sy=y;a._vis=vis;
      this.ui.setTag(e,a,x,y,vis,clamp(10/dist,.6,1.3));
      if(a.camOn){let vid=null;try{vid=this.api.camVideo?this.api.camVideo(a.id,a.me):null}catch(x){}if(vid&&vid.parentNode!==e._c){e._c.appendChild(vid);this.play(vid)}}})}
  hud(){const B=[{k:'auto',i:IC.film,t:this.opts.auto?'Auto camera: on':'Auto camera: off',on:this.opts.auto},{k:'sfx',i:this.opts.sfx?IC.snd:IC.sndoff,t:this.opts.sfx?'Sound effects: on':'Sound effects: off',on:false},{k:'demo',i:IC.crowd,t:this.demo?'Hide the demo crowd':'Fill the floor with a demo crowd',on:this.demo},{k:'exp',i:this.api.expanded&&this.api.expanded()?IC.shrink:IC.exp,t:'Expand the floor',on:false},{k:'list',i:IC.list,t:'Classic list view',on:false}];this.ui.toolbar(B)}
  tool(k){const api=this.api;if(k==='auto'){this.opts.auto=!this.opts.auto;api.setOpt&&api.setOpt('auto',this.opts.auto)}else if(k==='sfx'){this.opts.sfx=!this.opts.sfx;api.setOpt&&api.setOpt('sfx',this.opts.sfx)}
    else if(k==='demo'){this.setDemo(!this.demo);api.setDemo&&api.setDemo(this.demo);this.ui.toast(this.demo?'Demo crowd on: this is only on your screen.':'Demo crowd off')}else if(k==='exp'){api.toggleExp&&api.toggleExp()}else if(k==='list'){api.toggleList&&api.toggleList()}}
  applyOpts(){try{const o=this.api.opts?this.api.opts():{};if(o.auto!==undefined)this.opts.auto=!!o.auto;if(o.sfx!==undefined)this.opts.sfx=!!o.sfx;const d=this.api.demo?!!this.api.demo():false;if(d!==this.demo)this.setDemo(d)}catch(e){}}
  // ---------- look editor ----------
  openLook(){const me=this.meAv;if(!me){this.ui.toast('Walk onto the floor first, then change your look.');return}const d=parseLook(me.lookStr,me.nm);
    let tm=0;this.ui.openLook(d,dd=>{const code=lookCode(dd);me.setLook(code);this.warm(me.rig);clearTimeout(tm);tm=setTimeout(()=>{try{this.api.setLook&&this.api.setLook(code)}catch(e){}},350)},()=>{try{this.api.setLook&&this.api.setLook(lookCode(d))}catch(e){}})}
  lookClosed(){}
  // ---------- input ----------
  bindInput(){const c=this.cv;let dn=null;
    c.addEventListener('pointerdown',e=>{this.lv.ctx();dn={x:e.clientX,y:e.clientY,yaw:this.dir.yaw,pitch:this.dir.pitch,mv:false};try{c.setPointerCapture(e.pointerId)}catch(x){}});
    c.addEventListener('pointermove',e=>{if(dn){const dx=e.clientX-dn.x,dy=e.clientY-dn.y;if(Math.abs(dx)+Math.abs(dy)>5){dn.mv=true;c.classList.add('drag');this.dir.manualT=this.t+10;this.dir.yaw=clamp(dn.yaw-dx*.004,-.45,.45);this.dir.pitch=clamp(dn.pitch-dy*.003,-.25,.2)}}else{const h=this.pick(e);c.classList.toggle('ptr',!!h)}});
    const up=e=>{if(!dn)return;const d=dn;dn=null;c.classList.remove('drag');if(!d.mv)this.click(this.pick(e))};c.addEventListener('pointerup',up);c.addEventListener('pointercancel',()=>{dn=null;c.classList.remove('drag')});
    c.addEventListener('wheel',e=>{e.preventDefault();this.dir.manualT=this.t+10;this.dir.zoom=clamp(this.dir.zoom*Math.exp(e.deltaY*.0012),.55,1.2)},{passive:false});
    c.addEventListener('dblclick',()=>{this.dir.manualT=0;this.dir.focus=null});
    c.addEventListener('keydown',e=>{if(e.key==='Escape'){if(this.thSid)this.closeTheater();this.ui.hideCard();if(this.ui.lookOpen)this.ui.closeLook()}})}
  scr(p){const v=this._sv||(this._sv=new THREE.Vector3());v.copy(p).project(this.cam);return{x:(v.x*.5+.5)*this.W,y:(-v.y*.5+.5)*this.H,z:v.z}}
  pick(e){if(!this.W)return null;const r=this.cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let best=null,bd=1e9;const h=this._ph2||(this._ph2=new THREE.Vector3()),h2=this._ph3||(this._ph3=new THREE.Vector3());
    this.av.forEach(a=>{if(!a.root.visible||a.leaving)return;a.headPos(h);const c=this.scr(h);h2.copy(h);h2.y+=.3;const c2=this.scr(h2);const rad=Math.hypot(c2.x-c.x,c2.y-c.y)*1.2+6;const dd=Math.hypot(x-c.x,y-c.y);if(c.z<1&&dd<rad&&dd<bd){bd=dd;best={k:'av',a}}});
    if(best)return best;
    const b=this.scr(new THREE.Vector3(BELLP.hx,BELLP.hy-.15,BELLP.z)),b2=this.scr(new THREE.Vector3(BELLP.hx,BELLP.hy+.15,BELLP.z));if(Math.hypot(x-b.x,y-b.y)<Math.abs(b2.y-b.y)*1.3+10)return{k:'bell'};
    const p1=this.scr(new THREE.Vector3(TVP.x-TVP.w/2,TVP.y+TVP.h/2,TVP.z)),p2=this.scr(new THREE.Vector3(TVP.x+TVP.w/2,TVP.y-TVP.h/2,TVP.z));if(x>p1.x&&x<p2.x&&y>p1.y&&y<p2.y)return{k:'tv'};return null}
  click(h){this.ui.hideCard();if(!h)return;
    if(h.k==='tv'){if(this.tvOn)this.openTheater(this.tvSid);else this.ui.toast('Share your screen or paste a YouTube link and it plays here on the big TV.');return}
    if(h.k==='bell'){this.emote('bell');return}
    const a=h.a;const st=a.bot?'Demo teammate':a.muted?'Muted':a.L>.12?'Talking now':a.camOn?'Camera on':'On the floor';
    const acts=a.me?[...(a.look&&a.look.W>0?[{k:'drive',t:a.drv?'Get out of my car':'Drive my car'}]:[]),{k:'look',t:'Change my look'},{k:'wave',t:'Wave'},{k:'cheer',t:'Celebrate'},{k:'plank',t:'Walk the plank'}]:[{k:'wave',t:'Wave at '+String(a.nm).split(' ')[0]},{k:'focus',t:'Focus camera'},{k:'hype',t:'Hype them up'},{k:'yeet',t:'Throw across the room'},{k:'toss',t:'Toss out the window'}];
    this.ui.showCard(Object.assign({},a,{status:st,nm:a.nm,me:a.me,id:a.id}),a._sx,a._sy-8,acts);this.cardA=a}
  cardAct(k,o){const a=this.cardA;if(!a)return;if(k==='drive'){this.ui.hideCard();if(this.drive.me)this.drive.stop();else this.drive.start()}else if(k==='look')this.openLook();else if(k==='wave')this.emote('wave');else if(k==='cheer')this.emote('cheer');else if(k==='focus'){this.dir.focus=a;this.dir.focusT=this.t+12}else if(k==='hype'){this.emote('fire')}else if(k==='toss'){this.toss(a.id)}else if(k==='yeet'){this.yeet(a.id)}else if(k==='plank'){this.emote('plank')}}
  // ---------- sound ----------
  sfx(k,v){if(!this.opts.sfx||RM())return;const ac=this.lv.ac;if(!ac||ac.state!=='running')return;const t=ac.currentTime;v=v==null?1:v;
    const tone=(f,d,a,len,type)=>{const o=ac.createOscillator(),g=ac.createGain();o.type=type||'sine';o.frequency.value=f;g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(a,t+d+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d+len);o.connect(g);g.connect(ac.destination);o.start(t+d);o.stop(t+d+len+.05)};
    if(k==='ding'){tone(1318.5,0,.12,1.3);tone(1046.5,.3,.12,1.6)}
    else if(k==='bell'){[[1,.16],[2.0,.08],[2.76,.07],[4.07,.04],[5.4,.025]].forEach(([r,a],i)=>tone(760*r,0,a,2.8/(1+i*.35)))}
    else if(k==='whoosh'){tone(420,0,.05,.5,'triangle');tone(840,.05,.03,.4,'sine')}
    else if(k==='whee'){const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.setValueAtTime(520,t);o.frequency.exponentialRampToValueAtTime(1350,t+.45);o.frequency.exponentialRampToValueAtTime(700,t+.9);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.06,t+.05);g.gain.exponentialRampToValueAtTime(.0001,t+.95);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+1)}
    else if(k==='smash'){const n=(ac.sampleRate*.7)|0,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);
      const s=ac.createBufferSource();s.buffer=b;const hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=1700;const g=ac.createGain();g.gain.value=.24;s.connect(hp);hp.connect(g);g.connect(ac.destination);s.start(t);
      tone(140,0,.16,.22,'sine');for(let i=0;i<10;i++)tone(2500+Math.random()*3800,.03+i*.05+Math.random()*.03,.03,.3+Math.random()*.35)}
    else if(k==='pop'){tone(190,0,.12,.16,'sine');tone(95,.02,.1,.24,'sine')}
    else if(k==='siren'){const o=ac.createOscillator(),g=ac.createGain(),lp=ac.createBiquadFilter();o.type='sawtooth';lp.type='lowpass';lp.frequency.value=2200;for(let i=0;i<3;i++){o.frequency.setValueAtTime(560,t+i*1.2);o.frequency.linearRampToValueAtTime(1080,t+i*1.2+.6);o.frequency.linearRampToValueAtTime(560,t+i*1.2+1.2)}
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.1);g.gain.setValueAtTime(.05,t+3.3);g.gain.exponentialRampToValueAtTime(.0001,t+3.7);o.connect(lp);lp.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+3.8)}
    else if(k==='click'){tone(1900,0,.08,.04,'square');tone(900,.01,.06,.06,'square')}
    else if(k==='whistle'){const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(1900,t);o.frequency.exponentialRampToValueAtTime(380,t+1.95);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.07,t+.25);g.gain.setValueAtTime(.07,t+1.8);g.gain.exponentialRampToValueAtTime(.0001,t+2.0);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+2.05)}
    else if(k==='boom'||k==='blast'||k==='rumble'){const L=k==='boom'?3.6:k==='blast'?3:2.2,n=(ac.sampleRate*L)|0,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);let y=0;for(let i=0;i<n;i++){y=y*.985+(Math.random()*2-1)*.15;const e=k==='rumble'?Math.min(1,i/n*3)*Math.pow(1-i/n,.6):Math.pow(1-i/n,k==='blast'?2.2:1.6);d[i]=y*e}
      const s=ac.createBufferSource();s.buffer=b;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=k==='blast'?1400:k==='boom'?420:260;const g=ac.createGain();g.gain.value=k==='blast'?1.2:k==='boom'?1.4:.9;s.connect(lp);lp.connect(g);g.connect(ac.destination);s.start(t);
      if(k!=='rumble'){tone(k==='boom'?42:55,0,.42,L*.8,'sine');tone(k==='boom'?31:80,.03,.3,L*.6,'triangle')}}
    else if(k==='clink'){[[2380,.075,.55],[3790,.055,.4],[5230,.04,.3],[7010,.022,.2]].forEach(([f,a,l])=>tone(f*(.97+Math.random()*.06),0,a*v,l*(.6+.4*v)));const n=(ac.sampleRate*.03)|0,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,6);
      const s=ac.createBufferSource();s.buffer=b;const hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=3000;const g=ac.createGain();g.gain.value=.2*v;s.connect(hp);hp.connect(g);g.connect(ac.destination);s.start(t)}
    else if(k==='rattle'){tone(3500+Math.random()*900,0,.02,.04,'square');tone(5200+Math.random()*1200,.012,.012,.03)}
    else if(k==='vroom'){const o=ac.createOscillator(),o2=ac.createOscillator(),g=ac.createGain(),lp=ac.createBiquadFilter();o.type='sawtooth';o2.type='square';lp.type='lowpass';lp.frequency.value=900;
      o.frequency.setValueAtTime(55,t);o.frequency.exponentialRampToValueAtTime(170,t+.9);o.frequency.exponentialRampToValueAtTime(90,t+1.7);o2.frequency.setValueAtTime(27.5,t);o2.frequency.exponentialRampToValueAtTime(85,t+.9);o2.frequency.exponentialRampToValueAtTime(45,t+1.7);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09,t+.15);g.gain.setValueAtTime(.09,t+1.3);g.gain.exponentialRampToValueAtTime(.0001,t+1.9);o.connect(lp);o2.connect(lp);lp.connect(g);g.connect(ac.destination);o.start(t);o2.start(t);o.stop(t+2);o2.stop(t+2)}
    else if(k==='horn'){[392,494].forEach(f=>{const o=ac.createOscillator(),g=ac.createGain();o.type='square';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05*v,t+.02);g.gain.setValueAtTime(.05*v,t+.32);g.gain.exponentialRampToValueAtTime(.0001,t+.42);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.45)})}
    else if(k==='airhorn'){[0,.32,.5].forEach((d0,j)=>{[466,554,698].forEach(f=>{const o=ac.createOscillator(),g=ac.createGain();o.type='sawtooth';o.frequency.value=f;g.gain.setValueAtTime(0,t+d0);g.gain.linearRampToValueAtTime(.035,t+d0+.02);g.gain.setValueAtTime(.035,t+d0+(j===2?.5:.22));g.gain.exponentialRampToValueAtTime(.0001,t+d0+(j===2?.62:.28));o.connect(g);g.connect(ac.destination);o.start(t+d0);o.stop(t+d0+.7)})})}
    else if(k==='chaching'){tone(2637,0,.08,.3,'square');tone(3136,.07,.07,.45,'square');for(let i=0;i<7;i++)tone(4000+Math.random()*2500,.18+i*.04,.03,.25)}
    else if(k==='crowd'){const n=(ac.sampleRate*1.8)|0,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++){const e=Math.min(1,i/n*6)*Math.pow(1-i/n,1.2);d[i]=(Math.random()*2-1)*e}
      const s=ac.createBufferSource();s.buffer=b;const bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1500;bp.Q.value=.6;const g=ac.createGain();g.gain.value=.35;s.connect(bp);bp.connect(g);g.connect(ac.destination);s.start(t)}
    else if(k==='thud'){tone(62,0,.32,.42,'sine');tone(118,0,.14,.2,'triangle');const n=(ac.sampleRate*.25)|0,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,4);
      const s=ac.createBufferSource();s.buffer=b;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=520;const g=ac.createGain();g.gain.value=.5;s.connect(lp);lp.connect(g);g.connect(ac.destination);s.start(t)}}
  // ---------- performance governor ----------
  gov(dt){if(this.fast)return;const ms=dt*1000;this.ms=this.ms?this.ms*.93+ms*.07:16;this.gT=(this.gT||0)+dt;if(this.gT<1.5)return;this.gT=0;
    if(this.ms>24){this.downT=this.t;if(this.pr>.7){this.pr=Math.max(.7,this.pr*.85)}else if(this.reflOn){this.reflOn=false}else if(this.r.shadowMap.enabled){this.r.shadowMap.enabled=false;this.room.lights.key.castShadow=false}}
    else if(this.ms<17.8&&this.pr<this.prMax&&this.t-(this.downT||-99)>12){this.pr=Math.min(this.prMax,this.pr*1.1)}}
  info(){return{pr:this.pr,ms:Math.round(this.ms||0),refl:this.reflOn,shadows:this.r.shadowMap.enabled,people:this.av.size,tv:this.tvOn,calls:this.r.info.render.calls,tris:this.r.info.render.triangles,ready:this.ready}}
}

export function mount(host,api){if(!host||!supported())return false;try{if(!OF)OF=new Office();OF.api=api;if(OF.dead)return false;if(OF.el.parentNode!==host)host.insertBefore(OF.el,host.firstChild);OF.applyOpts();OF.start();return true}catch(e){console.warn('VO3 mount failed',e);SUP=false;return false}}
export function unmount(){if(OF)OF.stop()}
export function emote(k){if(OF)OF.emote(k)}
export function toss(id){return OF?OF.toss(id):false}
export function targets(){return OF?OF.targets():[]}
export function yeet(id){return OF?OF.yeet(id):false}
export function shake(id){return OF?OF.shake(id):false}
export function bell(name,amt){if(OF&&OF.running)OF.bell(name,amt)}
export function openLook(){if(OF)OF.openLook()}
export function info(){return OF?OF.info():null}
export function dbg(){return OF}
export function drive(){if(!OF||!OF.drive)return false;if(OF.drive.me){OF.drive.stop();return true}return OF.drive.start()}
export function canDrive(){const a=OF&&OF.meAv;return !!(a&&a.look&&a.look.W>0)}
export function driving(){return !!(OF&&OF.drive&&OF.drive.me)}
let FCB=null;export function onFrame(f){FCB=typeof f==='function'?f:null}
export function tvRect(sid){try{return OF?OF.tvRect(sid):null}catch(e){return null}}
