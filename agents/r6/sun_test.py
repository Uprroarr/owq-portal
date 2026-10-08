import os,sys,json
from playwright.sync_api import sync_playwright
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
F=SP+'/agents/r6/out/portal.html'
args=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=args)
    ctx=b.new_context(viewport={'width':640,'height':360});pg=ctx.new_page()
    pg.goto('file://'+F,wait_until='commit');pg.wait_for_function("typeof GXU!=='undefined'&&GXU.state()==='menu'",timeout=150000)
    pg.evaluate("(()=>{const l=document.getElementById('login');document.body.classList.add('hush');GX.stop();GX.dir.snap('map',[40.7,-74]);})()")
    for i,(sa,sA,sI) in enumerate(json.loads(sys.argv[1])):
        pg.evaluate("(a)=>{GX.set({sunAbs:a[0],sunA:a[1],sunI:a[2],ringK:0,band:0,gridK:0,veinK:0});GX.draw()}",[sa,sA,sI])
        pg.screenshot(path=SP+'/agents/r6/shots/sun_%d.png'%i)
    print(pg.evaluate("JSON.stringify({sunR:GX.C.sunR,sunA:GX.C.sunA,sunAbs:GX.C.sunAbs,sunI:GX.C.sunI,sunVis:GX.C.sunVis,cityK:GX.C.cityK,expo:GX.C.expo,atm:GX.C.atm})"))
    b.close()
