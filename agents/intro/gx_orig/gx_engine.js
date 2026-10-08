/* GX: Only Winners & Quitters globe engine. Raw WebGL, no libraries.
   Layers: space (stars, dust, eclipse corona, ring haze) -> Earth at night (city-light veins, clouds, pings)
   -> atmosphere limb -> asteroid belt -> light-speed streaks -> screen fx. */
var GX=(function(){
'use strict';
var PI=Math.PI,TAU=PI*2,D2R=PI/180;
var S={ok:0,gl:null,cv:null,gl2:0,raf:0,run:0,t:0,last:0,acc:0,fps:30,scale:1,q:'full',still:0,w:2,h:2,cssW:2,cssH:2,dpr:1,asp:1,
  P:{},tex:{},nz:null,ready:0,lost:0,frames:0,ms:0,msN:0,err:null,gpu:'',api:'',pings:[],mx:0,my:0,tw:[],tl:[],cb:{},hi:1,man:0,
  pix:2.1e6,rocks:[],mesh:[],warpN:0,stars:0,aa:1,hp:1,tFade:0,vp:[0,0],lastAdapt:0,slow:0,fast:0};

/* ---------- math ---------- */
function clamp(x,a,b){return x<a?a:x>b?b:x}
function mix(a,b,t){return a+(b-a)*t}
function sstep(a,b,x){var t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)}
var EASE={lin:function(t){return t},io3:function(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2},o3:function(t){return 1-Math.pow(1-t,3)},i3:function(t){return t*t*t},o5:function(t){return 1-Math.pow(1-t,5)},i2:function(t){return t*t},io2:function(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2},oexp:function(t){return t>=1?1:1-Math.pow(2,-10*t)},iexp:function(t){return t<=0?0:Math.pow(2,10*t-10)}};
function mat(){return new Float32Array(16)}
function mmul(a,b,o){for(var c=0;c<4;c++)for(var r=0;r<4;r++){var s=0;for(var k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s}return o}
function mid(o){o.fill(0);o[0]=o[5]=o[10]=o[15]=1;return o}
function mrx(a,o){var c=Math.cos(a),s=Math.sin(a);mid(o);o[5]=c;o[6]=s;o[9]=-s;o[10]=c;return o}
function mry(a,o){var c=Math.cos(a),s=Math.sin(a);mid(o);o[0]=c;o[2]=-s;o[8]=s;o[10]=c;return o}
function mtr(x,y,z,o){mid(o);o[12]=x;o[13]=y;o[14]=z;return o}
function mpersp(fy,asp,n,f,sx,sy,o){var t=1/Math.tan(fy/2);o.fill(0);o[0]=t/asp;o[5]=t;o[8]=-sx;o[9]=-sy;o[10]=(f+n)/(n-f);o[11]=-1;o[14]=2*f*n/(n-f);return o}
function rng(seed){var s=seed>>>0;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}}

/* ---------- shaders ---------- */
var HP='#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
var HASH='float h21(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}\n'+
'vec2 h22(vec2 p){vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));p3+=dot(p3,p3.yzx+33.33);return fract((p3.xx+p3.yz)*p3.zy);}\n';
var TONE='vec3 tone(vec3 x){x=max(x,0.);vec3 hi=.62+.38*(1.-exp(-(x-.62)/.38));return mix(x,hi,step(.62,x));}\n';

var VS_FS='attribute vec2 aP;void main(){gl_Position=vec4(aP,0.,1.);}';

var FS_BG=HP+HASH+
'uniform vec2 uRes,uSun;uniform float uT,uSunI,uSunVis,uWarp,uRing,uBand,uPlA;uniform vec3 uPl;uniform sampler2D uNoise;\n'+
'vec3 star(vec2 p,float sc,float thr,float sz,float sp){vec2 q=p*sc,g=floor(q),f=fract(q)-.5;float h=h21(g);if(h<thr)return vec3(0.);\n'+
' vec2 o=(h22(g+7.)-.5)*.6,d=f-o;float r=length(d);float b=smoothstep(sz,0.,r);b*=b;float tw=.78+.22*sin(uT*(1.3+h*2.)+h*40.);\n'+
' float br=(.3+.7*h21(g+13.))*tw;float spk=sp>0.?(exp(-abs(d.x)*70.)*exp(-abs(d.y)*2.6)+exp(-abs(d.y)*70.)*exp(-abs(d.x)*2.6))*.22*sp:0.;\n'+
' vec3 tint=mix(vec3(.72,.82,1.),vec3(1.,.78,.68),h21(g+3.));return tint*(b+spk)*br;}\n'+
TONE+
'void main(){vec2 p=(gl_FragCoord.xy-.5*uRes)/(.5*uRes.y);vec3 col=vec3(0.);\n'+
' col+=vec3(.0042,.0018,.0062)*(1.15-.4*length(p));\n'+
' float n1=texture2D(uNoise,p*.26+vec2(.31,.17)+vec2(uT*.0012,0.)).r;float n2=texture2D(uNoise,p*.7+vec2(.7,.2)-vec2(uT*.002,0.)).g;\n'+
' col+=vec3(.26,.025,.06)*pow(clamp(n1*n2*2.3-.42,0.,1.),1.6)*.085;\n'+
' vec3 st=star(p,96.,.962,.075,0.)*.62+star(p,43.,.972,.062,0.)*.85+star(p,17.,.986,.08,1.)*1.45;col+=st*(1.-.55*uWarp);\n'+
' vec2 s=p-uSun;float r=length(s);float ang=atan(s.y,s.x);\n'+
' float ray=texture2D(uNoise,vec2(ang*.95+.25,r*.10+uT*.003)).b;float ray2=texture2D(uNoise,vec2(ang*2.4,r*.05-uT*.002)).a;\n'+
' float core=exp(-r*r*2600.)*4.+exp(-r*30.)*.7;float halo=1./(1.+pow(r*4.3,2.));float wsp=texture2D(uNoise,s*.55+vec2(.13,.71)+vec2(uT*.002,0.)).r;float veil=halo*(.52+.34*ray*(.5+ray2)+.5*wsp*wsp);\n'+
' vec3 sc=vec3(1.,.84,.78)*core+vec3(1.,.40,.22)*veil*.78*halo+vec3(1.,.22,.17)*veil*.62+vec3(.66,.04,.11)*pow(halo,.7)*.30;\n'+
' float stk=exp(-abs(s.y)*340.)*exp(-abs(s.x)*1.7)*.55+exp(-abs(s.y)*70.)*exp(-abs(s.x)*3.2)*.10;sc+=vec3(1.,.40,.38)*stk*uSunVis;\n'+
' col+=sc*uSunI;\n'+
' vec2 q=p-uPl.xy;float ca=cos(uRing),sa=sin(uRing);q=vec2(ca*q.x+sa*q.y,-sa*q.x+ca*q.y);\n'+
' float xs=smoothstep(uPl.z*.8,uPl.z*1.5,q.x);float wy=.014+.06*max(q.x-uPl.z,0.);float band=exp(-q.y*q.y/(wy*wy))*xs;\n'+
' float fib=texture2D(uNoise,vec2(q.x*.8+uT*.004,q.y*16.)).g;float cl=texture2D(uNoise,vec2(q.x*.5,q.y*2.6)+vec2(.4,.1)).r;\n'+
' float lit=.16+halo*2.2;col+=vec3(.62,.14,.10)*band*(.25+.95*fib)*(.35+cl)*lit*uBand*1.5;\n'+
' float wide=exp(-q.y*q.y/(.09+.12*max(q.x,0.)))*smoothstep(0.,uPl.z*2.,q.x)*cl;col+=vec3(.40,.07,.07)*wide*halo*.55*uBand;\n'+
' col=tone(col);float ig=fract(52.9829189*fract(dot(gl_FragCoord.xy+fract(uT*7.)*13.,vec2(.06711056,.00583715))));col+=(ig-.5)/255.;gl_FragColor=vec4(col,1.);}';

var VS_PL='attribute vec3 aPos;attribute vec2 aUV;uniform mat4 uMVP,uM;varying vec3 vWN,vWP,vON;varying vec2 vUV;\n'+
'void main(){vON=aPos;vWN=(uM*vec4(aPos,0.)).xyz;vWP=(uM*vec4(aPos,1.)).xyz;vUV=aUV;gl_Position=uMVP*vec4(aPos,1.);}';

var FS_PL=HP+HASH+
'varying vec3 vWN,vWP,vON;varying vec2 vUV;uniform sampler2D uLights,uPack,uNoise;uniform vec3 uCam,uSun;\n'+
'uniform float uT,uVein,uCloud,uGr,uRpp,uLod,uSunI,uHP,uHaze;uniform vec4 uPing[6],uPingK[6];\n'+
TONE+
'vec2 vein(vec2 p,vec2 nn,float w){vec2 g=floor(p),f=fract(p);float d1=8.,d2=8.;\n'+
' for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 o=vec2(float(i),float(j));vec2 gg=vec2(mod(g.x+o.x,nn.x),g.y+o.y);vec2 r=h22(gg);vec2 dv=o+r-f;float d=dot(dv,dv);\n'+
'  if(d<d1){d2=d1;d1=d;}else if(d<d2){d2=d;}}\n'+
' return vec2(smoothstep(w,0.,sqrt(d2)-sqrt(d1)),smoothstep(.2,0.,sqrt(d1)));}\n'+
'void main(){vec3 N=normalize(vWN),V=normalize(uCam-vWP),L=normalize(uSun);vec3 on=normalize(vON);\n'+
' float nv=clamp(dot(N,V),0.,1.),nl=dot(N,L);vec2 uv=vUV;\n'+
' vec3 pk=texture2D(uPack,uv).rgb;float land=smoothstep(.34,.66,pk.g);\n'+
' vec2 uvc=uv+vec2(uT*.00045,0.);float cl=texture2D(uPack,uvc).r;float cn=texture2D(uNoise,uvc*vec2(9.,5.)).g;\n'+
' float cloud=smoothstep(.30,.86,cl*(.82+.36*cn))*uCloud;\n'+
' vec3 Lp=L-V*dot(L,V);float lpl=length(Lp);Lp=lpl>1e-4?Lp/lpl:vec3(0.,1.,0.);\n'+
' float rim=pow(1.-nv,3.4);float side=pow(clamp(dot(N,Lp)*.5+.5,0.,1.),4.5);float sunRim=rim*(.04+.96*side)*uSunI;\n'+
' float lite=smoothstep(-.18,.55,nl);\n'+
' vec3 ocean=vec3(.006,.014,.028),landc=vec3(.014,.020,.026)*(.6+pk.b*1.8);vec3 col=mix(ocean,landc,land);\n'+
' vec3 cloudc=vec3(.050,.062,.085)*(.55+.45*cn)*(.45+1.4*lite+2.4*side*rim);col=mix(col,cloudc,cloud*.88);float cdim=1.-.72*cloud*smoothstep(.0,.9,uLod);\n'+
' vec3 rimc=mix(vec3(.30,.38,.70),vec3(1.,.36,.22),smoothstep(-.1,.8,side));col+=rimc*sunRim*1.25+vec3(.10,.16,.34)*rim*.16;\n'+
' vec3 H=normalize(L+V);float sp=pow(max(dot(N,H),0.),70.);col+=vec3(1.,.60,.46)*sp*(1.-land)*(1.-cloud)*2.2*(.2+lite);\n'+
' float lb=max(texture2D(uLights,uv).r-.04,0.)*1.05;float lm=texture2D(uLights,uv,2.5).r;float lw=texture2D(uLights,uv,5.).r;\n'+
' float dens=smoothstep(.06,.42,lm*1.25+lw*.35);\n'+
' float vf=smoothstep(.04,.42,nv);\n'+
' if(uVein>.01&&uHP>.5){vec2 nn=vec2(190.,95.);vec2 vp=vec2(uv.x*nn.x,uv.y*nn.y);vp+=(texture2D(uNoise,vp*.06).rg-.5)*1.7;\n'+
'  vec2 ve=vein(vp,nn,.13);float e=ve.x,nd=ve.y;float e2=0.,nd2=0.;if(uLod>.02){vec2 v2=vein(vp*3.3+vec2(5.1,2.7),nn*3.3,.14);e2=v2.x*uLod;nd2=v2.y*uLod;}\n'+
'  float pulse=.78+.22*sin(uT*.8+texture2D(uNoise,vp*.11).a*14.);\n'+
'  float ck=(e*dens*2.6+e2*dens*2.0+(nd*.9+nd2*1.1)*dens*dens*3.)*pulse*uVein;\n'+
'  vec3 lava=mix(vec3(.50,.015,.05),vec3(1.,.26,.09),smoothstep(.15,.8,ck));lava=mix(lava,vec3(1.,.78,.62),smoothstep(.9,1.7,ck));\n'+
'  col+=lava*ck*1.45*cdim*vf;col+=vec3(.55,.10,.09)*cloud*smoothstep(.0,.9,uLod)*dens*.45*vf;}\n'+
' float tr=(1.-.75*smoothstep(.2,.9,uLod))*cdim;col+=(vec3(1.,.66,.46)*pow(lb,1.2)*1.25*tr*uVein+vec3(.9,.16,.11)*lm*.40*uVein+vec3(.5,.05,.08)*lw*.16*uVein)*mix(1.,vf,.8*smoothstep(.1,.6,uLod));\n'+
' if(uHaze>.001){float hz=pow(1.-nv,2.6);col+=(mix(vec3(.10,.026,.045),vec3(.46,.15,.14),side)*hz*(.45+.9*lite)+vec3(1.,.36,.2)*hz*(lw*1.5+lm*.7)*.5)*uHaze;}\n'+
' if(uGr>.001){vec2 g=uv*vec2(24.,12.);vec2 fg=abs(fract(g-.5)-.5);float w=uRpp*1.4/max(nv,.2);float gl=(smoothstep(w,0.,fg.x/24.*6.2832)*(.35+.65*smoothstep(0.,.5,1.-abs(on.y)))+smoothstep(w,0.,fg.y/12.*3.1416))*.5;col+=vec3(1.,.16,.26)*gl*uGr*.24*nv*(1.-.6*cloud);}\n'+
' for(int i=0;i<6;i++){vec4 pg=uPing[i];if(pg.w>=0.){float dd=acos(clamp(dot(on,pg.xyz),-1.,1.));float age=pg.w;float rr=0.;\n'+
'  for(int k=0;k<3;k++){float a2=age-float(k)*.6;if(a2>0.){float R=a2*.13;float wd=.0055+.0035*a2;float x=(dd-R)/wd;rr+=exp(-x*x)*exp(-a2*.7);}}\n'+
'  float dt=exp(-dd*dd/.00005)*(.6+.4*sin(age*9.));float ha=exp(-dd*dd/.004)*exp(-age*.55);\n'+
'  col+=uPingK[i].rgb*(rr*1.5+dt*2.8+ha*.55)*uPingK[i].a;}}\n'+
' col=tone(col);gl_FragColor=vec4(col,1.);}';

var VS_AT='attribute vec2 aP;uniform vec4 uBox;varying vec2 vP;void main(){vP=mix(uBox.xy,uBox.zw,aP);gl_Position=vec4(vP,0.,1.);}';
var FS_AT=HP+HASH+
'varying vec2 vP;uniform vec3 uCam,uSun,uRt,uUp,uFw;uniform vec2 uTan,uSh;uniform float uSunI,uAtm,uT;\n'+
TONE+
'void main(){vec2 n=vP;vec3 rd=normalize(uRt*((n.x-uSh.x)*uTan.x)+uUp*((n.y-uSh.y)*uTan.y)+uFw);vec3 ro=uCam;\n'+
' float tca=dot(-ro,rd);float b2=dot(ro,ro)-tca*tca;float b=sqrt(max(b2,0.));vec3 pc=normalize(ro+rd*max(tca,0.));vec3 L=normalize(uSun);\n'+
' float g=b>=1.?exp(-(b-1.)/.022):exp((b-1.)/.028);\n'+
' float sf=dot(pc,L);float lit=smoothstep(-.55,.8,sf);float mu=dot(rd,L);float ph=.4224/pow(1.5776-1.52*mu,1.5);\n'+
' float thin=b>=1.?exp(-(b-1.)/.0085):exp((b-1.)/.012);\n'+
' vec3 cwarm=mix(vec3(1.,.30,.18),vec3(1.,.74,.60),clamp(thin,0.,1.));vec3 ccool=vec3(.20,.30,.66);\n'+
' vec3 col=cwarm*g*lit*ph*.068*uSunI+cwarm*thin*pow(lit,2.)*ph*.12*uSunI+ccool*g*.040;\n'+
' col*=uAtm;col=tone(col);gl_FragColor=vec4(col,1.);}';

var VS_RK='attribute vec3 aPos,aNrm;attribute vec4 aA,aB,aC;uniform mat4 uVP;uniform mat3 uRg;uniform vec3 uCam;uniform float uT,uSpd,uK,uNear;varying vec3 vN,vP,vO;varying float vS;\n'+
'mat3 rot(vec3 u,float a){float c=cos(a),s=sin(a),t=1.-c;return mat3(t*u.x*u.x+c,t*u.x*u.y+s*u.z,t*u.x*u.z-s*u.y, t*u.x*u.y-s*u.z,t*u.y*u.y+c,t*u.y*u.z+s*u.x, t*u.x*u.z+s*u.y,t*u.y*u.z-s*u.x,t*u.z*u.z+c);}\n'+
'void main(){float r=aA.x,h=aA.z,sz=aA.w*uK;float a=aA.y+.045*pow(r,-1.5)*uSpd*uT;vec3 loc=vec3(cos(a)*r,h,sin(a)*r);vec3 ce=uRg*loc;sz*=smoothstep(uNear*.35,uNear,length(ce-uCam));\n'+
' mat3 R=rot(normalize(aB.xyz),aB.w*uT+aC.w*6.2831);vec3 wp=ce+R*(aPos*aC.xyz*sz);vN=normalize(R*(aNrm/aC.xyz));vP=wp;vO=aPos*aC.xyz*7.+aC.w*40.;vS=aC.w;gl_Position=uVP*vec4(wp,1.);}';
var FS_RK=HP+
'varying vec3 vN,vP,vO;varying float vS;uniform vec3 uCam,uSun;uniform float uSunI;uniform sampler2D uNoise;\n'+
TONE+
'void main(){vec3 N=normalize(vN);vec3 bump=vec3(texture2D(uNoise,vO.xy*.07).r,texture2D(uNoise,vO.yz*.07).g,texture2D(uNoise,vO.zx*.07).r)-.5;N=normalize(N+bump*.55);vec3 V=normalize(uCam-vP),L=normalize(uSun);float nv=clamp(dot(N,V),0.,1.),nl=dot(N,L);\n'+
' float rim=pow(1.-nv,1.55);float side=smoothstep(-.2,.85,nl);\n'+
' float sh=(dot(vP,L)<0.&&length(vP-L*dot(vP,L))<1.03)?.06:1.;\n'+
' vec3 alb=vec3(.085,.062,.058)*(.7+.6*fract(vS*7.13));float hl=nl*.5+.5;vec3 col=alb*(.30+.9*max(nl,0.)*sh)+vec3(1.,.50,.36)*alb*2.2*pow(hl,2.6)*sh*uSunI;\n'+
' col+=vec3(1.,.42,.28)*rim*pow(hl,1.8)*1.05*uSunI*sh+vec3(.10,.14,.24)*rim*.07;\n'+
' gl_FragColor=vec4(tone(col),1.);}';

var VS_WP='attribute vec2 aQ;attribute vec4 aS;uniform float uT,uWarp,uAsp,uPx;uniform vec2 uVP;varying float vA,vU,vV;varying vec3 vC;\n'+
'void main(){float spd=.07+uWarp*2.3;float ph=fract(aS.y+uT*spd*(.35+.65*aS.z));float r0=.025+pow(ph,2.2)*2.3;\n'+
' float len=(.004+uWarp*.7*aS.z)*(.25+r0*1.5);float u=aQ.x*.5+.5;float r=max(r0-len*(1.-u),0.);\n'+
' vec2 dir=vec2(cos(aS.x),sin(aS.x)),nrm=vec2(-dir.y,dir.x);vec2 pos=dir*r;float w=(.9+r0*1.5+uWarp*.8)*uPx*(.55+.45*aS.w);pos+=nrm*aQ.y*w;vV=aQ.y;\n'+
' gl_Position=vec4(pos.x/uAsp+uVP.x,pos.y+uVP.y,0.,1.);vA=smoothstep(0.,.12,ph)*smoothstep(1.,.82,ph)*aS.w*(.04+uWarp*.96);\n'+
' vC=mix(vec3(.86,.92,1.),vec3(1.,.50,.60),fract(aS.x*7.3)*.8);vU=u;}';
var FS_WP=HP+'varying float vA,vU,vV;varying vec3 vC;void main(){float a=vA*pow(vU,2.2)*exp(-vV*vV*3.2);vec3 c=mix(vC,vec3(1.),pow(vU,6.)*.8);gl_FragColor=vec4(c*a*1.15,a);}';

var FS_FX=HP+HASH+
'uniform vec2 uRes,uVP;uniform float uFlash,uWarp,uFade,uEntry,uT;\n'+
'void main(){vec2 p=(gl_FragCoord.xy-.5*uRes)/(.5*uRes.y);vec2 q=p-uVP*vec2(uRes.x/uRes.y,1.);float r=length(q);vec3 add=vec3(0.);\n'+
' add+=vec3(1.,.5,.58)*exp(-r*r*2.4)*uWarp*.5+vec3(1.,.9,.92)*exp(-r*r*34.)*uWarp*.75;\n'+
' float e=smoothstep(.35,1.6,r);add+=vec3(1.,.40,.22)*e*e*uEntry*.7;\n'+
' add+=vec3(1.,.80,.84)*uFlash;\n'+
' add+=(h21(gl_FragCoord.xy+fract(uT)*37.)-.5)*.012*uWarp;\n'+
' gl_FragColor=vec4(add,1.-uFade);}';

/* ---------- GL helpers ---------- */
function compile(gl,type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){var e=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error('shader: '+e)}return s}
function program(name,vs,fs,attrs){var gl=S.gl,p=gl.createProgram();gl.attachShader(p,compile(gl,gl.VERTEX_SHADER,vs));gl.attachShader(p,compile(gl,gl.FRAGMENT_SHADER,fs));
 attrs.forEach(function(a,i){gl.bindAttribLocation(p,i,a)});gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('link '+name+': '+gl.getProgramInfoLog(p));
 var o={p:p,u:{},name:name};o.l=function(n){var v=o.u[n];if(v===undefined)v=o.u[n]=gl.getUniformLocation(p,n);return v};S.P[name]=o;return o}
