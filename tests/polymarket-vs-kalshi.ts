#!/usr/bin/env bun
/**
 * Polymarket vs Kalshi API Validation
 *
 * Hits both APIs with the same thesis keywords and compares:
 *  1. Market universe — who has markets for this thesis?
 *  2. Data richness — volume, liquidity, price quality
 *  3. Search quality — relevance of results
 *  4. Response latency — raw speed
 *  5. Pricing shape — how each represents probability
 *
 * Run: bun run tests/polymarket-vs-kalshi.ts
 */

const KALSHI_API = "https://api.elections.kalshi.com/trade-api/v2";
const POLY_GAMMA = "https://gamma-api.polymarket.com";
const POLY_CLOB = "https://clob.polymarket.com";

// --- Types ---

interface PlatformResult {
  platform: "kalshi" | "polymarket";
  market_count: number;
  markets: MarketSummary[];
  latency_ms: number;
  error?: string;
}

interface MarketSummary {
  id: string;
  title: string;
  price: number | null;       // implied probability (0-1)
  volume: number | null;       // total volume traded
  liquidity: number | null;    // current liquidity/OI
  end_date: string | null;     // when it resolves
  active: boolean;
}

interface ComparisonResult {
  query: string;
  thesis_type: string;         // "macro" | "political" | "crypto" | "tech" | "geopolitical"
  kalshi: PlatformResult;
  polymarket: PlatformResult;
  verdict: string;             // one-line summary
}

// --- Kalshi Search ---
// Mirrors the series_map from kalshi/instruments.ts but simplified for testing
const KALSHI_SERIES: Record<string, string[]> = {
  "fed rates": ["KXFED", "KXFEDDECISION"],
  "trump": [],  // Kalshi has political markets but not series-mapped this way
  "bitcoin": ["KXBTCMAXY", "KXBTC"],
  "AI": [],
  "recession": ["KXRECSSNBER", "KXQRECESS"],
  "spacex": [],
  "ukraine": [],
  "inflation": ["KXCPIYOY", "KXCPICOREYOY"],
  "oil": ["KXOIL", "KXWTIW"],
  "gold": ["KXGOLD", "KXGOLDMON"],
};

async function searchKalshi(query: string): Promise<PlatformResult> {
  const start = performance.now();
  const markets: MarketSummary[] = [];

  const seriesTickers = KALSHI_SERIES[query] || [];

  if (seriesTickers.length === 0) {
    return {
      platform: "kalshi",
      market_count: 0,
      markets: [],
      latency_ms: Math.round(performance.now() - start),
      error: "No series mapping for this query",
    };
  }

  try {
    for (const ticker of seriesTickers) {
      const url = `${KALSHI_API}/events?series_ticker=${ticker}&status=open&limit=10`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`  [kalshi] ${ticker}: ${res.status}`);
        continue;
      }
      const json = await res.json() as any;
      const events = json.events ?? [];

      for (const event of events) {
        // Fetch nested markets for this event
        const eventUrl = `${KALSHI_API}/events/${event.event_ticker}?with_nested_markets=true`;
        const eventRes = await fetch(eventUrl);
        if (!eventRes.ok) continue;
        const eventJson = await eventRes.json() as any;
        const eventMarkets = eventJson.event?.markets ?? [];

        for (const m of eventMarkets.slice(0, 3)) { // top 3 markets per event
          markets.push({
            id: m.ticker,
            title: m.title || m.subtitle || event.title,
            price: m.last_price ? m.last_price / 100 : null,  // Kalshi prices are in cents
            volume: m.volume ?? null,
            liquidity: m.open_interest ?? null,
            end_date: m.expected_expiration_time || event.expected_expiration_time || null,
            active: m.status === "active",
          });
        }
      }

      // Rate limit between series
      await new Promise(r => setTimeout(r, 150));
    }
  } catch (err: any) {
    return {
      platform: "kalshi",
      market_count: 0,
      markets: [],
      latency_ms: Math.round(performance.now() - start),
      error: err.message,
    };
  }

  return {
    platform: "kalshi",
    market_count: markets.length,
    markets,
    latency_ms: Math.round(performance.now() - start),
  };
}

