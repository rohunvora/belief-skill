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

- **Risk mode: max upside.** Optimize for asymmetry and convexity. Ruin risk (losing the full $100K) is acceptable. Prefer instruments with uncapped upside: options, perps, binary contracts. Deprioritize capped-upside instruments (plain stock/ETF) — but use them when the thesis is structural, long-horizon, or when they're genuinely the highest-beta expression.
- **Bet size: $100,000.** Show payoff scenarios at this amount, not just $100 basis.
- **Goal: one trade.** Find THE single best expression. Not a portfolio. Show 1-2 alternatives with genuinely different risk profiles, but lead with THE trade and commit to it.
- **Time horizon: match to thesis.** Extract catalyst date and estimate when market prices it in. See Phase 1 Time Horizon and Phase 3 criterion #2.

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
| "Fed won't cut in March" | Short rate-sensitive stocks | Market is overpricing the cut — the NO side is mispriced | Short REITs | **Kalshi NO on March cut at $0.08** — 12x payout if right, defined $100K risk |
| "SOL is going to flip ETH" | Long SOL | The ratio is what matters, not the absolute price | Long SOL spot | **Long SOL / short ETH perps on Hyperliquid** — profits on the spread regardless of market direction |

**The key insight: the obvious trade is usually priced in. The deeper trade — the one that requires the causal chain — is where the asymmetry is.**

### Think in Causal Chains

Map the thesis forward using the frame that fits:

**For directional theses** (something goes up or down):
1. **Who benefits directly?** (first-order — usually priced in)
2. **Who supplies the winners? Who gets hurt?** (second-order — often mispriced)
3. **What infrastructure is needed? What breaks?** (third-order — where the edge is)

