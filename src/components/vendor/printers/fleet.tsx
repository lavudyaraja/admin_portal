"use client";

/**
 * The fleet views: Status, Health, Paper, Ink and Maintenance.
 *
 * All five read the same two endpoints — `/printers` for the machines and
 * `/vendors/me/stats` for per-printer order and failure counts — so they are
 * built on one hook rather than five copies of the same fetch. What differs
 * between them is which column is the subject and what counts as "needs
 * attention", and that is all each page supplies.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { IconType } from "react-icons";
import { LuRefreshCw } from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import { count, dateTime } from "@/lib/console/format";
import {
  Card, Skeleton, EmptyState, ErrorState, PageHeader, cx,
} from "@/components/console/primitives";

export interface FleetPrinter {
  id: string;
  uniquePrinterId: string;
  name: string;
  brand: string;
  model: string;
  status: string;
  locationName: string;
  shopName: string;
  colorPrinting: boolean;
  duplexPrinting: boolean;
  paperLevel: number;
  tonerLevel: number;
  lastSeenAt: string | null;
  createdAt: string;
  _count: { orders: number };
  /** Merged in from /vendors/me/stats — absent for a machine with no orders. */
  orders?: number;
  failures?: number;
}

interface PrinterStat {
  id: string;
  orders: number;
  failures: number;
}

/** Levels at or below these are treated as needing a refill. */
export const LOW_PAPER = 30;
export const LOW_TONER = 20;
/** A machine unseen for longer than this is treated as out of contact. */
export const STALE_HOURS = 24;

export function hoursSince(iso: string | null): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / 36e5;
}

export function isStale(p: FleetPrinter): boolean {
  const h = hoursSince(p.lastSeenAt);
  return h === null || h > STALE_HOURS;
}

/** Every reason this machine wants a human, in the order a shop would act. */
export function attentionReasons(p: FleetPrinter): string[] {
  const out: string[] = [];
  if (p.status === "ERROR") out.push("Reporting an error");
  if (p.status === "OUT_OF_PAPER") out.push("Out of paper");
  if (p.paperLevel <= LOW_PAPER && p.status !== "OUT_OF_PAPER") out.push(`Paper at ${p.paperLevel}%`);
  if (p.tonerLevel <= LOW_TONER) out.push(`Toner at ${p.tonerLevel}%`);
  if (p.status === "OFFLINE") out.push("Offline");
  if (isStale(p)) {
    const h = hoursSince(p.lastSeenAt);
    out.push(h === null ? "Never checked in" : `No contact for ${Math.round(h)}h`);
  }
  // A machine that fails a fifth of its jobs is broken even when every other
  // signal says it is fine, which is exactly the case a status list misses.
  const orders = p.orders ?? 0;
  const failures = p.failures ?? 0;
  if (orders >= 5 && failures / orders >= 0.2) {
    out.push(`${Math.round((failures / orders) * 100)}% of jobs failing`);
  }
  return out;
}

