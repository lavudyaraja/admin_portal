"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LuPrinter, LuSearch } from "react-icons/lu";
import { apiFetch, type KioskRow } from "@/lib/admin/api";
import { dateTime } from "@/lib/console/format";
import {
  Card, Table, Td, Tr, StatusChip, LevelBar, Skeleton, ErrorState, EmptyState, PageHeader, Pill,
} from "@/components/console/primitives";

/**
 * The whole printer fleet. `/admin/kiosks` returns every printer in one
 * response (there are tens, not thousands), so filtering happens client-side
 * and there's no pagination.
 */
export default function PrintersPage() {
  const [rows, setRows] = useState<KioskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ kiosks: KioskRow[] }>("/admin/kiosks");
      setRows(res.kiosks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((p) => {
      if (status && p.status !== status) return false;
      if (!q) return true;
      return [p.name, p.shopName, p.locationName, p.uniquePrinterId, p.ownerName]
        .some((f) => f?.toLowerCase().includes(q));
    });
  }, [rows, search, status]);

  return (
    <>
      <PageHeader
        title="Printers"
        subtitle="Every registered printer and its consumables."
        action={<Pill n={filtered.length} />}
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <LuSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Printer, shop, location or ID…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-slate-400 transition-colors"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 outline-none focus:border-slate-400 transition-colors cursor-pointer"
        >
          <option value="">All statuses</option>
          {["ONLINE", "OFFLINE", "ERROR", "MAINTENANCE"].map((s) => (
            <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>

      <Card>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={LuPrinter} title="No printers found" hint="Try a different search or filter." />
        ) : (
          <Table head={["Printer", "Vendor", "Status", "Paper", "Toner", "Last seen"]}>
            {filtered.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <p className="font-semibold text-slate-700 truncate max-w-[170px]">{p.name}</p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
                    {p.uniquePrinterId} · {p.locationName}
                  </p>
                </Td>
                <Td>
                  <p className="truncate max-w-[150px]">{p.shopName}</p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{p.ownerName}</p>
                </Td>
                <Td><StatusChip status={p.status} /></Td>
                <Td><LevelBar value={p.paperLevel} /></Td>
                <Td><LevelBar value={p.tonerLevel} /></Td>
                <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(p.lastSeenAt)}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
