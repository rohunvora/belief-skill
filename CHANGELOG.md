# Changelog

## v4.0 — Current

### 2026-02-18 (v4.0)

🆕 **Two-layer data model** — every entry preserves the author's signal (source_quote, author_thesis, conviction, conditions) separately from the skill's routing (ticker, derivation, reasoning). Never conflated.

🆕 **Evidence/inference markers** — derivation chain steps linked to source segments (speaker + timestamp) show as "evidence"; skill's own conclusions show as "inference". The boundary between what someone said and what the skill concluded is always visible.

🔧 **Attribution tiers are structural** — direct/derived/inspired now determines scoring, card design, and permalink layout. Not just a label.

🔧 **source_date pricing** — entry_price uses the date the belief was expressed, not when it was processed. Historical price adapters provide this.

---

## v3.2

### 2026-02-17 (v3.2)

🔧 **Attribution is a lookup, not a judgment** — tier (direct/derived/inspired) is now mechanically determined by scanning the source quote: ticker present → direct, market claim → derived, framework → inspired. First match wins.

🔧 **Derivation chain runs before research** — the reasoning trail ("source said X → implies Y → searching for Z") is now a mandatory step before searching, not a post-hoc summary. Prevents misattribution by locking the causal chain before instruments are found.

---

## v3.1

### 2026-02-17 (v3.1)

🆕 **Hyperliquid stocks & commodities** — PLTR, GOLD, and 100+ non-crypto perps now route automatically via xyz dex

🔧 **Stricter routing** — thesis connection floor raised to 60% (fewer garbage proxy trades)

🔧 **Kalshi PnL fixed** — NO positions were showing inverted returns

🛡️ **Mode gates** — numbers must trace to a data source, no more hallucinated stats

📋 **Golden tests** — PLTR military-AI thesis + Nettspend cultural momentum sessions saved as regression tests

---

## v3.0

### 2026-02-16 (v3.0)
- **Rubric replaces formula.** Replaced `thesis_beta × convexity / (1 + time_cost)` with a 4-dimension categorical rubric: thesis alignment, payoff shape, edge, timing forgiveness. Each dimension uses anchored levels (e.g., Direct → Pure-play → Exposed → Partial → Tangential). Head-to-head comparison instead of numerical scoring. Based on LLM-as-Judge research (MT-Bench, Prometheus 2) showing categorical labels are more reliable than calibrated numbers.
- **Edge dimension (new).** "Has the market priced this thesis into THIS specific instrument?" — assessed per-instrument, not per-thesis. 4 levels: Undiscovered → Emerging → Consensus → Crowded. Replaces binary "priced in" flag.
- **Research agent model.** Replaced rigid 6-phase pipeline with autonomous research agent. Claude decides what to search, how deep to go, when to call tools. Only rigid requirements: rubric, hard gates, output format.
- **SKILL.md compressed 442 → 301 lines.** Output boilerplate moved to `references/output-format.md`, tools CLI moved to `references/tools.md`, Time Horizon merged into Research, Clarity Gate merged into Input Validation.
- **Ozempic→DASH example purged.** Replaced with Ozempic→HIMS (GLP-1 distribution bottleneck) across SKILL.md, tests, README, and fixtures. Fixed "contrarian = smart" bias in deeper claim table.
- **Dev docs moved to `docs/`.** Architecture, roadmap, output drafts, excalidraw diagrams. Root cleaned to 17 items.

