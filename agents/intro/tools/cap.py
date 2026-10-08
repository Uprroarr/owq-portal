import os,sys,json,time
from playwright.sync_api import sync_playwright
# usage: cap.py [--page gx_dev.html?q=full] [--size 640x360] cmd ...
#  cmds: scn:name,lat,lon   go:t   adv:dt   shot:file.png   time:n   js:expr   wait:ms
args=sys.argv[1:];page='gx_dev.html';W,H=640,360
while args and args[0].startswith('--'):
    k=args.pop(0)
    if k=='--page':page=args.pop(0)
    elif k=='--size':W,H=[int(x) for x in args.pop(0).split('x')]
ba=['--no-sandbox','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-background-networking','--disable-component-update','--no-first-run','--no-proxy-server']
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=ba)
    pg=b.new_page(viewport={'width':W,'height':H})
    logs=[]
    pg.on('console',lambda m:logs.append(m.type+': '+m.text[:400]))
    pg.on('pageerror',lambda e:logs.append('PAGEERR '+str(e)[:400]))
    pg.goto('http://127.0.0.1:'+os.environ.get('GXPORT','8773')+'/'+page)
    pg.wait_for_function('window.__ok!==undefined',timeout=30000)
    if not pg.evaluate('window.__ok'):print('INIT FAIL',pg.evaluate('String(GX.S.err||"")'))
    pg.wait_for_function('window.__tex!==undefined',timeout=30000)
    for c in args:
        k,_,v=c.partition(':')
        t0=time.time()
        if k=='scn':
            a=v.split(',',3);info=a[3] if len(a)>3 else 'null'
            print('scn',pg.evaluate('scn(%s,%s,%s,%s)'%(json.dumps(a[0]),a[1] if len(a)>1 else 0,a[2] if len(a)>2 else 0,info)))
        elif k=='go':print('go',v,pg.evaluate('go(%s)'%v),'%.0fms'%((time.time()-t0)*1000))
        elif k=='adv':print('adv',pg.evaluate('adv(%s)'%v))
        elif k=='shot':pg.wait_for_timeout(60);pg.screenshot(path=v);print('shot',v)
        elif k=='time':print('time',v,'%.1f ms/frame'%pg.evaluate('timeit(%s)'%v))
        elif k=='js':print('js',pg.evaluate(v))
        elif k=='wait':pg.wait_for_timeout(int(v))
    for l in logs[:12]:
        if '404' not in l and 'favicon' not in l:print(l)
    b.close()
