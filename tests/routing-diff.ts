#!/usr/bin/env bun
/**
 * Routing Diff: How would adding Polymarket change real thesis routing?
 *
 * For each thesis:
 *   1. Shows current routing (which adapters fire today)
 *   2. Queries Polymarket with the same keywords
 *   3. Shows what changes: new primary? supplement? no change?
 *
 * Run: bun run tests/routing-diff.ts
 */

import { execSync } from "child_process";

const POLY_GAMMA = "https://gamma-api.polymarket.com";
const ROOT = __dirname + "/..";

// --- Theses ---
// Mix of the 8 test theses + 4 new ones that stress-test the Polymarket gap

interface Thesis {
  id: string;
  input: string;
  keywords: string[];           // what we'd search adapters with
  current_adapters: string[];   // which adapters fire today
  current_primary: string;      // where the best expression comes from today
}

const THESES: Thesis[] = [
  {
    id: "t1",
    input: "Fed won't cut rates at the March meeting",
    keywords: ["fed", "rates", "march"],
    current_adapters: ["kalshi"],
    current_primary: "kalshi",
  },
  {
    id: "t2",
    input: "NVIDIA is going to $300 on inference demand",
    keywords: ["NVDA"],
    current_adapters: ["robinhood"],
    current_primary: "robinhood",
  },
  {
    id: "t3",
    input: "SOL is going to flip ETH in market cap",
    keywords: ["SOL", "ETH"],
    current_adapters: ["hyperliquid"],
    current_primary: "hyperliquid",
  },
  {
    id: "t4",
    input: "There's going to be a recession this year",
    keywords: ["recession", "2026"],
    current_adapters: ["kalshi"],
    current_primary: "kalshi",
  },
  {
    id: "t5",
    input: "Trump tariffs will crush China but Bitcoin goes to $200K as a hedge",
    keywords: ["trump", "tariffs", "china", "bitcoin"],
    current_adapters: ["kalshi", "hyperliquid", "robinhood"],
    current_primary: "kalshi",
  },
  {
    id: "t6",
    input: "AI will replace Google search",
    keywords: ["AI", "google", "search"],
    current_adapters: ["robinhood"],
    current_primary: "robinhood",
  },
  {
    id: "t7",
    input: "SpaceX IPO will be the biggest in history",
    keywords: ["spacex", "IPO"],
    current_adapters: ["angel"],
    current_primary: "angel",
  },
  {
    id: "t8",
    input: "Ukraine ceasefire by summer — defense stocks will dip",
    keywords: ["ukraine", "ceasefire"],
    current_adapters: ["robinhood"],
    current_primary: "robinhood",
  },
  // --- New theses that stress-test the gap ---
  {
    id: "t9",
    input: "Trump will fire Jerome Powell before his term ends",
    keywords: ["trump", "powell", "fed chair"],
    current_adapters: ["kalshi"],
    current_primary: "kalshi",
  },
  {
    id: "t10",
    input: "OpenAI will release GPT-5 before July",
    keywords: ["openai", "GPT-5"],
    current_adapters: [],
    current_primary: "none",
  },
  {
    id: "t11",
    input: "California will have a major earthquake this year",
    keywords: ["california", "earthquake"],
    current_adapters: [],
    current_primary: "none",
  },
  {
    id: "t12",
    input: "Bitcoin ETF inflows will hit $100B total by end of year",
    keywords: ["bitcoin", "ETF", "inflows"],
    current_adapters: ["kalshi", "hyperliquid"],
    current_primary: "kalshi",
  },
];

// --- Polymarket Search ---

interface PolyMarket {
  title: string;
  price: number | null;
  volume: number | null;
  liquidity: number | null;
  end_date: string | null;
}

async function searchPoly(keywords: string[]): Promise<{ markets: PolyMarket[]; latency_ms: number }> {
  const start = performance.now();
  const query = keywords.join(" ");
  const url = `${POLY_GAMMA}/public-search?q=${encodeURIComponent(query)}&limit_per_type=8&events_status=active`;

  try {
    const res = await fetch(url);
    if (!res.ok) return { markets: [], latency_ms: Math.round(performance.now() - start) };
    const json = await res.json() as any;
    const events = json.events ?? [];
    const markets: PolyMarket[] = [];

    for (const event of events) {
      for (const m of (event.markets ?? []).slice(0, 2)) {
        const lastPrice = m.lastTradePrice ? parseFloat(m.lastTradePrice) : null;
        markets.push({
          title: m.question || m.groupItemTitle || event.title,
          price: lastPrice,
          volume: m.volumeNum ? parseFloat(m.volumeNum) : null,
          liquidity: m.liquidityNum ? parseFloat(m.liquidityNum) : null,
          end_date: m.endDate || event.endDate || null,
        });
      }
    }

    return { markets, latency_ms: Math.round(performance.now() - start) };
  } catch {
    return { markets: [], latency_ms: Math.round(performance.now() - start) };
  }
}

