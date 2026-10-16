"""v112: the owner starts with 10,000 credits. Agency Owner and Cole Leckey share one wallet (bpName maps Agency Owner to Cole
Leckey), so the one-time "Owner starting credits" line is added once to that wallet; if Cole is not on the roster the two logins
are separate wallets and each gets it. Credits only: Battle Pass XP (bpXP), tiers and everything else are unchanged.
Exact replacements with asserted counts on top of v111."""
import os
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
BASE = os.environ.get('OWQ_BASE', SP + '/v111-final.html')
OUT = os.environ.get('OWQ_OUT', SP + '/v112-final.html')
s = open(BASE, encoding='utf8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, (n, count, old[:80])
    s = s.replace(old, new)


assert 'EOWN=' not in s, 'already patched'
rep('var EDUP=.35,ESTART=500;', 'var EDUP=.35,ESTART=500,EOWN=10000;')
rep("add('s','Welcome bonus','one time',1,ESTART);",
    "add('s','Welcome bonus','one time',1,ESTART);if(n==='Cole Leckey'||n==='Agency Owner')add('o','Owner starting credits','one time',1,EOWN);")
open(OUT, 'w', encoding='utf8').write(s)
print('wrote', OUT, len(s))
