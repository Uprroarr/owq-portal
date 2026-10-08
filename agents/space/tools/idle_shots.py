import sys,os
from playwright.sync_api import sync_playwright
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
F='file://'+SP+'/agents/space/out/'+os.environ.get('PORTAL','portal.html');O=SP+'/agents/space/shots/'
W=int(os.environ.get('W',1280));H=int(os.environ.get('H',720));Q=os.environ.get('Q','auto');pre=os.environ.get('PRE','idle')
ts=[float(x) for x in sys.argv[1:]] or [1,5,9]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    kw=dict(viewport={'width':W,'height':H})
    if W<500:kw.update(is_mobile=True,has_touch=True)
    ctx=b.new_context(**kw);ctx.add_init_script("localStorage.owq_gq='%s'"%Q)
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    pg.on('console',lambda m:errs.append(m.text[:300]) if m.type=='error' and 'ERR_' not in m.text else None)
    pg.goto(F);pg.wait_for_function("typeof GXU!=='undefined'&&GXU.state()==='menu'",timeout=150000);pg.wait_for_timeout(9000)
    print(pg.evaluate("({api:GX.S.api,err:String(GX.S.err||'')})"))
    pg.evaluate("GX.stop()")
    for i,t in enumerate(ts):
        pg.evaluate("(t)=>{GX.S.t=t;GX.draw()}",t);pg.screenshot(path=O+'%s_%s_%02d.png'%(pre,Q,i))
    print('errs',errs[:4]);b.close()
