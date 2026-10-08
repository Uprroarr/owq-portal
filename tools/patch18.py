P='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(P).read()
def rep(a,b,n=1):
    global s
    assert a in s,a[:80]
    s=s.replace(a,b,n)

# 1. scene time warp
rep("t=(now-MP.t0)/1000;if(!MP.T)mapTiles();","t=mapT(now,stat);if(!MP.T)mapTiles();")
rep("function mapFrame(now,stat){","function mapT(now,stat){if(stat)return (now-MP.t0)/1000;if(MP.wt==null){MP.wt=(now-MP.t0)/1000;MP.ln=now}const dt=Math.max(0,Math.min(100,now-MP.ln))/1000;MP.ln=now;MP.wt+=dt*(MP.boost||1);return MP.wt}\nfunction mapFrame(now,stat){")

# 2. cars: alpha + record
a=s.index("car(c,LW*.5+sw2*LW*.07-90,232")
s=s[:a]+"const caA=MP.ca==null?1:MP.ca;MP.carA={x:(LW*.5-sw2*LW*.09-120)*u,y:oy+306*u,s:1.45*u};MP.carB={x:(LW*.5+sw2*LW*.07-90)*u,y:oy+232*u,s:1.15*u};if(caA>.01){c.globalAlpha=caA;\n"+s[a:]
b=s.index("// exhaust flames (spit from the cars)")
s=s[:b]+"c.globalAlpha=1}\n"+s[b:]
rep("MP.ev.forEach(v=>{const a=t-v.tb,Pq=CPOS(v.car);v.spw=v.spw||{};","MP.ev.forEach(v=>{if(MP.hold||caA<.9)return;const a=t-v.tb,Pq=CPOS(v.car);v.spw=v.spw||{};")
rep("MP.ev.forEach(v=>{const a=t-v.tb;if(a<0||a>5.6)return;","MP.ev.forEach(v=>{const a=t-v.tb;if(a<0||a>5.6||MP.hold||caA<.9)return;")

# 3. letterbox DOM + CSS
rep('<canvas id=lgfx aria-hidden="true"></canvas>','<canvas id=lgfx aria-hidden="true"></canvas><div id=cbars></div>')
css='''
#cbars{position:fixed;inset:0;z-index:510;pointer-events:none}
#cbars:before,#cbars:after{content:"";position:absolute;left:0;right:0;height:11.5vh;background:#000;transition:transform .9s cubic-bezier(.2,.8,.2,1)}
#cbars:before{top:0;transform:translateY(-101%)}#cbars:after{bottom:0;transform:translateY(101%)}
#cbars.on:before,#cbars.on:after{transform:none}
#login.leave .hxm,#login.leave .hxd{animation:none!important;opacity:0!important;transition:opacity .45s}
#boot.seam .bt{background:rgba(5,1,8,.38);border-color:rgba(255,31,79,.25);margin-top:-14vh}
'''
i=s.rindex('</style>'); s=s[:i]+css+s[i:]

# 4. fly kinds / durations / capture
rep("FLY.dur=kind==='login'?1750:kind==='exit'?1900:1050","FLY.dur=kind==='login'?2100:kind==='exit'?2600:1050")
rep("FLY.k=kind;FLY.t0=performance.now();","FLY.k=kind;FLY.t0=performance.now();if(kind==='login'){FLY.c0=MP.carA&&{...MP.carA};FLY.c1=MP.carB&&{...MP.carB}}")
rep("if(k>=1){cv.style.display='none';return}","if(k>=1){cv.style.display='none';if(FLY.k==='login'){MP.boost=1.25;MP.ca=1}return}\nif(FLY.k==='login'){flyDrift(c,W,H,k,now);FLY.raf=requestAnimationFrame(flyFrame);return}\nif(FLY.k==='exit'){flyChase(c,W,H,k,now);FLY.raf=requestAnimationFrame(flyFrame);return}")

