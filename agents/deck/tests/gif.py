"""Motion preview GIFs with a controlled clock (deterministic, independent of how slow the software renderer is).
usage: python3 gif.py <portal_all.html> <look> [seconds=6.5] [fps=12]  -> shots/<look>_motion.gif
How: after login the page is switched to virtual time: performance.now() and requestAnimationFrame are driven by the test, and every
CSS/Web animation is paused and advanced by exactly 1/fps per frame (Animation.currentTime). Each frame is screenshotted, then ffmpeg
(palettegen/paletteuse) assembles the GIF.  Timeline: 0 s fresh entrance + count-ups, idle motion, at 4.2 s a new policy is issued
(live refresh: numbers tween from the old value, one celebration burst)."""
import sys, os, subprocess, shutil, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import dkseed as K
from playwright.sync_api import sync_playwright
src = os.path.abspath(sys.argv[1]); look = sys.argv[2]
SEC = float(sys.argv[3]) if len(sys.argv) > 3 else 6.5
FPS = int(sys.argv[4]) if len(sys.argv) > 4 else 12
W, H = int(os.environ.get('GW', 1440)), int(os.environ.get('GH', 900))
OUTW = int(os.environ.get('GOUT', 720))
VT = r"""(()=>{const rn=performance.now.bind(performance),rr=requestAnimationFrame.bind(window),rc=cancelAnimationFrame.bind(window);
let on=0,vt=0,q=[],id=1e6;window.__vt={on:()=>{vt=rn();on=1},now:()=>vt};
performance.now=()=>on?vt:rn();
window.requestAnimationFrame=cb=>{if(!on)return rr(t=>cb(on?vt:t));const i=++id;q.push([i,cb]);return i};
window.cancelAnimationFrame=i=>{q=q.filter(x=>x[0]!==i);try{rc(i)}catch(e){}};
window.__adv=dt=>{vt+=dt;const Q=q;q=[];Q.forEach(x=>{try{x[1](vt)}catch(e){}});
 document.getAnimations().forEach(a=>{try{if(!a.__dk){a.__dk=1;a.pause()}a.currentTime=(a.currentTime||0)+dt}catch(e){}})};})()"""
frames = K.DK + '/tmp/gif_%s' % look
shutil.rmtree(frames, ignore_errors=True); os.makedirs(frames)
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--no-sandbox', '--no-proxy-server', '--disable-webgl'])
    ctx = b.new_context(viewport={'width': W, 'height': H}, timezone_id='America/New_York'); ctx.set_default_timeout(180000)
    ctx.add_init_script(K.shift_js(*K.NOW)); ctx.add_init_script(K.seed_js("localStorage.setItem('owq_dk','%s');" % look)); ctx.add_init_script(VT)
    pg = K.page(ctx, errs)
    K.open_deck(pg, 'file://' + src, int(os.environ.get('GWHO', 1)), settle=800)
    pg.evaluate("localStorage.setItem('owq_gq','auto');document.getElementById('main').scrollTop=0")
    pg.evaluate("__vt.on();dkReplay()")
    pg.evaluate(K.QUIET_JS)
    n = int(SEC * FPS); dt = 1000.0 / FPS; fired = False
    for _ in range(int(os.environ.get('GPRE', 3))): pg.evaluate("__adv(%f)" % dt)   # short pre-roll so frame 1 is not blank
    for i in range(n):
        t = i / FPS
        if not fired and t >= 4.2:
            fired = True
            pg.evaluate("D.policies.push({d:today,cl:'Frances Turner',ag:'John Montini',car:'Americo',prod:'Final Expense',ap:1320,pct:100,src:'Referral',st:'Issued'});save();refreshQuiet()")
        pg.evaluate("__adv(%f)" % dt)
        if i == 0:
            clip = pg.evaluate("(()=>{const m=document.getElementById('main').getBoundingClientRect(),r=document.getElementById('dkr').getBoundingClientRect();return{x:Math.round(m.left),y:Math.max(0,Math.round(r.top)-8),width:Math.round(m.width),height:Math.min(%d,innerHeight-Math.max(0,Math.round(r.top)-8))}})()" % int(os.environ.get('GCH', 780)))
        pg.screenshot(path='%s/f_%03d.png' % (frames, i), clip=clip)
    b.close()
out = K.DK + '/shots/%s_motion.gif' % look
vf = "scale=%d:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=160:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" % OUTW
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', frames + '/f_%03d.png', '-vf', vf, '-loop', '0', out], check=True)
print('wrote', out, os.path.getsize(out) // 1024, 'KB', n, 'frames', 'errors', errs[:3])
