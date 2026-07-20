"use client";

// Payouts.
//
// The platform does not move money. An operator makes the transfer from their
// bank and records it here, which is why marking one PAID demands a transaction
// reference — without it nothing can be reconciled against a statement.
//
// What a shop is owed is computed (earned less already paid), never stored, so
// it can't drift from the orders behind it.

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuWallet, LuClock, LuCircleCheck, LuScale, LuBanknote,
  LuFileChartColumn, LuTriangleAlert, LuRefreshCw, LuPlus,
} from "react-icons/lu";
import { apiFetch } from "@/lib/admin/api";
import { inr, count, dateOnly, dateTime } from "@/lib/console/format";
import { OpsTabs, useOpsTab, type OpsTab } from "@/components/admin/OpsTabs";
import { StatRow } from "@/components/admin/StatRow";
import {
  Card, Table, Td, Tr, StatusChip, Chip, Skeleton, ErrorState, EmptyState, PageHeader, StatTile,
} from "@/components/console/primitives";

interface Outstanding {
  vendorId: string;
  shopName: string;
  orders: number;
  earnedPaise: number;
  alreadyPaidPaise: number;
  pendingGrossPaise: number;
  commissionPaise: number;
  pendingNetPaise: number;
  bankVerified: boolean;
  hasBankAccount: boolean;
}

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
  vendor: { id: string; shopName: string } | null;
  accountMasked: string | null;
  accountHolder: string | null;
  bankVerified: boolean;
}

interface PayoutData {
  ratePercent: number;
  total: number;
  pending: number;
  processing: number;
  paid: number;
  failed: number;
  paidPaise: number;
  outstandingPaise: number;
  outstanding: Outstanding[];
  payouts: Payout[];
}

