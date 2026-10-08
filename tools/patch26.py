p='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1,(a[:60],s.count(a));s=s.replace(a,b)
rep('<canvas id=lgfx aria-hidden="true"></canvas><div id=cbars></div>','<canvas id=lgfx aria-hidden="true"></canvas><div id=cine aria-hidden="true"><canvas id=cbl width=192 height=108></canvas><canvas id=cbs width=192 height=108></canvas><div class=cgd></div><div class=clk></div><div class=cgr></div><div class=cvg></div><svg width=0 height=0 style="position:absolute"><filter id=cstreak x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="70 1.5"/></filter></svg></div><div id=cbars></div>')
css="""#cine{position:fixed;inset:0;z-index:505;pointer-events:none;display:none;overflow:hidden}#cine.on{display:block}
#cine canvas{position:absolute;inset:0;width:100%;height:100%}
#cbl{filter:blur(9px) saturate(1.35);mix-blend-mode:screen;opacity:.7}
#cbs{filter:url(#cstreak) sepia(1) hue-rotate(165deg) saturate(2.6) brightness(1.6);mix-blend-mode:screen;opacity:.55}
.cgd{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,205,255,.22),rgba(120,40,200,.1) 45%,rgba(255,40,120,.26));mix-blend-mode:soft-light}
.clk{position:absolute;inset:-20%;background:radial-gradient(circle at 20% 30%,rgba(255,150,60,.55),transparent 38%),radial-gradient(circle at 85% 70%,rgba(255,31,120,.5),transparent 40%);mix-blend-mode:screen;opacity:.16;animation:clkd 16s ease-in-out infinite alternate}
@keyframes clkd{to{transform:translate3d(6%,-4%,0) scale(1.15);opacity:.24}}
.cgr{position:absolute;inset:-60px;background-image:var(--grain);background-size:160px 160px;mix-blend-mode:overlay;opacity:.16;animation:cgrn .5s steps(5) infinite}
@keyframes cgrn{0%{transform:translate(0,0)}20%{transform:translate(-31px,17px)}40%{transform:translate(23px,-29px)}60%{transform:translate(-17px,-41px)}80%{transform:translate(37px,23px)}100%{transform:translate(0,0)}}
.cvg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 52%,transparent 48%,rgba(0,0,0,.35) 78%,rgba(0,0,0,.7) 100%)}
@media(prefers-reduced-motion:reduce){.cgr,.clk{animation:none}}
"""
s=s.replace("</style>",css+"</style>",1)
js=r"""
/* ===== CINEMATIC GRADE (bloom, streaks, grain, vignette) over the login scene and transitions ===== */
const CIN={raf:0,n:0,on:0,grain:0};
function cinWant(){try{const m=document.getElementById('lgmap'),f=document.getElementById('lgfx');return !!((m&&m.classList.contains('on'))||(f&&f.style.display==='block'))}catch(e){return false}}
function cinFrame(){CIN.raf=0;const cn=document.getElementById('cine');if(!cn)return;if(!cinWant()){cn.classList.remove('on');return}cn.classList.add('on');
try{if(!CIN.grain){CIN.grain=1;const g=document.createElement('canvas');g.width=g.height=160;const x=g.getContext('2d'),d=x.createImageData(160,160);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255|0;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}x.putImageData(d,0,0);cn.style.setProperty('--grain','url('+g.toDataURL()+')')}
if((CIN.n++&1)===0){const m=document.getElementById('lgmap'),f=document.getElementById('lgfx'),a=document.getElementById('cbl'),b=document.getElementById('cbs'),W=innerWidth||1,H=innerHeight||1,bh=Math.max(54,Math.round(192*H/W));if(a.height!==bh){a.height=bh;b.height=bh}
const ca=a.getContext('2d'),cb=b.getContext('2d'),fx=f&&f.style.display==='block';
ca.globalCompositeOperation='copy';ca.filter='brightness(.8) contrast(1.6) saturate(1.3)';ca.drawImage(m,0,0,192,bh);if(fx)ca.drawImage(f,0,0,192,bh);ca.filter='none';
cb.globalCompositeOperation='copy';cb.filter='grayscale(1) brightness(.55) contrast(4.2)';cb.drawImage(m,0,0,192,bh);if(fx)cb.drawImage(f,0,0,192,bh);cb.filter='none'}}catch(e){}
CIN.raf=requestAnimationFrame(cinFrame)}
try{setInterval(()=>{if(!CIN.raf&&cinWant()&&typeof requestAnimationFrame!=='undefined')CIN.raf=requestAnimationFrame(cinFrame)},300)}catch(e){}
"""
rep("const views={",js+"\nconst views={")
open(p,'w').write(s)
