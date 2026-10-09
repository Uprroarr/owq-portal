"""v107 smoke: the floor loads with the new graphics engine, no shader errors, and pictures of the Sky Deck circuit."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = 8871; SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w'); GFX = os.environ.get('GFX') or None
SHOTS = os.environ.get('SHOTS', 'plaza,start,stand,tunnel,pylon,jump,aerial').split(',')
srv = v7.serve(SITE, PORT)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=v7.FLAGS)
        ctx = v7.context(b, PORT, gfx=GFX)
        errs = []
        A = v7.floor(ctx, PORT, errs=errs, logcon=True)
        print(A.evaluate("(()=>{const O=VO3.dbg();return {info:VO3.info(),track:!!O.track,derby:!!O.derby,range:!!O.range,fly:!!O.fly,pfx:!!O.pfx,errs:O.errs||0,len:O.track&&Math.round(O.track.sky.len)}})()"), flush=True)
        A.evaluate("(()=>{const O=VO3.dbg();O.opts.auto=false;O.dir.focus=null})()")
        v7.expand(A)
        # positions along the circuit (computed in the page)
        P = A.evaluate("""(()=>{const S=VO3.dbg().track.sky,n=S.n,at=s=>{const i=Math.round((((s%S.len)+S.len)%S.len)/S.len*n)%n,a=S.S[i];return {x:a.p.x,y:a.p.y,z:a.p.z,tx:a.t.x,tz:a.t.z,nx:a.nx,nz:a.nz}};
          return {start:at(S.start-38),stand:at(S.start-50),tun:at(S.tunnel[0]-30),py:S.pylons[0],pyS:at(S.pylons[0].i*S.len/n-60),jump:at(S.gaps[0].s0-40),side:S.side}})()""")
        def along(q, back, up, ahead=30, lat=0):
            return ([q['x'] - q['tx'] * back + q['nx'] * lat, q['y'] + up, q['z'] - q['tz'] * back + q['nz'] * lat], [q['x'] + q['tx'] * ahead, q['y'] + 1.5, q['z'] + q['tz'] * ahead])
        views = {
            'plaza': ([-12.5, 2.4, 9], [-40, 1.2, 0], 62),
            'start': along(P['start'], 0, 3.2, 40) + (60,),
            'stand': (lambda q: ([q['x'] + q['nx'] * P['side'] * 3, q['y'] + 2.5, q['z'] + q['nz'] * P['side'] * 3], [q['x'] - q['nx'] * P['side'] * 16 + q['tx'] * 18, q['y'] + 4, q['z'] - q['nz'] * P['side'] * 16 + q['tz'] * 18], 60))(P['stand']),
            'tunnel': along(P['tun'], 0, 3, 40) + (62,),
            'pylon': along(P['pyS'], 0, 4, 60) + (64,),
            'jump': along(P['jump'], 0, 3, 40) + (62,),
            'aerial': ([-380, 520, 560], [-380, 0, 80], 55),
        }
        for k in SHOTS:
            if k not in views: continue
            Pc, Tc, F = views[k]
            v7.cam(A, Pc, Tc, F)
            v7.shot(A, 'v107_' + k, 2500)
            print('shot', k, A.evaluate("(()=>{const O=VO3.dbg();return {zone:O.wld.zone,calls:O.r.info.render.calls,tris:O.r.info.render.triangles,ms:VO3.info().ms}})()"), flush=True)
        print('errs', errs[:12], 'frame errs', A.evaluate("VO3.dbg().errs||0"), flush=True)
        b.close()
finally:
    srv.terminate()
