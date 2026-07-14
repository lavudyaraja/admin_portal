"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LuIndianRupee,
  LuClipboardList,
  LuPrinter,
  LuUsers,
  LuTrendingUp,
  LuTrendingDown,
  LuPlus,
  LuFileText,
  LuCircleCheck,
  LuTriangleAlert,
  LuActivity,
  LuArrowRight,
  LuChartColumn,
} from "react-icons/lu";
import { apiFetch } from "@/lib/api";
import { inr, dateTime } from "@/lib/format";

interface Metrics {
  totalOrders: number;
  completedOrders: number;
  failedOrders: number;
  dailyOrders: number;
  monthlyOrders: number;
  orderGrowth: number;
  totalUsers: number;
  newUsersToday: number;
  totalRevenuePaise: number;
  monthlyRevenuePaise: number;
  revenueGrowth: number;
  totalPagesPrinted: number;
  totalPrinters: number;
  activePrinters: number;
  offlinePrinters: number;
  lowPaperCount: number;
}

interface DayPoint { date: string; revenuePaise: number; orders: number; pages: number }
interface TopPrinter { printerId: string | null; name: string; revenuePaise: number; orders: number }
interface RevenueData { chartData: DayPoint[]; topPrinters: TopPrinter[] }

interface Order {
  id: string;
  orderCode: string;
  status: string;
  costPaise: number;
  pagesToPrint: number;
  colorMode: string;
  createdAt: string;
  user: { name: string; phone: string | null } | null;
  printer: { name: string; shopName: string } | null;
  document: { fileName: string } | null;
}

// ── Slate-only status pill ───────────────────────────────────────────────────
function statusPill(status: string) {
  if (status === "COMPLETED") return "bg-slate-900 text-white";
  if (status === "FAILED" || status === "CANCELLED") return "bg-slate-100 text-slate-400";
  return "bg-slate-100 text-slate-600";
}

// Accent palette — soft, light-tinted icon tiles. No heavy backgrounds.
type Accent = "violet" | "emerald" | "amber" | "sky" | "rose" | "slate";
const ACCENT: Record<Accent, { tile: string; text: string }> = {
  violet:  { tile: "bg-violet-50",  text: "text-violet-500" },
  emerald: { tile: "bg-emerald-50", text: "text-emerald-500" },
  amber:   { tile: "bg-amber-50",   text: "text-amber-500" },
  sky:     { tile: "bg-sky-50",     text: "text-sky-500" },
  rose:    { tile: "bg-rose-50",    text: "text-rose-500" },
  slate:   { tile: "bg-slate-50",   text: "text-slate-500" },
};