function buf(data,type){var gl=S.gl,b=gl.createBuffer();gl.bindBuffer(type||gl.ARRAY_BUFFER,b);gl.bufferData(type||gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);return b}
function attrib(i,n,stride,off,div){var gl=S.gl;gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,n,gl.FLOAT,false,stride,off);divisor(i,div||0)}
function divisor(i,d){if(S.gl2)S.gl.vertexAttribDivisor(i,d);else if(S.inst)S.inst.vertexAttribDivisorANGLE(i,d)}
function drawInst(mode,first,count,n){if(S.gl2)S.gl.drawArraysInstanced(mode,first,count,n);else S.inst.drawArraysInstancedANGLE(mode,first,count,n)}
function attribsOff(n){var gl=S.gl;for(var i=0;i<n;i++){gl.disableVertexAttribArray(i);divisor(i,0)}}

function makeNoise(){var n=256,d=new Uint8Array(n*n*4);
 function chan(seed,oct,gain,ridge){var r=rng(seed),out=new Float32Array(n*n),amp=1,sum=0;
  for(var o=0;o<oct;o++){var f=4<<o,g=new Float32Array(f*f);for(var i=0;i<g.length;i++)g[i]=r();
   for(var y=0;y<n;y++){var fy=y/n*f,iy=Math.floor(fy),ty=fy-iy,sy=ty*ty*(3-2*ty),y0=iy%f,y1=(iy+1)%f;
    for(var x=0;x<n;x++){var fx=x/n*f,ix=Math.floor(fx),tx=fx-ix,sx=tx*tx*(3-2*tx),x0=ix%f,x1=(ix+1)%f;
     var v=(g[y0*f+x0]*(1-sx)+g[y0*f+x1]*sx)*(1-sy)+(g[y1*f+x0]*(1-sx)+g[y1*f+x1]*sx)*sy;out[y*n+x]+=v*amp}}
   sum+=amp;amp*=gain}
  var mn=1e9,mx=-1e9;for(i=0;i<out.length;i++){out[i]/=sum;if(ridge)out[i]=1-Math.abs(out[i]*2-1);if(out[i]<mn)mn=out[i];if(out[i]>mx)mx=out[i]}
  for(i=0;i<out.length;i++)out[i]=(out[i]-mn)/(mx-mn);return out}
 var a=chan(11,5,.5),b=chan(23,5,.55),c=chan(37,4,.5,1),e=chan(51,4,.6);
 for(var i=0;i<n*n;i++){d[i*4]=a[i]*255;d[i*4+1]=b[i]*255;d[i*4+2]=c[i]*255;d[i*4+3]=e[i]*255}
 return d}

