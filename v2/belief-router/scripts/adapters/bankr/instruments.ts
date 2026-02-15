/**
 * Bankr instruments adapter — discovers tradeable instruments for a thesis.
 *
 * Usage:
 *   bun run scripts/adapters/bankr/instruments.ts "Fed keeps rates higher for longer"
 *
 * Bankr is async (15-125s). This script:
 *   1. POSTs the thesis as a prompt to the Bankr agent API
 *   2. Polls the job until completed (with progress logging)
 *   3. Parses the response for tokens, Polymarket markets, and other instruments
 *   4. Returns InstrumentMatch[] as JSON
 */

import type { InstrumentMatch, AdapterInstrumentResult } from "../../types";

const API_BASE = "https://api.bankr.bot";
const API_KEY = process.env.BANKR_API_KEY;
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_TIME_MS = 300_000; // 5 minute timeout (Bankr can be slow on complex theses)

if (!API_KEY) {
  console.error("ERROR: BANKR_API_KEY not set in .env");
  process.exit(1);
}

// ── Bankr API types ──────────────────────────────────────────────────────

interface BankrSubmitResponse {
  success: boolean;
  jobId: string;
  threadId: string;
  status: string;
}

interface BankrJobResponse {
  success: boolean;
  jobId: string;
  threadId: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  prompt: string;
  processingTime?: number;
  response?: string;
  transactions?: BankrTransaction[];
  richData?: any[];
  statusUpdates?: { message: string; timestamp: string }[];
  completedAt?: string;
}

interface BankrTransaction {
  type: string;
  metadata: {
    __ORIGINAL_TX_DATA__?: {
      chain: string;
      humanReadableMessage: string;
      inputTokenTicker?: string;
      outputTokenTicker?: string;
      receiver?: string;
    };
    transaction?: {
      chainId: number;
      to: string;
      data: string;
      gas: string;
      value: string;
    };
    [key: string]: any;
  };
}

// ── API functions ────────────────────────────────────────────────────────

async function submitPrompt(prompt: string): Promise<BankrSubmitResponse> {
  const res = await fetch(`${API_BASE}/agent/prompt`, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bankr POST /agent/prompt failed (${res.status}): ${text}`);
  }

  return res.json();
}

async function pollJob(jobId: string): Promise<BankrJobResponse> {
  const startTime = Date.now();
  let lastStatusCount = 0;

  while (true) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);

    if (Date.now() - startTime > MAX_POLL_TIME_MS) {
      throw new Error(`Bankr job ${jobId} timed out after ${elapsed}s`);
    }

    const res = await fetch(`${API_BASE}/agent/job/${jobId}`, {
      headers: { "x-api-key": API_KEY! },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Bankr GET /agent/job/${jobId} failed (${res.status}): ${text}`);
    }

    const job: BankrJobResponse = await res.json();

    // Log any new status updates from the agent
    if (job.statusUpdates && job.statusUpdates.length > lastStatusCount) {
      for (let i = lastStatusCount; i < job.statusUpdates.length; i++) {
        console.error(`  [Bankr ${elapsed}s] ${job.statusUpdates[i].message}`);
      }
      lastStatusCount = job.statusUpdates.length;
    }

    if (job.status === "completed") {
      console.error(`Bankr completed in ${elapsed}s (processingTime: ${job.processingTime}ms)`);
      return job;
    }

    if (job.status === "failed" || job.status === "cancelled") {
      throw new Error(`Bankr job ${jobId} ${job.status} after ${elapsed}s`);
    }

    // Progress breadcrumb every poll
    console.error(`Bankr processing... ${elapsed}s (status: ${job.status})`);

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

// ── Response parsing ─────────────────────────────────────────────────────

/**
 * Parse the Bankr response text to extract instruments.
 *
 * Bankr responses use a structured format:
 *   Token Name (TICKER)
 *   * Price: $X.XX
 *   * Chain: Base
 *   * Address: 0x...
 *
 * And for Polymarket:
 *   1- Market Name?
 *   * Outcome (XX¢)
 *   * https://polymarket.com/event/slug
 */
