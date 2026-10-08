"""Command Deck inventory: proves every piece of information and every click target of the base deck survives a restyle.
usage:
  python3 inventory.py <portal.html> <out.json> [look]          extract (owner desktop, agent desktop, owner phone) after count-ups settle
  python3 inventory.py --compare inv_base.json inv_x.json         compare: every base item must exist in the new look (exit 1 if not)
What is extracted from the deck region (#main without the global ticker .tk and the footer .note):
  headings  - h2/h4 texts
  leaves    - every visible text node (normalized); volatile live values (clocks, countdowns, 'x min ago', 'Nm left') are skipped
  numbers   - multiset of numeric tokens ($1,234 / 87% / 14 / $66K ...)
  clicks    - every onclick handler (normalized) with role/tabindex/keyboard info, and hrefs
  ids       - element ids inside the deck (live hooks like #pls, #mrdkw, #dal, #chbf)"""
import sys, os, json, re, time
DKD = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, DKD)

EXTRACT = r"""(()=>{
const main=document.getElementById('main');
const skip=e=>e.closest('.tk')||e.closest('.note')||e.closest('[aria-hidden="true"]');
const VOL=['.cd','#pls [data-t^="ag"]','#pls [data-t="hrs"]','#pls [data-t="day"]','.dk-clock','.dk-vol'];
const vol=e=>VOL.some(s=>e.closest(s));
const visible=e=>{if(!e.getClientRects().length)return false;const cs=getComputedStyle(e);return cs.visibility!=='hidden'&&cs.display!=='none'};
const norm=t=>t.replace(/ /g,' ').replace(/[’]/g,"'").replace(/\s+/g,' ').trim();
const VOLRX=/(just now|\d+ (min|hr|d) ago|\d+m left|\d+h \d+m left)/i;
const leaves=[],full=[];
const tw=document.createTreeWalker(main,NodeFilter.SHOW_TEXT);let n;
while(n=tw.nextNode()){const p=n.parentElement;if(!p||skip(p))continue;if(p.closest('script,style'))continue;const t=norm(n.nodeValue);if(!t)continue;if(!visible(p))continue;
  if(vol(p)||VOLRX.test(t)){continue}leaves.push(t);full.push(t)}
const heads=[...main.querySelectorAll('h2,h4')].filter(e=>!skip(e)&&visible(e)).map(e=>norm(e.innerText)).filter(Boolean);
const clicks=[...main.querySelectorAll('[onclick],a[href]')].filter(e=>!skip(e)).map(e=>({on:norm(e.getAttribute('onclick')||('href:'+e.getAttribute('href'))),
  role:e.getAttribute('role')||'',tag:e.tagName.toLowerCase(),tab:e.hasAttribute('tabindex')||/^(button|a|input|select)$/i.test(e.tagName),
  kbd:!!e.getAttribute('onkeydown')||/^(button|a)$/i.test(e.tagName),vis:visible(e),text:norm(e.innerText||'').slice(0,80)}));
const ids=[...main.querySelectorAll('[id]')].filter(e=>!(e.closest('.tk')||e.closest('.note'))).map(e=>e.id);
const txt=norm(full.join(' '));
const nums={};(txt.match(/-?\$?\d[\d,]*(\.\d+)?(%|K|M)?/g)||[]).forEach(x=>{nums[x]=(nums[x]||0)+1});
return{headings:heads,leaves,numbers:nums,clicks,ids,text:txt}})()"""


def extract(src, out, look=''):
    import dkseed as K
    from playwright.sync_api import sync_playwright
    extra = ("localStorage.setItem('owq_dk','%s');" % look) if look else ''
    res = {}
    errs = []
    with sync_playwright() as p:
        for who, idx, w, h, mob in [('owner', 6, 1440, 900, False), ('agent', 1, 1440, 900, False), ('phone', 6, 390, 844, True)]:
            b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--no-sandbox', '--no-proxy-server', '--disable-webgl'])
            kw = dict(viewport={'width': w, 'height': h}, timezone_id='America/New_York')
            if mob: kw.update(is_mobile=True, has_touch=True)
            ctx = b.new_context(**kw); ctx.set_default_timeout(120000)
            ctx.add_init_script(K.shift_js(*K.NOW)); ctx.add_init_script(K.seed_js(extra))
            pg = K.page(ctx, errs)
            url = K.wrap(src, K.DK + '/tmp/inv_wrap_%s.html' % (look or 'base')) if mob else 'file://' + src
            K.open_deck(pg, url, idx)
            # full graphics tier + fresh entrance, then wait until every count-up has settled
            pg.evaluate("try{localStorage.setItem('owq_gq','auto')}catch(e){};typeof dkReplay==='function'?dkReplay():go()")
            pg.wait_for_timeout(5500); pg.evaluate(K.QUIET_JS)
            res[who] = pg.evaluate(EXTRACT)
            b.close()
    res['errors'] = errs
    json.dump(res, open(out, 'w'), indent=1)
    print('wrote', out, {k: (len(v['leaves']), len(v['clicks'])) for k, v in res.items() if k != 'errors'}, 'errors', errs[:5])


def compare(a_path, b_path):
    A = json.load(open(a_path)); B = json.load(open(b_path))
    fails = []; checked = 0
    low = lambda t: re.sub(r'[^a-z0-9$%,.:/+&\'-]+', ' ', t.lower()).strip()
    for who in ('owner', 'agent', 'phone'):
        a, b = A[who], B[who]
        bt = ' ' + low(b['text']) + ' '
        for h in a['headings']:
            checked += 1
            if low(h) not in bt and low(h) not in [low(x) for x in b['headings']]:
                fails.append((who, 'heading', h))
        for t in a['leaves']:
            checked += 1
            if low(t) and low(t) not in bt:
                fails.append((who, 'text', t))
        for k, n in a['numbers'].items():
            checked += 1
            if b['numbers'].get(k, 0) < n:
                fails.append((who, 'number', '%s x%d (new x%d)' % (k, n, b['numbers'].get(k, 0))))
        bon = {}
        for c in b['clicks']: bon.setdefault(c['on'], []).append(c)
        for c in a['clicks']:
            checked += 1
            m = bon.get(c['on'])
            if not m:
                fails.append((who, 'click', c['on'] + ' [' + c['text'][:40] + ']'))
            elif c['kbd'] and not any(x['kbd'] for x in m):
                fails.append((who, 'keyboard', c['on']))
            elif c['vis'] and not any(x['vis'] for x in m):
                fails.append((who, 'click-hidden', c['on']))
        for i in a['ids']:
            checked += 1
            if i not in b['ids']:
                fails.append((who, 'id', i))
    print('checked %d items, %d missing' % (checked, len(fails)))
    for f in fails[:60]: print('  MISSING', *f)
    return fails


if __name__ == '__main__':
    if sys.argv[1] == '--compare':
        f = compare(sys.argv[2], sys.argv[3]); sys.exit(1 if f else 0)
    extract(os.path.abspath(sys.argv[1]), sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else '')
