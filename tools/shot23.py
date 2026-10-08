from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    for nm,vp in [('d',(1440,820)),('m',(390,780))]:
        pg=b.new_page(viewport={'width':vp[0],'height':vp[1]})
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(3800)
        pg.screenshot(path=f'h_{nm}1.png')
        if nm=='d':
            pg.evaluate("(()=>{const t=(performance.now()-MP.t0)/1000;MP.nx=t-1;mapEvGen(t);MP.nx=1e9;const v=MP.ev[0];v.big=true;v.ty='sale';v.ln='SALE CLOSED';v.amt='+$1,240';v.n='Nate Johnson'})()")
            pg.wait_for_timeout(2300);pg.screenshot(path='h_d2.png')
        pg.click('.lpc >> nth=1');pg.wait_for_timeout(1500);pg.screenshot(path=f'h_{nm}3.png');print(nm,errs)
