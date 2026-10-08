# BRIEF (deck builder): Command Deck restyle - THREE distinct looks, the owner picks one from screenshots

Your name: `deck`. Work folder: `$SP/agents/deck/`  (READ `$SP/agents/COMMON.md` FIRST for rules, tools, theme, machine limits, reporting).
Your port: 8772. Prefix for anything new: `dk` (CSS classes `dk-*`, JS globals `dk*`, ids `dk*`, localStorage key `owq_dk`).

## The owner's words (verbatim)
"Also, can you adjust the style and add more visuals or things that catch attention in the command deck. Keep all the info in there, just mess with the design,
You can send me screen shot previews of what it will look like and I can tell you which one to stick with"

So:
- Do NOT remove, hide or demote any information or function the Command Deck has today. Everything he sees now must still be there (and still clickable where it is clickable).
- Change HOW it looks: layout, hierarchy, typography scale, motion, and add visual devices that catch the eye and make the numbers feel alive.
- Deliver THREE clearly different looks (A, B, C) plus preview images. He will look at your screenshots, pick one, and I integrate only that one. A look is
  a different concept (structure + composition + motion language), not a colour swap. At a glance, A, B and C must be distinguishable from across a room.

## What the Command Deck is today (base = `$SP/v75-final.html`, read-only)
Render function `ov()` at line 6365-6377 (the whole deck, returned as an HTML string; `go()` calls it for the tab "Command Deck"). Read it fully with python slicing first
(lines are long; never print more than ~2000 chars of a line). Pieces, in order:
- `hd('Command Deck', greeting + ' All systems nominal.', [+ Policy, + Income, + Expense, + Activity buttons])` page header helper.
- owner only: `cqHtml()` (a block shown to Agency Owner), then `mrBanner()` (Morning Recognition banner/status; module code between /*MRstart*/ and /*MRend*/).
- `<div class=deck>` with three columns: `.dl` (left: `mod('Sales',..)` style module tiles with a value, a subtitle, a sparkline `spk(..)`, click target tab), `.dc` (centre: `reactor(cu(s.net,'$'), m/D.goal, 'NET PROFIT')`
  = the animated arc reactor gauge, monthly goal text, `.chips` with HEALTH score etc.), `.dr` (right: Finance, Growth Path, ... modules). Find every module with `grep -o "mod('[A-Za-z ]*'"`-style slicing.
- `pulseHtml()` (line 6344): "Live Pulse" block (team hours, live clocks, per-agent activity).
- `.g2` row: `Command Briefing` (brief() lines with severity classes `.bl .ok/.warn/...` and staggered `animation-delay`), `Follow-Up Queue` (`.qr` rows, overdue in red, click -> Clients).
- `Agent Progress: Last 7 Days` (`gpBars(R)` bars, opens Agency Performance > Agents), a recent-activity/event feed built from policies/income/expenses/notes (`ev=[...]`), `Latest Alerts` (`latestAl()` + "Open alert center" button).
- `mrDeck()` (Morning Recognition tile) and `chDeck()` (Team Chat tile, line 5385).
Helpers you will reuse: `mod`, `reactor`, `spk`, `cu`, `P`, `$`, `pulseHtml`, `brief`, `gpBars`, `latestAl`, `agentRows`, `S()`, `PA()`, `HS()`, `FC()`, `esc`, `av`, `openTab`, `openM`.
Existing CSS for the deck lives in the main `<style>` (search `.deck`, `.dl`, `.dc`, `.dr`, `.mod`, `.reactor`, `.chips`, `.bl`, `.qr`, `.dh`, `.cq`). Keep the existing class names and ids
(tests select on them: add classes, wrap elements, add attributes; renaming is allowed only if you also keep an equivalent hook). Keep onclick targets and keyboard activation (`Enter` on `.mod`).
Other pages must look exactly as before: scope every new rule under a deck root class (e.g. `.dk-root.dk-a ...`) and never restyle shared primitives (`.c`, `.kpi`, `.btn`, `hd()`...) globally.

## Step 0: baseline + inventory (do this first)
1. Seed realistic demo data (see Step 4) and screenshot the CURRENT deck (desktop 1440x900 full page as Agency Owner, as Nate, and phone 390x844) -> `shots/base_*.png`. Look at them.
2. Write `inventory.py`: logs in, opens the deck, extracts every visible text token (labels, numbers, names), every element with an `onclick`/role=button/link and where it goes, plus the list of
   section headings, into JSON (`inv_base.json`). After your restyle, a test must prove that every baseline item still exists in each look (matching numbers/labels; allowing formatting/animation:
   compare the final settled text, i.e. wait until count-ups finish). This is how we prove "keep all the info".

