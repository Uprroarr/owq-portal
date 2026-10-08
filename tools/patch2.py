import os,shutil
SC=os.environ['SC']
p='/mnt/user-data/outputs/owq-command-station-v2.html'
shutil.copy(SC+'/v3-backup.html',p)
h=open(p).read()
R=lambda f:open(SC+'/'+f).read()
def rep(o,n):
    global h
    assert o in h,('missing',o[:90]); h=h.replace(o,n,1)
# clients sub-tab
rep("'Intelligence':'Health'}","'Intelligence':'Health','Clients':'Client Book'}")
rep("function cli(){const c=D.clients.find(x=>x.id==cid)","function cliBook(){const c=D.clients.find(x=>x.id==cid)")
rep("return hd('Clients','Basic info and a running log of every conversation.',[['+ Add Client',\"openM('C')\"]])+","return hd('Clients','Basic info and a running log of every conversation.',[['+ Add Client',\"openM('C')\"]])+seg('Clients',['Client Book','Message Builder'])+")
rep('<button class="btn o" onclick="openM(\'C\',${c.id})">Edit</button>','<button class=btn onclick="mbOpen(${c.id})">Write message</button> <button class="btn o" onclick="openM(\'C\',${c.id})">Edit</button>')
rep("(tab==='Agency Performance'||tab==='Business Performance')?SUB[tab]:''","(tab==='Agency Performance'||tab==='Business Performance'||tab==='Clients')?SUB[tab]:''")
rep("||(nx&&nx.value))return;","||(nx&&nx.value)||(tab==='Clients'&&SUB['Clients']==='Message Builder'))return;")
rep("L.push(['Open alert center'","L.push(['Open message builder','Clients',()=>{SUB['Clients']='Message Builder';openTab('Clients')}]);L.push(['Open alert center'")
rep("D.clients.forEach(c=>L.push(['Client: '+c.name,c.st,()=>{cid=c.id;openTab('Clients')}]));","D.clients.forEach(c=>L.push(['Client: '+c.name,c.st,()=>{cid=c.id;SUB['Clients']='Client Book';openTab('Clients')}]));D.clients.forEach(c=>L.push(['Write message: '+c.name,'Message Builder',()=>{tab='Clients';mbOpen(c.id)}]));D.agents.forEach(a=>L.push(['Agent report: '+a.name,'Agents',()=>agOpen(a.name)]));")
# agent drill-down
rep("function agents(){const R=agentRows();return R.length?","function agents(){if(AGD)return agReport(AGD);const R=agentRows();return R.length?")
rep("<tr><td><b>${esc(r.nm)}</b>","<tr class=ck onclick=\"${agA(r.nm)}\"><td><b>${esc(r.nm)}</b>")
rep('onclick="delAg(${r.g.id})"','onclick="event.stopPropagation();delAg(${r.g.id})"')
rep("<h3>Scorecard</h3>","<h3>Scorecard</h3><small style=\"margin:-4px 0 8px\">Click an agent for the full report.</small>")
rep("${hb(R.map(r=>[r.nm,r.iap]))}","${lbk(R)}")
rep("return`<div class=gp><div class=gh>","return`<div class=\"gp ck\" onclick=\"event.stopPropagation();${agA(r.nm)}\"><div class=gh>")
rep("const heat=()=>{","const heat=an=>{")
rep("D.activity.forEach(a=>val[a.d]=(val[a.d]||0)+a.h);D.policies.forEach(p=>val[p.d]=(val[p.d]||0)+2);","D.activity.filter(a=>!an||(a.ag||'Unassigned')===an).forEach(a=>val[a.d]=(val[a.d]||0)+a.h);D.policies.filter(p=>!an||(p.ag||'Unassigned')===an).forEach(p=>val[p.d]=(val[p.d]||0)+2);")
rep("onclick=\"SUB['${t}']='${x}';go()\"","onclick=\"SUB['${t}']='${x}';AGD=null;go()\"")
rep("const openTab=(k,s)=>{tab=k;if(s)SUB[k]=s;","const openTab=(k,s)=>{tab=k;if(s){SUB[k]=s;if(k==='Agency Performance')AGD=null}")
rep('@media(max-width:760px)',R('css6.txt')+'@media(max-width:760px)')
rep('const kpi=(l,v,s=',R('msg.js')+R('agent.js')+'const kpi=(l,v,s=')
open(p,'w').write(h);print('ok',len(h))
