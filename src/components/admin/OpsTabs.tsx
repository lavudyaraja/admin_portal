"use client";

// The Operations tab strip.
//
// The strip itself now lives in components/console/Tabs — the vendor console
// needs the same thing, and two copies is how they drift apart. These aliases
// stay so the Operations pages keep their existing names.

import type { IconType } from "react-icons";
import { ConsoleTabs, useTab, type ConsoleTab } from "@/components/console/Tabs";

export type OpsTab = ConsoleTab;
export const useOpsTab = useTab;
export const OpsTabs = ConsoleTabs;

/**
 * Used where a sub-section has no record behind it. It names what is missing
 * instead of rendering an empty list, which an operator would read as
 * "nothing needs doing".
 */
export function NoRecord({ icon, title, needs }: { icon: IconType; title: string; needs: string }) {
  const Icon = icon;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-10">
      <div className="text-center max-w-md mx-auto">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <Icon size={22} />
        </div>
        <p className="font-bold text-slate-800">{title}</p>
        <p className="text-sm text-slate-400 mt-1.5">{needs}</p>
        <p className="text-[11px] text-slate-400 mt-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          This is empty because the data doesn&apos;t exist yet — not because there is nothing to do.
        </p>
      </div>
    </div>
  );
}
