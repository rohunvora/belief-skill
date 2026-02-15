/**
 * Crypto price fetcher with multiple fallback sources
 * Priority: Cache → CoinGecko batch → DexScreener → hardcoded estimates
 */

export const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin", ETH: "ethereum", SOL: "solana", MATIC: "matic-network",
  ARB: "arbitrum", OP: "optimism", AAVE: "aave", UNI: "uniswap",
  MKR: "maker", CRV: "curve-dao-token", LDO: "lido-dao", RPL: "rocket-pool",
  DYDX: "dydx-chain", JUP: "jupiter-exchange-solana", RAY: "raydium",
  RNDR: "render-token", AKT: "akash-network", TAO: "bittensor",
  BONK: "bonk", WIF: "dogwifcoin", PYTH: "pyth-network", ENS: "ethereum-name-service",
  SNX: "havven", FXS: "frax-share", ORCA: "orca", JTO: "jito-governance-token",
};

export interface CryptoData {
  name: string;
  price: number;
  market_cap?: number;
  volume_24h?: number;
}

/**
 * Batch fetch crypto prices from CoinGecko's simple/price endpoint
 * Much more efficient than individual /coins/{id} calls
 */
export async function batchFetchCoinGecko(tickers: string[]): Promise<Record<string, CryptoData>> {
  const result: Record<string, CryptoData> = {};
  
  // Map tickers to CoinGecko IDs
  const idToTicker: Record<string, string> = {};
  const ids: string[] = [];
  for (const ticker of tickers) {
    const id = COINGECKO_IDS[ticker.toUpperCase()];
    if (id) {
      ids.push(id);
      idToTicker[id] = ticker.toUpperCase();
    }
  }

  if (ids.length === 0) return result;

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`   ⚠️ CoinGecko batch failed: HTTP ${res.status}`);
      return result;
    }
    const json = await res.json();
    
    // Check for error response
    if (json.status?.error_code) {
      console.error(`   ⚠️ CoinGecko: ${json.status.error_message}`);
      return result;
    }

    for (const [id, data] of Object.entries(json) as [string, any][]) {
      const ticker = idToTicker[id];
      if (ticker && data.usd) {
        result[ticker] = {
          name: ticker, // Will be enriched from other sources
          price: data.usd,
          market_cap: data.usd_market_cap,
          volume_24h: data.usd_24h_vol,
        };
      }
    }
  } catch (e) {
    console.error(`   ⚠️ CoinGecko batch error: ${(e as Error).message}`);
  }

  return result;
}

/**
 * Fetch from DexScreener search API — good for DEX-native tokens
 */
export async function fetchDexScreener(ticker: string): Promise<CryptoData | null> {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${ticker}`);
    if (!res.ok) return null;
    const json = await res.json();
    const pairs = (json.pairs || [])
      .filter((p: any) => p.baseToken?.symbol?.toUpperCase() === ticker.toUpperCase())
      .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
    
    if (pairs.length === 0) return null;
    const best = pairs[0];
    
    return {
      name: best.baseToken?.name || ticker,
      price: parseFloat(best.priceUsd || "0"),
      market_cap: best.marketCap || best.fdv,
      volume_24h: best.volume?.h24,
    };
  } catch {
    return null;
  }
}
