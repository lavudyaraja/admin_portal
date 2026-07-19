"use client";

// The tab strip every Operations page uses.
//
// Each of these pages is one queue under several views — extracting the strip
// keeps them from drifting apart in spacing or scroll behaviour, and puts the
// active tab in the URL so a view can be linked to and survives a reload.

import { useRouter, useSearchParams } from "next/navigation";
import type { IconType } from "react-icons";

export interface OpsTab {
  id: string;
  label: string;
  icon: IconType;
  /** Shown as a count chip next to the label. */
  count?: number;
}

export function useOpsTab(fallback: string): string {
  const params = useSearchParams();
  return params.get("tab") || fallback;
}

export function OpsTabs({ tabs, active, basePath }: { tabs: OpsTab[]; active: string; basePath: string }) {
  const router = useRouter();

  return (
    <div className="mb-4 -mx-1 overflow-x-auto">
      <div className="flex gap-1 px-1 min-w-max border-b border-slate-200">
        {tabs.map((t) => {
          const on = active === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => router.replace(`${basePath}?tab=${t.id}`, { scroll: false })}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
                on ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon size={15} className={on ? "text-slate-700" : "text-slate-400"} />
              {t.label}
              {typeof t.count === "number" && t.count > 0 && (
                <span
                  className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded ${
                    on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
