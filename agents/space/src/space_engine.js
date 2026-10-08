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
