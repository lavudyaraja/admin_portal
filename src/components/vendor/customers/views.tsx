"use client";

/**
 * The customer views, as components rather than routes.
 *
 * All three read the same grouped endpoint; what differs is the cut and the
 * sort. `CustomersFrame` gives them a shared shell (search, counts, loading,
 * error, empty) without a page header — the tab host owns that.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  LuUsers, LuUserCheck, LuUser, LuSearch, LuRefreshCw, LuChevronRight,
} from "react-icons/lu";
import { inr, count, dateOnly } from "@/lib/console/format";
import {
  Card, Table, Td, Tr, Skeleton, EmptyState, ErrorState,
} from "@/components/console/primitives";
import { Stars } from "@/components/console/ratings";
import { matchesCustomer, useCustomers, type VendorCustomer } from "./shared";

/** Shared shell: counts strip, search, refresh, and the three async states. */
function CustomersFrame({
  icon,
  emptyTitle,
  emptyHint,
  loading,
  error,
  reload,
  isEmpty,
  search,
  setSearch,
  summary,
  children,
}: {
  icon: IconType;
  emptyTitle: string;
  emptyHint: string;
  loading: boolean;
  error: string;
  reload: () => void;
  isEmpty: boolean;
  search: string;
  setSearch: (s: string) => void;
  summary?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {summary}
        <div className="relative flex-1 min-w-[200px] max-w-sm ml-auto">
          <LuSearch
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, phone or email…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-slate-400 transition-colors"
          />
        </div>
        <button
          onClick={reload}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2.5 transition-colors cursor-pointer"
        >
          <LuRefreshCw size={13} /> Refresh
        </button>
      </div>

      <Card>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : isEmpty ? (
          <EmptyState
            icon={icon}
            title={search ? "Nothing matches that" : emptyTitle}
            hint={search ? "Try a different search." : emptyHint}
          />
        ) : (
          children
        )}
      </Card>
    </div>
  );
}

// ── Customer list ───────────────────────────────────────────────────────────

/**
 * Everyone who has printed here, ordered by spend rather than alphabetically —
 * the question this is opened with is almost always "who are my regulars", and
 * a name-sorted list answers that only by accident.
 */
export function CustomerListView() {
  const { customers, loading, error, reload } = useCustomers();
  const [search, setSearch] = useState("");

  const rows = useMemo(
    () =>
      customers.filter((c) => matchesCustomer(c, search)).sort((a, b) => b.spentPaise - a.spentPaise),
    [customers, search]
  );

  const totalSpend = useMemo(() => rows.reduce((s, c) => s + c.spentPaise, 0), [rows]);
  const totalPages = useMemo(() => rows.reduce((s, c) => s + c.pagesPrinted, 0), [rows]);

  return (
    <CustomersFrame
      icon={LuUsers}
      emptyTitle="No customers yet"
      emptyHint="Anyone who places an order at your printers appears here."
      loading={loading}
      error={error}
      reload={reload}
      isEmpty={rows.length === 0}
      search={search}
      setSearch={setSearch}
      summary={
        <>
          <Chipish>{count(rows.length)} customer{rows.length === 1 ? "" : "s"}</Chipish>
          <Chipish>{inr(totalSpend)} spent</Chipish>
          <Chipish>{count(totalPages)} pages</Chipish>
        </>
      }
    >
      <Table head={["Customer", "Contact", "Orders", "Pages", "Spent", "Rating", "First seen"]}>
        {rows.map((c) => (
          <Tr key={c.id}>
            <Td>
              <Link
                href={`/vendor/customers/${c.id}`}
                className="font-semibold text-slate-800 text-sm truncate max-w-[160px] block hover:underline"
              >
                {c.name}
              </Link>
            </Td>
            <Td className="text-xs text-slate-500">
              {c.phone && <p className="tabular-nums">{c.phone}</p>}
              {c.email && <p className="truncate max-w-[160px] text-slate-400">{c.email}</p>}
              {!c.phone && !c.email && "—"}
            </Td>
            <Td className="tabular-nums text-sm text-slate-700 font-semibold">{c.orders}</Td>
            <Td className="tabular-nums text-sm text-slate-600">{count(c.pagesPrinted)}</Td>
            <Td className="tabular-nums text-sm font-bold text-slate-800">{inr(c.spentPaise)}</Td>
            <Td>
              <RatingCell customer={c} />
            </Td>
            <Td className="text-xs text-slate-400 whitespace-nowrap">{dateOnly(c.createdAt)}</Td>
          </Tr>
        ))}
      </Table>
    </CustomersFrame>
  );
}

// ── Frequent customers ──────────────────────────────────────────────────────

/** Never call someone a regular on fewer than this many orders. */
const FLOOR = 3;

/**
 * "Frequent" is relative to this shop's own customers, not a fixed number:
 * three orders is a regular at a shop open a month and noise at one open two
 * years. The cut is the higher of twice the average and `FLOOR`, so a new shop
 * doesn't show its entire customer list as loyal.
 */
