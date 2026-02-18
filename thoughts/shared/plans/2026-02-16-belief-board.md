# belief.board — Product Scope

## One-liner

A public board where people post thesis-driven trade calls that auto-resolve. Your track record builds itself.

## Why this works (and why previous versions didn't stick)

Previous board concepts were **website-first**: build the board, attract users, hope they post. The Moltbook insight is that the **skill is the distribution**. The belief router already turns vibes into structured trade cards. The board is just where those cards land — a thin persistence + display + resolution layer.

The growth engine isn't the website. It's:
1. The skill producing cards as a byproduct of normal use
2. Resolved cards creating screenshot-worthy "CALLED IT" artifacts
3. Attribution pulling in sources (@marginsmall) who never signed up

---

## Core Concepts

### The Card (6 fields)

The atomic unit. Every call on the board is exactly this:

| Field | Example | Purpose |
|-------|---------|---------|
| thesis | "Google's ad monopoly is the casualty of AI search" | The hook — largest text, always visible |
| ticker | GOOG | The instrument |
| direction | Short (puts) | Long or Short |
| entry_price | $172 | Price at time of call |
| breakeven | 22% to be +EV | Quality signal — how often must you be right? |
| kills | "AI search products flop; Google pivots to AI-first ads" | Honesty — what makes this wrong |

Cards are **permanent**. Once posted, can't be edited or deleted. The board tracks price daily and resolves automatically.

### Three Roles

| Role | Who | Contribution | Leaderboard? |
|------|-----|-------------|-------------|
| **Source** | @marginsmall | Had the thesis (tweet, article, post) | Gets attribution, can "claim" later |
| **Curator** | @satoshi | Chose to route this specific thesis | Yes — tagged as `curated` |
| **Original Caller** | @alice | Formed thesis AND posted the card themselves | Yes — tagged as `original` |

The router (AI skill engine) is never credited — it's infrastructure, like a calculator.

### Resolution Types

| Type | Mechanism | Example |
|------|-----------|---------|
| **Binary** | Event date arrives, outcome known | Kalshi "Fed holds March" → YES/NO on March 19 |
| **Price target** | Daily price check, auto-resolves when target hit or stop hit | GOOG $172 entry, target $148 → resolved when price crosses |
| **Manual close** | Caller closes their position | "Closing at $155, thesis partially played out" |
| **Time expiry** | No resolution after N months → marked "expired, unresolved" | Prevents zombie cards |

### Attribution & Claiming

**Pre-signup attribution:** Cards can cite a source (`src: "tweet:@marginsmall"`) with a URL. The source's name appears on the card even though they never signed up.

**Claim flow:**
1. @marginsmall discovers their name on a winning card
2. They sign up on belief.board
3. They verify identity via X/Twitter (post a verification code, like Moltbook)
4. All cards citing their handle are linked to their profile
5. Their profile shows: "8 calls attributed · 75% accuracy" — a track record they didn't build

**Why this matters for growth:** The source has a verified public track record waiting for them. That's a pull incentive no other platform offers. You don't build your reputation — it's already built when you arrive.

---

## User Flows

### Flow 1: Make Your Call (original thesis)

```
User writes their own thesis
  → Fills in 6-field form on belief.board
  → Card posted to feed (tagged: original)
  → Daily price tracking begins
  → Resolves automatically or manually
```

### Flow 2: Route via Skill (curated thesis)

```
User pastes tweet/article into belief router skill
  → Skill researches, finds the trade, outputs 6-field card
  → User clicks "Post to Board" (new button on card output)
  → Card posted to feed (tagged: curated, src: @marginsmall)
  → Same resolution flow
```

### Flow 3: Source Claims Their Record

```
@marginsmall sees screenshot on Twitter
  → Clicks belief.board link → sees card with their name
  → "This is your take. Claim it." CTA
  → Signs up, verifies via Twitter
  → All attributed cards linked to profile
  → Profile shows auto-computed track record
```

### Flow 4: The Viral Loop

```
Card resolves → "CALLED IT +218%"
  → Screenshot-ready dark card generated
  → Share button → Twitter (with @source attribution)
  → Source sees it, followers see it
  → New users → "Make Your Call" or browse leaderboard
  → More cards → more resolutions → more screenshots → loop
```

---

## Screens

### 1. Feed (`/`)
- Header: belief.board logo · search · **Make Your Call** (green CTA) · profile
- Tabs: **Hot** (most watched) · **New** (most recent) · **Resolved** (results)
- Card previews stacked vertically:
  ```
  @marginsmall's take · routed by @satoshi · 3d ago

  "PQC mandate will create a new semiconductor category"

  LAES · Long · $3.85 · 40% to be +EV
  Dies if: NIST delays mandate past 2028
  ▲ 5 ▼ · 1.2K watching · 8 comments
  ```
