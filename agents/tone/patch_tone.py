"""Voice tone expressions on the Sales Floor: new 3D office library (vo/dist/vo.tone.js). Base -> new base."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
B=os.environ.get('OWQ_BASE',SP+'/v85b-final.html');O=os.environ.get('OWQ_OUT',SP+'/v86-final.html')
s=open(B,encoding='utf-8').read()
lib=open(SP+'/vo/dist/vo.tone.js',encoding='utf-8').read().strip()
assert '</script' not in lib and 'VOICE EXPRESSIONS' in lib
i=s.index('<script>/*VO3lib*/')+len('<script>/*VO3lib*/');j=s.index('</script>',i)
assert 'VOICE EXPRESSIONS' not in s[i:j],'already patched'
s=s[:i]+lib+s[j:]
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
