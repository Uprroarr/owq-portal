import sys,time,os,json
from playwright.sync_api import sync_playwright
F='file:///mnt/user-data/outputs/owq-command-station-v2.html'
args=['--no-sandbox','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=args)
    ctx=b.new_context(viewport={'width':640,'height':360})
    ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)[:300]))
    pg.on('console',lambda m:errs.append(m.type+': '+m.text[:200]) if m.type in ('error','warning') and 'fonts.g' not in m.text else None)
    pg.goto(F,wait_until='commit',timeout=120000)
    for k in range(8):
        pg.wait_for_timeout(2500)
        try:
            print(k,pg.evaluate("()=>({st:GXU.state(),on:GXU.on(),gl:GXU.U.gl,fail:GXU.U.fail,q:GXU.U.q,ready:GX.S.ready,err:String(GX.S.err||''),still:GX.S.noSpin,cls:document.getElementById('login').className})"))
        except Exception as e: print(k,'eval err',str(e)[:100])
    print('ERRS',errs[:8])
    b.close()
