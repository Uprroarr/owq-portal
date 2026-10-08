"""Battle Pass page: XP from portal data, scaled tiers, 100-card track, locker equip -> look code, team standings, tier-up pop-up, sidebar spot."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8836;SITE=os.environ.get('SITE',SP+'/web/test/site_ln');URL='http://127.0.0.1:%d/index.html'%PORT;OUT=SP+'/web/test/shots'
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:400]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  ctx=b.new_context(viewport={'width':1366,'height':900});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(1500)
  nav=A.evaluate("Object.keys(views)");i=nav.index('Leaderboard') if 'Leaderboard' in nav else -1
  ok(i>=0 and nav[i+1]=='Battle Pass','Battle Pass sits right under Leaderboard',nav)
  ok(A.evaluate("views['Battle Pass'][2]")==A.evaluate("views['Leaderboard'][2]"),'in the same sidebar section')
  # tiers: 100 rewards, all distinct, scaled cost
  ok(A.evaluate("BPT.length")==101 and A.evaluate("new Set(BPT.slice(1).map(r=>r.join(':'))).size")==100,'100 tiers, 100 different rewards')
  c=A.evaluate("[bpCost(1),bpCost(50),bpCost(100),BPCUM[100]]");ok(c[0]<c[1]<c[2],'each tier costs more than the last',c)
  ok(A.evaluate("BPT.slice(1).every((r,i)=>bpItem(i+1)&&bpItem(i+1).nm&&!/undefined/.test(bpItem(i+1).nm))"),'every reward has a name',A.evaluate("BPT.slice(1).map((r,i)=>bpItem(i+1)&&bpItem(i+1).nm).filter(n=>!n||/undefined|^[A-Z]\\d/.test(n))"))
  # give Austin some real-looking activity and check XP
  A.evaluate("""(()=>{const t=new Date().toISOString().slice(0,10);D.activity=(D.activity||[]).filter(a=>a.ag!=='Austin Vardzel');
    for(let i=0;i<10;i++)D.activity.push({d:'2026-09-'+String(10+i),ag:'Austin Vardzel',h:6,con:80,app:2,clock:1});
    D.policies=(D.policies||[]).filter(p=>p.ag!=='Austin Vardzel');for(let i=0;i<4;i++)D.policies.push({id:'bpt'+i,ag:'Austin Vardzel',ap:1200,st:i<3?'Issued':'Submitted',d:'2026-09-1'+i});save()})()""")
  x=A.evaluate("bpXP('Austin Vardzel')");want=60*20+800*2+20*20+4*150+3*100+3*1200/20
  parts={q['k']:q['xp'] for q in x['P']}
  ok(parts['h']==1200 and parts['c']==1600 and parts['a']==400 and parts['p']==600 and parts['i']==480,'XP: hours 20/h, contacts 2, appts 20, policies 150, issued 100 + AP/20',parts)
  ok(x['total']>=want,'total includes every source',(x['total'],want))
  lv=A.evaluate("bpLv(bpXP('Austin Vardzel').total)");ok(lv['lvl']>0,'Austin has a real tier from his work',lv)
  # page
  A.evaluate("openTab('Battle Pass')");A.wait_for_timeout(1200)
  ok(A.locator('#bxrow .bxc').count()==100,'the track shows 100 tier cards',A.locator('#bxrow .bxc').count())
  ok(A.locator('.bxbadge').count()==1 and 'XP' in A.inner_text('.bxh'),'hero shows the tier badge and XP bar')
  ok(A.locator('.bxtm').count()>=5,'team standings list the agents',A.locator('.bxtm').count())
  A.screenshot(path=OUT+'/bp_page.png')
  # owner preview unlocks all for testing; equip a hat and a desk -> look code
  A.evaluate("bpPv(true)");A.wait_for_timeout(600)
  ok(A.locator('#bxrow .bxc.own').count()==100,'owner preview unlocks everything (for testing)')
  A.evaluate("bpEquip('H',12)");A.evaluate("bpEquip('D',4)");A.wait_for_timeout(500)
  look=A.evaluate("VOX.ava");ok('H12' in look and 'D4' in look,'equipping writes the reward into the Sales Floor look code',look)
  ok(A.evaluate("voApi.bp().has('H',12)") and A.evaluate("voApi.bp().em('griddy')") and A.evaluate("voApi.bp().sig"),'the Sales Floor sees what is unlocked')
  A.evaluate("bpEquip('H',12)");A.wait_for_timeout(300);ok('H12' not in A.evaluate("VOX.ava"),'equipping the same hat again takes it off')
  A.evaluate("bpOpen(90)");A.wait_for_timeout(300);print('MD',A.evaluate("document.getElementById('md').innerHTML.slice(0,300)"),A.evaluate("JSON.stringify(bpItem(90))"));ok('Throne' in A.evaluate("document.getElementById('md').textContent"),'tapping a card opens its details (tier 90 Throne)')
  A.evaluate("closeM()")
  A.screenshot(path=OUT+'/bp_page_pv.png',full_page=True)
  A.evaluate("bpPv(false)");A.wait_for_timeout(400)
  # emotes panel gets unlocked emotes
  h=A.evaluate("voEmoPanel()");ok('voEmote(' in h,'emotes panel still renders',h[:100])
  # tier up pop-up
  A.evaluate("localStorage.setItem(bpKey(),'0')");A.evaluate("bpCheckUp()");A.wait_for_timeout(600)
  me=A.evaluate("bpMe().lvl")
  if me>0:
      ok(A.evaluate("!!document.getElementById('bxup')"),'reaching a new tier pops a TIER UP celebration',me)
      A.screenshot(path=OUT+'/bp_up.png')
  else:print('note: owner has tier 0 in this test data, celebration skipped')
  A.set_viewport_size({'width':390,'height':844});A.evaluate("document.getElementById('bxup')&&document.getElementById('bxup').remove();openTab('Battle Pass')");A.wait_for_timeout(800)
  ok(A.evaluate("document.documentElement.scrollWidth<=innerWidth+1"),'phone: no sideways page scroll (the track scrolls on its own)')
  A.screenshot(path=OUT+'/bp_phone.png')
  # loot crates
  A.set_viewport_size({'width':1366,'height':900});A.evaluate("bpPv(false);localStorage.removeItem(bxKey());openTab('Battle Pass')");A.wait_for_timeout(800)
  ok(A.evaluate("BXCR")==[17,46,79],'crates at tiers 17, 46, 79')
  ok(A.evaluate("BXCR.every(t=>!!document.querySelector('#bxc'+t+' .bxcrb'))"),'those tier cards carry a + LOOT CRATE badge')
  P=A.evaluate("bxOdds()");ok(sum(P)==100 and P[-1]==1 and P[0]==30,'drop rates add up to 100%, Bugatti 1%',P)
  # distribution over many names follows the odds
  dist=A.evaluate("(()=>{const c=new Array(11).fill(0);for(let i=0;i<20000;i++){const r=bxCar('Agent '+i,i%3);c[r]++}return c})()")
  ok(abs(dist[1]/200-30)<2 and abs(dist[10]/200-1)<.6,'20,000 test opens match the odds (Civic ~30%, Bugatti ~1%)',[round(x/200,2) for x in dist[1:]])
  ok(A.evaluate("bxCar('Austin Vardzel',0)===bxCar('Austin Vardzel',0)"),'the same person always gets the same car from a crate (no re-rolls)')
  A.evaluate("bpPv(true)");A.wait_for_timeout(500)
  A.click(".bxcrt.rd .btn");A.wait_for_timeout(6800)
  ok('Make it my ride' in A.evaluate("document.getElementById('md').textContent"),'opening spins the reel and reveals the car',A.evaluate("document.getElementById('md').textContent.slice(0,200)"))
  A.screenshot(path=OUT+'/bp_crate.png')
  A.click("#md .bxres .btn:not(.o)");A.wait_for_timeout(600)
  ok('W' in A.evaluate("VOX.ava"),'Make it my ride puts the car in the look code',A.evaluate("VOX.ava"))
  A.evaluate("bxOddsM()");A.wait_for_timeout(300);ok('Bugatti' in A.evaluate("document.getElementById('md').textContent"),'the drop-rate panel lists every car');A.screenshot(path=OUT+'/bp_odds.png');A.evaluate("closeM()")
  A.evaluate("bpPaint()");A.wait_for_timeout(400);A.screenshot(path=OUT+'/bp_crates.png',full_page=True)
  ok(not errs,'no page errors',errs)
  b.close()
finally:srv.terminate()
print('%d/%d'%(sum(res),len(res)))
