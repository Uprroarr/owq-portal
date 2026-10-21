"""v119 batch 3: themes (Shop / Battle Pass items, Custom Designer), performance modes, Settings page, intro song upload,
simpler Leaderboard, one-screen Command Deck. Module agents/b3/b3.js."""
import os
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get('OWQ_BASE', SP + '/v118-final.html')
OUT = os.environ.get('OWQ_OUT', SP + '/v119-final.html')
s = open(BASE, encoding='utf8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, count, old[:90]); s = s.replace(old, new)
assert '/*B3start*/' not in s, 'already patched'
js = open(os.path.join(HERE, 'b3.js'), encoding='utf8').read(); css = open(os.path.join(HERE, 'b3.css'), encoding='utf8').read()
js = ''.join(c if ord(c) < 128 else '\\u%04x' % ord(c) for c in js)
assert all(ord(c) < 128 for c in css)
i = s.rfind('</script>'); s = s[:i] + js + '\n' + s[i:]
i = s.find('</style>'); s = s[:i] + css + s[i:]
# Settings is a page now (SYSTEM group): no second SYSTEM group, no old Settings button
rep("Object.values(views).forEach(v=>{if(gs.indexOf(v[2])<0)gs.push(v[2])});gs.push('SYSTEM');return gs}", "Object.values(views).forEach(v=>{if(gs.indexOf(v[2])<0)gs.push(v[2])});if(gs.indexOf('SYSTEM')<0)gs.push('SYSTEM');else{gs.splice(gs.indexOf('SYSTEM'),1);gs.push('SYSTEM')}return gs}")
rep("<button class=nv onclick=\"openM('S')\"><span>&#9881;</span>Settings<small>Goals, thresholds, backup</small></button>", "")
# sneak peeks: agents get Lead ROI instead of the LLC money card; Production Equation is Business Analytics
rep("const m=card(`openTab('Agency Performance','Statement')`,'&#9670;','Money',", "const m=!bizOwner()?b3LeadPeek(card,R):card(`openTab('Agency Performance','LLC Overview')`,'&#9670;','LLC Money',")
rep("const e=card(`openTab('Production Equation')`,'&#8721;','Production Equation',", "const e=card(`openTab('Agency Performance','Business Analytics')`,'&#8721;','Business Analytics',")
open(OUT, 'w', encoding='utf8').write(s); print('wrote', OUT, len(s))
