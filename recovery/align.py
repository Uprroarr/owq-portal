"""Align top-level units of the minified v105 bundle with name-preserving reference builds.
Produces a name map (minified name -> original name) and a report of unmatched units."""
import json, sys, difflib, collections
R = '/home/claude/rec/'
def load(p): return json.load(open(R + p))['units']
U = load(sys.argv[1] if len(sys.argv) > 1 else 'u105.json')
T = load('ref/allthree_units.json')
V = load('ref/v101_units.json')

def seq(us, key='canon'): return [u[key] for u in us]

def align(a, b, key='canon'):
    sm = difflib.SequenceMatcher(None, seq(a, key), seq(b, key), autojunk=False)
    return sm.get_opcodes()

# 1) where does three end in v101 and in v105? align each against the full three reference
def three_end(us):
    ops = align(us, T)
    last = 0
    for tag, i1, i2, j1, j2 in ops:
        if tag == 'equal': last = i2
    return last, ops
v_end, _ = three_end(V)
u_end, u_ops = three_end(U)
print('three region: v101 units 0..%d of %d, v105 units 0..%d of %d' % (v_end, len(V), u_end, len(U)))

namemap = collections.defaultdict(collections.Counter)   # v105 name -> Counter(ref names)
pairs = []   # (v105 unit index, ref unit, source)

TCAN = collections.Counter(t['canon'] for t in T)
AMBIG = set()
def take(ua, ra, src):
    pairs.append((ua['_i'], ra, src))
    # identical canon => refs line up occurrence by occurrence
    if src == 'three' and TCAN[ra['canon']] > 1:
        # look-alike declarations (e.g. two constants = 7): position is weak evidence
        if ua.get('name') and ra.get('name'): namemap[ua['name']][ra['name']] += 0.1; AMBIG.add(ua['name'])
        return
    for x, y in zip(ua['refs'], ra['refs']):
        if x and y: namemap[x][y] += 1
    if ua.get('name') and ra.get('name'): namemap[ua['name']][ra['name']] += 3

for i, u in enumerate(U): u['_i'] = i
# three region
ops = align(U[:u_end], T)
three_unmatched = []
for tag, i1, i2, j1, j2 in ops:
    if tag == 'equal':
        for k in range(i2 - i1): take(U[i1 + k], T[j1 + k], 'three')
    elif tag == 'replace':
        a = U[i1:i2]; b = T[j1:j2]; used = set()
        for ua in a:
            best, bs = None, 0
            for jb, rb in enumerate(b):
                if jb in used or rb['kind'] != ua['kind']: continue
                pa, pb = set(ua['props']), set(rb['props'])
                sc = len(pa & pb) / max(1, len(pa | pb))
                if sc > bs: best, bs = jb, sc
            if best is not None and bs >= 0.8 and ua['kind'] != 'stmt':
                used.add(best); pairs.append((ua['_i'], b[best], 'three~'))
                if ua.get('name') and b[best].get('name'): namemap[ua['name']][b[best]['name']] += 3
            else: three_unmatched.append(ua['_i'])
    elif tag == 'delete':
        three_unmatched += list(range(i1, i2))
print('three: matched', sum(1 for p in pairs if p[2] == 'three'), 'unmatched', len(three_unmatched))

# my code region: v105 units after u_end vs v101 units after v_end
UM, VM = U[u_end:], V[v_end:]
ops = align(UM, VM)
new_units, changed = [], []
for tag, i1, i2, j1, j2 in ops:
    if tag == 'equal':
        for k in range(i2 - i1): take(UM[i1 + k], VM[j1 + k], 'mine')
    elif tag == 'replace':
        # pair by kind+name-shape similarity: same kind and similar property sets
        a = UM[i1:i2]; b = VM[j1:j2]; used = set()
        for ua in a:
            best, bs = None, 0
            for jb, rb in enumerate(b):
                if jb in used or rb['kind'] != ua['kind']: continue
                pa, pb = set(ua['props']), set(rb['props'])
                s = len(pa & pb) / max(1, len(pa | pb))
                if ua['coarse'] == rb['coarse']: s = 2
                if s > bs: best, bs = jb, s
            if best is not None and bs >= 0.5:
                used.add(best); changed.append((ua['_i'], b[best], bs))
                if ua.get('name') and b[best].get('name'): namemap[ua['name']][b[best]['name']] += 2
                if ua['coarse'] == b[best]['coarse']:
                    for x, y in zip(ua['refs'], b[best]['refs']):
                        if x and y: namemap[x][y] += 1
            else:
                new_units.append(ua['_i'])
    elif tag == 'delete':
        new_units += [UM[k]['_i'] for k in range(i1, i2)]
print('mine: exact', sum(1 for p in pairs if p[2] == 'mine'), 'changed', len(changed), 'new', len(new_units))
# resolve name map
final, conflicts = {}, []
for k, c in namemap.items():
    (n, cnt), *rest = c.most_common()
    final[k] = n
    if rest and rest[0][1] >= cnt * 0.5: conflicts.append((k, c.most_common(3)))
print('names mapped', len(final), 'conflicts', len(conflicts))
weak = [k for k in AMBIG if namemap[k].most_common(1)[0][1] < 1]
print('ambiguous three names with only positional evidence:', len(weak))
json.dump({k: namemap[k].most_common(3) for k in AMBIG}, open(R + 'ambig105.json', 'w'))
for k, c in conflicts[:30]: print('  conflict', k, c)
json.dump({'final': final, 'u_end': u_end, 'v_end': v_end, 'three_unmatched': three_unmatched,
           'new_units': new_units, 'changed': [(i, r['name'], s) for i, r, s in changed],
           'exact': [(i, r['name'], src) for i, r, src in pairs]}, open(R + 'align105.json', 'w'))
