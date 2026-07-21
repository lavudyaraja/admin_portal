"use client";

import {
  LuLayoutGrid,
  LuTrendingUp,
  LuPrinter,
  LuFileText,
  LuQrCode,
  LuCoins,
  LuHistory,
  LuBanknote,
  LuStore,
  LuUsers,
  LuWallet,
  LuScale,
  LuUndo2,
  LuBuilding,
  LuCalendarClock,
  LuUserCog,
  LuGitBranch,
  LuTicket,
  LuBookOpen,
  LuMail,
  LuPercent,
} from "react-icons/lu";
import ConsoleSidebar, { type NavGroup } from "@/components/console/ConsoleSidebar";
import type { AdminUser } from "@/lib/vendor/api";

/**
 * The vendor console's nav.
 *
 * Orders, Printers and Customers are one entry each. The views that used to be
 * listed under them — the order queues, the fleet views, frequent customers and
 * ratings — are tabs on those pages now, so the nav stays short enough to scan
 * on a phone and every view is still one tap from it.
 *
 * Hrefs are bare paths with no `?tab=`: each page defaults to its "all" tab, so
 * there is nothing for the link to pin. See components/console/Tabs.
 */
const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/vendor/dashboard", icon: LuLayoutGrid }],
  },
  {
    label: "Operations",
    items: [
      { label: "All Orders", href: "/vendor/orders", icon: LuFileText },
      { label: "All Printers", href: "/vendor/printers", icon: LuPrinter },
      { label: "Customers", href: "/vendor/customers", icon: LuUsers },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Revenue", href: "/vendor/revenue", icon: LuTrendingUp },
      { label: "Earnings", href: "/vendor/finance/earnings", icon: LuCoins },
      { label: "Payments", href: "/vendor/finance/payments", icon: LuWallet },
      { label: "Transactions", href: "/vendor/transactions", icon: LuHistory },
      { label: "Payouts", href: "/vendor/finance/payouts", icon: LuBanknote },
      { label: "Refund Requests", href: "/vendor/finance/refund-requests", icon: LuUndo2 },
      { label: "Settlement Reports", href: "/vendor/finance/settlements", icon: LuScale },
    ],
  },
  {
    label: "Shop",
    items: [
      { label: "Shop Profile", href: "/vendor/shop", icon: LuBuilding },
      { label: "Operating Hours", href: "/vendor/shop/hours", icon: LuCalendarClock },
      { label: "Staff Management", href: "/vendor/shop/staff", icon: LuUserCog },
      { label: "QR Codes", href: "/vendor/qr", icon: LuQrCode },
      { label: "Branches", href: "/vendor/shop/branches", icon: LuGitBranch },
    ],
  },
  {
    label: "Support",
    items: [
      { label: "Tickets", href: "/vendor/support", icon: LuTicket },
      { label: "Help Center", href: "/vendor/support/help", icon: LuBookOpen },
      { label: "Contact Support", href: "/vendor/support/contact", icon: LuMail },
    ],
  },
  {
    // Account and notification preferences aren't here — they live in the
    // profile menu's Settings dialog (the AccountTab / NotificationsTab), which
    // is where a shop owner already goes to change their name or sign out.
    // Duplicating them in the sidebar meant two doors to the same room.
    label: "Settings",
    items: [
      { label: "Bank Accounts", href: "/vendor/bank-account", icon: LuBanknote },
      { label: "Pricing Rules", href: "/vendor/settings/pricing", icon: LuPercent },
    ],
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
      helpHref="/vendor/support"
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      mobileOpen={mobileOpen}
      setMobileOpen={setMobileOpen}
      logout={logout}
    />
  );
}