js=r'''
function ss(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)}
function kfi(k,a){for(let i=1;i<a.length;i++){if(k<=a[i][0]){const p=(k-a[i-1][0])/(a[i][0]-a[i-1][0]);return a[i-1][1]+(a[i][1]-a[i-1][1])*ss(p)}}return a[a.length-1][1]}
function flameAt(c,x,y,L,w,t){const tg=(len,ww,col,al,ang)=>{c.save();c.translate(x,y);c.rotate(ang);c.fillStyle='rgba('+col+','+al+')';c.beginPath();c.moveTo(0,-ww/2);c.bezierCurveTo(-len*.28,-ww*1.15,-len*.66,-ww*.3,-len,(Math.random()-.5)*ww*.5);c.bezierCurveTo(-len*.66,ww*.3,-len*.28,ww*1.15,0,ww/2);c.closePath();c.fill();c.restore()};
c.globalCompositeOperation='lighter';for(let m=0;m<4;m++)tg(L*(.7+Math.random()*.4),w*(1.6+Math.random()*.7),'255,31,79',.2,(Math.random()-.5)*.4);for(let m=0;m<4;m++)tg(L*(.55+Math.random()*.42),w*(1.1+Math.random()*.5),'255,95,40',.3,(Math.random()-.5)*.3);for(let m=0;m<3;m++)tg(L*(.34+Math.random()*.3),w*(.7+Math.random()*.3),'255,190,100',.4,(Math.random()-.5)*.2);tg(L*.24,w*.42,'255,250,225',.6,0);c.globalCompositeOperation='source-over'}
function flyDrift(c,W,H,k,now){
const cl=x=>Math.max(0,Math.min(1,x)),lerp=(a,b,x)=>a+(b-a)*x;
MP.boost=1+2.6*ss(k/.3)-1.4*ss((k-.8)/.2);MP.ca=k<.07?1-k/.07:(k<.86?0:ss((k-.86)/.14));
const S1=Math.min(W/340,H/190,3.6),c0=FLY.c0||{x:W*.3,y:H*.72,s:2.2},cb=FLY.c1||{x:W*.4,y:H*.55,s:1.8},e1=ss(k/.32),env=ss((k-.06)/.12)*(1-ss((k-.8)/.18));
c.save();const shk=Math.sin(Math.PI*cl(k*1.05))*2.6;c.translate((Math.random()-.5)*shk,(Math.random()-.5)*shk*.7);
c.fillStyle='rgba(3,1,6,'+(.2*Math.sin(Math.PI*cl(k*1.05)))+')';c.fillRect(-10,-10,W+20,H+20);
// horizontal speed streaks
c.globalCompositeOperation='lighter';const r=rngS(17);for(let i=0;i<54;i++){const y=H*.06+r()*H*.88,ln=240+r()*700,sp=1.3+r()*1.8,x=W-(((now/1000)*sp*W*.55*MP.boost+r()*W*3)%(W+ln*2))+ln*.3;const gg=c.createLinearGradient(x,0,x+ln,0);gg.addColorStop(0,'rgba(255,230,238,'+.55*env+')');gg.addColorStop(.25,'rgba(255,90,125,'+.3*env+')');gg.addColorStop(1,'rgba(255,31,79,0)');c.fillStyle=gg;c.fillRect(x,y,ln,1.2+r()*1.6)}c.globalCompositeOperation='source-over';
// gray car being overtaken
const pb=ss(k/.6);if(pb<1){const bs=cb.s*(1+.5*pb),bx=lerp(cb.x+100*cb.s,-260*bs,pb),by=lerp(cb.y,cb.y+H*.04,pb);c.save();c.globalAlpha=1-ss((k-.5)/.12);c.translate(bx,by);c.rotate(.05*Math.sin(k*8));car(c,-100*bs,0,bs,FCAR_G,now/1000,1.3);c.restore()}
// hero red car
const sc=lerp(c0.s,S1,e1),launch=Math.pow(ss((k-.76)/.24),1.9),CX=lerp(c0.x+100*c0.s,W*.43,e1)+W*.13*ss((k-.34)/.4)+W*1.35*launch,GY=lerp(c0.y,H*.74,e1),ang=kfi(k,[[0,0],[.15,-.3],[.45,-.22],[.64,.13],[.78,0],[1,0]]);
const rx=CX-58*sc,bgsp=720*MP.boost*(W/1440+.4);
// shadow + underglow
c.globalCompositeOperation='lighter';let g=c.createRadialGradient(CX,GY+4*sc,0,CX,GY+4*sc,130*sc);g.addColorStop(0,'rgba(255,31,79,'+.5*env+')');g.addColorStop(1,'rgba(255,31,79,0)');c.save();c.translate(0,GY+4*sc);c.scale(1,.16);c.translate(0,-(GY+4*sc));c.fillStyle=g;c.fillRect(CX-140*sc,GY-60*sc,280*sc,120*sc);c.restore();c.globalCompositeOperation='source-over';
// tire smoke
for(let i=46;i>=0;i--){const a=i*.024,f=a/1.1,x=rx-a*bgsp+Math.sin(i*2.3)*6*sc,y=GY-sc*2-a*34*sc-Math.abs(Math.sin(i*1.7))*5*sc,rr=(9+a*56)*sc/2.5,al=.4*Math.pow(Math.max(0,1-f),1.3)*env;if(al<.01)continue;const gg=c.createRadialGradient(x,y,0,x,y,rr);gg.addColorStop(0,'rgba(236,228,240,'+al+')');gg.addColorStop(.6,'rgba(205,195,215,'+al*.6+')');gg.addColorStop(1,'rgba(190,180,200,0)');c.fillStyle=gg;c.beginPath();c.arc(x,y,rr,0,7);c.fill()}
// sparks
c.globalCompositeOperation='lighter';for(let i=0;i<30;i++){const f=((now/300+i*.137)%1),x=rx-f*sc*150-(i%6)*7,y=GY-3*sc+f*f*34*sc*(1+i%3)/2-(1-f)*10*sc*((i%4)/3);c.fillStyle='rgba(255,'+(150+(i%5)*20)+',110,'+(1-f)*.95*env+')';c.fillRect(x,y,4+sc,1.6+sc*.3)}c.globalCompositeOperation='source-over';
// car
c.save();c.translate(CX,GY-16*sc);c.rotate(ang);car(c,-100*sc,16*sc,sc,FCAR_R,now/1000,0);
const ex=-100*sc+1.5*sc,ey=16*sc-13.4*sc;flameAt(c,ex,ey,(46+64*Math.abs(Math.sin(now/85)))*sc/1.4*env,5*sc/1.4,now);c.restore();
// anamorphic flare at headlight
const fy=GY-24*sc,fx=CX+95*sc;c.globalCompositeOperation='lighter';g=c.createLinearGradient(0,fy,W,fy);g.addColorStop(0,'rgba(255,60,100,0)');g.addColorStop(Math.max(0,Math.min(1,fx/W)),'rgba(255,230,240,'+.5*env+')');g.addColorStop(1,'rgba(255,60,100,0)');c.fillStyle=g;c.fillRect(0,fy-1.6,W,3.2);c.globalCompositeOperation='source-over';
c.restore();
// vignette
g=c.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,Math.max(W,H)*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+.5*Math.sin(Math.PI*cl(k*1.05))+')');c.fillStyle=g;c.fillRect(0,0,W,H)}
function carRear(c,cx,gy,w,kind,now,hot){const red=kind==='r',h=w*.4;c.save();c.translate(cx,gy);let g;
c.globalCompositeOperation='lighter';g=c.createRadialGradient(0,0,0,0,0,w*.95);g.addColorStop(0,'rgba(255,31,79,.5)');g.addColorStop(1,'rgba(255,31,79,0)');c.save();c.scale(1,.2);c.fillStyle=g;c.fillRect(-w,-w,2*w,2*w);c.restore();c.globalCompositeOperation='source-over';
c.fillStyle='#040307';c.fillRect(-w*.5,-w*.15,w*.1,w*.15);c.fillRect(w*.4,-w*.15,w*.1,w*.15);
g=c.createLinearGradient(0,-h,0,0);if(red){g.addColorStop(0,'#ff5a74');g.addColorStop(.35,'#b80d28');g.addColorStop(1,'#220309')}else{g.addColorStop(0,'#9aa0b4');g.addColorStop(.35,'#3e4252');g.addColorStop(1,'#0a0b10')}c.fillStyle=g;
c.beginPath();c.moveTo(-.5*w,-.06*w);c.lineTo(-.5*w,-.2*w);c.quadraticCurveTo(-.49*w,-.26*w,-.4*w,-.265*w);c.lineTo(.4*w,-.265*w);c.quadraticCurveTo(.49*w,-.26*w,.5*w,-.2*w);c.lineTo(.5*w,-.06*w);c.quadraticCurveTo(.48*w,0,.42*w,0);c.lineTo(-.42*w,0);c.quadraticCurveTo(-.48*w,0,-.5*w,-.06*w);c.fill();
c.beginPath();c.moveTo(-.39*w,-.26*w);c.lineTo(-.29*w,-.385*w);c.quadraticCurveTo(0,-.4*w,.29*w,-.385*w);c.lineTo(.39*w,-.26*w);c.fill();
g=c.createLinearGradient(0,-.37*w,0,-.27*w);g.addColorStop(0,'#232a48');g.addColorStop(1,'#020308');c.fillStyle=g;c.beginPath();c.moveTo(-.31*w,-.27*w);c.lineTo(-.235*w,-.36*w);c.lineTo(.235*w,-.36*w);c.lineTo(.31*w,-.27*w);c.fill();
if(red){c.fillStyle='#07060a';c.fillRect(-.47*w,-.315*w,.94*w,.03*w);c.fillRect(-.47*w,-.345*w,.028*w,.075*w);c.fillRect(.442*w,-.345*w,.028*w,.075*w);c.fillStyle='rgba(255,70,100,.8)';c.fillRect(-.47*w,-.316*w,.94*w,.006*w)}
c.fillStyle='#06040a';c.fillRect(-.36*w,-.1*w,.72*w,.085*w);c.fillStyle='rgba(255,255,255,.07)';for(let i=-3;i<=3;i++)c.fillRect(i*.09*w-.004*w,-.095*w,.008*w,.07*w);
c.fillStyle='#d8d6de';c.globalAlpha=.85;c.fillRect(-.06*w,-.148*w,.12*w,.032*w);c.globalAlpha=1;
c.globalCompositeOperation='lighter';
const tl=(x0,x1)=>{const gg=c.createLinearGradient(x0,0,x1,0);gg.addColorStop(0,'rgba(255,31,79,1)');gg.addColorStop(.5,'rgba(255,90,120,1)');gg.addColorStop(1,'rgba(255,31,79,1)');c.fillStyle=gg;c.fillRect(Math.min(x0,x1),-.205*w,Math.abs(x1-x0),.036*w);c.fillStyle='rgba(255,235,240,.95)';c.fillRect(Math.min(x0,x1),-.192*w,Math.abs(x1-x0),.011*w)};
tl(-.46*w,-.07*w);tl(.07*w,.46*w);
[-1,1].forEach(sg=>{const gg=c.createRadialGradient(sg*.32*w,-.187*w,0,sg*.32*w,-.187*w,w*.34);gg.addColorStop(0,'rgba(255,40,85,'+(.55+.25*(hot||0))+')');gg.addColorStop(1,'rgba(255,31,79,0)');c.fillStyle=gg;c.fillRect(sg*.32*w-w*.4,-.187*w-w*.4,w*.8,w*.8)});
[-.2,.2].forEach(x=>{const rr=w*(.075+.05*(hot||0)*(.6+.4*Math.sin(now/60)));const gg=c.createRadialGradient(x*w,-.06*w,0,x*w,-.06*w,rr);gg.addColorStop(0,'rgba(255,245,225,'+(.5+.5*(hot||0))+')');gg.addColorStop(.4,'rgba(255,120,60,'+(.35+.4*(hot||0))+')');gg.addColorStop(1,'rgba(255,60,40,0)');c.fillStyle=gg;c.fillRect(x*w-rr,-.06*w-rr,rr*2,rr*2)});
c.globalCompositeOperation='source-over';c.restore()}
function flyChase(c,W,H,k,now){
const cl=x=>Math.max(0,Math.min(1,x)),sec=now/1000,hy=H*.43,vx=W/2,Hd=H-hy,Wd=W*.42,p=cl((k-.1)/.84),acc=Math.pow(p,1.75),reveal=ss(k/.17),edge=reveal*W*1.12-W*.06;
c.save();c.beginPath();c.rect(0,0,Math.max(0,Math.min(W,edge)),H);c.clip();
const shk=Math.min(1,acc*3)*(1-ss((k-.85)/.1))*2.4;c.translate((Math.random()-.5)*shk,(Math.random()-.5)*shk);
let g=c.createLinearGradient(0,0,0,hy);g.addColorStop(0,'#02020a');g.addColorStop(.55,'#12061c');g.addColorStop(1,'#9a1738');c.fillStyle=g;c.fillRect(-6,-6,W+12,hy+8);
const rs=rngS(5);c.fillStyle='rgba(255,235,242,.7)';for(let i=0;i<70;i++){c.fillRect(rs()*W,rs()*hy*.8,1.2,1.2)}
c.globalCompositeOperation='lighter';g=c.createRadialGradient(vx,hy,0,vx,hy,W*.55);g.addColorStop(0,'rgba(255,90,120,.65)');g.addColorStop(.35,'rgba(255,31,79,.25)');g.addColorStop(1,'rgba(255,31,79,0)');c.save();c.translate(0,hy);c.scale(1,.55);c.translate(0,-hy);c.fillStyle=g;c.fillRect(0,hy-W,W,2*W);c.restore();c.globalCompositeOperation='source-over';
// skyline
const zf=1+acc*.55,rb=rngS(7);for(let i=0;i<52;i++){const fx=(i/51)*2-1,bw=(20+rb()*38)*zf,bh=(30+rb()*150*(0.35+Math.abs(fx)*.9))*zf,bx=vx+fx*W*.64*zf-bw/2;c.fillStyle=i%3?'#07040d':'#0a0510';c.fillRect(bx,hy-bh,bw,bh+2);c.fillStyle='rgba(255,45,90,.75)';c.fillRect(bx,hy-bh,bw,1.3);const wr=rngS(i*13+3);for(let q=0;q<Math.floor(bh/9);q++)for(let z2=0;z2<Math.floor(bw/8);z2++)if(wr()<.22){c.fillStyle=wr()<.5?'rgba(255,200,170,.75)':'rgba(255,90,130,.7)';c.fillRect(bx+3+z2*8,hy-bh+5+q*9,2.4*zf,3*zf)}}
// ground
g=c.createLinearGradient(0,hy,0,H);g.addColorStop(0,'#10061a');g.addColorStop(.25,'#09040f');g.addColorStop(1,'#020104');c.fillStyle=g;c.fillRect(-6,hy,W+12,Hd+8);
c.globalCompositeOperation='lighter';g=c.createLinearGradient(0,hy,0,H);g.addColorStop(0,'rgba(255,60,100,.5)');g.addColorStop(.18,'rgba(255,31,79,.08)');g.addColorStop(1,'rgba(255,31,79,0)');c.fillStyle=g;c.fillRect(vx-Wd*.9,hy,Wd*1.8,Hd);c.globalCompositeOperation='source-over';
// road edges
const edgeL=(lat,w0,col)=>{c.strokeStyle=col;c.lineWidth=w0;c.beginPath();c.moveTo(vx+lat*Wd/60,hy+Hd/60);c.lineTo(vx+lat*Wd/1,hy+Hd/1);c.stroke()};
c.globalCompositeOperation='lighter';[-3,3].forEach(l=>{edgeL(l,7,'rgba(255,31,79,.22)');edgeL(l,2.2,'rgba(255,120,150,.9)')});[-3.45,3.45].forEach(l=>edgeL(l,1.2,'rgba(255,31,79,.5)'));c.globalCompositeOperation='source-over';
// lane dashes + lamps
const trav=acc*92+sec*0,DD=1.15,N=44;
for(let i=0;i<N;i++){const zc=(((i*DD-trav)%(N*DD))+N*DD)%(N*DD)+.85,z2=zc+.5,y1=hy+Hd/zc,y2=hy+Hd/z2,al=Math.min(1,Math.max(0,1.15-zc/40))*Math.min(1,(zc-.85)*3);[-1,1].forEach(l=>{const x1=vx+l*Wd/zc,x2=vx+l*Wd/z2,t1=.07*Wd/zc,t2=.07*Wd/z2;c.fillStyle='rgba(255,240,246,'+al*.85+')';c.beginPath();c.moveTo(x1-t1,y1);c.lineTo(x1+t1,y1);c.lineTo(x2+t2,y2);c.lineTo(x2-t2,y2);c.fill()})}
c.globalCompositeOperation='lighter';
for(let i=0;i<18;i++){const zc=(((i*3.1-trav*1.0)%(18*3.1))+18*3.1)%(18*3.1)+.9,y0=hy+Hd/zc,sc2=Wd/zc;[-1,1].forEach(sg=>{const x0=vx+sg*3.75*Wd/zc,top=y0-2.3*sc2*.9,al=Math.min(1,Math.max(0,1.2-zc/52));c.strokeStyle='rgba(60,40,70,'+al+')';c.lineWidth=Math.max(1,.07*sc2);c.beginPath();c.moveTo(x0,y0);c.lineTo(x0,top);c.lineTo(x0-sg*.5*sc2,top-.07*sc2);c.stroke();const gg=c.createRadialGradient(x0-sg*.5*sc2,top,0,x0-sg*.5*sc2,top,.9*sc2+4);gg.addColorStop(0,'rgba(255,225,235,'+al+')');gg.addColorStop(.3,'rgba(255,60,100,'+al*.5+')');gg.addColorStop(1,'rgba(255,31,79,0)');c.fillStyle=gg;c.fillRect(x0-sg*.5*sc2-1.2*sc2-4,top-1.2*sc2-4,2.4*sc2+8,2.4*sc2+8)})}
// radial speed streaks
const rr=rngS(31);for(let i=0;i<40;i++){const a=Math.PI*(.04+rr()*.92),d0=30+rr()*60,sp=.6+rr()*.9,q=(acc*sp*2.2+rr())%1,r0=d0+q*q*W*.8,r1=r0+(30+q*320)*(.4+rr()),ca=Math.cos(a),sa=Math.abs(Math.sin(a));if(sa<.05)continue;const gg=c.createLinearGradient(vx+ca*r0,hy+sa*r0*.8,vx+ca*r1,hy+sa*r1*.8);gg.addColorStop(0,'rgba(255,60,100,0)');gg.addColorStop(1,'rgba(255,180,200,'+.55*Math.min(1,acc*3)+')');c.strokeStyle=gg;c.lineWidth=1+q*2.2;c.beginPath();c.moveTo(vx+ca*r0,hy+sa*r0*.8);c.lineTo(vx+ca*r1,hy+sa*r1*.8);c.stroke()}
c.globalCompositeOperation='source-over';
// cars (far first)
const cars=[{lat:-1.08,c:'r',z0:1.55,dl:0},{lat:1.12,c:'g',z0:1.85,dl:.05}].map(o=>{const pp=cl((p-o.dl)/(1-o.dl));return Object.assign(o,{z:o.z0+Math.pow(pp,2.05)*70,pp})}).sort((a,b)=>b.z-a.z);
cars.forEach(o=>{const z=o.z,w=1.6*Wd/z,gy=hy+Hd/z,cx=vx+o.lat*Wd/z+Math.sin(sec*2.2+o.lat)*.05*w;
c.globalCompositeOperation='lighter';[-1,1].forEach(sg=>{const x0=cx+sg*.32*w,y0=gy-.187*w,zb=Math.max(.7,z-6.5),xb=vx+(o.lat+sg*.32*1.6/1)*Wd/zb,yb=hy+Hd/zb-.187*(1.6*Wd/zb);const gg=c.createLinearGradient(x0,y0,xb,yb);gg.addColorStop(0,'rgba(255,60,100,'+.6*Math.min(1,o.pp*4)+')');gg.addColorStop(1,'rgba(255,31,79,0)');c.strokeStyle=gg;c.lineWidth=Math.max(1,.05*w);c.beginPath();c.moveTo(x0,y0);c.lineTo(xb,yb);c.stroke()});c.globalCompositeOperation='source-over';
carRear(c,cx,gy,w,o.c,now,Math.min(1,o.pp*3)*(1-o.pp))});
c.restore();
// whip edge
if(reveal<1){c.globalCompositeOperation='lighter';const ex=Math.min(W,edge);const gg=c.createLinearGradient(ex-120,0,ex+40,0);gg.addColorStop(0,'rgba(255,31,79,0)');gg.addColorStop(.8,'rgba(255,120,150,.8)');gg.addColorStop(.95,'rgba(255,255,255,.95)');gg.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gg;c.fillRect(ex-120,0,160,H);c.globalCompositeOperation='source-over'}
// vignette + end flash
g=c.createRadialGradient(vx,H*.5,H*.3,vx,H*.5,Math.max(W,H)*.78);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.55)');c.fillStyle=g;c.fillRect(0,0,W,H);
const fa=k<.72?0:(k<.9?ss((k-.72)/.18):1-ss((k-.9)/.1));if(fa>0){const gg=c.createRadialGradient(vx,hy,0,vx,hy,Math.max(W,H)*(.1+fa*1.1));gg.addColorStop(0,'rgba(255,255,255,'+fa+')');gg.addColorStop(1,'rgba(255,225,235,'+Math.min(1,fa*1.05)+')');c.fillStyle=gg;c.fillRect(0,0,W,H)}}
'''
a=s.index("function flyFrame(now)")
s=s[:a]+js+s[a:]

# 5. doLogin timeline
rep("MP.hold=1;const mcv=document.getElementById('lgmap');","MP.hold=1;const cbr=document.getElementById('cbars');if(cbr&&!RM)cbr.classList.add('on');const mcv=document.getElementById('lgmap');")
rep("const fin=()=>{clearInterval(iv);b.className='';MP.hold=0;","const fin=()=>{clearInterval(iv);b.className='';MP.hold=0;MP.boost=1;MP.ca=1;if(cbr)cbr.classList.remove('on');")
rep("setTimeout(()=>b.classList.add('out');","setTimeout(()=>b.classList.add('out');") if False else None
rep("setTimeout(()=>{b.classList.add('out');fxFly('exit');setTimeout(fin,1500)},3850)","setTimeout(()=>{b.classList.add('out');fxFly('exit');setTimeout(fin,2340)},3850)")
rep("},RM?100:1400)}","},RM?100:1700)}")
rep("cv.className='on';cv.classList.remove('launch','cruise');MP.hold=0;","cv.className='on';cv.classList.remove('launch','cruise');MP.hold=0;MP.boost=1;MP.ca=1;")
open(P,'w').write(s); print('ok')
