# Decisions — Belief Router v2

## 2025-02-15: Session 1 — First live run + output format iteration

### What we built
- Complete v2 skill prompt (SKILL.md) with 6-phase architecture
- 4 platform adapters (Robinhood, Hyperliquid, Kalshi, Bankr)
- Reference docs (instrument-reasoning.md, blindspots.md, portfolio-construction.md)
- Symlinked to `~/.claude/skills/belief-router/`

### First live run: PQC mandate thesis
- Input: "AI overbuild → 2027 compute glut → quantum plugs into AI subsidized infra → PQC software wins via NIST"
- Output: LAES (SEALSQ) long at $688M MC — purest PQC semiconductor play
- Eliminated: IONQ calls (96% IV), IGV puts (already moved), QBTS (priced in), RGTI calls (same IV problem), SQQQ (low thesis beta), HL perps (wrong asset class)
- Key insight: PQC mandate leg is strongest because it needs 1 assumption (NIST stays on schedule) vs 4 for quantum-inherits-infra

### Output format iterations (3 rounds)

**Round 1: Research paper format**
- Thesis → Eliminations (6 paragraphs) → Trade → Payoff → Risks
- Problem: 1000+ words before the reader knows what the trade IS

**Round 2: Inverted pyramid + MC-first**
- Trade → Payoff (with MC + comparables) → Why (3 bullets) → Kills → Eliminations (table) → Deeper claim
- Added: MC column, "Comparable" column with company flips, sources in collapsed Obsidian callout
- Eliminated naked prices — MC is primary, price is secondary

**Round 3: Two-pass architecture (Phase 5 + Phase 6)**
- Concern: does compressing output hurt thinking fidelity?
- Answer: no — reasoning happens in Phases 1-5 (thinking/chain of thought). Phase 6 is purely a formatting pass.
- Phase 5 = "Present (Full Reasoning)" — happens internally, verbose, ensures rigor
- Phase 6 = "Format for Reader" — inverted pyramid, ADHD-optimized

### Key design decisions

1. **MC-first, not price-first.** Crypto traders think in market caps. "Flips D-Wave ($7.3B)" is instant intuition. "$38.50/share" means nothing without context.

2. **Payoff table: MC + Comparable column.** Each scenario row shows implied MC in bold + which company gets flipped at that tier. Makes multiples math visceral.

3. **Two-pass architecture.** Think verbose (Phases 1-5), present tight (Phase 6). Reasoning fidelity never sacrificed for output brevity.

4. **Eliminations as table, not paragraphs.** One row per reject, one sentence, one data point. Forces compression. If you can't say it in one sentence, the reasoning isn't sharp enough.

5. **"Why this trade" = exactly 3 bullets.** Reader can skim bold lead-ins only and get the thesis. Bullet 1 = force. Bullet 2 = why this instrument. Bullet 3 = the math.

### Resolved: output medium → Telegram-native monospace
- Markdown tables break on Telegram (OpenClaw distribution)
- Decision: monospace code blocks as the single default format
- Works everywhere: Telegram, terminal, Obsidian MD
- Obsidian-specific format (tables, callouts) deferred — can add later as a flag

## 2026-02-15: Session 2 — Output v6 (Minto + Price + Comparables)

### What changed
- Phase 6 in SKILL.md rewritten to v6 Minto/Telegram-native format
- Input validation expanded: implied theses (questions, vibes) now get reframed with AskUserQuestion
- Trade history check added to Phase 2 (checks `track.ts` for overlapping positions)
- v1 files relocated from repo root to `v1/`

### Output format iterations continued (rounds 4-7)

**Round 4: Stock price was missing**
- "You kind of need it" — price is how traders check their brokerage app
- Added price to trade line and scenario table
- MC stays for thesis evaluation, price for brokerage checking

**Round 5: MC means nothing without a comparable**
- Insight: "$688M" is abstract. "Approaching QUBT-size ($2.1B)" is instant
- Comparable-as-label pattern: upside rows labeled by company milestone (→ QUBT, → RGTI, → QBTS), downside by loss % (−60%, −35%)

**Round 6: "I don't even know what LAES is"**
- Minto Pyramid applied: company introduced in plain English before ticker
- "There's a $688M Swiss chip company making the exact hardware that NIST requires..."
- Ticker line becomes confirmation, not introduction

**Round 7: WHY section flows into scenarios**
- Old: disconnected data table dropped after one-liner thesis
- New: progressive build — mandate (fact) → deadline (urgency) → company product (connection) → market size (scale) → "if they capture 5%..." (aha) → scenario table (payoff)

