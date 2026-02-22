/** 1200x675 shareable card — three attribution tiers, quote-forward design. */

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
    year: "numeric",
  });
}

/**
 * Get the headline quote for the card. Uses author's voice when available.
 * Priority: headline_quote > source_quote > first derivation step > thesis
 */
function getQuote(call: Call, chain: ReturnType<typeof extractChainDisplay>): string {
  if (call.headline_quote) return call.headline_quote;
  if (call.source_quote) return call.source_quote;
  if (chain.steps[0] && call.source_handle) return chain.steps[0];
  return call.thesis;
}

/**
 * Get the attribution line at bottom of card.
 * direct: "direct call · belief.board"
 * derived: "@author's thesis · routed by belief.board"
 * inspired: "inspired by @author · routed by belief.board"
 * original: "belief.board"
 */
function getAttribution(call: Call): string {
  const handle = call.source_handle ? `@${call.source_handle}` : "";
  switch (call.call_type) {
    case "direct":
      return "direct call \u00b7 belief.board";
    case "derived":
      return handle ? `${handle}\u2019s thesis \u00b7 via belief.board` : "via belief.board";
    default:
      return "belief.board";
  }
}

export function renderCard(call: Call): string {
  const chain = extractChainDisplay(call);
  const quoteText = getQuote(call, chain);
  const fontSize = claimFontSize(quoteText);
  const sourceDate = call.source_date ?? call.created_at;
  const date = formatDate(sourceDate);
  const caller = escapeHtml(call.source_handle ?? call.caller_id);
  const quote = escapeHtml(quoteText);

  // Routing line: for derived, show arrow prefix
  const isRouted = call.call_type === "derived";
  const routePrefix = isRouted ? "\u2192 " : ""; // → symbol
  const routeLine = `${routePrefix}${call.ticker} ${call.direction} \u00b7 $${call.entry_price.toLocaleString()}`;

  // Derivation chain — show 2-3 steps max for card
  let chainHtml = "";
  if (isRouted && chain.hasChain && chain.steps.length > 0) {
    // Skip the first step if it's the source_quote (already shown as headline)
    const displaySteps = chain.steps.slice(0, 4);
    const stepItems = displaySteps
      .map((s) => `<div class="chain-step">${escapeHtml(s)}</div>`)
      .join("\n");
    chainHtml = `<div class="chain">${stepItems}</div>`;
  }

  // PnL if available
  let pnlHtml = "";
  const currentPrice = (call as Call & { current_price?: number }).current_price;
  if (currentPrice != null) {
    const pnl = ((currentPrice - call.entry_price) / call.entry_price) * 100;
    const sign = pnl >= 0 ? "+" : "";
    const color = pnl >= 0 ? "#16a34a" : "#dc2626";
    pnlHtml = `<span style="color:${color};font-weight:700;margin-left:12px">${sign}${pnl.toFixed(1)}%</span>`;
  }

  // Conviction badge removed — source quote carries the tone

  const attribution = escapeHtml(getAttribution(call));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1200">
<title>${caller}: ${quote}</title>
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
    padding: 56px 72px;
    position: relative;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
  }
  .caller {
    font-size: 20px;
    font-weight: 600;
    color: #111;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .date {
    font-size: 18px;
    color: #6b7280;
  }
  .quote {
    font-size: ${fontSize}px;
    font-weight: 700;
    line-height: 1.3;
    color: #111;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .quote::before { content: "\\201C"; color: #9ca3af; }
  .quote::after { content: "\\201D"; color: #9ca3af; }
  .route-line {
    font-size: 22px;
    font-weight: 700;
    color: #111;
    margin-top: 20px;
    margin-bottom: 12px;
  }
  .chain {
    margin-top: 8px;
    margin-bottom: 8px;
  }
  .chain-step {
    font-size: 14px;
    color: #6b7280;
    padding-left: 16px;
    margin-bottom: 2px;
  }
  .chain-step::before { content: "> "; color: #d1d5db; }
  .attribution {
    position: absolute;
    bottom: 28px;
    left: 72px;
    right: 72px;
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #9ca3af;
    letter-spacing: 0.02em;
  }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <span class="caller">${caller}</span>
    <div class="header-right">
      <span class="date">${date}</span>
    </div>
  </div>
  <div class="quote">${quote}</div>
  <div class="route-line">${escapeHtml(routeLine)}${pnlHtml}</div>
  ${chainHtml}
  <div class="attribution">
    <span>${attribution}</span>
  </div>
</div>
</body>
</html>`;
}
