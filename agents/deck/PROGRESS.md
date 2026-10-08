# deck builder: progress

## 13:30
Done
- Read COMMON.md + BRIEF.md, studied ov(), helpers, live refresh (refreshQuiet/QUIET/.nq), Live Pulse self-updater, MR/challenge/alerts/chat hooks.
- dkseed.py: deterministic demo data (Tue 2026-10-06 09:40 fake clock, 16 policies this month + Jul-Sep history, income/expenses,
  14 days activity, shifts with 3 agents on the clock, 14 clients with overdue/today follow-ups, alerts, live challenge, chat, check-ins,
  Morning Recognition: Mon posted by Nate, Tue pending for Cole/owner). Browser helpers (login via lgx, nag/popup suppression, full-page capture).
- Baseline shots: shots/base_owner_desktop.png, base_agent_desktop.png, base_phone.png.
- inventory.py + inv_base.json (owner 175 text leaves / 33 click targets, agent 167/30, phone 175/33).
- Engine src/deck_common.js/.css: dkOv() (ov() delegates, falls back on error), dkData(), count-up numbers keyed by data-dkn with dkS.prev,
  entrance window with negative delays (--dke), idle loops phase-locked across re-renders (--dkp), tier full/low/still, canvas manager (<=30 fps,
  stops off-tab/hidden), celebration burst on goal milestone or new issued policy, A/B/C switcher (owq_dk, ?dk=).
- patch_deck.py (2 anchors). Look A first pass built + screenshots.

Next: polish A, then B, C, tests (inventory, no-replay, reduced motion/low, perf), regression, sheets, GIFs.

## Decisions
- Global ticker (.tk), footer note, cqHtml (Ask Claude), mrBanner/mrDeck, pulseHtml, chDeck, latestAl, chBrief are embedded unchanged (their own live updaters keep working); restyled only through .dk-root scoped CSS.
- Graphics tier read from localStorage owq_gq at render ('still' -> static, 'low' -> no idle loops/particles), RM -> static.

## 13:58
Done
- Looks A (Reactor HUD), B (Mission Control), C (Cinematic Hero) built: src/deck_{a,b,c}.{js,css}; builds out/portal_{a,b,c,all}.html.
- Inventory test: tests/inv_{a,b,c}.json vs inv_base.json -> 917 items each (owner, agent, phone), 0 missing (tests/inv_*.result.txt).
- Widths 1440/1100/768/390: no horizontal overflow in any look (tests/widths_result.json); phone tap targets raised to 44px.
- tests/behave.py: 91/91 pass (entrance once, no replay on go()/refreshQuiet, scroll kept, numbers stable, phase kept, real change tweens +
  one burst, low/still/reduced-motion tiers, canvas <=30fps + stops off-tab/hidden, switcher, ?dk=, fallback, single-look builds).
Next: perf numbers (swiftshader), regression suite, preview sheets, GIFs, INTEGRATION.md.

## 14:14
- Full regression (runreg_for.sh) on the all build: 9/9 rc=0, ALLDONE (out/reg_all/_status.txt). MR suites running (out/mr_all).
- Perf: render go() base ~16-20 ms vs A ~17 (after replacing multicol), B ~21-27, C ~19-25 (contended machine); main-thread idle ~130-180 ms per 5 s for all;
  whole browser saturates 2 cores in swiftshader even for the base page (fps ~4 for base and all looks) -> looks add no measurable idle cost.
- Look C particles switched from a canvas to 18 compositor-only CSS embers (cheaper on software raster); canvas manager removed (no dead code).
- Single-look builds strip the switcher (/*DKSW*/ blocks) and contain only that look's code.
Next: MR subset on single-look builds, final captures, sheets, GIFs, final inventory/behave/perf runs, report.

## 15:20 (final)
- Inventory (final builds): A/B/C 917/917 items present (owner, agent, phone).
- behave.py 90/90; widths: no horizontal overflow at 1440/1100/768/390.
- Regression: full suite on all build 9/9 rc=0; MR suites: t4_mobile rc=0 (all, a, b, c); t2_local 165/0 on retry (one earlier run hit an
  intermittent localStorage race between test tabs); t3_live 127/128 (rapid-tap reaction check, MR page); t5_weekly fails identically on the
  unmodified v75 (pre-existing). Subset for a/b/c: e2e3_n, vtog_n, t4_mobile rc=0 (out/final_status.txt).
- Perf (swiftshader 1440x900, load ~2): go() base 17.9 ms, A 23.4, B 28.4, C 22.9; idle: no long tasks, main thread 125/164/187/144 ms per 5 s;
  the software compositor saturates 2 cores for every variant incl. base (fps 3-4), deck animations on vs off make no measurable difference.
- Shots + sheets + GIFs in shots/. Patch is deterministic (same output twice), base untouched.
