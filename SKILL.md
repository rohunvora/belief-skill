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

- **Ranking metric: `thesis beta × convexity / time cost`.** Purest expression of the thesis, with the most leverage, at the lowest cost to hold. This replaces any hardcoded instrument preference — the metric naturally surfaces the right instrument for each thesis shape.
- **Bet size: $100,000.** Show payoff scenarios at this amount, not just $100 basis.
- **Goal: one trade.** Find THE single best expression. Not a portfolio. Show 1-2 alternatives with genuinely different risk profiles, but lead with THE trade and commit to it.
- **Time horizon: match to thesis.** Extract catalyst date and estimate when market prices it in. See Phase 1 Time Horizon.

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

## Phase 1: Extract the Deeper Claim + Classify Shape

**This is the most important step. The deeper claim AND the thesis shape determine the trade. Get either wrong and everything downstream is wrong.**

### Classify Thesis Shape

Before anything else, classify the thesis. Shape determines which instruments are natural candidates and which evaluation mode to use.

| Shape | Signal | Natural home | Evaluation mode |
|-------|--------|-------------|-----------------|
| Binary event | Resolves yes/no on a specific date ("Fed holds in March") | Prediction markets (Kalshi) | Observable probability — market price IS the implied probability |
| Mispriced company | Specific company re-rates over time ("SEALSQ is undervalued") | Equity / options | Estimated probability — you estimate likelihood AND magnitude |
| Sector/theme | Broad trend benefits a category ("AI defense spending booms") | ETF or highest-beta single name | Estimated probability |
| Relative value | X outperforms Y, ratio changes ("SOL flips ETH") | Pair trade (perps) | Ratio analysis — isolate the spread from market direction |
| Vulnerability | Something breaks or declines ("Google's ad monopoly is the casualty") | Short-side instruments (puts, inverse ETFs, short perps) | Estimated probability |

The "natural home" is the starting point, not the answer. Phase 3's cross-check tests whether another instrument class beats it on the metric.

### Extract the Deeper Claim

Every thesis has two layers:
- **Surface claim:** What the user literally said. The obvious interpretation.
- **Deeper claim:** What the thesis is REALLY about. The underlying force or mechanism. This is what you actually trade.

The deeper claim often points to a **completely different instrument** than the surface claim.

### Cultural Decoding

When the subject is a **person, brand, creator, or community** — ask: what cultural movement or trend does this represent? The thesis is usually about the wave, not the surfer. Find the wave, then find the trade that captures the wave.

