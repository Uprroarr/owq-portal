import json, sys
BP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad/bp'
key = sys.argv[1]
d = json.load(open(f'{BP}/content/{key}.json', encoding='utf-8'))
L = 'ABCDEF'
for st in d['guide']:
    print(f"\n### {st['prog'][0]}/{st['prog'][1]} {st['t']}")
    for b in st['b']:
        k = b['k']
        if k == 'cp':
            t = b['type']
            print(f"  [CP {t}] {b['q']}")
            if t == 'pick':
                for i, o in enumerate(b['o']): print(f"     {'*' if i == b['a'] else ' '}{L[i]}. {o}")
            elif t == 'multi':
                for i, o in enumerate(b['o']): print(f"     {'*' if i in b['a'] else ' '}{L[i]}. {o}")
            elif t == 'order':
                print('     ' + ' > '.join(b['items']))
            elif t == 'match':
                for a, c in b['pairs']: print(f"     {a} = {c}")
            elif t == 'fill':
                print('     ' + b['t'].replace('\n', ' / '))
                for j, x in enumerate(b['blanks']): print(f"     {{{j+1}}}: {x['o']} -> {x['o'][x['a']]}")
            elif t == 'sort':
                for it, bi in b['items']: print(f"     {it} -> {b['buckets'][bi]}")
            print(f"     e: {b['e']}")
        elif k in ('tiles',):
            print(f"  [tiles{' req' if b.get('req') else ''}] {b.get('lab','')}")
            for a in b['items']: print(f"     - {a[0]} :: {a[1].replace(chr(10), ' / ') if len(a) > 1 else ''}")
        elif k == 'table':
            print(f"  [table] {b.get('lab','')} | {' | '.join(b['head'])}")
            for r in b['rows']: print('     ' + ' | '.join(str(c) for c in r))
        elif k in ('list', 'check'):
            print(f"  [{k}] {b.get('lab','')}")
            for i in b['items']: print(f"     - {i}")
        elif k == 'cmp':
            for c in b['cols']: print(f"  [cmp] {c['h']}: {' ; '.join(c['items'])}")
        elif k == 'stats':
            print('  [stats] ' + ' ; '.join(' '.join(x) for x in b['items']))
        elif k == 'flow':
            print('  [flow] ' + ' > '.join(b['items']))
        else:
            extra = f"({b.get('who','')}{' ' + b['lab'] if b.get('lab') else ''}) " if k == 'say' else ''
            print(f"  [{k}] {extra}{b.get('t','')}")
for i, q in enumerate(d.get('quiz', [])):
    print(f"\nQ{i+1}. {q['q']}")
    for j, o in enumerate(q['o']): print(f"   {'*' if j == q['a'] else ' '}{L[j]}. {o}")
    print(f"   e: {q['e']}")
print('\nFLAGS:')
for f in d.get('flags', []): print(' -', f)
