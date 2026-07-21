"use client";

// Ratings moderation.
//
// Both directions in one queue — students rating shops, and shops rating
// students. They are moderated together because the interesting cases are pairs:
// a one-star review usually has the shop's own account of the same order sitting
// next to it, and reading either alone gets the wrong answer often enough to
// matter.
//
// Staff can hide a rating, and un-hide it. There is deliberately no edit and no
// delete: moderation here is about what gets displayed, not about rewriting what
// somebody said.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuStar, LuStore, LuUser, LuEyeOff, LuEye, LuRefreshCw, LuTriangleAlert, LuMessageSquare,
} from "react-icons/lu";
import { apiFetch } from "@/lib/admin/api";
import { count, dateTime } from "@/lib/console/format";
import { useList } from "@/lib/console/useList";
import { StatRow } from "@/components/admin/StatRow";
import { ListToolbar, Pagination } from "@/components/console/ListToolbar";
import {
  Card, Table, Td, Tr, Chip, Skeleton, ErrorState, EmptyState, PageHeader, StatTile,
} from "@/components/console/primitives";
import { Stars, TagChips, starTint, type RatingRow } from "@/components/console/ratings";

interface RatingStats {
  total: number;
  hidden: number;
  lowStars: number;
  vendorRatings: { count: number; average: number };
  userRatings: { count: number; average: number };
}

const DIRECTION_OPTIONS = [
  { value: "USER_TO_VENDOR", label: "Students rating shops" },
  { value: "VENDOR_TO_USER", label: "Shops rating students" },
];

