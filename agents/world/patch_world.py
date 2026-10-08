"""v106: swap in the new 3D library and add the WRLD block (walking, Sky Deck, Sky Park, range, planes).
env: OWQ_BASE (portal build to start from), OWQ_OUT (where to write), OWQ_LIB (3D library bundle)."""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
B = os.environ['OWQ_BASE']; O = os.environ['OWQ_OUT']
LIB = os.environ.get('OWQ_LIB', os.path.join(HERE, '..', '..', 'vo', 'dist', 'vo.js'))
s = open(B, encoding='utf-8').read()
lib = open(LIB, encoding='utf-8').read().rstrip('\n').replace('</script', '<\\/script')
assert 'OWQ SKY DECK' in lib and 'BACK TO MY DESK' in lib, 'library is not the v106 build'
i = s.find('/*VO3lib*/'); j = s.find('</script>', i); assert i > 0 and j > i
s = s[:i] + '/*VO3lib*/' + lib + s[j:]
blk = open(os.path.join(HERE, 'world.js'), encoding='utf-8').read().strip()
if '/*WRLDstart' in s:
    a = s.find('/*WRLDstart'); b = s.find('/*WRLDend*/', a) + len('/*WRLDend*/'); s = s[:a] + blk + s[b:]
else:
    k = s.find('/*ECOend*/'); k = s.find('</script>', k) + len('</script>'); assert k > 20
    s = s[:k] + '\n<script>\n' + blk + '\n</script>' + s[k:]
open(O, 'w', encoding='utf-8').write(s)
print('wrote', O, len(s))
