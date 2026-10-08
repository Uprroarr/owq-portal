import sys,os,json
from playwright.sync_api import sync_playwright
import lgx
W=int(os.environ.get('W',390));H=int(os.environ.get('H',800))
F='http://127.0.0.1:8765/owq-command-station-v2.html'
KEYS=sys.argv[1:]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
    ctx=b.new_context(viewport={'width':W,'height':H},device_scale_factor=1,is_mobile=True,has_touch=True);ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append('PE '+str(e)[:300]))
    pg.goto(F);pg.wait_for_timeout(2500);lgx.login(pg,6)
    if not KEYS: KEYS=pg.evaluate("LNM.filter(m=>m.bp).map(m=>m.id.slice(3))")
    pg.evaluate("openTab('Learning Network')");pg.wait_for_timeout(500);pg.evaluate("lnTrk(1)");pg.wait_for_timeout(400)
    JS="""(a)=>{const m=LNM.find(x=>x.id===a[0]);m.bp.pages.forEach((p,i)=>LN.sn[m.id+':0:p'+i]=1);for(let si=1;si<a[1];si++){m.bp.guide[si-1].b.forEach((b,bi)=>{if(b.k==='cp')LN.sn[m.id+':'+si+':c'+bi]=1})}LN.mode='lesson';LN.step=a[1];LN.anim=0;lnR(1)}"""
    MEAS="""()=>{const vw=document.documentElement.clientWidth;const out=[];const root=document.getElementById('lnb')||document.getElementById('main')||document.body;
      const de=document.documentElement;const sw=Math.max(de.scrollWidth,document.body.scrollWidth);
      root.querySelectorAll('*').forEach(e=>{const r=e.getBoundingClientRect();if(r.width===0||r.height===0)return;const cs=getComputedStyle(e);if(cs.position==='fixed')return;
        if(r.right>vw+1||r.left<-1){
          // ignore if an ancestor scrolls horizontally on purpose
          let a=e.parentElement,sc=false;while(a&&a!==root){const o=getComputedStyle(a).overflowX;if(o==='auto'||o==='scroll'||o==='hidden'){const ar=a.getBoundingClientRect();if(ar.right<=vw+1&&ar.left>=-1){sc=true;break}}a=a.parentElement}
          if(!sc)out.push((e.className&&e.className.baseVal===undefined?e.className:'')+'|'+e.tagName+'|'+Math.round(r.left)+'-'+Math.round(r.right))}});
      return {vw,sw,over:out.slice(0,6),n:out.length}}"""
    tot=0
    for key in KEYS:
        n=pg.evaluate("(k)=>LNM.find(x=>x.id==='bp-'+k).bp.guide.length",key)
        bad=[]
        pg.evaluate(f"lnOpen('bp-{key}')");pg.wait_for_timeout(250)
        for si in range(0,n+1):
            pg.evaluate(JS,['bp-'+key,si]);pg.wait_for_timeout(60)
            m=pg.evaluate(MEAS)
            if m['sw']>m['vw']+1 or m['n']: bad.append((si,m))
        # quiz screen
        print(f'{key}: steps checked {n+1}, overflow steps {len(bad)}')
        for si,m in bad[:4]: print('   step',si,json.dumps(m)[:300])
        tot+=len(bad)
    print('TOTAL overflow steps',tot,'errors',errs[:3] or 'none')
    b.close()
