"use client";

// Commissions.
//
// The rate is a single platform setting (Settings → Pricing → commissionPercent)
// and it defaults to 0. At 0% every figure here is genuinely zero, and the page
// says so plainly instead of presenting ₹0 as an earnings report.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuPercent, LuStore, LuIndianRupee, LuHistory, LuChartPie,
  LuRefreshCw, LuTriangleAlert,
} from "react-icons/lu";
import { apiFetch } from "@/lib/admin/api";
import { inr, count } from "@/lib/console/format";
import { OpsTabs, useOpsTab, NoRecord, type OpsTab } from "@/components/admin/OpsTabs";
import { StatRow } from "@/components/admin/StatRow";
import {
  Card, Table, Td, Tr, Skeleton, ErrorState, EmptyState, PageHeader, StatTile,
} from "@/components/console/primitives";

interface VendorCommission {
  vendorId: string | null;
  name: string;
  orders: number;
  grossPaise: number;
  commissionPaise: number;
  vendorNetPaise: number;
}

interface CommissionData {
  ratePercent: number;
  rateUnset: boolean;
  grossPaise: number;
  platformEarningsPaise: number;
  vendorNetPaise: number;
  orders: number;
  byVendor: VendorCommission[];
}

/** Shown wherever a figure would otherwise be a meaningless zero. */
function RateNotSet() {
  return (
    <Card className="p-6 mb-4 border-amber-200 bg-amber-50/60">
      <div className="flex gap-3">
        <LuTriangleAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-900 text-sm">No commission rate is set</p>
          <p className="text-sm text-amber-800/80 mt-1">
            The platform&apos;s cut is <strong>0%</strong>, so every commission figure below is zero —
            that is the real answer, not a loading state. Set a rate in Settings → Pricing and these
            numbers will compute from completed orders.
          </p>
        </div>
      </div>
    </Card>
  );
}

function CommissionsPageBody() {
  const tab = useOpsTab("rules");
  const [data, setData] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<CommissionData>("/finance/commissions"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tabs: OpsTab[] = [
    { id: "rules", label: "Rules", icon: LuPercent },
    { id: "vendors", label: "By Vendor", icon: LuStore, count: data?.byVendor.length },
    { id: "earnings", label: "Platform Earnings", icon: LuIndianRupee },
    { id: "history", label: "History", icon: LuHistory },
    { id: "analytics", label: "Analytics", icon: LuChartPie },
  ];

  const maxGross = Math.max(1, ...(data?.byVendor || []).map((v) => v.grossPaise));

  return (
    <>
      <PageHeader
        title="Commissions"
        subtitle="The platform's share of what shops earn."
        action={
          <button onClick={load} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer">
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      <StatRow loading={!data}>
        {data && (
          <>
            <StatTile label="Commission rate" value={`${data.ratePercent}%`} icon={LuPercent} tint={data.rateUnset ? "gray" : "lavender"} hint={data.rateUnset ? "not set" : "of each completed order"} />
            <StatTile label="Gross takings" value={inr(data.grossPaise)} icon={LuIndianRupee} tint="sky" hint={`${count(data.orders)} completed orders`} />
            <StatTile label="Platform earnings" value={inr(data.platformEarningsPaise)} icon={LuIndianRupee} tint={data.rateUnset ? "gray" : "mint"} hint={data.rateUnset ? "0% rate" : "at the current rate"} />
            <StatTile label="Vendors keep" value={inr(data.vendorNetPaise)} icon={LuStore} tint="gold" hint="after commission" />
          </>
        )}
      </StatRow>

      <OpsTabs tabs={tabs} active={tab} basePath="/admin/finance/commissions" />

      {data?.rateUnset && tab !== "history" && <RateNotSet />}

      {tab === "history" ? (
        <NoRecord
          icon={LuHistory}
          title="Commission isn't charged as a transaction"
          needs="Commission is computed from the current rate whenever you ask, not deducted and recorded at the time of each order. So there is no history to show, and changing the rate changes every past figure. Making this real needs the commission written onto the order when it completes."
        />
      ) : loading || !data ? (
        <Card><div className="p-5 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div></Card>
      ) : error ? (
        <Card><ErrorState message={error} onRetry={load} /></Card>
      ) : tab === "rules" ? (
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4">How commission is applied</h3>
          <div className="space-y-3 text-sm text-slate-600">
            <Rule n={1} text={`A flat ${data.ratePercent}% is taken from every completed order, platform-wide.`} />
            <Rule n={2} text="Only completed orders count. Pending, failed and cancelled orders are never charged." />
            <Rule n={3} text="Refunds are not netted off — a refunded order still shows in gross takings." />
            <Rule n={4} text="There is one rate for everyone. Per-vendor and per-printer rates don't exist." />
          </div>
          <p className="mt-5 text-xs text-slate-400 border-t border-slate-100 pt-4">
            Change the rate in Settings → Pricing. Because commission is computed rather than
            recorded, a change applies retroactively to every figure on this page.
          </p>
        </Card>
      ) : tab === "earnings" ? (
        <Card className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross takings</p>
              <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{inr(data.grossPaise)}</p>
              <p className="text-xs text-slate-400 mt-0.5">{count(data.orders)} completed orders</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Platform keeps</p>
              <p className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">{inr(data.platformEarningsPaise)}</p>
              <p className="text-xs text-slate-400 mt-0.5">at {data.ratePercent}%</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vendors keep</p>
              <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{inr(data.vendorNetPaise)}</p>
              <p className="text-xs text-slate-400 mt-0.5">before payout</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          {data.byVendor.length === 0 ? (
            <EmptyState icon={LuStore} title="No completed orders" hint="Commission appears once shops start fulfilling orders." />
          ) : (
            <Table head={["Shop", "Orders", "Gross", "", `Commission (${data.ratePercent}%)`, "Shop keeps"]}>
              {data.byVendor.map((v) => (
                <Tr key={v.vendorId || "unassigned"}>
                  <Td className={`font-semibold ${v.vendorId ? "text-slate-700" : "text-amber-700"}`}>
                    {v.vendorId ? (
                      <Link href={`/admin/management/vendors/${v.vendorId}`} className="hover:underline">{v.name}</Link>
                    ) : v.name}
                  </Td>
                  <Td className="tabular-nums text-slate-600">{count(v.orders)}</Td>
                  <Td className="tabular-nums font-semibold text-slate-700">{inr(v.grossPaise)}</Td>
                  <Td className="w-40">
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.round((v.grossPaise / maxGross) * 100)}%` }} />
                    </div>
                  </Td>
                  <Td className={`tabular-nums font-bold ${data.rateUnset ? "text-slate-400" : "text-emerald-600"}`}>{inr(v.commissionPaise)}</Td>
                  <Td className="tabular-nums text-slate-600">{inr(v.vendorNetPaise)}</Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>
      )}
    </>
  );
}

function Rule({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
      <p>{text}</p>
    </div>
  );
}

export default function CommissionsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <CommissionsPageBody />
    </Suspense>
  );
}
