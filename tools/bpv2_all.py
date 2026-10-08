"""Drive every New Broker Blueprint section (v74 dropdown format) through the real DOM like a learner.
usage: python3 bpv2_all.py [key ...] [--fail] [--shots=key1,key2]     env: MOB=1 (phone viewport), OWQ_URL, TAG
Checks per section: Part 1 gate -> walkthrough steps (gate text, dropdown counts + pills, think / chat / tiles / checklist, quick check wrong then right,
Next unlocks with the ready pulse) -> final quiz (or 'Finish the section' for the walkthrough-only sections) -> result + stored record."""
import sys,os,json,re
from playwright.sync_api import sync_playwright
import lgx
ALL=['classic-script','final-expense-script','veterans-sales-script','recruiting-call-script','beneficiary-and-referral-script','beneficiary-script','text-and-voicemail-script','rebuttals','8-steps-of-a-sale','americo-workflow','1035-exchanges','annuity-breakdown','iuls-explained','carrier-compatibility','code-of-conduct','leadership-guide','insurance-product-guide','state-license-price-grid','fex-product-guide']
args=[a for a in sys.argv[1:] if not a.startswith('--')]
FAIL='--fail' in sys.argv
SHOTS=[a.split('=',1)[1].split(',') for a in sys.argv[1:] if a.startswith('--shots=')]
SHOTS=SHOTS[0] if SHOTS else []
KEYS=args or ALL
MOB=os.environ.get('MOB')=='1'
W=int(os.environ.get('W',390 if MOB else 1366));H=int(os.environ.get('H',844 if MOB else 860))
TAG=os.environ.get('TAG','v2'+('m' if MOB else 'd'))
URL=os.environ.get('OWQ_URL','http://127.0.0.1:8765/owq-command-station-v2.html')
SP=os.path.dirname(os.path.abspath(__file__))
issues=[]
def bad(key,msg): issues.append(f'[{key}] {msg}');print('  !!',msg)

