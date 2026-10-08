import sys,time,os,json
from playwright.sync_api import sync_playwright
F='file:///mnt/user-data/outputs/owq-command-station-v2.html'
W=int(os.environ.get('W',1280));H=int(os.environ.get('H',720))
mode=os.environ.get('MODE','normal')
args=['--no-sandbox','--autoplay-policy=no-user-gesture-required','--disable-background-networking','--no-first-run']
if mode=='nogl': args+=['--disable-webgl','--disable-webgl2']
else: args+=['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
steps=sys.argv[1:]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=args)
    ctx=b.new_context(viewport={'width':W,'height':H},reduced_motion='reduce' if mode=='rm' else 'no-preference')
    pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)[:300]))
    pg.on('console',lambda m:errs.append(m.type+': '+m.text[:200]) if m.type in ('error',) and '404' not in m.text and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
    pg.goto(F,wait_until='commit',timeout=120000)
    def st():
        return pg.evaluate("()=>({st:GXU.state(),on:GXU.on(),gl:GXU.U.gl,fail:GXU.U.fail,sel:GXU.U.sel,fps:Math.round(GXU.U.fps),scale:GX.S.scale,dir:GX.dir.state(),ready:GX.S.ready,err:String(GX.S.err||'')})")
    for s in steps:
        if s.startswith('wait:'):
            pg.wait_for_timeout(int(float(s[5:])*1000))
        elif s.startswith('state'):
            print('STATE',st())
        elif s.startswith('shot:'):
            pg.screenshot(path=s[5:]);print('shot',s[5:])
        elif s.startswith('js:'):
            print('JS',pg.evaluate(s[3:]))
        elif s.startswith('key:'):
            pg.keyboard.press(s[4:]);
        elif s.startswith('type:'):
            pg.keyboard.type(s[5:])
        elif s.startswith('click:'):
            pg.click(s[6:])
        elif s.startswith('waitst:'):
            want=s[7:];t0=time.time()
            while time.time()-t0<60:
                try:
                    if st()['st']==want: break
                except Exception as e: pass
                pg.wait_for_timeout(300)
            print('reached',want,round(time.time()-t0,1),st())
    print('ERRS',errs[:8])
    b.close()
