/**
 * Yahoo Finance Historical Price Lookup
 *
 * Fetches historical OHLCV data for a stock/ETF on a specific date
 * using Yahoo Finance's v8 chart API with a cookie header to avoid 429s.
 *
 * Usage:
 *   bun run scripts/adapters/robinhood/historical.ts "TSLA" "2025-01-02"
 *   bun run scripts/adapters/robinhood/historical.ts "AAPL" "2025-01-02"
 *   bun run scripts/adapters/robinhood/historical.ts "SPY" "2024-12-25"
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface YahooChartResult {
  meta: {
    currency: string;
    symbol: string;
    regularMarketPrice?: number;
  };
  timestamp?: number[];
  indicators: {
    quote: Array<{
      open: (number | null)[];
      high: (number | null)[];
      low: (number | null)[];
      close: (number | null)[];
      volume: (number | null)[];
    }>;
    adjclose?: Array<{
      adjclose: (number | null)[];
    }>;
  };
}

interface YahooChartResponse {
  chart: {
    result: YahooChartResult[] | null;
    error: {
      code: string;
      description: string;
    } | null;
  };
}

interface HistoricalResult {
  ticker: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjusted_close: number;
  currency: string;
  source: "yahoo_finance";
  note?: string;
}

interface ErrorResult {
  error: string;
  ticker: string;
  date: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toUnixTimestamp(dateStr: string, endOfDay: boolean): number {
  const parts = dateStr.split("-").map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (endOfDay) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return Math.floor(d.getTime() / 1000);
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fail(err: ErrorResult): never {
  console.log(JSON.stringify(err, null, 2));
  process.exit(1);
}

function extractOHLCV(
  chart: YahooChartResult,
  idx: number
): { open: number; high: number; low: number; close: number; volume: number; adjusted_close: number } {
  const quote = chart.indicators.quote[0];
  if (!quote) {
    throw new Error("No quote data in chart response");
  }
  const adjcloseArr = chart.indicators.adjclose?.[0]?.adjclose;
  const closeVal = quote.close[idx] ?? 0;

  return {
    open: round2(quote.open[idx] ?? 0),
    high: round2(quote.high[idx] ?? 0),
    low: round2(quote.low[idx] ?? 0),
    close: round2(closeVal),
    volume: quote.volume[idx] ?? 0,
    adjusted_close: round2(adjcloseArr ? (adjcloseArr[idx] ?? closeVal) : closeVal),
  };
}

// ---------------------------------------------------------------------------
// Yahoo Finance chart API
// ---------------------------------------------------------------------------

async function fetchChart(
  ticker: string,
  period1: number,
  period2: number
): Promise<YahooChartResponse> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
    `?period1=${period1}&period2=${period2}&interval=1d`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Cookie: "A3=d=x",
    },
  });

  if (!res.ok) {
    throw new Error(`Yahoo Finance API returned ${res.status}: ${res.statusText}`);
  }

  return (await res.json()) as YahooChartResponse;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(
      "Usage: bun run scripts/adapters/robinhood/historical.ts <TICKER> <YYYY-MM-DD>"
    );
    console.error("Examples:");
    console.error(
      '  bun run scripts/adapters/robinhood/historical.ts "TSLA" "2025-01-02"'
    );
    console.error(
      '  bun run scripts/adapters/robinhood/historical.ts "AAPL" "2025-01-02"'
    );
    process.exit(1);
  }

  const tickerArg = args[0];
  const dateArg = args[1];
  if (!tickerArg || !dateArg) {
    console.error("Both ticker and date arguments are required.");
    process.exit(1);
  }

  const ticker = tickerArg.toUpperCase();
  const dateStr = dateArg;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    fail({
      error: `Invalid date format: "${dateStr}". Expected YYYY-MM-DD.`,
      ticker,
      date: dateStr,
    });
  }

  console.error(`\nLooking up ${ticker} on ${dateStr}...\n`);

  try {
    // First try: exact date range (start of day to next day)
    const period1 = toUnixTimestamp(dateStr, false);
    const period2 = toUnixTimestamp(dateStr, true);

    const data = await fetchChart(ticker, period1, period2);

    if (data.chart.error) {
      fail({
        error: data.chart.error.description || data.chart.error.code,
        ticker,
        date: dateStr,
      });
    }

    const result = data.chart.result;
    if (!result || result.length === 0) {
      fail({
        error: `No data returned for ${ticker}. Ticker may not exist.`,
        ticker,
        date: dateStr,
      });
    }

    const chart = result[0];
    if (!chart) {
      fail({ error: `Empty chart result for ${ticker}.`, ticker, date: dateStr });
    }

    // If no timestamps (weekend/holiday), widen the window to find closest prior trading day
    if (!chart.timestamp || chart.timestamp.length === 0) {
      console.error(
        `  No trading data on ${dateStr} (weekend/holiday). Searching for closest prior trading day...`
      );

      // Look back up to 10 days to find the last trading day
      const widenedPeriod1 = period1 - 10 * 86400;
      const widenedData = await fetchChart(ticker, widenedPeriod1, period2);

      if (
        widenedData.chart.error ||
        !widenedData.chart.result ||
        widenedData.chart.result.length === 0
      ) {
        fail({
          error: `No trading data found near ${dateStr} for ${ticker}.`,
          ticker,
          date: dateStr,
        });
      }

      const widenedChart = widenedData.chart.result[0];
      if (!widenedChart || !widenedChart.timestamp || widenedChart.timestamp.length === 0) {
        fail({
          error: `No trading data found within 10 days before ${dateStr} for ${ticker}.`,
          ticker,
          date: dateStr,
        });
      }

      // Use the last available trading day
      const lastIdx = widenedChart.timestamp.length - 1;
      const lastTimestamp = widenedChart.timestamp[lastIdx];
      if (lastTimestamp === undefined) {
        fail({
          error: `Unexpected empty timestamp array for ${ticker}.`,
          ticker,
          date: dateStr,
        });
      }

      const actualDate = formatDate(lastTimestamp);
      const note = `Closest trading day used: ${actualDate}`;
      console.error(`  Found: ${actualDate}\n`);

      const ohlcv = extractOHLCV(widenedChart, lastIdx);

      const output: HistoricalResult = {
        ticker,
        date: dateStr,
        ...ohlcv,
        currency: widenedChart.meta.currency || "USD",
        source: "yahoo_finance",
        note,
      };

      console.log(JSON.stringify(output, null, 2));
      return;
    }

    // Exact date match (or closest within the 1-day window)
    const idx = 0; // With a 1-day interval, there should be exactly one entry
    const firstTimestamp = chart.timestamp[idx];
    if (firstTimestamp === undefined) {
      fail({ error: `Unexpected empty timestamp for ${ticker}.`, ticker, date: dateStr });
    }

    const actualDate = formatDate(firstTimestamp);
    let note: string | undefined;
    if (actualDate !== dateStr) {
      note = `Closest trading day used: ${actualDate}`;
      console.error(`  Actual trading day: ${actualDate}\n`);
    } else {
      console.error(`  Found data for ${actualDate}\n`);
    }

    const ohlcv = extractOHLCV(chart, idx);

    const output: HistoricalResult = {
      ticker,
      date: dateStr,
      ...ohlcv,
      currency: chart.meta.currency || "USD",
      source: "yahoo_finance",
      ...(note ? { note } : {}),
    };

    console.error(
      `  ${ticker}: O=${output.open} H=${output.high} L=${output.low} C=${output.close} V=${output.volume}`
    );
    console.log(JSON.stringify(output, null, 2));
  } catch (err) {
    const error: ErrorResult = {
      error: (err as Error).message,
      ticker,
      date: dateStr,
    };
    console.log(JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

main();
