import React, { useState, useEffect } from "react";
import { CallCard } from "../components/CallCard";
import { useLivePrices } from "../hooks/useLivePrices";
import { useWatchlist } from "../hooks/useWatchlist";
import type { Call } from "../types";

export function Watchlist() {
  const { starredIds, count, toggle, isStarred } = useWatchlist();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (starredIds.length === 0) {
      setCalls([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/takes/batch?ids=${starredIds.join(",")}`)
      .then((r) => r.json())
      .then((data) => {
        setCalls(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [starredIds.join(",")]);

  const livePrices = useLivePrices(calls);

  return (
    <div className="max-w-2xl mx-auto">
      <a href="#/" className="min-h-[44px] inline-flex items-center text-sm text-gray-500 hover:text-gray-700 active:text-gray-900 mb-3">&larr; Feed</a>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Watchlist</h1>
      <p className="text-sm text-gray-500 mb-4">{count} starred call{count !== 1 ? "s" : ""}</p>

      {loading && <div className="text-center text-gray-400 py-8">Loading...</div>}

      {!loading && calls.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-2">No starred calls yet.</p>
          <p className="text-sm text-gray-400">Tap the star on any call to add it here.</p>
        </div>
      )}

      {!loading && calls.length > 0 && (
        <div className="divide-y divide-gray-200">
          {calls.map((call) => (
            <CallCard
              key={call.id}
              call={call}
              livePrice={livePrices.get(call.id)}
              onClick={() => { window.location.hash = `/call/${call.id}`; }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
