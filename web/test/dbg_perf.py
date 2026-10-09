"""draw calls, triangles and shader programs per place (office, deck, ballpark, Skyport, approach, arena) at each quality level"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = int(os.environ.get('PORT', 8873)); SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w'); GFX = os.environ.get('GFX', 'high')
Y = 6
VIEWS = {'office': ([0, 3.2, 14], [0, 1, 0], 50), 'deck': ([-30, 3, 60], [-48, 1, 0], 62), 'park': ([-26, Y + 9, -30], [8, Y + 1, -52], 64),
         'skyport': ([20, Y + 1.8, 12], [100, Y + 6, 45], 62), 'approach': ([1900, Y + 46, -14], [700, Y, -14], 52), 'city': ([300, Y + 160, 160], [300, Y, -14], 55)}
srv = v7.serve(SITE, PORT)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=v7.FLAGS)
        ctx = v7.context(b, PORT, gfx=GFX)
        errs = []
        A = v7.floor(ctx, PORT, errs=errs)
        A.evaluate("(()=>{const O=VO3.dbg();O.opts.auto=false;O.dir.focus=null;O.r.info.autoReset=false})()")
        out = {}
        for k, (P, T, F) in VIEWS.items():
            v7.cam(A, P, T, F); A.wait_for_timeout(2500)
            out[k] = A.evaluate("""(()=>{const O=VO3.dbg(),i=O.r.info;i.reset();return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r({calls:i.render.calls,tris:i.render.triangles,progs:(i.programs||[]).length,geo:i.memory.geometries,tex:i.memory.textures,zone:O.wld.zone}))))})()""")
            print(k, json.dumps(out[k]), flush=True)
        A.evaluate("VO3.dbg().dbgCam=null")
        A.evaluate("(()=>{const R=VO3.dbg().arena;R.mapI=0;R.startBot()})()"); A.wait_for_timeout(6000)
        out['arena'] = A.evaluate("""(()=>{const O=VO3.dbg(),i=O.r.info;i.reset();return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r({calls:i.render.calls,tris:i.render.triangles,progs:(i.programs||[]).length,zone:O.wld.zone}))))})()""")
        print('arena', json.dumps(out['arena']), flush=True)
        print('errs', errs[:6], flush=True)
        b.close()
finally:
    srv.terminate()
