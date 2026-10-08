import sys,os,json,time
from playwright.sync_api import sync_playwright
import lgx,bpdrive
KEY=sys.argv[1] if len(sys.argv)>1 else 'code-of-conduct'
WRONG=os.environ.get('WRONG','1')=='1'
SHOTS=os.environ.get('SHOTS','1')=='1'
W=int(os.environ.get('W',1366));H=int(os.environ.get('H',860))
F=os.environ.get('OWQ_URL','http://127.0.0.1:8765/owq-command-station-v2.html')
tag=os.environ.get('TAG','bpf')
def shot(pg,name):
    if SHOTS: pg.screenshot(path=f'{tag}_{name}.png')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
    ctx=b.new_context(viewport={'width':W,'height':H});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append('PE '+str(e)[:300]))
    pg.on('console',lambda m:errs.append('CE '+m.text[:200]) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
    badr=[];pg.on('response',lambda r: badr.append((r.status,r.url[:120])) if r.status>=400 else None)
    pg.goto(F);pg.wait_for_timeout(2500)
    lgx.login(pg,6)  # owner
    print('who',pg.evaluate("[WHO,lnOwner()]"))
    M=bpdrive.mod(pg,KEY);print('module',json.dumps({k:v for k,v in M.items() if k!='guide'}),'steps',len(M['guide']))
    D=bpdrive.data(pg,KEY)
    pg.evaluate("openTab('Learning Network')");pg.wait_for_timeout(600);pg.evaluate("lnTrk(1)");pg.wait_for_timeout(500)
    shot(pg,'map')
    pg.evaluate(f"lnOpen('bp-{KEY}')");pg.wait_for_timeout(600);shot(pg,'s0')
    problems=[]
    # --- part 1: document
    n=M['pages']
    disabled=pg.evaluate("[...document.querySelectorAll('.lnnav .btn')].map(b=>b.disabled)")
    print('doc step: pages',n,'next disabled',disabled)
    for i in range(n):
        pg.evaluate(f"lnDp({i})");pg.wait_for_timeout(80)
    print('after viewing all pages: gate',pg.evaluate("[lnRvN(),lnNeed(LNM.find(x=>x.id==='bp-%s'),0)]"%KEY),'next disabled',pg.evaluate("[...document.querySelectorAll('.lnnav .btn')].map(b=>b.disabled)"))
    pg.click(".lnnav .btn:not(.o)");pg.wait_for_timeout(300)
    print('step now',pg.evaluate("LN.step"))
    # --- part 2: walkthrough
    for si in range(1,len(D['guide'])+1):
        st=pg.evaluate("LN.step")
        assert st==si,(st,si)
        if si in (1,2) or si==len(D['guide']): shot(pg,f's{si}')
        # gate must hold the Next button while checkpoints are open
        need=pg.evaluate("lnNeed(LNM.find(x=>x.id==='bp-%s'),%d)"%(KEY,si))
        dis=pg.evaluate("document.querySelector('.lnnav .btn:not(.o)').disabled")
        if need and not dis: problems.append(f'step {si}: Next enabled before gate cleared')
        problems+=bpdrive.do_step(pg,KEY,si,D,wrong=WRONG)
        dis=pg.evaluate("document.querySelector('.lnnav .btn:not(.o)').disabled")
        if dis: problems.append(f'step {si}: Next still disabled after clearing all gates; got/need='+str(pg.evaluate("[lnRvN(),lnNeed(LNM.find(x=>x.id==='bp-%s'),%d)]"%(KEY,si))))
        if si==2: shot(pg,'s2done')
        pg.click(".lnnav .btn:not(.o)");pg.wait_for_timeout(250)
    print('walkthrough problems:',problems or 'none')
    if M['wo']:
        print('mode',pg.evaluate("LN.mode"),'res',pg.evaluate("JSON.stringify(LN.res)"));shot(pg,'result')
    else:
        print('mode',pg.evaluate("LN.mode"),'qs',pg.evaluate("LN.qs.length"));shot(pg,'q0')
        nq=pg.evaluate("LN.qs.length")
        for qi in range(nq):
            ci=pg.evaluate("LN.qs[LN.qi].o.findIndex(o=>o.ok)")
            pg.click(f".lnqo .lnq >> nth={ci}");pg.wait_for_timeout(40)
            if qi==0: shot(pg,'q0a')
            pg.click(".lnnav .btn");pg.wait_for_timeout(120)
        print('result',pg.evaluate("JSON.stringify(LN.res)"));shot(pg,'result')
    print('record',pg.evaluate("JSON.stringify(lnRec(WHO,'bp-%s'))"%KEY))
    print('errors',errs[:6] or 'none')
    print('bad responses',badr[:6] or 'none')
    b.close()
