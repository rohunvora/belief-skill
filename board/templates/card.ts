/** 1200x675 shareable card — light mode, claim-focused. */

import type { Call } from "../types";
import { extractChainDisplay } from "../types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Auto-size claim font: shorter claims get bigger text. */
function claimFontSize(claim: string): number {
  const len = claim.length;
  if (len < 60) return 44;
  if (len < 120) return 38;
  if (len < 200) return 32;
  return 28;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function renderCard(call: Call): string {
  const chain = extractChainDisplay(call);
  // Sourced calls: show the human's words (first step). Originals: show thesis.
  const firstStep = chain.steps[0];
  const claimText = (firstStep && call.source_handle)
    ? firstStep
    : call.thesis;
  const fontSize = claimFontSize(claimText);
  const date = formatDate(call.created_at);
  const caller = escapeHtml(call.source_handle ?? call.caller_id);
  const claim = escapeHtml(claimText);

  // Instrument + price line
  let detailParts: string[] = [];
  detailParts.push(escapeHtml(call.ticker));
  detailParts.push(`$${call.entry_price.toLocaleString()} at call`);

  // Show PnL if we have a current price (injected at render time, not on Call type)
  let pnlHtml = "";
  const currentPrice = (call as Call & { current_price?: number }).current_price;
  if (currentPrice != null) {
    const pnl = ((currentPrice - call.entry_price) / call.entry_price) * 100;
    const sign = pnl >= 0 ? "+" : "";
    const color = pnl >= 0 ? "#16a34a" : "#dc2626";
    detailParts.push(`<span style="color:${color};font-weight:700">${sign}${pnl.toFixed(1)}%</span>`);
  }

  const detailLine = detailParts.join(" \u00b7 ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1200">
<title>${caller}: ${claim}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 1200px;
    height: 675px;
    overflow: hidden;
    background: #fff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #111;
  }
  .card {
    width: 1200px;
    height: 675px;
    display: flex;
    flex-direction: column;
    padding: 64px 80px;
    position: relative;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 40px;
  }
  .caller {
    font-size: 20px;
    font-weight: 600;
    color: #111;
  }
  .date {
    font-size: 18px;
    color: #6b7280;
  }
  .claim {
    font-size: ${fontSize}px;
    font-weight: 700;
    line-height: 1.3;
    color: #111;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .claim::before { content: "\\201C"; color: #6b7280; }
  .claim::after { content: "\\201D"; color: #6b7280; }
  .divider {
    width: 200px;
    height: 1px;
    background: #d1d5db;
    margin: 32px 0 24px;
  }
  .details {
    font-size: 18px;
    color: #6b7280;
    letter-spacing: 0.01em;
  }
  .details .instrument {
    color: #111;
    font-weight: 600;
  }
  .brand {
    position: absolute;
    bottom: 28px;
    right: 40px;
    font-size: 14px;
    color: #d1d5db;
    letter-spacing: 0.05em;
  }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <span class="caller">${caller}</span>
    <span class="date">${date}</span>
  </div>
  <div class="claim">${claim}</div>
  <div class="divider"></div>
  <div class="details">${detailLine}</div>
  <div class="brand">belief.board</div>
</div>
</body>
</html>`;
}
