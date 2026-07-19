"use client";

import { useEffect, useState, useCallback } from "react";
import { LuSearch, LuArrowLeftRight, LuArrowDownLeft, LuArrowUpRight } from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import { points, count, ledgerPoints, dateTime } from "@/lib/console/format";
import { StatTile } from "@/components/console/primitives";
import { Select } from "@/components/vendor/settings/fields";

interface Txn {
  id: string;
  type: "CREDIT" | "DEBIT";
  amountPoints: number;
  balancePoints: number;
  /** Legacy columns, still populated on pre-rename rows. */
  amountPaise: number;
  balancePaise: number;
  description: string;
  razorpayId: string | null;
  createdAt: string;
  user: { name: string; phone: string | null } | null;
}

const PAGE = 50;

function TypePill({ type }: { type: "CREDIT" | "DEBIT" }) {
  const credit = type === "CREDIT";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${credit ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-700 border-rose-200"}`}>
      {credit ? <LuArrowDownLeft size={12} /> : <LuArrowUpRight size={12} />}
      {type}
    </span>
  );
}

export default function TransactionsPage() {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");

  const load = useCallback(async (offset: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE), offset: String(offset) });
      if (search) params.set("search", search);
      if (type) params.set("type", type);
      const res = await apiFetch<{ transactions: Txn[]; total: number }>(`/vendors/me/transactions?${params}`);
      setTxns((prev) => (append ? [...prev, ...res.transactions] : res.transactions));
      setTotal(res.total);
    } catch {}
    if (append) setLoadingMore(false); else setLoading(false);
  }, [search, type]);

  useEffect(() => {
    const t = setTimeout(() => load(0, false), 250);
    return () => clearTimeout(t);
  }, [load]);

  // Summed through ledgerPoints so pre- and post-rename rows both count.
  const credits = txns.filter((t) => t.type === "CREDIT").reduce((s, t) => s + ledgerPoints(t), 0);
  const debits = txns.filter((t) => t.type === "DEBIT").reduce((s, t) => s + ledgerPoints(t), 0);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Transactions</h1>
        <p className="text-slate-400 text-sm mt-0.5">{total} Points {total === 1 ? "transaction" : "transactions"}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Transactions" value={count(total)} icon={LuArrowLeftRight} tint="lavender" />
        <StatTile label="Credits" value={points(credits)} icon={LuArrowDownLeft} tint="mint" hint="loaded rows" />
        <StatTile label="Debits" value={points(debits)} icon={LuArrowUpRight} tint="blush" hint="loaded rows" />
        <StatTile label="Net" value={points(credits - debits)} icon={LuArrowLeftRight} tint="sky" hint="loaded rows" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <LuSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
          />
        </div>
        <Select
          value={type}
          onChange={(v) => setType(v)}
          options={[
            { value: "", label: "All Types" },
            { value: "CREDIT", label: "Credit (top-up)" },
            { value: "DEBIT", label: "Debit (spent)" },
          ]}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-slate-200 h-16 animate-pulse" />)}
        </div>
      ) : txns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 sm:p-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4"><LuArrowLeftRight size={24} /></div>
          <p className="text-slate-800 font-bold">No transactions found</p>
          <p className="text-slate-400 text-sm mt-1">Points activity will appear here.</p>
        </div>
      ) : (
        <>
          {/* Cards — mobile & tablet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:hidden">
            {txns.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{t.user?.name || "—"}</p>
                    <p className="text-[11px] text-slate-400 truncate">{t.description}</p>
                  </div>
                  <TypePill type={t.type} />
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">{dateTime(t.createdAt)}</span>
                  <span className={`font-bold ${t.type === "CREDIT" ? "text-emerald-600" : "text-rose-600"}`}>
                    {t.type === "CREDIT" ? "+" : "−"}{points(ledgerPoints(t))}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Table — laptop & desktop */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["User", "Type", "Description", "Amount", "Balance", "Date"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txns.map((t) => (
                    <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">{t.user?.name || "—"}</p>
                        <p className="text-[11px] text-slate-400">{t.user?.phone || ""}</p>
                      </td>
                      <td className="px-5 py-4"><TypePill type={t.type} /></td>
                      <td className="px-5 py-4 text-slate-600 max-w-64 truncate">{t.description}</td>
                      <td className={`px-5 py-4 font-bold ${t.type === "CREDIT" ? "text-emerald-600" : "text-rose-600"}`}>
                        {t.type === "CREDIT" ? "+" : "−"}{points(ledgerPoints(t))}
                      </td>
                      <td className="px-5 py-4 text-slate-700">{points(ledgerPoints(t.balancePoints, t.balancePaise))}</td>
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">{dateTime(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Load more */}
          {txns.length < total && (
            <div className="flex justify-center">
              <button
                onClick={() => load(txns.length, true)}
                disabled={loadingMore}
                className="text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-400 px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : `Load more (${total - txns.length} left)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
