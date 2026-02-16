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

  // S&P 500
  [["s&p", "sp500", "s&p 500", "spy", "stock market"], "KXINXY", "S&P 500 yearly range"],
  [["s&p monthly", "sp500 monthly"], "KXINXM", "S&P 500 monthly range"],
  [["s&p weekly", "sp500 weekly"], "KXINXW", "S&P 500 weekly range"],
  [["s&p above", "s&p below", "market crash", "market rally"], "KXINXAB", "S&P 500 above/below threshold"],
  [["s&p max", "market high", "all time high", "ath"], "KXINXMAXY", "S&P 500 yearly max"],

  // Oil / Energy
  [["oil", "crude", "wti", "brent", "petroleum"], "KXOIL", "Oil price monthly range"],
  [["oil weekly", "crude weekly"], "KXWTIW", "WTI oil weekly range"],
  [["oil high", "oil peak", "oil max"], "KXWTIMAX", "WTI oil yearly high"],
  [["oil low", "oil crash", "oil min"], "KXWTIMIN", "WTI oil yearly low"],

  // Gold / Commodities
  [["gold", "gold price", "xau"], "KXGOLD", "Gold price range"],
  [["gold monthly"], "KXGOLDMON", "Gold monthly price range"],

  // Jobs / Employment
  [["unemployment", "jobs", "jobless"], "KXU3", "Unemployment rate"],
  [["payrolls", "nonfarm", "jobs report", "employment"], "KXPAYROLLS", "Monthly jobs numbers"],
  [["unemployment spike", "job losses"], "KXU3MAX", "Unemployment spike threshold"],

  // Mortgage / Housing
  [["mortgage", "mortgage rate", "housing"], "KXFRM", "30-year mortgage rate"],
  [["mortgage high", "rate high"], "KXFRMMAX", "Mortgage rate yearly high"],
  [["housing prices", "home prices"], "KXHOMEUSY", "US housing prices"],

  // Currencies
  [["euro", "eur/usd", "eurusd", "dollar euro"], "KXEURO", "EUR/USD exchange rate"],
  [["yen", "usd/jpy", "usdjpy", "japan yen"], "KXJPY", "USD/JPY exchange rate"],
  [["pound", "gbp", "sterling", "gbp/usd"], "KXGBP", "GBP/USD exchange rate"],
  [["peso", "usd/mxn", "mexico"], "KXPESO", "USD/MXN exchange rate"],

  // US Debt
  [["national debt", "us debt", "debt ceiling"], "KXDEBTLEVEL", "US debt level thresholds"],
  [["debt gdp", "debt ratio"], "KXUSDEBT", "US debt-to-GDP ratio"],

  // Yield Curve
  [["yield inversion", "inverted curve", "disinversion"], "KXYINVERT", "Yield curve inversion status"],

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

// Rate limiting: max concurrent series to fetch (avoids Kalshi 429s)
const MAX_SERIES_FETCH = 6;
const FETCH_DELAY_MS = 150; // delay between sequential fetches

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

      const triggerWords = trigger.split(" ");
      const matchingWords = input.filter(kw => triggerWords.includes(kw));

      if (triggerWords.length === 1) {
        // Single-word trigger: any keyword match = direct hit
        if (matchingWords.length > 0) {
          bestScore = Math.max(bestScore, 2);
        }
      } else {
        // Multi-word trigger (e.g., "bitcoin price today"):
        // Require ≥50% of trigger words to match to avoid "price" alone
        // matching "bitcoin price today"
        const matchRatio = matchingWords.length / triggerWords.length;
        if (matchRatio >= 0.5) {
          bestScore = Math.max(bestScore, 2);
        } else if (matchingWords.length >= 1) {
          // Single word match in multi-word trigger = weak lateral signal
          bestScore = Math.max(bestScore, 1);
        }
      }

      // Partial match: keyword is substring of trigger or vice versa.
      // Require min 4 chars AND keyword must be >40% of trigger length.
      for (const kw of input) {
        if (kw.length >= 4 && !triggerWords.includes(kw) &&
            (trigger.includes(kw) || kw.includes(trigger)) &&
            kw.length / trigger.length > 0.4) {
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

  // Sort by score descending, then filter out lateral matches when we have direct/proxy hits
  matched.sort((a, b) => b.score - a.score);

  // If we have direct or proxy hits, drop lateral matches to reduce noise
  const hasStrongHits = matched.some(m => m.score >= 2);
  const filtered = hasStrongHits ? matched.filter(m => m.score >= 2) : matched;

  return filtered;
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

  // Fetch top series sequentially with delay to avoid Kalshi 429s
  const topMatches = seriesMatches.slice(0, MAX_SERIES_FETCH);
  const fetchResults: { ticker: string; desc: string; relevance: "direct" | "proxy" | "lateral"; events: KalshiEvent[] }[] = [];

  for (const s of topMatches) {
    // Check cache first (no delay needed for cached results)
    const cached = cache.get(s.ticker);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      fetchResults.push({ ...s, events: cached.data });
      continue;
    }
    // Add delay between uncached API calls
    if (fetchResults.length > 0) {
      await new Promise(r => setTimeout(r, FETCH_DELAY_MS));
    }
    const events = await fetchEvents(s.ticker);
    fetchResults.push({ ...s, events });
  }

  for (const { ticker: seriesTicker, desc, relevance, events } of fetchResults) {
    if (events.length === 0) {
      // Series exists but no open events — log it but don't include as tradeable
      console.error(`[kalshi/instruments] Series ${seriesTicker} matched but has no open events — skipping`);
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
