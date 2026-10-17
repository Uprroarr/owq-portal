"""Guest pass (v113): ?guest=<id> opens the portal for that person on sample data in this browser only. No sign-in, no cloud,
its own storage space (never mixes with a member's saved data), the normal cinematic login signs the guest in as themself,
an ended pass and a wrong link say so, and the normal link is unchanged."""
import sys, os, time, json, subprocess
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'; sys.path.insert(0, SP)
from playwright.sync_api import sync_playwright
PORT = int(os.environ.get('PORT', 8921)); SITE = os.environ.get('SITE', SP + '/web/test/site_guest'); BASEURL = 'http://127.0.0.1:%d/index.html' % PORT
GID = os.environ.get('GID', 'bnp8l8Uf4rjjd1'); GNAME = 'Brandon Negri'
SHOTS = SP + '/web/test/shots'; os.makedirs(SHOTS, exist_ok=True)
res = []
def ok(c, m, info=''): res.append(bool(c)); print(('PASS ' if c else 'FAIL ') + m + ('' if c else '  ' + str(info)[:500]), flush=True)
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=SITE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
RAW = "(()=>{const d=Object.getOwnPropertyDescriptor(Window.prototype,'localStorage')||Object.getOwnPropertyDescriptor(window.__proto__,'localStorage');return d&&d.get?d.get.call(window):null})()"
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--no-sandbox', '--disable-webgl', '--no-proxy-server'])
        ctx = b.new_context(viewport={'width': 1366, 'height': 900}); ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
        errs = []
        K = ctx.new_page(); K.goto('http://127.0.0.1:%d/keep.html' % PORT); K.wait_for_function('window.__FAKE')
        # a member's own saved data on this browser
        M = ctx.new_page(); M.goto(BASEURL); M.wait_for_function("window.OWQC&&OWQC.phase==='out'", timeout=30000)
        M.evaluate("(()=>{localStorage.setItem('owq_member_marker','keep-me');localStorage.setItem('owq_crm_q','[\"member outbox\"]')})()")
        before = set(M.evaluate("Object.keys(localStorage)"))
        M.close()
        # ---- the guest link
        A = ctx.new_page(); A.on('pageerror', lambda e: errs.append(str(e)[:200]))
        A.goto(BASEURL + '?guest=' + GID); A.wait_for_function("window.OWQC&&OWQC.phase==='guest'", timeout=30000)
        gt = A.evaluate("document.getElementById('owqg').innerText")
        ok('GUEST PASS' in gt and GNAME in gt and 'GOOD THROUGH SAT, OCT 24' in gt and 'sample data' in gt, 'the guest link opens a guest pass for Brandon, good through Sat, Oct 24', gt)
        A.screenshot(path=SHOTS + '/guest_gate.png', full_page=False)
        ok(A.evaluate("localStorage.getItem('owq_member_marker')") is None and A.evaluate("localStorage.getItem('owq_crm_q')") is None, "the guest cannot see a member's saved data on the same browser")
        ok(A.evaluate("Promise.race([claude.use('db').then(x=>x===null),new Promise(r=>setTimeout(()=>r('timeout'),2500))])") is True and A.evaluate("Promise.race([claude.use('user').then(x=>x===null),new Promise(r=>setTimeout(()=>r('timeout'),2500))])") is True, 'no shared database and no member identity: the portal runs on its own')
        ok(not A.evaluate("!!(OWQC.F||OWQC.app||OWQC.auth)"), 'Firebase is never started on a guest link')
        A.click('#owqgg'); A.wait_for_function("typeof ONLINE!=='undefined'&&ONLINE===1", timeout=120000); A.wait_for_timeout(1500)
        ok(A.evaluate("WHO") == GNAME, 'Enter the station: the cinematic login signs him in as Brandon Negri (no code)', A.evaluate("WHO"))
        dd = A.evaluate("(()=>({ag:D.agents.map(a=>a.name),pol:D.policies.length,mine:D.policies.filter(p=>p.ag===WHO).length,act:D.activity.filter(a=>a.ag===WHO).length,crm:typeof crmAll==='function'?crmAll().length:-1,real:D.agents.some(a=>/Vardzel|Johnson|Montini|Noullet|Leckey/.test(a.name))}))()")
        ok(GNAME in dd['ag'] and 'Marcus' in dd['ag'] and 'Tia' in dd['ag'] and not dd['real'], 'a sample agency: Brandon plus two sample teammates (no real names)', dd)
        ok(dd['pol'] >= 20 and dd['mine'] > 0 and dd['act'] > 0 and dd['crm'] == 9, 'with sample policies, activity and 9 sample clients in the CRM', dd)
        ok(A.locator('#owqgst').is_visible() and 'GUEST PREVIEW' in A.evaluate("document.getElementById('owqgst').innerText"), 'the sidebar says Guest preview, sample data while he is in')
        ok(A.evaluate("MYCL().length") == 9, "the sample clients are his book (the Command Deck counts them)", A.evaluate("MYCL().length"))
        A.screenshot(path=SHOTS + '/guest_in.png', full_page=False)
        for t in ['Clients', 'Business Performance', 'Leaderboard', 'Learning Network', 'Agency Performance', 'Battle Pass', 'Shop', 'Command Deck']:
            A.evaluate("t=>{try{openTab(t)}catch(e){}}", t); A.wait_for_timeout(700)
        ok(not errs, 'he can open every section (no errors)', errs)
        A.evaluate("openTab('Clients')"); A.wait_for_timeout(800); A.screenshot(path=SHOTS + '/guest_clients.png', full_page=False)
        # ---- locking and coming back in, whichever name is picked
        A.evaluate("lockView()"); A.wait_for_function("GXU.state()==='menu'", timeout=60000)
        A.evaluate("pickProfile('Agency Owner')"); A.wait_for_function("GXU.state()==='land'", timeout=60000); A.wait_for_timeout(300)
        A.evaluate("(()=>{const i=document.getElementById('lgi');if(i)i.value='';doLogin()})()"); A.wait_for_function("ONLINE===1", timeout=60000); A.wait_for_timeout(500)
        ok(A.evaluate("WHO") == GNAME, 'after Lock station he comes back in as Brandon, whatever profile is picked', A.evaluate("WHO"))
        n0 = A.evaluate("D.policies.length")
        A.reload(); A.wait_for_function("window.OWQC&&OWQC.phase==='guest'", timeout=30000); A.wait_for_timeout(1500)
        ok(A.evaluate("D.policies.length") == n0, 'his sandbox is kept between visits (not reseeded)', [n0, A.evaluate("D.policies.length")])
        A.close()
        # ---- the member side is untouched
        M = ctx.new_page(); M.goto(BASEURL); M.wait_for_function("window.OWQC&&OWQC.phase==='out'", timeout=30000)
        keys = set(M.evaluate("Object.keys(localStorage)"))
        new_plain = sorted(k for k in keys - before if not k.startswith('owqguest:'))
        ok(M.evaluate("localStorage.getItem('owq_member_marker')") == 'keep-me' and M.evaluate("localStorage.getItem('owq_crm_q')") == '["member outbox"]', "the member's saved data is exactly as it was")
        ok(any(k.startswith('owqguest:') for k in keys) and not new_plain, 'everything the guest saved is in its own space', new_plain[:10])
        ok(M.evaluate("OWQC.phase") == 'out', 'the normal link still asks for sign-in')
        M.close()
        # ---- a wrong link
        X = ctx.new_page(); X.goto(BASEURL + '?guest=notarealpass1'); X.wait_for_function("window.OWQC&&OWQC.phase==='gbad'", timeout=30000)
        ok('LINK NOT VALID' in X.evaluate("document.getElementById('owqg').innerText"), 'a guest link that is not a pass says so')
        X.close()
        # ---- after the end date
        c2 = b.new_context(viewport={'width': 1366, 'height': 900}); c2.add_init_script("(()=>{const off=9*864e5,n=Date.now;Date.now=()=>n()+off})()")
        E = c2.new_page(); E.goto(BASEURL); E.evaluate("localStorage.setItem('owqguest:owq_guest_seed','1');localStorage.setItem('owq_member_marker','keep-me')")
        E.goto(BASEURL + '?guest=' + GID); E.wait_for_function("window.OWQC&&OWQC.phase==='gexp'", timeout=30000)
        et = E.evaluate("document.getElementById('owqg').innerText")
        ok('GUEST PASS ENDED' in et and 'Sat, Oct 24' in et, 'after Oct 24 the link says the pass ended', et)
        E.screenshot(path=SHOTS + '/guest_ended.png', full_page=False)
        E.goto(BASEURL)
        ok(E.evaluate("localStorage.getItem('owqguest:owq_guest_seed')") is None and E.evaluate("localStorage.getItem('owq_member_marker')") == 'keep-me', "an ended pass clears the guest's sample data (and only that)")
        c2.close()
        b.close()
finally:
    srv.terminate()
print('%d/%d' % (sum(res), len(res)))
