import re
F='/mnt/user-data/outputs/owq-command-station-v2.html'
h=open(F).read()
def rep(a,b,cnt=1):
    global h
    assert h.count(a)>=1,('missing',a[:70]);h=h.replace(a,b,cnt)
# remove old lockView/doLogin (lines 274-277)
i=h.index('function lockView(){');j=h.index('function mock(){')
h=h[:i]+open('login.js').read()+h[j:]
# roster
rep("const AGN=[['Marcus Hale',5000,.33,.88],['Tia Brooks',4000,.26,1.04],['Devon Reyes',3000,.2,.62],['Priya Nair',2000,.14,1.3],['Sam Whitaker',1000,.07,.45]]","const AGN=[['Austin Vardzel',5000,.26,.9],['Nate Johnson',4000,.22,1.05],['Cole Leckey',3500,.18,.8],['John Montini',3000,.15,.62],['RJ Noullet',2000,.11,1.3],['Ayman',1000,.08,.45]]")
rep("seedShifts();seedInfo();seedChallenges();D.goal=60000","D.challenges=[];D.chSeed=0;D.cgAgent='';D.roster2=1;seedShifts();seedInfo();seedChallenges();seedChat();D.goal=60000")
# startup
rep("if(!D.seeded&&!D.policies.length)mock();","if(D.seeded&&!D.roster2&&D.agents.some(a=>a.name==='Marcus Hale'))mock();if(!D.seeded&&!D.policies.length)mock();")
rep("if(!D.chSeed&&!(D.challenges||[]).length)seedChallenges()}lockView();","if(!D.chSeed&&!(D.challenges||[]).length)seedChallenges();if(!D.chat)seedChat()}lockView();")
# views + nav badge
rep("'Clients':[cli,'&#9776;','SALES','Contacts and notes'],","'Clients':[cli,'&#9776;','SALES','Contacts and notes'],'Team Chat':[chat,'&#9993;','TEAM','Group chat for agents'],")
rep("onclick=\"openTab('${k}')\"><span>${v[1]}</span>${k}<small>","onclick=\"openTab('${k}')\"><span>${v[1]}</span>${k}${k==='Team Chat'?chBadge():''}<small>")
# podium avatar
rep("${esc(ini(x.nm))}${openShift","${av(x.nm,100)}${openShift")
# agent report header
rep("<div class=hd style=\"margin-top:12px\"><div><h2>${esc(n)}</h2>","<div class=hd style=\"margin-top:12px\"><div style=\"display:flex;gap:14px;align-items:center\">${av(n,64)}<div><h2>${esc(n)}</h2>")
rep("${r.goal?'. Weekly goal '+$(r.goal):''}.</p></div></div>","${r.goal?'. Weekly goal '+$(r.goal):''}. ${esc(roleOf(n))}.</p></div></div></div>")
# refreshQuiet skip on chat
rep("||(tab==='Clients'&&SUB['Clients']==='Message Builder'))return;","||(tab==='Clients'&&SUB['Clients']==='Message Builder')||tab==='Team Chat')return;")
# chat code before const kpi=
rep("const kpi=",open('chat.js').read()+"\nconst kpi=")
# banter wrap
rep("wrapLog('addP','policies'","{const _se=simEvent;simEvent=function(f){const b=new Set(D.policies.filter(p=>p.st==='Issued'));_se(f);chBanter(b)}}\nwrapLog('addP','policies'")
# palette
# css
rep("</style>",open('css10.txt').read()+"</style>")
rep("anim();hudRender()}\nconst tick=","anim();hudRender();if(tab==='Team Chat')chScroll()}\nconst tick=")
open(F,'w').write(h);print(len(h))
