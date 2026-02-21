import React, { useState, useEffect, useCallback } from "react";
import type { Call, Author, Source } from "../types";
import { CallCard, Avatar } from "../components/CallCard";
import { useLivePrices } from "../hooks/useLivePrices";

interface AuthorDetail {
  author: Author;
  calls: Call[];
  next_cursor: string | null;
  total: number;
  tickerCounts: Record<string, number>;
  tickerDirections: Record<string, { long: number; short: number }>;
  sources: Array<{ source: Source; callCount: number }>;
}

export function AuthorPage({ handle }: { handle: string }) {
  const [data, setData] = useState<AuthorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/authors/${handle}`)
      .then((r) => r.json())
      .then((d) => { setData(d.error ? null : d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [handle]);

  const loadMore = useCallback(async () => {
    if (!data?.next_cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/authors/${handle}?cursor=${data.next_cursor}`);
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
  }, [data?.next_cursor, loadingMore, handle]);

  const livePrices = useLivePrices(data?.calls ?? []);

  if (loading) return <div className="text-center text-gray-400 py-8">Loading...</div>;
  if (!data) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Author not found</h2>
        <p className="text-gray-500 mb-6">No profile for @{handle}</p>
        <a href="#/" className="min-h-[44px] inline-flex items-center text-gray-600 hover:text-gray-900 active:text-gray-900 text-sm font-medium">&larr; Back to feed</a>
      </div>
    );
  }

  const { author, calls, tickerCounts, tickerDirections, sources } = data;
  const sortedTickers = Object.entries(tickerCounts).sort((a, b) => b[1] - a[1]);
  const uniqueSourceIds = [...new Set(calls.map((c) => c.source_id).filter(Boolean))];

  return (
    <div className="max-w-2xl mx-auto">
      <a href="#/" className="min-h-[44px] inline-flex items-center text-sm text-gray-500 hover:text-gray-700 active:text-gray-900 mb-3">&larr; Feed</a>

      <div className="flex items-start gap-3 mb-4">
        <Avatar handle={handle} avatarUrl={author.avatar_url} size="lg" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">@{author.handle}</h1>
          {author.bio && <p className="text-sm text-gray-500 mt-0.5">{author.bio}</p>}
          <div className="flex items-center gap-2 mt-1">
            {author.twitter_url && (
              <a href={author.twitter_url} target="_blank" rel="noopener noreferrer" className="p-2 -m-2 text-gray-400 hover:text-gray-600 active:scale-90 active:opacity-70">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
            {author.youtube_url && (
              <a href={author.youtube_url} target="_blank" rel="noopener noreferrer" className="p-2 -m-2 text-gray-400 hover:text-gray-600 active:scale-90 active:opacity-70">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#FF0000">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/>
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-baseline gap-4 mb-4 text-sm">
        <span className="text-gray-900 font-semibold">{data.total} calls routed</span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-600">{sortedTickers.length} tickers</span>
        {uniqueSourceIds.length > 0 && (
          <>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600">{uniqueSourceIds.length} sources</span>
          </>
        )}
      </div>

      {sortedTickers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {sortedTickers.map(([ticker, count]) => {
            const dirs = tickerDirections?.[ticker];
            const hasLong = dirs && dirs.long > 0;
            const hasShort = dirs && dirs.short > 0;
            return (
              <a key={ticker} href={`#/ticker/${ticker}`} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 active:bg-gray-300 transition-colors inline-flex items-center gap-1">
                {ticker}
                {hasLong && <span className="text-green-600">{"\u25B2"}{dirs.long > 1 ? dirs.long : ""}</span>}
                {hasShort && <span className="text-red-600">{"\u25BC"}{dirs.short > 1 ? dirs.short : ""}</span>}
                {!hasLong && !hasShort && <span>({count})</span>}
              </a>
            );
          })}
        </div>
      )}

      {sources && sources.length > 0 && (
        <div className="mb-5">
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Sources</div>
          <div className="space-y-1.5">
            {sources.map(({ source, callCount }) => (
              <a key={source.id} href={`#/source/${source.id}`} className="flex items-center justify-between text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded px-3 py-3 min-h-[48px] -mx-3 transition-colors">
                <span className="flex items-center gap-2 min-w-0">
                  {source.platform && <span className="text-[11px] text-gray-400 capitalize shrink-0">{source.platform}</span>}
                  <span className="truncate">{source.title ?? source.url ?? "Untitled source"}</span>
                </span>
                <span className="text-xs text-gray-400 shrink-0 ml-2">{callCount} call{callCount !== 1 ? "s" : ""}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {calls.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No calls yet.</p>
        ) : (
          calls.map((call) => (
            <CallCard key={call.id} call={call} livePrice={livePrices.get(call.id)} onClick={() => { window.location.hash = `/call/${call.id}`; }} />
          ))
        )}
      </div>
      {data.next_cursor && (
        <button onClick={loadMore} disabled={loadingMore} className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 active:text-gray-900 transition-colors">
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
