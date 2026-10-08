from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg=b.new_page(viewport={'width':1280,'height':760})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(3500)
    pg.evaluate("MP.nx=1e9;MP.ev=[];MP.fw=[];MP.sh=[];window.__t0=performance.now()")
    pg.evaluate("(()=>{const t=(performance.now()-MP.t0)/1000;MP.nx=t-1;mapEvGen(t);MP.nx=1e9;const v=MP.ev[0];v.big=true;v.ty='sale';v.ln='SALE CLOSED';v.amt='+$1,240';v.n='Nate Johnson'})()")
    pg.wait_for_timeout(900);pg.screenshot(path='r1.png')
    pg.wait_for_timeout(1000);pg.screenshot(path='r2.png')
    pg.wait_for_timeout(500);pg.screenshot(path='r3.png');print(errs)
