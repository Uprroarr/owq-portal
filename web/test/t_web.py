"""Website version end to end over the Firebase stand-in: sign-in gate, owner bootstrap, access request + approval,
portal login, live chat between two people, Sales Floor voice (real WebRTC, fake mic) between two people."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8790;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots';os.makedirs(OUT,exist_ok=True)
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--disable-webgl','--no-proxy-server','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required','--disable-features=WebRtcHideLocalIpsWithMdns']
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:300]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1366,'height':860},permissions=['microphone','camera'])
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  errs={'A':[],'B':[]}
  def page(tag,user):
      pg=ctx.new_page();pg.on('pageerror',lambda e:errs[tag].append(str(e)[:200]))
      pg.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps(user));return pg
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=page('A',{'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'})
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000)
  ok(A.locator('#owqg #owqgi').is_visible(),'signed out: the sign-in gate is shown')
  ok(A.evaluate("GXU.state()")in('menu','boot'),'the intro runs behind the gate')
  A.screenshot(path=OUT+'/gate_out.png')
  A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  ok(True,'owner signs in and is admitted')
  dump=A.evaluate("__FAKE.call('dump')")
  ok('members/owner@example.com' in dump['docs'],'owner record bootstrapped in Firestore',dump['docs'])
  ok((dump['rt'].get('members') or {}).get('owner@example,com')=='owner','owner listed for the live room',dump['rt'])
  A.wait_for_timeout(800);ok(A.evaluate("getComputedStyle(document.getElementById('owqg')).display==='none'||document.getElementById('owqg').classList.contains('out')"),'gate fades out')
  lgx.login(A,6);ok(A.evaluate("ONLINE===1"),'owner logs into the portal')
  ok(A.evaluate("!document.getElementById('owqtab').hidden"),'Team access button shown to the owner')
  A.wait_for_timeout(1500)
  ok(A.evaluate("!!(CH&&CH.live)"),'Team Chat is live on the shared database',A.evaluate("[CH.live,CH.err]"))
  ok(A.evaluate("!!(SYN&&SYN.on)"),'shared data layer is on')
  # B: not approved yet
  B=page('B',{'uid':'uNate','email':'nate@example.com','displayName':'Nate Johnson'})
  B.goto(URL);B.wait_for_function("OWQC.phase==='out'",timeout=30000);B.click('#owqgi')
  B.wait_for_function("OWQC.phase==='pending'",timeout=30000);ok(True,'unapproved account sees ACCESS PENDING')
  B.screenshot(path=OUT+'/gate_pending.png')
  B.click('#owqgr');B.wait_for_function("OWQC.reqd===true",timeout=10000)
  ok('requests/nate@example.com' in A.evaluate("__FAKE.call('dump')")['docs'],'access request recorded')
  # A approves from Team Access
  A.evaluate("OWQC.team()");A.wait_for_timeout(1200)
  ok(A.locator('#md .owqtm').count()==1 and 'nate@example.com' in A.inner_text('#md'),'owner sees the request in Team Access')
  A.select_option('#owqrn0','Nate Johnson');A.screenshot(path=OUT+'/team_access.png');A.click("#md button:has-text('Approve')");A.wait_for_timeout(1200)
  d=A.evaluate("__FAKE.call('dump')");ok('members/nate@example.com' in d['docs'] and 'requests/nate@example.com' not in d['docs'] and (d['rt'].get('members') or {}).get('nate@example,com')=='member','approval writes member records (both databases) and clears the request',d)
  A.evaluate("OWQC.teamClose()")
  B.reload();B.wait_for_function("OWQC.phase==='in'",timeout=30000);ok(True,'approved account is admitted after reload')
  lgx.login(B,1);ok(B.evaluate("ONLINE===1"),'teammate logs into the portal')
  B.wait_for_timeout(1500)
  # chat between the two
  A.evaluate("chPost({ch:'General',who:WHO,text:'Morning team, dials start at 9',at:Date.now()})")
  try:B.wait_for_function("CH.msgs.some(m=>m.text==='Morning team, dials start at 9')",timeout=15000);ok(True,'chat message arrives live on the other computer')
  except Exception as e:ok(False,'chat message arrives live on the other computer',B.evaluate("CH.msgs.length"))
  # voice: both join the Sales Floor with a (fake) microphone
  A.evaluate("vcJoin()");A.wait_for_timeout(800);B.evaluate("vcJoin()")
  ok(A.evaluate("!!VC.mic")and B.evaluate("!!VC.mic"),'microphone works on the website version (both joined with mic)',[A.evaluate("VC.err"),B.evaluate("VC.err")])
  conn=False
  for i in range(40):
      a=A.evaluate("Object.values(VC.pcs).map(p=>p.connectionState)");bb=B.evaluate("Object.values(VC.pcs).map(p=>p.connectionState)")
      if 'connected' in a and 'connected' in bb:conn=True;break
      time.sleep(0.5)
  ok(conn,'voice connection established between the two people',[a,bb])
  ok(A.evaluate("Object.keys(VC.rs).length>=1")and B.evaluate("Object.keys(VC.rs).length>=1"),'each side receives the other one\'s audio stream')
  ok(A.evaluate("VC.room.peers().filter(p=>p.presence&&p.presence.vc).length")==2,'both shown on the floor (presence)')
  B.evaluate("window.__got=[];window.__u=VC.room.on('zz',m=>{__got.push((m.data&&m.data.s||'').length)});0")
  A.wait_for_timeout(500)
  r=[A.evaluate("n=>VC.room.emit('zz',{s:'x'.repeat(n)}).then(()=>'ok',e=>'rej '+e.code)",n) for n in (10,9000)];B.wait_for_timeout(2500)
  g=B.evaluate("__got")
  ok(r==['ok','ok'] and g==[10,9000],'large call-setup messages (video offers) are delivered',[r,g,B.evaluate("VC.room===undefined?'none':typeof VC.room.on")])
  A.evaluate("vcCam()");B.wait_for_timeout(4000)
  ok(B.evaluate("Object.values(VC.rs).some(m=>Object.values(m).some(st=>st.getVideoTracks().length>0))"),'camera video reaches the other person',B.evaluate("Object.keys(VC.rs).length"))
  d=[x for x in A.evaluate("__FAKE.call('dump')")['docs'] if x.startswith('diag/')]
  ok(len(d)>=1,'call diagnostics recorded',d)
  B.evaluate("vcMute()");A.wait_for_timeout(800)
  ok(A.evaluate("VC.room.peers().some(p=>!p.sameTab&&p.presence.mu===1)"),'mute shows on the other side')
  B.evaluate("vcLeave()");A.wait_for_timeout(1500)
  ok(A.evaluate("VC.room.peers().filter(p=>p.presence&&p.presence.vc).length")==1,'leaving the floor shows on the other side')
  B.close();A.wait_for_timeout(1500)
  ok(A.evaluate("VC.room.peers().filter(p=>!p.sameTab).length")==0,'closing the page removes the person (disconnect)')
  A.screenshot(path=OUT+'/owner_portal.png')
  ok(not errs['A'] and not errs['B'],'no page errors',errs)
  b.close()
finally:
  srv.terminate()
print('RESULT',sum(res),'/',len(res))
