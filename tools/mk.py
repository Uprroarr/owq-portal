import os
SC=os.environ['SC']
h=open('/mnt/user-data/outputs/owq-command-station-v2.html').read()
js=h.split('<script>')[1].split('</script>')[0]
test=r'''
const vals={},TQ=[];
const el=()=>({value:'',innerHTML:'',textContent:'',className:'',dataset:{},style:{},scrollTop:0,classList:{add(){},remove(){}},focus(){},querySelector:()=>null});
const set=o=>Object.entries(o).forEach(([k,v])=>{(vals[k]=vals[k]||el()).value=v});
globalThis.document={getElementById:id=>vals[id]||(vals[id]=el()),querySelectorAll:()=>[],querySelector:()=>null,hidden:false};
globalThis.localStorage={getItem:()=>null,setItem(){}};globalThis.matchMedia=()=>({matches:false});globalThis.addEventListener=()=>{};
globalThis.setTimeout=(f,ms)=>{TQ.push([f,ms||0]);return TQ.length};globalThis.setInterval=()=>0;globalThis.clearTimeout=()=>{};globalThis.requestAnimationFrame=()=>0;
const bad=(k,o)=>{const m=String(o).match(/.{30}(undefined|NaN|\[object).{30}/);if(m)console.log('WARN',k,m[0])};
const flush=(max=300)=>{let n=0;while(TQ.length&&n++<max){const [f,ms]=TQ.shift();if(ms>=13000)continue;try{f()}catch(e){console.log('TIMER ERR',e.message)}}};
'''+js+r'''
;const R=id=>document.getElementById(id).innerHTML;
console.log('boot: policies',D.policies.length,'clients',D.clients.length,'alerts',D.alerts.length,'sim',D.sim);
set({lgi:'zed'});doLogin();flush();
console.log('after login: online',ONLINE,'tab',tab,'rail',R('rail').includes('Live Alerts'));
flush();
console.log('alerts streamed',D.alerts.length,'unread',D.alerts.filter(a=>!a.rd).length,'titles:',D.alerts.map(a=>a.t).join(' | '));
console.log('hud status:',(R('hud').match(/pill (ok|warn|crit)">(\w+)/)||[])[2],'| bell badge',(R('hud').match(/<b>(\d+)<\/b><\/button>/)||[])[1]);
console.log('popups',POPS.length,R('pop').includes('class="pp'));
bad('hud',R('hud'));bad('rail',R('rail'));bad('pop',R('pop'));bad('main',R('main'));
const p0=D.policies.length,c0=D.clients.length,a0=D.alerts.length;
for(let i=0;i<60;i++)simEvent(1);flush();
console.log('after 60 sim events: policies +',D.policies.length-p0,'clients +',D.clients.length-c0,'alerts +',D.alerts.length-a0,'(cap',D.alerts.length,')');
const kinds={};D.alerts.forEach(a=>kinds[a.t]=(kinds[a.t]||0)+1);console.log(JSON.stringify(kinds));
D.sim=0;const n1=D.alerts.length;simEvent();console.log('sim off blocks event:',D.alerts.length===n1);
const subs={'Agency Performance':['Summary','Policies','Agents'],'Business Performance':['Summary','Income','Expenses','Statement']};
for(const k of Object.keys(views))for(const s of (subs[k]||[null])){tab=k;if(s)SUB[k]=s;cid=1;go();bad(k+s,R('main')+R('hud')+R('nav'))}
tab='Command Deck';go();console.log('deck has alerts panel',R('main').includes('Latest Alerts'),'| feed removed',!R('main').includes('Command Feed'),'| console',R('main').includes('Station Console'));
AF='crit';railRender();console.log('crit filter cards',(R('rail').match(/class="ac /g)||[]).length);AF='All';
const first=D.alerts[0];alRead(first.id);console.log('mark read ok',D.alerts[0].rd===1);
const g=D.alerts.find(a=>a.go&&a.go[0]==='Clients');alGo(g.id);console.log('open alert -> tab',tab,'cid',cid);
markAll();console.log('mark all -> unread',D.alerts.filter(a=>!a.rd).length,'status',(R('hud').match(/pill (ok|warn|crit)">(\w+)/)||[])[2]);
alDel(D.alerts[0].id);
set({cpi:'polic'});openCP();set({cpi:'polic'});cpList();console.log('palette results',CPR.length,CPR.slice(0,3).map(c=>c[0]).join(' | '));
set({cpi:'agents'});CPS=0;cpList();cpRun(0);console.log('palette ran ->',tab,SUB[tab]);
set({cpi:'zzzz'});cpList();console.log('palette empty state',R('cpl').includes('Nothing matches'));
set({pa:'1750',pd:today,pc:'Alert Test',pg:'Marcus Hale',pk:'Americo',pp:'Term',pt:'100',ps:'Issued',psr:'Referral'});const n2=D.alerts.length;addP();
console.log('addP logged alert',D.alerts.length>n2,D.alerts[0].t,'read',D.alerts[0].rd);
set({ea:'80',ed:today,ec:'Leads',el:'4',es:'Referral',en:''});addE();console.log('addE alert',D.alerts[0].t);
set({ia:'200',ii:today,is:'Referral Fee',inn:''});addI();console.log('addI alert',D.alerts[0].t);
toggleSim();toggleSim();toggleSnd();toggleSnd();toggleRail(false);toggleRail();console.log('toggles ok, sim',D.sim,'rail',RAIL);
lockView();console.log('locked: online',ONLINE,'login shown',R('login').includes('AUTH REQUIRED'));
'''
open(SC+'/t5.js','w').write(test)
