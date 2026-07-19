"use client";

// All vendors. The shop name opens the full record.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LuStore, LuSearch, LuChevronRight, LuPrinter, LuFileText, LuBanknote } from "react-icons/lu";
import { apiFetch, type VendorListRow } from "@/lib/admin/api";
import { count, dateOnly } from "@/lib/console/format";
import { useMetrics } from "@/lib/admin/useMetrics";
import { StatRow } from "@/components/admin/StatRow";
import {
  Card, Table, Td, Tr, Skeleton, ErrorState, EmptyState, PageHeader, Pill, StatTile,
} from "@/components/console/primitives";

export default function VendorsPage() {
  const m = useMetrics();
  const [rows, setRows] = useState<VendorListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ limit: "200" });
      if (search) qs.set("search", search);
      const res = await apiFetch<{ vendors: VendorListRow[]; total: number }>(`/vendors?${qs}`);
      setRows(res.vendors || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <>
      <PageHeader
        title="Vendors"
        subtitle="Every shop on the platform. Open a row for its full record."
        action={<Pill n={total} />}
      />

      <StatRow loading={!m}>
        {m && (
          <>
            <StatTile label="Vendor accounts" value={count(m.vendorCount)} icon={LuStore} tint="lavender" hint="with the vendor role" />
            <StatTile label="Shop profiles" value={count(m.vendorProfiles)} icon={LuStore} tint="sky" hint="completed setup" />
            <StatTile label="Printers" value={count(m.totalPrinters)} icon={LuPrinter} tint="mint" hint={`${count(m.activePrinters)} online`} />
            <StatTile label="Payout accounts" value={count(m.bankAccounts)} icon={LuBanknote} tint="gold" hint={`${count(m.verifiedBankAccounts)} verified`} />
          </>
        )}
      </StatRow>

      <div className="relative flex-1 min-w-[200px] max-w-sm mb-4">
        <LuSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Shop name or email…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-slate-400 transition-colors"
        />
      </div>

      <Card>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={LuStore}
            title="No vendors yet"
            hint={
              search
                ? "Try a different search."
                : "Shops appear here once someone registers a vendor account."
            }
          />
        ) : (
          <Table head={["Shop", "Owner", "Branches", "Printers", "Orders", "Registered"]}>
            {rows.map((v) => (
              <Tr key={v.id}>
                <Td>
                  <Link href={`/admin/management/vendors/${v.id}`} className="flex items-center gap-2.5 group/row">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                      {v.shopName?.[0]?.toUpperCase() || "?"}
                    </span>
                    <span className="font-semibold text-slate-700 truncate max-w-[160px] group-hover/row:text-slate-950 group-hover/row:underline">
                      {v.shopName}
                    </span>
                    <LuChevronRight size={14} className="text-slate-300 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0" />
                  </Link>
                </Td>
                <Td>
                  <p className="text-xs text-slate-600">{v.user?.name || v.contactName || "—"}</p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                    {v.user?.phone || v.mobileNumber || v.user?.email || ""}
                  </p>
                </Td>
                <Td className="text-xs text-slate-500 truncate max-w-[160px]">
                  {v.locations.length > 0 ? v.locations.map((l) => l.name).join(", ") : "—"}
                </Td>
                <Td className="tabular-nums">{count(v._count.printers)}</Td>
                <Td className="tabular-nums font-semibold text-slate-700">{count(v._count.orders)}</Td>
                <Td className="text-slate-400 text-xs whitespace-nowrap">{dateOnly(v.createdAt)}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
