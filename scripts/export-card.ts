#!/usr/bin/env bun
/**
 * Export trade card as SVG or text
 * Usage: bun run scripts/export-card.ts <thesis-id> [output.svg]
 *        bun run scripts/export-card.ts latest
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const HISTORY_DIR = new URL("../data/history/", import.meta.url).pathname;

const thesisId = Bun.argv[2];
const outputPath = Bun.argv[3] || `${thesisId || "card"}.svg`;

if (!thesisId) {
  console.error("Usage: bun run scripts/export-card.ts <thesis-id> [output.svg]");
  console.error("       bun run scripts/export-card.ts latest");
  process.exit(1);
}

// Resolve thesis ID
let filePath: string;
if (thesisId === "latest") {
  const files = readdirSync(HISTORY_DIR).filter(f => f.endsWith(".json")).sort();
  if (files.length === 0) { console.error("No theses saved. Run with --save first."); process.exit(1); }
  filePath = HISTORY_DIR + files[files.length - 1];
} else {
  filePath = `${HISTORY_DIR}${thesisId}.json`;
  if (!existsSync(filePath)) {
    const matches = readdirSync(HISTORY_DIR).filter(f => f.includes(thesisId));
    if (matches.length === 1) filePath = HISTORY_DIR + matches[0];
    else { console.error(`Thesis "${thesisId}" not found.`); process.exit(1); }
  }
}

const data = JSON.parse(readFileSync(filePath, "utf-8"));
const activeRecs = data.recommendations.filter((r: any) => r.allocation_usd > 0);

function scoreLabel(score: number) {
  return `${score}/100`;
}

function formatUsd(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `$${n.toLocaleString()}`;
}

// Fetch font
console.error("Loading font...");
let fontData: ArrayBuffer;
const localFont = new URL("../data/Inter-Regular.ttf", import.meta.url).pathname;
if (existsSync(localFont)) {
  fontData = readFileSync(localFont).buffer as ArrayBuffer;
} else {
  const fontRes = await fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf");
  fontData = await fontRes.arrayBuffer();
  writeFileSync(localFont, Buffer.from(fontData));
  console.error("  Cached font locally");
}

const totalAllocated = activeRecs.reduce((s: number, r: any) => s + r.allocation_usd, 0);
const date = new Date(data.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const confColor = data.confidence === "high" ? "#22c55e" : data.confidence === "medium" ? "#eab308" : "#ef4444";
const thesisText = data.thesis.length > 75 ? data.thesis.slice(0, 72) + "..." : data.thesis;

// Build JSX element
const element = {
  type: "div",
  props: {
    style: {
      display: "flex", flexDirection: "column", width: "100%", height: "100%",
      padding: 28, background: "linear-gradient(135deg, #0a0a0f 0%, #111118 100%)",
      fontFamily: "Inter", color: "#e4e4e7",
    },
    children: [
      // Header
      { type: "div", props: { style: { display: "flex", justifyContent: "space-between", marginBottom: 14 }, children: [
        { type: "span", props: { style: { fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#6366f1" }, children: "BELIEF ROUTER" } },
        { type: "span", props: { style: { fontSize: 11, padding: "2px 8px", borderRadius: 4, background: confColor + "33", color: confColor, fontWeight: 700 }, children: data.confidence.toUpperCase() } },
      ]}},
      // Thesis
      { type: "div", props: { style: { fontSize: 15, lineHeight: 1.5, marginBottom: 18, color: "#f4f4f5", fontStyle: "italic" }, children: `"${thesisText}"` } },
      // Recs
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
      // Footer
      { type: "div", props: { style: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "#52525b" }, children: [
        { type: "span", props: { children: `${formatUsd(totalAllocated)} deployed • ${data.time_horizon}` } },
        { type: "span", props: { children: date } },
      ]}},
    ]
  }
};

console.error("Rendering SVG...");
const svg = await satori(element as any, {
  width: 520,
  height: 380,
  fonts: [{ name: "Inter", data: fontData, weight: 400, style: "normal" as const }],
});

// Determine output format from extension
const isPng = outputPath.endsWith(".png");
if (isPng) {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1040 } }); // 2x for retina
  const pngData = resvg.render();
  writeFileSync(outputPath, pngData.asPng());
  console.log(`✅ Saved PNG to ${outputPath} (${(pngData.asPng().length / 1024).toFixed(1)}KB)`);
} else {
  writeFileSync(outputPath, svg);
  console.log(`✅ Saved SVG to ${outputPath} (${(svg.length / 1024).toFixed(1)}KB)`);
}
