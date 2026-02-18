/**
 * Hyperliquid historical price lookup.
 * Fetches daily candle data for a crypto perp on a given date.
 *
 * Usage:
 *   bun run scripts/adapters/hyperliquid/historical.ts "BTC" "2025-01-02"
 *   bun run scripts/adapters/hyperliquid/historical.ts "ETH" "2025-01-02"
 *   bun run scripts/adapters/hyperliquid/historical.ts "HYPE" "2024-12-10"
 */

const API = "https://api.hyperliquid.xyz/info";

// ── API types ───────────────────────────────────────────────────────

interface Candle {
  t: number;   // open timestamp (ms)
  T: number;   // close timestamp (ms)
  s: string;   // symbol
  i: string;   // interval
  o: string;   // open
  h: string;   // high
  l: string;   // low
  c: string;   // close
  v: string;   // volume (coin units)
  n: number;   // trade count
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const coin = (process.argv[2] ?? "").toUpperCase();
  const dateStr = process.argv[3] ?? "";

  if (!coin || !dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    console.error('Usage: bun run scripts/adapters/hyperliquid/historical.ts "BTC" "2025-01-02"');
    console.error("  coin: Ticker (BTC, ETH, SOL, HYPE, etc.)");
    console.error("  date: YYYY-MM-DD");
    process.exit(1);
  }

  // Convert date to 1-day window in UTC milliseconds
  const startTime = new Date(`${dateStr}T00:00:00Z`).getTime();
  const endTime = startTime + 24 * 60 * 60 * 1000; // +1 day

  if (isNaN(startTime)) {
    console.error(`Invalid date: ${dateStr}`);
    process.exit(1);
  }

  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "candleSnapshot",
      req: {
        coin,
        interval: "1d",
        startTime,
        endTime,
      },
    }),
  });

  if (!res.ok) {
    console.error(`Hyperliquid API error: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const candles = (await res.json()) as Candle[];

  if (!candles || candles.length === 0) {
    const error = {
      error: `No data for ${coin} on ${dateStr}. Token may not have been listed yet.`,
      ticker: coin,
      date: dateStr,
    };
    console.log(JSON.stringify(error, null, 2));
    console.error(
      `Note: For tokens not on Hyperliquid, try CoinGecko: bun run scripts/adapters/coingecko/historical.ts "${coin}" "${dateStr}"`,
    );
    process.exit(1);
  }

  // Use the first candle (should be the only one for a 1-day window)
  const c = candles[0]!;

  const result = {
    ticker: coin,
    date: dateStr,
    open: parseFloat(c.o),
    high: parseFloat(c.h),
    low: parseFloat(c.l),
    close: parseFloat(c.c),
    volume: parseFloat(c.v),
    trades: c.n,
    source: "hyperliquid",
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
