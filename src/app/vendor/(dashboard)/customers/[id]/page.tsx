"use client";

// One customer's full record at this shop.
//
// Everything comes from a single GET /vendors/me/customers/:id, so switching
// tabs never re-hits the network. The endpoint is scoped twice — orders are
// filtered to this shop, and a customer who has never ordered here 404s rather
// than returning an empty profile, so a vendor can't look up an arbitrary user
// and learn their name and number.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  LuArrowLeft, LuFileText, LuCoins, LuCalendarCheck, LuPrinter, LuStar,
  LuUndo2, LuPhone, LuMail, LuRefreshCw, LuTriangleAlert, LuArrowDownLeft, LuArrowUpRight,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import { apiFetch } from "@/lib/vendor/api";
import { inr, count, dateOnly, dateTime } from "@/lib/console/format";
import { ConsoleTabs, useTab, type ConsoleTab } from "@/components/console/Tabs";
import {
  Card, CardHeader, Table, Td, Tr, Skeleton, ErrorState, EmptyState, PageHeader,
  StatTile, StatusChip, Chip, cx,
} from "@/components/console/primitives";
import { RatingCard, Stars, type RatingRow } from "@/components/console/ratings";

interface CustomerOrder {
  id: string;
  orderCode: string;
  status: string;
  colorMode: string;
  sideMode: string;
  copies: number;
  pagesToPrint: number;
  paperSize: string;
  costPaise: number;
  paymentMethod: string | null;
  createdAt: string;
  document: { fileName: string; fileType: string; pageCount: number } | null;
  printer: { id: string; name: string; uniquePrinterId: string; locationName: string } | null;
  refund: { id: string; pointsCredited: number; reason: string; createdAt: string } | null;
}

interface Visit {
  date: string;
  orders: number;
  pages: number;
  spentPaise: number;
}

interface Txn {
  id: string;
  type: "CREDIT" | "DEBIT";
  amountPoints: number;
  description: string;
  orderId: string | null;
  createdAt: string;
}

interface RefundReq {
  id: string;
  code: string;
  reason: string;
  status: string;
  description: string;
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  order: { id: string; orderCode: string; costPaise: number } | null;
}

interface CustomerDetail {
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    rollNumber: string | null;
    ratingAvg: number;
    ratingCount: number;
    createdAt: string;
    bannedAt: string | null;
  };
  summary: {
    totalOrders: number;
    completedOrders: number;
    failedOrders: number;
    pagesPrinted: number;
    spentPaise: number;
    refundedPaise: number;
    avgOrderPaise: number;
    visits: number;
    firstOrderAt: string | null;
    lastOrderAt: string | null;
    printersUsed: number;
    refundRequests: number;
  };
  orders: CustomerOrder[];
  visits: Visit[];
  printersUsed: { printer: CustomerOrder["printer"]; orders: number }[];
  transactions: Txn[];
  ratings: { fromShop: RatingRow[]; fromCustomer: RatingRow[] };
  refundRequests: RefundReq[];
}

const TABS: ConsoleTab[] = [
  { id: "orders", label: "Orders", icon: LuFileText },
  { id: "payments", label: "Payments", icon: LuCoins },
  { id: "visits", label: "Visits", icon: LuCalendarCheck },
  { id: "ratings", label: "Ratings", icon: LuStar },
  { id: "refunds", label: "Refunds", icon: LuUndo2 },
];

const REFUND_STATUS_TINT: Record<string, "gold" | "mint" | "blush" | "peach" | "gray"> = {
  PENDING: "gold",
  APPROVED: "mint",
  ESCALATION_APPROVED: "mint",
  REJECTED: "blush",
  ESCALATION_REJECTED: "gray",
  ESCALATED: "peach",
  CANCELLED: "gray",
};

