P='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(P).read()
def rep(a,b,n=1):
    global s
    assert a in s,a[:70]
    s=s.replace(a,b,n)

# ---- hero simplification
i=s.index('<header class=hxn>'); j=s.index('</header>',i)+len('</header>')
s=s[:i]+s[j:]
rep("Agency Command Station &middot; Est. 2026</div><h1 class=hxh><span class=o>Only</span> <span class=w>Winners</span><span class=am>&amp;</span><span class=q>Quitters</span></h1>","</div><h1 class=hxh><span class=o>Only</span> <span class=w>Winners</span><span class=am>&amp;</span><span class=q>Quitters</span></h1><div class=hxe>Agency Portal</div>")
a=s.index('<div class=hxm><div class=hxe></div>')
s=s[:a]+'<div class=hxm>'+s[a+len('<div class=hxm><div class=hxe></div>'):]
# remove sub + stats
k=s.index('<p class=hxs>'); k2=s.index('</div></div></div><div class=hxd>',k)
s=s[:k]+'</div><div class=hxd>'+s[k2+len('</div></div></div><div class=hxd>'):]
rep("padding:clamp(84px,13vh,128px) clamp(14px,3vw,40px) 70px","padding:clamp(34px,6.5vh,70px) clamp(14px,3vw,40px) 70px")
rep("#login .hxe{display:inline-flex;","#login .hxe{margin-top:18px;display:inline-flex;")
rep("animation:hxu .8s .1s cubic-bezier(.2,.8,.2,1) forwards}","animation:hxu .8s .9s cubic-bezier(.2,.8,.2,1) forwards}")
rep("top:70px;left:0;right:0;z-index:5","top:20px;left:0;right:0;z-index:5")
s=s.replace("#login .hxm{padding-top:84px}","#login .hxm{padding-top:40px}")
rep("radial-gradient(ellipse 62% 24% at 50% 27%","radial-gradient(ellipse 62% 20% at 50% 14%")
rep("hxClock();LGMSG=''}","LGMSG=''}")
s=s.replace("hxTicker();hxClock();","hxTicker();")

# ---- seamless transition
rep("function mapOn(){const l=document.getElementById('login');return !!l&&","function mapOn(){const l=document.getElementById('login');return !!MP.hold||!!l&&")
rep("FLY.dur=kind==='login'?1500:1050","FLY.dur=kind==='login'?1500:kind==='exit'?1150:1050")
rep("else pass(0,H*.66,s1,FCAR_R,0,0);\nc.restore()","else if(FLY.k==='exit'){pass(0,H*.60,s1*1.2,FCAR_R,0,0);pass(0,H*.76,s1*.9,FCAR_G,.08,2.1);const fl=Math.max(0,Math.min(1,(k-.3)/.7));if(fl>0){c.fillStyle='rgba(255,236,242,'+.97*Math.sin(Math.PI*fl)+')';c.fillRect(-10,-10,W+20,H+20)}}\nelse pass(0,H*.66,s1,FCAR_R,0,0);\nc.restore()")
# doLogin timeline
old_start=s.index("fxLogin();fxFly('login');\nWHO=LG;")
old_end=s.index("tab='Command Deck';ONLINE=1;",old_start)
new='''fxLogin();fxFly('login');
WHO=LG;const l=document.getElementById('login');MP.hold=1;const mcv=document.getElementById('lgmap');if(mcv&&!RM)mcv.classList.add('launch');l.classList.add('leave');
setTimeout(()=>{l.className='';l.innerHTML='';document.getElementById('who').innerHTML=`<span class=whr>${av(WHO,30)}<span>OPERATOR<br>${esc(WHO.toUpperCase())}</span></span>`;if(!RM){const b=document.getElementById('boot'),pc=document.getElementById('bpc'),bar=b.querySelector&&b.querySelector('.bp i')||{style:{}},t0=Date.now(),iv=setInterval(()=>{const x=Math.min(100,Math.round((Date.now()-t0)/3800*100));if(pc)pc.textContent='LOADING '+x+'%';bar.style.width=x+'%'},60);bar.style.width='0%';b.className='on seam';fxDrips();if(mcv){mcv.classList.remove('launch');mcv.classList.add('cruise')}
const fin=()=>{clearInterval(iv);b.className='';MP.hold=0;if(mcv)mcv.classList.remove('cruise','launch','leave')};b.onclick=()=>{fin()};setTimeout(()=>{fxFly('exit');setTimeout(fin,760)},3850)}else{MP.hold=0}'''
s=s[:old_start]+new+s[old_end:]
# closing of setTimeout stays: original tail "...simLoop()},RM?100:1400)}" unchanged
# CSS
css='''
/* ===== SEAMLESS LAUNCH ===== */
#login.leave .lgc{animation:lvc .9s cubic-bezier(.5,0,.9,.4) forwards;pointer-events:none}
@keyframes lvc{to{opacity:0;transform:scale(.9) translateY(-14px);filter:blur(6px)}}
#login.leave .hxb{animation:none;opacity:0;transition:opacity .6s}
#lgmap.launch{transition:transform 1.5s cubic-bezier(.55,0,.85,.35),filter 1.5s;transform:scale(1.5) translate3d(0,2%,0)!important;filter:blur(2px) brightness(1.25) saturate(1.2)}
#lgmap.cruise{transition:transform 3.4s cubic-bezier(.2,.7,.2,1),filter 2s;transform:scale(1.16) translate3d(0,1%,0)!important;filter:brightness(.9)}
#boot.seam{z-index:320;background:linear-gradient(180deg,rgba(3,1,6,.35),rgba(3,1,6,.1) 40%,rgba(3,1,6,.55));animation:bsm .7s ease-out both}
@keyframes bsm{from{opacity:0}to{opacity:1}}
#boot.seam .pool,#boot.seam .bgl{display:none}
#boot.seam .bt{padding:30px 34px 26px;background:rgba(5,1,8,.62);backdrop-filter:blur(10px);border:1px solid rgba(255,31,79,.38);box-shadow:0 0 70px rgba(255,31,79,.22),0 24px 70px rgba(0,0,0,.6);margin-top:-8vh}
'''
i=s.rindex('</style>'); s=s[:i]+css+s[i:]
# lockView / mapStart reset
rep("cv.className='on';mapSize();","cv.className='on';cv.classList.remove('launch','cruise');MP.hold=0;mapSize();")
open(P,'w').write(s); print('ok')
