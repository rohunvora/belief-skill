/**
 * Robinhood/Yahoo Finance Return Calculator
 *
 * Given a ticker, direction, and instrument type, computes a TradeExpression
 * with return_if_right, return_if_wrong, and manual execution instructions.
 *
 * Usage:
 *   bun run scripts/adapters/robinhood/returns.ts "BAH" "long" "stock"
 *   bun run scripts/adapters/robinhood/returns.ts "TBT" "long" "etf"
 *   bun run scripts/adapters/robinhood/returns.ts "PLTR" "long" "option"
 */

import YahooFinance from "yahoo-finance2";
import type { TradeExpression, ReturnProfile, Liquidity } from "../../types.js";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// ---------------------------------------------------------------------------
// Known leveraged ETFs and their multipliers
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
  ERY:  { leverage: 2, inverse: true },
  DUST: { leverage: 2, inverse: true },
  // 2x
  TBT:  { leverage: 2, inverse: true },
  SRS:  { leverage: 2, inverse: true },
  ERX:  { leverage: 2, inverse: false },
  NUGT: { leverage: 2, inverse: false },
  BITX: { leverage: 2, inverse: false },
  // 1.5x
  UVXY: { leverage: 1.5, inverse: false },
};

// Inverse ETF pairs: when direction is "short", swap to the inverse and go long
const INVERSE_PAIRS: Record<string, string> = {
  SOXL: "SOXS", TQQQ: "SQQQ", SPXL: "SPXS",
  YINN: "YANG", TMF: "TMV", LABU: "LABD",
  DRN: "DRV", ERX: "ERY", NUGT: "DUST",
  // Reverse mappings
  SOXS: "SOXL", SQQQ: "TQQQ", SPXS: "SPXL",
  YANG: "YINN", TMV: "TMF", LABD: "LABU",
  DRV: "DRN", ERY: "ERX", DUST: "NUGT",
};

type InstrumentType = "stock" | "etf" | "option";

// ---------------------------------------------------------------------------
// Yahoo Finance data fetchers
// ---------------------------------------------------------------------------

interface QuoteData {
  price: number;
  name: string;
  marketCap: number | null;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  fiftyDayAverage: number;
  twoHundredDayAverage: number;
  volume: number;
  quoteType: string; // "EQUITY" | "ETF"
}

// ---------------------------------------------------------------------------
// IV fetcher — grab ATM implied volatility from nearest options chain
// ---------------------------------------------------------------------------

async function fetchIV(ticker: string, currentPrice: number): Promise<number | null> {
  try {
    const opts = await yahooFinance.options(ticker);
    if (!opts?.options?.length) return null;

    const chain = opts.options[0];
    // Find ATM call (closest strike to current price) with decent OI
    const calls = chain.calls?.filter((c: any) => (c.openInterest ?? 0) > 10 && c.impliedVolatility > 0);
    if (!calls?.length) return null;

    // Sort by proximity to current price
    calls.sort((a: any, b: any) =>
      Math.abs(a.strike - currentPrice) - Math.abs(b.strike - currentPrice)
    );

    const atmIV = calls[0].impliedVolatility;
    return typeof atmIV === "number" && atmIV > 0 ? atmIV : null;
  } catch {
    // Options not available for this ticker (e.g., some ETFs)
    return null;
  }
}

async function fetchQuote(ticker: string): Promise<QuoteData> {
  const q = await yahooFinance.quote(ticker);
  if (!q || !q.regularMarketPrice) {
    throw new Error(`No quote data for ${ticker}`);
  }
  return {
    price: q.regularMarketPrice,
    name: q.longName || q.shortName || ticker,
    marketCap: q.marketCap ?? null,
    fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? q.regularMarketPrice * 1.2,
    fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? q.regularMarketPrice * 0.8,
    fiftyDayAverage: q.fiftyDayAverage ?? q.regularMarketPrice,
    twoHundredDayAverage: q.twoHundredDayAverage ?? q.regularMarketPrice,
    volume: q.regularMarketVolume ?? 0,
    quoteType: q.quoteType ?? "EQUITY",
  };
}

interface OptionData {
  contractSymbol: string;
  strike: number;
  lastPrice: number;
  bid: number;
  ask: number;
  impliedVolatility: number;
  openInterest: number;
  expiration: Date;
  inTheMoney: boolean;
}

