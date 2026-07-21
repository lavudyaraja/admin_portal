"use client";

// Disputes: what users report, and how it gets closed.
//
// Backed by Complaint (with photos) and Refund. "Vendor Complaints" has no
// record — a shop owner has no way to file one — and says so.

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuScale, LuFolderOpen, LuUser, LuStore, LuUndo2,
  LuGavel, LuCircleCheck, LuRefreshCw, LuSend,
} from "react-icons/lu";
import { apiFetch } from "@/lib/admin/api";
import { inr, points, count, dateTime } from "@/lib/console/format";
import { OpsTabs, useOpsTab, NoRecord, type OpsTab } from "@/components/admin/OpsTabs";
import { StatRow } from "@/components/admin/StatRow";
import {
  Card, Table, Td, Tr, StatusChip, Chip, Skeleton, ErrorState, EmptyState, PageHeader, StatTile,
} from "@/components/console/primitives";

interface Dispute {
  id: string;
  code: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  refundRequested: boolean;
  forwardedAt: string | null;
  forwardNote: string | null;
  refundId: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  user: { id: string; name: string; phone: string | null; email: string | null } | null;
  vendor: { id: string; shopName: string } | null;
  printer: { name: string; uniquePrinterId: string; shopName: string } | null;
  order: { id: string; orderCode: string; status: string; costPaise: number } | null;
  _count: { photos: number };
}

interface DisputeData {
  total: number;
  open: number;
  inReview: number;
  forwarded: number;
  resolved: number;
  refunded: number;
  rejected: number;
  disputes: Dispute[];
}

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

