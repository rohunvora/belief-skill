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
    cryptoResults.push(data ? { ...c, price: 0, ...data } as EnrichedInstrument : null);
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
