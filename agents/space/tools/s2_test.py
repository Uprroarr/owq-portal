#!/usr/bin/env python3
"""space S2 end-to-end: pick -> land -> wrong code (deny) -> back -> pick -> right code -> black-hole fall -> portal.  MODE=normal|low|still|rm|gl1|nogl|lost  W,H"""
import os,sys,time,json
from playwright.sync_api import sync_playwright
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
F=os.path.abspath(sys.argv[1] if len(sys.argv)>1 else SP+'/agents/space/out/portal.html')
OUT=sys.argv[2] if len(sys.argv)>2 else SP+'/agents/space/shots/s2'
MODE=os.environ.get('MODE','normal');W=int(os.environ.get('W',640));H=int(os.environ.get('H',360))
os.makedirs(OUT,exist_ok=True)
args=['--no-sandbox','--no-proxy-server','--autoplay-policy=no-user-gesture-required','--disable-background-networking','--no-first-run']
if MODE=='nogl':args+=['--disable-webgl','--disable-webgl2']
else:args+=['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
fails=[];notes=[]
def ok(c,m):(notes if c else fails).append(('PASS ' if c else 'FAIL ')+m)
REC="""(()=>{window.__r={hud:[],dir:[],ui:[],cb:0,shots:[]};let a='',b='';setInterval(()=>{try{const u=GXU.state(),d=(window.GX&&GX.dir)?GX.dir.state():'';
 if(u!==a){a=u;__r.ui.push([u,performance.now()])}if(d!==b){b=d;__r.dir.push([d,performance.now(),window.GX?GX.time():0])}
 const h=document.getElementById('gxhud');const t=h&&h.classList.contains('on')?h.innerText.replace(/\\s+/g,' ').trim():'';
 if(t&&(!__r.hud.length||__r.hud[__r.hud.length-1][0]!==t))__r.hud.push([t,performance.now()])}catch(e){}},30)})()"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=args)
    ctx=b.new_context(viewport={'width':W,'height':H},reduced_motion='reduce' if MODE=='rm' else 'no-preference')
    if MODE=='gl1':ctx.add_init_script("(()=>{const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,a){if(t==='webgl2')return null;return g.call(this,t,a)}})()")
    if MODE in('low','still'):ctx.add_init_script("try{localStorage.setItem('owq_gq','%s')}catch(e){}"%MODE)
    ctx.add_init_script("window.__sfx=0")
    pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)[:300]))
    pg.on('console',lambda m:errs.append('CONSOLE '+m.text[:200]) if m.type=='error' and 'favicon' not in m.text and 'ERR_' not in m.text else None)
    pg.goto('file://'+F,wait_until='commit',timeout=120000)
    pg.wait_for_function("typeof GXU!=='undefined'&&GXU.state()==='menu'",timeout=150000)
    pg.evaluate(REC)
    if MODE=='lost':
        pg.evaluate("GX.S.gl.getExtension('WEBGL_lose_context').loseContext()");pg.wait_for_timeout(600)
    gl=pg.evaluate("!!GXU.U.gl")
    pg.evaluate("pickProfile(GXU.U.names[0])")
    pg.wait_for_function("GXU.state()==='land'",timeout=300000);pg.wait_for_timeout(700)
    # deny path (wrong code, no printing)
    pg.evaluate("document.getElementById('lgi').value='wrong-code-zz';doLogin()");pg.wait_for_timeout(900)
    ok(pg.evaluate("GXU.state()==='land'&&!GXU.U.leaving&&ONLINE!==1"),'wrong code: denied, still on land, not leaving')
    # back + pick again
    pg.evaluate("GXU.back()");pg.wait_for_function("GXU.state()==='menu'",timeout=300000)
    ok(True,'back() returns to menu')
    pg.evaluate("pickProfile(GXU.U.names[1])");pg.wait_for_function("GXU.state()==='land'",timeout=300000);pg.wait_for_timeout(700)
    pg.evaluate("window.__r.hud.length=0;window.__r.dir.length=0")
    t0=time.time()
    pg.evaluate("window.__cbN=0;(()=>{const o=GXU.granted;})();document.getElementById('lgi').value=(PWD[LG]||'x');doLogin()")
    shots=0
    while time.time()-t0<90:
        try:
            if pg.evaluate("ONLINE===1"):break
            if MODE=='normal' and shots<10 and time.time()-t0>shots*1.2+.5:
                pg.screenshot(path=OUT+'/%s_fall%02d.png'%(MODE,shots));shots+=1
        except Exception:pass
        pg.wait_for_timeout(100)
    wall=time.time()-t0
    pg.wait_for_function("ONLINE===1",timeout=120000)
    r=pg.evaluate("__r");ed=[d for d in r['dir'] if d[0] in('launch','punch','bh2','bh3','flash')]
    notes.append('wall %.1fs dir=%s hud=%s'%(wall,[(d[0],round(d[2],2)) for d in r['dir']],[h[0] for h in r['hud']]))
    if gl and MODE in('normal','low','gl1'):
        st=[d[0] for d in r['dir']];ok(st[:4]==['launch','punch','bh2','bh3'],'stage order '+','.join(st))
        t_l=[d for d in r['dir'] if d[0]=='launch'];t_f=[d for d in r['dir'] if d[0]=='bh3']
        if t_l and t_f:
            et=t_f[0][2]-t_l[0][2]+.83;ok(3.5<=et<=5.5,'engine time launch->flash %.2fs (3.5-5.5)'%et)
        hs=' | '.join(h[0] for h in r['hud']);ok('ACCESS GRANTED' in hs and 'EVENT HORIZON' in hs and 'WELCOME' in hs,'HUD beats: '+hs)
        ok(pg.evaluate("GX.S.BH?GX.S.BH.ok===1&&!GX.S.BH.fail:false") if pg.evaluate("!!(window.GX&&GX.S&&GX.S.BH)") else True,'black-hole program compiled')
    else:
        notes.append('no GL fall in mode '+MODE)
    pg.wait_for_function("GXU.on()===0",timeout=60000);pg.wait_for_timeout(1500)
    ok(pg.evaluate("ONLINE===1&&!document.getElementById('gxc')&&document.getElementById('login').innerHTML===''"),'portal shown once, globe released, login emptied')
    pg.screenshot(path=OUT+'/%s_portal.png'%MODE)
    ok(not errs,'no page errors %s'%errs[:3])
    b.close()
for n in notes:print(n)
for f in fails:print(f)
print('RESULT',MODE,'PASS' if not fails else 'FAIL',len(fails),'fails')
sys.exit(1 if fails else 0)
