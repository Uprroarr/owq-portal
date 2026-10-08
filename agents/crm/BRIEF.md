# BRIEF (crm builder): turn "Clients" into a professional, highly automated, hands-free-as-possible CRM for a life-insurance agency

Your name: `crm`. Work folder: `$SP/agents/crm/`  (READ `$SP/agents/COMMON.md` FIRST for rules, tools, theme, machine limits, reporting).
Your port: 8774. Prefix for anything new: `crm` (CSS `crm-*`, JS globals `crm*`, ids `crm*`, localStorage key `owq_crm`, db collections `crm*`).
Base file: `$SP/v76-final.html` (read-only; COMMON.md says v75: use v76-final.html, it is the published file now; md5 `115cbe6bccfe1249ec3f25f62bbe1812`). Line numbers below are for v76-final.html.
You are the biggest job of this round. Budget about 3 hours of work; keep PROGRESS.md current (every 20-30 min) with a PHASE CHECKPOINT note when P0 is done.

## The owner's words (verbatim)
"The next big thing I want to master is creating a CRM stystem for customer. Super automated, easy to use, quick to use, but mainly hands free as much as possible.
Can you ehance the client section and make it like a professional CRM styem for a life insurance agency"
Context: a fully remote, 100% commission agency (Family First Life network), 6 people (Austin Vardzel, Nate Johnson, Cole Leckey [the owner, sees everything], John Montini, RJ Noullet, Ayman).
Products: final expense, mortgage protection, term, whole life, IUL, annuities. Leads: Facebook leads, live transfers, direct mail, aged leads, referrals. People work from phones and laptops, they are
salespeople, not computer people: every common action must be one or two taps. The CRM's job is to make sure no lead is ever forgotten, every follow-up happens at the right time, every policy event triggers the right next step,
and the agent spends their time TALKING to people, not typing. The agency currently has almost no clients in the live database (about 1 record), so the CRM starts nearly from scratch: design it for the future (hundreds, then thousands of contacts).

## PHASES AND TIME-BOX (important)
I (the integrator) can only talk to you between runs, so the job is split. THIS RUN = PHASE A, time-boxed to about 90 minutes of work (check `date` at the start and every ~20 min; stop and report at ~100 minutes at the latest even if something is unfinished).
- PHASE A (this run): write `ARCH.md` FIRST (the complete architecture for P0 including the task/event/rule model that Phase B will need), then build and test: P0 item 1 (data layer, migration, legacy shim, local mode, multi-user safety),
  item 4 (Pipeline board, Clients list, Client 360 with timeline/policies/profile/compliance), item 5 (quick capture + CSV import + duplicates), item 8 (look and phone quality) and a first version of `Today`
  (counters + a prioritized list of what is due: overdue follow-ups, new untouched leads, appointments today, with Call/Text buttons, "Done" and "Snooze" - the Power Dial and the automation engine come in phase B, but the task model and the "next action" field must already exist).
  Wire the integrations that keep the old features alive (item 7 minimum: shim consumers, palette entries, alerts scan via the shim).
  Phase A must already be shippable on its own (all regression suites green, nothing in the old Clients section lost: Message Builder, personal info, notes, follow-up dates).
- PHASE B (a follow-up message to you later): items 2 (Power Dial), 3 (automation engine + Automations screen), 6 (Reports), the rest of 7, then P1.
In the final report of this run say exactly what is done, what is stubbed, and the first things phase B should do. Update PROGRESS.md with a PHASE CHECKPOINT section.

