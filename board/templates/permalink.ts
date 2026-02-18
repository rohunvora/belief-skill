/** Server-rendered permalink page with OG meta tags for link previews. */

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

export function renderPermalink(call: Call): string {
  const date = formatDate(call.created_at);
  const caller = call.source_handle ?? call.caller_id;
  const chain = extractChainDisplay(call);
  const thesis = escapeHtml(call.thesis);

  // OG meta — sourced calls use first step as quote, originals use thesis
  const firstStep = chain.steps[0];
  const ogTitleText = (firstStep && call.source_handle)
    ? `${caller}: "${truncate(firstStep, 70)}"`
    : `${caller}: ${truncate(call.thesis, 80)}`;
  const ogTitle = escapeHtml(ogTitleText);
  const ogParts: string[] = [call.ticker, `$${call.entry_price}`, date];
  const ogDescription = escapeHtml(ogParts.join(" \u2014 "));

  // Detail section
  let details = `<p class="details"><strong>${escapeHtml(call.ticker)}</strong> &middot; $${call.entry_price.toLocaleString()} at call &middot; ${call.direction}</p>`;

  // Source quote — first step from chain
  let quoteHtml = "";
  if (firstStep && call.source_handle) {
    quoteHtml = `<blockquote class="source-quote">${escapeHtml(truncate(firstStep, 300))}</blockquote>`;
  }

  // Reasoning
  let reasoningHtml = "";
  if (call.reasoning) {
    reasoningHtml = `<div class="reasoning"><h3>Reasoning</h3><p>${escapeHtml(truncate(call.reasoning, 500))}</p></div>`;
  }

  // Derivation chain section — greentext steps
  let chainHtml = "";
  if (chain.hasChain && chain.steps.length > 0) {
    const stepItems = chain.steps
      .map((s) => `<div class="chain-step">&gt; ${escapeHtml(s)}</div>`)
      .join("\n");
    const choseOverHtml = chain.chose_over
      ? `<div class="chain-step chain-chose-over"><span class="chain-label">Chose over:</span> ${escapeHtml(chain.chose_over)}</div>`
      : "";
    chainHtml = `<div class="chain-section"><div class="chain-header">Derivation Chain</div>${stepItems}${choseOverHtml}</div>`;
  }

  // Source link
  let sourceLink = "";
  if (call.source_url) {
    sourceLink = `<a href="${escapeHtml(call.source_url)}" target="_blank" rel="noopener">Source</a> &middot; `;
  }

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
  .take-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 16px;
  }
  .caller { font-weight: 600; font-size: 17px; }
  .date { color: #6b7280; font-size: 14px; }
  .thesis {
    font-size: 22px;
    font-weight: 600;
    line-height: 1.4;
    margin-bottom: 20px;
  }
  .details {
    color: #6b7280;
    font-size: 15px;
    margin-bottom: 20px;
  }
  .details strong { color: #111; }
  .source-quote {
    font-size: 14px;
    color: #6b7280;
    border-left: 3px solid #e5e7eb;
    padding: 8px 16px;
    margin-bottom: 20px;
    font-style: italic;
  }
  .reasoning {
    margin-bottom: 20px;
  }
  .reasoning h3 {
    font-size: 14px;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }
  .reasoning p {
    font-size: 15px;
    color: #374151;
  }
  .meta {
    font-size: 14px;
    color: #6b7280;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }
  .meta a { color: #6b7280; }
  .meta a:hover { color: #111; }
  .chain-section {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 12px 16px;
    margin-bottom: 20px;
  }
  .chain-header {
    font-size: 10px;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }
  .chain-step {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 4px;
  }
  .chain-label {
    font-weight: 600;
    color: #374151;
  }
</style>
</head>
<body>
<nav class="nav"><a href="/">belief.board</a></nav>
<article>
  <div class="take-header">
    <span class="caller">${escapeHtml(caller)}</span>
    <span class="date">${date}</span>
  </div>
  ${quoteHtml}
  <div class="thesis">${thesis}</div>
  ${details}
  ${chainHtml}
  ${reasoningHtml}
  <div class="meta">
    ${sourceLink}
    <a href="/t/${call.id}/card">Card view</a>
  </div>
</article>
</body>
</html>`;
}
