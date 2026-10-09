"""pictures of the laser tag maps in first person (the rifle in view) and from above, against the bot"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = int(os.environ.get('PORT', 8876)); SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w'); GFX = os.environ.get('GFX') or 'high'
MAPS = [int(m) for m in os.environ.get('MAPS', '0,1,2').split(',')]
srv = v7.serve(SITE, PORT)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=v7.FLAGS)
        ctx = v7.context(b, PORT, gfx=GFX)
        errs = []
        A = v7.floor(ctx, PORT, errs=errs)
        A.evaluate("(()=>{const O=VO3.dbg();O.opts.auto=false;O.dir.focus=null})()")
        v7.expand(A)
        for mi in MAPS:
            A.evaluate("(mi=>{const R=VO3.dbg().arena;if(R.match)R.leave(true);R.mapI=mi;R.diff='normal';R.startBot()})", mi)
            A.wait_for_function("(()=>{const M=VO3.dbg().arena.match;return M&&M.ph==='play'})()", timeout=240000)
            name = ['warehouse', 'rooftop', 'office'][mi]
            # freeze the bot where it can be seen, look at it from a few metres
            A.evaluate("""(()=>{const R=VO3.dbg().arena,M=R.match,me=M.me,b=M.bot;R.noSpread=1;
              R.botTick=function(bb,dt){this.place(bb.av,bb.P.p,bb.yaw,0,0,0,dt,this.match.M)};
              const sp=M.M.spawns.A[2];me.p.set(sp[0]+3,0,sp[1]);me.v.set(0,0,0);b.P.p.set(sp[0]+8.5,0,sp[1]+1.2);b.yaw=-Math.PI/2;me.yaw=Math.PI/2;me.pitch=-.03})()""")
            v7.shot(A, 'ar2_' + name + '_fp', 2500)
            A.evaluate("(()=>{const M=VO3.dbg().arena.match,me=M.me;me.p.set(0,0,M.M.def.id==='office'?-11:-11.5);me.yaw=0;me.pitch=-.05})()")
            v7.shot(A, 'ar2_' + name + '_mid', 2200)
            o = A.evaluate("VO3.dbg().arena.match.M.def.o")
            v7.cam(A, [o[0] - 2, o[1] + 26, o[2] + 22], [o[0], o[1], o[2]], 55)
            v7.shot(A, 'ar2_' + name + '_top', 2200)
            A.evaluate("VO3.dbg().dbgCam=null")
            print('map', name, A.evaluate("(()=>{const O=VO3.dbg();return {zone:O.wld.zone,errs:O.errs||0}})()"), flush=True)
        print('errs', errs[:8], flush=True)
        b.close()
finally:
    srv.terminate()
