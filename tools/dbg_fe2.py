import sys,json
from playwright.sync_api import sync_playwright
import lgx,bpdrive
KEY=sys.argv[1];SI=int(sys.argv[2])
F='http://127.0.0.1:8765/owq-command-station-v2.html'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
    ctx=b.new_context(viewport={'width':1366,'height':860});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append('PE '+str(e)[:300]))
    pg.goto(F);pg.wait_for_timeout(2500);lgx.login(pg,6)
    D=bpdrive.data(pg,KEY)
    pg.evaluate("openTab('Learning Network')");pg.wait_for_timeout(500);pg.evaluate("lnTrk(1)");pg.wait_for_timeout(400)
    pg.evaluate(f"lnOpen('bp-{KEY}')");pg.wait_for_timeout(400)
    n=len(D['pages'])
    for i in range(n): pg.evaluate(f"lnDp({i})")
    pg.click(".lnnav .btn:not(.o)");pg.wait_for_timeout(300)
    for si in range(1,SI+1):
        probs=bpdrive.do_step(pg,KEY,si,D,wrong=True)
        dis=pg.evaluate("document.querySelector('.lnnav .btn:not(.o)').disabled")
        g=pg.evaluate("[lnRvN(),lnNeed(LNM.find(x=>x.id==='bp-%s'),%d)]"%(KEY,si))
        if probs or dis: print('step',si,'problems',probs,'gate',g,'disabled',dis)
        if dis: break
        if si<SI: pg.click(".lnnav .btn:not(.o)");pg.wait_for_timeout(250)
    # list which sn keys exist for this step
    print(pg.evaluate("Object.keys(LN.sn).filter(k=>k.startsWith('bp-%s:%d:')).sort()"%(KEY,SI)))
    print(json.dumps([ (i,b['k'],b.get('type')) for i,b in enumerate(D['guide'][SI-1]['b'])]))
    print(errs[:4]);b.close()
