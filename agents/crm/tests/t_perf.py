"""Performance: 5,000 contacts + 50,000 events in local mode. Reports timings; fails only on gross regressions."""
import sys,os,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from h import *
PORTAL=os.environ.get('CRM_PORTAL',CRM+'/out/portal.html')
GEN=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'gen_demo.js')).read()
R={'pass':0,'fail':0}
def ok(c,msg):
    R['pass' if c else 'fail']+=1;print(('PASS ' if c else 'FAIL ')+msg,flush=True)
with sync_playwright() as p:
    b,ctx=launch(p,(1440,900));errs=[];pg=page(ctx,errs)
    url=wrap(PORTAL,CRM+'/tmp/w_perf.html');open_portal(pg,url,6)
    pg.evaluate("toggleRail(false)")
    t=pg.evaluate(GEN+";(()=>{const t0=performance.now();const n=crmGenDemo(5000,10,11);return [n,performance.now()-t0]})()")
    pg.wait_for_function("crmAll().length===5000",timeout=60000);pg.wait_for_timeout(500)
    M=pg.evaluate("""(()=>{const T=f=>{const t0=performance.now();f();return Math.round((performance.now()-t0)*10)/10};const m={};
     m.contacts=crmAll().length;m.tasks=CRM.t.size;m.eventsLoaded=CRM.e.size;
     m.shim=T(()=>{CRM.cache={};MYCL()});m.counts=T(()=>crmCounts());m.queue=T(()=>crmQueue());
     tab='Clients';SUB['Clients']='Today';m.today=T(()=>go());SUB['Clients']='Pipeline';m.pipeline=T(()=>go());SUB['Clients']='Client Book';cid=null;m.book=T(()=>{go();crmAfter()});
     const vl=document.getElementById('crmvl');m.scroll=T(()=>{for(let i=1;i<=20;i++){vl.scrollTop=i*1450;crmListPaint()}})/20;m.rowsInDom=document.querySelectorAll('.crm-row').length;
     const bq=document.getElementById('crmbq');m.search=T(()=>{CRM.ui.q='mary';crmBookUpd()});m.searchHits=CRM.ui.list.length;m.searchPhone=T(()=>{CRM.ui.q='555-12';crmBookUpd()});CRM.ui.q='';
     const c=crmAll()[2500];m.c360=T(()=>{crmOpen(c.id)});tab='Command Deck';CRM.cache={};m.deck=T(()=>go());m.palette=T(()=>CMDS());
     const L=[];Object.keys(CRM.db._S.docs).forEach(k=>L.push([k,JSON.stringify(CRM.db._S.docs[k]).length]));m.docs=L.length;m.maxDoc=Math.max(...L.map(x=>x[1]));m.totalMB=Math.round(L.reduce((a,x)=>a+x[1],0)/1e5)/10;
     m.heapMB=performance.memory?Math.round(performance.memory.usedJSHeapSize/1e5)/10:null;return m})()""")
    M['gen_apply_ms']=round(t[1]);M['gen_docs']=t[0]
    print(json.dumps(M,indent=1))
    ok(M['contacts']==5000,'5,000 contacts loaded');ok(M['today']<1500,'Today renders < 1.5 s');ok(M['pipeline']<1500,'Pipeline renders < 1.5 s');ok(M['book']<1500,'Client Book renders < 1.5 s')
    ok(M['rowsInDom']<60,'windowed list keeps < 60 rows in the DOM');ok(M['search']<300,'search < 300 ms');ok(M['scroll']<50,'scroll paint < 50 ms');ok(M['maxDoc']<262144,'every doc < 256 KiB')
    open(CRM+'/tests/perf.json','w').write(json.dumps(M,indent=1))
    print('errors:',errs[:5]);ok(not errs,'no console errors')
    b.close()
print('perf: %d passed, %d failed'%(R['pass'],R['fail']));sys.exit(1 if R['fail'] else 0)
