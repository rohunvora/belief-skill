#!/usr/bin/env bun
/**
 * Seed search cache for testing when Brave API is rate-limited.
 * 
 * This seeds the CACHE only — discover.ts still uses web search as the primary mechanism.
 * When the Brave quota resets, real search results will replace these.
 */

const CACHE_DIR = new URL("../data/cache/search/", import.meta.url).pathname;

function cacheKey(query: string): string {
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    hash = ((hash << 5) - hash + query.charCodeAt(i)) | 0;
  }
  return `search_${Math.abs(hash).toString(36)}`;
}

interface CacheEntry {
  query: string;
  tickers: string[];
  snippets: string[];
  fetched_at: number;
}

// Seed data: representative search results for common investment themes
// These simulate what Brave Search returns for financial stock/ETF queries
const SEED_DATA: Record<string, { tickers: string[]; snippets: string[] }> = {
  // Energy / Oil
  "energy stocks": { 
    tickers: ["XOM", "CVX", "COP", "EOG", "SLB", "OXY", "MPC", "VLO", "PSX", "DVN", "XLE", "XOP", "VDE"],
    snippets: ["Top energy stocks include ExxonMobil (XOM), Chevron (CVX), ConocoPhillips (COP)", "Energy ETFs like XLE, XOP provide diversified exposure"]
  },
  "oil energy": {
    tickers: ["XOM", "CVX", "COP", "OXY", "SLB", "EOG", "USO", "XLE", "XOP", "OIH", "VDE"],
    snippets: ["Oil stocks: ExxonMobil (XOM), Chevron (CVX), ConocoPhillips (COP), Occidental (OXY)", "USO tracks crude oil prices, XLE is the energy sector ETF"]
  },
  "oil stocks": {
    tickers: ["XOM", "CVX", "COP", "OXY", "SLB", "EOG", "DVN", "MPC"],
    snippets: ["Best oil stocks to buy: XOM, CVX, COP, OXY", "Oil majors and exploration companies"]
  },
  "oil ETF": {
    tickers: ["USO", "XLE", "XOP", "OIH", "VDE", "DBO", "BNO"],
    snippets: ["USO - United States Oil Fund", "XLE - Energy Select Sector SPDR", "XOP - SPDR S&P Oil & Gas Exploration"]
  },
  // Gold
  "gold": {
    tickers: ["GLD", "NEM", "GOLD", "GDX", "IAU", "AEM", "WPM", "FNV", "RGLD"],
    snippets: ["Gold ETFs: GLD, IAU for physical gold exposure", "Gold miners: Newmont (NEM), Barrick (GOLD), Agnico Eagle (AEM)", "GDX tracks gold mining companies"]
  },
  "gold precious metals": {
    tickers: ["GLD", "IAU", "NEM", "GOLD", "GDX", "GDXJ", "SLV", "WPM", "AEM", "FNV"],
    snippets: ["Best gold stocks: NEM, GOLD, AEM, WPM", "Gold ETFs: GLD (SPDR Gold Shares), IAU (iShares Gold Trust)", "GDX and GDXJ for gold miners exposure"]
  },
  "gold safe haven": {
    tickers: ["GLD", "IAU", "NEM", "GOLD", "GDX", "SLV", "TLT"],
    snippets: ["Gold as safe haven investment", "GLD and IAU are the most popular gold ETFs", "Gold miners like NEM and GOLD offer leveraged exposure"]
  },
  // Bitcoin
  "Bitcoin": {
    tickers: ["MSTR", "COIN", "IBIT", "BITO", "FBTC", "MARA", "RIOT", "CLSK"],
    snippets: ["Bitcoin-related stocks: MicroStrategy (MSTR), Coinbase (COIN)", "Bitcoin ETFs: IBIT (BlackRock), BITO (ProShares), FBTC (Fidelity)", "Bitcoin mining stocks: Marathon Digital (MARA), Riot Platforms (RIOT)"]
  },
  "Bitcoin stocks": {
    tickers: ["MSTR", "COIN", "MARA", "RIOT", "CLSK", "BITF", "HUT"],
    snippets: ["Bitcoin proxy stocks to buy in 2025", "MicroStrategy holds 190,000+ BTC", "Coinbase is the largest US crypto exchange"]
  },
  "Bitcoin ETF": {
    tickers: ["IBIT", "FBTC", "BITO", "ARKB", "BITB"],
    snippets: ["Best Bitcoin ETFs: IBIT, FBTC, BITO", "Spot Bitcoin ETFs launched in January 2024"]
  },
  "Bitcoin crypto tokens": {
    tickers: ["BTC", "MSTR", "COIN", "IBIT"],
    snippets: ["Bitcoin (BTC) is the largest cryptocurrency", "Best way to invest in Bitcoin through ETFs and stocks"]
  },
  // Solana
  "Solana": {
    tickers: ["SOL", "JUP", "RAY", "COIN", "ORCA"],
    snippets: ["Solana (SOL) ecosystem tokens", "Jupiter (JUP) is the leading DEX on Solana", "Raydium (RAY) provides liquidity on Solana"]
  },
  "Solana future finance": {
    tickers: ["SOL", "JUP", "RAY", "COIN", "PYTH", "ORCA"],
    snippets: ["Solana ecosystem tokens for DeFi", "SOL, JUP, RAY are top Solana ecosystem plays"]
  },
  "Solana crypto tokens": {
    tickers: ["SOL", "JUP", "RAY", "PYTH", "BONK", "WIF", "ORCA", "JTO"],
    snippets: ["Top Solana tokens: SOL, JUP, RAY, PYTH", "Solana DeFi and meme tokens"]
  },
  // NVIDIA
  "NVIDIA": {
    tickers: ["NVDA", "AMD", "AVGO", "TSM", "SMH", "INTC", "MRVL", "QCOM"],
    snippets: ["NVIDIA (NVDA) leads AI chip market", "Semiconductor stocks: AMD, AVGO, TSM", "SMH ETF tracks semiconductors"]
  },
  "NVIDIA stocks": {
    tickers: ["NVDA", "AMD", "AVGO", "TSM", "MRVL", "QCOM", "INTC"],
    snippets: ["NVIDIA competitors and related stocks", "AI chip stocks to watch in 2025"]
  },
  "NVIDIA ETF": {
    tickers: ["SMH", "SOXX", "NVDA", "AMD", "AVGO"],
    snippets: ["Best semiconductor ETFs: SMH, SOXX", "VanEck Semiconductor ETF (SMH) is heavily weighted to NVIDIA"]
  },
  // AI
  "AI internet": {
    tickers: ["NVDA", "MSFT", "GOOG", "META", "AMD", "AVGO", "CRM", "NOW", "PLTR", "SMH", "AIQ"],
    snippets: ["Top AI stocks: NVIDIA (NVDA), Microsoft (MSFT), Google (GOOG), Meta (META)", "AI ETFs: AIQ, BOTZ, ROBT", "Palantir (PLTR) and CrowdStrike (CRWD) for AI software"]
  },
  "AI stocks": {
    tickers: ["NVDA", "MSFT", "GOOG", "META", "AMD", "CRM", "PLTR", "NOW", "SNOW"],
    snippets: ["Best AI stocks to buy in 2025", "NVIDIA dominates AI chip market", "Microsoft and Google are leading AI platform companies"]
  },
  "AI ETF": {
    tickers: ["AIQ", "BOTZ", "ROBT", "IRBO", "SMH"],
    snippets: ["Best AI ETFs: AIQ (Global X AI & Technology), BOTZ (robotics and AI)", "SMH for semiconductor/AI hardware exposure"]
  },
  // Ethereum
  "Ethereum": {
    tickers: ["ETH", "ETHA", "COIN", "MSTR", "ARB", "OP", "LDO", "UNI"],
    snippets: ["Ethereum (ETH) is the second-largest cryptocurrency", "Ethereum ETFs: ETHA (BlackRock), FETH (Fidelity)", "Layer 2 tokens: ARB, OP"]
  },
  "Ethereum ETF": {
    tickers: ["ETHA", "FETH", "ETHW"],
    snippets: ["Spot Ethereum ETFs approved in 2024", "ETHA from BlackRock is the largest Ethereum ETF"]
  },
  "Ethereum crypto tokens": {
    tickers: ["ETH", "ARB", "OP", "LDO", "UNI", "AAVE", "MKR", "ENS"],
    snippets: ["Top Ethereum ecosystem tokens", "Layer 2 scaling tokens: Arbitrum (ARB), Optimism (OP)"]
  },
  // Oil / Middle East
  "Oil Middle East tensions": {
    tickers: ["XOM", "CVX", "COP", "OXY", "SLB", "EOG", "USO", "XLE", "XOP", "OIH"],
    snippets: ["Oil stocks surge on Middle East tensions", "Energy sector benefits from geopolitical risk premium", "XOM, CVX, COP are the largest oil majors"]
  },
};

