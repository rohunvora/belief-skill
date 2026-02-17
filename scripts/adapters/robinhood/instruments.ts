/**
 * Robinhood/Yahoo Finance Instrument Validator
 *
 * Takes Claude-proposed tickers, validates against Yahoo Finance,
 * and returns enriched instrument data with live prices.
 *
 * This replaced a hardcoded 195-ticker curated list. Claude proposes
 * tickers from its own knowledge; this script validates they exist
 * and enriches with live market data.
 *
 * Usage:
 *   bun run scripts/adapters/robinhood/instruments.ts "HIMS,NVO,LLY,SQQQ"
 *   bun run scripts/adapters/robinhood/instruments.ts "BAH PLTR LMT"
 *   bun run scripts/adapters/robinhood/instruments.ts "NVDA"
 */

import YahooFinance from "yahoo-finance2";
import type { InstrumentMatch, AdapterInstrumentResult } from "../../types.js";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// ---------------------------------------------------------------------------
// Known leveraged ETFs — low fragility, changes rarely.
// Kept here for auto-detection of leverage factor and inverse status.
// ---------------------------------------------------------------------------

const LEVERAGED_ETFS: Record<string, { leverage: number; inverse: boolean }> = {
  // 3x bull
  DFEN: { leverage: 3, inverse: false },
  SOXL: { leverage: 3, inverse: false },
  TQQQ: { leverage: 3, inverse: false },
  SPXL: { leverage: 3, inverse: false },
  TMF:  { leverage: 3, inverse: false },
  LABU: { leverage: 3, inverse: false },
  YINN: { leverage: 3, inverse: false },
  DRN:  { leverage: 3, inverse: false },
  // 3x bear
  SQQQ: { leverage: 3, inverse: true },
  SPXS: { leverage: 3, inverse: true },
  TMV:  { leverage: 3, inverse: true },
  YANG: { leverage: 3, inverse: true },
  LABD: { leverage: 3, inverse: true },
  DRV:  { leverage: 3, inverse: true },
  // 2x
  TBT:  { leverage: 2, inverse: true },
  SRS:  { leverage: 2, inverse: true },
  ERX:  { leverage: 2, inverse: false },
  ERY:  { leverage: 2, inverse: true },
  NUGT: { leverage: 2, inverse: false },
  DUST: { leverage: 2, inverse: true },
  BITX: { leverage: 2, inverse: false },
  // 1.5x
  UVXY: { leverage: 1.5, inverse: false },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ValidatedInstrument extends InstrumentMatch {
  price?: number;
  market_cap?: number;
  day_change_pct?: number;
  fifty_two_week_high?: number;
  fifty_two_week_low?: number;
  instrument_type: "stock" | "etf" | "leveraged_etf";
  leverage?: number;
  inverse?: boolean;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

async function validateTicker(ticker: string): Promise<ValidatedInstrument | null> {
  try {
    const quote = await yahooFinance.quote(ticker);
    if (!quote || !quote.regularMarketPrice) {
      console.error(`  SKIP: ${ticker} — no quote data (delisted or invalid)`);
      return null;
    }

    const leveraged = LEVERAGED_ETFS[ticker];
    const isETF = quote.quoteType === "ETF";
    const instrumentType: "stock" | "etf" | "leveraged_etf" = leveraged
      ? "leveraged_etf"
      : isETF ? "etf" : "stock";

    return {
      ticker,
      name: quote.shortName || quote.longName || ticker,
      relevance: "direct",
      why: buildWhy(instrumentType, leveraged),
      price: quote.regularMarketPrice,
      market_cap: quote.marketCap ?? undefined,
      day_change_pct: quote.regularMarketChangePercent ?? undefined,
      fifty_two_week_high: quote.fiftyTwoWeekHigh ?? undefined,
      fifty_two_week_low: quote.fiftyTwoWeekLow ?? undefined,
      instrument_type: instrumentType,
      leverage: leveraged?.leverage,
      inverse: leveraged?.inverse,
    };
  } catch (err) {
    console.error(`  SKIP: ${ticker} — ${(err as Error).message}`);
    return null;
  }
}

function buildWhy(
  type: "stock" | "etf" | "leveraged_etf",
  leveraged?: { leverage: number; inverse: boolean }
): string {
  if (leveraged) {
    const dir = leveraged.inverse ? "inverse (bear)" : "bull";
    return `${leveraged.leverage}x ${dir} leveraged ETF`;
  }
  if (type === "etf") return "Sector/theme ETF — broad exposure";
  return "Individual stock — direct company exposure";
}

// ---------------------------------------------------------------------------
// Main: CLI entry point
// ---------------------------------------------------------------------------

async function main() {
  const input = process.argv.slice(2).join(" ").trim();
  if (!input) {
    console.error("Usage: bun run scripts/adapters/robinhood/instruments.ts \"TICKER1,TICKER2,...\"");
    console.error("Examples:");
    console.error("  bun run scripts/adapters/robinhood/instruments.ts \"HIMS,NVO,LLY,SQQQ\"");
    console.error("  bun run scripts/adapters/robinhood/instruments.ts \"BAH PLTR LMT\"");
    console.error("  bun run scripts/adapters/robinhood/instruments.ts \"NVDA\"");
    process.exit(1);
  }

  // Parse tickers: comma-separated or space-separated
  const tickers = input
    .split(/[,\s]+/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  console.error(`\nValidating ${tickers.length} tickers: ${tickers.join(", ")}\n`);

  // Validate in batches of 10 to avoid overwhelming Yahoo
  const batchSize = 10;
  const validated: ValidatedInstrument[] = [];
  let skipped = 0;

  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(validateTicker));
    for (const r of results) {
      if (r) validated.push(r);
      else skipped++;
    }
  }

  console.error(`\nValidated: ${validated.length}/${tickers.length} (${skipped} skipped)\n`);

  const instruments: InstrumentMatch[] = validated.map((v) => ({
    ticker: v.ticker,
    name: v.name,
    relevance: v.relevance,
    why: v.why,
  }));

  const result: AdapterInstrumentResult & { validated_instruments: ValidatedInstrument[] } = {
    platform: "robinhood",
    instruments,
    search_method: "claude_proposed",
    validated_instruments: validated,
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
