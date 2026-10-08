P='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(P).read()
def rep(a,b,n=1):
    global s
    assert a in s,a[:90]
    s=s.replace(a,b,n)

# timing
rep("kind==='run'?4300:1050","kind==='run'?5500:1050")
rep("t0c=run?380:260,","t0c=run?900:260,")
rep("trav=acc*92+sec*0,","trav=acc*92+(run?tt/1000*15:0),")
rep("'rgba(255,180,200,'+.55*Math.min(1,acc*3)+')'","'rgba(255,180,200,'+.55*Math.min(1,acc*3+(run?.6:0))+')'")
rep("const hA=ss((tt-560)/420)*","const hA=ss((tt-(run?1000:560))/420)*")

# cars block
a=s.index("const cars=[{lat:-1.08,c:'r',z0:1.55,dl:0}")
bm="carRear(c,cx,gy,w,o.c,now,Math.min(1,o.pp*3)*(1-o.pp))});"
b=s.index(bm,a)+len(bm)
new=r'''const driftT=1500,defs=[{lat:-1.08,c:'r',z0:1.55,dl:0,from:-5.6,dir:1,dly:180,d2:0},{lat:1.12,c:'g',z0:1.85,dl:.05,from:6,dir:-1,dly:420,d2:160}];
const stF=(o,T)=>{if(run){const q=cl((T-o.dly)/1150),eo=1-Math.pow(1-q,3),pp=cl((T-driftT-o.d2)/(peakT+120-driftT-o.d2));return{z:o.z0*Math.pow(70/o.z0,Math.pow(pp,1.1)),lat:o.from+(o.lat-o.from)*eo,ang:o.dir*kfi(q,[[0,.5],[.3,.26],[.58,-.16],[.8,.06],[1,0]]),pp,q}}const pp=cl((p-o.dl)/(1-o.dl));return{z:o.z0*Math.pow(70/o.z0,Math.pow(pp,1.1)),lat:o.lat,ang:0,pp,q:1}};
const cars=defs.map(o=>Object.assign({},o,stF(o,tt))).sort((a,b)=>b.z-a.z);
if(run){const kill=1-ss((tt-driftT)/700);if(kill>0)defs.forEach(o=>{for(let i=0;i<30;i++){const T=tt-i*40,st=stF(o,T);if(T<o.dly||st.pp>0)continue;const age=i*40,w2=1.6*Wd/st.z,gy2=hy+Hd/st.z,cx2=vx+st.lat*Wd/st.z,al=.36*(1-age/1200)*Math.pow(Math.sin(Math.PI*cl((T-o.dly)/1150)),.5)*kill;if(al<=.01)continue;[-1,1].forEach(sg=>{const x=cx2+sg*.44*w2+sg*age*.22*(w2/300),y=gy2-.03*w2+age*.05*(w2/300),rr=(.1+age*.0006)*w2,gg=c.createRadialGradient(x,y,0,x,y,rr);gg.addColorStop(0,'rgba(238,230,242,'+al+')');gg.addColorStop(.6,'rgba(205,195,215,'+al*.55+')');gg.addColorStop(1,'rgba(190,180,200,0)');c.fillStyle=gg;c.beginPath();c.arc(x,y,rr,0,7);c.fill()})}})}
cars.forEach(o=>{const z=o.z,w=1.6*Wd/z,gy=hy+Hd/z,cx=vx+o.lat*Wd/z+(o.q>=1?Math.sin(sec*2.2+o.lat)*.05*w:0);
c.globalCompositeOperation='lighter';if(o.q>=1)[-1,1].forEach(sg=>{const x0=cx+sg*.32*w,y0=gy-.187*w,zb=Math.max(.7,z-6.5),xb=vx+(o.lat+sg*.32*1.6/1)*Wd/zb,yb=hy+Hd/zb-.187*(1.6*Wd/zb);const gg=c.createLinearGradient(x0,y0,xb,yb);gg.addColorStop(0,'rgba(255,60,100,'+.6*Math.min(1,o.pp*4)+')');gg.addColorStop(1,'rgba(255,31,79,0)');c.strokeStyle=gg;c.lineWidth=Math.max(1,.05*w);c.beginPath();c.moveTo(x0,y0);c.lineTo(xb,yb);c.stroke()});c.globalCompositeOperation='source-over';
const hot=run?Math.min(1,.55+o.pp*3)*(1-o.pp):Math.min(1,o.pp*3)*(1-o.pp);
if(o.ang){c.save();c.translate(cx,gy);c.rotate(o.ang);c.transform(1,0,-o.ang*.5,1,0,0);carRear(c,0,0,w,o.c,now,hot);c.restore()}else carRear(c,cx,gy,w,o.c,now,hot)});'''
s=s[:a]+new+s[b:]

# doLogin: straight into the scene
rep("fxLogin();fxFly('login');\nWHO=LG;","fxLogin();fxFly('run');\nWHO=LG;")
rep("setTimeout(()=>{l.className='';l.innerHTML='';document.getElementById('who').innerHTML=`<span class=whr>${av(WHO,30)}<span>OPERATOR<br>${esc(WHO.toUpperCase())}</span></span>`;if(!RM){fxFly('run');setTimeout(fin,FLY.dur-260)}else{MP.hold=0}","if(!RM)setTimeout(fin,FLY.dur-260);\nsetTimeout(()=>{l.className='';l.innerHTML='';document.getElementById('who').innerHTML=`<span class=whr>${av(WHO,30)}<span>OPERATOR<br>${esc(WHO.toUpperCase())}</span></span>`;if(RM){MP.hold=0}")
rep("setTimeout(scanStream,RM?400:5600);simLoop()},RM?100:1500)}","setTimeout(scanStream,RM?400:5600);simLoop()},RM?100:650)}")
open(P,'w').write(s); print('ok')
