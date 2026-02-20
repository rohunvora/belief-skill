import React, { useState, useEffect } from "react";
import type { Call, TickerEntity, Author } from "../types";
import { CallCard, Avatar } from "../components/CallCard";
import { useLivePrices } from "../hooks/useLivePrices";
import { getLogoUrl } from "../logos";

interface TickerDetail {
  ticker: TickerEntity;
  calls: Call[];
  directionBreakdown: { long: number; short: number };
  authorCoverage: Array<{ author: Author; callCount: number; directions: { long: number; short: number } }>;
}

export function TickerPage({ symbol }: { symbol: string }) {
  const [data, setData] = useState<TickerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tickers/${symbol}`)
      .then((r) => r.json())
      .then((d) => { setData(d.error ? null : d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  const livePrices = useLivePrices(data?.calls ?? []);

  if (loading) return <div className="text-center text-gray-400 py-8">Loading...</div>;
  if (!data) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Ticker not found</h2>
        <p className="text-gray-500 mb-6">No data for {symbol}</p>
        <a href="#/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">&larr; Back to feed</a>
      </div>
    );
  }

  const { ticker, calls, directionBreakdown, authorCoverage } = data;
  const logoUrl = getLogoUrl(ticker.symbol, ticker.platform, ticker.instrument_type === "perps" ? "perps" : null);
  const total = directionBreakdown.long + directionBreakdown.short;
  const longPct = total > 0 ? Math.round((directionBreakdown.long / total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <a href="#/" className="inline-block text-sm text-gray-500 hover:text-gray-700 mb-3">&larr; Feed</a>

      {/* Ticker header */}
      <div className="flex items-center gap-3 mb-4">
        {logoUrl && (
          <img src={logoUrl} alt={ticker.symbol} className="w-10 h-10 rounded-full object-contain bg-white border border-gray-200" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ticker.symbol}</h1>
          {ticker.name && <p className="text-sm text-gray-500">{ticker.name}</p>}
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
            <span className="capitalize">{ticker.instrument_type}</span>
            {ticker.platform && <span>| {ticker.platform}</span>}
            {ticker.sector && <span>| {ticker.sector}</span>}
            {ticker.expires_at && <span>| Expires {new Date(ticker.expires_at).toLocaleDateString()}</span>}
          </div>
        </div>
      </div>

      {/* Direction breakdown */}
      <div className="mb-4">
        <div className="flex items-center gap-3 text-sm mb-2">
          <span className="text-gray-900 font-semibold">{calls.length} calls</span>
          <span className="text-gray-300">|</span>
          <span className="text-green-600 font-medium">{directionBreakdown.long} long</span>
          <span className="text-red-600 font-medium">{directionBreakdown.short} short</span>
        </div>
        {total > 0 && (
          <div className="w-full h-2 bg-red-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-400 rounded-full" style={{ width: `${longPct}%` }} />
          </div>
        )}
      </div>

      {/* Author coverage: who covers this ticker and their stance */}
      {authorCoverage && authorCoverage.length > 0 && (
        <div className="mb-5">
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Coverage</div>
          <div className="space-y-1.5">
            {authorCoverage.map(({ author, callCount, directions }) => (
              <a
                key={author.id}
                href={`#/author/${author.handle}`}
                className="flex items-center justify-between hover:bg-gray-50 rounded px-2 py-1.5 -mx-2 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Avatar handle={author.handle} size="sm" />
                  <span className="text-sm font-medium text-gray-900">@{author.handle}</span>
                </span>
                <span className="flex items-center gap-2 text-xs">
                  {directions.long > 0 && <span className="text-green-600">{"\u25B2"} {directions.long}</span>}
                  {directions.short > 0 && <span className="text-red-600">{"\u25BC"} {directions.short}</span>}
                  <span className="text-gray-400">{callCount} call{callCount !== 1 ? "s" : ""}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Source links: compact list of sources mentioning this ticker */}
      {(() => {
        const sourceIds = [...new Set(calls.map((c) => c.source_id).filter(Boolean))];
        if (sourceIds.length === 0) return null;
        return (
          <div className="flex flex-wrap gap-2 mb-5">
            {sourceIds.slice(0, 8).map((sid) => {
              const call = calls.find((c) => c.source_id === sid);
              const label = call?.scan_source ?? call?.source_url?.replace(/https?:\/\/(www\.)?/, "").slice(0, 30) ?? "Source";
              return (
                <a
                  key={sid}
                  href={`#/source/${sid}`}
                  className="text-xs px-2 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                >
                  {label}
                </a>
              );
            })}
          </div>
        );
      })()}

      {/* Prediction market details */}
      {ticker.underlying_event && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-5 text-sm text-blue-800">
          {ticker.underlying_event}
        </div>
      )}

      {/* Calls */}
      <div className="divide-y divide-gray-100">
        {calls.map((call) => (
          <CallCard
            key={call.id}
            call={call}
            livePrice={livePrices.get(call.id)}
            onClick={() => { window.location.hash = `/call/${call.id}`; }}
          />
        ))}
      </div>
    </div>
  );
}
