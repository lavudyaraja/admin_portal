"use client";

import { useEffect, useRef, useState } from "react";
import {
  LuX,
  LuSend,
  LuSparkles,
  LuMessageCircle,
  LuRotateCcw,
} from "react-icons/lu";

/**
 * The Prinsta assistant.
 *
 * A launcher in the corner of every public page, opening a support thread that
 * answers questions about Prinsta — without making the reader leave the section
 * they are on to go and find the FAQ.
 *
 * Answers come from `/api/assistant`, which calls the model server-side; the
 * API key never reaches the browser. The response is streamed and rendered
 * token by token, so the reader sees the answer forming instead of watching a
 * spinner for several seconds.
 */

interface Message {
  id: number;
  from: "user" | "bot";
  text: string;
  /** True while this message is still being streamed in. */
  pending?: boolean;
}

const GREETING =
  "Hi! I'm the Prinsta assistant. Ask me about printing, pricing, Points or how your files are handled.";

const SUGGESTIONS = [
  "How does printing work?",
  "Is my file safe?",
  "What does it cost?",
  "How do Points work?",
];

const ERROR_TEXT =
  "Sorry — I couldn't reach the assistant just then. Try again, or contact the team at codeml862@gmail.com or +91 70932 21536.";

/** Turns sent as history. Enough for follow-ups, short enough to stay cheap. */
const HISTORY_TURNS = 10;

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, from: "bot", text: GREETING },
  ]);

  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const abort = useRef<AbortController | null>(null);

  // Keep the newest message in view. `scrollTop` rather than scrollIntoView,
  // which would also scroll the PAGE to bring the panel into view.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  // Escape closes, and opening hands focus to the input — a panel that opens
  // without focus means a keyboard user has to tab back through the page.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // An in-flight request must not keep streaming into a thread that has been
  // reset, or into an unmounted component.
  useEffect(() => () => abort.current?.abort(), []);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || thinking) return;

    // Take the history BEFORE appending, then append — `messages` is stale
    // inside this closure the moment we call setState.
    const history = messages
      .filter((m) => m.id !== 0) // the greeting is ours, not part of the conversation
      .slice(-HISTORY_TURNS)
      .map((m) => ({ role: m.from === "user" ? ("user" as const) : ("assistant" as const), content: m.text }));

    setMessages((prev) => [...prev, { id: nextId.current++, from: "user", text }]);
    setDraft("");
    setThinking(true);

    const controller = new AbortController();
    abort.current = controller;

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ messages: [...history, { role: "user", content: text }] }),
      });

      if (!res.ok || !res.body) {
        const { error } = await res.json().catch(() => ({ error: null }));
        throw new Error(error || "Request failed");
      }

      // Open an empty bubble and stream into it, so the reader watches the
      // answer arrive rather than waiting on a spinner for the whole response.
      const replyId = nextId.current++;
      setThinking(false);
      setMessages((prev) => [...prev, { id: replyId, from: "bot", text: "", pending: true }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === replyId ? { ...m, text: m.text + chunk } : m))
        );
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === replyId
            ? { ...m, pending: false, text: m.text.trim() || ERROR_TEXT }
            : m
        )
      );
    } catch (err) {
      // An abort is the user resetting or leaving — not a failure to report.
      if (controller.signal.aborted) return;
      console.error("[assistant]", err);
      setMessages((prev) => [...prev, { id: nextId.current++, from: "bot", text: ERROR_TEXT }]);
    } finally {
      if (!controller.signal.aborted) setThinking(false);
      if (abort.current === controller) abort.current = null;
    }
  }

  function reset() {
    abort.current?.abort();
    abort.current = null;
    setThinking(false);
    setDraft("");
    nextId.current = 1;
    setMessages([{ id: 0, from: "bot", text: GREETING }]);
  }

  // Suggestions are only worth the room before the reader has asked anything.
  const showSuggestions = messages.length === 1 && !thinking;

  return (
    <>
      {/* ── Panel ── */}
      {open && (
        <div
          role="dialog"
          aria-label="Prinsta assistant"
          /* Height is what kept this from fitting a phone. At `100vh - 8rem`
             sitting `bottom-24`, the top edge resolved to ~2rem — underneath the
             floating navbar, which is what the panel was covering.
             On a phone it stays deliberately short: 430px, and never taller than
             the screen less 15rem, which keeps the nav well clear above and the
             launcher clear below. `dvh` rather than `vh` so a mobile browser's
             collapsing address bar can't make it taller than the screen it is
             measured against. From sm up it returns to the roomier
             right-anchored floating card. */
          className="fixed inset-x-3 bottom-24 z-50 flex h-[min(430px,calc(100dvh-15rem))] flex-col overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-2xl shadow-rose-900/10 sm:inset-x-auto sm:right-6 sm:h-[min(560px,calc(100dvh-12rem))] sm:w-[380px]"
        >
          {/* Header. Light, on the same blush the rest of the site uses for its
              soft surfaces — the panel used to open on a near-black bar, which
              was the only dark element on any public page. */}
          <div className="flex items-center gap-3 border-b border-rose-100 bg-rose-50/70 px-4 py-3.5">
            <BotAvatar className="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black leading-tight text-slate-900">Prinsta Assistant</p>
              <p className="text-[11px] text-slate-500">Ask anything about Prinsta</p>
            </div>
            <button
              type="button"
              onClick={reset}
              aria-label="Start over"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-rose-600"
            >
              <LuRotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-rose-600"
            >
              <LuX className="h-4 w-4" />
            </button>
          </div>

          {/* Thread */}
          <div
            ref={threadRef}
            /* `overscroll-contain` keeps a flick at the end of the thread from
               scrolling the landing page behind the panel. */
            className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-white px-4 py-4"
            aria-live="polite"
          >
            {messages.map((m) =>
              m.from === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[80%] rounded-2xl rounded-br-md bg-rose-500 px-3.5 py-2.5 text-[13px] font-medium leading-snug text-white shadow-sm shadow-rose-500/20">
                    {m.text}
                  </p>
                </div>
              ) : (
                <div key={m.id} className="flex items-end gap-2">
                  <BotAvatar className="h-7 w-7" />
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-slate-50 px-3.5 py-2.5">
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
                      {m.text}
                      {/* Caret while tokens are still arriving — without it a
                          slow first token looks like an empty bubble. */}
                      {m.pending && (
                        <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-rose-400 align-text-bottom" />
                      )}
                    </p>
                  </div>
                </div>
              )
            )}

            {thinking && (
              <div className="flex items-end gap-2">
                <BotAvatar className="h-7 w-7" />
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-slate-50 px-3.5 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-300"
                      style={{ animationDelay: `${i * 180}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {showSuggestions && (
              <div className="pt-1">
                <p className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <LuSparkles className="h-3 w-3" />
                  Try asking
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      className="rounded-full border border-rose-200 bg-rose-50/60 px-3 py-1.5 text-[12px] font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(draft);
            }}
            className="flex items-center gap-2 border-t border-rose-100 bg-white px-3 py-3"
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about Prinsta…"
              aria-label="Ask the Prinsta assistant"
              /* 16px on phones on purpose: iOS Safari zooms the page in on any
                 focused input smaller than that, which shoves the panel and the
                 rest of the page out of position. Back to 13px from sm up. */
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[16px] text-slate-800 placeholder:text-slate-400 focus:border-rose-400 focus:bg-white focus:outline-none sm:text-[13px]"
            />
            <button
              type="submit"
              disabled={!draft.trim() || thinking}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              <LuSend className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* ── Launcher ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close assistant" : "Open the Prinsta assistant"}
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white shadow-xl shadow-rose-500/30 transition-all hover:bg-rose-600 active:scale-95 sm:right-6"
      >
        {open ? <LuX className="h-6 w-6" /> : <LuMessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}

/**
 * The assistant's face — the app icon, not a generic glyph.
 *
 * `object-contain` on a white disc rather than `object-cover`: the adaptive
 * icon carries its own padding, and cropping it to a circle would clip the
 * mark. Decorative, so it takes an empty alt — every place it appears is
 * already labelled by the text beside it.
 */
function BotAvatar({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-rose-100 bg-white ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/adaptive-icon.png" alt="" aria-hidden className="h-full w-full object-contain" />
    </span>
  );
}
