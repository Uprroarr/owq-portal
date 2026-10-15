"""Pictures of the Call Script (v111): desktop step cards (objection open, Note it, secure step, picker) and phone width."""
import sys, os, time, json, subprocess
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'; sys.path.insert(0, SP)
import lgx
from playwright.sync_api import sync_playwright
PORT = int(os.environ.get('PORT', 8852)); SITE = os.environ.get('SITE', SP + '/web/test/site_gs'); URL = 'http://127.0.0.1:%d/index.html' % PORT
SHOTS = SP + '/web/test/shots'; os.makedirs(SHOTS, exist_ok=True)
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=SITE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
def card(A, i, js=''):
    A.evaluate("i=>{GS.cur=i;GS.wrap=0;gsPaint()}", i)
    if js: A.evaluate(js)
    A.wait_for_timeout(250); A.evaluate("(()=>{document.querySelectorAll('.ts').forEach(e=>e.className='ts');const w=document.getElementById('gsw');if(w)w.scrollIntoView({block:'start'})})()"); A.wait_for_timeout(250)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--no-sandbox', '--disable-webgl', '--no-proxy-server'])
        ctx = b.new_context(viewport={'width': 1366, 'height': 900}); ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
        K = ctx.new_page(); K.goto('http://127.0.0.1:%d/keep.html' % PORT); K.wait_for_function('window.__FAKE')
        A = ctx.new_page()
        A.add_init_script("window.__FAKE_SIGNIN=%s;" % json.dumps({'uid': 'uOwner', 'email': 'owner@example.com', 'displayName': 'Cole Leckey'}))
        A.goto(URL); A.wait_for_function("window.__FAKE", timeout=20000); A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})"); A.evaluate("sessionStorage.clear()"); A.reload()
        A.wait_for_function("OWQC.phase==='out'", timeout=30000); A.click('#owqgi'); A.wait_for_function("OWQC.phase==='in'", timeout=30000)
        lgx.login(A, 2); A.wait_for_timeout(1500)
        A.wait_for_function("typeof SYN!=='undefined'&&SYN.first&&typeof CRM!=='undefined'&&CRM.ready", timeout=40000)
        A.evaluate("(()=>{crmCreate({name:'Walter Briggs',phone:'412-555-0110',state:'PA',city:'Erie',owner:WHO});crmCreate({name:'Linda Park',phone:'412-555-0111',state:'OH',owner:WHO})})()")
        A.evaluate("openTab('Clients','Call Script')"); A.wait_for_timeout(800); A.evaluate("document.querySelectorAll('.ts').forEach(e=>e.className='ts')")
        A.screenshot(path=SHOTS + '/gs_picker.png', full_page=False)
        cid = A.evaluate("(()=>{const c=crmCreate({name:'Mary Jones',phone:'412-555-0102',email:'mary@example.com',dob:'1950-03-04',state:'PA',city:'Pittsburgh',owner:WHO});return c.id})()")
        A.evaluate("id=>gsOpen(id)", cid); A.wait_for_timeout(600)
        card(A, 0, "(()=>{GS.obj={busy:true};gsPaint()})()"); A.screenshot(path=SHOTS + '/gs_d_obj.png', full_page=False)
        card(A, 21, "(()=>{GS.cap.house='Own';GS.cap.bud='60';gsPaint()})()"); A.screenshot(path=SHOTS + '/gs_d_budget.png', full_page=False)
        card(A, 20); A.screenshot(path=SHOTS + '/gs_d_ssn.png', full_page=False)
        card(A, 11, "(()=>{GS.obj={};GS.cap.cov=['VA'];gsPaint()})()"); A.screenshot(path=SHOTS + '/gs_d_cov.png', full_page=False)
        A.set_viewport_size({'width': 390, 'height': 844}); A.wait_for_timeout(400)
        A.evaluate("(()=>{try{toggleRail(false)}catch(e){}go()})()"); A.wait_for_timeout(600)
        A.evaluate("(()=>{document.querySelectorAll('.ts').forEach(e=>e.className='ts');const v=document.getElementById('gsv');if(v)v.scrollIntoView({block:'start'})})()"); A.wait_for_timeout(300)
        A.screenshot(path=SHOTS + '/gs_p_top.png', full_page=False)
        card(A, 1); A.screenshot(path=SHOTS + '/gs_p_step.png', full_page=False)
        card(A, 37, "(()=>{GS.cap={branch:'Army',who:'Just them',goal:'Final expenses',bud:'45',fu_b:'10000',fu_m:'62',pick:'Full Coverage'};for(let i=0;i<GS_N;i++)if(GS.done.indexOf(i)<0)GS.done.push(i);GS.cur=GS_N;gsPaint()})()")
        A.screenshot(path=SHOTS + '/gs_p_wrap.png', full_page=False)
        print('shots done')
        b.close()
finally:
    srv.terminate()
