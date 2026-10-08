/*BXstart: Battle Pass. 100 tiers of Sales Floor rewards, unlocked with XP earned all over the portal.
  XP is worked out from shared data everyone already has (hours, contacts, appointments, policies, check-ins, Morning Recognition,
  Learning Network), so every device agrees on everyone's tier and nothing extra is stored. Rewards are equipped through the
  Sales Floor look code, so the whole team sees them. */
var BP={pv:0,sel:0,cat:'all',seenT:0,lastLv:-1};
try{BP.pv=localStorage.getItem('owq_bp_pv')==='1'?1:0}catch(e){}
/* tier -> reward. [key,value] for look items, ['em',name] for emotes, ['sig'] for the signature emote creator */
var BPT=[null,['T',1],['k',13],['em','dab'],['H',1],['I',6],['B',1],['k',14],['H',6],['em','salute'],['D',1],
 ['T',2],['H',2],['I',5],['em','chestpound'],['o',5],['G',4],['H',3],['I',1],['em','bow'],['C',1],
 ['o',6],['k',12],['E',1],['H',7],['em','floss'],['B',4],['R',1],['N',1],['I',4],['sig'],
 ['T',3],['o',9],['H',4],['em','robot'],['D',2],['V',1],['B',5],['I',3],['o',10],['C',3],
 ['em','sprinkler'],['H',8],['G',2],['T',4],['E',2],['o',11],['I',2],['N',2],['em','griddy'],['D',4],
 ['H',5],['B',2],['o',8],['R',2],['em','airguitar'],['V',2],['T',5],['H',10],['C',2],['E',3],
 ['o',7],['I',7],['em','disco'],['G',1],['D',5],['H',9],['N',3],['B',3],['em','hypejump'],['C',4],
 ['T',6],['V',3],['k',10],['H',11],['em','moneygun'],['B',6],['I',8],['D',3],['E',4],['C',5],
 ['k',11],['G',3],['em','micdrop'],['B',7],['V',4],['T',7],['o',12],['N',4],['H',12],['R',3],
 ['k',15],['em','belt'],['E',5],['C',6],['V',5],['s',7],['D',6],['H',13],['T',8],['s',6]];
var BPCAT={o:'Outfit',k:'Outfit color',s:'Skin',H:'Hat',B:'Extra',G:'Headset',D:'Desk style',C:'Computer setup',I:'Desk item',R:'Chair',T:'Title',N:'Name tag',E:'Entrance',V:'Talking aura',em:'Emote',sig:'Signature emote'};
var BPIC={o:['','','','','','&#129509;','&#127939;','&#129333;','&#129509;','&#127936;','&#127802;','&#129466;','&#129351;'],s:['','','','','','','&#129351;','&#128142;'],
 H:['','&#129526;','&#129506;','&#128082;','&#129312;','&#127913;','&#127933;','&#129395;','&#127891;','&#9876;&#65039;','&#127988;&#8205;&#9760;&#65039;','&#128519;','&#128081;','&#128142;'],
 B:['','&#127872;','&#8986;','&#128142;','&#129492;','&#128374;&#65039;','&#129696;','&#129464;'],G:['','&#127911;','&#127911;','&#127752;','&#128049;'],
 D:['','&#11035;','&#127937;','&#10024;','&#127752;','&#129482;','&#128142;'],C:['','&#128421;&#65039;','&#128421;&#65039;','&#128421;&#65039;','&#127918;','&#128200;','&#128187;'],
 I:['','&#127942;','&#128181;','&#127755;','&#128511;','&#128276;','&#127795;','&#127870;','&#128161;'],R:['','&#127950;&#65039;','&#128188;','&#128081;'],
 E:['','&#127882;','&#128293;','&#128294;','&#128184;','&#9889;'],V:['','&#10084;&#65039;','&#128155;','&#128293;','&#9889;','&#127752;'],T:'&#127991;&#65039;',N:'&#128278;',sig:'&#11088;'};
