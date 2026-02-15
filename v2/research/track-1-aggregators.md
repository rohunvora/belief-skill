# Track 1: Existing Multi-Platform Aggregators

Research on cross-platform comparison/aggregation products and what we can learn for the Belief Router.

---

## 1. DEX Aggregators (1inch, Jupiter, Li.Fi, Socket)

These solved "same asset, best venue" — the closest structural analog to what the Belief Router does across prediction/trading platforms.

### 1inch

**What they aggregate:** Liquidity across 500+ DEX pools on EVM chains + Solana + TON. Same token pair, many venues.

**How they present comparisons:**
- Two modes: Simple (one-click swap) and Advanced (control slippage, gas, routing preferences)
- Route visualization shows a Sankey-style split diagram: e.g., "40% Uniswap V3 -> 30% Curve -> 20% Balancer -> 10% RFQ"
- Users see the split path before confirming, with estimated savings vs. single-venue execution
- Pathfinder algorithm splits trades across 5-20 micro-steps across venues

**Core data model:**
- Input: token pair + amount + chain
- Engine: graph-based pathfinding across liquidity pools, evaluating price impact, slippage, fees, gas per route
- Output: ordered list of routes with estimated output amount, gas cost, and venue breakdown
- Execution: atomic on-chain — entire transaction reverts if any step fails

**What we can steal:**
- The "split visualization" pattern — showing the user WHERE their money routes and WHY
- The savings comparison ("you save $X vs. single venue")
- Simple/Advanced mode toggle — let retail see the answer, let power users see the routing logic
- Gas-optimized execution that refunds unused gas (analogous to: "you only pay for what you use")

### Jupiter (Solana)

**What they aggregate:** Every major DEX and liquidity pool on Solana into a single swap interface.

**How they present comparisons:**
- Route path labels like "Lifinity V2 -> Whirlpool" showing the DEX sequence
- Ultra V3 uses "Iris" router — 100x faster pathfinding than previous version
- Pre-execution simulation: dry-runs each candidate route on-chain, picks the one with highest predicted output
- This means the quote already accounts for real slippage, not estimated

**Core data model:**
- Input: token pair + amount
- Engine: Iris algorithm splits across routes, simulates on-chain before committing
- Output: best route with simulated actual output (not estimated)

**What we can steal:**
- The simulation-before-execution pattern — for Belief Router, this maps to "here's what your position would look like on each platform BEFORE you commit"
- The "DeFi Superapp" framing — Jupiter isn't just a swap, it's limit orders, DCA, perpetuals. Belief Router can be the "conviction superapp"

### Li.Fi / Socket

**What they aggregate:** Bridges AND DEXs across chains. True any-to-any swaps (e.g., ETH on Ethereum -> USDC on Arbitrum).

**How they present comparisons:**
- Smart Routing API evaluates all possible paths across integrated bridges and DEXs
- Route factors: cost, speed, security assessment
- Three integration levels: Widget (5-min embed), SDK (custom), API (full control)
- Powers MetaMask Bridges under the hood

**Core data model:**
- Input: source chain + token -> destination chain + token + amount
- Engine: evaluates bridge options (security, cost, speed) + DEX options at each end
- Output: ranked routes with tradeoff dimensions (faster but more expensive, cheaper but slower)

**What we can steal:**
- The multi-dimensional route comparison (cost vs. speed vs. security) — directly maps to our platform comparison (max payout vs. liquidity vs. leverage vs. time horizon)
- Widget embeddability — someone could embed a Belief Router widget
- The "middleware" positioning — Li.Fi doesn't compete with bridges, it sits on top. Belief Router doesn't compete with Kalshi/Robinhood, it routes between them

---

## 2. Institutional Multi-Venue Platforms (Paradigm, Talos, DFlow)

### Paradigm

**What they aggregate:** Crypto derivatives liquidity across Deribit, Bit.com, CME, and DeFi — 120+ products. Primarily options, perpetuals, futures.

