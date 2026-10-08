"""One-time hours correction for Oct 5, 2026 (owner device applies it once). Base -> new base."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
B=os.environ.get('OWQ_BASE',SP+'/v84-final.html');O=os.environ.get('OWQ_OUT',SP+'/v84a-final.html')
s=open(B,encoding='utf-8').read()
assert '/*ADJstart*/' not in s,'already patched'
js=open(SP+'/agents/adj/adj.js',encoding='utf-8').read();assert all(ord(c)<128 for c in js)
s=s.rstrip('\n');assert s.endswith('</script>')
s=s+'\n<script>\n'+js+'</script>\n'
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
