import sys
from common import *
R=[]
def chk(n,c,extra=''):
    R.append((n,bool(c)));print(('PASS ' if c else 'FAIL ')+n,extra)
STATE="(()=>{const c=document.getElementById('nfc');let n=0;if(c){const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=3;i<d.length;i+=4)if(d[i]>0){n++}}return {px:n,raf:NF.raf,fl:NF.fl.length,lv:NF.lv.length,q:NF.q.length,act:NF.act,g:NF.g?NF.g.children.length:0,part:NFP.count()}})()"
with sync_playwright() as p:
    b,pg,errs=open_portal(p,1440,900)
    pg.evaluate("(()=>{D.snd=0;POPS=[];document.getElementById('pop').innerHTML=''})()")
    for k in ['ok','warn','info']:
        pg.evaluate("nfDemo('%s')"%k);pg.wait_for_timeout(1300)
        t=pg.evaluate("(()=>{const e=document.querySelector('#pop .pp');return [e.innerText,e.className,e.getBoundingClientRect().width,getComputedStyle(e).opacity]})()")
        chk('card visible '+k,t[0].strip() and 'nf-wait' not in t[1] and float(t[3])==1,t[1])
        chk('pop aria '+k,pg.evaluate("(()=>{const e=document.getElementById('pop');return e.getAttribute('role')==='status'&&e.getAttribute('aria-live')==='polite'})()"))
        pg.wait_for_timeout(6200)  # auto leave
        pg.wait_for_timeout(1500)
        s=pg.evaluate(STATE);chk('idle after leave '+k,s['px']==0 and s['raf']==0 and s['fl']==0 and s['lv']==0 and s['g']==0 and s['part']==0,str(s))
        chk('pop empty '+k,pg.evaluate("document.querySelectorAll('#pop .pp').length")==0)
    # click navigates
    pg.evaluate("openTab('Command Deck')");pg.wait_for_timeout(300)
    pg.evaluate("nfDemo('info')");pg.wait_for_timeout(1100)
    pg.click('#pop .pp');pg.wait_for_timeout(300)
    chk('click navigates to Clients',pg.evaluate("tab")=='Clients',pg.evaluate("tab"))
    chk('clicked card is ghost and unread cleared',pg.evaluate("document.querySelectorAll('#pop .pp').length")==0 and pg.evaluate("document.querySelectorAll('#nfg .pp').length")==1)
    pg.wait_for_timeout(1500);chk('ghost removed',pg.evaluate("document.querySelectorAll('#nfg .pp').length")==0)
    # stress 10 alerts in 2s
    pg.evaluate("(()=>{window.MX=[0,0];window.__i=setInterval(()=>{MX[0]=Math.max(MX[0],NF.fl.length);MX[1]=Math.max(MX[1],NF.q.length)},30);let i=0;const t=setInterval(()=>{nfDemo(['ok','warn','info','crit'][i%4]);if(++i>=10)clearInterval(t)},200)})()")
    pg.wait_for_timeout(2600);m=pg.evaluate("MX");chk('max concurrent flyers<=3, queue<=6',m[0]<=3 and m[1]<=6,str(m))
    pg.wait_for_timeout(9000);s=pg.evaluate(STATE);chk('idle after stress',s['px']==0 and s['raf']==0 and s['g']==0 and s['q']==0,str(s))
    # soak
    n0=pg.evaluate("(document.getElementsByTagName('*').length-document.querySelectorAll('#rail *').length)")
    pg.evaluate("(()=>{let i=0;const t=setInterval(()=>{nfDemo(['ok','warn','info'][i%3]);if(++i>=200)clearInterval(t)},60)})()")
    pg.wait_for_timeout(15000);pg.wait_for_timeout(9000)
    n1=pg.evaluate("(document.getElementsByTagName('*').length-document.querySelectorAll('#rail *').length)")
    s=pg.evaluate(STATE)
    print('nodes',n0,n1,'timers',pg.evaluate("NF.tm.length"))
    chk('soak 200 alerts: DOM nodes stable',abs(n1-n0)<=6 and s['g']==0 and s['raf']==0 and s['px']==0,str(s))
    chk('soak: timer list drained',pg.evaluate("NF.tm.length")==0)
    chk('no page/console errors',[e for e in errs if 'ERR_TUNNEL' not in e]==[],str([e for e in errs if 'ERR_TUNNEL' not in e]))
    b.close()
    # reduced motion
    b,pg,errs=open_portal(p,1440,900,pre="localStorage.owq_motion='reduce'")
    pg.evaluate("(()=>{D.snd=0;POPS=[];document.getElementById('pop').innerHTML=''})()")
    pg.evaluate("nfDemo('warn')");pg.wait_for_timeout(120);s=pg.evaluate(STATE)
    chk('reduced motion: no flyers/particles/canvas',s['fl']==0 and s['part']==0 and s['raf']==0,str(s))
    pg.wait_for_timeout(300);chk('reduced motion: card visible',pg.evaluate("getComputedStyle(document.querySelector('#pop .pp')).opacity")=='1')
    pg.evaluate("POPS=[];popRender()");pg.wait_for_timeout(500);chk('reduced motion: leaves cleanly',pg.evaluate("document.querySelectorAll('.pp').length")==0)
    b.close()
    # kill switch
    b,pg,errs=open_portal(p,1440,900,pre="localStorage.owq_nf_off='1'")
    pg.evaluate("(()=>{D.snd=0;POPS=[];document.getElementById('pop').innerHTML=''})()")
    pg.evaluate("nfDemo('ok')");pg.wait_for_timeout(100)
    cn=pg.evaluate("document.querySelector('#pop .pp').className")
    chk('kill switch: original pop-up class and no nf nodes',cn.strip()=='pp new' and pg.evaluate("!document.getElementById('nfc')"),cn)
    b.close()
print('RESULT',sum(1 for _,c in R if c),'/',len(R))
