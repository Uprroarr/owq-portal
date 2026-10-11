"""v109: live tracking on the time clock (what each minute on the clock was: working, Sales Floor only, on screen, away;
speaking, mic, 3D games, interactions, sections) and the Time Report (Agency Performance > Time Report). Also: a shift that
stopped without a clock-out counts to its last heartbeat everywhere, and the Agents scorecard says its hours are all time.
Exact replacements with asserted counts on top of v108."""
import os
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get('OWQ_BASE', SP + '/v108-final.html')
OUT = os.environ.get('OWQ_OUT', SP + '/v109-final.html')
s = open(BASE, encoding='utf8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, (n, count, old[:80])
    s = s.replace(old, new)


assert '/*TRKstart*/' not in s, 'already patched'
rep('/*DCend*/\nfunction crmCallNext(){', '/*DCend*/\n' + open(os.path.join(HERE, 'trk.js'), encoding='utf8').read() + 'function crmCallNext(){')
# the heartbeat records the minute it closes
rep("function acBeat(){if(!ONLINE)return;const s=openShift(acWho());if(s&&s.auto)s.hb=Date.now();acSweep();save()}",
    "function acBeat(){if(!ONLINE)return;const s=openShift(acWho());if(s&&s.auto){trkBeat(s);s.hb=Date.now()}acSweep();save()}")
# a shift with no clock-out counts to its last heartbeat (not to now) unless it is still live
rep("function shiftHrs(sh,from){return sum(sh.filter(s=>s.start>=from),s=>((s.end||Date.now())-s.start)/36e5)}",
    "function shiftHrs(sh,from){return sum(sh.filter(s=>s.start>=from),s=>(shEnd(s)-s.start)/36e5)}")
rep("${rec.map(s=>{const h=((s.end||Date.now())-s.start)/36e5;return`<tr><td>${dtS(s.start)}<td>${tmS(s.start)}<td>${s.end?tmS(s.end):'<span class=pos>In progress</span>'}",
    "${rec.map(s=>{const h=(shEnd(s)-s.start)/36e5;return`<tr><td>${dtS(s.start)}<td>${tmS(s.start)}<td>${s.end?tmS(s.end):shiftLive(s)?'<span class=pos>In progress</span>':tmS(shEnd(s))+' <span class=mut>(no clock-out)</span>'}")
rep("h=sum(mine.filter(x=>x.start>=d0),x=>((x.end||Date.now())-x.start)/36e5)", "h=sum(mine.filter(x=>x.start>=d0),x=>(shEnd(x)-x.start)/36e5)")
rep("<th class=n>Hours<th>7-day goal<th></tr>", "<th class=n>Hours (all time)<th>7-day goal<th></tr>")
# the Time Report sub-tab
rep("const NSUB={'Agency Performance':['Summary','Policies','Agents'],", "const NSUB={'Agency Performance':['Summary','Policies','Agents','Time Report'],")
rep("b=t=='Policies'?plist():t=='Agents'?agents():", "b=t=='Policies'?plist():t=='Agents'?agents():t=='Time Report'?trkPage():")
rep("seg('Agency Performance',['Summary','Policies','Agents'])+b}", "seg('Agency Performance',['Summary','Policies','Agents','Time Report'])+b}")
open(OUT, 'w', encoding='utf8').write(s)
print('wrote', OUT, len(s))
