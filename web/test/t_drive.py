"""Drive your car on the Sales Floor and out onto the 2.5 km Sky Deck circuit: barriers you glance off and bounce off,
car-to-car contact, a ragdoll when you hit someone on the deck (they fly, lie there, get up), slow cars blocked by
people, walkers blocked by parked cars, and a timed lap. Car physics runs in fast-forward (no frames needed); the
ragdoll is stepped frame by frame."""
import sys, os, time, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = 8857; SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w'); GFX = os.environ.get('GFX', 'low')
SHOTS = os.environ.get('SHOTS', '1') == '1'
srv = v7.serve(SITE, PORT)
ok, res = v7.checker()
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=v7.FLAGS)
        ctx = v7.context(b, PORT, gfx=GFX)
        errs = []
        A = v7.floor(ctx, PORT, errs=errs, demo=True)
        A.wait_for_function("VO3.targets().filter(x=>x.ok).length>=4", timeout=150000)
        A.evaluate("(()=>{const S=VO3.dbg().dm;S.talker=null;S.until=1e9;S.next=1e9;S.share=1e9})()")
        A.evaluate("(()=>{const O=VO3.dbg();O.opts.auto=false;O.dir.focus=null})()")
        step = v7.STEP
        ok(not A.evaluate("VO3.canDrive()"), 'no car yet -> no Drive button')
        A.evaluate("voApi.setLook('W8')"); A.wait_for_timeout(2500)
        ok(A.evaluate("VO3.canDrive()"), 'with a crate car, Drive my car is offered', A.evaluate("VO3.dbg().meAv.look.W"))
        A.evaluate("vcPaint()"); A.wait_for_timeout(400); ok(A.evaluate("[...document.querySelectorAll('.vob')].some(b=>/Drive my car/.test(b.title))"), 'the dock has a Drive my car button')
        A.evaluate("voDrive()"); A.wait_for_timeout(600)
        ok(A.evaluate("VO3.driving()") and A.evaluate("VO3.dbg().meAv.mode==='drive'"), 'you hop in your car')
        A.evaluate(v7.FREEZE)
        pos = "(()=>{const d=VO3.dbg().drive.me.drv;return {x:+d.x.toFixed(2),y:+d.y.toFixed(2),z:+d.z.toFixed(2),h:+d.h.toFixed(3),v:+d.v.toFixed(2),vx:+d.vx.toFixed(2),vz:+d.vz.toFixed(2),k:d.k,hl:d.hl,hw:d.hw}})()"
        # fast-forward the car: n physics frames of dt seconds, recording the most the car leaned into a barrier (|lat| of the centre)
        ff = """([n,dt])=>{const O=VO3.dbg(),D=O.drive,a=D.me;if(!a)return null;if(window.__ct==null)window.__ct=O.t;const S=O.track.sky;let mx=0,big='';
          for(let i=0;i<n&&D.me;i++){window.__ct+=dt;D.mine(a,a.drv,dt,window.__ct);const d=a.drv;if(d.k&&d.hint>=0){const c=S.S[d.hint],l=Math.abs((d.x-c.p.x)*c.nx+(d.z-c.p.z)*c.nz);if(l>mx)mx=l}if(D.bigE.classList.contains('on'))big=D.bigE.textContent}
          return {mx:+mx.toFixed(3),big}}"""
        # put my car on the deck at sample i, lat metres off the centre, heading ang radians off the road direction (toward +lat), speed v
        place = """([i,lat,ang,v])=>{const O=VO3.dbg(),D=O.drive,d=D.me.drv,S=O.track.sky,c=S.S[i];const tx=c.t.x*Math.cos(ang)+c.nx*Math.sin(ang),tz=c.t.z*Math.cos(ang)+c.nz*Math.sin(ang);
          d.k=1;d.x=c.p.x+c.nx*lat;d.z=c.p.z+c.nz*lat;d.y=c.p.y;d.h=Math.atan2(-tz,tx);d.vx=tx*v;d.vz=tz*v;d.v=v;d.w=0;d.st=0;d.hint=i;d.air=0;d.vy=0;d.s=c.s;d.boost=0;D.keys={};D.bigE.classList.remove('on');return 1}"""
        # where the car is: along the straight from sample i; lat, speeds and heading against the road right under it
        rel = "(i=>{const O=VO3.dbg(),d=O.drive.me.drv,S=O.track.sky,c0=S.S[i],c=d.hint>=0?S.S[d.hint]:c0;const sp=Math.hypot(d.vx,d.vz);return {along:+((d.x-c0.p.x)*c0.t.x+(d.z-c0.p.z)*c0.t.z).toFixed(2),lat:+((d.x-c.p.x)*c.nx+(d.z-c.p.z)*c.nz).toFixed(2),vt:+(d.vx*c.t.x+d.vz*c.t.z).toFixed(2),vn:+(d.vx*c.nx+d.vz*c.nz).toFixed(2),sp:+sp.toFixed(2),ha:+Math.acos(Math.max(-1,Math.min(1,(Math.cos(d.h)*c.t.x-Math.sin(d.h)*c.t.z)))).toFixed(3)}})"
        # ---------------- the Sales Floor
        p0 = A.evaluate(pos); A.keyboard.down('w'); A.evaluate(ff, [45, 1 / 30]); p1 = A.evaluate(pos)
        ok(abs(p1['x'] - p0['x']) + abs(p1['z'] - p0['z']) > 1, 'W drives forward', [p0, p1])
        A.keyboard.down('a'); A.evaluate(ff, [20, 1 / 30]); A.keyboard.up('a'); p2 = A.evaluate(pos); ok(abs(p2['h'] - p1['h']) > .3, 'A steers', [p1, p2])
        A.evaluate(ff, [60, 1 / 30]); A.keyboard.up('w'); p3 = A.evaluate(pos)
        ok(-9.95 < p3['x'] < 9.95 and -6.95 < p3['z'] < 11.45, 'the room walls keep the car inside', p3)
        pr = A.evaluate("(()=>{const x=VC.room.peers().find(p=>p.peer===vcMe());return x&&x.presence.dv})()"); ok(pr and 'x' in pr and pr.get('c') == 8, 'your position goes out to the floor (presence)', pr)
        # out the west door onto the Sky Deck
        A.evaluate("(()=>{const d=VO3.dbg().drive.me.drv;d.x=-7.6;d.z=3.6;d.h=Math.PI;d.vx=-3;d.vz=0;d.v=3;d.w=0})()"); A.keyboard.down('w'); A.evaluate(ff, [60, 1 / 30]); A.keyboard.up('w'); A.evaluate(ff, [15, 1 / 30])
        p4 = A.evaluate(pos); ok(p4['k'] == 1, 'driving through the west door takes you onto the Sky Deck', p4)
        if SHOTS: A.evaluate(step, 3); v7.shot(A, 'drive_plaza', 300, floor=False)
        # a straight stretch of the deck, clear of the plaza, the jumps and the boost pads
        I = A.evaluate("""(()=>{const S=VO3.dbg().track.sky,n=S.n;const ok=i=>{const c=S.S[i];for(let k=-10;k<=40;k++){const e=S.S[(i+k+n)%n];if(e.gap||e.ramp||e.tun||Math.abs(e.bank)>.035||c.t.x*e.t.x+c.t.z*e.t.z<.997||Math.abs(e.p.y-c.p.y)>.6)return false;
          if(e.p.x>-60&&e.p.x<-5&&e.p.z>-25&&e.p.z<35)return false;for(const b of S.boosts){const ds=Math.abs(e.s-b);if(ds<12||ds>S.len-12)return false}}return true};
          for(let i=0;i<n;i+=5)if(ok(i))return i;return -1})()""")
        ok(I >= 0, 'found a straight on the circuit for the tests', I)
        # glance: 12 degrees into the barrier at 63 mph
        A.evaluate(place, [I, 0, .21, 28]); g = A.evaluate(ff, [108, 1 / 60]); r1 = A.evaluate(rel, I)
        me = A.evaluate(pos)
        ok(g['mx'] < 6.95 - me['hw'] * .5, 'a glancing hit never puts the car through the barrier', [g, r1])
        ok(r1['sp'] > 17 and r1['vt'] > 17, 'a glance scrapes along the wall and keeps most of the speed', r1)
        ok(r1['ha'] < .14 and -2.5 < r1['vn'] < .5, 'the barrier turns the car back along the road', r1)
        # head-on: straight into the barrier at 34 mph
        A.evaluate(place, [I, 0, 1.5708, 15]); h = A.evaluate(ff, [36, 1 / 60]); r2 = A.evaluate(rel, I)
        ok(h['mx'] < 6.95, 'a head-on hit never puts the car through the barrier', [h, r2])
        ok(r2['vn'] < 0 and r2['sp'] < 6, 'a head-on hit bounces the car back off the wall', r2)
        ok('CRASH' in h['big'], 'a hard hit shows CRASH!', h)
        # car to car: a parked bot car on the straight; I drive into the back of it
        bot = A.evaluate("""(([i])=>{const O=VO3.dbg(),S=O.track.sky,c=S.S[(i+24)%S.n],b=[...O.av.values()].find(x=>x.bot&&!x.drv&&!x.wk);if(!b)return null;
          const d=O.drive.mount(b,8,c.p.x,c.p.z,Math.atan2(-c.t.z,c.t.x),1,c.p.y);d.hint=(i+24)%S.n;return {id:b.id,hl:d.hl}})""", [I])
        ok(bot, 'a bot car is parked on the deck', bot)
        A.evaluate(place, [I, 0, 0, 12]); A.keyboard.down('w'); c = A.evaluate(ff, [90, 1 / 60]); A.keyboard.up('w'); A.evaluate(ff, [30, 1 / 60])
        r3 = A.evaluate(rel, I); me = A.evaluate(pos)
        gap = 24 - r3['along']
        ok(gap > (me['hl'] + bot['hl']) * .9, 'my car stops at the back of the other car instead of driving through it', [gap, me['hl'], bot['hl'], r3])
        ok(r3['vt'] < 4, 'the hit takes my speed away', r3)
        if SHOTS: A.evaluate(step, 3); v7.shot(A, 'drive_bump', 300, floor=False)
        A.evaluate("(id=>{const O=VO3.dbg(),b=O.av.get(id);O.drive.end(b);b.sitNow&&b.sitNow()})", bot['id'])
        # slow car vs walker: a bot standing on the road blocks a car rolling at walking pace
        w1 = A.evaluate("""(([i])=>{const O=VO3.dbg(),S=O.track.sky,c=S.S[(i+30)%S.n],b=[...O.av.values()].find(x=>x.bot&&!x.drv&&!x.wk);if(!b)return null;
          O.walk.remote(b,{x:c.p.x,y:c.p.y,z:c.p.z,h:Math.atan2(c.t.x,c.t.z),f:'d',s:0});b.wk.hint=(i+30)%S.n;return b.id})""", [I])
        ok(w1, 'a bot walks out onto the deck', w1)
        A.evaluate(step, 2)
        A.evaluate(place, [I, 0, 0, 2.4]); A.evaluate(place.replace('d.x=c.p.x+c.nx*lat', 'd.x=c.p.x+c.nx*lat+c.t.x*25').replace('d.z=c.p.z+c.nz*lat', 'd.z=c.p.z+c.nz*lat+c.t.z*25'), [I, 0, 0, 2.4])
        A.evaluate(ff, [150, 1 / 60]); r4 = A.evaluate(rel, I); me = A.evaluate(pos)
        ok(not A.evaluate("(id=>!!VO3.dbg().av.get(id).rd)", w1) and 30 - r4['along'] >= me['hl'] + .25, 'rolling slowly into someone, they stop the car (no knock-down)', [r4, me['hl']])
        # fast car vs walker: a ragdoll
        A.evaluate(place.replace('d.x=c.p.x+c.nx*lat', 'd.x=c.p.x+c.nx*lat+c.t.x*16').replace('d.z=c.p.z+c.nz*lat', 'd.z=c.p.z+c.nz*lat+c.t.z*16'), [I, 0, 0, 15])
        hitT = fly = lie = None; top = 0; up = None
        for k in range(200):
            A.evaluate(step, 1)
            s = A.evaluate("(id=>{const O=VO3.dbg(),b=O.av.get(id),r=b.rd;return {rd:!!r,ph:r&&r.ph,y:+b.root.position.y.toFixed(2),wy:b.wk?+b.wk.y.toFixed(2):null,x:+b.root.position.x.toFixed(2),z:+b.root.position.z.toFixed(2)}})", w1)
            if s['rd'] and hitT is None: hitT = k
            if s['rd'] and s['ph'] == 'fly': top = max(top, s['y'] - (s['wy'] or 0))
            if s['rd'] and s['ph'] == 'lie': lie = k
            if SHOTS and hitT is not None and k == hitT + 4: v7.shot(A, 'drive_ragdoll', 200, floor=False)
            if hitT is not None and not s['rd']: up = s; break
            if hitT is None and k > 60: break
        ok(hitT is not None, 'hitting someone at speed knocks them flying (ragdoll)', hitT)
        ok(top > .6, 'they fly up off the road', top)
        ok(lie is not None, 'they land and lie there a moment', lie)
        ok(up is not None, 'then they get back up', up)
        if up:
            q = A.evaluate("(([x,z])=>{const S=VO3.dbg().track.sky;let b=0,bd=1e18;S.S.forEach((c,i)=>{const d=(c.p.x-x)**2+(c.p.z-z)**2;if(d<bd){bd=d;b=i}});const c=S.S[b];return {lat:+((x-c.p.x)*c.nx+(z-c.p.z)*c.nz).toFixed(2),y:+c.p.y.toFixed(2)}})", [up['x'], up['z']])
            ok(abs(q['lat']) < 7.7 and abs(up['y'] - q['y']) < .4, 'and they are standing on the deck where they landed', [up, q])
        kn = A.evaluate("(()=>{const x=VC.room.peers().find(p=>p.peer===vcMe());return x&&x.presence.dv&&x.presence.dv.kn})()"); ok(kn and kn.get('id') == w1, 'the hit goes out so everyone sees the same ragdoll', kn)
        # a lap: put the car just before the start line with every checkpoint done, then cross it
        A.evaluate("(()=>{const D=VO3.dbg().drive,d=D.me.drv,S=VO3.dbg().track.sky,i=Math.round((S.start-4)/S.len*S.n),a=S.S[i];d.x=a.p.x;d.z=a.p.z;d.y=a.p.y;d.h=Math.atan2(-a.t.z,a.t.x);d.vx=a.t.x*10;d.vz=a.t.z*10;d.v=10;d.w=0;d.hint=i;d.air=0;d.s=S.start-4;d.lap={t0:window.__ct-41.5,cp:S.cps.length,sp:[]}})()")
        A.keyboard.down('w'); A.evaluate(ff, [30, 1 / 30]); A.keyboard.up('w')
        bl = A.evaluate("VO3.dbg().drive.best"); ok(bl and bl > 20, 'crossing the start line after a full lap records the lap time', bl)
        ok(A.evaluate("VO3.dbg().drive.boardRows().length") >= 1, 'the lap board lists it')
        if SHOTS: A.evaluate(step, 3); v7.shot(A, 'drive_track', 300, floor=False)
        # get out on the deck and walk into a parked car: it blocks you
        I2 = I
        A.evaluate(place, [I2, -2.5, 0, 0]); A.evaluate(ff, [5, 1 / 30])
        A.keyboard.press('e'); A.evaluate(step, 4)
        ok(not A.evaluate("VO3.driving()") and A.evaluate("VO3.dbg().meAv.mode") == 'free', 'E gets you out and you walk on the deck', A.evaluate("VO3.dbg().meAv.mode"))
        cb = A.evaluate("""(([i])=>{const O=VO3.dbg(),S=O.track.sky,c=S.S[(i+8)%S.n],b=[...O.av.values()].find(x=>x.bot&&!x.drv&&!x.wk);if(!b)return null;const d=O.drive.mount(b,8,c.p.x+c.nx*2,c.p.z+c.nz*2,Math.atan2(-c.t.z,c.t.x),1,c.p.y);
          const W=O.walk,w=W.me.wk,e=S.S[(i+8)%S.n];w.x=e.p.x-e.nx*2;w.z=e.p.z-e.nz*2;w.y=e.p.y;w.hint=(i+8)%S.n;const h=Math.atan2(e.nx,e.nz);w.h=h;W.yaw=h;W.snap=1;return {id:b.id,hw:d.hw}})""", [I2])
        ok(cb, 'a parked car beside me', cb)
        A.keyboard.down('w'); inside = 0
        for k in range(30):
            A.evaluate(step, 1)
            l = A.evaluate("(([i])=>{const O=VO3.dbg(),S=O.track.sky,c=S.S[(i+8)%S.n],w=O.walk.me.wk;return (w.x-c.p.x)*c.nx+(w.z-c.p.z)*c.nz})", [I2])
            if l > 2 - cb['hw']: inside = max(inside, l)
        A.keyboard.up('w')
        ok(not inside, 'walking into a parked car, it blocks you', inside)
        A.evaluate("(id=>{const O=VO3.dbg(),b=O.av.get(id);O.drive.end(b)})", cb['id'])
        # back in through the door and home
        A.evaluate("(()=>{const W=VO3.dbg().walk,w=W.me.wk;w.f='d';w.x=-12.2;w.z=3.6;w.y=0;w.h=Math.PI/2;W.yaw=Math.PI/2;W.snap=1;w.hint=-1})()"); A.keyboard.down('w'); A.evaluate(step, 30); A.keyboard.up('w'); A.evaluate(step, 4)
        w = A.evaluate("(()=>{const w=VO3.dbg().meAv.wk;return w&&{f:w.f,x:+w.x.toFixed(2)}})()"); ok(w and w['f'] == 'o', 'walking back through the door brings you into the office', w)
        A.keyboard.press('q'); A.evaluate(step, 140); ok(A.evaluate("['seated','sitting','walk'].includes(VO3.dbg().meAv.mode)"), 'Q takes you back to your desk', A.evaluate("VO3.dbg().meAv.mode"))
        pr = A.evaluate("(()=>{const x=VC.room.peers().find(p=>p.peer===vcMe());return x&&x.presence.dv})()"); ok(not pr, 'your car leaves everyone else\'s floor', pr)
        ok(not errs and not A.evaluate("VO3.dbg().errs||0"), 'no errors', errs[:6])
        print('RESULT', res, flush=True)
        b.close()
finally:
    srv.terminate()