var BPRC={uncommon:'#3ddc97',rare:'#3fa9ff',epic:'#b55cff',legendary:'#ffb020',mythic:'#ff1f4f'};
function bpCos(){try{return VO3&&VO3.COS?VO3.COS:null}catch(e){return null}}
function bpEmL(){try{return VO3&&VO3.BPEM?VO3.BPEM:[]}catch(e){return[]}}
function bpRar(t){const o=['uncommon','rare','epic','legendary','mythic'];let i=t<25?0:t<50?1:t<75?2:t<100?3:4;if(t%10===0&&i<3)i++;return o[i]}
function bpItem(t){const r=BPT[t];if(!r)return null;const C=bpCos()||{},k=r[0];let nm='',ic='';
 if(k==='em'){const e=bpEmL().find(x=>x[0]===r[1]);nm=e?e[2]:r[1];ic=e?e[1]:'&#128131;'}else if(k==='sig'){nm='Signature Emote';ic=BPIC.sig}
 else{nm=(C[k]&&C[k][r[1]])||k+r[1];ic=typeof BPIC[k]==='string'?BPIC[k]:(BPIC[k]&&BPIC[k][r[1]])||'&#127873;'}
 return{t,k,v:r[1],nm,ic,cat:BPCAT[k]||'',rar:bpRar(t)}}
/* ---------- XP ---------- */
function bpCost(t){return Math.round(80+5*t+t*t/25)}
var BPCUM=[0];for(let t=1;t<=100;t++)BPCUM[t]=BPCUM[t-1]+bpCost(t);
function bpLv(xp){let t=0;while(t<100&&BPCUM[t+1]<=xp)t++;return{lvl:t,into:xp-BPCUM[t],need:t<100?bpCost(t+1):0,max:t>=100}}
function bpName(n){return n==='Agency Owner'&&(D.agents||[]).some(a=>a.name==='Cole Leckey')?'Cole Leckey':n}
function bpXP(n0){const n=bpName(n0),P=[],add=(k,l,rate,cnt,xp)=>P.push({k,l,rate,n:cnt,xp:Math.max(0,Math.round(xp))});
 const day={};(D.activity||[]).forEach(a=>{if(a.ag!==n)return;const o=day[a.d]||(day[a.d]={h:0,c:0,a:0});o.h+=+a.h||0;o.c+=+a.con||0;o.a+=+a.app||0});
 let hrs=0,con=0,app=0;Object.values(day).forEach(o=>{hrs+=Math.min(12,o.h);con+=Math.min(300,o.c);app+=Math.min(30,o.a)});
 add('h','Hours on the clock','20 per hour',Math.round(hrs*10)/10,hrs*20);add('c','Contacts','2 each',con,con*2);add('a','Appointments','20 each',app,app*20);
 const ps=(D.policies||[]).filter(p=>p.ag===n),iss=ps.filter(p=>p.st==='Issued'||p.st==='Paid');
 add('p','Policies written','150 each',ps.length,ps.length*150);add('i','Issued or paid','100 each + 1 per $20 AP',iss.length,iss.length*100+iss.reduce((s,p)=>s+(+p.ap||0),0)/20);
 let ck=0;try{const dd={};(typeof ckAll==='function'?ckAll():D.checkins||[]).forEach(c=>{if(c.ag===n)dd[c.d]=1});ck=Object.keys(dd).length}catch(e){}add('k','Daily check-ins','40 each',ck,ck*40);
 let mr=0,rp=0;try{const R=typeof MR!=='undefined'?MR:null;if(R){mr=(R.recs||[]).filter(r=>r.by===n).length;const pd={};(R.msgs||[]).forEach(m=>{if(m.who!==n)return;const d=new Date(m.at||0).toDateString();pd[d]=Math.min(10,(pd[d]||0)+1)});rp=Object.values(pd).reduce((s,x)=>s+x,0)}}catch(e){}
 add('m','Morning Recognition posted','60 each',mr,mr*60);add('r','Recognition replies','5 each, 10 a day',rp,rp*5);
 let ln=0;try{ln=typeof lnXP==='function'?lnXP(n):0}catch(e){}add('l','Learning Network','module XP',ln,ln);
 return{total:P.reduce((s,x)=>s+x.xp,0),P}}
function bpMe(){const x=bpXP(WHO),L=bpLv(x.total);return Object.assign({xp:x.total,P:x.P},L)}
function bpOwner(){return typeof WHO!=='undefined'&&(WHO==='Cole Leckey'||WHO==='Agency Owner')}
function bpUnl(lvl){const U={};for(let t=1;t<=100;t++){if(t>lvl&&!(BP.pv&&bpOwner()))break;const r=BPT[t];U[r[0]==='em'?'em:'+r[1]:r[0]==='sig'?'sig':r[0]+r[1]]=t}
 if(BP.pv&&bpOwner()){for(let c=1;c<=10;c++)U['W'+c]=1}else BXCR.forEach((t,i)=>{if(t<=lvl)U['W'+bxCar(WHO,i)]=t});return U}
