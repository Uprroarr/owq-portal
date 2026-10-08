"""Learning Network reminder pop-up only for the people listed in LNAG.only (Ayman). Base -> new base."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
B=os.environ.get('OWQ_BASE',SP+'/v85-final.html');O=os.environ.get('OWQ_OUT',SP+'/v85b-final.html')
s=open(B,encoding='utf-8').read()
def rep(o,n):
    global s
    assert s.count(o)==1,(s.count(o),o[:80]);s=s.replace(o,n)
rep("const LNAG={snz:0,ms:1800000};","const LNAG={snz:0,ms:1800000,only:[/^ayma[nm]\\b/i]};")
rep("function lnNagCheck(){try{if(!ONLINE||!WHO||!D.agents.some(a=>a.name===WHO))return;",
    "function lnNagCheck(){try{if(!ONLINE||!WHO||!D.agents.some(a=>a.name===WHO))return;\n if(!LNAG.only.some(r=>r.test(WHO))){const e=document.getElementById('lnn');if(e)e.remove();return}")
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
