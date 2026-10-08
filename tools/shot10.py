from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    for vw,name in [({'width':1280,'height':760},'m1'),({'width':390,'height':780},'m2')]:
        pg=b.new_page(viewport=vw)
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(9000);pg.screenshot(path=name+'.png');print(name,errs)
