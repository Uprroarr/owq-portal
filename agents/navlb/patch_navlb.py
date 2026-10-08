"""Sidebar: Leaderboard moves into TEAM under Check-In. Agency Performance: 'Submitted Premium' card is now 'Annualized Premium'. Base -> new base."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
B=os.environ.get('OWQ_BASE',SP+'/v90-final.html');O=os.environ.get('OWQ_OUT',SP+'/v91-final.html')
s=open(B,encoding='utf-8').read()
def rep(o,n):
    global s
    assert s.count(o)==1,(s.count(o),o[:80]);s=s.replace(o,n)
rep("'Leaderboard':[lb,'&#9733;','SALES','Rankings and awards'],","")
rep("'Check-In':[checkin,'&#9745;','TEAM','Daily check-ins to admin'],","'Check-In':[checkin,'&#9745;','TEAM','Daily check-ins to admin'],'Leaderboard':[lb,'&#9733;','TEAM','Rankings and awards'],")
rep("${kpi('Submitted Premium',cu(s.sub,'$'),s.p.length+' applications')}","${kpi('Annualized Premium',cu(s.sub,'$'),s.p.length+' applications')}")
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
