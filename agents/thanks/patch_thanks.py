"""Two Sales Floor emotes: the thank-you trend (everyone) and Shake a screw loose (owner only).
   New 3D office library (vo/dist/vo.thanks.js), Emotes panel buttons, the owner's teammate picker. Base -> new base."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';D=SP+'/agents/thanks'
B=os.environ.get('OWQ_BASE',SP+'/v84a-final.html');O=os.environ.get('OWQ_OUT',SP+'/v85-final.html')
s=open(B,encoding='utf-8').read()
assert "voEmote('thanks')" not in s and '/*SHKstart*/' not in s,'already patched'
def rep(old,new,count=1):
    global s
    n=s.count(old);assert n==count,('anchor',n,count,old[:80]);s=s.replace(old,new)
lib=open(SP+'/vo/dist/vo.thanks.js',encoding='utf-8').read().strip()
assert '</script' not in lib
i=s.index('<script>/*VO3lib*/')+len('<script>/*VO3lib*/');j=s.index('</script>',i)
s=s[:i]+lib+s[j:]
rep("""<small>WALK THE PLANK</small></button></div>`}""",
    """<small>WALK THE PLANK</small></button><button class=voem-t onclick="voEmote('thanks')" title="The thank you trend: drop to the floor in front of everyone and do hip dips, a THANK YOU on every rep"><b>&#128591;</b><small>THANK YOU TREND</small></button>${typeof voOwnerNow==='function'&&voOwnerNow()?`<button class=voem-t onclick="voPop('shake')" title="Owner only: pick someone up and shake them until a screw falls out"><b>&#128297;</b><small>SHAKE A SCREW LOOSE</small></button>`:''}</div>`}""")
rep("(VOX.pop==='toss'||VOX.pop==='yeet')?voTossPanel(VOX.pop):''}","(VOX.pop==='toss'||VOX.pop==='yeet')?voTossPanel(VOX.pop):VOX.pop==='shake'&&typeof voShakePanel==='function'?voShakePanel():''}")
rep("""${b(VOX.pop==='emo'||VOX.pop==='toss'||VOX.pop==='yeet',I.smile,'Emotes',"voPop(VOX.pop==='toss'||VOX.pop==='yeet'?VOX.pop:'emo')")}""",
    """${b(VOX.pop==='emo'||VOX.pop==='toss'||VOX.pop==='yeet'||VOX.pop==='shake',I.smile,'Emotes',"voPop(VOX.pop==='toss'||VOX.pop==='yeet'||VOX.pop==='shake'?VOX.pop:'emo')")}""")
js=open(D+'/shake.js',encoding='utf-8').read();assert all(ord(c)<128 for c in js)
s=s.rstrip('\n');assert s.endswith('</script>')
s=s+'\n<script>\n'+js+'</script>\n'
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
