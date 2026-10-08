/*ECOstart: Credits, Shop and Loot Crates for the Sales Floor.
  Credits are separate from Battle Pass XP. They are worked out from shared data everyone already has (hours, contacts, appointments,
  policies, check-ins, Morning Recognition, Learning Network), plus owner grants ('credg') and duplicate refunds, minus what you spent.
  Your locker and spending live in one shared document per person: inv/<name key>. Crates roll a rarity by the crate's odds, then an item
  of that rarity you do not own yet; when you own them all, you get credits back instead. Rarer items are the more expensive ones. */
var ECO={inv:{},grants:[],db:null,boot:0,ready:0,crate:'vault',tab:'deals',kf:'all',rf:'all',q:'',hide:0,busy:0,lvlT:0,lvl:0,io:null,pv:null};
var ERN={c:'common',u:'uncommon',r:'rare',e:'epic',l:'legendary',m:'mythic'},ERO=['common','uncommon','rare','epic','legendary','mythic'];
var ERC={common:'#9aa3ad',uncommon:'#3ddc97',rare:'#3fa9ff',epic:'#b55cff',legendary:'#ffb020',mythic:'#ff1f4f'};
var EPR={common:150,uncommon:350,rare:800,epic:2000,legendary:5000,mythic:12000};
/* rarity of every Loot Crate / Shop item (the Battle Pass rewards stay in the Battle Pass) */
var ECR={o:{13:'c',14:'c',15:'c',29:'c',16:'u',17:'u',18:'u',19:'r',20:'r',21:'r',22:'r',23:'e',24:'e',25:'e',26:'l',27:'l',28:'m'},
 k:{16:'c',17:'c',18:'c',19:'u',20:'u',21:'r',22:'r',23:'e',24:'e',25:'l',26:'m'},s:{8:'r',9:'e',10:'l',11:'m'},
 H:{14:'c',15:'c',16:'c',17:'c',18:'u',19:'u',20:'u',21:'u',22:'r',23:'r',24:'r',25:'r',26:'e',27:'e',28:'l',29:'l',30:'m'},
 B:{8:'c',9:'u',10:'u',11:'r',12:'r',13:'e',14:'e',15:'e',16:'l',17:'l',18:'m'},G:{5:'c',6:'u',7:'r',8:'e',9:'l'},
 D:{7:'c',8:'u',9:'r',10:'r',11:'r',12:'e',13:'e',14:'l'},C:{7:'c',8:'u',9:'r',10:'r',11:'e',12:'l',13:'m'},
 I:{9:'c',10:'c',11:'c',12:'u',13:'u',14:'u',15:'r',16:'r',17:'r',18:'e',19:'e',20:'l',21:'m'},R:{4:'c',5:'c',6:'u',7:'r',8:'e',9:'l',10:'m'},
 T:{9:'c',10:'c',11:'c',12:'c',13:'c',14:'u',15:'u',16:'u',17:'u',18:'r',19:'r',20:'r',21:'e',22:'e',23:'l',24:'l',25:'m'},N:{5:'u',6:'r',7:'r',8:'e',9:'l',10:'m'},
 E:{6:'c',7:'u',8:'r',9:'e',10:'l',11:'m'},V:{6:'u',7:'u',8:'r',9:'r',10:'e',11:'e',12:'l',13:'m'},
 W:{1:'c',2:'c',3:'u',4:'u',5:'r',6:'r',7:'e',8:'e',9:'l',10:'m',11:'c',12:'c',13:'u',14:'u',15:'r',16:'r',17:'e',18:'e',19:'l',20:'m'},
 F:{1:'c',2:'c',3:'u',4:'u',5:'u',6:'r',7:'r',8:'e',9:'e',10:'l',11:'l',12:'m'},J:{1:'c',2:'c',3:'u',4:'u',5:'u',6:'r',7:'r',8:'e',9:'e',10:'l',11:'l',12:'m'},
 em:{spin:'c',shrug:'c',point:'c',victory:'c',facepalm:'c',heart:'u',flex:'u',phone:'u',chefkiss:'r',sway:'r',thinker:'r',moonwalk:'e',rain:'e',crown:'l',fireworks:'l',lightning:'m'}};
var EKL={o:'Outfit',k:'Outfit color',s:'Skin',H:'Hat',B:'Extra',G:'Headset',D:'Desk',C:'Computer setup',I:'Desk item',R:'Chair',T:'Title',N:'Name tag',E:'Entrance',V:'Talking aura',W:'Car',F:'Plane',J:'Blaster',em:'Emote'};
var EKI={o:'&#128085;',k:'&#127912;',s:'&#129489;',H:'&#127913;',B:'&#127890;',G:'&#127911;',D:'&#129717;',C:'&#128421;&#65039;',I:'&#127942;',R:'&#128186;',T:'&#127991;&#65039;',N:'&#128278;',E:'&#128682;',V:'&#127775;',W:'&#128663;',F:'&#9992;&#65039;',J:'&#127919;',em:'&#128378;'};
var EEI={6:'&#127801;',7:'&#128168;',8:'&#128997;',9:'&#127878;',10:'&#128760;',11:'&#9732;&#65039;'};
var ECATS=[{id:'fit',n:'Drip',d:'Outfits, colors and skins',keys:'oks',ic:'&#128085;'},{id:'head',n:'Headgear',d:'Hats, extras and headsets',keys:'HBG',ic:'&#127913;'},
 {id:'desk',n:'Desk Setup',d:'Desks, computers, desk items, chairs',keys:'DCIR',ic:'&#128421;&#65039;'},{id:'flex',n:'Flex',d:'Titles, name tags, entrances, auras',keys:'TNEV',ic:'&#10024;'},
 {id:'moves',n:'Moves',d:'New emotes for the floor',keys:'em',ic:'&#128378;'},{id:'ride',n:'Garage',d:'Cars to drive around the floor',keys:'W',ic:'&#127950;&#65039;'},
 {id:'fly',n:'Hangar',d:'Planes',keys:'F',ic:'&#9992;&#65039;'},{id:'arsenal',n:'Arsenal',d:'Toy blasters for the firing range',keys:'J',ic:'&#127919;'},
 {id:'vault',n:'Vault',d:'Anything from every category',keys:'*',ic:'&#128142;'}];
var ETIERS=[{id:'std',n:'Standard',p:400,o:{common:55,uncommon:28,rare:12,epic:4,legendary:.9,mythic:.1},tc:'#9aa3ad',g:'Any rarity'},
 {id:'rare',n:'Rare',p:1000,o:{rare:70,epic:22,legendary:7,mythic:1},tc:'#3fa9ff',g:'Rare or better, guaranteed'},
 {id:'epic',n:'Epic',p:2500,o:{epic:80,legendary:17,mythic:3},tc:'#b55cff',g:'Epic or better, guaranteed'},
 {id:'leg',n:'Legendary',p:6000,o:{legendary:88,mythic:12},tc:'#ffb020',g:'Legendary or better, guaranteed'}];
