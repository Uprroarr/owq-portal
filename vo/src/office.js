import * as THREE from 'three';
import {EffectComposer} from '../three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '../three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '../three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from '../three/examples/jsm/postprocessing/OutputPass.js';
import {ShaderPass} from '../three/examples/jsm/postprocessing/ShaderPass.js';
import {RoomEnvironment} from '../three/examples/jsm/environments/RoomEnvironment.js';
import {buildRoom} from './room.js';
import {Avatar, lookCode, parseLook} from './avatar.js';
import {TV} from './tv.js';
import {FX} from './fx.js';
import {Levels} from './audio.js';
import {MOODS, Tone} from './tone.js';
import {NT, Nuke} from './nuke.js';
import {CREM, EXT, SIGE, SIGM, SIGP, SIGSK, buildCar, rgbTick, styleDesk} from './cosm.js';
import {IC, Overlay, injectCSS} from './ui.js';
import {AISLE, BELLP, BOARD, COLX, ELEV, SEATS, TVP, pathIn, pathOut} from './layout.js';
import {clamp, damp, hash, lerp, now, rng, sstep} from './util.js';
import {cv, tex} from './tex.js';
import {Drive} from './drive.js';
import {buildSky, buildDoorway} from './sky.js';
import {World, LAYER_OUT, FLOORS} from './world.js';
import {Walk} from './walk.js';
import {Derby} from './derby.js';
import {Range} from './range.js';
import {Fly} from './fly.js';
import {buildBoard} from './board.js';
import {Arcade} from './arcade.js';
import {Crates} from './crate.js';