// --- Polymarket Search ---

async function searchPolymarket(query: string): Promise<PlatformResult> {
  const start = performance.now();
  const markets: MarketSummary[] = [];

  try {
    // Phase 1: Search via Gamma API
    const searchUrl = `${POLY_GAMMA}/public-search?q=${encodeURIComponent(query)}&limit_per_type=10&events_status=active`;
    const res = await fetch(searchUrl);
    if (!res.ok) {
      return {
        platform: "polymarket",
        market_count: 0,
        markets: [],
        latency_ms: Math.round(performance.now() - start),
        error: `Search failed: ${res.status}`,
      };
    }

    const json = await res.json() as any;
    const events = json.events ?? [];

    for (const event of events) {
      const eventMarkets = event.markets ?? [];
      for (const m of eventMarkets.slice(0, 3)) { // top 3 markets per event
        // Polymarket bestBid/bestAsk are strings like "0.45"
        const bestBid = m.bestBid ? parseFloat(m.bestBid) : null;
        const bestAsk = m.bestAsk ? parseFloat(m.bestAsk) : null;
        const lastPrice = m.lastTradePrice ? parseFloat(m.lastTradePrice) : null;
        const price = lastPrice ?? (bestBid && bestAsk ? (bestBid + bestAsk) / 2 : bestBid);

        markets.push({
          id: m.conditionId || m.id,
          title: m.question || m.groupItemTitle || event.title,
          price,
          volume: m.volumeNum ? parseFloat(m.volumeNum) : null,
          liquidity: m.liquidityNum ? parseFloat(m.liquidityNum) : null,
          end_date: m.endDate || event.endDate || null,
          active: m.active !== false && m.closed !== true,
        });
      }
    }
  } catch (err: any) {
    return {
      platform: "polymarket",
      market_count: 0,
      markets: [],
      latency_ms: Math.round(performance.now() - start),
      error: err.message,
    };
  }

  return {
    platform: "polymarket",
    market_count: markets.length,
    markets,
    latency_ms: Math.round(performance.now() - start),
  };
}

// --- Test Queries ---

const QUERIES: { query: string; type: string }[] = [
  { query: "fed rates",   type: "macro" },
  { query: "trump",       type: "political" },
  { query: "bitcoin",     type: "crypto" },
  { query: "AI",          type: "tech" },
  { query: "recession",   type: "macro" },
  { query: "spacex",      type: "tech" },
  { query: "ukraine",     type: "geopolitical" },
  { query: "inflation",   type: "macro" },
  { query: "oil",         type: "commodity" },
  { query: "gold",        type: "commodity" },
];

// --- Comparison Logic ---

