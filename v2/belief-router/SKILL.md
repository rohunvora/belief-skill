---
name: belief-router
description: >
  ALWAYS activate when user expresses ANY belief, thesis, hunch, or cultural observation
  with investment or trading implications. Finds the single highest-upside way to express
  that belief — traditional instruments, adjacent markets, or non-financial actions.
  Triggers: "how would I trade this", "how to invest in", "I think X will happen",
  "is X a good bet", "what's the play on", "trade this", "belief router",
  "express this view", any pasted tweet/article with a directional claim,
  cultural observations ("everyone's on Ozempic", "my rent just spiked"),
  or questions about investing in specific people/trends/movements.
  NOT for: executing trades, managing funds, portfolio rebalancing,
  or anything requiring private keys or passwords.
---

# Belief Router

## Defaults

- **Risk mode: max upside.** Optimize for asymmetry and convexity. Ruin risk (losing the full $100K) is acceptable. Prefer instruments with uncapped upside: options, perps, binary contracts. Eliminate instruments with capped upside (plain stock/ETF) unless the thesis is structural and long-horizon.
- **Bet size: $100,000.** Show payoff scenarios at this amount, not just $100 basis.
- **Goal: one trade.** Find THE single best expression. Not a portfolio. Show 1-2 alternatives with genuinely different risk profiles, but lead with THE trade and commit to it.

---

## Input Validation

Before routing, check:
1. **Is this a thesis?** Must contain a directional claim — explicit or implied — about the future.
   - **Clear thesis** ("AI defense spending will boom") → proceed directly.
   - **Implied thesis as question or vibe** ("how to invest in Nettspend?", "everyone's on Ozempic", "my landlord raised rent 40%") → **reframe it** as a directional claim and confirm: use AskUserQuestion with your reframed thesis and 2-3 interpretations as options. Examples:
     - "How to invest in Nettspend?" → "Which angle?" → "His cultural momentum will drive streaming/label revenue growth" / "The pluggnb genre wave is going mainstream" / "Music streaming platforms are undervalued"
     - "Everyone's on Ozempic" → "Which thesis?" → "GLP-1 adoption is accelerating faster than the market expects" / "Food/snack companies are the second-order losers" / "Pharma will keep running"
   - **No directional claim at all** ("What's a good investment?", "tell me about stocks") → redirect: "I route specific beliefs into trade expressions. What do you think is going to happen?"
2. **Is it specific enough?** See Phase 1 clarity gate below.
3. **Is it an action request?** ("I want to buy ONDO") — treat the implied direction as the thesis and proceed.

---

## Phase 1: Extract the Deeper Claim

**This is the most important step. The deeper claim determines the trade. Get this wrong and everything downstream is wrong.**

Every thesis has two layers:
- **Surface claim:** What the user literally said. The obvious interpretation.
- **Deeper claim:** What the thesis is REALLY about. The underlying force or mechanism. This is what you actually trade.

The deeper claim often points to a **completely different instrument** than the surface claim.

### Worked Examples

| User says | Surface claim | Deeper claim | Surface trade | Deeper trade |
|-----------|--------------|--------------|---------------|--------------|
| "AI is being blamed for tech layoffs but it's really about money printing" | Tech will fall | Years of loose monetary policy are debasing the currency; AI is the scapegoat | Short QQQ | **Long gold** — purest money-printing trade |
| "Everyone's on Ozempic" | Buy NVO/LLY | GLP-1 adoption shrinks food consumption at scale | Long pharma | **Short food delivery (DASH), short snacks (MDLZ, PEP)** — second-order losers are mispriced |
| "AI will replace search" | Buy AI companies | Google's ad monopoly is the casualty | Long AI | **Short GOOG** — the victim is more mispriced than the winner |
| "Bugatti customers are all crypto bros" | Buy crypto | Crypto wealth effect flows into luxury goods | Long BTC | **Long luxury (LVMH, Ferrari RACE)** — the non-obvious beneficiary |
| "Interest rates are staying higher for longer" | Buy bank stocks | Long-duration assets get punished across the board | Long JPM | **Short TLT or long TBT** — the most direct rates expression |

**The key insight: the obvious trade is usually priced in. The deeper trade — the one that requires the causal chain — is where the asymmetry is.**