/* the Sales Floor asks this to show only what you have unlocked */
function bpApi(){const me=bpMe(),U=bpUnl(me.lvl);return{lvl:me.lvl,has:(k,v)=>!!U[k+v],em:n=>!!U['em:'+n],sig:!!U.sig}}
(function(){const w=setInterval(()=>{if(typeof voApi==='undefined')return;clearInterval(w);voApi.bp=bpApi},300)})();
/* ---------- equip (through the Sales Floor look code) ---------- */
function bpLook(){let c='';try{c=VOX.ava||''}catch(e){}if(!c){try{const m=VO3.dbg&&VO3.dbg()&&VO3.dbg().meAv;if(m)c=m.lookStr||''}catch(e){}}return c}
function bpTok(c){const o={},re=/([A-Za-z])(\d{1,2})/g;let m;while((m=re.exec(c||'')))o[m[1]]=+m[2];return o}
function bpWorn(k,v){const o=bpTok(bpLook());return(o[k]||0)===v}
function bpEquip(k,v){const o=bpTok(bpLook());if(o[k]===v&&'HBGDCIRTNEVW'.indexOf(k)>=0)v=0;if(v)o[k]=v;else delete o[k];
 const base='shcokapm',code=[...base].filter(x=>o[x]!==undefined).map(x=>x+o[x]).join('')+[...'HBGDCIRTNEVWXYZQ'].filter(x=>o[x]).map(x=>x+o[x]).join('');
 try{voApi.setLook(code)}catch(e){try{VOX.ava=code;voSave()}catch(x){}}try{const m=VO3.dbg&&VO3.dbg()&&VO3.dbg().meAv;if(m)m.setLook(code)}catch(e){}
 const it=Object.values(bpCats()).flat().find(x=>x.k===k&&x.v===(v||x.v));toast(v?(it?it.nm:'Reward')+' equipped. Everyone on the Sales Floor sees it.':'Removed',1);bpPaint()}
function bpCats(){const me=bpMe(),U=bpUnl(me.lvl),G={};for(let t=1;t<=100;t++){const it=bpItem(t);if(!it)continue;const key=it.k==='em'?'em:'+it.v:it.k==='sig'?'sig':it.k+it.v;if(!U[key])continue;(G[it.cat]||(G[it.cat]=[])).push(it)}
 for(let c=1;c<=10;c++)if(U['W'+c]&&bxOpened(c)){(G.Garage||(G.Garage=[])).push({t:U['W'+c],k:'W',v:c,nm:bxCarN(c),ic:bxSvg(c,40),cat:'Garage',rar:BXCRR[c-1]})}return G}
/* ---------- page ---------- */
function bpCard(it,lvl){const own=it.t<=lvl||(BP.pv&&bpOwner()),next=it.t===lvl+1,c=BPRC[it.rar],sw=it.k==='k'?`<i class=bxsw style="background:${(VO3.OUTC_ALL||[])[it.v]||'#888'}"></i>`:'';
 return`<button class="bxc ${it.rar}${own?' own':''}${next?' nx':''}${it.t%10===0?' ms':''}" style="--rc:${c}" onclick="bpOpen(${it.t})" id=bxc${it.t} aria-label="Tier ${it.t}: ${esc(it.nm)}${own?', unlocked':', locked'}">
  <span class=bxt>${it.t}</span>${own?'<span class=bxok>&#10003;</span>':'<span class=bxlk>&#128274;</span>'}<span class=bxi>${sw||it.ic}</span><b>${esc(it.nm)}</b><small>${esc(it.cat)}</small>${BXCR.indexOf(it.t)>=0?'<em class=bxcrb>+ LOOT CRATE</em>':''}</button>`}
