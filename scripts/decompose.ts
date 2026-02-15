/**
 * Thesis Decomposition — LLM-powered intent parsing
 * 
 * This is the CORE of the belief router. An LLM reads the thesis and outputs:
 * - What the user actually means (causal chain reasoning)
 * - Specific tickers to investigate (stocks, ETFs, crypto, secondaries)
 * - Direction for each (long/short)
 * - Confidence level
 * - What would invalidate the thesis
 * 
 * Uses OpenAI-compatible API (works with OpenRouter, local LLMs, etc.)
 */

export interface DecomposedThesis {
  reasoning: string;        // 2-3 sentence causal chain
  instruments: { ticker: string; direction: "long" | "short"; asset_class: string; why: string }[];
  confidence: "high" | "medium" | "low";
  horizon: string;          // "days", "weeks", "months", "years"
  invalidation: string[];   // specific conditions that kill the thesis
}

const SYSTEM_PROMPT = `You are a thesis-to-trade decomposition engine. A trader gives you a belief about the world. Your job is to figure out what instruments to trade.

RULES:
- Think in causal chains: belief → mechanism → who benefits/loses → specific tickers
- Always consider BOTH sides: who wins AND who loses (long AND short)
- Prefer specific tickers over categories. "NVDA" not "AI stocks"
- Include at least one non-obvious pick that shows real insight
- For crypto theses, include both tokens AND crypto-adjacent equities (COIN, MSTR, MARA)
- For macro theses, include ETFs (SPY, QQQ, TLT, GLD, etc.)
- Pre-IPO companies (Anduril, SpaceX, Anthropic, OpenAI, Figure AI) are valid — mark as "secondary"
- If the thesis implies something should go DOWN, include SHORT positions
- 8-15 instruments total. Mix of stocks, ETFs, crypto, shorts, secondaries.
- Confidence: high = specific catalyst with timeline, medium = directional conviction, low = speculative/vague
- Invalidation should be SPECIFIC. Not "thesis proves wrong" but "US defense budget cut >15% in next authorization"

OUTPUT FORMAT (JSON only, no markdown):
{
  "reasoning": "2-3 sentences explaining the causal chain from belief to trades",
  "instruments": [
    {"ticker": "NVDA", "direction": "long", "asset_class": "stock", "why": "direct beneficiary of compute demand"},
    {"ticker": "GOOGL", "direction": "short", "asset_class": "stock", "why": "search revenue threatened"}
  ],
  "confidence": "medium",
  "horizon": "months",
  "invalidation": ["specific condition 1", "specific condition 2"]
}`;

/**
 * Decompose a thesis using an LLM API
 */
export async function decomposeThesis(thesis: string): Promise<DecomposedThesis> {
  // Try multiple API sources in order
  const apiKey = await getApiKey();
  
  if (!apiKey.key) {
    console.error("   ⚠️ No LLM API key found — falling back to rule-based decomposition");
    return fallbackDecompose(thesis);
  }
  
  try {
    const response = await fetch(apiKey.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.key}`,
      },
      body: JSON.stringify({
        model: apiKey.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Thesis: "${thesis}"` },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });
    
    if (!response.ok) {
      const err = await response.text();
      console.error(`   ⚠️ LLM API error: ${response.status} ${err.slice(0, 200)}`);
      return fallbackDecompose(thesis);
    }
    
    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("   ⚠️ LLM returned non-JSON response");
      return fallbackDecompose(thesis);
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as DecomposedThesis;
    
    // Validate structure
    if (!parsed.instruments || !Array.isArray(parsed.instruments) || parsed.instruments.length === 0) {
      console.error("   ⚠️ LLM returned empty instruments");
      return fallbackDecompose(thesis);
    }
    
    return parsed;
  } catch (e) {
    console.error(`   ⚠️ LLM decomposition failed: ${(e as Error).message}`);
    return fallbackDecompose(thesis);
  }
}

/**
 * Get API key from environment — tries multiple sources
 */
async function getApiKey(): Promise<{ key: string; baseUrl: string; model: string }> {
  // Try loading from env files
  let envVars: Record<string, string> = {};
  try {
    const envFile = await Bun.file(`${process.env.HOME}/.config/env/global.env`).text();
    for (const line of envFile.split("\n")) {
      const match = line.match(/^export\s+(\w+)=["']?([^"'\n]+)["']?/);
      if (match) envVars[match[1]] = match[2];
    }
  } catch {}
  
  // Also check process.env
  const get = (key: string) => process.env[key] || envVars[key] || "";
  
  // OpenRouter (preferred — access to many models)
  if (get("OPENROUTER_API_KEY")) {
    return {
      key: get("OPENROUTER_API_KEY"),
      baseUrl: "https://openrouter.ai/api/v1/chat/completions",
      model: "anthropic/claude-3.5-sonnet", // fast + smart
    };
  }
  
  // OpenAI
  if (get("OPENAI_API_KEY")) {
    return {
      key: get("OPENAI_API_KEY"),
      baseUrl: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4o-mini",
    };
  }
  
  // Anthropic (needs different API format but try anyway)
  if (get("ANTHROPIC_API_KEY")) {
    return {
      key: get("ANTHROPIC_API_KEY"),
      baseUrl: "https://api.anthropic.com/v1/messages",
      model: "claude-sonnet-4-20250514",
    };
  }
  
  return { key: "", baseUrl: "", model: "" };
}

/**
 * Fallback: rule-based decomposition when no LLM API available
 * This is intentionally simple — the value is in the LLM path
 */
function fallbackDecompose(thesis: string): DecomposedThesis {
  // Import the old expansion logic as fallback
  const { expandThesis, extractMentionedTickers } = require("./expand");
  
  const mentioned = extractMentionedTickers(thesis);
  const themes = expandThesis(thesis);
  
  const instruments = mentioned.map((t: string) => ({
    ticker: t,
    direction: "long" as const,
    asset_class: "stock",
    why: "Directly mentioned in thesis",
  }));
  
  return {
    reasoning: `Fallback decomposition (no LLM available). Found ${mentioned.length} mentioned tickers and ${themes.length} related themes.`,
    instruments,
    confidence: "low",
    horizon: "months",
    invalidation: ["Core thesis assumption proves incorrect"],
  };
}

// CLI: bun run decompose.ts "AGI will be open source"
if (import.meta.main) {
  const thesis = process.argv.slice(2).join(" ");
  if (!thesis) {
    console.error("Usage: bun run decompose.ts 'your thesis here'");
    process.exit(1);
  }
  
  console.error(`\n🧠 Decomposing: "${thesis.slice(0, 80)}..."\n`);
  const result = await decomposeThesis(thesis);
  console.log(JSON.stringify(result, null, 2));
}