/* Battle Pass bonus track: planes and blasters you unlock with XP (they are in crates too) */
var BPX=[[5,'J',2],[10,'F',1],[15,'J',1],[22,'F',3],[28,'J',7],[35,'F',4],[42,'J',6],[50,'F',6],[60,'J',9],[70,'F',8],[85,'J',10],[95,'F',10]];
var EDUP=.35,ESTART=500;
/* ---------- catalog ---------- */
function ecoCos(){try{return VO3&&VO3.COS?VO3.COS:{}}catch(e){return{}}}
function ecoCrem(){try{return VO3&&VO3.CREM?VO3.CREM:[]}catch(e){return[]}}
var ECAT=null;function ecoCat(){if(ECAT&&ECAT.length)return ECAT;const C=ecoCos(),L=[];
 Object.keys(ECR).forEach(k=>{if(k==='em'){ecoCrem().forEach(e=>{const r=ECR.em[e[0]];if(r)L.push({id:'em:'+e[0],k:'em',v:e[0],nm:e[2],ic:e[1],rar:ERN[r]})});return}
   Object.keys(ECR[k]).forEach(v=>{const nm=C[k]&&C[k][+v];if(nm)L.push({id:k+v,k,v:+v,nm,rar:ERN[ECR[k][v]]})})});
 L.forEach(it=>{it.cat=(ECATS.find(c=>c.keys.indexOf(it.k)>=0||c.keys===it.k)||{}).id||'vault';it.price=it.rar==='mythic'?0:EPR[it.rar]});ECAT=L;return L}
function ecoIt(id){return ecoCat().find(x=>x.id===id)||null}
function ecoPool(cat){const L=ecoCat();return cat==='vault'?L.slice():L.filter(x=>x.cat===cat)}
/* ---------- ownership ---------- */
function ecoKey(n){return fileKey(bpName(n||WHO))}
function ecoClean(v){const o={own:{},spent:0,ref:0,n:0,log:[]};if(!v||typeof v!=='object')return o;if(v.own&&typeof v.own==='object')Object.keys(v.own).forEach(k=>{if(/^([A-Za-z]\d{1,2}|em:[a-z]{2,12})$/.test(k)&&v.own[k])o.own[k]=1});
 o.spent=Math.max(0,Math.round(+v.spent||0));o.ref=Math.max(0,Math.round(+v.ref||0));o.n=Math.max(0,Math.round(+v.n||0));o.nm=String(v.nm||'').slice(0,40);
 if(Array.isArray(v.log))o.log=v.log.slice(0,40).filter(x=>x&&typeof x==='object').map(x=>({t:String(x.t||'').slice(0,2),c:String(x.c||'').slice(0,10),ti:String(x.ti||'').slice(0,6),k:String(x.k||'').slice(0,16),r:String(x.r||'').slice(0,10),d:x.d?1:0,p:Math.round(+x.p||0),at:+x.at||0}));return o}
function ecoMine(){return ECO.inv[ecoKey(WHO)]||ecoClean(null)}
function ecoLvl(){const n=Date.now();if(n-ECO.lvlT>3000){ECO.lvlT=n;try{ECO.lvl=bpMe().lvl}catch(e){ECO.lvl=0}}return ECO.lvl}
function ecoBX(k,v){const l=ecoLvl();return BPX.some(r=>r[0]<=l&&r[1]===k&&r[2]===v)}
function ecoHas(k,v){if(BP.pv&&bpOwner())return true;const o=ecoMine().own;if(o[k==='em'?'em:'+v:k+v])return true;return k==='em'?false:ecoBX(k,+v)}
var ECOBP=null,ECBA={t:0,A:null};function ecoBPA(){const n=Date.now();if(!ECBA.A||n-ECBA.t>2000){ECBA.t=n;try{ECBA.A=(ECOBP||bpApi)()}catch(e){ECBA.A={has:()=>false,em:()=>false}}}return ECBA.A}
function ecoOwned(k,v){if(ecoHas(k,v))return true;try{const A=ecoBPA();return k==='em'?A.em(v):A.has(k,+v)}catch(e){return false}}
/* ---------- credits ---------- */
function ecoEarn(n0){const n=bpName(n0),P=[],add=(k,l,rate,cnt,cr)=>P.push({k,l,rate,n:cnt,cr:Math.max(0,Math.round(cr))});
 const day={};(D.activity||[]).forEach(a=>{if(a.ag!==n)return;const o=day[a.d]||(day[a.d]={h:0,c:0,a:0});o.h+=+a.h||0;o.c+=+a.con||0;o.a+=+a.app||0});
 let hrs=0,con=0,app=0;Object.values(day).forEach(o=>{hrs+=Math.min(12,o.h);con+=Math.min(300,o.c);app+=Math.min(30,o.a)});
 add('s','Welcome bonus','one time',1,ESTART);add('h','Hours on the clock','8 per hour',Math.round(hrs*10)/10,hrs*8);add('c','Contacts','1 each',con,con);add('a','Appointments','8 each',app,app*8);
 const ps=(D.policies||[]).filter(p=>p.ag===n),iss=ps.filter(p=>p.st==='Issued'||p.st==='Paid');
 add('p','Policies written','40 each',ps.length,ps.length*40);add('i','Issued or paid','60 each + 1 per $50 AP',iss.length,iss.length*60+iss.reduce((s,p)=>s+(+p.ap||0),0)/50);
 let ck=0;try{const dd={};(typeof ckAll==='function'?ckAll():D.checkins||[]).forEach(c=>{if(c.ag===n)dd[c.d]=1});ck=Object.keys(dd).length}catch(e){}add('k','Daily check-ins','25 each',ck,ck*25);
 let mr=0,rp=0;try{const R=typeof MR!=='undefined'?MR:null;if(R){mr=(R.recs||[]).filter(r=>r.by===n).length;const pd={};(R.msgs||[]).forEach(m=>{if(m.who!==n)return;const d=new Date(m.at||0).toDateString();pd[d]=Math.min(10,(pd[d]||0)+1)});rp=Object.values(pd).reduce((s,x)=>s+x,0)}}catch(e){}
 add('m','Morning Recognition posted','30 each',mr,mr*30);add('r','Recognition replies','2 each, 10 a day',rp,rp*2);
 let ln=0;try{ln=typeof lnXP==='function'?lnXP(n):0}catch(e){}add('l','Learning Network','1 per 4 module XP',ln,ln/4);
 const gr=ECO.grants.filter(g=>g.to===n&&(g.by==='Cole Leckey'||g.by==='Agency Owner')),ga=gr.reduce((s,g)=>s+g.amt,0);if(gr.length)add('g','Credits from the owner','awards',gr.length,ga);
 return{total:P.reduce((s,x)=>s+x.cr,0),P}}
