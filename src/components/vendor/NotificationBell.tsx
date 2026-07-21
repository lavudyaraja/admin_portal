"use client";

// Notification bell for the vendor console header.
//
// Vendors are ordinary user accounts to the backend, so the same
// /notifications endpoints the mobile app uses work here unchanged. This is the
// surface that makes a new-complaint alert actually reach the shop — the row is
// written when a customer files an issue against one of their printers.
import { useCallback, useEffect, useRef, useState } from "react";
import { LuBell } from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  orderId: string | null;
  createdAt: string;
}

/** Poll the unread count on this cadence so a fresh complaint shows up promptly. */
const POLL_MS = 30_000;

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const loadCount = useCallback(async () => {
    try {
      const res = await apiFetch<{ count: number }>("/notifications/unread-count");
      setUnread(res.count || 0);
    } catch {
      /* offline or unauthenticated — leave the badge as-is */
    }
  }, []);

  // Poll the badge; the list is only fetched when the panel is opened.
  useEffect(() => {
    loadCount();
    const t = setInterval(loadCount, POLL_MS);
    return () => clearInterval(t);
  }, [loadCount]);

  // Close on an outside click.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next) return;

    setLoading(true);
    try {
      const res = await apiFetch<{ notifications: Notification[] }>("/notifications");
      setItems(res.notifications || []);
      // Opening the panel is the read receipt — clear the badge once the list is
      // actually shown, not before.
      if (unread > 0) {
        await apiFetch("/notifications/read-all", { method: "POST" }).catch(() => {});
        setUnread(0);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
        title="Notifications"
        aria-label="Notifications"
      >
        <LuBell size={19} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-900">Notifications</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">You&apos;re all caught up.</p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {items.map((n) => (
                  <li key={n.id} className={`px-4 py-3 ${n.read ? "" : "bg-rose-50/40"}`}>
                    <div className="flex items-start gap-2.5">
                      {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-slate-800">{n.title}</p>
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{n.body}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
