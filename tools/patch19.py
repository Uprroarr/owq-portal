P='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(P).read()
css=r'''
/* ===== LIVE PULSE ===== */
.pls{margin-top:14px;position:relative;overflow:hidden}
.pls:before{content:"";position:absolute;left:0;top:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#ff1f4f,transparent);animation:plsw 4s linear infinite}
@keyframes plsw{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.pls .ph{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.pls .ph h4{margin:0}
.pls .live{display:inline-flex;align-items:center;gap:7px;font:700 10px/1 Verdana,sans-serif;letter-spacing:2.5px;color:#9dffc6}
.pls .live:before{content:"";width:7px;height:7px;border-radius:50%;background:#2bff88;box-shadow:0 0 10px #2bff88;animation:hxp 1.4s ease-in-out infinite}
.pls .dayb{position:relative;height:18px;margin:12px 0 4px;border:1px solid rgba(255,31,79,.55);background:rgba(10,2,6,.75);overflow:hidden}
.pls .dayb i{position:absolute;left:0;top:0;bottom:0;width:0;background:linear-gradient(90deg,#5a0719,#ff1f4f 72%,#ff9ab0);box-shadow:0 0 18px #ff1f4f;transition:width 1.8s cubic-bezier(.2,.8,.2,1)}
.pls .dayb i:after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);animation:shn 1.6s linear infinite}
.pls .dayb:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 calc(8.333% - 1px),rgba(0,0,0,.55) calc(8.333% - 1px) 8.333%)}
.pls .dayl{display:flex;justify-content:space-between;font:600 9px/1 Verdana,sans-serif;letter-spacing:2px;color:var(--mut);margin-bottom:14px}
.pls .dayl b{color:#ff8da3}
.pls .mt{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.pls .mtr{position:relative;padding:12px 12px 11px;border:1px solid rgba(255,31,79,.28);background:linear-gradient(180deg,rgba(255,31,79,.07),rgba(8,3,11,.4))}
.pls .mtr small{display:block;font:700 9px/1 Verdana,sans-serif;letter-spacing:2.2px;color:#ff8da3;text-transform:uppercase}
.pls .mtr b{display:block;margin:8px 0 9px;font:800 clamp(20px,2.4vw,28px)/1 Verdana,sans-serif;color:#fff;text-shadow:0 0 16px rgba(255,31,79,.5);font-variant-numeric:tabular-nums}
.pls .mtr b em{font-style:normal;font-size:.5em;color:var(--mut);font-weight:600;margin-left:6px;letter-spacing:1px}
.pls .bar{position:relative;height:9px;background:rgba(255,255,255,.07);overflow:hidden}
.pls .bar i{position:absolute;left:0;top:0;bottom:0;width:0;background:linear-gradient(90deg,#7d0b27,#ff1f4f 70%,#ff8aa3);box-shadow:0 0 12px #ff1f4f;transition:width 1.4s cubic-bezier(.2,.8,.2,1)}
.pls .bar i.full{background:linear-gradient(90deg,#0f7a4c,#3ddc97);box-shadow:0 0 12px #3ddc97}
.pls .bar:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 9px,rgba(0,0,0,.55) 9px 10px)}
.pls .mtr.bump{animation:bmp 1.1s ease-out}
@keyframes bmp{0%{box-shadow:0 0 0 0 rgba(255,31,79,.9),inset 0 0 30px rgba(255,31,79,.5)}100%{box-shadow:0 0 0 22px rgba(255,31,79,0),inset 0 0 0 rgba(255,31,79,0)}}
.pls .pg{display:grid;grid-template-columns:1.1fr 1fr;gap:14px;margin-top:14px}
.pls .pgh{font:700 9px/1 Verdana,sans-serif;letter-spacing:2.4px;color:var(--mut);text-transform:uppercase;margin-bottom:10px}
.pls .par{display:grid;grid-template-columns:minmax(0,120px) 1fr 74px;align-items:center;gap:10px;padding:5px 0;font-size:11px}
.pls .par b{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:7px}
.pls .par b:before{content:"";flex:none;width:7px;height:7px;border-radius:50%;background:#3a2a31}
.pls .par.on b:before{background:#2bff88;box-shadow:0 0 9px #2bff88;animation:hxp 1.4s ease-in-out infinite}
.pls .par span{text-align:right;font-variant-numeric:tabular-nums;color:#e8d3d9}
.pls .par.off span{color:var(--mut)}
.pls .cols{display:flex;align-items:flex-end;gap:5px;height:118px;padding-top:6px;border-bottom:1px solid rgba(255,31,79,.35)}
.pls .pcl{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;min-width:0}
.pls .pcl i{display:block;width:100%;height:0;min-height:2px;background:linear-gradient(0deg,#5a0719,#c0153a);transition:height 1.3s cubic-bezier(.2,.8,.2,1)}
.pls .pcl.t i{background:linear-gradient(0deg,#ff1f4f,#ff9ab0);box-shadow:0 0 18px #ff1f4f}
.pls .cll{display:flex;gap:5px;margin-top:5px}
.pls .cll em{flex:1;text-align:center;font:600 8.5px/1 Verdana,sans-serif;color:var(--mut);font-style:normal}
.pls .cll em.t{color:#ff8da3}
.pls .pace{position:relative;margin-top:16px}
.pls .pace .bar{height:12px}
.pls .pace .mk{position:absolute;top:-5px;bottom:-5px;width:2px;background:#fff;box-shadow:0 0 10px #fff;transition:left 1.4s cubic-bezier(.2,.8,.2,1)}
.pls .pace .mk:after{content:"PACE";position:absolute;top:-13px;left:50%;transform:translateX(-50%);font:700 8px/1 Verdana,sans-serif;letter-spacing:1.5px;color:#fff}
.pls .pace p{margin:10px 0 0;font-size:11px;color:#e8d3d9;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
.pls .pace p b.pos{color:#3ddc97}.pls .pace p b.neg{color:#ff6f8e}
.pls .tg{margin:12px 0 0;font:500 9.5px/1.5 Verdana,sans-serif;color:var(--mut);letter-spacing:.4px}
@media(max-width:900px){.pls .mt{grid-template-columns:repeat(2,minmax(0,1fr))}.pls .pg{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.pls:before,.pls .dayb i:after,.pls .live:before,.pls .par.on b:before{animation:none}.pls .bar i,.pls .dayb i,.pls .pcl i,.pls .pace .mk{transition:none}}
'''
i=s.rindex('</style>'); s=s[:i]+css+s[i:]

