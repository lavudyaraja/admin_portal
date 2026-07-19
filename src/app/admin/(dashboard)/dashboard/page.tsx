"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuIndianRupee,
  LuFileText,
  LuUsers,
  LuPrinter,
  LuFileStack,
  LuCoins,
  LuTriangleAlert,
  LuCircleOff,
  LuArrowRight,
  LuInbox,
} from "react-icons/lu";
import {
  apiFetch,
  type Metrics,
  type RevenueResponse,
  type TopPrinter,
} from "@/lib/admin/api";
import { inr, inrCompact, count } from "@/lib/console/format";
import {
  Card,
  CardHeader,
  StatTile,
  Table,
  Td,
  Tr,
  Skeleton,
  ErrorState,
  EmptyState,
  PageHeader,
} from "@/components/console/primitives";
import RevenueChart from "@/components/console/RevenueChart";

type Period = "7d" | "30d" | "90d";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [revenue, setRevenue] = useState<RevenueResponse | null>(null);
  const [period, setPeriod] = useState<Period>("30d");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [m, r] = await Promise.all([
        apiFetch<Metrics>("/admin/metrics"),
        apiFetch<RevenueResponse>(`/admin/revenue?period=${period}`),
      ]);
      setMetrics(m);
      setRevenue(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <Card>
        <ErrorState message={error} onRetry={load} />
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title="Platform overview"
        subtitle="Every vendor, printer and order across the Prinsta network."
      />

      {/* ── Headline stats ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {loading || !metrics ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[116px] rounded-2xl" />)
        ) : (
          <>
            <StatTile
              label="Total revenue"
              value={inrCompact(metrics.totalRevenuePaise)}
              icon={LuIndianRupee}
              tint="mint"
              hint={`${inrCompact(metrics.monthlyRevenuePaise)} this month`}
            />
            <StatTile
              label="This month"
              value={inrCompact(metrics.monthlyRevenuePaise)}
              icon={LuIndianRupee}
              tint="sky"
              delta={metrics.revenueGrowth}
            />
            <StatTile
              label="Total orders"
              value={count(metrics.totalOrders)}
              icon={LuFileText}
              tint="lavender"
              delta={metrics.orderGrowth}
            />
            <StatTile
              label="Orders today"
              value={count(metrics.dailyOrders)}
              icon={LuFileText}
              tint="ice"
              hint={`${count(metrics.monthlyOrders)} this month`}
            />
            <StatTile
              label="Students"
              value={count(metrics.totalUsers)}
              icon={LuUsers}
              tint="violet"
              hint={`+${count(metrics.newUsersToday)} today`}
            />
            <StatTile
              label="Pages printed"
              value={count(metrics.totalPagesPrinted)}
              icon={LuFileStack}
              tint="cream"
            />
            <StatTile
              label="Printers online"
              value={`${metrics.activePrinters}/${metrics.totalPrinters}`}
              icon={LuPrinter}
              tint="aqua"
              hint={`${metrics.offlinePrinters} offline`}
            />
            <StatTile
              label="Points top-ups"
              value={inrCompact(metrics.pointsTopupPaise)}
              icon={LuCoins}
              tint="gold"
            />
          </>
        )}
      </section>

      {/* ── Attention strip — only rendered when something actually needs it ── */}
      {metrics && (metrics.lowPaperCount > 0 || metrics.offlinePrinters > 0 || metrics.failedOrders > 0) && (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {metrics.offlinePrinters > 0 && (
            <AlertCard
              tint="bg-tint-gray"
              icon={<LuCircleOff size={16} className="text-slate-500" />}
              title={`${metrics.offlinePrinters} printer${metrics.offlinePrinters > 1 ? "s" : ""} offline`}
              hint="Vendors can't take orders on these."
              href="/admin/printers"
            />
          )}
          {metrics.lowPaperCount > 0 && (
            <AlertCard
              tint="bg-tint-gold"
              icon={<LuTriangleAlert size={16} className="text-ink-gold" />}
              title={`${metrics.lowPaperCount} printer${metrics.lowPaperCount > 1 ? "s" : ""} low on paper`}
              hint="At or below 20% remaining."
              href="/admin/printers"
            />
          )}
          {metrics.failedOrders > 0 && (
            <AlertCard
              tint="bg-tint-blush"
              icon={<LuTriangleAlert size={16} className="text-ink-blush" />}
              title={`${count(metrics.failedOrders)} failed order${metrics.failedOrders > 1 ? "s" : ""}`}
              hint="May need refunds or a reprint."
              href="/admin/orders?status=FAILED"
            />
          )}
        </section>
      )}

      {/* ── Revenue trend ── */}
      <Card className="mb-4">
        <CardHeader
          title="Revenue"
          subtitle={`Completed orders, last ${period === "7d" ? "7" : period === "90d" ? "90" : "30"} days`}
          action={
            <div className="flex bg-slate-100 rounded-xl p-0.5 gap-0.5">
              {(["7d", "30d", "90d"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    period === p ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          }
        />
        <div className="p-4">
          {loading || !revenue ? (
            <Skeleton className="h-[220px] rounded-xl" />
          ) : (
            <RevenueChart data={revenue.chartData} />
          )}
        </div>
      </Card>

      {/* ── Top printers + order mix ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Top earning printers"
            subtitle="By revenue in the selected period"
            action={
              <Link
                href="/admin/printers"
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
              >
                All printers <LuArrowRight size={12} />
              </Link>
            }
          />
          {loading || !revenue ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          ) : revenue.topPrinters.length === 0 ? (
            <EmptyState icon={LuInbox} title="No revenue yet" hint="Top printers appear once orders complete." />
          ) : (
            <TopPrinterList rows={revenue.topPrinters} />
          )}
        </Card>

        <Card>
          <CardHeader title="Order outcomes" subtitle="All time" />
          {loading || !metrics ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          ) : (
            <div className="p-4 space-y-2">
              <OutcomeRow label="Completed" value={metrics.completedOrders} total={metrics.totalOrders} tint="bg-tint-mint" />
              <OutcomeRow label="Failed" value={metrics.failedOrders} total={metrics.totalOrders} tint="bg-tint-blush" />
              <OutcomeRow label="Cancelled" value={metrics.cancelledOrders} total={metrics.totalOrders} tint="bg-tint-peach" />
              <OutcomeRow
                label="In progress"
                value={Math.max(
                  0,
                  metrics.totalOrders - metrics.completedOrders - metrics.failedOrders - metrics.cancelledOrders
                )}
                total={metrics.totalOrders}
                tint="bg-tint-sky"
              />
            </div>
          )}
        </Card>
      </section>
    </>
  );
}

// ── Pieces ────────────────────────────────────────────────────────────────────

function AlertCard({
  tint,
  icon,
  title,
  hint,
  href,
}: {
  tint: string;
  icon: React.ReactNode;
  title: string;
  hint: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`${tint} border border-slate-200/60 rounded-2xl px-4 py-3 flex items-center gap-3 hover:border-slate-300 transition-colors group`}
    >
      <span className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-800 truncate">{title}</p>
        <p className="text-[11px] text-slate-500 truncate">{hint}</p>
      </div>
      <LuArrowRight size={14} className="text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
    </Link>
  );
}

/** Ranked bars — magnitude against one axis, so one hue at varying width. */
function TopPrinterList({ rows }: { rows: TopPrinter[] }) {
  const max = Math.max(1, ...rows.map((r) => r.revenuePaise));
  return (
    <Table head={["#", "Printer", "Orders", "Revenue"]}>
      {rows.map((r, i) => (
        <Tr key={r.printerId || i}>
          <Td className="w-8 text-slate-400 font-bold tabular-nums">{i + 1}</Td>
          <Td className="min-w-[180px]">
            <p className="font-semibold text-slate-700 truncate max-w-[220px]">{r.name}</p>
            {/* The bar is the magnitude encoding; the row stays scannable. */}
            <div className="h-1.5 rounded-full bg-slate-100 mt-1.5 overflow-hidden max-w-[220px]">
              <div
                className="h-full rounded-full bg-ink-sky"
                style={{ width: `${Math.max(3, (r.revenuePaise / max) * 100)}%` }}
              />
            </div>
          </Td>
          <Td className="tabular-nums">{count(r.orders)}</Td>
          <Td className="font-bold text-slate-800 tabular-nums whitespace-nowrap">{inr(r.revenuePaise)}</Td>
        </Tr>
      ))}
    </Table>
  );
}

function OutcomeRow({ label, value, total, tint }: { label: string; value: number; total: number; tint: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className={`${tint} rounded-xl px-3.5 py-2.5 border border-slate-200/60`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-700">{label}</span>
        <span className="text-xs font-black text-slate-900 tabular-nums">
          {count(value)} <span className="text-slate-400 font-bold">· {pct}%</span>
        </span>
      </div>
    </div>
  );
}
