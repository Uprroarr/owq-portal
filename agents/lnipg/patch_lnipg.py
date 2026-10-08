"""Learning Network: Insurance Product Guide = study the PDF; opening it completes the section. Base -> new base."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';D=SP+'/agents/lnipg'
B=os.environ.get('OWQ_BASE',SP+'/v96-final.html');O=os.environ.get('OWQ_OUT',SP+'/v97-final.html')
s=open(B,encoding='utf-8').read();assert '/*LNIPG' not in s
js=open(D+'/lnipg.js',encoding='utf-8').read();assert all(ord(c)<128 for c in js)
s=s.rstrip('\n');assert s.endswith('</script>');s=s+'\n<script>\n'+js+'</script>\n'
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