/** Shared loader for every fleet page. */
export function useFleet() {
  const [printers, setPrinters] = useState<FleetPrinter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [fleet, stats] = await Promise.all([
        apiFetch<{ printers: FleetPrinter[] }>("/printers?limit=200"),
        // Order counts are a nice-to-have; a stats failure must not empty the
        // whole page, so it degrades to no counts rather than an error.
        apiFetch<{ printers: PrinterStat[] }>("/vendors/me/stats").catch(() => ({ printers: [] })),
      ]);

      const byId = new Map((stats.printers || []).map((s) => [s.id, s]));
      setPrinters(
        (fleet.printers || []).map((p) => ({
          ...p,
          orders: byId.get(p.id)?.orders ?? p._count?.orders ?? 0,
          failures: byId.get(p.id)?.failures ?? 0,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your printers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { printers, loading, error, reload: load };
}

// ── Shared chrome ───────────────────────────────────────────────────────────

/**
 * Frame every fleet view shares: the summary strip, refresh, and the loading,
 * error and empty states.
 *
 * No page header — these render under the Printers tab strip, which already
 * carries the title. Two headings stacked reads as a bug.
 */
export function FleetPage({
  icon,
  emptyTitle,
  emptyHint,
  state,
  summary,
  children,
}: {
  icon: IconType;
  emptyTitle: string;
  emptyHint: string;
  state: ReturnType<typeof useFleet>;
  /** Optional strip of counts above the list. */
  summary?: React.ReactNode;
  /** Rendered only when there is at least one printer. */
  children: React.ReactNode;
}) {
  const { printers, loading, error, reload } = state;

  return (
    <div className="space-y-4">
      {!loading && !error && printers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {summary}
          <button
            onClick={reload}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
          >
            <LuRefreshCw size={13} /> Refresh
          </button>
        </div>
      )}

      {loading ? (
        <Card>
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        </Card>
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      ) : printers.length === 0 ? (
        <Card>
          <EmptyState icon={icon} title={emptyTitle} hint={emptyHint} />
        </Card>
      ) : (
        children
      )}
    </div>
  );
}

/** Status dot + label, matching the tints used across the console. */
export function StatusDot({ status }: { status: string }) {
  const tone =
    status === "ONLINE"
      ? "bg-emerald-500"
      : status === "BUSY"
        ? "bg-amber-500"
        : status === "ERROR" || status === "OUT_OF_PAPER"
          ? "bg-rose-500"
          : status === "LOW_TONER"
            ? "bg-yellow-500"
            : "bg-slate-300";
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className={cx("w-2 h-2 rounded-full shrink-0", tone)} />
      <span className="text-xs font-bold text-slate-700">{status.replace(/_/g, " ")}</span>
    </span>
  );
}

/**
 * A consumable level. Colour is semantic — it goes amber then rose as the level
 * falls — rather than coming from the palette, because "nearly empty" has to
 * read as a warning and not as a category.
 */
export function LevelMeter({ value, low }: { value: number; low: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const fill = pct <= low ? "bg-rose-500" : pct <= low * 2 ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2.5 min-w-[130px]">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={cx("h-full rounded-full transition-[width]", fill)} style={{ width: `${pct}%` }} />
      </div>
      <span
        className={cx(
          "text-xs font-bold tabular-nums w-9 text-right",
          pct <= low ? "text-rose-600" : "text-slate-600"
        )}
      >
        {pct}%
      </span>
    </div>
  );
}

/** One machine's identity, used as the first cell of every fleet table. */
export function PrinterCell({ printer }: { printer: FleetPrinter }) {
  return (
    <div className="min-w-0">
      <p className="font-semibold text-slate-800 text-sm truncate">{printer.name}</p>
      <p className="text-[11px] text-slate-400 truncate">
        <span className="font-mono">{printer.uniquePrinterId}</span>
        {printer.locationName ? ` · ${printer.locationName}` : ""}
      </p>
    </div>
  );
}

/** "2h ago" / "Never" for a last-seen timestamp. */
export function LastSeen({ at }: { at: string | null }) {
  if (!at) return <span className="text-xs text-rose-600 font-semibold">Never</span>;
  const h = hoursSince(at)!;
  const label = h < 1 ? "Just now" : h < 24 ? `${Math.round(h)}h ago` : `${Math.round(h / 24)}d ago`;
  return (
    <span
      className={cx(
        "text-xs whitespace-nowrap",
        h > STALE_HOURS ? "text-rose-600 font-semibold" : "text-slate-400"
      )}
      title={dateTime(at)}
    >
      {label}
    </span>
  );
}

/** A small labelled count, for the strips above each fleet table. */
export function CountChip({
  label,
  n,
  tone = "slate",
}: {
  label: string;
  n: number;
  tone?: "slate" | "good" | "warn" | "bad";
}) {
  const cls = {
    slate: "text-slate-600 border-slate-200",
    good: "text-emerald-700 border-emerald-200 bg-emerald-50",
    warn: "text-amber-700 border-amber-200 bg-amber-50",
    bad: "text-rose-700 border-rose-200 bg-rose-50",
  }[tone];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 text-xs font-bold bg-white border rounded-xl px-3 py-2 tabular-nums",
        cls
      )}
    >
      {count(n)} {label}
    </span>
  );
}