function ecoBal(n){const e=ecoEarn(n||WHO),iv=ECO.inv[ecoKey(n||WHO)]||ecoClean(null);return Math.max(0,Math.round(e.total+iv.ref-iv.spent))}
function ecoFmt(x){return Math.round(x).toLocaleString()}
/* ---------- shared data ---------- */
async function ecoBoot(){if(ECO.boot)return;ECO.boot=1;try{const c=globalThis.claude;if(!c||!c.use)return;const db=await c.use('db');if(!db)return;ECO.db=db;
  db.collection('inv').onSnapshot(s=>{const M={};s.docs.forEach(d=>{M[d.id]=ecoClean(d.data())});ECO.inv=M;ECO.ready=1;ecoPaint()},()=>{});
  db.collection('credg').onSnapshot(s=>{ECO.grants=s.docs.map(d=>{const v=d.data()||{};return{id:d.id,to:String(v.to||'').slice(0,40),amt:Math.max(-100000,Math.min(100000,Math.round(+v.amt||0))),note:String(v.note||'').slice(0,80),by:String(v.by||'').slice(0,40),at:+v.at||0}}).filter(g=>g.to&&g.amt).sort((a,b)=>b.at-a.at);ecoPaint()},()=>{})}catch(e){}}
function ecoSave(st,prev){const key=ecoKey(WHO);ECO.inv[key]=st;st.nm=bpName(WHO);st.at=Date.now();let p;try{p=ECO.db.doc('inv/'+key).set(st)}catch(e){p=Promise.reject(e)}return Promise.resolve(p).catch(e=>{ECO.inv[key]=prev;ecoPaint();throw e})}
function ecoRnd(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}catch(e){return Math.random()}}
/* ---------- thumbnails (real 3D renders of each item, made in the background) ---------- */
function ecoIc(it,big){if(!it)return'&#127873;';if(it.k==='T')return`<span class=ectl>${esc(it.nm)}</span>`;if(it.k==='N')return`<span class="ecbg n${it.v}"><i></i>${esc(String(bpName(WHO)).split(' ')[0])}</span>`;
 if(it.k==='E')return EEI[it.v]||EKI.E;if(it.k==='em'&&!ecoGL())return it.ic||EKI.em;return EKI[it.k]||'&#127873;'}
function ecoGL(){try{return !!(VO3&&VO3.thumb&&VO3.supported&&VO3.supported())}catch(e){return false}}
function ecoTile(it,cls){const t3=ecoGL()&&it.k!=='T'&&it.k!=='N'&&it.k!=='E';return`<span class="ecit${cls?' '+cls:''}"${t3?` data-tk="${it.k}" data-tv="${esc(String(it.v))}"`:''}>${ecoIc(it)}</span>`}
function ecoThumbs(root){if(!ecoGL()||!root)return;const els=[...root.querySelectorAll('[data-tk]:not([data-td])')];if(!els.length)return;
 const run=el=>{el.setAttribute('data-td','1');const k=el.dataset.tk,v=k==='em'?el.dataset.tv:+el.dataset.tv;let base='';try{base=bpLook()}catch(e){}
   VO3.thumb(k,v,{size:192,base,nm:bpName(WHO)}).then(u=>{if(u&&el.isConnected){el.innerHTML='';const im=new Image();im.alt='';im.src=u;el.appendChild(im)}}).catch(()=>{})};
 if(typeof IntersectionObserver==='undefined'){els.forEach(run);return}if(!ECO.io)ECO.io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){ECO.io.unobserve(e.target);run(e.target)}}),{rootMargin:'200px'});els.forEach(el=>ECO.io.observe(el))}
/* ---------- odds ---------- */
function ecoW(cat,tid){const T=ETIERS.find(t=>t.id===tid)||ETIERS[0],pool=ecoPool(cat),W={};Object.keys(T.o).forEach(r=>{if(pool.some(x=>x.rar===r))W[r]=T.o[r]});
 if(!Object.keys(W).length){const r=ERO.slice().reverse().find(r=>pool.some(x=>x.rar===r));if(r)W[r]=100}const tot=Object.values(W).reduce((s,x)=>s+x,0)||1;Object.keys(W).forEach(r=>W[r]=W[r]/tot*100);return{W,pool,T}}
function ecoRoll(cat,tid){const {W,pool}=ecoW(cat,tid);let u=ecoRnd()*100,r=null;for(const k of ERO){if(!W[k])continue;if(u<W[k]){r=k;break}u-=W[k]}if(!r)r=Object.keys(W).pop();
 const items=pool.filter(x=>x.rar===r),fresh=items.filter(x=>!ecoOwned(x.k,x.v)),L=fresh.length?fresh:items;return{it:L[Math.floor(ecoRnd()*L.length)]||pool[0],dup:!fresh.length,r}}
/* ---------- pages ---------- */
function ecoWallet(){const b=ecoBal(WHO),iv=ecoMine(),cnt=ecoCat().filter(x=>ecoOwned(x.k,x.v)).length;
 return`<div class="c ecwal"><div class=ecbal><i>C</i><div><small>YOUR CREDITS</small><b>${ecoFmt(b)}</b></div></div><div class=ecwm>Credits come from your work: hours, contacts, appointments, policies, check-ins and more. They are separate from Battle Pass XP.<br><b>${cnt}</b> of ${ecoCat().length} crate and shop items collected &middot; <b>${iv.n}</b> crates opened</div>
  <div class=ecwa><button class="btn o" onclick="ecoEarnM()">How to earn</button>${tab==='Shop'?`<button class=btn onclick="openTab('Loot Crates')">Loot Crates</button>`:`<button class=btn onclick="openTab('Shop')">Shop</button>`}</div></div>${ECO.ready||!ECO.db?'':'<p class=mut style="font-size:11px">Loading your locker...</p>'}${ECO.db?'':'<p class=mut style="font-size:11px">Crates and the shop need the live connection. Sign in on the website to use them.</p>'}`}
