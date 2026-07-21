"use client";

// Refund requests across the platform, and the escalations staff have to answer.
//
// Most of this page is oversight — shops decide their own refunds, and staff
// watch for the ones going wrong. The exception is ESCALATED: a customer has
// disputed a rejection, and only staff can settle it. That is why the default
// filter is Escalated rather than All.
//
// Overruling a shop refunds the customer immediately and cannot be undone from
// here, so the confirm step spells out the amount.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuUndo2, LuRefreshCw, LuTriangleAlert, LuClock, LuCircleCheck, LuCircleX, LuStore, LuUser,
} from "react-icons/lu";
import { apiFetch } from "@/lib/admin/api";
import { inr, count, dateTime } from "@/lib/console/format";
import { StatRow } from "@/components/admin/StatRow";
import {
  Card, Table, Td, Tr, Skeleton, ErrorState, EmptyState, PageHeader, StatTile, Chip, cx,
} from "@/components/console/primitives";

interface RefundRequest {
  id: string;
  code: string;
  reason: string;
  description: string;
  status: string;
  decisionNote: string | null;
  decidedAt: string | null;
  escalatedAt: string | null;
  escalationNote: string | null;
  staffNote: string | null;
  resolvedAt: string | null;
  refundId: string | null;
  createdAt: string;
  order: {
    id: string;
    orderCode: string;
    status: string;
    costPaise: number;
    pagesToPrint: number;
    createdAt: string;
    document: { fileName: string } | null;
    printer: { id: string; name: string; uniquePrinterId: string; locationName: string } | null;
  } | null;
  user: { id: string; name: string; email: string | null; phone: string | null } | null;
  vendor: { id: string; shopName: string } | null;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  escalated: number;
}

const REASON_LABELS: Record<string, string> = {
  PRINT_FAILED: "Nothing printed",
  PRINTER_STUCK: "Printer jammed or froze",
  PRINTER_OFFLINE: "Printer was offline",
  PARTIAL_PRINT: "Only some pages printed",
  OTHER: "Something else",
};

const STATUS_TINT: Record<string, "gold" | "mint" | "blush" | "peach" | "gray"> = {
  PENDING: "gold",
  APPROVED: "mint",
  ESCALATION_APPROVED: "mint",
  REJECTED: "blush",
  ESCALATION_REJECTED: "gray",
  ESCALATED: "peach",
  CANCELLED: "gray",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "With the shop",
  APPROVED: "Refunded by shop",
  REJECTED: "Shop declined",
  ESCALATED: "Needs your decision",
  ESCALATION_APPROVED: "Refunded by staff",
  ESCALATION_REJECTED: "Upheld shop",
  CANCELLED: "Withdrawn",
};

