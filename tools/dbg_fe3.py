import sys,json
from playwright.sync_api import sync_playwright
import lgx,bpdrive
KEY='final-expense-script';SI=9;BI=6
F='http://127.0.0.1:8765/owq-command-station-v2.html'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
    ctx=b.new_context(viewport={'width':1366,'height':860});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append('PE '+str(e)[:300]))
    pg.goto(F);pg.wait_for_timeout(2500);lgx.login(pg,6)
    D=bpdrive.data(pg,KEY)
    blk=D['guide'][SI-1]['b'][BI]
    print(json.dumps(blk,ensure_ascii=False))
    pg.evaluate("openTab('Learning Network')");pg.wait_for_timeout(500);pg.evaluate("lnTrk(1)");pg.wait_for_timeout(400)
    pg.evaluate(f"lnOpen('bp-{KEY}')");pg.wait_for_timeout(400)
    pg.evaluate("""(a)=>{const m=LNM.find(x=>x.id===a[0]);m.bp.pages.forEach((p,i)=>LN.sn[m.id+':0:p'+i]=1);LN.step=a[1];LN.anim=0;lnR(1)}""",['bp-'+KEY,SI])
    pg.wait_for_timeout(300)
    cp=f"cp_{SI}_{BI}"
    print(pg.evaluate("(id)=>document.getElementById(id).outerHTML",cp)[:1800])
    k=f"bp-{KEY}:{SI}:c{BI}"
    for j,x in enumerate(blk['blanks']):
        pg.select_option(f"#{cp} select.lnfs >> nth={j}",value=str(x['a']))
        print('after select',j,pg.evaluate("(k)=>JSON.stringify(lnCpSt(k))",k))
    print('blanks in page',pg.evaluate("(k)=>JSON.stringify(lnCpB(k).blanks)",k))
    pg.click(f"#{cp} button[onclick=\"lnFillGo('{k}')\"]");pg.wait_for_timeout(100)
    print('cleared',pg.evaluate("(k)=>!!LN.sn[k]",k))
    print(pg.evaluate("(id)=>document.getElementById(id).innerText",cp)[:600])
    print(errs)
    b.close()
