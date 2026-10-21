"""v119 batch 3: themes (shop items, apply, custom), performance modes, Settings page, intro song upload, compact Leaderboard,
one-screen Command Deck."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8861;SITE=os.environ.get('SITE',SP+'/web/test/site_b3');URL='http://127.0.0.1:%d/index.html'%PORT
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:500]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server','--autoplay-policy=no-user-gesture-required'])
  ctx=b.new_context(viewport={'width':1440,'height':900});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_function("typeof SYN!=='undefined'&&SYN.first",timeout=40000);A.evaluate("(()=>{try{mock()}catch(e){}})()");A.wait_for_timeout(1500)
  # command deck
  A.evaluate("openTab('Command Deck')");A.wait_for_timeout(1500)
  h=A.evaluate("document.getElementById('main').scrollHeight");ok(h<1900,'Command Deck fits in about one and a half screens (was 2,400px)',h)
  ok(A.locator('.dkg .dkcore').count()==1 and A.locator('.dkk .mod').count()==4 and A.locator('#pls').count()==1 and A.locator('.apx-peeks').count()==1,'reactor, 4 tiles, live pulse and peeks share the top of the page')
  A.click(".dkts button:has-text('Alerts')");A.wait_for_timeout(400);ok(A.locator('.dktbb #dal').count()==1,'briefing / alerts / progress sit in one tabbed card')
  # leaderboard
  A.evaluate("openTab('Leaderboard')");A.wait_for_timeout(1200)
  ok(A.locator('.lbt table tr.lbrow').count()==A.evaluate("D.agents.length") and A.locator('.t3g').count()==0,'one table, one row per agent, no category arena')
  hd=A.inner_text('.lbt tr').upper();ok(all(x in hd for x in ['POINTS','ISSUED PREMIUM','POLICIES','HOURS','APPOINTMENTS','WEEK GOAL']),'every number in one table',hd)
  ok(A.locator('.lbt .lbms').count()>=A.evaluate("D.agents.length")*5,'milestone progress under each number')
  A.click(".lbt th:has-text('Hours')");A.wait_for_timeout(500);ok(A.evaluate("LBM")=='hrs','tap a column to rank by it')
  # settings + themes
  A.evaluate("openTab('Settings')");A.wait_for_timeout(800)
  ok(A.locator('.stn2 button').count()==10,'Settings page with sections')
  ok(A.evaluate("[...document.querySelectorAll('#nav .nv')].filter(b=>/Settings/.test(b.textContent)).length")==1,'one Settings entry in the menu')
  A.evaluate("localStorage.setItem(thKey(),JSON.stringify({v:0}))")
  ok(A.evaluate("ecoCat().filter(x=>x.k==='U').length")==9,'nine themes are Shop items')
  A.evaluate("ECO.inv[ecoKey(WHO)]=Object.assign(ecoMine(),{own:Object.assign(ecoMine().own||{},{U1:1,U8:1})})")
  A.evaluate("thSet(1)");A.wait_for_timeout(600)
  bg=A.evaluate("getComputedStyle(document.body).backgroundColor");ac=A.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--red').trim()")
  ok(ac.lower()=='#3d7bff','applying Midnight Blue recolors the portal',[ac,bg])
  A.screenshot(path=SP+'/web/test/shots/b3_theme.png')
  A.evaluate("STG.sec='Appearance';go()");A.wait_for_timeout(300)
  A.evaluate("document.getElementById('thc_a').value='#00ffaa'");A.click(".thcd .btn");A.wait_for_timeout(500)
  ok(A.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--red').trim()").lower()=='#00ffaa','Custom Designer colors apply')
  A.evaluate("thSet(4)");A.wait_for_timeout(300)
  ok(A.evaluate("THS.cur===null||THS.cur.n!=='Gold Rush'") or A.evaluate("thOwned(4)"),'a theme you do not own does not apply')
  A.evaluate("thSet(0)");A.wait_for_timeout(300);ok(A.evaluate("!document.getElementById('owqth')"),'back to Crimson Ops')
  # performance
  A.evaluate("STG.sec='Performance';go()");A.click(".str .seg button:has-text('Battery saver')");A.wait_for_timeout(400)
  ok(A.evaluate("document.documentElement.classList.contains('perf-saver')") and A.evaluate("localStorage.getItem('owq_gfx')")=='low','battery saver dials down effects and 3D quality')
  A.click(".str .seg button:has-text('Automatic')");A.wait_for_timeout(300);ok(not A.evaluate("document.documentElement.classList.contains('perf-saver')"),'and back to automatic')
  # alerts settings
  A.evaluate("STG.sec='Alerts & Sound';go()");A.click(".str .seg button:has-text('Off')");A.wait_for_timeout(200)
  ok(A.evaluate("alVoice()")=='off','alert voice can be turned off')
  # intro song
  A.evaluate("STG.sec='Intro Song';go()");A.wait_for_timeout(300)
  A.set_input_files('#sg_f',SP+'/web/test/tone.wav');A.wait_for_function("SNG.buf&&!SNG.busy",timeout=15000);A.wait_for_timeout(300)
  ok(A.locator('#sg_st').count()==1,'uploaded file decodes and asks where the clip starts')
  A.fill('#sg_st','3');A.click("button:has-text('Save as my intro')");A.wait_for_function("!SNG.busy",timeout=15000);A.wait_for_timeout(800)
  src=A.evaluate("SONGS[WHO]||''");ok(src.startswith('data:audio/wav;base64,') and 400000<len(src)<900000,'a 12 second clip is saved (fits the database)',len(src))
  d=A.evaluate("claude.use('db').then(db=>db.doc('songs/'+fileKey(WHO)).get()).then(s=>s.exists?s.data().n:null)")
  ok(d=='Cole Leckey','saved to the shared songs list so it plays on any device',d)
  A.evaluate("SNG.loaded=0;delete SONGS['Cole Leckey'];sngLoad()");A.wait_for_timeout(1500)
  ok(A.evaluate("SONGS['Cole Leckey']")==src,'another device loads the same clip back')
  ok(A.evaluate("SONGS['Agency Owner']===SONGS['Cole Leckey']"),'Agency Owner shares Cole\'s song')
  # goals
  A.evaluate("STG.sec='Goals & Tracking';go()");A.fill('#st_hd','40');A.click(".stbx .btn:has-text('Save for the team')");A.wait_for_timeout(300)
  ok(A.evaluate("D.hDay")==40 and A.evaluate("eqPer('wk').goalH")==200,'goals from Settings drive Business Analytics',A.evaluate("eqPer('wk')"))
  A.set_viewport_size({'width':390,'height':844});A.wait_for_timeout(400)
  ok(A.evaluate("document.documentElement.scrollWidth<=innerWidth+1"),'Settings fits a phone')
  A.evaluate("openTab('Command Deck')");A.wait_for_timeout(800);ok(A.evaluate("document.documentElement.scrollWidth<=innerWidth+1"),'Command Deck fits a phone')
  ok(not errs,'no page errors',errs)
  b.close()
finally:srv.terminate()
print('%d/%d'%(sum(res),len(res)))
