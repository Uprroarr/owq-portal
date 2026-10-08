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
function mrz(a,o){var c=Math.cos(a),s=Math.sin(a);mid(o);o[0]=c;o[1]=s;o[4]=-s;o[5]=c;return o}
function mtr(x,y,z,o){mid(o);o[12]=x;o[13]=y;o[14]=z;return o}
function mpersp(fy,asp,n,f,sx,sy,o){var t=1/Math.tan(fy/2);o.fill(0);o[0]=t/asp;o[5]=t;o[8]=-sx;o[9]=-sy;o[10]=(f+n)/(n-f);o[11]=-1;o[14]=2*f*n/(n-f);return o}
function rng(seed){var s=seed>>>0;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}}

/* ---------- shaders ---------- */
var HP='#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
var HASH='float h21(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}\n'+
'vec2 h22(vec2 p){vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));p3+=dot(p3,p3.yzx+33.33);return fract((p3.xx+p3.yz)*p3.zy);}\n';
var TONE='vec3 tone(vec3 x){x=max(x,0.);vec3 hi=.62+.38*(1.-exp(-(x-.62)/.38));return mix(x,hi,step(.62,x));}\n';

var VS_FS='attribute vec2 aP;void main(){gl_Position=vec4(aP,0.,1.);}';
/*GXSstart space*/
/* ---------- idle deep-space layers: distant galaxies, one faint nebula, a Milky-Way style star band, shooting stars, a rare comet ---------- */
var GXS_SP=
'uniform float uGxs,uEv;uniform vec2 uMo;\n'+
'vec3 gxsGal(vec2 p,vec2 c,float sz,float inc,float rot,float seed){vec2 d=p-c;float cr=cos(rot),sr=sin(rot);vec2 u=vec2(cr*d.x+sr*d.y,-sr*d.x+cr*d.y);u.y/=inc;float r=length(u)/sz;if(r>1.35)return vec3(0.);\n'+
' float a=atan(u.y,u.x);float sp=.5+.5*cos(2.*(a-2.6*log(r+.08))+seed*6.);\n'+
' float core=exp(-r*r*34.)*1.1+exp(-r*5.)*.35;float disk=exp(-r*2.6)*(.28+.72*sp*sp)*(1.-smoothstep(.85,1.3,r));\n'+
' float lane=1.-.62*exp(-pow(u.y/(sz*.09),2.))*smoothstep(.08,.45,r)*(1.-inc)*1.25;\n'+
' vec3 cc=vec3(1.,.80,.52)*core+mix(vec3(.52,.62,1.),vec3(1.,.22,.42),sp)*disk*.85;\n'+
' float h=h21(floor(p*430.)+seed*17.);float spk=step(.989,h)*(core*.6+disk)*1.7;\n'+
' return (cc*lane+vec3(.9,.92,1.)*spk)*(1.-smoothstep(1.0,1.35,r));}\n'+
'vec3 gxsNeb(vec2 p,float asp){vec2 q=p-vec2(asp*.42,.3);float m=exp(-dot(q*vec2(.62,.95),q*vec2(.62,.95))*1.5);\n'+
' float n1=texture2D(uNoise,p*.23+vec2(.55,.35)+vec2(uT*.0007,0.)).r,n2=texture2D(uNoise,p*.52+vec2(.1,.8)).g,n3=texture2D(uNoise,p*.12+vec2(.8,.3)).b;\n'+
' float dn=smoothstep(.34,.78,n1*.62+n3*.38)*(.55+.9*n2)*m;vec3 tc=mix(vec3(.07,.05,.30),mix(vec3(.62,.05,.20),vec3(.62,.12,.55),n2),smoothstep(.3,.72,n1));return tc*dn*.34;}\n'+
'vec3 gxsMW(vec2 p){float d=dot(p-vec2(.15,.05),vec2(.43,.9)),band=exp(-d*d/.045);if(band<.04)return vec3(0.);float nn=texture2D(uNoise,p*.9+vec2(.2,.6)).r;band*=.5+.9*nn;\n'+
' vec3 s=star(p,175.,1.02-band*.2,.085,0.)*.7+star(p,95.,1.03-band*.14,.07,0.)*.5;return s+vec3(.5,.42,.6)*band*.03;}\n'+
'vec3 gxsShoot(vec2 p,float asp){if(uEv<.5)return vec3(0.);vec3 o=vec3(0.);\n'+
' float per=7.3,i=floor(uT/per);vec2 h=h22(vec2(i,3.7));float st=h.y*(per-1.4);float f=uT-i*per-st;float dur=.9;\n'+
' if(h.x>.35&&f>0.&&f<dur){float k=f/dur;float ang=.35+.5*h21(vec2(i,9.));float sg=h21(vec2(i,5.))>.5?1.:-1.;vec2 dir=vec2(sg*cos(ang),-sin(ang));vec2 s0=vec2(mix(-.02,.95,h21(vec2(i,2.)))*asp,.3+.45*h21(vec2(i,6.)));\n'+
'  vec2 hp=s0+dir*.55*k*(2.-k);float tl=.2*sin(3.14159*k)+.01;vec2 a=hp-dir*tl;vec2 pa=p-a,ba=hp-a;float t=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);float dd=length(pa-ba*t);\n'+
'  float w=2.6/uRes.y;float core=exp(-dd*dd/(w*w))*t*t;o+=mix(vec3(.55,.7,1.),vec3(1.,.95,.9),t)*core*1.3*sin(3.14159*k);}\n'+
' float pc=53.,tc=uT+22.,j=floor(tc/pc),g=tc-j*pc;if(uGxs>.5&&g<9.&&h21(vec2(j,1.3))>.45){float k=g/9.;vec2 dir=normalize(vec2(-.8,-.42));vec2 hp=vec2(asp*(.95-.5*h21(vec2(j,2.))),.72-.2*h21(vec2(j,3.)))+dir*.7*k;\n'+
'  vec2 pa=p-hp;float al=dot(pa,-dir),pe=length(pa+dir*al);float tail=smoothstep(0.,.02,al)*exp(-al*7.)*exp(-pe*pe/(2.2e-5+al*al*.0009))*step(0.,al);\n'+
'  float hd=exp(-dot(pa,pa)/1.2e-5);float fe=sin(3.14159*k);o+=(vec3(.62,.78,1.)*tail*.55+vec3(1.,.86,.6)*hd*1.1)*fe;}\n'+
' return o;}\n'+
'vec3 gxsSpace(vec2 p,float asp){vec2 q=p+uMo;vec3 c=vec3(0.);float sa=mix(.8,1.,clamp(asp-.5,0.,1.));\n'+
' c+=gxsGal(q-uMo*.4,vec2(asp*.66,.50),.21*sa,.34,.55,.2)*.85;\n'+
' c+=gxsGal(q+uMo*.3,vec2(asp*.16,-.66),.13*sa,.62,-.95,.6)*.68;\n'+
' c+=gxsGal(q-uMo*.8,vec2(asp*.9,-.16),.085*sa,.9,.2,.9)*.56;\n'+
' c+=gxsGal(q+uMo*.2,vec2(-asp*.18,.8),.07*sa,.45,1.3,.45)*.45;\n'+
' c+=gxsMW(p);\n'+
' if(uGxs>.5)c+=gxsNeb(q,asp);\n'+
' c+=gxsShoot(p,asp);return c;}\n';
function bgGxs(p){var gl=S.gl;gl.uniform1f(p.l('uGxs'),S.q==='low'?0:1);gl.uniform1f(p.l('uEv'),S.still?0:1);
 var m=C.par&&!S.still?1:0;gl.uniform2f(p.l('uMo'),m*S.mx*.018,-m*S.my*.012)}
/*GXSend space*/


var FS_BG=HP+HASH+
'uniform vec2 uRes,uSun;uniform float uT,uSunI,uSunVis,uWarp,uRing,uBand,uPlA;uniform vec3 uPl;uniform sampler2D uNoise;\n'+
'vec3 star(vec2 p,float sc,float thr,float sz,float sp){vec2 q=p*sc,g=floor(q),f=fract(q)-.5;float h=h21(g);if(h<thr)return vec3(0.);\n'+
' vec2 o=(h22(g+7.)-.5)*.6,d=f-o;float r=length(d);float b=smoothstep(sz,0.,r);b*=b;float tw=.78+.22*sin(uT*(1.3+h*2.)+h*40.);\n'+
' float br=(.3+.7*h21(g+13.))*tw;float spk=sp>0.?(exp(-abs(d.x)*70.)*exp(-abs(d.y)*2.6)+exp(-abs(d.y)*70.)*exp(-abs(d.x)*2.6))*.22*sp:0.;\n'+
' vec3 tint=mix(vec3(.72,.82,1.),vec3(1.,.78,.68),h21(g+3.));return tint*(b+spk)*br;}\n'+
TONE+
GXS_SP+/*GXS*/
'void main(){vec2 p=(gl_FragCoord.xy-.5*uRes)/(.5*uRes.y);vec3 col=vec3(0.);\n'+
' col+=vec3(.0042,.0018,.0062)*(1.15-.4*length(p));\n'+
' float n1=texture2D(uNoise,p*.26+vec2(.31,.17)+vec2(uT*.0012,0.)).r;float n2=texture2D(uNoise,p*.7+vec2(.7,.2)-vec2(uT*.002,0.)).g;\n'+
' col+=vec3(.26,.025,.06)*pow(clamp(n1*n2*2.3-.42,0.,1.),1.6)*.085;\n'+
' vec3 st=star(p,96.,.962,.075,0.)*.62+star(p,43.,.972,.062,0.)*.85+star(p,17.,.986,.08,1.)*1.45;col+=st*(1.-.55*uWarp);\n'+
' col+=gxsSpace(p,uRes.x/uRes.y)*(1.-.85*uWarp);/*GXS*/\n'+
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
'uniform float uT,uVein,uCloud,uGr,uRpp,uLod,uSunI,uHP,uHaze,uTL;uniform vec4 uPing[6],uPingK[6];\n'+
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
' float tr=(1.-.75*smoothstep(.2,.9,uLod))*cdim;col+=(vec3(1.,.66,.46)*pow(lb,1.2)*1.25*tr+vec3(.9,.16,.11)*lm*.40+vec3(.5,.05,.08)*lw*.16)*uTL*mix(1.,vf,.8*smoothstep(.1,.6,uLod));\n'+
' if(uHaze>.001){float hz=pow(1.-nv,2.6);col+=(mix(vec3(.10,.026,.045),vec3(.46,.15,.14),side)*hz*(.45+.9*lite)+vec3(1.,.36,.2)*hz*(lw*1.5+lm*.7)*.5)*uHaze;}\n'+
' if(uGr>.001){vec2 g=uv*vec2(24.,12.);vec2 fg=abs(fract(g-.5)-.5);float w=uRpp*1.4/max(nv,.2);float gl=(smoothstep(w,0.,fg.x/24.*6.2832)*(.35+.65*smoothstep(0.,.5,1.-abs(on.y)))+smoothstep(w,0.,fg.y/12.*3.1416))*.5;col+=vec3(1.,.16,.26)*gl*uGr*.24*nv*(1.-.6*cloud);}\n'+
' for(int i=0;i<6;i++){vec4 pg=uPing[i];if(pg.w>=0.){float dd=acos(clamp(dot(on,pg.xyz),-1.,1.));float age=pg.w;float rr=0.;\n'+
'  for(int k=0;k<3;k++){float a2=age-float(k)*.6;if(a2>0.){float R=a2*.13;float wd=.0055+.0035*a2;float x=(dd-R)/wd;rr+=exp(-x*x)*exp(-a2*.7);}}\n'+
'  float dt=exp(-dd*dd/.00005)*(.6+.4*sin(age*9.));float ha=exp(-dd*dd/.004)*exp(-age*.55);\n'+
'  col+=uPingK[i].rgb*(rr*1.5+dt*2.8+ha*.55)*uPingK[i].a;}}\n'+
' col=tone(col);gl_FragColor=vec4(col,1.);}';

/* Close-up planet (used only while zoomed in, C.cityK>0): the mesh only supplies the pixel ray; the hit point is solved
   analytically on the unit sphere, so the ground detail is exact and does not swim. On top of the night-lights texture
   (used as macro density) it draws a deterministic procedural city at night around the picked city: fractal sprawl edge,
   arterial grid, local street grids per district, radial highways + ring roads, river with bridges, coast, lakes/parks,
   industrial floodlights, airport. Every line is box-filtered against the analytic pixel footprint (no derivatives needed),
   so detail fades into its average instead of shimmering. */
