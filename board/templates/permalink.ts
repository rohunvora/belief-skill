/** Server-rendered permalink page — two-layer display with attribution tiers. */

import type { Call, Segment } from "../types";
import { extractChainDisplay, extractDerivationDetail } from "../types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "\u2026" : s;
}

/**
 * Get the attribution label for the tier badge.
 */
function tierLabel(call: Call): string {
  const handle = call.source_handle ? `@${call.source_handle}` : "unknown";
  switch (call.call_type) {
    case "direct": return `direct call by ${handle}`;
    case "derived": return `${handle}\u2019s thesis \u00b7 via belief.board`;
    default: return "belief.board";
  }
}

/**
 * Build the author's signal section (Layer 1).
 * Shows the faithful extraction: their quote, thesis, ticker, conviction, conditions.
 */
function buildAuthorSection(call: Call): string {
  const parts: string[] = [];

  // Source quote — verbatim
  if (call.source_quote) {
    parts.push(`<blockquote class="source-quote">${escapeHtml(truncate(call.source_quote, 400))}</blockquote>`);
  }

  // Headline quote (if different from source_quote — shows the card-friendly version)
  if (call.headline_quote && call.headline_quote !== call.source_quote) {
    parts.push(`<div class="headline-quote"><span class="field-label">Key quote:</span> ${escapeHtml(call.headline_quote)}</div>`);
  }

  // Author's ticker (if they named one)
  if (call.author_ticker) {
    const dir = call.author_direction ? ` ${call.author_direction}` : "";
    parts.push(`<div class="author-detail"><span class="field-label">Their pick:</span> ${escapeHtml(call.author_ticker)}${dir}</div>`);
  }

  // Conditions
  if (call.conditions) {
    parts.push(`<div class="author-detail conditions"><span class="field-label">Conditions:</span> ${escapeHtml(call.conditions)}</div>`);
  }

  if (parts.length === 0) return "";
  return `<div class="section author-section">
    <div class="section-header">What They Said</div>
    ${parts.join("\n")}
  </div>`;
}

/**
 * Build the derivation chain section with evidence/inference markers.
 * Steps with segment links show a citation marker; steps without are marked as inference.
 */
function buildChainSection(call: Call): string {
  // Try structured derivation first (segment-linked steps)
  const detail = extractDerivationDetail(call);
  if (detail && detail.steps.length > 0) {
    const stepItems = detail.steps.map((step) => {
      const hasEvidence = step.segment !== undefined && detail.segments[step.segment];
      const seg = hasEvidence ? detail.segments[step.segment!] : null;
      const marker = hasEvidence ? "cited" : "inferred";
      const markerClass = hasEvidence ? "step-evidence" : "step-inference";

      let citationHtml = "";
      if (seg) {
        const speaker = seg.speaker ? `${seg.speaker}` : "";
        const ts = seg.timestamp ? ` @ ${seg.timestamp}` : "";
        citationHtml = `<span class="step-citation">${escapeHtml(speaker)}${escapeHtml(ts)}</span>`;
      }

      return `<div class="chain-step ${markerClass}">
        <span class="step-marker">${marker}</span>
        <span class="step-text">${escapeHtml(step.text)}</span>
        ${citationHtml}
      </div>`;
    }).join("\n");

    const choseOverHtml = detail.chose_over
      ? `<div class="chain-chose-over"><span class="field-label">Instead of:</span> ${escapeHtml(detail.chose_over)}</div>`
      : "";

    return `<div class="section chain-section">
      <div class="section-header">Reasoning</div>
      ${stepItems}
      ${choseOverHtml}
    </div>`;
  }

  // Fall back to flat chain display (legacy data)
  const chain = extractChainDisplay(call);
  if (!chain.hasChain || chain.steps.length === 0) return "";

  const stepItems = chain.steps
    .map((s) => `<div class="chain-step step-flat">&gt; ${escapeHtml(s)}</div>`)
    .join("\n");
  const choseOverHtml = chain.chose_over
    ? `<div class="chain-chose-over"><span class="field-label">Instead of:</span> ${escapeHtml(chain.chose_over)}</div>`
    : "";

  return `<div class="section chain-section">
    <div class="section-header">Reasoning</div>
    ${stepItems}
    ${choseOverHtml}
  </div>`;
}

