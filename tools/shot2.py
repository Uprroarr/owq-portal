from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1280,'height':800})
    pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(600)
    pg.click('.lpc >> nth=1');pg.fill('#lgi','x');pg.press('#lgi','Enter');pg.wait_for_timeout(6500)
    pg.evaluate("openTab('Team Chat');chGo('__voice')");pg.wait_for_timeout(600);pg.screenshot(path='v1.png')
    b.close()
