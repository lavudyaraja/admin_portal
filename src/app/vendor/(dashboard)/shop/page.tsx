"use client";

// Shop profile: the name and contact details customers see.
//
// Verification status is shown but not editable — a shop cannot verify itself,
// and a field that looks editable but silently ignores you is worse than a
// read-only one that explains who does change it.
import { useCallback, useEffect, useState } from "react";
import {
  LuBuilding, LuSave, LuBadgeCheck, LuCircleAlert, LuPrinter, LuMapPin, LuFileText,
} from "react-icons/lu";
import Link from "next/link";
import { apiFetch } from "@/lib/vendor/api";
import { count, dateOnly } from "@/lib/console/format";
import {
  Card, CardHeader, Skeleton, ErrorState, PageHeader, StatTile, Chip,
} from "@/components/console/primitives";

interface VendorProfile {
  id: string;
  shopName: string;
  contactName: string | null;
  mobileNumber: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  verificationNote: string | null;
  bannedAt: string | null;
  banReason: string | null;
  createdAt: string;
  locations: { id: string; name: string; _count: { printers: number } }[];
  _count: { printers: number; orders: number };
}

const inputCls =
  "w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-400 transition-all";

export default function ShopProfilePage() {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [shopName, setShopName] = useState("");
  const [contactName, setContactName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ vendor: VendorProfile | null }>("/vendors/me");
      setVendor(res.vendor);
      setShopName(res.vendor?.shopName || "");
      setContactName(res.vendor?.contactName || "");
      setMobileNumber(res.vendor?.mobileNumber || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your shop profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    setFormError("");
    setSaved(false);
    try {
      await apiFetch("/vendors/me", {
        method: "PUT",
        body: {
          shopName: shopName.trim(),
          contactName: contactName.trim() || undefined,
          mobileNumber: mobileNumber.trim() || undefined,
        },
      });
      setSaved(true);
      await load();
      // The tick is an acknowledgement, not a state — clear it so it doesn't
      // sit there implying the next edit has been saved too.
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save your changes.");
    }
    setSaving(false);
  }

  const verification = vendor?.bannedAt
    ? { label: "Suspended", tint: "blush" as const, note: vendor.banReason }
    : vendor?.verifiedAt
      ? { label: "Verified", tint: "mint" as const, note: null }
      : vendor?.rejectedAt
        ? { label: "Verification declined", tint: "blush" as const, note: vendor.verificationNote }
        : { label: "Awaiting verification", tint: "gold" as const, note: vendor?.verificationNote };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <PageHeader title="Shop Profile" subtitle="The name and contact details customers see." />

      {loading ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[116px] rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </>
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={load} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatTile
              label="Printers"
              value={count(vendor?._count.printers || 0)}
              icon={LuPrinter}
              tint="sky"
              hint="registered"
            />
            <StatTile
              label="Branches"
              value={count(vendor?.locations.length || 0)}
              icon={LuMapPin}
              tint="lavender"
              hint="locations"
            />
            <StatTile
              label="Orders"
              value={count(vendor?._count.orders || 0)}
              icon={LuFileText}
              tint="mint"
              hint="all time"
            />
          </div>

          {/* Verification is set by platform staff — read-only here. */}
          <Card>
            <div className="flex items-start gap-3 p-5">
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  vendor?.verifiedAt ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                }`}
              >
                {vendor?.verifiedAt ? <LuBadgeCheck size={17} /> : <LuCircleAlert size={17} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-800">Verification</p>
                  <Chip label={verification.label} tint={verification.tint} />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {verification.note ||
                    (vendor?.verifiedAt
                      ? `Verified on ${dateOnly(vendor.verifiedAt)}. Your shop is visible to customers.`
                      : "Platform staff check every shop before it goes live. You can't change this yourself.")}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Details" subtitle="Shown to customers picking a printer." />
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Shop name
                </label>
                <input
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Sai Xerox & Stationery"
                  className={inputCls}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Contact name
                  </label>
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Who to ask for"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Mobile number
                  </label>
                  <input
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="10-digit number"
                    inputMode="tel"
                    className={inputCls}
                  />
                </div>
              </div>

              {formError && <p className="text-xs text-rose-600 font-semibold">{formError}</p>}

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={save}
                  disabled={saving || shopName.trim().length < 2}
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <LuSave size={14} /> {saving ? "Saving…" : "Save changes"}
                </button>
                {saved && (
                  <span className="text-xs font-bold text-emerald-600">Saved</span>
                )}
              </div>
            </div>
          </Card>

          <p className="text-[11px] text-slate-400 px-1">
            Branch names and addresses live on{" "}
            <Link href="/vendor/shop/branches" className="font-semibold hover:underline">
              Branches
            </Link>
            , and opening times on{" "}
            <Link href="/vendor/shop/hours" className="font-semibold hover:underline">
              Operating Hours
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}
