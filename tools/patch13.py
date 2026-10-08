p='/mnt/user-data/outputs/owq-command-station-v2.html'
h=open(p).read()
a=h.index('<div id=boot>');b=h.index('id=bpc>LOADING 0%</span></div></div>',a)+len('id=bpc>LOADING 0%</span></div></div>')
h=h[:a]+'<div id=boot><div class=bgl></div><div class=drips id=drips></div><div class=pool></div><div class=scn></div><div class=bt><small class=bk>OWQ COMMAND STATION</small><b data-t="FINANCIAL FREEDOM">FINANCIAL FREEDOM</b><div class=bp><i></i></div><span class=bpc id=bpc>LOADING 0%</span><em class=bst id=bst>UNLOCKING THE VAULT</em></div></div>'+h[b:]
css="""
#boot{overflow:hidden;background:radial-gradient(ellipse at 50% 45%,#2a0610 0%,#0a0308 55%,#020104 100%)}
#boot .bgl{position:absolute;inset:-20%;background:radial-gradient(circle at 50% 50%,rgba(255,31,79,.22),transparent 45%);animation:bgp 2.4s ease-in-out infinite}
#boot .scn{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 1px,transparent 1px 3px);mix-blend-mode:multiply;pointer-events:none}
#boot .scn::after{content:'';position:absolute;left:0;right:0;height:140px;top:-140px;background:linear-gradient(transparent,rgba(255,31,79,.12),transparent);animation:scanmv 3.2s linear infinite}
#boot .drips{position:absolute;inset:0;pointer-events:none}
#boot .drips::before{content:'';position:absolute;left:0;right:0;top:0;height:14px;background:linear-gradient(#ff1f4f,#b3123a);box-shadow:0 0 40px 8px rgba(255,31,79,.55);border-radius:0 0 50% 50%/0 0 100% 100%}
.drp{position:absolute;top:0;width:var(--w);left:var(--x);height:0;background:linear-gradient(#ff1f4f 0,#c2143f 60%,#7d0b27);border-radius:0 0 var(--w) var(--w);box-shadow:0 0 12px rgba(255,31,79,.55);animation:dripd var(--d) var(--dl) cubic-bezier(.45,.05,.55,1) forwards}
.drp::after{content:'';position:absolute;left:50%;bottom:calc(var(--w)*-.9);width:calc(var(--w)*1.7);height:calc(var(--w)*2.1);margin-left:calc(var(--w)*-.85);background:#ff1f4f;border-radius:50% 50% 55% 55%/35% 35% 65% 65%;box-shadow:0 0 14px rgba(255,31,79,.8),inset -2px -3px 4px rgba(120,0,25,.6)}
#boot .pool{position:absolute;left:0;right:0;bottom:0;height:0;background:linear-gradient(#b3123a,#4a0515);box-shadow:0 -10px 40px rgba(255,31,79,.5);animation:poolg 4s 1s ease-in forwards}
#boot .bt{position:relative;z-index:2;text-align:center;width:min(560px,88vw)}
#boot .bk{display:block;font-size:11px;letter-spacing:8px;color:#ff7a95;margin-bottom:18px;opacity:.85}
#boot .bt b{position:relative;display:block;font-size:clamp(28px,7vw,54px);font-weight:900;letter-spacing:10px;line-height:1.15;color:#fff;margin-bottom:30px;text-shadow:0 0 6px #ff1f4f,0 0 22px #ff1f4f,0 0 60px #b3123a;animation:ttlf 3s infinite}
#boot .bt b::before,#boot .bt b::after{content:attr(data-t);position:absolute;left:0;right:0;top:0;opacity:.75;mix-blend-mode:screen;pointer-events:none}
#boot .bt b::before{color:#ff1f4f;animation:gl1 2.2s infinite steps(1)}#boot .bt b::after{color:#27e0ff;animation:gl2 2.2s infinite steps(1)}
#boot .bp{position:relative;height:16px;border:1px solid rgba(255,31,79,.7);border-radius:2px;background:rgba(10,2,6,.85);box-shadow:0 0 24px rgba(255,31,79,.45),inset 0 0 12px rgba(0,0,0,.9);overflow:hidden}
#boot .bp i{position:relative;background:linear-gradient(90deg,#7d0b27,#ff1f4f 70%,#ff8aa3);box-shadow:0 0 18px #ff1f4f;height:100%}
#boot .bp i::after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.65) 50%,transparent 70%);animation:shn 1s linear infinite}
#boot .bp::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 13px,rgba(0,0,0,.65) 13px 15px)}
#boot .bpc{display:block;margin-top:14px;font-size:13px;letter-spacing:6px;color:#fff;text-shadow:0 0 10px #ff1f4f}
#boot .bst{display:block;margin-top:10px;font-style:normal;font-size:10px;letter-spacing:5px;color:#ff7a95;animation:bstf 1s steps(2) infinite}
@keyframes dripd{0%{height:0}70%{height:var(--h)}100%{height:calc(var(--h)*1.06)}}
@keyframes poolg{to{height:9vh}}@keyframes bgp{50%{opacity:.45;transform:scale(1.08)}}@keyframes scanmv{to{transform:translateY(130vh)}}
@keyframes ttlf{0%,100%{opacity:1}92%{opacity:1}93%{opacity:.55}94%{opacity:1}96%{opacity:.7}97%{opacity:1}}
@keyframes gl1{0%,88%,100%{transform:translate(0)}90%{transform:translate(-4px,1px)}94%{transform:translate(3px,-1px)}}@keyframes gl2{0%,88%,100%{transform:translate(0)}91%{transform:translate(4px,-1px)}95%{transform:translate(-3px,1px)}}
@keyframes shn{from{transform:translateX(-100%)}to{transform:translateX(100%)}}@keyframes bstf{50%{opacity:.45}}
"""
h=h.replace("#boot{display:none}#boot.on{display:flex}","#boot{display:none}#boot.on{display:flex}"+css,1)
# JS: build drips + status text on show
old="b.className='on';b.onclick=()=>{b.className='';clearInterval(iv)};"
assert old in h
new="b.className='on';fxDrips();b.onclick=()=>{b.className='';clearInterval(iv)};"
h=h.replace(old,new)
js="""const BST=['UNLOCKING THE VAULT','SYNCING YOUR NUMBERS','ARMING THE LEADERBOARD','BUILDING THE FUTURE','FINANCIAL FREEDOM ONLINE'];
function fxDrips(){try{const d=document.getElementById('drips');if(!d)return;let s='';const n=34;for(let i=0;i<n;i++){const x=(i+Math.random()*.9)/n*100,w=3+Math.random()*9,hh=12+Math.random()*(i%4===0?62:38),dl=Math.random()*1.6,du=1.4+Math.random()*2.6;s+='<i class=drp style="--x:'+x.toFixed(2)+'%;--w:'+w.toFixed(1)+'px;--h:'+hh.toFixed(0)+'vh;--dl:'+dl.toFixed(2)+'s;--d:'+du.toFixed(2)+'s"></i>'}d.innerHTML=s;const st=document.getElementById('bst');if(st){let k=0;st.textContent=BST[0];const t=setInterval(()=>{k++;if(k>=BST.length||!document.getElementById('boot').className){clearInterval(t);return}st.textContent=BST[k]},800)}}catch(e){}}
"""
h=h.replace("const SONGS={}",js+"const SONGS={}",1)
open(p,'w').write(h)
