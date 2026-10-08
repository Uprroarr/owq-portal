from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'])
    pg=b.new_page(viewport={'width':1280,'height':720});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(2500)
    pg.evaluate("CX.scale=.55;CX.maxS=.55;CX.fwAuto=0");pg.wait_for_timeout(9000)
    pg.screenshot(path='lg_new.png',timeout=900000);print(errs[:4]);b.close()
