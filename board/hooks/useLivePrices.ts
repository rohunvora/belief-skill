import { useState, useEffect, useRef, useCallback } from "react";
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
const NUDGE_INTERVAL_MS = 3_000;

/**
 * Fetches real prices from /api/prices for all calls passed in, then random-walks between polls.
 * On mount: fetch immediately. Poll every 30s. Between polls, nudge ±0.05%.
 * When new real data arrives, snap to it.
 */
export function useLivePrices(
  calls: Call[],
  intervalMs: number = NUDGE_INTERVAL_MS
): Map<string, LivePriceData> {
  const pricesRef = useRef<Map<string, number>>(new Map());
  const [tick, setTick] = useState(0);

  // Initialize prices for new calls
  for (const call of calls) {
    if (!pricesRef.current.has(call.id)) {
      pricesRef.current.set(call.id, call.entry_price);
    }
  }

  // Remove prices for calls no longer in the list
  for (const [id] of pricesRef.current) {
    if (!calls.find((c) => c.id === id)) {
      pricesRef.current.delete(id);
    }
  }

  // Fetch real prices from API and snap to them
  const fetchRealPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/prices");
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
      // Silently fail — nudge continues from last known price
    }
  }, []);

  // Fetch on mount + poll every 30s
  useEffect(() => {
    fetchRealPrices();
    const poller = setInterval(fetchRealPrices, POLL_INTERVAL_MS);
    return () => clearInterval(poller);
  }, [fetchRealPrices]);

  // Small random walk between polls for visual continuity
  const nudgePrices = useCallback(() => {
    const prices = pricesRef.current;
    let changed = false;

    for (const call of calls) {
      const current = prices.get(call.id);
      if (current == null) continue;

      // Tiny nudge: ±0.05%
      const magnitude = 0.0005;
      const direction = Math.random() > 0.5 ? 1 : -1;
      const nudge = current * magnitude * direction;
      const newPrice = Math.max(current + nudge, 0.01);

      prices.set(call.id, newPrice);
      changed = true;
    }

    if (changed) setTick((t) => t + 1);
  }, [calls.map((c) => c.id).join(",")]);

  useEffect(() => {
    if (calls.length === 0) return;
    const timer = setInterval(nudgePrices, intervalMs);
    return () => clearInterval(timer);
  }, [nudgePrices, intervalMs, calls.length]);

  // Build the result map
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
