from common import *
with sync_playwright() as p:
    b,pg,errs=open_portal(p,1440,900)
    pg.evaluate("(()=>{D.snd=0;POPS=[];document.getElementById('pop').innerHTML='';window.LOG=[];const ob=NFP.burst;NFP.burst=function(x,y,S){LOG.push(['burst',Math.round(x),Math.round(y),Math.round(performance.now())]);ob(x,y,S)};const ol=nfLaunch;nfLaunch=function(el,k){const r=el.getBoundingClientRect();LOG.push(['launch',k,Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(performance.now())]);ol(el,k)}})()")
    pg.evaluate("nfDemo('ok')");pg.wait_for_timeout(1500)
    print(pg.evaluate("LOG"), pg.evaluate("[...document.querySelectorAll('#pop .pp')].map(e=>{const r=e.getBoundingClientRect();return [e.className,Math.round(r.left),Math.round(r.top)]})"), errs)
    b.close()
