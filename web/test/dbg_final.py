"""final look at the v107 places in play (HUDs included): driving the Sky Deck, the Skyport stand, take-off and a
practice landing, batting in the derby, the range and the laser tag terminal, and laser tag against the bot.
Time is frozen and stepped (every picture gets real frames however slow the renderer is)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = int(os.environ.get('PORT', 8872)); SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w'); GFX = os.environ.get('GFX') or 'medium'
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
        A.evaluate(v7.FREEZE); step = lambda n: A.evaluate(v7.STEP, n)
        walk = "(()=>{const O=VO3.dbg();if(!O.walk.me){O.cardA=O.meAv;O.cardAct('walk')}})()"
        put = "([x,z,h])=>{const W=VO3.dbg().walk,w=W.me.wk;w.x=x;w.z=z;w.h=h;W.yaw=h;W.snap=1}"
        def ride(f):
            A.evaluate("(f=>{const W=VO3.dbg().walk;W.me.wk.x=8;W.me.wk.z=-6.4;W.ride(f)})", f); A.wait_for_timeout(1200); step(6)
        if 'drive' in ONLY:
            A.evaluate("voDrive()"); step(4)
            A.evaluate("""(()=>{const D=VO3.dbg().drive,d=D.me.drv,S=VO3.dbg().track.sky,i=Math.round((S.start+140)/S.len*S.n)%S.n,a=S.S[i];d.k=1;d.x=a.p.x;d.z=a.p.z;d.y=a.p.y;d.h=Math.atan2(-a.t.z,a.t.x);d.vx=a.t.x*24;d.vz=a.t.z*24;d.v=24;d.w=0;d.hint=i;d.air=0;d.s=a.s})()""")
            A.keyboard.down('w'); step(24); v7.shot(A, 'fin_drive', 300); A.keyboard.up('w')
            A.keyboard.press('e'); step(6)
            print('drive done', flush=True)
        if 'fly' in ONLY:
            A.evaluate(walk); step(3); ride('r')
            A.evaluate(put, [97, 33, 1.5708]); step(8); v7.shot(A, 'fin_stand', 300)
            A.keyboard.press('e'); step(30); v7.shot(A, 'fin_takeoff', 300)
            A.keyboard.press('r'); A.wait_for_timeout(1000); step(30); v7.shot(A, 'fin_final', 300)
            A.evaluate("(()=>{const f=VO3.dbg().meAv.fly;if(!f)return;f.x=628+330;f.z=-14;f.y=6+330*Math.tan(3.5*Math.PI/180);f.v=34;f.yaw=-Math.PI/2;f.pitch=-.06;f.roll=0;f.gear=1})()"); step(14); v7.shot(A, 'fin_short', 300)
            A.keyboard.press('e'); A.wait_for_timeout(1200); step(6)
            print('fly done', A.evaluate("(()=>{const a=VO3.dbg().meAv;return {fly:!!a.fly,mode:a.mode}})()"), flush=True)
        if 'derby' in ONLY:
            A.evaluate(walk); step(3)
            A.evaluate("(()=>{const w=VO3.dbg().meAv.wk;return w&&w.f})()") == 'r' or ride('r')
            A.evaluate("VO3.dbg().derby.now=()=>1.7e12")
            A.evaluate(put, [-3, -13.6, 3.14159]); step(3); A.keyboard.press('e'); step(66)
            for k in range(40):
                step(1)
                if A.evaluate("(()=>{const T=VO3.dbg().derby.turn;return !!(T&&T.ball&&!T.ball.hit)})()"): break
            step(4); v7.shot(A, 'fin_derby', 300)
            A.evaluate("VO3.dbg().derby.finish()"); step(4)
            print('derby done', flush=True)
        if 'range' in ONLY:
            A.evaluate(walk); step(3); ride('g')
            A.evaluate(put, [-6.6, -4.2, -2.4]); step(8); v7.shot(A, 'fin_range_term', 300)
            A.evaluate(put, [-2.6, -3.7, 0]); step(3); A.keyboard.press('e'); step(50); v7.shot(A, 'fin_range', 300)
            A.keyboard.press('Escape'); step(4)
            print('range done', flush=True)
        if 'tag' in ONLY:
            A.evaluate("(()=>{const R=VO3.dbg().arena;R.mapI=0;R.diff='normal';R.startBot()})()"); step(4)
            A.evaluate("VO3.dbg().arena.match.warm=.2"); step(8)
            A.evaluate("""(()=>{const R=VO3.dbg().arena,M=R.match,me=M.me,b=M.bot;R.botTick=function(bb,dt){this.place(bb.av,bb.P.p,bb.yaw,0,0,0,dt,this.match.M)};
              me.p.set(-12,0,-1);me.v.set(0,0,0);b.P.p.set(-6,0,.2);b.yaw=-Math.PI/2;me.yaw=Math.PI/2;me.pitch=-.02})()"""); step(6)
            v7.shot(A, 'fin_tag', 300)
            A.evaluate("(()=>{const R=VO3.dbg().arena;R.match.me.next=0;R.fire(VO3.dbg().t)})()"); step(1); v7.shot(A, 'fin_tag_fire', 0)
            print('tag done', flush=True)
        print('errs', errs[:6], 'frame errs', A.evaluate("VO3.dbg().errs||0"), flush=True)
        b.close()
finally:
    srv.terminate()