**How they normalize instruments:**
- Unified access to multi-asset, multi-protocol liquidity — CeFi and DeFi through a single interface
- Non-custodial: traders settle on the venue of their choice
- Multi-dealer RFQ (Request for Quote) + anonymous trading modes
- Single order book view aggregating prices from all connected venues

**Core data model:**
- Input: instrument type + underlying + size
- Engine: RFQ broadcast to network of 1000+ institutional counterparties
- Output: competing quotes from multiple dealers, settle on preferred venue
- Scale: $10B+/month in volume

**What we can steal:**
- The "trade anywhere, settle anywhere" pattern — user expresses belief, we show options across platforms, they choose where to execute
- RFQ-style "get quotes from multiple venues" — we don't need to implement order routing, just show the best expressions per venue
- The normalization of different instrument types (options, perps, futures) into a unified view — we normalize prediction contracts, options, stocks, crypto perps

### Talos

**What they aggregate:** 60+ trading venues for spot, perpetuals, futures, and options. Designed for funds, OTC desks, market makers.

**How they normalize:**
- Unified real-time portfolio view across all instrument types
- Smart order routing + algorithmic execution
- FIX connectivity for standardized communication
- Post-trade standardization for reporting

**Core data model:**
- Input: asset + instrument type + size + execution preferences
- Engine: smart order routing across connected venues, algos for optimal execution
- Output: aggregated order book, best execution across venues

**What we can steal:**
- The "single pane of glass" across instrument types — see your entire conviction portfolio (Kalshi contracts + Robinhood shares + Hyperliquid perps) in one view
- Standardized post-trade reporting — track P&L across heterogeneous positions

### DFlow

**What they aggregate:** Solana DEX liquidity (AMMs, CLMMs, DLMMs, CLOBs) + prediction markets via Kalshi tokenization API.

**How they normalize:**
- Real-time ingestion of every block, transaction, and account update on Solana
- Builds an "atomic price graph" across all venue types
- Sub-millisecond latency for institutional-grade RFQ
- Recently added prediction market tokenization — bringing Kalshi markets on-chain

**Core data model:**
- Input: raw on-chain state from multiple liquidity venues
- Engine: live price graph construction, institutional RFQ
- Output: best price with minimal slippage across all on-chain venues

**What we can steal:**
- The convergence of DEX + prediction markets under one platform — DFlow is already bridging the gap
- The "atomic price graph" concept — for Belief Router, we need a "belief expression graph" that maps a conviction to all possible trade expressions across platforms
- Prediction market tokenization as a normalization layer

---

## 3. Composer.trade — Natural Language to Trading Strategies

**What they aggregate:** US equities, crypto, and options into algorithmic strategies called "Symphonies."

**How they parse intent:**
- AI-assisted editor: user describes goals, strategy, and risk concerns in plain English
- AI generates a complete trading algorithm ("Symphony") in under 60 seconds
- Visual no-code editor for reviewing/modifying the generated strategy
- Strategies display as connected nodes: asset -> indicators -> conditional logic -> action

**How they handle multi-asset:**
- Single-asset strategies (equities, crypto, or options separately)
- Hybrid models combining equities + crypto (options cannot yet be mixed with other asset classes)
- Community marketplace: 80% of users invest in community-built symphonies

**Strategy output format:**
- Visual node graph showing the logic flow
- Backtest performance chart vs. S&P 500 benchmark
- Key metrics: CAGR, Max Drawdown, Sharpe Ratio
- One-click deployment to live automated execution

**Core data model:**
- Input: natural language belief/goal
- Engine: LLM parses into structured strategy (conditions, allocations, rebalancing rules)
- Output: visual strategy graph + backtest results + live execution
- Recently launched MCP server — LLMs can backtest and invest via Composer programmatically

**What we can steal:**
- THE CORE PATTERN: natural language -> structured trade expression. This is the closest existing product to what Belief Router does
- The "Symphony" metaphor — a composition of multiple instruments playing together. Our equivalent: a "Conviction" composed of positions across platforms
- Backtest-before-commit — show the user what would have happened historically
- Community sharing of strategies — users could share their belief->trade mappings
- The MCP integration is a direct validation that LLM -> trade execution is a real product category now

