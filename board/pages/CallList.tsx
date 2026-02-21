import React, { useState, useEffect } from "react";
import type { Call } from "../types";
import { CallCard } from "../components/CallCard";
import { useLivePrices } from "../hooks/useLivePrices";

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
      <div className="divide-y divide-gray-100">
        {calls.map((call) => (
          <CallCard
            key={call.id}
            call={call}
            onClick={() => { window.location.hash = `/call/${call.id}`; }}
            livePrice={livePrices.get(call.id)}
          />
        ))}
      </div>
    </div>
  );
}
