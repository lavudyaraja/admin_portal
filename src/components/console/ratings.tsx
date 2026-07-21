"use client";

/**
 * Rating building blocks, shared by both consoles.
 *
 * Lives alongside the other console primitives rather than under `admin/` or
 * `vendor/` because the same star row and the same histogram appear in the
 * moderation queue, on a vendor's profile, and on a shop's own ratings page —
 * and a rating that renders differently depending on who is looking at it is
 * how two people end up describing the same review to each other and disagreeing.
 */
import { LuStar, LuFlag } from "react-icons/lu";
import { Chip, cx } from "./primitives";
import type { TintName } from "@/lib/console/theme";

// ── Vocabulary, mirrored from backend/src/ratings/types.ts ──────────────────
// Duplicated rather than imported: the consoles don't share a build with the
// backend. The backend is the authority — it validates and drops unknown tags —
// so a tag missing here degrades to its raw name rather than breaking a page.

export const TAG_LABELS: Record<string, string> = {
  PRINT_QUALITY: "Good print quality",
  FAST_SERVICE: "Fast service",
  CLEAN_SHOP: "Clean shop",
  HELPFUL_STAFF: "Helpful staff",
  FAIR_PRICING: "Fair pricing",
  SLOW_SERVICE: "Slow service",
  RUDE_STAFF: "Rude staff",
  MACHINE_ISSUES: "Machine problems",
  OVERCHARGED: "Overcharged",
  POLITE: "Polite",
  ON_TIME_PICKUP: "Collected on time",
  CLEAR_INSTRUCTIONS: "Clear instructions",
  NO_SHOW: "Never collected",
  RUDE_BEHAVIOUR: "Rude behaviour",
  MISUSED_MACHINE: "Misused the machine",
  WASTED_PAPER: "Wasted paper",
};

const NEGATIVE_TAGS = new Set([
  "SLOW_SERVICE", "RUDE_STAFF", "MACHINE_ISSUES", "OVERCHARGED",
  "NO_SHOW", "RUDE_BEHAVIOUR", "MISUSED_MACHINE", "WASTED_PAPER",
]);

export function tagLabel(tag: string): string {
  return TAG_LABELS[tag] || tag.replace(/_/g, " ").toLowerCase();
}

export interface RatingRow {
  id: string;
  direction: "USER_TO_VENDOR" | "VENDOR_TO_USER";
  stars: number;
  comment: string | null;
  tags: string[];
  status: "VISIBLE" | "HIDDEN";
  createdAt: string;
  orderId: string;
  userId: string;
  vendorId: string;
  authorId: string;
  order: { id: string; orderCode: string; createdAt: string } | null;
  user: { id: string; name: string } | null;
  vendor: { id: string; shopName: string } | null;
  // Present only on the admin (moderation) shape.
  hiddenReason?: string | null;
  hiddenById?: string | null;
  hiddenAt?: string | null;
  author?: { id: string; name: string; email: string | null; role: string } | null;
}

export interface RatingSummary {
  average: number;
  count: number;
  breakdown: Record<string, number>;
}

// ── Stars ───────────────────────────────────────────────────────────────────

/**
 * A read-only star row. Half-stars aren't drawn — an average of 4.3 shows four
 * filled stars with the number beside it, because a half-lit glyph reads as a
 * rendering artifact at this size more often than it reads as precision.
 */
export function Stars({
  value,
  size = 14,
  showValue = false,
  count,
}: {
  value: number;
  size?: number;
  showValue?: boolean;
  count?: number;
}) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <LuStar
            key={n}
            size={size}
            className={n <= filled ? "fill-amber-400 text-amber-400" : "text-slate-300"}
          />
        ))}
      </span>
      {showValue && (
        <span className="text-xs font-bold text-slate-700 tabular-nums">
          {value > 0 ? value.toFixed(1) : "—"}
        </span>
      )}
      {count !== undefined && (
        <span className="text-[11px] text-slate-400 tabular-nums">({count})</span>
      )}
    </span>
  );
}