## What exists today (study first; lines are long, use python slicing, never print whole lines)
Client record (local array `D.clients`, synced by the shared layer `SYN`, see `SYK`/`SYB` at line 4964 -> `rec/clients_<bucket>` docs, `clients:6` buckets, 256 KiB per doc):
`{id, ag (owner agent name), name, phone, email, age, src, st in ST=['Lead','Quoted','Applied','Client','Lost'], fu ('YYYY-MM-DD' next follow-up), notes:[{at,ty,t}] (ty in Call/Text/Email/Meeting/Note), info:{dob,marital,occ,tobacco,phone2,street,city,state,zip,pref,best,bname,brel,bphone,ename,ephone}}`.
Policies are `D.policies` rows `{d, cl (client NAME string), car, ap, st, ag, src ...}` (modal `openM('P')`, list in Agency Performance); statuses `PS`; carriers/products lists near line 5115.
UI: `cli()` -> `cliBook()` (list + detail) or `msgBuilder()` (the Message Builder sub-tab: templates, `mb*` functions, `D.tpl`), personal info form `ciForm/ciGet/ciSet/CIF` (~5337-5346), modal `openM('C')`, `addN`, `delN`, `clearFu`, `delC`.
Consumers of `MYCL()` / `D.clients` that MUST keep working (grep them all, ~28 sites, lines 5033-5353, 6367-6428, 6881, 5118/5131/6435/6441 demo seeders):
the Command Deck (`ov()` follow-up queue + events feed + header ticker `FOLLOW-UPS DUE`, onclick `cid=..;openTab('Clients')`), alerts `scan()` (follow-ups due -> `pushAlert`), `brief()`, `answer()` (J.A.R.V.I.S.), Ctrl-K palette (client entries, "Write message"), Message Builder,
Morning Recognition/pulse metrics (`pulseData` ~6881 counts `c.st`), `SL()` source datalist, `clist()`. `MYCL()` (line 5059) returns all clients for `Agency Owner`/`Cole Leckey`, else only `c.ag===WHO`.
Navigation state used elsewhere: `SUB['Clients']` in {'Client Book','Message Builder'}, global `cid` (selected client id), `tab==='Clients'`. Keep those names valid (add new sub-tab names, keep `Client Book` working as the list/detail view) so existing tests and deep links keep working.
The shared-data layer and db: study `SYN` (4950-4990), how Morning Recognition uses db collections directly (`MR.live`, `MR.db`, docs `mr/<id>`, `mrcfg/main`, local fallback `D.mr*`, ~line 6184+ between /*MRstart*/ and /*MRend*/; sources in `$SP/mr/*.js`),
and the capability types in `/tmp/claude-0/bundled-skills/2.1.286/10c25e27dbf22e4553f677118f5a5d0b/artifact-capabilities/0.2.66/db.d.ts` and `sample.d.ts` (`sample` = Claude, may be null; consent prompt; the viewer pays) and `downloads.d.ts`.
Free to ignore: Learning Network, Blueprint, Leaderboard, 3D office.

## PRIORITIES. P0 = must be excellent and fully tested in this run. P1 = do after P0 passes everything. P2 = list in the report only.
### P0
1. DATA LAYER (the foundation; design it first, write it down in `ARCH.md`):
   - Scale target: 5,000 contacts and 50,000 timeline events without lag. Concurrency: 6 people editing at once must not clobber each other. Works in LOCAL MODE (db null) with the same API. Never exceed 256 KiB per doc.
   - Recommended (you may improve with justification): new db collections instead of bloating the legacy `rec/clients_*` buckets: `crmc/<clientId>` (one doc per contact: profile, stage, owner, next action cache, tags, flags),
     `crme/<clientId>_<ts>_<rand>` append-only timeline events (calls, texts, notes, stage changes, policy events, automation events; one subscription for the last N days + per-client query when a record is open),
     `crmt/<deterministicId>` tasks (follow-up / appointment / reminder; deterministic ids so concurrent automation runs write identical docs), `crmcfg/main` (stages, cadences, rules, templates refs, calling window, round-robin settings).
     Total new subscriptions: at most 3 (the page already has many; the hard limit is 64).
   - Field-level merges (`update`) for profile edits, `set` with deterministic ids for generated items, tombstones for deletions (so a deleted/dismissed item is not regenerated by automation).
   - MIGRATION (one time, idempotent, deterministic ids, safe if two browsers do it at once): legacy `D.clients` (+ their notes/info) -> CRM records. Keep the legacy docs untouched (rollback). Map legacy `st` <-> new stages.
   - LEGACY SHIM: `MYCL()` and everything listed above keep working. Provide `crmLegacy()` that returns objects shaped like the old ones (`id,name,phone,email,age,src,st,fu,notes,info,ag`) derived from CRM data, cached and invalidated on change;
     `st` is always one of the 5 legacy values; `fu` = the earliest open follow-up date. Make sure the old `SYN` diff-sync does NOT keep writing derived legacy objects into `rec/clients_*` (remove 'clients' from `SYK` when the CRM is active, or equivalent) and never loops.
     Old write paths (`openM('C')` save, `addN`, `delC`, `clearFu`, demo seeders, the simulated inbound-lead generator near line 5184) must route to the CRM API.
   - Policies stay in `D.policies`; link them to a contact by a stable `crmId` (add the field when a policy is logged for a known client; fall back to case-insensitive name match for old rows). Do not duplicate policy storage.
