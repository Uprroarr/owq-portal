from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg=b.new_page(viewport={'width':1440,'height':820})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(2500)
    pg.evaluate("window.requestAnimationFrame=()=>0;MP.raf=0")
    pg.wait_for_timeout(200)
    pg.evaluate("document.getElementById('cbars').classList.add('on')")
    for kind,ks in [('login',[.12,.3,.5,.7,.88]),('exit',[.1,.3,.55,.75,.9])]:
        for k in ks:
            pg.evaluate("([kind,k])=>{fxFly(kind);flyFrame(FLY.t0+k*FLY.dur)}",[kind,k])
            pg.wait_for_timeout(1000)
            pg.screenshot(path=f'y_{kind}_{int(k*100)}.png')
    print(errs)
