"""Command Deck performance: render time and idle animation cost, base vs looks (software GL / swiftshader, 1440x900, full graphics tier).
usage: python3 perf.py <base.html> <portal_a.html> <portal_b.html> <portal_c.html>  -> tests/perf_result.json
render: median of 12 go() calls incl. forced style+layout; ov(): median of 12 string builds.
idle (5 s, deck at rest after the entrance): CDP Performance metrics delta (TaskDuration = main-thread busy time, Script, Style, Layout),
rAF frames + p95 frame interval, long tasks (>50 ms)."""
import sys, os, json, time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import dkseed as K
from playwright.sync_api import sync_playwright
files = dict(zip(['base', 'a', 'b', 'c'], [os.path.abspath(x) for x in sys.argv[1:5]]))
ARGS = ['--no-sandbox', '--no-proxy-server', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
RENDER = """(()=>{const m=document.getElementById('main'),t=[],o=[];for(let i=0;i<12;i++){const a=performance.now();go();void m.offsetHeight;getComputedStyle(m.lastElementChild).color;t.push(performance.now()-a)}
for(let i=0;i<12;i++){const a=performance.now();views['Command Deck'][0]();o.push(performance.now()-a)}const md=x=>x.sort((p,q)=>p-q)[x.length>>1];return{go_ms:+md(t).toFixed(2),ov_ms:+md(o).toFixed(2)}})()"""
IDLE = """new Promise(res=>{const fr=[];let last=performance.now(),lt=0,ltd=0;const po=new PerformanceObserver(l=>{l.getEntries().forEach(e=>{lt++;ltd+=e.duration})});try{po.observe({entryTypes:['longtask']})}catch(e){}
const t0=performance.now();const f=t=>{fr.push(t-last);last=t;if(t-t0<5000)requestAnimationFrame(f);else{po.disconnect();fr.sort((a,b)=>a-b);res({frames:fr.length,fps:+(fr.length/((t-t0)/1000)).toFixed(1),p95_ms:+fr[Math.floor(fr.length*.95)].toFixed(1),longtasks:lt,longtask_ms:Math.round(ltd)})}};requestAnimationFrame(f)})"""
def cpu_desc():
    """CPU seconds (user+sys) used so far by every process started below this script (browser, renderer, GPU, utility)"""
    ppid, st = {}, {}
    for d in os.listdir('/proc'):
        if not d.isdigit(): continue
        try:
            f = open('/proc/%s/stat' % d).read(); r = f[f.rindex(')') + 2:].split()
            ppid[int(d)] = int(r[1]); st[int(d)] = (int(r[11]) + int(r[12])) / os.sysconf('SC_CLK_TCK')
        except Exception: pass
    me = os.getpid(); kids = set(); grow = True
    while grow:
        grow = False
        for k, v in ppid.items():
            if (v == me or v in kids) and k not in kids: kids.add(k); grow = True
    return sum(st.get(k, 0) for k in kids)


out = {}
with sync_playwright() as p:
    for name, f in files.items():
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=ARGS)
        ctx = b.new_context(viewport={'width': 1440, 'height': 900}, timezone_id='America/New_York'); ctx.set_default_timeout(180000)
        ctx.add_init_script(K.shift_js(*K.NOW)); ctx.add_init_script(K.seed_js())
        errs = []; pg = K.page(ctx, errs)
        K.open_deck(pg, 'file://' + f, 6, settle=500)
        pg.evaluate("try{localStorage.setItem('owq_gq','auto')}catch(e){};typeof dkReplay==='function'?dkReplay():go()")
        pg.wait_for_timeout(6000); pg.evaluate(K.QUIET_JS); pg.evaluate("document.getElementById('main').scrollTop=0")
        r = pg.evaluate(RENDER)
        pg.evaluate("typeof dkS!=='undefined'?(dkS.first=0):0;go()"); pg.wait_for_timeout(2500)
        cdp = ctx.new_cdp_session(pg); cdp.send('Performance.enable')
        m0 = {x['name']: x['value'] for x in cdp.send('Performance.getMetrics')['metrics']}
        c0 = cpu_desc(); w0 = time.time()
        idle = pg.evaluate(IDLE)
        c1 = cpu_desc(); w1 = time.time()
        m1 = {x['name']: x['value'] for x in cdp.send('Performance.getMetrics')['metrics']}
        d = lambda k: round((m1.get(k, 0) - m0.get(k, 0)) * 1000)
        idle.update({'cpu_pct_all_processes': round((c1 - c0) / (w1 - w0) * 100, 1), 'busy_ms_per_5s': d('TaskDuration'), 'script_ms': d('ScriptDuration'), 'style_ms': d('RecalcStyleDuration'), 'layout_ms': d('LayoutDuration'),
                     'particles': pg.evaluate("document.querySelectorAll('#main .dk-em').length"), 'load': os.getloadavg()[0]})
        out[name] = {'render': r, 'idle': idle, 'errors': errs[:3]}
        if name != 'base':
            # same deck with its own animations off (graphics 'still'): the difference is what the look's idle motion costs
            pg.evaluate("localStorage.setItem('owq_gq','still');go()"); pg.wait_for_timeout(1500)
            m0 = {x['name']: x['value'] for x in cdp.send('Performance.getMetrics')['metrics']}
            c0 = cpu_desc(); w0 = time.time(); st = pg.evaluate(IDLE); c1 = cpu_desc(); w1 = time.time()
            m1 = {x['name']: x['value'] for x in cdp.send('Performance.getMetrics')['metrics']}
            st.update({'cpu_pct_all_processes': round((c1 - c0) / (w1 - w0) * 100, 1), 'busy_ms_per_5s': d('TaskDuration')})
            out[name]['idle_still'] = st
        print(name, json.dumps(out[name]), flush=True)
        b.close()
json.dump(out, open(K.DK + '/tests/perf_result.json', 'w'), indent=1)
