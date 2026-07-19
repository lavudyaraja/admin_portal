"use client";

import { LuHistory } from "react-icons/lu";
import { useList } from "@/lib/console/useList";
import { apiFetch, type TransactionRow } from "@/lib/admin/api";
import { inr2, dateTime } from "@/lib/console/format";
import { ListToolbar, Pagination } from "@/components/console/ListToolbar";
import {
  Card, Table, Td, Tr, Chip, Skeleton, ErrorState, EmptyState, PageHeader, Pill,
} from "@/components/console/primitives";

const TYPES = [
  { value: "CREDIT", label: "Credit" },
  { value: "DEBIT", label: "Debit" },
];

export default function TransactionsPage() {
  const list = useList<TransactionRow>(apiFetch, "/admin/transactions", "transactions", "type");

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Points top-ups and spend across all users."
        action={<Pill n={list.total} />}
      />

      <ListToolbar
        search={list.search}
        setSearch={list.setSearch}
        placeholder="Name or description…"
        filter={list.filter}
        setFilter={list.setFilter}
        filterLabel="types"
        options={TYPES}
      />

      <Card>
        {list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : list.loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : list.rows.length === 0 ? (
          <EmptyState icon={LuHistory} title="No transactions found" hint="Try a different search or filter." />
        ) : (
          <>
            <Table head={["User", "Type", "Description", "Amount", "When"]}>
              {list.rows.map((t) => {
                const credit = t.type === "CREDIT";
                return (
                  <Tr key={t.id}>
                    <Td>
                      <p className="font-semibold text-slate-700 truncate max-w-[150px]">{t.user?.name || "—"}</p>
                      <p className="text-[11px] text-slate-400">{t.user?.phone || ""}</p>
                    </Td>
                    <Td><Chip label={credit ? "Credit" : "Debit"} tint={credit ? "mint" : "peach"} /></Td>
                    <Td className="max-w-[260px] truncate text-xs">{t.description || "—"}</Td>
                    {/* Sign is the encoding here; colour only reinforces it. */}
                    <Td
                      className={`font-bold tabular-nums whitespace-nowrap ${
                        credit ? "text-emerald-600" : "text-slate-800"
                      }`}
                    >
                      {credit ? "+" : "−"}
                      {inr2(Math.abs(t.amountPaise))}
                    </Td>
                    <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(t.createdAt)}</Td>
                  </Tr>
                );
              })}
            </Table>
            <Pagination page={list.page} setPage={list.setPage} total={list.total} />
          </>
        )}
      </Card>
    </>
  );
}
