/**
 * Yahoo Finance API Validation for belief-skill v2
 *
 * Tests three thesis types:
 *   1. Macro (Fed rates) — bonds, financials
 *   2. Sector (AI defense spending) — defense stocks/ETFs
 *   3. Crypto-native (SOL flips ETH) — crypto-adjacent equities
 *
 * For each: quotes, options chains, latency, data quality.
 */

import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

// ── Helpers ──────────────────────────────────────────────────────────────────

interface TimedResult<T> {
  data: T;
  latencyMs: number;
}

async function timed<T>(fn: () => Promise<T>): Promise<TimedResult<T>> {
  const start = performance.now();
  const data = await fn();
  return { data, latencyMs: Math.round(performance.now() - start) };
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "N/A";
  if (typeof v === "number") return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return String(v);
}

// ── Quote Test ───────────────────────────────────────────────────────────────

interface QuoteResult {
  symbol: string;
  price: number | null;
  previousClose: number | null;
  marketCap: number | null;
  volume: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  shortName: string | null;
  quoteType: string | null;
  allFields: string[];
  latencyMs: number;
  error: string | null;
}

async function testQuote(symbol: string): Promise<QuoteResult> {
  try {
    const { data, latencyMs } = await timed(() => yahooFinance.quote(symbol));
    const q = data as any;
    return {
      symbol,
      price: q.regularMarketPrice ?? null,
      previousClose: q.regularMarketPreviousClose ?? null,
      marketCap: q.marketCap ?? null,
      volume: q.regularMarketVolume ?? null,
      fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? null,
      shortName: q.shortName ?? null,
      quoteType: q.quoteType ?? null,
      allFields: Object.keys(q),
      latencyMs,
      error: null,
    };
  } catch (e: any) {
    return {
      symbol,
      price: null,
      previousClose: null,
      marketCap: null,
      volume: null,
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
      shortName: null,
      quoteType: null,
      allFields: [],
      latencyMs: 0,
      error: e.message ?? String(e),
    };
  }
}

// ── Options Chain Test ───────────────────────────────────────────────────────

interface OptionsResult {
  symbol: string;
  expirationDates: string[];
  numCalls: number;
  numPuts: number;
  sampleCall: Record<string, unknown> | null;
  samplePut: Record<string, unknown> | null;
  hasGreeks: boolean;
  hasBidAsk: boolean;
  hasOpenInterest: boolean;
  hasImpliedVolatility: boolean;
  latencyMs: number;
  error: string | null;
}

async function testOptions(symbol: string): Promise<OptionsResult> {
  try {
    const { data, latencyMs } = await timed(() =>
      yahooFinance.options(symbol)
    );
    const d = data as any;
    const calls = d.options?.[0]?.calls ?? [];
    const puts = d.options?.[0]?.puts ?? [];
    const sampleCall = calls[Math.floor(calls.length / 2)] ?? null;
    const samplePut = puts[Math.floor(puts.length / 2)] ?? null;

    const expirationDates = (d.expirationDates ?? []).map((d: Date) =>
      d.toISOString().slice(0, 10)
    );

    const hasGreeks =
      sampleCall &&
      ("impliedVolatility" in sampleCall || "gamma" in sampleCall || "delta" in sampleCall);
    const hasBidAsk = sampleCall && "bid" in sampleCall && "ask" in sampleCall;
    const hasOpenInterest = sampleCall && "openInterest" in sampleCall;
    const hasImpliedVolatility = sampleCall && "impliedVolatility" in sampleCall;

    return {
      symbol,
      expirationDates,
      numCalls: calls.length,
      numPuts: puts.length,
      sampleCall: sampleCall ? Object.fromEntries(Object.entries(sampleCall)) : null,
      samplePut: samplePut ? Object.fromEntries(Object.entries(samplePut)) : null,
      hasGreeks: !!hasGreeks,
      hasBidAsk: !!hasBidAsk,
      hasOpenInterest: !!hasOpenInterest,
      hasImpliedVolatility: !!hasImpliedVolatility,
      latencyMs,
      error: null,
    };
  } catch (e: any) {
    return {
      symbol,
      expirationDates: [],
      numCalls: 0,
      numPuts: 0,
      sampleCall: null,
      samplePut: null,
      hasGreeks: false,
      hasBidAsk: false,
      hasOpenInterest: false,
      hasImpliedVolatility: false,
      latencyMs: 0,
      error: e.message ?? String(e),
    };
  }
}

