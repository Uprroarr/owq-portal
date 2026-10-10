"""Contacts and appointments made in the Clients book count toward the day: Morning Recognition goals (team and mine),
the Live Pulse and the check-in, next to the Activity log (per person the higher of the two, never both)."""
import sys, os, time, json, subprocess
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'; sys.path.insert(0, SP)
import lgx
from playwright.sync_api import sync_playwright
PORT = int(os.environ.get('PORT', 8831)); SITE = os.environ.get('SITE', SP + '/web/test/site_dayc'); URL = 'http://127.0.0.1:%d/index.html' % PORT
res = []
def ok(c, m, info=''): res.append(bool(c)); print(('PASS ' if c else 'FAIL ') + m + ('' if c else '  ' + str(info)[:400]), flush=True)
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=SITE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
ST = """(()=>{const t=mrToday(),me=mrMe(),p=pulseData(),k=ckAuto(),d=dayCounts(t,me);return {con:mrVal('con',t,''),app:mrVal('app',t,''),mc:mrVal('con',t,me),ma:mrVal('app',t,me),
  pc:p.con,pa:p.app,dial:k.dial,leads:k.leads,crmMine:d.crmCon,crmApp:d.crmApp}})()"""
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--no-sandbox', '--disable-webgl', '--no-proxy-server'])
        ctx = b.new_context(viewport={'width': 1280, 'height': 860}); ctx.add_init_script("try{localStorage.setItem('owq_gq','still')}catch(e){}")
        errs = []
        K = ctx.new_page(); K.goto('http://127.0.0.1:%d/keep.html' % PORT); K.wait_for_function('window.__FAKE')
        A = ctx.new_page(); A.on('pageerror', lambda e: errs.append(str(e)[:200]))
        A.add_init_script("window.__FAKE_SIGNIN=%s;" % json.dumps({'uid': 'uOwner', 'email': 'owner@example.com', 'displayName': 'Cole Leckey'}))
        A.goto(URL); A.wait_for_function("window.__FAKE", timeout=20000); A.evaluate("__FAKE.call('reset',{owner:'owner@example.com'})"); A.evaluate("sessionStorage.clear()"); A.reload()
        A.wait_for_function("OWQC.phase==='out'", timeout=30000); A.click('#owqgi'); A.wait_for_function("OWQC.phase==='in'", timeout=30000)
        lgx.login(A, 2); A.wait_for_timeout(1200)
        A.wait_for_function("typeof MR!=='undefined'&&MR.ready&&typeof CRM!=='undefined'&&CRM.ready", timeout=30000)
        ok(A.evaluate("crmOn()"), 'the Clients book is on', A.evaluate("CRM.why||''"))
        ok(A.evaluate("dcName('Agency Owner')") == 'Cole Leckey' and A.evaluate("dcName('Nate Johnson')") == 'Nate Johnson', 'the owner login counts as Cole')
        A.evaluate("D.activity=(D.activity||[]).filter(a=>a.d!==mrToday());save()")
        s0 = A.evaluate(ST); print('start', s0, flush=True)
        # 1. a new contact through the New lead form
        A.evaluate("openTab('Clients')"); A.wait_for_timeout(800)
        A.evaluate("crmNewLead()"); A.wait_for_timeout(300)
        A.fill('#crmn_name', 'Dana Whitfield'); A.fill('#crmn_phone', '412-555-0142')
        A.evaluate("crmNewSave(1)"); A.wait_for_timeout(1500)
        s1 = A.evaluate(ST)
        ok(s1['con'] == s0['con'] + 1 and s1['mc'] == s0['mc'] + 1, 'a new contact added in Clients counts for the team and for me', [s0, s1])
        # 2. book an appointment with them
        cid = A.evaluate("(()=>{const c=crmAll().find(x=>x.name==='Dana Whitfield');return c?c.id:null})()")
        ok(cid is not None, 'the new contact is in the Clients book', cid)
        A.evaluate("id=>crmSchedule(id,'appt')", cid); A.wait_for_timeout(300); A.evaluate("crmSchGo(Date.now()+2*864e5)"); A.wait_for_timeout(1500)
        s2 = A.evaluate(ST)
        ok(s2['app'] == s1['app'] + 1 and s2['ma'] == s1['ma'] + 1, 'booking an appointment in Clients counts as an appointment', [s1, s2])
        ok(s2['con'] == s1['con'], 'the booking call with the same person is still one contact', [s1, s2])
        ok(s2['pc'] == s2['con'] and s2['pa'] == s2['app'], 'the Live Pulse shows the same contacts and appointments', s2)
        ok(s2['dial'] == s2['mc'] and s2['leads'] == s2['ma'], 'the check-in fills in my contacts and appointments', s2)
        # 3. a call to an older contact counts as a contact today
        oid = A.evaluate("(()=>{const c=crmCreate({name:'Rhea Older',phone:'412-555-0177'});crmPut(c.id,{at:Date.now()-3*864e5});return c.id})()"); A.wait_for_timeout(600)
        s3a = A.evaluate(ST)
        ok(s3a['con'] == s2['con'], 'a contact created on an earlier day does not count today', [s2, s3a])
        A.evaluate("id=>crmOutcome(id,'vm')", oid); A.wait_for_timeout(800)
        s3 = A.evaluate(ST)
        ok(s3['con'] == s2['con'] + 1, 'a call logged today to an older contact counts as a contact', [s2, s3])
        A.evaluate("id=>crmEv(id,'text',{t:'Following up'})", oid); A.wait_for_timeout(800)
        ok(A.evaluate(ST)['con'] == s3['con'], 'a second touch with the same person the same day is still one contact')
        # 4. imports and notes do not count
        A.evaluate("['Imp One','Imp Two','Imp Three'].forEach((n,i)=>crmCreate({name:n,phone:'412-555-019'+i,src:'Aged Leads'},{ev:'import',note:'Imported'}))"); A.wait_for_timeout(800)
        A.evaluate("id=>crmEv(id,'note',{t:'Just a note'})", cid); A.wait_for_timeout(500)
        s4 = A.evaluate(ST)
        ok(s4['con'] == s3['con'], 'imported leads and notes do not count as contacts', [s3, s4])
        # 5. a cancelled appointment drops out
        tid = A.evaluate("id=>{const t=crmOpenTasks(id).find(x=>x.ty==='appt');return t?t.id:null}", cid)
        ok(tid is not None, 'the appointment is on the task list', tid)
        A.evaluate("tid=>crmTaskX(tid)", tid); A.wait_for_timeout(800)
        s5 = A.evaluate(ST)
        ok(s5['app'] == s4['app'] - 1, 'cancelling the appointment takes it back off the count', [s4, s5])
        A.evaluate("id=>{crmSchedule(id,'appt')}", cid); A.wait_for_timeout(300); A.evaluate("crmSchGo(Date.now()+3*864e5)"); A.wait_for_timeout(1200)
        s5b = A.evaluate(ST); ok(s5b['app'] == s4['app'], 'booking it again counts again', [s4, s5b])
        # 6. the Activity log: per person the higher of the two sources
        A.evaluate("D.activity.push({d:mrToday(),ag:mrMe(),h:1,con:10,app:0});save()"); A.wait_for_timeout(400)
        s6 = A.evaluate(ST)
        ok(s6['mc'] == max(10, s5b['crmMine']) and s6['con'] == s5b['con'] - s5b['mc'] + max(10, s5b['crmMine']), 'a bigger Activity total wins, without adding the Clients count on top', [s5b, s6])
        ok(s6['ma'] == s5b['ma'], 'appointments keep the Clients count when Activity logged none', [s5b, s6])
        A.evaluate("D.activity.push({d:mrToday(),ag:'Nate Johnson',h:1,con:4,app:2});save()"); A.wait_for_timeout(400)
        s7 = A.evaluate(ST)
        ok(s7['con'] == s6['con'] + 4 and s7['app'] == s6['app'] + 2 and s7['mc'] == s6['mc'], "a teammate's Activity adds to the team only", [s6, s7])
        # 7. goal progress on a recognition, and the pinned cards refresh when the Clients book changes
        pr = A.evaluate("(()=>mrProg({day:mrToday(),goals:[{m:'con',t:3},{m:'app',t:1}]}).map(p=>[p.m,p.v,p.mine,p.hit]))()")
        ok(pr[0][1] == s7['con'] and pr[1][1] == s7['app'] and pr[0][2] == s7['mc'], 'Morning Recognition goal bars use the merged numbers', [pr, s7])
        A.evaluate("(()=>{window.__mrc=0;const f=mrRefresh;mrRefresh=function(){window.__mrc++;return f.apply(this,arguments)}})()")
        A.evaluate("crmCreate({name:'Lee Fresh',phone:'412-555-0155'})"); A.wait_for_timeout(1500)
        ok(A.evaluate("window.__mrc") >= 1, 'a change in the Clients book refreshes the Morning Recognition cards', A.evaluate("window.__mrc"))
        # 8. other people's Clients work counts for them
        A.evaluate("(()=>{const c=crmCreate({name:'Nate Lead',phone:'412-555-0166',owner:'Nate Johnson'});crmPut(c.id,{by:'Nate Johnson'})})()"); A.wait_for_timeout(800)
        s8 = A.evaluate(ST); n8 = A.evaluate("dayCounts(mrToday(),'Nate Johnson')")
        ok(n8['crmCon'] == 1 and n8['con'] == 4, "a teammate's Clients contact counts for them (their Activity 4 still the higher)", n8)
        if os.environ.get('SHOTS', '1') == '1':
            A.evaluate("openTab('Command Deck')"); A.wait_for_timeout(1500); A.screenshot(path=SP + '/web/test/shots/dayc_deck.png')
        ok(not errs, 'no page errors', errs)
        b.close()
finally:
    srv.terminate()
print('%d/%d' % (sum(res), len(res)))
