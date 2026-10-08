import sys,os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';B=SP+'/agents/bell'
sys.path.insert(0,SP);import lgx
from playwright.sync_api import sync_playwright
F='file://'+(sys.argv[1] if len(sys.argv)>1 else SP+'/v76-final.html')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
    ctx=b.new_context(viewport={'width':1440,'height':900});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    pg.goto(F,timeout=180000);pg.wait_for_timeout(2500);lgx.login(pg,6);pg.wait_for_timeout(4000)
    pg.screenshot(path=B+'/tmp/base_deck.png')
    pg.evaluate("openTab('Team Chat')");pg.wait_for_timeout(1200)
    pg.screenshot(path=B+'/tmp/base_chat.png')
    print(pg.evaluate("[RAIL,document.getElementById('rail').getBoundingClientRect().width,document.querySelector('aside').getBoundingClientRect().width]"))
    print(errs)
    b.close()