---

## 4. TradingView — Multi-Asset Paper Trading

**What they aggregate:** Stocks, forex, crypto, commodity futures, index futures — all in simulated trading with $100K paper money.

**How they handle multi-asset tracking:**
- Unified Trading Panel for orders, positions, account summary across all asset types
- Portfolio feature: analytical hub showing profitability per trade/asset, with benchmark comparison
- Two views: simple value line over time, or combined view with benchmark overlay
- Community-built portfolio tracker scripts (up to 15 assets with target allocation vs. actual)

**Core data model:**
- Input: any TradingView-supported symbol
- Engine: real-time price feeds, simulated order execution
- Output: unified portfolio view with P&L, allocation analysis, benchmark comparison

**What we can steal:**
- The paper trading as onboarding — let users simulate belief->trade before real money
- Portfolio view with target vs. actual allocation — "you said 60% conviction on Fed rate cut, here's how your $100 is allocated"
- Benchmark comparison — "your belief portfolio vs. S&P 500"
- The universal symbol system — every asset has a ticker. We need a universal "belief expression" identifier

---

## 5. Prediction Market Aggregators

This is the most directly relevant category. Multiple products now exist that compare prediction markets cross-platform.

### Oddpool ("The Bloomberg for Prediction Markets")

**What they aggregate:** Real-time odds from Kalshi and Polymarket.

**How they present comparisons:**
- Side-by-side pricing for identical events across both venues
- 24-hour volume and liquidity tracking across 800+ markets
- Dominance Index: composite score comparing Kalshi vs. Polymarket using volume share, liquidity share, and liquidity turnover
- Whale trade tracking for institutional positioning
- Arbitrage scanner (Pro): identifies price discrepancies between platforms with ROI calculations
- Category dashboards: Sports, Finance, Crypto, Politics, Entertainment

**Core data model:**
- Input: event/market
- Engine: real-time price ingestion from both platforms, matching identical events
- Output: cross-venue odds comparison, volume analytics, arbitrage opportunities

**What we can steal:**
- The "same event, different platforms" comparison is our exact pattern, but only for prediction markets. We extend this to stocks + crypto + options
- Dominance Index concept — "which platform has the most action on this belief?"
- Arbitrage detection — "platform A says 60%, platform B says 55%, there's edge here"
- Category-based organization of beliefs

### Verso ("Professional-Grade Prediction Market Terminal")

**What they aggregate:** 15,000+ prediction market contracts from Polymarket and Kalshi.

**Key features:**
- Bloomberg-style terminal interface for prediction markets
- Custom dashboards built by pasting tickers
- News-to-market mapping: 30,000+ news articles mapped to prediction contracts using LLM embeddings + GPT-5 impact scoring (73% accuracy)
- Upcoming: smart order routing, sub-5-minute data updates

**What we can steal:**
- The LLM-powered news->market mapping is extremely relevant. We map beliefs->trades; they map news->contracts
- The "paste a ticker, build a dashboard" simplicity
- Bloomberg-terminal aspirations for retail — Belief Router is "Bloomberg for convictions"

### Matchr

**What they aggregate:** 1,500+ prediction markets across Polymarket and Kalshi.

**Key features:**
- Smart routing: find best prices across platforms
- Arbitrage detection between platforms
- Automated yield strategies

**What we can steal:**
- Smart routing across prediction platforms — direct analog to our cross-platform routing
- The "1,500 markets unified" scale ambition

### FORS (Solana-Based)

**What they aggregate:** Multiple prediction markets on Solana into a single non-custodial interface.

**Key features:**
- Real-time aggregation + smart order routing
- Arbitrage visibility built-in
- Copy trading with transparent performance metrics
- Demo/practice mode for paper trading
- Non-custodial design

