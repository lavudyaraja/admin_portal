"use client";

// Printers, as one page with a view per tab.
//
// All six views read the same two endpoints, so making them separate routes
// meant six page loads to answer one question ("which machine needs me?"). As
// tabs they share a fetch and switching is instant.
//
// The tab still lives in the URL, so the sidebar's six printer entries each
// point at a real destination and a bookmark survives a reload.

import { Suspense } from "react";
import {
  LuPrinter, LuActivity, LuHeartPulse, LuLayers, LuDroplet, LuWrench,
} from "react-icons/lu";
import { ConsoleTabs, useTab, type ConsoleTab } from "@/components/console/Tabs";
import { PageHeader } from "@/components/console/primitives";
import { AllPrintersView } from "@/components/vendor/printers/AllPrintersView";
import {
  StatusView, HealthView, PaperView, InkView, MaintenanceView,
} from "@/components/vendor/printers/views";

const TABS: ConsoleTab[] = [
  { id: "all", label: "All Printers", icon: LuPrinter },
  { id: "status", label: "Status", icon: LuActivity },
  { id: "health", label: "Health", icon: LuHeartPulse },
  { id: "paper", label: "Paper", icon: LuLayers },
  { id: "ink", label: "Ink", icon: LuDroplet },
  { id: "maintenance", label: "Maintenance", icon: LuWrench },
];

function PrintersPageBody() {
  const tab = useTab("all");

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader title="Printers" subtitle="Your machines, and what each one needs." />

      <ConsoleTabs tabs={TABS} active={tab} basePath="/vendor/printers" />

      {tab === "status" && <StatusView />}
      {tab === "health" && <HealthView />}
      {tab === "paper" && <PaperView />}
      {tab === "ink" && <InkView />}
      {tab === "maintenance" && <MaintenanceView />}
      {/* An unrecognised ?tab= falls back to the full list rather than a blank
          page — a stale bookmark should still show something useful. */}
      {(tab === "all" || !TABS.some((t) => t.id === tab)) && <AllPrintersView />}
    </div>
  );
}

/** `useSearchParams` needs a Suspense boundary or the route can't prerender. */
export default function PrintersPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <PrintersPageBody />
    </Suspense>
  );
}
