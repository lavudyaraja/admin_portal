"use client";

// A shop's ratings, both directions.
//
// "My rating" is what students said about this shop — read-only, and only the
// visible ones, because a rating staff took down is not something the shop
// should be able to work backwards from.
//
// "Rate customers" is the other half: completed orders where this shop hasn't
// rated the student yet. It exists so a no-show or someone who jams a machine
// and walks off leaves a trace the next shop can see.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LuStar, LuRefreshCw, LuUser, LuMessageSquare, LuCircleCheck, LuSend,
} from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import { count, dateTime } from "@/lib/console/format";
import {
  Card, CardHeader, Skeleton, ErrorState, EmptyState, PageHeader, StatTile,
} from "@/components/console/primitives";
import {
  RatingCard, RatingSummaryCard, Stars, tagLabel,
  type RatingRow, type RatingSummary,
} from "@/components/console/ratings";

interface PendingOrder {
  id: string;
  orderCode: string;
  createdAt: string;
  updatedAt: string;
  pagesToPrint: number;
  user: { id: string; name: string; ratingAvg: number; ratingCount: number } | null;
  printer: { id: string; name: string; locationName: string } | null;
}

interface TagOption {
  value: string;
  label: string;
  negative: boolean;
}

type Tab = "received" | "give";

export default function VendorRatingsPage() {
  const [tab, setTab] = useState<Tab>("received");

  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [received, setReceived] = useState<RatingRow[]>([]);
  const [pending, setPending] = useState<PendingOrder[]>([]);
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]);
  const [maxTags, setMaxTags] = useState(4);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // The rating form, for whichever order is open.
  const [active, setActive] = useState<PendingOrder | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mine, todo, catalog] = await Promise.all([
        apiFetch<{ summary: RatingSummary; ratings: RatingRow[] }>("/ratings/received"),
        apiFetch<{ orders: PendingOrder[] }>("/ratings/pending"),
        apiFetch<{ tags: TagOption[]; maxTags: number }>("/ratings/tags"),
      ]);
      setSummary(mine.summary);
      setReceived(mine.ratings || []);
      setPending(todo.orders || []);
      setTagOptions(catalog.tags || []);
      setMaxTags(catalog.maxTags || 4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openForm(order: PendingOrder) {
    setActive(order);
    setStars(0);
    setComment("");
    setTags([]);
  }

  function toggleTag(value: string) {
    setTags((prev) =>
      prev.includes(value)
        ? prev.filter((t) => t !== value)
        : // Silently ignore a tap past the cap rather than showing an error —
          // the chips visibly stop responding, which explains itself.
          prev.length >= maxTags
          ? prev
          : [...prev, value]
    );
  }

  async function submit() {
    if (!active || stars < 1) return;
    setSaving(true);
    try {
      await apiFetch(`/ratings/orders/${active.id}`, {
        method: "POST",
        body: { stars, comment: comment.trim() || undefined, tags },
      });
      setActive(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save that rating.");
    }
    setSaving(false);
  }

  const withComments = useMemo(() => received.filter((r) => r.comment).length, [received]);

  return (
    <>
      <PageHeader
        title="Ratings"
        subtitle="What customers say about your shop — and what you say about them."
        action={
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
          >
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[116px] rounded-2xl" />)
        ) : (
          <>
            <StatTile
              label="Your rating"
              value={summary?.count ? summary.average.toFixed(1) : "—"}
              icon={LuStar}
              tint={!summary?.count ? "gray" : summary.average >= 4 ? "mint" : summary.average >= 3 ? "gold" : "blush"}
              hint={summary?.count ? `${count(summary.count)} ratings` : "no ratings yet"}
            />
            <StatTile
              label="With a comment"
              value={count(withComments)}
              icon={LuMessageSquare}
              tint="sky"
              hint="customers who wrote something"
            />
            <StatTile
              label="To rate"
              value={count(pending.length)}
              icon={LuUser}
              tint={pending.length > 0 ? "gold" : "gray"}
              hint="customers awaiting your rating"
            />
            <StatTile
              label="5-star"
              value={count(summary?.breakdown?.["5"] ?? 0)}
              icon={LuCircleCheck}
              tint="lime"
              hint="top marks"
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-5">
        <div className="flex gap-1 overflow-x-auto">
          {([
            { id: "received" as Tab, label: "My ratings", icon: LuStar, n: received.length },
            { id: "give" as Tab, label: "Rate customers", icon: LuUser, n: pending.length },
          ]).map((t) => {
            const on = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
                  on
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon size={15} className={on ? "text-slate-700" : "text-slate-400"} />
                {t.label}
                {t.n > 0 && (
                  <span className="ml-0.5 text-[10px] font-bold tabular-nums bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5">
                    {t.n}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <Card>
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </Card>
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={load} />
        </Card>
      ) : tab === "received" ? (
        <div className="space-y-3">
          <Card>
            <RatingSummaryCard
              summary={summary}
              title="Shop rating"
              emptyHint="No ratings yet."
            />
          </Card>
          <Card>
            {received.length === 0 ? (
              <EmptyState
                icon={LuStar}
                title="No ratings yet"
                hint="Customers can rate your shop once their print completes."
              />
            ) : (
              <div>
                {received.map((r) => (
                  <RatingCard key={r.id} rating={r} subject="user" />
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader
            title="Customers you can rate"
            subtitle="Completed orders from the last 30 days that you haven't rated."
          />
          {pending.length === 0 ? (
            <EmptyState
              icon={LuCircleCheck}
              title="Nothing waiting"
              hint="Once an order completes, the customer shows up here for you to rate."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {pending.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {o.user?.name || "A customer"}
                      </p>
                      {/* Their standing across every shop, so a known problem
                          customer is obvious before you decide what to write. */}
                      {o.user && o.user.ratingCount > 0 && (
                        <Stars value={o.user.ratingAvg} size={11} count={o.user.ratingCount} />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono">{o.orderCode}</span> · {o.pagesToPrint} pages ·{" "}
                      {dateTime(o.updatedAt)}
                      {o.printer ? ` · ${o.printer.name}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => openForm(o)}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-xl px-3 py-2 transition-colors cursor-pointer"
                  >
                    <LuStar size={13} /> Rate
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Rating form */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono text-xs text-slate-400">{active.orderCode}</p>
            <h2 className="font-bold text-slate-900 mb-1">
              Rate {active.user?.name || "this customer"}
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Only you and platform staff see who wrote a rating. The customer sees the stars.
            </p>

            {/* Stars */}
            <div className="flex items-center justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setStars(n)}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  className="p-1 cursor-pointer transition-transform hover:scale-110"
                >
                  <LuStar
                    size={30}
                    className={n <= stars ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                  />
                </button>
              ))}
            </div>

            {/* Tags */}
            {tagOptions.length > 0 && (
              <>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  What stood out? <span className="font-normal normal-case">(up to {maxTags})</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {tagOptions.map((t) => {
                    const on = tags.includes(t.value);
                    return (
                      <button
                        key={t.value}
                        onClick={() => toggleTag(t.value)}
                        className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                          on
                            ? t.negative
                              ? "bg-rose-600 border-rose-600 text-white"
                              : "bg-emerald-600 border-emerald-600 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {t.label || tagLabel(t.value)}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Anything to add?
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Optional."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 transition-colors resize-y"
            />

            <div className="flex gap-2 mt-5">
              <button
                onClick={submit}
                disabled={saving || stars < 1}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <LuSend size={14} /> {stars < 1 ? "Pick a rating" : "Submit"}
              </button>
              <button
                onClick={() => setActive(null)}
                className="inline-flex items-center justify-center border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 text-center">
              A rating can&apos;t be changed once submitted.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
