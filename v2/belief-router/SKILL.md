---
name: belief-router
description: >
  Thesis-to-trade router. Takes a belief about markets, geopolitics, tech, or culture
  and finds the single highest-upside trade expression through elimination reasoning.
  One thesis → live research → elimination → one trade.
  Use when: user expresses a thesis, asks how to trade a belief, says "belief router",
  "trade this", "how would I trade this", "express this view", or pastes a tweet/article
  with trading implications.
  NOT for: executing trades, managing funds, or anything requiring private keys or passwords.
---

# Belief Router

## Defaults

- **Risk mode: max upside.** Optimize for asymmetry and convexity. Ruin risk (losing the full $100K) is acceptable. Prefer instruments with uncapped upside: options, perps, binary contracts. Eliminate instruments with capped upside (plain stock/ETF) unless the thesis is structural and long-horizon.
- **Bet size: $100,000.** Show payoff scenarios at this amount, not just $100 basis.
- **Goal: one trade.** Find THE single best expression. Not a portfolio. Show 1-2 alternatives with genuinely different risk profiles, but lead with THE trade and commit to it.

---

## Input Validation

Before routing, check:
1. **Is this a thesis?** Must contain a directional claim about the future. If not (e.g., "What's a good investment?"), redirect: "I route specific beliefs into trade expressions. Try stating a thesis like 'AI defense spending will boom.'"
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

### Compound Theses

When a thesis contains multiple distinct claims:
1. Decompose into separate legs, each with its own direction
2. Route the STRONGEST leg (highest conviction, clearest asymmetry) as the primary trade
3. Mention the other legs as alternatives
4. Check `references/portfolio-construction.md` for multi-leg guidance if the user explicitly wants a portfolio

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

**The reader has ADHD but is a sharp trader. Lead with the trade, not the journey.**

Take the full reasoning from Phase 5 and restructure it using the inverted pyramid: punchline first, reasoning below, details last.

### Formatting Principles

1. **Inverted pyramid.** Trade → Payoff → Why (3 bullets) → Kills → Eliminations (table) → Deeper claim → Execute. The punchline is first. The essay is last.
2. **MC-first.** First mention of any instrument uses market cap, not price. "$688M MC" not "$3.85/share." Price only appears in the execution section and payoff footnote.
3. **No naked prices.** Every price mention must include market cap for context.
4. **Payoff table leads with MC.** Each scenario row shows the implied market cap in bold. Add a "Comparable" column showing which known companies get flipped at each MC tier. Calculate MC from shares outstanding × target price.
5. **Eliminations are a table, not paragraphs.** One row per rejected instrument. One sentence max, citing one data point.
6. **"Why this trade" is exactly 3 bullets.** Each starts bold. Reader can skim bold words only and get the thesis.
7. **Sources in collapsed Obsidian callout.** Use `> [!info]- Sources` format so they don't clutter the reading view.

### Output Template

```
# [TICKER] ([COMPANY]) [DIRECTION] — [CURRENT MC]

> [One-line thesis. What you're buying and why. Max 20 words.]

---

### $100K → ?

| Scenario | MC | Your $100K | Comparable |
|----------|-----|-----------|------------|
| Thesis wrong | **$XXXM** | $XX,000 (−$XXK) | [stays micro-cap / comparable] |
| Mild against | **$XXXM** | $XX,000 (−$XXK) | [comparable] |
| **Thesis plays out** | **$X.XB** | **$XXX,000** (+$XXXK) | Flips [COMPANY] ($X.XB) |
| **Thesis very right** | **$X.XB** | **$XXX,000** (+$XXXK) | Enters [COMPANY] territory ($X.XB) |
| **Home run** | **$X.XB** | **$X,XXX,000** (+$XXXK) | Flips [COMPANY] ($X.XB) |

[Position details: shares/contracts, entry, shares outstanding, current MC.]
[Key stats: No expiration / Expires DATE. Leverage / No leverage.]
[Conviction breakeven: >X% for +EV.]

---

### Why this trade

- **[Bold lead-in.]** [1-2 sentences. The core reason — why this thesis demands this instrument.]
- **[Bold lead-in.]** [1-2 sentences. Why THIS specific instrument, not the obvious one.]
- **[Bold lead-in.]** [1-2 sentences. The math — market size, revenue path, MC re-rating logic.]

### What kills it

- [Kill condition 1 — specific, with date if possible]
- [Kill condition 2]
- [Kill condition 3]
- [Kill condition 4]

**Watch:** [Specific dates/events/data releases to monitor]

---

### Why not these instead

| Rejected | Why |
|----------|-----|
| **[NAME]** | [One sentence, one data point. E.g., "96% IV makes LEAPS cost 42% of stock price. Breakeven requires 74% move."] |
| **[NAME]** | [One sentence, one data point.] |
| **[NAME]** | [One sentence, one data point.] |
| **[NAME]** | [One sentence, one data point.] |
| **[NAME]** | [One sentence, one data point.] |

---

### The deeper claim

[The intellectual argument. 2-4 sentences max. Surface claim vs deeper claim.
Why the obvious trade is wrong. The causal chain and why this instrument
sits at the strongest link. This is the "if you want to understand the
reasoning" section — it rewards the reader who scrolls this far.]

**Current backdrop:** [2-3 sentences of live data grounding the thesis.
Specific numbers with dates.]

---

### Also consider

**[ALT INSTRUMENT]** — [2-3 sentences. Must be a genuinely different risk
profile, not second-best version of the same trade. State the tradeoff:
"Higher ceiling ($500K+), higher floor ($0)."]

### Execute on [Platform]

1. [Step — bold the key action]
2. [Step]
3. [Step — call out limit orders or gotchas]
4. [Step]

---

*Market data for informational purposes. Most retail traders lose money on leveraged products.*

> [!info]- Sources
> - [Source 1](url)
> - [Source 2](url)
```

### Output Quality Rules

**MC comparables:** The "Comparable" column in the payoff table must reference real, recognizable companies with current market caps. Use companies the reader would know — ideally in the same sector or adjacent. "Flips D-Wave ($7.3B)" is instantly meaningful. "Flips XYZ Corp ($7.3B)" is not. If no sector-relevant comparable exists at that tier, use a well-known company for scale: "Approaches Palantir territory."

**Elimination table:** Each row must cite ONE specific data point from Phase 2 research. Not "this seems risky" but "96% IV makes LEAPS cost 42% of stock price." The table format forces compression — if you can't say it in one sentence, the elimination reasoning isn't sharp enough.

**The winning trade:** The 3 bullets in "Why this trade" must connect to the DEEPER claim from Phase 1, not the surface claim. First bullet = the force driving the trade. Second bullet = why this instrument specifically. Third bullet = the math that makes the MC re-rating plausible.

**Payoff MC math:** Calculate implied market cap at each scenario from shares outstanding × implied price. State shares outstanding once in the footnote. The MC column is the headline — it's what sharp traders anchor on, not per-share price.

**Kill conditions:** Specific, observable, ideally dated. Not "if the thesis is wrong" but "if core PCE drops below 2.5% on the March 13 release" or "if the Fed signals 3+ cuts at the March 18 FOMC."

**Execution:** Platform-specific, step-by-step. The user should be able to open their broker app and follow the instructions without thinking. Call out limit orders, wide spreads, or low-volume gotchas.

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
