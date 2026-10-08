import sys,json
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
F=sys.argv[1];res=[]
def ok(c,m):res.append(bool(c));print('PASS' if c else 'FAIL',m)
FAKE="""(()=>{const me={peer:'p1',sameTab:true,isMe:true,presence:{}};const L=[];const pf=[];
const room={peers:()=>[me],presence:async p=>{Object.keys(p).forEach(k=>{if(p[k]===null)delete me.presence[k];else me.presence[k]=p[k]});pf.forEach(f=>{try{f({peers:[me]})}catch(e){}})},on:()=>()=>{},onPeers:f=>{pf.push(f);return()=>{}},emit:async()=>{},join:()=>room};
window.__diag=[];const db={collection:n=>({add:async o=>{if(n==='diag')window.__diag.push(o);return{id:'x'}},doc:()=>({get:async()=>({exists:false,data:()=>null}),set:async()=>{},update:async()=>{},onSnapshot:()=>()=>{}}),where:function(){return this},orderBy:function(){return this},limit:function(){return this},onSnapshot:()=>()=>{},get:async()=>({docs:[]})}),doc:()=>({get:async()=>({exists:false,data:()=>null}),set:async()=>{},update:async()=>{},onSnapshot:()=>()=>{}})};
window.claude={use:async n=>n==='room'?room:n==='db'?db:null}})()"""
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server','--use-fake-device-for-media-stream','--deny-permission-prompts'])
  ctx=b.new_context(viewport={'width':1366,'height':860});pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
  pg.add_init_script("localStorage.setItem('owq_gq','still')");pg.add_init_script(FAKE)
  pg.goto('file://'+F);pg.wait_for_timeout(2500);lgx.login(pg,6);pg.wait_for_timeout(3000)
  ok(pg.evaluate("!!VC.room"),'fake room connected')
  pg.evaluate("()=>{CH.ch='__voice';openTab('Team Chat')}");pg.wait_for_timeout(600)
  pg.evaluate("vcJoin()");pg.wait_for_timeout(1500)
  st=pg.evaluate("({on:VC.on,mic:!!VC.mic,err:VC.err})");print(st)
  ok(st['on'] and not st['mic'],'joined listen-only when mic is refused')
  ok('Allow' in st['err'] or 'microphone' in st['err'].lower(),'clear explanation shown')
  ok(pg.locator('.vx-mic').count()>=1,'Turn on mic button shown')
  ok(any(d.get('ev')=='join-listen-only' for d in pg.evaluate("__diag")),'diagnostic recorded')
  print(json.dumps(pg.evaluate("__diag")[-1])[:400])
  pg.screenshot(path=SP+'/agents/qr/shots/vx_denied.png')
  ctx.grant_permissions(['microphone'])
  pg.click('.vx-mic');pg.wait_for_timeout(1500)
  st=pg.evaluate("({mic:!!VC.mic,err:VC.err,lo:VC.room.peers()[0].presence.lo})");print(st)
  ok(st['mic'] and not st['lo'],'mic turned on after allowing, presence updated')
  ok(pg.locator('.vx-mic').count()==0,'button gone after mic on')
  pg.evaluate("vcMute()");ok(pg.evaluate("VC.muted===1"),'mute works');pg.evaluate("vcMute()")
  pg.evaluate("vcLeave()");pg.wait_for_timeout(300);ok(pg.evaluate("!VC.on"),'leave works')
  ok(pg.evaluate("typeof navigator.mediaDevices.getUserMedia==='function'&&!Object.prototype.hasOwnProperty.call(navigator.mediaDevices,'getUserMedia')"),'getUserMedia restored')
  ok(not errs,'no page errors '+str(errs[:2]))
  b.close()
print('RESULT',sum(res),'/',len(res))
