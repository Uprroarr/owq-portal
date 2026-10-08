import time,sys
from playwright.sync_api import sync_playwright
F='file:///mnt/user-data/outputs/owq-command-station-v2.html'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required'])
    ctx=b.new_context(viewport={'width':1280,'height':760},permissions=['microphone','camera']);ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('PE '+str(e)[:300]));pg.on('console',lambda m:errs.append(m.type+' '+m.text[:240]) if m.type in('error',) else None)
    pg.goto(F,timeout=180000);pg.wait_for_timeout(3000)
    import lgx;lgx.login(pg,6);pg.wait_for_timeout(3000)
    print('after login',pg.evaluate("[tab,ONLINE,GXU.on(),typeof VO3,voOk()]"))
    pg.evaluate("CH.ch='__voice';openTab('Team Chat')");pg.wait_for_timeout(2500)
    pg.evaluate("VO3.dbg()&&(VO3.dbg().fast=1);const l=document.querySelector('.vo3ld');l&&l.remove()")
    pg.wait_for_timeout(6000)
    print('office',pg.evaluate("[!!document.querySelector('#vofm .vo3 canvas'),(document.querySelector('#vcp')||{}).innerText,JSON.stringify(VO3.info())]"))
    pg.screenshot(path='pv_1.png',timeout=180000)
    # fake live room with two teammates already on the floor
    pg.evaluate("""(()=>{const FR={cbs:[],peers:[{peer:'me1',sameTab:true,isMe:true,presence:{}},{peer:'p2',presence:{vc:1,nm:'Austin Vardzel',vt:1,mu:0,sp:0,ava:'s3h4c0o2k3a5p1'}},{peer:'p3',presence:{vc:1,nm:'Nate Johnson',vt:2,mu:1,hd:1}}]};
      const fire=()=>FR.cbs.forEach(f=>{try{f({peers:FR.peers})}catch(e){}});
      VC.room={peers:()=>FR.peers,presence:async pt=>{const me=FR.peers[0].presence;Object.keys(pt).forEach(k=>{if(pt[k]===null)delete me[k];else me[k]=pt[k]});setTimeout(fire,30)},emit:async()=>{},on(){},onPeers(f){FR.cbs.push(f)}};window.FR=FR;vcPaint()})()""")
    pg.wait_for_timeout(4000)
    print('dock before join',pg.evaluate("(document.querySelector('#vcp')||{}).innerText"))
    pg.screenshot(path='pv_2.png',timeout=180000)
    pg.evaluate("vcJoin()");pg.wait_for_timeout(16000)
    print('joined',pg.evaluate("[VC.on,!!VC.mic,JSON.stringify(FR.peers[0].presence),JSON.stringify(VO3.info())]"))
    pg.screenshot(path='pv_3.png',timeout=180000)
    pg.evaluate("""(()=>{const c=document.createElement('canvas');c.width=1280;c.height=720;const x=c.getContext('2d');let f=0;(function d(){f++;x.fillStyle='#0f1420';x.fillRect(0,0,1280,720);x.fillStyle='#ff1f4f';x.fillRect(40,40,520,80);x.fillStyle='#fff';x.font='bold 46px Verdana';x.fillText('MY SCREEN SHARE',60,96);for(let i=0;i<9;i++){const h=100+((i*83+f*4)%320);x.fillStyle=i%2?'#ffd166':'#3ddc97';x.fillRect(70+i*125,650-h,80,h)}setTimeout(d,80)})();
      const s=c.captureStream(15);VC.scr=s;vcLocalVid('local-scr',s);VC.room.presence({scr:1,ss:s.id});vcPaint()})()""")
    pg.wait_for_timeout(12000)
    pg.screenshot(path='pv_4.png',timeout=180000)
    pg.evaluate("voPop('emo')");pg.wait_for_timeout(2500)
    pg.screenshot(path='pv_5.png',timeout=180000)
    print('final',pg.evaluate("[JSON.stringify(VO3.info()),GXU.on()]"))
    print('\n'.join(errs[:14]))
    b.close()
