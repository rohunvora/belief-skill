/**
 * Hyperliquid return profile calculator.
 * Computes TradeExpression for a leveraged perp position.
 *
 * Usage:
 *   bun run scripts/adapters/hyperliquid/returns.ts "SOL" "long" "5"
 *   bun run scripts/adapters/hyperliquid/returns.ts "BTC" "short" "10"
 *   bun run scripts/adapters/hyperliquid/returns.ts "ETH" "long" "3"
 */

import type { TradeExpression, ReturnProfile, Liquidity } from "../../types";

const API = "https://api.hyperliquid.xyz/info";

// ── Scenario assumptions ────────────────────────────────────────────
// Defaults used only when candle-based realized vol is unavailable.
const FALLBACK_MOVE_RIGHT_PCT = 0.20;
const FALLBACK_MOVE_WRONG_PCT = 0.15;
const HOLDING_PERIOD_HOURS = 30 * 24; // 30 days (720 hours)

// ── API types ───────────────────────────────────────────────────────

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

// ── API helpers ─────────────────────────────────────────────────────

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

// ── Realized volatility from candles ────────────────────────────────

interface CandleData {
  t: number;  // open time (ms)
  o: string;  // open
  h: string;  // high
  l: string;  // low
  c: string;  // close
  v: string;  // volume
}

/**
 * Fetch 30 daily candles and compute annualized realized volatility.
 * Returns the 30-day expected move (vol × √(30/365)) on success, null on failure.
 */
async function fetchRealizedVol(coin: string): Promise<{
  moveRight: number;
  moveWrong: number;
  annualizedVol: number;
} | null> {
  try {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "candleSnapshot",
        req: {
          coin,
          interval: "1d",
          startTime: thirtyDaysAgo,
          endTime: now,
        },
      }),
    });

    if (!res.ok) return null;
    const candles = (await res.json()) as CandleData[];

    if (!candles || candles.length < 10) return null; // Need enough data points

    // Compute daily log returns
    const closes = candles.map((c) => parseFloat(c.c)).filter((c) => c > 0);
    if (closes.length < 10) return null;

    const logReturns: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      logReturns.push(Math.log(closes[i]! / closes[i - 1]!));
    }

    // Daily volatility = stdev of log returns
    const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
    const variance = logReturns.reduce((a, b) => a + (b - mean) ** 2, 0) / (logReturns.length - 1);
    const dailyVol = Math.sqrt(variance);

    // Annualized vol (crypto trades 365 days)
    const annualizedVol = dailyVol * Math.sqrt(365);

    // 30-day expected move = annualized_vol × √(30/365)
    const expectedMove30d = annualizedVol * Math.sqrt(30 / 365);

    // Right move: 1 sigma in favorable direction
    // Wrong move: 0.7 sigma adverse (tighter risk management)
    return {
      moveRight: expectedMove30d,
      moveWrong: expectedMove30d * 0.7,
      annualizedVol,
    };
  } catch {
    return null;
  }
}

// ── Liquidity assessment ────────────────────────────────────────────

function assessLiquidity(dayNtlVlm: number): Liquidity {
  if (dayNtlVlm >= 100_000_000) return "high";
  if (dayNtlVlm >= 10_000_000) return "medium";
  return "low";
}

// ── Return calculation ──────────────────────────────────────────────

function computeReturnProfile(params: {
  coin: string;
  direction: "long" | "short";
  leverage: number;
  entryPrice: number;
  maxLeverage: number;
  fundingRate: number; // hourly rate as decimal (e.g. 0.00001)
  dayNtlVlm: number;
  openInterest: number;
  oraclePx: number;
  markPx: number;
  moveIfRightPct: number;
  moveIfWrongPct: number;
  volSource: "realized" | "fallback";
  annualizedVol: number | null;
}): ReturnProfile {
  const {
    coin, direction, leverage, entryPrice, maxLeverage, fundingRate,
    dayNtlVlm, openInterest, oraclePx, markPx,
    moveIfRightPct, moveIfWrongPct, volSource, annualizedVol,
  } = params;

  if (leverage > maxLeverage) {
    throw new Error(`Requested ${leverage}x leverage exceeds max ${maxLeverage}x for ${coin}`);
  }

  const dirMult = direction === "long" ? 1 : -1;
  const capitalRequired = 100;

  // PnL as fraction of margin
  const pnlIfRight = leverage * moveIfRightPct;   // always positive
  const pnlIfWrong = -leverage * moveIfWrongPct;   // always negative

  // Funding cost over holding period
  const fundingCostPct = dirMult * fundingRate * leverage * HOLDING_PERIOD_HOURS;
  const fundingAnnualizedPct = fundingRate * 24 * 365 * 100;

  // Net returns after funding (cap loss at -100% — liquidation prevents worse)
  const returnIfRightPct = (pnlIfRight - fundingCostPct) * 100;
  const returnIfWrongPct = Math.max((pnlIfWrong - fundingCostPct) * 100, -100);

  // Liquidation prices
  const liqPriceLong = entryPrice * (1 - 1 / leverage);
  const liqPriceShort = entryPrice * (1 + 1 / leverage);
  const liqPrice = direction === "long" ? liqPriceLong : liqPriceShort;

  const liquidity = assessLiquidity(dayNtlVlm);
  const expectedReturnMonthly = (returnIfRightPct + returnIfWrongPct) / 2;

  const expression: TradeExpression = {
    platform: "hyperliquid",
    instrument: `${coin}-PERP`,
    instrument_name: `${coin} ${leverage}x ${direction === "long" ? "Long" : "Short"} Perp`,
    direction,
    capital_required: capitalRequired,
    return_if_right_pct: round2(returnIfRightPct),
    return_if_wrong_pct: round2(returnIfWrongPct),
    time_horizon: "30 days",
    leverage,
    liquidity,
    expected_return_monthly: round2(expectedReturnMonthly),
    execution_details: {
      entry_price: round4(entryPrice),
      oracle_price: round4(oraclePx),
      mark_price: round4(markPx),
      liquidation_price: round4(liqPrice),
      max_leverage: maxLeverage,
      funding_rate_hourly: fundingRate,
      funding_rate_annualized_pct: round2(fundingAnnualizedPct),
      funding_cost_30d_pct: round2(fundingCostPct * 100),
      open_interest_usd: round0(openInterest * oraclePx),
      volume_24h_usd: round0(dayNtlVlm),
      scenario_move_right_pct: round2(moveIfRightPct * 100),
      scenario_move_wrong_pct: round2(moveIfWrongPct * 100),
      vol_source: volSource,
      ...(annualizedVol != null && { annualized_vol_pct: round2(annualizedVol * 100) }),
    },
  };

  const fundingDirection = fundingCostPct > 0 ? "pay" : "receive";
  const fundingAbs = Math.abs(fundingCostPct * 100).toFixed(1);
  const volLabel = volSource === "realized"
    ? `30d realized vol: ${round2(annualizedVol! * 100)}% annualized`
    : "using default scenario assumptions";

  return {
    expression,
    confidence_note: `At ${leverage}x, a ${round2(moveIfRightPct * 100)}% favorable move yields ${round2(returnIfRightPct)}% on margin (after funding). ${volLabel}.`,
    risk_note: `Liquidation at $${formatPrice(liqPrice)} (${(100 / leverage).toFixed(1)}% adverse move). You ${fundingDirection} ~${fundingAbs}% funding over 30 days.`,
  };
}

