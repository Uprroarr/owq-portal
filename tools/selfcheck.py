import json, sys, re, collections
BP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad/bp'

def strs(v):
    if isinstance(v, str): yield v
    elif isinstance(v, list):
        for x in v: yield from strs(x)
    elif isinstance(v, dict):
        for x in v.values(): yield from strs(x)

for key in sys.argv[1:]:
    d = json.load(open(f'{BP}/content/{key}.json', encoding='utf-8'))
    print('==', key)
    allt = list(strs(d['guide'])) + list(strs(d.get('quiz', []))) + list(strs(d.get('flags', [])))
    for s in allt:
        if '—' in s or '–' in s: print('  DASH:', s[:90])
        if '[' in s or ']' in s: print('  BRACKET:', s[:90])
        if '***' in s: print('  TRIPLE*:', s[:90])
    # pick positions + longest-correct
    pos = collections.Counter(); n = 0; types = collections.Counter(); ncp = 0
    for si, st in enumerate(d['guide']):
        for b in st['b']:
            if b.get('k') == 'cp':
                ncp += 1; types[b['type']] += 1
                if b['type'] == 'pick':
                    n += 1; pos[b['a']] += 1
                    L = [len(x) for x in b['o']]
                    if L[b['a']] == max(L) and L.count(max(L)) == 1 and max(L) >= 1.3 * sorted(L)[-2]:
                        print(f'  pick step {si+1} correct is longest: {b["o"][b["a"]]}')
                if b['type'] == 'multi':
                    print(f'  multi step {si+1} a={b["a"]} of {len(b["o"])}')
    print('  steps', len(d['guide']), 'cps', ncp, 'types', dict(types), 'pick positions', dict(sorted(pos.items())), 'of', n)
    q = d.get('quiz', [])
    if q:
        qp = collections.Counter(x['a'] for x in q)
        print('  quiz', len(q), 'positions', dict(sorted(qp.items())))
        for i, x in enumerate(q):
            L = [len(o) for o in x['o']]
            if L[x['a']] == max(L) and L.count(max(L)) == 1 and max(L) >= 1.3 * sorted(L)[-2]:
                print(f'  quiz[{i}] correct is longest ({L}): {x["o"][x["a"]]}')
    # prog check
    for i, st in enumerate(d['guide']):
        if st['prog'] != [i + 1, len(d['guide'])]: print('  PROG', i, st['prog'])
