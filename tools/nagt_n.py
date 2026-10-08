from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl'])
    ctx=b.new_context(viewport={'width':1280,'height':720});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}");pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(2500)
    import lgx;lgx.login(pg,1);pg.wait_for_timeout(4000)
    pg.evaluate("ckNagCheck();NAGK.t=Date.now()-3700000;ckNagCheck()");pg.wait_for_timeout(500)
    print('shown',pg.evaluate("!!document.getElementById('ckn')"));pg.screenshot(path='nag.png')
    pg.click('#cknGo');pg.wait_for_timeout(1200);print('tab',pg.evaluate("tab"),'gone',pg.evaluate("!document.getElementById('ckn')"),errs)
    b.close()
