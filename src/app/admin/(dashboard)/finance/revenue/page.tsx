"use client";

// Revenue, cut the ways an operator asks for it.
//
// Every figure is completed orders only — money that was actually earned. The
// daily series is seeded for the whole window so a quiet day is a zero in the
// chart, not a gap that makes the line lie.

import { Suspense, useCallback, useEffect, useState } from "react";
import {
  LuIndianRupee, LuCalendar, LuCalendarDays, LuCalendarRange,
  LuStore, LuMapPin, LuTrendingUp, LuLayers, LuRefreshCw,
} from "react-icons/lu";
import { apiFetch } from "@/lib/admin/api";
import { inr, count, dateOnly } from "@/lib/console/format";
import { OpsTabs, useOpsTab, type OpsTab } from "@/components/admin/OpsTabs";
import { StatRow } from "@/components/admin/StatRow";
import {
  Card, Table, Td, Tr, Skeleton, ErrorState, EmptyState, PageHeader, StatTile, Delta,
} from "@/components/console/primitives";

interface Bucket { revenuePaise: number; orders: number; pages?: number }
interface DayRow { date: string; revenuePaise: number; orders: number; pages: number; bw: number; color: number }
interface RevenueData {
  total: Bucket & { pages: number };
  today: Bucket;
  week: Bucket;
  month: Bucket;
  lastMonth: Bucket;
  monthGrowth: number | null;
  averageOrderPaise: number;
  daily: DayRow[];
  weekly: { weekStart: string; revenuePaise: number; orders: number }[];
  monthly: { month: string; revenuePaise: number; orders: number }[];
  byVendor: { vendorId: string | null; name: string; revenuePaise: number; orders: number; pages: number }[];
  byLocation: { location: string; revenuePaise: number; orders: number }[];
  periodDays: number;
}

