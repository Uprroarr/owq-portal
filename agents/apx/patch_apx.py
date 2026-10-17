"""v114: Business Performance moves into Agency Performance (Overview, Sales tabs, Money tabs), editable policies / expenses /
income / activity, and the simpler Command Deck with sneak peeks. Module agents/apx/apx.js. Exact replacements with asserted
counts on top of v112 (v113 was the website-only guest pass)."""
import os
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get('OWQ_BASE', SP + '/v112-final.html')
OUT = os.environ.get('OWQ_OUT', SP + '/v114-final.html')
s = open(BASE, encoding='utf8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, (n, count, old[:80])
    s = s.replace(old, new)


assert '/*APXstart*/' not in s, 'already patched'
js = open(os.path.join(HERE, 'apx.js'), encoding='utf8').read()
assert all(ord(c) < 128 for c in js), 'apx.js must be ASCII'
# the module (same script as the page map, so the new ag() and ov() are the ones it holds); the old ones keep a new name
rep('function crmCallNext(){', js + 'function crmCallNext(){')
rep("function ag(){const s=S(),t=SUB['Agency Performance'],ms=months(),fn=", "function agClassic(){const s=S(),t=SUB['Agency Performance'],ms=months(),fn=")
rep("function ov(){const s=S(),m=sum(s.iss.filter(x=>mon(x.d)===cmk),x=>x.ap),pa=PA(),", "function ovClassic(){const s=S(),m=sum(s.iss.filter(x=>mon(x.d)===cmk),x=>x.ap),pa=PA(),")
# one section: Business Performance leaves the page map and the sidebar; its addresses redirect
rep("'Business Performance':[bz,'&#9670;','BUSINESS','Income, expenses, profit'],", "")
rep("'Agency Performance':[ag,'&#9650;','SALES','Policies and agents']", "'Agency Performance':[ag,'&#9650;','SALES','Sales, money and agents']")
rep("const SUB={'Agency Performance':'Summary',", "const SUB={'Agency Performance':'Overview',")
rep("const NSUB={'Agency Performance':['Summary','Policies','Agents','Time Report'],'Business Performance':['Summary','Income','Expenses','Statement'],",
    "const NSUB={'Agency Performance':['Overview','Policies','Agents','Time Report','Income','Expenses','Statement'],")
rep("it=(k==='Business Performance'&&typeof pfOwnerNow==='function'&&pfOwnerNow()?NSUB[k].concat('Portfolio'):NSUB[k])",
    "it=(k==='Agency Performance'&&typeof pfOwnerNow==='function'&&pfOwnerNow()?NSUB[k].concat('Portfolio'):NSUB[k])")
rep("const openTab=(k,s)=>{tab=k;if(s){", "const openTab=(k,s)=>{if(k==='Business Performance'){k='Agency Performance';s=APX_FROM_BP[s||SUB['Business Performance']]||'Overview'}tab=k;if(s){")
rep("function go(){navRender();", "function go(){apxNorm();navRender();")
rep("[['Agency Performance','Policies'],['Agency Performance','Agents'],['Business Performance','Income'],['Business Performance','Expenses'],['Business Performance','Statement']].concat(typeof pfOwnerNow==='function'&&pfOwnerNow()?[['Business Performance','Portfolio']]:[])",
    "[['Agency Performance','Overview'],['Agency Performance','Policies'],['Agency Performance','Agents'],['Agency Performance','Time Report'],['Agency Performance','Income'],['Agency Performance','Expenses'],['Agency Performance','Statement']].concat(typeof pfOwnerNow==='function'&&pfOwnerNow()?[['Agency Performance','Portfolio']]:[])")
# the Portfolio now lives at Agency Performance > Portfolio
rep("function pfShown(){return typeof tab!=='undefined'&&tab==='Business Performance'&&SUB['Business Performance']==='Portfolio'}",
    "function pfShown(){return typeof tab!=='undefined'&&((tab==='Business Performance'&&SUB['Business Performance']==='Portfolio')||(tab==='Agency Performance'&&SUB['Agency Performance']==='Portfolio'))}")
rep("if(!own){PF.ready=true;return}try{if(typeof tab!=='undefined'&&tab==='Business Performance')go()}catch(e){}",
    "if(!own){PF.ready=true;return}try{if(typeof tab!=='undefined'&&(tab==='Business Performance'||tab==='Agency Performance'))go()}catch(e){}")
rep("((tab==='Business Performance'&&SUB['Business Performance']!=='Portfolio')||tab==='Command Deck')",
    "((tab==='Business Performance'&&SUB['Business Performance']!=='Portfolio')||(tab==='Agency Performance'&&SUB['Agency Performance']!=='Portfolio')||tab==='Command Deck')")
# edit buttons beside delete: policies list, expense list, recent-entries tables
rep("<td><button class=x title=\"Delete policy\" onclick=\"ask('Delete this policy?',()=>del('policies',${i}))\">&times;</button></tr>",
    "<td class=apx-ra>${apxEB('policies',i)}<button class=x title=\"Delete policy\" onclick=\"ask('Delete this policy?',()=>del('policies',${i}))\">&times;</button></tr>")
rep("<td><button class=x title=\"Delete entry\" onclick=\"del('expenses',${i})\">&times;</button></td></tr>",
    "<td class=apx-ra>${apxEB('expenses',i)}<button class=x title=\"Delete entry\" onclick=\"ask('Delete this expense?',()=>del('expenses',${i}))\">&times;</button></td></tr>")
rep("<td><button class=x title=\"Delete entry\" onclick=\"del('${k}',${i})\">&times;</button></tr>",
    "<td class=apx-ra>${typeof APX_EF!=='undefined'&&APX_EF[k]?apxEB(k,i):''}<button class=x title=\"Delete entry\" onclick=\"del('${k}',${i})\">&times;</button></tr>")
# each agent's submitted premium that is not issued yet: scorecard column, agent report card, Overview top producers
rep("goal:g?g.goal:0}}).sort((a,b)=>b.iap-a.iap)}", "goal:g?g.goal:0,pnd:sum(ps.filter(x=>x.st==='Submitted'),x=>x.ap),pn:ps.filter(x=>x.st==='Submitted').length}}).sort((a,b)=>b.iap-a.iap)}")
rep("<th class=n>Issued<th class=n>Policies<th class=n>Placement", "<th class=n>Issued<th class=n>Submitted, not issued<th class=n>Policies<th class=n>Placement")
rep("<td class=n>${$(r.iap)}<td class=n>${r.ni}/${r.n}", "<td class=n>${$(r.iap)}<td class=n>${r.pnd?$(r.pnd)+' <small class=mut>('+r.pn+')</small>':'-'}<td class=n>${r.ni}/${r.n}")
rep("<div class=g>${kpi('Issued Premium',cu(iap,'$'),is.length+' policies')}${kpi('Commission Earned'",
    "<div class=g>${kpi('Issued Premium',cu(iap,'$'),is.length+' policies')}${kpi('Submitted, Not Issued',cu(sum(ps.filter(p=>p.st==='Submitted'),x=>x.ap),'$'),ps.filter(p=>p.st==='Submitted').length+' waiting &middot; '+$(pend)+' commission')}${kpi('Commission Earned'")
open(OUT, 'w', encoding='utf8').write(s)
print('wrote', OUT, len(s))
