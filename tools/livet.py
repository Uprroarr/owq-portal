import sys,time,os
from playwright.sync_api import sync_playwright
mode=sys.argv[1] if len(sys.argv)>1 else 'gl'
args=['--no-sandbox']+(['--disable-webgl','--disable-webgl2'] if mode=='nogl' else ['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=args)
    pg=b.new_page(viewport={'width':1280,'height':720});errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERROR '+str(e)[:300]));pg.on('console',lambda m:errs.append(m.type+': '+m.text[:200]) if m.type=='error' else None)
    t=time.time();pg.goto('file://'+os.path.abspath('live69.html'),timeout=180000,wait_until='load');print('load s',round(time.time()-t,1))
    pg.wait_for_timeout(6000)
    print(pg.evaluate("[typeof VO3,typeof CX,typeof voApi,document.getElementById('login').className,(document.getElementById('gfxs')||{}).textContent||'',document.title]"))
    print('\n'.join(errs[:10]) or 'no errors')
    b.close()
