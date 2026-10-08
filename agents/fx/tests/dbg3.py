from common import *
with sync_playwright() as p:
    b,pg,errs=open_portal(p,1440,900)
    pg.evaluate("(()=>{D.snd=0;POPS=[];document.getElementById('pop').innerHTML=''})()")
    pg.evaluate("(()=>{window.TR=[];const oa=NFP.add;NFP.add=function(o){if(o.x<800&&o.k===0&&TR.length<3)TR.push([Math.round(o.x),Math.round(o.y),Math.round(o.vx),Math.round(o.vy),new Error().stack.split('\\n').slice(2,4).join('|')]);return oa(o)};pushAlert({sev:'ok',t:'Policy issued',m:'x'})})()")
    for i in range(6):
        pg.wait_for_timeout(100)
        print(pg.evaluate("(()=>{const c=document.getElementById('nfc');if(!c)return 'nocanvas';const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0,xs=0;for(let i=3;i<d.length;i+=4)if(d[i]>20){n++;xs+=((i>>2)%c.width)}return [n,n?Math.round(xs/n):0, NFP.count()]})()"))
    print(pg.evaluate('TR'))
    b.close()