**What we can steal:**
- Copy trading on beliefs — "follow this trader's conviction portfolio"
- Demo mode as onboarding (same as TradingView paper trading)
- Non-custodial execution — user's funds never leave their control

### PolyRouter (API Layer)

**What they aggregate:** Normalized data from Kalshi, Polymarket, Limitless, Manifold via unified API.

**Key insight:** PolyRouter is building the DATA NORMALIZATION layer that all the above UIs need. It's the prediction market equivalent of what Li.Fi is for bridges.

**What we can steal:**
- The API-first approach — Belief Router needs a normalized data layer that multiple UIs can build on
- Cross-platform event matching is a solved (or being-solved) problem at the API level

### Metaforecast

**What they aggregate:** Probabilities from 10+ forecasting platforms (prediction markets + expert forecasting).

**Key features:**
- Search engine for probabilities
- Quality rating system (1-5 stars) based on platform, forecast count, liquidity
- Bridges prediction markets with non-market forecasting (Metaculus, expert panels)

**What we can steal:**
- Quality/confidence ratings per source — "Kalshi has deep liquidity on this, Polymarket is thin"
- Including non-market signals (expert forecasts) alongside market prices

### Prediction Hunt

**What they aggregate:** Kalshi, Polymarket, PredictIt with cross-exchange comparison.

**Key feature:** Arbitrage detection refreshed every 5 minutes.

---

## 6. Options Flow Aggregators (Unusual Whales, FlowAlgo, Benzinga)

These solved "make complex derivatives data accessible to retail" — critical UX precedent.

### Unusual Whales

**What they aggregate:** Every options trade across all U.S. exchanges, plus dark pool data.

**How they present risk/reward to retail:**
- Live flow feed: filterable table of options trades (premium, DTE, IV, Greeks, bid/ask hit)
- Market Tide: visual heatmap of net put vs. call premium — shows bullish/bearish sentiment at a glance
- Color-coded: green for bullish (hit the ask), red for bearish (hit the bid)
- Profit calculators for scenario analysis
- Custom alerts for specific flow patterns
- Price: $29-99/month for institutional-grade data at retail price

**Core data model:**
- Input: real-time options order flow from all U.S. exchanges
- Engine: filter, classify (bullish/bearish/neutral), aggregate by ticker/sector/market
- Output: flow feed + sentiment heatmaps + alerts

**Visual language that works:**
- Bullish/bearish color coding (green/red)
- Size-weighted bubbles or bars showing premium flow direction
- "Smart money" framing — "institutions are buying X" is powerful retail messaging
- Sentiment as a single number/visual (Market Tide) rather than raw data

**What we can steal:**
- Sentiment visualization — for each belief, show a "Market Tide" style indicator of how the market is positioned
- The "smart money is doing X" narrative framing — "institutions are positioned for [belief] via [instrument]"
- Tiered pricing: basic flow vs. pro analytics
- The filter-first UX — users start broad, drill into what matters

### FlowAlgo

**What they aggregate:** Real-time options flow + dark pool activity.

**Key UX patterns:**
- "Levels" feature: identifies institutional zones where dark pool activity concentrates — these become support/resistance levels
- Real-time monitoring with institutional-sized trade detection
- Mobile-first design philosophy (via Benzinga integration)

**What we can steal:**
- The "Levels" concept — institutional consensus zones. For beliefs: "65% of institutional money is positioned for Fed rate cut via options"
- Mobile-first for retail flow tools

### Benzinga Options Flow

**Key contribution:** Unusual Options Activity API — surfaces unusual flow in real-time through mobile-first interfaces.

**What we can steal:**
- API-first distribution — Benzinga provides the data, multiple UIs consume it
- Mobile-first retail design

---

## Synthesis: Key Patterns for the Belief Router

### 1. The Universal Aggregator Data Model

Every aggregator follows the same pattern:

