import React, { useState, useEffect, useMemo } from "react";
import type { Call } from "../types";
import { CallCard } from "../components/CallCard";
import { useLivePrices } from "../hooks/useLivePrices";

/** A group of calls sharing the same scan_source, or a standalone call */
type FeedItem =
  | { type: "standalone"; call: Call }
  | { type: "group"; source: string; date: string; calls: Call[] };

function formatGroupDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SourceGroup({
  source,
  date,
  calls,
  livePrices,
}: {
  source: string;
  date: string;
  calls: Call[];
  livePrices: Map<string, any>;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3">
      {/* Group header */}
      <div className="text-[13px] font-medium text-gray-500 mb-2 pb-2 border-b border-gray-100">
        {source} · {formatGroupDate(date)} · {calls.length} trade{calls.length !== 1 ? "s" : ""}
      </div>
      {/* Compact sub-cards */}
      <div className="divide-y divide-dashed divide-gray-100">
        {calls.map((call) => (
          <CallCard
            key={call.id}
            call={call}
            onClick={() => { window.location.hash = `/call/${call.id}`; }}
            livePrice={livePrices.get(call.id)}
            compact
          />
        ))}
      </div>
    </div>
  );
}

export function CallList() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/takes?limit=50")
      .then((r) => r.json())
      .then((data) => {
        setCalls(data.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const livePrices = useLivePrices(calls);

  // Group calls by scan_source (client-side)
  const feedItems = useMemo<FeedItem[]>(() => {
    // Collect calls into groups by scan_source
    const groups = new Map<string, Call[]>();
    const ungrouped: Call[] = [];

    for (const call of calls) {
      if (call.scan_source) {
        const existing = groups.get(call.scan_source);
        if (existing) {
          existing.push(call);
        } else {
          groups.set(call.scan_source, [call]);
        }
      } else {
        ungrouped.push(call);
      }
    }

    // Build feed items, preserving timeline order.
    // Each group appears at the position of its newest call.
    const seen = new Set<string>();
    const items: FeedItem[] = [];

    for (const call of calls) {
      if (call.scan_source && groups.has(call.scan_source)) {
        const groupCalls = groups.get(call.scan_source)!;
        if (groupCalls.length >= 2 && !seen.has(call.scan_source)) {
          // First encounter of this group — emit the group here
          seen.add(call.scan_source);
          const newestDate = groupCalls[0].source_date ?? groupCalls[0].created_at;
          items.push({ type: "group", source: call.scan_source, date: newestDate, calls: groupCalls });
        } else if (groupCalls.length < 2) {
          // Only 1 call with this source — render standalone
          items.push({ type: "standalone", call });
        }
        // Skip subsequent calls in a group (already emitted)
      } else {
        items.push({ type: "standalone", call });
      }
    }

    return items;
  }, [calls]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center text-gray-500 py-8">
        Loading...
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">No calls yet</h2>
        <p className="text-sm text-gray-500">Route a belief through the skill to see it here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-1 divide-y divide-gray-100">
        {feedItems.map((item) => {
          if (item.type === "group") {
            return (
              <SourceGroup
                key={`group-${item.source}`}
                source={item.source}
                date={item.date}
                calls={item.calls}
                livePrices={livePrices}
              />
            );
          }
          return (
            <CallCard
              key={item.call.id}
              call={item.call}
              onClick={() => { window.location.hash = `/call/${item.call.id}`; }}
              livePrice={livePrices.get(item.call.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