function ecoCratesPage(){setTimeout(()=>ecoThumbs(document.getElementById('ecw')),60);return hd('Loot Crates','Spend credits on mystery crates. The rarer the item, the harder it is to pull.',[])+`<div id=ecw>${ecoCratesInner()}</div>`}
function ecoCratesInner(){const cat=ECATS.find(c=>c.id===ECO.crate)||ECATS[8],bal=ecoBal(WHO);
 const cats=`<div class=eccats>${ECATS.map(c=>{const P=ecoPool(c.id),own=P.filter(x=>ecoOwned(x.k,x.v)).length;return`<button class="eccat${c.id===cat.id?' on':''}" onclick="ECO.crate='${c.id}';ecoPaint()"><span>${c.ic}</span><b>${esc(c.n)}</b><small>${esc(c.d)}</small><em>${own} / ${P.length} OWNED</em><i><b style="width:${P.length?(own/P.length*100).toFixed(1):0}%"></b></i></button>`}).join('')}</div>`;
 const tiers=`<div class=ectiers>${ETIERS.map(T=>{const {W}=ecoW(cat.id,T.id),can=bal>=T.p&&ECO.db&&ECO.ready;return`<div class=ectier style="--tc:${T.tc}"><small>${esc(cat.n).toUpperCase()} CRATE</small><span class=ecbox><b></b><i></i><em></em></span><h4>${T.n}</h4><p>${T.g}</p>
   <span class=ecodds>${ERO.filter(r=>W[r]).map(r=>`<b style="width:${W[r]}%;background:${ERC[r]}" title="${r} ${W[r].toFixed(1)}%"></b>`).join('')}</span><span class=ecol>${ERO.filter(r=>W[r]).map(r=>`<span style="color:${ERC[r]}">${r.toUpperCase()} ${W[r]>=10?Math.round(W[r]):W[r].toFixed(W[r]<1?2:1)}%</span>`).join('')}</span>
   <button class=btn ${can?'':'disabled'} onclick="ecoOpenAsk('${cat.id}','${T.id}')">OPEN &middot; ${ecoFmt(T.p)}</button><a onclick="ecoOddsM('${cat.id}','${T.id}')">Every item's chance</a></div>`}).join('')}</div>`;
 const feed=ecoFeed();return ecoWallet()+`<div class="c" style="margin-top:14px"><h4>Pick a crate</h4>${cats}${tiers}<p class=mut style="font-size:11px;margin:12px 0 0">You never pull something you already own until you own every item of that rarity in the crate. After that, a repeat pays back ${Math.round(EDUP*100)}% of its shop value in credits. Mythic items only come from crates.</p></div>`+
  `<div class="c" style="margin-top:14px"><h4>Team pulls</h4>${feed||'<div class=ecnone>No crates opened yet. Be the first.</div>'}</div>`}
function ecoFeed(){const L=[];Object.keys(ECO.inv).forEach(k=>{const v=ECO.inv[k];(v.log||[]).forEach(x=>{if(x.t==='c')L.push(Object.assign({who:v.nm||k},x))})});L.sort((a,b)=>b.at-a.at);
 return L.length?`<div class=ecfeed>${L.slice(0,12).map(x=>{const it=ecoIt(x.k),c=ECATS.find(z=>z.id===x.c),T=ETIERS.find(z=>z.id===x.ti),r=it?it.rar:x.r;return`<div class=ecfr style="--rc:${ERC[r]||'#888'}">${typeof av==='function'?av(x.who,30):''}<div><b>${esc(x.who)}</b><small>pulled <b style="color:${ERC[r]||'#fff'}">${esc(it?it.nm:x.k)}</b> from a ${esc(T?T.n:'')} ${esc(c?c.n:'')} crate${x.d?' (repeat, credits back)':''}</small></div><em>${String(r||'').toUpperCase()}<br>${ecoAgo(x.at)}</em></div>`}).join('')}</div>`:''}
function ecoAgo(t){const s=Math.max(0,(Date.now()-t)/1000);return s<60?'just now':s<3600?Math.floor(s/60)+'m ago':s<86400?Math.floor(s/3600)+'h ago':Math.floor(s/86400)+'d ago'}
function ecoShopPage(){setTimeout(()=>ecoThumbs(document.getElementById('ecw')),60);return hd('Shop','Spend your credits on anything for the Sales Floor. New deals every day.',[])+`<div id=ecw>${ecoShopInner()}</div>`}
function ecoShopInner(){const T=[['deals','Daily Deals'],['all','All Items'],['locker','My Locker']].concat(bpOwner()?[['owner','Award Credits']]:[]);
 const tabs=`<div class=ectabs>${T.map(([k,l])=>`<button class="${ECO.tab===k?'on':''}" onclick="ECO.tab='${k}';ecoPaint()">${l}</button>`).join('')}</div>`;
 const body=ECO.tab==='all'?ecoAll():ECO.tab==='locker'?ecoLocker():ECO.tab==='owner'&&bpOwner()?ecoOwnerTab():ecoDealsTab();return ecoWallet()+tabs+body}
function ecoPrice(it){const d=ecoDeals();const x=d.find(z=>z.it.id===it.id);return x?{p:x.p,was:it.price,off:x.off}:{p:it.price,was:0,off:0}}
function ecoCard(it,o={}){const own=ecoOwned(it.k,it.v),pr=ecoPrice(it);return`<button class=eci style="--rc:${ERC[it.rar]}" onclick="ecoItem('${esc(it.id)}')"><span class=ecrb>${it.rar.toUpperCase()}</span>${own?'<span class=ecown>OWNED</span>':pr.off&&!o.nooff?`<span class=ecoff>-${Math.round(pr.off*100)}%</span>`:''}
  ${ecoTile(it)}<b>${esc(it.nm)}</b><small>${esc(EKL[it.k]||'')}</small><em>${own?'&#10003; IN YOUR LOCKER':it.rar==='mythic'?'CRATES ONLY':(pr.was?`<s>${ecoFmt(pr.was)}</s>`:'')+ecoFmt(pr.p)+' CREDITS'}</em></button>`}
/* daily deals: the same for everyone on a given day (UTC) */
var EDL={d:'',L:[]};function ecoDeals(){const d=new Date().toISOString().slice(0,10);if(EDL.d===d&&EDL.L.length)return EDL.L;let s=Math.floor(bxH('owq-deals|'+d)*4294967296)>>>0;const rnd=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};
 const L=ecoCat().filter(x=>x.price>0);if(!L.length)return[];const top=L.filter(x=>x.rar==='epic'||x.rar==='legendary'),out=[],used={};const hero=top[Math.floor(rnd()*top.length)]||L[0];used[hero.id]=1;out.push({it:hero,off:.4,p:Math.round(hero.price*.6/10)*10,hero:1});
 for(let i=0;i<40&&out.length<7;i++){const it=L[Math.floor(rnd()*L.length)];if(used[it.id])continue;used[it.id]=1;out.push({it,off:.25,p:Math.round(it.price*.75/10)*10})}EDL={d,L:out};return out}
function ecoDealsTab(){const L=ecoDeals();if(!L.length)return'<div class=ecnone>The shop is loading.</div>';const h=L[0],it=h.it,own=ecoOwned(it.k,it.v),left=86400000-(Date.now()%86400000),hh=Math.floor(left/3600000),mm=Math.floor(left%3600000/60000);
 return`<div class="c ecdeal" style="--rc:${ERC[it.rar]};margin-top:12px">${ecoTile(it)}<div><small>DEAL OF THE DAY &middot; ${it.rar.toUpperCase()} ${esc(EKL[it.k]||'').toUpperCase()}</small><h3>${esc(it.nm)}</h3><p>40% off today only. Everyone on the Sales Floor sees it the moment you equip it.</p>
  <em><s>${ecoFmt(it.price)}</s>${ecoFmt(h.p)} credits</em><div class=pf-mb style="margin-top:12px">${own?`<button class="btn o" onclick="ecoItem('${it.id}')">In your locker</button>`:`<button class=btn onclick="ecoBuyAsk('${it.id}')">Buy now</button>`} <button class="btn o" onclick="ecoItem('${it.id}')">Look closer</button></div></div></div>
  <div class="c" style="margin-top:14px"><div class=bxtrh><h4>Today's deals &middot; 25% off</h4><small class=mut>New deals in ${hh}h ${mm}m</small></div><div class=ecgrid>${L.slice(1).map(x=>ecoCard(x.it)).join('')}</div></div>`}
