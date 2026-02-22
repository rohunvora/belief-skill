# Output Format

Output has two layers: **The Reply** (streamed to the user in chat) and **The Record** (POSTed to the board as structured data). The reply is prose. The structured card lives on the board.

## Part 1: The Reply

Prose, not a card. Write like you're telling a friend the trade.

**Source excerpt first** for sourced calls (URLs, tweets, transcripts). One line: the key quote + attribution. For user's own thesis, skip it. The excerpt grounds derived calls where the routing diverges from the source.

**Ticker and price early.** The reader should know what to buy within the first two sentences.

**The reply must contain** (in whatever order fits this specific thesis): the trade (ticker, price, quantity), what the market is missing, a verifiable edge (a fact, not a computed number), what kills it, and the alt. For options: strike, expiry, breakeven, max loss. For perps: leverage, liquidation, funding. For Kalshi: implied probability, payout. Include only what earns its space.

**Honest precision.** Entry price and share count are exact (from tools). Upside is a range ("could 2-3x"), not a fake target ("+$35.9K (1.4x)"). State verifiable facts ("TLT IV at 10%"), not computed conclusions ("profitable above 28%").

**Tone matching.** Expert inputs get full technical vocabulary. Casual inputs get plain language with jargon translated inline. Casual replies end with one plain-language summary: "You're betting $X that [thing]. Right, [outcome]. Wrong, [loss]."

**Derivation chain (sourced calls).** After the prose, include the chain. Provenance, not a second explanation.

**Board link.** After the chain, show the board teaser (see Part 3).

**Constraints:** Never exceed two paragraphs of reasoning. No section headers, no formatted boxes, no column-aligned tables. Every claim backed by data. Stop when the edge is stated. **No em dashes anywhere.** Not in prose, not in chain steps, not in honest flags. Use periods, commas, semicolons, or colons.

## Part 2: Follow-Up Suggestions

End every routing with 2-3 suggested follow-ups. Each should address the most likely reason THIS specific user wouldn't execute THIS specific trade right now: unfamiliar platform, position too large, timing unclear, or thesis not fully believed yet. Make them short enough to tap.

**Disclaimer:** End every routing response with: `Expressions, not advice. Do your own research.`

## Part 3: Post to Board

After the reply and follow-ups, POST the structured record to the belief board. The board renders the full card from this data. Always attempt the POST. If unreachable, note it briefly and move on.

### Payload Table

| Layer | Skill output | API field | Notes |
|---|---|---|---|
| Call | Source @handle | `source_handle` | string, the author's handle (creates Author entity) |
| Call | Source URL | `source_url` | string or null |
| Call | Source title | `source_title` | string or null (video title, article headline, tweet snippet) |
| Call | Source platform | `source_platform` | "youtube", "x", "substack", "podcast", etc. |
| Call | Source date | `source_date` | ISO date string |
| Call | Headline quote | `headline_quote` | card preview text, max 120 chars (see Headline Quote Rules) |
| Call | Author's ticker | `author_ticker` | string or null |
| Call | Author's direction | `author_direction` | "long", "short", or null |
| Call | Conditions | `conditions` | string or null |
| Routing | Skill's thesis | `thesis` | required |
| Routing | Routed ticker | `ticker` | required |
| Routing | Direction | `direction` | "long" or "short" |
| Routing | Entry price | `entry_price` | number |
| Routing | Price timestamp | `price_captured_at` | ISO datetime |
| Routing | Attribution tier | `call_type` | "direct" or "derived" |
| Routing | Breakeven | `breakeven` | string, "profitable above X%" |
| Routing | Kill conditions | `kills` | string |
| Routing | Instrument type | `instrument` | "stock", "options", "kalshi", or "perps" |
| Routing | Platform | `platform` | "robinhood", "kalshi", or "hyperliquid" |
| Detail | Full verbatim quote | `source_quote` | goes in `trade_data` blob |
| Detail | Source segments | `segments` | `[{quote, speaker, timestamp?}]` in `trade_data` |
| Detail | Derivation chain | `derivation` | `{segments, steps, chose_over}` in `trade_data` |
| Detail | Reasoning | `reasoning` | `trade_data` blob |
| Detail | Edge statement | `edge` | `trade_data` blob |
| Detail | Counter-argument | `counter` | `trade_data` blob |
| Detail | Payoff table | `price_ladder` | `trade_data` blob |
| Detail | Alt line | `alternative` | `trade_data` blob |
| Detail | Scan source | `scan_source` | `trade_data` blob, "Source (Date)" |

### Headline Quote Rules

`headline_quote` is the card preview text: the line that makes someone stop scrolling. Must be the **author's actual words**, not AI-rewritten. Use journalistic editing:

1. **Max 120 characters.** Hard limit. Renders as a single line on mobile.
2. **Pick the punchiest sentence**, not necessarily the first one. Look for: specific numbers, bold claims, provocative framing, memorable phrasing.
3. **Use `[...]` to cut middle filler.** "I mapped the ENTIRE supply chain [...] 76 nodes in 13 countries"
4. **Use `...` to truncate the end.** "the secular bull mkt in tech is over. inflation kills long duration assets..."
5. **Use `[context]` to add missing nouns.** "It [MSFT] has been the worst-performing hyperscaler since ChatGPT launch."
6. **Preserve their voice.** Keep lowercase, slang, abbreviations. Never smooth into formal English.
7. **Tweet under 120 chars** → use verbatim as `headline_quote`.
8. **Fallback:** If no quotable sentence exists, set `headline_quote` to null. Board falls back to `source_quote` with truncation.

Examples:
- `"inflation is a monetary phenomenon. tech people calling for deflation will likely be wrong"` (90 chars)
- `"Is on-premise the new cloud? I'm beginning to think yes"` (56 chars)
- `"100% of code is AI. Five SWEs [...] write zero human code post-Feb 5"` (70 chars)
- `"market all in on duration mismatch"` (34 chars)

### Example Payload (derived call)

```json
{
  "source_handle": "chiefofautism",
  "source_url": "https://x.com/chiefofautism/status/123456",
  "source_title": "I mapped the ENTIRE AI supply chain",
  "source_platform": "x",
  "source_date": "2026-02-19",
  "headline_quote": "i mapped the ENTIRE supply chain [...] 76 nodes in 13 countries, from a quartz mine to your chat window",
  "author_ticker": null,
  "author_direction": null,
  "conditions": null,

  "thesis": "AI datacenter optical interconnects are the next bottleneck after chips",
  "ticker": "COHR",
  "caller_id": "${BELIEF_CALLER_ID:-anon}",
  "direction": "long",
  "entry_price": 232.48,
  "price_captured_at": "2026-02-19T14:32:00Z",
  "call_type": "derived",
  "breakeven": "profitable above 12%",
  "kills": "fiber optic overcapacity, Broadcom enters transceiver market",
  "instrument": "stock",
  "platform": "robinhood",

  "source_quote": "i mapped the ENTIRE supply chain behind a single ChatGPT query. 76 nodes in 13 countries with 10 layers, from a quartz mine in North Carolina to your chat window",
  "segments": [
    { "quote": "76 nodes in 13 countries with 10 layers, from a quartz mine to your chat window", "speaker": "chiefofautism" }
  ],
  "derivation": {
    "segments": [
      { "quote": "76 nodes in 13 countries with 10 layers, from a quartz mine to your chat window", "speaker": "chiefofautism" }
    ],
    "steps": [
      { "text": "76 nodes means 76 potential chokepoints", "segment": 0 },
      { "text": "ASML owns lithography (100% EUV share) but trades at ATH, fully priced" },
      { "text": "COHR controls ~40% of AI datacenter optical transceivers. the next chokepoint down that isn't priced in" }
    ],
    "chose_over": "ASML (fully priced at ATH), MU (already 6.8x from lows)"
  },
  "reasoning": "AI supply chain concentration creates pricing power at each irreplaceable node.",
  "edge": "COHR at $232 while datacenter transceiver revenue growing 80% YoY.",
  "counter": "Intel or Broadcom could enter the transceiver market",
  "price_ladder": [
    { "price": 197.61, "pnl_pct": -15, "pnl_dollars": -1500, "label": "stop loss" },
    { "price": 280.00, "pnl_pct": 20, "pnl_dollars": 2000, "label": "reclaim 50-day MA" },
    { "price": 350.00, "pnl_pct": 51, "pnl_dollars": 5100, "label": "returns to yearly high" },
    { "price": 420.00, "pnl_pct": 81, "pnl_dollars": 8100, "label": "re-rate as AI infrastructure" }
  ],
  "alternative": "MU $417 long (HBM memory shortage, further from source thesis)",
  "scan_source": "@chiefofautism tweet (Feb 2026)"
}
```

### Board POST

```bash
curl -s -X POST "${BELIEF_BOARD_URL:-https://belief-board.fly.dev}/api/takes" \
  -H "Content-Type: application/json" \
  -d '<JSON payload>'
```

`caller_id` is required. Read from `BELIEF_CALLER_ID` env var, otherwise `"anon"`. API auto-creates user.

### Board Teaser (after POST)

On success, show a 4-line teaser. The API response contains `{ "id": "...", "url": "https://host/t/..." }`:

```
---
"76 nodes in 13 countries." · @chiefofautism
COHR long · $232.48 · derived
AI datacenter optical interconnects are the next bottleneck after chips
→ <url from API response>
---
```

On failure: `Board unavailable. Skipping post.`

**Bulk mode:** POST each deep-routed take individually, immediately after its card is displayed.
