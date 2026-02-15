/**
 * Ranking — scores and ranks enriched instruments
 * 
 * Weights: thesis_alignment 40%, valuation 20%, catalyst 20%, liquidity 10%, portfolio_fit 10%
 * 
 * thesis_alignment and catalyst_proximity are placeholder scores here — 
 * in production, Claude scores these qualitatively during the conversational flow.
 */

import type { EnrichedInstrument, RankedInstrument } from "./types";

// Algorithmic valuation score based on PE ratio
function scoreValuation(instrument: EnrichedInstrument): number {
  if (instrument.asset_class === "crypto" || instrument.asset_class === "secondary") {
    // Crypto: score by market cap (smaller = more upside potential, but also more risk)
    if (!instrument.market_cap) return 50;
    if (instrument.market_cap > 100e9) return 30; // mega cap
    if (instrument.market_cap > 10e9) return 50;  // large cap
    if (instrument.market_cap > 1e9) return 65;   // mid cap
    if (instrument.market_cap > 100e6) return 75;  // small cap
    return 40; // micro cap (risky)
  }

  // Stocks/ETFs: PE-based
  if (!instrument.pe_ratio) return 50; // no PE = neutral
  if (instrument.pe_ratio < 0) return 30; // negative earnings
  if (instrument.pe_ratio < 12) return 85; // cheap
  if (instrument.pe_ratio < 20) return 70; // reasonable
  if (instrument.pe_ratio < 35) return 55; // moderate
  if (instrument.pe_ratio < 60) return 40; // expensive
  if (instrument.pe_ratio < 100) return 25; // very expensive
  return 15; // extreme (PLTR territory)
}

// Algorithmic liquidity score
function scoreLiquidity(instrument: EnrichedInstrument): number {
  if (instrument.asset_class === "secondary") return 10; // illiquid by definition
  if (!instrument.volume_24h) return 30;
  
  if (instrument.asset_class === "crypto") {
    if (instrument.volume_24h > 1e9) return 95;
    if (instrument.volume_24h > 100e6) return 80;
    if (instrument.volume_24h > 10e6) return 65;
    if (instrument.volume_24h > 1e6) return 50;
    return 30;
  }

  // Stocks
  // volume_24h here is share count, multiply by price for dollar volume
  const dollarVol = (instrument.volume_24h || 0) * (instrument.price || 1);
  if (dollarVol > 1e9) return 95;
  if (dollarVol > 100e6) return 80;
  if (dollarVol > 10e6) return 65;
  return 45;
}

// Heuristic thesis alignment based on sub-theme position, count, and source
function scoreThesisAlignment(instrument: EnrichedInstrument, thesisThemes: string[]): number {
  let score = 40; // base

  const instThemes = instrument.sub_themes || [];
  
  // Primary theme match (first theme = highest signal) gets big bonus
  if (instThemes.length > 0 && thesisThemes.length > 0) {
    if (instThemes.includes(thesisThemes[0])) score += 30; // primary theme match
    if (instThemes.length > 1) score += 10; // spans multiple themes
  }
  
  // Secondary theme matches get smaller bonus
  for (const theme of instThemes) {
    const idx = thesisThemes.indexOf(theme);
    if (idx > 0) score += 10; // secondary theme match
  }

  // Direct theme-map matches are higher quality than fallbacks
  if (instrument.source === "theme-map") score += 10;
  if (instrument.source === "secondaries-registry") score += 15; // secondaries are non-obvious = valuable

  return Math.min(100, score);
}

// Placeholder catalyst score (Claude should override this in conversational mode)
function scoreCatalyst(instrument: EnrichedInstrument): number {
  // Base score — in conversational mode, Claude provides this
  if (instrument.catalyst) return 70;
  return 50;
}

// Detect which themes should be shorted based on thesis
function detectShortThemes(thesis: string): string[] {
  const lower = thesis.toLowerCase();
  const shortThemes: string[] = [];
  
  // "X will replace/kill/flip Y" patterns
  if (lower.includes("replace") || lower.includes("kill") || lower.includes("flip")) {
    // The losing side gets shorted
    if (lower.includes("ethereum") && lower.includes("solana")) {
      if (lower.includes("solana") && (lower.includes("flip ethereum") || lower.includes("replace ethereum"))) {
        shortThemes.push("ethereum_ecosystem");
      }
    }
  }
  
  // Bear keywords on specific sectors
  const bearPatterns: [string[], string[]][] = [
    [["replace", "jobs", "developer"], ["staffing_labor"]],
    [["crash", "housing"], ["real_estate"]],
    [["crash", "crypto"], ["solana_ecosystem", "ethereum_ecosystem", "defi", "crypto_broad"]],
  ];
  
  for (const [keywords, themes] of bearPatterns) {
    if (keywords.every(k => lower.includes(k))) {
      shortThemes.push(...themes);
    }
  }
  
  // "replace X% of jobs" → short staffing
  if (lower.includes("replace") && lower.includes("job")) {
    shortThemes.push("staffing_labor");
  }
  
  return shortThemes;
}

export function rankInstruments(enriched: EnrichedInstrument[], thesis: string): RankedInstrument[] {
  // Extract ordered themes from instruments (first-seen order reflects thesis priority)
  const themeOrder: string[] = [];
  for (const inst of enriched) {
    for (const t of inst.sub_themes || []) {
      if (!themeOrder.includes(t)) themeOrder.push(t);
    }
  }

  const shortThemes = detectShortThemes(thesis);

  const ranked: RankedInstrument[] = enriched.map(inst => {
    const scores = {
      thesis_alignment: scoreThesisAlignment(inst, themeOrder),
      valuation: scoreValuation(inst),
      catalyst_proximity: scoreCatalyst(inst),
      liquidity: scoreLiquidity(inst),
      portfolio_fit: 50, // Will be adjusted by size.ts based on portfolio
      composite: 0,
    };

    // Weighted composite
    scores.composite = Math.round(
      scores.thesis_alignment * 0.4 +
      scores.valuation * 0.2 +
      scores.catalyst_proximity * 0.2 +
      scores.liquidity * 0.1 +
      scores.portfolio_fit * 0.1
    );

    // Detect if this instrument should be shorted
    const isShort = (inst.sub_themes || []).some(t => shortThemes.includes(t));
    // Inverse ETFs are LONG when thesis is bearish
    const inverseETFs = ["BITI", "SQQQ", "SPXS", "UVXY"];
    const isInverse = inverseETFs.includes(inst.ticker.toUpperCase());
    const direction = isInverse ? "long" : isShort ? "short" : "long";

    return {
      ...inst,
      scores,
      rank: 0,
      _direction: direction,
    } as RankedInstrument;
  });

  // Sort by composite score descending
  ranked.sort((a, b) => b.scores.composite - a.scores.composite);
  
  // Assign ranks
  ranked.forEach((r, i) => r.rank = i + 1);

  return ranked;
}
