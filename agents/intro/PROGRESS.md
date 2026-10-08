# intro builder - PROGRESS (polish pass 2, 16:00; v76 published = first pass)

## Built
- `gx/gx_engine.js`
  - New close-up planet program `pc` (Low: `pcl`): the mesh only supplies the pixel ray, the ground point is solved
    analytically on the unit sphere (exact, no swimming); superset of the globe shader (veins, graticule, pings), mesh UVs
    while far (no antimeridian seam), analytic UVs when close. Compiled ahead of time from the menu (`GX.warm()`, non-blocking
    with KHR_parallel_shader_compile); any failure or no fragment highp -> classic shader automatically.
  - Procedural night city, deterministic per city (table `CT` for all 54 GXC cities: size class, sea bearing/distance,
    river or strait, grid bearing, style, LED share, lakes; hash fallback for unknown coordinates): lights.jpg as macro density
    (unsharp-masked), fbm-thresholded sprawl edge, Voronoi arterial web (near-regular 1-mile grid for US-style cities),
    collector + local street grids per district, grain-gated lit streets, dotted periphery and rural dots, commercial bright
    spots, industrial floodlights, port band on the shore, airport (runways, apron), radial highways + 2 ring roads,
    meandering river with lit embankments and bridges, lakes, parks, coastline (city table near, pack.g far, fractal detail),
    luminous thin cloud wisps, light-pollution glow, faint crimson glow kept for the brand.
  - Anti-aliasing without derivatives: analytic pixel footprint (2x2 Jacobian) -> box-filtered lines, periodic grids fade to
    their exact average below ~2.5 px, per-cell random choices blend to their expectation, anisotropic filtering on the noise.
  - Footprint-based blend texture <-> procedural (texture while it is not magnified, procedural below ~2.5 km/px).
  - Camera: heading (yaw) + ground offset (off), altitude-scaled parallax, dynamic near plane. Atmosphere: thin airglow arc
    and twilight when close (globe unchanged), no flare on ground rays.
  - Director: realistic Earth fades in during the map-in, then ONE continuous dive (log-altitude zoom, pitch solved per frame so
    the city stays under the DOM pin): stages map -> pin -> dive -> entry -> land, pick->land 7.1 s. skip() completes the same
    path fast (<1.5 s), back() runs it in reverse then idles, launch() punch-out kept. Landing 40-72 km by city size.
- `gx/gx_ui.js`: HUD "ACQUIRING TARGET" -> "TARGET LOCKED" -> "DESCENDING / ALT n KM" (live) -> "ENTERING ATMOSPHERE";
  pin glued until entry then fades; dive/land sounds; ALT text = real landing altitude; city framed between text and card.
- `gx/gx.css`: landing vignette (desktop + phone).

## Tests (final build out/portal.html)
- `tools/intro_test.py` (swiftshader, real portal): normal 20/20, WebGL1 20/20, Low 19/19, Still 10/10, reduced motion
  10/10, no-WebGL 8/8, context-lost 8/8 (pick -> land -> back -> pick -> skip -> login -> launch, no page errors).
- Regression suite: run 1 9/9 rc=0 ALLDONE (out/reg), run 2 on the final build 9/9 rc=0 ALLDONE (out/reg2).
- MR suites (out/mr): t3_live rc=0, t4_mobile rc=0; t2_local flaked once under load avg ~8.8 and passed 165/0 on re-run
  (out/ctl/mine_t2_rerun.log); t5_weekly fails 5 lineup/date checks identically on the UNMODIFIED base (out/ctl/base_t5.log),
  so it is pre-existing and unrelated to the intro.
- Perf (swiftshader 960x540, best of 3 under shared load): landing old 645 / new 695 ms (Warsaw), 710 / 679 ms (Tokyo);
  idle/map use the unchanged globe shader (differences are noise).

## Screenshots
shots/acc/sheet_{warsaw,tokyo,newyork,sydney,cairo,sopaulo}.png, shots/acc/sheet_phone_low_still.png,
out/itest/*_land.png (modes).

## Tools
tools/cap.py + gx/gx_dev.html (deterministic engine frames/timing; serve gx/ on 8773; ?eng=orig needs a copy of the old engine as gx/gx_engine_orig.js), tools/sheet.py + tools/mksheet.py (portal contact sheets),
tools/intro_test.py (end-to-end).

## Polish pass 2 (15:35-16:10), build: OWQ_BASE=$SP/v76-final.html OWQ_OUT=out/portal2.html python3 patch_intro.py
- Lattice at 400-900 km fixed at the root: parks and neighbourhood brightness came from one 9.7 km noise tile, which
  repeated across the frame. They now use aperiodic hash value noise (footprint-faded); the urban-edge fbm too.
- Regional / mid scale (top-down dive, minor-axis footprint > ~0.1 km/px): soft glow + scale-adaptive bright points
  (two jittered octaves cross-faded by footprint, heavy-tailed brightness, energy-conserving), brightness matched to the
  street layer at the hand-over, softer town edges + glow halo above ~1 km/px. No flat gap between 300 and 150 km.
- Collector coverage normalised per district; per-district features fade earlier (industrial); parks softer at mid zoom.
- Tokyo-style (Asian) and Latin cities: arterials = warped near-grid with ~22% unlit links (reads as streets, no crackle);
  grid cities (NY, Sydney) and European cities (Warsaw) unchanged.
- Far-field fast path (all street patterns below the footprint -> exact averages): pays for the new layers.
- Perf vs v76 (swiftshader 960x540, best of 3, quiet machine): Tokyo 630 km x0.99, Warsaw 2500 km x0.96, Tokyo landed
  x1.04, Warsaw landed x1.00, idle globe x0.96 (same code, i.e. noise).
- intro_test.py on portal2 (stricter: close-up program must compile): all 7 modes PASS. Regression: out/reg3.
- Sheets: shots/acc2/.

## Round 3 - city model (19:25-20:10), build out/portal3.html (from v77-final.html)
- 19:40 WP1 ground: no cell polygons / honeycomb / flat fills; street-lamp points and lines (sgrid), smooth-noise density.
- 19:45 WP2: instanced 3D model renders (NYC 6000 inst., gen 14-48 ms; first call includes JIT), landmarks for 14 cities.
- 19:50 WP3: final hover 1.4-2.6 km, rise + crimson scan ring + stage `model`; HUD/ALT decimals.
- 19:55 fixes: shoreline flat glow -> points, low clouds removed near ground, inland cities no fake lakes, CPU waterAt bug.
- 20:05 searchlight beam, zero per-frame allocations in the 3D pass, intro_test.py extended (3D checks, snap(land)).
- Tests: all 7 modes PASS on the final build (out/itest3/log_*.txt). Sheets: shots/r3/sheet_*.png, finals.png, mobile_final.png.

## Round 4 - realistic cities (start 10:56), base v79-final.html, build out/portal4.html
- 11:20 keys renamed gc* (gcbh/gcbl/gcav/gcbeam). CTR real-city table (54 rows: urban radius, pop, towers>150 m, tallest m,
  mid-rise m, CBD offsets) drives R, RB, hover altitude, tower count/heights, CBD cores; camera aims at the skyline centroid.
  30 landmark cities (LM + LMX). Cylinder towers, podiums, warehouses, crowns in 6 colours, glass tints, aircraft lights,
  halo points. Ground: blue-black haze, no crimson macro glow near ground, dense urban light grain (kills graph paper),
  diagonal avenues, irregular rings, neon accents, blue bridges, no blurry close points.
