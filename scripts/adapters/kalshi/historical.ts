/**
 * Kalshi Historical / Resolution Lookup
 *
 * Usage: bun run scripts/adapters/kalshi/historical.ts "PRES-2024-DJT"
 *        bun run scripts/adapters/kalshi/historical.ts "KXBTCMAXY-26DEC31" "2025-01-02"
 *        bun run scripts/adapters/kalshi/historical.ts "KXBTCMAXY-26DEC31" "2025-01-02" "KXBTCMAXY"
 *
 * Two modes:
 *   1. Resolution lookup (no date): fetches market data to see if resolved, outcome, settlement value.
 *   2. Price at date (with date): fetches candlestick data for that date.
 *
 * Optional third arg: series ticker override (otherwise inferred from market ticker).
 *
 * Note: Kalshi uses api.elections.kalshi.com (not trading-api.kalshi.com). Market tickers are case-sensitive.
 */

const API_BASE = "https://api.elections.kalshi.com/trade-api/v2";

interface KalshiMarketDetail {
  ticker: string;
  title: string;
  status: string;
  result: string;
  last_price: number;
  volume: number;
  settlement_value?: number;
  open_interest: number;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  close_time?: string;
  expiration_time?: string;
  expected_expiration_time?: string;
}

interface Candlestick {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  start_period_ts: number;
  end_period_ts: number;
}

/**
 * Infer series ticker from a market ticker.
 * Heuristic: everything before the last dash segment.
 *   "KXBTCMAXY-26DEC31"  -> "KXBTCMAXY"
 *   "PRES-2024-DJT"      -> "PRES-2024"
 *   "KXFED-26MAR-T3.50"  -> "KXFED-26MAR" (may need override)
 */
function inferSeriesTicker(marketTicker: string): string {
  const lastDash = marketTicker.lastIndexOf("-");
  if (lastDash <= 0) return marketTicker;
  return marketTicker.slice(0, lastDash);
}

/**
 * Mode 1: Resolution lookup — fetch market detail.
 */
async function fetchResolution(ticker: string) {
  const url = `${API_BASE}/markets/${ticker}`;
  console.error(`[kalshi/historical] Fetching market: ${url}`);

  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch market ${ticker}: ${res.status} ${res.statusText}${body ? ` — ${body}` : ""}`
    );
  }

  const json = (await res.json()) as { market: KalshiMarketDetail };
  const m = json.market;

  return {
    ticker: m.ticker,
    status: m.status,
    result: m.result || null,
    settlement_value: m.settlement_value ?? null,
    last_price: m.last_price,
    volume: m.volume,
    source: "kalshi",
  };
}

/**
 * Mode 2: Price at date — fetch candlestick data.
 */
async function fetchPriceAtDate(ticker: string, date: string, seriesTicker: string) {
  // Parse date and build unix timestamps for the full day
  const dayStart = new Date(`${date}T00:00:00Z`);
  if (isNaN(dayStart.getTime())) {
    throw new Error(`Invalid date format: "${date}". Expected YYYY-MM-DD.`);
  }
  const startTs = Math.floor(dayStart.getTime() / 1000);
  const endTs = startTs + 86400;

  const url =
    `${API_BASE}/series/${seriesTicker}/markets/${ticker}/candlesticks` +
    `?start_ts=${startTs}&end_ts=${endTs}&period_interval=1440`;

  console.error(`[kalshi/historical] Fetching candles: ${url}`);

  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch candlesticks for ${ticker}: ${res.status} ${res.statusText}${body ? ` — ${body}` : ""}`
    );
  }

  const json = (await res.json()) as { candlesticks: Candlestick[] };
  const candles = json.candlesticks ?? [];

  if (candles.length === 0) {
    throw new Error(
      `No candlestick data for ${ticker} on ${date}. The market may not have been active on that date, ` +
        `or the series ticker "${seriesTicker}" may be wrong (try passing it as the third argument).`
    );
  }

  // Use the first (and typically only) daily candle
  const c = candles[0]!;

  return {
    ticker,
    date,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
    source: "kalshi",
  };
}

// --- CLI entry point ---
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error(
      'Usage: bun run scripts/adapters/kalshi/historical.ts "PRES-2024-DJT"\n' +
        '       bun run scripts/adapters/kalshi/historical.ts "KXBTCMAXY-26DEC31" "2025-01-02"\n' +
        '       bun run scripts/adapters/kalshi/historical.ts "KXBTCMAXY-26DEC31" "2025-01-02" "KXBTCMAXY"'
    );
    process.exit(1);
  }

  const ticker = args[0] as string;
  const date: string | null = args[1] ?? null;
  const seriesOverride: string | null = args[2] ?? null;

  try {
    let result: Record<string, unknown>;

    if (date) {
      // Price-at-date mode
      const seriesTicker = seriesOverride || inferSeriesTicker(ticker);
      console.error(
        `[kalshi/historical] Price lookup: ${ticker} on ${date} (series: ${seriesTicker})`
      );
      result = await fetchPriceAtDate(ticker, date, seriesTicker);
    } else {
      // Resolution mode
      console.error(`[kalshi/historical] Resolution lookup: ${ticker}`);
      result = await fetchResolution(ticker);
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[kalshi/historical] Error: ${message}`);
    console.log(
      JSON.stringify(
        {
          error: message,
          ticker,
          note: "Kalshi uses api.elections.kalshi.com (not trading-api.kalshi.com). Market tickers are case-sensitive.",
        },
        null,
        2
      )
    );
    process.exit(1);
  }
}

main();