// Write cache files matching discover.ts's cache format
let seeded = 0;
for (const [queryKey, data] of Object.entries(SEED_DATA)) {
  // Generate multiple query variations that might match
  const queries = [
    `${queryKey} stocks to buy 2025`,
    `${queryKey} stocks to buy 2025 2026`,
    `${queryKey} publicly traded companies ticker symbol`,
    `best ${queryKey} ETF 2025`,
    `${queryKey} crypto tokens to buy`,
    `${queryKey} crypto tokens to buy 2025`,
    `${queryKey} companies stocks ticker symbol`,
    `${queryKey} ETFs to trade hedge`,
    `best ${queryKey} stocks to buy 2025`,
    `best ${queryKey} stocks ETF GLD NEM GDX 2025`,
    `${queryKey} investments ETF miners`,
    `best oil stocks to buy 2025 XOM CVX COP`,
    `oil energy ETF XLE XOP USO`,
    `best gold stocks ETF GLD NEM GDX 2025`,
    `gold safe haven investments ETF miners`,
  ];
  
  // Also add the raw key itself as a query
  queries.push(queryKey);
  
  for (const query of queries) {
    const key = cacheKey(query);
    const filePath = `${CACHE_DIR}${key}.json`;
    
    // Don't overwrite existing real cache
    const exists = await Bun.file(filePath).exists();
    if (!exists) {
      await Bun.write(filePath, JSON.stringify({
        query,
        tickers: data.tickers,
        snippets: data.snippets,
        fetched_at: Date.now(),
      }));
      seeded++;
    }
  }
}

console.log(`Seeded ${seeded} cache entries`);
