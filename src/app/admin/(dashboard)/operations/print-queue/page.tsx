"use client";

// The print queue, backed by PrintJob — a real record with status, attempt
// count, the printer's own error text and start/finish stamps.
//
// Live / Pending / Processing / Completed / Failed are one dataset under a
// status filter. Reprint Requests has no record behind it and says so.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuActivity, LuClock, LuLoader, LuCircleCheck, LuTriangleAlert,
  LuRotateCcw, LuPrinter, LuRefreshCw,
} from "react-icons/lu";
import { apiFetch } from "@/lib/admin/api";
import { inr, count, dateTime } from "@/lib/console/format";
import { OpsTabs, useOpsTab, NoRecord, type OpsTab } from "@/components/admin/OpsTabs";
import { StatRow } from "@/components/admin/StatRow";
import {
  Card, Table, Td, Tr, StatusChip, Skeleton, ErrorState, EmptyState, PageHeader, StatTile,
} from "@/components/console/primitives";

interface Job {
  id: string;
  status: string;
  attempts: number;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  printer: { id: string; name: string; uniquePrinterId: string; shopName: string; status: string } | null;
  order: {
    id: string;
    orderCode: string;
    status: string;
    costPaise: number;
    pagesToPrint: number;
    user: { id: string; name: string; phone: string | null } | null;
    document: { fileName: string } | null;
  } | null;
}

interface QueueData {
  total: number;
  queued: number;
  sent: number;
  printing: number;
  done: number;
  error: number;
  jobs: Job[];
}

/** Which PrintJob statuses each tab shows. Null means "everything". */
const FILTERS: Record<string, string[] | null> = {
  live: ["QUEUED", "SENT", "PRINTING"],
  pending: ["QUEUED"],
  processing: ["SENT", "PRINTING"],
  completed: ["DONE"],
  failed: ["ERROR"],
  reprints: null,
};

function PrintQueuePageBody() {
  const tab = useOpsTab("live");
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<QueueData>("/operations/print-queue"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function retry(id: string) {
    setRetrying(id);
    try {
      await apiFetch(`/operations/print-queue/${id}/retry`, { method: "POST" });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not retry that job.");
    }
    setRetrying(null);
  }

  const tabs: OpsTab[] = [
    { id: "live", label: "Live Jobs", icon: LuActivity, count: data ? data.queued + data.sent + data.printing : undefined },
    { id: "pending", label: "Pending", icon: LuClock, count: data?.queued },
    { id: "processing", label: "Processing", icon: LuLoader, count: data ? data.sent + data.printing : undefined },
    { id: "completed", label: "Completed", icon: LuCircleCheck, count: data?.done },
    { id: "failed", label: "Failed", icon: LuTriangleAlert, count: data?.error },
    { id: "reprints", label: "Reprint Requests", icon: LuRotateCcw },
  ];

  const allowed = FILTERS[tab];
  const jobs = (data?.jobs || []).filter((j) => !allowed || allowed.includes(j.status));

  return (
    <>
      <PageHeader
        title="Print Queue"
        subtitle="Jobs handed to printers, and what happened to them."
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
            <StatTile label="In flight" value={count(data.queued + data.sent + data.printing)} icon={LuActivity} tint="lavender" hint="queued or printing" />
            <StatTile label="Pending" value={count(data.queued)} icon={LuClock} tint="gold" hint="waiting for a printer" />
            <StatTile label="Completed" value={count(data.done)} icon={LuCircleCheck} tint="mint" hint="finished cleanly" />
            <StatTile label="Failed" value={count(data.error)} icon={LuTriangleAlert} tint={data.error > 0 ? "blush" : "gray"} hint="retryable" />
          </>
        )}
      </StatRow>

      <OpsTabs tabs={tabs} active={tab} basePath="/admin/operations/print-queue" />

      {tab === "reprints" ? (
        <NoRecord
          icon={LuRotateCcw}
          title="Reprint requests aren't recorded"
          needs="A user can report a bad print, which becomes a dispute, but there is no separate reprint request — nothing lets someone ask for the same job to be run again. That needs a reprint record linked to the original order."
        />
      ) : (
        <Card>
          {error ? (
            <ErrorState message={error} onRetry={load} />
          ) : loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={LuPrinter}
              title={`No ${tabs.find((t) => t.id === tab)?.label.toLowerCase()}`}
              hint="Jobs in this state will appear here."
            />
          ) : (
            <Table head={["Order", "Customer", "Printer", "Status", "Attempts", "Timing", tab === "failed" ? "Error" : "Amount"]}>
              {jobs.map((j) => (
                <Tr key={j.id}>
                  <Td>
                    <p className="font-mono text-xs font-semibold text-slate-700">{j.order?.orderCode || "—"}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                      {j.order?.document?.fileName || `${j.order?.pagesToPrint ?? 0} page(s)`}
                    </p>
                  </Td>
                  <Td>
                    {j.order?.user ? (
                      <Link href={`/admin/management/users/${j.order.user.id}`} className="text-slate-700 hover:underline text-sm">
                        {j.order.user.name}
                      </Link>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </Td>
                  <Td className="text-xs">
                    <p className="text-slate-600 truncate max-w-[140px]">{j.printer?.name || "—"}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{j.printer?.uniquePrinterId}</p>
                  </Td>
                  <Td><StatusChip status={j.status} /></Td>
                  <Td className="tabular-nums text-slate-600">{j.attempts}</Td>
                  <Td className="text-[11px] text-slate-400 whitespace-nowrap">
                    <p>Queued {dateTime(j.createdAt)}</p>
                    {j.finishedAt && <p>Finished {dateTime(j.finishedAt)}</p>}
                  </Td>
                  {tab === "failed" ? (
                    <Td>
                      <p className="text-xs text-rose-600 truncate max-w-[200px]">{j.error || "No error text"}</p>
                      <button
                        onClick={() => retry(j.id)}
                        disabled={retrying === j.id}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-2 py-1 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <LuRotateCcw size={11} /> {retrying === j.id ? "Retrying…" : "Retry"}
                      </button>
                    </Td>
                  ) : (
                    <Td className="tabular-nums font-semibold text-slate-700">{inr(j.order?.costPaise ?? 0)}</Td>
                  )}
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
export default function PrintQueuePage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <PrintQueuePageBody />
    </Suspense>
  );
}
