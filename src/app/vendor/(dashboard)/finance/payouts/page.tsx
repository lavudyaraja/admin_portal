"use client";

// Payouts to this shop.
//
// Read-only by design. A payout is the *record* of a transfer the platform has
// already made — nothing on this page moves money, and a shop cannot create or
// alter one. That is also why a payout can be FAILED: this table describes what
// happened at the bank, it does not drive it.
import { useCallback, useEffect, useState } from "react";
import { LuWallet, LuRefreshCw, LuBanknote, LuPercent, LuClock } from "react-icons/lu";
import Link from "next/link";
import { apiFetch } from "@/lib/vendor/api";
import { inr, inrCompact, count, dateOnly } from "@/lib/console/format";
import {
  Card, Table, Td, Tr, Skeleton, ErrorState, EmptyState, PageHeader, StatTile, Chip,
} from "@/components/console/primitives";

interface Payout {
  id: string;
  grossPaise: number;
  commissionPaise: number;
  netPaise: number;
  periodStart: string;
  periodEnd: string;
  orderCount: number;
  status: string;
  reference: string | null;
  failureReason: string | null;
  note: string | null;
  processedAt: string | null;
  createdAt: string;
}

interface Totals {
  paidCount: number;
  paidNetPaise: number;
  paidGrossPaise: number;
  commissionPaise: number;
}

const STATUS_TINT: Record<string, "mint" | "gold" | "sky" | "blush" | "gray"> = {
  PAID: "mint",
  PENDING: "gold",
  PROCESSING: "sky",
  FAILED: "blush",
};

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ payouts: Payout[]; totals: Totals }>("/vendors/me/payouts");
      setPayouts(res.payouts || []);
      setTotals(res.totals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your payouts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = payouts.filter((p) => p.status === "PENDING" || p.status === "PROCESSING");
  const pendingValue = pending.reduce((s, p) => s + p.netPaise, 0);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <PageHeader
        title="Payouts"
        subtitle="Transfers the platform has made to your bank account."
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
              label="Received"
              value={inrCompact(totals?.paidNetPaise || 0)}
              icon={LuBanknote}
              tint="mint"
              hint={`${count(totals?.paidCount || 0)} settled payouts`}
            />
            <StatTile
              label="In flight"
              value={inrCompact(pendingValue)}
              icon={LuClock}
              tint={pending.length > 0 ? "gold" : "gray"}
              hint={`${count(pending.length)} pending or processing`}
            />
            <StatTile
              label="Commission"
              value={inrCompact(totals?.commissionPaise || 0)}
              icon={LuPercent}
              tint="lavender"
              hint="platform cut, all time"
            />
            <StatTile
              label="Gross settled"
              value={inrCompact(totals?.paidGrossPaise || 0)}
              icon={LuWallet}
              tint="sky"
              hint="before commission"
            />
          </div>

          <Card>
            {payouts.length === 0 ? (
              <EmptyState
                icon={LuWallet}
                title="No payouts yet"
                hint="Payouts appear once the platform settles a period of your earnings."
              />
            ) : (
              <>
                <Table head={["Period", "Orders", "Gross", "Commission", "Net", "Status", "Reference"]}>
                  {payouts.map((p) => (
                    <Tr key={p.id}>
                      <Td className="text-xs text-slate-700 whitespace-nowrap">
                        {dateOnly(p.periodStart)} – {dateOnly(p.periodEnd)}
                        {p.processedAt && (
                          <span className="block text-[10px] text-slate-400">
                            paid {dateOnly(p.processedAt)}
                          </span>
                        )}
                      </Td>
                      <Td className="tabular-nums text-sm text-slate-600">{p.orderCount}</Td>
                      <Td className="tabular-nums text-sm text-slate-600">{inr(p.grossPaise)}</Td>
                      <Td className="tabular-nums text-sm text-slate-500">
                        −{inr(p.commissionPaise)}
                      </Td>
                      <Td className="tabular-nums text-sm font-bold text-slate-900">
                        {inr(p.netPaise)}
                      </Td>
                      <Td>
                        <Chip label={p.status} tint={STATUS_TINT[p.status] || "gray"} />
                        {p.status === "FAILED" && p.failureReason && (
                          <span className="block text-[10px] text-rose-600 mt-1 max-w-[140px]">
                            {p.failureReason}
                          </span>
                        )}
                      </Td>
                      <Td className="font-mono text-[11px] text-slate-500 truncate max-w-[120px]">
                        {p.reference || "—"}
                      </Td>
                    </Tr>
                  ))}
                </Table>
                <p className="px-5 py-3 border-t border-slate-100 text-[11px] text-slate-400">
                  Payouts go to the account on your{" "}
                  <Link href="/vendor/bank-account" className="font-semibold hover:underline">
                    Bank Accounts
                  </Link>{" "}
                  page. Keep it up to date — a failed transfer usually means stale details.
                </p>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