### Think in Causal Chains

Map the thesis forward at least 3 levels:

1. **Who benefits directly?** (first-order — usually priced in)
2. **Who supplies the winners? Who gets hurt?** (second-order — often mispriced)
3. **What infrastructure is needed? What breaks?** (third-order — where the edge is)

### Clarity Gate

If the thesis is ambiguous — direction is unclear, the sector is too broad, or the claim could be interpreted multiple ways — use AskUserQuestion to clarify BEFORE researching. Rules:

- **Use the fewest questions possible.** Prefer 1 question. Only ask 2-4 if genuinely ambiguous across multiple dimensions.
- **Only ask if it changes the trade.** If both interpretations lead to the same instrument, don't ask — just proceed.
- **Use structured options, not open-ended questions.** Give 2-4 specific interpretations to choose from.
- **Skip entirely if the thesis is clear.** A well-articulated tweet or detailed thesis needs zero questions.

Example — thesis is "energy will do well":
```
AskUserQuestion:
  "Which energy thesis?"
  Options:
  - "Oil/gas — supply constraints and OPEC"
  - "Nuclear/uranium — AI datacenter power demand"
  - "Renewables — policy/subsidy driven"
  - "Broad energy sector"
```

Example — thesis is "tech is overvalued because of money printing" → clear. Don't ask anything. Proceed.

### Gate

**You MUST state the deeper claim in 1-2 sentences before proceeding to Phase 2.** Write it out explicitly. If you can't find a deeper claim, the surface claim IS the deeper claim — state that.

---

## Phase 2: Research the Current Environment

**This is the step that makes the difference between a stale ChatGPT answer and an actionable trade.** You must ground the thesis in live data before touching any instruments.

### Check Trade History

Before researching, check for past trades on similar theses:

```bash
bun run scripts/track.ts check
```

If similar past trades exist:
- **Still open:** "You already have exposure to this thesis via [TRADE]. Consider whether this adds or overlaps." Don't recommend a correlated position without flagging it.
- **Closed at a loss:** "A similar thesis led to [TRADE] on [DATE], closed at [LOSS]. What's different this time?" Surface the context — don't auto-block, but make the user think.
- **Closed at a gain:** Reference it briefly and move on.

If `track.ts` has no data or no similar trades, skip silently. Don't add friction when there's nothing to surface.

### What to Research

Use web search (parallel searches for speed) to find:

1. **Current state of whatever the thesis depends on.**
   - Rates thesis → current Fed rate, dot plot, market expectations for cuts/hikes, recent FOMC commentary
   - Inflation thesis → latest CPI, core PCE, TIPS breakeven rates (5yr, 10yr)
   - Tech thesis → current Shiller CAPE, sector P/E vs historical averages, recent earnings data
   - Crypto thesis → current prices, BTC dominance, ETF flows, funding rates
   - Sector thesis → current valuations, recent rotation data, earnings calendar

2. **What has already moved.**
   - If the thesis is "value will outperform growth" and value is already +10% YTD vs growth -5%, the move is UNDERWAY. State that — it changes the entry risk.
   - Pull YTD performance for the likely instruments.
   - Check 52-week ranges to understand where we are in the cycle.

3. **What consensus thinks.**
   - If everyone agrees with the thesis, there's no edge. Flag it.
   - If the thesis is contrarian, that's where the asymmetry lives.
   - Check: recent analyst upgrades/downgrades, positioning data, sentiment indicators.

4. **Specific numbers for the elimination.**
   - You will use these data points in Phase 3 to eliminate instruments with evidence. Every fact you find here becomes ammunition. "CAPE at 39.8 — second highest ever" is a data point that supports a short-tech thesis with specific evidence.

### How to Research

Launch 2-3 web searches in parallel. Structure them by what you need:

