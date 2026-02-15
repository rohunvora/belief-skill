# Belief Router — Full Build Plan

> **Status:** Gate 1 core done (stripped, not optimized). This plan covers everything remaining.

## Architecture Recap

The skill follows the OpenClaw toolkit pattern:
- **SKILL.md** = the product. Teaches Claude HOW to decompose theses, reason about causal chains, calibrate confidence, pick instruments, and format output.
- **Scripts** = Claude's tools. Fetch data, do math, validate, cache. Claude calls them via CLI.
- **Claude** = the runtime. Parses thesis, decomposes sub-themes, judges quality, ranks instruments, writes narrative. No external LLM calls.

```
User speaks thesis → Claude reads SKILL.md → Claude decomposes →
  → discover.ts (find tickers) → research.ts (enrich data) → size.ts (portfolio math) →
Claude ranks, narrates, formats → Output
```

---

## What Exists Today (5 scripts, ~1030 LOC)

| Script | What it does | Status |
|--------|-------------|--------|
| `discover.ts` | Brave web search → extract tickers → validate via Yahoo | ✅ Working |
| `research.ts` | Yahoo Finance + CoinGecko + DexScreener → enriched data | ✅ Working |
| `size.ts` | Kelly sizing + overlap detection + concentration limits | ✅ Working |
| `crypto-prices.ts` | CoinGecko batch + DexScreener fallback | ✅ Working |
| `types.ts` | TypeScript interfaces | ✅ Complete |

