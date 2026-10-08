"""layout check at 1440 / 1100 / 768 / 390 for each look: no horizontal overflow, no element wider than the deck, tap targets on phone.
usage: python3 widths.py <portal_all.html> [looks=abc]  -> shots/w_<look>_<width>.png (top 1400px) + report"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import dkseed as K
from playwright.sync_api import sync_playwright
src = os.path.abspath(sys.argv[1]); looks = sys.argv[2] if len(sys.argv) > 2 else 'abc'
wrapped = K.wrap(src, K.DK + '/tmp/w_wrap.html')
CHECK = r"""(()=>{const r=document.getElementById('dkr');if(!r)return{err:'no deck root'};const m=document.getElementById('main'),W=r.getBoundingClientRect().right+1;
const wide=[...r.querySelectorAll('*')].filter(e=>{if(e.closest('.dk-kpis,.dk-cards,.dk-fw,.tk,.dk-side,.cols,.dk-hfx,.dk-hbg,.dk-grid,svg'))return false;const b=e.getBoundingClientRect();return b.width>0&&b.right>W+2}).slice(0,6).map(e=>e.className&&e.className.baseVal!==undefined?e.tagName:e.tagName+'.'+String(e.className).slice(0,40));
const small=innerWidth<=560?[...r.querySelectorAll('[onclick],button')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&b.height>0&&(b.height<40||b.width<40)&&!e.closest('#cqp')&&getComputedStyle(e).visibility!=='hidden'}).map(e=>(e.innerText||e.getAttribute('aria-label')||e.tagName).slice(0,30)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)).slice(0,12):[];
return{hov:document.documentElement.scrollWidth>innerWidth+1||m.scrollWidth>m.clientWidth+1,wide,small}})()"""
out = {}
with sync_playwright() as p:
    for l in looks:
        for w in (1440, 1100, 768, 390):
            b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--no-sandbox', '--no-proxy-server', '--disable-webgl'])
            kw = dict(viewport={'width': w, 'height': 900 if w > 400 else 844}, timezone_id='America/New_York')
            if w == 390: kw.update(is_mobile=True, has_touch=True)
            ctx = b.new_context(**kw); ctx.set_default_timeout(120000)
            ctx.add_init_script(K.shift_js(*K.NOW)); ctx.add_init_script(K.seed_js("localStorage.setItem('owq_dk','%s');" % l))
            errs = []; pg = K.page(ctx, errs)
            K.open_deck(pg, wrapped if w <= 768 else 'file://' + src, 6)
            pg.evaluate("try{localStorage.setItem('owq_gq','auto')}catch(e){};dkReplay()"); pg.wait_for_timeout(4200); pg.evaluate(K.QUIET_JS)
            res = pg.evaluate(CHECK); res['errors'] = errs[:3]; out['%s_%d' % (l, w)] = res
            if w in (1100, 768):
                pg.set_viewport_size({'width': w, 'height': 1500}); pg.wait_for_timeout(500)
                pg.screenshot(path=K.DK + '/shots/w_%s_%d.png' % (l, w))
            print(l, w, json.dumps(res)[:400]); b.close()
json.dump(out, open(K.DK + '/tests/widths_result.json', 'w'), indent=1)
