#!/usr/bin/env python3
"""Intro (login globe) end-to-end test with real WebGL (swiftshader).
   Flow: menu -> pick -> continuous dive -> land -> back -> menu -> pick -> skip -> land -> login -> launch -> portal.
   usage: intro_test.py [portal.html] [outdir]   env MODE=normal|low|still|rm|gl1|nogl|lost   W,H
   Never prints access codes (the field is filled from the in-page map, like $SP/lgx.py)."""
import os,sys,time,json
from playwright.sync_api import sync_playwright
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
F=os.path.abspath(sys.argv[1] if len(sys.argv)>1 else SP+'/agents/intro/out/portal.html')
OUT=sys.argv[2] if len(sys.argv)>2 else SP+'/agents/intro/out/itest'
MODE=os.environ.get('MODE','normal');W=int(os.environ.get('W',960));H=int(os.environ.get('H',540))
os.makedirs(OUT,exist_ok=True)
args=['--no-sandbox','--no-proxy-server','--autoplay-policy=no-user-gesture-required','--disable-background-networking','--no-first-run']
if MODE=='nogl':args+=['--disable-webgl','--disable-webgl2']
else:args+=['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
fails=[];notes=[]
def ok(c,msg):
    (notes if c else fails).append(('PASS ' if c else 'FAIL ')+msg)
REC="""(()=>{window.__gxr={ui:[],dir:[],hud:[],pin:0,alt:[]};let a='',b='';setInterval(()=>{try{
 const u=GXU.state(),d=(window.GX&&GX.dir)?GX.dir.state():'';if(u!==a){a=u;__gxr.ui.push(u)}if(d!==b){b=d;__gxr.dir.push(d)}
 const h=document.getElementById('gxhud');const t=h&&h.classList.contains('on')?h.innerText.replace(/\\s+/g,' ').trim():'';
 if(t&&__gxr.hud[__gxr.hud.length-1]!==t)__gxr.hud.push(t);if(GXU.U.pinOn)__gxr.pin=1;
 const s=document.getElementById('gxhs');if(s&&/ALT/.test(s.textContent)){const v=s.textContent;if(__gxr.alt[__gxr.alt.length-1]!==v)__gxr.alt.push(v)}
}catch(e){}},40)})()"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=args)
    ctx=b.new_context(viewport={'width':W,'height':H},reduced_motion='reduce' if MODE=='rm' else 'no-preference')
    if MODE=='gl1':ctx.add_init_script("(()=>{const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,a){if(t==='webgl2')return null;return g.call(this,t,a)}})()")
    if MODE in('low','still'):ctx.add_init_script("try{localStorage.setItem('owq_gq','%s')}catch(e){}"%MODE)
    pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)[:300]))
    pg.on('console',lambda m:errs.append('CONSOLE '+m.text[:200]) if m.type=='error' and 'favicon' not in m.text and 'ERR_' not in m.text else None)
    t0=time.time()
    pg.goto('file://'+F,wait_until='commit',timeout=120000)
    pg.wait_for_function("typeof GXU!=='undefined'&&GXU.state()==='menu'",timeout=150000)
    notes.append('menu after %.1fs'%(time.time()-t0))
    pg.evaluate(REC)
    st=lambda:pg.evaluate("({ui:GXU.state(),dir:GX.dir.state(),gl:GXU.U.gl,fail:GXU.U.fail,ck:GX.C.cityK,alt:GX.alt(),land:GX.landAlt(),scale:GX.S.scale,api:GX.S.api,pc:!!(GX.S.P&&(GX.S.P.pc||GX.S.P.pcl||GX.S.P.pcq||GX.S.P.pclq)),pcFail:GX.S.pcFail})")
    s0=st();notes.append('start '+json.dumps(s0))
    if MODE=='normal':ok(s0['api']=='WebGL 2','WebGL 2 context')
    if MODE=='gl1':ok(s0['api']=='WebGL 1','WebGL 1 context (forced)')
    if MODE=='nogl':ok(s0['gl']==0,'no-WebGL fallback active')
    if MODE=='lost':
        pg.evaluate("GX.S.gl.getExtension('WEBGL_lose_context').loseContext()");pg.wait_for_timeout(600)
        ok(pg.evaluate("GXU.U.fail===2&&document.getElementById('gx').classList.contains('fb')"),'context lost -> CSS poster fallback')
    pg.screenshot(path=OUT+'/%s_menu.png'%MODE)
    # 1) pick -> land
    t1=time.time();pg.evaluate("pickProfile(GXU.U.names[0])")
    if MODE in('normal','low','gl1'):
        pg.wait_for_function("GX.dir.state()==='dive'",timeout=120000);pg.wait_for_timeout(200);pg.screenshot(path=OUT+'/%s_dive.png'%MODE)
    pg.wait_for_function("GXU.state()==='land'",timeout=240000)
    pg.wait_for_timeout(900);pg.screenshot(path=OUT+'/%s_land.png'%MODE)
    s1=st();r=pg.evaluate("__gxr");notes.append('land after %.1fs '%(time.time()-t1)+json.dumps(s1))
    loc=pg.evaluate("document.getElementById('gxloc').innerText")
    if s1['gl']:
        la=s1['land'];at=('%.1f'%la) if la<10 else '%d'%round(la);ok(('ALT %s KM'%at) in loc.replace('\n',' '),'ALT text matches landing altitude (%s km)'%at)
        ok(abs(s1['alt']-s1['land'])<1.5,'camera at landing altitude (%.1f vs %.1f km)'%(s1['alt'],s1['land']))
        ok(s1['ck']==1 and s1['pc'] and not s1['pcFail'],'city layer on at landing (close-up program compiled, no fallback)')
        b3=pg.evaluate("({n:(GX.S.bN|0)+(GX.S.bNC|0),f:GX.S.bFail||0,rise:GX.C.rise,ms:GX.S.bMs,d0:GX.S.bDr|0})");pg.wait_for_timeout(500);b3['d1']=pg.evaluate("GX.S.bDr|0")
        ok(b3['n']>0 and not b3['f'] and b3['rise']>.99,'3D city model built (%d instances, %.1f ms, rise %.2f)'%(b3['n'],b3['ms'] or 0,b3['rise']))
        ok(b3['d1']>b3['d0'] or MODE in('still','rm'),'3D pass draws every frame (%d -> %d)'%(b3['d0'],b3['d1']))
        if MODE in('still','rm'):ok(b3['d1']>0,'3D pass drawn in the still frame')
        from PIL import Image
        im=Image.open(OUT+'/%s_land.png'%MODE).convert('L');px=im.crop((0,int(H*.2),W,H)).getdata();nb=sum(1 for v in px if v>12)/len(px)
        ok(nb>.15,'landing frame not black (%.0f%% lit pixels)'%(nb*100))
        cap=6000 if MODE!='low' else 1500;ok(b3['n']<=cap,'instance budget (%d <= %d)'%(b3['n'],cap))
    if MODE in('normal','low','gl1'):
        d=[x for x in r['dir'] if x in('map','pin','dive','entry','model','land')]
        ok(d==['map','pin','dive','entry','model','land'],'stage order '+','.join(r['dir']))
        ok(any('RENDERING CITY MODEL' in h for h in r['hud']),'model stage HUD text')
        ok(r['pin']==1,'pin shown during the dive')
        ok(len(r['alt'])>=3,'live altitude readout ticks (%d values: %s .. %s)'%(len(r['alt']),r['alt'][:1],r['alt'][-1:]))
        ok(any('TARGET LOCKED' in h for h in r['hud']) and any('DESCENDING' in h for h in r['hud']),'HUD texts '+' | '.join(r['hud'][:6]))
        ok(not any('HYPERDRIVE' in h for h in r['hud']),'no hyperdrive text')
    ok(pg.evaluate("document.activeElement&&document.activeElement.id==='lgi'"),'focus in access code field')
    if s1['gl']:
        r2=pg.evaluate("(()=>{try{const a=GX.C.d;const I=GX.dir.info();GX.dir.snap('land',[I.lat,I.lon],I);return {ok:1,rise:GX.C.rise,n:GX.S.bN,dd:Math.abs(GX.C.d-a)}}catch(e){return {ok:0,e:String(e)}}})()")
        ok(r2.get('ok') and r2.get('rise',0)>.99 and r2.get('n',0)>0 and r2.get('dd',1)<1e-4,'snap(land) re-applies the final view with the model risen '+json.dumps(r2))
    # 2) back -> menu
    t2=time.time();pg.evaluate("GXU.back()");pg.wait_for_function("GXU.state()==='menu'",timeout=120000)
    notes.append('menu again after %.1fs'%(time.time()-t2))
    if s1['gl'] and MODE not in('still','rm'):
        pg.wait_for_function("GX.dir.state()==='idle'",timeout=120000);ok(pg.evaluate("GX.C.cityK===0&&GX.C.off===0"),'back to idle globe (city layer off)')
    # 3) pick again -> skip during the dive -> land
    pg.evaluate("__gxr.dir.length=0");pg.evaluate("pickProfile(GXU.U.names[1])")
    if MODE in('normal','low','gl1'):
        pg.wait_for_function("GX.dir.state()==='dive'&&GX.C.dv>.05",timeout=120000)
        tk=pg.evaluate("GX.time()");pg.keyboard.press('Enter')
        pg.wait_for_function("GXU.state()==='land'",timeout=120000)
        dt=pg.evaluate("GX.time()")-tk;ok(dt<2.0,'skip finished the dive in %.2fs of animation time'%dt)
        s3=st();ok(abs(s3['alt']-s3['land'])<1.5,'skip lands on the same final view')
    else:
        pg.wait_for_function("GXU.state()==='land'",timeout=60000)
    # 4) login -> launch
    pg.wait_for_timeout(400)
    pg.evaluate("document.getElementById('lgi').value=(PWD[LG]||'x');doLogin()")
    if MODE in('normal','low','gl1'):
        try:pg.wait_for_function("GX.dir.state()==='launch'||GX.dir.state()==='punch'||GXU.U.leaving===1",timeout=20000);ok(True,'launch started')
        except Exception as e:ok(False,'launch started')
    pg.wait_for_function("ONLINE===1",timeout=120000)
    pg.wait_for_function("GXU.on()===0",timeout=60000)
    pg.wait_for_timeout(1500)
    ok(pg.evaluate("!document.getElementById('gxc')"),'globe canvas released after login')
    pg.screenshot(path=OUT+'/%s_portal.png'%MODE)
    ok(not errs,'no page errors (%d)'%len(errs))
    for e in errs[:6]:print(e)
    b.close()
for n in notes:print(n)
for f in fails:print(f)
print('RESULT',MODE,'PASS' if not fails else 'FAIL',len(notes),'notes',len(fails),'fails')
sys.exit(1 if fails else 0)
