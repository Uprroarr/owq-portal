import re,os,subprocess,shutil
SC=os.environ['SC']
p='/mnt/user-data/outputs/owq-command-station-v2.html'
shutil.copy(SC+'/v2-backup.html',p)
h=open(p).read()
R=lambda f:open(SC+'/'+f).read()
def rep(o,n,cnt=1):
    global h
    assert o in h,('missing',o[:80]); h=h.replace(o,n,cnt)
# 1 state defaults
assert h.count('clients:[],agents:[],income:[],')>=3
h=h.replace('clients:[],agents:[],income:[],','clients:[],agents:[],income:[],alerts:[],sim:1,snd:0,')
h=re.sub(r'(seeded:1,policies:\[\],expenses:\[\],activity:\[\],clients:\[\],agents:\[\],income:\[\],alerts:\[\],)sim:1',r'\1sim:0',h)
# 2 css, html shell
rep('@media(max-width:760px)',R('css4.txt')+'@media(max-width:760px)')
rep('@media(prefers-reduced-motion:reduce)',R('css5.txt')+'@media(prefers-reduced-motion:reduce)')
rep('<div class="app">','<canvas id=bgc></canvas><div class="app" id=app>')
rep('<main id="main"></main></div><div id="md"></div>','<div class=mn><header id=hud class=hud></header><main id="main"></main></div><div id=rail class=rail role=complementary aria-label="Alert center"></div></div><div id=pop class=pop role=status aria-live=polite></div><div id="md"></div>')
# 3 js
rep('const kpi=(l,v,s=',R('alerts.js')+'const kpi=(l,v,s=')
h=re.sub(r'function go\(\)\{.*?anim\(\)\}',lambda m:'''function navRender(){let lg='';document.getElementById('nav').innerHTML=Object.entries(views).map(([k,v])=>{const g=v[2]!==lg?`<div class=ng>${v[2]}</div>`:'';lg=v[2];return g+`<button class="nv ${k===tab?'on':''}" onclick="openTab('${k}')"><span>${v[1]}</span>${k}<small>${v[3]}</small></button>`}).join('')+`<div class=ng>SYSTEM</div><button class=nv onclick="toggleRail()"><span>&#9888;</span>Alerts${UB()}<small>Live incoming events</small></button><button class=nv onclick="openM('S')"><span>&#9881;</span>Settings<small>Goals, thresholds, backup</small></button>`}
function go(){navRender();document.getElementById('main').innerHTML=tick2()+views[tab][0]()+'<p class=note>Production is not profit. Account for lead costs, other expenses, and chargebacks. Data is saved in this browser only. Use Settings to back it up.</p>';anim();hudRender()}''',h,count=1,flags=re.S)
rep("if(RM){e.textContent=fm(v);return}","if(RM||QUIET){e.textContent=fm(v);return}")
rep("tab='Command Deck';go()},RM?100:1400)}","tab='Command Deck';ONLINE=1;railInit();go();setTimeout(scanStream,RM?400:3700);simLoop()},RM?100:1400)}")
rep("function lockView(){const l=document.getElementById('login');","function lockView(){ONLINE=0;clearTimeout(SIMT);POPS=[];RAIL=false;const rl=document.getElementById('rail');if(rl)rl.className='rail';popRender();const l=document.getElementById('login');")
rep("D.seeded=1;save()}","D.seeded=1;D.sim=1;D.alerts=[];D.aid=0;save()}")
rep('onclick="mock();closeM();go()">Load sample data','onclick="mock();closeM();go();scanStream()">Load sample data')
# deck: latest alerts panel, drop feed
rep('<div class=c><h4>Station Console</h4>','<div class=c><h4>Latest Alerts</h4><div id=dal>${latestAl()}</div><button class="btn o" onclick="toggleRail(true)">Open alert center</button></div>\n<div class=c style="grid-column:1/-1"><h4>Station Console</h4>')
h=re.sub(r"<div class=c><h4>Command Feed</h4>.*?</div></div>`\}","</div>`}",h,count=1,flags=re.S)
# tick + logging wrappers
rep('tick();setInterval(tick,30000);',"""tick();setInterval(tick,30000);setInterval(()=>{if(ONLINE&&RAIL)railRender()},30000);
function wrapLog(name,key,mk){const f=globalThis[name];globalThis[name]=function(){const n=D[key].length;f();if(D[key].length>n){pushAlert(Object.assign({sev:'ok',rd:1},mk(D[key][D[key].length-1])),true);scanNow()}}}
wrapLog('addP','policies',x=>({t:'Policy logged',m:`${x.cl} - ${$(x.ap)} with ${x.car} (${x.st})`,go:['Agency Performance','Policies']}));
wrapLog('addI','income',x=>({t:'Income logged',m:`${x.src} - ${$(x.amt)}`,go:['Business Performance','Income']}));
wrapLog('addE','expenses',x=>({t:'Expense logged',m:`${x.cat} - ${$(x.amt)}`,go:['Business Performance','Expenses']}));
""")
# 4 page format: strip document tags, drop double safe-area padding
for a,b in [('calc(20px + env(safe-area-inset-top,0px))','20px'),('calc(14px + env(safe-area-inset-bottom,0px))','14px'),('calc(24px + env(safe-area-inset-top,0px))','24px'),('calc(50px + env(safe-area-inset-bottom,0px))','50px'),('calc(8px + env(safe-area-inset-top,0px))','8px')]:
    h=h.replace(a,b)
h=re.sub(r'^<!DOCTYPE html>.*?(?=<title>)','',h,flags=re.S)
h=h.replace('</head><body>','',1).replace('</body></html>','')
assert '<html' not in h and '<body' not in h and h.lstrip().startswith('<title>')
open(p,'w').write(h)
print('written',len(h))
