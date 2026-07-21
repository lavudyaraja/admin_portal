"use client";

// Payments & settlements — how this shop actually gets paid.
//
// Payments are collected in full into the platform account, and the shop's share
// (its earnings, less the platform commission) is settled to it afterwards by
// payout. So this page has two jobs: make sure a bank account is on file so the
// platform can pay the shop, and show what the shop has earned, been paid, and
// is still owed. A partial print settles only the pages that actually came out —
// the rest was refunded to the customer — so earnings are already net of that.
import { useCallback, useEffect, useState } from "react";
import {
  LuBanknote, LuRefreshCw, LuShieldCheck, LuCircleAlert, LuPercent,
  LuIndianRupee, LuCircleCheck, LuInfo, LuClock, LuArrowRight,
} from "react-icons/lu";
import Link from "next/link";
import { apiFetch } from "@/lib/vendor/api";
import { inr, inrCompact, count, dateTime } from "@/lib/console/format";
import {
  Card, CardHeader, Table, Td, Tr, Skeleton, ErrorState, EmptyState, PageHeader,
  StatTile, Chip,
} from "@/components/console/primitives";

interface RecentOrder {
  id: string;
  orderCode: string;
  costPaise: number;
  settlementPaise: number | null;
  printedPages: number | null;
  pagesToPrint: number;
  status: string;
  createdAt: string;
  paymentMethod: string | null;
}

interface SettlementStatus {
  onboarded: boolean;
  active: boolean;
  statusNote: string | null;
  commissionPercent: number;
  bank: { accountHolder: string; last4: string; ifsc: string; bankName: string | null } | null;
  settlements: {
    completedOrders: number;
    grossPaise: number;
    commissionPaise: number;
    netPaise: number;
    paidOutPaise: number;
    pendingPaise: number;
    payoutCount: number;
  };
  recent: RecentOrder[];
}

export default function PaymentsPage() {
  const [status, setStatus] = useState<SettlementStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStatus(await apiFetch<SettlementStatus>("/vendors/me/route/status"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your payment setup.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <PageHeader
        title="Payments"
        subtitle="What you've earned, and how it reaches your bank."
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
        <>
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </>
      ) : error || !status ? (
        <Card>
          <ErrorState message={error || "Could not load."} onRetry={load} />
        </Card>
      ) : (
        <>
          {/* ── Setup state ── */}
          {status.active ? (
            <Card>
              <div className="flex items-center gap-3 p-5">
                <span className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <LuShieldCheck size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900">You&apos;re set to be paid</h2>
                    <Chip label="Active" tint="mint" />
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    The platform settles your earnings to{" "}
                    {status.bank ? (
                      <span className="font-semibold text-slate-700">
                        {status.bank.bankName || "your bank"} ••{status.bank.last4}
                      </span>
                    ) : (
                      "your bank"
                    )}
                    . Each order is collected by the platform and your share is paid out to you.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <span className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <LuBanknote size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-slate-900">Add a bank account to get paid</h2>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      {status.statusNote ||
                        "The platform collects every order and settles your share to you. Add your bank account so we know where to send it."}
                    </p>
                    <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-start gap-2.5">
                      <LuCircleAlert size={16} className="text-slate-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-600">
                        Your earnings are being tracked and will be paid once a bank account is on file.{" "}
                        <Link href="/vendor/bank-account" className="font-bold text-slate-800 hover:underline inline-flex items-center gap-1">
                          Add bank account <LuArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* ── Settlement figures ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile
              label="Pending payout"
              value={inrCompact(status.settlements.pendingPaise)}
              icon={LuClock}
              tint={status.settlements.pendingPaise > 0 ? "gold" : "gray"}
              hint="owed to you now"
            />
            <StatTile
              label="Net earned"
              value={inrCompact(status.settlements.netPaise)}
              icon={LuIndianRupee}
              tint="mint"
              hint={`${count(status.settlements.completedOrders)} completed orders`}
            />
            <StatTile
              label="Paid out"
              value={inrCompact(status.settlements.paidOutPaise)}
              icon={LuCircleCheck}
              tint="sky"
              hint={`${count(status.settlements.payoutCount)} payouts`}
            />
            <StatTile
              label="Commission"
              value={inrCompact(status.settlements.commissionPaise)}
              icon={LuPercent}
              tint="lavender"
              hint={`${status.commissionPercent}% platform fee`}
            />
          </div>

          {/* ── How it works ── */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-start gap-2.5">
            <LuInfo size={15} className="text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Every order is collected into the platform account. Your share — the order value less the{" "}
              {status.commissionPercent}% commission — builds up here and is settled to your bank by payout.
              If a print is interrupted, you earn only for the pages that actually came out; the rest is
              refunded to the customer, so the figures above are already net of any partial refunds.
            </p>
          </div>

          {/* ── Recent completed orders ── */}
          <Card>
            <CardHeader
              title="Recent earnings"
              subtitle="Completed orders that count toward your settlement."
            />
            {status.recent.length === 0 ? (
              <EmptyState
                icon={LuBanknote}
                title="Nothing earned yet"
                hint="Completed orders at your printers will show here."
              />
            ) : (
              <Table head={["Order", "Charged", "You earn", "Method", "When"]}>
                {status.recent.map((o) => {
                  const earned = o.settlementPaise ?? o.costPaise;
                  const partial = o.settlementPaise != null && o.settlementPaise < o.costPaise;
                  return (
                    <Tr key={o.id}>
                      <Td className="font-mono text-xs font-semibold text-slate-700">{o.orderCode}</Td>
                      <Td className="tabular-nums text-slate-500">{inr(o.costPaise)}</Td>
                      <Td className="tabular-nums font-semibold text-slate-800">
                        {inr(earned)}
                        {partial && (
                          <span className="ml-1.5 inline-block align-middle">
                            <Chip
                              label={`${o.printedPages ?? 0}/${o.pagesToPrint} pages`}
                              tint="peach"
                            />
                          </span>
                        )}
                      </Td>
                      <Td className="text-xs text-slate-500">
                        {o.paymentMethod?.replace(/_/g, " ").toLowerCase() || "—"}
                      </Td>
                      <Td className="text-slate-400 text-xs whitespace-nowrap">
                        {dateTime(o.createdAt)}
                      </Td>
                    </Tr>
                  );
                })}
              </Table>
            )}
          </Card>

          <p className="text-[11px] text-slate-400 px-1">
            See every settlement transfer under{" "}
            <Link href="/vendor/finance/payouts" className="font-semibold hover:underline">
              Payouts
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}
