"use client";

// The printer fleet, under the views an operator actually works in.
//
// Status / Health / Paper / Ink / Volume are all the same rows sorted and
// filtered differently — one list with view tabs, not five pages that would
// drift apart. `/admin/kiosks` returns every printer in one response (tens, not
// thousands), so filtering is client-side and there is no pagination.

import { Suspense, Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LuPrinter, LuSearch, LuActivity, LuLayers, LuFileStack, LuDroplet,
  LuTriangleAlert, LuWifi, LuWrench,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import { apiFetch, type KioskRow } from "@/lib/admin/api";
import { dateTime, dateOnly, count, inr } from "@/lib/console/format";
import { useMetrics } from "@/lib/admin/useMetrics";
import { StatRow } from "@/components/admin/StatRow";
import {
  Card, Table, Td, Tr, StatusChip, LevelBar, Skeleton, ErrorState, EmptyState, PageHeader, Pill, StatTile,
} from "@/components/console/primitives";

const LOW = 20;

const TABS: { id: string; label: string; icon: IconType }[] = [
  { id: "all", label: "All Printers", icon: LuLayers },
  { id: "status", label: "Printer Status", icon: LuWifi },
  { id: "health", label: "Printer Health", icon: LuActivity },
  { id: "paper", label: "Paper Levels", icon: LuFileStack },
  { id: "ink", label: "Ink Levels", icon: LuDroplet },
  { id: "volume", label: "Print Volume", icon: LuPrinter },
  { id: "errors", label: "Error Logs", icon: LuTriangleAlert },
  { id: "maintenance", label: "Maintenance", icon: LuWrench },
];

function PrintersPageBody() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get("tab") || "all";

  const m = useMetrics();
  const [rows, setRows] = useState<KioskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);

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

  useEffect(() => {
    load();
  }, [load]);

  /** Each view is the same fleet, filtered and ordered for the question it answers. */
  const view = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = rows.filter(
      (p) =>
        !q ||
        [p.name, p.shopName, p.locationName, p.uniquePrinterId, p.ownerName].some((f) =>
          f?.toLowerCase().includes(q)
        )
    );

    switch (tab) {
      case "status":
        // Anything not online first — that's what needs looking at.
        return [...base].sort((a, b) => Number(a.status === "ONLINE") - Number(b.status === "ONLINE"));
      case "health":
        return [...base].sort((a, b) => healthScore(a) - healthScore(b));
      case "paper":
        return [...base].sort((a, b) => a.paperLevel - b.paperLevel);
      case "ink":
        return [...base].sort((a, b) => a.tonerLevel - b.tonerLevel);
      case "volume":
        return [...base].sort((a, b) => b.orders - a.orders);
      case "errors":
        return base.filter((p) => p.status === "ERROR" || p.status === "OUT_OF_PAPER");
      default:
        return base;
    }
  }, [rows, search, tab]);

  return (
    <>
      <PageHeader
        title="Printers"
        subtitle="Every registered machine, its consumables and how much work it does."
        action={<Pill n={view.length} />}
      />

      <StatRow loading={!m}>
        {m && (
          <>
            <StatTile label="Registered" value={count(m.totalPrinters)} icon={LuPrinter} tint="lavender" hint="across all vendors" />
            <StatTile label="Online" value={count(m.activePrinters)} icon={LuWifi} tint="mint" hint={`${count(m.offlinePrinters)} offline`} />
            <StatTile label="Low on paper" value={count(m.lowPaperCount)} icon={LuTriangleAlert} tint={m.lowPaperCount > 0 ? "blush" : "gray"} hint={`at or under ${LOW}%`} />
            <StatTile label="Pages printed" value={count(m.totalPagesPrinted)} icon={LuFileStack} tint="sky" hint="completed orders" />
          </>
        )}
      </StatRow>

      <div className="mb-4 -mx-1 overflow-x-auto">
        <div className="flex gap-1 px-1 min-w-max border-b border-slate-200">
          {TABS.map((t) => {
            const on = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => router.replace(`/admin/management/printers?tab=${t.id}`, { scroll: false })}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
                  on ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon size={15} className={on ? "text-slate-700" : "text-slate-400"} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab !== "maintenance" && (
        <div className="relative flex-1 min-w-[200px] max-w-sm mb-4">
          <LuSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Printer, shop, location or ID…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-slate-400 transition-colors"
          />
        </div>
      )}

      {/* Maintenance has no record behind it — saying so beats an empty table
          that looks like "no maintenance has ever been needed". */}
      {tab === "maintenance" ? (
        <Card className="p-10">
          <EmptyState
            icon={LuWrench}
            title="Maintenance history isn't recorded yet"
            hint="Nothing in the system logs servicing, part changes or refills. This needs a maintenance record before it can show anything real."
          />
        </Card>
      ) : (
        <Card>
          {error ? (
            <ErrorState message={error} onRetry={load} />
          ) : loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : view.length === 0 ? (
            <EmptyState
              icon={LuPrinter}
              title={tab === "errors" ? "No printers reporting errors" : "No printers found"}
              hint={tab === "errors" ? "Machines in an error or out-of-paper state appear here." : "Try a different search."}
            />
          ) : (
            <Table head={headFor(tab)}>
              {view.map((p) => (
                <Fragment key={p.id}>
                  <Tr>
                    <Td>
                      <button onClick={() => setOpen(open === p.id ? null : p.id)} className="text-left cursor-pointer">
                        <p className="font-semibold text-slate-700 truncate max-w-[170px]">{p.name}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
                          {p.uniquePrinterId} · {p.locationName}
                        </p>
                      </button>
                    </Td>
                    <Td>
                      <p className="truncate max-w-[150px]">{p.shopName}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{p.ownerName}</p>
                    </Td>

                    {tab === "volume" ? (
                      <>
                        <Td className="tabular-nums font-bold text-slate-800">{count(p.orders)}</Td>
                        <Td className="tabular-nums text-slate-600">{count(p.customers)}</Td>
                        <Td><StatusChip status={p.status} /></Td>
                      </>
                    ) : tab === "paper" ? (
                      <>
                        <Td className="w-40"><LevelBar value={p.paperLevel} /></Td>
                        <Td className={`tabular-nums font-bold ${p.paperLevel <= LOW ? "text-rose-600" : "text-slate-600"}`}>{p.paperLevel}%</Td>
                        <Td><StatusChip status={p.status} /></Td>
                      </>
                    ) : tab === "ink" ? (
                      <>
                        <Td className="w-40"><LevelBar value={p.tonerLevel} /></Td>
                        <Td className={`tabular-nums font-bold ${p.tonerLevel <= LOW ? "text-rose-600" : "text-slate-600"}`}>{p.tonerLevel}%</Td>
                        <Td><StatusChip status={p.status} /></Td>
                      </>
                    ) : tab === "health" ? (
                      <>
                        <Td><HealthPill printer={p} /></Td>
                        <Td className="w-32"><LevelBar value={p.paperLevel} /></Td>
                        <Td className="w-32"><LevelBar value={p.tonerLevel} /></Td>
                        <Td><StatusChip status={p.status} /></Td>
                      </>
                    ) : (
                      <>
                        <Td><StatusChip status={p.status} /></Td>
                        <Td className="w-32"><LevelBar value={p.paperLevel} /></Td>
                        <Td className="w-32"><LevelBar value={p.tonerLevel} /></Td>
                        <Td className="text-xs whitespace-nowrap">
                          <p className="text-slate-600">{count(p.orders)} orders</p>
                          <p className="text-[11px] text-slate-400">{dateOnly(p.createdAt)}</p>
                        </Td>
                      </>
                    )}

                    <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(p.lastSeenAt)}</Td>
                  </Tr>

                  {open === p.id && (
                    <Tr>
                      <Td colSpan={headFor(tab).length} className="bg-slate-50/70">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 py-1">
                          <Detail label="Model" value={`${p.brand} ${p.model}`} />
                          <Detail label="Serial" value={p.serialNumber || "—"} mono />
                          <Detail label="IP address" value={p.ipAddress} mono />
                          <Detail label="Registered" value={dateTime(p.createdAt)} />
                          <Detail label="Owner" value={p.ownerName} />
                          <Detail label="Contact" value={p.mobileNumber || "—"} />
                          <Detail label="B&W rate" value={`${inr(p.costPerBWPagePaise)}/page`} />
                          <Detail label="Colour rate" value={`${inr(p.costPerColorPagePaise)}/page`} />
                          <Detail label="Customers" value={count(p.customers)} />
                          <Detail
                            label="Capabilities"
                            value={[p.colorPrinting ? "Colour" : "B&W only", p.duplexPrinting ? "Duplex" : "Single-sided"].join(" · ")}
                          />
                          <Detail label="Paper sizes" value={(p.supportedPaperSizes || []).join(", ") || "—"} />
                        </div>
                      </Td>
                    </Tr>
                  )}
                </Fragment>
              ))}
            </Table>
          )}
        </Card>
      )}

      {tab === "errors" && (
        <p className="mt-3 text-xs text-slate-400">
          Current error states only. There is no per-event error log — a machine that failed
          yesterday and recovered does not appear here.
        </p>
      )}
    </>
  );
}

