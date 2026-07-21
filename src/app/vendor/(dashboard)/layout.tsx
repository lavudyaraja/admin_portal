"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LuMenu } from "react-icons/lu";
import { apiFetch, getToken, clearToken, isConsoleRole, type AdminUser } from "@/lib/vendor/api";
import Sidebar from "@/components/vendor/Sidebar";
import SettingsModal, { type TabId } from "@/components/vendor/settings/SettingsModal";
import NotificationBell from "@/components/vendor/NotificationBell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<TabId>("general");

  function openSettings(tab?: string) {
    setSettingsTab((tab as TabId) || "general");
    setSettingsOpen(true);
  }

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Verify the session once on mount (not on every navigation — the sidebar uses
  // client-side <Link> so the layout is not remounted between pages). Runs in the
  // background: the console renders immediately, no full-screen loader.
  const verify = useCallback(async () => {
    try {
      const res = await apiFetch<{ user: AdminUser }>("/auth/me");
      if (!isConsoleRole(res.user?.role)) {
        clearToken();
        router.replace("/vendor/login");
        return;
      }
      setUser(res.user);
    } catch {
      clearToken();
      router.replace("/vendor/login");
    }
  }, [router]);

  useEffect(() => {
    if (!getToken()) { router.replace("/vendor/login"); return; }
    verify();
  }, [router, verify]);

  function logout() {
    clearToken();
    router.replace("/vendor/login");
  }

  const pathLabels: Record<string, string> = {
    "/vendor/dashboard": "Dashboard",
    "/vendor/revenue": "Revenue",
    "/vendor/printers": "Printers",
    "/vendor/orders": "Orders",
    "/vendor/qr": "QR Codes",
    "/vendor/points": "Points",
    "/vendor/transactions": "Transactions",
    "/vendor/bank-account": "Bank Account",
    "/vendor/kyc": "KYC & Verification",
    "/vendor/support": "Support",
    "/settings": "Settings",
  };

  const activeLabel = Object.entries(pathLabels).find(([path]) => pathname === path || pathname.startsWith(path + "/"))?.[1] || "Console";
  // Sidebar only shifts the content on desktop; on mobile/tablet it overlays.
  const mainML = collapsed ? "lg:ml-[64px]" : "lg:ml-[224px]";

  return (
    <div className="min-h-screen bg-white">
      <Sidebar
        user={user}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onOpenSettings={openSettings}
        logout={logout}
      />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} initialTab={settingsTab} />

      {/* ── Main content ── */}
      <div className={`${mainML} min-h-screen flex flex-col transition-[margin] duration-200`}>
        <header className="h-14 px-4 sm:px-6 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger — mobile/tablet only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex lg:hidden w-9 h-9 -ml-1 rounded-lg items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
              title="Open menu"
              aria-label="Open menu"
            >
              <LuMenu size={20} />
            </button>
            <div className="flex items-center gap-1.5 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-300 font-medium">Prinsta</span>
              <span className="hidden sm:inline text-slate-200">/</span>
              <span className="font-semibold text-slate-700 truncate">{activeLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <span className="text-[11px] font-bold text-slate-500 bg-tint-lavender px-2.5 py-1 rounded-lg border border-slate-200/70 uppercase tracking-wide">
              {user?.role || "—"}
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
