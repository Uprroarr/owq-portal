import sys,time,os,json
from playwright.sync_api import sync_playwright
F='file:///mnt/user-data/outputs/owq-command-station-v2.html'
mode=sys.argv[1]
args=['--no-sandbox','--autoplay-policy=no-user-gesture-required']
if mode=='nogl': args+=['--disable-webgl','--disable-webgl2']
else: args+=['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=args)
    ctx=b.new_context(viewport={'width':800,'height':450},reduced_motion='reduce' if mode=='rm' else 'no-preference')
    pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)[:200]))
    pg.goto(F,wait_until='commit',timeout=120000)
    st=lambda: pg.evaluate("""()=>({l3:(document.getElementById('l3')||{}).className,y:typeof L3!=='undefined'&&L3.yieldTo,map:(document.getElementById('lgmap')||{}).className,cx:(document.getElementById('cx')||{}).className,cxo:(document.getElementById('cx')||{style:{}}).style.opacity,ready:!!CX.ready,dead:!!CX.dead,on:!!CX.on,pill:(document.getElementById('gfxs')||{}).className,txt:((document.getElementById('gfxs')||{}).textContent||'').slice(0,90),RM,MOTION,full:document.documentElement.classList.contains('fullmo')})""")
    for i in range(16):
        pg.wait_for_timeout(1500)
        try: s=st()
        except Exception as e: s=str(e)[:100]
        print(round((i+1)*1.5,1),s)
        if mode=='normal' and isinstance(s,dict) and s['ready'] and 'ok' not in s['pill'] and i>6: break
    if mode=='rm':
        pg.screenshot(path='gfx_rm.png')
        pg.evaluate("document.getElementById('gfxs').click()")
        pg.wait_for_timeout(2500);print('after click',st())
        print('stored',pg.evaluate("localStorage.getItem('owq_motion')"))
    if mode=='nogl':
        pg.evaluate("document.getElementById('gfxs').click()");pg.wait_for_timeout(500)
        print('details',pg.evaluate("(document.getElementById('gfxd')||{}).innerText"))
        pg.screenshot(path='gfx_nogl.png')
    pass
    print(errs[:5])
    b.close()