2. TODAY + POWER DIAL (the hands-free heart):
   - `Today` is the default sub-tab. Top: quick-capture bar; counters (Overdue, Due today, Appointments today, New leads untouched, Deliveries due, Birthdays/anniversaries this week); a prioritized queue
     (score = overdue days, lead age / speed-to-lead, stage, appointment today, attempts so far, best time to reach, source quality; show a short "why now" chip). Owner can filter by agent; agents see their own.
   - POWER DIAL: one big button starts a focused session on the queue: a single contact card at a time (name, age, state, product, source, lead age timer, last touch, a 2-line "what happened so far", a suggested opener from the
     lead type), BIG Call (`tel:`) and Text (`sms:` with the prefilled template body) buttons, and one-tap OUTCOMES: No answer, Left voicemail, Spoke - interested, Appointment set (asks date/time with smart quick picks), Not interested, Wrong number / bad number,
     Call back later (quick picks: in 1 hour, tomorrow 10am, Monday...), Do not contact. Every outcome automatically: logs a timeline event, advances the cadence (next attempt scheduled by the rules), moves the stage when appropriate,
     prepares the follow-up text (copy/sms) and loads the next contact. Keyboard shortcuts 1-8 and arrow keys on desktop; thumb-zone layout on phone; undo for the last outcome; session summary at the end (calls, contacts, appointments, time).
   - Also one-tap actions anywhere: "Done + schedule next" on a task asks nothing unless needed (the rules decide the next touch).
3. AUTOMATION ENGINE (deterministic, idempotent, unit-tested): rules are data in `crmcfg/main` with sane defaults, editable in an `Automations` sub-tab (toggle on/off, edit delays/messages, preview "what will happen to a new lead").
   Defaults to ship (life-insurance realistic): new lead cadence by lead type (speed-to-lead call task within minutes, text same day, call day 1, 2, 4, 7, 10 then nurture every 30-60 days, stop on contact/appointment/dead);
   no-answer / voicemail retry rules with max attempts; appointment reminders (day before, 1 hour before) as tasks with prefilled texts; auto stage moves (Contacted on first connect, Appointment on booking, Quoted/Presented, Applied when a policy is logged as Submitted/Pending,
   Client when a policy is Issued/Paid, back to follow-up when Declined/Postponed with a "recover" task); policy-issued sequence (delivery visit within X days, thank-you + referral ask, 30/90-day check-in, annual review on the issue anniversary);
   birthday and policy-anniversary reminders; lapse / missed-draft "save the policy" task (chargeback protection: 100% commission advance means a lapse in the first 12 months hurts: show months of advance exposure on the policy);
   dead/not-interested reactivation every 90 days; stale-lead alert (no touch in N days); unassigned leads: claim button or round-robin (owner setting).
   The engine is a pure function `crmPlan(contact, events, policies, cfg, now)` -> desired tasks; execution is idempotent via deterministic task ids, runs on every relevant change plus a sweep when the page loads and hourly, and is safe when several browsers run it at once.
   Tests: determinism, idempotency (run twice => same result), DST/timezone edges, fake clock, tombstones respected, every default rule.
   Being honest: a static page cannot send SMS/email by itself. The CRM prepares the message and opens the user's own phone/mail app in one tap (`sms:`/`tel:`/`mailto:` links, copy to clipboard). Say this clearly in the Automations screen help text and in your report.
