# space builder: integration notes (base v77-final, GX baseline gx_r0)
Build: `bash $SP/agents/space/build.sh`  (= splice.py with GX_DIR=space/gx, then `patch_space.py`, which only touches the base lobby music block).
All new code sits in `/*GXSstart*/../*GXSend*/` blocks or on lines ending `/*GXS*/`. Globals: JS `GXS*`, `gxs*`, `BH` (engine-private), `LB` extended; ids `gxshint`; css `.gxsEq`, `.gxsmus`; storage `owq_gxsmus` ('0' = lobby music off).

## gx/gx_engine.js (3-way merge vs gx_r0)
- NEW block before `var FS_BG`: right after `var VS_FS=...` : `GXS_SP` (GLSL galaxies/nebula/Milky Way/shooting star/comet) + `bgGxs()`.   [S1]
- FS_BG: 2 one-line additions: `GXS_SP+/*GXS*/` before the `void main` line, and ` col+=gxsSpace(...)` line after the `col+=st*(1.-.55*uWarp)` line. Nothing else in the shader.   [S1]
- render(): `bgGxs(p);/*GXS*/` before the space `gl.drawArrays` (step "1 space"); `if(BH.on&&bhDraw())return;/*GXS*/` after `buildCam();`; `if(DIR.cap)bhCapture();/*GXS*/` before the final `gl.disable(gl.BLEND);S.frames++}`.   [S1/S2]
- NEW block before `/* ---------- public ---------- */`: `BH`, `FS_BH`, `bhProg`, `bhCapture`, `bhDraw`, `bhGo`.   [S2]
- dir.launch: first statement `if(bhGo())return;/*GXS*/` (the original body stays as the fallback path).   [S2]
- Not touched: pc / FS_PC_BODY / drawPC / landGeo / landPS / diveApply / CT / cityInfo.
- New stage names emitted by the director: `bh2`, `bh3` (between `punch` and `flash`); `flash` is still the last one. `GX.S.BH` exposes {on,ok,fail,t0} for tests.
## gx/gx_ui.js
- renderStat(): appends `gxsMusBtn()` (speaker toggle) to the status row; new function `gxsMusBtn` right after it.   [S3]
- return {...}: added `stat:renderStat` (first key).   [S3]
- granted(): `const reduced=...` first line; the WebGL branch (stage handler with hud beats `ACCESS GRANTED / SINGULARITY AHEAD / CROSSING THE EVENT HORIZON / WELCOME, <NAME>`, `sfx('bh')`, `sfx('thump')`, hard timeout 3200 -> 7500 ms); the else branch calls `gxsIris()` (crimson iris-in, 460 ms, for Still / reduced motion / no WebGL). New functions `gxsFirst`, `gxsIris` right after granted().   [S2]
- sfx(): one added branch `else if(k==='bh'||k==='thump')gxsBH(c,t,k)`; new function `gxsBH` before `/* ---------- state + dom`. Silent unless AudioContext is running; still obeys owq_gxs and document.hidden through sxc().   [S2]
## gx/gx.css
- New block `/*GXSstart css*/ ... /*GXSend css*/` just before `/*GXcssend*/` (music toggle + #gxshint).   [S3]
## Base (non-GX) via patch_space.py   [S3]
- Replaces the base lobby block, from `const LB={au:null,st:0};` through `addEventListener('load',()=>{if(!ONLINE)lobbyStart()});` (7 lines, v77-final 5300-5306), with src/lobby.js. Same function names (`lobbyStart/lobbyGesture/lobbyStop`), new: `lobbyUnmute`, `lobbyToggle`, `gxsHint`, `gxsFade`. Anchor strings asserted count==1. Idempotent.
- If `intro` also edits the GX UI toggle area (renderStat) the merge is a one-line conflict: keep both buttons.