function parseInstruments(job: BankrJobResponse): InstrumentMatch[] {
  const instruments: InstrumentMatch[] = [];
  const text = job.response || "";
  const seen = new Set<string>();

  // Skip words that look like tickers but aren't tokens
  const SKIP_TICKERS = new Set([
    "USD", "USDC", "USDT", "THE", "FOR", "AND", "WITH", "FROM", "THIS",
    "THAT", "YES", "API", "RWA", "GPU", "NFT", "DEX", "CEO", "IPO",
    "AGI", "ETF", "APY", "TVL", "URL",
  ]);

  // ── 1. Structured token blocks: "Name (TICKER)\nPrice: $X.XX" or "Name (TICKER)\n* Price: $X.XX" ──
  // Bankr uses both formats (with and without bullet asterisk)
  const tokenBlockPattern = /([A-Za-z][A-Za-z0-9 &'-]+?)\s*\(([A-Z][A-Z0-9]{1,9})\)\s*\n\*?\s*Price:\s*\$?([\d,.]+)/g;
  let match;
  while ((match = tokenBlockPattern.exec(text)) !== null) {
    const name = match[1].trim();
    const ticker = match[2];
    const price = match[3];
    if (SKIP_TICKERS.has(ticker)) continue;
    if (!seen.has(ticker)) {
      seen.add(ticker);

      // Extract chain/CA from the lines following this match
      const afterMatch = text.substring(match.index, match.index + 300);
      const chainMatch = afterMatch.match(/\*?\s*Chains?:\s*([^\n]+)/i);
      const chains = chainMatch ? chainMatch[1].trim() : undefined;
      // Extract address (0x... for EVM or base58 for Solana)
      const addrMatch = afterMatch.match(/(?:CA|Address):\s*(0x[a-fA-F0-9]+|[A-Za-z0-9]{32,})/);
      const address = addrMatch ? addrMatch[1] : undefined;

      instruments.push({
        ticker,
        name: `${name} ($${price})`,
        relevance: "direct",
        why: chains
          ? `${name} at $${price} on ${chains}`
          : `${name} at $${price}`,
      });
    }
  }

  // ── 2. Polymarket markets via URLs ──
  const polymarketUrlPattern = /polymarket\.com\/event\/([^\s)]+)/gi;
  while ((match = polymarketUrlPattern.exec(text)) !== null) {
    const slug = match[1].replace(/\?.*$/, "");
    const humanName = slug.replace(/-/g, " ");
    const ticker = `PM:${slug.substring(0, 50).toUpperCase().replace(/\s+/g, "-")}`;
    if (!seen.has(ticker)) {
      seen.add(ticker);

      // Try to find odds near this URL (look backward in text for prices like XX¢)
      const before = text.substring(Math.max(0, match.index - 500), match.index);
      const oddsMatches = [...before.matchAll(/(\w[\w\s]+?)\s*\((\d+)¢\)/g)];

      let why = "Polymarket prediction market found via Bankr";
      if (oddsMatches.length > 0) {
        const oddsSummary = oddsMatches
          .slice(0, 3)
          .map((m) => `${m[1].trim()} ${m[2]}¢`)
          .join(", ");
        why = `Polymarket: ${oddsSummary}`;
      }

      instruments.push({
        ticker,
        name: `Polymarket: ${humanName}`,
        relevance: "direct",
        why,
      });
    }
  }

  // ── 3. $TICKER mentions (cashtag style) ──
  const cashtagPattern = /\$([A-Z]{2,10})\b/g;
  while ((match = cashtagPattern.exec(text)) !== null) {
    const ticker = match[1];
    if (SKIP_TICKERS.has(ticker)) continue;
    if (!seen.has(ticker)) {
      seen.add(ticker);
      instruments.push({
        ticker,
        name: ticker,
        relevance: "direct",
        why: "Token mentioned in Bankr analysis",
      });
    }
  }

  // ── 4. Tokens from transaction calldata ──
  if (job.transactions) {
    for (const tx of job.transactions) {
      const txData = tx.metadata?.__ORIGINAL_TX_DATA__;
      if (txData?.outputTokenTicker) {
        const ticker = txData.outputTokenTicker.toUpperCase();
        if (!seen.has(ticker) && !SKIP_TICKERS.has(ticker)) {
          seen.add(ticker);
          instruments.push({
            ticker,
            name: `${ticker} on ${txData.chain || "unknown chain"}`,
            relevance: "direct",
            why: txData.humanReadableMessage || `Swap target from Bankr transaction`,
          });
        }
      }
    }
  }

  // ── 5. Fallback: "Name (TICKER)" without structured price block ──
  const inlineTickerPattern = /(?:^|\n)([A-Za-z][A-Za-z0-9 &'-]+?)\s*\(([A-Z][A-Z0-9]{1,9})\)/g;
  while ((match = inlineTickerPattern.exec(text)) !== null) {
    const name = match[1].trim();
    const ticker = match[2];
    if (SKIP_TICKERS.has(ticker)) continue;
    if (!seen.has(ticker)) {
      seen.add(ticker);
      instruments.push({
        ticker,
        name,
        relevance: "proxy",
        why: `${name} referenced in Bankr analysis`,
      });
    }
  }

  return instruments;
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const thesis = process.argv[2];
  if (!thesis) {
    console.error("Usage: bun run scripts/adapters/bankr/instruments.ts \"<thesis>\"");
    process.exit(1);
  }

  console.error(`\n--- Bankr Instrument Discovery ---`);
  console.error(`Thesis: "${thesis}"`);
  console.error(`Submitting to Bankr agent API...`);

  // Craft a discovery-oriented prompt from the thesis
  const prompt = `Given the investment thesis: "${thesis}"

What specific tradeable instruments are available? Include:
- Relevant tokens with current prices and contract addresses
- Any Polymarket prediction markets with current odds
- Tokenized treasuries or yield instruments if relevant
- Available on: Base, Solana, Ethereum, Polygon, or Unichain

List specific tickers, prices, and market URLs where possible.`;

  const submission = await submitPrompt(prompt);
  console.error(`Job submitted: ${submission.jobId}`);
  console.error(`Polling for completion (this takes 15-125s)...\n`);

  const job = await pollJob(submission.jobId);

  // Debug: dump raw response to stderr for parsing improvement
  if (process.env.BANKR_DEBUG) {
    console.error("\n--- RAW RESPONSE ---");
    console.error(job.response?.substring(0, 3000) || "(empty)");
    console.error("--- END RAW RESPONSE ---\n");
    if (job.transactions?.length) {
      console.error(`--- TRANSACTIONS (${job.transactions.length}) ---`);
      console.error(JSON.stringify(job.transactions, null, 2).substring(0, 2000));
      console.error("--- END TRANSACTIONS ---\n");
    }
  }

  // Parse instruments from the response
  const instruments = parseInstruments(job);

  console.error(`\nFound ${instruments.length} instruments`);

  const result: AdapterInstrumentResult = {
    platform: "bankr",
    instruments,
    search_method: "prompt",
  };

  // Output clean JSON to stdout (logs go to stderr)
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(`FATAL: ${err.message}`);
  process.exit(1);
});
