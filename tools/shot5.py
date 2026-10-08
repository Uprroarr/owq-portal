from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page(viewport={'width':1100,'height':700})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(3000)
    pg.evaluate("pickProfile('Nate Johnson')");pg.fill('#lgi','NIGHTHAWK');pg.evaluate("doLogin()")
    pg.wait_for_timeout(2600);pg.screenshot(path='lb1.png')
    print(pg.evaluate("document.getElementById('boot').className+' '+document.getElementById('bpc').textContent"))
    pg.wait_for_timeout(3500);print(pg.evaluate("document.getElementById('boot').className+' online='+ONLINE"));pg.screenshot(path='lb2.png')
    print(errs)
