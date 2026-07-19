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
  LuLifeBuoy,
} from "react-icons/lu";
import { cx } from "./primitives";

export interface NavItem {
  label: string;
  href: string;
  icon: IconType;
  /**
   * Planned but not built. Renders as a dimmed, non-navigating row so the shape
   * of the console is visible without every unfinished section 404-ing.
   */
  soon?: boolean;
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
  /** Where "Help & support" goes. Omit to hide the entry. */
  helpHref?: string;
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
 *  - The nav scrolls in both states. It is tempting to give it
 *    `overflow: visible` when collapsed so a `left-full` tooltip isn't clipped —
 *    that is what it used to do, and it silently made the lower nav groups
 *    unreachable once the list grew past one screen. Collapsed items use the
 *    native `title` for their label instead.
 *  - On mobile the drawer is always full width; only desktop honours `collapsed`.
 */
export default function ConsoleSidebar({
  brand,
  navGroups,
  user,
  fallbackName,
  roleLabel,
  onOpenSettings,
  helpHref,
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
        {/* Scrolls in both states.
            This used to switch to `overflow-visible` when collapsed so the
            hover tooltips (positioned at `left-full`) weren't clipped — but
            `visible` also stops the nav scrolling, and once the nav grew past a
            screen the lower groups became unreachable in collapsed mode. The
            tooltip is the thing that gives way: collapsed items already carry a
            native `title`, so the label is still available on hover. */}
        <nav className="flex-1 py-3 space-y-5 px-2.5 overflow-y-auto overflow-x-hidden no-scrollbar">
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

                // Unbuilt sections render as a plain row, not a link — the
                // structure is visible without the click going nowhere.
                if (item.soon) {
                  return (
                    <div
                      key={item.href}
                      title={collapsed ? `${item.label} — coming soon` : undefined}
                      className={cx(
                        "flex items-center gap-3 rounded-lg text-sm font-medium relative group px-3 py-2.5 cursor-default text-slate-400",
                        collapsed && "lg:justify-center lg:px-0 lg:h-11 lg:py-0"
                      )}
                    >
                      <span className="shrink-0 text-slate-300">
                        <Icon size={19} />
                      </span>
                      <span className={cx("truncate flex-1", collapsed && "lg:hidden")}>{item.label}</span>
                      <span
                        className={cx(
                          "text-[9px] font-bold uppercase tracking-wide text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded shrink-0",
                          collapsed && "lg:hidden"
                        )}
                      >
                        Soon
                      </span>
                    </div>
                  );
                }

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

              {/* Help sits with Settings rather than only in the nav, so it is
                  reachable from any page — someone who is stuck is not going to
                  go hunting for it. Points at the same operator inbox. */}
              {helpHref && (
                <Link
                  href={helpHref}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors w-full text-left cursor-pointer rounded-lg"
                >
                  <LuLifeBuoy size={13} /> Help &amp; support
                </Link>
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
