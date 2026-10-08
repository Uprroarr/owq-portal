"""YouTube link on the Sales Floor TV: synced watch-together, each person plays their own copy with their own volume. Base -> new base (also swaps in the VO3 lib with tvRect)."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';D=SP+'/agents/ytw'
B=os.environ['OWQ_BASE'];O=os.environ['OWQ_OUT'];LIB=os.environ.get('OWQ_LIB',SP+'/vo/dist/vo.yt.js')
s=open(B,encoding='utf-8').read();assert '/*YTWstart' not in s
def rep(o,n,c=1):
    global s
    k=s.count(o);assert k==c,(k,c,o[:90]);s=s.replace(o,n)
lib=open(LIB,encoding='utf-8').read().strip();assert '</script' not in lib and 'tvRect' in lib
i=s.index('<script>/*VO3lib*/')+len('<script>/*VO3lib*/');j=s.index('</script>',i);s=s[:i]+lib+s[j:]
rep("${can?b(!!VC.scr,I.screen,VC.scr?'Stop sharing':'Share screen to the TV','vcScr()'):''}",
    "${b(!!VC.scr||!!ytMine()||VOX.pop==='share',I.screen,VC.scr?'Sharing your screen':ytMine()?'Playing a video on the TV':'Put something on the TV',\"voPop('share')\")}")
rep("return`${VOX.pop==='emo'?voEmoPanel():","return`${VOX.pop==='share'&&typeof voSharePanel==='function'?voSharePanel():VOX.pop==='emo'?voEmoPanel():")
rep("X=window.SNDX={};","X=window.SNDX={};X.ssVol=function(n){return sq(lvl('m')*lvl('ss')*pp(n?'scr:'+n:''))};")
rep("scr:!!(x.scr&&x.ss)","scr:!!((x.scr&&x.ss)||(x.yt&&x.yt.v))")
css=open(D+'/ytw.css',encoding='utf-8').read();js=open(D+'/ytw.js',encoding='utf-8').read();assert all(ord(c)<128 for c in css+js)
a='</style><canvas id=bgc>';assert s.count(a)==1;s=s.replace(a,css+a)
s=s.rstrip('\n');assert s.endswith('</script>');s=s+'\n<script>\n'+js+'</script>\n'
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
