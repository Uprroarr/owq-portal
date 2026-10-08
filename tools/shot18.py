from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg=b.new_page(viewport={'width':1280,'height':760})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(5000)
    pg.evaluate("MP.nx=0");pg.wait_for_timeout(1700);pg.screenshot(path='fw1.png')
    pg.evaluate("MP.nx=0");pg.wait_for_timeout(1500);pg.screenshot(path='fw2.png');print(errs)