export function FrequentCustomersView() {
  const { customers, loading, error, reload } = useCustomers();
  const [search, setSearch] = useState("");

  const { rows, threshold, average } = useMemo(() => {
    if (customers.length === 0) return { rows: [], threshold: FLOOR, average: 0 };

    const avg = customers.reduce((s, c) => s + c.orders, 0) / customers.length;
    const cut = Math.max(FLOOR, Math.ceil(avg * 2));

    return {
      average: avg,
      threshold: cut,
      rows: customers
        .filter((c) => c.orders >= cut)
        .filter((c) => matchesCustomer(c, search))
        .sort((a, b) => b.orders - a.orders),
    };
  }, [customers, search]);

  const share = customers.length > 0 ? Math.round((rows.length / customers.length) * 100) : 0;
  const regularSpend = useMemo(() => rows.reduce((s, c) => s + c.spentPaise, 0), [rows]);

  return (
    <CustomersFrame
      icon={LuUserCheck}
      emptyTitle="No regulars yet"
      emptyHint={`Nobody has reached ${threshold} orders. They'll appear here as they come back.`}
      loading={loading}
      error={error}
      reload={reload}
      isEmpty={rows.length === 0}
      search={search}
      setSearch={setSearch}
      summary={
        <>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 tabular-nums">
            {count(rows.length)} regular{rows.length === 1 ? "" : "s"}
          </span>
          <Chipish>{share}% of your customers</Chipish>
          <Chipish>{inr(regularSpend)} from regulars</Chipish>
          <Chipish>{threshold}+ orders · avg {average.toFixed(1)}</Chipish>
        </>
      }
    >
      <Table head={["Customer", "Contact", "Orders", "Pages", "Spent", "Avg order", "Rating"]}>
        {rows.map((c) => (
          <Tr key={c.id}>
            <Td>
              <Link
                href={`/vendor/customers/${c.id}`}
                className="font-semibold text-slate-800 text-sm truncate max-w-[160px] block hover:underline"
              >
                {c.name}
              </Link>
            </Td>
            <Td className="text-xs text-slate-500 tabular-nums">{c.phone || c.email || "—"}</Td>
            <Td className="tabular-nums text-sm font-bold text-emerald-700">{c.orders}</Td>
            <Td className="tabular-nums text-sm text-slate-600">{count(c.pagesPrinted)}</Td>
            <Td className="tabular-nums text-sm font-bold text-slate-800">{inr(c.spentPaise)}</Td>
            <Td className="tabular-nums text-sm text-slate-600">
              {inr(Math.round(c.spentPaise / Math.max(c.orders, 1)))}
            </Td>
            <Td>
              <RatingCell customer={c} />
            </Td>
          </Tr>
        ))}
      </Table>
    </CustomersFrame>
  );
}

// ── Customer history ────────────────────────────────────────────────────────

/**
 * A picker, not a detail view.
 *
 * The full record — orders, payments, visits, ratings, refunds — lives at
 * /vendor/customers/[id], so this tab just gets you there sorted by how often
 * someone prints here. Keeping the detail in one place means the Customer List
 * and this tab can't drift into showing different things about the same person.
 */
export function CustomerHistoryView() {
  const { customers, loading, error, reload } = useCustomers();
  const [search, setSearch] = useState("");

  const rows = useMemo(
    () => customers.filter((c) => matchesCustomer(c, search)).sort((a, b) => b.orders - a.orders),
    [customers, search]
  );

  return (
    <CustomersFrame
      icon={LuUser}
      emptyTitle="No customers yet"
      emptyHint="Customers appear once someone orders at your printers."
      loading={loading}
      error={error}
      reload={reload}
      isEmpty={rows.length === 0}
      search={search}
      setSearch={setSearch}
      summary={<Chipish>Pick a customer to open their full record</Chipish>}
    >
      <div className="divide-y divide-slate-100">
        {rows.map((c) => (
          <Link
            key={c.id}
            href={`/vendor/customers/${c.id}`}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
          >
            <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 text-xs font-bold">
              {c.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800 text-sm truncate">{c.name}</p>
              <p className="text-[11px] text-slate-400 truncate">
                {c.phone || c.email || "No contact details"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-slate-800 tabular-nums">{c.orders} orders</p>
              <p className="text-[11px] text-slate-400 tabular-nums">{inr(c.spentPaise)}</p>
            </div>
            <LuChevronRight size={16} className="text-slate-300 shrink-0" />
          </Link>
        ))}
      </div>
    </CustomersFrame>
  );
}

// ── Small shared bits ───────────────────────────────────────────────────────

function Chipish({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 tabular-nums">
      {children}
    </span>
  );
}

/**
 * Blank rather than zero stars for someone no shop has rated — an empty cell
 * reads as "unrated", five grey stars read as "rated badly".
 */
function RatingCell({ customer }: { customer: VendorCustomer }) {
  if (customer.ratingCount === 0) {
    return <span className="text-[11px] text-slate-300">unrated</span>;
  }
  return <Stars value={customer.ratingAvg} size={12} count={customer.ratingCount} />;
}
