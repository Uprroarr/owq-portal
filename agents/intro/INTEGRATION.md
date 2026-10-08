# intro - integration notes

## How it is applied
It is a SPLICE, not an anchor patch: `splice.py` (provided by the integrator, unchanged) replaces whole GX blocks of the base
with the sources in `gx/`:

```
OWQ_BASE=$SP/v75-final.html OWQ_OUT=$SP/agents/intro/out/portal.html python3 $SP/agents/intro/splice.py
```

Blocks replaced (located by these exact lines in the base, same as before):
1. CSS: the lines from `/*GXcss*/` to `/*GXcssend*/`  <- `gx/gx.css` (poster data URI via `__POSTER__`)
2. UI: from the line starting `/* ===== GX UI` to the first following line equal to `})();`  <- `gx/gx_ui.js` (non-ASCII escaped by splice)
3. Textures: the line starting `const GXTX=`  <- `gx/lights.jpg`, `gx/pack.jpg` (unchanged files)
4. Engine: everything between `/*GXstart*/` and the `const GXTX=` line  <- `gx/gx_engine.js` (ASCII only)

Base lines outside the GX blocks touched: **none**. No new assets, no new textures (the city is pure math on the
existing `lights.jpg` / `pack.jpg` and the engine's generated noise texture). Output grows by about 27 KB of engine/UI
source (base 6,903,818 bytes -> build about 6,931,000 bytes). Base md5 checked unchanged: 71372d4cce273990106bff6542471dc2.

Because it replaces whole blocks, the other builders' anchors are unaffected unless they also edit inside these GX blocks
(bell / crm / deck should not). If another builder changed text inside a GX block, re-apply their change on top of `gx/`.

## Entry points kept (tests and the login glue rely on them)
`GXU.enter/pick/back/skip/granted/deny/state/on/U`, `pickProfile(name)`, GXU states `boot, menu, pick, land, back, launch`,
`GX.init/start/stop/release/step/draw/project/dir.{intro,pick,skip,back,launch,snap,relayout,state,stage}`.

## Changed / added names (all GX-prefixed or inside the GX/GXU closures)
- Director stages (GX.dir.stage callback): `map, pin, dive, entry, land` (was `map, pin, charge, stretch, flash, descent, land`);
  launch still emits `punch` then `flash`. `gx_ui.js` updated accordingly (HUD texts, sounds, pin fade).
- `GX.dir.pick(lat, lon[, info])`, `GX.dir.snap(kind[, [lat,lon][, info]])`: optional city info; by default looked up in the
  engine's city table `CT` by coordinates (all 54 `GXC` entries), else derived from a hash.
- New API: `GX.alt()` (live km), `GX.landAlt()`, `GX.landAltFor(lat,lon)` (landing altitude for the ALT text),
  `GX.cityInfo(lat,lon)`, `GX.warm()` (pre-compiles the close-up program from the menu), `GX.dir.info()`, `GX.S.landSX`
  (horizontal screen position of the landed city, set by the UI).
- New scene params in `GX.C`: `off, yaw, cityK, atmS, expo, dv, tlK`.
- New WebGL programs: `pc` / `pcl` (close-up planet + procedural city, full / Low). Compiled lazily or warmed up from the menu
  (non-blocking with KHR_parallel_shader_compile). Any compile/link failure, or no highp in fragment shaders, falls back to
  the classic `pl` shader automatically (S.pcFail).
- CSS: only `#login.st-land .gxv` / `#login.st-launch .gxv` gradients changed (desktop + a mobile override inside the existing
  `@media(max-width:820px)`).
- No new localStorage keys, no db use, no network.

## Pass 2 (polish)
Same splice, applied on the published v76: `OWQ_BASE=$SP/v76-final.html OWQ_OUT=$SP/agents/intro/out/portal2.html python3 patch_intro.py`.
Only `gx/gx_engine.js` changed (close-up shader); `gx_ui.js` / `gx.css` unchanged. Verified: portal2 equals v76 outside the GX
blocks, engine ASCII-only, idempotent. No new globals, uniforms or entry points.

## Round 3 (city model) - build: GX_DIR=$SP/agents/intro/gx OWQ_BASE=$SP/v77-final.html OWQ_OUT=$SP/agents/intro/out/portal3.html python3 $SP/agents/intro/splice.py
Merge baseline = gx_r0. New code sits in /*GXCITYstart*/ ... /*GXCITYend*/ blocks; existing lines changed only inside my regions.

### gx_engine.js (regions touched)
- FS_PC_BODY: district / Voronoi / honeycomb code (hc, hc2, hb, isl, dres) removed; new helper `sgrid` (lamp-point street
  grid, LOD point -> line -> average); ground lights = streets + industrial floodlights + rural points + shore points, area
  brightness only from smooth noise; highways dimmed near the ground, moving car lights; inland cities forced to land near the
  centre; lakes only outside 0.2-0.5 R; clouds off near the ground; new uniform `uLow` (low-altitude factor, fog length,
  scan ring radius, scan intensity): crimson scan ring, haze, grain. `#define PCQ` variant = fullscreen-quad close-up pass
  (programs `pcq`/`pclq`, used when C.d<1.03, i.e. inside the planet mesh).
- drawPC: quad path, `enuUpdate`, `uLow`. buildCam: tiny mouse parallax near the ground, doubles kept in cam.lonE/tiltE/yawE.
- cityInfo: `h` (final hover 1.4/1.8/2.2/2.6 km by class), `RB` (3D radius 4-9 km), heading (sea or river in the foreground).
- landGeo/landPS: lower camera, `rise:1`; C.rise (0..1) driven by diveApply between 30 and 6.5 km; new stage `model`
  (emitted once below 30 km, forward only). Dive 6.6 s, back() 2.6 s, drift 0.15 deg/s (9 deg/min).
- New block before render(): VS_BLD/FS_BLD (facade: window grid, lit mix 60/25/10/5, floors, crimson rim on the 20 tallest,
  roof lights, fog, grain; Low = uLQ simplified), VS_AV/FS_AV (blinking aviation points), VS_BEAM/FS_BEAM (one crimson
  searchlight cone from the tallest tower, full tier only), `LM` landmark table (14 cities: NYC, Dubai, Toronto, KL, Taipei,
  Tokyo, Shanghai, London, Chicago, Paris, Riyadh, Hong Kong, Moscow, Seoul), `lmList`, `nzS` + `waterAt` (CPU copy of the
  shader's coast/river/lake test), `genCity` (<=6000 / Low <=1500 instances, deterministic per city), `boxGeo`, `bldProg`,
  `cityModel(I)`, `drawBld(I)`, `beam`. Hooks: render() (before the atmosphere pass), initGL (S.nzD), pick + snap('land')
  (cityModel), release() (buffers). Any exception or compile error sets S.bFail -> ground-only look (never black).
- New S fields: bN, bAV, bTop, bRim, bKey, bMs, bDr (draw counter for tests), bFail, nzD, bgeo/bib/bav/bbm.
### gx_ui.js
- kmFmt: one decimal below 10 km; onStage: `model` -> HUD "RENDERING CITY MODEL"; landAlt: one decimal below 10 km.
### gx.css
- unchanged.

### WP6 - reference plate extension point (not implemented)
A per-city top-down night photo (e.g. 512x512 JPG covering 2*RB km, north up, centred on the CT coordinate) can be embedded
as base64 next to lights.jpg and uploaded as an extra sampler `uPlate` (+ `uPlateK` = 1/(2*RB) km^-1, 0 = none). In
FS_PC_BODY, after `Lr` is computed: `vec2 pu=p*uPlateK+.5; float pl=texture2D(uPlate,pu).r;` and use it as a multiplier on
`Lst` (street density) and on `zc` (commercial share), faded by the same footprint (`fg`) and by
`smoothstep(.5,.45,max(abs(pu.x-.5),abs(pu.y-.5)))` so the plate edge never shows. On the CPU, genCity can sample the same
image (decoded once into a canvas) to modulate pB/H, which keeps buildings and ground consistent. Not built this round.
