"use client";

// One user, in full.
//
// Every section is fed from a single GET /admin/users/:id, so switching tabs is
// instant and doesn't re-hit the network. The tab lives in the URL (?tab=) so a
// particular view of a particular user can be linked to and survives a reload.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  LuArrowLeft, LuUser, LuCoins, LuHistory, LuFileText,
  LuUndo2, LuGift, LuPrinter, LuLifeBuoy, LuClock, LuStar,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import { apiFetch, type UserProfile } from "@/lib/admin/api";
import { Card, Skeleton, ErrorState, PageHeader, Chip } from "@/components/console/primitives";
import {
  ProfileSection, PointsSection, TransactionsSection, OrdersSection,
  RefundsSection, ReferralsSection, PrintersSection, SupportSection, ActivitySection,
  RatingsSection,
} from "@/components/admin/users/sections";

const TABS: { id: string; label: string; icon: IconType }[] = [
  { id: "profile", label: "Profile", icon: LuUser },
  { id: "points", label: "Points", icon: LuCoins },
  { id: "transactions", label: "Transactions", icon: LuHistory },
  { id: "orders", label: "Orders", icon: LuFileText },
  { id: "refunds", label: "Refunds", icon: LuUndo2 },
  { id: "referrals", label: "Referrals", icon: LuGift },
  { id: "printers", label: "Saved Printers", icon: LuPrinter },
  { id: "ratings", label: "Ratings", icon: LuStar },
  { id: "support", label: "Support History", icon: LuLifeBuoy },
  { id: "activity", label: "Activity", icon: LuClock },
];

function UserProfilePageBody() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get("tab") || "profile";

  const [data, setData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<UserProfile>(`/admin/users/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function selectTab(next: string) {
    // replace, not push — flipping through tabs shouldn't fill the back button.
    router.replace(`/admin/management/users/${id}?tab=${next}`, { scroll: false });
  }

  if (error) {
    return (
      <Card>
        <ErrorState message={error} onRetry={load} />
      </Card>
    );
  }

  return (
    <>
      <Link
        href="/admin/management/users"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3"
      >
        <LuArrowLeft size={14} /> All users
      </Link>

      <PageHeader
        title={loading ? "Loading…" : data?.user.name || "User"}
        subtitle={
          data
            ? [data.user.phone, data.user.email].filter(Boolean).join(" · ") || "No contact on file"
            : undefined
        }
        action={
          data ? (
            <div className="flex items-center gap-2">
              {data.user.bannedAt && <Chip label="Banned" tint="blush" />}
              <Chip label={data.user.role} tint={data.user.role === "STUDENT" ? "sky" : "lavender"} />
            </div>
          ) : undefined
        }
      />

      {/* Tabs — horizontally scrollable so nine of them survive a narrow window. */}
      <div className="mb-4 -mx-1 overflow-x-auto">
        <div className="flex gap-1 px-1 min-w-max border-b border-slate-200">
          {TABS.map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => selectTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
                  active
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon size={15} className={active ? "text-slate-700" : "text-slate-400"} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading || !data ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[116px] rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <>
          {tab === "profile" && <ProfileSection data={data} />}
          {tab === "points" && <PointsSection data={data} />}
          {tab === "transactions" && <TransactionsSection data={data} />}
          {tab === "orders" && <OrdersSection data={data} />}
          {tab === "refunds" && <RefundsSection data={data} />}
          {tab === "referrals" && <ReferralsSection data={data} />}
          {tab === "printers" && <PrintersSection data={data} />}
          {tab === "ratings" && <RatingsSection data={data} />}
          {tab === "support" && <SupportSection data={data} />}
          {tab === "activity" && <ActivitySection data={data} />}
        </>
      )}
    </>
  );
}

/**
 * The tab lives in the URL, so this reads `useSearchParams`. Next needs that
 * behind a Suspense boundary or the route can't be prerendered — without it the
 * production build fails outright.
 */
export default function UserProfilePage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <UserProfilePageBody />
    </Suspense>
  );
}
