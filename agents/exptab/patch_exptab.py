"""Business Performance > Expenses: every expense type (per-category totals, all entries with a filter). Base -> new base."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';D=SP+'/agents/exptab'
B=os.environ.get('OWQ_BASE',SP+'/v91-final.html');O=os.environ.get('OWQ_OUT',SP+'/v92-final.html')
s=open(B,encoding='utf-8').read();assert '/*EXPTAB' not in s
o="""Expenses:`<div class=g>${kpi('Lead Spend',cu(s.lead,'$'),s.leadsN+' leads')}${kpi('Self-Investment',cu(s.self,'$'),'Training and coaching')}${kpi('Cost per Lead',cu(s.lead/s.leadsN,'$'))}</div><div class=g2 style="margin-top:14px"><div class=c><h4>Where the Money Goes</h4>${dn(grp(D.expenses,x=>x.cat,x=>x.amt))}</div><div class=c><h4>Cost per Lead by Month</h4>${lc(rows.map(r=>{const n=sum(D.expenses.filter(x=>mon(x.d)===r[0]),x=>x.leads||0);return[r[0].slice(2),n?r[3]/n:0]}))}</div></div>`+tbl('expenses',x=>[x.d,x.cat,$(x.amt),esc(x.n)]),"""
assert s.count(o)==1;s=s.replace(o,"Expenses:typeof bzExp==='function'?bzExp(s,rows):'',")
css=""".ext table td,.ext table th{white-space:nowrap}.ext .ex0 td{color:var(--mut)}.exc{background:none;border:0;color:var(--tx);font:inherit;cursor:pointer;padding:0;text-align:left}.exc:hover{color:#fff;text-decoration:underline}
.exbw{width:30%;min-width:90px}.exb{display:block;height:6px;background:#22222c}.exb b{display:block;height:100%;background:var(--red)}.extot td{border-top:1px solid var(--red)}
.exf{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}.exf button{background:#0f0f15;border:1px solid var(--ln);color:var(--mut);padding:5px 10px;font:700 10px Verdana,sans-serif;letter-spacing:.5px;cursor:pointer}.exf button.on{color:#fff;border-color:var(--red);background:#ff1f4f22}
.exmore{margin:10px 0 0}
"""
a='</style><canvas id=bgc>';assert s.count(a)==1;s=s.replace(a,css+a)
js=open(D+'/exptab.js',encoding='utf-8').read();assert all(ord(c)<128 for c in js+css)
s=s.rstrip('\n');assert s.endswith('</script>');s=s+'\n<script>\n'+js+'</script>\n'
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