async function fetchNearestOption(
  ticker: string,
  direction: "long" | "short"
): Promise<{ call: OptionData | null; put: OptionData | null; expirationDate: string }> {
  // First fetch to get available expiration dates
  const initial = await yahooFinance.options(ticker);
  if (!initial || !initial.options || initial.options.length === 0) {
    throw new Error(`No options data for ${ticker}`);
  }

  // Pick an expiration 30-45 days out (sweet spot for directional trades).
  // Falls back to nearest if nothing in that range.
  const now = Date.now();
  const TARGET_MIN_DAYS = 25;
  const TARGET_MAX_DAYS = 60;
  let targetDate: Date | null = null;

  if (initial.expirationDates && initial.expirationDates.length > 0) {
    const candidates = initial.expirationDates.filter((d: Date) => {
      const days = (d.getTime() - now) / 86400000;
      return days >= TARGET_MIN_DAYS && days <= TARGET_MAX_DAYS;
    });
    if (candidates.length > 0) {
      // Pick the one closest to 35 days out
      const idealMs = now + 35 * 86400000;
      candidates.sort((a: Date, b: Date) => Math.abs(a.getTime() - idealMs) - Math.abs(b.getTime() - idealMs));
      targetDate = candidates[0];
    }
  }

  // Fetch the chain for the target date (or use the initial fetch if no better date found)
  let opts = initial;
  if (targetDate) {
    opts = await yahooFinance.options(ticker, { date: targetDate });
  }

  const chain = opts.options[0];
  const expDate = chain.expirationDate
    ? new Date(chain.expirationDate).toISOString().split("T")[0]
    : "unknown";

  // For "long" thesis, find a near-the-money call
  // For "short" thesis, find a near-the-money put
  const quote = await fetchQuote(ticker);
  const currentPrice = quote.price;

  // Pick the call/put closest to current price that is OTM (most common trade)
  let bestCall: OptionData | null = null;
  let bestPut: OptionData | null = null;

  if (chain.calls) {
    // First OTM call (strike > current price) with decent open interest
    const otmCalls = chain.calls
      .filter((c: any) => c.strike > currentPrice && (c.openInterest ?? 0) > 10)
      .sort((a: any, b: any) => a.strike - b.strike);
    if (otmCalls.length > 0) {
      const c = otmCalls[0];
      bestCall = {
        contractSymbol: c.contractSymbol ?? "",
        strike: c.strike,
        lastPrice: c.lastPrice ?? 0,
        bid: c.bid ?? 0,
        ask: c.ask ?? 0,
        impliedVolatility: c.impliedVolatility ?? 0,
        openInterest: c.openInterest ?? 0,
        expiration: c.expiration ? new Date(c.expiration) : new Date(),
        inTheMoney: c.inTheMoney ?? false,
      };
    }
  }

  if (chain.puts) {
    // First OTM put (strike < current price) with decent open interest
    const otmPuts = chain.puts
      .filter((c: any) => c.strike < currentPrice && (c.openInterest ?? 0) > 10)
      .sort((a: any, b: any) => b.strike - a.strike);
    if (otmPuts.length > 0) {
      const p = otmPuts[0];
      bestPut = {
        contractSymbol: p.contractSymbol ?? "",
        strike: p.strike,
        lastPrice: p.lastPrice ?? 0,
        bid: p.bid ?? 0,
        ask: p.ask ?? 0,
        impliedVolatility: p.impliedVolatility ?? 0,
        openInterest: p.openInterest ?? 0,
        expiration: p.expiration ? new Date(p.expiration) : new Date(),
        inTheMoney: p.inTheMoney ?? false,
      };
    }
  }

  return { call: bestCall, put: bestPut, expirationDate: expDate };
}

// ---------------------------------------------------------------------------
// Return calculations
// ---------------------------------------------------------------------------

function estimateLiquidity(volume: number, marketCap: number | null): Liquidity {
  if (volume > 5_000_000 || (marketCap && marketCap > 50_000_000_000)) return "high";
  if (volume > 500_000 || (marketCap && marketCap > 5_000_000_000)) return "medium";
  return "low";
}

/**
 * Calculate target and stop prices.
 *
 * When IV is available: expected_move = price × IV × √(days/365)
 *   This gives market-consensus range instead of historical range.
 * Fallback: 52-week high/low range (for non-optionable stocks).
 *
 * Default horizon: 90 days (3 months) for stocks, 30 days for leveraged ETFs.
 */
