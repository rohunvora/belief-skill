# Polymarket Adapter

## Market Structure

Events contain Markets. Each market is a binary question (YES/NO) that resolves to $1 or $0.

- **Event**: container grouping related markets (e.g. "2026 Fed Chair")
- **Market**: a single binary question with a conditionId
- **Token IDs**: each market has two ERC1155 tokens (YES = index 0, NO = index 1) for CLOB trading
- **conditionId**: the unique identifier used for lookups across both Gamma and CLOB APIs

## API Endpoints

Two base URLs, both public (no auth for reads):

| API | Base URL | Purpose |
|-----|----------|---------|
| Gamma | `gamma-api.polymarket.com` | Search, market metadata, event listing |
| CLOB | `clob.polymarket.com` | Orderbook, live pricing, price history |

### instruments.ts uses:
- `GET /public-search?q={query}&limit_per_type=10&events_status=active` (Gamma)

### returns.ts uses:
- `GET /markets?condition_ids={id}` (Gamma, for metadata)
- `GET /book?token_id={id}` (CLOB, for orderbook/pricing)

## Rate Limits

Cloudflare throttling (delays, not hard rejects). No conservative delays needed like Kalshi.
Burst limits are generous for read endpoints. No API key required.

## Pricing

- Prices are **0 to 1** (probability). Not cents like Kalshi.
- Volume is in **USD**. Kalshi volume is in contracts (approx $1 each). Do not compare raw numbers across platforms without noting the unit.
- Liquidity (liquidityNum) is in USD.

## When Best

- Political and geopolitical events (elections, policy, wars, treaties, ceasefire)
- Tech milestones (product launches, AI benchmarks, IPO valuations)
- Cultural events (sports, entertainment, social trends)
- Binary event questions that Kalshi does not cover
- High-liquidity questions with millions in volume

## When Weak

- Precision macro: no strike-level granularity (Kalshi has 26 rate thresholds per FOMC, Polymarket has 1-3 broad questions)
- Stock/equity theses: thin markets, low volume, better served by Robinhood
- Crypto pair trades: no spread instruments, use Hyperliquid perps instead
- Very new or niche markets may have low liquidity

## Geo Note

Polymarket is geo-blocked for trading from the US. Read-only API access (search, market data, orderbook) is unrestricted. Our adapter only reads.

## Bankr Overlap

Bankr proxies some Polymarket markets through its AI agent. Prefer the direct Polymarket adapter for discovery because it is faster (250ms vs 15-125s) and free (Bankr charges $0.10/request via SDK). Bankr keeps its role for execution, token swaps, cross-chain instruments, and treasury products.

## Relevance Filtering

The search endpoint returns fuzzy keyword matches that can be irrelevant (e.g. "Big Brother Brasil" for "SOL ETH"). The instruments.ts adapter filters results by requiring at least one thesis keyword to appear in the market question text. Markets below $1K total volume are also dropped.
