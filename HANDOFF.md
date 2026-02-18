# Belief Router → Platform Handoff

**Date:** Feb 17, 2026
**Context:** Frank and his OpenClaw agent spent several hours discussing how to turn the belief-router skill into a product/platform, then built the first working frontend. This doc captures the full picture so a new agent can pick up where we left off.

---

## 1. What Exists Today

### The Skill (working, shipped)
The belief-router is an open-source Claude Code skill at `github.com/rohunvora/belief-skill`. It takes natural language opinions ("everyone's on Ozempic") and routes them to specific trade expressions (HIMS calls, Kalshi contracts, Hyperliquid perps, etc.).

- Input validation (thesis extraction from text, URLs, transcripts)
- Agentic research loop (3-10 web searches, data grounding)
- 4-dimension scoring rubric (alignment, payoff shape, edge, timing forgiveness)
- 6 instrument adapters (Robinhood/Yahoo, Kalshi, Hyperliquid, Bankr, Angel/VC, DexScreener)
- Bulk mode for multi-thesis content (podcasts, articles)
- Structured output: "The Take" + trade card

### The Board (working, localhost)
A Bun.serve() web app at `board/` with React SPA + server-rendered routes. This is the frontend/platform layer.

**What's built:**
- SQLite store (`board/db.ts`) — single source of truth for calls and users, WAL mode
- `trade_data TEXT` blob pattern — queryable columns for feed/filtering, JSON blob for detail-only fields (reasoning, edge, price_ladder, derivation, etc.)
- React SPA with 6 screens: Feed, Card Detail, Leaderboard, Profile, Claim, Settings (placeholder)
- Live prices via Yahoo Finance (stocks) and Hyperliquid API (perps), 30s cache, writes back to SQLite
- Server-rendered `/t/:id` permalink with OG meta tags (Twitter/Telegram link previews)
- Server-rendered `/t/:id/card` — 1200x675 light-mode shareable card (screenshot-ready)
- API: `POST /api/takes`, `GET /api/takes`, `GET /api/users`, `GET /api/prices`
- Tailwind CSS, HMR via Bun's HTML imports
- Seed script (`board/seed.ts`) migrating sample data with validation

