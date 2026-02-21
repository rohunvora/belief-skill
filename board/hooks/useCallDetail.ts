import { useState, useEffect } from "react";
import type { FeedCall } from "./useFeed";

interface CallDetailState {
  call: FeedCall | null;
  loading: boolean;
}

export function useCallDetail(id: string): CallDetailState {
  const [call, setCall] = useState<FeedCall | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setCall(null);
    fetch(`/api/takes/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        setCall(data.error ? null : data);
      })
      .catch(() => {
        setCall(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  return { call, loading };
}
