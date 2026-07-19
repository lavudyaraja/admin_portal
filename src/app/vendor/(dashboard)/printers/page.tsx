"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  LuPlus,
  LuSearch,
  LuPrinter,
  LuTrash2,
  LuEye,
  LuMapPin,
} from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import { Select } from "@/components/vendor/settings/fields";

interface Printer {
  id: string;
  uniquePrinterId: string;
  name: string;
  brand: string;
  model: string;
  ipAddress: string;
  status: string;
  locationName: string;
  shopName: string;
  ownerName: string;
  mobileNumber: string;
  colorPrinting: boolean;
  duplexPrinting: boolean;
  costPerBWPagePaise: number;
  costPerColorPagePaise: number;
  supportedPaperSizes: string[];
  paperLevel: number;
  tonerLevel: number;
  lastSeenAt: string | null;
  createdAt: string;
  _count: { orders: number };
}

const statusColors: Record<string, string> = {
  ONLINE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  OFFLINE: "bg-slate-100 text-slate-500 border-slate-200",
  BUSY: "bg-amber-100 text-amber-700 border-amber-200",
  ERROR: "bg-rose-100 text-rose-700 border-rose-200",
  OUT_OF_PAPER: "bg-orange-100 text-orange-700 border-orange-200",
  LOW_TONER: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusColors[status] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "ONLINE" ? "bg-emerald-500" : status === "OFFLINE" ? "bg-slate-400" : "bg-current"}`} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

const brandBadge = "bg-slate-100 text-slate-600";

export default function PrintersPage() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await apiFetch<{ printers: Printer[]; total: number }>(`/printers?${params}`);
      setPrinters(res.printers);
      setTotal(res.total);
    } catch {}
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await apiFetch(`/printers/${id}`, { method: "DELETE" });
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    }
    setDeleting(null);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Printers</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} registered {total === 1 ? "printer" : "printers"}</p>
        </div>
        <Link
          href="/vendor/printers/add"
          className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors"
        >
          <LuPlus size={18} /> Register Printer
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <LuSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search printer, shop, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          options={[
            { value: "", label: "All Statuses" },
            { value: "ONLINE", label: "Online" },
            { value: "OFFLINE", label: "Offline" },
            { value: "BUSY", label: "Busy" },
            { value: "ERROR", label: "Error" },
            { value: "OUT_OF_PAPER", label: "Out of Paper" },
            { value: "LOW_TONER", label: "Low Toner" }
          ]}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 h-44 animate-pulse" />
          ))}
        </div>
      ) : printers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 sm:p-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
            <LuPrinter size={26} />
          </div>
          <p className="text-slate-800 font-bold">No printers found</p>
          <p className="text-slate-400 text-sm mt-1">Register your first WiFi printer to get started.</p>
          <Link href="/vendor/printers/add" className="inline-flex items-center gap-2 mt-5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
            <LuPlus size={16} /> Register Printer
          </Link>
        </div>
      ) : (
        <>
          {/* Card grid — mobile & tablet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {printers.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <LuPrinter size={20} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{p.uniquePrinterId}</p>
                    </div>
                  </div>
                  <StatusPill status={p.status} />
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${brandBadge}`}>{p.brand}</span>
                  <span className="text-xs text-slate-500 truncate">{p.model}</span>
                </div>

                <div className="flex items-start gap-1.5 mt-3 text-xs text-slate-500">
                  <LuMapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  <span className="truncate"><span className="text-slate-700 font-medium">{p.shopName}</span> · {p.locationName}</span>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">₹{(p.costPerBWPagePaise / 100).toFixed(0)}/pg B&W{p.colorPrinting ? ` · ₹${(p.costPerColorPagePaise / 100).toFixed(0)}/pg Color` : ""}</span>
                  <span className="font-bold text-slate-700">{p._count.orders} orders</span>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Link href={`/printers/${p.id}`} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-white hover:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-900 transition-all">
                    <LuEye size={14} /> View
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    disabled={deleting === p.id}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-rose-300 transition-all disabled:opacity-40"
                  >
                    <LuTrash2 size={14} /> {deleting === p.id ? "…" : "Delete"}
                  </button>
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
                    {["Printer", "Brand / Model", "Location", "Status", "Pricing", "Orders", ""].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {printers.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{p.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{p.uniquePrinterId}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${brandBadge}`}>{p.brand}</span>
                        <p className="text-xs text-slate-500 mt-1">{p.model}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-slate-700 font-medium">{p.shopName}</p>
                        <p className="text-xs text-slate-400">{p.locationName}</p>
                      </td>
                      <td className="px-5 py-4"><StatusPill status={p.status} /></td>
                      <td className="px-5 py-4">
                        <p className="text-slate-700 text-xs">B&W: ₹{(p.costPerBWPagePaise / 100).toFixed(0)}/pg</p>
                        {p.colorPrinting && <p className="text-slate-500 text-xs">Color: ₹{(p.costPerColorPagePaise / 100).toFixed(0)}/pg</p>}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{p._count.orders}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/printers/${p.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-white hover:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-900 transition-all">
                            <LuEye size={13} /> View
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            disabled={deleting === p.id}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-300 transition-all disabled:opacity-40"
                          >
                            <LuTrash2 size={13} /> {deleting === p.id ? "…" : "Delete"}
                          </button>
                        </div>
                      </td>
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
