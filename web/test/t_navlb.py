"""Sidebar: Leaderboard sits under Check-In in TEAM; Agency Performance shows Annualized Premium."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8826;SITE=os.environ.get('SITE',SP+'/web/test/site_ln');URL='http://127.0.0.1:%d/index.html'%PORT
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:400]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  ctx=b.new_context(viewport={'width':1280,'height':900});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(1500)
  nav=A.evaluate("(()=>{const out=[];document.querySelectorAll('#nav *').forEach(e=>{});const t=(document.getElementById('nav')||document.querySelector('nav,aside')).innerText;return t})()")
  lines=[l.strip() for l in nav.split('\n') if l.strip()]
  def idx(x):
      for i,l in enumerate(lines):
          if l.upper()==x.upper():return i
      return -1
  ci,lb,tm,bz=idx('CHECK-IN'),idx('LEADERBOARD'),idx('TEAM'),idx('BUSINESS')
  ok(ci>=0 and lb>ci and (bz<0 or lb<bz) and tm<ci,'Leaderboard is in TEAM, right under Check-In',lines[:40])
  sales=lines[idx('SALES'):idx('TEAM')] if idx('SALES')>=0 else []
  ok(not any(l.upper()=='LEADERBOARD' for l in sales),'and no longer under SALES',sales)
  A.evaluate("openTab('Leaderboard')");A.wait_for_timeout(800);ok(A.evaluate("tab")=='Leaderboard','Leaderboard still opens')
  A.evaluate("openTab('Agency Performance','Summary')");A.wait_for_timeout(800)
  t=A.inner_text('#main') if A.locator('#main').count() else A.inner_text('body')
  ok('ANNUALIZED PREMIUM' in t.upper() and 'SUBMITTED PREMIUM' not in t.upper(),'Agency Performance shows Annualized Premium',t[:400])
  A.screenshot(path=SP+'/web/test/shots/navlb.png')
  ok(not errs,'no page errors',errs)
  b.close()
finally:srv.terminate()
print('%d/%d'%(sum(res),len(res)))
