/**
 * Diverse test samples for leap distance metric evaluation.
 *
 * Each sample has:
 * - A realistic derivation chain (v2 format)
 * - An "intuitive leap" rating (what a human would say)
 * - Notes on what makes this case interesting/tricky
 *
 * Use these to evaluate whether a proposed metric correctly
 * ranks calls by conceptual distance from source to trade.
 */

import type { DerivationChain } from "../board/types";

interface LeapSample {
  id: string;
  label: string;
  source_quote: string;
  ticker: string;
  call_type: "direct" | "derived";
  instrument: "stock" | "options" | "kalshi" | "perps";
  chain: DerivationChain;
  intuitive_leap: "none" | "tiny" | "small" | "medium" | "large" | "max";
  notes: string;
}

export const samples: LeapSample[] = [

  // ── NONE: Author named the exact trade ──────────────────────────
  {
    id: "direct_ionq",
    label: "Shkreli names IONQ explicitly",
    source_quote: "IONQ is the buy here. Quantum selloff was mechanical, quants got margin called. $34 is a gift.",
    ticker: "IONQ",
    call_type: "direct",
    instrument: "stock",
    chain: {
      segments: [
        { quote: "IONQ is the buy here. Quantum selloff was mechanical, quants got margin called. $34 is a gift.", speaker: "martinshkreli" },
      ],
      steps: [
        { text: "IONQ is the buy at $34", segment: 0 },
        { text: "quantum selloff was forced selling, not fundamental deterioration", segment: 0 },
      ],
    },
    intuitive_leap: "none",
    notes: "Author named ticker + price + direction. Skill just agreed. Both steps are evidence. This is the baseline — any metric should return ~0 here.",
  },

  // ── TINY: Same underlying, skill picked different wrapper ───────
  {
    id: "wrapper_nvda",
    label: "CT says NVDA moon, skill picks LEAPS",
    source_quote: "NVDA $200 by summer. Blackwell ramp is insane, every hyperscaler is buying.",
    ticker: "NVDA",
    call_type: "direct",
    instrument: "options",
    chain: {
      segments: [
        { quote: "NVDA $200 by summer. Blackwell ramp is insane, every hyperscaler is buying.", speaker: "source" },
      ],
      steps: [
        { text: "NVDA to $200 by summer on Blackwell ramp", segment: 0 },
        { text: "Jun 2026 $160 calls capture the upside with defined risk", },
      ],
    },
    intuitive_leap: "tiny",
    notes: "Same ticker, same direction. Skill only changed the instrument wrapper (shares → options). One inference step for instrument selection. Tricky: does wrapper selection count as a leap?",
  },

  // ── SMALL: Author had specific thesis, skill found the pure-play ─
  {
    id: "pureplay_dell",
    label: "Chamath on-prem thesis → DELL",
    source_quote: "On-prem is back. Do I, if I'm Geico, want all my actuaries using proprietary data on an open LLM? The answer is no.",
    ticker: "DELL",
    call_type: "derived",
    instrument: "stock",
    chain: {
      segments: [
        { quote: "On-prem is back. Do I, if I'm Geico, want all my actuaries using proprietary data on an open LLM?", speaker: "chamath", timestamp: "42:15" },
        { quote: "Too expensive.", speaker: "friedberg", timestamp: "43:30" },
      ],
      steps: [
        { text: "on-prem is back — enterprises won't put proprietary data in open LLMs", segment: 0 },
        { text: "cloud private AI is too expensive — reinforces physical on-prem", segment: 1 },
        { text: "companies buying their own AI servers instead of cloud" },
        { text: "DELL has $18.4B AI server backlog growing 150% YoY, stock -30% from highs" },
      ],
    },
    intuitive_leap: "small",
    notes: "Source talked about the trend specifically (on-prem). Skill connected it to a specific company. 2 evidence, 1 thesis inference, 1 instrument selection. Multi-speaker inflates evidence count — would a single-speaker version of this same thesis look like a bigger leap?",
  },

  // ── SMALL: Binary event → prediction market ─────────────────────
  {
    id: "binary_fed",
    label: "Fed won't cut → Kalshi contract",
    source_quote: "No chance they cut in March. Powell said 'no urgency' three times. The dot plot is clear.",
    ticker: "FED-RATE-MAR26",
    call_type: "derived",
    instrument: "kalshi",
    chain: {
      segments: [
        { quote: "No chance they cut in March. Powell said 'no urgency' three times.", speaker: "source" },
      ],
      steps: [
        { text: "Fed won't cut rates in March — Powell signaled patience", segment: 0 },
        { text: "Kalshi 'Fed holds in March' contract at $0.92 — pay $0.92 to win $1.00" },
      ],
    },
    intuitive_leap: "small",
    notes: "Thesis is crystal clear and binary. Skill just found the direct contract. Only 1 inference step (instrument selection for Kalshi). But is this really a 'small' leap or 'tiny'? The thesis didn't change at all — only the instrument class changed.",
  },

  // ── MEDIUM: Sector thesis, non-obvious name ─────────────────────
  {
    id: "nonoob_evr",
    label: "IPO wave → Evercore (not MS/GS)",
    source_quote: "Michael Grimes is back at Morgan Stanley. The IPO factory restarts.",
    ticker: "EVR",
    call_type: "derived",
    instrument: "stock",
    chain: {
      segments: [
        { quote: "Michael Grimes is back at Morgan Stanley. The IPO factory restarts.", speaker: "martinshkreli" },
      ],
      steps: [
        { text: "Grimes returning signals IPO wave is real", segment: 0 },
        { text: "MS and GS are consensus — already at price targets" },
        { text: "pure-play advisory firms have more leverage to fee surge" },
        { text: "EVR: pure advisory, 50%+ margins, -17% from 52W high" },
      ],
    },
    intuitive_leap: "medium",
    notes: "Source identified the catalyst (Grimes return). Skill DISAGREED with the obvious trade (MS/GS) and found a non-consensus alternative. 1 evidence, 2 thesis inferences, 1 instrument selection. The 'non-obvious play' step is the key leap.",
  },

  // ── MEDIUM: Relative value thesis → pair trade ──────────────────
  {
    id: "pair_soleth",
    label: "SOL flips ETH → perp pair trade",
    source_quote: "SOL is going to flip ETH. The developer migration is accelerating, every new protocol launches on Solana first.",
    ticker: "SOL-ETH",
    call_type: "derived",
    instrument: "perps",
    chain: {
      segments: [
        { quote: "SOL is going to flip ETH. The developer migration is accelerating.", speaker: "source" },
      ],
      steps: [
        { text: "SOL will outperform ETH — developer ecosystem shifting", segment: 0 },
        { text: "going long SOL spot only captures half the thesis" },
        { text: "long SOL / short ETH on Hyperliquid isolates the ratio" },
      ],
    },
    intuitive_leap: "medium",
    notes: "Thesis is specific (SOL > ETH) but instrument class changed entirely (spot → perp pair). Skill reframed directional thesis as relative value. 1 evidence, 1 thesis inference (half the thesis), 1 instrument selection. Is instrument class change a 'leap'?",
  },

  // ── LARGE: Cultural observation → specific sector ───────────────
  {
    id: "cultural_ozempic",
    label: "Everyone's on Ozempic → HIMS",
    source_quote: "Literally everyone I know is on Ozempic or trying to get it. My doctor has a 6-month waitlist.",
    ticker: "HIMS",
    call_type: "derived",
    instrument: "stock",
    chain: {
      segments: [
        { quote: "Literally everyone I know is on Ozempic or trying to get it. My doctor has a 6-month waitlist.", speaker: "source" },
      ],
      steps: [
        { text: "GLP-1 demand is outstripping supply — 6-month waitlists", segment: 0 },
        { text: "the bottleneck isn't the drug, it's distribution and access" },
        { text: "telehealth DTC platforms bypass the waitlist" },
        { text: "HIMS launched GLP-1 compounding, $199/month vs $1,300 retail" },
        { text: "HIMS at 2.1x revenue, growing 77% YoY" },
      ],
    },
    intuitive_leap: "large",
    notes: "Source made a personal observation (everyone's on Ozempic). Skill decoded: observation → supply/demand imbalance → distribution bottleneck → specific DTC company. 1 evidence, 3 thesis inferences, 1 instrument selection. The thesis itself was constructed by the skill, not stated by the source.",
  },

  // ── LARGE: Contrarian reframe — skill flips the direction ───────
  {
    id: "flip_ailayoffs",
    label: "AI blamed for layoffs → long gold",
    source_quote: "AI is being blamed for all these tech layoffs but the real cause is money printing catching up. Companies hired for free money, not for AI replacement.",
    ticker: "GLD",
    call_type: "derived",
    instrument: "stock",
    chain: {
      segments: [
        { quote: "AI is being blamed for all these tech layoffs but the real cause is money printing catching up.", speaker: "source" },
      ],
      steps: [
        { text: "tech layoffs are blamed on AI but the real cause is monetary excess", segment: 0 },
        { text: "if it's money printing, the trade isn't short tech — tech recovers when rates normalize" },
        { text: "the purest money-printing trade is the inflation hedge" },
        { text: "GLD at $462, gold hitting all-time highs as central banks stockpile" },
      ],
    },
    intuitive_leap: "large",
    notes: "Skill FLIPPED the obvious trade (short tech) to the opposite direction (long gold). Source said 'money printing' — skill decoded that the deeper claim points to inflation, not tech weakness. 1 evidence, 2 thesis inferences (including a direction flip), 1 instrument selection. The direction flip is the biggest leap of all — same evidence, opposite trade.",
  },

  // ── MAX: Abstract framework → specific company ──────────────────
  {
    id: "abstract_spgi",
    label: "Scarce inputs framework → SPGI",
    source_quote: "When the interface layer gets commoditized, the scarce inputs get more valuable. That's always how it works.",
    ticker: "SPGI",
    call_type: "derived",
    instrument: "stock",
    chain: {
      segments: [
        { quote: "When the interface layer gets commoditized, the scarce inputs get more valuable.", speaker: "nicbstme" },
      ],
      steps: [
        { text: "AI commoditizes the interface layer (terminals, search, analysis)", segment: 0 },
        { text: "proprietary data creators are the scarce input AI can't replace" },
        { text: "financial data companies with regulatory lock-in are the scarcest" },
        { text: "NRSRO credit ratings + S&P index ownership = data AI can't replicate" },
        { text: "SPGI sold off 29% alongside FactSet but has dual moat (ratings + indices)" },
      ],
    },
    intuitive_leap: "max",
    notes: "Source stated a GENERAL FRAMEWORK ('scarce inputs'), not a market thesis. Skill applied it to a specific industry → specific regulatory structure → specific company. 1 evidence, 3 thesis inferences, 1 instrument selection. The source didn't even mention finance — the entire market application is the skill's work.",
  },

  // ── EDGE CASE: Multi-segment podcast with mixed speakers ────────
  {
    id: "multi_podcast",
    label: "3 speakers, competing claims → uranium play",
    source_quote: "Trade wars make everything geopolitical. / But renewables are winning. / The AI power problem is real, every datacenter is maxed.",
    ticker: "CCJ",
    call_type: "derived",
    instrument: "stock",
    chain: {
      segments: [
        { quote: "Trade wars make everything geopolitical", speaker: "chamath", timestamp: "12:30" },
        { quote: "But renewables are winning — solar costs dropped 90% in a decade", speaker: "sacks", timestamp: "18:45" },
        { quote: "The AI power problem is real, every datacenter is maxed", speaker: "friedberg", timestamp: "34:15" },
      ],
      steps: [
        { text: "trade wars make scarce resources strategic", segment: 0 },
        { text: "renewables can't solve baseload — solar is intermittent", segment: 1 },
        { text: "AI datacenters need 24/7 power, nuclear is the only scalable baseload", segment: 2 },
        { text: "uranium is the hardest energy input to replace — 10 year mine lead time" },
        { text: "CCJ is the largest pure-play uranium producer, down 16%" },
      ],
    },
    intuitive_leap: "large",
    notes: "3 speakers, 3 segments, but the skill SYNTHESIZED across them (none of them said 'uranium' or 'nuclear'). 3 evidence steps inflate the evidence count — but the conceptual leap is big because the skill constructed a thesis none of the speakers stated. Tests whether multi-speaker inflation masks a large leap.",
  },

  // ── EDGE CASE: Author almost named the trade ────────────────────
  {
    id: "almost_pltr",
    label: "Source says 'defense AI' generically, PLTR is obvious",
    source_quote: "The defense budget for AI is going to be massive. Every branch is competing for autonomous systems funding.",
    ticker: "PLTR",
    call_type: "derived",
    instrument: "stock",
    chain: {
      segments: [
        { quote: "The defense budget for AI is going to be massive. Every branch is competing for autonomous systems funding.", speaker: "source" },
      ],
      steps: [
        { text: "defense AI spending is accelerating across all branches", segment: 0 },
        { text: "PLTR has the most DoD AI contracts of any software company" },
        { text: "PLTR at 85x earnings but 30% revenue growth, $2.8B backlog" },
      ],
    },
    intuitive_leap: "small",
    notes: "The source ALMOST named PLTR — 'defense AI' basically points at it. Skill just confirmed the obvious. 1 evidence, 1 thesis inference, 1 instrument selection. But the ratio (1:2) looks the same as EVR (medium leap). Tests whether the metric can distinguish 'obvious connection' from 'non-obvious play'.",
  },

  // ── EDGE CASE: Short thesis with vulnerability framing ──────────
  {
    id: "short_goog",
    label: "AI will replace search → short GOOG",
    source_quote: "Nobody under 25 uses Google anymore. They ask ChatGPT. Search is dead.",
    ticker: "GOOG",
    call_type: "derived",
    instrument: "options",
    chain: {
      segments: [
        { quote: "Nobody under 25 uses Google anymore. They ask ChatGPT. Search is dead.", speaker: "source" },
      ],
      steps: [
        { text: "younger users are replacing Google search with AI chat", segment: 0 },
        { text: "Google's ad revenue depends on search volume — 57% of total revenue" },
        { text: "the victim is more mispriced than the winner — GOOG trades at 22x while the 'AI winners' are at 50x+" },
        { text: "GOOG Sep 2026 $150 puts for the earnings catalyst" },
      ],
    },
    intuitive_leap: "medium",
    notes: "Source said 'search is dead' (vague). Skill decoded: victim trade is better than winner trade, picked puts for the catalyst. 1 evidence, 2 thesis inferences, 1 instrument selection. The 'victim is more mispriced than winner' is a genuine insight from the skill. Also tests short-side + options wrapper.",
  },
];

/**
 * Expected ranking by intuitive leap (ascending):
 *
 * 1. direct_ionq     — none   (author named exact trade)
 * 2. wrapper_nvda    — tiny   (same ticker, different wrapper)
 * 3. pureplay_dell   — small  (specific trend → specific company)
 * 4. binary_fed      — small  (binary thesis → direct contract)
 * 5. almost_pltr     — small  (obvious connection, basically named it)
 * 6. nonoob_evr      — medium (sector thesis → non-consensus name)
 * 7. pair_soleth     — medium (directional → pair trade reframe)
 * 8. short_goog      — medium (vague claim → victim trade + puts)
 * 9. cultural_ozempic— large  (personal observation → specific company)
 * 10. flip_ailayoffs — large  (skill flipped the direction entirely)
 * 11. multi_podcast  — large  (3 speakers but none said the thesis)
 * 12. abstract_spgi  — max    (general framework → specific company)
 */