var VS_PC='attribute vec3 aPos;attribute vec2 aUV;uniform mat4 uMVP,uM;uniform float uMK;varying vec3 vWP;varying vec2 vUV;\n'+
'void main(){vec4 p=vec4(aPos*uMK,1.);vWP=(uM*p).xyz;vUV=aUV;gl_Position=uMVP*p;}';
var FS_PC_BODY=[
'#ifdef PCQ',
'varying vec2 vQ;uniform vec3 uRt,uUp;uniform vec2 uTan,uSh;',
'#else',
'varying vec3 vWP;varying vec2 vUV;',
'#endif',
'uniform sampler2D uLights,uPack,uNoise;uniform float uVein,uGr,uRpp,uHP,uNear;uniform vec4 uPing[6],uPingK[6];uniform vec3 uCam,uSun,uE,uN,uU,uCamL,uDx,uDy,uFw;uniform mat3 uWO;',
'uniform float uT,uCloud,uSunI,uHaze,uC2,uLod,uTL,uExp;uniform vec4 uCity,uCP0,uCP1,uCP2,uCP3,uCP4,uLow;',
'mat2 r2(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}',
/* box-filtered pulse train: lines of relative width k centred on integers, filter width w (both in periods) */
'float fl(float x,float k,float w){w=max(w,1e-3);float a=x+.5*k+.5*w,b=a-w;return clamp((floor(a)*k+min(fract(a),k)-floor(b)*k-min(fract(b),k))/w,0.,1.);}',
/* box-filtered single line: signed distance d, width w, filter f (same unit) */
'float bl(float d,float w,float f){d=abs(d);f=max(f,1e-4);return max(0.,min(d+.5*f,.5*w)-max(d-.5*f,-.5*w))/f;}',
'float fpn(vec2 n,vec2 a,vec2 b){return abs(dot(a,n))+abs(dot(b,n));}',
/* aperiodic value noise (hash lattice); callers fade it to .5 when its cells approach the pixel footprint */
'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}',
/* one octave of jittered bright points (cell cs km): lit with probability ~den, heavy-tailed brightness, energy-conserving size */
'float ptl(vec2 p,float cs,float den,float fp,float s){vec2 q=p/cs,c=floor(q),f=fract(q);float h=h21(c+s),hl=h21(c.yx*1.37+s*3.1+.5);vec2 d=(f-.15-.7*h22(c+s*5.7))*cs;',
' float pz=min(.08*cs,max(.004,2.*fp)),sz=max(pz,.6*fp);return smoothstep(hl-.05,hl+.05,den)*(.15+2.4*h*h*h)*exp(-dot(d,d)/(sz*sz))*(pz*pz)/(sz*sz);}',
/*GXCITYstart*/
/* one family of parallel lit streets (lines at across=k*g). Lamps every ls along a street; every 8th street is an arterial.
   Resolved lamps -> points, unresolved lamps -> continuous line, unresolved streets -> exact area average (energy conserving) */
'float sgrid(float ac,float al,float g,float fac,float fal,float s){float k=floor(ac/g+.5),d=ac-k*g,hk=h21(vec2(k,s*17.)),art=1.-step(.5,mod(k,8.));',
' float w=mix(.008,.02,art),ls=mix(.052,.04,art),El=mix(.00012+.00022*hk*hk,.00075,art);float cov=fl(ac/g,w/g,fac/g);',
' float da=(fract((al-hk*ls)/ls+.5)-.5)*ls,r0=.0015,sz=max(r0,.6*max(fac,fal));float pt=El/(3.1416*r0*r0)*exp(-(d*d+da*da)/(sz*sz))*(r0*r0)/(sz*sz);',
' float hs=h21(vec2(k*1.7+s,floor(al/g))),sv=mix(step(.16,hs)*(.35+1.3*hs*hs),.62,smoothstep(.5,1.5,fal/g));',
' return mix(cov*El/(ls*w),pt,smoothstep(1.2,2.6,ls/fal)*smoothstep(1.5,3.,g/fac))*mix(sv,1.,art*.6);}',
/*GXCITYend*/
'vec2 vein(vec2 p,vec2 nn,float w){vec2 g=floor(p),f=fract(p);float d1=8.,d2=8.;for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 o=vec2(float(i),float(j));vec2 gg=vec2(mod(g.x+o.x,nn.x),g.y+o.y);vec2 r=h22(gg);vec2 dv=o+r-f;float d=dot(dv,dv);if(d<d1){d2=d1;d1=d;}else if(d<d2){d2=d;}}return vec2(smoothstep(w,0.,sqrt(d2)-sqrt(d1)),smoothstep(.2,0.,sqrt(d1)));}',
'void main(){',
'#ifdef PCQ',
' vec3 rd=normalize(uRt*((vQ.x-uSh.x)*uTan.x)+uUp*((vQ.y-uSh.y)*uTan.y)+uFw);',
'#else',
' vec3 rd=normalize(vWP-uCam);',
'#endif',
' float b=dot(uCam,rd);float disc=b*b-uC2;if(disc<0.||b>0.)discard;',
' float t=uC2/(-b+sqrt(disc));vec3 P=uCam+rd*t;vec3 N=normalize(P),V=-rd,L=normalize(uSun);',
' vec3 on=uWO*N;float lat=asin(clamp(on.y,-1.,1.));float dl=atan(on.x,on.z)-uCity.x;dl-=6.2831853*floor(dl*.15915494+.5);',
'#ifdef PCQ',
' vec2 uv=vec2(uCity.y+dl*.15915494,.5-lat*.31830989);',
'#else',
' vec2 uv=uNear>.5?vec2(uCity.y+dl*.15915494,.5-lat*.31830989):vUV;',
'#endif',
' float nv=clamp(dot(N,V),0.,1.),nl=dot(N,L);',
' vec3 pk=texture2D(uPack,uv).rgb;float land=smoothstep(.34,.66,pk.g);',
' vec2 uvc=uv+vec2(uT*.00045,0.);float cl=texture2D(uPack,uvc).r;float cn=texture2D(uNoise,uvc*vec2(9.,5.)).g;',
' float cloud=smoothstep(.30,.86,cl*(.82+.36*cn))*uCloud;',
' vec3 Lp=L-V*dot(L,V);float lpl=length(Lp);Lp=lpl>1e-4?Lp/lpl:vec3(0.,1.,0.);',
' float rim=pow(1.-nv,3.4);float side=pow(clamp(dot(N,Lp)*.5+.5,0.,1.),4.5);float sunRim=rim*(.04+.96*side)*uSunI;',
' float lite=smoothstep(-.18,.55,nl);',
' float lb=max(texture2D(uLights,uv).r-.04,0.)*1.05;float lm=texture2D(uLights,uv,2.5).r;float lw=texture2D(uLights,uv,5.).r;',
' float vf=smoothstep(.04,.42,nv);float ck=uCity.z;',
' vec3 city=vec3(0.);float wat=0.,glo=0.,cwisp=0.,tw=1.-ck;',
' if(ck>.001){',
/* local metric frame: p = km east/north of the city centre; jx/jy = ground km per screen pixel (analytic footprint) */
'  vec3 rdL=vec3(dot(rd,uE),dot(rd,uN),dot(rd,uU));vec2 p=(uCamL.xy+rdL.xy*t)*6371.;',
'  float rf=dot(rd,uFw);vec3 dX=(uDx-rd*dot(rd,uDx))*rf,dY=(uDy-rd*dot(rd,uDy))*rf;float nr=min(dot(N,rd),-.002);',
'  vec3 PX=t*(dX-rd*(dot(N,dX)/nr)),PY=t*(dY-rd*(dot(N,dY)/nr));',
'  vec2 jx=vec2(dot(PX,uE),dot(PX,uN))*6371.,jy=vec2(dot(PY,uE),dot(PY,uN))*6371.;float fi=max(length(jx),length(jy)),fg=sqrt(max(abs(jx.x*jy.y-jx.y*jy.x),1e-8));tw=1.-ck+ck*smoothstep(2.5,9.,fg);',
'  float r=length(p),th=atan(p.y,p.x+1e-6);float R=uCP0.x,sd=uCP2.x,sty=uCP0.z;',
'  vec4 n1=texture2D(uNoise,p*.0237+uCP3.xy),n2=texture2D(uNoise,r2(.61)*p*.103+uCP3.yx);',
'  vec4 n3=texture2D(uNoise,r2(-1.13)*p*.43+uCP3.xy*1.7);',
'  float vA=mix(vn(r2(.9)*p/5.3+sd*7.),.5,smoothstep(.2,.55,fg/5.3)),vB=mix(vn(r2(-.4)*p/2.1+sd*3.),.5,smoothstep(.2,.55,fg/2.1));',
'  float fb=n1.r*.5+vA*.2+vB*.12+n3.r*.18;',
/* land / sea: texture mask far away, the city table's coastline near the city, fractal detail on top */
'  float lv=pk.g;if(uCP2.z>-5.){vec2 sv=vec2(sin(uCP2.z),cos(uCP2.z));float s=dot(p,sv)-uCP2.w+((n1.g-.5)*2.2+(n2.r-.5)*.9)*(1.5+.22*r);',
'   lv=mix(1.-smoothstep(-3.,3.,s),lv,smoothstep(30.,90.,r));}else lv=mix(1.,lv,smoothstep(30.,90.,r));',
'  lv+=.5*exp(-r*r/(R*R*.03));float lvn=lv+(n2.b-.5)*.3+(n3.g-.5)*.14;float fe=clamp(fi*.5,.02,.25);float lr=smoothstep(.5-fe,.5+fe,lvn);land=mix(land,lr,ck);',
/* river (meandering, banks lit, bridges in town) */
'  float riv=0.,emb=0.,bri=0.;',
'  if(uCP1.x>.5){vec2 ax=vec2(sin(uCP1.y),cos(uCP1.y)),nx=vec2(ax.y,-ax.x);float rx=dot(p,ax),ry=dot(p,nx)-uCP1.w;float ph=sd*40.;float m=uCP1.x>1.5?.4:1.;',
'   float yr=m*(1.6*sin(rx*.24+ph)+.55*sin(rx*.73+ph*2.3)+.16*sin(rx*2.3+ph*.7));float sl=m*(.384*cos(rx*.24+ph)+.4015*cos(rx*.73+ph*2.3)+.368*cos(rx*2.3+ph*.7));',
'   float dy=(ry-yr)*inversesqrt(1.+sl*sl);vec2 rn=normalize(nx-ax*sl);float fr=fpn(rn,jx,jy);float hw=uCP1.z*(.85+.3*n2.a);',
'   riv=1.-smoothstep(hw-.5*fr,hw+.5*fr,abs(dy));emb=bl(abs(dy)-hw-.04,.03,fr)*smoothstep(R*1.2,R*.3,r);',
'   float bs=uCP1.x>1.5?4.:1.25;float bx=(fract(rx/bs+sd)-.5)*bs;bri=bl(bx,.03,fpn(ax,jx,jy))*riv*lr*smoothstep(R*(uCP1.x>1.5?.45:.85),R*.15,r);}',
'#ifdef LQ',
'  float shore=0.;',
'#else',
'  float shore=smoothstep(.0,.05,lvn-.5)*smoothstep(.16,.05,lvn-.5)*smoothstep(R*1.3,R*.4,r);',
'#endif',
'  float lake=uCP2.y>.01?smoothstep(.79-uCP2.y*.2,.81-uCP2.y*.2,n2.b*.7+n1.a*.3)*smoothstep(R*.2,R*.5,r):0.;',
'  wat=max(1.-lr,max(riv,lake)*lr);float wsl=max(1.-lr,lake*lr);',
/* radial highways (nearest of 3 candidates) and two wobbly ring roads */
'  float NH=uCP3.z,dth=6.2831853/NH;float kk=floor((th-uCP3.w)/dth+.5);float dh=1e4,hk=0.;',
'  for(int i=-1;i<=1;i++){float k=kk+float(i);float h=h21(vec2(mod(k,NH),sd*91.+3.));',
'   float a=uCP3.w+k*dth+(h-.5)*dth*.5+(1.6*sin(r*.16+h*40.)+.6*sin(r*.47+h*17.))/max(r,4.);float da=th-a;float dd=r*sin(da);if(cos(da)>0.&&abs(dd)<abs(dh)){dh=dd;hk=h;}}',
'  float fh=fpn(vec2(-sin(th),cos(th)),jx,jy);',
'  float hwy=bl(dh,mix(.08,.05,smoothstep(.06,.015,fh)),fh)*smoothstep(R*.05,R*.14,r)*(1.-smoothstep(R*1.6,R*3.5,r)*(.55+.45*hk));',
'  float rA=R*.3*(1.+.16*sin(2.*th+sd*20.)+.08*sin(3.*th+sd*7.)+.05*sin(5.*th+sd*4.))+(n2.r-.5)*R*.12,rB=R*.68*(1.+.13*sin(2.*th+sd*13.)+.09*sin(3.*th+sd*5.)+.05*sin(7.*th+sd*3.))+(n2.g-.5)*R*.2;',
'  float frr=fpn(p/max(r,.001),jx,jy);float ring=max(bl(r-rA,.065,frr),bl(r-rB,.07,frr)*step(15.,R));',
/* macro density: texture (sprawl shape, nearby towns) + core + ribbon development along highways, fbm-thresholded edge */
'  float tl=texture2D(uLights,uv+(n1.ba-.5)*vec2(.0007,.0014)).r;float core=exp(-r*r/(R*R)*1.5);',
'  float fing=exp(-abs(dh)/(.7+.05*r))*exp(-r/(2.2*R))*smoothstep(R*.05,R*.2,r);float tlS=mix(tl*.92,smoothstep(.13,.55,tl)*.95,smoothstep(R*.8,R*1.8,r));float D=max(core,tlS)+fing*.3;',
'  float Dn=D+(fb-.5)*.5;float eA=sty>2.5&&sty<3.5?.3:.24;float rg=smoothstep(R*.8,R*1.8,r);float tsh=tl+1.3*(tl-lm);float rk=smoothstep(.8,3.,fg*fg/fi);float ms=smoothstep(.2,.8,fg)*(1.-rk);float urb=smoothstep(eA-.06*rk-.03*ms,eA+.09+.22*rk+.08*ms,Dn)*mix(.22+.78*smoothstep(eA,.85,Dn),.1+.9*smoothstep(.05,.8,tsh),rg)*lr;',
/* arterial web: Voronoi edges of a jittered grid (near-regular for grid cities, organic elsewhere); cells = districts */
/*GXCITYstart*/
/* no cells anywhere: zoning, colour and density come only from smooth aperiodic noise; lights are points and lines */
'  float far=smoothstep(.05,.22,tl)*(1.-urb)*lr;float nb=(.45+.5*vA+.5*vB)*(.8+.4*n1.a);float pk2=smoothstep(.12,.5,fg);',
'  float park=smoothstep(.6-.05*pk2,.68+.08*pk2,vA*.55+vB*.25+n3.g*.2)*smoothstep(R*.04,R*.15,r)*smoothstep(uCP4.w*.35,uCP4.w*.6,r);float dtn=smoothstep(R*.16,R*.03,r);',
'  float zi=smoothstep(.64,.74,vB*.6+n3.a*.4)*smoothstep(R*.12,R*.35,r)*(1.-dtn);float zl=smoothstep(.42,.78,vA*.6+n1.b*.4+uCP0.w-.45+.3*dtn);float zc=clamp(dtn*1.2+.5*smoothstep(.62,.8,vA)*smoothstep(R*.5,R*.1,r),0.,1.);',
'  float pl=clamp(urb*1.25,0.,1.);float St=0.,Li=0.,rur=0.;',
'  if(urb+far>.002){float us=step(sty,.5),g=us>.5?.1:.13,wk=(1.-us)*(.3+.7*smoothstep(uCP4.w+1.,uCP4.w+6.,r))*(sty>.5&&sty<1.5?1.:.6);',
'   vec2 a1=vec2(cos(uCP0.y),sin(uCP0.y)),a2=vec2(-a1.y,a1.x);vec2 pw=p+(vec2(vA,vB)-.5)*1.4*wk+(n3.ba-.5)*.3*wk;vec2 q=vec2(dot(pw,a1),dot(pw,a2));',
'   float wq=1.15+.6*wk,fa=fpn(a1,jx,jy)*wq,fb2=fpn(a2,jx,jy)*wq;float s1=sgrid(q.y,q.x,g,fb2,fa,sd),s2=sgrid(q.x,q.y,g,fa,fb2,sd+.5);St=s1+s2+min(s1,s2)*1.5;',
'   float gv=texture2D(uNoise,r2(.3)*p*.27+uCP3.yx*2.).g*.6+texture2D(uNoise,r2(-.9)*p*.61+uCP3.xy*3.).r*.4;float gk=smoothstep(.12,.7,fg);',
'   float lit=mix(smoothstep(.76-pl*.5,.82-pl*.5,gv),pl,gk);St*=lit;',
'   Li=ptl(p,.22,.3*zi,fi,sd*5.)*90.*zi+shore*min(lr,1.5)*ptl(p,.16,.5,fi,sd*3.)*9.*(.4+.6*urb);',
'   rur=far*(ptl(p,.5,.08,fi,sd*9.)*40.+.008*(1.-.75*uLow.x));}',
'  float dav=0.;for(int i=0;i<4;i++){float fi2=float(i);float an=uCP0.y+.55+fi2*.83+sd*3.;vec2 dn=vec2(-sin(an),cos(an));float dd=dot(p,dn)-(h21(vec2(fi2,sd*9.))-.5)*R*.5;float wv2=(n2.a-.5)*.6;dav+=bl(dd+wv2,.022,fpn(dn,jx,jy))*smoothstep(.7,.3,abs(dot(p,vec2(dn.y,-dn.x)))/R);}dav*=urb*(1.-park)*1.6;',
'  float neo=ptl(p,.07,.14*zc*smoothstep(.55,.75,vn(p*.35+sd*5.)),fi,sd*11.)*40.*zc*(1.-wat);vec3 ncol=mix(mix(vec3(.1,1.,.85),vec3(1.,.2,.85),vn(p*.9+sd)),vec3(.4,1.,.3),step(.78,vn(p*1.7+sd*2.)));',
'  float Lst=urb*nb*(1.-mix(.92,.6,pk2)*park)*(St*(.2+.4*pl)*(1.+1.1*zc)+.08*dtn+.01*(.4+pl)+ptl(p,.045,.35+.5*pl,fi,sd*17.)*(14.+20.*zc)*(1.-.6*smoothstep(uLow.z*.8,uLow.z*.5,r)));',
/*GXCITYend*/
'  float fmn=fg*fg/fi;float mk=smoothstep(.1,.34,fmn);float pts=0.;',
'  if(mk>.001&&urb>.001){float lz=max(log2(fg*3./.5),0.),oc=floor(lz),ow=fract(lz);float csA=.5*exp2(oc);',
'   pts=mix(ptl(p,csA,clamp(urb*1.2,0.,1.),fi,sd*13.+oc),ptl(p,csA*2.,clamp(urb*1.2,0.,1.),fi,sd*13.+oc+1.),ow)*66.;}',
'  float Lr=mix(Lst*(1.+1.6*smoothstep(.12,.9,fg)),urb*nb*(1.-.6*park)*(mix(mix(.45,.8,urb),mix(.15,.6,urb),rk)+mix(mix(.7,.35,urb),mix(1.,.55,urb),rk)*pts)*(1.+1.1*rk)*mix(.45,1.,smoothstep(.12,.55,fmn)),mk);',
'  float lo2=smoothstep(.06,.015,fh);float Lh=(hwy*(1.3+1.1*urb)+ring*(1.1+.9*urb))*(1.-.6*lo2)*(1.-.6*uLow.x);',
/*GXCITYstart*/
'  float cs=sign(dh),cpp=fract(r*20.-uT*.55*cs+hk*13.),car=exp(-pow((cpp-.5)*.05/max(.004,fh*.6),2.))*bl(dh-cs*.02,.025,fh)*lo2*smoothstep(R*.05,R*.14,r);',
/*GXCITYend*/
'  vec2 ap=r2(-uCP4.z)*(p-uCP4.xy);float aph=0.,apd=0.;',
'#ifndef LQ',
'  if(abs(ap.x)<2.8&&abs(ap.y)<1.6){float fx=fpn(r2(uCP4.z)*vec2(0.,1.),jx,jy),fy=fpn(r2(uCP4.z)*vec2(1.,0.),jx,jy);',
'   float inr=smoothstep(2.6,2.4,abs(ap.x))*smoothstep(1.5,1.3,abs(ap.y));apd=inr;',
'   aph=(bl(ap.y-.55,.05,fx)+bl(ap.y+.5,.05,fx))*step(abs(ap.x),1.9)*1.3+bl(ap.y-.08,.32,fx)*step(abs(ap.x),1.1)*(.9+.9*n3.r)+bl(abs(ap.x)-1.9,.04,fy)*step(abs(ap.y),.6)*.6;}',
'#endif',

'  vec3 sod=vec3(1.,.56,.21),led=vec3(.84,.9,1.),wht=vec3(1.,.84,.62);',
'  vec3 cb=mix(mix(sod,mix(wht,led,.4)*1.1,zl*.55),wht,zc*.18);vec3 hc3=mix(sod,wht,step(.6,uCP0.w));vec3 brc=vec3(.42,.66,1.);',
'  city=(cb*Lr*(1.-.85*apd)+led*Li+sod*rur+hc3*emb*1.2*urb)*(1.-wat)+hc3*Lh*(1.-wsl)+brc*bri*1.7+mix(sod,wht,.6)*dav*.3*(1.-wat)+ncol*neo+mix(led,wht,.4)*aph*(1.-.6*uLow.x)*(1.-wsl)+mix(vec3(1.,.08,.06),vec3(1.,.95,.85),step(cs,0.))*car*2.5*(1.-wsl);',
'  glo=D*lr*urb*.9+lw*.07+lm*1.6*rk*(1.-rg*.3);',
'  cwisp=smoothstep(.55,.98,cl*(.8+.4*cn)+(n1.g-.5)*.5+(n2.g-.5)*.3)*uCloud;',
' }',
' vec3 ocean=vec3(.006,.014,.028),landc=vec3(.014,.020,.026)*(.6+pk.b*1.8);vec3 col=mix(ocean,landc,land);col=mix(col,ocean*.7,wat*ck);',
' cloud=mix(cloud,cwisp,ck)*(1.-uLow.x);',
' vec3 cloudc=vec3(.050,.062,.085)*(.55+.45*cn)*(.45+1.4*lite+2.4*side*rim*(1.-.85*ck));col=mix(col,cloudc,cloud*mix(.88,.5,ck));float cdim=1.-.72*cloud*smoothstep(.0,.9,uLod)*(1.-ck);',
' vec3 rimc=mix(vec3(.30,.38,.70),vec3(1.,.36,.22),smoothstep(-.1,.8,side));col+=(rimc*sunRim*1.25+vec3(.10,.16,.34)*rim*.16)*(1.-ck);',
' vec3 H=normalize(L+V);float sp=pow(max(dot(N,H),0.),70.);col+=vec3(1.,.60,.46)*sp*(1.-land)*(1.-cloud)*2.2*(.2+lite)*(1.-ck);',
' float tr=(1.-.75*smoothstep(.2,.9,uLod))*cdim;',
' col+=(vec3(1.,.66,.46)*pow(lb,1.2)*1.25*tr*(1.+.9*ck*(1.-uVein))+(vec3(.9,.16,.11)*lm*.40+vec3(.5,.05,.08)*lw*.16)*(1.-uLow.x))*uTL*mix(1.,vf,.8*smoothstep(.1,.6,uLod))*tw+(vec3(.9,.16,.11)*lm*.40+vec3(.5,.05,.08)*lw*.16)*uTL*.3*(1.-tw)*(1.-uLow.x);',
' float dens=smoothstep(.06,.42,lm*1.25+lw*.35);',
' if(uVein>.01&&uHP>.5){vec2 nn=vec2(190.,95.);vec2 vp=vec2(uv.x*nn.x,uv.y*nn.y);vp+=(texture2D(uNoise,vp*.06).rg-.5)*1.7;',
'  vec2 ve=vein(vp,nn,.13);float e=ve.x,nd=ve.y;float e2=0.,nd2=0.;if(uLod>.02){vec2 v2=vein(vp*3.3+vec2(5.1,2.7),nn*3.3,.14);e2=v2.x*uLod;nd2=v2.y*uLod;}',
'  float pulse=.78+.22*sin(uT*.8+texture2D(uNoise,vp*.11).a*14.);float ckk=(e*dens*2.6+e2*dens*2.0+(nd*.9+nd2*1.1)*dens*dens*3.)*pulse*uVein;',
'  vec3 lava=mix(vec3(.50,.015,.05),vec3(1.,.26,.09),smoothstep(.15,.8,ckk));lava=mix(lava,vec3(1.,.78,.62),smoothstep(.9,1.7,ckk));',
'  col+=lava*ckk*1.45*cdim*vf;col+=vec3(.55,.10,.09)*cloud*smoothstep(.0,.9,uLod)*dens*.45*vf;}',
' if(uGr>.001){vec2 g=uv*vec2(24.,12.);vec2 fg=abs(fract(g-.5)-.5);float w=uRpp*1.4/max(nv,.2);float gl=(smoothstep(w,0.,fg.x/24.*6.2832)*(.35+.65*smoothstep(0.,.5,1.-abs(on.y)))+smoothstep(w,0.,fg.y/12.*3.1416))*.5;col+=vec3(1.,.16,.26)*gl*uGr*.24*nv*(1.-.6*cloud);}',
' for(int i=0;i<6;i++){vec4 pg=uPing[i];if(pg.w>=0.){float dd=acos(clamp(dot(on,pg.xyz),-1.,1.));float age=pg.w;float rr=0.;',
'  for(int k=0;k<3;k++){float a2=age-float(k)*.6;if(a2>0.){float Rr=a2*.13;float wd=.0055+.0035*a2;float x=(dd-Rr)/wd;rr+=exp(-x*x)*exp(-a2*.7);}}',
'  float dt2=exp(-dd*dd/.00005)*(.6+.4*sin(age*9.));float ha=exp(-dd*dd/.004)*exp(-age*.55);col+=uPingK[i].rgb*(rr*1.5+dt2*2.8+ha*.55)*uPingK[i].a;}}',
' float ext=exp(-t*5.);',
' col+=(city*(1.-.45*cloud)*uExp+mix(vec3(1.,.42,.24),vec3(.5,.45,.55),uLow.x)*glo*.06*(1.-.85*uLow.x)+vec3(1.,.55,.34)*glo*cloud*.5)*(1.-tw)*ext;',
/*GXCITYstart*/
' if(uLow.x>.001){float dk=t*6371.;vec2 pq=(uCamL.xy+vec3(dot(rd,uE),dot(rd,uN),dot(rd,uU)).xy*t)*6371.;float rr=length(pq);',
'  col+=vec3(1.,.12,.3)*exp(-pow((rr-uLow.z)/(.12+dk*.004),2.))*uLow.w*1.4;',
'  float fo=(1.-exp(-dk/uLow.y))*uLow.x*.85;col=mix(col,vec3(.006,.010,.024)+vec3(.25,.18,.2)*glo*.03,fo);',
'  col+=(h21(gl_FragCoord.xy+fract(uT*7.)*91.)-.5)*.018*uLow.x;}',
/*GXCITYend*/
' if(uHaze>.001){float hz=pow(1.-nv,2.6)*(1.-.55*ck);col+=(mix(vec3(.10,.026,.045),vec3(.46,.15,.14),side)*hz*(.45+.9*lite)+vec3(1.,.36,.2)*hz*(lw*1.5+lm*.7)*.5*(1.-.85*ck))*uHaze;}',
' col=tone(col);gl_FragColor=vec4(col,1.);}'
].join('\n');
function fsPC(low,q){return HP+(low?'#define LQ 1\n':'')+(q?'#define PCQ 1\n':'')+HASH+TONE+FS_PC_BODY}
/*GXCITYstart*/
var VS_PCQ='attribute vec2 aP;varying vec2 vQ;void main(){vQ=aP;gl_Position=vec4(aP,0.,1.);}';
/*GXCITYend*/