function ecoAll(){const keys=Object.keys(EKL);let L=ecoCat();if(ECO.kf!=='all')L=L.filter(x=>x.k===ECO.kf);if(ECO.rf!=='all')L=L.filter(x=>x.rar===ECO.rf);if(ECO.hide)L=L.filter(x=>!ecoOwned(x.k,x.v));const q=ECO.q.trim().toLowerCase();if(q)L=L.filter(x=>x.nm.toLowerCase().indexOf(q)>=0);
 L=L.slice().sort((a,b)=>ERO.indexOf(a.rar)-ERO.indexOf(b.rar)||a.nm.localeCompare(b.nm));
 return`<div class=ecflt><button class="${ECO.kf==='all'?'on':''}" onclick="ECO.kf='all';ecoPaint()">Everything</button>${keys.map(k=>`<button class="${ECO.kf===k?'on':''}" onclick="ECO.kf='${k}';ecoPaint()">${EKL[k]}</button>`).join('')}</div>
  <div class=ecflt><select onchange="ECO.rf=this.value;ecoPaint()" aria-label="Rarity"><option value=all>Any rarity</option>${ERO.map(r=>`<option value=${r} ${ECO.rf===r?'selected':''}>${r[0].toUpperCase()+r.slice(1)}</option>`).join('')}</select>
  <input type=search placeholder="Search items" value="${esc(ECO.q)}" oninput="ECO.q=this.value;clearTimeout(ECO.qt);ECO.qt=setTimeout(()=>{ecoPaint();const s=document.querySelector('.ecflt input[type=search]');if(s){s.focus();s.setSelectionRange(s.value.length,s.value.length)}},250)" aria-label="Search items">
  <label><input type=checkbox ${ECO.hide?'checked':''} onchange="ECO.hide=this.checked?1:0;ecoPaint()"> Hide what I own</label><span class=mut style="font-size:11px">${L.length} items</span></div><div class=ecgrid>${L.map(x=>ecoCard(x)).join('')||'<div class=ecnone>Nothing matches.</div>'}</div>`}
function ecoLocker(){const G={};ecoCat().forEach(it=>{if(ecoOwned(it.k,it.v))(G[EKL[it.k]]||(G[EKL[it.k]]=[])).push(it)});let bp={};try{bp=bpCats()}catch(e){}
 const look='okshHBGDCIRTNEVWFJ';const row=it=>{const lk=look.indexOf(it.k)>=0,worn=lk&&bpWorn(it.k,+it.v);return`<div class=ecl style="--rc:${ERC[it.rar]||BPRC[it.rar]||'#888'}">${it.id?ecoTile(it):`<span class=ecit>${it.ic||'&#127873;'}</span>`}<div><b>${esc(it.nm)}</b><small>${esc(it.cat&&!it.id?it.cat:EKL[it.k]||'')}${it.t&&!it.id?' &middot; Battle Pass tier '+it.t:''}</small></div>
   ${it.k==='em'?`<button class="btn o" onclick="bpFloor()">In Emotes</button>`:lk?`<button class="btn${worn?'':' o'}" onclick="bpEquip('${it.k}',${+it.v})">${worn?'Equipped':'Equip'}</button>`:''}</div>`};
 const sec=Object.keys(G).map(k=>`<div><h5>${esc(k).toUpperCase()} (${G[k].length})</h5><div class=ecli>${G[k].map(row).join('')}</div></div>`).join('');
 const bps=Object.keys(bp).map(k=>`<div><h5>BATTLE PASS &middot; ${esc(k).toUpperCase()} (${bp[k].length})</h5><div class=ecli>${bp[k].map(row).join('')}</div></div>`).join('');
 return`<div class="c" style="margin-top:12px"><h4>My Locker</h4><p class=mut style="font-size:11px">Equip anything here and everyone on the Sales Floor sees it. You can also change it all from My look on the floor.</p><div class=eclock>${sec||'<div class=ecnone>Nothing from crates or the shop yet. Open a crate or grab a deal.</div>'}${bps}</div></div>`}
function ecoOwnerTab(){const ag=[...new Set((D.agents||[]).map(a=>a.name))].sort();const G=ECO.grants.slice(0,15);
 return`<div class="c" style="margin-top:12px"><h4>Award credits</h4><p class=mut style="font-size:11px">Reward a big week, a contest win or a milestone. The credits show up in their balance right away.</p><div class=ecgr>
  <label for=ecgto>TEAMMATE</label><select id=ecgto>${ag.map(n=>`<option>${esc(n)}</option>`).join('')}</select><label for=ecgamt>CREDITS</label><input id=ecgamt type=number min=1 max=100000 step=50 value=500>
  <label for=ecgnote>NOTE (OPTIONAL)</label><input id=ecgnote maxlength=80 placeholder="Top producer this week"><div><button class=btn onclick="ecoGrant()">Award credits</button></div></div></div>
  <div class="c" style="margin-top:14px"><h4>Recent awards</h4>${G.length?`<table class=ecodt><tr><th>When</th><th>To</th><th class=n>Credits</th><th>Note</th></tr>${G.map(g=>`<tr><td>${ecoAgo(g.at)}</td><td>${esc(g.to)}</td><td class=n><b>${ecoFmt(g.amt)}</b></td><td class=mut>${esc(g.note)}</td></tr>`).join('')}</table>`:'<div class=ecnone>No awards yet.</div>'}</div>`}
function ecoGrant(){if(!bpOwner()||!ECO.db)return;const to=(document.getElementById('ecgto')||{}).value,amt=Math.round(+(document.getElementById('ecgamt')||{}).value||0),note=String((document.getElementById('ecgnote')||{}).value||'').slice(0,80);
 if(!to||!amt||Math.abs(amt)>100000){toast('Pick a teammate and an amount.',0);return}
 ECO.db.collection('credg').doc().set({to,amt,note,by:bpName(WHO),at:Date.now()}).then(()=>{toast(ecoFmt(amt)+' credits sent to '+to+'.',1)},()=>toast('Could not save the award. Check your connection.',0))}
