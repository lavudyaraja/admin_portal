"use client";

// Orders, with the queue's own vocabulary as tabs.
//
// All / Pending / Printing / Completed / Cancelled / Failed are the *same*
// dataset under a status filter — six near-identical pages would be six places
// to fix the next column change, so they are tabs over one list instead. Refund
// Requests and Disputes are genuinely different records and load their own data.
//
// The tab lives in the URL so a filtered view can be linked to and survives a
// reload.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LuInbox, LuSearch, LuClock, LuPrinter, LuCircleCheck, LuBan,
  LuTriangleAlert, LuUndo2, LuScale, LuLayers,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import { apiFetch, type OrderRow } from "@/lib/admin/api";
import { inr, points, count, dateTime } from "@/lib/console/format";
import {
  Card, Table, Td, Tr, StatusChip, Chip, Skeleton, ErrorState, EmptyState, PageHeader, Pill, StatTile,
} from "@/components/console/primitives";
import { StatRow } from "@/components/admin/StatRow";
import { useMetrics } from "@/lib/admin/useMetrics";

/** `status` null means "don't filter" — the All tab. */
const TABS: { id: string; label: string; icon: IconType; status: string | null }[] = [
  { id: "all", label: "All Orders", icon: LuLayers, status: null },
  { id: "pending", label: "Pending", icon: LuClock, status: "PENDING_PAYMENT" },
  { id: "printing", label: "Printing", icon: LuPrinter, status: "PRINTING" },
  { id: "completed", label: "Completed", icon: LuCircleCheck, status: "COMPLETED" },
  { id: "cancelled", label: "Cancelled", icon: LuBan, status: "CANCELLED" },
  { id: "failed", label: "Failed", icon: LuTriangleAlert, status: "FAILED" },
  { id: "refunds", label: "Refund Requests", icon: LuUndo2, status: null },
  { id: "disputes", label: "Disputes", icon: LuScale, status: null },
];

interface RefundRow {
  id: string;
  amountPaise: number;
  pointsCredited: number;
  reason: string;
  origin: string;
  note: string | null;
  createdAt: string;
  user: { id: string; name: string } | null;
  order: { id: string; orderCode: string; status: string } | null;
}

interface DisputeRow {
  id: string;
  code: string;
  category: string;
  subject: string;
  status: string;
  resolution: string | null;
  createdAt: string;
  user: { id: string; name: string } | null;
  printer: { name: string; uniquePrinterId: string } | null;
  order: { orderCode: string } | null;
}