var VS_AT='attribute vec2 aP;uniform vec4 uBox;varying vec2 vP;void main(){vP=mix(uBox.xy,uBox.zw,aP);gl_Position=vec4(vP,0.,1.);}';
var FS_AT=HP+HASH+
'varying vec2 vP;uniform vec3 uCam,uSun,uRt,uUp,uFw;uniform vec2 uTan,uSh;uniform float uSunI,uAtm,uT,uAS;\n'+
TONE+
'void main(){vec2 n=vP;vec3 rd=normalize(uRt*((n.x-uSh.x)*uTan.x)+uUp*((n.y-uSh.y)*uTan.y)+uFw);vec3 ro=uCam;\n'+
' float tca=dot(-ro,rd);float b2=dot(ro,ro)-tca*tca;float b=sqrt(max(b2,0.));vec3 pc=normalize(ro+rd*max(tca,0.));vec3 L=normalize(uSun);\n'+
' float g=b>=1.?exp(-(b-1.)/(.022*uAS)):exp((b-1.)/(.028*uAS));\n'+
' float sf=dot(pc,L);float lit=smoothstep(-.55,.8,sf);float mu=dot(rd,L);float ph=.4224/pow(1.5776-1.52*mu,1.5);if(b<1.)ph=mix(ph,1.+(ph-1.)*exp((b-1.)/.0015),smoothstep(.9,.4,uAS));\n'+
' float thin=b>=1.?exp(-(b-1.)/(.0085*uAS)):exp((b-1.)/(.012*uAS));\n'+
' vec3 cwarm=mix(vec3(1.,.30,.18),vec3(1.,.74,.60),clamp(thin,0.,1.));vec3 ccool=vec3(.20,.30,.66);\n'+
' vec3 col=cwarm*g*lit*ph*.068*uSunI+cwarm*thin*pow(lit,2.)*ph*.12*uSunI+ccool*g*.040;\n'+
' float ak=smoothstep(.9,.35,uAS);if(ak>0.){float hb=(b-1.)*6371.;float hc=(length(uCam)-1.)*6371.;float hl=min(88.,.36*hc+3.);float ag=exp(-pow((hb-hl)/max(1.4,.065*hc),2.))*step(1.,b);float lo=exp(-max(hb,0.)/(.14*hc+1.))*step(1.,b);col+=((vec3(.36,.85,.62)*.12+vec3(1.,.5,.34)*pow(lit,3.)*ph*.03)*ag+vec3(.55,.62,.9)*lo*.05)*ak;}\n col*=uAtm;col=tone(col);gl_FragColor=vec4(col,1.);}';

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
 ring:1,ringSpd:1,ringRoll:-.06,ringInc:.16,ringK:1,veinK:1,cloudK:1,gridK:.6,band:1,atm:1,vpx:0,vpy:0,shake:0,lod:0,pl:1,par:1,
 off:0,yaw:0,cityK:0,atmS:1,expo:1,dv:0,tlK:0,rise:0};
function apply(o){for(var k in o)if(k in C)C[k]=o[k]}

/* ---------- per-city features for the procedural landing (deterministic). Columns:
   lat, lon, size class 0-3, sea bearing deg (-1 inland), sea distance km, river type (0 none, 1 river, 2 strait/harbour),
   river axis bearing deg, river width m, river offset km (to the right of the axis), street-grid bearing deg,
   style (0 straight grid, 1 european radial, 2 asian dense, 3 arid, 4 latin), white-light share, lakes ---------- */
var RE=6371;
var CT=[
[35.68,139.69,3,150,10,1,170,250,2,0,2,.75,0],[31.23,121.47,3,95,45,1,15,420,1,10,2,.6,.1],[1.35,103.82,2,180,9,0,0,0,0,0,2,.35,.15],
[19.08,72.88,3,265,5,2,0,1500,7,0,2,.4,0],[28.61,77.21,3,-1,0,1,170,300,4,0,2,.3,0],[25.2,55.27,2,315,4,2,135,350,6,45,3,.45,0],
[41.01,28.98,3,190,3,2,20,1600,4,0,1,.5,0],[30.04,31.24,3,-1,0,1,350,650,-1,0,3,.4,0],[6.52,3.38,3,180,8,2,90,2500,-3,0,2,.2,.2],
[-1.29,36.82,2,-1,0,0,0,0,0,0,3,.4,0],[-26.2,28.05,3,-1,0,0,0,0,0,0,0,.35,0],[55.76,37.62,3,-1,0,1,110,220,0,0,1,.5,.05],
[51.51,-0.13,3,-1,0,1,95,260,-1,0,1,.45,.05],[48.86,2.35,3,-1,0,1,295,160,0,0,1,.4,0],[52.52,13.4,2,-1,0,1,280,120,0,0,1,.55,.35],
[40.42,-3.7,2,-1,0,0,0,0,0,0,1,.45,0],[41.9,12.5,2,240,24,1,200,120,-1,0,1,.35,0],[59.33,18.07,1,95,6,2,90,700,0,0,1,.6,.6],
[40.71,-74.01,3,160,4,2,200,1300,1.5,29,0,.5,.05],[41.88,-87.63,3,90,2,0,0,0,0,0,0,.25,0],[29.76,-95.37,3,140,45,0,0,0,0,0,0,.35,0],
[39.74,-104.99,2,-1,0,0,0,0,0,0,0,.4,0],[34.05,-118.24,3,225,24,0,0,0,0,0,0,.4,0],[25.76,-80.19,2,90,2,0,0,0,0,0,0,.5,.1],
[33.75,-84.39,2,-1,0,0,0,0,0,0,0,.45,0],[43.65,-79.38,3,165,2,0,0,0,0,-17,0,.5,0],[19.43,-99.13,3,-1,0,0,0,0,0,0,4,.35,0],
[4.71,-74.07,2,-1,0,0,0,0,0,20,4,.45,0],[-12.05,-77.04,3,250,8,0,0,0,0,0,4,.35,0],[-23.55,-46.63,3,-1,0,1,300,150,5,0,4,.45,0],
[-34.6,-58.38,3,70,2,0,0,0,0,38,4,.3,0],[-33.45,-70.67,3,-1,0,1,280,80,1,0,4,.4,0],[-33.87,151.21,2,95,7,2,265,900,1,0,0,.45,0],
[-37.81,144.96,2,200,4,1,270,90,0,0,0,.4,0],[-36.85,174.76,1,30,1.5,0,0,0,0,0,0,.5,0],[37.57,126.98,3,-1,0,1,275,1000,-5,0,2,.75,0],
[22.32,114.17,3,180,5,2,270,1400,-1.5,0,2,.7,0],[13.76,100.5,3,180,30,1,185,300,-1,0,2,.4,0],[-6.21,106.85,3,0,9,0,0,0,0,0,2,.35,0],
[14.6,120.98,3,260,2,1,280,120,0,0,2,.4,.1],[24.86,67.0,3,210,5,0,0,0,0,0,3,.35,0],[24.71,46.68,3,-1,0,0,0,0,0,-20,3,.3,0],
[49.28,-123.12,2,270,5,2,90,800,-1.5,0,0,.5,0],[61.22,-149.9,0,285,2,0,0,0,0,0,0,.45,0],[21.31,-157.86,1,200,2,0,0,0,0,0,0,.45,0],
[33.57,-7.59,2,320,2,0,0,0,0,0,3,.35,0],[5.6,-0.19,2,180,3,0,0,0,0,0,3,.25,0],[9.03,38.74,2,-1,0,0,0,0,0,0,3,.3,0],
[52.23,21.01,2,-1,0,1,340,420,2,0,1,.4,0],[37.98,23.73,2,215,8,0,0,0,0,0,1,.4,0],[38.72,-9.14,1,170,2.5,0,0,0,0,0,1,.4,0],
[25.03,121.57,3,315,25,1,330,300,-4,0,2,.6,0],[3.14,101.69,2,-1,0,0,0,0,0,0,2,.45,0],[23.81,90.41,3,-1,0,1,230,500,-4,0,2,.3,.15]];
/*GXCITYstart*/
/* real-city numbers, same order as CT: [urban radius km, metro pop M, towers >150 m, tallest building m, typical mid-rise m, CBDs as dx,dy km,weight ...] (approximate, from public figures) */
var CTR=[
[45,37,250,330,40,0,0,1,7,-.5,.9,1.5,-3,.7,4,-2.5,.7,1.5,4,.6],[40,29,180,632,50,3.3,.4,1,0,0,.7,-2.5,.3,.6,-3,-5,.4],[18,6,100,290,60,4.3,-7.4,1,1,-5,.4],
[25,22,150,280,40,0,-.5,1,-3,-7,.8,-3,-16,.7],[35,32,4,160,15,0,.5,.6,-12,-14,.6],[25,3.6,250,828,35,.4,-.3,1,.5,-1.5,.9,2,1.5,.7,-3,-3,.6],
[30,16,50,284,25,4,7,1,11,0,.6,-1,0,.4],[30,22,5,145,30,0,0,.6,-3,3,.4],[30,16,3,160,15,1,-7.5,.7,-1,5,.3],
[15,5,5,184,20,0,0,1,-1.5,-1.5,.6],[30,10,15,223,20,0,0,.8,2,14,.9],[28,17,30,374,40,-5.2,-1.2,1,0,0,.5],
[30,14,50,310,25,3,.2,1,9.5,-.5,.9,3,-.6,.6],[22,12,20,231,22,-9,3,1,0,0,.3],[22,6,2,150,22,0,0,.5,-2,-.7,.4],
[20,7,6,250,25,1,6.5,1,.8,3,.5],[15,4.3,0,120,18,0,0,.25],[12,2.4,1,125,20,0,0,.4],
[40,20,300,541,35,0,.2,1,2,4.5,1,-2,-.2,.5,5,5,.4,1.5,-1,.4],[35,9.5,130,442,25,0,0,1,.7,1.5,.8],[35,7,40,305,12,.7,0,1,-10,0,.6,-1.5,-6,.4],
[20,3,10,217,12,0,0,1],[45,18,25,335,12,-1.7,0,1,-15,-2,.5,-6,6,.3],[25,6,60,265,30,0,0,1,.2,1.5,.8],
[30,6,20,312,12,0,0,.8,.4,2.5,.8,2,11,.6],[28,6.7,100,298,30,0,0,1,0,7,.4],[35,22,30,267,15,-4.8,-.7,1,-15,-4,.6],
[20,11,10,260,20,0,0,.8,1,5,.6],[30,11,5,140,15,4,-6,.8,0,0,.4],[40,22,40,220,55,0,0,.8,-2,-2.5,1,-7,-5,.8],
[30,15,20,235,35,.5,-.3,1,-1,1.5,.6],[22,7,10,300,25,0,0,.5,6,3.6,1],[30,5.3,50,271,15,0,0,1,0,2.5,.6],
[30,5,60,317,15,0,-.6,1],[15,1.7,3,187,10,.2,.2,.9],[30,26,100,555,50,0,0,.7,5,-6,.9,-6,-3,.8,10.8,-6.3,.6],
[20,7.5,550,484,90,-.5,-3.8,1,0,-1.8,.8,0,0,.8,-3,-1,.6],[35,17,100,315,25,3,-4,1,6,-1.5,.8],[35,34,200,386,20,-3,-.5,1,-1,-1,.8],
[30,14,100,318,15,4,-6,1,7,-6,.8,10,0,.7],[30,17,5,273,18,0,0,.6,-.5,-4,.6],[30,7.7,20,385,15,2,7,1,-.6,.1,.8],
[25,2.6,15,201,25,0,0,1,10,-6,.4],[10,.4,0,90,8,0,0,.4],[12,1,2,140,20,0,0,.6,4,-2,.7],
[20,4.3,3,167,20,0,0,.6],[20,5.5,0,100,10,0,0,.4],[18,5.5,3,209,15,0,0,.6],
[20,3.1,15,310,25,-.6,0,1,-2,.3,.8],[20,3.6,1,103,20,0,0,.3],[18,2.9,0,110,18,0,0,.3],
[22,7,25,508,35,-.5,.4,1,1,.5,.5],[25,8.5,120,679,30,1.8,1.1,1,1.15,.15,.8,0,0,.4],[18,23,5,150,30,0,0,.8,1,3,.6]];
/* extra hero landmarks by CT index (same format as LM) */
var LMX={
2:[[4.3,-7.4,.018,.035,0,.194,1,0],[4.45,-7.4,.018,.035,0,.194,1,0],[4.6,-7.4,.018,.035,0,.194,1,0],[4.45,-7.4,.2,.02,.194,.008,1,1]],
32:[[-.1,-.06,.006,.006,0,.25,1,4],[-.1,-.06,.026,.026,.23,.03,1,1],[-.1,-.06,.002,.002,.26,.05,1,4],[.5,1.46,.03,.07,0,.065,.15,4],[.55,1.4,.025,.05,0,.05,.15,4]],
33:[[-.1,-1.45,.035,.035,0,.317,.9,0],[0,-1,.03,.03,0,.297,1,1]],
34:[[.2,.2,.006,.006,0,.33,1,4],[.2,.2,.022,.022,.19,.035,1,1]],
14:[[.64,.09,.005,.005,0,.368,1,4],[.64,.09,.018,.018,.2,.035,.6,2]],
20:[[.67,0,.03,.03,0,.305,.9,0]],
22:[[-1.84,.03,.03,.022,0,.31,1,0],[-1.84,.03,.002,.002,.31,.025,1,4],[-1.6,.06,.025,.025,0,.31,1,1]],
24:[[.35,2.3,.03,.03,0,.27,1,1],[.35,2.3,.012,.012,.27,.04,.3,1]],
23:[[0,0,.03,.02,0,.265,1,0]],
48:[[-.27,.2,.06,.04,0,.11,1,1],[-.27,.2,.03,.03,.11,.08,.8,1],[-.27,.2,.004,.004,.19,.047,1,4],[-.76,-.14,.025,.025,0,.23,.7,0],[-.76,-.14,.002,.002,.23,.08,1,4]],
15:[[.9,6.3,.025,.025,0,.25,1,0],[1.05,6.35,.025,.025,0,.25,1,1],[1.2,6.3,.025,.025,0,.236,1,0],[1.35,6.25,.025,.025,0,.224,1,0]],
26:[[-4.8,-.7,.03,.03,0,.246,1,0],[-4.6,-.8,.03,.03,0,.235,1,0]],
31:[[6,3.6,.04,.04,0,.3,.8,0]],
52:[[1.15,.15,.04,.04,0,.6,.6,0],[1.15,.15,.003,.003,.6,.079,1,4]],
37:[[3.05,-4.1,.03,.03,0,.314,1,0]],
38:[[-3.2,-.3,.035,.035,0,.33,.85,0],[-3.2,-.3,.003,.003,.33,.056,1,4]],
35:[[10.8,-6.3,.04,.04,0,.555,.4,0]]};
function cityReal(o,q){var sky=0,T=.12,mid=.02,cb=[[0,0,1]];
 if(q){o.R=clamp(q[0]*.7,6,32);o.RB=clamp(3.5+q[0]*.1+Math.sqrt(q[2])*.15,4,8.5);sky=q[2];T=q[3]/1000;mid=q[4]/1000;cb=[];for(var i=5;i+2<q.length;i+=3)cb.push([q[i],q[i+1],q[i+2]]);o.pop=q[1]}
 else{o.pop=[.5,1.5,4,10][o.cls];sky=[0,3,15,40][o.cls];T=[.09,.14,.2,.27][o.cls];mid=[.012,.018,.022,.028][o.cls]}
 o.h=clamp(.9+T*1.3+o.R*.02,1.1,2.6);o.sky=sky;o.T=T;o.mid=mid;o.cbd=cb;var m=cb[0];for(var j=1;j<cb.length;j++)if(cb[j][2]>m[2])m=cb[j];
 var L=lmList(o),lt=null;for(var k=0;k<L.length;k++)if(Math.hypot(L[k][0],L[k][1])<o.RB*.8&&(!lt||L[k][4]+L[k][5]>lt[4]+lt[5]))lt=L[k];if(lt)m=[lt[0],lt[1],1];
 o.aim=Math.hypot(m[0],m[1])>.3&&Math.hypot(m[0],m[1])<o.RB*.8?[m[0]*.85,m[1]*.85]:[0,0];return q?1:0}
