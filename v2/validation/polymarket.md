# Polymarket API Validation Report

**Date**: 2026-02-15
**Status**: VIABLE (with caveats)

---

## API Architecture

Polymarket exposes two complementary APIs:

### 1. Gamma Markets API (read-only, no auth required)
- **Base URL**: `https://gamma-api.polymarket.com`
- **Purpose**: Market discovery, event browsing, metadata
- **Key endpoints**:
  - `GET /events` - List events (grouped markets)
  - `GET /events?slug=<slug>` - Get event by slug
  - `GET /markets` - List individual markets
  - `GET /markets?slug=<slug>` - Get market by slug

#### Gamma Query Parameters
| Param | Works? | Notes |
|-------|--------|-------|
| `_limit` | YES | Max 20 per request |
| `offset` | YES | Pagination offset (multiples of _limit) |
| `closed` | YES | `false` for open markets |
| `active` | YES | `true` for active markets |
| `order` | YES | Sort field: `volume`, `volume24hr`, `volumeNum`, `createdAt` |
| `ascending` | YES | `false` for descending |
| `slug` | YES | Exact slug match on events/markets |
| `slug_contains` | NO | Silently ignored, returns default results |
| `question_contains` | NO | Silently ignored |
| `text_query` | NO | Silently ignored |
| `_q` | NO | Silently ignored |
| `tag` | NO | Silently ignored |
| `category` | NO | Silently ignored (all categories return N/A) |

**Critical finding**: The Gamma API has NO text search capability. All `*_contains`, `_q`, `tag`, and `category` filters are silently ignored and return the same default sorted results. The only reliable way to find markets is:
1. Browse by volume/date ordering with pagination
2. Look up by exact slug (if known)
3. Fetch batches and filter client-side

### 2. CLOB API (trading + order books)
- **Base URL**: `https://clob.polymarket.com`
- **Purpose**: Order books, price history, trading
- **Key endpoints**:
  - `GET /markets` - List all markets (paginated, cursor-based, limit=1000 default)
  - `GET /book?token_id=<id>` - Full order book for a market
  - `GET /prices-history?market=<token_id>&interval=all&fidelity=60` - Price history
  - Trading endpoints (POST, requires auth + wallet signature)

#### CLOB Notes
- Pagination uses `next_cursor` (base64 encoded)
- `limit=500` returns 403 Forbidden; `limit=1000` (default) works
- Markets are returned in creation order (oldest first), not by relevance
- No search/filter capability on the CLOB endpoint either
- Price history returns `{t: unix_timestamp, p: price}` pairs
- Order book returns full bid/ask depth with price and size

### Rate Limiting
- Both APIs return 403 after rapid successive requests
- Adding `User-Agent` header helps
- Recommend 500ms+ delay between requests
- No documented rate limit headers

---

## Thesis 1: "Fed keeps rates higher for longer" (Macro)

### Markets Found: YES - Strong coverage

**Event**: "Fed decision in March?" (slug: `fed-decision-in-march-885`)
- Total volume: $116,411,229
- Total liquidity: $4,687,039
- Expiry: 2026-03-18

| Market | YES Price | NO Price | Volume | Liquidity |
|--------|-----------|----------|--------|-----------|
| Fed decrease rates by 50+ bps | $0.0085 | $0.9915 | $45.3M | $1.0M |
| Fed decrease rates by 25 bps | $0.065 | $0.935 | $15.5M | $0.8M |
| No change in Fed rates | $0.925 | $0.075 | $14.9M | $1.1M |
| Fed increase rates by 25+ bps | $0.0065 | $0.9935 | $40.8M | $1.8M |

**Interpretation for thesis "Fed keeps rates higher for longer"**:
- "No change" at $0.925 = market assigns 92.5% probability Fed holds in March 2026
- "Rate cut 25bps" at $0.065 = only 6.5% chance of a cut
- This strongly supports the "higher for longer" thesis
- **Return profile**: Buy "No change" YES at $0.925, win $1.00 = 8.1% return. Buy "Rate cut" NO at $0.935, win $1.00 = 7.0% return.

