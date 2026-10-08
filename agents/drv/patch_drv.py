"""Drive your car: dock button + presence for car position (Sales Floor + OWQ Speedway). Base -> new base (also swaps in the VO3 lib)."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';D=SP+'/agents/drv'
B=os.environ['OWQ_BASE'];O=os.environ['OWQ_OUT'];LIB=os.environ.get('OWQ_LIB',SP+'/vo/dist/vo.all.js')
s=open(B,encoding='utf-8').read();assert '/*DRVstart' not in s
def rep(o,n,c=1):
    global s
    k=s.count(o);assert k==c,(k,c,o[:90]);s=s.replace(o,n)
lib=open(LIB,encoding='utf-8').read().strip();assert '</script' not in lib and 'canDrive' in lib and 'OWQ SPEEDWAY' in lib
i=s.index('<script>/*VO3lib*/')+len('<script>/*VO3lib*/');j=s.index('</script>',i);s=s[:i]+lib+s[j:]
car='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14v-4l-2-5H7l-2 5z"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/><path d="M5 13h14"/></svg>'
rep("${b(!!VC.scr||!!ytMine()||VOX.pop==='share',",
    "${typeof VO3!=='undefined'&&VO3.canDrive&&VO3.canDrive()?b(VO3.driving(),'"+car+"',VO3.driving()?'Get out of the car (E)':'Drive my car','voDrive()'):''}${b(!!VC.scr||!!ytMine()||VOX.pop==='share',")
js=open(D+'/drv.js',encoding='utf-8').read();assert all(ord(c)<128 for c in js)
s=s.rstrip('\n');assert s.endswith('</script>');s=s+'\n<script>\n'+js+'</script>\n'
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
