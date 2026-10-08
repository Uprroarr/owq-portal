import sys,os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORTAL=os.environ.get('NF_PORTAL',SP+'/agents/fx/out/portal.html')
def open_portal(p,w=1440,h=900,idx=6,pre='',extra_init='',iso=True):
    b=p.chromium.launch(executable_path=None,args=['--no-sandbox','--disable-webgl','--no-proxy-server']) if False else p.chromium.launch(args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
    ctx=b.new_context(viewport={'width':w,'height':h},is_mobile=(w<600),has_touch=(w<600),device_scale_factor=1)
    ctx.add_init_script("try{localStorage.owq_gq='still';%s}catch(e){}"%pre)
    pg=ctx.new_page()
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto('file://'+PORTAL);pg.wait_for_timeout(2500)
    lgx.login(pg,idx)
    if iso: pg.evaluate("(()=>{const o=pushAlert;pushAlert=function(a,q){return /Policy issued|Chargeback|Quota at|New lead|T\\d/.test(a.t)?o(a,q):null}})()");pg.wait_for_timeout(300)
    return b,pg,errs
