# crm builder - INTEGRATION

Build: `OWQ_BASE=$SP/v76-final.html OWQ_OUT=$SP/agents/crm/out/portal.html python3 $SP/agents/crm/patch_crm.py`
Sources: `src/crm_data.js` (store, API, migration, shim, parser, import, scoring), `src/crm_ui.js` (views), `src/crm.css` (embedded as the JS string
`CRM_CSS` and inserted as `<style id=crmcss>` at the end of `<body>` when the script runs, so no `<style>` anchor is touched). Injected block is ASCII and
wrapped in `/*CRMstart*/ ... /*CRMend*/`; the patch refuses a base that already contains `/*CRMstart*/`.

## Base anchors replaced (each `rep()` asserts exactly 1 match)
| # | anchor (exact text in the base) | change |
|---|---|---|
| 1 | `function clist(){` | module inserted in front of it (Clients area) |
| 2 | `function MYCL(){return WHO==='Agency Owner'\|\|WHO==='Cole Leckey'?D.clients:D.clients.filter(c=>c.ag===WHO)}` | `if(crmOn())return crmMy();` prefix |
| 3 | `function cli(){return SUB['Clients']==='Message Builder'?msgBuilder():cliBook()}` | `if(crmOn())return crmView();` prefix |
| 4 | `return hd('Clients','Pick a client and get a ready-to-send policy message.',[['+ Add Client',"openM('C')"]])+seg('Clients',['Client Book','Message Builder'])+` | header becomes `crmHead('Message Builder')` when the CRM is on |
| 5 | `const clearFu=id=>{MYCL()` | route to `crmClearFu` |
| 6 | `function mbEnsurePin(c){` | route to `crmMbPin(c,0)` |
| 7 | `function mbNewPin(){` | route to `crmMbPin(mbClient(),1)` |
| 8 | `function mbSet(k,v){` | route to `crmMbSet` |
| 9 | `function mbLog(){` | route to `crmMbLog` |
| 10 | `function saveC(id){` | route to `crmSaveC` |
| 11 | `function addN(id){` | route to `crmAddN` |
| 12 | `const setSt=(id,v)=>{MYCL()` | route to `crmSetSt` |
| 13 | `delN=(id,i)=>{MYCL()` | route to `crmDelN` |
| 14 | `delC=id=>ask('Delete this client and all notes?',` | `crmOn()?crmDelC(id):ask(...` |
| 15 | `function ciSet(id,k,v){` | route to `crmCiSet` |
| 16 | `else if(kind==='lead'){` (simEvent) | inbound demo lead -> `crmSimLead()` |
| 17 | `D.goal=60000;D.hT=60;D.lT=1000;D.seeded=1;D.sim=1;D.alerts=[];D.aid=0;save()}` (mock) | + `crmSeedLegacy(D.clients,1)` (local mode only) |
| 18 | `Follow up Friday.'}]});\nsave();closeM();go()}` (demo) | + `crmSeedLegacy(D.clients,1)` before `save()` |
| 19 | `MYCL().forEach(c=>L.push(['Client: '+c.name,c.st,` (CMDS palette) | `crmCmds(L);` prefix (New lead, Open Today, Call next lead, Open pipeline, Import leads) |
| 20 | `chSync().forEach(a=>out.push(a));ckScan().forEach(a=>out.push(a));` (scan) | + `crmScan().forEach(a=>out.push(a));` |
Not edited: `ov()`, alert rail, chat/voice, GX intro, Morning Recognition, `navRender`, `go()`. Overlap risk: #19/#20 sit in shared helpers (palette, scan); the
`deck` builder restyles `ov()`, which keeps working through the `MYCL()` shim.

## Runtime changes (no text anchors)
- At script load: `'clients'` is spliced out of `SYK` (legacy SYN no longer reads/writes `rec/clients_*`).
- `crmBoot()` (setTimeout 0): `SUB['Clients']='Today'` (was 'Client Book'), `NSUB['Clients']=['Today','Pipeline','Client Book','Message Builder']`,
  wraps `globalThis.addP` (after the existing `wrapLog` wrapper) to link a logged policy to its contact.
- Kill switch: `localStorage.owq_crm_off='1'` keeps the old Clients code on that device (every routed function keeps its original body).

## New globals (all prefixed)
`CRM` (var, state), `CRM_*` constants, functions `crm*` (data: crmOn, crmBoot, crmW, crmPut, crmCreate, crmTask, crmTaskPatch, crmEv, crmStage, crmOutcome, crmDone, crmSnooze,
crmLegacy, crmMy, crmVisible, crmQueue, crmCounts, crmDeckStats, crmScore, crmParse, crmCsv, crmMapCols, crmDedupe, crmMigPlan, crmMigrate, crmOnPolicy, crmPolicySweep, crmScan, crmCmds,
crmLocalDb ...; UI: crmView, crmHead, crmRefresh, crmOpen, crmBack, crm360, crmVToday, crmVPipe, crmVBook, crmImport, crmNewLead, crmSchedule ...).
DOM ids: `crmv, crmsy, crmqc, crmcp, crmvl, crmvs, crmbq, crmbb, crmut, crmcss, crmn_*, crmf_*, crmim*, crmsc*, crmsz, crmnx, crmnt, crmrf*, crmcmp, crmq<id>`. CSS classes `crm-*`.
Storage: localStorage `owq_crm:<docPath>` (local mode docs) + `owq_crm_ix` (their index; keys are never enumerated, which broke MR's two-page test), `owq_crm_q` (outbox in shared mode), `owq_crm_off` (kill switch).

## db collections (3 live subscriptions)
`crmc/b00..b63` + `crmc/cfg` (contacts + config, subscription 1), `crmt/b00..b63` (tasks, subscription 2), `crme/<yyyymm>_<00..15>` (events, subscription 3 = current
and previous UTC month; per-contact history via one `get()` when a Client 360 opens). Legacy `rec/clients_*` is read once by the migration and never written.
Capabilities: none added (uses db, user, downloads already declared).

## For the deck builder
`crmDeckStats(who?) -> {overdue, dueToday, newLeads, apptsToday}`; `crmQueue(who?)` gives the prioritized list with `why` chips; `crmOpen(id)` opens a 360.
