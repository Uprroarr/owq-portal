"""behaviour tests for the Command Deck restyle.  usage: python3 behave.py <portal_all.html> [looks=abc]
For each look: entrance once, live re-renders (go() x6, refreshQuiet x3) never replay it, keep scroll, keep numbers, keep the
idle-animation phase; a real change tweens and celebrates once; reduced motion / low / still tiers; canvas stops off-tab and when hidden;
switcher (chips, ?dk=), fallback to the classic deck if the new renderer throws.  Exit 1 on any failure."""
import sys, os, json, time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import dkseed as K
from playwright.sync_api import sync_playwright
src = os.path.abspath(sys.argv[1]); looks = sys.argv[2] if len(sys.argv) > 2 else 'abc'
R = []


def ok(c, m):
    R.append((bool(c), m)); print(('PASS ' if c else 'FAIL ') + m, flush=True)


def ctx_for(p, look, extra='', w=1440, h=900):
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--no-sandbox', '--no-proxy-server', '--disable-webgl'])
    ctx = b.new_context(viewport={'width': w, 'height': h}, timezone_id='America/New_York'); ctx.set_default_timeout(120000)
    ctx.add_init_script(K.shift_js(*K.NOW)); ctx.add_init_script(K.seed_js(("localStorage.setItem('owq_dk','%s');" % look if look else '') + extra))
    return b, ctx


NUMS = "JSON.stringify([...document.querySelectorAll('#dkr [data-dkn]')].map(e=>[e.dataset.dkn,e.textContent]))"
ANG = """(()=>{const e=document.querySelector('#dkr .dk-l1,#dkr .dk-rd1,#dkr .dk-hs1');if(!e)return null;const t=getComputedStyle(e).transform;if(!t||t==='none')return null;const m=t.match(/matrix\\(([^)]+)\\)/);if(!m)return null;const v=m[1].split(',').map(Number);return[Math.atan2(v[1],v[0])*180/Math.PI,performance.now(),parseFloat(getComputedStyle(e).animationDuration)*1000,getComputedStyle(e).animationName]})()"""
PHASE = """(()=>{const g=()=>{const e=document.querySelector('#dkr .dk-l1,#dkr .dk-rd1');if(!e)return null;const t=getComputedStyle(e).transform,m=t&&t.match(/matrix\\(([^)]+)\\)/);if(!m)return null;const v=m[1].split(',').map(Number);return[Math.atan2(v[1],v[0])*180/Math.PI,performance.now(),parseFloat(getComputedStyle(e).animationDuration)*1000,getComputedStyle(e).animationDirection]};
const a=g();if(!a)return null;go();const b=g();if(!b)return null;const sgn=a[3]==='reverse'?-1:1,exp=sgn*360*(b[1]-a[1])/a[2];return Math.abs(((b[0]-a[0]-exp)%360+540)%360-180)})()"""
DKANIMS = "document.getAnimations().filter(a=>a.effect&&a.effect.target&&a.effect.target.closest&&a.effect.target.closest('#dkr')).length"
DKLOOPS = "document.getAnimations().filter(a=>{const t=a.effect&&a.effect.target;return t&&t.closest&&t.closest('#dkr')&&a.effect.getTiming().iterations===Infinity&&/(^| )dk-/.test(String(t.className&&t.className.baseVal!==undefined?t.className.baseVal:t.className))}).length"

