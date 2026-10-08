"""CHAT quick view + rail tabs + bell badge.
Part 1 (local mode, one page): tab switching/persistence, badge arithmetic, composer (Enter / Shift+Enter / empty / max length),
emoji + mention picker, channel switch, read-only and logged-out states, no duplicate listeners after many cycles, rail width.
Part 2 (live, two contexts over the fake shared db): rail -> Team Chat and Team Chat -> rail, no duplicates, shared read state,
no alert for a message you are looking at, tab pulse + dedup'd bell for others, scroll anchor + focus/draft kept while messages arrive."""
import sys,os,json,time
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import qvt,fakedb,lgx
from playwright.sync_api import sync_playwright
url='file://'+qvt.BUILD
R=[];errs=[]
def ok(name,cond,info=''):
    R.append((name,bool(cond)));print(('PASS ' if cond else 'FAIL ')+name+(' | '+str(info)[:300] if info else ''),flush=True)
def W(pg,js,t=8000):
    try:pg.wait_for_function(js,timeout=t);return True
    except Exception:return False
# count window/document/visualViewport listeners (the quick view must not add more on every open/close)
LCOUNT="""(()=>{window.__lc={n:0};const o=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(t,f,c){try{if(this===window||this===document||this===window.visualViewport)window.__lc.n++}catch(e){}return o.call(this,t,f,c)}})()"""
with sync_playwright() as p:
    b=qvt.launch(p)
    # ---------------- part 1: local ----------------
    ctx=qvt.context(b,1440,900,init=[LCOUNT]);pg=qvt.page(ctx,errs,'L: ')
    qvt.open_login(pg,url,6)
    c=pg.evaluate("qvCounts()")
    ok('chat unread = 3 (General 2 incl. 1 mention, Lead Flow 1)',c['ch']==3 and c['men']==1 and c['per']['General']==[2,1] and c['per']['Lead Flow']==[1,0],c)
    ok('bell = unread alerts + unread chat',pg.evaluate("+document.querySelector('#bell b').textContent")==c['al']+c['ch'],(pg.evaluate("document.querySelector('#bell b').textContent"),c))
    ok('bell label says what the number is made of',pg.evaluate("/unread alert/.test(document.getElementById('bell').getAttribute('aria-label'))&&/3 unread chat messages \\(1 mentioning you\\)/.test(document.getElementById('bell').getAttribute('aria-label'))"),pg.evaluate("document.getElementById('bell').getAttribute('aria-label')"))
    ok('mention shown in gold on the CHAT tab and the bell',pg.evaluate("!!document.querySelector('#qvT_chat .qv-n.men')&&document.querySelector('#bell b').classList.contains('qv-men')"))
    ok('ALERTS tab keeps the original alert list and filters',pg.evaluate("QV.tab==='alerts'&&!!document.querySelector('#rail .rc .chip')&&!!document.querySelector('#rail .rl')&&!!document.querySelector('#rail .rf')"))
    pg.click('#qvT_chat');pg.wait_for_timeout(500)
    ok('CHAT tab renders the selected channel',pg.evaluate("QV.tab==='chat'&&document.querySelectorAll('#qvCL .qv-m').length===7&&document.getElementById('qvT_chat').getAttribute('aria-selected')==='true'"))
    ok('viewing #General marks it read (shared with Team Chat)',pg.evaluate("chUn('General')===0&&qvCounts().ch===1"))
    ok('Team Chat nav badge follows the shared read state',pg.evaluate("(()=>{const e=[...document.querySelectorAll('#nav .nv')].find(x=>/team chat/i.test(x.innerText));return e&&e.querySelector('.nb')&&e.querySelector('.nb').textContent==='1'})()"))
    ok('link, mention, reactions rendered',pg.evaluate("!!document.querySelector('#qvCL a[href=\"https://agents.example.com/status\"]')&&!!document.querySelector('#qvCL .qv-m.men .tmn.me')&&document.querySelectorAll('#qvCL .qv-rx').length===2"))
    pg.click("#qvChs button:has-text('Wins')");pg.wait_for_timeout(300)
    ok('win card and sticker render readably',pg.evaluate("!!document.querySelector('#qvCL .wcard')&&!!document.querySelector('#qvCL .stk')"))
    pg.click("#qvChs button:has-text('Lead Flow')");pg.wait_for_timeout(300)
    ok('poll renders with votes',pg.evaluate("document.querySelectorAll('#qvCL .poll .po').length===3"))
    ok('channel switch persisted',pg.evaluate("JSON.parse(localStorage.getItem('owq_qv')).ch==='Lead Flow'"))
    n0=pg.evaluate("chIn('Lead Flow').length")
    pg.click('#qvCI');pg.keyboard.type('   ');pg.keyboard.press('Enter');pg.wait_for_timeout(200)
    ok('empty message ignored',pg.evaluate("chIn('Lead Flow').length")==n0)
    pg.keyboard.press('Control+A');pg.keyboard.type('Line one');pg.keyboard.press('Shift+Enter');pg.keyboard.type('line two');pg.wait_for_timeout(100)
    ok('Shift+Enter makes a new line and does not send',pg.evaluate("document.getElementById('qvCI').value==='Line one\\nline two'")and pg.evaluate("chIn('Lead Flow').length")==n0)
    pg.keyboard.press('Enter');pg.wait_for_timeout(300)
    ok('Enter sends once, box clears, focus stays',pg.evaluate("chIn('Lead Flow').length")==n0+1 and pg.evaluate("chIn('Lead Flow').slice(-1)[0].text==='Line one\\nline two'&&document.getElementById('qvCI').value===''&&document.activeElement.id==='qvCI'"))
    pg.evaluate("(()=>{const i=document.getElementById('qvCI');i.value='x'.repeat(650);i.dispatchEvent(new Event('input'))})()")
    ok('max length 500 (counter shown)',pg.evaluate("document.getElementById('qvCI').value.length===500&&/0 characters left/.test(document.getElementById('qvCnt').textContent)"))
    pg.keyboard.press('Enter');pg.wait_for_timeout(300)
    ok('long message stored at 500 chars',pg.evaluate("chIn('Lead Flow').slice(-1)[0].text.length===500"))
    pg.click('#qvEB');pg.click('.qv-emo button >> nth=2');pg.keyboard.type(' @Na');pg.wait_for_timeout(150)
    ok('emoji inserted and mention picker offers Nate',pg.evaluate("document.getElementById('qvCI').value.indexOf('\\u{1F525}')===0&&/Nate Johnson/.test(document.getElementById('qvMN').innerText)"))
    pg.keyboard.press('Enter');pg.wait_for_timeout(100)
    ok('Enter picks the mention instead of sending',pg.evaluate("/@Nate $/.test(document.getElementById('qvCI').value)")and pg.evaluate("chIn('Lead Flow').length")==n0+2)
    pg.keyboard.press('Escape');pg.wait_for_timeout(100)
    ok('Esc in the composer keeps the rail open (picker closed first)',pg.evaluate("RAIL===true"))
    pg.evaluate("qvTab('floor')");pg.wait_for_timeout(200);pg.evaluate("qvTab('chat')");pg.wait_for_timeout(300)
    ok('draft survives tab switches',pg.evaluate("/@Nate $/.test(document.getElementById('qvCI').value)"))
    # Team Chat -> rail
    pg.evaluate("openTab('Team Chat');chGo('Lead Flow')");pg.wait_for_timeout(300)
    pg.evaluate("document.getElementById('chi').value='Posted from the full Team Chat page';chSend()");pg.wait_for_timeout(400)
    ok('a message sent in Team Chat appears in the rail at once',pg.evaluate("document.getElementById('qvCL').innerText.indexOf('Posted from the full Team Chat page')>=0"))
    ok('and in Team Chat itself, once',pg.evaluate("chIn('Lead Flow').filter(m=>m.text==='Posted from the full Team Chat page').length===1&&document.getElementById('chl').innerText.split('Posted from the full Team Chat page').length===2"))
    pg.evaluate("openTab('Command Deck')")
    # read-only
    pg.evaluate("CH.canW=false;qvRebuildChat()");pg.wait_for_timeout(200)
    ok('view-only: composer disabled with an explanation',pg.evaluate("document.getElementById('qvCI').disabled&&/View only/.test(document.getElementById('qvCI').placeholder)"))
    n1=pg.evaluate("chAll().length");pg.evaluate("qvSend()")
    ok('view-only: nothing is posted',pg.evaluate("chAll().length")==n1)
    pg.evaluate("CH.canW=true;qvRebuildChat()")
    # persistence across reload + tab restore
    pg.evaluate("qvTab('floor')");pg.reload();pg.wait_for_timeout(2200);lgx.login(pg,6);pg.wait_for_timeout(1200)
    ok('last tab remembered on this device',pg.evaluate("QV.tab==='floor'&&document.getElementById('qvT_floor').classList.contains('on')&&!!document.querySelector('#qvRP .qv-fb')"))
    # listeners / cycles
    pg.wait_for_timeout(500);l0=pg.evaluate("window.__lc.n")
    pg.evaluate("""(()=>{for(let i=0;i<30;i++){toggleRail(false);toggleRail(true);qvTab(['alerts','chat','floor'][i%3]);qvPop(i%2?'chat':'floor');qvFloatView(i%2?'floor':'chat');qvFloatClose()}})()""");pg.wait_for_timeout(600)
    l1=pg.evaluate("window.__lc.n")
    ok('no new window/document listeners after 30 open/close/pop cycles',l1==l0,(l0,l1))
    ok('one float at most, no stray videos',pg.evaluate("document.querySelectorAll('#qvF').length===0&&QV.vs.size===0"))
    ok('rail width animates (transition on width)',pg.evaluate("getComputedStyle(document.getElementById('rail')).transitionProperty.indexOf('width')>=0"))
    # logged out
    pg.evaluate("qvPop('chat')");pg.wait_for_timeout(200);pg.evaluate("lockView()");pg.wait_for_timeout(800)
    ok('lock: window removed, rail closed, no tabs shown',pg.evaluate("!document.getElementById('qvF')&&RAIL===false&&!document.querySelector('#rail.on')"))
    ctx.close()
    # ---------------- part 2: live (fake shared db) ----------------
    DB=fakedb.FakeDB().start();now=int(time.time()*1000)
    hist=[('General','Austin Vardzel','Morning team. Weekly goals are on the leaderboard.',90),('General','Cole Leckey','Mention the state benefit letter first.',60),('Wins','John Montini','Closed a final expense policy, $1,840 AP!',40)]
    for i,(ch,who,t,mins) in enumerate(hist):DB.set('chat/seed%d'%i,{'ch':ch,'who':who,'text':t,'at':now-mins*60000,'rx':{}})
    def mk(cid,idx):
        cx=qvt.context(b,1366,860,init=[fakedb.client_js(DB.port,cid)]);pgx=qvt.page(cx,errs,cid+': ');qvt.open_login(pgx,url,idx,seed=False);return cx,pgx
    cx,X=mk('X',6);cy,Y=mk('Y',1)
    W(X,"CH.live===true");W(Y,"CH.live===true")
    X.evaluate("QV.ch='General';qvTab('chat')");X.wait_for_timeout(500)
    Y.evaluate("openTab('Team Chat');chGo('General')");Y.wait_for_timeout(300)
    s0=X.evaluate("window.__fake.subs");a0=X.evaluate("AL().length")
    Y.evaluate("document.getElementById('chi').value='Heading to the floor for the 2:00 huddle';chSend()")
    ok('live: Team Chat (other person) -> rail',W(X,"document.getElementById('qvCL').innerText.indexOf('2:00 huddle')>=0"))
    X.wait_for_timeout(400)
    ok('live: no alert for a message you are looking at in the rail',X.evaluate("AL().length")==a0 and X.evaluate("!AL().some(a=>/Team Chat/.test(a.t))"))
    ok('live: it is marked read right away',X.evaluate("chUn('General')===0"))
    X.click('#qvCI');X.keyboard.type('See you there, bringing the new rebuttals');X.keyboard.press('Enter')
    ok('live: rail -> Team Chat (other person)',W(Y,"document.getElementById('chl').innerText.indexOf('bringing the new rebuttals')>=0"))
    Y.wait_for_timeout(500)
    ok('live: exactly one copy in the shared db',len([d for d in DB.children('chat').values() if d['data'].get('text')=='See you there, bringing the new rebuttals'])==1)
    ok('live: no extra subscriptions',X.evaluate("window.__fake.subs")==s0,(s0,X.evaluate("window.__fake.subs")))
    # other channel while X looks at General: pulse once, unread on Wins, bell +1 (alert and message counted once)
    X.evaluate("""(()=>{window.__pulse=0;const o=qvPulseChat;qvPulseChat=function(){window.__pulse++;window.__pcls=!!document.getElementById('qvT_chat');return o.apply(this,arguments)}})()""")
    X.evaluate("qvTab('alerts')");X.wait_for_timeout(300)
    bell0=X.evaluate("+((document.querySelector('#bell b')||{}).textContent||0)")
    Y.evaluate("chGo('Wins');document.getElementById('chi').value='Issued! $2,300 IUL with Americo';chSend()")
    ok('live: CHAT tab pulses once for a new message on another tab',W(X,"window.__pulse===1")and X.evaluate("window.__pulse")==1)
    X.wait_for_timeout(600)
    bell1=X.evaluate("+((document.querySelector('#bell b')||{}).textContent||0)")
    ok('live: bell +1 (the chat alert and its message count once)',bell1==bell0+1 and X.evaluate("AL().some(a=>a.k&&a.k.indexOf('cm-')===0&&!a.rd)"),(bell0,bell1))
    X.evaluate("qvTab('chat')");X.wait_for_timeout(400)
    ok('live: Wins unread shows in the channel bar after opening CHAT',X.evaluate("chUn('Wins')>=1&&((Array.from(document.querySelectorAll('#qvChs button')).find(b=>/# Wins/.test(b.textContent))||{querySelector:()=>null}).querySelector('.qv-n')||{}).textContent===String(chUn('Wins'))"),X.evaluate("[chUn('Wins'),document.getElementById('qvChs').innerText]"))
    # scroll anchor + focus while messages arrive
    for i in range(14):DB.set('chat/bulk%02d'%i,{'ch':'General','who':'Nate Johnson','text':'Dial block update %d: %d contacts, %d appointments set.'%(i+1,20+i,i%4),'at':now-30*60000+i*60000,'rx':{}})
    W(X,"document.querySelectorAll('#qvCL .qv-m').length>=18")
    X.evaluate("document.getElementById('qvCL').scrollTop=0");X.wait_for_timeout(200)
    X.click('#qvCI');X.keyboard.type('Draft I am still typing');X.evaluate("(()=>{const i=document.getElementById('qvCI');i.setSelectionRange(5,5)})()")
    y0=X.evaluate("document.getElementById('qvCL').scrollTop")
    Y.evaluate("chGo('General');document.getElementById('chi').value='Two more appointments on the books';chSend()");Y.wait_for_timeout(300)
    Y.evaluate("document.getElementById('chi').value='Make that three';chSend()")
    W(X,"document.getElementById('qvCL').innerText.indexOf('Make that three')>=0")
    X.wait_for_timeout(300)
    st=X.evaluate("[document.getElementById('qvCL').scrollTop,document.activeElement.id,document.getElementById('qvCI').value,document.getElementById('qvCI').selectionStart,!document.getElementById('qvJump').hidden,document.getElementById('qvJn').textContent]")
    ok('live: scroll position kept while reading history',abs(st[0]-y0)<2,(y0,st))
    ok('live: focus, draft and caret kept while messages arrive',st[1]=='qvCI' and st[2]=='Draft I am still typing' and st[3]==5,st)
    ok('live: jump-to-latest pill counts the new messages',st[4] and st[5]=='2 new',st)
    X.click('#qvJump');X.wait_for_timeout(300)
    ok('live: jump scrolls to the newest message and marks it read',X.evaluate("(()=>{const l=document.getElementById('qvCL');return l.scrollHeight-l.scrollTop-l.clientHeight<4&&chUn('General')===0&&document.getElementById('qvJump').hidden})()"))
    cx.close();cy.close();DB.stop()
    b.close()
bad=[e for e in errs]
ok('no page errors',not bad,bad[:6])
n=sum(1 for _,c in R if c);print('RESULT %d/%d passed'%(n,len(R)))
sys.exit(0 if n==len(R) else 1)