function icoRock(seed){var r=rng(seed),t=(1+Math.sqrt(5))/2;
 var V=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(function(v){var l=Math.hypot(v[0],v[1],v[2]);return [v[0]/l,v[1]/l,v[2]/l]});
 var F=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
 var cache={};function mid(a,b){var k=a<b?a+'_'+b:b+'_'+a;if(cache[k]!==undefined)return cache[k];var m=[(V[a][0]+V[b][0])/2,(V[a][1]+V[b][1])/2,(V[a][2]+V[b][2])/2],l=Math.hypot(m[0],m[1],m[2]);V.push([m[0]/l,m[1]/l,m[2]/l]);return cache[k]=V.length-1}
 var G=[];F.forEach(function(f){var a=mid(f[0],f[1]),b=mid(f[1],f[2]),c=mid(f[2],f[0]);G.push([f[0],a,c],[f[1],b,a],[f[2],c,b],[a,b,c])});
 var ph=r()*10,ph2=r()*10,ph3=r()*10;
 var R=V.map(function(v){return .80+.22*Math.sin(3.1*v[0]+ph)*Math.sin(2.7*v[1]+ph2)*Math.sin(3.7*v[2]+ph3)+.16*(r()-.5)});
 var P=V.map(function(v,i){return [v[0]*R[i],v[1]*R[i],v[2]*R[i]]});
 var pos=[],nrm=[];G.forEach(function(f){var a=P[f[0]],b=P[f[1]],c=P[f[2]],ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
  var nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
  var cx=a[0]+b[0]+c[0],cy=a[1]+b[1]+c[1],cz=a[2]+b[2]+c[2];if(nx*cx+ny*cy+nz*cz<0){nx=-nx;ny=-ny;nz=-nz;var t2=b;b=c;c=t2}
  [a,b,c].forEach(function(p){pos.push(p[0],p[1],p[2]);nrm.push(nx,ny,nz)})});
 return {pos:new Float32Array(pos),nrm:new Float32Array(nrm),n:pos.length/3}}

