"use client";

// Contact Support — raise a ticket with the platform.
//
// Name and email aren't on this form. They come from the signed-in account
// server-side, because they identify who is asking and a form field would let
// somebody raise a ticket as someone else. The reply comes back on the Tickets
// page, not by email.
import { useState } from "react";
import { LuSend, LuCircleCheck, LuBookOpen, LuTicket } from "react-icons/lu";
import Link from "next/link";
import { apiFetch } from "@/lib/vendor/api";
import { Card, CardHeader, PageHeader } from "@/components/console/primitives";

const inputCls =
  "w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-400 transition-all";

/** Prefills that save the most typing, based on what shops actually write in. */
const TOPICS = [
  { label: "Payout problem", subject: "Payout issue" },
  { label: "Verification", subject: "Shop verification" },
  { label: "Printer trouble", subject: "Printer not working correctly" },
  { label: "Refund dispute", subject: "Refund request dispute" },
  { label: "Something else", subject: "" },
];

export default function ContactSupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    setSending(true);
    setError("");
    try {
      await apiFetch("/support/me", {
        method: "POST",
        body: { subject: subject.trim(), message: message.trim() },
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that. Please try again.");
    }
    setSending(false);
  }

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <PageHeader title="Contact Support" subtitle="Your request has been raised." />
        <Card className="p-8">
          <div className="text-center max-w-sm mx-auto">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <LuCircleCheck size={22} />
            </div>
            <p className="font-bold text-slate-800">Ticket raised</p>
            <p className="text-sm text-slate-400 mt-1.5">
              A person will read this and reply. The answer shows up on your Tickets page — not by
              email, so check back there.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-5">
              <Link
                href="/vendor/support"
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
              >
                <LuTicket size={14} /> View my tickets
              </Link>
              <button
                onClick={() => {
                  setSent(false);
                  setSubject("");
                  setMessage("");
                }}
                className="inline-flex items-center gap-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Raise another
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <PageHeader
        title="Contact Support"
        subtitle="Raise a ticket with the platform team."
        action={
          <Link
            href="/vendor/support/help"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors"
          >
            <LuBookOpen size={13} /> Help Center
          </Link>
        }
      />

      <Card>
        <CardHeader
          title="What's the problem?"
          subtitle="Pick a topic to prefill the subject, or write your own."
        />
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <button
                key={t.label}
                onClick={() => setSubject(t.subject)}
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-slate-300 transition-colors cursor-pointer"
              >
                {t.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="One line — what this is about"
              className={inputCls}
              maxLength={160}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Details
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 4000))}
              rows={7}
              placeholder="What happened, and what you expected instead. Include an order code or printer ID if there is one — it's the fastest way for us to find the problem."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-400 transition-all resize-y"
            />
            <p className="text-[11px] text-slate-400 text-right mt-1 tabular-nums">
              {message.length}/4000
            </p>
          </div>

          {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

          <button
            onClick={send}
            disabled={sending || subject.trim().length < 4 || message.trim().length < 10}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold px-4 py-3 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <LuSend size={14} /> {sending ? "Sending…" : "Raise ticket"}
          </button>

          <p className="text-[11px] text-slate-400 text-center">
            Your name and account details are attached automatically — no need to include them.
          </p>
        </div>
      </Card>
    </div>
  );
}
