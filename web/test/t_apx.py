"""v114: Agency Performance holds Business Performance (Overview, Sales and Money tabs, old links redirect), editing policies /
expenses / income / activity with the filled-in form, and the Command Deck's sneak peeks."""
import sys, os, time, json, subprocess
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'; sys.path.insert(0, SP)
import lgx
from playwright.sync_api import sync_playwright
PORT = int(os.environ.get('PORT', 8961)); SITE = os.environ.get('SITE', SP + '/web/test/site_apx'); URL = 'http://127.0.0.1:%d/index.html' % PORT
res = []
def ok(c, m, info=''): res.append(bool(c)); print(('PASS ' if c else 'FAIL ') + m + ('' if c else '  ' + str(info)[:500]), flush=True)
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=SITE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
MAIN = "document.getElementById('main').innerText"
def tab(A, s):
    A.evaluate("s=>{SUB['Agency Performance']=s;AGD=null;openTab('Agency Performance',s)}", s); A.wait_for_timeout(500)
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
        A.evaluate("(()=>{try{mock()}catch(e){}})()"); A.wait_for_timeout(1200)
        # ---- one section
        nav = A.evaluate("document.getElementById('nav').innerText.toUpperCase()")
        ok('BUSINESS PERFORMANCE' not in nav and 'AGENCY PERFORMANCE' in nav and 'PRODUCTION EQUATION' in nav, 'Business Performance is gone from the sidebar; Agency Performance and Production Equation stay', nav[:300])
        tab(A, 'Overview')
        seg = A.evaluate("document.querySelector('.apx-seg').innerText.toUpperCase()")
        ok(all(x in seg for x in ['OVERVIEW', 'SALES', 'POLICIES', 'AGENTS', 'TIME REPORT', 'MONEY', 'INCOME', 'EXPENSES', 'STATEMENT', 'PORTFOLIO']), 'Agency Performance has Overview, Sales and Money tabs (Portfolio for the owner)', seg)
        t = A.evaluate(MAIN).upper()
        ok(all(x in t for x in ['ISSUED PREMIUM', 'TOTAL INCOME', 'NET PROFIT', 'PRODUCTION & PROFIT', "THIS MONTH'S GOAL", 'SALES FUNNEL', 'TOP PRODUCERS', 'WHERE THE MONEY GOES', 'LATEST POLICIES']), 'the Overview shows production and money together', t[:400])
        ok(A.evaluate("document.querySelectorAll('.apx-tr .apx-bg').length") == 12 and A.evaluate("!!document.querySelector('.apx-tr .apx-nl')"), 'the 12-month chart has bars for every month and the profit line')
        # ---- old addresses
        A.evaluate("openTab('Business Performance','Expenses')"); A.wait_for_timeout(500)
        ok(A.evaluate("tab") == 'Agency Performance' and A.evaluate("SUB['Agency Performance']") == 'Expenses' and 'BY CATEGORY' in A.evaluate(MAIN).upper(), 'an old Business Performance > Expenses link opens Agency Performance > Expenses')
        A.evaluate("(()=>{tab='Business Performance';SUB['Business Performance']='Statement';go()})()"); A.wait_for_timeout(500)
        ok(A.evaluate("tab") == 'Agency Performance' and A.evaluate("SUB['Agency Performance']") == 'Statement' and A.evaluate("!!document.querySelector('#main table')") and 'NET PROFIT BY MONTH' in A.evaluate(MAIN).upper(), 'and Statement keeps its table, now with the charts above it')
        tab(A, 'Portfolio'); A.wait_for_timeout(600)
        pt_ = A.evaluate(MAIN).upper()
        ok(A.evaluate("pfShown()") and 'PORTFOLIO' in pt_ and A.evaluate("!!document.querySelector('#main [onclick*=pfAdd]')"), 'the owner Portfolio opens inside Agency Performance (with Buy and Sell)', pt_[-400:])
        nb = A.evaluate("(()=>{const w=WHO;WHO='Nate Johnson';const r=apxTabs();WHO=w;return r})()")
        ok('Portfolio' not in nb, 'agents do not get the Portfolio tab', nb)
        # ---- editing
        tab(A, 'Policies')
        ok(A.evaluate("document.querySelectorAll('#main table .apx-eb').length") > 0 and A.evaluate("!!document.querySelector('.apx-ph .apx-sb')"), 'every policy row has an edit button; the status mix bar sits on top')
        A.evaluate("(()=>{D.policies.push({d:'2026-10-02',cl:'Edit Me',ag:'Nate Johnson',car:'Americo',prod:'Term',ap:1200,pct:90,src:'Referral',st:'Submitted'});save();go()})()"); A.wait_for_timeout(400)
        A.evaluate("(()=>{pf='Submitted';go()})()"); A.wait_for_timeout(300)
        A.evaluate("(()=>{const tr=[...document.querySelectorAll('#main table tr')].find(r=>r.innerText.includes('Edit Me'));tr.querySelector('.apx-eb').click()})()"); A.wait_for_timeout(300)
        f = A.evaluate("({h:document.querySelector('#md .c h4').innerText,cl:pc.value,ap:pa.value,st:ps.value,ag:pg.value,pct:pt.value})")
        ok(f['h'].upper() == 'EDIT POLICY' and f['cl'] == 'Edit Me' and f['ap'] == '1200' and f['st'] == 'Submitted' and f['ag'] == 'Nate Johnson' and f['pct'] == '90', 'Edit opens the policy form filled in', f)
        A.evaluate("(()=>{pa.value='1500';ps.value='Issued';pc.value='Edited Name'})()"); A.click("#md button:has-text('Save changes')"); A.wait_for_timeout(400)
        pol = A.evaluate("D.policies.filter(x=>x.cl==='Edited Name').map(x=>({ap:x.ap,st:x.st,ag:x.ag,n:D.policies.filter(y=>y.cl==='Edit Me').length}))")
        ok(len(pol) == 1 and pol[0]['ap'] == 1500 and pol[0]['st'] == 'Issued' and pol[0]['n'] == 0, 'a submitted policy is updated in place (premium, status, name), not duplicated', pol)
        A.evaluate("(()=>{const i=D.expenses.length;D.expenses.push({d:'2026-10-03',cat:'Leads',amt:400,leads:20,src:'Facebook Leads',n:'test exp'});save();apxEdit('expenses',i)})()"); A.wait_for_timeout(300)
        ok(A.evaluate("ea.value") == '400' and A.evaluate("ec.value") == 'Leads', 'an expense opens filled in')
        A.evaluate("(()=>{ea.value='450';en.value='edited exp'})()"); A.click("#md button:has-text('Save changes')"); A.wait_for_timeout(300)
        ok(A.evaluate("D.expenses.filter(x=>x.n==='edited exp').length") == 1 and A.evaluate("D.expenses.find(x=>x.n==='edited exp').amt") == 450, 'and saves')
        tab(A, 'Expenses'); ok(A.evaluate("document.querySelectorAll('#main .apx-eb').length") > 0, 'the expense list has edit buttons')
        tab(A, 'Income'); ok(A.evaluate("document.querySelectorAll('#main .apx-eb').length") > 0, 'the income list has edit buttons')
        A.evaluate("(()=>{const tr=document.querySelector('#main table tr:nth-child(2)');tr.querySelector('.apx-eb').click()})()"); A.wait_for_timeout(300)
        A.evaluate("ia.value='777';inn.value='edited inc'"); A.click("#md button:has-text('Save changes')"); A.wait_for_timeout(300)
        ok(A.evaluate("D.income.filter(x=>x.n==='edited inc'&&x.amt===777).length") == 1, 'income entries edit in place')
        tab(A, 'Agents'); ok('ACTIVITY LOG' in A.evaluate(MAIN).upper() and A.evaluate("document.querySelectorAll('#main .apx-eb').length") > 0, 'Agents shows the activity log with edit buttons')
        n0 = A.evaluate("D.activity.length")
        A.evaluate("(()=>{document.querySelector('#main .apx-eb').click()})()"); A.wait_for_timeout(300)
        A.evaluate("ah.value='7.5'"); A.click("#md button:has-text('Save changes')"); A.wait_for_timeout(300)
        ok(A.evaluate("D.activity.length") == n0 and A.evaluate("D.activity.some(x=>x.h===7.5)"), 'activity entries edit in place')
        A.evaluate("(()=>{document.querySelector('#main .apx-eb').click()})()"); A.wait_for_timeout(300)
        A.click("#md .apx-del"); A.wait_for_timeout(200); A.click('#md #yes'); A.wait_for_timeout(300)
        ok(A.evaluate("D.activity.length") == n0 - 1, 'Delete from the edit form removes the entry (after confirming)')
        A.wait_for_timeout(1500)
        ok(A.evaluate("Object.values(SYN.sent.policies||{}).some(x=>String(x).includes('Edited Name'))"), 'edits go out to the team like any change')
        # ---- the Command Deck
        A.evaluate("openTab('Command Deck')"); A.wait_for_timeout(800)
        pk = A.evaluate("[...document.querySelectorAll('.apx-peeks .apx-pkh h4')].map(h=>h.innerText.toUpperCase())")
        ok(len(pk) == 4 and any('AGENCY PERFORMANCE' in x for x in pk) and any('MONEY' in x for x in pk) and any('PRODUCTION EQUATION' in x for x in pk) and any('CLIENTS' in x for x in pk), 'the Command Deck has sneak peeks of Agency Performance, Money, Production Equation and Clients', pk)
        ok(A.evaluate("!!document.getElementById('pls')&&!!document.getElementById('dal')&&!!document.querySelector('.rx')"), 'it keeps the reactor, the Live Pulse and the alerts')
        A.click('.apx-peeks .apx-pk:nth-child(2)'); A.wait_for_timeout(500)
        ok(A.evaluate("tab") == 'Agency Performance' and A.evaluate("SUB['Agency Performance']") == 'Statement', 'tapping the Money peek opens the Statement')
        A.evaluate("openTab('Command Deck')"); A.wait_for_timeout(500); A.click('.apx-peeks .apx-pk:nth-child(3)'); A.wait_for_timeout(500)
        ok(A.evaluate("tab") == 'Production Equation', 'the Production Equation peek opens it')
        # ---- phone width
        A.set_viewport_size({'width': 390, 'height': 844}); A.wait_for_timeout(300)
        for t2 in ['Command Deck', 'Agency Performance']:
            A.evaluate("t=>{try{toggleRail(false)}catch(e){};if(t==='Agency Performance')SUB[t]='Overview';openTab(t)}", t2); A.wait_for_timeout(600)
            w = A.evaluate("(()=>{const m=document.getElementById('main');return {sw:m.scrollWidth,cw:m.clientWidth}})()")
            ok(w['sw'] <= w['cw'] + 2, t2 + ' fits a phone screen', w)
        ok(not errs, 'no page errors', errs)
        b.close()
finally:
    srv.terminate()
print('%d/%d' % (sum(res), len(res)))
