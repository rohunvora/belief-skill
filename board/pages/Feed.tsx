import React, { useState, useEffect, useRef } from "react";
import { CallCard } from "../components/CallCard";
import { useLivePrices } from "../hooks/useLivePrices";
import { useFeed } from "../hooks/useFeed";
import { useWatchlist } from "../hooks/useWatchlist";
import { TrendingBanner } from "../components/TrendingBanner";
import type { Call } from "../types";

type FeedTab = "new" | "watched";

function WatchedFeed() {
  const { starredIds, count } = useWatchlist();
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

  if (loading) return <div className="text-center text-gray-400 py-8">Loading...</div>;

  if (calls.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-2">No tracked calls yet.</p>
        <p className="text-sm text-gray-400">Tap the star on any call to track it here.</p>
      </div>
    );
  }

  return (
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
  );
}

export function Feed() {
  const [tab, setTab] = useState<FeedTab>("new");
  const { count: watchCount } = useWatchlist();
  const { calls, loading, loadingMore, hasMore, loadMore } = useFeed();
  const livePrices = useLivePrices(calls);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (tab !== "new") return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [tab, hasMore, loadingMore, loadMore]);

  if (loading && tab === "new")
    return (
      <div className="text-center text-gray-400 py-8">Loading...</div>
    );

  const tabClass = (t: FeedTab) =>
    `pb-2 text-sm font-medium transition-colors active:opacity-70 ${
      tab === t
        ? "border-b-2 border-gray-900 text-gray-900"
        : "text-gray-400 hover:text-gray-600"
    }`;

  return (
    <div className="max-w-2xl mx-auto">
      <TrendingBanner />

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-4">
        <button className={tabClass("new")} onClick={() => setTab("new")}>
          New
        </button>
        <button className={tabClass("watched")} onClick={() => setTab("watched")}>
          Watched{watchCount > 0 ? ` (${watchCount})` : ""}
        </button>
      </div>

      {tab === "watched" ? (
        <WatchedFeed />
      ) : (
        <>
          {/* Card list */}
          <div className="divide-y divide-gray-200">
            {calls.map((call) => (
              <CallCard
                key={call.id}
                call={call}
                livePrice={livePrices.get(call.id)}
                onClick={() => {
                  window.location.hash = `/call/${call.id}`;
                }}
              />
            ))}
            {calls.length === 0 && !loading && (
              <p className="text-gray-500 text-sm text-center py-8">
                No calls to show.
              </p>
            )}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-px" />
          {loadingMore && (
            <div className="text-center text-gray-400 py-4 text-sm">Loading more...</div>
          )}
        </>
      )}
    </div>
  );
}
