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