/**
 * Build the price ladder section.
 */
function buildLadderSection(call: Call): string {
  if (!call.price_ladder || call.price_ladder.length === 0) return "";

  const sorted = [...call.price_ladder].sort((a, b) => a.price - b.price);
  const maxAbs = Math.max(...sorted.map((s) => Math.abs(s.pnl_pct)), 1);
  const rows = sorted
    .map((step) => {
      const isNeg = step.pnl_pct < 0;
      const color = isNeg ? "#dc2626" : "#16a34a";
      const sign = isNeg ? "" : "+";
      const barWidth = Math.round((Math.abs(step.pnl_pct) / maxAbs) * 100);
      return `<div class="ladder-row">
        <span class="ladder-price">$${step.price.toLocaleString()}</span>
        <span class="ladder-bar-wrap"><span class="ladder-bar" style="width:${barWidth}%;background:${color}"></span></span>
        <span class="ladder-pnl" style="color:${color}">${sign}${step.pnl_pct}%</span>
      </div>
      <div class="ladder-label-row">${escapeHtml(step.label)}</div>`;
    })
    .join("\n");

  return `<div class="section ladder-section">
    <div class="section-header">Price Ladder</div>
    ${rows}
  </div>`;
}

export function renderPermalink(call: Call): string {
  const sourceDate = call.source_date ?? call.created_at;
  const date = formatDate(sourceDate);
  const caller = call.source_handle ?? call.caller_id;
  const thesis = escapeHtml(call.thesis);

  // OG meta — use author's voice for social previews
  const ogQuote = call.headline_quote ?? call.source_quote ?? call.thesis;
  const ogTitleText = call.source_handle
    ? `${caller}: "${truncate(ogQuote, 70)}"`
    : truncate(call.thesis, 80);
  const ogTitle = escapeHtml(ogTitleText);
  const ogParts: string[] = [call.ticker, `$${call.entry_price}`, date];
  const ogDescription = escapeHtml(ogParts.join(" \u2014 "));

  // Conviction badge removed — source quote carries the tone

  // Tier label
  const tier = escapeHtml(tierLabel(call));

  // Routing line with direction
  const isRouted = call.call_type === "derived";
  const routePrefix = isRouted ? "\u2192 " : "";
  const routeHtml = `<div class="route-line">${routePrefix}<strong>${escapeHtml(call.ticker)}</strong> ${call.direction} \u00b7 $${call.entry_price.toLocaleString()} at call</div>`;

  // Author section
  const authorHtml = buildAuthorSection(call);

  // Derivation chain
  const chainHtml = buildChainSection(call);

  // Price ladder
  const ladderHtml = buildLadderSection(call);

  // Reasoning
  let reasoningHtml = "";
  if (call.reasoning) {
    reasoningHtml = `<div class="section reasoning"><div class="section-header">Reasoning</div><p>${escapeHtml(truncate(call.reasoning, 600))}</p></div>`;
  }

  // Edge + Counter
  let edgeHtml = "";
  if (call.edge) {
    edgeHtml = `<div class="section"><div class="section-header">Edge</div><p>${escapeHtml(truncate(call.edge, 400))}</p></div>`;
  }
  let counterHtml = "";
  if (call.counter) {
    counterHtml = `<div class="section"><div class="section-header">Counter</div><p>${escapeHtml(truncate(call.counter, 400))}</p></div>`;
  }

  // Source link
  let sourceLink = "";
  if (call.source_url) {
    sourceLink = `<a href="${escapeHtml(call.source_url)}" target="_blank" rel="noopener">Source</a> \u00b7 `;
  }

  // Created vs source date note
  const processedDate = formatDate(call.created_at);
  const dateNote = call.source_date && call.source_date !== call.created_at.slice(0, 10)
    ? `<span class="date-note">Said ${date} \u00b7 Added ${processedDate}</span>`
    : `<span class="date-note">${date}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${ogTitle}</title>
<meta property="og:title" content="${ogTitle}">
<meta property="og:description" content="${ogDescription}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${ogTitle}">
<meta name="twitter:description" content="${ogDescription}">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #111;
    background: #fff;
    line-height: 1.5;
    max-width: 640px;
    margin: 0 auto;
    padding: 24px 16px;
  }
  a { color: #111; }
  a:hover { color: #6b7280; }
  .nav {
    padding-bottom: 16px;
    margin-bottom: 24px;
    border-bottom: 1px solid #e5e7eb;
  }
  .nav a { font-weight: 600; text-decoration: none; font-size: 15px; letter-spacing: 0.03em; }

  /* Header */
  .take-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .caller { font-weight: 600; font-size: 17px; }
  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .date-note { color: #9ca3af; font-size: 13px; }

  /* Tier badge */
  .tier {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 16px;
  }

  /* Thesis */
  .thesis {
    font-size: 22px;
    font-weight: 600;
    line-height: 1.4;
    margin-bottom: 12px;
  }

  /* Route line */
  .route-line {
    font-size: 16px;
    color: #374151;
    margin-bottom: 20px;
  }
  .route-line strong { color: #111; }

  /* Shared section style */
  .section {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 12px 16px;
    margin-bottom: 16px;
  }
  .section-header {
    font-size: 10px;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }
  .section p {
    font-size: 14px;
    color: #374151;
    line-height: 1.6;
  }

  /* Author section (Layer 1) */
  .source-quote {
    font-size: 14px;
    color: #6b7280;
    border-left: 3px solid #d1d5db;
    padding: 8px 16px;
    margin-bottom: 10px;
    font-style: italic;
  }
  .author-thesis {
    font-size: 14px;
    color: #374151;
    margin-bottom: 6px;
  }
  .author-detail {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 4px;
  }
  .conditions {
    font-style: italic;
  }
  .field-label {
    font-weight: 600;
    color: #6b7280;
  }

  /* Chain section */
  .chain-step {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 13px;
    color: #374151;
    margin-bottom: 6px;
    padding: 4px 0;
  }
  .step-marker {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 1px 6px;
    border-radius: 3px;
    flex-shrink: 0;
  }
  .step-evidence .step-marker {
    background: #dbeafe;
    color: #1e40af;
  }
  .step-inference .step-marker {
    background: #f3e8ff;
    color: #6b21a8;
  }
  .step-text { flex: 1; }
  .step-citation {
    font-size: 11px;
    color: #9ca3af;
    flex-shrink: 0;
  }
  .step-flat {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 4px;
  }
  .chain-chose-over {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e5e7eb;
  }

  /* Ladder */
  .ladder-row {
    display: grid;
    grid-template-columns: 72px 1fr 48px;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .ladder-price {
    font-weight: 600;
    font-size: 13px;
    color: #374151;
    text-align: right;
  }
  .ladder-bar-wrap {
    height: 6px;
    background: #f3f4f6;
    border-radius: 3px;
    overflow: hidden;
  }
  .ladder-bar {
    height: 100%;
    border-radius: 3px;
  }
  .ladder-pnl {
    font-weight: 600;
    font-size: 12px;
    text-align: right;
  }
  .ladder-label-row {
    grid-column: 1 / -1;
    font-size: 11px;
    color: #9ca3af;
    padding-left: 80px;
    margin-top: -4px;
    margin-bottom: 4px;
  }

  /* Meta footer */
  .meta {
    font-size: 14px;
    color: #6b7280;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }
  .meta a { color: #6b7280; }
  .meta a:hover { color: #111; }
</style>
</head>
<body>
<nav class="nav"><a href="/">belief.board</a></nav>
<article>
  <div class="take-header">
    <span class="caller">${escapeHtml(caller)}</span>
    <div class="header-right">
      ${dateNote}
    </div>
  </div>
  <div class="tier">${tier}</div>
  <div class="thesis">${thesis}</div>
  ${routeHtml}
  ${authorHtml}
  ${chainHtml}
  ${ladderHtml}
  ${reasoningHtml}
  ${edgeHtml}
  ${counterHtml}
  <div class="meta">
    ${sourceLink}
    <a href="/t/${call.id}/card">Card view</a>
  </div>
</article>
</body>
</html>`;
}
