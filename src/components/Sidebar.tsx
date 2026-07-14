"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LuLayoutGrid,
  LuTrendingUp,
  LuPrinter,
  LuFileText,
  LuQrCode,
  LuUsers,
  LuWallet,
  LuHistory,
  LuCircleHelp,
  LuSettings,
  LuLogOut,
  LuChevronDown,
  LuPanelLeftClose,
  LuX,
  LuUser,
  LuCreditCard,
  LuBell,
  LuActivity,
} from "react-icons/lu";
import { AdminUser } from "@/lib/api";

interface SidebarProps {
  user: AdminUser | null;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenSettings: (tab?: string) => void;
  logout: () => void;
}

const navGroups = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LuLayoutGrid },
      { label: "Revenue", href: "/revenue", icon: LuTrendingUp },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Printers", href: "/printers", icon: LuPrinter },
      { label: "Orders", href: "/orders", icon: LuFileText },
      { label: "QR Codes", href: "/qr", icon: LuQrCode },
    ],
  },
  {
    label: "Users & Payments",
    items: [
      { label: "Users", href: "/users", icon: LuUsers },
      { label: "Wallet", href: "/wallet", icon: LuWallet },
      { label: "Transactions", href: "/transactions", icon: LuHistory },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Support", href: "/support", icon: LuCircleHelp },
    ],
  },
];

export default function Sidebar({ user, collapsed, setCollapsed, mobileOpen, setMobileOpen, onOpenSettings, logout }: SidebarProps) {
  function openSettings(tab?: string) {
    setProfileOpen(false);
    setMobileOpen(false);
    onOpenSettings(tab);
  }
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
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
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // On mobile the drawer is always full-width; only desktop respects `collapsed`.
  const desktopW = collapsed ? "lg:w-[64px]" : "lg:w-[224px]";

  return (
    <>
      {/* Backdrop — mobile/tablet only */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col border-r border-slate-200 bg-[#F3F3F3]
          w-[248px] ${desktopW}
          transition-transform duration-200 lg:transition-[width]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo row */}
        <div className={`flex items-center h-14 border-b border-slate-200 shrink-0 px-3 gap-2 ${collapsed ? "lg:flex-col lg:justify-center lg:gap-1.5 lg:px-2" : ""}`}>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`hidden lg:flex items-center cursor-pointer min-w-0 transition-transform hover:scale-[1.02] active:scale-[0.98] ${collapsed ? "lg:justify-center" : "gap-2 flex-1 text-left"
              }`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-xs shrink-0">P</div>
            {!collapsed && <span className="text-slate-800 font-black text-sm tracking-tight truncate flex-1">Prinsta</span>}
          </button>

          {/* Mobile brand (non-button) */}
          <div className="flex lg:hidden items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-xs shrink-0">P</div>
            <span className="text-slate-800 font-black text-sm tracking-tight truncate">Prinsta</span>
          </div>

          {/* Desktop collapse toggle */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              title="Collapse sidebar"
              className="hidden lg:flex w-6 h-6 rounded-md items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all shrink-0 cursor-pointer"
            >
              <LuPanelLeftClose size={16} />
            </button>
          )}

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            title="Close menu"
            className="flex lg:hidden w-8 h-8 rounded-md items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all shrink-0"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Nav — when collapsed on desktop, let overflow be visible so hover
            tooltips (positioned at left-full) are not clipped by the scroll box. */}
        <nav className={`flex-1 py-3 space-y-5 px-2.5 overflow-y-auto overflow-x-hidden ${collapsed ? "lg:overflow-visible" : ""}`}>
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1.5 ${collapsed ? "lg:hidden" : ""}`}>
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
                    className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-colors group relative cursor-pointer px-3 py-2.5
                      ${collapsed ? "lg:justify-center lg:px-0 lg:h-11 lg:py-0" : ""}
                      ${active
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      }`}
                  >
                    <span className={`shrink-0 transition-colors ${active ? "text-white" : "text-slate-400 group-hover:text-slate-700"}`}>
                      <Icon size={19} />
                    </span>
                    <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>

                    {/* Tooltip when collapsed (desktop only) */}
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

        {/* User profile */}
        <div className="px-2 py-3 border-t border-slate-200 relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className={`w-full flex items-center rounded-lg transition-colors hover:bg-slate-200/60 px-2 py-2 cursor-pointer gap-2.5 ${collapsed ? "lg:justify-center lg:gap-0" : ""}`}
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-white text-[11px] font-black shrink-0">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className={`min-w-0 flex-1 text-left ${collapsed ? "lg:hidden" : ""}`}>
              <p className="text-slate-800 text-xs font-semibold truncate">{user?.name || "Admin"}</p>
              <p className="text-slate-400 text-[10px] truncate">{user?.email || user?.phone || ""}</p>
            </div>
            <span className={`text-slate-400 shrink-0 ${collapsed ? "lg:hidden" : ""}`}><LuChevronDown size={12} /></span>
          </button>

          {profileOpen && (
            <div className={`absolute bottom-full mb-2 bg-slate-100 rounded-xl border border-slate-200 py-1.5 px-1 z-50 min-w-[190px] shadow-lg left-2 right-2 ${collapsed ? "lg:left-full lg:ml-2 lg:right-auto lg:bottom-2" : ""}`}>
              <div className="px-3 py-1.5 border-b border-slate-200 mb-1">
                <p className="text-xs font-bold text-slate-700 truncate">{user?.name || "Admin"}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.role}</p>
              </div>
              <button
                onClick={() => openSettings("account")}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors w-full text-left cursor-pointer rounded-lg"
              >
                <LuUser size={13} /> My Profile
              </button>
              <button
                onClick={() => openSettings("general")}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors w-full text-left cursor-pointer rounded-lg"
              >
                <LuSettings size={13} /> Settings
              </button>
              <button
                onClick={() => openSettings("payments")}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors w-full text-left cursor-pointer rounded-lg"
              >
                <LuCreditCard size={13} /> Billing &amp; Payments
              </button>
              <button
                onClick={() => openSettings("notifications")}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors w-full text-left cursor-pointer rounded-lg"
              >
                <LuBell size={13} /> Notifications
              </button>
              <Link
                href="/transactions"
                onClick={() => { setProfileOpen(false); setMobileOpen(false); }}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors w-full text-left cursor-pointer rounded-lg"
              >
                <LuActivity size={13} /> Activity Log
              </Link>
              <Link
                href="/support"
                onClick={() => { setProfileOpen(false); setMobileOpen(false); }}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors w-full text-left cursor-pointer rounded-lg"
              >
                <LuCircleHelp size={13} /> Help &amp; Support
              </Link>
              <div className="border-t border-slate-200 my-1" />
              <button
                onClick={logout}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-100 transition-colors w-full text-left cursor-pointer rounded-lg"
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
