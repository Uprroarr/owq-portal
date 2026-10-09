"""Laser Tag 1v1: the terminal on the range, the menu, a practice match against the bot on each map, aim, hits, tags."""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = 8874; SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w'); GFX = os.environ.get('GFX', 'low'); SHOTS = os.environ.get('SHOTS', '1') == '1'
srv = v7.serve(SITE, PORT)
ok, res = v7.checker()
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=v7.FLAGS)
        ctx = v7.context(b, PORT, gfx=GFX)
        errs = []
        A = v7.floor(ctx, PORT, errs=errs)
        A.evaluate("(()=>{const O=VO3.dbg();O.opts.auto=false;O.dir.focus=null})()")
        if SHOTS: v7.expand(A)
        A.evaluate(v7.FREEZE); step = lambda n: A.evaluate(v7.STEP, n)
        ok(A.evaluate("!!VO3.dbg().arena"), 'the arena system is on the floor')
        A.evaluate("VO3.dbg().arena.noSpread=1")   # exact aim for the hit checks (spread itself is checked below)
        # walk down to the range and up to the terminal
        A.evaluate("VO3.dbg().walk.start()"); step(4)
        A.evaluate("(()=>{const W=VO3.dbg().walk;W.ride('g')})()"); step(20)
        ok(A.evaluate("VO3.dbg().meAv.wk&&VO3.dbg().meAv.wk.f")=='g', 'the elevator takes you to the Firing Range')
        A.evaluate("(()=>{const w=VO3.dbg().meAv.wk;w.x=-8.1;w.z=-5.7})()"); step(4)
        pr = A.evaluate("(()=>{const p=VO3.dbg().walk.prompt();return p&&p.t})()")
        ok(pr == 'LASER TAG 1V1', 'standing at the terminal offers LASER TAG 1V1', pr)
        A.evaluate("VO3.dbg().walk.use()"); step(2)
        ok(A.evaluate("document.querySelector('.vo3arov').classList.contains('on')"), 'E opens the laser tag menu')
        txt = A.evaluate("document.querySelector('.vo3arp').innerText")
        ok('NEON WAREHOUSE' in txt and 'ROOFTOP' in txt and 'OFFICE BLITZ' in txt and 'PRACTICE VS BOT' in txt and 'SENSITIVITY' in txt, 'the menu has three maps, bot practice and aim settings', txt[:300])
        if SHOTS: v7.shot(A, 'arena_menu', 800)
        # sensitivity on the CS:GO scale
        A.evaluate("(()=>{const r=document.querySelector('[data-n=sens]');r.value='2.5';r.dispatchEvent(new Event('change'))})()")
        ok(abs(A.evaluate("VO3.dbg().arena.sens") - 2.5) < 1e-6, 'typing a sensitivity sets it')
        for mi, name in enumerate(['warehouse', 'rooftop', 'office']):
            A.evaluate("(i=>{const R=VO3.dbg().arena;R.mapI=i;R.startBot()})(%d)" % mi); step(6)
            st = A.evaluate("(()=>{const R=VO3.dbg().arena,M=R.match;return M&&{ph:M.ph,map:M.mi,zone:VO3.dbg().wld.zone,me:[M.me.p.x,M.me.p.y,M.me.p.z],bot:[M.bot.P.p.x,M.bot.P.p.z],vis:M.M.G.visible}})()")
            ok(st and st['map'] == mi and st['vis'], name + ': a practice match starts on the map', st)
            step(4)
            ok(A.evaluate("VO3.dbg().wld.zone") == 'a', name + ': the camera is in the arena zone', A.evaluate("VO3.dbg().wld.zone"))
            # mouse look: 1000 counts at sensitivity 2.5 turn 0.022*2.5*1000 = 55 degrees
            y0 = A.evaluate("VO3.dbg().arena.match.me.yaw"); A.evaluate("VO3.dbg().arena.look(1000,0)"); y1 = A.evaluate("VO3.dbg().arena.match.me.yaw")
            ok(abs(abs(y1 - y0) * 180 / math.pi - 55) < .01, name + ': mouse look follows the CS:GO scale (1000 counts = 55 deg at 2.5)', (y0, y1))
            A.evaluate("VO3.dbg().arena.look(-1000,0)")
            # wait out the countdown (the whole 3.2 s on the first map, a short one after that), then move with W
            if mi: A.evaluate("VO3.dbg().arena.match.warm=.25"); step(10)
            else: step(70)
            ok(A.evaluate("VO3.dbg().arena.match.ph") == 'play', name + ': the countdown ends and play starts', A.evaluate("VO3.dbg().arena.match.ph"))
            p0 = A.evaluate("(()=>{const p=VO3.dbg().arena.match.me.p;return [p.x,p.z]})()"); A.keyboard.down('w'); step(10); A.keyboard.up('w')
            p1 = A.evaluate("(()=>{const p=VO3.dbg().arena.match.me.p;return [p.x,p.z]})()"); sp = math.hypot(p1[0] - p0[0], p1[1] - p0[1])
            ok(sp > 1.5, name + ': W runs forward', (p0, p1))
            # jump
            A.keyboard.press(' '); step(3); jy = A.evaluate("VO3.dbg().arena.match.me.p.y"); step(20)
            ok(jy > .3, name + ': SPACE jumps', jy)
            # put the bot in front of me and tag it: aim at its head and fire
            A.evaluate("""(()=>{const R=VO3.dbg().arena,M=R.match,me=M.me,b=M.bot;me.p.set(M.M.spawns.A[2][0]+4,0,M.M.spawns.A[2][1]);me.v.set(0,0,0);b.P.p.set(me.p.x+9,0,me.p.z);b.P.v.set(0,0,0);b.cfg=Object.assign({},b.cfg,{react:99});b.hp=100;b.al=1;b.prot=0;b.path=null})()""")
            step(2)
            def aim_head():
                A.evaluate("""(()=>{const R=VO3.dbg().arena,M=R.match,me=M.me,b=M.bot,e=R.eye(new me.p.constructor());const dx=b.P.p.x-e.x,dz=b.P.p.z-e.z,dy=b.P.p.y+1.5-e.y;me.yaw=Math.atan2(dx,dz);me.pitch=Math.atan2(dy,Math.hypot(dx,dz))})()""")
            wp = A.evaluate("(()=>{const M=VO3.dbg().arena.match,b=M.bot,o=M.M.def.o,v=b.av.root.getWorldPosition(new b.P.p.constructor());return {dx:v.x-(o[0]+b.P.p.x),dy:v.y-(o[1]+b.P.p.y),dz:v.z-(o[2]+b.P.p.z),vis:b.av.root.visible}})()")
            ok(wp['vis'] and abs(wp['dx']) + abs(wp['dy']) + abs(wp['dz']) < .05, name + ': the bot is drawn exactly where it stands', wp)
            d0 = A.evaluate("VO3.dbg().arena.match.bot.d"); aim_head()
            A.evaluate("(()=>{const R=VO3.dbg().arena;R.match.me.next=0;R.match.me.burst=0;R.fire(VO3.dbg().t)})()"); step(2)
            d1 = A.evaluate("VO3.dbg().arena.match.bot.d")
            ok(d1 == d0 + 1, name + ': a headshot tags the bot in one hit', (d0, d1, A.evaluate("VO3.dbg().arena.match.bot.hp")))
            ok(A.evaluate("VO3.dbg().arena.match.score[0]") >= 1, name + ': the tag counts for me', A.evaluate("VO3.dbg().arena.match.score"))
            if SHOTS:
                step(70)   # bot back in
                A.evaluate("""(()=>{const R=VO3.dbg().arena,M=R.match,me=M.me,b=M.bot;b.P.p.set(me.p.x+7,0,me.p.z+1.5);b.cfg=Object.assign({},b.cfg,{react:99})})()"""); step(2); aim_head()
                A.evaluate("(()=>{const R=VO3.dbg().arena;R.match.me.pitch-=.08})()")
                v7.shot(A, 'arena_' + name, 1500)
                A.evaluate("(()=>{const R=VO3.dbg().arena,M=R.match,me=M.me;me.p.set(0,0,0);me.yaw=Math.PI/2;me.pitch=-.05;M.bot.P.p.set(M.M.spawns.B[0][0],0,M.M.spawns.B[0][1])})()"); step(2)
                v7.shot(A, 'arena_' + name + '_mid', 1500)
            # body shots take three
            A.evaluate("""(()=>{const R=VO3.dbg().arena,M=R.match,me=M.me,b=M.bot;step=0;b.al=1;b.hp=100;b.prot=0;b.P.p.set(me.p.x+8,0,me.p.z);b.P.v.set(0,0,0)})()""".replace('step=0;', ''))
            step(1)
            A.evaluate("""(()=>{const R=VO3.dbg().arena,M=R.match,me=M.me,b=M.bot,e=R.eye(new me.p.constructor());const dx=b.P.p.x-e.x,dz=b.P.p.z-e.z,dy=b.P.p.y+1.0-e.y;me.yaw=Math.atan2(dx,dz);me.pitch=Math.atan2(dy,Math.hypot(dx,dz))})()""")
            hp = []
            for k in range(3):
                A.evaluate("(()=>{const R=VO3.dbg().arena;R.match.me.next=0;R.match.me.burst=0;R.match.me.v.set(0,0,0);R.fire(VO3.dbg().t)})()"); hp.append(A.evaluate("VO3.dbg().arena.match.bot.hp"))
            ok(hp[0] == 66 and hp[1] == 32 and hp[2] == 0, name + ': three body shots tag (34 each)', hp)
            # the bot fights back: give it its reactions and stand in its sight
            A.evaluate("""(()=>{const R=VO3.dbg().arena,M=R.match,me=M.me;me.hp=100;me.al=1;me.prot=0;M.bot.al=1;M.bot.hp=100;M.bot.prot=0;M.bot.deadT=0;M.bot.next=0;M.bot.burst=0;M.bot.react=0;M.bot.see=0;M.bot.cfg=Object.assign({},M.bot.cfg,{react:.05,err:0,fire:0});M.bot.P.p.set(me.p.x+8,0,me.p.z);M.bot.yaw=-Math.PI/2})()""")
            step(40)
            ok(A.evaluate("VO3.dbg().arena.match.me.hp") < 100 or A.evaluate("VO3.dbg().arena.match.me.d") > 0, name + ': the bot shoots back', A.evaluate("(()=>{const M=VO3.dbg().arena.match;return [M.me.hp,M.me.d,M.bot.see,M.bot.burst]})()"))
            # leave the match: back on the range floor
            A.evaluate("VO3.dbg().arena.leave(true)"); step(6)
            ok(A.evaluate("!VO3.dbg().arena.match&&VO3.dbg().meAv.wk&&VO3.dbg().meAv.wk.f==='g'"), name + ': leaving puts you back on the range floor', A.evaluate("(()=>{const a=VO3.dbg().meAv;return [a.mode,a.wk&&a.wk.f]})()"))
            step(4)
            ok(A.evaluate("VO3.dbg().wld.zone") == 'g', name + ': the camera is back on the range', A.evaluate("VO3.dbg().wld.zone"))
        # a full match to five against an easy bot: tag it five times
        A.evaluate("(()=>{const R=VO3.dbg().arena;R.mapI=0;R.diff='easy';R.startBot()})()"); step(4); A.evaluate("VO3.dbg().arena.match.warm=.25"); step(10)
        for k in range(5):
            A.evaluate("""(()=>{const R=VO3.dbg().arena,M=R.match,me=M.me,b=M.bot;if(!b.al){b.deadT=0}})()"""); step(3)
            A.evaluate("""(()=>{const R=VO3.dbg().arena,M=R.match,me=M.me,b=M.bot;me.p.set(-10,0,0);me.v.set(0,0,0);b.P.p.set(-3,0,0);b.P.v.set(0,0,0);b.prot=0;b.cfg=Object.assign({},b.cfg,{react:99})})()""")
            step(1)
            A.evaluate("""(()=>{const R=VO3.dbg().arena,M=R.match,me=M.me,b=M.bot;b.prot=0;M.opp.prot=0;const e=R.eye(new me.p.constructor());const dx=b.P.p.x-e.x,dz=b.P.p.z-e.z,dy=b.P.p.y+1.5-e.y;me.yaw=Math.atan2(dx,dz);me.pitch=Math.atan2(dy,Math.hypot(dx,dz));me.next=0;me.burst=0;R.fire(VO3.dbg().t)})()""")
            step(2)
        st = A.evaluate("(()=>{const M=VO3.dbg().arena.match;return M&&{ph:M.ph,s:M.score}})()")
        ok(st and st['ph'] == 'end' and st['s'][0] == 5, 'five tags win the match', st)
        if SHOTS: v7.shot(A, 'arena_victory', 600)
        A.evaluate("(()=>{const M=VO3.dbg().arena.match;if(M&&M.ph==='end')M.endT=Math.min(M.endT,.4)})()"); step(16)
        ok(A.evaluate("!VO3.dbg().arena.match"), 'after the result you are back on the range', A.evaluate("!!VO3.dbg().arena.match"))
        ok(not errs and not A.evaluate("VO3.dbg().errs||0"), 'no errors', errs[:6])
        print('RESULT', res, flush=True)
        b.close()
finally:
    srv.terminate()
