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

async function fetchMetaAndCtxs(): Promise<{ meta: HLMeta; ctxs: HLAssetCtx[] }> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "metaAndAssetCtxs" }),
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
    process.exit(1);
  }

  // Parse tickers: comma-separated or space-separated
  const tickers = input
    .split(/[,\s]+/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  console.error(`\nValidating ${tickers.length} tickers against Hyperliquid perp list...\n`);

  const { meta, ctxs } = await fetchMetaAndCtxs();

  // Build lookup: ticker → index
  const tickerIndex = new Map<string, number>();
  for (let i = 0; i < meta.universe.length; i++) {
    tickerIndex.set(meta.universe[i].name, i);
  }

  console.error(`Live perps: ${meta.universe.length} assets\n`);

  const validated: ValidatedPerp[] = [];
  let skipped = 0;

  for (const rawTicker of tickers) {
    // Try exact match, then alias, then strip -PERP suffix
    let ticker = rawTicker;
    let idx = tickerIndex.get(ticker);

    if (idx === undefined && ALIASES[ticker]) {
      const alias = ALIASES[ticker];
      idx = tickerIndex.get(alias);
      if (idx !== undefined) {
        console.error(`  ${ticker} → ${alias} (alias)`);
        ticker = alias;
      }
    }

    if (idx === undefined && ticker.endsWith("-PERP")) {
      const base = ticker.replace("-PERP", "");
      idx = tickerIndex.get(base);
      if (idx !== undefined) ticker = base;
    }

    if (idx === undefined) {
      console.error(`  SKIP: ${rawTicker} — not listed on Hyperliquid`);
      skipped++;
      continue;
    }

    const info = meta.universe[idx];
    const ctx = ctxs[idx];
    const markPrice = parseFloat(ctx.markPx) || parseFloat(ctx.oraclePx) || 0;
    const funding = parseFloat(ctx.funding) || 0;
    const volume = parseFloat(ctx.dayNtlVlm) || 0;
    const oi = parseFloat(ctx.openInterest) || 0;
    const oraclePrice = parseFloat(ctx.oraclePx) || markPrice;
    const liquidity = assessLiquidity(volume);
    const fundingAnn = Math.round(funding * 24 * 365 * 100 * 100) / 100;

    const priceStr = markPrice >= 1 ? markPrice.toFixed(2) : markPrice.toFixed(6);

    validated.push({
      ticker: `${ticker}-PERP`,
      name: `${ticker} Perpetual (${info.maxLeverage}x max, ${liquidity} liq)`,
      relevance: "direct",
      why: `$${priceStr}, ${liquidity} liquidity, up to ${info.maxLeverage}x leverage`,
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