function OrdersPageBody() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get("tab") || "all";
  const active = TABS.find((t) => t.id === tab) || TABS[0];

  const m = useMetrics();
  const [search, setSearch] = useState("");

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [refunds, setRefunds] = useState<{ refunds: RefundRow[]; totalPoints: number; automatic: number; manual: number } | null>(null);
  const [disputes, setDisputes] = useState<{ disputes: DisputeRow[]; open: number; resolved: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "refunds") {
        setRefunds(await apiFetch("/admin/refunds"));
      } else if (tab === "disputes") {
        setDisputes(await apiFetch("/admin/disputes"));
      } else {
        const qs = new URLSearchParams({ limit: "100" });
        if (active.status) qs.set("status", active.status);
        if (search) qs.set("search", search);
        const res = await apiFetch<{ orders: OrderRow[]; total: number }>(`/admin/orders?${qs}`);
        setOrders(res.orders || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [tab, active.status, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  function selectTab(next: string) {
    router.replace(`/admin/management/orders?tab=${next}`, { scroll: false });
  }

  const isOrderTab = tab !== "refunds" && tab !== "disputes";

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Every print job across the network, plus refunds and disputes."
        action={isOrderTab ? <Pill n={total} /> : undefined}
      />

      <StatRow loading={!m}>
        {m && (
          <>
            <StatTile label="Total orders" value={count(m.totalOrders)} icon={LuInbox} tint="lavender" hint={`${count(m.dailyOrders)} today`} />
            <StatTile label="Completed" value={count(m.completedOrders)} icon={LuCircleCheck} tint="mint" hint={m.totalOrders > 0 ? `${Math.round((m.completedOrders / m.totalOrders) * 100)}% of all` : undefined} />
            <StatTile label="Failed" value={count(m.failedOrders)} icon={LuTriangleAlert} tint={m.failedOrders > 0 ? "blush" : "gray"} hint={`${count(m.cancelledOrders)} cancelled`} />
            <StatTile label="Revenue" value={inr(m.totalRevenuePaise)} icon={LuCircleCheck} tint="sky" hint="completed orders" />
          </>
        )}
      </StatRow>

      {/* Tabs — scrollable so eight survive a narrow window. */}
      <div className="mb-4 -mx-1 overflow-x-auto">
        <div className="flex gap-1 px-1 min-w-max border-b border-slate-200">
          {TABS.map((t) => {
            const on = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => selectTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
                  on ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon size={15} className={on ? "text-slate-700" : "text-slate-400"} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {isOrderTab && (
        <div className="relative flex-1 min-w-[200px] max-w-sm mb-4">
          <LuSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order code, customer name or phone…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-slate-400 transition-colors"
          />
        </div>
      )}

      <Card>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : tab === "refunds" ? (
          <RefundsTable data={refunds} />
        ) : tab === "disputes" ? (
          <DisputesTable data={disputes} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={LuInbox}
            title={`No ${active.label.toLowerCase()}`}
            hint={search ? "Try a different search." : "Orders in this state will appear here."}
          />
        ) : (
          <Table head={["Order", "Customer", "Document", "Printer", "Amount", "Status", "When"]}>
            {orders.map((o) => (
              <Tr key={o.id}>
                <Td>
                  <p className="font-mono text-xs font-semibold text-slate-700">{o.orderCode}</p>
                  <p className="text-[11px] text-slate-400">{o.colorMode === "COLOR" ? "Colour" : "B&W"} · {o.pagesToPrint}pg</p>
                </Td>
                <Td>
                  {o.user ? (
                    <Link href={`/admin/management/users/${(o.user as { id?: string }).id ?? ""}`} className="font-medium text-slate-700 hover:underline">
                      {o.user.name}
                    </Link>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                  <p className="text-[11px] text-slate-400">{o.user?.phone || ""}</p>
                </Td>
                <Td className="text-slate-600 truncate max-w-[160px]">{o.document?.fileName || "—"}</Td>
                <Td className="text-xs">
                  <p className="text-slate-600 truncate max-w-[140px]">{o.printer?.name || "Unassigned"}</p>
                  {o.printer && <p className="text-[11px] text-slate-400 font-mono">{o.printer.uniquePrinterId}</p>}
                </Td>
                <Td className="tabular-nums font-semibold text-slate-700">{inr(o.costPaise)}</Td>
                <Td><StatusChip status={o.status} /></Td>
                <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(o.createdAt)}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

// ── Refunds ──────────────────────────────────────────────────────────────────

function RefundsTable({ data }: { data: { refunds: RefundRow[]; totalPoints: number; automatic: number; manual: number } | null }) {
  if (!data || data.refunds.length === 0) {
    return (
      <EmptyState
        icon={LuUndo2}
        title="No refunds issued"
        hint="A failed print refunds automatically; manual refunds appear here too."
      />
    );
  }

  return (
    <Table head={["Order", "Customer", "Reason", "Refunded", "Origin", "Note", "When"]}>
      {data.refunds.map((r) => (
        <Tr key={r.id}>
          <Td className="font-mono text-xs text-slate-700">{r.order?.orderCode || "—"}</Td>
          <Td>
            {r.user ? (
              <Link href={`/admin/management/users/${r.user.id}`} className="font-medium text-slate-700 hover:underline">
                {r.user.name}
              </Link>
            ) : "—"}
          </Td>
          <Td className="text-xs text-slate-500">{r.reason.replace(/_/g, " ").toLowerCase()}</Td>
          <Td className="tabular-nums font-bold text-emerald-600">
            +{points(r.pointsCredited)}
            <span className="block text-[11px] font-normal text-slate-400">was {inr(r.amountPaise)}</span>
          </Td>
          <Td><Chip label={r.origin} tint={r.origin === "AUTOMATIC" ? "sky" : "lavender"} /></Td>
          <Td className="text-xs text-slate-500 truncate max-w-[160px]">{r.note || "—"}</Td>
          <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(r.createdAt)}</Td>
        </Tr>
      ))}
    </Table>
  );
}

// ── Disputes ─────────────────────────────────────────────────────────────────

function DisputesTable({ data }: { data: { disputes: DisputeRow[]; open: number; resolved: number; total: number } | null }) {
  if (!data || data.disputes.length === 0) {
    return (
      <EmptyState
        icon={LuScale}
        title="No disputes"
        hint="Reports raised from the app appear here for triage."
      />
    );
  }

  return (
    <Table head={["Ref", "Customer", "Category", "Subject", "Printer", "Status", "When"]}>
      {data.disputes.map((d) => (
        <Tr key={d.id}>
          <Td className="font-mono text-xs text-slate-700">{d.code}</Td>
          <Td>
            {d.user ? (
              <Link href={`/admin/management/users/${d.user.id}`} className="font-medium text-slate-700 hover:underline">
                {d.user.name}
              </Link>
            ) : "—"}
          </Td>
          <Td className="text-xs text-slate-500">{d.category.replace(/_/g, " ").toLowerCase()}</Td>
          <Td className="text-slate-600 truncate max-w-[180px]">{d.subject}</Td>
          <Td className="text-xs text-slate-500">{d.printer?.uniquePrinterId || "—"}</Td>
          <Td><StatusChip status={d.status} /></Td>
          <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(d.createdAt)}</Td>
        </Tr>
      ))}
    </Table>
  );
}

/**
 * The tab lives in the URL, so this reads `useSearchParams`. Next needs that
 * behind a Suspense boundary or the route can't be prerendered — without it the
 * production build fails outright.
 */
export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <OrdersPageBody />
    </Suspense>
  );
}
