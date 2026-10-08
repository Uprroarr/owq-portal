"""crm test helpers (never prints access codes)."""
import sys,os,json,time
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
CRM=SP+'/agents/crm'
sys.path.insert(0,SP);sys.path.insert(0,SP+'/mr')
import lgx
from playwright.sync_api import sync_playwright
ARGS=['--no-sandbox','--disable-webgl','--no-proxy-server']
def wrap(src,dst):
    h=open(src,encoding='utf-8').read()
    open(dst,'w',encoding='utf-8').write('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+h+'</body></html>')
    return 'file://'+dst
def launch(p,vp=(1440,900),mobile=False,init=None,when=None):
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=ARGS)
    ctx=b.new_context(viewport={'width':vp[0],'height':vp[1]},**({'is_mobile':True,'has_touch':True,'device_scale_factor':2} if mobile else {}))
    ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    if when:
        import mrt;ctx.add_init_script(mrt.shift_js(*when))
    for s in (init or []):ctx.add_init_script(s)
    return b,ctx
def page(ctx,errs):
    pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append('PE '+str(e)[:400]))
    pg.on('console',lambda m:errs.append(m.type+' '+m.text[:300]) if m.type=='error' and 'ERR_TUNNEL' not in m.text and 'favicon' not in m.text and 'Failed to load resource' not in m.text else None)
    return pg
def open_portal(pg,url,idx=6,wait=2500):
    pg.goto(url,timeout=180000);pg.wait_for_timeout(wait)
    lgx.login(pg,idx);pg.wait_for_timeout(1500)
