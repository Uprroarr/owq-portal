p='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(p,encoding='utf-8').read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)==cnt,('NOT FOUND' if not s.count(a) else 'COUNT %d'%s.count(a),a[:120])
    s=s.replace(a,b)

# ---------- Agency Owner is Cole Leckey on the clock ----------
rep("const ACSTALE=36e5;","const ACSTALE=36e5;\n// the Agency Owner login is Cole Leckey: its automatic shifts and hours are recorded under Cole Leckey\nconst acWho=()=>WHO==='Agency Owner'&&D.agents.some(a=>a.name==='Cole Leckey')?'Cole Leckey':WHO;")
rep("function acIn(){const n=WHO;if(!D.agents.some(a=>a.name===n))return;","function acIn(){const n=acWho();if(!D.agents.some(a=>a.name===n))return;")
rep("const s=(D.shifts||[]).find(x=>x.ag===WHO&&!x.end&&x.auto);if(!s)return;finishShift(s,WHO,","const s=(D.shifts||[]).find(x=>x.ag===acWho()&&!x.end&&x.auto);if(!s)return;finishShift(s,acWho(),")
rep("function acBeat(){if(!ONLINE)return;const s=openShift(WHO);","function acBeat(){if(!ONLINE)return;const s=openShift(acWho());")
rep("const s=ONLINE&&openShift(WHO);e.innerHTML=s?","const s=ONLINE&&openShift(acWho());e.innerHTML=s?")
rep("clocked=D.agents.some(a=>a.name===WHO);LGMSG=","clocked=D.agents.some(a=>a.name===acWho());LGMSG=")

# ---------- owner accounts are cleared through every module (current and future content) ----------
rep("function lnStates(u){let prev=true,s1=true,g=null;return LNM.map((m,i)=>{","function lnStates(u){let prev=true,s1=true,g=null;const own=lnOwnerU(u);return LNM.map((m,i)=>{")
rep("const r=lnRec(u,m.id),soon=!!m.soon,done=soon?false:m.auto?prev:!!r,unlocked=prev||!!r;","const r=lnRec(u,m.id),soon=!!m.soon,done=soon?false:own?true:m.auto?prev:!!r,unlocked=own||prev||!!r;")
rep("const lnXP=u=>(D.learn||[]).filter(r=>r.u===u).reduce((s,r)=>s+(r.xp||0),0);",
    "const lnXP=u=>{const x=(D.learn||[]).filter(r=>r.u===u).reduce((s,r)=>s+(r.xp||0),0);return roleOf(u)==='Owner/Agent'?Math.max(x,LNM.filter(m=>!m.soon&&!m.auto).length*150):x};")
# one standings row per person: the Agency Owner login is Cole Leckey
rep("const names=D.agents.map(a=>a.name).concat(['Agency Owner']),rows=names.map(n=>{const ss=lnStates(n),s1=ss.filter(x=>x.tr===0)",
    "const names=D.agents.map(a=>a.name).concat(D.agents.some(a=>a.name==='Cole Leckey')?[]:['Agency Owner']),rows=names.map(n=>{const ss=lnStates(n),s1=ss.filter(x=>x.tr===0)")
rep("${lnOwner()&&r.c?`<button class=x title=\"Reset progress\"","${lnOwner()&&r.c&&!r.own?`<button class=x title=\"Reset progress\"")
open(p,'w',encoding='utf-8').write(s)
print('ok',len(s))
