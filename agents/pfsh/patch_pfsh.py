"""v116: everyone on the team can see the Portfolio (view only). The owner's portal mirrors the portfolio (transactions,
value history, manual and last live prices; never the Finnhub / Twelve Data keys) to the shared doc pfshare/main on every save
and after price ticks (at most every 25 s). Other members read that doc: Agency Performance > Portfolio, Command Deck and revenue
include it; crypto prices refresh live in their own browser, stock prices come from the owner's last update. Guests: no access.
Only the owner can add, sell, delete, set prices or change keys."""
import os
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
BASE = os.environ.get('OWQ_BASE', SP + '/v115.2-final.html')
OUT = os.environ.get('OWQ_OUT', SP + '/v116-final.html')
s = open(BASE, encoding='utf8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, count, old[:80]); s = s.replace(old, new)
assert 'function pfCanSee(' not in s, 'already patched'
rep("function pfOwnerNow(){return !!PF.owner&&(typeof WHO!=='undefined')&&(WHO==='Cole Leckey'||WHO==='Agency Owner')}",
    "function pfOwnerNow(){return !!PF.owner&&(typeof WHO!=='undefined')&&(WHO==='Cole Leckey'||WHO==='Agency Owner')}\n"
    "function pfCanSee(){return pfOwnerNow()||(!!PF.view&&!(typeof window!=='undefined'&&window.OWQ_GUEST))}\n"
    r"""function pfLp(){const o={};Object.keys(PF.px).forEach(k=>{const P=PF.px[k];if(P&&isFinite(P.p))o[k]={p:+P.p,dp:isFinite(P.dp)?+P.dp:null,at:P.at||Date.now()}});return o}
function pfShare(d){if(PF.view||!PF.db||!pfOwnerNow())return;PF.shAt=Date.now();d=d||JSON.parse(JSON.stringify(PF.data));
 const o={v:1,tx:d.tx||[],hist:d.hist||[],mp:d.mp||{},ph:d.ph||{},seq:d.seq||0,lp:pfLp(),at:Date.now()};PF.shN=Object.keys(o.lp).length;try{PF.db.doc('pfshare/main').set(o).catch(()=>{})}catch(e){}}
function pfView(db){PF.ready=true;if(!db||(typeof window!=='undefined'&&window.OWQ_GUEST))return;PF.view=1;PF.ready=false;PF.db=db;PF.sref=db.doc('pfshare/main');
 PF.unsub=PF.sref.onSnapshot(sn=>{const d=sn&&sn.exists?sn.data():null;if(d&&typeof d==='object'){PF.data=pfClean(d);PF.shared=d.at||0;const lp=d.lp&&typeof d.lp==='object'?d.lp:{};
   Object.keys(lp).forEach(k=>{const v=lp[k];if(!v||!isFinite(v.p)||v.p<=0)return;const P=PF.px[k];if(!P||(v.at||0)>(P.at||0)||P.src==='Owner')PF.px[k]={p:+v.p,dp:v.dp==null?NaN:+v.dp,at:v.at||0,src:'Owner'}})}
  const first=!PF.ready;PF.ready=true;if(first){try{if(typeof tab!=='undefined'&&(tab==='Agency Performance'||tab==='Command Deck'))go();else if(typeof navRender==='function')navRender()}catch(e){}}else pfSoon()},()=>{PF.ready=true});
 pfStart()}
function pfRoBar(){const a=PF.shared?Math.round((Date.now()-PF.shared)/60000):-1;return`<div class="c pf-robar"><b>VIEW ONLY</b><span>Shared by the Agency Owner${a>=0?' &middot; updated '+(a<1?'just now':a<60?a+' min ago':Math.round(a/60)+' h ago'):' &middot; nothing shared yet'}. Crypto prices refresh live here; stock prices come from the owner's last update.</span></div>
<style>.pf-robar{display:flex;gap:14px;align-items:center;flex-wrap:wrap;border-left:3px solid #ff1f4f}.pf-robar b{color:#ff1f4f;letter-spacing:2px;font-size:12px}.pf-robar span{color:#cfcfd8;font-size:13px}
.pf-ro [onclick^="pfAdd"],.pf-ro [onclick^="pfDel"],.pf-ro [onclick^="pfSetPrice"],.pf-ro [onclick^="pfSettings"],.pf-ro .pf-act{display:none!important}</style>`}""")
# members who are not the owner read the shared copy
rep("if(!own){PF.ready=true;return}", "if(!own){pfView(db);return}")
rep("async function pfTick(force){if(!pfOwnerNow()||!PF.ready)return;", "async function pfTick(force){if(!pfCanSee()||!PF.ready)return;")
rep("function pfMaybe(){if(!pfOwnerNow()||!PF.ready||PF.busy)return;", "function pfMaybe(){if(!pfCanSee()||!PF.ready||PF.busy)return;")
rep("PF.last=Date.now();pfSnap();if(pfRec())pfSave();", "PF.last=Date.now();pfSnap();if(pfRec())pfSave();if(!PF.view&&(Date.now()-(PF.shAt||0)>25000||Object.keys(PF.px).length>(PF.shN||0)))pfShare();")
# saves: viewers never write; the owner's save also refreshes the shared copy
rep("function pfSave(){PF.seq=", "function pfSave(){if(PF.view)return;PF.seq=")
rep("if(PF.ref)PF.ref.set(d).catch(e=>{toast('Could not save your portfolio: '+((e&&e.code)||'error'))});",
    "if(PF.ref){PF.ref.set(d).catch(e=>{toast('Could not save your portfolio: '+((e&&e.code)||'error'))});pfShare(d)}")
for f in ["function pfAdd(t,k,sym){", "function pfDel(id){", "function pfSetPrice(k,sym){", "function pfSettings(){", "function pfSaveTx(){", "function pfSaveMp(k,sym){", "function pfSaveKey(del){"]:
    rep(f, f + "if(PF.view)return;")
rep("function pfPage(){return`<div id=pfw>${pfInner()}</div>`}", "function pfPage(){return`<div id=pfw class=\"${PF.view?'pf-ro':''}\">${PF.view?pfRoBar():''}${pfInner()}</div>`}")
rep("e.classList.add('pf-np');e.innerHTML=pfInner();", "e.classList.add('pf-np');e.innerHTML=(PF.view?pfRoBar():'')+pfInner();")
# who sees the Portfolio tab and whose revenue counts it
rep("typeof pfOwnerNow==='function'&&pfOwnerNow()?[['Agency Performance','Portfolio']]:[]", "typeof pfCanSee==='function'&&pfCanSee()?[['Agency Performance','Portfolio']]:[]")
rep("it=(k==='Agency Performance'&&typeof pfOwnerNow==='function'&&pfOwnerNow()?NSUB[k].concat('Portfolio'):NSUB[k])", "it=(k==='Agency Performance'&&typeof pfCanSee==='function'&&pfCanSee()?NSUB[k].concat('Portfolio'):NSUB[k])")
rep("typeof pfOwnerNow!=='function'||!pfOwnerNow()||!PF.data", "typeof pfCanSee!=='function'||!pfCanSee()||!PF.data")
rep("function apxOwner(){try{return typeof pfOwnerNow==='function'&&!!pfOwnerNow()}catch(e){return false}}", "function apxOwner(){try{return typeof pfCanSee==='function'&&!!pfCanSee()}catch(e){return false}}")
rep("bz=function(){const own=pfOwnerNow();", "bz=function(){const own=pfCanSee();")
# header: viewers get no Buy / Sell buttons and the right description
rep("Portfolio:'Your personal portfolio: live prices, profit and loss. Only you can see this.'}[t]||'';",
    "Portfolio:(PF.view?'The Agency Owner\\'s portfolio, shared with the team as view only.':'Your portfolio: live prices, profit and loss. Shared with the team as view only.')}[t]||'';")
rep("Portfolio:[['+ Buy',\"pfAdd('buy')\"],['Sell',\"pfAdd('sell')\"]]}[t]||[];", "Portfolio:PF.view?[]:[['+ Buy',\"pfAdd('buy')\"],['Sell',\"pfAdd('sell')\"]]}[t]||[];")
rep("return hd('Business Performance','Your personal portfolio: live prices, profit and loss. Only you can see this.',[['+ Buy',\"pfAdd('buy')\"],['Sell',\"pfAdd('sell')\"]])",
    "return hd('Business Performance',PF.view?'The Agency Owner\\'s portfolio, shared with the team as view only.':'Your portfolio: live prices, profit and loss. Shared with the team as view only.',PF.view?[]:[['+ Buy',\"pfAdd('buy')\"],['Sell',\"pfAdd('sell')\"]])")
open(OUT, 'w', encoding='utf8').write(s); print('wrote', OUT, len(s))