/** Lower is worse — used only for ordering the health view. */
function healthScore(p: KioskRow): number {
  let score = 100;
  if (p.status === "ERROR") score -= 60;
  if (p.status === "OUT_OF_PAPER") score -= 50;
  if (p.status === "OFFLINE") score -= 30;
  score -= Math.max(0, LOW - p.paperLevel);
  score -= Math.max(0, LOW - p.tonerLevel);
  return score;
}

function HealthPill({ printer }: { printer: KioskRow }) {
  const issues: string[] = [];
  if (printer.status === "ERROR") issues.push("Error");
  if (printer.status === "OUT_OF_PAPER") issues.push("Out of paper");
  if (printer.status === "OFFLINE") issues.push("Offline");
  if (printer.paperLevel <= LOW) issues.push("Low paper");
  if (printer.tonerLevel <= LOW) issues.push("Low toner");

  if (issues.length === 0) {
    return (
      <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
        Healthy
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border bg-rose-50 text-rose-700 border-rose-200">
      {issues.join(" · ")}
    </span>
  );
}

function headFor(tab: string): string[] {
  switch (tab) {
    case "volume": return ["Printer", "Vendor", "Orders", "Customers", "Status", "Last seen"];
    case "paper": return ["Printer", "Vendor", "Paper", "Level", "Status", "Last seen"];
    case "ink": return ["Printer", "Vendor", "Toner", "Level", "Status", "Last seen"];
    case "health": return ["Printer", "Vendor", "Health", "Paper", "Toner", "Status", "Last seen"];
    default: return ["Printer", "Vendor", "Status", "Paper", "Toner", "Usage", "Last seen"];
  }
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-xs text-slate-700 truncate ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

/**
 * The tab lives in the URL, so this reads `useSearchParams`. Next needs that
 * behind a Suspense boundary or the route can't be prerendered — without it the
 * production build fails outright.
 */
export default function PrintersPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <PrintersPageBody />
    </Suspense>
  );
}
