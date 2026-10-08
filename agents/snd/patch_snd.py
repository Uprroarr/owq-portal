"""Volume mixer: header button + panel, Sales Floor Volume button, per-teammate sliders. Base -> new base."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';D=SP+'/agents/snd'
B=os.environ.get('OWQ_BASE',SP+'/v81-final.html');O=os.environ.get('OWQ_OUT',SP+'/v82-final.html')
s=open(B,encoding='utf-8').read()
assert '/*SNDstart*/' not in s,'already patched'
js=open(D+'/snd.js',encoding='utf-8').read();css=open(D+'/snd.css',encoding='utf-8').read()
assert all(ord(c)<128 for c in js+css),'non-ascii'
a='</style><canvas id=bgc>';assert s.count(a)==1;s=s.replace(a,css+a)
s=s.rstrip('\n');assert s.endswith('</script>')
s=s+'\n<script>\n'+js+'</script>\n'
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