4. PIPELINE BOARD + CLIENT LIST + CLIENT 360:
   - Pipeline: kanban columns (suggested: New, Contacted, Appointment, Presented/Quoted, Applied (underwriting), Issued/Delivery, Client (in force), Dead) with counts and potential premium; cards show name, age, product, next action badge, days in stage, owner avatar;
     drag and drop on desktop, a stage selector on phone; filters by agent / source / product / tag; collapse columns; WIP badges for stuck leads.
   - Clients list: fast table (virtualized / windowed for thousands), search, sort, saved views (My leads, Hot, Overdue, Needs delivery, In force, Lapse risk, Unassigned), simple bulk actions (assign, stage, tag, enroll/stop cadence, export).
   - Client 360 (the detail view, opens from anywhere via `cid`): header (initials avatar, name, stage control, owner, tags, calling-window indicator based on state/time zone), big action row (Call, Text, Email, Schedule, Log policy, Write message -> existing Message Builder),
     a "Next action" card with Done + auto-next, timeline (filter chips: all, calls, texts, notes, policies, system; add note / log call quickly with outcome buttons), policies panel (linked `D.policies` rows plus an "Add policy" that opens the existing policy modal prefilled),
     profile (all existing `CIF` fields: personal, contact, beneficiary/emergency; plus health notes, household/dependents, budget, coverage goal, lead info: source, vendor, cost, received time), compliance flags (Do-not-contact, consent to text, notes), referrals given/asked.
   - Keep the Message Builder sub-tab and its templates; the cadence message templates reuse its template system/merge fields where possible.
5. QUICK CAPTURE + IMPORT: one text box at the top of Today: type or paste "Mary Jones 412-555-0102 62 PA final expense facebook" and press Enter -> a lead is created with parsed fields (name, phone, age/DOB, state, product, source) and the new-lead cadence starts;
   paste multiple lines or a spreadsheet table or drop a CSV file (FileReader, nothing uploaded) -> preview grid with auto column mapping, duplicate detection (same phone/email/name+age), "import N leads and start cadence". Duplicate warning also on manual add.
   If `sample` is available, use `sample.json` as an optional booster for messy text (strictly optional; local regex parser must work offline and be well tested).
6. REPORTS (sub-tab `Reports`): conversion funnel (lead -> contacted -> appointment -> presented -> applied -> issued) with rates and drop-off, lead source ROI (leads, cost if known from expenses/lead cost field, issued premium, cost per issued policy, ROI), speed-to-lead (median minutes to first touch),
   activity (calls/texts/appointments per agent per week), pipeline value (weighted by stage), book of business (in-force annual premium by carrier/product/agent, count), persistency / lapse watch, upcoming anniversaries/renewals, referral rate. Owner sees agency-wide with agent filter; agents see their own.
7. INTEGRATIONS: alerts (`pushAlert` for: new lead waiting > N min, appointment in 30 min, overdue tasks, lapse risk; deterministic `k` keys so they do not repeat), Ctrl-K palette entries (New lead, Call next lead, Open Today, client search), the Command Deck follow-up queue keeps working through the shim.
   The simulated "inbound lead" demo generator, if still present, must create CRM contacts. Provide `crmDeckStats()` (overdue, due today, new leads untouched, appointments today) so the deck can show richer numbers later (do not edit `ov()` yourself).
8. QUALITY: phone-first. Today and Power Dial must be flawless at 390x844 (one-handed use). Desktop 1440x900 uses the space well (Today with a right-hand detail pane). Dark/crimson HUD look, native with the rest of the portal (corner-cut buttons, uppercase letter-spaced headings, gold `#ffcf40` for today/priority),
   tasteful motion (count-ups, soft glows, check-off animations, confetti-lite on "Appointment set" and "Issued") that respects reduced motion. Empty states that teach ("Paste your first leads here"). Undo toasts for destructive actions. Zero console errors. Keyboard accessible, labelled controls.
### P1 (after P0 is green)
Calendar / Appointments sub-tab (day/week list, today strip, `.ics` export through the `downloads` capability for appointments); AI Smart Note via `sample.json` (paste or dictate a call summary -> proposed changes card: outcome, next follow-up date, stage, tags, objections, family/health details, draft text -> "Apply" in one tap)
and dictation with `webkitSpeechRecognition` where available (feature-detect; hide when not); bulk actions polish; round-robin lead assignment settings; calling-window badge everywhere (8:00-21:00 client local time from state/zip -> time zone table, US states); CSV/JSON export & backup; first-run coach marks.
### P2 (do not build; mention in the report as options needing decisions or external services)
SMS/email auto-sending (needs a provider such as Twilio/GoHighLevel or a connector), lead intake webhooks from Facebook/vendors, license-state checks, carrier-specific chargeback tables, household linking & merge UI, e-sign.
Do NOT declare the `mcp` capability or change capabilities. Do not use the live db or any claude.ai tool from here.

