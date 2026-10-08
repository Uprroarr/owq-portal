"""Sidebar: COMMAND / SALES / TEAM / BUSINESS / LEARN / SYSTEM headers fold and unfold their pages (remembered per device),
plus collapse-all / expand-all. Base -> new base."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
B=os.environ.get('OWQ_BASE',SP+'/v93-final.html');O=os.environ.get('OWQ_OUT',SP+'/v94-final.html')
s=open(B,encoding='utf-8').read();assert 'function navTog' not in s
o="""function navRender(){let lg='';document.getElementById('nav').innerHTML=Object.entries(views).map(([k,v])=>{const g=v[2]!==lg?`<div class=ng>${v[2]}</div>`:'';lg=v[2];return g+`<button class="nv ${k===tab?'on':''}" onclick="openTab('${k}')"><span>${v[1]}</span>${k}${k==='Team Chat'?chBadge():k==='Morning Recognition'?mrBadge():k==='Check-In'?ckBadge():''}<small>${v[3]}</small></button>`+navSubs(k)}).join('')+`<div class=ng>SYSTEM</div><button class=nv onclick="toggleRail()"><span>&#9888;</span>Alerts${UB()}<small>Live incoming events</small></button><button class=nv onclick="openM('S')"><span>&#9881;</span>Settings<small>Goals, thresholds, backup</small></button>`;"""
n="""function navC(){try{const j=JSON.parse(localStorage.getItem('owq_navc')||'{}');return j&&typeof j==='object'?j:{}}catch(e){return{}}}
function navSaveC(c){try{localStorage.setItem('owq_navc',JSON.stringify(c))}catch(e){}}
function navGroups(){const gs=[];Object.values(views).forEach(v=>{if(gs.indexOf(v[2])<0)gs.push(v[2])});gs.push('SYSTEM');return gs}
function navTog(g){const c=navC();c[g]=c[g]?0:1;navSaveC(c);navRender()}
function navAll(){const c=navC(),gs=navGroups(),close=gs.some(g=>!c[g]);gs.forEach(g=>{c[g]=close?1:0});navSaveC(c);navRender()}
function navRender(){const C=navC(),gs=navGroups(),G={};gs.forEach(g=>G[g]=[]);
 Object.entries(views).forEach(([k,v])=>{G[v[2]].push(`<button class="nv ${k===tab?'on':''}" onclick="openTab('${k}')"><span>${v[1]}</span>${k}${k==='Team Chat'?chBadge():k==='Morning Recognition'?mrBadge():k==='Check-In'?ckBadge():''}<small>${v[3]}</small></button>`+navSubs(k))});
 G.SYSTEM.push(`<button class=nv onclick="toggleRail()"><span>&#9888;</span>Alerts${UB()}<small>Live incoming events</small></button><button class=nv onclick="openM('S')"><span>&#9881;</span>Settings<small>Goals, thresholds, backup</small></button>`);
 const allc=gs.every(g=>C[g]);
 document.getElementById('nav').innerHTML=gs.map((g,i)=>{const col=!!C[g],act=g!=='SYSTEM'&&Object.entries(views).some(([k,v])=>v[2]===g&&k===tab);
  return`<div class="ngw${col?' col':''}"><button class="ng ngb" onclick="navTog('${g}')" aria-expanded=${col?'false':'true'} title="${col?'Show':'Hide'} ${g.toLowerCase()}"><span>${g}</span>${col&&act?'<b class=ngd title="You are on a page in here"></b>':''}<i class=ngc aria-hidden=true>&#9662;</i></button>${i===0?`<button class=nga onclick="navAll()" title="${allc?'Expand':'Collapse'} all sections" aria-label="${allc?'Expand':'Collapse'} all sections">${allc?'&#8862;':'&#8863;'}</button>`:''}<div class=ngi${col?' hidden':''}>${G[g].join('')}</div></div>`}).join('');"""
assert s.count(o)==1,s.count(o);s=s.replace(o,n)
css=""".ngw{position:relative}.ngb{display:flex;align-items:center;gap:8px;width:100%;background:none;border:0;border-top:1px solid var(--ln);font-family:inherit;text-align:left;cursor:pointer}
.ngb:hover{color:#ff6f8e}.ngb span{flex:1}.ngc{font-style:normal;font-size:11px;color:var(--mut);transition:transform .18s;margin-right:22px}.ngw.col .ngc{transform:rotate(-90deg)}
.ngd{width:6px;height:6px;border-radius:50%;background:var(--red);box-shadow:0 0 8px var(--red)}
.nga{position:absolute;right:10px;top:13px;background:none;border:1px solid var(--ln);color:var(--mut);width:20px;height:20px;padding:0;font-size:13px;line-height:1;cursor:pointer}.nga:hover{color:#fff;border-color:var(--red)}
.ngw:not(:first-child) .ngc{margin-right:0}
"""
a='</style><canvas id=bgc>';assert s.count(a)==1;s=s.replace(a,css+a)
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