- Resolved cards show green "CALLED IT +218%" badge

### 2. Card Detail (`/call/:id`)
- Full card with all 6 fields displayed prominently
- Thesis = largest text (the hook)
- Trade box: ticker, direction, entry, breakeven, context line ("you need to believe X")
- Kills box (red-tinted): specific observable conditions
- Resolution box (green, if resolved): entry date → resolve date, P&L, context
- Engagement: votes · watching · Share · Make Similar Call
- Comments section for debate

### 3. Leaderboard (`/leaderboard`)
- **This should be the most prominent page, not a sidebar**
- Time toggles: This Week · Month · All Time
- Category filter: All · Stocks · Options · Prediction Markets · Perps
- Table: # · Caller · Accuracy · P&L · Calls (original/curated) · Watchers
- Right sidebar: "Biggest Calls This Week" — the dramatic wins
- Each caller row links to their profile

### 4. Profile (`/u/:handle`)
- Handle · verified badge · bio
- Aggregate stats: Calls · Accuracy · Total P&L · Watchers
- Breakdown: "12 calls (5 original, 7 curated)"
- Stats boxes: Win Rate · Avg Return · Best Call
- Tabs: Active · Resolved · All
- For claimed sources: "8 calls attributed to your takes · 75% accuracy"

### 5. Make Your Call (`/call/new`)
- "6 fields. That's it."
- Form:
  1. Thesis (large text input) — "What do you believe?"
  2. Ticker — "GOOG, LAES, Kalshi slug..."
  3. Direction — Long / Short toggle
  4. Entry Price — current price
  5. Breakeven — "X% to be +EV"
  6. Dies if — "What kills this trade?"