const GRADE={uniforms:{tDiffuse:{value:null},uT:{value:0},uV:{value:.3}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform sampler2D tDiffuse;uniform float uT,uV;varying vec2 vUv;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float l=dot(c,vec3(.2126,.7152,.0722));c=mix(c,c*vec3(1.05,1.,.95),smoothstep(.15,1.,l));c=mix(c,c*vec3(.93,.98,1.07),1.-smoothstep(0.,.22,l));vec2 d=vUv-.5;c*=1.-uV*dot(d,d)*1.7;c+=(h(vUv*1000.+uT)-.5)*.01;gl_FragColor=vec4(max(c,0.),1.);}'};
const EMO={dab:'\u{1F60E}',salute:'\u{1FAE1}',chestpound:'\u{1F4AA}',bow:'\u{1F647}',floss:'\u{1F57A}',robot:'\u{1F916}',sprinkler:'\u{1F4A6}',griddy:'\u{1F525}',airguitar:'\u{1F3B8}',disco:'\u{1FAA9}',hypejump:'\u{1F680}',moneygun:'\u{1F4B5}',micdrop:'\u{1F3A4}',belt:'\u{1F3C6}',sig:'\u{2728}',wave:'\u{1F44B}',clap:'\u{1F44F}',cheer:'\u{1F389}',dance:'\u{1F483}',fire:'\u{1F525}',money:'\u{1F4B8}',laugh:'\u{1F602}',bell:'\u{1F514}'};
CREM.forEach(($) => {
    EMO[$[0]] = $[1];
  });
const fakeTalk=(t,s)=>{const a=Math.max(0,Math.sin(t*27.0+s%7)),b=Math.max(0,Math.sin(t*18.2+s%5));return clamp((a*.7+b*.5)*.8*(.62+.38*Math.sin(t*1.1+s)),0,1)};
let SUP=null;
let OF=null;
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
function inPoly($, J, Q) {
    let Z = false;
    for (let U = 0, q = Q.length - 1;U < Q.length; q = U++) {
      let E = Q[U], Y = Q[q];
      if (E.y > J !== Y.y > J && $ < (Y.x - E.x) * (J - E.y) / (Y.y - E.y) + E.x)
        Z = !Z;
    }
    return Z;
  }
const RM=()=>{try{return !!(OF&&OF.api&&OF.api.reduced&&OF.api.reduced())}catch(e){return false}};
function supported(){if(SUP!==null)return SUP;try{const c=document.createElement('canvas');const g=c.getContext('webgl2');SUP=!!g;if(g){const l=g.getExtension('WEBGL_lose_context');l&&l.loseContext()}}catch(e){SUP=false}return SUP}
class Office {
    constructor() {
      injectCSS(), this.el = document.createElement("div"), this.el.className = "vo3", this.cv = document.createElement("canvas"), this.cv.className = "vo3c", this.cv.tabIndex = 0, this.cv.setAttribute("aria-label", "3D sales floor. Drag to look around, scroll to zoom, click a teammate or the TV."), this.el.appendChild(this.cv), this.ui = new Overlay(this.el, this), this.av = new Map, this.lv = new Levels, this.mountT = 0, this.running = false, this.t = now(), this.opts = { auto: true, sfx: true }, this.demo = false, this.tvOn = false, this.screens = [], this.dir = { P: new THREE.Vector3(0, 4.4, 14.2), T: new THREE.Vector3(0, 1.7, -1.9), F: 34, yaw: 0, pitch: 0, zoom: 1, manualT: 0, focus: null, focusT: 0, spk: null, spkT: 0 }, this.sys = [], this.init3d(), this.bindInput(), this.arc = new Arcade(this), this.crate = new Crates(this), this.walk = new Walk(this);
    }
  init3d() {
      let $ = this.r = new THREE.WebGLRenderer({ canvas: this.cv, antialias: false, alpha: false, powerPreference: "high-performance", stencil: false });
      $.outputColorSpace = THREE.SRGBColorSpace, $.toneMapping = THREE.NeutralToneMapping, $.toneMappingExposure = 1, $.shadowMap.enabled = true, $.shadowMap.type = THREE.PCFSoftShadowMap, this.prMax = Math.min(2, globalThis.devicePixelRatio || 1), this.pr = Math.min(this.prMax, 1.25), $.setPixelRatio(this.pr);
      let J = this.scene = new THREE.Scene;
      J.background = new THREE.Color(328458);
      let Q = new THREE.PMREMGenerator($);
      J.environment = Q.fromScene(new RoomEnvironment, 0.04).texture, J.environmentIntensity = 0.3, Q.dispose(), this.cam = new THREE.PerspectiveCamera(34, 1.7777777777777777, 0.1, 4200), this.cam.layers.enable(1), this.cam.layers.enable(LAYER_OUT), this.cam.position.copy(this.dir.P), this.cam.lookAt(this.dir.T), this.room = buildRoom(J), this.tv = new TV(this.room.group), this.fx = new FX(this.room.group);
      try {
        this.wld = new World(this);
        this.track = buildSky(this.wld.group), this.wld.out(this.track.group), buildDoorway(this.room.group);
        this.derby = new Derby(this, this.wld.group), this.wld.out(this.derby.group), this.sys.push(this.derby);
        this.range = new Range(this, this.room.group), this.sys.push(this.range);
        this.fly = new Fly(this, this.wld.group), this.wld.out(this.fly.group), this.sys.push(this.fly);
      } catch (K) {
        console.warn('VO3 world', K), this.track = null;
      }
      this.drive = new Drive(this);
      try {
        this.board = buildBoard(this.room.group);
      } catch (K) {
        this.board = null;
      }
      this.rRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType }), this.rRT.texture.generateMipmaps = true, this.rRT.texture.minFilter = THREE.LinearMipmapLinearFilter, this.vcam = new THREE.PerspectiveCamera, this.vcam.layers.set(0), this.texMat = new THREE.Matrix4, this.reflOn = true;
      let Z = this.room.floor.material, U = this;
      Z.onBeforeCompile = (K) => {
        K.uniforms.tRefl = { value: U.rRT.texture }, K.uniforms.uRM = { value: U.texMat }, K.uniforms.uRK = { value: 0.5 }, U.reflU = K.uniforms, K.vertexShader = K.vertexShader.replace("#include <common>", `#include <common>
uniform mat4 uRM;varying vec4 vRU;varying vec3 vRW;`).replace("#include <project_vertex>", `#include <project_vertex>
vec4 rw4=modelMatrix*vec4(transformed,1.);vRU=uRM*rw4;vRW=rw4.xyz;`), K.fragmentShader = K.fragmentShader.replace("#include <common>", `#include <common>
uniform sampler2D tRefl;uniform float uRK;varying vec4 vRU;varying vec3 vRW;`).replace("#include <opaque_fragment>", `{vec2 ruv=vRU.xy/vRU.w;float rg=clamp(roughnessFactor,0.,1.);float lod=1.6+rg*5.;vec3 rf=textureLod(tRefl,ruv,lod).rgb*.6+textureLod(tRefl,ruv,lod+1.7).rgb*.4;vec3 V=normalize(cameraPosition-vRW);float fr=.06+.94*pow(1.-clamp(V.y,0.,1.),5.);outgoingLight+=rf*uRK*mix(.42,1.,fr)*(1.-rg*.55);}
#include <opaque_fragment>`);
      }, Z.needsUpdate = true;
      let q = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
      this.comp = new EffectComposer($, q), this.comp.addPass(new RenderPass(J, this.cam)), this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.36, 0.5, 1.05), this.comp.addPass(this.bloom), this.grade = new ShaderPass(GRADE), this.comp.addPass(this.grade), this.comp.addPass(new OutputPass), this.cv.addEventListener("webglcontextlost", (K) => {
        K.preventDefault(), this.stop(), this.dead = 1;
        try {
          this.api && this.api.onFail && this.api.onFail();
        } catch (V) {}
      });
      let E = this.api && this.api.photo;
      if (E)
        this.room.setPhoto(E());
      this.ready = false;
      let Y = () => {
        this.ready = true;
      };
      try {
        $.compileAsync(J, this.cam).then(Y, Y);
      } catch (K) {
        Y();
      }
    }
  resize(){const w=this.el.clientWidth|0,h=this.el.clientHeight|0;if(w<2||h<2)return false;if(w===this.W&&h===this.H&&this._pr===this.pr)return true;
    this.W=w;this.H=h;this._pr=this.pr;this.el.classList.toggle('vo3nar',w<640);this.r.setPixelRatio(this.pr);this.r.setSize(w,h,false);this.comp.setPixelRatio(this.pr);this.comp.setSize(w,h);
    this.rRT.setSize(Math.max(2,(w*this.pr*.5)|0),Math.max(2,(h*this.pr*.5)|0));this.cam.aspect=w/h;this.cam.updateProjectionMatrix();return true}
  start(){if(this.running)return;this.running=true;this.mountT=now();this.last=now();const loop=()=>{if(!this.running)return;this.raf=requestAnimationFrame(loop);try{this.frame()}catch(e){this.errs=(this.errs||0)+1;if(this.errs<4)console.warn('VO3 frame',e);if(this.errs>30){this.stop();try{this.api.onFail&&this.api.onFail()}catch(x){}}}};this.raf=requestAnimationFrame(loop)}
  stop(){this.running=false;cancelAnimationFrame(this.raf)}
  frame() {
      if (!this.el.isConnected) {
        this.stop();
        return;
      }
      let $ = now(), J = Math.min(this.fast ? 0.5 : 0.05, $ - this.last);
      if (this.last = $, this.t = $, !this.resize())
        return;
      if (!this._ph && this.api && this.api.photo)
        this._ph = 1, this.room.setPhoto(this.api.photo());
      this.sync($), this.levels(J, $), this.demoTick(J, $), this.updScreens($);
      let Q = this.world();
      if (this.av.forEach((Z) => Z.update(J, $, Q)), this.drive)
        this.drive.tick(J, $);
      if (this.walk)
        this.walk.tick(J, $);
      this.steam(J);
      this.sys.forEach((Z) => Z.tick && Z.tick(J, $));
      if (this.track && (this._bT = (this._bT || 0) - J) <= 0)
        this._bT = 2, this.track.board(this.drive.boardRows());
      if (this.plankTick(J, $), this.yeetTick(J, $), this.thanksTick(J, $), this.shakeTick(J, $), this.screwTick(J), this.nukeTick(J), rgbTick($), this.bpTick(J, $), this.tossTick(J, $), this.desks(J, $), this.room.update(J, $), this.tv.update(J, $, this.tvData()), this.fx.update(J), this.brdTick($), this.arc)
        this.arc.tick(J, $);
      if (this.crate)
        this.crate.tick(J, $);
      if (this.direct(J, $), !this.ready)
        return;
      if (this.brdOpen && !this.fast)
        return;
      if (this.wld && (this.wld.update(J, $), this.zoneVis()), this.wld && this.wld.zone !== "o" ? this.reflU && (this.reflU.uRK.value = 0) : this.refl(), this.grade.uniforms.uT.value = $ % 97, this.comp.render(J), this.arc)
        this.arc.place();
      if (FCB)
        try {
          FCB();
        } catch (Z) {}
      if (this.tags(), this.hud(), this.gov(J), !this.shown)
        this.shown = 1, this.ui.loaded();
    }
  brdTick($) {
      let J = this.board;
      if (!J || !this.api.board)
        return;
      if ($ - (this._brT || 0) > 0.25) {
        this._brT = $;
        let Q = null;
        try {
          Q = this.api.board();
        } catch (Z) {}
        if (Q) {
          let Z = this.brdOpen;
          if (this.brdOpen = !!Q.open, Z && !this.brdOpen)
            this.brdShotT = 0;
          if (Q.cv)
            J.set(Q.cv, Q.v);
          this._brC = Q.cur || [], this._brW = Q.W || 3300, this._brH = Q.H || 1200;
        }
      }
      J.cursors(this._brC, this._brW, this._brH, $);
    }
  boardGo() {
      if (!this.api.openBoard)
        return;
      this.ui.hideCard(), this.brdShotT = this.t + 1.2, this.sfx("whoosh"), clearTimeout(this._brTo), this._brTo = setTimeout(() => {
        try {
          this.api.openBoard();
        } catch ($) {}
      }, RM() ? 0 : 700);
    }
  sync($) {
      let J = [];
      try {
        J = (this.api.people() || []).slice();
      } catch (q) {}
      if (this.demo) {
        if (!this.bots) {
          let E = (this.api.roster ? this.api.roster() : []).filter(Boolean);
          this.bots = E.slice(0, 8).map((Y, K) => ({ id: "bot:" + Y, nm: Y, bot: 1, vt: 9000000000000000 + K }));
        }
        let q = new Set(J.map((E) => E.nm));
        this.bots.forEach((E) => {
          if (!q.has(E.nm))
            J.push(E);
        });
      } else
        this.bots = null;
      J.sort((q, E) => (q.vt || 0) - (E.vt || 0));
      let Q = new Set(J.map((q) => q.id));
      this.av.forEach((q, E) => {
        if (!Q.has(E) && !q.leaving)
          this.depart(q);
      }), this.meAv = null;
      for (let q of J) {
        let E = this.av.get(q.id);
        if (!E)
          E = this.arrive(q, $);
        if (!E)
          continue;
        if (E.p = q, E.muted = !!q.mu, E.hand = !!q.hd, E.camOn = !!q.cam, E.me = !!q.me, E.bot = !!q.bot, E.nm = q.nm, E.me)
          this.meAv = E;
        if (!E.bot && !E.leaving && (q.ava || "") !== E.lookStr && !(E.me && this.ui.lookOpen))
          E.setLook(q.ava || ""), this.warm(E.rig);
        if (this.drive && !E.me && !E.bot)
          this.drive.remote(E, q.dv);
        if (this.walk && !E.me && !E.bot && !q.dv)
          this.walk.remote(E, q.wk);
        if (!E.me && !E.bot)
          this.sys.forEach((Z) => Z.remote && Z.remote(E, q));
        else if (E.me && q.dv && !this.drive.me)
          try {
            this.api.drive && this.api.drive(null);
          } catch (V) {}
        let Y = q.lc && typeof q.lc === "object" ? q.lc : null;
        if (Y && this.crate) {
          let V = +Y.n || 0;
          if (E.lcN === undefined) {
            E.lcN = V;
            let X = Date.now();
            try {
              if (this.api.now)
                X = this.api.now();
            } catch (H) {}
            let W = (X - (+Y.at || 0)) / 1000;
            if (W >= 0 && W < (+Y.d || 3) + 3)
              this.crate.show(E, Object.assign({}, Y, { d: Math.max(0.6, (+Y.d || 3) - W) }));
          } else if (V !== E.lcN)
            E.lcN = V, this.crate.show(E, Y);
        }
        let K = q.em && typeof q.em === "object" ? q.em : null;
        if (E.emN === undefined)
          E.emN = K ? K.n : 0;
        else if (K && K.n !== E.emN) {
          if (E.emN = K.n, !(E.me && E.localEm === K.n))
            this.playEmote(E, String(K.k || ""), K);
        }
      }
      let Z = [...this.av.values()].filter((q) => !q.leaving && !q.bot).length, U = [...this.av.values()].filter((q) => q.bot && !q.leaving).length;
      this.ui.count(Z ? `${Z} ON THE FLOOR` + (U ? ` &middot; ${U} DEMO` : "") : U ? `DEMO CROWD &middot; ${U}` : "WAITING FOR THE TEAM");
    }
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
  desks($, J) {
      this.room.desks.forEach((Q) => {
        let Z = Q.av, U = Z && !Z.leaving && Z.look ? Z.look : null, q = U ? [U.D, U.C, U.I, U.R, U.W, U.F].join(",") : "";
        if (q !== (Q.styK || "") && !(this.nk && !this.nk.done)) {
          Q.styK = q;
          try {
            if (styleDesk(Q, U && (U.D || U.C || U.I || U.R || U.W || U.F) ? { D: U.D, C: U.C, I: U.I, R: U.R, W: U.W, F: U.F } : null, this.room.group), Q.sty)
              this.warm(Q.sty);
            if (Q.chairSty)
              this.warm(Q.chairSty);
          } catch (Y) {
            console.warn("VO3 desk", Y);
          }
        }
        if (Q.up)
          Q.up(J);
        let E = Q.led.material.color;
        if (!Z || Z.leaving) {
          E.setRGB(0.45, 0.04, 0.09), Q.holo.visible = false;
          return;
        }
        if (Z.muted)
          E.setRGB(1.7, 0.1, 0.16);
        else if (Z.L > 0.12)
          E.setRGB(0.25, 2.5, 0.85);
        else
          E.setRGB(1.5, 0.12, 0.3);
        if (Q.holo.visible = Z.mode === "seated" || Z.mode === "sitting", Q.sway = Math.sin(J * 0.6 + Z.seed % 9) * 0.07, Q.hT -= $, Q.hT <= 0 && Q.holo.visible)
          Q.hT = 1.5 + Math.random(), this.holo(Q, Z, J);
      });
    }
  holo($, J, Q) {
      let Z = $.hc.getContext("2d");
      Z.clearRect(0, 0, 512, 154);
      let E = J.p && J.p.ar && typeof J.p.ar === "object" ? J.p.ar : null;
      if (E) {
        let V = { stack: "STACKER", paddle: "PADDLE DUEL", snake: "SNAKE", bricks: "BRICK BREAK", trivia: "POLICY TRIVIA" }[E.g] || "THE ARCADE MENU", X = E.vs ? String(E.vs).split(" ")[0].toUpperCase().slice(0, 12) : "";
        if (Z.fillStyle = "rgba(255,31,79,.16)", Z.fillRect(4, 4, 504, 146), Z.strokeStyle = "rgba(255,90,130,.9)", Z.lineWidth = 2, Z.strokeRect(4, 4, 504, 146), Z.font = "700 21px Verdana,sans-serif", Z.fillStyle = "#ffe0e8", Z.textAlign = "left", Z.fillText(String(J.nm).toUpperCase().slice(0, 19), 18, 34), Z.textAlign = "right", Z.font = "700 14px Verdana,sans-serif", Z.fillStyle = "#ffd166", Z.fillText("ON A QUICK BREAK", 494, 34), Z.textAlign = "left", Z.font = "600 13px Verdana,sans-serif", Z.fillStyle = E.q ? "#8ef0c2" : "#ffb3c2", Z.fillText(E.q ? "LOOKING FOR A PARTNER - CLICK YOUR COMPUTER TO JOIN" : X ? "PLAYING VS " + X : "PLAYING", 18, 64), Z.font = "800 30px Verdana,sans-serif", Z.fillStyle = "#fff", Z.fillText(V, 18, 100), E.s)
          Z.textAlign = "right", Z.fillStyle = "#ffd166", Z.fillText(String(E.s), 494, 100), Z.textAlign = "left";
        $.ht.needsUpdate = true;
        return;
      }
      let Y = null;
      try {
        Y = this.api.agentStats ? this.api.agentStats(J.nm) : null;
      } catch (V) {}
      Z.fillStyle = "rgba(30,150,190,.13)", Z.fillRect(4, 4, 504, 146), Z.strokeStyle = "rgba(90,232,255,.8)", Z.lineWidth = 2, Z.strokeRect(4, 4, 504, 146), Z.fillStyle = "rgba(90,232,255,.8)", Z.fillRect(4, 4, 60, 3), Z.fillRect(448, 147, 60, 3), Z.font = "700 21px Verdana,sans-serif", Z.fillStyle = "#d4fbff", Z.fillText(String(J.nm).toUpperCase().slice(0, 19), 18, 34), Z.textAlign = "right", Z.font = "700 14px Verdana,sans-serif", Z.fillStyle = J.muted ? "#ff7a90" : J.L > 0.12 ? "#5dffb0" : "#8eeaff", Z.fillText(J.muted ? "● MUTED" : J.L > 0.12 ? "● ON THE MIC" : J.bot ? "DEMO" : "● ON THE FLOOR", 494, 34), Z.textAlign = "left", Z.font = "600 13px Verdana,sans-serif", Z.fillStyle = "#8eeaff", Z.fillText("AP · 7 DAYS", 18, 64), Z.fillText("APPS", 214, 64), Z.fillText("RANK", 340, 64), Z.font = "800 30px Verdana,sans-serif", Z.fillStyle = "#ffffff", Z.fillText(Y ? String(Y.ap) : "$0", 18, 98), Z.fillText(String(Y ? Y.apps : 0), 214, 98), Z.fillText(Y && Y.rank ? "#" + Y.rank : "–", 340, 98);
      let K = rng(hash(J.nm) + (Q / 9 | 0));
      for (let V = 0;V < 24; V++) {
        let X = 5 + K() * 26;
        Z.fillStyle = `rgba(90,232,255,${0.22 + 0.55 * V / 24})`, Z.fillRect(18 + V * 19.5, 142 - X, 12, X);
      }
      $.ht.needsUpdate = true;
    }
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
  busy(a,ctx){return !!(a&&(a.drv||a.toss||a.plank||a.yeet||a.yeetA||a.thanks||a.shakeA||a.shakeB||(ctx!=='drive'&&a.wk)||a.fly||a.bat||a.lane||a.knd))}
  emote(k){const me=this.meAv;if((k==='plank'||k==='thanks')&&!this.plankOk(me)){this.ui.toast(me?'Sit back down at your desk first.':'Walk onto the floor first.');return}try{const n=this.api.emote?this.api.emote(k):null;if(me&&n!=null)me.localEm=n}catch(e){}if(me)this.playEmote(me,k);else if(k==='bell')this.ringBell('','')}
  playEmote($, J, Q) {
      if (J === "nuke") {
        this.playNuke($);
        return;
      }
      if (J === "sig") {
        this.playSig($);
        return;
      }
      if (J === "thanks") {
        this.playThanks($);
        return;
      }
      if (J === "shake") {
        let U = Q && Q.to ? this.av.get(String(Q.to)) : null;
        if (U)
          this.playShake($, U);
        return;
      }
      if (J === "plank") {
        this.playPlank($);
        return;
      }
      if (J === "yeet") {
        let U = Q && Q.to ? this.av.get(String(Q.to)) : null;
        if (U)
          this.playYeet($, U);
        return;
      }
      if (J === "toss") {
        let U = Q && Q.to ? this.av.get(String(Q.to)) : null;
        if (U)
          this.playToss($, U);
        return;
      }
      if (!EMO[J])
        return;
      if (J === "bell") {
        if (this.ringBell($ ? $.nm : "", ""), $)
          this.popAt($, EMO.bell);
        return;
      }
      $.emote(J), this.popAt($, EMO[J]);
      let Z = $.root.position;
      if (J === "cheer")
        $.headPos(this._e || (this._e = new THREE.Vector3)), this.fx.confetti(this._e.x, this._e.y + 0.5, this._e.z, 150, 1.4);
      if (J === "fire")
        this.fx.fire(Z.x, 0.85, Z.z, 2.8);
      if (J === "money")
        this.fx.rain(Z.x, 2.3, Z.z, 80, 0.8);
      if (J === "dance")
        this.fx.sparkle(Z.x, 1.6, Z.z, 30, [0.9, 0.5, 1]);
      if (J === "moneygun")
        (this.bpE || (this.bpE = [])).push({ k: J, a: $, t: 0, n: 0 });
      if (J === "disco")
        (this.bpE || (this.bpE = [])).push({ k: J, a: $, t: 0, n: 0 });
      if (J === "micdrop")
        this.micDrop($);
      if (J === "belt")
        this.beltUp($);
      if (J === "hypejump")
        this.fx.sparkle(Z.x, 0.2, Z.z + 0.2, 40, [1, 0.8, 0.3]);
      if (EXT.emoFx)
        try {
          EXT.emoFx(this, $, J);
        } catch (U) {
          console.warn("VO3 emote fx", U);
        }
    }
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
  entrance($) {
      let J = $.look && $.look.E;
      if (!J || RM())
        return;
      if (J >= 6 && EXT.entrance) {
        try {
          EXT.entrance(this, $, J);
        } catch (Z) {
          console.warn("VO3 entrance", Z);
        }
        return;
      }
      if ((this.bpE || (this.bpE = [])).push({ k: "ent", E: J, a: $, t: 0, n: 0 }), J === 1)
        this.fx.confetti(ELEV.out.x, 2.9, ELEV.out.z, 220, 1.8), this.sfx("crowd");
      else if (J === 4)
        this.fx.rain(ELEV.out.x, 2.6, ELEV.out.z + 0.3, 120, 1.1), this.sfx("chaching");
      else if (J === 5)
        this.sfx("boom"), this.shk = Math.max(this.shk || 0, 0.5), this.fx.sparkle(ELEV.out.x, 1.6, ELEV.out.z, 70, [0.6, 0.85, 1]);
      else
        this.sfx("whoosh");
    }
  bpTick($, J) {
      let Q = this.bpE;
      if (Q && Q.length)
        for (let Z = Q.length - 1;Z >= 0; Z--) {
          let U = Q[Z], q = U.a;
          if (U.t += $, U.k === "x") {
            let Y = true;
            try {
              Y = !q || q.leaving || !this.av.has(q.id) ? true : U.f(U, $, J);
            } catch (K) {
              Y = true;
            }
            if (Y) {
              try {
                U.end && U.end(U);
              } catch (K) {}
              Q.splice(Z, 1);
            }
            continue;
          }
          if (!q || q.leaving || !q.root.visible && U.k !== "ent" && U.k !== "car") {
            if (U.car)
              this.room.group.remove(U.car);
            Q.splice(Z, 1);
            continue;
          }
          let E = q.root.position;
          if (U.k === "moneygun") {
            if (U.t > 2.7) {
              Q.splice(Z, 1);
              continue;
            }
            if ((U.t * 7 | 0) !== U.n) {
              U.n = U.t * 7 | 0;
              let Y = this._mg || (this._mg = new THREE.Vector3);
              q.el[1].updateWorldMatrix(true, false), Y.set(0, -0.2, 0).applyMatrix4(q.el[1].matrixWorld), this.fx.rain(Y.x, Y.y + 0.4, Y.z + 0.3, 6, 0.25);
            }
          } else if (U.k === "disco") {
            if (U.t > 3.4) {
              Q.splice(Z, 1);
              continue;
            }
            if ((U.t * 5 | 0) !== U.n) {
              U.n = U.t * 5 | 0;
              let Y = [[1, 0.3, 0.8], [0.3, 0.8, 1], [1, 0.85, 0.3], [0.4, 1, 0.5]][U.n % 4];
              this.fx.sparkle(E.x + (Math.random() - 0.5) * 1.2, 2.2, E.z + (Math.random() - 0.5) * 0.8, 14, Y);
            }
          } else if (U.k === "mic") {
            if (!U.m) {
              let K = new THREE.Group, V = new THREE.MeshStandardMaterial({ color: 1710622, roughness: 0.4, metalness: 0.6 });
              K.add(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.16, 10), V));
              let X = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshStandardMaterial({ color: 10132128, roughness: 0.35, metalness: 0.8 }));
              X.position.y = 0.1, K.add(X), this.room.group.add(K), U.m = K, U.v = null;
            }
            let Y = U.m;
            if (U.t < 1.15) {
              q.el[1].updateWorldMatrix(true, false);
              let K = this._mc || (this._mc = new THREE.Vector3);
              K.set(0, -0.2, 0.04).applyMatrix4(q.el[1].matrixWorld), Y.position.copy(K), Y.rotation.set(0.3, 0, 0);
            } else {
              if (!U.v)
                U.v = new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.4, 0.35), this.sfx("whoosh");
              if (U.v.y -= 9.8 * $, Y.position.addScaledVector(U.v, $), Y.rotation.x += $ * 7, Y.position.y < 0.04) {
                if (Y.position.y = 0.04, !U.hit)
                  U.hit = 1, this.sfx("thud"), this.sfx("boom"), this.shk = Math.max(this.shk || 0, 0.35), this.popAt(q, "\uD83C\uDFA4");
                U.v.set(0, 0, 0);
              }
              if (U.t > 4.5)
                this.room.group.remove(Y), Q.splice(Z, 1);
            }
          } else if (U.k === "car") {
            let Y = U.car;
            if (U.ph === "in") {
              let X = Math.min(1, U.t / 1.9), W = 1 - Math.pow(1 - X, 3), H = 13 + -6.4 * W;
              if (Y.userData.spin(U.x - H), U.x = H, Y.position.x = H, X >= 1) {
                if (U.ph = "out", U.t = 0, !q.leaving && q.seat) {
                  q.root.position.set(6.3999999999999995, 0, 3.75), q.root.rotation.y = Math.PI, q.sitK = 0, q.standK = 0, q.root.visible = true;
                  let N = U.seat;
                  q.walk([[COLX, 3.75], [COLX, N.aisle], [N.x, N.aisle], [N.x, N.sz]], () => {
                    q.mode = "sitting", q.turnTo = 0;
                  }), this.entrance(q), this.sfx("pop");
                }
              }
            } else if (U.ph === "out") {
              if (U.t < 1.1)
                continue;
              if (!U.go)
                U.go = 1, this.sfx("vroom");
              let W = Math.min(9, (U.t - 1.1) * 7) * $;
              if (Y.position.x -= W, Y.userData.spin(W), Y.position.x < -14)
                this.room.group.remove(Y), Q.splice(Z, 1);
            }
          } else if (U.k === "ent") {
            if (U.t > 4.2 || q.mode !== "walk" && U.t > 1.2) {
              if (U.sp)
                this.room.group.remove(U.sp), this.room.group.remove(U.sp.target);
              Q.splice(Z, 1);
              continue;
            }
            if (U.E === 2) {
              if ((U.t * 14 | 0) !== U.n)
                U.n = U.t * 14 | 0, this.fx.fire(E.x, 0.05, E.z, 0.12);
            } else if (U.E === 3) {
              if (!U.sp)
                U.sp = new THREE.SpotLight(16773846, 90, 14, 0.32, 0.4, 1.2), U.sp.position.set(E.x, 5.1, E.z), this.room.group.add(U.sp, U.sp.target);
              U.sp.position.set(E.x, 5.1, E.z + 0.4), U.sp.target.position.set(E.x, 0, E.z), U.sp.intensity = 90 * Math.min(1, U.t * 3);
            } else if (U.E === 5 && U.t < 0.5)
              this.room.lights.key.intensity = (this._kI || (this._kI = this.room.lights.key.intensity)) * (Math.random() < 0.5 ? 2.2 : 0.4);
            else if (U.E === 5 && U.t >= 0.5 && this._kI)
              this.room.lights.key.intensity = this._kI;
          }
        }
      this.av.forEach((Z) => {
        let U = Z._belt;
        if (!U)
          return;
        if (U.t += $, U.t > 3.1 || Z.leaving || !Z.emo || Z.emo.k !== "belt") {
          this.room.group.remove(U.g), Z._belt = null;
          return;
        }
        Z.el[0].updateWorldMatrix(true, false), Z.el[1].updateWorldMatrix(true, false);
        let q = this._bl || (this._bl = new THREE.Vector3), E = this._br || (this._br = new THREE.Vector3);
        q.set(0, -0.17, 0).applyMatrix4(Z.el[0].matrixWorld), E.set(0, -0.17, 0).applyMatrix4(Z.el[1].matrixWorld), U.g.position.lerpVectors(q, E, 0.5), U.g.position.y += 0.02, U.g.rotation.set(0, Z.root.rotation.y, 0);
      });
    }
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
  stagePath($, J, Q) {
      let Z = { b: [-4.725, -1.575, 1.575, 4.725], m: [-3.15, 0, 3.15], f: [-1.575, 1.575] }, U = { b: AISLE.b, m: AISLE.m, f: AISLE.f }, q = { b: AISLE.m, m: AISLE.f, f: Q }, E = ["b", "m", "f"], Y = [[$.x, $.aisle]], K = $.x;
      for (let V = Math.max(0, E.indexOf($.row));V < 3; V++) {
        let X = E[V], W = Z[X][0], H = 1e9;
        Z[X].forEach((N) => {
          let F = Math.abs(N - K) + 0.6 * Math.abs(N - J);
          if (F < H)
            H = F, W = N;
        }), Y.push([W, U[X]], [W, q[X]]), K = W;
      }
      return Y.push([J, Q]), Y;
    }
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
  playPlank($) {
      if (!$ || this.busy($) || $.leaving || $.mode === "wait" || !$.seat)
        return;
      if (this.popAt($, "\uD83C\uDFF4‍☠️"), RM())
        return;
      let J = $.seat, Q = J.x <= 0.5 ? -1 : 1, Z = Q < 0 ? clamp(-7.165 + (J.x + 7.165) * 0.3, -8.55, -5.75) : clamp(5.2 + (J.x - 5.2) * 0.3, 4.1, 5.6), U = [[J.x, J.aisle]];
      if (J.row !== "b")
        U.push([Q * 8.4, J.aisle], [Q * 8.4, -5.6]);
      U.push([Z, -5.6], [Z, -6.1]), $.plank = { ph: "go", ix: Z, side: Q, t: 0 }, $.speed = 3, $.emo = null, $.idleK = null, this.hat($, true), $.mode = "rising", $._leavePath = U, $._done = () => {
        if ($.plank && $.plank.ph === "go")
          $.plank.ph = "board", $.plank.t = 0;
      };
    }
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
  direct($, J) {
      let Q = this.dir, Z = this.W / this.H, U = null, q = 0, E = 0;
      if (this.av.forEach((C) => {
        if (C.score = clamp((C.score || 0) + (C.L > 0.1 ? $ : -$ * 1.6), 0, 6), C.score > q)
          E = q, q = C.score, U = C;
        else if (C.score > E)
          E = C.score;
      }), U && q > 1 && q > E * 1.6 + 0.2) {
        if (Q.spk !== U && (!Q.spk || J - Q.spkT > 2.5 || q > (Q.spk.score || 0) + 1))
          Q.spk = U, Q.spkT = J;
      } else if (Q.spk && (Q.spk.score || 0) < 0.12)
        Q.spk = null;
      if (Q.spk && (Q.spk.leaving || !this.av.has(Q.spk.id)))
        Q.spk = null;
      let Y = clamp(2 * Math.atan(Math.tan(17 * Math.PI / 180) * 1.78 / Z) * 180 / Math.PI, 30, 62), K = this._P || (this._P = new THREE.Vector3), V = this._T || (this._T = new THREE.Vector3), X = Y, W = 0, H = 0;
      this.av.forEach((C) => {
        if (!C.leaving) {
          if (W++, C.seat && C.seat.row === "f")
            H = 1;
        }
      });
      let N = H ? 1 : clamp((W - 4) / 5, 0, 1);
      K.set(0, 3.8 + 0.55 * N, 10.7 + 3.5 * N), V.set(0, 1.55 + 0.15 * N, -2.5 + 0.6 * N);
      let F = J < Q.manualT, G = null;
      if (this.ui.lookOpen && this.meAv)
        G = this.meAv;
      else if (Q.focus && J < Q.focusT)
        G = Q.focus;
      else if (this.opts.auto && !this.tvOn && !RM())
        G = Q.spk;
      if (G && (G.leaving || !G.root.visible || G.mode !== "seated"))
        G = G.mode === "sitting" ? G : null;
      if (G) {
        let C = G.headPos(this._h || (this._h = new THREE.Vector3)), p = this._d || (this._d = new THREE.Vector3);
        if (p.set(0, 4.05, 12.6).sub(C).normalize(), K.copy(C).addScaledVector(p, this.ui.lookOpen ? 2.7 : 3.7), K.y += 0.12, V.copy(C), V.y -= 0.04, this.ui.lookOpen)
          V.y -= 0.2;
        X = Math.max(22, Y * 0.74);
      } else if (this.tvOn && this.opts.auto)
        K.set(TVP.x, 3.3, 4.9), V.set(TVP.x, 2.4, -6.9), X = clamp(Y * 1.1, 34, 66);
      let _ = this.crate && this.crate.L.length && this.opts.auto && !this.ui.lookOpen ? this.crate.L[this.crate.L.length - 1] : null;
      if (_ && _.a && _.a.root.visible && !(this.drive && this.drive.me)) {
        let C = _.a.headPos(this._ch || (this._ch = new THREE.Vector3));
        V.set(C.x, C.y + 0.55, C.z);
        let p = this._cd || (this._cd = new THREE.Vector3);
        p.set(0, 4.05, 12.6).sub(V).normalize(), K.copy(V).addScaledVector(p, 4.6), K.y += 0.25, X = Math.max(26, Y * 0.85);
      }
      let D = null;
      if (this.av.forEach((C) => {
        let p = C.toss;
        if (p && (!p.t2 || J - p.t2 < 3.4))
          D = p;
        let i = C.plank;
        if (i && i.ph !== "go" && i.ph !== "jump")
          D = { side: i.side };
      }), D && !this.thSid)
        K.set(D.side * 1.3, 3.75, 7.9), V.set(D.side < 0 ? -6.6 : 4.4, 2.55, -6.2), X = clamp(Y, 34, 60);
      let O = 0;
      if (this.av.forEach((C) => {
        let p = C.yeet;
        if (p && p.ph !== "wait" && p.ph !== "up")
          O = 1;
      }), O && !D && !this.thSid)
        K.set(0, 5.6, 11.6), V.set(0, 0.9, 0.6), X = clamp(Y * 1.1, 36, 66);
      let I = null;
      if (this.av.forEach((C) => {
        let p = C.shakeA;
        if (p && p.ph !== "go" && p.ph !== "back")
          I = p;
      }), I && !D && !O && !this.thSid) {
        let C = I.sb;
        K.set(C.x * 0.7 + 1.2, 2.5, C.z + 5.9), V.set(C.x, 1, C.z + 0.2), X = clamp(Y, 34, 58);
      }
      let B = null;
      if (this.av.forEach((C) => {
        let p = C.thanks;
        if (p && (p.ph === "down" || p.ph === "reps" || p.ph === "up"))
          B = p;
      }), B && !D && !O && !I && !this.thSid) {
        if (B.ph === "reps" && B.n >= 4)
          K.set(B.X + 2.1, 0.95, B.Z + 2.2), V.set(B.X, 0.28, B.Z - 0.1);
        else
          K.set(B.X + 0.15, 1, B.Z + 2.9), V.set(B.X, 0.35, B.Z + 0.2);
        X = clamp(Y * 0.85, 30, 50);
      }
      if ((this.brdOpen || J < (this.brdShotT || 0)) && !D && !this.thSid) {
        let C = BOARD.x - 0.6;
        K.set(0.6, 3, BOARD.z), V.set(BOARD.x, BOARD.y, BOARD.z), X = Math.max(2 * Math.atan((BOARD.h / 2 + 0.25) / C), 2 * Math.atan(Math.tan(Math.atan((BOARD.w / 2 + 0.2) / C)) / Z)) * 180 / Math.PI;
      }
      let k = this.nk && !this.nk.done ? this.nk : null;
      if (k)
        X = k.shot(K, V, Y);
      let z = this.drive && this.drive.cam(K, V);
      if (z)
        X = clamp(Y * 1.25, 44, 72);
      let wkc = !z && this.walk && this.walk.cam(K, V);
      if (wkc)
        X = clamp(Y * 1.2, 46, 70), z = true;
      for (const S0 of this.sys)
        if (!z && S0.cam) {
          let f0 = S0.cam(K, V, Y, Z);
          if (f0)
            X = f0, z = true;
        }
      let M = this.arc && this.arc.cam(K, V, Z);
      if (M)
        X = M;
      if (this.drive && this.drive.snap || this.walk && this.walk.snap || this.sys.some((S0) => S0.snap))
        this.drive.snap = 0, this.walk.snap = 0, this.sys.forEach((S0) => S0.snap = 0), Q.P.copy(K), Q.T.copy(V), Q.F = X;
      if (this.dbgCam) {
        if (K.copy(this.dbgCam.P), V.copy(this.dbgCam.T), this.dbgCam.F)
          X = this.dbgCam.F;
        Q.P.copy(K), Q.T.copy(V), Q.F = X, Q.yaw = Q.pitch = 0, Q.zoom = 1;
      }
      if (!RM() && !z && !M && !this.dbgCam)
        K.x += Math.sin(J * 0.11) * 0.32, K.y += Math.sin(J * 0.07) * 0.1;
      let v = M ? 6 : F ? 6 : k ? 5 : z ? 7 : 1.7;
      if (k && k.t >= NT.cut && !k.snap)
        k.snap = 1, Q.P.copy(K), Q.T.copy(V), Q.F = X;
      if (["x", "y", "z"].forEach((C) => {
        Q.P[C] = damp(Q.P[C], K[C], v, $), Q.T[C] = damp(Q.T[C], V[C], v, $);
      }), Q.F = damp(Q.F, X, v, $), M)
        Q.yaw = 0, Q.pitch = 0, Q.zoom = 1, Q.manualT = 0;
      let g = this._o || (this._o = new THREE.Vector3);
      g.copy(Q.P).sub(Q.T);
      let R = this._sp || (this._sp = new THREE.Spherical);
      if (R.setFromVector3(g), z ? 0 : (R.theta += Q.yaw, R.phi = clamp(R.phi + Q.pitch, 0.62, 1.55), R.radius *= Q.zoom), g.setFromSpherical(R), this.cam.position.copy(Q.T).add(g), this.cam.lookAt(Q.T), this.cam.fov = Q.F, this.cam.updateProjectionMatrix(), this.shk > 0) {
        if (this.shk = Math.max(0, this.shk - $ * 1.7), !RM()) {
          let C = this.shk * this.shk * 0.09;
          this.cam.position.x += (Math.random() - 0.5) * C, this.cam.position.y += (Math.random() - 0.5) * C;
        }
      }
      if (!F)
        Q.yaw = damp(Q.yaw, 0, 0.8, $), Q.pitch = damp(Q.pitch, 0, 0.8, $), Q.zoom = damp(Q.zoom, 1, 0.8, $);
    }
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
  // steam out of the ears of anyone yelling
  steam(dt){const v=this._stv||(this._stv=new THREE.Vector3());this.av.forEach(a=>{const y=a.md&&a.md.yell||0;if(y<.45||!a.root.visible||Math.random()>dt*9*y)return;a.headPos(v);const sd=Math.random()<.5?-1:1,c=Math.cos(a.root.rotation.y),s=Math.sin(a.root.rotation.y);this.fx.sparkle(v.x+c*.28*sd,v.y+.02,v.z-s*.28*sd,3,[.92,.92,.95])})}
  // which floor each person is on, and which floors the camera can see from where it is
  floorOf(a){if(a.fly)return 'd';if(a.wk)return a.wk.f;if(a.drv)return a.drv.k?'d':'o';return a.flr||'o'}
  zoneVis(){const z=this.wld.zone,see={o:{o:1,d:1},g:{g:1},r:{r:1,d:1},d:{d:1,r:1,o:1}}[z]||{o:1};
    this.av.forEach(a=>{const v=!!see[this.floorOf(a)];a._zv=v;if(!v&&a.root.visible){a.root.visible=false;a._zh=1}else if(v&&a._zh){a.root.visible=true;a._zh=0}if(a.drv&&a.drv.car)a.drv.car.visible=v});
    const st=this.room.static;if(st&&this._stz!==z){this._stz=z;const show=z==='o'||z==='d';st.forEach(m=>m.visible=show)}
    this.ui.place({o:'SALES FLOOR',d:'SKY DECK',r:'SKY PARK',g:'FIRING RANGE'}[z]);
    this.sys.forEach(S0=>S0.zone&&S0.zone(z))}
  // other systems (Sky Park, range, planes) answer questions from walking
  hook(name,...args){for(const S0 of this.sys){if(S0[name]){const r=S0[name](...args);if(r)return r}}return null}
  // ---------- overlay ----------
  tags(){const v=this._tv||(this._tv=new THREE.Vector3()),w=this.W,h=this.H;
    this.av.forEach(a=>{const e=this.ui.tag(a);a.headPos(v);v.y+=.4;const dist=v.distanceTo(this.cam.position);v.project(this.cam);
      const vis=a.root.visible&&!a.leaving&&a._zv!==false&&!(a.me&&(a.lane||a.bat))&&v.z<1&&Math.abs(v.x)<1.08&&v.y<1.1&&v.y>-1.1;const x=(v.x*.5+.5)*w,y=(-v.y*.5+.5)*h;a._sx=x;a._sy=y;a._vis=vis;
      this.ui.setTag(e,a,x,y,vis,clamp(10/dist,.6,1.3));
      if(a.camOn){let vid=null;try{vid=this.api.camVideo?this.api.camVideo(a.id,a.me):null}catch(x){}if(vid&&vid.parentNode!==e._c){e._c.appendChild(vid);this.play(vid)}}})}
  hud() {
      let $ = [{ k: "auto", i: IC.film, t: this.opts.auto ? "Auto camera: on" : "Auto camera: off", on: this.opts.auto }, { k: "sfx", i: this.opts.sfx ? IC.snd : IC.sndoff, t: this.opts.sfx ? "Sound effects: on" : "Sound effects: off", on: false }, { k: "demo", i: IC.crowd, t: this.demo ? "Hide the demo crowd" : "Fill the floor with a demo crowd", on: this.demo }, ...this.board && this.api.openBoard ? [{ k: "board", i: IC.board, t: "Brainstorm board", on: !!this.brdOpen }] : [], { k: "exp", i: this.api.expanded && this.api.expanded() ? IC.shrink : IC.exp, t: "Expand the floor", on: false }, { k: "list", i: IC.list, t: "Classic list view", on: false }];
      this.ui.toolbar($);
    }
  tool($) {
      let J = this.api;
      if ($ === "auto")
        this.opts.auto = !this.opts.auto, J.setOpt && J.setOpt("auto", this.opts.auto);
      else if ($ === "sfx")
        this.opts.sfx = !this.opts.sfx, J.setOpt && J.setOpt("sfx", this.opts.sfx);
      else if ($ === "demo")
        this.setDemo(!this.demo), J.setDemo && J.setDemo(this.demo), this.ui.toast(this.demo ? "Demo crowd on: this is only on your screen." : "Demo crowd off");
      else if ($ === "exp")
        J.toggleExp && J.toggleExp();
      else if ($ === "board")
        this.boardGo();
      else if ($ === "list")
        J.toggleList && J.toggleList();
    }
  applyOpts(){try{const o=this.api.opts?this.api.opts():{};if(o.auto!==undefined)this.opts.auto=!!o.auto;if(o.sfx!==undefined)this.opts.sfx=!!o.sfx;const d=this.api.demo?!!this.api.demo():false;if(d!==this.demo)this.setDemo(d)}catch(e){}}
  // ---------- look editor ----------
  openLook(){const me=this.meAv;if(!me){this.ui.toast('Walk onto the floor first, then change your look.');return}const d=parseLook(me.lookStr,me.nm);
    let tm=0;this.ui.openLook(d,dd=>{const code=lookCode(dd);me.setLook(code);this.warm(me.rig);clearTimeout(tm);tm=setTimeout(()=>{try{this.api.setLook&&this.api.setLook(code)}catch(e){}},350)},()=>{try{this.api.setLook&&this.api.setLook(lookCode(d))}catch(e){}})}
  lookClosed(){}
  bindInput() {
      let $ = this.cv, J = null;
      $.addEventListener("pointerdown", (Z) => {
        if (this.lv.ctx(), this.arc && this.arc.on)
          return;
        J = { x: Z.clientX, y: Z.clientY, yaw: this.dir.yaw, pitch: this.dir.pitch, mv: false };
        try {
          $.setPointerCapture(Z.pointerId);
        } catch (U) {}
      }), $.addEventListener("pointermove", (Z) => {
        if (J) {
          let U = Z.clientX - J.x, q = Z.clientY - J.y;
          if (Math.abs(U) + Math.abs(q) > 5) {
            if (J.mv = true, $.classList.add("drag"), this.walk && this.walk.me) {
              this.walk.drag(Z.clientX - (J.lx ?? J.x), Z.clientY - (J.ly ?? J.y)), J.lx = Z.clientX, J.ly = Z.clientY;
              return;
            }
            if (this.sys.some((S0) => S0.drag && S0.drag(Z.clientX - (J.lx ?? J.x), Z.clientY - (J.ly ?? J.y))))
              return J.lx = Z.clientX, J.ly = Z.clientY, void 0;
            this.dir.manualT = this.t + 10, this.dir.yaw = clamp(J.yaw - U * 0.004, -0.45, 0.45), this.dir.pitch = clamp(J.pitch - q * 0.003, -0.25, 0.2);
          }
        } else if (!(this.arc && this.arc.on)) {
          let U = this.pick(Z);
          $.classList.toggle("ptr", !!U);
        }
      });
      let Q = (Z) => {
        if (!J)
          return;
        let U = J;
        if (J = null, $.classList.remove("drag"), !U.mv && !this.sys.some((S0) => S0.grab && S0.grab()))
          this.click(this.pick(Z));
      };
      $.addEventListener("pointerup", Q), $.addEventListener("pointercancel", () => {
        J = null, $.classList.remove("drag");
      }), $.addEventListener("wheel", (Z) => {
        if (Z.preventDefault(), this.arc && this.arc.on)
          return;
        if (this.walk && this.walk.me)
          return this.walk.zoom(Math.exp(Z.deltaY * 0.0012));
        this.dir.manualT = this.t + 10, this.dir.zoom = clamp(this.dir.zoom * Math.exp(Z.deltaY * 0.0012), 0.55, 1.2);
      }, { passive: false }), $.addEventListener("dblclick", () => {
        this.dir.manualT = 0, this.dir.focus = null;
      }), $.addEventListener("keydown", (Z) => {
        if (Z.key === "Escape") {
          if (this.thSid)
            this.closeTheater();
          if (this.ui.hideCard(), this.ui.lookOpen)
            this.ui.closeLook();
        }
      });
    }
  scr(p){const v=this._sv||(this._sv=new THREE.Vector3());v.copy(p).project(this.cam);return{x:(v.x*.5+.5)*this.W,y:(-v.y*.5+.5)*this.H,z:v.z}}
  pick($) {
      if (!this.W)
        return null;
      let J = this.cv.getBoundingClientRect(), Q = $.clientX - J.left, Z = $.clientY - J.top, U = null, q = 1e9, E = this._ph2 || (this._ph2 = new THREE.Vector3), Y = this._ph3 || (this._ph3 = new THREE.Vector3);
      if (this.av.forEach((N) => {
        if (!N.root.visible || N.leaving)
          return;
        N.headPos(E);
        let F = this.scr(E);
        Y.copy(E), Y.y += 0.3;
        let G = this.scr(Y), _ = Math.hypot(G.x - F.x, G.y - F.y) * 1.2 + 6, D = Math.hypot(Q - F.x, Z - F.y);
        if (F.z < 1 && D < _ && D < q)
          q = D, U = { k: "av", a: N };
      }), U)
        return U;
      let K = this.meAv;
      if (this.arc && K && K.seat && K.mode === "seated" && !K.drv) {
        let N = K.seat, F = [[N.x - 0.95, 0.76, N.z - 0.41], [N.x + 0.95, 0.76, N.z - 0.41], [N.x - 0.95, 0.76, N.z + 0.41], [N.x + 0.95, 0.76, N.z + 0.41], [N.x - 0.55, 1.12, N.z + 0.2], [N.x + 0.55, 1.12, N.z + 0.2]].map((G) => this.scr(new THREE.Vector3(G[0], G[1], G[2])));
        if (F.every((G) => G.z < 1)) {
          let G = F.map((D) => D.x), _ = F.map((D) => D.y);
          if (Q > Math.min(...G) && Q < Math.max(...G) && Z > Math.min(..._) && Z < Math.max(..._))
            return { k: "pc" };
        }
      }
      let V = this.scr(new THREE.Vector3(BELLP.hx, BELLP.hy - 0.15, BELLP.z)), X = this.scr(new THREE.Vector3(BELLP.hx, BELLP.hy + 0.15, BELLP.z));
      if (Math.hypot(Q - V.x, Z - V.y) < Math.abs(X.y - V.y) * 1.3 + 10)
        return { k: "bell" };
      let W = this.scr(new THREE.Vector3(TVP.x - TVP.w / 2, TVP.y + TVP.h / 2, TVP.z)), H = this.scr(new THREE.Vector3(TVP.x + TVP.w / 2, TVP.y - TVP.h / 2, TVP.z));
      if (Q > W.x && Q < H.x && Z > W.y && Z < H.y)
        return { k: "tv" };
      if (this.board && this.api.openBoard) {
        let N = this.board.corners().map((F) => this.scr(F));
        if (N.every((F) => F.z < 1) && inPoly(Q, Z, N))
          return { k: "board" };
      }
      return null;
    }
  click($) {
      if (this.ui.hideCard(), !$)
        return;
      if ($.k === "tv") {
        if (this.tvOn)
          this.openTheater(this.tvSid);
        else
          this.ui.toast("Share your screen or paste a YouTube link and it plays here on the big TV.");
        return;
      }
      if ($.k === "bell") {
        this.emote("bell");
        return;
      }
      if ($.k === "board") {
        this.boardGo();
        return;
      }
      if ($.k === "pc") {
        this.arc.enter();
        return;
      }
      let J = $.a, Q = J.bot ? "Demo teammate" : J.muted ? "Muted" : J.L > 0.12 ? "Talking now" : J.camOn ? "Camera on" : "On the floor", Z = J.me ? [{ k: "walk", t: J.wk ? "Back to my desk" : "Walk around (WASD)" }, ...J.look && J.look.W > 0 ? [{ k: "drive", t: J.drv ? "Get out of my car" : "Drive my car" }] : [], ...J.wk ? [] : [{ k: "arcade", t: "Play a game at my desk" }], { k: "look", t: "Change my look" }, { k: "wave", t: "Wave" }, { k: "cheer", t: "Celebrate" }, { k: "plank", t: "Walk the plank" }] : [...J.p && J.p.aq && J.p.aq.st === "w" ? [{ k: "arcjoin", t: "Play " + ({ paddle: "Paddle Duel", snake: "Snake", trivia: "Policy Trivia" }[J.p.aq.g] || "a game") + " with " + String(J.nm).split(" ")[0] }] : [], { k: "wave", t: "Wave at " + String(J.nm).split(" ")[0] }, { k: "focus", t: "Focus camera" }, { k: "hype", t: "Hype them up" }, { k: "yeet", t: "Throw across the room" }, { k: "toss", t: "Toss out the window" }];
      this.ui.showCard(Object.assign({}, J, { status: Q, nm: J.nm, me: J.me, id: J.id }), J._sx, J._sy - 8, Z), this.cardA = J;
    }
  cardAct($, J) {
      let Q = this.cardA;
      if (!Q)
        return;
      if ($ === "arcade") {
        this.ui.hideCard(), this.arc.enter();
        return;
      }
      if ($ === "walk") {
        if (this.ui.hideCard(), this.walk.me)
          this.walk.stop();
        else if (!this.walk.start())
          this.ui.toast("Sit at your desk first, then get up and walk.");
        return;
      }
      if ($ === "arcjoin") {
        this.ui.hideCard(), this.arc.joinFrom(Q);
        return;
      }
      if ($ === "drive")
        if (this.ui.hideCard(), this.drive.me)
          this.drive.stop();
        else
          this.drive.start();
      else if ($ === "look")
        this.openLook();
      else if ($ === "wave")
        this.emote("wave");
      else if ($ === "cheer")
        this.emote("cheer");
      else if ($ === "focus")
        this.dir.focus = Q, this.dir.focusT = this.t + 12;
      else if ($ === "hype")
        this.emote("fire");
      else if ($ === "toss")
        this.toss(Q.id);
      else if ($ === "yeet")
        this.yeet(Q.id);
      else if ($ === "plank")
        this.emote("plank");
    }
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
function mount(host,api){if(!host||!supported())return false;try{if(!OF)OF=new Office();OF.api=api;if(OF.dead)return false;if(OF.el.parentNode!==host)host.insertBefore(OF.el,host.firstChild);OF.applyOpts();OF.start();return true}catch(e){console.warn('VO3 mount failed',e);SUP=false;return false}}
function unmount(){if(OF)OF.stop()}
function emote(k){if(OF)OF.emote(k)}
function toss(id){return OF?OF.toss(id):false}
function targets(){return OF?OF.targets():[]}
function yeet(id){return OF?OF.yeet(id):false}
function shake(id){return OF?OF.shake(id):false}
function bell(name,amt){if(OF&&OF.running)OF.bell(name,amt)}
function openLook(){if(OF)OF.openLook()}
function info(){return OF?OF.info():null}
function dbg(){return OF}
function arcade() {
    if (OF && OF.arc)
      if (OF.arc.on)
        OF.arc.exit();
      else
        OF.arc.enter();
  }
function arcadeOn() {
    return !!(OF && OF.arc && OF.arc.on);
  }
function boardOpen() {
    if (OF)
      OF.boardGo();
  }
function drive(){if(!OF||!OF.drive)return false;if(OF.drive.me){OF.drive.stop();return true}return OF.drive.start()}
function canDrive(){const a=OF&&OF.meAv;return !!(a&&a.look&&a.look.W>0)}
function driving(){return !!(OF&&OF.drive&&OF.drive.me)}
let FCB=null;
function onFrame(f){FCB=typeof f==='function'?f:null}
function tvRect(sid){try{return OF?OF.tvRect(sid):null}catch(e){return null}}

export {arcade, arcadeOn, bell, boardOpen, canDrive, dbg, drive, driving, emote, info, mount, onFrame, openLook, shake, supported, targets, toss, tvRect, unmount, yeet};
