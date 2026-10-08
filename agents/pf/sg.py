#!/usr/bin/env python3
# safe grep: prints matches with context chars, never prints lines that contain the access-code map
import sys,re
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
f=sys.argv[3] if len(sys.argv)>3 else SP+'/v80-final.html'
pat=sys.argv[1]; ctx=int(sys.argv[2]) if len(sys.argv)>2 else 100
L=open(f,encoding='utf-8',errors='replace').read().split('\n')
n=0
for i,l in enumerate(L,1):
    if 'PWD' in l and ('const PWD' in l or 'PWD={' in l): continue
    if len(l)>20000 and ('base64' in l): continue
    for m in re.finditer(pat,l):
        a=max(0,m.start()-ctx); b=min(len(l),m.end()+ctx)
        print(f'{i}:{m.start()}: {l[a:b]}')
        n+=1
        if n>60: sys.exit(0)
