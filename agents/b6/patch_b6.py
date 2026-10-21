"""v122 batch 6: photoreal neon city login (VO3 lib rebuilt from vo/src with cityMount), replaces the globe on the login screen."""
import os, subprocess
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
HERE = os.path.dirname(os.path.abspath(__file__)); VO = os.path.join(HERE, '..', '..', 'vo')
BASE = os.environ.get('OWQ_BASE', SP + '/v121-final.html'); OUT = os.environ.get('OWQ_OUT', SP + '/v122-final.html')
s = open(BASE, encoding='utf8').read()
assert '/*B6start*/' not in s, 'already patched'
lib = os.path.join(SP, 'vo3_b6.js')
subprocess.check_call(['bun', 'build', 'src/iife.js', '--minify', '--format=iife', '--outfile=' + lib], cwd=VO)
L = open(lib, encoding='utf8').read().strip()
L = ''.join(c if ord(c) < 128 else '\\u%04x' % ord(c) for c in L)
assert '</script' not in L.lower()
a = s.index('/*VO3lib*/') + len('/*VO3lib*/'); b = s.index('</script>', a)
s = s[:a] + L + '\n' + s[b:]
old = "const gl=initGL();"
assert s.count(old) == 1
s = s.replace(old, "if(typeof cityGo==='function'&&cityGo(host)){later(showMenu,450);return}\n const gl=initGL();")
js = open(os.path.join(HERE, 'b6.js'), encoding='utf8').read(); css = open(os.path.join(HERE, 'b6.css'), encoding='utf8').read()
js = ''.join(c if ord(c) < 128 else '\\u%04x' % ord(c) for c in js); assert all(ord(c) < 128 for c in css)
# same script element as the login code (function hoisting works within one script only)
assert s.count('\nfunction lockView(){') == 1
s = s.replace('\nfunction lockView(){', '\n' + js + '\nfunction lockView(){')
i = s.find('</style>'); s = s[:i] + css + s[i:]
open(OUT, 'w', encoding='utf8').write(s); print('wrote', OUT, len(s))