### Key design decisions (additions)

6. **Company before ticker (Minto).** Reader must know WHAT they're buying before they see the ticker. No Googling required. Each section only needs understanding from sections above it.

7. **Comparable-as-label.** Upside scenarios use → [COMPANY] as labels (milestones). Downside uses −XX% (loss framing). Matches how traders actually think in each direction.

8. **Price + MC + Comparable = triple anchor.** Price for brokerage checking ("am I winning?"). MC as proof of scale. Comparable gives MC meaning. All three serve different reader moments.

9. **Progressive WHY.** The scenario table is the conclusion of the WHY section, not a standalone block. Reader builds understanding before seeing the numbers.

10. **Telegram-native as default.** Single monospace code block. No markdown tables. `────` dividers. Column alignment with spaces. ~4096 chars target.

### Known issues
- LEAPS pricing not available programmatically — Yahoo/Barchart require JS rendering
- Returns script picks nearest-expiry options, not LEAPS — need to handle long-dated thesis
- Kalshi has no quantum computing markets currently
- SEALSQ options likely illiquid at $688M MC — script correctly defaulted to equity

### Data sources for LAES trade
- LAES price: $3.85 via Yahoo Finance (validated by instruments.ts)
- LAES MC: $688M, shares outstanding ~178.7M
- PQC market size: MarketsAndMarkets ($0.42B → $2.84B by 2030, 46.2% CAGR)
- NIST deadlines: IR 8547 (2030 deprecation, 2035 disallowance)
- NSA CNSA 2.0: 2026 first hard hardware deadline
- IONQ: $34.11, MC $12.3B, IV 96%
- RGTI: $16.09, MC $5.3B, IV 93%
- QBTS: $19.67, MC $7.3B

## 2026-02-15: Session 3 — Output v7 (Time-Aware + Asymmetric Framing + Tonal)

### Context
User feedback on v6 scenario table: "Unclear what's being said, in arguably the most interesting/important part." Three specific gaps:
1. No time dimension — a 3x in 2 years and a 3x in 8 years are completely different trades
2. Reading `$300K` requires subtracting `$100K` to understand the gain, while `3x` is instant
3. MC comps hard to parse in the table's last column — should lead with timeline, then multiples

Additionally, user asked: "should time be factored in before elimination begins?" — identifying a structural gap where time horizon wasn't extracted early enough to gate instrument selection.

Informed by analysis of Citrini Research's writing style (Atoms vs Bits, 26 Trades for 2026): the skill's output was structurally sound but needed tonal adjustments to shift from "analyst proving rigor" to "sharp friend who saw something first."

### Output format iterations continued (rounds 8-10)

**Round 8: Time-aware scenario table**
- Added rough timeline as first column in scenario table (< 1yr, 2-3yr, 5yr+)
- Claude estimates timelines based on catalyst dates, comparable growth rates, and market pricing dynamics
- Scripts provide price levels, not time — time estimation is reasoning, not data
- Downside scenarios typically resolve faster than upside

**Round 9: Asymmetric framing (dollar loss / multiple gain)**
- Old downside: −60%, −35% (percentage). Old upside: $300K, $500K (absolute dollars)
- New downside: lose $60K, lose $35K (dollar pain). New upside: 3x, 5x, 10x (multiple excitement)
- Trade-off: breaks visual consistency in the table, but maps to how traders actually process each direction differently (prospect theory — losses denominated in dollars, gains in multiples)
- Lower total cognitive load than either pure-dollar or pure-multiple

**Round 10: Tonal adjustments (Citrini-inspired)**
Five surgical changes to the output template:
1. **BELIEF line**: logic flowchart → insight claim. "The AI buildout has a beneficiary nobody's pricing" not "ai overbuild → compute glut → quantum"
2. **Company intro**: added temporal beat. "Spent two years building X before anyone wanted it" — shows timing risk posture, not just what they do
3. **WHY p3**: floor statement moved from DEEPER CLAIM to right before the scenario table. "At current price, market is pricing zero mandate adoption. That's the floor." Frames how you read the numbers.
4. **REJECTED**: added framing sentence. "Every obvious quantum play has the same problem — priced for the narrative, not the mandate." Turns rejections into evidence for the winning trade.
5. **KILLS**: added time column (2026, 2027+, anytime, policy). `Next:` replaces `Watch:` for urgency.

### Key design decisions (additions)

11. **Time horizon as Phase 1 output.** Three-part extraction: catalyst date, price-in window, trade horizon (catalyst minus price-in). For a 2035 mandate, the trade horizon is NOT 10 years — market reprices when first contracts are signed (2027-2028). Gates instrument selection before any research.

