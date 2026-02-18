---
date: 2026-02-17T00:20:54-0500
session_name: general
researcher: satoshi
git_commit: 73aa128
branch: belief-board-v4
repository: belief-skill
topic: "Bulk Belief Scanner — Architecture Design"
tags: [design, bulk-scan, architecture, belief-router, product]
status: complete
last_updated: 2026-02-17
last_updated_by: claude
type: implementation_strategy
root_span_id:
turn_span_id:
---

# Handoff: Bulk Belief Scanner Architecture Design

## Task(s)

**Design session (complete)** — User wanted to ideate on a "bulk trade finder" that can process a podcast transcript and extract all tradeable beliefs efficiently. Session progressed through:

1. **Architecture design (complete)** — Three-phase pipeline: Extract & Cluster → Instrument Sweep → Deep Route
2. **Live transcript test (complete)** — Ran Phase 1 extraction manually on a real All-In Podcast transcript (~916 lines). Extracted 12 raw claims, clustered to 9, identified 4 Tier 1 routable theses.
3. **Output/display layer design (complete)** — Designed the Source → Scan → Board abstraction. Scan is the new unit of output (not individual cards).
4. **Provenance/citation design (complete)** — Each thesis carries exact quotes with timestamps, conviction markers, counter-evidence, and explicit inference chains. Quick hits show candidates only; deep routes show full instrument selection reasoning.

No code was implemented. This was pure design/ideation. One Excalidraw diagram was generated.

## Critical References

- `SKILL.md` — The full belief-router skill prompt (current single-thesis routing logic)
- `scripts/adapters/` — Existing instrument discovery and return calculation scripts (Robinhood, Kalshi, Hyperliquid, Bankr, Angel)
- `scripts/track.ts` — Belief tracking CLI (append-only JSONL)

## Recent Changes

- `scripts/gen-bulk-diagram.ts` — New: Bun script that generates an Excalidraw diagram of the architecture
- `docs/bulk-architecture.excalidraw` — New: Generated diagram with 4 sections (Current State, Bulk Pipeline, Implementation Options, Key New Work)

## Learnings

### Three-Phase Pipeline Design

The core insight is that bulk processing can't just run the full belief-router N times (too slow, too expensive). Instead, a tiered pipeline:

- **Phase 1: Extract & Cluster** — Pure LLM reasoning, no tool calls. Parse transcript, find all directional claims, cluster duplicates (same thesis said different ways = 1 entry), tag conviction from language intensity, tag specificity. Output: 5-15 deduplicated theses ranked by specificity x conviction. ~5 seconds.

- **Phase 2: Instrument Sweep** — Batched tool calls only, no web research. Key efficiency: batch by platform, not by thesis. One `robinhood/instruments.ts "DELL,HPE,SMCI,AAPL,NTAP"` call validates 5 tickers at once. One `kalshi/instruments.ts "gold price"` covers multiple gold-related theses. Total: 6-8 parallel calls vs 36+ serial. ~10 seconds.

- **Phase 3: Deep Route** — Full belief-router on top 3-5 theses only. Can run as parallel agents. Each gets one thesis + full SKILL.md prompt. ~30-60 seconds each, parallel.

Total: ~45-90 seconds for 12 theses vs 6-12 minutes serial.

### Live Test Results (All-In Podcast)

Manually tested Phase 1 on a real transcript. Key findings:
- Extracted 12 raw directional claims from ~1 hour podcast
- Clustered to 9 after deduplication (e.g., "cloud too expensive" + "on-prem is back" = one thesis)
- 4 clearly routable Tier 1 theses: Gold long (Chamath), On-prem AI shift (Chamath), Debt spiral (Friedberg), AI boom (Sacks)
- 4 Tier 2 (tradeable but needs sharpening): Prediction markets, Enterprise AI adoption, Warsh tightening, Pension federalization
- 3 skipped as too vague
- Tricky case: prediction markets thesis had mixed signal (bullish platform growth, bearish retail profitability). LLM extraction handled this nuance well.

### Output Architecture: Source → Scan → Board

- **Source**: Any content with embedded theses (podcast, article, tweet thread, earnings call)
- **Scan**: The extraction + routing output as a single shareable artifact. One per source.
- **Board**: Accumulation of scans over time. Living belief portfolio view.

The scan is the new unit of output. Nobody wants 8 separate Telegram messages from one podcast — they want one artifact they can look at, share, or come back to.

Scan format should be a self-contained HTML page that works as: (1) shareable link, (2) screenshot-ready visual, (3) actionable dashboard with track/route buttons.

### Provenance Design (Critical)

Each extracted thesis must carry:
1. **Exact quotes** with timestamps — verbatim from transcript, 1-2 strongest sentences
2. **Conviction markers** — repetition count, intensity words, whether others agreed or pushed back
3. **Counter-evidence** — if someone in the conversation disagreed, show it
4. **Inference chain** — "Speaker said X → We interpret as thesis Y → Tradeable expression is Z"