// --- Kalshi Search (via our adapter) ---

interface KalshiResult {
  market_count: number;
  top_markets: { ticker: string; title: string }[];
  latency_ms: number;
}

function searchKalshi(keywords: string[]): KalshiResult {
  const start = performance.now();
  try {
    const raw = execSync(
      `bun run scripts/adapters/kalshi/instruments.ts "${keywords.join(" ")}"`,
      { cwd: ROOT, timeout: 15_000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    );
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { market_count: 0, top_markets: [], latency_ms: Math.round(performance.now() - start) };
    const parsed = JSON.parse(jsonMatch[0]);
    const instruments = parsed.instruments ?? [];
    return {
      market_count: instruments.length,
      top_markets: instruments.slice(0, 3).map((i: any) => ({ ticker: i.ticker, title: i.name })),
      latency_ms: Math.round(performance.now() - start),
    };
  } catch {
    return { market_count: 0, top_markets: [], latency_ms: Math.round(performance.now() - start) };
  }
}

// --- Routing Decision ---

type RoutingChange = "new_primary" | "better_supplement" | "comparable" | "no_change" | "polymarket_only";

function decideRouting(thesis: Thesis, polyResult: { markets: PolyMarket[] }, kalshiResult: KalshiResult): {
  change: RoutingChange;
  reason: string;
  recommended_primary: string;
} {
  const polyCount = polyResult.markets.length;
  const polyTopVol = polyResult.markets[0]?.volume ?? 0;
  const polyTopLiq = polyResult.markets[0]?.liquidity ?? 0;
  const polyHasPrice = polyResult.markets.some(m => m.price !== null);

  // Case 1: No current adapter has prediction market coverage, Poly does
  if (thesis.current_primary === "none" && polyCount > 0) {
    return {
      change: "polymarket_only",
      reason: `Currently dead-ends. Polymarket has ${polyCount} markets.`,
      recommended_primary: "polymarket",
    };
  }

  // Case 2: Current primary isn't a prediction market, Poly adds binary event coverage
  if (!["kalshi"].includes(thesis.current_primary) && polyCount > 0 && polyHasPrice) {
    // Check if Poly market is actually relevant (has meaningful volume)
    if (polyTopVol > 10_000) {
      return {
        change: "better_supplement",
        reason: `Adds prediction market angle ($${fmt(polyTopVol)} vol) alongside ${thesis.current_primary}`,
        recommended_primary: thesis.current_primary,
      };
    }
  }

  // Case 3: Kalshi is current primary, Poly also has markets
  if (thesis.current_primary === "kalshi" && polyCount > 0) {
    // Compare coverage
    if (kalshiResult.market_count === 0 && polyCount > 0) {
      return {
        change: "new_primary",
        reason: `Kalshi has no open markets. Polymarket has ${polyCount}.`,
        recommended_primary: "polymarket",
      };
    }
    if (polyTopVol > 1_000_000 && kalshiResult.market_count > 0) {
      return {
        change: "comparable",
        reason: `Both have markets. Poly higher volume ($${fmt(polyTopVol)}), Kalshi has ${kalshiResult.market_count} strike-level markets.`,
        recommended_primary: "kalshi",
      };
    }
    if (polyCount > 0) {
      return {
        change: "comparable",
        reason: `Both cover this. Kalshi: ${kalshiResult.market_count} markets. Poly: ${polyCount} markets.`,
        recommended_primary: "kalshi",
      };
    }
  }

  // Case 4: Poly has nothing
  if (polyCount === 0) {
    return {
      change: "no_change",
      reason: "Polymarket has no markets for this thesis.",
      recommended_primary: thesis.current_primary,
    };
  }

  return {
    change: "no_change",
    reason: `Current routing sufficient.`,
    recommended_primary: thesis.current_primary,
  };
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

function trunc(s: string, len: number): string {
  return s.length > len ? s.slice(0, len - 3) + "..." : s;
}

// --- Main ---

async function main() {
  console.log("\n=== Routing Diff: Before/After Polymarket ===\n");

  const changes: { id: string; thesis: string; change: RoutingChange; detail: string }[] = [];

  for (const thesis of THESES) {
    process.stderr.write(`  ${thesis.id}: "${trunc(thesis.input, 50)}"...`);

    // Run both in parallel
    const [polyResult, kalshiResult] = await Promise.all([
      searchPoly(thesis.keywords),
      Promise.resolve(searchKalshi(thesis.keywords)),
    ]);

    const routing = decideRouting(thesis, polyResult, kalshiResult);

    // --- Print ---
    console.log(`\n${"=".repeat(90)}`);
    console.log(`  ${thesis.id}: "${thesis.input}"`);
    console.log(`${"=".repeat(90)}`);

    console.log(`\n  BEFORE (current routing):`);
    console.log(`    Adapters: ${thesis.current_adapters.length > 0 ? thesis.current_adapters.join(", ") : "none with prediction markets"}`);
    console.log(`    Primary:  ${thesis.current_primary}`);
    if (kalshiResult.market_count > 0) {
      console.log(`    Kalshi:   ${kalshiResult.market_count} markets`);
      for (const m of kalshiResult.top_markets) {
        console.log(`              ${m.ticker}: ${trunc(m.title, 60)}`);
      }
    }

    console.log(`\n  POLYMARKET SEARCH (${polyResult.latency_ms}ms):`);
    if (polyResult.markets.length === 0) {
      console.log(`    No markets found`);
    } else {
      console.log(`    ${polyResult.markets.length} markets found:`);
      for (const m of polyResult.markets.slice(0, 4)) {
        const prob = m.price !== null ? `${(m.price * 100).toFixed(0)}%` : "n/a";
        const vol = m.volume !== null ? `$${fmt(m.volume)}` : "n/a";
        console.log(`    ${prob.padEnd(6)} vol=${vol.padEnd(8)} ${trunc(m.title, 58)}`);
      }
    }

    const changeIcon = {
      new_primary: ">>>",
      polymarket_only: "+++",
      better_supplement: " + ",
      comparable: " ~ ",
      no_change: " = ",
    }[routing.change];

    console.log(`\n  AFTER (with Polymarket):`);
    console.log(`    [${changeIcon}] ${routing.reason}`);
    console.log(`    Recommended primary: ${routing.recommended_primary}`);

    changes.push({
      id: thesis.id,
      thesis: thesis.input,
      change: routing.change,
      detail: routing.reason,
    });

    process.stderr.write(` done\n`);
  }

  // --- Summary ---
  console.log(`\n${"=".repeat(90)}`);
  console.log("SUMMARY");
  console.log(`${"=".repeat(90)}\n`);

  const byChange: Record<RoutingChange, typeof changes> = {
    polymarket_only: [],
    new_primary: [],
    better_supplement: [],
    comparable: [],
    no_change: [],
  };
  for (const c of changes) byChange[c.change].push(c);

  const labels: Record<RoutingChange, string> = {
    polymarket_only: "+++ NEW COVERAGE (was dead-end)",
    new_primary:     ">>> NEW PRIMARY (replaces current)",
    better_supplement: " +  SUPPLEMENT (adds prediction market angle)",
    comparable:      " ~  COMPARABLE (both platforms cover it)",
    no_change:       " =  NO CHANGE (Polymarket adds nothing)",
  };

  for (const [change, label] of Object.entries(labels) as [RoutingChange, string][]) {
    const items = byChange[change];
    if (items.length === 0) continue;
    console.log(`  ${label}:`);
    for (const item of items) {
      console.log(`    ${item.id}: "${trunc(item.thesis, 55)}" -- ${item.detail}`);
    }
    console.log("");
  }

  const total = changes.length;
  const improved = changes.filter(c => c.change !== "no_change").length;
  console.log(`  ${improved}/${total} theses improved by adding Polymarket.\n`);

  // Save raw data
  const outputPath = __dirname + "/results/routing-diff.json";
  await Bun.write(outputPath, JSON.stringify(changes, null, 2));
  console.log(`  Raw data: ${outputPath}\n`);
}

main().catch((err) => {
  console.error("[routing-diff] Fatal:", err);
  process.exit(1);
});
