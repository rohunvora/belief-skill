/**
 * Ticker logo URL resolution.
 *
 * Tiered approach:
 *   1. Crypto tokens  -> cryptocurrency-icons CDN (free, no auth)
 *   2. Stocks/ETFs    -> Parqet logo CDN (free, no auth, returns SVG or 100x100 PNG)
 *   3. Prediction markets -> platform favicon via icon.horse
 *   4. null -> caller renders colored letter fallback
 */

/**
 * Resolve a logo URL for a given ticker + platform + instrument.
 * Returns null if no URL can be determined (caller should render fallback).
 */
export function getLogoUrl(
  ticker: string,
  platform: string | null,
  instrument: string | null,
): string | null {
  // Crypto tokens (Hyperliquid perps)
  if (platform === "hyperliquid" || instrument === "perps") {
    const symbol = ticker.replace(/-.*$/, "").toLowerCase(); // "SOL-PERP" -> "sol"
    return `https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@master/32/color/${symbol}.png`;
  }

  // Prediction markets: platform favicon
  if (platform === "kalshi") {
    return "https://icon.horse/icon/kalshi.com";
  }
  if (platform === "polymarket") {
    return "https://icon.horse/icon/polymarket.com";
  }

  // Stocks / ETFs: Parqet logo CDN (accepts ticker symbols directly, returns SVG or 100x100 PNG)
  const upper = ticker.toUpperCase().replace(/-.*$/, ""); // strip suffixes
  return `https://assets.parqet.com/logos/symbol/${upper}`;
}
