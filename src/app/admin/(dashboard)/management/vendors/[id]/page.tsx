"use client";

// One vendor, in full. Same shape as the user record: a single
// GET /admin/vendors/:id feeds every tab, and the tab lives in the URL.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  LuArrowLeft, LuStore, LuBuilding, LuPrinter, LuFileText, LuIndianRupee,
  LuPercent, LuBanknote, LuWallet, LuScale, LuFileCheck, LuStar, LuClock,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import { apiFetch, type VendorProfile } from "@/lib/admin/api";
import { Card, Skeleton, ErrorState, PageHeader, Chip } from "@/components/console/primitives";
import {
  VendorProfileSection, ShopDetailsSection, VendorPrintersSection, VendorOrdersSection,
  VendorRevenueSection, VendorBankSection, VendorActivitySection, NotBuilt,
} from "@/components/admin/vendors/sections";

const TABS: { id: string; label: string; icon: IconType }[] = [
  { id: "profile", label: "Vendor Profile", icon: LuStore },
  { id: "shop", label: "Shop Details", icon: LuBuilding },
  { id: "printers", label: "Printers", icon: LuPrinter },
  { id: "orders", label: "Orders", icon: LuFileText },
  { id: "revenue", label: "Revenue", icon: LuIndianRupee },
  { id: "commission", label: "Commission", icon: LuPercent },
  { id: "bank", label: "Bank Accounts", icon: LuBanknote },
  { id: "payouts", label: "Payout History", icon: LuWallet },
  { id: "settlements", label: "Settlements", icon: LuScale },
  { id: "kyc", label: "KYC Documents", icon: LuFileCheck },
  { id: "reviews", label: "Reviews", icon: LuStar },
  { id: "activity", label: "Activity Logs", icon: LuClock },
];

function VendorProfilePageBody() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get("tab") || "profile";

  const [data, setData] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<VendorProfile>(`/admin/vendors/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return <Card><ErrorState message={error} onRetry={load} /></Card>;
  }

  return (
    <>
      <Link
        href="/admin/management/vendors"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3"
      >
        <LuArrowLeft size={14} /> All vendors
      </Link>

      <PageHeader
        title={loading ? "Loading…" : data?.vendor.shopName || "Vendor"}
        subtitle={
          data
            ? [data.vendor.user?.name, data.vendor.user?.phone || data.vendor.mobileNumber]
                .filter(Boolean)
                .join(" · ") || "No contact on file"
            : undefined
        }
        action={data?.vendor.bannedAt ? <Chip label="Banned" tint="blush" /> : undefined}
      />

      <div className="mb-4 -mx-1 overflow-x-auto">
        <div className="flex gap-1 px-1 min-w-max border-b border-slate-200">
          {TABS.map((t) => {
            const on = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => router.replace(`/admin/management/vendors/${id}?tab=${t.id}`, { scroll: false })}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
                  on ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon size={15} className={on ? "text-slate-700" : "text-slate-400"} />
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
          {tab === "profile" && <VendorProfileSection data={data} />}
          {tab === "shop" && <ShopDetailsSection data={data} />}
          {tab === "printers" && <VendorPrintersSection data={data} />}
          {tab === "orders" && <VendorOrdersSection data={data} />}
          {tab === "revenue" && <VendorRevenueSection data={data} />}
          {tab === "bank" && <VendorBankSection data={data} />}
          {tab === "activity" && <VendorActivitySection data={data} />}

          {/* The five with no model behind them. */}
          {tab === "commission" && (
            <NotBuilt
              icon={LuPercent}
              title="Commission isn't set up yet"
              needs="Nothing defines a platform cut — there is no commission rate on a vendor or a printer, and no record of what has been charged. That needs a rate and a ledger before this can show a real number."
            />
          )}
          {tab === "payouts" && (
            <NotBuilt
              icon={LuWallet}
              title="No payout history"
              needs="Payouts aren't recorded anywhere. The vendor's bank details are on file, but no money movement is tracked — that needs a payout record with amount, date and reference."
            />
          )}
          {tab === "settlements" && (
            <NotBuilt
              icon={LuScale}
              title="Settlements aren't tracked"
              needs="A settlement is a period's takings less commission, marked paid. It needs both a commission rate and payout records first."
            />
          )}
          {tab === "kyc" && (
            <NotBuilt
              icon={LuFileCheck}
              title="No KYC documents"
              needs="Nothing collects or stores identity documents. The bank account has a verified flag, but no document is attached to it — this needs a KYC upload and review flow."
            />
          )}
          {tab === "reviews" && (
            <NotBuilt
              icon={LuStar}
              title="Reviews don't exist yet"
              needs="Users can report a problem, but they can't rate a shop or a printer. This needs a rating on completed orders before there is anything to show."
            />
          )}
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
export default function VendorProfilePage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <VendorProfilePageBody />
    </Suspense>
  );
}
