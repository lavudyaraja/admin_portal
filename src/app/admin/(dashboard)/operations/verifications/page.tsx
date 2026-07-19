"use client";

// Verifications: the checks an operator signs off before money moves or a
// machine goes live.
//
// Bank, Shop and Printer are real and actionable. Vendor KYC and User
// Verification have no record behind them and say so rather than showing an
// empty queue.

import { Suspense, useCallback, useEffect, useState } from "react";
import {
  LuBadgeCheck, LuBanknote, LuStore, LuPrinter, LuFileCheck,
  LuUserCheck, LuCircleX, LuCheck, LuRefreshCw, LuClock,
} from "react-icons/lu";
import { apiFetch } from "@/lib/admin/api";
import { count, dateOnly } from "@/lib/console/format";
import { OpsTabs, useOpsTab, NoRecord, type OpsTab } from "@/components/admin/OpsTabs";
import { StatRow } from "@/components/admin/StatRow";
import {
  Card, Table, Td, Tr, Skeleton, ErrorState, EmptyState, PageHeader, StatTile, Chip,
} from "@/components/console/primitives";

interface BankItem {
  id: string;
  accountHolder: string;
  accountMasked: string;
  ifsc: string;
  bankName: string | null;
  upiId: string | null;
  verified: boolean;
  updatedAt: string;
  user: { id: string; name: string; phone: string | null; email: string | null; role: string; vendor: { id: string; shopName: string } | null } | null;
}

interface ShopItem {
  id: string;
  shopName: string;
  contactName: string | null;
  mobileNumber: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  verificationNote: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string | null } | null;
  _count: { printers: number; orders: number };
}

interface PrinterItem {
  id: string;
  name: string;
  uniquePrinterId: string;
  shopName: string;
  locationName: string;
  brand: string;
  model: string;
  serialNumber: string | null;
  ipAddress: string;
  verifiedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  vendor: { id: string; shopName: string } | null;
}

interface Section<T> {
  total: number;
  verified: number;
  pending: number;
  rejected?: number;
  items: T[];
}

interface VerificationData {
  bank: Section<BankItem>;
  shop: Section<ShopItem>;
  printer: Section<PrinterItem>;
}

/** Verified / rejected / not yet looked at — three states, never two at once. */
function VerifyState({ verifiedAt, rejectedAt }: { verifiedAt: string | null; rejectedAt: string | null }) {
  if (verifiedAt) return <Chip label="Verified" tint="mint" />;
  if (rejectedAt) return <Chip label="Rejected" tint="blush" />;
  return <Chip label="Pending" tint="gold" />;
}

