import os
import sys,json,time
from playwright.sync_api import sync_playwright
# usage: shot.py out.png state t '{"overrides"}' [W H]
out=sys.argv[1];state=sys.argv[2];t=float(sys.argv[3]);over=json.loads(sys.argv[4]) if len(sys.argv)>4 else {}
W=int(sys.argv[5]) if len(sys.argv)>5 else 1280;H=int(sys.argv[6]) if len(sys.argv)>6 else 720
args=['--no-sandbox','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-background-networking','--disable-component-update','--no-first-run']
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=args)
    pg=b.new_page(viewport={'width':W,'height':H})
    logs=[]
    pg.on('console',lambda m:logs.append(m.type+': '+m.text[:300]))
    pg.on('pageerror',lambda e:logs.append('PAGEERR '+str(e)[:300]))
    pg.goto('http://127.0.0.1:'+os.environ.get('GXPORT','8773')+'/gx_test.html')
    pg.wait_for_function('window.__ok!==undefined',timeout=20000)
    print('ok',pg.evaluate('window.__ok'),'err',pg.evaluate('String(GX.S.err||"")'))
    pg.wait_for_function('window.__tex!==undefined',timeout=30000)
    print('tex',pg.evaluate('window.__tex'))
    t0=time.time()
    e=pg.evaluate('setup(%s,%s,%s)'%(json.dumps(state),t,json.dumps(over)))
    pg.wait_for_timeout(300)
    print('glerr',e,'render ms',round((time.time()-t0)*1000))
    pg.screenshot(path=out)
    print('gpu',pg.evaluate('GX.S.gpu'),pg.evaluate('GX.S.api'))
    for l in logs[:8]: print(l)
    b.close()
