import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';D=SP+'/agents/qr'
B=os.environ.get('OWQ_BASE',SP+'/v79-final.html');O=os.environ.get('OWQ_OUT',D+'/out.html')
s=open(B,encoding='utf-8').read()
assert '/*QRstart*/' not in s,'already patched'
js=open(D+'/qr.js',encoding='utf-8').read()+open(D+'/vx.js',encoding='utf-8').read();css=open(D+'/qr.css',encoding='utf-8').read()+'.vx-snd{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 10px;padding:8px 10px;border:1px solid #ffcf4066;background:#ffcf4010}.vx-snd small{color:var(--mut)}.vx-mic{animation:qrpl 1.6s ease-in-out infinite}@keyframes qrpl{50%{box-shadow:0 0 0 4px #ff1f4f33}}.redmo .vx-mic{animation:none}\n'
assert all(ord(c)<128 for c in js+css),'non-ascii'
a='</style><canvas id=bgc>';assert s.count(a)==1;s=s.replace(a,css+a)
s=s.rstrip('\n')
assert s.endswith('</script>')
s=s+'\n<script>\n'+js+'</script>\n'
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
