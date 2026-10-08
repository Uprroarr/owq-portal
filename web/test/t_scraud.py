"""Screen share with sound (tab/system audio) + Screen share audio sliders. Based on the volume mixer test: header button next to the bell, panel with Master / Music / Effects / All voices and one slider per teammate on
the floor; each slider really changes what plays (media volume, Web Audio gain, speech volume), levels survive a reload, the
Sales Floor has its own Volume button, phones get a bottom sheet."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8848;SITE=os.environ.get('SITE',SP+'/web/test/site_sa');OUT=SP+'/web/test/shots'
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--disable-webgl','--no-proxy-server','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required','--disable-features=WebRtcHideLocalIpsWithMdns']
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:400]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
def until(X,js,secs,arg=None):
    t=time.time()
    while time.time()-t<secs:
        try:
            if (X.evaluate(js,arg) if arg is not None else X.evaluate(js)):return True
        except Exception:pass
        X.wait_for_timeout(400)
    return False
def slide(X,sel,v):X.evaluate("([s,v])=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))}",[sel,v])
CALL="(id)=>!!(VC.pcs[id]&&VC.pcs[id].connectionState==='connected'&&VC.rs[id]&&Object.keys(VC.rs[id]).length)"
VOX="(n)=>Object.keys(VC.vid).filter(k=>k.indexOf('local-')<0).map(k=>VC.vid[k]).filter(v=>v.__who===n).map(v=>+SNDX.real(v).toFixed(4))"
near=lambda a,b:a is not None and abs(a-b)<0.002
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1366,'height':860},permissions=['microphone','camera'])
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  errs={}
  def page(tag,user):
      pg=ctx.new_page();errs[tag]=[];pg.on('pageerror',lambda e:errs[tag].append(str(e)[:200]));pg.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps(user));return pg
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=page('A',{'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'})
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear();localStorage.removeItem('owq_snd')");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(800)
  B=page('B',{'uid':'uJohn','email':'john@example.com','displayName':'John Montini'})
  B.goto(URL);B.wait_for_function("OWQC.phase==='out'",timeout=30000);B.click('#owqgi');B.wait_for_function("OWQC.phase==='pending'",timeout=30000)
  B.click('#owqgr');B.wait_for_function("OWQC.reqd===true",timeout=10000)
  A.evaluate("OWQC.team()");A.wait_for_timeout(1200);A.select_option('#owqrn0','John Montini');A.click("#md button:has-text('Approve')");A.wait_for_timeout(1200);A.evaluate("OWQC.teamClose()")
  B.reload();B.wait_for_function("OWQC.phase==='in'",timeout=30000);lgx.login(B,3);B.wait_for_timeout(1000)
  B.evaluate("vcJoin()");B.wait_for_timeout(1200);A.evaluate("vcJoin()")
  bid=B.evaluate("vcMe()");aid=A.evaluate("vcMe()")
  ok(until(A,CALL,25,bid) and until(B,CALL,25,aid),'setup: Cole and John are on the floor and connected')
  # Cole's "screen": a canvas picture plus a tone, the way a shared tab with sound arrives
  A.evaluate("""()=>{const md=navigator.mediaDevices;md.getDisplayMedia=async(c)=>{window.__dmc=c;const cv=document.createElement('canvas');cv.width=320;cv.height=180;const x=cv.getContext('2d');setInterval(()=>{x.fillStyle='#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');x.fillRect(0,0,320,180)},200);
    const v=cv.captureStream(10);const ac=new AudioContext(),o=ac.createOscillator(),d=ac.createMediaStreamDestination();o.frequency.value=440;o.connect(d);o.start();const s=new MediaStream([v.getVideoTracks()[0],d.stream.getAudioTracks()[0]]);window.__scr=s;return s}}""")
  A.evaluate("vcScr()");A.wait_for_timeout(1500)
  c=A.evaluate("window.__dmc");ok(c and c.get('audio') and c['audio'].get('echoCancellation') is False,'screen share now asks for the tab/system sound (unprocessed)',c)
  ok('with sound' in A.inner_text('body'),'the sharer is told it is sharing with sound')
  ok(until(B,"(n)=>Object.keys(VC.vid).some(k=>{const v=VC.vid[k];return v.__snd==='ss'&&v.__who===n&&v.srcObject&&v.srcObject.getAudioTracks().length})",25,'Cole Leckey'),'John receives the screen with its sound, tagged as screen audio (not voice)')
  ok(B.evaluate("(()=>{const id=Object.keys(VC.rs).find(p=>Object.keys(VC.rs[p]).length);const st=voApi.audio(id);const x=((vcList().find(p=>p.peer===id)||{}).presence)||{};return !!st&&st.id!==x.ss})()"),'the floor still reads Cole\'s voice from his mic, never the screen sound')
  SS="(()=>{const k=Object.keys(VC.vid).find(k=>VC.vid[k].__snd==='ss');return k?+SNDX.real(VC.vid[k]).toFixed(4):null})()"
  VO="(()=>{const k=Object.keys(VC.vid).find(k=>VC.vid[k].__snd==='vo'&&VC.vid[k].__who==='Cole Leckey');return k?+SNDX.real(VC.vid[k]).toFixed(4):null})()"
  ok(near(B.evaluate(SS),1),'screen sound plays at full volume by default',B.evaluate(SS))
  B.click('#sndb');B.wait_for_timeout(500)
  rows=B.evaluate("[...document.querySelectorAll('#sndp .sndr')].map(r=>r.querySelector('b').textContent)")
  ok('Screen share audio' in rows,'the mixer has a Screen share audio slider',rows)
  ok(any('screen' in r for r in rows),'and a slider for Cole\'s screen under SHARED SCREENS',rows)
  B.screenshot(path=OUT+'/scraud_mixer.png',clip={'x':800,'y':0,'width':566,'height':860})
  slide(B,'#sndi_ss',50);B.wait_for_timeout(300)
  ok(near(B.evaluate(SS),.25),'Screen share audio at 50% plays the screen at 0.25',B.evaluate(SS))
  ok(near(B.evaluate(VO),1),'voices are not affected by the screen slider',B.evaluate(VO))
  slide(B,'#sndi_vo',30);B.wait_for_timeout(300)
  ok(near(B.evaluate(SS),.25),'and the voices slider does not change the screen sound',B.evaluate(SS))
  i2=B.evaluate("[...document.querySelectorAll('#sndp .sndpr')].findIndex(r=>/screen/.test(r.querySelector('b').textContent))")
  slide(B,'#sndq_%d'%i2,0);B.wait_for_timeout(300);ok(near(B.evaluate(SS),0),'the per-screen slider at 0 silences just that screen',B.evaluate(SS))
  A.evaluate("vcStopScr()");A.wait_for_timeout(2500);B.evaluate("SNDX.close();SNDX.open(document.getElementById('sndb'),'hdr')");B.wait_for_timeout(500)
  rows=B.evaluate("[...document.querySelectorAll('#sndp .sndr')].map(r=>r.querySelector('b').textContent)")
  ok(not any('screen' in r for r in rows),'when the share stops, its slider goes away',rows)
  # a browser that refuses screen sound still shares the picture
  A.evaluate("""()=>{const md=navigator.mediaDevices;let n=0;md.getDisplayMedia=async(c)=>{n++;if(c.audio)throw Object.assign(new Error('no audio'),{name:'NotSupportedError'});const cv=document.createElement('canvas');cv.width=64;cv.height=36;cv.getContext('2d').fillRect(0,0,9,9);return cv.captureStream(5)};window.__dn=()=>n}""")
  A.evaluate("vcScr()");A.wait_for_timeout(1200)
  ok(A.evaluate("!!VC.scr") and A.evaluate("__dn()")==2,'if the browser refuses sound, it retries and shares the picture only')
  ok('without sound' in A.inner_text('body'),'and explains how to include sound next time')
  A.evaluate("vcStopScr()")
  ok(not errs['A'] and not errs['B'],'no page errors',errs)
  b.close()
finally:
  srv.terminate()
print('%d/%d'%(sum(res),len(res)))
