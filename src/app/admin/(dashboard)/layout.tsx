"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LuMenu } from "react-icons/lu";
import { apiFetch, getToken, clearToken, isOperatorRole, type OperatorUser } from "@/lib/admin/api";
import AdminSidebar from "@/components/admin/AdminSidebar";

const pathLabels: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/revenue": "Revenue",
  "/admin/vendors": "Vendors",
  "/admin/printers": "Printers",
  "/admin/orders": "Orders",
  "/admin/users": "Users",
  "/admin/transactions": "Transactions",
  "/admin/support": "Support",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<OperatorUser | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Verify the session once on mount. The sidebar navigates client-side, so the
  // layout is not remounted between pages and this does not re-run per page.
  const verify = useCallback(async () => {
    try {
      const res = await apiFetch<{ user: OperatorUser }>("/auth/me");
      if (!isOperatorRole(res.user?.role)) {
        // A vendor (OPERATOR) signing in here would see every vendor's data.
        clearToken();
        router.replace("/admin/login?denied=1");
        return;
      }
      setUser(res.user);
    } catch {
      clearToken();
      router.replace("/admin/login");
    }
  }, [router]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/admin/login");
      return;
    }
    verify();
  }, [router, verify]);

  function logout() {
    clearToken();
    router.replace("/admin/login");
  }

  const activeLabel =
    Object.entries(pathLabels).find(
      ([path]) => pathname === path || pathname.startsWith(path + "/")
    )?.[1] || "Console";

  // The sidebar only shifts content on desktop; on mobile it overlays.
  const mainML = collapsed ? "lg:ml-[64px]" : "lg:ml-[224px]";

  return (
    <div className="min-h-screen bg-white">
      <AdminSidebar
        user={user}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        logout={logout}
      />

      <div className={`${mainML} min-h-screen flex flex-col transition-[margin] duration-200`}>
        <header className="h-14 px-4 sm:px-6 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex lg:hidden w-9 h-9 -ml-1 rounded-lg items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
              title="Open menu"
              aria-label="Open menu"
            >
              <LuMenu size={20} />
            </button>
            <div className="flex items-center gap-1.5 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-300 font-medium">Prinsta Ops</span>
              <span className="hidden sm:inline text-slate-200">/</span>
              <span className="font-semibold text-slate-700 truncate">{activeLabel}</span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-tint-lavender px-2.5 py-1 rounded-lg border border-slate-200/70 uppercase tracking-wide">
            Platform {user?.role || "—"}
          </span>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
