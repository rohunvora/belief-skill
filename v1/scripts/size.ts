/**
 * Position Sizing — portfolio-aware allocation
 * 
 * Uses simplified Kelly criterion + overlap detection + concentration limits.
 * Reads portfolio from state.json format.
 */

import type { RankedInstrument, SizedRecommendation } from "./types";

interface PortfolioState {
  portfolio: {
    positions: Record<string, { usd: number; chain?: string; status?: string }>;
    usdc_solana?: { amount: number };
    total_estimate?: number;
  };
  bank_balance?: { amount: number; floor_target?: number };
}

const MAX_CONCENTRATION = 0.25; // No single position > 25% of budget
const MIN_POSITION_DEFAULT = 1000; // Don't recommend < $1K positions
const LIQUIDITY_FLOOR = 50000;  // Keep at least $50K liquid

export function sizePositions(
  ranked: RankedInstrument[],
  portfolio: PortfolioState,
  explicitBudget?: number,
  thesis?: string,
): SizedRecommendation[] {
  // Support both { portfolio: { positions } } and { positions } formats
  const portfolioData = portfolio.portfolio || portfolio as any;
  const totalPortfolio = portfolioData?.total_estimate || 0;
  const liquidCash = portfolioData?.usdc_solana?.amount || 0;
  const bankBalance = (portfolio as any).bank_balance?.amount || 0;
  const bankFloor = (portfolio as any).bank_balance?.floor_target || 0;

  // Determine available budget
  let budget: number;
  if (explicitBudget) {
    budget = explicitBudget;
  } else {
    // Auto-budget: use liquid crypto cash minus floor, capped at 15% of portfolio
    const availableCash = Math.max(0, liquidCash - LIQUIDITY_FLOOR);
    const maxBudget = totalPortfolio * 0.15;
    budget = Math.min(availableCash, maxBudget);
    if (budget < MIN_POSITION_DEFAULT) {
      budget = Math.min(liquidCash * 0.5, 10000); // Fallback: use half of liquid or $10K
    }
  }

  // Get existing positions for overlap detection
  const existingPositions = portfolioData?.positions || {};
  
  // Select top instruments with asset class diversity (max 8)
  // Ensure at least 1 ETF and 1 secondary make the cut if available
  const top: RankedInstrument[] = [];
  const byClass: Record<string, RankedInstrument[]> = {};
  for (const r of ranked) {
    const cls = r.asset_class;
    if (!byClass[cls]) byClass[cls] = [];
    byClass[cls].push(r);
  }
  
  // Adaptive selection based on what's available
  const cryptoCount = byClass["crypto"]?.length || 0;
  const stockCount = byClass["stock"]?.length || 0;
  
  // Detect conviction level from thesis language
  const isLowConviction = thesis ? /feel like|might|maybe|could|not sure|i guess/i.test(thesis) : false;
  const isVague = isLowConviction || (!explicitBudget && budget < 10000);
  
  // If crypto-heavy thesis (>60% crypto candidates), favor crypto slots
  const isCryptoHeavy = cryptoCount > stockCount * 2;
  
  // Pre-compute direction for each instrument based on thesis
  for (const r of ranked) {
    if (!(r as any)._direction) {
      (r as any)._direction = inferDirection(r, thesis);
    }
  }
  
  // Separate short candidates — ensure they get slots
  const shortCandidates = ranked.filter(r => (r as any)._direction === "short");
  const longCandidates = ranked.filter(r => (r as any)._direction !== "short");
  
  const longByClass: Record<string, RankedInstrument[]> = {};
  for (const r of longCandidates) {
    const cls = r.asset_class;
    if (!longByClass[cls]) longByClass[cls] = [];
    longByClass[cls].push(r);
  }
  
  // Theme-diverse stock selection: ensure at least one from each sub-theme
  const allStocks = longByClass["stock"] || [];
  const maxStocks = isCryptoHeavy ? 2 : isVague ? 2 : 5;
  const stocks: RankedInstrument[] = [];
  const seenThemes = new Set<string>();
  // First pass: one stock per theme (highest ranked)
  for (const s of allStocks) {
    if (stocks.length >= maxStocks) break;
    const newTheme = s.sub_themes?.find(t => !seenThemes.has(t));
    if (newTheme) {
      stocks.push(s);
      s.sub_themes?.forEach(t => seenThemes.add(t));
    }
  }
  // Second pass: fill remaining slots by score
  for (const s of allStocks) {
    if (stocks.length >= maxStocks) break;
    if (!stocks.includes(s)) stocks.push(s);
  }
  const etfs = (byClass["etf"] || []).filter(e => (e as any)._direction !== "short").slice(0, isVague ? 4 : 2);
  const secondariesList = byClass["secondary"]?.slice(0, 1) || [];
  const crypto = longByClass["crypto"]?.slice(0, isCryptoHeavy ? 5 : 2) || [];
  // Shorts always get slots when detected
  const shortRatio = shortCandidates.length / ranked.length;
  const maxShorts = shortCandidates.length > 0 ? Math.max(1, Math.min(shortRatio > 0.5 ? 5 : 2, shortCandidates.length)) : 0;
  const shorts = shortCandidates.slice(0, maxShorts);
  
  top.push(...stocks, ...etfs, ...crypto, ...shorts);
  // Sort by composite score (longs first, then shorts) — secondaries added separately
  const longItems = top.filter(t => (t as any)._direction !== "short");
  const shortItems = top.filter(t => (t as any)._direction === "short");
  longItems.sort((a, b) => b.scores.composite - a.scores.composite);
  shortItems.sort((a, b) => b.scores.composite - a.scores.composite);
  // Reserve slots for shorts, fill rest with longs
  const maxLongs = 8 - shortItems.length;
  top.length = 0;
  top.push(...longItems.slice(0, maxLongs), ...shortItems);
  // Secondaries always included (they get $0 allocation, so don't compete for budget slots)
  top.push(...secondariesList);
  
  // Check if portfolio is already HEAVILY exposed to this SPECIFIC thesis
  // Only count direct ticker matches + same-theme crypto correlation
  let directExposureTotal = 0;
  for (const inst of top) {
    if (inst.asset_class === "secondary") continue;
    // Only count DIRECT holdings (not broad asset-class correlation)
    const ticker = inst.ticker.toUpperCase();
    const directHolding = Object.entries(existingPositions).find(([k]) => k.toUpperCase() === ticker);
    if (directHolding) directExposureTotal += directHolding[1].usd || 0;
  }
  // Also check theme-specific crypto correlation — only for CRYPTO-focused theses
  // (e.g., "AI tokens on Base" when holding BNKR, NOT "defense AI spending")
  const thesisCryptoCount = top.filter(t => t.asset_class === "crypto").length;
  const cryptoKeywords = /\bcrypto|token|chain|defi|dex|sol|eth|base chain|onchain\b/i;
  const thesisIsCryptoFocused = thesisCryptoCount > top.length * 0.3 || (thesis && cryptoKeywords.test(thesis));
  if (thesisIsCryptoFocused) {
    const portfolioCrypto: Record<string, string[]> = {
      "BNKR": ["ai", "base"], "KELLYCLAUDE": ["ai", "base"],
      "FELIX": ["ai", "base"], "KLED": ["meme", "base"],
    };
    const thesisThemes = new Set(top.flatMap(t => t.sub_themes?.map(s => s.toLowerCase()) || []));
    for (const [name, themes] of Object.entries(portfolioCrypto)) {
      const pos = Object.entries(existingPositions).find(([k]) => k.toUpperCase() === name);
      if (!pos) continue;
      if (themes.some(t => [...thesisThemes].some(tt => tt.includes(t)))) {
        directExposureTotal += pos[1].usd || 0;
      }
    }
  }
  const thesisExposureRatio = directExposureTotal / (totalPortfolio || 1);
  const effectiveBudget = thesisExposureRatio > 0.4
    ? budget * 0.2 // "You ARE this trade" — only small adds
    : thesisExposureRatio > 0.2
    ? budget * 0.5
    : budget;
  
  // Debug: console.error(`DEBUG: top=${top.length} effectiveBudget=${effectiveBudget}`);
  
  // Kelly-inspired sizing: allocate proportionally by composite score
  const totalScore = top.reduce((sum, r) => sum + r.scores.composite, 0);
  
  const sized: SizedRecommendation[] = top.map(inst => {
    // Base allocation proportional to score (use effective budget for already-exposed theses)
    let allocation = (inst.scores.composite / totalScore) * effectiveBudget;
    
    // Cap at max concentration
    allocation = Math.min(allocation, effectiveBudget * MAX_CONCENTRATION);
    
    // Check existing exposure
    const existingExposure = findExistingExposure(inst, existingPositions, portfolioData);
    
    // Flag overlap but don't kill allocation — trader decides
    // Only reduce if it's a DIRECT holding (not correlated exposure)
    if (existingExposure > 0) {
      const isDirect = Object.keys(existingPositions).some(
        k => k.toUpperCase() === inst.ticker.toUpperCase()
      );
      if (isDirect) {
        // Direct overlap — reduce significantly
        const exposureRatio = existingExposure / (totalPortfolio || existingExposure);
        if (exposureRatio > 0.1) allocation *= 0.3;
        else if (exposureRatio > 0.05) allocation *= 0.6;
      }
      // Correlated exposure: reduce proportionally when very high, but keep minimum viable
      if (!isDirect) {
        const corrRatio = existingExposure / (totalPortfolio || existingExposure);
        if (corrRatio > 0.3) {
          const minPos = Math.min(MIN_POSITION_DEFAULT, budget * 0.05);
          allocation = Math.max(allocation * 0.15, minPos);
        } else if (corrRatio > 0.15) allocation *= 0.4;
      }
    }

    // Minimum position size — scale with budget
    const minPosition = Math.min(MIN_POSITION_DEFAULT, budget * 0.05);
    if (inst.asset_class === "secondary") {
      // Secondaries are flagged as opportunities — keep with $0 allocation
      allocation = 0;
    } else if (allocation < minPosition) {
      allocation = 0;
    }

    // Determine direction from thesis (default long)
    const direction = inferDirection(inst, thesis);

    // Generate rationale
    const rationale = generateRationale(inst, existingExposure);

    return {
      ...inst,
      direction,
      allocation_usd: Math.round(allocation),
      allocation_pct: Math.round((allocation / budget) * 100),
      rationale,
      existing_exposure: existingExposure,
      order_details: inst.price > 0 ? `~$${inst.price.toFixed(2)}` : undefined,
    };
  });
  // Debug: sized.forEach(r => console.error(`  ALLOC: ${r.ticker} ${r.direction} $${r.allocation_usd}`));
  const result = sized.filter(r => r.allocation_usd > 0 || r.asset_class === "secondary");

  // Normalize allocations to fit budget
  const totalAllocated = result.reduce((sum, r) => sum + r.allocation_usd, 0);
  if (totalAllocated > budget) {
    const scale = budget / totalAllocated;
    result.forEach(r => {
      r.allocation_usd = Math.round(r.allocation_usd * scale);
      r.allocation_pct = Math.round((r.allocation_usd / budget) * 100);
    });
  }

  return result;
}