/*GXCITYend*/
function cityInfo(lat,lon){
 var row=null,bd=.08,ci=-1;for(var i=0;i<CT.length;i++){var c=CT[i],dd=Math.abs(c[0]-lat)+Math.abs(c[1]-lon);if(dd<bd){bd=dd;row=c;ci=i}}
 var r=rng(((lat*1000)|0)*73856093^((lon*1000)|0)*19349663);
 if(!row){var rt=r()<.4;row=[lat,lon,2,-1,0,rt?1:0,r()*360,rt?250:0,0,0,(r()*5)|0,.35+r()*.3,0]}
 var cls=row[2],o={lat:lat,lon:lon,cls:cls,R:[8,12,18,27][cls],h:[1.4,1.8,2.2,2.6][cls],RB:[4,5.5,7,9][cls],seed:r(),sea:row[3],seaD:row[4],rivT:row[5],rivB:row[6],rivW:row[7],rivO:row[8],
  grid:row[9],style:row[10],white:row[11],lakes:row[12]};
 /*GXCITYstart*/o.ci=ci;o.real=cityReal(o,ci>=0?CTR[ci]:null);/*GXCITYend*/
 o.nh=[6,7,8,10][cls]+((r()*2)|0);o.hw0=r()*TAU;o.nox=r();o.noy=r();
 var side=r()<.5?-1:1;o.yaw=(o.sea>=0?o.sea+180+side*12:o.rivT?o.rivB+side*30:r()*360)*D2R;
 var ab=(o.sea>=0?o.sea+180+(r()-.5)*120:r()*360)*D2R,ad=o.R*(.5+.25*r());o.ap=[Math.sin(ab)*ad,Math.cos(ab)*ad,r()*PI];
 return o}

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
 S.aniso=gl.getExtension('EXT_texture_filter_anisotropic');S.kpc=gl.getExtension('KHR_parallel_shader_compile');S.pcPend=null;
 program('bg',VS_FS,FS_BG,['aP']);program('pl',VS_PL,FS_PL,['aPos','aUV']);program('at',VS_AT,FS_AT,['aP']);
 program('rk',VS_RK,FS_RK,['aPos','aNrm','aA','aB','aC']);program('wp',VS_WP,FS_WP,['aQ','aS']);program('fx',VS_FS,FS_FX,['aP']);
 /* geometry */
 S.tri=buf(new Float32Array([-1,-1,3,-1,-1,3]));S.quad=buf(new Float32Array([0,0,1,0,0,1,1,1]));
 var LS=Math.round(opt.seg||128),LT=LS/2,vs=[],ix=[];S.seg=LS;S.pcFail=0;
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
 var nzd=makeNoise();S.nzD=nzd;gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,256,256,0,gl.RGBA,gl.UNSIGNED_BYTE,nzd);gl.generateMipmap(gl.TEXTURE_2D);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);S.nz=nz;
 var an=gl.getExtension('EXT_texture_filter_anisotropic');if(an)gl.texParameterf(gl.TEXTURE_2D,an.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
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
 for(i=S.tl.length-1;i>=0;i--){if(t>=S.tl[i].t){var f=S.tl[i].fn;S.tl.splice(i,1);try{f()}catch(e){}}}
 if(DIR.dv)diveApply(C.dv)}
function cancelAnim(keys){if(!keys){S.tw.length=0;S.tl.length=0;return}S.tw=S.tw.filter(function(w){for(var k in w.to)if(keys.indexOf(k)>=0)return false;return true})}
function shortLon(from,to){var d=((to-from)%TAU+TAU+PI)%TAU-PI;return from+d}

/* ---------- projection for DOM overlays ---------- */
var VP=mat(),Vm=mat(),Pm=mat(),Mm=mat(),MVP=mat(),T1=mat(),T2=mat(),T3=mat(),Rg=new Float32Array(9);
var cam={pos:[0,0,3],rt:[1,0,0],up:[0,1,0],fw:[0,0,-1],sun:[0,0,-1],tx:1,ty:1};
function buildCam(){
 var asp=S.asp,fov=C.fov*D2R,sx=C.shX+(C.par?S.mx*.012:0),sy=C.shY+(C.par?-S.my*.008:0);
 var sh=C.shake;if(sh>0){sx+=(Math.sin(S.t*61)+Math.sin(S.t*37.7))*.5*sh*.012;sy+=(Math.sin(S.t*53)+Math.sin(S.t*29.3))*.5*sh*.012}
 var near=clamp((C.d-1)*.3,2e-4,.01);mpersp(fov,asp,near,80,sx,sy,Pm);
 mrx(-C.pitch,T1);mtr(0,0,-C.d,T2);mmul(T1,T2,Vm);
 mmul(Pm,Vm,VP);
 var pk=C.par?Math.min(1,(C.d-1)*.5):0,lon=C.lon+S.mx*.05*pk,tilt=C.tilt+S.my*.03*pk;
 /*GXCITYstart*/var lp=C.par?C.cityK*(1-pk)*sstep(60,5,(C.d-1)*RE):0,yaw=C.yaw+S.mx*.03*lp;cam.lonE=lon;cam.tiltE=tilt;cam.yawE=yaw;/*GXCITYend*/
 mry(-lon,T1);mrx(tilt,T2);mmul(T2,T1,Mm);
 /* heading around the city (yaw) and ground offset of the camera from it (off) */
 if(yaw){mrz(yaw,T1);mmul(T1,Mm,T3);Mm.set(T3)}if(C.off){mrx(-C.off,T1);mmul(T1,Mm,T3);Mm.set(T3)}
 mmul(VP,Mm,MVP);
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
function fillPings(t){var np=0;PG.fill(-1);PK.fill(0);
 for(var i=0;i<S.pings.length&&np<6;i++){var pg=S.pings[i],age=t-pg.t0;if(age>pg.life||age<0)continue;var fa=Math.min(1,(pg.life-age)/1.2);
  PG[np*4]=pg.dir[0];PG[np*4+1]=pg.dir[1];PG[np*4+2]=pg.dir[2];PG[np*4+3]=age;PK[np*4]=pg.col[0];PK[np*4+1]=pg.col[1];PK[np*4+2]=pg.col[2];PK[np*4+3]=pg.k*fa;np++}
 for(;np<6;np++){PG[np*4+3]=-1}}
/* close-up program: compiled on first use (or warmed up from the menu); any failure keeps the classic globe shader */
function pcKey(q){return (S.q==='low'?'pcl':'pc')+(q?'q':'')}
function pcStart(q){var key=pcKey(q),gl=S.gl;S.pcPend=S.pcPend||{};if(!gl||!S.hp||S.pcFail||S.P[key]||S.pcPend[key])return;
 try{var p=gl.createProgram(),vs=gl.createShader(gl.VERTEX_SHADER),fs=gl.createShader(gl.FRAGMENT_SHADER);gl.shaderSource(vs,q?VS_PCQ:VS_PC);gl.compileShader(vs);gl.shaderSource(fs,fsPC(S.q==='low',q));gl.compileShader(fs);
  gl.attachShader(p,vs);gl.attachShader(p,fs);gl.bindAttribLocation(p,0,q?'aP':'aPos');if(!q)gl.bindAttribLocation(p,1,'aUV');gl.linkProgram(p);S.pcPend[key]={key:key,p:p,vs:vs,fs:fs}}catch(e){S.pcFail=1;S.err=e}}
function pcProg(q){if(!S.hp||S.pcFail)return null;var key=pcKey(q);if(S.P[key])return S.P[key];
 pcStart(q);var P=S.pcPend&&S.pcPend[key],gl=S.gl;if(!P)return null;
 /* with KHR_parallel_shader_compile keep drawing the classic globe until the close-up program is ready (they match at that point) */
 if(S.kpc&&!gl.getProgramParameter(P.p,S.kpc.COMPLETION_STATUS_KHR))return null;
 if(!gl.getProgramParameter(P.p,gl.LINK_STATUS)){var m=String(gl.getShaderInfoLog(P.fs)||'')+' '+String(gl.getProgramInfoLog(P.p)||'');S.pcFail=1;S.err=new Error('close-up shader: '+m.slice(0,400));S.pcPend[key]=null;try{console.warn('GX close-up shader disabled: '+m.slice(0,200))}catch(_){}return null}
 var o={p:P.p,u:{},name:key};o.l=function(n){var v=o.u[n];if(v===undefined)v=o.u[n]=gl.getUniformLocation(P.p,n);return v};S.P[key]=o;S.pcPend[key]=null;return o}
function m3v(m,x,y,z,o){o[0]=m[0]*x+m[4]*y+m[8]*z;o[1]=m[1]*x+m[5]*y+m[9]*z;o[2]=m[2]*x+m[6]*y+m[10]*z;return o}
var WO=new Float32Array(9),_E=[0,0,0],_N=[0,0,0],_U=[0,0,0];
/*GXCITYstart*/
/* double-precision local frame of the picked city: ENU basis in world space and the camera in ENU km (no float32 accumulation) */
var ENU={E:[0,0,0],N:[0,0,0],U:[0,0,0],cam:[0,0,0]};
function rotD(x,y,z,o){var c=Math.cos(cam.lonE),s=-Math.sin(cam.lonE),t;t=c*x+s*z;z=-s*x+c*z;x=t;
 c=Math.cos(cam.tiltE);s=Math.sin(cam.tiltE);t=c*y-s*z;z=s*y+c*z;y=t;c=Math.cos(cam.yawE);s=Math.sin(cam.yawE);t=c*x-s*y;y=s*x+c*y;x=t;
 c=Math.cos(-C.off);s=Math.sin(-C.off);t=c*y-s*z;z=s*y+c*z;y=t;o[0]=x;o[1]=y;o[2]=z;return o}
function enuUpdate(I){var la=I.lat*D2R,lo=I.lon*D2R,cla=Math.cos(la),sla=Math.sin(la),clo=Math.cos(lo),slo=Math.sin(lo);
 rotD(clo,0,-slo,ENU.E);rotD(-sla*slo,cla,-sla*clo,ENU.N);rotD(cla*slo,sla,cla*clo,ENU.U);var E=ENU.E,N=ENU.N,U=ENU.U,dx=-U[0],dy=-U[1],dz=C.d-U[2];
 ENU.cam[0]=(dx*E[0]+dy*E[1]+dz*E[2])*RE;ENU.cam[1]=(dx*N[0]+dy*N[1]+dz*N[2])*RE;ENU.cam[2]=(dx*U[0]+dy*U[1]+dz*U[2])*RE}
/*GXCITYend*/
function drawPC(L){var q=C.d<1.03,gl=S.gl,p=pcProg(q),I=DIR.info||(DIR.info=cityInfo(DIR.landLat,DIR.landLon)),t=S.t;fillPings(t);
 gl.useProgram(p.p);
 if(q){gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.bindBuffer(gl.ARRAY_BUFFER,S.tri);attribsOff(8);attrib(0,2,0,0);
  gl.uniform3f(p.l('uRt'),cam.rt[0],cam.rt[1],cam.rt[2]);gl.uniform3f(p.l('uUp'),cam.up[0],cam.up[1],cam.up[2]);gl.uniform2f(p.l('uTan'),cam.tx,cam.ty);gl.uniform2f(p.l('uSh'),cam.sx,cam.sy)}
 else{gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
  gl.bindBuffer(gl.ARRAY_BUFFER,S.sph);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,S.sphI);attribsOff(8);attrib(0,3,20,0);attrib(1,2,20,12);
  gl.uniformMatrix4fv(p.l('uMVP'),false,MVP);gl.uniformMatrix4fv(p.l('uM'),false,Mm);gl.uniform1f(p.l('uMK'),1+1.4*Math.pow(PI/(S.seg||128),2))}
 bindTex(0,S.tex.lights);bindTex(1,S.tex.pack);bindTex(2,S.nz);gl.uniform1i(p.l('uLights'),0);gl.uniform1i(p.l('uPack'),1);gl.uniform1i(p.l('uNoise'),2);
 var m=Mm;for(var c=0;c<3;c++)for(var r=0;r<3;r++)WO[c*3+r]=m[r*4+c];gl.uniformMatrix3fv(p.l('uWO'),false,WO);
 var lo=I.lon*D2R;enuUpdate(I);var E=ENU.E,N=ENU.N,U=ENU.U;
 gl.uniform3f(p.l('uE'),E[0],E[1],E[2]);gl.uniform3f(p.l('uN'),N[0],N[1],N[2]);gl.uniform3f(p.l('uU'),U[0],U[1],U[2]);
 gl.uniform3f(p.l('uCamL'),ENU.cam[0]/RE,ENU.cam[1]/RE,ENU.cam[2]/RE);
 var kx=2*cam.tx/S.w,ky=2*cam.ty/S.h;
 gl.uniform3f(p.l('uDx'),cam.rt[0]*kx,cam.rt[1]*kx,cam.rt[2]*kx);gl.uniform3f(p.l('uDy'),cam.up[0]*ky,cam.up[1]*ky,cam.up[2]*ky);gl.uniform3f(p.l('uFw'),cam.fw[0],cam.fw[1],cam.fw[2]);
 gl.uniform3f(p.l('uCam'),cam.pos[0],cam.pos[1],cam.pos[2]);gl.uniform3f(p.l('uSun'),L[0],L[1],L[2]);gl.uniform1f(p.l('uC2'),(C.d-1)*(C.d+1));
 gl.uniform1f(p.l('uT'),t);gl.uniform1f(p.l('uCloud'),C.cloudK);gl.uniform1f(p.l('uSunI'),C.sunI);gl.uniform1f(p.l('uHaze'),C.haze);gl.uniform1f(p.l('uLod'),C.lod);
 gl.uniform1f(p.l('uTL'),Math.max(C.veinK,C.tlK)*(S.q==='low'?.7:1));gl.uniform1f(p.l('uExp'),C.expo);
 gl.uniform4f(p.l('uCity'),lo,lo/TAU+.5,C.cityK,0);gl.uniform1f(p.l('uNear'),C.d<1.8?1:0);
 gl.uniform1f(p.l('uVein'),C.veinK*(S.q==='low'?.7:1));gl.uniform1f(p.l('uGr'),C.gridK);gl.uniform1f(p.l('uRpp'),2*cam.ty/S.h*Math.max(C.d-1,.02));gl.uniform1f(p.l('uHP'),S.hp?1:0);
 gl.uniform4fv(p.l('uPing[0]'),PG);gl.uniform4fv(p.l('uPingK[0]'),PK);
 gl.uniform4f(p.l('uCP0'),I.R,(90-I.grid)*D2R,I.style,I.white);gl.uniform4f(p.l('uCP1'),I.rivT,I.rivB*D2R,I.rivW/2000,I.rivO);
 gl.uniform4f(p.l('uCP2'),I.seed,I.lakes,I.sea>=0?I.sea*D2R:-9,I.seaD);gl.uniform4f(p.l('uCP3'),I.nox,I.noy,I.nh,I.hw0);gl.uniform4f(p.l('uCP4'),I.ap[0],I.ap[1],I.ap[2],I.RB);
 var hk=(C.d-1)*RE,lowK=sstep(80,12,hk);gl.uniform4f(p.l('uLow'),lowK,16+hk*5,C.rise*I.RB*1.25,bump(.02,1,C.rise));
 if(q)gl.drawArrays(gl.TRIANGLES,0,3);else{gl.drawElements(gl.TRIANGLES,S.sphN,gl.UNSIGNED_SHORT,0);gl.disable(gl.CULL_FACE)}}