js=r'''
const PVW={},PVV={};
function pulseData(){const nw=new Date(),d0=new Date(nw.getFullYear(),nw.getMonth(),nw.getDate()).getTime(),tk=dkey(nw),L=D.policies.filter(p=>p.st==='Issued'||p.st==='Paid'),tp=L.filter(p=>p.d===tk),ta=D.activity.filter(a=>a.d===tk),sh=D.shifts||[],goal=D.goal||60000,dAP=Math.max(1,Math.round(goal/22)),
hf=nw.getHours()+nw.getMinutes()/60+nw.getSeconds()/3600,fr=Math.max(0,Math.min(1,(hf-8)/12)),
dim=new Date(nw.getFullYear(),nw.getMonth()+1,0).getDate(),mk=nw.getFullYear()+'-'+pad(nw.getMonth()+1),m=sum(L.filter(x=>x.d.slice(0,7)===mk),x=>x.ap),pace=goal*nw.getDate()/dim;
const ag=D.agents.map(a=>{const mine=sh.filter(x=>x.ag===a.name),h=sum(mine.filter(x=>x.start>=d0),x=>((x.end||Date.now())-x.start)/36e5);return{nm:a.name,h,on:mine.some(x=>!x.end),pct:Math.min(100,h/8*100)}}).sort((x,y)=>y.h-x.h);
const cols=[...Array(14)].map((_,i)=>{const d=new Date(d0);d.setDate(d.getDate()-(13-i));const k=dkey(d);return{v:sum(L.filter(x=>x.d===k),x=>x.ap),l:'SMTWTFS'[d.getDay()],t:i===13}});
return{fr,ap:sum(tp,x=>x.ap),dAP,pol:tp.length,con:sum(ta,x=>x.con||0),app:sum(ta,x=>x.app||0),hrs:sum(ag,x=>x.h),ag,cols,m,goal,pace,dim}}
function pulseHtml(){const P=pulseData(),w=k=>PVW[k]==null?0:PVW[k],hd=h=>{const t=Math.floor(h*3600);return Math.floor(t/3600)+'h '+pad(Math.floor(t%3600/60))+'m'};
const met=(k,lab,tgt)=>`<div class=mtr data-m=${k}><small>${lab}</small><b data-c=${k}>0<em>/ ${tgt}</em></b><div class=bar><i data-k=${k} style="width:${w(k)}%"></i></div></div>`;
return`<div class="c pls" id=pls><div class=ph><h4>Live Pulse: Today</h4><span class=live>LIVE &middot; UPDATES AS YOU LOG</span></div>
<div class=dayb><i data-k=day style="width:${w('day')}%"></i></div><div class=dayl><span>8 AM</span><b data-t=day>-</b><span>8 PM</span></div>
<div class=mt>${met('ap','Premium issued today','$'+P.dAP.toLocaleString())}${met('pol','Policies today','3')}${met('con','Contacts today','40')}${met('app','Appointments today','5')}</div>
<div class=pg><div><div class=pgh>On the clock today &middot; <span data-t=hrs>0h 00m</span> total</div>${P.ag.map((a,i)=>`<div class="par ${a.on?'on':'off'}" data-a=${i}><b>${esc(a.nm)}</b><div class=bar><i data-k=ag${i} style="width:${w('ag'+i)}%"></i></div><span data-t=ag${i}>${hd(a.h)}</span></div>`).join('')||'<p class=mut>Add agents to track hours.</p>'}</div>
<div><div class=pgh>Premium issued, last 14 days</div><div class=cols>${P.cols.map((c,i)=>`<div class="pcl ${c.t?'t':''}" data-i=${i} title="${$(c.v)}"><i style="height:${w('col'+i)}%"></i></div>`).join('')}</div><div class=cll>${P.cols.map(c=>`<em class="${c.t?'t':''}">${c.l}</em>`).join('')}</div></div></div>
<div class=pace><div class=bar><i data-k=month style="width:${w('month')}%"></i></div><span class=mk data-k=pace style="left:${w('pace')}%"></span><p><span data-t=mo>-</span><b data-t=pc>-</b></p></div>
<p class=tg>Daily pace targets: premium goal / 22 working days, 3 policies, 40 contacts, 5 appointments, 8 hours on the clock.</p></div>`}
function pulseApply(P){try{const el=document.getElementById('pls');if(!el||!el.querySelector)return;
const W=(k,pct,bump)=>{const e=el.querySelector('[data-k="'+k+'"]');if(!e)return;pct=Math.max(0,Math.min(100,pct));const old=PVW[k];if(old==null||Math.abs(old-pct)>.05){if(e.classList.contains('mk'))e.style.left=pct+'%';else e.style.width=pct+'%'}if(bump&&old!=null&&pct>old+.1){const bx=e.closest('.mtr');if(bx){bx.classList.remove('bump');void bx.offsetWidth;bx.classList.add('bump')}}if(e.tagName==='I')e.classList.toggle('full',pct>=100);PVW[k]=pct},
T=(k,t)=>{const e=el.querySelector('[data-t="'+k+'"]');if(e&&e.textContent!==t)e.textContent=t},
C=(k,v,fmt,tgt)=>{const e=el.querySelector('[data-c="'+k+'"]');if(!e)return;const from=PVV[k]==null?0:PVV[k];if(from!==v&&!e._a){e._a=1;const t0=performance.now(),dur=900;const f=n=>{const q=Math.min(1,(performance.now()-t0)/dur),ee=1-Math.pow(1-q,3),cur=from+(v-from)*ee;e.firstChild.nodeValue=fmt(Math.round(cur));if(q<1)requestAnimationFrame(f);else{e._a=0;PVV[k]=v;e.firstChild.nodeValue=fmt(v)}};f()}else if(!e._a){e.firstChild.nodeValue=fmt(v);PVV[k]=v}};
const hd=h=>{const t=Math.floor(h*3600);return Math.floor(t/3600)+'h '+pad(Math.floor(t%3600/60))+'m'};
W('day',P.fr*100);T('day',Math.round(P.fr*100)+'% of the work day');
W('ap',P.ap/P.dAP*100,1);C('ap',P.ap,n=>$(n));W('pol',P.pol/3*100,1);C('pol',P.pol,n=>String(n));W('con',P.con/40*100,1);C('con',P.con,n=>String(n));W('app',P.app/5*100,1);C('app',P.app,n=>String(n));
T('hrs',hd(P.hrs));P.ag.forEach((a,i)=>{W('ag'+i,a.pct);T('ag'+i,hd(a.h));const r=el.querySelector('[data-a="'+i+'"]');if(r){r.classList.toggle('on',a.on);r.classList.toggle('off',!a.on)}});
const mx=Math.max(1,...P.cols.map(c=>c.v));P.cols.forEach((c,i)=>{const e=el.querySelector('[data-i="'+i+'"] i');if(!e)return;const pct=c.v?Math.max(6,c.v/mx*100):2,old=PVW['col'+i];if(old==null||Math.abs(old-pct)>.05){e.style.height=pct+'%';PVW['col'+i]=pct}e.parentNode.title=$(c.v)});
W('month',P.m/P.goal*100);W('pace',P.pace/P.goal*100);T('mo',$(P.m)+' issued of '+$(P.goal)+' goal');const d=P.m-P.pace;const pc=el.querySelector('[data-t="pc"]');if(pc){pc.textContent=(d>=0?'AHEAD OF PACE BY ':'BEHIND PACE BY ')+$(Math.abs(d));pc.className=d>=0?'pos':'neg'}
}catch(e){}}
setInterval(()=>{try{if(document.getElementById('pls'))pulseApply(pulseData())}catch(e){}},500);
'''
a=s.index("function ov(){")
s=s[:a]+js+s[a:]
mark='<div class=g2 style="margin-top:14px"><div class=c><h4>Command Briefing</h4>'
assert mark in s
s=s.replace(mark,'${pulseHtml()}'+mark,1)
open(P,'w').write(s); print('ok')
