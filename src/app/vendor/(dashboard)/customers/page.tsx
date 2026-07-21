"use client";

// Customers, as one page with a view per tab.
//
// All three views come off the same grouped endpoint, so separate routes meant
// three fetches of identical data to answer one question. As tabs they share it.
//
// Reviews & Ratings stays its own route: it is not a cut of the customer list,
// it has its own two-way UI (what customers said about you, and the customers
// you can still rate), and it writes as well as reads.

import { Suspense } from "react";
import { LuUsers, LuUserCheck, LuStar, LuClock } from "react-icons/lu";
import { ConsoleTabs, useTab, type ConsoleTab } from "@/components/console/Tabs";
import { PageHeader } from "@/components/console/primitives";
import {
  CustomerListView, FrequentCustomersView, CustomerHistoryView,
} from "@/components/vendor/customers/views";

const TABS: ConsoleTab[] = [
  { id: "list", label: "Customer List", icon: LuUsers },
  { id: "frequent", label: "Frequent", icon: LuUserCheck },
  // In the strip for continuity with the sidebar grouping, but it has its own
  // route — it writes as well as reads, and isn't a cut of the customer list.
  { id: "reviews", label: "Reviews & Ratings", icon: LuStar, href: "/vendor/ratings" },
  { id: "history", label: "History", icon: LuClock },
];

function CustomersPageBody() {
  const tab = useTab("list");

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader title="Customers" subtitle="Who prints at your shop, and how often." />

      <ConsoleTabs tabs={TABS} active={tab} basePath="/vendor/customers" />

      {tab === "frequent" && <FrequentCustomersView />}
      {tab === "history" && <CustomerHistoryView />}
      {/* An unrecognised ?tab= falls back to the full list rather than a blank
          page — a stale bookmark should still show something useful. */}
      {(tab === "list" || !TABS.some((t) => t.id === tab)) && <CustomerListView />}
    </div>
  );
}

/** `useSearchParams` needs a Suspense boundary or the route can't prerender. */
export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <CustomersPageBody />
    </Suspense>
  );
}
