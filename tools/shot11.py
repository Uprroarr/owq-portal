from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg=b.new_page(viewport={'width':1280,'height':760})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(10000)
    for i in range(4):
        pg.wait_for_timeout(1300);pg.screenshot(path=f'ev{i}.png')
    print(errs,pg.evaluate("MP.log&&MP.log.map(l=>l.tx)"))
