/** Structured derivation chain — the reasoning trail from source quote to trade. */
export interface DerivationChain {
  source_said: string;     // hook — the fragment a listener would remember. ≤80 chars, verbatim from source's words
  implies: string;          // causal mechanism — card subheader, lowercase
  searching_for: string;    // what the AI looked for — detail page
  found_because: string;    // why this ticker — detail page
  chose_over: string;       // why this ticker over the alternatives considered
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
  derivation?: string | DerivationChain; // structured chain or legacy string
}

/**
 * Single interface between data and UI for derivation chain display.
 * Handles structured chain, legacy string chain, and fallback to source_quote/reasoning.
 */
export function extractChainDisplay(call: Call): {
  source_said: string | null;
  implies: string | null;
  searching_for: string | null;
  found_because: string | null;
  chose_over: string | null;
  hasChain: boolean;
} {
  const empty = { source_said: null, implies: null, searching_for: null, found_because: null, chose_over: null, hasChain: false };

  // Structured chain — preferred
  if (call.derivation && typeof call.derivation === "object") {
    return {
      source_said: call.derivation.source_said,
      implies: call.derivation.implies,
      searching_for: call.derivation.searching_for,
      found_because: call.derivation.found_because,
      chose_over: call.derivation.chose_over ?? null,
      hasChain: true,
    };
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
        else if (key.includes("search")) parsed.searching_for = value;
        else if (key.includes("found")) parsed.found_because = value;
        else if (key.includes("chose")) parsed.chose_over = value;
      }
    }
    if (parsed.source_said) {
      return {
        source_said: parsed.source_said ?? null,
        implies: parsed.implies ?? null,
        searching_for: parsed.searching_for ?? null,
        found_because: parsed.found_because ?? null,
        chose_over: parsed.chose_over ?? null,
        hasChain: true,
      };
    }
  }

  // Fallback: use source_quote if available (no full chain, but we have the quote)
  if (call.source_quote) {
    return {
      source_said: call.source_quote,
      implies: null,
      searching_for: null,
      found_because: null,
      chose_over: null,
      hasChain: false,
    };
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
