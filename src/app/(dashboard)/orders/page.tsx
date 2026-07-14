"use client";

import { useEffect, useState, useCallback } from "react";
import { LuSearch, LuFileText, LuClipboardList } from "react-icons/lu";
import { apiFetch } from "@/lib/api";
import { inr, dateTime } from "@/lib/format";
import { Select } from "@/components/settings/fields";

interface Order {
  id: string;
  orderCode: string;
  status: string;
  colorMode: string;
  sideMode: string;
  copies: number;
  pagesToPrint: number;
  paperSize: string;
  costPaise: number;
  paymentMethod: string | null;
  createdAt: string;
  user: { name: string; phone: string | null; email: string | null } | null;
  document: { fileName: string; pageCount: number } | null;
  printer: { name: string; shopName: string; uniquePrinterId: string } | null;
}

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-700 border-amber-200",
  PAID: "bg-blue-100 text-blue-700 border-blue-200",
  READY: "bg-slate-100 text-slate-600 border-slate-200",
  PRINTING: "bg-slate-900 text-white border-slate-900",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  FAILED: "bg-rose-100 text-rose-700 border-rose-200",
  CANCELLED: "bg-slate-100 text-slate-400 border-slate-200",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${statusColors[status] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

const STATUSES = ["PENDING_PAYMENT", "PAID", "READY", "PRINTING", "COMPLETED", "FAILED", "CANCELLED"];
const inputCls = "w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-400 transition-all";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const res = await apiFetch<{ orders: Order[]; total: number }>(`/admin/orders?${params}`);
      setOrders(res.orders);
      setTotal(res.total);
    } catch {}
    setLoading(false);
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Orders</h1>
        <p className="text-slate-400 text-sm mt-0.5">{total} total print {total === 1 ? "order" : "orders"}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <LuSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search order code, name, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputCls + " pl-10"}
          />
        </div>
        <Select
          value={status}
          onChange={(v) => setStatus(v)}
          options={[
            { value: "", label: "All Statuses" },
            ...STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))
          ]}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-slate-200 h-24 animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 sm:p-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4"><LuClipboardList size={26} /></div>
          <p className="text-slate-800 font-bold">No orders found</p>
          <p className="text-slate-400 text-sm mt-1">Print orders will appear here.</p>
        </div>
      ) : (
        <>
          {/* Cards — mobile & tablet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {orders.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><LuFileText size={16} className="text-slate-500" /></span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{o.document?.fileName || o.orderCode}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{o.orderCode}</p>
                    </div>
                  </div>
                  <StatusPill status={o.status} />
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-4 text-xs">
                  <div><p className="text-slate-400">Customer</p><p className="text-slate-700 font-medium truncate">{o.user?.name || "—"}</p></div>
                  <div><p className="text-slate-400">Printer</p><p className="text-slate-700 font-medium truncate">{o.printer?.shopName || "Unassigned"}</p></div>
                  <div><p className="text-slate-400">Config</p><p className="text-slate-700">{o.colorMode === "COLOR" ? "Color" : "B&W"} · {o.pagesToPrint}pg × {o.copies}</p></div>
                  <div><p className="text-slate-400">Payment</p><p className="text-slate-700">{o.paymentMethod || "—"}</p></div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">{dateTime(o.createdAt)}</span>
                  <span className="font-bold text-slate-900">{inr(o.costPaise)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Table — laptop & desktop */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Order", "Customer", "Document", "Printer", "Config", "Amount", "Status", "Date"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-mono font-semibold text-slate-900 text-xs">{o.orderCode}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{o.paymentMethod || "—"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">{o.user?.name || "—"}</p>
                        <p className="text-[11px] text-slate-400">{o.user?.phone || o.user?.email || ""}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-slate-700 truncate max-w-40">{o.document?.fileName || "—"}</p>
                        <p className="text-[11px] text-slate-400">{o.document?.pageCount ?? 0} pages</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-slate-700">{o.printer?.name || "Unassigned"}</p>
                        <p className="text-[11px] text-slate-400">{o.printer?.shopName || ""}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">
                        <p>{o.colorMode === "COLOR" ? "Color" : "B&W"} · {o.sideMode === "DOUBLE" ? "Duplex" : "Single"}</p>
                        <p className="text-slate-400">{o.pagesToPrint}pg × {o.copies} · {o.paperSize}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{inr(o.costPaise)}</td>
                      <td className="px-5 py-4"><StatusPill status={o.status} /></td>
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">{dateTime(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
