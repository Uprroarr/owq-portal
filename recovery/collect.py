"""Copy the source files worth keeping into the 'source' branch worktree, skipping anything private.
Never copies: web/private, web/deliver, base portal HTML builds, data exports, images, logs, test sites.
Every candidate is scanned for the team's access codes and for real email addresses before it is copied."""
import os, re, json, shutil, sys
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
DST = '/home/claude/owq-src'
DRY = '--dry' in sys.argv
codes = [v for v in json.load(open(SP + '/web/private/codes.json')).values() if isinstance(v, str) and len(v) >= 3]
EMAIL = re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')
OKMAIL = ('example.com', 'example.org', 'test.com', 'owq.test', 'noreply@anthropic.com', 'firebaseapp.com', 'gserviceaccount.com', 'w3.org')
SRC_EXT = ('.js', '.py', '.css', '.md', '.mjs', '.sh', '.txt', '.rules')
SKIP_DIRS = ('/out/', '/tmp/', '/web/private', '/web/deliver', '/web/site', '/web/test/site_', '/shots', '/node_modules', '/__pycache__', '/web/test/gum', '/web/bp')
picked, flagged = [], []

def ok_file(p):
    if any(d in p.replace(SP, '') for d in SKIP_DIRS): return False
    if '.bak' in os.path.basename(p): return False
    if not p.endswith(SRC_EXT) and not p.endswith('.rules.json') and not p.endswith('keep.html'): return False
    if os.path.getsize(p) > 400_000: return False
    return True

def scan(p):
    t = open(p, encoding='utf-8', errors='replace').read()
    for c in codes:
        for m in re.finditer(r'(?<![A-Za-z0-9])' + re.escape(c) + r'(?![A-Za-z0-9])', t):
            # one code is also an emote name: allowed only as an emote key/string in code, or in the reviewed brief
            nxt = t[m.end():m.end() + 1]; prv = t[m.start() - 1:m.start()]
            if c.isalpha() and (nxt in ":'\"" or prv in "'\"") and not p.endswith('.py'): continue
            if p.endswith('agents/pf/BRIEF.md'): continue
            return 'contains an access code'
    for m in EMAIL.findall(t):
        if not m.lower().endswith(OKMAIL) and not m.lower().startswith(('owner@', 'john@', 'nate@', 'austin@', 'rj@', 'ayman@', 'cole@')):
            return 'contains email ' + m.split('@')[1]
    return None

def add(src, rel):
    if not ok_file(src): return
    why = scan(src)
    if why: flagged.append((src.replace(SP, 'SP'), why)); return
    picked.append(rel)
    if not DRY:
        d = os.path.join(DST, rel); os.makedirs(os.path.dirname(d), exist_ok=True); shutil.copy2(src, d)

# 3D library sources
for f in sorted(os.listdir(SP + '/vo/src')): add(SP + '/vo/src/' + f, 'vo/src/' + f)
# portal patch scripts, one folder per feature
for d in sorted(os.listdir(SP + '/agents')):
    full = SP + '/agents/' + d
    if os.path.isdir(full):
        for root, _, files in os.walk(full):
            for f in files: add(os.path.join(root, f), os.path.relpath(os.path.join(root, f), SP))
    else: add(full, 'agents/' + d)
# website build + cloud adapter + rules + tests
for f in ['build_web.py', 'deploy.sh']: add(SP + '/web/' + f, 'web/' + f)
for sub in ['src', 'rules']:
    for f in sorted(os.listdir(SP + '/web/' + sub)): add(SP + '/web/%s/%s' % (sub, f), 'web/%s/%s' % (sub, f))
for f in sorted(os.listdir(SP + '/web/test')):
    p = SP + '/web/test/' + f
    if os.path.isfile(p): add(p, 'web/test/' + f)
# helpers at the top of the scratchpad (test login helper, notes)
for f in sorted(os.listdir(SP)):
    p = SP + '/' + f
    if os.path.isfile(p) and (f.endswith('.py') or f.endswith('.md')): add(p, 'tools/' + f)

print('picked', len(picked)); print('flagged', len(flagged))
for p, w in flagged: print('  SKIP', p, '-', w)
