"use client";

// Transactions: money orders (UPI or points) and the points ledger behind them.
//
// "Failed" here means an order that took payment and then didn't deliver, plus
// cancellations — those are the ones worth chasing, not merely unpaid carts.

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuArrowLeftRight, LuSmartphone, LuCoins, LuTriangleAlert,
  LuClock, LuScrollText, LuSearch, LuRefreshCw,
} from "react-icons/lu";
import { apiFetch } from "@/lib/admin/api";
import { inr, points, count, ledgerPoints, dateTime } from "@/lib/console/format";
import { OpsTabs, useOpsTab, type OpsTab } from "@/components/admin/OpsTabs";
import { StatRow } from "@/components/admin/StatRow";
import {
  Card, Table, Td, Tr, StatusChip, Chip, Skeleton, ErrorState, EmptyState, PageHeader, StatTile,
} from "@/components/console/primitives";

interface OrderTxn {
  id: string;
  orderCode: string;
  status: string;
  costPaise: number;
  paymentMethod: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  user: { id: string; name: string; phone: string | null } | null;
  printer: { name: string; uniquePrinterId: string } | null;
}

interface LedgerRow {
  id: string;
  type: "CREDIT" | "DEBIT";
  amountPoints: number;
  balancePoints: number;
  amountPaise: number;
  balancePaise: number;
  description: string;
  razorpayId: string | null;
  orderId: string | null;
  createdAt: string;
  user: { id: string; name: string } | null;
}

interface TxnData {
  total: number;
  upi: { count: number; revenuePaise: number };
  points: { count: number; revenuePaise: number };
  failed: number;
  pending: number;
  orders: OrderTxn[];
  ledger: LedgerRow[];
}

function TransactionsPageBody() {
  const tab = useOpsTab("all");
  const [data, setData] = useState<TxnData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      if (search) qs.set("search", search);
      setData(await apiFetch<TxnData>(`/finance/transactions?${qs}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const rows = useMemo(() => {
    const all = data?.orders || [];
    switch (tab) {
      case "upi": return all.filter((o) => o.paymentMethod === "UPI");
      case "points": return all.filter((o) => o.paymentMethod === "POINTS");
      case "failed": return all.filter((o) => o.status === "FAILED" || o.status === "CANCELLED");
      case "pending": return all.filter((o) => o.status === "PENDING_PAYMENT");
      default: return all;
    }
  }, [data, tab]);

  const tabs: OpsTab[] = [
    { id: "all", label: "All", icon: LuArrowLeftRight, count: data?.total },
    { id: "upi", label: "UPI", icon: LuSmartphone, count: data?.upi.count },
    { id: "points", label: "Points", icon: LuCoins, count: data?.points.count },
    { id: "failed", label: "Failed", icon: LuTriangleAlert, count: data?.failed },
    { id: "pending", label: "Pending", icon: LuClock, count: data?.pending },
    { id: "logs", label: "Transaction Logs", icon: LuScrollText, count: data?.ledger.length },
  ];

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Every payment taken, by method and outcome."
        action={
          <button onClick={load} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer">
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      <StatRow loading={!data}>
        {data && (
          <>
            <StatTile label="Transactions" value={count(data.total)} icon={LuArrowLeftRight} tint="lavender" hint="all orders" />
            <StatTile label="Paid by UPI" value={count(data.upi.count)} icon={LuSmartphone} tint="sky" hint={inr(data.upi.revenuePaise)} />
            <StatTile label="Paid by points" value={count(data.points.count)} icon={LuCoins} tint="mint" hint={inr(data.points.revenuePaise)} />
            <StatTile label="Failed" value={count(data.failed)} icon={LuTriangleAlert} tint={data.failed > 0 ? "blush" : "gray"} hint={`${count(data.pending)} unpaid`} />
          </>
        )}
      </StatRow>

      <OpsTabs tabs={tabs} active={tab} basePath="/admin/finance/transactions" />

      {tab !== "logs" && (
        <div className="relative flex-1 min-w-[200px] max-w-sm mb-4">
          <LuSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order code or customer name…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-slate-400 transition-colors"
          />
        </div>
      )}

      <Card>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading || !data ? (
          <div className="p-5 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : tab === "logs" ? (
          data.ledger.length === 0 ? (
            <EmptyState icon={LuScrollText} title="No ledger entries" hint="Points movements appear here." />
          ) : (
            <Table head={["User", "Type", "Description", "Amount", "Balance after", "Gateway ref", "When"]}>
              {data.ledger.map((l) => (
                <Tr key={l.id}>
                  <Td>
                    {l.user ? (
                      <Link href={`/admin/management/users/${l.user.id}`} className="text-slate-700 hover:underline text-sm">{l.user.name}</Link>
                    ) : "—"}
                  </Td>
                  <Td><Chip label={l.type} tint={l.type === "CREDIT" ? "mint" : "blush"} /></Td>
                  <Td className="text-slate-600 truncate max-w-[200px]">{l.description}</Td>
                  <Td className={`tabular-nums font-bold ${l.type === "CREDIT" ? "text-emerald-600" : "text-rose-600"}`}>
                    {l.type === "CREDIT" ? "+" : "−"}{points(ledgerPoints(l))}
                  </Td>
                  <Td className="tabular-nums text-slate-600">{points(ledgerPoints(l.balancePoints, l.balancePaise))}</Td>
                  <Td className="text-[11px] font-mono text-slate-400 truncate max-w-[140px]">{l.razorpayId || "—"}</Td>
                  <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(l.createdAt)}</Td>
                </Tr>
              ))}
            </Table>
          )
        ) : rows.length === 0 ? (
          <EmptyState
            icon={LuArrowLeftRight}
            title={`No ${tabs.find((t) => t.id === tab)?.label.toLowerCase()} transactions`}
            hint={search ? "Try a different search." : "Transactions in this state will appear here."}
          />
        ) : (
          <Table head={["Order", "Customer", "Method", "Amount", "Status", "Gateway ref", "When"]}>
            {rows.map((o) => (
              <Tr key={o.id}>
                <Td>
                  <p className="font-mono text-xs font-semibold text-slate-700">{o.orderCode}</p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{o.printer?.name || "Unassigned"}</p>
                </Td>
                <Td>
                  {o.user ? (
                    <Link href={`/admin/management/users/${o.user.id}`} className="text-slate-700 hover:underline text-sm">{o.user.name}</Link>
                  ) : "—"}
                </Td>
                <Td><Chip label={o.paymentMethod || "—"} tint={o.paymentMethod === "UPI" ? "sky" : "mint"} /></Td>
                <Td className="tabular-nums font-semibold text-slate-700">{inr(o.costPaise)}</Td>
                <Td><StatusChip status={o.status} /></Td>
                <Td className="text-[11px] font-mono text-slate-400 truncate max-w-[150px]">
                  {o.razorpayPaymentId || o.razorpayOrderId || "—"}
                </Td>
                <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(o.createdAt)}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <TransactionsPageBody />
    </Suspense>
  );
}
