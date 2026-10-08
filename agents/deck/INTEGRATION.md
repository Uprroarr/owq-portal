# deck: Command Deck restyle - integration notes

Build (base = published v75):
```
cd $SP/agents/deck
DK_LOOK=all OWQ_BASE=$SP/v75-final.html OWQ_OUT=out/portal_all.html python3 patch_deck.py   # three looks + A/B/C switcher
DK_LOOK=b   OWQ_BASE=<base> OWQ_OUT=<out> python3 patch_deck.py                              # ship ONE look (no switcher, no other look's code)
```
Integration order is bell, intro, crm, deck: run this patch last, with OWQ_BASE = the output of the previous patches.

## Anchors replaced in the base (each asserted to match exactly once)
| # | anchor (exact text) | what happens | anchor kept? |
|---|---|---|---|
| 1 | `</style><canvas id=bgc>` | deck CSS (`src/deck_common.css` + `src/deck_<look>.css`) is inserted **before** it | yes (unchanged, other patches may use it too) |
| 2 | `function ov(){const s=S(),m=sum(` | deck JS (`src/deck_common.js` + `src/deck_<look>.js`) is inserted before it, and the head becomes `function ov(){try{const _dk=dkOv();if(_dk)return _dk}catch(e){}const s=S(),m=sum(` | the classic `ov()` body stays intact as the fallback |

Nothing else in the base is edited. Overlap risk: only if another builder edits the first line of `ov()` or removes `<canvas id=bgc>` right after `</style>`.

## Global names added (all prefixed dk)
- JS (common): `DKL`, `dkS`, `DKIN`, `dkLook`, `dkTier`, `dkFmt`, `dkN`, `dkData`, `dkHead`, `dkReplay`, `dkMod`, `dkMods`, `dkGoalTxt`, `dkBrief`,
  `dkBriefCard`, `dkQueue`, `dkAgents`, `dkDiag`, `dkAlerts`, `dkSpk`, `dkOv`, `dkAfter`, `dkTick`, `dkBurst`; switcher (all build only): `dkSwitch`, `dkSet`
  (a single-look build defines `dkSwitch` as an empty stub);
  look A: `dkRing`, `dkReactorA`, `dkLook_a`; look B: `dkFeedB`, `dkNeedB`, `dkRadarB`, `dkHeatB`, `dkLook_b`; look C: `dkEmbers`, `dkRingC`, `dkPodC`, `dkLook_c`.
  (The base already has `dkey`, `dk`, `dkg`; none of those are touched or shadowed.)
- Listeners/timers: one passive `pointermove` listener (pointer glow / parallax, rAF-throttled, only when the pointer is over `.dk-glow`);
  look C only: one 1 s `setInterval` that updates the hero clock text when the deck is on screen.
- CSS: every rule is scoped under `.dk-root` / `.dk-a` / `.dk-b` / `.dk-c` (classes `dk-*`); keyframes `dkUp dkFade dkPop dkDraw dkArc dkRing dkGrow dkSpin dkPing dkBlink
  dkFlash dkSpark dkScanA dkInL dkInR dkPowA dkWaveA dkFeed dkBoot dkBeam1 dkBeam2 dkEm dkCine dkRise dkDrop dkCrown`. `container-name: dk` on the deck root.
- Element ids: `dkr` (deck root); SVG defs `dkag`, `dkcore`, `dksg_sales`, `dksg_fin`, `dkrsw`; the classic SVG ids `gl` and `rg` are still defined once per look.
- Storage: localStorage `owq_dk` (chosen look, per device; only in the `all` build). URL `?dk=a|b|c` also selects a look (all build).
- No new db docs, no network, no new persisted data.

## What the deck keeps (hooks other code and tests rely on)
Embedded unchanged: `cqHtml()` (#cqp, owner), `mrBanner()` (#mrbn), `pulseHtml()` (#pls and its data-k/data-t/data-c live hooks), `chBrief()` in `#chbf`,
`latestAl()` in `#dal`, `mrDeck()` (#mrdkw), `chDeck()` (.cd countdown), `gpBars()`, `radar()`, `brief()`. Classes `.deck .dl .dr .dc .mod .chips .bl .qr .gp`
still present; every classic onclick target and Enter-key activation is kept (proved by `inventory.py`). Global ticker `.tk` and the footer note are untouched.

## Behaviour contract
- Entrance + count-ups once per page load (and when the look is switched); a live re-render (`go()`, `refreshQuiet()`, db snapshot) never replays them,
  keeps the scroll position and numbers, and keeps the idle-animation phase (negative `animation-delay` from a page clock, `--dkp`).
- A number that really changes tweens from the last shown value; goal crossing 25/50/75/100% or a newly issued policy fires one small ring/spark burst.
- Tiers: reduced motion (`RM` / Settings > Motion) or graphics `still` -> nothing moves; graphics `low` -> no idle loops, no particles; otherwise full.
- Idle motion is transform/opacity only (composited layers); particles in look C are 18 CSS layers, no canvas, no per-frame script.
- If the new renderer throws, `ov()` silently renders the classic deck.
