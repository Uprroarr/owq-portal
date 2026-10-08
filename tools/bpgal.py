import sys,os,json
from playwright.sync_api import sync_playwright
import lgx,bpdrive
KEY=sys.argv[1];STEPS=[int(x) for x in sys.argv[2].split(',')]
W=int(os.environ.get('W',1366));H=int(os.environ.get('H',860));tag=os.environ.get('TAG','gal')
F='http://127.0.0.1:8765/owq-command-station-v2.html'
def shots(pg,si,suf,D):
    for bi,bl in enumerate(D['guide'][si-1]['b']):
        if bl['k']=='cp':
            pg.evaluate("(id)=>{const e=document.getElementById(id),m=document.getElementById('main');const r=e.getBoundingClientRect();m.scrollTop+=r.top-110}",f'cp_{si}_{bi}')
            pg.wait_for_timeout(120)
            pg.screenshot(path=f'{tag}_{KEY}_{si}_{bi}{suf}.png')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
    ctx=b.new_context(viewport={'width':W,'height':H});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append('PE '+str(e)[:300]))
    pg.goto(F);pg.wait_for_timeout(2500);lgx.login(pg,6)
    D=bpdrive.data(pg,KEY)
    pg.evaluate("openTab('Learning Network')");pg.wait_for_timeout(500);pg.evaluate("lnTrk(1)");pg.wait_for_timeout(400)
    pg.evaluate(f"lnOpen('bp-{KEY}')");pg.wait_for_timeout(400)
    for si in STEPS:
        pg.evaluate("""(a)=>{const m=LNM.find(x=>x.id===a[0]);m.bp.pages.forEach((p,i)=>LN.sn[m.id+':0:p'+i]=1);for(let si=1;si<a[1];si++){m.bp.guide[si-1].b.forEach((b,bi)=>{if(b.k==='cp')LN.sn[m.id+':'+si+':c'+bi]=1})}LN.step=a[1];LN.anim=0;lnR(1)}""",['bp-'+KEY,si])
        pg.wait_for_timeout(300)
        shots(pg,si,'a',D)
        st=D['guide'][si-1]
        for bi,bl in enumerate(st['b']):
            if bl['k']=='cp':
                k=f"bp-{KEY}:{si}:c{bi}";r=bpdrive.wrong_first(pg,f"cp_{si}_{bi}",bl,k);print(si,bi,bl['type'],'wrong feedback shown:',r)
        pg.wait_for_timeout(300)
        shots(pg,si,'b',D)
    print(errs[:5] or 'no errors');b.close()
