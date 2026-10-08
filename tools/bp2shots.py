import sys,os,json
from playwright.sync_api import sync_playwright
import lgx
KEY=sys.argv[1] if len(sys.argv)>1 else 'rebuttals'
W=int(os.environ.get('W',1366));H=int(os.environ.get('H',860));TAG=os.environ.get('TAG','b2')
MOB=os.environ.get('MOB')=='1'
F=os.environ.get('OWQ_URL','http://127.0.0.1:8765/owq-command-station-v2.html')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
    ctx=b.new_context(viewport={'width':W,'height':H},is_mobile=MOB,has_touch=MOB,device_scale_factor=1)
    ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('PE '+str(e)[:300]))
    pg.on('console',lambda m:errs.append('CE '+m.text[:200]) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
    pg.goto(F);pg.wait_for_timeout(2500)
    lgx.login(pg,6)
    pg.evaluate("openTab('Learning Network')");pg.wait_for_timeout(600);pg.evaluate("lnTrk(1)");pg.wait_for_timeout(500)
    pg.evaluate(f"lnOpen('bp-{KEY}')");pg.wait_for_timeout(600)
    n=pg.evaluate("LNM.find(x=>x.id==='bp-%s').bp.pages.length"%KEY)
    for i in range(n): pg.evaluate(f"lnDp({i})");pg.wait_for_timeout(60)
    pg.click(".lnnav .btn:not(.o)");pg.wait_for_timeout(400)
    G=pg.evaluate("LNM.find(x=>x.id==='bp-%s').bp.guide"%KEY)
    def sh(name):
        try: pg.screenshot(path=f'{TAG}_{name}.png')
        except Exception: pg.screenshot(path=f'{TAG}_{name}.png')
    for si in range(1,len(G)+1):
        pg.wait_for_timeout(250);sh(f's{si}a')
        # open the first dropdown
        pg.evaluate("document.querySelector('.lnach')&&document.querySelector('.lnach').click()");pg.wait_for_timeout(500);sh(f's{si}b')
        # open the rest
        pg.evaluate("document.querySelectorAll('.lnach').forEach(b=>{if(b.getAttribute('aria-expanded')!=='true')b.click()})");pg.wait_for_timeout(500)
        pg.evaluate("document.querySelectorAll('.lnth .lnthb').forEach(b=>b.click())")
        pg.evaluate("document.querySelectorAll('.lncva .btn').forEach(b=>{for(let i=0;i<9;i++)b.click()})")
        pg.wait_for_timeout(500);sh(f's{si}c')
        pg.evaluate("window.scrollTo(0,99999);document.getElementById('main')&&(document.getElementById('main').scrollTop=99999)");pg.wait_for_timeout(300);sh(f's{si}d')
        # answer wrong, then right
        cp=G[si-1]['b'][-1]
        bad=[i for i in range(3) if i!=cp['a']][0]
        pg.click(f".lncp button.lnq >> nth={bad}");pg.wait_for_timeout(300);sh(f's{si}e')
        pg.click(f".lncp button.lnq >> nth={cp['a']}");pg.wait_for_timeout(500);sh(f's{si}f')
        pg.click(".lnnav .btn:not(.o)");pg.wait_for_timeout(350)
    sh('quiz')
    print('mode',pg.evaluate("LN.mode"),'errors',errs[:5] or 'none')
    b.close()