**For probability theses** (something will/won't happen): What probability is the market assigning? What should it be? Where is the gap widest?

**For relative theses** (X outperforms Y): What's the ratio? What should it be? What drives convergence? Can you isolate the spread from market direction?

### Clarity Gate

If the thesis is ambiguous — direction is unclear, the sector is too broad, or the claim could be interpreted multiple ways — use AskUserQuestion to clarify BEFORE researching. Rules:

- **Use the fewest questions possible.** Prefer 1 question. Only ask 2-4 if genuinely ambiguous across multiple dimensions.
- **Only ask if it changes the trade.** If both interpretations lead to the same instrument, don't ask — just proceed.
- **Use structured options, not open-ended questions.** Give 2-4 specific interpretations to choose from.
- **Skip entirely if the thesis is clear.** A well-articulated tweet or detailed thesis needs zero questions.

Example — "energy will do well" → ask: "Which energy thesis?" with options: Oil/gas (supply), Nuclear (AI power demand), Renewables (policy), Broad sector.

Example — "tech is overvalued because of money printing" → clear. Don't ask. Proceed.

### Gate

**You MUST state the deeper claim in 1-2 sentences before proceeding to Phase 2.** Write it out explicitly. If you can't find a deeper claim, the surface claim IS the deeper claim — state that.

### Time Horizon

After stating the deeper claim, extract three time estimates:

1. **Catalyst date:** When does the key event happen? (e.g., "NIST first hardware deadline: 2026")
2. **Price-in window:** When does the market start pricing it? Known catalysts price in 6-18 months early. Surprises price in 0-3 months.
3. **Trade horizon:** Catalyst minus price-in window = your actual holding period. This is how long you're in the trade, not how long the thesis takes to play out.

Example — PQC mandate (structural):
- Catalyst: NIST full migration by 2035, first hardware deadline 2026
- Price-in: Market reprices when first contracts are signed (~2027-2028)
- Trade horizon: 2-3 years for the re-rating move

Example — Fed holds March (event-driven):
- Catalyst: FOMC meeting March 19
- Price-in: 1-2 weeks before (futures and Kalshi adjust)
- Trade horizon: <1 month — enter 3-4 weeks before, exit day of

You MUST state the trade horizon before proceeding to Phase 2. This gates instrument selection in Phase 3.

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

1. **Current state of whatever the thesis depends on.** The key macro data, valuations, and prices that ground the thesis in reality.
2. **What has already moved.** YTD performance, 52-week ranges for likely instruments. If the move is underway, state it — it changes entry risk.
3. **What consensus thinks.** If everyone agrees, there's no edge. If contrarian, that's where asymmetry lives.
4. **Specific numbers for elimination.** Every fact here becomes ammunition for Phase 3. "CAPE at 39.8 — second highest ever" not "valuations seem high."

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

2. **Time mismatch.** Does the instrument's lifespan match the trade horizon from Phase 1?
   - Trade horizon >2yr: standard options expire too soon. Require LEAPS or use shares/perps.
   - Trade horizon <3mo: shares lack convexity. Prefer options or binary contracts.
   - Perps: annualize the funding rate. At 0.03%/day, a 1-year hold costs ~11% in carry.
   - Kalshi: contract must resolve AFTER the catalyst. If it resolves before, you're betting on noise.
   - Leveraged ETFs: quantify decay drag over the trade horizon. >2 weeks = state the cost.

3. **Upside cap.** We're optimizing for max upside. Eliminate instruments with capped returns unless nothing better exists.
   - Stock/ETF: realistic upside is 20-40% over 6 months. For a $100K max-upside bet, that's $20-40K gain.
   - Options: 3-10x possible. $100K → $300K-$1M.
   - Kalshi binary: 2-10x possible on low-probability events.
   - Perps with leverage: 5-20x possible (but liquidation risk).
   - **If two instruments align equally with the thesis, prefer the one with higher convexity.**

4. **Already moved / priced in.** Use the data from Phase 2.
   - If an instrument is already up 20% YTD on this thesis, the easy money may be gone.
   - If market consensus matches the thesis, the asymmetry is thin.
   - Cite the specific data: "XLE is already +19% YTD — much of the energy move has happened."

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

- **What would make this trade lose money even if the thesis is directionally correct?** (Timing — thesis plays out after expiry. Mechanism — move happens through a channel that doesn't benefit your instrument. Carry — funding rate flips and eats the position. Technicality — Kalshi contract resolves on a definitional edge case. Already priced in.)
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

**Level 1: High-beta proxy.** Parent company stock, sector ETF. State thesis beta honestly: "WMG captures ~2% of the Osamason thesis."

**Level 2: Adjacent market.** Royalty platforms (Royal.io, SongVest, Sonomo), prediction markets (Polymarket), pre-IPO/secondaries (`references/secondaries.json`), crowdfunding (Republic, Wefunder). Search for the specific asset.

**Level 3: Infrastructure play.** Who benefits if the thesis is right? "Nettspend blows up → Spotify benefits" → SPOT. More indirect, but often more tradeable.

**Level 4: Non-financial expression.** Limited merch drops to flip (check official store + StockX/eBay), event tickets, domain names, or building in the space yourself.

**Level 5: Position for the future.** No trade today. Set monitoring for when a direct instrument appears (royalty listing, IPO, token launch). State the specific trigger and where to watch.

**Output adapts:** Levels 1-2 use the standard payoff table. Levels 3-4 use an action list (what, where, cost, upside). Level 5 uses a monitoring plan. Always state the thesis beta gap honestly.

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

# Record, track, close, card
bun run scripts/track.ts record --thesis "..." --platform X --instrument Y --direction Z --entry-price N
bun run scripts/track.ts check
bun run scripts/track.ts close --id ID --exit-price N
bun run scripts/card.ts --id ID
```

### Build Payoff Table

Using live pricing + the trade horizon from Phase 1, build 5 scenario rows at the **$100,000 bet size**. See formatting principles #4 and #9 for column format (timeline, dollar loss / multiple gain, comparable context).

For each instrument type, include the relevant specifics:
- **Options:** strike, expiry, approximate premium, number of contracts at $100K, breakeven price. Warn about IV crush for catalyst-dated theses.
- **Perps:** funding rate as annualized carry cost, leverage used, liquidation price. State it clearly: "Liquidated if price moves X% against you."
- **Kalshi:** current price (= implied probability), number of contracts at $100K, payout if correct. State: "Market says X% chance. You're betting it's higher/lower."
- **Leveraged ETFs held >2 weeks:** quantify the decay drag.

### Conviction Breakeven

Calculate and state: **"You need to be right more than X% of the time for this to be +EV."**

This is the decision gate. If conviction breakeven is 80% on a contrarian thesis, that's a bad bet. If it's 25% on a thesis with clear logic, that's asymmetry.

---

## Phase 5: Format for Reader

**Phases 1-4 are internal reasoning — do not output them. Only output Phase 5.**

**The reader has ADHD but is a sharp trader. The output must be self-contained — no Googling, no leaving the message to understand it.** Structure as Minto Pyramid: answer first, supporting logic below, details last.

### Formatting Principles

1. **Minto Pyramid structure.** Belief → Context intro → Trade line → Why (flowing into scenarios) → Kills → Rejected → Deeper claim → Alt → Execute. Each section meets the reader at their current understanding.
2. **Context before ticker.** The reader must know WHAT they're buying/selling before they see the ticker. For equities: company in plain English ("There's a $688M Swiss chip company..."). For Kalshi: the contract and what it resolves ("There's a binary on whether the Fed cuts in March..."). For perps: the position and what drives it. The ticker line becomes confirmation, not introduction.
3. **WHY flows into scenarios.** Build understanding progressively toward the payoff table. The p3 anchor adapts by instrument type — see Instrument-Type Adaptations table.
4. **Asymmetric framing.** Upside rows: multiples (3x, 5x, 10x). Downside rows: dollar losses (lose $60K). Losses as dollar pain, gains as multiple excitement (prospect theory). For equities, upside labels use → [COMP]-size as context; for other types, use the relevant math (see adaptations table).
5. **Comparable legend when applicable.** For equity trades with MC comparables, add one line each below the table, sorted by size: `QUBT  $2.1B  Quantum Computing Inc`. Skip for Kalshi, perps, and options.
6. **Price included.** Price appears on the trade line and in the scenario table header for brokerage checking ("am I winning?"). MC appears in the company intro. Comparable gives MC meaning.
7. **Telegram-native formatting.** Entire output is a single monospace code block. No markdown tables (they break on mobile). Use `────` dividers between sections. Align columns with spaces. Target ~4096 chars max for a single Telegram message.
8. **Eliminations are compressed.** One line per rejected instrument with ticker, key data point, and reason. Column-aligned for scannability. A framing sentence before the table turns rejections into evidence for the winning trade.
9. **Time-aware scenarios.** Each scenario row includes a rough timeline as first column. Downside resolves faster than upside. Use ranges (< 1yr, 2-3yr, 5yr+) based on catalyst dates and comparable precedents. Scripts provide price levels, not time — Claude estimates timelines from catalysts, comparable growth rates, and market pricing dynamics.
10. **Temporal origin.** For single-company theses, intro includes WHEN they built the thing — "hit production the year Y mandated it" is due diligence about timing risk in one sentence. Skip for ETFs, indices, Kalshi binaries, perp pairs, and commodity instruments.

### Output Template

The entire output goes inside a single code block (triple backticks). Use this structure:

```
BELIEF
[The insight as a claim — what's mispriced and why.
Not a logic flowchart, but the bet stated plainly.]
────────────────────────────────────

There's a [MC] [country/descriptor] [company type] [making/that]
[temporal beat — WHEN they built it + why timing is now].

[COMPANY NAME] ([TICKER]) · $[PRICE] · [DIRECTION]

────────────────────────────────────

WHY

[Paragraph 1: The catalyst/mandate/force. What happened,
what's the deadline, why there's no opt-out. Facts only.]

[Paragraph 2: The company's specific product/position.
Revenue, cash, key differentiator. Why purest play.]

[Paragraph 3: The anchoring number. State the gap between
current MC and the addressable market. "At $[MC], the market
is pricing [what's implied — usually zero/minimal adoption].
That's the floor. [What changes above that floor]:"
→ flows directly into the scenario table]

── $100K in [TICKER] at $[PRICE] ─────

 [time]   lose $XXK   [condition]
 [time]   lose $XXK   [condition]
 [time]      Nx       → [COMP1]-size
 [time]      Nx       → [COMP2]-size
 [time]      Nx       → [COMP3]-size

[COMP1]  [MC]  [Full Name]
[COMP2]  [MC]  [Full Name]
[COMP3]  [MC]  [Full Name]

[shares] sh · [trade horizon] · >[X]% +EV

────────────────────────────────────

KILLS

· [time]   [kill condition — specific, observable]
· [time]   [kill condition]
· [time]   [kill condition]
· [time]   [kill condition]

Next: [nearest catalyst with date]

────────────────────────────────────

REJECTED

[Optional: one sentence framing if rejections share a theme.]

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

### Instrument-Type Adaptations

The template above is the reference implementation (equity-long). For other instrument types, adapt these sections — the skeleton (BELIEF → intro → WHY → table → KILLS → REJECTED → DEEPER CLAIM → ALT → EXECUTE) stays identical:

| Section | Equity (default) | Kalshi binary | Perp / leveraged | Options / puts |
|---------|-----------------|---------------|------------------|----------------|
| Intro | Company desc + MC + temporal | Contract + resolution date + market probability | Position + leverage + funding rate | Underlying + strike + expiry + IV |
| WHY p3 anchor | MC gap vs addressable market | Probability mispricing: "market says X%, should be Y%" | Ratio divergence or momentum + carry cost | Premium vs expected move + IV vs realized |
| Table upside | Nx → [COMP]-size | Payout at $1/contract (show # contracts) | Nx at leverage (show liquidation price) | Nx on premium (show breakeven price) |
| Table downside | lose $XXK | lose $XXK (premium = max loss) | lose $XXK or "liquidated at $X" | lose $XXK (premium = max loss) |
| Summary line | [shares] sh · horizon · >X% +EV | [contracts] ct · resolves [date] · >X% +EV | [size] @ [leverage]x · [funding]/yr · >X% +EV | [contracts] · [expiry] · >X% +EV |

Comparables and comparable legend: use for equities and equity-like instruments. For Kalshi, perps, and options, replace with the relevant math context (payout structure, leverage math, greeks).

### Output Precision Rules

**Scenario table math by type:**
- **Equity:** Implied price = target MC ÷ shares outstanding. Multiple = target price ÷ entry price. MC comparables must be real, recognizable companies — ideally same sector.
- **Kalshi:** P&L = contracts × (payout − entry price). State # contracts at $100K and implied probability.
- **Perps:** P&L = position size × leverage × price move %. State liquidation price in every scenario.
- **Options:** P&L = contracts × (intrinsic value at target − premium paid) × 100. State breakeven price and expiry.

**Kill conditions:** Specific, observable, with time column. Not "if the thesis is wrong" but "2026  QS7001 misses mass production" or "policy  NIST delays or softens mandate." `Next:` highlights nearest catalyst.

**Rejections:** One line per instrument with one data point each. If rejections share a common theme, add a framing sentence that turns them into evidence for the winner. If they're heterogeneous (different elimination reasons), skip the framing — the data speaks.

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
9. **Evidence over logic.** Every claim about an instrument must be backed by data from Phase 2 research. No "this seems expensive" — only "this trades at 37.65x P/E vs a 20-year average of 19.08."

