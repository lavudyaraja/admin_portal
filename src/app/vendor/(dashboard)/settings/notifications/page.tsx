"use client";

// Notification settings.
//
// One switch is real: `emailNotifications` on the account, which the backend
// actually checks before sending. The in-console alerts below it are described
// honestly as always-on, because they are — there is no per-type preference
// stored anywhere, and rendering four toggles that do nothing would be worse
// than one that works next to an explanation.
import { useCallback, useEffect, useState } from "react";
import {
  LuBell, LuMail, LuUndo2, LuStar, LuPrinter, LuWallet, LuCheck,
} from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import {
  Card, CardHeader, Skeleton, ErrorState, PageHeader, cx,
} from "@/components/console/primitives";

interface Me {
  id: string;
  name: string;
  email: string | null;
  emailNotifications: boolean;
}

/** What the console notifies about today. All of these are always on. */
const IN_CONSOLE = [
  {
    icon: LuUndo2,
    title: "Refund requests",
    body: "A customer asks for their money back on one of your orders.",
  },
  {
    icon: LuStar,
    title: "New ratings",
    body: "A customer rates your shop after a print.",
  },
  {
    icon: LuPrinter,
    title: "Printer problems",
    body: "A machine reports an error, runs out of paper, or stops checking in.",
  },
  {
    icon: LuWallet,
    title: "Payouts",
    body: "A payout is drawn up, transferred, or fails.",
  },
];

export default function NotificationSettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ user: Me }>("/auth/me");
      setMe(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleEmail() {
    if (!me) return;
    const next = !me.emailNotifications;

    // Optimistic: the switch moves immediately and rolls back if the save
    // fails. A toggle that lags behind the finger reads as broken.
    setMe({ ...me, emailNotifications: next });
    setSaving(true);
    setSaved(false);
    try {
      await apiFetch("/auth/me", { method: "PATCH", body: { emailNotifications: next } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setMe({ ...me, emailNotifications: !next });
      setError(err instanceof Error ? err.message : "Could not save that change.");
    }
    setSaving(false);
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <PageHeader title="Notifications" subtitle="How the platform reaches you." />

      {loading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : error && !me ? (
        <Card>
          <ErrorState message={error} onRetry={load} />
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader title="Email" subtitle="Sent to the address on your account." />
            <div className="flex items-center gap-3 p-5">
              <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                <LuMail size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">Email notifications</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {me?.email
                    ? `Sent to ${me.email}`
                    : "No email on your account — add one in Account Settings first."}
                </p>
              </div>

              <button
                onClick={toggleEmail}
                disabled={saving || !me?.email}
                role="switch"
                aria-checked={!!me?.emailNotifications}
                aria-label="Email notifications"
                className={cx(
                  "relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                  me?.emailNotifications ? "bg-emerald-500" : "bg-slate-300"
                )}
              >
                <span
                  className={cx(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-[left] shadow-sm",
                    me?.emailNotifications ? "left-[22px]" : "left-0.5"
                  )}
                />
              </button>
            </div>
            {saved && (
              <p className="px-5 pb-4 -mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1">
                <LuCheck size={13} /> Saved
              </p>
            )}
            {error && me && <p className="px-5 pb-4 -mt-2 text-xs text-rose-600">{error}</p>}
          </Card>

          <Card>
            <CardHeader
              title="In-console alerts"
              subtitle="Always on — these can't be turned off."
            />
            <div className="divide-y divide-slate-100">
              {IN_CONSOLE.map((n) => {
                const Icon = n.icon;
                return (
                  <div key={n.title} className="flex items-center gap-3 p-4">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{n.body}</p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 shrink-0">On</span>
                  </div>
                );
              })}
            </div>
            <p className="px-5 py-3 border-t border-slate-100 text-[11px] text-slate-400">
              There is no per-type preference stored yet, so these are all on for every shop. Only
              the email switch above actually changes anything.
            </p>
          </Card>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5">
            <LuBell size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Turning email off doesn&apos;t stop refund requests reaching you — they still appear in
              the console. It just means nobody emails you when one arrives, so check the queue.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
