import { NextRequest } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

export const runtime = "nodejs";

function scoreLabel(score: number) { return `${score}/100`; }
function formatUsd(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `$${n.toLocaleString()}`;
}

let fontCache: ArrayBuffer | null = null;
async function getFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  const local = path.resolve(process.cwd(), "../data/Inter-Regular.ttf");
  if (existsSync(local)) {
    fontCache = readFileSync(local).buffer as ArrayBuffer;
  } else {
    const res = await fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf");
    fontCache = await res.arrayBuffer();
  }
  return fontCache;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const historyDir = path.resolve(process.cwd(), "../data/history");
  const filePath = path.join(historyDir, `${id}.json`);

  if (!existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }

  const data = JSON.parse(readFileSync(filePath, "utf-8"));
  const activeRecs = data.recommendations.filter((r: any) => r.allocation_usd > 0);
  const totalAllocated = activeRecs.reduce((s: number, r: any) => s + r.allocation_usd, 0);
  const date = new Date(data.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const confColor = data.confidence === "high" ? "#22c55e" : data.confidence === "medium" ? "#eab308" : "#ef4444";
  const thesisText = data.thesis.length > 75 ? data.thesis.slice(0, 72) + "..." : data.thesis;

  const format = req.nextUrl.searchParams.get("format") || "png";
  const fontData = await getFont();

  const element = {
    type: "div",
    props: {
      style: {
        display: "flex", flexDirection: "column", width: "100%", height: "100%",
        padding: 28, background: "linear-gradient(135deg, #0a0a0f 0%, #111118 100%)",
        fontFamily: "Inter", color: "#e4e4e7",
      },
      children: [
        { type: "div", props: { style: { display: "flex", justifyContent: "space-between", marginBottom: 14 }, children: [
          { type: "span", props: { style: { fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#6366f1" }, children: "BELIEF ROUTER" } },
          { type: "span", props: { style: { fontSize: 11, padding: "2px 8px", borderRadius: 4, background: confColor + "33", color: confColor, fontWeight: 700 }, children: data.confidence.toUpperCase() } },
        ]}},
        { type: "div", props: { style: { fontSize: 15, lineHeight: 1.5, marginBottom: 18, color: "#f4f4f5", fontStyle: "italic" }, children: `"${thesisText}"` } },
        { type: "div", props: { style: { display: "flex", flexDirection: "column", background: "#16161d", borderRadius: 10, padding: 12, marginBottom: 14 }, children:
          activeRecs.slice(0, 6).map((rec: any) => ({
            type: "div", props: { key: rec.ticker, style: { display: "flex", padding: "6px 0", fontSize: 13, borderBottom: "1px solid #1e1e26" }, children: [
              { type: "span", props: { style: { width: 70, fontWeight: 700, color: "#f4f4f5" }, children: rec.ticker } },
              { type: "span", props: { style: { width: 50, color: rec.direction === "long" ? "#22c55e" : "#ef4444", fontWeight: 600, fontSize: 11 }, children: rec.direction.toUpperCase() } },
              { type: "span", props: { style: { width: 60, color: "#a1a1aa" }, children: formatUsd(rec.allocation_usd) } },
              { type: "span", props: { style: { flex: 1, textAlign: "right", color: "#6366f1", fontSize: 12, fontWeight: 700 }, children: scoreLabel(rec.scores?.composite || 50) } },
            ]}
          }))
        }},
        { type: "div", props: { style: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "#52525b" }, children: [
          { type: "span", props: { children: `${formatUsd(totalAllocated)} deployed | ${data.time_horizon}` } },
          { type: "span", props: { children: date } },
        ]}},
      ]
    }
  };

  const svg = await satori(element as any, {
    width: 520, height: 380,
    fonts: [{ name: "Inter", data: fontData, weight: 400, style: "normal" as const }],
  });

  if (format === "svg") {
    return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
  }

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1040 } });
  const png = resvg.render().asPng();
  return new Response(png, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" } });
}
