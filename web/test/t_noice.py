"""A browser that blocks WebRTC networking (VPN / privacy extension 'WebRTC leak protection' = disable_non_proxied_udp) gets a
clear message on the Sales Floor instead of silent failure; a normal browser does not."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8792;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots';os.makedirs(OUT,exist_ok=True)
URL='http://127.0.0.1:%d/index.html'%PORT
BASE=['--no-sandbox','--disable-webgl','--no-proxy-server','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:300]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
def run(flags,tag):
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=BASE+flags)
    ctx=b.new_context(viewport={'width':1366,'height':860},permissions=['microphone','camera'])
    ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    errs=[]
    K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
    A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
    A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
    A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
    A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
    lgx.login(A,6);A.wait_for_timeout(1200)
    A.evaluate("vcJoin()")
    try:A.wait_for_function("VC.iceN!==undefined",timeout=9000)
    except Exception:pass
    st=A.evaluate("({n:VC.iceN,err:VC.err||'',on:VC.on})")
    return b,A,st,errs
try:
 with sync_playwright() as p:
  b,A,st,errs=run([],'normal')
  ok(st['on'] and (st['n'] or 0)>0,'normal browser: call routes found when joining (%s)'%st['n'],st)
  ok('WebRTC' not in st['err'],'normal browser: no blocked-voice message',st['err'])
  ok(not errs,'normal browser: no page errors',errs)
  b.close()
  b,A,st,errs=run(['--webrtc-ip-handling-policy=disable_non_proxied_udp'],'blocked')
  ok(st['n']==0,'blocked browser: the probe sees zero call routes',st)
  ok('blocking call connections (WebRTC)' in st['err'],'blocked browser: the Sales Floor explains it and how to fix it',st['err'])
  try:A.evaluate("openTab('Team Chat')");A.wait_for_timeout(400);A.evaluate("CH.ch='__voice';try{chRender&&chRender()}catch(e){};try{vcPaint()}catch(e){}");A.wait_for_timeout(600)
  except Exception as e:print('ui',e)
  A.screenshot(path=OUT+'/noice_floor.png')
  d=[x for x in A.evaluate("__FAKE.call('dump')")['docs'] if x.startswith('diag/')]
  ok(len(d)>=1,'blocked browser: diagnostics recorded',d)
  ok(not errs,'blocked browser: no page errors',errs)
  b.close()
finally:
  srv.terminate()
print('RESULT',sum(res),'/',len(res))