function bpInner(){const me=bpMe(),lvl=me.lvl,nx=bpItem(Math.min(100,lvl+1)),pv=BP.pv&&bpOwner();
 const pct=me.max?100:Math.min(100,me.into/me.need*100),last=lvl?bpItem(lvl):null;
 const hero=`<div class="c bxh"><div class=bxbadge><small>TIER</small><b>${lvl}</b><small>OF 100</small></div><div class=bxhm><div class=bxst>SEASON 1 &middot; ONLY WINNERS</div><h3>${me.max?'You maxed out the Battle Pass':'Next up: tier '+(lvl+1)}</h3>
  <div class=bxbar><i style="width:${pct.toFixed(1)}%"></i></div><div class=bxxp><b>${me.xp.toLocaleString()} XP</b><span>${me.max?'Every reward unlocked':(me.need-me.into).toLocaleString()+' XP to tier '+(lvl+1)}</span></div>
  ${nx&&!me.max?`<div class=bxnx style="--rc:${BPRC[nx.rar]}"><span class=bxi>${nx.k==='k'?`<i class=bxsw style="background:${(VO3.OUTC_ALL||[])[nx.v]||'#888'}"></i>`:nx.ic}</span><div><small>${nx.rar.toUpperCase()} ${esc(nx.cat).toUpperCase()}</small><b>${esc(nx.nm)}</b></div></div>`:''}</div>
  <div class=bxha>${last?`<button class=btn onclick="bpOpen(${lvl})">Latest reward</button>`:''}<button class="btn o" onclick="bpFloor()">Show it off on the floor</button>${bpOwner()?`<label class=bxpv><input type=checkbox ${pv?'checked':''} onchange="bpPv(this.checked)"> Owner preview: unlock everything for me</label>`:''}</div></div>`;
 const track=`<div class="c bxtr"><div class=bxtrh><h4>Reward Track</h4><div><button class="btn o" onclick="bpScroll(-1)" aria-label="Scroll left">&#9664;</button><button class="btn o" onclick="bpScroll(1)" aria-label="Scroll right">&#9654;</button></div></div><div class=bxrow id=bxrow>${BPT.slice(1).map((r,i)=>bpCard(bpItem(i+1),lvl)).join('')}</div></div>`;
 const src=`<div class=c><h4>Where your XP comes from</h4><div class=sc><table><tr><th>Source</th><th>Rate</th><th class=n>Count</th><th class=n>XP</th></tr>${me.P.map(p=>`<tr><td>${esc(p.l)}</td><td class=mut>${esc(p.rate)}</td><td class=n>${p.n}</td><td class=n><b>${p.xp.toLocaleString()}</b></td></tr>`).join('')}<tr class=bxtot><td><b>TOTAL</b></td><td></td><td></td><td class=n><b>${me.xp.toLocaleString()}</b></td></tr></table></div><p class=mut style="font-size:11px;margin:8px 0 0">Tiers get harder as you go: tier 1 takes ${bpCost(1)} XP, tier 50 takes ${bpCost(50)}, tier 100 takes ${bpCost(100)}.</p></div>`;
 const team=[...new Set((D.agents||[]).map(a=>a.name))].map(n=>{const x=bpXP(n).total,L=bpLv(x);return{n,x,L}}).sort((a,b)=>b.x-a.x);
 const tm=`<div class=c><h4>Team Standings</h4>${team.map((r,i)=>`<div class="bxtm${r.n===bpName(WHO)?' me':''}"><span class=bxrk>${i+1}</span>${typeof av==='function'?av(r.n,30):''}<div><b>${esc(r.n)}</b><small>Tier ${r.L.lvl} &middot; ${r.x.toLocaleString()} XP</small><i class=bxmb><b style="width:${r.L.max?100:(r.L.into/r.L.need*100).toFixed(1)}%"></b></i></div><em>${r.L.lvl}</em></div>`).join('')}</div>`;
 const G=bpCats(),cats=Object.keys(G);
 const lock=`<div class="c bxlo"><h4>Your Locker</h4>${cats.length?`<div class=bxlf><button class="${BP.cat==='all'?'on':''}" onclick="BP.cat='all';bpPaint()">All</button>${cats.map(c=>`<button class="${BP.cat===c?'on':''}" onclick="BP.cat='${c}';bpPaint()">${esc(c)} (${G[c].length})</button>`).join('')}</div>
  <div class=bxlg>${cats.filter(c=>BP.cat==='all'||BP.cat===c).flatMap(c=>G[c]).map(it=>{const look='osHBGDCIRTNEVWk'.indexOf(it.k)>=0,worn=look&&bpWorn(it.k,it.v);
   return`<div class="bxli ${it.rar}" style="--rc:${BPRC[it.rar]}"><span class=bxi>${it.k==='k'?`<i class=bxsw style="background:${(VO3.OUTC_ALL||[])[it.v]||'#888'}"></i>`:it.ic}</span><div><b>${esc(it.nm)}</b><small>${esc(it.cat)} &middot; tier ${it.t}</small></div>${look?`<button class="btn${worn?'':' o'}" onclick="bpEquip('${it.k}',${it.v})">${worn?'Equipped':'Equip'}</button>`:it.k==='em'?`<button class="btn o" onclick="bpFloor()">In Emotes</button>`:`<button class="btn o" onclick="bpFloor(1)">Build it</button>`}</div>`}).join('')}</div>`
  :'<p class=mut>Your unlocked rewards show up here. Earn XP to reach tier 1.</p>'}</div>`;
 return hero+track+bxCrates(lvl)+`<div class=g2 style="margin-top:14px">${src}${tm}</div>`+lock}