/* ---------- modals ---------- */
function ecoEarnM(){const e=ecoEarn(WHO),iv=ecoMine(),b=ecoBal(WHO);document.getElementById('md').innerHTML=`<div class=mb onclick="if(event.target===this)closeM()"><div class="c ecodm"><h4>How you earn credits</h4>
  <table class=ecodt><tr><th>Source</th><th>Rate</th><th class=n>Count</th><th class=n>Credits</th></tr>${e.P.map(p=>`<tr><td>${esc(p.l)}</td><td class=mut>${esc(p.rate)}</td><td class=n>${p.n}</td><td class=n><b>${ecoFmt(p.cr)}</b></td></tr>`).join('')}
  <tr><td>Repeat pulls paid back</td><td class=mut>${Math.round(EDUP*100)}% of shop value</td><td></td><td class=n><b>${ecoFmt(iv.ref)}</b></td></tr><tr><td>Spent on crates and the shop</td><td></td><td></td><td class=n><b>-${ecoFmt(iv.spent)}</b></td></tr>
  <tr class=bxtot><td><b>BALANCE</b></td><td></td><td></td><td class=n><b>${ecoFmt(b)}</b></td></tr></table><p class=mut style="font-size:11px">Credits are separate from Battle Pass XP: spending credits never lowers your tier.</p><div class=pf-mb><button class="btn o" onclick="closeM()">Close</button></div></div></div>`}
function ecoOddsM(cat,tid){const {W,pool,T}=ecoW(cat,tid),c=ECATS.find(x=>x.id===cat)||ECATS[8];const by={};pool.forEach(x=>{(by[x.rar]||(by[x.rar]=[])).push(x)});
 const rows=ERO.filter(r=>W[r]).map(r=>{const L=by[r]||[],each=W[r]/Math.max(1,L.length);return`<tr><th colspan=3 style="color:${ERC[r]}">${r.toUpperCase()} &middot; ${W[r].toFixed(W[r]<1?2:1)}% total</th></tr>`+L.map(x=>`<tr><td>${esc(x.nm)}</td><td class=mut>${esc(EKL[x.k]||'')}${ecoOwned(x.k,x.v)?' &middot; owned':''}</td><td class=n><b>${each<.1?each.toFixed(3):each.toFixed(2)}%</b></td></tr>`).join('')}).join('');
 document.getElementById('md').innerHTML=`<div class=mb onclick="if(event.target===this)closeM()"><div class="c ecodm"><h4>${esc(T.n)} ${esc(c.n)} crate &middot; every item's chance</h4><p class=mut style="font-size:11px">Price ${ecoFmt(T.p)} credits. The more an item is worth, the rarer the pull. These chances assume you own none of them yet: items you own are skipped until you have them all.</p><table class=ecodt>${rows}</table><div class=pf-mb style="margin-top:10px"><button class="btn o" onclick="closeM()">Close</button></div></div></div>`}
function ecoPvClose(){if(ECO.pv){try{ECO.pv.close()}catch(e){}ECO.pv=null}}
function ecoPv(el,it){ecoPvClose();if(!el||!it||!ecoGL()||!VO3.preview||it.k==='T'||it.k==='N'||it.k==='E')return false;let base='';try{base=bpLook()}catch(e){}el.innerHTML='';try{ECO.pv=VO3.preview(el,{k:it.k,v:it.v,base,nm:bpName(WHO)})}catch(e){ECO.pv=null}
 if(ECO.pv){const h=document.createElement('div');h.className='ecpvh';h.textContent=it.k==='em'?'IT PLAYS ON YOUR AVATAR  -  DRAG TO SPIN':'DRAG TO SPIN';el.appendChild(h)}return !!ECO.pv}
function ecoWhere(it){return it.k==='em'?'Shows up in your Emotes list on the Sales Floor.':it.k==='T'?'Shows next to your name on the Sales Floor.':it.k==='N'?'Restyles your name tag on the Sales Floor.':it.k==='E'?'Plays when you walk out of the elevator onto the floor.':it.k==='V'?'Glows around you while you talk.':
 it.k==='F'?'Flies over the back of your desk. You will fly it outside the office when flying opens.':it.k==='J'?'Rides on your hip on the Sales Floor. A toy blaster for the firing range: foam, water, bubbles and lasers only.':it.k==='W'?'Parks on your desk and pulls up when you walk in. Drive it around the floor.':'Equip it and everyone on the Sales Floor sees it.'}
function ecoItem(id){const it=ecoIt(id);if(!it)return;const own=ecoOwned(it.k,it.v),pr=ecoPrice(it),bal=ecoBal(WHO),bx=BPX.find(r=>r[1]===it.k&&r[2]===it.v),cats=ECATS.filter(c=>c.id===it.cat||c.id==='vault').map(c=>c.n).join(' or ');
 const lk='okshHBGDCIRTNEVWFJ'.indexOf(it.k)>=0;ecoPvClose();
 document.getElementById('md').innerHTML=`<div class=mb onclick="if(event.target===this){ecoPvClose();closeM()}"><div class="c ecmod" style="--rc:${ERC[it.rar]}"><div class=ecpv id=ecpv>${ecoTile(it)}</div><div><small class=ecr>${it.rar.toUpperCase()} &middot; ${esc(EKL[it.k]||'').toUpperCase()}</small><h4>${esc(it.nm)}</h4><p>${ecoWhere(it)}</p>
  <div class=ecsrc>${it.price?`<div><span>Shop</span><b>${pr.was?`<s class=mut>${ecoFmt(pr.was)}</s> `:''}${ecoFmt(pr.p)} credits</b></div>`:'<div><span>Shop</span><b>Not sold. Crates only</b></div>'}<div><span>Loot Crates</span><b>${esc(cats)}</b></div>${bx?`<div><span>Battle Pass</span><b>Free at tier ${bx[0]}</b></div>`:''}</div>
  <div class=pf-mb>${own?(lk?`<button class=btn onclick="bpEquip('${it.k}',${+it.v});ecoItem('${esc(id)}')">${bpWorn(it.k,+it.v)?'Equipped (tap to take off)':'Equip'}</button>`:`<button class=btn onclick="ecoPvClose();closeM();bpFloor()">Go to the floor</button>`)
   :it.price?`<button class=btn ${bal>=pr.p&&ECO.db&&ECO.ready?'':'disabled'} onclick="ecoBuyAsk('${esc(id)}')">Buy for ${ecoFmt(pr.p)}</button>`:''}<button class="btn o" onclick="ECO.crate='${it.cat}';ecoPvClose();closeM();openTab('Loot Crates')">See crates</button><button class="btn o" onclick="ecoPvClose();closeM()">Close</button></div>
  ${own?'<p class=mut style="font-size:11px">&#10003; In your locker.</p>':it.price&&bal<pr.p?`<p class=mut style="font-size:11px">You need ${ecoFmt(pr.p-bal)} more credits.</p>`:''}</div></div></div>`;
 setTimeout(()=>{const el=document.getElementById('ecpv');if(!ecoPv(el,it))ecoThumbs(el)},30)}
