"""Sky Park ballpark (Home Run Derby), the Skyport (walk the skybridge, take off, practice landing, crash rules) and the
Firing Range, single player. Physics runs in fast-forward for the flight (no frames needed), everything else is stepped."""
import sys, os, time, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = 8883; SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w'); OUT = v7.OUT
SHOTS = os.environ.get('SHOTS', '1') == '1'; GFX = os.environ.get('GFX', 'low')
srv = v7.serve(SITE, PORT)
ok, res = v7.checker()
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=v7.FLAGS)
        ctx = v7.context(b, PORT, gfx=GFX)
        errs = []
        A = v7.floor(ctx, PORT, errs=errs)
        A.evaluate("voApi.setLook('W8F6J7')"); A.wait_for_timeout(2500)
        A.evaluate("(()=>{const O=VO3.dbg();O.opts.auto=false;O.dir.focus=null})()")
        A.evaluate(v7.FREEZE)
        step = v7.STEP
        wk = "(()=>{const a=VO3.dbg().meAv,w=a.wk;return w?{x:+w.x.toFixed(2),y:+w.y.toFixed(2),z:+w.z.toFixed(2),f:w.f,mode:a.mode}:{mode:a.mode}})()"
        put = "([x,z,h])=>{const W=VO3.dbg().walk,w=W.me.wk;w.x=x;w.z=z;w.h=h;W.yaw=h;W.snap=1}"
        prompt = "(()=>{const p=VO3.dbg().walk.prompt();return p?{k:p.k,t:p.t}:null})()"
        look = A.evaluate("(()=>{const l=VO3.dbg().meAv.look;return {W:l.W,F:l.F,J:l.J}})()"); ok(look['F'] > 0 and look['J'] > 0, 'test look has a plane and a blaster', look)
        A.evaluate("(()=>{const O=VO3.dbg();O.cardA=O.meAv;O.cardAct('walk')})()"); A.evaluate(step, 3)
        # ---------------- up to the Sky Park
        A.evaluate("(()=>{const W=VO3.dbg().walk;W.me.wk.x=8;W.me.wk.z=-6.4;W.ride('r')})()"); A.evaluate(step, 16)
        r0 = A.evaluate(wk); ok(r0.get('f') == 'r', 'elevator to the Sky Park', r0); RY = r0.get('y', 0)
        # the START button behind home plate
        # the derby gives up a stalled turn after 150 s of wall-clock time; this slow software renderer takes minutes per
        # batch of frames, so hold the derby's clock still for the test
        A.evaluate("VO3.dbg().derby.now=()=>1.7e12")
        A.evaluate(put, [-3, -13.6, 3.14159]); A.evaluate(step, 3)
        pp = A.evaluate(prompt); ok(pp and 'DERBY' in pp['t'], 'by the backstop the prompt offers the Home Run Derby', pp)
        if SHOTS: v7.shot(A, 'park_button', 300, floor=False)
        A.keyboard.press('e'); A.evaluate(step, 40)
        ok(A.evaluate("!!VO3.dbg().derby.turn"), 'pressing START begins my turn at the plate', A.evaluate("VO3.dbg().derby.my"))
        hr = A.evaluate("(()=>{const x=VC.room.peers().find(p=>p.peer===vcMe());return x&&x.presence.hr})()"); ok(hr and hr.get('st') == 'b', 'everyone sees I am batting (presence hr)', hr)
        hit = None
        for k in range(60):
            A.evaluate(step, 1)
            st = A.evaluate("(()=>{const D=VO3.dbg().derby,T=D.turn;return T&&T.ball&&!T.ball.hit?{t0:T.ball.t0,tt:T.ball.tt}:null})()")
            if st:
                A.evaluate("(()=>{const D=VO3.dbg().derby,T=D.turn,b=T.ball;T.sw=b.t0+b.tt-.14;VO3.dbg().meAv._sw=T.sw;D.contact(T,b)})()"); hit = True; break
        ok(hit, 'a pitch comes in')
        A.evaluate(step, 6)
        if SHOTS: v7.shot(A, 'park_swing', 300, floor=False)
        call = None
        for k in range(80):
            A.evaluate(step, 1); c = A.evaluate("(()=>{const T=VO3.dbg().derby.turn;return T&&T.ball&&T.ball.call||null})()")
            if c: call = c; break
        ok(call == 'HR', 'a perfectly timed swing is a HOME RUN', call)
        if SHOTS: A.evaluate(step, 8); v7.shot(A, 'park_hr', 300, floor=False)
        ok(A.evaluate("VO3.dbg().derby.cheer>0||!!(VO3.dbg().derby.fw&&VO3.dbg().derby.fw.length)"), 'the home run sets off the crowd and the fireworks', A.evaluate("[VO3.dbg().derby.cheer,(VO3.dbg().derby.fw||[]).length]"))
        n = A.evaluate("VO3.dbg().derby.turn&&VO3.dbg().derby.turn.n"); ok(n == 1, 'the home run counts', n)
        A.evaluate("VO3.dbg().derby.finish()"); A.evaluate(step, 4)
        ok(not A.evaluate("VO3.dbg().derby.turn") and A.evaluate("VO3.dbg().meAv.mode") == 'free', 'finishing gives you back control', A.evaluate(wk))
        top = A.evaluate("(()=>{try{return voApi.tops().derby||[]}catch(e){return 'x'}})()"); ok(top and top[0][1] >= 1, 'team best saved for the derby', top)
        # ---------------- over the skybridge to the Skyport
        A.evaluate(put, [11, 8, 1.5708]); A.evaluate(step, 2)
        A.keyboard.down('w'); A.evaluate(step, 60); A.keyboard.up('w'); A.evaluate(step, 3)
        b1 = A.evaluate(wk); ok(b1.get('f') == 'r' and b1.get('x', 0) > 18 and abs(b1.get('y', 0) - RY) < .3, 'W walks you off the plaza and out onto the skybridge', b1)
        A.evaluate(put, [60, 30, 1.5708]); A.keyboard.down('w'); A.evaluate(step, 30); A.keyboard.up('w'); A.evaluate(step, 3)
        b2 = A.evaluate(wk); ok(b2.get('f') == 'r' and b2.get('x', 0) > 63 and abs(b2.get('y', 0) - RY) < .3, 'the apron is solid ground too', b2)
        A.evaluate(put, [97, 33, 1.5708]); A.evaluate(step, 3)
        pp = A.evaluate(prompt); ok(pp and pp['k'] == 'fly', 'at the stand in front of the hangar the prompt says FLY MY PLANE', pp)
        ok(A.evaluate("!!VO3.dbg().fly.parked"), 'my plane waits on the stand', A.evaluate("VO3.dbg().fly.parkedId"))
        if SHOTS: v7.shot(A, 'port_stand', 300, floor=False)
        A.keyboard.press('e'); A.evaluate(step, 4); ok(A.evaluate("!!VO3.dbg().fly.me"), 'E climbs in')
        fp = "(()=>{const f=VO3.dbg().meAv.fly;return f?{x:+f.x.toFixed(1),y:+f.y.toFixed(2),z:+f.z.toFixed(1),v:+f.v.toFixed(1),p:+f.pitch.toFixed(3),vy:+f.vy.toFixed(2),gr:f.gr,gear:f.gear,done:f.done||0,cr:f.crashed||0}:null})()"
        f0 = A.evaluate(fp); ok(f0 and f0['gr'] == 1 and abs(f0['z'] + 14) < 1 and f0['x'] < 90, 'you start lined up on the west end of runway 09, wheels down', f0)
        ff = "n=>{const O=VO3.dbg(),F=O.fly,a=F.me;if(window.__ft==null)window.__ft=O.t;for(let i=0;i<n&&F.me&&a.fly&&!a.fly.crashed;i++){window.__ft+=1/30;F.mine(a,1/30,window.__ft)}return 1}"
        A.evaluate(ff, 75); f1 = A.evaluate(fp); ok(f1 and f1['gr'] == 1 and f1['v'] > 15, 'full throttle rolls you down the runway', f1)
        A.evaluate(ff, 300); f2 = A.evaluate(fp); ok(f2 and f2['gr'] == 0 and f2['y'] > RY + 15 and not f2['cr'], 'the assist rotates at take-off speed and climbs away', f2)
        ok(f2 and f2['gear'] == 0, 'the gear comes up on its own', f2)
        if SHOTS: A.evaluate(step, 2); v7.shot(A, 'fly_climb', 300, floor=False)
        A.keyboard.down('w'); A.evaluate(ff, 20); A.keyboard.up('w'); f3 = A.evaluate(fp); ok(f3 and f3['p'] > f2['p'] + .2, 'W pulls the nose up', [f2, f3])
        fl = A.evaluate("(()=>{const x=VC.room.peers().find(p=>p.peer===vcMe());return x&&x.presence.fl})()"); ok(fl and 'x' in fl and fl.get('gr') == 0, 'your plane goes out to everyone (presence fl)', fl)
        # through the first ring
        A.evaluate("(()=>{const F=VO3.dbg().fly,f=VO3.dbg().meAv.fly,r=F.rings[0].p,n=F.rings[1].p;const dx=n.x-r.x,dz=n.z-r.z;f.yaw=Math.atan2(dx,dz);f.pitch=0;f.roll=0;f.v=40;f.x=r.x-Math.sin(f.yaw)*20;f.z=r.z-Math.cos(f.yaw)*20;f.y=r.y})()"); A.evaluate(ff, 30)
        ok(A.evaluate("VO3.dbg().fly.ri") >= 1, 'flying through the blue ring starts the Ring Run', A.evaluate("VO3.dbg().fly.ri"))
        # ---------------- practice landing with the assist
        A.keyboard.press('r'); A.wait_for_timeout(900); A.evaluate(step, 2)
        f4 = A.evaluate(fp); ok(f4 and f4['x'] > 1800 and abs(f4['z'] + 14) < 1 and f4['gear'] == 1 and f4['gr'] == 0, 'R puts you on a final approach 1.3 km out, gear down', f4)
        A.evaluate(ff, 3); ok(A.evaluate("document.querySelector('.vo3flg').classList.contains('on')"), 'the landing guide shows on final', A.evaluate("document.querySelector('.vo3flg').innerText"))
        gtxt = A.evaluate("document.querySelector('.vo3flg').innerText"); ok('LINED UP' in gtxt and 'GLIDE PATH' in gtxt and ('TOUCHDOWN LIMITS' in gtxt or 'CRASH RULES' in gtxt), 'the guide says you are lined up, on the glide path, and lists the crash limits', gtxt)
        if A.evaluate("!!document.querySelector('.vo3flk [data-a=rules]')"):
            rb = "document.querySelector('.vo3flk [data-a=rules]')"
            A.evaluate(rb + ".click()"); r = A.evaluate("(()=>({t:%s.textContent,l:document.querySelector('.vo3flg .lim').textContent}))()" % rb)
            ok('STRICT' in r['t'] and '4.5 M/S' in r['l'], 'CRASH RULES switches to strict and the guide lists the stricter limits', r)
            A.evaluate(rb + ".click()"); r = A.evaluate("%s.textContent" % rb); ok('EASY' in r, 'then easy', r)
            A.evaluate(rb + ".click()"); r = A.evaluate("(()=>({t:%s.textContent,l:document.querySelector('.vo3flg .lim').textContent}))()" % rb)
            ok('NORMAL' in r['t'] and '7 M/S' in r['l'], 'and back to normal', r)
        if SHOTS: A.evaluate(step, 2); v7.shot(A, 'fly_final', 300, floor=False)
        landed = None
        for k in range(16):
            A.evaluate(ff, 150); s = A.evaluate(fp)
            if not s or s['cr'] or s['done']: landed = s; break
        big = A.evaluate("document.querySelector('.vo3flb').innerText")
        ok(landed and landed['done'] and not landed['cr'], 'the assisted landing touches down on the runway', [landed, big])
        ok('LANDING' in big and '/ 100' in big, 'the touchdown is graded', big)
        lt = A.evaluate("(()=>{try{return voApi.tops().landing||[]}catch(e){return 'x'}})()"); ok(lt and lt[0][1] >= 60, 'the landing score goes on the team board', lt)
        if SHOTS: A.evaluate(step, 2); v7.shot(A, 'fly_touchdown', 300, floor=False)
        for k in range(10):
            A.evaluate(ff, 150); s = A.evaluate(fp)
            if not s or s['v'] < .3: break
        ok(s and s['v'] < .3 and s['x'] > 52 and not s['cr'], 'the autobrake stops you on the runway', s)
        # ---------------- crash rules: a gear-up landing is a belly landing
        A.keyboard.press('r'); A.wait_for_timeout(900); A.evaluate(step, 2)
        A.keyboard.press('g'); g = A.evaluate(fp); ok(g and g['gear'] == 0, 'G raises the gear', g)
        cr = None
        for k in range(16):
            A.evaluate(ff, 150); s = A.evaluate(fp)
            if not s or s['cr']: cr = A.evaluate("document.querySelector('.vo3flb').innerText"); break
        ok(cr and 'BELLY' in cr, 'touching down with the gear up is a crash (belly landing)', [cr, s])
        A.wait_for_timeout(2800); A.evaluate(step, 6)
        bk = A.evaluate(wk); ok(not A.evaluate("!!VO3.dbg().fly.me") and bk.get('f') == 'r' and abs(bk.get('x', 0) - 96) < 2, 'after a crash you are back at the hangar on foot', bk)
        # ---------------- the Firing Range
        A.evaluate("(()=>{const W=VO3.dbg().walk;W.me.wk.x=8;W.me.wk.z=-6.4;W.ride('g')})()"); A.evaluate(step, 16); ok(A.evaluate(wk).get('f') == 'g', 'elevator down to the Firing Range')
        A.evaluate(put, [-7.4, -3.7, 0]); A.evaluate(step, 3)
        pp = A.evaluate(prompt); ok(pp and 'LANE 1' in pp['t'], 'at a lane the prompt says START SHOOTING', pp)
        A.keyboard.press('e'); A.evaluate(step, 70)
        ok(A.evaluate("!!VO3.dbg().range.lane"), 'E starts a round in the lane')
        nt = A.evaluate("VO3.dbg().range.targets.length"); ok(nt >= 1, 'targets pop up downrange', nt)
        sc0 = A.evaluate("VO3.dbg().range.lane.score")
        for k in range(6):
            A.evaluate("(()=>{const R=VO3.dbg().range,O=VO3.dbg(),t=R.targets.find(x=>!x.dead);if(!t)return;const v=t.m.position.clone().project(O.cam);R.mx=v.x*.5+.5;R.my=-v.y*.5+.5;R.lane.next=0;R.fire()})()"); A.evaluate(step, 8)
        sc1 = A.evaluate("VO3.dbg().range.lane.score"); ok(sc1 > sc0, 'hitting targets scores points', [sc0, sc1])
        if SHOTS: v7.shot(A, 'range_lane', 300, floor=False)
        rg = A.evaluate("(()=>{const x=VC.room.peers().find(p=>p.peer===vcMe());return x&&x.presence.rg})()"); ok(rg and rg.get('on') == 1, 'your lane and score go out to everyone (presence rg)', rg)
        A.keyboard.press('Escape'); A.evaluate(step, 4); ok(not A.evaluate("!!VO3.dbg().range.lane"), 'Esc leaves the lane')
        if SHOTS: A.evaluate(step, 4); v7.shot(A, 'range_room', 300, floor=False)
        ok(not errs and not A.evaluate("VO3.dbg().errs||0"), 'no page errors', errs[:6])
        print('RESULT', res, flush=True)
        b.close()
finally:
    srv.terminate()