12. **Time mismatch as elimination criterion #2.** Moved from #4 to #2 (after thesis contradiction). A trade with the right thesis and wrong timeframe is the second most common failure mode. >2yr eliminates standard options, <3mo eliminates shares, perp funding costs compound past 6 months.

13. **Asymmetric framing.** Dollar losses / multiple gains. Prospect theory: losses are pain denominated in dollars, gains are excitement denominated in multiples. "lose $60K" and "3x" require less processing than "-60%" and "$300K" respectively.

14. **Floor statement placement.** Moved from DEEPER CLAIM to WHY paragraph 3, right before the scenario table. Different points using the same concept: WHY version is about valuation ("market is pricing zero adoption"), DEEPER CLAIM version is about thesis robustness ("the mandate is the floor, AI overbuild is upside"). Acceptable duplication — different functions.

15. **BELIEF as insight claim.** The causal chain is Phase 1 reasoning output. The BELIEF line in the formatted output is the conclusion: what's mispriced and why. Reader knows what they're betting on without parsing derivation steps.

16. **Temporal origin in company intro.** WHEN they built the thing matters as much as WHAT they built. "Hit production the year NIST made it mandatory" is due diligence about timing risk in one sentence — they're not vaporware.

17. **Rejection framing.** One sentence before the rejection table that turns eliminations into evidence. "Every obvious quantum play has the same problem — priced for the narrative, not the mandate" makes the rejected instruments prove something about the market's mispricing, rather than just listing what we didn't pick.

## 2026-02-15: Session 4 — Instrument-Type Generalization (455 → 484 lines)

### Context
Line-level audit found the output template, formatting principles, and precision rules were overfitted to equity-long trades. The template assumed a company with MC, comparables, and shares — producing visibly templated output for Kalshi binaries, perp pairs, options, and inverse ETFs.

### What changed

**Round 11: Instrument-type adaptation table**
- Added adaptation table after the output template — 5 sections (Intro, WHY p3 anchor, Table upside, Table downside, Summary line) × 4 instrument types (Equity, Kalshi, Perp, Options)
- Keeps the equity template as reference implementation (hardest to get right, most iterated)
- Claude adapts the 5 variable sections per type; skeleton stays identical
- Why not branching templates: 3 full templates would cost ~200 lines and repeat the skeleton 3x

**Round 12: Formatting principles generalized**
- #1: "Company intro" → "Context intro"
- #2: "Company before ticker" → "Context before ticker" with examples per instrument type
- #3: WHY flow now references adaptation table for p3 anchor
- #4: Merged with old #10 (asymmetric framing) — comparables are equity-specific, framing is universal
- #5: "Comparable legend when applicable" — skip for non-equity

**Round 13: Output precision rules expanded**
- Added instrument-type math: Kalshi (contracts × payout gap), Perps (position × leverage × move), Options (contracts × intrinsic − premium)
- Rejection framing made conditional: "if rejections share a theme" rather than always forcing a unifying sentence

**Other fixes:**
- Defaults: "Eliminate" → "Deprioritize" capped-upside instruments (the PQC trade itself was shares)
- Worked examples: added Kalshi binary (Fed hold) and Hyperliquid perp pair (SOL/ETH) so not all deeper trades land on Robinhood
- Causal chains: added probability estimation and relative value thinking frames alongside supply-chain framing
- Time horizon: added short-dated example (FOMC, <1 month) alongside structural PQC example
- Stress-test: added perp (funding rate flips) and Kalshi (resolves on technicality) failure modes
- Temporal origin: expanded skip-list to include Kalshi binaries and perp pairs

### Key design decisions (additions)

18. **Adaptation table over branching templates.** The skeleton is universal (BELIEF → intro → WHY → table → KILLS → REJECTED → DEEPER CLAIM → ALT → EXECUTE). Only 5 sections vary by instrument type. A compact table (~12 lines) replaces what would be ~200 lines of branching templates. Claude already knows what Kalshi contracts and perps look like — it needs surgical overrides, not full templates.

19. **Equity template stays as reference implementation.** It's the most complex case (MC, comparables, temporal origin, supply chain reasoning) and was iterated over 10 rounds. The adaptation table tells Claude what to swap out for simpler instrument types, keeping the equity version as the quality bar.

20. **Thinking frames per thesis type.** Directional theses (who benefits/supplies/breaks), probability theses (market price vs your price), and relative theses (ratio + convergence driver) each require different Phase 1 reasoning. One frame doesn't fit all.
