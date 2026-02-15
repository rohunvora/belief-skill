# Belief Router Research Synthesis

Research completed: 2026-02-15 | 5 parallel tracks

---

## The One-Sentence Summary

Nobody routes a single natural language belief to its optimal trade expressions across prediction markets, stocks, crypto perps, and token swaps simultaneously — and we now know exactly how to build it, what frameworks to use, what to steal, and what could kill us.

---

## What We Learned That Changes the Build

### 1. The Display Framework Is Settled

**Use "EV per $100 Deployed" + Probability of Profit (POP).**

Every trade card shows:
- **If Right: +$X** / **If Wrong: -$Y** (normalized to $100 basis)
- **Conviction breakeven: Z%** — "you need to be right Z% of the time for this to be worth it"
- **Chance of Profit: N%** — single scannable number borrowed from Tastytrade

The conviction slider defaults to market-implied probability (from Kalshi prices or options IV). Kelly runs silently in background for position sizing. Ranking metric stays: `expected_return_monthly = (profit% × conviction - loss% × (1-conviction)) / months_to_resolution`.

Rejected: Sharpe (portfolio metric, not single-trade), R-multiples alone (break on binaries), raw Greeks (implementation detail), full Kelly display (confusing).

*Source: Track 2*

### 2. The Competitive Gap Is Real and Wide

No existing product combines all 5 of these:
1. Natural language intent parsing (Composer has this)
2. Cross-platform routing (1inch/Jupiter have this)
3. Heterogeneous instrument normalization (Paradigm/Talos have this)
4. Retail-accessible UX (Unusual Whales/Robinhood have this)
5. Prediction market aggregation (Oddpool/Verso have this)

**Closest competitor: Composer** — already does NL → backtest → execution, $200M+ daily volume. If they add Kalshi + Hyperliquid, they become the threat. Speed matters.

**Prediction market aggregation has exploded**: Oddpool, Verso, Matchr, FORS, PolyRouter all launched. But they ONLY aggregate prediction markets — none cross into stocks/options/crypto perps.

*Source: Tracks 1, 3*

### 3. Regulatory Risk Blocks Launch

The Belief Router likely crosses the SEC line from "information" to "investment advice":
- **Fails the IA-1092 three-part test**: output is curated, selective, organized as a recommendation
- **Reg BI applies**: individually tailored "call to action" to retail customers
- **Publisher's exclusion probably doesn't apply**: personalized output ≠ impersonal general circulation
- **SEC 2026 exam priorities** explicitly target automated investment tools and AI-based recommendations

**Action required**: Get a securities counsel opinion before launch. Composer registered as a broker-dealer. Simply adding "not investment advice" disclaimers is legally insufficient for personalized trade routing.

**Possible mitigations** (discuss with counsel):
- Remove specific dollar amounts and ranked recommendations → present raw market data only
- Register as RIA or broker-dealer
- Structure as "educational tool" showing market data without personalized sizing
- Use "expressions" or "market data" language, never "recommendations"

*Source: Track 4*

### 4. The Thesis Is the Viral Unit, Not the P&L

WSB and FinTwit data proves: "I made $200K" is interesting. "I said NVDA would 5x because of AI inference demand, bet $40K on calls, here's the result" is viral. The most viral financial content follows the "I Called It" pattern:

1. Timestamped thesis (the conviction)
2. Trade expression (the proof of conviction)
3. Outcome (the validation)

**PnL card spec**: Lead with thesis in quotes → conviction timestamp → trade expression → P&L result (big, bold, green/red). Dark background, minimal branding. Auto-generate on resolution. One-tap share.

Loss cards are equally or MORE viral than gain cards. Never hide losses.

Key principle from Spotify Wrapped: "Look how interesting YOU are" — not "look at our product."

*Source: Track 5*

### 5. Six Blindspots to Address Before/At Launch

| # | Blindspot | Severity | Mitigation |
|---|-----------|----------|------------|
| 1 | **Regulatory** | BLOCKS LAUNCH | Securities counsel opinion |
| 2 | **Correlated risk** | Must address | Warn when multiple trades are same directional bet |
| 3 | **Platform risk** | Must address | Show risk tiers (Kalshi=CFTC regulated, Hyperliquid=3 incidents in 2025) |
| 4 | **Responsible design** | Must address | 82% of retail CFD traders lose. Add friction, risk warnings, paper mode |
| 5 | **Liquidity illusion** | Must address | Show slippage estimates, flag thin prediction markets |
| 6 | **"Priced in" problem** | Must address | When user agrees with 93% consensus, show edge is 0% and suggest alternatives |
| 7 | **Routing conflicts** | Should address | Disclose fees, show net returns, make routing logic inspectable |
| 8 | **Tax implications** | Can defer | 17-22% after-tax difference across platforms — add disclaimer for now |

*Source: Track 4*

---

## Design Patterns to Steal

