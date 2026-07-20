"use client";

// Logs.
//
// Worth being blunt at the top: the platform has no audit trail. Nothing writes
// a record of who did what. What follows is reconstructed from rows that happen
// to carry a timestamp — orders, points movements, print jobs — so it shows what
// *users* did and never what staff did.
//
// Admin Activity, API and Audit are therefore not "empty", they're impossible,
// and each says so.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuScrollText, LuUser, LuStore, LuShieldCheck, LuBanknote,
  LuPrinter, LuCode, LuTriangleAlert, LuFileCheck, LuRefreshCw,
} from "react-icons/lu";
import { apiFetch } from "@/lib/admin/api";
import { inr, points, count, ledgerPoints, dateTime } from "@/lib/console/format";
import { OpsTabs, useOpsTab, NoRecord, type OpsTab } from "@/components/admin/OpsTabs";
import {
  Card, Table, Td, Tr, StatusChip, Chip, Skeleton, ErrorState, EmptyState, PageHeader,
} from "@/components/console/primitives";

interface LedgerRow {
  id: string; type: "CREDIT" | "DEBIT"; amountPoints: number; amountPaise: number;
  balancePoints: number; balancePaise: number; description: string;
  razorpayId: string | null; orderId: string | null; createdAt: string;
  user: { id: string; name: string } | null;
}
interface GatewayRow {
  id: string; orderCode: string; status: string; costPaise: number; paymentMethod: string | null;
  razorpayOrderId: string | null; razorpayPaymentId: string | null; createdAt: string;
  user: { id: string; name: string } | null;
}
interface JobRow {
  id: string; status: string; attempts: number; error: string | null;
  startedAt: string | null; finishedAt: string | null; createdAt: string; updatedAt: string;
  printer: { id: string; name: string; uniquePrinterId: string } | null;
  order: { orderCode: string } | null;
}
interface OrderRow {
  id: string; orderCode: string; status: string; costPaise: number; createdAt: string;
  user: { id: string; name: string; role: string } | null;
  vendor: { id: string; shopName: string } | null;
  printer: { name: string; uniquePrinterId: string } | null;
}

/** Which server-side log kind each tab needs. Null = nothing to fetch. */
const KIND: Record<string, string | null> = {
  user: "user", vendor: "vendor", payment: "payment", printer: "printer",
  admin: null, api: null, errors: "printer", audit: null,
};

