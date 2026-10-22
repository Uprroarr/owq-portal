"""v123 batch 7: people on the Sales Floor are never signed out for inactivity."""
import os
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get('OWQ_BASE', SP + '/v122-final.html'); OUT = os.environ.get('OWQ_OUT', SP + '/v123-final.html')
s = open(BASE, encoding='utf8').read(); assert '/*B7start*/' not in s
old = "10 minutes without a click, key, scroll or talking signs you out and those 10 minutes are not counted"
assert s.count(old) == 1
s = s.replace(old, "while you are on the floor you are never signed out for inactivity; off the floor, 10 minutes without a click, key or scroll signs you out")
js = open(os.path.join(HERE, 'b7.js'), encoding='utf8').read(); assert all(ord(c) < 128 for c in js)
i = s.rfind('</script>'); s = s[:i] + js + '\n' + s[i:]
open(OUT, 'w', encoding='utf8').write(s); print('wrote', OUT, len(s))
