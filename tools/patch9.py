p='/mnt/user-data/outputs/owq-command-station-v2.html'
h=open(p).read()
def rep(a,b,c=1):
    global h
    assert h.count(a)>=1,a[:60]
    h=h.replace(a,b)
# fresh storage key + clean default state w/ real roster
rep("const KEY='owq_v2'","const KEY='owq_v3'")
rep("let D={policies:[],expenses:[],activity:[],clients:[],agents:[],income:[],alerts:[],shifts:[],challenges:[],sim:1,snd:0,hT:20,lT:250,goal:5000}",
 "let D={seeded:1,live:1,roster2:1,chSeed:1,shiftSeed:1,infoSeed:1,ckSeed:1,policies:[],expenses:[],activity:[],clients:[],agents:[{id:1,name:'Austin Vardzel',goal:5000},{id:2,name:'Nate Johnson',goal:4000},{id:3,name:'Cole Leckey',goal:3500},{id:4,name:'John Montini',goal:3000},{id:5,name:'RJ Noullet',goal:2000},{id:6,name:'Ayman',goal:1000}],income:[],alerts:[],shifts:[],challenges:[],checkins:[],sim:0,snd:0,hT:60,lT:1000,goal:60000}")
# boot: no mock seeding
a=h.index("if(D.seeded&&!D.roster2&&D.agents.some(a=>a.name==='Marcus Hale'))mock();")
b=h.index("lockView();chInit();synInit();vcInit();")
h=h[:a]+"D.sim=0;"+h[b:]
# hide sim UI & sample data
rep("""<div class=sr><span>Live simulation</span><button class="tg ${D.sim?'on':''}" onclick="toggleSim()">${D.sim?'ON':'OFF'}</button></div><small>Sample events add applications, issued policies, and leads to your data. Turn this off before you enter real records.</small><button class=btn onclick="simEvent(1)">Trigger event</button>""","")
rep("""<button class="pill ${D.sim?'on':''}" onclick="toggleSim()" title="Turn the live sample feed on or off">${D.sim?'LIVE':'PAUSED'}</button>""","")
rep("""<button class="btn o" onclick="ask(\\'Replace ALL data (shared with your team) with demo data?\\',()=>{mock();closeM();go();scanStream()})">Load sample data</button> """,
    "")
# Clear all keeps roster
rep("D={seeded:1,policies:[],expenses:[],activity:[],clients:[],agents:[],income:[],alerts:[],shifts:[],challenges:[],sim:0,snd:0,hT:20,lT:250,goal:5000};save();go()",
    "const ag=D.agents;D={seeded:1,live:1,roster2:1,chSeed:1,shiftSeed:1,infoSeed:1,ckSeed:1,policies:[],expenses:[],activity:[],clients:[],agents:ag,income:[],alerts:[],shifts:[],challenges:[],checkins:[],sim:0,snd:0,hT:D.hT,lT:D.lT,goal:D.goal,chat:D.chat};save();go()")
# leaderboard: calendar week (Mon-today) and month only
rep("if(t==='This Week')return[dAgo(6),today,dAgo(13),dAgo(7)];",
    "if(t==='This Week'){const wd=(now.getDay()+6)%7;return[dAgo(wd),today,dAgo(wd+7),dAgo(wd+1)]}")
rep("['This Week','This Month','Last 30 Days','All Time'].map(x=>[x,x])","['This Week','This Month'].map(x=>[x,x])")
open(p,'w').write(h)
