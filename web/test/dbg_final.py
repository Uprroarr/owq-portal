"""final look at the v107 places in play (HUDs included): driving the Sky Deck, a practice landing, batting in the
derby, a range lane, and laser tag against the bot"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = int(os.environ.get('PORT', 8872)); SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w'); GFX = os.environ.get('GFX') or 'high'
ONLY = os.environ.get('ONLY', 'drive,fly,derby,range,tag').split(',')
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
        if 'drive' in ONLY:
            A.evaluate("voDrive()"); A.wait_for_timeout(1500)
            A.evaluate("""(()=>{const D=VO3.dbg().drive,d=D.me.drv,S=VO3.dbg().track.sky,i=Math.round((S.start+140)/S.len*S.n)%S.n,a=S.S[i];d.k=1;d.x=a.p.x;d.z=a.p.z;d.y=a.p.y;d.h=Math.atan2(-a.t.z,a.t.x);d.vx=a.t.x*24;d.vz=a.t.z*24;d.v=24;d.w=0;d.hint=i;d.air=0;d.s=a.s;D.snap=1})()""")
            A.keyboard.down('w'); A.wait_for_timeout(2500); v7.shot(A, 'fin_drive', 200); A.keyboard.up('w')
            A.keyboard.press('e'); A.wait_for_timeout(1500)
            print('drive done', flush=True)
        if 'fly' in ONLY:
            A.evaluate("(()=>{const O=VO3.dbg();if(!O.walk.me){O.cardA=O.meAv;O.cardAct('walk')}})()"); A.wait_for_timeout(800)
            A.evaluate("(()=>{const W=VO3.dbg().walk;W.me.wk.x=8;W.me.wk.z=-6.4;W.ride('r')})()"); A.wait_for_timeout(2500)
            A.evaluate("(()=>{const W=VO3.dbg().walk,w=W.me.wk;w.x=97;w.z=33;w.h=Math.PI/2;W.yaw=Math.PI/2;W.snap=1})()"); A.wait_for_timeout(1500)
            v7.shot(A, 'fin_stand', 300)
            A.keyboard.press('e'); A.wait_for_timeout(2500); v7.shot(A, 'fin_takeoff', 200)
            A.keyboard.press('r'); A.wait_for_timeout(5000); v7.shot(A, 'fin_final', 200)
            A.evaluate("(()=>{const F=VO3.dbg().fly,f=VO3.dbg().meAv.fly;f.x=640+260;f.y=6+260*Math.tan(3.5*Math.PI/180);f.v=34})()"); A.wait_for_timeout(2500); v7.shot(A, 'fin_short', 200)
            A.keyboard.press('e'); A.wait_for_timeout(2500)
            print('fly done', flush=True)
        if 'derby' in ONLY:
            A.evaluate("(()=>{const O=VO3.dbg();if(!O.walk.me){O.cardA=O.meAv;O.cardAct('walk')}})()"); A.wait_for_timeout(800)
            A.evaluate("(()=>{const W=VO3.dbg().walk;if(W.me.wk.f!=='r'){W.me.wk.x=8;W.me.wk.z=-6.4;W.ride('r')}})()"); A.wait_for_timeout(2500)
            A.evaluate("(()=>{const W=VO3.dbg().walk,w=W.me.wk;w.x=-3;w.z=-13.6;w.h=Math.PI;W.yaw=Math.PI;W.snap=1})()"); A.wait_for_timeout(1000)
            A.keyboard.press('e'); A.wait_for_timeout(6000); v7.shot(A, 'fin_derby', 200)
            A.evaluate("VO3.dbg().derby.finish()"); A.wait_for_timeout(1500)
            print('derby done', flush=True)
        if 'range' in ONLY:
            A.evaluate("(()=>{const O=VO3.dbg();if(!O.walk.me){O.cardA=O.meAv;O.cardAct('walk')}})()"); A.wait_for_timeout(800)
            A.evaluate("(()=>{const W=VO3.dbg().walk;W.me.wk.x=8;W.me.wk.z=-6.4;W.ride('g')})()"); A.wait_for_timeout(2500)
            A.evaluate("(()=>{const W=VO3.dbg().walk,w=W.me.wk;w.x=-6.6;w.z=-4.2;w.h=-2.4;W.yaw=-2.4;W.snap=1})()"); A.wait_for_timeout(1500); v7.shot(A, 'fin_range_term', 200)
            A.evaluate("(()=>{const W=VO3.dbg().walk,w=W.me.wk;w.x=-2.6;w.z=-3.7;w.h=0;W.yaw=0;W.snap=1})()"); A.wait_for_timeout(800)
            A.keyboard.press('e'); A.wait_for_timeout(5000); v7.shot(A, 'fin_range', 200)
            A.keyboard.press('Escape'); A.wait_for_timeout(1000)
            print('range done', flush=True)
        if 'tag' in ONLY:
            A.evaluate("(()=>{const R=VO3.dbg().arena;R.mapI=0;R.diff='normal';R.startBot()})()")
            A.wait_for_function("(()=>{const M=VO3.dbg().arena.match;return M&&M.ph==='play'})()", timeout=240000)
            A.evaluate("""(()=>{const R=VO3.dbg().arena,M=R.match,me=M.me,b=M.bot;R.botTick=function(bb,dt){this.place(bb.av,bb.P.p,bb.yaw,0,0,0,dt,this.match.M)};
              me.p.set(-12,0,-1);me.v.set(0,0,0);b.P.p.set(-6,0,.2);b.yaw=-Math.PI/2;me.yaw=Math.PI/2;me.pitch=-.02})()""")
            v7.shot(A, 'fin_tag', 2500)
            A.evaluate("(()=>{const R=VO3.dbg().arena;R.fire(VO3.dbg().t)})()"); A.wait_for_timeout(60); v7.shot(A, 'fin_tag_fire', 0)
            print('tag done', flush=True)
        print('errs', errs[:6], 'frame errs', A.evaluate("VO3.dbg().errs||0"), flush=True)
        b.close()
finally:
    srv.terminate()
