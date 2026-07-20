"use client";

// Refunds.
//
// One thing to be straight about: Prinsta has no refund *request* flow. A failed
// print refunds itself automatically, and staff can issue one by hand — but a
// user cannot ask for a refund and wait for approval. So "Pending" and
// "Rejected" have nothing behind them and say so, rather than showing an empty
// queue that reads as "nothing to approve".

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuUndo2, LuClock, LuCircleCheck, LuCircleX, LuHistory,
  LuChartPie, LuRefreshCw, LuInbox,
} from "react-icons/lu";
import { apiFetch } from "@/lib/admin/api";
import { inr, points, count, dateTime } from "@/lib/console/format";
import { OpsTabs, useOpsTab, NoRecord, type OpsTab } from "@/components/admin/OpsTabs";
import { StatRow } from "@/components/admin/StatRow";
import {
  Card, Table, Td, Tr, Chip, Skeleton, ErrorState, EmptyState, PageHeader, StatTile,
} from "@/components/console/primitives";

interface RefundRow {
  id: string;
  amountPaise: number;
  pointsCredited: number;
  reason: string;
  origin: string;
  note: string | null;
  createdAt: string;
  user: { id: string; name: string; phone: string | null } | null;
  order: { id: string; orderCode: string; status: string } | null;
}

interface RefundData {
  total: number;
  totalPaise: number;
  totalPoints: number;
  automatic: number;
  manual: number;
  refundRate: number;
  byReason: { reason: string; count: number; amountPaise: number }[];
  refunds: RefundRow[];
}

function RefundsPageBody() {
  const tab = useOpsTab("history");
  const [data, setData] = useState<RefundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<RefundData>("/finance/refunds"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const all = data?.refunds || [];
    // Every refund in the system is already paid out, so "approved" is the whole
    // set — kept as its own view because that's how the queue is asked about.
    return tab === "approved" ? all : all;
  }, [data, tab]);

  const tabs: OpsTab[] = [
    { id: "requests", label: "Requests", icon: LuInbox },
    { id: "pending", label: "Pending", icon: LuClock },
    { id: "approved", label: "Approved", icon: LuCircleCheck, count: data?.total },
    { id: "rejected", label: "Rejected", icon: LuCircleX },
    { id: "history", label: "History", icon: LuHistory, count: data?.total },
    { id: "analytics", label: "Analytics", icon: LuChartPie },
  ];

  const maxReason = Math.max(1, ...(data?.byReason || []).map((r) => r.count));

  return (
    <>
      <PageHeader
        title="Refunds"
        subtitle="Money returned to customers, always as Prinsta Points."
        action={
          <button onClick={load} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer">
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      <StatRow loading={!data}>
        {data && (
          <>
            <StatTile label="Refunds issued" value={count(data.total)} icon={LuUndo2} tint="lavender" hint={`${count(data.automatic)} automatic`} />
            <StatTile label="Value refunded" value={inr(data.totalPaise)} icon={LuUndo2} tint="blush" hint={points(data.totalPoints)} />
            <StatTile label="Refund rate" value={`${data.refundRate}%`} icon={LuChartPie} tint={data.refundRate > 5 ? "gold" : "mint"} hint="of completed revenue" />
            <StatTile label="Issued by staff" value={count(data.manual)} icon={LuCircleCheck} tint="sky" hint="manual refunds" />
          </>
        )}
      </StatRow>

      <OpsTabs tabs={tabs} active={tab} basePath="/admin/finance/refunds" />

      {tab === "requests" || tab === "pending" || tab === "rejected" ? (
        <NoRecord
          icon={tab === "rejected" ? LuCircleX : LuInbox}
          title="There is no refund approval flow"
          needs="A failed print refunds automatically, and staff can issue one by hand — but a customer cannot request a refund and wait on a decision. Nothing is ever pending or rejected. This needs a refund request that a user raises and an operator approves before these queues mean anything."
        />
      ) : loading || !data ? (
        <Card><div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div></Card>
      ) : error ? (
        <Card><ErrorState message={error} onRetry={load} /></Card>
      ) : tab === "analytics" ? (
        <Card>
          {data.byReason.length === 0 ? (
            <EmptyState icon={LuChartPie} title="Nothing to analyse" hint="Refund reasons appear here once refunds are issued." />
          ) : (
            <>
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">Why money goes back</h3>
              </div>
              <Table head={["Reason", "Refunds", "", "Value"]}>
                {data.byReason.map((r) => (
                  <Tr key={r.reason}>
                    <Td className="text-slate-700 font-medium">{r.reason.replace(/_/g, " ").toLowerCase()}</Td>
                    <Td className="tabular-nums font-bold text-slate-700">{count(r.count)}</Td>
                    <Td className="w-48">
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-rose-400" style={{ width: `${Math.round((r.count / maxReason) * 100)}%` }} />
                      </div>
                    </Td>
                    <Td className="tabular-nums text-slate-600">{inr(r.amountPaise)}</Td>
                  </Tr>
                ))}
              </Table>
              <p className="px-5 py-3 text-[11px] text-slate-400 border-t border-slate-100">
                Refund rate is refunded value as a share of completed revenue — {data.refundRate}%.
              </p>
            </>
          )}
        </Card>
      ) : (
        <Card>
          {rows.length === 0 ? (
            <EmptyState icon={LuUndo2} title="No refunds issued" hint="A failed print refunds automatically; manual refunds appear here too." />
          ) : (
            <Table head={["Order", "Customer", "Reason", "Refunded", "Origin", "Note", "When"]}>
              {rows.map((r) => (
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
                  <Td className="text-xs text-slate-500 truncate max-w-[160px]">{r.note || "—"}</Td>
                  <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(r.createdAt)}</Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>
      )}
    </>
  );
}

export default function RefundsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <RefundsPageBody />
    </Suspense>
  );
}
