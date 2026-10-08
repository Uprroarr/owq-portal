import re
P='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(P).read()

css=r'''
/* ===== HERO INTRO v15 ===== */
#login .hxv{position:absolute;inset:0;pointer-events:none;z-index:0;background:
 radial-gradient(ellipse at 50% 46%,rgba(2,1,4,0) 38%,rgba(2,1,4,.62) 100%),
 linear-gradient(180deg,rgba(3,1,6,.82) 0,rgba(3,1,6,.34) 30%,rgba(3,1,6,0) 52%,rgba(3,1,6,.12) 68%,rgba(3,1,6,.9) 100%)}
#login .hxg{position:absolute;inset:-50%;pointer-events:none;z-index:1;opacity:.11;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");animation:hxg .9s steps(6) infinite}
@keyframes hxg{0%{transform:translate(0,0)}20%{transform:translate(-3%,2%)}40%{transform:translate(2%,-3%)}60%{transform:translate(-2%,-1%)}80%{transform:translate(3%,3%)}100%{transform:translate(0,0)}}
#login .hxf{position:absolute;left:0;right:0;height:2px;z-index:1;pointer-events:none;top:63%;background:linear-gradient(90deg,transparent,rgba(255,60,100,.0) 20%,rgba(255,90,125,.85) 50%,rgba(255,60,100,0) 80%,transparent);filter:blur(1px);box-shadow:0 0 40px 8px rgba(255,31,79,.35);transform:translateX(-120%);animation:hxf 9s cubic-bezier(.5,0,.2,1) infinite 2s}
@keyframes hxf{0%{transform:translateX(-120%);opacity:0}8%{opacity:1}55%{transform:translateX(120%);opacity:1}60%,100%{transform:translateX(120%);opacity:0}}
#login .hxn{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;align-items:center;justify-content:space-between;padding:16px clamp(16px,3.2vw,44px);border-bottom:1px solid rgba(255,31,79,.22);background:linear-gradient(180deg,rgba(4,1,7,.78),rgba(4,1,7,.35));backdrop-filter:blur(8px)}
#login .hxl{display:flex;align-items:center;gap:11px;font:800 13px/1 Verdana,sans-serif;letter-spacing:3px;color:#fff;text-transform:uppercase}
#login .hxl i{width:30px;height:30px;display:grid;place-items:center;font-style:normal;font-size:12px;letter-spacing:0;border:1.5px solid #ff1f4f;color:#fff;background:linear-gradient(135deg,#ff1f4f,#7a0a24);transform:skewX(-10deg);box-shadow:0 0 18px rgba(255,31,79,.55)}
#login .hxl small{display:block;font-weight:400;font-size:8px;letter-spacing:3px;color:#ff8da3;margin-top:4px}
#login .hxk{display:flex;gap:clamp(14px,2.6vw,38px);font:600 10px/1 Verdana,sans-serif;letter-spacing:2.5px;color:#cdb6bd;text-transform:uppercase}
#login .hxk span{position:relative;padding:6px 0}
#login .hxk span:after{content:"";position:absolute;left:0;bottom:0;height:1px;width:0;background:#ff1f4f;transition:.3s}
#login .hxk span:hover:after,#login .hxk span.a:after{width:100%}
#login .hxk span.a{color:#fff}
#login .hxr{display:flex;align-items:center;gap:14px;font:600 10px/1 Verdana,sans-serif;letter-spacing:2px;color:#e8d3d9}
#login .hxr b{display:flex;align-items:center;gap:7px;font-weight:600;color:#9dffc6}
#login .hxr b:before{content:"";width:7px;height:7px;border-radius:50%;background:#2bff88;box-shadow:0 0 10px #2bff88;animation:hxp 1.6s ease-in-out infinite}
@keyframes hxp{50%{opacity:.3;transform:scale(.7)}}
#login .hxc{padding:6px 10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.04);font-variant-numeric:tabular-nums}
#login .hxm{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:clamp(84px,13vh,128px) clamp(14px,3vw,40px) 70px;text-align:center}
#login .hxe{display:inline-flex;align-items:center;gap:12px;font:700 11px/1 Verdana,sans-serif;letter-spacing:5px;color:#ff8da3;text-transform:uppercase;opacity:0;animation:hxu .8s .1s cubic-bezier(.2,.8,.2,1) forwards}
#login .hxe:before,#login .hxe:after{content:"";width:46px;height:1px;background:linear-gradient(90deg,transparent,#ff1f4f)}
#login .hxe:after{transform:scaleX(-1)}
#login .hxh{margin:16px 0 0;font:900 clamp(34px,7.4vw,108px)/.92 "Arial Black",Impact,Verdana,sans-serif;letter-spacing:-.025em;text-transform:uppercase;font-style:italic;color:#fff;text-shadow:0 6px 40px rgba(0,0,0,.7)}
#login .hxh span{display:inline-block;opacity:0;transform:translateY(40px) skewX(-8deg);filter:blur(10px);animation:hxu .9s cubic-bezier(.2,.8,.2,1) forwards}
#login .hxh .w{background:linear-gradient(180deg,#fff 10%,#ff6f8e 60%,#ff1f4f 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 22px rgba(255,31,79,.55));animation-delay:.25s}
#login .hxh .q{color:transparent;-webkit-text-stroke:2px #ff3b66;text-shadow:none;filter:drop-shadow(0 0 16px rgba(255,31,79,.6));animation-delay:.55s}
#login .hxh .o{animation-delay:.1s}
#login .hxh .am{font-size:.5em;vertical-align:.32em;margin:0 .22em;color:#ff1f4f;animation-delay:.4s}
@keyframes hxu{to{opacity:1;transform:none;filter:none}}
#login .hxh .w,#login .hxh .q{will-change:transform}
#login .hxs{max-width:620px;margin:20px auto 0;font:400 clamp(12px,1.3vw,15px)/1.65 Verdana,sans-serif;color:#e9d9de;text-shadow:0 2px 14px #050508;opacity:0;animation:hxu .9s .8s forwards}
#login .hxt{display:flex;flex-wrap:wrap;justify-content:center;gap:0;margin-top:24px;border:1px solid rgba(255,31,79,.3);background:rgba(8,3,11,.62);backdrop-filter:blur(8px);opacity:0;animation:hxu .9s 1s forwards}
#login .hxt div{padding:12px clamp(16px,2.6vw,34px);border-right:1px solid rgba(255,31,79,.22);text-align:left}
#login .hxt div:last-child{border:0}
#login .hxt b{display:block;font:800 clamp(16px,1.9vw,24px)/1 Verdana,sans-serif;color:#fff;letter-spacing:1px;text-shadow:0 0 16px rgba(255,31,79,.5)}
#login .hxt small{display:block;margin-top:6px;font:600 8.5px/1 Verdana,sans-serif;letter-spacing:2.5px;color:#ff8da3;text-transform:uppercase}
#login .hxd{position:absolute;left:0;right:0;bottom:46px;z-index:3;display:flex;flex-direction:column;align-items:center;padding:0 clamp(12px,3vw,40px)}
#login .hxd>p{margin:0 0 10px;font:700 10px/1 Verdana,sans-serif;letter-spacing:5px;color:#ff8da3;text-shadow:0 0 12px #050508;opacity:0;animation:hxu .8s 1.2s forwards}
#login .hxd .lgp{display:flex;flex-wrap:nowrap;justify-content:center;gap:10px;width:auto;max-width:100%;margin:0;padding:12px;border:1px solid rgba(255,31,79,.28);background:rgba(7,3,10,.66);backdrop-filter:blur(14px);box-shadow:0 20px 60px rgba(0,0,0,.6),0 0 50px rgba(255,31,79,.12),inset 0 1px 0 rgba(255,255,255,.07);opacity:0;transform:translateY(24px);animation:hxu .9s 1.3s cubic-bezier(.2,.8,.2,1) forwards}
#login .hxd .lpc{flex:0 0 clamp(96px,10.2vw,132px);padding:12px 6px 11px;background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.01));border:1px solid rgba(255,255,255,.09);overflow:hidden;animation:none;gap:5px}
#login .hxd .lpc:before{content:attr(data-i);position:absolute;top:6px;left:8px;font:700 8px/1 Verdana,sans-serif;letter-spacing:1.5px;color:rgba(255,141,163,.7)}
#login .hxd .lpc:after{content:"";position:absolute;left:0;top:0;height:2px;width:0;background:linear-gradient(90deg,#ff1f4f,#ff8da3);transition:.35s;box-shadow:0 0 14px #ff1f4f}
#login .hxd .lpc:hover:after,#login .hxd .lpc:focus-visible:after{width:100%}
#login .hxd .lpc:hover,#login .hxd .lpc:focus-visible{transform:translateY(-6px);border-color:rgba(255,31,79,.8);background:linear-gradient(180deg,rgba(255,31,79,.22),rgba(255,31,79,.04));box-shadow:0 14px 34px rgba(255,31,79,.32)}
#login .hxd .lpc .av{width:46px!important;height:46px!important;transition:.3s}
#login .hxd .lpc:hover .av{transform:scale(1.1);box-shadow:0 0 22px rgba(255,31,79,.7)}
#login .hxd .lpc b{font-size:10.5px!important;letter-spacing:.4px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
#login .hxd .lpc small{display:block!important;font-size:8px;letter-spacing:1.5px;color:#ff8da3;text-transform:uppercase}
#login .hxb{position:absolute;left:0;right:0;bottom:0;z-index:3;height:36px;overflow:hidden;display:flex;align-items:center;border-top:1px solid rgba(255,31,79,.25);background:rgba(4,1,7,.82);backdrop-filter:blur(8px);-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
#login .hxb div{display:flex;white-space:nowrap;animation:hxs 46s linear infinite;will-change:transform}
#login .hxb span{font:700 10px/1 Verdana,sans-serif;letter-spacing:5px;color:rgba(255,205,215,.75);padding-right:26px}
#login .hxb span i{color:#ff1f4f;font-style:normal;padding-left:26px}
@keyframes hxs{to{transform:translateX(-50%)}}
#login.s2 .hxm,#login.s2 .hxd,#login.s2 .hxe{display:none}
#login.s2 .hxn,#login.s2 .hxb{animation:none}
#login .lgc{position:relative;z-index:4}
#lgmap{transition:transform .25s ease-out;transform:translate3d(calc(var(--mx,0)*-10px),calc(var(--my,0)*-6px),0) scale(1.035)}
@media(max-width:900px){#login .hxk{display:none}#login .hxd .lgp{flex-wrap:wrap;gap:8px;padding:8px}#login .hxd .lpc{flex:0 0 calc(25% - 8px);min-width:0}#login .hxt div{padding:10px 14px}#login .hxm{padding-top:84px}}
@media(max-width:560px){#login .hxr .hxc{display:none}#login .hxd .lpc{flex:0 0 calc(25% - 8px)}#login .hxd .lpc small,#login .hxd .lpc:before{display:none!important}#login .hxs{display:none}#login .hxt{margin-top:16px}#login .hxt div:nth-child(3){display:none}#login .hxh .q{-webkit-text-stroke:1.5px #ff3b66}#login .hxd>p{display:none}}
@media(max-height:640px){#login .hxs,#login .hxt{display:none}}
@media(prefers-reduced-motion:reduce){#login .hxg,#login .hxf,#login .hxb div{animation:none}#login .hxe,#login .hxh span,#login .hxs,#login .hxt,#login .hxd>p,#login .hxd .lgp{animation:none;opacity:1;transform:none;filter:none}#lgmap{transform:none}}
'''
i=s.find('</style>'); assert i>0
s=s[:i]+css+s[i:]

