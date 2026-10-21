"""v121 batch 5: Business Performance (LLC) > Financial Statements (income statement, cash flows, balance sheet, notes,
GAAP / IFRS presentation, .xlsx for Google Sheets, CSV, print). Module agents/b5/b5.js."""
import os
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get('OWQ_BASE', SP + '/v120-final.html')
OUT = os.environ.get('OWQ_OUT', SP + '/v121-final.html')
s = open(BASE, encoding='utf8').read()
assert '/*B5start*/' not in s, 'already patched'
js = open(os.path.join(HERE, 'b5.js'), encoding='utf8').read(); css = open(os.path.join(HERE, 'b5.css'), encoding='utf8').read()
js = ''.join(c if ord(c) < 128 else '\\u%04x' % ord(c) for c in js)
assert all(ord(c) < 128 for c in css)
i = s.rfind('</script>'); s = s[:i] + js + '\n' + s[i:]
i = s.find('</style>'); s = s[:i] + css + s[i:]
open(OUT, 'w', encoding='utf8').write(s); print('wrote', OUT, len(s))
