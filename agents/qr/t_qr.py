import sys,time
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
F=sys.argv[1];OUT=SP+'/agents/qr/shots'
res=[]
def ok(c,m):res.append((bool(c),m));print('PASS' if c else 'FAIL',m)
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  for vw,vh,tag in [(1440,900,'desk'),(390,844,'phone')]:
    ctx=b.new_context(viewport={'width':vw,'height':vh});pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    pg.add_init_script("localStorage.setItem('owq_gq','still')")
    pg.goto('file://'+F);pg.wait_for_timeout(2500);lgx.login(pg,6);pg.wait_for_timeout(2500)
    pg.evaluate("""()=>{const k=mrToday();D.mrRecs=[{id:'rq1',day:k,by:'Cole Leckey',des:'',cov:0,goals:[{m:Object.keys(MRMK)[0],t:20}],quote:'Discipline is doing it when nobody is watching.',note:'Book 3 appointments before noon.',att:null,at:Date.now()-3600e3,late:0,ed:0,rx:{}}];
      D.mrMsgs=[{id:'m901',rid:'rq1',who:'Nate Johnson',text:'Locked in. 40 dials before lunch @cole',at:Date.now()-1800e3,att:null,stk:'',rx:{}},{id:'m902',rid:'rq1',who:'Austin Vardzel',text:'Let us go team',at:Date.now()-900e3,att:null,stk:'',rx:{}}];save();mrRefresh()}""")
    pg.evaluate("()=>{toggleRail(true);qvTab('chat')}");pg.wait_for_timeout(500)
    ok(pg.locator('.qr-chb').count()>=1,tag+' recognition chip shown')
    pg.evaluate("()=>qvCh('__mr')");pg.wait_for_timeout(500)
    ok(pg.locator('#qvCL .qr-card').count()==1,tag+' recognition card in quick view')
    ok('Locked in' in pg.inner_text('#qvCL'),tag+' thread shown')
    pg.screenshot(path=OUT+'/qr_'+tag+'.png')
    n0=pg.evaluate("D.mrMsgs.length")
    pg.fill('#qvCI','Great energy everyone');pg.press('#qvCI','Enter');pg.wait_for_timeout(600)
    ok(pg.evaluate("D.mrMsgs.length")==n0+1,tag+' reply posted to recognition thread')
    ok('Great energy everyone' in pg.inner_text('#qvCL'),tag+' reply visible')
    pg.evaluate("()=>qvCh(CHN[0][0])");pg.wait_for_timeout(300)
    ok(pg.locator('#qvCL .qr-card').count()==0,tag+' back to team channel')
    pg.evaluate("()=>qvCh('__mr')");pg.reload();pg.wait_for_timeout(2500);lgx.login(pg,6);pg.wait_for_timeout(2500);pg.evaluate("()=>{toggleRail(true);qvTab('chat')}");pg.wait_for_timeout(500)
    ok(pg.locator('#qvCL .qr-card').count()==1,tag+' selection persists after reload')
    ok(not errs,tag+' no page errors '+str(errs[:2]))
    ctx.close()
  b.close()
print('RESULT',sum(1 for r in res if r[0]),'/',len(res))
