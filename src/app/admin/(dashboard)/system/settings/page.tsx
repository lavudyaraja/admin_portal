"use client";

// Platform settings.
//
// Reads and writes the single AppSettings row, so every field here genuinely
// takes effect. Secrets come back masked and are only overwritten when a new
// non-empty value is sent — leaving the Razorpay secret blank keeps the one
// already stored.
//
// Reward Points is the exception: those rates are environment configuration, not
// settings, and the tab says so rather than offering inputs that save nowhere.

import { Suspense, useCallback, useEffect, useState } from "react";
import {
  LuSettings2, LuSlidersHorizontal, LuIndianRupee, LuCoins, LuPercent,
  LuUndo2, LuCreditCard, LuPrinter, LuReceipt, LuSave, LuCircleCheck, LuRefreshCw,
} from "react-icons/lu";
import { apiFetch } from "@/lib/admin/api";
import { OpsTabs, useOpsTab, NoRecord, type OpsTab } from "@/components/admin/OpsTabs";
import { Card, Skeleton, ErrorState, PageHeader } from "@/components/console/primitives";

/** Mirrors backend/src/lib/settings.ts. */
interface Settings {
  general: { platformName: string; supportEmail: string; supportPhone: string; companyAddress: string; timezone: string; currency: string };
  pricing: { bwPricePaise: number; colorPricePaise: number; minOrderPaise: number; gstPercent: number; extraChargesPaise: number; commissionPercent: number };
  payments: { razorpayKeyId: string; razorpayKeySecret: string; paymentsEnabled: boolean; refundsEnabled: boolean; refundWindowDays: number };
  print: { allowedFileTypes: string[]; maxFileSizeMb: number; maxPageLimit: number; duplexEnabled: boolean; colorEnabled: boolean };
  notifications: { emailNotifications: boolean; orderCompletion: boolean; failedPaymentAlerts: boolean; adminNotifications: boolean };
  legal: { privacyPolicy: string; termsConditions: string; refundPolicy: string };
}

type Section = keyof Settings;

const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 transition-colors";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({ on, onChange, label, desc }: { on: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-slate-300 transition-colors cursor-pointer">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-700">{label}</span>
        {desc && <span className="block text-[11px] text-slate-400 mt-0.5">{desc}</span>}
      </span>
      <span className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${on ? "bg-slate-900" : "bg-slate-200"}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

/** Paise in the store, rupees in the input — nobody thinks in paise. */
function RupeeInput({ paise, onChange }: { paise: number; onChange: (paise: number) => void }) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
      <input
        type="number"
        min={0}
        step="0.01"
        value={(paise / 100).toString()}
        onChange={(e) => onChange(Math.round((parseFloat(e.target.value) || 0) * 100))}
        className={`${input} pl-7`}
      />
    </div>
  );
}

