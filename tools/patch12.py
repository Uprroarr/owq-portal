import re
p='/mnt/user-data/outputs/owq-command-station-v2.html'
h=open(p).read()
# 1 boot markup
a=h.index('<div id=boot>');b=h.index('</div></div></div>',a)+len('</div></div></div>')
h=h[:a]+'<div id=boot><div class=bt><b>FINANCIAL FREEDOM</b><div class=bp><i></i></div><span class=bpc id=bpc>LOADING 0%</span></div></div>'+h[b:]
# 2 css
h=h.replace("animation:bootout .7s 2.7s forwards;cursor:pointer}","animation:bootout .7s 3.7s forwards;cursor:pointer}")
h=h.replace("animation:load 2.5s ease-out both}","animation:load 3.8s cubic-bezier(.3,.6,.3,1) both}")
h=h.replace("@keyframes mq{","#boot .bt{text-align:center;width:min(520px,86vw)}#boot .bt b{font-size:clamp(22px,5vw,34px);letter-spacing:8px;margin-bottom:26px}#boot .bp{height:6px;border-radius:3px;overflow:hidden}#boot .bpc{margin-top:12px;font-size:11px;letter-spacing:4px;animation:none}@keyframes mq{",1)
# 3 boot timing in doLogin
old="if(!RM){const b=document.getElementById('boot');b.className='on';b.onclick=()=>b.className='';setTimeout(()=>b.className='',3500)}"
assert old in h
h=h.replace(old,"if(!RM){const b=document.getElementById('boot'),pc=document.getElementById('bpc'),t0=Date.now(),iv=setInterval(()=>{const x=Math.min(100,Math.round((Date.now()-t0)/3800*100));pc.textContent='LOADING '+x+'%'},80);b.className='on';b.onclick=()=>{b.className='';clearInterval(iv)};setTimeout(()=>{b.className='';clearInterval(iv)},4500)}")
# 4 remove load-time intro listener, voice; song slot
a=h.index("function fxIntro()");b=h.index("function fxSay(")
h=h[:a]+h[b:]
a=h.index("function fxLogin()");b=h.index("const PWD={")
new="""const SONGS={};
function fxLogin(){let done=0;try{const src=SONGS[LG];if(src){const au=new Audio(src);au.volume=.9;au.play().catch(()=>{});setTimeout(()=>{const f=setInterval(()=>{au.volume=Math.max(0,au.volume-.08);if(au.volume<=.01){clearInterval(f);au.pause()}},120)},9000);done=1}}catch(e){}if(!done){const c=fxCtx();if(c){const t=c.currentTime+.02;fxRise(c,t,.9,.1);fxHit(c,t+.9,98,1.2,.5);fxHit(c,t+.9,49,1.4,.55)}}}
"""
h=h[:a]+new+h[b:]
assert "fxIntro" not in h.replace("FXI","")
open(p,'w').write(h)
