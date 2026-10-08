# CRM architecture (crm builder) - covers Phase A and the model Phase B builds on

Goal: the Clients section becomes a CRM for a 6-person, 100%-commission life-insurance agency. Design target: 5,000 contacts,
50,000 timeline events, 6 people editing at once, phones first, works with the shared db absent (local mode).

## 1. Constraints that shaped the design (from the db capability contract)
- One artifact database holds at most **25,000 documents** in total, each <= 256 KiB, max 64 live subscriptions per view
  (the portal already uses many). Queries scan the collection (no indexes): keep queried collections to hundreds of docs.
- `update` = recursive merge of nested objects (arrays replace wholesale), requires the doc to exist; `set` = replace; last writer wins;
  no transactions; one write at a time per document.
- So **one document per event (or per contact) does not scale**: 50,000 events would blow the 25,000-doc cap. The brief's
  `crmc/<clientId>` / `crme/<id>` layout is therefore changed to **bucketed map documents** (same idea as the legacy SYN `rec/<kind>_<bucket>`),
  but with field-level merges so concurrent edits do not clobber each other.

## 2. Collections (3 live subscriptions in total)
| path | content | subscription |
|---|---|---|
| `crmc/b00` .. `crmc/b63` | contact bucket: `{_k:'b07', _u:ts, c<id>: Contact, ...}`; bucket = `fnv(String(id)) % 64` | #1 `collection('crmc')` |
| `crmc/cfg` | CRM config (stages, cadences, rules, templates, calling window, round-robin, migration marker) - lives in the same collection so it rides subscription #1 | (#1) |
| `crmt/b00` .. `crmt/b63` | task bucket keyed by the contact's bucket: `{_k, _u, t<taskId>: Task}` | #2 `collection('crmt')` |
| `crme/<yyyymm>_<bb>` | event bucket per UTC month and `fnv(cid) % 16`: `{m:'2026-10', b:7, e<id>: Event}` | #3 `collection('crme').where('m','>=',<previous month>)` |
Per-contact full history (older than the window) = one `collection('crme').where('b','==',bb).get()` when a Client 360 opens (cached 60 s).
Sizing: contact ~1.2 KB -> 5,000 contacts = 94 KB per contact bucket (2.7x headroom, re-bucket to 128 above ~10k contacts);
task ~150 B; events ~160 B: 13,000 events/month (the busiest realistic month) = 130 KB per event bucket. Docs per year: 128 + 192.
Writers always include the bucket meta fields (`_k`, `m`, `b`) in their patch so a doc created by the fallback `set` is queryable.

## 3. Records
**Contact** (`c<id>` inside a contact bucket; `id` is a NUMBER so legacy `onclick="cid=${c.id}"` keeps working):
`id, name, phone, phone2, email, age, dob, state, city, street, zip, src, ven (vendor), cost (lead cost $), rcv (lead received ts), prod (product interest),
ap (expected annual premium), stage, sAt (stage entered ts), owner, tags[], at/by (created), up/ub (updated), dnc, sms (consent to text ts|0), comp (compliance note),
info{marital,occ,tobacco,pref,best,bname,brel,bphone,ename,ephone,health,house,budget,goal}, mb{Message Builder fields},
lt (last touch ts), ft (first touch ts = speed-to-lead), la (attempts since last connect), lo (last outcome), conn (last connect ts),
nx{due,ty,t} (next-action cache, written by the task API), cad{k,s,n,stop} (cadence state, Phase B), ref{by,asked,given}, del/dAt (tombstone), lg (legacy id).`
New ids: `Date.now()*1000 + rand(1000)` (unique per browser, safe integer). Migrated contacts keep their legacy numeric id.

**Stages** (`stage`): `new, contacted, appt, quoted, applied, issued, client, dead`
(New, Contacted, Appointment, Presented/Quoted, Applied (underwriting), Issued/Delivery, Client (in force), Dead).
Legacy mapping: Lead -> new (no notes) / contacted (has notes); Quoted -> quoted; Applied -> applied; Client -> client; Lost -> dead.
Back: new/contacted/appt -> Lead, quoted -> Quoted, applied -> Applied, issued/client -> Client, dead -> Lost (always one of the 5 legacy values).

