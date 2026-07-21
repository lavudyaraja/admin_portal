"use client";

// Refund requests from customers.
//
// The shop decides first, because they are the ones who saw the machine and the
// paper. Approving credits the customer's points immediately and cannot be
// undone from here — which is why the confirm step spells out the amount.
//
// A rejection requires a reason. That is enforced by the server too, but it
// matters most here: a "no" with no explanation is the single biggest cause of
// a customer escalating to platform support.
import { useCallback, useEffect, useState } from "react";
import {
  LuUndo2, LuRefreshCw, LuCircleCheck, LuCircleX, LuTriangleAlert, LuClock, LuInbox,
} from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import { inr, count, dateTime } from "@/lib/console/format";
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
  ESCALATION_REJECTED: "blush",
  ESCALATED: "peach",
  CANCELLED: "gray",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Awaiting you",
  APPROVED: "Refunded",
  REJECTED: "Turned down",
  ESCALATED: "With support",
  ESCALATION_APPROVED: "Refunded by support",
  ESCALATION_REJECTED: "Closed by support",
  CANCELLED: "Withdrawn",
};

const FILTERS = [
  { value: "PENDING", label: "Awaiting you" },
  { value: "", label: "All requests" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Turned down" },
  { value: "ESCALATED", label: "Escalated" },
];

export default function RefundRequestsPage() {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState("PENDING");
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
      const res = await apiFetch<{ requests: RefundRequest[]; stats: Stats }>(
        `/refund-requests/vendor/queue?${params}`
      );
      setRequests(res.requests || []);
      setStats(res.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load refund requests.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(decision: "APPROVE" | "REJECT") {
    if (!active) return;
    // Mirrors the server's rule, so the customer is never told "no" with no
    // reason and the vendor finds out before the round trip.
    if (decision === "REJECT" && !note.trim()) {
      setFormError("Please tell the customer why you're turning this down.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      await apiFetch(`/refund-requests/vendor/${active.id}/decide`, {
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
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <PageHeader
        title="Refund Requests"
        subtitle="Customers asking for their money back. You decide first."
        action={
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
          >
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {!stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[116px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatTile
              label="Awaiting you"
              value={count(stats.pending)}
              icon={LuClock}
              tint={stats.pending > 0 ? "gold" : "gray"}
              hint="answer these first"
            />
            <StatTile
              label="Approved"
              value={count(stats.approved)}
              icon={LuCircleCheck}
              tint="mint"
              hint="refunded to customers"
            />
            <StatTile
              label="Turned down"
              value={count(stats.rejected)}
              icon={LuCircleX}
              tint="gray"
              hint="declined"
            />
            <StatTile
              label="Escalated"
              value={count(stats.escalated)}
              icon={LuTriangleAlert}
              tint={stats.escalated > 0 ? "blush" : "gray"}
              hint="platform support is reviewing"
            />
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
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
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={filter === "PENDING" ? LuInbox : LuUndo2}
            title={filter === "PENDING" ? "Nothing waiting on you" : "No requests here"}
            hint={
              filter === "PENDING"
                ? "When a customer asks for a refund, it lands here for your decision."
                : "Try a different filter."
            }
          />
        ) : (
          <Table head={["Ref", "Customer", "Order", "Reason", "Amount", "Status", "Raised", "Action"]}>
            {requests.map((r) => (
              <Tr key={r.id}>
                <Td className="font-mono text-xs font-semibold text-slate-700">{r.code}</Td>
                <Td>
                  <p className="text-sm text-slate-700 truncate max-w-[130px]">
                    {r.user?.name || "—"}
                  </p>
                  {r.user?.phone && (
                    <p className="text-[11px] text-slate-400 tabular-nums">{r.user.phone}</p>
                  )}
                </Td>
                <Td className="font-mono text-[11px] text-slate-500">
                  {r.order?.orderCode || "—"}
                  {r.order?.printer && (
                    <span className="block text-[10px] text-slate-400 font-sans truncate max-w-[110px]">
                      {r.order.printer.name}
                    </span>
                  )}
                </Td>
                <Td className="text-xs text-slate-600 max-w-[150px]">
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
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-2 py-1 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {r.status === "PENDING" ? "Review" : "Open"}
                  </button>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      {/* Decision drawer */}
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
                <p className="text-xs text-slate-500 mt-0.5">
                  {active.user?.name} · order{" "}
                  <span className="font-mono">{active.order?.orderCode}</span> ·{" "}
                  {dateTime(active.createdAt)}
                </p>
              </div>
              <Chip
                label={STATUS_LABELS[active.status] || active.status}
                tint={STATUS_TINT[active.status] || "gray"}
              />
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 mb-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{active.description}</p>
            </div>

            {active.order && (
              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Refund amount
                  </p>
                  <p className="text-lg font-black text-slate-900 tabular-nums mt-0.5">
                    {inr(active.order.costPaise)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Job
                  </p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">
                    {active.order.pagesToPrint} pages
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {active.order.printer?.name || "unassigned"}
                  </p>
                </div>
              </div>
            )}

            {/* Everything already said about this request, in order. */}
            {active.decisionNote && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 mb-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Your decision
                </p>
                <p className="text-xs text-slate-600 mt-1">{active.decisionNote}</p>
              </div>
            )}
            {active.escalationNote && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-3">
                <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  Customer escalated
                </p>
                <p className="text-xs text-amber-800 mt-1">{active.escalationNote}</p>
              </div>
            )}
            {active.staffNote && (
              <div className="rounded-xl bg-sky-50 border border-sky-200 p-3 mb-3">
                <p className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                  Platform support
                </p>
                <p className="text-xs text-sky-800 mt-1">{active.staffNote}</p>
              </div>
            )}

            {active.status === "PENDING" ? (
              <>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 mt-4">
                  Message to the customer
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Required if you're turning this down."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 transition-colors resize-y"
                />

                {formError && <p className="text-xs text-rose-600 mt-2 font-semibold">{formError}</p>}

                <p className="text-[11px] text-slate-400 mt-2">
                  Approving credits {inr(active.order?.costPaise || 0)} back to the customer&apos;s
                  points straight away. It can&apos;t be undone from here.
                </p>

                <div className="flex flex-wrap gap-2 mt-5">
                  <button
                    onClick={() => decide("APPROVE")}
                    disabled={saving}
                    className="flex-1 min-w-32 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <LuCircleCheck size={14} /> Approve refund
                  </button>
                  <button
                    onClick={() => decide("REJECT")}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <LuCircleX size={14} /> Turn down
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-4">
                <p className="text-xs text-slate-400">
                  {active.status === "ESCALATED"
                    ? "The customer disputed your decision. Platform support is reviewing it — you don't need to do anything."
                    : "This request has been answered. Decisions can't be changed."}
                </p>
                <button
                  onClick={() => setActive(null)}
                  className="mt-4 w-full inline-flex items-center justify-center border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
