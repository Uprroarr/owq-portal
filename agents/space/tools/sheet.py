#!/usr/bin/env python3
"""Deterministic dive frames from the REAL portal (DOM pin, HUD, card), for contact sheets.
   usage: sheet.py out_prefix "City" [t1,t2,...]   env W,H (1280x720), PORTAL (out/portal.html), Q (auto|low|still), MOBILE=1
   After pickProfile() the render loop is stopped and the director is stepped manually at 1/30 s, so frames do not depend
   on swiftshader speed. 'land' = the landed frame after the card transition."""
import os,sys,json,time
from playwright.sync_api import sync_playwright
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
pre=sys.argv[1];city=sys.argv[2];ts=(sys.argv[3] if len(sys.argv)>3 else '1.6,2.7,3.6,4.4,5.3,land').split(',')
W=int(os.environ.get('W',1280));H=int(os.environ.get('H',720));Q=os.environ.get('Q','auto');MOB=os.environ.get('MOBILE')=='1'
F=os.path.abspath(os.environ.get('PORTAL',SP+'/agents/intro/out/'+('portal_m.html' if MOB else 'portal.html')))
args=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-background-networking','--no-first-run']
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=args)
    kw=dict(viewport={'width':W,'height':H})
    if MOB:kw.update(is_mobile=True,has_touch=True,device_scale_factor=1)
    ctx=b.new_context(**kw)
    ctx.add_init_script("try{localStorage.setItem('owq_gq','%s')}catch(e){}"%Q)
    pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)[:300]))
    pg.goto('file://'+F,wait_until='commit',timeout=120000)
    pg.wait_for_function("typeof GXU!=='undefined'&&GXU.state()==='menu'",timeout=150000)
    pg.wait_for_timeout(500)
    ix=pg.evaluate("GXC.findIndex(c=>c[0]===%s)"%json.dumps(city))
    if ix<0:raise SystemExit('unknown city '+city)
    # choose the city deterministically for this run (the UI picks at random)
    pg.evaluate("(()=>{const r=Math.random;Math.random=()=>(%d+.5)/GXC.length;try{pickProfile(GXU.U.names[0])}finally{Math.random=r}})()"%ix)
    still=Q=='still'
    if not still:
        pg.evaluate("GX.stop();GX.S.scale=1;GX.resize();window.__T0=GX.time()")
    for t in ts:
        if t=='land':
            if not still:
                pg.evaluate("(()=>{let n=0;while(GXU.state()!=='land'&&n++<600){GX.step(1/30)}GX.draw();GX.S.cb.frame&&GX.S.cb.frame(1/30)})()")
            pg.wait_for_function("GXU.state()==='land'",timeout=60000)
            pg.wait_for_function("getComputedStyle(document.getElementById('gxa')).opacity==='1'&&getComputedStyle(document.getElementById('gxloc')).opacity==='1'",timeout=60000)
            pg.wait_for_timeout(600)
        else:
            tt=float(t)
            pg.evaluate("(()=>{const e=window.__T0+%f;while(GX.time()<e-1e-6)GX.step(Math.min(1/30,e-GX.time()));GX.draw();GX.S.cb.frame&&GX.S.cb.frame(1/30)})()"%tt)
            pg.wait_for_timeout(450)
        info=pg.evaluate("({ui:GXU.state(),dir:GX.dir.state(),alt:Math.round(GX.alt()),hud:(document.getElementById('gxhud')||{}).innerText||''})")
        out='%s_%s.png'%(pre,t.replace('.','p'));pg.screenshot(path=out);print(t,json.dumps(info).replace('\\n',' '),out)
    for e in errs[:5]:print(e)
    b.close()
