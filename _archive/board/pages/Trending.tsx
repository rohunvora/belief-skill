import React, { useState, useEffect } from "react";
import { Avatar } from "../components/CallCard";

interface TrendingTicker {
  ticker: string;
  ticker_id: string | null;
  call_count: number;
  author_count: number;
  authors: Array<{ handle: string; avatar_url: string | null; direction: string }>;
  latest_thesis: string;
  latest_time: string;
}

export function Trending() {
  const [data, setData] = useState<TrendingTicker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trending?days=7&limit=20")
      .then((r) => r.json())
      .then((d) => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-gray-400 py-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <a href="#/" className="min-h-[44px] inline-flex items-center text-sm text-gray-500 hover:text-gray-700 active:text-gray-900 mb-3">&larr; Feed</a>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Trending</h1>
      <p className="text-sm text-gray-500 mb-6">Tickers with multiple authors calling in the last 7 days.</p>

      {data.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500">No convergence yet.</p>
          <p className="text-sm text-gray-400 mt-1">When multiple authors call the same ticker, it shows up here.</p>
        </div>
      )}

      <div className="space-y-6">
        {data.map((item) => (
          <div key={item.ticker} className="border border-gray-200 rounded-lg bg-white p-4 active:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <a href={`#/ticker/${item.ticker}`} className="text-lg font-bold text-gray-900 hover:underline active:text-gray-900">
                {item.ticker}
              </a>
              <span className="text-xs text-gray-400">{item.call_count} calls &middot; {item.author_count} authors</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              {item.authors.map((author) => (
                <a
                  key={author.handle}
                  href={`#/author/${author.handle}`}
                  className="inline-flex items-center gap-1.5 text-sm hover:bg-gray-50 active:bg-gray-100 rounded px-1.5 py-0.5 transition-colors"
                >
                  <Avatar handle={author.handle} avatarUrl={author.avatar_url} size="sm" />
                  <span className="text-gray-700 font-medium">@{author.handle}</span>
                  <span className={`text-xs font-semibold ${author.direction === "long" ? "text-green-600" : "text-red-600"}`}>
                    {author.direction === "long" ? "\u25B2" : "\u25BC"}
                  </span>
                </a>
              ))}
            </div>

            {item.latest_thesis && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.latest_thesis}</p>
            )}

            <a href={`#/ticker/${item.ticker}`} className="text-xs text-gray-400 hover:text-gray-600 active:text-gray-900 transition-colors">
              View all {item.ticker} calls &rarr;
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
