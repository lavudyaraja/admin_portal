"use client";

import { useEffect, useMemo, useState } from "react";
import { LuWallet, LuArrowDownToLine, LuBanknote, LuUsers, LuSearch } from "react-icons/lu";
import { apiFetch } from "@/lib/api";
import { inr } from "@/lib/format";

interface Metrics {
  walletTopupPaise: number;
  totalRevenuePaise: number;
  totalUsers: number;
}
interface WalletUser {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  walletBalancePaise: number;
}

function SummaryCard({ label, value, sub, icon: Icon, dark }: { label: string; value: string; sub?: string; icon: React.ComponentType<{ size?: number; className?: string }>; dark?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 sm:p-6 border ${dark ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200"}`}>
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-semibold uppercase tracking-wider ${dark ? "text-slate-300" : "text-slate-400"}`}>{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? "bg-white/10" : "bg-slate-100"}`}>
          <Icon size={18} className={dark ? "text-white" : "text-slate-600"} />
        </div>
      </div>
      <p className={`text-2xl sm:text-3xl font-black mt-4 tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${dark ? "text-slate-400" : "text-slate-400"}`}>{sub}</p>}
    </div>
  );
}

export default function WalletPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<WalletUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<Metrics>("/admin/metrics"),
      apiFetch<{ users: WalletUser[] }>("/admin/users?limit=200"),
    ])
      .then(([m, u]) => {
        setMetrics(m);
        setUsers(u.users.filter((x) => x.walletBalancePaise > 0).sort((a, b) => b.walletBalancePaise - a.walletBalancePaise));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalHeld = users.reduce((s, u) => s + u.walletBalancePaise, 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q) || (u.phone || "").includes(q) || (u.email || "").toLowerCase().includes(q));
  }, [users, search]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Wallet</h1>
        <p className="text-slate-400 text-sm mt-0.5">Prinsta Wallet balances &amp; top-ups.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Balance Held" value={loading ? "—" : inr(totalHeld)} sub={`across ${users.length} wallets`} icon={LuWallet} />
        <SummaryCard label="Lifetime Top-ups" value={metrics ? inr(metrics.walletTopupPaise) : "—"} sub="total credited" icon={LuArrowDownToLine} />
        <SummaryCard label="Revenue Collected" value={metrics ? inr(metrics.totalRevenuePaise) : "—"} sub="from completed orders" icon={LuBanknote} />
        <SummaryCard label="Active Wallets" value={loading ? "—" : users.length.toLocaleString()} sub="with a balance" icon={LuUsers} />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <LuSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search wallet holder…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-4 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
        />
      </div>

      {/* Wallets */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm">Wallets with Balance</h3>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">{search ? "No wallets match your search." : "No wallet balances yet."}</div>
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
                  <p className="font-bold text-slate-900 shrink-0">{inr(u.walletBalancePaise)}</p>
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
                      <td className="px-5 py-4 font-bold text-slate-900">{inr(u.walletBalancePaise)}</td>
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
