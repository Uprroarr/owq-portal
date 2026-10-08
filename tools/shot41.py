from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg=b.new_page(viewport={'width':1440,'height':810})
    pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(4000)
    pg.screenshot(path='s0.png')
    pg.click('.lpc >> nth=1');pg.wait_for_timeout(1500);pg.screenshot(path='s1.png')
