"""v115.1: Production Equation lead spend matches the expenses logged under Leads. The KPI shows the total from Leads
expenses (per-week as the note); weeks span activity AND lead-expense dates (shared by eqn, PA and the Command Deck peek)."""
import os
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
BASE = os.environ.get('OWQ_BASE', SP + '/v115-final.html')
OUT = os.environ.get('OWQ_OUT', SP + '/v115.1-final.html')
s = open(BASE, encoding='utf8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, count, old[:80]); s = s.replace(old, new)
assert 'function eqWk(' not in s, 'already patched'
OLDWK = "ds=D.activity.map(x=>x.d).sort(),wk=ds.length?Math.max(1,(new Date(ds[ds.length-1])-new Date(ds[0]))/6048e5+1):1,"
rep(OLDWK, "ds=D.activity.map(x=>x.d).sort(),wk=eqWk(),", 2)
rep("const PA=()=>{", "function eqWk(){const d=D.activity.map(x=>x.d).concat(D.expenses.filter(x=>x.cat==='Leads').map(x=>x.d)).filter(Boolean).sort();if(!d.length)return 1;return Math.max(1,((new Date(d[d.length-1])-new Date(d[0]))/864e5+1)/7)}\nconst PA=()=>{")
rep("${kpi('Lead Spend per Week',cu(lw,'$'))}",
    "${kpi('Lead Spend',cu(s.lead,'$'),$(lw)+'/week &middot; '+D.expenses.filter(x=>x.cat==='Leads').length+' lead expenses'+(s.leadsN?' &middot; '+s.leadsN.toLocaleString()+' leads':''))}")
rep("${bar('Lead spend',lw,lT,$(lw)+' / '+$(lT))}", "${bar('Leads/wk',lw,lT,$(lw)+' / '+$(lT))}")
rep("<span>Leads/wk <b>${apxK(pa.lw)}</b></span>", "<span>Lead spend <b>${apxK(s.lead)}</b></span>")
open(OUT, 'w', encoding='utf8').write(s); print('wrote', OUT, len(s))
