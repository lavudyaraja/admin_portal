/**
 * The small set of building blocks every console page is assembled from.
 * Kept deliberately plain — no component library — so the pastel palette stays
 * the only thing deciding how the console looks.
 */
import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { LuTrendingUp, LuTrendingDown } from "react-icons/lu";
import { TINT, type TintName } from "@/lib/console/theme";
import { count as fmtCount } from "@/lib/console/format";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

// ── Card ──────────────────────────────────────────────────────────────────────

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("bg-white border border-slate-200 rounded-2xl", className)}>{children}</div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-100">
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-slate-800 truncate">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────────────────

/**
 * One headline number. The tint is a full-bleed surface, so the value sits in
 * slate-900 rather than the tint's own hue — pastels have nowhere near enough
 * contrast to carry text themselves.
 */
export function StatTile({
  label,
  value,
  icon: Icon,
  tint,
  delta,
  hint,
}: {
  label: string;
  value: string;
  icon: IconType;
  tint: TintName;
  /** Percent change vs. the previous period. Omit when there's nothing to compare. */
  delta?: number;
  hint?: string;
}) {
  const t = TINT[tint];
  return (
    <div className={cx(t.bg, "rounded-2xl p-4 border border-slate-200/60 flex flex-col gap-3")}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-tight">
          {label}
        </span>
        <span className={cx("w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center shrink-0", t.ink)}>
          <Icon size={16} />
        </span>
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">{value}</p>
        <div className="flex items-center gap-1.5 mt-1 min-h-[18px]">
          {delta !== undefined && <Delta value={delta} />}
          {hint && <span className="text-[11px] text-slate-400 truncate">{hint}</span>}
        </div>
      </div>
    </div>
  );
}

/** Signed percent change. Colour is semantic (up = good), not from the palette. */
export function Delta({ value }: { value: number }) {
  const up = value >= 0;
  const Icon = up ? LuTrendingUp : LuTrendingDown;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 text-[11px] font-bold tabular-nums",
        up ? "text-emerald-600" : "text-rose-500"
      )}
    >
      <Icon size={12} />
      {up ? "+" : ""}
      {value}%
    </span>
  );
}

// ── Chip ──────────────────────────────────────────────────────────────────────

export function Chip({ label, tint }: { label: string; tint: TintName }) {
  const t = TINT[tint];
  return (
    <span
      className={cx(
        t.bg,
        "inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-700 border border-slate-200/70 whitespace-nowrap"
      )}
    >
      {label}
    </span>
  );
}

/** Order/printer status → tint. Anything unrecognised falls back to gray. */
const STATUS_TINT: Record<string, TintName> = {
  COMPLETED: "mint",
  PAID: "sky",
  PRINTING: "lavender",
  PENDING_PAYMENT: "gold",
  QUEUED: "ice",
  FAILED: "blush",
  CANCELLED: "peach",
  ONLINE: "mint",
  OFFLINE: "gray",
  ERROR: "blush",
  MAINTENANCE: "gold",
  OPEN: "gold",
  IN_PROGRESS: "sky",
  RESOLVED: "mint",
  CLOSED: "gray",
};

export function StatusChip({ status }: { status: string }) {
  return <Chip label={status.replace(/_/g, " ")} tint={STATUS_TINT[status] || "gray"} />;
}

// ── Progress bar ──────────────────────────────────────────────────────────────

/** Consumable level (paper/toner). Turns amber then rose as it runs down. */
export function LevelBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const fill = pct <= 20 ? "bg-rose-400" : pct <= 50 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={cx("h-full rounded-full transition-[width]", fill)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-bold text-slate-500 tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-100">
            {head.map((h) => (
              <th
                key={h}
                className="text-left px-5 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ className, children }: { className?: string; children: ReactNode }) {
  return <td className={cx("px-5 py-3 text-slate-600 align-middle", className)}>{children}</td>;
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">{children}</tr>;
}

// ── Empty / loading / error states ────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, hint }: { icon: IconType; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <span className="w-11 h-11 rounded-2xl bg-tint-gray flex items-center justify-center text-slate-400 mb-3">
        <Icon size={20} />
      </span>
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {hint && <p className="text-xs text-slate-400 mt-1 max-w-xs">{hint}</p>}
    </div>
  );
}

/** Shimmer placeholder sized to whatever it replaces. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-lg bg-slate-100", className)} />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <p className="text-sm font-semibold text-slate-700">Couldn&apos;t load this</p>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ── Page header ───────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div className="min-w-0">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Small count badge used next to section titles. */
export function Pill({ n }: { n: number }) {
  return (
    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-bold tabular-nums">
      {fmtCount(n)}
    </span>
  );
}
