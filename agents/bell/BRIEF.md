# BRIEF (bell builder): Quick View in the bell rail = Team Chat channels + Sales Floor (cameras, shared screen) while using the rest of the portal

Your name: `bell`. Work folder: `$SP/agents/bell/`  (READ `$SP/agents/COMMON.md` FIRST for rules, tools, theme, machine limits, reporting).
Your port: 8771. Prefix for anything new: `qv` (CSS `qv-*`, JS globals `qv*`, ids `qv*`, localStorage key `owq_qv`).
Base file for line numbers: `$SP/v76-final.html` (read-only; COMMON.md says v75: use v76-final.html instead, it is the published file now; the base md5 is `115cbe6bccfe1249ec3f25f62bbe1812`).

## The owner's words (verbatim)
"Also, the little bell alert button at the top right, can you add a feature where is shows the chat challenls and the sales floor in like a quick view,
so people can see the chat, cameras, shared screen, etc while using other parts of the software"
Meaning: today the bell (top right, `#bell` drawn by `hudRender()`) toggles the right-hand "Live Alerts" rail (`#rail`, `toggleRail`, `railApply`, `railRender`, `RAIL` flag; open by default on screens >= 1300 px).
He wants that rail to ALSO carry a quick view of (1) the Team Chat channels with messages and a composer, and (2) the Sales Floor: who is in, their cameras, the shared screen(s), mic/cam/share controls,
so someone working in Agency Performance / Clients / Learning Network etc. can keep chatting and keep seeing the floor without leaving the page they are on.

## TIME-BOX
I can only talk to you between runs: aim to finish in about 75-90 minutes of work (check `date` at the start and every ~20 min). Priorities if time is short: (1) tabs + CHAT quick view, (2) FLOOR quick view with cameras + shared screen + join/controls,
(3) tests + regression, (4) float/pop-out window, (5) phone polish. Do not stop before 1-3 are done and tested; report honestly what is missing.

## What exists today (study these first; read lines with python slicing, they are long)
- Alert rail: `railApply/railInit/toggleRail/railRender` (v76 lines ~5151-5160), `hudRender` (5161, the bell + badge + HUD), `AL()` alerts, filters `AF`, `popRender()` (toasts).
- Team Chat: state `CH`, `chState/chLive/chCount/chBadge/chUn/chIn/chAll/CHN`, channel list `chChans()`, message rendering `chMsgs/chTxt/chStkHtml/chWinHtml/chPollHtml`, page `chat()`/`chPage()`, composer `chSend/chPost`,
  reactions `chReact`, mentions `chMent*`, scrolling `chScroll/chRefresh`, incoming handler `chIncoming`, init `chInit` (~5354-5480). `chDeck()` is the Command Deck tile.
  Sync goes through the shared layer / db (find out how; reuse it, never create a second subscription for the same data).
- Sales Floor / voice: `VC` state, `vcInner()` (the markup), `vcPaint()`, `vcMount()` (re-parents `<video>` elements `VC.vid[...]` into `[data-vs]` slots), `vcStreamOf`, `vcScreens`, `vcJoin/vcLeave/vcMute/vcCam/vcScr/vcCall/vcSig`
  (WebRTC mesh signalled through the `room` capability, topic `vsig`), devices panel `vcDevPanel/voicePanel`, `vcInit`; the 3D office `vo*` / `VO3` (Sales Floor page). Also `voDock` (~7126).
  The Sales Floor page shows tiles for each participant (camera) and shared screens. A `<video>` element can live in only one place in the DOM, so find out how the existing code handles several places
  that want the same stream (probably the last `[data-vs]` slot wins): your rail view must NOT steal the video from the Sales Floor page or leave black tiles when the user navigates. Use separate `<video>` elements
  attached to the same MediaStream (`el.srcObject = stream`, muted for display copies to avoid double audio) or an equivalent that keeps audio single.
- Tests that touch chat and voice already exist in `$SP` (grep for `vc`, `chSend`, `vsig`, `--use-fake-device-for-media-stream`); the regression suite is `bash $SP/runreg_for.sh`.

## What to build
1. Rail tabs (top of the rail): `ALERTS | CHAT | FLOOR` as a compact segmented control in the existing rail header style. ALERTS = today's behaviour untouched (filters, list, mark read, etc.).
   Remember the last tab per device (`owq_qv`). Badges: unread chat count (mentions highlighted) and number of people on the floor (+ a pulsing dot when someone is sharing a screen or is in a huddle) on the tabs,
   and the bell badge becomes alerts + unread chat (keep the severity colour logic; tooltip/aria-label says what the number is made of). If a new chat message arrives while another tab is shown, the CHAT tab pulses once.
2. CHAT tab (quick view of Team Chat): channel switcher (all channels the user can see, same order/names as Team Chat; unread dot per channel; DMs/teams if Team Chat has them), message list for the selected
   channel (compact bubbles: avatar, name, time, text, stickers/wins/polls rendered at least readably, reactions shown; links; mentions highlighted), auto-scroll with "jump to latest" pill, composer (Enter sends, Shift+Enter newline,
   emoji button, @mention picker if cheap), sending uses the SAME functions/data as Team Chat (messages appear instantly in both places, read-state shared, unread counts shared, no duplicate posts, no double subscriptions).
   "Open full chat" link (goes to Team Chat on that channel). Respect read-only / logged-out states. Smooth, no flicker on live updates, scroll position preserved, input focus preserved while messages arrive.
