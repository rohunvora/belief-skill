/**
 * Semantic Expansion — broadens thesis matching beyond literal keywords
 * 
 * Two strategies:
 * 1. Synonym/alias expansion: maps common words to theme keywords
 * 2. Causal chain templates: maps patterns like "X war" → defense + energy + materials
 * 
 * This bridges the gap between raw keyword matching and full LLM reasoning.
 * In production (OpenClaw), Claude does this natively. This is for CLI fallback.
 */

// Word → themes that are semantically related (not just literal matches)
const SEMANTIC_ALIASES: Record<string, string[]> = {
  // Materials & commodities
  "metals": ["commodities"],
  "metal": ["commodities"],
  "mining": ["commodities"],
  "uranium": ["commodities", "energy_ai"],
  "nuclear": ["energy_ai", "commodities"],
  "rare earth": ["commodities"],
  "lithium": ["commodities", "ev_clean_energy"],
  
  // Conflict & geopolitics
  "war": ["defense_ai", "cybersecurity", "commodities"],
  "cold war": ["defense_ai", "cybersecurity", "commodities", "energy_ai"],
  "arms race": ["defense_ai", "commodities"],
  "manhattan project": ["defense_ai", "ai_compute", "energy_ai"],
  "national security": ["defense_ai", "cybersecurity"],
  "sanctions": ["commodities", "china", "defense_ai"],
  "tariff": ["china", "commodities"],
  
  // Economic policy
  "deregulation": ["fintech", "ev_clean_energy", "biotech", "crypto_broad"],
  "regulation": ["fintech", "stablecoin", "crypto_broad"],
  "national debt": ["interest_rates", "commodities", "crypto_broad"],
  "debasement": ["commodities", "crypto_broad"],
  "inflation": ["commodities", "interest_rates"],
  "rates": ["interest_rates", "real_estate"],
  "fed": ["interest_rates"],
  "stimulus": ["interest_rates", "crypto_broad"],
  
  // Tech industry  
  "pvp": ["china", "defense_ai", "cybersecurity"],
  "monopoly": ["ai_software", "ai_compute"],
  "saas": ["ai_software", "fintech"],
  "software": ["ai_software"],
  "open source": ["ai_software"],
  "coding": ["ai_software", "staffing_labor"],
  "agents": ["ai_software", "robotics_automation"],
  "agi": ["ai_compute", "ai_software"],
  "compute": ["ai_compute", "energy_ai"],
  "gpu": ["ai_compute"],
  "inference": ["ai_compute"],
  "training": ["ai_compute"],
  
  // Crypto specific
  "perp": ["defi", "solana_ecosystem"],
  "dex": ["defi", "solana_ecosystem"],
  "defi": ["defi"],
  "nft": ["gaming_metaverse"],
  "memecoin": ["solana_ecosystem", "crypto_broad"],
  "pump fun": ["solana_ecosystem"],
  "onchain": ["defi", "crypto_broad"],
  "layer 2": ["ethereum_ecosystem"],
  "l2": ["ethereum_ecosystem"],
  "bridge": ["ethereum_ecosystem", "solana_ecosystem"],
  
  // Consumer & culture
  "luxury": ["commodities"],
  "gaming": ["gaming_metaverse"],
  "game": ["gaming_metaverse"],
  "gta": ["gaming_metaverse"],
  "metaverse": ["gaming_metaverse"],
  "creator": ["attention_economy"],
  "attention": ["attention_economy"],
  "social": ["attention_economy"],
  "chronically online": ["attention_economy", "meme_culture"],
  "content": ["attention_economy"],
  "slop": ["attention_economy", "ai_software"],
  "human": ["attention_economy"],
  
  // Deregulation & policy
  "regulation": ["deregulation", "stablecoin"],
  "legalize": ["deregulation", "crypto_broad"],
  "workforce": ["deregulation", "staffing_labor"],
  "american": ["deregulation", "defense_ai"],
  
  // Memes & culture
  "trenches": ["meme_culture", "solana_ecosystem"],
  "degen": ["meme_culture", "defi"],
  "ct": ["meme_culture", "crypto_broad"],
  "pump fun": ["meme_culture", "solana_ecosystem"],
  "pump.fun": ["meme_culture", "solana_ecosystem"],
  
  // Market structure  
  "low float": ["meme_culture"],
  "high fdv": ["meme_culture"],
  "doxxed": ["meme_culture"],
  
  // Search & platforms
  "search engine": ["ai_software"],
  "google": ["ai_software"],
  
  // Healthcare
  "drug": ["biotech"],
  "pharma": ["biotech"],
  "obesity": ["biotech"],
  "healthcare": ["healthcare_insurance"],
  "insurance": ["healthcare_insurance"],
  
  // Space
  "space": ["space_defense"],
  "satellite": ["space_defense"],
  "rocket": ["space_defense"],
  "mars": ["space_defense"],
  "orbit": ["space_defense"],
};

