"""quick check: walk from the Sky Park plaza over the skybridge onto the pad and the apron"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = int(os.environ.get('PORT', 8871)); SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w')
srv = v7.serve(SITE, PORT)
ok, res = v7.checker()
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=v7.FLAGS)
        ctx = v7.context(b, PORT, gfx='low')
        errs = []
        A = v7.floor(ctx, PORT, errs=errs)
        A.evaluate(v7.FREEZE); step = v7.STEP
        wk = "(()=>{const a=VO3.dbg().meAv,w=a.wk;return w?{x:+w.x.toFixed(2),y:+w.y.toFixed(2),z:+w.z.toFixed(2),f:w.f}:{}})()"
        put = "([x,z,h])=>{const W=VO3.dbg().walk,w=W.me.wk;w.x=x;w.z=z;w.h=h;W.yaw=h;W.snap=1}"
        A.evaluate("(()=>{const O=VO3.dbg();O.cardA=O.meAv;O.cardAct('walk')})()"); A.evaluate(step, 3)
        A.evaluate("(()=>{const W=VO3.dbg().walk;W.me.wk.x=8;W.me.wk.z=-6.4;W.ride('r')})()"); A.evaluate(step, 16)
        for (x0, z0, n, need, what) in [(11, 7, 70, 17, 'plaza onto the skybridge'), (27, 7, 50, 31, 'skybridge onto the pad'), (40, 10, 50, 40, 'pad north onto the apron')]:
            h = 1.5708 if what != 'pad north onto the apron' else 0
            A.evaluate(put, [x0, z0, h]); A.keyboard.down('w'); A.evaluate(step, n); A.keyboard.up('w'); A.evaluate(step, 3)
            w = A.evaluate(wk); good = (w.get('x', 0) > need) if h else (w.get('z', 0) > 15)
            ok(w.get('f') == 'r' and good and abs(w.get('y', 0) - 6) < .3, 'walk ' + what, w)
        print('walk HUD says', A.evaluate("document.querySelector('.vo3wkf')&&document.querySelector('.vo3wkf').textContent"), flush=True)
        ok(not errs, 'no errors', errs[:4])
        print('RESULT', res, flush=True)
        b.close()
finally:
    srv.terminate()
