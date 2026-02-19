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

## 2026-02-15: Session 5 — Shape Classification + Metric-Based Ranking (484 → ~480 lines)

### Context
Architectural critique identified the root cause of instrument-class bias: one framework (causal chains) feeding into one metric (raw convexity) defaults to equities. Binary theses forced through causal chains lose information. Relative theses expressed as directional trades lose half the thesis.

Three abstractions identified:
1. **Thesis shape** — different theses have different shapes, and the shape determines which instrument class is appropriate
2. **Two evaluation modes** — observable probability (prediction markets give you the price) vs estimated probability (you guess both likelihood and magnitude)
3. **Ranking metric is wrong** — raw convexity ignores thesis beta and time cost

### What changed

**Ranking metric replaced:**
- Old: implicit preference hierarchy (options > perps > Kalshi > stocks) + raw convexity
- New: `thesis beta × convexity / time cost` — purest expression, most leverage, lowest carry
- Naturally surfaces the right instrument: Kalshi for binary events, options for short-dated catalysts, shares for structural multi-year, perps for crypto directional, pairs for relative value

**Phase 1 restructured — shape classification added:**
- New section before deeper claim extraction: classify thesis shape
- Five shapes: binary event, mispriced company, sector/theme, relative value, vulnerability
- Each shape maps to a natural instrument home and evaluation mode
- Thinking frames (directional/probability/relative from session 4) preserved but repositioned under "Think in the Frame That Fits"
- Gate now requires thesis shape + deeper claim + time horizon (was just deeper claim + horizon)
- Time horizon section now explicitly connects to time cost (metric denominator)
- Added worked example: gold thesis → HL GOLD-PERP at 3x (perps for non-crypto assets)

**Phase 2 — prediction market check added:**
- New research step: for any thesis with a date or binary resolution, search Kalshi for a direct contract
- Feeds into Phase 3 Step 0