**Deleted (intentionally):** router.ts (was test CLI), instruments.ts (merged into discover), rank.ts (ranking is Claude's job now), expand.ts (semantic expansion — Claude does this natively), decompose.ts (was calling GPT-4o-mini).

---

## Phase 1: Quality Foundation (immediate)

The stripped-down toolkit works but isn't optimized for the actual use case. Fix these before building anything new.

### 1.1 SKILL.md rewrite — the real product

Current SKILL.md is thin. It needs to be the comprehensive playbook that makes Claude a great analyst. Expand:

- **Causal chain templates**: First-order → second-order → picks-and-shovels → who-gets-hurt → diversified play. With examples for each.
- **Direction detection**: Explicit rules for long/short/pair signals in natural language. Not just keywords — teach reasoning about implications.
- **Confidence calibration**: Map language certainty → position sizing behavior. "Will definitely" vs "might" vs "I feel like" → high/medium/low → concentrated/balanced/exploratory.
- **Multi-asset coverage rules**: Every thesis MUST produce instruments from ≥2 asset classes. Stocks, ETFs, crypto, secondaries, short candidates. Never stocks-only.
- **Invalidation quality bar**: Examples of bad vs good invalidation. "If thesis wrong" → ❌. "If GENIUS Act fails Senate vote Q2 2026" → ✅.
- **Portfolio reasoning**: How to read sample-state.json. When to warn about concentration. When to say "you ARE this trade."
- **Output format spec**: Telegram-compatible monospace. Exact template with `<pre>` blocks. Under 4000 chars.
- **When to ask vs proceed**: Vague thesis → ask ONE clarifying question OR proceed conservatively with ETF-heavy picks.

### 1.2 Relevance scoring for discover.ts

Web search returns noise (AAPL for "lithium recycling"). Fix:

- **Snippet-context scoring**: When ticker X appears in search result, check if the surrounding text actually connects it to the thesis concept. "AAPL mentioned in article about recycling" ≠ "AAPL is a lithium recycler."
- **Frequency weighting**: Ticker in 3/3 search results >> ticker in 1/3.
- **Source quality**: Financial sites (Yahoo, Seeking Alpha, Barron's) > random blogs.
- Add `relevance_score` field to CandidateInstrument.
- Claude can also filter — SKILL.md should tell it to drop instruments that don't have clear thesis connection.

### 1.3 Test harness (tool-level)

Current `run-tests.ts` already tests tools directly. Expand:

```
tests/
├── run-tests.ts          # Tool tests (research.ts, size.ts, discover.ts)
├── fixtures/             # Static test data (avoid API calls in CI)
│   ├── portfolio.json    # Copy of sample-state.json
│   └── enriched-*.json   # Cached enrichment results for deterministic tests
└── README.md
```

New test cases:
- **discover.ts**: Given "defense AI thesis", does it find PLTR/BAH/NVDA? Given "peptides", does it find relevant pharma?
- **research.ts**: Does it handle mixed asset classes in one call? Does cache work? Does it survive API failures?
- **size.ts**: Budget constraints, short sizing, vague thesis detection, already-exposed detection, secondary handling.

---

## Phase 2: History & Tracking (scripts only, no frontend yet)

### 2.1 `scripts/history.ts` — thesis log

```bash
# Save a thesis result
bun run history.ts save --thesis "defense AI spending" --output result.json

# List past theses
bun run history.ts list [--limit 10]

# Replay with current prices
bun run history.ts replay --id <thesis-id>
```

Storage: `data/history/<timestamp>-<slug>.json` — each file contains:
```typescript
{
  id: string;
  timestamp: string;
  thesis_raw: string;
  thesis_parsed: { core_claim, confidence, horizon, sub_themes, invalidation };
  recommendations: SizedRecommendation[];
  prices_at_time: Record<string, number>;
  portfolio_snapshot: { total, liquid, budget_used };
}
```

Claude calls `history.ts save` after producing output. Calls `history.ts list` when user asks "what theses have I run?" Calls `history.ts replay` to compare then-vs-now.

### 2.2 `scripts/track.ts` — P&L tracker

```bash
# Book a trade (user confirmed execution)
bun run track.ts book --thesis-id <id> --ticker PLTR --price 134 --amount 7000 --direction long

# Check P&L across all open positions
bun run track.ts pnl [--thesis-id <id>]

# Mark a position closed
bun run track.ts close --ticker PLTR --price 152 --reason "thesis confirmed"
```

Storage: `data/trades/<thesis-id>.json` — array of TradeLifecycle objects.

P&L calculation: Fetches current prices via research.ts, compares to entry. Groups by thesis for thesis-level P&L.

---

## Phase 3: Frontend (Next.js dashboard)

### 3.1 Scaffold

```
frontend/
├── package.json          # next, tailwindcss, lightweight-charts
├── tsconfig.json
├── tailwind.config.ts
├── app/
│   ├── layout.tsx        # Dark theme, minimal chrome
│   ├── page.tsx          # / — all active theses as cards
│   ├── thesis/[id]/
│   │   └── page.tsx      # Deep view of one thesis
│   ├── portfolio/
│   │   └── page.tsx      # Aggregate exposure view
│   └── history/
│       └── page.tsx      # Past theses + outcomes
├── components/
│   ├── TradeCard.tsx      # The viral unit — single thesis + picks
│   ├── InstrumentRow.tsx  # One instrument line in a card
│   ├── PortfolioBar.tsx   # Asset class / theme breakdown
│   ├── PnLBadge.tsx       # +12.3% green or -5.1% red
│   └── ThesisList.tsx     # Grid of trade cards
└── lib/
    ├── data.ts            # Reads from ../data/ directory (JSON files)
    └── format.ts          # Number formatting, time ago, etc.
```

Design: Dark theme, monospace accents, minimal. Inspired by markdown.new — developer-focused, no dashboardy widgets. The trade card IS the design.

### 3.2 Trade Card component (the viral unit)

```
┌─────────────────────────────────────────────┐
│ 🧠 BELIEF ROUTER           Feb 15, 2026    │
│                                             │
│ "China's AI progress will trigger massive   │
│  US military AI spending"                   │
│                                             │
│ PLTR   Long   $7,000   ████████░░  87/100  │
│ BAH    Long   $4,000   ███████░░░  78/100  │
│ CRWD   Long   $3,000   ██████░░░░  72/100  │
│ ITA    Long   $3,000   █████░░░░░  65/100  │
│ CEG    Long   $3,000   █████░░░░░  61/100  │
│                                             │
│ Budget: $20K │ Horizon: 6-18mo │ Conf: High│
│                                             │
│ P&L: +$2,340 (+11.7%)  ▲                  │
│ Best: PLTR +18.2% │ Worst: CEG -2.1%      │
└─────────────────────────────────────────────┘
```

Requirements:
- React component that renders from thesis JSON
- Live P&L when trades are booked (track.ts data)
- Static snapshot when no trades booked (recommendation only)
- Renders to both browser DOM and Satori PNG

### 3.3 Satori PNG export

```bash
bun run scripts/export-card.ts --thesis-id <id> --output card.png
```

Uses Satori (Vercel's OG image lib) + @resvg/resvg-js to render TradeCard → SVG → PNG.
Dimensions: 1200×675 (Twitter), 1080×1350 (Instagram).
This is the shareable artifact.

### 3.4 Dashboard pages

**`/` (Home)**: Grid of all thesis cards. Most recent first. Live P&L badges on tracked ones.

**`/thesis/[id]`**: Full thesis detail — expanded rationale per instrument, invalidation conditions, portfolio context, P&L chart if tracked.

**`/portfolio`**: Aggregate view across ALL theses — total exposure by asset class, sector overlap Venn, concentration warnings. Uses lightweight-charts for exposure breakdown.

**`/history`**: Past theses with outcomes. "Your defense AI thesis from Feb 14 is up 12%." Sortable by date, P&L, confidence.

---

## Phase 4: Execution Layer

### 4.1 `scripts/execute.ts` — execution guide generator

```bash
bun run execute.ts --ticker PLTR --amount 7000 --direction long --brokerage robinhood
```

Outputs step-by-step text guide matching the brokerage UI:
```
📱 ROBINHOOD — Buy PLTR

1. Open Robinhood → tap 🔍 Search
2. Type "PLTR" → tap "Palantir Technologies"
3. Tap "Buy" → select "Limit Order"
4. Price: $134.00 (current: $133.85)
5. Shares: ~52 ($7,000 ÷ $134)
6. Review → "Swipe up to submit"
7. Screenshot confirmation → send back here
```

Brokerage templates stored in `references/brokerages/`:
```
references/brokerages/
├── robinhood.json
├── schwab.json
├── fidelity.json
├── coinbase.json
└── interactive-brokers.json
```

Each template: step-by-step for buy/sell, order types supported, quirks.

### 4.2 Screenshot confirmation flow

When user sends a screenshot after executing:
1. Claude reads the screenshot (native vision — no OCR library needed)
2. Extracts: ticker, shares, price, total, order type
3. Calls `track.ts book` with confirmed values
4. Updates trade card with live P&L

SKILL.md section teaches Claude how to read brokerage screenshots.

### 4.3 User profile / onboarding

`data/user-profile.json`:
```json
{
  "brokerages": {
    "robinhood": { "asset_classes": ["stock", "etf", "option"] },
    "coinbase": { "asset_classes": ["crypto"] }
  },
  "wallets": {
    "solana": { "address": "498g1r..." },
    "evm": { "address": "0x696d...", "chains": ["base", "ethereum"] }
  },
  "preferences": {
    "default_budget": 20000,
    "risk_tolerance": "aggressive",
    "preferred_order_type": "limit"
  }
}
```

SKILL.md onboarding section: first time user triggers skill, Claude asks 3 questions (brokerages, wallets, risk tolerance), saves to user-profile.json, uses it for all future routing.

---

## Phase 5: Social Layer

### 5.1 Card sharing

- Export-card.ts already produces PNGs
- Add watermark/URL to card: `belief-router.xyz/@frank` (or just skill attribution)
- Auto-generate card after `track.ts book` confirms a trade
- Claude proactively offers: "Want me to generate a shareable card for this thesis?"

### 5.2 P&L updates

- Cron or heartbeat check: periodically re-price tracked positions
- Update card data with current P&L
- Claude can regenerate card on demand: "Show me how my defense AI thesis is doing"
- Track.ts stores price history for sparkline/chart on card

### 5.3 Thesis outcomes

- `track.ts outcomes` — review all closed theses
- Win/loss/breakeven tracking
- Return % and days held
- "Your defense AI thesis returned +18.2% over 45 days (high conviction confirmed)"
- Over time: calibration data. "Your high-conviction theses average +12%, medium average +3%"

---

## Build Order (Suggested Priority)

| Priority | Task | Gate | Est. Effort |
|----------|------|------|-------------|
| 🔴 1 | SKILL.md comprehensive rewrite | 1 (quality) | 2-3 hours |
| 🔴 2 | discover.ts relevance scoring | 1 (quality) | 1-2 hours |
| 🔴 3 | Expanded tool tests + discover tests | 1 (quality) | 1 hour |
| 🟡 4 | history.ts (save/list/replay) | 2 | 1-2 hours |
| 🟡 5 | track.ts (book/pnl/close) | 2 | 2 hours |
| 🟡 6 | Frontend scaffold + TradeCard component | 2 | 3-4 hours |
| 🟡 7 | Satori PNG export | 2 | 1-2 hours |
| 🟡 8 | Dashboard pages (home, thesis, portfolio, history) | 2 | 3-4 hours |
| 🟢 9 | execute.ts + brokerage templates | 3 | 2-3 hours |
| 🟢 10 | Screenshot confirmation (SKILL.md vision section) | 3 | 1 hour |
| 🟢 11 | User profile / onboarding | 3 | 1 hour |
| 🔵 12 | Social card generation + watermark | 4 | 1 hour |
| 🔵 13 | P&L update cron + sparklines | 4 | 2 hours |
| 🔵 14 | Thesis outcome tracking + calibration | 4 | 2 hours |

**Total estimated: ~25-35 hours of work across Gates 1-4.**

---

## File Structure (Final)

```
skills/belief-router/
├── SKILL.md                          # The product — comprehensive agent playbook
├── PLAN.md                           # This file
├── scripts/
│   ├── discover.ts                   # Web search → candidate instruments
│   ├── research.ts                   # Yahoo/CoinGecko/DexScreener enrichment
│   ├── size.ts                       # Kelly sizing + portfolio awareness
│   ├── crypto-prices.ts              # CoinGecko batch + DexScreener
│   ├── types.ts                      # TypeScript interfaces
│   ├── history.ts                    # Thesis save/list/replay
│   ├── track.ts                      # Trade booking + P&L
│   ├── execute.ts                    # Brokerage-specific execution guides
│   └── export-card.ts                # Satori PNG card generation
├── references/
│   ├── secondaries.json              # Pre-IPO companies
│   ├── ticker-context.json           # Curated context for rationale
│   └── brokerages/                   # Execution templates per brokerage
│       ├── robinhood.json
│       ├── coinbase.json
│       └── schwab.json
├── data/
│   ├── cache/                        # API response cache (TTL-based)
│   ├── history/                      # Thesis output logs
│   ├── trades/                       # Booked trades + P&L
│   └── user-profile.json             # Brokerage/wallet/preferences
├── frontend/
│   ├── package.json
│   ├── app/
│   │   ├── layout.tsx                # Dark theme shell
│   │   ├── page.tsx                  # Thesis card grid
│   │   ├── thesis/[id]/page.tsx      # Thesis detail
│   │   ├── portfolio/page.tsx        # Aggregate exposure
│   │   └── history/page.tsx          # Past theses
│   ├── components/
│   │   ├── TradeCard.tsx             # The viral unit
│   │   ├── InstrumentRow.tsx
│   │   ├── PortfolioBar.tsx
│   │   └── PnLBadge.tsx
│   └── lib/
│       ├── data.ts                   # Read JSON from data/
│       └── format.ts                 # Number/time formatting
└── tests/
    ├── run-tests.ts                  # Tool-level tests
    ├── fixtures/                     # Static test data
    └── README.md
```

---

## Success Criteria

After all phases:
1. User says "I think defense AI spending will boom" → Claude produces trader-actionable output with 3-8 ranked instruments, specific dollar amounts, invalidation conditions, in <4000 chars
2. User can see thesis as a visual trade card on localhost:3000
3. User can export card as PNG and share on Twitter
4. After executing, user sends screenshot → Claude books trade → card shows live P&L
5. User can ask "how are my theses doing?" → Claude shows P&L across all tracked theses
6. Everything works with zero paid API keys
7. Any OpenClaw user can install the skill and get the same experience
