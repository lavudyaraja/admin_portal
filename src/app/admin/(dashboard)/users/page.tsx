"use client";

import { LuUsers } from "react-icons/lu";
import { useList } from "@/lib/console/useList";
import { apiFetch, type UserRow } from "@/lib/admin/api";
import { inr, dateOnly, count } from "@/lib/console/format";
import { ListToolbar, Pagination } from "@/components/console/ListToolbar";
import {
  Card, Table, Td, Tr, Chip, Skeleton, ErrorState, EmptyState, PageHeader, Pill,
} from "@/components/console/primitives";
import type { TintName } from "@/lib/console/theme";

const ROLES = [
  { value: "STUDENT", label: "Student" },
  { value: "OPERATOR", label: "Vendor" },
  { value: "ADMIN", label: "Operator" },
];

const ROLE_TINT: Record<string, TintName> = {
  STUDENT: "sky",
  OPERATOR: "mint",
  ADMIN: "lavender",
};

/** The DB role names don't match what the business calls them. */
const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Student",
  OPERATOR: "Vendor",
  ADMIN: "Operator",
};

export default function UsersPage() {
  const list = useList<UserRow>(apiFetch, "/admin/users", "users", "role");

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Everyone with a Prinsta account."
        action={<Pill n={list.total} />}
      />

      <ListToolbar
        search={list.search}
        setSearch={list.setSearch}
        placeholder="Name, phone or email…"
        filter={list.filter}
        setFilter={list.setFilter}
        filterLabel="roles"
        options={ROLES}
      />

      <Card>
        {list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : list.loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : list.rows.length === 0 ? (
          <EmptyState icon={LuUsers} title="No users found" hint="Try a different search or filter." />
        ) : (
          <>
            <Table head={["Name", "Contact", "Role", "Orders", "Points", "Joined"]}>
              {list.rows.map((u) => (
                <Tr key={u.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                        {u.name?.[0]?.toUpperCase() || "?"}
                      </span>
                      <span className="font-semibold text-slate-700 truncate max-w-[150px]">{u.name}</span>
                    </div>
                  </Td>
                  <Td>
                    <p className="text-xs">{u.phone || "—"}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{u.email || ""}</p>
                  </Td>
                  <Td><Chip label={ROLE_LABEL[u.role] || u.role} tint={ROLE_TINT[u.role] || "gray"} /></Td>
                  <Td className="tabular-nums">{count(u._count?.orders ?? 0)}</Td>
                  <Td className="font-bold text-slate-800 tabular-nums whitespace-nowrap">
                    {inr(u.pointsBalancePaise)}
                  </Td>
                  <Td className="text-slate-400 text-xs whitespace-nowrap">{dateOnly(u.createdAt)}</Td>
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