function CustomerDetailBody() {
  const { id } = useParams<{ id: string }>();
  const tab = useTab("orders");

  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<CustomerDetail>(`/vendors/me/customers/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this customer.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[116px] rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <BackLink />
        <Card>
          <ErrorState message={error || "Customer not found."} onRetry={load} />
        </Card>
      </div>
    );
  }

  const { customer, summary } = data;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-4">
        <BackLink />
      </div>

      <PageHeader
        title={customer.name}
        subtitle={
          summary.firstOrderAt
            ? `Printing here since ${dateOnly(summary.firstOrderAt)}`
            : "No orders yet"
        }
        action={
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
          >
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      {/* Identity strip — the things you'd want at the counter. */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-4 p-5">
          <span className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 text-base font-black">
            {customer.name.charAt(0).toUpperCase()}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-slate-800">{customer.name}</p>
              {customer.bannedAt && <Chip label="Suspended" tint="blush" />}
              {customer.ratingCount > 0 ? (
                <Stars value={customer.ratingAvg} size={12} count={customer.ratingCount} />
              ) : (
                <span className="text-[11px] text-slate-300">unrated</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap text-[11px] text-slate-500">
              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  className="inline-flex items-center gap-1 hover:text-slate-800 transition-colors tabular-nums"
                >
                  <LuPhone size={11} /> {customer.phone}
                </a>
              )}
              {customer.email && (
                <span className="inline-flex items-center gap-1 truncate max-w-[220px]">
                  <LuMail size={11} /> {customer.email}
                </span>
              )}
              {customer.rollNumber && <span>Roll {customer.rollNumber}</span>}
            </div>
          </div>

          {summary.lastOrderAt && (
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Last print
              </p>
              <p className="text-sm font-semibold text-slate-700">
                {dateOnly(summary.lastOrderAt)}
              </p>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatTile
          label="Visits"
          value={count(summary.visits)}
          icon={LuCalendarCheck}
          tint="lavender"
          hint={`${count(summary.totalOrders)} orders across them`}
        />
        <StatTile
          label="Spent here"
          value={inr(summary.spentPaise)}
          icon={LuCoins}
          tint="mint"
          hint={`avg ${inr(summary.avgOrderPaise)} per order`}
        />
        <StatTile
          label="Pages printed"
          value={count(summary.pagesPrinted)}
          icon={LuFileText}
          tint="sky"
          hint={`${count(summary.completedOrders)} completed`}
        />
        <StatTile
          label="Refunded"
          value={inr(summary.refundedPaise)}
          icon={LuUndo2}
          tint={summary.refundedPaise > 0 ? "gold" : "gray"}
          hint={`${count(summary.failedOrders)} failed or cancelled`}
        />
      </div>

      <ConsoleTabs
        tabs={TABS.map((t) =>
          t.id === "orders"
            ? { ...t, count: summary.totalOrders }
            : t.id === "refunds"
              ? { ...t, count: summary.refundRequests }
              : t
        )}
        active={tab}
        basePath={`/vendor/customers/${id}`}
      />

      {tab === "payments" && <PaymentsTab data={data} />}
      {tab === "visits" && <VisitsTab data={data} />}
      {tab === "ratings" && <RatingsTab data={data} />}
      {tab === "refunds" && <RefundsTab data={data} />}
      {(tab === "orders" || !TABS.some((t) => t.id === tab)) && <OrdersTab data={data} />}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/vendor/customers"
      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
    >
      <LuArrowLeft size={14} /> All customers
    </Link>
  );
}

// ── Orders ──────────────────────────────────────────────────────────────────

function OrdersTab({ data }: { data: CustomerDetail }) {
  if (data.orders.length === 0) {
    return (
      <Card>
        <EmptyState icon={LuFileText} title="No orders" hint="Nothing printed here yet." />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader
          title="Order history"
          subtitle="Newest first, at your printers only."
        />
        <Table head={["Order", "Document", "Config", "Printer", "Paid", "Amount", "Status", "When"]}>
          {data.orders.map((o) => (
            <Tr key={o.id}>
              <Td className="font-mono text-xs font-semibold text-slate-700">
                {o.orderCode}
                {o.refund && (
                  <span className="block text-[10px] font-sans font-bold text-amber-600">
                    refunded
                  </span>
                )}
              </Td>
              <Td className="text-xs text-slate-600 truncate max-w-[150px]">
                {o.document?.fileName || "—"}
              </Td>
              <Td className="text-xs text-slate-500 whitespace-nowrap">
                {o.colorMode === "COLOR" ? "Colour" : "B&W"} · {o.pagesToPrint}pg
                {o.copies > 1 ? ` × ${o.copies}` : ""}
                <span className="block text-[10px] text-slate-400">
                  {o.sideMode === "DOUBLE" ? "Double" : "Single"} · {o.paperSize}
                </span>
              </Td>
              <Td className="text-xs text-slate-600 truncate max-w-[110px]">
                {o.printer?.name || "—"}
              </Td>
              <Td className="text-[11px] text-slate-500 whitespace-nowrap">
                {o.paymentMethod ? o.paymentMethod.replace(/_/g, " ").toLowerCase() : "—"}
              </Td>
              <Td className="tabular-nums font-semibold text-slate-700">{inr(o.costPaise)}</Td>
              <Td>
                <StatusChip status={o.status} />
              </Td>
              <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(o.createdAt)}</Td>
            </Tr>
          ))}
        </Table>
      </Card>

      {data.printersUsed.length > 0 && (
        <Card>
          <CardHeader title="Machines they use" subtitle="Most-used first." />
          <div className="divide-y divide-slate-100">
            {data.printersUsed.map(({ printer, orders }) => (
              <div key={printer?.id} className="flex items-center gap-3 p-4">
                <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <LuPrinter size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{printer?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    <span className="font-mono">{printer?.uniquePrinterId}</span>
                    {printer?.locationName ? ` · ${printer.locationName}` : ""}
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-700 tabular-nums shrink-0">
                  {count(orders)} order{orders === 1 ? "" : "s"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Payments ────────────────────────────────────────────────────────────────

function PaymentsTab({ data }: { data: CustomerDetail }) {
  const byMethod = new Map<string, { orders: number; paise: number }>();
  for (const o of data.orders) {
    if (o.status !== "COMPLETED") continue;
    const key = o.paymentMethod || "UNKNOWN";
    const e = byMethod.get(key) || { orders: 0, paise: 0 };
    e.orders += 1;
    e.paise += o.costPaise;
    byMethod.set(key, e);
  }
  const methods = Array.from(byMethod.entries()).sort((a, b) => b[1].paise - a[1].paise);

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader
          title="How they pay"
          subtitle="Completed orders at your shop, by method."
        />
        {methods.length === 0 ? (
          <EmptyState icon={LuCoins} title="Nothing paid yet" hint="No completed orders." />
        ) : (
          <div className="divide-y divide-slate-100">
            {methods.map(([method, m]) => {
              const share = Math.round((m.paise / Math.max(data.summary.spentPaise, 1)) * 100);
              return (
                <div key={method} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {method.replace(/_/g, " ").toLowerCase()}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {count(m.orders)} order{m.orders === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="hidden sm:block w-28 shrink-0">
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-sky-500" style={{ width: `${share}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 text-right tabular-nums">{share}%</p>
                  </div>
                  <p className="text-sm font-bold text-slate-800 tabular-nums shrink-0 w-20 text-right">
                    {inr(m.paise)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Points movements"
          subtitle="Only movements tied to orders at your shop — not their top-ups or spend elsewhere."
        />
        {data.transactions.length === 0 ? (
          <EmptyState
            icon={LuCoins}
            title="No points movements"
            hint="Points debits and refund credits for your orders appear here."
          />
        ) : (
          <Table head={["Type", "Description", "Order", "Points", "When"]}>
            {data.transactions.map((t) => (
              <Tr key={t.id}>
                <Td>
                  <span
                    className={cx(
                      "inline-flex items-center gap-1 text-[11px] font-bold",
                      t.type === "CREDIT" ? "text-emerald-600" : "text-slate-600"
                    )}
                  >
                    {t.type === "CREDIT" ? (
                      <LuArrowDownLeft size={12} />
                    ) : (
                      <LuArrowUpRight size={12} />
                    )}
                    {t.type === "CREDIT" ? "Credit" : "Debit"}
                  </span>
                </Td>
                <Td className="text-xs text-slate-600 max-w-[240px] truncate">{t.description}</Td>
                <Td className="font-mono text-[11px] text-slate-400">
                  {data.orders.find((o) => o.id === t.orderId)?.orderCode || "—"}
                </Td>
                <Td
                  className={cx(
                    "tabular-nums font-bold text-sm",
                    t.type === "CREDIT" ? "text-emerald-600" : "text-slate-700"
                  )}
                >
                  {t.type === "CREDIT" ? "+" : "−"}
                  {count(t.amountPoints)}
                </Td>
                <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(t.createdAt)}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

// ── Visits ──────────────────────────────────────────────────────────────────

/**
 * A visit is a distinct day with an order, not an order count — someone who
 * prints four documents in one sitting walked in once. That is the number a
 * shop owner means by "how many times have they come in".
 */
function VisitsTab({ data }: { data: CustomerDetail }) {
  const busiest = data.visits.reduce((max, v) => Math.max(max, v.orders), 0);

  return (
    <Card>
      <CardHeader
        title={`${count(data.summary.visits)} visit${data.summary.visits === 1 ? "" : "s"}`}
        subtitle="Each row is one day they came in — not one order."
      />
      {data.visits.length === 0 ? (
        <EmptyState icon={LuCalendarCheck} title="No visits yet" hint="They haven't printed here." />
      ) : (
        <Table head={["Date", "Orders that day", "Pages", "Spent"]}>
          {data.visits.map((v) => (
            <Tr key={v.date}>
              <Td className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                {dateOnly(v.date)}
              </Td>
              <Td>
                <div className="flex items-center gap-2.5">
                  <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{ width: `${(v.orders / Math.max(busiest, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-700 tabular-nums">{v.orders}</span>
                </div>
              </Td>
              <Td className="tabular-nums text-sm text-slate-600">{count(v.pages)}</Td>
              <Td className="tabular-nums text-sm font-semibold text-slate-800">
                {inr(v.spentPaise)}
              </Td>
            </Tr>
          ))}
        </Table>
      )}
    </Card>
  );
}

// ── Ratings ─────────────────────────────────────────────────────────────────

function RatingsTab({ data }: { data: CustomerDetail }) {
  const { fromShop, fromCustomer } = data.ratings;

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader
          title="What you said about them"
          subtitle="Your ratings of this customer, across their orders here."
        />
        {fromShop.length === 0 ? (
          <EmptyState
            icon={LuStar}
            title="You haven't rated them"
            hint="Rate a customer from the Ratings page once their order completes."
          />
        ) : (
          <div>
            {fromShop.map((r) => (
              <RatingCard key={r.id} rating={r} subject="user" />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="What they said about you"
          subtitle="Their reviews of your shop."
        />
        {fromCustomer.length === 0 ? (
          <EmptyState
            icon={LuStar}
            title="No reviews from them"
            hint="Customers can rate your shop once their print completes."
          />
        ) : (
          <div>
            {fromCustomer.map((r) => (
              <RatingCard key={r.id} rating={r} subject="user" />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Refunds ─────────────────────────────────────────────────────────────────

function RefundsTab({ data }: { data: CustomerDetail }) {
  if (data.refundRequests.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={LuUndo2}
          title="No refund requests"
          hint="This customer hasn't asked for money back on any order here."
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Refund requests"
        subtitle="What they asked for, and how you answered."
      />
      <div className="divide-y divide-slate-100">
        {data.refundRequests.map((r) => (
          <div key={r.id} className="p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-slate-700">{r.code}</span>
                  <Chip
                    label={r.status.replace(/_/g, " ").toLowerCase()}
                    tint={REFUND_STATUS_TINT[r.status] || "gray"}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {r.order?.orderCode && <span className="font-mono">{r.order.orderCode} · </span>}
                  {inr(r.order?.costPaise || 0)} · {dateTime(r.createdAt)}
                </p>
              </div>
              {r.status === "PENDING" && (
                <Link
                  href="/vendor/finance/refund-requests"
                  className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  <LuTriangleAlert size={11} /> Answer
                </Link>
              )}
            </div>

            <p className="text-sm text-slate-700">{r.description}</p>

            {r.decisionNote && (
              <p className="text-xs text-slate-500 mt-2 pl-3 border-l-2 border-slate-200">
                You said: {r.decisionNote}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/** `useSearchParams` needs a Suspense boundary or the route can't prerender. */
export default function CustomerDetailPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <CustomerDetailBody />
    </Suspense>
  );
}
