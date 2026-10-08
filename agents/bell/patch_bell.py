#!/usr/bin/env python3
"""bell builder: Quick View in the bell rail.
Adds rail tabs ALERTS | CHAT | FLOOR (Team Chat quick view + Sales Floor quick view with cameras, shared screens and
mic/cam/share controls), a pop-out window (phone: bottom mini-player), bell badge = alerts + unread chat.

  OWQ_BASE  base portal html   (default $SP/v76-final.html)
  OWQ_OUT   output portal html (default $SP/agents/bell/out/portal.html)

Sources: src/qv.js (module, its own classic <script> appended after the main app script) and src/qv.css.
Every base edit is an exact, count-asserted replacement (see INTEGRATION.md)."""
import os,sys
HERE=os.path.dirname(os.path.abspath(__file__))
SP=os.path.abspath(os.path.join(HERE,'..','..'))
BASE=os.environ.get('OWQ_BASE',os.path.join(SP,'v76-final.html'))
OUT=os.environ.get('OWQ_OUT',os.path.join(HERE,'out','portal.html'))
s=open(BASE,encoding='utf-8').read()
if '/*QVstart*/' in s or '/*QVcss' in s:
    sys.exit('base already contains the bell Quick View (/*QVstart*/): run the patch on an unpatched base')
def rep(old,new,cnt=1):
    global s
    n=s.count(old)
    assert n==cnt,'expected %d match(es) but found %d for: %s'%(cnt,n,old[:100])
    s=s.replace(old,new)
rd=lambda f:open(os.path.join(HERE,'src',f),encoding='utf-8').read()
js=rd('qv.js');css=rd('qv.css')
assert all(ord(c)<128 for c in js+css),'injected code must stay ASCII (the page has no charset meta when opened from a file)'
assert '</script' not in js.lower() and '</style' not in css.lower()
# 1) styles: insert before the end of the main stylesheet (the anchor stays intact for other builders)
rep('</style><canvas id=bgc>',css+'\n</style><canvas id=bgc>')
# 2) floor: tell the quick view when room presence changes (the existing onPeers callback only repaints the full page)
rep("if(tab==='Team Chat'&&CH.ch==='__voice')vcPaint()})}catch(e){}}",
    "if(tab==='Team Chat'&&CH.ch==='__voice')vcPaint();if(typeof qvPeers==='function')qvPeers()})}catch(e){}}")
# 3) module: its own classic script after the main app script (shares its globals; wraps railRender/hudRender/... by reassignment)
assert s.rstrip('\n').endswith('</script>'),'base must end with the main app </script>'
s=s.rstrip('\n')+'\n<script>\n'+js.rstrip('\n')+'\n</script>\n'
os.makedirs(os.path.dirname(os.path.abspath(OUT)),exist_ok=True)
open(OUT,'w',encoding='utf-8').write(s)
print('wrote',OUT,len(s),'bytes')
