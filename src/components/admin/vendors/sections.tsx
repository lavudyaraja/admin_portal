"use client";

// Sections of a vendor's record.
//
// Five of the thirteen tabs have no table behind them — Commission, Payout
// History, Settlements, KYC Documents and Reviews. Rather than render an empty
// list that reads as "this vendor has none", each says plainly that the feature
// doesn't exist yet and what it would need. An empty table is a lie an operator
// could act on.

import {
  LuStore, LuPrinter, LuFileText, LuBanknote, LuPercent, LuWallet,
  LuScale, LuFileCheck, LuStar, LuClock, LuIndianRupee, LuUsers, LuMapPin,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import Link from "next/link";
import type { VendorProfile, VendorPrinter, VendorOrder } from "@/lib/admin/api";
import { inr, count, dateOnly, dateTime } from "@/lib/console/format";
import {
  Card, Table, Td, Tr, StatusChip, LevelBar, EmptyState, StatTile, Chip,
} from "@/components/console/primitives";
import { RatingCard, RatingSummaryCard } from "@/components/console/ratings";

// ── Not-built-yet notice ─────────────────────────────────────────────────────

/**
 * Used for the tabs with no backing model. It names what's missing rather than
 * pretending the vendor simply has no records of that kind.
 */
export function NotBuilt({ icon, title, needs }: { icon: IconType; title: string; needs: string }) {
  const Icon = icon;
  return (
    <Card className="p-10">
      <div className="text-center max-w-md mx-auto">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <Icon size={22} />
        </div>
        <p className="font-bold text-slate-800">{title}</p>
        <p className="text-sm text-slate-400 mt-1.5">{needs}</p>
        <p className="text-[11px] text-slate-400 mt-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          Nothing is being hidden here — the data doesn&apos;t exist yet.
        </p>
      </div>
    </Card>
  );
}

// ── Profile ──────────────────────────────────────────────────────────────────

export function VendorProfileSection({ data }: { data: VendorProfile }) {
  const v = data.vendor;
  const s = data.summary;
  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Orders" value={count(s.totalOrders)} icon={LuFileText} tint="lavender" hint={`${count(s.completedOrders)} completed`} />
        <StatTile label="Revenue" value={inr(s.revenuePaise)} icon={LuIndianRupee} tint="mint" hint="completed orders" />
        <StatTile label="Customers" value={count(s.customers)} icon={LuUsers} tint="sky" hint="distinct people" />
        <StatTile label="Printers" value={count(s.printers)} icon={LuPrinter} tint="gold" hint={`${count(s.locations)} branch(es)`} />
      </section>

      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Owner &amp; account</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
          <Field label="Shop" value={v.shopName} />
          <Field label="Owner" value={v.user?.name || v.contactName || "—"} />
          <Field label="Phone" value={v.user?.phone || v.mobileNumber || "—"} />
          <Field label="Email" value={v.user?.email || "—"} />
          <Field label="Role" value={v.user?.role || "—"} />
          <Field label="Registered" value={dateTime(v.createdAt)} />
          <Field label="Pages printed" value={count(s.pagesPrinted)} />
          <Field label="Failed / cancelled" value={`${count(s.failedOrders)} / ${count(s.cancelledOrders)}`} />
        </div>
        {v.bannedAt && (
          <p className="mt-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            Shop banned{v.banReason ? ` — ${v.banReason}` : ""}.
          </p>
        )}
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm text-slate-700 truncate">{value}</p>
    </div>
  );
}

// ── Shop details ─────────────────────────────────────────────────────────────