function calcStockReturns(
  quote: QuoteData,
  direction: "long" | "short",
  isLeveraged: boolean,
  leverageFactor: number,
  iv: number | null
): {
  target: number;
  stop: number;
  return_if_right_pct: number;
  return_if_wrong_pct: number;
  iv_used: boolean;
  expected_move_pct: number | null;
} {
  const price = quote.price;
  const high = quote.fiftyTwoWeekHigh;
  const low = quote.fiftyTwoWeekLow;
  const holdingDays = isLeveraged ? 30 : 90;

  if (iv && iv > 0) {
    // IV-derived expected move: price × IV × √(days/365)
    const expectedMovePct = iv * Math.sqrt(holdingDays / 365);
    const expectedMove = price * expectedMovePct;

    // Target: 1 standard deviation move in thesis direction
    // Stop: 0.7 standard deviations against (tighter risk management)
    const stopMultiplier = 0.7;

    let target: number;
    let stop: number;
    if (direction === "long") {
      target = price + expectedMove;
      stop = price - expectedMove * stopMultiplier;
    } else {
      target = price - expectedMove;
      stop = price + expectedMove * stopMultiplier;
    }

    const rawRight = Math.abs(target - price) / price * 100;
    const rawWrong = -(Math.abs(stop - price) / price * 100);

    return {
      target: Math.round(target * 100) / 100,
      stop: Math.round(stop * 100) / 100,
      return_if_right_pct: Math.round(rawRight * leverageFactor * 100) / 100,
      return_if_wrong_pct: Math.round(rawWrong * leverageFactor * 100) / 100,
      iv_used: true,
      expected_move_pct: Math.round(expectedMovePct * 10000) / 100,
    };
  }

  // Fallback: 52-week range based targets
  const stopPct = isLeveraged ? 0.08 : 0.10;

  if (direction === "long") {
    const targetRaw = price + (high - price) * 0.7;
    const target = Math.max(targetRaw, price * 1.05);
    const stop = Math.max(price * (1 - stopPct), low);
    const rawRight = ((target - price) / price) * 100;
    const rawWrong = ((stop - price) / price) * 100;

    return {
      target: Math.round(target * 100) / 100,
      stop: Math.round(stop * 100) / 100,
      return_if_right_pct: Math.round(rawRight * leverageFactor * 100) / 100,
      return_if_wrong_pct: Math.round(rawWrong * leverageFactor * 100) / 100,
      iv_used: false,
      expected_move_pct: null,
    };
  } else {
    const targetRaw = price - (price - low) * 0.7;
    const target = Math.min(targetRaw, price * 0.95);
    const stop = Math.min(price * (1 + stopPct), high);
    const rawRight = ((price - target) / price) * 100;
    const rawWrong = ((price - stop) / price) * 100;

    return {
      target: Math.round(target * 100) / 100,
      stop: Math.round(stop * 100) / 100,
      return_if_right_pct: Math.round(rawRight * leverageFactor * 100) / 100,
      return_if_wrong_pct: Math.round(rawWrong * leverageFactor * 100) / 100,
      iv_used: false,
      expected_move_pct: null,
    };
  }
}

// ---------------------------------------------------------------------------
// Build TradeExpression for each instrument type
// ---------------------------------------------------------------------------

