# Bankr API Validation Report

**Date:** 2026-02-15
**API Base:** https://api.bankr.bot
**SDK:** @bankr/sdk@0.1.0-alpha.8 (MIT)
**Status:** VIABLE - strong adapter candidate

---

## 1. API Structure & Authentication

### Two Auth Methods

**Method A: API Key (Agent API)** - used for server-side agents
- Header: `x-api-key: bk_...`
- Endpoints: `/agent/prompt`, `/agent/job/:jobId`, `/agent/job/:jobId/cancel`
- Free per-request (no USDC cost)

**Method B: x402 Payment (SDK v2)** - used for programmatic SDK access
- No API key needed
- Pays $0.10 USDC per request via x402 protocol
- Requires a private key for signing payments
- Endpoint: `/v2/prompt` (inferred from SDK)

### Async Job Pattern

All prompts are asynchronous:
1. `POST /agent/prompt` returns `{ jobId, threadId, status: "pending" }` (HTTP 202)
2. `GET /agent/job/:jobId` to poll status
3. Status lifecycle: `pending` -> `processing` -> `completed` | `failed` | `cancelled`
4. Completed jobs include `response` (text), `transactions[]` (executable tx data), `richData[]` (charts/cards)
5. Jobs have `statusUpdates[]` with live progress messages (useful for UX)
6. Typical processing time: 15-120 seconds

### Request Format
```json
POST /agent/prompt
Headers: { "x-api-key": "bk_...", "Content-Type": "application/json" }
Body: { "prompt": "string" }
```

### Response Format (completed job)
```json
{
  "success": true,
  "jobId": "job_...",
  "threadId": "thr_...",
  "status": "completed",
  "prompt": "original prompt",
  "processingTime": 22998,
  "response": "natural language response text",
  "transactions": [
    {
      "type": "swap",
      "metadata": {
        "__ORIGINAL_TX_DATA__": {
          "chain": "base",
          "humanReadableMessage": "Swap 0.1 ETH to USDC",
          "inputTokenTicker": "ETH",
          "outputTokenTicker": "USDC",
          "receiver": "0x..."
        },
        "transaction": {
          "chainId": 8453,
          "to": "0x...",
          "data": "0x...",
          "gas": "300000",
          "value": "100000000000000000"
        },
        "allowanceTarget": "0x..."
      }
    }
  ],
  "richData": [],
  "completedAt": "2026-02-15T16:26:08.095Z"
}
```

---

## 2. Thesis Test Results

### Thesis 1: "Fed keeps rates higher for longer" (Macro)

**Prompt:** "What tokens or swaps are available related to interest rates or Fed policy?"

**Processing time:** 125 seconds (long - did deep research)

**Result: EXCELLENT**

Bankr returned three categories of actionable instruments:

1. **Polymarket prediction markets** - Found real FOMC meeting outcome markets with current odds:
   - "No Fed rate cuts in 2026?" at 6.3%
   - "Only 1 cut in 2026?" at 16.5%
   - March 2026 "No Change" at 92.5%
   - June 2026 "No Change" at 37.5%

2. **Tokenized treasuries** - ONDO, USTB, BUIDL, USDY, USYC with live prices

3. **Yield trading** - PENDLE for trading yield spreads (PT/YT tokens)

**Verdict:** Bankr understands macro theses and can map them to both prediction markets AND DeFi instruments. This is exactly what belief-skill needs.

### Thesis 2: "AI defense spending will boom" (Sector)

**Prompt:** "What AI-related tokens can I swap on Solana or Base?"

**Processing time:** 51 seconds

**Result: GOOD**

Returned structured data with:
- **Solana AI tokens:** RENDER ($1.43, $739M mcap), PIPPIN (+186.7% 7d), NEAR
- **Base AI tokens:** VIRTUAL ($423M mcap)
- **Trending tokens** on both chains with prices and contract addresses
- Included a summary table with chain, category, and market cap

**Verdict:** Can discover sector-relevant tokens with real-time pricing. Response quality is high - includes contract addresses needed for execution.

### Thesis 3: "Solana flips Ethereum in DEX volume" (Crypto-native)

**Prompt:** "I want to swap ETH for SOL. Can you help me do that?"

**Processing time:** 18 seconds (fastest - straightforward swap)

**Result: GOOD**

Bankr confirmed it can execute the swap and asked for:
1. How much ETH to swap
2. Which chain the ETH is on

**Verdict:** Bankr CAN construct swap transactions. From the SDK types, a completed swap returns full transaction calldata (chainId, to, data, gas, value) ready to be signed and broadcast by the user's wallet.

### Thesis 4: Polymarket routing test

**Prompt:** "Can you trade on Polymarket prediction markets?"

**Processing time:** 32 seconds

**Result: EXCELLENT**

Bankr explicitly confirmed Polymarket support and returned:
- 5 active presidential election markets with current prices
- Direct Polymarket URLs for each market
- Offered to execute trades given an outcome and amount

**Verdict:** YES - Bankr can route to Polymarket. This is a key capability for belief-skill.

