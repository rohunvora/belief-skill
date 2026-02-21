import React, { useState, useEffect, useCallback } from "react";
import type { Call, Author, User } from "../types";
import { CallCard, Avatar } from "../components/CallCard";
import { useLivePrices } from "../hooks/useLivePrices";

interface SubmitterProfile {
  user: User;
  calls: Call[];
  next_cursor: string | null;
  total: number;
  authorsSurfaced: Array<{ author: Author; callCount: number }>;
  tickersCovered: Array<{ symbol: string; count: number; directions: { long: number; short: number } }>;
}

export function Profile({ handle }: { handle: string }) {
  const [data, setData] = useState<SubmitterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/profile/${handle}`)
      .then((r) => r.json())
      .then((d) => { setData(d.error ? null : d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [handle]);

  const loadMore = useCallback(async () => {
    if (!data?.next_cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/profile/${handle}?cursor=${data.next_cursor}`);
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
        <h2 className="text-xl font-semibold text-gray-900 mb-2">User not found</h2>
        <p className="text-gray-500 mb-6">No profile for @{handle}</p>
        <a href="#/" className="min-h-[44px] inline-flex items-center text-gray-600 hover:text-gray-900 active:text-gray-900 text-sm font-medium">&larr; Back to feed</a>
      </div>
    );
  }

  const { user, calls, authorsSurfaced, tickersCovered } = data;

  return (
    <div className="max-w-2xl mx-auto">
      <a href="#/" className="min-h-[44px] inline-flex items-center text-sm text-gray-500 hover:text-gray-700 active:text-gray-900 mb-3">&larr; Feed</a>

      <div className="flex items-start gap-3 mb-4">
        <Avatar handle={handle} avatarUrl={user.avatar_url} size="lg" />
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-bold text-gray-900">@{user.handle}</h1>
            {user.verified && (
              <svg className="w-5 h-5 text-gray-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          {user.bio && <p className="text-sm text-gray-500 mt-0.5">{user.bio}</p>}
          {user.twitter && (
            <a href={`https://x.com/${user.twitter}`} target="_blank" rel="noopener noreferrer" className="p-2 -m-2 text-gray-400 hover:text-gray-600 active:scale-90 active:opacity-70 mt-1 inline-block">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-4 mb-4 text-sm">
        <span className="text-gray-900 font-semibold">{data.total} calls submitted</span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-600">{authorsSurfaced.length} authors surfaced</span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-600">{tickersCovered.length} tickers</span>
      </div>

      {authorsSurfaced.length > 0 && (
        <div className="mb-5">
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Authors Surfaced</div>
          <div className="space-y-1.5">
            {authorsSurfaced.map(({ author, callCount }) => (
              <a key={author.id} href={`#/author/${author.handle}`} className="flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 rounded px-3 py-3 min-h-[48px] -mx-3 transition-colors">
                <span className="flex items-center gap-2">
                  <Avatar handle={author.handle} avatarUrl={author.avatar_url} size="sm" />
                  <span className="text-sm font-medium text-gray-900">@{author.handle}</span>
                </span>
                <span className="text-xs text-gray-400">{callCount} call{callCount !== 1 ? "s" : ""}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {tickersCovered.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tickersCovered.map(({ symbol, count, directions }) => (
            <a key={symbol} href={`#/ticker/${symbol}`} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 active:bg-gray-300 transition-colors inline-flex items-center gap-1">
              {symbol}
              {directions.long > 0 && <span className="text-green-600">{"\u25B2"}{directions.long > 1 ? directions.long : ""}</span>}
              {directions.short > 0 && <span className="text-red-600">{"\u25BC"}{directions.short > 1 ? directions.short : ""}</span>}
              {directions.long === 0 && directions.short === 0 && <span>({count})</span>}
            </a>
          ))}
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
