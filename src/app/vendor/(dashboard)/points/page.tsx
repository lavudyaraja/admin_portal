"use client";

import { useEffect, useMemo, useState } from "react";
import { LuCoins, LuArrowDownToLine, LuBanknote, LuUsers, LuSearch } from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import { inr, points, count } from "@/lib/console/format";
import { StatTile } from "@/components/console/primitives";

interface Metrics {
  totalOrders: number;
  customersThisMonth: number;
  totalRevenuePaise: number;
  totalUsers: number;
}
interface PointsUser {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  pointsBalance: number;
}

export default function PointsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<PointsUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<Metrics>("/vendors/me/stats"),
      apiFetch<{ customers: PointsUser[] }>("/vendors/me/customers"),
    ])
      .then(([m, u]) => {
        setMetrics(m);
        setUsers((u.customers || []).filter((x) => x.pointsBalance > 0).sort((a, b) => b.pointsBalance - a.pointsBalance));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalHeld = users.reduce((s, u) => s + u.pointsBalance, 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q) || (u.phone || "").includes(q) || (u.email || "").toLowerCase().includes(q));
  }, [users, search]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Points</h1>
        <p className="text-slate-400 text-sm mt-0.5">Points held by the customers who print at your shop.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Balance Held" value={loading ? "—" : points(totalHeld)} hint={`across ${users.length} ${users.length === 1 ? "user" : "users"}`} icon={LuCoins} tint="lavender" />
        <StatTile label="Orders here" value={metrics ? count(metrics.totalOrders) : "—"} hint={metrics ? `${count(metrics.customersThisMonth)} customers this month` : undefined} icon={LuArrowDownToLine} tint="mint" />
        <StatTile label="Revenue Collected" value={metrics ? inr(metrics.totalRevenuePaise) : "—"} hint="from completed orders" icon={LuBanknote} tint="sky" />
        <StatTile label="Users with Points" value={loading ? "—" : count(users.length)} hint="with a balance" icon={LuUsers} tint="gold" />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <LuSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, phone or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-4 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
        />
      </div>

      {/* Holders */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm">Users with a Points Balance</h3>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">{search ? "No users match your search." : "No Points balances yet."}</div>
        ) : (
          <>
            {/* Cards — mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 lg:hidden">
              {filtered.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">{u.name?.[0]?.toUpperCase() || "?"}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 text-sm truncate">{u.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{u.phone || u.email || "—"}</p>
                  </div>
                  <p className="font-bold text-slate-900 shrink-0">{points(u.pointsBalance)}</p>
                </div>
              ))}
            </div>

            {/* Table — desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["User", "Contact", "Balance"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">{u.name?.[0]?.toUpperCase() || "?"}</div>
                          <span className="font-semibold text-slate-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">{u.phone || u.email || "—"}</td>
                      <td className="px-5 py-4 font-bold text-slate-900">{points(u.pointsBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
