/**
 * One-shot backfill: generate headline_quote for existing calls.
 *
 * Reads each call's source_quote, applies sentence-boundary truncation
 * to produce a headline_quote under 120 chars, and updates the trade_data blob.
 *
 * Usage: bun run board/backfill-headline-quotes.ts
 */
import { Database } from "bun:sqlite";
import path from "path";

const DB_PATH = path.join(import.meta.dir, "board.db");
const db = new Database(DB_PATH);

// Sentence-boundary truncation: take the first N complete sentences that fit under maxLen
function truncateToSentences(text: string, maxLen = 120): string {
  if (text.length <= maxLen) return text;

  // Split on sentence-ending punctuation followed by space or end
  const sentences = text.match(/[^.!?;]+[.!?;]+(\s|$)/g);
  if (sentences && sentences.length > 0) {
    // Try accumulating sentences
    let result = sentences[0].trim();
    if (result.length <= maxLen) {
      for (let i = 1; i < sentences.length; i++) {
        const next = result + " " + sentences[i].trim();
        if (next.length > maxLen) break;
        result = next;
      }
      // Only use if we got a meaningful chunk that actually truncated
      if (result.length > 15 && result.length <= maxLen) return result;
    }
    // First sentence alone is too long — fall through to word truncation
  }

  // No clean sentence break under maxLen — truncate at last word boundary, add ellipsis
  const truncated = text.slice(0, maxLen - 3);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 30) {
    return truncated.slice(0, lastSpace) + "...";
  }
  return truncated + "...";
}

// Fetch all calls
const rows = db.query("SELECT id, trade_data FROM calls").all() as { id: string; trade_data: string | null }[];

let updated = 0;
let skipped = 0;

const updateStmt = db.prepare("UPDATE calls SET trade_data = ? WHERE id = ?");

for (const row of rows) {
  const td = row.trade_data ? JSON.parse(row.trade_data) : {};

  // Always regenerate (overwrite existing headline_quote)

  const sourceQuote: string | undefined = td.source_quote;
  if (!sourceQuote) {
    // No source_quote — nothing to generate from
    console.log(`  ${row.id}: NO SOURCE_QUOTE, skipping`);
    skipped++;
    continue;
  }

  const headline = truncateToSentences(sourceQuote);
  td.headline_quote = headline;

  updateStmt.run(JSON.stringify(td), row.id);
  updated++;

  const flag = headline.length < sourceQuote.length ? " (truncated)" : "";
  console.log(`  ${row.id}: "${headline}"${flag}`);
}

console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}, Total: ${rows.length}`);
