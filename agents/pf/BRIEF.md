# BRIEF (pf builder): Business Portfolio page (stocks + crypto, live prices every minute, P&L)

Your name: `pf`. Folder `$SP/agents/pf/`. Port 8777. Prefix `pf` (CSS `pf-*`, JS `pf*`, ids `pf*`, storage `owq_pf`). READ `$SP/agents/COMMON.md` first (round-4b header: base = `$SP/v80-final.html`; machine/safety rules).
Deliverable: `patch_pf.py` (exact replacements with count asserts, env OWQ_BASE default v80-final.html, OWQ_OUT default `$SP/agents/pf/out/portal.html`), `src/pf.js`, `src/pf.css`, INTEGRATION.md, tests, shots, PROGRESS.md. Base edits tiny and local (other builders edit GX intro blocks only this round).

## Owner's words (verbatim)
"Also, add a business portolio page uder business perforance where I can add actual stocks and crypto that are updated every 1 min with the actual price and my profit and loss gets adjusted as well"

## Hard constraint: where prices can come from
The page's CSP blocks every external fetch (measured). The ONLY way to live prices is the artifact `mcp` capability: the page calls the VIEWER's claude.ai connectors. The owner is being asked to connect "Crypto.com" (authless; tools include get_tickers / get_ticker / get_mark_price / get_index_price) and "Alpha Vantage MCP Server" (stocks; tools such as GLOBAL_QUOTE). Their exact argument names and result shapes are NOT known yet. So build a PRICE ADAPTER layer:
- `pfSources` registry: each source = {id, label, kind:'crypto'|'stock', server (connector display name), tool, buildInput(symbol), parse(result)->{price, ts, chg24}}; ship two entries with placeholder tool/arg names clearly marked `// VERIFY` in one small table so the integrator can fill the real names in one place after inspecting the real schemas.
- Runtime: `const mcp = await claude.use('mcp')` (null -> no live source). Read the call contract in the skill types: `/tmp/claude-0/bundled-skills/2.1.286/10c25e27dbf22e4553f677118f5a5d0b/artifact-capabilities/0.2.66/mcp.d.ts` and `claude.d.ts` (Read tool). Use `watchTool(server, tool, input, handler, {refetchInterval: 60000})` for displayed prices (or callTool on a 60 s timer if better), batch symbols where the tool allows, handle errors per code (server_not_connected -> show "Connect Crypto.com / Alpha Vantage in claude.ai Settings > Connectors" chip; rate limits -> back off and show stale age), show freshness ("updated 23 s ago"), pause when the tab is hidden. If `describeTool` is available, use it at runtime to auto-detect the symbol argument name as a fallback.
- Fallback when no live source: manual price entry per holding (with "last set" time), so the page is useful today.
- Tests use a FAKE `claude.use('mcp')` with fake connectors (deterministic price walk), never real network.

## The page
Under Business Performance (find how that section and its sub-tabs `seg()` are built; add a "Portfolio" sub-tab or entry there, same visual language as the rest: dark cards, crimson/gold, uppercase small headings, kpi()):
- Header KPIs: total market value, total cost basis, total P&L ($ and %), today's change ($/%), cash (optional), last update + live dot.
- Holdings table: symbol + name + type badge (STOCK / CRYPTO), quantity (fractional for crypto), avg cost, current price (flash green/red on change), market value, P&L $ and %, day change, allocation %, sparkline of the prices seen this session (and persisted short history, e.g. last 24 h at 1-min resolution capped). Sort by any column. Totals row.
- Add/edit holding modal (use `openM()`): symbol, type (auto-guess: BTC/ETH/SOL... = crypto), quantity, buy price, buy date, notes; or "add lot" (multiple lots per symbol -> weighted avg cost); sell/close a position (realized P&L tracked separately); delete with `ask()` confirm.
- Allocation donut (stocks vs crypto and per symbol) and a portfolio value line (from stored snapshots, 1 point per 5 min max).
- Alerts: optional price alert per holding (above/below) -> uses existing `pushAlert` (rocket notification) once when crossed.
- Privacy: this is the owner's personal money. Store holdings under the per-user private db path `data/users/<id>/...` via `claude.use('user')` id (see COMMON.md db notes and the skill db section) with local fallback; NOT in shared team docs. Only show the Portfolio entry to the Agency Owner / Cole Leckey login (check how other owner-only views are gated); others never see it.
- Phone layout (390 px): cards instead of table, no horizontal scroll.
- Disclaimer line: prices from your connected data provider, may be delayed; not financial advice.

## Tests / deliverables
Playwright with the fake mcp + fake db: add stock + crypto lots, prices update on each fake minute tick (use a fake clock or a test hook `pfTick()`), P&L math (unit tests: weighted avg, partial sells, realized vs unrealized, % calcs, rounding), persistence across reload, owner-only gating, no-mcp fallback (manual prices), error chip when server not connected, phone layout, no page errors. Screenshots desktop 1440x900 + phone, look at them and polish. Do NOT run runreg/runmr. Time-box 70 minutes. Final report <= 300 words incl. the exact place (file/line) of the `// VERIFY` source table.