export function ShopDetailsSection({ data }: { data: VendorProfile }) {
  const v = data.vendor;
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Shop</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
          <Field label="Shop name" value={v.shopName} />
          <Field label="Contact name" value={v.contactName || "—"} />
          <Field label="Mobile" value={v.mobileNumber || "—"} />
          <Field label="Branches" value={count(v.locations.length)} />
          <Field label="Printers" value={count(v.printers.length)} />
          <Field label="Last updated" value={dateTime(v.updatedAt)} />
        </div>
      </Card>

      <div>
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
          <LuMapPin size={14} className="text-slate-400" /> Branches
        </h3>
        {v.locations.length === 0 ? (
          <Card className="p-10"><EmptyState icon={LuMapPin} title="No branches" hint="This shop hasn't added a location." /></Card>
        ) : (
          <Card>
            <Table head={["Branch", "Address", "Printers", "Added"]}>
              {v.locations.map((l) => (
                <Tr key={l.id}>
                  <Td className="font-semibold text-slate-700">{l.name}</Td>
                  <Td className="text-slate-600 text-xs">{l.address || "—"}</Td>
                  <Td className="tabular-nums">{count(l._count.printers)}</Td>
                  <Td className="text-slate-400 text-xs whitespace-nowrap">{dateOnly(l.createdAt)}</Td>
                </Tr>
              ))}
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Printers ─────────────────────────────────────────────────────────────────

export function VendorPrintersSection({ data }: { data: VendorProfile }) {
  const printers = data.vendor.printers;
  if (printers.length === 0) {
    return <Card className="p-10"><EmptyState icon={LuPrinter} title="No printers" hint="This shop hasn't registered a machine." /></Card>;
  }
  return (
    <Card>
      <Table head={["Printer", "Model", "Branch", "Status", "Paper", "Toner", "Rates", "Registered"]}>
        {printers.map((p: VendorPrinter) => (
          <Tr key={p.id}>
            <Td>
              <p className="font-semibold text-slate-700">{p.name}</p>
              <p className="text-[11px] text-slate-400 font-mono">{p.uniquePrinterId}</p>
            </Td>
            <Td className="text-xs text-slate-600">{p.brand} {p.model}</Td>
            <Td className="text-xs text-slate-600">{p.locationName}</Td>
            <Td><StatusChip status={p.status} /></Td>
            <Td className="w-28"><LevelBar value={p.paperLevel} /></Td>
            <Td className="w-28"><LevelBar value={p.tonerLevel} /></Td>
            <Td className="text-xs whitespace-nowrap text-slate-600">
              {inr(p.costPerBWPagePaise)} / {inr(p.costPerColorPagePaise)}
            </Td>
            <Td className="text-slate-400 text-xs whitespace-nowrap">{dateOnly(p.createdAt)}</Td>
          </Tr>
        ))}
      </Table>
    </Card>
  );
}

// ── Orders ───────────────────────────────────────────────────────────────────

export function VendorOrdersSection({ data }: { data: VendorProfile }) {
  if (data.orders.length === 0) {
    return <Card className="p-10"><EmptyState icon={LuFileText} title="No orders" hint="No print jobs have run at this shop." /></Card>;
  }
  return (
    <Card>
      <Table head={["Order", "Customer", "Printer", "Config", "Amount", "Status", "When"]}>
        {data.orders.map((o: VendorOrder) => (
          <Tr key={o.id}>
            <Td className="font-mono text-xs font-semibold text-slate-700">{o.orderCode}</Td>
            <Td>
              {o.user ? (
                <Link href={`/admin/management/users/${o.user.id}`} className="text-slate-700 hover:underline">
                  {o.user.name}
                </Link>
              ) : "—"}
            </Td>
            <Td className="text-xs text-slate-600">{o.printer?.name || "—"}</Td>
            <Td className="text-xs text-slate-500 whitespace-nowrap">
              {o.colorMode === "COLOR" ? "Colour" : "B&W"} · {o.pagesToPrint}pg
            </Td>
            <Td className="tabular-nums font-semibold text-slate-700">{inr(o.costPaise)}</Td>
            <Td><StatusChip status={o.status} /></Td>
            <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(o.createdAt)}</Td>
          </Tr>
        ))}
      </Table>
    </Card>
  );
}

// ── Reviews ──────────────────────────────────────────────────────────────────

/**
 * What customers said about this shop. Staff see hidden ratings here too — the
 * point of an operator's view of a vendor is to know what was said, including
 * the parts that were taken down. Moderating them happens on the Ratings page,
 * not here; this is the read.
 */
export function VendorReviewsSection({ data }: { data: VendorProfile }) {
  const ratings = data.ratings || [];

  return (
    <div className="space-y-3">
      <Card>
        <RatingSummaryCard
          summary={data.ratingSummary}
          title="Shop rating"
          emptyHint="No ratings yet."
        />
      </Card>

      <Card>
        {ratings.length === 0 ? (
          <EmptyState
            icon={LuStar}
            title="No reviews yet"
            hint="Customers can rate a shop once their print completes."
          />
        ) : (
          <div>
            {ratings.map((r) => (
              <RatingCard key={r.id} rating={r} subject="user" />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Revenue ──────────────────────────────────────────────────────────────────

export function VendorRevenueSection({ data }: { data: VendorProfile }) {
  const s = data.summary;
  const avg = s.completedOrders > 0 ? Math.round(s.revenuePaise / s.completedOrders) : 0;

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Revenue" value={inr(s.revenuePaise)} icon={LuIndianRupee} tint="mint" hint="completed orders only" />
        <StatTile label="Completed" value={count(s.completedOrders)} icon={LuFileText} tint="lavender" hint={`of ${count(s.totalOrders)} total`} />
        <StatTile label="Average order" value={inr(avg)} icon={LuIndianRupee} tint="sky" hint="per completed order" />
        <StatTile label="Pages printed" value={count(s.pagesPrinted)} icon={LuPrinter} tint="gold" hint="completed orders" />
      </section>

      <p className="text-xs text-slate-400">
        Gross takings on completed orders. This is not what the shop is owed — that needs a
        commission rate, which the platform doesn&apos;t define yet.
      </p>
    </div>
  );
}

// ── Bank account ─────────────────────────────────────────────────────────────

export function VendorBankSection({ data }: { data: VendorProfile }) {
  const acct = data.vendor.user?.bankAccount;
  if (!acct) {
    return (
      <Card className="p-10">
        <EmptyState icon={LuBanknote} title="No payout account" hint="This vendor hasn't added their bank details yet." />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">Payout account</h3>
        <Chip label={acct.verified ? "Verified" : "Unverified"} tint={acct.verified ? "mint" : "gold"} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
        <Field label="Account holder" value={acct.accountHolder} />
        {/* Masked here as it is everywhere — the full number never leaves the server. */}
        <Field label="Account number" value={`••••••${acct.accountNumber.slice(-4)}`} />
        <Field label="IFSC" value={acct.ifsc} />
        <Field label="Bank" value={acct.bankName || "—"} />
        <Field label="Branch" value={acct.branch || "—"} />
        <Field label="UPI" value={acct.upiId || "—"} />
        <Field label="Last updated" value={dateTime(acct.updatedAt)} />
      </div>
    </Card>
  );
}

// ── Activity ─────────────────────────────────────────────────────────────────

const TINT: Record<string, string> = {
  ORDER: "bg-tint-lavender text-ink-lavender",
  PRINTER: "bg-tint-sky text-ink-sky",
  JOINED: "bg-tint-gray text-ink-gray",
};

export function VendorActivitySection({ data }: { data: VendorProfile }) {
  if (data.activity.length === 0) {
    return <Card className="p-10"><EmptyState icon={LuClock} title="No activity" hint="Nothing recorded for this shop yet." /></Card>;
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        Reconstructed from orders and printer registrations. Not an audit log — staff actions
        aren&apos;t recorded.
      </p>
      <Card className="p-5">
        <ol className="relative border-l border-slate-200 ml-2">
          {data.activity.map((e, i) => (
            <li key={`${e.at}-${i}`} className="mb-5 last:mb-0 ml-5">
              <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-slate-300" />
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${TINT[e.kind]}`}>
                  {e.kind}
                </span>
                <p className="text-sm font-semibold text-slate-700">{e.title}</p>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{e.detail}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{dateTime(e.at)}</p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

export const NOT_BUILT_ICONS = { LuPercent, LuWallet, LuScale, LuFileCheck, LuStar, LuStore };