**Phase 3 fully restructured — shape→optimize→cross-check replaces generate→eliminate:**
- Old flow: generate 4-8 candidates → eliminate by sequential criteria → final comparison → stress test
- New flow: Step 0 (binary check) → Step 1 (best-in-class within shape) → Step 2 (cross-check across classes) → Step 3 (stress-test)
- Step 0 (binary check): does a prediction market contract exist on literally this event? If yes, it must be explicitly beaten
- Step 1 (best-in-class): find the best instrument within the natural class for the thesis shape, scored by the metric
- Step 2 (cross-check): compare home pick against best from at least one other class on normalized metric terms — this is where objectivity lives
- Step 3 (stress-test): preserved from previous version
- Elimination criteria redistributed: thesis beta, convexity, time cost absorbed into metric; thesis contradiction, liquidity, priced-in, time mismatch become binary disqualifiers that override the metric
- Platform guide table moved from Phase 3 into Phase 1 shape classification (it's really about which platforms to consider given the shape)
- Two worked cross-check examples added: Fed/Kalshi vs TLT puts, and SEALSQ shares vs LEAPS

**Phase 5 — ALT updated:**
- ALT now explicitly comes from a different instrument class (the cross-check loser)
- States the metric tradeoff ("Higher convexity but 35% thesis beta" or "Zero carry but capped at 1.2x")

**Removed:**
- Hardcoded instrument preference in Defaults
- "Deprioritize capped-upside instruments" — the metric handles this
- Phase 3 Step 1 "generate 4-8 candidates" — replaced by shape-directed search
- Phase 3 Step 2 verbose elimination criteria (6 numbered items with sub-bullets) — redistributed to metric components + compact disqualifiers
- Phase 3 Step 3 narrative comparison table — replaced by metric comparison
- Thesis type → platform guide table in Phase 3 (moved to Phase 1)

### Key design decisions (additions)

21. **`thesis beta × convexity / time cost` as the universal ranking metric.** Replaces implicit preference hierarchy and raw convexity ranking. The metric naturally surfaces the right instrument for each thesis shape without special cases. A Kalshi binary at 12x with 100% thesis beta and zero carry beats a 5x option with 35% thesis beta — the math makes this obvious without needing a rule.

22. **Shape classification as Phase 1 entry point.** The shape determines the evaluation mode (observable vs estimated probability), the natural instrument class, and the reasoning frame. Binary theses go through probability analysis, not causal chains. Relative theses go through ratio analysis. The causal chain is still valuable — it's the right tool for directional/sector theses — but it's no longer the only tool.

23. **Binary check (Step 0) before all other instrument search.** When a prediction market contract exists on the exact thesis, it's the highest-thesis-beta instrument possible (~100%) with zero carry. Everything else must explicitly beat it. This prevents the skill from converting mode-1-eligible theses (observable probability) into mode-2 problems (estimated probability), which adds noise.

24. **Cross-check as the de-biasing mechanism.** Without cross-check, shape classification would just route to the natural home and stop. The cross-check forces an explicit comparison between the home pick and the best from another class, on the same metric. This is where the skill catches cases where a non-obvious instrument class actually wins (e.g., perps beating shares for a gold thesis because of leverage at low funding cost).

25. **Disqualifiers separate from the metric.** Thesis contradiction, liquidity failure, already-priced-in, and time mismatch are binary gates, not gradients. An illiquid instrument with a perfect metric score is still untradeable. Keeping these as hard disqualifiers prevents the metric from accidentally surfacing instruments that can't be executed.

## 2026-02-17: Session 6 — Board Frontend + Architecture Consolidation

### Context
Merged `belief-board-v4` branch (full React app with 7 screens, live prices, Tailwind, HMR) from another machine. Collapsed 3 overlapping systems (JSONL store, dark card generator, paper tracker) into SQLite-backed board as single source of truth.

### What we built
- **board/db.ts** — SQLite store with `trade_data TEXT` blob pattern. Queryable columns for feed/filtering (thesis, ticker, direction, entry_price, status, caller_id), JSON blob for detail-only fields (reasoning, edge, price_ladder, derivation, source_quote, alternative, counter, scan_source). `packTradeData()` / `unpackRow()` for roundtripping.
- **board/server.ts** — Rewired to SQLite. API routes in `routes` object (GET/POST /api/takes, GET /api/users, GET /api/prices), SPA catch-all via HTML import (`"/*": index`), server-rendered routes in `fetch` handler (/t/:id → permalink, /t/:id/card → shareable card). Live price fetching from Yahoo Finance + Hyperliquid with 30s cache.
- **board/seed.ts** — Migrates mock-data.ts into SQLite with full validation (count, date range, sample records, blob roundtrip).
- **board/hooks/useData.ts** — BoardDataProvider React context replacing all mock-data imports. Fetches /api/takes + /api/users once, provides getCallById, getUserById, getUserByHandle, getCallsByUser, getCallsBySourceHandle, refetch.
- **board/templates/card.ts** — 1200x675 light-mode shareable card. Auto-sized font (28-44px by claim length). Shows PnL if current_price exists. Brand: "belief.board".
- **board/templates/permalink.ts** — Server-rendered HTML with OG meta tags (og:title, og:description, twitter:card). Mobile-first (max-width: 640px). Shows source quote + reasoning if available.
- Updated all 6 React pages to use BoardDataProvider instead of mock-data imports.
- Deleted `scripts/db.ts`, `scripts/card.ts`, `scripts/track.ts`, `data/beliefs.jsonl`.

### Key architecture decision
**trade_data blob pattern.** Detail fields (reasoning, edge, price_ladder, derivation, source_quote, alternative, counter, scan_source) are serialized into a single JSON TEXT column. The feed only needs thesis, ticker, direction, entry_price, status — those stay as queryable columns. Detail fields are only needed on the permalink/detail page. This keeps the schema lean and avoids 8+ nullable columns that would mostly be NULL.

### Bug fixed
**White screen after React refactor.** The SPA catch-all in the `fetch` handler was intercepting Bun's JS/CSS bundle requests, returning index.html for asset URLs. Fix: moved `"/*": index` back into `routes` object (Bun handles bundling for routes, not fetch), kept `fetch` handler only for /t/:id server-rendered routes.

### Strategic context gathered
- Researched moltbook.com's agent onboarding pattern (skill.md as distribution channel)
- Discussed self-sustaining flywheel design with Frank
- Identified 7 blindspots (outcome tracking, CT sharing patterns, cold start, legal, competitive, revenue economics, card design)
- Defined 3 roles: Caller, Curator, Verifier
- Defined graph model: links between takes (inspired by, agrees with, contradicts)
- Updated HANDOFF.md with full technical + strategic picture

### Known issues
- Board runs on localhost:4000 only — not deployed yet
- Comments table not in SQLite yet (hardcoded to empty array)
- mock-data.ts still exists but nothing imports it (only used by seed.ts for migration)
- Card design needs CT research to make screenshot-worthy
- No curator submission flow yet
- No skill → board API integration yet (skill doesn't auto-POST to board)

## 2026-02-18: Session 7 — North Star, Data Model Redesign, Strategic Vision

### Context
Resumed from time-aware routing / historical adapters session. Stepped back from tactical SKILL.md edits to define the project's north star and long-term vision. Identified fundamental design tensions that required resolving before further implementation.

### North Star
**"Every belief gets a receipt."** The database of structured, attributed belief-to-instrument translations is the asset. The skill is the capture mechanism. The board is the display layer. The database is what compounds.

### Strategic Vision
Beliefs precede capital flows. The database captures what people believe is about to happen, translated into specific instruments with reasoning — not just "bullish/bearish" sentiment. This is a categorically different data product from existing social sentiment providers (Stocktwits, LunarCrush, Social Market Analytics) because each entry is instrument-specific, attributed, reasoned, and timestamped.

**Growth loop:** Card sharing → installs → routings → database grows → track records emerge → status game → more routings. The card is the viral unit.

**Gate milestones:** (1) Capture critical mass (10K routings, 100+ callers) → (2) Outcome depth (6+ months history) → (3) Real-time signal value (emerging consensus visible) → (4) Data moat (replication takes years).

**Data buyers:** Crypto funds (first, fastest), quant alt-data teams (bigger checks), prediction market platforms (partnerships), broker-dealers (largest, longest).

### The Two-Layer Data Model

Root problem identified: the skill was designed as a ROUTING tool (transform input to find best trade) but is being repurposed as a DATA COLLECTION tool (preserve input faithfully). These have opposite requirements. The deeper claim feature actively corrupts the data it's supposed to collect — it puts words in people's mouths.

**Resolution: every entry has two layers, never conflated.**

- **The Call** — author's actual signal, preserved faithfully: source_quote, author_thesis, author_ticker (nullable), conviction, conditions, source_date.
- **The Routing** — skill's analysis on top: routed_ticker, derivation chain, reasoning, edge, counter, etc.

The attribution tier (direct/derived/inspired) becomes structural, not decorative. It determines what gets scored in track records:
- Direct (author named ticker) → score author on instrument performance
- Derived (author had thesis, skill found instrument) → score author on thesis direction, score skill on instrument selection
- Inspired (observation only) → too many steps to score reliably

### Cited Evidence Model

For bulk scans (podcasts, articles), each card must trace to SPECIFIC source segments with timestamps/paragraph refs — not "from the All-In podcast" but "minute 12 + minute 45 + minute 67."

Derivation chain format evolves: each step optionally links to a source segment. Steps with segments = evidence (cited). Steps without = inference (skill's contribution). The boundary between "what someone said" and "what the skill concluded" is always visible in the data.

### Blindspots Identified

Six structural blindspots found — all stemming from the routing-vs-collection tension:

1. **Deeper claim vs accurate extraction** — skill reframes the author's claim. Resolved: two layers.
2. **Narrative compression** — qualifications stripped ("IF FSD works AND..."). Resolved: `conditions` field.
3. **Conviction flattening** — "maybe 20%" scored same as "I am CERTAIN." Resolved: explicit conviction field.
4. **Forced singularity** — smart people hedge, skill picks one side. Resolved: `author_ticker` preserved even if skill routes elsewhere.
5. **Routing error vs thesis error** — bad outcome, whose fault? Resolved: attribution tier separates scoring.
6. **Processing time vs belief time** — entry price uses wrong date. Resolved: `source_date` extracted, `entry_price` = price at source_date.

### Key design decisions (additions)

26. **"Every belief gets a receipt" as north star.** The database is the asset. The skill and board are infrastructure for filling and displaying it. All feature decisions evaluated against: does this put more receipts in the database (P0), increase capture velocity (P1), make the database appreciate (P2), or make data sellable (P3)?

27. **Two-layer data model (Call vs Routing).** Never conflate the author's signal with the skill's analysis. The Call layer is preserved faithfully. The Routing layer is the skill's editorial contribution. Both stored, clearly labeled, separately scorable. This resolves all six identified blindspots.

28. **Attribution tier as structural concept.** Direct/derived/inspired determines what gets scored in track records, not just how the card looks. Direct calls score the author. Derived calls score both (author on direction, skill on instrument). Inspired calls are too many steps removed for reliable scoring.

29. **Cited evidence with segment references.** Derivation chain steps link to specific source segments (timestamps, paragraphs). Evidence steps are cited. Inference steps are unlabeled. The database is auditable — anyone can verify the extraction by clicking through to the source moment.

30. **Conviction and conditions as first-class fields.** Conviction (high/medium/low/speculative) from language intensity. Conditions (nullable) preserve qualifications. These prevent flattening hedged or low-conviction takes into binary calls, which would produce unfair track records at scale.

31. **entry_price = price at source_date, not processing date.** Outcomes must be measured from when the belief was expressed, not when the skill processed it. Historical price adapters (already built) provide this.

32. **Card leads with author's voice.** The source quote is the headline, not the ticker. Three visual variants by attribution tier. The derivation chain is the interesting part that makes people stop scrolling. The ticker is the payoff, not the lead.

33. **Skill produces two outputs with different purposes.** The Take (streamed reply) is the deep analysis for the user who asked — rubric, cross-check, scenarios, kills. The Card (POST to board) is the lean receipt for the database and sharing — both layers, essential fields only. These serve different audiences and should be optimized independently.

### Schema changes planned
- Queryable columns: source_handle, source_date, call_type, routed_ticker, routed_direction, entry_price, conviction, status, caller_id
- Trade data blob: source_quote, source_url, author_thesis, author_ticker, author_direction, conditions, segments (with timestamps), derivation (with segment refs), reasoning, edge, counter, kills, price_ladder, alternative

### Design spec
Full spec saved to `thoughts/shared/plans/2026-02-18-belief-board-vision.md`. Covers: north star, decision principles, growth loop, gate milestones, data buyer profiles, two-layer model, cited evidence, schema, card designs (three tiers), skill output contract, blindspot resolutions, and work prioritization.

### What's next
1. ~~Implement schema redesign in board/db.ts~~ (done, session 8)
2. ~~Update SKILL.md: faithful extraction step + cited evidence derivation chain~~ (done, session 8)
3. ~~Redesign card templates for three attribution tiers~~ (done, session 8)
4. Deploy board publicly
5. Publish skill to GitHub for distribution

## 2026-02-18: Session 8 — Two-Layer Implementation (SKILL.md + Schema + UI)

### Context
Executed the full two-layer data model designed in session 7. Three workstreams: SKILL.md prompt changes, database schema + templates, and React SPA updates.

### What we built

**SKILL.md (632 → 706 lines):**
- Faithful extraction as default first step — extract author's signal before any routing analysis
- `source_date` extraction in Input Validation (price at belief time, not processing time)
- Research section reordered: extraction → research → routing
- Deeper Claim reframed as Layer 2 (skill's editorial contribution, after faithful extraction)
- Derivation chain rewritten for segment-based format with evidence/inference distinction
- Output Part 2 updated: derivation chain steps with segment references
- Output Part 4 (POST payload): all new fields in the board submission contract
- Bulk Mode Phase 1: faithful extraction + segments for podcast/article scans

**Database schema (board/db.ts, board/types.ts):**
- New interfaces: `Segment`, `DerivationStep`, updated `DerivationChain`
- New queryable columns: `source_date`, `conviction` (auto-migrated via ALTER TABLE)
- New blob fields: `author_thesis`, `author_ticker`, `author_direction`, `conditions`, `segments`
- `extractDerivationDetail()` — returns raw DerivationStep objects for evidence/inference UI
- `extractChainDisplay()` updated to handle segment-based v2 format alongside legacy formats
- POST endpoint accepts `routed_ticker`/`routed_direction` aliases
- Mock data updated with full two-layer fields on all 6 calls (including segment-based DELL derivation chain with 2 segments + 4 steps)

**Server-rendered templates:**
- `card.ts` — three-tier shareable card: quote-forward design, conviction badge, attribution footer by tier, derivation chain steps for routed calls
- `permalink.ts` — full two-layer display: "The Call" section (source_quote, author_thesis, conditions), derivation chain with blue EVIDENCE / purple INFERENCE badges + speaker citations, price ladder, dual dates ("Said X · Routed Y"), tier labels

**React SPA (feed + detail):**
- Feed card (CallCard.tsx): source_date for timeAgo, conviction badge (colored by level), → arrow on ticker for derived/inspired
- Detail view (CardDetail.tsx): "The Call" section with author's preserved signal, evidence/inference markers in derivation chain using extractDerivationDetail() with fallback to greentext for legacy data, conviction badge, dual dates, tier labels with color coding

### Key technical decisions

34. **Auto-migration via PRAGMA table_info.** New columns added with ALTER TABLE only if they don't exist. Re-runnable, no migration files needed. Works because SQLite columns are always nullable when added via ALTER.

35. **extractDerivationDetail() separate from extractChainDisplay().** The chain display function returns flat strings (for feed cards and legacy data). The detail function returns typed DerivationStep objects (for detail view evidence/inference markers). Two functions, two audiences, shared data path.

36. **Greentext preserved as fallback.** The `> step` display in feed cards uses extractChainDisplay() which normalizes all formats to string[]. Evidence/inference markers only appear in the detail view where extractDerivationDetail() returns structured data. Legacy data gets greentext everywhere.

37. **routed_ticker/routed_direction as POST aliases.** The SKILL.md POST payload uses `routed_ticker` (semantic), but legacy code uses `ticker`. Server accepts both, preferring the routed_ prefix. No breaking change.

### Known issues
- Board still localhost:4000 only — not deployed
- Browser extension disconnected during visual review — changes verified via API + type checking
- Comments table still empty (hardcoded [])
- No skill → board API integration yet

### What's next
1. Deploy board publicly
2. Publish skill to GitHub for distribution
3. Visual review of React SPA in browser (feed cards + detail view)
4. Build curator submission flow (anyone can submit a routing)

## 2026-02-18: Session 9 — Taxonomy Cleanup (Backstage → Frontstage)

### Context
Audit identified that every taxonomy in the codebase was designed for Claude's internal reasoning and shipped directly to the reader. Applied DDD backstage/frontstage pattern and three diagnostic tests (MECE, behavioral, rule of three) to every taxonomy. Found HIGH-priority jargon issues across attribution tiers, conviction, section headers, and step markers.

### Decisions made

**38. Attribution tiers collapsed from 4 to 3.** Removed "inspired" tier — merged into "derived". The distinction between "derived" (market-specific claim, no ticker) and "inspired" (cultural observation only) failed all three tests: not MECE (both route differently from author), no behavioral difference (same display, same scoring), and no real cases where distinction changed outcome. `call_type` is now `"original" | "direct" | "derived"`.

**39. Conviction display removed.** Kept in data model for analysis, stopped displaying as a badge. The ordinal scale (high/medium/low/speculative) was more subjective than useful — it asks Claude to gauge language intensity, which is unreliable. The source quote already carries the tone. Reader can assess conviction themselves.

**40. Leap distance = visual chain pattern, not a computed number.** Explored 3 computed metrics (inference ratio, absolute inference count, thesis-only inference count) — all failed on 4/12 test samples. Explored field comparison (author_ticker vs ticker) — too binary. Final answer: color-code evidence/inference steps on feed cards. Blue `>` for cited steps (linked to source segments), amber `>` for inferred steps (skill's contribution). The visual weight of colors communicates the leap at a glance. The reader interprets the pattern, not a formula.

**41. Label renames across all UI surfaces.**
- "The Call" → "What They Said" (section header for author's preserved signal)
- "Derivation Chain" → "Reasoning" (section header for chain steps)
- "evidence" → "cited" (step marker badge)
- "inference" → "inferred" (step marker badge)
- "routed by belief.board" → "via belief.board" (attribution line)
- "Chose over:" → "Instead of:" (alternatives considered)
- "routed from thesis" → "AI-routed" (call_type badge on detail page)
- "Said X · Routed Y" → "Said X · Added Y" (dual date display)
- "bg-purple" inference markers → "bg-amber" (consistent with feed card amber)

### Files changed
- `board/types.ts` — removed "inspired" from call_type union
- `board/mock-data.ts` — SPGI call_type "inspired" → "derived"
- `board/components/CallCard.tsx` — removed conviction badge, removed "inspired" ref, added color-coded chain steps (cited=blue, inferred=amber) using extractDerivationDetail()
- `board/pages/CardDetail.tsx` — removed conviction badge, removed "inspired" case, renamed all section headers and step markers
- `board/templates/card.ts` — removed conviction badge + CSS, removed "inspired" from getAttribution(), updated attribution text
- `board/templates/permalink.ts` — removed conviction badge + CSS, removed "inspired" from tierLabel(), renamed all headers/markers
- `board/templates/for-agents.ts` — updated call_type enum
- `SKILL.md` — merged "inspired" row into "derived" in attribution tier table, updated field references
- `tests/leap-distance-samples.ts` — 12 test samples created for metric evaluation (used to prove step-counting doesn't work)

### Known issues
- Legacy chain format (5 of 6 mock calls) shows uniform gray `>` on feed — only segment-based v2 format (DELL) shows color coding. This is correct behavior — legacy data doesn't have segment links.
- Conviction data still stored in DB, just not displayed. Available for future analysis.
- `chose_over` field name in DerivationChain interface not renamed (internal data, not user-facing)

## 2026-02-18: Session 10 — Reasoning chain anti-templating + inline tickers

### What we changed

**SKILL.md Derivation Chain rewrite:**
- Removed "last step must contain the ticker" rule — was forcing every chain into a reveal-at-the-end pattern
- Rewrote all 3 examples with distinct structures: lead with company, two threads converge, counterfactual
- Added explicit Anti-patterns section showing the templated skeleton to avoid
- Updated rules to encourage structural variety

**CallCard.tsx inline ticker styling:**
- Ticker symbols in chain step text are auto-detected and rendered as clickable badges
- Card's own ticker gets directional coloring (green for long, red for short)
- Other tickers get neutral gray styling
- All clickable to `#/?ticker=TICKER` (existing filter)
- Blocklist of ~40 common financial abbreviations (CEO, IPO, ETF, AI, etc.) prevents false positives

### Decisions made

**42. Reasoning chains were obviously templated.** User tested via Telegram (YouTube video, 4 theses, rating 2/5). All 4 chains followed identical `[macro] → [sector] → [industry] → [TICKER down X%]` skeleton. Root cause analysis identified 5 structural issues: ticker-last rule, linear format, research-as-reasoning, "down X% from highs" verbal tic, uniform length. Fixed with 3 changes: removed ticker-last rule, added anti-patterns section, updated examples to show 3 distinct structures.

**43. Color-coded chain steps reverted to uniform gray.** User said blue/amber `>` prefixes "don't accomplish much" at feed-scan speed. Kept cited/inferred distinction only on the detail page. Feed cards use uniform gray `>` prefix.

**44. Inline ticker badges reverted.** Regex heuristic with blocklist was the wrong abstraction — the skill already knows which words are tickers at generation time. Frontend guessing creates false positives (PQC) and misses mixed-case (IonQ). Correct fix: skill declares tickers in step data (like `segment` index), frontend renders them. Parked for now.

**45. Templated output caused by prompt contradictions, not chain section.** Deeper diagnosis found the chain section's anti-patterns were being overridden by three other SKILL.md sections:
- Line 65 "Every thesis has a surface/deeper claim" forced binary decomposition → became output labels "Surface: / Deeper:"
- Lines 697+706 prescribed `thesis → sector → specific name → why not alternatives` — the exact skeleton the anti-patterns forbid
- Lines 460-465 numbered required elements list → became sequential template when compressed for bulk
Fix: (a) "Every" → "Most", dropped Surface/Deeper naming, (b) skeleton replaced with pointer to Derivation Chain section as single source of truth, (c) numbered list → unordered set with permission to drop elements.

### Files changed
- `SKILL.md` — three structural fixes: Deeper Claim wording (line 65), Scan Output skeleton removed (lines 697+706), Required Elements un-numbered (lines 460-465); plus earlier Derivation Chain rewrite (examples, anti-patterns, rules)
- `board/components/CallCard.tsx` — reverted inline ticker badges (was regex blocklist approach)
- `.gitignore` — added .vercel

### Known issues
- Output length problem from Telegram test (rating 2/5) not yet addressed — user wants shorter output that links to the board site
- Bulk mode speed (4 sequential deep research phases) not yet optimized
- Inline ticker badges parked — needs skill-side `tickers` field in DerivationStep before frontend can render them

## 2026-02-18: Session 11 — Chain self-test + chain-sketch-before-research

### What we changed

**Self-test paragraph added to SKILL.md Derivation Chain section:**
- Draft the chain BEFORE research. If you can't connect source quote to trade in 2-5 plain steps without looking anything up, the routing has a problem research won't fix.
- Test: remove looked-up facts from steps. If chain still holds, they were padding. If chain breaks, a reasoning gap was filled with research — fix routing, not chain.
- Sketch targets research: steps needing grounding tell you what to search. Steps that hold without data need no searches.

**Research section restructured:**
- New "First:" instruction at top of Research section pointing to chain sketch as prerequisite.
- Flow is now: extraction → deeper claim → chain sketch → self-test → research → scoring.

**Em dash ban:**
- Added "no em dashes" to chain writing rules in both SKILL.md and references/derivation-chain.md.
- Cleaned all em dashes from chain example step text in both files.
- Cleaned format template `chose_over` field.

**references/derivation-chain.md synced:**
- All example step text cleaned of em dashes (periods instead).
- Self-test section added.
- Opening line updated to "Draft the chain BEFORE research."
- Writing rules updated with em dash ban.

### Decisions made

**46. Chain as pre-flight check, not post-hoc documentation.** The chain is the litmus test for routing quality. If it needs research facts to connect source to trade, something upstream is wrong. Drafting it before research is free (no tool calls). Doing it after research is expensive (already spent 3-10 searches). Fail fast principle.

**47. Em dashes banned from chain output.** Every chain step used the same "X — Y" pattern, creating another templating signal. Banned in rules, cleaned from all examples. One clean thought per step instead.

### Files changed
- `SKILL.md` — self-test subsection, Research "First:" instruction, em dash ban in rules, em dashes cleaned from format template and all chain examples
- `references/derivation-chain.md` — full sync: self-test section, em dash ban, cleaned examples, updated opening