# markup builders + replace selection render
old_start=s.index("l.innerHTML=`<div class=lgs><div class=lgh>")
old_end=s.index("LGMSG=''}",old_start)+len("LGMSG=''}")
new_render='''l.innerHTML=hxChrome()+`<div class=hxm><div class=hxe>Agency Command Station &middot; Est. 2026</div><h1 class=hxh><span class=o>Only</span> <span class=w>Winners</span><span class=am>&amp;</span><span class=q>Quitters</span></h1><p class=hxs>Production, pipeline and payouts in one command center. Built for the ones who show up every single day.</p><div class=hxt><div><b>${'$'+(D.goal||0).toLocaleString()}</b><small>Monthly target</small></div><div><b>${D.agents.length}</b><small>Agents on the roster</small></div><div><b>${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'}).toUpperCase()}</b><small>Today</small></div></div></div><div class=hxd><p>SELECT YOUR PROFILE</p><div class=lgp>${cards}</div></div>`+hxTicker();if(LGMSG){const m=document.createElement('p');m.className='lgmsg';m.setAttribute('role','alert');m.style.cssText='position:absolute;top:70px;left:0;right:0;z-index:5;margin:0 auto;text-shadow:0 0 10px #050508';m.textContent=LGMSG;l.appendChild(m)}hxClock();LGMSG=''}
const HXB=['LAMBORGHINI','FERRARI','PORSCHE','BENTLEY','ROLLS-ROYCE','MASERATI','ASTON MARTIN','McLAREN','BUGATTI','KOENIGSEGG','PAGANI','LOTUS'];
function hxChrome(){return `<div class=hxv></div><div class=hxg></div><div class=hxf></div><header class=hxn><div class=hxl><i>OWQ</i><div>Only Winners &amp; Quitters<small>FINANCIAL FREEDOM</small></div></div><nav class=hxk aria-hidden="true"><span class=a>Command</span><span>Leaderboard</span><span>Pipeline</span><span>Clients</span><span>Team</span></nav><div class=hxr><b>System online</b><span class=hxc id=hxc>--:--:--</span></div></header>`}
function hxTicker(){const r=HXB.map(b=>`<span>${b}<i>&#9670;</i></span>`).join('');return `<footer class=hxb aria-hidden="true"><div>${r}${r}${r}${r}</div></footer>`}
function hxClock(){const e=document.getElementById('hxc');if(!e)return;const f=()=>{const el=document.getElementById('hxc');if(!el){clearInterval(HXT);return}el.textContent=new Date().toLocaleTimeString('en-US',{hour12:false})};clearInterval(HXT);f();HXT=setInterval(f,1000)}
let HXT=0;
document.addEventListener('mousemove',e=>{if(RMQ||!document.getElementById('login')||!/(^| )on( |$)/.test(document.getElementById('login').className))return;const r=document.documentElement.style;r.setProperty('--mx',(e.clientX/innerWidth-.5).toFixed(3));r.setProperty('--my',(e.clientY/innerHeight-.5).toFixed(3))},{passive:true});
const RMQ=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}})();'''
s=s[:old_start]+new_render+s[old_end:]

