"use client";

// Support, from the shop owner's side: raise a request with the Prinsta
// operator and read the replies. This page used to render the platform-wide
// triage queue over an ADMIN-only route — a real vendor got a 403, and staff
// signed into the vendor console saw every other shop's tickets. Triage now
// lives only on the admin portal.

import { useEffect, useState, useCallback } from "react";
import { LuLifeBuoy, LuSend, LuInbox, LuMessageSquare, LuCircleCheck } from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import { dateTime } from "@/lib/console/format";
import { PageHeader, Card, Skeleton, EmptyState } from "@/components/console/primitives";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  reply: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusTone: Record<string, string> = {
  OPEN: "bg-amber-50 text-amber-700 border-amber-200",
  IN_PROGRESS: "bg-sky-50 text-sky-700 border-sky-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-slate-100 text-slate-500 border-slate-200",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
        statusTone[status] || statusTone.CLOSED
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-400 transition-all";

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ tickets: Ticket[] }>("/support/me");
      setTickets(res.tickets || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await apiFetch("/support/me", { method: "POST", body: { subject, message } });
      setSubject("");
      setMessage("");
      setSent(true);
      await load();
      // The banner is transient — the new ticket in the list below is the
      // durable confirmation that it worked.
      setTimeout(() => setSent(false), 4000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not send your request.");
    }
    setSending(false);
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Support"
        subtitle="Raise a request with the Prinsta team and track the replies."
      />

      {/* ── Compose ── */}
      <Card className="p-5 sm:p-6 mb-5">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="w-9 h-9 rounded-xl bg-tint-lavender flex items-center justify-center">
            <LuLifeBuoy size={17} className="text-ink-lavender" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Need a hand?</h2>
            <p className="text-[11px] text-slate-400">
              Printer trouble, payouts, account questions — the operator team answers here.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            className={inputCls}
            placeholder="Subject — e.g. Printer PRN-ICVVVT keeps going offline"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={160}
          />
          <textarea
            className={`${inputCls} resize-y min-h-28`}
            placeholder="Describe what's happening, and what you've already tried."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={4000}
          />

          {error && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {sent && (
            <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <LuCircleCheck size={14} /> Sent. We&apos;ll reply here.
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending || subject.trim().length < 4 || message.trim().length < 10}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              <LuSend size={15} /> {sending ? "Sending…" : "Send request"}
            </button>
          </div>
        </form>
      </Card>

      {/* ── Thread ── */}
      <div className="flex items-center gap-2 mb-3">
        <LuInbox size={15} className="text-slate-400" />
        <h2 className="text-sm font-bold text-slate-800">Your requests</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-10">
          <EmptyState
            icon={LuMessageSquare}
            title="No requests yet"
            hint="Anything you send the operator team will appear here with their reply."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm">{t.subject}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{dateTime(t.createdAt)}</p>
                </div>
                <StatusPill status={t.status} />
              </div>

              <p className="text-sm text-slate-600 mt-3 whitespace-pre-wrap">{t.message}</p>

              {t.reply ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Prinsta team
                  </p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{t.reply}</p>
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-400 italic">Awaiting a reply from the team.</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