```
Input: User intent (swap, trade, bet, belief)
   |
   v
Discovery: Find all venues that can express this intent
   |
   v
Normalization: Convert venue-specific formats to common schema
   |
   v
Ranking: Score each option on relevant dimensions
   |
   v
Presentation: Show ranked options with key tradeoffs
   |
   v
Execution: Route to chosen venue
```

For Belief Router, this maps to:

```
Input: Natural language belief ("Fed will cut rates by June")
   |
   v
Discovery: Which platforms can express this? (Kalshi, Robinhood, Hyperliquid, Bankr)
   |
   v
Normalization: Convert to common schema
   - Kalshi: binary contract, $0.65 -> $1.00 payout
   - Robinhood: buy TLT calls, defined risk/reward
   - Hyperliquid: long BTC perp (rate cut = risk-on)
   - Bankr: social bet with friends
   |
   v
Ranking: Score on payout multiple, liquidity, time horizon, complexity
   |
   v
Presentation: "$100 deployed" comparison card per platform
   |
   v
Execution: Link/deeplink to platform with pre-filled parameters
```

### 2. What the Best Aggregators All Share

| Pattern | Example | Belief Router Equivalent |
|---------|---------|--------------------------|
| Split visualization | 1inch route diagram | Show how $100 splits across platforms |
| Simulation before commit | Jupiter on-chain dry-run | Show projected P&L before execution |
| Multi-dimensional comparison | Li.Fi (cost/speed/security) | Payout/liquidity/leverage/time horizon |
| Natural language input | Composer symphonies | Core product: belief in, trades out |
| Same-event cross-platform | Oddpool side-by-side odds | Same belief, different platforms |
| Sentiment overlay | Unusual Whales Market Tide | "Market is 70% positioned for this belief" |
| Paper trading onramp | TradingView / FORS demo mode | Simulate conviction portfolio before real money |
| Quality/confidence rating | Metaforecast stars | Liquidity depth + historical accuracy per platform |

### 3. What Nobody Has Built Yet

No existing product does ALL of the following:
1. Takes a natural language belief
2. Maps it across heterogeneous platform types (prediction markets + stocks + derivatives + crypto + social bets)
3. Normalizes to a common unit ("$100 deployed")
4. Shows ranked trade expressions with risk/reward profiles

The closest products and their gaps:
- **Composer**: natural language -> trades, but single platform (their own brokerage), equities/crypto only
- **Oddpool/Verso**: cross-platform prediction market comparison, but only prediction markets, no NL input
- **1inch/Jupiter**: cross-venue routing with split visualization, but same asset type only (token swaps)
- **Paradigm/Talos**: multi-venue, multi-instrument, but institutional only, no NL input, no retail UX
- **Unusual Whales**: retail-accessible complex instruments, but single instrument type (options), no cross-platform

**The Belief Router fills the gap at the intersection of ALL these products.** It is the first product that combines NL intent parsing (Composer) + cross-platform routing (1inch) + heterogeneous instrument normalization (Paradigm) + retail UX (Unusual Whales) + prediction market aggregation (Oddpool).

### 4. Specific Design Decisions to Steal

1. **From 1inch**: Simple/Advanced mode toggle. Default: show the answer. Power user: show the routing.
2. **From Jupiter**: Simulate outcomes before committing. Show "this is what would happen" not just "here's the price."
3. **From Li.Fi**: Widget embeddability. Let others embed Belief Router as a component.
4. **From Composer**: The Symphony metaphor. A belief expressed as a composition of instruments.
5. **From Oddpool**: Side-by-side comparison with arbitrage highlighting. "Kalshi says 60%, options market implies 72% — there's edge."
6. **From Unusual Whales**: Color-coded sentiment, "smart money" framing, mobile-first.
7. **From TradingView**: Paper trading as onboarding. "$100 virtual conviction portfolio."
8. **From FORS**: Copy trading on beliefs. "Follow @macro_whale's conviction portfolio."
9. **From Verso**: LLM-powered news->market mapping. We do belief->trade mapping.
10. **From Metaforecast**: Quality ratings per source. Not all platforms are equal for every belief.
