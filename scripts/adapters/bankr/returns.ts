/**
 * Bankr returns adapter — calculates TradeExpression for an instrument.
 *
 * Usage:
 *   bun run scripts/adapters/bankr/returns.ts "ONDO" "long" "token"
 *   bun run scripts/adapters/bankr/returns.ts "PM:NO-FED-RATE-CUTS-2026" "yes" "polymarket"
 *   bun run scripts/adapters/bankr/returns.ts "USTB" "long" "treasury"
 *
 * Args:
 *   1. ticker — instrument ticker (from instruments.ts output)
 *   2. direction — "long" | "short" | "yes" | "no"
 *   3. type — "token" | "polymarket" | "treasury"
 */

import type { TradeExpression, ReturnProfile, Direction } from "../../types";

const API_BASE = "https://api.bankr.bot";
const API_KEY = process.env.BANKR_API_KEY;
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_TIME_MS = 180_000;

if (!API_KEY) {
  console.error("ERROR: BANKR_API_KEY not set in .env");
  process.exit(1);
}

// ── API helpers (shared with instruments.ts) ─────────────────────────────

interface BankrJobResponse {
  success: boolean;
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  response?: string;
  transactions?: any[];
  statusUpdates?: { message: string; timestamp: string }[];
  processingTime?: number;
}

async function submitPrompt(prompt: string): Promise<{ jobId: string }> {
  const res = await fetch(`${API_BASE}/agent/prompt`, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bankr POST failed (${res.status}): ${text}`);
  }

  return res.json();
}

async function pollJob(jobId: string): Promise<BankrJobResponse> {
  const startTime = Date.now();
  let lastStatusCount = 0;

  while (true) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);

    if (Date.now() - startTime > MAX_POLL_TIME_MS) {
      throw new Error(`Bankr job ${jobId} timed out after ${elapsed}s`);
    }

    const res = await fetch(`${API_BASE}/agent/job/${jobId}`, {
      headers: { "x-api-key": API_KEY! },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Bankr poll failed (${res.status}): ${text}`);
    }

    const job: BankrJobResponse = await res.json();

    if (job.statusUpdates && job.statusUpdates.length > lastStatusCount) {
      for (let i = lastStatusCount; i < job.statusUpdates.length; i++) {
        console.error(`  [Bankr ${elapsed}s] ${job.statusUpdates[i].message}`);
      }
      lastStatusCount = job.statusUpdates.length;
    }

    if (job.status === "completed") {
      console.error(`Bankr completed in ${elapsed}s`);
      return job;
    }

    if (job.status === "failed" || job.status === "cancelled") {
      throw new Error(`Bankr job ${jobId} ${job.status} after ${elapsed}s`);
    }

    console.error(`Bankr processing... ${elapsed}s`);
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

// ── Price fallback chain: Bankr text → DexScreener → CoinGecko ──────────

interface PriceResult {
  price: number;
  market_cap: number | null;
  source: "bankr_text" | "dexscreener" | "coingecko";
}

