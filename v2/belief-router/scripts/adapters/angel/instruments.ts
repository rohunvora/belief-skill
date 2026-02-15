#!/usr/bin/env bun
/**
 * Angel / Private Market Adapter — instruments.ts
 *
 * Searches Republic, Wefunder, and Crunchbase for private market
 * expressions of a thesis. Returns structured results for the
 * belief router's Step 2.5 (Private Market Scan).
 *
 * Usage: bun run scripts/adapters/angel/instruments.ts "peptide oral delivery"
 */

const keywords = process.argv[2];
if (!keywords) {
  console.error("Usage: bun run instruments.ts \"thesis keywords\"");
  process.exit(1);
}

const terms = keywords.toLowerCase().split(/[\s,]+/).filter(Boolean);
console.log(`[angel/instruments] Searching for: ${terms.join(", ")}`);

interface PrivateInstrument {
  name: string;
  stage: string;
  platform: string;
  url: string;
  category: string;
  raise_size?: string;
  valuation?: string;
  thesis_beta_est: number;
  convexity_range: string;
  lockup_years: string;
  relevance: "direct" | "adjacent" | "infrastructure";
  description?: string;
}

async function searchRepublic(terms: string[]): Promise<PrivateInstrument[]> {
  const results: PrivateInstrument[] = [];
  try {
    // Republic has a public explore page we can search
    const query = encodeURIComponent(terms.join(" "));
    const res = await fetch(`https://republic.com/api/offerings?search=${query}&status=active&limit=5`, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      const offerings = Array.isArray(data) ? data : data?.offerings || data?.results || [];
      for (const o of offerings.slice(0, 5)) {
        results.push({
          name: o.name || o.title || "Unknown",
          stage: o.stage || "Early",
          platform: "Republic",
          url: `https://republic.com/${o.slug || o.id || ""}`,
          category: o.category || o.industry || terms[0],
          raise_size: o.goal ? `$${(o.goal / 1e6).toFixed(1)}M` : undefined,
          valuation: o.valuation ? `$${(o.valuation / 1e6).toFixed(0)}M` : undefined,
          thesis_beta_est: 0.7,
          convexity_range: "10-50x",
          lockup_years: "5-7",
          relevance: "direct",
          description: o.description?.slice(0, 200) || undefined,
        });
      }
    }
  } catch (e) {
    // Silent fail — platform may be down or API changed
  }
  return results;
}

async function searchWefunder(terms: string[]): Promise<PrivateInstrument[]> {
  const results: PrivateInstrument[] = [];
  try {
    const query = encodeURIComponent(terms.join(" "));
    const res = await fetch(`https://wefunder.com/explore?query=${query}`, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
    });
    if (res.ok) {
      const html = await res.text();
      // Basic extraction — look for company cards in HTML
      const matches = html.matchAll(/data-company-name="([^"]+)"/g);
      for (const match of [...matches].slice(0, 5)) {
        results.push({
          name: match[1],
          stage: "Early",
          platform: "Wefunder",
          url: `https://wefunder.com/explore?query=${query}`,
          category: terms[0],
          thesis_beta_est: 0.7,
          convexity_range: "10-50x",
          lockup_years: "5-7",
          relevance: "direct",
        });
      }
    }
  } catch (e) {
    // Silent fail
  }
  return results;
}

async function searchCrunchbase(terms: string[]): Promise<PrivateInstrument[]> {
  const results: PrivateInstrument[] = [];
  try {
    // Crunchbase has no free API, but we can scrape the discover page
    const query = encodeURIComponent(terms.join(" "));
    const res = await fetch(
      `https://www.crunchbase.com/v4/data/autocompletes?query=${query}&collection_ids=organizations&limit=5`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const entities = data?.entities || [];
      for (const e of entities.slice(0, 5)) {
        const props = e.properties || {};
        results.push({
          name: props.name || e.identifier?.value || "Unknown",
          stage: props.funding_stage || "Unknown",
          platform: "Crunchbase",
          url: `https://www.crunchbase.com/organization/${e.identifier?.permalink || ""}`,
          category: props.short_description?.slice(0, 100) || terms[0],
          thesis_beta_est: 0.6,
          convexity_range: "5-20x",
          lockup_years: "3-7",
          relevance: "adjacent",
          description: props.short_description?.slice(0, 200) || undefined,
        });
      }
    }
  } catch (e) {
    // Silent fail
  }
  return results;
}

async function main() {
  // Search all platforms in parallel
  const [republic, wefunder, crunchbase] = await Promise.all([
    searchRepublic(terms),
    searchWefunder(terms),
    searchCrunchbase(terms),
  ]);

  const all = [...republic, ...wefunder, ...crunchbase];

  console.log(`[angel/instruments] Found ${all.length} instruments`);

  const output = {
    platform: "angel",
    instruments: all,
    search_method: "keyword_search",
    platforms_searched: ["republic", "wefunder", "crunchbase"],
    note:
      all.length === 0
        ? "No active raises found. Try broader keywords or check platforms manually."
        : "Results are directional. Verify raises are still active and do your own DD.",
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
