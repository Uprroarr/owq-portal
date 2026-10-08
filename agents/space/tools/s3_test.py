import sys,os,time
from playwright.sync_api import sync_playwright
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
F='file://'+SP+'/agents/space/out/portal_m.html';O=SP+'/agents/space/shots/'
sys.path.insert(0,SP);import lgx
res=[]
def ok(c,m):res.append(('PASS ' if c else 'FAIL ')+m);print(res[-1])
Q="({paused:LB.au&&LB.au.paused,muted:LB.au&&LB.au.muted,vol:LB.au&&LB.au.volume,t:LB.au&&LB.au.currentTime,hint:!!document.querySelector('#gxshint.on'),off:LB.off})"
EMU="""(()=>{window.__act=false;['pointerdown','keydown','touchend','mousedown'].forEach(e=>addEventListener(e,()=>{window.__act=true},true));const P=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(!this.muted&&!window.__act)return Promise.reject(new DOMException('blocked','NotAllowedError'));return P.call(this)}})()"""
def run(policy,pre=None,W=1366,H=860,body=None,touch=False):
    with sync_playwright() as p:
        a=['--no-sandbox','--no-proxy-server','--disable-webgl','--autoplay-policy=no-user-gesture-required']
        b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=a)
        ctx=b.new_context(viewport={'width':W,'height':H},has_touch=touch,is_mobile=touch)
        if pre:ctx.add_init_script(pre)
        if not policy:ctx.add_init_script(EMU)
        ctx.add_init_script("try{localStorage.owq_gq='still'}catch(e){}")
        pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
        pg.goto(F);pg.wait_for_timeout(3500)
        body(pg);ok(not errs,'no page errors '+str(errs[:2]));b.close()
def t_default(pg):
    s=pg.evaluate(Q);ok(s['paused']==False and s['muted']==True,'default policy: playing muted at load %s'%s)
    ok(s['hint'],'hint visible');pg.screenshot(path=O+'s3_hint_desktop.png')
    t1=pg.evaluate("LB.au.currentTime");pg.wait_for_timeout(1000);t2=pg.evaluate("LB.au.currentTime");ok(t2>t1,'position advances while muted')
    pg.click('#gxlist .gxo:nth-child(2)') if False else None
    pg.mouse.click(700,300);pg.wait_for_timeout(250);m=pg.evaluate(Q);ok(m['muted']==False and m['vol']<.7,'unmuted, fading in %s'%m)
    pg.wait_for_timeout(900);m=pg.evaluate(Q);ok(abs(m['vol']-.7)<.02 and not m['hint'] and m['t']>t2,'vol .7, hint hidden, no restart %s'%m)
def t_click_pick(pg):
    pg.click('#gxlist .gxo:nth-child(2)');pg.wait_for_timeout(500)
    ok(pg.evaluate("GXU.U.names[GXU.U.sel]")==pg.evaluate("GXU.U.names[1]") and pg.evaluate(Q)['muted']==False,'first click on operator both picks and unmutes; state=%s'%pg.evaluate("GXU.state()"))
    pg.evaluate("lobbyStop()");pg.wait_for_timeout(1500);s=pg.evaluate(Q);ok(s['paused'],'lobbyStop pauses')
def t_auto(pg):
    s=pg.evaluate(Q);ok(s['paused']==False and s['muted']==False and not s['hint'],'autoplay allowed: audible from load, no hint %s'%s)
def t_toggle(pg):
    pg.click('#gxstat .gxsmus');pg.wait_for_timeout(300);s=pg.evaluate(Q);ok(s['off']==1 and s['paused'],'toggle off pauses %s'%s)
    pg.mouse.click(700,300);pg.wait_for_timeout(300);s=pg.evaluate(Q);ok(s['paused'] and not s['hint'],'clicks do not restart when off')
    pg.reload();pg.wait_for_timeout(3000);s=pg.evaluate(Q);ok(s['off']==1 and not s['au'] if 'au' in s else (s['paused'] in (None,True)) and not s['hint'],'off remembered after reload %s'%s)
    pg.click('#gxstat .gxsmus');pg.wait_for_timeout(400);s=pg.evaluate(Q);ok(s['off']==0 and s['paused']==False,'toggle on plays %s'%s)
def t_phone(pg):
    s=pg.evaluate(Q);ok(s['hint'],'phone hint visible');pg.screenshot(path=O+'s3_hint_phone.png')
    r=pg.evaluate("(()=>{const h=document.getElementById('gxshint').getBoundingClientRect(),l=document.querySelector('.gxmenu').getBoundingClientRect(),s=document.getElementById('gxstat').getBoundingClientRect();return [h.top,h.bottom,l.bottom,s.top,h.left,h.right,innerWidth,document.documentElement.scrollWidth]})()")
    ok(r[1]<=r[2]-1 and r[4]>=0 and r[5]<=r[6] and r[7]<=r[6],'phone hint clear of list and status row %s'%r)
run(False,body=t_default)
run(False,body=t_click_pick)
run(True,body=t_auto)
run(False,body=t_toggle)
run(False,W=390,H=844,touch=True,body=t_phone)
print('FAILS',[r for r in res if r.startswith('FAIL')])
