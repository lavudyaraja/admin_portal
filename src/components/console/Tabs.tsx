"use client";

/**
 * The tab strip both consoles use.
 *
 * The active tab lives in the URL (`?tab=`) rather than in component state, for
 * three reasons that all matter: a view can be linked to, it survives a reload,
 * and the sidebar can point its sub-items straight at a tab. That last one is
 * why this is shared — the vendor nav lists five order queues, and each has to
 * be a real destination.
 *
 * `router.replace` rather than `push`, so flipping through tabs doesn't fill the
 * back stack with states nobody wants to walk back through.
 */
import { useRouter, useSearchParams } from "next/navigation";
import type { IconType } from "react-icons";
import { cx } from "./primitives";

export interface ConsoleTab {
  id: string;
  label: string;
  icon: IconType;
  /** Shown as a count chip next to the label. Zero renders nothing. */
  count?: number;
  /**
   * Navigate here instead of switching `?tab=`. For a section that belongs in
   * the strip for continuity but lives at its own route — the alternative is
   * dropping it from the strip, which makes the nav and the tabs disagree.
   */
  href?: string;
}

/** The tab from the URL, or `fallback` when there isn't one. */
export function useTab(fallback: string): string {
  const params = useSearchParams();
  return params.get("tab") || fallback;
}

export function ConsoleTabs({
  tabs,
  active,
  basePath,
}: {
  tabs: ConsoleTab[];
  active: string;
  basePath: string;
}) {
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
              onClick={() =>
                t.href
                  ? router.push(t.href)
                  : router.replace(`${basePath}?tab=${t.id}`, { scroll: false })
              }
              className={cx(
                "inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer",
                on
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <Icon size={15} className={on ? "text-slate-700" : "text-slate-400"} />
              {t.label}
              {typeof t.count === "number" && t.count > 0 && (
                <span
                  className={cx(
                    "text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded",
                    on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                  )}
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
