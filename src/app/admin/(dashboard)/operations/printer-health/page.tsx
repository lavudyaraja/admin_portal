"use client";

// Printer health: which machines are up, which need consumables, and which are
// actually finishing the jobs they're given.

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  LuActivity, LuWifi, LuWifiOff, LuFileStack, LuDroplet,
  LuTriangleAlert, LuWrench, LuChartColumn, LuRefreshCw, LuPrinter,
} from "react-icons/lu";
import { apiFetch } from "@/lib/admin/api";
import { inr, count, dateTime } from "@/lib/console/format";
import { OpsTabs, useOpsTab, NoRecord, type OpsTab } from "@/components/admin/OpsTabs";
import { StatRow } from "@/components/admin/StatRow";
import {
  Card, Table, Td, Tr, StatusChip, LevelBar, Skeleton, ErrorState, EmptyState, PageHeader, StatTile,
} from "@/components/console/primitives";

interface HealthPrinter {
  id: string;
  name: string;
  uniquePrinterId: string;
  shopName: string;
  locationName: string;
  brand: string;
  model: string;
  status: string;
  paperLevel: number;
  tonerLevel: number;
  lastSeenAt: string | null;
  orders: number;
  completedOrders: number;
  failedOrders: number;
  pagesPrinted: number;
  revenuePaise: number;
  successRate: number | null;
  lowPaper: boolean;
  lowToner: boolean;
  issues: string[];
  healthy: boolean;
}

interface ErrorEntry {
  id: string;
  error: string | null;
  attempts: number;
  updatedAt: string;
  printer: { id: string; name: string; uniquePrinterId: string } | null;
  order: { orderCode: string } | null;
}

interface HealthData {
  total: number;
  online: number;
  offline: number;
  lowPaper: number;
  lowToner: number;
  errored: number;
  healthy: number;
  lowThreshold: number;
  printers: HealthPrinter[];
  errorLog: ErrorEntry[];
}

