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

function bhProg(){if(S.P.bh)return S.P.bh;if(BH.fail)return null;
 try{var p=program('bh',VS_FS,FS_BH,['aP']);
  BH.ok=1;return p}catch(e){BH.fail=1;BH.ok=0;S.bhErr=String(e&&e.message||e).slice(0,300);delete S.P.bh;return null}}
function bhCapture(){DIR.cap=0;var gl=S.gl;
 try{if(S.bhCtx!==gl){S.bhTex=null;S.bhCtx=gl}
  if(!S.bhTex){S.bhTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,S.bhTex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)}
  gl.bindTexture(gl.TEXTURE_2D,S.bhTex);while(gl.getError());gl.copyTexImage2D(gl.TEXTURE_2D,0,gl.RGB,0,0,S.w,S.h,0);if(gl.getError())throw new Error('cap')}
 catch(e){BH.fail=1;S.bhTex=null}
 BH.cb&&BH.cb(!BH.fail)}
function bhDraw(){var gl=S.gl,p=S.P.bh;if(S.bhCtx!==gl||!p||!S.bhTex){BH.on=0;return false}
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
