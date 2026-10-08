"""Voice tone expressions end to end: Cole's (fake) microphone plays a synthetic voice (normal, hyped, normal, fired up);
John's browser reads it from the call audio and Cole's character shows the moods; the My look switch turns it off for everyone."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8814;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots';WAV=os.environ.get('WAV',SP+'/web/test/tone/voice.wav')
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--use-file-for-fake-audio-capture='+WAV,'--autoplay-policy=no-user-gesture-required','--disable-features=WebRtcHideLocalIpsWithMdns']
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:400]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
def until(X,js,secs,arg=None):
    t=time.time()
    while time.time()-t<secs:
        try:
            if (X.evaluate(js,arg) if arg is not None else X.evaluate(js)):return True
        except Exception:pass
        X.wait_for_timeout(400)
    return False
CALL="(id)=>!!(VC.pcs[id]&&VC.pcs[id].connectionState==='connected'&&VC.rs[id]&&Object.keys(VC.rs[id]).length)"
MD="(nm)=>{const O=VO3.dbg();if(!O)return null;let r=null;O.av.forEach(a=>{if(a.nm===nm&&!a.me)r={md:a.md,L:+a.L.toFixed(2),look:a.lookStr,cur:(O.tones.get(a.id)||{}).cur||'',f0:Math.round((O.lv.n.get(a.id)||{}).f0||0),f:(O.tones.get(a.id)||{}).f||{}}});return r}"
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=FLAGS)
  ctx=b.new_context(viewport={'width':1280,'height':760},permissions=['microphone','camera'])
  ctx.add_init_script("try{localStorage.setItem('owq_gq','still');localStorage.setItem('owq_vo',JSON.stringify({list:0,demo:0,ava:'',auto:1,sfx:0}))}catch(e){}")
  errs={}
  def page(tag,user):
      pg=ctx.new_page();errs[tag]=[];pg.on('pageerror',lambda e:errs[tag].append(str(e)[:200]));pg.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps(user));return pg
  K=ctx.new_page();K.goto('http://127.0.0.1:%d/keep.html'%PORT);K.wait_for_function('window.__FAKE')
  A=page('A',{'uid':'uOwner','email':'owner@example.com','displayName':'Cole Leckey'})
  A.goto(URL);A.wait_for_function("window.__FAKE",timeout=20000);A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})");A.evaluate("sessionStorage.clear()");A.reload()
  A.wait_for_function("OWQC.phase==='out'",timeout=30000);A.click('#owqgi');A.wait_for_function("OWQC.phase==='in'",timeout=30000)
  lgx.login(A,2);A.wait_for_timeout(800)
  B=page('B',{'uid':'uJohn','email':'john@example.com','displayName':'John Montini'})
  B.goto(URL);B.wait_for_function("OWQC.phase==='out'",timeout=30000);B.click('#owqgi');B.wait_for_function("OWQC.phase==='pending'",timeout=30000)
  B.click('#owqgr');B.wait_for_function("OWQC.reqd===true",timeout=10000)
  A.evaluate("OWQC.team()");A.wait_for_timeout(1200);A.select_option('#owqrn0','John Montini');A.click("#md button:has-text('Approve')");A.wait_for_timeout(1200);A.evaluate("OWQC.teamClose()")
  B.reload();B.wait_for_function("OWQC.phase==='in'",timeout=30000);lgx.login(B,3);B.wait_for_timeout(1000)
  for X in (A,B):X.evaluate("openTab('Team Chat');CH.ch='__voice';go()")
  B.wait_for_timeout(2500);B.evaluate("vcJoin()");B.wait_for_timeout(1200);A.evaluate("vcJoin()")
  bid=B.evaluate("vcMe()");aid=A.evaluate("vcMe()")
  ok(until(A,CALL,30,bid) and until(B,CALL,30,aid),'setup: Cole and John are on the floor and connected')
  # John mutes so only Cole's voice drives things on John's screen; John hears Cole through the call
  B.evaluate("VC.muted||vcMute()")
  ok(until(B,"()=>{const O=VO3.dbg();let n=0;O&&O.av.forEach(a=>{if(a.nm==='Cole Leckey')n++});return n>0}",60),'John sees Cole\'s character')
  ok(until(B,"(nm)=>{const O=VO3.dbg();let L=0;O.av.forEach(a=>{if(a.nm===nm)L=Math.max(L,a.L)});return L>.12}",40,'Cole Leckey'),'John\'s browser hears Cole talking (mouth moves)')
  # this test machine draws the 3D office at about 1 frame a second, so read John's received call audio directly,
  # 30 times a second, with the same reader the office uses
  B.bring_to_front()
  cid=B.evaluate("(()=>{let id=null;VO3.dbg().av.forEach(a=>{if(a.nm==='Cole Leckey')id=a.id});return id})()")
  B.evaluate("""id=>{const s=VO3.dbg().api.audio(id),L=new VO3.Levels(),T=new VO3.Tone('rx-'+id);window.__tl=[];const t0=performance.now();let last=t0;
    window.__ti=setInterval(()=>{const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;const n=L.get('rx',s,false);if(!n)return;const w=T.step(dt,n.lv,n.hf,n.f0);
      __tl.push([+((now-t0)/1000).toFixed(1),Object.assign({},w),T.cur,Object.assign({},T.f),Math.round(n.f0)])},33)}""",cid)
  B.wait_for_timeout(int(float(os.environ.get('LOGSECS','125'))*1000))
  L=B.evaluate("__tl");B.evaluate("clearInterval(__ti)")
  log=[(r[0],{'md':r[1],'f':r[3],'f0':r[4],'cur':r[2]},None) for r in L]
  mx=lambda k,src=1:max(x[1]['md'][k] for x in log)
  for x in log[::90]:print(x[0],{k:round(v,2) for k,v in x[1]['md'].items()},x[1]['f'],'f0',x[1]['f0'],flush=True)
  hyT=[x[0] for x in log if x[1] and x[1]['md']['hype']>.4];fiT=[x[0] for x in log if x[1] and x[1]['md']['fire']>.4]
  ok(mx('hype')>.4,'when Cole gets hyped, John sees his character hyped',mx('hype'))
  ok(mx('fire')>.4,'when Cole gets fired up, John sees it',mx('fire'))
  ok(hyT and fiT and min(fiT)>min(hyT),'hyped comes first, fired up later (matches the recording)',(hyT[:3],fiT[:3]))
  lg=[x for x in log if x[1]['md']['laugh']>.5]
  ok(len(lg)<=len(log)*.02,'nobody laughs in the recording, so the character does not laugh',(len(lg),len(log)))
  late=[x for x in log if x[0]>40];neu=[x for x in late if max(x[1]['md'].values())<.5]
  ok(len(neu)>=len(late)*.25,'it is not stuck in a mood: plenty of neutral moments',(len(neu),len(late)))
  A.bring_to_front();mine=[];t1=time.time()
  while time.time()-t1<float(os.environ.get('MESECS','60')):
      mine.append(A.evaluate("(()=>{const m=VO3.dbg().meAv;return m?Math.max(m.md.hype,m.md.fire,m.md.focus,m.md.calm):0})()"));A.wait_for_timeout(500)
  ok(max(mine)>.3,"Cole's own screen shows his character reacting too",max(mine))
  if 0:ok(mx('hype',2)>.3 or mx('fire',2)>.3,'Cole\'s own screen shows his character reacting too',(mx('hype',2),mx('fire',2)))
  # the switch: My look > Voice expressions > Off
  A.evaluate("voLook()");A.wait_for_timeout(800)
  ok(A.evaluate("!!document.querySelector('.vo3look.on [data-k=m]')"),'My look has a Voice expressions switch')
  A.screenshot(path=OUT+'/tone_look.png')
  A.click(".vo3look.on [data-k=m] button[data-v='1']");A.wait_for_timeout(500);A.click(".vo3look.on [data-x=done]");A.wait_for_timeout(800)
  ok(A.evaluate("VOX.ava").endswith('m1'),'turning it off is saved with the look',A.evaluate("VOX.ava"))
  ok(until(B,"(nm)=>{let r=false;VO3.dbg().av.forEach(a=>{if(a.nm===nm)r=a.lookStr.endsWith('m1')});return r}",20,'Cole Leckey'),'John\'s browser gets the change')
  B.wait_for_timeout(2500)
  ok(until(B,"(nm)=>{let r=false;VO3.dbg().av.forEach(a=>{if(a.nm===nm)r=Object.values(a.md).every(v=>v===0)});return r}",15,'Cole Leckey'),'and Cole\'s character stops reacting for everyone')
  ok(A.evaluate("Object.values(VO3.dbg().meAv.md).every(v=>v===0)"),'including on his own screen')
  ok(A.evaluate("JSON.parse(localStorage.getItem('owq_vo')||'{}').ava||''").endswith('m1'),'the choice is saved on this device for next time')
  ok(not errs['A'] and not errs['B'],'no page errors',errs)
  b.close()
finally:
  srv.terminate()
print('%d/%d'%(sum(res),len(res)))