# numbered cards
s=s.replace('<button class=lpc onclick="pickProfile(this.dataset.n)" data-n="${esc(n)}">','<button class=lpc onclick="pickProfile(this.dataset.n)" data-n="${esc(n)}" data-i="0${i+1}">',1)
s=s.replace("D.agents.map(a=>a.name).concat(['Agency Owner']).map(n=>`<button class=lpc","D.agents.map(a=>a.name).concat(['Agency Owner']).map((n,i)=>`<button class=lpc",1)

# pickProfile keeps chrome
s=s.replace("l.innerHTML=`<div class=lgc><div class=lgav>${av(n,120)}<i></i></div>","l.innerHTML=hxChrome()+`<div class=lgc><div class=lgav>${av(n,120)}<i></i></div>",1)
j=s.index("function pickProfile"); k=s.index("setTimeout(()=>i.focus?.(),60)}",j)
seg=s[j:k]
seg=seg.replace("</small></div>`;","</small></div>`+hxTicker();hxClock();",1)
s=s[:j]+seg+s[k:]

# fireworks keep clear of headline
s=s.replace("Math.abs(sxp-W/2)<240?Math.max(sy0,128):sy0","Math.abs(sxp-W/2)<(W>900?360:240)?Math.max(sy0,W>700?250:128):sy0",1)
open(P,'w').write(s)
print('ok')
