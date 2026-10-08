"""Find what closes the Learning Network document viewer (#md)."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8838;SITE=os.environ.get('SITE',SP+'/web/test/site_ln');URL='http://127.0.0.1:%d/index.html'%PORT
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
WHO_=os.environ.get('WHO_','Cole Leckey')
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  ctx=b.new_context(viewport={'width':1280,'height':900});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:print('ERR',str(e)[:200]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(1500)
  print('bp modules',A.evaluate("LNM.filter(m=>m.bp&&m.bp.pages&&m.bp.pages.length).map(m=>m.id+':'+m.bp.pages.length)"))
  mid=A.evaluate("(LNM.find(m=>m.id==='bp-classic-script'&&m.bp&&m.bp.pages&&m.bp.pages.length)||LNM.find(m=>m.bp&&m.bp.pages&&m.bp.pages.length)||{}).id")
  print('module',mid)
  A.evaluate("openTab('Learning Network')");A.wait_for_timeout(800)
  A.evaluate("id=>{try{lnOpen(id)}catch(e){console.log('open err '+e)}}",mid);A.wait_for_timeout(1200)
  A.evaluate("""()=>{window.__mdlog=[];const md=document.getElementById('md');const ob=new MutationObserver(()=>{__mdlog.push([Date.now(),md.innerHTML.length,new Error().stack.split('\\n').slice(2,6).join(' | ')])});ob.observe(md,{childList:true,subtree:false});
     const c=window.closeM;window.closeM=function(){__mdlog.push([Date.now(),'closeM',new Error().stack.split('\\n').slice(1,7).join(' | ')]);return c.apply(this,arguments)}}""")
  A.evaluate("()=>{try{lnDpFull(0)}catch(e){__mdlog.push(['full err',String(e)])}}");A.wait_for_timeout(500)
  print('md open',A.evaluate("document.getElementById('md').innerHTML.length"))
  for k in range(14):
      A.wait_for_timeout(5000);n=A.evaluate("document.getElementById('md').innerHTML.length")
      print(k*5+5,'s md len',n,flush=True)
      if n==0:break
  for r in A.evaluate("__mdlog"):print('LOG',str(r)[:600])
  b.close()
finally:srv.terminate()
