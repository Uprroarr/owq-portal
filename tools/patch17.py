P='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(P).read()
def cut(a_marker,b_marker,new,incl_b=False):
    global s
    a=s.index(a_marker); b=s.index(b_marker,a)
    if incl_b: b+=len(b_marker)
    s=s[:a]+new+s[b:]

# A. event generator
a=s.index('function mapEvGen'); amark="const big=e[0]==='sale'||e[0]==='pol',amt=big?'+$'+(300+Math.floor(Math.random()*2100)).toLocaleString():'';"
b=s.index(amark,a)+len(amark)
e_end=s.index("MP.nx=t+3.4+Math.random()*3}",b)+len("MP.nx=t+3.4+Math.random()*3}")
s=s[:b]+"\nMP.ev=MP.ev.filter(x=>t-x.tb<7);const lst=MP.ev[MP.ev.length-1],car=lst&&t-lst.tb<5.5?(lst.car==='a'?'b':'a'):(Math.random()<.5?'a':'b');MP.ev.push({n,ty:e[0],ln:e[1],amt,big,car,tb:t,t0:t,pops:big?3:2});MP.nx=t+3.4+Math.random()*3}"+s[e_end:]

# B. remove fireworks drawing
cut("// fireworks (portal red/white)","g=c.createLinearGradient(0,HY,0,RY);g.addColorStop(0,'#2b1730')","")

# C. flames after cars
flames=r'''// exhaust flames (spit from the cars)
MP.sp=(MP.sp||[]).filter(q=>t-q.t0<q.L);
const CPOS=k=>k==='a'?{x:LW*.5-sw2*LW*.09-120+1.5,y:306-13.4*1.45}:{x:LW*.5+sw2*LW*.07-90+1.2,y:232-13.4*1.15};
c.globalCompositeOperation='lighter';
MP.ev.forEach(v=>{const a=t-v.tb,Pq=CPOS(v.car);v.spw=v.spw||{};
for(let i=0;i<(v.pops||2);i++){const pa=a-i*.21-.04,dur=.42;if(pa<0||pa>dur)continue;const kk=pa/dur,env=Math.pow(Math.sin(Math.PI*Math.min(1,kk*1.2)),.75),L=(v.big?170:115)*env*(.88+.24*Math.random()),w=(v.big?15:11)*(.8+.3*env);
if(!v.spw[i]){v.spw[i]=1;for(let j=0;j<(v.big?26:16);j++){const rv=Math.random();MP.sp.push({x:Pq.x-8,y:Pq.y+(Math.random()-.5)*6,vx:-(90+Math.random()*300),vy:-(Math.random()*110-30),t0:t,L:.5+rv*.8})}}
const fl=(len,ww,col,al)=>{const wob=Math.sin(t*70+i*2)*ww*.16;c.fillStyle='rgba('+col+','+al+')';c.beginPath();c.moveTo(Pq.x,Pq.y-ww/2);c.bezierCurveTo(Pq.x-len*.35,Pq.y-ww*.95+wob,Pq.x-len*.72,Pq.y-ww*.3-wob,Pq.x-len,Pq.y+wob*.6-ww*.1);c.bezierCurveTo(Pq.x-len*.72,Pq.y+ww*.5+wob,Pq.x-len*.35,Pq.y+ww*.95,Pq.x,Pq.y+ww/2);c.closePath();c.fill()};
fl(L*1.05,w*2.1,'255,31,79',.5);fl(L*.82,w*1.35,'255,95,125',.75);fl(L*.55,w*.8,'255,200,215',.9);fl(L*.3,w*.4,'255,255,255',1);
let gg=c.createRadialGradient(Pq.x-14,Pq.y,0,Pq.x-14,Pq.y,30+90*env);gg.addColorStop(0,'rgba(255,225,232,'+.85*env+')');gg.addColorStop(.35,'rgba(255,60,100,'+.5*env+')');gg.addColorStop(1,'rgba(255,31,79,0)');c.fillStyle=gg;c.fillRect(Pq.x-150,Pq.y-130,300,260);
c.save();c.translate(Pq.x-30,Pq.y+(v.car==='a'?26:20));c.scale(2.6,.32);gg=c.createRadialGradient(0,0,0,0,0,50);gg.addColorStop(0,'rgba(255,60,100,'+.55*env+')');gg.addColorStop(1,'rgba(255,31,79,0)');c.fillStyle=gg;c.fillRect(-60,-60,120,120);c.restore()}});
MP.sp.forEach(q=>{const a=t-q.t0,x=q.x+q.vx*a-62*a,y=q.y+q.vy*a+a*a*240,al=Math.max(0,1-a/q.L);c.strokeStyle='rgba(255,'+(130+al*100|0)+','+(150+al*80|0)+','+al+')';c.lineWidth=1.6;c.beginPath();c.moveTo(x,y);c.lineTo(x-q.vx*.035,y-(q.vy+a*480)*.035);c.stroke();const gs=c.createRadialGradient(x,y,0,x,y,5);gs.addColorStop(0,'rgba(255,255,255,'+al+')');gs.addColorStop(1,'rgba(255,31,79,0)');c.fillStyle=gs;c.fillRect(x-5,y-5,10,10)});
c.globalCompositeOperation='source-over';
'''
a=s.index("const PF=250,per=420"); s=s[:a]+flames+s[a:]

