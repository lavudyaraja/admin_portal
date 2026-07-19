"use client";

import React from "react";

// ── Shared auth shell & primitives for Prinsta Vendor Portal ────────────────

export function AuthShell({
  formTitle,
  formSubtitle,
  children,
}: {
  formTitle: string;
  formSubtitle: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-tint-gray p-4 sm:p-6">
      <div className="w-full max-w-5xl flex rounded-3xl overflow-hidden shadow-sm border border-slate-200/60 min-h-[620px]">

        {/* ── Left branding panel (Peach & Gold Gradient Style) ── */}
        <div className="hidden lg:flex w-[440px] shrink-0 flex-col justify-between bg-gradient-to-br from-tint-peach via-white to-tint-gold p-10 border-r border-slate-200/40">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/adaptive-icon.png" alt="" className="w-7 h-7 object-contain rounded-md" />
            </div>
            <span className="text-slate-800 font-black text-lg tracking-tight">
              Prinsta <span className="text-slate-500 font-medium text-base">Vendor</span>
            </span>
          </div>

          {/* Headline block */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/80 border border-slate-200/60 text-slate-600 text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-7 shadow-sm">
              <svg className="w-3.5 h-3.5 text-ink-peach" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Admin Portal
            </div>

            <h2 className="text-4xl font-black text-slate-800 leading-[1.05] tracking-tight">
              Manage printers,<br />
              <span className="text-slate-500 font-semibold">orders & analytics.</span>
            </h2>
            <p className="mt-5 text-slate-650 text-sm leading-relaxed max-w-[300px]">
              Access the admin controls to configure printers, monitor live jobs, audit Points ledgers, and view daily revenues.
            </p>

            {/* Feature chips using tint system */}
            <div className="mt-9 grid grid-cols-2 gap-3">
              {[
                { bg: "bg-tint-peach", dot: "bg-ink-peach", label: "Printer Control" },
                { bg: "bg-tint-gold", dot: "bg-ink-gold", label: "Live Analytics" },
                { bg: "bg-tint-sky", dot: "bg-ink-sky", label: "Real-time Jobs" },
                { bg: "bg-tint-mint", dot: "bg-ink-mint", label: "Audit Logs" },
                { bg: "bg-tint-lavender", dot: "bg-ink-lavender", label: "Support Desk" },
                { bg: "bg-tint-aqua", dot: "bg-ink-aqua", label: "Kiosk Health" },
              ].map((f) => (
                <div key={f.label} className={`flex items-center gap-2.5 ${f.bg} border border-slate-200/10 rounded-xl px-3.5 py-2.5`}>
                  <span className={`w-2 h-2 rounded-full ${f.dot} shrink-0`} />
                  <span className="text-slate-700 text-xs font-semibold">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-400 text-[11px]">
            © {new Date().getFullYear()} Prinsta · Restricted access
          </p>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex-1 bg-white flex flex-col justify-center px-8 py-12 lg:px-12">
          <div className="max-w-sm w-full mx-auto">
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2.5 mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/adaptive-icon.png" alt="" className="w-8 h-8 object-contain rounded-lg" />
              <span className="font-black text-slate-800 text-base tracking-tight">Prinsta Vendor</span>
            </div>

            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{formTitle}</h2>
            <p className="text-slate-500 text-sm mt-1.5 mb-8">{formSubtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Primitives ─────────────────────────────────────────────────────────────────

export function AuthError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-tint-blush border border-rose-100 text-rose-600 text-sm mb-5">
      <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {message}
    </div>
  );
}

export function AuthInfo({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-tint-lavender border border-violet-100 text-violet-600 text-sm mb-5">
      <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {message}
    </div>
  );
}

export function OrDivider({ label = "or continue with email" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-slate-100" />
      <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

export function GoogleButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-11 rounded-xl border border-slate-200 bg-tint-gray hover:bg-slate-100 text-slate-700 text-sm font-semibold flex items-center justify-center gap-3 transition-colors cursor-pointer"
    >
      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      Continue with Google
    </button>
  );
}

export function SubmitButton({
  loading = false,
  label,
  loadingLabel,
}: {
  loading?: boolean;
  label: string;
  loadingLabel?: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full h-11 rounded-xl bg-ink-peach hover:bg-orange-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer mt-2"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {loadingLabel ?? label}
        </>
      ) : (
        <>
          {label}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </>
      )}
    </button>
  );
}

// Shared input styling
export const inputCls =
  "w-full h-11 rounded-xl border border-slate-200 bg-tint-gray px-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-slate-450 focus:bg-white transition-colors focus-visible:ring-0 focus-visible:ring-offset-0";
