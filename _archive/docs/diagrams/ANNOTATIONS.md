# Diagram Annotations

Examples and context for each diagram. Reference these alongside the FigJam board.

## 01 Main Spine: Claude Code Security tweet

| Step | What happened |
|------|--------------|
| INPUT | x.com/claudeai/status/2024907535145468326 |
| Validate | It's a URL → extract content → get source_date (Feb 20) |
| Extract | Layer 1: author=@claudeai, thesis="scans codebases for vulnerabilities...traditional tools often miss" |
| Shape | Vulnerability (something threatens existing players) |
| Deeper | Obvious play: short code security companies. But pure-plays are private. |
| Research | Sketch: "SNPS short, Coverity threatened." Phase 1: searched → Synopsys sold Coverity Sept 2024. KILLED sketch. Redraft: "cybersecurity sold indiscriminately." Phase 2: CRWD -8%, FROG -25%, NET -8%. |
| Score | CRWD long: Direct alignment (overreaction), Emerging edge, Linear payoff, Very forgiving. Beat FROG short (edge gone after 25% drop) and BUG short (crowded). |
| Output | CRWD long at $388.60, 25 shares. Posted to board as c21eff6e-1. |

## 02 Input Validation: one example per branch

| Branch | Input | Result |
|--------|-------|--------|
| Clear thesis | "AI defense spending will boom" | Proceed directly |
| Vibe | "everyone's on Ozempic" | Ask: GLP-1 accelerating? / telehealth wave? / pharma running? |
| No direction | "tell me about stocks" | "What do you think is going to happen?" |
| URL | x.com/punter_punts/status/... | Extract → "SOL momentum pivoting, sellers exhausted" + source_date Feb 20 |
| Handle | "scan @chamath" | Cost gate ($0.26) → fetch 50 tweets → filter 5 directional → user picks |
| Screenshot | [image of tweet] | Extract text + handle + date from image |
| Multiple | 45min podcast transcript | "Found 5 theses. Route all or pick?" |

## 03 Two Layers: three attribution examples

| Input | Layer 1 (author) | Layer 2 (skill) | Tier |
|-------|-----------------|-----------------|------|
| @punter_punts: "SOL bottoming" | ticker=SOL, direction=long | routes SOL long | direct |
| @chiefofautism: "76 nodes in 13 countries" | ticker=null | routes COHR long | derived |
| @claudeai: code security announcement | ticker=null | routes CRWD long | derived |

## 04 Scoring: Fed won't cut example

| Candidate | Alignment | Payoff | Edge | Timing | Result |
|-----------|-----------|--------|------|--------|--------|
| Kalshi NO at $0.08 | Direct | Max asymmetry | Emerging | Very forgiving | WINNER |
| TLT puts | Partial | High asymmetry | Consensus | Punishing | Loses on every dimension |

## 05 Research: sketch killed example

| Phase | Action | Result |
|-------|--------|--------|
| Sketch | "SNPS short, Coverity threatened by Claude" | Premise: SNPS owns Coverity |
| Phase 1 | Search "Synopsys code security 2025" | PREMISE FAILS: sold to Clearlake Sept 2024 |
| Kill | Discard SNPS sketch entirely | |
| Redraft | "Cybersecurity sector sold indiscriminately" | New premise: CRWD does endpoint, not code scanning |
| Phase 1b | Search "CRWD NET sell-off Claude announcement" | Confirmed: CRWD -8%, FROG -25%, narrative contagion |
| Phase 2 | Robinhood + HL + Kalshi discovery | CRWD validated, no Kalshi match, not on HL |

## 06 Output: COHR card example

**Reply (chat):**
> "76 nodes in 13 countries." COHR long at $232.48. 430 shares...

**Chain:**
> [1] 76 nodes means 76 chokepoints (cited: @chiefofautism)
> [2] COHR controls ~40% of AI datacenter optical transceivers (inferred)
> [3] ASML is obvious but fully priced at ATH. COHR is next layer down (inferred)

**Board teaser:**
> "76 nodes in 13 countries." · @chiefofautism
> COHR long · $232.48 · derived
> → belief-board.fly.dev/t/abc123

## 07 Bulk Mode: @chamath scan example

| Step | Result |
|------|--------|
| Fetch | 50 tweets, 5 directional takes found |
| Surface | "1. On-premise is the new cloud (Feb 12)" etc. |
| User picks | "all" |
| Tier | T1: MSFT underperformance, AI power bottleneck. T2: enterprise data sovereignty. T3: general AI commentary. |
| Sweep | Robinhood: MSFT,CEG,AMZN. Kalshi: "Fed" keywords. HL: none. |
| Deep route | MSFT short + CEG long (full pipeline each) |
| Output | 2 deep routes with board links + 3 quick hits with candidates only |

## 08 Tools: when each fires

| Thesis shape | Extraction | Discovery | Returns |
|-------------|------------|-----------|---------|
| Binary event ("Fed holds") | - | Kalshi + Polymarket | kalshi/returns |
| Mispriced company ("PLTR undervalued") | - | Robinhood + HL | robinhood/returns or HL/returns |
| Sector theme ("AI defense booms") | - | Robinhood (multiple) + Kalshi | robinhood/returns for winner |
| URL input | transcript/extract | all platforms | winner's platform |
| Handle scan | x/user-timeline | all platforms per take | winner's platform per take |
