"""Voice relay (TURN) set up from Team Access: saved to cfg/rtc, used by every call after a reload, removable."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8793;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots';os.makedirs(OUT,exist_ok=True)
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--disable-webgl','--no-proxy-server','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:300]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1366,'height':860})
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,6);A.wait_for_timeout(800)
  ok(not any('turn:' in json.dumps(x) for x in A.evaluate("VCFG.iceServers")),'no relay before setup')
  A.evaluate("OWQC.team()");A.wait_for_timeout(1000)
  ok('VOICE RELAY' in A.inner_text('#md') and 'Not set up' in A.inner_text('#md'),'Team Access shows the voice relay section')
  A.fill('#owqrh','turn:relay1.example.net:3478');A.fill('#owqru','owq');A.fill('#owqrp','secret-pass');A.click('#owqrs');A.wait_for_timeout(1200)
  ok('Relay saved' in A.inner_text('#md') and 'Active: relay1.example.net:3478' in A.inner_text('#md'),'relay saved and shown as active',A.inner_text('#owqrmsg'))
  A.screenshot(path=OUT+'/relay_team.png')
  ice=A.evaluate("VCFG.iceServers");t=[x for x in ice if 'username' in x]
  ok(len(t)==1 and 'turns:relay1.example.net:443?transport=tcp' in t[0]['urls'] and t[0]['username']=='owq','calls use the relay right away (UDP, TCP, 443 and TLS)',ice)
  A.evaluate("OWQC.teamClose()");A.reload();A.wait_for_function("OWQC.phase==='in'",timeout=30000);A.wait_for_timeout(1500)
  lgx.login(A,6);A.wait_for_timeout(800)
  ice=A.evaluate("VCFG.iceServers");ok(any('username' in x for x in ice),'after a reload the relay is loaded for calls',ice)
  A.evaluate("OWQC.team()");A.wait_for_timeout(1000);A.click('#owqrx');A.wait_for_timeout(1200)
  ice=A.evaluate("VCFG.iceServers");ok(not any('username' in x for x in ice) and 'Relay removed' in A.inner_text('#md'),'relay can be removed',ice)
  ok(not errs,'no page errors',errs)
  b.close()
finally:
  srv.terminate()
print('RESULT',sum(res),'/',len(res))
