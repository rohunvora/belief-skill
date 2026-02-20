/**
 * Polymarket Return Calculator
 *
 * Usage: bun run scripts/adapters/polymarket/returns.ts "SLUG_OR_CONDITION_ID" "yes|no"
 *
 * Takes a Polymarket slug or conditionId and direction, fetches live pricing,
 * and calculates binary payoff returns. Same math as Kalshi:
 * buy YES at price P -> win $1 if right, $0 if wrong.
 */

import type { ReturnProfile, TradeExpression } from "../../types";
import { PLATFORM_RISK } from "../../types";
import { binaryPayoff, binaryConfidenceNote } from "../shared/binary-payoff";

const GAMMA_API = "https://gamma-api.polymarket.com";
const CLOB_API = "https://clob.polymarket.com";

interface GammaMarket {
  conditionId: string;
  question: string;
  slug: string;
  endDate?: string;
  active: boolean;
  closed: boolean;
  volumeNum?: string;
  liquidityNum?: string;
  lastTradePrice?: string;
  bestBid?: string;
  bestAsk?: string;
  clobTokenIds?: string[];
  events?: { title: string; endDate?: string }[];
}

interface OrderBookResponse {
  market: string;
  asset_id: string;
  bids: { price: string; size: string }[];
  asks: { price: string; size: string }[];
  last_trade_price?: string;
}

/**
 * Fetch market metadata from Gamma API.
 * Accepts either a conditionId (0x...) or a slug (human-readable-string).
 */
async function fetchMarket(idOrSlug: string): Promise<GammaMarket | null> {
  const isConditionId = idOrSlug.startsWith("0x");
  const param = isConditionId ? `condition_ids=${idOrSlug}` : `slug=${idOrSlug}`;
  const url = `${GAMMA_API}/markets?${param}`;
  console.error(`[polymarket/returns] Fetching market: ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[polymarket/returns] Market fetch failed: ${res.status}`);
    return null;
  }

  const markets = await res.json() as GammaMarket[];
  return markets?.[0] ?? null;
}

/**
 * Fetch orderbook from CLOB API for live pricing depth.
 */
async function fetchOrderbook(tokenId: string): Promise<OrderBookResponse | null> {
  const url = `${CLOB_API}/book?token_id=${tokenId}`;
  console.error(`[polymarket/returns] Fetching orderbook: ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[polymarket/returns] Orderbook fetch failed: ${res.status}`);
    return null;
  }

  return await res.json() as OrderBookResponse;
}