function findExistingExposure(
  instrument: RankedInstrument,
  positions: Record<string, { usd: number; chain?: string }>,
  portfolioData?: any,
): number {
  // Direct match
  const ticker = instrument.ticker.toUpperCase();
  for (const [name, pos] of Object.entries(positions)) {
    if (name.toUpperCase() === ticker) return pos.usd || 0;
  }

  // Correlation matching — crypto-to-crypto by theme overlap
  if (instrument.asset_class === "crypto") {
    // Known portfolio crypto positions and their themes
    const portfolioCryptoThemes: Record<string, string[]> = {
      "BNKR": ["ai", "base"],
      "KELLYCLAUDE": ["ai", "base"],
      "FELIX": ["ai", "base"],
      "KLED": ["meme", "base"],
    };
    const instrumentThemes = new Set(instrument.sub_themes?.map(t => t.toLowerCase()) || []);
    // Check if instrument shares a theme with any existing crypto position
    let correlatedExposure = 0;
    for (const [name, themes] of Object.entries(portfolioCryptoThemes)) {
      const pos = Object.entries(positions).find(([k]) => k.toUpperCase() === name);
      if (!pos) continue;
      const overlap = themes.some(t =>
        instrumentThemes.has(t) || [...instrumentThemes].some(it => it.includes(t) || t.includes(it))
      );
      if (overlap) correlatedExposure += pos[1].usd || 0;
    }
    // Also flag any thesis about "base chain" or "ai tokens" against all crypto
    if (correlatedExposure === 0) {
      const totalCrypto = Object.values(positions).reduce((s, p) => s + (p.usd || 0), 0);
      // If new crypto would add to already-high crypto allocation, flag the total
      const totalPortfolioVal = portfolioData?.total_estimate || 1;
      if (totalCrypto / totalPortfolioVal > 0.5) correlatedExposure = totalCrypto;
    }
    if (correlatedExposure > 0) return correlatedExposure;
  }

  // USDC/stablecoin exposure — check both positions and usdc_solana field
  if (instrument.sub_themes?.some(t => t.includes("stablecoin"))) {
    let stableExposure = Object.entries(positions)
      .filter(([name]) => ["USDC", "USDT", "DAI"].includes(name.toUpperCase()))
      .reduce((sum, [, pos]) => sum + (pos.usd || 0), 0);
    // Also check usdc_solana special field
    const usdcSolana = portfolioData?.usdc_solana?.amount || 0;
    stableExposure += usdcSolana;
    if (stableExposure > 0) return stableExposure;
  }

  return 0;
}

