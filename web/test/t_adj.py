"""One-time hours correction for Mon Oct 5, 2026: applied on the owner's device after the shared data loads (Cole +4 h, Austin,
Nate, John +2 h; RJ and Ayman untouched), shows in each Time Clock, not duplicated on reload, not re-added after a delete,
never applied by a teammate."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8812;SITE=os.environ.get('SITE',SP+'/web/test/site');URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--disable-webgl','--no-proxy-server']
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:500]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
Q="""(()=>{const day=a=>a.d==='2026-10-05';const tot={};D.agents.forEach(g=>{tot[g.name]=+D.activity.filter(a=>a.ag===g.name&&day(a)).reduce((s,a)=>s+(+a.h||0),0).toFixed(2)});
 return {sh:D.shifts.filter(s=>/^adj1005/.test(s._i||'')).map(s=>[s.ag,(s.end-s.start)/36e5,new Date(s.start).getDate(),new Date(s.start).getHours()]),act:D.activity.filter(a=>/^adj1005/.test(a._i||'')).map(a=>[a.ag,a.h,a.d]),tot}})()"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1280,'height':800})
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  A.wait_for_function("typeof SYN!=='undefined'&&SYN.first",timeout=30000)
  before=A.evaluate(Q);print('before login',json.dumps(before))
  lgx.login(A,2);A.wait_for_timeout(500)
  A.wait_for_function("D.shifts.filter(s=>/^adj1005/.test(s._i||'')).length>=4",timeout=20000)
  r=A.evaluate(Q);print('after',json.dumps(r))
  want={'Cole Leckey':4,'Austin Vardzel':2,'Nate Johnson':2,'John Montini':2}
  ok(sorted([(x[0],x[1]) for x in r['sh']])==sorted(want.items()),'one added shift each: Cole 4 h, Austin, Nate and John 2 h',r['sh'])
  ok(all(x[2]==5 for x in r['sh']),'all on Monday Oct 5',r['sh'])
  ok(sorted([(x[0],x[1],x[2]) for x in r['act']])==sorted([(k,v,'2026-10-05') for k,v in want.items()]),'the hours are recorded for Oct 5',r['act'])
  ok(all(abs(r['tot'][k]-before['tot'].get(k,0)-v)<.01 for k,v in want.items()),'their Oct 5 totals go up by exactly that',[r['tot'],before['tot']])
  ok(r['tot'].get('RJ Noullet',0)==before['tot'].get('RJ Noullet',0) and r['tot'].get('Ayman',0)==before['tot'].get('Ayman',0),'RJ and Ayman are unchanged')
  ok(A.locator('#rail').inner_text().find('Hours added for Mon, Oct 5')>=0 or A.evaluate("AL().some(a=>a.t==='Hours added for Mon, Oct 5')"),'the owner gets an alert listing what was added')
  A.wait_for_timeout(1500);A.reload();A.wait_for_function("OWQC.phase==='in'",timeout=30000);lgx.login(A,2);A.wait_for_timeout(5000)
  r2=A.evaluate(Q);ok(len(r2['sh'])==4 and len(r2['act'])==4,'reloading does not add them twice',r2)
  # delete Austin's added shift: it is not added back
  sid=A.evaluate("D.shifts.find(s=>s._i==='adj1005s1').id");A.evaluate("id=>{D.shifts=D.shifts.filter(s=>s.id!==id);D.activity=D.activity.filter(a=>a.clock!==id);save()}",sid);A.wait_for_timeout(2500)
  A.reload();A.wait_for_function("OWQC.phase==='in'",timeout=30000);lgx.login(A,2);A.wait_for_timeout(6000)
  r3=A.evaluate(Q);ok(len(r3['sh'])==3 and not any(x[0]=='Austin Vardzel' for x in r3['sh']),'a deleted adjustment is not added back',r3['sh'])
  # the Time Clock shows Cole's added shift
  A.evaluate("openTab('Agency Performance');SUB['Agency Performance']='Agents';go()");A.wait_for_timeout(800)
  print('clock text sample',A.evaluate("(()=>{try{return clockPanel('Cole Leckey').replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').slice(0,300)}catch(e){return String(e)}})()"))
  ok(not errs,'no page errors',errs)
  b.close()
finally:
  srv.terminate()
print('RESULT',sum(res),'/',len(res))