**Also found**: "Who will Trump nominate as Fed Chair?" ($481M volume, 39 sub-markets)
- Kevin Warsh: 95.7% YES
- Judy Shelton: 3.1% YES
- Relevant for longer-term monetary policy thesis

### Feasibility: HIGH
Excellent liquidity, multiple contracts per FOMC meeting, clear binary resolution. Perfect for rate path thesis expression.

---

## Thesis 2: "AI defense spending will boom" (Sector)

### Markets Found: NO direct match

Searched 200+ active events across all volume tiers. No markets found for:
- AI defense spending
- Defense budget levels
- Pentagon/DoD spending
- Military AI contracts
- Defense sector performance

**Closest matches** (tangentially related):
- "Will Russia invade a NATO country by...?" ($3.4M vol) - geopolitical, not spending
- "US strikes Iran by...?" ($259M vol) - military action, not spending
- "China x India military clash by...?" ($187K vol) - geopolitical

### Feasibility: LOW
Polymarket's market coverage is heavily weighted toward:
1. US politics (elections, nominations)
2. Sports (NBA, Premier League, FIFA)
3. Crypto prices (BTC, ETH, SOL)
4. Geopolitical events (wars, invasions)
5. Pop culture (Stranger Things, GTA 6)

There are no markets for sector-level economic theses like defense spending, AI capex, or industry growth rates. This is a fundamental coverage gap for investment thesis validation.

---

## Thesis 3: "Solana flips Ethereum in DEX volume" (Crypto-native)

### Markets Found: PARTIAL - Price markets only, no DEX volume markets

**Solana Event**: "What price will Solana hit in February?" (slug: `what-price-will-solana-hit-in-february-2026`)
- Total volume: $8,878,228
- Liquidity: $1,377,566
- Expiry: 2026-03-01

Sample markets:
| Market | YES Price | Volume | Liquidity |
|--------|-----------|--------|-----------|
| Solana reach $150 | $0.0105 | $224K | $36K |
| Solana reach $180 | $0.0035 | $220K | $233K |
| Solana dip to $60 | $0.0795 | $686K | $23K |
| Solana dip to $50 | $0.0235 | $622K | $34K |
| Solana dip to $30 | $0.007 | $381K | $39K |

**Ethereum Event**: "What price will Ethereum hit in February?" (slug: `what-price-will-ethereum-hit-in-february-2026`)
- Total volume: $20,999,720
- Liquidity: $2,393,411
- Expiry: 2026-03-01

Sample markets:
| Market | YES Price | Volume | Liquidity |
|--------|-----------|--------|-----------|
| Ethereum reach $5,000 | $0.0015 | $3.2M | $742K |
| Ethereum reach $4,400 | $0.0025 | $6.7M | $422K |
| Ethereum reach $3,600 | $0.0055 | $473K | $93K |
| Ethereum dip to $1,200 | $0.0185 | $1.1M | $72K |

**No markets found for**:
- Solana vs Ethereum DEX volume
- "Flippening" (SOL/ETH market cap)
- DEX volume metrics
- TVL comparisons
- Any relative performance markets

### Feasibility: MEDIUM
Can express directional price views on SOL and ETH individually, but cannot express the *relative* thesis "Solana flips Ethereum." There are no comparison/ratio markets on Polymarket.

---

## Data Schema (Key Fields from Gamma API)

### Event Object
```json
{
  "id": "67284",
  "slug": "fed-decision-in-march-885",
  "title": "Fed decision in March?",
  "description": "...",
  "endDate": "2026-03-18T00:00:00Z",
  "volume": 116411229,
  "liquidity": 4687039,
  "openInterest": 0,
  "volume24hr": 9364223,
  "markets": [/* array of Market objects */]
}
```

### Market Object
```json
{
  "id": "636301",
  "question": "Will there be no change in Fed interest rates after the March 2026 meeting?",
  "slug": "will-there-be-no-change-in-fed-...",
  "outcomes": "[\"Yes\", \"No\"]",
  "outcomePrices": "[\"0.925\", \"0.075\"]",
  "volumeNum": 14871479,
  "liquidityNum": 1052417,
  "volume24hr": 229384,
  "endDateIso": "2026-03-18",
  "clobTokenIds": "[\"10255981...\", \"11435008...\"]",
  "closed": false,
  "active": true,
  "negRisk": true,
  "events": [/* parent event */]
}
```

