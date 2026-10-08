import os,sys,json,time
from playwright.sync_api import sync_playwright
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
F=SP+'/agents/r6/out/portal.html'
args=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']
res=[]
def ok(c,m):res.append(c);print(('PASS ' if c else 'FAIL ')+m,flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=args)
    for key in ['a','Enter']:
        ctx=b.new_context(viewport={'width':800,'height':450});pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
        pg.goto('file://'+F,wait_until='commit');pg.wait_for_function("typeof GXU!=='undefined'&&GXU.state()==='menu'",timeout=150000)
        pg.evaluate("pickProfile(GXU.U.names[1])");pg.wait_for_function("GX.dir.state()==='dive'",timeout=60000);pg.keyboard.press('Enter')
        pg.wait_for_function("GXU.state()==='land'",timeout=120000);pg.wait_for_timeout(400)
        pg.evaluate("document.getElementById('lgi').value=(PWD[LG]||'x');doLogin()")
        pg.wait_for_function("GX.S.BH.on===1",timeout=60000)
        pg.evaluate("window.__h={t0:GX.time(),fl:null};const iv=setInterval(()=>{try{if(GX.dir.state()==='flash'&&__h.fl===null)__h.fl=GX.time();}catch(e){clearInterval(iv)}},20)")
        pg.wait_for_timeout(700);pg.keyboard.press(key);t0=time.time()
        pg.wait_for_function("ONLINE===1",timeout=120000)
        h=pg.evaluate("__h");dt=(h['fl'] or 99)-h['t0'];print(key,'engine seconds from BH start to flash: %.2f'%dt,'wall %.1f'%(time.time()-t0))
        if key=='a':ok(dt>2.5,'another key does not skip the transit (%.2fs)'%dt)
        else:ok(dt<2.0,'Enter skips the rest of the transit (%.2fs)'%dt)
        ok(not errs,'no page errors '+str(errs[:2]));ctx.close()
    b.close()
print('RESULT',sum(res),'/',len(res))
