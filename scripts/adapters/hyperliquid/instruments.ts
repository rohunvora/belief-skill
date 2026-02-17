/**
 * Hyperliquid instrument validator.
 *
 * Takes Claude-proposed tickers, validates against the live perp list
 * from metaAndAssetCtxs, and returns enriched instrument data.
 *
 * This replaced a hardcoded 70-entry keyword→ticker map. Claude proposes
 * tickers from its own knowledge; this script validates they actually
 * exist as Hyperliquid perps and enriches with live market data.
 *
 * Usage:
 *   bun run scripts/adapters/hyperliquid/instruments.ts "SOL,BTC,ETH"
 *   bun run scripts/adapters/hyperliquid/instruments.ts "FARTCOIN,TRUMP,HYPE"
 *   bun run scripts/adapters/hyperliquid/instruments.ts "SOL"
 */

import type { InstrumentMatch, AdapterInstrumentResult } from "../../types";

const API = "https://api.hyperliquid.xyz/info";

// ---------------------------------------------------------------------------
// API types
// ---------------------------------------------------------------------------

interface HLMeta {
  universe: {
    name: string;
    szDecimals: number;
    maxLeverage: number;
  }[];
}

interface HLAssetCtx {
  funding: string;
  openInterest: string;
  dayNtlVlm: string;
  oraclePx: string;
  markPx: string;
  midPx: string;
  prevDayPx: string;
  premium: string;
}

