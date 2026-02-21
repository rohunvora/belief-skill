import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "belief_board_watchlist";

type WatchlistStore = Record<string, number>; // callId -> timestamp

function getStore(): WatchlistStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStore(store: WatchlistStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  // Dispatch storage event for cross-tab sync
  window.dispatchEvent(new Event("watchlist-changed"));
}

// External store for useSyncExternalStore
let snapshot = getStore();
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      snapshot = getStore();
      cb();
    }
  };
  const onLocal = () => {
    snapshot = getStore();
    cb();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("watchlist-changed", onLocal);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("watchlist-changed", onLocal);
  };
}

function getSnapshot(): WatchlistStore {
  return snapshot;
}

export function useWatchlist() {
  const store = useSyncExternalStore(subscribe, getSnapshot);

  const isStarred = useCallback(
    (id: string) => id in store,
    [store]
  );

  const toggle = useCallback((id: string) => {
    const current = getStore();
    if (id in current) {
      delete current[id];
    } else {
      current[id] = Date.now();
    }
    setStore(current);
    snapshot = current;
    listeners.forEach((cb) => cb());
  }, []);

  const starredIds = Object.keys(store);
  const count = starredIds.length;

  return { isStarred, toggle, starredIds, count };
}