function PrinterHealthPageBody() {
  const tab = useOpsTab("online");
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<HealthData>("/operations/printer-health"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const all = data?.printers || [];
    switch (tab) {
      case "online": return all.filter((p) => p.status === "ONLINE");
      case "offline": return all.filter((p) => p.status !== "ONLINE");
      case "paper": return all.filter((p) => p.lowPaper).sort((a, b) => a.paperLevel - b.paperLevel);
      case "ink": return all.filter((p) => p.lowToner).sort((a, b) => a.tonerLevel - b.tonerLevel);
      case "performance": return [...all].sort((a, b) => (b.successRate ?? -1) - (a.successRate ?? -1));
      default: return all;
    }
  }, [data, tab]);

  const tabs: OpsTab[] = [
    { id: "online", label: "Online", icon: LuWifi, count: data?.online },
    { id: "offline", label: "Offline", icon: LuWifiOff, count: data ? data.total - data.online : undefined },
    { id: "paper", label: "Low Paper", icon: LuFileStack, count: data?.lowPaper },
    { id: "ink", label: "Low Ink", icon: LuDroplet, count: data?.lowToner },
    { id: "errors", label: "Error Logs", icon: LuTriangleAlert, count: data?.errorLog.length },
    { id: "maintenance", label: "Maintenance", icon: LuWrench },
    { id: "performance", label: "Performance", icon: LuChartColumn },
  ];

  return (
    <>
      <PageHeader
        title="Printer Health"
        subtitle="Availability, consumables and how reliably each machine finishes work."
        action={
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
          >
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      <StatRow loading={!data}>
        {data && (
          <>
            <StatTile label="Online" value={count(data.online)} icon={LuWifi} tint="mint" hint={`of ${count(data.total)} printers`} />
            <StatTile label="Needs attention" value={count(data.total - data.healthy)} icon={LuTriangleAlert} tint={data.total - data.healthy > 0 ? "blush" : "gray"} hint="offline, errored or low" />
            <StatTile label="Low paper" value={count(data.lowPaper)} icon={LuFileStack} tint={data.lowPaper > 0 ? "gold" : "gray"} hint={`at or under ${data.lowThreshold}%`} />
            <StatTile label="Low toner" value={count(data.lowToner)} icon={LuDroplet} tint={data.lowToner > 0 ? "gold" : "gray"} hint={`at or under ${data.lowThreshold}%`} />
          </>
        )}
      </StatRow>

      <OpsTabs tabs={tabs} active={tab} basePath="/admin/operations/printer-health" />

      {tab === "maintenance" ? (
        <NoRecord
          icon={LuWrench}
          title="Maintenance isn't tracked"
          needs="Nothing records servicing, part replacement, refills or scheduled upkeep. Paper and toner levels are live readings, not a maintenance history — this needs a maintenance record with date, action and who performed it."
        />
      ) : tab === "errors" ? (
        <>
          <Card>
            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : !data || data.errorLog.length === 0 ? (
              <EmptyState icon={LuTriangleAlert} title="No jobs in an error state" hint="Print jobs that fail appear here with the printer's own error text." />
            ) : (
              <Table head={["Printer", "Order", "Error", "Attempts", "When"]}>
                {data.errorLog.map((e) => (
                  <Tr key={e.id}>
                    <Td>
                      <p className="font-semibold text-slate-700">{e.printer?.name || "—"}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{e.printer?.uniquePrinterId}</p>
                    </Td>
                    <Td className="font-mono text-xs text-slate-600">{e.order?.orderCode || "—"}</Td>
                    <Td className="text-xs text-rose-600 truncate max-w-[260px]">{e.error || "No error text"}</Td>
                    <Td className="tabular-nums text-slate-600">{e.attempts}</Td>
                    <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(e.updatedAt)}</Td>
                  </Tr>
                ))}
              </Table>
            )}
          </Card>
          <p className="mt-3 text-xs text-slate-400">
            Currently-failing jobs only. There is no per-event error history — a printer that failed
            yesterday and recovered leaves no trace here.
          </p>
        </>
      ) : (
        <Card>
          {error ? (
            <ErrorState message={error} onRetry={load} />
          ) : loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={LuPrinter}
              title={
                tab === "paper" ? "No printer is low on paper"
                : tab === "ink" ? "No printer is low on toner"
                : tab === "offline" ? "Every printer is online"
                : "No printers"
              }
              hint="Machines matching this view will appear here."
            />
          ) : (
            <Table head={["Printer", "Shop", "Status", "Paper", "Toner", "Success", "Jobs", "Last seen"]}>
              {rows.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <p className="font-semibold text-slate-700">{p.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{p.uniquePrinterId}</p>
                  </Td>
                  <Td className="text-xs text-slate-600">
                    <p>{p.shopName}</p>
                    <p className="text-[11px] text-slate-400">{p.locationName}</p>
                  </Td>
                  <Td>
                    <StatusChip status={p.status} />
                    {p.issues.length > 0 && (
                      <p className="text-[10px] text-rose-600 mt-1">{p.issues.join(" · ")}</p>
                    )}
                  </Td>
                  <Td className="w-28"><LevelBar value={p.paperLevel} /></Td>
                  <Td className="w-28"><LevelBar value={p.tonerLevel} /></Td>
                  <Td>
                    {/* Null when the machine has never been given a job — "—" is
                        honest where 0% would read as "it fails everything". */}
                    {p.successRate === null ? (
                      <span className="text-slate-400 text-xs">—</span>
                    ) : (
                      <span className={`tabular-nums font-bold text-sm ${p.successRate >= 80 ? "text-emerald-600" : p.successRate >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                        {p.successRate}%
                      </span>
                    )}
                  </Td>
                  <Td className="text-xs whitespace-nowrap">
                    <p className="text-slate-700 font-semibold tabular-nums">{count(p.orders)} jobs</p>
                    <p className="text-[11px] text-slate-400">{count(p.pagesPrinted)} pages · {inr(p.revenuePaise)}</p>
                  </Td>
                  <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(p.lastSeenAt)}</Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>
      )}
    </>
  );
}

/**
 * The tab lives in the URL, so this reads `useSearchParams`. Next needs that
 * behind a Suspense boundary or the route can't be prerendered — without it the
 * production build fails outright.
 */
export default function PrinterHealthPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <PrinterHealthPageBody />
    </Suspense>
  );
}
