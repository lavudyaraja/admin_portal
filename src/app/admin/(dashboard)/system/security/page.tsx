"use client";

// Security.
//
// Accounts and banning are real and actionable. Login History, Sessions, IP
// Restrictions and Security Events are not — auth is a stateless JWT with no
// server-side session store, nothing records a sign-in, and no request carries
// an IP anywhere durable. Each says so.

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuShieldCheck, LuStore, LuUsers, LuHistory, LuMonitor,
  LuGlobe, LuTriangleAlert, LuBan, LuCircleCheck, LuRefreshCw, LuSearch,
} from "react-icons/lu";
import { apiFetch } from "@/lib/admin/api";
import { count, dateOnly, dateTime } from "@/lib/console/format";
import { OpsTabs, useOpsTab, NoRecord, type OpsTab } from "@/components/admin/OpsTabs";
import { StatRow } from "@/components/admin/StatRow";
import {
  Card, Table, Td, Tr, Chip, Skeleton, ErrorState, EmptyState, PageHeader, StatTile,
} from "@/components/console/primitives";

interface Account {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  bannedAt: string | null;
  banReason: string | null;
  loginAlertSent: boolean;
  authMethod: string;
  vendor: { id: string; shopName: string } | null;
}

interface SecurityData {
  admins: number;
  vendors: number;
  students: number;
  banned: number;
  passwordAccounts: number;
  googleOnlyAccounts: number;
  accounts: Account[];
}

