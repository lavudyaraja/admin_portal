"use client";

import { useEffect, useState, useCallback } from "react";
import { LuMail, LuX, LuInbox } from "react-icons/lu";
import { apiFetch } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { Select } from "@/components/settings/fields";

interface Ticket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  reply: string | null;
  createdAt: string;
}

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const statusColors: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-700 border-amber-200",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
  RESOLVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CLOSED: "bg-slate-100 text-slate-500 border-slate-200",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${statusColors[status] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [active, setActive] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filter) params.set("status", filter);
      const res = await apiFetch<{ tickets: Ticket[]; total: number }>(`/admin/support?${params}`);
      setTickets(res.tickets);
    } catch {}
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  function open(t: Ticket) {
    setActive(t);
    setReply(t.reply || "");
  }

  async function save(status?: string) {
    if (!active) return;
    setSaving(true);
    try {
      const body: { reply?: string; status?: string } = { reply };
      if (status) body.status = status;
      await apiFetch(`/admin/support/${active.id}`, { method: "PATCH", body });
      setActive(null);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to save");
    }
    setSaving(false);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Support Tickets</h1>
          <p className="text-slate-400 text-sm mt-0.5">{tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}</p>
        </div>
        <Select
          value={filter}
          onChange={setFilter}
          options={[{ value: "", label: "All Statuses" }, ...STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))]}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-slate-200 h-20 animate-pulse" />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 sm:p-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4"><LuInbox size={24} /></div>
          <p className="text-slate-800 font-bold">No tickets</p>
          <p className="text-slate-400 text-sm mt-1">Support requests will appear here.</p>
        </div>
      ) : (
        <>
          {/* Cards — mobile & tablet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {tickets.map((t) => (
              <button key={t.id} onClick={() => open(t)} className="text-left bg-white rounded-2xl border border-slate-200 p-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900 truncate">{t.subject}</p>
                  <StatusPill status={t.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{t.message}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                  <span className="truncate">{t.name} · {t.email}</span>
                  <span className="shrink-0 ml-2">{dateTime(t.createdAt).split(",")[0]}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Table — laptop & desktop */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["From", "Subject", "Status", "Received", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{t.name}</p>
                      <p className="text-[11px] text-slate-400">{t.email}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-700 max-w-64 truncate">{t.subject}</td>
                    <td className="px-5 py-4"><StatusPill status={t.status} /></td>
                    <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">{dateTime(t.createdAt)}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => open(t)} className="text-xs font-semibold text-slate-700 hover:text-white hover:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-900 transition-all">
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Detail drawer */}
      {active && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={() => setActive(null)}>
          <div className="w-full sm:max-w-md bg-white h-full shadow-xl p-5 sm:p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><LuMail size={16} className="text-slate-500" /></span>
                  <StatusPill status={active.status} />
                </div>
                <h3 className="font-black text-slate-900 mt-2 break-words">{active.subject}</h3>
                <p className="text-xs text-slate-400">{active.name} · {active.email}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{dateTime(active.createdAt)}</p>
              </div>
              <button onClick={() => setActive(null)} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 shrink-0"><LuX size={18} /></button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 mb-5 whitespace-pre-wrap break-words">{active.message}</div>

            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reply</label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={5}
              placeholder="Write a response…"
              className="w-full mt-1.5 p-3 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-400 resize-y transition-all"
            />

            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => save("IN_PROGRESS")} disabled={saving} className="text-xs font-bold px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-40">In Progress</button>
              <button onClick={() => save("RESOLVED")} disabled={saving} className="text-xs font-bold px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-40">Resolve</button>
              <button onClick={() => save("CLOSED")} disabled={saving} className="text-xs font-bold px-3 py-2 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors disabled:opacity-40">Close</button>
              <button onClick={() => save()} disabled={saving} className="ml-auto text-xs font-bold px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors disabled:opacity-40">{saving ? "Saving…" : "Save Reply"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
