"""3D office in the pop-out window (software WebGL): the office mounts in the floor window and fills it; screenshot."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8795;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots'
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:300]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':800,'height':450},permissions=['microphone','camera'])
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  ctx.add_init_script("(function(){var md=navigator.mediaDevices;if(!md)return;var g=md.getUserMedia.bind(md);window.__gum=[];md.getUserMedia=function(c){var r={c:JSON.stringify(c).slice(0,80),t:Date.now(),st:'pending'};__gum.push(r);return g(c).then(function(s){r.st='ok';return s},function(e){r.st='err:'+e.name;throw e})}})();")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(800)
  A.evaluate("openTab('Team Chat');CH.ch='__voice';go()");A.wait_for_timeout(4000)
  ok(A.evaluate("voOffice()"),'3D office is on in the portal window')
  A.evaluate("vcJoin()");A.wait_for_timeout(2500);A.screenshot(path=OUT+'/popout3d_before.png')
  with A.expect_popup() as pi:A.click('button.sfw-b')
  P=pi.value;P.on('pageerror',lambda e:errs.append('P '+str(e)[:200]))
  P.wait_for_function("window.SFW&&SFW.entered",timeout=40000)
  try:P.wait_for_function("VC.on",timeout=30000)
  except Exception as e:print('DBG',P.evaluate("JSON.stringify({on:VC.on,room:!!VC.room,err:VC.err||'',mic:!!VC.mic,ent:SFW.entered,tab:tab,ch:CH.ch,online:ONLINE,who:WHO,lv:!!SFW.leaving})"),A.evaluate("JSON.stringify({on:VC.on,out:SFW.out,id:SFW.id,hand:SFW.hand})"),P.evaluate("JSON.stringify({gum:window.__gum,vis:document.visibilityState,foc:document.hasFocus(),free:!!SFW.free})"),"AGUM",A.evaluate("JSON.stringify(window.__gum)"),"TR",P.evaluate("JSON.stringify(SFW.tr)"))
  P.wait_for_timeout(6000)
  info=P.evaluate("(()=>{const e=document.getElementById('vofm'),c=e&&e.querySelector('canvas');const r=e?e.getBoundingClientRect():null;return{ofc:voOffice(),h:r?Math.round(r.height):0,ih:innerHeight,cv:!!c,run:!!(VO3.info&&VO3.info())}})()")
  ok(info['ofc'] and info['cv'],'the 3D office mounts in the floor window',info)
  ok(info['h']>=info['ih']-80,'the office fills the floor window',info)
  P.screenshot(path=OUT+'/popout3d_window.png');A.screenshot(path=OUT+'/popout3d_portal.png')
  ok(not A.evaluate("VC.on")and A.evaluate("!!document.querySelector('.sfw-ph')"),'portal window stepped off, placeholder shown')
  ok(not A.evaluate("(()=>{try{const x=VO3.info();return !!(x&&x.running)}catch(e){return false}})()"),'the portal window stopped drawing its own 3D office')
  ok(not errs,'no page errors',errs)
  b.close()
finally:
  srv.terminate()
print('RESULT',sum(res),'/',len(res))