// Causal chain patterns: if thesis matches pattern → expand to related themes
const CAUSAL_CHAINS: { pattern: RegExp; themes: string[]; reason: string }[] = [
  {
    pattern: /cold war|arms race|military.*ai|ai.*military/i,
    themes: ["defense_ai", "cybersecurity", "energy_ai", "commodities", "ai_compute"],
    reason: "Military AI race → defense spending + energy demand + compute + raw materials"
  },
  {
    pattern: /replace.*job|kill.*job|automat.*labor|replace.*worker/i,
    themes: ["ai_software", "robotics_automation", "staffing_labor"],
    reason: "Labor displacement → long AI tools, short staffing"
  },
  {
    pattern: /crash|bear|collapse|bubble.*pop/i,
    themes: ["crypto_broad", "interest_rates"],
    reason: "Market crash → hedges, inverse instruments, safe havens"
  },
  {
    pattern: /bull.*run|moon|explode|rip|send it|pump/i,
    themes: ["crypto_broad"],
    reason: "Bull market call"
  },
  {
    pattern: /trump|president|executive order|white house/i,
    themes: ["crypto_broad", "defense_ai", "fintech"],
    reason: "Political catalyst → crypto, defense, deregulation plays"
  },
  {
    pattern: /bearish.*ai|ai.*over|ai.*top/i,
    themes: ["ai_software", "ai_compute"],
    reason: "Bearish AI → short AI plays"
  },
  {
    pattern: /bullish.*ai|ai.*under|ai.*trade.*not.*over/i,
    themes: ["ai_software", "ai_compute"],
    reason: "Bullish AI → long AI plays"
  },
  {
    pattern: /ai coin|ai token|crypto.*ai|ai.*crypto/i,
    themes: ["ai_software", "crypto_broad"],
    reason: "AI crypto thesis → AI tokens + broad crypto"
  },
  {
    pattern: /china|ccp|beijing|xi jinping/i,
    themes: ["china", "defense_ai", "commodities"],
    reason: "China-related thesis → direct China plays + defense + supply chain"
  },
  {
    pattern: /crypto.*bro|wealth.*crypto|crypto.*rich|millionaire.*crypto/i,
    themes: ["crypto_broad", "fintech"],
    reason: "Crypto wealth effect → beneficiaries of crypto adoption"
  },
  {
    pattern: /open source.*ai|ai.*open source/i,
    themes: ["ai_software", "ai_compute"],
    reason: "Open source AI → compute demand, short proprietary moats"
  },
  {
    pattern: /energy.*transition|clean energy|green/i,
    themes: ["ev_clean_energy", "energy_ai", "commodities"],
    reason: "Energy transition → renewables, grid infrastructure, materials"
  },
  {
    pattern: /remove.*regulation|deregulat|rawdog.*capital|let.*american/i,
    themes: ["deregulation", "fintech", "crypto_broad", "biotech", "ev_clean_energy"],
    reason: "Deregulation → all regulated sectors benefit"
  },
  {
    pattern: /national debt|deficit|debt.*ceiling|debasement/i,
    themes: ["national_debt", "commodities", "crypto_broad", "interest_rates"],
    reason: "Fiscal concerns → hard assets, inflation hedges"
  },
  {
    pattern: /pump\.?fun|indie.*game|game.*developer|crypto.*gta/i,
    themes: ["gaming_metaverse", "solana_ecosystem", "meme_culture"],
    reason: "Gaming on Solana via pump.fun"
  },
  {
    pattern: /ai.*slop|genuine.*human|authentic/i,
    themes: ["attention_economy", "ai_software"],
    reason: "AI content flood → demand for authenticity"
  },
  {
    pattern: /chronically online|attention|reward.*online/i,
    themes: ["attention_economy", "meme_culture", "crypto_broad"],
    reason: "Attention economy thesis"
  },
  {
    pattern: /replace.*search|kill.*google|search.*replace/i,
    themes: ["ai_software"],
    reason: "Search disruption"
  },
  {
    pattern: /skill.*service|new.*saas/i,
    themes: ["ai_software", "staffing_labor"],
    reason: "Skills-as-a-service → AI disruption of services"
  },
  {
    pattern: /crash.*market|market.*crash|boost.*employment/i,
    themes: ["interest_rates", "staffing_labor", "crypto_broad"],
    reason: "Market manipulation/crash thesis"
  },
  {
    pattern: /single.*company.*\d+[bB]|biggest.*company|57[bB]/i,
    themes: ["ai_compute", "ai_software"],
    reason: "Big tech earnings → AI infrastructure"
  },
  {
    pattern: /pudgy|penguin/i,
    themes: ["meme_culture", "solana_ecosystem"],
    reason: "Pudgy Penguins ecosystem"
  },
  {
    pattern: /open.*source/i,
    themes: ["ai_software", "ai_compute"],
    reason: "Open source AI thesis"
  },
  {
    pattern: /local.*model|local.*inference|consumer.*gpu/i,
    themes: ["ai_compute"],
    reason: "Local inference → GPU hardware demand"
  },
];