// Common aliases for tickers that differ on Hyperliquid
const ALIASES: Record<string, string> = {
  PEPE: "kPEPE",
  SHIB: "kSHIB",
  BONK: "kBONK",
  FLOKI: "kFLOKI",
  DOGS: "kDOGS",
  LUNC: "kLUNC",
  NEIRO: "kNEIRO",
};

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchMetaAndCtxs(dex?: string): Promise<{ meta: HLMeta; ctxs: HLAssetCtx[] }> {
  const body: Record<string, string> = { type: "metaAndAssetCtxs" };
  if (dex) body.dex = dex;
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Hyperliquid API error: ${res.status} ${res.statusText}`);
  const [meta, ctxs] = (await res.json()) as [HLMeta, HLAssetCtx[]];
  return { meta, ctxs };
}

function assessLiquidity(dayNtlVlm: number): "high" | "medium" | "low" {
  if (dayNtlVlm >= 100_000_000) return "high";
  if (dayNtlVlm >= 10_000_000) return "medium";
  return "low";
}

// ---------------------------------------------------------------------------
// Validated instrument type
// ---------------------------------------------------------------------------

interface ValidatedPerp extends InstrumentMatch {
  mark_price: number;
  funding_rate_hourly: number;
  funding_rate_annualized_pct: number;
  open_interest_usd: number;
  volume_24h_usd: number;
  max_leverage: number;
  liquidity: "high" | "medium" | "low";
}

// ---------------------------------------------------------------------------
// Main: CLI entry point
// ---------------------------------------------------------------------------

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error("Usage: bun run scripts/adapters/hyperliquid/instruments.ts \"SOL,BTC,ETH\"");
    console.error("Examples:");
    console.error("  bun run scripts/adapters/hyperliquid/instruments.ts \"SOL,BTC,ETH\"");
    console.error("  bun run scripts/adapters/hyperliquid/instruments.ts \"FARTCOIN,TRUMP,HYPE\"");
    console.error("  bun run scripts/adapters/hyperliquid/instruments.ts \"PLTR,SOL,BTC,GOLD\"");
    process.exit(1);
  }

  // Parse tickers: comma-separated or space-separated
  const tickers = input
    .split(/[,\s]+/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  console.error(`\nValidating ${tickers.length} tickers against Hyperliquid perp list...\n`);

  // Fetch BOTH default crypto dex and xyz HIP-3 dex in parallel
  const [defaultData, xyzData] = await Promise.all([
    fetchMetaAndCtxs(),
    fetchMetaAndCtxs("xyz"),
  ]);

  // Build lookup: ticker → { index, dex } for both dexes
  // Default dex entries are stored by raw name (e.g. "SOL")
  // xyz dex entries are stored by both "xyz:PLTR" and "PLTR" (for fallback matching)
  const tickerIndex = new Map<string, { idx: number; dex: "default" | "xyz"; apiName: string }>();

  for (let i = 0; i < defaultData.meta.universe.length; i++) {
    const name = defaultData.meta.universe[i]!.name;
    tickerIndex.set(name, { idx: i, dex: "default", apiName: name });
  }

  for (let i = 0; i < xyzData.meta.universe.length; i++) {
    const name = xyzData.meta.universe[i]!.name; // e.g. "xyz:PLTR"
    tickerIndex.set(name, { idx: i, dex: "xyz", apiName: name });
    // Also allow matching without prefix (e.g. "PLTR" → xyz:PLTR) if not already on default dex
    const stripped = name.startsWith("xyz:") ? name.slice(4) : name;
    if (!tickerIndex.has(stripped)) {
      tickerIndex.set(stripped, { idx: i, dex: "xyz", apiName: name });
    }
  }

  console.error(`Live perps: ${defaultData.meta.universe.length} default + ${xyzData.meta.universe.length} xyz (HIP-3)\n`);

  const validated: ValidatedPerp[] = [];
  let skipped = 0;

  for (const rawTicker of tickers) {
    // Try exact match, then alias, then strip -PERP suffix, then xyz: prefix
    let ticker = rawTicker;
    let match = tickerIndex.get(ticker);

    // Try alias (only applies to default dex crypto tickers)
    if (!match && ALIASES[ticker]) {
      const alias = ALIASES[ticker]!;
      match = tickerIndex.get(alias);
      if (match) {
        console.error(`  ${ticker} -> ${alias} (alias)`);
        ticker = alias;
      }
    }

    // Try stripping -PERP suffix
    if (!match && ticker.endsWith("-PERP")) {
      const base = ticker.replace("-PERP", "");
      match = tickerIndex.get(base);
      if (match) ticker = base;
    }

    // Try xyz: prefix explicitly
    if (!match) {
      match = tickerIndex.get(`xyz:${ticker}`);
      if (match) {
        console.error(`  ${ticker} -> ${match.apiName} (xyz HIP-3 dex)`);
        ticker = match.apiName;
      }
    }

    if (!match) {
      console.error(`  SKIP: ${rawTicker} -- not listed on Hyperliquid (default or xyz dex)`);
      skipped++;
      continue;
    }

    // Select the right data source based on which dex matched
    const data = match.dex === "xyz" ? xyzData : defaultData;
    const info = data.meta.universe[match.idx]!;
    const ctx = data.ctxs[match.idx]!;
    const displayTicker = match.apiName; // preserves xyz: prefix if from xyz dex

    const markPrice = parseFloat(ctx.markPx) || parseFloat(ctx.oraclePx) || 0;
    const funding = parseFloat(ctx.funding) || 0;
    const volume = parseFloat(ctx.dayNtlVlm) || 0;
    const oi = parseFloat(ctx.openInterest) || 0;
    const oraclePrice = parseFloat(ctx.oraclePx) || markPrice;
    const liquidity = assessLiquidity(volume);
    const fundingAnn = Math.round(funding * 24 * 365 * 100 * 100) / 100;

    const priceStr = markPrice >= 1 ? markPrice.toFixed(2) : markPrice.toFixed(6);
    const dexLabel = match.dex === "xyz" ? " [HIP-3]" : "";

    validated.push({
      ticker: `${displayTicker}-PERP`,
      name: `${displayTicker} Perpetual (${info.maxLeverage}x max, ${liquidity} liq)${dexLabel}`,
      relevance: "direct",
      why: `$${priceStr}, ${liquidity} liquidity, up to ${info.maxLeverage}x leverage${dexLabel}`,
      mark_price: markPrice,
      funding_rate_hourly: funding,
      funding_rate_annualized_pct: fundingAnn,
      open_interest_usd: Math.round(oi * oraclePrice),
      volume_24h_usd: Math.round(volume),
      max_leverage: info.maxLeverage,
      liquidity,
    });
  }

  console.error(`\nValidated: ${validated.length}/${tickers.length} (${skipped} skipped)\n`);

  const instruments: InstrumentMatch[] = validated.map((v) => ({
    ticker: v.ticker,
    name: v.name,
    relevance: v.relevance,
    why: v.why,
  }));

  const result: AdapterInstrumentResult & { validated_instruments: ValidatedPerp[] } = {
    platform: "hyperliquid",
    instruments,
    search_method: "claude_proposed",
    validated_instruments: validated,
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
