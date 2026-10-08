p='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(p,encoding='utf-8').read()
if '/* ===== Learning nag' not in s:
    code=r'''
/* ===== Learning nag: on the clock 30+ min with an unfinished Learning Network -> send them to it ===== */
const LNAG={snz:0,ms:1800000};
function lnNagShow(done,total){if(document.getElementById('lnn')||document.getElementById('ckn'))return;ckNagCss();
 if(!document.getElementById('lnnS')){const st=document.createElement('style');st.id='lnnS';st.textContent=document.getElementById('cknS').textContent.replace(/#ckn/g,'#lnn').replace(/cknIn/g,'lnnIn').replace(/cknP/g,'lnnP')+'#lnn .lp{width:min(420px,80vw);height:12px;margin:0 auto 26px;border:1px solid rgba(255,31,79,.7);background:rgba(10,2,6,.8)}#lnn .lp i{display:block;height:100%;background:linear-gradient(90deg,#7d0b27,#ff1f4f,#ff8aa3);box-shadow:0 0 16px #ff1f4f}#lnn .lc{display:block;margin:-14px 0 24px;font:700 12px Verdana,sans-serif;letter-spacing:.2em;color:#fff}';document.head.appendChild(st)}
 const d=document.createElement('div');d.id='lnn';d.setAttribute('role','alertdialog');d.setAttribute('aria-label','Finish your training');const pc=Math.round(done/Math.max(1,total)*100);
 d.innerHTML='<div class=cb><div class=ci>&#9873;</div><h1>FINISH YOUR TRAINING</h1><p>You have been on the clock for over 30 minutes and your Learning Network is not complete yet.<br>Knock out the rest now. Every module makes you sharper on the phones.</p><div class=lp><i style="width:'+pc+'%"></i></div><span class=lc>'+done+' OF '+total+' MODULES COMPLETE</span><button id=lnnGo>GO TO LEARNING NETWORK</button><button class=cs id=lnnLater>Remind me in 15 minutes</button></div>';
 document.body.appendChild(d);
 document.getElementById('lnnGo').onclick=()=>{d.remove();LNAG.snz=Date.now()+900000;try{openTab('Learning Network')}catch(e){try{tab='Learning Network';go()}catch(x){}}};
 document.getElementById('lnnLater').onclick=()=>{LNAG.snz=Date.now()+900000;d.remove()}}
function lnNagCheck(){try{if(!ONLINE||!WHO||!D.agents.some(a=>a.name===WHO))return;
 const sh=typeof openShift==='function'?openShift(WHO):null;if(!sh||Date.now()-sh.start<LNAG.ms)return;
 const S=lnStates(WHO);if(!S.length||S.every(x=>x.done)){const e=document.getElementById('lnn');if(e)e.remove();return}
 if(tab==='Learning Network'||Date.now()<LNAG.snz)return;
 lnNagShow(S.filter(x=>x.done).length,S.length)}catch(e){}}
setInterval(lnNagCheck,15000);
'''
    a='setInterval(ckNagCheck,15000);'
    assert a in s
    s=s.replace(a,a+code,1)
open(p,'w',encoding='utf-8').write(s)
print(s.count('function lnNagCheck'))
