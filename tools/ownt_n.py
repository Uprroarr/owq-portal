from playwright.sync_api import sync_playwright
F='file:///mnt/user-data/outputs/owq-command-station-v2.html'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl'])
    ctx=b.new_context(viewport={'width':1366,'height':860});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}");pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append('PE '+str(e)[:300]))
    pg.goto(F);pg.wait_for_timeout(2500)
    import lgx;lgx.login(pg,6);pg.wait_for_timeout(5000)
    print('who',pg.evaluate("[WHO,acWho(),ONLINE]"))
    print('open shift',pg.evaluate("JSON.stringify((D.shifts||[]).filter(s=>!s.end).map(s=>({ag:s.ag,auto:s.auto})))"))
    pg.wait_for_timeout(1500)
    print('clock chip',pg.evaluate("(document.getElementById('acl')||{}).innerText"))
    print('ln owner',pg.evaluate("(()=>{const S=lnStates('Agency Owner'),C=lnStates('Cole Leckey');return[S.filter(x=>x.tr===0&&x.done).length,C.filter(x=>x.tr===0&&x.done).length,lnXP('Agency Owner'),lnRank(S.filter(x=>x.done).length)[1],lnBpOpen('Agency Owner',S)]})()"))
    pg.evaluate("openTab('Learning Network')");pg.wait_for_timeout(900);pg.screenshot(path='own_1.png')
    print('standings',pg.evaluate("[...document.querySelectorAll('.lnt .lntn b')].map(e=>e.innerText)"))
    pg.evaluate("lockView()");pg.wait_for_timeout(1500)
    print('after lock',pg.evaluate("JSON.stringify((D.activity||[]).filter(a=>a.clock).slice(-1).map(a=>({ag:a.ag,h:a.h})))"),pg.evaluate("(D.shifts||[]).filter(s=>!s.end&&s.ag==='Cole Leckey').length"))
    print(errs[:5] or 'no page errors')
    b.close()