function bpPage(){setTimeout(()=>{bpScrollTo();bpCheckUp()},60);return hd('Battle Pass','Season 1 &middot; Only Winners. Earn XP all over the portal and unlock rewards for the Sales Floor.',[])+`<div id=bxw>${bpInner()}</div>`}
function bpPaint(){const e=document.getElementById('bxw');if(!e||tab!=='Battle Pass')return;const r=document.getElementById('bxrow'),sl=r?r.scrollLeft:0;e.innerHTML=bpInner();const r2=document.getElementById('bxrow');if(r2)r2.scrollLeft=sl}
function bpScrollTo(){const me=bpMe(),c=document.getElementById('bxc'+Math.max(1,Math.min(100,me.lvl+1))),r=document.getElementById('bxrow');if(c&&r)r.scrollLeft=Math.max(0,c.offsetLeft-r.clientWidth/2+c.clientWidth/2)}
function bpScroll(d){const r=document.getElementById('bxrow');if(r)r.scrollBy({left:d*r.clientWidth*.8,behavior:'smooth'})}
function bpPv(on){BP.pv=on?1:0;try{localStorage.setItem('owq_bp_pv',on?'1':'0')}catch(e){}bpPaint()}
function bpFloor(look){try{openTab('Team Chat');CH.ch='__voice';go()}catch(e){}if(look)setTimeout(()=>{try{voLook()}catch(e){}},900)}
function bpOpen(t){const it=bpItem(t);if(!it)return;const me=bpMe(),own=t<=me.lvl||(BP.pv&&bpOwner()),look='osHBGDCIRTNEVk'.indexOf(it.k)>=0,need=Math.max(0,BPCUM[t]-me.xp);
 const how=it.k==='em'?'Open the Sales Floor, tap Emotes and it is in your list.':it.k==='sig'?'Open the Sales Floor, then My look. Pick a move, an emoji burst, a catchphrase and a sound. It plays from your Emotes list.':it.k==='T'?'Shows next to your name on the Sales Floor.':it.k==='N'?'Restyles your name tag on the Sales Floor.':it.k==='E'?'Plays when you walk out of the elevator onto the floor.':it.k==='V'?'Glows around you while you talk on the floor.':'Equip it and everyone on the Sales Floor sees it.';
 document.getElementById('md').innerHTML=`<div class=mb><div class="c bxm" style="--rc:${BPRC[it.rar]}"><div class=bxmi>${it.k==='k'?`<i class=bxsw style="background:${(VO3.OUTC_ALL||[])[it.v]||'#888'};width:64px;height:64px"></i>`:it.ic}</div><div class=bxmr>${it.rar.toUpperCase()} &middot; TIER ${t}</div><h4>${esc(it.nm)}</h4><p class=mut>${esc(it.cat)}</p><p>${how}</p>
  ${own?'':`<p class=bxmn>&#128274; Locked. ${need.toLocaleString()} more XP to reach tier ${t}.</p>`}<div class=pf-mb>${own&&look?`<button class=btn onclick="bpEquip('${it.k}',${it.v});closeM()">${bpWorn(it.k,it.v)?'Equipped':'Equip'}</button> `:''}${own&&(it.k==='em'||it.k==='sig')?`<button class=btn onclick="closeM();bpFloor(${it.k==='sig'?1:0})">Go to the floor</button> `:''}<button class="btn o" onclick="closeM()">Close</button></div></div></div>`}
/* ---------- tier up ---------- */
function bpKey(){return'owq_bp_seen_'+String(WHO||'').replace(/\W+/g,'_')}
function bpCheckUp(){try{if(!WHO||typeof D==='undefined'||!D.agents)return;const me=bpMe();let seen=-1;try{seen=+localStorage.getItem(bpKey())}catch(e){}if(!isFinite(seen)||seen<0||localStorage.getItem(bpKey())===null){localStorage.setItem(bpKey(),String(me.lvl));return}
  if(me.lvl>seen){localStorage.setItem(bpKey(),String(me.lvl));bpCelebrate(seen,me.lvl)}}catch(e){}}
function bpCelebrate(a,b){if(document.getElementById('bxup'))return;const L=[];for(let t=a+1;t<=b;t++){const it=bpItem(t);if(it)L.push(it)}const top=L[L.length-1];
 const d=document.createElement('div');d.id='bxup';d.innerHTML=`<div class=bxuc style="--rc:${BPRC[top?top.rar:'rare']}"><div class=bxus>BATTLE PASS</div><h2>TIER UP!</h2><div class=bxun>${b}</div>
  <div class=bxul>${L.slice(-6).map(it=>`<div><span>${it.k==='k'?`<i class=bxsw style="background:${(VO3.OUTC_ALL||[])[it.v]||'#888'}"></i>`:it.ic}</span><b>${esc(it.nm)}</b><small>${esc(it.cat)}</small></div>`).join('')}</div>
  <button class=btn onclick="document.getElementById('bxup').remove();openTab('Battle Pass')">See my rewards</button> <button class="btn o" onclick="document.getElementById('bxup').remove()">Later</button></div>${'<i class=bxcf></i>'.repeat(40)}`;
 document.body.appendChild(d);d.querySelectorAll('.bxcf').forEach((c,i)=>{c.style.left=(Math.random()*100)+'%';c.style.background=['#ff1f4f','#ffcf40','#3ddc97','#3fa9ff','#b55cff'][i%5];c.style.animationDelay=(Math.random()*.8)+'s';c.style.animationDuration=(1.8+Math.random()*1.6)+'s'});
 try{const AC=window.AudioContext||window.webkitAudioContext,ac=new AC(),t=ac.currentTime;[523,659,784,1047].forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0,t+i*.11);g.gain.linearRampToValueAtTime(.12,t+i*.11+.02);g.gain.exponentialRampToValueAtTime(.0001,t+i*.11+.5);o.connect(g);g.connect(ac.destination);o.start(t+i*.11);o.stop(t+i*.11+.55)});setTimeout(()=>ac.close(),1500)}catch(e){}}
