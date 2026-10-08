/*GXCITYstart*/
/* ---------- 3D city model: instanced extruded buildings (WebGL2 instancing / ANGLE_instanced_arrays), generated once per pick ---------- */
var VS_BLD=['attribute vec3 aV,aNm;attribute vec4 aI0,aI1,aI2;uniform mat4 uVPb;uniform vec3 uCamK;uniform float uScan;',
'varying vec3 vRel,vNm;varying vec2 vF;varying vec4 vB;varying float vSd,vHW;',
'void main(){float rs=clamp((uScan-aI2.w)/.9,0.,1.);rs=rs*rs*(3.-2.*rs);',
' float tp=mix(1.,aI1.z,aV.z);vec2 hs=aI0.zw*tp;vec2 xy=aV.xy*hs;float c=cos(aI1.y),s=sin(aI1.y);vec2 xr=vec2(c*xy.x-s*xy.y,s*xy.x+c*xy.y)+aI0.xy;',
' float zz=(aI2.x+aV.z*aI1.x)*rs;vec3 loc=vec3(xr,zz-dot(aI0.xy,aI0.xy)/12742.);vRel=loc-uCamK;',
' vNm=vec3(c*aNm.x-s*aNm.y,s*aNm.x+c*aNm.y,aNm.z);float ax=abs(aNm.x);vSd=ax>.5?aV.y:aV.x;vHW=(ax>.5?hs.y:hs.x)*1000.;',
' vF=vec2(vSd*vHW+aI1.w*53.,(aI2.x+aV.z*aI1.x)*1000.);vB=vec4(aI1.w,aI2.y,aI2.z,(aI2.x+aI1.x)*rs);gl_Position=uVPb*vec4(vRel,1.);}'].join('\n');
var FS_BLD=['varying vec3 vRel,vNm;varying vec2 vF;varying vec4 vB;varying float vSd,vHW;uniform float uT,uPix,uFogL,uLQ;uniform vec3 uFog;',
'void main(){float dist=length(vRel);float fp=max(dist*1000.*uPix,.01);vec3 n=normalize(vNm);float roof=step(.5,n.z);vec3 V=-vRel/dist;',
' vec2 w=vF/vec2(3.4,3.8);vec2 wi=floor(w),wf=fract(w);float hw=h21(wi+vB.x*113.);float lit=step(hw,vB.y);',
' float win=smoothstep(.1,.22,wf.x)*smoothstep(.9,.78,wf.x)*smoothstep(.15,.3,wf.y)*smoothstep(.92,.78,wf.y);',
' float hc=h21(wi*1.7+vB.x*7.3);vec3 wc=hc<.6?vec3(1.,.8,.55):hc<.85?vec3(.75,.86,1.):hc<.95?vec3(1.,.72,.28):vec3(1.,.12,.3);',
' float aa=max(smoothstep(.5,1.6,fp/3.4),uLQ);vec3 wv=mix(wc*win*lit*(.5+.9*h21(wi*2.3+vB.x*3.1)),vec3(1.,.78,.5)*.36*vB.y,aa)*1.7;',
' if(vB.z>.5&&vB.z<1.5)wv*=vec3(1.35,1.05,.6);',
' float fres=pow(1.-clamp(dot(n,V),0.,1.),4.);vec3 col=vec3(.006,.007,.012)+wv+vec3(.6,.12,.2)*fres*.07+vec3(1.,.5,.2)*exp(-vF.y/22.)*.22*(1.-roof);',
' float tall=smoothstep(.15,.3,vB.w);float ed=(1.-abs(vSd))*vHW;col+=vec3(1.,.1,.28)*tall*smoothstep(fp*1.7,0.,ed)*1.3*(1.-roof);',
' col=mix(col,vec3(.008,.008,.012)+vec3(1.,.55,.3)*step(.985,h21(floor(vF*.08)+vB.x))*.5,roof);',
' if(vB.z>2.5&&vB.z<3.5)col=mix(vec3(1.,.42,.12),vec3(1.,.9,.78),step(.5,fract(vF.y/38.)))*(.55+.45*step(.5,fract((vF.x+vF.y)/7.)));',
' if(vB.z>3.5)col=vec3(.85,.88,1.)*.55;',
' col=mix(col,uFog,1.-exp(-dist/uFogL));col+=(h21(gl_FragCoord.xy+fract(uT*7.)*91.)-.5)*.018;gl_FragColor=vec4(tone(col),1.);}'].join('\n');
var VS_AV='attribute vec4 aA;uniform mat4 uVPb;uniform vec3 uCamK;uniform float uT,uScan,uPs;varying float vA;\n'+
'void main(){float rs=clamp((uScan-length(aA.xy))/.9,0.,1.);vec3 rel=vec3(aA.xy,aA.z*rs-dot(aA.xy,aA.xy)/12742.)-uCamK;gl_Position=uVPb*vec4(rel,1.);gl_PointSize=uPs;vA=step(.55,fract(uT*.75+aA.w))*step(.98,rs);}';
var FS_AV='varying float vA;void main(){vec2 c=gl_PointCoord-.5;float a=smoothstep(.5,.12,length(c))*vA;gl_FragColor=vec4(vec3(1.,.08,.12)*a*1.5,a);}';
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
function lmList(I){var k=Math.round(I.lat*10)+','+Math.round(I.lon*10),v=LM[k];if(v==='t101'){v=[[-.55,.44,.04,.04,0,.09,1,0]];for(var i=0;i<8;i++)v.push([-.55,.44,.03,.03,.09+i*.044,.044,1.15,0]);v.push([-.55,.44,.012,.012,.442,.05,1,0],[-.55,.44,.002,.002,.492,.016,1,4])}return v||[]}
/* CPU copy of the procedural noise texture -> the same coast / river / lake test the ground shader uses (one source of truth) */
function nzS(u,v,ch){var d=S.nzD;if(!d)return .5;var x=u*256-.5,y=v*256-.5,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 function g(a,b){a=((a%256)+256)%256;b=((b%256)+256)%256;return d[(b*256+a)*4+ch]/255}
 return (g(ix,iy)*(1-fx)+g(ix+1,iy)*fx)*(1-fy)+(g(ix,iy+1)*(1-fx)+g(ix+1,iy+1)*fx)*fy}