/** DexScreener: search for token, pick highest-liquidity pair */
async function fetchDexScreenerPrice(ticker: string): Promise<PriceResult | null> {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(ticker)}`);
    if (!res.ok) {
      console.error(`DexScreener search failed (${res.status})`);
      return null;
    }
    const data = await res.json() as { pairs?: any[] };
    if (!data.pairs || data.pairs.length === 0) {
      console.error(`DexScreener: no pairs found for "${ticker}"`);
      return null;
    }

    // Pick highest-liquidity pair as canonical price
    const sorted = data.pairs
      .filter((p: any) => p.priceUsd && parseFloat(p.priceUsd) > 0)
      .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

    if (sorted.length === 0) return null;

    const best = sorted[0];
    const price = parseFloat(best.priceUsd);
    const marketCap = best.marketCap || best.fdv || null;

    console.error(`DexScreener: ${ticker} = $${price} (mcap: ${marketCap ? `$${marketCap.toLocaleString()}` : "n/a"}, liq: $${(best.liquidity?.usd || 0).toLocaleString()})`);
    return { price, market_cap: marketCap, source: "dexscreener" };
  } catch (err) {
    console.error(`DexScreener error: ${(err as Error).message}`);
    return null;
  }
}

/** CoinGecko: simple price lookup (no API key required) */
async function fetchCoinGeckoPrice(ticker: string): Promise<PriceResult | null> {
  try {
    const id = ticker.toLowerCase();
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd&include_market_cap=true`);
    if (!res.ok) {
      console.error(`CoinGecko failed (${res.status})`);
      return null;
    }
    const data = await res.json() as Record<string, { usd?: number; usd_market_cap?: number }>;
    const entry = data[id];
    if (!entry?.usd) {
      console.error(`CoinGecko: no price for "${id}"`);
      return null;
    }
    console.error(`CoinGecko: ${ticker} = $${entry.usd} (mcap: ${entry.usd_market_cap ? `$${entry.usd_market_cap.toLocaleString()}` : "n/a"})`);
    return { price: entry.usd, market_cap: entry.usd_market_cap || null, source: "coingecko" };
  } catch (err) {
    console.error(`CoinGecko error: ${(err as Error).message}`);
    return null;
  }
}

// ── Price extraction ─────────────────────────────────────────────────────

/** Try to extract a price for the ticker from Bankr response text */
function extractPrice(text: string, ticker: string): number | null {
  // Clean ticker for regex (strip PM: prefix)
  const cleanTicker = ticker.replace(/^PM:/, "").replace(/-/g, "\\s*");

  // Pattern 1: "TICKER ($1.43)" or "TICKER at $1.43"
  const pricePatterns = [
    new RegExp(`${cleanTicker}\\s*\\(?\\$?([\\d,.]+)`, "i"),
    new RegExp(`${cleanTicker}\\s*(?:at|@|:)\\s*\\$?([\\d,.]+)`, "i"),
    new RegExp(`\\$([\\d,.]+)\\s*(?:per|for|each)?\\s*${cleanTicker}`, "i"),
  ];

  for (const pattern of pricePatterns) {
    const match = pattern.exec(text);
    if (match) {
      const price = parseFloat(match[1].replace(/,/g, ""));
      if (price > 0 && price < 1_000_000) return price;
    }
  }

  // For Polymarket, look for percentage odds
  const oddsPattern = new RegExp(`${cleanTicker}[^\\d]*(\\d+\\.?\\d*)%`, "i");
  const oddsMatch = oddsPattern.exec(text);
  if (oddsMatch) {
    return parseFloat(oddsMatch[1]) / 100; // Convert % to $0.XX price
  }

  return null;
}

// ── Return calculation by instrument type ────────────────────────────────

function buildTokenReturn(
  ticker: string,
  direction: Direction,
  price: number | null,
  responseText: string,
  transactions: any[],
  marketCap: number | null = null,
  priceSource: "bankr_text" | "dexscreener" | "coingecko" = "bankr_text"
): TradeExpression {
  // For spot tokens: assume $100 capital, estimate +50% / -30% as default range
  // A real implementation would use Bankr's analysis for price targets
  const capital = 100;
  const returnIfRight = 50; // Conservative default for spot crypto
  const returnIfWrong = -30;

  return {
    platform: "bankr",
    instrument: ticker,
    instrument_name: `${ticker} spot token`,
    direction,
    capital_required: capital,
    return_if_right_pct: direction === "long" ? returnIfRight : Math.abs(returnIfWrong),
    return_if_wrong_pct: direction === "long" ? returnIfWrong : -returnIfRight,
    time_horizon: "3-6 months",
    leverage: 1,
    liquidity: "medium",
    execution_details: {
      type: "token_swap",
      entry_price: price,
      market_cap_usd: marketCap,
      price_source: priceSource,
      chain: extractChain(responseText, ticker),
      transactions: transactions.length > 0 ? transactions : undefined,
      source: "bankr_agent_api",
    },
  };
}

