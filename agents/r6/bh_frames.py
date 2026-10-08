"""Frames of the access-granted transit: land in a city, launch, rise to space, the black hole eats the Earth.
   usage: bh_frames.py out_prefix City   env W,H,PORTAL,MOBILE"""
import os,sys,json
from playwright.sync_api import sync_playwright
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
pre=sys.argv[1];city=sys.argv[2] if len(sys.argv)>2 else 'New York'
W=int(os.environ.get('W',1280));H=int(os.environ.get('H',720));MOB=os.environ.get('MOBILE')=='1'
F=os.path.abspath(os.environ.get('PORTAL',SP+'/agents/r6/out/portal.html'))
TA=[float(x) for x in os.environ.get('TA','0.4,1.0,1.6').split(',')]
TB=[float(x) for x in os.environ.get('TB','0,0.5,1.0,1.5,2.0,2.5,3.0,3.4,3.7,3.9').split(',')]
args=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-background-networking','--no-first-run']
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=args)
    kw=dict(viewport={'width':W,'height':H})
    if MOB:kw.update(is_mobile=True,has_touch=True,device_scale_factor=1)
    ctx=b.new_context(**kw);ctx.add_init_script("try{localStorage.setItem('owq_gq','auto')}catch(e){}")
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)[:300]));pg.on('console',lambda m:errs.append(m.text[:300]) if m.type=='error' else None)
    pg.goto('file://'+F,wait_until='commit',timeout=120000)
    pg.wait_for_function("typeof GXU!=='undefined'&&GXU.state()==='menu'",timeout=150000);pg.wait_for_timeout(400)
    ix=pg.evaluate("GXC.findIndex(c=>c[0]===%s)"%json.dumps(city))
    pg.evaluate("(()=>{const r=Math.random;Math.random=()=>(%d+.5)/GXC.length;try{pickProfile(GXU.U.names[0])}finally{Math.random=r}})()"%ix)
    pg.evaluate("GX.stop();GX.S.scale=1;GX.resize()")
    pg.evaluate("(()=>{let n=0;while(GXU.state()!=='land'&&n++<900){GX.step(1/30)}GX.draw()})()")
    pg.wait_for_function("GXU.state()==='land'",timeout=60000);pg.wait_for_timeout(600)
    pg.evaluate("(()=>{const l=document.getElementById('login');if(l)l.style.visibility='hidden';document.body.classList.add('hush');GX.draw()})()")
    pg.screenshot(path=pre+'_a0.png')
    pg.evaluate("GX.stop();GX.dir.launch()")
    t=0.0
    for i,ta in enumerate(TA):
        n=int(round((ta-t)*30));t=ta
        pg.evaluate("(n)=>{for(let i=0;i<n;i++)GX.step(1/30);GX.draw()}",n)
        pg.screenshot(path=pre+'_a%d.png'%(i+1));print('ascent',ta,pg.evaluate("({alt:+GX.alt().toFixed(0),dv:+GX.C.dv.toFixed(3),st:GX.dir.state()})"),flush=True)
    r=pg.evaluate("(()=>{let n=0;while(!GX.S.BH.on&&n++<300){GX.step(1/30);if(GX.C.dv<=0&&GX.S.tw.length===0){GX.draw();GX.step(1/30);GX.draw()}}return {n,on:GX.S.BH.on,fail:GX.S.BH.fail,err:GX.S.bhErr||null,st:GX.dir.state()}})()")
    print('bh start',r,flush=True)
    t=0.0
    for i,tb in enumerate(TB):
        n=int(round((tb-t)*30));t=tb
        pg.evaluate("(n)=>{for(let i=0;i<n;i++)GX.step(1/30);GX.draw()}",n)
        pg.screenshot(path=pre+'_b%02d.png'%i);print('bh',tb,pg.evaluate("({F:+(GX.S.BH.F||0).toFixed(3),S:+(GX.S.BH.S||0).toFixed(3),fl:+GX.C.flash.toFixed(2),st:GX.dir.state()})"),flush=True)
    for e in errs[:6]:print(e)
    b.close()