/* ---------- scene params (all animated) ---------- */
var C={d:11,fov:34,shX:-.46,shY:-.1,pitch:0,tilt:.42,lon:.9,spin:.03,sunR:.93,sunA:.52,sunAbs:0,haze:0,sunI:1,sunVis:.35,warp:0,flash:0,fade:1,entry:0,
 ring:1,ringSpd:1,ringRoll:-.06,ringInc:.16,ringK:1,veinK:1,cloudK:1,gridK:.6,band:1,atm:1,vpx:0,vpy:0,shake:0,lod:0,pl:1,par:1};
function apply(o){for(var k in o)if(k in C)C[k]=o[k]}

/* ---------- init ---------- */
function initGL(cv,opt){
 S.cv=cv;opt=opt||{};S.aa=opt.aa!==false?1:0;
 var at={alpha:false,antialias:!!S.aa,depth:true,stencil:false,powerPreference:'low-power',preserveDrawingBuffer:!!opt.keep,failIfMajorPerformanceCaveat:false,desynchronized:false};
 var gl=null;try{gl=cv.getContext('webgl2',at)}catch(e){}
 S.gl2=!!gl;if(!gl){try{gl=cv.getContext('webgl',at)||cv.getContext('experimental-webgl',at)}catch(e){}}
 if(!gl)return false;S.gl=gl;S.api=S.gl2?'WebGL 2':'WebGL 1';
 if(!S.gl2){S.inst=gl.getExtension('ANGLE_instanced_arrays');if(!S.inst)return false}
 try{var dbg=gl.getExtension('WEBGL_debug_renderer_info');S.gpu=dbg?String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)||''):''}catch(e){S.gpu=''}
 var pf=gl.getShaderPrecisionFormat&&gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT);S.hp=pf&&pf.precision>0?1:0;
 S.aniso=gl.getExtension('EXT_texture_filter_anisotropic');
 program('bg',VS_FS,FS_BG,['aP']);program('pl',VS_PL,FS_PL,['aPos','aUV']);program('at',VS_AT,FS_AT,['aP']);
 program('rk',VS_RK,FS_RK,['aPos','aNrm','aA','aB','aC']);program('wp',VS_WP,FS_WP,['aQ','aS']);program('fx',VS_FS,FS_FX,['aP']);
 /* geometry */
 S.tri=buf(new Float32Array([-1,-1,3,-1,-1,3]));S.quad=buf(new Float32Array([0,0,1,0,0,1,1,1]));
 var LS=Math.round(opt.seg||128),LT=LS/2,vs=[],ix=[];
 for(var j=0;j<=LT;j++){var v=j/LT,la=PI/2-v*PI,cl=Math.cos(la),sl=Math.sin(la);
  for(var i=0;i<=LS;i++){var u=i/LS,lo=(u-.5)*TAU;vs.push(cl*Math.sin(lo),sl,cl*Math.cos(lo),u,v)}}
 for(j=0;j<LT;j++)for(i=0;i<LS;i++){var a=j*(LS+1)+i,b=a+LS+1;ix.push(a,b,a+1,a+1,b,b+1)}
 S.sph=buf(new Float32Array(vs));S.sphI=buf(new Uint16Array(ix),gl.ELEMENT_ARRAY_BUFFER);S.sphN=ix.length;
 /* rocks */
 S.rockN=opt.rocks||420;var r=rng(90210),NR=3;S.rm=[];
 var inst=[[],[],[]];
 for(i=0;i<S.rockN;i++){
  var rr=1.62+Math.pow(r(),1.55)*5.6,ph=r()*TAU,hh=(r()+r()+r()-1.5)*(.05+.075*rr),sz=.008+.060*Math.pow(r(),4.0)+(r()<.02?.10+.10*r():0);
  var ax=r()-.5,ay=r()-.5,az=r()-.5,al=Math.hypot(ax,ay,az)||1,sp=(r()-.5)*.5,s1=.65+r()*.7,s2=.55+r()*.7,s3=.7+r()*.6;
  inst[i%NR].push(rr,ph,hh,sz,ax/al,ay/al,az/al,sp,s1,s2,s3,r());}
 for(i=0;i<NR;i++){var m=icoRock(777+i*131),inter=new Float32Array(m.n*6);for(var k=0;k<m.n;k++){inter.set([m.pos[k*3],m.pos[k*3+1],m.pos[k*3+2],m.nrm[k*3],m.nrm[k*3+1],m.nrm[k*3+2]],k*6)}
  S.rm.push({vb:buf(inter),ib:buf(new Float32Array(inst[i])),n:m.n,c:inst[i].length/12})}
 /* warp streaks */
 S.warpN=opt.streaks||1100;var wq=new Float32Array([-1,-1,1,-1,-1,1,1,1]),wr=rng(4242),wi=new Float32Array(S.warpN*4);
 for(i=0;i<S.warpN;i++){wi[i*4]=wr()*TAU;wi[i*4+1]=wr();wi[i*4+2]=.25+.75*wr();wi[i*4+3]=.35+.65*wr()}
 S.wq=buf(wq);S.wi=buf(wi);
 /* textures */
 var nz=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,nz);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,256,256,0,gl.RGBA,gl.UNSIGNED_BYTE,makeNoise());gl.generateMipmap(gl.TEXTURE_2D);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);S.nz=nz;
 gl.pixelStorei(gl.UNPACK_ALIGNMENT,4);
 cv.addEventListener('webglcontextlost',function(e){e.preventDefault();if(S.cv!==cv||!S.ok)return;S.lost=1;cancelFrame();emit('lost')},false);
 cv.addEventListener('webglcontextrestored',function(){if(S.cv!==cv||!S.ok)return;S.lost=0;emit('restored')},false);
 S.lost=0;
 S.ok=1;return true}

