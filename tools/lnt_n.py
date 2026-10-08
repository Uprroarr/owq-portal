from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-gpu','--disable-webgl'])
    ctx=b.new_context(viewport={'width':1280,'height':720});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}");pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(2500)
    import lgx;lgx.login(pg,1);pg.wait_for_timeout(4000)
    print(pg.evaluate("[ONLINE,WHO,!!openShift(WHO),lnStates(WHO).filter(x=>x.done).length,lnStates(WHO).length]"))
    pg.evaluate("(()=>{let s=openShift(WHO);if(!s){clockIn(WHO);s=openShift(WHO)}s.start=Date.now()-31*60000;NAGK.snz=Date.now()+9e9;const c=document.getElementById('ckn');if(c)c.remove();lnNagCheck()})()");pg.wait_for_timeout(600)
    print('shown',pg.evaluate("!!document.getElementById('lnn')"));pg.screenshot(path='lnnag.png')
    pg.click('#lnnGo');pg.wait_for_timeout(900);print('tab',pg.evaluate("tab"),'gone',pg.evaluate("!document.getElementById('lnn')"),errs[:3])
    b.close()