/** A bar sized against the biggest row, so magnitudes are comparable at a glance. */
function Bar({ value, max, tint = "bg-sky-500" }: { value: number; max: number; tint?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden w-full min-w-24">
      <div className={`h-full rounded-full ${tint}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function RevenuePageBody() {
  const tab = useOpsTab("total");
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("30d");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<RevenueData>(`/finance/revenue?period=${period}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const tabs: OpsTab[] = [
    { id: "total", label: "Total", icon: LuLayers },
    { id: "daily", label: "Daily", icon: LuCalendar },
    { id: "weekly", label: "Weekly", icon: LuCalendarDays },
    { id: "monthly", label: "Monthly", icon: LuCalendarRange },
    { id: "vendor", label: "By Vendor", icon: LuStore, count: data?.byVendor.length },
    { id: "city", label: "By Location", icon: LuMapPin, count: data?.byLocation.length },
    { id: "trends", label: "Trends", icon: LuTrendingUp },
  ];

  const maxDaily = Math.max(1, ...(data?.daily || []).map((d) => d.revenuePaise));
  const maxVendor = Math.max(1, ...(data?.byVendor || []).map((v) => v.revenuePaise));
  const maxLocation = Math.max(1, ...(data?.byLocation || []).map((v) => v.revenuePaise));

  return (
    <>
      <PageHeader
        title="Revenue"
        subtitle="Earnings from completed orders only — nothing pending is counted."
        action={
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none focus:border-slate-400 cursor-pointer"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="365d">Last year</option>
            </select>
            <button onClick={load} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer">
              <LuRefreshCw size={13} /> Refresh
            </button>
          </div>
        }
      />

      <StatRow loading={!data}>
        {data && (
          <>
            <StatTile label="Total revenue" value={inr(data.total.revenuePaise)} icon={LuIndianRupee} tint="mint" hint={`${count(data.total.orders)} completed orders`} />
            <StatTile label="Today" value={inr(data.today.revenuePaise)} icon={LuCalendar} tint="sky" hint={`${count(data.today.orders)} orders`} />
            <StatTile label="This month" value={inr(data.month.revenuePaise)} icon={LuCalendarRange} tint="lavender" hint={`vs ${inr(data.lastMonth.revenuePaise)} last month`} />
            <StatTile label="Average order" value={inr(data.averageOrderPaise)} icon={LuTrendingUp} tint="gold" hint={`${count(data.total.pages)} pages printed`} />
          </>
        )}
      </StatRow>

      <OpsTabs tabs={tabs} active={tab} basePath="/admin/finance/revenue" />

      <Card>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading || !data ? (
          <div className="p-5 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : tab === "total" ? (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Figure label="All time" value={inr(data.total.revenuePaise)} sub={`${count(data.total.orders)} orders`} />
            <Figure label="Today" value={inr(data.today.revenuePaise)} sub={`${count(data.today.orders)} orders`} />
            <Figure label="Last 7 days" value={inr(data.week.revenuePaise)} sub={`${count(data.week.orders)} orders`} />
            <Figure label="This month" value={inr(data.month.revenuePaise)} sub={`${count(data.month.orders)} orders`} />
            <Figure label="Last month" value={inr(data.lastMonth.revenuePaise)} sub={`${count(data.lastMonth.orders)} orders`} />
            <Figure label="Average order" value={inr(data.averageOrderPaise)} sub="per completed order" />
            <Figure label="Pages printed" value={count(data.total.pages)} sub="completed orders" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Month on month</p>
              {data.monthGrowth === null ? (
                <>
                  <p className="text-xl font-black text-slate-400 mt-1">—</p>
                  {/* A percentage change off a zero base isn't a number. */}
                  <p className="text-xs text-slate-400 mt-0.5">no last-month revenue to compare</p>
                </>
              ) : (
                <>
                  <div className="mt-1"><Delta value={data.monthGrowth} /></div>
                  <p className="text-xs text-slate-400 mt-0.5">vs last month</p>
                </>
              )}
            </div>
          </div>
        ) : tab === "daily" || tab === "trends" ? (
          data.daily.every((d) => d.revenuePaise === 0) ? (
            <EmptyState icon={LuCalendar} title="No revenue in this window" hint="Try a longer period." />
          ) : (
            <Table head={["Date", "Revenue", "", "Orders", "Pages", "B&W / Colour"]}>
              {[...data.daily].reverse().filter((d) => tab === "daily" || d.revenuePaise > 0).map((d) => (
                <Tr key={d.date}>
                  <Td className="text-xs text-slate-600 whitespace-nowrap">{dateOnly(d.date)}</Td>
                  <Td className="tabular-nums font-semibold text-slate-700">{inr(d.revenuePaise)}</Td>
                  <Td className="w-40"><Bar value={d.revenuePaise} max={maxDaily} /></Td>
                  <Td className="tabular-nums text-slate-600">{count(d.orders)}</Td>
                  <Td className="tabular-nums text-slate-600">{count(d.pages)}</Td>
                  <Td className="text-xs text-slate-500">{d.bw} / {d.color}</Td>
                </Tr>
              ))}
            </Table>
          )
        ) : tab === "weekly" ? (
          <Table head={["Week starting", "Revenue", "", "Orders"]}>
            {[...data.weekly].reverse().map((w) => (
              <Tr key={w.weekStart}>
                <Td className="text-xs text-slate-600 whitespace-nowrap">{dateOnly(w.weekStart)}</Td>
                <Td className="tabular-nums font-semibold text-slate-700">{inr(w.revenuePaise)}</Td>
                <Td className="w-48"><Bar value={w.revenuePaise} max={Math.max(1, ...data.weekly.map((x) => x.revenuePaise))} tint="bg-violet-500" /></Td>
                <Td className="tabular-nums text-slate-600">{count(w.orders)}</Td>
              </Tr>
            ))}
          </Table>
        ) : tab === "monthly" ? (
          <Table head={["Month", "Revenue", "", "Orders"]}>
            {[...data.monthly].reverse().map((m) => (
              <Tr key={m.month}>
                <Td className="text-xs text-slate-600 whitespace-nowrap">{m.month}</Td>
                <Td className="tabular-nums font-semibold text-slate-700">{inr(m.revenuePaise)}</Td>
                <Td className="w-48"><Bar value={m.revenuePaise} max={Math.max(1, ...data.monthly.map((x) => x.revenuePaise))} tint="bg-emerald-500" /></Td>
                <Td className="tabular-nums text-slate-600">{count(m.orders)}</Td>
              </Tr>
            ))}
          </Table>
        ) : tab === "vendor" ? (
          <Table head={["Shop", "Revenue", "", "Orders", "Pages"]}>
            {data.byVendor.map((v) => (
              <Tr key={v.vendorId || "unassigned"}>
                <Td className={`font-semibold ${v.vendorId ? "text-slate-700" : "text-amber-700"}`}>{v.name}</Td>
                <Td className="tabular-nums font-semibold text-slate-700">{inr(v.revenuePaise)}</Td>
                <Td className="w-48"><Bar value={v.revenuePaise} max={maxVendor} /></Td>
                <Td className="tabular-nums text-slate-600">{count(v.orders)}</Td>
                <Td className="tabular-nums text-slate-600">{count(v.pages)}</Td>
              </Tr>
            ))}
          </Table>
        ) : (
          <>
            <Table head={["Location", "Revenue", "", "Orders"]}>
              {data.byLocation.map((l) => (
                <Tr key={l.location}>
                  <Td className={`font-semibold ${l.location === "Unrecorded" ? "text-amber-700" : "text-slate-700"}`}>{l.location}</Td>
                  <Td className="tabular-nums font-semibold text-slate-700">{inr(l.revenuePaise)}</Td>
                  <Td className="w-48"><Bar value={l.revenuePaise} max={maxLocation} tint="bg-amber-500" /></Td>
                  <Td className="tabular-nums text-slate-600">{count(l.orders)}</Td>
                </Tr>
              ))}
            </Table>
            <p className="px-5 py-3 text-[11px] text-slate-400 border-t border-slate-100">
              Grouped by the location a vendor typed on their printer. There is no city field on any
              record, so this is only as accurate as that free text — it is not validated geography.
            </p>
          </>
        )}
      </Card>
    </>
  );
}

function Figure({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-xl font-black text-slate-900 mt-1 tabular-nums">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

export default function RevenuePage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <RevenuePageBody />
    </Suspense>
  );
}
