/** Shared data context — fetches calls and users from the API once, provides to all components. */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Call, User, Author } from "../types";

interface BoardData {
  calls: Call[];
  users: User[];
  authors: Author[];
  loading: boolean;
  // Helpers matching the old mock-data.ts API
  getCallById: (id: string) => Call | undefined;
  getUserById: (id: string) => User | undefined;
  getUserByHandle: (handle: string) => User | undefined;
  getAuthorByHandle: (handle: string) => Author | undefined;
  getCallsByUser: (userId: string) => Call[];
  getCallsBySourceHandle: (handle: string) => Call[];
  refetch: () => void;
}

const BoardContext = createContext<BoardData>({
  calls: [],
  users: [],
  authors: [],
  loading: true,
  getCallById: () => undefined,
  getUserById: () => undefined,
  getUserByHandle: () => undefined,
  getAuthorByHandle: () => undefined,
  getCallsByUser: () => [],
  getCallsBySourceHandle: () => [],
  refetch: () => {},
});

export function useBoardData(): BoardData {
  return useContext(BoardContext);
}

export function BoardDataProvider({ children }: { children: React.ReactNode }) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [callsRes, usersRes, authorsRes] = await Promise.all([
        fetch("/api/takes"),
        fetch("/api/users"),
        fetch("/api/authors"),
      ]);
      const [callsData, usersData, authorsData] = await Promise.all([
        callsRes.json(),
        usersRes.json(),
        authorsRes.json(),
      ]);
      setCalls(callsData);
      setUsers(usersData);
      setAuthors(authorsData);
    } catch (err) {
      console.error("Failed to fetch board data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCallById = useCallback(
    (id: string) => calls.find((c) => c.id === id),
    [calls]
  );

  const getUserById = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users]
  );

  const getUserByHandle = useCallback(
    (handle: string) => users.find((u) => u.handle === handle),
    [users]
  );

  const getCallsByUser = useCallback(
    (userId: string) => calls.filter((c) => c.caller_id === userId),
    [calls]
  );

  const getAuthorByHandle = useCallback(
    (handle: string) => authors.find((a) => a.handle === handle),
    [authors]
  );

  const getCallsBySourceHandle = useCallback(
    (handle: string) => calls.filter((c) => c.source_handle === handle),
    [calls]
  );

  const value: BoardData = {
    calls,
    users,
    authors,
    loading,
    getCallById,
    getUserById,
    getUserByHandle,
    getAuthorByHandle,
    getCallsByUser,
    getCallsBySourceHandle,
    refetch: fetchData,
  };

  return React.createElement(BoardContext.Provider, { value }, children);
}