# D. notification cards
newtxt=r'''// exhaust notifications (screen space, portal colors)
MP.ev.forEach(v=>{const a=t-v.tb;if(a<0||a>5.6)return;const Pq=CPOS(v.car),al=Math.min(1,a*4)*Math.min(1,(5.6-a)*1.4),ex=Pq.x*u,ey=oy+Pq.y*u;c.save();c.globalAlpha=al;
const nm=v.n.toUpperCase(),t2=v.ln+(v.amt?'  '+v.amt:'');c.font='800 '+(v.big?15:13)+'px Verdana,sans-serif';const w1=c.measureText(nm).width;c.font='700 '+(v.big?13:11.5)+'px Verdana,sans-serif';const w2=c.measureText(t2).width,pw=Math.max(w1,w2)+36,ph=50,slide=(1-Math.min(1,a*3))*16;
const px=Math.max(12,Math.min(W-pw-12,ex-pw-70)),py=ey-ph-74+slide;
const lg=c.createLinearGradient(px+pw,py+ph,ex-24,ey-8);lg.addColorStop(0,'rgba(255,31,79,.9)');lg.addColorStop(1,'rgba(255,200,215,.2)');c.strokeStyle=lg;c.lineWidth=1.3;c.beginPath();c.moveTo(px+pw,py+ph);c.lineTo(ex-24,ey-8);c.stroke();
c.shadowColor='rgba(255,31,79,.8)';c.shadowBlur=22;c.fillStyle='rgba(7,3,10,.9)';c.fillRect(px,py,pw,ph);c.shadowBlur=0;c.strokeStyle='rgba(255,31,79,.75)';c.lineWidth=1;c.strokeRect(px+.5,py+.5,pw-1,ph-1);c.fillStyle='#ff1f4f';c.fillRect(px,py,4,ph);
c.textAlign='left';c.textBaseline='middle';c.fillStyle='#fff';c.font='800 '+(v.big?15:13)+'px Verdana,sans-serif';c.fillText(nm,px+16,py+17);c.fillStyle=v.big?'#ff7d99':'#ffb3c2';c.font='700 '+(v.big?13:11.5)+'px Verdana,sans-serif';c.fillText(t2,px+16,py+36);c.restore()});
'''
cut("// firework text (screen space, over the skyline)","if(typeof LB!=='undefined'&&LB.muted)",newtxt)

