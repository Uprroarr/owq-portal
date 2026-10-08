import os,sys,json
from playwright.sync_api import sync_playwright
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
args=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
W=int(os.environ.get('W',960));H=int(os.environ.get('H',540))
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=args)
    for name in sys.argv[2:]:
        F=SP+'/agents/r6/out/%s.html'%name
        for city in sys.argv[1].split(','):
            ctx=b.new_context(viewport={'width':W,'height':H});ctx.add_init_script("try{localStorage.setItem('owq_gq','%s')}catch(e){}"%os.environ.get('Q','auto'))
            pg=ctx.new_page();pg.goto('file://'+F,wait_until='commit');pg.wait_for_function("typeof GXU!=='undefined'&&GXU.state()==='menu'",timeout=150000)
            ix=pg.evaluate("GXC.findIndex(c=>c[0]===%s)"%json.dumps(city))
            pg.evaluate("(()=>{const r=Math.random;Math.random=()=>(%d+.5)/GXC.length;try{pickProfile(GXU.U.names[0])}finally{Math.random=r}})()"%ix)
            pg.evaluate("GX.stop();GX.S.scale=1;GX.resize();(()=>{let n=0;while(GXU.state()!=='land'&&n++<900){GX.step(1/30)}})()")
            pg.wait_for_function("GXU.state()==='land'",timeout=60000)
            r=pg.evaluate("""(()=>{const gl=GX.S.gl,px=new Uint8Array(4);const f=()=>{GX.draw();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px)};f();f();const t=[];for(let i=0;i<6;i++){const a=performance.now();GX.step(1/30);f();t.push(performance.now()-a)}t.sort((a,b)=>a-b);return {med:+t[3].toFixed(0),min:+t[0].toFixed(0),n:(GX.S.bN|0)+(GX.S.bNC|0),q:GX.S.q,w:GX.S.w,h:GX.S.h}})()""")
            print(name,city,r,flush=True);ctx.close()
    b.close()
