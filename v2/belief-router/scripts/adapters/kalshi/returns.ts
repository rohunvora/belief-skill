/**
 * Kalshi Returns Calculator
 *
 * Usage: bun run scripts/adapters/kalshi/returns.ts "KXFED-26MAR" "T3.50" "yes"
 *        bun run scripts/adapters/kalshi/returns.ts "KXRECSSNBER-26" "" "no"
 *
 * Takes a Kalshi event ticker + optional strike + direction, fetches live price,
 * and outputs a TradeExpression with return profile.
 */

import type { TradeExpression, ReturnProfile, Liquidity } from "../../types";

const API_BASE = "https://api.elections.kalshi.com/trade-api/v2";

interface KalshiMarket {
  ticker: string;
  title: string;
  subtitle?: string;
  status: string;
  last_price: number;
  volume: number;
  open_interest: number;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  expected_expiration_time?: string;
  close_time?: string;
  expiration_time?: string;
}

interface KalshiEvent {
  event_ticker: string;
  title: string;
  series_ticker: string;
  markets: KalshiMarket[];
}

interface OrderbookLevel {
  price: number;
  quantity: number;
}

interface Orderbook {
  yes: OrderbookLevel[];
  no: OrderbookLevel[];
}

/**
 * Fetch event detail with all child markets.
 */
async function fetchEvent(eventTicker: string): Promise<KalshiEvent> {
  const url = `${API_BASE}/events/${eventTicker}?with_nested_markets=true`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch event ${eventTicker}: ${res.status} ${res.statusText}`);
  }

  const json = await res.json() as { event: KalshiEvent };
  return json.event;
}

/**
 * Fetch orderbook for deeper price data.
 */
async function fetchOrderbook(marketTicker: string): Promise<Orderbook> {
  const url = `${API_BASE}/markets/${marketTicker}/orderbook`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch orderbook for ${marketTicker}: ${res.status} ${res.statusText}`);
  }

  const json = await res.json() as { orderbook: Orderbook };
  return json.orderbook;
}

/**
 * Find the specific market within an event.
 * If strike is provided (e.g., "T3.50"), match by ticker suffix.
 * If no strike, use the first (or only) market.
 */
function findMarket(event: KalshiEvent, strike: string, direction: "yes" | "no"): KalshiMarket | null {
  const markets = event.markets?.filter(m => m.status === "active" || m.status === "open") ?? [];

  if (markets.length === 0) return null;

  if (strike) {
    // Match strike in ticker (e.g., "KXFED-26MAR-T3.50" contains "T3.50")
    const strikeLower = strike.toLowerCase();
    const match = markets.find(m => m.ticker.toLowerCase().includes(strikeLower));
    if (match) return match;

    // Also try matching in title
    const titleMatch = markets.find(m => m.title.toLowerCase().includes(strikeLower));
    if (titleMatch) return titleMatch;

    console.error(`[kalshi/returns] Strike "${strike}" not found. Available markets:`);
    for (const m of markets) {
      console.error(`  ${m.ticker}: ${m.title} (last: ${m.last_price}c)`);
    }
    return null;
  }

  // No strike specified — pick direction-aware "sweet spot" market
  // For "yes": pick market where YES price is 20-70c (meaningful bet, reasonable odds)
  // For "no": pick market where NO price is 20-70c (YES price 30-80c)
  const sweetSpot = markets.filter((m) => {
    const yesPrice = m.last_price || 50;
    if (direction === "yes") {
      return yesPrice >= 20 && yesPrice <= 70;
    } else {
      const noPrice = 100 - yesPrice;
      return noPrice >= 20 && noPrice <= 70;
    }
  });

  if (sweetSpot.length > 0) {
    // Among sweet-spot markets, pick highest volume
    sweetSpot.sort((a, b) => b.volume - a.volume);
    console.error(`[kalshi/returns] Direction-aware pick: ${sweetSpot[0].ticker} (${sweetSpot[0].last_price}c YES, ${sweetSpot.length} in sweet spot)`);
    return sweetSpot[0];
  }

  // Fallback: highest volume if no market in the sweet spot
  console.error(`[kalshi/returns] No market in 20-70c sweet spot for ${direction}, falling back to highest volume`);
  markets.sort((a, b) => b.volume - a.volume);
  return markets[0];
}

/**
 * Classify liquidity based on open interest dollar value.
 * OI is in contracts; each contract max value is $1.
 */
function classifyLiquidity(openInterest: number): Liquidity {
  // open_interest is in number of contracts, dollar value is roughly OI * avg_price
  // We use raw OI as a proxy since each contract is $0-$1
  if (openInterest > 100_000) return "high";
  if (openInterest > 10_000) return "medium";
  return "low";
}

/**
 * Calculate the return profile for a Kalshi market.
 */
