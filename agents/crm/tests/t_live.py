"""Multi-user live test: owner + 2 agents (+1 view-only) share one fake db. Migration race, concurrent edits/imports, visibility,
deterministic policy events, transient write errors, view-only rejection, doc counts/sizes/subscriptions. Never prints access codes."""
import sys,os,json,time
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from h import *
import fakedb,mrt
PORTAL=os.environ.get('CRM_PORTAL',CRM+'/out/portal.html')
R={'pass':0,'fail':0}
def ok(c,msg):
    R['pass' if c else 'fail']+=1;print(('PASS ' if c else 'FAIL ')+msg,flush=True)
def W(pg,js,t=15000):
    try:pg.wait_for_function(js,timeout=t);return True
    except Exception:return False
DB=fakedb.FakeDB().start()
# legacy shared clients (what the live db holds today): SYN stores JSON strings keyed by record id
L1={'id':101,'ag':'Austin Vardzel','name':'Grace Parker','phone':'412-555-0107','email':'grace.parker@example.com','age':'66','src':'Referral','st':'Quoted','fu':'2026-10-06','notes':[{'at':'2026-09-20T15:00:00.000Z','ty':'Call','t':'Wants a quote for her and her husband.'}],'info':{'state':'PA','city':'Pittsburgh'},'_i':'s0','_t':1}
L2={'id':102,'ag':'Nate Johnson','name':'Walter Ross','phone':'412-555-0108','st':'Lead','fu':'','notes':[],'_i':'s1','_t':2}
DB.set('rec/clients_0',{'s0':json.dumps(L1),'s1':json.dumps(L2)})
AG=['Austin Vardzel','Nate Johnson','Cole Leckey','John Montini','RJ Noullet','Ayman']
DB.set('rec/agents_0',{('a%d'%i):json.dumps({'id':i+1,'name':n,'goal':3000,'_i':'a%d'%i,'_t':i+1}) for i,n in enumerate(AG)})
url=wrap(PORTAL,CRM+'/tmp/w_live.html')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=ARGS)
    def mk(cid,ro=False,unk=False):
        c=b.new_context(viewport={'width':1280,'height':820});c.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}");c.add_init_script(fakedb.client_js(DB.port,cid,ro,unk));return c
    errs=[];DB.ro.add('u-john');P=[]
    for cid_,i,ro,unk in (('u-cole',6,False,False),('u-austin',0,False,False),('u-nate',1,False,False),('u-john',3,True,True)):
        q=page(mk(cid_,ro,unk),errs);q.goto(url,timeout=180000);q.wait_for_timeout(2500)
        try:lgx.login(q,i)
        except Exception as e:print('login retry',cid_,q.evaluate("GXU.state()"));q.reload();q.wait_for_timeout(3000);lgx.login(q,i)
        q.wait_for_timeout(600);P.append(q)
    po,pa,pn,pv=P
    for q,nm in ((po,'owner'),(pa,'Austin'),(pn,'Nate'),(pv,'John')):ok(W(q,"CRM.live&&CRM.ready",20000),nm+': shared CRM connected')
    # migration race: 3 writers ran it at boot
    time.sleep(3)
    ok(all(W(q,"crmAll().length===2",15000) for q in (po,pa,pn)),'legacy clients migrated once and visible to the owner and agents')
    evs=[k for d in DB.children('crme').values() for k in d['data'].keys() if k.startswith('el101_')]
    ok(len(evs)==1,'migrated note written once (deterministic id), got %d'%len(evs))
    ok(DB.get('rec/clients_0')=={'s0':json.dumps(L1),'s1':json.dumps(L2)},'legacy docs untouched (rollback stays possible)')
    ok(po.evaluate("MYCL().length")==2 and pa.evaluate("MYCL().map(c=>c.name)")==['Grace Parker'] and pn.evaluate("MYCL().map(c=>c.name)")==['Walter Ross'],'shim visibility: owner all, agents their own')
    ok(pa.evaluate("MYCL()[0].fu")=='2026-10-06' and pa.evaluate("MYCL()[0].st")=='Quoted','legacy fu/st preserved through the shim')
    # concurrent creates from two agents
    pa.evaluate("for(let i=0;i<5;i++)crmCreate({name:'Austin Lead '+i,phone:'412-555-02'+(10+i),src:'Facebook Leads'})")
    pn.evaluate("for(let i=0;i<5;i++)crmCreate({name:'Nate Lead '+i,phone:'412-555-03'+(10+i),src:'Live Transfers'})")
    ok(W(po,"crmAll().length===12",20000),'owner sees all 12 contacts after concurrent creates')
    ok(W(pa,"crmVisible().length===6",15000) and pa.evaluate("crmVisible().every(c=>c.owner==='Austin Vardzel')"),'Austin sees only his 6')
    ok(W(pn,"crmQueue().length>=5",15000) and not pn.evaluate("crmQueue().some(x=>/Austin/.test(x.c.name))"),"Nate's Today queue excludes Austin's leads")
    # concurrent field edits on the same contact (owner: email, Austin: phone + note) -> both survive
    gid=101
    po.evaluate("crmPut(101,{email:'grace.p@example.com'})");pa.evaluate("crmPut(101,{phone:'412-555-0199'});crmEv(101,'note',{t:'Daughter Ellen is the beneficiary.'})")
    ok(W(po,"crmGet(101).phone==='412-555-0199'&&crmGet(101).email==='grace.p@example.com'",20000) and W(pa,"crmGet(101).email==='grace.p@example.com'",20000),'concurrent field edits merge (no lost update)')
    srv=[d['data'].get('c101') for d in DB.children('crmc').values() if 'c101' in d['data']][0]
    ok(srv['phone']=='412-555-0199' and srv['email']=='grace.p@example.com','server document holds both edits')
    # owner imports unassigned leads while Austin works; Austin claims one
    po.evaluate("crmTx(()=>{for(let i=0;i<20;i++)crmCreate({name:'Pool Lead '+i,phone:'412-555-04'+(10+i),owner:'',src:'Aged Leads'})})")
    ok(W(pa,"crmVisible().filter(c=>!c.owner).length===20",20000),'agents see the unassigned pool')
    pa.evaluate("crmOwner(crmAll().find(c=>c.name==='Pool Lead 0').id,'Austin Vardzel')")
    ok(W(pn,"!crmVisible().some(c=>c.name==='Pool Lead 0')",20000),'claimed lead leaves the pool for others')
    # tasks on the same contact from two people
    t1=po.evaluate("crmTask({c:101,ty:'call',t:'Owner call',due:Date.now()+36e5}).id");t2=pa.evaluate("crmTask({c:101,ty:'text',t:'Austin text',due:Date.now()+72e5}).id")
    ok(W(po,"CRM.t.has('%s')"%t2,20000) and W(pa,"CRM.t.has('%s')"%t1,20000),'tasks from two people both land')
    pa.evaluate("crmDone('%s')"%t1);po.evaluate("crmSnooze('%s',Date.now()+864e5)"%t2)
    ok(W(po,"CRM.t.get('%s').s==='d'"%t1,20000) and W(pa,"CRM.t.get('%s').sn===1"%t2,20000),'done + snooze on the same contact both survive')
    # policy issued -> deterministic events across browsers
    po.evaluate("D.policies.push({d:'2026-10-04',cl:'Grace Parker',car:'Americo',prod:'Final Expense',ap:1320,pct:100,src:'Referral',st:'Submitted',ag:'Austin Vardzel'});crmOnPolicy(D.policies[D.policies.length-1]);save()")
    ok(W(pa,"crmGet(101).stage==='applied'",20000),'policy logged by the owner moves the stage for everyone')
    for q in (po,pa,pn):q.evaluate("crmPolicySweep()")
    po.evaluate("D.policies[D.policies.length-1].st='Issued';save();crmPolicySweep()")
    W(pa,"D.policies.some(p=>p.cl==='Grace Parker'&&p.st==='Issued')",20000);pa.evaluate("crmPolicySweep()");pn.evaluate("crmPolicySweep()")
    ok(W(pa,"crmGet(101).stage==='issued'",20000),'issued status replicated to the stage')
    time.sleep(2.5)
    pe=[k for d in DB.children('crme').values() for k,v in d['data'].items() if isinstance(v,dict) and v.get('ty')=='policy' and v.get('c')==101]
    ok(len(pe)==2,'policy events not duplicated by several browsers (%d)'%len(pe))
    dl=[k for d in DB.children('crmt').values() for k in d['data'].keys() if k.startswith('ta_101_deliv')]
    ok(len(dl)==1,'one delivery task (deterministic id)')
    # transient write errors -> retried
    pn.evaluate("(()=>{const d=CRM.db,od=d.doc;let n=2;d.doc=function(p){const r=od.call(d,p),u=r.update;r.update=async x=>{if(n>0){n--;const e=new Error('flaky network');e.code='unavailable';throw e}return u(x)};return r}})()")
    pn.evaluate("crmEv(102,'note',{t:'Retry me please.'})")
    ok(W(po,"crmEvents(102).some(e=>e.t==='Retry me please.')",25000),'write retried after transient errors and reached the team')
    # view-only member: writes rejected, shown as view only, nothing stored
    before=len(DB.docs);pv.evaluate("crmCreate({name:'Should Not Save',phone:'412-555-0999'})")
    ok(W(pv,"CRM.ro===1",15000),'view-only member flips to VIEW ONLY after the first refused save')
    time.sleep(1.5);ok(not any('Should Not Save' in json.dumps(d['data']) for d in DB.children('crmc').values()),'refused data never reaches the db')
    ok('VIEW ONLY' in pv.evaluate("crmSyncState()[1]"),'sync chip says VIEW ONLY')
    # budgets
    subs=[q.evaluate("__fake.subs") for q in (po,pa,pn)];crm=[k for k in DB.docs if k.startswith('crm')]
    big=max(len(json.dumps(DB.docs[k]['data'])) for k in crm)
    print('subscriptions per page',subs,'crm docs',len(crm),'largest doc bytes',big)
    ok(all(s<=64 for s in subs),'under the 64-subscription cap');ok(big<262144,'every doc under 256 KiB')
    ok(len(crm)<=64+64+1+16*2,'bounded doc count (%d)'%len(crm))
    print('errors:',[e for e in errs if 'flaky' not in e][:6]);ok(not [e for e in errs if 'flaky' not in e],'no console errors')
    b.close()
DB.stop()
print('live: %d passed, %d failed'%(R['pass'],R['fail']));sys.exit(1 if R['fail'] else 0)