function SecurityPageBody() {
  const tab = useOpsTab("admins");
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<SecurityData>("/system/security"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleBan(a: Account) {
    const banning = !a.bannedAt;
    if (banning) {
      const reason = window.prompt(`Ban ${a.name}? They won't be able to sign in.\n\nReason (shown to them):`);
      if (reason === null) return;
      setBusy(a.id);
      try {
        await apiFetch(`/system/security/accounts/${a.id}/ban`, { method: "PATCH", body: { banned: true, reason } });
        await load();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not ban that account.");
      }
    } else {
      setBusy(a.id);
      try {
        await apiFetch(`/system/security/accounts/${a.id}/ban`, { method: "PATCH", body: { banned: false } });
        await load();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not lift that ban.");
      }
    }
    setBusy(null);
  }

  const rows = useMemo(() => {
    const all = data?.accounts || [];
    const q = search.trim().toLowerCase();
    const filtered = all.filter((a) => !q || [a.name, a.email, a.phone].some((f) => (f || "").toLowerCase().includes(q)));
    switch (tab) {
      case "admins": return filtered.filter((a) => a.role === "ADMIN");
      case "vendors": return filtered.filter((a) => a.role === "VENDOR" || a.role === "OPERATOR");
      case "users": return filtered.filter((a) => a.role === "STUDENT");
      default: return filtered;
    }
  }, [data, tab, search]);

  const tabs: OpsTab[] = [
    { id: "admins", label: "Admin Accounts", icon: LuShieldCheck, count: data?.admins },
    { id: "vendors", label: "Vendor Accounts", icon: LuStore, count: data?.vendors },
    { id: "users", label: "User Accounts", icon: LuUsers, count: data?.students },
    { id: "logins", label: "Login History", icon: LuHistory },
    { id: "sessions", label: "Sessions", icon: LuMonitor },
    { id: "ip", label: "IP Restrictions", icon: LuGlobe },
    { id: "events", label: "Security Events", icon: LuTriangleAlert },
  ];

  const isAccountTab = tab === "admins" || tab === "vendors" || tab === "users";

  return (
    <>
      <PageHeader
        title="Security"
        subtitle="Who can sign in, how they authenticate, and who is locked out."
        action={
          <button onClick={load} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer">
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      <StatRow loading={!data}>
        {data && (
          <>
            <StatTile label="Operators" value={count(data.admins)} icon={LuShieldCheck} tint="lavender" hint="full platform access" />
            <StatTile label="Vendors" value={count(data.vendors)} icon={LuStore} tint="sky" hint="shop owners" />
            <StatTile label="Banned" value={count(data.banned)} icon={LuBan} tint={data.banned > 0 ? "blush" : "gray"} hint="cannot sign in" />
            <StatTile label="Google-only" value={count(data.googleOnlyAccounts)} icon={LuCircleCheck} tint="mint" hint={`${count(data.passwordAccounts)} with a password`} />
          </>
        )}
      </StatRow>

      <OpsTabs tabs={tabs} active={tab} basePath="/admin/system/security" />

      {tab === "logins" ? (
        <NoRecord
          icon={LuHistory}
          title="Sign-ins aren't recorded"
          needs="Nothing writes a row when someone logs in. The account carries a single loginAlertSent flag so the first-login email is sent once — that is the whole of it. There is no time, device, IP or outcome for any sign-in, successful or failed."
        />
      ) : tab === "sessions" ? (
        <NoRecord
          icon={LuMonitor}
          title="There are no sessions to manage"
          needs="Auth is a stateless JWT: the server issues a token and never stores it, so there is no list of active sessions and no way to revoke one. Signing someone out everywhere would need a session store or a token denylist."
        />
      ) : tab === "ip" ? (
        <NoRecord
          icon={LuGlobe}
          title="No IP controls"
          needs="No allowlist, blocklist or geo rule exists, and request IPs aren't stored anywhere. The only related thing in place is rate limiting on the auth routes, which is per-IP but keeps no record."
        />
      ) : tab === "events" ? (
        <NoRecord
          icon={LuTriangleAlert}
          title="Security events aren't tracked"
          needs="Failed logins, password changes, permission changes and lockouts leave no trace. Banning does set a timestamp and reason on the account, but that's a field, not an event stream. This needs a security event log."
        />
      ) : (
        <>
          <div className="relative flex-1 min-w-[200px] max-w-sm mb-4">
            <LuSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email or phone…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-slate-400 transition-colors"
            />
          </div>

          <Card>
            {error ? (
              <ErrorState message={error} onRetry={load} />
            ) : loading || !data ? (
              <div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : rows.length === 0 ? (
              <EmptyState icon={LuUsers} title="No accounts here" hint={search ? "Try a different search." : "Accounts of this type will appear here."} />
            ) : (
              <Table head={["Account", "Contact", "Signs in with", "Joined", "Status", "Action"]}>
                {rows.map((a) => (
                  <Tr key={a.id}>
                    <Td>
                      <Link href={`/admin/management/users/${a.id}`} className="font-semibold text-slate-700 hover:underline">{a.name}</Link>
                      {a.vendor && <p className="text-[11px] text-slate-400">{a.vendor.shopName}</p>}
                    </Td>
                    <Td className="text-xs text-slate-600">
                      <p>{a.phone || "—"}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{a.email || ""}</p>
                    </Td>
                    <Td><Chip label={a.authMethod} tint={a.authMethod === "Google" ? "sky" : a.authMethod === "None" ? "blush" : "lavender"} /></Td>
                    <Td className="text-slate-400 text-xs whitespace-nowrap">{dateOnly(a.createdAt)}</Td>
                    <Td>
                      {a.bannedAt ? (
                        <>
                          <Chip label="Banned" tint="blush" />
                          <p className="text-[10px] text-slate-400 mt-1">{dateTime(a.bannedAt)}</p>
                          {a.banReason && <p className="text-[10px] text-rose-600">{a.banReason}</p>}
                        </>
                      ) : (
                        <Chip label="Active" tint="mint" />
                      )}
                    </Td>
                    <Td>
                      <button
                        onClick={() => toggleBan(a)}
                        disabled={busy === a.id}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold rounded-lg px-2 py-1 border transition-colors cursor-pointer disabled:opacity-40 ${
                          a.bannedAt
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                            : "text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100"
                        }`}
                      >
                        {a.bannedAt ? <><LuCircleCheck size={11} /> Lift ban</> : <><LuBan size={11} /> Ban</>}
                      </button>
                    </Td>
                  </Tr>
                ))}
              </Table>
            )}
            <p className="px-5 py-3 text-[11px] text-slate-400 border-t border-slate-100">
              Banning blocks sign-in. It never touches a points balance, an order or a payout — a
              banned shop&apos;s customers still need their prints and their refunds.
            </p>
          </Card>
        </>
      )}
    </>
  );
}

export default function SecurityPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <SecurityPageBody />
    </Suspense>
  );
}