function calculateReturns(
  event: KalshiEvent,
  market: KalshiMarket,
  direction: "yes" | "no",
  orderbook: Orderbook
): ReturnProfile {
  // Determine buy price in cents
  // For YES: use yes_ask (what you'd pay to buy YES), fallback to last_price
  // For NO: use no_ask (what you'd pay to buy NO), fallback to 100 - last_price
  let buyPriceCents: number;
  let bestAsk: number | undefined;

  if (direction === "yes") {
    // Best ask from orderbook (lowest price someone is selling YES at)
    bestAsk = orderbook.yes.length > 0
      ? Math.min(...orderbook.yes.map(l => l.price))
      : undefined;
    buyPriceCents = market.yes_ask || bestAsk || market.last_price || 50;
  } else {
    bestAsk = orderbook.no.length > 0
      ? Math.min(...orderbook.no.map(l => l.price))
      : undefined;
    buyPriceCents = market.no_ask || bestAsk || (100 - market.last_price) || 50;
  }

  // Clamp to valid range
  buyPriceCents = Math.max(1, Math.min(99, buyPriceCents));

  // Binary payoff math
  // Win: pay buyPriceCents, receive 100 cents
  const returnIfRightPct = ((100 / buyPriceCents) - 1) * 100;
  // Lose: pay buyPriceCents, receive 0 cents
  const returnIfWrongPct = -100;

  // Market-implied probability
  const impliedProb = buyPriceCents / 100;

  // Time horizon from expiration
  const expirationStr = market.expected_expiration_time || market.close_time || market.expiration_time;
  let timeHorizon = "unknown";
  if (expirationStr) {
    const expDate = new Date(expirationStr);
    const now = new Date();
    const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil > 0) {
      timeHorizon = `${daysUntil} days (expires ${expDate.toISOString().split("T")[0]})`;
    } else {
      timeHorizon = "expired or expiring today";
    }
  }

  // Capital required: normalized to $100 basis
  // Actual cost per contract = buyPriceCents / 100 dollars
  // For $100 capital, you get 100 / (buyPriceCents/100) = 10000/buyPriceCents contracts
  const capitalRequired = 100;

  const expression: TradeExpression = {
    platform: "kalshi",
    instrument: strike(market.ticker),
    instrument_name: `${event.title} -- ${market.title}`,
    direction: direction,

    capital_required: capitalRequired,
    return_if_right_pct: Math.round(returnIfRightPct * 10) / 10,
    return_if_wrong_pct: returnIfWrongPct,

    time_horizon: timeHorizon,
    leverage: 999, // Binary = effectively infinite leverage (999 = sentinel)
    market_implied_prob: impliedProb,
    liquidity: classifyLiquidity(market.open_interest),

    execution_details: {
      market_ticker: market.ticker,
      event_ticker: event.event_ticker,
      series_ticker: event.series_ticker,
      buy_price_cents: buyPriceCents,
      contracts_per_100: Math.floor(10000 / buyPriceCents),
      volume: market.volume,
      open_interest: market.open_interest,
      yes_bid: market.yes_bid,
      yes_ask: market.yes_ask,
      no_bid: market.no_bid,
      no_ask: market.no_ask,
    },
  };

  const confidenceNote = direction === "yes"
    ? `Market implies ${(impliedProb * 100).toFixed(0)}% probability. Your thesis needs >${(impliedProb * 100).toFixed(0)}% conviction to be +EV.`
    : `Market implies ${((1 - impliedProb) * 100).toFixed(0)}% probability the event does NOT happen. Your thesis needs >${((1 - impliedProb) * 100).toFixed(0)}% conviction to be +EV.`;

  const riskNote = `Binary contract -- max loss is 100% of capital ($${capitalRequired}). No margin calls or liquidation risk beyond the initial stake.`;

  return { expression, confidence_note: confidenceNote, risk_note: riskNote };
}

/** Format the instrument string: keep ticker as-is */
function strike(ticker: string): string {
  return ticker;
}

// --- CLI entry point ---
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: bun run scripts/adapters/kalshi/returns.ts "KXFED-26MAR" "T3.50" "yes"');
    console.error('       bun run scripts/adapters/kalshi/returns.ts "KXRECSSNBER-26" "" "no"');
    process.exit(1);
  }

  const eventTicker = args[0];
  const strikeArg = args[1] || "";
  const direction = (args[2] || "yes").toLowerCase() as "yes" | "no";

  if (direction !== "yes" && direction !== "no") {
    console.error(`[kalshi/returns] Direction must be "yes" or "no", got "${direction}"`);
    process.exit(1);
  }

  console.error(`[kalshi/returns] Fetching event: ${eventTicker}, strike: ${strikeArg || "(auto)"}, direction: ${direction}`);

  // Fetch event and find market
  const event = await fetchEvent(eventTicker);
  const market = findMarket(event, strikeArg, direction);

  if (!market) {
    console.error(`[kalshi/returns] No matching market found in event ${eventTicker}`);
    process.exit(1);
  }

  console.error(`[kalshi/returns] Found market: ${market.ticker} -- ${market.title} (last: ${market.last_price}c)`);

  // Fetch orderbook for better price data
  const orderbook = await fetchOrderbook(market.ticker);

  // Calculate returns
  const result = calculateReturns(event, market, direction, orderbook);

  console.error(`[kalshi/returns] Return if right: ${result.expression.return_if_right_pct}%, implied prob: ${(result.expression.market_implied_prob! * 100).toFixed(0)}%`);

  // Output clean JSON to stdout
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("[kalshi/returns] Fatal error:", err);
  process.exit(1);
});