**Architecture after consolidation:**
Previously there were 3 overlapping systems: `scripts/db.ts` (JSONL append-only store), `scripts/card.ts` (dark-mode card generator), `scripts/track.ts` (paper trading tracker). These were deleted. Now there are 2 systems:
1. **SKILL.md + scripts/adapters/** — the routing engine (produces structured JSON)
2. **board/** — the platform (stores, renders, serves)

The skill POSTs to `board/server.ts` which writes to SQLite. No JSONL, no duplicate storage.

**What's NOT built:** Everything below the "Visual Card" node in the flywheel (see section 3).

---

## 2. The Product Vision

Frank wants to turn this into a platform where:
- People submit, share, and link structured trade theses
- Historical takes from known traders (CT, YouTube, podcasts) are backfilled with verified timestamps
- The platform is self-sustaining through network effects, not manual curation
- The belief-router skill stays open source; the frontend/platform is the business

**Distribution:** 440K followers on @frankdegods. Launch isn't the concern — designing for self-sustaining behavior after launch is.

**Model:** Open-source skill + owned frontend = WordPress model. Community improves the engine, Frank owns the platform where the network lives.

---

## 3. Architecture — The Flywheel

Mapped as a causal loop diagram. The key insight:

**Currently built (top half — linear pipeline):**
```
Thesis → Research → Scoring → Trade Card ✓
```

**Not yet built (bottom half — feedback loops):**
```
Visual Card → Sharing/Virality → New Users → Permalink/Platform
→ More Theses → Outcome Tracking → Reputation/Hit Rate
→ Quality Filter → (loops back to More Theses)
```

**Build order (each step closes the next loop):**
1. Visual card — shareable screenshot that looks good on CT ✓ (built, needs polish)
2. Permalink — each take lives at a URL with OG tags ✓ (built)
3. Outcome tracking — did the price go up or down after the call?
4. Reputation — accuracy stats surface the best callers
5. Quality filter — outcomes become the ranking algorithm

**Revenue (downstream, don't build yet):**
- Transaction revenue (execution layer, fee on trades routed through platform)
- Data API (structured thesis graph for quant funds, fintech apps)
- Pro accounts (enhanced profiles, verified badges)

---

## 4. Core Data Model

A "take" on the platform is lightweight:

### The Take
- **Caller** — who made the original claim (may never touch the platform)
- **Curator** — who found it, linked it, timestamped it, submitted it (gets credit)
- **Claim** — the directional statement, preserved as originally stated
- **Source** — link to original tweet/video/podcast with timestamp (always required)
- **Verified timestamp** — when the claim was originally made (from tweet API, video publish date, etc.)
- **Price at call** — instrument price at the moment of the original claim (historical lookup)
- **Instrument** — what ticker/token the claim maps to (optional — not every take needs auto-routing)

### Three Roles
1. **Caller** — made the original claim. May be a Twitter personality who never touches the platform.
2. **Curator** — found it, timestamped it, linked it, submitted it. Gets credit for surfacing good takes. This is the key incentive for backfilling historical takes.
3. **Verifier** — confirms accuracy of the submission. Anyone can flag. Flagged items show the flag.

### The Graph (links between takes)
- "Inspired by" — citation
- "Agrees with" — agreement
- "Contradicts" — debate

No complex weighted edges. Just links with types.

### Verification (v1: lightweight)
- Source link always required (anyone can click through and verify)
- Anyone can flag inaccurate takes (wrong timestamp, out of context, misrepresented)
- Flagged items show the flag — sunlight is the disinfectant
- No complex dispute resolution at v1

### Important design note
Don't over-engineer "take → trade" translation. Auto-mapping "HIMS is going to rip" into a specific instrument with targets is janky and error-prone. Better to preserve the original claim and let the price anchor do the work. The belief router is a tool users can optionally run ON a take, not something that runs automatically on every submission.

---

## 5. Current Database Schema

SQLite via `bun:sqlite`. Two tables:

```sql
-- Queryable columns for feed/filtering
calls (
  id TEXT PRIMARY KEY,
  thesis, ticker, direction, entry_price,     -- the claim
  caller_id, source_handle, source_url,       -- attribution
  call_type,                                  -- original/direct/derived/inspired
  status, resolve_price, resolve_pnl, ...     -- resolution
  instrument, platform,                       -- routing
  votes, watchers, comments,                  -- engagement
  current_price, price_updated_at,            -- live tracking
  trade_data TEXT                             -- JSON blob for detail fields
)

users (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  bio, twitter, avatar_url,
  verified INTEGER
)
```

**trade_data blob** contains: `source_quote`, `reasoning`, `edge`, `counter`, `price_ladder`, `alternative`, `scan_source`, `derivation`. These are detail-page-only fields that don't need to be queryable. `packTradeData()` serializes on write, `unpackRow()` deserializes on read.

---

## 6. Self-Sustaining Design Principles

### "Make the selfish action the useful action"
People aren't "contributing to the community" — they're building their own reputation. The platform benefits as a side effect.

### Structure kills spam
A structured submission with required fields (claim, source link, timestamp) is inherently harder to spam than a free text box. You can't fake a verified timestamp with a source link.

### Outcomes are the algorithm (eventually)
Don't rank by likes or followers. Once outcome tracking exists, rank by accuracy. Someone with 12 takes and 75% accuracy surfaces above someone with 500 takes and 30%. But this is NOT v1 — too much design risk in auto-resolving outcomes.

### Curator credit creates the backfill incentive
Instead of scraping 10,000 historical tweets yourself, users do it because they get credit for surfacing good takes. The best curators become valuable in their own right.

### Moltbook pattern (skill.md as distribution)
Studied moltbook.com's agent onboarding. Key insight: the skill.md file is both the product AND the distribution channel. Agents read the instructions, self-register, and start producing content autonomously. A heartbeat mechanism (periodic check-in) retains agents even when they're not actively tasked. For belief.board: the routing skill naturally produces structured JSON that flows into the platform. Every time someone uses the skill, the platform grows.

---

## 7. Seven Blindspots (from strategic review)

These were identified as gaps that need more work:

1. **How CT actually shares things** — what formats get screenshotted and posted? Need real examples. Cards must be designed for the screenshot moment, not for the website.

2. **Outcome tracking is genuinely hard** — "HIMS is going to rip" — when do you check? What counts as "ripped"? This is the hardest problem and is deferred post-v1, but the data model needs to not block it.

3. **Cold start beyond day 1** — Frank can launch it, but what makes someone come back to a thesis platform vs just following Frank on Twitter? The answer is probably "your own track record" but that requires enough resolved takes to be meaningful.

4. **Legal/regulatory** — is a platform routing people to specific instruments considered investment advice at scale? Frame as "expressions, not advice." But needs proper review.

5. **Competitive landscape** — who else is building structured thesis platforms? Not yet researched.

6. **Transaction revenue economics** — platform fee on routed trades sounds good in theory. What's the realistic take rate? What platforms even allow this? Kalshi and Hyperliquid have different affiliate structures.

7. **What makes cards screenshot-worthy** — the current card is clean but generic. CT cards that actually get shared tend to have: bold claim, price movement proof (green/red P&L), and social proof (who called it). Need research on what formats actually propagate.

---

## 8. Build Priorities

### Done
- [x] Visual card format (1200x675, light mode, claim-focused)
- [x] Permalinks with OG meta tags
- [x] SQLite store with API
- [x] React SPA (feed, detail, leaderboard, profile, claim page)
- [x] Live price tracking (Yahoo Finance + Hyperliquid)
- [x] Architecture consolidation (3 systems → 2)

### Next (closes the next flywheel loop)
- [ ] **Deploy to production URL** — currently localhost:4000 only
- [ ] **Card polish** — make screenshot-worthy for CT (research what actually gets shared)
- [ ] **Curator submission flow** — way for users to submit historical takes with source links
- [ ] **Skill → board integration** — SKILL.md outputs structured JSON, auto-POSTs to board API
- [ ] **Basic verification** — flag button + source link requirement
- [ ] **Claim page completion** — Twitter verification flow (post code to verify ownership)

### Later (requires outcome tracking)
- [ ] Outcome tracking / auto-resolution
- [ ] Performance stats / hit rates
- [ ] Reputation system (accuracy-based ranking)
- [ ] Social graph (agree/disagree/fork links between takes)

### Not building yet
- Execution layer
- Data API
- Pro accounts

---

## 9. Visual Design Notes

- **Always light mode** for cards/visuals (Frank can't read dark mode on phone)
- **No gradients, no shadows** — clean typography only (Frank's Bankr reference)
- **Mobile-first** — evaluate how everything looks and works on mobile before shipping
- **Card is 1200x675** — optimized for Twitter card dimensions
- Claim is the hero text (32-44px auto-sized), not the ticker or P&L

---

## 10. Key Files

### Skill Engine
- `SKILL.md` — the routing engine prompt
- `scripts/adapters/` — live market API connectors (robinhood, kalshi, hyperliquid, bankr, angel, dexscreener)
- `references/` — context docs loaded by SKILL.md when needed

### Board (Platform)
- `board/server.ts` — Bun.serve() entry, API routes + server-rendered card/permalink
- `board/db.ts` — SQLite store, pack/unpack for trade_data blob
- `board/types.ts` — Call, User, Comment, LeaderboardEntry, PriceLadderStep interfaces
- `board/seed.ts` — sample data migration with validation
- `board/templates/card.ts` — 1200x675 light-mode shareable card
- `board/templates/permalink.ts` — server-rendered HTML with OG meta tags
- `board/hooks/useData.ts` — React context (BoardDataProvider) for API data
- `board/pages/` — Feed, CardDetail, Leaderboard, Profile, Claim, Settings
- `board/components/CallCard.tsx` — feed card component with live price, avatar, attribution

### Meta
- `HANDOFF.md` — this file (strategic + technical handoff)
- `.claude/DECISIONS.md` — session-by-session design decisions
- `CHANGELOG.md` — version history
