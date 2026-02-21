import React, { useState, useEffect, useCallback } from "react";
import type { Call, TickerEntity, Author } from "../types";
import { CallCard, Avatar } from "../components/CallCard";
import { useLivePrices } from "../hooks/useLivePrices";
import { getLogoUrl } from "../logos";

interface TickerDetail {
  ticker: TickerEntity;
  calls: Call[];
  next_cursor: string | null;
  total: number;
  directionBreakdown: { long: number; short: number };
  authorCoverage: Array<{ author: Author; callCount: number; directions: { long: number; short: number } }>;
}

export function TickerPage({ symbol }: { symbol: string }) {
  const [data, setData] = useState<TickerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tickers/${symbol}`)
      .then((r) => r.json())
      .then((d) => { setData(d.error ? null : d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  const loadMore = useCallback(async () => {
    if (!data?.next_cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/tickers/${symbol}?cursor=${data.next_cursor}`);
      const d = await res.json();
      if (!d.error) {
        setData((prev) => prev ? {
          ...prev,
          calls: [...prev.calls, ...d.calls],
          next_cursor: d.next_cursor,
        } : prev);
      }
    } catch {}
    setLoadingMore(false);
  }, [data?.next_cursor, loadingMore, symbol]);

  const livePrices = useLivePrices(data?.calls ?? []);

  if (loading) return <div className="text-center text-gray-400 py-8">Loading...</div>;
  if (!data) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Ticker not found</h2>
        <p className="text-gray-500 mb-6">No data for {symbol}</p>
        <a href="#/" className="min-h-[44px] inline-flex items-center text-gray-600 hover:text-gray-900 active:text-gray-900 text-sm font-medium">&larr; Back to feed</a>
      </div>
    );
  }

  const { ticker, calls, directionBreakdown, authorCoverage } = data;
  const logoUrl = getLogoUrl(ticker.symbol, ticker.platform, ticker.instrument_type === "perps" ? "perps" : null);
  const total = directionBreakdown.long + directionBreakdown.short;
  const longPct = total > 0 ? Math.round((directionBreakdown.long / total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <a href="#/" className="min-h-[44px] inline-flex items-center text-sm text-gray-500 hover:text-gray-700 active:text-gray-900 mb-3">&larr; Feed</a>

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

      <div className="mb-4">
        <div className="flex items-center gap-3 text-sm mb-2">
          <span className="text-gray-900 font-semibold">{data.total} calls</span>
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

      {authorCoverage && authorCoverage.length > 0 && (
        <div className="mb-5">
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Coverage</div>
          <div className="space-y-1.5">
            {authorCoverage.map(({ author, callCount, directions }) => (
              <a key={author.id} href={`#/author/${author.handle}`} className="flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 rounded px-3 py-3 min-h-[48px] -mx-3 transition-colors">
                <span className="flex items-center gap-2">
                  <Avatar handle={author.handle} avatarUrl={author.avatar_url} size="sm" />
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

      {(() => {
        const sourceIds = [...new Set(calls.map((c) => c.source_id).filter(Boolean))];
        if (sourceIds.length === 0) return null;
        return (
          <div className="flex flex-wrap gap-2 mb-5">
            {sourceIds.slice(0, 8).map((sid) => {
              const call = calls.find((c) => c.source_id === sid);
              const label = call?.scan_source ?? call?.source_url?.replace(/https?:\/\/(www\.)?/, "").slice(0, 30) ?? "Source";
              return (
                <a key={sid} href={`#/source/${sid}`} className="text-xs px-2 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded hover:bg-gray-100 active:bg-gray-200 transition-colors">
                  {label}
                </a>
              );
            })}
          </div>
        );
      })()}

      {ticker.underlying_event && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-5 text-sm text-blue-800">
          {ticker.underlying_event}
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {calls.map((call) => (
          <CallCard key={call.id} call={call} livePrice={livePrices.get(call.id)} onClick={() => { window.location.hash = `/call/${call.id}`; }} />
        ))}
      </div>
      {data.next_cursor && (
        <button onClick={loadMore} disabled={loadingMore} className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 active:text-gray-900 transition-colors">
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
