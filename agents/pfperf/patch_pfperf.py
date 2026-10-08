"""Portfolio: Performance chart under Holdings (1D 1W 1M 3M 6M 1Y, real price history, live end point) and 30 second refresh. Base -> new base."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';D=SP+'/agents/pf/src'
B=os.environ.get('OWQ_BASE',SP+'/v89-final.html');O=os.environ.get('OWQ_OUT',SP+'/v90-final.html')
s=open(B,encoding='utf-8').read()
oj=open(D+'/pf.js.bak_perf',encoding='utf-8').read();oc=open(D+'/pf.css.bak_perf',encoding='utf-8').read()
nj=open(D+'/pf.js',encoding='utf-8').read();nc=open(D+'/pf.css',encoding='utf-8').read()
assert all(ord(c)<128 for c in nj+nc)
assert s.count(oj)==1 and s.count(oc)==1,(s.count(oj),s.count(oc))
s=s.replace(oj,nj).replace(oc,nc)
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