function calculateReturns(
  market: GammaMarket,
  direction: "yes" | "no",
  buyPrice: number,
  orderbook: OrderBookResponse | null,
  tokenIds: string[],
): ReturnProfile {
  // Shared binary math: Polymarket prices are already 0-1
  const payoff = binaryPayoff(buyPrice);

  // Liquidity from volume
  const volume = market.volumeNum ? parseFloat(market.volumeNum) : 0;
  const liquidity = volume >= 1_000_000 ? "high" as const
    : volume >= 100_000 ? "medium" as const
    : "low" as const;

  // Time horizon from endDate
  const endDate = market.endDate;
  const timeHorizon = endDate ? `by ${new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : "no expiry listed";

  // Orderbook depth summary
  const bidDepth = orderbook?.bids?.reduce((sum, b) => sum + parseFloat(b.size), 0) ?? 0;
  const askDepth = orderbook?.asks?.reduce((sum, a) => sum + parseFloat(a.size), 0) ?? 0;

  const expression: TradeExpression = {
    platform: "polymarket",
    instrument: market.conditionId,
    instrument_name: market.question,
    direction,

    capital_required: 100,
    ...payoff,

    time_horizon: timeHorizon,
    liquidity,

    platform_risk_tier: PLATFORM_RISK.polymarket.tier,

    execution_details: {
      condition_id: market.conditionId,
      clob_token_ids: tokenIds,
      buy_price_usd: buyPrice,
      contracts_per_100: payoff.contracts_per_100,
      bid_depth: Math.round(bidDepth),
      ask_depth: Math.round(askDepth),
      volume_usd: volume,
      volume_unit: "usd",
      slug: market.slug,
    },
  };

  return {
    expression,
    confidence_note: binaryConfidenceNote(payoff.market_implied_prob, direction),
    risk_note: `${PLATFORM_RISK.polymarket.note}. Binary outcome: you lose 100% of capital if wrong.`,
  };
}

// --- CLI entry point ---
async function main() {
  const args = process.argv.slice(2);
  const conditionId = args[0]?.trim();
  const direction = (args[1]?.trim().toLowerCase() || "yes") as "yes" | "no";

  if (!conditionId) {
    console.error("Usage: bun run scripts/adapters/polymarket/returns.ts \"CONDITION_ID\" \"yes|no\"");
    process.exit(1);
  }

  if (direction !== "yes" && direction !== "no") {
    console.error(`[polymarket/returns] Invalid direction: "${direction}". Use "yes" or "no".`);
    process.exit(1);
  }

  console.error(`[polymarket/returns] Calculating returns for ${conditionId} direction=${direction}`);

  // Fetch market metadata
  const market = await fetchMarket(conditionId);
  if (!market) {
    console.error(`[polymarket/returns] Market not found for conditionId: ${conditionId}`);
    process.exit(1);
  }

  console.error(`[polymarket/returns] Market: "${market.question}"`);

  // Determine which token to price (YES = index 0, NO = index 1)
  // clobTokenIds may be a JSON string or an actual array depending on the API response
  let tokenIds: string[] = [];
  if (typeof market.clobTokenIds === "string") {
    try { tokenIds = JSON.parse(market.clobTokenIds); } catch { tokenIds = []; }
  } else {
    tokenIds = market.clobTokenIds ?? [];
  }
  const tokenIndex = direction === "yes" ? 0 : 1;
  const tokenId = tokenIds[tokenIndex];

  // Fetch orderbook for live pricing
  let orderbook: OrderBookResponse | null = null;
  let buyPrice: number | null = null;

  if (tokenId) {
    orderbook = await fetchOrderbook(tokenId);
    // Best ask = the price to buy at
    if (orderbook?.asks?.length) {
      buyPrice = parseFloat(orderbook.asks[0].price);
    }
    // Fallback: last trade price from orderbook
    if (!buyPrice && orderbook?.last_trade_price) {
      buyPrice = parseFloat(orderbook.last_trade_price);
    }
  }

  // Fallback: use Gamma API prices
  if (!buyPrice) {
    if (direction === "yes") {
      buyPrice = market.bestAsk ? parseFloat(market.bestAsk) : null;
      if (!buyPrice) buyPrice = market.lastTradePrice ? parseFloat(market.lastTradePrice) : null;
    } else {
      // NO price: 1 - YES price (approximate)
      const yesPrice = market.bestBid ? parseFloat(market.bestBid) : (market.lastTradePrice ? parseFloat(market.lastTradePrice) : null);
      if (yesPrice) buyPrice = 1 - yesPrice;
    }
  }

  if (!buyPrice || buyPrice <= 0 || buyPrice >= 1) {
    console.error(`[polymarket/returns] Cannot determine valid buy price. Got: ${buyPrice}`);
    console.error(`[polymarket/returns] Market data: bestBid=${market.bestBid} bestAsk=${market.bestAsk} lastTrade=${market.lastTradePrice}`);
    process.exit(1);
  }

  console.error(`[polymarket/returns] Buy price: $${buyPrice.toFixed(4)} (direction=${direction})`);

  const result = calculateReturns(market, direction, buyPrice, orderbook, tokenIds);

  // Clean JSON to stdout
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("[polymarket/returns] Fatal error:", err);
  process.exit(1);
});
