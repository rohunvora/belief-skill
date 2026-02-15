# Bankr Adapter

## What Bankr Does

Bankr is a natural-language-to-transactions API. You send it a thesis in plain English,
it returns structured data: tokens with prices, Polymarket prediction markets, transaction
calldata ready for wallet signing.

## API Pattern (Async Polling)

Bankr is **slow** (15-125 seconds). Every request is asynchronous:

1. **POST** `/agent/prompt` with `{ "prompt": "..." }` and `x-api-key` header
   - Returns HTTP 202: `{ jobId, threadId, status: "pending" }`
2. **Poll** `GET /agent/job/:jobId` every 3 seconds
   - Status lifecycle: `pending` -> `processing` -> `completed` | `failed` | `cancelled`
3. **Completed** response includes:
   - `response` — natural language analysis text
   - `transactions[]` — executable calldata (chainId, to, data, gas, value)
   - `richData[]` — charts and social cards
   - `statusUpdates[]` — progress messages from the agent

## Authentication

```
Header: x-api-key: bk_...
```

API key is in `.env` as `BANKR_API_KEY`. Bun auto-loads it.

## Coverage

### 5 Supported Chains
| Chain    | Native Token | Chain ID |
|----------|-------------|----------|
| Base     | ETH         | 8453     |
| Solana   | SOL         | -        |
| Ethereum | ETH         | 1        |
| Polygon  | POL         | 137      |
| Unichain | ETH         | -        |

### Instrument Types
- **Token swaps** — any ERC20/SPL token across 5 chains, routed via 0x
- **Polymarket** — prediction market YES/NO shares with current prices
- **Tokenized treasuries** — ONDO, USTB, BUIDL, USDY, USYC
- **Yield trading** — PENDLE PT/YT tokens
- **Cross-chain swaps** — bridge + swap in one transaction
- **Avantis** — leveraged trading on Base

### NOT Supported
- Traditional equities (no TradFi)
- Kalshi or non-Polymarket prediction markets
- CEX options or futures
- Hyperliquid perpetuals

## Prompt Engineering

Quality depends on prompt crafting. Examples:

| Thesis | Good Prompt |
|--------|------------|
| Fed rates higher for longer | "What tokens or prediction markets relate to interest rates or Fed policy?" |
| AI defense spending booms | "What AI-related tokens can I swap on Solana or Base?" |
| SOL flips ETH | "I want to swap ETH for SOL" |
| Trump wins election | "Can you find Polymarket prediction markets about the presidential election?" |

## Transaction Execution

Bankr returns calldata but does NOT execute. The `transactions[]` array contains:
```json
{
  "type": "swap",
  "metadata": {
    "transaction": {
      "chainId": 8453,
      "to": "0x...",
      "data": "0x...",
      "gas": "300000",
      "value": "100000000000000000"
    }
  }
}
```
The user's wallet must sign and broadcast these transactions.

## Cost
- Agent API (`x-api-key`): free per request
- SDK (`x402`): $0.10 USDC per request

## Usage in belief-skill

```bash
# Discover instruments for a thesis
bun run scripts/adapters/bankr/instruments.ts "Fed keeps rates higher for longer"

# Calculate returns for a specific instrument
bun run scripts/adapters/bankr/returns.ts "ONDO" "long" "token"
```
