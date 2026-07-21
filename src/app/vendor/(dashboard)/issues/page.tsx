"use client";

// Issues raised against this shop's machines.
//
// A customer reports a problem from the app; if it's about one of this shop's
// printers it lands here. When the customer also asked for their money back,
// the shop can't grant it — refunds are the platform's call — so the move is to
// review it and Forward to the platform, who issue the refund. Everything else
// (a jam, an out-of-paper report) is informational: walk over and fix it.
import { useCallback, useEffect, useState } from "react";
import {
  LuMessageSquareWarning, LuRefreshCw, LuSend, LuUndo2, LuInbox, LuClock,
} from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import { inr, count, dateTime } from "@/lib/console/format";
import {
  Card, Table, Td, Tr, StatusChip, Skeleton, ErrorState, EmptyState, PageHeader, StatTile,
} from "@/components/console/primitives";

interface Complaint {
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
  createdAt: string;
  order: { id: string; orderCode: string; status: string; costPaise?: number } | null;
  printer: { id: string; name: string; shopName: string; locationName: string } | null;
}

interface Stats {
  total: number;
  open: number;
  inReview: number;
  forwarded: number;
  refunded: number;
  resolved: number;
  rejected: number;
}

interface QueueData {
  complaints: Complaint[];
  total: number;
  stats: Stats;
}

const FORWARDABLE = ["OPEN", "IN_REVIEW"];

export default function VendorIssuesPage() {
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState<Complaint | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<QueueData>("/complaints/vendor/queue"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function forward() {
    if (!active) return;
    setSaving(true);
    try {
      await apiFetch(`/complaints/vendor/${active.id}/forward`, { method: "POST", body: { note } });
      setActive(null);
      setNote("");
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not forward that issue.");
    }
    setSaving(false);
  }

  const stats = data?.stats;

  return (
    <>
      <PageHeader
        title="Issues"
        subtitle="Problems customers reported about your machines — and the refunds they asked for."
        action={
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
          >
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatTile label="Open" value={count(stats.open + stats.inReview)} icon={LuInbox} tint={stats.open > 0 ? "gold" : "gray"} hint="need a look" />
          <StatTile label="Forwarded" value={count(stats.forwarded)} icon={LuSend} tint="sky" hint="with platform" />
          <StatTile label="Refunded" value={count(stats.refunded)} icon={LuUndo2} tint="mint" hint="by platform" />
          <StatTile label="All time" value={count(stats.total)} icon={LuMessageSquareWarning} tint="lavender" hint="total issues" />
        </div>
      )}

      {loading ? (
        <Card><div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div></Card>
      ) : error ? (
        <Card><ErrorState message={error} onRetry={load} /></Card>
      ) : (
        <Card>
          {!data || data.complaints.length === 0 ? (
            <EmptyState icon={LuMessageSquareWarning} title="No issues yet" hint="Reports raised against your printers show up here." />
          ) : (
            <Table head={["Ref", "Category", "Subject", "Order", "Refund", "Status", "When", "Action"]}>
              {data.complaints.map((c) => (
                <Tr key={c.id}>
                  <Td className="font-mono text-xs font-semibold text-slate-700">{c.code}</Td>
                  <Td className="text-xs text-slate-500">{c.category.replace(/_/g, " ").toLowerCase()}</Td>
                  <Td className="text-slate-600 truncate max-w-[180px]">{c.subject}</Td>
                  <Td className="font-mono text-[11px] text-slate-500">{c.order?.orderCode || "—"}</Td>
                  <Td>
                    {c.refundRequested ? (
                      <span className="inline-flex items-center gap-1 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                        <LuUndo2 size={10} /> {c.order?.costPaise ? inr(c.order.costPaise) : "asked"}
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </Td>
                  <Td><StatusChip status={c.status} /></Td>
                  <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(c.createdAt)}</Td>
                  <Td>
                    <button
                      onClick={() => { setActive(c); setNote(""); }}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-2 py-1 transition-colors cursor-pointer"
                    >
                      {FORWARDABLE.includes(c.status) && c.refundRequested ? "Review" : "View"}
                    </button>
                  </Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setActive(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <p className="font-mono text-xs text-slate-400">{active.code}</p>
                <h2 className="font-bold text-slate-900">{active.subject}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{active.category.replace(/_/g, " ").toLowerCase()}</p>
              </div>
              <StatusChip status={active.status} />
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 mb-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{active.description}</p>
            </div>

            {active.order && (
              <p className="text-xs text-slate-500 mb-4">
                Order <span className="font-mono">{active.order.orderCode}</span>
                {active.order.costPaise != null ? ` · ${inr(active.order.costPaise)}` : ""} · {active.order.status}
              </p>
            )}

            {active.refundRequested ? (
              active.status === "FORWARDED" ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-xs text-sky-800">
                  <p className="flex items-center gap-1.5 font-bold"><LuClock size={13} /> Forwarded to the platform</p>
                  {active.forwardedAt && <p className="mt-1">Sent {dateTime(active.forwardedAt)} — awaiting their decision.</p>}
                </div>
              ) : active.refundId || active.status === "REFUNDED" ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 font-bold">
                  Refund issued by the platform.
                </div>
              ) : FORWARDABLE.includes(active.status) ? (
                <>
                  <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 mb-3 text-xs text-violet-800">
                    <p className="flex items-center gap-1.5 font-bold"><LuUndo2 size={13} /> The customer asked for a refund.</p>
                    <p className="mt-1">Refunds are issued by the platform. Forward this on with any context and they'll decide.</p>
                  </div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Note to the platform (optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="e.g. Printer confirmed jammed, page never came out. Agree with the refund."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 transition-colors resize-y"
                  />
                  <button
                    onClick={forward}
                    disabled={saving}
                    className="mt-4 w-full inline-flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <LuSend size={14} /> Forward to platform
                  </button>
                </>
              ) : null
            ) : (
              <p className="text-xs text-slate-500">
                No refund was requested. Fix the machine if needed — the platform closes the report.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
