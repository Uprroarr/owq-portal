"""Live tracking and the Time Report: each minute on the clock is recorded on the shift (working, Sales Floor only, on screen,
away; speaking, mic, interactions, sections); the report shows a week per agent with overlaps counted once, a session that
stopped without a clock-out counted to its last heartbeat, long sessions flagged and hand-logged hours listed."""
import sys, os, time, json, subprocess
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'; sys.path.insert(0, SP)
import lgx
from playwright.sync_api import sync_playwright
PORT = int(os.environ.get('PORT', 8832)); SITE = os.environ.get('SITE', SP + '/web/test/site_trk'); URL = 'http://127.0.0.1:%d/index.html' % PORT
res = []
def ok(c, m, info=''): res.append(bool(c)); print(('PASS ' if c else 'FAIL ') + m + ('' if c else '  ' + str(info)[:400]), flush=True)
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=SITE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
# Nate's week: Mon two overlapping sessions (5 h on the clock, 1 h overlap), Tue a 14.5 h session with tracking,
# Wed a session that stopped answering after 3 h (no clock-out), Thu 3 h logged by hand; and one session last week
SEED = """const m0=trkMon(0).getTime(),H=36e5,mk=(id,a,b,o)=>Object.assign({id,ag:'Nate Johnson',start:m0+a*H,end:b==null?null:m0+b*H,auto:1,hb:m0+(b==null?a+3:b)*H,_i:'tt'+id,_t:(m0+a*H)*1000},o||{});
  const S=[mk(9101,8,12),mk(9102,11,13),mk(9103,24+9,24+23.5,{tk:{n:870,w:300,l:400,p:100,h:70,s:120,m:200,g:30,i:900,t:{'Sales Floor':500,'Clients':200,'Command Deck':100}}}),mk(9104,48+9,null),mk(9105,-7*24+10,-7*24+16)];
  D.shifts=(D.shifts||[]).filter(s=>!String(s._i||'').startsWith('tt')).concat(S);
  const day=o=>dkey(new Date(m0+o*H));
  D.activity=(D.activity||[]).filter(a=>!String(a._i||'').startsWith('tt')).concat([{d:day(8),ag:'Nate Johnson',h:4,con:0,app:0,clock:9101,_i:'tta1'},{d:day(11),ag:'Nate Johnson',h:2,con:0,app:0,clock:9102,_i:'tta2'},{d:day(33),ag:'Nate Johnson',h:14.5,con:0,app:0,clock:9103,_i:'tta3'},{d:day(72+9),ag:'Nate Johnson',h:3,con:12,app:1,_i:'tta4'},{d:day(-7*24+10),ag:'Nate Johnson',h:6,con:0,app:0,clock:9105,_i:'tta5'}]);
  save()"""
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--no-sandbox', '--disable-webgl', '--no-proxy-server'])
        ctx = b.new_context(viewport={'width': 1366, 'height': 900}); ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
        errs = []
        K = ctx.new_page(); K.goto('http://127.0.0.1:%d/keep.html' % PORT); K.wait_for_function('window.__FAKE')
        A = ctx.new_page(); A.on('pageerror', lambda e: errs.append(str(e)[:200]))
        A.add_init_script("window.__FAKE_SIGNIN=%s;" % json.dumps({'uid': 'uOwner', 'email': 'owner@example.com', 'displayName': 'Cole Leckey'}))
        A.goto(URL); A.wait_for_function("window.__FAKE", timeout=20000); A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})"); A.evaluate("sessionStorage.clear()"); A.reload()
        A.wait_for_function("OWQC.phase==='out'", timeout=30000); A.click('#owqgi'); A.wait_for_function("OWQC.phase==='in'", timeout=30000)
        lgx.login(A, 2); A.wait_for_timeout(1500)
        A.wait_for_function("typeof SYN!=='undefined'&&SYN.first", timeout=30000)
        # ---- the report
        # seed, render and measure in one go (the clock's own sweep would otherwise close the stopped session within a minute)
        R = A.evaluate("(()=>{" + SEED + ";TRKV.ag='Nate Johnson';TRKV.wk=0;openTab('Agency Performance');SUB['Agency Performance']='Time Report';go();const R=trkReport('Nate Johnson',m0,trkMon(1).getTime());return {txt:document.getElementById('main').innerText,sel:(document.querySelector('.trkh select')||{}).value,bars:document.querySelectorAll('.trkbar i').length,tbl:(document.querySelector('.trkt')||{}).innerText||'',hrs:R.hrs,ov:R.overlap,stale:R.stale,long:R.long,hand:R.hand,portal:R.portal,ses:R.ses,worked:R.worked,mon:R.days[0].hrs,tue:R.days[1].hrs,wed:R.days[2].hrs,tk:R.tk.n,w:R.tk.w}})()")
        txt = R['txt']
        ok('TIME REPORT' in txt.upper() and R['sel'] == 'Nate Johnson', 'Agency Performance has a Time Report showing the chosen agent', txt[:200])
        ok(abs(R['mon'] - 5) < .01 and abs(R['ov'] - 1) < .01, 'two overlapping sessions count once (5 h, 1 h overlap shown)', R)
        ok(abs(R['wed'] - 3) < .01 and R['stale'] == 1, 'a session with no clock-out counts to its last heartbeat (3 h, not until now)', R)
        ok(abs(R['tue'] - 14.5) < .01 and R['long'] == 1, 'a 14.5 h session is flagged as long', R)
        ok(abs(R['hand'] - 3) < .01 and R['worked'] == 4, 'hours logged by hand are listed on their day', R)
        ok(abs(R['hrs'] - 22.5) < .01 and abs(R['portal'] - 23.5) < .01, 'the week: 22.5 h on the clock + 3 by hand; the Leaderboard counts 23.5 (the overlap twice)', R)
        ok('overlapped' in txt and 'without a clock-out' in txt and 'logged by hand' in txt and 'long session' in txt, 'the page explains the overlap, the missing clock-out, the hand-logged hours and the long session', txt[:600])
        ok(R['tk'] == 870 and R['bars'] >= 3, 'tracked days show what the time was (working / Sales Floor / on screen / away)', R)
        ok('Sales Floor' in R['tbl'], 'and where the time went', R['tbl'][:300])
        A.evaluate("trkGo('wk',-1)"); A.wait_for_timeout(500)
        R2 = A.evaluate("(()=>{const R=trkReport('Nate Johnson',trkMon(-1).getTime(),trkMon(0).getTime());return {hrs:R.hrs,ses:R.ses}})()"); t2 = A.evaluate("document.querySelector('.trkh').innerText")
        ok(abs(R2['hrs'] - 6) < .01 and 'LAST WEEK' in t2.upper(), 'Previous week shows last week (6 h)', [R2, t2[:200]])
        A.screenshot(path=SP + '/web/test/shots/trk_lastweek.png', full_page=False)
        A.evaluate("trkGo('wk',0)"); A.wait_for_timeout(500); A.screenshot(path=SP + '/web/test/shots/trk_week.png', full_page=False)
        # ---- the time clock and the scorecard
        st = A.evaluate("(()=>{const s=D.shifts.find(x=>x.id===9104);return {h:shiftHrs([s],0),end:shEnd(s)-s.start}})()")
        ok(abs(st['h'] - 3) < .01, 'the Time Clock counts a stopped session to its last heartbeat', st)
        A.evaluate("(()=>{SUB['Agency Performance']='Agents';AGD=null;go()})()"); A.wait_for_timeout(500)
        ok('HOURS (ALL TIME)' in A.evaluate("document.getElementById('main').innerText").upper(), 'the Agents scorecard says its hours are all time')
        # ---- live tracking: the heartbeat records each minute on my own open shift
        A.evaluate("VC.on=1;acIn();VC.on=0")
        sh0 = A.evaluate("(()=>{const s=openShift(acWho());return s?{auto:s.auto,tk:s.tk||null}:null})()")
        ok(sh0 and sh0['auto'], 'joining the Sales Floor clocked me in (v120: floor-only time)', sh0)
        A.evaluate("(()=>{document.body.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'Shift',bubbles:true}));acBeat()})()")
        t1 = A.evaluate("(()=>{const T=openShift(acWho()).tk;return JSON.parse(JSON.stringify(T))})()")
        ok(t1['n'] == 1 and t1['w'] == 1 and t1['i'] >= 2, 'a minute with clicks and keys counts as working, with its interactions', t1)
        ok(t1['t'].get('Agency Performance') == 1, 'and the section it was spent in', t1['t'])
        A.evaluate("acBeat()"); t2 = A.evaluate("JSON.parse(JSON.stringify(openShift(acWho()).tk))")
        ok(t2['n'] == 2 and t2['p'] == 1 and t2['w'] == 1, 'a minute with no input, portal on screen, counts as on screen', t2)
        A.evaluate("(()=>{VC.on=true;VC.sp=1;VC.mic={getTracks:()=>[]};VC.muted=false})()"); A.wait_for_timeout(1300); A.evaluate("acBeat()")
        t3 = A.evaluate("JSON.parse(JSON.stringify(openShift(acWho()).tk))")
        A.evaluate("(()=>{VC.on=false;VC.sp=0;VC.mic=null})()")
        ok(t3['n'] == 3 and t3['l'] == 1 and t3['s'] == 1 and t3['m'] == 1, 'a minute in the Sales Floor lobby without input counts as Sales Floor only, with speaking and mic on', t3)
        A.evaluate("save()"); A.wait_for_timeout(1500)
        synced = A.evaluate("(()=>{const s=openShift(acWho());const j=Object.values(SYN.sent.shifts||{}).map(x=>{try{return JSON.parse(x)}catch(e){return null}}).find(o=>o&&o.id===s.id);return j&&j.tk?j.tk.n:null})()")
        ok(synced == 3, 'the tracked minutes go out to the team with the shift', synced)
        # ---- an agent sees only their own report
        own = A.evaluate("(()=>{const w=WHO;WHO='Nate Johnson';TRKV.ag='Austin Vardzel';const h=trkPage(),r={sel:/<select/.test(h),nate:/Nate Johnson/.test(h),ag:TRKV.ag};WHO=w;TRKV.ag='Nate Johnson';return r})()")
        ok(not own['sel'] and own['ag'] == 'Nate Johnson', 'an agent sees only their own Time Report', own)
        ok(not errs, 'no page errors', errs)
        b.close()
finally:
    srv.terminate()
print('%d/%d' % (sum(res), len(res)))
