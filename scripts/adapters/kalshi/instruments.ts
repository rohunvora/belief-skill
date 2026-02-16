/**
 * Kalshi Instrument Search
 *
 * Usage: bun run scripts/adapters/kalshi/instruments.ts "fed rates"
 *
 * Takes keywords from a parsed thesis and returns matching Kalshi markets
 * as InstrumentMatch[] objects.
 */

import type { InstrumentMatch, AdapterInstrumentResult } from "../../types";

const API_BASE = "https://api.elections.kalshi.com/trade-api/v2";

// --- Keyword -> Series Ticker Mapping ---
// Each entry: [keywords that trigger this series, series ticker, human description]
const SERIES_MAP: [string[], string, string][] = [
  // Fed / Rates
  [["fed", "fomc", "interest rate", "fed funds", "federal reserve"], "KXFED", "Fed funds rate per FOMC meeting"],
  [["fed decision", "rate cut", "rate hike", "hold", "pause", "hawkish", "dovish"], "KXFEDDECISION", "Fed decision type per meeting"],
  [["rate cuts", "how many cuts", "number of cuts"], "KXRATECUTS", "Cumulative rate cuts in a year"],
  [["terminal rate", "lowest rate", "neutral rate"], "KXLOWESTRATE", "Lowest fed funds rate reached"],
  [["next hike", "rate hike"], "KXFEDHIKE", "When will the Fed hike next"],
  [["dot plot", "dotplot"], "KXDOTPLOT", "Dot plot median projections"],

  // Inflation
  [["cpi", "inflation"], "KXCPIYOY", "CPI year-over-year"],
  [["core cpi", "core inflation"], "KXCPICOREYOY", "Core CPI year-over-year"],
  [["pce", "core pce"], "KXPCECORE", "PCE core inflation"],

  // Economy
  [["recession", "nber"], "KXRECSSNBER", "NBER recession probability"],
  [["gdp contraction", "quarterly recession", "negative gdp"], "KXQRECESS", "Quarterly GDP contraction"],
  [["gdp", "growth", "economic growth"], "KXGDP", "GDP growth rate"],
  [["gdp boom", "gdp above"], "KXGDPUSMAX", "GDP exceeding thresholds"],
  [["gdp bust", "gdp below"], "KXGDPUSMIN", "GDP falling below thresholds"],

  // Tariffs
  [["tariff", "tariffs", "trade war", "china tariff"], "KXTARIFFPRC", "Tariff rates by country"],
  [["eu tariff", "europe tariff"], "KXTARIFFSEU", "EU-specific tariffs"],
  [["average tariff"], "KXAVGTARIFF", "Average US tariff rate"],

  // Treasury / Bonds
  [["treasury", "10 year", "10y", "bonds", "yields", "bond yield"], "KXTNOTE", "Treasury note yields"],
  [["treasury daily"], "KXTNOTED", "Daily treasury yield"],
  [["yield curve", "10y2y", "curve inversion", "inverted yield"], "KX10Y2Y", "10Y-2Y yield spread"],
  [["10y3m", "term spread"], "KX10Y3M", "10Y-3M yield spread"],

  // Defense
  [["defense spending", "defense budget", "military budget"], "KXDEFENSESPEND", "Defense budget magnitude"],
  [["military spending", "pentagon", "dod spending"], "KXMILSPEND", "Military spending changes"],

  // Crypto
  [["bitcoin", "btc"], "KXBTCMAXY", "Bitcoin price range (annual)"],
  [["ethereum", "eth"], "KXETHMAXY", "Ethereum price range (annual)"],
  [["solana", "sol"], "KXSOLMAXY", "Solana price range (annual)"],
  [["crypto returns", "crypto performance", "crypto market"], "KXCRYPTORETURNY", "Annual crypto returns"],
  [["eth btc", "flippening", "ethereum vs bitcoin"], "BTCETHATH", "ETH vs BTC relative performance"],

  // Daily spot price ranges
  [["bitcoin price today", "btc daily", "bitcoin daily"], "KXBTC", "Bitcoin daily price range"],
  [["ethereum price today", "eth daily", "ethereum daily"], "KXETH", "Ethereum daily price range"],
];

