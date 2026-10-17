# OWQ portal: source backup

This branch holds the working source for the portal's add-ons. GitHub Pages serves only `main` (live at the root, preview at `/preview/`), so nothing here is served or affects the site.

Never commit the base portal HTML (`vNNN-final.html`; it has the access codes and the team's records), `web/private/`, data exports, or anything with the team's codes or emails. `tools/` holds only helpers that passed the code and email scan.

## Layout
- `vo/src/`: the 3D Sales Floor library (three.js r169). `vo/three/` holds the three.js build it imports.
- `agents/<feature>/`: patch scripts that add features to the portal HTML (JS, CSS and Python patchers).
- `web/`: website build (`build_web.py`), cloud adapter (`web/src/owqcloud.js`), database rules and Playwright tests (`web/test/`).
- `recovery/`: notes and tools used to rebuild sources from a deployed build.

## Build
1. Library: `cd vo && mkdir -p node_modules && ln -sfn ../three node_modules/three && bun build src/iife.js --minify --format=iife --outfile=dist/vo.js`
2. Portal: patch scripts swap the library into the base HTML between `/*VO3lib*/` and `</script>`, and add each feature's block (`/*XXXstart*/ ... /*XXXend*/`).
3. Site: `cd web && OWQ_BASE=../vNNN-final.html OWQ_SITE=site_prod python3 build_web.py` (add `OWQ_TEST=1` and `OWQ_SITE=test/site_x` for the fake-database test site).

## If the workspace is reset
The deployed builds on `main` hold the full compiled code. `index.html` is live and `preview/index.html` is the preview. Each feature block is readable there. The 3D library is minified, but `bun build` is deterministic, so a rebuilt source can be checked byte for byte against the deployed bundle.

## v106 world (Sales Floor library)
- `vo/src/world.js`: sky, night city (instanced buildings with procedural windows), the OWQ tower shell, zones (which floor the camera is on) and the Ring Run course. The city keeps clear of the Sky Deck, the rings and a takeoff boulevard east of the tower.
- `vo/src/sky.js`: the Sky Deck, a hanging loop track reached through the west door (jumps, boosts, checkpoints, lap timer).
- `vo/src/walk.js`: walking (WASD, run, jump, E use, Q back to desk), the elevator (3 Sky Park, 2 Sales Floor, 1 Firing Range), knockdowns.
- `vo/src/drive.js`: cars on the Sales Floor and the Sky Deck, jump assist, knocking walkers over, lap board.
- `vo/src/derby.js`: Sky Park Home Run Derby (START button, queue, scoreboard). `vo/src/fly.js`: planes from the hangar pad, Ring Run. `vo/src/range.js`: Firing Range lanes.
- `agents/world/`: the portal block that carries walking/flying/derby/range presence and scores (`patch_world.py` builds vNNN+1 from the base).
- Tests: `web/test/t_walk.py`, `t_park.py`, `t_duo.py` (two players), `t_drive.py`, `t_yell.py`, `t_v105.py`; unit checks in `vo/test/`.

## v107 overhaul (graphics, laser tag, Skyport, ballpark, circuit)
- `vo/src/gfx.js`: the graphics engine. Baked PBR texture sets (asphalt, concrete, polished, grass, clay, metal, corrugated, container, wood, carpet) made once on the GPU per quality level, the `mat()` cache, `patch()` for shader-painted markings (world position `vWP`, track coordinates `aTrk`, shared value noise), `sweep()` (profiles along a path), glow sprites, light pools, particles (sparks, smoke, flame, dust), crowds, quality levels (auto / high / medium / low, toolbar button) and `gfxFrame()`.
- `vo/src/sky.js`: the 2.5 km Sky Deck circuit (cable-stayed bridge, tunnel, two jumps, boost pads, grandstand, start lights and gantry); barriers with two sides by the plaza.
- `vo/src/drive.js`: rebuilt car physics (tyre grip, drift, drag, coasting), barrier impulses with spin and scrape, cars as oriented boxes against each other, slow cars blocked by people, fast cars send people flying. `vo/src/ragdoll.js`: the ragdolls (fly, tumble, bounce, lie, get up; every screen plays the same hit).
- `vo/src/arena.js`: Laser Tag 1v1 from the terminal in the Firing Range: three maps (Neon Warehouse, Rooftop, Office Blitz), a bot (easy / normal / hard), matchmaking on the arcade queue (`aq`, games `tagwarehouse`, `tagrooftop`, `tagoffice`), the match on a private room (`arcNet`). CS:GO aim (0.022 degrees per count times sensitivity, raw pointer lock), Source-style movement, hitscan with head / body / leg zones, first to five.
- `vo/src/derby.js`: the Sky Park as a real ballpark (field shader, fence ads, stands with fans, dugouts, light towers, jumbotron, suite, plaza). `vo/src/fly.js`: the Skyport over the skybridge (900 m runway with markings, edge and approach lights, PAPI; apron, OWQ AIR hangar, control tower), the flight model (throttle, stall, gear), landing guide, landing assist (T), practice approach (R) and the crash limits (`LIMITS`, set from the `RULES` presets easy / normal / strict with the CRASH RULES button, saved in `owq_crash`).
- `vo/src/range.js`: lanes are first person (my avatar steps out of the picture, my own blaster is held in front of the camera, turns toward the crosshair and kicks when it fires; shots leave from its muzzle).
- Scores: `landing` (best landing out of 100) and `lasertag` (wins) join the team bests in the `arc` collection.
- Tests: `web/test/t_arena.py`, `t_tag2.py` (two players), `t_park.py` (derby, skybridge, takeoff, assisted landing, belly-landing crash), `t_drive.py` (barriers, cars, ragdoll, blocking, lap), `t_range.py` (first-person lanes); pictures: `dbg_park.py`, `dbg_v107.py`, `dbg_arena*.py`, `dbg_final.py` (every place in play, stepped), `dbg_rcam.py`; unit checks `vo/test/arena_test.mjs`, `fly_test.mjs`, `drive_test.mjs` (run with bun).

## v108 day counts (Clients book counts toward the day)
- `agents/dayc/patch_dayc.py` (applied on top of v107 by `build.sh`, source `agents/dayc/dayc.js`): `dayCounts(day, who)` merges the Activity log with the Clients book. A contact is a person added by hand (imports, migrated and demo records do not count) or reached with a call, text, email or meeting that day; an appointment is one booked that day (cancelled ones drop out). Per person the higher of the two sources counts, so an Activity total that already includes the Clients work is never added twice.
- Used by the Morning Recognition goals (`mrVal` for `con` and `app`), the Live Pulse (`pulseData`) and the check-in prefill (`ckAuto`). A change in the Clients book refreshes the pinned recognition cards. The Leaderboard, Battle Pass XP and credits still read the Activity log only.
- Test: `web/test/t_dayc.py`.

## v109 live tracking and the Time Report
- `agents/trk/patch_trk.py` (on top of v108 in `build.sh`, source `agents/trk/trk.js`): every minute on the clock the time clock's heartbeat (`acBeat` -> `trkBeat`) adds to the open shift (`s.tk`) what that minute was: `w` working (click, key, scroll, touch, mouse), `l` Sales Floor only (in the voice lobby, no input), `p` on screen with no input, `h` away (portal hidden); plus `s` speaking and `m` mic on in the lobby, `g` 3D games, `i` interactions, `t` minutes per section. It syncs with the shift.
- Agency Performance > Time Report (`trkPage`, `trkReport`): one agent's week (owner: anyone; agents: themselves), sessions cut at midnight, hours as the union of sessions (two devices counted once), long sessions, sessions with no clock-out counted to their last heartbeat, hours logged by hand, and the Leaderboard's figure side by side.
- `shEnd(s)`: a shift with no clock-out counts to now only while it is live, otherwise to its last heartbeat (Time Clock, Live Pulse). The Agents scorecard column reads "Hours (all time)".
- Test: `web/test/t_trk.py`.

## v110 portfolio money counts toward revenue
- `agents/pfrev/patch_pfrev.py` (on top of v109 in `build.sh`): `pfInv()` is the owner's money invested (the Portfolio's cost basis: what was paid for what is held, fees included). `S()` adds it to `rev` (Total Income) and so to `net`, on the owner's screen only (`pfOwnerNow()`; the portfolio is the owner's private document), as `s.pv`.
- Business Performance: Summary (Total Income names the invested part; Income vs. Expenses includes it), Income (a Portfolio Invested card and donut slice), Statement (a Portfolio Invested column; `pfInvMonths()` gives each month's change with the portfolio's average-cost book keeping, so the months add up to the cost basis). Months with only portfolio buys or sells show in the money views (`pfMs`), not in the agency charts. The Command Deck, ticker and assistant use the same totals. Lead ROI (health score, brief) stays on the agency's own income.
- Test: `web/test/t_pfrev.py`.

