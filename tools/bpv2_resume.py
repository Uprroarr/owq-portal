"""Regular agent: progress is kept per user across a reload (owq_lnbp2), the owner does not inherit it, and the agent can finish and unlock the next section."""
import sys,json
from playwright.sync_api import sync_playwright
import lgx
KEY='code-of-conduct';NEXT='bp-leadership-guide'
F='http://127.0.0.1:8765/owq-command-station-v2.html'
bad=[]
def chk(cond,msg):
    if not cond: bad.append(msg);print('  !!',msg)
def setup(pg):
    pg.evaluate("""()=>{const now=Date.now();LNM.filter(m=>!m.tr&&!m.auto).forEach(m=>{if(!lnRec(WHO,m.id))D.learn.push({_i:'ln_t_'+m.id,_t:now*1000,u:WHO,m:m.id,sc:4,n:4,xp:150,ts:now})});
      if(!(D.lnreq||[]).some(r=>r.u===WHO))(D.lnreq=D.lnreq||[]).push({_i:'bp_'+WHO.replace(/ /g,'_'),_t:now*1000,u:WHO,st:'approved',at:now,by:'Agency Owner',dt:now});save()}""")
def to_bp(pg):
    pg.evaluate("LN.trk=null;openTab('Learning Network')");pg.wait_for_timeout(700);pg.evaluate("lnTrk(1)");pg.wait_for_timeout(400)