function ecoBuyAsk(id){const it=ecoIt(id);if(!it||!it.price)return;const pr=ecoPrice(it);ecoPvClose();document.getElementById('md').innerHTML=`<div class=mb onclick="if(event.target===this)closeM()"><div class="c bxm" style="--rc:${ERC[it.rar]}"><div class=bxmr>${it.rar.toUpperCase()} &middot; ${esc(EKL[it.k]||'').toUpperCase()}</div><h4>Buy ${esc(it.nm)}?</h4>
  <p>${ecoFmt(pr.p)} credits. You will have ${ecoFmt(ecoBal(WHO)-pr.p)} left.</p><div class=pf-mb><button class=btn onclick="ecoBuy('${esc(id)}')">Buy</button> <button class="btn o" onclick="closeM()">Cancel</button></div></div></div>`}
function ecoBuy(id){const it=ecoIt(id);if(!it||!it.price||ECO.busy)return;if(!ECO.db||!ECO.ready){toast('The shop is still loading. Try again in a moment.',0);return}if(ecoOwned(it.k,it.v)){toast('You already own it.',0);return}
 const pr=ecoPrice(it),bal=ecoBal(WHO);if(bal<pr.p){toast('You need '+ecoFmt(pr.p-bal)+' more credits.',0);return}ECO.busy=1;const prev=ecoMine(),st=JSON.parse(JSON.stringify(prev));st.spent+=pr.p;st.own[it.id]=1;st.log=[{t:'b',k:it.id,r:it.rar,p:pr.p,at:Date.now()}].concat(st.log||[]).slice(0,40);
 ecoSave(st,prev).then(()=>{ECO.busy=0;closeM();toast(it.nm+' is yours. Equip it from My Locker or the item card.',1);ecoPaint();ecoItem(id)},()=>{ECO.busy=0;toast('Could not buy it. Check your connection and try again.',0)})}
function ecoOpenAsk(cat,tid){const T=ETIERS.find(t=>t.id===tid),c=ECATS.find(x=>x.id===cat);if(!T||!c)return;const bal=ecoBal(WHO);if(bal<T.p){toast('You need '+ecoFmt(T.p-bal)+' more credits for that crate.',0);return}
 document.getElementById('md').innerHTML=`<div class=mb onclick="if(event.target===this)closeM()"><div class="c bxm" style="--rc:${T.tc}"><div class=bxmr>${esc(T.g).toUpperCase()}</div><h4>Open a ${esc(T.n)} ${esc(c.n)} crate?</h4><p>${ecoFmt(T.p)} credits. You will have ${ecoFmt(bal-T.p)} left. If you are on the Sales Floor, everyone sees the crate pop open over your head.</p>
  <div class=pf-mb><button class=btn onclick="ecoOpen('${cat}','${tid}')">Open it</button> <button class="btn o" onclick="closeM()">Cancel</button></div></div></div>`}
function ecoOpen(cat,tid){if(ECO.busy)return;const T=ETIERS.find(t=>t.id===tid),c=ECATS.find(x=>x.id===cat);if(!T||!c)return;if(!ECO.db||!ECO.ready){toast('Crates are still loading. Try again in a moment.',0);return}
 const bal=ecoBal(WHO);if(bal<T.p){toast('You need '+ecoFmt(T.p-bal)+' more credits.',0);return}ECO.busy=1;const R=ecoRoll(cat,tid),it=R.it,prev=ecoMine(),st=JSON.parse(JSON.stringify(prev)),ref=R.dup?Math.round(EPR[it.rar]*EDUP):0;
 st.spent+=T.p;st.n=(st.n||0)+1;if(R.dup)st.ref+=ref;else st.own[it.id]=1;st.log=[{t:'c',c:cat,ti:tid,k:it.id,r:it.rar,d:R.dup?1:0,p:T.p,at:Date.now()}].concat(st.log||[]).slice(0,40);
 ecoSave(st,prev).then(()=>{ECO.busy=0;ecoRollUI(c,T,it,R.dup,ref)},()=>{ECO.busy=0;closeM();toast('Could not open the crate. Check your connection; you were not charged.',0)})}
function ecoRollUI(c,T,it,dup,ref){const N=46,W=136,win=38,pool=ecoPool(c.id),{W:odds}=ecoW(c.id,T.id),pick=()=>{let u=Math.random()*100;for(const r of ERO){if(!odds[r])continue;if(u<odds[r]){const L=pool.filter(x=>x.rar===r);return L[Math.floor(Math.random()*L.length)]}u-=odds[r]}return pool[0]};
 const strip=[];for(let k=0;k<N;k++)strip.push(k===win?it:pick());
 document.getElementById('md').innerHTML=`<div class=mb><div class="c ecroll"><h4>${esc(T.n).toUpperCase()} ${esc(c.n).toUpperCase()} CRATE</h4><div class=ecrw><div class=ecrs id=ecrs>${strip.map(x=>`<div class=ecrc style="--rc:${ERC[x.rar]}">${ecoTile(x)}<small>${esc(x.nm)}</small></div>`).join('')}</div><i class=ecrm></i></div><div id=ecres></div></div></div>`;
 const s=document.getElementById('ecrs'),box=s.parentNode;ecoThumbs(s);try{voCrate({r:it.nm,lb:it.rar+' '+(EKL[it.k]||'')+' - '+T.n+' '+c.n+' crate',c:ERC[it.rar],d:5.6,big:it.rar==='legendary'||it.rar==='mythic'})}catch(e){}
 const target=win*W-box.clientWidth/2+W/2+(Math.random()*70-35);let ac=null;try{const AC=window.AudioContext||window.webkitAudioContext;ac=new AC()}catch(e){}
 requestAnimationFrame(()=>{s.style.transition='transform 5.6s cubic-bezier(.08,.6,.12,1)';s.style.transform=`translateX(${-target}px)`});
 let last=-1;const t0=performance.now(),done=()=>{const res=document.getElementById('ecres');if(!res)return;const big=it.rar==='legendary'||it.rar==='mythic',lk='okshHBGDCIRTNEVWFJ'.indexOf(it.k)>=0;
   res.innerHTML=`<div class="ecrev${big?' big':''}" style="--rc:${ERC[it.rar]}"><div class=ecpv id=ecpv2>${ecoTile(it)}</div><div><small>${it.rar.toUpperCase()} &middot; ${esc(EKL[it.k]||'').toUpperCase()}</small><h3>${esc(it.nm)}</h3>${dup?`<span class=ecdup>REPEAT &middot; +${ecoFmt(ref)} CREDITS BACK</span>`:'<span class=ecnew>NEW</span>'}<p class=mut style="font-size:12px">${ecoWhere(it)}</p>
    <div class=pf-mb>${!dup&&lk?`<button class=btn onclick="bpEquip('${it.k}',${+it.v});ecoPvClose();closeM();ecoPaint()">Equip now</button>`:''}${!dup&&it.k==='em'?`<button class=btn onclick="ecoPvClose();closeM();bpFloor()">Try it on the floor</button>`:''}<button class="btn o" onclick="ecoPvClose();ecoOpenAsk('${c.id}','${T.id}')">Open another</button><button class="btn o" onclick="ecoPvClose();closeM();ecoPaint()">Close</button></div></div></div>`;
   setTimeout(()=>{const el=document.getElementById('ecpv2');if(!ecoPv(el,it))ecoThumbs(el)},40);
   if(ac){const t=ac.currentTime;(big?[523,659,784,1047,1319]:[523,784]).forEach((f,j)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0,t+j*.1);g.gain.linearRampToValueAtTime(.12,t+j*.1+.02);g.gain.exponentialRampToValueAtTime(.0001,t+j*.1+.6);o.connect(g);g.connect(ac.destination);o.start(t+j*.1);o.stop(t+j*.1+.65)});setTimeout(()=>{try{ac.close()}catch(e){}},2000)}
   if(big)try{bpCelebrateCar(0)}catch(e){}ecoPaint()};
 const tick=()=>{if(!s.isConnected)return;const m=new DOMMatrix(getComputedStyle(s).transform),x=-m.m41,k=Math.floor((x+box.clientWidth/2)/W);if(k!==last){last=k;if(ac){try{const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;o.type='square';o.frequency.value=1800;g.gain.setValueAtTime(.025,t);g.gain.exponentialRampToValueAtTime(.0001,t+.04);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.05)}catch(e){}}}
   if(performance.now()-t0<5750)requestAnimationFrame(tick);else done()};requestAnimationFrame(tick)}