with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
    ctx=b.new_context(viewport={'width':W,'height':H},is_mobile=MOB,has_touch=MOB,device_scale_factor=1)
    ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('PE '+str(e)[:300]))
    pg.on('console',lambda m:errs.append('CE '+m.text[:200]) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
    pg.on('response',lambda r:errs.append(f'HTTP {r.status} {r.url[-80:]}') if r.status>=400 else None)
    pg.goto(URL);pg.wait_for_timeout(2500)
    lgx.login(pg,6)
    pg.evaluate("openTab('Learning Network')");pg.wait_for_timeout(600);pg.evaluate("lnTrk(1)");pg.wait_for_timeout(500)
    def disabled(): return pg.evaluate("(()=>{const e=document.querySelector('.lnnav>.btn:last-child');return e?e.disabled:null})()")
    def gate(): return pg.evaluate("(()=>{const e=document.querySelector('.lngate');return e?e.textContent:''})()")
    def overflow(key,where):
        o=pg.evaluate("document.documentElement.scrollWidth-window.innerWidth")
        if o>2: bad(key,f'horizontal overflow {o}px at {where}')
    def shot(key,name):
        if key in SHOTS or 'all' in SHOTS:
            pg.evaluate("window.scrollTo(0,0);const m=document.getElementById('main');if(m)m.scrollTop=0")
            pg.screenshot(path=os.path.join(SP,f'shots_{TAG}_{key}_{name}.png'),full_page=True)
    for key in KEYS:
        print('==',key)
        pg.evaluate("(k)=>lnOpen('bp-'+k)",key);pg.wait_for_timeout(450)
        info=pg.evaluate("(k)=>{const m=LNM.find(x=>x.id==='bp-'+k);return{wo:!!m.wo,pages:m.bp.pages.length,guide:m.bp.guide,quiz:m.bp.quiz.length,slides:m.slides.length,min:m.min}}",key)
        G=info['guide'];n=info['pages']
        if info['slides']!=len(G)+1: bad(key,f'slides {info["slides"]} != steps+1 {len(G)+1}')
        # ---- Part 1
        if pg.evaluate("LN.step")!=0 or pg.evaluate("LN.mode")!='lesson': bad(key,'did not open on Part 1')
        if not disabled(): bad(key,'Part 1 Next should be disabled before the pages are viewed')
        if not gate().startswith('View every page'): bad(key,'Part 1 gate text wrong: '+gate())
        for i in range(n):
            pg.evaluate(f"lnDp({i})");pg.wait_for_timeout(40)
            if i<n-1 and not disabled(): bad(key,f'Part 1 Next enabled early (after page {i+1} of {n})');break
        pg.wait_for_timeout(150)
        if disabled(): bad(key,'Part 1 Next still disabled after viewing every page')
        shot(key,'p1')
        pg.click(".lnnav>.btn:last-child");pg.wait_for_timeout(350)
        # ---- walkthrough
        for si,st in enumerate(G,1):
            ttl=pg.evaluate("document.querySelector('.lnh2').textContent")
            if ttl.strip()!=st['t'].strip(): bad(key,f'step {si} heading {ttl!r} != {st["t"]!r}')
            if pg.evaluate("LN.step")!=si: bad(key,f'step index {pg.evaluate("LN.step")} != {si}')
            if not disabled(): bad(key,f'step {si}: Next should start disabled')
            g0=gate()
            if 'to continue' not in g0: bad(key,f'step {si}: gate text missing: {g0!r}')
            nacc=sum(len(bl['items']) for bl in st['b'] if bl['k']=='acc' and bl.get('req'))
            has_cp=any(bl['k']=='cp' for bl in st['b'])
            if nacc and 'dropdown' not in g0: bad(key,f'step {si}: gate text should mention dropdowns: {g0!r}')
            # dropdowns, one by one (pills + counter)
            heads=pg.locator('.lnach')
            cnt=heads.count()
            if cnt!=nacc+sum(len(bl['items']) for bl in st['b'] if bl['k']=='acc' and not bl.get('req')): bad(key,f'step {si}: {cnt} dropdown headers != {nacc}')
            for i in range(cnt):
                heads.nth(i).scroll_into_view_if_needed();heads.nth(i).click();pg.wait_for_timeout(60)
                if heads.nth(i).get_attribute('aria-expanded')!='true': bad(key,f'step {si} dropdown {i+1} did not open')
                pan=pg.evaluate("(i)=>{const e=document.querySelectorAll('.lnac')[i].querySelector('.lnacb');return e.getBoundingClientRect().height}",i)
                if pan<12: bad(key,f'step {si} dropdown {i+1} opened but has no height ({pan})')
                if i<cnt-1 and has_cp and not disabled(): bad(key,f'step {si}: Next enabled before all dropdowns opened')
            if cnt:
                pill=pg.evaluate("(()=>{const e=document.querySelector('.lnaccn');return e?e.textContent:''})()")
                if 'All opened' not in pill: bad(key,f'step {si}: pill after opening all = {pill!r}')
                heads.nth(0).click();pg.wait_for_timeout(40)   # collapse once: must stay counted
                pill=pg.evaluate("(()=>{const e=document.querySelector('.lnaccn');return e?e.textContent:''})()")
                if 'All opened' not in pill: bad(key,f'step {si}: collapsing a dropdown un-counted it')
                heads.nth(0).click();pg.wait_for_timeout(40)
                if has_cp and not disabled(): bad(key,f'step {si}: Next enabled before the quick check was answered')
            overflow(key,f'step {si} dropdowns')
            # think-it-through
            th=pg.locator('.lnthb');nth=th.count()
            for i in range(nth):
                th.nth(i).scroll_into_view_if_needed();th.nth(i).click();pg.wait_for_timeout(50)
                h=pg.evaluate("(i)=>document.querySelectorAll('.lnth')[i].querySelector('.lnthans').getBoundingClientRect().height",i)
                if h<12: bad(key,f'step {si} think {i+1}: answer not visible after the tap')
            # chat
            for bi,bl in enumerate(st['b']):
                pass
            cv=pg.locator('.lncva .btn');ncv=cv.count()
            for i in range(ncv):
                nlines=pg.evaluate("(i)=>{const k=document.querySelectorAll('[data-cv]')[i].getAttribute('data-cv');return lnCpB(k).lines.length}",i)
                for t in range(nlines-1):
                    cv.nth(i).click();pg.wait_for_timeout(40)
                got=pg.evaluate("(i)=>document.querySelectorAll('[data-cv]')[i].querySelectorAll('.lncb').length",i)
                if got!=nlines: bad(key,f'step {si} chat {i+1}: {got} bubbles shown, expected {nlines}')
                lbl=cv.nth(i).inner_text()
                if 'replay' not in lbl.lower(): bad(key,f'step {si} chat {i+1}: button says {lbl!r} at the end')
            # tiles + checklist (optional blocks)
            tl=pg.locator('.lnrv');nt=tl.count()
            for i in range(nt):
                tl.nth(i).scroll_into_view_if_needed();tl.nth(i).click();pg.wait_for_timeout(30)
            ck=pg.locator('.lnck button');nc=ck.count()
            for i in range(nc):
                ck.nth(i).scroll_into_view_if_needed();ck.nth(i).click();pg.wait_for_timeout(30)
            if (nt or nc) and has_cp and not disabled(): bad(key,f'step {si}: tiles/checklist must not unlock Next')
            # quick check: wrong then right
            if has_cp:
                cp=[bl for bl in st['b'] if bl['k']=='cp'][0]
                opts=pg.locator('.lncp button.lnq')
                if opts.count()!=3: bad(key,f'step {si}: quick check has {opts.count()} options')
                wrong=[i for i in range(3) if i!=cp['a']][0]
                opts.nth(wrong).scroll_into_view_if_needed();opts.nth(wrong).click();pg.wait_for_timeout(80)
                fb=pg.evaluate("(()=>{const e=document.querySelector('.lncp .lnfb.bad');return e?e.textContent:''})()")
                if 'Not quite' not in fb: bad(key,f'step {si}: no wrong-answer feedback ({fb!r})')
                if not disabled(): bad(key,f'step {si}: Next enabled after a wrong answer')
                if pg.evaluate("document.querySelector('.lncp button.lnq.bad')===null"): bad(key,f'step {si}: wrong option not marked')
                if si==1: shot(key,'wrong')
                opts=pg.locator('.lncp button.lnq')
                opts.nth(cp['a']).click();pg.wait_for_timeout(120)
                if disabled(): bad(key,f'step {si}: Next still disabled after the right answer')
                if not pg.evaluate("document.querySelector('.lnnav>.btn:last-child').classList.contains('rdy')"): bad(key,f'step {si}: Next has no ready pulse after unlocking')
            if si==1: shot(key,'s1done')
            overflow(key,f'step {si} done')
            lastb=pg.evaluate("document.querySelector('.lnnav>.btn:last-child').textContent")
            if si==len(G):
                want='Finish the section' if info['wo'] else 'Start the final quiz'
                if want not in lastb: bad(key,f'last step button says {lastb!r}, wanted {want!r}')
            pg.click(".lnnav>.btn:last-child");pg.wait_for_timeout(250)
        # ---- end of the section
        if info['wo']:
            mode=pg.evaluate("LN.mode");res=pg.evaluate("LN.res")
            if mode!='result' or not res or not res.get('pass'): bad(key,f'walkthrough-only section did not finish: mode={mode} res={res}')
        else:
            if pg.evaluate("LN.mode")!='quiz': bad(key,'quiz did not start: '+pg.evaluate("LN.mode"))
            nq=pg.evaluate("LN.qs.length")
            if nq!=info['quiz']: bad(key,f'quiz length {nq} != {info["quiz"]}')
            def run_quiz(right):
                for qi in range(nq):
                    idx=pg.evaluate("(r)=>LN.qs[LN.qi].o.findIndex(o=>o.ok===r)",right)
                    pg.locator('.lnqo button.lnq').nth(idx).scroll_into_view_if_needed();pg.locator('.lnqo button.lnq').nth(idx).click();pg.wait_for_timeout(70)
                    fb=pg.evaluate("(()=>{const e=document.querySelector('.lnsl .lnfb');return e?e.textContent:''})()")
                    if right and 'Correct' not in fb: bad(key,f'quiz q{qi+1}: right answer gave {fb!r}')
                    if not right:
                        if 'Not quite' not in fb: bad(key,f'quiz q{qi+1}: wrong answer gave {fb!r}')
                        hasq=pg.evaluate("LN.qs[LN.qi].p!=null")
                        if hasq and pg.locator('.lnpgchip, .lnchip, [class*=chip]').count()==0: bad(key,f'quiz q{qi+1}: no page chip after a wrong answer')
                    if qi==0 and not right: shot(key,'quizwrong')
                    pg.click(".lnnav .btn");pg.wait_for_timeout(120)
            if FAIL:
                run_quiz(False)
                res=pg.evaluate("LN.res")
                if pg.evaluate("LN.mode")!='result' or res['pass']: bad(key,'all-wrong quiz should fail')
                txt=pg.evaluate("document.querySelector('.lnh2').textContent")
                if 'Not yet' not in txt: bad(key,f'fail screen heading {txt!r}')
                shot(key,'fail')
                if pg.evaluate("lnRec(WHO,'bp-'+%s)"%json.dumps(key)): bad(key,'a failed quiz stored a record')
                pg.click("text=Retry quiz");pg.wait_for_timeout(250)
            run_quiz(True)
            res=pg.evaluate("LN.res")
            if pg.evaluate("LN.mode")!='result' or not res['pass']: bad(key,f'all-right quiz should pass: {res}')
        shot(key,'result')
        rec=pg.evaluate("(k)=>lnRec(WHO,'bp-'+k)",key)
        if not rec: bad(key,'no learning record after finishing')
        else: print('   record',{k:rec.get(k) for k in('sc','n','xp')},'steps',len(G),'quiz',info['quiz'])
        # re-open: should show the document first and, once cleared, no gates
        pg.evaluate("lnBack()");pg.wait_for_timeout(200)
    print('page errors:',[e for e in errs if not e.startswith('HTTP 404 ') or True][:8] or 'none')
    print('ISSUES:',len(issues))
    for x in issues: print(' ',x)
    b.close()
sys.exit(1 if issues else 0)
