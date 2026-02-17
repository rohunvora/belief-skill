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
  derivation?: {
    source_said: string;      // exact quote from source
    this_implies: string;     // mechanism extracted
    searched_for: string;     // what the router looked for
    found_because: string;    // why this ticker matches
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
