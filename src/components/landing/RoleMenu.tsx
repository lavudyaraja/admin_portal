"use client";

import { useEffect, useRef, useState } from "react";
import { LuChevronDown, LuStore, LuShieldCheck } from "react-icons/lu";
import { DASHBOARD_PATH, type ConsoleKind } from "@/lib/session";
import { useActiveConsoles } from "@/lib/useActiveConsoles";

/**
 * The two console audiences, and where each one signs in.
 *
 * Both consoles are the same Next app: vendors own the landing page and sit at
 * the root, admins live under /admin. So every link here is internal.
 */

export interface RoleOption {
  key: "vendor" | "admin";
  label: string;
  hint: string;
  icon: typeof LuStore;
  href: (mode: "login" | "register") => string;
  external: boolean;
}

export const ROLES: RoleOption[] = [
  {
    key: "vendor",
    label: "Vendor",
    hint: "Shop owner running printers",
    icon: LuStore,
    href: (mode) => `/vendor/${mode}?role=vendor`,
    external: false,
  },
  {
    key: "admin",
    label: "Operator",
    hint: "Prinsta platform staff",
    icon: LuShieldCheck,
    href: (mode) => `/admin/${mode}`,
    external: false,
  },
];

const roleOf = (key: ConsoleKind) => ROLES.find((r) => r.key === key)!;

/**
 * "Sign In"/"Sign Up" split by audience. A dropdown rather than four separate
 * buttons — the navbar has room for two controls, not four.
 *
 * Once a session exists, the sign-in control becomes a way back into the console
 * instead: a returning vendor or admin should land on their dashboard, not on
 * a form they no longer need to fill in.
 */
export default function RoleMenu({
  mode,
  variant,
}: {
  mode: "login" | "register";
  variant: "ghost" | "solid";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const signedIn = useActiveConsoles();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const trigger =
    variant === "solid"
      ? "text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white px-4.5 py-2.5 rounded-xl transition-all shadow-md shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-[0.98]"
      : "text-sm font-bold text-slate-700 hover:text-slate-950 px-4 py-2 rounded-xl transition-colors";

  // Signed in to exactly one console — no choice to offer, so skip the menu.
  if (mode === "login" && signedIn.length === 1) {
    const role = roleOf(signedIn[0]);
    return (
      <a href={DASHBOARD_PATH[role.key]} className={`${trigger} flex items-center gap-1.5`}>
        <role.icon size={15} />
        Dashboard
      </a>
    );
  }

  // Signed in to both at once — the dropdown becomes the console switcher.
  const dashboards = mode === "login" && signedIn.length > 1;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`${trigger} flex items-center gap-1.5 cursor-pointer`}
      >
        {dashboards ? "Dashboard" : mode === "login" ? "Sign In" : "Sign Up"}
        <LuChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50"
        >
          {ROLES.map((r) => {
            const Icon = r.icon;
            const href = dashboards ? DASHBOARD_PATH[r.key] : r.href(mode);
            return (
              <a
                key={r.key}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                {...(r.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors group"
              >
                <span className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-white flex items-center justify-center text-slate-900 shrink-0 transition-colors">
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-800">{r.label}</span>
                  <span className="block text-xs text-slate-500 leading-snug">
                    {dashboards ? "Go to your console" : r.hint}
                  </span>
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Flat list of the same links — the mobile drawer has no room for a dropdown.
 *
 * The signed-in consoles are hoisted into their own "Your consoles" group and
 * dropped from the sign-in group below, so the drawer never offers a form and a
 * dashboard for the same role.
 */
export function RoleLinks({
  mode,
  onNavigate,
}: {
  mode: "login" | "register";
  onNavigate: () => void;
}) {
  const signedIn = useActiveConsoles();
  const asDashboards = mode === "login" ? signedIn : [];
  const remaining = ROLES.filter((r) => !asDashboards.includes(r.key));

  // Every role is already signed in, so there is no sign-in group left to label.
  if (mode === "register" && signedIn.length === ROLES.length) return null;

  const row = (
    key: string,
    href: string,
    label: string,
    hint: string,
    Icon: typeof LuStore,
    external: boolean
  ) => (
    <a
      key={key}
      href={href}
      onClick={onNavigate}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
    >
      <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-slate-800">{label}</span>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
    </a>
  );

  return (
    <div className="space-y-1.5">
      {asDashboards.length > 0 && (
        <>
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Your consoles
          </p>
          {asDashboards.map((key) => {
            const r = roleOf(key);
            return row(key, DASHBOARD_PATH[key], `${r.label} dashboard`, "Signed in", r.icon, false);
          })}
        </>
      )}

      {remaining.length > 0 && (
        <>
          <p className="px-3 pt-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {mode === "login" ? "Sign in as" : "Sign up as"}
          </p>
          {remaining.map((r) => row(r.key, r.href(mode), r.label, r.hint, r.icon, r.external))}
        </>
      )}
    </div>
  );
}
