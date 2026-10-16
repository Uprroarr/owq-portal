"""Owner starting credits (v112): the Agency Owner / Cole Leckey wallet gets 10,000 credits once; Battle Pass XP and tier are
unchanged; other agents get nothing extra."""
import sys, os, time, json, subprocess
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'; sys.path.insert(0, SP)
import lgx
from playwright.sync_api import sync_playwright
PORT = int(os.environ.get('PORT', 8901)); SITE = os.environ.get('SITE', SP + '/web/test/site_ecost'); URL = 'http://127.0.0.1:%d/index.html' % PORT
res = []
def ok(c, m, info=''): res.append(bool(c)); print(('PASS ' if c else 'FAIL ') + m + ('' if c else '  ' + str(info)[:400]), flush=True)
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=SITE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--no-sandbox', '--disable-webgl', '--no-proxy-server'])
        ctx = b.new_context(viewport={'width': 1366, 'height': 900}); ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
        errs = []
        K = ctx.new_page(); K.goto('http://127.0.0.1:%d/keep.html' % PORT); K.wait_for_function('window.__FAKE')
        A = ctx.new_page(); A.on('pageerror', lambda e: errs.append(str(e)[:200]))
        A.add_init_script("window.__FAKE_SIGNIN=%s;" % json.dumps({'uid': 'uOwner', 'email': 'owner@example.com', 'displayName': 'Cole Leckey'}))
        A.goto(URL); A.wait_for_function("window.__FAKE", timeout=20000); A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})"); A.evaluate("sessionStorage.clear()"); A.reload()
        A.wait_for_function("OWQC.phase==='out'", timeout=30000); A.click('#owqgi'); A.wait_for_function("OWQC.phase==='in'", timeout=30000)
        lgx.login(A, 2); A.wait_for_timeout(1500)
        A.wait_for_function("typeof SYN!=='undefined'&&SYN.first", timeout=30000)
        R = A.evaluate("""(()=>{const line=n=>(ecoEarn(n).P.find(x=>x.k==='o')||{}).cr||0;
          const xp=n=>bpXP(n),bx=bpXP('Cole Leckey');
          const was=EOWN;EOWN=0;const b0=ecoBal('Cole Leckey'),x0=bpXP('Cole Leckey').total,lv0=bpLv(x0).lvl;EOWN=was;
          return {cole:line('Cole Leckey'),owner:line('Agency Owner'),same:bpName('Agency Owner')==='Cole Leckey',nate:line('Nate Johnson'),
           bal:ecoBal('Cole Leckey'),balOwner:ecoBal('Agency Owner'),b0,x0,x1:bx.total,lv0,lv1:bpLv(bx.total).lvl,xpHas:bx.P.some(p=>/credit/i.test(p.l)),
           who:WHO,mine:ecoBal(WHO)}})()""")
        ok(R['cole'] == 10000 and R['bal'] - R['b0'] == 10000, 'the owner wallet has 10,000 starting credits on top of what it earned', R)
        ok(R['same'] and R['owner'] == 10000 and R['balOwner'] == R['bal'], 'Agency Owner and Cole Leckey share that one wallet (added once)', R)
        ok(R['mine'] == R['bal'], 'the signed-in owner sees it as their balance', R)
        ok(R['nate'] == 0, 'other agents get nothing extra', R)
        ok(R['x1'] == R['x0'] and R['lv1'] == R['lv0'] and not R['xpHas'], 'Battle Pass XP and tier are unchanged', R)
        A.evaluate("openTab('Shop')"); A.wait_for_timeout(800)
        t = A.evaluate("(document.querySelector('.ecbal b')||{}).innerText||''")
        ok(t.replace(',', '') == str(R['bal']), 'the Shop wallet shows the new balance', [t, R['bal']])
        ok(not errs, 'no page errors', errs)
        b.close()
finally:
    srv.terminate()
print('%d/%d' % (sum(res), len(res)))
