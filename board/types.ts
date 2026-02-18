/** Greentext derivation — variable-length reasoning trail from source quote to trade. */
export interface DerivationChain {
  steps: string[];           // each step earns the next — normie-readable, ticker inline
  chose_over?: string;       // alternatives considered — detail page only
}

/** Legacy structured chain — old format, converted to steps at read time. */
export interface LegacyDerivationChain {
  source_said: string;
  implies: string;
  searching_for: string;
  found_because: string;
  chose_over?: string;
}

export interface Call {
  id: string;
  thesis: string;
  ticker: string;
  direction: "long" | "short";
  entry_price: number;
  breakeven: string;
  kills: string;

  // attribution
  caller_id: string;
  source_handle: string | null;
  source_url: string | null;
  call_type: "original" | "direct" | "derived" | "inspired";

  // resolution
  status: "active" | "resolved" | "closed" | "expired";
  resolve_price: number | null;
  resolve_date: string | null;
  resolve_pnl: number | null;
  resolve_note: string | null;

  // metadata
  created_at: string;
  instrument: "stock" | "options" | "kalshi" | "perps" | null;
  platform: "robinhood" | "kalshi" | "hyperliquid" | null;

  // engagement (denormalized)
  votes: number;
  watchers: number;
  comments: number;

  // rich detail (optional — populated from deep routes)
  source_quote?: string;
  reasoning?: string;
  edge?: string;
  counter?: string;
  price_ladder?: PriceLadderStep[];
  alternative?: string;
  scan_source?: string; // e.g. "All-In Podcast (Feb 2026)"
  derivation?: string | DerivationChain | LegacyDerivationChain; // steps, legacy structured, or legacy string
}

/** Helper to detect legacy structured chain format */
function isLegacyChain(d: unknown): d is LegacyDerivationChain {
  return typeof d === "object" && d !== null && "source_said" in d && !("steps" in d);
}

/** Helper to detect new steps format */
function isStepsChain(d: unknown): d is DerivationChain {
  return typeof d === "object" && d !== null && "steps" in d && Array.isArray((d as DerivationChain).steps);
}

/** Convert legacy structured chain to steps (best effort) */
function legacyToSteps(d: LegacyDerivationChain): string[] {
  const steps: string[] = [];
  if (d.source_said) steps.push(d.source_said.toLowerCase());
  if (d.implies) steps.push(d.implies.replace(/\s*→\s*/g, ", "));
  if (d.found_because) steps.push(d.found_because);
  return steps;
}

/**
 * Single interface between data and UI for derivation chain display.
 * Handles steps chain, legacy structured chain, legacy string chain, and fallback.
 */
export function extractChainDisplay(call: Call): {
  steps: string[];
  chose_over: string | null;
  hasChain: boolean;
} {
  const empty = { steps: [], chose_over: null, hasChain: false };

  if (call.derivation && typeof call.derivation === "object") {
    // New steps format
    if (isStepsChain(call.derivation)) {
      return {
        steps: call.derivation.steps,
        chose_over: call.derivation.chose_over ?? null,
        hasChain: true,
      };
    }
    // Legacy structured format — convert to steps
    if (isLegacyChain(call.derivation)) {
      return {
        steps: legacyToSteps(call.derivation),
        chose_over: call.derivation.chose_over ?? null,
        hasChain: true,
      };
    }
  }

  // Legacy string chain — parse "Source said: ...\nImplies: ...\n..."
  if (call.derivation && typeof call.derivation === "string") {
    const lines = call.derivation.split("\n").filter(Boolean);
    const parsed: Record<string, string> = {};
    for (const line of lines) {
      const colonIdx = line.indexOf(": ");
      if (colonIdx !== -1) {
        const key = line.slice(0, colonIdx).toLowerCase().trim();
        const value = line.slice(colonIdx + 2).trim();
        if (key.includes("source")) parsed.source_said = value.replace(/^"|"$/g, "");
        else if (key.includes("impl")) parsed.implies = value;
        else if (key.includes("found")) parsed.found_because = value;
        else if (key.includes("chose")) parsed.chose_over = value;
      }
    }
    if (parsed.source_said) {
      const steps: string[] = [];
      steps.push(parsed.source_said.toLowerCase());
      if (parsed.implies) steps.push(parsed.implies.replace(/\s*→\s*/g, ", "));
      if (parsed.found_because) steps.push(parsed.found_because);
      return { steps, chose_over: parsed.chose_over ?? null, hasChain: true };
    }
  }

  // Fallback: source_quote as single step
  if (call.source_quote) {
    return { steps: [call.source_quote], chose_over: null, hasChain: false };
  }

  return empty;
}

export interface PriceLadderStep {
  price: number;
  pnl_pct: number;
  pnl_dollars: number;
  label: string; // "thesis wrong", "breakeven", "52-week high", etc.
}

export interface User {
  id: string;
  handle: string;
  bio: string | null;
  twitter: string | null;
  verified: boolean;
  created_at: string;

  avatar_url?: string; // twitter pfp or other image URL

  total_calls: number;
  accuracy: number | null;
  total_pnl: number | null;
  watchers: number;
}

export interface Comment {
  id: string;
  call_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  original_calls: number;
  curated_calls: number;
}
