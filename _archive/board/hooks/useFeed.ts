import { useState, useEffect, useCallback, useRef } from "react";
import type { Call } from "../types";

export interface FeedCall extends Call {
  caller_handle?: string | null;
  caller_avatar_url?: string | null;
  author_avatar_url?: string | null;
}

interface FeedState {
  calls: FeedCall[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  total: number;
  loadMore: () => void;
  refetch: () => void;
}

interface FeedParams {
  authorId?: string;
  tickerId?: string;
  ticker?: string;
  direction?: string;
  limit?: number;
}

export function useFeed(params: FeedParams = {}): FeedState {
  const [calls, setCalls] = useState<FeedCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const cursorRef = useRef<string | null>(null);
  const limit = params.limit ?? 20;

  const buildUrl = useCallback(
    (cursor?: string | null) => {
      const sp = new URLSearchParams();
      sp.set("limit", String(limit));
      if (cursor) sp.set("cursor", cursor);
      if (params.authorId) sp.set("authorId", params.authorId);
      if (params.tickerId) sp.set("tickerId", params.tickerId);
      if (params.ticker) sp.set("ticker", params.ticker);
      if (params.direction) sp.set("direction", params.direction);
      return `/api/takes?${sp.toString()}`;
    },
    [limit, params.authorId, params.tickerId, params.ticker, params.direction]
  );

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(buildUrl());
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setCalls(data.items);
      cursorRef.current = data.next_cursor;
      setHasMore(data.next_cursor != null);
      setTotal(data.total);
    } catch (err) {
      console.error("useFeed fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !cursorRef.current) return;
    setLoadingMore(true);
    try {
      const res = await fetch(buildUrl(cursorRef.current));
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setCalls((prev) => [...prev, ...data.items]);
      cursorRef.current = data.next_cursor;
      setHasMore(data.next_cursor != null);
    } catch (err) {
      console.error("useFeed loadMore error:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, buildUrl]);

  return { calls, loading, loadingMore, hasMore, total, loadMore, refetch: fetchInitial };
}
