"""Render landed frames for several cities from the built portal: land.py out_prefix City1 City2 ...  env W,H,MOBILE,PORTAL"""
import os,sys,json
from playwright.sync_api import sync_playwright
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
pre=sys.argv[1];cities=sys.argv[2:]
W=int(os.environ.get('W',1366));H=int(os.environ.get('H',860));MOB=os.environ.get('MOBILE')=='1'
F=os.path.abspath(os.environ.get('PORTAL',SP+'/agents/r5/out/portal5.html'))
args=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-background-networking','--no-first-run']
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=args)
    kw=dict(viewport={'width':W,'height':H})
    if MOB:kw.update(is_mobile=True,has_touch=True,device_scale_factor=1)
    ctx=b.new_context(**kw);ctx.add_init_script("try{localStorage.setItem('owq_gq','auto')}catch(e){}")
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)[:300]))
    pg.goto('file://'+F,wait_until='commit',timeout=120000)
    pg.wait_for_function("typeof GXU!=='undefined'&&GXU.state()==='menu'",timeout=150000);pg.wait_for_timeout(400)
    for city in cities:
        if pg.evaluate("GXU.state()")!='menu':
            pg.evaluate("GXU.back()");pg.evaluate("GX.stop();(()=>{let n=0;while(GXU.state()!=='menu'&&n++<900)GX.step(1/30)})()")
            pg.wait_for_function("GXU.state()==='menu'",timeout=60000);pg.evaluate("GX.start()")
        ix=pg.evaluate("GXC.findIndex(c=>c[0]===%s)"%json.dumps(city))
        if ix<0:print('unknown',city);continue
        pg.evaluate("(()=>{const r=Math.random;Math.random=()=>(%d+.5)/GXC.length;try{pickProfile(GXU.U.names[0])}finally{Math.random=r}})()"%ix)
        pg.evaluate("GX.stop();GX.S.scale=1;GX.resize()")
        pg.evaluate("(()=>{let n=0;while(GXU.state()!=='land'&&n++<900){GX.step(1/30)}GX.draw();GX.S.cb.frame&&GX.S.cb.frame(1/30)})()")
        pg.wait_for_function("GXU.state()==='land'",timeout=60000)
        pg.wait_for_function("getComputedStyle(document.getElementById('gxa')).opacity==='1'",timeout=60000)
        pg.evaluate("GX.draw()");pg.wait_for_timeout(500)
        info=pg.evaluate("(()=>{try{const I=GX.dir.info();return {alt:+GX.alt().toFixed(3),n:(GX.S.bN|0)+(GX.S.bNC|0),ms:+(GX.S.bMs||0).toFixed(0),camENU:GX.S.ENU.cam.map(v=>+v.toFixed(2)),camP:I.camP&&I.camP.map(v=>+v.toFixed(2)),aim:I.aim.map(v=>+v.toFixed(2)),yaw:+(I.yaw*180/Math.PI).toFixed(0),hc:I.hc,Dc:I.Dc}}catch(e){return String(e).slice(0,80)}})()")
        out='%s_%s.png'%(pre,city.lower().replace(' ','').replace('ã','a'));pg.screenshot(path=out);print(city,json.dumps(info),out,flush=True)
    for e in errs[:5]:print(e)
    b.close()
