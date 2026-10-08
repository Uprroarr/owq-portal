"""Shake a screw loose (owner only), frame by frame (virtual clock): the owner's Emotes panel has the button and the picker; the
owner walks to Austin's desk, lifts him, shakes him (rattle), a screw pops out, arcs over the desk and bounces on the floor with
metal clinks, Austin is put back in his chair (dizzy), the owner walks back. A teammate gets no button and cannot start it."""
import sys,os,time,json,subprocess
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';sys.path.insert(0,SP)
import lgx
from playwright.sync_api import sync_playwright
PORT=8811;SITE=os.environ.get('SITE',SP+'/web/test/site');OUT=SP+'/web/test/shots'
URL='http://127.0.0.1:%d/index.html'%PORT
FLAGS=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']
res=[]
def ok(c,m,info=''):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+m+('' if c else '  '+str(info)[:400]),flush=True)
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
  A.evaluate("(()=>{const O=VO3.dbg(),f=O.sfx.bind(O);window.__sfx=[];O.sfx=(k,v)=>{__sfx.push([k,+(v==null?1:v).toFixed(2)]);return f(k,v)}})()")
  A.click(".vob[aria-label='Emotes']");A.wait_for_timeout(600)
  ok(A.locator(".voem-t:has-text('SHAKE A SCREW LOOSE')").count()==1,'the owner has a Shake a screw loose button')
  A.click(".voem-t:has-text('SHAKE A SCREW LOOSE')");A.wait_for_timeout(700)
  ok('SHAKE A SCREW LOOSE' in A.inner_text('.votp'),'it opens the teammate picker')
  A.screenshot(path=OUT+'/shake_picker.png')
  tid=A.evaluate("(()=>{const O=VO3.dbg();let id=null;O.av.forEach(a=>{if(!a.me&&/Austin/.test(a.nm)&&a.mode==='seated')id=a.id});if(!id)O.av.forEach(a=>{if(!a.me&&a.mode==='seated'&&!id)id=a.id});return id})()")
  idx=A.evaluate("id=>VOX.tl.findIndex(x=>x.id===id)",tid);sb=A.evaluate("id=>{const s=VO3.dbg().av.get(id).seat;return {row:s.row,x:s.x,z:s.z,sz:s.sz}}",tid);print('target',tid,idx,sb,'me',A.evaluate("VO3.dbg().meAv.seat.row"))
  A.evaluate("(()=>{window.__vt=performance.now();performance.now=()=>window.__vt})()")
  step="n=>new Promise(r=>{let k=0;const f=()=>{if(k++>=n)return r();window.__vt+=STEP;requestAnimationFrame(()=>requestAnimationFrame(f))};f()})"
  A.click('.votg button >> nth=%d'%idx)
  st="""id=>{const O=VO3.dbg(),m=O.meAv,b=O.av.get(id),Y=m.shakeA,L=O.screws||[],s=L[L.length-1];return{a:Y?Y.ph:null,am:m.mode,bm:b.mode,bsh:!!b.shakeB,by:+b.root.position.y.toFixed(2),
   bp:[+b.root.position.x.toFixed(2),+b.root.position.z.toFixed(2)],sc:s?{p:[+s.g.position.x.toFixed(2),+s.g.position.y.toFixed(2),+s.g.position.z.toFixed(2)],nb:s.nb,rest:s.rest}:null,cam:+O.cam.position.y.toFixed(2),be:b.emo?b.emo.k:null}}"""
  seen=[];last=None;t=0.0;maxy=0;land=None;shot=set();dz=None
  for i in range(300):
      s0=A.evaluate(st,tid);fine=s0['a'] in('shake','hold') or (s0['sc'] and not s0['sc']['rest'])
      A.evaluate(step.replace('STEP','60' if fine else '200'),1);t+=.06 if fine else .2
      s=A.evaluate(st,tid)
      if s['a']!=last:last=s['a'];seen.append(s['a']);print(round(t,2),json.dumps(s),flush=True)
      if s['a'] in('grab','shake','hold','put'):maxy=max(maxy,s['by'])
      if s['a']=='shake' and 'sh' not in shot:shot.add('sh');A.screenshot(path=OUT+'/shake_shaking.png')
      if s['sc'] and s['sc']['nb']>=1 and 'land' not in shot:shot.add('land');A.screenshot(path=OUT+'/shake_screw_lands.png')
      if s['sc'] and s['sc']['rest'] and land is None:land=s['sc'];A.screenshot(path=OUT+'/shake_screw_rest.png')
      if s['a']=='back' and s['be']=='dizzy' and 'dz' not in shot:shot.add('dz');dz=s;A.screenshot(path=OUT+'/shake_dizzy.png')
      if s['a'] is None and s['am']=='seated' and 'back' in seen:break
  print('seen',seen)
  ok(seen[:6]==['go','grab','shake','hold','put','back'] and seen[-1] is None,'walk over, grab, shake, hold, put back, walk back',seen)
  ok(maxy>1.4,'the teammate is lifted up off the chair (root up to %.2f)'%maxy)
  sf=A.evaluate("__sfx");cl=[x for x in sf if x[0]=='clink'];ra=[x for x in sf if x[0]=='rattle']
  ok(len(ra)>=8,'a rattle while shaking (%d)'%len(ra))
  ok(land is not None and abs(land['p'][1]-.08)<.02,'the screw comes to rest on the floor',land)
  ok(land is not None and land['p'][2]>sb['z']+.45,'it lands in front of the desk, where everyone can see it (z %.2f, desk front %.2f)'%(land['p'][2] if land else -9,sb['z']+.41))
  ok(2<=len(cl)<=4 and cl[0][1]>=cl[-1][1],'metal clinks on each bounce, getting softer %s'%cl)
  fin=A.evaluate(st,tid)
  ok(fin['bm']=='seated' and not fin['bsh'] and abs(fin['bp'][0]-sb['x'])<.05 and abs(fin['bp'][1]-sb['sz'])<.05,'the teammate is back in their chair',fin)
  ok(dz is not None,'and dizzy after being put down')
  ok(fin['am']=='seated','the owner is back at their desk',fin)
  # a teammate (not the owner) gets no button and cannot start it
  B=ctx.new_page();B.on('pageerror',lambda e:errs.append('B:'+str(e)[:200]))
  B.add_init_script("window.__FAKE_SIGNIN=%s;"%json.dumps({'uid':'uJohn','email':'john@example.com','displayName':'John Montini'}))
  B.goto(URL);B.wait_for_function("OWQC.phase==='out'",timeout=30000);B.click('#owqgi');B.wait_for_function("OWQC.phase==='pending'",timeout=30000)
  B.click('#owqgr');B.wait_for_function("OWQC.reqd===true",timeout=10000)
  A.evaluate("OWQC.team()");A.wait_for_timeout(1500);A.select_option('#owqrn0','John Montini');A.click("#md button:has-text('Approve')");A.wait_for_timeout(1200);A.evaluate("OWQC.teamClose()")
  B.reload();B.wait_for_function("OWQC.phase==='in'",timeout=30000);lgx.login(B,3);B.wait_for_timeout(800)
  r=B.evaluate("({own:voOwnerNow(),btn:voEmoPanel().indexOf('SHAKE A SCREW LOOSE')>=0,thanks:voEmoPanel().indexOf('THANK YOU TREND')>=0,pick:voShakePanel()})")
  ok(not r['own'] and not r['btn'] and r['pick']=='' and r['thanks'],'a teammate has the Thank you trend but no Shake a screw loose button or picker',r)
  ok(not errs,'no page errors',errs);ok(not [w for w in warn if 'frame' in w],'no 3D frame errors',warn)
  b.close()
finally:
  srv.terminate()
print('RESULT',sum(res),'/',len(res))
