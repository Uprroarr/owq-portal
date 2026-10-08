"""Volume mixer: header button next to the bell, panel with Master / Music / Effects / All voices and one slider per teammate on
the floor; each slider really changes what plays (media volume, Web Audio gain, speech volume), levels survive a reload, the
Sales Floor has its own Volume button, phones get a bottom sheet."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8802;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots'
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
  # 1. header button and panel
  ok(A.evaluate("(()=>{const b=document.getElementById('sndb');return !!b&&b.nextElementSibling&&b.nextElementSibling.id==='bell'})()"),'the header has a speaker button right next to the bell')
  A.evaluate("openTab('Leaderboard')");A.wait_for_timeout(500)
  ok(A.evaluate("!!document.getElementById('sndb')"),'the speaker button stays after the page changes')
  A.click('#sndb');A.wait_for_timeout(400)
  ok(A.evaluate("!document.getElementById('sndp').hidden"),'it opens the volume panel')
  rows=A.evaluate("[...document.querySelectorAll('#sndp .sndr')].map(r=>r.querySelector('b').textContent)")
  ok(rows[:4]==['Master','Music','Effects & alerts','All voices'],'panel has Master, Music, Effects & alerts, All voices',rows)
  ok('John Montini' in rows,'and a slider for John, who is on the floor',rows)
  A.screenshot(path=OUT+'/snd_panel.png',clip={'x':900,'y':0,'width':466,'height':860})
  # 2. effects: Web Audio gain and spoken alerts
  slide(A,'#sndi_fx',50)
  g=A.evaluate("(()=>{const c=new (window.AudioContext||window.webkitAudioContext)();const o=c.createOscillator();o.connect(c.destination);const v=c.__sndG?c.__sndG.gain.value:null;c.close();return v})()")
  ok(near(g,0.25),'Effects at 50%: sounds play through a gain of 0.25 (squared curve)',g)
  sv=A.evaluate("(()=>{try{const u=new SpeechSynthesisUtterance('test');u.volume=1;speechSynthesis.speak(u);speechSynthesis.cancel();return u.volume}catch(e){return 'n/a'}})()")
  ok(sv=='n/a' or near(sv,0.25),'spoken alerts are scaled the same way',sv)
  # 3. music: the lobby song keeps its own fades and plays scaled
  mv=A.evaluate("(()=>{const a=new Audio(LOBBYSRC);a.volume=.7;const r=[a.volume,SNDX.real(a)];window.__la=a;return r})()")
  ok(near(mv[0],.7) and near(mv[1],.7),'music at 100%: the lobby song plays as before',mv)
  slide(A,'#sndi_mu',50)
  mv=A.evaluate("[__la.volume,SNDX.real(__la)]")
  ok(near(mv[0],.7) and near(mv[1],.7*.25),'music at 50%: the song reads 0.7 to the portal but plays at 0.175',mv)
  # 4. voices: per person and all voices
  ok(until(A,"(n)=>Object.keys(VC.vid).some(k=>k.indexOf('local-')<0&&VC.vid[k].__who===n)",10,'John Montini'),'John\'s voice is tagged with his name')
  i=A.evaluate("[...document.querySelectorAll('#sndp .sndpr')].findIndex(r=>r.querySelector('b').textContent==='John Montini')")
  slide(A,'#sndq_%d'%i,40)
  v=A.evaluate(VOX,'John Montini');ok(v and all(near(x,0.16) for x in v),'John at 40%: his voice plays at 0.16',v)
  slide(A,'#sndi_vo',50)
  v=A.evaluate(VOX,'John Montini');ok(v and all(near(x,0.04) for x in v),'All voices at 50% on top: 0.04',v)
  A.click('#sndp .sndpr[data-i="%d"] .sndm'%i)
  v=A.evaluate(VOX,'John Montini');ok(v and all(near(x,0) for x in v) and 'MUTED' in A.inner_text('#sndp .sndpr[data-i="%d"] output'%i),'muting John silences only him',v)
  A.click('#sndp .sndpr[data-i="%d"] .sndm'%i)
  v=A.evaluate(VOX,'John Montini');ok(v and all(near(x,0.04) for x in v),'unmuting brings him back to his level',v)
  # 5. master mute
  A.click('#sndp .sndr[data-k="m"] .sndm');A.wait_for_timeout(300)
  ok(A.evaluate("SNDX.real(__la)===0&&document.getElementById('sndb').classList.contains('mu')"),'muting Master silences everything and the header icon shows muted')
  A.click('#sndp .sndr[data-k="m"] .sndm')
  # 6. close: Escape and outside click
  A.keyboard.press('Escape');A.wait_for_timeout(200);ok(A.evaluate("document.getElementById('sndp').hidden"),'Escape closes the panel')
  A.click('#sndb');A.wait_for_timeout(200);A.mouse.click(300,500);A.wait_for_timeout(200)
  ok(A.evaluate("document.getElementById('sndp').hidden"),'clicking elsewhere closes it')
  # 7. the Sales Floor's own Volume button
  A.evaluate("openTab('Team Chat');CH.ch='__voice';go()");A.wait_for_timeout(600)
  ok(A.locator(".vcc button:has-text('Volume')").count()==1,'the Sales Floor has a Volume button')
  A.click(".vcc button:has-text('Volume')");A.wait_for_timeout(300)
  ok(A.evaluate("!document.getElementById('sndp').hidden&&SNDX.state().v.vo===50"),'it opens the same panel')
  A.screenshot(path=OUT+'/snd_floor.png')
  A.keyboard.press('Escape')
  # 8. saved on this device
  A.wait_for_timeout(600);A.reload();A.wait_for_function("OWQC.phase==='in'",timeout=30000);A.wait_for_timeout(800)
  st=A.evaluate("SNDX.state()")
  ok(st['v']['fx']==50 and st['v']['mu']==50 and st['v']['vo']==50 and st['p'].get('John Montini')==40,'levels are remembered after a reload',st)
  # 9. phone: bottom sheet
  lgx.login(A,2);A.wait_for_timeout(600);A.set_viewport_size({'width':390,'height':800});A.wait_for_timeout(400)
  A.evaluate("try{RAIL=false;railApply()}catch(e){}");A.wait_for_timeout(300)
  A.click('#sndb');A.wait_for_timeout(400)
  r=A.evaluate("(()=>{const e=document.getElementById('sndp'),b=e.getBoundingClientRect();return{sheet:e.classList.contains('sheet'),l:b.left,r:b.right,b:b.bottom,w:innerWidth,h:innerHeight}})()")
  ok(r['sheet'] and r['l']>=0 and r['r']<=r['w'] and r['b']<=r['h'],'on a phone it opens as a bottom sheet inside the screen',r)
  A.screenshot(path=OUT+'/snd_phone.png')
  ok(all(not v for v in errs.values()),'no page errors',errs)
  b.close()
finally:
  srv.terminate()
print('RESULT',sum(res),'/',len(res))