function inferDirection(instrument: RankedInstrument, thesis?: string): "long" | "short" {
  // Check if instrument was flagged for shorting by the rank stage
  if ((instrument as any)._direction === "short") return "short";
  // Staffing/labor stocks in a "replace jobs" thesis should be shorted
  if (instrument.sub_themes?.includes("staffing_labor")) return "short";
  
  // Thesis-based direction inference
  if (thesis) {
    const lower = thesis.toLowerCase();
    
    // Detect bearish thesis patterns
    const isBearish = /\b(crash|collapse|die|dying|dead|overvalued|overhyped|bubble|scam|fraud|no revenue|worthless|zero|dump|short|bearish|decline|fail|failing)\b/i.test(lower);
    const isReplace = /\b(replace|displace|kill|destroy|eat|obsolete|dinosaur)\b/i.test(lower);
    
    if (isBearish) {
      // For inverse/short ETFs, the thesis bearishness means we go LONG on them
      const isInverseETF = /^(SQQQ|SPXU|SRS|BITI|TBT|SDOW|SRTY|FAZ|SKF)$/i.test(instrument.ticker);
      if (isInverseETF) return "long";
      
      // Identify what the thesis is bearish ABOUT
      const bearishTarget = detectBearishTarget(lower);
      
      // If this instrument IS the thing being called bearish, short it
      if (bearishTarget && isTargetOfBearishness(instrument, bearishTarget)) return "short";
    }
    
    if (isReplace) {
      // "AI will replace Google" — short GOOG, long MSFT/OPENAI
      // "DeFi will eat banks" — short JPM/GS, long COIN/UNI
      const replaceTarget = detectReplaceTarget(lower);
      if (replaceTarget && isTargetOfReplacement(instrument, replaceTarget)) return "short";
    }
  }
  
  return "long";
}