## Rules specific to this job
- Base edits are limited to: the Clients view (`cli`/`cliBook` and friends), `MYCL`, the old `SYN` clients sync hook, the Clients nav/sub-tab entries, demo seeders/inbound-lead generator, `scan()` additions via hooks, palette entries. Each base edit is one count-asserted `rep()` listed in INTEGRATION.md.
  Prefer replacing whole old Clients functions with delegating stubs (`function cliBook(){return crmView()}`-style) over scattering edits. Do NOT edit `ov()` (Command Deck: the `deck` builder restyles it later), the alert rail, chat/voice, GX intro, Morning Recognition.
- All new code lives in your own source files (`src/crm_*.js`, `src/crm.css`), injected by `patch_crm.py` (`OWQ_BASE` default `$SP/v76-final.html`, `OWQ_OUT` default `$SP/agents/crm/out/portal.html`), ASCII only, idempotent.
- Time and dates: the portal already has `today`, `now`, `pad`, `ds`, `ago`, `esc`, `av`, `toast`, `ask`, `openM`, `hd`, `seg`, `kpi`; reuse them. Use the browser's local time zone for the user, but compute "calling window" in the contact's time zone when known.
- Privacy: this holds personal data of real people. No external requests, no logging of contact details to the console, no contact data in URLs. Dictation/AI only on explicit click. Mark `sample` usage clearly (it sends the note text to Claude).
- Realistic sample data for tests/screenshots only (names, phones 412-555-xxxx, emails @example.com). Write a generator (`src/` or `tests/gen_demo.py/js`) for 20 contacts (screenshots) and 5,000 contacts (performance test). The generator is test-only and must not ship in the portal.
- Never print or store access codes. Do not touch `$SP/v76-final.html` or `/mnt/user-data/outputs`.

## Tests you must write and run
1. Pure-logic unit tests (node `vm` or Playwright `page.evaluate`): `crmPlan` (every default rule, fake clock, DST), lead scoring/order, smart-capture parser (20+ messy inputs incl. no phone, two phones, DOB vs age, state names/abbreviations, products), CSV mapping + dedupe, stage mapping legacy <-> new, migration (idempotent twice, concurrent), legacy shim shape.
2. Multi-user/live tests with the fake shared db (`$SP/mr/fakedb.py`, example `$SP/mr/t3_live.py`): 3 contexts (owner + 2 agents) editing, importing, running automation sweeps at the same time -> no duplicates, no lost updates, agents see only their contacts, owner sees all; offline/local mode; db write errors.
3. Browser end-to-end: quick capture -> Today -> Power Dial outcomes -> next touch scheduled; pipeline drag/stage select; Client 360 edits; log a policy with the existing modal -> stage + tasks update; import CSV with duplicates; reports numbers equal a hand-computed expectation; Ctrl-K; alerts; Command Deck still shows follow-ups; Message Builder still works; delete/undo.
4. Performance with 5,000 contacts + 50,000 events: first render ms, list scroll, search latency, memory, number of db docs/subscriptions; report numbers.
5. Phone (390x844) and desktop (1440x900) screenshots of every screen; look at them yourself and polish until it looks professional.
6. Full regression `bash $SP/runreg_for.sh out/portal.html out/reg` and `bash $SP/runmr_for.sh out/portal.html out/mr` at the end (see machine limits; wait while another builder's suite runs). Existing tests that touch Clients may need the CRM to preserve their selectors/flows: keep them working, and if a test is obsolete explain which one and why.

## Deliverables (all in `$SP/agents/crm/`)
`ARCH.md`, `src/*`, `patch_crm.py`, `out/portal.html`, `INTEGRATION.md` (every base anchor + new globals + db collections), `PROGRESS.md`, tests + logs, `shots/*` (desktop+phone for Today, Power Dial, Pipeline, Client 360, Reports, Automations, Import preview),
`HANDS_FREE.md` (plain-language list of what the system does automatically, what needs one tap, and what is impossible without an SMS/email service: I use it to explain to the owner), final short report (<= 400 words) with build command, test counts, performance numbers, limits and decisions for the owner.
Do NOT publish and do not message the owner: I do that.
