"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LuIndianRupee,
  LuClipboardList,
  LuFileText,
  LuChartColumn,
  LuTrophy,
} from "react-icons/lu";
import { apiFetch } from "@/lib/api";
import { inr } from "@/lib/format";

interface DayPoint {
  date: string;
  revenuePaise: number;
  orders: number;
  pages: number;
  bwOrders: number;
  colorOrders: number;
}
interface TopPrinter {
  printerId: string | null;
  name: string;
  revenuePaise: number;
  orders: number;
}
interface RevenueData {
  chartData: DayPoint[];
  topPrinters: TopPrinter[];
}

const PERIODS = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

function SummaryCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ size?: number; className?: string }> }) {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <Icon size={18} className="text-slate-600" />
        </div>
      </div>
      <p className="text-2xl font-black text-slate-900 mt-4 tracking-tight">{value}</p>
    </div>
  );
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<RevenueData>(`/admin/revenue?period=${period}`);
      setData(res);
    } catch {}
    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const chart = data?.chartData || [];
  const maxRev = Math.max(1, ...chart.map((d) => d.revenuePaise));
  const totalRev = chart.reduce((s, d) => s + d.revenuePaise, 0);
  const totalOrders = chart.reduce((s, d) => s + d.orders, 0);
  const totalPages = chart.reduce((s, d) => s + d.pages, 0);
  const maxTop = Math.max(1, ...(data?.topPrinters.map((p) => p.revenuePaise) || [1]));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Revenue Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">Completed-order revenue over time.</p>
        </div>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors ${period === p.value ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Revenue" value={loading ? "—" : inr(totalRev)} icon={LuIndianRupee} />
        <SummaryCard label="Orders" value={loading ? "—" : totalOrders.toLocaleString()} icon={LuClipboardList} />
        <SummaryCard label="Pages" value={loading ? "—" : totalPages.toLocaleString()} icon={LuFileText} />
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"><LuChartColumn size={18} className="text-slate-600" /></div>
          <h3 className="font-bold text-slate-800 text-sm">Daily Revenue</h3>
        </div>
        {loading ? (
          <div className="h-52 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
        ) : chart.length === 0 || maxRev <= 1 ? (
          <div className="h-52 flex items-center justify-center text-slate-400 text-sm">No revenue in this period yet.</div>
        ) : (
          <div className="flex items-end gap-[3px] h-52 overflow-x-auto">
            {chart.map((d) => {
              const h = Math.round((d.revenuePaise / maxRev) * 100);
              return (
                <div key={d.date} className="flex-1 min-w-[6px] flex flex-col justify-end h-full group relative">
                  <div
                    className="w-full bg-slate-200 group-hover:bg-slate-800 rounded-t-sm transition-colors"
                    style={{ height: `${Math.max(h, d.revenuePaise > 0 ? 3 : 0)}%` }}
                  />
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-medium rounded-md px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                    {new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}: {inr(d.revenuePaise)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top printers */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"><LuTrophy size={17} className="text-slate-600" /></div>
          <h3 className="font-bold text-slate-800 text-sm">Top Printers by Revenue</h3>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading…</div>
        ) : !data?.topPrinters.length ? (
          <div className="p-12 text-center text-slate-400 text-sm">No revenue data yet.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {data.topPrinters.map((p, i) => (
              <div key={p.printerId || i} className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-black text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-400">{p.orders} orders</p>
                  </div>
                  <p className="font-bold text-slate-900 shrink-0">{inr(p.revenuePaise)}</p>
                </div>
                <div className="mt-2 ml-10 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-slate-800 rounded-full" style={{ width: `${Math.round((p.revenuePaise / maxTop) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
