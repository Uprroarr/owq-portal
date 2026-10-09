"""pictures of the Sky Park ballpark, the Skyport and the Sky Deck plaza (no frame errors allowed)"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = int(os.environ.get('PORT', 8877)); SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w'); GFX = os.environ.get('GFX') or None
Y = 6
VIEWS = {
    'park_batter': ([3.6, Y + 2.25, -19.6], [2.3, Y + 1.2, -36.6], 52),
    'park_wide': ([-26, Y + 9, -30], [8, Y + 1, -52], 64),
    'park_aerial': ([2, Y + 70, -115], [2, Y, -30], 55),
    'park_plaza': ([12, Y + 1.7, 6], [-2, Y + 2.5, -18], 66),
    'park_outfield': ([2, Y + 3, -64], [2, Y + 4, -24], 70),
    'port_bridge': ([20, Y + 1.8, 12], [100, Y + 6, 45], 62),
    'port_final': ([1900, Y + 46, -14], [700, Y, -14], 52),
    'port_takeoff': ([60, Y + 3.5, -14], [400, Y + 2, -14], 60),
    'port_hangar': ([102, Y + 3, 47], [102, Y + 4, 75], 70),
    'port_aerial': ([300, Y + 160, 160], [300, Y, -14], 55),
    'deck_plaza': ([-12.5, 2.4, 9], [-40, 2.4, 0], 62),
    'park_dugout': ([10.2, Y + 1.7, -38.4], [15.15, Y + 1.2, -33.47], 60),
    'port_door': ([102, Y + 3, 28], [102, Y + 5, 70], 66),
}
SHOTS = os.environ.get('SHOTS', ','.join(VIEWS)).split(',')
srv = v7.serve(SITE, PORT)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=v7.FLAGS)
        ctx = v7.context(b, PORT, gfx=GFX)
        errs = []
        A = v7.floor(ctx, PORT, errs=errs, logcon=True)
        A.evaluate("(()=>{const O=VO3.dbg();O.opts.auto=false;O.dir.focus=null})()")
        v7.expand(A)
        for k in SHOTS:
            if k not in VIEWS: continue
            Pc, Tc, F = VIEWS[k]
            v7.cam(A, Pc, Tc, F)
            v7.shot(A, 'v107_' + k, 3000)
            print('shot', k, A.evaluate("(()=>{const O=VO3.dbg();return {zone:O.wld.zone,errs:O.errs||0}})()"), flush=True)
        print('errs', errs[:12], 'frame errs', A.evaluate("VO3.dbg().errs||0"), flush=True)
        b.close()
finally:
    srv.terminate()
