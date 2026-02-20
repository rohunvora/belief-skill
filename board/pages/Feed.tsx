import React, { useMemo } from "react";
import { CallCard } from "../components/CallCard";
import { useLivePrices } from "../hooks/useLivePrices";
import { useBoardData } from "../hooks/useData";
import { formatWatchers } from "../utils";

export function Feed() {
  const { calls, loading } = useBoardData();
  const livePrices = useLivePrices(calls);

  // Single chronological list, newest first by source_date (fallback to created_at)
  const sortedCalls = useMemo(
    () =>
      [...calls].sort((a, b) => {
        const dateA = a.source_date ?? a.created_at;
        const dateB = b.source_date ?? b.created_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }),
    [calls]
  );

  const totalWatchers = useMemo(
    () => calls.reduce((s, c) => s + c.watchers, 0),
    [calls]
  );

  if (loading)
    return (
      <div className="text-center text-gray-400 py-8">Loading...</div>
    );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Summary line */}
      <div className="text-xs text-gray-500 mb-5">
        {calls.length} calls · {formatWatchers(totalWatchers)} watching
      </div>

      {/* Card list — chronological, no tabs */}
      <div className="divide-y divide-gray-100">
        {sortedCalls.map((call) => (
          <CallCard
            key={call.id}
            call={call}
            livePrice={livePrices.get(call.id)}
            onClick={() => {
              window.location.hash = `/call/${call.id}`;
            }}
          />
        ))}
        {sortedCalls.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">
            No calls to show.
          </p>
        )}
      </div>
    </div>
  );
}