### 2026-02-16 (v2.1)
- **Two-part output: The Take + The Card.** Take streams as reply (conviction, reasoning, probability gap). Card sent via message tool with buttons (spec sheet, fixed format). Take = experience. Card = artifact.
- **Prose style: bold claims, not templates.** Each paragraph = one bold verifiable claim + evidence. Scannable via bolds, readable as prose. No arrows, no ✓/✗, no section headers.
- **Probability gap framing.** Every trade states: what the market prices, what probability breakeven requires, "you need to believe X." User is the decision-maker.
- **Configurable bet size.** Default $100K. User can override per-session ("I trade with $10K"). Sizes flow through scenarios and button quantities.
- **Card ≤10 lines.** Spec sheet only — ticker, position, scenarios, kills, alt. No prose (the Take already told the story).
- **Cultural decoding in Phase 1** — when the subject is a person, brand, or community, decode the cultural movement it represents. "Long Clavicular" → looksmaxxing wave → HIMS. The thesis is about the wave, not the surfer. Uninvestable subjects trigger cultural signal extraction → publicly-traded infrastructure for that movement.
- **Screenshot-optimized output** — ≤18 line rule. Zero preamble (first char is 🎯). Title ≤5 words. 4 scenario rows max. Designed for the Telegram screenshot moment.
- **Telegram inline buttons** — every trade card sent via `message` tool with buttons. Green `url` button opens platform with quantity in text (proof of construction). Blue `callback` button tracks the belief.
- **Callback handler spec** — `blr:track`, `blr:real`, `blr:portfolio`, `blr:close` prefixes. Full flow: card → track → confirm → portfolio.
- **JSONL fact store** — replaced SQLite with append-only `data/beliefs.jsonl`. One line per fact (route, conviction update, close, note). Store atoms, compute molecules.
- **Instrument-aware P&L** — options compute intrinsic value from underlying price. Kalshi tracks contract price. Perps apply leverage. Stocks use after-hours/pre-market prices when markets closed.
- **Repo flattened** — v1 deleted, v2 moved to root. MIT license. Clean `git clone && bun install`.
- **README with real example** — @marginsmall PQC tweet screenshot → trade card output → explanation of deeper claim routing.

### 2026-02-15
- **Position structuring** (Step 1.5) — direction theses decompose into independently-resolving bets. All-or-nothing payoff treated as hidden cost.
- **9 SKILL.md blindspot fixes** — deeper claim before shape classification, prediction markets unconditional in Phase 2, metric denominator fix (`/(1+time cost)`), thesis beta <20% disqualifier, compound thesis decomposition moved to Phase 1.
- **Reasoning transparency** — rejections woven into WHY section as contrast. No new output sections, just better writing.
- **Polymarket sports** — NBA, NFL, MLB, NHL, NCAAB via slug construction. Zero dependencies.

### 2026-02-14
- **Paper trading system** — `track.ts` with portfolio view, trade cards, leaderboard, options P&L
- **Action buttons** — 📝 Paper Trade / ✅ I Took This / 🔗 Open in Platform on every card
- **Output format v3** — compressed to ~750 chars, one screen on mobile, Telegram-native formatting
- **Angel/private market adapter** — searches Republic, Wefunder, Crunchbase. Step 2.5 triggers when public winner has <50% thesis beta.
- **Thesis beta floor rule** — high thesis-beta + defined loss always beats low thesis-beta + zero carry

### 2026-02-13
- **Shape classification** — binary, mispriced company, sector/theme, relative value, vulnerability
- **Ranking metric** — `thesis beta × convexity / time cost`
- **Cross-check architecture** — best-in-class within shape, then cross-check across classes on normalized terms
- **Polymarket adapter** — zero-dep, keyword search + slug lookup
- **Kalshi, Robinhood, Hyperliquid, Bankr adapters**

### 2026-02-12
- **v2 rewrite** — 6-phase architecture replacing v1's generate-and-filter approach
- **Minto Pyramid output** — answer first, supporting logic below

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for the full build plan. Key next items:

- **Execution layer** — Kalshi/Polymarket/Hyperliquid API integration for one-tap trades
- **Calibration engine** — edge profile from resolved beliefs (what thesis shapes are you good at?)
- **Trade cards** — shareable "I Called It" cards with thesis + P&L for viral distribution
- **Visual frontend** — localhost dashboard for portfolio + thesis history

---

## Changelog Format Guide

When writing changelog entries for new versions, use this format:

```
## vX.Y

### YYYY-MM-DD (vX.Y)

🆕 **Feature name** — one sentence, what it does and why you care
🔧 **Fix name** — what was broken, now it works
🛡️ **Safety/quality** — guardrails, tests, reliability
📋 **Housekeeping** — docs, tests, cleanup (only if interesting)
```

Rules:
- **4 lines max** per release (combine small fixes)
- **No file paths, no commit hashes, no "synced from upstream"**
- **Lead with the user impact**, not the implementation
- Each line: emoji + bold name + em dash + one sentence
