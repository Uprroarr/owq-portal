"""YouTube watch-together (was: screen share with sound (tab/system audio) + Screen share audio sliders. Based on the volume mixer test: header button next to the bell, panel with Master / Music / Effects / All voices and one slider per teammate on
the floor; each slider really changes what plays (media volume, Web Audio gain, speech volume), levels survive a reload, the
Sales Floor has its own Volume button, phones get a bottom sheet."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8851;SITE=os.environ.get('SITE',SP+'/web/test/site_yt');OUT=SP+'/web/test/shots'
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
  FY=open(SP+'/web/test/fakeyt.js').read()
  ctx.route('https://www.youtube.com/iframe_api',lambda r:r.fulfill(status=200,content_type='text/javascript',body=FY))
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

  P="(()=>{const a=window.__YTL.filter(p=>!p.dead);return a.length?{n:a.length,v:a[0].o.videoId,t:+a[0].now().toFixed(2),st:a[0].st,vol:a[0].vol,mu:a[0].mu}:null})()"
  ok(A.evaluate("[ytParse('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m5s'),ytParse('youtu.be/dQw4w9WgXcQ'),ytParse('https://www.youtube.com/shorts/dQw4w9WgXcQ'),ytParse('https://m.youtube.com/watch?v=dQw4w9WgXcQ'),ytParse('dQw4w9WgXcQ'),ytParse('https://vimeo.com/123'),ytParse('hello')]")==[{'v':'dQw4w9WgXcQ','t':65},{'v':'dQw4w9WgXcQ','t':0},{'v':'dQw4w9WgXcQ','t':0},{'v':'dQw4w9WgXcQ','t':0},{'v':'dQw4w9WgXcQ','t':0},None,None],'reads watch, youtu.be, shorts, mobile links and start times; rejects other sites')
  h=B.evaluate("voSharePanel()");ok('YouTube link' in h and 'Share my screen' in h,'the TV button opens a panel: paste a YouTube link, or share a screen')
  A.evaluate("ytStart('not a link')");A.wait_for_timeout(200);ok('does not look like a YouTube link' in A.evaluate("YTW.err"),'a bad link gets a clear message')
  A.evaluate("ytStart('https://youtu.be/dQw4w9WgXcQ?t=30')")
  ok(until(A,"(()=>{const y=ytMine();return y&&y.v==='dQw4w9WgXcQ'&&y.pl})()",8),'Cole starts the video for the floor')
  ok(until(B,"!!window.__YTL&&window.__YTL.some(p=>!p.dead&&p.st===1)",12),'John\'s browser loads and plays the same video on its own',B.evaluate(P))
  B.wait_for_timeout(1800);pa=A.evaluate(P);pb=B.evaluate(P)
  ok(pa and pb and pb['v']==pa['v'] and abs(pa['t']-pb['t'])<2.5 and pa['t']>=30,'both are at the same spot (started at 0:30)',[pa,pb])
  sc=B.evaluate("voApi.screens()");ok(sc and sc[0].get('yt') and sc[0]['nm']=='Cole Leckey','the Sales Floor TV gets it as Cole\'s video',sc)
  ok(until(B,"(()=>{const s=voApi.screens()[0];return s&&/Test Video/.test(s.title||'')})()",6),'the video title shows on the TV card for everyone')
  A.evaluate("ytCtl('play')");ok(until(B,"window.__YTL.some(p=>!p.dead&&p.st===2)",6),'Cole pauses -> John pauses')
  t1=B.evaluate(P)['t'];A.evaluate("ytCtl('seek',10)");B.wait_for_timeout(1800);t2=B.evaluate(P)['t']
  ok(abs(t2-t1-10)<1.5,'Cole skips 10s -> John jumps too',[t1,t2])
  A.evaluate("ytCtl('play')");ok(until(B,"window.__YTL.some(p=>!p.dead&&p.st===1)",6),'Cole plays -> John plays')
  h=A.evaluate("voSharePanel()");ok('Pause' in h and 'Stop video' in h and '10s' in h,'Cole gets the controls (pause, skip, restart, stop)')
  # the double-sound fix: Cole turns it off for himself only
  A.evaluate("SNDX.set('ss',0)");A.wait_for_timeout(1500)
  ok(A.evaluate(P)['mu'] and not B.evaluate(P)['mu'],'Cole mutes Screen share audio: silent for him, still playing for John',[A.evaluate(P),B.evaluate(P)])
  ok(A.evaluate(P)['st']==1,'and his video keeps playing (muting does not pause the floor)')
  A.evaluate("SNDX.set('ss',100)")
  B.click('#sndb');B.wait_for_timeout(600)
  rows=B.evaluate("[...document.querySelectorAll('#sndp .sndr')].map(r=>r.querySelector('b').textContent)")
  ok(any('screen' in r for r in rows),'John\'s mixer has a slider for Cole\'s video',rows)
  slide(B,'#sndi_ss',50);B.wait_for_timeout(1500);ok(B.evaluate(P)['vol']==25,'Screen share audio at 50% -> the video plays at 25 on John\'s side',B.evaluate(P))
  i2=B.evaluate("[...document.querySelectorAll('#sndp .sndpr')].findIndex(r=>/screen/.test(r.querySelector('b').textContent))")
  slide(B,'#sndq_%d'%i2,0);B.wait_for_timeout(1500);ok(B.evaluate(P)['mu'],'Cole\'s slider at 0 mutes just his video for John',B.evaluate(P))
  B.evaluate("SNDX.close()")
  # a late joiner lands in the right spot
  B.evaluate("window.__YTL.forEach(p=>p.destroy());Object.keys(YTW.P).forEach(ytDrop)");B.wait_for_timeout(2500);pa=A.evaluate(P);pb=B.evaluate(P)
  ok(pb and abs(pa['t']-pb['t'])<2.5,'someone who comes in late starts at the right moment',[pa,pb])
  A.evaluate("ytCtl('stop')");ok(until(B,"!window.__YTL.some(p=>!p.dead)&&!document.querySelector('.ytw')",6),'Cole stops it -> it leaves everyone\'s TV')
  ok(not B.evaluate("voApi.screens().some(s=>s.yt)"),'and the TV goes back to normal')
  A.evaluate("ytStart('https://www.youtube.com/watch?v=aaaaaaaaaaa')");ok(until(B,"window.__YTL.some(p=>!p.dead)",10),'(started again)')
  A.evaluate("vcLeave()");ok(until(B,"!window.__YTL.some(p=>!p.dead)",8),'leaving the floor stops your video for everyone')
  ok(not errs['A'] and not errs['B'],'no page errors',errs)
  print('%d/%d passed'%(sum(res),len(res)))
  b.close()
finally:
  srv.terminate()