async function buildStockExpression(
  ticker: string,
  direction: "long" | "short",
  quote: QuoteData
): Promise<ReturnProfile> {
  // Auto-swap: if direction is "short" and ticker has an inverse pair,
  // swap to the inverse ETF and flip direction to "long" (buying inverse = shorting the sector)
  const upperTicker = ticker.toUpperCase();
  const isAlreadyInverse = LEVERAGED_ETFS[upperTicker]?.inverse === true;
  if (direction === "short" && !isAlreadyInverse && INVERSE_PAIRS[upperTicker]) {
    const inverseTicker = INVERSE_PAIRS[upperTicker];
    console.error(`Short→Inverse swap: ${upperTicker} short → ${inverseTicker} long (buying inverse = shorting sector)`);
    // Re-fetch quote for the inverse ticker and recurse with flipped direction
    const inverseQuote = await fetchQuote(inverseTicker);
    return buildStockExpression(inverseTicker, "long", inverseQuote);
  }

  const leveraged = LEVERAGED_ETFS[ticker.toUpperCase()];
  const isLeveraged = !!leveraged;
  const leverageFactor = leveraged?.leverage ?? 1;

  // Fetch ATM implied volatility from options chain
  console.error("Fetching IV from options chain...");
  const iv = await fetchIV(ticker, quote.price);
  if (iv) {
    console.error(`  IV: ${(iv * 100).toFixed(1)}% (annualized)`);
  } else {
    console.error("  IV unavailable — falling back to 52-week range");
  }

  const { target, stop, return_if_right_pct, return_if_wrong_pct, iv_used, expected_move_pct } =
    calcStockReturns(quote, direction, isLeveraged, leverageFactor, iv);

  const action = direction === "long" ? "BUY" : (isLeveraged ? "BUY" : "BUY inverse ETF or PUT");
  const holdingDays = isLeveraged ? 30 : 90;

  const expression: TradeExpression = {
    platform: "robinhood",
    instrument: ticker.toUpperCase(),
    instrument_name: quote.name,
    direction: direction,
    capital_required: 100,
    return_if_right_pct,
    return_if_wrong_pct,
    time_horizon: isLeveraged ? "1-4 weeks (leveraged, avoid long holds)" : "3 months",
    leverage: leverageFactor,
    liquidity: estimateLiquidity(quote.volume, quote.marketCap),
    execution_details: {
      action,
      ticker: ticker.toUpperCase(),
      entry_price: quote.price,
      target_price: target,
      stop_loss: stop,
      instrument_type: isLeveraged ? "leveraged_etf" : (quote.quoteType === "ETF" ? "etf" : "stock"),
      leverage_factor: leverageFactor,
      move_source: iv_used ? "iv_derived" : "52_week_range",
      ...(iv_used && { iv_annualized_pct: Math.round(iv! * 10000) / 100, expected_move_pct }),
      holding_days: holdingDays,
      manual_instruction: `Open Robinhood -> Search "${ticker.toUpperCase()}" -> ${action} -> Shares -> Enter amount -> Review -> Submit`,
      stop_instruction: `Set stop loss: Portfolio -> ${ticker.toUpperCase()} -> Sell -> Stop Loss -> $${stop}`,
    },
  };

  if (isLeveraged) {
    expression.execution_details.decay_warning =
      "Leveraged ETFs experience volatility decay. Do not hold for more than a few weeks.";
  }

  const moveDesc = iv_used
    ? `Options market expects ±${expected_move_pct}% over ${holdingDays} days (IV: ${(iv! * 100).toFixed(0)}%).`
    : `Based on 52-week range.`;

  const confidence_note = isLeveraged
    ? `${leverageFactor}x leveraged. Entry $${quote.price}, target $${target} (+${return_if_right_pct}%), stop $${stop} (${return_if_wrong_pct}%). ${moveDesc}`
    : `Entry $${quote.price}, target $${target} (+${return_if_right_pct}%), stop $${stop} (${return_if_wrong_pct}%). ${moveDesc}`;

  const risk_note = isLeveraged
    ? `Leveraged ${leverageFactor}x — volatility decay erodes value over time. Short holding period recommended.`
    : `Standard ${quote.quoteType === "ETF" ? "ETF" : "stock"} position. No leverage, no expiration.`;

  return { expression, confidence_note, risk_note };
}

