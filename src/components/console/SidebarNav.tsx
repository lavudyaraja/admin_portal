"use client";

/**
 * The sidebar's nav list.
 *
 * Split out of ConsoleSidebar for one reason: it reads `useSearchParams` to
 * work out which item is current, and Next requires anything that does to sit
 * under a Suspense boundary. Left inline, every page rendering the sidebar
 * failed to prerender.
 */
import { useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cx } from "./primitives";
import type { NavGroup } from "./ConsoleSidebar";

export function SidebarNav({
  navGroups,
  collapsed,
  setMobileOpen,
}: {
  navGroups: NavGroup[];
  collapsed: boolean;
  setMobileOpen: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  /**
   * Which nav item is the current one.
   *
   * Several items can share a pathname now that Orders, Printers and Customers
   * are one page each with a tab per view — `/vendor/orders?tab=ready` and
   * `?tab=completed` are the same route. So the match is pathname first, then
   * the `tab` query.
   *
   * When the URL carries no tab (a bare `/vendor/orders`, or a child route like
   * `/vendor/printers/add`), the first item pointing at that pathname wins —
   * that is the tab the page itself defaults to, so the highlight agrees with
   * what is on screen.
   */

  // Does any nav item point exactly at the current pathname? If so, a prefix
  // match must not also light up — otherwise `/vendor/shop` (Shop Profile) would
  // highlight alongside `/vendor/shop/hours` (Operating Hours), because the
  // former is a path prefix of the latter. The exact match wins; the parent
  // stays dark.
  const exactMatchExists = navGroups
    .flatMap((g) => g.items)
    .some((i) => i.href.split("?")[0] === pathname);

  const isActive = useCallback(
    (href: string): boolean => {
      const [path, query] = href.split("?");

      if (path === pathname) {
        // Exact path. If the item names a tab, it only lights up for that tab.
        const itemTab = query ? new URLSearchParams(query).get("tab") : null;
        if (!itemTab) return true;
        if (currentTab) return currentTab === itemTab;
        // No tab in the URL — the first item for this pathname is the default.
        const firstForPath = navGroups
          .flatMap((g) => g.items)
          .find((i) => i.href.split("?")[0] === path);
        return firstForPath?.href === href;
      }

      // Not an exact match. Only light up as the parent of a child route
      // (e.g. All Printers for /vendor/printers/[id]), and only when no other
      // item matches the pathname exactly — a sibling page under a shared prefix
      // must not drag its parent's highlight on.
      if (!exactMatchExists && pathname.startsWith(path + "/")) return true;
      return false;
    },
    [pathname, currentTab, navGroups, exactMatchExists]
  );

  return (
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
            const active = isActive(item.href);
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
  );
}
