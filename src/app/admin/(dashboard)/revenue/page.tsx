"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LuIndianRupee, LuFileText, LuFileStack, LuChartNoAxesColumn } from "react-icons/lu";
import { apiFetch, type RevenueResponse } from "@/lib/admin/api";
import { inr, inrCompact, count } from "@/lib/console/format";
import {
  Card, CardHeader, StatTile, Table, Td, Tr, Skeleton, ErrorState, EmptyState, PageHeader,
} from "@/components/console/primitives";
import RevenueChart from "@/components/console/RevenueChart";

type Period = "7d" | "30d" | "90d";

export default function RevenuePage() {
  const [data, setData] = useState<RevenueResponse | null>(null);
  const [period, setPeriod] = useState<Period>("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<RevenueResponse>(`/admin/revenue?period=${period}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  // Period totals, derived rather than fetched — the chart series already has
  // every day in the window.
  const totals = useMemo(() => {
    const d = data?.chartData || [];
    const revenue = d.reduce((s, p) => s + p.revenuePaise, 0);
    const orders = d.reduce((s, p) => s + p.orders, 0);
    const pages = d.reduce((s, p) => s + p.pages, 0);
    const colorOrders = d.reduce((s, p) => s + p.colorOrders, 0);
    return {
      revenue,
      orders,
      pages,
      colorShare: orders === 0 ? 0 : Math.round((colorOrders / orders) * 100),
      avgOrder: orders === 0 ? 0 : Math.round(revenue / orders),
    };
  }, [data]);

  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;

  return (
    <>
      <PageHeader
        title="Revenue"
        subtitle={`Completed orders across the network, last ${days} days.`}
        action={
          <div className="flex bg-slate-100 rounded-xl p-0.5 gap-0.5">
            {(["7d", "30d", "90d"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  period === p ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        }
      />

      {error ? (
        <Card><ErrorState message={error} onRetry={load} /></Card>
      ) : (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[116px] rounded-2xl" />)
            ) : (
              <>
                <StatTile label={`Revenue · ${period}`} value={inrCompact(totals.revenue)} icon={LuIndianRupee} tint="mint" />
                <StatTile label="Orders" value={count(totals.orders)} icon={LuFileText} tint="sky" />
                <StatTile label="Pages" value={count(totals.pages)} icon={LuFileStack} tint="cream" />
                <StatTile
                  label="Avg order"
                  value={inr(totals.avgOrder)}
                  icon={LuChartNoAxesColumn}
                  tint="lavender"
                  hint={`${totals.colorShare}% colour`}
                />
              </>
            )}
          </section>

          <Card className="mb-4">
            <CardHeader title="Daily revenue" subtitle={`Last ${days} days`} />
            <div className="p-4">
              {loading || !data ? <Skeleton className="h-[220px] rounded-xl" /> : <RevenueChart data={data.chartData} />}
            </div>
          </Card>

          <Card>
            <CardHeader title="Top earning printers" subtitle={`By revenue, last ${days} days`} />
            {loading || !data ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9" />)}
              </div>
            ) : data.topPrinters.length === 0 ? (
              <EmptyState icon={LuChartNoAxesColumn} title="No revenue in this period" />
            ) : (
              <Table head={["#", "Printer", "Orders", "Revenue", "Share"]}>
                {data.topPrinters.map((p, i) => {
                  const share = totals.revenue === 0 ? 0 : Math.round((p.revenuePaise / totals.revenue) * 100);
                  return (
                    <Tr key={p.printerId || i}>
                      <Td className="w-8 text-slate-400 font-bold tabular-nums">{i + 1}</Td>
                      <Td className="font-semibold text-slate-700">
                        <span className="truncate block max-w-[240px]">{p.name}</span>
                      </Td>
                      <Td className="tabular-nums">{count(p.orders)}</Td>
                      <Td className="font-bold text-slate-800 tabular-nums whitespace-nowrap">{inr(p.revenuePaise)}</Td>
                      <Td className="min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden max-w-[90px]">
                            <div className="h-full rounded-full bg-ink-sky" style={{ width: `${Math.max(2, share)}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 tabular-nums">{share}%</span>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </Table>
            )}
          </Card>
        </>
      )}
    </>
  );
}
