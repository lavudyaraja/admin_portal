"use client";

// The sections of a user's profile, one component each.
//
// They all take the already-fetched bundle rather than fetching their own slice:
// the profile is one round trip (GET /admin/users/:id), and switching tabs
// should not re-hit the network.

import {
  LuFileText, LuPrinter, LuCoins, LuScale, LuLifeBuoy, LuGift,
  LuUndo2, LuClock, LuUserPlus, LuArrowDownLeft, LuArrowUpRight, LuStar,
} from "react-icons/lu";
import type {
  UserProfile, UserOrder, UserTxn, UserRefund, UserComplaint, UserTicket,
  UserPrinter, ActivityEvent,
} from "@/lib/admin/api";
import { inr, points, ledgerPoints, count, dateOnly, dateTime } from "@/lib/console/format";
import {
  Card, CardHeader, Table, Td, Tr, StatusChip, Chip, EmptyState, StatTile,
} from "@/components/console/primitives";
import { RatingCard, RatingSummaryCard } from "@/components/console/ratings";

// ── Profile ──────────────────────────────────────────────────────────────────

export function ProfileSection({ data }: { data: UserProfile }) {
  const u = data.user;
  const s = data.summary;

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Orders" value={count(s.totalOrders)} icon={LuFileText} tint="lavender" hint={`${count(s.pagesPrinted)} pages printed`} />
        <StatTile label="Points balance" value={points(s.pointsBalance)} icon={LuCoins} tint="mint" hint="current" />
        <StatTile label="Lifetime spend" value={inr(s.completedSpendPaise)} icon={LuArrowUpRight} tint="sky" hint="completed orders" />
        <StatTile label="Printers used" value={count(s.printersUsed)} icon={LuPrinter} tint="gold" hint={`${count(s.complaints)} reports filed`} />
      </section>

      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Account</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
          <Field label="Name" value={u.name} />
          <Field label="Phone" value={u.phone || "—"} />
          <Field label="Email" value={u.email || "—"} />
          <Field label="Roll number" value={u.rollNumber || "—"} />
          <Field label="Role" value={u.role} />
          <Field label="Joined" value={dateTime(u.createdAt)} />
          <Field label="Referral code" value={u.referralCode || "—"} mono />
          <Field label="Email alerts" value={u.emailNotifications ? "On" : "Off"} />
          <Field label="Documents" value={count(u._count.documents)} />
          <Field label="Refunds" value={count(u._count.refunds)} />
          {u.referredBy && <Field label="Invited by" value={u.referredBy.name} />}
          {u.bannedAt && <Field label="Banned" value={dateOnly(u.bannedAt)} />}
        </div>

        {u.bannedAt && (
          <p className="mt-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            Account banned{u.banReason ? ` — ${u.banReason}` : ""}.
          </p>
        )}
      </Card>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-sm text-slate-700 truncate ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

// ── Points ───────────────────────────────────────────────────────────────────

export function PointsSection({ data }: { data: UserProfile }) {
  const credits = data.transactions.filter((t) => t.type === "CREDIT").reduce((a, t) => a + ledgerPoints(t), 0);
  const debits = data.transactions.filter((t) => t.type === "DEBIT").reduce((a, t) => a + ledgerPoints(t), 0);

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Balance" value={points(data.user.pointsBalance)} icon={LuCoins} tint="lavender" hint="right now" />
        <StatTile label="Credited" value={points(credits)} icon={LuArrowDownLeft} tint="mint" hint="loaded rows" />
        <StatTile label="Spent" value={points(debits)} icon={LuArrowUpRight} tint="blush" hint="loaded rows" />
        <StatTile label="Net" value={points(credits - debits)} icon={LuCoins} tint="sky" hint="loaded rows" />
      </section>
      <TransactionsSection data={data} />
    </div>
  );
}

// ── Transactions ─────────────────────────────────────────────────────────────

