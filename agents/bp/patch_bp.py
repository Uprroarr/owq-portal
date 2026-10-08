"""Battle Pass: page under Leaderboard, XP engine, locker, new Sales Floor library (cosmetics, emotes), longer look codes. Base -> new base."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';D=SP+'/agents/bp'
B=os.environ.get('OWQ_BASE',SP+'/v95-final.html');O=os.environ.get('OWQ_OUT',SP+'/v96-final.html')
s=open(B,encoding='utf-8').read();assert '/*BXstart' not in s
def rep(o,n,c=1):
    global s
    k=s.count(o);assert k==c,(k,o[:90]);s=s.replace(o,n)
lib=open(os.environ.get('OWQ_LIB',SP+'/vo/dist/vo.bp.js'),encoding='utf-8').read().strip();assert '</script' not in lib and 'Diamond Crown' in lib
i=s.index('<script>/*VO3lib*/')+len('<script>/*VO3lib*/');j=s.index('</script>',i);s=s[:i]+lib+s[j:]
rep("ava:typeof x.ava==='string'?x.ava.slice(0,40):''","ava:typeof x.ava==='string'?x.ava.slice(0,120):''")
rep("setLook(c){VOX.ava=String(c||'').slice(0,40);","setLook(c){VOX.ava=String(c||'').slice(0,120);")
css=open(D+'/bp.css',encoding='utf-8').read();js=open(D+'/bp.js',encoding='utf-8').read();assert all(ord(c)<128 for c in css+js)
a='</style><canvas id=bgc>';assert s.count(a)==1;s=s.replace(a,css+a)
s=s.rstrip('\n');assert s.endswith('</script>');s=s+'\n<script>\n'+js+'</script>\n'
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