function detectBearishTarget(thesis: string): string | null {
  // Extract what's being called bearish
  const patterns = [
    /\b(crypto|bitcoin|btc)\b.*\b(crash|collapse|dump)/i,
    /\b(quantum|commercial real estate|social media|ev|electric vehicle)\b.*\b(overhyped|dead|dying|collapse|overrated)/i,
    /\b(crash|collapse|dump|dead|dying|overhyped|overrated|overvalued)\b.*\b(crypto|bitcoin|btc|quantum|commercial real estate|social media)\b/i,
  ];
  
  if (/crypto|bitcoin/i.test(thesis) && /crash|collapse|dump/i.test(thesis)) return "crypto";
  if (/quantum/i.test(thesis) && /overhyped|no revenue/i.test(thesis)) return "quantum";
  if (/commercial real estate|office building/i.test(thesis) && /collapse|worthless/i.test(thesis)) return "commercial_re";
  if (/social media/i.test(thesis) && /dying|dead/i.test(thesis)) return "social_media";
  if (/electric vehicle|ev\b/i.test(thesis) && /overrated|overhyped/i.test(thesis)) return "ev";
  if (/google|search/i.test(thesis) && /replace/i.test(thesis)) return "google_search";
  
  return null;
}

function isTargetOfBearishness(instrument: RankedInstrument, target: string): boolean {
  const ticker = instrument.ticker.toUpperCase();
  
  switch (target) {
    case "crypto":
      // Short crypto-exposed stocks (they're long crypto by nature)
      return ["COIN", "MSTR", "MARA", "RIOT", "CLSK", "BITF", "HUT"].includes(ticker) ||
             instrument.asset_class === "crypto";
    case "quantum":
      return ["IONQ", "RGTI", "QUBT"].includes(ticker);
    case "commercial_re":
      return ["BXP", "SLG", "VNO", "CBRE"].includes(ticker);
    case "social_media":
      return ["META", "SNAP", "PINS", "RDDT"].includes(ticker);
    case "ev":
      return ["TSLA", "RIVN", "LCID", "NIO", "XPEV"].includes(ticker);
    default:
      return false;
  }
}