function VerificationsPageBody() {
  const tab = useOpsTab("bank");
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<VerificationData>("/operations/verifications"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(kind: "bank" | "shop" | "printer", id: string, decision: "APPROVE" | "REJECT") {
    setBusy(id);
    try {
      await apiFetch(`/operations/verifications/${kind}/${id}`, { method: "PATCH", body: { decision } });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not record that decision.");
    }
    setBusy(null);
  }

  const tabs: OpsTab[] = [
    { id: "kyc", label: "Vendor KYC", icon: LuFileCheck },
    { id: "bank", label: "Bank", icon: LuBanknote, count: data?.bank.pending },
    { id: "shop", label: "Shop", icon: LuStore, count: data?.shop.pending },
    { id: "printer", label: "Printer", icon: LuPrinter, count: data?.printer.pending },
    { id: "user", label: "User", icon: LuUserCheck },
    { id: "rejected", label: "Rejected", icon: LuCircleX, count: (data?.shop.rejected || 0) + (data?.printer.rejected || 0) },
  ];

  const rejected = [
    ...(data?.shop.items || []).filter((s) => s.rejectedAt).map((s) => ({ kind: "Shop", name: s.shopName, ref: s.user?.email || "—", at: s.rejectedAt!, note: s.verificationNote })),
    ...(data?.printer.items || []).filter((p) => p.rejectedAt).map((p) => ({ kind: "Printer", name: p.name, ref: p.uniquePrinterId, at: p.rejectedAt!, note: null })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at));

  const ActionButtons = ({ kind, id, disabled }: { kind: "bank" | "shop" | "printer"; id: string; disabled?: boolean }) => (
    <div className="flex gap-1.5">
      <button
        onClick={() => decide(kind, id, "APPROVE")}
        disabled={busy === id || disabled}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg px-2 py-1 transition-colors cursor-pointer disabled:opacity-40"
      >
        <LuCheck size={11} /> Approve
      </button>
      <button
        onClick={() => decide(kind, id, "REJECT")}
        disabled={busy === id || disabled}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg px-2 py-1 transition-colors cursor-pointer disabled:opacity-40"
      >
        <LuCircleX size={11} /> Reject
      </button>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Verifications"
        subtitle="Checks signed off before payouts run or a machine takes jobs."
        action={
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
          >
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      <StatRow loading={!data}>
        {data && (
          <>
            <StatTile label="Awaiting review" value={count(data.bank.pending + data.shop.pending + data.printer.pending)} icon={LuClock} tint="gold" hint="across all checks" />
            <StatTile label="Bank accounts" value={count(data.bank.verified)} icon={LuBanknote} tint="mint" hint={`${count(data.bank.pending)} pending`} />
            <StatTile label="Shops" value={count(data.shop.verified)} icon={LuStore} tint="sky" hint={`${count(data.shop.pending)} pending`} />
            <StatTile label="Printers" value={count(data.printer.verified)} icon={LuPrinter} tint="lavender" hint={`${count(data.printer.pending)} pending`} />
          </>
        )}
      </StatRow>

      <OpsTabs tabs={tabs} active={tab} basePath="/admin/operations/verifications" />

      {tab === "kyc" ? (
        <NoRecord
          icon={LuFileCheck}
          title="KYC documents aren't collected"
          needs="Nothing uploads or stores identity documents — no PAN, GST, address proof or ownership papers. The bank account carries a verified flag, but no document is attached to it. This needs a document upload and review flow before there is anything to check."
        />
      ) : tab === "user" ? (
        <NoRecord
          icon={LuUserCheck}
          title="Users aren't verified"
          needs="A student signs up with a phone or email and starts printing — there is no ID check, roll-number validation or institution approval step. This needs a verification requirement at sign-up before there is a queue here."
        />
      ) : loading ? (
        <Card><div className="p-5 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div></Card>
      ) : error ? (
        <Card><ErrorState message={error} onRetry={load} /></Card>
      ) : tab === "bank" ? (
        <Card>
          {!data || data.bank.items.length === 0 ? (
            <EmptyState icon={LuBanknote} title="No payout accounts" hint="Accounts appear here once a vendor adds their bank details." />
          ) : (
            <Table head={["Account holder", "Owner", "Account", "Bank", "Status", "Action"]}>
              {data.bank.items.map((b) => (
                <Tr key={b.id}>
                  <Td>
                    <p className="font-semibold text-slate-700">{b.accountHolder}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{b.ifsc}</p>
                  </Td>
                  <Td className="text-xs text-slate-600">
                    <p>{b.user?.vendor?.shopName || b.user?.name || "—"}</p>
                    <p className="text-[11px] text-slate-400">{b.user?.phone || b.user?.email || ""}</p>
                  </Td>
                  <Td className="font-mono text-xs text-slate-600">{b.accountMasked}</Td>
                  <Td className="text-xs text-slate-600">{b.bankName || "—"}</Td>
                  <Td><Chip label={b.verified ? "Verified" : "Pending"} tint={b.verified ? "mint" : "gold"} /></Td>
                  <Td><ActionButtons kind="bank" id={b.id} /></Td>
                </Tr>
              ))}
            </Table>
          )}
          <p className="px-5 py-3 text-[11px] text-slate-400 border-t border-slate-100">
            Approving records that a person checked these details. Nothing here contacts a bank, and
            editing the account clears the flag again.
          </p>
        </Card>
      ) : tab === "shop" ? (
        <Card>
          {!data || data.shop.items.length === 0 ? (
            <EmptyState icon={LuStore} title="No shops" hint="Vendor profiles appear here for review." />
          ) : (
            <Table head={["Shop", "Owner", "Printers", "Orders", "Registered", "Status", "Action"]}>
              {data.shop.items.map((s) => (
                <Tr key={s.id}>
                  <Td className="font-semibold text-slate-700">{s.shopName}</Td>
                  <Td className="text-xs text-slate-600">
                    <p>{s.user?.name || s.contactName || "—"}</p>
                    <p className="text-[11px] text-slate-400">{s.mobileNumber || s.user?.email || ""}</p>
                  </Td>
                  <Td className="tabular-nums">{count(s._count.printers)}</Td>
                  <Td className="tabular-nums">{count(s._count.orders)}</Td>
                  <Td className="text-slate-400 text-xs whitespace-nowrap">{dateOnly(s.createdAt)}</Td>
                  <Td><VerifyState verifiedAt={s.verifiedAt} rejectedAt={s.rejectedAt} /></Td>
                  <Td><ActionButtons kind="shop" id={s.id} /></Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>
      ) : tab === "printer" ? (
        <Card>
          {!data || data.printer.items.length === 0 ? (
            <EmptyState icon={LuPrinter} title="No printers" hint="Registered machines appear here for review." />
          ) : (
            <Table head={["Printer", "Shop", "Model", "Serial / IP", "Registered", "Status", "Action"]}>
              {data.printer.items.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <p className="font-semibold text-slate-700">{p.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{p.uniquePrinterId}</p>
                  </Td>
                  <Td className="text-xs text-slate-600">{p.vendor?.shopName || p.shopName}</Td>
                  <Td className="text-xs text-slate-600">{p.brand} {p.model}</Td>
                  <Td className="text-[11px] text-slate-500 font-mono">
                    <p>{p.serialNumber || "no serial"}</p>
                    <p>{p.ipAddress}</p>
                  </Td>
                  <Td className="text-slate-400 text-xs whitespace-nowrap">{dateOnly(p.createdAt)}</Td>
                  <Td><VerifyState verifiedAt={p.verifiedAt} rejectedAt={p.rejectedAt} /></Td>
                  <Td><ActionButtons kind="printer" id={p.id} /></Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>
      ) : (
        <Card>
          {rejected.length === 0 ? (
            <EmptyState icon={LuCircleX} title="Nothing rejected" hint="Checks you turn down appear here." />
          ) : (
            <Table head={["Type", "Name", "Reference", "Note", "Rejected"]}>
              {rejected.map((r, i) => (
                <Tr key={`${r.kind}-${i}`}>
                  <Td><Chip label={r.kind} tint="gray" /></Td>
                  <Td className="font-semibold text-slate-700">{r.name}</Td>
                  <Td className="text-xs text-slate-500 font-mono">{r.ref}</Td>
                  <Td className="text-xs text-slate-500">{r.note || "—"}</Td>
                  <Td className="text-slate-400 text-xs whitespace-nowrap">{dateOnly(r.at)}</Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>
      )}
    </>
  );
}

/**
 * The tab lives in the URL, so this reads `useSearchParams`. Next needs that
 * behind a Suspense boundary or the route can't be prerendered — without it the
 * production build fails outright.
 */
export default function VerificationsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <VerificationsPageBody />
    </Suspense>
  );
}
