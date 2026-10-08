# crm builder - PROGRESS

## 16:42 (35 min in)
ARCH.md, data layer, views, patch, 89 unit tests; regression run #1 started (main suite 9/9 rc=0).

## 17:31 (84 min in)
Done since
- Fixed 3 real bugs found by the browser tests: (1) overlay re-applied confirmed patches newest-first, reverting local edits; now chronological,
  dropped as soon as a snapshot covers them, and pruned on a timer (live test: done + snooze on one contact now both survive);
  (2) local mode enumerated localStorage keys at boot, which broke Morning Recognition's second-page test (t2_local "Nate sees the pinned card",
  base passes, mine failed 3/3); the local store now keeps an index key `owq_crm_ix` and only uses getItem/setItem -> t2_local 165/165;
  (3) CSS modifier classes `g`/`r` collided with the base `.g` grid class; renamed `crm-ok/crm-bad/crm-hi`.
- Outbox pump sends up to 3 documents in parallel (one write per document at a time), persists in-flight patches.
- Tests: unit 89/89, e2e 54/54 (tests/e2e.log), live multi-user with fake db 30/30, perf 9/9 (tests/perf.json), screenshots shots/*.png (desktop + phone).
- Regression run #1 (16:38 build): runreg 9/9 rc=0; MR t3_live/t4_mobile rc=0, t2_local rc=1 (bug 2, fixed), t5_weekly rc=1 (reload flake: passes 24/24 alone).
- Regression run #2 (final build, 17:29-17:40): runreg 9/9 rc=0 (out/reg2); MR t2_local 0, t5_weekly 0, t4_mobile 0, t3_live 1 (1 of 128: 'schedule document stored', a timing check) -> rerun alone on the same build 128/128 rc=0 (tmp/final_t3.log).
- Final e2e on out/portal.html 54/54; screenshots retaken on the final build (17:42).

## PHASE CHECKPOINT (end of Phase A)
Done (P0 items 1, 4, 5, 8 + Today v1 + item 7 minimum)
- Data layer: bucketed map docs (`crmc` 64 + cfg, `crmt` 64, `crme` month x 16), 3 subscriptions, field-level merges, deterministic ids, tombstones,
  optimistic writes + outbox + overlay, view-only detection, transient retry, local mode with the same API, per-contact history on demand.
- Migration (deterministic, idempotent, concurrent-safe, legacy docs untouched) + legacy shim (`MYCL()` -> `crmMy()`), `'clients'` removed from `SYK`.
- Old write paths routed (saveC, addN, setSt, delN, delC, clearFu, ciSet, mbEnsurePin/mbNewPin/mbSet/mbLog, simEvent lead, mock/demo seeders); `addP` wrapped.
- Today v1, Pipeline, Client Book (windowed), Client 360, quick capture, CSV/paste import with mapping + dedupe, new-lead form with duplicate warning,
  generic Undo, palette entries, alert hook (new lead waiting, appointment in 30 min), `crmDeckStats()`.
Stubbed / simplified (Phase B replaces)
- Next-touch rules are fixed code in `crmOutcome`/`crmDone`/`crmPolicyStage` (no editable cadences yet); `cfg.txt` text templates can override the built-in ones.
- No Power Dial, Automations or Reports tabs; no `sample.json` capture booster; enroll/stop cadence bulk action not shown.
First things for Phase B
1. `crmPlan(contact, events, policies, cfg, now)` + executor (deterministic `a_<cid>_<rule>_<step>` ids, cancel with `s:'x'`), replacing the fixed rules; Automations tab over `crmc/cfg`.
2. Power Dial over `crmQueue()` using `crmOutcome()` (already shared with the 360 quick log and Today outcome bar), keyboard 1-8, session summary.
3. Reports from `crme` month docs via `get()`; task-bucket compaction under an `acquire` lease.
4. If event volume passes ~60k per two months, raise event buckets per month from 16 to 32 (perf run: largest event doc 187 KB at 50k events).
