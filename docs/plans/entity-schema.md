# Entity Schema v1

Status: DRAFT - pending approval before implementation.

## Design constraints

1. No scoring, resolution, or track record fields. Collect facts at creation time. Scoring is a query layer added later.
2. Source URL is nullable. 3 of 18 existing calls have no URL.
3. Quote-to-Call is many-to-many via join table.
4. `users` table is for product users only. Source authors get their own table.
5. Author lives on calls, not sources. A source is a content container (podcast, video, tweet). The author is whose thesis the call routes.
6. Prediction markets and perps are tickers with extra nullable fields (expiry, funding snapshot, underlying event).
7. Timestamps are explicit: when the author said it, when the price was captured, when it was processed.

---

## Tables

### users
Product users only. People who run the skill and submit calls.

```sql
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  handle        TEXT NOT NULL UNIQUE,
  bio           TEXT,
  avatar_url    TEXT,
  twitter       TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Current data: 1 row (satoshi). The 6 author rows (chamath, akshaybd, etc.) migrate to `authors`.

---

### authors
People whose claims get routed. They may never sign up.

```sql
CREATE TABLE authors (
  id            TEXT PRIMARY KEY,
  handle        TEXT NOT NULL UNIQUE,
  name          TEXT,                -- display name ("Chamath Palihapitiya")
  bio           TEXT,
  avatar_url    TEXT,
  twitter_url   TEXT,                -- full URL or handle
  youtube_url   TEXT,
  platform      TEXT,                -- primary platform: 'twitter', 'youtube', 'substack'
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Current data: 7 rows after migration (chamath, akshaybd, marginsmall, martinshkreli, nicbstme, youtube_creator, threadguy).

---

### sources
A specific piece of content that was processed. One tweet, one video, one article.

```sql
CREATE TABLE sources (
  id            TEXT PRIMARY KEY,
  url           TEXT,                -- NULLABLE: Shkreli and marginsmall calls have none
  title         TEXT,                -- "All-In Podcast (Feb 2026)", "@chamath tweet (Feb 12, 2026)"
  platform      TEXT,                -- 'twitter', 'youtube', 'substack', 'podcast', 'other'
  published_at  TEXT,                -- when the content was published/posted
  submitted_by  TEXT NOT NULL REFERENCES users(id),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

No author_id here. A podcast episode has multiple speakers. The author relationship lives on calls.

Current data after migration: ~13 rows.

Source grouping logic for migration:
- Calls sharing the same `source_url` -> same source (YouTube video = 1 source, 4 calls)
- Calls with no URL -> group by `(source_handle, scan_source)` text match
  - "Martin Shkreli (Feb 2026)" -> 1 source, 2 calls (EVR + IONQ)
  - "marginsmall (Feb 2026)" -> 1 source, 1 call (LAES)

---

### tickers
Any instrument you can take a position in.

```sql
CREATE TABLE tickers (
  id                TEXT PRIMARY KEY,
  symbol            TEXT NOT NULL,
  name              TEXT,                -- "Constellation Energy", "Fed Rate Cut March NO"
  instrument_type   TEXT NOT NULL,       -- 'stock', 'etf', 'perps', 'prediction'
  platform          TEXT NOT NULL,       -- 'robinhood', 'hyperliquid', 'kalshi', 'polymarket'
  sector            TEXT,
  logo_url          TEXT,
  expires_at        TEXT,                -- prediction markets only
  underlying_event  TEXT,                -- prediction markets: "Will the Fed cut at March FOMC?"
  UNIQUE(symbol, platform)
);
```

Current data: 15 rows (all stocks, platform = 'robinhood').

Why `platform` is NOT NULL: avoids SQLite NULL != NULL issue in the UNIQUE constraint. Stocks default to 'robinhood'. Perps are 'hyperliquid'. Prediction markets are 'kalshi' or 'polymarket'. Every ticker lives on exactly one platform.

---

### quotes
Verbatim extractions from source material. First-class, queryable, linkable.

```sql
CREATE TABLE quotes (
  id            TEXT PRIMARY KEY,
  source_id     TEXT NOT NULL REFERENCES sources(id),
  text          TEXT NOT NULL,         -- the verbatim quote
  speaker       TEXT,                  -- who said it (for multi-speaker sources)
  timestamp     TEXT,                  -- "42:15" for video/audio
  paragraph_ref TEXT,                  -- for articles
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Current data: ~20 rows after extracting segments from trade_data blobs.

Example: The All-In podcast DELL call has 2 segments (chamath at 42:15, friedberg at 43:30). Each becomes a quote row, both linked to the same source.

---

### call_quotes
Many-to-many join. A call can cite multiple quotes. A quote can support multiple calls.

```sql
CREATE TABLE call_quotes (
  call_id   TEXT NOT NULL REFERENCES calls(id),
  quote_id  TEXT NOT NULL REFERENCES quotes(id),
  PRIMARY KEY (call_id, quote_id)
);
```

---

### calls
One routed claim. The core entity that links everything together.

```sql
CREATE TABLE calls (
  id                TEXT PRIMARY KEY,

  -- Entity relationships
  source_id         TEXT REFERENCES sources(id),
  ticker_id         TEXT NOT NULL REFERENCES tickers(id),
  author_id         TEXT NOT NULL REFERENCES authors(id),
  submitted_by      TEXT NOT NULL REFERENCES users(id),

  -- Layer 1: author's signal
  author_thesis     TEXT,              -- what they claimed, in their words
  author_ticker     TEXT,              -- ticker they mentioned, if any
  author_direction  TEXT,              -- their stated direction, if any
  call_type         TEXT NOT NULL DEFAULT 'derived',  -- 'original', 'direct', 'derived'
  conviction        TEXT,              -- 'high', 'medium', 'low', 'speculative'

  -- Layer 2: skill's routing
  thesis            TEXT NOT NULL,     -- the routed thesis
  ticker            TEXT NOT NULL,     -- symbol string (denormalized for display)
  direction         TEXT NOT NULL,     -- 'long' or 'short'
  entry_price       REAL NOT NULL,
  instrument        TEXT,              -- 'stock', 'options', 'perps', 'prediction'
  platform          TEXT,              -- 'robinhood', 'hyperliquid', 'kalshi', 'polymarket'
  breakeven         TEXT,
  kills             TEXT,

  -- Derivation & reasoning (JSON blob)
  trade_data        TEXT,              -- reasoning, edge, counter, price_ladder, derivation, alternative

  -- Timestamps
  source_date       TEXT,              -- when the author said it
  price_captured_at TEXT,              -- when entry_price was fetched
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),

  -- Status (minimal, no scoring)
  status            TEXT NOT NULL DEFAULT 'active',

  -- Engagement (denormalized counters)
  votes             INTEGER NOT NULL DEFAULT 0,
  watchers          INTEGER NOT NULL DEFAULT 0,
  comments          INTEGER NOT NULL DEFAULT 0
);
```

Notes:
- `ticker` string is kept alongside `ticker_id` FK. The string is the routing output (what the skill chose). The FK links to the entity for joins/pages.
- `source_handle` is removed. Author identity comes from `author_id` FK -> `authors.handle`.
- `caller_id` is renamed to `submitted_by` to match `sources.submitted_by`.
- `resolve_*` columns are dropped. Added back later when scoring becomes relevant.
- `current_price` and `price_updated_at` are dropped. Live prices are a separate concern (in-memory cache, not schema).

---

## Indexes

```sql
CREATE INDEX idx_calls_created      ON calls(created_at DESC);
CREATE INDEX idx_calls_status       ON calls(status);
CREATE INDEX idx_calls_submitted_by ON calls(submitted_by);
CREATE INDEX idx_calls_author_id    ON calls(author_id);
CREATE INDEX idx_calls_ticker_id    ON calls(ticker_id);
CREATE INDEX idx_calls_source_id    ON calls(source_id);
CREATE INDEX idx_calls_source_date  ON calls(source_date);
CREATE INDEX idx_quotes_source_id   ON quotes(source_id);
CREATE INDEX idx_sources_submitted  ON sources(submitted_by);
```

---

## Entity pages (what this schema enables)

### /author/:handle
Query: `calls WHERE author_id = ?` joined to tickers and sources.
Shows: avatar, bio, socials, all calls attributed to them, which tickers they reference most, which sources their claims come from.

### /source/:id
Query: `calls WHERE source_id = ?` joined to authors and tickers. `quotes WHERE source_id = ?`.
Shows: title, URL, platform, published date, all quotes extracted, all calls generated, which authors were quoted.

### /ticker/:symbol
Query: `calls WHERE ticker_id = ?` joined to authors and sources.
Shows: logo, symbol, name, all calls on this ticker, direction breakdown (how many long vs short), which authors reference it.

### /user/:handle
Query: `calls WHERE submitted_by = ?` joined to authors, sources, tickers.
Shows: all calls they submitted, which authors they track, which sources they process.

---

## Migration path (18 existing calls)

### Step 1: Create new tables
authors, sources, tickers, quotes, call_quotes. Keep old calls table intact.

### Step 2: Populate authors (7 rows)
Extract from current `users` table where handle != 'satoshi'.
Copy: handle, bio, twitter (-> twitter_url), avatar_url.

### Step 3: Populate sources (~13 rows)
Group existing calls by source identity:
- Same `source_url` (non-null) -> same source. Title from `scan_source`.
- Null URL -> group by `(source_handle, scan_source)`.
All submitted_by = 'u_satoshi'.

### Step 4: Populate tickers (15 rows)
One row per unique `calls.ticker`. All instrument_type = 'stock', platform = 'robinhood' for current data.
Logo URLs from existing logos.ts logic.

### Step 5: Populate quotes (~20 rows)
Extract `segments` from each call's `trade_data` blob.
Each segment becomes a quote row linked to the call's source.
Also extract standalone `source_quote` for calls without segments.

### Step 6: Add FKs to calls
Add columns: source_id, ticker_id, author_id, submitted_by.
Populate by matching existing string values to new entity IDs.

### Step 7: Create call_quotes join entries
Link each call to the quotes extracted from its segments.

### Step 8: Clean up
Drop deprecated columns from calls: source_handle, source_url, caller_id, current_price, price_updated_at.
Drop deprecated rows from users (the 6 author rows).

---

## Validation against real data

### URL-less sources (constraint #2)
- c_evr_long (EVR, martinshkreli): source with url=NULL, title="Martin Shkreli (Feb 2026)"
- c_ionq_long (IONQ, martinshkreli): same source as above (same handle + scan_source)
- c_laes_long (LAES, marginsmall): source with url=NULL, title="marginsmall (Feb 2026)"
All 3 have a home. Source.url is nullable.

### Multi-call source (constraint #3, many-to-many)
- YouTube video (watch?v=1fevAtp8yvI): 1 source -> 4 calls (PLTR, CEG, CAT, MP)
- Each call has 1 quote from "creator" speaker
- 4 quote rows, 4 call_quotes rows. No overlap in this case, but the join table supports it.

### Multi-speaker source
- All-In podcast DELL call: 2 quotes (chamath@42:15, friedberg@43:30), 1 call
- 2 quote rows, 2 call_quotes rows linking to the same call

### Multi-source author
- chamath: 4 calls across 4 sources (1 podcast, 3 tweets)
- author page query: `calls WHERE author_id = chamath_id` returns all 4
- grouped by source: "All-In Podcast" (1 call), "tweet Feb 12" (2 calls from 2 tweets), "tweet Feb 17" (1 call)

### Same ticker from different authors
- CEG: 2 calls. One from chamath (tweet), one from youtube_creator (video)
- ticker page query: `calls WHERE ticker_id = ceg_id` returns both
- Direction: both long. Convergent signal visible on the page.

### Same ticker from same author, different sources
- DELL: 2 calls from chamath. One from All-In podcast, one from tweet.
- Both long. Different sources, same author, same ticker. All relationships preserved.
