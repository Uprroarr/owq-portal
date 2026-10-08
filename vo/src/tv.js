import * as THREE from 'three';
import {cv,tex,glowCanvas} from './tex.js';
import {rbox} from './geo.js';
import {TVP} from './layout.js';
import {damp,clamp} from './util.js';

const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const FS=`uniform sampler2D tA,tB;uniform float uMix,uAB,uK,uT;varying vec2 vUv;
vec3 fitB(vec2 uv){float sa=16./9.;vec2 q=uv;if(uAB>sa){float s=sa/uAB;q.y=(uv.y-.5)/s+.5;}else{float s=uAB/sa;q.x=(uv.x-.5)/s+.5;}
 if(q.x<0.||q.x>1.||q.y<0.||q.y>1.)return vec3(0.);return texture2D(tB,q).rgb;}
void main(){vec3 a=texture2D(tA,vUv).rgb;vec3 b=fitB(vUv);float band=abs(vUv.y-.5)*2.,m=uMix*1.08;
 float rv=smoothstep(band-.05,band,m);vec3 c=mix(a,b,rv);
 float edge=exp(-pow((band-m)*24.,2.))*step(.02,uMix)*step(uMix,.98);c+=vec3(.75,.88,1.)*edge*1.6;
 vec2 px=fract(vUv*vec2(1280.,720.));c*=.93+.07*smoothstep(0.,.18,min(px.x,px.y));
 vec2 d=vUv-.5;c*=1.-.22*dot(d,d);gl_FragColor=vec4(c*uK,1.);}`;