setInterval(()=>{try{if(typeof ONLINE!=='undefined'&&ONLINE&&WHO)bpCheckUp();if(typeof tab!=='undefined'&&tab==='Battle Pass'&&Date.now()-BP.seenT>20000){BP.seenT=Date.now();bpPaint()}}catch(e){}},15000);
/* ---------- the Emotes panel on the floor: unlocked Battle Pass emotes + your signature emote ---------- */
(function(){const w=setInterval(()=>{if(typeof voEmoPanel!=='function')return;clearInterval(w);const _p=voEmoPanel;voEmoPanel=function(){let h=_p.apply(this,arguments);try{const A=bpApi(),E=bpEmL().filter(e=>A.em(e[0]));
  const add=E.map(e=>`<button onclick="voEmote('${e[0]}')" title="${esc(e[2])} (Battle Pass)" class=vobp><b>${e[1]}</b><small>${esc(e[2])}</small></button>`).join('')+(A.sig?`<button onclick="voEmote('sig')" title="Your signature emote (set it up in My look)" class=vobp><b>&#11088;</b><small>Signature</small></button>`:'');
  if(add)h=h.replace('<button class=voem-t',add+'<button class=voem-t')}catch(e){}return h}},300)})();
/* ---------- sidebar: Battle Pass right under Leaderboard ---------- */
(function(){try{const ks=Object.keys(views),i=ks.indexOf('Leaderboard');if(i<0||views['Battle Pass'])return;const rest=ks.slice(i+1).map(k=>[k,views[k]]);rest.forEach(([k])=>delete views[k]);
  views['Battle Pass']=[bpPage,'&#10022;',views['Leaderboard'][2],'100 tiers of floor rewards'];rest.forEach(([k,v])=>views[k]=v)}catch(e){}})();

