"""v115.2 (cont.): Production Equation tracks a Weekly or Monthly period (toggle, remembered per browser).
Hours goal = 50 hours per workday (Mon-Fri) across 4 licensed agents (D.hDay / D.hPpl override); lead target = the weekly
lead target D.lT (default 250) per 5 workdays. The path compares the period's hours and lead spend with the pace due by today."""
import os
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
BASE = os.environ.get('OWQ_BASE', SP + '/v115.2-final.html')
OUT = os.environ.get('OWQ_OUT', BASE)
s = open(BASE, encoding='utf8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, count, old[:80]); s = s.replace(old, new)
assert 'function eqPer(' not in s, 'already patched'
rep("function eqWk(){", r"""var EQP=(()=>{try{return localStorage.getItem('owq_eqp')==='mo'?'mo':'wk'}catch(e){return'wk'}})();
function eqSetP(p){EQP=p==='mo'?'mo':'wk';try{localStorage.setItem('owq_eqp',EQP)}catch(e){}go()}
function eqPer(p){p=p||EQP;const n=new Date(),t0=new Date(n.getFullYear(),n.getMonth(),n.getDate());let a,b;if(p==='mo'){a=new Date(n.getFullYear(),n.getMonth(),1);b=new Date(n.getFullYear(),n.getMonth()+1,0)}else{const w=(t0.getDay()+6)%7;a=new Date(t0);a.setDate(t0.getDate()-w);b=new Date(a);b.setDate(a.getDate()+6)}
let wd=0,el=0;for(const d=new Date(a);d<=b;d.setDate(d.getDate()+1)){const w=d.getDay();if(w&&w<6){wd++;if(d<=t0)el++}}el=Math.max(1,el);
const ka=dkey(a),kb=dkey(b),inP=x=>x&&x.d&&x.d>=ka&&x.d<=kb,day=+D.hDay||50,ppl=+D.hPpl||4,lwk=+D.lT||250,le=D.expenses.filter(x=>inP(x)&&isLeadEx(x));
return{p,k:p==='mo'?'mo':'wk',lab:p==='mo'?'This Month':'This Week',ka,kb,wd,el,day,ppl,h:sum(D.activity.filter(inP),x=>+x.h||0),goalH:day*wd,paceH:day*el,lead:sum(le,x=>+x.amt||0),leN:le.length,leads:sum(le,x=>+x.leads||0),goalL:lwk*wd/5,paceL:lwk*el/5}}
function eqTog(){return`<div class=eqtg role=group aria-label="Tracking period"><button class="${EQP==='wk'?'on':''}" onclick="eqSetP('wk')">Weekly</button><button class="${EQP==='mo'?'on':''}" onclick="eqSetP('mo')">Monthly</button></div><style>.eqtg{display:inline-flex;border:1px solid #ff1f4f;margin:12px 0 0}.eqtg button{background:transparent;color:#d8d8e0;border:0;padding:8px 18px;font:700 12px Verdana,sans-serif;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer}.eqtg button.on{background:#ff1f4f;color:#fff;box-shadow:0 0 14px #ff1f4f88}</style>`}
function eqWk(){""")
rep("wk=eqWk(),hw=s.hrs/wk,lw=s.lead/wk,hT=D.hT||20,lT=D.lT||250", "P=eqPer(),hw=P.h,lw=P.lead,hT=P.paceH,lT=P.paceL", 2)
rep("return{hw,lw,hT,lT,has:ds.length>0,", "return{P,hw,lw,hT,lT,has:ds.length>0,")
rep("return hd('Production Equation','Where your weekly inputs put you on the growth path.',[['+ Activity',\"openM('A')\"],['+ Expense',\"openM('E')\"]])+`",
    "return hd('Production Equation','Where your hours and lead spend put you on the growth path, weekly or monthly.',[['+ Activity',\"openM('A')\"],['+ Expense',\"openM('E')\"]])+eqTog()+`")
rep("${kpi('Hours per Week',cu(hw,'n'))}", "${kpi('Hours '+P.lab,cu(hw,'n'),'Goal '+P.goalH.toLocaleString()+' hrs &middot; '+P.day+'/day across '+P.ppl+' licensed agents &middot; pace '+P.paceH.toLocaleString()+' by today')}")
rep("${kpi('Lead Spend',cu(s.lead,'$'),$(lw)+'/week &middot; '+D.expenses.filter(isLeadEx).length+' lead expenses'+(s.leadsN?' &middot; '+s.leadsN.toLocaleString()+' leads':''))}",
    "${kpi('Lead Spend '+P.lab,cu(lw,'$'),'Target '+$(P.goalL)+' &middot; '+P.leN+' lead expenses'+(P.leads?' &middot; '+P.leads.toLocaleString()+' leads':'')+' &middot; all-time '+$(s.lead))}")
rep("${bar('Hours',hw,hT,hw.toFixed(1)+' / '+hT)}${bar('Leads/wk',lw,lT,$(lw)+' / '+$(lT))}",
    "${bar('Hours',hw,P.goalH,Math.round(hw).toLocaleString()+' / '+P.goalH.toLocaleString())}${bar('Lead spend',lw,P.goalL,$(lw)+' / '+$(P.goalL))}")
rep("<small>Distance to the high mark for each input</small>", "<small>${P.lab}: ${P.el} of ${P.wd} workdays. The path compares you with the pace due by today.</small>")
rep("<span>Hours/wk <b>${(pa.hw||0).toFixed(1)}</b></span><span>Lead spend <b>${apxK(s.lead)}</b></span>",
    "<span>Hours/${pa.P.k} <b>${Math.round(pa.hw||0).toLocaleString()}</b></span><span>Leads/${pa.P.k} <b>${apxK(pa.lw)}</b></span>")
rep('fill="#9a9aa8">${$(lT)}/wk</text>', 'fill="#9a9aa8">${$(Math.round(lT))}</text>')
rep('fill="#9a9aa8">${hT}h</text>', 'fill="#9a9aa8">${Math.round(hT)}h</text>')
rep('fill="#f4f4f6">Weekly lead spend</text>', 'fill="#f4f4f6">Lead spend vs pace</text>')
rep('fill="#f4f4f6">Weekly hours</text>', 'fill="#f4f4f6">Hours vs pace</text>')
open(OUT, 'w', encoding='utf8').write(s); print('wrote', OUT, len(s))