**Key design rule**: Quick hits (Phase 2 only) show thesis + candidates list but DO NOT pick a specific ticker. Only deep routes (Phase 3) recommend specific instruments with full reasoning for why that name over alternatives. This prevents the scan from implying analysis it hasn't done.

Example of what NOT to do: "On-prem is back → buy DELL" (missing middle — why Dell?)
Example of correct quick hit: "On-prem is back → Candidates: DELL, HPE, SMCI, AAPL → [Deep Route This]"

### Implementation Options

Three approaches evaluated, user chose Option A:

- **Option A (RECOMMENDED)**: Add `## Bulk Mode` section to existing SKILL.md. Same file, different flow triggered by long input or keywords like "transcript", "scan this". Pros: simple, reuses existing routing. Cons: prompt grows longer.
- **Option B**: Separate `belief-scanner` skill that orchestrates and calls `belief-router` for deep routes. Cleaner separation but two skills to maintain.
- **Option C**: Script-based `scripts/extract.ts` for Phase 1+2, outputs structured JSON. Claude picks top N and routes. More code, less prompt bloat, testable outside Claude.

## Post-Mortem

### What Worked
- **Manual Phase 1 test on real transcript** validated the extraction approach before writing any code. The LLM reliably extracted and clustered theses with appropriate conviction tagging.
- **Iterative design** — starting with pipeline, then output format, then provenance. Each layer built on the previous one.
- **User's "one layer up" prompt** shifted from pipeline mechanics to product thinking (Source → Scan → Board), which is the more important architectural insight.

### What Failed
- **Browser automation for Excalidraw** — Spent ~15-20K tokens on Chrome automation to load a diagram into excalidraw.com. User correctly pointed out this was wasteful; just generating the file and telling them to open it would have been 3x more efficient. Lesson: don't use browser automation unless explicitly asked.
- **TypeScript preflight hook** fired on the diagram generator script due to pre-existing type errors in other adapter files. Not blocking but noisy.

### Key Decisions
- **Decision**: Option A (mode in existing SKILL.md) for implementation
  - Alternatives: Separate skill (B), Script-based (C)
  - Reason: Simplest starting point, reuses existing routing logic, no new infrastructure. Can evolve to B or C later if prompt gets too long.

- **Decision**: Quick hits don't pick tickers, only deep routes do
  - Alternatives: All theses get a recommended ticker
  - Reason: Prevents implying analysis that hasn't been done. Honest about what Phase 2 (instrument sweep only) can and can't determine.

- **Decision**: Scan (not individual cards) is the unit of bulk output
  - Alternatives: Send N separate trade cards
  - Reason: Nobody wants 8 Telegram messages. One artifact per source is shareable, reviewable, and composable into a Board over time.

## Artifacts

- `docs/bulk-architecture.excalidraw` — Architecture diagram (4 sections: Current State, Bulk Pipeline, Implementation Options, Key New Work)
- `scripts/gen-bulk-diagram.ts` — Generator script for the above diagram
- This handoff document

## Action Items & Next Steps

### To Build (in order)

1. **Phase 1 extraction prompt** — Add `## Bulk Mode` to SKILL.md with extraction instructions. Key: output structured list with quotes, timestamps, conviction, specificity. Test against the All-In transcript (saved at `~/Downloads/allin-full-transcript.md`).

2. **Batch instrument adapters** — Verify `robinhood/instruments.ts` already accepts comma-separated tickers (it does per SKILL.md). Check if Kalshi/Hyperliquid adapters need modification for batch calls.

3. **Scan data model** — Create `data/scans/` directory. Each scan is a JSON file: `{source, date, theses: [{quote, timestamp, speaker, conviction, specificity, candidates, routing_result?}]}`.

4. **`track.ts bulk-record`** — New subcommand that takes a scan JSON and records all theses as paper trades in one call.

5. **Scan HTML template** — Self-contained HTML page per scan. Renders thesis list with quotes, candidates, deep route results. Screenshot-ready. Use Bun.serve() + HTML imports per CLAUDE.md.

6. **Board view** — Index page listing all scans + aggregated positions from beliefs.jsonl.

### Design Questions Still Open

- Should Phase 1 extraction run as a separate LLM call (cheaper model?) or inline in the main skill invocation?
- How to handle sources that aren't transcripts (articles, tweet threads) — same extraction prompt or source-specific variants?
- Composability: weekly digest across multiple scans — is this just a Board filter or a separate artifact?

## Other Notes

- The All-In transcript at `~/Downloads/allin-full-transcript.md` has duplicate sections (Part 2 and Part 3 repeat Part 1 content in different formatting). A real implementation would need dedup at the source level too.
- The existing `scripts/adapters/robinhood/instruments.ts` already accepts comma-separated tickers per SKILL.md line 248. Kalshi uses keyword search (line 253), which naturally handles batching by theme.
- The `data/beliefs.jsonl` append-only format from track.ts works well for scans — just add a `scan_id` field to group beliefs from the same scan.
- Bun.serve() with HTML imports (per CLAUDE.md) is the right stack for the scan viewer. No need for React or external frameworks for a single-page scan display.