async function buildOptionExpression(
  ticker: string,
  direction: "long" | "short",
  quote: QuoteData
): Promise<ReturnProfile> {
  const { call, put, expirationDate } = await fetchNearestOption(ticker, direction);

  const option = direction === "long" ? call : put;
  if (!option) {
    throw new Error(
      `No liquid ${direction === "long" ? "call" : "put"} options found for ${ticker}. Try stock or ETF instead.`
    );
  }

  const premium = option.ask > 0 ? option.ask : option.lastPrice;
  const premiumPerContract = Math.round(premium * 100 * 100) / 100; // Options are per 100 shares, round to cents
  const strike = option.strike;

  let return_if_right_pct: number;
  let breakeven: number;

  if (direction === "long") {
    // Call option: profit if price > strike + premium
    breakeven = strike + premium;
    // Target: 52-week high
    const target = quote.fiftyTwoWeekHigh;
    const profitPerShare = Math.max(target - strike - premium, 0);
    return_if_right_pct = premium > 0 ? Math.round((profitPerShare / premium) * 100 * 100) / 100 : 0;
  } else {
    // Put option: profit if price < strike - premium
    breakeven = strike - premium;
    const target = quote.fiftyTwoWeekLow;
    const profitPerShare = Math.max(strike - premium - target, 0);
    return_if_right_pct = premium > 0 ? Math.round((profitPerShare / premium) * 100 * 100) / 100 : 0;
  }

  const return_if_wrong_pct = -100; // Max loss on long options = premium paid

  const optionType = direction === "long" ? "Call" : "Put";
  const contractDesc = `${ticker.toUpperCase()} ${expirationDate} $${strike} ${optionType}`;

  const expression: TradeExpression = {
    platform: "robinhood",
    instrument: option.contractSymbol || contractDesc,
    instrument_name: contractDesc,
    direction: direction === "long" ? "long" : "short",
    capital_required: Math.round(premiumPerContract * 100) / 100,
    return_if_right_pct,
    return_if_wrong_pct,
    time_horizon: `Expires ${expirationDate}`,
    leverage: Math.round((quote.price / premium) * 100) / 100, // Effective leverage
    liquidity: option.openInterest > 1000 ? "high" : option.openInterest > 100 ? "medium" : "low",
    execution_details: {
      action: `BUY ${optionType.toUpperCase()}`,
      ticker: ticker.toUpperCase(),
      contract: contractDesc,
      strike,
      premium_per_share: premium,
      premium_per_contract: premiumPerContract,
      breakeven: Math.round(breakeven * 100) / 100,
      max_loss: premiumPerContract,
      expiration: expirationDate,
      implied_volatility: Math.round(option.impliedVolatility * 100 * 100) / 100 + "%",
      open_interest: option.openInterest,
      instrument_type: "option",
      manual_instruction: `Open Robinhood -> Search "${ticker.toUpperCase()}" -> Trade Options -> ${expirationDate} -> ${optionType} -> Strike $${strike} -> Buy -> 1 contract -> Limit @ $${premium} -> Review -> Submit`,
    },
  };

  const confidence_note = `${contractDesc} @ $${premium}/share ($${premiumPerContract}/contract). Breakeven: $${Math.round(breakeven * 100) / 100}. Max loss: $${premiumPerContract} (premium paid).`;
  const risk_note = `Options expire ${expirationDate}. Time decay accelerates near expiration. IV: ${Math.round(option.impliedVolatility * 100)}%. Max loss is the premium paid.`;

  return { expression, confidence_note, risk_note };
}

// ---------------------------------------------------------------------------
// Main: CLI entry point
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: bun run scripts/adapters/robinhood/returns.ts <TICKER> <long|short> [stock|etf|option]");
    console.error("Examples:");
    console.error('  bun run scripts/adapters/robinhood/returns.ts "BAH" "long" "stock"');
    console.error('  bun run scripts/adapters/robinhood/returns.ts "TBT" "long" "etf"');
    console.error('  bun run scripts/adapters/robinhood/returns.ts "PLTR" "long" "option"');
    process.exit(1);
  }

  const ticker = args[0].toUpperCase();
  const direction = args[1].toLowerCase() as "long" | "short";
  const instrType = (args[2] || "stock").toLowerCase() as InstrumentType;

  if (!["long", "short"].includes(direction)) {
    console.error(`Invalid direction: "${direction}". Use "long" or "short".`);
    process.exit(1);
  }
  if (!["stock", "etf", "option"].includes(instrType)) {
    console.error(`Invalid type: "${instrType}". Use "stock", "etf", or "option".`);
    process.exit(1);
  }

  console.error(`\nCalculating returns for: ${ticker} (${direction} ${instrType})\n`);
  console.error("Fetching quote from Yahoo Finance...");

  const quote = await fetchQuote(ticker);
  console.error(`  ${ticker}: $${quote.price} (${quote.name})`);
  console.error(`  52-week range: $${quote.fiftyTwoWeekLow} - $${quote.fiftyTwoWeekHigh}`);
  console.error(`  50-day MA: $${quote.fiftyDayAverage}, 200-day MA: $${quote.twoHundredDayAverage}`);

  let profile: ReturnProfile;

  if (instrType === "option") {
    console.error("Fetching options chain...");
    profile = await buildOptionExpression(ticker, direction, quote);
  } else {
    // stock or etf — same logic, stock/etf/leveraged is auto-detected
    profile = await buildStockExpression(ticker, direction, quote);
  }

  console.error(`\n  Return if right: ${profile.expression.return_if_right_pct > 0 ? "+" : ""}${profile.expression.return_if_right_pct}%`);
  console.error(`  Return if wrong: ${profile.expression.return_if_wrong_pct}%`);
  console.error(`  ${profile.confidence_note}`);
  console.error(`  ${profile.risk_note}\n`);

  console.log(JSON.stringify(profile, null, 2));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