export function TransactionsSection({ data }: { data: UserProfile }) {
  if (data.transactions.length === 0) {
    return <Card className="p-10"><EmptyState icon={LuCoins} title="No transactions" hint="Points movements will appear here." /></Card>;
  }
  return (
    <Card>
      <Table head={["Type", "Description", "Amount", "Balance after", "When"]}>
        {data.transactions.map((t: UserTxn) => (
          <Tr key={t.id}>
            <Td>
              <Chip label={t.type} tint={t.type === "CREDIT" ? "mint" : "blush"} />
            </Td>
            <Td className="text-slate-600">{t.description}</Td>
            <Td className={`tabular-nums font-bold ${t.type === "CREDIT" ? "text-emerald-600" : "text-rose-600"}`}>
              {t.type === "CREDIT" ? "+" : "−"}{points(ledgerPoints(t))}
            </Td>
            {/* Balances are split across two columns by the rename, same as amounts. */}
            <Td className="tabular-nums text-slate-600">{points(ledgerPoints(t.balancePoints, t.balancePaise))}</Td>
            <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(t.createdAt)}</Td>
          </Tr>
        ))}
      </Table>
    </Card>
  );
}

// ── Orders ───────────────────────────────────────────────────────────────────

export function OrdersSection({ data }: { data: UserProfile }) {
  if (data.orders.length === 0) {
    return <Card className="p-10"><EmptyState icon={LuFileText} title="No orders" hint="This user hasn't placed a print order." /></Card>;
  }
  return (
    <Card>
      <Table head={["Order", "Document", "Printer", "Config", "Amount", "Status", "When"]}>
        {data.orders.map((o: UserOrder) => (
          <Tr key={o.id}>
            <Td>
              <p className="font-mono text-xs font-semibold text-slate-700">{o.orderCode}</p>
              <p className="text-[11px] text-slate-400">{o.paymentMethod || "—"}</p>
            </Td>
            <Td className="text-slate-600 truncate max-w-[160px]">{o.document?.fileName || "—"}</Td>
            <Td className="text-xs">
              <p className="text-slate-600 truncate max-w-[140px]">{o.printer?.name || "Unassigned"}</p>
              {o.printer && <p className="text-[11px] text-slate-400 font-mono">{o.printer.uniquePrinterId}</p>}
            </Td>
            <Td className="text-xs text-slate-500 whitespace-nowrap">
              {o.colorMode === "COLOR" ? "Colour" : "B&W"} · {o.pagesToPrint}pg × {o.copies}
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

// ── Refunds ──────────────────────────────────────────────────────────────────

export function RefundsSection({ data }: { data: UserProfile }) {
  if (data.refunds.length === 0) {
    return <Card className="p-10"><EmptyState icon={LuUndo2} title="No refunds" hint="Refunds issued to this user will appear here." /></Card>;
  }
  return (
    <Card>
      <Table head={["Order", "Reason", "Refunded", "Origin", "Note", "When"]}>
        {data.refunds.map((r: UserRefund) => (
          <Tr key={r.id}>
            <Td className="font-mono text-xs text-slate-700">{r.order?.orderCode || "—"}</Td>
            <Td className="text-slate-600 text-xs">{r.reason.replace(/_/g, " ").toLowerCase()}</Td>
            <Td className="tabular-nums font-bold text-emerald-600">
              +{points(r.pointsCredited)}
              <span className="block text-[11px] font-normal text-slate-400">was {inr(r.amountPaise)}</span>
            </Td>
            <Td><Chip label={r.origin} tint={r.origin === "AUTOMATIC" ? "sky" : "lavender"} /></Td>
            <Td className="text-xs text-slate-500 truncate max-w-[160px]">{r.note || "—"}</Td>
            <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(r.createdAt)}</Td>
          </Tr>
        ))}
      </Table>
    </Card>
  );
}

// ── Referrals ────────────────────────────────────────────────────────────────

export function ReferralsSection({ data }: { data: UserProfile }) {
  const u = data.user;
  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Their code" value={u.referralCode || "—"} icon={LuGift} tint="lavender" hint="shared with friends" />
        <StatTile label="Invited" value={count(data.summary.invited)} icon={LuUserPlus} tint="sky" hint="signed up with it" />
        <StatTile label="Converted" value={count(data.summary.invitedConverted)} icon={LuGift} tint="mint" hint="made a first print" />
        <StatTile
          label="Invited by"
          value={u.referredBy?.name || "—"}
          icon={LuUserPlus}
          tint="gold"
          hint={u.referralRewardedAt ? "reward paid" : u.referredById ? "not yet earned" : "joined directly"}
        />
      </section>

      {u.referrals.length === 0 ? (
        <Card className="p-10"><EmptyState icon={LuGift} title="No invites" hint="Nobody has joined using this user's code." /></Card>
      ) : (
        <Card>
          <Table head={["Invitee", "Joined", "Status"]}>
            {u.referrals.map((r) => (
              <Tr key={r.id}>
                <Td className="font-semibold text-slate-700">{r.name}</Td>
                <Td className="text-slate-400 text-xs whitespace-nowrap">{dateOnly(r.createdAt)}</Td>
                <Td>
                  {r.referralRewardedAt ? (
                    <Chip label="Rewarded" tint="mint" />
                  ) : (
                    <Chip label="Yet to print" tint="gray" />
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
}

// ── Saved printers ───────────────────────────────────────────────────────────

export function PrintersSection({ data }: { data: UserProfile }) {
  return (
    <div className="space-y-3">
      {/* No favourites feature exists; this is derived from real usage, and
          saying so is better than implying a setting the user never made. */}
      <p className="text-xs text-slate-400">
        Derived from print history — the machines this user actually sends jobs to. Prinsta has no
        &ldquo;save a printer&rdquo; feature.
      </p>

      {data.savedPrinters.length === 0 ? (
        <Card className="p-10"><EmptyState icon={LuPrinter} title="No printers used" hint="This user hasn't completed a print on any machine." /></Card>
      ) : (
        <Card>
          <Table head={["Printer", "Shop", "Location", "Orders", "Last used"]}>
            {data.savedPrinters.map((p: UserPrinter) => (
              <Tr key={p.id}>
                <Td>
                  <p className="font-semibold text-slate-700">{p.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{p.uniquePrinterId}</p>
                </Td>
                <Td className="text-slate-600">{p.shopName}</Td>
                <Td className="text-slate-600">{p.locationName}</Td>
                <Td className="tabular-nums font-bold text-slate-700">{count(p.orders)}</Td>
                <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(p.lastUsedAt)}</Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
}

// ── Ratings ──────────────────────────────────────────────────────────────────

/**
 * Both sides of this customer's rating history.
 *
 * "Received" is their standing — what shops thought of them, and the reason a
 * vendor might refuse an order. "Written" is what they said about shops, which
 * is the context that makes a run of one-star reviews legible: a customer who
 * rates every shop one star is a different problem from one who had a bad week.
 */
export function RatingsSection({ data }: { data: UserProfile }) {
  const received = data.ratingsReceived || [];
  const written = data.ratingsWritten || [];

  return (
    <div className="space-y-3">
      <Card>
        <RatingSummaryCard
          summary={data.ratingSummary}
          title="Customer rating"
          emptyHint="No shop has rated them yet."
        />
      </Card>

      <Card>
        <CardHeader
          title="From shops"
          subtitle={`${count(received.length)} rating${received.length === 1 ? "" : "s"} about this customer`}
        />
        {received.length === 0 ? (
          <EmptyState
            icon={LuStar}
            title="No ratings from shops"
            hint="A shop can rate a customer once their order completes."
          />
        ) : (
          <div>
            {received.map((r) => (
              <RatingCard key={r.id} rating={r} subject="vendor" />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="About shops"
          subtitle={`${count(written.length)} rating${written.length === 1 ? "" : "s"} this customer wrote`}
        />
        {written.length === 0 ? (
          <EmptyState
            icon={LuStar}
            title="They haven't rated anyone"
            hint="Ratings this customer leaves for shops appear here."
          />
        ) : (
          <div>
            {written.map((r) => (
              <RatingCard key={r.id} rating={r} subject="vendor" />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Support history ──────────────────────────────────────────────────────────

export function SupportSection({ data }: { data: UserProfile }) {
  const hasAny = data.complaints.length > 0 || data.tickets.length > 0;
  if (!hasAny) {
    return <Card className="p-10"><EmptyState icon={LuLifeBuoy} title="Nothing raised" hint="No reports or support tickets from this user." /></Card>;
  }

  return (
    <div className="space-y-5">
      {data.complaints.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
            <LuScale size={14} className="text-slate-400" /> Reports
          </h3>
          <Card>
            <Table head={["Ref", "Category", "Subject", "Status", "Resolution", "When"]}>
              {data.complaints.map((c: UserComplaint) => (
                <Tr key={c.id}>
                  <Td className="font-mono text-xs text-slate-700">{c.code}</Td>
                  <Td className="text-xs text-slate-500">{c.category.replace(/_/g, " ").toLowerCase()}</Td>
                  <Td className="text-slate-600 truncate max-w-[180px]">{c.subject}</Td>
                  <Td><StatusChip status={c.status} /></Td>
                  <Td className="text-xs text-slate-500 truncate max-w-[180px]">{c.resolution || "—"}</Td>
                  <Td className="text-slate-400 text-xs whitespace-nowrap">{dateOnly(c.createdAt)}</Td>
                </Tr>
              ))}
            </Table>
          </Card>
        </div>
      )}

      {data.tickets.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
            <LuLifeBuoy size={14} className="text-slate-400" /> Support tickets
          </h3>
          <Card>
            <Table head={["Subject", "Status", "Reply", "When"]}>
              {data.tickets.map((t: UserTicket) => (
                <Tr key={t.id}>
                  <Td className="text-slate-600">{t.subject}</Td>
                  <Td><StatusChip status={t.status} /></Td>
                  <Td className="text-xs text-slate-500 truncate max-w-[220px]">{t.reply || "Awaiting reply"}</Td>
                  <Td className="text-slate-400 text-xs whitespace-nowrap">{dateOnly(t.createdAt)}</Td>
                </Tr>
              ))}
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Activity ─────────────────────────────────────────────────────────────────

const ACTIVITY_TINT: Record<ActivityEvent["kind"], string> = {
  ORDER: "bg-tint-lavender text-ink-lavender",
  CREDIT: "bg-tint-mint text-ink-mint",
  DEBIT: "bg-tint-blush text-ink-blush",
  REPORT: "bg-tint-gold text-ink-gold",
  REFUND: "bg-tint-sky text-ink-sky",
  JOINED: "bg-tint-gray text-ink-gray",
};

export function ActivitySection({ data }: { data: UserProfile }) {
  if (data.activity.length === 0) {
    return <Card className="p-10"><EmptyState icon={LuClock} title="No activity" hint="Nothing recorded for this account yet." /></Card>;
  }

  return (
    <div className="space-y-3">
      {/* Worth being explicit: this is reconstructed from user-facing events, so
          it must not be mistaken for an audit trail of staff actions. */}
      <p className="text-xs text-slate-400">
        Reconstructed from this user&apos;s own activity — orders, points, reports and refunds. Not
        an audit log; staff actions are not recorded.
      </p>

      <Card className="p-5">
        <ol className="relative border-l border-slate-200 ml-2">
          {data.activity.map((e, i) => (
            <li key={`${e.at}-${i}`} className="mb-5 last:mb-0 ml-5">
              <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-slate-300" />
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${ACTIVITY_TINT[e.kind]}`}>
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