- **Search 1:** Macro data relevant to the deeper claim (rates, inflation, valuations, policy)
- **Search 2:** Current prices and performance of likely instruments (ETFs, stocks, options, crypto)
- **Search 3:** Consensus positioning and recent analyst views (what's priced in)

### Gate

**You must have at least 3 specific data points before proceeding to Phase 3.** Not vibes — numbers with dates. "CPI at 2.4% as of January 2026" not "inflation is moderate."

---

## Phase 3: Eliminate to THE Trade

**Goal:** Arrive at the single highest-upside expression through elimination, not enumeration. Start broad, cut ruthlessly, show your reasoning.

### Step 1: Generate Candidates

Using the deeper claim + causal chain from Phase 1, list 4-8 candidate instruments across platforms. Think across:

- **Direct expressions** (the obvious instrument for the thesis)
- **Indirect expressions** (second/third-order beneficiaries or victims)
- **Different instrument types** (options, perps, binary contracts, stock/ETF, leveraged ETF)
- **Different platforms** (Robinhood, Kalshi, Hyperliquid, Bankr)

Use this as a guide for which platforms to consider:

| Thesis type | Likely platforms |
|---|---|
| Fed / rates / inflation / tariffs | Kalshi (binary), Robinhood (TLT, banks, GLD) |
| Crypto directional | Hyperliquid (perps), Kalshi (price ranges) |
| Sectors (AI, defense, biotech, etc.) | Robinhood (stocks, ETFs, options) |
| Token narratives / DeFi | Bankr (tokens), Hyperliquid (perps) |
| Energy / commodities / gold | Robinhood (XLE, GLD, USO), HL (PAXG) |
| Relative / pair ("X flips Y") | Hyperliquid (long/short perps) |
| Binary policy outcomes | Kalshi |

### Step 2: Eliminate with Evidence

Go through each candidate and eliminate it with a specific reason citing data from Phase 2. The elimination reasoning IS the value — show it, don't hide it.

**Elimination criteria (in order):**

1. **Thesis contradiction.** Does this instrument bet AGAINST the deeper claim?
   - "Short IGV" contradicts "AI is a scapegoat" — if AI isn't the real threat, software is being unfairly punished and should recover.
   - "Long QQQ puts" aligns with the surface claim (tech falls) but not the deeper claim (money printing). It requires an additional assumption about Fed reaction.
   - **The trade must align with the DEEPER claim, not just the surface claim.**
   - Load `references/instrument-reasoning.md` for detailed thesis contradiction patterns.

2. **Upside cap.** We're optimizing for max upside. Eliminate instruments with capped returns unless nothing better exists.
   - Stock/ETF: realistic upside is 20-40% over 6 months. For a $100K max-upside bet, that's $20-40K gain.
   - Options: 3-10x possible. $100K → $300K-$1M.
   - Kalshi binary: 2-10x possible on low-probability events.
   - Perps with leverage: 5-20x possible (but liquidation risk).
   - **If two instruments align equally with the thesis, prefer the one with higher convexity.**

3. **Already moved / priced in.** Use the data from Phase 2.
   - If an instrument is already up 20% YTD on this thesis, the easy money may be gone.
   - If market consensus matches the thesis, the asymmetry is thin.
   - Cite the specific data: "XLE is already +19% YTD — much of the energy move has happened."

4. **Timing risk vs. thesis horizon.** Match the instrument's time characteristics to the thesis.
   - Options have expiration. If the thesis is structural (12+ months), options with 6-month expiry may expire before the thesis plays out.
   - Leveraged ETFs decay. Never hold >2 weeks without quantifying the drag.
   - Perps have funding costs. Annualize the rate.
   - Kalshi has resolution dates. The thesis must resolve before the contract does.

5. **Liquidity and execution.** Can you actually fill $100K?
   - QQQ options: yes, deepest options market in the world.
   - Niche Kalshi markets: maybe not — slippage above $500 orders.
   - Small-cap perps on HL: 3-5x leverage cap signals thin books.

6. **Thesis beta.** How much of the instrument's price movement is driven by THIS thesis?
   - SQQQ shorts ALL of Nasdaq including AAPL/MSFT which have real earnings — low thesis beta.
   - IGV targets software — higher thesis beta for a software thesis.
   - Single name has highest thesis beta but adds idiosyncratic risk.
   - Prefer the instrument where the thesis explains the largest % of the expected move.

### Step 3: Final Comparison

After elimination, you should have 2-3 survivors. Do a head-to-head comparison on:

| Factor | Candidate A | Candidate B |
|--------|------------|------------|
| Thesis alignment | Deeper or surface? | Deeper or surface? |
| Max upside if right | $X | $X |
| Max loss if wrong | $X | $X |
| Timing dependency | Must be right by [date]? | Can hold indefinitely? |
| What has to go right | [conditions] | [conditions] |

Pick the winner. State WHY it wins in 2-3 sentences.

### Step 4: Stress-Test the Winner

Before committing, construct the strongest case AGAINST the winning trade. Ask:

- **What would make this trade lose money even if the thesis is directionally correct?** (Timing — thesis plays out after your options expire. Mechanism — the move happens but through a channel that doesn't benefit your instrument. Already priced in — the market already moved.)
- **Try to rebut it with evidence from Phase 2.** Cite a specific data point.
- **If you can't rebut it, don't hide it.** Flag it as a known risk in the "What kills it" section of the output. If the counterargument is devastating (e.g., the entire upside requires an assumption you can't support), reconsider the runner-up.

This step catches trades where you've convinced yourself of something by accumulating only supporting evidence. The counterexample forces you to look for disconfirming data.

### Compound Theses

When a thesis contains multiple distinct claims:
1. Decompose into separate legs, each with its own direction
2. Route the STRONGEST leg (highest conviction, clearest asymmetry) as the primary trade
3. Mention the other legs as alternatives
4. Check `references/portfolio-construction.md` for multi-leg guidance if the user explicitly wants a portfolio

### When No Traditional Instrument Exists

**Never dead-end. Never say "this isn't tradeable." Always descend the expression fidelity ladder until you find something actionable.**

When the thesis doesn't map to any instrument on the four platforms (Robinhood, Kalshi, Hyperliquid, Bankr) — or when every available instrument has near-zero thesis beta — keep going. Descend through these levels, stopping at the first one that produces a real action:

**Level 1: High-beta proxy.** A traditional instrument that captures most of the thesis.
- Parent company stock (Osamason → Atlantic → WMG on NASDAQ)
- Sector ETF that includes the thesis target
- State the thesis beta honestly: "WMG captures ~2% of the Osamason thesis. You're mostly betting on the music industry."

**Level 2: Adjacent market.** Platforms and instruments outside the four adapters.
- Music royalty platforms (Royal.io, SongVest, Royalty Exchange, Sonomo) — search for the specific artist/asset
- Alternative prediction markets (Polymarket, Metaculus)
- Pre-IPO / secondaries platforms — check `references/secondaries.json`
- Crowdfunding platforms (Republic, Wefunder) for relevant startups

**Level 3: Infrastructure play.** Bet on the platform or enabler that would benefit if the thesis is right.
- "If Nettspend blows up, Spotify benefits" → SPOT
- "If pickleball eats tennis, who makes pickleball equipment?" → search for the market leader
- The infrastructure play is always more indirect, but often more tradeable

**Level 4: Non-financial expression.** Actions that aren't trades but express the belief with real upside.
- **Limited merch / collectibles:** Search for the artist's official store, identify limited drops, assess flip potential on secondary markets (StockX, eBay, Grailed). State what to buy and where to resell.
- **Event tickets:** Find the next concert/event in the user's area. Early tickets to an artist who blows up appreciate in resale value.
- **Domain names / social handles:** If the thesis is about an emerging trend, the digital real estate may be underpriced.
- **Build in the space:** "The best way to long X might be to build the tool/platform/product that serves X."

**Level 5: Position for the future.** When nothing is actionable today, set up monitoring.
- Set alerts for when a direct instrument appears (artist lists royalties, company IPOs, token launches)
- Identify the specific trigger event that would create a tradeable instrument
- State: "No trade today. Here's exactly what to watch for and where to look."

**Output adapts to the level:**
- Levels 1-2: Use the standard payoff table and output template, noting the thesis beta gap.
- Levels 3-4: Replace the payoff table with an action list — what to buy, where, approximate cost, and realistic upside. No fake precision.
- Level 5: Replace the trade section with a monitoring plan — what triggers, what platforms to check, what timeline.

**Always be honest about the gap.** "This is a Level 3 expression — you're betting on the infrastructure, not the thesis directly. Thesis beta is ~0.1." The user deserves to know how directly their action maps to their belief.

---

## Phase 4: Validate & Price

**Goal:** Confirm the trade is executable and get live pricing. Scripts validate — they don't drive the selection. If script data contradicts your elimination reasoning (instrument is illiquid, price has moved significantly), go back to Phase 3.

### Validate THE Trade + Alternatives

Only validate what survived elimination. 2-3 instruments max.

```bash
# Robinhood: YOU propose tickers, script validates via Yahoo Finance
bun run scripts/adapters/robinhood/instruments.ts "TICKER1,TICKER2"

# Hyperliquid: YOU propose tickers, script validates against live perp list
bun run scripts/adapters/hyperliquid/instruments.ts "TICKER1,TICKER2"

# Kalshi: keyword-based (series tickers are structured)
bun run scripts/adapters/kalshi/instruments.ts "keyword phrase"

# Bankr: thesis-based (sends to Bankr AI agent)
bun run scripts/adapters/bankr/instruments.ts "thesis text"
```

For bearish theses on Robinhood: propose inverse ETFs directly (SQQQ, SRS, TBT, etc.).

### Get Returns

```bash
# Robinhood: ticker + direction + type
bun run scripts/adapters/robinhood/returns.ts "TICKER" "long" "stock|etf|option"

# Hyperliquid: asset + direction + leverage
bun run scripts/adapters/hyperliquid/returns.ts "TICKER" "long" "5"

# Kalshi: ticker + direction (yes/no)
bun run scripts/adapters/kalshi/returns.ts "EVENT-TICKER" "yes|no"

# Bankr: ticker + direction
bun run scripts/adapters/bankr/returns.ts "TICKER" "long"
```

### Build Payoff Table

Using live pricing, build 4-5 scenarios at the **$100,000 bet size**:

| Scenario | What happens | Position value | Return |
|----------|-------------|---------------|--------|
| Thesis wrong | [specific adverse condition] | $XX,XXX | -$XX,XXX |
| Mild against | [partial adverse move] | $XX,XXX | -$XX,XXX |
| Thesis plays out | [expected move] | $XX,XXX | +$XX,XXX |
| Thesis very right | [strong move] | $XX,XXX | +$XX,XXX |
| Home run | [extreme move, tail scenario] | $XX,XXX | +$XX,XXX |

For each instrument type, include the relevant specifics:
- **Options:** strike, expiry, approximate premium, number of contracts at $100K, breakeven price. Warn about IV crush for catalyst-dated theses.
- **Perps:** funding rate as annualized carry cost, leverage used, liquidation price. State it clearly: "Liquidated if price moves X% against you."
- **Kalshi:** current price (= implied probability), number of contracts at $100K, payout if correct. State: "Market says X% chance. You're betting it's higher/lower."
- **Leveraged ETFs held >2 weeks:** quantify the decay drag.

### Conviction Breakeven

Calculate and state: **"You need to be right more than X% of the time for this to be +EV."**

This is the decision gate. If conviction breakeven is 80% on a contrarian thesis, that's a bad bet. If it's 25% on a thesis with clear logic, that's asymmetry.

---

## Phase 5: Present (Full Reasoning)

**Phases 1-4 are your thinking engine — stay thorough and verbose there. Phase 5 assembles the full reasoning internally. Phase 6 compresses it for the reader.**

In Phase 5, you assemble all findings from Phases 1-4 into a complete reasoning document. This happens in your thinking/chain of thought. It should include:

- The deeper claim (from Phase 1)
- Key data points (from Phase 2)
- Full elimination reasoning with evidence (from Phase 3)
- Validated pricing and payoff scenarios (from Phase 4)
- The winning trade and why it won

This is the verbose version that ensures rigor. Every elimination must cite a specific data point. Every claim must have evidence. The winning trade must connect to the DEEPER claim. This is where you catch errors and stress-test your logic.

**Do not output Phase 5 to the user.** It feeds Phase 6.

---

## Phase 6: Format for Reader

**The reader has ADHD but is a sharp trader. The output must be self-contained — no Googling, no leaving the message to understand it.**

Take the full reasoning from Phase 5 and restructure it following Minto Pyramid: answer first, supporting logic below, details last. Every section only requires understanding from the sections above it.

### Formatting Principles

1. **Minto Pyramid structure.** Belief → Company intro → Trade line → Why (flowing into scenarios) → Kills → Rejected → Deeper claim → Alt → Execute. Each section meets the reader at their current understanding.
2. **Company before ticker.** The reader must know WHAT they're buying before they see the ticker. Introduce the company in plain English first: "There's a $688M Swiss chip company making the exact hardware that NIST requires..." The ticker line becomes confirmation, not introduction.
3. **WHY flows into scenarios.** Don't drop a disconnected data table. Build understanding progressively: mandate/catalyst (fact) → deadline (urgency) → company's product (connection) → market size (scale) → "if they capture X%, they re-rate to..." (the "aha") → here's what that looks like for your $100K (payoff).
4. **Comparable-as-label for upside, loss % for downside.** Match how traders think. Losing: "how much am I down?" → −60%, −35%. Winning: "what size is it now?" → QUBT, RGTI, D-Wave. Use → arrow prefix for upside rows.
5. **Comparable legend below the table.** Tickers mean nothing to most readers. One line each: `QUBT = Quantum Computing Inc ($1.8B)`.
6. **Price included.** Price appears on the trade line and in the scenario table for brokerage checking ("am I winning?"). MC appears on the trade line intro and as proof in the scenario table. Comparable gives MC meaning.
7. **Telegram-native formatting.** Entire output is a single monospace code block. No markdown tables (they break on mobile). Use `────` dividers between sections. Align columns with spaces. Target ~4096 chars max for a single Telegram message.
8. **Eliminations are compressed.** One line per rejected instrument with ticker, key data point, and reason. Column-aligned for scannability.

### Output Template

The entire output goes inside a single code block (triple backticks). Use this structure:

```
BELIEF
[user's thesis as causal chain, abbreviated]
────────────────────────────────────

There's a [MC] [country/descriptor] [company type] making
[what they do in plain English that connects to the thesis].
[Why this matters — the mandate, catalyst, or force.]

[COMPANY NAME] ([TICKER]) · $[PRICE] · [DIRECTION]

────────────────────────────────────

WHY

[Paragraph 1: The catalyst/mandate/force. What happened,
what's the deadline, why there's no opt-out. Facts only.]

[Paragraph 2: The company's specific product/position.
Revenue, cash, key differentiator. Why purest play.]

[Paragraph 3: Market sizing → re-rating logic → transition
into scenarios. "If [COMPANY] captures even X%, it re-rates
to the size of existing [sector] companies:"]

── $100K at $[PRICE] ([MC]) ─────

 −XX%    $X.XX     $XXK   [implied MC]
 −XX%    $X.XX     $XXK   [implied MC]
→ [COMP1]  $XX.XX    $XXXK   [MC at this level]
→ [COMP2]  $XX.XX    $XXXK   [MC at this level]
→ [COMP3]  $XX.XX      $XM   [MC at this level]

[COMP1] = [Full Name] ([current MC])
[COMP2] = [Full Name] ([current MC])
[COMP3] = [Full Name] ([current MC])

[shares] sh · [expiry info] · >[X]% +EV

────────────────────────────────────

KILLS

· [Kill condition 1 — specific]
· [Kill condition 2 — specific]
· [Kill condition 3 — specific]
· [Kill condition 4 — specific]

Watch: [date/event 1] · [date/event 2] · [date/event 3]

────────────────────────────────────

REJECTED

[TICKER1]       [key data point], [reason]
[TICKER2]       [key data point], [reason]
[TICKER3]       [key data point], [reason]
[TICKER4]       [key data point], [reason]
[TICKER5]       [key data point], [reason]
[TICKER6]       [key data point], [reason]

────────────────────────────────────

DEEPER CLAIM

[2-4 sentences. Surface claim vs deeper claim.
Why the obvious trade path has more assumptions.
Why this specific angle needs fewer steps.
What makes the thesis work even if other legs fail.]

────────────────────────────────────

ALT
[INSTRUMENT] — [1-2 sentences. Genuinely different
risk profile. State the tradeoff: higher ceiling,
higher floor, different risk type.]

EXECUTE
[Platform] → [TICKER] → [Action] → [Type]
→ $[AMOUNT] → [Order type] ([gotcha if any])

Market data for informational purposes.
```

### Output Quality Rules

**Self-contained rule:** The reader must understand the entire output without leaving the message. Company introduced in plain English before the ticker. Every ticker in the scenario table or rejected section gets a one-line legend. No jargon without context.

**Company-before-ticker:** The opening paragraph describes the company, its market cap, what it makes, and why it matters — all before the ticker appears. The ticker line is confirmation: "Oh, THAT's the ticker for the company I just read about." Not introduction.

**WHY section progressive build:** The WHY section must flow logically: fact → urgency → connection → scale → "aha" → payoff. The scenario table is the CONCLUSION of the WHY section, not a disconnected data block. The reader should feel the scenarios are the natural "so what does this mean for my money?" after understanding the thesis.

**Comparable-as-label:** Upside scenario rows use → prefix with a comparable company ticker as the label. These are milestones: "if it reaches QUBT-size, here's your return." Downside rows use −XX% as the label. The comparable legend below the table gives each ticker its full name and current MC so the reader never has to look anything up.

**MC comparables:** Must reference real, recognizable companies with current market caps. Ideally same sector. "→ QBTS" with legend "QBTS = D-Wave Quantum ($7.3B)" is instantly meaningful. If no sector-relevant comparable exists at that tier, use a well-known company.

**Scenario table math:** Calculate implied price at each tier from target MC ÷ shares outstanding. Calculate $100K position value from (target price ÷ entry price) × $100K. State shares outstanding and entry price in the table header line. Show implied MC in the rightmost column.

**Rejected section:** One line per instrument. Column-aligned. Each line cites ONE specific data point from Phase 2 research. "IONQ calls  96% IV, 74% to breakeven" — the compression forces sharp reasoning. If you can't say it in one line, the elimination isn't sharp enough.

**Kill conditions:** Specific, observable, ideally dated. Not "if the thesis is wrong" but "NIST delays past 2035" or "QS7001 misses 2026 production." The Watch line lists upcoming catalysts with dates.

**Execution:** Platform-specific, single line with arrows showing the click path. Call out limit orders, wide spreads, or low-volume gotchas in parentheses.

---

## Rules

1. **Use "expressions" and "market data"** — never "recommendations" or "advice."
2. **Always show downside.** Payoff table must include "thesis wrong" row with dollar loss. For options, state "max loss: 100% of premium ($100,000)."
3. **Conviction breakeven on every expression** — "you need to be right >X% for +EV."
4. **Platform risk tier on every trade** — [Regulated], [DEX], or [New]. See `references/blindspots.md`.
5. **Flag "priced in"** when consensus agrees with the thesis. Show the asymmetry gap.
6. **Bear theses → short-side instruments.** Inverse ETFs on RH, short perps on HL, NO on Kalshi. Map to instruments that PROFIT when the thesis is correct.
7. **Catalyst-dated theses.** Warn about IV crush on options. Select expiry AFTER the catalyst date.
8. **End every response** with the disclaimer line.
9. **One trade, not a portfolio.** The goal is THE single best expression. Alternatives are genuinely different approaches, not diversification.
10. **Evidence over logic.** Every claim about an instrument must be backed by data from Phase 2 research. No "this seems expensive" — only "this trades at 37.65x P/E vs a 20-year average of 19.08."

---

## Script Reference

```bash
# Validate tickers (YOU propose, scripts validate)
bun run scripts/adapters/robinhood/instruments.ts "TICKER1,TICKER2"
bun run scripts/adapters/hyperliquid/instruments.ts "TICKER1,TICKER2"
bun run scripts/adapters/kalshi/instruments.ts "keyword phrase"
bun run scripts/adapters/bankr/instruments.ts "thesis text"

# Get returns
bun run scripts/adapters/robinhood/returns.ts "TICKER" "long" "stock|etf|option"
bun run scripts/adapters/hyperliquid/returns.ts "TICKER" "long" "5"
bun run scripts/adapters/kalshi/returns.ts "EVENT" "yes|no"
bun run scripts/adapters/bankr/returns.ts "TICKER" "long"

# Record & track
bun run scripts/track.ts record --thesis "..." --platform X --instrument Y --direction Z --entry-price N
bun run scripts/track.ts check
bun run scripts/track.ts close --id ID --exit-price N

# Generate card
bun run scripts/card.ts --id ID
```
