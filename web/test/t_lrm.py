"""Lead Purchasing Roadmap slide in The Production Equation module."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8846;SITE=os.environ.get('SITE',SP+'/web/test/site_lrm');URL='http://127.0.0.1:%d/index.html'%PORT
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:400]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  for vw in (1280,390):
   ctx=b.new_context(viewport={'width':vw,'height':900});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
   errs=[]
   K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
   A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
   A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
   A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
   A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
   lgx.login(A,2);A.wait_for_timeout(1500)
   m=A.evaluate("(()=>{const m=LNM.find(x=>x.id==='foundational-equation');return m.slides.map(s=>s.t)})()")
   ok(m[4]=='Lead Purchasing Roadmap' and m[3]=='Balance your inputs','roadmap follows Balance your inputs in The Production Equation',m)
   A.evaluate("openTab('Learning Network')");A.wait_for_timeout(600);A.evaluate("lnOpen('foundational-equation')");A.wait_for_timeout(800)
   h=A.evaluate("(()=>{const m=LNM.find(x=>x.id==='foundational-equation');const d=document.createElement('div');d.innerHTML=m.slides[4].h();return d.querySelectorAll('.lrm-st').length+'|'+d.textContent})()")
   ok(h.startswith('7|') and all(x in h for x in ['$1,500+','Target: $15,000+/week','GOAL 8X','LEARN THE SCRIPT','70% REAL-TIME','30% AGED','LEARN BEFORE YOU EARN','goals, not guarantees']),'7 stages and all sheet text render',h[:300])
   # jump to the slide
   A.evaluate("(()=>{LN.mode='lesson';LN.step=4;LN.rv={};lnR(1)})()");A.wait_for_timeout(600);ok(A.locator(".lrm-trk").count()==1,"the slide renders in the lesson view")
   A.wait_for_timeout(600)
   if A.locator('.lrm-trk').count():
     A.screenshot(path=SP+'/web/test/shots/lrm_%d.png'%vw,full_page=False)
     sw=A.evaluate("document.documentElement.scrollWidth<=innerWidth+1");ok(sw,'no page-level horizontal scroll at %d'%vw)
   else: ok(True,'(slide not directly renderable; content checked above)')
   ok(not errs,'no page errors',errs)
   ctx.close()
  b.close()
finally:srv.terminate()
print('%d/%d'%(sum(res),len(res)))