3. FLOOR tab (quick view of the Sales Floor): roster of who is on the floor (names, avatar, talking indicator, muted, cam on, sharing), a grid of live camera tiles (auto-sizing 1-6 tiles, 16:9, name overlay),
   the shared screen(s) as a large tile on top (click to enlarge to a lightbox), controls row: Join/Leave huddle, Mic, Camera, Share screen, Deafen/speaker if present, "Open Sales Floor" (full page / 3D office).
   Not joined yet: show the roster and a clear "Join the floor" button (joining must work from the rail with the same code path as the page: `vcJoin`). Joined elsewhere: show the live tiles.
   Audio plays once only (never two copies). Cameras/screens keep working when switching rail tabs, collapsing the rail, navigating to any page, or opening/closing the full Sales Floor page.
   Permission/device errors surface exactly as on the Sales Floor page (reuse `vcErr`).
4. FLOAT / PIN mode: a button on CHAT and FLOOR ("pop out") turns the current quick view into a small floating, draggable, resizable (snap corners) window that stays visible over every page even when the rail is closed
   (think picture-in-picture: this is what lets people watch the shared screen while working in Clients). Remember position/size/mode in `owq_qv`. Keep it above page content but below modals, clamp to the viewport,
   keyboard accessible (Esc closes the window not the call), close button; at most one floating window (it can show the Floor with a chat strip or tabs). Hidden on the full Sales Floor page (where it would duplicate) unless the user pinned it.
5. Phone (<= 560 px): the rail is a full-height sheet today; the tabs must fit, tiles stack, composer stays above the keyboard (use `visualViewport`/safe-area), tap targets >= 44 px; floating window becomes a bottom mini-player
   (avatar/name strip with expand) instead of a free-floating window.
6. Keyboard + polish: `Esc` closes the rail/float, shortcuts are optional but must not clash with existing ones (Ctrl-K palette, Enter handling in inputs). Entrance animation light and consistent with the HUD theme; respect reduced motion.
   Keep the rail's open/closed behaviour on wide screens (default open >= 1300 px) but make sure the page content layout still works at 1300-1500 px with the rail wider if the Floor tab needs more room (rail width may grow
   to ~360-420 px only while the FLOOR tab shows tiles; animate; do not break the main layout).

## Rules and constraints
- Do not modify the semantics of Team Chat, voice or the alert logic; add a thin layer on top. If you need a hook inside `railRender`, `hudRender`, `chIncoming`, `vcPaint`, `vcInner`, keep each base edit tiny
  (one `rep()` each, count-asserted) and list it in INTEGRATION.md. Other builders touch other areas: CRM edits the Clients section only; deck edits `ov()`; intro edits the GX login blocks.
- No new db collections, no new subscriptions (the chat and the floor already have them; hook their update paths). If you absolutely need a new one, explain why in the report.
- No external assets. Keep ASCII in injected code. Idempotent patch (`patch_bell.py`, env `OWQ_BASE` default `$SP/v76-final.html`, `OWQ_OUT` default `$SP/agents/bell/out/portal.html`).
- Performance: video tiles are the expensive part. Only attach display `<video>` elements for tiles that are currently visible (FLOOR tab active or floating window open); detach when hidden (`srcObject=null`)
  but never stop the real tracks. No timers running while hidden except the existing ones.
- Safety: never print access codes; fake media only (`--use-fake-device-for-media-stream --use-fake-ui-for-media-stream`); never touch the live db or claude.ai tools.

## Tests you must write and run
- Unit-ish/Playwright: tab switching and persistence; unread/badge arithmetic (alerts + chat, mentions); chat send from the rail shows up in Team Chat and vice versa; channel switch; scroll/focus preservation on incoming messages;
  composer behaviour (Enter/Shift+Enter, empty message ignored, max length); read-only/logged-out states; no duplicate listeners after many open/close cycles (count event listeners / subscriptions); rail width animation.
- Floor: two to four browser contexts joined to ONE fake room hub (see how existing voice tests or `$SP/mr/fakedb.py` style fakes work; you may write a small fake `room` capability that relays `vsig` messages, and a fake `db`):
  A joins from the rail, B joins from the Sales Floor page, C only watches the rail. Assert tiles appear, audio element count == 1 per remote peer, a screen share shows in the rail as the large tile,
  navigating pages keeps video playing (`readyState`, `videoWidth>0`), leaving removes tiles, device error path shows the message. Float window: drag, resize, persistence after reload, hidden on Sales Floor page, phone mini-player.
- Screenshots at 1440x900 and 390x844 for: rail closed/open, ALERTS/CHAT/FLOOR tabs (with realistic fake chat history and 4 fake camera feeds from the Chromium fake device), shared screen tile, float window over the Clients page, phone sheet. Look at them yourself and polish.
- Full regression: `bash $SP/runreg_for.sh out/portal.html out/reg` (all rc=0) and `bash $SP/runmr_for.sh out/portal.html out/mr` (all rc=0) once the feature is done (see machine limits; wait while another builder's suite runs).

## Deliverables (all in `$SP/agents/bell/`)
`src/*` (JS, CSS), `patch_bell.py`, `out/portal.html`, `INTEGRATION.md` (every base anchor replaced + new global names), `PROGRESS.md`, tests + logs, `shots/*`, final short report (<= 400 words: what it does, build command, test results, screenshots, limits, decisions for the owner).
Do NOT publish and do not message the owner: I do that.
