"use client";

// Settlement reports: earnings reconciled against payouts, month by month.
//
// This is the view an accountant asks for — for each month, what the shop
// earned, what the platform took, what was actually transferred, and what is
// still outstanding. It is derived from the daily revenue series and the payout
// records rather than stored: a settlement that disagreed with the payouts
// behind it would be worse than no settlement page at all.
import { useCallback, useEffect, useMemo, useState } from "react";
import { LuScale, LuRefreshCw, LuDownload } from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import { inr, count } from "@/lib/console/format";
import {
  Card, Table, Td, Tr, Skeleton, ErrorState, EmptyState, PageHeader, Chip, cx,
} from "@/components/console/primitives";

interface RevenuePoint {
  date: string;
  revenuePaise: number;
  orders: number;
}

interface Payout {
  id: string;
  grossPaise: number;
  commissionPaise: number;
  netPaise: number;
  periodStart: string;
  periodEnd: string;
  status: string;
}

interface MonthRow {
  key: string;
  label: string;
  earnedPaise: number;
  orders: number;
  commissionPaise: number;
  settledPaise: number;
  outstandingPaise: number;
  payouts: number;
}

const MONTH_FMT = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

export default function SettlementsPage() {
  const [daily, setDaily] = useState<RevenuePoint[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [rev, pay] = await Promise.all([
        apiFetch<{ daily: RevenuePoint[] }>("/vendors/me/revenue"),
        apiFetch<{ payouts: Payout[] }>("/vendors/me/payouts").catch(() => ({ payouts: [] })),
      ]);
      setDaily(rev.daily || []);
      setPayouts(pay.payouts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build your settlement report.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const months = useMemo<MonthRow[]>(() => {
    const acc = new Map<string, MonthRow>();

    const ensure = (d: Date): MonthRow => {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      let row = acc.get(key);
      if (!row) {
        row = {
          key,
          label: MONTH_FMT.format(d),
          earnedPaise: 0,
          orders: 0,
          commissionPaise: 0,
          settledPaise: 0,
          outstandingPaise: 0,
          payouts: 0,
        };
        acc.set(key, row);
      }
      return row;
    };

    for (const point of daily) {
      const row = ensure(new Date(point.date));
      row.earnedPaise += point.revenuePaise;
      row.orders += point.orders;
    }

    // A payout is attributed to the month its period ends in — that is the month
    // it settles, even when the window straddles a boundary.
    for (const p of payouts) {
      const row = ensure(new Date(p.periodEnd));
      row.commissionPaise += p.commissionPaise;
      row.payouts += 1;
      if (p.status === "PAID") row.settledPaise += p.netPaise;
    }

    return Array.from(acc.values())
      .map((row) => ({
        ...row,
        outstandingPaise: Math.max(0, row.earnedPaise - row.commissionPaise - row.settledPaise),
      }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [daily, payouts]);

  const totals = useMemo(
    () =>
      months.reduce(
        (t, m) => ({
          earned: t.earned + m.earnedPaise,
          orders: t.orders + m.orders,
          commission: t.commission + m.commissionPaise,
          settled: t.settled + m.settledPaise,
          outstanding: t.outstanding + m.outstandingPaise,
        }),
        { earned: 0, orders: 0, commission: 0, settled: 0, outstanding: 0 }
      ),
    [months]
  );

  /** CSV of exactly what is on screen — nothing is recomputed on export. */
  function exportCsv() {
    const header = ["Month", "Orders", "Earned", "Commission", "Settled", "Outstanding"];
    const rows = months.map((m) => [
      m.label,
      String(m.orders),
      (m.earnedPaise / 100).toFixed(2),
      (m.commissionPaise / 100).toFixed(2),
      (m.settledPaise / 100).toFixed(2),
      (m.outstandingPaise / 100).toFixed(2),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `settlements-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <PageHeader
        title="Settlement Reports"
        subtitle="Month by month: earned, commission, settled, outstanding."
        action={
          <div className="flex gap-2">
            {months.length > 0 && (
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
              >
                <LuDownload size={13} /> CSV
              </button>
            )}
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
            >
              <LuRefreshCw size={13} /> Refresh
            </button>
          </div>
        }
      />

      <Card>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : months.length === 0 ? (
          <EmptyState
            icon={LuScale}
            title="Nothing to settle yet"
            hint="Once you have completed orders, each month appears here."
          />
        ) : (
          <>
            <Table head={["Month", "Orders", "Earned", "Commission", "Settled", "Outstanding"]}>
              {months.map((m) => (
                <Tr key={m.key}>
                  <Td className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                    {m.label}
                    {m.payouts > 0 && (
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {count(m.payouts)} payout{m.payouts === 1 ? "" : "s"}
                      </span>
                    )}
                  </Td>
                  <Td className="tabular-nums text-sm text-slate-600">{m.orders}</Td>
                  <Td className="tabular-nums text-sm font-semibold text-slate-800">
                    {inr(m.earnedPaise)}
                  </Td>
                  <Td className="tabular-nums text-sm text-slate-500">
                    {m.commissionPaise > 0 ? `−${inr(m.commissionPaise)}` : "—"}
                  </Td>
                  <Td className="tabular-nums text-sm text-emerald-700 font-semibold">
                    {m.settledPaise > 0 ? inr(m.settledPaise) : "—"}
                  </Td>
                  <Td>
                    {m.outstandingPaise > 0 ? (
                      <Chip label={inr(m.outstandingPaise)} tint="gold" />
                    ) : (
                      <Chip label="Settled" tint="mint" />
                    )}
                  </Td>
                </Tr>
              ))}

              {/* Totals row, so the page footers itself rather than making the
                  reader add six months of numbers in their head. */}
              <Tr>
                <Td className="text-sm font-black text-slate-900">All time</Td>
                <Td className="tabular-nums text-sm font-bold text-slate-700">{totals.orders}</Td>
                <Td className="tabular-nums text-sm font-black text-slate-900">
                  {inr(totals.earned)}
                </Td>
                <Td className="tabular-nums text-sm font-bold text-slate-600">
                  {totals.commission > 0 ? `−${inr(totals.commission)}` : "—"}
                </Td>
                <Td className="tabular-nums text-sm font-black text-emerald-700">
                  {inr(totals.settled)}
                </Td>
                <Td
                  className={cx(
                    "tabular-nums text-sm font-black",
                    totals.outstanding > 0 ? "text-amber-700" : "text-slate-400"
                  )}
                >
                  {inr(totals.outstanding)}
                </Td>
              </Tr>
            </Table>

            <p className="px-5 py-3 border-t border-slate-100 text-[11px] text-slate-400">
              Built from your completed orders and recorded payouts. &ldquo;Outstanding&rdquo; is
              what a settled payout hasn&apos;t covered yet — it isn&apos;t a promised transfer date.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