**Task** (`t<id>` in the task bucket of its contact): `id, c, ty (call|text|email|appt|fu|deliv|review|other), t (title), due (ts), ow (assignee), s ('o' open|'d' done|'x' cancelled = tombstone),
at/by, dn/dby, r (rule key: man|legacy|new|<rule>), step, m (prefilled message), o (outcome), sn (snooze count)`.
Ids are deterministic: manual `m_<cid>_<ts36>`, legacy follow-up `fu_<cid>_<yyyymmdd>`, automation `a_<cid>_<rule>_<step>` (Phase B),
first call on a new lead `a_<cid>_new_0`. Deletion/dismissal never removes a key: it writes `s:'x'` so automation never regenerates it.
**Next action** of a contact = its open task with the earliest `due` (cached into `contact.nx`).

**Event** (`e<id>` in the event bucket of its UTC month): `id, c, ty (call|text|email|meet|note|stage|policy|task|sys|import), at, by, o (outcome), t (text), x{from,to,...}, del`.
Append-only; deleting a note writes `del:1`. Legacy notes migrate to ids `l<legacyId>_<i>` (deterministic).
Call outcomes: `na` no answer, `vm` voicemail, `int` spoke-interested, `appt` appointment set, `ni` not interested, `bad` wrong number, `cb` call back, `dnc` do not contact.

**Config** `crmc/cfg`: `{v, stages:{key:{n,p (win probability),stuck (days)}}, win:{s:8,e:21}, rr:{on,ord[]}, stale:7, wait:5, prodAp:{product:avg AP},
cad:{<leadType>:[{d (minutes after start), ty, m}]}, rules:{<key>:{on,...}}, mig:{v,at,by,n}}` - Phase A ships defaults in code and only writes `mig`.

## 4. Store engine (`src/crm_data.js`)
- `CRM.c` contacts Map, `CRM.t` tasks Map, `CRM.e` events Map, `CRM.cfg`; derived caches keyed by `CRM.ver` (bumped on every change).
- **One adapter API for both modes**: the real `db`, the test FakeDB, or `crmLocalDb()` (in-memory docs persisted per document to
  localStorage `owq_crm:<path>`, same `doc().get/set/update`, `collection().where().onSnapshot/get` surface). Local mode = db null.
- **Writes**: `crmW(path, patch)` applies the patch locally at once (optimistic), queues it in an outbox, and a pump sends
  one write per document at a time, coalescing queued patches for the same doc into one `update`. Missing doc -> `set(patch)` then
  `get()` to verify our keys landed (another browser may have created the doc in the same instant) and re-`update` if not.
  `invalid_argument` on an existing doc or `can('data.write')===false` -> view-only mode (banner text, writes dropped, UI stays usable).
  Transient errors retry with backoff; the outbox survives reloads (localStorage `owq_crm_q`).
- **Overlay**: incoming snapshots are applied doc by doc, then every still-unconfirmed outbox patch is re-applied on top, so a stale
  snapshot never flickers a local edit away. Field-level patches mean two people editing different fields (or different contacts in one bucket) never clobber each other.
- Every change calls `crmChanged()` -> `CRM.ver++`, debounced quiet refresh of the Clients view only (never while typing or a modal is open).

## 5. Migration (one time, idempotent, concurrent-safe)
Runs after the first definitive snapshot (or at boot in local mode). Source = legacy `rec/clients_0..5` docs (read with `get`, never written)
in shared mode, or `D.clients` in local mode. For each legacy client whose id is not yet in the CRM (live or tombstoned): contact `c<id>`
(profile+info+mb, stage mapped), notes -> events `l<id>_<i>`, `fu` -> open task `fu_<id>_<date>`. Everything is deterministic, so two browsers
migrating at once write identical bodies. `cfg.mig` records the run; later runs only add legacy clients that appeared since (an old cached
page may still write legacy docs) and never touch migrated or deleted contacts. Legacy docs stay untouched (rollback = republish old version).
`'clients'` is removed from `SYK` while the CRM is on, so the old diff-sync neither reads nor writes `rec/clients_*` again (no loop).

