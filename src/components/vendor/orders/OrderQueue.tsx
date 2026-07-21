"use client";

/**
 * One order queue, filtered to a set of statuses.
 *
 * The five order routes (New, Processing, Ready, Completed, Cancelled) are all
 * this component with a different `statuses` list. They are separate routes
 * rather than tabs on purpose: a shop owner works from a phone between
 * customers, and a bookmark or a reload has to land back on the same queue.
 *
 * Filtering happens server-side one status at a time (`/vendors/me/orders`
 * takes a single `status`), so a queue covering several statuses fetches them
 * in parallel and merges. That keeps the endpoint unchanged and the page honest
 * about its own totals.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { IconType } from "react-icons";
import { LuSearch, LuPrinter, LuFileText, LuRefreshCw, LuUser } from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import { inr, count, dateTime } from "@/lib/console/format";
import {
  Card, Table, Td, Tr, Skeleton, EmptyState, ErrorState, PageHeader, StatusChip, cx,
} from "@/components/console/primitives";

export interface VendorOrder {
  id: string;
  orderCode: string;
  status: string;
  colorMode: string;
  sideMode: string;
  copies: number;
  pagesToPrint: number;
  paperSize: string;
  costPaise: number;
  paymentMethod: string | null;
  createdAt: string;
  user: { id?: string; name: string; phone: string | null; email: string | null } | null;
  document: { fileName: string; pageCount: number } | null;
  printer: { name: string; shopName: string; uniquePrinterId: string } | null;
}

export function OrderQueue({
  title,
  subtitle,
  statuses,
  icon,
  emptyTitle,
  emptyHint,
  showStatusFilter = false,
  hideHeader = false,
}: {
  title: string;
  subtitle: string;
  /** Order statuses this queue covers. */
  statuses: string[];
  icon: IconType;
  emptyTitle: string;
  emptyHint: string;
  /**
   * Add a status dropdown that narrows within this queue. Only meaningful on
   * the "All" tab — on a single-status queue it would be a control with one
   * option.
   */
  showStatusFilter?: boolean;
  /**
   * Skip the page header. Set when the queue is embedded under a tab strip that
   * already carries the page title — two headings stacked reads as a bug.
   */
  hideHeader?: boolean;
}) {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // `statuses` is a literal array in each route file, so it is a new identity on
  // every render. Joining it gives `load` a stable dependency — without this the
  // effect below re-fires forever.
  const statusKey = statuses.join(",");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const results = await Promise.all(
        statusKey.split(",").map((status) => {
          const params = new URLSearchParams({ limit: "100", status });
          return apiFetch<{ orders: VendorOrder[] }>(`/vendors/me/orders?${params}`);
        })
      );
      // Merge and re-sort: each status came back newest-first on its own, and
      // concatenating them would interleave dates wrongly.
      const merged = results
        .flatMap((r) => r.orders || [])
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      setOrders(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, [statusKey]);

  useEffect(() => {
    load();
  }, [load]);

  // Search and the status narrowing are client-side over the fetched page: the
  // queues are small, and round-tripping every keystroke to filter fifty rows
  // is not worth it.
  const rows = useMemo(() => {
    let next = orders;
    if (statusFilter) next = next.filter((o) => o.status === statusFilter);

    const q = search.trim().toLowerCase();
    if (!q) return next;
    return next.filter((o) =>
      [o.orderCode, o.user?.name, o.user?.phone, o.document?.fileName, o.printer?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [orders, search, statusFilter]);

  // Only the statuses this queue actually returned rows for — a dropdown
  // offering "Failed" on a page with no failures is a dead end.
  const availableStatuses = useMemo(
    () => Array.from(new Set(orders.map((o) => o.status))).sort(),
    [orders]
  );

  const pages = useMemo(() => rows.reduce((s, o) => s + o.pagesToPrint * o.copies, 0), [rows]);
  const value = useMemo(() => rows.reduce((s, o) => s + o.costPaise, 0), [rows]);

  return (
    <div className={hideHeader ? "space-y-4" : "mx-auto w-full max-w-6xl space-y-5"}>
      {!hideHeader && (
        <PageHeader
          title={title}
          subtitle={subtitle}
          action={
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
            >
              <LuRefreshCw size={13} /> Refresh
            </button>
          }
        />
      )}

      {/* A queue's own totals, not the account's — this is what is in front of
          the shop owner right now. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2">
          <LuFileText size={13} className="text-slate-400" />
          {count(rows.length)} order{rows.length === 1 ? "" : "s"}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2">
          <LuPrinter size={13} className="text-slate-400" />
          {count(pages)} page{pages === 1 ? "" : "s"}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 tabular-nums">
          {inr(value)}
        </span>

        {showStatusFilter && availableStatuses.length > 1 && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="ml-auto px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-slate-400 transition-colors cursor-pointer"
          >
            <option value="">All statuses</option>
            {availableStatuses.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        )}

        <div
          className={cx(
            "relative flex-1 min-w-[200px] max-w-sm",
            !(showStatusFilter && availableStatuses.length > 1) && "ml-auto"
          )}
        >
          <LuSearch
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order code, customer, file…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-slate-400 transition-colors"
          />
        </div>

        {hideHeader && (
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2.5 transition-colors cursor-pointer"
          >
            <LuRefreshCw size={13} /> Refresh
          </button>
        )}
      </div>

      <Card>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : rows.length === 0 ? (
          <EmptyState icon={icon} title={search ? "Nothing matches that" : emptyTitle} hint={search ? "Try a different search." : emptyHint} />
        ) : (
          <Table head={["Order", "Customer", "Document", "Config", "Printer", "Amount", "Status", "When"]}>
            {rows.map((o) => (
              <Tr key={o.id}>
                <Td className="font-mono text-xs font-semibold text-slate-700">{o.orderCode}</Td>

                <Td>
                  <p className="text-slate-700 text-sm truncate max-w-[140px]">
                    {o.user?.name || "—"}
                  </p>
                  {o.user?.phone && (
                    <p className="text-[11px] text-slate-400 tabular-nums">{o.user.phone}</p>
                  )}
                </Td>

                <Td className="text-xs text-slate-600 truncate max-w-[160px]">
                  {o.document?.fileName || "—"}
                </Td>

                <Td className="text-xs text-slate-500 whitespace-nowrap">
                  {o.colorMode === "COLOR" ? "Colour" : "B&W"} · {o.pagesToPrint}pg
                  {o.copies > 1 ? ` × ${o.copies}` : ""}
                  <span className="block text-[10px] text-slate-400">
                    {o.sideMode === "DOUBLE" ? "Double-sided" : "Single-sided"} · {o.paperSize}
                  </span>
                </Td>

                <Td className="text-xs text-slate-600 truncate max-w-[120px]">
                  {o.printer?.name || <span className="text-amber-600">unassigned</span>}
                </Td>

                <Td className="tabular-nums font-semibold text-slate-700">{inr(o.costPaise)}</Td>

                <Td>
                  <StatusChip status={o.status} />
                </Td>

                <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(o.createdAt)}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