/*GXCITYstart*/
/* ---------- 3D city model: instanced extruded buildings (WebGL2 instancing / ANGLE_instanced_arrays), generated once per pick ---------- */
var VS_BLD=['attribute vec3 aV,aNm;attribute vec4 aI0,aI1,aI2;uniform mat4 uVPb;uniform vec3 uCamK;uniform float uScan,uCyl,uMir;',
'varying vec3 vRel,vNm;varying vec2 vF;varying vec4 vB;varying float vSd,vHW;',
'void main(){float rs=clamp((uScan-aI2.w)/.9,0.,1.);rs=rs*rs*(3.-2.*rs);',
' float tp=mix(1.,aI1.z,aV.z);vec2 hs=aI0.zw*tp;vec2 xy=aV.xy*hs;float c=cos(aI1.y),s=sin(aI1.y);vec2 xr=vec2(c*xy.x-s*xy.y,s*xy.x+c*xy.y)+aI0.xy;',
' float zz=(aI2.x+aV.z*aI1.x)*rs;vec3 loc=vec3(xr,zz*(1.-2.*uMir)-dot(aI0.xy,aI0.xy)/12742.);vRel=loc-uCamK;',
' vNm=vec3(c*aNm.x-s*aNm.y,s*aNm.x+c*aNm.y,aNm.z);float ax=abs(aNm.x);vSd=ax>.5?aV.y:aV.x;vHW=(ax>.5?hs.y:hs.x)*1000.;if(uCyl>.5){vSd=atan(aV.y,aV.x+1e-5)/3.1416;vHW=hs.x*3141.6;}',
' vF=vec2(vSd*vHW+aI1.w*53.,(aI2.x+aV.z*aI1.x)*1000.);vB=vec4(aI1.w,aI2.y,aI2.z,(aI2.x+aI1.x)*rs);gl_Position=uVPb*vec4(vRel,1.);}'].join('\n');
var FS_BLD=['varying vec3 vRel,vNm;varying vec2 vF;varying vec4 vB;varying float vSd,vHW;uniform float uT,uPix,uFogL,uLQ,uRim,uRim2,uRefl,uRR;uniform vec3 uFog,uCamF;uniform vec4 uCP1,uCP2,uCP3;uniform sampler2D uNoise;',
'mat2 mr(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}',
/* same coast / river test as the ground shader: reflections only on water */
'float watM(vec2 p){float r=length(p);vec4 n1=texture2D(uNoise,p*.0237+uCP3.xy),n2=texture2D(uNoise,mr(.61)*p*.103+uCP3.yx),n3=texture2D(uNoise,mr(-1.13)*p*.43+uCP3.xy*1.7);',
' float lv=1.;if(uCP2.z>-5.){vec2 sv=vec2(sin(uCP2.z),cos(uCP2.z));float s=dot(p,sv)-uCP2.w+((n1.g-.5)*2.2+(n2.r-.5)*.9)*(1.5+.22*r);lv=1.-smoothstep(-3.,3.,s);}',
' lv+=.5*exp(-r*r/(uRR*uRR*.03));float w=1.-smoothstep(.47,.53,lv+(n2.b-.5)*.3+(n3.g-.5)*.14);',
' if(uCP1.x>.5){vec2 ax=vec2(sin(uCP1.y),cos(uCP1.y)),nx=vec2(ax.y,-ax.x);float rx=dot(p,ax),ry=dot(p,nx)-uCP1.w;float ph=uCP2.x*40.;float m=uCP1.x>1.5?.4:1.;',
'  float yr=m*(1.6*sin(rx*.24+ph)+.55*sin(rx*.73+ph*2.3)+.16*sin(rx*2.3+ph*.7));float sl=m*(.384*cos(rx*.24+ph)+.4015*cos(rx*.73+ph*2.3)+.368*cos(rx*2.3+ph*.7));',
'  float dy=(ry-yr)*inversesqrt(1.+sl*sl);float hw=uCP1.z*(.85+.3*n2.a)-.03;w=max(w,1.-smoothstep(hw-.02,hw,abs(dy)));}',
' return w;}',
'void main(){float rw=1.;if(uRefl>.5){vec3 M=uCamF+vRel;float sg=uCamF.z/max(uCamF.z-M.z,1e-4);vec2 G=uCamF.xy+vRel.xy*sg;rw=watM(G)*(.55+.45*texture2D(uNoise,G*vec2(9.,2.)+vec2(0.,uT*.02)).r);if(rw<.02)discard;}',
' float dist=length(vRel);float fp=max(dist*1000.*uPix,.01);vec3 n=normalize(vNm);float roof=step(.5,n.z);vec3 V=-vRel/dist;',
' vec2 w=vF/vec2(3.4,3.8);vec2 wi=floor(w),wf=fract(w);float hw=h21(wi+vB.x*113.);float lit=step(hw,vB.y);',
' float win=smoothstep(.1,.22,wf.x)*smoothstep(.9,.78,wf.x)*smoothstep(.15,.3,wf.y)*smoothstep(.92,.78,wf.y);',
' float hc=h21(wi*1.7+vB.x*7.3);vec3 wc=hc<.6?vec3(1.,.8,.55):hc<.85?vec3(.75,.86,1.):hc<.95?vec3(1.,.72,.28):vec3(.55,.07,.17);',
' float aa=max(smoothstep(.5,1.6,fp/3.4),uLQ);float bv=(.45+1.1*fract(vB.x*7.13))*(vB.z>5.5?.12:1.);float off=step(.62,fract(vB.x*3.7));wc=mix(wc,mix(vec3(.78,.88,1.),vec3(1.,.93,.82),step(.7,hc)),off*.8);vec3 wv=mix(wc*win*lit*(.5+.9*h21(wi*2.3+vB.x*3.1)),mix(vec3(1.,.78,.5),vec3(.8,.85,1.),step(.6,fract(vB.x*3.7)))*.2*vB.y*(.15+1.7*h21(floor(vF/vec2(17.,19.))+vB.x*31.)),aa)*4.2*bv;',
' if(vB.z>.5&&vB.z<1.5)wv*=vec3(1.35,1.05,.6);',
' float fres=pow(1.-clamp(dot(n,V),0.,1.),4.);float gt=fract(vB.x*5.31);vec3 gl0=gt<.35?vec3(.010,.015,.026):gt<.55?vec3(.022,.014,.008):gt<.7?vec3(.008,.018,.016):vec3(.011,.011,.013);vec3 col=gl0+wv+vec3(.16,.22,.42)*fres*.16*(1.-roof)+vec3(1.,.6,.3)*exp(-vF.y/18.)*.2*(1.-roof);',
' float tall=step(uRim,vB.w),top6=step(uRim2,vB.w);float ct=fract(vB.x*9.7);vec3 crc=ct<.25?vec3(1.,.95,.85):ct<.45?vec3(1.,.75,.3):ct<.62?vec3(.4,.7,1.):ct<.76?vec3(1.,.3,.8):ct<.88?vec3(.35,1.,.6):vec3(1.,.12,.3);float cz=vB.w*1000.-vF.y;col+=crc*tall*smoothstep(28.,6.,cz)*step(0.,cz)*(.5+.5*step(.5,fract(vF.x/4.)))*1.3*(1.-roof);float ed=(1.-abs(vSd))*vHW;col+=vec3(1.,.1,.28)*top6*smoothstep(max(fp*1.3,1.),0.,ed)*clamp(vHW*.3/fp,0.,1.)*1.2*(1.-roof);',
' col=mix(col,vec3(.018,.018,.022)+vec3(.05,.036,.026)*smoothstep(.06,.015,vB.w)+vec3(1.,.55,.3)*step(.955,h21(floor(vF*.08)+vB.x))*.7+vec3(.5,.7,1.)*step(.985,h21(floor(vF*.05)+vB.x*3.))*.6,roof);',
' if(vB.z>2.5&&vB.z<3.5)col=mix(vec3(1.,.42,.12),vec3(1.,.9,.78),step(.5,fract(vF.y/38.)))*(.55+.45*step(.5,fract((vF.x+vF.y)/7.)));',
' if(vB.z>3.5&&vB.z<4.5)col=vec3(.85,.88,1.)*.55;',
' col=mix(col,uFog,1.-exp(-dist/uFogL));col*=mix(1.,.45*rw,uRefl);col+=(h21(gl_FragCoord.xy+fract(uT*7.)*91.)-.5)*.018;gl_FragColor=vec4(tone(col),1.);}'].join('\n');
var VS_AV='attribute vec4 aA;uniform mat4 uVPb;uniform vec3 uCamK;uniform float uT,uScan,uPs;varying float vA;varying vec3 vC;\n'+
'void main(){vec3 w=vec3(aA.xy,aA.z);vC=vec3(1.,.08,.12);float bl=step(.55,fract(uT*.75+aA.w));float rs=clamp((uScan-length(aA.xy))/.9,0.,1.);\n'+
' if(aA.w>1.5){float a=aA.x+uT*.018*(fract(aA.w*7.)>.5?1.:-1.);w=vec3(cos(a),sin(a),0.)*aA.y;w.z=aA.z;rs=1.;float k=fract(uT*.9+aA.w);bl=step(k,.08)+.35;vC=k<.08?vec3(1.):vec3(1.,.15,.1);}\n'+
' vec3 rel=vec3(w.xy,w.z*rs-dot(w.xy,w.xy)/12742.)-uCamK;gl_Position=uVPb*vec4(rel,1.);gl_PointSize=uPs*5.;vA=bl*step(.98,rs);}';
var FS_AV='varying float vA;varying vec3 vC;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);float a=(smoothstep(.12,.03,d)*1.2+exp(-d*d*60.)*.22)*vA;gl_FragColor=vec4(vC*a,a);}';
/* hero landmarks from primitives: [east km, north km, half-width, half-depth, base km, height km, taper, kind]
   kind 0 glass, 1 gold-lit, 2 crimson accent, 3 lit lattice (orange/white), 4 white needle */
var LM={
'407,-740':[[2.05,4.27,.065,.03,0,.08,1,1],[2.05,4.27,.045,.025,.08,.25,.9,1],[2.05,4.27,.03,.02,.33,.05,1,1],[2.05,4.27,.015,.015,.38,.03,1,1],[2.05,4.27,.003,.003,.41,.033,1,2],
 [-.29,.3,.032,.032,0,.417,.62,0],[-.29,.3,.002,.002,.417,.124,1,4],[2.91,4.62,.025,.025,0,.24,1,0],[2.91,4.62,.015,.015,.24,.04,.4,1],[2.91,4.62,.002,.002,.28,.039,1,1]],
'252,553':[[.44,-.31,.06,.06,0,.2,.8,0],[.44,-.31,.045,.045,.2,.2,.75,0],[.44,-.31,.03,.03,.4,.18,.7,0],[.44,-.31,.018,.018,.58,.12,.6,0],[.44,-.31,.006,.006,.7,.128,.3,4]],
'437,-794':[[-.57,-.82,.012,.012,0,.45,.6,4],[-.57,-.82,.03,.03,.33,.03,1,2],[-.57,-.82,.003,.003,.45,.1,1,4]],
'31,1017':[[2.45,1.99,.022,.022,0,.38,.85,1],[2.45,1.99,.012,.012,.38,.05,.6,1],[2.45,1.99,.002,.002,.43,.022,1,4],[2.51,1.99,.022,.022,0,.38,.85,1],[2.51,1.99,.012,.012,.38,.05,.6,1],[2.51,1.99,.002,.002,.43,.022,1,4],[2.48,1.99,.03,.004,.17,.01,1,1]],
'250,1216':'t101',
'357,1397':[[5.0,-2.38,.045,.045,0,.12,.35,3],[5.0,-2.38,.016,.016,.12,.2,.4,3],[5.0,-2.38,.004,.004,.25,.083,1,3]],
'312,1215':[[3.39,.39,.04,.04,0,.632,.55,0],[3.45,.51,.026,.026,0,.42,.55,1],[3.29,.44,.03,.03,0,.492,.7,0],[2.83,1.08,.006,.006,0,.47,.5,2],[2.83,1.08,.025,.025,.1,.05,1,2],[2.83,1.08,.016,.016,.26,.03,1,2]],
'515,-1':[[3.01,-.61,.035,.035,0,.31,.1,0]],
'419,-876':[[-.49,-.12,.035,.035,0,.27,1,0],[-.49,-.12,.025,.035,.27,.1,1,0],[-.49,-.12,.017,.017,.37,.072,1,0],[-.5,-.12,.0015,.0015,.442,.085,1,4],[-.48,-.12,.0015,.0015,.442,.085,1,4],[.59,2.09,.04,.025,0,.344,.6,0],[.59,2.09,.0015,.0015,.344,.11,1,4]],
'489,24':[[-4.06,-.18,.06,.06,0,.06,.55,1],[-4.06,-.18,.033,.033,.06,.1,.4,1],[-4.06,-.18,.013,.013,.16,.14,.35,1],[-4.06,-.18,.004,.004,.3,.03,1,1]],
'247,467':[[-.57,.13,.04,.02,0,.3,.3,0]],
'223,1142':[[-1.03,-1.86,.04,.04,0,.484,.9,0],[-1.17,-3.89,.035,.035,0,.412,.8,0]],
'558,376':[[-5.16,-1.17,.03,.03,0,.37,.9,0],[-5.06,-1.1,.028,.028,0,.34,.95,0],[-5.26,-1.25,.025,.025,0,.31,.9,0],[-5.0,-1.27,.03,.03,0,.3,.9,0],[-5.3,-1.05,.024,.024,0,.27,1,0],[-5.1,-1.35,.022,.022,0,.24,1,0]],
'376,1270':[[.73,-2.09,.004,.004,.24,.236,1,4],[.73,-2.09,.02,.02,.4,.03,1,2]]};
function lmList(I){var k=Math.round(I.lat*10)+','+Math.round(I.lon*10),v=LM[k];if(v==='t101'){v=[[-.55,.44,.04,.04,0,.09,1,0]];for(var i=0;i<8;i++)v.push([-.55,.44,.03,.03,.09+i*.044,.044,1.15,0]);v.push([-.55,.44,.012,.012,.442,.05,1,0],[-.55,.44,.002,.002,.492,.016,1,4])}v=(v||[]).concat(I.ci>=0&&LMX[I.ci]||[]);return v}
/* CPU copy of the procedural noise texture -> the same coast / river / lake test the ground shader uses (one source of truth) */
function nzS(u,v,ch){var d=S.nzD;if(!d)return .5;var x=u*256-.5,y=v*256-.5,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,a0=ix&255,a1=(ix+1)&255,b0=(iy&255)*1024,b1=((iy+1)&255)*1024;
 return ((d[b0+a0*4+ch]*(1-fx)+d[b0+a1*4+ch]*fx)*(1-fy)+(d[b1+a0*4+ch]*(1-fx)+d[b1+a1*4+ch]*fx)*fy)/255}
function waterAt(I,x,y){var r=Math.hypot(x,y),c2=Math.cos(.61),s2=Math.sin(.61),c3=Math.cos(-1.13),s3=Math.sin(-1.13);
 var u2=(c2*x-s2*y)*.103+I.noy,v2=(s2*x+c2*y)*.103+I.nox,n2r=nzS(u2,v2,0),n2b=nzS(u2,v2,2),n2a=nzS(u2,v2,3);
 var n1g=nzS(x*.0237+I.nox,y*.0237+I.noy,1),n1a=nzS(x*.0237+I.nox,y*.0237+I.noy,3),n3g=nzS((c3*x-s3*y)*.43+I.nox*1.7,(s3*x+c3*y)*.43+I.noy*1.7,1);
 var lv=1;if(I.sea>=0){var sb=I.sea*D2R,sv=x*Math.sin(sb)+y*Math.cos(sb)-I.seaD+((n1g-.5)*2.2+(n2r-.5)*.9)*(1.5+.22*r);lv=1-sstep(-3,3,sv)}
 lv+=.5*Math.exp(-r*r/(I.R*I.R*.03));if(lv+(n2b-.5)*.3+(n3g-.5)*.14<.57)return true;
 if(I.rivT>.5){var rb=I.rivB*D2R,ax=[Math.sin(rb),Math.cos(rb)],rx=x*ax[0]+y*ax[1],ry=x*ax[1]-y*ax[0]-I.rivO,ph=I.seed*40,m=I.rivT>1.5?.4:1;
  var yr=m*(1.6*Math.sin(rx*.24+ph)+.55*Math.sin(rx*.73+ph*2.3)+.16*Math.sin(rx*2.3+ph*.7)),sl=m*(.384*Math.cos(rx*.24+ph)+.4015*Math.cos(rx*.73+ph*2.3)+.368*Math.cos(rx*2.3+ph*.7));
  if(Math.abs((ry-yr)/Math.sqrt(1+sl*sl))<I.rivW/2000*(.85+.3*n2a)+.06)return true}
 if(I.lakes>.01&&r>I.R*.35&&n2b*.7+n1a*.3>.8-I.lakes*.2)return true;return false}
