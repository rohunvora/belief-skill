/**
 * Polymarket Instrument Search
 *
 * Usage: bun run scripts/adapters/polymarket/instruments.ts "ukraine ceasefire"
 *
 * Searches Polymarket's public API for active prediction markets matching
 * the given keywords. Filters for relevance (keyword must appear in question)
 * and volume (minimum $1K to skip dead markets).
 */

import type { InstrumentMatch, AdapterInstrumentResult } from "../../types";

const GAMMA_API = "https://gamma-api.polymarket.com";

// In-memory cache: query string -> { data, fetchedAt }
const cache = new Map<string, { data: AdapterInstrumentResult; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const MIN_VOLUME_USD = 1_000; // skip markets with less than $1K total volume

interface PolyEvent {
  id: string;
  title: string;
  slug: string;
  endDate?: string;
  markets?: PolyMarket[];
}

interface PolyMarket {
  conditionId: string;
  question: string;
  groupItemTitle?: string;
  slug?: string;
  active: boolean;
  closed: boolean;
  lastTradePrice?: string;
  bestBid?: string;
  bestAsk?: string;
  volumeNum?: string;
  liquidityNum?: string;
  endDate?: string;
  clobTokenIds?: string[];
}

/**
 * Check if a keyword matches as a whole word in text.
 * Short all-uppercase keywords (likely tickers: SOL, ETH, BTC) use
 * case-sensitive matching to avoid false matches on names (Sol Vega, Ethel).
 */
function keywordMatches(keyword: string, text: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const caseSensitive = keyword.length <= 5 && keyword === keyword.toUpperCase();
  return new RegExp(`\\b${escaped}\\b`, caseSensitive ? "" : "i").test(text);
}

/**
 * Score how well a market question matches the search keywords.
 * Returns null if no keywords match (irrelevant, should be filtered out).
 */
function scoreRelevance(question: string, keywords: string[]): { relevance: "direct" | "proxy" | "lateral"; score: number } | null {
  let matchCount = 0;
  for (const kw of keywords) {
    if (keywordMatches(kw, question)) matchCount++;
  }

  if (matchCount === 0) return null;

  const ratio = matchCount / keywords.length;
  if (ratio >= 0.5) return { relevance: "direct", score: 3 };
  if (matchCount >= 1) return { relevance: "proxy", score: 2 };
  return { relevance: "lateral", score: 1 };
}

async function searchPolymarket(keywords: string[]): Promise<AdapterInstrumentResult> {
  const query = keywords.join(" ");
  const cacheKey = query.toLowerCase();

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    console.error(`[polymarket/instruments] Cache hit for "${query}"`);
    return cached.data;
  }

  const url = `${GAMMA_API}/public-search?q=${encodeURIComponent(query)}&limit_per_type=10&events_status=active`;
  console.error(`[polymarket/instruments] Fetching: ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[polymarket/instruments] Search failed: ${res.status} ${res.statusText}`);
    return { platform: "polymarket", instruments: [], search_method: "public_search" };
  }

  const json = await res.json() as { events?: PolyEvent[] };
  const events = json.events ?? [];

  const instruments: (InstrumentMatch & { score: number })[] = [];

  for (const event of events) {
    const markets = event.markets ?? [];

    for (const market of markets) {
      // Skip closed/inactive markets
      if (market.closed || !market.active) continue;

      const question = market.question || market.groupItemTitle || event.title;

      // Relevance filter: at least one keyword must appear in the question.
      // scoreRelevance returns null if no keywords match.
      const scored = scoreRelevance(question, keywords);
      if (!scored) continue;

      // Volume floor: skip markets with less than $1K volume
      const volume = market.volumeNum ? parseFloat(market.volumeNum) : 0;
      if (volume < MIN_VOLUME_USD) continue;

      const { relevance, score } = scored;

      // Use slug as ticker (human-readable, token-efficient).
      // returns.ts accepts slugs directly, so no need to pass conditionId.
      const slug = market.slug || market.conditionId || "unknown";

      instruments.push({
        ticker: slug,
        name: question,
        relevance,
        why: `$${formatVolume(volume)} vol`,
        score,
      });
    }
  }

  // Sort by score descending, then by volume descending (via the why string as tiebreaker)
  instruments.sort((a, b) => b.score - a.score);

  // Cap at 5 results. The skill only picks 2-3 candidates anyway,
  // and returning 8+ similar markets wastes context tokens.
  const top = instruments.slice(0, 5);

  // Drop the internal score field before returning
  const result: AdapterInstrumentResult = {
    platform: "polymarket",
    instruments: top.map(({ score, ...rest }) => rest),
    search_method: "public_search",
  };

  cache.set(cacheKey, { data: result, fetchedAt: Date.now() });
  return result;
}

function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

// --- CLI entry point ---
async function main() {
  const rawInput = process.argv.slice(2).join(" ").trim();
  if (!rawInput) {
    console.error("Usage: bun run scripts/adapters/polymarket/instruments.ts \"ukraine ceasefire\"");
    process.exit(1);
  }

  const keywords = rawInput.split(/\s+/).filter(Boolean);
  console.error(`[polymarket/instruments] Searching for: ${keywords.join(", ")}`);

  const result = await searchPolymarket(keywords);
  console.error(`[polymarket/instruments] Found ${result.instruments.length} instruments`);

  // Clean JSON to stdout
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("[polymarket/instruments] Fatal error:", err);
  process.exit(1);
});
