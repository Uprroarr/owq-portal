"""debug: is the Sky Deck road shader patch compiled in? prints the programs that carry the patch markers"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v7
from playwright.sync_api import sync_playwright
PORT = 8872; SITE = os.environ.get('SITE', v7.SP + '/web/test/site_w')
srv = v7.serve(SITE, PORT)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=v7.FLAGS)
        ctx = v7.context(b, PORT, gfx='low')
        errs = []
        A = v7.floor(ctx, PORT, errs=errs)
        v7.cam(A, [-48, 3, -20], [-48, 1, -60], 60)
        A.wait_for_timeout(4000)
        print(A.evaluate("""(()=>{const O=VO3.dbg(),M=O.track.road,gl=O.r.getContext();
          const out={name:M.name,type:M.type,hasOBC:!!M.onBeforeCompile,key:M.customProgramCacheKey&&M.customProgramCacheKey(),U:Object.keys(M.userData.U||{}),progs:O.r.info.programs.length};
          const pr=O.r.info.programs.filter(p=>/owqp|trackroad/.test(p.cacheKey||''));out.match=pr.map(p=>p.name+' '+(p.cacheKey||'').slice(0,60));
          const props=O.r.properties.get(M);out.propsProg=props&&props.currentProgram?props.currentProgram.name:null;
          out.propsKeys=props?Object.keys(props):[];
          if(props&&props.currentProgram){const sh=gl.getAttachedShaders(props.currentProgram.program);out.src=sh.map(s=>{const t=gl.getShaderSource(s);return [t.length,t.includes('uHW'),t.includes('vTrk')]})}
          let n=0;O.track.group.traverse(o=>{if(o.isMesh&&o.material===M)n++});out.meshes=n;
          return out})()"""))
        print('errs', errs[:8])
        b.close()
finally:
    srv.terminate()
