p='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(p,encoding='utf-8').read()
js=open('l3/l3.js',encoding='utf-8').read()
# remove prior install if re-running
import re
if 'id=l3 ' in s or '<canvas id=l3' in s:
    s=re.sub(r'/\* ===== L3: raw-WebGL.*?\nfxFly=function\(kind\)\{[^\n]*\n','',s,flags=re.S)
    s=s.replace('<canvas id=l3 aria-hidden="true"></canvas>','')
    s=re.sub(r'/\*L3css\*/.*?/\*L3end\*/','',s,flags=re.S)
css='''/*L3css*/#l3{position:fixed;inset:0;width:100%;height:100%;z-index:299;display:none;transition:opacity .5s ease;background:#07020c}#l3.on{display:block}#l3.fx{z-index:505}
#l3hud{position:fixed;left:0;right:0;top:0;bottom:0;z-index:520;pointer-events:none;opacity:0;visibility:hidden;text-align:center;font-family:Verdana,sans-serif;color:#fff}
#l3hud .l3t{position:absolute;left:0;right:0;top:20vh;transform:translateY(-50%);font-weight:800;font-size:clamp(22px,4vw,56px);letter-spacing:.26em;padding-left:.26em;text-shadow:0 0 34px #ff1f4f,0 0 10px #ff1f4f,0 2px 18px rgba(0,0,0,.6)}
#l3hud .l3s{position:absolute;left:0;right:0;top:calc(20vh + clamp(22px,4vw,56px)*.8);font-size:11px;font-weight:600;letter-spacing:6px;color:#ff8da3;padding-left:6px}
#l3hud .l3b{position:absolute;left:50%;top:80vh;width:min(640px,62vw);height:14px;transform:translateX(-50%);background:rgba(8,2,12,.8);border:1px solid rgba(255,31,79,.8);padding:2px;box-sizing:border-box}
#l3hud .l3b i{display:block;height:100%;width:0;background:linear-gradient(90deg,#5a0719,#ff1f4f 70%,#ffb0c0);box-shadow:0 0 16px #ff1f4f}
#l3hud .l3p{position:absolute;left:0;right:0;top:calc(80vh + 26px);font-size:13px;font-weight:700;letter-spacing:7px;text-shadow:0 0 12px #ff1f4f;padding-left:7px}/*L3end*/
'''
s=s.replace('#lgfx{position:fixed;inset:0;width:100%;height:100%;z-index:500;pointer-events:none;display:none}','#lgfx{position:fixed;inset:0;width:100%;height:100%;z-index:500;pointer-events:none;display:none}\n'+css,1)
s=s.replace('<canvas id=lgmap aria-hidden="true"></canvas>','<canvas id=lgmap aria-hidden="true"></canvas><canvas id=l3 aria-hidden="true"></canvas>',1)
s=s.replace('const views={',js+'\nconst views={',1)
open(p,'w',encoding='utf-8').write(s)
print(len(s),s.count('id=l3 '),s.count('L3css'))
