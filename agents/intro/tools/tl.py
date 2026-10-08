import os
import sys,json,time
from playwright.sync_api import sync_playwright
# usage: tl.py prefix scenario lat lon t1,t2,... [W H]
pre=sys.argv[1];scn=sys.argv[2];lat=float(sys.argv[3]);lon=float(sys.argv[4]);ts=[float(x) for x in sys.argv[5].split(',')]
W=int(sys.argv[6]) if len(sys.argv)>6 else 960;H=int(sys.argv[7]) if len(sys.argv)>7 else 540
args=['--no-sandbox','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-background-networking','--disable-component-update','--no-first-run']
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=args)
    pg=b.new_page(viewport={'width':W,'height':H})
    logs=[]
    pg.on('console',lambda m:logs.append(m.type+': '+m.text[:300]))
    pg.on('pageerror',lambda e:logs.append('PAGEERR '+str(e)[:300]))
    pg.goto('http://127.0.0.1:'+os.environ.get('GXPORT','8773')+'/gx_tl.html')
    pg.wait_for_function('window.__ok!==undefined',timeout=20000)
    pg.wait_for_function('window.__tex!==undefined',timeout=30000)
    pg.evaluate('scn(%s,%s,%s)'%(json.dumps(scn),lat,lon))
    for t in ts:
        r=pg.evaluate('go(%s)'%t)
        pg.wait_for_timeout(120)
        pg.screenshot(path='%s_%04d.png'%(pre,round(t*100)))
        print(t,r)
    for l in logs[:6]:
        if '404' not in l: print(l)
    b.close()
