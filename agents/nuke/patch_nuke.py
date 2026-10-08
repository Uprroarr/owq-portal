"""Owner-only NUKE THE FLOOR button in the Sales Floor Emotes panel (the 3D side lives in vo/src/nuke.js). Base -> new base."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
B=os.environ.get('OWQ_BASE',SP+'/v86-final.html');O=os.environ.get('OWQ_OUT',SP+'/v87-final.html')
s=open(B,encoding='utf-8').read()
assert "voEmote('nuke')" not in s,'already patched'
a='''<small>SHAKE A SCREW LOOSE</small></button>`:''}'''
assert s.count(a)==1,s.count(a)
s=s.replace(a,'''<small>SHAKE A SCREW LOOSE</small></button><button class=voem-t onclick="voEmote('nuke')" title="Owner only: drop a nuke on the city outside the windows. The blast takes out the building, then the floor is rebuilt."><b>&#9762;&#65039;</b><small>NUKE THE FLOOR</small></button>`:''}''')
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
