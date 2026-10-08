"""Throw across the room, frame by frame (virtual clock): the owner walks to a teammate's desk (in another row, so the route
uses the side corridor), lifts, holds, throws; the teammate flies, lands, lies, gets up, walks back and sits; the owner cheers and
sits back down. Checks every step, saves frames."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8805;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots'
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:300]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1280,'height':760},permissions=['microphone','camera'])
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still');localStorage.setItem('owq_vo',JSON.stringify({list:0,demo:0,ava:'',auto:1,sfx:1}))}catch(e){}")
  errs=[];warn=[]
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=ctx.new_page();A.on('pageerror',lambda e:errs.append(str(e)[:200]));A.on('console',lambda m:warn.append(m.text[:200]) if 'VO3' in m.text else None)
  A.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'}))
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(800)
  A.evaluate("openTab('Team Chat');CH.ch='__voice';go()");A.wait_for_timeout(3000)
  A.evaluate("vcJoin()");A.wait_for_timeout(2000);A.evaluate("voDemo(1)");A.wait_for_timeout(500);A.evaluate("VO3.dbg().fast=true")
  A.wait_for_function("(()=>{const m=VO3.dbg().meAv;return m&&m.mode==='seated'&&VO3.targets().filter(x=>x.ok).length>=4})()",timeout=150000)
  A.click(".vob[aria-label='Emotes']");A.wait_for_timeout(600)
  ok(A.locator(".voem-t:has-text('THROW ACROSS THE ROOM')").count()==1,'the Emotes panel has Throw across the room')
  A.click(".voem-t:has-text('THROW ACROSS THE ROOM')");A.wait_for_timeout(700)
  ok('THROW SOMEONE ACROSS THE ROOM' in A.inner_text('.votp'),'it opens the picker')
  A.screenshot(path=OUT+'/yeet_picker.png')
  # pick a target in a different row than me (the route goes through the side corridor)
  tid=A.evaluate("(()=>{const O=VO3.dbg(),me=O.meAv;let best=null;O.av.forEach(a=>{if(a.me||a.mode!=='seated')return;if(a.seat.row!==me.seat.row&&(!best||Math.abs(a.seat.x)>Math.abs(best.seat.x)))best=a});if(!best)O.av.forEach(a=>{if(!a.me&&a.mode==='seated'&&!best)best=a});return best.id})()")
  idx=A.evaluate("id=>VOX.tl.findIndex(x=>x.id===id)",tid);print('target',tid,idx,A.evaluate("id=>{const O=VO3.dbg();return [O.meAv.seat.row,O.av.get(id).seat.row]}",tid))
  A.evaluate("(()=>{window.__vt=performance.now();performance.now=()=>window.__vt})()")
  step="n=>new Promise(r=>{let k=0;const f=()=>{if(k++>=n)return r();window.__vt+=150;requestAnimationFrame(()=>requestAnimationFrame(f))};f()})"
  A.click('.votg button >> nth=%d'%idx)
  st="id=>{const O=VO3.dbg(),m=O.meAv,b=O.av.get(id);return{a:m.yeetA?m.yeetA.ph:null,am:m.mode,b:b.yeet?b.yeet.ph:null,bm:b.mode,by:+b.root.position.y.toFixed(2),bx:+b.root.position.x.toFixed(2),bz:+b.root.position.z.toFixed(2)}}"
  seen=set();shots=0;t=0.0;last=None
  for i in range(300):
      s0=A.evaluate(st,tid);fast=s0['b'] is None and 'up' in seen
      A.evaluate(step if not fast else step.replace('+=150','+=450'),1);t+=0.45 if fast else 0.15
      s=A.evaluate(st,tid)
      key=(s['a'],s['b'])
      if key!=last:
          last=key;seen.add(s['b']);seen.add('A:'+str(s['a']));shots+=1
          if s['b'] in ('hold','fly','land','lie','up') or s['a'] in ('grab',):A.screenshot(path=OUT+'/yt_%02d_%s_%s.png'%(shots,s['a'],s['b']))
          print(round(t,2),s)
      if s['a'] is None and s['b'] is None and s['am']=='seated' and s['bm']=='seated' and 'land' in seen:break
  ok({'lift','hold','fly','land','lie','up'}<=seen,'the teammate is lifted, held, thrown, lands, lies and gets up',seen)
  ok({'A:go','A:grab','A:cheer','A:back'}<=seen,'you walk over, grab, celebrate and go back',seen)
  fin=A.evaluate(st,tid);ok(fin['am']=='seated' and fin['bm']=='seated','both end up back at their desks',fin)
  ok(not errs,'no page errors',errs);ok(not [w for w in warn if 'frame' in w],'no 3D frame errors',warn)
  b.close()
finally:
  srv.terminate()
print('RESULT',sum(res),'/',len(res))
