"use client";

import {
  LuLayoutGrid,
  LuTrendingUp,
  LuStore,
  LuPrinter,
  LuFileText,
  LuUsers,
  LuHistory,
  LuCircleHelp,
  LuShieldCheck,
} from "react-icons/lu";
import ConsoleSidebar, { type NavGroup } from "@/components/console/ConsoleSidebar";
import type { OperatorUser } from "@/lib/admin/api";

const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LuLayoutGrid },
      { label: "Revenue", href: "/admin/revenue", icon: LuTrendingUp },
    ],
  },
  {
    label: "Network",
    items: [
      { label: "Vendors", href: "/admin/vendors", icon: LuStore },
      { label: "Printers", href: "/admin/printers", icon: LuPrinter },
    ],
  },
  {
    label: "Activity",
    items: [
      { label: "Orders", href: "/admin/orders", icon: LuFileText },
      { label: "Users", href: "/admin/users", icon: LuUsers },
      { label: "Transactions", href: "/admin/transactions", icon: LuHistory },
    ],
  },
  {
    label: "System",
    items: [{ label: "Support", href: "/admin/support", icon: LuCircleHelp }],
  },
];

/** The admin console's nav, on the shared sidebar chrome. */
export default function AdminSidebar({
  user,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  logout,
}: {
  user: OperatorUser | null;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  logout: () => void;
}) {
  return (
    <ConsoleSidebar
      brand={{ icon: LuShieldCheck, name: "Prinsta", suffix: "Ops" }}
      navGroups={NAV}
      user={user}
      fallbackName="Operator"
      roleLabel={`Platform ${user?.role || ""}`.trim()}
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      mobileOpen={mobileOpen}
      setMobileOpen={setMobileOpen}
      logout={logout}
    />
  );
}
