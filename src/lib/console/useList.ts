"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The caller supplies its own fetcher.
 *
 * This hook is shared by both consoles, and they authenticate separately — the
 * vendor client holds `printhub_admin_token`, the admin client holds
 * `printhub_operator_token`. Importing either one here would silently bind
 * every list page to a single portal's session.
 */
type Fetcher = <R>(path: string) => Promise<R>;

export interface ListState<T> {
  rows: T[];
  total: number;
  loading: boolean;
  error: string;
  search: string;
  setSearch: (s: string) => void;
  filter: string;
  setFilter: (f: string) => void;
  page: number;
  setPage: (p: number) => void;
  reload: () => void;
}

const PAGE_SIZE = 50;

/**
 * Every list page in the console is the same shape: a filtered, searched,
 * paged GET that returns `{ [key]: T[], total }`.
 *
 * `filterKey` is the query param the filter dropdown maps to — `status` for
 * orders and tickets, `role` for users, `type` for transactions.
 *
 * `apiFetch` is the calling portal's own client, so the request carries that
 * portal's token.
 */
export function useList<T>(
  apiFetch: Fetcher,
  path: string,
  key: string,
  filterKey = "status"
): ListState<T> {
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);

  // Search fires on every keystroke, so debounce it and drop any reply that
  // arrives after a newer request has already been sent.
  const reqId = useRef(0);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (search.trim()) params.set("search", search.trim());
      if (filter) params.set(filterKey, filter);

      const res = await apiFetch<Record<string, unknown>>(`${path}?${params}`);
      if (id !== reqId.current) return; // a newer request superseded this one
      setRows((res[key] as T[]) || []);
      setTotal((res.total as number) || 0);
    } catch (err) {
      if (id !== reqId.current) return;
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [apiFetch, path, key, filterKey, search, filter, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  // A new filter or query invalidates the current offset.
  useEffect(() => {
    setPage(0);
  }, [search, filter]);

  return {
    rows, total, loading, error,
    search, setSearch,
    filter, setFilter,
    page, setPage,
    reload: load,
  };
}

export { PAGE_SIZE };
