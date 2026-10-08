import re,base64
p='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(p,encoding='utf-8').read()
# remove prior
s=re.sub(r'/\*VXcss\*/.*?/\*VXcssend\*/','',s,flags=re.S)
s=re.sub(r'<div id=vx aria-hidden="true">.*?</div></div><script>window\.VXD=.*?</script>','',s,flags=re.S)
s=re.sub(r'/\*VXstart\*/.*?/\*VXend\*/\n?','',s,flags=re.S)
css='''/*VXcss*/#vx{position:fixed;inset:0;z-index:299;display:none;overflow:hidden;background:#050206;pointer-events:none}#vx.on{display:block}#vx.fx{z-index:505}
#vx .vxw{position:absolute;inset:0;transform:scale(1.06);will-change:transform,filter}
#vx .vxv{position:absolute;left:50%;top:50%;min-width:100%;min-height:100%;width:auto;height:auto;transform:translate(-50%,-50%);object-fit:cover;filter:contrast(1.1) saturate(1.18) brightness(1)}
#vx .vxv{width:100%;height:100%;transform:none;left:0;top:0}
#vx .vxg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 38%,rgba(5,1,10,.78) 100%),linear-gradient(180deg,rgba(40,0,20,.35),rgba(0,0,0,0) 30%,rgba(0,0,0,0) 60%,rgba(0,0,0,.6));mix-blend-mode:normal}
#vx .vxg:after{content:"";position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,31,79,.16),rgba(70,20,160,.14));mix-blend-mode:color}
#vx .vxn{position:absolute;inset:-50%;opacity:.13;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");animation:vxn .5s steps(4) infinite}
@keyframes vxn{0%{transform:translate(0,0)}25%{transform:translate(-3%,2%)}50%{transform:translate(2%,-3%)}75%{transform:translate(-2%,-1%)}100%{transform:translate(0,0)}}
#vx .vxk{position:absolute;inset:0;opacity:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,0) 0 6px,rgba(255,80,110,.10) 6px 8px,rgba(255,255,255,0) 8px 22px);mix-blend-mode:screen}
#vx .vxf{position:absolute;inset:0;opacity:0;background:#fff}
#vx.pick .vxw{animation:vxpk 1.05s ease-in-out}@keyframes vxpk{0%{transform:scale(1.06)}45%{transform:scale(1.14);filter:brightness(1.3) saturate(1.3)}100%{transform:scale(1.06)}}
#vx.revv .vxw{animation:vxrv 1.5s ease-in-out}@keyframes vxrv{0%{transform:scale(1.06)}40%{transform:scale(1.2);filter:brightness(1.25) blur(1.5px)}100%{transform:scale(1.08)}}
#vx:before{content:"";position:absolute;left:0;right:0;top:0;height:7vh;background:#000;z-index:3;opacity:.0}
/*VXcssend*/
'''
s=s.replace('#lgmap{position:fixed;',css+'#lgmap{position:fixed;',1)
data={}
for n in ['loop','r1','r2','r3','sun']:
    data[n]=base64.b64encode(open(f'v2/out/{n}.mp4','rb').read()).decode();data[n+'_w']=base64.b64encode(open(f'v2/out/{n}.webm','rb').read()).decode()
mk='<div id=vx aria-hidden="true"><div class=vxw></div><div class=vxg></div><div class=vxn></div><div class=vxk></div><div class=vxf></div></div><script>window.VXD='+__import__('json').dumps(data)+'</script>'
s=s.replace('<canvas id=l3 aria-hidden="true"></canvas>','<canvas id=l3 aria-hidden="true"></canvas>'+mk,1)
js=open('vx.js',encoding='utf-8').read()
s=s.replace('const views={',js+'\nconst views={',1)
open(p,'w',encoding='utf-8').write(s)
print(len(s),s.count('id=vx '),s.count('VXstart'))
