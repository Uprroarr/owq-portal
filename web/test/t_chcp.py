"""Chat channels: paste a screenshot to attach it; copy a message's text."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8830;SITE=os.environ.get('SITE',SP+'/web/test/site_ln');URL='http://127.0.0.1:%d/index.html'%PORT
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:400]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
PASTE="""(where)=>{const c=document.createElement('canvas');c.width=40;c.height=30;const x=c.getContext('2d');x.fillStyle='#ff1f4f';x.fillRect(0,0,40,30);
 return new Promise(r=>c.toBlob(b=>{const dt=new DataTransfer();dt.items.add(new File([b],'image.png',{type:'image/png'}));const el=document.getElementById(where);
 const ev=new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true});el.dispatchEvent(ev);r(ev.defaultPrevented)},'image/png'))}"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  ctx=b.new_context(viewport={'width':1280,'height':900},permissions=['clipboard-read','clipboard-write']);ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(1200)
  A.evaluate("openTab('Team Chat');CH.ch='General';go()");A.wait_for_timeout(1500)
  A.fill('#chi','Copy this line: call list at 2pm');A.press('#chi','Enter');A.wait_for_timeout(1500)
  n=A.locator('.tcm .rxcp').count();ok(n>=1,'messages have a copy button',n)
  A.locator('.tcm.mine .rxcp').last.click(force=True);A.wait_for_timeout(500)
  clip=A.evaluate("navigator.clipboard.readText()")
  ok(clip=='Copy this line: call list at 2pm','copy puts the message text on the clipboard',clip)
  ok('Copied' in A.inner_text('body'),'and says Copied')
  prevented=A.evaluate(PASTE,'chi');A.wait_for_timeout(1200)
  att=A.evaluate("CH.att?{name:CH.att.name}:null")
  ok(prevented and att and att['name'].startswith('pasted-'),'pasting a screenshot attaches it to the message',att)
  A.screenshot(path=SP+'/web/test/shots/chcp.png')
  A.press('#chi','Enter');A.wait_for_timeout(2500)
  last=A.evaluate("(()=>{const L=chIn('General');const m=L[L.length-1];return m?{att:!!m.att,who:m.who}:null})()")
  ok(last and last['att'],'and sending posts it',last)
  # copy the picture back out
  A.locator('.tcm.mine').last.hover();A.wait_for_timeout(300);A.locator('.tcm.mine .rxcp').last.click(force=True);A.wait_for_timeout(2500)
  types=A.evaluate("navigator.clipboard.read().then(L=>L.flatMap(i=>i.types)).catch(e=>'err '+e)")
  ok(isinstance(types,list) and 'image/png' in types,'copying a picture message puts the picture on the clipboard',types)
  A.locator('.tcm.mine .chai').last.click();A.wait_for_timeout(1500)
  ok(A.locator("#md button:has-text('Copy picture')").count()==1,'the picture viewer has a Copy picture button')
  A.evaluate("closeM()")
  # plain text paste still works normally (not intercepted)
  pv=A.evaluate("(()=>{const dt=new DataTransfer();dt.setData('text/plain','hi');const ev=new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true});document.getElementById('chi').dispatchEvent(ev);return ev.defaultPrevented})()")
  ok(pv is False,'pasting text is left alone (normal paste)')
  ok(not errs,'no page errors',errs)
  b.close()
finally:srv.terminate()
print('%d/%d'%(sum(res),len(res)))
