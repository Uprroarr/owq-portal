"""Owner-only nuke emote: frames from detonator to rebuild."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8818;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots'
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1280,'height':760},permissions=['microphone','camera'])
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still');localStorage.setItem('owq_vo',JSON.stringify({list:0,demo:0,ava:'',auto:1,sfx:1}))}catch(e){}")
  errs=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]))
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(800)
  A.evaluate("openTab('Team Chat');CH.ch='__voice';go()");A.wait_for_timeout(3000)
  A.evaluate("vcJoin()");A.wait_for_timeout(2000);A.evaluate("voDemo(1)");A.wait_for_timeout(500);A.evaluate("VO3.dbg().fast=true")
  A.wait_for_function("(()=>{const m=VO3.dbg().meAv;return m&&m.mode==='seated'})()",timeout=150000)
  A.wait_for_function("VO3.targets().filter(x=>x.ok).length>=4",timeout=150000)
  A.evaluate("(()=>{const S=VO3.dbg().dm;S.until=1e9;S.next=1e9;S.share=1e9})()")
  A.evaluate("voPop('emo')");A.wait_for_timeout(600)
  ok=lambda c,m,i='':print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(i)),flush=True)
  ok(A.evaluate("[...document.querySelectorAll('button')].some(b=>/NUKE THE FLOOR/.test(b.textContent))"),'the owner has a NUKE THE FLOOR button')
  A.screenshot(path=OUT+'/nuke_panel.png')
  A.evaluate("(()=>{window.__vt=performance.now();performance.now=()=>window.__vt;VO3.dbg().fast=true})()")
  step="n=>new Promise(r=>{let k=0;const f=()=>{if(k++>=n)return r();window.__vt+=100;requestAnimationFrame(()=>requestAnimationFrame(f))};f()})"
  A.click("button:has-text('NUKE THE FLOOR')")
  shots=[.9,1.35,2.9,4.0,4.6,5.6,6.4,6.85,7.5,8.6,9.6,10.4,11.3,12.4]
  got=0
  for i in range(160):
      A.evaluate(step,1)
      st=A.evaluate("(()=>{const N=VO3.dbg().nk;return N?{t:+N.t.toFixed(2)}:{t:null}})()")
      if st['t'] is None and got>=len(shots)-1:
          A.screenshot(path=OUT+'/nuke_%02d.png'%got);print('after',flush=True);got+=1;break
      if st['t'] is not None and got<len(shots) and st['t']>=shots[got]:
          A.screenshot(path=OUT+'/nuke_%02d.png'%got);print('shot',got,st,A.evaluate("(()=>{const O=VO3.dbg(),N=O.nk;if(!N)return null;const v=new N.bomb.position.constructor();N.bomb.getWorldPosition(v);const w=v.clone();v.project(O.cam);return {bv:N.bomb.visible,bw:w.toArray().map(x=>+x.toFixed(1)),bs:[+v.x.toFixed(2),+v.y.toFixed(2),+v.z.toFixed(3)],cam:O.cam.position.toArray().map(x=>+x.toFixed(1))}})()"),flush=True);got+=1
  info=A.evaluate("(()=>{const O=VO3.dbg();let s=0,n=0;O.av.forEach(a=>{n++;if(a.mode==='seated'&&a.root.rotation.x===0)s++});return {seated:s,n,nk:!!O.nk,glass:O.room.glass.every(g=>g.visible),ov:document.querySelectorAll('.vo3nk').length,grp:O.room.group.position.toArray()}})()")
  print('end',info)
  ok(info['seated']==info['n'] and not info['nk'] and info['glass'] and info['ov']==0,'afterwards everyone is back at their desk, glass back, nothing left over',info)
  print('errs',errs);b.close()
finally:
  srv.terminate()
