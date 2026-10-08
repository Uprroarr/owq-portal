import json
p='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(p).read()
def rep(a,b,c=1):
    global s
    assert s.count(a)==c,(a[:60],s.count(a));s=s.replace(a,b)
# 1 seen-based counting
rep("return Object.keys(LN.rv).filter(x=>x.indexOf(LN.id+':'+k+':')===0&&LN.rv[x]).length}","return Object.keys(LN.sn).filter(x=>x.indexOf(LN.id+':'+k+':')===0).length}")
rep("function lnRv(i){const k=lnRvK(i);LN.rv[k]=!LN.rv[k];","function lnRv(i){const k=lnRvK(i);LN.rv[k]=!LN.rv[k];LN.sn[k]=1;")
rep("let LN={id:null,step:0,mode:'lesson',rv:{},","let LN={id:null,step:0,mode:'lesson',rv:{},sn:{},")
# 2 documents
docs=json.load(open('docs.json'))
code="const LNDOC="+json.dumps(docs)+";\nLNM.forEach(m=>{if(LNDOC[m.id])m.slides.push({t:'The document',h:()=>lnDocHtml(m.id)})});\n"+r"""function lnDocHtml(id){const m=LNM.find(x=>x.id===id);return`<p class=lnp>This is the official document for <b>${esc(m.t)}</b>. Tap it to enlarge, or save a copy to keep.</p><button class=lndoc onclick="lnDoc('${id}')" aria-label="Open the ${esc(m.t)} document full size"><img src="${LNDOC[id]}" alt="${esc(m.t)} document"></button><div class=lndb><button class=btn onclick="lnDoc('${id}')">Open full size</button><button class="btn o" onclick="lnSave('${id}')">Save to device</button></div>`}
function lnDoc(id){const m=LNM.find(x=>x.id===id);document.getElementById('md').innerHTML=`<div class=mb><div class="c lndv"><h4>${esc(m.t)}</h4><img src="${LNDOC[id]}" alt="${esc(m.t)} document"><div style="margin-top:12px"><button class=btn onclick="lnSave('${id}')">Save to device</button> <button class="btn o" onclick="closeM()">Close</button></div></div></div>`}
async function lnSave(id){let dl=null;try{const c=globalThis.claude;dl=c&&c.use?await c.use('downloads'):null}catch(e){}if(!dl)return toast('Saving files is not available in this view. Open the published link to save.');try{const b=atob(LNDOC[id].split(',')[1]),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);await dl.save({filename:id+'.jpg',data:new Blob([u],{type:'image/jpeg'})});toast('Saved',1)}catch(e){toast(e&&e.code==='declined'?'Save cancelled.':'Could not save the file.')}}
"""
rep("/* ===== STATE ===== */",code+"/* ===== STATE ===== */")
# result: view document button
rep("""<button class="btn o" onclick="lnBack()">Road map</button>${nx&&!all""","""<button class="btn o" onclick="lnBack()">Road map</button>${LNDOC[m.id]?`<button class="btn o" onclick="LN.mode='lesson';LN.step=LNM[${i}].slides.length-1;LN.anim=1;lnR(1)">View the document</button>`:''}${nx&&!all""")
# 3 sidebar subs
rep("function lnR(top){const e=document.getElementById('lnb');if(!e)return;e.innerHTML=lnBody();LN.anim=0;","function lnR(top){const e=document.getElementById('lnb');if(!e)return;e.innerHTML=lnBody();LN.anim=0;try{navRender()}catch(x){}")
sub=r"""
const NSUB={'Agency Performance':['Summary','Policies','Agents'],'Business Performance':['Summary','Income','Expenses','Statement'],'Clients':['Client Book','Message Builder'],'Leaderboard':['Rankings','Challenges']};
function navSubs(k){if(k!==tab)return'';let it=[];
if(k==='Learning Network'){it=lnStates(WHO).map(s=>({l:s.m.ic+' '+s.m.t,on:LN.id===s.m.id,st:s.done?'ok':(s.unlocked?'':'lock'),f:"lnSub('"+s.m.id+"')"}))}
else if(NSUB[k]){const cur=k==='Leaderboard'?LBV:SUB[k]||NSUB[k][0];it=NSUB[k].map(x=>({l:x,on:cur===x,st:'',f:"navSub('"+k+"','"+x+"')"}))}
return it.length?'<div class=nsubs>'+it.map(x=>`<button class="nsb ${x.on?'on':''} ${x.st}" onclick="${x.f}">${x.st==='ok'?'<i>&#10003;</i>':x.st==='lock'?'<i>&#128274;</i>':'<i>&bull;</i>'}${x.l}</button>`).join('')+'</div>':''}
function navSub(k,x){if(k==='Leaderboard'){LBV=x;openTab(k)}else openTab(k,x)}
function lnSub(id){if(LN.id===id&&LN.mode==='lesson')return;lnOpen(id)}
"""
rep("function navRender(){",sub+"function navRender(){")
rep("""onclick="openTab(\\'${k}\\')"><span>${v[1]}</span>${k}${k===\\'Team Chat\\'?chBadge():k===\\'Check-In\\'?ckBadge():\\'\\'}<small>${v[3]}</small></button>`}""","""onclick="openTab(\\'${k}\\')"><span>${v[1]}</span>${k}${k===\\'Team Chat\\'?chBadge():k===\\'Check-In\\'?ckBadge():\\'\\'}<small>${v[3]}</small></button>`+navSubs(k)}""") if False else None
open(p,'w').write(s)