function buildPolymarketReturn(
  ticker: string,
  direction: Direction,
  price: number | null,
  responseText: string
): TradeExpression {
  // Polymarket: binary payoff. Buy YES at $0.XX, win $1.00 if correct, lose stake if wrong.
  const impliedProb = price || 0.5;
  const yesPrice = direction === "yes" ? impliedProb : 1 - impliedProb;
  const capital = 100;
  const shares = capital / yesPrice;
  const payoff = shares * 1.0; // Each share pays $1 if correct
  const returnIfRight = ((payoff - capital) / capital) * 100;
  const returnIfWrong = -100; // Total loss of stake

  const cleanName = ticker.replace(/^PM:/, "").replace(/-/g, " ").toLowerCase();

  return {
    platform: "bankr",
    instrument: ticker,
    instrument_name: `Polymarket: ${cleanName}`,
    direction,
    capital_required: capital,
    return_if_right_pct: Math.round(returnIfRight),
    return_if_wrong_pct: returnIfWrong,
    time_horizon: "event-based",
    leverage: 1,
    market_implied_prob: impliedProb,
    liquidity: "medium",
    execution_details: {
      type: "polymarket",
      share_price: yesPrice,
      shares_per_100: Math.round(shares * 100) / 100,
      payout_per_share: 1.0,
      source: "bankr_agent_api",
    },
  };
}

function buildTreasuryReturn(
  ticker: string,
  direction: Direction,
  price: number | null,
  responseText: string
): TradeExpression {
  // Tokenized treasuries: yield-based. Typical 4-5% APY.
  const capital = 100;
  const annualYield = 4.5; // Conservative estimate
  const monthlyYield = annualYield / 12;
  // Upside is the yield; downside is price risk on the token itself (minimal for treasuries)
  const returnIfRight = annualYield;
  const returnIfWrong = -2; // Treasuries have low downside risk

  return {
    platform: "bankr",
    instrument: ticker,
    instrument_name: `${ticker} tokenized treasury`,
    direction,
    capital_required: capital,
    return_if_right_pct: returnIfRight,
    return_if_wrong_pct: returnIfWrong,
    time_horizon: "12 months",
    leverage: 1,
    liquidity: "medium",
    expected_return_monthly: monthlyYield,
    execution_details: {
      type: "tokenized_treasury",
      estimated_apy_pct: annualYield,
      entry_price: price,
      source: "bankr_agent_api",
    },
  };
}

