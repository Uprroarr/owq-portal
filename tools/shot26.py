from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg=b.new_page(viewport={'width':1440,'height':820})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(2500)
    pg.evaluate("MP.nx=1e9;window.requestAnimationFrame=()=>0;MP.raf=0")
    pg.wait_for_timeout(300)
    for a in [0.15,0.3,0.55]:
        pg.evaluate("(a)=>{const T=20;MP.ev=[{n:'Nate Johnson',ty:'sale',ln:'SALE CLOSED',amt:'+$1,240',big:true,car:'a',tb:T,t0:T,pops:3}];MP.sp=[];mapFrame(MP.t0+(T+a)*1000,0)}",a)
        pg.screenshot(path=f'g{int(a*100)}.png',clip={'x':0,'y':380,'width':900,'height':260})
    print(errs)
