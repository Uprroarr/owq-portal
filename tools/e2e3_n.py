from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
    ctx=b.new_context(viewport={'width':640,'height':360});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}");pg=ctx.new_page()
    errs=[];pg.on('pageerror',lambda e:errs.append('PE '+str(e)));pg.on('console',lambda m:errs.append(m.type+' '+m.text) if m.type in('error','warning') else None)
    pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html',timeout=240000);pg.wait_for_timeout(1500)
    import lgx
    lgx.to_menu(pg);print('login',pg.evaluate("[GXU.state(),GXU.U.gl,GXU.U.fail]"))
    lgx.login(pg,6);pg.wait_for_timeout(3000)
    print('after',pg.evaluate("[tab,ONLINE,GXU.on(),!!document.getElementById('gxc')]"))
    print('\n'.join(errs[:10]))
    b.close()
