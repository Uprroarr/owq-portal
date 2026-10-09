"""debug: ride to the roof, stand at the Skyport stand, press E, and print what the walker, the prompt and the plane do"""
import sys, os, json, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = int(os.environ.get('PORT', 8870)); SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w'); GFX = os.environ.get('GFX') or 'low'
srv = v7.serve(SITE, PORT)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=v7.FLAGS)
        ctx = v7.context(b, PORT, gfx=GFX)
        errs = []
        A = v7.floor(ctx, PORT, errs=errs, logcon=True)
        A.evaluate("voApi.setLook('W8F6J7')"); A.wait_for_timeout(2500)
        st = "(()=>{const O=VO3.dbg(),a=O.meAv,w=a.wk,p=O.walk.prompt();return {t:+O.t.toFixed(2),mode:a.mode,w:w&&{x:+w.x.toFixed(2),z:+w.z.toFixed(2),y:+w.y.toFixed(2),f:w.f},pr:p&&p.k,fly:!!a.fly,F:a.look&&a.look.F,zone:O.wld.zone,lock:O.walk.lock,el:O.walk.elOpen}})()"
        A.evaluate("(()=>{const O=VO3.dbg();O.cardA=O.meAv;O.cardAct('walk')})()"); A.wait_for_timeout(1500); print('walk', A.evaluate(st), flush=True)
        A.evaluate("(()=>{const W=VO3.dbg().walk;W.me.wk.x=8;W.me.wk.z=-6.4;W.ride('r')})()")
        for k in range(4): A.wait_for_timeout(1000); print('ride', k, A.evaluate(st), flush=True)
        A.evaluate("(()=>{const W=VO3.dbg().walk,w=W.me.wk;w.x=97;w.z=33;w.h=Math.PI/2;W.yaw=Math.PI/2;W.snap=1})()")
        for k in range(4): A.wait_for_timeout(1000); print('stand', k, A.evaluate(st), flush=True)
        A.keyboard.press('e')
        for k in range(4): A.wait_for_timeout(1000); print('after E', k, A.evaluate(st), flush=True)
        print('errs', errs[:6], flush=True)
        b.close()
finally:
    srv.terminate()
