from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg=b.new_page(viewport={'width':1100,'height':700})
    pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(3000)
    pg.evaluate("pickProfile('Nate Johnson')");pg.fill('#lgi','NIGHTHAWK');pg.evaluate("doLogin()")
    pg.wait_for_timeout(1500)
    for i in range(6):
        print(pg.evaluate("[document.getElementById('bpc').textContent, getComputedStyle(document.querySelector('#boot .bp i')).width, getComputedStyle(document.querySelector('#boot .bp')).width, getComputedStyle(document.querySelector('#boot')).opacity].join(' | ')"));pg.wait_for_timeout(600)
