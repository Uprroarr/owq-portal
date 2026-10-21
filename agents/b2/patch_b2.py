"""v118 batch 2: Agency Performance in two halves (Sales Performance / Business Performance LLC, owner-only), sales-only Overview,
LLC Overview, Lead ROI (log lead buys, ROI by vendor, type and age), Business Analytics (the Production Equation, moved), Capital
(private), portfolio owner-only again, Ask Claude page + top-bar button. Module agents/b2/b2.js."""
import os
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get('OWQ_BASE', SP + '/v117-final.html')
OUT = os.environ.get('OWQ_OUT', SP + '/v118-final.html')
s = open(BASE, encoding='utf8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, count, old[:90]); s = s.replace(old, new)
assert '/*B2start*/' not in s, 'already patched'
js = open(os.path.join(HERE, 'b2.js'), encoding='utf8').read(); css = open(os.path.join(HERE, 'b2.css'), encoding='utf8').read()
js = ''.join(c if ord(c) < 128 else '\\u%04x' % ord(c) for c in js)
assert all(ord(c) < 128 for c in css)
i = s.rfind('</script>'); s = s[:i] + js + '\n' + s[i:]
i = s.find('</style>'); s = s[:i] + css + s[i:]
rep("const openTab=(k,s)=>{if(k==='Business Performance'){", "const openTab=(k,s)=>{if(k==='Production Equation'){k='Agency Performance';s='Business Analytics'}if(k==='Business Performance'){")
rep("it=(k==='Agency Performance'&&typeof pfCanSee==='function'&&pfCanSee()?NSUB[k].concat('Portfolio'):NSUB[k])", "it=NSUB[k]")
# portfolio back to owner-only (flip PF_TEAM to share it again)
rep("function pfCanSee(){return pfOwnerNow()||(!!PF.view&&", "var PF_TEAM=false;\nfunction pfCanSee(){return pfOwnerNow()||(PF_TEAM&&!!PF.view&&")
rep("function pfView(db){PF.ready=true;if(!db||", "function pfView(db){PF.ready=true;if(!PF_TEAM||!db||")
# top bar: Ask Claude next to the search
rep('<button class=srch onclick="openCP()"><span>Search or jump to...</span><kbd>Ctrl K</kbd></button>',
    '<button class=srch onclick="openCP()"><span>Search or jump to...</span><kbd>Ctrl K</kbd></button><button class=aqtb onclick="openTab(\'Ask Claude\')" title="Ask Claude: quick answers, web search, task lists"><i>&#10022;</i><span>Ask Claude</span></button>')
# the top ticker: agents see sales numbers only (the LLC money is owner-only)
rep("it=[['ISSUED PREMIUM',$(s.issAP)],['INCOME',$(s.rev)],['NET PROFIT',$(s.net)],", "it=[['ISSUED PREMIUM',$(s.issAP)],...((typeof bizOwner==='function'&&!bizOwner())?[['SUBMITTED AP',$(s.sub)]]:[['INCOME',$(s.rev)],['NET PROFIT',$(s.net)]]),")
open(OUT, 'w', encoding='utf8').write(s); print('wrote', OUT, len(s))
