"""v115.2: any expense that is really a lead purchase counts as lead spend, whatever category the agent picked.
isLeadEx(x): category Leads, OR leads purchased > 0, OR the source / note / category names leads (lead, Lead Vault, aged,
real-time, mailers, direct mail). Training stays self-investment (never double counted). Used by S().lead (Production
Equation, Agency Performance, Command Deck), lead weeks, lead sources, the monthly statement and the expense table."""
import os
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
BASE = os.environ.get('OWQ_BASE', SP + '/v115.1-final.html')
OUT = os.environ.get('OWQ_OUT', SP + '/v115.2-final.html')
s = open(BASE, encoding='utf8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, count, old[:80]); s = s.replace(old, new)
assert 'function isLeadEx(' not in s, 'already patched'
rep("function eqWk(){const d=D.activity.map(x=>x.d).concat(D.expenses.filter(x=>x.cat==='Leads').map(x=>x.d))",
    "const LEADRX=/\\bleads?\\b|lead ?vault|\\baged\\b|real[- ]?time|\\bmailers?\\b|direct mail/i;\n"
    "function isLeadEx(x){if(!x)return false;if(x.cat==='Leads')return true;if(x.cat==='Training')return false;return (+x.leads||0)>0||LEADRX.test([x.cat||'',x.src||'',x.n||''].join(' '))}\n"
    "function eqWk(){const d=D.activity.map(x=>x.d).concat(D.expenses.filter(isLeadEx).map(x=>x.d))")
rep("D.expenses.filter(x=>x.cat==='Leads'&&x.src).map(x=>x.src)", "D.expenses.filter(x=>isLeadEx(x)&&x.src).map(x=>x.src)")
rep("D.expenses.filter(x=>x.cat==='Leads'&&x.src===n)", "D.expenses.filter(x=>isLeadEx(x)&&x.src===n)")
rep("lead:cat('Leads'),self:cat('Training')", "lead:sum(ex.filter(isLeadEx),x=>x.amt),self:cat('Training')")
rep("l=ex(k,'Leads'),tr=ex(k,'Training')", "l=sum(D.expenses.filter(x=>mon(x.d)===k&&isLeadEx(x)),x=>x.amt),tr=ex(k,'Training')")
rep("D.expenses.filter(x=>x.cat==='Leads').length+' lead expenses'", "D.expenses.filter(isLeadEx).length+' lead expenses'")
rep("lead:sum(ex.filter(x=>x.cat==='Leads'),x=>x.amt)", "lead:sum(ex.filter(isLeadEx),x=>x.amt)")
rep("<td>${esc(x.cat||'Other')}</td><td class=n>${$(x.amt)}</td><td class=n>${x.cat==='Leads'&&x.leads?x.leads:'-'}</td>",
    "<td>${esc(x.cat||'Other')}${x.cat!=='Leads'&&isLeadEx(x)?' <small class=mut title=\"Counted as lead spend\">&middot; counts as leads</small>':''}</td><td class=n>${$(x.amt)}</td><td class=n>${isLeadEx(x)&&x.leads?x.leads:'-'}</td>")
rep("Leads purchased (Leads category only)'", "Leads purchased (any lead buy counts as lead spend)'")
open(OUT, 'w', encoding='utf8').write(s); print('wrote', OUT, len(s))