/* ---------- repaint ---------- */
function ecoPaint(){if(typeof tab==='undefined'||(tab!=='Loot Crates'&&tab!=='Shop'))return;const e=document.getElementById('ecw');if(!e)return;const y=window.scrollY,a=document.activeElement,isQ=a&&a.matches&&a.matches('.ecflt input[type=search]');
 e.innerHTML=tab==='Shop'?ecoShopInner():ecoCratesInner();ecoThumbs(e);if(Math.abs(window.scrollY-y)>2)window.scrollTo(0,y);if(isQ){const s=e.querySelector('.ecflt input[type=search]');if(s){s.focus();s.setSelectionRange(s.value.length,s.value.length)}}}
setInterval(()=>{try{if(typeof tab!=='undefined'&&(tab==='Loot Crates'||tab==='Shop')&&!document.querySelector('#md .mb')&&!ECO.busy)ecoPaint()}catch(e){}},20000);
/* ---------- hooks into the Battle Pass and the Sales Floor ---------- */
(function(){const w=setInterval(()=>{if(typeof voApi==='undefined'||typeof bpApi!=='function'||!voApi.bp)return;clearInterval(w);ecoBoot();if(voApi.__eco)return;voApi.__eco=1;const _b=voApi.bp;ECOBP=_b;
  voApi.bp=function(){const A=_b.apply(this,arguments)||{lvl:0,has:()=>false,em:()=>false,sig:false};return{lvl:A.lvl,has:(k,v)=>A.has(k,v)||ecoHas(k,v),em:n=>A.em(n)||ecoHas('em',n),sig:A.sig}}},300)})();
/* equip through the look code (now with planes F and blasters J) */
bpEquip=function(k,v){const o=bpTok(bpLook());if(o[k]===v&&'HBGDCIRTNEVWFJ'.indexOf(k)>=0)v=0;if(v)o[k]=v;else delete o[k];
 const code=[...'shcokapm'].filter(x=>o[x]!==undefined).map(x=>x+o[x]).join('')+[...'HBGDCIRTNEVWXYZQFJ'].filter(x=>o[x]).map(x=>x+o[x]).join('');
 try{voApi.setLook(code)}catch(e){try{VOX.ava=code;voSave()}catch(x){}}try{const m=VO3.dbg&&VO3.dbg()&&VO3.dbg().meAv;if(m)m.setLook(code)}catch(e){}
 let nm='';const it=ecoIt(k+v);if(it)nm=it.nm;else{try{const x=Object.values(bpCats()).flat().find(z=>z.k===k&&z.v===v);if(x)nm=x.nm}catch(e){}}
 toast(v?(nm||'Reward')+' equipped. Everyone on the Sales Floor sees it.':'Taken off',1);try{bpPaint()}catch(e){}ecoPaint()};
/* the Emotes panel on the floor: add the emotes you own from crates and the shop */
(function(){const w=setInterval(()=>{if(typeof voEmoPanel!=='function')return;clearInterval(w);const _p=voEmoPanel;voEmoPanel=function(){let h=_p.apply(this,arguments);try{const E=ecoCrem().filter(e=>ecoOwned('em',e[0]));
  const add=E.map(e=>`<button onclick="voEmote('${e[0]}')" title="${esc(e[2])}" class=vobp><b>${e[1]}</b><small>${esc(e[2])}</small></button>`).join('');if(add)h=h.replace('<button class=voem-t',add+'<button class=voem-t')}catch(e){}return h}},300)})();
/* Battle Pass page: a bonus track with planes and blasters */
(function(){const w=setInterval(()=>{if(typeof bpInner!=='function')return;clearInterval(w);const _i=bpInner;bpInner=function(){let h=_i.apply(this,arguments);try{const lvl=bpMe().lvl,cards=BPX.map(([t,k,v])=>{const it=ecoIt(k+v);if(!it)return'';const own=t<=lvl||(BP.pv&&bpOwner());
   return`<button class=eci style="--rc:${ERC[it.rar]}" onclick="ecoItem('${it.id}')"><span class=ecrb>TIER ${t}</span>${own?'<span class=ecown>UNLOCKED</span>':''}${ecoTile(it)}<b>${esc(it.nm)}</b><small>${esc(EKL[k])}</small><em>${own?'&#10003; YOURS':'REACH TIER '+t}</em></button>`}).join('');
   const sec=`<div class="c ecbonus"><div class=bxtrh><h4>Bonus Track &middot; planes and blasters</h4><button class="btn o" onclick="openTab('Loot Crates')">More in Loot Crates</button></div><div class=ecbrow id=ecbrow>${cards}</div></div>`;
   const i=h.indexOf('<div class="c bxcz">');h=i>=0?h.slice(0,i)+sec+h.slice(i):h+sec;setTimeout(()=>ecoThumbs(document.getElementById('ecbrow')),80)}catch(e){}return h}},300)})();
/* sidebar: Loot Crates and Shop right under the Battle Pass */
(function(){try{const ks=Object.keys(views),i=ks.indexOf('Battle Pass')>=0?ks.indexOf('Battle Pass'):ks.indexOf('Leaderboard');if(i<0||views['Shop'])return;const rest=ks.slice(i+1).map(k=>[k,views[k]]);rest.forEach(([k])=>delete views[k]);const sec=views[ks[i]][2];
  views['Loot Crates']=[ecoCratesPage,'&#127873;',sec,'Mystery crates for credits'];views['Shop']=[ecoShopPage,'&#128722;',sec,'Spend credits on floor gear'];rest.forEach(([k,v])=>views[k]=v)}catch(e){}})();
/*ECOend*/