export class TV{
  constructor(G){this.G=G;this.cv=cv(1280,720);this.x=this.cv.getContext('2d');this.itex=tex(this.cv,{mips:false});
    this.u={tA:{value:this.itex},tB:{value:this.itex},uMix:{value:0},uAB:{value:16/9},uK:{value:1.08},uT:{value:0}};
    const bez=new THREE.Mesh(rbox(TVP.w+.18,TVP.h+.18,.1,.035),new THREE.MeshStandardMaterial({color:0x050507,roughness:.18,metalness:.5}));bez.position.set(TVP.x,TVP.y,TVP.z-.06);bez.castShadow=false;G.add(bez);
    this.screen=new THREE.Mesh(new THREE.PlaneGeometry(TVP.w,TVP.h),new THREE.ShaderMaterial({uniforms:this.u,vertexShader:VS,fragmentShader:FS}));this.screen.position.set(TVP.x,TVP.y,TVP.z);G.add(this.screen);
    this.haloM=new THREE.MeshBasicMaterial({map:tex(glowCanvas(),{mips:false}),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:new THREE.Color(.25,.3,.5),toneMapped:false});
    this.halo=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(TVP.w*1.75,TVP.w+3.4),TVP.h*1.9),this.haloM);this.halo.position.set(TVP.x,TVP.y,-6.995);G.add(this.halo);
    this.light=new THREE.PointLight(0x9fb4ff,20,0,2);this.light.position.set(TVP.x,TVP.y-.3,TVP.z+1.5);G.add(this.light);
    this.lc=cv(1024,112);this.lt=tex(this.lc,{mips:false});this.lower=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.2625),new THREE.MeshBasicMaterial({map:this.lt,transparent:true,depthWrite:false,toneMapped:false}));
    this.lower.position.set(TVP.x-TVP.w/2+1.3,TVP.y-TVP.h/2+.27,TVP.z+.01);this.lower.visible=false;G.add(this.lower);
    this.sc=cv(8,5);this.sx=this.sc.getContext('2d',{willReadFrequently:true});this.avg=new THREE.Color(.45,.5,.8);this.tAvg=0;this.tDraw=0;
    this.src=null;this.srcKey='';this.vt=null;this.mix=0;this.want=0;this.label='';this.celebrate=null;this.data=null;}
  setSource(el,key,label,aspect){if(key===this.srcKey){this.label=label||this.label;return}this.srcKey=key;this.label=label||'';
    if(!el){this.want=0;this.drawLower();return}
    let t;if(el.tagName==='VIDEO'){t=new THREE.VideoTexture(el)}else{t=new THREE.CanvasTexture(el);t.isDemo=el.__static?0:1}
    t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;
    const old=this.vt;this.vt=t;this.src=el;this.u.tB.value=t;this.want=1;if(this.mix>.98)this.mix=.5;if(old&&old!==t)setTimeout(()=>old.dispose(),1500);this.drawLower()}
  drawLower(){const x=this.lc.getContext('2d'),W=1024,H=112;x.clearRect(0,0,W,H);if(!this.srcKey){this.lower.visible=false;return}
    const g=x.createLinearGradient(0,0,W,0);g.addColorStop(0,'rgba(10,4,10,.92)');g.addColorStop(.8,'rgba(10,4,10,.75)');g.addColorStop(1,'rgba(10,4,10,0)');x.fillStyle=g;x.fillRect(0,14,W,84);
    x.fillStyle='#ff1f4f';x.fillRect(0,14,10,84);x.beginPath();x.arc(52,56,13,0,6.283);x.fill();x.font='800 34px Verdana,sans-serif';x.fillStyle='#fff';x.textBaseline='middle';x.fillText('LIVE',78,57);
    x.font='700 30px Verdana,sans-serif';x.fillStyle='#ffd0da';x.fillText(String(this.label||'').toUpperCase().slice(0,34),186,57);this.lt.needsUpdate=true;this.lower.visible=true}
  bell(name,amt){this.celebrate={t:0,name:String(name||'').toUpperCase(),amt:amt||''}}
  update(dt,t,data){this.data=data||this.data;
    this.mix=damp(this.mix,this.want,this.want?2.6:3.2,dt);if(Math.abs(this.mix-this.want)<.002)this.mix=this.want;this.u.uMix.value=this.mix;this.u.uT.value=t;
    if(this.src&&this.src.tagName==='VIDEO'&&this.src.videoWidth)this.u.uAB.value=this.src.videoWidth/this.src.videoHeight;else if(this.src&&this.src.width)this.u.uAB.value=this.src.width/this.src.height;
    if(this.vt&&this.vt.isDemo)this.vt.needsUpdate=true;
    if(this.celebrate){this.celebrate.t+=dt;if(this.celebrate.t>7)this.celebrate=null}
    this.tDraw-=dt;if(this.tDraw<=0&&(this.mix<.999||this.celebrate)){this.tDraw=this.celebrate?1/20:.25;this.drawIdle(t);this.itex.needsUpdate=true}
    this.tAvg-=dt;if(this.tAvg<=0){this.tAvg=.25;try{const s=this.mix>.5&&this.src?this.src:this.cv;this.sx.drawImage(s,0,0,8,5);const d=this.sx.getImageData(0,0,8,5).data;let r=0,g=0,b=0;for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2]}const n=d.length/4;
      const lin=v=>Math.pow(v/n/255,2.2);this.tc=new THREE.Color(lin(r),lin(g),lin(b))}catch(e){this.tc=new THREE.Color(.4,.45,.6)}}
    if(this.tc){this.avg.lerp(this.tc,1-Math.exp(-dt*4))}
    const a=this.avg,lum=Math.max(.05,a.r*.3+a.g*.59+a.b*.11);this.light.color.setRGB(a.r/lum*.5+.5,a.g/lum*.5+.5,a.b/lum*.5+.5);this.light.intensity=10+lum*90;
    this.haloM.color.setRGB(a.r*.9+.04,a.g*.9+.04,a.b*.9+.06)}
  drawIdle(t){const x=this.x,W=1280,H=720,D=this.data||{};x.save();
    const bg=x.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#0b0309');bg.addColorStop(.55,'#17040d');bg.addColorStop(1,'#07020a');x.fillStyle=bg;x.fillRect(0,0,W,H);
    const sw=((t*.12)%1.6-.3)*W;const sg=x.createLinearGradient(sw-260,0,sw+260,H*.4);sg.addColorStop(0,'rgba(255,31,79,0)');sg.addColorStop(.5,'rgba(255,31,79,.16)');sg.addColorStop(1,'rgba(255,31,79,0)');x.fillStyle=sg;x.fillRect(0,0,W,H);
    x.strokeStyle='rgba(255,31,79,.07)';x.lineWidth=1;for(let i=0;i<W;i+=40){x.beginPath();x.moveTo(i,0);x.lineTo(i,H);x.stroke()}for(let j=0;j<H;j+=40){x.beginPath();x.moveTo(0,j);x.lineTo(W,j);x.stroke()}
    const C=this.celebrate;
    if(C){const k=Math.min(1,C.t*2.5);x.fillStyle=`rgba(255,180,60,${.12*k})`;x.fillRect(0,0,W,H);
      for(let i=0;i<90;i++){const px=(i*137.5%W),py=((i*61+C.t*(160+i%7*40))%(H+60))-30;x.fillStyle=['#ffd166','#ff1f4f','#ffffff','#3ddc97','#7cc7ff'][i%5];x.save();x.translate(px,py);x.rotate(C.t*3+i);x.fillRect(-7,-4,14,8);x.restore()}
      x.textAlign='center';x.fillStyle='#ffd166';x.font='800 64px Verdana,sans-serif';x.shadowColor='#ff9f1c';x.shadowBlur=30;x.fillText('🔔 RING THE BELL',W/2,H*.32);
      x.shadowBlur=24;x.shadowColor='#ff1f4f';x.fillStyle='#fff';x.font='900 92px Verdana,sans-serif';x.fillText(C.name.slice(0,18),W/2,H*.52);
      x.fillStyle='#ffd166';x.font='800 70px Verdana,sans-serif';x.fillText(C.amt?'JUST CLOSED '+C.amt:'JUST CLOSED A DEAL',W/2,H*.68);x.shadowBlur=0;x.restore();return}
    x.textAlign='left';x.textBaseline='alphabetic';
    x.fillStyle='#ff1f4f';x.beginPath();x.arc(70,78,11,0,6.283);x.globalAlpha=.55+.45*Math.sin(t*4);x.fill();x.globalAlpha=1;
    x.fillStyle='#fff';x.font='800 30px Verdana,sans-serif';x.fillText('SALES FLOOR  ·  LIVE',94,89);
    const d=new Date();x.textAlign='right';x.font='700 30px Verdana,sans-serif';x.fillStyle='#ffb3c2';x.fillText(d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}),W-60,89);
    x.textAlign='left';x.font='italic 900 96px Verdana,sans-serif';const tg=x.createLinearGradient(60,120,700,220);tg.addColorStop(0,'#ffffff');tg.addColorStop(1,'#ff6f8d');x.fillStyle=tg;x.shadowColor='rgba(255,31,79,.7)';x.shadowBlur=28;x.fillText('ONLY WINNERS',56,205);x.shadowBlur=0;
    x.font='700 22px Verdana,sans-serif';x.fillStyle='#c79aa6';x.fillText('THERE ARE ONLY TWO TYPES OF PEOPLE: THOSE WHO WIN, AND THOSE WHO QUIT.',62,248);
    const tile=(tx,ty,lab,val,col)=>{x.fillStyle='rgba(255,255,255,.045)';x.fillRect(tx,ty,250,128);x.fillStyle=col;x.fillRect(tx,ty,4,128);x.font='700 18px Verdana,sans-serif';x.fillStyle='#b9a3ad';x.fillText(lab,tx+22,ty+38);x.font='800 50px Verdana,sans-serif';x.fillStyle='#fff';x.fillText(String(val),tx+22,ty+100)};
    tile(60,300,'AP THIS WEEK',D.ap||'$0','#ffd166');tile(330,300,'WINS THIS WEEK',D.wins||0,'#3ddc97');tile(60,452,'ON THE FLOOR',D.floor||0,'#ff1f4f');tile(330,452,'APPS LOGGED',D.apps||0,'#7cc7ff');
    x.font='800 24px Verdana,sans-serif';x.fillStyle='#fff';x.fillText('TOP PRODUCERS · 7 DAYS',660,322);
    const top=(D.top||[]).slice(0,5),mx=Math.max(1,...top.map(r=>r[2]||0));
    if(!top.length){x.font='600 22px Verdana,sans-serif';x.fillStyle='#a3909a';x.fillText('Log issued business to light up the board.',660,372)}
    top.forEach((r,i)=>{const y=350+i*56,w=520*(r[2]||0)/mx;const g=x.createLinearGradient(660,0,660+w,0);g.addColorStop(0,'rgba(255,31,79,.85)');g.addColorStop(1,'rgba(255,120,150,.55)');x.fillStyle='rgba(255,255,255,.05)';x.fillRect(660,y,520,42);x.fillStyle=g;x.fillRect(660,y,Math.max(6,w),42);
      x.font='800 22px Verdana,sans-serif';x.fillStyle='#fff';x.fillText((i+1)+'  '+String(r[0]).toUpperCase().slice(0,22),676,y+29);x.textAlign='right';x.fillStyle='#ffe3a3';x.fillText(String(r[1]),1168,y+29);x.textAlign='left'});
    const tk=(D.ticker&&D.ticker.length?D.ticker:['Share your screen and it plays right here on the big screen.']).join('     •     ');x.fillStyle='rgba(255,31,79,.9)';x.fillRect(0,H-64,W,64);x.font='800 24px Verdana,sans-serif';x.fillStyle='#fff';
    x.save();x.beginPath();x.rect(0,H-64,W,64);x.clip();const tw=x.measureText(tk).width+200,off=(t*90)%tw;x.fillText(tk,W-off,H-23);x.fillText(tk,W-off+tw,H-23);x.restore();
    x.fillStyle='#0a0408';x.fillRect(0,H-64,190,64);x.fillStyle='#ffd166';x.font='900 24px Verdana,sans-serif';x.fillText('WINS ▶',28,H-23);x.restore()}
}
