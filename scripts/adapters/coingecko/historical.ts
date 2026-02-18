/**
 * CoinGecko historical spot price lookup.
 * Fetches price, market cap, and volume for a crypto on a given date.
 *
 * Usage:
 *   bun run scripts/adapters/coingecko/historical.ts "bitcoin" "2025-06-15"
 *   bun run scripts/adapters/coingecko/historical.ts "BTC" "2025-06-15"
 *   bun run scripts/adapters/coingecko/historical.ts "ethereum" "2025-06-15"
 *
 * Notes:
 *   - Free tier only supports dates within the past 365 days.
 *   - Accepts CoinGecko slug ("bitcoin") or common ticker ("BTC").
 *   - No API key required.
 */

const API = "https://api.coingecko.com/api/v3";

// ── Ticker-to-CoinGecko slug mapping ────────────────────────────────

const TICKER_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  HYPE: "hyperliquid",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  LINK: "chainlink",
  UNI: "uniswap",
  AAVE: "aave",
  ARB: "arbitrum",
  OP: "optimism",
  PENDLE: "pendle",
  TAO: "bittensor",
};

// Reverse map: slug -> ticker (for output)
const SLUG_TO_TICKER: Record<string, string> = {};
for (const [ticker, slug] of Object.entries(TICKER_MAP)) {
  SLUG_TO_TICKER[slug] = ticker;
}

// ── Helpers ──────────────────────────────────────────────────────────

function resolveCoin(input: string): { coin_id: string; ticker: string | null } {
  const upper = input.toUpperCase();
  if (TICKER_MAP[upper]) {
    return { coin_id: TICKER_MAP[upper]!, ticker: upper };
  }
  // Assume it's already a CoinGecko slug
  const ticker = SLUG_TO_TICKER[input.toLowerCase()] ?? null;
  return { coin_id: input.toLowerCase(), ticker };
}

function toCoingeckoDate(yyyy_mm_dd: string): string {
  // CoinGecko expects DD-MM-YYYY
  const [y, m, d] = yyyy_mm_dd.split("-");
  return `${d}-${m}-${y}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const rawCoin = process.argv[2] ?? "";
  const dateStr = process.argv[3] ?? "";

  if (!rawCoin || !dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    console.error('Usage: bun run scripts/adapters/coingecko/historical.ts "bitcoin" "2025-06-15"');
    console.error("  coin: CoinGecko slug (bitcoin, ethereum) or ticker (BTC, ETH)");
    console.error("  date: YYYY-MM-DD");
    process.exit(1);
  }

  const { coin_id, ticker } = resolveCoin(rawCoin);

  // Validate date
  const targetDate = new Date(`${dateStr}T00:00:00Z`);
  if (isNaN(targetDate.getTime())) {
    console.error(`Invalid date: ${dateStr}`);
    process.exit(1);
  }

  // Check 365-day limit
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const daysAgo = daysBetween(targetDate, today);

  if (daysAgo > 365) {
    const tickerDisplay = ticker ?? coin_id.toUpperCase();
    const error = {
      error: `CoinGecko free tier only supports dates within the past 365 days. Date ${dateStr} is ${daysAgo} days ago.`,
      ticker: tickerDisplay,
      date: dateStr,
      suggestion: `Try Hyperliquid for major crypto: bun run scripts/adapters/hyperliquid/historical.ts ${tickerDisplay} ${dateStr}`,
    };
    console.log(JSON.stringify(error, null, 2));
    process.exit(1);
  }

  // Fetch from CoinGecko
  const cgDate = toCoingeckoDate(dateStr);
  const url = `${API}/coins/${coin_id}/history?date=${cgDate}&localization=false`;

  let res = await fetch(url);

  // Handle rate limiting (429) — retry once
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("retry-after") ?? "60", 10);
    console.error(`Rate limited by CoinGecko, waiting ${retryAfter}s...`);
    await Bun.sleep(retryAfter * 1000);
    res = await fetch(url);
  }

  if (!res.ok) {
    console.error(`CoinGecko API error: ${res.status} ${res.statusText}`);
    const body = await res.text().catch(() => "");
    if (body) console.error(body);
    process.exit(1);
  }

  const data = await res.json() as {
    id: string;
    market_data?: {
      current_price?: { usd?: number };
      market_cap?: { usd?: number };
      total_volume?: { usd?: number };
    };
  };

  if (!data.market_data?.current_price?.usd) {
    const error = {
      error: `No price data for ${coin_id} on ${dateStr}. Token may not have been listed yet.`,
      coin_id,
      date: dateStr,
    };
    console.log(JSON.stringify(error, null, 2));
    process.exit(1);
  }

  const md = data.market_data;
  const tickerDisplay = ticker ?? coin_id.toUpperCase();

  const result = {
    ticker: tickerDisplay,
    coin_id,
    date: dateStr,
    price_usd: md.current_price!.usd!,
    market_cap_usd: md.market_cap?.usd ?? null,
    volume_usd: md.total_volume?.usd ?? null,
    source: "coingecko",
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