function StatCard({
  label, value, sub, badge, icon: Icon, accent = "slate",
}: {
  label: string;
  value: string;
  sub?: string;
  badge?: { text: string; up: boolean };
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent?: Accent;
}) {
  const a = ACCENT[accent];
  return (
    <div className="group bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 hover:border-slate-200 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <div className={`w-10 h-10 rounded-xl ${a.tile} flex items-center justify-center`}>
          <Icon size={18} className={a.text} />
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
        {badge && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${badge.up ? "text-emerald-600 bg-emerald-50" : "text-rose-500 bg-rose-50"}`}>
            {badge.up ? <LuTrendingUp size={13} /> : <LuTrendingDown size={13} />}
            {badge.text}
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, accent = "slate" }: { label: string; value: string; icon: React.ComponentType<{ size?: number; className?: string }>; accent?: Accent }) {
  const a = ACCENT[accent];
  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 flex items-center justify-between hover:border-slate-200 transition-colors">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-xl font-black text-slate-900">{value}</p>
      </div>
      <div className={`w-9 h-9 rounded-xl ${a.tile} flex items-center justify-center shrink-0 ${a.text}`}>
        <Icon size={18} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [m, setM] = useState<Metrics | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<Metrics>("/admin/metrics"),
      apiFetch<RevenueData>("/admin/revenue?period=30d"),
      apiFetch<{ orders: Order[] }>("/admin/orders?limit=6"),
    ])
      .then(([metrics, rev, ord]) => {
        setM(metrics);
        setRevenue(rev);
        setOrders(ord.orders);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-slate-100 h-32 animate-pulse" />)}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 h-64 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 h-72 animate-pulse" />
          <div className="bg-white rounded-2xl border border-slate-100 h-72 animate-pulse" />
        </div>
      </div>
    );
  }

  const chart = revenue?.chartData || [];
  const maxRev = Math.max(1, ...chart.map((d) => d.revenuePaise));
  const successRate = m && m.totalOrders > 0 ? Math.round((m.completedOrders / m.totalOrders) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Live overview of your Prinsta network.</p>
        </div>
        <Link href="/printers/add" className="inline-flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
          <LuPlus size={17} /> Register Printer
        </Link>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={m ? inr(m.totalRevenuePaise) : "—"}
          sub={m ? `${inr(m.monthlyRevenuePaise)} this month` : undefined}
          badge={m ? { text: `${Math.abs(m.revenueGrowth)}%`, up: m.revenueGrowth >= 0 } : undefined}
          icon={LuIndianRupee}
          accent="emerald"
        />
        <StatCard
          label="Total Orders"
          value={m ? m.totalOrders.toLocaleString() : "—"}
          sub={m ? `${m.dailyOrders} today · ${m.monthlyOrders} this month` : undefined}
          badge={m ? { text: `${Math.abs(m.orderGrowth)}%`, up: m.orderGrowth >= 0 } : undefined}
          icon={LuClipboardList}
          accent="violet"
        />
        <StatCard
          label="Active Printers"
          value={m ? `${m.activePrinters} / ${m.totalPrinters}` : "—"}
          sub={m ? `${m.offlinePrinters} offline · ${m.lowPaperCount} low paper` : undefined}
          icon={LuPrinter}
          accent="amber"
        />
        <StatCard
          label="Total Users"
          value={m ? m.totalUsers.toLocaleString() : "—"}
          sub={m ? `+${m.newUsersToday} new today` : undefined}
          icon={LuUsers}
          accent="sky"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat label="Pages Printed" value={m ? m.totalPagesPrinted.toLocaleString() : "—"} icon={LuFileText} accent="violet" />
        <MiniStat label="Completed" value={m ? m.completedOrders.toLocaleString() : "—"} icon={LuCircleCheck} accent="emerald" />
        <MiniStat label="Failed Jobs" value={m ? m.failedOrders.toLocaleString() : "—"} icon={LuTriangleAlert} accent="rose" />
        <MiniStat label="Success Rate" value={`${successRate}%`} icon={LuActivity} accent="sky" />
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"><LuChartColumn size={18} className="text-slate-600" /></div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Revenue — last 30 days</h3>
              <p className="text-xs text-slate-400">{m ? inr(m.monthlyRevenuePaise) : "—"} this month</p>
            </div>
          </div>
          <Link href="/revenue" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            Details <LuArrowRight size={13} />
          </Link>
        </div>
        {chart.length === 0 || maxRev <= 1 ? (
          <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No revenue in this period yet.</div>
        ) : (
          <div className="flex items-end gap-[3px] h-40">
            {chart.map((d) => {
              const h = Math.round((d.revenuePaise / maxRev) * 100);
              return (
                <div key={d.date} className="flex-1 min-w-[4px] h-full flex flex-col justify-end group relative">
                  <div
                    className="w-full bg-gradient-to-t from-violet-500 to-indigo-400 opacity-80 group-hover:opacity-100 rounded-t-md transition-opacity"
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

      {/* Recent orders + Top printers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Recent Orders</h3>
            <Link href="/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
              View all <LuArrowRight size={13} />
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">No orders yet.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <LuFileText size={16} className="text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{o.document?.fileName || o.orderCode}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {o.user?.name || "—"} · {o.printer?.shopName || "Unassigned"} · {o.pagesToPrint}pg {o.colorMode === "COLOR" ? "Color" : "B&W"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">{inr(o.costPaise)}</p>
                    <p className="text-[10px] text-slate-400">{dateTime(o.createdAt).split(",")[0]}</p>
                  </div>
                  <span className={`hidden sm:inline text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${statusPill(o.status)}`}>
                    {o.status.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top printers */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Top Printers</h3>
            <Link href="/printers" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
              All <LuArrowRight size={13} />
            </Link>
          </div>
          {!revenue?.topPrinters.length ? (
            <div className="p-12 text-center text-slate-400 text-sm">No data yet.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {revenue.topPrinters.map((p, i) => (
                <div key={p.printerId || i} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black shrink-0">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-400">{p.orders} orders</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 shrink-0">{inr(p.revenuePaise)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/printers/add" className="group bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center mb-4"><LuPlus size={20} className="text-violet-500" /></div>
          <p className="font-bold text-slate-900 text-base">Register Printer</p>
          <p className="text-slate-400 text-xs mt-1">Add a new WiFi printer to the network</p>
        </Link>
        <Link href="/orders" className="group bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center mb-4"><LuClipboardList size={20} className="text-sky-500" /></div>
          <p className="font-bold text-base text-slate-800">View Orders</p>
          <p className="text-slate-400 text-xs mt-1">Monitor live print jobs and order status</p>
        </Link>
        <Link href="/revenue" className="group bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4"><LuTrendingUp size={20} className="text-emerald-500" /></div>
          <p className="font-bold text-base text-slate-800">Revenue Analytics</p>
          <p className="text-slate-400 text-xs mt-1">Charts, trends, and top-performing locations</p>
        </Link>
      </div>
    </div>
  );
}
