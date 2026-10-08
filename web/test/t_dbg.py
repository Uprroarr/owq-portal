import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
from playwright.sync_api import sync_playwright
PORT=8792;SITE=SP+'/web/test/site';URL='http://127.0.0.1:%d/index.html'%PORT
J=json.load(open(SP+'/web/private/owq-migration.json'))
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  ctx=b.new_context();ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  A=ctx.new_page();A.on('console',lambda m:print('console',m.type,m.text[:200]))
  A.add_init_script("window.__FAKE_SIGNIN={uid:'uOwner',email:'owner@example.com',displayName:'Cole Leckey'};")
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  A.evaluate("()=>{window.location.reload=function(){window.__rl=1}}")
  r=A.evaluate("j=>{const t=OWQC.__t;let okp=0,bad=[];for(const d of j.docs){try{const s=t.segs(d.path);if(s.length%2===0)okp++;else bad.push(d.path)}catch(e){bad.push(d.path+' '+e.message)}}let enc=0;try{t.enc(j.docs[0].body);enc=1}catch(e){enc=e.message}return {okp,bad:bad.slice(0,3),enc,hasWB:typeof OWQC.F.fs.writeBatch}}",J)
  print('check',r)
  r=A.evaluate("j=>{window.__msgs=[];const o=document.createElement('p');o.id='owqdmsg';document.body.appendChild(o);new MutationObserver(()=>__msgs.push(o.textContent)).observe(o,{childList:true,characterData:true,subtree:true});return OWQC.importDocs(j).then(()=>'resolved',e=>'rejected '+JSON.stringify(e))}",J)
  print('import',r)
  A.wait_for_timeout(1200)
  print('msgs',A.evaluate("__msgs"))
  A.wait_for_timeout(2500)
  d=A.evaluate("__FAKE.call('dump')")['docs'];print(len(d),sorted(set(x.split('/')[0] for x in d)))
  b.close()
finally:srv.terminate()
