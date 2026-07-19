"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import {
  LuLogOut,
  LuChevronDown,
  LuPanelLeftClose,
  LuX,
  LuSettings,
} from "react-icons/lu";
import { cx } from "./primitives";

export interface NavItem {
  label: string;
  href: string;
  icon: IconType;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** The signed-in user, as much of it as the sidebar needs. */
export interface ConsoleUser {
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: string;
}

export interface ConsoleSidebarProps {
  /** Wordmark: "Prinsta Ops", "Prinsta Vendor". */
  brand: { icon: IconType; name: string; suffix: string };
  navGroups: NavGroup[];
  user: ConsoleUser | null;
  /** Shown when `user` hasn't loaded yet, and as the avatar initial fallback. */
  fallbackName: string;
  /** Small line under the name in the profile menu — "Platform ADMIN", "Vendor". */
  roleLabel: string;
  /** Vendor only: opens the settings modal. Omitted by the admin console. */
  onOpenSettings?: () => void;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  logout: () => void;
}

/**
 * The console sidebar, shared by the vendor and admin portals.
 *
 * Both portals had their own 275-line copy of this, which is how they drifted
 * apart visually. Everything that differs between them — wordmark, nav, role
 * line, whether there's a settings entry — is a prop; the chrome is not.
 *
 * Two layout rules are load-bearing and easy to break:
 *  - Collapsed on desktop, the nav must keep `overflow: visible` or the hover
 *    tooltips (positioned at `left-full`) get clipped by the scroll container.
 *  - On mobile the drawer is always full width; only desktop honours `collapsed`.
 */
export default function ConsoleSidebar({
  brand,
  navGroups,
  user,
  fallbackName,
  roleLabel,
  onOpenSettings,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  logout,
}: ConsoleSidebarProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close the profile dropdown on outside click.
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const desktopW = collapsed ? "lg:w-[64px]" : "lg:w-[224px]";

  const Mark = () => (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/adaptive-icon.png"
      alt=""
      className="w-10 h-10 object-contain shrink-0 rounded-lg"
    />
  );

  const BrandText = () => (
    <span className="text-slate-800 font-black text-sm tracking-tight truncate flex-1 text-left">
      {brand.name} <span className="text-slate-400 font-bold">{brand.suffix}</span>
    </span>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cx(
          "fixed top-0 left-0 h-full z-50 flex flex-col border-r border-slate-200 bg-tint-gray w-[248px]",
          desktopW,
          "transition-transform duration-200 lg:transition-[width]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        {/* Brand */}
        <div
          className={cx(
            "flex items-center h-14 border-b border-slate-200 shrink-0 px-3 gap-2",
            collapsed && "lg:flex-col lg:justify-center lg:gap-1.5 lg:px-2"
          )}
        >
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cx(
              "hidden lg:flex items-center cursor-pointer min-w-0 transition-transform hover:scale-[1.02] active:scale-[0.98]",
              collapsed ? "lg:justify-center" : "gap-2 flex-1 text-left"
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Mark />
            {!collapsed && <BrandText />}
          </button>

          <div className="flex lg:hidden items-center gap-2 flex-1 min-w-0">
            <Mark />
            <BrandText />
          </div>

          {!collapsed && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              title="Collapse sidebar"
              className="hidden lg:flex w-6 h-6 rounded-md items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all shrink-0 cursor-pointer"
            >
              <LuPanelLeftClose size={16} />
            </button>
          )}

          <button
            onClick={() => setMobileOpen(false)}
            title="Close menu"
            className="flex lg:hidden w-8 h-8 rounded-md items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all shrink-0"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav
          className={cx(
            "flex-1 py-3 space-y-5 px-2.5 overflow-y-auto overflow-x-hidden no-scrollbar",
            collapsed && "lg:overflow-visible"
          )}
        >
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p
                className={cx(
                  "text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1.5",
                  collapsed && "lg:hidden"
                )}
              >
                {group.label}
              </p>
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={cx(
                      "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors group relative cursor-pointer px-3 py-2.5",
                      collapsed && "lg:justify-center lg:px-0 lg:h-11 lg:py-0",
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    )}
                  >
                    <span
                      className={cx(
                        "shrink-0 transition-colors",
                        active ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                      )}
                    >
                      <Icon size={19} />
                    </span>
                    <span className={cx("truncate", collapsed && "lg:hidden")}>{item.label}</span>

                    {collapsed && (
                      <span className="hidden lg:group-hover:flex items-center absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap pointer-events-none shadow-lg z-[60] before:content-[''] before:absolute before:-left-1 before:top-1/2 before:-translate-y-1/2 before:w-2 before:h-2 before:rotate-45 before:bg-slate-900">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Profile */}
        <div className="px-2 py-3 border-t border-slate-200 relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className={cx(
              "w-full flex items-center rounded-lg transition-colors hover:bg-slate-200/60 px-2 py-2 cursor-pointer gap-2.5",
              collapsed && "lg:justify-center lg:gap-0"
            )}
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-white text-[11px] font-black shrink-0">
              {user?.name?.[0]?.toUpperCase() || fallbackName[0]}
            </div>
            <div className={cx("min-w-0 flex-1 text-left", collapsed && "lg:hidden")}>
              <p className="text-slate-800 text-xs font-semibold truncate">
                {user?.name || fallbackName}
              </p>
              <p className="text-slate-400 text-[10px] truncate">
                {user?.email || user?.phone || ""}
              </p>
            </div>
            <span className={cx("text-slate-400 shrink-0", collapsed && "lg:hidden")}>
              <LuChevronDown size={12} />
            </span>
          </button>

          {profileOpen && (
            <div
              className={cx(
                "absolute bottom-full mb-2 bg-white rounded-xl border border-slate-200 py-1.5 px-1 z-50 min-w-[190px] shadow-lg left-2 right-2",
                collapsed && "lg:left-full lg:ml-2 lg:right-auto lg:bottom-2"
              )}
            >
              <div className="px-3 py-1.5 border-b border-slate-200 mb-1">
                <p className="text-xs font-bold text-slate-700 truncate">
                  {user?.name || fallbackName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{roleLabel}</p>
              </div>

              {onOpenSettings && (
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onOpenSettings();
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors w-full text-left cursor-pointer rounded-lg"
                >
                  <LuSettings size={13} /> Settings
                </button>
              )}

              <button
                onClick={logout}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-50 transition-colors w-full text-left cursor-pointer rounded-lg"
              >
                <LuLogOut size={13} /> Logout
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
