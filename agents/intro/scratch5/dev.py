#!/usr/bin/env python3
# dev.py out_prefix city1,city2,... [W H] : engine-only landing frames (dev harness), UI rectangles overlaid, + sheet
import sys,subprocess,json,os
from PIL import Image,ImageDraw
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';D=SP+'/agents/intro'
C={'nyc':(40.71,-74.01),'dubai':(25.2,55.27),'tokyo':(35.68,139.69),'chicago':(41.88,-87.63),'london':(51.51,-0.13),'sydney':(-33.87,151.21),'warsaw':(52.23,21.01),'saopaulo':(-23.55,-46.63),
   'paris':(48.86,2.35),'hk':(22.32,114.17),'honolulu':(21.31,-157.86),'shanghai':(31.23,121.47),'mexico':(19.43,-99.13),'dhaka':(23.81,90.41),'lagos':(6.52,3.38),'anchorage':(61.22,-149.9)}
pre=sys.argv[1];cs=sys.argv[2].split(',');W=int(sys.argv[3]) if len(sys.argv)>3 else 1366;H=int(sys.argv[4]) if len(sys.argv)>4 else 860
extra=os.environ.get('EXTRA','')
por=W<H
if not por:
    cardL=W-min(110,max(18,W*.06))-min(392,W-36);h2=min(118,max(44,W*.074));tTop=H/2-.52*(h2+100)
    sx=max(-.5,min(.5,2*max(W*.3,cardL*.5)/W-1));sy=1-2*max(H*.3,tTop-H*.03)/H
    js='GX.S.landSX=%f;GX.S.landSY=%f'%(sx,sy)
else:js='GX.S.landSX=0;GX.S.landSY=null'
cmd=['python3',D+'/tools/cap.py','--size','%dx%d'%(W,H),'js:'+js]
if extra:cmd.append('js:'+extra)
for c in cs:
    la,lo=C[c];cmd+=['scn:land,%s,%s'%(la,lo),'go:0.4','shot:%s_%s.png'%(pre,c),'js:[GX.alt().toFixed(3),GX.S.bN,GX.S.bNC,Math.round(GX.S.bMs),JSON.stringify(GX.dir.info().aim.map(v=>+v.toFixed(2))),GX.dir.info().RB.toFixed(1),(GX.dir.info().yaw*57.3).toFixed(0),GX.C.fov]']
r=subprocess.run(cmd,capture_output=True,text=True,timeout=900);print(r.stdout[-3000:],r.stderr[-2000:])
ims=[]
for c in cs:
    f='%s_%s.png'%(pre,c)
    if not os.path.exists(f):continue
    im=Image.open(f).convert('RGB');d=ImageDraw.Draw(im)
    if not por:
        d.rectangle([cardL,H/2-220,W-min(110,max(18,W*.06)),H/2+220],outline=(255,40,90),width=2)
        d.rectangle([max(22,min(84,W*.05)),tTop,max(22,min(84,W*.05))+W*.42,tTop+h2+100],outline=(80,200,255),width=1)
    else:
        d.rectangle([20,88,W-20,88+175],outline=(80,200,255),width=1);d.rectangle([14,H-56-330,W-14,H-56],outline=(255,40,90),width=2)
    d.text((8,H-16),c,fill=(255,255,0));ims.append(im)
if ims:
    n=len(ims);cols=2 if not por else 4;rows=(n+cols-1)//cols;tw,th=(W//2,H//2) if not por else (W,H)
    S=Image.new('RGB',(cols*tw,rows*th))
    for i,im in enumerate(ims):S.paste(im.resize((tw,th),Image.LANCZOS),((i%cols)*tw,(i//cols)*th))
    S.save(pre+'_sheet.png');print('sheet',pre+'_sheet.png')
