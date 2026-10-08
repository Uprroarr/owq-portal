"""Toss-out-the-window emote: new 3D office library (vo/dist/vo.toss.js) + portal glue + picker. Base -> new base."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';D=SP+'/agents/toss'
B=os.environ.get('OWQ_BASE',SP+'/v80-final.html');O=os.environ.get('OWQ_OUT',SP+'/v81-final.html')
s=open(B,encoding='utf-8').read()
assert '/*TOSSstart*/' not in s,'already patched'
def rep(old,new,count=1):
    global s
    n=s.count(old);assert n==count,('anchor',n,count,old[:80]);s=s.replace(old,new)
# 1. the 3D office library
lib=open(SP+'/vo/dist/vo.toss.js',encoding='utf-8').read().strip()
assert '</script' not in lib
i=s.index('<script>/*VO3lib*/')+len('<script>/*VO3lib*/');j=s.index('</script>',i)
s=s[:i]+lib+s[j:]
# 2. glue: the emote carries a target, people() passes it on
rep("const em=x.em&&typeof x.em==='object'?{k:String(x.em.k||'').slice(0,12),n:+x.em.n||0}:null;",
    "const em=x.em&&typeof x.em==='object'?{k:String(x.em.k||'').slice(0,12),n:+x.em.n||0,to:String(x.em.to||'').slice(0,80)}:null;")
rep(" emote(k){VOX.emN++;try{if(VC.on&&VC.room)VC.room.presence({em:{k:String(k).slice(0,12),n:VOX.emN}}).catch(()=>{})}catch(e){}return VOX.emN},",
    " emote(k,o){VOX.emN++;try{if(VC.on&&VC.room)VC.room.presence({em:{k:String(k).slice(0,12),n:VOX.emN,to:o&&o.to?String(o.to).slice(0,80):''}}).catch(()=>{})}catch(e){}return VOX.emN},")
# 3. emote panel: the toss button, and the picker in the dock
rep(""" return `<div class="vopn voem">${E.map(e=>`<button onclick="voEmote('${e[0]}')" title="${e[2]}"><b>${e[1]}</b><small>${e[2]}</small></button>`).join('')}</div>`}""",
    """ return `<div class="vopn voem">${E.map(e=>`<button onclick="voEmote('${e[0]}')" title="${e[2]}"><b>${e[1]}</b><small>${e[2]}</small></button>`).join('')}<button class=voem-t onclick="voPop('yeet')" title="Walk over, grab a teammate and throw them across the room"><b>&#128165;</b><small>THROW ACROSS THE ROOM</small></button><button class=voem-t onclick="voPop('toss')" title="Pick a teammate and toss them out the back window"><b>&#129666;</b><small>TOSS OUT THE WINDOW</small></button><button class=voem-t onclick="voEmote('plank')" title="Walk the plank out the back window (parachute included)"><b>&#127988;&#8205;&#9760;&#65039;</b><small>WALK THE PLANK</small></button></div>`}""")
rep("return`${VOX.pop==='emo'?voEmoPanel():''}${dv}${er}<div class=vod>","return`${VOX.pop==='emo'?voEmoPanel():(VOX.pop==='toss'||VOX.pop==='yeet')?voTossPanel(VOX.pop):''}${dv}${er}<div class=vod>")
rep("""${b(VOX.pop==='emo',I.smile,'Emotes',"voPop('emo')")}""","""${b(VOX.pop==='emo'||VOX.pop==='toss'||VOX.pop==='yeet',I.smile,'Emotes',"voPop(VOX.pop==='toss'||VOX.pop==='yeet'?VOX.pop:'emo')")}""")
js=open(D+'/toss.js',encoding='utf-8').read();css=open(D+'/toss.css',encoding='utf-8').read()
assert all(ord(c)<128 for c in js+css),'non-ascii'
a='</style><canvas id=bgc>';rep(a,css+a)
s=s.rstrip('\n');assert s.endswith('</script>')
s=s+'\n<script>\n'+js+'</script>\n'
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
