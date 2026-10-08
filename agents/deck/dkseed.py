"""deck builder: deterministic demo data + browser helpers for Command Deck previews/tests.
Fake but realistic data only (412-555-xxxx phones, @example.com emails). Never prints access codes."""
import sys, os, json, random, datetime
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
DK = SP + '/agents/deck'
sys.path.insert(0, SP); sys.path.insert(0, SP + '/mr')
import lgx
from mrt import shift_js

NOW = (2026, 10, 6, 9, 40)          # Tue 2026-10-06 09:40 America/New_York
TODAY = datetime.date(2026, 10, 6)
AG = ['Austin Vardzel', 'Nate Johnson', 'Cole Leckey', 'John Montini', 'RJ Noullet', 'Ayman']
GOALS = [5000, 4000, 3500, 3000, 2000, 1000]


def ds(d):
    return d.strftime('%Y-%m-%d')


def ago(n):
    return TODAY - datetime.timedelta(days=n)


def ms(d, h, mi):
    """epoch ms for local wall time (machine runs in America/New_York)"""
    return int(datetime.datetime(d.year, d.month, d.day, h, mi).timestamp() * 1000)


def state():
    r = random.Random(20261006)
    CAR = ['Mutual of Omaha', 'Americo', 'Foresters', 'Corebridge', 'Transamerica', 'Aetna']
    PR = ['Final Expense', 'Final Expense', 'Final Expense', 'Term', 'Mortgage Protection', 'Whole Life', 'IUL']
    SRC = ['Facebook Leads', 'Live Transfers', 'Direct Mail', 'Aged Leads', 'Referral']
    FN = ['James', 'Mary', 'Robert', 'Patricia', 'Michael', 'Linda', 'William', 'Barbara', 'David', 'Susan', 'Richard', 'Karen',
          'Joseph', 'Nancy', 'Thomas', 'Lisa', 'Charles', 'Betty', 'Daniel', 'Sandra', 'Anthony', 'Donna', 'Mark', 'Carol', 'Steven', 'Ruth']
    LN = ['Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White',
          'Harris', 'Martin', 'Thompson', 'Garcia', 'Robinson', 'Clark', 'Lewis', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott']
    W = [.24, .22, .18, .15, .12, .09]

    def pick_ag():
        x = r.random(); c = 0
        for a, w in zip(AG, W):
            c += w
            if x <= c: return a
        return AG[0]

    def ap_for(prod):
        if prod == 'Final Expense': return r.randint(40, 120) * 12
        if prod == 'Term': return r.randint(28, 75) * 12
        if prod == 'Mortgage Protection': return r.randint(70, 140) * 12
        if prod == 'Whole Life': return r.randint(90, 160) * 12
        return r.randint(180, 300) * 12  # IUL
    P = []
    # prior 3 months: growing book, mostly Paid
    for (y, mo, n) in [(2026, 7, 34), (2026, 8, 39), (2026, 9, 44)]:
        for i in range(n):
            d = datetime.date(y, mo, r.randint(1, 28 if mo != 9 else 29))
            prod = r.choice(PR); x = r.random()
            st = 'Paid' if x < .80 else 'Issued' if x < .86 else 'Declined' if x < .96 else 'Chargeback'
            P.append({'d': ds(d), 'cl': r.choice(FN) + ' ' + r.choice(LN), 'ag': pick_ag(), 'car': r.choice(CAR), 'prod': prod,
                      'ap': ap_for(prod), 'pct': r.choice([90, 95, 100, 100, 105, 110]), 'src': r.choice(SRC), 'st': st})
    P.append({'d': '2026-09-24', 'cl': 'Gloria Bennett', 'ag': 'John Montini', 'car': 'Americo', 'prod': 'Final Expense', 'ap': 1212, 'pct': 100, 'src': 'Facebook Leads', 'st': 'Chargeback'})
    P.append({'d': '2026-09-30', 'cl': 'Henry Collins', 'ag': 'Austin Vardzel', 'car': 'Foresters', 'prod': 'Final Expense', 'ap': 1044, 'pct': 100, 'src': 'Referral', 'st': 'Issued'})
    # this month: 16 policies (Oct 1-6) with a realistic status mix
    OCT = [
        ('2026-10-01', 'Linda Harris', 'Austin Vardzel', 'Mutual of Omaha', 'Final Expense', 1188, 'Paid', 'Facebook Leads'),
        ('2026-10-01', 'Robert King', 'Nate Johnson', 'Americo', 'Term', 744, 'Issued', 'Live Transfers'),
        ('2026-10-01', 'Donna Wright', 'RJ Noullet', 'Transamerica', 'Final Expense', 636, 'Declined', 'Aged Leads'),
        ('2026-10-02', 'Patricia Lewis', 'Cole Leckey', 'Corebridge', 'IUL', 3480, 'Issued', 'Referral'),
        ('2026-10-02', 'James Walker', 'Austin Vardzel', 'Americo', 'Mortgage Protection', 1356, 'Issued', 'Direct Mail'),
        ('2026-10-02', 'Karen Scott', 'John Montini', 'Foresters', 'Final Expense', 852, 'Paid', 'Facebook Leads'),
        ('2026-10-03', 'Charles Young', 'Nate Johnson', 'Mutual of Omaha', 'Whole Life', 1620, 'Submitted', 'Referral'),
        ('2026-10-03', 'Sharon Hall', 'Ayman', 'Aetna', 'Final Expense', 528, 'Issued', 'Aged Leads'),
        ('2026-10-05', 'Michael Baker', 'Austin Vardzel', 'Corebridge', 'IUL', 2940, 'Submitted', 'Live Transfers'),
        ('2026-10-05', 'Nancy Allen', 'Cole Leckey', 'Americo', 'Final Expense', 972, 'Issued', 'Facebook Leads'),
        ('2026-10-05', 'Steven Green', 'RJ Noullet', 'Foresters', 'Term', 588, 'Submitted', 'Direct Mail'),
        ('2026-10-05', 'Betty Adams', 'John Montini', 'Mutual of Omaha', 'Final Expense', 1068, 'Declined', 'Facebook Leads'),
        ('2026-10-05', 'Paul Martin', 'Nate Johnson', 'Transamerica', 'Mortgage Protection', 1512, 'Paid', 'Live Transfers'),
        ('2026-10-06', 'Ruth Thompson', 'Cole Leckey', 'Americo', 'Term', 696, 'Submitted', 'Referral'),
        ('2026-10-06', 'Diane Clark', 'Nate Johnson', 'Mutual of Omaha', 'Final Expense', 1140, 'Issued', 'Facebook Leads'),
        ('2026-10-06', 'Mark Robinson', 'Austin Vardzel', 'Americo', 'Final Expense', 924, 'Issued', 'Direct Mail'),
    ]
    for d, cl, ag, car, prod, ap, st, src in OCT:
        P.append({'d': d, 'cl': cl, 'ag': ag, 'car': car, 'prod': prod, 'ap': ap, 'pct': 100, 'src': src, 'st': st})
    P.sort(key=lambda p: p['d'])

    # income + expenses, July..October
    INC, EXP = [], []
    for (y, mo, last) in [(2026, 7, 31), (2026, 8, 31), (2026, 9, 30), (2026, 10, 6)]:
        def dd(n): return ds(datetime.date(y, mo, min(n, last)))
        if mo != 10:
            INC.append({'d': dd(15), 'src': 'Override / Bonus', 'amt': r.randint(3200, 5200), 'n': 'Team override'})
            INC.append({'d': dd(20), 'src': 'Renewals / Trail', 'amt': r.randint(1400, 2400), 'n': 'Trail commissions'})
            if mo == 8: INC.append({'d': dd(24), 'src': 'Referral Fee', 'amt': 650, 'n': 'Partner referral'})
        else:
            INC.append({'d': dd(5), 'src': 'Renewals / Trail', 'amt': 1780, 'n': 'Trail commissions'})
        if mo != 10:
            for i, (src, amt, cpl) in enumerate([('Facebook Leads', r.randint(2300, 2700), 22), ('Live Transfers', r.randint(900, 1200), 45),
                                                  ('Direct Mail', r.randint(600, 800), 30), ('Aged Leads', r.randint(250, 400), 9)]):
                EXP.append({'d': dd(2 + i), 'cat': 'Leads', 'amt': amt, 'leads': round(amt / cpl), 'src': src, 'n': src})
            EXP.append({'d': dd(8), 'cat': 'Software', 'amt': 420, 'leads': 0, 'src': '', 'n': 'CRM and dialer'})
            EXP.append({'d': dd(12), 'cat': 'Training', 'amt': r.randint(500, 800), 'leads': 0, 'src': '', 'n': 'Coaching and courses'})
            EXP.append({'d': dd(18), 'cat': 'Marketing', 'amt': r.randint(600, 900), 'leads': 0, 'src': '', 'n': 'Ads and content'})
        else:
            EXP.append({'d': dd(2), 'cat': 'Leads', 'amt': 2450, 'leads': 111, 'src': 'Facebook Leads', 'n': 'Facebook Leads'})
            EXP.append({'d': dd(3), 'cat': 'Leads', 'amt': 1080, 'leads': 24, 'src': 'Live Transfers', 'n': 'Live Transfers'})
            EXP.append({'d': dd(5), 'cat': 'Software', 'amt': 420, 'leads': 0, 'src': '', 'n': 'CRM and dialer'})

    # 14 days of activity (weekdays), plus this morning
    ACT = []
    for back in range(13, 0, -1):
        d = ago(back)
        if d.weekday() >= 5: continue
        for i, a in enumerate(AG):
            if r.random() < .12: continue
            h = round(r.uniform(5.5, 9.0) - i * .25, 1)
            ACT.append({'d': ds(d), 'ag': a, 'h': h, 'con': r.randint(28, 64) - i * 3, 'app': max(0, r.randint(2, 7) - i // 2)})
    for a, con, app in [('Austin Vardzel', 14, 1), ('Nate Johnson', 11, 1), ('John Montini', 6, 0)]:
        ACT.append({'d': ds(TODAY), 'ag': a, 'h': 0, 'con': con, 'app': app})

    # shifts: last few days closed, three agents on the clock right now
    SH = []; sid = 0
    for back in range(6, 0, -1):
        d = ago(back)
        if d.weekday() >= 5: continue
        for a in AG:
            if r.random() < .2: continue
            sid += 1; st = ms(d, r.randint(8, 9), r.randint(0, 59))
            SH.append({'id': sid, 'ag': a, 'start': st, 'end': st + int(r.uniform(5, 8.5) * 36e5)})
    for a, h, mi in [('Austin Vardzel', 8, 5), ('Nate Johnson', 8, 32), ('John Montini', 9, 2)]:
        sid += 1; SH.append({'id': sid, 'ag': a, 'start': ms(TODAY, h, mi), 'end': None})

    # 14 clients with follow-ups (some overdue, some today)
    CL = []
    spec = [
        ('Walter Hughes', 'Nate Johnson', 'Lead', -3), ('Gloria Bennett', 'John Montini', 'Client', None), ('Loretta Price', 'Nate Johnson', 'Quoted', -1),
        ('Curtis Reed', 'Austin Vardzel', 'Applied', 0), ('Ellen Foster', 'Cole Leckey', 'Quoted', 0), ('Raymond Ortiz', 'RJ Noullet', 'Lead', -2),
        ('Henry Collins', 'Austin Vardzel', 'Client', 9), ('Grace Patterson', 'Nate Johnson', 'Applied', 2), ('Diane Clark', 'Nate Johnson', 'Client', 14),
        ('Frank Morales', 'Cole Leckey', 'Lead', 1), ('Joyce Ramirez', 'Ayman', 'Quoted', 3), ('Arthur Bell', 'John Montini', 'Lead', 4),
        ('Shirley Cooper', 'Austin Vardzel', 'Lost', None), ('Dennis Ward', 'Cole Leckey', 'Quoted', 6)]
    NT = {'Lead': [('Call', 'Left a voicemail introducing myself and the coverage options.')],
          'Quoted': [('Call', 'Spoke for 10 minutes. Wants coverage for final expenses and to protect a spouse.'), ('Email', 'Sent quotes from two carriers. Waiting on a decision.')],
          'Applied': [('Call', 'Completed the application over the phone. Waiting on underwriting.')],
          'Client': [('Call', 'Policy delivered. Reviewed beneficiaries and set a 6-month review.')],
          'Lost': [('Call', 'Went with a different agent. Asked to keep in touch for a review next year.')]}
    for i, (nm, ag, st, fu) in enumerate(spec):
        notes = [{'at': (datetime.datetime(2026, 10, 6, 9, 0) - datetime.timedelta(days=(14 - i) % 9 + 1, hours=i)).isoformat() + '.000Z', 'ty': t, 't': x} for t, x in NT[st]]
        CL.append({'id': 1000 + i, 'ag': ag, 'name': nm, 'phone': '412-555-%04d' % (1200 + i * 137 % 8000), 'email': nm.lower().replace(' ', '.') + '@example.com',
                   'age': str(46 + (i * 7) % 28), 'src': SRC[i % 5], 'fu': ds(TODAY + datetime.timedelta(days=fu)) if fu is not None else '', 'st': st, 'notes': notes})

    t0 = ms(TODAY, 9, 40)
    ALR = [
        {'id': 3, 'ts': t0 - 22 * 60000, 'rd': 0, 'sev': 'ok', 't': 'Policy issued', 'm': 'Diane Clark - $1,140 with Mutual of Omaha (Nate Johnson)', 'go': ['Agency Performance', 'Policies']},
        {'id': 2, 'ts': t0 - 38 * 60000, 'rd': 0, 'sev': 'crit', 't': 'Chargeback received', 'm': 'Gloria Bennett - $1,212 with Americo', 'go': ['Agency Performance', 'Policies']},
        {'id': 1, 'ts': t0 - 75 * 60000, 'rd': 1, 'sev': 'info', 't': 'New lead', 'm': 'Walter Hughes from Facebook Leads needs a first call', 'go': ['Clients', '', 1000]},
    ]
    CH = [{'id': 1, 'name': 'First to $12K Issued', 'type': 'race', 'metric': 'iap', 'target': 12000, 'start': '2026-09-23', 'end': '2026-10-20',
           'prize': '$500 cash bonus', 'done': False, 'winner': None, 'paid': False}]
    def at(dh, mi): return t0 - int(dh * 36e5) - mi * 60000
    CHAT = [
        ('General', 'Cole Leckey', 'Morning team. Weekly goals are on the leaderboard, check where you stand.', at(25, 10)),
        ('General', 'Nate Johnson', 'Anyone have a good opener for aged leads? Getting a lot of voicemails.', at(24, 40)),
        ('General', 'Austin Vardzel', 'Mention the state benefit letter first. Gets them talking every time.', at(24, 32)),
        ('Wins', 'Nate Johnson', 'Diane Clark is ISSUED. $1,140 final expense, first policy of the day!', at(0, 22)),
        ('Wins', 'Austin Vardzel', 'Let\'s go Nate! Mark Robinson just issued too, $924.', at(0, 14)),
        ('Lead Flow', 'John Montini', 'Facebook leads are hitting much better after noon. Worth calling those first.', at(3, 20)),
        ('Lead Flow', 'RJ Noullet', 'Good catch. Moving my aged leads to the morning block.', at(2, 55)),
        ('General', 'Ayman', 'Reminder: clock in before your first dial so your hours count.', at(1, 5)),
    ]
    chat = [{'id': 'l%d' % (i + 1), 'ch': c, 'who': w, 'text': t, 'at': a, 'rx': ({'fire': ['Austin Vardzel', 'Cole Leckey'], 'clap': ['John Montini']} if i == 3 else {})} for i, (c, w, t, a) in enumerate(CHAT)]
    CK = []
    for back, who in [(1, AG), (0, ['Austin Vardzel', 'Cole Leckey', 'John Montini'])]:
        d = ago(back)
        for i, nm in enumerate(who):
            CK.append({'id': 900000 + back * 10 + i, 'ag': nm, 'd': ds(d), 'at': ms(d, 8, 40 + i * 3), 'rd': 1 if back else 0,
                       'goal': ['Make 100 dials before noon.', 'Book 3 appointments.', 'Follow up with every quoted client.', 'Practice the objection scripts.', 'Read up on the blueprints.', 'Review the final expense script.'][i % 6],
                       'mot': ['My family.', 'Hitting the weekly goal.', 'Getting that bag.', 'Proving I belong on the leaderboard.'][i % 4],
                       'fit': ['30 minute walk.', 'Gym after work.', '10k steps.'][i % 3], 'learn': 'Review the final expense script.',
                       'dial': str(40 + i * 12), 'leads': str(i % 3), 'closed': '0', 'comm': '', 'fb': ''})
    MRC = {'v': 2, 'wk': ['Austin Vardzel', 'Cole Leckey', 'Ayman', 'Cole Leckey', 'Nate Johnson', 'Cole Leckey', 'Nate Johnson'], 'dl': '10:00',
           'since': '2026-10-05', 'ov': {'2026-10-05': 'Nate Johnson', '2026-10-06': 'Cole Leckey'}}
    MRR = [{'id': 'mr20261005n', 'day': '2026-10-05', 'by': 'Nate Johnson', 'des': '', 'cov': 0,
            'goals': [{'m': 'con', 't': 150}, {'m': 'app', 't': 12}, {'m': 'iss', 't': 3000}],
            'quote': 'Discipline is choosing between what you want now and what you want most.',
            'note': 'Final expense push today. Team training at 1 PM.', 'att': None, 'at': ms(ago(1), 9, 12), 'late': 0, 'ed': 0,
            'rx': {'fire': ['Austin Vardzel', 'Cole Leckey'], 'flex': ['John Montini']}}]
    MRM = [{'id': 'mm1', 'rid': 'mr20261005n', 'who': 'Austin Vardzel', 'text': 'Locked in. 150 contacts is light work.', 'at': ms(ago(1), 9, 20), 'att': None, 'stk': '', 'rx': {}},
           {'id': 'mm2', 'rid': 'mr20261005n', 'who': 'Cole Leckey', 'text': 'Love it. Measure what matters.', 'at': ms(ago(1), 9, 31), 'att': None, 'stk': '', 'rx': {}}]
    D = {'seeded': 1, 'live': 1, 'roster2': 1, 'chSeed': 1, 'shiftSeed': 1, 'infoSeed': 1, 'ckSeed': 1, 'sim': 0, 'snd': 0,
         'agents': [{'id': i + 1, 'name': a, 'goal': g} for i, (a, g) in enumerate(zip(AG, GOALS))],
         'policies': P, 'income': INC, 'expenses': EXP, 'activity': ACT, 'shifts': SH, 'sid': sid, 'clients': CL, 'alerts': ALR, 'aid': 3,
         'challenges': CH, 'chid': 1, 'chat': chat, 'cmid': len(chat), 'chatSeen': {'General': at(1, 30), 'Wins': at(0, 30), 'Lead Flow': at(4, 0)},
         'checkins': CK, 'learn': [], 'goal': 60000, 'hT': 60, 'lT': 1000, 'mrCfg': MRC, 'mrRecs': MRR, 'mrMsgs': MRM, 'mrSeen': {'_init': ms(ago(2), 8, 0)}}
    return D


def seed_js(extra=''):
    """init script: put the demo state into localStorage before the app script reads it (every load)."""
    return "try{localStorage.setItem('owq_v3',%s);localStorage.setItem('owq_gq','still');%s}catch(e){}" % (json.dumps(json.dumps(state())), extra)


def launch(p, w=1440, h=900, mobile=False, webgl=False, extra=''):
    args = ['--no-sandbox', '--no-proxy-server'] + (['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] if webgl else ['--disable-webgl'])
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=args)
    kw = dict(viewport={'width': w, 'height': h}, timezone_id='America/New_York')
    if mobile: kw.update(is_mobile=True, has_touch=True, device_scale_factor=2)
    ctx = b.new_context(**kw)
    ctx.add_init_script(shift_js(*NOW))
    ctx.add_init_script(seed_js(extra))
    return b, ctx


def page(ctx, errs):
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append('PE ' + str(e)[:300]))
    pg.on('console', lambda m: errs.append(m.type + ' ' + m.text[:240]) if m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'favicon' not in m.text and 'Failed to load resource' not in m.text else None)
    return pg


QUIET_JS = """(()=>{try{NAGK.snz=Date.now()+9e9;LNAG.snz=Date.now()+9e9}catch(e){}['ckn','lnn'].forEach(i=>{const e=document.getElementById(i);if(e)e.remove()});
try{RAIL=false;const r=document.getElementById('rail');if(r)r.className='rail'}catch(e){}try{POPS=[];popRender()}catch(e){}document.body.classList.add('hush');
if(!document.getElementById('dkTestCss')){const st=document.createElement('style');st.id='dkTestCss';st.textContent='#fwo{display:none!important}';document.head.appendChild(st)}})()"""


def open_deck(pg, url, idx, settle=2500):
    pg.goto(url, timeout=180000); pg.wait_for_timeout(2500)
    lgx.login(pg, idx); pg.wait_for_timeout(1500)
    pg.evaluate(QUIET_JS)
    pg.evaluate("openTab('Command Deck')"); pg.wait_for_timeout(settle)
    pg.evaluate(QUIET_JS)


def full_shot(pg, path, w, extra_h=0, wait=600):
    """the app scrolls inside <main>; grow the viewport to the content height for a full-page capture"""
    H = pg.evaluate("(()=>{const m=document.getElementById('main');return Math.ceil(m.getBoundingClientRect().top+m.scrollHeight)})()")
    pg.set_viewport_size({'width': w, 'height': max(400, H + extra_h)}); pg.wait_for_timeout(wait)
    H2 = pg.evaluate("(()=>{const m=document.getElementById('main');return Math.ceil(m.getBoundingClientRect().top+m.scrollHeight)})()")
    if H2 != H:
        pg.set_viewport_size({'width': w, 'height': max(400, H2 + extra_h)}); pg.wait_for_timeout(wait)
    pg.screenshot(path=path)
    return H2


def wrap(src, dst):
    """copy with the viewport/charset metas the Artifact wrapper adds (phone layout)"""
    h = open(src, encoding='utf-8').read()
    open(dst, 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + h + '</body></html>')
    return 'file://' + dst


if __name__ == '__main__':
    D = state()
    print('policies', len(D['policies']), 'oct', len([p for p in D['policies'] if p['d'] >= '2026-10-01']), 'clients', len(D['clients']), 'activity', len(D['activity']), 'bytes', len(json.dumps(D)))
