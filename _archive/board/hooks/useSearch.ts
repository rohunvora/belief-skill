import { useState, useEffect, useRef } from "react";
import type { TickerEntity, Author } from "../types";

interface SearchResults {
  tickers: TickerEntity[];
  authors: Author[];
}

interface SearchState {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResults;
  loading: boolean;
  hasResults: boolean;
}

export function useSearch(): SearchState {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ tickers: [], authors: [] });
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (query.length < 1) {
      setResults({ tickers: [], authors: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        setResults(data);
      } catch {
        setResults({ tickers: [], authors: [] });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const hasResults = results.tickers.length > 0 || results.authors.length > 0;

  return { query, setQuery, results, loading, hasResults };
}
