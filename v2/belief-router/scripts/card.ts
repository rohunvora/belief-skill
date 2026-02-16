/**
 * "I Called It" card generator — creates shareable trade cards.
 *
 * Usage:
 *   bun run scripts/card.ts --id <trade-id>              → HTML card
 *   bun run scripts/card.ts --id <trade-id> --telegram   → Telegram-formatted text
 */

import { join } from "path";
import { homedir } from "os";
import type { TrackedTrade } from "./types";

const DATA_DIR = join(homedir(), ".belief-router");
const TRADES_FILE = join(DATA_DIR, "trades.json");
const CARDS_DIR = join(DATA_DIR, "cards");

async function loadTrades(): Promise<TrackedTrade[]> {
  const file = Bun.file(TRADES_FILE);
  if (await file.exists()) {
    return (await file.json()) as TrackedTrade[];
  }
  return [];
}

function getVerdict(trade: TrackedTrade): string {
  if (trade.status === "closed") {
    if ((trade.pnl_pct ?? 0) >= 0) return "Called it ✅";
    return "Killed ☠️";
  }
  if ((trade.pnl_pct ?? 0) >= 10) return "Thesis playing out ✅";
  if ((trade.pnl_pct ?? 0) <= -20) return "Underwater 📉";
  if ((trade.pnl_pct ?? 0) >= 0) return "On track 📊";
  return "Under pressure ⚠️";
}

function generateTelegramCard(trade: TrackedTrade): string {
  const pnlPct = trade.pnl_pct ?? 0;
  const pnlSign = pnlPct >= 0 ? "+" : "";
  const pnlDollars = trade.pnl_dollars ?? 0;
  const daysHeld = Math.floor(
    (Date.now() - new Date(trade.entry_date).getTime()) / (1000 * 60 * 60 * 24)
  );
  const direction =
    trade.expression.direction === "long" || trade.expression.direction === "yes"
      ? "Long"
      : "Short";
  const platform =
    trade.expression.platform.charAt(0).toUpperCase() +
    trade.expression.platform.slice(1);
  const verdict = getVerdict(trade);
  const mode = trade.mode === "real" ? "💰 Real" : "📝 Paper";
  const statusEmoji = trade.status === "closed" ? "🔒" : "🟢";

  let lines: string[] = [];
  lines.push(`${statusEmoji} **${trade.expression.instrument} — ${direction}** (${platform})`);
  lines.push("");
  lines.push(`💭 _"${trade.thesis}"_`);
  lines.push("");

  // Trade details
  lines.push("```");
  if (trade.instrument_type === "option") {
    lines.push(`Type:     ${trade.option_type?.toUpperCase()} Option`);
    lines.push(`Strike:   $${trade.strike}`);
    lines.push(`Premium:  $${trade.premium ?? trade.entry_price}`);
    if (trade.expiry) lines.push(`Expiry:   ${trade.expiry}`);
    lines.push(`Underl.:  $${trade.current_price?.toFixed(2) ?? "—"}`);
  } else {
    lines.push(`Entry:    $${trade.entry_price.toFixed(2)}`);
    lines.push(`Current:  $${trade.current_price?.toFixed(2) ?? "—"}`);
  }
  lines.push(`PnL:      ${pnlSign}${pnlPct.toFixed(1)}% (${pnlSign}$${pnlDollars.toFixed(2)})`);
  lines.push(`Held:     ${daysHeld} day${daysHeld !== 1 ? "s" : ""}`);
  lines.push(`Mode:     ${mode}`);
  lines.push("```");
  lines.push("");
  lines.push(`**${verdict}**`);

  return lines.join("\n");
}

