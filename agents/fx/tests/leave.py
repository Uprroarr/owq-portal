import sys,time,io
from common import *
from PIL import Image,ImageDraw
mode=sys.argv[1];w=int(sys.argv[2]);h=int(sys.argv[3]);K=0.12
SLOW="(()=>{const K=%s,pn=performance.now.bind(performance);let on=0;window.__slow=()=>{on=1;window.__b=pn()};performance.now=()=>on?window.__b+(pn()-window.__b)*K:pn();const st=window.setTimeout;window.setTimeout=(f,d,...a)=>st(f,on&&d>0&&d<5000?d/K:d,...a)})()"%K
with sync_playwright() as p:
    b,pg,errs=open_portal(p,w,h)
    cdp=pg.context.new_cdp_session(pg)
    pg.evaluate(SLOW)
    pg.evaluate("(()=>{D.snd=0;POPS=[];document.getElementById('pop').innerHTML='';nfDemo('info')})()")
    pg.wait_for_timeout(1800)
    box=pg.evaluate("(()=>{const r=document.getElementById('pop').getBoundingClientRect();return [r.left,r.right]})()")
    cdp.send('Animation.enable');cdp.send('Animation.setPlaybackRate',{'playbackRate':K})
    if mode=='click': pg.evaluate("(()=>{window.__slow();window.__t=performance.now();const e=document.querySelector('#pop .pp');e.dispatchEvent(new MouseEvent('click',{bubbles:true}))})()")
    else: pg.evaluate("(()=>{window.__slow();window.__t=performance.now();POPS=[];popRender()})()")
    frames=[];t0=time.time()
    while time.time()-t0<9:
        v=pg.evaluate("Math.round(performance.now()-window.__t)")
        frames.append((v,pg.screenshot(type='jpeg',quality=72)))
        if v>(900 if mode=='click' else 600):break
    ims=[(v,Image.open(io.BytesIO(x))) for v,x in frames]
    L=int(max(0,box[0]-100));R=int(min(w,box[1]+60));bx=(L,0,R,min(h,300))
    want=[0,80,160,260,380,500,650,850] if mode=='click' else [0,50,100,160,220,300,400,550]
    cw=bx[2]-bx[0];ch=bx[3]-bx[1];sheet=Image.new('RGB',(cw*4,ch*2))
    for i,t in enumerate(want):
        v,im=min(ims,key=lambda x:abs(x[0]-t));c=im.crop(bx);ImageDraw.Draw(c).text((6,6),'%dms'%v,fill=(255,255,0));sheet.paste(c,((i%4)*cw,(i//4)*ch))
    sheet.save('../shots/leave_%s_%d.png'%(mode,w));print(errs)
    b.close()
