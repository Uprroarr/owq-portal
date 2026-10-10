"""Firing Range lanes in first person: E at a lane hides my avatar and brings my blaster up in front of the camera,
the blaster points at the crosshair, hits score, shots start at the blaster's muzzle, Esc puts everything back.
Time is frozen and stepped."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = int(os.environ.get('PORT', 8885)); SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w')
SHOTS = os.environ.get('SHOTS', '1') == '1'; GFX = os.environ.get('GFX', 'medium')
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
        if SHOTS: v7.expand(A)
        A.evaluate(v7.FREEZE); step = lambda n: A.evaluate(v7.STEP, n)
        wk = "(()=>{const a=VO3.dbg().meAv,w=a.wk;return w?{x:+w.x.toFixed(2),y:+w.y.toFixed(2),z:+w.z.toFixed(2),f:w.f,mode:a.mode}:{mode:a.mode}})()"
        put = "([x,z,h])=>{const W=VO3.dbg().walk,w=W.me.wk;w.x=x;w.z=z;w.h=h;W.yaw=h;W.snap=1}"
        prompt = "(()=>{const p=VO3.dbg().walk.prompt();return p?{k:p.k,t:p.t}:null})()"
        st = """(()=>{const O=VO3.dbg(),R=O.range,a=O.meAv,c=O.cam.position;return {lane:!!R.lane,vis:a.root.visible,vm:!!R.vm,onCam:!!(R.vm&&R.vm.parent===O.cam),
          cam:[+c.x.toFixed(2),+c.y.toFixed(2),+c.z.toFixed(2)],fov:+O.cam.fov.toFixed(1),wy:a.wk&&+a.wk.y.toFixed(2)}})()"""
        A.evaluate("(()=>{const O=VO3.dbg();O.cardA=O.meAv;O.cardAct('walk')})()"); step(3)
        A.evaluate("(()=>{const W=VO3.dbg().walk;W.me.wk.x=8;W.me.wk.z=-6.4;W.ride('g')})()"); step(16)
        ok(A.evaluate(wk).get('f') == 'g', 'elevator down to the Firing Range')
        A.evaluate(put, [-2.6, -3.7, 0]); step(3)
        pp = A.evaluate(prompt); ok(pp and 'LANE 2' in pp['t'], 'at a lane the prompt says START SHOOTING', pp)
        s0 = A.evaluate(st); ok(s0['vis'] and not s0['vm'], 'walking: my avatar is visible and no blaster on the camera', s0)
        A.keyboard.press('e'); step(70)
        s1 = A.evaluate(st)
        ok(s1['lane'], 'E starts a round in the lane', s1)
        ok(not s1['vis'], 'in the lane my avatar is hidden (first person)', s1)
        ok(s1['vm'] and s1['onCam'], 'my blaster is held in front of the camera', s1)
        ok(abs(s1['cam'][0] + 2.6) < .15 and abs(s1['cam'][1] - (s1['wy'] + 1.6)) < .15 and abs(s1['cam'][2] + 3.7) < .2, 'the camera sits at eye height on my spot', s1)
        ok(abs(s1['fov'] - 46) < 1, 'lane field of view', s1['fov'])
        # the blaster turns toward the crosshair
        q = "(()=>{const R=VO3.dbg().range,v=new R.vm.position.constructor(0,0,-1).applyQuaternion(R.vmH.quaternion);return [+v.x.toFixed(3),+v.y.toFixed(3)]})()"
        A.evaluate("(()=>{const R=VO3.dbg().range;R.mx=.25;R.my=.5})()"); step(2); dl = A.evaluate(q)
        A.evaluate("(()=>{const R=VO3.dbg().range;R.mx=.75;R.my=.5})()"); step(2); dr = A.evaluate(q)
        A.evaluate("(()=>{const R=VO3.dbg().range;R.mx=.5;R.my=.2})()"); step(2); du = A.evaluate(q)
        ok(dl[0] < -.1 and dr[0] > .1 and du[1] > .1, 'the blaster points where the crosshair is (left, right, up)', [dl, dr, du])
        nt = A.evaluate("VO3.dbg().range.targets.length"); ok(nt >= 1, 'targets pop up downrange', nt)
        sc0 = A.evaluate("VO3.dbg().range.lane.score"); far = []
        for k in range(6):
            d = A.evaluate("""(()=>{const R=VO3.dbg().range,O=VO3.dbg(),t=R.targets.find(x=>!x.dead);if(!t)return null;const v=t.m.position.clone().project(O.cam);R.mx=v.x*.5+.5;R.my=-v.y*.5+.5;R.lane.next=0;
              const n0=R.group.children.length;R.fire();const m=R.group.children.slice(n0)[0];if(!m)return -1;
              const p=m.isLine?new m.position.constructor().fromBufferAttribute(m.geometry.getAttribute('position'),0):m.position,mz=R.vmMuzzle(new m.position.constructor());return [+p.distanceTo(O.cam.position).toFixed(3),+p.distanceTo(mz).toFixed(3)]})()""")
            if d is not None: far.append(d)
            step(8)
        sc1 = A.evaluate("VO3.dbg().range.lane.score"); ok(sc1 > sc0, 'hitting targets scores points', [sc0, sc1])
        ok(far and all(isinstance(x, list) and x[0] < 1 and x[1] < .05 for x in far), 'shots leave from the blaster muzzle just in front of the camera', far)
        A.evaluate("(()=>{const R=VO3.dbg().range;R.mx=.56;R.my=.44;R.lane.next=0;R.fire()})()"); step(1)
        if SHOTS: v7.shot(A, 'range_fp', 300)
        rg = A.evaluate("(()=>{const x=VC.room.peers().find(p=>p.peer===vcMe());return x&&x.presence.rg})()"); ok(rg and rg.get('on') == 1, 'your lane and score go out to everyone (presence rg)', rg)
        A.keyboard.press('Escape'); step(6); s2 = A.evaluate(st)
        ok(not s2['lane'] and s2['vis'] and not s2['vm'], 'Esc leaves the lane: avatar back, blaster off the camera', s2)
        A.evaluate(put, [-7.4, -3.7, 0]); step(3); A.keyboard.press('e'); step(20)
        s3 = A.evaluate(st); ok(s3['lane'] and not s3['vis'] and s3['vm'], 'a second lane works the same', s3)
        A.evaluate("VO3.dbg().range.leave()"); step(4); s4 = A.evaluate(st); ok(not s4['lane'] and s4['vis'] and not s4['vm'], 'leaving the floor while in a lane puts everything back', s4)
        if SHOTS: v7.shot(A, 'range_after', 300)
        ok(not errs and not A.evaluate("VO3.dbg().errs||0"), 'no page errors', errs[:6])
        print('RESULT', res, flush=True)
        b.close()
finally:
    srv.terminate()
