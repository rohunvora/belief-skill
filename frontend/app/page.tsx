import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import TradeCard, { ThesisData } from "@/components/TradeCard";
import NewThesisForm from "@/components/NewThesisForm";

function loadTheses(): ThesisData[] {
  const historyDir = path.resolve(process.cwd(), "../data/history");
  if (!existsSync(historyDir)) return [];
  
  try {
    const files = readdirSync(historyDir).filter(f => f.endsWith(".json")).sort().reverse();
    return files.map(f => {
      const raw = JSON.parse(readFileSync(path.join(historyDir, f), "utf-8"));
      return raw as ThesisData;
    });
  } catch {
    return [];
  }
}

export default function Home() {
  const theses = loadTheses();

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 48 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          margin: 0,
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          🧠 Belief Router
        </h1>
        <p style={{ color: "#71717a", fontSize: 14, margin: "8px 0 0" }}>
          Thesis → Research → Rank → Size → Trade
        </p>
      </div>

      <NewThesisForm />

      {theses.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "80px 0",
          color: "#52525b",
        }}>
          <p style={{ fontSize: 48, margin: "0 0 16px" }}>🔮</p>
          <p style={{ fontSize: 16, margin: 0 }}>No theses yet</p>
          <p style={{ fontSize: 13, margin: "8px 0 0" }}>
            Run: <code style={{ background: "#1e1e26", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>
              bun run scripts/router.ts &quot;your thesis&quot; --save
            </code>
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))",
          gap: 24,
        }}>
          {theses.map(t => (
            <a key={t.id} href={`/thesis/${t.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <TradeCard data={t} />
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
