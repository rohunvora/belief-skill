/** Source evidence unit — a specific quote from the source material. */
export interface Segment {
  quote: string;             // verbatim quote from source
  speaker?: string;          // who said it (for multi-speaker sources)
  timestamp?: string;        // "14:22" for video/audio
  paragraph?: string;        // paragraph reference for text sources
  source_url?: string;       // permalink to this specific segment
}

/** A single step in the derivation chain, optionally linked to a source segment. */
export interface DerivationStep {
  text: string;              // normie-readable reasoning step, ticker inline
  segment?: number;          // index into segments[] — present = evidence, absent = inference
}

/**
 * Segment-based derivation chain — the current format.
 * Steps WITH a segment index = evidence (what was said, cited).
 * Steps WITHOUT a segment index = inference (skill's contribution).
 */
export interface DerivationChain {
  segments?: Segment[];      // source evidence units
  steps: (string | DerivationStep)[]; // string for backward compat, DerivationStep for new format
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

  // ── Layer 2: The Routing (skill's analysis — queryable) ──
  // "ticker" and "direction" are the ROUTED values (what the skill chose).
  // The author's original ticker/direction live in the blob as author_ticker/author_direction.
  thesis: string;            // skill's deeper claim / routed thesis
  ticker: string;            // routed_ticker — the instrument the skill selected
  direction: "long" | "short"; // routed_direction
  entry_price: number;       // price at source_date (not processing date)
  breakeven: string;
  kills: string;

  // ── Layer 1: The Call (author's signal — queryable) ──
  source_handle: string | null;
  source_url: string | null;
  source_date: string | null; // when they said it (ISO date, e.g. "2026-02-15")
  conviction: "high" | "medium" | "low" | "speculative" | null; // from language intensity
  call_type: "original" | "direct" | "derived"; // attribution tier

  // attribution
  caller_id: string;         // who submitted this routing

  // resolution
  status: "active" | "resolved" | "closed" | "expired";
  resolve_price: number | null;
  resolve_date: string | null;
  resolve_pnl: number | null;
  resolve_note: string | null;

  // metadata
  created_at: string;        // when the routing was processed
  instrument: "stock" | "options" | "kalshi" | "perps" | null;
  platform: "robinhood" | "kalshi" | "hyperliquid" | null;

  // engagement (denormalized)
  votes: number;
  watchers: number;
  comments: number;

  // ── Layer 1: The Call (author's signal — blob detail) ──
  source_quote?: string;     // verbatim, strongest 1-2 sentences
  author_thesis?: string;    // what they actually claimed, in their words (not reframed)
  author_ticker?: string;    // did they name a ticker? null if not
  author_direction?: string; // their stated direction, null if ambiguous
  conditions?: string;       // qualifications they stated, null if none
  segments?: Segment[];      // source evidence units with quotes/timestamps

  // ── Layer 2: The Routing (skill's analysis — blob detail) ──
  reasoning?: string;
  edge?: string;
  counter?: string;
  price_ladder?: PriceLadderStep[];
  alternative?: string;
  scan_source?: string;      // e.g. "All-In Podcast (Feb 2026)"
  derivation?: string | DerivationChain | LegacyDerivationChain; // segment-based, legacy steps, or legacy string
}

/** Helper to detect legacy structured chain format */
function isLegacyChain(d: unknown): d is LegacyDerivationChain {
  return typeof d === "object" && d !== null && "source_said" in d && !("steps" in d);
}

/** Helper to detect new steps format (string[] or DerivationStep[]) */
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

/** Normalize a step to its display text, whether it's a string or DerivationStep. */
function stepToText(step: string | DerivationStep): string {
  return typeof step === "string" ? step : step.text;
}

/**
 * Single interface between data and UI for derivation chain display.
 * Handles segment-based chains, legacy steps, legacy structured, legacy string, and fallback.
 */
export function extractChainDisplay(call: Call): {
  steps: string[];           // display text for each step
  segments: Segment[];       // source evidence units (empty for legacy data)
  chose_over: string | null;
  hasChain: boolean;
} {
  const empty = { steps: [], segments: [], chose_over: null, hasChain: false };

  if (call.derivation && typeof call.derivation === "object") {
    // New segment-based or steps format
    if (isStepsChain(call.derivation)) {
      return {
        steps: call.derivation.steps.map(stepToText),
        segments: call.derivation.segments ?? [],
        chose_over: call.derivation.chose_over ?? null,
        hasChain: true,
      };
    }
    // Legacy structured format — convert to steps
    if (isLegacyChain(call.derivation)) {
      return {
        steps: legacyToSteps(call.derivation),
        segments: [],
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
      return { steps, segments: [], chose_over: parsed.chose_over ?? null, hasChain: true };
    }
  }

  // Fallback: source_quote as single step
  if (call.source_quote) {
    return { steps: [call.source_quote], segments: [], chose_over: null, hasChain: false };
  }

  return empty;
}

/**
 * Extract structured derivation data for segment-linked display.
 * Returns the raw DerivationStep objects (not flattened to strings) so the UI
 * can show which steps are evidence (segment-linked) vs inference.
 */
export function extractDerivationDetail(call: Call): {
  steps: DerivationStep[];
  segments: Segment[];
  chose_over: string | null;
} | null {
  if (!call.derivation || typeof call.derivation !== "object") return null;
  if (!isStepsChain(call.derivation)) return null;

  // Only return structured data if we have actual DerivationStep objects
  const hasStructuredSteps = call.derivation.steps.some(s => typeof s === "object");
  if (!hasStructuredSteps) return null;

  return {
    steps: call.derivation.steps.map(s =>
      typeof s === "string" ? { text: s } : s
    ),
    segments: call.derivation.segments ?? [],
    chose_over: call.derivation.chose_over ?? null,
  };
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
