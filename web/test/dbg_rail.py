import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8807;SITE=SP+'/web/test/site';URL='http://127.0.0.1:%d/index.html'%PORT
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
JS="""()=>{const r=document.getElementById('rail');const out=[];for(const sh of document.styleSheets){let rs;try{rs=sh.cssRules}catch(e){continue}
 const walk=L=>{for(const x of L){if(x.cssRules&&!x.selectorText){walk(x.cssRules);continue}if(!x.selectorText||!x.style)continue;
  let m=false;try{m=r.matches(x.selectorText)}catch(e){}if(m&&(x.style.transform||x.style.translate||x.style.display||x.style.width))out.push((x.parentRule&&x.parentRule.conditionText?'@'+x.parentRule.conditionText+' ':'')+x.selectorText+' {transform:'+x.style.transform+';translate:'+x.style.translate+';width:'+x.style.width+'}')}};walk(rs)}
 return {cls:r.className,inline:r.style.cssText,tf:getComputedStyle(r).transform,tr:getComputedStyle(r).translate,pos:getComputedStyle(r).position,rect:JSON.stringify(r.getBoundingClientRect()),rules:out}}"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  ctx=b.new_context(viewport={'width':1440,'height':900})
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(800)
  A.set_viewport_size({'width':390,'height':844});A.evaluate("try{RAIL=false;railApply()}catch(e){};go()");A.wait_for_timeout(800)
  print(json.dumps(A.evaluate(JS),indent=1))
  A.screenshot(path=SP+'/web/test/shots/dbg_rail.png')
  b.close()
finally:srv.terminate()
