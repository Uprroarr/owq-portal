# BRIEF (intro builder): realistic city-at-night landing + continuous dive into the picked city

Your name: `intro`. Work folder: `$SP/agents/intro/`  (READ `$SP/agents/COMMON.md` FIRST for rules, tools, theme, reporting).
Your port: 8773. Prefix for anything new: `gx`/`GX`.

## The owner's words (verbatim, two messages)
1. "Also, with the intro, can you have the world map look more realistic once they pick their login. It just looks like blurry figures of the map.
   Like make it transition into the random city that it generates."
2. "what happened to enhancing the intro with realistic images and stuff of the cities it zooms into when you click on your person's name"
So: after a person clicks their name on the login globe, the camera must DIVE from the globe into the randomly chosen city and arrive at a
believable, sharp, realistic-looking city at night. Today it arrives at orange blurry blobs. He wants it to look real.
You cannot download satellite photos (sandbox has no internet except package registries/GitHub). So the city detail must be GENERATED in the shader
(procedural, per-city, deterministic) and be convincing. Be upfront in your report about that.

## What exists today (all sources are in `$SP/agents/intro/gx/`, identical to what is embedded in the published base)
- `gx_engine.js` (~470 lines): raw WebGL1/2 engine `GX` (no libraries). Fragment shader `FS_PL` draws the planet: ocean/land from `pack.jpg`
  (R clouds, G land mask, B bump), `lights.jpg` night-lights (2048x1024 = about 19.5 km per texel at the equator!), clouds, rim light, specular,
  Voronoi "vein" lava network (`vein()`), haze, graticule, alert pings. Scene params object `C` ({d, fov, shX, shY, pitch, tilt, lon, spin, sunR, sunA, sunAbs,
  haze, sunI, sunVis, warp, flash, fade, entry, veinK, cloudK, gridK, atm, lod, ...}), tween/timeline helpers, camera (`buildCam`: earth radius 1,
  camera distance `C.d` from the center, near plane 0.01!, far 80), `project(lat,lon)` used by the DOM pin/labels, adaptive render scale (`S.scale`), quality tiers.
  Director `GX.dir`: `intro()`, `pick(lat,lon)` (stages map-in, map, pin, charge, stretch (hyperdrive streaks), flash (white-out swap), descent, land),
  `skip()`, `back()`, `launch()`, `snap(kind,aim)`, `relayout()`, presets `PS(kind,asp)`; land preset is d=1.06 (about 380 km), fov 58, pitch .9.
- `gx_ui.js`: `GXU` = menu/pick/land/launch state machine and DOM overlays, `GXC` = the 50 cities `[name,country,lat,lon,tz]`, HUD texts ("ESTABLISHING SECURE LINK",
  "ACQUIRING TARGET", "TARGET LOCKED", "ENGAGING HYPERDRIVE"), pin + label, "LOCATION ACQUIRED / CITY / COUNTRY / coords / LOCAL time / ALT 380 KM" overlay (left), login
  card (right), sound effects (WebAudio), graphics panel (Auto / Low / Still), reduced-motion handling. `pickProfile(name)` (global, defined in the login glue) starts it.
  Tests call `lgx.login(page, idx)`: waits GXU state `menu`, `pickProfile(...)`, waits state `land`, types the code, `doLogin()`. KEEP these entry points and state names working.
- `gx.css`, `lights.jpg`, `pack.jpg`, `poster_idle.jpg` (CSS poster for the no-WebGL fallback).
- Current look (screenshots): `$SP/intro/i_land1.png` (landing: orange blurry streaks = the problem), `$SP/intro/i_pick2.png` (globe with pin + hyperdrive streaks), `i_menu.png`.
- Root cause: at the landing the ground is the 2048x1024 lights texture magnified about 45x plus a Voronoi "vein" pattern => blurry glowing blobs. Nothing sharp exists.

## Tools I prepared for you
- `splice.py` builds a full portal from your edited sources: `OWQ_BASE=$SP/v75-final.html OWQ_OUT=$SP/agents/intro/out/portal.html python3 splice.py`
  (reads `gx/` next to it; self-test: unchanged sources reproduce the base byte-for-byte). Keep editing the files in `gx/`.
- Standalone engine pages `gx/gx_test.html`, `gx/gx_tl.html` (serve `gx/` with `python3 -m http.server 8773 --bind 127.0.0.1` from inside `gx/`) and
  `tools/tl.py prefix scenario lat lon t1,t2,.. [W H]` / `tools/shot.py` for DETERMINISTIC frame capture of the director timeline (manual stepping, no real-time dependence:
  essential because swiftshader is slow). `tools/gxt.py` drives the real portal login (env `OWQ_FILE`, `MODE=nogl|rm|normal`, `W`,`H`; steps like `waitst:menu key:Enter waitst:land shot:x.png`).
  (Standalone pages call `GX.dir.pick`, so make sure new director code works with manual `GX.step()` stepping too.)

