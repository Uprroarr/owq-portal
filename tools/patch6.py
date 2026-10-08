F='/mnt/user-data/outputs/owq-command-station-v2.html'
h=open(F).read()
def rep(a,b):
    global h
    assert a in h,('missing',a[:80]);h=h.replace(a,b,1)
rep("const SYK=['policies','expenses','activity','income','clients','shifts','challenges','agents'],SYB={policies:16,","const SYK=['policies','expenses','activity','income','clients','shifts','challenges','agents','checkins'],SYB={checkins:4,policies:16,")
rep("const kpi=",open('ck.js').read()+"\nconst kpi=")
rep("'Team Chat':[chat,'&#9993;','TEAM','Group chat for agents'],","'Team Chat':[chat,'&#9993;','TEAM','Group chat for agents'],'Check-In':[checkin,'&#9745;','TEAM','Daily check-ins to admin'],")
rep("${k==='Team Chat'?chBadge():''}","${k==='Team Chat'?chBadge():k==='Check-In'?ckBadge():''}")
rep("chSync().forEach(a=>out.push(a));","chSync().forEach(a=>out.push(a));ckScan().forEach(a=>out.push(a));")
rep("||tab==='Team Chat')return;","||tab==='Team Chat'||(tab==='Check-In'&&document.getElementById('cki_goal')))return;")
rep("D.challenges=[];D.chSeed=0;D.cgAgent='';D.roster2=1;seedShifts();seedInfo();seedChallenges();seedChat();","D.challenges=[];D.chSeed=0;D.cgAgent='';D.roster2=1;seedShifts();seedInfo();seedChallenges();seedChat();seedCheckins();")
rep("if(!D.chat)seedChat()}lockView();","if(!D.chat)seedChat();if(!D.ckSeed&&!(D.checkins||[]).length)seedCheckins()}lockView();")
rep("Object.assign(D,{seeded:1,shiftSeed:1,","Object.assign(D,{ckSeed:1,seeded:1,shiftSeed:1,")
rep("if(changed){save();synRefresh()}}","if(changed){save();synRefresh();if(ONLINE)scanNow()}}")
rep("</style>",open('css12.txt').read()+"</style>")
open(F,'w').write(h);print(len(h))