function waterAt(I,x,y){var r=Math.hypot(x,y),c2=Math.cos(.61),s2=Math.sin(.61),c3=Math.cos(-1.13),s3=Math.sin(-1.13);
 var u2=(c2*x-s2*y)*.103+I.noy,v2=(s2*x+c2*y)*.103+I.nox,n2r=nzS(u2,v2,0),n2b=nzS(u2,v2,2),n2a=nzS(u2,v2,3);
 var n1g=nzS(x*.0237+I.nox,y*.0237+I.noy,1),n1a=nzS(x*.0237+I.nox,y*.0237+I.noy,3),n3g=nzS((c3*x-s3*y)*.43+I.nox*1.7,(s3*x+c3*y)*.43+I.noy*1.7,1);
 var lv=1;if(I.sea>=0){var sb=I.sea*D2R,sv=x*Math.sin(sb)+y*Math.cos(sb)-I.seaD+((n1g-.5)*2.2+(n2r-.5)*.9)*(1.5+.22*r);lv=1-sstep(-3,3,sv)}
 lv+=.5*Math.exp(-r*r/(I.R*I.R*.03));if(lv+(n2b-.5)*.3+(n3g-.5)*.14<.57)return true;
 if(I.rivT>.5){var rb=I.rivB*D2R,ax=[Math.sin(rb),Math.cos(rb)],rx=x*ax[0]+y*ax[1],ry=x*ax[1]-y*ax[0]-I.rivO,ph=I.seed*40,m=I.rivT>1.5?.4:1;
  var yr=m*(1.6*Math.sin(rx*.24+ph)+.55*Math.sin(rx*.73+ph*2.3)+.16*Math.sin(rx*2.3+ph*.7)),sl=m*(.384*Math.cos(rx*.24+ph)+.4015*Math.cos(rx*.73+ph*2.3)+.368*Math.cos(rx*2.3+ph*.7));
  if(Math.abs((ry-yr)/Math.sqrt(1+sl*sl))<I.rivW/2000*(.85+.3*n2a)+.06)return true}
 if(I.lakes>.01&&n2b*.7+n1a*.3>.73-I.lakes*.12)return true;return false}
