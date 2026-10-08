from playwright.sync_api import sync_playwright
import sys
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    for vw,name in [({'width':1280,'height':760},'sc1'),({'width':390,'height':780},'sc2')]:
        pg=b.new_page(viewport=vw)
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
        pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(6000)
        pg.evaluate("MP.nx=0");pg.wait_for_timeout(400);pg.screenshot(path=name+'.png');print(name,errs)
