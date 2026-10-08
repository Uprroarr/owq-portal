#!/usr/bin/env python3
# mksheet.py out.png title prefix [frames...]: 3x2 contact sheet of 1280x720 frames (scaled to 640x360) with captions
import sys
from PIL import Image,ImageDraw
out,title,pre=sys.argv[1:4];fr=sys.argv[4:] or ['1p6','2p7','3p6','4p4','5p3','land']
lab={'1p6':'pin (1.6 s)','2p7':'dive 2.7 s','3p6':'dive 3.6 s','4p4':'entry 4.4 s','5p3':'entry 5.3 s','land':'landed'}
tw,th=640,360;S=Image.new('RGB',(tw*3+40,th*2+90),(11,11,16));d=ImageDraw.Draw(S)
d.text((12,10),title,fill=(255,207,64))
for i,f in enumerate(fr):
    im=Image.open('%s_%s.png'%(pre,f)).convert('RGB').resize((tw,th),Image.LANCZOS)
    x=10+(i%3)*(tw+10);y=40+(i//3)*(th+24);S.paste(im,(x,y));d.text((x+4,y+th+5),lab.get(f,f),fill=(220,220,230))
S.save(out);print(out)