// ── Formatting helpers ──────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function round0(n: number): number {
  return Math.round(n);
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  // Preserve original casing for k-prefixed coins (kPEPE, kBONK, kSHIB)
  const rawCoin = process.argv[2]?.replace(/-PERP$/i, "") ?? "";
  const coin = rawCoin.startsWith("k") ? rawCoin : rawCoin.toUpperCase();
  const direction = process.argv[3]?.toLowerCase() as "long" | "short";
  const leverage = parseFloat(process.argv[4] || "1");

  if (!coin || !direction || !["long", "short"].includes(direction) || isNaN(leverage) || leverage < 1) {
    console.error('Usage: bun run scripts/adapters/hyperliquid/returns.ts "SOL" "long" "5"');
    console.error("  coin:      Ticker (SOL, BTC, ETH, etc.)");
    console.error("  direction: long | short");
    console.error("  leverage:  Multiplier (1-40 depending on asset)");
    process.exit(1);
  }

  // Fetch all perps data
  const { meta, ctxs } = await fetchMetaAndCtxs();

  // Find the coin index
  const idx = meta.universe.findIndex((u) => u.name === coin);
  if (idx === -1) {
    // Try common aliases
    const aliases: Record<string, string> = {
      PEPE: "kPEPE",
      SHIB: "kSHIB",
      BONK: "kBONK",
    };
    const alias = aliases[coin];
    if (alias) {
      const aliasIdx = meta.universe.findIndex((u) => u.name === alias);
      if (aliasIdx !== -1) {
        console.error(`Note: "${coin}" is listed as "${alias}" on Hyperliquid. Using ${alias}.`);
        // Re-run with alias
        process.argv[2] = alias;
        return main();
      }
    }
    console.error(`ERROR: "${coin}" not found on Hyperliquid. Available perps: ${meta.universe.length}`);
    process.exit(1);
  }

  const info = meta.universe[idx];
  const ctx = ctxs[idx];

  const entryPrice = parseFloat(ctx.midPx) || parseFloat(ctx.oraclePx);
  if (!entryPrice || entryPrice <= 0) {
    throw new Error(`Invalid price for ${coin}: midPx=${ctx.midPx}, oraclePx=${ctx.oraclePx}`);
  }

  // Fetch 30-day realized volatility from candle data
  console.error(`Fetching 30d candles for ${coin}...`);
  const volData = await fetchRealizedVol(coin);

  let moveIfRightPct: number;
  let moveIfWrongPct: number;
  let volSource: "realized" | "fallback";
  let annualizedVol: number | null;

  if (volData) {
    moveIfRightPct = volData.moveRight;
    moveIfWrongPct = volData.moveWrong;
    volSource = "realized";
    annualizedVol = volData.annualizedVol;
    console.error(`  30d realized vol: ${(annualizedVol * 100).toFixed(1)}% annualized`);
    console.error(`  Expected move (30d): ±${(volData.moveRight * 100).toFixed(1)}% right, ${(volData.moveWrong * 100).toFixed(1)}% wrong`);
  } else {
    moveIfRightPct = FALLBACK_MOVE_RIGHT_PCT;
    moveIfWrongPct = FALLBACK_MOVE_WRONG_PCT;
    volSource = "fallback";
    annualizedVol = null;
    console.error("  Candle data unavailable — using default move assumptions (20%/15%)");
  }

  const result = computeReturnProfile({
    coin,
    direction,
    leverage,
    entryPrice,
    maxLeverage: info.maxLeverage,
    fundingRate: parseFloat(ctx.funding) || 0,
    dayNtlVlm: parseFloat(ctx.dayNtlVlm) || 0,
    openInterest: parseFloat(ctx.openInterest) || 0,
    oraclePx: parseFloat(ctx.oraclePx) || entryPrice,
    markPx: parseFloat(ctx.markPx) || entryPrice,
    moveIfRightPct,
    moveIfWrongPct,
    volSource,
    annualizedVol,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
