import React, { useState, useEffect, useCallback } from "react";
import type { Call, Source, Quote } from "../types";
import { CallCard } from "../components/CallCard";
import { useLivePrices } from "../hooks/useLivePrices";

interface SourceDetail {
  source: Source;
  calls: Call[];
  next_cursor: string | null;
  total: number;
  quotes: Quote[];
}

export function SourcePage({ id }: { id: string }) {
  const [data, setData] = useState<SourceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sources/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d.error ? null : d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const loadMore = useCallback(async () => {
    if (!data?.next_cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/sources/${id}?cursor=${data.next_cursor}`);
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
  }, [data?.next_cursor, loadingMore, id]);

  const livePrices = useLivePrices(data?.calls ?? []);

  if (loading) return <div className="text-center text-gray-400 py-8">Loading...</div>;
  if (!data) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Source not found</h2>
        <a href="#/" className="min-h-[44px] inline-flex items-center text-gray-600 hover:text-gray-900 active:text-gray-900 text-sm font-medium">&larr; Back to feed</a>
      </div>
    );
  }

  const { source, calls, quotes } = data;
  const uniqueAuthors = [...new Set(calls.map((c) => c.source_handle).filter(Boolean))];
  const uniqueTickers = [...new Set(calls.map((c) => c.ticker))];

  return (
    <div className="max-w-2xl mx-auto">
      <a href="#/" className="min-h-[44px] inline-flex items-center text-sm text-gray-500 hover:text-gray-700 active:text-gray-900 mb-3">&larr; Feed</a>

      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{source.title ?? "Untitled Source"}</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {source.platform && <span className="capitalize">{source.platform}</span>}
          {source.published_at && <span>| {new Date(source.published_at).toLocaleDateString()}</span>}
          {source.url && (
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:underline active:text-gray-900">
              View source &rarr;
            </a>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-4 mb-4 text-sm">
        <span className="text-gray-900 font-semibold">{data.total} calls generated</span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-600">{quotes.length} quotes extracted</span>
        {uniqueAuthors.length > 0 && (
          <>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600">
              {uniqueAuthors.map((a, i) => (
                <span key={a}>
                  {i > 0 && ", "}
                  <a href={`#/author/${a}`} className="hover:underline active:text-gray-900">@{a}</a>
                </span>
              ))}
            </span>
          </>
        )}
      </div>

      {quotes.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-5">
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Extracted Quotes</div>
          <div className="space-y-3">
            {quotes.map((q) => (
              <div key={q.id} className="border-l-2 border-gray-300 pl-3">
                <p className="text-sm text-gray-600 italic leading-relaxed">&ldquo;{q.text}&rdquo;</p>
                <div className="text-xs text-gray-400 mt-1">
                  {q.speaker && <a href={`#/author/${q.speaker}`} className="hover:underline active:text-gray-900">@{q.speaker}</a>}
                  {q.timestamp && <span> at {q.timestamp}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uniqueTickers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {uniqueTickers.map((t) => (
            <a key={t} href={`#/ticker/${t}`} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 active:bg-gray-300 transition-colors">{t}</a>
          ))}
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
