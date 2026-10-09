"""debug: start a bot match and print any frame errors"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = 8875; SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w')
srv = v7.serve(SITE, PORT)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=v7.FLAGS)
        ctx = v7.context(b, PORT, gfx='low')
        errs = []
        A = v7.floor(ctx, PORT, errs=errs)
        A.on('console', lambda m: print('CON', m.type, m.text[:600], flush=True) if 'VO3' in m.text else None)
        A.evaluate("(()=>{const R=VO3.dbg().arena;R.mapI=0;R.startBot()})()")
        A.wait_for_timeout(3000)
        print(A.evaluate("(()=>{const O=VO3.dbg(),M=O.arena.match;return {errs:O.errs,ph:M&&M.ph,warm:M&&M.warm,t:M&&M.t}})()"))
        A.wait_for_timeout(3000)
        print(A.evaluate("(()=>{const O=VO3.dbg(),M=O.arena.match;return {errs:O.errs,ph:M&&M.ph,warm:M&&M.warm,t:M&&M.t}})()"))
        print('errs', errs[:5])
        b.close()
finally:
    srv.terminate()
