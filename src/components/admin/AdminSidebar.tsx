"use client";

import {
  LuLayoutGrid,
  LuTrendingUp,
  LuStore,
  LuPrinter,
  LuFileText,
  LuUsers,
  LuHistory,
  LuGift,
  LuBanknote,
  LuUndo2,
  LuCircleHelp,
  LuListOrdered,
  LuActivity,
  LuBadgeCheck,
  LuScale,
  LuPercent,
  LuWallet,
  LuChartPie,
  LuChartColumn,
  LuFileChartColumn,
  LuBell,
  LuScrollText,
  LuLock,
  LuSettings,
  LuShieldCheck,
  LuStar,
} from "react-icons/lu";
import ConsoleSidebar, { type NavGroup } from "@/components/console/ConsoleSidebar";
import type { OperatorUser } from "@/lib/admin/api";

/**
 * The operator console's nav.
 *
 * `soon: true` marks a section that is planned but has no page yet — it renders
 * dimmed and doesn't navigate. Keeping the whole structure visible is the point
 * of the layout, but a link that 404s is worse than one that says it isn't
 * ready. Drop the flag as each page lands.
 */
const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/admin/dashboard", icon: LuLayoutGrid }],
  },
  {
    label: "Management",
    items: [
      { label: "Users", href: "/admin/management/users", icon: LuUsers },
      { label: "Vendors", href: "/admin/management/vendors", icon: LuStore },
      { label: "Printers", href: "/admin/management/printers", icon: LuPrinter },
      { label: "Orders", href: "/admin/management/orders", icon: LuFileText },
      { label: "Ratings", href: "/admin/management/ratings", icon: LuStar },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Print Queue", href: "/admin/operations/print-queue", icon: LuListOrdered },
      { label: "Printer Health", href: "/admin/operations/printer-health", icon: LuActivity },
      { label: "Verifications", href: "/admin/operations/verifications", icon: LuBadgeCheck },
      { label: "Disputes", href: "/admin/operations/disputes", icon: LuScale },
      { label: "Refund Requests", href: "/admin/operations/refund-requests", icon: LuUndo2 },
      { label: "Support", href: "/admin/operations/support", icon: LuCircleHelp },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Revenue", href: "/admin/finance/revenue", icon: LuTrendingUp },
      { label: "Transactions", href: "/admin/finance/transactions", icon: LuHistory },
      { label: "Refunds", href: "/admin/finance/refunds", icon: LuUndo2 },
      { label: "Commissions", href: "/admin/finance/commissions", icon: LuPercent },
      { label: "Payouts", href: "/admin/finance/payouts", icon: LuWallet },
      { label: "Bank Accounts", href: "/admin/bank-accounts", icon: LuBanknote },
    ],
  },
//   {
//     label: "Analytics",
//     items: [
//       { label: "Overview", href: "/admin/analytics", icon: LuChartPie, soon: true },
//       { label: "Users", href: "/admin/analytics/users", icon: LuUsers, soon: true },
//       { label: "Vendors", href: "/admin/analytics/vendors", icon: LuStore, soon: true },
//       { label: "Printing", href: "/admin/analytics/printing", icon: LuChartColumn, soon: true },
//       { label: "Referrals", href: "/admin/referrals", icon: LuGift },
//       { label: "Reports", href: "/admin/reports", icon: LuFileChartColumn, soon: true },
//     ],
//   },
  {
    label: "System",
    items: [
      { label: "Notifications", href: "/admin/system/notifications", icon: LuBell },
      { label: "Logs", href: "/admin/system/logs", icon: LuScrollText },
      { label: "Security", href: "/admin/system/security", icon: LuLock },
      { label: "Settings", href: "/admin/system/settings", icon: LuSettings },
    ],
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
