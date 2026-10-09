"""Laser Tag 1v1 between two people: Cole challenges John, John accepts from the popup, both land in the same arena,
Cole's headshot tags John on John's screen and scores for Cole on both, and John leaving gives Cole the win."""
import sys, os, time, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = 8885; SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w')
FLAGS = ['--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding'] + v7.FLAGS
srv = v7.serve(SITE, PORT)
ok, res = v7.checker()
def until(pg, js, sec=10):
    t = time.time()
    while time.time() - t < sec:
        try:
            if pg.evaluate(js): return True
        except Exception: pass
        pg.wait_for_timeout(300)
    return False
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=FLAGS)
        ctx = b.new_context(viewport={'width': 1000, 'height': 640}, permissions=['microphone', 'camera'])
        ctx.add_init_script("try{localStorage.setItem('owq_gq','still');localStorage.setItem('owq_vo',JSON.stringify({list:0,demo:0,ava:'',auto:1,sfx:0}));localStorage.setItem('owq_gfx','low')}catch(e){}")
        errs = {}
        def page(tag, user):
            pg = ctx.new_page(); errs[tag] = []; pg.on('pageerror', lambda e: errs[tag].append(str(e)[:200])); pg.add_init_script("window.__FAKE_SIGNIN=%s;" % json.dumps(user)); return pg
        K = ctx.new_page(); K.goto('http://127.0.0.1:%d/keep.html' % PORT); K.wait_for_function('window.__FAKE')
        URL = 'http://127.0.0.1:%d/index.html' % PORT
        A = page('A', v7.USERS[0])
        A.goto(URL); A.wait_for_function("window.__FAKE", timeout=20000); A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})"); A.evaluate("sessionStorage.clear()"); A.reload()
        A.wait_for_function("OWQC.phase==='out'", timeout=30000); A.click('#owqgi'); A.wait_for_function("OWQC.phase==='in'", timeout=30000); v7.lgx.login(A, 2); A.wait_for_timeout(800)
        B = page('B', {'uid': 'uJohn', 'email': 'john@example.com', 'displayName': 'John Montini'})
        B.goto(URL); B.wait_for_function("OWQC.phase==='out'", timeout=30000); B.click('#owqgi'); B.wait_for_function("OWQC.phase==='pending'", timeout=30000)
        B.click('#owqgr'); B.wait_for_function("OWQC.reqd===true", timeout=10000)
        A.evaluate("OWQC.team()"); A.wait_for_timeout(1200); A.select_option('#owqrn0', 'John Montini'); A.click("#md button:has-text('Approve')"); A.wait_for_timeout(1200); A.evaluate("OWQC.teamClose()")
        B.reload(); B.wait_for_function("OWQC.phase==='in'", timeout=30000); v7.lgx.login(B, 3); B.wait_for_timeout(1000)
        for P in (A, B): P.evaluate("openTab('Team Chat');CH.ch='__voice';go()")
        A.wait_for_timeout(2500)
        for P in (A, B): P.evaluate("vcJoin()")
        A.wait_for_timeout(2000)
        for P in (A, B): P.evaluate("try{VO3.dbg().fast=true}catch(e){}")
        # challenges expire after a minute of wall-clock time; the software renderer is slow, so hold both arena clocks still
        for P in (A, B): P.evaluate("(()=>{const w=setInterval(()=>{try{const R=VO3.dbg().arena;if(R){R.now=()=>1.7e12;clearInterval(w)}}catch(e){}},200)})()")
        ok(until(A, "(()=>{const m=VO3.dbg().meAv;return m&&m.mode==='seated'})()", 300) and until(B, "(()=>{const m=VO3.dbg().meAv;return m&&m.mode==='seated'})()", 300), 'setup: Cole and John are on the floor')
        # Cole challenges John on the Neon Warehouse
        jid = A.evaluate("(()=>{const a=[...VO3.dbg().av.values()].find(x=>x.nm==='John Montini');return a&&a.id})()")
        ok(jid, 'Cole sees John on the floor', jid)
        A.evaluate("(id=>{const R=VO3.dbg().arena;R.mapI=0;R.challenge(id)})(%s)" % json.dumps(jid))
        B.bring_to_front()
        ok(until(B, "document.querySelector('.vo3arinv').classList.contains('on')", 25), 'John gets a challenge popup', B.evaluate("document.querySelector('.vo3arinv').innerText"))
        ok('COLE' in B.evaluate("document.querySelector('.vo3arinv').innerText").upper() and 'NEON WAREHOUSE' in B.evaluate("document.querySelector('.vo3arinv').innerText"), 'the popup says who and which map', B.evaluate("document.querySelector('.vo3arinv').innerText"))
        B.click('.vo3arinv [data-a=y]')
        # both screens have to run their frames for the handshake (hidden pages pause), so take turns in front
        inA = inB = False; t0 = time.time(); js = "(()=>{const M=VO3.dbg().arena.match;return !!(M&&M.mi===0)})()"
        while time.time() - t0 < 60 and not (inA and inB):
            for P in (A, B): P.bring_to_front(); P.wait_for_timeout(900)
            inA = A.evaluate(js); inB = B.evaluate(js)
        ok(inA and inB, 'both are in the same match', [inA, inB])
        ok(A.evaluate("VO3.dbg().arena.match.host") and not B.evaluate("VO3.dbg().arena.match.host"), 'Cole hosts (west spawns), John is the guest (east spawns)')
        # wait out the countdown on both
        t0 = time.time()
        while time.time() - t0 < 40 and not (A.evaluate("VO3.dbg().arena.match.ph==='play'") and B.evaluate("VO3.dbg().arena.match.ph==='play'")):
            for P in (A, B): P.bring_to_front(); P.wait_for_timeout(900)
        ok(A.evaluate("VO3.dbg().arena.match.ph") == 'play' and B.evaluate("VO3.dbg().arena.match.ph") == 'play', 'the match starts on both screens')
        # stand them 7 m apart in the open middle lane and let the positions sync
        A.evaluate("(()=>{const M=VO3.dbg().arena.match;M.me.p.set(-10,0,0);M.me.v.set(0,0,0);M.me.prot=0})()")
        B.bring_to_front(); B.evaluate("(()=>{const M=VO3.dbg().arena.match;M.me.p.set(-3,0,0);M.me.v.set(0,0,0);M.me.prot=0})()"); B.wait_for_timeout(1500)
        A.bring_to_front(); synced = until(A, "(()=>{const o=VO3.dbg().arena.match.opp;return Math.abs(o.p.x+3)<.5&&Math.abs(o.p.z)<.5})()", 10)
        ok(synced, "Cole's screen has John where John is standing", A.evaluate("(()=>{const o=VO3.dbg().arena.match.opp;return [o.p.x,o.p.y,o.p.z]})()"))
        ok(A.evaluate("(()=>{const o=VO3.dbg().arena.match.opp.av;return !!(o&&o.root.visible&&o.ar)})()"), "John's avatar stands in Cole's arena")
        wp = A.evaluate("(()=>{const M=VO3.dbg().arena.match,o=M.opp,d=M.M.def.o,v=o.av.root.getWorldPosition(new o.p.constructor());return {dx:v.x-(d[0]+o.p.x),dy:v.y-(d[1]+o.p.y),dz:v.z-(d[2]+o.p.z)}})()")
        ok(abs(wp['dx']) + abs(wp['dy']) + abs(wp['dz']) < .3, "and he is drawn where he really is", wp)
        # Cole takes the headshot
        A.evaluate("""(()=>{const R=VO3.dbg().arena,M=R.match,me=M.me,o=M.opp;R.noSpread=1;o.prot=0;const e=R.eye(new me.p.constructor());const dx=o.p.x-e.x,dz=o.p.z-e.z,dy=o.p.y+1.5-e.y;me.yaw=Math.atan2(dx,dz);me.pitch=Math.atan2(dy,Math.hypot(dx,dz));me.next=0;R.fire(VO3.dbg().t)})()""")
        ok(A.evaluate("VO3.dbg().arena.match.stats.heads") == 1, "Cole's laser hits John's head")
        A.wait_for_timeout(600)
        B.bring_to_front(); tagged = until(B, "VO3.dbg().arena.match.me.d===1", 10)
        ok(tagged, 'John is tagged on his own screen', B.evaluate("(()=>{const m=VO3.dbg().arena.match.me;return [m.hp,m.d,m.al]})()"))
        ok(B.evaluate("VO3.dbg().arena.match.score[1]") == 1, "John's scoreboard shows Cole 1", B.evaluate("VO3.dbg().arena.match.score"))
        B.wait_for_timeout(600)
        A.bring_to_front(); scored = until(A, "VO3.dbg().arena.match.score[0]===1", 10)
        ok(scored, "Cole's scoreboard shows his point", A.evaluate("VO3.dbg().arena.match.score"))
        A.wait_for_timeout(400); A.screenshot(path=v7.OUT + '/tag2_cole.png', timeout=180000)
        # John quits: Cole wins
        B.bring_to_front(); B.evaluate("VO3.dbg().arena.leave(true)"); B.wait_for_timeout(800)
        ok(B.evaluate("!VO3.dbg().arena.match"), 'John is back on the range floor')
        A.bring_to_front(); won = until(A, "(()=>{const M=VO3.dbg().arena.match;return !M||M.ph==='end'})()", 15)
        ok(won, 'Cole sees John leave and the match ends', A.evaluate("(()=>{const M=VO3.dbg().arena.match;return M&&[M.ph,M.score]})()"))
        for t, e in errs.items(): ok(not e, 'no page errors on ' + t, e[:3])
        print('RESULT', res, flush=True)
        b.close()
finally:
    srv.terminate()
