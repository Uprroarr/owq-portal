"""Business Portfolio page (Business Performance > Portfolio, owner only). Base -> new base."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';D=SP+'/agents/pf'
B=os.environ.get('OWQ_BASE',SP+'/v82-final.html');O=os.environ.get('OWQ_OUT',SP+'/v83-final.html')
s=open(B,encoding='utf-8').read()
assert '/*PFstart*/' not in s,'already patched'
js=open(D+'/src/pf.js',encoding='utf-8').read();css=open(D+'/src/pf.css',encoding='utf-8').read()
assert all(ord(c)<128 for c in js+css),'non-ascii'
a='</style><canvas id=bgc>';assert s.count(a)==1;s=s.replace(a,css+a)
s=s.rstrip('\n');assert s.endswith('</script>')
s=s+'\n<script>\n'+js+'</script>\n'
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