/* deterministic city model: blocks on the same street grid as the ground shader, height field = CBD peaks + belts, tallest kept */
function genCity(I){var low=S.q==='low',maxN=low?1500:6000,r=rng(((I.seed*4294967296)>>>0)^1540483477),RB=I.RB,R=I.R,cls=I.cls;
 var g=I.style===0?.1:.13,ang=(90-I.grid)*D2R,ca=Math.cos(ang),sa=Math.sin(ang),Hm=[.07,.11,.17,.26][cls],sc=[.7,1,1.4,1.9][cls];
 var lm=lmList(I),cores=[[0,0,1,sc]],i,j,k;for(i=0;i<(cls>=2?2:1);i++){var a=r()*TAU,dd=R*(.1+.12*r());cores.push([Math.cos(a)*dd,Math.sin(a)*dd,.5+.3*r(),sc*.7])}
 for(i=0;i<lm.length;i++)if(Math.hypot(lm[i][0],lm[i][1])>.6)cores.push([lm[i][0],lm[i][1],.85,sc*.8]);
 var cand=[],NB=Math.ceil(RB/g);
 for(i=-NB;i<NB;i++)for(j=-NB;j<NB;j++){var u=(i+.5)*g,v=(j+.5)*g,x=ca*u-sa*v,y=sa*u+ca*v,rr=Math.hypot(x,y);if(rr>RB)continue;
  var H=0;for(k=0;k<cores.length;k++){var c=cores[k],dx=x-c[0],dy=y-c[1];H=Math.max(H,c[2]*Math.exp(-(dx*dx+dy*dy)/(c[3]*c[3])))}
  var pB=Math.min(1,.18+1.3*H+.45*Math.exp(-rr*rr/(RB*RB*.2)));if(r()>pB||waterAt(I,x,y))continue;
  var nl=H>.3?(r()<.5?2:4):(r()<.3?2:1),bs=g-.026,base=.012+.03*Math.exp(-rr/(RB*.4));
  for(var l=0;l<nl;l++){var lu=0,lv=0,lw=bs/2,ld=bs/2;if(nl===2){lu=(l?.25:-.25)*bs;lw=bs/4-.004}else if(nl===4){lu=(l&1?.25:-.25)*bs;lv=(l&2?.25:-.25)*bs;lw=ld=bs/4-.004}
   var sh=.7+.24*r(),hh=Math.max(.008,Hm*H*(.2+Math.pow(r(),1.5))+base*(.4+.9*r())),cu=u+lu,cv=v+lv;
   cand.push([ca*cu-sa*cv,sa*cu+ca*cv,lw*sh,ld*sh*(.8+.25*r()),0,hh,hh>.15?.82+.15*r():1,r(),.2+.25*Math.min(1,H*1.5)+.08*r(),0,rr])}}
 var out=[];for(i=0;i<cand.length;i++){var ok=1;for(k=0;k<lm.length;k++)if(Math.hypot(cand[i][0]-lm[k][0],cand[i][1]-lm[k][1])<.13){ok=0;break}if(ok)out.push(cand[i])}
 out.sort(function(a,b){return b[5]-a[5]});var room=maxN-lm.length,ext=[];
 for(i=0;i<Math.min(out.length,Math.floor(room*.03));i++){var b=out[i];ext.push([b[0],b[1],b[2]*.6,b[3]*.6,b[5],.012+.02*r(),.7,b[7]+.31,b[8],0,b[10]]);if(i<room*.008)ext.push([b[0],b[1],.0025,.0025,b[5]+.012,.03+.05*r(),1,b[7]+.7,0,4,b[10]])}
 out=out.slice(0,Math.max(0,room-ext.length)).concat(ext);
 for(k=0;k<lm.length;k++){var q=lm[k];out.push([q[0],q[1],q[2],q[3],q[4],q[5],q[6],r(),.5,q[7],Math.hypot(q[0],q[1])])}
 var n=out.length,f=new Float32Array(n*12),av=[],top=[0,0,0];
 for(i=0;i<n;i++){var o=out[i];f.set([o[0],o[1],o[2],o[3],o[5],ang,o[6],o[7],o[4],o[8],o[9],o[10]],i*12);var zt=o[4]+o[5];
  if(zt>.12)av.push(o[0],o[1],zt+.002,r());if(zt>top[2]){top[0]=o[0];top[1]=o[1];top[2]=zt}}
 return {f:f,n:n,av:new Float32Array(av),nav:av.length/4,top:top}}
