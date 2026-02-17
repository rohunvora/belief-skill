# Output Format Reference

## Sending the Card

```json
{
  "action": "send",
  "channel": "telegram",
  "message": "<card text>",
  "buttons": [
    [
      {"text": "[Verb] [QTY] [INST] → [Platform]", "callback_data": "blr:exec:[ID]"},
      {"text": "📝 Track", "callback_data": "blr:track:[ID]"}
    ]
  ]
}
```

**Button text by instrument type:**

| Type | Button text |
|------|------------|
| Stock | `Buy 1,923 BKNG → Robinhood` |
| Put/Call | `Buy 800 MTCH $25P → Robinhood` |
| Kalshi | `Buy 3,225 FED-CUTS YES → Kalshi` |
| Perp | `Long SOL 3x → Hyperliquid` |
| Polymarket | `Buy 4,545 YES → Polymarket` |

After sending the card, respond with `NO_REPLY` to avoid a duplicate message.

## Handling Button Callbacks

**`blr:track:[ID]`** — Paper trade this routing.
1. Run: `bun run scripts/track.ts record --input "<thesis>" --inst <INST> --px <PX> --dir <DIR> --plat <PLAT> --action paper --shape <SHAPE> --β <BETA> --conv <CONV> --tc <TC> --kills "<KILLS>" --alt "<ALT>"`
2. Reply with confirmation + buttons:
```json
{
  "action": "send",
  "message": "📝 Tracked [INST] @ $[PX].",
  "buttons": [
    [
      {"text": "✅ I Took This", "callback_data": "blr:real:[ID]"},
      {"text": "📊 Portfolio", "callback_data": "blr:portfolio"}
    ]
  ]
}
```

**`blr:real:[ID]`** — Mark as real trade.
1. `bun run scripts/track.ts update --id [ID] --conviction [same] --reason "executed real"`
2. Reply: "Marked as real. Good luck."

**`blr:portfolio`** — Show portfolio.
1. `bun run scripts/track.ts portfolio --telegram`

**`blr:close:[ID]`** — Close a position.
1. Fetch live price. `bun run scripts/track.ts close --id [ID] --px [LIVE_PRICE]`
2. Reply with P&L summary.

## Recording CLI Reference

```bash
bun run scripts/track.ts record \
  --input "<user's exact words>" \
  --inst "<TICKER or CONTRACT>" \
  --px <entry price> --dir <long|short> \
  --plat <robinhood|kalshi|polymarket|hyperliquid|bankr> \
  --action paper --shape <binary|mispriced|sector|relative|vulnerability> \
  --β <thesis beta 0-1> --conv <convexity multiple> --tc <annualized time cost> \
  --kills "<kill1, kill2, kill3>" --alt "<ALT TICKER $price direction>"
```

## Disclaimer

End every routing response with this line:

`Expressions, not advice. Do your own research.`
