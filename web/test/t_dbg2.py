import sys,os,time,json,subprocess
sys.path.insert(0,'/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad');import lgx
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
from playwright.sync_api import sync_playwright
PORT=8795;SITE=SP+'/web/test/site';URL='http://127.0.0.1:%d/index.html'%PORT
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'])
  ctx=b.new_context(permissions=['microphone','camera']);ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  K.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})")
  K.evaluate("__FAKE.call('seed',{docs:[{path:'members/b@example.com',data:{name:'Nate Johnson',role:'member',at:1}}],rt:{members:{'b@example,com':'member','owner@example,com':'owner'}}})")
  A=ctx.new_page();A.add_init_script("window.__FAKE_SIGNIN={uid:'uA',email:'owner@example.com'};");A.goto(URL);A.wait_for_function("OWQC.phase==='out'");A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'")
  B=ctx.new_page();B.add_init_script("window.__FAKE_SIGNIN={uid:'uB',email:'b@example.com'};");B.goto(URL);B.wait_for_function("OWQC.phase==='out'");B.click('#owqgi');B.wait_for_function("OWQC.phase==='in'")
  lgx.login(A,6);lgx.login(B,1);A.evaluate("vcJoin()");B.evaluate("vcJoin()");A.wait_for_timeout(2000)
  A.evaluate("window.R=VC.room");B.evaluate("window.R=VC.room;window.got=[];R.on('zz',m=>got.push((m.data&&m.data.s||'').length))");A.wait_for_timeout(1000)
  for n in (10,3000,9000,30000):
      print(n,A.evaluate("n=>R.emit('zz',{s:'x'.repeat(n)}).then(()=>'ok',e=>'rej '+e.code)",n))
  B.wait_for_timeout(2500);print('B got',B.evaluate("window.got"),'dbg',B.evaluate("VC.room._dbg()"),'evN',B.evaluate("OWQC.evN"),'Rtype',B.evaluate("typeof R"),B.evaluate("R===VC.room"))
  print('A peers',A.evaluate("R.peers().length"),'B peers',B.evaluate("R.peers().length"))
  b.close()
finally:srv.terminate()
