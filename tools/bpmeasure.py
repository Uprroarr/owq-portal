import sys,os,json
from playwright.sync_api import sync_playwright
import lgx
KEY='code-of-conduct';W=int(os.environ.get('W',1366));H=int(os.environ.get('H',860))
F='http://127.0.0.1:8765/owq-command-station-v2.html'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
    ctx=b.new_context(viewport={'width':W,'height':H});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    pg=ctx.new_page();pg.goto(F);pg.wait_for_timeout(2500);lgx.login(pg,6)
    pg.evaluate("openTab('Learning Network')");pg.wait_for_timeout(500);pg.evaluate("lnTrk(1)");pg.wait_for_timeout(400)
    pg.evaluate(f"lnOpen('bp-{KEY}')");pg.wait_for_timeout(400)
    pg.evaluate("""(a)=>{const m=LNM.find(x=>x.id===a[0]);m.bp.pages.forEach((p,i)=>LN.sn[m.id+':0:p'+i]=1);for(let si=1;si<a[1];si++){m.bp.guide[si-1].b.forEach((b,bi)=>{if(b.k==='cp')LN.sn[m.id+':'+si+':c'+bi]=1})}LN.step=a[1];LN.anim=0;lnR(1)}""",['bp-'+KEY,3])
    pg.wait_for_timeout(300)
    print(json.dumps(pg.evaluate("""()=>{const q=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();const c=getComputedStyle(e);return {x:Math.round(r.x),w:Math.round(r.width),ws:c.whiteSpace,disp:c.display,gtc:c.gridTemplateColumns,minw:c.minWidth,ov:c.overflow}};
    return {main:q('#main'),lnb:q('#lnb'),sl:q('.lnsl'),cp:q('.lncp'),mt:q('.lnmt'),ml:q('.lnml'),mr:q('.lnmr'),btnL:q('.lnml button'),btnR:q('.lnmr button'),spanR:q('.lnmr button span'),vw:innerWidth}}"""),indent=1))
    b.close()
