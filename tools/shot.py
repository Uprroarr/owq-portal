from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium' if False else None)
    pg=b.new_page(viewport={'width':1280,'height':800})
    pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(800)
    pg.screenshot(path='s1.png')
    pg.click('.lpc >> nth=0');pg.wait_for_timeout(400);pg.screenshot(path='s2.png')
    pg.fill('#lgi','x');pg.press('#lgi','Enter');pg.wait_for_timeout(6500)
    pg.evaluate("openTab('Team Chat')");pg.wait_for_timeout(800);pg.screenshot(path='s3.png')
    pg.evaluate("openTab('Leaderboard')");pg.wait_for_timeout(1500);pg.screenshot(path='s4.png')
    pg.set_viewport_size({'width':390,'height':800});pg.evaluate("openTab('Team Chat')");pg.wait_for_timeout(800);pg.screenshot(path='s5.png')
    b.close()