function detectReplaceTarget(thesis: string): string | null {
  if (/replace.*(google|search)/i.test(thesis) || /(google|search).*replace/i.test(thesis)) return "google";
  if (/(defi|decentralized).*(eat|replace|kill).*(bank|traditional finance|tradfi)/i.test(thesis) ||
      /(bank|traditional finance|tradfi).*(dinosaur|obsolete|dead)/i.test(thesis)) return "banks";
  return null;
}

function isTargetOfReplacement(instrument: RankedInstrument, target: string): boolean {
  const ticker = instrument.ticker.toUpperCase();
  switch (target) {
    case "google":
      return ticker === "GOOG" || ticker === "GOOGL";
    case "banks":
      return ["JPM", "GS", "MS", "BAC", "C", "WFC"].includes(ticker);
    default:
      return false;
  }
}

// Load ticker context for richer rationale
let _tickerContext: Record<string, { context: string; category: string }> | null = null;
function getTickerContext(): Record<string, { context: string; category: string }> {
  if (!_tickerContext) {
    try {
      const path = new URL("../references/ticker-context.json", import.meta.url).pathname;
      _tickerContext = JSON.parse(require("fs").readFileSync(path, "utf-8"));
    } catch {
      _tickerContext = {};
    }
  }
  return _tickerContext!;
}

function generateRationale(instrument: RankedInstrument, existingExposure: number): string {
  const parts: string[] = [];
  const ctx = getTickerContext()[instrument.ticker.toUpperCase()];

  if (instrument.asset_class === "secondary") {
    const secCtx = getTickerContext()[instrument.ticker.toUpperCase()];
    return `Pre-IPO. ${instrument.name}.${secCtx ? " " + secCtx.context + "." : ""} Illiquid — access via EquityZen/Forge.`;
  }

  // Lead with curated context if available
  if (ctx) {
    parts.push(ctx.context + ".");
  }

  if (instrument.asset_class === "etf") {
    if (!ctx) {
      parts.push(`Diversified ${instrument.sub_themes?.[0]?.replace(/_/g, " ") || "sector"} exposure.`);
    }
    if (instrument.price) parts.push(`$${instrument.price.toFixed(2)}.`);
    return parts.join(" ");
  }

  // Add valuation context
  if (instrument.pe_ratio) {
    if (instrument.pe_ratio < 15) {
      parts.push(`${instrument.pe_ratio.toFixed(1)}x PE — undervalued.`);
    } else if (instrument.pe_ratio > 100) {
      parts.push(`${instrument.pe_ratio.toFixed(0)}x PE — priced for perfection.`);
    } else if (!ctx) {
      // Only show PE if we don't have richer context
      parts.push(`${instrument.pe_ratio.toFixed(1)}x PE.`);
    }
  }

  // Market cap only if no context (avoid info overload)
  if (!ctx && instrument.market_cap) {
    const mcapB = instrument.market_cap / 1e9;
    if (mcapB > 100) parts.push(`$${mcapB.toFixed(0)}B mcap.`);
    else if (mcapB > 1) parts.push(`$${mcapB.toFixed(1)}B mcap.`);
    else parts.push(`$${(instrument.market_cap / 1e6).toFixed(0)}M mcap.`);
  }

  // Overlap warning
  if (existingExposure > 0) {
    parts.push(`⚠️ Already hold $${existingExposure.toLocaleString()}.`);
  }

  return parts.join(" ") || `Direct ${instrument.sub_themes?.[0]?.replace(/_/g, " ") || instrument.asset_class} play.`;
}

