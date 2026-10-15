"""v111: John Montini's veteran final expense call script inside the Clients CRM. A Call Script tab under Clients (and in the
sidebar), a Call script strip on every client record, a Call script button in Today's detail pane and a palette entry. The script
(agents/gs/gs_data.json, taken from his guide) is inlined as ASCII JSON; the module is agents/gs/gs.js.
Exact replacements with asserted counts on top of v110."""
import os, json
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get('OWQ_BASE', SP + '/v110-final.html')
OUT = os.environ.get('OWQ_OUT', SP + '/v111-final.html')
s = open(BASE, encoding='utf8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, (n, count, old[:80])
    s = s.replace(old, new)


assert '/*GSstart*/' not in s, 'already patched'
data = json.load(open(os.path.join(HERE, 'gs_data.json'), encoding='utf8'))
assert len(data['items']) == 37 and len(data['groups']) == 5
js = open(os.path.join(HERE, 'gs.js'), encoding='utf8').read()
assert js.count('__GS_DATA__') == 1
js = js.replace('__GS_DATA__', json.dumps(data, ensure_ascii=True, separators=(',', ':')).replace('</', '<\\/'))
assert '</script' not in js.lower()
rep('function crmCallNext(){', js + 'function crmCallNext(){')
# Clients > Call Script (tab bar, sidebar, header line, body)
rep("CRM_TABS=['Today','Pipeline','Client Book','Message Builder']", "CRM_TABS=['Today','Call Script','Pipeline','Client Book','Message Builder']")
rep("NSUB['Clients']=['Today','Pipeline','Client Book','Message Builder']", "NSUB['Clients']=['Today','Call Script','Pipeline','Client Book','Message Builder']")
rep("'Message Builder':'Pick a client and get a ready-to-send policy message.'}[sub]||''",
    "'Message Builder':'Pick a client and get a ready-to-send policy message.','Call Script':'John Montini\\u2019s veteran final expense script, one step at a time, filled in for the client you are calling.'}[sub]||''")
rep("return sub==='Pipeline'?crmVPipe():sub==='Client Book'?crmVBook():crmVToday()}",
    "return sub==='Call Script'?gsView():sub==='Pipeline'?crmVPipe():sub==='Client Book'?crmVBook():crmVToday()}")
# the way in from a client: the record (under the action buttons) and Today's detail pane
rep("${btn(`mbOpen(${c.id})`,'Write message','&#9998;')}</div>", "${btn(`mbOpen(${c.id})`,'Write message','&#9998;')}</div>${gsStrip(c)}")
rep("<button class=crm-ib onclick=\"crmOpen(${c.id})\">Open</button></div>",
    "<button class=crm-ib onclick=\"crmOpen(${c.id})\">Open</button><button class=\"crm-ib gs-pb\" onclick=\"gsOpen(${c.id})\">Call script</button></div>")
# command palette
rep("['Import leads','Clients',()=>{cid=null;openTab('Clients','Today');crmImport()}])}",
    "['Import leads','Clients',()=>{cid=null;openTab('Clients','Today');crmImport()}],['Open call script','Clients',()=>{cid=null;openTab('Clients','Call Script')}])}")
open(OUT, 'w', encoding='utf8').write(s)
print('wrote', OUT, len(s))
