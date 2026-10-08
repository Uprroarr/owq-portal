import sys,json
from playwright.sync_api import sync_playwright
import lgx,bpdrive
KEY='code-of-conduct'
F='http://127.0.0.1:8765/owq-command-station-v2.html'
def setup(pg):
    pg.evaluate("""()=>{const now=Date.now();LNM.filter(m=>!m.tr&&!m.auto).forEach(m=>{if(!lnRec(WHO,m.id))D.learn.push({_i:'ln_t_'+m.id,_t:now*1000,u:WHO,m:m.id,sc:4,n:4,xp:150,ts:now})});
      if(!(D.lnreq||[]).some(r=>r.u===WHO))(D.lnreq=D.lnreq||[]).push({_i:'bp_'+WHO.replace(/ /g,'_'),_t:now*1000,u:WHO,st:'approved',at:now,by:'Agency Owner',dt:now});save()}""")
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
    ctx=b.new_context(viewport={'width':1366,'height':860});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append('PE '+str(e)[:300]))
    pg.goto(F);pg.wait_for_timeout(2500);lgx.login(pg,1)
    print('agent',pg.evaluate("[WHO,lnOwner()]"));setup(pg)
    D=bpdrive.data(pg,KEY)
    pg.evaluate("LN.trk=null;openTab('Learning Network')");pg.wait_for_timeout(700);pg.evaluate("lnTrk(1)");pg.wait_for_timeout(400)
    print('open?',pg.evaluate("lnBpOpen(WHO,lnStates(WHO))"),'first module state',pg.evaluate("JSON.stringify(lnStates(WHO)['bp-code-of-conduct'])"))
    pg.evaluate(f"lnOpen('bp-{KEY}')");pg.wait_for_timeout(500)
    n=len(D['pages'])
    for i in range(n): pg.evaluate(f"lnDp({i})");pg.wait_for_timeout(60)
    pg.click(".lnnav .btn:not(.o)");pg.wait_for_timeout(250)
    for si in (1,2,3):
        probs=bpdrive.do_step(pg,KEY,si,D,wrong=True)
        if probs: print('problems',si,probs)
        pg.click(".lnnav .btn:not(.o)");pg.wait_for_timeout(250)
    print('before reload: step',pg.evaluate("LN.step"),'sn keys',pg.evaluate("Object.keys(LN.sn).length"))
    store=pg.evaluate("(()=>{try{return Object.keys(JSON.parse(localStorage.getItem('owq_lnbp1')||'{}'))}catch(e){return 'err'}})()")
    print('progress store users',store)
    # reload and log back in as the same agent
    pg.reload();pg.wait_for_timeout(2500);lgx.login(pg,1)
    print('after reload who',pg.evaluate("WHO"))
    pg.evaluate("LN.trk=null;openTab('Learning Network')");pg.wait_for_timeout(700);pg.evaluate("lnTrk(1)");pg.wait_for_timeout(400)
    pg.evaluate(f"lnOpen('bp-{KEY}')");pg.wait_for_timeout(600)
    print('resumed step',pg.evaluate("LN.step"),'| expected 4 | pages viewed',pg.evaluate("[...Array(%d).keys()].filter(i=>LN.sn['bp-%s:0:p'+i]).length"%(n,KEY)),'| cp cleared in step 1..3',pg.evaluate("Object.keys(LN.sn).filter(k=>/^bp-%s:[123]:c/.test(k)).length"%KEY))
    # owner must not inherit the agent's progress
    pg.evaluate("lockView()");pg.wait_for_timeout(1200);lgx.login(pg,6);pg.wait_for_timeout(1500)
    pg.evaluate("LN.trk=null;openTab('Learning Network')");pg.wait_for_timeout(700);pg.evaluate("lnTrk(1)");pg.wait_for_timeout(400)
    pg.evaluate(f"lnOpen('bp-{KEY}')");pg.wait_for_timeout(600)
    print('owner who',pg.evaluate("WHO"),'step',pg.evaluate("LN.step"),'| expected 0 | sn',pg.evaluate("Object.keys(LN.sn).length"))
    # back to the agent: finish the module
    pg.evaluate("lockView()");pg.wait_for_timeout(1200);lgx.login(pg,1);pg.wait_for_timeout(1500)
    pg.evaluate("LN.trk=null;openTab('Learning Network')");pg.wait_for_timeout(700);pg.evaluate("lnTrk(1)");pg.wait_for_timeout(400)
    pg.evaluate(f"lnOpen('bp-{KEY}')");pg.wait_for_timeout(600)
    st=pg.evaluate("LN.step");print('agent resumed again at',st)
    for si in range(st,len(D['guide'])+1):
        probs=bpdrive.do_step(pg,KEY,si,D,wrong=False)
        if probs: print('problems',si,probs)
        pg.click(".lnnav .btn:not(.o)");pg.wait_for_timeout(200)
    nq=pg.evaluate("LN.qs.length")
    for qi in range(nq):
        ci=pg.evaluate("LN.qs[LN.qi].o.findIndex(o=>o.ok)")
        pg.click(f".lnqo .lnq >> nth={ci}");pg.wait_for_timeout(40);pg.click(".lnnav .btn");pg.wait_for_timeout(100)
    print('result',pg.evaluate("JSON.stringify(LN.res)"))
    print('record',pg.evaluate("JSON.stringify(lnRec(WHO,'bp-%s'))"%KEY))
    print('next module state',pg.evaluate("JSON.stringify(lnStates(WHO)['bp-leadership-guide'])"),'| total xp',pg.evaluate("lnXP(WHO)"))
    print('errors',errs[:4] or 'none');b.close()