## Step 1: the visual toolkit (attention catchers). Each look uses a DIFFERENT selection and composition of these; invent more if you have better ideas
- Count-up numbers (tween from the previous value to the new value, easing, tabular figures), odometer/flip digits for the big number.
- Ring / arc gauges for monthly goal %, health score, per-agent weekly goal; segmented LED bar meters; needle gauges; thermometer; bullet charts.
- Sparklines that draw themselves with a glowing head dot; area charts with gradient fill; 14/30-day heat strip (cells coloured by activity); week rhythm strip (Mon-Sun, today in gold).
- Reactor / orbit motifs: concentric rotating rings with tick marks, orbiting dots, pulse waves, radar sweep with blips for agents, scan lines.
- Live ticker / marquee of the latest events (policy issued, activity, alerts, chat) - built only from data already shown.
- Leaderboard devices: top-3 podium, crown for #1, rank chips, streak flames, "on duty" gold dots, progress-to-goal race lanes.
- Attention states: pulsing red dot / glow on overdue follow-ups and critical alerts, gold shimmer for "today", "needs you" call-out strips, subtle shake-free emphasis.
- Atmosphere: very subtle animated background (CSS gradients/grid drift, embers or star particles on a small canvas), glass panels with neon edge-light, corner brackets, glow that follows the pointer,
  parallax on the hero, staggered entrance of the tiles.
- Celebration: when the monthly goal % crosses a milestone (25/50/75/100) or a new policy lands, a restrained burst (particles/ring flash) - only on a real change, never on every render.
- Hero band: big greeting with date, live clock, mission status line ("All systems nominal" must remain), the headline number.
Quality rules for motion: purposeful, smooth (60 fps CSS transforms/opacity; avoid animating blur/box-shadow on many nodes), no jank on a 2-core software renderer, nothing flashes or shifts when a live refresh re-renders.

## Step 2: the three looks (you may improve on these concepts, but keep them truly different)
- LOOK A "REACTOR HUD": symmetrical sci-fi cockpit. The arc reactor becomes a big hero centrepiece (layered rings, tick scale, orbiting markers, glow), modules orbit around it as slim holographic
  panels with corner brackets, scan-line shimmer and glowing sparklines; strong crimson with white-hot cores and gold accents. Dense but organised, "Iron Man HUD".
- LOOK B "MISSION CONTROL": ops-centre wall. Full-width live ticker on top, a KPI strip of big tabular numerals with delta chips, tile grid with segmented meters, radar with agent blips, 30-day heat strips,
  a clear "NEEDS ATTENTION" column (overdue follow-ups, critical alerts, missing check-ins) with pulsing markers. Information density and scan-ability first; calmer motion, sharp, technical.
- LOOK C "CINEMATIC HERO": immersive, magazine/trailer feel. A tall hero band with drifting embers/starfield, a giant count-up headline number and goal ring, the leaderboard as a podium with avatars,
  larger glass cards with generous spacing, spotlight/parallax on hover, bold typographic hierarchy. Fewer, bigger moments; the rest tucked into elegant cards below.
Each look must work at 1440, 1100, 768 and 390 widths. Mobile is a real layout, not a shrunk desktop (stack, horizontal swipe strips where it helps, tap targets >= 44 px).

## Step 3: technical requirements
- Deliverable is a patch script `patch_deck.py` (see COMMON.md) with env `DK_LOOK` = `a` | `b` | `c` | `all` (default `all`). `all` ships the three looks and a tiny look switcher (chips A/B/C in the deck header,
  choice remembered per device in localStorage `owq_dk`; also `?dk=b` in the URL). A single-look build ships ONLY that look's CSS/JS (no dead code) and no switcher. Source files kept in `$SP/agents/deck/src/`
  (`deck_common.js`, `deck_a.css/js`, `deck_b.css/js`, `deck_c.css/js`, ...). ASCII only in the injected code.
- Keep `ov()`'s data logic. Prefer: replace the template part of `ov()` by a version that builds the same data with new markup, built by small functions in your own files, keeping the anchors in the base
  minimal (ideal: one `rep()` on the `function ov(){...}` head so `ov` delegates to `dkOv()` and falls back to the old rendering if your code throws - wrap in try/catch and log nothing noisy).
