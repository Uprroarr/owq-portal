# bell (Quick View) - integration notes

Build: `OWQ_BASE=$SP/v76-final.html OWQ_OUT=$SP/agents/bell/out/portal.html python3 $SP/agents/bell/patch_bell.py`
(deterministic; refuses a base that already contains `/*QVstart*/`). Sources: `src/qv.js`, `src/qv.css` (ASCII only).

## Base anchors replaced (3, all count-asserted == 1)
1. `</style><canvas id=bgc>`  -> `<qv.css>\n</style><canvas id=bgc>`
   Insert-before: the anchor string survives unchanged, so other builders can insert at the same anchor afterwards.
2. `if(tab==='Team Chat'&&CH.ch==='__voice')vcPaint()})}catch(e){}}`  (end of `vcInit`, the room `onPeers` callback)
   -> `if(tab==='Team Chat'&&CH.ch==='__voice')vcPaint();if(typeof qvPeers==='function')qvPeers()})}catch(e){}}`
   Why: presence changes (join/leave/mute/cam/share/speaking) only repainted the full Sales Floor page; the quick view needs the same signal.
   No new room listener is registered.
3. End of file: the base must end with the main app `</script>`; the patch appends `\n<script>\n<qv.js>\n</script>\n`.
   (A separate classic script shares the app's globals; it runs right after the main script.)

## Existing functions wrapped at runtime (reassignment, original always called; no source edits)
`railRender` (tab bar + CHAT/FLOOR panes; ALERTS = original output untouched), `hudRender` (bell badge/label + tab badges after the original),
`popRender` (toast offset when the rail is wider), `chRefresh` (quick-view chat update), `chIncoming` (no alert for a message the user is
looking at in the quick view; same rule Team Chat uses for its open channel), `vcPaint` (floor update), `go` (pop-out visibility per page),
`railInit` (restore after login), `lockView` (remove window/videos on lock).
Overlap risk: anyone who REPLACES the source text of these functions is fine (wrappers bind at load); anyone who also wraps them must
wrap after this script or call through. Deck edits `ov()`, crm edits Clients, intro edits GX: none of these are touched.

## New globals (all prefixed)
JS: `QV`, `QVI`, `QVE`, `QVW`, `qv$`, `qvI`, `qvId`, `qvFirst`, `qvPhone`, `qvOverlay`, functions `qv*` (qvTab, qvTabKey, qvCh, qvSend, qvPop, qvDock,
qvFloat*, qvFloor*, qvChat*, qvList, qvKeyed, qvVids, qvStream, qvLightbox, qvLbClose, qvPin, qvMini, qvKb, qvBell, qvBadges, qvCounts, qvPeers, ...),
saved originals `_qvRR _qvHud _qvPR _qvCR _qvCI _qvVP _qvGo _qvRI _qvLV`.
DOM ids: `qvT_alerts|chat|floor`, `qvRP` (rail pane), `qvF` (pop-out), `qvFH`, `qvFT`, `qvFP`, `qvFPin`, `qvChs`, `qvCL`, `qvCI`, `qvCE`, `qvCX`, `qvEB`,
`qvMN`, `qvJump`, `qvJn`, `qvCnt`, `qvCsub`. CSS classes `qv-*`, keyframes `qvPulse`, `qvIn`. Classes added to `#rail`: `qv-tabbed`, `qv-wide`.
localStorage: `owq_qv` = {tab, ch, fl:{on,v,x,y,w,h,pin}} (per device).

## Data / subscriptions
No new db collections, docs or subscriptions; no new room listeners. Chat posts go through `chPost` (same doc shape as Team Chat),
read state is Team Chat's `D.chatSeen` (`chSeen`), reactions/votes use `chReact`/`chVote`. Floor actions call `vcJoin/vcMute/vcCam/vcScr/vcLeave`.
Display videos are separate muted `<video>` elements on the same MediaStreams, attached only while visible (`srcObject=null` when hidden);
the real tracks and the page's own `VC.vid` elements are never touched, audio still plays once (base hidden host).

## z-index
Pop-out `#qvF` z-index 90: above the rail (60 on narrow screens), below toasts (99), modals `.mb` (120) and alert popups (150).
