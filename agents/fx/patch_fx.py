#!/usr/bin/env python3
"""fx: launch-style notifications (firework / missile / rocket). Two anchors only; hooks wrap popRender/beep at runtime."""
import os
HERE=os.path.dirname(os.path.abspath(__file__))
SP=os.path.abspath(os.path.join(HERE,'..','..'))
BASE=os.environ.get('OWQ_BASE',os.path.join(SP,'v77-final.html'))
OUT=os.environ.get('OWQ_OUT',os.path.join(HERE,'out','portal.html'))
s=open(BASE,encoding='utf-8').read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old)
    assert n==cnt,'expected %d match(es) but found %d for: %s'%(cnt,n,old[:90])
    s=s.replace(old,new)
rd=lambda f:open(os.path.join(HERE,'src',f),encoding='utf-8').read()
js,css=rd('nf.js'),rd('nf.css')
assert all(ord(c)<128 for c in js+css),'nf must stay ASCII'
assert '/*NFstart*/' not in s
rep('</style><canvas id=bgc>',css+'\n</style><canvas id=bgc>')
rep("const kpi=(l,v,s='')=>",js+"\nconst kpi=(l,v,s='')=>")
os.makedirs(os.path.dirname(OUT),exist_ok=True)
open(OUT,'w',encoding='utf-8').write(s)
print('wrote',OUT,len(s))
