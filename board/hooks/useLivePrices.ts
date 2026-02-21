import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Call } from "../types";

export interface LivePriceData {
  currentPrice: number;
  changePercent: number;
  changeDollars: number;
}

interface ApiPriceResult {
  price: number;
  changePct: number;
  timestamp: number;
}

const POLL_INTERVAL_MS = 30_000;

/**
 * Fetches real prices from /api/prices for visible calls only (by ID).
 * Polls every 30s. No fake nudge between polls.
 */
export function useLivePrices(calls: Call[]): Map<string, LivePriceData> {
  const pricesRef = useRef<Map<string, number>>(new Map());
  const [tick, setTick] = useState(0);

  // Stable ID string for dependency tracking
  const callIds = useMemo(() => calls.map((c) => c.id).join(","), [calls]);

  // Initialize prices for new calls, remove stale
  useEffect(() => {
    const prices = pricesRef.current;
    const currentIds = new Set(calls.map((c) => c.id));
    for (const call of calls) {
      if (!prices.has(call.id)) {
        prices.set(call.id, call.entry_price);
      }
    }
    for (const [id] of prices) {
      if (!currentIds.has(id)) prices.delete(id);
    }
  }, [callIds]);

  const fetchRealPrices = useCallback(async () => {
    const ids = callIds.split(",").filter(Boolean);
    if (ids.length === 0) return;
    try {
      const res = await fetch(`/api/prices?ids=${ids.join(",")}`);
      if (!res.ok) return;
      const data = (await res.json()) as Record<string, ApiPriceResult>;
      const prices = pricesRef.current;
      let changed = false;
      for (const [callId, result] of Object.entries(data)) {
        if (result.price != null) {
          prices.set(callId, result.price);
          changed = true;
        }
      }
      if (changed) setTick((t) => t + 1);
    } catch {
      // Silently fail
    }
  }, [callIds]);

  // Fetch on mount + poll every 30s
  useEffect(() => {
    if (!callIds) return;
    fetchRealPrices();
    const poller = setInterval(fetchRealPrices, POLL_INTERVAL_MS);
    return () => clearInterval(poller);
  }, [fetchRealPrices, callIds]);

  // Build result map
  const result = new Map<string, LivePriceData>();
  for (const call of calls) {
    const currentPrice = pricesRef.current.get(call.id) ?? call.entry_price;
    const changeDollars = currentPrice - call.entry_price;
    const changePercent =
      call.entry_price !== 0
        ? ((currentPrice - call.entry_price) / call.entry_price) * 100
        : 0;
    result.set(call.id, { currentPrice, changePercent, changeDollars });
  }

  return result;
}
