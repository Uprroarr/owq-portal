"""The owner's portfolio counts toward revenue: the money invested (cost basis) is in Total Income, Net Profit, the Income
tab (its own line), the Statement (its own column, month by month) and the Command Deck ticker, on the owner's screen only."""
import sys, os, time, json, subprocess
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'; sys.path.insert(0, SP)
import lgx
from playwright.sync_api import sync_playwright
PORT = int(os.environ.get('PORT', 8833)); SITE = os.environ.get('SITE', SP + '/web/test/site_pfrev'); URL = 'http://127.0.0.1:%d/index.html' % PORT
res = []
def ok(c, m, info=''): res.append(bool(c)); print(('PASS ' if c else 'FAIL ') + m + ('' if c else '  ' + str(info)[:400]), flush=True)
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=SITE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
S = "(()=>{const s=S();return {rev:s.rev,pv:s.pv,pr:s.pr,oi:s.oi,net:s.net,ex:s.exT}})()"
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
        A.wait_for_function("typeof SYN!=='undefined'&&SYN.first&&typeof PF!=='undefined'&&PF.ready", timeout=40000)
        ok(A.evaluate("pfOwnerNow()"), 'the owner has the portfolio', A.evaluate("({owner:PF.owner,who:WHO})"))
        s0 = A.evaluate(S); ok(s0['pv'] == 0, 'with an empty portfolio nothing is added', s0)
        ms0 = A.evaluate("months()"); ok('2023-02' not in ms0, 'precondition: the agency has nothing in February 2023', ms0)
        # buy 1 MSFT at 100 in February 2023 (a month with no agency data), 10 AAPL at 150 (+1 fee) in September,
        # 0.1 BTC at 60,000 in October, sell 4 AAPL at 170 in October
        A.evaluate("""(()=>{PF.data.tx=[{t:'buy',k:'stock',sym:'MSFT',q:1,px:100,fee:0,d:'2023-02-15',ts:0},{t:'buy',k:'stock',sym:'AAPL',q:10,px:150,fee:1,d:'2026-09-20',ts:1},{t:'buy',k:'crypto',sym:'BTC',q:.1,px:60000,fee:0,d:'2026-10-02',ts:2,cg:'bitcoin'},{t:'sell',k:'stock',sym:'AAPL',q:4,px:170,fee:0,d:'2026-10-10',ts:3}];pfSave()})()""")
        A.wait_for_timeout(1500)
        s1 = A.evaluate(S); cost = A.evaluate("pfBook().cost")
        ok(abs(cost - 7000.6) < .01 and abs(s1['pv'] - cost) < .01, 'the money invested is the cost basis: 100 + 1,501 - 600.40 sold + 6,000 = 7,000.60', [cost, s1])
        ok(abs(s1['rev'] - (s1['pr'] + s1['oi'] + s1['pv'])) < .01 and abs(s1['rev'] - s0['rev'] - cost) < .01, 'Total Income includes it', [s0, s1])
        ok(abs(s1['net'] - (s1['rev'] - s1['ex'])) < .01 and abs(s1['net'] - s0['net'] - cost) < .01, 'and so does Net Profit', [s0, s1])
        mo = A.evaluate("pfInvMonths()")
        ok(abs(mo.get('2023-02', 0) - 100) < .01 and abs(mo.get('2026-09', 0) - 1501) < .01 and abs(mo.get('2026-10', 0) - 5399.6) < .01 and abs(sum(mo.values()) - cost) < .01, 'month by month: buys add their cost, sells take out the average cost sold', mo)
        mm = A.evaluate("({ag:months(),bz:pfMs(months())})")
        ok('2023-02' not in mm['ag'] and '2023-02' in mm['bz'], 'a portfolio-only month shows in the money views, not in the agency charts', mm)
        # lead ROI stays on what the agency earned; the assistant names the invested part
        lr = A.evaluate("""(()=>{D.expenses.push({d:'2026-10-01',cat:'Leads',amt:300,_i:'ttlead'});const s=S(),h=HS(),b=brief().map(x=>x[1]).join(' | '),want=((s.rev-s.pv)/s.lead).toFixed(2),wrong=(s.rev/s.lead).toFixed(2),roi=(h.parts.find(p=>p[0]==='Lead ROI')||[])[1],exp=Math.max(0,Math.min(1,(s.rev-s.pv)/s.lead/3));D.expenses=D.expenses.filter(x=>x._i!=='ttlead');return {b,want,wrong,roi,exp,ans:answer('what is our revenue'),pv:$(s.pv)}})()""")
        ok(('$' + lr['want'] + ' in agency income') in lr['b'] and abs(lr['roi'] - lr['exp']) < 1e-9, 'lead ROI (brief, health score) counts the agency income only', lr)
        ok('invested in your portfolio' in lr['ans'] and lr['pv'] in lr['ans'], 'the assistant says how much of the income is invested', lr['ans'])
        A.evaluate("(()=>{openTab('Business Performance');SUB['Business Performance']='Summary';go()})()"); A.wait_for_timeout(600)
        t = A.evaluate("document.getElementById('main').innerText")
        ok('invested' in t.lower() and '$7,001' in t, 'Summary: Total Income shows the invested part', t[:500])
        A.screenshot(path=SP + '/web/test/shots/pfrev_summary.png', full_page=False)
        A.evaluate("(()=>{SUB['Business Performance']='Income';go()})()"); A.wait_for_timeout(500)
        t = A.evaluate("document.getElementById('main').innerText")
        ok('PORTFOLIO INVESTED' in t.upper() and '$7,001' in t, 'Income: a Portfolio Invested line', t[:500])
        A.evaluate("(()=>{SUB['Business Performance']='Statement';go()})()"); A.wait_for_timeout(500)
        st = A.evaluate("(()=>{const T=document.querySelector('#main table');const rows=[...T.querySelectorAll('tr')].map(r=>[...r.children].map(c=>c.innerText.trim()));return rows})()")
        hdr = [h.upper() for h in st[0]]; ix = hdr.index('PORTFOLIO INVESTED') if 'PORTFOLIO INVESTED' in hdr else -1
        feb = next((r for r in st if r[0] == '2023-02'), None); sep = next((r for r in st if r[0] == '2026-09'), None); octr = next((r for r in st if r[0] == '2026-10'), None); tot = next((r for r in st if r[0].lower() == 'total'), None)
        ok(ix > 0 and feb and feb[ix] == '$100' and sep and sep[ix] == '$1,501' and octr and octr[ix] == '$5,400' and tot and tot[ix] == '$7,001', 'Statement: a Portfolio Invested column, February 2023, September and October, total 7,001', st[:4])
        ok(feb and feb[-1] == '$100', 'a month with only a portfolio buy nets the money invested', feb)
        ok(tot and len(tot) == len(st[0]), 'the Statement rows line up with the header', [st[0], tot])
        A.screenshot(path=SP + '/web/test/shots/pfrev_statement.png', full_page=False)
        A.evaluate("(()=>{SUB['Business Performance']='Portfolio';go()})()"); A.wait_for_timeout(800)
        ok('counts toward Total Income' in A.evaluate("document.getElementById('main').innerText"), 'the Portfolio says the cost basis counts toward Total Income')
        A.evaluate("openTab('Command Deck')"); A.wait_for_timeout(1500)
        tk = A.evaluate("(()=>{const s=S();return {want:$(s.rev),txt:document.body.innerText}})()")
        ok(tk['want'] in tk['txt'], 'the Command Deck shows the same income', tk['want'])
        A.screenshot(path=SP + '/web/test/shots/pfrev_deck.png', full_page=False)
        nb = A.evaluate("(()=>{const w=WHO;WHO='Nate Johnson';const s=S();WHO=w;return {pv:s.pv,rev:s.rev}})()")
        ok(nb['pv'] == 0, 'for anyone but the owner the portfolio is not in the numbers', nb)
        A.evaluate("(()=>{PF.data.tx=[];pfSave()})()"); A.wait_for_timeout(1200)
        ok(A.evaluate("S().pv") == 0, 'emptying the portfolio takes it back out')
        ok(not errs, 'no page errors', errs)
        b.close()
finally:
    srv.terminate()
print('%d/%d' % (sum(res), len(res)))