/* ---------- loot crates: tiers 17, 46 and 79 each add a crate with one car inside ---------- */
var BXCR=[17,46,79],BXCRR=['common','common','uncommon','uncommon','rare','rare','epic','epic','legendary','mythic'],BXRC=Object.assign({common:'#9aa3ad'},BPRC);
var BXCC=['#8ea3b4','#eceef1','#1b2f52','#4a5a33','#f4f5f7','#1f5fd6','#c4141d','#f2c21b','#7ad321','#123a8a'],BXCT=[0,0,1,1,0,2,2,2,3,3];
function bxCarN(c){const C=bpCos();return C&&C.W?C.W[c]:'Car '+c}
function bxOdds(){try{return VO3.CARP||[30,20,14,11,9,6,4,3,2,1]}catch(e){return[30,20,14,11,9,6,4,3,2,1]}}
function bxH(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}h^=h>>>13;h=Math.imul(h,0x5bd1e995);h^=h>>>15;return(h>>>0)/4294967296}
/* each person's crate result is fixed (worked out from their name), so opening it again never changes the car */
function bxCar(n,i){const u=bxH(bpName(n)+'|owq-crate|'+i)*100,P=bxOdds();let a=0;for(let c=0;c<P.length;c++){a+=P[c];if(u<a)return c+1}return 1}
function bxKey(){return'owq_bxcr_'+String(bpName(WHO)||'').replace(/\W+/g,'_')}
function bxOpenedL(){try{const j=JSON.parse(localStorage.getItem(bxKey())||'[]');return Array.isArray(j)?j:[]}catch(e){return[]}}
function bxOpened(car){if(BP.pv&&bpOwner())return true;const L=bxOpenedL();return BXCR.some((t,i)=>L.indexOf(i)>=0&&bxCar(WHO,i)===car)}
function bxSvg(c,w){const col=BXCC[c-1]||'#888',t=BXCT[c-1]||0,h=Math.round(w*.5);const body=[
  'M4 30 L10 20 L26 13 L46 13 L58 21 L74 23 Q80 25 80 31 L80 36 L4 36 Z',
  'M3 31 L3 18 L28 18 L30 9 L52 9 L56 18 L80 20 L80 36 L3 36 Z',
  'M3 31 Q4 25 14 23 L30 16 L52 15 L66 22 L79 25 Q81 29 80 34 L3 35 Z',
  'M2 33 Q3 28 16 26 L34 18 L50 17 L64 24 L80 27 Q82 31 80 34 L2 34 Z'][t];
 return`<svg viewBox="0 0 84 44" width=${w} height=${h} aria-hidden=true><path d="${body}" fill="${col}" stroke="#000" stroke-opacity=.4 /><path d="${t===1?'M31 11 L50 11 L53 18 L30 18 Z':t===3?'M36 19 L49 18 L60 24 L34 25 Z':'M28 15 L45 15 L54 21 L24 21 Z'}" fill="#9fd8ff" fill-opacity=.55 /><circle cx=20 cy=36 r=6 fill="#111" stroke="#bbb" stroke-width=2 /><circle cx=64 cy=36 r=6 fill="#111" stroke="#bbb" stroke-width=2 /></svg>`}