- "How do I long Clavicular?" → Not about the creator. Clavicular represents the **looksmaxxing / blackpill / male self-improvement wave**. → **Long HIMS** (men's finasteride, skincare, the literal looksmaxxing pharmacy).
- "Long MrBeast" → Not about one YouTuber. Represents the **attention economy scaling past TV**. → **Long META or programmatic ad infra**.
- "Long Joe Rogan" → Represents **male wellness + alternative health going mainstream**. → **Long HIMS, peptide/longevity companies**.
- "Long Barstool" → Represents **sports betting normalization among young males**. → **Long DKNG or FLUT**.

The pattern: uninvestable subject → decode the cultural signal → find the publicly-traded company that IS the infrastructure for that movement.

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
| "Gold is going higher on geopolitical risk" | Buy GLD | Gold will reprice but shares cap upside at 1x | Buy GLD | **Long GOLD-PERP on HL at 3x** — same thesis beta, 3x convexity, low funding (~5%/yr for non-crypto assets) |

**The key insight: the obvious trade is usually priced in. The deeper trade — the one that requires the causal chain — is where the asymmetry is.**

### Think in the Frame That Fits

Different thesis shapes need different reasoning tools:

**Directional theses** (something goes up or down) — use causal chains:
1. **Who benefits directly?** (first-order — usually priced in)
2. **Who supplies the winners? Who gets hurt?** (second-order — often mispriced)
3. **What infrastructure is needed? What breaks?** (third-order — where the edge is)

**Probability theses** (something will/won't happen) — use probability analysis:
What probability is the market assigning? What should it be? Where is the gap widest? Is the gap wide enough to justify the payout structure?

**Relative theses** (X outperforms Y) — use ratio analysis:
What's the ratio? What should it be? What drives convergence? Can you isolate the spread from market direction?

### Clarity Gate

If the thesis is ambiguous — direction is unclear, the sector is too broad, or the claim could be interpreted multiple ways — use AskUserQuestion to clarify BEFORE researching. Rules:

- **Use the fewest questions possible.** Prefer 1 question. Only ask 2-4 if genuinely ambiguous across multiple dimensions.
- **Only ask if it changes the trade.** If both interpretations lead to the same instrument, don't ask — just proceed.
- **Use structured options, not open-ended questions.** Give 2-4 specific interpretations to choose from.
- **Skip entirely if the thesis is clear.** A well-articulated tweet or detailed thesis needs zero questions.

Example — "energy will do well" → ask: "Which energy thesis?" with options: Oil/gas (supply), Nuclear (AI power demand), Renewables (policy), Broad sector.

Example — "tech is overvalued because of money printing" → clear. Don't ask. Proceed.

### Gate

**You MUST state (a) the thesis shape, (b) the deeper claim in 1-2 sentences, and (c) the time horizon before proceeding to Phase 2.** Write them out explicitly. If you can't find a deeper claim, the surface claim IS the deeper claim — state that.

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

**Time cost implications:** The trade horizon directly affects instrument viability through the metric's denominator. Annualized carry costs: options theta (~30-60% of premium over 6 months), perps funding (~10-30%/yr in crypto, ~2-5%/yr for commodities), Kalshi zero, shares zero. A 12-month crypto perp thesis with 25%/yr funding costs 25% to hold — the metric penalizes this automatically.

---

## Phase 2: Research the Current Environment

**This is the step that makes the difference between a stale ChatGPT answer and an actionable trade.** You must ground the thesis in live data before touching any instruments.

### Check Past Beliefs

Before researching, check if the user has expressed similar beliefs before:

```bash
bun run scripts/track.ts check <keywords from thesis>
```

If similar past beliefs exist:
- **Still open:** "You already have exposure to this thesis via [INSTRUMENT]. Consider whether this adds or overlaps."
- **Closed at a loss:** "A similar thesis led to [INSTRUMENT] on [DATE], closed at [LOSS]. What's different this time?"
- **Closed at a gain:** Reference it briefly and move on.

If no similar beliefs found, skip silently.

### What to Research

Use web search (parallel searches for speed) to find:

1. **Current state of whatever the thesis depends on.** The key macro data, valuations, and prices that ground the thesis in reality.
2. **What has already moved.** YTD performance, 52-week ranges for likely instruments. If the move is underway, state it — it changes entry risk.
3. **What consensus thinks.** If everyone agrees, there's no edge. If contrarian, that's where asymmetry lives.
4. **Specific numbers for scoring.** Every fact here becomes ammunition for Phase 3. "CAPE at 39.8 — second highest ever" not "valuations seem high."
5. **Prediction market check.** For any thesis with a date or binary resolution, search Kalshi (and Polymarket if relevant) for a direct contract. Note the current price/implied probability.

### Gate

**You must have at least 3 specific data points before proceeding to Phase 3.** Not vibes — numbers with dates. "CPI at 2.4% as of January 2026" not "inflation is moderate."

---

## Phase 3: Find THE Trade

**Goal:** Arrive at the single highest-scoring expression using the metric: `thesis beta × convexity / time cost`.

The architecture: classify shape (Phase 1) → find best-in-class for that shape → cross-check against other classes → stress-test the winner.

### Step 0: Binary Check

**Before anything else:** does a prediction market contract exist that literally resolves on this thesis?

Search Kalshi (and Polymarket if relevant) for the exact event. If a contract exists:
- It becomes a candidate that MUST be explicitly beaten by something else
- Evaluate in observable-probability mode: market price = implied probability, your estimate = your edge, EV = `(your probability × payout) − cost`
- It sets the thesis-beta ceiling: the contract IS the event (~100% thesis beta, zero carry)
- Other instruments must justify why they beat 100% thesis beta with zero time cost

If no direct contract exists, proceed to Step 1.

### Step 1: Best-in-Class Within Shape

Using the thesis shape from Phase 1, find the best instrument WITHIN the natural class.

| Shape | Where to look | What to optimize |
|-------|--------------|-----------------|
| Binary event | Kalshi, Polymarket — exact contract | Best price relative to your probability estimate |
| Mispriced company | Robinhood (shares, options, LEAPS) | Highest convexity that matches trade horizon |
| Sector/theme | Robinhood (ETFs, highest-beta single name) | Highest thesis beta within the sector |
| Relative value | Hyperliquid (long/short perp pair) | Cleanest spread isolation, net funding cost |
| Vulnerability | Robinhood (puts, inverse ETFs), HL (short perps) | Most direct short-side expression |

Also consider cross-platform: commodities like gold can be expressed as GLD (Robinhood, zero carry) OR GOLD-PERP (Hyperliquid, leverage + low carry). Crypto directional can be spot, perps, or Kalshi price-range contracts.

For each surviving candidate within the class, compute the three metric components:
- **Thesis beta:** What % of this instrument's price movement is driven by THIS thesis? Kalshi binary on the exact event ≈ 100%. Sector ETF ≈ 30-60%. Single name ≈ 60-90%. Pair trade on the exact ratio ≈ 90-100%.
- **Convexity:** Raw upside multiple at $100K if thesis plays out. Shares 0.2-2x. Options 3-10x. Kalshi binaries 2-12x. Perps at leverage 2-20x.
- **Time cost:** Annualized carry over the trade horizon. Options: theta (estimate ~30-60% of premium over 6 months). Perps: funding rate × horizon. Kalshi: zero. Shares: zero. Leveraged ETFs: decay drag (quantify over horizon).

Your "home pick" is the highest-scoring candidate within the natural class.

### Thesis Beta Floor

**A high thesis-beta instrument with defined loss ALWAYS beats a low thesis-beta instrument with zero carry.** This is the most common routing error — defaulting to a "safe" ETF (25% thesis beta, 1.3x, zero carry) when an options or binary expression exists with 80%+ thesis beta and 5-10x convexity at defined risk.

Rule: if a candidate scores >5x higher on the metric than the home pick, it wins — even if it's in a different instrument class, even if it has time cost. A $100K defined-loss put with 11x convexity and 90% thesis beta is a better belief expression than a $100K ETF position with 1.3x upside that mostly moves on unrelated factors.

When the home pick has thesis beta <50%, **always** cross-check the vulnerability class (puts on the loser) and binary class (prediction markets) before committing. The beneficiary trade is often the boring one; the victim trade is where the convexity lives.

### Step 2: Cross-Check Across Classes

Is the home pick actually the best? Compare it against the best instrument from at least one OTHER class on the same metric.

The cross-check forces an explicit comparison between instrument classes on normalized terms. This is where the objectivity lives — without it, you'd just default to whatever class the shape points to.

Example — "Fed won't cut in March":
- Home pick (binary): Kalshi NO at $0.08 → thesis beta ~1.0, convexity 12x, time cost 0 → score: high
- Cross-check (options): TLT puts → thesis beta ~0.35, convexity 5x, time cost ~40%/yr annualized theta → score: `0.35 × 5 / 1.4 = 1.25` — much lower
- Winner: Kalshi

Example — "SEALSQ undervalued because of PQC mandate":
- Home pick (equity): LAES shares → thesis beta ~0.8, convexity 1.5x, time cost 0 → score: `0.8 × 1.5 / ~0 = high (zero-carry)`
- Cross-check (options): LAES LEAPS → thesis beta ~0.8, convexity 5x, time cost ~30%/yr → score: `0.8 × 5 / 1.3 = 3.08`
- LEAPS beat shares if you trust the 2-year horizon. Shares win if timing is uncertain (zero carry = patience is free).

Present the winner AND the best from a different class as the ALT. The reader always sees two genuinely different risk profiles.

### Disqualifiers

These override the metric — an instrument fails on any of these regardless of score:

- **Thesis contradiction.** Instrument bets against the deeper claim, not just the surface claim. The trade must align with the DEEPER claim. Load `references/instrument-reasoning.md` for detailed thesis contradiction patterns.
- **Liquidity.** Can't fill $100K without >2% slippage. Niche Kalshi markets may cap at ~$500/order. Small-cap perps on HL with 3-5x leverage caps signal thin books.
- **Already priced in.** Instrument has already moved significantly on this thesis AND consensus agrees. Cite the specific data: "XLE is already +19% YTD."
- **Time mismatch.** Options expire before catalyst. Kalshi contract resolves before the event. Instrument mechanically can't capture the thesis.

### Step 3: Stress-Test the Winner

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

### Step 2.5: Private Market Scan

**Trigger:** public winner has thesis beta <50%, OR the thesis targets an emerging trend with no public pure-play.

Search for higher-purity private expressions:

```bash
bun run scripts/adapters/angel/instruments.ts "thesis keywords"
```

The script searches Republic, Wefunder, and Crunchbase for active raises matching the thesis. Evaluate private instruments on the same metric with an illiquidity penalty:

`thesis beta × convexity / (time cost + illiquidity cost)`

Illiquidity cost: assume 5-7 year lockup for seed/A, 2-4 years for late-stage/pre-IPO. Annualize as opportunity cost (~10%/yr).

Private markets win when thesis beta × convexity is so high it overcomes the lockup penalty. This typically happens when:
- No public pure-play exists (thesis beta gap >30% vs public winner)
- Trend is pre-IPO stage (the companies that WILL be the public tickers don't exist yet)
- User has domain expertise or network edge in the space

**If private scan finds results:** add a PRIVATE MARKET section to the output (see Phase 5). This supplements — never replaces — the public market trade.

**If private scan returns empty or low-quality:** skip silently.

| Public winner thesis beta | Private section? |
|--------------------------|:---:|
| >70% | Skip |
| 50-70% | Show only if standout find |
| <50% | Always scan and show if results |

### When No Traditional Instrument Exists

**Never dead-end. Never say "this isn't tradeable." Always descend the expression fidelity ladder until you find something actionable.**

When the thesis doesn't map to any instrument on the five platforms (Robinhood, Kalshi, Hyperliquid, Bankr, Angel) — or when every available instrument has near-zero thesis beta — keep going. Descend through these levels, stopping at the first one that produces a real action:

**Level 1: High-beta proxy.** Parent company stock, sector ETF. State thesis beta honestly: "WMG captures ~2% of the Osamason thesis."

**Level 2: Adjacent market.** Royalty platforms (Royal.io, SongVest, Sonomo), prediction markets (Polymarket), pre-IPO/secondaries (`references/secondaries.json`), crowdfunding (Republic, Wefunder). Search for the specific asset.

**Level 3: Infrastructure play.** Who benefits if the thesis is right? "Nettspend blows up → Spotify benefits" → SPOT. More indirect, but often more tradeable.

**Level 4: Non-financial expression.** Limited merch drops to flip (check official store + StockX/eBay), event tickets, domain names, or building in the space yourself.

**Level 5: Position for the future.** No trade today. Set monitoring for when a direct instrument appears (royalty listing, IPO, token launch). State the specific trigger and where to watch.

**Output adapts:** Levels 1-2 use the standard payoff table. Levels 3-4 use an action list (what, where, cost, upside). Level 5 uses a monitoring plan. Always state the thesis beta gap honestly.

---

## Phase 4: Validate & Price

**Goal:** Confirm the trade is executable and get live pricing. Scripts validate — they don't drive the selection. If script data contradicts your Phase 3 reasoning (instrument is illiquid, price has moved significantly), go back to Phase 3.

### Validate THE Trade + Alternatives

Only validate what survived Phase 3. 2-3 instruments max (winner + cross-check alt).

```bash
# Robinhood: YOU propose tickers, script validates via Yahoo Finance
bun run scripts/adapters/robinhood/instruments.ts "TICKER1,TICKER2"

# Hyperliquid: YOU propose tickers, script validates against live perp list
bun run scripts/adapters/hyperliquid/instruments.ts "TICKER1,TICKER2"

# Kalshi: keyword-based (series tickers are structured)
bun run scripts/adapters/kalshi/instruments.ts "keyword phrase"

# Bankr: thesis-based (sends to Bankr AI agent)
bun run scripts/adapters/bankr/instruments.ts "thesis text"

# Angel: keyword search across Republic, Wefunder, Crunchbase
bun run scripts/adapters/angel/instruments.ts "thesis keywords"
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

## Phase 5: Format for the Screenshot

**Phases 1-4 are internal reasoning — do not output them. Only output Phase 5.**

**The viral moment is the screenshot.** A user screenshots your trade card in Telegram and shares it. The input (tweet/voice note + user message) sits at the top of the screenshot. Your output sits below. Both must fit in ONE iPhone screenshot (~35 lines total, ~20 lines for your output after the input).

**Your first character is 🎯. No preamble. No "interesting thesis." No "let me run this." The trade card IS the response.**

### The Screenshot Rule

**≤18 lines of Telegram text.** Everything that matters fits in 18 lines. If it doesn't fit, cut it — not the scenario table, cut the prose.

### Formatting Principles

1. **≤18 lines.** Non-negotiable. Count them. The screenshot is the product.
2. **Zero preamble.** First character is 🎯. No "Running it through...", no Phase headers, no acknowledgment of the input.
3. **Title ≤ 5 words.** "PQC MANDATE" not "PQC mandate = NIST buying your bags."
4. **WHY in 2-3 sentences.** The one insight that makes someone go "oh shit." Weave in why the obvious play is wrong — rejections are the reasoning, not a separate section.
5. **4 scenario rows max.** Worst, base, good, moon. Not 5. Asymmetric framing: downside as dollar losses, upside as multiples.
6. **Kills + alt = 2 lines.** Compressed.
7. **Buttons close the card.** The execute button with quantity is the proof of construction. It's the punchline of the screenshot.
8. **Telegram-native.** Bold for headers, normal text for prose, monospace code block ONLY for scenario table.

### Output Template

```
🎯 [TITLE — ≤5 WORDS]

[TICKER] $[PRICE] · [direction]

[2-3 sentences. What, why mispriced, why not
the obvious play. This IS the reasoning.]

$100K → [quantity] [units]

[price]  [lose $XK / Nx]  [condition]
[price]  [lose $XK / Nx]  [condition]
[price]  [lose $XK / Nx]  [condition]
[price]  [lose $XK / Nx]  [condition]

[X]% to be +EV · dies if: [k1], [k2], [k3]
Alt: [TICKER] $[price] [dir] ([1 sentence])
```

Then attach inline buttons (see below). That's ≤16 lines of text + button row. Done.

### Action Buttons

**Send the trade card via the `message` tool with inline buttons.** Do NOT output the card as a plain text reply — use the message tool so buttons render. Then respond with `NO_REPLY` to avoid a duplicate message.

After Phases 1-4 are complete and you have the trade card text + routing facts, send it like this:

```json
{
  "action": "send",
  "channel": "telegram",
  "message": "<the trade card text from the output template above>",
  "buttons": [
    [
      {"text": "Buy [QTY] [TICKER] → [Platform]", "url": "[DEEP_LINK]", "style": "success"},
      {"text": "📝 Track", "callback_data": "blr:track:[ROUTING_ID]", "style": "primary"}
    ]
  ]
}
```

**The execute button is a `url` button** — it opens the platform page directly. No callback, no confirmation step. The user taps → platform opens → they execute manually.

**The track button is a `callback_data` button** — when tapped, `blr:track:[ID]` arrives as the user's next message.

**Button text templates by instrument type:**

| Type | Execute button text | URL |
|------|-------------------|-----|
| Stock | `Buy 25,974 LAES → Robinhood` | `https://robinhood.com/stocks/LAES` |
| Put/Call | `Buy 238 DJT $5P → Robinhood` | `https://robinhood.com/options/chains/DJT` |
| Kalshi | `Buy 3,703 KXFED NO → Kalshi` | `https://kalshi.com/markets/KXFED` |
| Perp | `Long SOL 3x → Hyperliquid` | `https://app.hyperliquid.xyz/trade/SOL` |
| Polymarket | `Buy 1,538 YES → Polymarket` | `https://polymarket.com/event/[slug]` |

**Button styles:** Execute = `"success"` (green), Track = `"primary"` (blue). Requires Bot API 9.4+.

### Handling Button Callbacks

When the user taps a button, its `callback_data` arrives as their message. Handle these prefixes:

**`blr:track:[ID]`** — User wants to paper trade this routing.
1. Run: `bun run scripts/track.ts record --input "<thesis>" --inst <INST> --px <PX> --dir <DIR> --plat <PLAT> --action paper --β <BETA> --conv <CONV> --tc <TC> --kills "<KILLS>" --alt "<ALT>"`
2. Reply with confirmation + next buttons:
```json
{
  "action": "send",
  "message": "📝 Tracked [INST] @ $[PX]. Portfolio updated.",
  "buttons": [
    [
      {"text": "✅ I Took This", "callback_data": "blr:real:[ID]", "style": "success"},
      {"text": "📊 Portfolio", "callback_data": "blr:portfolio"}
    ]
  ]
}
```

**`blr:real:[ID]`** — User actually executed the trade.
1. The routing was already recorded as paper from the Track step. Append a note: `bun run scripts/track.ts update --id [ID] --conviction [same] --reason "executed real"`
2. Reply: "💰 Marked as real. Good luck."

**`blr:portfolio`** — Show portfolio.
1. Run: `bun run scripts/track.ts portfolio --telegram`
2. Send the output.

**`blr:close:[ID]`** — Close a position.
1. Fetch live price for the instrument.
2. Run: `bun run scripts/track.ts close --id [ID] --px [LIVE_PRICE]`
3. Reply with P&L summary.

### Recording Trades

Trades are recorded when the user taps 📝 Track (not automatically on every routing). This keeps the belief log clean — only beliefs the user chose to track.

**CLI reference for the Track callback handler:**

```bash
bun run scripts/track.ts record \
  --input "<user's exact words>" \
  --inst "<TICKER or CONTRACT>" \
  --px <entry price> \
  --dir <long|short> \
  --plat <robinhood|kalshi|polymarket|hyperliquid|bankr> \
  --action paper \
  --shape <binary|mispriced|sector|relative|vulnerability> \
  --β <thesis beta 0-1> \
  --conv <convexity multiple> \
  --tc <annualized time cost> \
  --kills "<kill1, kill2, kill3>" \
  --alt "<ALT TICKER $price direction (1 sentence)>"
```

Optional: `--src "tweet:@handle"`, `--claim "deeper claim"`, `--sector "defense"`, `--conviction <0-100>`.

**Storage:** `data/beliefs.jsonl` — append-only, one JSON line per fact.

```bash
bun run scripts/track.ts portfolio [--telegram]   # open beliefs + live P&L
bun run scripts/track.ts close --id X --px <exit>  # close a position
bun run scripts/track.ts update --id X --conviction 90 --reason "new data"
bun run scripts/track.ts history                   # recent routings
bun run scripts/track.ts check <keywords>          # find similar past beliefs
```

### Instrument-Type Adaptations

The 2-3 sentence WHY adapts by type. The scenario table format stays the same.

| Type | WHY includes | Table specifics |
|------|-------------|-----------------|
| Equity | MC, why mispriced, comparable | Nx with comparable context |
| Options/puts | Strike, expiry, premium, breakeven | Max loss = premium |
| Kalshi binary | Implied probability, your edge | Payout per contract |
| Perps | Leverage, funding rate | Liquidation price in downside |

### Output Precision Rules

- **Equity:** target price = target MC ÷ shares. Multiple = target ÷ entry.
- **Kalshi:** P&L = contracts × (payout − entry). State implied probability.
- **Perps:** P&L = size × leverage × move %. State liquidation price.
- **Options:** P&L = contracts × (intrinsic − premium) × 100. State breakeven.
- **Kill conditions:** Specific + observable. "NIST delays mandate" not "thesis is wrong."

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
