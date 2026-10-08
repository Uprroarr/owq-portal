"""Sidebar: Portfolio under Business Performance (Summary, Income, Expenses, Statement, Portfolio) for the owner. Base -> new base."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
B=os.environ.get('OWQ_BASE',SP+'/v88-final.html');O=os.environ.get('OWQ_OUT',SP+'/v89-final.html')
s=open(B,encoding='utf-8').read()
o="else if(NSUB[k]){const cur=k==='Leaderboard'?LBV:SUB[k]||NSUB[k][0];it=NSUB[k].map(x=>"
n="else if(NSUB[k]){const cur=k==='Leaderboard'?LBV:SUB[k]||NSUB[k][0];it=(k==='Business Performance'&&typeof pfOwnerNow==='function'&&pfOwnerNow()?NSUB[k].concat('Portfolio'):NSUB[k]).map(x=>"
assert s.count(o)==1;s=s.replace(o,n)
o="['Business Performance','Statement']].forEach(([k,s])=>L.push(['Go to '+k+': '+s,'Tab',()=>openTab(k,s)]));"
n="['Business Performance','Statement']].concat(typeof pfOwnerNow==='function'&&pfOwnerNow()?[['Business Performance','Portfolio']]:[]).forEach(([k,s])=>L.push(['Go to '+k+': '+s,'Tab',()=>openTab(k,s)]));"
assert s.count(o)==1;s=s.replace(o,n)
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
