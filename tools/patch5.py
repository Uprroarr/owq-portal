F='/mnt/user-data/outputs/owq-command-station-v2.html'
h=open(F).read()
def rep(a,b,cnt=1):
    global h
    assert h.count(a)>=1,('missing',a[:80]);h=h.replace(a,b,cnt)
# save hook + sync
rep("const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}};","const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}synKick()};\n"+open('sync.js').read())
# modules before kpi
rep("const kpi=",open('vc.js').read()+"\n"+open('ac.js').read()+"\nconst kpi=")
# chat integration
rep("""const chChans=()=>CHN.map(""","""const chChans=()=>`<button class="tcc${CH.ch==='__voice'?' on':''}" onclick="chGo('__voice')">&#127897; Voice Lobby${vcList().length?`<em class=nb>${vcList().length}</em>`:''}<small>Talk live with the team</small></button>`+CHN.map(""")
rep('<div class="c chm"><div class=chth>',"${CH.ch==='__voice'?voicePanel():`<div class=\"c chm\"><div class=chth>")
rep("Send</button></div></div></div>`}","Send</button></div></div>`}</div>`}")
rep("function chRefresh(){if(tab!=='Team Chat'){navRender();return}","function chRefresh(){if(tab!=='Team Chat'){navRender();return}if(CH.ch==='__voice'){navRender();const c=document.getElementById('chcl');if(c)c.innerHTML=chChans();return}")
rep("function chSend(){","function chSend(){if(CH.ch==='__voice')return;")
# startup
rep("if(!D.chat)seedChat()}lockView();","if(!D.chat)seedChat()}lockView();chInit();synInit();vcInit();")
# login / logout
rep("railInit();chInit();go();","railInit();chInit();acIn();go();")
rep("function lockView(){ONLINE=0;","function lockView(){if(ONLINE)acOut();ONLINE=0;")
# shifts live + ids
rep("const openShift=n=>(D.shifts||[]).find(s=>s.ag===n&&!s.end);","const openShift=n=>(D.shifts||[]).find(s=>s.ag===n&&shiftLive(s));")
rep("D.sid=(D.sid||0)+1;D.shifts.push({id:D.sid,ag:n,start:Date.now(),end:null});","D.shifts.push({id:nid(),ag:n,start:Date.now(),end:null});")
rep("D.chid=(D.chid||0)+1;D.challenges.push({id:D.chid,","D.challenges.push({id:nid(),")
# footer
rep('id=who style="margin-top:8px;letter-spacing:2px;font-size:10px"></div>','id=who style="margin-top:8px;letter-spacing:2px;font-size:10px"></div><div id=syn2 class=syn2></div><div id=acl class=syn2></div>')
# settings safety
rep('onclick="mock();closeM();go();scanStream()"','onclick="ask(\\\'Replace ALL data (shared with your team) with demo data?\\\',()=>{mock();closeM();go();scanStream()})"')
rep("ask(\\'Delete all data?\\'","ask(\\'Delete ALL data for everyone using this software?\\'")
rep("function toggleSim(){","function toggleSim(){if(SYN.on){D.sim=0;return toast('The live simulation is off while data is shared with your team.')}")
rep("</style>",open('css11.txt').read()+".vcw{flex:1;overflow:auto}</style>")
open(F,'w').write(h);print(len(h))
