"use client";

// Referral activity across the platform.
//
// Only accounts that have actually invited someone are listed — every user has
// a code, so listing all of them would just be the user directory again.
// Rewards are paid when an invitee's *first print completes*, so "invited" and
// "converted" are deliberately separate columns: the gap between them is the
// number worth watching.

import { Fragment, useCallback, useEffect, useState } from "react";
import { LuGift, LuSearch, LuUsers, LuCircleCheck, LuClock, LuCoins } from "react-icons/lu";
import { apiFetch } from "@/lib/admin/api";
import { count, points, dateOnly } from "@/lib/console/format";
import {
  Card, Table, Td, Tr, Skeleton, ErrorState, EmptyState, PageHeader, Pill, StatTile,
} from "@/components/console/primitives";

interface Invitee {
  id: string;
  name: string;
  joinedAt: string;
  rewarded: boolean;
}

interface Referrer {
  id: string;
  name: string;
  contact: string;
  code: string | null;
  joinedAt: string;
  invited: number;
  converted: number;
  invitees: Invitee[];
}

interface ReferralData {
  totalReferrers: number;
  totalReferred: number;
  rewarded: number;
  pending: number;
  referrerPoints: number;
  refereePoints: number;
  pointsPaidOut: number;
  referrers: Referrer[];
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<ReferralData>("/admin/referrals"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const rows = (data?.referrers || []).filter(
    (r) =>
      !q ||
      [r.name, r.contact, r.code].some((f) => (f || "").toLowerCase().includes(q))
  );

  return (
    <>
      <PageHeader
        title="Referrals"
        subtitle="Who is bringing new users in, and what it has cost in points."
        action={data ? <Pill n={data.totalReferrers} /> : undefined}
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {!data ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[116px] rounded-2xl" />)
        ) : (
          <>
            <StatTile
              label="Referrers"
              value={count(data.totalReferrers)}
              icon={LuUsers}
              tint="lavender"
              hint="accounts that invited someone"
            />
            <StatTile
              label="Signed up"
              value={count(data.totalReferred)}
              icon={LuGift}
              tint="sky"
              hint="joined with a code"
            />
            <StatTile
              label="Converted"
              value={count(data.rewarded)}
              icon={LuCircleCheck}
              tint="mint"
              hint={`${data.pending} yet to print`}
            />
            <StatTile
              label="Points paid out"
              value={points(data.pointsPaidOut)}
              icon={LuCoins}
              tint="gold"
              hint={`${data.referrerPoints} + ${data.refereePoints} per conversion`}
            />
          </>
        )}
      </section>

      <div className="relative flex-1 min-w-[200px] max-w-sm mb-4">
        <LuSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, contact or code…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-slate-400 transition-colors"
        />
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
            icon={LuGift}
            title="No referrals yet"
            hint="Once someone shares their code and a friend joins, they'll appear here."
          />
        ) : (
          <Table head={["Referrer", "Code", "Invited", "Converted", "Earned", "Joined"]}>
            {rows.map((r) => (
              <Fragment key={r.id}>
                <Tr>
                  <Td>
                    <button
                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                      className="text-left cursor-pointer"
                    >
                      <p className="font-semibold text-slate-700">{r.name}</p>
                      <p className="text-[11px] text-slate-400">{r.contact}</p>
                    </button>
                  </Td>
                  <Td className="font-mono text-xs text-slate-600">{r.code || "—"}</Td>
                  <Td className="tabular-nums">{count(r.invited)}</Td>
                  <Td className="tabular-nums">
                    <span className={r.converted > 0 ? "text-emerald-600 font-bold" : "text-slate-400"}>
                      {count(r.converted)}
                    </span>
                  </Td>
                  <Td className="tabular-nums font-semibold text-slate-700">
                    {points(r.converted * (data?.referrerPoints || 0))}
                  </Td>
                  <Td className="text-slate-400 text-xs whitespace-nowrap">{dateOnly(r.joinedAt)}</Td>
                </Tr>

                {expanded === r.id &&
                  r.invitees.map((i) => (
                    <Tr key={i.id}>
                      <Td className="pl-8 text-slate-500 text-xs">↳ {i.name}</Td>
                      <Td className="text-[11px] text-slate-400">invited</Td>
                      <Td colSpan={2} className="text-[11px]">
                        {i.rewarded ? (
                          <span className="text-emerald-600 font-semibold">Printed · rewarded</span>
                        ) : (
                          <span className="text-slate-400 inline-flex items-center gap-1">
                            <LuClock size={11} /> Yet to print
                          </span>
                        )}
                      </Td>
                      <Td />
                      <Td className="text-slate-400 text-xs whitespace-nowrap">{dateOnly(i.joinedAt)}</Td>
                    </Tr>
                  ))}
              </Fragment>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