- Animations: play entrance + count-up on the first render of the Command Deck per page load, and when a number really changes (tween from the last shown value, stored in a `dkPrev` map keyed by data-key).
  A live re-render (db snapshot, timers, `go()` calls) must NOT replay entrance animations, must not reset scroll, must not flicker. Verify this with a test that calls `go()` repeatedly and compares.
- Respect reduced motion (`RM`, `.redmo`) and the graphics tier (localStorage `owq_gq` = 'low' | 'still' | auto): no particles/orbits when low/still/reduced; static but still good-looking.
- Canvas/particle effects: <= 30 fps, pause when `document.hidden` or when the Command Deck is not the active tab (cancel the rAF loop and remove the canvas), cap particle counts, no external assets.
- Accessibility: keep roles/labels/focus order; text contrast >= 4.5:1 for body text over effects; decorative layers `aria-hidden`; all animation off for reduced motion.
- No new network, no new db docs, no new persisted data except `owq_dk` in localStorage.
- Performance budget: measure the deck render time (ms) and the CPU cost of idle animation (long-task count / rAF frame time over 5 s in swiftshader) for base vs A/B/C; report numbers; idle animation must stay cheap.
- Do not touch anything outside the Command Deck markup/CSS (except the small anchor above). If you need a shared helper from the base, call it; do not edit it.
- All regression tests that exist must stay green with your `all` build and with each single-look build (`bash $SP/runreg_for.sh out/portal_a.html out/reg_a` etc.; run the full suite for `all` once, and a deck-relevant subset for a/b/c; ask yourself which tests touch the deck: grep the tests in `$SP` for `Command Deck`/`.deck`/`.mod`).

## Step 4: preview screenshots = the main deliverable (I send them to the owner, so they must look great)
- Demo data (fake but realistic; names/phones/emails per COMMON.md, never real secrets): ~16 policies this month across the 6 agents with a mix of Submitted / Issued / Paid / Declined and sensible premiums
  (final expense $40-120/mo, term, IUL up to $300/mo; AP = annual premium), prior 3 months of income/expense history, 14 days of activity logs (hours, contacts, appointments), ~14 clients with follow-up dates
  (some overdue, some today), 2-3 alerts, a running challenge, check-ins, Morning Recognition (one posted, one pending), a few team chat messages so the chat tile has content, Live Pulse showing 3 agents online.
  Seed through localStorage `owq_v3` (state `D`) exactly like the other tests do (study `$SP/mr/mrt.py` and a regression test such as `$SP/nagt_n.py` for how D is structured and how logins are done). Use a fixed fake clock
  (e.g. Tue 2026-10-06 09:40 America/New_York, see `shift_js` in `mrt.py`) so every screenshot is reproducible.
- Capture: `shots/{base,a,b,c}_owner_desktop.png` (1440x900 full page), `..._agent_desktop.png` (as Nate), `..._phone.png` (390x844 full page), and a settled frame after count-ups/entrance finish (wait for them).
  Also hero crops (top 900 px) at 2x for detail. Then build `shots/compare_desktop.png` (Base | A | B | C, each scaled so details remain legible, labelled "BASE / A / B / C") and `shots/compare_phone.png`
  (four phone captures side by side) with PIL. Look at EVERYTHING with the Read tool; fix overlaps, clipping, low contrast, awkward spacing, ugly empty areas; iterate until each look is something you would be proud to ship.
- Motion previews (the owner cannot see animation in PNGs): ffmpeg exists on this machine. For each look record ~6 s (deterministic or Playwright video) and write `shots/a_motion.gif` (and b, c) at ~720 px width,
  <= 3 MB each (palettegen/paletteuse, 12-15 fps). The GIF must show the entrance, the count-up and the idle motion. Swiftshader is slow, so prefer capturing frames with a controlled clock (e.g. step
  `requestAnimationFrame`/CSS animations via `page.clock` or `Animation.currentTime` seeking, or screenshot every N ms with the fake clock advancing) then assemble with ffmpeg. State clearly in the report how the GIFs were made.

## Deliverables (all inside `$SP/agents/deck/`)
`src/*`, `patch_deck.py`, `out/portal_all.html`, `out/portal_a.html`, `out/portal_b.html`, `out/portal_c.html`, `inventory.py` + `inv_base.json` + inventory test results, `INTEGRATION.md` (every base anchor replaced, global names added),
`PROGRESS.md`, tests + results, `shots/` (everything above), final short report: for each look a name, a 2-sentence description, the devices it uses, perf numbers, the exact build commands, and your own recommendation of which look
is best for a sales-floor team and why. Do NOT publish anything and do not send anything to the owner: I do that.
