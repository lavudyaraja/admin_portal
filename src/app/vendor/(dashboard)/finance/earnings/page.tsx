"use client";

// Earnings: what this shop has actually made, and what is still owed.
//
// Revenue and earnings are not the same number and this page exists to keep
// them apart. Revenue is what customers paid; earnings is that less anything
// refunded, and split into what has already been paid out and what has not.
// A shop owner asking "how much am I owed" is asking about the last of those.
import { useCallback, useEffect, useState } from "react";
import {
  LuCoins, LuTrendingUp, LuWallet, LuUndo2, LuRefreshCw, LuIndianRupee,
} from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import { inr, inrCompact, count, dateOnly } from "@/lib/console/format";
import {
  Card, CardHeader, Table, Td, Tr, Skeleton, ErrorState, EmptyState, PageHeader, StatTile,
} from "@/components/console/primitives";

interface RevenuePoint {
  date: string;
  revenuePaise: number;
  orders: number;
}

interface RevenueData {
  totalRevenuePaise: number;
  daily: RevenuePoint[];
}

interface Payout {
  id: string;
  grossPaise: number;
  commissionPaise: number;
  netPaise: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export default function EarningsPage() {
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [rev, pay] = await Promise.all([
        apiFetch<RevenueData>("/vendors/me/revenue"),
        // Payouts are recorded by staff after a transfer; a shop with none yet
        // is the normal case, not an error.
        apiFetch<{ payouts: Payout[] }>("/vendors/me/payouts").catch(() => ({ payouts: [] })),
      ]);
      setRevenue(rev);
      setPayouts(pay.payouts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your earnings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const gross = revenue?.totalRevenuePaise ?? 0;
  const paidOut = payouts
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.netPaise, 0);
  const commission = payouts.reduce((s, p) => s + p.commissionPaise, 0);
  // Anything earned that no settled payout has covered yet. Not a promise of a
  // date — payouts are drawn up by staff — but it is the number a shop owner
  // means when they ask what they're owed.
  const outstanding = Math.max(0, gross - commission - paidOut);

  const last30 = (revenue?.daily || []).slice(-30);
  const last30Total = last30.reduce((s, d) => s + d.revenuePaise, 0);
  const last30Orders = last30.reduce((s, d) => s + d.orders, 0);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <PageHeader
        title="Earnings"
        subtitle="What you've made, what's been paid out, and what's still owed."
        action={
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
          >
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[116px] rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={load} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile
              label="Gross earned"
              value={inrCompact(gross)}
              icon={LuIndianRupee}
              tint="sky"
              hint="from completed orders"
            />
            <StatTile
              label="Paid out"
              value={inrCompact(paidOut)}
              icon={LuWallet}
              tint="mint"
              hint={`${count(payouts.filter((p) => p.status === "PAID").length)} settled payouts`}
            />
            <StatTile
              label="Outstanding"
              value={inrCompact(outstanding)}
              icon={LuCoins}
              tint={outstanding > 0 ? "gold" : "gray"}
              hint="not yet settled"
            />
            <StatTile
              label="Last 30 days"
              value={inrCompact(last30Total)}
              icon={LuTrendingUp}
              tint="lavender"
              hint={`${count(last30Orders)} orders`}
            />
          </div>

          <Card>
            <CardHeader
              title="Daily earnings"
              subtitle="Last 30 days of completed orders."
            />
            {last30.length === 0 ? (
              <EmptyState
                icon={LuTrendingUp}
                title="Nothing earned yet"
                hint="Completed orders start showing up here as soon as you have some."
              />
            ) : (
              <Table head={["Date", "Orders", "Earned"]}>
                {[...last30].reverse().map((d) => (
                  <Tr key={d.date}>
                    <Td className="text-sm text-slate-700">{dateOnly(d.date)}</Td>
                    <Td className="tabular-nums text-sm text-slate-600">{d.orders}</Td>
                    <Td className="tabular-nums text-sm font-semibold text-slate-800">
                      {inr(d.revenuePaise)}
                    </Td>
                  </Tr>
                ))}
              </Table>
            )}
          </Card>

          {commission > 0 && (
            <Card>
              <div className="flex items-center gap-3 p-5">
                <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <LuUndo2 size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800">
                    {inr(commission)} platform commission
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Deducted across your payouts. Gross less commission is what reaches your bank.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
