# Changelog

## v2 — Current

### 2026-02-16
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

See [V2-ROADMAP.md](V2-ROADMAP.md) for the full build plan. Key next items:

- **Execution layer** — Kalshi/Polymarket/Hyperliquid API integration for one-tap trades
- **Calibration engine** — edge profile from resolved beliefs (what thesis shapes are you good at?)
- **Trade cards** — shareable "I Called It" cards with thesis + P&L for viral distribution
- **Visual frontend** — localhost dashboard for portfolio + thesis history