// Simple in-memory cache: series_ticker -> { data, fetchedAt }
const cache = new Map<string, { data: KalshiEvent[]; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface KalshiEvent {
  event_ticker: string;
  title: string;
  category: string;
  series_ticker: string;
  mutually_exclusive: boolean;
  strike_date?: string;
  expected_expiration_time?: string;
  markets?: KalshiMarket[];
}

interface KalshiMarket {
  ticker: string;
  title: string;
  subtitle?: string;
  status: string;
  last_price: number;
  volume: number;
  open_interest: number;
  yes_bid?: number;
  yes_ask?: number;
  expected_expiration_time?: string;
}

/**
 * Match keywords against the series map. Returns all matching series tickers
 * with relevance scoring.
 */
function matchSeries(keywords: string[]): { ticker: string; desc: string; relevance: "direct" | "proxy" | "lateral" }[] {
  const input = keywords.map(k => k.toLowerCase());
  const inputJoined = input.join(" ");
  const matched: { ticker: string; desc: string; relevance: "direct" | "proxy" | "lateral"; score: number }[] = [];
  const seen = new Set<string>();

  for (const [triggers, ticker, desc] of SERIES_MAP) {
    let bestScore = 0;

    for (const trigger of triggers) {
      // Exact phrase match in joined input
      if (inputJoined.includes(trigger)) {
        bestScore = Math.max(bestScore, 3);
        continue;
      }
      // Any individual keyword matches a trigger word
      const triggerWords = trigger.split(" ");
      for (const kw of input) {
        if (triggerWords.includes(kw)) {
          bestScore = Math.max(bestScore, 2);
        }
        // Partial match (keyword is substring of trigger or vice versa, min 3 chars)
        if (kw.length >= 3 && (trigger.includes(kw) || kw.includes(trigger))) {
          bestScore = Math.max(bestScore, 1);
        }
      }
    }

    if (bestScore > 0 && !seen.has(ticker)) {
      seen.add(ticker);
      const relevance = bestScore >= 3 ? "direct" : bestScore >= 2 ? "proxy" : "lateral";
      matched.push({ ticker, desc, relevance, score: bestScore });
    }
  }

  // Sort by score descending
  matched.sort((a, b) => b.score - a.score);
  return matched;
}

/**
 * Fetch events for a given series ticker from Kalshi API.
 * Uses cache with TTL.
 */
async function fetchEvents(seriesTicker: string): Promise<KalshiEvent[]> {
  const cached = cache.get(seriesTicker);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `${API_BASE}/events?series_ticker=${seriesTicker}&status=open&limit=50`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error(`[kalshi/instruments] Failed to fetch events for ${seriesTicker}: ${res.status} ${res.statusText}`);
    return [];
  }

  const json = await res.json() as { events: KalshiEvent[] };
  const events = json.events ?? [];

  cache.set(seriesTicker, { data: events, fetchedAt: Date.now() });
  return events;
}

/**
 * Build InstrumentMatch[] from matched series.
 * Fetches live events from the API, then creates one match per event.
 */
async function findInstruments(keywords: string[]): Promise<AdapterInstrumentResult> {
  const seriesMatches = matchSeries(keywords);

  if (seriesMatches.length === 0) {
    return { platform: "kalshi", instruments: [], search_method: "series_ticker" };
  }

  const instruments: InstrumentMatch[] = [];

  // Fetch all matched series in parallel
  const fetchResults = await Promise.all(
    seriesMatches.map(async (s) => {
      const events = await fetchEvents(s.ticker);
      return { ...s, events };
    })
  );

  for (const { ticker: seriesTicker, desc, relevance, events } of fetchResults) {
    if (events.length === 0) {
      // Series exists but no open events -- still report it
      instruments.push({
        ticker: seriesTicker,
        name: desc,
        relevance,
        why: `Series ${seriesTicker} matched but has no currently open events`,
      });
      continue;
    }

    for (const event of events) {
      instruments.push({
        ticker: event.event_ticker,
        name: event.title,
        relevance,
        why: `${desc} -- ${event.title}`,
      });
    }
  }

  return {
    platform: "kalshi",
    instruments,
    search_method: "series_ticker",
  };
}

// --- CLI entry point ---
async function main() {
  const rawInput = process.argv.slice(2).join(" ").trim();
  if (!rawInput) {
    console.error("Usage: bun run scripts/adapters/kalshi/instruments.ts \"fed rates\"");
    process.exit(1);
  }

  // Split input into keywords
  const keywords = rawInput.split(/\s+/).filter(Boolean);
  console.error(`[kalshi/instruments] Searching for: ${keywords.join(", ")}`);

  const result = await findInstruments(keywords);
  console.error(`[kalshi/instruments] Found ${result.instruments.length} instruments`);

  // Output clean JSON to stdout
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("[kalshi/instruments] Fatal error:", err);
  process.exit(1);
});