- Optional: Source URL (if attributing someone else's thesis)
- **Post Call** button
- "Once posted, you can't delete it. The board tracks it automatically."

### 6. Claim Page (`/claim/:handle`)
- "X calls cite your takes. Here's your track record."
- Shows all cards attributing this handle
- "Claim these calls" → verify via Twitter → profile created
- Pre-built track record attached immediately

### 7. Screenshot Card (generated, not a page)
- Dark background, belief.board watermark
- @source CALLED IT
- +218%
- Thesis text
- Ticker · direction · entry → resolve price
- Dates
- belief.board/call/:id URL
- Optimized for Twitter card dimensions

---

## Data Model

### `calls` table (bun:sqlite)

```sql
CREATE TABLE calls (
  id          TEXT PRIMARY KEY,     -- nanoid
  thesis      TEXT NOT NULL,
  ticker      TEXT NOT NULL,
  direction   TEXT NOT NULL,        -- 'long' | 'short'
  entry_price REAL NOT NULL,
  breakeven   TEXT NOT NULL,        -- "22% to be +EV"
  kills       TEXT NOT NULL,

  -- attribution
  caller_id   TEXT NOT NULL,        -- FK to users
  source_handle TEXT,               -- @marginsmall (may not be a user yet)
  source_url  TEXT,                 -- link to original tweet/article
  call_type   TEXT NOT NULL,        -- 'original' | 'curated'

  -- resolution
  status      TEXT DEFAULT 'active', -- 'active' | 'resolved' | 'closed' | 'expired'
  resolve_price REAL,
  resolve_date TEXT,
  resolve_pnl  REAL,               -- percentage
  resolve_note TEXT,                -- "Gemini pulled 8% of search queries"

  -- metadata
  created_at  TEXT NOT NULL,
  instrument  TEXT,                 -- 'stock' | 'options' | 'kalshi' | 'perps'
  platform    TEXT,                 -- 'robinhood' | 'kalshi' | 'hyperliquid'

  -- engagement (denormalized for query speed)
  votes       INTEGER DEFAULT 0,
  watchers    INTEGER DEFAULT 0,
  comments    INTEGER DEFAULT 0
);
```

### `users` table

```sql
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  handle      TEXT UNIQUE NOT NULL,
  bio         TEXT,
  twitter     TEXT,                 -- verified twitter handle
  verified    INTEGER DEFAULT 0,
  created_at  TEXT NOT NULL,

  -- computed/cached stats (refreshed on resolution)
  total_calls INTEGER DEFAULT 0,
  accuracy    REAL,                 -- wins / resolved calls
  total_pnl   REAL,
  watchers    INTEGER DEFAULT 0
);
```

### `prices` table (daily cron tracking)

```sql
CREATE TABLE prices (
  call_id     TEXT NOT NULL,
  date        TEXT NOT NULL,
  price       REAL NOT NULL,
  PRIMARY KEY (call_id, date)
);
```

### `comments` table

```sql
CREATE TABLE comments (
  id          TEXT PRIMARY KEY,
  call_id     TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  content     TEXT NOT NULL,
  parent_id   TEXT,                 -- for threading
  created_at  TEXT NOT NULL
);
```

### `attributions` table (unclaimed source handles)

```sql
CREATE TABLE attributions (
  source_handle TEXT NOT NULL,      -- @marginsmall
  call_id       TEXT NOT NULL,
  claimed_by    TEXT,               -- FK to users.id, NULL until claimed
  PRIMARY KEY (source_handle, call_id)
);
```

---

## API Endpoints

Base: `/api/v1`

### Calls
- `POST /calls` — Create a call (6 fields + optional source)
- `GET /calls` — Feed (params: sort=hot|new|resolved, limit, offset)
- `GET /calls/:id` — Single call with full detail
- `POST /calls/:id/vote` — Upvote/downvote
- `POST /calls/:id/watch` — Watch a call
- `POST /calls/:id/close` — Manual close (caller only)

### Comments
- `POST /calls/:id/comments` — Add comment
- `GET /calls/:id/comments` — List comments

### Users
- `POST /auth/register` — Sign up
- `POST /auth/verify` — Twitter verification
- `GET /u/:handle` — Profile
- `GET /u/:handle/calls` — User's calls

### Leaderboard
- `GET /leaderboard` — Ranked callers (params: period=week|month|all, category)

### Claims
- `GET /claims/:handle` — Check if unclaimed attributions exist
- `POST /claims/:handle/claim` — Claim attributions (requires auth + twitter verify)

### Screenshots
- `GET /calls/:id/card.png` — Generated screenshot card (dark theme, Twitter-optimized)

---

## Tech Stack

Per CLAUDE.md defaults:
- **Server:** `Bun.serve()` with routes
- **Database:** `bun:sqlite`
- **Frontend:** HTML imports with React + Tailwind via Bun's bundler
- **Price tracking:** Daily cron job hitting Yahoo Finance / Kalshi / Hyperliquid APIs (same adapters the skill already uses)
- **Screenshot generation:** Server-side HTML → PNG (satori or playwright)
- **Auth:** Twitter OAuth for verification, session tokens

No new infrastructure. The board reuses the same market APIs the skill already calls.

---

## Resolution Cron

Runs daily (or more frequently for binary events):

```
For each active call:
  1. Fetch current price via platform adapter
  2. Store in prices table
  3. Check resolution conditions:
     - Binary: event date passed? → resolve YES/NO
     - Price: target hit or stop hit? → resolve with P&L
     - Time: >6 months with no resolution? → mark expired
  4. If resolved:
     - Compute P&L percentage
     - Update call status
     - Recompute caller's aggregate stats
     - Generate screenshot card
     - (Optional) notify caller + watchers
```

---

## Phases

### Phase 1: Core board (MVP)
- [ ] Calls CRUD + 6-field form
- [ ] Feed with Hot/New/Resolved tabs
- [ ] Basic user auth (twitter verify)
- [ ] Daily price tracking cron
- [ ] Auto-resolution for price targets
- [ ] Leaderboard (accuracy + P&L)
- [ ] Call detail page with comments

### Phase 2: Attribution + virality
- [ ] Source attribution on cards (via @handle)
- [ ] Claim flow for unclaimed sources
- [ ] Screenshot card generation (dark theme PNG)
- [ ] Share button with pre-formatted tweet
- [ ] original/curated tagging on leaderboard

### Phase 3: Skill integration
- [ ] "Post to Board" button on skill output cards
- [ ] Auto-populate 6 fields from skill card data
- [ ] Sync with local beliefs.jsonl (bidirectional or board-primary)
- [ ] Public skill.md for other Claude users to self-onboard (Moltbook pattern)

### Phase 4: Growth mechanics
- [ ] "Biggest Calls This Week" sidebar
- [ ] Profile pages with pre-built track records
- [ ] Category filters on leaderboard
- [ ] Time window toggles (Week/Month/All)
- [ ] RSS/webhook for new resolutions
- [ ] Embed cards on external sites

---

## What This Is NOT

- Not a trading platform — no execution, no wallets, no money movement
- Not financial advice — "expressions, not advice" disclaimer on every card
- Not a copy-trading service — no auto-follow, no position mirroring
- Not a charting tool — thesis-first, not chart-first
- Not a prediction market — you don't bet against each other, you bet against the market

---

## Open Questions

- **Bet size display:** Show $100K default P&L scenarios, or just percentage? Percentage is universal, dollar amounts feel more real.
- **Resolution disputes:** What if auto-resolve gets the wrong price? Need a dispute/correction mechanism?
- **Private calls:** Should callers be able to post privately (tracked but not public) until they build confidence? Or is everything-public the whole point?
- **API for agents:** Should Phase 3 include a Moltbook-style API where any AI agent can post calls via bearer token? This is the scale play.
- **Monetization:** Premium features (private calls, advanced analytics, API access)? Or keep it free and monetize via the developer platform (identity/auth for other apps)?