function SettingsPageBody() {
  const tab = useOpsTab("general");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await apiFetch<{ settings: Settings }>("/admin/settings");
      setSettings(r.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function patch<S extends Section>(section: S, changes: Partial<Settings[S]>) {
    setSettings((s) => (s ? { ...s, [section]: { ...s[section], ...changes } } : s));
    setSaved(false);
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      const r = await apiFetch<{ settings: Settings }>("/admin/settings", { method: "PUT", body: { settings } });
      setSettings(r.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save those settings.");
    }
    setSaving(false);
  }

  const tabs: OpsTab[] = [
    { id: "general", label: "General", icon: LuSettings2 },
    { id: "platform", label: "Platform", icon: LuSlidersHorizontal },
    { id: "pricing", label: "Pricing", icon: LuIndianRupee },
    { id: "points", label: "Reward Points", icon: LuCoins },
    { id: "commission", label: "Commission", icon: LuPercent },
    { id: "refunds", label: "Refund Policy", icon: LuUndo2 },
    { id: "gateway", label: "Payment Gateway", icon: LuCreditCard },
    { id: "printer", label: "Printer", icon: LuPrinter },
    { id: "tax", label: "Tax", icon: LuReceipt },
  ];

  const canSave = tab !== "points";

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Platform configuration. Changes take effect immediately."
        action={
          <div className="flex items-center gap-2">
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <LuCircleCheck size={13} /> Saved
              </span>
            )}
            <button onClick={load} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer">
              <LuRefreshCw size={13} /> Reload
            </button>
            {canSave && (
              <button
                onClick={save}
                disabled={saving || !settings}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <LuSave size={13} /> {saving ? "Saving…" : "Save changes"}
              </button>
            )}
          </div>
        }
      />

      <OpsTabs tabs={tabs} active={tab} basePath="/admin/system/settings" />

      {error ? (
        <Card><ErrorState message={error} onRetry={load} /></Card>
      ) : loading || !settings ? (
        <Card><div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div></Card>
      ) : tab === "points" ? (
        <NoRecord
          icon={LuCoins}
          title="Points rates aren't editable here"
          needs="The points rate (10 paise per point), the pay-with-points discount and the top-up bonus tiers live in the server's environment and code, not in settings — the mobile app reads them from /api/config so client and server can never disagree. Making them editable means moving them into this settings row first."
        />
      ) : tab === "general" ? (
        <Card className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Platform name">
              <input className={input} value={settings.general.platformName} onChange={(e) => patch("general", { platformName: e.target.value })} />
            </Field>
            <Field label="Timezone">
              <input className={input} value={settings.general.timezone} onChange={(e) => patch("general", { timezone: e.target.value })} />
            </Field>
            <Field label="Support email">
              <input className={input} type="email" value={settings.general.supportEmail} onChange={(e) => patch("general", { supportEmail: e.target.value })} />
            </Field>
            <Field label="Support phone">
              <input className={input} value={settings.general.supportPhone} onChange={(e) => patch("general", { supportPhone: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Company address">
                <textarea className={`${input} resize-y`} rows={2} value={settings.general.companyAddress} onChange={(e) => patch("general", { companyAddress: e.target.value })} />
              </Field>
            </div>
          </div>
        </Card>
      ) : tab === "platform" ? (
        <Card className="p-6 space-y-3">
          <Toggle on={settings.notifications.emailNotifications} onChange={(v) => patch("notifications", { emailNotifications: v })} label="Transactional email" desc="Order and login mails. Users can still opt out individually." />
          <Toggle on={settings.notifications.orderCompletion} onChange={(v) => patch("notifications", { orderCompletion: v })} label="Order completion emails" desc="Send a mail when a print finishes." />
          <Toggle on={settings.notifications.failedPaymentAlerts} onChange={(v) => patch("notifications", { failedPaymentAlerts: v })} label="Failed payment alerts" />
          <Toggle on={settings.notifications.adminNotifications} onChange={(v) => patch("notifications", { adminNotifications: v })} label="Operator notifications" desc="Notify staff of platform events." />
        </Card>
      ) : tab === "pricing" ? (
        <Card className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Black & white, per page" hint="Default when a printer sets no rate of its own.">
              <RupeeInput paise={settings.pricing.bwPricePaise} onChange={(v) => patch("pricing", { bwPricePaise: v })} />
            </Field>
            <Field label="Colour, per page">
              <RupeeInput paise={settings.pricing.colorPricePaise} onChange={(v) => patch("pricing", { colorPricePaise: v })} />
            </Field>
            <Field label="Minimum order" hint="Zero means no minimum.">
              <RupeeInput paise={settings.pricing.minOrderPaise} onChange={(v) => patch("pricing", { minOrderPaise: v })} />
            </Field>
            <Field label="Extra charges">
              <RupeeInput paise={settings.pricing.extraChargesPaise} onChange={(v) => patch("pricing", { extraChargesPaise: v })} />
            </Field>
          </div>
          <p className="mt-5 text-xs text-slate-400 border-t border-slate-100 pt-4">
            A shop can set its own per-page rates on each printer; these apply when it hasn&apos;t.
          </p>
        </Card>
      ) : tab === "commission" ? (
        <Card className="p-6">
          <div className="max-w-sm">
            <Field label="Platform commission" hint="Percent of each completed order the platform keeps.">
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.5"
                  value={settings.pricing.commissionPercent}
                  onChange={(e) => patch("pricing", { commissionPercent: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                  className={`${input} pr-8`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
              </div>
            </Field>
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-500">
            <p>Applied to completed orders only — pending, failed and cancelled orders are never charged.</p>
            {/* Worth flagging: this isn't recorded per order, so it rewrites history. */}
            <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Commission is computed from this rate whenever a figure is displayed, not written onto
              each order. Changing it therefore changes every past figure on the Commissions page too.
            </p>
          </div>
        </Card>
      ) : tab === "refunds" ? (
        <Card className="p-6 space-y-5">
          <Toggle on={settings.payments.refundsEnabled} onChange={(v) => patch("payments", { refundsEnabled: v })} label="Refunds enabled" desc="Turning this off stops staff issuing refunds." />
          <div className="max-w-sm">
            <Field label="Refund window (days)" hint="How long after an order a refund may be issued.">
              <input type="number" min={0} value={settings.payments.refundWindowDays} onChange={(e) => patch("payments", { refundWindowDays: parseInt(e.target.value) || 0 })} className={input} />
            </Field>
          </div>
          <Field label="Refund policy text" hint="Shown to users in the app's legal section.">
            <textarea className={`${input} resize-y`} rows={5} value={settings.legal.refundPolicy} onChange={(e) => patch("legal", { refundPolicy: e.target.value })} />
          </Field>
          <p className="text-xs text-slate-400 border-t border-slate-100 pt-4">
            A failed print always refunds automatically as points, regardless of these settings.
          </p>
        </Card>
      ) : tab === "gateway" ? (
        <Card className="p-6 space-y-5">
          <Toggle on={settings.payments.paymentsEnabled} onChange={(v) => patch("payments", { paymentsEnabled: v })} label="Online payments enabled" desc="When off, only points can be used to pay." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Razorpay key id">
              <input className={input} value={settings.payments.razorpayKeyId} onChange={(e) => patch("payments", { razorpayKeyId: e.target.value })} />
            </Field>
            <Field label="Razorpay key secret" hint="Leave blank to keep the stored secret. It is never sent back to the browser.">
              <input className={`${input} font-mono`} type="password" placeholder="••••••••" value={settings.payments.razorpayKeySecret} onChange={(e) => patch("payments", { razorpayKeySecret: e.target.value })} />
            </Field>
          </div>
        </Card>
      ) : tab === "printer" ? (
        <Card className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Maximum file size (MB)">
              <input type="number" min={1} value={settings.print.maxFileSizeMb} onChange={(e) => patch("print", { maxFileSizeMb: parseInt(e.target.value) || 1 })} className={input} />
            </Field>
            <Field label="Maximum pages per order">
              <input type="number" min={1} value={settings.print.maxPageLimit} onChange={(e) => patch("print", { maxPageLimit: parseInt(e.target.value) || 1 })} className={input} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Allowed file types" hint="Comma separated, e.g. pdf, docx, png, jpg.">
                <input
                  className={input}
                  value={settings.print.allowedFileTypes.join(", ")}
                  onChange={(e) => patch("print", { allowedFileTypes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                />
              </Field>
            </div>
          </div>
          <Toggle on={settings.print.duplexEnabled} onChange={(v) => patch("print", { duplexEnabled: v })} label="Double-sided printing" desc="Allow duplex as an option at checkout." />
          <Toggle on={settings.print.colorEnabled} onChange={(v) => patch("print", { colorEnabled: v })} label="Colour printing" desc="Allow colour as an option at checkout." />
        </Card>
      ) : (
        <Card className="p-6">
          <div className="max-w-sm">
            <Field label="GST" hint="Percent applied to order totals.">
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.5"
                  value={settings.pricing.gstPercent}
                  onChange={(e) => patch("pricing", { gstPercent: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                  className={`${input} pr-8`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
              </div>
            </Field>
          </div>
          <p className="mt-5 text-xs text-slate-400 border-t border-slate-100 pt-4">
            GST is the only tax field the platform holds. There is no HSN code, place-of-supply or
            invoice series — proper tax invoicing would need those.
          </p>
        </Card>
      )}
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <SettingsPageBody />
    </Suspense>
  );
}