function loadImg(src,cb){var im=new Image();im.onload=function(){cb(im)};im.onerror=function(){cb(null)};im.src=src}
function upTex(im,key){var gl=S.gl;if(!gl||!im)return;var t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.generateMipmap(gl.TEXTURE_2D);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 if(S.aniso){gl.texParameterf(gl.TEXTURE_2D,S.aniso.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(4,gl.getParameter(S.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)))}
 if(S.tex[key])gl.deleteTexture(S.tex[key]);S.tex[key]=t}
function loadTextures(src,done){var n=0,want=2;function one(k,u){loadImg(u,function(im){if(im)upTex(im,k);else S.err='texture '+k;n++;if(n>=want){S.ready=!!(S.tex.lights&&S.tex.pack);emit('tex');if(done)done(S.ready)}})}
 one('lights',src.lights);one('pack',src.pack)}

/* ---------- sizing ---------- */
function resize(force){var cv=S.cv;if(!cv||!S.gl)return;var cw=Math.max(2,cv.clientWidth||innerWidth),ch=Math.max(2,cv.clientHeight||innerHeight);
 var dpr=Math.min(window.devicePixelRatio||1,S.q==='low'?1:1.5);var k=dpr*S.scale;var w=Math.round(cw*k),h=Math.round(ch*k);
 if(w*h>S.pix){var f=Math.sqrt(S.pix/(w*h));w=Math.round(w*f);h=Math.round(h*f)}
 w=Math.max(2,w);h=Math.max(2,h);S.cssW=cw;S.cssH=ch;S.asp=cw/ch;
 if(!force&&w===S.w&&h===S.h)return;S.w=w;S.h=h;cv.width=w;cv.height=h}

/* ---------- state helpers ---------- */
function rho2d(rho,fov){var ta=rho*Math.tan(fov*D2R/2);return 1/Math.sin(Math.atan(ta))}
function layout(kind,asp){
 asp=asp||S.asp||1.78;var L={};
 if(kind==='idle'){var rho=Math.min(.86,.78*asp);L.fov=34;L.d=rho2d(rho,34);
  if(asp>=1){L.shX=-mix(.40,.60,clamp((asp-1.1)/.6,0,1));L.shY=-.13}else{L.shX=0;L.shY=.22}
  L.sunR=.985;L.sunA=.5;}
 else if(kind==='map'){var rm=Math.min(.62,.5*asp);L.fov=30;L.d=rho2d(rm,30);L.shX=0;L.shY=asp>=1?.02:.18;L.sunR=.95;L.sunA=PI+.12;}
 else if(kind==='land'){L.fov=54;L.d=1.24;L.shX=0;L.shY=0;L.pitch=.2;L.sunR=1.0;L.sunA=PI*.5;}
 return L}

/* ---------- tween / timeline ---------- */
function tween(to,ms,ease,delay,done){var from={};for(var k in to)from[k]=C[k];var t0=S.t+(delay||0)/1000;var o={from:from,to:to,t0:t0,t1:t0+Math.max(ms,1)/1000,e:ease||EASE.io3,done:done||null};S.tw.push(o);return o}
function at(ms,fn){S.tl.push({t:S.t+ms/1000,fn:fn})}
function stepAnim(){var t=S.t,i;
 for(i=S.tw.length-1;i>=0;i--){var w=S.tw[i];if(t<w.t0)continue;var p=clamp((t-w.t0)/(w.t1-w.t0),0,1),e=w.e(p);
  for(var k in w.to)C[k]=w.from[k]+(w.to[k]-w.from[k])*e;
  if(p>=1){S.tw.splice(i,1);if(w.done)w.done()}}
 for(i=S.tl.length-1;i>=0;i--){if(t>=S.tl[i].t){var f=S.tl[i].fn;S.tl.splice(i,1);try{f()}catch(e){}}}}
function cancelAnim(keys){if(!keys){S.tw.length=0;S.tl.length=0;return}S.tw=S.tw.filter(function(w){for(var k in w.to)if(keys.indexOf(k)>=0)return false;return true})}
function shortLon(from,to){var d=((to-from)%TAU+TAU+PI)%TAU-PI;return from+d}

/* ---------- projection for DOM overlays ---------- */
var VP=mat(),Vm=mat(),Pm=mat(),Mm=mat(),MVP=mat(),T1=mat(),T2=mat(),T3=mat(),Rg=new Float32Array(9);
var cam={pos:[0,0,3],rt:[1,0,0],up:[0,1,0],fw:[0,0,-1],sun:[0,0,-1],tx:1,ty:1};
function buildCam(){
 var asp=S.asp,fov=C.fov*D2R,sx=C.shX+(C.par?S.mx*.012:0),sy=C.shY+(C.par?-S.my*.008:0);
 var sh=C.shake;if(sh>0){sx+=(Math.sin(S.t*61)+Math.sin(S.t*37.7))*.5*sh*.012;sy+=(Math.sin(S.t*53)+Math.sin(S.t*29.3))*.5*sh*.012}
 mpersp(fov,asp,.01,80,sx,sy,Pm);
 mrx(-C.pitch,T1);mtr(0,0,-C.d,T2);mmul(T1,T2,Vm);
 mmul(Pm,Vm,VP);
 var lon=C.lon+(C.par?S.mx*.05:0),tilt=C.tilt+(C.par?S.my*.03:0);
 mry(-lon,T1);mrx(tilt,T2);mmul(T2,T1,Mm);mmul(VP,Mm,MVP);
 var cp=Math.cos(C.pitch),sp=Math.sin(C.pitch);
 cam.pos[0]=0;cam.pos[1]=0;cam.pos[2]=C.d;cam.rt[0]=1;cam.rt[1]=0;cam.rt[2]=0;cam.up[0]=0;cam.up[1]=cp;cam.up[2]=sp;cam.fw[0]=0;cam.fw[1]=sp;cam.fw[2]=-cp;
 cam.tx=Math.tan(fov/2)*asp;cam.ty=Math.tan(fov/2);cam.sx=sx;cam.sy=sy;
 var alpha=Math.asin(clamp(1/C.d,0,1)),th=C.sunAbs>0?C.sunAbs:C.sunR*alpha,ca=Math.cos(th),sa=Math.sin(th),cx=Math.cos(C.sunA),cy=Math.sin(C.sunA);
 var lx=sa*cx,ly=sa*cy;
 cam.sun[0]=cam.rt[0]*lx+cam.up[0]*ly+cam.fw[0]*ca;cam.sun[1]=cam.rt[1]*lx+cam.up[1]*ly+cam.fw[1]*ca;cam.sun[2]=cam.rt[2]*lx+cam.up[2]*ly+cam.fw[2]*ca;
 cam.alpha=alpha}
function projectPt(x,y,z,o){var m=VP,cx=m[0]*x+m[4]*y+m[8]*z+m[12],cy=m[1]*x+m[5]*y+m[9]*z+m[13],cw=m[3]*x+m[7]*y+m[11]*z+m[15];
 o.w=cw;if(cw<=1e-4){o.x=o.y=-9999;o.ok=0;return o}o.nx=cx/cw;o.ny=cy/cw;o.x=(o.nx*.5+.5)*S.cssW;o.y=(1-(o.ny*.5+.5))*S.cssH;o.ok=1;return o}