/* deterministic city model: blocks on the same street grid as the ground shader, height field = CBD peaks + belts, tallest kept */
function genCity(I){var low=S.q==='low',maxN=low?1500:6000,r=rng(((I.seed*4294967296)>>>0)^1540483477),RB=I.RB,R=I.R;
 var g=I.style===0?.1:.13,ang=(90-I.grid)*D2R,ca=Math.cos(ang),sa=Math.sin(ang),T=I.T||.2,mid=I.mid||.02,sky=I.sky||0;
 var dens=clamp(Math.sqrt((I.pop||3)/12),.3,1),sg=clamp(.45+Math.sqrt(sky)/24,.45,1.4);
 var lm=lmList(I),cores=[],i,j,k,cb=I.cbd||[[0,0,1]];for(i=0;i<cb.length;i++)cores.push([cb[i][0],cb[i][1],cb[i][2],sg*(.55+.5*cb[i][2])]);
 for(i=0;i<lm.length;i++)if(lm[i][5]>.15){var dup=0;for(k=0;k<cores.length;k++)if(Math.abs(cores[k][0]-lm[i][0])+Math.abs(cores[k][1]-lm[i][1])<.4)dup=1;if(!dup)cores.push([lm[i][0],lm[i][1],.75,sg*.55])}
 var cand=[],NB=Math.ceil(RB/g),sw=0,kd=Math.min(1,maxN*1.3/(PI*RB*RB/(g*g)*1.6));
 for(i=-NB;i<NB;i++)for(j=-NB;j<NB;j++){var u=(i+.5)*g,v=(j+.5)*g,x=ca*u-sa*v,y=sa*u+ca*v,rr=Math.hypot(x,y);if(rr>RB)continue;
  var H=0,Ht=0;for(k=0;k<cores.length;k++){var c=cores[k],dx=x-c[0],dy=y-c[1],e=(dx*dx+dy*dy)/(c[3]*c[3]);if(e<9){var hv=c[2]*Math.exp(-e);H=Math.max(H,hv);if(c[2]>=.5)Ht=Math.max(Ht,hv)}}
  var pB=Math.min(1,.22+.6*dens*Math.exp(-rr*rr/(RB*RB*.35))+1.2*H);if(H<.12)pB*=kd;if(r()>pB||waterAt(I,x,y))continue;
  var bs=g-.026;
  if(H<.06&&rr>RB*.3&&r()<.13){cand.push([x,y,bs/2*(.85+.15*r()),bs/2*(.45+.4*r()),0,.007+.006*r(),1,r(),.05,6,rr,0]);continue}
  var nl=H>.25?(r()<.5?2:4):(r()<.35?2:1);
  for(var l=0;l<nl;l++){var lu=0,lv=0,lw=bs/2,ld=bs/2;if(nl===2){lu=(l?.25:-.25)*bs;lw=bs/4-.004}else if(nl===4){lu=(l&1?.25:-.25)*bs;lv=(l&2?.25:-.25)*bs;lw=ld=bs/4-.004}
   var sh=.7+.24*r(),hh=Math.max(.007,mid*(.3+1.4*Math.pow(r(),1.6))*(.45+.9*H)*(.55+.6*Math.exp(-2*rr/RB))),cu=u+lu,cv=v+lv,w2=Ht*Ht*Ht;sw+=w2;
   cand.push([ca*cu-sa*cv,sa*cu+ca*cv,lw*sh,ld*sh*(.8+.25*r()),0,hh,1,r(),.16+.25*Math.min(1,H*1.5)+.12*r(),0,rr,w2])}}
 /* skyscrapers: the city's real count (>150 m) distributed over the CBD weights, heights up to the real tallest */
 var NT=Math.min(sky*.85,low?300:900),lmT=0;for(k=0;k<lm.length;k++)lmT=Math.max(lmT,lm[k][4]+lm[k][5]);
 if(sw>0)for(i=0;i<cand.length;i++){var cc=cand[i];if(cc[9]===6)continue;var pt=(NT+3)*cc[11]/sw;
  if(r()<pt){var th=T>.16?.15+(Math.min(T*.88,.42)-.15)*Math.pow(r(),2.6):Math.max(cc[5],T*(.55+.4*r()));cc[5]=Math.max(cc[5],th);cc[6]=th>.14?.74+.24*r():1;
   cc[2]=Math.max(cc[2],.016+.014*r());cc[3]=Math.max(cc[3],.016+.014*r());cc[8]=.3+.3*r();if(th>.12&&r()<.22)cc[9]=5}}
 var out=[];for(i=0;i<cand.length;i++){var ok=1;for(k=0;k<lm.length;k++)if(Math.hypot(cand[i][0]-lm[k][0],cand[i][1]-lm[k][1])<.13){ok=0;break}if(ok)out.push(cand[i])}
 out.sort(function(a,b){return b[5]-a[5]});
 if(out.length&&lmT<T*.85&&(out[0][11]||0)>.03){out[0][5]=T;out[0][6]=.6;out[0][2]=Math.max(out[0][2],.03);out[0][3]=Math.max(out[0][3],.03)}
 var room=maxN-lm.length,ext=[];
 for(i=0;i<Math.min(out.length,Math.floor(room*.05));i++){var b=out[i];if(b[5]<.09)break;
  if(b[9]!==5)ext.push([b[0],b[1],b[2]*.62,b[3]*.62,b[5],.012+.025*r(),.7,b[7]+.31,b[8],0,b[10]]);
  if(b[5]>.12)ext.push([b[0],b[1],b[2]*1.9,b[3]*1.7,0,.016+.02*r(),1,b[7]+.53,.35,0,b[10]]);
  if(i<room*.01)ext.push([b[0],b[1],.0025,.0025,b[5]+.012,.03+.05*r(),1,b[7]+.7,0,4,b[10]])}
 out=out.slice(0,Math.max(0,room-ext.length)).concat(ext);
 for(k=0;k<lm.length;k++){var q=lm[k];out.push([q[0],q[1],q[2],q[3],q[4],q[5],q[6],r(),.5,q[7],Math.hypot(q[0],q[1])])}
 var nb=0,nc=0;for(i=0;i<out.length;i++)if(out[i][9]===5)nc++;else nb++;
 var f=new Float32Array(nb*12),fc=new Float32Array(Math.max(1,nc)*12),av=[],top=[0,0,0],ib=0,ic=0,gw=0,gx=0,gy=0,g2=0;
 for(i=0;i<out.length;i++){var o=out[i],A=o[9]===5?fc:f,ix=o[9]===5?(ic++)*12:(ib++)*12;
  A[ix]=o[0];A[ix+1]=o[1];A[ix+2]=o[2];A[ix+3]=o[3];A[ix+4]=o[5];A[ix+5]=ang;A[ix+6]=o[6];A[ix+7]=o[7];A[ix+8]=o[4];A[ix+9]=o[8];A[ix+10]=o[9];A[ix+11]=o[10];
  var zt=o[4]+o[5];if(zt>.2)av.push(o[0],o[1],zt+.002,r());if(zt>top[2]){top[0]=o[0];top[1]=o[1];top[2]=zt}if(zt>.08){var ww=(zt-.06)*(zt-.06);gw+=ww;gx+=o[0]*ww;gy+=o[1]*ww;g2+=(o[0]*o[0]+o[1]*o[1])*ww}}
 /* the landed camera aims at the densest skyline cluster; with a second strong cluster it looks along the line from the first to it */
 if(gw>0){var cl=[],cbs=(I.cbd||[]).concat(lm.length?[[lm[0][0],lm[0][1],1]]:[]);
  for(k=0;k<cbs.length;k++){var c0=cbs[k];if(Math.hypot(c0[0],c0[1])>RB*.8)continue;var sc=0,sx=0,sy=0;
   for(i=0;i<out.length;i++){var o2=out[i],z2=o2[4]+o2[5];if(z2<=.08)continue;var d2=Math.hypot(o2[0]-c0[0],o2[1]-c0[1]);if(d2<1.2){var w3=(z2-.06)*(z2-.06);sc+=w3;sx+=o2[0]*w3;sy+=o2[1]*w3}}
   if(sc>0)cl.push([sx/sc,sy/sc,sc])}
  cl.sort(function(a,b){return b[2]-a[2]});
  if(cl.length){I.aim=[cl[0][0],cl[0][1]];for(k=1;k<cl.length;k++){var dd2=Math.hypot(cl[k][0]-cl[0][0],cl[k][1]-cl[0][1]);if(dd2>1.5&&dd2<7&&cl[k][2]>cl[0][2]*.25){I.yaw=Math.atan2(cl[k][0]-cl[0][0],cl[k][1]-cl[0][1]);var of=0;I.aim=[cl[0][0]+Math.sin(I.yaw)*of,cl[0][1]+Math.cos(I.yaw)*of];break}}}}
 /* a few aircraft on approach / passing (w>1 marks a moving light) */
 for(i=0;i<(low?2:5);i++)av.push(r()*TAU,4+r()*10,.5+r()*1.2,2+r());
 var hs=[];for(i=0;i<out.length;i++)hs.push(out[i][4]+out[i][5]);hs.sort(function(a,b){return b-a});var n=out.length;
 return {f:f,n:nb,fc:fc,nc:nc,av:new Float32Array(av),nav:av.length/4,top:top,rim:Math.max(.1,hs[Math.min(19,n-1)]||9)-1e-4,rim2:Math.max(.12,hs[Math.min(5,n-1)]||9)-1e-4}}
function cylGeo(){var v=[],N=16;for(var i=0;i<N;i++){var a0=i/N*TAU,a1=(i+1)/N*TAU,am=(a0+a1)/2,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1),cm=Math.cos(am),sm=Math.sin(am);
 v.push(c0,s0,0,cm,sm,0, c1,s1,0,cm,sm,0, c1,s1,1,cm,sm,0, c0,s0,0,cm,sm,0, c1,s1,1,cm,sm,0, c0,s0,1,cm,sm,0, 0,0,1,0,0,1, c0,s0,1,0,0,1, c1,s1,1,0,0,1)}return new Float32Array(v)}
function boxGeo(){var v=[],F=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1]];
 F.forEach(function(n){var q;if(n[2])q=[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];else if(n[0])q=[[n[0],-1,0],[n[0],1,0],[n[0],1,1],[n[0],-1,1]];else q=[[-1,n[1],0],[1,n[1],0],[1,n[1],1],[-1,n[1],1]];
  [0,1,2,0,2,3].forEach(function(i){v.push(q[i][0],q[i][1],q[i][2],n[0],n[1],n[2])})});return new Float32Array(v)}
function bldProg(){if(S.bFail||!S.gl)return null;var k=S.q==='low'?'gcbl':'gcbh';if(S.P[k]&&S.P.gcav)return S.P[k];
 try{if(!S.P[k])program(k,VS_BLD,HP+HASH+TONE+FS_BLD,['aV','aNm','aI0','aI1','aI2']);if(!S.P.gcav)program('gcav',VS_AV,HP+FS_AV,['aA']);return S.P[k]}catch(e){S.bFail=1;S.err=e;try{console.warn('GX city model disabled: '+e.message)}catch(_){}return null}}
/* build (or rebuild) the model for the picked city; < ~30 ms, buffers reused */
function cityModel(I){if(!S.gl||S.bFail||!I)return;var t0=performance.now(),gl=S.gl;
 try{var m=genCity(I);if(!S.bgeo)S.bgeo=buf(boxGeo());if(!S.bib)S.bib=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,S.bib);gl.bufferData(gl.ARRAY_BUFFER,m.f,gl.STATIC_DRAW);
  if(!S.bav)S.bav=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,S.bav);gl.bufferData(gl.ARRAY_BUFFER,m.av.length?m.av:new Float32Array(4),gl.STATIC_DRAW);
  if(!S.bcg)S.bcg=buf(cylGeo());if(!S.bic)S.bic=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,S.bic);gl.bufferData(gl.ARRAY_BUFFER,m.fc,gl.STATIC_DRAW);S.bNC=m.nc;
  S.bN=m.n;S.bAV=m.nav;S.bTop=m.top;S.bRim=m.rim;S.bRim2=m.rim2;S.bKey=I.lat+','+I.lon+','+S.q;S.bMs=performance.now()-t0}catch(e){S.bFail=1;S.err=e}}
var VPB=new Float32Array(16),VMB=new Float32Array(16),PMB=new Float32Array(16);
function d3(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function drawBld(I){var gl=S.gl,p=bldProg();if(!p||!S.bN)return;var E=ENU.E,N=ENU.N,U=ENU.U,rt=cam.rt,up=cam.up,fw=cam.fw;
 var M=VMB;M[0]=d3(rt,E);M[1]=d3(up,E);M[2]=-d3(fw,E);M[3]=0;M[4]=d3(rt,N);M[5]=d3(up,N);M[6]=-d3(fw,N);M[7]=0;M[8]=d3(rt,U);M[9]=d3(up,U);M[10]=-d3(fw,U);M[11]=0;M[12]=M[13]=M[14]=0;M[15]=1;
 mpersp(C.fov*D2R,S.asp,.02,800,cam.sx,cam.sy,PMB);mmul(PMB,VMB,VPB);
 var hk=(C.d-1)*RE,scan=C.rise*I.RB*1.25,c=ENU.cam;
 gl.clear(gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);
 gl.useProgram(p.p);gl.uniformMatrix4fv(p.l('uVPb'),false,VPB);gl.uniform3f(p.l('uCamK'),c[0],c[1],c[2]);gl.uniform1f(p.l('uScan'),scan);
 gl.uniform1f(p.l('uT'),S.t);gl.uniform1f(p.l('uPix'),2*cam.ty/S.h);gl.uniform1f(p.l('uFogL'),16+hk*5);gl.uniform3f(p.l('uFog'),.006,.010,.024);gl.uniform1f(p.l('uLQ'),S.q==='low'?1:0);gl.uniform1f(p.l('uRim'),S.bRim||9);gl.uniform1f(p.l('uRim2'),S.bRim2||9);gl.uniform1f(p.l('uCyl'),0);
 bindTex(0,S.nz);gl.uniform1i(p.l('uNoise'),0);gl.uniform3f(p.l('uCamF'),c[0],c[1],c[2]);gl.uniform1f(p.l('uRR'),I.R);
 gl.uniform4f(p.l('uCP1'),I.rivT,I.rivB*D2R,I.rivW/2000,I.rivO);gl.uniform4f(p.l('uCP2'),I.seed,I.lakes,I.sea>=0?I.sea*D2R:-9,I.seaD);gl.uniform4f(p.l('uCP3'),I.nox,I.noy,I.nh,I.hw0);
 var nm=S.q==='low'?1:2;for(var mi=nm-1;mi>=0;mi--){gl.uniform1f(p.l('uMir'),mi);gl.uniform1f(p.l('uRefl'),mi);gl.uniform1f(p.l('uCyl'),0);
 attribsOff(8);gl.bindBuffer(gl.ARRAY_BUFFER,S.bgeo);attrib(0,3,24,0);attrib(1,3,24,12);gl.bindBuffer(gl.ARRAY_BUFFER,S.bib);attrib(2,4,48,0,1);attrib(3,4,48,16,1);attrib(4,4,48,32,1);
 drawInst(gl.TRIANGLES,0,30,S.bN);attribsOff(8);S.bDr=(S.bDr|0)+1;
 if(S.bNC&&S.bcg){gl.uniform1f(p.l('uCyl'),1);gl.bindBuffer(gl.ARRAY_BUFFER,S.bcg);attrib(0,3,24,0);attrib(1,3,24,12);gl.bindBuffer(gl.ARRAY_BUFFER,S.bic);attrib(2,4,48,0,1);attrib(3,4,48,16,1);attrib(4,4,48,32,1);drawInst(gl.TRIANGLES,0,144,S.bNC);attribsOff(8)}}
 if(S.bAV){var q=S.P.gcav;gl.useProgram(q.p);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.depthMask(false);gl.depthFunc(gl.LEQUAL);
  gl.uniformMatrix4fv(q.l('uVPb'),false,VPB);gl.uniform3f(q.l('uCamK'),c[0],c[1],c[2]);gl.uniform1f(q.l('uT'),S.t);gl.uniform1f(q.l('uScan'),scan);gl.uniform1f(q.l('uPs'),Math.max(1.5,2.6*S.h/860));
  gl.bindBuffer(gl.ARRAY_BUFFER,S.bav);attrib(0,4,16,0);gl.drawArrays(gl.POINTS,0,S.bAV);attribsOff(8);gl.depthMask(true)}
 if(S.q!=='low'&&S.bTop&&S.bTop[2]>.1)beam(c,scan);
 gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND)}
