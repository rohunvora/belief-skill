import React, { useState, useMemo } from "react";
import type { Call } from "../types";
import { CallCard } from "../components/CallCard";
import { useLivePrices } from "../hooks/useLivePrices";
import { useBoardData } from "../hooks/useData";
import { formatWatchers } from "../utils";

type Tab = "hot" | "new" | "resolved";

export function Feed() {
  const [activeTab, setActiveTab] = useState<Tab>("hot");
  const { calls, loading } = useBoardData();
  const livePrices = useLivePrices(calls);

  const activeCalls = useMemo(
    () => calls.filter((c) => c.status === "active"),
    [calls]
  );
  const resolvedCalls = useMemo(
    () => calls.filter((c) => c.status !== "active"),
    [calls]
  );
  const totalWatchers = useMemo(
    () => calls.reduce((s, c) => s + c.watchers, 0),
    [calls]
  );

  const filteredCalls = useMemo(() => {
    switch (activeTab) {
      case "hot":
        return [...activeCalls].sort((a, b) => b.watchers - a.watchers);
      case "new":
        return [...activeCalls].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
      case "resolved":
        return resolvedCalls;
    }
  }, [activeTab, activeCalls, resolvedCalls]);

  if (loading)
    return (
      <div className="text-center text-gray-400 py-8">Loading...</div>
    );

  const tabs: { key: Tab; label: string }[] = [
    { key: "hot", label: `Hot (${activeCalls.length})` },
    { key: "new", label: "New" },
    { key: "resolved", label: `Resolved (${resolvedCalls.length})` },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Summary line — context for any screenshot */}
      <div className="text-xs text-gray-500 mb-3">
        {calls.length} calls · {formatWatchers(totalWatchers)} watching
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors -mb-px ${
              activeTab === tab.key
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Card list */}
      <div className="flex flex-col gap-3">
        {filteredCalls.map((call) => (
          <CallCard
            key={call.id}
            call={call}
            livePrice={livePrices.get(call.id)}
            onClick={() => {
              window.location.hash = `/call/${call.id}`;
            }}
          />
        ))}
        {filteredCalls.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">
            No calls to show.
          </p>
        )}
      </div>
    </div>
  );
}
