import { readFileSync, existsSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import TradeCard, { ThesisData } from "@/components/TradeCard";
import TrackButton from "@/components/TrackButton";

function loadThesis(id: string): ThesisData | null {
  const filePath = path.resolve(process.cwd(), `../data/history/${id}.json`);
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

export default async function ThesisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = loadThesis(id);
  if (!data) notFound();

  const totalAllocated = data.recommendations.reduce((s, r) => s + r.allocation_usd, 0);
  const activeRecs = data.recommendations.filter(r => r.allocation_usd > 0);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
      {/* Back link */}
      <a href="/" style={{ color: "#6366f1", fontSize: 13, textDecoration: "none", marginBottom: 24, display: "block" }}>
        ← All Theses
      </a>

      {/* Card */}
      <div style={{ marginBottom: 32 }}>
        <TradeCard data={data} />
      </div>

      {/* Track P&L */}
      <div style={{ marginBottom: 24 }}>
        <TrackButton thesisId={id} />
      </div>

      {/* Detail section */}
      <div style={{ background: "#111118", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px", color: "#e4e4e7" }}>
          📊 Position Details
        </h2>
        {activeRecs.map(rec => (
          <div key={rec.ticker} style={{
            padding: "14px 0",
            borderBottom: "1px solid #1e1e26",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{rec.ticker}</span>
              <span style={{ color: rec.direction === "long" ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                {rec.direction.toUpperCase()} ${rec.allocation_usd.toLocaleString()}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>
              {rec.rationale}
            </p>
            {rec.existing_exposure > 0 && (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#fbbf24" }}>
                ⚠️ Existing correlated exposure: ${rec.existing_exposure.toLocaleString()}
              </p>
            )}
            {rec.price ? (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#52525b" }}>
                Price at analysis: ${rec.price.toFixed(2)}
              </p>
            ) : null}
          </div>
        ))}

        {/* Secondaries */}
        {data.recommendations.filter(r => r.asset_class === "secondary").map(rec => (
          <div key={rec.ticker} style={{ padding: "14px 0", borderBottom: "1px solid #1e1e26" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#71717a" }}>📎 {rec.name || rec.ticker}</span>
              <span style={{ color: "#71717a", fontSize: 12 }}>Pre-IPO</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#71717a", lineHeight: 1.5 }}>
              {rec.rationale}
            </p>
          </div>
        ))}
      </div>

      {/* Invalidation */}
      {(data as any).invalidation && (
        <div style={{ background: "#1a0a0a", borderRadius: 12, padding: 24, border: "1px solid #2a1515" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px", color: "#ef4444" }}>
            ❌ Invalidation Triggers
          </h2>
          {(data as any).invalidation.map((inv: string, i: number) => (
            <p key={i} style={{ margin: "8px 0 0", fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>
              • {inv}
            </p>
          ))}
        </div>
      )}

      {/* Themes */}
      {(data as any).themes && (
        <div style={{ marginTop: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(data as any).themes.map((t: string) => (
            <span key={t} style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 6,
              background: "#1e1e26",
              color: "#6366f1",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}>
              {t.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}
    </main>
  );
}
