"""v122 batch 6: photoreal neon city on the login screen."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8866;SITE=os.environ.get('SITE',SP+'/web/test/site_b6');URL='http://127.0.0.1:%d/index.html'%PORT
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:500]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
def page(ctx,errs,init=''):
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]));A.on('console',lambda m:(m.type=='error' and 'ERR_NAME' not in m.text) and print('CONSOLE',m.text[:300]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;%s"%(json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}),init))
  A.goto(URL,wait_until='commit');A.wait_for_function("window.__FAKE",timeout=60000);return A
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-proxy-server'])
  ctx=b.new_context(viewport={'width':1280,'height':800});errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=page(ctx,errs,"try{localStorage.setItem('owq_gfx','medium');localStorage.setItem('owq_gq','auto')}catch(e){}")
  A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload(wait_until='commit')
  A.wait_for_function("OWQC.phase==='out'",timeout=60000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=60000)
  lgx.to_menu(A,180000)
  ok(A.evaluate("!!CITYV&&document.querySelectorAll('#gx canvas.owqcity').length===1"),'the city mounts on the login screen')
  ok(A.evaluate("document.getElementById('gx').classList.contains('cityon')&&!document.getElementById('gxc')"),'the globe is not started')
  inf=A.evaluate("CITYV.info()");ok(inf['tier']=='medium' and inf['buildings']>500,'the tier follows the graphics setting',inf)
  ok(A.evaluate("VO3.CITY_LIST.some(c=>c.n===CITYV.city.n)"),'a city from the list is picked',inf)
  tg=A.inner_text('#gxcity');ok(inf['city'].upper() in tg.upper(),'the city tag shows name and coordinates',tg)
  A.wait_for_timeout(3000);A.screenshot(path=SP+'/web/test/shots/b6_login.png')
  ok(A.evaluate("getComputedStyle(document.querySelector('.gxmenu')).opacity")=='1','the operator list is on top of the city')
  lgx.login(A,2,60000);A.wait_for_timeout(1600)
  ok(A.evaluate("CITYV===null&&!document.querySelector('canvas.owqcity')"),'the city is disposed after login (no GPU cost inside the portal)')
  ok(A.evaluate("document.querySelector('#main .c')!==null"),'the portal is up')
  A.evaluate("lockView()");A.wait_for_function("typeof GXU!=='undefined'&&GXU.state()==='menu'",timeout=60000)
  ok(A.evaluate("!!CITYV&&document.querySelectorAll('canvas.owqcity').length===1"),'locking brings a city back (exactly one canvas)')
  ok(not errs,'no page errors',errs)
  # phone-sized screen (auto graphics) -> light tier
  A.evaluate("localStorage.setItem('owq_gfx','auto');localStorage.setItem('owq_gq','auto')");A.set_viewport_size({'width':390,'height':844})
  lgx.login(A,2,60000);A.wait_for_timeout(1500);A.evaluate("lockView()");A.wait_for_function("GXU.state()==='menu'",timeout=60000)
  inf=A.evaluate("CITYV&&CITYV.info()");ok(inf and inf['tier']=='low','phones get the light tier',inf)
  A.wait_for_timeout(3000);A.screenshot(path=SP+'/web/test/shots/b6_mobile.png')
  # battery saver -> still frame
  A.set_viewport_size({'width':1280,'height':800});A.evaluate("localStorage.setItem('owq_gq','still')")
  lgx.login(A,2,60000);A.wait_for_timeout(1500);A.evaluate("lockView()");A.wait_for_function("GXU.state()==='menu'",timeout=60000)
  ok(A.evaluate("!!CITYV&&document.querySelectorAll('canvas.owqcity').length===1"),'battery saver still shows the city as a still frame')
  ok(not errs,'no errors on phone or saver',errs)
  b.close()
finally:
 srv.kill()
print('%d/%d passed'%(sum(res),len(res)))
