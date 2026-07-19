"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/vendor/api";
import { inr, dateOnly } from "@/lib/console/format";
import { Select } from "@/components/vendor/settings/fields";

interface AdminListUser {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: "STUDENT" | "OPERATOR" | "ADMIN";
  pointsBalancePaise: number;
  createdAt: string;
  _count: { orders: number };
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-orange-100 text-orange-700 border-orange-200",
  OPERATOR: "bg-violet-100 text-violet-700 border-violet-200",
  STUDENT: "bg-blue-100 text-blue-700 border-blue-200",
};

export default function UsersPage() {
  const [users, setUsers] = useState<AdminListUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search) params.set("search", search);
      if (role) params.set("role", role);
      const res = await apiFetch<{ users: AdminListUser[]; total: number }>(`/admin/users?${params}`);
      setUsers(res.users);
      setTotal(res.total);
    } catch {}
    setLoading(false);
  }, [search, role]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-black text-zinc-900">Users</h2>
        <p className="text-zinc-400 text-sm">{total} registered users</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search name, phone, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 h-10 px-4 text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
        <Select
          value={role}
          onChange={setRole}
          options={[
            { value: "", label: "All Roles" },
            { value: "STUDENT", label: "Student" },
            { value: "OPERATOR", label: "Operator" },
            { value: "ADMIN", label: "Admin" },
          ]}
        />
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-sm">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-4xl mb-3">☺</p>
            <p className="text-zinc-800 font-bold">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  {["User", "Contact", "Role", "Points", "Orders", "Joined"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                          {u.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <p className="font-semibold text-zinc-900">{u.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-zinc-600">
                      <p>{u.phone || "—"}</p>
                      <p className="text-zinc-400">{u.email || ""}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full border ${roleColors[u.role]}`}>{u.role}</span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-zinc-900">{inr(u.pointsBalancePaise)}</td>
                    <td className="px-5 py-4 font-medium text-zinc-700">{u._count.orders}</td>
                    <td className="px-5 py-4 text-xs text-zinc-500 whitespace-nowrap">{dateOnly(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