function boxGeo(){var v=[],F=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1]];
 F.forEach(function(n){var q;if(n[2])q=[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];else if(n[0])q=[[n[0],-1,0],[n[0],1,0],[n[0],1,1],[n[0],-1,1]];else q=[[-1,n[1],0],[1,n[1],0],[1,n[1],1],[-1,n[1],1]];
  [0,1,2,0,2,3].forEach(function(i){v.push(q[i][0],q[i][1],q[i][2],n[0],n[1],n[2])})});return new Float32Array(v)}
function bldProg(){if(S.bFail||!S.gl)return null;var k=S.q==='low'?'bl':'bh';if(S.P[k]&&S.P.av)return S.P[k];
 try{if(!S.P[k])program(k,VS_BLD,HP+HASH+TONE+FS_BLD,['aV','aNm','aI0','aI1','aI2']);if(!S.P.av)program('av',VS_AV,HP+FS_AV,['aA']);return S.P[k]}catch(e){S.bFail=1;S.err=e;try{console.warn('GX city model disabled: '+e.message)}catch(_){}return null}}
/* build (or rebuild) the model for the picked city; < ~30 ms, buffers reused */
function cityModel(I){if(!S.gl||S.bFail||!I)return;var t0=performance.now(),gl=S.gl;
 try{var m=genCity(I);if(!S.bgeo)S.bgeo=buf(boxGeo());if(!S.bib)S.bib=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,S.bib);gl.bufferData(gl.ARRAY_BUFFER,m.f,gl.STATIC_DRAW);
  if(!S.bav)S.bav=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,S.bav);gl.bufferData(gl.ARRAY_BUFFER,m.av.length?m.av:new Float32Array(4),gl.STATIC_DRAW);
  S.bN=m.n;S.bAV=m.nav;S.bTop=m.top;S.bKey=I.lat+','+I.lon+','+S.q;S.bMs=performance.now()-t0}catch(e){S.bFail=1;S.err=e}}
var VPB=new Float32Array(16),VMB=new Float32Array(16),PMB=new Float32Array(16);
function drawBld(I){var gl=S.gl,p=bldProg();if(!p||!S.bN)return;var E=ENU.E,N=ENU.N,U=ENU.U,rt=cam.rt,up=cam.up,fw=cam.fw;
 function d3(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
 VMB.set([d3(rt,E),d3(up,E),-d3(fw,E),0,d3(rt,N),d3(up,N),-d3(fw,N),0,d3(rt,U),d3(up,U),-d3(fw,U),0,0,0,0,1]);
 mpersp(C.fov*D2R,S.asp,.02,800,cam.sx,cam.sy,PMB);mmul(PMB,VMB,VPB);
 var hk=(C.d-1)*RE,scan=C.rise*I.RB*1.25,c=ENU.cam;
 gl.clear(gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);
 gl.useProgram(p.p);gl.uniformMatrix4fv(p.l('uVPb'),false,VPB);gl.uniform3f(p.l('uCamK'),c[0],c[1],c[2]);gl.uniform1f(p.l('uScan'),scan);
 gl.uniform1f(p.l('uT'),S.t);gl.uniform1f(p.l('uPix'),2*cam.ty/S.h);gl.uniform1f(p.l('uFogL'),8+hk*3);gl.uniform3f(p.l('uFog'),.022,.011,.034);gl.uniform1f(p.l('uLQ'),S.q==='low'?1:0);
 attribsOff(8);gl.bindBuffer(gl.ARRAY_BUFFER,S.bgeo);attrib(0,3,24,0);attrib(1,3,24,12);gl.bindBuffer(gl.ARRAY_BUFFER,S.bib);attrib(2,4,48,0,1);attrib(3,4,48,16,1);attrib(4,4,48,32,1);
 drawInst(gl.TRIANGLES,0,30,S.bN);attribsOff(8);
 if(S.bAV){var q=S.P.av;gl.useProgram(q.p);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.depthMask(false);gl.depthFunc(gl.LEQUAL);
  gl.uniformMatrix4fv(q.l('uVPb'),false,VPB);gl.uniform3f(q.l('uCamK'),c[0],c[1],c[2]);gl.uniform1f(q.l('uT'),S.t);gl.uniform1f(q.l('uScan'),scan);gl.uniform1f(q.l('uPs'),Math.max(2,3*S.h/860));
  gl.bindBuffer(gl.ARRAY_BUFFER,S.bav);attrib(0,4,16,0);gl.drawArrays(gl.POINTS,0,S.bAV);attribsOff(8);gl.depthMask(true)}
 gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND)}
/*GXCITYend*/