function RatingsPageBody() {
  // `useList` drives search + paging; its one filter slot is spent on direction,
  // which is the split that changes what a row means. Status and star cutoff are
  // separate query params below.
  const list = useList<RatingRow>(apiFetch, "/admin/ratings", "ratings", "direction");
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [rows, setRows] = useState<RatingRow[]>([]);
  const [active, setActive] = useState<RatingRow | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setStats(await apiFetch<RatingStats>("/admin/ratings/stats"));
    } catch {
      // The tiles are context, not the page. A failed stats call shouldn't take
      // the moderation queue down with it.
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // `useList` owns search/direction/paging. Status and the low-star cutoff are
  // applied client-side over the page it fetched, so switching them doesn't cost
  // a round trip — and the row counts stay small enough that it doesn't matter.
  useEffect(() => {
    let next = list.rows;
    if (statusFilter) next = next.filter((r) => r.status === statusFilter);
    if (lowOnly) next = next.filter((r) => r.stars <= 2);
    setRows(next);
  }, [list.rows, statusFilter, lowOnly]);

  async function setVisibility(rating: RatingRow, hidden: boolean) {
    setSaving(true);
    try {
      await apiFetch(`/admin/ratings/${rating.id}`, {
        method: "PATCH",
        body: { status: hidden ? "HIDDEN" : "VISIBLE", reason: reason.trim() || undefined },
      });
      setActive(null);
      setReason("");
      list.reload();
      loadStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not update that rating.");
    }
    setSaving(false);
  }

  return (
    <>
      <PageHeader
        title="Ratings"
        subtitle="What students say about shops, and what shops say about students."
        action={
          <button
            onClick={() => {
              list.reload();
              loadStats();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
          >
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      <StatRow loading={!stats}>
        {stats && (
          <>
            <StatTile
              label="Shop rating"
              value={stats.vendorRatings.average ? stats.vendorRatings.average.toFixed(1) : "—"}
              icon={LuStore}
              tint="mint"
              hint={`${count(stats.vendorRatings.count)} from students`}
            />
            <StatTile
              label="Student rating"
              value={stats.userRatings.average ? stats.userRatings.average.toFixed(1) : "—"}
              icon={LuUser}
              tint="sky"
              hint={`${count(stats.userRatings.count)} from shops`}
            />
            <StatTile
              label="1–2 star"
              value={count(stats.lowStars)}
              icon={LuTriangleAlert}
              tint={stats.lowStars > 0 ? "gold" : "gray"}
              hint="visible, needs a look"
            />
            <StatTile
              label="Hidden"
              value={count(stats.hidden)}
              icon={LuEyeOff}
              tint="lavender"
              hint={`of ${count(stats.total)} total`}
            />
          </>
        )}
      </StatRow>

      <ListToolbar
        search={list.search}
        setSearch={list.setSearch}
        placeholder="Search comments, order code, shop or student…"
        filter={list.filter}
        setFilter={list.setFilter}
        filterLabel="directions"
        options={DIRECTION_OPTIONS}
      />

      <div className="flex flex-wrap items-center gap-2 mb-4 -mt-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Visibility"
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none focus:border-slate-400 transition-colors cursor-pointer"
        >
          <option value="">Visible and hidden</option>
          <option value="VISIBLE">Visible only</option>
          <option value="HIDDEN">Hidden only</option>
        </select>

        <button
          onClick={() => setLowOnly((v) => !v)}
          className={
            lowOnly
              ? "inline-flex items-center gap-1.5 text-xs font-bold text-white bg-rose-600 border border-rose-600 rounded-xl px-3 py-2 transition-colors cursor-pointer"
              : "inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
          }
        >
          <LuTriangleAlert size={13} /> 1–2 star only
        </button>
      </div>

      <Card>
        {list.loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={LuStar}
            title="No ratings here"
            hint="Ratings appear once an order completes and either side leaves one."
          />
        ) : (
          <>
            <Table head={["Rating", "From → About", "Comment", "Order", "When", "Action"]}>
              {rows.map((r) => {
                const fromShop = r.direction === "VENDOR_TO_USER";
                return (
                  <Tr key={r.id}>
                    <Td>
                      <Stars value={r.stars} size={13} />
                      <span className="block mt-1">
                        <Chip label={`${r.stars}★`} tint={starTint(r.stars)} />
                      </span>
                    </Td>

                    <Td className="text-xs">
                      {/* Direction is read left-to-right: author, then subject. */}
                      <span className="flex items-center gap-1.5 text-slate-700">
                        {fromShop ? <LuStore size={12} /> : <LuUser size={12} />}
                        {fromShop ? (
                          r.vendor ? (
                            <Link
                              href={`/admin/management/vendors/${r.vendor.id}`}
                              className="hover:underline truncate max-w-[120px]"
                            >
                              {r.vendor.shopName}
                            </Link>
                          ) : "—"
                        ) : r.user ? (
                          <Link
                            href={`/admin/management/users/${r.user.id}`}
                            className="hover:underline truncate max-w-[120px]"
                          >
                            {r.user.name}
                          </Link>
                        ) : "—"}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                        <span className="w-3 text-center">↳</span>
                        {fromShop ? (
                          r.user ? (
                            <Link
                              href={`/admin/management/users/${r.user.id}`}
                              className="hover:underline truncate max-w-[120px]"
                            >
                              {r.user.name}
                            </Link>
                          ) : "—"
                        ) : r.vendor ? (
                          <Link
                            href={`/admin/management/vendors/${r.vendor.id}`}
                            className="hover:underline truncate max-w-[120px]"
                          >
                            {r.vendor.shopName}
                          </Link>
                        ) : "—"}
                      </span>
                    </Td>

                    <Td className="max-w-[260px]">
                      {r.comment ? (
                        <p className="text-slate-600 text-xs line-clamp-2">{r.comment}</p>
                      ) : (
                        <span className="text-slate-300 text-xs">no comment</span>
                      )}
                      {r.tags.length > 0 && (
                        <span className="block mt-1.5">
                          <TagChips tags={r.tags.slice(0, 2)} />
                        </span>
                      )}
                    </Td>

                    <Td className="font-mono text-[11px] text-slate-500">
                      {r.order?.orderCode || "—"}
                    </Td>

                    <Td className="text-slate-400 text-xs whitespace-nowrap">
                      {dateTime(r.createdAt)}
                    </Td>

                    <Td>
                      <button
                        onClick={() => {
                          setActive(r);
                          setReason(r.hiddenReason || "");
                        }}
                        className="text-[11px] font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-2 py-1 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {r.status === "HIDDEN" ? "Hidden" : "Review"}
                      </button>
                    </Td>
                  </Tr>
                );
              })}
            </Table>
            <Pagination page={list.page} setPage={list.setPage} total={list.total} />
          </>
        )}
      </Card>

      {/* Moderation drawer */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <p className="font-mono text-xs text-slate-400">
                  {active.order?.orderCode || "no order code"}
                </p>
                <h2 className="font-bold text-slate-900">
                  {active.direction === "VENDOR_TO_USER"
                    ? `${active.vendor?.shopName || "A shop"} → ${active.user?.name || "a student"}`
                    : `${active.user?.name || "A student"} → ${active.vendor?.shopName || "a shop"}`}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{dateTime(active.createdAt)}</p>
              </div>
              <Stars value={active.stars} size={15} showValue />
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 mb-4">
              {active.comment ? (
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{active.comment}</p>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  Stars only — no comment was written.
                </p>
              )}
              {active.tags.length > 0 && (
                <div className="mt-3">
                  <TagChips tags={active.tags} />
                </div>
              )}
            </div>

            {active.author && (
              <p className="text-xs text-slate-500 mb-4">
                Written by {active.author.name}
                {active.author.email ? ` · ${active.author.email}` : ""} ·{" "}
                {active.author.role.toLowerCase()}
              </p>
            )}

            {active.status === "HIDDEN" && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 mb-4">
                <p className="text-xs font-bold text-rose-800">Currently hidden</p>
                <p className="text-xs text-rose-700 mt-0.5">
                  {active.hiddenReason || "No reason recorded."}
                  {active.hiddenAt ? ` · ${dateTime(active.hiddenAt)}` : ""}
                </p>
              </div>
            )}

            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Reason (internal)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why this is being hidden. Staff-only — the author never sees it."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 transition-colors resize-y"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Hiding drops this rating out of the public list and out of the average. The row
              stays, so the author still counts as having rated and can&apos;t simply post it again.
            </p>

            <div className="flex flex-wrap gap-2 mt-5">
              {active.status === "VISIBLE" ? (
                <button
                  onClick={() => setVisibility(active, true)}
                  disabled={saving}
                  className="flex-1 min-w-32 inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LuEyeOff size={14} /> Hide rating
                </button>
              ) : (
                <button
                  onClick={() => setVisibility(active, false)}
                  disabled={saving}
                  className="flex-1 min-w-32 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LuEye size={14} /> Restore
                </button>
              )}
              <button
                onClick={() => setActive(null)}
                className="inline-flex items-center justify-center gap-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {active.order && (
              <Link
                href={`/admin/management/orders?search=${encodeURIComponent(active.order.orderCode)}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mt-4 transition-colors"
              >
                <LuMessageSquare size={12} /> Open the order behind this rating
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * `useList` reads the URL for its state, so this needs a Suspense boundary —
 * without one the production build fails to prerender the route.
 */
export default function RatingsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <RatingsPageBody />
    </Suspense>
  );
}
