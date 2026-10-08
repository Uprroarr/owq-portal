import sys,base64,json,subprocess,os
from playwright.sync_api import sync_playwright
import lgx
F='http://127.0.0.1:8765/owq-command-station-v2.html'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--disable-webgl','--no-proxy-server'])
    ctx=b.new_context(viewport={'width':1366,'height':860});ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append('PE '+str(e)[:300]))
    pg.goto(F);pg.wait_for_timeout(2500);lgx.login(pg,6)
    keys=pg.evaluate("LNM.filter(m=>m.bp).map(m=>[m.id,m.bp.pages.length,m.t])")
    bad=0
    for mid,n,t in keys:
        js="""async(id)=>{const m=LNM.find(x=>x.id===id);const u8=await lnPdfBuild(m);let s='';const CH=0x8000;for(let i=0;i<u8.length;i+=CH)s+=String.fromCharCode.apply(null,u8.subarray(i,i+CH));return btoa(s)}"""
        b64=pg.evaluate(js,mid)
        f=f'pdfs/{mid}.pdf';open(f,'wb').write(base64.b64decode(b64))
        r=subprocess.run(['pdfinfo',f],capture_output=True,text=True)
        pages=[l for l in r.stdout.splitlines() if l.startswith('Pages:')]
        ok=r.returncode==0 and pages and int(pages[0].split()[1])==n
        if not ok: bad+=1
        print(mid,'expected',n,'pages ->',pages[0] if pages else r.stderr[:100],'size',os.path.getsize(f),'OK' if ok else 'BAD')
    print('bad',bad,'errors',errs[:3] or 'none');b.close()