# E. fly transitions
s=s.replace("FLY.dur=kind==='login'?1500:kind==='exit'?1150:1050","FLY.dur=kind==='login'?1750:kind==='exit'?1900:1050",1)
newfly=r'''const cl=(x)=>Math.max(0,Math.min(1,x)),ln=(a,b,x)=>a+(b-a)*x;
const dr=(carv,gy,delay,dir,ph,sc)=>{const kk=cl((k-delay)/(1-delay));if(kk<=0||kk>=1)return;const mv=q=>{q=cl(q);return -320*sc+(q*q*(3-2*q)*.3+q*.7)*(W+640*sc)},x=mv(kk),y=gy+Math.sin(kk*5)*3*sc,ang=dir*(.2*Math.sin(Math.PI*Math.min(1,kk*1.15))+.05*Math.sin(kk*15)),env=Math.sin(Math.PI*cl(kk*1.1));
for(let i=26;i>=1;i--){const f=i/26,sx=mv(kk-i*.011);c.fillStyle='rgba(226,226,242,'+(.34*(1-f)*env)+')';c.beginPath();c.arc(sx+34*sc,y+6*sc-f*30*sc,(10+f*50)*sc/2.4,0,7);c.fill()}
c.globalCompositeOperation='lighter';for(let i=0;i<18;i++){const f=((now/230+i*.31)%1),sx=x+20*sc-f*140*sc-i*2,sy=y+3*sc-Math.sin(f*3.1)*30*sc*((i%3)+1)/2;c.fillStyle='rgba(255,'+(140+i*6)+',120,'+(1-f)*.95*env+')';c.fillRect(sx,sy,3.2,1.7)}c.globalCompositeOperation='source-over';
c.save();c.translate(x+100*sc,y);c.rotate(ang);car(c,-100*sc,0,sc,carv,sec,ph);c.restore()};
const vx=W*.5,vy=H*.4;
const away=(carv,sy0,delay,ph,sc,lane)=>{const kk=cl((k-delay)/(.8-delay));if(kk<=0)return;for(let g=3;g>=0;g--){const e2=Math.pow(cl(kk-g*.03),1.7),s2=sc*(1-.93*e2),x=ln(W*(.16+lane*.07),vx+lane*14,Math.pow(e2,.8)),y=ln(sy0,vy+10+lane*6,Math.pow(e2,.8));c.save();c.globalAlpha=(g?.14:1)*(1-cl((kk-.9)/.1));c.translate(x,y);c.scale(1-.62*e2,1);car(c,-100*s2,0,s2,carv,sec,ph);c.restore()}};
if(FLY.k==='login'){dr(FCAR_G,H*.56,.16,-1,1.3,s1*.72);dr(FCAR_R,H*.76,0,1,0,s1)}
else if(FLY.k==='exit'){c.globalCompositeOperation='lighter';const rr=rngS(31);for(let i=0;i<54;i++){const a=rr()*6.283,d0=50+rr()*120,sp=.55+rr()*.9,q=(k*sp*1.5+rr())%1,r0=d0+q*q*Math.max(W,H)*.95,r1=r0+(40+q*300)*(.4+rr()),ca=Math.cos(a),sa=Math.sin(a),gg=c.createLinearGradient(vx+ca*r0,vy+sa*r0,vx+ca*r1,vy+sa*r1);gg.addColorStop(0,'rgba(255,60,100,0)');gg.addColorStop(1,'rgba(255,175,195,'+.6*mid+')');c.strokeStyle=gg;c.lineWidth=1+q*2.4;c.beginPath();c.moveTo(vx+ca*r0,vy+sa*r0);c.lineTo(vx+ca*r1,vy+sa*r1);c.stroke()}
const g2=c.createRadialGradient(vx,vy,0,vx,vy,40+k*k*Math.max(W,H)*.75);g2.addColorStop(0,'rgba(255,255,255,'+.85*k*k+')');g2.addColorStop(.3,'rgba(255,60,100,'+.5*k+')');g2.addColorStop(1,'rgba(255,31,79,0)');c.fillStyle=g2;c.fillRect(0,0,W,H);c.globalCompositeOperation='source-over';
away(FCAR_G,H*.58,.1,1.3,s1*.8,.8);away(FCAR_R,H*.78,0,0,s1*1.05,-.3);
const fl=cl((k-.55)/.45);if(fl>0){c.fillStyle='rgba(255,236,242,'+.98*Math.sin(Math.PI*fl)+')';c.fillRect(-10,-10,W+20,H+20)}}
else pass(0,H*.66,s1,FCAR_R,0,0);
'''
cut("if(FLY.k==='login'){pass(0,H*.50","c.restore();FLY.raf=requestAnimationFrame(flyFrame)}",newfly)

# F. boot: no drips, panel fades out, exit timing
assert "fxDrips();if(mcv)" in s
s=s.replace("fxDrips();if(mcv)","if(mcv)",1)
s=s.replace("setTimeout(()=>{fxFly('exit');setTimeout(fin,760)},3850)","setTimeout(()=>{b.classList.add('out');fxFly('exit');setTimeout(fin,1500)},3850)",1)
css='''
#boot.seam .drips,#boot.seam .scn::after{display:none}
#boot.seam.out .bt{opacity:0;transform:scale(.92);transition:opacity .45s,transform .45s}
'''
i=s.rindex('</style>'); s=s[:i]+css+s[i:]
open(P,'w').write(s); print('ok')