## v111 Call Script (John Montini's veteran final expense guide in the CRM)
- `agents/gs/patch_gs.py` (on top of v110 in `build.sh`; module `agents/gs/gs.js`, script data `agents/gs/gs_data.json` taken from John's guide page and inlined as ASCII JSON): Clients > Call Script (tab bar and sidebar), a Call script strip on every client record (under the action buttons), a Call script button in Today's detail pane and an "Open call script" palette entry.
- Same 37 steps in 5 parts, branches and objection answers as the guide: what you have on the lead (DOB, email) and the client's response change what to confirm or ask; objections reveal the suggested answer; Stop calling ends the call respectfully. The client's first name, DOB, email, city and state come from the record; the caller's own name replaces John's; your phone and NPN are kept on the device (`owq_gs_me`, per person).
- Note it (per step): branch, who needs coverage, goal, final expense plans, current coverage, health answers, home and comfortable payment, the three options (benefit and monthly), recommendation (fills [OPTION]) and choice, beneficiary, draft date. Save notes / outcomes write to the record (DOB, email, city, state, info.goal, info.house, info.budget, info.health, info.bname/brel, `ap` = chosen monthly x 12, product Final Expense when empty, Veteran and Spouse tags) and log through the CRM: Application submitted (call event + Log policy), Appointment set / Call back (note + Schedule), Interested, Not interested, Do not contact. Undo is offered.
- A Social Security number, bank details and income are never typed into the portal (the secure steps say so and have no inputs). The call in progress stays in the browser tab (`sessionStorage owq_gs`) until New client / Reset. Print / Save as PDF prints the whole script for the client with the objection answers used and the call notes.
- Tests: `web/test/t_gs.py`; pictures: `web/test/dbg_gs.py`.

## v112 owner starting credits
- `agents/ecost/patch_ecost.py` (on top of v111 in `build.sh`): `EOWN=10000` "Owner starting credits" (one time) in `ecoEarn` for the owner's wallet. Agency Owner and Cole Leckey share that wallet (`bpName`), so it counts once. Credits only: Battle Pass XP (`bpXP`), tiers and unlocks are unchanged.
- Test: `web/test/t_ecost.py`.

## v113 guest passes (website)
- `web/src/guests.json` lists passes (`id -> {n: name, exp: end date}`); `build_web.py` puts them in the page as `OWQ_GUESTS` and appends `web/src/guest.js` after the app (like `vfix.js`).
- `owqcloud.js`: a `?guest=<id>` link never starts Firebase (every `claude.use()` is "not available here", so the portal runs in local mode and no shared data can load), gives the page its own storage space (`localStorage`/`sessionStorage` keys prefixed `owqguest:`, so it never mixes with a member's saved data on the same browser) and shows a GUEST PASS gate. An ended pass says so and clears that space; an unknown id says the link is not valid. The normal link is unchanged.
- `guest.js`: first visit loads the built-in sample data (`demo()`: the guest plus two sample teammates, 9 sample clients owned by the guest, 3 months of policies, activity, income and expenses); Enter plays the normal cinematic login and signs in as the guest (no code; whatever profile is picked, it is the guest); the sidebar status line reads GUEST PREVIEW · SAMPLE DATA; when the pass ends the open page returns to the gate.
- Test: `web/test/t_guest.py`.

## v114 Agency Performance holds Business Performance; edits; Command Deck sneak peeks
- `agents/apx/patch_apx.py` (on top of v112; module `agents/apx/apx.js`): Agency Performance tabs are Overview | Sales: Policies, Agents, Time Report | Money: Income, Expenses, Statement, Portfolio (owner). Business Performance leaves the page map and sidebar; `openTab('Business Performance', x)`, `tab='Business Performance'` and code that sets `SUB['Business Performance']` while on Agency Performance all land on the matching tab (`apxNorm`, called at the start of `go()`). The money tabs reuse `bz()` (and the Portfolio wrapper) without their header and tabs; Statement gets the 12-month charts above the table; Income lists every entry.
- Overview: six month-to-date tiles (issued, submitted, placement, income, expenses, net profit) with 12-month sparklines and change against the same days of last month, the 12-month production and profit chart, the monthly goal ring, funnel, top producers, income and expense mix, product mix and the latest policies.
- Edits (`apxEdit`/`apxSave`): policies (any status), expenses, income and activity open their add form filled in, save in place (found by sync id, object, or same fields after a sync) and can be deleted there. Pencils on the policy list, the Overview's latest policies, the expense list, income entries and the new Activity log under Agents.
- Command Deck (`ov`; the old one is `ovClassic`): reactor with issued / income / net profit / team pace modules, Live Pulse, sneak peeks (Agency Performance, Money, Production Equation, Clients with the follow-up queue), briefing, alerts and agent progress, Morning Recognition and the challenge.
- Each agent's submitted premium that is not issued (status Submitted): a scorecard column (with the count), a card on the agent report, and a line under each top producer on the Overview.
- Tests: `web/test/t_apx.py`; `t_pfnav.py` expects the new dropdown.
