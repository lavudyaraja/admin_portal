"use client";

import { LuInbox } from "react-icons/lu";
import { useList } from "@/lib/console/useList";
import { apiFetch, type OrderRow } from "@/lib/admin/api";
import { inr, dateTime, count } from "@/lib/console/format";
import { ListToolbar, Pagination } from "@/components/console/ListToolbar";
import {
  Card, Table, Td, Tr, StatusChip, Skeleton, ErrorState, EmptyState, PageHeader, Pill,
} from "@/components/console/primitives";

const STATUSES = [
  "PENDING_PAYMENT", "PAID", "QUEUED", "PRINTING", "COMPLETED", "FAILED", "CANCELLED",
].map((s) => ({ value: s, label: s.replace(/_/g, " ") }));

export default function OrdersPage() {
  const list = useList<OrderRow>(apiFetch, "/admin/orders", "orders", "status");

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Every print job across the network."
        action={<Pill n={list.total} />}
      />

      <ListToolbar
        search={list.search}
        setSearch={list.setSearch}
        placeholder="Order code, name or phone…"
        filter={list.filter}
        setFilter={list.setFilter}
        filterLabel="statuses"
        options={STATUSES}
      />

      <Card>
        {list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : list.loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : list.rows.length === 0 ? (
          <EmptyState icon={LuInbox} title="No orders found" hint="Try a different search or filter." />
        ) : (
          <>
            <Table head={["Order", "Customer", "Printer", "Pages", "Amount", "Status", "Placed"]}>
              {list.rows.map((o) => (
                <Tr key={o.id}>
                  <Td>
                    <p className="font-bold text-slate-800 whitespace-nowrap">{o.orderCode}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[160px]">
                      {o.document?.fileName || "—"}
                    </p>
                  </Td>
                  <Td>
                    <p className="font-semibold text-slate-700 truncate max-w-[140px]">{o.user?.name || "—"}</p>
                    <p className="text-[11px] text-slate-400">{o.user?.phone || ""}</p>
                  </Td>
                  <Td>
                    <p className="truncate max-w-[150px]">{o.printer?.name || "Unassigned"}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{o.printer?.shopName || ""}</p>
                  </Td>
                  <Td className="tabular-nums">
                    {count(o.pagesToPrint)}
                    <span className="text-[11px] text-slate-400 ml-1">{o.colorMode === "COLOR" ? "clr" : "b&w"}</span>
                  </Td>
                  <Td className="font-bold text-slate-800 tabular-nums whitespace-nowrap">{inr(o.costPaise)}</Td>
                  <Td><StatusChip status={o.status} /></Td>
                  <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(o.createdAt)}</Td>
                </Tr>
              ))}
            </Table>
            <Pagination page={list.page} setPage={list.setPage} total={list.total} />
          </>
        )}
      </Card>
    </>
  );
}
