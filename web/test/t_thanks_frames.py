"""Thank-you trend emote, frame by frame (virtual clock): the Emotes panel button; you walk out to the gold inlay in front of
the desks (through the gaps between desks), turn to the camera, drop into a wide plank and do 8 hip dips with a THANK YOU on
each; hands and toes stay on the floor; the camera cuts to a low front shot; then back to the desk. Bots in every row too."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8809;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots'
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:400]),flush=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
# world positions of both hands and both shoes, the hip, and the camera
GEO="""id=>{const O=VO3.dbg(),a=id?O.av.get(id):O.meAv;const P=(o,x,y,z)=>{o.updateWorldMatrix(true,false);const e=o.matrixWorld.elements;return [e[0]*x+e[4]*y+e[8]*z+e[12],e[1]*x+e[5]*y+e[9]*z+e[13],e[2]*x+e[6]*y+e[10]*z+e[14]].map(v=>+v.toFixed(3))};
 const H=a.thanks;return {ph:H?H.ph:null,n:H?H.n:0,mode:a.mode,pk:+(a.pk||0).toFixed(2),dip:+(a.dip||0).toFixed(2),root:[+a.root.position.x.toFixed(2),+a.root.position.z.toFixed(2)],ry:+a.root.rotation.y.toFixed(2),
  hands:[P(a.el[0],0,-.168,0),P(a.el[1],0,-.168,0)],toes:[P(a.kn[0],0,-.268,.045),P(a.kn[1],0,-.268,.045)],hip:P(a.hip,0,0,0),head:P(a.head,0,0,0),cam:[+O.cam.position.x.toFixed(2),+O.cam.position.y.toFixed(2),+O.cam.position.z.toFixed(2)]}}"""
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
  A.evaluate("window.__pops=[];new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.classList&&n.classList.contains('vo3pop'))__pops.push([n.className,n.textContent])}))).observe(document.body,{childList:true,subtree:true})")
  A.click(".vob[aria-label='Emotes']");A.wait_for_timeout(600)
  ok(A.locator(".voem-t:has-text('THANK YOU TREND')").count()==1,'the Emotes panel has a Thank you trend button')
  A.screenshot(path=OUT+'/thanks_panel.png')
  print('my seat',A.evaluate("(()=>{const s=VO3.dbg().meAv.seat;return [s.row,s.x,s.sz]})()"))
  A.evaluate("(()=>{window.__vt=performance.now();performance.now=()=>window.__vt})()")
  step="n=>new Promise(r=>{let k=0;const f=()=>{if(k++>=n)return r();window.__vt+=STEP;requestAnimationFrame(()=>requestAnimationFrame(f))};f()})"
  A.click(".voem-t:has-text('THANK YOU TREND')")
  seen=[];t=0.0;last=None;geo={};shot=0;cams=[]
  for i in range(260):
      g=A.evaluate(GEO,None);fine=g['ph'] in ('down','reps','up')
      A.evaluate(step.replace('STEP','70' if fine else '250'),1);t+=.07 if fine else .25
      g=A.evaluate(GEO,None)
      if g['ph']!=last:last=g['ph'];seen.append(g['ph']);print(round(t,2),json.dumps(g),flush=True)
      if g['ph']=='reps':
          cams.append(g['cam'][1])
          if g['dip']<=.02 and 'top' not in geo:geo['top']=g;A.screenshot(path=OUT+'/thanks_top.png')
          if g['dip']>=.97 and 'bot' not in geo:geo['bot']=g;A.screenshot(path=OUT+'/thanks_bottom.png')
          if g['n']==4 and 'mid' not in geo:geo['mid']=g;A.screenshot(path=OUT+'/thanks_rep4.png')
      if g['ph']=='down' and g['pk']>.4 and 'down' not in geo:geo['down']=g;A.screenshot(path=OUT+'/thanks_down.png')
      if g['ph']=='go' and t>1.0 and 'go' not in geo:geo['go']=g;A.screenshot(path=OUT+'/thanks_walk.png')
      if g['ph'] is None and g['mode']=='seated' and 'back' in seen:break
  print('seen',seen)
  ok(seen[:5]==['go','down','reps','up','back'] and seen[-1] is None,'walk out, get down, reps, get up, walk back, sit',seen)
  for k in ('top','bot'):
      g=geo.get(k)
      if not g:ok(False,'%s of a rep captured'%k);continue
      hy=[h[1] for h in g['hands']];ty=[x[1] for x in g['toes']]
      ok(all(0<=y<=.12 for y in hy),'%s of the rep: both hands on the floor (%s)'%(k,hy))
      ok(all(0<=y<=.16 for y in ty),'%s of the rep: both feet on the floor (%s)'%(k,ty))
  if geo.get('top') and geo.get('bot'):
      T,B=geo['top'],geo['bot']
      ok(T['hip'][1]-B['hip'][1]>.08,'the hips drop on every rep (%.2f -> %.2f)'%(T['hip'][1],B['hip'][1]))
      dh=max(abs(T['hands'][i][j]-B['hands'][i][j]) for i in range(2) for j in (0,2));ok(dh<.06,'the hands stay planted through the rep (moved %.3f)'%dh)
      ok(T['head'][2]>T['hip'][2]+.4 and abs(T['ry'])<.05,'facing the camera, head toward it (head z %.2f, hip z %.2f)'%(T['head'][2],T['hip'][2]))
      ok(abs(T['root'][1]-3.35)<.05 and T['root'][1]>2.9,'on the gold inlay in front of the desks %s'%T['root'])
  pops=A.evaluate("__pops");ty=[x for x in pops if 'THANK YOU' in x[1]]
  ok(len([x for x in ty if x[1]=='THANK YOU'])==8 and any('8 THANK YOUS' in x[1] for x in ty),'8 THANK YOU pops and a final count (%d)'%len(ty),pops[-12:])
  ok(cams and min(cams)<1.9,'the camera cuts to a low front shot during the reps (min height %.2f)'%(min(cams) if cams else -1))
  fin=A.evaluate(GEO,None);ok(fin['mode']=='seated' and fin['pk']==0,'back at the desk, seated',fin)
  # bots from every row
  ids=A.evaluate("(()=>{const O=VO3.dbg(),pick={};O.av.forEach(a=>{if(!a.me&&a.mode==='seated'&&a.seat&&!pick[a.seat.row])pick[a.seat.row]=a.id});return Object.values(pick)})()")
  print('bots',ids,A.evaluate("ids=>ids.map(id=>VO3.dbg().av.get(id).seat.row)",ids))
  for bid in ids:
      A.evaluate("id=>{const O=VO3.dbg();O.playEmote(O.av.get(id),'thanks')}",bid)
      reps=False;done=False
      for i in range(90):
          A.evaluate(step.replace('STEP','330'),1);g=A.evaluate(GEO,bid)
          if g['ph']=='reps':reps=True
          if reps and g['ph'] is None and g['mode']=='seated':done=True;break
      row=A.evaluate("id=>VO3.dbg().av.get(id).seat.row",bid)
      ok(reps and done,'a teammate in row %s goes out, does it and sits back down'%row,g)
  ok(not errs,'no page errors',errs);ok(not [w for w in warn if 'frame' in w],'no 3D frame errors',warn)
  b.close()
finally:
  srv.terminate()
print('RESULT',sum(res),'/',len(res))
