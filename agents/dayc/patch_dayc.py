"""v108: contacts and appointments made in the Clients book count toward the day (Morning Recognition goals, the Live
Pulse, the check-in) alongside the Activity log. Exact replacements with asserted counts on top of v107."""
import os
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get('OWQ_BASE', SP + '/v107-final.html')
OUT = os.environ.get('OWQ_OUT', SP + '/v108-final.html')
s = open(BASE, encoding='utf8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, (n, count, old[:80])
    s = s.replace(old, new)


assert '/*DCstart*/' not in s, 'already patched'
# the module, inside the main app script just after the Clients book code it reads
rep('function crmCallNext(){', open(os.path.join(HERE, 'dayc.js'), encoding='utf8').read() + 'function crmCallNext(){')
# Morning Recognition goals
rep("if(k==='con')return sum(act,x=>+x.con||0);", "if(k==='con')return dayCounts(day,who).con;")
rep("if(k==='app')return sum(act,x=>+x.app||0);", "if(k==='app')return dayCounts(day,who).app;")
rep("about:'Calls and conversations logged in Activity'", "about:'People added or reached (call, text, email, meeting) in Clients, or logged in Activity'")
rep("about:'Appointments held, from Activity'", "about:'Appointments booked in Clients, or logged in Activity'")
# the Live Pulse on the Command Deck
rep("con:sum(ta,x=>x.con||0),app:sum(ta,x=>x.app||0)", "con:dayCounts(tk,'').con,app:dayCounts(tk,'').app")
# the check-in fills in today's numbers
rep("dial:sum(a,x=>x.con)||'',leads:sum(a,x=>x.app)||''", "dial:dayCounts(today,WHO).con||'',leads:dayCounts(today,WHO).app||''")
open(OUT, 'w', encoding='utf8').write(s)
print('wrote', OUT, len(s))
