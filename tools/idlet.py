from playwright.sync_api import sync_playwright
import lgx
F='file:///mnt/user-data/outputs/owq-command-station-v2.html'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-background-networking'])
    ctx=b.new_context(viewport={'width':1280,'height':720});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    pg.goto(F,wait_until='commit',timeout=120000)
    lgx.login(pg,2);pg.wait_for_timeout(2500)
    pg.evaluate("idleLock()");pg.wait_for_timeout(2500)
    lgx.to_menu(pg)
    print(pg.evaluate("({msg:(document.querySelector('.gxmsg')||{}).textContent||'',online:ONLINE,st:GXU.state(),lg:LG})"))
    pg.screenshot(path='idle_msg.png')
    print(errs[:4]);b.close()