function summarize(k: PlatformResult, p: PlatformResult, query: string): string {
  if (k.market_count === 0 && p.market_count === 0) return "Neither platform has markets";
  if (k.market_count === 0) return `Polymarket only (${p.market_count} markets)`;
  if (p.market_count === 0) return `Kalshi only (${k.market_count} markets)`;

  // Both have markets - compare quality
  const kAvgVol = avg(k.markets.map(m => m.volume).filter(Boolean) as number[]);
  const pAvgVol = avg(p.markets.map(m => m.volume).filter(Boolean) as number[]);
  const kAvgLiq = avg(k.markets.map(m => m.liquidity).filter(Boolean) as number[]);
  const pAvgLiq = avg(p.markets.map(m => m.liquidity).filter(Boolean) as number[]);

  const parts: string[] = [];
  parts.push(`Both (K:${k.market_count} P:${p.market_count})`);

  if (kAvgVol > 0 && pAvgVol > 0) {
    const ratio = pAvgVol / kAvgVol;
    if (ratio > 5) parts.push("Poly volume >>>");
    else if (ratio > 2) parts.push("Poly volume >");
    else if (ratio < 0.2) parts.push("Kalshi volume >>>");
    else if (ratio < 0.5) parts.push("Kalshi volume >");
    else parts.push("volume ~equal");
  }

  parts.push(`latency K:${k.latency_ms}ms P:${p.latency_ms}ms`);
  return parts.join(" | ");
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function fmt(n: number | null, decimals = 2): string {
  if (n === null) return "-";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(decimals);
}

// --- Main ---

async function main() {
  console.log("\n=== Polymarket vs Kalshi: API Comparison ===\n");
  console.log("Running searches across both platforms...\n");

  const results: ComparisonResult[] = [];

  for (const { query, type } of QUERIES) {
    process.stderr.write(`  Searching "${query}"...`);

    // Run both searches in parallel
    const [kalshi, polymarket] = await Promise.all([
      searchKalshi(query),
      searchPolymarket(query),
    ]);

    const verdict = summarize(kalshi, polymarket, query);
    results.push({ query, thesis_type: type, kalshi, polymarket, verdict });
    process.stderr.write(` done\n`);
  }

  // --- Output Results ---

  console.log("─".repeat(100));
  console.log("SECTION 1: MARKET UNIVERSE COVERAGE");
  console.log("─".repeat(100));
  console.log("");
  console.log(
    pad("Query", 15) +
    pad("Type", 12) +
    pad("Kalshi", 10) +
    pad("Polymarket", 12) +
    "Verdict"
  );
  console.log("─".repeat(100));

  for (const r of results) {
    console.log(
      pad(r.query, 15) +
      pad(r.thesis_type, 12) +
      pad(r.kalshi.error ? "ERR" : String(r.kalshi.market_count), 10) +
      pad(r.polymarket.error ? "ERR" : String(r.polymarket.market_count), 12) +
      r.verdict
    );
  }

  console.log("");
  console.log("─".repeat(100));
  console.log("SECTION 2: TOP MARKETS PER QUERY (side-by-side)");
  console.log("─".repeat(100));

  for (const r of results) {
    console.log(`\n  "${r.query}" (${r.thesis_type})`);

    if (r.kalshi.markets.length > 0) {
      console.log(`  KALSHI (${r.kalshi.market_count} markets, ${r.kalshi.latency_ms}ms):`);
      for (const m of r.kalshi.markets.slice(0, 3)) {
        console.log(
          `    ${pad(m.id, 25)} ` +
          `prob=${m.price !== null ? (m.price * 100).toFixed(1) + "%" : "n/a"}  ` +
          `vol=${fmt(m.volume)}  ` +
          `OI=${fmt(m.liquidity)}  ` +
          `${trunc(m.title, 50)}`
        );
      }
    } else {
      console.log(`  KALSHI: ${r.kalshi.error || "no markets"}`);
    }

    if (r.polymarket.markets.length > 0) {
      console.log(`  POLYMARKET (${r.polymarket.market_count} markets, ${r.polymarket.latency_ms}ms):`);
      for (const m of r.polymarket.markets.slice(0, 3)) {
        console.log(
          `    ${pad(trunc(m.id, 22), 25)} ` +
          `prob=${m.price !== null ? (m.price * 100).toFixed(1) + "%" : "n/a"}  ` +
          `vol=${fmt(m.volume)}  ` +
          `liq=${fmt(m.liquidity)}  ` +
          `${trunc(m.title, 50)}`
        );
      }
    } else {
      console.log(`  POLYMARKET: ${r.polymarket.error || "no markets"}`);
    }
  }

  console.log("");
  console.log("─".repeat(100));
  console.log("SECTION 3: DATA SHAPE COMPARISON");
  console.log("─".repeat(100));

  // Analyze what fields each platform provides
  const kalshiFields = { price: 0, volume: 0, liquidity: 0, end_date: 0, total: 0 };
  const polyFields = { price: 0, volume: 0, liquidity: 0, end_date: 0, total: 0 };

  for (const r of results) {
    for (const m of r.kalshi.markets) {
      kalshiFields.total++;
      if (m.price !== null) kalshiFields.price++;
      if (m.volume !== null) kalshiFields.volume++;
      if (m.liquidity !== null) kalshiFields.liquidity++;
      if (m.end_date !== null) kalshiFields.end_date++;
    }
    for (const m of r.polymarket.markets) {
      polyFields.total++;
      if (m.price !== null) polyFields.price++;
      if (m.volume !== null) polyFields.volume++;
      if (m.liquidity !== null) polyFields.liquidity++;
      if (m.end_date !== null) polyFields.end_date++;
    }
  }

  console.log("");
  console.log("  Field completeness (% of markets with non-null values):");
  console.log("");
  console.log(
    pad("Field", 15) +
    pad("Kalshi", 20) +
    "Polymarket"
  );
  console.log("─".repeat(55));
  for (const field of ["price", "volume", "liquidity", "end_date"] as const) {
    const kPct = kalshiFields.total > 0 ? ((kalshiFields[field] / kalshiFields.total) * 100).toFixed(0) + "%" : "n/a";
    const pPct = polyFields.total > 0 ? ((polyFields[field] / polyFields.total) * 100).toFixed(0) + "%" : "n/a";
    console.log(
      pad(field, 15) +
      pad(`${kPct} (${kalshiFields[field]}/${kalshiFields.total})`, 20) +
      `${pPct} (${polyFields[field]}/${polyFields.total})`
    );
  }

  console.log("");
  console.log("─".repeat(100));
  console.log("SECTION 4: LATENCY COMPARISON");
  console.log("─".repeat(100));
  console.log("");

  const kLatencies = results.map(r => r.kalshi.latency_ms);
  const pLatencies = results.map(r => r.polymarket.latency_ms);

  console.log(`  Kalshi     avg=${Math.round(avg(kLatencies))}ms  min=${Math.min(...kLatencies)}ms  max=${Math.max(...kLatencies)}ms`);
  console.log(`  Polymarket avg=${Math.round(avg(pLatencies))}ms  min=${Math.min(...pLatencies)}ms  max=${Math.max(...pLatencies)}ms`);

  console.log("");
  console.log("─".repeat(100));
  console.log("SECTION 5: ROUTING IMPLICATIONS");
  console.log("─".repeat(100));
  console.log("");

  // Categorize: Kalshi-only, Poly-only, Both, Neither
  const kalshiOnly = results.filter(r => r.kalshi.market_count > 0 && r.polymarket.market_count === 0);
  const polyOnly = results.filter(r => r.kalshi.market_count === 0 && r.polymarket.market_count > 0);
  const both = results.filter(r => r.kalshi.market_count > 0 && r.polymarket.market_count > 0);
  const neither = results.filter(r => r.kalshi.market_count === 0 && r.polymarket.market_count === 0);

  console.log(`  Kalshi-only:     ${kalshiOnly.map(r => r.query).join(", ") || "none"}`);
  console.log(`  Polymarket-only: ${polyOnly.map(r => r.query).join(", ") || "none"}`);
  console.log(`  Both platforms:  ${both.map(r => r.query).join(", ") || "none"}`);
  console.log(`  Neither:         ${neither.map(r => r.query).join(", ") || "none"}`);

  console.log("");

  // Output raw JSON for further analysis
  const outputPath = __dirname + "/results/polymarket-vs-kalshi.json";
  await Bun.write(outputPath, JSON.stringify(results, null, 2));
  console.log(`  Raw data saved to: ${outputPath}`);
  console.log("");
}

function pad(s: string, len: number): string {
  return s.padEnd(len);
}

function trunc(s: string, len: number): string {
  return s.length > len ? s.slice(0, len - 3) + "..." : s;
}

main().catch((err) => {
  console.error("[polymarket-vs-kalshi] Fatal:", err);
  process.exit(1);
});
