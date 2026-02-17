import React, { useState, useMemo } from "react";
import type { Call } from "../types";
import { calls } from "../mock-data";
import { CallCard } from "../components/CallCard";
import { useLivePrices } from "../hooks/useLivePrices";

type Tab = "hot" | "new" | "resolved";

export function Feed() {
  const [activeTab, setActiveTab] = useState<Tab>("hot");
  const livePrices = useLivePrices(calls);

  const filteredCalls = useMemo(() => {
    let result: Call[];

    switch (activeTab) {
      case "hot":
        result = calls
          .filter((c) => c.status === "active")
          .sort((a, b) => b.watchers - a.watchers);
        break;
      case "new":
        result = calls
          .filter((c) => c.status === "active")
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
        break;
      case "resolved":
        result = calls.filter((c) => c.status !== "active");
        break;
    }

    return result;
  }, [activeTab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "hot", label: "Hot" },
    { key: "new", label: "New" },
    { key: "resolved", label: "Resolved" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
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
          <p className="text-gray-400 text-sm text-center py-8">
            No calls to show.
          </p>
        )}
      </div>
    </div>
  );
}
