/**
 * Research — enriches candidate instruments with market data
 * Sources: Yahoo Finance (stocks/ETFs), CoinGecko batch (major crypto), DexScreener (DEX tokens)
 */

import type { CandidateInstrument, EnrichedInstrument } from "./types";
import { batchFetchCoinGecko, fetchDexScreener } from "./crypto-prices";

const CACHE_DIR = new URL("../data/cache/", import.meta.url).pathname;
const STOCK_TTL = 24 * 60 * 60 * 1000; // 24h

interface CacheEntry<T> { data: T; fetched_at: number; ttl_ms: number; }

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const file = Bun.file(`${CACHE_DIR}${key}.json`);
    if (!await file.exists()) return null;
    const entry: CacheEntry<T> = JSON.parse(await file.text());
    if (Date.now() - entry.fetched_at > entry.ttl_ms) return null;
    return entry.data;
  } catch { return null; }
}

async function writeCache<T>(key: string, data: T, ttl_ms: number): Promise<void> {
  await Bun.write(`${CACHE_DIR}${key}.json`, JSON.stringify({ data, fetched_at: Date.now(), ttl_ms }));
}

let _yf: any = null;
async function getYahoo() {
  if (!_yf) {
    const YF = (await import("yahoo-finance2")).default;
    _yf = new YF({ suppressNotices: ['yahooSurvey'] });
  }
  return _yf;
}

async function fetchStockData(ticker: string): Promise<Partial<EnrichedInstrument> | null> {
  const cached = await readCache<Partial<EnrichedInstrument>>(`stock_${ticker}`);
  if (cached) return cached;
  try {
    const yf = await getYahoo();
    const q = await yf.quote(ticker);
    if (!q || !q.regularMarketPrice) return null;
    const data: Partial<EnrichedInstrument> = {
      name: q.shortName || q.longName || ticker,
      price: q.regularMarketPrice,
      market_cap: q.marketCap,
      pe_ratio: q.trailingPE,
      volume_24h: q.regularMarketVolume,
    };
    await writeCache(`stock_${ticker}`, data, STOCK_TTL);
    return data;
  } catch (e) {
    console.error(`   ⚠️ Yahoo Finance failed for ${ticker}: ${(e as Error).message}`);
    return null;
  }
}

export async function enrichInstruments(candidates: CandidateInstrument[]): Promise<EnrichedInstrument[]> {
  const stocks = candidates.filter(c => c.asset_class === "stock" || c.asset_class === "etf");
  const crypto = candidates.filter(c => c.asset_class === "crypto");
  const secondaries = candidates.filter(c => c.asset_class === "secondary");

  // Stocks/ETFs — parallel via Yahoo Finance
  const stockResults = await Promise.all(
    stocks.map(async (c) => {
      const data = await fetchStockData(c.ticker);
      return data ? { ...c, price: 0, ...data } as EnrichedInstrument : null;
    })
  );

  // Crypto — one CoinGecko batch call, DexScreener fallback
  const cgBatch = await batchFetchCoinGecko(crypto.map(c => c.ticker));
  const cryptoResults: (EnrichedInstrument | null)[] = [];
  for (const c of crypto) {
    let data = cgBatch[c.ticker.toUpperCase()] || null;
    if (!data?.price) {
      const dex = await fetchDexScreener(c.ticker);
      if (dex) data = dex;
    }
    if (data) {
      cryptoResults.push({ ...c, price: 0, ...data } as EnrichedInstrument);
    } else {
      // Keep instrument with degraded data — better than dropping it
      cryptoResults.push({ ...c, price: 0, name: c.name || c.ticker, risk_note: "Price data unavailable" } as EnrichedInstrument);
    }
  }

  // Secondaries — no live data, just flag
  const secondaryResults = secondaries.map(c => ({
    ...c, price: 0, risk_note: "Pre-IPO — illiquid, no public pricing",
  } as EnrichedInstrument));

  return [
    ...stockResults.filter(Boolean) as EnrichedInstrument[],
    ...cryptoResults.filter(Boolean) as EnrichedInstrument[],
    ...secondaryResults,
  ];
}

// CLI mode: bun run research.ts --tickers "AAPL,NVDA,SOL,ANDURIL" [--format json|table]
if (import.meta.main) {
  const args = process.argv.slice(2);
  const tickerIdx = args.indexOf("--tickers");
  const formatIdx = args.indexOf("--format");
  const format = formatIdx >= 0 ? args[formatIdx + 1] : "table";

  if (tickerIdx < 0) {
    console.error("Usage: bun run research.ts --tickers 'AAPL,NVDA,SOL' [--format json|table]");
    process.exit(1);
  }

  const tickers = args[tickerIdx + 1].split(",").map(t => t.trim().toUpperCase());
  
  // Auto-classify tickers
  const KNOWN_CRYPTO = new Set(Object.keys((await import("./crypto-prices")).COINGECKO_IDS));
  const DEX_TOKENS = new Set(["HYPE", "TRUMP", "PENGU", "BRETT", "TOSHI", "DEGEN", "AERO", "BONK", "WIF", "PYTH", "JTO", "ORCA"]);
  const SECONDARIES_PATH = new URL("../references/secondaries.json", import.meta.url).pathname;
  let secondaries: Record<string, any> = {};
  try { secondaries = JSON.parse(await Bun.file(SECONDARIES_PATH).text()); } catch {}

  const candidates: CandidateInstrument[] = tickers.map(t => {
    const lower = t.toLowerCase();
    if (secondaries[lower]) return { ticker: t, name: secondaries[lower].name || t, asset_class: "secondary" as const, sub_themes: [], source: "claude" };
    if (KNOWN_CRYPTO.has(t) || DEX_TOKENS.has(t)) return { ticker: t, name: t, asset_class: "crypto" as const, sub_themes: [], source: "claude" };
    return { ticker: t, name: t, asset_class: "stock" as const, sub_themes: [], source: "claude" };
  });

  const enriched = await enrichInstruments(candidates);

  if (format === "json") {
    console.log(JSON.stringify(enriched, null, 2));
  } else {
    for (const e of enriched) {
      const parts = [e.ticker, e.asset_class];
      if (e.price > 0) parts.push(`$${e.price.toFixed(2)}`);
      if (e.market_cap) parts.push(`mcap: $${(e.market_cap / 1e9).toFixed(1)}B`);
      if (e.pe_ratio) parts.push(`PE: ${e.pe_ratio.toFixed(1)}`);
      if (e.risk_note) parts.push(e.risk_note);
      console.log(parts.join(" | "));
    }
  }
}
