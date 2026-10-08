#!/usr/bin/env python3
"""Assemble the portal with the New Broker Blueprint engine. Base = v71-base.html (published v71)."""
import os,re,subprocess,sys,json
SP=os.path.dirname(os.path.abspath(__file__))
BASE=os.path.join(SP,'v71-base.html')
OUT=os.environ.get('OWQ_OUT','/mnt/user-data/outputs/owq-command-station-v2.html')
subprocess.check_call([sys.executable,os.path.join(SP,'bp','build_data.py')])
s=open(BASE,encoding='utf-8').read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old)
    assert n==cnt,'expected %d match(es) but found %d for: %s'%(cnt,n,old[:90])
    s=s.replace(old,new)
# 1) CSS
css=open(os.path.join(SP,'bp','bp.css'),encoding='utf-8').read()
rep('</style><canvas id=bgc>',css+'\n</style><canvas id=bgc>')
# 2) LN state
rep("let LN={id:null,step:0,mode:'lesson',rv:{},sn:{},eq:{h:1,l:1,s:1},day:null,qs:null,qi:0,pick:null,right:0,pv:0,anim:1,cv:0,bv:0,res:null};",
    "let LN={id:null,step:0,mode:'lesson',rv:{},sn:{},cp:{},miss:{},dp:0,tx:0,snU:null,eq:{h:1,l:1,s:1},day:null,qs:null,qi:0,pick:null,right:0,pv:0,anim:1,cv:0,bv:0,res:null};")
# 3) engine
eng=open(os.path.join(SP,'bp','bp_engine.js'),encoding='utf-8').read()
data=open(os.path.join(SP,'bp','lnbp.json')).read()
assert '__LNBP__' in eng
eng=eng.replace('__LNBP__',data)
rep("/* ===== ACTIONS ===== */\nfunction lnR(top)",eng+"\n/* ===== ACTIONS ===== */\nfunction lnR(top)")
# 4) open: per-user state + resume
rep("LN.id=id;LN.trk=s.tr;LN.trkU=WHO;LN.step=0;LN.mode='lesson';LN.anim=1;LN.day=",
    "lnUserSync();LN.id=id;LN.trk=s.tr;LN.trkU=WHO;LN.step=0;LN.mode='lesson';lnBpEnter(id);LN.anim=1;LN.day=")
# 5) navigation honours the Blueprint gates and remembers the step
rep("const sl=m.slides[LN.step],need=sl.gate||0;if(d>0&&need&&lnRvN()<need)return;LN.step=Math.max(0,Math.min(m.slides.length-1,LN.step+d));LN.anim=1;lnR(1)}",
    "const need=lnNeed(m,LN.step);if(d>0&&need&&lnRvN()<need)return;LN.step=Math.max(0,Math.min(m.slides.length-1,LN.step+d));lnProgSave();LN.anim=1;lnR(1)}")
rep("for(let k=0;k<i;k++){const g=m.slides[k].gate;if(g&&lnRvN(k)<g)return}LN.step=i;LN.anim=1;lnR(1)}",
    "for(let k=0;k<i;k++){const g=lnNeed(m,k);if(g&&lnRvN(k)<g)return}LN.step=i;lnProgSave();LN.anim=1;lnR(1)}")
# 6) quiz: escaped data, page references, 80% pass for the Blueprint
rep("LN.qs=lnShuf(m.quiz).map(q=>({q:q.q,e:q.e,o:lnShuf(q.o.map((t,i)=>({t,ok:i===q.a})))}));",
    "const F=m.bp?lnXs:x=>x;LN.qs=lnShuf(m.quiz).map(q=>({q:F(q.q),e:F(q.e),p:q.p,o:lnShuf(q.o.map((t,i)=>({t:F(t),ok:i===q.a})))}));")
rep("n=LN.qs.length,need=Math.ceil(n*.75),pass=LN.right>=need;","n=LN.qs.length,need=lnNeedPass(m,n),pass=LN.right>=need;")
rep("return lnTop(m)+`<div class=lnqp>","return lnTop(m)+(m.bp?lnJourney(m,2):'')+`<div class=lnqp>")
rep("${Math.ceil(n*.75)} needed to pass","${lnNeedPass(m,n)} needed to pass")
rep("<b>${q.o[pk].ok?'Correct.':'Not quite.'}</b> ${q.e}</div>`:''}</div>",
    "<b>${q.o[pk].ok?'Correct.':'Not quite.'}</b> ${q.e}</div>${!q.o[pk].ok&&q.p&&m.bp?lnPgChip(q.p,'REVIEW IT IN THE DOCUMENT'):''}`:''}</div>")
# 7) lesson delegate
rep("function lnLesson(m){const n=m.slides.length,","function lnLesson(m){if(m.bp)return lnBpLesson(m);const n=m.slides.length,")
# 8) results
rep("""<button class="btn o" onclick="LN.mode='lesson';LN.step=0;LN.anim=1;lnR(1)">Review lesson</button>""",
    """${m.bp?`<button class="btn o" onclick="LN.mode='lesson';LN.step=0;LN.anim=1;lnR(1)">Review the document</button>`:''}<button class="btn o" onclick="LN.mode='lesson';LN.step=${m.bp?1:0};LN.anim=1;lnR(1)">${m.bp?'Review the walkthrough':'Review lesson'}</button>""")
rep("""View the document</button>`:''}""","""View the document</button>`:''}${m.bp?`<button class="btn o" onclick="LN.mode='lesson';LN.step=0;LN.anim=1;lnR(1)">Review the document</button>`:''}""")
open(OUT,'w',encoding='utf-8').write(s)
print('wrote',OUT,len(s))
