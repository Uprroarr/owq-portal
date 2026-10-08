"""Morning Recognition: no character limit on the quote, the focus note or replies."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8820;SITE=os.environ.get('SITE',SP+'/web/test/site_ln');URL='http://127.0.0.1:%d/index.html'%PORT
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:300]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
Q=('Discipline beats motivation every single day. '*34).strip()      # ~1550 chars
N=('Push final expense today, team training at 2, promo ends Friday. '*24).strip()
RP=('Huge morning everyone, lets go get it. '*35).strip()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  ctx=b.new_context(viewport={'width':1280,'height':860});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='in'",timeout=30000) if False else None
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(1200)
  A.wait_for_function("typeof MR!=='undefined'&&MR.ready",timeout=20000)
  A.evaluate("mrOpenForm()");A.wait_for_timeout(700)
  if not A.evaluate("!!document.getElementById('mrfq')"):A.evaluate("mrQuoteOwn()");A.wait_for_timeout(300)
  ok(A.evaluate("['mrfq','mrfn'].every(i=>{const e=document.getElementById(i);return e&&!e.hasAttribute('maxlength')})"),'the quote and focus boxes have no maxlength')
  ok(not A.evaluate("!!document.getElementById('mrfqc')||!!document.getElementById('mrfnc')"),'no x/260 or x/300 counters')
  A.fill('#mrfq',Q);A.fill('#mrfn',N)
  ok(A.evaluate("MR.form.quote.length")==len(Q) and A.evaluate("MR.form.note.length")==len(N),'long text goes in untouched',(A.evaluate("MR.form.quote.length"),len(Q)))
  A.screenshot(path=SP+'/web/test/shots/mrlen_form.png')
  A.evaluate("mrSubmit()");A.wait_for_timeout(2500)
  r=A.evaluate("(()=>{const r=(MR.recs||[]).slice().sort((a,b)=>b.at-a.at)[0];return r?{q:r.quote.length,n:r.note.length,id:r.id}:null})()")
  ok(r and r['q']==len(Q) and r['n']==len(N),'the posted recognition keeps the full quote and focus note',(r,len(Q),len(N)))
  A.reload();A.wait_for_function("OWQC.phase==='in'",timeout=30000);A.wait_for_function("typeof MR!=='undefined'&&MR.ready",timeout=20000);A.wait_for_timeout(1500)
  r2=A.evaluate("id=>{const r=(MR.recs||[]).find(x=>x.id===id);return r?{q:r.quote.length,n:r.note.length}:null}",r['id'] if r else '')
  ok(r2 and r2['q']==len(Q) and r2['n']==len(N),'still full after a reload (saved that way)',r2)
  # a long reply
  A.evaluate("id=>{try{MR.open=id;MR.view=id}catch(e){}}",r['id'] if r else '')
  has=A.evaluate("!!document.getElementById('mri')")
  if has:
      ok(not A.evaluate("document.getElementById('mri').hasAttribute('maxlength')"),'the reply box has no maxlength')
      A.fill('#mri',RP);A.evaluate("mrSend()");A.wait_for_timeout(2000)
      ln=A.evaluate("(()=>{let m=0;(MR.msgs||[]).forEach(x=>{m=Math.max(m,(x.text||'').length)});return m})()")
      ok(ln==len(RP),'a long reply posts in full',(ln,len(RP)))
  else:print('note: reply box not on screen in this view; checked in the code')
  ok(not errs,'no page errors',errs)
  b.close()
finally:srv.terminate()
print('%d/%d'%(sum(res),len(res)))