// Escalated first: it is the only status on this page that is actually waiting
// on staff.
const FILTERS = [
  { value: "ESCALATED", label: "Needs your decision" },
  { value: "", label: "All requests" },
  { value: "PENDING", label: "With shops" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Declined" },
];

function RefundRequestsPageBody() {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState("ESCALATED");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [active, setActive] = useState<RefundRequest | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filter) params.set("status", filter);
      if (search.trim()) params.set("search", search.trim());
      const res = await apiFetch<{ requests: RefundRequest[]; stats: Stats }>(
        `/refund-requests/admin/all?${params}`
      );
      setRequests(res.requests || []);
      setStats(res.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load refund requests.");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  async function resolve(decision: "APPROVE" | "REJECT") {
    if (!active) return;
    setSaving(true);
    setFormError("");
    try {
      await apiFetch(`/refund-requests/admin/${active.id}/resolve`, {
        method: "POST",
        body: { decision, note: note.trim() || undefined },
      });
      setActive(null);
      setNote("");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save that decision.");
    }
    setSaving(false);
  }

  return (
    <>
      <PageHeader
        title="Refund Requests"
        subtitle="What customers asked for, what shops decided, and what you need to settle."
        action={
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
          >
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      <StatRow loading={!stats}>
        {stats && (
          <>
            <StatTile
              label="Needs you"
              value={count(stats.escalated)}
              icon={LuTriangleAlert}
              tint={stats.escalated > 0 ? "blush" : "gray"}
              hint="escalated disputes"
            />
            <StatTile
              label="With shops"
              value={count(stats.pending)}
              icon={LuClock}
              tint={stats.pending > 0 ? "gold" : "gray"}
              hint="awaiting a vendor decision"
            />
            <StatTile
              label="Approved"
              value={count(stats.approved)}
              icon={LuCircleCheck}
              tint="mint"
              hint="refunded to customers"
            />
            <StatTile
              label="Declined"
              value={count(stats.rejected)}
              icon={LuCircleX}
              tint="lavender"
              hint={`of ${count(stats.total)} total`}
            />
          </>
        )}
      </StatRow>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            onClick={() => setFilter(f.value)}
            className={cx(
              "text-xs font-bold px-3 py-2 rounded-xl border transition-colors cursor-pointer",
              filter === f.value
                ? "bg-slate-900 border-slate-900 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            )}
          >
            {f.label}
            {f.value === "ESCALATED" && stats && stats.escalated > 0 && (
              <span className="ml-1.5 text-[10px] tabular-nums bg-rose-500 text-white rounded-full px-1.5 py-0.5">
                {stats.escalated}
              </span>
            )}
          </button>
        ))}

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ref, order code, customer or shop…"
          className="flex-1 min-w-[200px] max-w-sm ml-auto px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-slate-400 transition-colors"
        />
      </div>

      <Card>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={filter === "ESCALATED" ? LuCircleCheck : LuUndo2}
            title={filter === "ESCALATED" ? "Nothing waiting on you" : "No requests here"}
            hint={
              filter === "ESCALATED"
                ? "Escalations land here when a customer disputes a shop's rejection."
                : "Try a different filter."
            }
          />
        ) : (
          <Table head={["Ref", "Customer", "Shop", "Reason", "Amount", "Status", "Raised", "Action"]}>
            {requests.map((r) => (
              <Tr key={r.id}>
                <Td className="font-mono text-xs font-semibold text-slate-700">
                  {r.code}
                  {r.order && (
                    <span className="block text-[10px] text-slate-400">{r.order.orderCode}</span>
                  )}
                </Td>

                <Td>
                  {r.user ? (
                    <Link
                      href={`/admin/management/users/${r.user.id}`}
                      className="text-slate-700 hover:underline text-sm truncate block max-w-[120px]"
                    >
                      {r.user.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </Td>

                <Td>
                  {r.vendor ? (
                    <Link
                      href={`/admin/management/vendors/${r.vendor.id}`}
                      className="text-slate-700 hover:underline text-sm truncate block max-w-[130px]"
                    >
                      {r.vendor.shopName}
                    </Link>
                  ) : (
                    <span className="text-amber-600 text-xs">no shop</span>
                  )}
                </Td>

                <Td className="text-xs text-slate-600 max-w-[160px]">
                  <p className="font-semibold">{REASON_LABELS[r.reason] || r.reason}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{r.description}</p>
                </Td>

                <Td className="tabular-nums font-semibold text-slate-800">
                  {inr(r.order?.costPaise || 0)}
                </Td>

                <Td>
                  <Chip
                    label={STATUS_LABELS[r.status] || r.status}
                    tint={STATUS_TINT[r.status] || "gray"}
                  />
                </Td>

                <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(r.createdAt)}</Td>

                <Td>
                  <button
                    onClick={() => {
                      setActive(r);
                      setNote("");
                      setFormError("");
                    }}
                    className={cx(
                      "text-[11px] font-bold border rounded-lg px-2 py-1 transition-colors cursor-pointer whitespace-nowrap",
                      r.status === "ESCALATED"
                        ? "text-white bg-rose-600 border-rose-600 hover:bg-rose-700"
                        : "text-slate-600 hover:text-slate-900 border-slate-200"
                    )}
                  >
                    {r.status === "ESCALATED" ? "Decide" : "Open"}
                  </button>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      {/* Detail / decision drawer */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <p className="font-mono text-xs text-slate-400">{active.code}</p>
                <h2 className="font-bold text-slate-900">
                  {REASON_LABELS[active.reason] || active.reason}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-1.5">
                  <LuUser size={11} /> {active.user?.name}
                  <span className="text-slate-300">·</span>
                  <LuStore size={11} /> {active.vendor?.shopName || "no shop"}
                </p>
              </div>
              <Chip
                label={STATUS_LABELS[active.status] || active.status}
                tint={STATUS_TINT[active.status] || "gray"}
              />
            </div>

            {active.order && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Amount
                  </p>
                  <p className="text-lg font-black text-slate-900 tabular-nums mt-0.5">
                    {inr(active.order.costPaise)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Order
                  </p>
                  <p className="text-sm font-mono font-semibold text-slate-700 mt-0.5">
                    {active.order.orderCode}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {active.order.status.replace(/_/g, " ").toLowerCase()} ·{" "}
                    {active.order.printer?.name || "unassigned"}
                  </p>
                </div>
              </div>
            )}

            {/* The whole conversation, in order — this is what a decision is made on. */}
            <div className="space-y-3 mb-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Customer said · {dateTime(active.createdAt)}
                </p>
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
                  {active.description}
                </p>
              </div>

              {active.decidedAt && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3">
                  <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                    Shop {active.status === "APPROVED" ? "approved" : "declined"} ·{" "}
                    {dateTime(active.decidedAt)}
                  </p>
                  <p className="text-sm text-rose-800 mt-1">
                    {active.decisionNote || "No reason recorded."}
                  </p>
                </div>
              )}

              {active.escalatedAt && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    Customer disputed · {dateTime(active.escalatedAt)}
                  </p>
                  <p className="text-sm text-amber-800 mt-1">{active.escalationNote}</p>
                </div>
              )}

              {active.resolvedAt && (
                <div className="rounded-xl bg-sky-50 border border-sky-200 p-3">
                  <p className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                    Staff decision · {dateTime(active.resolvedAt)}
                  </p>
                  <p className="text-sm text-sky-800 mt-1">
                    {active.staffNote || "No note recorded."}
                  </p>
                </div>
              )}
            </div>

            {active.status === "ESCALATED" ? (
              <>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Message to the customer
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="What you found, and why you're deciding this way."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 transition-colors resize-y"
                />
                {formError && (
                  <p className="text-xs text-rose-600 mt-2 font-semibold">{formError}</p>
                )}

                <p className="text-[11px] text-slate-400 mt-2">
                  Overruling the shop credits {inr(active.order?.costPaise || 0)} to the customer
                  immediately. Neither decision can be undone from here.
                </p>

                <div className="flex flex-wrap gap-2 mt-5">
                  <button
                    onClick={() => resolve("APPROVE")}
                    disabled={saving}
                    className="flex-1 min-w-32 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <LuCircleCheck size={14} /> Overrule &amp; refund
                  </button>
                  <button
                    onClick={() => resolve("REJECT")}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <LuCircleX size={14} /> Uphold the shop
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-400">
                  {active.status === "PENDING"
                    ? "The shop hasn't answered yet. Staff only step in once a customer disputes a rejection."
                    : "This request is closed. Decisions can't be changed."}
                </p>
                <button
                  onClick={() => setActive(null)}
                  className="mt-4 w-full inline-flex items-center justify-center border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function RefundRequestsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <RefundRequestsPageBody />
    </Suspense>
  );
}