function LogsPageBody() {
  const tab = useOpsTab("payment");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const kind = KIND[tab];

  const load = useCallback(async () => {
    if (!kind) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch(`/system/logs?kind=${kind}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    load();
  }, [load]);

  const tabs: OpsTab[] = [
    { id: "user", label: "User Activity", icon: LuUser },
    { id: "vendor", label: "Vendor Activity", icon: LuStore },
    { id: "admin", label: "Admin Activity", icon: LuShieldCheck },
    { id: "payment", label: "Payment", icon: LuBanknote },
    { id: "printer", label: "Printer", icon: LuPrinter },
    { id: "api", label: "API", icon: LuCode },
    { id: "errors", label: "Errors", icon: LuTriangleAlert },
    { id: "audit", label: "Audit", icon: LuFileCheck },
  ];

  const ledger = (data?.ledger as LedgerRow[]) || [];
  const gateway = (data?.gateway as GatewayRow[]) || [];
  const jobs = (data?.jobs as JobRow[]) || [];
  const errors = (data?.errors as JobRow[]) || [];
  const orders = (data?.orders as OrderRow[]) || [];

  return (
    <>
      <PageHeader
        title="Logs"
        subtitle="Reconstructed from timestamped records — this is not an audit trail."
        action={
          kind ? (
            <button onClick={load} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer">
              <LuRefreshCw size={13} /> Refresh
            </button>
          ) : undefined
        }
      />

      <OpsTabs tabs={tabs} active={tab} basePath="/admin/system/logs" />

      {tab === "admin" ? (
        <NoRecord
          icon={LuShieldCheck}
          title="Staff actions aren't recorded"
          needs="Nothing logs what an operator does. Approving a shop, banning a user, replying to a ticket, marking a payout paid — none of it leaves a trace beyond the field it changed. This is the gap that matters most on this page, and it needs an audit table written to on every privileged action."
        />
      ) : tab === "api" ? (
        <NoRecord
          icon={LuCode}
          title="Requests aren't logged"
          needs="The server writes nothing per request — no method, path, status, latency or caller. Errors go to the process console and are lost on restart. This needs request logging with somewhere durable to put it."
        />
      ) : tab === "audit" ? (
        <NoRecord
          icon={LuFileCheck}
          title="There is no audit log"
          needs="An audit log records who changed what, from what to what, and when — nothing in the platform does that. The other tabs here reconstruct user behaviour from business records, which is a different thing and can't be used for accountability."
        />
      ) : loading ? (
        <Card><div className="p-5 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div></Card>
      ) : error ? (
        <Card><ErrorState message={error} onRetry={load} /></Card>
      ) : tab === "payment" ? (
        <div className="space-y-4">
          <Card>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Points ledger</h3>
            </div>
            {ledger.length === 0 ? (
              <EmptyState icon={LuBanknote} title="No ledger entries" hint="Points movements appear here." />
            ) : (
              <Table head={["User", "Type", "Description", "Amount", "Gateway ref", "When"]}>
                {ledger.map((l) => (
                  <Tr key={l.id}>
                    <Td>{l.user ? <Link href={`/admin/management/users/${l.user.id}`} className="text-slate-700 hover:underline text-sm">{l.user.name}</Link> : "—"}</Td>
                    <Td><Chip label={l.type} tint={l.type === "CREDIT" ? "mint" : "blush"} /></Td>
                    <Td className="text-slate-600 truncate max-w-[200px]">{l.description}</Td>
                    <Td className={`tabular-nums font-bold ${l.type === "CREDIT" ? "text-emerald-600" : "text-rose-600"}`}>
                      {l.type === "CREDIT" ? "+" : "−"}{points(ledgerPoints(l))}
                    </Td>
                    <Td className="text-[11px] font-mono text-slate-400 truncate max-w-[130px]">{l.razorpayId || "—"}</Td>
                    <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(l.createdAt)}</Td>
                  </Tr>
                ))}
              </Table>
            )}
          </Card>

          <Card>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Gateway orders</h3>
            </div>
            {gateway.length === 0 ? (
              <EmptyState icon={LuBanknote} title="No gateway records" hint="Orders that went through Razorpay appear here." />
            ) : (
              <Table head={["Order", "User", "Amount", "Status", "Razorpay order", "Payment id", "When"]}>
                {gateway.map((g) => (
                  <Tr key={g.id}>
                    <Td className="font-mono text-xs text-slate-700">{g.orderCode}</Td>
                    <Td>{g.user ? <Link href={`/admin/management/users/${g.user.id}`} className="text-slate-700 hover:underline text-sm">{g.user.name}</Link> : "—"}</Td>
                    <Td className="tabular-nums font-semibold text-slate-700">{inr(g.costPaise)}</Td>
                    <Td><StatusChip status={g.status} /></Td>
                    <Td className="text-[11px] font-mono text-slate-400 truncate max-w-[130px]">{g.razorpayOrderId || "—"}</Td>
                    <Td className="text-[11px] font-mono text-slate-400 truncate max-w-[130px]">{g.razorpayPaymentId || "—"}</Td>
                    <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(g.createdAt)}</Td>
                  </Tr>
                ))}
              </Table>
            )}
          </Card>
        </div>
      ) : tab === "errors" ? (
        <>
          <Card>
            {errors.length === 0 ? (
              <EmptyState icon={LuTriangleAlert} title="No jobs in an error state" hint="Failed print jobs appear here with the printer's own message." />
            ) : (
              <Table head={["Printer", "Order", "Error", "Attempts", "When"]}>
                {errors.map((j) => (
                  <Tr key={j.id}>
                    <Td>
                      <p className="font-semibold text-slate-700">{j.printer?.name || "—"}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{j.printer?.uniquePrinterId}</p>
                    </Td>
                    <Td className="font-mono text-xs text-slate-600">{j.order?.orderCode || "—"}</Td>
                    <Td className="text-xs text-rose-600 truncate max-w-[260px]">{j.error || "No error text"}</Td>
                    <Td className="tabular-nums text-slate-600">{j.attempts}</Td>
                    <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(j.updatedAt)}</Td>
                  </Tr>
                ))}
              </Table>
            )}
          </Card>
          <p className="mt-3 text-xs text-slate-400">
            Current failures only. A job that failed and was retried successfully leaves nothing
            behind — the error field is overwritten, not appended to.
          </p>
        </>
      ) : tab === "printer" ? (
        <Card>
          {jobs.length === 0 ? (
            <EmptyState icon={LuPrinter} title="No print jobs" hint="Jobs handed to printers appear here." />
          ) : (
            <Table head={["Printer", "Order", "Status", "Attempts", "Started", "Finished", "Updated"]}>
              {jobs.map((j) => (
                <Tr key={j.id}>
                  <Td>
                    <p className="font-semibold text-slate-700">{j.printer?.name || "—"}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{j.printer?.uniquePrinterId}</p>
                  </Td>
                  <Td className="font-mono text-xs text-slate-600">{j.order?.orderCode || "—"}</Td>
                  <Td><StatusChip status={j.status} /></Td>
                  <Td className="tabular-nums text-slate-600">{j.attempts}</Td>
                  <Td className="text-[11px] text-slate-400 whitespace-nowrap">{j.startedAt ? dateTime(j.startedAt) : "—"}</Td>
                  <Td className="text-[11px] text-slate-400 whitespace-nowrap">{j.finishedAt ? dateTime(j.finishedAt) : "—"}</Td>
                  <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(j.updatedAt)}</Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>
      ) : (
        <>
          <Card>
            {orders.length === 0 ? (
              <EmptyState icon={LuUser} title="No activity" hint="Orders are the only per-actor record with a timestamp." />
            ) : (
              <Table head={["Who", "Action", "Shop", "Printer", "Amount", "Status", "When"]}>
                {orders.map((o) => (
                  <Tr key={o.id}>
                    <Td>
                      {o.user ? <Link href={`/admin/management/users/${o.user.id}`} className="text-slate-700 hover:underline text-sm">{o.user.name}</Link> : "—"}
                      <p className="text-[11px] text-slate-400">{o.user?.role.toLowerCase()}</p>
                    </Td>
                    <Td className="text-xs text-slate-600">Placed order <span className="font-mono">{o.orderCode}</span></Td>
                    <Td className="text-xs text-slate-600">{o.vendor?.shopName || "—"}</Td>
                    <Td className="text-[11px] text-slate-500 font-mono">{o.printer?.uniquePrinterId || "—"}</Td>
                    <Td className="tabular-nums text-slate-600">{inr(o.costPaise)}</Td>
                    <Td><StatusChip status={o.status} /></Td>
                    <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(o.createdAt)}</Td>
                  </Tr>
                ))}
              </Table>
            )}
          </Card>
          <p className="mt-3 text-xs text-slate-400">
            Reconstructed from orders — the only record that ties an actor to a timestamp. Sign-ins,
            profile edits, uploads and browsing are not recorded anywhere.
          </p>
        </>
      )}
    </>
  );
}

export default function LogsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <LogsPageBody />
    </Suspense>
  );
}
