"""FLOOR quick view, end to end with real WebRTC between browser contexts over ONE fake room hub.
A joins from the rail, B joins from the Sales Floor page (and shares a screen), C only watches the rail (then hits a camera error).
Checks tiles, single audio per remote peer, screen share as the large tile, video keeps playing across navigation,
leaving removes tiles, the device error text equals vcErr(), no extra room listeners. Float window: drag, resize,
persistence after reload, hidden on the Sales Floor page unless pinned."""
import sys,os,json,time
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import qvt
from playwright.sync_api import sync_playwright
url='file://'+qvt.BUILD
R=[];errs=[]
def ok(name,cond,info=''):
    R.append((name,bool(cond)));print(('PASS ' if cond else 'FAIL ')+name+(' | '+str(info)[:300] if info else ''),flush=True)
VSTAT="""sel=>Array.from(document.querySelectorAll(sel)).map(v=>({rs:v.readyState,w:v.videoWidth,p:v.paused,t:v.currentTime,m:v.muted}))"""
AUD="""()=>Array.from(document.querySelectorAll('video,audio')).filter(e=>e.srcObject&&e.srcObject.getAudioTracks&&e.srcObject.getAudioTracks().length&&!e.muted).length"""
room=qvt.FakeRoom().start()
with sync_playwright() as p:
    b=qvt.launch(p)
    def mk(cid,idx,extra=None):
        ctx=qvt.context(b,1366,860,init=[qvt.room_js(room.port,cid)]+(extra or []));pg=qvt.page(ctx,errs,cid+': ')
        qvt.open_login(pg,url,idx);return ctx,pg
    ca,A=mk('A',0);cb,Bp=mk('B',1);cc,C=mk('C',6)
    # A: rail FLOOR tab, join from the rail, camera on from the rail
    A.evaluate("qvTab('floor')");A.wait_for_timeout(500)
    ok('A floor tab shows join button',A.evaluate("!!document.querySelector('#qvRP .qv-join')"))
    A.click('#qvRP .qv-join');A.wait_for_timeout(1500)
    ok('A joined via vcJoin from the rail',A.evaluate("VC.on===1&&!!VC.mic"))
    A.click("#qvRP .qv-ctl[aria-label='Turn camera on']");A.wait_for_timeout(1500)
    ok('A camera on from the rail',A.evaluate("!!VC.cam"))
    # B: Sales Floor page, join with the page's own button, camera on
    Bp.evaluate("CH.ch='__voice';openTab('Team Chat')");Bp.wait_for_timeout(800)
    Bp.evaluate("vcJoin()");Bp.wait_for_timeout(1500);Bp.evaluate("vcCam()");Bp.wait_for_timeout(5000)
    ok('B joined from the page',Bp.evaluate("VC.on===1&&!!VC.cam"))
    # tiles in A's rail: own camera + B's camera
    A.wait_for_timeout(2500)
    st=A.evaluate(VSTAT,'#qvRP .qv-fg video')
    ok('A rail shows 2 camera tiles playing',len(st)==2 and all(x['w']>0 and x['rs']>=2 for x in st),st)
    ok('A rail is wider while tiles show',A.evaluate("document.getElementById('rail').classList.contains('qv-wide')&&document.getElementById('rail').getBoundingClientRect().width>360"),A.evaluate("document.getElementById('rail').getBoundingClientRect().width"))
    ok('display copies are muted',all(x['m'] for x in st))
    ok('A: exactly one audible element per remote peer',A.evaluate(AUD)==1,A.evaluate(AUD))
    ok('B: exactly one audible element per remote peer',Bp.evaluate(AUD)==1,Bp.evaluate(AUD))
    # C watches only: roster lists both, no media, join button
    C.evaluate("qvTab('floor')");C.wait_for_timeout(1200)
    ros=C.evaluate("Array.from(document.querySelectorAll('#qvRP .qv-p b')).map(e=>e.textContent)")
    ok('C rail roster lists A and B',len(ros)==2 and any('Austin' in r for r in ros) and any('Nate' in r for r in ros),ros)
    ok('C sees the cam icons and a join button',C.evaluate("document.querySelectorAll('#qvRP .qv-pi.on').length>=2&&!!document.querySelector('#qvRP .qv-join')"))
    ok('FLOOR tab badge counts 2 with a huddle dot',C.evaluate("(()=>{const t=document.getElementById('qvT_floor');return t.querySelector('.qv-n').textContent==='2'&&!!t.querySelector('.qv-dot')})()"))
    # B shares a screen: A's rail shows it as the large tile
    sid=Bp.evaluate(qvt.FAKE_SCREEN_JS);A.wait_for_timeout(6000)
    sc=A.evaluate(VSTAT,'#qvRP .qv-st video')
    ok('A rail shows the shared screen as the large tile',len(sc)==1 and sc[0]['w']>=640 and sc[0]['rs']>=2,sc)
    ok('stage tile is the widest tile',A.evaluate("(()=>{const s=document.querySelector('#qvRP .qv-st');const t=document.querySelector('#qvRP .qv-t');return s&&t&&s.getBoundingClientRect().width>t.getBoundingClientRect().width*1.5})()"))
    ok('FLOOR tab dot turns red for a screen share',C.evaluate("!!document.querySelector('#qvT_floor .qv-dot.scr')"))
    # lightbox
    A.click('#qvRP .qv-st');A.wait_for_timeout(1200)
    lb=A.evaluate(VSTAT,'#md .qv-lb video')
    ok('click on the screen opens the lightbox with live video',len(lb)==1 and lb[0]['w']>=640,lb)
    A.keyboard.press('Escape');A.wait_for_timeout(300)
    ok('Esc closes the lightbox only (rail stays open)',A.evaluate("!document.querySelector('#md .qv-lb')&&RAIL===true"))
    # navigation keeps video playing in the rail; the page's own tiles are untouched
    for t in ['Clients','Agency Performance','Learning Network','Command Deck']:
        A.evaluate("t=>openTab(t)",t);A.wait_for_timeout(700)
    t1=A.evaluate(VSTAT,'#qvRP video');A.wait_for_timeout(1200);t2=A.evaluate(VSTAT,'#qvRP video')
    ok('after navigating 4 pages the rail videos still play',len(t1)==3 and all(x['w']>0 and not x['p'] for x in t2) and all(t2[i]['t']>t1[i]['t'] for i in range(len(t2))),(t1,t2))
    A.evaluate("CH.ch='__voice';openTab('Team Chat')");A.wait_for_timeout(2500)
    pv=A.evaluate(VSTAT,'#main video');rv=A.evaluate(VSTAT,'#qvRP video')
    ok('full Sales Floor page shows its own videos while the rail keeps its copies',len(pv)>=2 and all(x['w']>0 for x in pv) and len(rv)==3 and all(x['w']>0 for x in rv),(pv,rv))
    A.evaluate("openTab('Clients')");A.wait_for_timeout(1500);rv2=A.evaluate(VSTAT,'#qvRP video')
    ok('leaving the Sales Floor page leaves no black tiles in the rail',len(rv2)==3 and all(x['w']>0 and not x['p'] for x in rv2),rv2)
    ok('A still exactly one audible element per remote peer',A.evaluate(AUD)==1,A.evaluate(AUD))
    # switching rail tabs / collapsing detaches the copies, never stops tracks
    A.evaluate("qvTab('chat')");A.wait_for_timeout(300)
    ok('switching to CHAT detaches the display copies',A.evaluate("Array.from(QV.vs).every(v=>!v.srcObject)&&!document.querySelector('#rail video')"))
    ok('real tracks keep running',A.evaluate("VC.cam.getVideoTracks()[0].readyState==='live'&&Object.values(VC.rs).every(m=>Object.values(m).every(s=>s.getTracks().every(t=>t.readyState==='live')))"))
    A.evaluate("qvTab('floor')");A.wait_for_timeout(1500)
    ok('back on FLOOR the tiles play again',all(x['w']>0 for x in A.evaluate(VSTAT,'#qvRP video')) and len(A.evaluate(VSTAT,'#qvRP video'))==3)
    A.evaluate("toggleRail(false)");A.wait_for_timeout(500)
    ok('collapsed rail holds no attached video',A.evaluate("Array.from(document.querySelectorAll('#rail video')).every(v=>!v.srcObject)"))
    A.evaluate("toggleRail(true)");A.wait_for_timeout(1500)
    ok('reopened rail plays again',len(A.evaluate(VSTAT,'#qvRP video'))==3 and all(x['w']>0 for x in A.evaluate(VSTAT,'#qvRP video')))
    # float window
    A.evaluate("qvPop('floor')");A.wait_for_timeout(1500)
    fv=A.evaluate(VSTAT,'#qvF video')
    ok('pop-out window shows the floor with live video',A.evaluate("!!document.getElementById('qvF')&&!document.getElementById('qvF').hidden")and len(fv)==3 and all(x['w']>0 for x in fv),fv)
    ok('rail switched away, so the floor renders once',A.evaluate("QV.tab!=='floor'&&document.querySelectorAll('[data-qvs]').length===3"))
    g0=A.evaluate("(()=>{const r=document.getElementById('qvF').getBoundingClientRect();return[r.x,r.y,r.width,r.height]})()")
    hb=A.evaluate("(()=>{const r=document.querySelector('#qvFH .qv-sp').getBoundingClientRect();return[r.x+r.width/2,r.y+r.height/2]})()")
    A.mouse.move(hb[0],hb[1]);A.mouse.down();A.mouse.move(hb[0]-300,hb[1]-200,steps=8);A.mouse.up();A.wait_for_timeout(300)
    g1=A.evaluate("(()=>{const r=document.getElementById('qvF').getBoundingClientRect();return[r.x,r.y,r.width,r.height]})()")
    ok('drag moves the window',abs((g0[0]-g1[0])-300)<3 and abs((g0[1]-g1[1])-200)<3,(g0,g1))
    rz=A.evaluate("(()=>{const r=document.querySelector('#qvF .qv-rz').getBoundingClientRect();return[r.x+9,r.y+9]})()")
    A.mouse.move(rz[0],rz[1]);A.mouse.down();A.mouse.move(rz[0]+80,rz[1]+60,steps=6);A.mouse.up();A.wait_for_timeout(300)
    g2=A.evaluate("(()=>{const r=document.getElementById('qvF').getBoundingClientRect();return[r.x,r.y,r.width,r.height]})()")
    ok('resize grows the window',abs(g2[2]-g1[2]-80)<3 and abs(g2[3]-g1[3]-60)<3,(g1,g2))
    hb2=A.evaluate("(()=>{const r=document.querySelector('#qvFH .qv-sp').getBoundingClientRect();const f=document.getElementById('qvF').getBoundingClientRect();return[r.x+r.width/2,r.y+r.height/2,r.x+r.width/2-f.x,r.y+r.height/2-f.y]})()")
    A.mouse.move(hb2[0],hb2[1]);A.mouse.down();A.mouse.move(hb2[2]+20,hb2[3]+25,steps=6);A.mouse.up();A.wait_for_timeout(300)
    g3=A.evaluate("(()=>{const r=document.getElementById('qvF').getBoundingClientRect();return[r.x,r.y]})()")
    ok('dropping near a corner snaps to it',g3==[16,16],g3)
    A.focus('#qvFH');A.keyboard.press('ArrowRight');A.keyboard.press('ArrowDown');A.wait_for_timeout(200)
    g4=A.evaluate("(()=>{const r=document.getElementById('qvF').getBoundingClientRect();return[r.x,r.y]})()")
    ok('arrow keys move the focused window',g4==[40,40],g4)
    A.evaluate("CH.ch='__voice';openTab('Team Chat')");A.wait_for_timeout(600)
    ok('hidden on the full Sales Floor page',A.evaluate("document.getElementById('qvF').hidden&&Array.from(document.querySelectorAll('#qvF video')).every(v=>!v.srcObject)"))
    A.evaluate("qvPin()");A.evaluate("go()");A.wait_for_timeout(800)
    ok('pinned window stays on the Sales Floor page',A.evaluate("!document.getElementById('qvF').hidden"))
    A.evaluate("qvPin();openTab('Clients')");A.wait_for_timeout(1200)
    ok('visible again over Clients',A.evaluate("!document.getElementById('qvF').hidden")and all(x['w']>0 for x in A.evaluate(VSTAT,'#qvF video')))
    A.focus('#qvFH');A.keyboard.press('Escape');A.wait_for_timeout(300)
    ok('Esc closes the window, not the call',A.evaluate("!document.getElementById('qvF')&&VC.on===1"))
    A.evaluate("qvPop('floor')");A.wait_for_timeout(300)
    geo=A.evaluate("JSON.parse(localStorage.getItem('owq_qv')).fl")
    # B leaves: tiles for B and the stage go away in A
    Bp.evaluate("vcLeave()");A.wait_for_timeout(3500)
    ok('after B leaves only A remains',A.evaluate("document.querySelectorAll('#qvF .qv-t').length===1&&!document.querySelector('#qvF .qv-st')&&document.querySelectorAll('#qvF .qv-p').length===1"))
    # device error path in C: camera blocked
    C.evaluate("""(()=>{const md=navigator.mediaDevices,g=md.getUserMedia.bind(md);md.getUserMedia=c=>c&&c.video?Promise.reject(Object.assign(new Error('blocked'),{name:'NotAllowedError'})):g(c)})()""")
    C.click('#qvRP .qv-join');C.wait_for_timeout(1500)
    C.click("#qvRP .qv-ctl[aria-label='Turn camera on']");C.wait_for_timeout(800)
    want=C.evaluate("vcErr({name:'NotAllowedError'},'The camera')")
    got=C.evaluate("(document.querySelector('#qvRP .qv-fe')||{}).textContent")
    ok('camera error shows the same text as the Sales Floor page',got==want and C.evaluate("!document.querySelector('#qvRP .qv-fe').hidden"),(got,want))
    ok('room listeners were not duplicated',all(x.evaluate("__room.onN===1&&__room.peersN===1") for x in (A,Bp,C)))
    # persistence after reload (A): float position, size and mode
    A.reload();A.wait_for_timeout(2500);import lgx;lgx.login(A,0);A.wait_for_timeout(2000)
    g5=A.evaluate("(()=>{const f=document.getElementById('qvF');if(!f)return null;const r=f.getBoundingClientRect();return[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]})()")
    ok('after reload the window comes back at the same place and size',g5==[geo['x'],geo['y'],geo['w'],geo['h']],(g5,geo))
    A.screenshot(path=qvt.B+'/tmp/floor_end.png')
    b.close()
room.stop()
bad=[e for e in errs if 'ICE' not in e]
ok('no page errors',not bad,bad[:6])
n=sum(1 for _,c in R if c);print('RESULT %d/%d passed'%(n,len(R)))
sys.exit(0 if n==len(R) else 1)
