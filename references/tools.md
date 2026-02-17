# Tools CLI Reference

Scripts connect to live market APIs. All output JSON to stdout, logs to stderr.

## Instrument Discovery

```bash
# Robinhood: validate tickers via Yahoo Finance
bun run scripts/adapters/robinhood/instruments.ts "TICKER1,TICKER2"
# Returns: price, market cap, 52-week range, day change

# Hyperliquid: validate against live perp list
bun run scripts/adapters/hyperliquid/instruments.ts "TICKER1,TICKER2"
# Returns: mark price, funding rate, OI, volume, max leverage

# Kalshi: keyword-based discovery (series tickers)
bun run scripts/adapters/kalshi/instruments.ts "keyword phrase"
# Returns: open events sorted by date relevance

# Bankr: thesis-based (sends to Bankr AI agent, 15-125s)
bun run scripts/adapters/bankr/instruments.ts "thesis text"
# Returns: tokens, Polymarket markets, onchain instruments

# Angel: keyword search across Republic, Wefunder, Crunchbase
bun run scripts/adapters/angel/instruments.ts "thesis keywords"
# Returns: active raises matching the thesis
```

## Return Calculations

```bash
# Robinhood: ticker + direction + type
bun run scripts/adapters/robinhood/returns.ts "TICKER" "long|short" "stock|etf|option"
# Returns: entry price, IV-derived target/stop, return %, options chain

# Hyperliquid: asset + direction + leverage
bun run scripts/adapters/hyperliquid/returns.ts "TICKER" "long|short" "5"
# Returns: entry, liquidation price, 30d expected move, funding cost

# Kalshi: event ticker + optional strike + direction
bun run scripts/adapters/kalshi/returns.ts "EVENT-TICKER" "" "yes|no"
# Returns: buy price, implied probability, return if right, contracts per $100

# Bankr: ticker + direction + type (15-125s)
bun run scripts/adapters/bankr/returns.ts "TICKER" "long" "token|polymarket|treasury"
# Returns: price, return profile

# Angel: stage + sector (no live pricing)
bun run scripts/adapters/angel/returns.ts "stage" "sector"
# Returns: stage-based venture return distribution
```

## Tracking

```bash
bun run scripts/track.ts record --input "<thesis>" --inst TICKER --px PRICE --dir long --plat robinhood [flags]
bun run scripts/track.ts check <keywords>
bun run scripts/track.ts portfolio [--telegram]
bun run scripts/track.ts close --id X --px PRICE
bun run scripts/track.ts update --id X --conviction N --reason "..."
bun run scripts/track.ts history
```

Optional flags: `--action paper`, `--shape binary`, `--β 0.8`, `--conv 5`, `--tc 0.3`, `--kills "kill1, kill2"`, `--alt "ALT"`, `--src "tweet:@handle"`, `--claim "deeper claim"`, `--sector "defense"`, `--conviction 80`.

Storage: `data/beliefs.jsonl` — append-only JSONL.