/** Try to extract the chain from Bankr response text for a given ticker */
function extractChain(text: string, ticker: string): string | undefined {
  const chains = ["base", "solana", "ethereum", "polygon", "unichain"];
  const lower = text.toLowerCase();
  const tickerIdx = lower.indexOf(ticker.toLowerCase());

  if (tickerIdx === -1) return undefined;

  // Look within 200 chars around the ticker mention
  const window = lower.substring(Math.max(0, tickerIdx - 100), tickerIdx + 100);
  for (const chain of chains) {
    if (window.includes(chain)) return chain;
  }
  return undefined;
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const ticker = process.argv[2];
  const direction = process.argv[3] as Direction;
  const instrumentType = process.argv[4] as "token" | "polymarket" | "treasury";

  if (!ticker || !direction || !instrumentType) {
    console.error('Usage: bun run scripts/adapters/bankr/returns.ts "<ticker>" "<direction>" "<type>"');
    console.error('  direction: long | short | yes | no');
    console.error('  type: token | polymarket | treasury');
    process.exit(1);
  }

  console.error(`\n--- Bankr Returns Calculator ---`);
  console.error(`Ticker: ${ticker}, Direction: ${direction}, Type: ${instrumentType}`);

  // Build a prompt to get current price/odds for the instrument
  let prompt: string;
  if (instrumentType === "polymarket") {
    const cleanName = ticker.replace(/^PM:/, "").replace(/-/g, " ");
    prompt = `What are the current odds on Polymarket for "${cleanName}"? Give me the YES and NO prices.`;
  } else if (instrumentType === "treasury") {
    prompt = `What is the current price and yield for ${ticker} tokenized treasury? Include APY if available.`;
  } else {
    prompt = `What is the current price of ${ticker}? Include the chain it's on and any recent price movement.`;
  }

  console.error(`Querying Bankr for ${ticker} details...`);

  const { jobId } = await submitPrompt(prompt);
  console.error(`Job submitted: ${jobId}`);
  console.error(`Polling (15-125s)...\n`);

  const job = await pollJob(jobId);
  const responseText = job.response || "";

  // Extract price from response — with fallback chain for tokens
  let price = extractPrice(responseText, ticker);
  let marketCap: number | null = null;
  let priceSource: "bankr_text" | "dexscreener" | "coingecko" = "bankr_text";

  if (price !== null) {
    console.error(`Extracted price from Bankr text: $${price}`);
  }

  // For tokens: if Bankr text didn't yield a price, try DexScreener → CoinGecko
  if (instrumentType === "token") {
    if (price === null) {
      console.error(`No price in Bankr text — trying DexScreener...`);
      const dexResult = await fetchDexScreenerPrice(ticker);
      if (dexResult) {
        price = dexResult.price;
        marketCap = dexResult.market_cap;
        priceSource = "dexscreener";
      } else {
        console.error(`DexScreener failed — trying CoinGecko...`);
        const cgResult = await fetchCoinGeckoPrice(ticker);
        if (cgResult) {
          price = cgResult.price;
          marketCap = cgResult.market_cap;
          priceSource = "coingecko";
        } else {
          console.error(`ERROR: No price found for ${ticker} from bankr text, DexScreener, or CoinGecko`);
        }
      }
    } else {
      // Got price from Bankr text, but still try to get market cap from DexScreener
      const dexResult = await fetchDexScreenerPrice(ticker);
      if (dexResult) {
        marketCap = dexResult.market_cap;
      }
    }
  }

  console.error(`Final price: ${price !== null ? `$${price}` : "not found (using defaults)"}, source: ${priceSource}, mcap: ${marketCap ? `$${marketCap.toLocaleString()}` : "n/a"}`);

  // Build the trade expression based on instrument type
  let expression: TradeExpression;

  switch (instrumentType) {
    case "polymarket":
      expression = buildPolymarketReturn(ticker, direction, price, responseText);
      break;
    case "treasury":
      expression = buildTreasuryReturn(ticker, direction, price, responseText);
      break;
    default:
      expression = buildTokenReturn(ticker, direction, price, responseText, job.transactions || [], marketCap, priceSource);
      break;
  }

  const result: ReturnProfile = {
    expression,
    confidence_note:
      instrumentType === "polymarket" && price !== null
        ? `Market implies ${Math.round(price * 100)}% probability. Your thesis needs >${Math.round(price * 100)}% conviction to be +EV.`
        : instrumentType === "treasury"
          ? `Tokenized treasury with ~4.5% APY. Low risk, stable yield.`
          : `Spot crypto position. Price: ${price ? `$${price}` : "unknown"}${marketCap ? ` (mcap: $${(marketCap / 1e6).toFixed(1)}M)` : ""}. High volatility expected.`,
    risk_note:
      instrumentType === "polymarket"
        ? "Binary outcome: you win $1/share or lose your entire stake."
        : instrumentType === "treasury"
          ? "Low risk: tokenized treasuries are backed by US government bonds."
          : "Spot position: no liquidation risk, but crypto can drop 30-50% in a drawdown.",
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(`FATAL: ${err.message}`);
  process.exit(1);
});
