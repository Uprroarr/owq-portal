# bell builder - PROGRESS

Start: Sun Oct 4 16:07 EDT 2026. Last update: 17:29. DONE.

## Done
- `src/qv.js`, `src/qv.css`, `patch_bell.py` (3 count-asserted base edits, module appended as its own <script>, deterministic, ASCII).
- Rail tabs ALERTS | CHAT | FLOOR (owq_qv per device), tab badges (chat unread with gold @ for mentions; floor count + green huddle /
  red screen-share dot), CHAT tab pulses once on a new message, bell = alerts + unread chat (each item once), label/tooltip explains it.
- CHAT: channels with unread counts, compact bubbles (stickers, win cards, polls, attachments, reactions, links, mentions), keyed DOM diff
  (no flicker, scroll anchor kept, focus/draft/caret kept), jump-to-latest pill, composer (Enter / Shift+Enter / emoji / @ picker / 500 max),
  posts via chPost, read state = D.chatSeen (shared with Team Chat), Open full chat, view-only state.
- FLOOR: shared screen as the large tile (+ lightbox), 1-6 camera tiles, roster (talking ring, muted, cam, screen, hand), Join/Mute/Camera/
  Share/Leave via vcJoin/vcMute/vcCam/vcScr/vcLeave, VC.err shown verbatim, rail widens to min(400px,28vw) only while tiles show.
- Pop-out window (drag, resize, corner snap, arrow keys, Esc, pin, persisted, hidden on the Sales Floor page unless pinned) and the phone
  bottom mini-player (live thumbnail, mic, expand, close). Phone sheet: 44px targets, keyboard-aware composer, toasts hidden while open.
- Tests: unit 12/12, chat 44/44, floor (3 contexts, real WebRTC, fake room hub) 41/41, shots+phone 12/12.
- Regression (build a83950b): runreg 9/9 rc=0, runmr 4/4 rc=0. Final build fafe036 (hint text change only): runreg 9/9 rc=0, runmr 4/4 rc=0.

## Decisions
- Bell counts distinct unread items: unread alerts + unread chat messages not already represented by an unread chat alert (cm-<id>).
- While the CHAT quick view shows a channel, a new message there raises no alert (Team Chat's own rule for its open channel).
- Pop-out moves the view (renders in one place; the rail tab shows "in the pop-out window" + Bring back).
- Not joined = roster only (media flows only between joined peers in the existing mesh); a clear Join the floor button.