function generateHtmlCard(trade: TrackedTrade): string {
  const isGain = (trade.pnl_pct ?? 0) >= 0;
  const accentColor = isGain ? "#22c55e" : "#ef4444";
  const pnlSign = isGain ? "+" : "";
  const pnlPct = trade.pnl_pct?.toFixed(1) ?? "0.0";
  const pnlDollars = trade.pnl_dollars?.toFixed(2) ?? "0.00";
  const daysHeld = Math.floor(
    (Date.now() - new Date(trade.entry_date).getTime()) / (1000 * 60 * 60 * 24)
  );
  const entryDate = new Date(trade.entry_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const direction =
    trade.expression.direction === "long" || trade.expression.direction === "yes"
      ? "Long"
      : "Short";
  const platform =
    trade.expression.platform.charAt(0).toUpperCase() +
    trade.expression.platform.slice(1);
  const statusLabel = trade.status === "closed" ? "Closed" : "Open";
  const verdict = getVerdict(trade);

  let detailLine = `<span class="instrument">${escapeHtml(trade.expression.instrument)}</span> · ${direction} · <span class="platform">${platform}</span> · ${entryDate}`;
  if (trade.instrument_type === "option") {
    detailLine = `<span class="instrument">${escapeHtml(trade.expression.instrument)}</span> · ${trade.option_type?.toUpperCase()} $${trade.strike} · <span class="platform">${platform}</span> · ${entryDate}`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1200">
<meta property="og:title" content="${escapeHtml(trade.thesis)}">
<meta property="og:description" content="${pnlSign}${pnlPct}% — ${trade.expression.instrument} ${direction} on ${platform}">
<meta name="twitter:card" content="summary_large_image">
<title>${escapeHtml(trade.thesis)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 1200px;
    height: 675px;
    overflow: hidden;
    background: #0a0a0a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #fafafa;
  }
  .card {
    width: 1200px;
    height: 675px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 72px 80px;
    position: relative;
  }
  .thesis {
    font-size: 40px;
    font-weight: 700;
    line-height: 1.25;
    color: #fafafa;
    margin-bottom: 32px;
    max-height: 160px;
    overflow: hidden;
  }
  .thesis::before { content: "\\201C"; color: ${accentColor}; }
  .thesis::after { content: "\\201D"; color: ${accentColor}; }
  .details {
    font-size: 18px;
    color: #a1a1aa;
    margin-bottom: 40px;
    letter-spacing: 0.02em;
  }
  .details .instrument { color: #fafafa; font-weight: 600; }
  .details .platform { color: #71717a; }
  .pnl {
    font-size: 72px;
    font-weight: 800;
    color: ${accentColor};
    line-height: 1;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
  }
  .pnl-dollars {
    font-size: 24px;
    color: ${accentColor};
    opacity: 0.8;
    margin-bottom: 8px;
  }
  .verdict {
    font-size: 20px;
    color: #fafafa;
    margin-bottom: 8px;
  }
  .days {
    font-size: 16px;
    color: #71717a;
  }
  .brand {
    position: absolute;
    bottom: 28px;
    right: 40px;
    font-size: 13px;
    color: #3f3f46;
    letter-spacing: 0.05em;
  }
  .status {
    position: absolute;
    top: 28px;
    right: 40px;
    font-size: 13px;
    color: ${accentColor};
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
  }
</style>
</head>
<body>
<div class="card">
  <div class="status">${statusLabel}</div>
  <div class="thesis">${escapeHtml(trade.thesis)}</div>
  <div class="details">${detailLine}</div>
  <div class="pnl">${pnlSign}${pnlPct}%</div>
  <div class="pnl-dollars">${pnlSign}$${pnlDollars} on $100</div>
  <div class="verdict">${verdict}</div>
  <div class="days">${daysHeld} day${daysHeld !== 1 ? "s" : ""} held</div>
  <div class="brand">belief-router</div>
</div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const val = args[i + 1];
      if (val && !val.startsWith("--")) {
        flags[key] = val;
        i++;
      } else {
        flags[key] = "true";
      }
    }
  }

  const id = flags["id"] || args[0];
  const telegram = "telegram" in flags;

  if (!id) {
    console.error("Usage: bun run scripts/card.ts --id <trade-id> [--telegram]");
    process.exit(1);
  }

  const trades = await loadTrades();
  const trade = trades.find((t) => t.id === id);

  if (!trade) {
    console.error(`Trade "${id}" not found in ${TRADES_FILE}`);
    process.exit(1);
  }

  if (telegram) {
    console.log(generateTelegramCard(trade));
  } else {
    const html = generateHtmlCard(trade);
    const outPath = join(CARDS_DIR, `${id}.html`);

    await Bun.write(join(CARDS_DIR, ".keep"), "");
    await Bun.write(outPath, html);

    console.log(outPath);
    console.error(`\nCard generated for trade ${id}:`);
    console.error(`  Thesis:  "${trade.thesis}"`);
    console.error(`  PnL:     ${(trade.pnl_pct ?? 0) >= 0 ? "+" : ""}${trade.pnl_pct?.toFixed(1) ?? "0.0"}%`);
    console.error(`  Output:  ${outPath}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
