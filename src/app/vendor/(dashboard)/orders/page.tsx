"use client";

// Orders, as one page with a queue per tab.
//
// The active queue lives in the URL (`?tab=`), so the sidebar's five order
// entries each point at a real destination and a bookmark still lands where it
// did yesterday — what separate routes gave us, without five pages that were
// the same component with a different status list.
//
// "All" carries a status dropdown too, because once every order is on one
// screen the useful question stops being "which queue" and becomes "find this
// one".

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  LuLayers, LuInbox, LuLoader, LuPrinterCheck, LuCircleCheck, LuCircleX,
  LuClipboardList, LuIndianRupee,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import { apiFetch } from "@/lib/vendor/api";
import { count, inrCompact } from "@/lib/console/format";
import { ConsoleTabs, useTab, type ConsoleTab } from "@/components/console/Tabs";
import { PageHeader, StatTile, Skeleton } from "@/components/console/primitives";
import { OrderQueue } from "@/components/vendor/orders/OrderQueue";

interface Metrics {
  totalOrders: number;
  completedOrders: number;
  failedOrders: number;
  cancelledOrders: number;
  dailyOrders: number;
  totalRevenuePaise: number;
}

interface Queue {
  title: string;
  subtitle: string;
  statuses: string[];
  icon: IconType;
  emptyTitle: string;
  emptyHint: string;
}

/** Each tab is a queue: which statuses it covers, and how it introduces itself. */
const QUEUES: Record<string, Queue> = {
  all: {
    title: "All Orders",
    subtitle: "Every print order across your printers.",
    statuses: ["PENDING_PAYMENT", "PAID", "READY", "PRINTING", "COMPLETED", "FAILED", "CANCELLED"],
    icon: LuLayers,
    emptyTitle: "No orders yet",
    emptyHint: "Orders appear here as soon as customers start printing.",
  },
  new: {
    title: "New Orders",
    subtitle: "Paid for and waiting to be picked up by a printer.",
    // PENDING_PAYMENT is deliberately absent: an order nobody has paid for is
    // not work, and surfacing it here would have shops chasing abandoned carts.
    statuses: ["PAID"],
    icon: LuInbox,
    emptyTitle: "No new orders",
    emptyHint: "Orders appear here the moment a customer pays.",
  },
  processing: {
    title: "Processing",
    subtitle: "Jobs a printer is working on right now.",
    statuses: ["PRINTING"],
    icon: LuLoader,
    emptyTitle: "Nothing printing",
    emptyHint: "An order shows here while its pages are actually running.",
  },
  ready: {
    title: "Ready to Print",
    subtitle: "Files are ready and queued at a printer, waiting to start.",
    statuses: ["READY"],
    icon: LuPrinterCheck,
    emptyTitle: "Nothing queued",
    emptyHint: "Orders land here once the file is prepared and sent to a machine.",
  },
  completed: {
    title: "Completed",
    subtitle: "Prints that finished and were collected.",
    statuses: ["COMPLETED"],
    icon: LuCircleCheck,
    emptyTitle: "No completed orders yet",
    emptyHint: "Finished prints appear here, and count towards your revenue.",
  },
  cancelled: {
    title: "Cancelled & Failed",
    subtitle: "Orders that were cancelled, and prints that failed.",
    // One queue, not two: the shop's next action for both is the same — work
    // out whether a machine caused it — and splitting them would hide a failing
    // printer across two half-empty screens.
    statuses: ["CANCELLED", "FAILED"],
    icon: LuCircleX,
    emptyTitle: "Nothing cancelled",
    emptyHint: "Cancelled orders and failed prints appear here.",
  },
};

function OrdersPageBody() {
  const tab = useTab("all");
  const queue = QUEUES[tab] || QUEUES.all;
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  // Loaded once and independent of the tab: the summary describes the whole
  // account, so it must not move when someone switches queue below it.
  const loadMetrics = useCallback(async () => {
    try {
      setMetrics(await apiFetch<Metrics>("/vendors/me/stats"));
    } catch {
      // Tiles are context, not the page. A failed stats call shouldn't take the
      // order queues down with it.
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const inProgress = metrics
    ? Math.max(
        0,
        metrics.totalOrders - metrics.completedOrders - metrics.failedOrders - metrics.cancelledOrders
      )
    : 0;

  const tabs: ConsoleTab[] = useMemo(
    () => [
      { id: "all", label: "All", icon: LuLayers, count: metrics?.totalOrders },
      { id: "new", label: "New", icon: LuInbox },
      { id: "processing", label: "Processing", icon: LuLoader },
      { id: "ready", label: "Ready to Print", icon: LuPrinterCheck },
      { id: "completed", label: "Completed", icon: LuCircleCheck, count: metrics?.completedOrders },
      {
        id: "cancelled",
        label: "Cancelled",
        icon: LuCircleX,
        count: metrics ? metrics.failedOrders + metrics.cancelledOrders : undefined,
      },
    ],
    [metrics]
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader title="Orders" subtitle="Every print order across your printers." />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {!metrics ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[116px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatTile
              label="Total orders"
              value={count(metrics.totalOrders)}
              icon={LuClipboardList}
              tint="lavender"
              hint={`${count(metrics.dailyOrders)} today`}
            />
            <StatTile
              label="Completed"
              value={count(metrics.completedOrders)}
              icon={LuCircleCheck}
              tint="mint"
              hint={
                metrics.totalOrders > 0
                  ? `${Math.round((metrics.completedOrders / metrics.totalOrders) * 100)}% of all orders`
                  : undefined
              }
            />
            <StatTile
              label="In progress"
              value={count(inProgress)}
              icon={LuLoader}
              tint="gold"
              hint="awaiting or printing"
            />
            <StatTile
              label="Revenue"
              value={inrCompact(metrics.totalRevenuePaise)}
              icon={LuIndianRupee}
              tint="sky"
              hint="from completed orders"
            />
          </>
        )}
      </section>

      <ConsoleTabs tabs={tabs} active={tab} basePath="/vendor/orders" />

      {/* Keyed by tab so switching queue remounts, rather than showing the
          previous queue's rows under the new heading while it loads. */}
      <OrderQueue
        key={tab}
        title={queue.title}
        subtitle={queue.subtitle}
        statuses={queue.statuses}
        icon={queue.icon}
        emptyTitle={queue.emptyTitle}
        emptyHint={queue.emptyHint}
        showStatusFilter={tab === "all"}
        hideHeader
      />
    </div>
  );
}

/**
 * The tab lives in the URL, so this reads `useSearchParams`. Next needs that
 * behind a Suspense boundary or the route can't be prerendered — without it the
 * production build fails outright.
 */
export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <OrdersPageBody />
    </Suspense>
  );
}
