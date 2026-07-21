"use client";

/**
 * Shared pieces for the Customers group.
 *
 * All three list views (Customer List, Frequent Customers, Customer History)
 * come off `/vendors/me/customers`, which is already grouped and summed in the
 * database. What differs between the pages is the cut and the sort, so they
 * share one loader.
 */
import { useCallback, useEffect, useState } from "react";
import type { IconType } from "react-icons";
import { LuRefreshCw, LuSearch } from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import {
  Card, Skeleton, EmptyState, ErrorState, PageHeader,
} from "@/components/console/primitives";

export interface VendorCustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  pointsBalance: number;
  createdAt: string;
  orders: number;
  spentPaise: number;
  pagesPrinted: number;
  /** Standing across every shop, not just this one. */
  ratingAvg: number;
  ratingCount: number;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<VendorCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ customers: VendorCustomer[]; total: number }>(
        "/vendors/me/customers"
      );
      setCustomers(res.customers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { customers, loading, error, reload: load };
}

/** Free-text match across the fields a shop would actually search by. */
export function matchesCustomer(c: VendorCustomer, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [c.name, c.phone, c.email].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
}

/** Page frame shared by the customer views. */
export function CustomersPage({
  title,
  subtitle,
  icon,
  emptyTitle,
  emptyHint,
  loading,
  error,
  reload,
  isEmpty,
  search,
  setSearch,
  searchPlaceholder = "Name, phone or email…",
  summary,
  children,
}: {
  title: string;
  subtitle: string;
  icon: IconType;
  emptyTitle: string;
  emptyHint: string;
  loading: boolean;
  error: string;
  reload: () => void;
  isEmpty: boolean;
  search?: string;
  setSearch?: (s: string) => void;
  searchPlaceholder?: string;
  summary?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          <button
            onClick={reload}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
          >
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      {(summary || setSearch) && (
        <div className="flex flex-wrap items-center gap-2">
          {summary}
          {setSearch && (
            <div className="relative flex-1 min-w-[200px] max-w-sm ml-auto">
              <LuSearch
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-slate-400 transition-colors"
              />
            </div>
          )}
        </div>
      )}

      <Card>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : isEmpty ? (
          <EmptyState
            icon={icon}
            title={search ? "Nothing matches that" : emptyTitle}
            hint={search ? "Try a different search." : emptyHint}
          />
        ) : (
          children
        )}
      </Card>
    </div>
  );
}
