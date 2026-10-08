# fx integration notes (launch-style notifications)

Build: `OWQ_BASE=$SP/v77-final.html OWQ_OUT=$SP/agents/fx/out/portal.html python3 patch_fx.py`

## Base anchors replaced (exactly 2, each count=1)
1. `</style><canvas id=bgc>`  -> nf.css inserted before it.
2. `const kpi=(l,v,s='')=>`   -> nf.js inserted before it (same anchor style as patch40 / MR; if MR is merged first, run fx before or after, both just prepend before this anchor).

No other base text is edited. Hooks are installed at runtime from nf.js by REASSIGNING three existing top-level functions:
- `popRender(nid)` : wrapped. Calls the original, then reconciles by alert id (kept cards are the same DOM nodes, new cards get the launch, removed cards become flying "ghosts" in `#nfg`). If the original popRender markup changes (e.g. bell patch), it is reused untouched; only `onclick="alGo(<id>)"` is parsed for the id.
- `beep(sev)` : wrapped, adds a synthesized whoosh (only if D.snd and AudioContext already running).
- `fwOverlay(col,typ)` : wrapped to a no-op (the older random full-screen firework fired by fwAlert for every alert would double the effect). Kill switch restores it. NOTE: `alertSay` voice read-out and GXU.ping (intro globe) are untouched.
Order dependency: nf.js must be evaluated before those functions are CALLED (they are hoisted function declarations, so any position in the main script works). If another patch reassigns `popRender`/`beep` AFTER nf.js, it overrides fx; keep fx last among script-level wrappers, or ensure the other wrapper calls the previous function.

## New globals (all prefixed)
`NFP` (pure particle pool), `NF` (state), `NFSVG`, `nfOff nfRM nfScale nfKind nfSetup nfSize nfLoop nfTick nfFlush nfT nfReveal nfBody nfLaunch nfDrain nfArrive nfLeave nfPlace nfLeaveTick nfSnd nfDemo`, consts `CG CR CW CS` (short names, check for clashes: grep showed none at module scope; they are `var` inside the main script scope -> rename if the integrator finds a clash).
DOM ids: `#nfg` (flyer layer, z 151), `#nfc` (particle canvas, z 152). CSS: `.nf-*`, `.pp.nf-wait/.nf-ig/.nf-k-*/.nf-c-*`, keyframes `nf*`.
Storage: reads `localStorage.owq_nf_off` ('1' = original pop-ups, nothing of fx runs). No writes.

## Behaviour notes
- Kinds: ok -> firework; crit/warn -> missile; info -> rocket; text with win/sale/issued/milestone/rank/quota/goal hit/unlocked -> firework; "mentioned you" (non-crit) -> rocket.
- Reduced motion (`RM`, `.redmo`, OS setting): no flyers, no particles, 150 ms fade.
- `nfDemo('ok'|'crit'|'warn'|'info'|'burst')` uses the real `pushAlert` (adds real alerts to the rail).
- Test hooks must not stub `pushAlert` in production.
