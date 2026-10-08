# BRIEF 4 (space builder): the Earth slowly gets sucked into the black hole

You are a NEW builder continuing the `space` work. READ FIRST, in order: `$SP/agents/COMMON.md` (round-4b header at the top: base = `$SP/v80-final.html`; machine + safety
rules), `$SP/agents/space/BRIEF.md` (round-3 task: what the black hole, galaxy background and lobby music are), `$SP/agents/space/PROGRESS.md` and `$SP/agents/space/INTEGRATION.md`
(how the black-hole transit is built: launch director, `FS_BH`, `bhProg/bhGo/bhDraw`, frame capture, HUD beats, sfx, fallbacks), then this file.
Sources: `$SP/agents/space/gx/` (== read-only `$SP/agents/gx_r1/`, the published v80 GX code). NOTE: the black-hole program key is now 'bhx' (`S.P.bhx`) because 'bh' collided
with the city builder's program; keep unique keys. Tools: `$SP/agents/space/tools/` (`s2_test.py` grant flow in all modes via env MODE, `bh_frames.py` frame strips,
`intro_test.py`, `sheet.py`...). Build (splice only; the music patch is already in v80):
`GX_DIR=$SP/agents/space/gx OWQ_BASE=$SP/v80-final.html OWQ_OUT=$SP/agents/space/out/portal4.html python3 $SP/agents/intro/splice.py`
Another builder (`city`) edits its own copy of the GX files at the same time (close-up city shader `FS_PC_BODY`, /*GXCITY*/ blocks, landing camera, `CT`/`CTR`). Stay out of those.

## Owner's words (verbatim, Monday)
"Also, lets work on that blackhole animation. You can have it be like the earth slowly starts getting sucked into the blackhole"  and later: "continue the render on opus 5.5" / "max".

## Direction
After the passcode the camera pulls back from the city to orbit so the WHOLE EARTH (the real engine globe with its city lights and atmosphere limb) is in frame; a black hole
appears/grows beside it (accretion disk crimson -> gold -> white, razor photon ring, lensed starfield). Then the Earth SLOWLY starts being pulled in: it drifts toward the
hole, its atmosphere and city lights stream off as a tidal tail that wraps into the accretion disk, the globe stretches (spaghettification) and is distorted by lensing, it
spirals in faster and vanishes into the horizon, the horizon swallows the frame, and the existing flash reveals the portal. "Slowly" matters: the visible pull gets the main
time (~3-4 s, it must feel inevitable); total passcode -> portal ~5.5-6.5 s; re-time the HUD beats (ACCESS GRANTED / LEAVING ORBIT -> SINGULARITY AHEAD -> CROSSING THE EVENT
HORIZON -> WELCOME, <NAME>); extend the sound (growing rumble, tearing whoosh as the Earth breaks up, heartbeat at the horizon). Implementation is yours, e.g. render the globe
pass into an FBO each frame and composite it in the black-hole shader with a lensing + tidal-stretch warp, plus a particle/streak tail sampled from the globe texture.
Keep: time-based timeline + hard timeout, `cb()` exactly once, `flash` emitted last, fallbacks (compile failure -> current v80 black hole or the old punch; Low = cheaper /
half-res; Still / reduced motion = short crimson iris; no WebGL = flash). Optional: click-to-skip after 1.5 s (jump to the swallow).

## Deliverables / tests
A 12-frame strip across the sequence (desktop 1366x860 + phone 390x844) in `shots/r4/`; look at it yourself and polish until the Earth is clearly recognisable while it is
pulled and the tail reads as matter, not noise. `tools/s2_test.py` and `tools/intro_test.py` pass in all modes on your build. Zero per-frame allocations, ASCII-only. Do NOT run
runreg/runmr; use `bash $SP/glrun.sh` for long software-WebGL batches. Update PROGRESS.md / INTEGRATION.md (regions changed per file). Time-box 80 minutes (check `date` at start
and every 15 min). Final report <= 300 words.