function surf(lat,lon,o){var la=lat*D2R,lo=lon*D2R,cl=Math.cos(la),x=cl*Math.sin(lo),y=Math.sin(la),z=cl*Math.cos(lo);
 var m=Mm;o[0]=m[0]*x+m[4]*y+m[8]*z;o[1]=m[1]*x+m[5]*y+m[9]*z;o[2]=m[2]*x+m[6]*y+m[10]*z;return o}
var _pp={},_sv=[0,0,0];
function project(lat,lon){surf(lat,lon,_sv);var p=projectPt(_sv[0],_sv[1],_sv[2],{});
 var vx=cam.pos[0]-_sv[0],vy=cam.pos[1]-_sv[1],vz=cam.pos[2]-_sv[2];var f=_sv[0]*vx+_sv[1]*vy+_sv[2]*vz;
 p.front=f>0?1:0;p.facing=f/Math.max(1e-6,Math.hypot(vx,vy,vz));p.vis=(p.ok&&p.front&&p.nx>-1.05&&p.nx<1.05&&p.ny>-1.05&&p.ny<1.05)?1:0;return p}

/* ---------- pings ---------- */
function ping(lat,lon,o){o=o||{};var la=lat*D2R,lo=lon*D2R,cl=Math.cos(la);var p={lat:lat,lon:lon,dir:[cl*Math.sin(lo),Math.sin(la),cl*Math.cos(lo)],t0:S.t,life:o.life||5.5,col:o.col||[1,.12,.28],k:o.k==null?1:o.k,id:o.id||0};
 if(S.pings.length>=6)S.pings.shift();S.pings.push(p);return p}

/* ---------- render ---------- */
var PG=new Float32Array(24),PK=new Float32Array(24);
function bindTex(unit,t){var gl=S.gl;gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t)}
function render(){
 var gl=S.gl;if(!gl||S.lost)return;resize();
 buildCam();
 var W=S.w,H=S.h,asp=S.asp,t=S.t;
 gl.viewport(0,0,W,H);gl.disable(gl.BLEND);gl.depthMask(true);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 /* planet screen footprint */
 var ctr=projectPt(0,0,0,{}),alpha=cam.alpha,ta=Math.tan(alpha),rN=ta/cam.ty;var plx=ctr.nx*asp,ply=ctr.ny;
 /* sun on screen */
 var L=cam.sun,sxv=L[0]*cam.rt[0]+L[1]*cam.rt[1]+L[2]*cam.rt[2],syv=L[0]*cam.up[0]+L[1]*cam.up[1]+L[2]*cam.up[2],szv=L[0]*cam.fw[0]+L[1]*cam.fw[1]+L[2]*cam.fw[2];
 var sunx=-9,suny=-9,sunI=0;if(szv>.02){sunx=(sxv/szv/cam.tx+cam.sx)*asp;suny=syv/szv/cam.ty+cam.sy;sunI=C.sunI*sstep(.02,.25,szv)}
 var sdx=sunx-plx,sdy=suny-ply,sdist=Math.hypot(sdx,sdy)/Math.max(rN,1e-3);var vis=sstep(.8,1.25,sdist);
 /* 1 space */
 gl.disable(gl.DEPTH_TEST);var p=S.P.bg;gl.useProgram(p.p);gl.bindBuffer(gl.ARRAY_BUFFER,S.tri);attribsOff(8);attrib(0,2,0,0);
 bindTex(0,S.nz);gl.uniform1i(p.l('uNoise'),0);gl.uniform2f(p.l('uRes'),W,H);gl.uniform1f(p.l('uT'),t);gl.uniform2f(p.l('uSun'),sunx,suny);
 gl.uniform1f(p.l('uSunI'),sunI);gl.uniform1f(p.l('uSunVis'),clamp(C.sunVis+vis*.65,0,1));gl.uniform1f(p.l('uWarp'),C.warp);
 gl.uniform3f(p.l('uPl'),plx,ply,rN);gl.uniform1f(p.l('uRing'),C.ringRoll);gl.uniform1f(p.l('uBand'),C.band*C.ringK*sstep(1.2,3.2,C.d));gl.uniform1f(p.l('uPlA'),C.pl);
 gl.drawArrays(gl.TRIANGLES,0,3);
 /* 2 planet */
 if(S.ready&&C.pl>0){gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
  p=S.P.pl;gl.useProgram(p.p);gl.bindBuffer(gl.ARRAY_BUFFER,S.sph);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,S.sphI);attribsOff(8);attrib(0,3,20,0);attrib(1,2,20,12);
  bindTex(0,S.tex.lights);bindTex(1,S.tex.pack);bindTex(2,S.nz);gl.uniform1i(p.l('uLights'),0);gl.uniform1i(p.l('uPack'),1);gl.uniform1i(p.l('uNoise'),2);
  gl.uniformMatrix4fv(p.l('uMVP'),false,MVP);gl.uniformMatrix4fv(p.l('uM'),false,Mm);gl.uniform3f(p.l('uCam'),cam.pos[0],cam.pos[1],cam.pos[2]);gl.uniform3f(p.l('uSun'),L[0],L[1],L[2]);
  gl.uniform1f(p.l('uT'),t);gl.uniform1f(p.l('uVein'),C.veinK*(S.q==='low'?.7:1));gl.uniform1f(p.l('uCloud'),C.cloudK);gl.uniform1f(p.l('uGr'),C.gridK);
  var rpp=2*cam.ty/H*Math.max(C.d-1,.02);gl.uniform1f(p.l('uRpp'),rpp);gl.uniform1f(p.l('uLod'),C.lod);gl.uniform1f(p.l('uSunI'),C.sunI);gl.uniform1f(p.l('uHP'),S.hp&&S.q!=='low'?1:(S.hp?1:0));gl.uniform1f(p.l('uHaze'),C.haze);
  var np=0;PG.fill(-1);PK.fill(0);
  for(var i=0;i<S.pings.length&&np<6;i++){var pg=S.pings[i],age=t-pg.t0;if(age>pg.life||age<0)continue;var fa=Math.min(1,(pg.life-age)/1.2);
   PG[np*4]=pg.dir[0];PG[np*4+1]=pg.dir[1];PG[np*4+2]=pg.dir[2];PG[np*4+3]=age;PK[np*4]=pg.col[0];PK[np*4+1]=pg.col[1];PK[np*4+2]=pg.col[2];PK[np*4+3]=pg.k*fa;np++}
  for(;np<6;np++){PG[np*4+3]=-1}
  gl.uniform4fv(p.l('uPing[0]'),PG);gl.uniform4fv(p.l('uPingK[0]'),PK);
  gl.drawElements(gl.TRIANGLES,S.sphN,gl.UNSIGNED_SHORT,0);gl.disable(gl.CULL_FACE)}
 /* 3 atmosphere */
 if(C.atm>0){gl.disable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);p=S.P['at'];gl.useProgram(p.p);gl.bindBuffer(gl.ARRAY_BUFFER,S.quad);attribsOff(8);attrib(0,2,0,0);
  var rr=Math.min(2.2,Math.max(rN*1.5,rN+.25));var bx0=ctr.nx-rr/asp,bx1=ctr.nx+rr/asp,by0=ctr.ny-rr,by1=ctr.ny+rr;
  if(C.d<2.6){bx0=-1;by0=-1;bx1=1;by1=1}else{bx0=Math.max(-1,bx0);by0=Math.max(-1,by0);bx1=Math.min(1,bx1);by1=Math.min(1,by1)}
  if(bx1>bx0&&by1>by0){gl.uniform4f(p.l('uBox'),bx0,by0,bx1,by1);gl.uniform3f(p.l('uCam'),cam.pos[0],cam.pos[1],cam.pos[2]);gl.uniform3f(p.l('uSun'),L[0],L[1],L[2]);
   gl.uniform3f(p.l('uRt'),cam.rt[0],cam.rt[1],cam.rt[2]);gl.uniform3f(p.l('uUp'),cam.up[0],cam.up[1],cam.up[2]);gl.uniform3f(p.l('uFw'),cam.fw[0],cam.fw[1],cam.fw[2]);
   gl.uniform2f(p.l('uTan'),cam.tx,cam.ty);gl.uniform2f(p.l('uSh'),cam.sx,cam.sy);gl.uniform1f(p.l('uSunI'),C.sunI);gl.uniform1f(p.l('uAtm'),C.atm*C.pl);gl.uniform1f(p.l('uT'),t);
   gl.drawArrays(gl.TRIANGLE_STRIP,0,4)}}
 /* 4 asteroid belt */
 if(C.ringK>.01){gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);p=S.P.rk;gl.useProgram(p.p);
  var cr=Math.cos(C.ringRoll),sr=Math.sin(C.ringRoll),ci=Math.cos(C.ringInc),si=Math.sin(C.ringInc);
  Rg[0]=cr;Rg[1]=sr;Rg[2]=0;Rg[3]=-sr*ci;Rg[4]=cr*ci;Rg[5]=si;Rg[6]=sr*si;Rg[7]=-cr*si;Rg[8]=ci;
  gl.uniformMatrix4fv(p.l('uVP'),false,VP);gl.uniformMatrix3fv(p.l('uRg'),false,Rg);gl.uniform1f(p.l('uT'),t);gl.uniform1f(p.l('uSpd'),C.ringSpd);gl.uniform1f(p.l('uK'),C.ringK);
  gl.uniform3f(p.l('uCam'),cam.pos[0],cam.pos[1],cam.pos[2]);gl.uniform3f(p.l('uSun'),L[0],L[1],L[2]);gl.uniform1f(p.l('uSunI'),C.sunI);gl.uniform1f(p.l('uNear'),Math.min(1.6,Math.max(.12,(C.d-1)*.55)));bindTex(0,S.nz);gl.uniform1i(p.l('uNoise'),0);
  var lim=S.q==='low'?.4:1;
  for(var m=0;m<S.rm.length;m++){var R=S.rm[m];gl.bindBuffer(gl.ARRAY_BUFFER,R.vb);attribsOff(8);attrib(0,3,24,0);attrib(1,3,24,12);
   gl.bindBuffer(gl.ARRAY_BUFFER,R.ib);attrib(2,4,48,0,1);attrib(3,4,48,16,1);attrib(4,4,48,32,1);drawInst(gl.TRIANGLES,0,R.n,Math.max(1,Math.floor(R.c*lim)))}
  attribsOff(8)}
 /* 5 light-speed streaks */
 if(C.warp>.015){gl.disable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);p=S.P.wp;gl.useProgram(p.p);
  gl.bindBuffer(gl.ARRAY_BUFFER,S.wq);attribsOff(8);attrib(0,2,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,S.wi);attrib(1,4,0,0,1);
  gl.uniform1f(p.l('uT'),t);gl.uniform1f(p.l('uWarp'),C.warp);gl.uniform1f(p.l('uAsp'),asp);gl.uniform1f(p.l('uPx'),2/H);gl.uniform2f(p.l('uVP'),C.vpx,C.vpy);
  drawInst(gl.TRIANGLE_STRIP,0,4,S.q==='low'?S.warpN>>1:S.warpN);attribsOff(8)}
 /* 6 fx overlay (flash, tunnel glow, entry heat, fade from black) */
 if(C.warp>.015||C.flash>.003||C.fade<.999||C.entry>.003){gl.disable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);p=S.P.fx;gl.useProgram(p.p);
  gl.bindBuffer(gl.ARRAY_BUFFER,S.tri);attribsOff(8);attrib(0,2,0,0);gl.uniform2f(p.l('uRes'),W,H);gl.uniform2f(p.l('uVP'),C.vpx,C.vpy);gl.uniform1f(p.l('uFlash'),C.flash);
  gl.uniform1f(p.l('uWarp'),C.warp);gl.uniform1f(p.l('uFade'),C.fade);gl.uniform1f(p.l('uEntry'),C.entry);gl.uniform1f(p.l('uT'),t);gl.drawArrays(gl.TRIANGLES,0,3)}
 gl.disable(gl.BLEND);S.frames++}

