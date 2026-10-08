import sys,time,os,json
from playwright.sync_api import sync_playwright
F='file:///mnt/user-data/outputs/owq-command-station-v2.html'
args=['--no-sandbox','--autoplay-policy=no-user-gesture-required','--disable-background-networking','--no-first-run','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=args)
    ctx=b.new_context(viewport={'width':1280,'height':720})
    pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)[:300]))
    pg.on('console',lambda m:errs.append(m.type+': '+m.text[:200]) if m.type in ('error','warning') and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
    pg.goto(F,wait_until='commit',timeout=120000)
    def snap(tag):
        r=pg.evaluate("()=>{const S=GX.S;return {t:+S.t.toFixed(2),run:S.run,lost:S.lost,ready:S.ready,ok:S.ok,tw:S.tw.length,tl:S.tl.length,dir:GX.dir.state(),st:GXU.state(),raf:!!S.raf,still:S.still,manual:S.manual,hid:document.hidden,fps:Math.round(GXU.U.fps),err:String(S.err||'')}}")
        print(tag,r)
    pg.wait_for_timeout(14000);snap('s1 menu')
    pg.click('.gxo:nth-child(3)')
    t0=time.time()
    while time.time()-t0<40:
        if pg.evaluate('GXU.state()')=='land':break
        pg.wait_for_timeout(300)
    snap('s1 land')
    pg.wait_for_timeout(1500)
    pg.evaluate("()=>{const i=document.getElementById('lgi');i.value=(PWD[LG]||'x')}")
    pg.keyboard.press('Enter')
    pg.wait_for_timeout(7000)
    print('online',pg.evaluate('ONLINE'))
    pg.evaluate('lockView()')
    for k in range(8):
        pg.wait_for_timeout(2500);snap('s2 +%.1f'%(2.5*(k+1)))
    pg.keyboard.press('Enter')
    for k in range(6):
        pg.wait_for_timeout(2500);snap('s2 pick +%.1f'%(2.5*(k+1)))
    print('ERRS',errs[:8])
    b.close()
