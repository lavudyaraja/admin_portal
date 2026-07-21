"use client";

// KYC & verification for the shop.
//
// The shop enters who it is — legal name and its PAN/Aadhaar/GST numbers — and
// submits for review. Submitting puts it "under review"; an admin approving it
// on the platform's verifications queue is the same act as verifying the shop.
// The bank account already on file is the "bank proof" leg, so it's shown here
// and required before KYC can be sent.
import { useCallback, useEffect, useState } from "react";
import { LuBadgeCheck, LuClock, LuCircleAlert, LuRefreshCw, LuBanknote, LuArrowRight } from "react-icons/lu";
import Link from "next/link";
import { apiFetch } from "@/lib/vendor/api";
import { Card, Skeleton, ErrorState, PageHeader, Chip } from "@/components/console/primitives";

type KycStatus = "VERIFIED" | "REJECTED" | "UNDER_REVIEW" | "NOT_SUBMITTED";

interface Kyc {
  status: KycStatus;
  legalName: string | null;
  panNumber: string | null;
  aadhaarNumber: string | null;
  gstin: string | null;
  note: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  bank: { accountHolder: string; last4: string; ifsc: string; bankName: string | null; verified: boolean } | null;
}

const STATUS_META: Record<KycStatus, { label: string; tint: "mint" | "gold" | "blush" | "gray"; icon: typeof LuBadgeCheck }> = {
  VERIFIED: { label: "Verified", tint: "mint", icon: LuBadgeCheck },
  UNDER_REVIEW: { label: "Under review", tint: "gold", icon: LuClock },
  REJECTED: { label: "Not approved", tint: "blush", icon: LuCircleAlert },
  NOT_SUBMITTED: { label: "Not submitted", tint: "gray", icon: LuCircleAlert },
};

const inputCls =
  "w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 transition-all uppercase";

export default function KycPage() {
  const [kyc, setKyc] = useState<Kyc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [legalName, setLegalName] = useState("");
  const [pan, setPan] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [gstin, setGstin] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<Kyc>("/vendors/me/kyc");
      setKyc(res);
      setLegalName(res.legalName || "");
      setPan(res.panNumber || "");
      setAadhaar(res.aadhaarNumber || "");
      setGstin(res.gstin || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your KYC.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    setSaving(true);
    setSaveError("");
    try {
      await apiFetch("/vendors/me/kyc", {
        method: "PUT",
        body: { legalName, panNumber: pan, aadhaarNumber: aadhaar, gstin },
      });
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not submit your KYC.");
    } finally {
      setSaving(false);
    }
  }

  const meta = kyc ? STATUS_META[kyc.status] : null;
  const locked = kyc?.status === "VERIFIED" || kyc?.status === "UNDER_REVIEW";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <PageHeader title="KYC & Verification" subtitle="Verify who your shop is, so the platform can pay you." />

      {loading ? (
        <>
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </>
      ) : error || !kyc ? (
        <Card>
          <ErrorState message={error || "Could not load."} onRetry={load} />
        </Card>
      ) : (
        <>
          {/* ── Status ── */}
          <Card>
            <div className="flex items-start gap-3 p-5">
              <span
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  kyc.status === "VERIFIED"
                    ? "bg-emerald-50 text-emerald-600"
                    : kyc.status === "UNDER_REVIEW"
                      ? "bg-amber-50 text-amber-600"
                      : kyc.status === "REJECTED"
                        ? "bg-rose-50 text-rose-600"
                        : "bg-slate-100 text-slate-500"
                }`}
              >
                {meta && <meta.icon size={20} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900">KYC status</h2>
                  {meta && <Chip label={meta.label} tint={meta.tint} />}
                </div>
                <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
                  {kyc.status === "VERIFIED"
                    ? "Your shop is verified. You're set to take orders and receive payouts."
                    : kyc.status === "UNDER_REVIEW"
                      ? "Your details are with our team. We'll notify you once they're reviewed."
                      : kyc.status === "REJECTED"
                        ? kyc.note || "Your KYC wasn't approved. Please check your details and resubmit."
                        : "Submit your details below to get verified."}
                </p>
              </div>
            </div>
          </Card>

          {/* ── Bank proof ── */}
          <Card>
            <div className="flex items-center gap-3 p-5">
              <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                <LuBanknote size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">Bank proof</p>
                {kyc.bank ? (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {kyc.bank.accountHolder} · {kyc.bank.bankName || "Bank"} ••{kyc.bank.last4} · {kyc.bank.ifsc}
                    {kyc.bank.verified ? " · verified" : ""}
                  </p>
                ) : (
                  <p className="text-xs text-rose-600 mt-0.5">
                    No bank account on file — it&apos;s required for KYC.
                  </p>
                )}
              </div>
              {!kyc.bank && (
                <Link
                  href="/vendor/bank-account"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:underline shrink-0"
                >
                  Add <LuArrowRight size={12} />
                </Link>
              )}
            </div>
          </Card>

          {/* ── Details form ── */}
          <Card>
            <div className="p-5 space-y-4">
              <Field label="Legal name (as on PAN)">
                <input
                  className={inputCls.replace(" uppercase", "")}
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Full legal name"
                  disabled={locked}
                />
              </Field>
              <Field label="PAN">
                <input
                  className={inputCls}
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  disabled={locked}
                />
              </Field>
              <Field label="Aadhaar number">
                <input
                  className={inputCls.replace(" uppercase", "")}
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="12-digit Aadhaar"
                  maxLength={12}
                  inputMode="numeric"
                  disabled={locked}
                />
              </Field>
              <Field label="GSTIN (optional)">
                <input
                  className={inputCls}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="15-character GSTIN, if registered"
                  maxLength={15}
                  disabled={locked}
                />
              </Field>

              {saveError && <p className="text-xs text-rose-600 font-semibold">{saveError}</p>}

              {locked ? (
                <p className="text-xs text-slate-400">
                  {kyc.status === "VERIFIED"
                    ? "Your KYC is verified. Contact support if any detail needs to change."
                    : "Your KYC is under review — you can't edit it until it's been looked at."}
                </p>
              ) : (
                <button
                  onClick={submit}
                  disabled={saving || !kyc.bank}
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LuRefreshCw size={14} className={saving ? "animate-spin" : ""} />
                  {saving ? "Submitting…" : kyc.status === "REJECTED" ? "Resubmit for review" : "Submit for review"}
                </button>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-slate-600 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