## What to build
A. SHADER REALISM (the heart of it). In `FS_PL` (or an extra pass/program if cleaner) add a procedural night-city layer that fades in with zoom (use C.d / footprint / a `uCityK` uniform):
   - Use the picked city's lat/lon (pass a uniform; also compute a local east/north basis) to get metric local coordinates in km on the ground. Do the ray/sphere intersection
     analytically per pixel (camera pos + ray) instead of trusting the coarse mesh interpolation, so detail is exact and does not swim.
   - Macro density from the existing `lights.jpg` (sprawl shape, nearby towns/highways between cities), micro structure procedural:
     bright dense core (downtown) -> fractal sprawl edge (fbm threshold) -> suburbs as sparse dots -> dark countryside; arterial roads radiating from the core and a ring road/bypass,
     highways connecting to neighbouring settlements, street grids in several districts with different rotations (blocks 100-250 m), irregular old-town street patterns in the core,
     dark voids for rivers (meandering), lakes/parks/cemeteries, harbour/airport/industrial zones (sparse bright rectangles / long runway lines), bridges as light lines across rivers,
     coastline when near the sea (use `pack.g` land mask refined with noise so coasts are not blocky), ships/port lights optional.
   - Light palette: mix of warm sodium orange (older districts), neutral white LED (newer), a few cyan/green commercial accents; faint crimson tint in the glow to stay on brand,
     but REALISM first (think ISS night photography / Black Marble). Light-pollution glow (bloom-like halo around the core) done analytically in the shader.
   - Per-city variation, deterministic from the city: size class (megacity vs mid-size), grid orientation, river/coast placement. A small table keyed by the 50 cities in `GXC`
     (population class, sea direction if coastal, major river yes/no) is welcome; otherwise derive from a hash of name + the land mask.
   - Anti-aliasing: no moire/shimmer at any zoom. Work from the pixel footprint (uniform `uRpp` exists = radians-ish per pixel; WebGL1 has no fwidth without an extension) and
     fade fine detail (street texture) into an averaged glow when sub-pixel. Roads should be 1-2 px crisp lines when resolved.
   - Keep the lava "veins" only as far-away globe look if you still like them; they must not appear as the landing ground.
   - Clouds: thin translucent wisps that can drift over the city (keep some, dimmed, they sell realism); also a thin bright atmosphere/airglow line at the horizon at the top of the frame.
B. CAMERA/CHOREOGRAPHY. Replace "pin -> hyperdrive streaks -> white flash cut -> blurry descent" with one continuous zoom from the globe into the city:
   pin drop (keep the DOM pin + label alignment through `GX.project`) -> the camera accelerates toward the pin -> (a short tasteful speed/streak or atmosphere-entry glow is OK
   but NO hard white-out cut that hides a swap) -> clouds part, coastlines and regional light clusters resolve, then the city's street network resolves -> settles in a slow, gentle
   drift over the city at an oblique angle (think 60-150 km altitude and/or a narrower telephoto FOV so the frame covers roughly 40-90 km of ground; you decide what looks best),
   with the horizon + atmosphere glow in the upper part of the frame. Stage names the UI listens to (`map`, `pin`, `charge`, `stretch`, `flash`, `descent`, `land`) may change, but then
   update `gx_ui.js` consistently (HUD text, sounds, `onStage`). The login card (right ~390px, vertically centred) and the left "LOCATION ACQUIRED" block must remain readable over the final frame
   (keep detail contrast sensible, maybe a gentle vignette/darkening where text sits). The overlay's "ALT 380 KM" text must match the final altitude you choose (update `renderLoc`).
   Dynamic camera near plane (the current near=0.01 would clip the ground below ~63 km altitude). Total pick->land time about 6-8 s (today about 5.5 s). `skip()` (Enter/Esc/click during the dive)
   must jump to the same final landing view smoothly; `back()` ("Switch operator") must return to the globe smoothly; `launch()` (access granted) must still do its punch-out from the new landing view.
C. FALLBACK TIERS (all must still work and look good): GFX "Low" (fewer octaves/less detail, same composition), "Still image" and reduced-motion (render ONE good static landing frame via `GX.dir.snap('land',[lat,lon])` + `draw()`; the city layer must work with `S.still` / manual draw),
   WebGL1 context, adaptive resolution scaling (`S.scale`), context-lost fallback to the CSS poster, and the no-WebGL path. Mobile portrait (390x844): composition must still show the city + horizon; the card sits lower there.
D. PERFORMANCE: target >= 30 fps on a mid integrated GPU at 1366x768-1080p. Bound the per-pixel work (small fixed loops, <= ~3 octaves of fbm per layer, cheap hash), switch layers on only when needed
   (zoomed in), and make sure the globe view cost does not increase. You can only test under swiftshader (software), so measure RELATIVE cost (ms per frame at a fixed size, before/after) and keep it modest;
   report the numbers. Do not rely on features missing from WebGL1 (use extensions guarded by checks if you want derivatives).

## Acceptance (I will check the screenshots myself)
1. For six different cities (e.g. Warsaw, Tokyo, New York, Sydney, Cairo, Sao Paulo) a contact sheet of frames across the dive (pin, 4 mid-dive frames, landed) at 1280x720, plus the landed frame at 390x844 portrait
   and the Low and Still variants for one city. Look at them yourself and keep iterating until the landed frame looks like a real night-time city from above: sharp, structured, varied, believable. No blobs, no blur, no banding, no moire, no visible texture stretching, no hard cut.
2. The dive reads as ONE continuous camera move into the exact city under the pin (pin/label stay glued to the city until the label fades).
3. Test suites: the regression suite for your build must be all rc=0 (`bash $SP/runreg_for.sh out/portal.html out/reg`), plus an intro-specific browser test you write that drives pick -> land -> back -> pick again -> login -> launch with swiftshader, asserting states, no page errors, and that skip/back/launch work.
4. No new external dependencies; keep `gx_engine.js` and `gx_ui.js` ASCII except what `splice.py` escapes; do not add much weight (the two textures are 125 KB and 423 KB; if you want a small extra texture (e.g. a 512x512 tileable detail/noise or blue-noise) generate it with python and embed it the same way via splice, but prefer pure math).

## Deliverables
`gx/` sources (engine, ui, css, textures), `splice.py` (already provided; extend if you add assets), `out/portal.html` built from the base, `INTEGRATION.md` (it is a splice, not anchors: say so, and list any
base lines outside the GX blocks you needed to touch, ideally none), `PROGRESS.md`, test scripts + screenshots, and the final short report. Do NOT publish anything.
