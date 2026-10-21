"""v120 batch 4: chat channels and files, private 1-on-1 + ideas, MTD hype board, Sales Floor only hours, 10 minute idle
sign-out with docking, usage tracking, exploit fixes, weekly time-tracking report."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8863;SITE=os.environ.get('SITE',SP+'/web/test/site_b4');URL='http://127.0.0.1:%d/index.html'%PORT
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:500]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
def page(ctx,who,errs):
  X=ctx.new_page();X.on('pageerror',lambda e:errs.append(who['email']+': '+str(e)[:200]))
  X.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps(who));X.goto(URL);X.wait_for_function("window.__FAKE",timeout=20000);return X
def signin(X,idx):
  X.wait_for_function("OWQC.phase==='out'||OWQC.phase==='in'",timeout=30000)
  if X.evaluate("OWQC.phase")=='out':X.click('#owqgi');X.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(X,idx);X.wait_for_timeout(1200)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  ctx=b.new_context(viewport={'width':1440,'height':900});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  K.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})")
  K.evaluate("__FAKE.call('seed',{docs:[{path:'members/john@example.com',data:{name:'John Montini',role:'member',at:1}},{path:'members/nate@example.com',data:{name:'Nate Johnson',role:'member',at:1}}]})")
  O=page(ctx,{'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'},errs);O.evaluate("sessionStorage.clear()");O.reload()
  signin(O,2);O.wait_for_function("typeof SYN!=='undefined'&&SYN.first",timeout=40000)
  ok(O.evaluate("!(D.shifts||[]).some(s=>!s.end&&s.ag==='Cole Leckey'&&shiftLive(s))"),'signing in does not start the clock (only the Sales Floor does)')
  O.evaluate("VC.on=1;acIn()");s=O.evaluate("(D.shifts||[]).filter(s=>!s.end&&s.ag==='Cole Leckey')")
  ok(len(s)==1 and s[0].get('fl')==1,'joining the Sales Floor clocks you in',s)
  O.evaluate("VC.on=0;acOut()");ok(O.evaluate("!(D.shifts||[]).some(s=>!s.end&&s.ag==='Cole Leckey')"),'leaving clocks you out')
  # channels
  O.evaluate("openTab('Team Chat')");O.wait_for_timeout(900)
  t=O.inner_text('#chcl')
  ok('Wins' not in t and 'Lead Flow' not in t and 'General' in t,'Wins and Lead Flow are gone',t)
  ok('Ideas Inbox' in t and 'John Montini' in t and 'Nate Johnson' in t,'owner sees a private channel per agent and the Ideas Inbox',t)
  hb=O.inner_text('#chhy');ok(all(n.split(' ')[0] in hb for n in O.evaluate("D.agents.map(a=>a.name)")) and 'TO DATE' in hb.upper(),'Hype Board lists everyone, month to date',hb)
  # agent John
  J=page(ctx,{'uid':'uJohn','email':'john@example.com','displayName':'John'},errs);signin(J,3)
  me=J.evaluate("WHO");J.evaluate("openTab('Team Chat')");J.wait_for_timeout(900)
  t=J.inner_text('#chcl');ok('Cole (Agency Owner)' in t and 'Ideas Inbox' not in t and 'Nate' not in t,'an agent sees only their own private channel with the owner',t)
  J.evaluate("chGo(dmMine())");J.wait_for_timeout(500)
  J.fill('#chi','Hey Cole, quick question');J.keyboard.press('Enter');J.wait_for_timeout(1200)
  J.click('.dmib');J.wait_for_timeout(200);J.fill('#id_t','Dark mode for the CRM');J.fill('#id_d','Easier on the eyes at night');J.click("#md .btn:has-text('Send idea')");J.wait_for_timeout(1500)
  ok(J.evaluate("chIn(dmMine()).length")==2,'messages and ideas post in the private channel',J.evaluate("chIn(dmMine()).length"))
  N=page(ctx,{'uid':'uNate','email':'nate@example.com','displayName':'Nate'},errs);signin(N,1)
  N.evaluate("openTab('Team Chat')");N.wait_for_timeout(1200);dk=J.evaluate("dmMine()")
  ok(N.evaluate("k=>!dmCan(k)",dk) and N.evaluate("k=>(chGo(k),CH.ch)",dk)=='General','another agent cannot open someone else\'s private channel')
  ok(not N.evaluate("D.alerts.some(a=>/quick question|Dark mode/.test(a.m||''))"),'and gets no alert from it')
  O.wait_for_timeout(1500);O.evaluate("chGo('__ideas')");O.wait_for_timeout(800)
  t=O.inner_text('#main');ok('Dark mode for the CRM' in t and 'IDEAS INBOX' in t.upper(),'the idea lands in the owner\'s Ideas Inbox',t[:300])
  O.click(".idbs button:has-text('Planned')");O.wait_for_timeout(1200)
  ok(J.evaluate("chIn(dmMine()).find(m=>m.idea).idea.st")=='plan','owner sets the status and the agent sees it')
  O.screenshot(path=SP+'/web/test/shots/b4_ideas.png')
  # attachments
  J.evaluate("chGo('General')");J.wait_for_timeout(300)
  J.set_input_files('#chfile',files=[{'name':'pitch.mp3','mimeType':'audio/mpeg','buffer':b'\xff\xfb'+os.urandom(3*1024*1024)}]);J.wait_for_timeout(1500)
  ok(J.evaluate("CH.att&&CH.att.type")=='audio/mpeg','audio files up to 5 MB can be attached',J.evaluate("CH.att&&[CH.att.type,CH.att.size]"))
  ok(J.locator("button[aria-label='Paste']").count()==1,'Paste button in the message bar')
  J.evaluate("CH.att=null;chStage()")
  # idle sign-out and docking
  J.evaluate("VC.on=1;acIn();VC.on=0");sid=J.evaluate("openShift(acWho()).id")
  J.evaluate("const s=openShift(acWho());s.start=Date.now()-30*6e4;FL.last=Date.now()-11*6e4")
  J.evaluate("flTick()");J.wait_for_timeout(1500)
  ok(J.evaluate("ONLINE")==0,'10 minutes without activity signs you out')
  sh=J.evaluate("id=>D.shifts.find(s=>s.id===id)",sid)
  ok(sh and sh['end'] and abs((sh['end']-sh['start'])/6e4-19)<1.5 and sh.get('dock',0)>=10,'the idle minutes are docked (30 min session counts 19)',sh and [(sh['end']-sh['start'])/6e4,sh.get('dock')])
  ok('not counted' in J.evaluate("LGMSG||document.body.innerText"),'and it says so')
  signin(J,3)
  l0=J.evaluate("FL.last");J.mouse.move(100,100);J.mouse.move(400,300);J.wait_for_timeout(200)
  ok(J.evaluate("FL.last")==l0,'moving the mouse alone does not count as activity (anti-jiggler)')
  J.mouse.click(300,10);J.wait_for_timeout(100);ok(J.evaluate("FL.last")>l0,'a click does')
  # exploits
  r=J.evaluate("""(()=>{const n=WHO;const before=lbStats('0000-00-00',today).find(x=>x.nm===n);const eb=ecoEarn(n).P.find(p=>p.k==='h');D.activity.push({d:today,ag:n,h:40,con:0,app:900});const after=lbStats('0000-00-00',today).find(x=>x.nm===n);
   const e0=ecoEarn(n).P.find(p=>p.k==='h');return {bh:before.hrs,ah:after.hrs,bp:before.pts,ap:after.pts,app:after.app-before.app,eh:e0?e0.n:0,ebh:eb?eb.n:0}})()""")
  ok(abs(r['ah']-r['bh'])<1e-6,'hand-logged hours add nothing to leaderboard hours',r)
  ok(r['app']<=30,'appointments count at most 30 a day',r)
  ok(r['eh']==r['ebh'] and J.evaluate("(()=>{const x=bpXP(WHO).P.find(p=>p.k==='h');return x?x.n:0})()")==r['eh'],'hand-logged hours earn no credits or Battle Pass XP',r)
  # usage tracking
  for pg in ['Leaderboard','Clients','Command Deck']:J.evaluate("p=>openTab(p)",pg);J.wait_for_timeout(300)
  J.evaluate("utSave()");J.wait_for_timeout(800)
  u=J.evaluate("claude.use('db').then(db=>db.doc('usage/'+fileKey(acWho())+'_'+dkey(new Date())).get()).then(s=>s.exists?s.data():null)")
  ok(u and u['v'].get('Leaderboard',0)>=1 and u['c']>=1 and len(u['r'])>=3,'page views, clicks and the route are recorded',u and {k:u[k] for k in ['c','mm','act']})
  O.evaluate("UTV.at=0;UTV.rows=null;openTab('Agency Performance','Time Report')");O.wait_for_timeout(2500)
  t=O.inner_text('#main');ok('PORTAL ACTIVITY' in t.upper() and 'WEEKLY TIME-TRACKING REPORT' in t.upper(),'owner sees portal activity and the weekly report in the Time Report',t[-400:])
  ck=O.evaluate("flSelfTest()");ok(all(c[1] for c in ck),'all integrity checks pass',ck)
  O.screenshot(path=SP+'/web/test/shots/b4_report.png',full_page=True)
  ok(not errs,'no page errors',errs)
  b.close()
finally:srv.terminate()
print('%d/%d'%(sum(res),len(res)))
