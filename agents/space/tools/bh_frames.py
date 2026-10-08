import sys,os,time
from playwright.sync_api import sync_playwright
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
F='file://'+SP+'/agents/space/out/portal.html';O=SP+'/agents/space/shots/'
W=int(os.environ.get('W',640));H=int(os.environ.get('H',360));LOW=os.environ.get('LOW')
times=[float(x) for x in sys.argv[1:]] or [0,.3,.8,1.4,1.9,2.4,2.8,3.1,3.3,3.5]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    ctx=b.new_context(viewport={'width':W,'height':H})
    if LOW:ctx.add_init_script("localStorage.owq_gq='low'")
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]));pg.on('console',lambda m:errs.append(m.text[:300]) if m.type=='error' else None)
    pg.goto(F);pg.wait_for_function("typeof GXU!=='undefined'&&GXU.state()==='menu'",timeout=150000);pg.wait_for_timeout(1500)
    print(pg.evaluate("({api:GX.S.api,low:GX.S.q})"))
    pg.evaluate("document.body.classList.add('hush');document.getElementById('login').style.visibility='hidden';GX.dir.launch()")
    pg.wait_for_function("GX.S.BH.on||GX.S.BH.fail",timeout=60000)
    print('BH',pg.evaluate("({on:GX.S.BH.on,fail:GX.S.BH.fail,err:GX.S.bhErr})"))
    pg.evaluate("GX.stop()")
    for i,t in enumerate(times):
        # total fall = 2.6 + 1.0 ; flash after 2.6+.45
        fl=max(0,min(1,(t-3.05)/.38))
        pg.evaluate("(t)=>{const B=GX.S.BH;GX.S.t=B.t0+t[0];GX.C.flash=t[1];GX.draw()}",[t,fl])
        pg.screenshot(path=O+'bh_%02d.png'%i)
    print('errs',errs[:5])
    b.close()
