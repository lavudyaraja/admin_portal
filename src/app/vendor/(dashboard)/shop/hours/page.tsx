"use client";

// Opening hours, a week at a time.
//
// The whole week is saved in one request — the server validates and stores it
// as a single blob, so a half-saved week is not a state that can exist. A day
// marked closed keeps its times, so a shop that shuts Sundays for a month and
// reopens them doesn't have to retype anything.
import { useCallback, useEffect, useState } from "react";
import { LuCalendarClock, LuSave, LuCopy } from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import {
  Card, CardHeader, Skeleton, ErrorState, PageHeader, cx,
} from "@/components/console/primitives";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

type Week = Record<DayKey, DayHours>;

const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

/** What a shop that has never set hours starts from. */
const DEFAULT_WEEK: Week = {
  mon: { open: "09:00", close: "20:00", closed: false },
  tue: { open: "09:00", close: "20:00", closed: false },
  wed: { open: "09:00", close: "20:00", closed: false },
  thu: { open: "09:00", close: "20:00", closed: false },
  fri: { open: "09:00", close: "20:00", closed: false },
  sat: { open: "09:00", close: "18:00", closed: false },
  sun: { open: "10:00", close: "14:00", closed: true },
};

export default function OperatingHoursPage() {
  const [week, setWeek] = useState<Week>(DEFAULT_WEEK);
  const [everSet, setEverSet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ hours: Week | null }>("/vendors/me/hours");
      if (res.hours) {
        setWeek(res.hours);
        setEverSet(true);
      } else {
        // Never set. Show the default as a starting point, but say so rather
        // than letting it read as the shop's actual hours.
        setWeek(DEFAULT_WEEK);
        setEverSet(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your opening hours.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function update(day: DayKey, patch: Partial<DayHours>) {
    setWeek((w) => ({ ...w, [day]: { ...w[day], ...patch } }));
    setSaved(false);
  }

  /** Copy Monday across the working week — the most common shape by far. */
  function applyMondayToWeekdays() {
    setWeek((w) => ({
      ...w,
      tue: { ...w.mon },
      wed: { ...w.mon },
      thu: { ...w.mon },
      fri: { ...w.mon },
    }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setFormError("");
    setSaved(false);
    try {
      await apiFetch("/vendors/me/hours", { method: "PUT", body: { hours: week } });
      setEverSet(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save your opening hours.");
    }
    setSaving(false);
  }

  const openDays = DAYS.filter((d) => !week[d.key].closed).length;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <PageHeader
        title="Operating Hours"
        subtitle="When your shop is open. Customers see this before they walk over."
        action={
          <button
            onClick={applyMondayToWeekdays}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
          >
            <LuCopy size={13} /> Monday → Mon–Fri
          </button>
        }
      />

      {loading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={load} />
        </Card>
      ) : (
        <>
          {!everSet && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5">
              <LuCalendarClock size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                You haven&apos;t set opening hours yet. These are suggested defaults — adjust them
                and save, and customers will see them.
              </p>
            </div>
          )}

          <Card>
            <CardHeader
              title="Weekly schedule"
              subtitle={`Open ${openDays} day${openDays === 1 ? "" : "s"} a week.`}
            />
            <div className="divide-y divide-slate-100">
              {DAYS.map(({ key, label }) => {
                const day = week[key];
                return (
                  <div key={key} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <p className="w-24 text-sm font-bold text-slate-800 shrink-0">{label}</p>

                    <button
                      onClick={() => update(key, { closed: !day.closed })}
                      className={cx(
                        "text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 w-20",
                        day.closed
                          ? "bg-slate-100 border-slate-200 text-slate-500"
                          : "bg-emerald-50 border-emerald-200 text-emerald-700"
                      )}
                    >
                      {day.closed ? "Closed" : "Open"}
                    </button>

                    {/* Times stay mounted while closed, just dimmed — a closed
                        day keeps its hours for when it reopens. */}
                    <div
                      className={cx(
                        "flex items-center gap-2 transition-opacity",
                        day.closed && "opacity-40 pointer-events-none"
                      )}
                    >
                      <input
                        type="time"
                        value={day.open}
                        onChange={(e) => update(key, { open: e.target.value })}
                        className="h-9 px-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-slate-400 transition-colors tabular-nums"
                      />
                      <span className="text-xs text-slate-400">to</span>
                      <input
                        type="time"
                        value={day.close}
                        onChange={(e) => update(key, { close: e.target.value })}
                        className="h-9 px-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-slate-400 transition-colors tabular-nums"
                      />
                    </div>

                    {!day.closed && day.close <= day.open && (
                      <span className="text-[11px] font-semibold text-rose-600">
                        Closing must be after opening
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-100">
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
              >
                <LuSave size={14} /> {saving ? "Saving…" : "Save hours"}
              </button>
              {saved && <span className="text-xs font-bold text-emerald-600">Saved</span>}
              {formError && <span className="text-xs font-semibold text-rose-600">{formError}</span>}
            </div>
          </Card>

          <p className="text-[11px] text-slate-400 px-1">
            Overnight hours aren&apos;t supported — a shift that crosses midnight would display as
            open &ldquo;20:00 to 09:00&rdquo;, which reads backwards. Split it across two days if you
            need to.
          </p>
        </>
      )}
    </div>
  );
}