/** Star count → tint. Low scores read warm, so a bad row is visible at a glance. */
export function starTint(stars: number): TintName {
  if (stars >= 5) return "mint";
  if (stars === 4) return "lime";
  if (stars === 3) return "gold";
  if (stars === 2) return "peach";
  return "blush";
}

// ── Summary ─────────────────────────────────────────────────────────────────

/**
 * Average plus the 1–5 histogram.
 *
 * The histogram is the point: an average alone can't tell "everyone thought it
 * was fine" apart from "half loved it and half were furious", and those two
 * shops need entirely different attention.
 */
export function RatingSummaryCard({
  summary,
  title = "Rating",
  emptyHint = "No ratings yet.",
}: {
  summary: RatingSummary | null | undefined;
  title?: string;
  emptyHint?: string;
}) {
  const total = summary?.count ?? 0;

  return (
    <div className="flex flex-col sm:flex-row gap-5 p-5">
      <div className="flex flex-col items-center justify-center gap-1.5 sm:w-40 shrink-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
        <p className="text-4xl font-black text-slate-900 tabular-nums leading-none">
          {total > 0 ? (summary?.average ?? 0).toFixed(1) : "—"}
        </p>
        <Stars value={summary?.average ?? 0} size={15} />
        <p className="text-[11px] text-slate-400 tabular-nums">
          {total === 0 ? emptyHint : `${total} rating${total === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = summary?.breakdown?.[String(star)] ?? 0;
          // Bars are a share of the total, so an empty subject shows five empty
          // rails rather than dividing by zero.
          const pct = total > 0 ? (n / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2.5">
              <span className="text-[11px] font-bold text-slate-500 tabular-nums w-3 text-right">
                {star}
              </span>
              <LuStar size={11} className="text-amber-400 fill-amber-400 shrink-0" />
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cx(
                    "h-full rounded-full transition-[width]",
                    star >= 4 ? "bg-emerald-400" : star === 3 ? "bg-amber-400" : "bg-rose-400"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400 tabular-nums w-8">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tags ────────────────────────────────────────────────────────────────────

export function TagChips({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Chip key={tag} label={tagLabel(tag)} tint={NEGATIVE_TAGS.has(tag) ? "blush" : "mint"} />
      ))}
    </div>
  );
}

// ── One rating, as a card ───────────────────────────────────────────────────

/**
 * A single rating in full. `subject` picks which side of the pair to name in the
 * header — a shop's own page wants the customer's name, a customer's profile
 * wants the shop's.
 */
export function RatingCard({
  rating,
  subject = "auto",
  action,
}: {
  rating: RatingRow;
  /** Whose name to headline. "auto" follows the rating's direction. */
  subject?: "auto" | "user" | "vendor";
  action?: React.ReactNode;
}) {
  const who =
    subject === "user"
      ? rating.user?.name
      : subject === "vendor"
        ? rating.vendor?.shopName
        : rating.direction === "USER_TO_VENDOR"
          ? rating.user?.name
          : rating.vendor?.shopName;

  return (
    <div
      className={cx(
        "p-4 border-b border-slate-100 last:border-b-0",
        rating.status === "HIDDEN" && "bg-slate-50/70"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Stars value={rating.stars} size={13} />
            <span className="text-sm font-bold text-slate-800 truncate">{who || "Someone"}</span>
            {rating.status === "HIDDEN" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-600">
                <LuFlag size={10} /> Hidden
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {rating.order?.orderCode && (
              <span className="font-mono">{rating.order.orderCode} · </span>
            )}
            {new Date(rating.createdAt).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {rating.comment && (
        <p className="text-sm text-slate-700 whitespace-pre-wrap mb-2">{rating.comment}</p>
      )}

      <TagChips tags={rating.tags} />

      {rating.status === "HIDDEN" && rating.hiddenReason && (
        <p className="text-[11px] text-rose-600 mt-2">
          Hidden by staff — {rating.hiddenReason}
        </p>
      )}
    </div>
  );
}