// ── Print Helpers ────────────────────────────────────────────────────────────

function printQuoteTable(results: QuoteResult[]) {
  console.log(
    "\n  Symbol     | Price      | Prev Close | Mkt Cap         | Volume       | 52w High | 52w Low  | Type   | Latency"
  );
  console.log("  " + "-".repeat(115));
  for (const r of results) {
    if (r.error) {
      console.log(`  ${r.symbol.padEnd(11)}| ERROR: ${r.error}`);
      continue;
    }
    console.log(
      `  ${r.symbol.padEnd(11)}| $${fmt(r.price).padEnd(9)}| $${fmt(r.previousClose).padEnd(9)}| $${fmt(r.marketCap).padEnd(14)}| ${fmt(r.volume).padEnd(12)}| $${fmt(r.fiftyTwoWeekHigh).padEnd(7)}| $${fmt(r.fiftyTwoWeekLow).padEnd(7)}| ${(r.quoteType ?? "").padEnd(6)}| ${r.latencyMs}ms`
    );
  }
}

function printOptionsResult(r: OptionsResult) {
  if (r.error) {
    console.log(`\n  OPTIONS ${r.symbol}: ERROR — ${r.error}`);
    return;
  }
  console.log(`\n  OPTIONS ${r.symbol} (${r.latencyMs}ms):`);
  console.log(`    Expiration dates: ${r.expirationDates.length} available`);
  console.log(`      First 5: ${r.expirationDates.slice(0, 5).join(", ")}`);
  console.log(`      Last:    ${r.expirationDates[r.expirationDates.length - 1]}`);
  console.log(`    Calls: ${r.numCalls}  |  Puts: ${r.numPuts}`);
  console.log(`    Has bid/ask:           ${r.hasBidAsk}`);
  console.log(`    Has open interest:     ${r.hasOpenInterest}`);
  console.log(`    Has implied vol:       ${r.hasImpliedVolatility}`);
  console.log(`    Has greeks (δ/γ):      ${r.hasGreeks}`);

  if (r.sampleCall) {
    console.log(`    Sample CALL (mid-chain):`);
    const c = r.sampleCall as any;
    console.log(
      `      Strike: $${fmt(c.strike)} | Last: $${fmt(c.lastPrice)} | Bid: $${fmt(c.bid)} | Ask: $${fmt(c.ask)} | IV: ${fmt(c.impliedVolatility)} | OI: ${fmt(c.openInterest)} | Vol: ${fmt(c.volume)}`
    );
    console.log(`      All fields: ${Object.keys(c).join(", ")}`);
  }
  if (r.samplePut) {
    console.log(`    Sample PUT (mid-chain):`);
    const p = r.samplePut as any;
    console.log(
      `      Strike: $${fmt(p.strike)} | Last: $${fmt(p.lastPrice)} | Bid: $${fmt(p.bid)} | Ask: $${fmt(p.ask)} | IV: ${fmt(p.impliedVolatility)} | OI: ${fmt(p.openInterest)} | Vol: ${fmt(p.volume)}`
    );
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(80));
  console.log("  YAHOO FINANCE API VALIDATION — belief-skill v2");
  console.log("  " + new Date().toISOString());
  console.log("=".repeat(80));

  // ── Thesis 1: Fed keeps rates higher for longer (Macro) ──
  console.log("\n\n━━━ THESIS 1: Fed keeps rates higher for longer (Macro) ━━━");
  const macroSymbols = ["TLT", "TBT", "XLF", "JPM", "SHY"];
  console.log("  Testing quotes for:", macroSymbols.join(", "));
  const macroQuotes = await Promise.all(macroSymbols.map(testQuote));
  printQuoteTable(macroQuotes);

  console.log("\n  Testing options chain for TLT...");
  const tltOptions = await testOptions("TLT");
  printOptionsResult(tltOptions);

  // ── Thesis 2: AI defense spending will boom (Sector) ──
  console.log("\n\n━━━ THESIS 2: AI defense spending will boom (Sector) ━━━");
  const defenseSymbols = ["BAH", "PLTR", "LMT", "NOC", "RTX", "ITA", "DFEN"];
  console.log("  Testing quotes for:", defenseSymbols.join(", "));
  const defenseQuotes = await Promise.all(defenseSymbols.map(testQuote));
  printQuoteTable(defenseQuotes);

  console.log("\n  Testing options chain for PLTR...");
  const pltrOptions = await testOptions("PLTR");
  printOptionsResult(pltrOptions);

  // ── Thesis 3: Solana flips Ethereum in DEX volume (Crypto-native) ──
  console.log("\n\n━━━ THESIS 3: Solana flips Ethereum (Crypto-native via equities) ━━━");
  const cryptoSymbols = ["COIN", "BITO", "ETHA", "IBIT"];
  console.log("  Testing quotes for:", cryptoSymbols.join(", "));
  const cryptoQuotes = await Promise.all(cryptoSymbols.map(testQuote));
  printQuoteTable(cryptoQuotes);

  console.log("\n  Testing options chain for COIN...");
  const coinOptions = await testOptions("COIN");
  printOptionsResult(coinOptions);

  // ── All fields available on a quote ──
  console.log("\n\n━━━ FULL FIELD INVENTORY (from TLT quote) ━━━");
  const tltQuote = macroQuotes.find((q) => q.symbol === "TLT");
  if (tltQuote && tltQuote.allFields.length) {
    console.log(`  ${tltQuote.allFields.length} fields available:`);
    console.log(`  ${tltQuote.allFields.join(", ")}`);
  }

  // ── Latency summary ──
  console.log("\n\n━━━ LATENCY SUMMARY ━━━");
  const allQuotes = [...macroQuotes, ...defenseQuotes, ...cryptoQuotes];
  const quoteLats = allQuotes.filter((q) => !q.error).map((q) => q.latencyMs);
  const optLats = [tltOptions, pltrOptions, coinOptions]
    .filter((o) => !o.error)
    .map((o) => o.latencyMs);

  console.log(`  Quotes (${quoteLats.length} calls):`);
  console.log(`    Min: ${Math.min(...quoteLats)}ms  Max: ${Math.max(...quoteLats)}ms  Avg: ${Math.round(quoteLats.reduce((a, b) => a + b, 0) / quoteLats.length)}ms`);
  console.log(`  Options (${optLats.length} calls):`);
  console.log(`    Min: ${Math.min(...optLats)}ms  Max: ${Math.max(...optLats)}ms  Avg: ${Math.round(optLats.reduce((a, b) => a + b, 0) / optLats.length)}ms`);

  // ── Rate limiting test — rapid burst ──
  console.log("\n\n━━━ RATE LIMIT TEST (10 rapid quotes) ━━━");
  const burstStart = performance.now();
  const burstSymbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "SPY", "QQQ", "DIA"];
  try {
    const burstResults = await Promise.all(burstSymbols.map(testQuote));
    const burstEnd = performance.now();
    const errors = burstResults.filter((r) => r.error);
    console.log(`  Fired 10 parallel quote requests in ${Math.round(burstEnd - burstStart)}ms`);
    console.log(`  Successes: ${burstResults.length - errors.length}  Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log(`  Failed symbols: ${errors.map((e) => `${e.symbol}: ${e.error}`).join("; ")}`);
    }
  } catch (e: any) {
    console.log(`  BURST FAILED: ${e.message}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("  VALIDATION COMPLETE");
  console.log("=".repeat(80));
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