function bxCrates(lvl){const L=bxOpenedL();return`<div class="c bxcz"><div class=bxtrh><h4>Loot Crates</h4><button class="btn o" onclick="bxOddsM()">Drop rates</button></div><p class=mut style="font-size:11px;margin:4px 0 12px">Three mystery crates hide in the pass at tiers ${BXCR.join(', ')}. Each one holds a car, from an old Honda Civic to a 1% Bugatti. Your ride parks on your desk and pulls up out front when you walk onto the Sales Floor.</p><div class=bxcg>${BXCR.map((t,i)=>{const ready=t<=lvl||(BP.pv&&bpOwner()),op=ready&&L.indexOf(i)>=0,car=bxCar(WHO,i),r=BXCRR[car-1];
  return op?`<div class="bxcrt op" style="--rc:${BXRC[r]}"><small>CRATE ${i+1} &middot; TIER ${t}</small><span class=bxcv>${bxSvg(car,120)}</span><b>${esc(bxCarN(car))}</b><em>${r.toUpperCase()} &middot; ${bxOdds()[car-1]}% DROP</em><button class="btn${bpWorn('W',car)?'':' o'}" onclick="bpEquip('W',${car})">${bpWorn('W',car)?'Your ride':'Make it my ride'}</button></div>`
   :`<div class="bxcrt${ready?' rd':''}"><small>CRATE ${i+1} &middot; TIER ${t}</small><span class=bxbox>&#127873;</span><b>${ready?'Ready to open':'Locked'}</b><em>${ready?'One car inside':'Reach tier '+t}</em>${ready?`<button class=btn onclick="bxOpen(${i})">OPEN CRATE</button>`:''}</div>`}).join('')}</div></div>`}
function bxOddsM(){const P=bxOdds();document.getElementById('md').innerHTML=`<div class=mb onclick="if(event.target===this)closeM()"><div class="c bxod"><h4>Loot Crate drop rates</h4><table>${P.map((p,i)=>`<tr><td>${bxSvg(i+1,54)}</td><td><b>${esc(bxCarN(i+1))}</b><small style="color:${BXRC[BXCRR[i]]}">${BXCRR[i].toUpperCase()}</small></td><td class=n><b>${p}%</b></td></tr>`).join('')}</table><p class=mut style="font-size:11px">Each crate holds exactly one car. Your results are tied to your profile, so opening a crate again shows the same car.</p><div class=pf-mb><button class="btn o" onclick="closeM()">Close</button></div></div></div>`}
function bxOpen(i){const car=bxCar(WHO,i),P=bxOdds(),N=46,W=128,pick=()=>{const u=Math.random()*100;let a=0;for(let c=0;c<P.length;c++){a+=P[c];if(u<a)return c+1}return 1};
 const strip=[];for(let k=0;k<N;k++)strip.push(k===38?car:pick());
 document.getElementById('md').innerHTML=`<div class=mb><div class="c bxrl"><h4>CRATE ${i+1}</h4><div class=bxrw><div class=bxrs id=bxrs>${strip.map(c=>`<div class=bxrc style="--rc:${BXRC[BXCRR[c-1]]}">${bxSvg(c,96)}<small>${esc(bxCarN(c))}</small></div>`).join('')}</div><i class=bxrm></i></div><div id=bxres class=bxres></div></div></div>`;
 const s=document.getElementById('bxrs'),box=s.parentNode,target=38*W-box.clientWidth/2+W/2+(Math.random()*60-30);let ac=null;try{const AC=window.AudioContext||window.webkitAudioContext;ac=new AC()}catch(e){}
 requestAnimationFrame(()=>{s.style.transition='transform 5.6s cubic-bezier(.08,.6,.12,1)';s.style.transform=`translateX(${-target}px)`});
 let last=-1;const t0=performance.now(),tick=()=>{const m=new DOMMatrix(getComputedStyle(s).transform),x=-m.m41,k=Math.floor((x+box.clientWidth/2)/W);if(k!==last){last=k;if(ac){const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;o.type='square';o.frequency.value=1800;g.gain.setValueAtTime(.025,t);g.gain.exponentialRampToValueAtTime(.0001,t+.04);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.05)}}
  if(performance.now()-t0<5700)requestAnimationFrame(tick);else done()};requestAnimationFrame(tick);
 const done=()=>{const L=bxOpenedL();if(L.indexOf(i)<0){L.push(i);try{localStorage.setItem(bxKey(),JSON.stringify(L))}catch(e){}}const r=BXCRR[car-1],big=car>=7;
  const res=document.getElementById('bxres');if(!res)return;res.style.setProperty('--rc',BXRC[r]);res.innerHTML=`<div class="bxrv${big?' big':''}"><small>${r.toUpperCase()} &middot; ${P[car-1]}% DROP</small><b>${esc(bxCarN(car))}</b></div><div class=pf-mb><button class=btn onclick="bpEquip('W',${car});closeM()">Make it my ride</button> <button class="btn o" onclick="closeM();bpPaint()">Close</button></div>`;
  if(ac){const t=ac.currentTime;(big?[523,659,784,1047,1319]:[523,784]).forEach((f,j)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0,t+j*.1);g.gain.linearRampToValueAtTime(.12,t+j*.1+.02);g.gain.exponentialRampToValueAtTime(.0001,t+j*.1+.6);o.connect(g);g.connect(ac.destination);o.start(t+j*.1);o.stop(t+j*.1+.65)});setTimeout(()=>{try{ac.close()}catch(e){}},2000)}
  if(big)try{bpCelebrateCar(car)}catch(e){}}}
function bpCelebrateCar(car){const d=document.createElement('div');d.className='bxcfw';d.innerHTML='<i class=bxcf></i>'.repeat(50);document.body.appendChild(d);d.querySelectorAll('.bxcf').forEach((c,i)=>{c.style.left=(Math.random()*100)+'%';c.style.background=['#ff1f4f','#ffcf40','#3ddc97','#3fa9ff','#b55cff'][i%5];c.style.animationDelay=(Math.random()*.6)+'s'});setTimeout(()=>d.remove(),4200)}
/*BXend*/
