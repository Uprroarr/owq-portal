p='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(p).read()
js=open('learn.js').read();css=open('learn.css').read()
assert 'LEARNING NETWORK' not in s
def rep(a,b,c=1):
    global s
    assert s.count(a)==c,(a,s.count(a));s=s.replace(a,b)
rep("checkins:[],sim:0,snd:0,hT:60,lT:1000,goal:60000}","checkins:[],learn:[],sim:0,snd:0,hT:60,lT:1000,goal:60000}")
rep("'agents','checkins'],SYB={checkins:4,","'agents','checkins','learn'],SYB={learn:4,checkins:4,")
rep("checkins:[],sim:0,snd:0,hT:D.hT,lT:D.lT,goal:D.goal,chat:D.chat}","checkins:[],learn:D.learn||[],sim:0,snd:0,hT:D.hT,lT:D.lT,goal:D.goal,chat:D.chat}")
rep("const views={","\n"+js+"\nconst views={")
rep("'Production Equation':[eqn,'&#8721;','BUSINESS','Your growth path']};","'Production Equation':[eqn,'&#8721;','BUSINESS','Your growth path'],'Learning Network':[lrn,'&#9873;','LEARN','Agency and role training']};")
rep("</style>",css+"</style>")
open(p,'w').write(s)