function DisputesPageBody() {
  const tab = useOpsTab("open");
  const [data, setData] = useState<DisputeData | null>(null);
  const [refunds, setRefunds] = useState<{ refunds: RefundRow[]; total: number; totalPoints: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState<Dispute | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [d, r] = await Promise.all([
        apiFetch<DisputeData>("/admin/disputes"),
        apiFetch<{ refunds: RefundRow[]; total: number; totalPoints: number }>("/admin/refunds"),
      ]);
      setData(d);
      setRefunds(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function resolve(status: "IN_REVIEW" | "RESOLVED" | "REJECTED") {
    if (!active) return;
    setSaving(true);
    try {
      await apiFetch(`/admin/disputes/${active.id}`, { method: "PATCH", body: { status, resolution: reply } });
      setActive(null);
      setReply("");
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not update that case.");
    }
    setSaving(false);
  }

  // Grant the refund the issue asked for — the only place a complaint-driven
  // refund is issued. Credits the customer's Points and notifies both sides.
  async function refund() {
    if (!active) return;
    if (!confirm(`Refund the customer for ${active.order?.orderCode || active.code}? This credits their Points and can't be undone.`)) return;
    setSaving(true);
    try {
      await apiFetch(`/admin/disputes/${active.id}/refund`, { method: "POST", body: { resolution: reply } });
      setActive(null);
      setReply("");
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not issue the refund.");
    }
    setSaving(false);
  }

  const rows = useMemo(() => {
    const all = data?.disputes || [];
    switch (tab) {
      case "open": return all.filter((d) => d.status === "OPEN" || d.status === "IN_REVIEW" || d.status === "FORWARDED");
      case "forwarded": return all.filter((d) => d.status === "FORWARDED");
      case "closed": return all.filter((d) => d.status === "RESOLVED" || d.status === "REFUNDED" || d.status === "REJECTED");
      default: return all;
    }
  }, [data, tab]);

  const tabs: OpsTab[] = [
    { id: "open", label: "Open Cases", icon: LuFolderOpen, count: data ? data.open + data.inReview + data.forwarded : undefined },
    { id: "forwarded", label: "Forwarded Refunds", icon: LuSend, count: data?.forwarded },
    { id: "users", label: "User Complaints", icon: LuUser, count: data?.total },
    { id: "vendors", label: "Vendor Complaints", icon: LuStore },
    { id: "refunds", label: "Refund Disputes", icon: LuUndo2, count: refunds?.total },
    { id: "resolution", label: "Resolution Center", icon: LuGavel, count: data ? data.open + data.inReview + data.forwarded : undefined },
    { id: "closed", label: "Closed Cases", icon: LuCircleCheck, count: data ? data.resolved + data.refunded + data.rejected : undefined },
  ];

  const DisputeTable = ({ list, actionable }: { list: Dispute[]; actionable?: boolean }) =>
    list.length === 0 ? (
      <EmptyState icon={LuScale} title="No cases here" hint="Reports raised from the app appear here." />
    ) : (
      <Table head={["Ref", "Customer", "Category", "Subject", "Printer", "Status", "When", ...(actionable ? ["Action"] : [])]}>
        {list.map((d) => (
          <Tr key={d.id}>
            <Td>
              <p className="font-mono text-xs font-semibold text-slate-700">{d.code}</p>
              {d._count.photos > 0 && <p className="text-[10px] text-slate-400">{d._count.photos} photo(s)</p>}
              {d.refundRequested && (
                <span className="mt-1 inline-flex items-center gap-1 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                  <LuUndo2 size={10} /> Refund asked
                </span>
              )}
            </Td>
            <Td>
              {d.user ? (
                <Link href={`/admin/management/users/${d.user.id}`} className="text-slate-700 hover:underline text-sm">
                  {d.user.name}
                </Link>
              ) : "—"}
            </Td>
            <Td className="text-xs text-slate-500">{d.category.replace(/_/g, " ").toLowerCase()}</Td>
            <Td className="text-slate-600 truncate max-w-[180px]">{d.subject}</Td>
            <Td className="text-[11px] text-slate-500 font-mono">{d.printer?.uniquePrinterId || "—"}</Td>
            <Td><StatusChip status={d.status} /></Td>
            <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(d.createdAt)}</Td>
            {actionable && (
              <Td>
                <button
                  onClick={() => { setActive(d); setReply(d.resolution || ""); }}
                  className="text-[11px] font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-2 py-1 transition-colors cursor-pointer"
                >
                  Review
                </button>
              </Td>
            )}
          </Tr>
        ))}
      </Table>
    );

  return (
    <>
      <PageHeader
        title="Disputes"
        subtitle="Problems users report, and the refunds that follow."
        action={
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
          >
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      <StatRow loading={!data}>
        {data && refunds && (
          <>
            <StatTile label="Open cases" value={count(data.open + data.inReview)} icon={LuFolderOpen} tint={data.open > 0 ? "gold" : "gray"} hint={`${count(data.inReview)} in review`} />
            <StatTile label="Resolved" value={count(data.resolved)} icon={LuCircleCheck} tint="mint" hint={`${count(data.rejected)} rejected`} />
            <StatTile label="Total reports" value={count(data.total)} icon={LuScale} tint="lavender" hint="all time" />
            <StatTile label="Refunded" value={points(refunds.totalPoints)} icon={LuUndo2} tint="sky" hint={`${count(refunds.total)} refunds`} />
          </>
        )}
      </StatRow>

      <OpsTabs tabs={tabs} active={tab} basePath="/admin/operations/disputes" />

      {tab === "vendors" ? (
        <NoRecord
          icon={LuStore}
          title="Vendors can't file complaints"
          needs="Only users can report a problem — a shop owner has no way to raise one about a customer, a payout or the platform. The nearest thing is a support ticket. This needs complaints to accept a vendor as the author."
        />
      ) : loading ? (
        <Card><div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div></Card>
      ) : error ? (
        <Card><ErrorState message={error} onRetry={load} /></Card>
      ) : tab === "refunds" ? (
        <Card>
          {!refunds || refunds.refunds.length === 0 ? (
            <EmptyState icon={LuUndo2} title="No refunds issued" hint="A failed print refunds automatically; manual refunds appear here too." />
          ) : (
            <Table head={["Order", "Customer", "Reason", "Refunded", "Origin", "When"]}>
              {refunds.refunds.map((r) => (
                <Tr key={r.id}>
                  <Td className="font-mono text-xs text-slate-700">{r.order?.orderCode || "—"}</Td>
                  <Td>
                    {r.user ? (
                      <Link href={`/admin/management/users/${r.user.id}`} className="text-slate-700 hover:underline text-sm">{r.user.name}</Link>
                    ) : "—"}
                  </Td>
                  <Td className="text-xs text-slate-500">{r.reason.replace(/_/g, " ").toLowerCase()}</Td>
                  <Td className="tabular-nums font-bold text-emerald-600">
                    +{points(r.pointsCredited)}
                    <span className="block text-[11px] font-normal text-slate-400">was {inr(r.amountPaise)}</span>
                  </Td>
                  <Td><Chip label={r.origin} tint={r.origin === "AUTOMATIC" ? "sky" : "lavender"} /></Td>
                  <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(r.createdAt)}</Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>
      ) : (
        <Card>
          <DisputeTable
            list={tab === "resolution" ? (data?.disputes || []).filter((d) => d.status === "OPEN" || d.status === "IN_REVIEW" || d.status === "FORWARDED") : rows}
            actionable={tab === "resolution" || tab === "open" || tab === "forwarded"}
          />
        </Card>
      )}

      {/* Resolution drawer */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setActive(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <p className="font-mono text-xs text-slate-400">{active.code}</p>
                <h2 className="font-bold text-slate-900">{active.subject}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {active.user?.name} · {active.category.replace(/_/g, " ").toLowerCase()}
                </p>
              </div>
              <StatusChip status={active.status} />
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 mb-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{active.description}</p>
            </div>

            {active.order && (
              <p className="text-xs text-slate-500 mb-4">
                Order <span className="font-mono">{active.order.orderCode}</span> · {inr(active.order.costPaise)} · {active.order.status}
              </p>
            )}

            {active.refundRequested && (
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-3.5 mb-4">
                <p className="flex items-center gap-1.5 text-xs font-bold text-violet-800">
                  <LuUndo2 size={13} /> Refund requested
                  {active.refundId ? " · already refunded" : ""}
                </p>
                {active.forwardedAt && (
                  <p className="mt-1 text-[11px] text-violet-700">
                    Forwarded by {active.vendor?.shopName || "the shop"} on {dateTime(active.forwardedAt)}
                  </p>
                )}
                {active.forwardNote && (
                  <p className="mt-1 text-xs text-slate-600 whitespace-pre-wrap">“{active.forwardNote}”</p>
                )}
              </div>
            )}

            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Reply to the customer
            </label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={4}
              placeholder="What you found, and what happens next."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 transition-colors resize-y"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Resolving or rejecting sends this to the customer as a notification.
            </p>

            <div className="flex flex-wrap gap-2 mt-5">
              {active.refundRequested && active.order && !active.refundId && (
                <button
                  onClick={refund}
                  disabled={saving}
                  className="flex-1 min-w-32 inline-flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LuUndo2 size={14} /> Refund &amp; resolve
                </button>
              )}
              <button
                onClick={() => resolve("RESOLVED")}
                disabled={saving}
                className="flex-1 min-w-32 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                <LuSend size={14} /> Resolve
              </button>
              <button
                onClick={() => resolve("IN_REVIEW")}
                disabled={saving}
                className="inline-flex items-center justify-center gap-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                In review
              </button>
              <button
                onClick={() => resolve("REJECTED")}
                disabled={saving}
                className="inline-flex items-center justify-center gap-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * The tab lives in the URL, so this reads `useSearchParams`. Next needs that
 * behind a Suspense boundary or the route can't be prerendered — without it the
 * production build fails outright.
 */
export default function DisputesPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <DisputesPageBody />
    </Suspense>
  );
}
