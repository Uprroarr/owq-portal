"""v110: the money invested in the owner's portfolio (its cost basis: what was paid for what is held, fees included) counts
toward Total Income / revenue everywhere the portal adds it up (Business Performance, Command Deck, ticker, briefs), on the
owner's screen only (the portfolio is the owner's private document). Its own line in the Income tab and its own column in
the Statement, month by month (buys add their cost, sells take out the average cost of what was sold). Lead ROI (health
score, brief) stays on the agency's own income. Exact replacements with asserted counts on top of v109."""
import os
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
BASE = os.environ.get('OWQ_BASE', SP + '/v109-final.html')
OUT = os.environ.get('OWQ_OUT', SP + '/v110-final.html')
s = open(BASE, encoding='utf8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, (n, count, old[:80])
    s = s.replace(old, new)


assert '/*PVstart*/' not in s, 'already patched'
HELP = r"""/*PVstart*/
/* the owner's portfolio counts toward revenue: the money invested (cost basis of what is held) on the owner's own screen */
function pfInv(){try{if(typeof PF==='undefined'||!PF.ready||typeof pfOwnerNow!=='function'||!pfOwnerNow()||!PF.data||!(PF.data.tx||[]).length||typeof pfBook!=='function')return 0;return Math.max(0,+pfBook().cost||0)}catch(e){return 0}}
/* the same average-cost book keeping as the portfolio, as the change in money invested per month (they add up to the cost basis) */
function pfInvMonths(){const out={};try{if(!pfInv())return out;const H={};
  PF.data.tx.slice().sort((a,b)=>String(a.d||'').localeCompare(String(b.d||''))||(a.ts||0)-(b.ts||0)).forEach(x=>{const key=x.k+':'+x.sym,h=H[key]||(H[key]={q:0,cost:0}),q=+x.q||0,p=+x.px||0,f=+x.fee||0,c0=h.cost;
   if(x.t==='sell'){const avg=h.q>0?h.cost/h.q:0,qq=Math.min(q,h.q);h.cost-=avg*qq;h.q-=qq;if(h.q<1e-12){h.q=0;h.cost=0}}else{h.q+=q;h.cost+=q*p+f}
   const m=String(x.d||'').slice(0,7)||(x.ts?new Date(x.ts).toISOString().slice(0,7):'');if(m)out[m]=(out[m]||0)+(h.cost-c0)})}catch(e){}return out}
/* the money views (Business Performance, the Command Deck's Finance sparkline) also list the months with buys or sells */
function pfMs(ms){try{const k=Object.keys(pfInvMonths());return k.length?[...new Set(ms.concat(k))].sort():ms}catch(e){return ms}}
/*PVend*/
"""
rep("function S(){const p=D.policies,iss=p.filter(live),ex=D.expenses,cat=c=>sum(ex.filter(x=>x.cat===c),x=>x.amt),pr=sum(iss,com),oi=sum(D.income,x=>x.amt),rev=pr+oi;",
    HELP + "function S(){const p=D.policies,iss=p.filter(live),ex=D.expenses,cat=c=>sum(ex.filter(x=>x.cat===c),x=>x.amt),pr=sum(iss,com),oi=sum(D.income,x=>x.amt),pv=pfInv(),rev=pr+oi+pv;")
rep("rev,cb:sum(p.filter(x=>x.st==='Chargeback'),com)", "rev,pv,cb:sum(p.filter(x=>x.st==='Chargeback'),com)")
# months with portfolio buys or sells show up in the money views only (the agency's own charts keep their months)
rep("function bz(){const s=S(),t=SUB['Business Performance'],ms=months(),inc=", "function bz(){const s=S(),t=SUB['Business Performance'],ms=pfMs(months()),inc=")
# Command Deck: the Finance module's monthly income sparkline includes it too
rep("inc=k=>sum(s.iss.filter(x=>mon(x.d)===k),com)+sum(D.income.filter(x=>mon(x.d)===k),x=>x.amt),\nq=MYCL()",
    "pim=pfInvMonths(),inc=k=>sum(s.iss.filter(x=>mon(x.d)===k),com)+sum(D.income.filter(x=>mon(x.d)===k),x=>x.amt)+(pim[k]||0),\nq=MYCL()")
rep("spk(ms.map(inc)),'Business Performance')", "spk(pfMs(ms).map(inc)),'Business Performance')")
# lead ROI stays on what the agency earned (leads do not buy stocks): the health score's Lead ROI and the brief
rep("['Lead ROI',s.lead?cl01(s.rev/s.lead/3):0]", "['Lead ROI',s.lead?cl01((s.rev-(s.pv||0))/s.lead/3):0]")
rep("returned $${(s.rev/s.lead).toFixed(2)} in income.`", "returned $${((s.rev-(s.pv||0))/s.lead).toFixed(2)} in ${s.pv?'agency ':''}income.`")
# the assistant's answer names the invested part
rep("if(has('revenue|income'))return`Total income is ${$(s.rev)}: ${$(s.pr)} from policies and ${$(s.oi)} from other sources.`;",
    "if(has('revenue|income'))return`Total income is ${$(s.rev)}: ${$(s.pr)} from policies${s.pv?', ':' and '}${$(s.oi)} from other sources${s.pv?' and '+$(s.pv)+' invested in your portfolio':''}.`;")
# Business Performance: monthly rows carry the invested change at the end (index 7) and it is in the month's net
rep("rows=ms.map(k=>{const a=inc(k),o=oth(k),l=ex(k,'Leads'),tr=ex(k,'Training'),ot=ex(k)-l-tr;return[k,a,o,l,tr,ot,a+o-l-tr-ot]}),T=rows.reduce((a,r)=>a.map((v,i)=>i?v+r[i]:'Total'),['',0,0,0,0,0,0]),",
    "pim=pfInvMonths(),rows=ms.map(k=>{const a=inc(k),o=oth(k),l=ex(k,'Leads'),tr=ex(k,'Training'),ot=ex(k)-l-tr,iv=pim[k]||0;return[k,a,o,l,tr,ot,a+o+iv-l-tr-ot,iv]}),T=rows.reduce((a,r)=>a.map((v,i)=>i?v+r[i]:'Total'),['',0,0,0,0,0,0,0]),PV=s.pv>0||rows.some(r=>r[7]),")
rep("${kpi('Total Income',cu(s.rev,'$'),$(s.pr)+' policies + '+$(s.oi)+' other')}",
    "${kpi('Total Income',cu(s.rev,'$'),$(s.pr)+' policies + '+$(s.oi)+' other'+(s.pv?' + '+$(s.pv)+' invested':''))}")
rep("<div class=c><h4>Income vs. Expenses</h4>${gb(rows.map(r=>[r[0].slice(2),r[1]+r[2],r[3]+r[4]+r[5]]),['Income','Expenses'])}</div><div class=c><h4>Net Profit by Month</h4>${nb(rows.map(r=>[r[0].slice(2),r[6]]))}</div>",
    "<div class=c><h4>Income vs. Expenses</h4>${gb(rows.map(r=>[r[0].slice(2),r[1]+r[2]+r[7],r[3]+r[4]+r[5]]),['Income','Expenses'])}</div><div class=c><h4>Net Profit by Month</h4>${nb(rows.map(r=>[r[0].slice(2),r[6]]))}</div>")
rep("Income:`<div class=g>${kpi('Policy Commission',cu(s.pr,'$'),'Issued and paid policies')}${kpi('Other Income',cu(s.oi,'$'),D.income.length+' entries')}${kpi('Total Income',cu(s.rev,'$'))}</div><div class=g2 style=\"margin-top:14px\"><div class=c><h4>Income by Source</h4>${dn([['Policy Commission',s.pr],...grp(D.income,x=>x.src,x=>x.amt)].filter(r=>r[1]>0))}</div></div>`",
    "Income:`<div class=g>${kpi('Policy Commission',cu(s.pr,'$'),'Issued and paid policies')}${kpi('Other Income',cu(s.oi,'$'),D.income.length+' entries')}${s.pv?kpi('Portfolio Invested',cu(s.pv,'$'),'Cost basis of your holdings (Portfolio)'):''}${kpi('Total Income',cu(s.rev,'$'))}</div><div class=g2 style=\"margin-top:14px\"><div class=c><h4>Income by Source</h4>${dn([['Policy Commission',s.pr],...grp(D.income,x=>x.src,x=>x.amt),['Portfolio Invested',s.pv]].filter(r=>r[1]>0))}</div></div>`")
rep("Statement:`<div class=\"c sc\"><table><tr><th>Month<th class=n>Policy Commission<th class=n>Other Income<th class=n>Leads<th class=n>Training<th class=n>Other Costs<th class=n>Net</tr>${[...rows,T].map(r=>`<tr>${r.map((v,i)=>i?`<td class=\"n ${i==6?(v<0?'neg':'pos'):''}\">${$(v)}`:`<td><b>${v}</b>`).join('')}</tr>`).join('')||'<tr><td colspan=7 class=mut>No data yet.'}</table></div>`",
    "Statement:`<div class=\"c sc\"><table><tr><th>Month<th class=n>Policy Commission<th class=n>Other Income${PV?'<th class=n>Portfolio Invested':''}<th class=n>Leads<th class=n>Training<th class=n>Other Costs<th class=n>Net</tr>${[...rows,T].map(r=>`<tr>${(PV?[r[0],r[1],r[2],r[7],r[3],r[4],r[5],r[6]]:r.slice(0,7)).map((v,i,A)=>i?`<td class=\"n ${i==A.length-1?(v<0?'neg':'pos'):''}\">${$(v)}`:`<td style=\"white-space:nowrap\"><b>${v}</b>`).join('')}</tr>`).join('')||'<tr><td colspan=8 class=mut>No data yet.'}</table></div>`")
# the portfolio says so, and the money views catch up when the portfolio finishes loading
rep("${k('Cost Basis',pfM(b.cost),'What you paid for what you hold, fees included')}", "${k('Cost Basis',pfM(b.cost),'What you paid for what you hold, fees included &middot; counts toward Total Income')}")
rep("const first=!PF.ready;PF.ready=true;if(first)pfPaint();else pfSoon()},()=>{pfLocal()});",
    "const first=!PF.ready;PF.ready=true;if(first)pfPaint();else pfSoon();try{if(typeof tab!=='undefined'&&((tab==='Business Performance'&&SUB['Business Performance']!=='Portfolio')||tab==='Command Deck'))refreshQuiet()}catch(e){}},()=>{pfLocal()});")
open(OUT, 'w', encoding='utf8').write(s)
print('wrote', OUT, len(s))
