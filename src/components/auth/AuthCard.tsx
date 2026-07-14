"use client";

// Two-panel auth shell — left: branding, right: form (white card)
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
    <div className="w-full max-w-5xl bg-[#EDE8E0] rounded-3xl overflow-hidden flex min-h-[600px]">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex w-[460px] shrink-0 flex-col justify-between p-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center">
            <span className="text-white font-black text-base">P</span>
          </div>
          <span className="font-black text-stone-800 text-lg tracking-tight">
            Prinsta<span className="text-[#C4622D] font-black">AI</span>
          </span>
        </div>

        {/* Headline block */}
        <div className="mt-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#F5DDD0] text-[#C4622D] text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-6">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Admin Portal
          </div>

          <h1 className="text-4xl font-black text-stone-900 leading-tight tracking-tight">
            Manage printers,
          </h1>
          <h1 className="text-4xl font-black text-[#C4622D] leading-tight tracking-tight mt-0.5">
            orders & analytics.
          </h1>

          <p className="mt-5 text-stone-500 text-sm leading-relaxed max-w-[320px]">
            Access the admin controls to configure printers, monitor live jobs,
            audit wallet ledgers, and view daily revenues.
          </p>

          {/* Feature quote card */}
          <div className="mt-8 bg-white/60 backdrop-blur-sm border border-stone-200/80 rounded-2xl p-5">
            <p className="text-stone-600 text-sm leading-relaxed">
              Welcome to the control center. Use this portal to manage print
              queues, allocate wallet credits, monitor kiosk devices, and
              oversee all campus print operations in real time.
            </p>
          </div>
        </div>

        {/* Feature grid */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          {[
            { icon: "🖨", label: "Printer Management" },
            { icon: "📊", label: "Live Analytics" },
            { icon: "⚡", label: "Real-time Queues" },
            { icon: "✅", label: "Audit Logs" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2.5 text-stone-500 text-xs font-semibold">
              <span className="text-base">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>

        <p className="mt-8 text-stone-400 text-[11px]">
          © {new Date().getFullYear()} Prinsta · Built for campus printing
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 bg-white rounded-2xl m-3 flex flex-col justify-center px-8 py-10 lg:px-10">
        <h2 className="text-3xl font-black text-stone-900 tracking-tight">{formTitle}</h2>
        <p className="text-stone-500 text-sm mt-1 mb-7">{formSubtitle}</p>
        {children}
      </div>
    </div>
  );
}

// ── Shared form primitives ──────────────────────────────────────────

export function AuthError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm mb-5">
      <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {message}
    </div>
  );
}

export function AuthInfo({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-sm mb-5">
      <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {message}
    </div>
  );
}

export function OrDivider({ label = "or sign in with email" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-stone-200" />
      <span className="text-stone-400 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-stone-200" />
    </div>
  );
}

export function SubmitButton({
  loading,
  label,
  loadingLabel,
}: {
  loading: boolean;
  label: string;
  loadingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full h-12 rounded-xl font-black text-sm text-white uppercase tracking-widest bg-[#C4622D] hover:bg-[#A8532A] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {loadingLabel}
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

export function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-12 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-sm font-semibold flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      Continue with Google
    </button>
  );
}

// Shared input styling
export const inputCls =
  "h-11 bg-white border-stone-200 text-stone-800 placeholder:text-stone-400 focus-visible:ring-[#C4622D]/20 focus-visible:border-[#C4622D]/60 rounded-xl";