/* signature: one slow crimson searchlight cone from the tallest tower (additive, depth-tested, no allocations) */
var VS_BEAM='attribute vec3 aP;attribute vec2 aT;uniform mat4 uVPb;uniform vec3 uCamK;varying vec2 vT;void main(){vT=aT;gl_Position=uVPb*vec4(aP-uCamK,1.);}';
var FS_BEAM='varying vec2 vT;uniform float uA;void main(){float e=1.-abs(vT.y);float a=e*e*pow(1.-vT.x,1.6)*smoothstep(0.,.03,vT.x)*uA;gl_FragColor=vec4(vec3(1.,.12,.3)*a,a);}';
var BMV=new Float32Array(20);
function beam(c,scan){var gl=S.gl;if(!S.P.gcbeam){try{program('gcbeam',VS_BEAM,HP+FS_BEAM,['aP','aT'])}catch(e){S.bTop=null;return}}
 var t=S.bTop,a=S.t*.12+t[0],L=22,dx=Math.cos(a)*.42,dy=Math.sin(a)*.42,dz=.9,dl=Math.hypot(dx,dy,dz);dx/=dl;dy/=dl;dz/=dl;
 var p0x=t[0],p0y=t[1],p0z=t[2]+.01,p1x=p0x+dx*L,p1y=p0y+dy*L,p1z=p0z+dz*L,vx=(p0x+p1x)/2-c[0],vy=(p0y+p1y)/2-c[1],vz=(p0z+p1z)/2-c[2];
 var sx=dy*vz-dz*vy,sy=dz*vx-dx*vz,sz=dx*vy-dy*vx,sl=Math.hypot(sx,sy,sz)||1,w0=.006/sl,w1=2.4/sl;
 BMV[0]=p0x-sx*w0;BMV[1]=p0y-sy*w0;BMV[2]=p0z-sz*w0;BMV[3]=0;BMV[4]=-1;BMV[5]=p0x+sx*w0;BMV[6]=p0y+sy*w0;BMV[7]=p0z+sz*w0;BMV[8]=0;BMV[9]=1;
 BMV[10]=p1x-sx*w1;BMV[11]=p1y-sy*w1;BMV[12]=p1z-sz*w1;BMV[13]=1;BMV[14]=-1;BMV[15]=p1x+sx*w1;BMV[16]=p1y+sy*w1;BMV[17]=p1z+sz*w1;BMV[18]=1;BMV[19]=1;
 if(!S.bbm){S.bbm=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,S.bbm);gl.bufferData(gl.ARRAY_BUFFER,BMV,gl.DYNAMIC_DRAW)}else{gl.bindBuffer(gl.ARRAY_BUFFER,S.bbm);gl.bufferSubData(gl.ARRAY_BUFFER,0,BMV)}
 var q=S.P.gcbeam;gl.useProgram(q.p);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.depthMask(false);gl.depthFunc(gl.LEQUAL);
 gl.uniformMatrix4fv(q.l('uVPb'),false,VPB);gl.uniform3f(q.l('uCamK'),c[0],c[1],c[2]);gl.uniform1f(q.l('uA'),.2*sstep(.85,1,C.rise));
 attrib(0,3,20,0);attrib(1,2,20,12);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);attribsOff(8);gl.depthMask(true)}
/*GXCITYend*/
function render(){
 var gl=S.gl;if(!gl||S.lost)return;resize();
 buildCam();
 if(BH.on&&bhDraw())return;/*GXS*/
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
 bgGxs(p);/*GXS*/
 gl.drawArrays(gl.TRIANGLES,0,3);
 /* 2 planet */
 if(S.ready&&C.pl>0&&C.cityK>.001&&pcProg(C.d<1.03)){drawPC(L)}
 else if(S.ready&&C.pl>0){gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
  p=S.P.pl;gl.useProgram(p.p);gl.bindBuffer(gl.ARRAY_BUFFER,S.sph);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,S.sphI);attribsOff(8);attrib(0,3,20,0);attrib(1,2,20,12);
  bindTex(0,S.tex.lights);bindTex(1,S.tex.pack);bindTex(2,S.nz);gl.uniform1i(p.l('uLights'),0);gl.uniform1i(p.l('uPack'),1);gl.uniform1i(p.l('uNoise'),2);
  gl.uniformMatrix4fv(p.l('uMVP'),false,MVP);gl.uniformMatrix4fv(p.l('uM'),false,Mm);gl.uniform3f(p.l('uCam'),cam.pos[0],cam.pos[1],cam.pos[2]);gl.uniform3f(p.l('uSun'),L[0],L[1],L[2]);
  gl.uniform1f(p.l('uT'),t);gl.uniform1f(p.l('uVein'),C.veinK*(S.q==='low'?.7:1));gl.uniform1f(p.l('uTL'),Math.max(C.veinK,C.tlK)*(S.q==='low'?.7:1));gl.uniform1f(p.l('uCloud'),C.cloudK);gl.uniform1f(p.l('uGr'),C.gridK);
  var rpp=2*cam.ty/H*Math.max(C.d-1,.02);gl.uniform1f(p.l('uRpp'),rpp);gl.uniform1f(p.l('uLod'),C.lod);gl.uniform1f(p.l('uSunI'),C.sunI);gl.uniform1f(p.l('uHP'),S.hp&&S.q!=='low'?1:(S.hp?1:0));gl.uniform1f(p.l('uHaze'),C.haze);
  fillPings(t);
  gl.uniform4fv(p.l('uPing[0]'),PG);gl.uniform4fv(p.l('uPingK[0]'),PK);
  gl.drawElements(gl.TRIANGLES,S.sphN,gl.UNSIGNED_SHORT,0);gl.disable(gl.CULL_FACE)}
 /*GXCITYstart*/if(S.ready&&C.cityK>.5&&C.rise>.001&&(C.d-1)*RE<120&&DIR.info&&!S.bFail){if(S.bKey!==DIR.info.lat+','+DIR.info.lon+','+S.q)cityModel(DIR.info);drawBld(DIR.info)}/*GXCITYend*/
 /* 3 atmosphere */
 if(C.atm>0){gl.disable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);p=S.P['at'];gl.useProgram(p.p);gl.bindBuffer(gl.ARRAY_BUFFER,S.quad);attribsOff(8);attrib(0,2,0,0);
  var rr=Math.min(2.2,Math.max(rN*1.5,rN+.25));var bx0=ctr.nx-rr/asp,bx1=ctr.nx+rr/asp,by0=ctr.ny-rr,by1=ctr.ny+rr;
  if(C.d<2.6){bx0=-1;by0=-1;bx1=1;by1=1}else{bx0=Math.max(-1,bx0);by0=Math.max(-1,by0);bx1=Math.min(1,bx1);by1=Math.min(1,by1)}
  if(bx1>bx0&&by1>by0){gl.uniform4f(p.l('uBox'),bx0,by0,bx1,by1);gl.uniform3f(p.l('uCam'),cam.pos[0],cam.pos[1],cam.pos[2]);gl.uniform3f(p.l('uSun'),L[0],L[1],L[2]);
   gl.uniform3f(p.l('uRt'),cam.rt[0],cam.rt[1],cam.rt[2]);gl.uniform3f(p.l('uUp'),cam.up[0],cam.up[1],cam.up[2]);gl.uniform3f(p.l('uFw'),cam.fw[0],cam.fw[1],cam.fw[2]);
   gl.uniform2f(p.l('uTan'),cam.tx,cam.ty);gl.uniform2f(p.l('uSh'),cam.sx,cam.sy);gl.uniform1f(p.l('uSunI'),C.sunI);gl.uniform1f(p.l('uAtm'),C.atm*C.pl);gl.uniform1f(p.l('uT'),t);gl.uniform1f(p.l('uAS'),C.atmS);
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
 if(DIR.cap)bhCapture();/*GXS*/
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
 if(!S.noSpin)C.lon-=C.spin*dt;else if(DIR.st==='land')C.yaw+=.0026*dt;
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
var DIR={st:'idle',id:0,k:1,onStage:null,landLat:0,landLon:0,info:null,dv:null};
function nid(){S.tw.length=0;S.tl.length=0;return ++DIR.id}
function G(id,fn){return function(){if(id===DIR.id)fn()}}
function stage(n){DIR.st=n;if(DIR.onStage)try{DIR.onStage(n)}catch(e){}}
function PS(kind,asp){
 asp=asp||S.asp||1.78;var L=layout(kind,asp);
 if(kind==='idle')return {fov:L.fov,d:L.d,shX:L.shX,shY:L.shY,pitch:0,tilt:.42,sunR:L.sunR,sunA:L.sunA,sunAbs:0,sunI:1,sunVis:.35,ringK:1,band:1,veinK:1,cloudK:1,gridK:.6,atm:1,lod:0,haze:0,warp:0,flash:0,entry:0,vpx:0,vpy:0,shake:0,pl:1,spin:.03,fade:1,off:0,yaw:0,cityK:0,atmS:1,expo:1,tlK:0,rise:0};
 if(kind==='map')return {fov:L.fov,d:L.d,shX:L.shX,shY:L.shY,pitch:0,sunR:L.sunR,sunA:L.sunA,sunAbs:0,sunI:1,sunVis:.55,ringK:.5,band:.25,veinK:1,cloudK:1,gridK:1,atm:1,lod:0,haze:0,warp:0,flash:0,entry:0,vpx:0,vpy:0,shake:0,pl:1,spin:0,fade:1,off:0,yaw:0,cityK:0,atmS:1,expo:1,tlK:0,rise:0};
 return landPS(asp,DIR.info||(DIR.info=cityInfo(DIR.landLat,DIR.landLon)))}
/* landing geometry: altitude from the city size, oblique view with the city below the frame centre and the horizon near the top */
function landGeo(asp,I){var por=asp<1,h=I.h*(por?1.15:1),d=1+h/RE,fov=por?64:50,T=Math.tan(fov*D2R/2),Yh=por?.7:.78,Yc=por?.02:-.2;
 var psi=Math.asin(1/d),p=psi-Math.atan(Yh*T),phi=p+Math.atan(Yc*T);return {d:d,fov:fov,pitch:p,off:solveOff(d,phi),psi:psi,h:h}}
/* ground offset (rad) that puts the city at angle phi from the nadir, seen from distance d */
function solveOff(d,phi){var lo=0,hi=Math.acos(clamp(1/d,0,1));for(var i=0;i<46;i++){var m=(lo+hi)/2;if(Math.atan2(Math.sin(m),d-Math.cos(m))<phi)lo=m;else hi=m}return (lo+hi)/2}
/* a light direction at angle g from the nadir and azimuth az (camera frame) -> the engine's (sunAbs, sunA) for pitch p */
function sunDir(g,az,p){var x=Math.sin(g)*Math.cos(az),y=Math.sin(g)*Math.sin(az),z=-Math.cos(g),cp=Math.cos(p),sp=Math.sin(p);
 return {sunAbs:Math.max(1e-4,Math.acos(clamp(y*sp-z*cp,-1,1))),sunA:Math.atan2(y*cp+z*sp,x)}}
var SUNG=.1,SUNAZ=PI/2+.3;
function landPS(asp,I){var G=landGeo(asp,I),sd=sunDir(G.psi-SUNG,SUNAZ,G.pitch);
 return {fov:G.fov,d:G.d,shX:asp<1?0:clamp(S.landSX||0,-.3,.3),shY:0,pitch:G.pitch,off:G.off,yaw:I.yaw,sunAbs:sd.sunAbs,sunA:sd.sunA,sunR:1,sunI:.4,sunVis:.35,ringK:0,band:0,veinK:0,cloudK:.25,gridK:0,atm:.6,atmS:.2,lod:1,haze:.55,warp:0,flash:0,entry:0,vpx:0,vpy:0,shake:0,pl:1,spin:0,fade:1,cityK:1,expo:1,tlK:1,rise:1}}
function sunRel(){if(C.sunAbs>0){C.sunR=C.sunAbs/Math.asin(clamp(1/C.d,.05,1));C.sunAbs=0}}
function cityAim(lat,lon){return {lon:shortLon(C.lon,lon*D2R),tilt:clamp(lat*D2R,-1.1,1.1)}}
function snapC(){var o={};for(var k in C)o[k]=C[k];return o}
function wrapA(a){return ((a%TAU)+TAU+PI)%TAU-PI}
function bump(a,b,x){var u=clamp((x-a)/(b-a),0,1);return Math.sin(u*PI)}
/* the continuous dive: one parameter s (0 = globe with the pin, 1 = landed). Altitude is interpolated in log space
   (constant perceived zoom speed); the obliqueness grows late, and pitch is solved every frame so the city stays exactly
   on its screen track (the DOM pin follows it through GX.project). Reversible: back() runs it from 1 to 0. */
function diveApply(s){var V=DIR.dv;if(!V)return;var A=V.a,B=V.b;
 var ea=1-Math.pow(1-Math.pow(s,1.5),2.5),ob=sstep(.32,1,s);
 var hA=Math.max(1,(A.d-1)*RE),hB=(B.d-1)*RE;C.d=1+Math.exp(mix(Math.log(hA),Math.log(hB),ea))/RE;
 C.fov=mix(A.fov,B.fov,sstep(.15,.9,s));var rot=sstep(0,.5,s);C.lon=mix(A.lon,B.lon,rot);C.tilt=mix(A.tilt,B.tilt,rot);
 C.yaw=A.yaw+wrapA(B.yaw-A.yaw)*sstep(.12,1,s);C.shX=mix(A.shX,B.shX,sstep(0,.6,s));C.shY=mix(A.shY,0,sstep(.1,.8,s));
 var phiB=Math.atan2(Math.sin(B.off),B.d-Math.cos(B.off)),phi=phiB*ob;C.off=phi>1e-7?solveOff(C.d,phi):0;
 var Yb=Math.tan(phiB-B.pitch)/Math.tan(B.fov*D2R/2),Y=Yb*ob;C.pitch=phi-Math.atan(Y*Math.tan(C.fov*D2R/2));
 var al=Math.asin(clamp(1/C.d,0,1)),aA=Math.asin(clamp(1/A.d,0,1)),gA=A.sunAbs>0?A.sunAbs:A.sunR*aA,psB=Math.asin(clamp(1/B.d,0,1));
 var g=al*mix(gA/aA,(psB-SUNG)/psB,sstep(.25,1,s)),sd=sunDir(g,mix(A.sunA,SUNAZ,sstep(.15,.9,s)),C.pitch);C.sunAbs=sd.sunAbs;C.sunA=sd.sunA;C.sunR=1;
 C.sunI=mix(A.sunI,B.sunI,s);C.sunVis=mix(A.sunVis,B.sunVis,s);
 C.cloudK=mix(A.cloudK,B.cloudK,sstep(.3,.85,s));C.veinK=mix(A.veinK,0,sstep(0,.2,s));C.gridK=mix(A.gridK,0,sstep(0,.18,s));
 C.tlK=1;C.ringK=mix(A.ringK,0,sstep(0,.3,s));C.band=mix(A.band,0,sstep(0,.3,s));C.cityK=mix(A.cityK,1,sstep(.21,.5,s));C.lod=sstep(.15,.8,s);C.haze=sstep(.3,.95,s);
 C.atmS=Math.exp(Math.log(B.atmS)*sstep(.3,1,s));C.spin=0;C.flash=0;C.fade=1;
 C.entry=.1*bump(.4,.78,s)*V.fx;C.warp=.07*bump(.16,.56,s)*V.fx;C.shake=.18*bump(.25,.7,s)*V.fx;C.vpx=C.shX;C.vpy=C.shY+Y;
 /*GXCITYstart*/var hkm=(C.d-1)*RE;C.rise=sstep(0,1,(Math.log(30)-Math.log(Math.max(hkm,.1)))/(Math.log(30)-Math.log(6.5)));if(V.fwd&&V.e1&&!V.m&&hkm<30){V.m=1;stage('model')}/*GXCITYend*/
 if(V.fwd&&!V.e1&&s>=.42){V.e1=1;stage('entry')}}
function fadePings(){for(var i=0;i<S.pings.length;i++){var pg=S.pings[i];pg.life=Math.min(pg.life,S.t-pg.t0+1.2)}}
/*GXCITYstart*/
/* the landed camera aims at the main CBD (real offset from the city point), not at the table coordinate */
function landLL(lat,lon){var I=DIR.info;if(!I||!I.aim)return [lat,lon];return [lat+I.aim[1]/111.2,lon+I.aim[0]/(111.2*Math.cos(lat*D2R))]}
/*GXCITYend*/
function landTarget(){var LL=landLL(DIR.landLat,DIR.landLon),a=cityAim(LL[0],LL[1]),B=PS('land');B.lon=a.lon;B.tilt=a.tilt;return B}
function runDive(id,V,to,ms,ease,done){DIR.dv=V;tween({dv:to},ms,ease,0,G(id,function(){DIR.dv=null;apply(to?V.b:V.a);done()}))}
var dir={
 state:function(){return DIR.st},
 stage:function(f){DIR.onStage=f},
 speed:function(k){DIR.k=k>0?k:1},
 info:function(){return DIR.info},
 snap:function(kind,aim,info){nid();DIR.dv=null;if(aim){DIR.landLat=aim[0];DIR.landLon=aim[1];DIR.info=info||cityInfo(aim[0],aim[1]);/*GXCITYstart*/if(kind==='land')cityModel(DIR.info);/*GXCITYend*/}
  var o=PS(kind);if(aim){var LL=kind==='land'?landLL(aim[0],aim[1]):aim,a=cityAim(LL[0],LL[1]);o.lon=a.lon;o.tilt=a.tilt}apply(o);C.dv=kind==='land'?1:0;S.noSpin=kind!=='idle';DIR.st=kind==='map'?'map':kind==='land'?'land':'idle'},
 relayout:function(){var k=DIR.st;if(k==='idle'||k==='map'||k==='land'){var o=PS(k);delete o.tilt;delete o.lon;if(k==='land')delete o.yaw;apply(o)}},
 /* arrive out of light speed and settle into the idle globe */
 intro:function(){var id=nid(),k=DIR.k;S.noSpin=0;DIR.dv=null;var o=PS('idle');apply(o);
  apply({warp:1,flash:.85,fade:0,fov:64,d:o.d*.62,vpx:o.shX*.9,vpy:o.shY*.9,spin:.5,sunI:1.8,shake:.7});DIR.st='intro';
  tween({fade:1},320*k,EASE.o3);tween({flash:0},900*k,EASE.o3,120*k);
  tween({warp:0},1500*k,EASE.o3,150*k);tween({fov:o.fov,d:o.d,spin:.03,sunI:1,shake:0},2300*k,EASE.o5,0,G(id,function(){stage('idle')}))},
 /* idle -> centred globe, rotates to the picked city, drops a pin, then one continuous dive down to the city at night */
 pick:function(lat,lon,info){var id=nid(),k=DIR.k,M=PS('map'),aim=cityAim(lat,lon);DIR.landLat=lat;DIR.landLon=lon;DIR.info=info||cityInfo(lat,lon);DIR.dv=null;S.noSpin=1;C.spin=0;DIR.st='map-in';/*GXCITYstart*/cityModel(DIR.info);/*GXCITYend*/
  var mo={};for(var q in M)if(q!=='spin')mo[q]=M[q];mo.veinK=0;mo.cityK=1;mo.gridK=.3;mo.tlK=1;C.tlK=1;
  tween(mo,950*k,EASE.io3,0,G(id,function(){stage('map')}));
  at(180*k,G(id,function(){tween({lon:aim.lon,tilt:aim.tilt},1100*k,EASE.io3,0,G(id,function(){stage('pin')}))}));
  at(1850*k,G(id,function(){fadePings();C.dv=0;runDive(id,{a:snapC(),b:landTarget(),fx:1,fwd:1,e1:0},1,6600*k,EASE.lin,function(){stage('land')});stage('dive')}))},
 /* finish the dive quickly (Enter / Esc / click): same final view, no cut */
 skip:function(){var id=nid(),k=DIR.k,V=DIR.dv;
  if(V&&V.fwd){V.fx=.6;runDive(id,V,1,Math.max(380,(1-C.dv)*1500)*k,EASE.o3,function(){stage('land')});return}
  C.dv=0;runDive(id,{a:snapC(),b:landTarget(),fx:.6,fwd:1,e1:1},1,1400*k,EASE.io2,function(){stage('land')})},
 /* landing -> reverse dive to the centred globe -> idle */
 back:function(){var id=nid(),k=DIR.k,M=PS('map'),I=PS('idle');DIR.st='back';S.noSpin=1;
  var a=cityAim(DIR.landLat,DIR.landLon),A={};for(var q in M)A[q]=M[q];A.lon=a.lon;A.tilt=a.tilt;A.yaw=C.yaw-wrapA(C.yaw);
  var B=snapC();if(B.sunAbs<=0){var G0=landGeo(S.asp,DIR.info||cityInfo(DIR.landLat,DIR.landLon)),sd=sunDir(G0.psi-SUNG,SUNAZ,B.pitch);B.sunAbs=sd.sunAbs;B.sunA=sd.sunA}
  C.dv=1;runDive(id,{a:A,b:B,fx:.45,fwd:0},0,2600*k,EASE.lin,function(){stage('map');
   var o={};for(var q in I)if(q!=='spin'&&q!=='lon')o[q]=I[q];tween(o,1150*k,EASE.io3,0,G(id,function(){C.spin=0;tween({spin:.03},800*k,EASE.io2);S.noSpin=0;stage('idle')}))})},
 /* straight back to the idle globe from the map view */
 reset:function(){var id=nid(),k=DIR.k,I=PS('idle');DIR.st='back';DIR.dv=null;S.noSpin=1;var o={};for(var q in I)if(q!=='spin'&&q!=='warp'&&q!=='lon')o[q]=I[q];
  tween(o,1000*k,EASE.io3,0,G(id,function(){S.noSpin=0;tween({spin:.03},700*k,EASE.io2);stage('idle')}))},
 /* access granted: punch out of the atmosphere in a light-speed jump and flash */
 launch:function(){if(bhGo())return;/*GXS*/var id=nid(),k=DIR.k;DIR.dv=null;DIR.st='launch';S.noSpin=1;sunRel();
  tween({warp:1,fov:104,d:1.5,pitch:.25,off:0,atmS:1,vpy:.18,vpx:0,sunI:2.6,shake:.8,haze:.4},1050*k,EASE.i2);
  at(900*k,G(id,function(){stage('punch');tween({flash:1},260*k,EASE.i2,0,G(id,function(){stage('flash')}))}))},
 /* a slow idle drift for the landing view: the camera orbits the city */
 drift:function(dt){if(DIR.st==='land'){C.yaw+=.0026*dt}}
};
/*GXSstart bh*/
/* ---------- black-hole transit (access granted): lensed starfield, brand-colour accretion disk, photon ring, swallow ---------- */
var BH={on:0,t0:0,k:1,fail:0,ok:-1};S.BH=BH;
var FS_BH=HP+HASH+
'uniform vec2 uRes,uC;uniform float uT,uF,uS,uR,uTi,uRoll,uBloom,uFlash,uLow,uFlow,uStr,uWS,uSt;uniform sampler2D uCap,uNoise;\n'+
TONE+
'vec3 ramp(float k){vec3 a=vec3(.26,0.,.05),b=vec3(1.,.10,.27),c=vec3(1.,.46,.12),d=vec3(1.,.81,.25),e=vec3(1.,.96,.84);\n'+
' if(k<.25)return mix(a,b,k*4.);if(k<.5)return mix(b,c,(k-.25)*4.);if(k<.78)return mix(c,d,(k-.5)/.28);return mix(d,e,(k-.78)/.22);}\n'+
'vec3 stl(float a,float lr,float rq,float N,float thr,float sz,float flow,float str){\n'+
' vec2 g=vec2(a*N/6.2832,lr*N/6.2832-flow);vec2 c=floor(g),f=fract(g)-.5;float h=h21(c+N);if(h<thr)return vec3(0.);\n'+
' vec2 d=(f-(h22(c+3.1)-.5)*.5)*6.2832/N*rq;d.y/=str;float e=length(d)/sz;float s=exp(-e*e*2.);\n'+
' float br=.3+.7*h21(c+9.);float hc=h21(c+5.);vec3 tint=hc<.62?vec3(.74,.84,1.):(hc<.86?vec3(1.,.86,.62):vec3(1.,.42,.5));\n'+
' return tint*s*br/(1.+(str-1.)*.07);}\n'+
'void main(){float asp=uRes.x/uRes.y;vec2 p=(gl_FragCoord.xy-.5*uRes)/(.5*uRes.y)-uC;float r=max(length(p),1e-4);float R0=uR;float b=r/R0;\n'+
' vec2 q=p*(1.-R0*R0*1.38/(r*r));float rq=max(length(q),1e-4);float aq=atan(q.y,q.x),lr=log(rq);\n'+
' vec3 col=vec3(.004,.0016,.007);\n'+
' vec3 st=stl(aq,lr,rq,64.,.58,.0042,uFlow,uStr)*1.15;if(uLow<.5)st+=stl(aq,lr,rq,38.,.64,.0065,uFlow*.7+3.,uStr)*1.35;\n'+
' col+=st*uSt*(.12+.88*smoothstep(1.04,2.3,b));\n'+
' float zoom=1.+2.6*uF*uF;float tw=uF*3.4/(1.+r*2.2);vec3 sc=vec3(0.);\n'+
' for(int i=0;i<3;i++){float tj=tw+(float(i)-1.)*.12*uF;float cs=cos(tj),sn=sin(tj);vec2 sp=vec2(cs*q.x-sn*q.y,sn*q.x+cs*q.y)*zoom+uC;vec2 uv=sp/vec2(asp,1.)*.5+.5;\n'+
'  vec2 ed=min(uv,1.-uv);float m=smoothstep(0.,.07,min(ed.x*.56,ed.y));sc+=texture2D(uCap,clamp(uv,.001,.999)).rgb*m;}\n'+
' col+=sc*.3333*uWS;\n'+
' col*=smoothstep(.96,1.0,b);\n'+
' float cr=cos(uRoll),sr=sin(uRoll);vec2 pc=vec2(cr*p.x+sr*p.y,-sr*p.x+cr*p.y);float X=pc.x/R0,Yp=pc.y/(R0*uTi);float rd=length(vec2(X,Yp));float ph=atan(Yp,X);\n'+
' float prof=smoothstep(1.28,1.4,rd)*(1.-smoothstep(4.0,5.8,rd));if(Yp>0.)prof*=smoothstep(1.3,3.4,abs(X));\n'+
' float k=1.-clamp((rd-1.3)/4.4,0.,1.);float sw=ph+uT*2.4*pow(max(rd,1.),-1.5);\n'+
' float n1=texture2D(uNoise,vec2(sw/6.2832*4.,rd*.5)).g,n2=texture2D(uNoise,vec2(sw/6.2832*9.+.3,rd*1.6)).r;float turb=.5+.8*n1*(.55+.9*n2);\n'+
' float dop=pow(1.+.55*X/max(rd,1.),2.6);\n'+
' col+=ramp(pow(k,.85))*turb*dop*prof*(.28+1.7*k*k);\n'+
' float w=exp(-(b-1.)*1.7)*smoothstep(.97,1.05,b)*(1.-smoothstep(2.2,3.3,b));float top=.28+.72*smoothstep(-.2,.55,pc.y/r);float al=atan(pc.y,pc.x);\n'+
' float n3=texture2D(uNoise,vec2((al+uT*.9/pow(max(b,1.),1.5))/6.2832*5.,b*.7)).g;float dop2=pow(1.+.5*pc.x/r,2.4);\n'+
' col+=ramp(clamp(1.-(b-1.)/1.5,0.,1.))*w*top*(.55+.9*n3)*dop2*1.25;\n'+
' float f0=exp(-pow((b-1.025)/.013,2.));vec3 rc=vec3(f0);\n'+
' if(uLow<.5){rc=vec3(exp(-pow((b*.992-1.025)/.013,2.)),f0*.92,exp(-pow((b*1.008-1.025)/.013,2.))*.8);}\n'+
' col+=rc*vec3(1.,.9,.74)*(1.5+.9*dop2)+vec3(.9,.08,.2)*exp(-(b-1.)*5.)*smoothstep(.98,1.02,b)*.45;\n'+
' col+=(vec3(1.,.78,.45)*(exp(-abs(b-1.05)*2.4)*2.4+.25)+vec3(1.,.1,.2)*.5*exp(-abs(b-1.)*.7))*uBloom;\n'+
' col*=1.-.32*dot(p,p)*(1.-uS);col+=vec3(uFlash);\n'+
' col=tone(col);float ig=fract(52.9829189*fract(dot(gl_FragCoord.xy+fract(uT*7.)*13.,vec2(.06711056,.00583715))));col+=(ig-.5)/255.;gl_FragColor=vec4(col,1.);}';

function bhProg(){if(S.P.bhx)return S.P.bhx;if(BH.fail)return null;
 try{var p=program('bhx',VS_FS,FS_BH,['aP']);
  BH.ok=1;return p}catch(e){BH.fail=1;BH.ok=0;S.bhErr=String(e&&e.message||e).slice(0,300);delete S.P.bhx;return null}}
function bhCapture(){DIR.cap=0;var gl=S.gl;
 try{if(S.bhCtx!==gl){S.bhTex=null;S.bhCtx=gl}
  if(!S.bhTex){S.bhTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,S.bhTex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)}
  gl.bindTexture(gl.TEXTURE_2D,S.bhTex);while(gl.getError());gl.copyTexImage2D(gl.TEXTURE_2D,0,gl.RGB,0,0,S.w,S.h,0);if(gl.getError())throw new Error('cap')}
 catch(e){BH.fail=1;S.bhTex=null}
 BH.cb&&BH.cb(!BH.fail)}
