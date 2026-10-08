import sys
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad/agents/space/out/'
s=open(SP+'portal.html',encoding='utf-8').read()
open(SP+'portal_m.html','w',encoding='utf-8').write('<meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">\n'+s)