// CLI mode: bun run size.ts --tickers "AAPL:long,RHI:short" --budget 20000 [--portfolio path] [--thesis "text"]
if (import.meta.main) {
  const args = process.argv.slice(2);
  const tickerIdx = args.indexOf("--tickers");
  const budgetIdx = args.indexOf("--budget");
  const portfolioIdx = args.indexOf("--portfolio");
  const thesisIdx = args.indexOf("--thesis");

  if (tickerIdx < 0) {
    console.error("Usage: bun run size.ts --tickers 'AAPL:long,RHI:short' --budget 20000 [--portfolio path] [--thesis text]");
    process.exit(1);
  }

  const tickerPairs = args[tickerIdx + 1].split(",").map(t => {
    const [ticker, dir = "long"] = t.trim().split(":");
    return { ticker: ticker.toUpperCase(), direction: dir as "long" | "short" };
  });

  const budget = budgetIdx >= 0 ? parseInt(args[budgetIdx + 1]) : 20000;
  const portfolioPath = portfolioIdx >= 0 ? args[portfolioIdx + 1] : new URL("../../../examples/sample-state.json", import.meta.url).pathname;
  const thesis = thesisIdx >= 0 ? args[thesisIdx + 1] : undefined;

  const portfolio = JSON.parse(await Bun.file(portfolioPath).text());

  // Build fake ranked instruments from tickers
  const { enrichInstruments } = await import("./research");
  const { COINGECKO_IDS } = await import("./crypto-prices");
  
  const SECONDARIES_PATH = new URL("../references/secondaries.json", import.meta.url).pathname;
  let secondaries: Record<string, any> = {};
  try { secondaries = JSON.parse(await Bun.file(SECONDARIES_PATH).text()); } catch {}

  const candidates = tickerPairs.map(({ ticker, direction }) => {
    const lower = ticker.toLowerCase();
    const asset_class = secondaries[lower] ? "secondary" as const
      : COINGECKO_IDS[ticker] ? "crypto" as const
      : "stock" as const;
    return { ticker, name: ticker, asset_class, sub_themes: [] as string[], source: "claude" };
  });

  const enriched = await enrichInstruments(candidates);
  
  // Add direction flags and minimal scores
  const ranked: RankedInstrument[] = enriched.map((e, i) => ({
    ...e,
    scores: { thesis_alignment: 80 - i * 5, valuation: 50, catalyst_proximity: 50, liquidity: 50, portfolio_fit: 50, composite: 70 - i * 3 },
    rank: i + 1,
    _direction: tickerPairs.find(tp => tp.ticker === e.ticker)?.direction || "long",
  }));

  const sized = sizePositions(ranked, portfolio, budget, thesis);
  
  // Output
  console.log(JSON.stringify(sized.map(s => ({
    ticker: s.ticker,
    direction: s.direction,
    allocation_usd: s.allocation_usd,
    allocation_pct: s.allocation_pct,
    price: s.price,
    rationale: s.rationale,
    existing_exposure: s.existing_exposure,
    asset_class: s.asset_class,
  })), null, 2));
}