/* ---------- loop ---------- */
function emit(n,a){var f=S.cb[n];if(f)try{f(a)}catch(e){}}
function cancelFrame(){if(S.raf){cancelAnimationFrame(S.raf);S.raf=0}}
function tick(ts){
 S.raf=0;if(!S.run)return;S.raf=requestAnimationFrame(tick);
 if(document.hidden||S.lost){S.last=0;return}
 if(!S.last){S.last=ts}
 var busy=C.warp>.01||S.tw.length>0||C.flash>.01;var target=S.still?1:(busy?(S.q==='low'?30:60):(S.q==='low'?20:S.fps));
 var minDt=1000/target;if(ts-S.last<minDt-2)return;
 var dt=Math.min((ts-S.last)/1000,.1);S.last=ts;
 if(!S.still)S.t+=dt;
 /* idle motion */
 if(!S.noSpin)C.lon-=C.spin*dt;else if(DIR.st==='land')C.lon+=.004*dt;
 stepAnim();
 var t0=performance.now();render();var ms=performance.now()-t0;
 S.ms=S.ms*.9+ms*.1;
 adapt(ts,dt,busy);
 emit('frame',dt)}
function adapt(ts,dt,busy){
 /* adaptive resolution from real frame spacing: if frames take much longer than the target budget, drop render scale */
 S.dtEma=(S.dtEma||dt)*.92+dt*.08;var want=busy?1/60:1/(S.q==='low'?20:S.fps);
 if(S.manual||S.still)return;
 if(ts-S.lastAdapt<900)return;
 if(S.dtEma>want*1.55&&S.scale>.5){S.scale=Math.max(.5,S.scale*.85);S.lastAdapt=ts;resize(true);emit('scale',S.scale)}
 else if(S.dtEma<want*1.1&&S.scale<1&&ts-S.lastAdapt>6000){S.scale=Math.min(1,S.scale/.9);S.lastAdapt=ts;resize(true);emit('scale',S.scale)}}

/* ---------- director: choreography between the login states ---------- */
var DIR={st:'idle',id:0,k:1,onStage:null,landLat:0,landLon:0};
function nid(){S.tw.length=0;S.tl.length=0;return ++DIR.id}
function G(id,fn){return function(){if(id===DIR.id)fn()}}
function stage(n){DIR.st=n;if(DIR.onStage)try{DIR.onStage(n)}catch(e){}}
function PS(kind,asp){
 asp=asp||S.asp||1.78;var L=layout(kind,asp);
 if(kind==='idle')return {fov:L.fov,d:L.d,shX:L.shX,shY:L.shY,pitch:0,tilt:.42,sunR:L.sunR,sunA:L.sunA,sunAbs:0,sunI:1,sunVis:.35,ringK:1,band:1,veinK:1,cloudK:1,gridK:.6,atm:1,lod:0,haze:0,warp:0,flash:0,entry:0,vpx:0,vpy:0,shake:0,pl:1,spin:.03,fade:1};
 if(kind==='map')return {fov:L.fov,d:L.d,shX:L.shX,shY:L.shY,pitch:0,sunR:L.sunR,sunA:L.sunA,sunAbs:0,sunI:1,sunVis:.55,ringK:.5,band:.25,veinK:1,cloudK:1,gridK:1,atm:1,lod:0,haze:0,warp:0,flash:0,entry:0,vpx:0,vpy:0,shake:0,pl:1,spin:0,fade:1};
 var d=1.06,p=asp<1?.74:.9,fov=asp<1?66:58;
 return {fov:fov,d:d,shX:0,shY:asp<1?-.1:0,pitch:p,sunAbs:Math.asin(1/d)-p,sunA:PI/2+.25,sunR:1,sunI:1,sunVis:.5,ringK:0,band:0,veinK:1,cloudK:.6,gridK:0,atm:1,lod:1,haze:1,warp:0,flash:0,entry:0,vpx:0,vpy:0,shake:0,pl:1,spin:0,fade:1}}
