import sys,time,io
from common import *
from PIL import Image,ImageDraw
kind=sys.argv[1];w=int(sys.argv[2]);h=int(sys.argv[3]);tag=sys.argv[4];rail=sys.argv[5] if len(sys.argv)>5 else 'keep'
K=0.12
SLOW="(()=>{const K=%s,pn=performance.now.bind(performance);const t0=pn();let on=0;window.__slow=()=>{on=1;window.__b=pn()};performance.now=()=>on?window.__b+(pn()-window.__b)*K:pn();const st=window.setTimeout;window.setTimeout=(f,d,...a)=>st(f,on&&d>0&&d<5000?d/K:d,...a)})()"%K
with sync_playwright() as p:
    b,pg,errs=open_portal(p,w,h,pre='')
    cdp=pg.context.new_cdp_session(pg)
    pg.evaluate(SLOW)
    pg.evaluate("D.snd=0;POPS=[];document.getElementById('pop').innerHTML=''")
    if rail=='close': pg.evaluate("RAIL=false;railApply&&railApply()")
    pg.wait_for_timeout(700)
    cdp.send('Animation.enable');cdp.send('Animation.setPlaybackRate',{'playbackRate':K})
    box=pg.evaluate("(()=>{const r=document.getElementById('pop').getBoundingClientRect();return [r.left,r.right]})()")
    pg.evaluate("window.__slow();window.__t=performance.now();nfDemo('%s')"%kind)
    frames=[];t0=time.time()
    while time.time()-t0<9:
        v=pg.evaluate("Math.round(performance.now()-window.__t)")
        png=pg.screenshot(type='jpeg',quality=72);frames.append((v,png))
        if v>1250:break
    ims=[(v,Image.open(io.BytesIO(png))) for v,png in frames]
    L=int(max(0,box[0]-300));R=int(min(w,box[1]+40));bx=(L,0,R,min(h,430)) if w>600 else (0,0,w,300)
    want=[0,100,200,350,500,800,1200];pick=[]
    for t in want:
        pick.append(min(ims,key=lambda x:abs(x[0]-t)))
    cw=bx[2]-bx[0];ch=bx[3]-bx[1];cols=4
    sheet=Image.new('RGB',(cw*cols,ch*2))
    for i,(v,im) in enumerate(pick):
        c=im.crop(bx);ImageDraw.Draw(c).text((6,6),'%dms'%v,fill=(255,255,0));sheet.paste(c,((i%cols)*cw,(i//cols)*ch))
    sheet.save('../shots/arr_%s_%s.png'%(kind,tag));print(len(frames),[v for v,_ in frames],errs)
    b.close()
