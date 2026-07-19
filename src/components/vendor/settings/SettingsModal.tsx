"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LuX,
  LuSettings2,
  LuBanknote,
  LuCreditCard,
  LuFileText,
  LuBell,
  LuUser,
  LuPalette,
  LuScale,
  LuLoaderCircle,
  LuCircleCheck,
  LuCircleAlert,
} from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import type { Settings, Section } from "./types";
import GeneralTab from "./tabs/GeneralTab";
import PricingTab from "./tabs/PricingTab";
import PaymentsTab from "./tabs/PaymentsTab";
import PrintRulesTab from "./tabs/PrintRulesTab";
import NotificationsTab from "./tabs/NotificationsTab";
import AccountTab from "./tabs/AccountTab";
import BrandingTab from "./tabs/BrandingTab";
import LegalTab from "./tabs/LegalTab";

export type TabId =
  | "general" | "pricing" | "payments" | "print"
  | "notifications" | "account" | "branding" | "legal";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "general", label: "General", icon: LuSettings2 },
  { id: "pricing", label: "Pricing", icon: LuBanknote },
  { id: "payments", label: "Payments", icon: LuCreditCard },
  { id: "print", label: "Print Rules", icon: LuFileText },
  { id: "notifications", label: "Notifications", icon: LuBell },
  { id: "account", label: "Account", icon: LuUser },
  { id: "branding", label: "Branding", icon: LuPalette },
  { id: "legal", label: "Legal", icon: LuScale },
];

export default function SettingsModal({ open, onClose, initialTab = "general" }: { open: boolean; onClose: () => void; initialTab?: TabId }) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch<{ settings: Settings }>("/admin/settings");
      setSettings(r.settings);
    } catch {
      setMsg({ ok: false, text: "Could not load settings." });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setDirty(false);
      setMsg(null);
      load();
    }
  }, [open, initialTab, load]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, onClose]);

  function updateSection<S extends Section>(section: S, patch: Partial<Settings[S]>) {
    setSettings((s) => (s ? { ...s, [section]: { ...s[section], ...patch } } : s));
    setDirty(true);
    setMsg(null);
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    setMsg(null);
    try {
      const r = await apiFetch<{ settings: Settings }>("/admin/settings", { method: "PUT", body: { settings } });
      setSettings(r.settings);
      setDirty(false);
      setMsg({ ok: true, text: "Settings saved." });
    } catch (e: unknown) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Failed to save settings" });
    }
    setSaving(false);
  }

  if (!open) return null;

  const showFooter = tab !== "account";

  return (
    <div className="fixed inset-0 z-[70] flex items-stretch sm:items-center justify-center bg-slate-900/50 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-4xl h-full sm:h-[86vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><LuSettings2 size={17} /></span>
            <h2 className="font-black text-slate-900 text-sm sm:text-base">Settings</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <LuX size={19} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Internal sidebar (tabs) */}
          <nav className="w-14 sm:w-52 shrink-0 border-r border-slate-100 bg-slate-50/60 overflow-y-auto py-3 px-2 space-y-0.5">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  title={t.label}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 sm:py-2 text-sm font-medium transition-colors justify-center sm:justify-start ${
                    active ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-200/70 hover:text-slate-800"
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline truncate">{t.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 py-5">
            {loading || !settings ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm gap-2">
                <LuLoaderCircle className="animate-spin" size={18} /> Loading settings…
              </div>
            ) : (
              <>
                {tab === "general" && <GeneralTab value={settings.general} onChange={(p) => updateSection("general", p)} />}
                {tab === "pricing" && <PricingTab value={settings.pricing} onChange={(p) => updateSection("pricing", p)} />}
                {tab === "payments" && <PaymentsTab value={settings.payments} onChange={(p) => updateSection("payments", p)} />}
                {tab === "print" && <PrintRulesTab value={settings.print} onChange={(p) => updateSection("print", p)} />}
                {tab === "notifications" && <NotificationsTab value={settings.notifications} onChange={(p) => updateSection("notifications", p)} />}
                {tab === "account" && <AccountTab />}
                {tab === "branding" && <BrandingTab value={settings.branding} onChange={(p) => updateSection("branding", p)} />}
                {tab === "legal" && <LegalTab value={settings.legal} onChange={(p) => updateSection("legal", p)} />}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        {showFooter && (
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-16 border-t border-slate-100 shrink-0">
            <div className="min-w-0">
              {msg && (
                <p className={`flex items-center gap-1.5 text-xs font-medium ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>
                  {msg.ok ? <LuCircleCheck size={14} /> : <LuCircleAlert size={14} />} {msg.text}
                </p>
              )}
              {!msg && dirty && <p className="text-xs text-amber-600 font-medium">Unsaved changes</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-slate-800 px-4 py-2.5 rounded-xl transition-colors">Close</button>
              <button
                onClick={save}
                disabled={saving || !dirty || loading}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
              >
                {saving && <LuLoaderCircle size={15} className="animate-spin" />} Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
