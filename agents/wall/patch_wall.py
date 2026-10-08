"""Back wall: one left window removed, TV wall widened (2 windows each side), bigger TV centred on it. Swaps the Sales Floor library only."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
B=os.environ.get('OWQ_BASE',SP+'/v94s-final.html');O=os.environ.get('OWQ_OUT',SP+'/v98-final.html')
s=open(B,encoding='utf-8').read()
lib=open(SP+'/vo/dist/vo.wall.js',encoding='utf-8').read().strip();assert '</script' not in lib and '8.78' in lib
i=s.index('<script>/*VO3lib*/')+len('<script>/*VO3lib*/');j=s.index('</script>',i);s=s[:i]+lib+s[j:]
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