| Pattern | From | How It Maps |
|---------|------|-------------|
| Simple/Advanced toggle | 1inch | Default: show the answer. Power user: show routing logic |
| Simulate before commit | Jupiter | Show projected P&L before execution |
| Multi-dimensional comparison | Li.Fi | Payout vs liquidity vs leverage vs time horizon |
| Conviction breakeven | OddsJam (sports betting) | "You need to be right X% for this to be +EV" |
| Probability of Profit | Tastytrade | Single scannable % per trade |
| Progressive disclosure | Robinhood | 3 numbers first, full breakdown on expand |
| Sentiment overlay | Unusual Whales | "Market is 70% positioned for this belief" |
| Paper trading onramp | TradingView / FORS | Simulate conviction portfolio before real money |
| Copy beliefs (not trades) | eToro (inverted) | Subscribe to someone's forward-looking beliefs |
| News→market mapping via LLM | Verso | We do belief→trade mapping |
| The "I Called It" card | FinTwit | Auto-generate timestamped thesis + outcome proof |
| Auto-share on resolution | Spotify Wrapped | One-tap, pre-designed, identity-affirming |

---

## What the Hedge Fund Framework Teaches Us

Professional thesis structure maps directly to our extraction pipeline:

| Hedge Fund Step | Belief Router Equivalent |
|----------------|--------------------------|
| Observation | User's raw belief input |
| Thesis | Parsed cause-effect statement |
| Catalyst | Prompted: "What event resolves this?" |
| Trade expression | Router output across 4 platforms |
| Risk/reward | If Right / If Wrong per $100 |
| Conviction level | User slider (default: market-implied) |
| Kill criteria | "What would change your mind?" → auto-alert |

Key insight from Dalio: beliefs should decompose into testable if-then rules. From Soros: the best trades exploit gaps between market perception and reality — which is exactly what "your conviction vs. market probability" captures.

*Source: Track 3*

---

## Updated Architecture Recommendations

Based on all research:

### Input Layer
- Single text box: "What do you believe?"
- Parse into: Direction / Confidence / Time Horizon / Sectors / Keywords / Catalyst / Kill Criteria
- Default conviction to market-implied probability (Kalshi price or options IV)

### Routing Layer (unchanged, validated by research)
- Query all 4 adapters in parallel
- Each returns normalized TradeExpression with If Right / If Wrong / POP
- No changes needed to the adapter architecture — it's correct

### Display Layer (updated)
- **Primary metric**: EV per $100 deployed (If Right: +$X / If Wrong: -$Y)
- **Secondary metric**: Probability of Profit (single %)
- **Conviction breakeven**: "You need to be right X% for this to be worth it"
- **Progressive disclosure**: Scannable table → drill into platform → execution instructions
- **Correlation warning**: Flag when multiple trades share directional thesis
- **Platform risk badge**: Regulated / DEX / New — visible on every card
- **"Priced in" flag**: When user conviction ≈ market probability, surface it

### Social Layer (new from research)
- **PnL Card**: Auto-generates on trade resolution
  - Thesis in quotes + timestamp + trade expression + P&L (big, bold)
  - Dark background, green/red accent, minimal branding
  - Three sizes: Twitter 1200x675, IG Story 1080x1920, iMessage 1200x1200
  - One-tap share, link-back URL
- **Track Record**: All past thesis cards on user profile
- **Copy Beliefs**: Subscribe to someone's forward-looking beliefs, auto-route to your platforms

### Compliance Layer (new from research — blocks launch)
- Securities counsel opinion required
- Consider: RIA/BD registration vs. structuring as information tool
- Language: "expressions" and "market data", never "recommendations"
- Risk warnings on every trade card (not disclaimer walls, visible concise warnings)
- Paper trading mode for onboarding
- Cooling-off friction for rapid-fire belief routing

---

## Priority Order for Build

1. **Get regulatory opinion** — nothing else matters if we can't launch
2. **Core routing engine** — adapters are spec'd, build them
3. **Display layer with EV/$100 + POP** — the research-validated framework
4. **Correlation + platform risk warnings** — differentiation + responsible design
5. **PnL card (MVP: static PNG, Twitter size)** — viral loop
6. **Paper trading mode** — onboarding + compliance
7. **Copy beliefs / social layer** — network effects
8. **Multi-format cards + auto-generation** — viral loop optimization

---

## Sources

Full research documents:
- `track-1-aggregators.md` — DEX aggregators, institutional platforms, prediction market aggregators, options flow tools
- `track-2-risk-frameworks.md` — Kelly, EV, POP, R-multiples, Sharpe, Robinhood UX, probability anchoring
- `track-3-belief-to-trade.md` — ChatGPT, Composer, AI trading apps, hedge fund frameworks, retail sharing, copy trading
- `track-4-blindspots.md` — Regulatory, conflicts, correlation, liquidity, priced-in, tax, platform risk, responsible design
- `track-5-pnl-card.md` — Robinhood screenshots, WSB, Polymarket, Spotify Wrapped, FinTwit virality, card spec
