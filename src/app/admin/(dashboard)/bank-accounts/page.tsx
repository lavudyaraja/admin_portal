"use client";

// Payout accounts across the platform.
//
// Read-only on purpose. An operator needs to see whose account is on file and
// whether it has been verified before a payout goes out; nothing here should be
// able to change where money lands. The account number arrives already masked
// from the API — the full number never leaves the server.

import { useCallback, useEffect, useMemo, useState } from "react";
import { LuBanknote, LuSearch, LuCircleCheck, LuClock, LuStore } from "react-icons/lu";
import { apiFetch, type BankAccountsResponse, type BankAccountRow } from "@/lib/admin/api";
import { count, dateOnly } from "@/lib/console/format";
import { StatRow } from "@/components/admin/StatRow";
import {
  Card, Table, Td, Tr, Skeleton, ErrorState, EmptyState, PageHeader, Pill, StatTile,
} from "@/components/console/primitives";

export default function BankAccountsPage() {
  const [data, setData] = useState<BankAccountsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [onlyUnverified, setOnlyUnverified] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<BankAccountsResponse>("/admin/bank-accounts"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.accounts || []).filter((a: BankAccountRow) => {
      if (onlyUnverified && a.verified) return false;
      if (!q) return true;
      return [a.accountHolder, a.ownerName, a.shopName, a.bankName, a.ifsc, a.upiId, a.accountLast4]
        .some((f) => (f || "").toLowerCase().includes(q));
    });
  }, [data, search, onlyUnverified]);

  return (
    <>
      <PageHeader
        title="Bank Accounts"
        subtitle="Payout destinations on file, and their verification state."
        action={data ? <Pill n={data.total} /> : undefined}
      />

      <StatRow loading={!data}>
        {data && (
          <>
            <StatTile
              label="Accounts on file"
              value={count(data.total)}
              icon={LuBanknote}
              tint="lavender"
              hint="one per account holder"
            />
            <StatTile
              label="Verified"
              value={count(data.verified)}
              icon={LuCircleCheck}
              tint="mint"
              hint="ready for payout"
            />
            <StatTile
              label="Awaiting checks"
              value={count(data.unverified)}
              icon={LuClock}
              tint={data.unverified > 0 ? "gold" : "gray"}
              hint="not yet verified"
            />
            <StatTile
              label="With a shop"
              value={count(data.accounts.filter((a) => a.shopName).length)}
              icon={LuStore}
              tint="sky"
              hint="linked to a vendor profile"
            />
          </>
        )}
      </StatRow>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <LuSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Holder, shop, bank, IFSC or last 4…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-slate-400 transition-colors"
          />
        </div>
        <button
          onClick={() => setOnlyUnverified((v) => !v)}
          className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
            onlyUnverified
              ? "border-amber-300 bg-amber-50 text-amber-700"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          Unverified only
        </button>
      </div>

      <Card>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={LuBanknote}
            title="No payout accounts"
            hint={
              search || onlyUnverified
                ? "Try a different search or clear the filter."
                : "Accounts appear here once a vendor adds their payout details."
            }
          />
        ) : (
          <Table head={["Account holder", "Owner", "Account", "Bank", "UPI", "Status", "Updated"]}>
            {rows.map((a) => (
              <Tr key={a.id}>
                <Td>
                  <p className="font-semibold text-slate-700 truncate max-w-[160px]">{a.accountHolder}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{a.ifsc}</p>
                </Td>
                <Td>
                  <p className="truncate max-w-[150px]">{a.shopName || a.ownerName}</p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{a.ownerContact}</p>
                </Td>
                <Td className="font-mono text-xs text-slate-600">{a.accountMasked}</Td>
                <Td className="text-xs">
                  <p className="text-slate-600">{a.bankName || "—"}</p>
                  {a.branch && <p className="text-[11px] text-slate-400">{a.branch}</p>}
                </Td>
                <Td className="text-xs text-slate-600">{a.upiId || "—"}</Td>
                <Td>
                  {a.verified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                      <LuCircleCheck size={11} /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                      <LuClock size={11} /> Pending
                    </span>
                  )}
                </Td>
                <Td className="text-slate-400 text-xs whitespace-nowrap">{dateOnly(a.updatedAt)}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