### CLOB Price History
```json
{
  "history": [
    {"t": 1768496422, "p": 0.725},
    {"t": 1771173020, "p": 0.925}
  ]
}
```

### CLOB Order Book
```json
{
  "market": "...",
  "asset_id": "...",
  "bids": [{"price": "0.92", "size": "50000"}],
  "asks": [{"price": "0.93", "size": "30000"}],
  "min_order_size": 5,
  "tick_size": 0.001,
  "last_trade_price": 0.925
}
```

---

## Adapter Implementation Strategy

### Search Approach (required workaround for no text search)
Since the Gamma API has no text search, the adapter must:
1. **Pre-fetch and index**: Periodically fetch all active events (200+ via offset pagination, 20 per page) and build a local search index
2. **Client-side fuzzy match**: Match user theses against event titles/descriptions using keyword extraction
3. **Slug lookup for known topics**: Maintain a mapping of common topics to known slugs (e.g., "fed rate" -> "fed-decision-in-march-*")

### Data Flow
```
User thesis -> Extract keywords -> Search local event index ->
  Match events -> Fetch fresh prices from Gamma API ->
  Optionally fetch order book from CLOB API -> Return structured result
```

### Key Implementation Details
- **Pagination**: `_limit=20&offset=N` where N increments by 20
- **Rate limiting**: 500ms+ between requests, retry with backoff on 403
- **Token price mapping**: `outcomePrices` is a JSON string of `["YES_price", "NO_price"]`
- **Binary payoff**: All markets resolve to $0 or $1 per share
- **Return calculation**: `(1.0 / buy_price) - 1.0` for potential return (e.g., buy YES at $0.065, return = 1438%)
- **Event grouping**: Events contain multiple related markets (e.g., Fed decision has 4 sub-markets for different outcomes)

---

## API Quality Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Reliability | 8/10 | APIs are up and responsive, occasional 403 on rapid requests |
| Data richness | 7/10 | Good price/volume/liquidity data, decent order book depth |
| Search capability | 2/10 | No text search at all — major limitation |
| Coverage breadth | 5/10 | Strong on politics, sports, crypto prices. Weak on economics, sectors, comparisons |
| Documentation | 4/10 | Docs exist but Gamma API params are poorly documented; many params silently ignored |
| Auth requirement | 10/10 | Read-only access requires no authentication |
| Rate limits | 6/10 | Undocumented, appears to be ~2 req/sec before 403 |

---

## Key Limitations

1. **No text search**: Cannot search markets by keywords. Must fetch-and-filter client-side. This adds latency and complexity.

2. **Limited market coverage for investment theses**: Markets are focused on binary event outcomes (elections, prices hitting levels, geopolitics). There are no markets for:
   - Sector performance (defense spending, AI capex)
   - Relative comparisons (SOL vs ETH)
   - Economic indicators (GDP, unemployment)
   - Corporate events (earnings beats, M&A)

3. **Short-dated markets dominate**: Most active crypto markets are weekly/monthly. Longer-dated thesis expression requires finding the right event cycle.

4. **Pagination ceiling**: Maximum 20 results per request. To scan all ~200+ active events requires 10+ paginated requests.

5. **No category/tag system**: Despite having apparent category/tag fields, they're all empty. No way to browse by topic.

---

## Overall Verdict

**Polymarket is VIABLE as an adapter but with significant constraints.**

**Strengths**:
- Excellent for macro/monetary policy theses (Fed rate decisions have $100M+ volume)
- Good for crypto price direction theses (BTC, ETH, SOL all have active markets)
- Deep liquidity on popular markets
- No auth required for read access
- Binary payoff model is simple to reason about

**Weaknesses**:
- No text search means we need a local index + fuzzy matching layer
- Sector theses (defense, AI spending) have zero coverage
- Relative/comparison theses (X flips Y) have zero coverage
- Only ~200 active events total — small universe vs traditional markets

**Recommendation**: Include as an adapter for macro (rates, inflation, elections) and crypto price direction. Do NOT rely on it for sector theses or relative performance theses. The adapter needs a caching/indexing layer to compensate for the lack of search API.
