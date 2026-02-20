/**
 * Shared binary payoff math for prediction market adapters.
 *
 * Used by Kalshi and Polymarket (and any future prediction market adapter).
 * Takes a probability (0-1) and returns the core numbers every binary
 * market card needs.
 *
 * The only input is the buy probability. Everything else is derived:
 *   buy at P  ->  win $1 if right, $0 if wrong
 *   return_if_right = (1/P - 1) * 100%
 *   return_if_wrong = -100%
 *   implied_prob = P
 *   conviction_breakeven = P (you need to be right more than P% for +EV)
 */

export interface BinaryPayoff {
  return_if_right_pct: number;  // e.g. 150.0 for buying at $0.40
  return_if_wrong_pct: -100;
  market_implied_prob: number;  // 0-1
  conviction_breakeven_pct: number;  // e.g. 40.0
  contracts_per_100: number;    // how many contracts $100 buys
  leverage: 999;                // sentinel for binary (effectively infinite)
}

/**
 * Calculate binary payoff from a buy probability.
 *
 * @param buyProb - the price to buy at, expressed as probability 0-1.
 *   Kalshi: pass `priceCents / 100`
 *   Polymarket: pass price directly (already 0-1)
 */
export function binaryPayoff(buyProb: number): BinaryPayoff {
  const returnIfRightPct = (1 / buyProb - 1) * 100;

  return {
    return_if_right_pct: Math.round(returnIfRightPct * 10) / 10,
    return_if_wrong_pct: -100,
    market_implied_prob: Math.round(buyProb * 1000) / 1000,
    conviction_breakeven_pct: Math.round(buyProb * 100 * 10) / 10,
    contracts_per_100: Math.floor(100 / buyProb),
    leverage: 999,
  };
}

/**
 * Generate the confidence note for a binary market.
 * Works for both YES and NO directions.
 */
export function binaryConfidenceNote(impliedProb: number, direction: "yes" | "no"): string {
  if (direction === "yes") {
    return `Market implies ${(impliedProb * 100).toFixed(1)}% probability. Your thesis needs >${(impliedProb * 100).toFixed(0)}% to be +EV.`;
  }
  const noProb = 1 - impliedProb;
  return `Market implies ${(noProb * 100).toFixed(1)}% probability the event does NOT happen. Your thesis needs >${(noProb * 100).toFixed(0)}% to be +EV.`;
}
