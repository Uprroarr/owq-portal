from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg=b.new_page(viewport={'width':1280,'height':760})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(8000)
    pg.evaluate("MP.ev=[];MP.nx=1e9;")
    pg.evaluate("(()=>{const t=(performance.now()-MP.t0)/1000;MP.ev=[{n:'Nate Johnson',ty:'sale',tx:'SALE CLOSED +$1,240',t0:t-.6}];MP.log=[{n:'Nate Johnson',ty:'sale',tx:'SALE CLOSED +$1,240',at:new Date()}]})()")
    pg.wait_for_timeout(250);pg.screenshot(path='ev_sale.png');print(errs)
