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
- `vo/src/derby.js`: the Sky Park as a real ballpark (field shader, fence ads, stands with fans, dugouts, light towers, jumbotron, suite, plaza). `vo/src/fly.js`: the Skyport over the skybridge (900 m runway with markings, edge and approach lights, PAPI; apron, OWQ AIR hangar, control tower), the flight model (throttle, stall, gear), landing guide, landing assist (T), practice approach (R) and the crash limits (`LIMITS`).
- Scores: `landing` (best landing out of 100) and `lasertag` (wins) join the team bests in the `arc` collection.
- Tests: `web/test/t_arena.py`, `t_tag2.py` (two players), `t_park.py` (derby, skybridge, takeoff, assisted landing, belly-landing crash), `t_drive.py` (barriers, cars, ragdoll, blocking, lap); pictures: `dbg_park.py`, `dbg_v107.py`, `dbg_arena*.py`; unit checks `vo/test/arena_test.mjs`, `fly_test.mjs`, `drive_test.mjs` (run with bun).