---

## 3. Supported Chains & Protocols

### Chains (confirmed by API response)
| Chain | Native Token | Status |
|-------|-------------|--------|
| Base | ETH | Supported |
| Solana | SOL | Supported |
| Ethereum | ETH | Supported |
| Polygon | POL | Supported |
| Unichain | ETH | Supported |

### Key Protocols/Features
- **Swaps:** 0x routing for ERC20 tokens on EVM chains
- **Cross-chain swaps:** `SwapCrossChainTransaction` type in SDK
- **Polymarket:** Yes, can find markets and execute trades
- **NFTs:** Buy, transfer, mint (Manifold, SeaDrop)
- **Avantis:** Leveraged trading on Base
- **Transfers:** ETH, ERC20, NFT transfers
- **Market data:** Real-time token prices, trending tokens, market analysis

### What Bankr Does NOT Support (based on testing)
- Traditional equities/stocks (no TradFi)
- Kalshi or other non-Polymarket prediction markets
- Options or futures on centralized exchanges
- Hyperliquid perpetuals (not observed in responses)

---

## 4. SDK Capabilities (@bankr/sdk)

**Version:** 0.1.0-alpha.8 (alpha)
**Dependencies:** viem, x402-fetch
**Payment:** $0.10 USDC per request via x402 protocol

### Key SDK Methods
```typescript
const client = new BankrClient({
  privateKey: "0x...",      // For x402 payment signing
  walletAddress: "0x...",   // Context wallet (receives swapped tokens)
});

// Recommended: submit + auto-poll
const result = await client.promptAndWait({ prompt: "Buy $5 of SOL" });

// Manual: submit, then poll
const { jobId } = await client.prompt({ prompt: "..." });
const status = await client.pollJob({ jobId, interval: 2000 });

// Cancel
await client.cancelJob(jobId);
```

### Transaction Types Supported by SDK
- `swap` - Token swaps (0x routing)
- `approval` - Token approvals
- `transfer_erc20` / `transfer_eth` - Transfers
- `convert_eth_to_weth` / `convert_weth_to_eth`
- `transfer_nft` / `mint_manifold_nft` / `mint_seadrop_nft` / `buy_nft`
- `avantisTrade` - Avantis leveraged trading
- `swapCrossChain` - Cross-chain bridges/swaps

### Rich Data Types
- `social-card` - Analysis cards with text
- `chart` - Chart URLs for visualization

### SDK vs Agent API
The SDK (`/v2/prompt`) uses x402 payment ($0.10/request) and requires no API key.
The Agent API (`/agent/prompt`) uses an API key and appears to be free.
Both return the same job format and can be polled the same way.

---

## 5. Integration Architecture for belief-skill

### Adapter Design

Bankr is a **natural-language-in, structured-data-out** API. The adapter pattern is:

```
belief-skill thesis -> natural language prompt -> Bankr agent/prompt -> poll job ->
  parse response text + transactions[] -> return structured actions
```

### Key Considerations

1. **Latency:** 15-125 seconds per request. Must be async with polling. Not suitable for real-time price feeds.

2. **Prompt engineering matters:** The quality of Bankr's response depends heavily on how the prompt is crafted. "What tokens relate to Fed policy?" yielded much richer results than a generic query.

3. **Thread persistence:** Each job gets a `threadId` - Bankr maintains conversation context within a thread. This could be used for multi-turn thesis refinement.

4. **Transaction execution is separate:** Bankr returns transaction calldata but does NOT execute it. The user's wallet must sign and broadcast. belief-skill would need a wallet integration layer.

5. **Two paths to Bankr:**
   - **Agent API (x-api-key):** Free, good for prototyping, key provided
   - **SDK (x402):** $0.10/request, no key needed, requires USDC wallet

---

## 6. Overall Verdict

### Is Bankr viable as an adapter? YES

**Strengths:**
- Understands complex macro/sector/crypto theses and maps them to tradeable instruments
- Can discover tokens across 5 chains with real-time pricing
- Polymarket integration confirmed - can find markets AND execute trades
- Returns structured transaction data (not just text) for actual execution
- Good developer ergonomics: clear API pattern, TypeScript SDK, examples
- Status updates during processing are useful for UX

**Weaknesses:**
- Slow (15-125s per request) - not suitable for real-time
- Alpha SDK ($0.10/request cost adds up)
- No traditional equities support (expected for DeFi-focused tool)
- No Hyperliquid/perps support observed
- Agent API appears undocumented (only examples repo)

**Recommendation for belief-skill v2:**
Bankr should be the **primary DeFi + Polymarket adapter**. It covers:
- Token swaps across 5 chains (Base, Solana, Ethereum, Polygon, Unichain)
- Polymarket prediction market trades
- Token discovery and market analysis
- Cross-chain bridges

Use the Agent API (`x-api-key`) for development, consider SDK for production if wallet integration is needed. Pair with Kalshi adapter for regulated event markets and Hyperliquid adapter for perpetual futures.