function PayoutsPageBody() {
  const tab = useOpsTab("pending");
  const [data, setData] = useState<PayoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [active, setActive] = useState<Payout | null>(null);
  const [reference, setReference] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<PayoutData>("/finance/payouts"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createPayout(vendorId: string) {
    setBusy(vendorId);
    try {
      await apiFetch("/finance/payouts", { method: "POST", body: { vendorId } });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not draw up that payout.");
    }
    setBusy(null);
  }

  async function markPaid() {
    if (!active) return;
    setBusy(active.id);
    try {
      await apiFetch(`/finance/payouts/${active.id}`, { method: "PATCH", body: { status: "PAID", reference } });
      setActive(null);
      setReference("");
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not update that payout.");
    }
    setBusy(null);
  }

  async function setStatus(id: string, status: string) {
    setBusy(id);
    try {
      await apiFetch(`/finance/payouts/${id}`, { method: "PATCH", body: { status } });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not update that payout.");
    }
    setBusy(null);
  }

  const rows = useMemo(() => {
    const all = data?.payouts || [];
    switch (tab) {
      case "processed": return all.filter((p) => p.status === "PAID");
      case "failed": return all.filter((p) => p.status === "FAILED");
      case "transfers": return all.filter((p) => p.reference);
      default: return all;
    }
  }, [data, tab]);

  const tabs: OpsTab[] = [
    { id: "pending", label: "Pending", icon: LuClock, count: data?.outstanding.filter((o) => o.pendingNetPaise > 0).length },
    { id: "processed", label: "Processed", icon: LuCircleCheck, count: data?.paid },
    { id: "settlements", label: "Settlements", icon: LuScale, count: data?.total },
    { id: "transfers", label: "Bank Transfers", icon: LuBanknote },
    { id: "reports", label: "Reports", icon: LuFileChartColumn },
    { id: "failed", label: "Failed", icon: LuTriangleAlert, count: data?.failed },
  ];

  return (
    <>
      <PageHeader
        title="Payouts"
        subtitle="What each shop is owed, and the transfers recorded against it."
        action={
          <button onClick={load} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer">
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      <StatRow loading={!data}>
        {data && (
          <>
            <StatTile label="Outstanding" value={inr(data.outstandingPaise)} icon={LuWallet} tint={data.outstandingPaise > 0 ? "gold" : "gray"} hint={`${count(data.outstanding.length)} shops`} />
            <StatTile label="Paid out" value={inr(data.paidPaise)} icon={LuCircleCheck} tint="mint" hint={`${count(data.paid)} payouts`} />
            <StatTile label="In progress" value={count(data.pending + data.processing)} icon={LuClock} tint="sky" hint="drawn up, not yet sent" />
            <StatTile label="Failed" value={count(data.failed)} icon={LuTriangleAlert} tint={data.failed > 0 ? "blush" : "gray"} hint="transfers that bounced" />
          </>
        )}
      </StatRow>

      <OpsTabs tabs={tabs} active={tab} basePath="/admin/finance/payouts" />

      {loading || !data ? (
        <Card><div className="p-5 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div></Card>
      ) : error ? (
        <Card><ErrorState message={error} onRetry={load} /></Card>
      ) : tab === "pending" ? (
        <Card>
          {data.outstanding.length === 0 ? (
            <EmptyState icon={LuWallet} title="Nothing outstanding" hint="Shops appear here once they have completed orders that haven't been paid out." />
          ) : (
            <>
              <Table head={["Shop", "Orders", "Earned", "Already paid", "Owed now", "Bank", "Action"]}>
                {data.outstanding.map((o) => (
                  <Tr key={o.vendorId}>
                    <Td>
                      <Link href={`/admin/management/vendors/${o.vendorId}`} className="font-semibold text-slate-700 hover:underline">{o.shopName}</Link>
                    </Td>
                    <Td className="tabular-nums text-slate-600">{count(o.orders)}</Td>
                    <Td className="tabular-nums text-slate-600">{inr(o.earnedPaise)}</Td>
                    <Td className="tabular-nums text-slate-400">{inr(o.alreadyPaidPaise)}</Td>
                    <Td className="tabular-nums font-bold text-slate-900">
                      {inr(o.pendingNetPaise)}
                      {o.commissionPaise > 0 && (
                        <span className="block text-[11px] font-normal text-slate-400">after {inr(o.commissionPaise)} commission</span>
                      )}
                    </Td>
                    <Td>
                      {!o.hasBankAccount ? (
                        <Chip label="No account" tint="blush" />
                      ) : o.bankVerified ? (
                        <Chip label="Verified" tint="mint" />
                      ) : (
                        <Chip label="Unverified" tint="gold" />
                      )}
                    </Td>
                    <Td>
                      <button
                        onClick={() => createPayout(o.vendorId)}
                        disabled={busy === o.vendorId || o.pendingNetPaise <= 0 || !o.bankVerified}
                        title={!o.bankVerified ? "The shop's bank account must be verified first" : undefined}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 border border-slate-200 hover:border-slate-400 rounded-lg px-2 py-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <LuPlus size={11} /> Draw up
                      </button>
                    </Td>
                  </Tr>
                ))}
              </Table>
              <p className="px-5 py-3 text-[11px] text-slate-400 border-t border-slate-100">
                Owed is everything a shop has earned on completed orders, less what has already been
                paid out. A payout can only be drawn up against a verified bank account.
              </p>
            </>
          )}
        </Card>
      ) : tab === "reports" ? (
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Payout summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Figure label="Total paid out" value={inr(data.paidPaise)} sub={`${count(data.paid)} completed payouts`} />
            <Figure label="Still owed" value={inr(data.outstandingPaise)} sub={`across ${count(data.outstanding.length)} shops`} />
            <Figure label="Awaiting transfer" value={count(data.pending + data.processing)} sub="drawn up, not sent" />
            <Figure label="Commission rate" value={`${data.ratePercent}%`} sub="deducted before payout" />
          </div>
          <p className="mt-5 text-xs text-slate-400 border-t border-slate-100 pt-4">
            There is no scheduled payout run or export file — payouts are drawn up and recorded by
            hand. A downloadable report would need an export job.
          </p>
        </Card>
      ) : (
        <Card>
          {rows.length === 0 ? (
            <EmptyState
              icon={LuWallet}
              title={tab === "failed" ? "No failed payouts" : tab === "transfers" ? "No transfers recorded" : "No payouts yet"}
              hint="Draw one up from the Pending tab."
            />
          ) : (
            <Table head={["Shop", "Period", "Orders", "Gross", "Commission", "Net", "Status", "Reference", "Action"]}>
              {rows.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    {p.vendor ? (
                      <Link href={`/admin/management/vendors/${p.vendor.id}`} className="font-semibold text-slate-700 hover:underline">{p.vendor.shopName}</Link>
                    ) : "—"}
                    {p.accountMasked && <p className="text-[11px] text-slate-400 font-mono">{p.accountMasked}</p>}
                  </Td>
                  <Td className="text-[11px] text-slate-500 whitespace-nowrap">
                    {dateOnly(p.periodStart)} → {dateOnly(p.periodEnd)}
                  </Td>
                  <Td className="tabular-nums text-slate-600">{count(p.orderCount)}</Td>
                  <Td className="tabular-nums text-slate-600">{inr(p.grossPaise)}</Td>
                  <Td className="tabular-nums text-slate-500">{inr(p.commissionPaise)}</Td>
                  <Td className="tabular-nums font-bold text-slate-900">{inr(p.netPaise)}</Td>
                  <Td>
                    <StatusChip status={p.status} />
                    {p.failureReason && <p className="text-[10px] text-rose-600 mt-1">{p.failureReason}</p>}
                  </Td>
                  <Td className="text-[11px] font-mono text-slate-500 truncate max-w-[130px]">
                    {p.reference || "—"}
                    {p.processedAt && <span className="block text-slate-400">{dateTime(p.processedAt)}</span>}
                  </Td>
                  <Td>
                    {p.status !== "PAID" && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => { setActive(p); setReference(p.reference || ""); }}
                          disabled={busy === p.id}
                          className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg px-2 py-1 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          Mark paid
                        </button>
                        <button
                          onClick={() => setStatus(p.id, "FAILED")}
                          disabled={busy === p.id}
                          className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg px-2 py-1 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          Failed
                        </button>
                      </div>
                    )}
                  </Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {/* Marking paid needs a reference — that's the only thing that ties this
          row to a real bank transaction. */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setActive(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-slate-900">Record the transfer</h2>
            <p className="text-sm text-slate-500 mt-1">
              {active.vendor?.shopName} · {inr(active.netPaise)} to {active.accountHolder || "their account"}
              {active.accountMasked ? ` (${active.accountMasked})` : ""}
            </p>

            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mt-5 mb-1.5">
              Transaction reference
            </label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="UTR / NEFT / UPI reference"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 transition-colors font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Required. Without it this payout can&apos;t be reconciled against a bank statement.
            </p>

            <div className="flex gap-2 mt-5">
              <button
                onClick={markPaid}
                disabled={busy === active.id || !reference.trim()}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:bg-slate-200 disabled:text-slate-400"
              >
                Mark paid
              </button>
              <button
                onClick={() => setActive(null)}
                className="border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Figure({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-xl font-black text-slate-900 mt-1 tabular-nums">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

export default function PayoutsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <PayoutsPageBody />
    </Suspense>
  );
}