function bhDraw(){var gl=S.gl,p=S.P.bhx;if(S.bhCtx!==gl||!p||!S.bhTex){BH.on=0;return false}
 var k=BH.k,bt=Math.max(0,S.t-BH.t0),T1=2.6*k,T2=1.0*k,F=clamp(bt/T1,0,1),Sw=clamp((bt-T1)/T2,0,1);
 var R0=(.014+.30*Math.pow(F,2.4))*Math.exp(Math.log(9)*Math.pow(Sw,1.5));
 var bloom=sstep(.12,.55,Sw)*(1-sstep(.62,.86,Sw));
 gl.viewport(0,0,S.w,S.h);gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);gl.useProgram(p.p);gl.bindBuffer(gl.ARRAY_BUFFER,S.tri);attribsOff(8);attrib(0,2,0,0);
 bindTex(0,S.nz);gl.uniform1i(p.l('uNoise'),0);bindTex(1,S.bhTex);gl.uniform1i(p.l('uCap'),1);
 gl.uniform2f(p.l('uRes'),S.w,S.h);gl.uniform2f(p.l('uC'),0,.02);gl.uniform1f(p.l('uT'),S.t);gl.uniform1f(p.l('uF'),F);gl.uniform1f(p.l('uS'),Sw);gl.uniform1f(p.l('uR'),R0);
 gl.uniform1f(p.l('uTi'),.11+.07*F);gl.uniform1f(p.l('uRoll'),-.14+.05*Math.sin(S.t*.7));gl.uniform1f(p.l('uBloom'),bloom);gl.uniform1f(p.l('uFlash'),C.flash);gl.uniform1f(p.l('uLow'),S.q==='low'?1:0);
 gl.uniform1f(p.l('uFlow'),bt*.6+14*F*F*F+25*Sw*Sw);gl.uniform1f(p.l('uStr'),1+10*F*F*F+30*Sw);gl.uniform1f(p.l('uWS'),1-sstep(.04,.8,F));gl.uniform1f(p.l('uSt'),sstep(.02,.4,F));
 gl.drawArrays(gl.TRIANGLES,0,3);S.frames++;BH.F=F;BH.S=Sw;return true}
/* returns 1 when the black-hole sequence has been started (otherwise the classic punch+flash runs) */
function bhGo(){if(S.still||BH.fail||!bhProg())return 0;
 var id=nid(),k=DIR.k;BH.on=0;BH.k=k;BH.F=0;BH.S=0;DIR.dv=null;DIR.st='launch';S.noSpin=1;sunRel();
 tween({warp:1,fov:104,d:1.5,pitch:.25,off:0,atmS:1,vpy:.18,vpx:0,sunI:2.6,shake:.8,haze:.4},1050*k,EASE.i2);
 var classic=function(){stage('punch');tween({flash:1},260*k,EASE.i2,0,G(id,function(){stage('flash')}))};
 BH.cb=function(ok){if(id!==DIR.id)return;
  if(!ok){classic();return}
  BH.on=1;BH.t0=S.t;stage('punch');
  var T1=2600*k,T2=1000*k;
  at(.5*T1,G(id,function(){stage('bh2')}));
  at(T1,G(id,function(){stage('bh3')}));
  at(T1+.45*T2,G(id,function(){tween({flash:1},380*k,EASE.i2,0,G(id,function(){stage('flash')}))}))};
 at(1000*k,G(id,function(){DIR.cap=1}));
 return 1}
/*GXSend bh*/

/* ---------- public ---------- */
var api={
 S:S,C:C,EASE:EASE,
 init:function(cv,src,opt){try{if(!initGL(cv,opt))return false}catch(e){S.err=e;return false}
  resize(true);if(src)loadTextures(src);return true},
 on:function(n,f){S.cb[n]=f},
 start:function(){if(!S.ok||S.run)return;S.run=1;S.last=0;S.raf=requestAnimationFrame(tick)},
 stop:function(){S.run=0;cancelFrame()},
 release:function(){api.stop();try{var gl=S.gl;if(gl){var ext=gl.getExtension('WEBGL_lose_context');if(ext)ext.loseContext()}}catch(e){}S.ok=0;S.gl=null;S.cv=null;S.lost=0;S.ready=0;S.tex={};S.P={};S.pcPend=null;S.bN=0;S.bKey='';S.bgeo=S.bib=S.bav=S.bbm=S.bcg=S.bic=null;S.bNC=0;S.pings.length=0},
 set:function(o){apply(o)},
 layout:layout,
 tween:tween,at:at,cancel:cancelAnim,
 renderAt:function(t){S.manual=1;S.t=t;stepAnim();render()},
 step:function(dt){S.t+=dt;if(!S.noSpin)C.lon-=C.spin*dt;else if(DIR.st==='land')C.yaw+=.0026*dt;stepAnim()},
 draw:function(){render()},
 resize:function(){resize(true)},
 project:project,ping:ping,
 setQuality:function(q){S.q=q==='low'?'low':'full';S.pix=S.q==='low'?.85e6:2.1e6;S.fps=S.q==='low'?20:30;resize(true)},
 setStill:function(v){S.still=v?1:0},
 mouse:function(x,y){S.mx=clamp(x,-1,1);S.my=clamp(y,-1,1)},
 time:function(){return S.t},
 shortLon:shortLon,dir:dir,PS:PS,cityInfo:cityInfo,
 /* altitude above the ground in km (live), and the final landing altitude for the current city/aspect */
 alt:function(){return (C.d-1)*RE},landAlt:function(){var I=DIR.info||cityInfo(DIR.landLat,DIR.landLon);return landGeo(S.asp||1.78,I).h},
 landAltFor:function(lat,lon){var a=S.ok&&S.cssW>2?S.asp:innerWidth/Math.max(1,innerHeight);return landGeo(a||1.78,cityInfo(lat,lon)).h},
 warm:function(){if(S.ok&&S.gl&&!S.lost)try{pcStart(0);pcStart(1);bldProg()}catch(e){}}
};
return api})();
