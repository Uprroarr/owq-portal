#!/usr/bin/env python3
"""space builder: non-GX base changes (Part S3 lobby music). Apply AFTER splice.py.
env OWQ_BASE (default out/portal.html spliced), OWQ_OUT."""
import os
D=os.path.dirname(os.path.abspath(__file__))
BASE=os.environ.get('OWQ_BASE',D+'/out/portal.html');OUT=os.environ.get('OWQ_OUT',D+'/out/portal.html')
s=open(BASE,encoding='utf-8').read()
if '/*GXSstart lobby*/' in s:
    open(OUT,'w',encoding='utf-8').write(s);print('already patched');raise SystemExit
a='const LB={au:null,st:0};\n'
z="addEventListener('load',()=>{if(!ONLINE)lobbyStart()});\n"
assert s.count(a)==1 and s.count(z)==1
i=s.index(a);j=s.index(z)+len(z)
assert 0<j-i<200000 and 'function lobbyGesture' in s[i:j] and 'function lobbyStop' in s[i:j]
new=open(D+'/src/lobby.js',encoding='ascii').read()
s=s[:i]+new+s[j:]
open(OUT,'w',encoding='utf-8').write(s);print('wrote',OUT)
