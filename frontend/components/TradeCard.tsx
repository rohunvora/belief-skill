"use client";

export interface TradeRecommendation {
  ticker: string;
  name: string;
  direction: "long" | "short";
  allocation_usd: number;
  asset_class: string;
  scores: { composite: number };
  existing_exposure: number;
  rationale: string;
  price?: number;
  pnl_pct?: number;
}

export interface ThesisData {
  id: string;
  thesis: string;
  confidence: "high" | "medium" | "low";
  time_horizon: string;
  recommendations: TradeRecommendation[];
  budget: number;
  created_at: string;
  total_pnl_pct?: number;
}

function stars(score: number) {
  const count = Math.max(1, Math.round(score / 20));
  return "★".repeat(count) + "☆".repeat(5 - count);
}

function formatUsd(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `$${n.toLocaleString()}`;
}

function confidenceColor(c: string) {
  if (c === "high") return "#22c55e";
  if (c === "medium") return "#eab308";
  return "#ef4444";
}

export default function TradeCard({ data }: { data: ThesisData }) {
  const date = new Date(data.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const totalAllocated = data.recommendations.reduce((s, r) => s + r.allocation_usd, 0);

  return (
    <div style={{
      width: 480,
      background: "linear-gradient(135deg, #0a0a0f 0%, #111118 100%)",
      borderRadius: 16,
      border: "1px solid #222",
      padding: 28,
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: "#e4e4e7",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: "#6366f1", textTransform: "uppercase" }}>
          🧠 Belief Router
        </span>
        <span style={{
          fontSize: 11,
          padding: "2px 8px",
          borderRadius: 4,
          background: confidenceColor(data.confidence) + "22",
          color: confidenceColor(data.confidence),
          fontWeight: 600,
        }}>
          {data.confidence.toUpperCase()}
        </span>
      </div>

      {/* Thesis */}
      <p style={{
        fontSize: 15,
        lineHeight: 1.5,
        margin: "0 0 20px",
        color: "#f4f4f5",
        fontStyle: "italic",
      }}>
        &ldquo;{data.thesis}&rdquo;
      </p>

      {/* Recommendations */}
      <div style={{
        background: "#16161d",
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 16,
      }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "70px 48px 64px 1fr",
          gap: 4,
          fontSize: 10,
          color: "#71717a",
          textTransform: "uppercase",
          letterSpacing: 1,
          paddingBottom: 8,
          borderBottom: "1px solid #27272a",
          marginBottom: 6,
        }}>
          <span>Ticker</span>
          <span>Side</span>
          <span>Size</span>
          <span style={{ textAlign: "right" }}>Score</span>
        </div>

        {data.recommendations.filter(r => r.allocation_usd > 0).map((rec, i) => (
          <div key={rec.ticker} style={{
            display: "grid",
            gridTemplateColumns: "70px 48px 64px 1fr",
            gap: 4,
            padding: "6px 0",
            fontSize: 13,
            borderBottom: i < data.recommendations.filter(r => r.allocation_usd > 0).length - 1 ? "1px solid #1e1e26" : "none",
          }}>
            <span style={{ fontWeight: 700, color: "#f4f4f5" }}>
              {rec.ticker}
            </span>
            <span style={{
              color: rec.direction === "long" ? "#22c55e" : "#ef4444",
              fontWeight: 600,
              fontSize: 11,
            }}>
              {rec.direction === "long" ? "LONG" : "SHORT"}
            </span>
            <span style={{ color: "#a1a1aa" }}>
              {formatUsd(rec.allocation_usd)}
            </span>
            <span style={{ textAlign: "right", color: "#6366f1", fontSize: 12, letterSpacing: 1 }}>
              {stars(rec.scores.composite)}
            </span>
          </div>
        ))}

        {/* Secondaries (no allocation) */}
        {data.recommendations.filter(r => r.allocation_usd === 0 && r.asset_class === "secondary").map(rec => (
          <div key={rec.ticker} style={{
            padding: "6px 0",
            fontSize: 11,
            color: "#71717a",
            fontStyle: "italic",
          }}>
            📎 {rec.name || rec.ticker} — Pre-IPO opportunity
          </div>
        ))}
      </div>

      {/* P&L row (if tracking) */}
      {data.total_pnl_pct !== undefined && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: data.total_pnl_pct >= 0 ? "#052e1622" : "#2e050522",
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
        }}>
          <span style={{ color: "#a1a1aa" }}>P&L</span>
          <span style={{
            color: data.total_pnl_pct >= 0 ? "#22c55e" : "#ef4444",
            fontWeight: 700,
          }}>
            {data.total_pnl_pct >= 0 ? "+" : ""}{data.total_pnl_pct.toFixed(1)}%
          </span>
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 11,
        color: "#52525b",
      }}>
        <span>{formatUsd(totalAllocated)} deployed • {data.time_horizon}</span>
        <span>{date}</span>
      </div>

      {/* Overlap warning */}
      {data.recommendations.some(r => r.existing_exposure > 0) && (
        <div style={{
          marginTop: 12,
          padding: "8px 12px",
          background: "#422006",
          borderRadius: 6,
          fontSize: 11,
          color: "#fbbf24",
          lineHeight: 1.4,
        }}>
          ⚠️ Correlated exposure detected — see full analysis
        </div>
      )}
    </div>
  );
}