## 6. Legacy shim
`crmLegacy()` -> cached array of `{id,ag,name,phone,email,age,src,st,fu,notes,info,mb,crm:1}` derived from CRM data (st = one of the 5 legacy values,
fu = local date of the earliest open task, notes = last 30 note-like events in legacy shape). `MYCL()` returns `crmMy()` (owner logins see all, agents
their own) so the Command Deck queue/feed/ticker, `scan()` follow-up alerts, `brief()`, `answer()`, palette, Message Builder, pulse metrics, `SL()` keep working.
Old write paths are routed: `saveC`, `addN`, `setSt`, `delN`, `delC`, `clearFu`, `ciSet`, `mbEnsurePin/mbNewPin/mbSet/mbLog`, `simEvent` inbound lead,
`mock()`/`demo()` seeders (local mode only). `addP` is wrapped: a policy logged for a known contact gets `crmId`, a policy event and the stage move.
Kill switch for support: `localStorage.owq_crm_off='1'` restores the legacy Clients code paths on that device.

## 7. Views (`src/crm_ui.js`)
Sub-tabs (SUB['Clients']): **Today** (default) | **Pipeline** | **Client Book** (list + Client 360; old name kept for deep links) | **Message Builder** (unchanged)
| Phase B: **Automations**, **Reports**. A changed `cid` (deck queue, alerts, palette) always opens that contact's 360.
- Today: quick capture, counters, prioritized queue (`crmScore` -> score + "why now" chip), Call/Text/Done/Snooze, desktop right-hand detail pane.
- Pipeline: kanban (8 stages, counts, potential premium, days in stage, stuck badges, owner avatar), HTML5 drag/drop on desktop, stage chips + select on phone, filters, collapsible columns, 50 cards per column then "show more".
- Client Book: windowed list (fixed row height, only visible rows in the DOM), search, sort, saved views, bulk assign/stage/tag/export/delete with undo.
- Client 360: header (avatar, stage, owner, tags, calling-window badge from state time zone), actions (Call/Text/Email/Schedule/Log policy/Write message),
  next-action card, timeline with filters and one-tap call outcomes, policies (linked rows + advance-exposure months), profile (all CIF fields + health/household/budget/goal + lead info), compliance, referrals.

## 8. Phase B model (already reserved in the records above)
- `crmPlan(contact, events, policies, cfg, now) -> desiredTasks[]` pure; executor diffs desired vs `CRM.t`: creates missing ids, cancels (`s:'x'`, `r` kept)
  open automation tasks no longer desired; never touches done/cancelled ids (tombstones respected). Runs on change, at boot and hourly; any browser may run it -
  identical ids and bodies make concurrent runs harmless. Cadence state lives in `contact.cad` (step index advances on each logged attempt), so ids
  `a_<cid>_<rule>_<step>` are stable and never resurrect.
- Power Dial: session over the Today queue using the same outcome API (`crmOutcome(cid, o, extra)`) that the 360 quick-log already uses in Phase A.
- Reports read events via `get()` per month (no extra subscription). Task-bucket compaction (drop done/cancelled entries older than 120 days that no rule can regenerate) runs under an `acquire` lease on a quiet bucket (`_u` older than 10 min).
- Honest limit: a static page cannot send SMS/email. The CRM prepares the message and opens the phone's own app (`tel:`/`sms:`/`mailto:`) or copies the text.

## 9. Privacy / safety
No network except the db capability; no contact data in URLs (the `sms:`/`tel:` links only carry the number and body on an explicit tap) or console.
Visibility filtering (agent sees own) is a UI filter: every member who can open the artifact can technically read shared data (same as the legacy layer).