def do_step(pg,st,wrong=False,partial=0):
    heads=pg.locator('.lnach');cnt=heads.count()
    for i in range(cnt if not partial else partial):
        heads.nth(i).scroll_into_view_if_needed();heads.nth(i).click();pg.wait_for_timeout(50)
    if partial: return
    cp=[bl for bl in st['b'] if bl['k']=='cp'][0]
    if wrong:
        w=[i for i in range(3) if i!=cp['a']][0]
        pg.locator('.lncp button.lnq').nth(w).click();pg.wait_for_timeout(60)
    pg.locator('.lncp button.lnq').nth(cp['a']).click();pg.wait_for_timeout(100)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
    ctx=b.new_context(viewport={'width':1366,'height':860});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append('PE '+str(e)[:300]))
    pg.goto(F);pg.wait_for_timeout(2500);lgx.login(pg,1)
    print('agent',pg.evaluate("[WHO,lnOwner()]"));setup(pg);to_bp(pg)
    chk(not pg.evaluate("lnOwner()"),'agent index 1 should not be the owner')
    st0=pg.evaluate("JSON.stringify(lnStates(WHO).find(x=>x.m.id==='bp-code-of-conduct'))")
    print('first module state',json.loads(st0).get('unlocked'))
    G=pg.evaluate("LNM.find(x=>x.id==='bp-%s').bp.guide"%KEY);n=pg.evaluate("LNM.find(x=>x.id==='bp-%s').bp.pages.length"%KEY)
    pg.evaluate(f"lnOpen('bp-{KEY}')");pg.wait_for_timeout(500)
    chk(pg.evaluate("LN.step")==0,'opens on Part 1')
    for i in range(n): pg.evaluate(f"lnDp({i})");pg.wait_for_timeout(40)
    pg.click(".lnnav .btn:not(.o)");pg.wait_for_timeout(250)
    for si in (1,2):
        do_step(pg,G[si-1],wrong=True)
        pg.click(".lnnav>.btn:last-child");pg.wait_for_timeout(250)
    do_step(pg,G[2],partial=2)   # open only 2 dropdowns of step 3
    need=pg.evaluate("lnNeed(LNM.find(x=>x.id==='bp-%s'),3)"%KEY)
    print('before reload: step',pg.evaluate("LN.step"),'sn keys',pg.evaluate("Object.keys(LN.sn).length"),'step-3 need',need,'got',pg.evaluate("lnRvN()"))
    store=pg.evaluate("(()=>{try{return Object.keys(JSON.parse(localStorage.getItem('owq_lnbp2')||'{}'))}catch(e){return 'err'}})()")
    print('progress store users',store)
    chk(isinstance(store,list) and len(store)==1,'one user stored in owq_lnbp2')
    pg.reload();pg.wait_for_timeout(2500);lgx.login(pg,1)
    chk(pg.evaluate("WHO")==store[0] if isinstance(store,list) and store else False,'same user after reload')
    to_bp(pg);pg.evaluate(f"lnOpen('bp-{KEY}')");pg.wait_for_timeout(700)
    step=pg.evaluate("LN.step");pages=pg.evaluate("[...Array(%d).keys()].filter(i=>LN.sn['bp-%s:0:p'+i]).length"%(n,KEY))
    cps=pg.evaluate("Object.keys(LN.sn).filter(k=>/^bp-%s:[12]:c/.test(k)).length"%KEY)
    got=pg.evaluate("lnRvN()")
    print('resumed step',step,'| pages viewed',pages,'/',n,'| cp cleared steps 1-2:',cps,'| step-3 dropdowns opened',got)
    chk(step==3,f'resume step {step} != 3');chk(pages==n,'pages viewed not restored');chk(cps==2,'quick checks of steps 1-2 not restored');chk(got==2,f'step-3 opened dropdowns restored {got} != 2')
    pill=pg.evaluate("(()=>{const e=document.querySelector('.lnaccn');return e?e.textContent:''})()")
    print('pill',pill);chk('2 of' in pill,'pill does not show 2 opened')
    chk(pg.evaluate("document.querySelectorAll('.lnac.v').length")==2,'two dropdowns should show the read check after resume')
    chk(pg.evaluate("document.querySelectorAll('.lnac.v .lnach em')[0].textContent.trim()")=='\u2713','read check mark missing')
    # the owner must not inherit the agent's progress
    pg.evaluate("lockView()");pg.wait_for_timeout(1200);lgx.login(pg,6);pg.wait_for_timeout(1500)
    to_bp(pg);pg.evaluate(f"lnOpen('bp-{KEY}')");pg.wait_for_timeout(600)
    print('owner who',pg.evaluate("WHO"),'step',pg.evaluate("LN.step"),'sn',pg.evaluate("Object.keys(LN.sn).length"))
    okeys=pg.evaluate("Object.keys(LN.sn)")
    chk(pg.evaluate("LN.step")==0 and all(k.endswith(':0:p0') for k in okeys),f'owner inherited the agent progress {okeys}')
    # back to the agent: finish the module
    pg.evaluate("lockView()");pg.wait_for_timeout(1200);lgx.login(pg,1);pg.wait_for_timeout(1500)
    to_bp(pg);pg.evaluate(f"lnOpen('bp-{KEY}')");pg.wait_for_timeout(600)
    st=pg.evaluate("LN.step");print('agent resumed again at',st);chk(st==3,'agent resumed again at 3')
    for si in range(st,len(G)+1):
        do_step(pg,G[si-1],wrong=False)
        pg.click(".lnnav>.btn:last-child");pg.wait_for_timeout(250)
    chk(pg.evaluate("LN.mode")=='quiz','quiz should start')
    nq=pg.evaluate("LN.qs.length")
    for qi in range(nq):
        ci=pg.evaluate("LN.qs[LN.qi].o.findIndex(o=>o.ok)")
        pg.click(f".lnqo .lnq >> nth={ci}");pg.wait_for_timeout(40);pg.click(".lnnav .btn");pg.wait_for_timeout(100)
    res=pg.evaluate("LN.res");print('result',res)
    chk(res and res['pass'],'quiz not passed')
    print('record',pg.evaluate("JSON.stringify(lnRec(WHO,'bp-%s'))"%KEY))
    nxt=pg.evaluate("JSON.stringify(lnStates(WHO).find(x=>x.m.id==='%s'))"%NEXT)
    print('next module unlocked:',json.loads(nxt).get('unlocked'),'| total xp',pg.evaluate("lnXP(WHO)"))
    chk(json.loads(nxt).get('unlocked'),'next Blueprint module did not unlock')
    # once cleared, the walkthrough no longer gates (review mode)
    pg.evaluate(f"lnOpen('bp-{KEY}')");pg.wait_for_timeout(500)
    pg.evaluate("LN.step=2;LN.mode='lesson';lnR(1)");pg.wait_for_timeout(300)
    chk(pg.evaluate("document.querySelector('.lnnav>.btn:last-child').disabled")==False,'cleared section still gates the walkthrough')
    print('errors',errs[:4] or 'none');print('PROBLEMS',bad or 'none');b.close()
sys.exit(1 if bad else 0)
