# BRIEF 4 (city builder): finish the realistic cities (colour, clarity, detail, real city size)

You are a NEW builder continuing work that a previous builder started and could not finish (it was stopped at 11:38 today).
READ FIRST, in order: `$SP/agents/COMMON.md` (round-4b header at the top: base = `$SP/v80-final.html`; machine + safety rules),
`$SP/agents/intro/BRIEF2.md` (round-3 art direction for the 3D city: still valid), `$SP/agents/intro/PROGRESS.md` (how the GX engine and the
city work, incl. the unfinished "Round 4" notes at the end), `$SP/agents/intro/INTEGRATION.md` (regions and API names). Tools: `$SP/agents/intro/tools/`
(`intro_test.py` end-to-end in 7 modes via env MODE=normal|low|still|rm|gl1|nogl|lost, `cap.py`/`gxt.py`/`sheet.py`/`mksheet.py` for frames and contact sheets).
Sources: `$SP/agents/intro/gx/` = the previous builder's partial round-4 work (syntax OK, not fully tested). The read-only round start is `$SP/agents/gx_r1/`.
Build: `GX_DIR=$SP/agents/intro/gx OWQ_BASE=$SP/v80-final.html OWQ_OUT=$SP/agents/intro/out/portal4.html python3 $SP/agents/intro/splice.py`
Its latest pictures: `$SP/agents/intro/shots/r4/sheet_land.png`, `sheet_k20.png`, `sheet_mobile.png` (look at them first).

A second builder (`space`) edits ITS OWN copy of the GX files at the same time (black hole: launch director, FS_BH, bh* functions, `granted()`, sfx). Stay out of those;
keep new code in /*GXCITY*/ blocks; program keys must stay unique (yours are gc*); the integrator 3-way-merges against gx_r1.

## Owner's words (verbatim, Monday)
"Awseome, can you make the cities that get zoomed into once clicking a profile more realstic. Add more coloring, clarity, and detail. Make sure they match the actual city size too."
and then: "continue the render on opus 5.5" / "max"  (he wants the best quality you can reach).

## Goals (what "done" means)
1. MORE COLOURING: realistic, varied night palette: sodium amber + warm-white residential, cool white/blue-white LED arterials and downtown, coloured accents (neon tints in
   entertainment districts, red tail-light vs white headlight streams on opposite lanes, gold-lit landmarks, blue-lit bridges), varied glass tints (blue-grey, bronze, green),
   coloured lit crowns on hero towers. Brand crimson only as an accent. Deep blue-black sky/haze with a thin crimson horizon (no muddy brown-red cast).
2. CLARITY: crisp image: little haze in the foreground, sharp window grids and street lights (no smeared blobs), true blacks in water/parks, bloom only on bright sources,
   no large blurry white points (phone), no "graph paper" look in the middle distance (varied blocks, diagonal avenues, curved roads, irregular rings), towers must read LARGE
   (lower the final camera and/or adjust lens/framing so the skyline has presence) and the CBD must be FULLY visible in the gap between the left location text and the right
   access card on desktop (in r4 NYC/Dubai/Chicago/London/Sydney still sit partly behind the card) and well framed on phone.
3. DETAIL: building variety (podiums, setbacks, slanted/crown tops, cylinders/twisted towers, low-rise roofs with rooftop lights, warehouses), lit streets with moving traffic
   inside the 3D zone, lit bridges, skyline reflections on water, park path lights, stadium floodlights, aircraft lights, landmarks for >= 25 of the 54 cities, better water
   shapes for hero cities (Sydney harbour + Opera House point, Manhattan island with Hudson/East River, Chicago lakefront, Hong Kong harbour, Dubai coast, Thames bends).
4. REAL CITY SIZE: per-city real numbers (the previous builder added a `CTR` table: verify it) drive ground-light extent, 3D region size, building count/height distribution and
   camera altitude: Tokyo/Shanghai/Mexico City/Sao Paulo/NYC huge and dense; Dubai coastal strip with the supertall cluster (Burj Khalifa 828 m dwarfs everything);
   Honolulu/Anchorage/Auckland small; Paris low-rise with La Defense apart; Lagos/Dhaka dense low-mid rise. Put a 6-city table excerpt in your report.

## Quality gate + tests
Contact sheets of 8 cities (final + 20 km) at 1366x860 and phone 390x844 in `shots/r5/`; compare against `shots/r3` and `shots/r4`; look at every sheet yourself and iterate
until it clearly improves. `tools/intro_test.py` must pass in all 7 modes on `out/portal4.html`. Keep 30 fps class on an integrated GPU (Low tier lighter), zero per-frame
allocations, ASCII-only sources, file growth sensible (< 400 KB over v80). Do NOT run runreg/runmr. Use `bash $SP/glrun.sh` for long software-WebGL batches.
Update PROGRESS.md (Round 5 section) and INTEGRATION.md. Time-box: 80 minutes (check `date` at start and every 15 min). Final report <= 300 words incl. owner decisions.
