#!/usr/bin/env python3
"""deck builder: Command Deck restyle (three looks).  Exact-string patch on the published portal.
env: OWQ_BASE (default $SP/v75-final.html), OWQ_OUT (default $SP/agents/deck/out/portal.html),
     DK_LOOK = a | b | c | all (default all: ships the three looks + an A/B/C switcher in the deck header,
     remembered per device in localStorage owq_dk, also ?dk=b in the URL).  A single-look build ships only that look and no switcher.
Anchors replaced in the base (each must match exactly once):
  1) '</style><canvas id=bgc>'             -> deck CSS inserted before it (anchor kept)
  2) 'function ov(){const s=S(),m=sum('    -> deck JS inserted before it; ov() first tries dkOv() and falls back to the classic deck"""
import os, sys, json, re
DK = os.path.dirname(os.path.abspath(__file__))
SP = os.path.dirname(os.path.dirname(DK))
BASE = os.environ.get('OWQ_BASE', os.path.join(SP, 'v75-final.html'))
OUT = os.environ.get('OWQ_OUT', os.path.join(DK, 'out', 'portal.html'))
LOOK = os.environ.get('DK_LOOK', 'all').strip().lower()
LOOKS = ['a', 'b', 'c'] if LOOK == 'all' else [LOOK]
assert all(l in ('a', 'b', 'c') for l in LOOKS), 'DK_LOOK must be a, b, c or all'
s = open(BASE, encoding='utf-8').read()


def rep(old, new, cnt=1):
    global s
    n = s.count(old)
    assert n == cnt, 'expected %d match(es) but found %d for: %s' % (cnt, n, old[:90])
    s = s.replace(old, new)


rd = lambda f: open(os.path.join(DK, 'src', f), encoding='utf-8').read()
css = rd('deck_common.css') + ''.join(rd('deck_%s.css' % l) for l in LOOKS)
js = rd('deck_common.js').replace('__DKLOOKS__', json.dumps(LOOKS)) + ''.join(rd('deck_%s.js' % l) for l in LOOKS) + '\n/*DKend*/\n'
assert '__DKLOOKS__' not in js
if len(LOOKS) == 1:
    # single-look build: no switcher code at all
    strip = lambda t: re.sub(r'/\*DKSW\*/.*?/\*DKSWend\*/', '', t, flags=re.S)
    css, js = strip(css), strip(js)
    js = js.replace('const DKL=', "const dkSwitch=()=>'';const DKL=", 1)
    assert 'dkSet' not in js and '.dk-sw' not in css
bad = [i for i, c in enumerate(css + js) if ord(c) > 127]
assert not bad, 'deck code must stay ASCII (the page can be opened from a file with no charset): first at %d' % bad[0]
assert '</script' not in js.lower() and '</style' not in css.lower()
rep('</style><canvas id=bgc>', css + '\n</style><canvas id=bgc>')
rep('function ov(){const s=S(),m=sum(', js + "function ov(){try{const _dk=dkOv();if(_dk)return _dk}catch(e){}const s=S(),m=sum(")
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w', encoding='utf-8').write(s)
print('wrote', OUT, len(s), 'looks', ','.join(LOOKS))
