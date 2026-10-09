"""Shared setup for the v107 browser tests: serve a test site, sign in on the fake database, join the voice lobby and
wait for the 3D Sales Floor. Never prints access codes (lgx uses the in-page map)."""
import sys, os, time, json, subprocess
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
sys.path.insert(0, SP)
import lgx
FLAGS = ['--no-sandbox', '--no-proxy-server', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
         '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required']
OUT = os.environ.get('OUT', SP + '/web/test/shots7')
os.makedirs(OUT, exist_ok=True)
USERS = [{'uid': 'uOwner', 'email': 'owner@example.com', 'displayName': 'Cole Leckey'}, {'uid': 'uNate', 'email': 'nate@example.com', 'displayName': 'Nate Johnson'}]
# deterministic stepping: performance.now is frozen and moved 50 ms per step (two animation frames each)
STEP = "n=>new Promise(r=>{let k=0;const f=()=>{if(k++>=n)return r();window.__vt+=50;requestAnimationFrame(()=>requestAnimationFrame(f))};f()})"
FREEZE = "(()=>{window.__vt=performance.now();performance.now=()=>window.__vt;VO3.dbg().fast=true})()"


def serve(site, port):
    srv = subprocess.Popen(['python3', '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=site, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    return srv


def context(b, port, gfx=None, w=1280, h=760):
    ctx = b.new_context(viewport={'width': w, 'height': h}, permissions=['microphone', 'camera'])
    init = "try{localStorage.setItem('owq_gq','still');localStorage.setItem('owq_vo',JSON.stringify({list:0,demo:0,ava:'',auto:1,sfx:1}))" + (";localStorage.setItem('owq_gfx','%s')" % gfx if gfx else '') + "}catch(e){}"
    ctx.add_init_script(init)
    K = ctx.new_page(); K.goto('http://127.0.0.1:%d/keep.html' % port); K.wait_for_function('window.__FAKE')
    return ctx


def floor(ctx, port, who=0, errs=None, reset=True, demo=False, idx=2, logcon=False):
    A = ctx.new_page()
    if errs is not None:
        A.on('pageerror', lambda e: errs.append(str(e)[:300]))
        A.on('console', lambda m: errs.append('CON ' + m.text[:400]) if m.type == 'error' and ('THREE' in m.text or 'VO3' in m.text or 'Shader' in m.text or 'WebGL' in m.text) else None)
    if logcon:
        A.on('console', lambda m: print('CON', m.type, m.text[:300], flush=True) if m.type in ('error', 'warning') else None)
    A.add_init_script("window.__FAKE_SIGNIN=%s;" % json.dumps(USERS[who]))
    A.goto('http://127.0.0.1:%d/index.html' % port); A.wait_for_function("window.__FAKE", timeout=20000)
    if reset:
        A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})")
    A.evaluate("sessionStorage.clear()"); A.reload()
    A.wait_for_function("OWQC.phase==='out'", timeout=30000); A.click('#owqgi'); A.wait_for_function("OWQC.phase==='in'", timeout=30000)
    lgx.login(A, idx); A.wait_for_timeout(800)
    A.evaluate("openTab('Team Chat');CH.ch='__voice';go()"); A.wait_for_timeout(3000)
    A.evaluate("vcJoin()"); A.wait_for_timeout(2000)
    if demo:
        A.evaluate("voDemo(1)"); A.wait_for_timeout(500)
    A.evaluate("VO3.dbg().fast=true")
    A.wait_for_function("(()=>{const m=VO3.dbg().meAv;return m&&m.mode==='seated'})()", timeout=150000)
    return A


def checker():
    res = {'pass': 0, 'fail': 0}
    def ok(c, m, i=''):
        res['pass' if c else 'fail'] += 1
        print(('PASS ' if c else 'FAIL ') + m + ('' if c else '  ' + str(i)[:400]), flush=True)
        return c
    return ok, res


def cam(A, P, T, F=None):
    """park the debug camera (world coordinates)"""
    A.evaluate("([P,T,F])=>{VO3.dbg().dbgCam={P:{x:P[0],y:P[1],z:P[2]},T:{x:T[0],y:T[1],z:T[2]},F:F||0}}", [P, T, F])


def expand(A):
    """big 3D view for pictures: expand the floor and hide the browser's voice warning"""
    A.evaluate("""(()=>{voExp(1);const st=document.createElement('style');st.textContent='.vo3t,.vo3toast{opacity:0!important}';document.head.appendChild(st);
      [...document.querySelectorAll('div,p,span')].filter(e=>/WebRTC/.test(e.textContent)&&e.childElementCount<3&&e.textContent.length<400).forEach(e=>e.style.visibility='hidden')})()""")
    A.wait_for_timeout(600)


def shot(A, name, wait=1200, floor=True):
    A.wait_for_timeout(wait)
    path = OUT + '/' + name + '.png'
    r = floor and A.evaluate("(()=>{const e=document.getElementById('vofm');if(!e)return null;const b=e.getBoundingClientRect();return {x:Math.max(0,b.left),y:Math.max(0,b.top),width:Math.min(innerWidth,b.right)-Math.max(0,b.left),height:Math.min(innerHeight,b.bottom)-Math.max(0,b.top)}})()")
    if r and r['width'] > 50 and r['height'] > 50:
        A.screenshot(path=path, timeout=240000, clip=r)
    else:
        A.screenshot(path=path, timeout=240000)
