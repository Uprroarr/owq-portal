import os,shutil
SC=os.environ['SC']
p='/mnt/user-data/outputs/owq-command-station-v2.html'
shutil.copy(SC+'/v4-backup.html',p)
h=open(p).read()
R=lambda f:open(SC+'/'+f).read()
def rep(o,n,cnt=1):
    global h
    assert o in h,('missing',o[:90]); h=h.replace(o,n,cnt)
# state: shifts
assert h.count('alerts:[],sim:')>=3
h=h.replace('alerts:[],sim:','alerts:[],shifts:[],sim:')
# css
rep('@media(max-width:760px)',R('css7.txt')+'@media(max-width:760px)')
rep('@media(prefers-reduced-motion:reduce)',R('css8.txt')+'@media(prefers-reduced-motion:reduce)')
# blocks
rep('const kpi=(l,v,s=',R('lb.js')+R('clock.js')+R('ci.js')+'const kpi=(l,v,s=')
# nav
rep("'Clients':[cli,","'Leaderboard':[lb,'&#9733;','SALES','Rankings and awards'],'Clients':[cli,")
# clock panel in agent profile + on-the-clock dot in scorecard
rep('<div class=g2 style="margin-top:14px"><div class=c><h4>Weekly Goal</h4>','${clockPanel(n)}<div class=g2 style="margin-top:14px"><div class=c><h4>Weekly Goal</h4>')
rep('onclick="${agA(r.nm)}"><td><b>${esc(r.nm)}</b>','onclick="${agA(r.nm)}"><td><b>${esc(r.nm)}</b>${openShift(r.nm)?\'<i class=ondot title="On the clock"></i>\':\'\'}')
# live timer tick
rep("setInterval(()=>{if(ONLINE&&RAIL)railRender()},30000);","setInterval(()=>{if(ONLINE&&RAIL)railRender()},30000);setInterval(()=>{const e=document.getElementById('ckt');if(e){const s=+e.dataset.s;if(s)e.textContent=fmtDur(Date.now()-s)}},1000);")
# startup seeds
rep("if(!D.seeded&&!D.policies.length)mock();lockView();","if(!D.seeded&&!D.policies.length)mock();if(D.seeded&&D.agents.length>=3&&D.policies.length>200){if(!D.shiftSeed)seedShifts();if(!D.infoSeed)seedInfo()}lockView();")
rep("D.goal=60000;D.hT=60;D.lT=1000;D.seeded=1;","seedShifts();seedInfo();D.goal=60000;D.hT=60;D.lT=1000;D.seeded=1;")
# leader-change alert
rep("\nreturn out}\nfunction scanNow()","\nconst lw=lbRank('This Week','pts');if(lw.length&&lw[0].pts>0){if(!D.lbLead){D.lbLead=lw[0].nm;save()}else if(D.lbLead!==lw[0].nm){out.push({k:'lead-'+WK()+'-'+lw[0].nm,sev:'ok',t:'New weekly leader',m:lw[0].nm+' takes #1 from '+D.lbLead+' this week',go:['Leaderboard']});D.lbLead=lw[0].nm;save()}}\nreturn out}\nfunction scanNow()")
# client detail: Notes / Personal Info tabs
rep("${c.fu?`<h4>Next follow-up</h4>","<div class=seg style=\"margin-top:12px\">${['Notes','Personal Info'].map(t=>`<button class=\"${CIT===t?'on':''}\" onclick=\"CIT='${t}';go()\">${t}</button>`).join('')}</div>${CIT==='Personal Info'?ciForm(c):`${c.fu?`<h4>Next follow-up</h4>")
rep("<p class=mut>No conversations logged yet.</p>'}`:'<h4>Client Pipeline</h4>'","<p class=mut>No conversations logged yet.</p>'}`}`:'<h4>Client Pipeline</h4>'")
open(p,'w').write(h);print('ok',len(h))
