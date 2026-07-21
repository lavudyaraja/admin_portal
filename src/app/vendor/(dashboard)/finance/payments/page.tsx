"use client";

// Payments setup & settlements — how this shop actually gets paid.
//
// This is the page that replaces "withdraw". With Razorpay Route, a shop never
// withdraws anything: each card/UPI order is split at the moment it's paid, and
// the shop's share settles straight to its own bank account. Nothing is held by
// the platform to be pulled down later. So this page has two jobs — get the
// shop onboarded, then show what has settled — and no "withdraw" button, because
// there is nothing to withdraw.
import { useCallback, useEffect, useState } from "react";
import {
  LuBanknote, LuRefreshCw, LuShieldCheck, LuCircleAlert, LuArrowRight, LuPercent,
  LuIndianRupee, LuCircleCheck, LuClock, LuInfo,
} from "react-icons/lu";
import Link from "next/link";
import { apiFetch } from "@/lib/vendor/api";
import { inr, inrCompact, count, dateTime } from "@/lib/console/format";
import {
  Card, CardHeader, Table, Td, Tr, Skeleton, ErrorState, EmptyState, PageHeader,
  StatTile, Chip, cx,
} from "@/components/console/primitives";

interface RecentOrder {
  id: string;
  orderCode: string;
  costPaise: number;
  status: string;
  createdAt: string;
  paymentMethod: string | null;
}

interface RouteStatus {
  onboarded: boolean;
  active: boolean;
  statusNote: string | null;
  commissionPercent: number;
  bank: { accountHolder: string; last4: string; ifsc: string; bankName: string | null } | null;
  settlements: {
    routedOrders: number;
    grossPaise: number;
    commissionPaise: number;
    netPaise: number;
  };
  recent: RecentOrder[];
}

export default function PaymentsPage() {
  const [status, setStatus] = useState<RouteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [onboarding, setOnboarding] = useState(false);
  const [onboardError, setOnboardError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStatus(await apiFetch<RouteStatus>("/vendors/me/route/status"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your payment setup.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onboard() {
    setOnboarding(true);
    setOnboardError("");
    try {
      await apiFetch("/vendors/me/route/onboard", { method: "POST" });
      await load();
    } catch (err) {
      setOnboardError(err instanceof Error ? err.message : "Couldn't set up payments. Please try again.");
    }
    setOnboarding(false);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <PageHeader
        title="Payments"
        subtitle="How your share of every order reaches your bank."
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
          {!status.active ? (
            <Card>
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <span
                    className={cx(
                      "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0",
                      status.onboarded
                        ? "bg-amber-50 text-amber-600"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {status.onboarded ? <LuClock size={20} /> : <LuBanknote size={20} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-slate-900">
                      {status.onboarded
                        ? "Almost there — activation pending"
                        : "Set up direct payments"}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      {status.onboarded ? (
                        <>
                          Your details are with Razorpay and being verified. Until that clears, your
                          printers take Points payments only. {status.statusNote}
                        </>
                      ) : (
                        <>
                          Once set up, every card or UPI payment at your printers is split
                          automatically: your share lands straight in your bank account, and only the
                          platform commission is kept back. You never have to withdraw anything.
                        </>
                      )}
                    </p>

                    {!status.bank ? (
                      <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-start gap-2.5">
                        <LuCircleAlert size={16} className="text-slate-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-slate-600">
                          Add your bank account first — that&apos;s where your money goes.{" "}
                          <Link href="/vendor/bank-account" className="font-bold text-slate-800 hover:underline">
                            Add bank account
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          onClick={onboard}
                          disabled={onboarding}
                          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {status.onboarded ? (
                            <>
                              <LuRefreshCw size={14} /> {onboarding ? "Checking…" : "Check status"}
                            </>
                          ) : (
                            <>
                              {onboarding ? "Setting up…" : "Set up payments"} <LuArrowRight size={14} />
                            </>
                          )}
                        </button>
                        <span className="text-xs text-slate-400">
                          Money will go to {status.bank.bankName || "your bank"} ••{status.bank.last4}
                        </span>
                      </div>
                    )}

                    {onboardError && (
                      <p className="text-xs text-rose-600 font-semibold mt-3">{onboardError}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            // ── Active ──
            <Card>
              <div className="flex items-center gap-3 p-5">
                <span className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <LuShieldCheck size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900">Direct payments are live</h2>
                    <Chip label="Active" tint="mint" />
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Your share of every card/UPI order settles automatically to{" "}
                    {status.bank ? (
                      <span className="font-semibold text-slate-700">
                        {status.bank.bankName || "your bank"} ••{status.bank.last4}
                      </span>
                    ) : (
                      "your bank"
                    )}
                    .
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* ── Settlement figures ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile
              label="Settled to you"
              value={inrCompact(status.settlements.netPaise)}
              icon={LuIndianRupee}
              tint="mint"
              hint={`${count(status.settlements.routedOrders)} routed orders`}
            />
            <StatTile
              label="Gross routed"
              value={inrCompact(status.settlements.grossPaise)}
              icon={LuCircleCheck}
              tint="sky"
              hint="before commission"
            />
            <StatTile
              label="Commission"
              value={inrCompact(status.settlements.commissionPaise)}
              icon={LuPercent}
              tint="lavender"
              hint={`${status.commissionPercent}% platform fee`}
            />
            <StatTile
              label="Your rate"
              value={`${100 - status.commissionPercent}%`}
              icon={LuBanknote}
              tint="gold"
              hint="of every order"
            />
          </div>

          {/* ── How it works ── */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-start gap-2.5">
            <LuInfo size={15} className="text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              There&apos;s no withdraw button because there&apos;s nothing to withdraw — the money is
              never held by the platform. Razorpay splits each payment the instant it&apos;s made and
              sends your share to your bank, usually within two working days. Orders paid with Points
              settle separately and don&apos;t appear here.
            </p>
          </div>

          {/* ── Recent routed orders ── */}
          <Card>
            <CardHeader
              title="Recent settlements"
              subtitle="Card/UPI orders that were split to your account."
            />
            {status.recent.length === 0 ? (
              <EmptyState
                icon={LuBanknote}
                title={status.active ? "No routed orders yet" : "Nothing settled yet"}
                hint={
                  status.active
                    ? "Card and UPI orders will show here as customers pay."
                    : "Finish setting up payments to start receiving your share directly."
                }
              />
            ) : (
              <Table head={["Order", "Amount", "Method", "Status", "When"]}>
                {status.recent.map((o) => (
                  <Tr key={o.id}>
                    <Td className="font-mono text-xs font-semibold text-slate-700">{o.orderCode}</Td>
                    <Td className="tabular-nums font-semibold text-slate-800">{inr(o.costPaise)}</Td>
                    <Td className="text-xs text-slate-500">
                      {o.paymentMethod?.replace(/_/g, " ").toLowerCase() || "—"}
                    </Td>
                    <Td>
                      <Chip
                        label={o.status.replace(/_/g, " ").toLowerCase()}
                        tint={o.status === "COMPLETED" ? "mint" : "gray"}
                      />
                    </Td>
                    <Td className="text-slate-400 text-xs whitespace-nowrap">
                      {dateTime(o.createdAt)}
                    </Td>
                  </Tr>
                ))}
              </Table>
            )}
          </Card>

          <p className="text-[11px] text-slate-400 px-1">
            Looking for the older manual payout records?{" "}
            <Link href="/vendor/finance/payouts" className="font-semibold hover:underline">
              Payouts
            </Link>{" "}
            still lists any transfers made before direct payments were set up.
          </p>
        </>
      )}
    </div>
  );
}
