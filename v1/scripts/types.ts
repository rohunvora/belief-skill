export interface ParsedThesis {
  raw: string;
  core_claim: string;
  confidence: "high" | "medium" | "low";
  time_horizon: string;
  sub_themes: SubTheme[];
  assumptions: string[];
  invalidation: string[];
}

export interface SubTheme {
  theme: string;
  direction: "long" | "short" | "neutral";
  asset_classes: ("stock" | "etf" | "crypto" | "option" | "secondary")[];
}

export interface CandidateInstrument {
  ticker: string;
  name: string;
  asset_class: "stock" | "etf" | "crypto" | "option" | "secondary";
  chain?: string;
  sub_themes: string[];
  source: string;
}

export interface EnrichedInstrument extends CandidateInstrument {
  price: number;
  market_cap?: number;
  pe_ratio?: number;
  volume_24h?: number;
  catalyst?: string;
  risk_note?: string;
}

export interface RankedInstrument extends EnrichedInstrument {
  scores: {
    thesis_alignment: number;
    valuation: number;
    catalyst_proximity: number;
    liquidity: number;
    portfolio_fit: number;
    composite: number;
  };
  rank: number;
}

export interface SizedRecommendation extends RankedInstrument {
  direction: "long" | "short";
  allocation_usd: number;
  allocation_pct: number;
  rationale: string;
  existing_exposure: number;
  order_details?: string;
}

export interface ThesisOutput {
  id: string;
  timestamp: string;
  thesis: ParsedThesis;
  recommendations: SizedRecommendation[];
  portfolio_context: {
    total_portfolio: number;
    liquid_cash: number;
    budget_used: number;
    overlap_flags: string[];
  };
  format: "telegram" | "markdown" | "json";
}