errs_all = []
with sync_playwright() as p:
    for look in looks:
        # ---------- full tier: entrance once, then no replay ----------
        b, ctx = ctx_for(p, look); errs = []; pg = K.page(ctx, errs)
        K.open_deck(pg, 'file://' + src, 6, settle=300)
        pg.evaluate("try{localStorage.setItem('owq_gq','auto')}catch(e){};dkReplay()")
        pg.wait_for_timeout(120)
        ok(pg.evaluate("document.getElementById('dkr').classList.contains('dk-in')"), f'[{look}] first render plays the entrance (.dk-in)')
        ok(pg.evaluate("Object.keys(dkS.tw).length>0"), f'[{look}] first render starts count-ups')
        pg.wait_for_timeout(3600)
        final = pg.evaluate(NUMS)
        ok(pg.evaluate("Object.keys(dkS.tw).length===0"), f'[{look}] count-ups finished')
        pg.evaluate("document.getElementById('main').scrollTop=640"); pg.wait_for_timeout(100)
        jump = pg.evaluate(PHASE)
        res = pg.evaluate("""(()=>{const out=[];for(let i=0;i<6;i++){go();out.push([document.getElementById('dkr').classList.contains('dk-in'),Object.keys(dkS.tw).length,!!document.querySelector('#dkr .dk-burst')])}return out})()""")
        ok(all(not x[0] for x in res), f'[{look}] go() x6: no entrance replay')
        ok(all(x[1] == 0 for x in res), f'[{look}] go() x6: no count-up restarts')
        ok(all(not x[2] for x in res), f'[{look}] go() x6: no celebration on plain re-render')
        ok(pg.evaluate(NUMS) == final, f'[{look}] numbers identical after re-render (no flash, no reset)')
        if jump is not None:
            ok(jump < 3, f'[{look}] idle animation phase kept across a re-render (rotation jump {jump:.2f} deg beyond normal drift)')
        for i in range(3):
            pg.evaluate("refreshQuiet()"); pg.wait_for_timeout(250)
        ok(pg.evaluate("document.getElementById('main').scrollTop") >= 600, f'[{look}] refreshQuiet x3 keeps the scroll position')
        ok(not pg.evaluate("document.getElementById('dkr').classList.contains('dk-in')") and pg.evaluate(NUMS) == final, f'[{look}] refreshQuiet x3: no replay, same numbers')
        # a real change: a new policy issued today -> tween from the old value + one celebration
        pg.evaluate("D.policies.push({d:today,cl:'Frances Turner',ag:'John Montini',car:'Americo',prod:'Final Expense',ap:1320,pct:100,src:'Referral',st:'Issued'});save();refreshQuiet()")
        pg.wait_for_timeout(60)
        st = pg.evaluate("[Object.keys(dkS.tw).sort().join(','),document.querySelectorAll('#dkr .dk-burst').length]")
        ok('net' in st[0] and 'sales' in st[0], f'[{look}] real change tweens the changed numbers only ({st[0]})')
        ok(st[1] == 1, f'[{look}] real change fires one celebration burst')
        pg.wait_for_timeout(2000)
        newv = dict(json.loads(pg.evaluate(NUMS)))
        oldv = dict(json.loads(final))
        ok(newv.get('sales') != oldv.get('sales') and pg.evaluate("document.querySelector('#dkr [data-dkn=sales]').textContent===$(S().issAP)"), f'[{look}] tween settles on the new value {newv.get("sales")}')
        ok(pg.evaluate("!document.querySelector('#dkr .dk-burst')"), f'[{look}] burst cleans itself up')
        # particles (look C embers): compositor-only CSS layers, gone with the DOM when the deck is not the active tab
        nem = pg.evaluate("document.querySelectorAll('#dkr .dk-em').length")
        if nem:
            EM = "document.getAnimations().filter(a=>{const t=a.effect&&a.effect.target;return t&&t.classList&&t.classList.contains('dk-em')}).length"
            ok(nem <= 24 and pg.evaluate(EM) == nem, f'[{look}] {nem} ember particles animating (capped, transform/opacity only)')
            ok(pg.evaluate("!document.querySelector('#main canvas')"), f'[{look}] no canvas, no per-frame script for particles')
            pg.evaluate("openTab('Agency Performance')"); pg.wait_for_timeout(300)
            ok(pg.evaluate(EM) == 0, f'[{look}] particles stop when the deck is not the active tab')
            pg.evaluate("openTab('Command Deck')"); pg.wait_for_timeout(300)
            ok(pg.evaluate(EM) == nem, f'[{look}] particles back on the deck')
        ok(not errs, f'[{look}] no console errors (full tier) {errs[:2]}'); errs_all += errs
        b.close()
        # ---------- low tier: no idle loops / particles, still renders everything ----------
        b, ctx = ctx_for(p, look, "localStorage.setItem('owq_gq','low');"); errs = []; pg = K.page(ctx, errs)
        K.open_deck(pg, 'file://' + src, 6, settle=300)
        pg.evaluate("localStorage.setItem('owq_gq','low');dkReplay()"); pg.wait_for_timeout(3500)
        ok(pg.evaluate("document.getElementById('dkr').classList.contains('dk-t-low')"), f'[{look}] low tier detected')
        ok(pg.evaluate(DKLOOPS) == 0, f'[{look}] low tier: no infinite dk animations')
        ok(pg.evaluate("[...document.querySelectorAll('#dkr .dk-em')].every(e=>!e.getClientRects().length)"), f'[{look}] low tier: no particles')
        b.close()
        # ---------- reduced motion (Settings > Motion: Reduced) and graphics 'still' ----------
        for name, extra, js in [('reduced motion', "localStorage.setItem('owq_motion','reduce');", ""), ('still tier', "", "localStorage.setItem('owq_gq','still');")]:
            b, ctx = ctx_for(p, look, extra); errs = []; pg = K.page(ctx, errs)
            K.open_deck(pg, 'file://' + src, 6, settle=300)
            pg.evaluate(js + "dkReplay()"); pg.wait_for_timeout(60)
            ok(pg.evaluate("document.getElementById('dkr').classList.contains('dk-t-still')&&!document.getElementById('dkr').classList.contains('dk-in')"), f'[{look}] {name}: static tier, no entrance')
            ok(pg.evaluate("Object.keys(dkS.tw).length===0") and pg.evaluate("document.querySelector('#dkr [data-dkn=net]').textContent===$(S().net)"), f'[{look}] {name}: final numbers immediately, no count-up')
            pg.wait_for_timeout(300)
            ok(pg.evaluate(DKANIMS) == 0, f'[{look}] {name}: zero running animations inside the deck')
            ok(pg.evaluate("!document.querySelector('#dkr canvas')&&[...document.querySelectorAll('#dkr .dk-em')].every(e=>!e.getClientRects().length)"), f'[{look}] {name}: no particles')
            b.close()
    # ---------- switcher, URL param, fallback (once) ----------
    b, ctx = ctx_for(p, ''); errs = []; pg = K.page(ctx, errs)
    K.open_deck(pg, 'file://' + src, 6, settle=500)
    ok(pg.evaluate("document.querySelectorAll('#dkr .dk-sw button').length===3"), 'all build: A/B/C switcher in the deck header')
    pg.click('#dkr .dk-sw button:nth-child(2)'); pg.wait_for_timeout(400)
    ok(pg.evaluate("document.getElementById('dkr').dataset.look==='b'&&localStorage.getItem('owq_dk')==='b'"), 'switcher chip B switches and remembers (owq_dk)')
    pg.evaluate("dkLook_b=function(){throw new Error('boom')};go()"); pg.wait_for_timeout(300)
    ok(pg.evaluate("!document.getElementById('dkr')&&!!document.querySelector('#main .deck .dl .mod')"), 'renderer error falls back to the classic deck')
    b.close()
    b, ctx = ctx_for(p, ''); errs = []; pg = K.page(ctx, errs)
    pg.goto('file://' + src + '?dk=c', timeout=180000); pg.wait_for_timeout(2500)
    import lgx; lgx.login(pg, 6); pg.wait_for_timeout(1500); pg.evaluate(K.QUIET_JS); pg.evaluate("openTab('Command Deck')"); pg.wait_for_timeout(500)
    ok(pg.evaluate("document.getElementById('dkr').dataset.look==='c'"), '?dk=c selects look C')
    b.close()
    # empty agency (first day, nothing logged) and an agent view: every look still renders, no errors
    EMPTY = "(()=>{try{const D=JSON.parse(localStorage.getItem('owq_v3'));['policies','expenses','income','activity','clients','alerts','challenges','checkins','chat','shifts','mrRecs','mrMsgs'].forEach(k=>D[k]=[]);localStorage.setItem('owq_v3',JSON.stringify(D))}catch(e){}})();"
    for l in looks:
        b2, ctx = ctx_for(p, l, EMPTY); errs = []; pg = K.page(ctx, errs)
        K.open_deck(pg, 'file://' + src, 1, settle=1500)
        ok(pg.evaluate("!!document.getElementById('dkr')&&document.getElementById('dkr').dataset.look==='%s'" % l) and not errs, f'[{l}] empty agency renders the new deck without errors {errs[:2]}')
        b2.close()
    # single-look builds ship no switcher
    for l in 'abc':
        f = os.path.join(os.path.dirname(src), 'portal_%s.html' % l)
        if not os.path.exists(f): continue
        h = open(f, encoding='utf-8').read()
        others = [x for x in 'abc' if x != l]
        ok('function dkLook_%s(' % l in h and all('function dkLook_%s(' % x not in h for x in others) and 'const DKL=["%s"]' % l in h, f'portal_{l}.html ships only look {l.upper()} (no dead code, no switcher)')
print('\n%d passed, %d failed' % (sum(1 for x in R if x[0]), sum(1 for x in R if not x[0])))
json.dump({'results': R}, open(K.DK + '/tests/behave_result.json', 'w'), indent=1)
sys.exit(0 if all(x[0] for x in R) else 1)