function sunRel(){if(C.sunAbs>0){C.sunR=C.sunAbs/Math.asin(clamp(1/C.d,.05,1));C.sunAbs=0}}
function cityAim(lat,lon){return {lon:shortLon(C.lon,lon*D2R),tilt:clamp(lat*D2R,-1.1,1.1)}}
var dir={
 state:function(){return DIR.st},
 stage:function(f){DIR.onStage=f},
 speed:function(k){DIR.k=k>0?k:1},
 snap:function(kind,aim){nid();S.tw.length=0;S.tl.length=0;var o=PS(kind);if(aim){var a=cityAim(aim[0],aim[1]);o.lon=a.lon;o.tilt=a.tilt}apply(o);S.noSpin=kind!=='idle';DIR.st=kind==='map'?'map':kind==='land'?'land':'idle'},
 relayout:function(){var k=DIR.st;if(k==='idle'||k==='map'||k==='land'){var o=PS(k);delete o.tilt;delete o.lon;apply(o)}},
 /* arrive out of light speed and settle into the idle globe */
 intro:function(){var id=nid(),k=DIR.k;S.noSpin=0;var o=PS('idle');apply(o);
  apply({warp:1,flash:.85,fade:0,fov:64,d:o.d*.62,vpx:o.shX*.9,vpy:o.shY*.9,spin:.5,sunI:1.8,shake:.7});DIR.st='intro';
  tween({fade:1},320*k,EASE.o3);tween({flash:0},900*k,EASE.o3,120*k);
  tween({warp:0},1500*k,EASE.o3,150*k);tween({fov:o.fov,d:o.d,spin:.03,sunI:1,shake:0},2300*k,EASE.o5,0,G(id,function(){stage('idle')}))},
 /* idle -> centred globe, rotates to the picked city, drops a pin, dives through light speed, lands */
 pick:function(lat,lon){var id=nid(),k=DIR.k,M=PS('map'),aim=cityAim(lat,lon);DIR.landLat=lat;DIR.landLon=lon;S.noSpin=1;C.spin=0;DIR.st='map-in';
  var mo={};for(var q in M)if(q!=='spin')mo[q]=M[q];
  tween(mo,950*k,EASE.io3,0,G(id,function(){stage('map')}));
  at(180*k,G(id,function(){tween({lon:aim.lon,tilt:aim.tilt},1100*k,EASE.io3,0,G(id,function(){stage('pin')}))}));
  /* charge */
  at(1750*k,G(id,function(){stage('charge');var p=project(lat,lon);C.vpx=clamp(p.nx||0,-.5,.5);C.vpy=clamp(p.ny||0,-.5,.5);
   tween({warp:.16,fov:C.fov*.93,d:C.d*1.06,shake:.45,sunI:1.35,gridK:.3},450*k,EASE.io2)}));
  /* stretch into light speed and dive */
  at(2200*k,G(id,function(){stage('stretch');tween({warp:1,fov:64,d:1.9,shake:1,gridK:0,ringK:1.3,band:0,cloudK:.8},700*k,EASE.i2)}));
  /* white-out: swap to the descent camera while the screen is white */
  at(2880*k,G(id,function(){stage('flash');tween({flash:1},160*k,EASE.o3,0,G(id,function(){
    var A=PS('land');sunRel();apply({d:1.7,fov:72,pitch:.1,haze:.2,lod:.3,ringK:0,band:0,cloudK:1,sunAbs:0,sunR:.9,sunA:A.sunA,shX:0,shY:0,warp:.85,shake:.6});
    tween({flash:0},620*k,EASE.o3)}))}));
  /* atmospheric entry and descent */
  at(3100*k,G(id,function(){stage('descent');var A=PS('land');
   tween({warp:0,shake:0},950*k,EASE.o3);
   tween({d:A.d,fov:A.fov,pitch:A.pitch,lod:1,haze:1,cloudK:.6,sunR:Math.max(.05,A.sunAbs/Math.asin(1/A.d)),shY:A.shY,vpx:0,vpy:0},1550*k,EASE.o5,0,G(id,function(){apply({sunAbs:A.sunAbs});stage('land')}));
   tween({entry:.6},380*k,EASE.o3);at(480*k,G(id,function(){tween({entry:0},900*k,EASE.io2)}))}))},
 /* skip the rest of the dive */
 skip:function(){var id=nid(),k=DIR.k,A=PS('land');S.tw.length=0;S.tl.length=0;var a=cityAim(DIR.landLat,DIR.landLon);apply(A);apply({lon:a.lon,tilt:a.tilt,flash:.55});tween({flash:0},420*k,EASE.o3);S.noSpin=1;stage('land')},
 /* landing -> centred globe -> idle */
 back:function(){var id=nid(),k=DIR.k,M=PS('map'),I=PS('idle');sunRel();DIR.st='back';S.noSpin=1;
  var mo={};for(var q in M)if(q!=='spin'&&q!=='warp'&&q!=='vpx'&&q!=='vpy')mo[q]=M[q];mo.ringK=.5;
  tween({warp:.55,flash:.18},300*k,EASE.o3,0);tween({warp:0,flash:0},700*k,EASE.io2,300*k);
  tween(mo,1250*k,EASE.io3,0,G(id,function(){stage('map')}));
  at(1000*k,G(id,function(){var o={};for(var q in I)if(q!=='spin'&&q!=='tilt'&&q!=='lon'&&q!=='warp')o[q]=I[q];o.tilt=I.tilt;tween(o,1150*k,EASE.io3,0,G(id,function(){C.spin=0;tween({spin:.03},800*k,EASE.io2);S.noSpin=0;stage('idle')}))}))},
 /* straight back to the idle globe from the map view */
 reset:function(){var id=nid(),k=DIR.k,I=PS('idle');DIR.st='back';S.noSpin=1;var o={};for(var q in I)if(q!=='spin'&&q!=='warp'&&q!=='lon')o[q]=I[q];
  tween(o,1000*k,EASE.io3,0,G(id,function(){S.noSpin=0;tween({spin:.03},700*k,EASE.io2);stage('idle')}))},
 /* access granted: punch out of the atmosphere in a light-speed jump and flash */
 launch:function(){var id=nid(),k=DIR.k;DIR.st='launch';S.noSpin=1;sunRel();
  tween({warp:1,fov:104,d:1.5,pitch:.25,vpy:.18,vpx:0,sunI:2.6,shake:.8,haze:.4},1050*k,EASE.i2);
  at(900*k,G(id,function(){stage('punch');tween({flash:1},260*k,EASE.i2,0,G(id,function(){stage('flash')}))}))},
 /* a slow idle drift for the landing view */
 drift:function(dt){if(DIR.st==='land'){C.lon+= .006*dt}}
};
/* ---------- public ---------- */
var api={
 S:S,C:C,EASE:EASE,
 init:function(cv,src,opt){try{if(!initGL(cv,opt))return false}catch(e){S.err=e;return false}
  resize(true);if(src)loadTextures(src);return true},
 on:function(n,f){S.cb[n]=f},
 start:function(){if(!S.ok||S.run)return;S.run=1;S.last=0;S.raf=requestAnimationFrame(tick)},
 stop:function(){S.run=0;cancelFrame()},
 release:function(){api.stop();try{var gl=S.gl;if(gl){var ext=gl.getExtension('WEBGL_lose_context');if(ext)ext.loseContext()}}catch(e){}S.ok=0;S.gl=null;S.cv=null;S.lost=0;S.ready=0;S.tex={};S.P={};S.pings.length=0},
 set:function(o){apply(o)},
 layout:layout,
 tween:tween,at:at,cancel:cancelAnim,
 renderAt:function(t){S.manual=1;S.t=t;stepAnim();render()},
 step:function(dt){S.t+=dt;if(!S.noSpin)C.lon-=C.spin*dt;else if(DIR.st==='land')C.lon+=.004*dt;stepAnim()},
 draw:function(){render()},
 resize:function(){resize(true)},
 project:project,ping:ping,
 setQuality:function(q){S.q=q==='low'?'low':'full';S.pix=S.q==='low'?.85e6:2.1e6;S.fps=S.q==='low'?20:30;resize(true)},
 setStill:function(v){S.still=v?1:0},
 mouse:function(x,y){S.mx=clamp(x,-1,1);S.my=clamp(y,-1,1)},
 time:function(){return S.t},
 shortLon:shortLon,dir:dir,PS:PS
};
return api})();
