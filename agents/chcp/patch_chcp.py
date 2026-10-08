"""Chat channels: paste images/files into the message box, a copy button on every message (MR replies get paste too). Base -> new base."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad';D=SP+'/agents/chcp'
B=os.environ.get('OWQ_BASE',SP+'/v92-final.html');O=os.environ.get('OWQ_OUT',SP+'/v93-final.html')
s=open(B,encoding='utf-8').read();assert '/*CHCP' not in s
def rep(o,n):
    global s
    assert s.count(o)==1,(s.count(o),o[:90]);s=s.replace(o,n)
rep('''oninput="CH.draft=this.value;chMent(this)" onkeydown="if(event.key==='Enter'){if(!chMentKey(event))chSend()}else chMentNav(event)" aria-label="Message"''',
    '''oninput="CH.draft=this.value;chMent(this)" onpaste="chPaste(event)" onkeydown="if(event.key==='Enter'){if(!chMentKey(event))chSend()}else chMentNav(event)" aria-label="Message"''')
rep('''<span class=rxp>${RX.map(([k,e])=>`<button onclick="chReact('${m.id}','${k}');chPop(this)" aria-label="React ${k}">${e}</button>`).join('')}${mine?`<button onclick="chDelMsg('${m.id}')" aria-label="Delete message" class=rxd>&times;</button>`:''}</span>''',
    '''<span class=rxp>${RX.map(([k,e])=>`<button onclick="chReact('${m.id}','${k}');chPop(this)" aria-label="React ${k}">${e}</button>`).join('')}${m.text||m.att?`<button onclick="chCopy('${m.id}',this)" aria-label="Copy message" title="Copy" class=rxcp><svg viewBox="0 0 24 24" width=14 height=14 aria-hidden=true><rect x=8 y=8 width=12 height=12 rx=2 fill=none stroke=currentColor stroke-width=2 /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" fill=none stroke=currentColor stroke-width=2 /></svg></button>`:''}${mine?`<button onclick="chDelMsg('${m.id}')" aria-label="Delete message" class=rxd>&times;</button>`:''}</span>''')
# Morning Recognition replies: paste a screenshot too
i=s.index('<input id=mri ');j=s.index('>',i);tag=s[i:j]
assert 'onpaste' not in tag and s.count(tag)==1
s=s.replace(tag,tag.replace('<input id=mri ','<input id=mri onpaste="chPaste(event,\'mr\')" '))
rep("""<div style="margin-top:12px"><button class=btn onclick="chSave('${id}')">Save to device</button>""","""<div style="margin-top:12px">${IMG.test(t)?`<button class=btn onclick="chCopyImg('${id}')">Copy picture</button> `:''}<button class=btn onclick="chSave('${id}')">Save to device</button>""")
css='.rxp .rxcp{display:inline-flex;align-items:center;justify-content:center;color:var(--mut)}.rxp .rxcp:hover{color:#fff}.rxp .rxcp.ok{color:var(--ok)}\n'
a='</style><canvas id=bgc>';assert s.count(a)==1;s=s.replace(a,css+a)
js=open(D+'/chcp.js',encoding='utf-8').read();assert all(ord(c)<128 for c in js)
s=s.rstrip('\n');assert s.endswith('</script>');s=s+'\n<script>\n'+js+'</script>\n'
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
