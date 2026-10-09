"""debug: why a point-blank shot misses the bot"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = 8876; SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w')
srv = v7.serve(SITE, PORT)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=v7.FLAGS)
        ctx = v7.context(b, PORT, gfx='low')
        errs = []
        A = v7.floor(ctx, PORT, errs=errs)
        A.evaluate(v7.FREEZE); step = lambda n: A.evaluate(v7.STEP, n)
        A.evaluate("(()=>{const R=VO3.dbg().arena;R.mapI=0;R.startBot()})()"); step(75)
        A.evaluate("""(()=>{const R=VO3.dbg().arena,M=R.match,me=M.me,b=M.bot;me.p.set(-15.6,0,0);me.v.set(0,0,0);b.P.p.set(-6.6,0,0);b.P.v.set(0,0,0);b.cfg=Object.assign({},b.cfg,{react:99});b.prot=0;b.path=null})()""")
        step(2)
        print(A.evaluate("""(()=>{const R=VO3.dbg().arena,M=R.match,me=M.me,b=M.bot,o=M.opp;const e=R.eye(new me.p.constructor());const dx=b.P.p.x-e.x,dz=b.P.p.z-e.z,dy=b.P.p.y+1.5-e.y;me.yaw=Math.atan2(dx,dz);me.pitch=Math.atan2(dy,Math.hypot(dx,dz));me.next=0;me.burst=0;
          const before={hp:b.hp,al:b.al,prot:b.prot,o:[o.p.x,o.p.y,o.p.z,o.al,o.prot],bot:[b.P.p.x,b.P.p.y,b.P.p.z],me:[me.p.x,me.p.y,me.p.z,me.g,me.al,me.rl,me.ammo],sp:R.spread(),ph:M.ph};
          R.fire(VO3.dbg().t);return {before,after:{hp:b.hp,hits:M.stats.hits,shots:M.stats.shots,se:me.se}}})()"""))
        print('errs', errs[:5], A.evaluate("VO3.dbg().errs||0"))
        b.close()
finally:
    srv.terminate()
