"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LuIndianRupee,
  LuFileText,
  LuFileStack,
  LuPalette,
  LuInbox,
} from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import { inr, inrCompact, count } from "@/lib/console/format";
import {
  Card,
  CardHeader,
  StatTile,
  Table,
  Td,
  Tr,
  Skeleton,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/console/primitives";
import RevenueChart, { type RevenuePoint } from "@/components/console/RevenueChart";

interface TopPrinter {
  printerId: string | null;
  name: string;
  revenuePaise: number;
  orders: number;
}

interface RevenueData {
  chartData: RevenuePoint[];
  topPrinters: TopPrinter[];
}

type Period = "7d" | "30d" | "90d";

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [period, setPeriod] = useState<Period>("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<RevenueData>(`/admin/revenue?period=${period}`));
    } catch (err) {
      // The previous version swallowed this, so a failed request looked exactly
      // like a shop that had simply earned nothing yet.
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

  const chart = data?.chartData || [];
  const totalRev = chart.reduce((s, d) => s + d.revenuePaise, 0);
  const totalOrders = chart.reduce((s, d) => s + d.orders, 0);
  const totalPages = chart.reduce((s, d) => s + d.pages, 0);
  const colorOrders = chart.reduce((s, d) => s + d.colorOrders, 0);
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;

  return (
    <>
      <PageHeader
        title="Revenue"
        subtitle="Completed-order revenue, and what drove it."
      />

      {/* ── Period totals ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[116px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatTile
              label="Revenue"
              value={inrCompact(totalRev)}
              icon={LuIndianRupee}
              tint="mint"
              hint={`Last ${days} days`}
            />
            <StatTile
              label="Orders"
              value={count(totalOrders)}
              icon={LuFileText}
              tint="lavender"
              hint={totalOrders > 0 ? `${inr(Math.round(totalRev / totalOrders))} average` : undefined}
            />
            <StatTile
              label="Pages printed"
              value={count(totalPages)}
              icon={LuFileStack}
              tint="sky"
            />
            <StatTile
              label="Colour orders"
              value={count(colorOrders)}
              icon={LuPalette}
              tint="gold"
              hint={
                totalOrders > 0
                  ? `${Math.round((colorOrders / totalOrders) * 100)}% of orders`
                  : undefined
              }
            />
          </>
        )}
      </section>

      {/* ── Trend ── */}
      <Card className="mb-4">
        <CardHeader
          title="Daily revenue"
          subtitle={`Completed orders, last ${days} days`}
          action={
            <div className="flex bg-slate-100 rounded-xl p-0.5 gap-0.5">
              {(["7d", "30d", "90d"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    period === p
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          }
        />
        <div className="p-4">
          {loading ? (
            <Skeleton className="h-[220px] rounded-xl" />
          ) : chart.length === 0 ? (
            <EmptyState
              icon={LuInbox}
              title="No revenue in this period"
              hint="Completed orders show up here the day they print."
            />
          ) : (
            <RevenueChart data={chart} />
          )}
        </div>
      </Card>

      {/* ── Top printers ── */}
      <Card>
        <CardHeader title="Top earning printers" subtitle="By revenue in the selected period" />
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9" />
            ))}
          </div>
        ) : !data?.topPrinters.length ? (
          <EmptyState
            icon={LuInbox}
            title="No revenue yet"
            hint="Top printers appear once orders complete."
          />
        ) : (
          <TopPrinterTable rows={data.topPrinters} />
        )}
      </Card>
    </>
  );
}

/** Ranked bars — magnitude against one axis, so one hue at varying width. */
function TopPrinterTable({ rows }: { rows: TopPrinter[] }) {
  const max = Math.max(1, ...rows.map((r) => r.revenuePaise));
  return (
    <Table head={["#", "Printer", "Orders", "Revenue"]}>
      {rows.map((r, i) => (
        <Tr key={r.printerId || i}>
          <Td className="w-8 text-slate-400 font-bold tabular-nums">{i + 1}</Td>
          <Td className="min-w-[200px]">
            <p className="font-semibold text-slate-700 truncate max-w-[260px]">{r.name}</p>
            <div className="h-1.5 rounded-full bg-slate-100 mt-1.5 overflow-hidden max-w-[260px]">
              <div
                className="h-full rounded-full bg-ink-sky"
                style={{ width: `${Math.max(3, (r.revenuePaise / max) * 100)}%` }}
              />
            </div>
          </Td>
          <Td className="tabular-nums">{count(r.orders)}</Td>
          <Td className="font-bold text-slate-800 tabular-nums whitespace-nowrap">
            {inr(r.revenuePaise)}
          </Td>
        </Tr>
      ))}
    </Table>
  );
}