/**
 * Expand a thesis into additional matching themes beyond literal keywords
 */
export function expandThesis(thesis: string): string[] {
  const lower = thesis.toLowerCase();
  const expandedThemes = new Set<string>();

  // 1. Synonym expansion
  for (const [alias, themes] of Object.entries(SEMANTIC_ALIASES)) {
    if (lower.includes(alias)) {
      themes.forEach(t => expandedThemes.add(t));
    }
  }

  // 2. Causal chain expansion
  for (const chain of CAUSAL_CHAINS) {
    if (chain.pattern.test(lower)) {
      chain.themes.forEach(t => expandedThemes.add(t));
    }
  }

  return [...expandedThemes];
}

// Also extract explicitly mentioned tickers from the text
export function extractMentionedTickers(thesis: string): string[] {
  const tickers: string[] = [];
  
  // Match $TICKER pattern
  const dollarMatches = thesis.match(/\$([A-Z]{1,10})/g);
  if (dollarMatches) {
    tickers.push(...dollarMatches.map(m => m.slice(1)));
  }
  
  // Match known token names (case-insensitive)
  const KNOWN_TOKENS: Record<string, string> = {
    "bitcoin": "BTC", "btc": "BTC", "ethereum": "ETH", "eth": "ETH",
    "solana": "SOL", "sol": "SOL", "hyperliquid": "HYPE",
    "nvidia": "NVDA", "nvda": "NVDA", "coinbase": "COIN",
    "palantir": "PLTR", "tesla": "TSLA",
    "trump": "TRUMP", "pudgy": "PENGU", "pudgy penguin": "PENGU", "bonk": "BONK",
    "jupiter": "JUP", "raydium": "RAY",
    "render": "RNDR", "fetch": "FET", "near": "NEAR", "akash": "AKT",
    "bittensor": "TAO", "virtual": "VIRTUAL", "ai16z": "AI16Z",
    "gala": "GALA", "immutable": "IMX",
    "pengu": "PENGU", "pudgy penguins": "PENGU",
    "amd": "AMD", "broadcom": "AVGO", "avgo": "AVGO",
    "google": "GOOG", "alphabet": "GOOG",
    "apple": "AAPL", "amazon": "AMZN", "meta": "META",
    "microsoft": "MSFT", "crowdstrike": "CRWD",
    "hype": "HYPE", "dydx": "DYDX",
    "spy": "SPY", "qqq": "QQQ",
  };
  
  const lower = thesis.toLowerCase();
  for (const [name, ticker] of Object.entries(KNOWN_TOKENS)) {
    if (lower.includes(name) && !tickers.includes(ticker)) {
      tickers.push(ticker);
    }
  }
  
  return tickers;
}
