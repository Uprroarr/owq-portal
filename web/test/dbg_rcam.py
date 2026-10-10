"""pictures of the range lane camera: tries a few over-the-shoulder framings (time frozen and stepped)"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = int(os.environ.get('PORT', 8877)); SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w'); GFX = os.environ.get('GFX') or 'medium'
# [px, py, pz, tx, ty] offsets from the lane spot (x, z) and the floor height
CAMS = {'now': None, 'a': [-.55, 1.85, -1.9, -.15, 1.35], 'b': [-.7, 1.75, -2.3, -.2, 1.4], 'c': [-.45, 2.0, -1.7, -.1, 1.3]}
srv = v7.serve(SITE, PORT)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=v7.FLAGS)
        ctx = v7.context(b, PORT, gfx=GFX)
        errs = []
        A = v7.floor(ctx, PORT, errs=errs)
        A.evaluate("voApi.setLook('W8F6J7')"); A.wait_for_timeout(2500)
        A.evaluate("(()=>{const O=VO3.dbg();O.opts.auto=false;O.dir.focus=null})()")
        v7.expand(A)
        A.evaluate(v7.FREEZE); step = lambda n: A.evaluate(v7.STEP, n)
        A.evaluate("(()=>{const O=VO3.dbg();if(!O.walk.me){O.cardA=O.meAv;O.cardAct('walk')}})()"); step(3)
        A.evaluate("(f=>{const W=VO3.dbg().walk;W.me.wk.x=8;W.me.wk.z=-6.4;W.ride(f)})", 'g'); A.wait_for_timeout(1200); step(6)
        A.evaluate("([x,z,h])=>{const W=VO3.dbg().walk,w=W.me.wk;w.x=x;w.z=z;w.h=h;W.yaw=h;W.snap=1}", [-2.6, -3.7, 0]); step(3)
        A.keyboard.press('e'); step(90)
        A.evaluate("(()=>{const R=VO3.dbg().range;R._cam0=R.cam})()")
        for k, c in CAMS.items():
            if c is None:
                A.evaluate("(()=>{const R=VO3.dbg().range;R.cam=R._cam0})()")
            else:
                A.evaluate("""(c=>{const R=VO3.dbg().range;R.cam=function(P,T,F0){const L=this.lane;if(!L)return 0;const l=L.l;
                  P.set(l.x+c[0],R._y0+c[1],l.z+c[2]);T.set(l.x+c[3],R._y0+c[4],8);return Math.min(62,Math.max(40,F0*.95))}})""", c)
            if k != 'now':
                A.evaluate("(()=>{const R=VO3.dbg().range,O=VO3.dbg();R._y0=O.meAv.wk.y})()")
            step(30); v7.shot(A, 'rcam_' + k, 300)
            print('shot', k, flush=True)
        print('wk y', A.evaluate("VO3.dbg().meAv.wk.y"), 'errs', errs[:6], flush=True)
        b.close()
finally:
    srv.terminate()
