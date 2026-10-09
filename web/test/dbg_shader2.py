"""debug: show the road's track coordinates as colours (red = metres along / 10, green = lateral / 4)"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = 8873; SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w')
srv = v7.serve(SITE, PORT)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=v7.FLAGS)
        ctx = v7.context(b, PORT, gfx='low')
        errs = []
        A = v7.floor(ctx, PORT, errs=errs)
        v7.expand(A)
        A.evaluate("""(()=>{const O=VO3.dbg(),M=O.track.road,f=M.onBeforeCompile;M.onBeforeCompile=(s,r)=>{f(s,r);s.fragmentShader=s.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\\ngl_FragColor=vec4(fract(vTrk.x/10.),fract(abs(vTrk.y)/4.),step(abs(vTrk.y),.5),1.);')};M.customProgramCacheKey=()=>'dbgroad';M.needsUpdate=true})()""")
        v7.cam(A, [-48, 3, -20], [-48, 1, -60], 60)
        v7.shot(A, 'dbg_road_trk', 5000)
        print('errs', errs[:8])
        b.close()
finally:
    srv.terminate()
