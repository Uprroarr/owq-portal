"""pictures of the 1v1 shooter in first person (time frozen and stepped): the rifle at the hip, a shot (flash, tracer,
brass), a spray (bullet holes), aiming down the red dot, a reload, a headshot kill (the bot falls), the death camera,
and the rooftop and office maps"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = int(os.environ.get('PORT', 8878)); SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w'); GFX = os.environ.get('GFX') or 'medium'
ONLY = os.environ.get('ONLY', 'warehouse,rooftop,office').split(',')
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
        freeze_bot = """(()=>{const R=VO3.dbg().arena;R.botTick=function(bb,dt){if(!bb.al){bb.deadT-=dt}this.place(bb.av,bb.P.p,bb.yaw,0,0,0,dt,this.match.M,!bb.al)}})()"""
        stand = """(([mx,mz,bx,bz])=>{const R=VO3.dbg().arena,M=R.match,me=M.me,b=M.bot;me.p.set(mx,0,mz);me.v.set(0,0,0);b.P.p.set(bx,0,bz);b.al=1;b.hp=100;b.prot=0;
          const dx=bx-mx,dz=bz-mz;b.yaw=Math.atan2(-dx,-dz);me.yaw=Math.atan2(dx,dz);me.pitch=-.02;me.prot=0;M.opp.prot=0})"""
        aim = """(dy=>{const R=VO3.dbg().arena,M=R.match,me=M.me,b=M.bot,e=R.eye(new me.p.constructor());const dx=b.P.p.x-e.x,dz=b.P.p.z-e.z,yy=b.P.p.y+dy-e.y;me.yaw=Math.atan2(dx,dz);me.pitch=Math.atan2(yy,Math.hypot(dx,dz))})"""
        for mi, name in enumerate(['warehouse', 'rooftop', 'office']):
            if name not in ONLY: continue
            A.evaluate("(mi=>{const R=VO3.dbg().arena;if(R.match)R.leave(true);R.mapI=mi;R.diff='normal';R.startBot()})", mi); step(4)
            A.evaluate("VO3.dbg().arena.match.warm=.2"); step(8)
            A.evaluate(freeze_bot)
            if name == 'warehouse':
                A.evaluate(stand, [-14, -1, -7, .6]); step(6); v7.shot(A, 'sh_hip', 300)
                A.evaluate("(()=>{const R=VO3.dbg().arena;R.match.me.next=0;R.match.me.pitch+=.05;R.fire(VO3.dbg().t)})()"); step(1); v7.shot(A, 'sh_fire', 0)
                # a spray at the wall: five shots, the brass flying, then the holes
                A.evaluate("(()=>{const R=VO3.dbg().arena,me=R.match.me;me.yaw+=.5;me.pitch=.05;R.firing=true})()"); step(5); v7.shot(A, 'sh_spray', 0)
                A.evaluate("VO3.dbg().arena.firing=false"); step(14); v7.shot(A, 'sh_holes', 200)
                # aim down the sight at the bot
                A.evaluate(aim, 1.2); A.evaluate("VO3.dbg().arena.ads=1"); step(10); v7.shot(A, 'sh_ads', 300)
                A.evaluate("VO3.dbg().arena.ads=0"); step(8)
                # reload half way: the magazine is out
                A.evaluate("(()=>{const R=VO3.dbg().arena;R.match.me.ammo=11;R.reload()})()"); step(13); v7.shot(A, 'sh_reload', 300); step(40)
                # a headshot kill: the bot falls over
                A.evaluate(aim, 1.5); A.evaluate("(()=>{const R=VO3.dbg().arena;R.noSpread=1;R.match.me.burst=0;R.match.me.next=0;R.fire(VO3.dbg().t)})()"); step(7); v7.shot(A, 'sh_kill', 0)
                step(30); v7.shot(A, 'sh_down', 300)
                # killed: the death camera
                A.evaluate("(()=>{const R=VO3.dbg().arena,M=R.match;M.bot.al=1;M.bot.hp=100;M.bot.deadT=0;R.hurt(100,true,{x:M.bot.P.p.x,z:M.bot.P.p.z},'Training Bot')})()"); step(14); v7.shot(A, 'sh_dead', 0)
                print('warehouse', A.evaluate("(()=>{const M=VO3.dbg().arena.match;return {ammo:M.me.ammo,res:M.me.res,score:M.score,holes:(VO3.dbg().arena.holes||[]).filter(h=>h.life>0).length,shells:(VO3.dbg().arena.shells||[]).length}})()"), flush=True)
            else:
                sp = A.evaluate("VO3.dbg().arena.match.M.spawns.A[2]")
                A.evaluate(stand, [sp[0] + 3, sp[1], sp[0] + 10, sp[1] + 1.5]); step(6)
                A.evaluate("(()=>{const R=VO3.dbg().arena;R.match.me.next=0;R.match.me.pitch+=.04;R.fire(VO3.dbg().t)})()"); step(1); v7.shot(A, 'sh_' + name, 0)
                print(name, 'ok', flush=True)
        print('errs', errs[:6], 'frame errs', A.evaluate("VO3.dbg().errs||0"), flush=True)
        b.close()
finally:
    srv.terminate()
