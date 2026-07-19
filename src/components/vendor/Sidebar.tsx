"use client";

import {
  LuLayoutGrid,
  LuTrendingUp,
  LuPrinter,
  LuFileText,
  LuQrCode,
  LuWifi,
  LuUsers,
  LuCoins,
  LuHistory,
  LuBanknote,
  LuCircleHelp,
  LuStore,
} from "react-icons/lu";
import ConsoleSidebar, { type NavGroup } from "@/components/console/ConsoleSidebar";
import type { AdminUser } from "@/lib/vendor/api";

const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/vendor/dashboard", icon: LuLayoutGrid },
      { label: "Revenue", href: "/vendor/revenue", icon: LuTrendingUp },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Printers", href: "/vendor/printers", icon: LuPrinter },
      { label: "Orders", href: "/vendor/orders", icon: LuFileText },
      { label: "QR Codes", href: "/vendor/qr", icon: LuQrCode },
      { label: "Wi-Fi QR", href: "/vendor/wifi-qr", icon: LuWifi },
    ],
  },
  {
    label: "Users & Payments",
    items: [
      { label: "Users", href: "/vendor/users", icon: LuUsers },
      { label: "Points", href: "/vendor/points", icon: LuCoins },
      { label: "Transactions", href: "/vendor/transactions", icon: LuHistory },
      { label: "Bank Account", href: "/vendor/bank-account", icon: LuBanknote },
    ],
  },
  {
    label: "System",
    items: [{ label: "Support", href: "/vendor/support", icon: LuCircleHelp }],
  },
];

/** The vendor console's nav, on the shared sidebar chrome. */
export default function Sidebar({
  user,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  onOpenSettings,
  logout,
}: {
  user: AdminUser | null;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenSettings: (tab?: string) => void;
  logout: () => void;
}) {
  return (
    <ConsoleSidebar
      brand={{ icon: LuStore, name: "Prinsta", suffix: "Vendor" }}
      navGroups={NAV}
      user={user}
      fallbackName="Vendor"
      roleLabel={user?.role === "ADMIN" ? "Platform ADMIN" : "Shop owner"}
      onOpenSettings={() => onOpenSettings()}
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      mobileOpen={mobileOpen}
      setMobileOpen={setMobileOpen}
      logout={logout}
    />
  );
}
