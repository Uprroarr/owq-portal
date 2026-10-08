import sys,os
from playwright.sync_api import sync_playwright
import lgx
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
    ctx=b.new_context(viewport={'width':1366,'height':1500});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    pg.goto('http://127.0.0.1:8765/owq-command-station-v2.html');pg.wait_for_timeout(2500);lgx.login(pg,6)
    pg.evaluate("openTab('Learning Network')");pg.wait_for_timeout(600);pg.evaluate("lnTrk(1)");pg.wait_for_timeout(600)
    pg.evaluate("document.querySelector('.lnal')&&document.querySelector('.lnal .x')&&0")
    pg.screenshot(path='hub_v74.png')
    print(errs or 'no errors')
    b.close()
