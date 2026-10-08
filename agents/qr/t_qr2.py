import sys
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
F=sys.argv[1]
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
  ctx=b.new_context(viewport={'width':390,'height':844});pg=ctx.new_page()
  pg.add_init_script("localStorage.setItem('owq_gq','still')")
  pg.goto('file://'+F);pg.wait_for_timeout(2500);lgx.login(pg,6);pg.wait_for_timeout(2500)
  pg.evaluate("()=>{const k=mrToday();D.mrRecs=[{id:'rq1',day:k,by:'Cole Leckey',des:'',cov:0,goals:[],quote:'Win the day.',note:'',att:null,at:Date.now(),late:0,ed:0,rx:{}}];save();mrRefresh()}")
  pg.evaluate("()=>{toggleRail(true);qvTab('chat');qvCh('__mr')}");pg.wait_for_timeout(500)
  print('before',pg.evaluate("[QV.ch,QV.tab,RAIL,!!document.getElementById('qvCL'),document.querySelectorAll('.qr-card').length,localStorage.getItem('owq_qv')]"))
  pg.reload();pg.wait_for_timeout(2500);lgx.login(pg,6);pg.wait_for_timeout(2500)
  print('after login',pg.evaluate("[QV.ch,QV.tab,RAIL,!!document.getElementById('qvCL'),document.querySelectorAll('.qr-card').length]"))
  pg.evaluate("()=>{toggleRail(true);qvTab('chat')}");pg.wait_for_timeout(800)
  print('after open',pg.evaluate("[QV.ch,QV.tab,RAIL,!!document.getElementById('qvCL'),document.querySelectorAll('.qr-card').length,QV.mounted]"))
  b.close()
