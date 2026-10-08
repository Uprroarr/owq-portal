F='/mnt/user-data/outputs/owq-command-station-v2.html'
h=open(F).read()
def rep(a,b):
    global h
    assert a in h,('missing',a[:80]);h=h.replace(a,b,1)
# leaderboard hours
rep("plc:['Placement',v=>P(v)]};","plc:['Placement',v=>P(v)],hrs:['Hours',v=>fmtHrs(v)]};")
rep("['com','Commission'],['plc','Placement']],'lbMet')","['com','Commission'],['plc','Placement'],['hrs','Hours Worked']],'lbMet')")
rep("hrs:sum(ac,x=>x.h),app,","hrs:sum(ac,x=>x.h)+sum(D.shifts.filter(s=>s.ag===nm&&shiftLive(s)&&dkey(new Date(s.start))>=from&&dkey(new Date(s.start))<=to),s=>(Date.now()-s.start)/36e5),app,")
# idle
rep("const ACSTALE",open('idle.js').read()+"\nconst ACSTALE")
rep("function acOut(){const s=(D.shifts||[]).find(x=>x.ag===WHO&&!x.end&&x.auto);if(!s)return;finishShift(s,WHO,Date.now());","function acOut(end){const s=(D.shifts||[]).find(x=>x.ag===WHO&&!x.end&&x.auto);if(!s)return;finishShift(s,WHO,Math.max(s.start,end||Date.now()));")
rep("<p class=mut style=\"letter-spacing:3px;font-size:11px;margin:4px 0 0\">COMMAND STATION</p>","<p class=mut style=\"letter-spacing:3px;font-size:11px;margin:4px 0 0\">COMMAND STATION</p>${LGMSG?`<p class=lgmsg role=alert>${esc(LGMSG)}</p>`:''}")
rep("<p style=\"letter-spacing:3px;font-size:12px;margin:22px 0 0;color:var(--red)\">SELECT YOUR PROFILE</p><div class=lgp>${cards}</div></div>`}","<p style=\"letter-spacing:3px;font-size:12px;margin:22px 0 0;color:var(--red)\">SELECT YOUR PROFILE</p><div class=lgp>${cards}</div></div>`;LGMSG=''}")
rep("tm_placeholder","") if False else None
rep('<div id="md"></div>','<div id="md"></div><div id=idlew class=idlew role=alert></div>')
rep("railInit();chInit();acIn();go();","LASTACT=Date.now();railInit();chInit();acIn();go();")
h=h.replace("</style>",".idlew{display:none;position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:400;background:#1a1a22;border:1px solid var(--warn);color:var(--tx);padding:12px 18px;max-width:92vw;font-size:13px;box-shadow:0 0 30px #ffb02055}.idlew.on{display:block}.lgmsg{color:var(--warn);font-size:12px;letter-spacing:1px;margin:14px 0 0;max-width:440px}</style>",1)
open(F,'w').write(h);print(len(h))
