import sys,os,json
from playwright.sync_api import sync_playwright
import lgx
W=int(os.environ.get('W',390));H=int(os.environ.get('H',844))
F='http://127.0.0.1:8765/owq-command-station-v2.html'
specs=[a.split(':') for a in sys.argv[1:]]  # key:step[:scrollToSelector]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
    ctx=b.new_context(viewport={'width':W,'height':H},device_scale_factor=1,is_mobile=True,has_touch=True);ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append('PE '+str(e)[:300]))
    pg.goto(F);pg.wait_for_timeout(2500);lgx.login(pg,6)
    pg.evaluate("openTab('Learning Network')");pg.wait_for_timeout(500);pg.evaluate("lnTrk(1)");pg.wait_for_timeout(400)
    JS="""(a)=>{const m=LNM.find(x=>x.id===a[0]);m.bp.pages.forEach((p,i)=>LN.sn[m.id+':0:p'+i]=1);for(let si=1;si<a[1];si++){m.bp.guide[si-1].b.forEach((b,bi)=>{if(b.k==='cp')LN.sn[m.id+':'+si+':c'+bi]=1})}LN.mode='lesson';LN.step=a[1];LN.anim=0;lnR(1)}"""
    for sp in specs:
        key,si=sp[0],int(sp[1]);off=int(sp[2]) if len(sp)>2 else 0
        pg.evaluate(f"lnOpen('bp-{key}')");pg.wait_for_timeout(250)
        pg.evaluate(JS,['bp-'+key,si]);pg.wait_for_timeout(200)
        pg.evaluate("(o)=>{const m=document.getElementById('main');if(m)m.scrollTop=o;window.scrollTo(0,o)}",off);pg.wait_for_timeout(120)
        pg.screenshot(path=f'mob_{key}_{si}_{off}.png')
    print(errs[:3] or 'ok');b.close()
