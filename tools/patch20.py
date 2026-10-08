P='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(P).read()
def rep(a,b,n=1):
    global s
    assert a in s,a[:90]
    s=s.replace(a,b,n)
rep("FLY.dur=kind==='login'?2100:kind==='exit'?2600:1050","FLY.dur=kind==='login'?1500:kind==='exit'?2600:kind==='run'?4300:1050")
rep("if(FLY.k==='exit'){flyChase(c,W,H,k,now);","if(FLY.k==='exit'||FLY.k==='run'){flyChase(c,W,H,k,now);")
rep("p=cl((k-.1)/.84),acc=Math.pow(p,1.75),reveal=ss(k/.17),edge=","run=FLY.k==='run',tt=k*FLY.dur,peakT=FLY.dur-260,t0c=run?380:260,p=cl((tt-t0c)/(peakT+120-t0c)),acc=Math.pow(p,1.75),reveal=ss(tt/(run?520:442)),edge=")
rep("const fa=k<.72?0:(k<.9?ss((k-.72)/.18):1-ss((k-.9)/.1));","""if(run){const hA=ss((tt-560)/420)*(1-ss((tt-(peakT-520))/420));if(hA>0){const pd=cl(p/.96),sz=Math.max(22,Math.min(56,W*.04)),bw=Math.min(640,W*.62),bx=(W-bw)/2,by=H*.8,msgs=['UNLOCKING THE VAULT','SYNCING YOUR NUMBERS','LOADING THE LEADERBOARD','FINANCIAL FREEDOM ONLINE'];c.save();c.globalAlpha=hA;c.textAlign='center';c.textBaseline='middle';
try{c.letterSpacing=(sz*.26)+'px'}catch(e){}c.font='800 '+sz+'px Verdana,sans-serif';c.shadowColor='rgba(255,31,79,1)';c.shadowBlur=34;c.fillStyle='#fff';c.fillText('FINANCIAL FREEDOM',W/2+sz*.13,H*.2);c.shadowBlur=10;c.fillText('FINANCIAL FREEDOM',W/2+sz*.13,H*.2);
try{c.letterSpacing='6px'}catch(e){}c.shadowBlur=0;c.font='600 11px Verdana,sans-serif';c.fillStyle='#ff8da3';c.fillText(msgs[Math.min(3,Math.floor(pd*4))],W/2+3,H*.2+sz*.95);
c.fillStyle='rgba(8,2,12,.8)';c.fillRect(bx,by,bw,14);c.strokeStyle='rgba(255,31,79,.8)';c.lineWidth=1;c.strokeRect(bx+.5,by+.5,bw-1,13);
const fw=Math.max(2,(bw-4)*pd),gg=c.createLinearGradient(bx,0,bx+fw,0);gg.addColorStop(0,'#5a0719');gg.addColorStop(.7,'#ff1f4f');gg.addColorStop(1,'#ffb0c0');c.shadowColor='#ff1f4f';c.shadowBlur=16;c.fillStyle=gg;c.fillRect(bx+2,by+2,fw,10);c.shadowBlur=0;
c.fillStyle='rgba(0,0,0,.6)';for(let x=bx+12;x<bx+bw-2;x+=12)c.fillRect(x,by+2,2,10);
const hx=bx+2+fw;c.globalCompositeOperation='lighter';[-1,1].forEach(sg=>{const g2=c.createRadialGradient(hx-8,by+7+sg*3,0,hx-8,by+7+sg*3,14);g2.addColorStop(0,'rgba(255,255,255,.95)');g2.addColorStop(.3,'rgba(255,50,90,.8)');g2.addColorStop(1,'rgba(255,31,79,0)');c.fillStyle=g2;c.fillRect(hx-24,by-8,32,30)});c.globalCompositeOperation='source-over';
try{c.letterSpacing='7px'}catch(e){}c.font='700 13px Verdana,sans-serif';c.fillStyle='#fff';c.shadowColor='#ff1f4f';c.shadowBlur=12;c.fillText('LOADING '+Math.round(pd*100)+'%',W/2+3,by+36);try{c.letterSpacing='0px'}catch(e){}c.restore()}}
const rampT=470,fa=tt<peakT-rampT?0:tt<peakT?ss((tt-(peakT-rampT))/rampT):1-ss((tt-peakT)/260);""")

# doLogin rewrite
a=s.index("fxLogin();fxFly('login');\nWHO=LG;")
b=s.index("tab='Command Deck';ONLINE=1;",a)
new='''fxLogin();fxFly('login');
WHO=LG;const l=document.getElementById('login');MP.hold=1;const cbr=document.getElementById('cbars');if(cbr&&!RM)cbr.classList.add('on');if(!RM)document.body.classList.add('hush');l.classList.add('leave');
const fin=()=>{MP.hold=0;MP.boost=1;MP.ca=1;if(cbr)cbr.classList.remove('on');document.body.classList.remove('hush')};
setTimeout(()=>{l.className='';l.innerHTML='';document.getElementById('who').innerHTML=`<span class=whr>${av(WHO,30)}<span>OPERATOR<br>${esc(WHO.toUpperCase())}</span></span>`;if(!RM){fxFly('run');setTimeout(fin,FLY.dur-260)}else{MP.hold=0}'''
s=s[:a]+new+s[b:]
rep("setTimeout(scanStream,RM?400:3700);simLoop()},RM?100:1700)}","setTimeout(scanStream,RM?400:5600);simLoop()},RM?100:1500)}")
i=s.rindex('</style>'); s=s[:i]+"body.hush .ts,body.hush .pop{visibility:hidden!important}\n"+s[i:]
open(P,'w').write(s); print('ok')
