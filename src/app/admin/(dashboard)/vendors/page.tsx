"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LuStore, LuSearch, LuPrinter, LuCircleOff, LuMapPin } from "react-icons/lu";
import { apiFetch, type KioskRow } from "@/lib/admin/api";
import { dateOnly, count } from "@/lib/console/format";
import {
  Card, Table, Td, Tr, Chip, Skeleton, ErrorState, EmptyState, PageHeader, Pill, StatTile,
} from "@/components/console/primitives";

/**
 * Shop owners, read from the real Vendor table.
 *
 * This page used to list users with the OPERATOR role and guess which printers
 * were theirs by matching Printer.ownerName — a free-text field — against the
 * account name, which merged any two vendors who happened to share a name. Now
 * that Printer has a vendorId, GET /vendors returns each vendor with their
 * branches and printer counts already joined.
 */
type VendorRow = {
  id: string;
  shopName: string;
  contactName: string | null;
  mobileNumber: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string | null; phone: string | null };
  locations: { id: string; name: string }[];
  _count: { printers: number; orders: number };
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [printers, setPrinters] = useState<KioskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [v, k] = await Promise.all([
        apiFetch<{ vendors: VendorRow[] }>("/vendors?limit=200"),
        apiFetch<{ kiosks: KioskRow[] }>("/admin/kiosks"),
      ]);
      setVendors(v.vendors || []);
      setPrinters(k.kiosks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Printers still come from the fleet endpoint, for the online counts — grouped
  // by vendorId now rather than by name.
  const byVendor = useMemo(() => {
    const map = new Map<string, KioskRow[]>();
    for (const p of printers) {
      const key = p.vendorId;
      if (!key) continue;
      const list = map.get(key);
      if (list) list.push(p);
      else map.set(key, [p]);
    }
    return map;
  }, [printers]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vendors
      .map((v) => {
        const owned = byVendor.get(v.id) || [];
        return { v, owned, online: owned.filter((p) => p.status === "ONLINE").length };
      })
      .filter(({ v }) => {
        if (!q) return true;
        return (
          v.shopName.toLowerCase().includes(q) ||
          v.user.name.toLowerCase().includes(q) ||
          v.user.email?.toLowerCase().includes(q) ||
          v.user.phone?.includes(q) ||
          v.mobileNumber?.includes(q) ||
          v.locations.some((l) => l.name.toLowerCase().includes(q))
        );
      });
  }, [vendors, byVendor, search]);

  // Printers the backfill couldn't match to an account. An admin has to attach
  // these by hand — until then nobody can manage them from the vendor console.
  const unassigned = printers.filter((p) => !p.vendorId).length;
  const totalOnline = printers.filter((p) => p.status === "ONLINE").length;

  return (
    <>
      <PageHeader
        title="Vendors"
        subtitle="Shop owners running printers on the network."
        action={<Pill n={rows.length} />}
      />

      {!loading && !error && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatTile label="Vendors" value={count(vendors.length)} icon={LuStore} tint="mint" />
          <StatTile label="Printers" value={count(printers.length)} icon={LuPrinter} tint="sky" />
          <StatTile
            label="Online now"
            value={`${totalOnline}/${printers.length}`}
            icon={LuPrinter}
            tint="aqua"
          />
          <StatTile
            label="Unassigned"
            value={count(unassigned)}
            icon={LuCircleOff}
            tint={unassigned > 0 ? "gold" : "gray"}
            hint="Not linked to a vendor account"
          />
        </section>
      )}

      <div className="relative flex-1 max-w-sm mb-4">
        <LuSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Vendor, shop, branch, phone or email…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-slate-400 transition-colors"
        />
      </div>

      <Card>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={LuStore}
            title="No vendors found"
            hint="A vendor profile is created when a shop owner registers on the vendor console."
          />
        ) : (
          <Table head={["Vendor", "Contact", "Branches", "Printers", "Joined"]}>
            {rows.map(({ v, owned, online }) => (
              <Tr key={v.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-slate-900 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                      {v.shopName?.[0]?.toUpperCase() || "?"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-700 truncate max-w-[150px]">{v.shopName}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{v.user.name}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <p className="text-xs">{v.mobileNumber || v.user.phone || "—"}</p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{v.user.email || ""}</p>
                </Td>
                <Td className="max-w-[200px]">
                  {v.locations.length === 0 ? (
                    <span className="text-slate-300">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {v.locations.slice(0, 2).map((l) => (
                        <Chip key={l.id} label={l.name} tint="lavender" />
                      ))}
                      {v.locations.length > 2 && (
                        <Chip label={`+${v.locations.length - 2}`} tint="gray" />
                      )}
                    </div>
                  )}
                </Td>
                <Td className="tabular-nums whitespace-nowrap">
                  {v._count.printers === 0 ? (
                    <span className="text-slate-300">none</span>
                  ) : (
                    <>
                      <span className="font-bold text-slate-800">{online}</span>
                      <span className="text-slate-400"> / {v._count.printers} online</span>
                    </>
                  )}
                </Td>
                <Td className="text-slate-400 text-xs whitespace-nowrap">{dateOnly(v.createdAt)}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      {!loading && !error && unassigned > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <LuMapPin size={13} />
          {unassigned} printer{unassigned === 1 ? "" : "s"} {unassigned === 1 ? "is" : "are"} not
          linked to any vendor account — assign {unassigned === 1 ? "it" : "them"} from the Printers page.
        </p>
      )}
    </>
  );
}
